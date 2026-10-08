from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.database import init_db, close_db
from app.routes import auth, sources, chat, workspaces, documents, voice, connectors


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
    """Startup and shutdown events."""
    # Startup
    try:
        await init_db()
        print("DocsChat API is ready")
    except Exception as e:
        print(f"FATAL: Database initialization failed: {e}")
    yield
    # Shutdown
    await close_db()


fastapi_app = FastAPI(
    title="DocsChat API",
    description="A multi-workspace RAG workspace API powered by Groq Llama 3.3 70B",
    version="2.0.0",
    lifespan=lifespan,
)

fastapi_app.middleware("http")(catch_unhandled_exceptions)


# CORS origins used by health endpoint and middleware
_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://docschats.vercel.app",
]

# Register all routes on the FastAPI instance before wrapping
fastapi_app.include_router(auth.router)
fastapi_app.include_router(workspaces.router)
fastapi_app.include_router(sources.router)
fastapi_app.include_router(documents.router)
fastapi_app.include_router(chat.router)
fastapi_app.include_router(voice.router)
fastapi_app.include_router(connectors.router)


@fastapi_app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "docschat-api", "cors_origins": _cors_origins}


@fastapi_app.get("/health/db")
async def db_health():
    """Check database connectivity."""
    try:
        import app.database as database
        database.check_db()
        return {"status": "connected"}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}


# Backwards-compatible alias: existing code/tests import `app`.
app = fastapi_app

app = CORSMiddleware(
    fastapi_app,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
