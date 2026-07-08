from pydantic import BaseModel, Field
from typing import List, Optional

# --- Gemini Request Schemas ---

class InlineData(BaseModel):
    """Represents inline binary data (like Base64 image bytes) sent to the Gemini API."""
    mimeType: str
    data: str

class Part(BaseModel):
    """Represents a single part of a request content (can be text prompt or inline media)."""
    text: Optional[str] = None
    inlineData: Optional[InlineData] = None

class Content(BaseModel):
    """Represents the content structure containing multiple parts (prompts + images)."""
    parts: List[Part]

class GenerationConfig(BaseModel):
    """Specifies parameters to control the Gemini API model response format."""
    responseMimeType: str

class GeminiRequestPayload(BaseModel):
    """Complete root payload schema for the Gemini API content generation request."""
    contents: List[Content]
    generationConfig: GenerationConfig


# --- Gemini Response Schemas ---

class GeminiPart(BaseModel):
    """Represents the returned text part from a Gemini API model candidate."""
    text: str

class GeminiContent(BaseModel):
    """Represents the content list inside a Gemini model candidate."""
    parts: List[GeminiPart]

class GeminiCandidate(BaseModel):
    """Represents a single candidate generation returned by the Gemini API."""
    content: GeminiContent

class GeminiResponse(BaseModel):
    """Complete root response validation schema for the Gemini API content generation endpoint."""
    candidates: List[GeminiCandidate]
