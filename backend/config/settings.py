class Settings:
    """Application configuration settings, model paths, API endpoints, and detection thresholds."""
    
    YOLO_MODEL_PATH: str = "yolov8n.pt"
    YOLO_CONF_THRESHOLD: float = 0.40
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash"
    GEMINI_API_URL: str = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL_NAME}:generateContent"
    PORT: int = 8000

settings = Settings()
