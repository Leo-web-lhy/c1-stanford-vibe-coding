// fetch_sources.js — 把 site_data.json 渲染成可读英文源快照，并抓取官方作业仓库
// 用法: & "$env:COGSEED_NODE" "<this file>"
const fs = require('fs');
const path = require('path');
const OUT = 'C:\\.cogseed\\userWorkSpace\\我的挑战有哪些\\C1\\sources';
const ASSIGN_DIR = path.join(OUT, 'assignments');
const UA = { 'User-Agent': 'Mozilla/5.0' };

const data = JSON.parse(fs.readFileSync(path.join(OUT, 'site_data.json'), 'utf8'));
const lines = [];
const push = (...a) => { a.forEach((s) => lines.push(s)); };
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').split('\n').map((s) => s.trim()).filter((s) => s.length > 1).filter((s, i, a) => s !== a[i - 1]).join('\n');

function block(name, title) {
  if (!(name in data)) return false;
  push('', '---', '', '## ' + title, '');
  const v = data[name];
  walk(v, 0);
  return true;
}
function walk(v, d) {
  const ind = '  '.repeat(d);
  if (Array.isArray(v)) { v.forEach((x) => walk(x, d)); return; }
  if (v && typeof v === 'object') {
    if (typeof v.title === 'string') push('', ind + '### ' + v.title);
    for (const [k, val] of Object.entries(v)) {
      if (k === 'title') continue;
      if (typeof val === 'string') push(ind + '- ' + k + ': ' + val);
      else if (Array.isArray(val)) {
        if (val.length && typeof val[0] === 'string') push(ind + '- ' + k + ': ' + val.join(' | '));
        else if (val.length) {
          push(ind + '- ' + k + ':');
          val.forEach((x) => {
            if (x && typeof x === 'object' && ('label' in x || 'href' in x)) push(ind + '  - ' + (x.label || '') + ' -> ' + (x.href || ''));
            else if (x && typeof x === 'object' && x.title) { push(ind + '  - ' + x.title); for (const [k2, v2] of Object.entries(x)) if (k2 !== 'title') push(ind + '    - ' + k2 + ': ' + JSON.stringify(v2)); }
            else push(ind + '  - ' + JSON.stringify(x));
          });
        } else push(ind + '- ' + k + ': []');
      } else if (val && typeof val === 'object') { push(ind + '- ' + k + ':'); walk(val, d + 1); }
      else push(ind + '- ' + k + ': ' + String(val));
    }
    return;
  }
  push(ind + String(v));
}

push('# CS146S: The Modern Software Developer — 一手课程材料英文快照（英文原文，用于翻译）');
push('', '来源: https://themodernsoftware.dev （首页 + /fall2025）');
push('抓取方式: pipeline/extract_site.js 解析 Next.js bundle 中的结构化数据（site_data.json）');
push('说明: 官网是客户端渲染 SPA，/syllabus 与 /faq 直连 404；内容以 RSC 载荷形式存在于 bundle 中，故用脚本提取。');
block('ep', 'FAQ');
block('eP', 'Fall 2025 Syllabus（按周）');
block('e_', 'Fall 2026 Syllabus（按周）');
block('eT', 'Grading（Fall 2025）');
block('eI', 'Grading（Fall 2026）');
block('eM', 'Additional materials / 其他数据集');
// 其余未分类字面量也归档，避免遗漏
for (const k of Object.keys(data)) {
  if (['ep', 'eP', 'e_', 'eT', 'eI', 'eM'].includes(k)) continue;
  push('', '---', '', '## 附加数据块 ' + k, '');
  walk(data[k], 0);
}
const md = lines.join('\n');
fs.writeFileSync(path.join(OUT, 'course_source_en.md'), md);
console.log('course_source_en.md chars=' + md.length + ' lines=' + lines.length);

// 2) 页面可视正文（HTML -> 纯文本），用于翻译课程总览等正文内容
for (const pair of [['home.html', 'home_en.txt'], ['fall2025.html', 'fall2025_en.txt']]) {
  const p = path.join(OUT, pair[0]);
  if (!fs.existsSync(p)) { console.log('missing ' + pair[0]); continue; }
  const t = strip(fs.readFileSync(p, 'utf8'));
  fs.writeFileSync(path.join(OUT, pair[1]), t);
  console.log(pair[1] + ' chars=' + t.length);
}

(async () => {
  fs.mkdirSync(ASSIGN_DIR, { recursive: true });
  const tree = await (await fetch('https://api.github.com/repos/mihail911/modern-software-dev-assignments/git/trees/master?recursive=1', { headers: UA })).json();
  if (!tree.tree) { console.log('TREE_ERR ' + JSON.stringify(tree).slice(0, 200)); return; }
  const files = tree.tree.filter((t) => t.type === 'blob' && /\.(md|txt|py|json)$/i.test(t.path)).map((t) => t.path);
  console.log('repo files: ' + files.length + '\n' + files.join('\n'));
  const local = [];
  for (const f of files) {
    try {
      const r = await fetch('https://raw.githubusercontent.com/mihail911/modern-software-dev-assignments/master/' + f, { headers: UA });
      const t = await r.text();
      const dest = path.join(ASSIGN_DIR, f.replace(/\//g, '__'));
      fs.writeFileSync(dest, t);
      local.push(f + ' -> ' + dest + ' (' + t.length + 'B)');
    } catch (e) { local.push(f + ' ERR ' + e.message); }
  }
  fs.writeFileSync(path.join(ASSIGN_DIR, '_manifest.txt'), local.join('\n'));
  console.log('downloaded:\n' + local.join('\n'));
})();
