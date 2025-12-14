import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Paste ini di server.js bagian publicKey:');
console.log(vapidKeys.publicKey);
console.log('\nPaste ini di server.js bagian privateKey:');
console.log(vapidKeys.privateKey);