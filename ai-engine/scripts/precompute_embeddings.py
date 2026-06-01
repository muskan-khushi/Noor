"""
Run this ONCE before the hackathon demo to pre-cache all syllabus embeddings.
Usage (from the ai-engine/ directory):

    python scripts/precompute_embeddings.py

This downloads all-MiniLM-L6-v2 (~80 MB on first run) and writes content-
addressed .pkl files to the embeddings/ directory. Every subsequent gap
analysis request will hit the cache instead of re-computing.
"""
import sys
import os

# Allow imports from the ai-engine root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.embedder import load_or_compute_syllabus_embeddings
import json

# Unique syllabus keys from routers/gap_router.py SYLLABUS_MAP (all supported exams)
SYLLABI = [
    ('neet_chemistry',        'data/syllabi/neet_chemistry.json'),
    ('neet_physics',          'data/syllabi/neet_physics.json'),
    ('neet_biology',          'data/syllabi/neet_biology.json'),
    ('jee_mains_mathematics', 'data/syllabi/jee_mains_mathematics.json'),
    ('cuet_science',          'data/syllabi/cuet_science.json'),
]

def main():
    print('\n  Noor — Pre-computing national syllabus embeddings\n')
    for key, path in SYLLABI:
        if not os.path.exists(path):
            print(f'  ⚠  {key}: file not found at {path}, skipping')
            continue
        try:
            with open(path) as f:
                data = json.load(f)
            chunks = data.get('topics', [])
            if not chunks:
                print(f'  ⚠  {key}: no topics found in file, skipping')
                continue
            embeddings = load_or_compute_syllabus_embeddings(key, chunks, force_recompute=True)
            print(f'  ✓  {key}: {len(embeddings)} embeddings cached')
        except Exception as e:
            print(f'  ✗  {key}: {e}')

    print('\n  All embeddings cached. Demo will be fast.\n')

if __name__ == '__main__':
    main()