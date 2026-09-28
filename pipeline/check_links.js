// 全量链接校验：从交付物中抽取所有 http(s) URL，逐个请求并记录状态。
// 用法: node check_links.js <输出json路径>
const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\.cogseed\\userWorkSpace\\我的挑战有哪些\\C1';
const FILES = [
  'README.md',
  '拿来说明.md',
  '覆盖率报告.md',
  'sources/course_source_en.md',
  'translations/01_课程总览_zh.md',
  'translations/02_课程大纲_Fall2025_zh.md',
  'translations/03_课程大纲_Fall2026_zh.md',
  'translations/04_评分标准_zh.md',
  'translations/05_FAQ_zh.md',
];

const urlRe = /https?:\/\/[^\s<>"'`)\]}，。、）】]+/g;

const found = new Map(); // url -> Set(files)
for (const rel of FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  const text = fs.readFileSync(abs, 'utf8');
  for (const m of text.match(urlRe) || []) {
    const clean = m.replace(/[.,;:]+$/, '').replace(/\/$/, '');
    if (!found.has(clean)) found.set(clean, new Set());
    found.get(clean).add(rel);
  }
}

const urls = [...found.keys()].sort();

async function probe(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal });
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0' } });
    }
    clearTimeout(t);
    return { url, status: res.status, ok: res.status >= 200 && res.status < 400, final: res.url };
  } catch (e) {
    clearTimeout(t);
    // 有些站点拒绝自动请求，标记为无法自动判定而不是失效
    return { url, status: null, ok: null, error: String(e && e.name === 'AbortError' ? 'timeout' : e.message).slice(0, 120) };
  }
}

(async () => {
  const results = [];
  const batch = 6;
  for (let i = 0; i < urls.length; i += batch) {
    const slice = urls.slice(i, i + batch);
    results.push(...await Promise.all(slice.map(probe)));
  }
  const ok = results.filter(r => r.ok === true).length;
  const bad = results.filter(r => r.ok === false).length;
  const unknown = results.filter(r => r.ok === null).length;
  const out = {
    total: urls.length,
    ok, bad, unknown,
    results: results.map(r => ({ ...r, inFiles: [...found.get(r.url)] })),
  };
  const outPath = process.argv[2];
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify({ total: out.total, ok, bad, unknown }, null, 2));
  console.log('--- 非 2xx/3xx ---');
  for (const r of out.results.filter(r => r.ok !== true)) {
    console.log(`${r.status === null ? r.error : r.status}  ${r.url}`);
  }
})();
