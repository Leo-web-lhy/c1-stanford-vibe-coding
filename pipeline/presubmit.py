# -*- coding: utf-8 -*-
"""以精确 argv 方式调用 eduseed-student-submit 的离线预检命令。

绕开 PowerShell / cmd 对 JSON 内嵌双引号的转义损耗；
同时对比 workdir 的反斜杠 / 正斜杠两种写法。输出同时落盘，避免被渲染成图片。
"""
import json
import os
import subprocess
import sys

node = os.environ.get("COGSEED_NODE") or "node"
pc = os.environ.get("COGSEED_PC_DIR") or ""
run_skill = os.path.join(pc, "bin", "run-skill.cjs")

command = sys.argv[1] if len(sys.argv) > 1 else "prepare-submission"
out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "presubmit.out.txt")

base = {
    "requiredDeliverables": "README.md,*AI日志*,*AAR*,*拿来说明*",
    "projectTitle": "C1 课程资料获取与翻译（Stanford Vibe Coding 课程）",
    "githubRepoUrl": "https://github.com/Leo-web-lhy/c1-stanford-vibe-coding",
}

candidates = [
    ("backslash", r"C:\.cogseed\userWorkSpace\我的挑战有哪些\C1"),
    ("forward", "C:/.cogseed/userWorkSpace/我的挑战有哪些/C1"),
]

lines = []
lines.append("node=%s" % node)
lines.append("pc=%s" % pc)
lines.append("run_skill=%s" % run_skill)
lines.append("run_skill_exists=%s" % os.path.exists(run_skill))
lines.append("command=%s" % command)

for name, wd in candidates:
    payload = dict(base)
    payload["workdir"] = wd
    args = [node, run_skill, "eduseed-student-submit", "runtime", "--", command,
            json.dumps(payload, ensure_ascii=False)]
    lines.append("=" * 60)
    lines.append("VARIANT %s" % name)
    lines.append("workdir=%s" % wd)
    try:
        r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8")
        lines.append("exit=%s" % r.returncode)
        lines.append("stdout=%s" % (r.stdout or "").strip())
        if r.stderr:
            lines.append("stderr=%s" % r.stderr.strip())
    except Exception as exc:  # noqa: BLE001
        lines.append("SPAWN_FAILED=%r" % (exc,))

text = "\n".join(lines)
with open(out_path, "w", encoding="utf-8") as fh:
    fh.write(text)
print("WROTE %s (%d chars)" % (out_path, len(text)))
