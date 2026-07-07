import base64
import json
import requests
from typing import List, Dict, Any
from backend.config.settings import settings
from backend.utils.prompt import GEMINI_FOOD_CORRECTION_PROMPT

def build_gemini_payload(prompt: str, mime_type: str, image_b64: str) -> Dict[str, Any]:
    """Constructs the JSON request body structure for the Gemini API multimodal request.
    
    Args:
        prompt (str): The text instruction prompt.
        mime_type (str): The MIME type of the image.
        image_b64 (str): The base64-encoded image bytes.
        
    Returns:
        Dict[str, Any]: The structured payload dictionary matching the Gemini REST API.
    """
    return {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": image_b64
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

def query_gemini_correction(
    image_bytes: bytes,
    content_type: str,
    raw_detections: List[Dict[str, Any]],
    api_key: str
) -> Dict[str, Any]:
    """Sends the food image and raw YOLO coordinate detections to Gemini API for correction and macros.
    
    Args:
        image_bytes (bytes): Binary bytes of the uploaded food image.
        content_type (str): Image content format MIME type (e.g. image/jpeg).
        raw_detections (List[Dict[str, Any]]): Original localized coordinates from YOLOv8.
        api_key (str): The Gemini API key.
        
    Returns:
        Dict[str, Any]: Corrected food items, coordinates, and calorie/macro details.
    """
    # Inline base64 encoding (helper function removed as requested by lead)
    encoded_image = base64.b64encode(image_bytes).decode('utf-8')
    
    # Import system prompt template from separate prompts module
    prompt = GEMINI_FOOD_CORRECTION_PROMPT.format(raw_detections=json.dumps(raw_detections))
    
    # Build payload using helper function
    payload = build_gemini_payload(prompt, content_type, encoded_image)
    
    url = f"{settings.GEMINI_API_URL}?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"Gemini API returned status {response.status_code}: {response.text}")
        
    result_json = response.json()
    text_content = result_json["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(text_content.strip())
