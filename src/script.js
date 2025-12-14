// API URL (Pastikan server.js berjalan di port yang sama)
const API_URL = 'http://localhost:3000';

// --- KONFIGURASI WEB PUSH ---
// PENTING: Paste Public Key hasil dari 'node generate_keys.js' di sini!
const publicVapidKey = 'BCvz2afRqbdk5C0SHVIHsXo2s6Sctv9Sm3gmXtsgkYKe4VEf1aUEmIBqZ1_rciwZg7PNCR-rJ89E9Vf-Pw-NOxw'; 

// === Icon SVGs (untuk status dinamis) ===
const ICONS = {
    loading: `<svg class="status-icon animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.181M19.644 4.023l-3.182 3.182m0-3.182h-4.992m4.992 0v4.992" /></svg>`,
    aman: `<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
    waspada: `<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>`,
    siaga: `<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>`,
    bahaya: `<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>`
};

// Ikon untuk Cuaca
const WMO_ICONS = {
    0: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12H.75m.386-6.364l1.591 1.591"/></svg>`,
    1: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12H.75m.386-6.364l1.591 1.591M12 12a2.25 2.25 0 00-2.25 2.25v.01c0 .317.031.63.09.934a8.91 8.91 0 01-1.61 3.06 8.91 8.91 0 01-3.06 1.61c-.304.059-.617.09-.934.09v.01a2.25 2.25 0 002.25 2.25h.01c.317 0 .63-.031.934-.09a8.91 8.91 0 013.06-1.61 8.91 8.91 0 011.61-3.06c.059-.304.09-.617.09-.934v-.01a2.25 2.25 0 00-2.25-2.25h-.01z" /></svg>`,
    2: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-9.75 2.152 4.5 4.5 0 00-4.5 4.5z" /></svg>`,
    3: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-9.75 2.152 4.5 4.5 0 00-4.5 4.5z" /></svg>`,
    45: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>`,
    48: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>`,
    61: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>`,
    63: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>`,
    65: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>`,
    95: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>`,
    'default': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>`
};

const WMO_CODES = {
    0: { text: "Cerah", type: "clear", icon: WMO_ICONS[0] },
    1: { text: "Cerah Berawan", type: "clear", icon: WMO_ICONS[1] },
    2: { text: "Berawan", type: "cloudy", icon: WMO_ICONS[2] },
    3: { text: "Sangat Berawan", type: "cloudy", icon: WMO_ICONS[3] },
    45: { text: "Kabut", type: "cloudy", icon: WMO_ICONS[45] },
    48: { text: "Kabut Tebal", type: "cloudy", icon: WMO_ICONS[48] },
    51: { text: "Gerimis Ringan", type: "rain", icon: WMO_ICONS[61] },
    53: { text: "Gerimis Sedang", type: "rain", icon: WMO_ICONS[63] },
    55: { text: "Gerimis Lebat", type: "rain", icon: WMO_ICONS[65] },
    61: { text: "Hujan Ringan", type: "rain", icon: WMO_ICONS[61] },
    63: { text: "Hujan Sedang", type: "rain", icon: WMO_ICONS[63] },
    65: { text: "Hujan Lebat", type: "rain", icon: WMO_ICONS[65] },
    80: { text: "Hujan Ringan", type: "rain", icon: WMO_ICONS[61] },
    81: { text: "Hujan Sedang", type: "rain", icon: WMO_ICONS[63] },
    82: { text: "Hujan Lebat", type: "rain", icon: WMO_ICONS[65] },
    95: { text: "Badai Petir", type: "rain", icon: WMO_ICONS[95] },
    'default': { text: "Data Error", type: "clear", icon: WMO_ICONS['default'] }
};

// === Global State ===
let currentCoords = { lat: null, lon: null };
let homeCoords = null;
let hourlyChart = null;
let rainAnimationId = null;
let lastStatus = "AMAN"; 

// === DOM Selection (Query Selector) ===
function qs(selector) { return document.querySelector(selector); }

// === Fungsi Utama ===

document.addEventListener('DOMContentLoaded', () => {
    // Tombol
    qs('#allow-location-button').addEventListener('click', askLocation);
    qs('#refresh-location').addEventListener('click', askLocation);
    qs('#report-button').addEventListener('click', showModal);
    qs('#close-modal-button').addEventListener('click', hideModal);
    qs('#cancel-modal-button').addEventListener('click', hideModal);
    qs('#report-form').addEventListener('submit', handleReportSubmit);
    qs('#set-home-button').addEventListener('click', setHomeLocation);
    
    // Listener untuk tombol baru
    qs('#notification-button').addEventListener('click', askNotificationPermission);
    qs('#tips-button').addEventListener('click', showTipsModal);
    qs('#close-tips-modal-button').addEventListener('click', hideTipsModal);
    
    loadHomeLocation();
    setupRainAnimation();
    askLocation();
});

// 2. Minta Lokasi
async function askLocation() {
    setLoadingState("Mencari sinyal lokasi...");
    
    // Opsi GPS Browser: Matikan highAccuracy biar lebih cepat di Laptop/PC
    const options = {
        enableHighAccuracy: false, // Ubah ke false biar gak maksa nyari satelit (berat)
        timeout: 5000,             // Batas waktu cuma 5 detik. Kelamaan? Langsung fallback!
        maximumAge: 300000         // Boleh pakai cache lokasi 5 menit terakhir
    };

    if (!navigator.geolocation) {
        console.log("Browser tidak dukung Geolocation, beralih ke IP...");
        useIpLocation(); // Fallback langsung
        return;
    }

    navigator.geolocation.getCurrentPosition(
        locationSuccess, 
        (err) => {
            console.warn(`GPS Browser Gagal (${err.code}): ${err.message}. Mencoba IP Location...`);
            useIpLocation(); // JANGAN ERROR DULU, PAKE PLAN B!
        }, 
        options
    );
}

async function useIpLocation() {
    setLoadingState("Triangulasi via IP Address...");
    try {
        // Pakai layanan gratis ipapi.co (atau ip-api.com)
        // Ini gak butuh izin popup browser!
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error("Gagal fetch IP");
        
        const data = await res.json();
        console.log("Dapat lokasi dari IP:", data);

        // Pura-pura jadi object position biar kompatibel sama locationSuccess
        const fallbackPosition = {
            coords: {
                latitude: data.latitude,
                longitude: data.longitude
            }
        };
        
        locationSuccess(fallbackPosition);
        showToast("Lokasi dideteksi via Jaringan (Estimasi)", "warning");

    } catch (err) {
        console.error("IP Location Error:", err);
        useDefaultLocation();

    }
}

function useDefaultLocation() {
    console.log("Semua cara gagal. Menggunakan lokasi default (Jakarta).");
    const defaultPos = {
        coords: {
            latitude: -6.1754, // Monas
            longitude: 106.8272
        }
    };
    locationSuccess(defaultPos);
    showToast("Menggunakan Lokasi Default (Jakarta)", "error");
}


// 3. Sukses Dapat Lokasi
function locationSuccess(position) {
    currentCoords.lat = position.coords.latitude.toFixed(4);
    currentCoords.lon = position.coords.longitude.toFixed(4);
    
    qs('#location-prompt').classList.add('hidden');
    qs('#dashboard').classList.remove('hidden');
    qs('#location-coords').textContent = `Lat: ${currentCoords.lat}, Lon: ${currentCoords.lon}`;
    
    fetchRiskData(currentCoords.lat, currentCoords.lon);

    // Auto-refresh setiap 10 menit
    setInterval(() => {
        console.log("Auto-refresh data sensor...");
        fetchRiskData(currentCoords.lat, currentCoords.lon);
    }, 1000); 
}

// 4. Gagal Dapat Lokasi
function locationError(err) {
    // Fungsi ini sekarang jarang dipanggil karena sudah di-handle oleh useIpLocation
    console.warn("Gagal total mendapatkan lokasi.");
    setErrorState("Sinyal Hilang", "Tidak dapat mendeteksi lokasi via GPS maupun IP.");
}

// 5. Ambil Data Sensor
async function fetchRiskData(lat, lon) {
    setLoadingState(`Menganalisis sensor di ${lat}, ${lon}...`);
    try {
        const response = await fetch(`${API_URL}/risk?lat=${lat}&lon=${lon}`);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.details || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Data Sensor Diterima:", data);
        updateUI(data); 

    } catch (error) {
        console.error("Fetch Error:", error);
        setErrorState("Gagal Ambil Data Sensor", error.message);
        showToast("Gagal terhubung ke server backend.", "error");
    }
}

// 6. Update Tampilan (UI)
function updateUI(data) {
    
    if (!data || !data.final) { 
        setErrorState("Data Risiko Tidak Valid", "Respon data 'final' tidak lengkap.");
        console.error("Data tidak lengkap:", data);
        return;
    }

    // === 1. Data Banjir ===
    const { status, finalRisk, color } = data.final;
    const statusCard = qs('#status-card');
    statusCard.className = `card-status status-${color}`;
    qs('#status-location').textContent = `STATUS BANJIR SAAT INI`;
    qs('#status-text').textContent = status;
    qs('#status-score').textContent = `Skor Risiko: ${finalRisk}`;
    let iconKey = status.toLowerCase();
    if (!ICONS[iconKey]) iconKey = 'waspada';
    qs('#status-icon-container').innerHTML = ICONS[iconKey];

    // Simpan status terakhir
    lastStatus = status; 

    // === 2. Data Sensor Risiko Banjir ===
    qs('#elevation-data').innerHTML = `${(data.elevation ?? 0).toFixed(0)} <span class="sensor-unit">mdpl</span>`;
    qs('#rain1h-data').innerHTML = `${(data.rain?.rain1h ?? 0).toFixed(2)} <span class="sensor-unit">mm</span>`;
    qs('#rain6h-data').innerHTML = `${(data.rain?.rain6h ?? 0).toFixed(2)} <span class="sensor-unit">mm</span>`;
    let reportText = "0";
    if (data.scores?.reportScore === 5) reportText = "1+";
    else if (data.scores?.reportScore === 15) reportText = "5+";
    else if (data.scores?.reportScore === 25) reportText = "10+";
    qs('#report-data').innerHTML = `${reportText} <span class="sensor-unit">laporan</span>`;

    // === 3. Data Cuaca Saat Ini ===
    const weatherNow = data.currentWeather; 
    const weatherInfo = WMO_CODES[weatherNow?.weathercode] || WMO_CODES['default'];
    
    qs('#current-temp-text').textContent = `${weatherNow?.temperature?.toFixed(0) ?? '--'}°`;
    qs('#current-feels-like').textContent = `${weatherNow?.apparent_temperature?.toFixed(0) ?? '--'}°`;
    qs('#current-location-text').textContent = data.locationName || `Lokasi: ${currentCoords.lat}, ${currentCoords.lon}`;
    qs('#current-weather-text').textContent = weatherInfo.text;
    qs('#current-weather-icon').innerHTML = weatherInfo.icon;
    qs('#current-weather-icon').className = `weather-icon-large text-${weatherInfo.type === 'clear' ? 'yellow' : 'blue'}-400`;
    
    qs('#location-coords').textContent = `Lat: ${currentCoords.lat}, Lon: ${currentCoords.lon}`;

    // === 4. Trigger Animasi Hujan ===
    if (weatherInfo.type === 'rain') {
        startRain();
    } else {
        stopRain();
    }

    // === 5. Grafik Hujan ===
    updateHourlyChart(data.weatherData);

    // === 6. Grid Detail Cuaca ===
    qs('#detail-wind').innerHTML = `${weatherNow?.wind_speed_10m?.toFixed(1) ?? '--'} <span class="detail-unit">km/j</span>`;
    qs('#detail-wind-dir').textContent = weatherNow ? degToCompass(weatherNow.wind_direction_10m) : '--';
    qs('#detail-humidity').innerHTML = `${weatherNow?.humidity?.toFixed(0) ?? '--'} <span class="detail-unit">%</span>`;
    qs('#detail-pressure').innerHTML = `${weatherNow?.pressure?.toFixed(0) ?? '--'} <span class="detail-unit">hPa</span>`;
    qs('#detail-uv').textContent = weatherNow?.uv_index?.toFixed(0) ?? '--';
    qs('#detail-uv-text').textContent = weatherNow ? getUvText(weatherNow.uv_index) : '--';
    qs('#detail-visibility').innerHTML = `${weatherNow?.visibility?.toFixed(1) ?? '--'} <span class="detail-unit">km</span>`;
    qs('#detail-cloud').innerHTML = `${weatherNow?.cloud_cover?.toFixed(0) ?? '--'} <span class="detail-unit">%</span>`;
}

// 7. Update Grafik (Versi Hologram Neon)
function updateHourlyChart(weatherData) { 
    const canvas = document.getElementById('hourly-chart');
    const ctx = canvas.getContext('2d');
    
    if (hourlyChart) {
        hourlyChart.destroy(); 
        hourlyChart = null;
    }

    if (!weatherData || !weatherData.hourly || !weatherData.hourly.time) {
        qs('#hourly-summary').textContent = "NO SATELLITE DATA AVAILABLE";
        return; 
    }

    const labels = weatherData.hourly.time.map(t => new Date(t));
    const rainValues = weatherData.hourly.rain || [];
    const precipValues = weatherData.hourly.precipitation || [];
    const data = labels.map((_, index) => (rainValues[index] || 0) + (precipValues[index] || 0));
    const totalRain = data.reduce((a, b) => a + b, 0);
    qs('#hourly-summary').textContent = `PREDICTED ACCUMULATION (24H): ${totalRain.toFixed(1)} MM`;

    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(0, 243, 255, 0.5)'); 
    gradientFill.addColorStop(1, 'rgba(0, 243, 255, 0)');  

    hourlyChart = new Chart(ctx, {
        type: 'line', 
        data: {
            labels: labels,
            datasets: [{
                label: 'RAINFALL (mm)', 
                data: data,
                backgroundColor: gradientFill,
                borderColor: '#00f3ff', 
                borderWidth: 2,
                pointBackgroundColor: '#000',
                pointBorderColor: '#00f3ff',
                pointRadius: 3,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#fff',
                fill: true, 
                tension: 0.4 
            }]
        },
        options: {
            responsive: true, 
            maintainAspectRatio: false,
            scales: {
                x: { 
                    type: 'time', 
                    time: { unit: 'hour', displayFormats: { hour: 'HH:mm' } }, 
                    ticks: { color: '#00f3ff', font: { family: 'Rajdhani' } }, 
                    grid: { color: 'rgba(0, 243, 255, 0.1)' } 
                },
                y: { 
                    beginAtZero: true, 
                    ticks: { color: '#00f3ff', font: { family: 'Rajdhani' } }, 
                    grid: { color: 'rgba(0, 243, 255, 0.1)' } 
                }
            },
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 5, 10, 0.9)',
                    titleColor: '#00f3ff',
                    bodyColor: '#fff',
                    borderColor: '#00f3ff',
                    borderWidth: 1,
                    titleFont: { family: 'Orbitron' },
                    bodyFont: { family: 'Rajdhani' },
                    displayColors: false
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });
}

// 8. Set UI ke mode Loading
function setLoadingState(message) {
    qs('#status-card').className = "card-status status-gray";
    qs('#status-icon-container').innerHTML = ICONS.loading;
    qs('#status-location').textContent = message || "MENGANALISIS...";
    qs('#status-text').textContent = "LOADING...";
    qs('#status-score').textContent = "Skor Risiko: --";
}

// 9. Set UI ke mode Error
function setErrorState(title, message) {
    qs('#status-card').className = "card-status status-red";
    qs('#status-icon-container').innerHTML = ICONS.bahaya;
    qs('#status-location').textContent = "ERROR";
    qs('#status-text').textContent = title;
    qs('#status-score').textContent = message;
}

// === Fitur Tambahan ===

// 10. Toast (Notifikasi)
function showToast(message, type = "success") {
    const toast = qs('#toast');
    toast.textContent = message;
    toast.className = "toast show";
    if (type === 'error') toast.classList.add('toast-error');
    else if (type === 'warning') toast.classList.add('toast-warning');
    else toast.classList.add('toast-success');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// 11. Modal Laporan
function showModal() {
    if (!currentCoords.lat) {
        showToast("Dapatkan lokasimu dulu sebelum melapor!", "warning");
        askLocation(); return;
    }
    qs('#report-modal').classList.remove('hidden');
}
function hideModal() { qs('#report-modal').classList.add('hidden'); }
async function handleReportSubmit(e) {
    e.preventDefault();
    const message = qs('#message').value;
    if (!message) { showToast("Isi pesan laporan dulu.", "error"); return; }
    try {
        const response = await fetch(`${API_URL}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: currentCoords.lat, lon: currentCoords.lon, message: message })
        });
        if (!response.ok) throw new Error("Gagal kirim laporan");
        showToast("Laporan berhasil terkirim! Terima kasih.", "success");
        hideModal();
        qs('#report-form').reset();
        fetchRiskData(currentCoords.lat, currentCoords.lon);
    } catch (error) { showToast("Gagal mengirim laporan. Coba lagi.", "error"); }
}

