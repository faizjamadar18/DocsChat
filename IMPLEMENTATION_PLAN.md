# Ora Workspace Evolution — Implementation Plan

> **Source of Truth**: 
> 1. **Visual Reference Images**: The screenshots in `/docs/design-reference/` are the **absolute source of truth** for UI layout, micro-interactions, components, typography, colors, and behavior. All implementations must replicate these images verbatim.
> 2. **AI Workflow Standards**: All agents must strictly follow instructions in `.agents/skills/` (`add-feature`, `write-tests`, `review-changes`) and `AGENTS.md`. Never ask the user to manually test; autonomously verify every change.

---

## 1. Executive Summary & Feasibility Assessment

### 1.1 Feasibility Assessment: Evolve vs. Rewrite from Scratch
**Verdict: Evolve the current codebase. Do NOT start from scratch.**
- **Why**: The existing repository already contains rock-solid, production-tested foundations:
  - **FastAPI Backend**: Async MongoDB with Motor ([database.py](file:///c:/Users/faizj/OneDrive/Desktop/Projects/Docschat/backend/app/database.py)), JWT auth middleware ([auth_middleware.py](file:///c:/Users/faizj/OneDrive/Desktop/Projects/Docschat/backend/app/middleware/auth_middleware.py)), and clean routing.
  - **Google OAuth**: Verified Google ID token validation ([auth.py](file:///c:/Users/faizj/OneDrive/Desktop/Projects/Docschat/backend/app/routes/auth.py)) and user creation.
  - **Qdrant Vector Database**: Already integrated in [vector_store.py](file:///c:/Users/faizj/OneDrive/Desktop/Projects/Docschat/backend/app/services/vector_store.py) using the shared collection `docschat_shared_collection_v2` with 3072-dimension vectors, payload filters, and cosine similarity.
  - **PDF Chunking & RAG Pipeline**: Working `PyPDFLoader` + `RecursiveCharacterTextSplitter`, background task ingestion, and citation matching in [rag_service.py](file:///c:/Users/faizj/OneDrive/Desktop/Projects/Docschat/backend/app/services/rag_service.py).
  - **Groq Llama 3.3 70B Streaming**: Already working via SSE in [chat.py](file:///c:/Users/faizj/OneDrive/Desktop/Projects/Docschat/backend/app/routes/chat.py).
  - **Frontend Core**: Next.js 16 (App Router), React 19, and Tailwind CSS v4 are already configured and running.
- **Rewriting from scratch** would needlessly discard working database connections, vector schemas, OAuth credentials, and deployment setups (`render.yaml`).
- **Evolutionary path** preserves stability, minimizes regressions, and allows testing each phase autonomously.

### 1.2 Model & Provider Audit
| Component | Current Implementation | Planned State | Rationale |
|-----------|------------------------|---------------|-----------|
| **Chat / Text Agent** | Gemini 2.5 Flash + Groq Llama 3.3 70B (switchable) | **Groq Llama 3.3 70B only** | User requirement: Remove Gemini from chat, remove model selector UI, eliminate dead code. Server-side key only. |
| **Embeddings** | `models/gemini-embedding-2` (via `GEMINI_API_KEY`, 3072 dims) | **Keep Gemini Embeddings (Recommended)** | Generous free tier, 3072-dim embeddings already indexed in Qdrant. Replacing with local embeddings (e.g. HuggingFace) would crash Render free tier (512MB RAM); replacing with OpenAI/Voyage adds subscription cost and requires re-indexing all existing vectors. |
| **Voice Agent** | None | **Vapi Web SDK (`@vapi-ai/web`) + Backend Tool Calling** | Browser voice session with floating notch; queries shared backend RAG tool to prevent logic duplication. Pure voice — **no `@` mentions in voice**. |
| **Model Selector** | `ModelSwitcher.tsx` dropdown in chat bar & messages | **Remove entirely** | Replaced with clean Ora branding badge; no switcher clutter. |

---

## 2. Multi-Workspace Architecture & Data Model

The data model and backend architecture are built **natively multi-workspace capable from day one**. While the initial UI displays the user's active workspace (e.g. "Shreyas HQ"), a user can own multiple workspaces in MongoDB. Scaling to multiple workspaces later requires **zero database migrations or schema rewrites**.

```
+-----------------------------------------------------------------------------------+
|                                MONGODB DATA MODEL                                 |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [users]                                                                          |
|  - _id: ObjectId                                                                  |
|  - email: str (unique)                                                            |
|  - username: str                                                                  |
|  - picture: Optional[str]                                                         |
|  - active_workspace_id: ObjectId  ----------------------------+                   |
|  - created_at: datetime                                       |                   |
|                                                               v                   |
|  [workspaces]                                          [workspaces]               |
|  - _id: ObjectId                                       - _id: ObjectId            |
|  - owner_id: ObjectId (user_id)                        - owner_id: ObjectId       |
|  - name: str ("Shreyas HQ")                            - name: str ("Project X")  |
|  - slug: str ("shreyashq")                             - slug: str ("project-x")  |
|  - logo_url: Optional[str]                             - logo_url: Optional[str]  |
|  - description: Optional[str]                          - description: str         |
|  - created_at: datetime                                - created_at: datetime     |
|          |                                                    |                   |
|          +--------------------------+                         |                   |
|                                     |                         |                   |
|                                     v                         v                   |
|               +--------------------------------------------------+                |
|               |              WORKSPACE-SCOPED RESOURCES          |                |
|               |  - documents (Studio rich-text pages)            |                |
|               |  - sources (Uploaded PDF assets)                 |                |
|               |  - chat_threads & messages (Ora chat & voice)    |                |
|               |  - qdrant points (Filtered by workspace_id)      |                |
|               +--------------------------------------------------+                |
+-----------------------------------------------------------------------------------+
```

### 2.1 Pydantic Models & MongoDB Collections

```python
# backend/app/models/workspace.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    logo_url: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = Field(None, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = None
    logo_url: Optional[str] = None

class WorkspaceResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
```

### 2.2 Shared Ownership & Authorization Dependency
Every workspace-scoped route verifies that the current user owns or has access to the workspace:

```python
# backend/app/middleware/workspace_middleware.py
from fastapi import Depends, HTTPException, status
from bson import ObjectId
import app.database as database
from app.middleware.auth_middleware import get_current_user

async def get_current_workspace(
    workspace_id: str,
    current_user: dict = Depends(get_current_user),
) -> dict:
    if not ObjectId.is_valid(workspace_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID")
    
    workspace = await database.workspaces_collection.find_one({
        "_id": ObjectId(workspace_id),
        "owner_id": current_user["id"],
    })
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    return {
        "id": str(workspace["_id"]),
        "owner_id": str(workspace["owner_id"]),
        "name": workspace["name"],
        "slug": workspace["slug"],
        "logo_url": workspace.get("logo_url"),
        "description": workspace.get("description"),
    }
```

### 2.3 Auto-Provisioning & Migration for Existing Users
- **New Users**: On Google OAuth sign-in ([auth.py](file:///c:/Users/faizj/OneDrive/Desktop/Projects/Docschat/backend/app/routes/auth.py)), if the user has no workspaces, create a default workspace:
  - `name = f"{user.username or 'My'} HQ"`
  - `slug = slugify(user.username or 'my-workspace')`
  - Update `user["active_workspace_id"] = workspace_id`.
- **Existing Users**: A startup migration hook in [database.py](file:///c:/Users/faizj/OneDrive/Desktop/Projects/Docschat/backend/app/database.py) scans users without workspaces, creates their default workspace, backfills `workspace_id` into all existing `sources`, `messages`, and updates Qdrant vector payloads.
- **Danger Zone ("Delete Workspace")**:
  - Deleting a workspace executes a cascading wipe of its scoped documents, sources, Qdrant vectors, and chat history.
  - If the deleted workspace was the user's active workspace, the backend activates their next existing workspace or provisions a fresh clean workspace, ensuring the user is never left in an unrecoverable state.

---

## 3. Two Agents Architecture & Shared Retrieval

Ora is delivered by two specialized agents with distinct jobs:

```
                            [User Interaction]
                                     |
         +---------------------------+---------------------------+
         |                                                       |
         v                                                       v
   TEXT AGENT (Ora Sidebar)                             VOICE AGENT (Header Notch)
   - Lives in slide-over drawer                         - Pinned floating dark notch
   - Supports text chat & citations                     - Pure voice interaction (NO @)
   - Supports @-mentions (Docs & Assets)                - Vapi Web SDK in React 19
   - Groq Llama 3.3 70B Streaming                       - Server tool call -> Backend RAG
         |                                                       |
         +---------------------------+---------------------------+
                                     |
                                     v
                 UNIFIED RAG RETRIEVAL ENGINE (rag_service.py)
                 - Qdrant Cloud filtered by workspace_id
                 - Optional @ scope_ids filter (source_id IN scope_ids)
                 - Cosine similarity matching (top_k=5)
                 - Unified citations (PDF filename/page & Studio doc title)
                 - Grounded fallback when evidence is lacking
```

### 3.1 Strict Separation of Agent Capabilities
1. **Header Voice Notch (Vapi)**:
   - **Pure voice interaction**. **NO `@` mentions in the header or voice notch.**
   - User clicks the black pill `●● Ora` in the header -> floating dark pill expands at top-center ([06-ora-voice-notch.png](file:///c:/Users/faizj/OneDrive/Desktop/Projects/Docschat/docs/design-reference/06-ora-voice-notch.png)).
   - Persistent across page navigation via React 19 Context (`VoiceAgentContext`).
   - Mic toggle button, animated audio visualizer dots, red hangup button, status label underneath ("Listening...", "Thinking...", "Speaking...").
   - Vapi triggers a backend server tool call `search_workspace_knowledge(query)`.
   - Backend executes `retrieve_workspace_knowledge`, returning extracted facts for Vapi speech synthesis.
2. **Text Agent (Ora Assistant Sidebar)**:
   - **The only place with `@` mentions**.
   - Slide-over drawer on the right ([04-ora-assistant-sidebar.png](file:///c:/Users/faizj/OneDrive/Desktop/Projects/Docschat/docs/design-reference/04-ora-assistant-sidebar.png) & [03-assets.png](file:///c:/Users/faizj/OneDrive/Desktop/Projects/Docschat/docs/design-reference/03-assets.png)).
   - Typing `@` triggers an autocomplete dropdown grouped by `STUDIO DOCUMENTS` and `ASSETS`.
   - Backend queries Qdrant with `source_id IN [selected_ids]`.
   - Groq streams markdown response over SSE with verified citation badges.

### 3.2 Shared RAG Implementation (`rag_service.py`)
```python
# backend/app/services/rag_service.py
from qdrant_client import models
from app.services import vector_store as vs
import app.database as database
from bson import ObjectId

async def retrieve_workspace_knowledge(
    user_id: str,
    workspace_id: str,
    query: str,
    scope_ids: list[str] | None = None,
    top_k: int = 5,
) -> tuple[str | None, list[dict]]:
    """
    Unified retrieval logic shared by both Text Agent and Voice Agent.
    Strictly isolates by user_id and workspace_id.
    Filters by scope_ids if @-mentions were provided (Text Agent only).
    """
    results = await vs.query_workspace_documents(
        user_id=user_id,
        workspace_id=workspace_id,
        query=query,
        scope_ids=scope_ids,
        top_k=top_k,
    )
    if not results:
        return None, []
    
    context = "\n\n---\n\n".join([doc["document"] for doc in results])
    citations = await _resolve_unified_citations(workspace_id, results)
    return context, citations
```

### 3.3 Qdrant Query Filtering (`vector_store.py`)
```python
# backend/app/services/vector_store.py
def query_workspace_documents(
    user_id: str,
    workspace_id: str,
    query: str,
    scope_ids: list[str] | None = None,
    top_k: int = 5,
) -> list[dict]:
    _ensure_collection_exists()
    query_embedding = generate_single_embedding(query)

    must_conditions = [
        models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id)),
        models.FieldCondition(key="workspace_id", match=models.MatchValue(value=workspace_id)),
    ]

    # Apply @-mention scope filter if present
    if scope_ids:
        must_conditions.append(
            models.FieldCondition(
                key="source_id",
                match=models.MatchAny(any=scope_ids),
            )
        )

    search_result = _qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        query_filter=models.Filter(must=must_conditions),
        limit=top_k,
        with_payload=True,
    )

    retrieved = []
    for i, point in enumerate(search_result.points):
        retrieved.append({
            "document": point.payload.get("page_content", ""),
            "metadata": point.payload,
            "similarity_score": point.score,
            "rank": i + 1,
        })
    return retrieved
```

---

## 4. UI/UX Design Ground Truth & Reference Alignment

> **CRITICAL DIRECTIVE**: The images in `/docs/design-reference/` are the **single source of truth** for all visual styles, component structures, layouts, and micro-interactions. Every page and component must strictly replicate the reference images.

```
/docs/design-reference/
├── 01-home-dashboard.png       -> Home page layout, Ask Ora bar, quick chips, recent lists
├── 02-studio-editor.png         -> Studio sub-sidebar, Tiptap canvas, slash command, auto-save
├── 03-assets.png                -> PDF library, table/card items, upload button, Ora drawer open
├── 04-ora-assistant-sidebar.png -> Assistant drawer, empty state, @-mention input
├── 05-settings-general1.png     -> Account tab (profile, security, Vapi public key)
├── 05-settings-general2.png     -> General tab (workspace logo, name, URL slug, danger zone)
└── 06-ora-voice-notch.png       -> Floating top-center dark notch with visualizer & status
```

### 4.1 Color Tokens & Light Theme Design System
- **App Background**: `#FBFBFD` / `#F9F9FB`
- **Panel & Canvas Surface**: `#FFFFFF`
- **Sidebar Surface**: `#F7F7F9`
- **Borders & Dividers**: `#E5E7EB` / `#ECECEE`
- **Primary Text**: `#111827` (Charcoal)
- **Secondary Text**: `#6B7280` (Muted Slate)
- **Active Navigation Pill**: `#EFEAFC` (Light Lavender)
- **Brand Accent**: `#6E56CF` (Purple)
- **Floating Voice Notch**: `#111113` (High-contrast dark pill with white audio visualizer and red hangup button)

---

## 5. Technology Stack Integration & Official Patterns

### 5.1 Vapi Web SDK (`@vapi-ai/web`) — React 19 Pattern
Based on the latest `@vapi-ai/web` documentation:
```tsx
// frontend/src/context/VoiceAgentContext.tsx
'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Vapi from '@vapi-ai/web';

interface VoiceAgentContextType {
  isActive: boolean;
  status: 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';
  isMuted: boolean;
  volumeLevel: number;
  startCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
}

const VoiceAgentContext = createContext<VoiceAgentContextType | null>(null);

export const VoiceAgentProvider: React.FC<{ children: React.ReactNode; publicKey: string }> = ({
  children,
  publicKey,
}) => {
  const vapi = useMemo(() => new Vapi(publicKey), [publicKey]);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [volumeLevel, setVolumeLevel] = useState(0);

  useEffect(() => {
    vapi.on('call-start', () => { setIsActive(true); setStatus('listening'); });
    vapi.on('call-end', () => { setIsActive(false); setStatus('idle'); });
    vapi.on('speech-start', () => setStatus('speaking'));
    vapi.on('speech-end', () => setStatus('listening'));
    vapi.on('volume-level', (vol) => setVolumeLevel(vol));
    vapi.on('error', (err) => { console.error('Vapi Error:', err); setStatus('idle'); });

    return () => { vapi.stop(); };
  }, [vapi]);

  const startCall = (assistantId?: string) => {
    setStatus('connecting');
    vapi.start(assistantId || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!);
  };

  const endCall = () => { vapi.stop(); };
  const toggleMute = () => {
    vapi.setMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  return (
    <VoiceAgentContext.Provider value={{ isActive, status, isMuted, volumeLevel, startCall, endCall, toggleMute }}>
      {children}
    </VoiceAgentContext.Provider>
  );
};
```

### 5.2 Studio Tiptap Editor — React 19 & Smart Debounced Indexing
Based on official `@tiptap/react` documentation:
```tsx
// frontend/src/components/studio/EditorCanvas.tsx
'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';

export function EditorCanvas({
  initialContent,
  onAutoSave,
}: {
  initialContent: any;
  onAutoSave: (json: any, text: string) => void;
}) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing or press '/' for commands...",
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // Debounced auto-save to MongoDB (1.5s)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onAutoSave(editor.getJSON(), editor.getText());
      }, 1500);
    },
  });

  return (
    <div className="max-w-3xl mx-auto py-8">
      <EditorContent editor={editor} className="prose prose-neutral focus:outline-none min-h-125" />
    </div>
  );
}
```

---

## 6. Phased Implementation Roadmap

> **Branching & Delivery Strategy**:
> - All phases are developed cumulatively on **one single unified branch** (`feature/ora-workspace-transformation`).
> - **DO NOT** create a separate branch for each individual phase.
> - Each phase is committed atomically with Conventional Commits indicating the phase (e.g. `feat(phase-2): ...`).
> - `main` remains untouched until all 8 roadmap phases are completed, integrated, and verified end-to-end locally. Only then does the user open the single Pull Request from the unified branch into `main` — agents never open PRs.

Every phase follows the structured `.agents` AI workflow:
1. **Research & Plan**: Re-verify APIs and design reference images.
2. **Implement**: Code changes respecting subagent boundaries.
3. **Verify**: Autonomously test via `pytest` or terminal build checks before marking complete.
4. **Review & Commit**: Run security and quality checks against `review-changes`, then make atomic conventional commits to the unified branch.

### Phase 1: Multi-Workspace Data Model, Auto-Provisioning & Migration
**Goal**: Establish scalable multi-workspace MongoDB models, migration hook, Qdrant payload filters, and clean up Gemini chat code.
- **Tasks**:
  1. Create `backend/app/models/workspace.py` and `backend/app/models/document.py`.
  2. Update `user.py`, `source.py`, and `chat.py` with `workspace_id`.
  3. Implement `get_current_workspace` dependency in `backend/app/middleware/workspace_middleware.py`.
  4. Implement auto-provisioning in `backend/app/routes/auth.py` and migration hook in `database.py`.
  5. Update `vector_store.py` points payload and `query_workspace_documents` with `workspace_id` filtering.
  6. Remove `_get_gemini_llm()` from `llm_service.py` and enforce Groq exclusively in `chat.py`.
- **Autonomous Verification**:
  - Run `pytest backend/tests/test_auth.py` and verify workspace auto-creation.
  - Test vector queries with workspace isolation via test script.

### Phase 2: Light Theme Design System & Persistent Workspace Shell
**Goal**: Overhaul visual styles to light theme and build persistent layout shell matching `01-home-dashboard.png`.
- **Tasks**:
  1. Overhaul `frontend/src/app/globals.css` with light theme palette; remove dark theme classes.
  2. Implement `Sidebar.tsx` with display-only workspace logo & name, nav items (Home, Studio, Assets, Settings) with active lavender pills, expandable "CHATS" section, and user profile footer.
  3. Implement `Header.tsx` with dynamic breadcrumb, `⌘K` search input, black pill `●● Ora` button, and notification bell.
  4. Create `AppLayout.tsx` wrapper with persistent header and sidebar.
- **Autonomous Verification**:
  - Build frontend via `npm run build` to verify zero type or layout errors.
  - Inspect layout visually against `01-home-dashboard.png`.

### Phase 3: Home Dashboard (`/` or `/home`)
**Goal**: Build dashboard matching `01-home-dashboard.png`.
- **Tasks**:
  1. Create `HomeDashboard.tsx` with greeting ("Good Morning, [Name]"), "Ask Ora" input box with `@` chip, and "Start writing" card.
  2. Implement quick prompt action chips (*Improve a draft*, *Research a topic*, *Capture a thought*, *Recap my week*).
  3. Implement Recent Documents and Recent Assets sections with icons, relative timestamps, and links.
  4. Implement `GET /api/workspaces/{id}/dashboard` endpoint returning recent docs and assets.
- **Autonomous Verification**:
  - Verify dashboard loads recent assets and documents from MongoDB.

### Phase 4: Assets (PDF Library)
**Goal**: Build PDF asset manager matching `03-assets.png`.
- **Tasks**:
  1. Implement `AssetsView.tsx` with search bar ("Search assets..."), sort dropdown ("Recent"), "Ora" trigger button, and "+ Upload" black pill button.
  2. PDF asset list/cards showing filename, file size, upload timestamp, and actions.
  3. Drag-and-drop PDF upload modal with size validation (max 20MB).
  4. Scope `backend/app/routes/sources.py` to `workspace_id`.
- **Autonomous Verification**:
  - Upload PDF through API; verify background chunking and Qdrant indexing.
  - Verify asset deletion cascades to Qdrant vectors and disk file.

### Phase 5: Studio (Notion-like Tiptap Document Editor)
**Goal**: Build rich document editor matching `02-studio-editor.png`.
- **Tasks**:
  1. Install `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`.
  2. Build Studio two-column view:
     - Left sub-sidebar: "DOCUMENTS" header with `+` button, search bar, and document list.
     - Canvas: Document title (editable H1), auto-save cloud sync indicator, Ora button, block handle, and slash command dropdown (`/`).
  3. Create `backend/app/routes/documents.py` for document CRUD.
  4. Implement debounced auto-save to MongoDB (1.5s) and content-hash chunk re-indexing to Qdrant (15s idle or blur).
- **Autonomous Verification**:
  - Create and edit documents; verify auto-save persistence.
  - Verify document chunks are stored in Qdrant with `source_type="document"`.

### Phase 6: Ora Text Agent (Assistant Sidebar)
**Goal**: Build slide-over Ora assistant matching `04-ora-assistant-sidebar.png` and `03-assets.png`.
- **Tasks**:
  1. Implement slide-over `OraSidebar.tsx` with Ora logo mark, title, close `X`, and empty state.
  2. Build dynamic `@` mention popup menu grouping `STUDIO DOCUMENTS` and `ASSETS`.
  3. Implement streaming chat bubbles with Groq `llama-3.3-70b-versatile` over SSE.
  4. Interactive citation pills linking to specific PDF pages or Studio documents.
  5. Enforce grounded fallback when confidence/similarity is low.
- **Autonomous Verification**:
  - Test `@` scoped question: confirm Qdrant query filters to specified `source_ids`.
  - Test general question: confirm workspace-wide grounding and true citations.

### Phase 7: Ora Voice Agent (Header & Persistent Floating Notch)
**Goal**: Build Vapi voice agent with persistent notch matching `06-ora-voice-notch.png`.
- **Tasks**:
  1. Install `@vapi-ai/web` and create `VoiceAgentContext.tsx`.
  2. Build `VoiceNotch.tsx`:
     - Pinned floating dark pill (`#111113`) at top-center.
     - Mic mute toggle button.
     - Animated Ora indicator: two white capsule dots pulsing with audio activity.
     - End call button (red phone icon).
     - Subtitle status label underneath ("Listening...", "Thinking...", "Speaking...").
     - **No `@` mentions in voice notch**.
  3. Implement `POST /api/vapi/tool-call` webhook in FastAPI for tool calling `search_workspace_knowledge`.
  4. Save voice transcripts into MongoDB `messages` collection under `channel: "voice"`.
- **Autonomous Verification**:
  - Test tool webhook endpoint with mock Vapi payload; verify accurate context returned.
  - Verify voice notch persists across page navigation without audio interruption.

### Phase 8: Settings (General, Billing, Account)
**Goal**: Build settings tabs matching `05-settings-general1.png` and `05-settings-general2.png`.
- **Tasks**:
  1. Tab 1: `General`:
     - Workspace Logo preview & upload button.
     - Workspace Name input.
     - Workspace URL slug (`plura.in/app/[slug]`).
     - Workspace Description textarea.
     - Danger Zone: "Delete Workspace" with cascading delete.
  2. Tab 2: `Billing`:
     - Clean placeholder plan overview with upgrade buttons.
  3. Tab 3: `Account`:
     - Profile picture upload, Full Name, Email Address.
     - Password change card.
     - Voice Assistant: Public VAPI API Key input (masked with eye toggle, encrypted in backend).
  4. Endpoints: `PUT /api/workspaces/{id}` and `PUT /api/user/profile`.
- **Autonomous Verification**:
  - Update workspace details; verify sidebar updates.
  - Update Vapi key; verify saved and retrievable.

---

## 7. Quality Assurance & Autonomous Verification Strategy

In accordance with `AGENTS.md` and `.agents/skills/write-tests/SKILL.md`:
- **Backend Tests (`pytest`)**:
  - `backend/tests/test_workspace.py`: Workspace CRUD, multi-workspace isolation, cascading delete.
  - `backend/tests/test_documents.py`: Document CRUD, auto-save payload format.
  - `backend/tests/test_rag.py`: Unified RAG retrieval, `@` scope filtering, citation verification.
  - `backend/tests/test_vapi.py`: Webhook tool call handling.
- **Frontend Verification**:
  - TypeScript build passes cleanly (`npm run build`).
  - Strict UI audit against screenshots `01` through `06`.
  - Audio continuity across route changes.
