// extract_site.js — 从 themodernsoftware.dev 的 Next.js bundle 中提取课程结构化数据
// 用法: & "$env:COGSEED_NODE" "<this file>"
// 输出: sources/site_bundle.js (原始 bundle 归档), sources/site_data.json (结构化数据归档)
const fs = require('fs');
const path = require('path');

const BASE = 'https://themodernsoftware.dev';
const OUT = 'C:\\.cogseed\\userWorkSpace\\我的挑战有哪些\\C1\\sources';
const CHUNKS = [
  '0_au5jyjui1qq.js', '03~yq9q893hmn.js', '0g9qkcnu6zh5f.js', '0kx4ix8zt8kwy.js',
  '0mdn59ib7rsjj.js', '12mz0_._155bq.js', '14xdthwga5u9i.js', '173qvra~fczs6.js',
  'turbopack-0f0.39yiczl4t.js',
];

function matchLiteral(src, startIdx) {
  // startIdx points at '[' or '{'; find the matching close bracket, string-aware
  let depth = 0, i = startIdx, q = null, esc = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === q) q = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
    if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') { depth--; if (depth === 0) return src.slice(startIdx, i + 1); }
  }
  return null;
}

(async () => {
  let bundle = '';
  for (const c of CHUNKS) {
    try {
      const r = await fetch(`${BASE}/_next/static/chunks/${c}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const t = await r.text();
      const hit = t.includes('Week 1: Introduction to Coding LLMs');
      console.log(`chunk ${c} len=${t.length} syllabus=${hit}`);
      if (hit) bundle = t;
    } catch (e) { console.log(`chunk ${c} ERR ${e.message}`); }
  }
  if (!bundle) { console.log('SYLLABUS_CHUNK_NOT_FOUND'); process.exit(1); }
  fs.writeFileSync(path.join(OUT, 'site_bundle.js'), bundle);

  // 提取所有短的 minified 标识符 = [ ... ] / { ... } 字面量
  const out = {};
  const re = /(?:^|[,;({])\s*([A-Za-z_$][A-Za-z0-9_$]{0,2})\s*=\s*([\[{])/g;
  let m, count = 0;
  while ((m = re.exec(bundle)) !== null) {
    const name = m[1], lit = matchLiteral(bundle, m.index + m[0].length - 1);
    if (!lit || lit.length < 4) continue;
    try {
      const val = new Function('return (' + lit + ')')();
      if (val && typeof val === 'object' && JSON.stringify(val).length > 60) {
        out[name] = val;
        count++;
      }
    } catch (e) { /* 忽略非纯数据字面量 */ }
  }
  fs.writeFileSync(path.join(OUT, 'site_data.json'), JSON.stringify(out, null, 2));
  console.log(`extracted ${count} data literals -> site_data.json`);

  // 摘要：哪些标识符含周次/作业/FAQ/评分
  for (const [k, v] of Object.entries(out)) {
    const s = JSON.stringify(v);
    const tags = [];
    if (/Week \d/.test(s)) tags.push('WEEKS');
    if (/[Dd]eadline|due\b/.test(s)) tags.push('DEADLINE');
    if (/grade|Grade|%/.test(s)) tags.push('GRADING');
    if (/[Ff][Aa][Qq]/.test(s)) tags.push('FAQ');
    if (/[Aa]ssignment/.test(s)) tags.push('ASSIGN');
    if (tags.length) console.log(`  ${k}: len=${s.length} [${tags.join(',')}] items=${Array.isArray(v) ? v.length : 'obj'}`);
  }
})();
