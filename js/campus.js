/* Campus tab: schematic map, room finder, library guide, places. The map is a diagram, not a survey. */
(function(root){
"use strict";
const H = root.H, html = H.html, ic = H.icon, T = H.tkb;
const VB = {w:820, h:800};
H.mapState = {from:null, to:null, sel:null, q:"", zoom:1, cx:410, cy:400, kind:""};
const MS = H.mapState, CORR = [120, 207, 300, 390, 480, 650];
const ctr = b => [b.r[0] + b.r[2] / 2, b.r[1] + b.r[3] / 2];
const pointOf = id => { const g = (H.C.campus.gates || []).find(x => x.id === id); if (g) return g.p; const b = H.C.bld[id]; return b && b.r ? ctr(b) : null; };
const nm = id => { const b = H.C.bld[id]; if (b) return b.name; const g = (H.C.campus.gates || []).find(x => x.id === id); return g ? g.name : id; };

/* rough orthogonal route along the gaps between building rows */
function route(a, b){
  const A = pointOf(a), B = pointOf(b); if (!A || !B) return null;
  const mid = (A[1] + B[1]) / 2, y = CORR.reduce((p, c) => Math.abs(c - mid) < Math.abs(p - mid) ? c : p, CORR[0]);
  const P = [A, [A[0], y], [B[0], y], B];
  return P.filter((p, i) => i === 0 || p[0] !== P[i - 1][0] || p[1] !== P[i - 1][1]);
}
function mapSvg(){
  const z = MS.zoom, w = VB.w / z, h = VB.h / z;
  const x0 = Math.max(0, Math.min(VB.w - w, MS.cx - w / 2)), y0 = Math.max(0, Math.min(VB.h - h, MS.cy - h / 2));
  const q = H.fold(MS.q || ""), R = MS.from && MS.to ? route(MS.from, MS.to) : null;
  const bl = H.C.campus.buildings;
  const rect = b => {
    const hit = q && H.fold(b.id + " " + b.name + " " + b.vi).indexOf(q) >= 0, dim = (q && !hit) || (MS.kind && b.kind !== MS.kind);
    const st = [MS.sel === b.id || MS.to === b.id ? "sel" : "", MS.from === b.id ? "from" : "", H.isSaved("buildings", b.id) ? "saved" : "", b.kind === "svc" ? "svc" : b.kind === "lib" ? "lib" : "", hit ? "hit" : "", dim ? "dim" : ""].join(" ");
    return html`<g data-a="bSel" data-id="${b.id}" role="button" tabindex="0" aria-label="${b.name}"><rect class="b-rect ${st}" x="${b.r[0]}" y="${b.r[1]}" width="${b.r[2]}" height="${b.r[3]}" rx="6"/><text class="b-lbl ${st}" x="${b.r[0] + b.r[2] / 2}" y="${b.r[1] + b.r[3] / 2 + 5}" text-anchor="middle">${b.id.length > 5 ? b.id.slice(0, 5) : b.id}</text></g>`;
  };
  const gates = (H.C.campus.gates || []).map(g => html`<g class="gate ${MS.from === g.id ? "from" : ""}" data-a="bSel" data-id="${g.id}" role="button" tabindex="0" aria-label="${g.name}"><circle cx="${g.p[0]}" cy="${g.p[1]}" r="10"/><text x="${g.p[0] + 14}" y="${g.p[1] + 4}">${g.vi}</text></g>`);
  return html`<svg id="mapsvg" class="map" viewBox="${x0} ${y0} ${w} ${h}" role="group" aria-label="${H.t("map_schematic")}">${bl.map(rect)}${gates}${R ? html`<polyline class="route-case" points="${R.map(p => p.join(",")).join(" ")}"/><polyline class="route-line" points="${R.map(p => p.join(",")).join(" ")}"/>` : ""}</svg>`;
}
function legend(){
  const k = H.C.campus.kinds;
  return html`<div class="row wrap" style="gap:6px" role="group" aria-label="${H.t("legend")}">${Object.keys(k).map(id => html`<button class="chip leg k-${id}" data-a="mapKind" data-id="${id}" aria-pressed="${MS.kind === id}">${k[id]}</button>`)}${MS.kind ? html`<button class="chip" data-a="mapKind" data-id="">${H.t("clear")}</button>` : ""}</div>`;
}
function pickOpts(sel){
  const bl = H.C.campus.buildings, gt = H.C.campus.gates || [];
  return html`<option value="">—</option>${gt.map(g => html`<option value="${g.id}" ${sel === g.id ? "selected" : ""}>${g.name}</option>`)}${bl.map(b => html`<option value="${b.id}" ${sel === b.id ? "selected" : ""}>${b.id} · ${b.name === b.id ? b.vi : b.name}</option>`)}`;
}
function routeCard(){
  if (!MS.to) return html`<p class="small muted">${H.t("route_hint")}</p>`;
  return html`<div class="stack-s"><div class="row wrap"><label class="fld grow" for="mf">${H.t("from")}<select class="inp" id="mf" data-ch="mapFrom">${pickOpts(MS.from)}</select></label><label class="fld grow" for="mt">${H.t("to")}<select class="inp" id="mt" data-ch="mapTo">${pickOpts(MS.to)}</select></label></div>
    ${MS.from ? html`<p class="small">${H.t("route_rough")}</p>` : html`<p class="small muted">${H.t("route_pick_from")}</p>`}
    <div class="row wrap">${H.link(H.mapsUrl(nm(MS.to) + " " + H.C.campus.mapSearchQuery), H.t("open_gmaps"))}${H.link(H.osmUrl(H.C.campus.mapSearchQuery), H.t("open_osm"))}<button class="btn sm" data-a="mapClear">${H.t("clear")}</button></div></div>`;
}
function renderMap(){
  const q = MS.q;
  return html`<div class="page gut"><div class="row between"><h2>${H.t("sub_map")}</h2><span class="chip warn">${H.t("schematic")}</span></div>
    ${H.alert("warn", H.t("map_disclaimer"))}
    <div class="row"><label class="grow" style="display:block"><span class="sr">${H.t("search")}</span><input class="inp" type="search" data-in="mapQ" value="${q}" placeholder="${H.t("map_search_ph")}" autocomplete="off"></label>
      <button class="ibtn" data-a="mapZoom" data-d="1" aria-label="${H.t("zoom_in")}">${ic("plus")}</button><button class="ibtn" data-a="mapZoom" data-d="-1" aria-label="${H.t("zoom_out")}">${ic("minus")}</button></div>
    ${legend()}
    <div class="cols"><div class="mapbox" id="mapbox">${mapSvg()}</div><div class="stack"><section class="card" id="routeBox">${routeCard()}</section>${MS.sel ? bldCard(MS.sel) : html`<p class="small muted">${H.t("tap_building")}</p>`}</div></div></div>`;
}
function bldCard(id){
  const g = (H.C.campus.gates || []).find(x => x.id === id), b = g ? null : H.C.bld[id];
  if (g) return html`<section class="card"><h3>${g.name}</h3><p class="small muted">${g.vi}</p><div class="row wrap"><button class="btn sm primary" data-a="mapFromSet" data-id="${g.id}">${H.t("start_here")}</button></div><p class="xs muted">${H.t("gate_unverified")}</p></section>`;
  if (!b) return "";
  const offs = (b.offices || []).map(o => H.C.office[o]).filter(Boolean);
  const rooms = roomsInBuilding(id);
  return html`<section class="card"><div class="row between"><div class="grow"><h3>${b.name}</h3><div class="small muted">${b.vi} · ${H.C.campus.kinds[b.kind]}</div></div>${H.star("buildings", b.id)}</div>
    ${b.fn ? html`<p>${b.fn}</p>${H.source(b.fnMeta)}` : html`<p class="small muted">${H.t("no_bld_info")}</p>`}
    ${offs.length ? html`<div><div class="eyebrow">${H.t("offices_here")}</div>${offs.map(o => html`<div class="small">${o.name}</div>`)}</div>` : ""}
    ${rooms ? html`<p class="small">${H.t("rooms_in_tkb", {n:rooms})}</p>` : ""}
    <div class="row wrap"><button class="btn sm primary" data-a="mapToSet" data-id="${b.id}">${ic("nav")} ${H.t("navigate")}</button><button class="btn sm" data-a="mapFromSet" data-id="${b.id}">${H.t("start_here")}</button>${H.link(H.mapsUrl(b.name + " " + H.C.campus.mapSearchQuery), "Maps")}</div></section>`;
}
let roomCache = null;
function roomIndex(){
  const D = H.tk.D; if (!D) return {};
  if (roomCache && roomCache.D === D) return roomCache.m;
  const m = {}; Object.values(D.byId).forEach(c => c.ses.forEach(s => { if (s.room && !s.bad) m[s.room] = (m[s.room] || 0) + 1; })); roomCache = {D, m}; return m;
}
function roomsInBuilding(id){ const m = roomIndex(); return Object.keys(m).filter(r => H.roomBuilding(r) === id).length; }
function refreshMap(){ const e = document.getElementById("mapbox"); if (e) e.innerHTML = H.str(mapSvg()); const r = document.getElementById("routeBox"); if (r) r.innerHTML = H.str(routeCard()); }
H.actions.bSel = el => { MS.sel = el.dataset.id; const b = pointOf(MS.sel); if (b && MS.zoom > 1) { MS.cx = b[0]; MS.cy = b[1]; } H.render(true); };
H.actions.mapToSet = el => { MS.to = el.dataset.id; H.render(true); };
H.actions.mapFromSet = el => { MS.from = el.dataset.id; if (!MS.to) MS.to = MS.sel && MS.sel !== MS.from ? MS.sel : null; H.render(true); };
H.actions.mapClear = () => { MS.from = MS.to = MS.sel = null; H.render(true); };
H.actions.mapKind = el => { MS.kind = el.dataset.id; H.render(true); };
H.actions.mapZoom = el => { MS.zoom = Math.max(1, Math.min(3, MS.zoom + (+el.dataset.d) * .5)); refreshMap(); };
H.changes.mapFrom = el => { MS.from = el.value || null; refreshMap(); };
H.changes.mapTo = el => { MS.to = el.value || null; H.render(true); };
H.inputs.mapQ = H.debounce(el => { MS.q = el.value; refreshMap(); }, 120);
document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("svg [data-a]")) { e.preventDefault(); H.actions[e.target.dataset.a](e.target); } });

