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
be its own chunk. But a chunk like "Unit I: Chemical Bonding and Molecular Structure"
alone is useless — it must carry context.

Our strategy: Hierarchical Context-Preserving Chunking (HCPC)

Step 1: Parse the hierarchical structure (units → sections → topics)
Step 2: For each leaf-level topic, create a chunk that:
         — Contains the topic text itself
         — Prepends its unit/section context (breadcrumb)
         — Has a soft maximum character length to bound embedding density

The breadcrumb prefix ("Unit I | Chemical Bonding | Ionic Bond:") dramatically
improves embedding quality because the embedding model can use the context
to disambiguate e.g. "lattice energy" (chemistry) vs "lattice" (physics/maths).

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
    text: str
    level: int              # 0 = unit, 1 = section, 2 = topic, 3 = sub-topic
    children: List['SyllabusNode'] = field(default_factory=list)
    breadcrumb: str = ''    # e.g. "Unit I | Chemical Bonding"


# ──────────────────────────────────────────────────────────────
# STRUCTURE DETECTION PATTERNS
# ──────────────────────────────────────────────────────────────

# Ordered by specificity — first match wins
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

# Patterns for lines that are NOT content (headers, footers, decorators)
NON_CONTENT_PATTERNS = [
    re.compile(r'^page\s+\d+', re.I),
    re.compile(r'^class\s+(?:xi{1,2}|11|12)\s*$', re.I),
    re.compile(r'^\d{4}\s*$'),     # bare year
    re.compile(r'^[-=_]{5,}$'),    # divider lines
    re.compile(r'^\(cont', re.I),  # "(continued)"
    re.compile(r'^(?:s\.?\s*no\.?|sl\.?\s*no\.?)', re.I),  # serial numbers
]


# ──────────────────────────────────────────────────────────────
# HIERARCHY PARSER
# ──────────────────────────────────────────────────────────────

def parse_syllabus_hierarchy(text: str) -> List[SyllabusNode]:
    """
    Parse raw syllabus text into a structured hierarchy of nodes.

    Uses pattern matching on line-by-line analysis. Falls back to a
    flat structure if no hierarchy is detected (some syllabi are plain
    topic lists without nested structure).

    Returns: List of top-level SyllabusNode objects (units/chapters).
    """
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    nodes: List[SyllabusNode] = []
    current_unit: Optional[SyllabusNode] = None
    current_section: Optional[SyllabusNode] = None

    for line in lines:
        # Skip non-content lines
        if any(p.match(line) for p in NON_CONTENT_PATTERNS):
            continue
        if len(line) < 4:
            continue

        # Match structural patterns
        matched_level = None
        matched_text = None

        for level, pattern in STRUCTURE_PATTERNS:
            m = pattern.match(line)
            if m:
                matched_level = level
                matched_text = m.group(1).strip() if m.lastindex else line
                break

        if matched_level is None:
            # Unmatched line: treat as a level-2 topic if it looks substantive
            if len(line) > 15 and not line[0].isdigit():
                matched_level = 2
                matched_text = line
            else:
                matched_level = 2
                matched_text = line

        # Build hierarchy
        if matched_level == 0:
            current_unit = SyllabusNode(text=matched_text, level=0)
            nodes.append(current_unit)
            current_section = None

        elif matched_level == 1:
            section = SyllabusNode(
                text=matched_text,
                level=1,
                breadcrumb=current_unit.text if current_unit else ''
            )
            if current_unit:
                current_unit.children.append(section)
            else:
                # No unit context — create a synthetic one
                synthetic = SyllabusNode(text='General Topics', level=0)
                nodes.append(synthetic)
                current_unit = synthetic
                current_unit.children.append(section)
            current_section = section

        else:  # level 2 or 3
            topic = SyllabusNode(
                text=matched_text,
                level=2,
                breadcrumb=_build_breadcrumb(current_unit, current_section)
            )
            if current_section:
                current_section.children.append(topic)
            elif current_unit:
                current_unit.children.append(topic)
            else:
                synthetic = SyllabusNode(text='General Topics', level=0)
                nodes.append(synthetic)
                current_unit = synthetic
                current_unit.children.append(topic)

    return nodes


def _build_breadcrumb(
    unit: Optional[SyllabusNode],
    section: Optional[SyllabusNode]
) -> str:
    parts = []
    if unit:
        parts.append(unit.text[:60])   # cap breadcrumb components
    if section:
        parts.append(section.text[:60])
    return ' | '.join(parts)


# ──────────────────────────────────────────────────────────────
# CHUNK GENERATION
# ──────────────────────────────────────────────────────────────

