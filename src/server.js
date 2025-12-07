import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { fetchDataset } from "./get_dataset.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors()); //buat live server
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//get dataset
app.get("/generate-dataset", async (req, res) => {
  await fetchDataset();
  res.send("CSV dataset created: dataset.csv");
});

const ONE_HOUR = 1000 * 60 * 60;

setInterval(async () => {
  console.log("🔄 Auto-fetching dataset...");
  try {
    await fetchDataset();
    console.log("✅ Auto dataset updated!");
  } catch (err) {
    console.error("❌ Auto update failed:", err);
  }
}, ONE_HOUR);

// Mengatur agar server BISA menyajikan file, tapi kita utamakan Live Server


const PORT = process.env.PORT || 3000;

// --- LOGIKA BACKEND (MENGGUNAKAN SEMUA FUNGSI KUSTOM KAMU) ---

// [FITUR BARU] - Reverse Geocoding (Lat/Lon -> Nama Kota)
async function getCityName(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`BigDataCloud API error: ${res.status}`);
    const data = await res.json();
    
    const parts = [data.locality, data.city, data.principalSubdivision].filter(Boolean);
    const locationName = parts.join(', ');

    return locationName || `Lokasi: ${lat}, ${lon}`;
  } catch (err) {
    console.error("Geocoding error:", err.message);
    return `Lokasi: ${lat}, ${lon}`;
  }
}

// 1. GET WEATHER (Open-Meteo) - [DI-UPGRADE!]
// Menambahkan semua parameter yang dibutuhkan frontend V4.1
async function getWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=precipitation,rain,showers,weathercode,temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_direction_10m` +
    `&daily=uv_index_max` + // Data UV untuk frontend
    `&forecast_days=1&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal ambil data cuaca");
    return await res.json();
  } catch (err) {
    console.error("Weather API error:", err.message);
    return null; 
  }
}

// 2. GET ELEVATION (Logika Asli Kamu)
async function getElevation(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;

  const res = await fetch(url);
  const data = await res.json();
  return Array.isArray(data.elevation) ? data.elevation[0] : 10;
}

// 3. RAIN SCORE 
function calculateRainScore(weatherData) {
  const rainArr = weatherData?.hourly?.rain ?? [];
  const precipArr = weatherData?.hourly?.precipitation ?? [];

  const getRain = (i) => Math.max(rainArr[i] ?? 0, precipArr[i] ?? 0);
  
  const r = Array.from({ length: 6 }, (_, i) => getRain(i));
  const [r0, r1, r2, r3, r4, r5] = r;  

  const rain1h = r0;
  const rain3h = r0 + r1 + r2;
  const rain6h = rain3h + r3 + r4 + r5;

  const weightedAvg =
    (r0 * 3 + r1 * 2.5 + r2 * 2 + r3 * 1.5 + r4 * 1 + r5 * 0.8) / 6;

  const rainScore =
    (rain1h * 2.2) +
    (rain3h * 1.2) +
    (rain6h * 0.6) +
    (weightedAvg * 4);

  return {
    rain1h,
    rain3h,
    rain6h,
    weightedAvg: Number(weightedAvg.toFixed(2)),
    rainScore: Number(rainScore.toFixed(2)),
    raw6hrain : r,
    pressure : weatherData?.hourly?.pressure_msl?.[0] ?? null,
    cloudCover: weatherData?.hourly?.cloud_cover?.[0] ?? null,
  };
}

// 4. USER REPORT SCORE 
let userReports = [];
function getUserReportScore(lat, lon) {
  const radius = 0.01;
  const reports = userReports.filter(r =>
    Math.abs(r.lat - lat) < radius &&
    Math.abs(r.lon - lon) < radius
  );

  if (reports.length >= 10) return 25;
  if (reports.length >= 5) return 15;
  if (reports.length >= 1) return 5;
  return 0;
}

