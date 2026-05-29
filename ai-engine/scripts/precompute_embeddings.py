"""
Run this ONCE before the hackathon demo to pre-cache all syllabus embeddings.
Usage: python scripts/precompute_embeddings.py
"""
import sys
sys.path.append('.')
from services.embedder import load_or_compute_syllabus_embeddings
import json

syllabi = ['neet_chemistry', 'neet_physics', 'jee_maths']

for key in syllabi:
    path = f'data/syllabi/{key}.json'
    try:
        with open(path) as f:
            data = json.load(f)
        chunks = data['topics']
        embeddings = load_or_compute_syllabus_embeddings(key, chunks)
        print(f'✅ {key}: {len(embeddings)} embeddings cached')
    except FileNotFoundError:
        print(f'⚠️  {key}: file not found, skipping')

print('\n✅ All embeddings cached. Demo will be fast!')
