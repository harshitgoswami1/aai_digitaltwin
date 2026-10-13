# Applied AI CASE STUDY 5 - Digital Twin For the Industry


The [training notebook](notebooks/01_machine_failure_prediction.ipynb) uses the [UCI AI4I 2020 Predictive Maintenance dataset](https://archive.ics.uci.edu/dataset/601/ai4i) (CC BY 4.0) copied to `data/ai4i2020.csv`. Its trained model is saved at `models/machine_failure.joblib`.

## Run the local API

```sh
uv sync
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Open [interactive API docs](http://127.0.0.1:8000/docs), or send a prediction:

```sh
curl -X POST http://127.0.0.1:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{"air_temperature_k":300.8,"process_temperature_k":312.0,"rotational_speed_rpm":1443,"torque_nm":53.3,"tool_wear_min":151}'
```

The response has `failure_score` (0–1), `failure_alert` (score at or above the learned threshold), and `alert_threshold`. `GET /health` reports whether the API is running. The service rejects missing, extra, non-finite, or negative sensor values. It allows local frontend origins on ports 3000 and 5173; set `CORS_ORIGINS` to a comma-separated list if your frontend runs elsewhere.

## Run the notebook

```sh
uv sync --extra notebook
uv run --extra notebook jupyter notebook
```

Run all cells from the repository root or the `notebooks` directory. The notebook evaluates a chronological holdout and exports the model plus `models/machine_failure_metadata.json`. Its inputs are air temperature (K), process temperature (K), rotational speed (rpm), torque (Nm), and tool wear (min).

The dataset is synthetic and has **no vibration measurement**. Its label indicates failure at the recorded operating point, not failure in a future time window. Add a measured vibration feature and future outcome labels before using this as a forward-looking maintenance alert.
