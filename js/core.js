/* Core: namespace, safe templating, storage with migration, i18n, UI helpers, router. */
(function(root){
"use strict";
const H = root.H = root.H || {};
H.version = "2.0.0"; H.data = {}; H.views = {}; H.actions = {}; H.inputs = {}; H.changes = {}; H.searchers = []; H.hooks = [];

/* ---------- safe templating: every interpolation is escaped unless it is already Raw ---------- */
function Raw(s){ this.s = s; }
const ESC = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
const esc = H.esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ESC[c]);
const str = H.str = v => v instanceof Raw ? v.s : Array.isArray(v) ? v.map(str).join("") : (v == null || v === false) ? "" : esc(v);
H.raw = s => new Raw(String(s));
H.html = (a, ...v) => { let o = a[0]; for (let i = 0; i < v.length; i++) o += str(v[i]) + a[i + 1]; return new Raw(o); };
const html = H.html;
H.safeUrl = u => { try { const x = new URL(u, "https://x.invalid"); return (x.protocol === "https:" || x.protocol === "http:") ? u : ""; } catch (e) { return ""; } };
H.fold = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
H.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------- icons ---------- */
const P = {
 home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 book:'<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
 pin:'<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
 shield:'<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
 sos:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>', check:'<path d="m5 12 5 5 9-10"/>', x:'<path d="M6 6l12 12M18 6 6 18"/>',
 right:'<path d="m9 5 7 7-7 7"/>', left:'<path d="m15 5-7 7 7 7"/>', down:'<path d="m5 9 7 7 7-7"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 vol:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
 copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
 down2:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>', up2:'<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
 nav:'<path d="m4 11 16-7-7 16-2-7z"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
 ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
 phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
 bell:'<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
 list:'<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
 grid:'<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
 lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 gps:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
 flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
 med:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
 bus:'<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M7 21v-3M17 21v-3M8 15h.01M16 15h.01"/>',
 cash:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
 food:'<path d="M6 3v8a2 2 0 0 0 2 2v8M10 3v8M18 3c-2 2-3 5-3 8h3v10"/>',
 wifi:'<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>',
 bed:'<path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/>',
 bag:'<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
 people:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5M16 5a3.5 3.5 0 0 1 0 6.5M18 15c2 .6 3.3 2.3 3.8 5"/>',
 moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
 target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
 turnl:'<path d="M17 20v-7a3 3 0 0 0-3-3H6M10 6l-4 4 4 4"/>', turnr:'<path d="M7 20v-7a3 3 0 0 1 3-3h8M14 6l4 4-4 4"/>', up:'<path d="M12 20V5M6 11l6-6 6 6"/>',
 flash:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 10h8M8 14h5"/>',
 note:'<path d="M5 4h14v16H5zM9 9h6M9 13h6"/>'
};
H.icon = (n, cls) => html`<svg class="i ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${H.raw(P[n] || P.info)}</svg>`;
const ic = H.icon;

/* ---------- storage: versioned, with migration from the 1.x prototype ---------- */
const KEY = "hsg2", SCHEMA = 2;
function defaults(){ return {
  v: SCHEMA,
  profile: {name:"", lang:null, theme:"system", bilingual:false, role:null, program:"", year:"", major:"", needs:[], onboarded:false, quick:["map","planner","rooms","phrases","office","checklist"]},
  tt: {ids:[], weekStart:"", planName:"My timetable"},
  tasks: [], checklist: {done:{}, notes:{}, due:{}}, saved: {buildings:[], rooms:[], courses:[], phrases:[], guides:[], contacts:[]},
  notes: [], contacts: [], gpa: {rows:[], scale:null}, learn: {known:{}, recent:[], streak:{}}, assess: null, feedback: [], lastSeen: {}
}; }
let memoryOnly = false;
function migrate(d){
  if (!d || typeof d !== "object") return defaults();
  const base = defaults();
  const out = Object.assign(base, d);
  out.profile = Object.assign(base.profile, d.profile || {});
  out.tt = Object.assign(base.tt, d.tt || {});
  out.checklist = Object.assign(base.checklist, d.checklist || {});
  out.saved = Object.assign(base.saved, d.saved || {});
  out.gpa = Object.assign(base.gpa, d.gpa || {});
  out.learn = Object.assign(base.learn, d.learn || {});
  out.v = SCHEMA; return out;
}
function legacy(){ // 1.x prototype stored hisg_lang, hisg_user, hisg_sel_<id>, hisg_semStart (the start date was an assumption, so it is dropped)
  const d = defaults(); let found = false;
  try {
    const lang = localStorage.getItem("hisg_lang"); if (lang) { d.profile.lang = JSON.parse(lang); found = true; }
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf("hisg_sel_") === 0) { const ids = JSON.parse(localStorage.getItem(k)); if (Array.isArray(ids) && ids.length) { d.tt.ids = ids.map(String); found = true; break; } } }
  } catch (e) {}
  if (found) d.profile.onboarded = false;
  return d;
}
function load(){
  try { const raw = localStorage.getItem(KEY); if (raw) return migrate(JSON.parse(raw)); } catch (e) { memoryOnly = true; }
  return legacy();
}
H.db = load();
let st = 0;
H.save = function(){ clearTimeout(st); st = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(H.db)); } catch (e) { memoryOnly = true; } }, 150); };
H.saveNow = function(){ clearTimeout(st); try { localStorage.setItem(KEY, JSON.stringify(H.db)); } catch (e) { memoryOnly = true; } };
H.storageOK = () => !memoryOnly;
H.exportData = () => JSON.stringify({app:"HUST International Survival Guide", exportedAt:new Date().toISOString(), data:H.db}, null, 1);
H.importData = txt => { let o; try { o = JSON.parse(txt); } catch (e) { throw new Error("not-json"); } const d = o && o.data ? o.data : o; if (!d || typeof d !== "object" || !d.profile || !d.tt) throw new Error("bad-shape"); H.db = migrate(d); H.saveNow(); };
H.wipe = () => { try { localStorage.removeItem(KEY); Object.keys(localStorage).filter(k => k.indexOf("hisg_") === 0).forEach(k => localStorage.removeItem(k)); } catch (e) {} H.db = defaults(); };
H.toggleIn = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); return i < 0; };

