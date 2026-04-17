from pydantic import BaseModel, Field
from typing import Optional

class ClaimProcessingRequest(BaseModel):
    record_id: str = Field(..., description="Unique DB record ID to process")
    input_text: str = Field(..., description="Diagnosis text or chief complaint")
    procedure_description: Optional[str] = Field(None, description="Description of the procedure taken")
    clinical_notes: Optional[str] = Field(None, description="Additional context or doctor notes")

class ClaimProcessingResponse(BaseModel):
    record_id: str
    icd_code: str = Field(..., description="Predicted ICD code. Example: 'E11.9'")
    procedure_code: str = Field(..., description="Predicted procedure code or normalized label")
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0")
    reasoning: str = Field(..., description="A short summary of the medical rationale")
    model_used: str = Field(default="medgamma")
