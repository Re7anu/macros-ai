import io
import os
import base64
import json
import logging
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import requests
from ultralytics import YOLO

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("calorie-ai-backend")

app = FastAPI(title="Calorie AI Backend")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize YOLOv8 Model (downloads weights automatically on first run)
logger.info("Loading YOLOv8 model...")
try:
    model = YOLO("yolov8n.pt")
    logger.info("YOLOv8 model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load YOLOv8 model: {e}")
    model = None

# Health check endpoint
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "yolo_loaded": model is not None
    }

@app.post("/api/detect")
async def detect_food(
    file: UploadFile = File(...),
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key")
):
    if not model:
        raise HTTPException(status_code=500, detail="YOLO model is not loaded.")
    
    # 1. Read uploaded image
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        # Ensure image is in RGB format for YOLO/PIL
        if image.mode != "RGB":
            image = image.convert("RGB")
    except Exception as e:
        logger.error(f"Failed to process uploaded image: {e}")
        raise HTTPException(status_code=400, detail="Invalid image file.")

    # 2. Run YOLOv8 Object Detection
    try:
        results = model(image)
        detections = []
        img_width, img_height = image.size
        
        for box in results[0].boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            
            # Format detection for frontend (relative percentage coords are easiest for canvas scaling)
            detections.append({
                "label": label,
                "confidence": conf,
                "box": [
                    x1 / img_width,   # x_min relative
                    y1 / img_height,  # y_min relative
                    x2 / img_width,   # x_max relative
                    y2 / img_height   # y_max relative
                ]
            })
    except Exception as e:
        logger.error(f"YOLO detection failed: {e}")
        detections = []

    # 3. Retrieve Gemini API Key (header or env)
    api_key = x_gemini_key or os.environ.get("GEMINI_API_KEY")
    
    nutrition_data = {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "portion_size": "N/A",
        "detected_foods": [d["label"] for d in detections if d["label"] in ["banana", "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake"]],
        "insights": "Please set up your Gemini API Key in the settings to get real calorie estimation."
    }

    # 4. If Gemini API Key is available, run multimodal inference
    if api_key:
        try:
            # Prepare prompt with YOLO helper context
            yolo_labels = [d["label"] for d in detections]
            prompt = f"""
            Analyze this food image. YOLOv8 detected the following objects: {', '.join(yolo_labels)}.
            Provide an accurate nutritional estimation for the food items visible in this image.
            Return your response EXACTLY as a JSON object with the following fields:
            {{
              "calories": integer,
              "protein": integer, (in grams)
              "carbs": integer, (in grams)
              "fat": integer, (in grams)
              "portion_size": "string describing the portion, e.g., '1 plate, approx 350g'",
              "detected_foods": ["list of actual food items identified by you"],
              "insights": "a short 1-2 sentence recommendation or tip about this meal"
            }}
            Do not include any markdown formatting (like ```json) in your response, just return the raw JSON object.
            """
            
            # Encode image to base64
            encoded_image = base64.b64encode(image_bytes).decode('utf-8')
            
            # Call Gemini API
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inlineData": {
                                    "mimeType": file.content_type or "image/jpeg",
                                    "data": encoded_image
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            
            headers = {"Content-Type": "application/json"}
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                result_json = response.json()
                text_content = result_json["contents"][0]["parts"][0]["text"]
                # Parse Gemini JSON response
                nutrition_data = json.loads(text_content.strip())
            else:
                logger.error(f"Gemini API returned status {response.status_code}: {response.text}")
                nutrition_data["insights"] = "Gemini API error. Please check your API key."
        except Exception as e:
            logger.error(f"Gemini API request failed: {e}")
            nutrition_data["insights"] = f"Failed to get nutritional data: {str(e)}"
    else:
        logger.info("No Gemini API key provided. Returning YOLO detections with mock warning.")

    return {
        "detections": detections,
        "nutrition": nutrition_data,
        "api_key_configured": api_key is not None
    }
