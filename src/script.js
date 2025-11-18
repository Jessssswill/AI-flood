
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

  return Array.isArray(data.elevation) ? data.elevation[0] : 10;
;
}

// ---------------- RAIN SCORE ----------------
function calculateRainScore(weatherData) {
  const rainArr = weatherData.hourly?.rain ?? [];
  const precipArr = weatherData.hourly?.precipitation ?? [];

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
    pressure : weatherData.hourly?.pressure_msl?.[0] ?? null,
    cloudCover: weatherData.hourly?.cloud_cover?.[0] ?? null,
  };
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
function calculateStormScore(weatherData){
  const datas = weatherData.hourly?.weathercode ?? []
  let score = 0
  for(let i = 0; i<6; i++){
    const data = datas[i]??0
    if(data >=95){
      score+=15
    }
    else if( data >= 80){
      score+=5
    }
    else if( data >= 60){
      score+=2
    }
    else if( data >= 50){
      score+=1
    }
  }
  return Math.min(score, 30);
}
// ---------------- HISTORICAL SCORE ----------------
function getHistoricalScore(lat, lon) {
  let score = 5
  //rawan banjir
  if(lat<-6.1){
    score+= 10
  }
  //contoh jakbar, jakut
  if(lon>106.75 && lon < 106.9){
    score+=10
  }
  //daerah persisir
  if(lat < -6.05){
    score+=5
  }
  return score;
}

// ---------------- FINAL RISK ----------------
function calculateFloodRisk(rainScore, elevMeters, histScore, reportScore, stormScore) {
  let elevScore = 5;

  if (elevMeters < 5) elevScore = 30;
  else if (elevMeters < 15) elevScore = 15;

  const finalRisk =
    rainScore*0.5 +
    elevScore*0.25 +
    stormScore+
    histScore*0.05 +
    reportScore*0.05;

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
    const stormScore=calculateStormScore(weather)
    const final = calculateFloodRisk(
      rain.rainScore,
      elevation,
      histScore,
      reportScore,
      stormScore
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
