"""
Noor — Hierarchical Syllabus Chunker
======================================
Chunking is the single most important preprocessing decision in an RAG/embedding
pipeline. Poor chunking destroys semantic coherence — a chunk that straddles two
topics generates an embedding that represents neither well.

The naive approach (fixed character windows, sentence splitting) fails badly on
syllabus text because syllabi have a highly structured, hierarchical form:

  Unit I: Chemical Bonding and Molecular Structure
    1.1 Kossel–Lewis approach
    1.2 Ionic bond formation — lattice energy
    1.3 Covalent bonds — valence bond theory

Each atomic concept (e.g. "lattice energy") is a separate exam topic and should
be its own chunk. But a chunk like "Unit I: Chemical Bonding" alone is useless —
it must carry context.

Our strategy: Hierarchical Context-Preserving Chunking (HCPC)

Step 1: Parse the hierarchical structure (units → sections → topics)
Step 2: For each leaf-level topic, create a chunk that:
         — Contains the topic text itself
         — Prepends its unit/section context (breadcrumb)
         — Has a soft maximum character length to bound embedding density

Reference: Lewis et al. (2020) "RAG for Knowledge-Intensive NLP Tasks". NeurIPS.
"""

import re
import logging
from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# DATA STRUCTURES
# ──────────────────────────────────────────────────────────────

@dataclass
class SyllabusNode:
    """A node in the parsed syllabus hierarchy."""
    text:     str
    level:    int              # 0 = unit, 1 = section, 2 = topic, 3 = sub-topic
    children: List['SyllabusNode'] = field(default_factory=list)
    breadcrumb: str = ''       # e.g. "Unit I | Chemical Bonding"


# ──────────────────────────────────────────────────────────────
# STRUCTURE DETECTION PATTERNS
# ──────────────────────────────────────────────────────────────

STRUCTURE_PATTERNS = [
    # Level 0: Unit headers
    (0, re.compile(
        r'^(?:unit|chapter|module|part|section)\s+(?:[ivx]+|\d+)[:\.\s](.+)',
        re.I
    )),
    # Level 0: Numbered chapters with capital text
    (0, re.compile(
        r'^(?:\d+)\.\s+([A-Z][A-Z\s,\-]+)$'
    )),
    # Level 1: Numbered sections
    (1, re.compile(
        r'^(?:\d+\.\d+)\s+(.+)'
    )),
    # Level 1: Lettered subsections
    (1, re.compile(
        r'^(?:[a-z][\.\)]\s+)(.+)',
        re.I
    )),
    # Level 2: Topic bullets / numbered items
    (2, re.compile(
        r'^[\•\-\*\>\u2022\u25cf\u25aa]\s+(.+)'
    )),
    (2, re.compile(
        r'^(?:\d+\.\d+\.\d+)\s+(.+)'
    )),
    # Level 2: Roman numeral subsections
    (2, re.compile(
        r'^(?:i{1,3}|iv|v|vi|vii|viii|ix|x)\)\s+(.+)',
        re.I
    )),
]

NON_CONTENT_PATTERNS = [
    re.compile(r'^page\s+\d+', re.I),
    re.compile(r'^class\s+(?:xi{1,2}|11|12)\s*$', re.I),
    re.compile(r'^\d{4}\s*$'),
    re.compile(r'^[-=_]{5,}$'),
    re.compile(r'^\(cont', re.I),
    re.compile(r'^(?:s\.?\s*no\.?|sl\.?\s*no\.?)', re.I),
]


# ──────────────────────────────────────────────────────────────
# HIERARCHY PARSER
# ──────────────────────────────────────────────────────────────

