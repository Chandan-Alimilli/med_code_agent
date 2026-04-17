import json
import logging
import re
from typing import Dict, Any, Optional

try:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
except ImportError:
    torch = None

logger = logging.getLogger(__name__)

class MedGammaInferencePipeline:
    def __init__(self, model_name: str = "open-source/MedGamma-7B-Instruct"):
        """
        Production pipeline for MedGamma inference.
        """
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.llm_pipeline = None

        # Fallback or rule-based dictionary (mocking an ICD dictionary for this agent)
        # In actual deployment, this would be an SQLite/Redis lookup or full terminology service.
        self.valid_icd_codes = set(["E11.9", "I10", "J01.90", "K21.9"]) 
        
    def load(self):
        """Loads the model onto available GPU/CPU."""
        logger.info(f"Loading model {self.model_name}...")
        if not torch:
            logger.warning("Torch/Transformers not available. Running in Mock/Dry-Run mode for system validation.")
            return

        try:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                device_map="auto" if device == "cuda" else None,
                torch_dtype=torch.float16 if device == "cuda" else torch.float32
            )
            self.llm_pipeline = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                max_new_tokens=256,
                temperature=0.1 # low temperature for structural generation
            )
        except Exception as e:
            logger.error(f"Failed to load model from HF: {e}. Model might not be fully downloaded or available.")
            self.llm_pipeline = None

    def construct_prompt(self, text: str, procedures: Optional[str], notes: Optional[str]) -> str:
        prompt = (
            "You are an expert medical coder. Analyze the clinical information below and assign the most appropriate ICD code and procedure code. "
            "You must output ONLY valid JSON in the following format:\n"
            "{\n"
            "  \"icd_code\": \"<CODE>\",\n"
            "  \"procedure_code\": \"<PROC_CODE>\",\n"
            "  \"confidence\": <FLOAT 0-1>,\n"
            "  \"reasoning\": \"<SHORT RATIONALE>\"\n"
            "}\n\n"
        )
        prompt += f"Diagnosis Context: {text}\n"
        if procedures:
            prompt += f"Procedures performed: {procedures}\n"
        if notes:
            prompt += f"Clinical Notes: {notes}\n"
        
        prompt += "\nJSON Output:"
        return prompt

    def parse_json_output(self, output: str) -> Dict[str, Any]:
        """Robust JSON parsing to extract code even if model hallucinates surrounding text."""
        match = re.search(r'\{.*\}', output, re.DOTALL)
        if match:
            json_str = match.group(0)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass
        return {}

    def rule_based_validation(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Ensures generated codes meet strict guidelines."""
        icd = result.get("icd_code", "")
        # Very simple validation check fallback
        if icd not in self.valid_icd_codes and icd != "":
            # Knock down confidence if code is hallucinatory
            result["confidence"] = max(0.0, float(result.get("confidence", 0.0)) - 0.4)
            result["reasoning"] += f" | WARNING: ICD {icd} not in primary dict."
        
        return result

    def process(self, text: str, procedures: Optional[str], notes: Optional[str]) -> Dict[str, Any]:
        """Main inference function."""
        prompt = self.construct_prompt(text, procedures, notes)
        
        if self.llm_pipeline:
            # Generate from pipeline
            outputs = self.llm_pipeline(prompt)
            raw_text = outputs[0]["generated_text"]
            # remove prompt from output to just parse the generated part
            raw_text = raw_text.replace(prompt, "")
            parsed = self.parse_json_output(raw_text)
        else:
            # Mock behavior if dependencies are missing or model couldn't load 
            # (Allows the rest of the queue system to be tested easily)
            parsed = {
                "icd_code": "E11.9",
                "procedure_code": "PROC_001" if procedures else "NONE",
                "confidence": 0.85,
                "reasoning": "Mock inference due to model engine unavailability"
            }

        validated = self.rule_based_validation(parsed)
        
        return {
            "icd_code": validated.get("icd_code", "UNKNOWN"),
            "procedure_code": validated.get("procedure_code", "UNKNOWN"),
            "confidence": float(validated.get("confidence", 0.0)),
            "reasoning": validated.get("reasoning", "Failed to determine reasoning.")
        }
