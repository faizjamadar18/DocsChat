"""Ora Voice APIs: per-user Vapi key, cost-saving tool webhook, separate voice logs."""
import json
import re
from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, Field

import app.database as database
from app.database import check_db, DatabaseNotReadyError
from app.middleware.auth_middleware import get_current_user
from app.services import vapi_key_service as key_svc
from app.services import voice_session_service as sess_svc
from app.services.rag_service import retrieve_workspace_knowledge, get_workspace_catalog

router = APIRouter(prefix="/api/voice", tags=["Voice"])

# Cost saver: spoken answers stay short so one question never burns the trial.
VOICE_MAX_CHARS = 900

# Small talk never hits the document search (saves money + time).
GREETINGS = {
    "hi", "hello", "hey", "yo", "thanks", "thank you", "bye",
    "good morning", "good afternoon", "good evening", "how are you",
}

# File-list questions are answered from the workspace catalog (names + counts),
# not from vector chunks — chunks alone can never say "how many files".
INVENTORY_HINTS = (
    "how many", "list", "what files", "what documents", "what assets",
    "do i have", "do you have", "show my", "my files", "my documents",
    "my assets", "name all", "all files",
)


def _is_inventory_question(query: str) -> bool:
    q = (query or "").strip().lower()
    return any(h in q for h in INVENTORY_HINTS)


class SaveKeyRequest(BaseModel):
    public_key: str = Field(..., min_length=1, max_length=500)


class CreateSessionRequest(BaseModel):
    workspace_id: Optional[str] = None


class SaveVoiceLogRequest(BaseModel):
    workspace_id: str = Field(..., min_length=1)
    user_text: str = Field(default="", max_length=2000)
    ora_text: str = Field(default="", max_length=2000)
    duration_seconds: int = Field(default=0, ge=0, le=3600)


def _is_greeting(query: str) -> bool:
    q = (query or "").strip().lower().rstrip("!. ")
    return q in GREETINGS or (len(q) <= 3 and q in {"hi", "hey", "yo"})


def _shorten_for_speech(text: str) -> str:
    """Collapse whitespace and cap length for cheap, fast speech."""
    clean = re.sub(r"\s+", " ", (text or "").strip())
    if len(clean) <= VOICE_MAX_CHARS:
        return clean
    cut = clean[:VOICE_MAX_CHARS]
    # Prefer ending on a sentence so speech does not stop mid-word.
    last_stop = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "))
    if last_stop > VOICE_MAX_CHARS // 2:
        return cut[: last_stop + 1].strip()
    return cut.rsplit(" ", 1)[0].strip() + "..."


def _extract_tool_calls(payload: dict) -> list[dict]:
    msg = (payload or {}).get("message", {}) or {}
    calls = msg.get("toolCallList") or msg.get("toolCalls") or []
    # Some Vapi shapes nest under toolWithToolCallList.
    if not calls and msg.get("toolWithToolCallList"):
        for item in msg["toolWithToolCallList"]:
            tc = (item or {}).get("toolCall")
            if tc:
                calls.append(tc)
    return calls if isinstance(calls, list) else []


def _extract_query(args: Any) -> str:
    if args is None:
        return ""
    if isinstance(args, dict):
        for k in ("query", "question", "q", "input", "text"):
            v = args.get(k)
            if isinstance(v, str) and v.strip():
                return v.strip()
        # Fall back to first non-empty string value.
        for v in args.values():
            if isinstance(v, str) and v.strip():
                return v.strip()
        return ""
    if isinstance(args, str):
        try:
            parsed = json.loads(args)
            return _extract_query(parsed)
        except (json.JSONDecodeError, ValueError):
            return args.strip()
    return str(args).strip()


async def _workspace_owned_by(user_id: str, workspace_id: str) -> bool:
    if not workspace_id or database.workspaces_collection is None:
        return False
    query: dict = {"owner_id": user_id}
    if ObjectId.is_valid(workspace_id):
        query = {"$or": [
            {"_id": ObjectId(workspace_id), "owner_id": user_id},
            {"_id": workspace_id, "owner_id": user_id},
        ]}
    else:
        query["_id"] = workspace_id
    doc = await database.workspaces_collection.find_one(query)
    return doc is not None


@router.get("/key-status")
async def key_status(current_user: dict = Depends(get_current_user)):
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    user = await database.users_collection.find_one({"_id": ObjectId(current_user["id"])})
    enc = (user or {}).get("vapi_public_key_enc")
    if not enc:
        return {"has_key": False, "hint": "", "updated_at": None}
    hint = key_svc.masked_hint(enc, encrypted=True)
    if not hint:
        return {"has_key": False, "hint": "", "updated_at": None}
    return {"has_key": True, "hint": hint, "updated_at": (user or {}).get("vapi_key_updated_at")}


