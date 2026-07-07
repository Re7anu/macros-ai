from pydantic import BaseModel, Field
from typing import List

class BoundingBox(BaseModel):
    label: str
    confidence: float
    box: List[float] = Field(..., description="[x_min, y_min, x_max, y_max] in relative percentages (0.0 to 1.0)")

class NutritionData(BaseModel):
    calories: int
    protein: int
    carbs: int
    fat: int
    portion_size: str
    detected_foods: List[str]
    insights: str

class ScanResponse(BaseModel):
    raw_detections: List[BoundingBox]
    detections: List[BoundingBox]
    nutrition: NutritionData
    api_key_configured: bool
