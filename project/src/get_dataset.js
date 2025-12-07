import fs from 'fs';
import fetch from 'node-fetch';
import { createWriteStream, readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

// --- KONFIGURASI ---
const INPUT_FILE = 'locations.csv';
const OUTPUT_FILE = 'dataset.csv';
const PAST_DAYS = 30; // Ambil data 30 hari ke belakang

// Helper Functions
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const max = (arr) => (arr.length ? Math.max(...arr) : 0);
const min = (arr) => (arr.length ? Math.min(...arr) : 0);

// --- 1. BACA LOKASI (ROBUST) ---
function getLocations() {
    // Auto-create file kalau belum ada
    if (!existsSync(INPUT_FILE)) {
        console.log("🔧 Membuat file locations.csv baru...");
        const defaultData = 
`id,lat,lon
jakarta,-6.2000,106.8166
bogor,-6.5971,106.8060
depok,-6.4025,106.7942
tangerang,-6.1731,106.6300
bekasi,-6.2383,106.9756
puncak,-6.7024,106.9953
pantai_indah_kapuk,-6.1165,106.7513`; 
        writeFileSync(INPUT_FILE, defaultData, 'utf8');
    }

    const fileContent = readFileSync(INPUT_FILE, 'utf-8');
    const lines = fileContent.replace(/\r/g, '').split('\n');
    const locations = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 3) {
            locations.push({
                id: parts[0].trim().toLowerCase(),
                lat: parseFloat(parts[1]),
                lon: parseFloat(parts[2])
            });
        }
    }
    return locations;
}

// --- 2. LOGIKA JURI (FLOOD RISK) ---
function determineFloodRisk(rainSum, rainPeak, soilMoisture, windGust, elevation) {
    let score = 0;

    // Hujan (Bobot 50%)
    if (rainSum > 150) score += 50;      
    else if (rainSum > 100) score += 40; 
    else if (rainSum > 50) score += 25;  
    else if (rainSum > 20) score += 10;  

    // Intensitas (Flash Flood)
    if (rainPeak > 50) score += 30;      
    else if (rainPeak > 30) score += 20;
    else if (rainPeak > 10) score += 10;

    // Tanah (Soil Moisture)
    if (soilMoisture > 0.6) score += 25; 
    else if (soilMoisture > 0.45) score += 15;
    else if (soilMoisture > 0.35) score += 5;

    // Elevasi (Topografi)
    if (elevation < 5) score += 30;        // BAHAYA (Pesisir)
    else if (elevation < 15) score += 15;  // WASPADA (Dataran Rendah)
    else if (elevation > 500) score -= 20; // AMAN (Pegunungan)
    else if (elevation > 100) score -= 10; // RELATIF AMAN

    // Angin
    if (windGust > 60) score += 10;

    // Labeling
    if (score >= 70) return 'BAHAYA';
    if (score >= 40) return 'SIAGA';
    if (score >= 20) return 'WASPADA';
    return 'AMAN';
}

// --- 3. FUNGSI UTAMA ---
export async function fetchDataset() {
    console.log(`\n🚀 --- MULAI GENERATE DATASET (${PAST_DAYS} HARI KE BELAKANG) ---`);
    
    const locations = getLocations();
    console.log(`📡 Lokasi ditemukan: ${locations.length}`);
    console.log(`⏳ Estimasi data: ${locations.length * (PAST_DAYS + 1)} baris...`);

    const writeStream = createWriteStream(OUTPUT_FILE);
    
    // Header CSV
    writeStream.write(
        `location_id,date,lat,lon,elevation,temp_avg,humidity_avg,` +
        `rain_sum_24h,rain_peak_1h,soil_moisture_avg,pressure_min,wind_gust_max,risk_label\n`
    );

    for (const loc of locations) {
        try {
            const { id, lat, lon } = loc;

            // URL FIXED: Menghapus "&elevation=true"
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                `&hourly=temperature_2m,relative_humidity_2m,rain,surface_pressure,wind_gusts_10m,soil_moisture_0_to_1cm` +
                `&past_days=${PAST_DAYS}&forecast_days=1&timezone=auto`; // <--- HAPUS elevation=true DI SINI

            const res = await fetch(url);
            
            // Cek Error Detail
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`${res.status} ${res.statusText} - ${errText}`);
            }
            
            const data = await res.json();

            if (!data.hourly) continue;

            const h = data.hourly;
            const totalHours = h.time.length;
            // Elevasi tetap didapat dari response body (otomatis)
            const elevation = data.elevation !== undefined ? data.elevation : 10;

            console.log(`🔄 Memproses ${id} (Elevasi: ${elevation}m)...`);

            // LOOPING PER HARI (Chunk 24 jam)
            for (let i = 0; i < totalHours; i += 24) {
                if (i + 24 > totalHours) break;

                const dayTemps = h.temperature_2m.slice(i, i + 24);
                const dayHumid = h.relative_humidity_2m.slice(i, i + 24);
                const dayRain = h.rain.slice(i, i + 24);
                const dayPressure = h.surface_pressure.slice(i, i + 24);
                const dayWind = h.wind_gusts_10m.slice(i, i + 24);
                const daySoil = h.soil_moisture_0_to_1cm.slice(i, i + 24);
                
                const dateStr = h.time[i].split('T')[0];

                // Hitung Statistik Harian
                const temp_avg = avg(dayTemps).toFixed(1);
                const humidity_avg = avg(dayHumid).toFixed(0);
                const rain_sum_24h = sum(dayRain).toFixed(2);
                const rain_peak_1h = max(dayRain).toFixed(2);
                const soil_moisture_avg = avg(daySoil).toFixed(3);
                const pressure_min = min(dayPressure).toFixed(0);
                const wind_gust_max = max(dayWind).toFixed(1);

                // Tentukan Label
                const label = determineFloodRisk(
                    parseFloat(rain_sum_24h), 
                    parseFloat(rain_peak_1h),
                    parseFloat(soil_moisture_avg), 
                    parseFloat(wind_gust_max), 
                    elevation
                );

                const row = `${id},${dateStr},${lat},${lon},${elevation},${temp_avg},${humidity_avg},` +
                            `${rain_sum_24h},${rain_peak_1h},${soil_moisture_avg},${pressure_min},${wind_gust_max},${label}\n`;
                
                writeStream.write(row);
            }
            
            await new Promise(r => setTimeout(r, 500)); // Delay aman

        } catch (err) {
            console.error(`❌ Gagal fetch lokasi ${loc.id}:`, err.message);
        }
    }
    writeStream.end();
    console.log(`\n🎉 SELESAI! Dataset historis tersimpan di ${OUTPUT_FILE}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    fetchDataset();
}