import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(CURRENT_DIR, '../dataset.csv') 
MODEL_FILE = os.path.join(CURRENT_DIR, 'flood_risk_model.pkl')

def load_data():
    if os.path.exists(DATASET_PATH):
        print(f"Membaca dataset dari: {DATASET_PATH}")
        return pd.read_csv(DATASET_PATH)
    else:
        raise FileNotFoundError(f"❌ File {DATASET_PATH} gak ketemu! Run 'node src/get_dataset.js' dulu!")

def add_realistic_noise(df, features):
    
    df_noisy = df.copy()
    
    noise_rain = np.random.normal(0, 15, df_noisy.shape[0])
    df_noisy['rain_sum_24h'] += noise_rain
    
    noise_soil = np.random.normal(0, 0.05, df_noisy.shape[0])
    df_noisy['soil_moisture_avg'] += noise_soil
    
    noise_wind = np.random.normal(0, 5, df_noisy.shape[0])
    df_noisy['wind_gust_max'] += noise_wind

    df_noisy[features] = df_noisy[features].mask(df_noisy[features] < 0, 0)
    
    return df_noisy

def train():
    df_clean = load_data()
    
    features = ['lat', 'lon', 'elevation', 'temp_avg', 'humidity_avg', 
                'rain_sum_24h', 'rain_peak_1h', 'soil_moisture_avg', 
                'pressure_min', 'wind_gust_max']
    
    df_noisy = add_realistic_noise(df_clean, features)

    X = df_noisy[features]      
    y = df_clean['risk_label']  

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y)
    
    model = RandomForestClassifier(
        n_estimators=200,     
        max_depth=10,         
        min_samples_split=5,  
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    print("\n" + "="*40)
    print(f"HASIL TRAINING")
    print("="*40)
    print(f"Akurasi Model: {acc*100:.2f}%")
    
    print("\nDetail Performa per Label")
    print(classification_report(y_test, y_pred))

    joblib.dump(model, MODEL_FILE)
    print(f"\nModel 'otak' AI disimpan ke: {MODEL_FILE}")
    
    print("\nFaktor Apa yang Paling Dilihat AI?")
    importances = pd.Series(model.feature_importances_, index=features).sort_values(ascending=False)
    print(importances.head(5))

if __name__ == "__main__":
    train()