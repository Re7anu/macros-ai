class Settings:
    YOLO_MODEL_PATH: str = "yolov8n.pt"
    YOLO_CONF_THRESHOLD: float = 0.40
    GEMINI_API_URL: str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    PORT: int = 8000

settings = Settings()
