// extracts static i18n keys used in js/*.js
const fs=require("fs"),path=require("path");const dir=path.join(__dirname,"../js");const keys=new Set();
for(const f of fs.readdirSync(dir)){if(!f.endsWith(".js")||f.startsWith("vendor")||f.startsWith("i18n"))continue;const s=fs.readFileSync(path.join(dir,f),"utf8");
 for(const m of s.matchAll(/H\.(?:t|tb|tx)\(\s*"([a-z0-9_]+)"/g))keys.add(m[1]);
 for(const m of s.matchAll(/(?:key|k|label|goLabel):\s*"([a-z0-9_]+)"/g))keys.add(m[1]);}
module.exports=[...keys].filter(k=>!k.endsWith("_")).sort();if(require.main===module)console.log(module.exports.join("\n"));
