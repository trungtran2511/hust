/* Shared UI helpers, saved items, "next class" logic, quick tools. */
(function(root){
"use strict";
const H = root.H, html = H.html, ic = H.icon, T = H.tkb;

H.empty = (icon, title, text, action) => html`<div class="empty">${ic(icon || "info")}<b>${title}</b>${text ? html`<p class="small">${text}</p>` : ""}${action || ""}</div>`;
H.alert = (kind, body) => html`<div class="alert ${kind || ""}">${ic(kind === "bad" ? "sos" : kind === "ok" ? "check" : "info")}<div class="grow">${body}</div></div>`;
H.mapsUrl = q => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
H.osmUrl = q => "https://www.openstreetmap.org/search?query=" + encodeURIComponent(q);
H.officialNote = () => H.alert("warn", H.t("not_official"));

/* ---------- saved items ---------- */
H.isSaved = (kind, id) => (H.db.saved[kind] || []).indexOf(id) >= 0;
H.star = (kind, id) => html`<button class="ibtn sm ${H.isSaved(kind, id) ? "on" : ""}" data-a="fav" data-kind="${kind}" data-id="${id}" aria-pressed="${H.isSaved(kind, id)}" aria-label="${H.t(H.isSaved(kind, id) ? "unsave" : "save")}">${ic("star")}</button>`;
H.actions.fav = el => {
  const kind = el.dataset.kind, id = el.dataset.id; H.db.saved[kind] = H.db.saved[kind] || [];
  const on = H.toggleIn(H.db.saved[kind], id); H.save(); H.toast(H.t(on ? "saved_ok" : "unsaved_ok"));
  el.classList.toggle("on", on); el.setAttribute("aria-pressed", on); el.setAttribute("aria-label", H.t(on ? "unsave" : "save"));
};

/* ---------- quick tools ---------- */
H.TOOLS = {
  map:{icon:"pin", key:"tool_map", go:["campus", "map"]}, rooms:{icon:"target", key:"tool_rooms", go:["campus", "rooms"]}, library:{icon:"book", key:"tool_library", go:["campus", "library"]},
  planner:{icon:"cal", key:"tool_planner", go:["academic", "plan"]}, timetable:{icon:"clock", key:"tool_timetable", go:["academic", "timetable"]}, tasks:{icon:"check", key:"tool_tasks", go:["academic", "tasks"]},
  gpa:{icon:"note", key:"tool_gpa", go:["academic", "credits"]},
  phrases:{icon:"chat", key:"tool_phrases", go:["life", "vi"]}, address:{icon:"people", key:"tool_address", go:["life", "address"]}, guide:{icon:"globe", key:"tool_guide", go:["life", "guide"]},
  office:{icon:"search", key:"tool_office", go:["support", "help"]}, checklist:{icon:"flag", key:"tool_checklist", go:["support", "checklist"]}, handbook:{icon:"book", key:"tool_handbook", go:["support", "handbook"]},
  assess:{icon:"target", key:"tool_assess", go:["support", "assess"]}, saved:{icon:"star", key:"tool_saved", go:["me", "saved"]}, emergency:{icon:"sos", key:"tool_emergency", act:"openSOS"}
};
H.runTool = id => { const t = H.TOOLS[id]; if (!t) return; if (t.act) H.actions[t.act](); else H.go(t.go[0], t.go[1]); };
H.actions.tool = el => H.runTool(el.dataset.id);
H.toolBtn = id => { const t = H.TOOLS[id]; return t ? html`<button class="tool" data-a="tool" data-id="${id}"><span class="ico">${ic(t.icon)}</span><b>${H.t(t.key)}</b></button>` : ""; };

/* ---------- roles ---------- */
H.ROLES = [["prospective", "role_prospective", "role_prospective_d"], ["new", "role_new", "role_new_d"], ["current", "role_current", "role_current_d"], ["exchange", "role_exchange", "role_exchange_d"]];

/* ---------- today / next class ---------- */
function nowMins(d){ return d.getHours() * 60 + d.getMinutes(); }
const dayCode = d => (d.getDay() + 6) % 7 + 2; // Mon=2 .. Sun=8
/* returns {state, today:[{c,s}], next:{c,s,date,week}|null, week} */
H.classesNow = function(now){
  now = now || new Date(); const tt = H.db.tt, D = H.tk.D;
  if (!tt.ids.length) return {state:"noTT"};
  if (!D) return {state:"loading"};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tt.weekStart || "")) return {state:"noStart"};
  const week = T.weekOf(tt.weekStart, now);
  const todayList = (w, d) => T.sessionsFor(D, tt.ids, w).filter(i => i.s.d === d);
  const today = week >= 1 ? todayList(week, dayCode(now)) : [];
  let next = null;
  const nm = nowMins(now);
  next = today.find(i => T.mins(i.s.e) > nm) || null;
  if (next) return {state:"ok", week, today, next:{...next, date:now, week}};
  for (let k = 1; k <= 21 && !next; k++) {
    const dd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k), w = T.weekOf(tt.weekStart, dd); if (w < 1 || w > 60) continue;
    const l = todayList(w, dayCode(dd)); if (l.length) next = {...l[0], date:dd, week:w};
  }
  return {state:next ? "ok" : week < 1 ? "before" : "none", week, today, next};
};
H.colorOf = code => { let h = 0; for (const ch of String(code)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 6; };
H.courseName = code => { const D = H.tk.D; const c = D && D.byCourseCode[code]; return c ? (c.en || c.vi) : code; };
H.fmtTime = s => T.hhmm(s);

/* ---------- navigate to a place ---------- */
H.navTo = function(buildingId, fromId){
  if (!H.C.bld[buildingId]) { H.toast(H.t("no_map_place"), "bad"); return; }
  H.mapState.to = buildingId; if (fromId) H.mapState.from = fromId; H.mapState.sel = null; H.go("campus", "map");
};
H.actions.navTo = el => { H.closeAllSheets(); H.navTo(el.dataset.id, el.dataset.from); };
H.actions.navRoom = el => { const b = H.roomBuilding(el.dataset.room); if (b) H.navTo(b); else { H.toast(H.t("room_not_decodable"), "bad"); } };

/* ---------- generic "contact / office card" ---------- */
H.officeCard = function(o, opts){
  opts = opts || {};
  const where = (o.where || []).map(w => html`<li>${w.text} ${H.badge(w.meta)}</li>`);
  const phones = (o.phone || []).map(p => html`<li class="row wrap"><span class="mono">${p.text}</span>${p.note ? html`<span class="muted xs">${p.note}</span>` : ""}${H.badge(p.meta)}<button class="ibtn sm" data-a="copy" data-v="${p.text}" aria-label="${H.t("copy")}">${ic("copy")}</button></li>`);
  const emails = (o.email || []).map(p => html`<li class="row wrap"><span class="mono" style="overflow-wrap:anywhere">${p.text}</span>${p.note ? html`<span class="muted xs">${p.note}</span>` : ""}${H.badge(p.meta)}<button class="ibtn sm" data-a="copy" data-v="${p.text}" aria-label="${H.t("copy")}">${ic("copy")}</button></li>`);
  return html`<div class="card">
    <div class="row between"><div class="grow"><h3>${o.name}</h3><div class="muted small">${o.vi}</div></div>${H.star("contacts", o.id)}</div>
    ${o.does ? html`<div class="row wrap" style="gap:6px">${o.does.map(x => html`<span class="chip">${x}</span>`)}</div>` : ""}
    <div><div class="eyebrow">${H.t("where")}</div><ul class="stack-s" style="list-style:none;padding:0">${where}</ul></div>
    ${o.conflict ? H.alert("warn", o.conflict) : ""}
    ${phones.length ? html`<div><div class="eyebrow">${H.t("phone")}</div><ul class="stack-s" style="list-style:none;padding:0">${phones}</ul></div>` : html`<p class="xs muted">${H.t("no_verified_phone")}</p>`}
    ${emails.length ? html`<div><div class="eyebrow">Email</div><ul class="stack-s" style="list-style:none;padding:0">${emails}</ul></div>` : ""}
    <div class="row wrap">${o.building && H.C.bld[o.building] ? html`<button class="btn sm" data-a="navTo" data-id="${o.building}">${ic("nav")} ${H.t("navigate")}</button>` : ""}${o.web ? H.link(o.web, H.t("website")) : ""}</div>
  </div>`;
};
H.actions.copy = el => { const v = el.dataset.v; try { navigator.clipboard.writeText(v).then(() => H.toast(H.t("copied") + ": " + v), () => H.toast(H.t("copy_fail"))); } catch (e) { H.toast(H.t("copy_fail")); } };
})(window);