def parse_syllabus_hierarchy(text: str) -> List[SyllabusNode]:
    """
    Parse raw syllabus text into a structured hierarchy of nodes.

    For flat syllabi (no detected units/sections), all topics are placed under
    a single synthetic "General Topics" root — rather than one root per topic —
    so the tree stays shallow and breadcrumb construction remains efficient.

    Returns: List of top-level SyllabusNode objects (units/chapters).
    """
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    nodes: List[SyllabusNode] = []
    # Shared synthetic root — reused for all unmatched lines when no unit exists.
    # Created lazily so well-structured syllabi never allocate it.
    synthetic_root: Optional[SyllabusNode] = None

    current_unit:    Optional[SyllabusNode] = None
    current_section: Optional[SyllabusNode] = None

    def _get_or_create_synthetic_root() -> SyllabusNode:
        nonlocal synthetic_root
        if synthetic_root is None:
            synthetic_root = SyllabusNode(text='General Topics', level=0)
            nodes.append(synthetic_root)
        return synthetic_root

    for line in lines:
        if any(p.match(line) for p in NON_CONTENT_PATTERNS):
            continue
        if len(line) < 4:
            continue

        matched_level = None
        matched_text  = None

        for level, pattern in STRUCTURE_PATTERNS:
            m = pattern.match(line)
            if m:
                matched_level = level
                matched_text  = m.group(1).strip() if m.lastindex else line
                break

        if matched_level is None:
            matched_level = 2
            matched_text  = line

        if matched_level == 0:
            current_unit    = SyllabusNode(text=matched_text, level=0)
            current_section = None
            nodes.append(current_unit)

        elif matched_level == 1:
            if current_unit is None:
                current_unit = _get_or_create_synthetic_root()
            section = SyllabusNode(
                text=matched_text,
                level=1,
                breadcrumb=current_unit.text,
            )
            current_unit.children.append(section)
            current_section = section

        else:  # level 2 or 3
            if current_unit is None:
                current_unit = _get_or_create_synthetic_root()
            topic = SyllabusNode(
                text=matched_text,
                level=2,
                breadcrumb=_build_breadcrumb(current_unit, current_section),
            )
            if current_section:
                current_section.children.append(topic)
            else:
                current_unit.children.append(topic)

    return nodes


def _build_breadcrumb(
    unit:    Optional[SyllabusNode],
    section: Optional[SyllabusNode],
) -> str:
    parts = []
    if unit and unit.text != 'General Topics':
        parts.append(unit.text[:60])
    if section:
        parts.append(section.text[:60])
    return ' | '.join(parts)


# ──────────────────────────────────────────────────────────────
# CHUNK GENERATION
# ──────────────────────────────────────────────────────────────

def _collect_leaf_chunks(
    nodes: List[SyllabusNode],
    max_chunk_chars: int = 300,
) -> List[str]:
    """
    Collect leaf-level chunks from the hierarchy with breadcrumb context.
    """
    chunks = []

    def traverse(node: SyllabusNode, parent_breadcrumb: str = ''):
        breadcrumb = node.breadcrumb or parent_breadcrumb

        if not node.children:
            # Leaf node: build chunk with breadcrumb context
            if breadcrumb:
                chunk = f"{breadcrumb} — {node.text}"
            else:
                chunk = node.text

            if len(chunk) > max_chunk_chars:
                chunk = chunk[:max_chunk_chars].rsplit(' ', 1)[0]

            if len(chunk) >= 15:
                chunks.append(chunk)
        else:
            for child in node.children:
                traverse(child, breadcrumb or node.text)

    for node in nodes:
        traverse(node, '')

    return chunks


