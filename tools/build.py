#!/usr/bin/env python3
"""Builds dist/hust-guide-single.html (one file, everything inlined) from the multi-file source."""
import json, re, pathlib, base64
R = pathlib.Path(__file__).resolve().parent.parent
idx = (R / "index.html").read_text(encoding="utf8")
css = (R / "css/app.css").read_text(encoding="utf8")
data = {n: json.load(open(R / f"data/{n}.json", encoding="utf8")) for n in ["campus","offices","checklist","handbook","phrases","lifeguide","notices","tips","assess","faq","activities","tkb20261"]}
inline = "window.H=window.H||{};H.inline=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + ";"
xlsx = (R / "js/vendor-xlsx.mini.min.js").read_text(encoding="utf8").replace("</script", "<\\/script")
icon = "data:image/png;base64," + base64.b64encode((R / "icons/icon-192.png").read_bytes()).decode()
def js(m):
    src = m.group(1)
    if src.endswith("app.js") or "/" not in src: pass
    t = (R / src).read_text(encoding="utf8").replace("</script", "<\\/script")
    return "<script>" + t + "</script>"
out = re.sub(r'<link rel="stylesheet" href="css/app.css">', lambda m: "<style>" + css + "</style>", idx)
out = re.sub(r'<link rel="manifest"[^>]*>\n?', "", out)
out = re.sub(r'<link rel="(?:icon|apple-touch-icon)"[^>]*>\n?', "", out)
out = out.replace("</title>", "</title>\n<link rel=\"icon\" href=\"" + icon + "\">")
# core.js first, then the inline data, then the rest
parts = re.findall(r'<script src="(js/[^"]+)"></script>', out)
body = ""
for i, p in enumerate(parts):
    body += js(re.match(r'(.*)', p))  # placeholder, replaced below
    if p == "js/core.js": body += "<script>" + inline + "</script><script>" + xlsx + "</script>"
out = re.sub(r'(<script src="js/[^"]+"></script>\n?)+', lambda m: body + "\n", out, count=1)
out = re.sub(r'<script src="js/[^"]+"></script>\n?', "", out)
(R / "dist").mkdir(exist_ok=True)
(R / "dist/hust-guide-single.html").write_text(out, encoding="utf8")
print("single file:", round(len(out.encode("utf8")) / 1e6, 2), "MB")
