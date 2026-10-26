/* Global search and the Emergency (SOS) centre. */
(function(root){
"use strict";
const H = root.H, html = H.html, ic = H.icon;
const GROUPS = ["g_courses", "g_places", "g_offices", "g_handbook", "g_phrases", "g_help", "g_tasks"];

function search(q){
  q = H.fold(q.trim()); if (q.length < 2) return [];
  const out = [], has = s => H.fold(s).indexOf(q) >= 0, add = (g, title, sub, a) => out.push({g, title, sub, a});
  const D = H.tk.D; if (D) { let n = 0; for (const c of D.courses) { if (has(c.code + " " + (c.en || "") + " " + (c.vi || ""))) { add("g_courses", c.en || c.vi || c.code, c.code, {a:"courseOpen", code:c.code}); if (++n >= 6) break; } } }
  H.C.campus.buildings.forEach(b => { if (has(b.id + " " + b.name + " " + b.vi)) add("g_places", b.name, b.vi, {a:"navTo", id:b.id}); });
  H.C.offices.offices.forEach(o => { if (has(o.name + " " + o.vi + " " + (o.does || []).join(" "))) add("g_offices", o.name, o.vi, {a:"officeOpen", id:o.id}); });
  H.C.handbook.topics.forEach(t => { if (has(t.t.en + " " + t.t.vi + " " + t.intro)) add("g_handbook", H.loc(t.t), t.applies, {a:"hbOpen", id:t.id}); });
  H.C.phrases.phrases.forEach(p => { if (has(p.vi + " " + p.tr.en + " " + p.rom)) add("g_phrases", p.vi, p.tr.en, {a:"go", tab:"life", sub:"vi"}); });
  H.C.faq.faq.forEach(f => { if (has(f.q.en + " " + (f.q.vi || "") + " " + f.k)) add("g_help", f.q.en, "", {a:"go", tab:f.go[0], sub:f.go[1]}); });
  H.C.lifeguide.topics.forEach(t => { if (has(H.loc(t.t) + " " + t.t.en)) add("g_help", H.loc(t.t), "", {a:"guideOpen", id:t.id}); });
  H.db.tasks.forEach(t => { if (has(t.title + " " + (t.note || ""))) add("g_tasks", t.title, "", {a:"taskEdit", id:t.id}); });
  if (/^[a-z]\d{1,2}[- ]?\d{2,4}$/i.test(q)) add("g_places", q.toUpperCase(), H.t("room_finder"), {a:"go", tab:"campus", sub:"rooms", param:q.toUpperCase()});
  return out;
}
function results(q){
  const R = search(q); if (q.trim().length < 2) return html`<p class="small muted">${H.t("search_hint")}</p>`;
  if (!R.length) return H.empty("search", H.t("no_results"), H.t("no_results_d"));
  return html`${GROUPS.map(g => { const L = R.filter(r => r.g === g).slice(0, 6); return L.length ? html`<section class="stack-s"><div class="eyebrow">${H.t(g)}</div><div class="list card">${L.map(r => html`<button class="li tap" data-a="srchGo" data-i="${R.indexOf(r)}"><div class="grow"><b>${r.title}</b>${r.sub ? html`<div class="small muted">${r.sub}</div>` : ""}</div>${ic("right")}</button>`)}</div></section>` : ""; })}`;
}
let last = [];
H.actions.openSearch = () => { H.sheet(H.t("search"), html`<input class="inp" id="gq" type="search" data-in="gq" placeholder="${H.t("search_ph")}" autocomplete="off" aria-label="${H.t("search")}"><div id="gqOut" class="stack">${results("")}</div>`); };
H.inputs.gq = H.debounce(el => { last = search(el.value); H.patch("#gqOut", results(el.value)); }, 120);
H.actions.srchGo = el => {
  const q = (document.getElementById("gq") || {}).value || "", r = search(q)[+el.dataset.i]; if (!r) return;
  const a = r.a; if (a.a === "go") { H.go(a.tab, a.sub, a.param); return; }
  if (a.a === "navTo") { H.closeAllSheets(); H.navTo(a.id); return; }
  const d = {dataset:a}; H.actions[a.a](d);
};

/* ---------- SOS: verified national numbers only; user adds personal contacts ---------- */
const NUMS = [["113", "sos_police"], ["114", "sos_fire"], ["115", "sos_ambulance"]];
function sosBody(){
  const C = H.db.contacts, em = H.C.phrases.phrases.filter(p => p.lvl === "emergency").slice(0, 8);
  return html`<div class="stack">${H.alert("bad", H.t("sos_intro"))}
    <section class="card"><h3>${H.t("sos_national")}</h3><div class="list">${NUMS.map(n => html`<div class="li"><b class="mono" style="font-size:1.4rem;min-width:56px">${n[0]}</b><span class="grow">${H.t(n[1])}</span><a class="btn primary sm" href="tel:${n[0]}">${ic("phone")} ${H.t("call")}</a></div>`)}</div><p class="xs muted">${H.t("sos_numbers_note")}</p></section>
    <section class="card"><h3>${H.t("sos_say")}</h3><div class="list">${em.map(p => html`<div class="li"><div class="grow"><div class="phrase-vi" lang="vi">${p.vi}</div><div class="small">${H.loc(p.tr)}</div></div>${H.sayBtn(p.vi)}</div>`)}</div></section>
    <section class="card"><h3>${H.t("sos_mine")}</h3>${C.length ? html`<div class="list">${C.map(c => html`<div class="li"><div class="grow"><b>${c.name}</b>${c.note ? html`<div class="small muted">${c.note}</div>` : ""}</div>${/^[+\d][\d\s().-]{4,}$/.test(c.phone) ? html`<a class="btn sm" href="tel:${c.phone.replace(/[^\d+]/g, "")}">${c.phone}</a>` : html`<span class="mono">${c.phone}</span>`}<button class="ibtn sm" data-a="sosDel" data-id="${c.id}" aria-label="${H.t("delete")}">${ic("trash")}</button></div>`)}</div>` : html`<p class="small muted">${H.t("sos_mine_empty")}</p>`}
      <form data-form="sos" class="stack-s"><div class="row wrap"><input class="inp grow" name="name" placeholder="${H.t("sos_name")}" maxlength="40" aria-label="${H.t("sos_name")}" required><input class="inp grow" name="phone" type="tel" placeholder="${H.t("phone")}" maxlength="24" aria-label="${H.t("phone")}" required></div><button class="btn sm" type="submit">${ic("plus")} ${H.t("add")}</button></form></section>
    <section class="card"><h3>${H.t("sos_where")}</h3><p class="small">${H.t("sos_where_d")}</p><button class="btn block" data-a="sosLoc">${ic("pin")} ${H.t("sos_show_loc")}</button><div id="locOut"></div></section>
    <section class="card"><h3>${H.t("sos_campus")}</h3><p class="small">${H.t("sos_campus_d")}</p><div class="row wrap"><button class="btn sm" data-a="officeOpen" data-id="security">${H.C.office.security.name}</button><button class="btn sm" data-a="officeOpen" data-id="clinic">${H.C.office.clinic.name}</button></div></section></div>`;
}
H.actions.openSOS = () => H.sheet(H.t("sos_title"), sosBody());
document.addEventListener("submit", e => {
  const f = e.target.closest("[data-form='sos']"); if (!f) return; e.preventDefault();
  const v = Object.fromEntries(new FormData(f)), name = String(v.name || "").trim().slice(0, 40), phone = String(v.phone || "").trim().slice(0, 24);
  if (!name || !phone) return; H.db.contacts.push({id:H.uid(), name, phone, note:""}); H.save(); H.refreshSheet(sosBody());
});
H.actions.sosDel = el => { H.db.contacts = H.db.contacts.filter(c => c.id !== el.dataset.id); H.save(); H.refreshSheet(sosBody()); };
/* location is requested only on tap and is never sent anywhere; accuracy is whatever the device reports */
H.actions.sosLoc = () => {
  const out = document.getElementById("locOut"); if (!out) return;
  if (!navigator.geolocation) { out.innerHTML = H.str(H.alert("warn", H.t("loc_none"))); return; }
  out.innerHTML = H.str(html`<div class="row"><span class="spinner"></span> ${H.t("loading")}</div>`);
  navigator.geolocation.getCurrentPosition(p => {
    const la = p.coords.latitude.toFixed(5), lo = p.coords.longitude.toFixed(5), acc = Math.round(p.coords.accuracy);
    out.innerHTML = H.str(html`<div class="stack-s"><p class="mono">${la}, ${lo}</p><p class="small">${H.t("loc_acc", {m:acc})}</p><div class="row wrap">${H.link("https://www.google.com/maps/search/?api=1&query=" + la + "," + lo, "Maps")}<button class="btn sm" data-a="copy" data-v="${la}, ${lo}">${ic("copy")} ${H.t("copy")}</button></div></div>`);
  }, () => { out.innerHTML = H.str(H.alert("warn", H.t("loc_denied"))); }, {enableHighAccuracy:true, timeout:12000, maximumAge:30000});
};
})(window);
