import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { fetchDataset } from "./get_dataset.js";
import webpush from "web-push";
import bodyParser from "body-parser";
import { spawn } from "child_process"; // <--- INI JEMBATAN KE PYTHON

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.static(__dirname));
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json()); 

// --- KONFIGURASI WEB PUSH (KUNCI KAMU) ---
const publicVapidKey = "BCvz2afRqbdk5C0SHVIHsXo2s6Sctv9Sm3gmXtsgkYKe4VEf1aUEmIBqZ1_rciwZg7PNCR-rJ89E9Vf-Pw-NOxw";
const privateVapidKey = "yOKQ5brLxjguuxIWMGau3NDiKAe_E2M4s-XfKhEEL_A";

webpush.setVapidDetails(
  "mailto:admin@floodguard.com", 
  publicVapidKey,
  privateVapidKey
);

let subscribers = [];

// --- FUNGSI UTAMA: TANYA AI (PYTHON) ---
// Fungsi ini akan menjalankan command: "python src/predict.py <DATA_JSON>"
async function getAiPrediction(weatherData, lat, lon, elevation) {
    return new Promise((resolve, reject) => {
        // 1. Siapkan Data Statistik (Aggregate)
        // Kita ubah data per jam menjadi rata-rata agar cocok dengan format 'dataset.csv'
        const h = weatherData.hourly;
        
        const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        const sum = arr => arr.reduce((a, b) => a + b, 0);
        const max = arr => Math.max(...arr);
        const min = arr => Math.min(...arr);

        // Input ini HARUS URUT sesuai kolom di predict.py / training
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

        // 2. Panggil Script Python
        // Pastikan 'python' bisa jalan di terminal kamu. Kalau gagal, coba ganti jadi 'python3'
        const pythonProcess = spawn('python', ['src/predict.py', JSON.stringify(inputFeatures)]);

        let resultData = '';

        // Terima data dari print() Python
        pythonProcess.stdout.on('data', (data) => {
            resultData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error Log: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                // Fallback kalau Python crash: Kirim status Error (Biar server gak mati)
                console.error(`Python mati dengan code ${code}`);
                resolve({ status: "SISTEM ERROR", finalRisk: 0, color: "gray", confidence: 0 });
            } else {
                try {
                    const jsonResult = JSON.parse(resultData);
                    resolve(jsonResult); // Kembalikan hasil prediksi AI
                } catch (e) {
                    console.error("Gagal baca JSON dari Python:", resultData);
                    resolve({ status: "JSON ERROR", finalRisk: 0, color: "gray", confidence: 0 });
                }
            }
        });
    });
}

// setInterval(async () => {
//    console.log("🔔 AI Background Check: Menganalisis potensi bahaya...");

//    const lat = -6.1754; 
//    const lon = 106.8272;

//    try {
//        const [weather, elevation] = await Promise.all([
//            getWeather(lat, lon),
//            getElevation(lat, lon)
//        ]);

//        if (weather) {
//            // --- DISINI KITA PANGGIL AI ---
//            const aiResult = await getAiPrediction(weather, lat, lon, elevation);

//            console.log(`   > 🤖 Kata AI: ${aiResult.status} (Yakin: ${aiResult.confidence}%)`);

//            // MODIFIKASI: Kirim notifikasi apapun statusnya (AMAN/SIAGA/BAHAYA)
//            // Ubah angka 70 menjadi -1 supaya semua skor masuk
//            if (aiResult.finalRisk > -1) { 
//                console.log(`   > 📨 Mengirim Notifikasi Status: ${aiResult.status}`);
               
//                // Kita bedakan judulnya biar keren
//                let title = "INFO CUACA HARIAN";
//                if (aiResult.finalRisk > 70) title = "🚨 PERINGATAN BAHAYA!";
//                else if (aiResult.finalRisk > 40) title = "⚠️ PERINGATAN SIAGA";

//                const payload = JSON.stringify({
//                    title: title,
//                    body: `Status Saat Ini: ${aiResult.status}. Risiko: ${aiResult.finalRisk}%`
//                });

//                subscribers.forEach(sub => {
//                    webpush.sendNotification(sub, payload).catch(err => console.error(err));
//                });
//            }
//        }

//    } catch (err) {
//        console.error("Gagal cek background:", err.message);
//    }

// }, 60000); // Cek setiap 1 menit

setInterval(async () => {
  console.log("🔔 AI Background Check: Per Subscriber");

  if (subscribers.length === 0) {
    console.log("   ⚠️ No subscribers yet, skipping AI check");
    return;
  }

  for (const user of subscribers) {
    const { lat, lon, subscription } = user;

    try {
      const [weather, elevation] = await Promise.all([
        getWeather(lat, lon),
        getElevation(lat, lon)
      ]);

      if (!weather) continue;

      const aiResult = await getAiPrediction(weather, lat, lon, elevation);

      console.log(
        `📍 ${lat}, ${lon} | Risk: ${aiResult.finalRisk}% | ${aiResult.status}`
      );

      // 🚫 Skip invalid push subs (VERY IMPORTANT)
      if (!subscription?.keys?.auth || !subscription?.keys?.p256dh) {
        console.log("   ⚠️ Invalid push subscription, skipping notification");
        continue;
      }

      if (aiResult.finalRisk > 70) {
        const payload = JSON.stringify({
          title: "🚨 PERINGATAN BANJIR AI",
          body: `Risiko ${aiResult.finalRisk}% — ${aiResult.status}`
        });

        await webpush.sendNotification(subscription, payload);
        console.log("   ✅ Notification sent");
      }

    } catch (err) {
      console.error("   ❌ AI check failed:", err.message);
    }
  }
}, 60000);

