// Service Worker dédié à Firebase Cloud Messaging (notifications app fermée)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAK7ggTwWj02STFsUA8mtmwp-z1wNt561Y",
  authDomain: "bornpower-crm.firebaseapp.com",
  projectId: "bornpower-crm",
  storageBucket: "bornpower-crm.firebasestorage.app",
  messagingSenderId: "1040984120416",
  appId: "1:1040984120416:web:30e6dedad959746fd7f705"
});

const messaging = firebase.messaging();

// Notification reçue quand l'app est fermée / en arrière-plan
messaging.onBackgroundMessage(function(payload) {
  const n = payload.notification || payload.data || {};
  const title = n.title || 'BornPower';
  const options = {
    body: n.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'bornpower',
    data: { url: (payload.data && payload.data.url) || '/bornpower-crm/' }
  };
  try { if (self.navigator && self.navigator.setAppBadge) self.navigator.setAppBadge((payload.data && parseInt(payload.data.badge)) || 1); } catch(e){}
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  try { if (self.navigator && self.navigator.clearAppBadge) self.navigator.clearAppBadge(); } catch(err){}
  const url = (e.notification.data && e.notification.data.url) || '/bornpower-crm/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].url.indexOf('bornpower-crm') >= 0 && 'focus' in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
