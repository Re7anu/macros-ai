from pydantic import BaseModel, Field
from typing import List

class BoundingBox(BaseModel):
    """Represents a coordinate boundary, class label, and prediction confidence for a single detected item."""
    label: str
    confidence: float
    box: List[float] = Field(..., description="[x_min, y_min, x_max, y_max] in relative percentages (0.0 to 1.0)")

class NutritionData(BaseModel):
    """Encapsulates Gemini-estimated nutrition details including calories, macronutrients, and custom recommendations."""
    calories: int
    protein: int
    carbs: int
    fat: int
    portion_size: str
    detected_foods: List[str]
    insights: str

class ScanResponse(BaseModel):
    """Defines the complete API response schema containing raw YOLO coordinates, Gemini corrected objects, and macros."""
    raw_detections: List[BoundingBox]
    detections: List[BoundingBox]
    nutrition: NutritionData
    api_key_configured: bool
