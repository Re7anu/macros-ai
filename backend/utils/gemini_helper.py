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
        Dict[str, Any]: The structured payload dictionary.
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
            "responseMimeType": "application/json",
            "temperature": settings.GEMINI_TEMPERATURE
        }
    }

def calculate_iou(box1: List[float], box2: List[float]) -> float:
    """Calculates Intersection over Union (IoU) between two bounding boxes.
    Boxes are in format [x_min, y_min, x_max, y_max].
    """
    x_left = max(box1[0], box2[0])
    y_top = max(box1[1], box2[1])
    x_right = min(box1[2], box2[2])
    y_bottom = min(box1[3], box2[3])
    
    if x_right < x_left or y_bottom < y_top:
        return 0.0
        
    intersection_area = (x_right - x_left) * (y_bottom - y_top)
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = box1_area + box2_area - intersection_area
    
    if union_area <= 0:
        return 0.0
        
    return intersection_area / union_area

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
    # Base64 encode the image
    encoded_image = base64.b64encode(image_bytes).decode('utf-8')
    
    # Strip segment coordinates from raw_detections to minimize prompt token payload
    clean_raw_detections = []
    for det in raw_detections:
        clean_raw_detections.append({
            "label": det["label"],
            "confidence": det["confidence"],
            "box": det["box"]
        })
    
    # Format the prompt
    prompt = GEMINI_FOOD_CORRECTION_PROMPT.format(raw_detections=json.dumps(clean_raw_detections))
    
    # Build payload using simple helper
    payload = build_gemini_payload(prompt, content_type, encoded_image)
    
    # Send request to Gemini API
    url = f"{settings.get_gemini_url()}?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"Gemini API returned status {response.status_code}: {response.text}")
        
    response_json = response.json()
    
    # Extract corrected response string using simple direct lookup
    text_content = response_json["candidates"][0]["content"]["parts"][0]["text"]
    result = json.loads(text_content.strip())
    
    # Map raw YOLO segments back to Gemini corrected boxes using Intersection over Union (IoU)
    corrected_detections = result.get("detections", [])
    for g_det in corrected_detections:
        g_box = g_det.get("box", [0, 0, 0, 0])
        best_iou = 0.0
        best_segment = None
        
        for r_det in raw_detections:
            r_box = r_det.get("box", [0, 0, 0, 0])
            iou = calculate_iou(g_box, r_box)
            if iou > best_iou:
                best_iou = iou
                best_segment = r_det.get("segments")
        
        # If there's a good matching box overlap, transfer the segment coordinates
        if best_iou > 0.3:
            g_det["segments"] = best_segment
            
    return result