// 12. Lokasi Rumah (LocalStorage)
function setHomeLocation() {
    if (!currentCoords.lat) {
        showToast("Dapatkan lokasimu dulu untuk dijadikan lokasi rumah.", "warning");
        return;
    }
    localStorage.setItem('homeLocation', JSON.stringify(currentCoords));
    qs('#home-coords').textContent = `Lat: ${currentCoords.lat}, Lon: ${currentCoords.lon}`;
    showToast("Lokasi rumah berhasil disimpan!", "success");
}
function loadHomeLocation() {
    const home = localStorage.getItem('homeLocation');
    if (home) {
        homeCoords = JSON.parse(home);
        qs('#home-coords').textContent = `Lat: ${homeCoords.lat}, Lon: ${homeCoords.lon}`;
    }
}

// 13. [FITUR] Modal Tips
function showTipsModal() {
    qs('#tips-modal').classList.remove('hidden');
}
function hideTipsModal() {
    qs('#tips-modal').classList.add('hidden');
}

// 14. [FITUR BARU] Notifikasi Web Push (Service Worker)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function askNotificationPermission() {
    if (!('serviceWorker' in navigator)) {
        showToast("Browser tidak mendukung Service Worker", "error");
        return;
    }

    try {
        console.log("Mendaftarkan Service Worker...");
        const register = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });

        console.log("Service Worker Ready. Meminta izin notif...");
        const subscription = await register.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        console.log("Berhasil Subscribe!");

        if (!currentCoords.lat || !currentCoords.lon) {
            showToast("Tunggu sebentar, lokasi belum terdeteksi!", "warning");
            return;
        }

        const subscriberData = {
            subscription: subscription, // Kunci notifikasi
            lat: currentCoords.lat,     // Lokasi User
            lon: currentCoords.lon
        };

        // Kirim paket lengkap ke server
        await fetch('/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscriberData),
            headers: {
                'content-type': 'application/json'
            }
        });

        showToast("Background Notifikasi Aktif!", "success");

    } catch (err) {
        console.error("Gagal setup notifikasi:", err);
        showToast("Gagal mengaktifkan notifikasi (Blokir/Error).", "error");
    }
}


