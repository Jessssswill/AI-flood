import sys
import json
import joblib
import pandas as pd
import os
import numpy as np

# Load Otak AI (.pkl)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, 'flood_risk_model.pkl')

try:
    model = joblib.load(MODEL_PATH)
except FileNotFoundError:
    print(json.dumps({"error": "Model file .pkl tidak ditemukan. Jalankan train_model.py dulu!"}))
    sys.exit(1)

# Terima Data dari Server.js
try:
    input_json = sys.argv[1] 
    input_data = json.loads(input_json)

    # Susun data agar sesuai urutan saat training
    features = [
        'lat', 'lon', 'elevation', 'temp_avg', 'humidity_avg', 
        'rain_sum_24h', 'rain_peak_1h', 'soil_moisture_avg', 
        'pressure_min', 'wind_gust_max'
    ]
    df = pd.DataFrame([input_data], columns=features)

    # Prediksi
    prediction_label = model.predict(df)[0]        # Hasil: "AMAN", "WASPADA", dll
    probabilities = model.predict_proba(df)[0]     # Tingkat keyakinan
    confidence = max(probabilities) * 100

    # Konversi Label ke Skor (0-100)
    risk_score = 10
    color = "green"
    
    if prediction_label == "BAHAYA":
        risk_score = 95
        color = "red"
    elif prediction_label == "SIAGA":
        risk_score = 75
        color = "orange"
    elif prediction_label == "WASPADA":
        risk_score = 50
        color = "yellow"

    # Kirim Balik ke Server.js
    result = {
        "status": prediction_label,
        "finalRisk": int(risk_score),
        "color": color,
        "confidence": round(confidence, 1)
    }
    print(json.dumps(result))

except Exception as e:
    print(json.dumps({"error": str(e)}))