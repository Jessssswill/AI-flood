import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;


// ---------------- WEATHER ----------------
async function getWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=precipitation,rain,showers,pressure_msl,cloud_cover,weathercode` +
    `&forecast_days=1&timezone=auto`;

  const res = await fetch(url);
  return await res.json();
}

// ---------------- ELEVATION ----------------
async function getElevation(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.elevation ? data.elevation[0] : 10;
}

// ---------------- RAIN SCORE ----------------
function calculateRainScore(weatherData) {
  if (!weatherData.hourly) return { rain1h: 0, rain3h: 0, rain6h: 0, rainScore: 0 };

  const rainArr = weatherData.hourly.rain || [];
  const precipArr = weatherData.hourly.precipitation || [];

  const rain1h = rainArr[0] || precipArr[0] || 0;

  const rain3h = (rainArr[0] || 0) + (rainArr[1] || 0) + (rainArr[2] || 0);

  const rain6h =
    (rainArr[0] || 0) +
    (rainArr[1] || 0) +
    (rainArr[2] || 0) +
    (rainArr[3] || 0) +
    (rainArr[4] || 0) +
    (rainArr[5] || 0);

  const rainScore = (rain1h * 1.5) + (rain3h * 1) + (rain6h * 0.5);

  return { rain1h, rain3h, rain6h, rainScore };
}

// ---------------- USER REPORT ----------------
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

// ---------------- HISTORICAL SCORE ----------------
function getHistoricalScore(lat, lon) {
  if (lon > 106.82) return 20;
  return 5;
}

// ---------------- FINAL RISK ----------------
function calculateFloodRisk(rainScore, elevMeters, histScore, reportScore) {
  let elevScore = 5;

  if (elevMeters < 5) elevScore = 30;
  else if (elevMeters < 15) elevScore = 15;

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

// ---------------- ENDPOINT: /risk ----------------
app.get("/risk", async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const weather = await getWeather(lat, lon);
    const elevation = await getElevation(lat, lon);

    const rain = calculateRainScore(weather);
    const histScore = getHistoricalScore(lat, lon);
    const reportScore = getUserReportScore(lat, lon);

    const final = calculateFloodRisk(
      rain.rainScore,
      elevation,
      histScore,
      reportScore
    );

    
    res.json({ status: final.status });

  } catch (err) {
    res.status(500).json({ error: "Gagal hitung risiko", details: err.message });
  }
});

// ---------------- USER REPORT ----------------
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

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
