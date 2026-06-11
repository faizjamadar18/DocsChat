from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# CORS — allow frontend origins (hardcoded for reliability)
_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://docschats.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
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
    return {"status": "healthy", "service": "docschat-api", "cors_origins": _cors_origins}