def _fallback_sentence_chunks(
    text: str,
    min_chars: int = 30,
    max_chars: int = 350,
) -> List[str]:
    """
    Fallback chunker for completely flat, unstructured syllabus text.
    """
    segments = re.split(
        r'(?:^|\n)(?=\s*(?:\d+[\.\)]\s|\•\s|-\s|\*\s))',
        text,
        flags=re.MULTILINE,
    )

    if len(segments) < 3:
        segments = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)

    chunks  = []
    buffer  = ''

    for segment in segments:
        segment = segment.strip()
        if not segment or len(segment) < 5:
            continue

        buffer = (buffer + ' ' + segment).strip() if buffer else segment

        if len(buffer) >= min_chars:
            if len(buffer) > max_chars:
                split_at = buffer.rfind(',', 0, max_chars)
                if split_at == -1:
                    split_at = buffer.rfind(' ', 0, max_chars)
                if split_at > min_chars:
                    chunks.append(buffer[:split_at].strip())
                    buffer = buffer[split_at:].strip()
                else:
                    chunks.append(buffer[:max_chars].strip())
                    buffer = buffer[max_chars:].strip()
            else:
                chunks.append(buffer)
                buffer = ''

    if buffer and len(buffer) >= min_chars:
        chunks.append(buffer)

    return chunks


# ──────────────────────────────────────────────────────────────
# CHUNK DEDUPLICATION AND QUALITY FILTER
# ──────────────────────────────────────────────────────────────

def _deduplicate_chunks(chunks: List[str]) -> List[str]:
    """Remove exact and near-exact duplicate chunks."""
    seen   = set()
    result = []
    for chunk in chunks:
        fingerprint = re.sub(r'\s+', ' ', chunk.lower().strip())
        if fingerprint not in seen and len(fingerprint) > 10:
            seen.add(fingerprint)
            result.append(chunk)
    return result


def _quality_filter(chunks: List[str]) -> List[str]:
    """Remove chunks that don't look like educational content."""
    filtered = []
    for chunk in chunks:
        alpha_words = re.findall(r'[a-zA-Z]{3,}', chunk)
        if len(alpha_words) < 3:
            continue
        if sum(c.isalpha() for c in chunk) / max(len(chunk), 1) < 0.4:
            continue
        filtered.append(chunk)
    return filtered


# ──────────────────────────────────────────────────────────────
# PUBLIC API
# ──────────────────────────────────────────────────────────────

def chunk_syllabus(
    text: str,
    max_chunk_chars: int = 300,
    min_chunk_chars: int = 25,
) -> List[str]:
    """
    Hierarchical Context-Preserving Chunker.

    Primary path:  parse syllabus structure → collect leaf chunks with breadcrumbs
    Fallback path: flat sentence/clause splitting when no structure detected

    Args:
        text:            Clean extracted text from PDF parser
        max_chunk_chars: Maximum characters per chunk
        min_chunk_chars: Minimum to avoid fragments

    Returns:
        List of semantically coherent, context-enriched topic chunks.
    """
    if not text or not text.strip():
        raise ValueError("Cannot chunk empty text")

    hierarchy    = parse_syllabus_hierarchy(text)
    total_leaves = _count_leaves(hierarchy)

    if total_leaves >= 5:
        chunks = _collect_leaf_chunks(hierarchy, max_chunk_chars)
        logger.info(f"Hierarchical chunking: {len(hierarchy)} roots → {len(chunks)} leaf chunks")
    else:
        chunks = _fallback_sentence_chunks(text, min_chunk_chars, max_chunk_chars)
        logger.info(f"Fallback sentence chunking: {len(chunks)} chunks")

    chunks = _deduplicate_chunks(chunks)
    chunks = _quality_filter(chunks)

    logger.info(f"Final chunk count: {len(chunks)}")

    if len(chunks) == 0:
        raise ValueError(
            "Chunking produced no usable content. The PDF text may be too short "
            "or does not contain recognisable syllabus content."
        )

    return chunks


def _count_leaves(nodes: List[SyllabusNode]) -> int:
    """Recursively count leaf nodes in a syllabus tree."""
    count = 0
    for node in nodes:
        if not node.children:
            count += 1
        else:
            count += _count_leaves(node.children)
    return count


def chunk_national_syllabus(topics: List[str]) -> List[str]:
    """
    For pre-structured national exam syllabi (stored as JSON topic lists),
    each topic string is already atomic. Just clean and validate them.
    """
    return [topic.strip() for topic in topics if topic.strip() and len(topic.strip()) > 10]