/* Profile, saved items, data control, about and feedback. */
(function(root){
"use strict";
const H = root.H, html = H.html, ic = H.icon;

function renderProfile(){
  const p = H.db.profile;
  return html`<div class="page gut"><h2>${H.t("sub_profile")}</h2>
    <section class="card"><p class="small">${H.t("local_profile_d")}</p><div class="chip">${p.guest ? H.t("guest_chip") : H.t("local_profile")}</div></section>
    <section class="card"><h3>${H.t("language")}</h3><div class="langs">${H.LANGS.map(l => html`<button data-a="setLang" data-id="${l.id}" aria-pressed="${H.lang() === l.id}" lang="${l.id}"><b>${l.n}</b></button>`)}</div>
      <label class="check"><input type="checkbox" data-ch="bilingual" ${p.bilingual ? "checked" : ""}><span>${H.t("bilingual")}<div class="xs muted">${H.t("bilingual_d")}</div></span></label></section>
    <section class="card"><h3>${H.t("theme")}</h3><div class="seg">${[["system", "theme_system"], ["light", "theme_light"], ["dark", "theme_dark"]].map(x => html`<button data-a="setTheme" data-id="${x[0]}" aria-pressed="${(p.theme || "system") === x[0]}">${H.t(x[1])}</button>`)}</div></section>
    <section class="card"><h3>${H.t("who_you_are")}</h3><div class="stack-s">${H.ROLES.map(r => html`<button class="choice" data-a="obRoleP" data-id="${r[0]}" aria-pressed="${p.role === r[0]}"><b>${H.t(r[1])}</b><span class="muted small">${H.t(r[2])}</span></button>`)}</div></section>
    <section class="card"><h3>${H.t("details")}</h3>${H.profileFields()}</section></div>`;
}
H.actions.setLang = el => { H.db.profile.lang = el.dataset.id; H.save(); H.render(true); };
H.actions.setTheme = el => { H.db.profile.theme = el.dataset.id; H.save(); H.render(true); };
H.actions.obRoleP = el => { H.db.profile.role = H.db.profile.role === el.dataset.id ? null : el.dataset.id; H.save(); H.render(true); };
H.changes.bilingual = el => { H.db.profile.bilingual = el.checked; H.save(); H.render(true); };

/* ---------- saved ---------- */
function savedBlock(title, ids, row){
  return ids.length ? html`<section class="card"><h3>${title}</h3><div class="list">${ids.map(row)}</div></section>` : "";
}
function renderSaved(){
  const S = H.db.saved, D = H.tk.D, none = !Object.keys(S).some(k => S[k].length);
  return html`<div class="page gut"><h2>${H.t("sub_saved")}</h2>
    ${none ? H.empty("star", H.t("saved_empty"), H.t("saved_empty_d")) : ""}
    ${savedBlock(H.t("tool_map"), S.buildings, id => H.C.bld[id] ? html`<div class="li"><button class="grow tap" style="text-align:left" data-a="navTo" data-id="${id}"><b>${H.C.bld[id].name}</b></button>${H.star("buildings", id)}</div>` : "")}
    ${savedBlock(H.t("sub_rooms"), S.rooms, id => html`<div class="li"><button class="grow tap mono" style="text-align:left" data-a="roomOpen" data-room="${id}"><b>${id}</b></button>${H.star("rooms", id)}</div>`)}
    ${savedBlock(H.t("courses"), S.courses, id => html`<div class="li"><button class="grow tap" style="text-align:left" data-a="courseOpen" data-code="${id}"><b>${H.courseName(id)}</b><div class="xs mono muted">${id}</div></button>${H.star("courses", id)}</div>`)}
    ${savedBlock(H.t("sub_phrases"), S.phrases, id => { const p = H.C.phrase[id]; return p ? html`<div class="li"><div class="grow"><div class="phrase-vi" lang="vi">${p.vi}</div><div class="small">${H.loc(p.tr)}</div></div>${H.sayBtn(p.vi)}${H.star("phrases", id)}</div>` : ""; })}
    ${savedBlock(H.t("sub_guide"), S.guides, id => { const t = H.C.lifeguide.topics.find(x => x.id === id); return t ? html`<div class="li"><button class="grow tap" style="text-align:left" data-a="guideOpen" data-id="${id}"><b>${H.loc(t.t)}</b></button>${H.star("guides", id)}</div>` : ""; })}
    ${savedBlock(H.t("all_offices"), S.contacts, id => H.C.office[id] ? html`<div class="li"><button class="grow tap" style="text-align:left" data-a="officeOpen" data-id="${id}"><b>${H.C.office[id].name}</b></button>${H.star("contacts", id)}</div>` : "")}</div>`;
}

/* ---------- data ---------- */
function renderData(){
  const n = H.db.tt.ids.length + H.db.tasks.length;
  return html`<div class="page gut"><h2>${H.t("sub_data")}</h2>
    ${H.storageOK() ? "" : H.alert("bad", H.t("storage_blocked"))}
    <section class="card"><p>${H.t("data_where")}</p><p class="small muted">${H.t("data_what", {n})}</p></section>
    <section class="card"><h3>${H.t("backup")}</h3><div class="row wrap"><button class="btn" data-a="dataExport">${ic("down2")} ${H.t("export_all")}</button><label class="btn" for="dataImp">${ic("up2")} ${H.t("import_all")}</label><input class="sr" type="file" id="dataImp" accept=".json,application/json" data-ch="dataImp"></label></div><p class="xs muted">${H.t("import_warn")}</p></section>
    <section class="card"><h3>${H.t("tkb_data")}</h3><p class="small">${H.tk.D ? H.t("tkb_loaded", {t:H.tk.D.term || "", n:Object.keys(H.tk.D.byId).length}) : H.t("loading")}${H.tk.custom ? " · " + H.t("tkb_custom") : ""}</p><button class="btn" data-a="tkbReset">${H.t("tkb_reset")}</button></section>
    <section class="card"><h3>${H.t("danger")}</h3><div class="stack-s"><button class="btn danger" data-a="wipeAll">${ic("trash")} ${H.t("delete_all")}</button></div></section></div>`;
}
H.actions.dataExport = () => { H.download("hust-guide-backup.json", "application/json", H.exportData()); H.toast(H.t("export_done")); };
H.changes.dataImp = el => {
  const f = el.files && el.files[0]; el.value = ""; if (!f) return; if (f.size > 5e6) { H.toast(H.t("import_too_big"), "bad"); return; }
  f.text().then(t => { try { H.importData(t); H.applyTheme(); H.render(); H.toast(H.t("import_all_ok"), "ok"); } catch (e) { H.toast(H.t("import_bad_shape"), "bad"); } });
};
H.actions.tkbReset = () => H.resetTKB().then(() => { H.toast(H.t("saved_ok")); H.render(true); });
H.actions.wipeAll = () => H.confirm(H.t("delete_all"), H.t("delete_all_q"), H.t("delete_all"), async () => { H.wipe(); try { await H.idbDel("tkbRaw"); } catch (e) {} H.S.stage = "onboarding"; H.S.ob.step = 0; H.render(); }, true);

/* ---------- about + feedback ---------- */
function renderAbout(){
  return html`<div class="page gut"><h2>${H.t("sub_about")}</h2>
    <section class="card hi"><h3>${H.t("app_name")}</h3><p>${H.t("about_unofficial")}</p><p class="small muted">v${H.version} · Beta</p></section>
    <section class="card"><h3>${H.t("about_trust")}</h3><div class="list">${["official", "reference", "sample", "unverified", "user"].map(s => html`<div class="li">${H.badge({s})}<span class="small grow">${H.t("trust_" + s + "_d")}</span></div>`)}</div></section>
    <section class="card"><h3>${H.t("about_beta")}</h3><ul class="stack-s">${["beta_1", "beta_2", "beta_3", "beta_4"].map(k => html`<li class="small">${H.t(k)}</li>`)}</ul></section>
    <section class="card"><h3>${H.t("privacy")}</h3><p class="small">${H.t("privacy_d")}</p></section>
    <section class="card"><h3>${H.t("feedback")}</h3><p class="small muted">${H.t("feedback_d")}</p><textarea class="inp" id="fbText" maxlength="2000" aria-label="${H.t("feedback")}"></textarea><div class="row wrap"><button class="btn primary" data-a="fbSave">${H.t("fb_save")}</button><button class="btn" data-a="fbCopy">${ic("copy")} ${H.t("copy")}</button></div>
      ${H.db.feedback.length ? html`<div class="list">${H.db.feedback.slice(-3).map(f => html`<div class="li small">${f.text.slice(0, 120)}</div>`)}</div>` : ""}</section>
    <section class="card"><h3>${H.t("licenses")}</h3><p class="small muted">SheetJS Community Edition 0.18.5 (Apache-2.0)</p></section></div>`;
}
H.actions.fbSave = () => { const t = (document.getElementById("fbText") || {}).value || ""; if (!t.trim()) return; H.db.feedback.push({text:t.slice(0, 2000), at:Date.now()}); H.save(); H.toast(H.t("fb_saved")); H.render(true); };
H.actions.fbCopy = () => { const t = (document.getElementById("fbText") || {}).value || ""; if (!t.trim()) return; H.actions.copy({dataset:{v:t}}); };

H.views.me = {render(sub){
  return html`<div class="gut" style="padding-top:12px">${H.subTabs("me")}</div>${sub === "profile" ? renderProfile() : sub === "saved" ? renderSaved() : sub === "data" ? renderData() : renderAbout()}`;
}};
})(window);
