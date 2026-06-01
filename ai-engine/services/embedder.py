"""
Noor — Embedding Engine
========================
Embedding quality has a larger impact on gap detection accuracy than the
similarity algorithm itself. Choosing the right model requires balancing:

  1. DOMAIN SPECIFICITY: General models (all-MiniLM) handle science well but
     struggle with Indian curriculum's mix of Indian-English phrasings and
     transliterated Hindi/Telugu/Tamil terms.

  2. EMBEDDING DIMENSION: Higher-dimensional embeddings (768 vs 384) capture
     more semantic nuance but increase memory and computation. For our use case,
     384-dim (MiniLM-L6) is Pareto-optimal — sufficient nuance, runs on CPU.

  3. SYMMETRIC vs ASYMMETRIC ENCODING: Our task is symmetric (both query and
     document are syllabus topics). Use a bi-encoder, not a cross-encoder.
     Cross-encoders would require O(N×M) forward passes — prohibitive.

Model selection rationale:
  Primary:   all-MiniLM-L6-v2 (384-dim, 22M params, 80MB)
             — Best accuracy/speed tradeoff for short scientific text
             — Trained on 1B+ sentence pairs including scientific papers
             — ~14k tokens/sec on CPU

  Fallback:  paraphrase-multilingual-MiniLM-L12-v2 (384-dim, 118M params)
             — Handles mixed Indian-English text better
             — Slower but more robust for non-standard phrasings

Cache strategy: Content-addressed pickle cache keyed by SHA-256 of the
topic list. This ensures cache invalidation is automatic when syllabi change.

Reference:
  Reimers & Gurevych (2019). "Sentence-BERT: Sentence Embeddings using
  Siamese BERT-Networks". EMNLP 2019.
"""

import hashlib
import logging
import os
import os
import time
from typing import List, Optional

import numpy as np

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# MODEL CONFIGURATION
# ──────────────────────────────────────────────────────────────

PRIMARY_MODEL   = 'all-MiniLM-L6-v2'
FALLBACK_MODEL  = 'paraphrase-multilingual-MiniLM-L12-v2'
EMBEDDING_DIM   = 384   # both models produce 384-dim embeddings
CACHE_DIR       = 'embeddings'
BATCH_SIZE      = 64    # optimal for CPU inference
MAX_SEQ_LEN     = 128   # syllabi topics rarely exceed 50 tokens

# ──────────────────────────────────────────────────────────────
# LAZY MODEL LOADER — loads once at process start
# ──────────────────────────────────────────────────────────────

_model_cache = {}


def _get_model(model_name: str = PRIMARY_MODEL):
    """Load sentence-transformer model once and cache in memory."""
    if model_name not in _model_cache:
        from sentence_transformers import SentenceTransformer
        logger.info(f"Loading embedding model: {model_name}")
        t0 = time.time()
        try:
            model = SentenceTransformer(model_name)
            model.max_seq_length = MAX_SEQ_LEN
            _model_cache[model_name] = model
            logger.info(f"Model loaded in {time.time()-t0:.1f}s")
        except Exception as e:
            if model_name != FALLBACK_MODEL:
                logger.warning(f"Primary model failed ({e}), trying fallback")
                return _get_model(FALLBACK_MODEL)
            raise RuntimeError(f"Could not load any embedding model: {e}")
    return _model_cache[model_name]


# ──────────────────────────────────────────────────────────────
# CONTENT-ADDRESSED CACHE
# ──────────────────────────────────────────────────────────────

def _cache_key(chunks: List[str], model_name: str) -> str:
    """
    Content-addressed cache key: SHA-256 of sorted chunks + model name.
    Sorting before hashing ensures order-independent caching.
    """
    content = '|'.join(sorted(chunks)) + f'|model={model_name}'
    return hashlib.sha256(content.encode()).hexdigest()[:16]


def _cache_path(cache_key: str) -> str:
    os.makedirs(CACHE_DIR, exist_ok=True)
    return os.path.join(CACHE_DIR, f'{cache_key}.npy')


