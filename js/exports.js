/* Timetable export and import: PNG, PDF (image page), ICS, JSON. Everything runs in the browser. */
(function(root){
"use strict";
const H = root.H, T = H.tkb;
const PAL = ["#C0392B", "#2471A3", "#1E8449", "#B9770E", "#7D3C98", "#117A8B"];
const DAYS = {2:"Mon", 3:"Tue", 4:"Wed", 5:"Thu", 6:"Fri", 7:"Sat", 8:"Sun"};
function weekNow(){ const tt = H.db.tt; if (!tt.weekStart) return 0; const w = T.weekOf(tt.weekStart, new Date()); return w >= 1 && w <= 25 ? w : 0; }
function draw(week){
  const D = H.tk.D, ids = H.db.tt.ids, items = T.sessionsFor(D, ids, week);
  if (!items.length) return null;
  const days = [2, 3, 4, 5, 6, 7].concat(items.some(i => i.s.d === 8) ? [8] : []);
  const m0 = Math.floor(Math.min(...items.map(i => T.mins(i.s.s))) / 60) * 60, m1 = Math.ceil(Math.max(...items.map(i => T.mins(i.s.e))) / 60) * 60;
  const LW = 70, CW = 200, HH = 60, TOP = 70, PX = 1.5, W = LW + CW * days.length, Hh = TOP + HH + (m1 - m0) * PX + 50;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = Hh; const g = cv.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, Hh); g.fillStyle = "#222"; g.font = "bold 28px sans-serif";
  g.fillText((H.db.tt.planName || "HUST timetable") + " · " + (week ? "Week " + week : "All weeks"), 20, 44);
  g.font = "bold 20px sans-serif"; days.forEach((d, i) => { g.fillStyle = "#f2f2f2"; g.fillRect(LW + i * CW, TOP, CW - 2, HH - 6); g.fillStyle = "#222"; g.fillText(DAYS[d], LW + i * CW + 10, TOP + 32); });
  g.font = "16px sans-serif"; for (let m = m0; m <= m1; m += 60) { const y = TOP + HH + (m - m0) * PX; g.fillStyle = "#ddd"; g.fillRect(LW, y, W - LW, 1); g.fillStyle = "#555"; g.fillText(String(m / 60).padStart(2, "0") + ":00", 10, y + 5); }
  items.forEach(i => {
    const x = LW + days.indexOf(i.s.d) * CW + 2, y = TOP + HH + (T.mins(i.s.s) - m0) * PX, h = (T.mins(i.s.e) - T.mins(i.s.s)) * PX - 2;
    g.fillStyle = PAL[H.colorOf(i.c.code)]; g.fillRect(x, y, CW - 6, h); g.fillStyle = "#fff"; g.font = "bold 16px sans-serif";
    const lines = [i.c.code, T.hhmm(i.s.s) + "-" + T.hhmm(i.s.e) + (i.s.room ? "  " + i.s.room : ""), H.courseName(i.c.code)];
    lines.forEach((t, k) => { if (22 * (k + 1) + 4 <= h) { let s = t; while (g.measureText(s).width > CW - 20 && s.length > 3) s = s.slice(0, -2); g.fillText(s === t ? s : s + "…", x + 8, y + 22 * (k + 1)); } });
  });
  g.fillStyle = "#666"; g.font = "14px sans-serif"; g.fillText("Planning only, not official registration. HUST International Survival Guide is not an official HUST app.", 20, Hh - 16);
  return cv;
}
function pdfFromJpeg(jpeg, w, h){
  const enc = new TextEncoder(), parts = [], off = []; let len = 0;
  const push = b => { const u = typeof b === "string" ? enc.encode(b) : b; parts.push(u); len += u.length; };
  const PW = 842, PH = 595, k = Math.min((PW - 40) / w, (PH - 40) / h), iw = w * k, ih = h * k, x = (PW - iw) / 2, y = (PH - ih) / 2;
  const content = "q " + iw.toFixed(2) + " 0 0 " + ih.toFixed(2) + " " + x.toFixed(2) + " " + y.toFixed(2) + " cm /Im0 Do Q";
  push("%PDF-1.4\n");
  const obj = (n, body) => { off[n] = len; push(n + " 0 obj\n" + body + "\nendobj\n"); };
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>"); obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + PW + " " + PH + "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>");
  off[4] = len; push("4 0 obj\n<< /Type /XObject /Subtype /Image /Width " + w + " /Height " + h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpeg.length + " >>\nstream\n"); push(jpeg); push("\nendstream\nendobj\n");
  obj(5, "<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream");
  const xr = len; push("xref\n0 6\n0000000000 65535 f \n"); for (let i = 1; i <= 5; i++) push(String(off[i]).padStart(10, "0") + " 00000 n \n");
  push("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xr + "\n%%EOF");
  const out = new Uint8Array(len); let p = 0; parts.forEach(u => { out.set(u, p); p += u.length; }); return out;
}
function need(){ if (!H.db.tt.ids.length || !H.tk.D) { H.toast(H.t("export_none"), "bad"); return null; } return true; }
const wk = () => { const sel = document.getElementById("ttWeek"); return sel ? +sel.value : weekNow(); };
H.actions.expPNG = () => { if (!need()) return; const cv = draw(wk()); if (!cv) { H.toast(H.t("export_none"), "bad"); return; } cv.toBlob(b => { H.download("timetable.png", "image/png", b); H.toast(H.t("export_done")); }, "image/png"); };
H.actions.expPDF = () => {
  if (!need()) return; const cv = draw(wk()); if (!cv) { H.toast(H.t("export_none"), "bad"); return; }
  const b64 = cv.toDataURL("image/jpeg", .92).split(",")[1], bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  H.download("timetable.pdf", "application/pdf", pdfFromJpeg(u, cv.width, cv.height)); H.toast(H.t("export_done"));
};
H.actions.expICS = () => {
  if (!need()) return; const tt = H.db.tt;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tt.weekStart || "")) { H.sheet(H.t("ics_need_start"), H.html`<p>${H.t("ics_need_start_d")}</p><button class="btn primary block" data-a="closeSheet">${H.t("close")}</button>`); return; }
  try { const r = T.toICS(H.tk.D, tt.ids, tt.weekStart, tt.planName || "HUST timetable"); H.download("timetable.ics", "text/calendar", r.text); H.toast(H.t("export_done") + " · " + H.t("ics_events", {n:r.events}) + (r.skipped ? " · " + H.t("ics_skipped", {n:r.skipped}) : "")); } catch (e) { H.toast(H.t("err_generic"), "bad"); }
};
H.actions.expJSON = () => { if (!need()) return; const tt = H.db.tt; H.download("timetable.json", "application/json", JSON.stringify({app:"HUST International Survival Guide", kind:"timetable", term:H.tk.D.term, planName:tt.planName || "", weekStart:tt.weekStart || "", ids:tt.ids}, null, 1)); H.toast(H.t("export_done")); };
H.changes.impJson = el => {
  const f = el.files && el.files[0]; el.value = ""; if (!f) return;
  if (f.size > 2e6) { H.toast(H.t("import_too_big"), "bad"); return; }
  f.text().then(txt => {
    let o; try { o = JSON.parse(txt); } catch (e) { H.toast(H.t("import_bad_json"), "bad"); return; }
    if (!o || o.kind !== "timetable" || !Array.isArray(o.ids)) { H.toast(H.t("import_bad_shape"), "bad"); return; }
    H.ensureTKB().then(() => {
      const D = H.tk.D; const ok = o.ids.filter(id => typeof id === "string" && D.byId[id]), miss = o.ids.length - ok.length;
      H.db.tt.ids = ok; if (typeof o.weekStart === "string" && H.parseYmd(o.weekStart)) H.db.tt.weekStart = o.weekStart; if (typeof o.planName === "string") H.db.tt.planName = o.planName.slice(0, 60);
      H.save(); H.render(true); H.toast(H.t("import_ok", {n:ok.length}) + (miss ? " · " + H.t("import_missing", {n:miss}) : ""), miss ? "" : "ok");
    });
  }, () => H.toast(H.t("import_bad_json"), "bad"));
};
H._exp = {draw, pdfFromJpeg};
})(window);
