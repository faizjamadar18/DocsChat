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
    Batches in 50s with one retry so large PDFs don't time out on free tier.
    Returns list of embedding vectors.
    """
    import time
    out: list[list[float]] = []
    batch_size = 50
    for start in range(0, len(texts), batch_size):
        batch = texts[start:start + batch_size]
        last_err: Exception | None = None
        for attempt in range(2):
            try:
                out.extend(_embeddings.embed_documents(batch))
                last_err = None
                break
            except Exception as e:
                last_err = e
                time.sleep(2 * (attempt + 1))
        if last_err is not None:
            raise last_err
    return out


def generate_single_embedding(text: str) -> list[float]:
    """
    Generate embedding for a single text string via Google's embedding API.
    Returns a single embedding vector.
    """
    return _embeddings.embed_query(text)
