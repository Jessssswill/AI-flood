import joblib
import os
import pandas as pd

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(CURRENT_DIR, 'flood_risk_model.pkl')

print(f"🔍 Mencoba membuka: {MODEL_FILE}")

try:
    model = joblib.load(MODEL_FILE)
    
    print("\n✅ BERHASIL LOAD MODEL!")
    print("-" * 30)
    
    print(f"🤖 Tipe Algoritma: {type(model).__name__}")
    
    print(f"⚙️  Konfigurasi (Params):")
    print(f"    - Jumlah Pohon (Estimators): {model.n_estimators}")
    print(f"    - Kedalaman Maksimal: {model.max_depth}")
    feature_names = [
        'lat', 'lon', 'elevation', 'temp_avg', 'humidity_avg', 
        'rain_sum_24h', 'rain_peak_1h', 'soil_moisture_avg', 
        'pressure_min', 'wind_gust_max'
    ]
    
    print("\n📊 FITUR PALING PENTING MENURUT AI:")
    importances = pd.Series(model.feature_importances_, index=feature_names)
    print(importances.sort_values(ascending=False))

    print("\n🔮 Simulasi Prediksi Data Sembarang:")
    dummy_data = [[-6.2, 106.8, 5, 28, 85, 160, 40, 0.7, 1005, 50]] 
    prediksi = model.predict(dummy_data)[0]
    probabilitas = model.predict_proba(dummy_data)[0]
    
    print(f"    Input: Hujan Deras 160mm, Tanah Basah")
    print(f"    Hasil Prediksi: {prediksi}")
    print(f"    Confidence: {max(probabilitas)*100:.2f}% yakin")

except FileNotFoundError:
    print("File .pkl gak ketemu! Jalankan train_model.py dulu.")
except Exception as e:
    print(f"Error lain: {e}")