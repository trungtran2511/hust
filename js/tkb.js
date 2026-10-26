/* Timetable engine: parsing, indexing, search, class groups, clash detection, import, export.
   No DOM access, so it runs under Node for tests (tests/tkb.test.js). */
(function(root){
"use strict";
const T = {};
const fold = T.fold = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
const mins = T.mins = s => (+String(s).slice(0, -2)) * 60 + (+String(s).slice(-2));
const hhmm = T.hhmm = s => { s = String(s).padStart(4, "0"); return s.slice(0, 2) + ":" + s.slice(2); };
T.DAYS = {2:"Mon", 3:"Tue", 4:"Wed", 5:"Thu", 6:"Fri", 7:"Sat", 8:"Sun"};

/* "2-9,11-18" -> [2..9, 11..18]; bad tokens are reported, never thrown */
T.parseWeeks = function(w){
  const out = new Set(), bad = [];
  String(w == null ? "" : w).split(",").forEach(p => {
    p = p.trim(); if (!p) return;
    const m = /^(\d{1,2})(?:\s*-\s*(\d{1,2}))?$/.exec(p);
    if (!m) { bad.push(p); return; }
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (b < a || a < 1 || b > 60) { bad.push(p); return; }
    for (let i = a; i <= b; i++) out.add(i);
  });
  return {weeks:[...out].sort((x, y) => x - y), bad};
};
T.compressWeeks = function(ws){
  const a = [...ws].sort((x, y) => x - y), out = []; let i = 0;
  while (i < a.length) { let j = i; while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++; out.push(j > i ? a[i] + "-" + a[j] : String(a[i])); i = j + 1; }
  return out.join(",");
};
T.credits = k => { const m = /^(\d+(?:\.\d+)?)\s*\(/.exec(String(k || "")) || /^(\d+(?:\.\d+)?)/.exec(String(k || "")); return m ? +m[1] : 0; };

/* ---------- data model ----------
   raw: {term, updated, title, courses:{code:[vi,en,kl,school]}, classes:[[id,kem,code,note,type,status,reg,max,tt,ql,closed,[[day,start,end,weeks,room],...]]]} */
T.build = function(raw){
  const D = {raw, byId:{}, kids:{}, courses:[], byCode:{}, byCourseCode:{}, term:raw.term, updated:raw.updated, rooms:{}, schools:[]};
  const bycode = {};
  raw.classes.forEach(a => {
    const c = {id:String(a[0]), kem:String(a[1] || a[0]), code:a[2], note:a[3], type:a[4], status:a[5], reg:a[6], max:a[7], tt:a[8], ql:a[9], closed:!!a[10],
      ses:(a[11] || []).map(s => { const pw = T.parseWeeks(s[3]); return {d:+s[0], s:String(s[1]).padStart(4, "0"), e:String(s[2]).padStart(4, "0"), w:s[3], ws:new Set(pw.weeks), room:s[4] || "", badWeeks:pw.bad}; })};
    c.ses.forEach(s => { s.bad = mins(s.s) >= mins(s.e); });   // end before start in the source file: kept for display, ignored for clashes
    D.byId[c.id] = c; (bycode[c.code] = bycode[c.code] || []).push(c.id);
    c.ses.forEach(s => { if (s.room) D.rooms[s.room] = (D.rooms[s.room] || 0) + 1; });
  });
  Object.values(D.byId).forEach(c => { if (c.kem !== c.id && D.byId[c.kem]) (D.kids[c.kem] = D.kids[c.kem] || []).push(c.id); });
  const sch = new Set();
  D.courses = Object.keys(raw.courses).map(code => {
    const x = raw.courses[code]; sch.add(x[3]);
    const ids = bycode[code] || [];
    const cr = {code, vi:x[0], en:x[1], kl:x[2], cr:T.credits(x[2]), school:x[3], ids, key:fold(code + " " + x[0] + " " + x[1]), codeF:fold(code), enF:fold(x[1]), viF:fold(x[0])};
    D.byCourseCode[code] = cr; return cr;
  });
  D.schools = [...sch].sort();
  D.courses.sort((a, b) => a.code.localeCompare(b.code));
  return D;
};

/* ---------- search: tokens are ANDed; ranking favours code prefix, then name prefix ---------- */
T.search = function(D, q, f){
  f = f || {}; q = fold(q).trim();
  const toks = q.split(/\s+/).filter(Boolean);
  let list = D.courses;
  if (/^\d{5,7}$/.test(q) && D.byId[q]) { const c = D.byCourseCode[D.byId[q].code]; list = c ? [c] : []; }
  else if (toks.length) list = list.filter(c => toks.every(t => c.key.includes(t)));
  else if (!f.school && !f.type && !f.fmt && !f.cr) return [];
  if (f.school) list = list.filter(c => c.school === f.school);
  if (f.cr) list = list.filter(c => c.cr === +f.cr);
  const vis = c => visibleIds(D, c, f);
  list = list.filter(c => vis(c).length);
  if (f.type) list = list.filter(c => vis(c).some(id => D.byId[id].type === f.type));
  if (f.fmt) list = list.filter(c => vis(c).some(id => (D.byId[id].tt || "") === f.fmt));
  const score = c => (c.codeF === q ? 0 : c.codeF.startsWith(q) ? 1 : c.enF.startsWith(q) || c.viF.startsWith(q) ? 2 : c.codeF.includes(q) ? 3 : 4);
  if (q) list = list.map(c => [score(c), c]).sort((a, b) => a[0] - b[0] || a[1].code.localeCompare(b[1].code)).map(x => x[1]);
  return list;
};
function visibleIds(D, c, f){
  return c.ids.filter(id => { const x = D.byId[id]; if (f.hideClosed !== false && (x.status === "Huỷ lớp" || x.closed)) return false; return true; });
}
T.visibleIds = visibleIds;

/* ---------- class groups ----------
   A class whose "Mã_lớp_kèm" points to another class is a companion (tutorial/lab group) of that lecture.
   Adding a companion also adds its lecture. A lecture with companions needs one companion group chosen. */
T.family = c => c.type === "LT" || c.type === "LT+BT" ? "lec" : c.type;
T.planAdd = function(D, sel, id){
  const c = D.byId[id]; if (!c) return {sel:sel.slice(), added:[], replaced:[]};
  const add = [id]; if (c.kem !== id && D.byId[c.kem]) add.push(c.kem);
  // one class per course and type: choosing another group replaces the previous one (also for the lecture that comes with it)
  let out = sel.filter(x => { const o = D.byId[x]; return !(o && o.code === c.code && add.some(a => T.family(D.byId[a]) === T.family(o)) && !add.includes(x)); });
  // a lecture that was replaced takes its companion groups with it
  const live = out.concat(add);
  out = out.filter(x => { const o = D.byId[x]; return !(o && o.kem !== o.id && D.byId[o.kem] && !live.includes(o.kem)); });
  out = [...new Set([...out, ...add])];
  return {sel:out, added:add, replaced:sel.filter(x => !out.includes(x))};
};
T.planRemove = function(D, sel, id){
  const c = D.byId[id]; let drop = [id];
  if (c && c.kem === id) drop = drop.concat(D.kids[id] || []);
  return sel.filter(x => !drop.includes(x));
};
/* groups still missing a companion pick */
T.incomplete = function(D, sel){
  const out = [];
  sel.forEach(id => { const c = D.byId[id]; if (c && c.kem === id && (D.kids[id] || []).length && !(D.kids[id] || []).some(k => sel.includes(k))) out.push(id); });
  return out;
};

/* ---------- clash detection: day + time overlap + at least one shared week ---------- */
T.sesOverlap = function(a, b){
  if (a.d !== b.d) return null;
  const lo = Math.max(mins(a.s), mins(b.s)), hi = Math.min(mins(a.e), mins(b.e));
  if (lo >= hi) return null;                       // touching edges (09:10 / 09:10) are not a clash
  let shared = [], uncertain = false;
  if (!a.ws.size || !b.ws.size) uncertain = true;  // weeks unknown: cannot prove they never meet
  else a.ws.forEach(w => { if (b.ws.has(w)) shared.push(w); });
  if (!uncertain && !shared.length) return null;   // same slot but different weeks: no clash
  return {day:a.d, from:lo, to:hi, weeks:shared.sort((x, y) => x - y), uncertain};
};
T.clashes = function(D, ids){
  const out = [], L = ids.map(i => D.byId[i]).filter(Boolean);
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const hits = [];
    L[i].ses.forEach(a => L[j].ses.forEach(b => { if (a.bad || b.bad) return; const o = T.sesOverlap(a, b); if (o) hits.push(o); }));
    if (hits.length) out.push({a:L[i].id, b:L[j].id, hits});
  }
  return out;
};
T.clashMap = function(list){ const m = {}; list.forEach(c => { (m[c.a] = m[c.a] || []).push(c.b); (m[c.b] = m[c.b] || []).push(c.a); }); return m; };
T.describeHit = h => T.DAYS[h.day] + " " + hhmm(String(Math.floor(h.from / 60)).padStart(2, "0") + String(h.from % 60).padStart(2, "0")) + "–" + hhmm(String(Math.floor(h.to / 60)).padStart(2, "0") + String(h.to % 60).padStart(2, "0")) + (h.uncertain ? " (weeks unknown)" : " · weeks " + T.compressWeeks(h.weeks));

/* sessions of the selected classes in one week (week 0 = all weeks) */
T.sessionsFor = function(D, ids, week){
  const items = [];
  ids.forEach(id => { const c = D.byId[id]; if (!c) return; c.ses.forEach(s => { if (s.bad) return; if (!week || !s.ws.size || s.ws.has(week)) items.push({c, s}); }); });
  return items.sort((a, b) => a.s.d - b.s.d || mins(a.s.s) - mins(b.s.s));
};
T.weekOf = function(startYmd, date){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startYmd || ""); if (!m) return null;
  const s = new Date(+m[1], +m[2] - 1, +m[3]); const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(Math.round((d - s) / 86400000) / 7) + 1;
};
/* Monday of week 1 => date of (week, day[2=Mon..8=Sun]) */
T.dateOf = function(startYmd, week, day){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startYmd); const s = new Date(+m[1], +m[2] - 1, +m[3]);
  const dow = (s.getDay() + 6) % 7; s.setDate(s.getDate() - dow);          // snap to Monday
  s.setDate(s.getDate() + (week - 1) * 7 + (day - 2)); return s;
};

