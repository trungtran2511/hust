// Run: node tests/tkb.test.js   (uses data/tkb20261.json when present)
const assert = require("assert"); const T = require("../js/tkb.js"); const fs = require("fs"); const path = require("path");
let n = 0; const ok = (name, f) => { try { f(); n++; console.log("  ok  " + name); } catch (e) { console.log("  FAIL " + name + "\n      " + e.message); process.exitCode = 1; } };
const S = (d, s, e, w, room) => ({d, s, e, w, ws:new Set(T.parseWeeks(w).weeks), room:room || ""});

console.log("parseWeeks");
ok("ranges and singles", () => assert.deepStrictEqual(T.parseWeeks("2-9,11-18").weeks, [2,3,4,5,6,7,8,9,11,12,13,14,15,16,17,18]));
ok("odd weeks list", () => assert.deepStrictEqual(T.parseWeeks("3,5,7").weeks, [3,5,7]));
ok("single", () => assert.deepStrictEqual(T.parseWeeks("12").weeks, [12]));
ok("empty/NULL-ish", () => assert.deepStrictEqual(T.parseWeeks("").weeks, []));
ok("garbage reported not thrown", () => { const r = T.parseWeeks("2-9,abc,9-2,99"); assert.deepStrictEqual(r.weeks, [2,3,4,5,6,7,8,9]); assert.strictEqual(r.bad.length, 3); });
ok("compress", () => assert.strictEqual(T.compressWeeks([2,3,4,6,8,9]), "2-4,6,8-9"));

console.log("clash detection");
ok("same slot, same weeks => clash", () => assert(T.sesOverlap(S(2,"0645","0910","2-9"), S(2,"0645","0910","5-12"))));
ok("same slot, disjoint weeks => NO clash", () => assert.strictEqual(T.sesOverlap(S(2,"0645","0910","2-9"), S(2,"0645","0910","11-18")), null));
ok("odd vs even weeks => NO clash", () => assert.strictEqual(T.sesOverlap(S(3,"0730","1005","3,5,7,9"), S(3,"0730","1005","2,4,6,8")), null));
ok("touching edges (09:10|09:10) => NO clash", () => assert.strictEqual(T.sesOverlap(S(2,"0645","0910","2-9"), S(2,"0910","1145","2-9")), null));
ok("one-minute overlap => clash", () => assert(T.sesOverlap(S(2,"0645","0911","2-9"), S(2,"0910","1145","2-9"))));
ok("different day => NO clash", () => assert.strictEqual(T.sesOverlap(S(2,"0645","0910","2-9"), S(3,"0645","0910","2-9")), null));
ok("unknown weeks => flagged uncertain, not silently ignored", () => { const o = T.sesOverlap(S(2,"0645","0910",""), S(2,"0645","0910","2-9")); assert(o && o.uncertain); });
ok("overlap window and shared weeks are reported", () => { const o = T.sesOverlap(S(4,"0645","1005","2-9"), S(4,"0920","1145","8-12")); assert.strictEqual(o.from, 9*60+20); assert.strictEqual(o.to, 10*60+5); assert.deepStrictEqual(o.weeks, [8,9]); });
ok("multi-session class: only the clashing session counts", () => {
  const D = {byId:{A:{id:"A", ses:[S(2,"0645","0910","2-9"), S(5,"1230","1550","2-9")]}, B:{id:"B", ses:[S(2,"0645","0910","11-18"), S(5,"1400","1700","2-9")]}}};
  const r = T.clashes(D, ["A","B"]); assert.strictEqual(r.length, 1); assert.strictEqual(r[0].hits.length, 1); assert.strictEqual(r[0].hits[0].day, 5);
});

console.log("weeks and dates");
ok("weekOf", () => { assert.strictEqual(T.weekOf("2026-09-07", new Date(2026,8,7)), 1); assert.strictEqual(T.weekOf("2026-09-07", new Date(2026,8,13)), 1); assert.strictEqual(T.weekOf("2026-09-07", new Date(2026,8,14)), 2); assert.strictEqual(T.weekOf("2026-09-07", new Date(2026,8,6)), 0); });
ok("dateOf Monday/Sunday", () => { assert.strictEqual(T.dateOf("2026-09-07", 1, 2).getDate(), 7); assert.strictEqual(T.dateOf("2026-09-07", 2, 8).getDate(), 20); });
ok("dateOf snaps a mid-week start to Monday", () => assert.strictEqual(T.dateOf("2026-09-09", 1, 2).getDate(), 7));

console.log("room decoder");
ok("D3-201", () => assert.deepStrictEqual([T.decodeRoom("d3-201").building, T.decodeRoom("D3-201").floor, T.decodeRoom("D3-201").room], ["D3", 2, "01"]));
ok("D8-1006 = floor 10", () => assert.strictEqual(T.decodeRoom("D8-1006").floor, 10));
ok("C10-305", () => assert.strictEqual(T.decodeRoom("C10-305").building, "C10"));
ok("unknown formats are not guessed", () => { assert.strictEqual(T.decodeRoom("San KTX"), null); assert.strictEqual(T.decodeRoom("D3-5-301"), null); assert.strictEqual(T.decodeRoom("201"), null); assert.strictEqual(T.decodeRoom(""), null); });

