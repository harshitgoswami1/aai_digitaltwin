"""Local API for the AI4I machine failure classifier."""

import os
from pathlib import Path
from typing import Annotated

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field


MODEL_PATH = Path(__file__).resolve().parent / "models" / "machine_failure.joblib"
artifact = joblib.load(MODEL_PATH)
FEATURE_COLUMNS = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]",
]
if artifact["features"] != FEATURE_COLUMNS:
    raise RuntimeError("The saved model's feature contract does not match this API")


class PredictionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    air_temperature_k: Annotated[float, Field(gt=0, allow_inf_nan=False)]
    process_temperature_k: Annotated[float, Field(gt=0, allow_inf_nan=False)]
    rotational_speed_rpm: Annotated[float, Field(gt=0, allow_inf_nan=False)]
    torque_nm: Annotated[float, Field(ge=0, allow_inf_nan=False)]
    tool_wear_min: Annotated[float, Field(ge=0, allow_inf_nan=False)]


class PredictionOutput(BaseModel):
    failure_score: float
    failure_alert: bool
    alert_threshold: float


app = FastAPI(
    title="Machine failure API",
    description="Classifies failure at the observed operating point using the synthetic UCI AI4I dataset. No vibration input or future failure horizon is available.",
)
origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionOutput)
def predict(data: PredictionInput) -> PredictionOutput:
    frame = pd.DataFrame([{
        "Air temperature [K]": data.air_temperature_k,
        "Process temperature [K]": data.process_temperature_k,
        "Rotational speed [rpm]": data.rotational_speed_rpm,
        "Torque [Nm]": data.torque_nm,
        "Tool wear [min]": data.tool_wear_min,
    }], columns=FEATURE_COLUMNS)
    score = float(artifact["model"].predict_proba(frame)[0, 1])
    threshold = float(artifact["threshold"])
    return PredictionOutput(
        failure_score=score,
        failure_alert=score >= threshold,
        alert_threshold=threshold,
    )
