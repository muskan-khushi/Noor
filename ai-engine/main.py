from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import gap_router, hyperlocal_router
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Noor AI Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gap_router.router, prefix="/gap")
app.include_router(hyperlocal_router.router, prefix="/hyperlocal")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f'Unhandled error: {exc}', exc_info=True)
    return JSONResponse(status_code=500, content={'detail': 'Internal server error'})

@app.get("/health")
def health():
    return {"status": "ok", "service": "noor-ai-engine"}
