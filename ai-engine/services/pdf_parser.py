"""
Noor — Multi-Strategy PDF Parser
==================================
PDF extraction is deceptively hard. State board syllabus PDFs come in four
structurally distinct forms, each requiring a different extraction strategy:

  Form A: Digitally authored PDFs (most modern state board syllabi)
          → pdfplumber text extraction works well

  Form B: Scanned and OCR'd PDFs (older Karnataka, UP board syllabi)
          → text layer exists but is noisy; needs aggressive cleaning

  Form C: Multi-column layout PDFs (CBSE/NCERT style)
          → pdfplumber column detection required to avoid reading across cols

  Form D: Tables-as-syllabus PDFs (some GSEB, PSEB documents)
          → table extraction needed; running text extraction gives garbled output

This module auto-detects the PDF structure and routes to the appropriate
extraction strategy. The key insight: never trust a single extraction method.
We use a "confidence pipeline" — each strategy produces a text quality score,
and we pick the best output.

Text Quality Scoring (TQS):
  TQS = 0.3 * word_ratio + 0.3 * line_coherence + 0.2 * vocabulary_coverage
        + 0.2 * structure_preservation

Where:
  word_ratio:             fraction of tokens that are real English/Hindi words
  line_coherence:         fraction of lines that end naturally (not mid-word)
  vocabulary_coverage:    fraction of expected domain terms present
  structure_preservation: presence of headers, numbering, topic structure
"""

import re
import logging
from typing import List, Tuple, Optional, Dict

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# DOMAIN VOCABULARY — for Text Quality Scoring
# ──────────────────────────────────────────────────────────────

SCIENCE_VOCABULARY = {
    # Chemistry
    'element', 'compound', 'reaction', 'molecule', 'atom', 'bond', 'organic',
    'inorganic', 'equilibrium', 'kinetics', 'thermodynamics', 'periodic',
    'oxidation', 'reduction', 'acid', 'base', 'salt', 'solution', 'mole',
    'electron', 'orbital', 'hybridisation', 'isomerism', 'polymer', 'biomolecule',
    # Physics
    'force', 'energy', 'momentum', 'velocity', 'acceleration', 'field',
    'wave', 'optics', 'lens', 'prism', 'current', 'voltage', 'resistance',
    'capacitor', 'inductor', 'transistor', 'semiconductor', 'nucleus',
    'radioactivity', 'photon', 'wavelength', 'frequency', 'amplitude',
    # Mathematics
    'derivative', 'integral', 'limit', 'matrix', 'determinant', 'vector',
    'probability', 'permutation', 'combination', 'sequence', 'series',
    'differential', 'equation', 'function', 'graph', 'coordinate',
    # Biology
    'cell', 'tissue', 'organ', 'chromosome', 'gene', 'protein', 'enzyme',
    'photosynthesis', 'respiration', 'evolution', 'genetics', 'taxonomy',
}

# Artifact patterns that indicate bad extraction
ARTIFACT_PATTERNS = [
    r'\x00+',                     # null bytes
    r'[^\x00-\x7F]{5,}',          # long non-ASCII runs (garbled encoding)
    r'\b[A-Z]{15,}\b',            # extremely long all-caps (likely OCR garbage)
    r'(?:\S){40,}',               # runs of non-whitespace > 40 chars (no spaces)
    r'\d{1,2}\s+\d{1,2}\s+\d{4}', # date artifacts from headers/footers
]


# ──────────────────────────────────────────────────────────────
# TEXT QUALITY SCORING
# ──────────────────────────────────────────────────────────────

def score_text_quality(text: str) -> float:
    """
    Multi-dimensional text quality score in [0, 1].
    Higher = better extraction quality.
    """
    if not text or len(text) < 50:
        return 0.0

    words = text.lower().split()
    if len(words) == 0:
        return 0.0

    # 1. Word ratio: fraction of recognisably English tokens
    alpha_words = [w for w in words if re.match(r'^[a-zA-Z]{2,}$', w)]
    word_ratio = len(alpha_words) / len(words)

    # 2. Vocabulary coverage: domain words present
    word_set = set(alpha_words)
    covered = len(word_set & SCIENCE_VOCABULARY)
    vocab_coverage = min(covered / 20.0, 1.0)  # 20 domain words = full score

    # 3. Line coherence: lines ending at natural boundaries
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if lines:
        natural_endings = sum(
            1 for l in lines
            if l and (l[-1] in '.,:;)' or l[-1].isalpha())
        )
        line_coherence = natural_endings / len(lines)
    else:
        line_coherence = 0.0

    # 4. Artifact penalty: deduct for garbage patterns
    artifact_score = 1.0
    for pattern in ARTIFACT_PATTERNS:
        if re.search(pattern, text):
            artifact_score -= 0.15
    artifact_score = max(0.0, artifact_score)

    # Weighted composite
    quality = (
        0.30 * word_ratio +
        0.25 * vocab_coverage +
        0.25 * line_coherence +
        0.20 * artifact_score
    )
    return round(min(quality, 1.0), 4)


