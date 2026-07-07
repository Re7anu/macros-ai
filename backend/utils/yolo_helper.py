from PIL import Image
from ultralytics import YOLO
from typing import List, Dict, Any
from backend.config.settings import settings

def load_yolo_model() -> YOLO:
    return YOLO(settings.YOLO_MODEL_PATH)

def run_yolo_inference(model: YOLO, image: Image.Image) -> List[Dict[str, Any]]:
    img_width, img_height = image.size
    results = model(image, conf=settings.YOLO_CONF_THRESHOLD)
    detections = []
    
    for box in results[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        conf = float(box.conf[0])
        cls_id = int(box.cls[0])
        label = model.names[cls_id]
        
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
    return detections