/* ---------- i18n ---------- */
H.LANGS = [{id:"en", n:"English", e:"English"}, {id:"vi", n:"Tiếng Việt", e:"Vietnamese"}, {id:"zh", n:"中文", e:"Chinese"}, {id:"ko", n:"한국어", e:"Korean"}, {id:"ja", n:"日本語", e:"Japanese"}];
H.dict = {};
H.addStrings = (lang, o) => { H.dict[lang] = Object.assign(H.dict[lang] || {}, o); };
H.lang = () => H.db.profile.lang || "en";
H.t = (k, vars) => {
  let s = (H.dict[H.lang()] || {})[k]; if (s == null) s = (H.dict.en || {})[k]; if (s == null) s = k;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, n) => vars[n] != null ? vars[n] : m);
  return s;
};
H.tx = (k, vars) => H.raw(esc(H.t(k, vars)));
/* bilingual: show the Vietnamese beside the chosen language */
H.tb = k => { const t = H.t(k); if (!H.db.profile.bilingual || H.lang() === "vi") return t; const v = (H.dict.vi || {})[k]; return v ? html`${t} <span class="muted xs">· ${v}</span>` : t; };
/* pick a localized value from {en,vi,zh,ko,ja} */
H.loc = o => { if (o == null) return ""; if (typeof o === "string") return o; return o[H.lang()] || o.en || ""; };

