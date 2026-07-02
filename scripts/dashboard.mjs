#!/usr/bin/env node
// Review dashboard — a zero-dependency local server (node:http only) that shows
// every drafted slug (media + platform variants) in one brand-themed page before
// you post by hand. atomizekit is draft-only + keyless, so this is a REVIEW surface,
// not a workflow gate. The one action is "mark posted" (flips posted: in the .md).
// Usage: node scripts/dashboard.mjs [--port 4600]   (run from your project root)
// ponytail: stdlib http + fs, no framework — a skill shouldn't ship a Next app.

import { createServer } from "node:http";
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadBrand } from "./lib_brand.mjs";

const brand = loadBrand();
const CWD = process.cwd();
const DIST = path.join(CWD, brand.distributionDir || "content/distribution");
const PORT = Number(process.argv[(process.argv.indexOf("--port")) + 1]) || 4600;
const PLATFORM_ORDER = brand.platforms || ["x", "reddit", "linkedin", "instagram", "youtube", "medium", "substack"];
const MEDIA = [
  ["feed", "Feed"], ["story", "Story"], ["thumb", "Thumb"], ["banner", "Banner"],
];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Strip an atomize header (terminated by a bare `---` line) + front matter + comments.
function cleanBody(body) {
  const m = body.search(/^---\s*$/m);
  let t = m >= 0 ? body.slice(body.indexOf("\n", m) + 1) : body;
  t = t.replace(/^---[\s\S]*?---\s*/m, "").replace(/<!--[\s\S]*?-->/g, "").trim();
  return t;
}
function frontMatter(body, key) {
  const block = body.match(/^([\s\S]*?)\n---\s*$/m); // atomize header up to the bare ---
  const src = block ? block[1] : body;
  const line = src.split("\n").find((l) => l.trim().startsWith(key + ":"));
  return line ? line.slice(line.indexOf(":") + 1).trim() : null;
}

function readSlugs() {
  if (!existsSync(DIST)) return [];
  return readdirSync(DIST)
    .filter((d) => statSync(path.join(DIST, d)).isDirectory())
    .map((slug) => {
      const dir = path.join(DIST, slug);
      const mediaDir = path.join(dir, "media");
      const hasMedia = (f) => existsSync(path.join(mediaDir, f));
      const post = existsSync(path.join(dir, "post.json"))
        ? JSON.parse(readFileSync(path.join(dir, "post.json"), "utf-8")) : {};
      const variants = PLATFORM_ORDER.map((p) => {
        const fp = path.join(dir, `${p}.md`);
        if (!existsSync(fp)) return { platform: p, exists: false };
        const body = readFileSync(fp, "utf-8");
        return { platform: p, exists: true, body: cleanBody(body), posted: frontMatter(body, "posted") === "true" };
      });
      return {
        slug, headline: post.headline || slug,
        media: {
          cards: MEDIA.filter(([f]) => hasMedia(`${f}.png`)).map(([f, l]) => [f, l]),
          reel: hasMedia("reel.mp4"), short: hasMedia("short.mp4"),
        },
        variants,
      };
    });
}

const PLATFORM_LABEL = { x: "X", reddit: "Reddit", linkedin: "LinkedIn", instagram: "Instagram", youtube: "YouTube", medium: "Medium", substack: "Substack" };

