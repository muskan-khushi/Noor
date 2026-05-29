import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict
from config import settings

def compute_priority(score: float) -> str:
    if score < 0.4: return 'CRITICAL'
    if score < 0.55: return 'HIGH'
    return 'MEDIUM'

def find_gaps(
    state_chunks: List[str],
    state_embeddings: np.ndarray,
    national_chunks: List[str],
    national_embeddings: np.ndarray
) -> List[Dict]:
    if len(state_embeddings) == 0 or len(national_embeddings) == 0:
        return []
    sim_matrix = cosine_similarity(national_embeddings, state_embeddings)
    gaps = []
    for nat_chunk, scores in zip(national_chunks, sim_matrix):
        best_score = float(np.max(scores))
        best_match_idx = int(np.argmax(scores))
        if best_score < settings.GAP_THRESHOLD:
            gaps.append({
                'topic': nat_chunk,
                'similarity_score': round(best_score, 3),
                'closest_state_topic': state_chunks[best_match_idx],
                'priority': compute_priority(best_score),
            })
    gaps.sort(key=lambda x: x['similarity_score'])
    return gaps
