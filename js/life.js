/* Life tab: daily-life guide, Vietnamese phrasebook with flashcards and quiz, forms of address, official channels. */
(function(root){
"use strict";
const H = root.H, html = H.html, ic = H.icon;

/* ---------- daily-life guide ---------- */
const GS = {open:null};
function renderGuide(){
  const T = H.C.lifeguide.topics;
  return html`<div class="page gut"><h2>${H.t("sub_guide")}</h2>${H.alert("warn", H.t("guide_note"))}
    <div class="grid2">${T.map(t => html`<button class="tool" data-a="guideOpen" data-id="${t.id}"><span class="ico">${ic(t.icon || "globe")}</span><b>${H.loc(t.t)}</b></button>`)}</div></div>`;
}
H.actions.guideOpen = el => {
  const t = H.C.lifeguide.topics.find(x => x.id === el.dataset.id); if (!t) return;
  H.sheet(H.loc(t.t), html`<div class="stack">${t.cards.map(c => html`<section class="card"><h3>${c.h}</h3><ul class="stack-s">${c.b.map(x => html`<li>${x}</li>`)}</ul></section>`)}
    <div class="row wrap">${H.star("guides", t.id)}<button class="btn sm" data-a="go" data-tab="life" data-sub="vi">${H.t("open_phrases")}</button></div><p class="xs muted">${H.t("guide_note")}</p></div>`);
};

/* ---------- phrasebook ---------- */
const PS = {sit:"all", q:"", mode:"list", fav:false, card:null, flip:false, quiz:null};
const phrases = () => H.C.phrases.phrases;
function phraseRow(p){
  return html`<div class="li"><div class="grow stack-s"><div class="phrase-vi" lang="vi">${p.vi}</div><div class="mono small muted">${p.rom}</div><div>${H.loc(p.tr)}</div>${p.note ? html`<div class="small muted">${p.note}</div>` : ""}${H.db.learn.known[p.id] ? html`<span class="chip ok">${H.t("known")}</span>` : ""}</div><div class="stack-s">${H.sayBtn(p.vi)}${H.star("phrases", p.id)}</div></div>`;
}
function listBody(){
  const q = H.fold(PS.q), L = phrases().filter(p => (PS.sit === "all" || p.sit === PS.sit) && (!PS.fav || H.isSaved("phrases", p.id)) && (!q || H.fold(p.vi + " " + p.rom + " " + H.loc(p.tr) + " " + p.tr.en).indexOf(q) >= 0));
  return L.length ? html`<div class="card"><div class="list">${L.map(phraseRow)}</div></div>` : H.empty("search", H.t("no_results"), "");
}
function speechNote(){
  const s = H.speechState();
  return s === "vi" ? "" : H.alert("warn", s === "none" ? H.t("speech_none") : H.t("speech_novoice"));
}
function renderPhrases(){
  const sits = H.C.phrases.situations, known = Object.keys(H.db.learn.known).length, total = phrases().length;
  const modes = [["list", "ph_list"], ["cards", "ph_cards"], ["quiz", "ph_quiz"]];
  let body;
  if (PS.mode === "cards") body = cardsBody(); else if (PS.mode === "quiz") body = quizBody();
  else body = html`<input class="inp" type="search" data-in="phQ" value="${PS.q}" placeholder="${H.t("ph_search")}" autocomplete="off" aria-label="${H.t("ph_search")}">
    <div class="row wrap" style="gap:6px"><button class="chip" data-a="phSit" data-id="all" aria-pressed="${PS.sit === "all"}">${H.t("all")}</button>${sits.map(s => html`<button class="chip" data-a="phSit" data-id="${s.id}" aria-pressed="${PS.sit === s.id}">${H.loc(s.t)}</button>`)}<button class="chip" data-a="phFav" aria-pressed="${PS.fav}">${ic("star")} ${H.t("saved")}</button></div><div id="phList">${listBody()}</div>`;
  return html`<div class="page gut"><div class="row between"><h2>${H.t("sub_phrases")}</h2><span class="chip acc">${known}/${total} ${H.t("known")}</span></div>
    <div class="progress" role="progressbar" aria-valuenow="${known}" aria-valuemin="0" aria-valuemax="${total}" aria-label="${H.t("progress")}"><i style="width:${Math.round(known / total * 100)}%"></i></div>
    ${speechNote()}<div class="seg">${modes.map(m => html`<button data-a="phMode" data-id="${m[0]}" aria-pressed="${PS.mode === m[0]}">${H.t(m[1])}</button>`)}</div>${body}
    <p class="xs muted">${H.C.phrases._note}</p></div>`;
}
H.actions.phMode = el => { PS.mode = el.dataset.id; PS.card = null; PS.flip = false; PS.quiz = null; H.render(true); };
H.actions.phSit = el => { PS.sit = el.dataset.id; H.render(true); };
H.actions.phFav = () => { PS.fav = !PS.fav; H.render(true); };
H.inputs.phQ = H.debounce(el => { PS.q = el.value; H.patch("#phList", listBody()); }, 100);

/* flashcards: unknown phrases first */
function pickCard(){
  const L = phrases().filter(p => p.lvl !== "emergency" || true), pool = L.filter(p => !H.db.learn.known[p.id]);
  const src = pool.length ? pool : L; return src[Math.floor(Math.random() * src.length)];
}
function cardsBody(){
  if (!PS.card) PS.card = pickCard();
  const p = PS.card;
  return html`<section class="card flash" aria-live="polite"><div class="eyebrow">${H.t("ph_card_q")}</div>
    ${PS.flip ? html`<div class="phrase-vi" lang="vi">${p.vi}</div><div class="mono small muted">${p.rom}</div>${H.sayBtn(p.vi)}` : html`<div style="font-size:1.3em">${H.loc(p.tr)}</div>`}
    <div class="row wrap">${PS.flip ? html`<button class="btn primary grow" data-a="cardKnow">${ic("check")} ${H.t("i_know_it")}</button><button class="btn grow" data-a="cardAgain">${H.t("again")}</button>` : html`<button class="btn primary block" data-a="cardFlip">${H.t("show_answer")}</button>`}</div></section>`;
}
H.actions.cardFlip = () => { PS.flip = true; H.render(true); };
function nextCard(){ PS.card = pickCard(); PS.flip = false; H.render(true); }
H.actions.cardKnow = () => { H.db.learn.known[PS.card.id] = Date.now(); touchStreak(); H.save(); nextCard(); };
H.actions.cardAgain = () => nextCard();
function touchStreak(){ const L = H.db.learn, t = H.ymd(new Date()); if (L.day === t) return; const y = new Date(); y.setDate(y.getDate() - 1); L.n = L.day === H.ymd(y) ? (L.n || 0) + 1 : 1; L.day = t; }

/* quiz: pick the Vietnamese for a translation */
function newQuiz(){
  const L = phrases(), p = L[Math.floor(Math.random() * L.length)], opts = [p];
  while (opts.length < 4) { const o = L[Math.floor(Math.random() * L.length)]; if (!opts.includes(o)) opts.push(o); }
  opts.sort(() => Math.random() - .5); return {p, opts, done:null, score:PS.quiz ? PS.quiz.score : 0, n:PS.quiz ? PS.quiz.n : 0};
}
function quizBody(){
  if (!PS.quiz) PS.quiz = newQuiz(); const q = PS.quiz;
  return html`<section class="card"><div class="row between"><div class="eyebrow">${H.t("ph_quiz_q")}</div><span class="chip">${q.score}/${q.n}</span></div><div style="font-size:1.3em">${H.loc(q.p.tr)}</div>
    <div class="stack-s">${q.opts.map(o => html`<button class="opt ${q.done ? (o === q.p ? "right" : q.done === o ? "wrong" : "") : ""}" data-a="quizPick" data-id="${o.id}" ${q.done ? "disabled" : ""} lang="vi"><b>${o.vi}</b></button>`)}</div>
    ${q.done ? html`<div class="alert ${q.done === q.p ? "ok" : "warn"}"><div class="grow">${q.done === q.p ? H.t("correct") : H.t("incorrect")} <span class="mono small">${q.p.rom}</span></div>${H.sayBtn(q.p.vi)}</div><button class="btn primary block" data-a="quizNext">${H.t("next")}</button>` : ""}</section>`;
}
H.actions.quizPick = el => { const q = PS.quiz; if (!q || q.done) return; q.done = q.opts.find(o => o.id === el.dataset.id); q.n++; if (q.done === q.p) { q.score++; H.db.learn.known[q.p.id] = H.db.learn.known[q.p.id] || Date.now(); touchStreak(); H.save(); } H.render(true); };
H.actions.quizNext = () => { PS.quiz = newQuiz(); H.render(true); };

/* ---------- forms of address ---------- */
const ADDR = [
  {k:"addr_lecturer", me:"em", you:"thầy (male) / cô (female)", ex:"Em chào thầy ạ.", lay:"formal"},
  {k:"addr_senior", me:"em", you:"anh (male) / chị (female)", ex:"Em chào anh/chị ạ.", lay:"school"},
  {k:"addr_peer", me:"mình / tớ / tôi", you:"bạn", ex:"Chào bạn, mình là …", lay:"peers"},
  {k:"addr_staff", me:"em", you:"cô / chú / anh / chị", ex:"Em chào cô ạ, em muốn hỏi …", lay:"formal"},
  {k:"addr_shop", me:"em / mình", you:"anh / chị / cô / chú", ex:"Cho em cái này ạ.", lay:"service"},
  {k:"addr_stranger", me:"tôi / mình", you:"anh / chị / bác / cô / chú (by apparent age)", ex:"Xin lỗi anh/chị, …", lay:"service"}
];
function renderAddress(){
  return html`<div class="page gut"><h2>${H.t("sub_address")}</h2><p class="small muted">${H.t("addr_intro")}</p>
    ${["formal", "school", "peers", "service"].map(l => html`<section class="card"><h3>${H.t("addr_layer_" + l)}</h3><p class="small muted">${H.t("addr_layer_" + l + "_d")}</p>
      ${ADDR.filter(a => a.lay === l).map(a => html`<div class="li"><div class="grow stack-s"><b>${H.t(a.k)}</b><div class="small">${H.t("addr_i_say")}: <b lang="vi">${a.me}</b> · ${H.t("addr_you_say")}: <b lang="vi">${a.you}</b></div><div class="phrase-vi" lang="vi">${a.ex}</div></div>${H.sayBtn(a.ex)}</div>`)}</section>`)}
    ${H.alert("", H.t("addr_note"))}</div>`;
}

/* ---------- campus life: official channels only ---------- */
function renderActivities(){
  const A = H.C.activities;
  return html`<div class="page gut"><h2>${H.t("sub_activities")}</h2>${H.alert("warn", H.t("act_note"))}
    <section class="card"><h3>${H.t("act_channels")}</h3><div class="list">${A.channels.map(c => html`<div class="li"><div class="grow stack-s"><b>${c.t}</b><span class="small muted">${c.d}</span>${H.source(c.meta)}</div>${H.link(c.url, H.t("open"))}</div>`)}</div></section>
    ${A.categories ? html`<section class="card"><h3>${H.t("act_cats")}</h3><div class="row wrap" style="gap:6px">${A.categories.map(c => html`<span class="chip">${typeof c === "string" ? c : H.loc(c.t || c)}</span>`)}</div><p class="xs muted">${H.t("act_cats_note")}</p></section>` : ""}</div>`;
}

H.views.life = {render(sub){
  return html`<div class="gut" style="padding-top:12px">${H.subTabs("life")}</div>${sub === "guide" ? renderGuide() : sub === "vi" ? renderPhrases() : sub === "address" ? renderAddress() : renderActivities()}`;
}};
})(window);
