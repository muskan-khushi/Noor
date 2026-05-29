from sentence_transformers import SentenceTransformer
import numpy as np
import pickle
import os

MODEL = SentenceTransformer('all-MiniLM-L6-v2')

def embed_chunks(chunks: list) -> np.ndarray:
    return np.array(MODEL.encode(chunks, show_progress_bar=False))

def load_or_compute_syllabus_embeddings(syllabus_key: str, chunks: list) -> np.ndarray:
    cache_path = f'embeddings/{syllabus_key}_embeddings.pkl'
    if os.path.exists(cache_path):
        with open(cache_path, 'rb') as f:
            return pickle.load(f)
    embeddings = embed_chunks(chunks)
    os.makedirs('embeddings', exist_ok=True)
    with open(cache_path, 'wb') as f:
        pickle.dump(embeddings, f)
    return embeddings
