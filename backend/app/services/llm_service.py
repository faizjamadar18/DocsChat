from langchain_groq import ChatGroq
from app.config import get_settings
from typing import AsyncGenerator

settings = get_settings()


def get_llm(model: str = "groq"):
    """
    Get Groq Llama 3.3 70B LLM instance.
    Gemini Chat LLM has been retired in favor of Groq Llama 3.3 70B.
    """
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=settings.GROQ_API_KEY,
        temperature=0.1,
        max_tokens=2048,
    )


async def generate_response(prompt: str, model: str = "groq") -> str:
    """Generate a complete response (non-streaming) using Groq."""
    llm = get_llm(model)
    response = await llm.ainvoke(prompt)
    return response.content


async def stream_response(prompt: str, model: str = "groq") -> AsyncGenerator[str, None]:
    """Stream response tokens via async generator for SSE using Groq."""
    llm = get_llm(model)
    async for chunk in llm.astream(prompt):
        if chunk.content:
            yield chunk.content
