/* Boot: load content, choose onboarding or app, register the service worker. */
(function(root){
"use strict";
const H = root.H;
H.onTKB = () => { if (H.S.stage === "app") H.render(true); };
function start(){
  H.applyTheme();
  const p = H.db.profile;
  H.S.stage = p.onboarded ? "app" : "onboarding";
  const h = (location.hash || "").slice(1); if (H.TABS.some(t => t.id === h)) H.S.tab = h;
  H.render();
  if (H.db.tt.ids.length) H.ensureTKB();
  window.addEventListener("hashchange", () => { const t = (location.hash || "").slice(1); if (t !== H.S.tab && H.TABS.some(x => x.id === t) && H.S.stage === "app") { H.S.tab = t; H.render(); } });
  window.addEventListener("pagehide", () => H.saveNow());
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => H.applyTheme()); } catch (e) {}
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) navigator.serviceWorker.register("sw.js").catch(() => {});
}
document.getElementById("app").innerHTML = '<div style="padding:24px">Loading…</div>';
H.loadContent().then(start, e => {
  console.error(e);
  document.getElementById("app").innerHTML = '<div style="padding:24px"><h1>Could not load</h1><p>The app content failed to load. Check your connection and reload. If you opened index.html directly from a folder, serve it over http instead (see README).</p></div>';
});
})(window);
