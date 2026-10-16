from contextlib import asynccontextmanager
import asyncio
import os
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.database import init_db, close_db
from app.routes import auth, sources, chat, workspaces, documents, voice, connectors
from app.routes import mcp as mcp_route
from app.routes import mcp_keys as mcp_keys_route
from app.routes import mcp_oauth as mcp_oauth_route


async def catch_unhandled_exceptions(request: Request, call_next):
    """Catch any unhandled exception and return a readable JSON response."""
    try:
        return await call_next(request)
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"error": str(exc), "type": type(exc).__name__},
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events.

    Liveness-first: answer /health instantly while the heavier MongoDB
    connect + migrations + index build runs in the background. This keeps
    Render free-tier cold starts short — the instance accepts traffic as
    soon as Python imports finish instead of after the DB work.
    """
    # Startup (non-blocking)
    async def _init_db_background():
        try:
            await init_db()
            print("Quello API is ready")
        except Exception as e:
            print(f"FATAL: Database initialization failed: {e}")

    try:
        asyncio.get_running_loop().create_task(_init_db_background())
        print("Quello API starting (db init in background)...")
    except RuntimeError:
        # No running loop (e.g. plain TestClient without lifespan) — skip.
        pass
    yield
    # Shutdown
    await close_db()


fastapi_app = FastAPI(
    title="Quello API",
    description="A multi-workspace RAG workspace API powered by Groq Llama 3.3 70B",
    version="2.0.0",
    lifespan=lifespan,
)

fastapi_app.middleware("http")(catch_unhandled_exceptions)


# CORS origins used by health endpoint and middleware.
# Defaults cover local dev + production. Extra origins can be added via
# the CORS_ORIGINS env var (comma-separated) without a code change.
_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://docschats.vercel.app",
    "https://quello.dev",
    "https://www.quello.dev",
]

_env_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

# Dedupe while preserving order: env origins first, then defaults.
_cors_origins = list(dict.fromkeys(_env_origins + _default_origins))

# Register all routes on the FastAPI instance before wrapping
fastapi_app.include_router(auth.router)
fastapi_app.include_router(workspaces.router)
fastapi_app.include_router(sources.router)
fastapi_app.include_router(documents.router)
fastapi_app.include_router(chat.router)
fastapi_app.include_router(voice.router)
fastapi_app.include_router(connectors.router)
fastapi_app.include_router(mcp_keys_route.router)
fastapi_app.include_router(mcp_oauth_route.router)
fastapi_app.include_router(mcp_route.router)


@fastapi_app.get("/health")
async def health_check():
    """Liveness probe — instant, never waits for the database.

    Returns db_ready so callers can tell "server awake" apart from
    "database ready". Keep-alive / warmup pings should hit this.
    """
    try:
        import app.database as database

        try:
            database.check_db()
            db_ready = True
        except Exception:
            db_ready = False
    except Exception:
        db_ready = False
    return {
        "status": "healthy",
        "service": "docschat-api",
        "db_ready": db_ready,
        "cors_origins": _cors_origins,
    }


@fastapi_app.get("/api/health")
async def api_health_check():
    """Same liveness probe under /api/* for frontend warmup via proxy."""
    return await health_check()


@fastapi_app.get("/health/db")
async def db_health():
    """Check database connectivity."""
    try:
        import app.database as database
        database.check_db()
        return {"status": "connected"}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}


fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app = fastapi_app

