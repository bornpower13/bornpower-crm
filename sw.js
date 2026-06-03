// BornPower CRM Service Worker
const CACHE_NAME = 'bornpower-v3';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request);
    })
  );
});

// ===== NOTIFICATIONS PUSH =====
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {
    data = { title: 'BornPower', body: e.data ? e.data.text() : 'Nouvelle notification' };
  }
  // Support FCM format (data.notification) ou format simple
  var n = data.notification || data;
  var title = n.title || 'BornPower';
  var options = {
    body: n.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200],
    tag: n.tag || 'bornpower',
    data: { url: (data.data && data.data.url) || n.url || '/bornpower-crm/' },
    requireInteraction: false
  };
  try { if (self.navigator && self.navigator.setAppBadge) self.navigator.setAppBadge((data.data && parseInt(data.data.badge)) || 1); } catch(err){}
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  try { if (self.navigator && self.navigator.clearAppBadge) self.navigator.clearAppBadge(); } catch(err){}
  var url = (e.notification.data && e.notification.data.url) || '/bornpower-crm/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf('bornpower-crm') >= 0 && 'focus' in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Permet à la page d'afficher une notif via le SW (premier plan)
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'show-notif') {
    var d = e.data.payload || {};
    self.registration.showNotification(d.title || 'BornPower', {
      body: d.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      vibrate: [200, 100, 200],
      tag: d.tag || 'bornpower',
      data: { url: d.url || '/bornpower-crm/' }
    });
  }
});
