import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { fetchDataset } from "./get_dataset.js";
import webpush from "web-push";
import bodyParser from "body-parser";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.static(__dirname));
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json()); 

const publicVapidKey = "BCvz2afRqbdk5C0SHVIHsXo2s6Sctv9Sm3gmXtsgkYKe4VEf1aUEmIBqZ1_rciwZg7PNCR-rJ89E9Vf-Pw-NOxw";
const privateVapidKey = "yOKQ5brLxjguuxIWMGau3NDiKAe_E2M4s-XfKhEEL_A";

webpush.setVapidDetails(
  "mailto:admin@floodguard.com", 
  publicVapidKey,
  privateVapidKey
);

let subscribers = [];

const TEST_MODE = true; 
function getFakeDangerData() {
    // Bikin grafik hujan buatan (naik drastis)
    const fakeRainHourly = new Array(24).fill(0).map((_, i) => (i > 10 && i < 16) ? 80 : 5); 

    return {
        locationName: "⚠️ SIMULASI BADAI ⚠️",
        final: {
            status: "BAHAYA",       // Status Merah
            finalRisk: 95,          // Skor Tinggi
            color: "red",
            confidence: 100
        },
        rain: {
            rain1h: 55.0,           // Hujan sejam terakhir deras
            rain3h: 120.0,
            rain6h: 200.0,
            raw6hrain: [10, 20, 80, 50, 20, 10]
        },
        elevation: 2, // Dataran rendah
        currentWeather: {
            temperature: 24,
            apparent_temperature: 22,
            humidity: 98,
            pressure: 990, 
            cloud_cover: 100,
            visibility: 2,
            wind_speed_10m: 45.0, 
            wind_direction_10m: 180,
            uv_index: 1,
            weathercode: 95 // Badai Petir
        },
        weatherData: {
            hourly: {
                time: Array.from({length: 24}, (_, i) => new Date(Date.now() + i * 3600000).toISOString()),
                rain: fakeRainHourly,
                precipitation: fakeRainHourly
            }
        }
    };
}

