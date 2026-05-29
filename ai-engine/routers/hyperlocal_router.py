from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.hyperlocal_generator import rewrite_with_local_context
import glob, os, re

router = APIRouter()

class HyperRequest(BaseModel):
    original_text: str
    concept: str
    subject: str
    class_level: str
    region_key: str

@router.post("/generate")
def generate_hyperlocal(req: HyperRequest):
    if not re.match(r'^[a-z_]+$', req.region_key):
        raise HTTPException(400, 'Invalid region key')
    region_path = f"data/regional_context/{req.region_key}.json"
    if not os.path.exists(region_path):
        raise HTTPException(400, f"Region '{req.region_key}' not found.")
    result = rewrite_with_local_context(
        req.original_text, req.concept, req.subject, req.class_level, req.region_key
    )
    return result

@router.get("/regions")
def list_regions():
    files = glob.glob("data/regional_context/*.json")
    return {"regions": [os.path.basename(f).replace(".json","") for f in files]}
