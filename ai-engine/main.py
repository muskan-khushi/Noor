from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import gap_router, hyperlocal_router

app = FastAPI(title="Noor AI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gap_router.router, prefix="/gap")
app.include_router(hyperlocal_router.router, prefix="/hyperlocal")

@app.get("/health")
def health():
    return {"status": "ok", "service": "noor-ai-engine"}