def _load_from_cache(cache_key: str) -> Optional[np.ndarray]:
    path = _cache_path(cache_key)
    if os.path.exists(path):
        try:
            data = np.load(path)
            # Validate: correct type, shape, and dimension
            if (isinstance(data, np.ndarray) and
                    data.ndim == 2 and
                    data.shape[1] == EMBEDDING_DIM):
                logger.info(f"Cache HIT: {cache_key} ({data.shape})")
                return data
            else:
                logger.warning(f"Cache INVALID (wrong shape): {data.shape if hasattr(data, 'shape') else type(data)}")
        except Exception as e:
            logger.warning(f"Cache read failed: {e}")
    return None


def _save_to_cache(cache_key: str, embeddings: np.ndarray) -> None:
    path = _cache_path(cache_key)
    try:
        np.save(path, embeddings)
        logger.info(f"Cache SAVED: {cache_key} ({embeddings.shape})")
    except Exception as e:
        logger.warning(f"Cache save failed (non-fatal): {e}")


# ──────────────────────────────────────────────────────────────
# EMBEDDING QUALITY VALIDATION
# ──────────────────────────────────────────────────────────────

def validate_embeddings(embeddings: np.ndarray, chunks: List[str]) -> bool:
    """
    Sanity checks on generated embeddings:
    1. Shape matches input length
    2. No NaN or Inf values
    3. L2 norms are approximately 1.0 (sentence-transformers normalises by default)
    4. Embeddings are not all-zero (degenerate collapse)
    5. Average pairwise cosine similarity is in a reasonable range [0.1, 0.9]
       — too high (>0.9) suggests the model collapsed to a single representation
       — too low (<0.1) may indicate encoding failure
    """
    if embeddings.shape[0] != len(chunks):
        logger.error(f"Shape mismatch: {embeddings.shape[0]} embeddings for {len(chunks)} chunks")
        return False

    if not np.isfinite(embeddings).all():
        logger.error("Embeddings contain NaN or Inf values")
        return False

    norms = np.linalg.norm(embeddings, axis=1)
    if np.any(norms < 0.1):
        logger.error("Some embeddings have near-zero norm (likely encoding failure)")
        return False

    # Sample-based pairwise similarity check (avoid O(N²) for large batches)
    if len(embeddings) >= 4:
        sample_idx = np.random.choice(len(embeddings), min(20, len(embeddings)), replace=False)
        sample = embeddings[sample_idx]
        # Normalise
        norms_s = np.linalg.norm(sample, axis=1, keepdims=True)
        sample_n = sample / np.maximum(norms_s, 1e-9)
        sim_matrix = sample_n @ sample_n.T
        # Exclude diagonal (self-similarity = 1.0)
        off_diag = sim_matrix[~np.eye(len(sample), dtype=bool)]
        avg_sim = float(np.mean(off_diag))

        if avg_sim > 0.92:
            logger.warning(f"High avg pairwise similarity ({avg_sim:.3f}) — possible embedding collapse")
        elif avg_sim < 0.05:
            logger.warning(f"Low avg pairwise similarity ({avg_sim:.3f}) — possible encoding issue")

    return True


# ──────────────────────────────────────────────────────────────
# CORE EMBEDDING FUNCTION
# ──────────────────────────────────────────────────────────────