function page() {
  const c = brand.colors || {};
  const slugs = readSlugs();
  const cards = slugs.map((s, i) => {
    const thumbs = [
      ...s.media.cards.map(([f, l]) => `<a class="thumb" href="/media?slug=${encodeURIComponent(s.slug)}&file=${f}.png" target="_blank"><img src="/media?slug=${encodeURIComponent(s.slug)}&file=${f}.png" alt="${esc(s.slug)} ${l}"><span>${l}</span></a>`),
      s.media.reel ? `<a class="thumb" href="/media?slug=${encodeURIComponent(s.slug)}&file=reel.mp4" target="_blank"><video src="/media?slug=${encodeURIComponent(s.slug)}&file=reel.mp4" muted loop playsinline preload="metadata" onmouseenter="this.play()" onmouseleave="this.pause()"></video><span>Reel</span></a>` : "",
      s.media.short ? `<a class="thumb" href="/media?slug=${encodeURIComponent(s.slug)}&file=short.mp4" target="_blank"><video src="/media?slug=${encodeURIComponent(s.slug)}&file=short.mp4" muted loop playsinline preload="metadata" onmouseenter="this.play()" onmouseleave="this.pause()"></video><span>Short</span></a>` : "",
    ].join("");
    const rows = s.variants.map((v) => {
      if (!v.exists) return `<div class="variant missing"><span class="plat">${PLATFORM_LABEL[v.platform] || v.platform}</span><span class="ex">not written yet</span></div>`;
      const ex = v.body.length > 150 ? v.body.slice(0, 150) + "…" : v.body || "(empty)";
      return `<details class="variant"><summary><span class="plat">${PLATFORM_LABEL[v.platform] || v.platform}</span><span class="ex">${esc(ex)}</span><button class="posted${v.posted ? " on" : ""}" onclick="markPosted(event,'${esc(s.slug)}','${v.platform}',${!v.posted})">${v.posted ? "posted ✓" : "mark posted"}</button></summary><pre>${esc(v.body)}</pre></details>`;
    }).join("");
    return `<article class="card" style="--i:${i}"><div class="head"><div><h2>${esc(s.headline)}</h2><div class="path">${esc(brand.distributionDir)}/${esc(s.slug)}/</div></div><span class="badge">draft</span></div><div class="thumbs">${thumbs || '<div class="none">no media yet — run /visuals</div>'}</div><div class="variants">${rows}</div></article>`;
  }).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(brand.name || "atomizekit")} — review</title>