/* ---------- rooms ---------- */
const RS = {q:""};
function roomResult(code){
  const code2 = String(code || "").trim(); if (!code2) return "";
  const d = T.decodeRoom(code2), b = H.roomBuilding(code2);
  if (!d && !b) return H.alert("warn", html`<b>${H.t("room_unknown")}</b><p class="small">${H.t("room_unknown_d")}</p>`);
  const n = roomIndex()[code2.toUpperCase()] || roomIndex()[code2];
  return html`<section class="card"><div class="row between"><h3 class="mono">${code2}</h3>${H.star("rooms", code2)}</div>
    ${d ? html`<dl class="kv"><dt>${H.t("building")}</dt><dd>${d.building}</dd><dt>${H.t("floor")}</dt><dd>${d.floor}</dd><dt>${H.t("room")}</dt><dd>${d.room}</dd></dl><p class="small muted">${H.t("room_decoded_note")}</p>` : html`<p>${H.t("room_alias", {b:H.C.bld[b] ? H.C.bld[b].name : b})}</p>`}
    ${b ? html`<div class="row wrap"><button class="btn primary sm" data-a="navTo" data-id="${b}">${ic("nav")} ${H.t("navigate")}</button></div>` : html`<p class="small muted">${H.t("bld_not_on_map")}</p>`}</section>`;
}
H.openRoom = code => H.sheet(H.t("room_finder"), roomResult(code));
H.actions.roomGo = () => { const v = (document.getElementById("rq") || {}).value || ""; RS.q = v; H.patch("#roomOut", roomResult(v)); };
H.inputs.roomQ = el => { RS.q = el.value; };
function renderRooms(){
  if (H.S.param) { RS.q = H.S.param; H.S.param = null; }
  const mine = [...new Set(H.db.tt.ids.flatMap(id => { const c = H.tk.D && H.tk.D.byId[id]; return c ? c.ses.filter(s => !s.bad && s.room).map(s => s.room) : []; }))].sort();
  const saved = H.db.saved.rooms || [];
  const chips = a => html`<div class="row wrap" style="gap:6px">${a.map(r => html`<button class="chip mono" data-a="roomPick" data-room="${r}">${r}</button>`)}</div>`;
  return html`<div class="page gut"><h2>${H.t("room_finder")}</h2><p class="small muted">${H.t("room_finder_d")}</p>
    <form class="row" data-form="room"><label class="grow" style="display:block"><span class="sr">${H.t("room")}</span><input class="inp mono" id="rq" data-in="roomQ" value="${RS.q}" placeholder="D3-201, D8-1006, C10-305" autocomplete="off" autocapitalize="characters"></label><button class="btn primary" type="submit">${H.t("decode")}</button></form>
    <div id="roomOut">${roomResult(RS.q)}</div>
    ${mine.length ? html`<section class="card"><h3>${H.t("my_rooms")}</h3>${chips(mine)}</section>` : ""}
    ${saved.length ? html`<section class="card"><h3>${H.t("saved_rooms")}</h3>${chips(saved)}</section>` : ""}
    <p class="xs muted">${H.t("room_formats")}</p></div>`;
}
H.actions.roomPick = el => { RS.q = el.dataset.room; H.render(true); };
document.addEventListener("submit", e => { if (e.target.closest("[data-form='room']")) { e.preventDefault(); H.actions.roomGo(); } });

