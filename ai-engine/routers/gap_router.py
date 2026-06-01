"""
Noor AI Engine — Gap Analysis Router
======================================
FastAPI router for curriculum gap analysis.

Endpoint: POST /gap/analyse
Pipeline: PDF → parse → chunk → embed → compare → score → generate modules → return

Performance targets (on standard laptop CPU):
  - PDF parsing:       <2s for 20-page PDF
  - Embedding:         <5s for 200 chunks (cached national syllabi: 0s)
  - Gap detection:     <1s (BM25 + cosine)
  - Module generation: ~3s per CRITICAL gap (5 modules max = ~15s)
  Total: ~25s end-to-end (within the 30s Loader message shown to user)
"""

import json
import logging
import os
import shutil
import tempfile
from typing import Optional
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

from fastapi import APIRouter, Form, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from services.pdf_parser import extract_text_from_pdf
from services.chunker import chunk_syllabus, chunk_national_syllabus
from services.embedder import embed_chunks, load_or_compute_syllabus_embeddings
from services.similarity import find_gaps, compute_alignment_report
from services.gap_generator import generate_gap_module

logger = logging.getLogger(__name__)

router = APIRouter()

# ──────────────────────────────────────────────────────────────
# SUPPORTED EXAM/SUBJECT COMBINATIONS AND THEIR SYLLABUS FILES
# ──────────────────────────────────────────────────────────────

SYLLABUS_MAP = {
    # Primary combinations (pre-computed embeddings available)
    ("NEET",      "Chemistry"):   ("neet_chemistry",        str(BASE_DIR / "data/syllabi/neet_chemistry.json")),
    ("NEET",      "Physics"):     ("neet_physics",          str(BASE_DIR / "data/syllabi/neet_physics.json")),
    ("NEET",      "Biology"):     ("neet_biology",          str(BASE_DIR / "data/syllabi/neet_biology.json")),
    ("JEE Mains", "Mathematics"): ("jee_mains_mathematics", str(BASE_DIR / "data/syllabi/jee_mains_mathematics.json")),
    ("JEE Mains", "Chemistry"):   ("neet_chemistry",        str(BASE_DIR / "data/syllabi/neet_chemistry.json")),
    ("JEE Mains", "Physics"):     ("neet_physics",          str(BASE_DIR / "data/syllabi/neet_physics.json")),
    ("CUET",      "Chemistry"):   ("cuet_science",          str(BASE_DIR / "data/syllabi/cuet_science.json")),
}


def load_national_syllabus(exam: str, subject: str):
    """
    Load national exam syllabus topics and return (syllabus_key, topics_list).
    Raises 400 for unsupported combinations.
    """
    key = (exam, subject)
    if key not in SYLLABUS_MAP:
        supported = [f"{e}/{s}" for e, s in SYLLABUS_MAP.keys()]
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported exam/subject combination: '{exam}/{subject}'. "
                   f"Supported combinations: {', '.join(supported)}"
        )

    syllabus_key, path = SYLLABUS_MAP[key]

    if not os.path.exists(path):
        raise HTTPException(
            status_code=500,
            detail=f"Syllabus data file not found: {path}. "
                   f"Please ensure all data files are present."
        )

    with open(path) as f:
        data = json.load(f)

    topics = data.get('topics', [])
    if not topics:
        raise HTTPException(
            status_code=500,
            detail=f"Syllabus file for {exam}/{subject} contains no topics."
        )

    return syllabus_key, topics


# ──────────────────────────────────────────────────────────────
# MAIN ENDPOINT
# ──────────────────────────────────────────────────────────────

