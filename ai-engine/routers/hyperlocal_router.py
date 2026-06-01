from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.hyperlocal_generator import rewrite_with_local_context, batch_rewrite_for_multiple_regions
from typing import List
import glob, os, re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

router = APIRouter()

class HyperRequest(BaseModel):
    original_text: str
    concept: str
    subject: str
    class_level: str
    region_key: str

class BatchHyperRequest(BaseModel):
    original_text: str
    concept: str
    subject: str
    class_level: str
    region_keys: List[str]

@router.post("/generate")
def generate_hyperlocal(req: HyperRequest):
    if not re.match(r'^[a-z_]+$', req.region_key):
        raise HTTPException(400, 'Invalid region key')
    region_path = str(BASE_DIR / f"data/regional_context/{req.region_key}.json")
    if not os.path.exists(region_path):
        raise HTTPException(400, f"Region '{req.region_key}' not found.")
    result = rewrite_with_local_context(
        req.original_text, req.concept, req.subject, req.class_level, req.region_key
    )
    return result

@router.post("/batch-generate")
def batch_generate_hyperlocal(req: BatchHyperRequest):
    for r_key in req.region_keys:
        if not re.match(r'^[a-z_]+$', r_key):
            raise HTTPException(400, f'Invalid region key: {r_key}')
        if not os.path.exists(str(BASE_DIR / f"data/regional_context/{r_key}.json")):
            raise HTTPException(400, f"Region '{r_key}' not found.")
    
    results = batch_rewrite_for_multiple_regions(
        req.original_text, req.concept, req.subject, req.class_level, req.region_keys
    )
    return {"results": results}

@router.get("/regions")
def list_regions():
    files = glob.glob(str(BASE_DIR / "data/regional_context/*.json"))
    return {"regions": [os.path.basename(f).replace(".json","") for f in files]}
