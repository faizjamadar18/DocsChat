from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.config import get_settings

settings = get_settings()

_embeddings = GoogleGenerativeAIEmbeddings(
    model=settings.GOOGLE_EMBEDDING_MODEL,
    google_api_key=settings.GEMINI_API_KEY,
)


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text strings via Google's embedding API.
    Returns list of embedding vectors.
    """
    return _embeddings.embed_documents(texts)


def generate_single_embedding(text: str) -> list[float]:
    """
    Generate embedding for a single text string via Google's embedding API.
    Returns a single embedding vector.
    """
    return _embeddings.embed_query(text)
