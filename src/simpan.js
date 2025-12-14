setInterval(async () => {
   console.log("🔔 Background Check: Menganalisis potensi bahaya...");

   const lat = -6.1754; 
   const lon = 106.8272;

   try {
       const [weather, elevation] = await Promise.all([
           getWeather(lat, lon),
           getElevation(lat, lon)
       ]);

       // 2. Feed to Logic ("AI" Rule-Based)
       const rain = calculateRainScore(weather);
       const histScore = getHistoricalScore(lat, lon);
       const reportScore = 0; // Asumsi belum ada laporan user di background
       const stormScore = calculateStormScore(weather);
       
       const result = calculateFloodRisk(
           rain.rainScore, elevation, histScore, reportScore, stormScore
       );

       console.log(`   > Skor Risiko Saat Ini: ${result.finalRisk} (${result.status})`);

       // 3. LOGIKA JIKA BAHAYA -> KIRIM NOTIF
       // Kita set batas > 70 agar lebih sensitif (atau 80 untuk BAHAYA murni)
       if (result.finalRisk > 70) { 
           console.log("   > 🚨 BAHAYA TERDETEKSI! MENGIRIM NOTIFIKASI...");
           
           const notificationPayload = JSON.stringify({
               title: "🚨 PERINGATAN BANJIR!",
               body: `Status: ${result.status}! Skor Risiko: ${result.finalRisk}. Segera evakuasi!`
           });

           subscribers.forEach(sub => {
               webpush.sendNotification(sub, notificationPayload).catch(err => {
                   // Hapus subscriber yang sudah tidak aktif (opsional)
               });
           });
       } else {
           console.log("   > Situasi Aman. Tidak mengirim notifikasi.");
       }

   } catch (err) {
       console.error("Gagal cek background:", err.message);
   }

}, 60000);

setInterval(async () => {
   console.log("🔔 Background Check: Menganalisis potensi bahaya...");


   try {
       const result = {
           finalRisk: 95,
           status: "BAHAYA",    
           color: "red"
       };

       console.log(`   > Skor (Simulasi): ${result.finalRisk} (${result.status})`);

       if (result.finalRisk > 70) { 
           console.log(`   > 🚨 BAHAYA DETECTED! Menyiapkan notif...`);
           
           if (subscribers.length === 0) {
               console.log("   ⚠️  GAGAL KIRIM: Tidak ada user yang subscribe (List Kosong).");
               console.log("   👉  Solusi: Buka web -> Klik tombol ALERT lonceng lagi.");
           } else {
               console.log(`   ✅  MENGIRIM ke ${subscribers.length} orang...`);
               
               const notificationPayload = JSON.stringify({
                   title: "🚨 PERINGATAN BANJIR! (TEST)",
                   body: `Status: ${result.status}! Skor: ${result.finalRisk}.`
               });
    
               subscribers.forEach((sub, index) => {
                   webpush.sendNotification(sub, notificationPayload)
                       .then(() => console.log(`       -> Sukses kirim ke User ${index + 1}`))
                       .catch(err => console.error(`       -> Gagal kirim ke User ${index + 1}:`, err.message));
               });
           }
       }

   } catch (err) {
       console.error("Error:", err);
   }

}, 10000); 

//buat ngacak2 lokasi
const res = await fetch('https://ipapi.co/json/');

qs('#location-prompt').classList.add('hidden');
qs('#dashboard').classList.remove('hidden');

setErrorState("Gagal Deteksi Lokasi", "Pastikan izin lokasi sudah aktif.");
showToast("Gagal mendapatkan lokasi. Izinkan di pengaturan browser.", "error");