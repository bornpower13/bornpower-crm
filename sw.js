// BornPower CRM Service Worker
const CACHE_NAME = 'bornpower-v4';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-180.png'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL).catch(function(){ /* fichier optionnel manquant, on continue */ });
    }).then(function(){ self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  // Jamais de cache pour Firebase/Firestore : on ne veut RISQUER AUCUNE donnée périmée
  // à la place des vraies données synchronisées. Ces requêtes suivent leur cours normal.
  if (url.indexOf('firestore.googleapis.com') !== -1 ||
      url.indexOf('firebaseio.com') !== -1 ||
      url.indexOf('googleapis.com') !== -1 ||
      url.indexOf('gstatic.com') !== -1) {
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(response){
      if (response && response.status === 200) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, copy); });
      }
      return response;
    }).catch(function() {
      return caches.match(e.request).then(function(cached){
        return cached || caches.match('./index.html');
      });
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