@router.get("/key")
async def get_key(current_user: dict = Depends(get_current_user)):
    """Return the raw public key to its owner only (needed for browser Web SDK).

    Public keys are designed by Vapi to live in browser code; we still serve
    them only over HTTPS to the logged-in owner, never log them, and advise
    Allowed-Origin locks in Settings.
    """
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    user = await database.users_collection.find_one({"_id": ObjectId(current_user["id"])})
    enc = (user or {}).get("vapi_public_key_enc")
    if not enc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Vapi key saved")
    try:
        return {"public_key": key_svc.decrypt_key(enc)}
    except ValueError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Saved key is unreadable")


@router.put("/key")
async def save_key(request: SaveKeyRequest, current_user: dict = Depends(get_current_user)):
    raw = (request.public_key or "").strip()
    if raw.lower().startswith(("sk_", "sk-")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That looks like a private key. Paste only the Public key (starts with pk_).",
        )
    if not key_svc.validate_public_key(raw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That key does not look like a Vapi public key. It should start with pk_.",
        )
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    enc = key_svc.encrypt_key(raw)
    now = datetime.now(timezone.utc)
    await database.users_collection.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"vapi_public_key_enc": enc, "vapi_key_updated_at": now}},
    )
    return {"has_key": True, "hint": key_svc.masked_hint(raw), "updated_at": now}


@router.delete("/key")
async def delete_key(current_user: dict = Depends(get_current_user)):
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    await database.users_collection.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$unset": {"vapi_public_key_enc": "", "vapi_key_updated_at": ""}},
    )
    return {"has_key": False}


