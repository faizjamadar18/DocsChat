import google.generativeai as genai
from app.config import get_settings

settings = get_settings()

genai.configure(api_key=settings.GEMINI_API_KEY)


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text strings via Google's embedding API.
    Returns list of embedding vectors.
    """
    result = genai.embed_content(
        model=settings.GOOGLE_EMBEDDING_MODEL,
        content=texts,
    )
    return result['embedding']


def generate_single_embedding(text: str) -> list[float]:
    """
    Generate embedding for a single text string via Google's embedding API.
    Returns a single embedding vector.
    """
    result = genai.embed_content(
        model=settings.GOOGLE_EMBEDDING_MODEL,
        content=text,
    )
    return result['embedding']
