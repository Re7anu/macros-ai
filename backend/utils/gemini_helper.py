import base64
import json
import requests
from typing import List, Dict, Any
from backend.config.settings import settings

def encode_image_to_base64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode('utf-8')

def query_gemini_correction(
    image_bytes: bytes,
    content_type: str,
    raw_detections: List[Dict[str, Any]],
    api_key: str
) -> Dict[str, Any]:
    encoded_image = encode_image_to_base64(image_bytes)
    
    prompt = f"""
    You are an expert nutritionist and computer vision AI.
    We ran a YOLOv8 model on this food image and got these raw detections:
    {json.dumps(raw_detections)}

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
    
    url = f"{settings.GEMINI_API_URL}?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": content_type,
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
    
    if response.status_code != 200:
        raise Exception(f"Gemini API returned status {response.status_code}: {response.text}")
        
    result_json = response.json()
    text_content = result_json["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(text_content.strip())
