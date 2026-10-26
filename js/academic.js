/* Academic tab: course planner, timetable, tasks, credits and GPA, portal guide. */
(function(root){
"use strict";
const H = root.H, html = H.html, ic = H.icon, T = H.tkb, str = H.str;

const SCHOOL_NAMES = {TCK:"School of Mechanical Engineering", TDDT:"School of Electrical and Electronic Engineering", THKHSS:"School of Chemistry and Life Sciences", TCNTT:"School of Information and Communication Technology", TVL:"School of Materials Science and Engineering", VVLKT:"School of Engineering Physics", KNN:"School of Foreign Languages", KKTVQL:"School of Economics and Management", KSPKT:"Technical Education", KML:"Political theory", KGDQP:"National defence education", BGDTC:"Physical education"};
const ST = {"Điều chỉnh ĐK":["st_adjust", "warn"], "Đăng ký":["st_open", "ok"], "Kết thúc ĐK":["st_closed", ""], "Huỷ lớp":["st_cancelled", "bad"], "Đang xếp TKB":["st_scheduling", "info"]};
const PS = {q:"", school:"", type:"", cr:"", fmt:"", hide:true, limit:30};
const TV = {week:-1, view:null};
H.planState = PS;

H.onTKB = () => { if (H.S.stage === "app" && (H.S.tab === "academic" || H.S.tab === "home" || H.S.tab === "campus")) H.render(true); };
const need = () => { if (!H.tk.D && !H.tk.err) H.ensureTKB(); };
const sel = () => H.db.tt.ids;
function setSel(ids){ H.db.tt.ids = ids; if (H.tk.D) H.db.tt.snap = H.snapOf(H.tk.D, ids); H.save(); }
const credOf = code => { const c = H.tk.D && H.tk.D.byCourseCode[code]; return c ? c.cr : 0; };
const typeName = t => H.classType(t);

/* ---------- class row ---------- */
function sesLines(c){
  if (!c.ses.length) return html`<div class="muted small">${H.t("no_time_slot")}</div>`;
  return c.ses.map(s => html`<div class="small row wrap" style="gap:6px"><span>${T.DAYS[s.d] || "?"}</span><span class="mono">${T.hhmm(s.s)}–${T.hhmm(s.e)}</span><span class="muted">${H.t("weeks")} ${s.w || "?"}</span>${s.room ? html`<button class="chip info" data-a="roomOpen" data-room="${s.room}" style="border:0;cursor:pointer">${s.room}</button>` : html`<span class="muted">${H.t("room_tba")}</span>`}${s.bad ? html`<span class="chip bad">${H.t("bad_time")}</span>` : ""}</div>`);
}
function wouldClash(id){ const D = H.tk.D, r = T.planAdd(D, sel(), id); return T.clashes(D, r.sel).filter(x => x.a === id || x.b === id || r.added.indexOf(x.a) >= 0 || r.added.indexOf(x.b) >= 0).filter(x => r.sel.indexOf(x.a) >= 0 && r.sel.indexOf(x.b) >= 0 && (r.added.indexOf(x.a) >= 0) !== (r.added.indexOf(x.b) >= 0)); }
function classRow(c, kid){
  const on = sel().indexOf(c.id) >= 0, st = ST[c.status], full = c.max != null && c.reg != null && c.reg >= c.max;
  const cl = !on ? wouldClash(c.id) : [];
  return html`<div class="pcls ${kid ? "kid" : ""} ${on ? "on" : ""}">
    <div class="row between"><div class="row wrap" style="gap:6px"><b class="mono">${c.id}</b><span class="chip">${typeName(c.type)}</span>${c.tt ? html`<span class="chip info">${c.tt}</span>` : ""}${st ? html`<span class="chip ${st[1]}">${H.t(st[0])}</span>` : ""}${c.closed ? html`<span class="chip warn">${H.t("not_open_reg")}</span>` : ""}</div>
      <button class="btn sm ${on ? "" : "primary"}" data-a="${on ? "cDel" : "cAdd"}" data-id="${c.id}">${on ? H.t("remove") : H.t("add")}</button></div>
    <div class="stack-s">${sesLines(c)}</div>
    <div class="xs muted">${c.note ? c.note + " · " : ""}${H.t("seats")}: <span class="mono">${c.reg == null ? "?" : c.reg}/${c.max == null ? "?" : c.max}</span>${full ? " · " + H.t("full") : ""}${c.ql ? " · " + c.ql : ""}</div>
    ${cl.length ? html`<div class="alert bad">${ic("sos")}<div class="grow small"><b>${H.t("would_clash")}</b>${cl.map(x => { const o = x.a === c.id || (T.planAdd(H.tk.D, sel(), c.id).added.indexOf(x.a) >= 0) ? x.b : x.a; return html`<div>${o} · ${H.courseName(H.tk.D.byId[o].code)}: ${x.hits.map(T.describeHit).join("; ")}</div>`; })}</div></div>` : ""}
  </div>`;
}
function classesOf(course){
  const D = H.tk.D, vis = T.visibleIds(D, course, {hideClosed:PS.hide});
  const tops = vis.filter(id => { const c = D.byId[id]; return c.kem === id || vis.indexOf(c.kem) < 0; });
  return tops.map(id => html`${classRow(D.byId[id], false)}${(D.kids[id] || []).filter(k => vis.indexOf(k) >= 0 && k !== id).map(k => classRow(D.byId[k], true))}`);
}
function courseBody(code){
  const D = H.tk.D, c = D.byCourseCode[code]; if (!c) return html`<p>${H.t("no_results")}</p>`;
  const vis = T.visibleIds(D, c, {hideClosed:PS.hide}), all = c.ids.length;
  return html`<div class="row between"><div class="grow"><div class="mono small muted">${c.code}</div><h3>${c.en || c.vi}</h3><div class="muted small">${c.vi}</div></div>${H.star("courses", c.code)}</div>
    <dl class="kv"><dt>${H.t("credits")}</dt><dd>${c.cr || "?"} <span class="muted">(${c.kl || "—"})</span></dd><dt>${H.t("unit")}</dt><dd>${c.school} ${SCHOOL_NAMES[c.school] ? html`<span class="muted">· ${SCHOOL_NAMES[c.school]} (${H.t("inferred")})</span>` : ""}</dd><dt>${H.t("lecturer")}</dt><dd class="muted">${H.t("no_data_file")}</dd><dt>${H.t("classes")}</dt><dd>${vis.length}${all > vis.length ? html` <span class="muted">(${all - vis.length} ${H.t("hidden_closed")})</span>` : ""}</dd></dl>
    ${H.alert("", H.t("plan_only"))}
    <div class="stack-s">${classesOf(c)}</div>`;
}
H.actions.courseOpen = el => { need(); H.S.courseOpen = el.dataset.code; H.sheet(H.t("course_info"), courseBody(el.dataset.code), {onClose:() => { H.S.courseOpen = null; }}); };
function refreshAfterChange(){ if (H.S.courseOpen) H.refreshSheet(courseBody(H.S.courseOpen)); H.render(true); }
H.actions.cAdd = el => {
  const D = H.tk.D, r = T.planAdd(D, sel(), el.dataset.id); setSel(r.sel);
  let msg = H.t("added_class", {id:el.dataset.id}); if (r.added.length > 1) msg += " " + H.t("added_lecture", {id:r.added[1]}); if (r.replaced.length) msg += " " + H.t("replaced", {ids:r.replaced.join(", ")});
  H.toast(msg); const inc = T.incomplete(D, r.sel); if (inc.length) setTimeout(() => H.toast(H.t("pick_group")), 600);
  refreshAfterChange();
};
H.actions.cDel = el => { setSel(T.planRemove(H.tk.D, sel(), el.dataset.id)); refreshAfterChange(); };
H.actions.roomOpen = el => H.openRoom(el.dataset.room);

/* ---------- plan view ---------- */
function resultsHtml(){
  const D = H.tk.D; if (!D) return "";
  const f = {school:PS.school, type:PS.type, cr:PS.cr, fmt:PS.fmt, hideClosed:PS.hide};
  const res = T.search(D, PS.q, f);
  if (!PS.q.trim() && !PS.school && !PS.type && !PS.cr && !PS.fmt) return html`<p class="muted small">${H.t("search_hint")}</p>`;
  if (!res.length) return H.empty("search", H.t("no_results"), H.t("no_results_d"));
  const L = res.slice(0, PS.limit);
  return html`<div class="small muted">${H.t("n_results", {n:res.length})}</div><div class="list">${L.map(c => html`<button class="li" data-a="courseOpen" data-code="${c.code}"><span class="code">${c.code}</span><span class="grow"><b>${c.en || c.vi}</b><span class="muted small" style="display:block">${c.vi} · ${c.cr || "?"} ${H.t("credits_short")} · ${T.visibleIds(D, c, {hideClosed:PS.hide}).length} ${H.t("classes")}</span></span>${ic("right")}</button>`)}</div>${res.length > L.length ? html`<button class="btn block" data-a="moreResults">${H.t("show_more")}</button>` : ""}`;
}
H.inputs.pq = H.debounce(el => { PS.q = el.value; PS.limit = 30; H.patch("#presults", resultsHtml()); }, 120);
H.changes.pfilter = el => { PS[el.dataset.k] = el.type === "checkbox" ? el.checked : el.value; PS.limit = 30; H.patch("#presults", resultsHtml()); };
H.actions.moreResults = () => { PS.limit += 30; H.patch("#presults", resultsHtml()); };

function myClasses(){
  const D = H.tk.D, ids = sel(); if (!D) return "";
  const by = {}; ids.forEach(id => { const c = D.byId[id]; if (c) (by[c.code] = by[c.code] || []).push(c); });
  const codes = Object.keys(by), cr = codes.reduce((s, c) => s + credOf(c), 0);
  const cl = T.clashes(D, ids), inc = T.incomplete(D, ids);
  const missing = ids.filter(id => !D.byId[id]);
  return html`<div class="card"><div class="row between"><h2>${H.t("my_classes")}</h2><span class="chip ${cl.length ? "bad" : "acc"}">${codes.length} ${H.t("courses")} · ${cr} ${H.t("credits_short")}</span></div>
    ${codes.length ? html`<div class="list">${codes.map(code => html`<div class="li"><span class="sw cl-${H.colorOf(code)}" style="margin-top:6px"></span><div class="grow stack-s"><button class="btn link" style="min-height:24px;font-weight:650;color:inherit;text-align:left" data-a="courseOpen" data-code="${code}">${H.courseName(code)}</button><span class="mono xs muted">${code} · ${credOf(code)} ${H.t("credits_short")}</span>${by[code].map(c => html`<div class="row between small"><span><b class="mono">${c.id}</b> · ${typeName(c.type)} · ${c.ses.map(s => (T.DAYS[s.d] || "?") + " " + T.hhmm(s.s)).join(", ") || H.t("no_time_slot")}</span><button class="ibtn sm" data-a="cDel" data-id="${c.id}" aria-label="${H.t("remove")} ${c.id}">${ic("x")}</button></div>`)}</div></div>`)}</div>` : H.empty("cal", H.t("no_classes_yet"), H.t("no_classes_yet_d"))}
    ${inc.length ? H.alert("warn", html`<b>${H.t("incomplete_group")}</b>${inc.map(id => html`<div class="small">${id} · ${H.courseName(D.byId[id].code)}: ${H.t("pick_group_d")}</div>`)}`) : ""}
    ${missing.length ? H.alert("warn", H.t("missing_ids", {ids:missing.join(", ")})) : ""}
    ${cl.length ? H.alert("bad", html`<b>${H.t("clashes_found", {n:cl.length})}</b>${cl.map(x => html`<div class="small" style="margin-top:6px"><b class="mono">${x.a}</b> ${H.courseName(D.byId[x.a].code)} ↔ <b class="mono">${x.b}</b> ${H.courseName(D.byId[x.b].code)}<br>${x.hits.map(T.describeHit).join("; ")}</div>`)}`) : codes.length ? H.alert("ok", H.t("no_clash")) : ""}
    ${codes.length ? html`<div class="row wrap"><button class="btn sm" data-a="go" data-tab="academic" data-sub="timetable">${H.t("open_timetable")}</button><button class="btn sm danger" data-a="cClear">${H.t("clear_all")}</button></div>` : ""}</div>`;
}
H.actions.cClear = () => H.confirm(H.t("clear_all"), H.t("confirm_clear_classes"), H.t("clear_all"), () => { setSel([]); H.render(true); }, true);

function importCard(){
  const tk = H.tk;
  return html`<div class="card"><div class="row between"><h2>${H.t("sub_plan")}</h2>${tk.D ? html`<span class="chip">${tk.D.term ? H.t("term") + " " + tk.D.term : ""} · ${Object.keys(tk.D.byId).length.toLocaleString("en")} ${H.t("classes")}</span>` : ""}</div>
    ${H.alert("", html`<b>${H.t("plan_vs_official")}</b><div class="small">${H.t("plan_only")}</div>`)}
    ${tk.D ? html`<p class="small muted">${H.t("source")}: <b>${tk.src}</b>${tk.D.updated ? " · " + H.t("updated") + " " + tk.D.updated : ""}${tk.custom ? " · " + H.t("imported_file") : ""}</p>` : tk.err ? html`<p class="errtxt">${H.t("tkb_load_fail")}</p>` : html`<div class="row"><span class="spinner"></span> ${H.t("loading_tkb")}</div>`}
    <div class="row wrap"><label class="btn sm" for="xlsxIn">${ic("up2")} ${H.t("import_xlsx")}</label><input type="file" id="xlsxIn" class="sr" accept=".xlsx,.xls" data-ch="xlsx">${tk.custom ? html`<button class="btn sm" data-a="tkReset">${H.t("use_bundled")}</button>` : ""}${H.link("https://hust.edu.vn", H.t("official_reg_site"))}</div>
    <p class="xs muted">${H.t("xlsx_cols")}</p></div>`;
}
H.changes.xlsx = async el => {
  const f = el.files && el.files[0]; el.value = ""; if (!f) return;
  H.toast(H.t("reading_file")); const r = await H.importXlsx(f);
  if (!r.ok) { const m = {type:"imp_type", big:"imp_big", lib:"imp_lib", read:"imp_read", "no-header":"imp_header", "missing-columns":"imp_cols", empty:"imp_empty"}[r.code] || "imp_read"; H.sheet(H.t("import_failed"), html`<div class="alert bad">${ic("sos")}<div class="grow">${H.t(m)}${r.missing ? html`<div class="mono small" style="margin-top:6px">${r.missing.join(", ")}</div>` : ""}</div></div><p class="small muted">${H.t("imp_keep")}</p>`); return; }
  const d = r.diff, s = r.stats;
  H.sheet(H.t("import_done"), html`<div class="alert ok">${ic("check")}<div class="grow">${H.t("imp_ok", {c:s.classes.toLocaleString("en"), k:s.courses.toLocaleString("en")})}</div></div>${s.skippedRows || s.badTime ? H.alert("warn", H.t("imp_skipped", {a:s.skippedRows, b:s.badTime})) : ""}${d.missing.length ? H.alert("bad", html`<b>${H.t("imp_missing")}</b><div class="mono small">${d.missing.join(", ")}</div>`) : ""}${d.changed.length ? H.alert("warn", html`<b>${H.t("imp_changed")}</b><div class="mono small">${d.changed.join(", ")}</div>`) : ""}${r.notPersisted ? H.alert("warn", H.t("imp_session_only")) : ""}`);
  H.render(true);
};
H.actions.tkReset = () => H.confirm(H.t("use_bundled"), H.t("confirm_bundled"), H.t("use_bundled"), async () => { await H.resetTKB(); H.toast(H.t("saved_ok")); H.render(true); });

function renderPlan(){
  need(); const D = H.tk.D;
  const filters = D ? html`<div class="grid2"><label class="fld" for="f_school">${H.t("unit")}<select class="inp" id="f_school" data-ch="pfilter" data-k="school"><option value="">${H.t("all")}</option>${D.schools.map(s => html`<option value="${s}" ${PS.school === s ? "selected" : ""}>${s}${SCHOOL_NAMES[s] ? " · " + SCHOOL_NAMES[s] : ""}</option>`)}</select></label>
    <label class="fld" for="f_type">${H.t("class_type")}<select class="inp" id="f_type" data-ch="pfilter" data-k="type"><option value="">${H.t("all")}</option>${["LT", "BT", "LT+BT", "TN", "TH", "ĐA"].map(x => html`<option value="${x}" ${PS.type === x ? "selected" : ""}>${typeName(x)}</option>`)}</select></label>
    <label class="fld" for="f_cr">${H.t("credits")}<select class="inp" id="f_cr" data-ch="pfilter" data-k="cr"><option value="">${H.t("all")}</option>${[1, 2, 3, 4, 5, 6].map(x => html`<option ${String(PS.cr) === String(x) ? "selected" : ""}>${x}</option>`)}</select></label>
    <label class="fld" for="f_fmt">${H.t("format")}<select class="inp" id="f_fmt" data-ch="pfilter" data-k="fmt"><option value="">${H.t("all")}</option>${["Blend", "OMO", "Hybrid"].map(x => html`<option ${PS.fmt === x ? "selected" : ""}>${x}</option>`)}</select></label></div>
    <label class="check"><input type="checkbox" data-ch="pfilter" data-k="hide" ${PS.hide ? "checked" : ""}> <span class="small">${H.t("hide_closed")}</span></label>` : "";
  return html`<div class="page gut"><div class="cols"><div class="stack">${importCard()}
    ${D ? html`<div class="card"><h2>${H.t("find_classes")}</h2><label class="fld" for="pq"><span class="sr">${H.t("find_classes")}</span><input class="inp" id="pq" type="search" data-in="pq" value="${PS.q}" placeholder="${H.t("plan_search_ph")}" autocomplete="off" inputmode="search"></label>${filters}<div id="presults" aria-live="polite">${resultsHtml()}</div></div>` : ""}</div>
    <div class="stack">${D ? myClasses() : ""}</div></div></div>`;
}

/* ---------- timetable view ---------- */
function curWeek(){ const w = T.weekOf(H.db.tt.weekStart, new Date()); return w; }
function weekShown(){ if (TV.week >= 0) return TV.week; const w = curWeek(); return w && w >= 1 && w <= 25 ? w : 0; }
H.changes.ttWeek = el => { TV.week = +el.value; H.render(true); };
H.changes.ttStart = el => {
  const v = el.value; if (!v) { H.db.tt.weekStart = ""; H.save(); H.render(true); return; }
  const d = H.parseYmd(v); if (!d) { H.toast(H.t("bad_date"), "bad"); return; }
  H.db.tt.weekStart = v; TV.week = -1; H.save(); H.render(true);
};
H.actions.ttView = el => { TV.view = el.dataset.id; H.render(true); };
function gridHtml(items, cl, wk){
  if (!items.length) return html`<p class="muted small">${H.t("no_classes_week")}</p>`;
  const days = [2, 3, 4, 5, 6, 7].concat(items.some(i => i.s.d === 8) ? [8] : []);
  let lo = 6 * 60 + 30, hi = 17 * 60 + 45; items.forEach(i => { lo = Math.min(lo, T.mins(i.s.s)); hi = Math.max(hi, T.mins(i.s.e)); });
  lo = Math.floor(lo / 60) * 60; hi = Math.ceil(hi / 60) * 60; const k = 1.05, Hh = (hi - lo) * k, hours = []; for (let h = lo; h <= hi; h += 60) hours.push(h);
  const now = new Date(), todayD = (now.getDay() + 6) % 7 + 2, isCur = wk && wk === curWeek();
  const nx = isCur ? H.classesNow().next : null;
  const col = d => {
    const its = items.filter(i => i.s.d === d), lanes = [];
    its.forEach(i => { let l = lanes.findIndex(end => end <= T.mins(i.s.s)); if (l < 0) { l = lanes.length; lanes.push(0); } lanes[l] = T.mins(i.s.e); i.lane = l; });
    const n = Math.max(1, lanes.length);
    return html`<div class="tt-col ${isCur && d === todayD ? "today" : ""}" style="height:${Hh}px">${hours.map(h => html`<i style="top:${(h - lo) * k}px"></i>`)}${its.map(i => {
      const top = (T.mins(i.s.s) - lo) * k, h = (T.mins(i.s.e) - T.mins(i.s.s)) * k, isN = nx && nx.c.id === i.c.id && nx.s === i.s;
      return html`<button class="tt-b cl-${H.colorOf(i.c.code)} ${cl[i.c.id] ? "clash" : ""} ${isN ? "next" : ""}" data-a="slotOpen" data-id="${i.c.id}" style="top:${top}px;height:${h}px;left:${i.lane / n * 100}%;width:calc(${100 / n}% - 4px)" aria-label="${H.courseName(i.c.code)} ${T.DAYS[i.s.d]} ${T.hhmm(i.s.s)}-${T.hhmm(i.s.e)} ${i.s.room}"><b>${i.c.code}</b><span>${H.courseName(i.c.code)}</span><span class="mono">${T.hhmm(i.s.s)}–${T.hhmm(i.s.e)}</span><span class="mono">${i.s.room}</span></button>`; })}</div>`;
  };
  return html`<div class="tt-scroll" tabindex="0" role="region" aria-label="${H.t("sub_timetable")}"><div class="tt" style="grid-template-columns:44px repeat(${days.length},minmax(104px,1fr))"><div></div>${days.map(d => html`<div class="tt-dh ${isCur && d === todayD ? "today" : ""}">${T.DAYS[d]}${H.db.tt.weekStart && wk ? html` <span class="mono xs">${(() => { const x = T.dateOf(H.db.tt.weekStart, wk, d); return x.getDate() + "/" + (x.getMonth() + 1); })()}</span>` : ""}</div>`)}<div class="tt-axis" style="height:${Hh}px">${hours.map(h => html`<span style="top:${(h - lo) * k}px">${String(h / 60).padStart(2, "0")}:00</span>`)}</div>${days.map(col)}</div></div>`;
}
function listHtml(items, cl, wk){
  if (!items.length) return html`<p class="muted small">${H.t("no_classes_week")}</p>`;
  const days = [...new Set(items.map(i => i.s.d))], now = new Date(), todayD = (now.getDay() + 6) % 7 + 2, isCur = wk && wk === curWeek(), nx = isCur ? H.classesNow().next : null;
  return days.map(d => html`<div class="stack-s"><h3 class="small" style="color:${isCur && d === todayD ? "var(--accent)" : "var(--muted)"};text-transform:uppercase;letter-spacing:.06em;padding-top:8px">${T.DAYS[d]}${H.db.tt.weekStart && wk ? " · " + H.fmtDate(T.dateOf(H.db.tt.weekStart, wk, d), {day:"numeric", month:"short"}) : ""}${isCur && d === todayD ? " · " + H.t("today") : ""}</h3>${items.filter(i => i.s.d === d).map(i => { const isN = nx && nx.c.id === i.c.id && nx.s === i.s; return html`<button class="li card" style="padding:10px 12px;${isN ? "border-color:var(--accent)" : ""}" data-a="slotOpen" data-id="${i.c.id}"><span class="sw cl-${H.colorOf(i.c.code)}" style="margin-top:6px"></span><span class="mono small" style="min-width:86px">${T.hhmm(i.s.s)}–${T.hhmm(i.s.e)}</span><span class="grow"><b>${H.courseName(i.c.code)}</b>${isN ? html` <span class="chip acc">${H.t("next_class")}</span>` : ""}<span class="muted small" style="display:block">${i.c.code} · ${typeName(i.c.type)} · ${i.s.room || H.t("room_tba")}</span>${cl[i.c.id] ? html`<span class="errtxt">${H.t("time_clash")}</span>` : ""}</span></button>`; })}</div>`);
}
H.actions.slotOpen = el => {
  const D = H.tk.D, c = D && D.byId[el.dataset.id]; if (!c) return;
  H.sheet(H.courseName(c.code), html`<div class="mono small muted">${c.code} · ${c.id}</div>${classRow(c, false)}<div class="row wrap">${c.ses.filter(s => s.room && H.roomBuilding(s.room)).slice(0, 1).map(s => html`<button class="btn" data-a="navTo" data-id="${H.roomBuilding(s.room)}">${ic("nav")} ${H.t("navigate")}</button>`)}<button class="btn" data-a="courseOpen" data-code="${c.code}">${H.t("course_info")}</button></div>`);
};
function renderTimetable(){
  need(); const D = H.tk.D, ids = sel(), tt = H.db.tt;
  if (!D) return html`<div class="page gut">${H.tk.err ? html`<p class="errtxt">${H.t("tkb_load_fail")}</p>` : html`<div class="row"><span class="spinner"></span> ${H.t("loading_tkb")}</div>`}</div>`;
  const wk = weekShown(), items = T.sessionsFor(D, ids, wk), cl = T.clashMap(T.clashes(D, ids));
  const view = TV.view || (window.innerWidth >= 700 ? "grid" : "list");
  const maxW = Math.max(20, ...ids.flatMap(id => D.byId[id] ? D.byId[id].ses.flatMap(s => [...s.ws]) : []));
  const startD = H.parseYmd(tt.weekStart), mondayNote = startD && startD.getDay() !== 1 ? H.t("start_not_monday", {d:H.fmtDate(T.dateOf(tt.weekStart, 1, 2), {weekday:"short", day:"numeric", month:"short"})}) : "";
  return html`<div class="page gut">
    <div class="card"><div class="row between"><h2>${H.t("sub_timetable")}</h2><span class="chip">${ids.length} ${H.t("classes")}</span></div>
      <div class="grid2"><label class="fld" for="ttStart">${H.t("sem_start")}<input class="inp" id="ttStart" type="date" data-ch="ttStart" value="${tt.weekStart}"><span class="hint">${H.t("sem_start_hint")}</span></label>
      <label class="fld" for="ttWeek">${H.t("week")}<select class="inp" id="ttWeek" data-ch="ttWeek"><option value="0" ${wk === 0 ? "selected" : ""}>${H.t("all_weeks")}</option>${Array.from({length:maxW}, (_, i) => i + 1).map(n => html`<option value="${n}" ${wk === n ? "selected" : ""}>${H.t("week_n", {n})}${tt.weekStart && n === curWeek() ? " · " + H.t("this_week") : ""}</option>`)}</select></label></div>
      ${mondayNote ? html`<p class="xs muted">${mondayNote}</p>` : ""}
      <div class="row wrap"><div class="seg">${[["grid", "view_grid", "grid"], ["list", "view_list", "list"]].map(v => html`<button data-a="ttView" data-id="${v[0]}" aria-pressed="${view === v[0]}">${H.t(v[1])}</button>`)}</div></div></div>
    ${ids.length ? html`<div class="card">${view === "grid" ? gridHtml(items, cl, wk) : listHtml(items, cl, wk)}${items.length && wk === 0 ? html`<p class="xs muted">${H.t("all_weeks_note")}</p>` : ""}</div>
      ${Object.keys(cl).length ? H.alert("bad", H.t("clashes_found", {n:T.clashes(D, ids).length}) + " " + H.t("see_plan")) : ""}
      <div class="card"><h2>${H.t("export")}</h2><div class="row wrap"><button class="btn sm" data-a="expPDF">${ic("down2")} PDF</button><button class="btn sm" data-a="expPNG">${ic("down2")} ${H.t("image")}</button><button class="btn sm" data-a="expICS">${ic("cal")} ICS</button><button class="btn sm" data-a="expJSON">${ic("down2")} ${H.t("classes_file")}</button><label class="btn sm" for="impJson">${ic("up2")} ${H.t("import_classes")}</label><input class="sr" type="file" id="impJson" accept=".json,application/json" data-ch="impJson"></div><p class="xs muted">${H.t("export_note")}</p></div>` : H.empty("cal", H.t("no_classes_yet"), H.t("no_classes_yet_d"), html`<button class="btn primary" data-a="go" data-tab="academic" data-sub="plan">${ic("plus")} ${H.t("add_classes")}</button>`)}
  </div>`;
}

/* ---------- credits and GPA ---------- */
const DEFAULT_SCALE = [["A+", 4], ["A", 4], ["B+", 3.5], ["B", 3], ["C+", 2.5], ["C", 2], ["D+", 1.5], ["D", 1], ["F", 0]];
H.gpaScale = () => H.db.gpa.scale || DEFAULT_SCALE;
function gpaCalc(){
  const sc = Object.fromEntries(H.gpaScale()), rows = H.db.gpa.rows.filter(r => r.grade && sc[r.grade] != null && +r.credits > 0);
  const cr = rows.reduce((s, r) => s + +r.credits, 0), pts = rows.reduce((s, r) => s + +r.credits * sc[r.grade], 0);
  return {gpa:cr ? pts / cr : null, credits:cr, n:rows.length};
}
function renderCredits(){
  need(); const D = H.tk.D, ids = sel(), g = gpaCalc(), scale = H.gpaScale();
  const by = {}; if (D) ids.forEach(id => { const c = D.byId[id]; if (c) by[c.code] = 1; });
  const codes = Object.keys(by), total = codes.reduce((s, c) => s + credOf(c), 0);
  const bySchool = {}; codes.forEach(c => { const k = D.byCourseCode[c].school; bySchool[k] = (bySchool[k] || 0) + credOf(c); });
  return html`<div class="page gut"><div class="cols"><div class="stack">
    <div class="card"><h2>${H.t("credit_overview")}</h2>${D ? html`<div class="row"><b style="font-size:2rem">${total}</b><span class="muted">${H.t("credits")} · ${codes.length} ${H.t("courses")} (${H.t("planned")})</span></div>${Object.keys(bySchool).length ? html`<div class="bar-split" aria-hidden="true">${Object.keys(bySchool).map((k, i) => html`<i style="flex:${bySchool[k]};background:var(--${["accent", "info", "ok", "warn"][i % 4]})"></i>`)}</div><div class="row wrap">${Object.keys(bySchool).map(k => html`<span class="chip">${k}: ${bySchool[k]}</span>`)}</div>` : ""}` : html`<div class="spinner"></div>`}<p class="xs muted">${H.t("credits_note")}</p></div>
    <div class="card"><h2>${H.t("study_planner")}</h2><p class="small muted">${H.t("study_planner_d")}</p><div class="row wrap"><button class="btn sm primary" data-a="taskNew" data-kind="study">${ic("plus")} ${H.t("kind_study")}</button><button class="btn sm" data-a="taskNew" data-kind="exam">${ic("plus")} ${H.t("kind_exam")}</button><button class="btn sm" data-a="go" data-tab="academic" data-sub="tasks">${H.t("sub_tasks")}</button></div></div></div>
    <div class="card"><div class="row between"><h2>${H.t("gpa_tracker")}</h2>${g.gpa != null ? html`<span class="chip acc mono">${g.gpa.toFixed(2)}</span>` : ""}</div>
      ${H.alert("warn", H.t("gpa_disclaimer"))}
      <div class="small"><b>${H.t("gpa_scale")}</b> <span class="chip warn">${H.db.gpa.scale ? H.t("trust_user") : H.t("trust_unverified")}</span></div>
      <div class="row wrap">${scale.map((s, i) => html`<label class="fld" style="width:76px" for="sc${i}"><span class="mono">${s[0]}</span><input class="inp mono" id="sc${i}" type="number" step="0.1" min="0" max="10" value="${s[1]}" data-ch="gpaScale" data-i="${i}"></label>`)}</div>
      ${H.db.gpa.rows.length ? html`<div class="stack-s">${H.db.gpa.rows.map((r, i) => html`<div class="row" style="align-items:flex-end"><label class="fld grow" for="gn${i}"><span class="sr">${H.t("course")}</span><input class="inp" id="gn${i}" data-in="gpaRow" data-i="${i}" data-k="name" value="${r.name}" placeholder="${H.t("course")}" maxlength="60"></label><label class="fld" style="width:64px" for="gc${i}"><span class="sr">${H.t("credits")}</span><input class="inp mono" id="gc${i}" type="number" min="0" max="20" step="0.5" data-in="gpaRow" data-i="${i}" data-k="credits" value="${r.credits}"></label><label class="fld" style="width:76px" for="gg${i}"><span class="sr">${H.t("grade")}</span><select class="inp" id="gg${i}" data-ch="gpaRowSel" data-i="${i}"><option value="">—</option>${scale.map(s => html`<option ${r.grade === s[0] ? "selected" : ""}>${s[0]}</option>`)}</select></label><button class="ibtn" data-a="gpaDel" data-i="${i}" aria-label="${H.t("delete")}">${ic("trash")}</button></div>`)}</div>` : html`<p class="small muted">${H.t("gpa_empty")}</p>`}
      <div class="row wrap"><button class="btn sm primary" data-a="gpaAdd">${ic("plus")} ${H.t("add")}</button>${D && codes.length ? html`<button class="btn sm" data-a="gpaFromTT">${H.t("gpa_from_tt")}</button>` : ""}${H.db.gpa.scale ? html`<button class="btn sm" data-a="gpaReset">${H.t("reset_scale")}</button>` : ""}</div>
      ${g.gpa != null ? html`<p class="small">${H.t("gpa_result", {n:g.n, c:g.credits})}: <b class="mono">${g.gpa.toFixed(2)}</b> <span class="muted">(${H.t("gpa_not_official")})</span></p>` : ""}</div></div></div>`;
}
H.actions.gpaAdd = () => { H.db.gpa.rows.push({name:"", credits:3, grade:""}); H.save(); H.render(true); };
H.actions.gpaDel = el => { H.db.gpa.rows.splice(+el.dataset.i, 1); H.save(); H.render(true); };
H.actions.gpaFromTT = () => { const D = H.tk.D, seen = {}; H.db.gpa.rows.forEach(r => { seen[r.name] = 1; }); sel().forEach(id => { const c = D.byId[id]; if (c && !seen[c.code + " " + H.courseName(c.code)] && c.kem === id) { const nm = c.code + " " + H.courseName(c.code); seen[nm] = 1; H.db.gpa.rows.push({name:nm, credits:credOf(c.code), grade:""}); } }); H.save(); H.render(true); };
H.actions.gpaReset = () => { H.db.gpa.scale = null; H.save(); H.render(true); };
H.inputs.gpaRow = H.debounce(el => { const r = H.db.gpa.rows[+el.dataset.i]; if (r) { r[el.dataset.k] = el.dataset.k === "credits" ? Math.max(0, Math.min(20, +el.value || 0)) : el.value; H.save(); } }, 200);
H.changes.gpaRowSel = el => { const r = H.db.gpa.rows[+el.dataset.i]; if (r) { r.grade = el.value; H.save(); H.render(true); } };
H.changes.gpaScale = el => { const s = H.gpaScale().map(x => x.slice()); s[+el.dataset.i][1] = Math.max(0, Math.min(10, +el.value || 0)); H.db.gpa.scale = s; H.save(); H.render(true); };

/* ---------- portal guide ---------- */
function renderPortal(){
  const g = (t, items) => html`<details class="acc"><summary>${t}</summary><div><ul>${items.map(i => html`<li>${i}</li>`)}</ul></div></details>`;
  return html`<div class="page gut"><div class="card"><h2>${H.t("portal_title")}</h2>${H.alert("ok", H.t("portal_safe"))}${H.alert("warn", H.t("portal_unverified"))}
    ${g(H.t("p_login"), ["Use the account and password your school gave you.", "If you cannot sign in, use the official reset option first.", "If that fails, the Academic Affairs Office handles portal password resets (project brief). Bring your passport or student card.", "Never share the password or an OTP code with anyone."])}
    ${g(H.t("p_reg"), ["Registration opens in windows set by the university. Ask your school or the Academic Affairs Office for the dates.", "Search by course code, choose a class group, check for time clashes (the planner does this too), and submit on the official system.", "Open your registered list afterwards to confirm the status.", "If a class is full or missing, ask your school office."])}
    ${g(H.t("p_tt"), ["The timetable shows course code, room code, weeks and periods.", "Weeks like '2-9,11-18' mean there is no class in week 10.", "Use Room finder to read room codes."])}
    ${g(H.t("p_grades"), ["Grades appear in the portal after the lecturer submits them.", "If you disagree, ask the lecturer or school first, then the Academic Affairs Office about a formal review."])}
    ${g(H.t("p_tuition"), ["Tuition status is shown in the portal. Pay only by the method in the official announcement.", "Check the latest tuition announcement on the HUST news board (Home)."])}
    ${g(H.t("p_trouble"), ["Try a different browser or turn off a VPN.", "Clear the browser cache for the site.", "Take a screenshot of the error before you ask for help."])}
    <div class="row wrap"><button class="btn sm" data-a="go" data-tab="support" data-sub="help" data-param="portal">${H.t("who_helps")}</button>${H.link("https://hust.edu.vn", H.t("website"))}</div>
    <div class="src">${H.badge({s:"reference"})}<span>${H.t("src_brief")}</span></div></div></div>`;
}

H.views.academic = {render(sub){
  return html`${H.subTabs("academic") ? html`<div class="gut" style="padding-top:12px">${H.subTabs("academic")}</div>` : ""}${sub === "plan" ? renderPlan() : sub === "timetable" ? renderTimetable() : sub === "tasks" ? html`<div class="page gut">${H.renderTasks()}</div>` : sub === "credits" ? renderCredits() : renderPortal()}`;
}};
})(window);