/* ---------- export ---------- */
const pad = n => String(n).padStart(2, "0");
const icsEsc = s => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
T.toICS = function(D, ids, startYmd, name){
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startYmd || "")) throw new Error("no-start");
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HUST International Survival Guide//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:" + icsEsc(name || "HUST timetable")];
  let n = 0, skipped = 0;
  ids.forEach(id => { const c = D.byId[id]; if (!c) return; const co = D.raw.courses[c.code] || [];
    c.ses.forEach((s, si) => {
      if (s.bad || !s.ws.size) { skipped++; return; }
      s.ws.forEach(w => {
        const d = T.dateOf(startYmd, w, s.d), ds = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
        L.push("BEGIN:VEVENT", "UID:" + id + "-" + si + "-w" + w + "@hust-survival-guide", "DTSTAMP:" + new Date().toISOString().replace(/[-:]|\.\d+/g, ""),
          "DTSTART:" + ds + "T" + s.s + "00", "DTEND:" + ds + "T" + s.e + "00",
          "SUMMARY:" + icsEsc((co[1] || co[0] || c.code) + " (" + c.code + ")"), "LOCATION:" + icsEsc(s.room), "DESCRIPTION:" + icsEsc("Class " + id + " · " + c.type + " · week " + w + " · planned timetable, not an official record"), "END:VEVENT"); n++;
      });
    });
  });
  L.push("END:VCALENDAR"); return {text:L.join("\r\n") + "\r\n", events:n, skipped};
};

