from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, close_db
from app.config import get_settings
from app.routes import auth, sources, chat

settings = get_settings()

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

# CORS — allow frontend origins from env (comma-separated)
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router)
app.include_router(sources.router)
app.include_router(chat.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "notebooklm-api"}
