// Service worker for PWA install + push notifications
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    try {
      data = { body: event.data ? event.data.text() : "" };
    } catch {
      // ignore
    }
  }
  const title = data.title || "DOOOZ";
  const options = {
    body: data.body || "새 알림이 있어요",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "doooz-" + Date.now(),
    renotify: true,
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const baseUrl = event.notification.data?.url || "/";
  // Add timestamp to force fresh load
  const sep = baseUrl.includes("?") ? "&" : "?";
  const url = baseUrl + sep + "_t=" + Date.now();
  // Try to focus existing window first, otherwise open new
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes("do-ooz.vercel.app") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
