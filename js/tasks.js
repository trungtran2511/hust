/* Personal reminders, assignments, exams, study sessions and notes: one model, many views.
   Reminders are in-app only. A web app cannot reliably notify you while it is closed, and the app says so. */
(function(root){
"use strict";
const H = root.H, html = H.html, ic = H.icon;
const KINDS = ["assignment", "exam", "study", "admin", "personal", "note"];
const alerted = {};
H.taskKinds = KINDS;
const parseDue = s => { if (!s) return null; const d = new Date(s); return isNaN(d) ? null : d; };
H.tasksOpen = () => H.db.tasks.filter(t => !t.done && t.kind !== "note").sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
H.tasksDue = () => { const now = Date.now(); return H.db.tasks.filter(t => { if (t.done || !t.due || t.remind == null || t.remind < 0) return false; const d = parseDue(t.due); return d && now >= d.getTime() - t.remind * 60000; }); };
function left(t){ const d = parseDue(t.due); if (!d) return ""; const ms = d - Date.now(), day = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - H.today()) / 86400000);
  if (ms < 0) return H.t("overdue"); if (day === 0) return H.t("today"); if (day === 1) return H.t("tomorrow"); return H.t("in_days", {n:day}); }
H.taskRow = function(t, compact){
  const d = parseDue(t.due), ov = d && !t.done && d < new Date();
  return html`<div class="li"><input type="checkbox" data-ch="taskDone" data-id="${t.id}" ${t.done ? "checked" : ""} aria-label="${H.t("mark_done")}: ${t.title}"><div class="grow stack-s"><b style="${t.done ? "text-decoration:line-through;opacity:.6" : ""}">${t.title}</b><div class="row wrap" style="gap:6px"><span class="chip">${H.t("kind_" + t.kind)}</span>${t.course ? html`<span class="chip info">${t.course}</span>` : ""}${d ? html`<span class="chip ${ov ? "bad" : ""} mono">${H.fmtDate(d, {day:"numeric", month:"short"})} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} · ${left(t)}</span>` : ""}</div>${!compact && t.note ? html`<p class="small muted" style="white-space:pre-wrap">${t.note}</p>` : ""}</div>${compact ? "" : html`<button class="ibtn sm" data-a="taskEdit" data-id="${t.id}" aria-label="${H.t("edit")}">${ic("edit")}</button>`}</div>`;
};
function courseOptions(cur){
  const D = H.tk.D, codes = D ? [...new Set(H.db.tt.ids.map(id => D.byId[id] && D.byId[id].code).filter(Boolean))] : [];
  return html`<datalist id="tcodes">${codes.map(c => html`<option value="${c}">${H.courseName(c)}</option>`)}</datalist>`;
}
function form(t){
  t = t || {kind:"assignment", remind:60};
  return html`<form data-form="task" data-id="${t.id || ""}" class="stack" novalidate>
    <label class="fld" for="tk_title">${H.t("task_title")}<input class="inp" id="tk_title" name="title" value="${t.title || ""}" maxlength="120" required autocomplete="off"></label>
    <label class="fld" for="tk_kind">${H.t("task_kind")}<select class="inp" id="tk_kind" name="kind">${KINDS.map(k => html`<option value="${k}" ${t.kind === k ? "selected" : ""}>${H.t("kind_" + k)}</option>`)}</select></label>
    <label class="fld" for="tk_course">${H.t("task_course")}<input class="inp" id="tk_course" name="course" list="tcodes" value="${t.course || ""}" maxlength="20" autocomplete="off"></label>${courseOptions()}
    <label class="fld" for="tk_due">${H.t("task_due")}<input class="inp" id="tk_due" name="due" type="datetime-local" value="${t.due || ""}"></label>
    <label class="fld" for="tk_remind">${H.t("task_remind")}<select class="inp" id="tk_remind" name="remind">${[[-1, "remind_none"], [0, "remind_at"], [10, "remind_10"], [60, "remind_60"], [1440, "remind_day"]].map(r => html`<option value="${r[0]}" ${(t.remind == null ? -1 : t.remind) === r[0] ? "selected" : ""}>${H.t(r[1])}</option>`)}</select></label>
    <label class="fld" for="tk_note">${H.t("task_note")}<textarea class="inp" id="tk_note" name="note" maxlength="1000">${t.note || ""}</textarea></label>
    <div class="errtxt" id="tk_err" role="alert"></div>
    <div class="row wrap"><button type="submit" class="btn primary grow">${H.t("save")}</button>${t.id ? html`<button type="button" class="btn danger" data-a="taskDel" data-id="${t.id}">${ic("trash")} ${H.t("delete")}</button>` : ""}</div></form>`;
}
H.actions.taskNew = el => H.sheet(H.t("new_reminder"), form(el && el.dataset && el.dataset.kind ? {kind:el.dataset.kind, remind:60} : null));
H.actions.taskEdit = el => { const t = H.db.tasks.find(x => x.id === el.dataset.id); if (t) H.sheet(H.t("edit"), form(t)); };
H.actions.taskDel = el => H.confirm(H.t("delete"), H.t("confirm_delete_task"), H.t("delete"), () => { H.db.tasks = H.db.tasks.filter(t => t.id !== el.dataset.id); H.save(); H.render(true); }, true);
H.changes.taskDone = el => { const t = H.db.tasks.find(x => x.id === el.dataset.id); if (t) { t.done = el.checked; H.save(); H.render(true); } };
document.addEventListener("submit", e => {
  const f = e.target.closest("[data-form='task']"); if (!f) return; e.preventDefault();
  const v = Object.fromEntries(new FormData(f)); const title = String(v.title || "").trim();
  if (!title) { f.querySelector("#tk_err").textContent = H.t("err_title"); return; }
  const rec = {title:title.slice(0, 120), kind:KINDS.indexOf(v.kind) >= 0 ? v.kind : "personal", course:String(v.course || "").trim().slice(0, 20), due:v.due || "", remind:+v.remind, note:String(v.note || "").slice(0, 1000)};
  if (rec.kind === "note") { rec.due = ""; rec.remind = -1; }
  if (f.dataset.id) { const t = H.db.tasks.find(x => x.id === f.dataset.id); if (t) Object.assign(t, rec); }
  else H.db.tasks.push(Object.assign({id:H.uid(), done:false, created:Date.now()}, rec));
  H.save(); H.closeSheet(); H.toast(H.t("saved_ok")); H.render(true);
});

