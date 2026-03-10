# Viral Studio ML Service

Small FastAPI + scikit-learn service used by `viral-studio-services` for live viral prediction.

## Endpoints

- `GET /health`
- `POST /predict`

Request:

```json
{
  "features": {
    "hook_score": 82,
    "trend_score": 74,
    "emotion_score": 65,
    "curiosity_gap": 90,
    "video_length": 23,
    "scene_count": 4,
    "visual_novelty": 70
  }
}
```

Response:

```json
{
  "probability": 0.72,
  "estimatedViews": 1300000,
  "confidence": "high",
  "label": "HIGH VIRAL POTENTIAL"
}
```

## Local run

```bash
cd ml-service
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

## Railway

Use this folder as the service root (`ml-service`) and deploy with `railway.json`.

Optional auth variable on ML service:

- `ML_SERVICE_API_KEY`

Then set these on `viral-studio-api`:

- `VIRAL_STUDIO_ML_SERVICE_URL` = ML service public URL (without `/predict`)
- `VIRAL_STUDIO_ML_API_KEY` = same value as `ML_SERVICE_API_KEY` (if used)
- `VIRAL_STUDIO_ML_TIMEOUT_MS` = e.g. `3500`