// setInterval(async () => {
//    console.log("🔔 Background Check: Menganalisis potensi bahaya...");


//    try {
//        const result = {
//            finalRisk: 95,
//            status: "BAHAYA",    
//            color: "red"
//        };

//        console.log(`   > Skor (Simulasi): ${result.finalRisk} (${result.status})`);

//        if (result.finalRisk > 70) { 
//            console.log(`   > 🚨 BAHAYA DETECTED! Menyiapkan notif...`);
           
//            if (subscribers.length === 0) {
//                console.log("   ⚠️  GAGAL KIRIM: Tidak ada user yang subscribe (List Kosong).");
//                console.log("   👉  Solusi: Buka web -> Klik tombol ALERT lonceng lagi.");
//            } else {
//                console.log(`   ✅  MENGIRIM ke ${subscribers.length} orang...`);
               
//                const notificationPayload = JSON.stringify({
//                    title: "🚨 PERINGATAN BANJIR! (TEST)",
//                    body: `Status: ${result.status}! Skor: ${result.finalRisk}.`
//                });
    
//                subscribers.forEach((sub, index) => {
//                    webpush.sendNotification(sub, notificationPayload)
//                        .then(() => console.log(`       -> Sukses kirim ke User ${index + 1}`))
//                        .catch(err => console.error(`       -> Gagal kirim ke User ${index + 1}:`, err.message));
//                });
//            }
//        }

//    } catch (err) {
//        console.error("Error:", err);
//    }

// }, 10000); 


// --- ENDPOINTS ---

app.get("/risk", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "Lat/Lon dibutuhkan" });

  try {
    const [weather, elevation, locationName] = await Promise.all([
        getWeather(lat, lon),
        getElevation(lat, lon),
        getCityName(lat, lon)
    ]);

    // --- INTEGRASI AI DI ENDPOINT JUGA ---
    const aiResult = await getAiPrediction(weather, lat, lon, elevation);
    
    // Data tambahan untuk grafik frontend (Rainfall Chart)
    const rain = calculateRainScore(weather);

    // Format Weather Object untuk Frontend
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
      final: aiResult, // <--- INI HASIL DARI AI
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
  } catch (err) {
    return `Lokasi: ${lat}, ${lon}`;
  }
}

async function getWeather(lat, lon) {
  // SUDAH DIPERBAIKI: Menambahkan 'precipitation' agar grafik frontend muncul lagi
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=rain,precipitation,temperature_2m,relative_humidity_2m,surface_pressure,wind_gusts_10m,soil_moisture_0_to_1cm,weathercode,apparent_temperature,cloud_cover,visibility,wind_speed_10m,wind_direction_10m` +
    `&daily=uv_index_max&forecast_days=1&timezone=auto`;
    
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal ambil data cuaca");
    return await res.json();
  } catch (err) {
    console.error("Weather API error:", err.message);
    return null; 
  }
}

async function getElevation(lat, lon) {
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
  const res = await fetch(url);
  const data = await res.json();
  return Array.isArray(data.elevation) ? data.elevation[0] : 10;
}

// Helper kecil buat format data hujan ke grafik frontend
function calculateRainScore(weatherData) {
  const rainArr = weatherData?.hourly?.rain ?? [];
  const r = Array.from({ length: 6 }, (_, i) => rainArr[i] ?? 0);
  const [r0, r1, r2, r3, r4, r5] = r;  
  return {
    rain1h: r0,
    rain3h: r0+r1+r2,
    rain6h: r0+r1+r2+r3+r4+r5,
    raw6hrain : r
  };
}

// --- ENDPOINTS LAINNYA ---

app.get("/generate-dataset", async (req, res) => {
  await fetchDataset();
  res.send("CSV dataset created: dataset.csv");
});

app.post("/subscribe", (req, res) => {
  // Sekarang req.body berisi { subscription, lat, lon }
  const subscriberData = req.body; 
  
  // Validasi agar tidak masuk data kosong
  if (!subscriberData.lat || !subscriberData.subscription) {
      return res.status(400).json({ error: "Data tidak lengkap" });
  }

  subscribers.push(subscriberData);
  
  console.log(`✅ User baru subscribe dari lokasi: ${subscriberData.lat}, ${subscriberData.lon}`);
  
  res.status(201).json({});

  // Kirim notif selamat datang (Optional)
  const payload = JSON.stringify({ title: "FloodGuard AI", body: "Sistem AI siap memantau lokasi Anda!" });
  webpush.sendNotification(subscriberData.subscription, payload).catch(err => console.error(err));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server AI listening from http://localhost:${PORT}`);
});