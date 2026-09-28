# C1 课程资料获取与翻译（Stanford Vibe Coding 课程）

> 挑战编号：`ch-20260717031336-pxzwy0` ｜ 截止：2026-12-31 23:59
> 挑战目标：全量获取 Stanford「Vibe Coding / The Modern Software Developer」课程公开资料，并完整翻译为中文。
> 本期定位：Phase 1 选拔第一关。
> 成果仓库（公开）：https://github.com/Leo-web-lhy/c1-stanford-vibe-coding

---

## 1. 交付物索引

| 交付物 | 文件 | 说明 |
|---|---|---|
| 学习日志（AI 日志） | `AI日志.md` | 记录每次与 AI 协作的过程、产出与人工校正 |
| 拿来说明 | `拿来说明.md` | 说明资料获取途径、翻译方式、如何核验「这份中文稿确实来自官方原文」 |
| 课后复盘（AAR） | `AAR.md` | 按「学到了什么 / 卡点与突破 / 改进方向」复盘本次执行 |
| 重写说明 | `README.md` | 本文件，交付物总入口与流程说明 |
| 术语表 | `术语表.md` | 中英对照术语，保证全文译名一致 |
| 覆盖率报告 | `覆盖率报告.md` | 逐项核对原文每条内容是否有对应中文译文，并列出缺口 |
| 中文译文 | `translations/*.md` | 课程总览、Fall 2025 大纲、Fall 2026 大纲、评分标准、FAQ |

## 2. 原始资料（英文原文）

课程官网为单页应用（SPA），正文仅存在于前端 JS bundle 中，直接抓取 `/syllabus`、`/faq` 会返回 404。因此采用「站点数据提取」方式获取正文。

| 文件 | 内容 |
|---|---|
| `sources/course_source_en.md` | 站点渲染稿（21038 字符 / 342 行），含 Fall 2025 与 Fall 2026 两套完整课程大纲、FAQ、评分权重、附加数据块 |
| `sources/site_data.json` | 站点结构化数据（30129 字节） |
| `sources/site_bundle.js` | 站点 JS bundle（81796 字节） |
| `sources/home.html` / `sources/fall2025.html` | 页面存档（26464 / 26570 字节） |
| `sources/assignments/` | 课程作业仓库（GitHub，公开） |
| `pipeline/fetch_sources.js` | 抓取与渲染脚本，可复跑 |
| `pipeline/check_links.js` | 链接全量校验脚本（对全部 URL 逐条请求） |

抓取日期：**2026-09-28**。

## 3. 翻译原则

1. **逐段对应**：原文每一周、每一条阅读材料、每一个 FAQ 条目都有对应中文段落，不合并、不省略。
2. **链接原样保留**：所有 URL（slides、阅读材料、嘉宾主页、代码仓库）**一字不改、不短链化、不翻译**，便于读者点击核验。
3. **不臆造**：原文未列出的内容（如 Fall 2026 多数周次无阅读材料、Fall 2025 第 8–10 周未列阅读/作业）如实标注「原文未列出」，不补齐、不推测。
4. **术语一致**：统一使用 `术语表.md` 中的译法（如 agent→智能体、prompt→提示词、harness→运行框架）。
5. **专有名词不硬译**：人名、公司名、产品名（Claude Code、MCP、Cognition、Replit、Semgrep 等）保留英文原名，首次出现时加中文注释。

## 4. 目录结构

```
C1/
├── README.md                 # 本文件
├── AI日志.md
├── AAR.md
├── 拿来说明.md
├── 术语表.md
├── 覆盖率报告.md
├── pipeline/
│   ├── fetch_sources.js      # 资料抓取脚本
│   └── check_links.js        # 链接全量校验脚本
├── sources/                  # 英文原文与页面存档
│   ├── course_source_en.md
│   ├── site_data.json
│   ├── site_bundle.js
│   ├── home.html
│   ├── fall2025.html
│   └── assignments/
└── translations/             # 中文译文
    ├── 01_课程总览_zh.md
    ├── 02_课程大纲_Fall2025_zh.md
    ├── 03_课程大纲_Fall2026_zh.md
    ├── 04_评分标准_zh.md
    └── 05_FAQ_zh.md
```

## 5. 如何核验

1. 打开 `sources/course_source_en.md`，任选一段英文；
2. 在 `translations/` 对应文件中找到中文段落；
3. 比对链接、日期、人名、百分比等「可被证伪的事实」，应逐字一致。

## 6. 复现与复用（可复用发布）

本目录是一个**自包含、可复用的成果包**，可直接作为 Git 仓库根目录发布与复跑，评审无需依赖作者自述即可核验：

1. **复跑抓取**：`node pipeline/fetch_sources.js` → 重新生成 `sources/site_data.json` 与 `sources/course_source_en.md`；官网更新后可增量重跑。
2. **复跑翻译**：以 `sources/course_source_en.md` 为唯一输入，按 `术语表.md` 的译法逐段落译入 `translations/`。
3. **复跑核验**：`node pipeline/check_links.js <输出.json>` 对全部链接做全量自动校验；再用 `覆盖率报告.md` 的逐项清单回归内容覆盖。
4. **发布方式（已发布）**：公开仓库 <https://github.com/Leo-web-lhy/c1-stanford-vibe-coding>，仓库根目录即本成果包，可直接 `git clone` 后按上述 1–3 步复跑核验；`sources/` 为公开英文原文存档，`translations/` 为中文成果，脚本与说明齐备。
5. **提交前自检**：`python pipeline/presubmit.py` 可本地复跑交付物齐备性与必交模式匹配自检。

## 7. 已知缺口（如实声明）

- 课程作业仓库当前仅公开到 **Week 1**（`week1/assignment.md`、`week1/writeup.md`），Week 2 及以后在仓库中不存在，因此无法翻译。
- 部分 slides 链接为 Google Drive / Docs，需登录校内账号才可访问，本稿仅保留链接、不转载内容。
- 课程为 Stanford 校内课程，部分嘉宾讲座与视频为受限资源，本稿不复制受限内容。
