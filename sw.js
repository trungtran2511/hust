/* Offline cache. Bump VERSION when files change. */
const VERSION = "hsg-2.0.0-b1";
const CORE = ["./", "index.html", "manifest.webmanifest", "css/app.css", "icons/icon-192.png", "icons/icon-512.png",
  "js/core.js", "js/i18n-en.js", "js/i18n-vi.js", "js/i18n-zh.js", "js/i18n-ko.js", "js/i18n-ja.js", "js/tkb.js", "js/data.js", "js/ui.js", "js/onboarding.js", "js/home.js", "js/tasks.js", "js/academic.js", "js/campus.js", "js/life.js", "js/support.js", "js/me.js", "js/search.js", "js/exports.js", "js/app.js",
  "data/campus.json", "data/offices.json", "data/checklist.json", "data/handbook.json", "data/phrases.json", "data/lifeguide.json", "data/notices.json", "data/tips.json", "data/assess.json", "data/faq.json", "data/activities.json", "data/tkb20261.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