def _collect_leaf_chunks(
    nodes: List[SyllabusNode],
    max_chunk_chars: int = 300
) -> List[str]:
    """
    Collect leaf-level chunks from the hierarchy with breadcrumb context.
    Merges very short leaves (< 20 chars) with adjacent siblings to form
    more meaningful chunks.
    """
    chunks = []

    def traverse(node: SyllabusNode, parent_breadcrumb: str = ''):
        breadcrumb = node.breadcrumb or parent_breadcrumb

        if not node.children:
            # Leaf node: create chunk with context
            if len(node.text) < 20 and breadcrumb:
                # Short leaf — prepend full breadcrumb
                chunk = f"{breadcrumb}: {node.text}"
            elif breadcrumb:
                chunk = f"{breadcrumb} — {node.text}"
            else:
                chunk = node.text

            # Enforce length limit (truncate at last space before limit)
            if len(chunk) > max_chunk_chars:
                chunk = chunk[:max_chunk_chars].rsplit(' ', 1)[0]

            if len(chunk) >= 15:   # skip fragments
                chunks.append(chunk)
        else:
            # Internal node: recurse
            for child in node.children:
                traverse(child, breadcrumb or node.text)

    for node in nodes:
        traverse(node, '')

    return chunks


def _fallback_sentence_chunks(
    text: str,
    min_chars: int = 30,
    max_chars: int = 350
) -> List[str]:
    """
    Fallback chunker for completely flat, unstructured syllabus text.

    Uses a multi-delimiter split strategy:
    1. Split on strong delimiters (newlines, semicolons, numbered items)
    2. Merge very short fragments with their predecessor
    3. Split very long fragments on sentence boundaries

    This produces semantically coherent chunks even without structural cues.
    """
    # First try to split on strong structural signals
    segments = re.split(
        r'(?:^|\n)(?=\s*(?:\d+[\.\)]\s|\•\s|-\s|\*\s))',
        text,
        flags=re.MULTILINE
    )

    if len(segments) < 3:
        # No structural signals — split on sentences
        segments = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)

    chunks = []
    buffer = ''

    for segment in segments:
        segment = segment.strip()
        if not segment or len(segment) < 5:
            continue

        buffer = (buffer + ' ' + segment).strip() if buffer else segment

        if len(buffer) >= min_chars:
            if len(buffer) > max_chars:
                # Split on last natural boundary within limit
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
    seen = set()
    result = []
    for chunk in chunks:
        # Normalised fingerprint for dedup
        fingerprint = re.sub(r'\s+', ' ', chunk.lower().strip())
        if fingerprint not in seen and len(fingerprint) > 10:
            seen.add(fingerprint)
            result.append(chunk)
    return result


def _quality_filter(chunks: List[str]) -> List[str]:
    """Remove chunks that don't look like educational content."""
    filtered = []
    for chunk in chunks:
        # Must have at least 3 alphabetic words
        alpha_words = re.findall(r'[a-zA-Z]{3,}', chunk)
        if len(alpha_words) < 3:
            continue
        # Must not be all numbers or symbols
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

    Primary path: parse syllabus structure → collect leaf chunks with breadcrumbs
    Fallback path: flat sentence/clause splitting when no structure detected

    Args:
        text:            Clean extracted text from PDF parser
        max_chunk_chars: Maximum characters per chunk (300 keeps embeddings focused)
        min_chunk_chars: Minimum to avoid fragments

    Returns:
        List of semantically coherent, context-enriched topic chunks.
        Each chunk is ready to be embedded independently.
    """
    if not text or not text.strip():
        raise ValueError("Cannot chunk empty text")

    # Attempt hierarchical parsing
    hierarchy = parse_syllabus_hierarchy(text)

    # Count total leaf nodes to decide if hierarchy was useful
    total_leaves = 0
    def count_leaves(nodes):
        nonlocal total_leaves
        for node in nodes:
            if not node.children:
                total_leaves += 1
            else:
                count_leaves(node.children)
    count_leaves(hierarchy)

    if total_leaves >= 5:
        # Hierarchy detected: use HCPC
        chunks = _collect_leaf_chunks(hierarchy, max_chunk_chars)
        logger.info(f"Hierarchical chunking: {len(hierarchy)} units → {len(chunks)} leaf chunks")
    else:
        # Fall back to sentence chunking
        chunks = _fallback_sentence_chunks(text, min_chunk_chars, max_chunk_chars)
        logger.info(f"Fallback sentence chunking: {len(chunks)} chunks")

    # Post-processing
    chunks = _deduplicate_chunks(chunks)
    chunks = _quality_filter(chunks)

    logger.info(f"Final chunk count: {len(chunks)}")

    if len(chunks) == 0:
        raise ValueError(
            "Chunking produced no usable content. The PDF text may be too short "
            "or does not contain recognisable syllabus content."
        )

    return chunks


def chunk_national_syllabus(topics: List[str]) -> List[str]:
    """
    For pre-structured national exam syllabi (stored as JSON topic lists),
    each topic string is already atomic. We just clean and validate them.
    """
    chunks = []
    for topic in topics:
        topic = topic.strip()
        if len(topic) > 10:
            chunks.append(topic)
    return chunks