/* ---------- library ---------- */
function renderLibrary(){
  const b = H.C.bld.LIB, o = H.C.office.library;
  return html`<div class="page gut"><h2>${H.t("sub_library")}</h2>
    <section class="card"><h3>${b.name}</h3><p class="small muted">${b.vi}</p><p>${b.fn}</p>${H.source(b.fnMeta)}
      <div class="row wrap"><button class="btn primary sm" data-a="navTo" data-id="LIB">${ic("nav")} ${H.t("navigate")}</button>${H.link(o.web, H.t("website"))}</div></section>
    ${H.alert("warn", H.t("lib_unverified"))}
    <section class="card"><h3>${H.t("lib_ask")}</h3><ul class="stack-s">${["lib_q1", "lib_q2", "lib_q3", "lib_q4"].map(k => html`<li>${H.t(k)}</li>`)}</ul><p class="xs muted">${H.t("lib_ask_note")}</p></section>
    ${H.officeCard(o)}</div>`;
}

/* ---------- places ---------- */
function renderPlaces(){
  const kinds = H.C.campus.kinds, groups = {};
  H.C.campus.buildings.filter(b => b.kind !== "lect").forEach(b => (groups[b.kind] = groups[b.kind] || []).push(b));
  return html`<div class="page gut"><h2>${H.t("sub_places")}</h2><p class="small muted">${H.t("places_d")}</p>
    ${Object.keys(groups).map(k => html`<section class="card"><h3>${kinds[k]}</h3><div class="list">${groups[k].map(b => html`<div class="li"><div class="grow"><b>${b.name}</b><div class="small muted">${b.vi}</div>${b.fn ? html`<p class="small">${b.fn}</p>` : html`<p class="xs muted">${H.t("no_bld_info")}</p>`}${b.fnMeta ? H.badge(b.fnMeta) : ""}</div><button class="btn sm" data-a="navTo" data-id="${b.id}">${ic("nav")}<span class="sr">${H.t("navigate")}</span></button>${H.star("buildings", b.id)}</div>`)}</div></section>`)}
    ${H.alert("", H.t("places_note"))}</div>`;
}

H.views.campus = {render(sub){
  return html`<div class="gut" style="padding-top:12px">${H.subTabs("campus")}</div>${sub === "map" ? renderMap() : sub === "rooms" ? renderRooms() : sub === "library" ? renderLibrary() : renderPlaces()}`;
}};
})(window);
