import re
from typing import List

def chunk_syllabus(text: str, chunk_size: int = 200) -> List[str]:
    sentences = re.split(r'(?<=[.!?\n])\s+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
    chunks, current_chunk, current_length = [], [], 0
    for sentence in sentences:
        current_chunk.append(sentence)
        current_length += len(sentence)
        if current_length >= chunk_size:
            chunks.append(' '.join(current_chunk))
            current_chunk, current_length = [], 0
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    return chunks