/* ---------- import from the HUST TKB spreadsheet ---------- */
const REQUIRED = ["Mã_lớp", "Mã_HP", "Tên_HP", "Thứ", "Thời_gian", "Tuần", "Phòng"];
T.rowsToRaw = function(rows){
  const norm = v => String(v == null ? "" : v).normalize("NFC").trim().replace(/\s+/g, "_");
  const hi = rows.findIndex(r => r && r.some(c => norm(c) === "Mã_lớp"));
  if (hi < 0) return {error:"no-header", missing:REQUIRED};
  const ix = {}; rows[hi].forEach((h, i) => { ix[norm(h)] = i; });
  const missing = REQUIRED.filter(k => !(k in ix)); if (missing.length) return {error:"missing-columns", missing};
  const g = (r, k) => { const i = ix[k]; if (i == null || r[i] == null) return ""; const s = String(r[i]).trim(); return s === "NULL" ? "" : s; };
  const title = String((rows.slice(0, hi).find(r => r && r[0]) || [""])[0] || "");
  const courses = {}, classes = {}, order = []; let term = "", bad = 0, skippedRows = 0, badTime = 0;
  rows.slice(hi + 1).forEach(r => {
    if (!r || !r.some(c => c != null && c !== "")) return;
    const cid = g(r, "Mã_lớp"), code = g(r, "Mã_HP");
    if (!cid || !code) { skippedRows++; return; }
    term = term || g(r, "Kỳ");
    if (!courses[code]) courses[code] = [g(r, "Tên_HP"), g(r, "Tên_HP_Tiếng_Anh") || g(r, "Tên_HP"), g(r, "Khối_lượng"), g(r, "Trường_Viện_Khoa")];
    if (!classes[cid]) { const reg = g(r, "SLĐK"), mx = g(r, "SL_Max");
      classes[cid] = [cid, g(r, "Mã_lớp_kèm") || cid, code, g(r, "Ghi_chú"), g(r, "Loại_lớp"), g(r, "Trạng_thái"), /^\d+$/.test(reg) ? +reg : null, /^\d+$/.test(mx) ? +mx : null, g(r, "TeachingType"), g(r, "Mã_QL"), g(r, "Chú_ý") ? 1 : 0, []]; order.push(cid); }
    const tm = /^(\d{3,4})-(\d{3,4})$/.exec(g(r, "Thời_gian")), thu = g(r, "Thứ");
    if (tm && /^[2-8]$/.test(thu)) {
      const s = [+thu, tm[1].padStart(4, "0"), tm[2].padStart(4, "0"), g(r, "Tuần"), g(r, "Phòng")];
      if (mins(s[1]) >= mins(s[2])) { badTime++; return; }
      if (!classes[cid][11].some(x => x.join("|") === s.join("|"))) classes[cid][11].push(s);
    } else if (g(r, "Thời_gian") || thu) badTime++;
  });
  if (!order.length) return {error:"empty"};
  const up = /(\d{1,2}\.\d{1,2}\.\d{4})/.exec(title);
  return {raw:{term, updated:up ? up[1] : "", title, courses, classes:order.map(c => classes[c])}, stats:{classes:order.length, courses:Object.keys(courses).length, skippedRows, badTime}};
};
/* signature of a class schedule, to tell the user when a new file changes what they saved */
T.sig = c => c ? c.ses.map(s => [s.d, s.s, s.e, s.w, s.room].join("|")).sort().join(";") : "";
T.diffSaved = function(D, ids, snap){
  const missing = [], changed = [];
  ids.forEach(id => { const c = D.byId[id]; if (!c) missing.push(id); else if (snap && snap[id] != null && snap[id] !== T.sig(c)) changed.push(id); });
  return {missing, changed};
};

/* room code decoder: "<building>-<floor><2-digit room>" e.g. D3-201 -> D3, floor 2, room 01 */
T.decodeRoom = function(code){
  const s = String(code || "").trim().toUpperCase().replace(/\s+/g, "");
  const m = /^([A-Z]{1,3}\d{0,2}[A-Z]?)-(\d{1,2})(\d{2})([A-Z]?)$/.exec(s);
  if (!m) return null;
  return {code:s, building:m[1], floor:+m[2], room:m[3] + m[4], roomNo:m[2] + m[3] + m[4]};
};

if (typeof module !== "undefined" && module.exports) module.exports = T;
if (root.H) root.H.tkb = T; else root.TKB = T;
})(typeof window !== "undefined" ? window : globalThis);
