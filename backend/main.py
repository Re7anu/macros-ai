import io
import os
import logging
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from backend.config.settings import settings
from backend.schemas.nutrition import ScanResponse
from backend.utils.yolo_helper import load_yolo_model, run_yolo_inference
from backend.utils.gemini_helper import query_gemini_correction

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("macros-ai-backend")

app = FastAPI(title="Macros AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model
try:
    yolo_model = load_yolo_model()
    logger.info("YOLOv8 model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load YOLOv8 model: {e}")
    yolo_model = None

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "yolo_loaded": yolo_model is not None
    }

@app.post("/api/detect", response_model=ScanResponse)
async def detect_food(
    file: UploadFile = File(...),
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key")
):
    if not yolo_model:
        raise HTTPException(status_code=500, detail="YOLO model is not loaded.")
    
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")
    except Exception as e:
        logger.error(f"Failed to process image: {e}")
        raise HTTPException(status_code=400, detail="Invalid image file.")
    
    # Run YOLO
    try:
        raw_detections = run_yolo_inference(yolo_model, image)
    except Exception as e:
        logger.error(f"YOLO inference failed: {e}")
        raw_detections = []
    
    api_key = x_gemini_key or os.environ.get("GEMINI_API_KEY")
    
    # Default fallback response
    response_data = {
        "raw_detections": raw_detections,
        "detections": raw_detections,
        "nutrition": {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "portion_size": "N/A",
            "detected_foods": [d["label"] for d in raw_detections],
            "insights": "Please set up your Gemini API Key in the settings to run Gemini's smart correction and get real calorie estimation."
        },
        "api_key_configured": False
    }
    
    if api_key:
        try:
            gemini_result = query_gemini_correction(
                image_bytes=image_bytes,
                content_type=file.content_type or "image/jpeg",
                raw_detections=raw_detections,
                api_key=api_key
            )
            response_data = {
                "raw_detections": raw_detections,
                "detections": gemini_result.get("detections", []),
                "nutrition": gemini_result.get("nutrition", {}),
                "api_key_configured": True
            }
        except Exception as e:
            logger.error(f"Gemini correction pipeline failed: {e}")
            response_data["nutrition"]["insights"] = f"Failed to get nutritional data: {str(e)}"
            
    return response_data