// === Helper Functions ===
function degToCompass(num) {
    if (typeof num !== 'number') return '--';
    const val = Math.floor((num / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
}
function getUvText(uv) {
    if (typeof uv !== 'number') return '--';
    if (uv <= 2) return "Rendah";
    if (uv <= 5) return "Sedang";
    if (uv <= 7) return "Tinggi";
    if (uv <= 10) return "Sangat Tinggi";
    return "Ekstrem";
}

// === LOGIKA ANIMASI HUJAN ===
let canvas, ctx, raindrops;
function setupRainAnimation() {
    canvas = document.getElementById('rain-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    raindrops = [];
    for (let i = 0; i < 300; i++) {
        raindrops.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 2 - canvas.height,
            length: Math.random() * 15 + 10,
            speed: Math.random() * 5 + 3
        });
    }
    window.addEventListener('resize', () => {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}
function drawRain() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(173, 216, 230, 0.3)';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    for (let i = 0; i < raindrops.length; i++) {
        const drop = raindrops[i];
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();
        drop.y += drop.speed;
        if (drop.y > canvas.height) {
            drop.y = -drop.length - Math.random() * 20;
            drop.x = Math.random() * canvas.width;
        }
    }
    rainAnimationId = requestAnimationFrame(drawRain);
}
function startRain() {
    if (!rainAnimationId && canvas) {
        console.log("Mulai animasi hujan...");
        canvas.classList.remove('hidden');
        drawRain();
    }
}
function stopRain() {
    if (rainAnimationId) {
        console.log("Hentikan animasi hujan...");
        cancelAnimationFrame(rainAnimationId);
        rainAnimationId = null;
        setTimeout(() => {
            if(ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 100);
    }
}