# ──────────────────────────────────────────────────────────────
# STRATEGY A: Standard text extraction
# ──────────────────────────────────────────────────────────────

def _extract_standard(pdf) -> str:
    """Standard pdfplumber text extraction with header/footer removal."""
    pages_text = []
    for page in pdf.pages:
        text = page.extract_text(x_tolerance=3, y_tolerance=3)
        if not text:
            continue
        lines = text.split('\n')
        if len(lines) > 4:
            lines = lines[1:-1]  # crude header/footer strip
        pages_text.append('\n'.join(lines))
    return '\n\n'.join(pages_text)


# ──────────────────────────────────────────────────────────────
# STRATEGY B: Column-aware extraction
# ──────────────────────────────────────────────────────────────

def _extract_column_aware(pdf) -> str:
    """
    Handles multi-column layouts by detecting column boundaries from
    x-coordinate distribution of words, then extracting each column
    independently before joining.
    """
    pages_text = []
    for page in pdf.pages:
        words = page.extract_words(x_tolerance=3, y_tolerance=3)
        if not words:
            continue

        page_width = page.width
        x_positions = sorted(set(w['x0'] for w in words))

        # Detect column boundary: look for a gap in x-positions
        col_boundary = None
        for i in range(len(x_positions) - 1):
            gap = x_positions[i+1] - x_positions[i]
            if gap > page_width * 0.15:
                col_boundary = (x_positions[i] + x_positions[i+1]) / 2
                break

        if col_boundary:
            left_words  = [w for w in words if w['x1'] <= col_boundary]
            right_words = [w for w in words if w['x0'] >= col_boundary]

            def words_to_text(word_list):
                word_list.sort(key=lambda w: (round(w['top'] / 5) * 5, w['x0']))
                lines, current_y, current_line = [], None, []
                for w in word_list:
                    if current_y is None or abs(w['top'] - current_y) > 6:
                        if current_line:
                            lines.append(' '.join(current_line))
                        current_line = [w['text']]
                        current_y = w['top']
                    else:
                        current_line.append(w['text'])
                if current_line:
                    lines.append(' '.join(current_line))
                return '\n'.join(lines)

            left_text  = words_to_text(left_words)
            right_text = words_to_text(right_words)
            pages_text.append(left_text + '\n' + right_text)
        else:
            text = page.extract_text(x_tolerance=3, y_tolerance=3)
            if text:
                pages_text.append(text)

    return '\n\n'.join(pages_text)


# ──────────────────────────────────────────────────────────────
# STRATEGY C: Table-based extraction
# ──────────────────────────────────────────────────────────────

def _extract_tables(pdf) -> str:
    """
    Extracts topics from table-structured syllabi.
    Many state board PDFs present topics in Unit | Topic | Sub-topic tables.
    """
    all_text = []
    for page in pdf.pages:
        tables = page.extract_tables()
        if tables:
            for table in tables:
                for row in table:
                    if row:
                        row_text = ' — '.join(
                            cell.strip() for cell in row
                            if cell and cell.strip()
                        )
                        if row_text and len(row_text) > 10:
                            all_text.append(row_text)
        text = page.extract_text(x_tolerance=3, y_tolerance=3)
        if text:
            all_text.append(text)
    return '\n'.join(all_text)


# ──────────────────────────────────────────────────────────────
# TEXT CLEANING PIPELINE
# ──────────────────────────────────────────────────────────────