/* ---------- source / trust badges ---------- */
H.TRUST = {
  official:{k:"trust_official", c:"ok"}, reference:{k:"trust_reference", c:"warn"}, sample:{k:"trust_sample", c:""}, unverified:{k:"trust_unverified", c:"bad"}, user:{k:"trust_user", c:"info"}
};
/* meta: {s:'official'|'reference'|'sample'|'unverified', src:'label', url, date:'YYYY-MM-DD'|'undated'} */
H.badge = m => { if (!m) return ""; const t = H.TRUST[m.s] || H.TRUST.unverified; return html`<span class="chip ${t.c}">${H.t(t.k)}</span>`; };
H.source = m => { if (!m) return ""; const u = m.url ? H.safeUrl(m.url) : ""; return html`<div class="src">${H.badge(m)}${m.src ? html`<span>${u ? html`<a href="${u}" target="_blank" rel="noopener noreferrer">${m.src}</a>` : m.src}</span>` : ""}${m.date ? html`<span>· ${m.date === "undated" ? H.t("src_undated") : H.t("src_checked", {d:m.date})}</span>` : ""}</div>`; };
H.link = (url, label, cls) => { const u = H.safeUrl(url); return u ? html`<a class="btn ${cls || "sm"}" href="${u}" target="_blank" rel="noopener noreferrer">${label} ${ic("ext")}</a>` : ""; };

/* ---------- toast and sheets ---------- */
H.toast = function(msg, kind){
  const box = document.getElementById("toasts"); if (!box) return;
  const d = document.createElement("div"); d.className = "toast" + (kind ? " " + kind : ""); d.textContent = msg; box.appendChild(d);
  setTimeout(() => d.remove(), 3600);
};
let sheetStack = [];
H.sheet = function(title, body, opts){
  opts = opts || {};
  const root = document.getElementById("sheetRoot"); const returnTo = document.activeElement;
  const id = "sh" + H.uid();
  const wrap = document.createElement("div"); wrap.className = "scrim"; wrap.dataset.sheet = id;
  wrap.innerHTML = html`<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="${id}t"><header><h2 id="${id}t">${title}</h2><button class="ibtn sm" data-a="closeSheet" aria-label="${H.t("close")}">${ic("x")}</button></header><div class="body" id="${id}b">${body}</div></div>`.s;
  wrap.addEventListener("mousedown", e => { if (e.target === wrap) H.closeSheet(id); });
  root.appendChild(wrap); root.style.pointerEvents = "auto"; sheetStack.push({id, wrap, returnTo, onClose:opts.onClose});
  const f = wrap.querySelector("input,textarea,select,.body button,.body a"); if (f && opts.focus !== false) setTimeout(() => f.focus({preventScroll:true}), 30);
  return id;
};
H.closeSheet = function(id){
  const i = id ? sheetStack.findIndex(s => s.id === id) : sheetStack.length - 1; if (i < 0) return;
  const s = sheetStack.splice(i, 1)[0]; s.wrap.remove();
  if (!sheetStack.length) document.getElementById("sheetRoot").style.pointerEvents = "none";
  if (s.onClose) s.onClose(); try { if (s.returnTo && document.contains(s.returnTo)) s.returnTo.focus({preventScroll:true}); } catch (e) {}
};
H.closeAllSheets = () => { while (sheetStack.length) H.closeSheet(); };
H.refreshSheet = (body) => { const s = sheetStack[sheetStack.length - 1]; if (!s) return; const b = document.getElementById(s.id + "b"); if (b) b.innerHTML = str(body); };
H.topSheetBody = () => { const s = sheetStack[sheetStack.length - 1]; return s ? document.getElementById(s.id + "b") : null; };
document.addEventListener("keydown", e => { if (e.key === "Escape" && sheetStack.length) { e.preventDefault(); H.closeSheet(); } });
H.confirm = (title, msg, okLabel, onOk, danger) => {
  H.sheet(title, html`<p>${msg}</p><div class="row wrap"><button class="btn ${danger ? "danger" : "primary"} grow" data-a="confirmOk">${okLabel}</button><button class="btn grow" data-a="closeSheet">${H.t("cancel")}</button></div>`);
  H._confirm = onOk;
};
H.actions.confirmOk = () => { const f = H._confirm; H._confirm = null; H.closeSheet(); if (f) f(); };
H.actions.closeSheet = () => H.closeSheet();