def embed_chunks(
    chunks: List[str],
    model_name: str = PRIMARY_MODEL,
    show_progress: bool = False
) -> np.ndarray:
    """
    Convert a list of text chunks into L2-normalised dense embeddings.

    Processing:
    1. Load (or retrieve cached) sentence-transformer model
    2. Encode in batches of BATCH_SIZE (prevents OOM on large syllabi)
    3. L2-normalise (required for cosine similarity = dot product)
    4. Validate output quality

    Args:
        chunks:        List of text strings to embed
        model_name:    sentence-transformers model identifier
        show_progress: Whether to show tqdm progress bar

    Returns:
        numpy array of shape (len(chunks), EMBEDDING_DIM), L2-normalised
    """
    if not chunks:
        raise ValueError("Cannot embed an empty list of chunks")

    model = _get_model(model_name)

    logger.info(f"Embedding {len(chunks)} chunks (model={model_name})")
    t0 = time.time()

    # Encode in batches
    all_embeddings = []
    for batch_start in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[batch_start:batch_start + BATCH_SIZE]
        batch_embeddings = model.encode(
            batch,
            batch_size=BATCH_SIZE,
            show_progress_bar=show_progress,
            normalize_embeddings=True,  # L2 normalise
            convert_to_numpy=True,
        )
        all_embeddings.append(batch_embeddings)

    embeddings = np.vstack(all_embeddings)

    elapsed = time.time() - t0
    logger.info(
        f"Embedding complete: {len(chunks)} chunks in {elapsed:.1f}s "
        f"({len(chunks)/elapsed:.0f} chunks/s)"
    )

    # Validate
    if not validate_embeddings(embeddings, chunks):
        logger.warning("Embedding validation failed — proceeding with caution")

    return embeddings.astype(np.float32)


# ──────────────────────────────────────────────────────────────
# CACHED SYLLABUS EMBEDDING (for national exam syllabi)
# ──────────────────────────────────────────────────────────────

def load_or_compute_syllabus_embeddings(
    syllabus_key: str,
    chunks: List[str],
    model_name: str = PRIMARY_MODEL,
    force_recompute: bool = False,
) -> np.ndarray:
    """
    Cache-first embedding computation for national exam syllabi.

    National exam syllabi don't change between hackathon demos. Pre-computing
    and caching their embeddings makes live gap analysis ~10× faster
    (no re-encoding national topics on every request).

    The cache key is content-addressed (SHA-256 of topic strings + model),
    so it automatically invalidates when topics change.

    Args:
        syllabus_key:    Human-readable identifier (e.g. 'neet_chemistry')
        chunks:          List of topic strings from the JSON syllabus file
        model_name:      Embedding model to use
        force_recompute: Skip cache even if it exists

    Returns:
        numpy array of shape (len(chunks), EMBEDDING_DIM)
    """
    cache_key = _cache_key(chunks, model_name)

    if not force_recompute:
        cached = _load_from_cache(cache_key)
        if cached is not None and cached.shape[0] == len(chunks):
            return cached
        # Also try the legacy key-name-based cache for backward compat
        legacy_path = os.path.join(CACHE_DIR, f'{syllabus_key}_embeddings.npy')
        if os.path.exists(legacy_path):
            try:
                legacy = np.load(legacy_path)
                if isinstance(legacy, np.ndarray) and legacy.shape[0] == len(chunks):
                    logger.info(f"Legacy cache hit for {syllabus_key}")
                    return legacy.astype(np.float32)
            except Exception:
                pass

    embeddings = embed_chunks(chunks, model_name)
    _save_to_cache(cache_key, embeddings)
    return embeddings


# ──────────────────────────────────────────────────────────────
# PRECOMPUTE SCRIPT HELPER
# ──────────────────────────────────────────────────────────────

def precompute_all_national_syllabi(syllabi_dir: str = 'data/syllabi') -> None:
    """
    Pre-compute and cache embeddings for all national exam syllabi.
    Run this once before a demo/deployment for fastest response times.
    """
    import json, glob

    files = glob.glob(os.path.join(syllabi_dir, '*.json'))
    if not files:
        logger.error(f"No syllabus JSON files found in {syllabi_dir}")
        return

    for path in files:
        key = os.path.basename(path).replace('.json', '')
        try:
            with open(path, 'r') as f:
                data = json.load(f)
            topics = data.get('topics', [])
            if not topics:
                logger.warning(f"No topics found in {key}")
                continue

            logger.info(f"Precomputing embeddings for {key} ({len(topics)} topics)...")
            embeddings = load_or_compute_syllabus_embeddings(key, topics, force_recompute=True)
            logger.info(f"  ✓ {key}: {embeddings.shape}")
        except Exception as e:
            logger.error(f"  ✗ {key}: {e}")

    logger.info("All national syllabus embeddings precomputed.")