@router.post("/analyse")
def analyse_gap(
    syllabus: UploadFile = File(..., description="State board syllabus PDF (max 10MB)"),
    board:    str = Form(..., description="State board name (e.g. 'Maharashtra')"),
    exam:     str = Form(..., description="Target national exam (NEET/JEE Mains/CUET)"),
    subject:  str = Form(..., description="Subject (Chemistry/Physics/Mathematics/Biology)"),
    max_module_generation: Optional[int] = Form(
        default=5,
        description="Max number of CRITICAL gaps for which to auto-generate study modules (1-10)"
    ),
):
    """
    Full curriculum gap analysis pipeline.

    Accepts a state board syllabus PDF, extracts and embeds its topics, then
    compares against the target national exam syllabus using multi-signal
    similarity. Returns a prioritised gap report with AI-generated study modules
    for the most critical gaps.
    """
    # Fix: use explicit None check so that a value of 0 is handled correctly
    # rather than the falsy `or 5` pattern which treats 0 as missing.
    if max_module_generation is None:
        max_modules = 5
    else:
        max_modules = min(max(max_module_generation, 1), 10)

    # Save uploaded PDF to temp file
    suffix = os.path.splitext(syllabus.filename or '.pdf')[1] or '.pdf'
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    os.close(tmp_fd)

    try:
        # Write upload to temp
        with open(tmp_path, 'wb') as f:
            shutil.copyfileobj(syllabus.file, f)

        file_size = os.path.getsize(tmp_path)
        logger.info(
            f"Gap analysis: board={board}, exam={exam}, subject={subject}, "
            f"file={syllabus.filename}, size={file_size/1024:.1f}KB"
        )

        # ── Step 1: Parse student's PDF ──────────────────────────────────
        try:
            state_text = extract_text_from_pdf(tmp_path)
            logger.info(f"PDF extracted: {len(state_text)} chars")
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))

        # ── Step 2: Chunk state syllabus ─────────────────────────────────
        try:
            state_chunks = chunk_syllabus(state_text)
            logger.info(f"State syllabus: {len(state_chunks)} chunks")
        except ValueError as e:
            raise HTTPException(status_code=422, detail=f"Chunking failed: {e}")

        if len(state_chunks) < 5:
            raise HTTPException(
                status_code=422,
                detail=f"Too few content chunks extracted ({len(state_chunks)}). "
                       "The PDF may not contain a readable syllabus."
            )

        # ── Step 3: Embed state syllabus ─────────────────────────────────
        try:
            state_embeddings = embed_chunks(state_chunks)
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            raise HTTPException(status_code=500, detail=f"Embedding service error: {e}")

        # ── Step 4: Load national exam syllabus ──────────────────────────
        try:
            syllabus_key, national_topics = load_national_syllabus(exam, subject)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Syllabus load error: {e}")

        national_chunks = chunk_national_syllabus(national_topics)
        logger.info(f"National syllabus: {len(national_chunks)} topics")

        # ── Step 5: Load or compute national embeddings ───────────────────
        try:
            national_embeddings = load_or_compute_syllabus_embeddings(
                syllabus_key, national_chunks
            )
        except Exception as e:
            logger.error(f"National embedding failed: {e}")
            raise HTTPException(status_code=500, detail=f"Embedding computation failed: {e}")

        # ── Step 6: Find gaps ─────────────────────────────────────────────
        gaps = find_gaps(
            state_chunks, state_embeddings,
            national_chunks, national_embeddings,
        )
        logger.info(f"Gap detection complete: {len(gaps)} gaps found")

        # ── Step 7: Generate study modules for CRITICAL gaps ─────────────
        module_count = 0
        for gap in gaps:
            if gap['priority'] != 'CRITICAL':
                gap['studyModule'] = None
                continue
            if module_count >= max_modules:
                gap['studyModule'] = None
                continue
            try:
                gap['studyModule'] = generate_gap_module(
                    gap['topic'], exam, subject
                )
                module_count += 1
                logger.info(f"Generated module {module_count}/{max_modules}: {gap['topic'][:50]}")
            except Exception as e:
                logger.error(f"Module generation failed for '{gap['topic'][:50]}': {e}")
                gap['studyModule'] = None

        # ── Step 8: Compute alignment report ─────────────────────────────
        alignment_report = compute_alignment_report(
            gaps, len(national_chunks), exam, subject, board
        )

        # ── Step 9: Build response ────────────────────────────────────────
        critical_count = sum(1 for g in gaps if g['priority'] == 'CRITICAL')
        high_count     = sum(1 for g in gaps if g['priority'] == 'HIGH')
        medium_count   = sum(1 for g in gaps if g['priority'] == 'MEDIUM')

        summary = (
            f"Your {board} board {subject} syllabus covers "
            f"{alignment_report['alignment_score']}% of {exam} topics. "
            f"Found {len(gaps)} gaps: {critical_count} critical, {high_count} high priority. "
            f"Estimated {alignment_report['marks_at_risk_estimate']} marks at risk. "
            f"Estimated {alignment_report['study_hours_estimate']} hours to bridge all gaps."
        )

        return {
            "board":                   board,
            "exam":                    exam,
            "subject":                 subject,
            "totalGapsFound":          len(gaps),
            "criticalGaps":            critical_count,
            "highGaps":                high_count,
            "mediumGaps":              medium_count,
            "summary":                 summary,
            "alignment_report":        alignment_report,
            "state_chunks_count":      len(state_chunks),
            "national_topics_count":   len(national_chunks),
            "gaps":                    gaps,
        }

    finally:
        # Always clean up the temp file
        try:
            os.unlink(tmp_path)
        except Exception:
            pass