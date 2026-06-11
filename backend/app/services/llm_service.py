from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from app.config import get_settings
from typing import AsyncGenerator

settings = get_settings()


def _get_gemini_llm():
    """Create a Gemini 3.5 Flash LLM instance."""
    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.1,
        max_tokens=2048,
    )


def _get_groq_llm():
    """Create a Groq Llama 3 70B LLM instance."""
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=settings.GROQ_API_KEY,
        temperature=0.1,
        max_tokens=2048,
    )


def get_llm(model: str = "gemini"):
    """Get an LLM instance by model name."""
    if model == "groq":
        return _get_groq_llm()
    return _get_gemini_llm()


async def generate_response(prompt: str, model: str = "gemini") -> str:
    """Generate a complete response (non-streaming)."""
    llm = get_llm(model)
    response = await llm.ainvoke(prompt)
    return response.content


async def stream_response(prompt: str, model: str = "gemini") -> AsyncGenerator[str, None]:
    """Stream response tokens via async generator for SSE."""
    llm = get_llm(model)
    async for chunk in llm.astream(prompt):
        if chunk.content:
            yield chunk.content
