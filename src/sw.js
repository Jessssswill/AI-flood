// sw.js
self.addEventListener('push', function(event) {
    const data = event.data.json();
    
    const options = {
        body: data.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/564/564619.png', // Ganti icon jika mau
        badge: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // Buka kembali website saat notif diklik
    event.waitUntil(
        clients.openWindow('http://localhost:3000') 
    );
});