// 5. STORM SCORE 
function calculateStormScore(weatherData){
  const datas = weatherData?.hourly?.weathercode ?? []
  let score = 0
  for(let i = 0; i<6; i++){
    const data = datas[i]??0
    if(data >=95){ score+=15 } // Badai Petir
    else if( data >= 80){ score+=5 } // Hujan Badai
    else if( data >= 60){ score+=2 } // Hujan
    else if( data >= 50){ score+=1 } // Gerimis
  }
  return Math.min(score, 30); // Batasi maks 30
}

// 6. HISTORICAL SCORE (Logika Asli Kamu)
function getHistoricalScore(lat, lon) {
  let score = 5
  if(lat<-6.1){ score+= 10 } // rawan banjir
  if(lon>106.75 && lon < 106.9){ score+=10 } // jakbar, jakut
  if(lat < -6.05){ score+=5 } //daerah persisir
  return score;
}

// 7. FINAL RISK (Logika Asli Kamu - [DI-UPGRADE!])
function calculateFloodRisk(rainScore, elevMeters, histScore, reportScore, stormScore) {
  let elevScore = 5;

  if (elevMeters < 5) elevScore = 30;
  else if (elevMeters < 15) elevScore = 15;

  // Rumus Final Asli Kamu
  const finalRisk =
    rainScore*0.5 +
    elevScore*0.25 +
    stormScore+
    histScore*0.05 +
    reportScore*0.05;

  let status = "AMAN";
  let color = "green"; // [UPGRADE] Tambahkan warna untuk frontend
  if (finalRisk > 80) { status = "BAHAYA"; color = "red"; }
  else if (finalRisk > 60) { status = "SIAGA"; color = "orange"; }
  else if (finalRisk > 40) { status = "WASPADA"; color = "yellow"; }

  return { finalRisk: Math.round(finalRisk), status, color }; // [UPGRADE] Kirim 'color'
}

// --- ENDPOINTS ---

// 1. Endpoint /risk (KRUSIAL: DI-UPGRADE AGAR NYAMBUNG KE FRONTEND V4.1)
app.get("/risk", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "Lat/Lon dibutuhkan" });

  try {
    // Panggil 3 API secara paralel
    const [weather, elevation, locationName] = await Promise.all([
        getWeather(lat, lon),
        getElevation(lat, lon),
        getCityName(lat, lon) // Panggil Geocoding
    ]);

    // Hitung semua skor kustom-mu
    const rain = calculateRainScore(weather);
    const histScore = getHistoricalScore(Number(lat), Number(lon));
    const reportScore = getUserReportScore(Number(lat), Number(lon));
    const stormScore = calculateStormScore(weather);
    
    // Hitung status final
    const final = calculateFloodRisk(
      rain.rainScore,
      elevation,
      histScore,
      reportScore,
      stormScore
    );

    // Siapkan data cuaca saat ini untuk frontend
    let currentWeather = null;
    if (weather && weather.hourly) {
      const h = weather.hourly;
      currentWeather = {
        temperature: h.temperature_2m[0],
        apparent_temperature: h.apparent_temperature[0],
        humidity: h.relative_humidity_2m[0],
        pressure: h.pressure_msl[0],
        cloud_cover: h.cloud_cover[0],
        visibility: h.visibility?.[0] / 1000 || 10, // convert meter ke km, fallback 10km
        wind_speed_10m: h.wind_speed_10m[0],
        wind_direction_10m: h.wind_direction_10m[0],
        uv_index: weather.daily?.uv_index_max?.[0] || 0,
        weathercode: h.weathercode[0]
      };
    }

    
    res.json({
      locationName,
      final, 
      rain,  
      elevation,
      scores: { histScore, reportScore, stormScore },
      weatherData: weather,
      currentWeather
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal hitung risiko", details: err.message });
  }
});

// 2. Endpoint /report 
app.post("/report", (req, res) => {
  const { lat, lon, message } = req.body;

  userReports.push({
    lat,
    lon,
    message,
    time: Date.now()
  });

  res.json({ success: true, totalReports: userReports.length });
});

// 3. Endpoint / (Serve Frontend)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server is listening from http://localhost:${PORT}`);
});