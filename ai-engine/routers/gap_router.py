from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import shutil, os, json, tempfile
from services.pdf_parser import extract_text_from_pdf
from services.chunker import chunk_syllabus
from services.embedder import embed_chunks, load_or_compute_syllabus_embeddings
from services.similarity import find_gaps
from services.gap_generator import generate_gap_module

router = APIRouter()

def load_national_syllabus(exam: str, subject: str):
    key_map = {
        ("NEET", "Chemistry"): "neet_chemistry",
        ("NEET", "Physics"):   "neet_physics",
        ("JEE Mains", "Mathematics"): "jee_maths",
        ("CUET", "Chemistry"): "cuet_science",
    }
    key = key_map.get((exam, subject))
    if not key:
        raise HTTPException(400, f"Unsupported exam/subject combo: {exam}/{subject}")
    path = f"data/syllabi/{key}.json"
    if not os.path.exists(path):
        raise HTTPException(500, f"Syllabus data not found: {path}")
    with open(path) as f:
        data = json.load(f)
    return key, data["topics"]

@router.post("/analyse")
async def analyse_gap(
    syllabus: UploadFile = File(...),
    board: str = Form(...),
    exam: str = Form(...),
    subject: str = Form(...),
):
    # Save uploaded PDF to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(syllabus.file, tmp)
        tmp_path = tmp.name

    try:
        # 1. Parse student PDF
        state_text = extract_text_from_pdf(tmp_path)
        state_chunks = chunk_syllabus(state_text)
        state_embeddings = embed_chunks(state_chunks)

        # 2. Load national exam syllabus
        syllabus_key, national_chunks = load_national_syllabus(exam, subject)
        national_embeddings = load_or_compute_syllabus_embeddings(syllabus_key, national_chunks)

        # 3. Find gaps
        gaps = find_gaps(state_chunks, state_embeddings, national_chunks, national_embeddings)

        # 4. Generate study modules for CRITICAL gaps (max 5 for speed)
        for gap in gaps:
            if gap['priority'] == 'CRITICAL':
                try:
                    gap['studyModule'] = generate_gap_module(gap['topic'], exam, subject)
                except Exception:
                    gap['studyModule'] = None

        critical = sum(1 for g in gaps if g['priority'] == 'CRITICAL')
        high = sum(1 for g in gaps if g['priority'] == 'HIGH')

        return {
            "totalGapsFound": len(gaps),
            "criticalGaps": critical,
            "highGaps": high,
            "board": board,
            "exam": exam,
            "subject": subject,
            "summary": f"Your {board} board {subject} syllabus is missing {len(gaps)} topics that appear in {exam}. {critical} are CRITICAL.",
            "gaps": gaps
        }
    finally:
        os.unlink(tmp_path)

@router.get("/regions")
def get_regions():
    import glob
    files = glob.glob("data/regional_context/*.json")
    return {"regions": [os.path.basename(f).replace(".json","") for f in files]}