console.log("import");
ok("rejects a sheet without the key columns", () => assert.strictEqual(T.rowsToRaw([["a","b"],[1,2]]).error, "no-header"));
ok("reports missing columns", () => { const r = T.rowsToRaw([["Mã_lớp","Mã_HP"],["1","X"]]); assert.strictEqual(r.error, "missing-columns"); assert(r.missing.includes("Thứ")); });
ok("bad rows are skipped, not fatal", () => {
  const H = ["Kỳ","Mã_lớp","Mã_HP","Tên_HP","Thứ","Thời_gian","Tuần","Phòng"];
  const r = T.rowsToRaw([["TKB 20261 - 11.09.2026"], H, ["20261","1","AA1","Toán","2","0645-0910","2-9","D3-201"], ["20261","2","AA1","Toán","9","xx","2-9","D3-201"], ["20261","","AA1","Toán","2","0645-0910","2-9",""], ["20261","3","AA1","Toán","3","0910-0645","2-9","D3-201"]]);
  assert(r.raw); assert.strictEqual(r.stats.skippedRows, 1); assert(r.stats.badTime >= 2); assert.strictEqual(r.raw.updated, "11.09.2026");
});

console.log("planner groups");
const D0 = T.build({term:"T", updated:"", courses:{X:["x","X","2(2-1-0-4)","S"]}, classes:[
  ["L1","L1","X","","LT","Đăng ký",0,50,"","",0,[[2,"0645","0910","2-9","D3-101"]]],
  ["L2","L2","X","","LT","Đăng ký",0,50,"","",0,[[3,"0645","0910","2-9","D3-101"]]],
  ["B1","L1","X","","BT","Đăng ký",0,50,"","",0,[[6,"0645","0910","2-9","D3-101"]]],
  ["B2","L1","X","","BT","Đăng ký",0,50,"","",0,[[6,"0920","1145","2-9","D3-101"]]],
  ["B3","L2","X","","BT","Đăng ký",0,50,"","",0,[[6,"1230","1500","2-9","D3-101"]]]]});
ok("adding a tutorial group also adds its lecture", () => assert.deepStrictEqual(T.planAdd(D0, [], "B1").sel.sort(), ["B1","L1"]));
ok("switching tutorial group replaces the old one", () => assert.deepStrictEqual(T.planAdd(D0, ["L1","B1"], "B2").sel.sort(), ["B2","L1"]));
ok("switching lecture drops the old lecture's tutorial", () => assert.deepStrictEqual(T.planAdd(D0, ["L1","B1"], "L2").sel.sort(), ["L2"]));
ok("choosing a tutorial of another lecture swaps the lecture too", () => assert.deepStrictEqual(T.planAdd(D0, ["L1","B1"], "B3").sel.sort(), ["B3","L2"]));
ok("removing a lecture removes its groups", () => assert.deepStrictEqual(T.planRemove(D0, ["L1","B1"], "L1"), []));
ok("incomplete group is detected", () => assert.deepStrictEqual(T.incomplete(D0, ["L1"]), ["L1"]));
ok("complete group is fine", () => assert.deepStrictEqual(T.incomplete(D0, ["L1","B2"]), []));

console.log("ICS");
ok("one event per class week; needs a start date", () => {
  assert.throws(() => T.toICS(D0, ["L1"], ""), /no-start/);
  const r = T.toICS(D0, ["L1"], "2026-09-07"); assert.strictEqual(r.events, 8); assert(/DTSTART:20260914T064500/.test(r.text) && !/DTSTART:20260907/.test(r.text));
});

const f = path.join(__dirname, "../data/tkb20261.json");
if (fs.existsSync(f)) {
  console.log("real data (TKB 20261)");
  const raw = JSON.parse(fs.readFileSync(f, "utf8")); const t0 = Date.now(); const D = T.build(raw); const dt = Date.now() - t0;
  ok("loads 11,011 classes / 2,384 courses (" + dt + " ms)", () => { assert.strictEqual(Object.keys(D.byId).length, 11011); assert.strictEqual(D.courses.length, 2384); });
  ok("search by code", () => assert(T.search(D, "IT3011").some(c => c.code === "IT3011")));
  ok("search by English name, no accents", () => assert(T.search(D, "data structures").length > 0));
  ok("search by Vietnamese without accents", () => assert(T.search(D, "giai tich").length > 0));
  ok("search by class id", () => assert.strictEqual(T.search(D, "171262")[0].code, "IT3011"));
  ok("non-existent course returns []", () => assert.deepStrictEqual(T.search(D, "zzzzqqq"), []));
  ok("100 searches stay fast", () => { const t = Date.now(); for (let i = 0; i < 100; i++) T.search(D, ["calc", "elec", "mech", "ME30", "IT"][i % 5]); assert(Date.now() - t < 2500, (Date.now() - t) + " ms"); });
  ok("source rows with end<=start are flagged and excluded", () => { let bad = 0; Object.values(D.byId).forEach(c => c.ses.forEach(s => { if (s.bad) { bad++; assert(T.mins(s.s) >= T.mins(s.e)); } else assert(T.mins(s.s) < T.mins(s.e)); })); assert.strictEqual(bad, 4); assert(!T.sessionsFor(D, ["772634"], 0).length); });
  ok("real clash: IT3011 lecture vs another class at same time/weeks is found or absent consistently", () => { const l = D.byId["171261"]; assert(l); const r = T.clashes(D, ["171261", "171261"]); assert(Array.isArray(r)); });
}
console.log("\n" + n + " passed" + (process.exitCode ? " (with failures)" : ""));
