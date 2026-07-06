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
logger = logging.getLogger("macros-ai-backend")

app = FastAPI(title="Macros AI Backend")

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
        # Ensure image is in RGB format
        if image.mode != "RGB":
            image = image.convert("RGB")
    except Exception as e:
        logger.error(f"Failed to process uploaded image: {e}")
        raise HTTPException(status_code=400, detail="Invalid image file.")

    # 2. Run YOLOv8 Object Detection to get initial candidate boxes
    try:
        results = model(image)
        detections = []
        img_width, img_height = image.size
        
        for box in results[0].boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            
            # Format detection (relative coordinates)
            detections.append({
                "label": label,
                "confidence": conf,
                "box": [
                    x1 / img_width,
                    y1 / img_height,
                    x2 / img_width,
                    y2 / img_height
                ]
            })
    except Exception as e:
        logger.error(f"YOLO detection failed: {e}")
        detections = []

    # 3. Retrieve Gemini API Key (header or env)
    api_key = x_gemini_key or os.environ.get("GEMINI_API_KEY")
    
    # Default fallback data if no Gemini key is provided
    response_data = {
        "detections": detections,
        "nutrition": {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "portion_size": "N/A",
            "detected_foods": [d["label"] for d in detections],
            "insights": "Please set up your Gemini API Key in the settings to run Gemini's smart correction and get real calorie estimation."
        },
        "api_key_configured": False
    }

    # 4. If Gemini API Key is available, run multimodal inference to correct YOLO's detections
    if api_key:
        try:
            # Direct Gemini Prompt for correction and calorie estimation
            prompt = f"""
            You are an expert nutritionist and computer vision AI.
            We ran a YOLOv8 model on this food image and got these raw detections:
            {json.dumps(detections)}

            Analyze the image and the YOLO detections:
            1. Correct the labels of the bounding boxes to match the actual food items. (e.g. if a box is labeled 'pizza' or 'fork' but it contains 'grilled chicken', correct the label to 'Grilled Chicken').
            2. Ignore boxes that contain only cutlery or empty plates (like forks, knives, tables) unless they contain food (like a bowl of ketchup/sauce).
            3. Estimate the portion size, calories, protein (g), carbs (g), and fat (g) for the food items.
            4. If you see food items that YOLO completely missed, you can add new bounding boxes for them (with coordinates as [x_min, y_min, x_max, y_max] from 0.0 to 1.0 relative to image size).

            Return your response EXACTLY as a JSON object with the following structure:
            {{
              "detections": [
                {{
                  "label": "Corrected Food Name (e.g. Grilled Chicken)",
                  "confidence": 0.95,
                  "box": [x_min, y_min, x_max, y_max]
                }}
              ],
              "nutrition": {{
                "calories": integer,
                "protein": integer,
                "carbs": integer,
                "fat": integer,
                "portion_size": "portion description (e.g. 2 pieces, approx 200g)",
                "detected_foods": ["list of corrected food items"],
                "insights": "a short 1-2 sentence recommendation or tip about this meal"
              }}
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
                
                # Parse Gemini corrected JSON response
                gemini_data = json.loads(text_content.strip())
                response_data = {
                    "detections": gemini_data.get("detections", []),
                    "nutrition": gemini_data.get("nutrition", {}),
                    "api_key_configured": True
                }
            else:
                logger.error(f"Gemini API returned status {response.status_code}: {response.text}")
                response_data["nutrition"]["insights"] = "Gemini API error. Please check your API key."
        except Exception as e:
            logger.error(f"Gemini correction pipeline failed: {e}")
            response_data["nutrition"]["insights"] = f"Failed to get nutritional data: {str(e)}"

    return response_data
