from pydantic import BaseModel, Field

class Settings(BaseModel):
    """Application configuration settings and model thresholds validated with Pydantic."""
    
    YOLO_MODEL_PATH: str = "yolov8n.pt"
    YOLO_CONF_THRESHOLD: float = Field(0.40, ge=0.0, le=1.0, description="Confidence threshold for YOLOv8 (0.0 to 1.0)")
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash"
    GEMINI_API_URL: str = "https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
    GEMINI_TEMPERATURE: float = Field(0.2, ge=0.0, le=2.0, description="Randomness/creativity temperature for the Gemini model")
    PORT: int = 8000

    def get_gemini_url(self) -> str:
        """Returns the formatted Gemini API URL with the configured model name."""
        return self.GEMINI_API_URL.format(model_name=self.GEMINI_MODEL_NAME)

settings = Settings()
