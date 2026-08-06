/* Orakzai Properties — Service Worker for Web Push */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  if (!e.data) return;
  let data = {};
  try { data = e.data.json(); } catch { data = { title: "Orakzai Alert", body: e.data.text() }; }

  const ICONS = {
    market_alert: "🏠",
    price_pulse: "📈",
    wealth_alert: "💰",
    system: "📢",
  };

  const icon = ICONS[data.type] ? undefined : undefined;

  e.waitUntil(
    self.registration.showNotification(data.title ?? "Orakzai Properties", {
      body: data.body ?? "",
      icon: "/logo.svg",
      badge: "/logo.svg",
      tag: `notif-${data.id ?? Date.now()}`,
      data: { url: "/notifications" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
