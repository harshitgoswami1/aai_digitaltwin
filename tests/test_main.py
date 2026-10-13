import pandas as pd
from fastapi.testclient import TestClient

from main import FEATURE_COLUMNS, app, artifact


client = TestClient(app)
valid_input = {
    "air_temperature_k": 300.8,
    "process_temperature_k": 312.0,
    "rotational_speed_rpm": 1443,
    "torque_nm": 53.3,
    "tool_wear_min": 151,
}


def test_predict_matches_saved_model():
    response = client.post("/predict", json=valid_input)
    assert response.status_code == 200
    result = response.json()
    frame = pd.DataFrame([[300.8, 312.0, 1443, 53.3, 151]], columns=FEATURE_COLUMNS)
    expected = float(artifact["model"].predict_proba(frame)[0, 1])
    assert result == {
        "failure_score": expected,
        "failure_alert": expected >= artifact["threshold"],
        "alert_threshold": artifact["threshold"],
    }


def test_rejects_missing_extra_and_invalid_inputs():
    for payload in (
        {key: value for key, value in valid_input.items() if key != "torque_nm"},
        {**valid_input, "vibration": 0.2},
        {**valid_input, "rotational_speed_rpm": -1},
        {**valid_input, "torque_nm": "NaN"},
    ):
        assert client.post("/predict", json=payload).status_code == 422


def test_health_and_local_frontend_cors():
    assert client.get("/health").json() == {"status": "ok"}
    response = client.options(
        "/predict",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
