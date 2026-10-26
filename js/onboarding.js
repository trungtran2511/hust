/* Onboarding: language, four value points, who you are, optional details. Everything can be skipped and edited later in Profile. */
(function(root){
"use strict";
const H = root.H, html = H.html, ic = H.icon;
const STEPS = 4;
H.PROGRAMS = [["bachelor", "prog_bachelor"], ["master", "prog_master"], ["phd", "prog_phd"], ["exchange", "prog_exchange"], ["language", "prog_language"], ["other", "prog_other"]];
H.NEEDS = [["vi_help", "need_vi"], ["access", "need_access"], ["diet", "need_diet"], ["housing", "need_housing"], ["visa", "need_visa"]];
H.YEARS = ["1", "2", "3", "4", "5", "6+"];

const art = html`<svg class="art" viewBox="0 0 200 160" aria-hidden="true"><g fill="currentColor"><rect x="10" y="70" width="40" height="90"/><rect x="56" y="40" width="50" height="120"/><rect x="112" y="85" width="34" height="75"/><rect x="152" y="55" width="40" height="105"/></g></svg>`;

function stepDots(i){ return html`<div class="dots" aria-hidden="true">${Array.from({length:STEPS}, (_, k) => html`<i class="${k <= i ? "on" : ""}"></i>`)}</div>`; }

function langGrid(){ return html`<div class="langs" role="group" aria-label="${H.t("choose_lang")}">${H.LANGS.map(l => html`<button data-a="obLang" data-id="${l.id}" aria-pressed="${H.lang() === l.id}" lang="${l.id}"><b>${l.n}</b><span class="xs muted">${l.e}</span></button>`)}</div>`; }

H.views.onboarding = {render(){
  const s = H.S.ob.step, p = H.db.profile;
  let body;
  if (s === 0) body = html`
    <div class="onb-hero"><span class="mark" style="background:var(--accent-ink);color:var(--accent)">HUST</span><h1>${H.t("app_name")}</h1><p>${H.t("ob_tagline")}</p>${art}</div>
    <div class="stack-s"><span class="eyebrow">${H.t("choose_lang")}</span>${langGrid()}</div>
    <div class="stack-s"><button class="btn primary block" data-a="obNext">${H.t("get_started")}</button><button class="btn block" data-a="obGuest">${H.t("guest_mode")}</button><p class="xs muted" style="text-align:center">${H.t("guest_note")}</p></div>`;
  else if (s === 1) body = html`
    <h1>${H.t("ob_value_title")}</h1>
    <div class="list card">${[["target", "ob_v1", "ob_v1d"], ["cal", "ob_v2", "ob_v2d"], ["globe", "ob_v3", "ob_v3d"], ["shield", "ob_v4", "ob_v4d"]].map(v => html`<div class="li"><span class="ico">${ic(v[0])}</span><div class="grow"><b>${H.t(v[1])}</b><div class="muted small">${H.t(v[2])}</div></div></div>`)}</div>
    <div class="row"><button class="btn" data-a="obBack">${H.t("back")}</button><button class="btn primary grow" data-a="obNext">${H.t("next")}</button></div>`;
  else if (s === 2) body = html`
    <h1>${H.t("ob_role_title")}</h1><p class="muted small">${H.t("ob_role_sub")}</p>
    <div class="stack-s">${H.ROLES.map(r => html`<button class="choice" data-a="obRole" data-id="${r[0]}" aria-pressed="${p.role === r[0]}"><b>${H.t(r[1])}</b><span class="muted small">${H.t(r[2])}</span></button>`)}</div>
    <div class="row"><button class="btn" data-a="obBack">${H.t("back")}</button><button class="btn primary grow" data-a="obNext">${p.role ? H.t("next") : H.t("skip")}</button></div>`;
  else body = html`
    <h1>${H.t("ob_detail_title")}</h1><p class="muted small">${H.t("ob_detail_sub")}</p>
    ${profileFields()}
    <div class="row"><button class="btn" data-a="obBack">${H.t("back")}</button><button class="btn primary grow" data-a="obFinish">${H.t("finish")}</button></div>`;
  return html`<div class="onb gut" style="max-width:560px;margin:0 auto;width:100%">${stepDots(s)}${body}<button class="btn link" data-a="obSkip" style="align-self:center">${H.t("skip_all")}</button></div>`;
}};

/* shared by onboarding and Profile */
function profileFields(){
  const p = H.db.profile;
  return html`<div class="stack">
    <label class="fld" for="pf_name">${H.t("display_name")}<input class="inp" id="pf_name" data-in="pf" data-k="name" value="${p.name}" maxlength="40" autocomplete="nickname"><span class="hint">${H.t("name_hint")}</span></label>
    <label class="fld" for="pf_prog">${H.t("program")}<select class="inp" id="pf_prog" data-ch="pf" data-k="program"><option value="">—</option>${H.PROGRAMS.map(x => html`<option value="${x[0]}" ${p.program === x[0] ? "selected" : ""}>${H.t(x[1])}</option>`)}</select></label>
    <label class="fld" for="pf_year">${H.t("study_year")}<select class="inp" id="pf_year" data-ch="pf" data-k="year"><option value="">—</option>${H.YEARS.map(y => html`<option ${p.year === y ? "selected" : ""}>${y}</option>`)}</select></label>
    <label class="fld" for="pf_major">${H.t("major")}<input class="inp" id="pf_major" data-in="pf" data-k="major" value="${p.major}" maxlength="60"></label>
    <fieldset style="border:0;padding:0;margin:0" class="stack-s"><legend class="fld" style="margin-bottom:6px">${H.t("needs")}</legend>${H.NEEDS.map(n => html`<label class="check"><input type="checkbox" data-ch="pfNeed" data-k="${n[0]}" ${p.needs.indexOf(n[0]) >= 0 ? "checked" : ""}> <span>${H.t(n[1])}</span></label>`)}</fieldset>
    <p class="xs muted">${H.t("privacy_fields")}</p>
  </div>`;
}
H.profileFields = profileFields;
H.inputs.pf = el => { H.db.profile[el.dataset.k] = el.value.slice(0, 80); H.save(); };
H.changes.pf = el => { H.db.profile[el.dataset.k] = el.value; H.save(); H.applyTheme(); };
H.changes.pfNeed = el => { const n = H.db.profile.needs; const k = el.dataset.k, i = n.indexOf(k); if (el.checked && i < 0) n.push(k); else if (!el.checked && i >= 0) n.splice(i, 1); H.save(); };

H.actions.obLang = el => { H.db.profile.lang = el.dataset.id; H.save(); H.render(); };
H.actions.obNext = () => { if (!H.db.profile.lang) { H.db.profile.lang = "en"; H.save(); } H.S.ob.step = Math.min(STEPS - 1, H.S.ob.step + 1); H.render(); };
H.actions.obBack = () => { H.S.ob.step = Math.max(0, H.S.ob.step - 1); H.render(); };
H.actions.obRole = el => { H.db.profile.role = H.db.profile.role === el.dataset.id ? null : el.dataset.id; H.save(); H.render(); };
function finish(guest){ const p = H.db.profile; if (!p.lang) p.lang = "en"; p.onboarded = true; p.guest = !!guest; H.saveNow(); H.S.stage = "app"; H.go(!guest && !H.db.tt.ids.length && p.role ? "home" : "home"); }
H.actions.obFinish = () => finish(false);
H.actions.obGuest = () => finish(true);
H.actions.obSkip = () => finish(!H.db.profile.role && !H.db.profile.name);
})(window);
