// public/sw.js

// Listener kalau nanti mau pakai True Push Notification (VAPID)
self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message,
      icon: "/renscraft.png.png",
      badge: "/renscraft.png.png",
      vibrate: [200, 100, 200],
      data: { url: "/admin" },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Pas notif diklik
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes("/admin") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/admin");
      }
    }),
  );
});
