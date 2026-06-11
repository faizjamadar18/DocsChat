from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.database import init_db, close_db
from app.routes import auth, sources, chat

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


app = FastAPI(
    title="DocsChat API",
    description="A RAG-powered document Q&A API with Gemini and Groq support",
    version="1.0.0",
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return readable error details."""
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "type": type(exc).__name__},
    )


# CORS origins used by health endpoint and middleware
_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://docschats.vercel.app",
]

# Register all routes on the FastAPI instance before wrapping
app.include_router(auth.router)
app.include_router(sources.router)
app.include_router(chat.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "docschat-api", "cors_origins": _cors_origins}


@app.get("/health/db")
async def db_health():
    """Check database connectivity."""
    try:
        import app.database as database
        database.check_db()
        return {"status": "connected"}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}


# CORS — wrap app at outermost layer so headers appear on ALL responses
# (including error responses like 401 from ServerErrorMiddleware).
# Using direct wrapping (not app.add_middleware) places CORSMiddleware
# outside of FastAPI's internal error middleware stack.
app = CORSMiddleware(
    app,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
