/* Support tab: office finder + FAQ, First 30 Days checklist, handbook, conduct, self-assessment. */
(function(root){
"use strict";
const H = root.H, html = H.html, ic = H.icon;

/* ---------- help: problem -> office, FAQ ---------- */
const HS = {prob:"", faq:"", school:""};
function renderHelp(){
  const O = H.C.offices, P = O.problems, cur = P.find(x => x.id === HS.prob);
  const q = H.fold(HS.faq), F = H.C.faq.faq.filter(f => !q || H.fold(f.k + " " + f.q.en + " " + (f.q.vi || "")).indexOf(q) >= 0);
  return html`<div class="page gut"><h2>${H.t("sub_help")}</h2>${H.officialNote()}
    <section class="card"><h3>${H.t("which_office")}</h3><label class="fld" for="prob">${H.t("my_problem")}<select class="inp" id="prob" data-ch="helpProb"><option value="">—</option>${P.map(p => html`<option value="${p.id}" ${HS.prob === p.id ? "selected" : ""}>${p.q}</option>`)}</select></label>
      ${cur ? html`<ol class="stack-s">${cur.steps.map(s => html`<li>${s}</li>`)}</ol><div class="stack">${cur.offices.map(id => H.C.office[id] ? H.officeCard(H.C.office[id]) : "")}</div>` : ""}</section>
    <section class="card"><h3>${H.t("faq")}</h3><input class="inp" type="search" data-in="faqQ" value="${HS.faq}" placeholder="${H.t("faq_search")}" aria-label="${H.t("faq_search")}"><div id="faqList">${faqList(F)}</div></section>
    <section class="card"><h3>${H.t("all_offices")}</h3><div class="list">${O.offices.map(o => html`<button class="li tap" data-a="officeOpen" data-id="${o.id}"><div class="grow"><b>${o.name}</b><div class="small muted">${o.vi}</div></div>${ic("right")}</button>`)}</div></section>
    <section class="card"><h3>${H.t("schools")}</h3><div class="row wrap" style="gap:6px">${O.schools.map(s => html`<span class="chip" title="${s[1]}">${s[0]}</span>`)}</div><p class="xs muted">${H.t("schools_note")}</p></section>
    <button class="card tap hi" data-a="openSOS"><div class="row"><span class="ico" style="background:var(--bad-soft);color:var(--bad)">${ic("sos")}</span><div class="grow"><b>${H.t("emergency_help")}</b></div>${ic("right")}</div></button></div>`;
}
function faqList(F){
  return F.length ? html`<div class="list">${F.map(f => html`<details class="li" style="display:block"><summary><b>${H.lang() === "vi" && f.q.vi ? f.q.vi : f.q.en}</b></summary><p>${f.a}</p>${f.go ? html`<button class="btn sm" data-a="go" data-tab="${f.go[0]}" data-sub="${f.go[1]}">${H.t("open")}</button>` : ""}</details>`)}</div>` : H.empty("search", H.t("no_results"), "");
}
H.changes.helpProb = el => { HS.prob = el.value; H.render(true); };
H.inputs.faqQ = H.debounce(el => { HS.faq = el.value; const q = H.fold(HS.faq); H.patch("#faqList", faqList(H.C.faq.faq.filter(f => !q || H.fold(f.k + " " + f.q.en + " " + (f.q.vi || "")).indexOf(q) >= 0))); }, 100);
H.actions.officeOpen = el => { const o = H.C.office[el.dataset.id]; if (o) H.sheet(o.name, H.officeCard(o)); };

/* ---------- First 30 days checklist ---------- */
function renderChecklist(){
  const C = H.C.checklist, d = H.db.checklist, L = H.checklistTasks(), p = H.checklistProgress();
  return html`<div class="page gut"><div class="row between"><h2>${H.t("first30")}</h2><span class="chip acc">${p.done}/${p.total}</span></div>
    <div class="progress" role="progressbar" aria-valuenow="${p.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${H.t("first30")}"><i style="width:${p.pct}%"></i></div>
    ${H.db.profile.role ? html`<p class="small muted">${H.t("cl_for_role", {r:H.t("role_" + H.db.profile.role)})}</p>` : html`<p class="small muted">${H.t("cl_all_roles")} <button class="btn link" data-a="tab" data-tab="me" data-sub="profile">${H.t("set_up_profile")}</button></p>`}
    ${C.phases.map(ph => { const items = L.filter(t => t.phase === ph[0]); return items.length ? html`<section class="card"><h3>${ph[1]}</h3><div class="list">${items.map(t => html`<div class="li"><input type="checkbox" data-ch="clDone" data-id="${t.id}" ${d.done[t.id] ? "checked" : ""} aria-label="${H.loc(t.t)}"><button class="grow tap" style="text-align:left" data-a="clOpen" data-id="${t.id}"><b style="${d.done[t.id] ? "text-decoration:line-through;opacity:.6" : ""}">${H.loc(t.t)}</b>${d.due[t.id] ? html`<div class="xs mono muted">${H.t("due")}: ${d.due[t.id]}</div>` : ""}${d.notes[t.id] ? html`<div class="xs muted">${ic("note")} ${d.notes[t.id].slice(0, 60)}</div>` : ""}</button></div>`)}</div></section>` : ""; })}
    <p class="xs muted">${H.t("cl_note")}</p></div>`;
}
H.changes.clDone = el => { H.db.checklist.done[el.dataset.id] = el.checked ? Date.now() : 0; if (!el.checked) delete H.db.checklist.done[el.dataset.id]; H.save(); H.render(true); };
H.actions.clOpen = el => {
  const t = H.C.task[el.dataset.id]; if (!t) return; const d = H.db.checklist;
  H.sheet(H.loc(t.t), html`<div class="stack"><p>${H.loc(t.d)}</p>${H.source(t.meta)}
    ${(t.offices || []).map(id => H.C.office[id] ? html`<button class="btn block" data-a="officeOpen" data-id="${id}">${H.C.office[id].name}</button>` : "")}
    ${t.go ? html`<button class="btn block" data-a="go" data-tab="${t.go[0]}" data-sub="${t.go[1]}">${H.t("open")}</button>` : ""}
    <label class="fld" for="cl_due">${H.t("my_due")}<input class="inp" id="cl_due" type="date" data-ch="clDue" data-id="${t.id}" value="${d.due[t.id] || ""}"></label>
    <label class="fld" for="cl_note">${H.t("task_note")}<textarea class="inp" id="cl_note" data-in="clNote" data-id="${t.id}" maxlength="500">${d.notes[t.id] || ""}</textarea></label>
    <button class="btn primary block" data-a="clSheetDone">${H.t("done")}</button></div>`);
};
H.changes.clDue = el => { if (el.value) H.db.checklist.due[el.dataset.id] = el.value; else delete H.db.checklist.due[el.dataset.id]; H.save(); };
H.inputs.clNote = el => { if (el.value.trim()) H.db.checklist.notes[el.dataset.id] = el.value.slice(0, 500); else delete H.db.checklist.notes[el.dataset.id]; H.save(); };
H.actions.clSheetDone = () => { H.closeSheet(); H.render(true); };

/* ---------- handbook ---------- */
function renderHandbook(){
  const T = H.C.handbook.topics;
  return html`<div class="page gut"><h2>${H.t("sub_handbook")}</h2>${H.alert("warn", H.t("hb_note"))}
    <div class="list card">${T.map(t => html`<button class="li tap" data-a="hbOpen" data-id="${t.id}"><span class="ico">${ic(t.icon || "book")}</span><div class="grow"><b>${H.loc(t.t)}</b><div class="small muted">${t.applies || ""}</div></div>${H.badge(t.meta)}${ic("right")}</button>`)}</div></div>`;
}
H.actions.hbOpen = el => {
  const t = H.C.handbook.topics.find(x => x.id === el.dataset.id); if (!t) return;
  H.sheet(H.loc(t.t), html`<div class="stack"><p>${t.intro}</p>
    ${t.steps && t.steps.length ? html`<div><div class="eyebrow">${H.t("steps")}</div><ol class="stack-s">${t.steps.map(s => html`<li>${s}</li>`)}</ol></div>` : ""}
    ${t.docs ? html`<div><div class="eyebrow">${H.t("documents")}</div><ul class="stack-s">${t.docs.map(s => html`<li>${typeof s === "string" ? s : (s.t || s.n || JSON.stringify(s))}</li>`)}</ul></div>` : ""}
    ${t.notes && t.notes.length ? html`<div class="alert warn">${ic("info")}<div class="grow">${t.notes.map(n => html`<p class="small">${n}</p>`)}</div></div>` : ""}
    ${(t.offices || []).map(id => H.C.office[id] ? html`<button class="btn block" data-a="officeOpen" data-id="${id}">${H.C.office[id].name}</button>` : "")}
    <div class="row wrap">${(t.links || []).map(l => H.link(l.u, l.l))}</div>${H.source(t.meta)}</div>`);
};

/* ---------- conduct: general etiquette only; official rules via handbook ---------- */
function renderConduct(){
  const items = ["cd_1", "cd_2", "cd_3", "cd_4", "cd_5"];
  return html`<div class="page gut"><h2>${H.t("sub_conduct")}</h2>${H.alert("warn", H.t("cd_note"))}
    <section class="card"><h3>${H.t("cd_general")}</h3><ul class="stack-s">${items.map(k => html`<li>${H.t(k)}</li>`)}</ul></section>
    <section class="card"><h3>${H.t("cd_official")}</h3><p class="small">${H.t("cd_official_d")}</p><div class="row wrap"><button class="btn sm" data-a="hbOpen" data-id="regs">${H.t("topic_regs")}</button><button class="btn sm" data-a="hbOpen" data-id="exams">${H.t("topic_exams")}</button><button class="btn sm" data-a="hbOpen" data-id="support">${H.t("topic_support")}</button></div></section></div>`;
}

/* ---------- self-assessment ---------- */
function level(avg){ return avg < 1.5 ? "low" : avg < 2.5 ? "mid" : "high"; }
function renderAssess(){
  const A = H.C.assess, a = H.db.assess && H.db.assess.a || {}, done = A.cats.every(c => c.qs.every((_, i) => a[c.id + i] != null));
  return html`<div class="page gut"><h2>${H.t("sub_assess")}</h2>${H.alert("warn", A._note)}
    ${done ? resultCard(A, a) : ""}
    ${A.cats.map(c => html`<section class="card"><h3>${H.loc(c.t)}</h3>${c.qs.map((q, i) => html`<fieldset class="stack-s" style="border:0;padding:0;margin:0"><legend class="small">${H.loc(q)}</legend><div class="likert">${A.scale.map((s, k) => html`<button data-a="asAns" data-k="${c.id + i}" data-v="${k}" aria-pressed="${a[c.id + i] === k}">${H.loc(s)}</button>`)}</div></fieldset>`)}</section>`)}
    <button class="btn block" data-a="asReset">${H.t("reset")}</button></div>`;
}
function resultCard(A, a){
  return html`<section class="card hi"><h3>${H.t("as_result")}</h3>${A.cats.map(c => { const v = c.qs.reduce((s, _, i) => s + a[c.id + i], 0) / c.qs.length, lv = level(v), tips = c.tips[lv];
    return html`<div class="li"><div class="grow stack-s"><b>${H.loc(c.t)}</b><span class="chip ${lv === "high" ? "ok" : lv === "mid" ? "warn" : "bad"}">${H.t("lvl_" + lv)}</span><ul class="small stack-s">${tips.map(x => html`<li>${x}</li>`)}</ul>${c.go ? html`<button class="btn sm" data-a="go" data-tab="${c.go[0]}" data-sub="${c.go[1]}">${H.loc(c.goLabel)}</button>` : ""}</div></div>`; })}<p class="xs muted">${H.t("as_not_valid")}</p></section>`;
}
H.actions.asAns = el => { const d = H.db.assess = H.db.assess || {a:{}}; d.a = d.a || {}; d.a[el.dataset.k] = +el.dataset.v; H.save(); H.render(true); };
H.actions.asReset = () => H.confirm(H.t("reset"), H.t("as_reset_q"), H.t("reset"), () => { H.db.assess = null; H.save(); H.render(true); }, true);

H.views.support = {render(sub){
  return html`<div class="gut" style="padding-top:12px">${H.subTabs("support")}</div>${sub === "help" ? renderHelp() : sub === "checklist" ? renderChecklist() : sub === "handbook" ? renderHandbook() : sub === "conduct" ? renderConduct() : renderAssess()}`;
}};
})(window);