/* in-app reminder check: runs while the app is open */
function tick(){
  H.tasksDue().forEach(t => { if (alerted[t.id]) return; alerted[t.id] = 1; H.toast(H.t("reminder_toast", {t:t.title}));
    try { if ("Notification" in root && Notification.permission === "granted") new Notification(H.t("app_name"), {body:t.title}); } catch (e) {} });
}
setInterval(tick, 30000); setTimeout(tick, 2500);
H.actions.askNotif = () => { try { if (!("Notification" in root)) { H.toast(H.t("notif_none"), "bad"); return; } Notification.requestPermission().then(p => { H.toast(p === "granted" ? H.t("notif_on") : H.t("notif_off")); H.render(true); }); } catch (e) { H.toast(H.t("notif_none"), "bad"); } };

const view = {filter:"open"};
H.actions.taskFilter = el => { view.filter = el.dataset.id; H.render(true); };
H.renderTasks = function(){
  const all = H.db.tasks; let L;
  if (view.filter === "open") L = all.filter(t => !t.done && t.kind !== "note").sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
  else if (view.filter === "exam") L = all.filter(t => t.kind === "exam" && !t.done).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
  else if (view.filter === "notes") L = all.filter(t => t.kind === "note").sort((a, b) => b.created - a.created);
  else L = all.filter(t => t.done).sort((a, b) => b.created - a.created);
  const perm = "Notification" in root ? Notification.permission : "unsupported";
  return html`<div class="stack"><div class="row between"><h2>${H.t("sub_tasks")}</h2><div class="row"><button class="btn sm" data-a="taskNew" data-kind="note">${ic("note")} ${H.t("kind_note")}</button><button class="btn sm primary" data-a="taskNew">${ic("plus")} ${H.t("add")}</button></div></div>
    <div class="seg">${[["open", "filter_open"], ["exam", "kind_exam"], ["notes", "filter_notes"], ["done", "filter_done"]].map(f => html`<button data-a="taskFilter" data-id="${f[0]}" aria-pressed="${view.filter === f[0]}">${H.t(f[1])}</button>`)}</div>
    <div class="card">${L.length ? html`<div class="list">${L.map(t => H.taskRow(t, false))}</div>` : H.empty("check", H.t("tasks_empty"), H.t("tasks_empty_d"))}</div>
    <div class="alert">${ic("bell")}<div class="grow"><b>${H.t("how_reminders")}</b><p class="small">${H.t("reminder_limit")}</p>${perm === "default" ? html`<button class="btn sm" data-a="askNotif">${H.t("enable_notif")}</button>` : perm === "granted" ? html`<span class="chip ok">${H.t("notif_on")}</span>` : ""}</div></div></div>`;
};
})(window);