<style>
:root{--bg:${c.bg || "#0A0A0B"};--text:${c.text || "#FAFAFA"};--primary:${c.primary || "#2DD4BF"};--accent:${c.accent || "#34D399"};--dim:#83838c;--mid:#b9b9c1;--border:#232329;--raised:#121215;--font:${brand.fonts?.body || "Inter"},system-ui,sans-serif;--display:${brand.fonts?.display || "Geist"},system-ui,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font);-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;pointer-events:none;background:radial-gradient(900px 480px at 72% -10%,color-mix(in srgb,var(--primary) 8%,transparent),transparent 60%)}
.page{max-width:1080px;margin:0 auto;padding:56px 24px 100px;position:relative}
h1{font-family:var(--display);font-size:38px;letter-spacing:-.035em;margin:0 0 8px}h1 .d{color:var(--primary)}
.sub{color:var(--dim);margin:0 0 12px;font-size:14px}
.meta{border-top:1px solid var(--border);padding-top:12px;margin-bottom:40px;color:var(--dim);font-size:12px;font-variant-numeric:tabular-nums}
.meta b{color:var(--text)}
.card{border:1px solid var(--border);background:linear-gradient(180deg,var(--raised),var(--bg));border-radius:18px;padding:24px;margin-bottom:32px;animation:rise .5s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(var(--i)*80ms)}
@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.card{animation:none}}
.head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}
.head h2{font-family:var(--display);font-size:21px;letter-spacing:-.02em;margin:0 0 4px}
.path{font-family:ui-monospace,monospace;font-size:12px;color:var(--dim)}
.badge{font-family:ui-monospace,monospace;font-size:11px;text-transform:uppercase;letter-spacing:.08em;padding:5px 9px;border-radius:5px;background:color-mix(in srgb,var(--primary) 9%,transparent);color:var(--primary)}
.thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(116px,1fr));gap:10px;margin-bottom:20px}
.thumb{position:relative;border-radius:9px;overflow:hidden;background:var(--bg);aspect-ratio:4/5;display:block;transition:transform .2s}
.thumb:hover{transform:translateY(-2px) scale(1.015)}
.thumb img,.thumb video{width:100%;height:100%;object-fit:cover;display:block}
.thumb span{position:absolute;bottom:0;left:0;right:0;font:10px/1 ui-monospace,monospace;padding:4px 7px;background:linear-gradient(transparent,rgba(0,0,0,.85));color:var(--mid);text-transform:uppercase;letter-spacing:.06em}
.none{grid-column:1/-1;border:1px dashed var(--border);border-radius:9px;padding:24px;text-align:center;color:var(--dim);font:13px var(--font)}
.variants{border-top:1px solid var(--border)}
.variant{border-bottom:1px solid var(--border)}
.variant summary{display:grid;grid-template-columns:110px 1fr auto;gap:14px;align-items:center;padding:11px 2px;cursor:pointer;list-style:none}
.variant summary::-webkit-details-marker{display:none}
.variant.missing{opacity:.4;display:grid;grid-template-columns:110px 1fr;gap:14px;padding:11px 2px}
.plat{font:11px/1 ui-monospace,monospace;color:var(--primary);text-transform:uppercase;letter-spacing:.07em}
.ex{font-size:13px;color:var(--mid);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.posted{font:11px ui-monospace,monospace;padding:5px 10px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--dim);cursor:pointer}
.posted:hover{border-color:var(--mid);color:var(--text)}
.posted.on{border-color:var(--accent);color:var(--accent)}
.variant pre{white-space:pre-wrap;font:13px/1.6 var(--font);color:var(--mid);background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:14px;margin:4px 0 12px}
button:focus-visible,summary:focus-visible,a:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
.empty{border:1px dashed var(--border);border-radius:18px;padding:80px 24px;text-align:center;color:var(--dim);line-height:1.7}
.empty code{font-family:ui-monospace,monospace;color:var(--primary)}
@media(max-width:600px){.variant summary,.variant.missing{grid-template-columns:1fr;gap:4px}}
</style></head><body><main class="page">
<h1>${esc(brand.name || "atomizekit")}<span class="d">.</span></h1>
<p class="sub">Review every drafted piece before you post it. Draft-only — nothing ships from here.</p>
<div class="meta"><b>${slugs.length}</b> slug${slugs.length === 1 ? "" : "s"} &nbsp;·&nbsp; ${esc(brand.distributionDir)}/ &nbsp;·&nbsp; you post each one by hand</div>
${slugs.length ? cards : `<div class="empty">No slugs under <code>${esc(brand.distributionDir)}/</code>.<br>Run the skill's content flow to produce one.</div>`}
</main><script>
async function markPosted(e,slug,platform,posted){e.preventDefault();e.stopPropagation();
 const b=e.target;b.disabled=true;
 try{const r=await fetch("/posted",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug,platform,posted})});
 if(r.ok){b.textContent=posted?"posted ✓":"mark posted";b.classList.toggle("on",posted);b.setAttribute("onclick",\`markPosted(event,'\${slug}','\${platform}',\${!posted})\`);}else{b.textContent="error";}}
 catch(_){b.textContent="error";}finally{b.disabled=false;}}
</script></body></html>`;
}

const server = createServer((req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  if (u.pathname === "/") { res.setHeader("Content-Type", "text/html"); return res.end(page()); }

  if (u.pathname === "/media") {
    const slug = path.basename(u.searchParams.get("slug") || "");
    const file = path.basename(u.searchParams.get("file") || ""); // basename blocks traversal
    const fp = path.join(DIST, slug, "media", file);
    if (!fp.startsWith(DIST) || !existsSync(fp)) { res.statusCode = 404; return res.end("not found"); }
    const type = file.endsWith(".mp4") ? "video/mp4" : file.endsWith(".png") ? "image/png" : "application/octet-stream";
    res.setHeader("Content-Type", type);
    return res.end(readFileSync(fp));
  }

  if (u.pathname === "/posted" && req.method === "POST") {
    let raw = "";
    req.on("data", (d) => (raw += d));
    req.on("end", () => {
      try {
        const { slug, platform, posted } = JSON.parse(raw);
        const fp = path.join(DIST, path.basename(slug), `${path.basename(platform)}.md`);
        if (!fp.startsWith(DIST) || !existsSync(fp)) { res.statusCode = 404; return res.end('{"error":"not found"}'); }
        let body = readFileSync(fp, "utf-8");
        body = /^posted:\s*(true|false)\s*$/m.test(body)
          ? body.replace(/^posted:\s*(true|false)\s*$/m, `posted: ${posted}`)
          : body; // only flips an existing atomize `posted:` flag
        writeFileSync(fp, body);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, posted }));
      } catch (err) {
        res.statusCode = 400; res.end(JSON.stringify({ error: String(err.message) }));
      }
    });
    return;
  }
  res.statusCode = 404; res.end("not found");
});

server.listen(PORT, () => {
  console.log(`atomizekit review dashboard → http://localhost:${PORT}  (${brand.name}, ${brand.distributionDir}/)`);
});
