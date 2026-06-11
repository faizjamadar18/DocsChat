from sentence_transformers import SentenceTransformer
from app.config import get_settings
import numpy as np

settings = get_settings()

# Global singleton — loaded once on first import
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    """Lazy-load the embedding model as a singleton."""
    global _model
    if _model is None:
        print(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        print(f"Embedding model loaded - dimensions: {_model.get_sentence_embedding_dimension()}")
    return _model


def generate_embeddings(texts: list[str]) -> np.ndarray:
    """
    Generate embeddings for a list of text strings.
    Returns numpy array of shape (n_texts, embedding_dim).
    """
    model = _get_model()
    embeddings = model.encode(texts, show_progress_bar=False)
    return embeddings


def generate_single_embedding(text: str) -> np.ndarray:
    """
    Generate embedding for a single text string.
    Returns numpy array of shape (embedding_dim,).
    """
    model = _get_model()
    embedding = model.encode(text, show_progress_bar=False)
    return embedding
