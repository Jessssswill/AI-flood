// ======================================================
// FLOOD AI BACKEND (Weather + Elevation + Risk Model)
// Menggunakan: OpenWeather API + Open-Meteo Elevation API
// ======================================================

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// =============== CONFIG ===========================
const OPENWEATHER_KEY = "12c76b4568e88c57c54d03a08e61908d"; // <--- GANTI DISINI
const PORT = 3000;

// Database sementara (dummy)
let userReports = [];


// ===================================================
// 1. GET WEATHER DATA (OpenWeather 3-hour forecast)
// ===================================================
async function getWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`;
  
  const res = await fetch(url);
  const data = await res.json();
  return data;
}


// ===================================================
// 2. GET ELEVATION (Open-Meteo Elevation API) — No API key needed
// ===================================================
async function getElevation(lat, lon) {
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;

  const res = await fetch(url);
  const data = await res.json();
  return data.elevation ? data.elevation[0] : 10; // fallback 10m
}


// ===================================================
// 3. CALCULATE RAIN SCORE
// ===================================================
function calculateRainScore(weatherData) {
  let rain1h = 0;
  let rain3h = 0;
  let rain6h = 0;

  if (weatherData.list && weatherData.list.length > 0) {
    const first = weatherData.list[0];
    rain3h = first.rain?.["3h"] || 0;
    rain1h = rain3h / 3;

    const next = weatherData.list[1];
    rain6h = rain3h + (next?.rain?.["3h"] || 0);
  }

  const rainScore = (rain1h * 1.5) + (rain3h * 1) + (rain6h * 0.5);
  return { rain1h, rain3h, rain6h, rainScore };
}


// ===================================================
// 4. GET USER REPORT SCORE
// ===================================================
function getUserReportScore(lat, lon) {
  const radius = 0.01; // ~1 km
  const reports = userReports.filter(r =>
    Math.abs(r.lat - lat) < radius &&
    Math.abs(r.lon - lon) < radius
  );

  if (reports.length >= 10) return 25;
  if (reports.length >= 5) return 15;
  if (reports.length >= 1) return 5;

  return 0;
}


// ===================================================
// 5. GET HISTORICAL FLOOD SCORE (dummy)
// ===================================================
function getHistoricalScore(lat, lon) {
  if (lon > 106.82) return 20;  // contoh: Pluit / Alsut rawan
  return 5;
}


// ===================================================
// 6. CALCULATE FLOOD RISK
// ===================================================
function calculateFloodRisk(rainScore, elevMeters, histScore, reportScore) {
  let elevScore = 5;

  if (elevMeters < 5) elevScore = 30;       // Sangat rendah → rawan
  else if (elevMeters < 15) elevScore = 15; // Rendah → cukup rawan

  const finalRisk =
    (rainScore * 0.6) +
    (elevScore * 0.3) +
    (histScore * 0.1) +
    reportScore;

  let status = "AMAN";
  if (finalRisk > 80) status = "BAHAYA";
  else if (finalRisk > 60) status = "SIAGA";
  else if (finalRisk > 40) status = "WASPADA";

  return { finalRisk: Math.round(finalRisk), status };
}


// ===================================================
// 7. ENDPOINT: GET RISK
// ===================================================
app.get("/risk", async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const weather = await getWeather(lat, lon);
    const elevation = await getElevation(lat, lon);

    const { rain1h, rain3h, rain6h, rainScore } = calculateRainScore(weather);
    const histScore = getHistoricalScore(lat, lon);
    const reportScore = getUserReportScore(lat, lon);

    const risk = calculateFloodRisk(rainScore, elevation, histScore, reportScore);

    res.json({
      location: { lat, lon },
      elevationMeters: elevation,
      rain: { rain1h, rain3h, rain6h, rainScore },
      scores: {
        elevationScore: elevation,
        historicalScore: histScore,
        reportScore
      },
      final: risk
    });

  } catch (err) {
    res.status(500).json({ error: "Gagal hitung risiko", details: err.message });
  }
});


// ===================================================
// 8. ENDPOINT: ADD USER REPORT
// ===================================================
app.post("/report", (req, res) => {
  const { lat, lon, message } = req.body;

  userReports.push({
    lat,
    lon,
    message,
    time: Date.now(),
  });

  res.json({
    success: true,
    totalReports: userReports.length
  });
});


// ===================================================
// 9. ROOT ROUTE (optional)
// ===================================================
app.get("/", (req, res) => {
  res.send("Flood AI Backend is running!");
});


// ===================================================
// 10. START SERVER
// ===================================================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