// --- FUNGSI AI ASLI ---
async function getAiPrediction(weatherData, lat, lon, elevation) {
    return new Promise((resolve, reject) => {
        const h = weatherData.hourly;
        // ... (Logic AI Asli sama seperti sebelumnya) ...
        const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        const sum = arr => arr.reduce((a, b) => a + b, 0);
        const max = arr => Math.max(...arr);
        const min = arr => Math.min(...arr);

        const inputFeatures = {
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            elevation: elevation,
            temp_avg: avg(h.temperature_2m),
            humidity_avg: avg(h.relative_humidity_2m),
            rain_sum_24h: sum(h.rain),
            rain_peak_1h: max(h.rain),
            soil_moisture_avg: avg(h.soil_moisture_0_to_1cm || [0.5]), 
            pressure_min: min(h.surface_pressure),
            wind_gust_max: max(h.wind_gusts_10m)
        };

        const pythonProcess = spawn('python', ['src/predict.py', JSON.stringify(inputFeatures)]);
        let resultData = '';

        pythonProcess.stdout.on('data', (data) => { resultData += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { console.error(`Python Error Log: ${data}`); });

        pythonProcess.on('close', (code) => {
            if (code !== 0) resolve({ status: "SISTEM ERROR", finalRisk: 0, color: "gray" });
            else {
                try { resolve(JSON.parse(resultData)); } 
                catch (e) { resolve({ status: "JSON ERROR", finalRisk: 0, color: "gray" }); }
            }
        });
    });
}

// --- PERBAIKAN 1: NOTIFIKASI BACKGROUND (SINKRON DENGAN TEST MODE) ---
setInterval(async () => {
  if (subscribers.length === 0) return;

  // JIKA MODE TEST AKTIF: Langsung kirim notif bahaya
  if (TEST_MODE) {
      console.log("🔥 [TEST MODE] Mengirim Simulasi Bahaya ke User...");
      const fake = getFakeDangerData();
      const payload = JSON.stringify({
          title: "🚨 PERINGATAN BAHAYA BANJIR!",
          body: `SIMULASI: Status ${fake.final.status}! Risiko: ${fake.final.finalRisk}%`
      });
      subscribers.forEach(sub => {
          webpush.sendNotification(sub.subscription, payload).catch(e => console.error(e));
      });
      return; // Stop, jangan jalankan logic asli
  }

  // JIKA MODE TEST MATI: Jalankan Logic Asli
  console.log("🔔 AI Background Check: Realtime Mode");
  for (const user of subscribers) {
    const { lat, lon, subscription } = user;
    try {
      const [weather, elevation] = await Promise.all([getWeather(lat, lon), getElevation(lat, lon)]);
      if (!weather) continue;

      const aiResult = await getAiPrediction(weather, lat, lon, elevation);
      console.log(`📍 ${lat}, ${lon} | Risk: ${aiResult.finalRisk}% | ${aiResult.status}`);

      if (aiResult.finalRisk > 70) {
        const payload = JSON.stringify({
          title: "🚨 PERINGATAN BANJIR AI",
          body: `Risiko ${aiResult.finalRisk}% — ${aiResult.status}`
        });
        await webpush.sendNotification(subscription, payload).catch(e => console.error(e));
      }
    } catch (err) { console.error(err.message); }
  }
}, TEST_MODE ? 10000 : 60000); // Kalau Test 10 detik, Asli 60 detik


// --- PERBAIKAN 2: ENDPOINT UI (DIPAKSA MERAH JIKA TEST MODE) ---
app.get("/risk", async (req, res) => {
  
  // 🔥 CEGAT DI SINI! Kalau Test Mode, kasih data palsu ke Frontend
  if (TEST_MODE) {
      console.log("⚠️ Frontend minta data -> Mengirim Data SIMULASI BAHAYA");
      return res.json(getFakeDangerData());
  }

  // --- LOGIC ASLI (Hanya jalan kalau TEST_MODE = false) ---
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "Lat/Lon dibutuhkan" });

  try {
    const [weather, elevation, locationName] = await Promise.all([
        getWeather(lat, lon),
        getElevation(lat, lon),
        getCityName(lat, lon)
    ]);

    const aiResult = await getAiPrediction(weather, lat, lon, elevation);
    const rain = calculateRainScore(weather);

    let currentWeather = null;
    if (weather && weather.hourly) {
      const h = weather.hourly;
      currentWeather = {
        temperature: h.temperature_2m[0],
        apparent_temperature: h.apparent_temperature[0],
        humidity: h.relative_humidity_2m[0],
        pressure: h.surface_pressure[0],
        cloud_cover: h.cloud_cover[0],
        visibility: h.visibility?.[0] / 1000 || 10,
        wind_speed_10m: h.wind_speed_10m[0],
        wind_direction_10m: h.wind_direction_10m[0],
        uv_index: weather.daily?.uv_index_max?.[0] || 0,
        weathercode: h.weathercode[0]
      };
    }
    
    res.json({
      locationName, 
      final: aiResult,
      rain, 
      elevation,
      weatherData: weather, 
      currentWeather
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal hitung risiko", details: err.message });
  }
});

// --- HELPER FETCHING ---
async function getCityName(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`;
    const res = await fetch(url);
    const data = await res.json();
    return data.locality || data.city || `Lokasi: ${lat}, ${lon}`;
  } catch (err) { return `Lokasi: ${lat}, ${lon}`; }
}

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=rain,precipitation,temperature_2m,relative_humidity_2m,surface_pressure,wind_gusts_10m,soil_moisture_0_to_1cm,weathercode,apparent_temperature,cloud_cover,visibility,wind_speed_10m,wind_direction_10m` +
    `&daily=uv_index_max&forecast_days=1&timezone=auto`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal ambil data cuaca");
    return await res.json();
  } catch (err) { return null; }
}

async function getElevation(lat, lon) {
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
  const res = await fetch(url);
  const data = await res.json();
  return Array.isArray(data.elevation) ? data.elevation[0] : 10;
}

function calculateRainScore(weatherData) {
  const rainArr = weatherData?.hourly?.rain ?? [];
  const r = Array.from({ length: 6 }, (_, i) => rainArr[i] ?? 0);
  const [r0, r1, r2, r3, r4, r5] = r;  
  return { rain1h: r0, rain3h: r0+r1+r2, rain6h: r0+r1+r2+r3+r4+r5, raw6hrain : r };
}

// --- ENDPOINTS LAINNYA ---
app.get("/generate-dataset", async (req, res) => {
  await fetchDataset();
  res.send("CSV dataset created: dataset.csv");
});

app.post("/subscribe", (req, res) => {
  const subscriberData = req.body; 
  if (!subscriberData.lat || !subscriberData.subscription) {
      return res.status(400).json({ error: "Data tidak lengkap" });
  }
  subscribers.push(subscriberData);
  console.log(`✅ User baru subscribe dari lokasi: ${subscriberData.lat}, ${subscriberData.lon}`);
  res.status(201).json({});
  const payload = JSON.stringify({ title: "FloodGuard AI", body: "Sistem AI siap memantau lokasi Anda!" });
  webpush.sendNotification(subscriberData.subscription, payload).catch(err => console.error(err));
});

app.post("/report", (req, res) => { res.json({ success: true }); });

app.get("/", (req, res) => { res.sendFile(path.join(__dirname, "index.html")); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server AI listening from http://localhost:${PORT}`);
});