@router.post("/session")
async def create_session(
    request: CreateSessionRequest,
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """Mint a 10-minute token the browser embeds in the Vapi tool server URL."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    target_ws = request.workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    if not target_ws:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="workspace_id is required")
    if not await _workspace_owned_by(current_user["id"], target_ws):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    token = sess_svc.create_session_token(current_user["id"], target_ws)
    return {"token": token, "workspace_id": target_ws, "expires_in_seconds": 600}


@router.post("/bootstrap")
async def bootstrap(
    request: CreateSessionRequest,
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    """One-call voice starter: key status + raw public key + tool session token.

    The browser calls this once per tap (or warmed up in the background), so a
    voice start costs a single backend round trip instead of three. Everything
    here happens before the Vapi call connects, so it never touches Vapi billing.
    """
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    target_ws = request.workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    if not target_ws:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="workspace_id is required")
    if not await _workspace_owned_by(current_user["id"], target_ws):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    user = await database.users_collection.find_one({"_id": ObjectId(current_user["id"])})
    enc = (user or {}).get("vapi_public_key_enc")
    if not enc:
        return {"has_key": False, "workspace_id": target_ws}
    try:
        raw = key_svc.decrypt_key(enc)
    except ValueError:
        return {"has_key": False, "workspace_id": target_ws}
    token = sess_svc.create_session_token(current_user["id"], target_ws)
    return {
        "has_key": True,
        "hint": key_svc.masked_hint(raw),
        "public_key": raw,
        "token": token,
        "workspace_id": target_ws,
        "expires_in_seconds": 600,
    }


@router.post("/tool-call")
async def tool_call(request: dict | None = None, token: Optional[str] = Query(None)):
    """Vapi server webhook. Always answers HTTP 200 (per Vapi docs).

    Auth comes from the short-lived session token in ?token=, NOT from login
    headers (Vapi servers cannot send user JWTs). Missing/bad token -> error
    result, never document text.
    """
    payload = request or {}
    session = sess_svc.verify_session_token(token)
    calls = _extract_tool_calls(payload)
    if not calls:
        return {"results": []}
    if not session:
        return {"results": [
            {"toolCallId": (c or {}).get("id", "unknown"),
             "error": "Voice session expired. Please tap Ora again."}
            for c in calls
        ]}

    user_id = session["user_id"]
    workspace_id = session["workspace_id"]
    results: list[dict] = []
    for call in calls:
        call_id = (call or {}).get("id", "unknown")
        fn = ((call or {}).get("function")) or {}
        name = fn.get("name", "")
        query = _extract_query(fn.get("arguments"))
        if name and name != "search_workspace_knowledge":
            results.append({"toolCallId": call_id, "error": f"Unknown tool {name}."})
            continue
        if not query:
            results.append({"toolCallId": call_id, "error": "I didn't catch that. Could you say it again?"})
            continue
        if _is_greeting(query):
            results.append({"toolCallId": call_id,
                            "result": "Hey! I'm Ora. Ask me about your documents and I'll keep it short."})
            continue
        try:
            catalog_summary, doc_count, asset_count = await get_workspace_catalog(
                user_id, workspace_id,
            )
        except Exception:
            catalog_summary, doc_count, asset_count = "", 0, 0
        # File-list questions come straight from the catalog (counts + names).
        if _is_inventory_question(query):
            if doc_count == 0 and asset_count == 0:
                results.append({"toolCallId": call_id,
                                "result": "This workspace is empty right now. Upload a PDF or write in Studio first."})
            else:
                results.append({"toolCallId": call_id, "result": _shorten_for_speech(
                    f"You have {doc_count} Studio documents and {asset_count} uploaded assets. "
                    f"{catalog_summary} Ask me about any of them."
                )})
            print(f"[VOICE] inventory q={query!r} docs={doc_count} assets={asset_count} ws={workspace_id}")
            continue
        try:
            context, _citations = await retrieve_workspace_knowledge(
                user_id=user_id, workspace_id=workspace_id, query=query, top_k=5,
            )
        except Exception:
            results.append({"toolCallId": call_id,
                            "error": "My notes are unavailable right now. Please try again in a moment."})
            continue
        print(f"[VOICE] q={query!r} hits={1 if context else 0} docs={doc_count} assets={asset_count} ws={workspace_id}")
        if not context:
            # Files exist but nothing matched: say so instead of claiming empty.
            if doc_count or asset_count:
                results.append({"toolCallId": call_id, "result": _shorten_for_speech(
                    f"Nothing in your files matched that exact question, but you do have "
                    f"{doc_count} documents and {asset_count} assets. {catalog_summary} "
                    f"Try asking about one of them by name."
                )})
            else:
                results.append({"toolCallId": call_id,
                                "result": "I didn't find that in your files. Upload it first, then ask again."})
            continue
        combined = f"Workspace files: {catalog_summary}\n\nRelevant text: {context}"
        results.append({"toolCallId": call_id, "result": _shorten_for_speech(combined)})
    return {"results": results}


@router.post("/logs")
async def save_voice_log(request: SaveVoiceLogRequest, current_user: dict = Depends(get_current_user)):
    """Save a finished voice exchange to the separate voice diary."""
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    if not await _workspace_owned_by(current_user["id"], request.workspace_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    if database.voice_logs_collection is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    now = datetime.now(timezone.utc)
    title = (request.user_text or "").strip().split("\n")[0][:60] or "Voice chat"
    doc = {
        "user_id": current_user["id"],
        "workspace_id": request.workspace_id,
        "channel": "voice",
        "title": title,
        "user_text": (request.user_text or "")[:2000],
        "ora_text": (request.ora_text or "")[:2000],
        "duration_seconds": request.duration_seconds,
        "created_at": now,
        "updated_at": now,
    }
    res = await database.voice_logs_collection.insert_one(doc)
    return {"id": str(res.inserted_id), "title": title, "created_at": now}


@router.get("/logs")
async def list_voice_logs(
    workspace_id: Optional[str] = None,
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: dict = Depends(get_current_user),
):
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    target_ws = workspace_id or x_workspace_id or current_user.get("active_workspace_id")
    if database.voice_logs_collection is None:
        return {"logs": [], "total": 0}
    filt: dict = {"user_id": current_user["id"]}
    if target_ws:
        filt["workspace_id"] = target_ws
    cursor = database.voice_logs_collection.find(filt).sort("created_at", -1).limit(50)
    logs = []
    async for doc in cursor:
        logs.append({
            "id": str(doc["_id"]),
            "workspace_id": doc.get("workspace_id", ""),
            "title": doc.get("title", "Voice chat"),
            "user_text": doc.get("user_text", ""),
            "ora_text": doc.get("ora_text", ""),
            "duration_seconds": doc.get("duration_seconds", 0),
            "created_at": doc.get("created_at"),
        })
    return {"logs": logs, "total": len(logs)}


@router.delete("/logs/{log_id}")
async def delete_voice_log(log_id: str, current_user: dict = Depends(get_current_user)):
    try:
        check_db()
    except DatabaseNotReadyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not ready")
    if not ObjectId.is_valid(log_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid log ID")
    assert database.voice_logs_collection is not None
    res = await database.voice_logs_collection.delete_one({"_id": ObjectId(log_id), "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Voice log not found")
    return {"message": "Voice log deleted", "id": log_id}