def clean_extracted_text(raw: str) -> str:
    """
    Multi-pass cleaning pipeline:
    Pass 1: Remove encoding artifacts and control chars
    Pass 2: Fix common OCR errors in scientific text
    Pass 3: Normalise whitespace while preserving structure
    Pass 4: Remove non-content lines (page numbers, headers, watermarks)
    """
    if not raw:
        raise ValueError("No text was extracted from PDF")

    text = raw

    # Pass 1: Encoding artifacts
    text = re.sub(r'\x00+', '', text)
    text = re.sub(r'[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    # Pass 2: Common OCR errors in scientific text
    ocr_fixes = {
        r'\bl\b(?=\s+[a-z])': 'I',   # lowercase l → I at word boundaries
        r'\bO\b(?=\s*=)': '0',         # letter O → zero before =
        r'(\d)O(\d)': r'\g<1>0\g<2>',  # digit-O-digit: O is zero
        r'rn\b': 'm',                   # common rn → m confusion
        r'\bvvith\b': 'with',
        r'\bTbe\b': 'The',
        r'\boi\b': 'of',
        r'(\w)-\s*\n\s*(\w)': r'\1\2', # Reconnect hyphenated line breaks
    }
    for pattern, replacement in ocr_fixes.items():
        text = re.sub(pattern, replacement, text)

    # Pass 3: Normalise whitespace (preserve paragraph breaks)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'^\s+', '', text, flags=re.MULTILINE)

    # Pass 4: Remove non-content lines
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if re.match(r'^[\d\s\-–—|]+$', stripped) and len(stripped) < 20:
            continue  # page numbers / dividers
        if re.match(r'^(page|pg|chapter|unit|section)\s*\d+\s*$', stripped, re.I):
            continue  # standalone headers
        if len(stripped) < 3:
            continue
        if re.match(r'^https?://', stripped):
            continue
        cleaned_lines.append(stripped)

    # Pass 5: Final join and normalisation
    text = '\n'.join(cleaned_lines)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()

    if not text:
        raise ValueError(
            "No usable text could be extracted — PDF may be a scanned image without OCR layer"
        )

    return text


# ──────────────────────────────────────────────────────────────
# PDF STRUCTURE DETECTOR
# ──────────────────────────────────────────────────────────────

def detect_pdf_structure(pdf) -> str:
    """
    Classify the PDF structure to select the optimal extraction strategy.

    Returns one of: 'standard', 'multi_column', 'table_heavy', 'mixed'
    """
    sample_page = pdf.pages[0] if pdf.pages else None
    if sample_page is None:
        return 'standard'

    # Check for tables
    tables = sample_page.extract_tables()
    if tables and sum(len(t) for t in tables) > 5:
        return 'table_heavy'

    # Check for multi-column layout via word x-distribution
    words = sample_page.extract_words()
    if len(words) > 20:
        page_width = sample_page.width
        x_positions = sorted(set(round(w['x0'] / 10) * 10 for w in words))
        max_gap = max(
            (x_positions[i+1] - x_positions[i] for i in range(len(x_positions)-1)),
            default=0
        )
        if max_gap > page_width * 0.15:
            return 'multi_column'

    return 'standard'


# ──────────────────────────────────────────────────────────────
# PUBLIC API
# ──────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_path: str) -> str:
    """
    Resilient multi-strategy PDF text extraction.

    Tries multiple strategies and selects the one with the highest
    Text Quality Score. This ensures robust extraction even for
    structurally varied state board PDFs.

    Args:
        file_path: Absolute path to the PDF file.

    Returns:
        Clean, reconstructed text ready for chunking.

    Raises:
        ValueError: If no strategy yields acceptable quality (likely scanned
                    PDF without OCR layer).
    """
    try:
        import pdfplumber
    except ImportError:
        raise ImportError("pdfplumber is required: pip install pdfplumber")

    results: Dict[str, Tuple[str, float]] = {}

    try:
        with pdfplumber.open(file_path) as pdf:
            if len(pdf.pages) == 0:
                raise ValueError("PDF has no pages")

            structure = detect_pdf_structure(pdf)
            logger.info(f"Detected PDF structure: {structure}")

            # Always try standard extraction
            try:
                std_text    = _extract_standard(pdf)
                std_cleaned = clean_extracted_text(std_text)
                std_quality = score_text_quality(std_cleaned)
                results['standard'] = (std_cleaned, std_quality)
                logger.info(f"Standard extraction: quality={std_quality:.3f}, chars={len(std_cleaned)}")
            except Exception as e:
                logger.warning(f"Standard extraction failed: {e}")

            # Try column-aware if structure suggests it
            if structure in ('multi_column', 'mixed'):
                try:
                    col_text    = _extract_column_aware(pdf)
                    col_cleaned = clean_extracted_text(col_text)
                    col_quality = score_text_quality(col_cleaned)
                    results['column_aware'] = (col_cleaned, col_quality)
                    logger.info(f"Column-aware extraction: quality={col_quality:.3f}")
                except Exception as e:
                    logger.warning(f"Column-aware extraction failed: {e}")

            # Try table extraction if structure suggests it
            if structure in ('table_heavy', 'mixed'):
                try:
                    tbl_text    = _extract_tables(pdf)
                    tbl_cleaned = clean_extracted_text(tbl_text)
                    tbl_quality = score_text_quality(tbl_cleaned)
                    results['table'] = (tbl_cleaned, tbl_quality)
                    logger.info(f"Table extraction: quality={tbl_quality:.3f}")
                except Exception as e:
                    logger.warning(f"Table extraction failed: {e}")

    except Exception as e:
        raise ValueError(f"Could not open PDF: {e}")

    if not results:
        raise ValueError(
            "All extraction strategies failed. This PDF may be a scanned image. "
            "Please upload a text-based PDF (you can usually tell by whether you "
            "can select and copy text in your PDF viewer)."
        )

    # Select strategy with best quality
    best_strategy_name = max(results, key=lambda k: results[k][1])
    best_text, best_quality = results[best_strategy_name]

    logger.info(f"Selected strategy '{best_strategy_name}' with quality={best_quality:.3f}")

    if best_quality < 0.20:
        raise ValueError(
            f"PDF text quality too low (score={best_quality:.2f}). "
            "This looks like a scanned PDF. Please use a text-based version."
        )

    return best_text