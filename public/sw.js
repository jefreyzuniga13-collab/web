self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Cuando el usuario hace clic en la notificación:
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil((async () => {
    const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Enfocar una ventana existente si hay
    if (clientsArr.length) {
      const client = clientsArr[0];
      await client.focus();
      client.postMessage({ type: 'NAVIGATE', url });
      return;
    }
    
    // Si no hay ventanas abiertas, abrir una nueva
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});