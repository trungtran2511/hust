/* Home dashboard and top-level tab registry. */
(function(root){
"use strict";
const H = root.H, html = H.html, ic = H.icon, T = H.tkb;

H.TABS.push(
  {id:"home", icon:"home", key:"tab_home"},
  {id:"academic", icon:"book", key:"tab_academic", subs:[{id:"plan", key:"sub_plan"}, {id:"timetable", key:"sub_timetable"}, {id:"tasks", key:"sub_tasks"}, {id:"credits", key:"sub_credits"}, {id:"portal", key:"sub_portal"}]},
  {id:"campus", icon:"pin", key:"tab_campus", subs:[{id:"map", key:"sub_map"}, {id:"rooms", key:"sub_rooms"}, {id:"library", key:"sub_library"}, {id:"places", key:"sub_places"}]},
  {id:"life", icon:"chat", key:"tab_life", subs:[{id:"guide", key:"sub_guide"}, {id:"vi", key:"sub_phrases"}, {id:"address", key:"sub_address"}, {id:"activities", key:"sub_activities"}]},
  {id:"support", icon:"shield", key:"tab_support", subs:[{id:"help", key:"sub_help"}, {id:"checklist", key:"sub_checklist"}, {id:"handbook", key:"sub_handbook"}, {id:"conduct", key:"sub_conduct"}, {id:"assess", key:"sub_assess"}]},
  {id:"me", icon:"user", key:"profile", hidden:true, subs:[{id:"profile", key:"sub_profile"}, {id:"saved", key:"sub_saved"}, {id:"data", key:"sub_data"}, {id:"about", key:"sub_about"}]}
);

/* ---------- first 30 days helpers ---------- */
H.checklistTasks = function(){ const r = H.db.profile.role; return H.C.checklist.tasks.filter(t => !r || t.roles.indexOf(r) >= 0); };
H.checklistProgress = function(){ const L = H.checklistTasks(), d = H.db.checklist.done; const n = L.filter(t => d[t.id]).length; return {done:n, total:L.length, pct:L.length ? Math.round(n / L.length * 100) : 0, next:L.find(t => !d[t.id])}; };

function nextClassCard(){
  const r = H.classesNow();
  if (r.state === "noTT") return html`<section class="card hi"><h2>${H.t("home_no_tt")}</h2><p class="small muted">${H.t("home_no_tt_d")}</p><button class="btn primary" data-a="go" data-tab="academic" data-sub="plan">${ic("plus")} ${H.t("add_classes")}</button></section>`;
  if (r.state === "loading") return html`<section class="card"><div class="row"><span class="spinner"></span> ${H.t("loading")}</div></section>`;
  if (r.state === "noStart") return html`<section class="card hi"><h2>${H.t("home_need_start")}</h2><p class="small muted">${H.t("home_need_start_d")}</p><button class="btn primary" data-a="go" data-tab="academic" data-sub="timetable">${H.t("set_start")}</button></section>`;
  if (!r.next) return html`<section class="card"><h2>${H.t("home_no_next")}</h2><p class="small muted">${r.state === "before" ? H.t("home_before_sem") : H.t("home_no_next_d")}</p></section>`;
  const n = r.next, c = n.c, s = n.s, isToday = H.ymd(n.date) === H.ymd(new Date());
  const b = H.roomBuilding(s.room), room = T.decodeRoom(s.room);
  return html`<section class="next-class"><span class="eyebrow">${isToday ? H.t("next_class") : H.t("next_class_on", {d:H.fmtDate(n.date, {weekday:"long", day:"numeric", month:"short"})})}</span>
    <div class="big">${H.courseName(c.code)}</div>
    <div class="row wrap" style="gap:10px"><span class="mono">${T.hhmm(s.s)}–${T.hhmm(s.e)}</span><span class="mono">${s.room || H.t("room_tba")}</span><span class="small">${c.code} · ${c.id}</span></div>
    ${room ? html`<div class="small" style="opacity:.8">${H.t("room_decoded", {b:room.building, f:room.floor})}</div>` : ""}
    <div class="row wrap">${b ? html`<button class="btn primary" data-a="navTo" data-id="${b}">${ic("nav")} ${H.t("navigate")}</button>` : s.room ? html`<button class="btn" data-a="go" data-tab="campus" data-sub="rooms" data-param="${s.room}">${H.t("room_help")}</button>` : ""}<button class="btn" data-a="go" data-tab="academic" data-sub="timetable">${H.t("open_timetable")}</button></div></section>`;
}
function todayCard(){
  const r = H.classesNow(); if (r.state !== "ok" || !r.today || !r.today.length) return "";
  return html`<section class="card"><div class="row between"><h2>${H.t("today_classes")}</h2><span class="chip">${H.t("week_n", {n:r.week})}</span></div><div class="list">${r.today.map(i => html`<div class="li"><span class="mono small" style="min-width:92px">${T.hhmm(i.s.s)}–${T.hhmm(i.s.e)}</span><div class="grow"><b>${H.courseName(i.c.code)}</b><div class="muted small">${i.s.room || H.t("room_tba")} · ${CT(i.c.type)}</div></div></div>`)}</div></section>`;
}
const CT = type => H.t("ctype_" + type) === "ctype_" + type ? type : H.t("ctype_" + type);
H.classType = CT;
function checklistCard(){
  const p = H.checklistProgress(); const n = p.next;
  return html`<section class="card"><div class="row between"><h2>${H.t("first30")}</h2><span class="chip acc">${p.done}/${p.total}</span></div>
    <div class="progress" role="progressbar" aria-valuenow="${p.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${H.t("first30")}"><i style="width:${p.pct}%"></i></div>
    ${n ? html`<div class="row"><div class="grow"><div class="eyebrow">${H.t("next_task")}</div><b>${H.loc(n.t)}</b></div><button class="btn sm" data-a="go" data-tab="support" data-sub="checklist">${H.t("open")}</button></div>` : html`<p class="small">${H.t("all_done")}</p>`}</section>`;
}
function remindersCard(){
  const due = H.tasksDue ? H.tasksDue() : [], open = H.tasksOpen ? H.tasksOpen().slice(0, 3) : [];
  return html`<section class="card"><div class="row between"><h2>${H.t("my_reminders")}</h2><button class="btn sm" data-a="taskNew">${ic("plus")} ${H.t("add")}</button></div>
    ${due.length ? html`<div class="alert warn">${ic("bell")}<div class="grow"><b>${H.t("due_now")}</b>${due.map(t => html`<div class="small">${t.title}</div>`)}</div></div>` : ""}
    ${open.length ? html`<div class="list">${open.map(t => H.taskRow(t, true))}</div>` : html`<p class="small muted">${H.t("no_reminders")}</p>`}
    <p class="xs muted">${H.t("reminder_limit")}</p></section>`;
}
function noticesCard(){
  const items = H.C.notices.items.slice(0, 5), srcs = H.C.notices.srcs;
  return html`<section class="card"><div class="row between"><h2>${H.t("official_info")}</h2><span class="chip warn">${H.t("copied_by_hand")}</span></div>
    <div class="list">${items.map(n => html`<div class="li"><div class="grow stack-s"><div class="row wrap"><span class="chip info">${srcs[n.src] ? srcs[n.src].name : n.src}</span><span class="xs muted mono">${n.date}</span></div><b>${n.vi}</b>${H.lang() !== "vi" ? html`<span class="muted small">${n.en}</span>` : ""}</div></div>`)}</div>
    <p class="xs muted">${H.t("notices_note")}</p>
    <div class="row wrap">${H.link(srcs["CTSV"].url, H.t("open_ctsv"))}${H.link(srcs["ĐTĐH"].url, H.t("open_hust"))}</div></section>`;
}
function dayIndex(){ return Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000); }
function phraseCard(){
  const L = H.C.phrases.phrases.filter(p => p.lvl !== "emergency"); const p = L[dayIndex() % L.length];
  return html`<section class="card"><span class="eyebrow">${H.t("daily_phrase")}</span><div class="row"><div class="grow"><div class="phrase-vi" lang="vi">${p.vi}</div><div class="mono small muted">${p.rom}</div></div>${H.sayBtn(p.vi)}</div><p>${H.loc(p.tr)}</p>${p.note ? html`<p class="small muted">${p.note}</p>` : ""}<div class="row wrap"><button class="btn sm" data-a="learnKnown" data-id="${p.id}">${ic("check")} ${H.t("i_know_it")}</button>${H.star("phrases", p.id)}<button class="btn sm" data-a="go" data-tab="life" data-sub="vi">${H.t("more_phrases")}</button></div></section>`;
}
function tipCard(){ const L = H.C.tips.tips, t = L[(dayIndex() + 3) % L.length]; return html`<section class="card"><span class="eyebrow">${H.t("campus_tip")}</span><p>${H.lang() === "vi" ? t.vi : t.en}</p></section>`; }

H.views.home = {render(){
  const p = H.db.profile, guest = !p.name && !H.db.tt.ids.length;
  const quick = (p.quick || []).filter(id => H.TOOLS[id]);
  return html`<div class="page gut">
    <div class="hero"><h1>${H.t("hello")}${p.name ? ", " + p.name : ""}</h1><div class="muted">${H.fmtDate(new Date())}</div>${p.role ? html`<div class="row wrap"><span class="chip acc">${H.t("role_" + p.role)}</span><span class="chip">${H.t("local_profile")}</span></div>` : html`<div class="row wrap"><span class="chip">${H.t("guest_chip")}</span><button class="btn link" data-a="tab" data-tab="me" data-sub="profile">${H.t("set_up_profile")}</button></div>`}</div>
    <div class="cols"><div class="stack">${nextClassCard()}${todayCard()}${remindersCard()}${noticesCard()}</div>
    <div class="stack">${checklistCard()}
      <section class="stack-s"><div class="row between"><span class="eyebrow">${H.t("quick_tools")}</span><button class="btn link" data-a="editQuick">${H.t("customize")}</button></div><div class="grid2">${quick.map(H.toolBtn)}</div></section>
      ${phraseCard()}${tipCard()}
      <button class="card tap hi" data-a="openSOS"><div class="row"><span class="ico" style="background:var(--bad-soft);color:var(--bad)">${ic("sos")}</span><div class="grow"><b>${H.t("emergency_help")}</b><div class="small muted">${H.t("emergency_sub")}</div></div>${ic("right")}</div></button>
      <p class="xs muted">${H.t("not_official_short")}</p></div></div></div>`;
}};

H.actions.editQuick = () => {
  const cur = H.db.profile.quick || [];
  H.sheet(H.t("customize"), html`<p class="small muted">${H.t("quick_hint")}</p><div class="stack-s">${Object.keys(H.TOOLS).map(id => html`<label class="check"><input type="checkbox" data-ch="quickTog" data-id="${id}" ${cur.indexOf(id) >= 0 ? "checked" : ""}><span>${H.t(H.TOOLS[id].key)}</span></label>`)}</div><button class="btn primary block" data-a="quickDone">${H.t("done")}</button>`);
};
H.changes.quickTog = el => { const q = H.db.profile.quick = H.db.profile.quick || []; const i = q.indexOf(el.dataset.id); if (el.checked && i < 0) q.push(el.dataset.id); else if (!el.checked && i >= 0) q.splice(i, 1); H.save(); };
H.actions.quickDone = () => { H.closeSheet(); H.render(true); };
H.actions.learnKnown = el => { H.db.learn.known[el.dataset.id] = Date.now(); H.save(); H.toast(H.t("marked_known")); };
})(window);
