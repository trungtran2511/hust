/* Data loading. Content lives in data/*.json (editable without touching code).
   The timetable file loads on demand; a user-imported timetable is kept in IndexedDB. */
(function(root){
"use strict";
const H = root.H;
H.inline = H.inline || {};
const cache = {};
H.loadJSON = function(name){
  if (cache[name]) return cache[name];
  cache[name] = H.inline[name] ? Promise.resolve(H.inline[name]) : fetch("data/" + name + ".json", {cache:"no-cache"}).then(r => { if (!r.ok) throw new Error(name + " " + r.status); return r.json(); });
  cache[name].catch(() => { delete cache[name]; });
  return cache[name];
};
H.C = {}; // loaded content
const CONTENT = ["campus", "offices", "checklist", "handbook", "phrases", "lifeguide", "notices", "tips", "assess", "faq", "activities"];
H.loadContent = function(){
  return Promise.all(CONTENT.map(n => H.loadJSON(n).then(d => { H.C[n] = d; }))).then(() => { indexContent(); });
};
function indexContent(){
  H.C.office = {}; H.C.offices.offices.forEach(o => { H.C.office[o.id] = o; });
  H.C.bld = {}; H.C.campus.buildings.forEach(b => { H.C.bld[b.id] = b; }); H.C.campus.gates.forEach(g => { H.C.bld[g.id] = g; });
  H.C.phrase = {}; H.C.phrases.phrases.forEach(p => { H.C.phrase[p.id] = p; });
  H.C.task = {}; H.C.checklist.tasks.forEach(t => { H.C.task[t.id] = t; });
}

/* ---------- IndexedDB for the imported timetable (too big for localStorage) ---------- */
function idb(){ return new Promise((res, rej) => { try { const r = indexedDB.open("hsg2", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); }
H.idbGet = k => idb().then(db => new Promise((res, rej) => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
H.idbSet = (k, v) => idb().then(db => new Promise((res, rej) => { const tx = db.transaction("kv", "readwrite"); tx.objectStore("kv").put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }));
H.idbDel = k => idb().then(db => new Promise((res, rej) => { const tx = db.transaction("kv", "readwrite"); tx.objectStore("kv").delete(k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }));

/* ---------- timetable state ---------- */
H.tk = {D:null, loading:false, err:null, src:"", custom:false};
let tkPromise = null;
H.ensureTKB = function(){
  if (H.tk.D) return Promise.resolve(H.tk.D);
  if (tkPromise) return tkPromise;
  H.tk.loading = true;
  tkPromise = H.idbGet("tkbRaw").catch(() => null).then(saved => {
    if (saved && saved.raw) { H.tk.custom = true; H.tk.src = saved.name || "imported file"; return saved.raw; }
    return H.loadJSON("tkb20261").then(r => { H.tk.src = "TKB20261-FULL.xlsx"; H.tk.custom = false; return r; });
  }).then(raw => { H.tk.D = H.tkb.build(raw); H.tk.err = null; return H.tk.D; })
    .catch(e => { H.tk.err = "load"; tkPromise = null; return null; })
    .then(d => { H.tk.loading = false; if (H.onTKB) H.onTKB(); return d; });
  return tkPromise;
};
/* xlsx is parsed by the bundled SheetJS (js/vendor-xlsx.mini.min.js), loaded only when the user imports a file */
function loadScript(src){ return new Promise((res, rej) => { if (root.XLSX) return res(); const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("script")); document.head.appendChild(s); }); }
H.importXlsx = async function(file){
  if (!file) return {ok:false, code:"nofile"};
  if (!/\.(xlsx|xls)$/i.test(file.name)) return {ok:false, code:"type"};
  if (file.size > 25 * 1024 * 1024) return {ok:false, code:"big"};
  try { await loadScript("js/vendor-xlsx.mini.min.js"); } catch (e) { return {ok:false, code:"lib"}; }
  let rows;
  try { const wb = root.XLSX.read(await file.arrayBuffer(), {type:"array", dense:false}); rows = root.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, defval:null, raw:true}); }
  catch (e) { return {ok:false, code:"read"}; }
  const r = H.tkb.rowsToRaw(rows);
  if (r.error) return {ok:false, code:r.error, missing:r.missing};
  const old = H.tk.D, ids = H.db.tt.ids.slice();
  const D = H.tkb.build(r.raw);
  const diff = H.tkb.diffSaved(D, ids, H.db.tt.snap);
  H.tk.D = D; H.tk.src = file.name; H.tk.custom = true; tkPromise = Promise.resolve(D);
  H.db.tt.ids = ids.filter(id => D.byId[id]); H.db.tt.snap = snapOf(D, H.db.tt.ids); H.save();
  try { await H.idbSet("tkbRaw", {raw:r.raw, name:file.name, at:Date.now()}); } catch (e) { /* too large or blocked: works for this session only */ r.notPersisted = true; }
  return {ok:true, stats:r.stats, diff, term:r.raw.term, updated:r.raw.updated, notPersisted:!!r.notPersisted};
};
H.resetTKB = async function(){ try { await H.idbDel("tkbRaw"); } catch (e) {} H.tk.D = null; tkPromise = null; H.tk.custom = false; return H.ensureTKB(); };
function snapOf(D, ids){ const o = {}; ids.forEach(id => { o[id] = H.tkb.sig(D.byId[id]); }); return o; }
H.snapOf = snapOf;
H.roomBuilding = function(room){
  const d = H.tkb.decodeRoom(room); if (!d) { const a = H.C.campus.roomBuildingAlias || {}; const k = Object.keys(a).find(x => String(room).toUpperCase().startsWith(x.toUpperCase())); return k ? a[k] : null; }
  return H.C.bld[d.building] ? d.building : null;
};
})(window);
