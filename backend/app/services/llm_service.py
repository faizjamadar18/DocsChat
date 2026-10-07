import logging
from langchain_groq import ChatGroq
from app.config import get_settings
from typing import AsyncGenerator

logger = logging.getLogger(__name__)
settings = get_settings()

CANDIDATE_GROQ_MODELS = [
    getattr(settings, "GROQ_MODEL", "qwen/qwen3.8-27b"),
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
]


def _get_unique_candidates() -> list[str]:
    seen = set()
    result = []
    for m in CANDIDATE_GROQ_MODELS:
        if m and m not in seen:
            seen.add(m)
            result.append(m)
    return result


def get_llm(model: str = "groq", model_name: str | None = None):
    """
    Get Groq LLM instance.
    Uses model_name if provided, otherwise the configured GROQ_MODEL.
    """
    chosen_model = model_name or getattr(settings, "GROQ_MODEL", "qwen/qwen3.8-27b")
    return ChatGroq(
        model=chosen_model,
        groq_api_key=settings.GROQ_API_KEY,
        temperature=0.1,
        max_tokens=2048,
    )


async def generate_response(prompt: str, model: str = "groq") -> str:
    """Generate a complete response using Groq with candidate fallback."""
    candidates = _get_unique_candidates()
    last_error = None

    for candidate in candidates:
        try:
            llm = get_llm(model, model_name=candidate)
            response = await llm.ainvoke(prompt)
            return str(response.content)
        except Exception as e:
            err_str = str(e).lower()
            if "model_not_found" in err_str or "not exist" in err_str:
                logger.warning(
                    "Groq model %s not available (%s), trying fallback...",
                    candidate, e
                )
                last_error = e
                continue
            raise e

    if last_error:
        raise last_error
    return ""


async def stream_response(prompt: str, model: str = "groq") -> AsyncGenerator[str, None]:
    """Stream response tokens via async generator for SSE with candidate fallback."""
    candidates = _get_unique_candidates()
    last_error = None

    for candidate in candidates:
        try:
            llm = get_llm(model, model_name=candidate)
            has_yielded = False
            async for chunk in llm.astream(prompt):
                if chunk.content:
                    has_yielded = True
                    yield str(chunk.content)
            if has_yielded:
                return
        except Exception as e:
            err_str = str(e).lower()
            if "model_not_found" in err_str or "not exist" in err_str:
                logger.warning(
                    "Groq model %s not available (%s), trying fallback...",
                    candidate, e
                )
                last_error = e
                continue
            raise e

    if last_error:
        raise last_error