/* ---------- speech: Web Speech API, with honest handling when no Vietnamese voice exists ---------- */
let viVoice = null, voicesReady = false;
function pickVoice(){ try { const vs = speechSynthesis.getVoices(); voicesReady = vs.length > 0; viVoice = vs.find(v => /^vi([-_]|$)/i.test(v.lang)) || null; } catch (e) {} }
try { pickVoice(); speechSynthesis.addEventListener("voiceschanged", pickVoice); } catch (e) {}
H.speechState = () => !("speechSynthesis" in root) ? "none" : viVoice ? "vi" : "novoice";
H.speak = function(text, btn){
  if (!("speechSynthesis" in root)) { H.toast(H.t("speech_none"), "bad"); return; }
  try {
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "vi-VN"; u.rate = .85; if (viVoice) u.voice = viVoice;
    if (btn) { btn.classList.add("playing"); u.onend = u.onerror = () => btn.classList.remove("playing"); }
    speechSynthesis.speak(u);
    if (!viVoice) H.toast(H.t("speech_novoice"));
  } catch (e) { H.toast(H.t("speech_none"), "bad"); }
};
H.sayBtn = txt => html`<button class="say" data-a="say" data-text="${txt}" aria-label="${H.t("play_audio")}: ${txt}">${ic("vol")}</button>`;
H.actions.say = el => H.speak(el.dataset.text, el);

/* ---------- date helpers ---------- */
H.today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
H.ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
H.parseYmd = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); if (!m) return null; const d = new Date(+m[1], +m[2] - 1, +m[3]); return isNaN(d) || d.getMonth() !== +m[2] - 1 ? null : d; };
H.fmtDate = (d, opt) => { try { return d.toLocaleDateString(H.lang() === "vi" ? "vi-VN" : H.lang() === "zh" ? "zh-CN" : H.lang() === "ko" ? "ko-KR" : H.lang() === "ja" ? "ja-JP" : "en-GB", opt || {weekday:"long", day:"numeric", month:"long"}); } catch (e) { return H.ymd(d); } };
H.download = function(name, mime, data){
  try { const b = data instanceof Blob ? data : new Blob([data], {type:mime}); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); return true; } catch (e) { return false; }
};

/* ---------- router and rendering ---------- */
H.S = {tab:"home", sub:{}, stage:"app", ob:{step:0}};
H.TABS = []; // filled by modules: {id, icon, key, subs:[{id,key}], default}
H.go = function(tab, sub, param){
  H.closeAllSheets(); H.S.tab = tab; if (sub) H.S.sub[tab] = sub; H.S.param = param;
  try { history.replaceState(null, "", "#" + tab); } catch (e) {}
  H.render(); const m = document.getElementById("main"); if (m) { m.scrollTop = 0; m.focus && m.focus({preventScroll:true}); }
};
H.subOf = tab => { const t = H.TABS.find(x => x.id === tab); return H.S.sub[tab] || (t && t.subs && t.subs[0] && t.subs[0].id); };
H.applyTheme = function(){
  const th = H.db.profile.theme, r = document.documentElement;
  if (th === "light" || th === "dark") r.setAttribute("data-theme", th); else r.removeAttribute("data-theme");
  r.lang = H.lang();
  try { let m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = (th === "dark" || (th === "system" && matchMedia("(prefers-color-scheme: dark)").matches)) ? "#1C1A1B" : "#A81C2E"; } catch (e) {}
};
H.subTabs = function(tab){
  const t = H.TABS.find(x => x.id === tab); if (!t || !t.subs) return "";
  const cur = H.subOf(tab);
  return html`<div class="seg" role="tablist" aria-label="${H.t(t.key)}">${t.subs.map(s => html`<button role="tab" aria-selected="${s.id === cur}" data-a="sub" data-tab="${tab}" data-sub="${s.id}">${H.tb(s.key)}</button>`)}</div>`;
};
H.actions.sub = el => { H.S.sub[el.dataset.tab] = el.dataset.sub; H.render(); const m = document.getElementById("main"); if (m) m.scrollTop = 0; };
H.actions.tab = el => H.go(el.dataset.tab, el.dataset.sub || null);
H.actions.go = el => H.go(el.dataset.tab, el.dataset.sub, el.dataset.param);

