import logging
from fastapi import FastAPI, HTTPException
from schema import ClaimProcessingRequest, ClaimProcessingResponse
from pipeline.model import MedGammaInferencePipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MedGamma Claims Inference API", version="1.0.0")

# Global pipeline instance (loaded on startup)
pipeline: MedGammaInferencePipeline = None

@app.on_event("startup")
async def startup_event():
    global pipeline
    logger.info("Initializing MedGamma pipeline...")
    pipeline = MedGammaInferencePipeline()
    pipeline.load()
    logger.info("MedGamma pipeline ready.")

@app.post("/api/v1/infer", response_model=ClaimProcessingResponse)
async def infer_claim(request: ClaimProcessingRequest):
    global pipeline
    if not pipeline:
        raise HTTPException(status_code=503, detail="Model pipeline is not ready yet.")
    
    try:
        result = pipeline.process(
            text=request.input_text,
            procedures=request.procedure_description,
            notes=request.clinical_notes
        )
        
        return ClaimProcessingResponse(
            record_id=request.record_id,
            icd_code=result.get("icd_code", "UNKNOWN"),
            procedure_code=result.get("procedure_code", "UNKNOWN"),
            confidence=result.get("confidence", 0.0),
            reasoning=result.get("reasoning", "Failure in inference.")
        )
    except Exception as e:
        logger.error(f"Inference failed for record {request.record_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Inference processing error")

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": pipeline is not None}
