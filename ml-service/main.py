from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
import os

from model import predict_viral

app = FastAPI(title="viral-studio-ml-service", version="0.1.0")


class ViralFeatures(BaseModel):
    hook_score: float = Field(default=50, ge=0, le=100)
    trend_score: float = Field(default=50, ge=0, le=100)
    emotion_score: float = Field(default=50, ge=0, le=100)
    curiosity_gap: float = Field(default=50, ge=0, le=100)
    video_length: float = Field(default=20, ge=1, le=180)
    scene_count: float = Field(default=4, ge=1, le=20)
    visual_novelty: float = Field(default=50, ge=0, le=100)


class PredictRequest(BaseModel):
    features: ViralFeatures


class PredictResponse(BaseModel):
    probability: float
    estimatedViews: int
    confidence: Literal["high", "medium", "low"]
    label: Literal["HIGH VIRAL POTENTIAL", "LOW VIRAL POTENTIAL"]


def _check_auth(authorization: str | None) -> None:
    api_key = os.getenv("ML_SERVICE_API_KEY", "").strip()
    if not api_key:
        return
    if authorization != f"Bearer {api_key}":
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health() -> dict:
    return {"ok": True, "model": "sklearn-logreg"}


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest, authorization: str | None = Header(default=None)) -> PredictResponse:
    _check_auth(authorization)
    return PredictResponse(**predict_viral(payload.features.model_dump()))