H.render = function(keepScroll){
  const app = document.getElementById("app"); if (!app) return;
  H.applyTheme();
  const m0 = document.getElementById("main"), sc = m0 ? m0.scrollTop : 0;
  if (H.S.stage === "onboarding") { app.innerHTML = str(H.views.onboarding.render()); return; }
  const tab = H.TABS.find(t => t.id === H.S.tab) || H.TABS[0];
  const v = H.views[tab.id], p = H.db.profile;
  const body = v.render(H.subOf(tab.id), H.S.param);
  app.innerHTML = str(html`
    <header class="top gut">
      <button class="brand" data-a="tab" data-tab="home" aria-label="${H.t("app_name")}"><span class="mark">HUST</span><span class="grow" style="min-width:0"><b>${H.t("app_name")}</b><span>${p.name ? p.name : H.t("app_unofficial_short")}</span></span></button>
      <button class="hbtn" data-a="openSearch" aria-label="${H.t("search")}">${ic("search")}</button>
      <button class="hbtn sos" data-a="openSOS" aria-label="${H.t("sos_help")}">${ic("sos")}<span>${H.t("sos_short")}</span></button>
      <button class="hbtn" data-a="tab" data-tab="me" aria-label="${H.t("profile")}">${ic("user")}</button>
    </header>
    <main id="main" tabindex="-1" class="">${body}</main>
    <nav class="tabs gut" aria-label="${H.t("nav_main")}">${H.TABS.filter(t => !t.hidden).map(t => html`<button data-a="tab" data-tab="${t.id}" ${H.S.tab === t.id ? html`aria-current="page"` : ""}>${ic(t.icon)}<span class="l">${H.t(t.key)}</span></button>`)}</nav>`);
  const m = document.getElementById("main"); if (m && keepScroll) m.scrollTop = sc;
  if (v.after) v.after(H.subOf(tab.id), H.S.param);
  H.hooks.forEach(f => f());
};
H.patch = (sel, content) => { const e = document.querySelector(sel); if (e) e.innerHTML = str(content); return e; };

document.addEventListener("click", e => {
  const el = e.target.closest("[data-a]"); if (!el || el.disabled) return;
  const f = H.actions[el.dataset.a]; if (f) { try { f(el, e); } catch (err) { console.error(err); H.toast(H.t("err_generic"), "bad"); } }
});
document.addEventListener("input", e => { const el = e.target.closest("[data-in]"); if (el && H.inputs[el.dataset.in]) H.inputs[el.dataset.in](el, e); });
document.addEventListener("change", e => { const el = e.target.closest("[data-ch]"); if (el && H.changes[el.dataset.ch]) H.changes[el.dataset.ch](el, e); });
window.addEventListener("error", e => { try { console.error(e.error || e.message); } catch (x) {} });
H.debounce = (f, ms) => { let t; return function(){ const a = arguments, th = this; clearTimeout(t); t = setTimeout(() => f.apply(th, a), ms); }; };
if (typeof module !== "undefined") module.exports = H;
})(typeof window !== "undefined" ? window : globalThis);
