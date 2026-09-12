#!/usr/bin/env python3
"""依據存放庫檢查機器可驗證的文件主張。

唯讀。僅使用標準函式庫。不寫入任何內容。

    python docs_drift.py                     # 文字報告
    python docs_drift.py --repo ../other     # 不同的存放庫
    python docs_drift.py --format json
    python docs_drift.py --no-git-root       # 範圍限定於 monorepo 的單一套件

僅檢查有明確答案的主張：

  commands   圍欄區塊中的 `npm run x`、`make x`、`./scripts/x`，比對實際存在的指令碼、目標與檔案
  links      相對 Markdown 連結與圖片，比對檔案系統
  paths      反引號路徑，比對檔案系統（需選擇啟用，--check-paths）
  env vars   文件或 .env.example 中記錄的名稱，與程式碼實際讀取的名稱雙向比對
  staleness  文件未修改的時間遠長於其所描述的程式碼

本工具不評估行文散文。措辭、語氣、解釋的完整性與準確性是審查 Agent 的工作；
本工具的存在是為了避免 Agent 花費四十次工具呼叫來確認路徑是否存在。

反引號路徑檢查為選擇啟用。在實際存放庫中，多數此類引用皆不明確——例如文件指示您建立的路徑，
或封存報告在當時準確描述的路徑——回報這些內容會掩蓋明確無誤的發現。
Markdown 連結一律會被檢查，因為連結即代表必須能夠解析的承諾。

環境檔案中的值絕不會被讀取。僅使用 `=` 左側的名稱，因為依設計右側屬於憑證。
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

GIT_TIMEOUT = 30
MAX_READ = 2_000_000
STALE_DAYS = 120

SKIP_DIRS = {
    ".git", "node_modules", "vendor", "venv", ".venv", "dist", "build", "target",
    "__pycache__", ".next", "coverage", ".terraform", "site-packages",
}
DOC_EXTS = {".md", ".mdx", ".rst", ".txt"}
CODE_EXTS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".vue", ".svelte",
    ".go", ".rs", ".rb", ".php", ".java", ".kt", ".swift", ".cs", ".ex", ".exs", ".sh",
}

FENCE = re.compile(r"^```")
# 值得檢查的指令。圍欄區塊中的任何其他內容均不作處理。
CMD_NPM = re.compile(r"\b(?:npm|pnpm|yarn|bun)\s+run\s+([A-Za-z0-9:_.-]+)")
CMD_MAKE = re.compile(r"\bmake\s+([A-Za-z0-9_.-]+)")
CMD_SCRIPT = re.compile(r"(?:^|\s)(\./[A-Za-z0-9_./-]+|(?:python3?|node|bash|sh|ruby)\s+([A-Za-z0-9_./-]+\.[A-Za-z0-9]+))")

MD_LINK = re.compile(r"!?\[[^\]]*\]\(([^)\s]+)")
BACKTICK = re.compile(r"`([^`\n]+)`")

# 不打算解析的預留位置形式。
PLACEHOLDER = re.compile(
    r"[<>{}$*]|^\.{3}|\.{3}$|(^|/)(path/to|your[-_]|my[-_]|example|foo|bar|baz|placeholder)",
    re.I)

ENV_IN_CODE = [
    re.compile(r"process\.env\.([A-Z][A-Z0-9_]*)"),
    re.compile(r"""process\.env\[\s*['"]([A-Z][A-Z0-9_]*)['"]"""),
    re.compile(r"""os\.environ(?:\.get)?\[?\(?\s*['"]([A-Z][A-Z0-9_]*)['"]"""),
    re.compile(r"""os\.getenv\(\s*['"]([A-Z][A-Z0-9_]*)['"]"""),
    re.compile(r"""getenv\(\s*['"]([A-Z][A-Z0-9_]*)['"]"""),
    re.compile(r"""ENV\[\s*['"]([A-Z][A-Z0-9_]*)['"]"""),
    re.compile(r"""Deno\.env\.get\(\s*['"]([A-Z][A-Z0-9_]*)['"]"""),
]
ENV_NAME = re.compile(r"\b([A-Z][A-Z0-9_]{2,})\b")

# 上述處理之各語言的匯入形式。四個替代選項，因此 findall
# 會回傳元組，呼叫端取第一個非空群組。
IMPORT_SPEC = re.compile(
    r"""(?:from|import)\s+['"]([^'"]+)['"]"""
    r"""|require\(\s*['"]([^'"]+)['"]\s*\)"""
    r"""|^\s*from\s+([A-Za-z0-9_.]+)\s+import"""
    r"""|^\s*import\s+([A-Za-z0-9_.]+)""",
    re.M)

warnings: list[str] = []


def run_git(args: list[str], cwd: Path) -> str | None:
    git = shutil.which("git")
    if git is None:
        return None
    try:
        p = subprocess.run([git, *args], cwd=str(cwd), text=True, timeout=GIT_TIMEOUT,
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                           encoding="utf-8", errors="replace")
    except (OSError, subprocess.SubprocessError) as exc:
        warnings.append(f"git {' '.join(args[:2])} failed: {exc}")
        return None
    return p.stdout if p.returncode == 0 else None


def list_files(repo: Path) -> list[str]:
    out = run_git(["ls-files", "--cached", "--other", "--exclude-standard"], repo)
    if out is not None and out.strip():
        return sorted(x.strip() for x in out.splitlines() if x.strip())
    warnings.append("git unavailable or empty index; walking the filesystem instead")
    files = []
    for p in repo.rglob("*"):
        if p.is_file() and not any(part in SKIP_DIRS for part in p.parts):
            files.append(p.relative_to(repo).as_posix())
    return sorted(files)


def read(path: Path) -> str:
    try:
        if path.stat().st_size > MAX_READ:
            return ""
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def available_commands(repo: Path, files: list[str]) -> tuple[dict[str, set[str]], set[str]]:
    """實際的 npm 指令碼與 make 目標，以宣告它們的目錄為鍵。"""
    npm: dict[str, set[str]] = {}
    make: set[str] = set()
    for rel in files:
        base = Path(rel).name
        prefix = str(Path(rel).parent).replace("\\", "/")
        if base == "package.json":
            try:
                data = json.loads(read(repo / rel))
            except ValueError:
                continue
            if isinstance(data.get("scripts"), dict):
                npm.setdefault(prefix, set()).update(data["scripts"].keys())
        elif base == "Makefile":
            targets = re.findall(r"^([A-Za-z0-9][A-Za-z0-9_.-]*):(?!=)", read(repo / rel), re.M)
            make.update(targets)
    return npm, make


def fenced_blocks(text: str) -> list[tuple[int, str]]:
    """針對圍欄程式碼區塊內的行，產生 (行號, 行內容)。"""
    out: list[tuple[int, str]] = []
    inside = False
    for i, line in enumerate(text.splitlines(), start=1):
        if FENCE.match(line.strip()):
            inside = not inside
            continue
        if inside:
            out.append((i, line))
    return out


def env_names_from_code(repo: Path, files: list[str]) -> dict[str, list[str]]:
    """程式碼讀取的環境變數名稱，對應到讀取它們的每個位置。"""
    found: dict[str, list[str]] = {}
    for rel in files:
        if Path(rel).suffix not in CODE_EXTS or any(p in SKIP_DIRS for p in Path(rel).parts):
            continue
        text = read(repo / rel)
        if not text or "env" not in text.lower():
            continue
        for i, line in enumerate(text.splitlines(), start=1):
            for pattern in ENV_IN_CODE:
                for name in pattern.findall(line):
                    found.setdefault(name, []).append(f"{rel}:{i}")
    return found


def unreferenced_modules(repo: Path, files: list[str]) -> set[str]:
    """沒有任何程式碼匯入且非合宜進入點的程式碼檔案。

    若記載的設定僅在此類檔案中讀取，則該組態無法
    生效，但在文件中看起來卻像是正常運作的設定。刻意採取
    保守策略：使用基底名稱比對，且排除任何具進入點特徵的項目，
    因此寧可低報，也不將作用中的程式碼指為無效程式碼。
    """
    code = [f for f in files
            if Path(f).suffix in CODE_EXTS and not any(p in SKIP_DIRS for p in Path(f).parts)]
    entrypoint = re.compile(
        r"(^|/)(server|main|index|app|cli|__init__|__main__|conftest|setup|wsgi|asgi)\.[A-Za-z]+$",
        re.I)
    imported: set[str] = set()
    for rel in code:
        text = read(repo / rel)
        if not text:
            continue
        for groups in IMPORT_SPEC.findall(text):
            ref = next((g for g in groups if g), "").strip()
            if not ref:
                continue
            imported.add(Path(ref).name.lower())
            imported.add(Path(ref).stem.lower())
            for part in re.split(r"[./\:]", ref):
                if part:
                    imported.add(part.lower())
    out = set()
    for rel in code:
        if entrypoint.search(rel):
            continue
        stem = Path(rel).stem.lower()
        if stem not in imported and Path(rel).name.lower() not in imported:
            out.add(rel)
    return out


def env_names_documented(repo: Path, files: list[str]) -> dict[str, str]:
    """在文件中提及或在環境範例檔案中宣告的環境變數名稱。

    從環境檔案中僅讀取 `=` 左側的鍵。依設計值屬於
    憑證，絕不會被讀取。
    """
    documented: dict[str, str] = {}
    for rel in files:
        base = Path(rel).name
        is_env_sample = base.startswith(".env")
        if not is_env_sample and Path(rel).suffix not in DOC_EXTS:
            continue
        text = read(repo / rel)
        if not text:
            continue
        for i, line in enumerate(text.splitlines(), start=1):
            if is_env_sample:
                stripped = line.strip()
                if not stripped or stripped.startswith("#") or "=" not in stripped:
                    continue
                key = stripped.split("=", 1)[0].strip().lstrip("export ").strip()
                if ENV_NAME.fullmatch(key or ""):
                    documented.setdefault(key, f"{rel}:{i}")
            else:
                # 在散文中，反引號包圍的全大寫 token 是薄弱的依據：`SKILL.md`
                # 與 `README` 並不是設定。要求必須含有底線（這才是
                # 區分 API_TOKEN 與大寫單字的真正特徵），並跳過
                # 看起來像檔名的任何內容。
                for chunk in BACKTICK.findall(line):
                    if "." in chunk or "/" in chunk:
                        continue
                    for name in ENV_NAME.findall(chunk):
                        if "_" not in name:
                            continue
                        documented.setdefault(name, f"{rel}:{i}")
    return documented


def newest_commit_epoch(repo: Path, pathspec: str) -> int | None:
    out = run_git(["log", "-1", "--format=%at", "--", pathspec], repo)
    if not out or not out.strip().isdigit():
        return None
    return int(out.strip())


def build(repo: Path, files: list[str], check_paths: bool = False) -> dict:
    findings: list[dict] = []

    def add(kind: str, severity: str, doc: str, line: int | None, detail: str,
            source: str | None = None) -> None:
        findings.append({"kind": kind, "severity": severity, "doc": doc, "line": line,
                         "detail": detail, "source": source})

    file_set = set(files)
    npm_scripts, make_targets = available_commands(repo, files)
    all_npm = set().union(*npm_scripts.values()) if npm_scripts else set()
    docs = [f for f in files
            if Path(f).suffix in DOC_EXTS and not any(p in SKIP_DIRS for p in Path(f).parts)]

    for doc in docs:
        text = read(repo / doc)
        if not text:
            continue

        # 1. 指令 (commands)
        for lineno, line in fenced_blocks(text):
            for script in set(CMD_NPM.findall(line)):
                if not all_npm:
                    continue
                if script not in all_npm:
                    near = ", ".join(sorted(s for s in all_npm if s.startswith(script.split(":")[0]))[:4])
                    hint = f" Closest existing: {near}." if near else ""
                    add("missing-script", "high", doc, lineno,
                        f"documents `{script}`, which is not a script in any package.json.{hint}",
                        source="package.json")
            for target in set(CMD_MAKE.findall(line)):
                if make_targets and target not in make_targets and target not in ("-j", "all"):
                    add("missing-make-target", "high", doc, lineno,
                        f"documents `make {target}`, which is not a target in the Makefile.",
                        source="Makefile")
            for whole, inner in CMD_SCRIPT.findall(line):
                candidate = (inner or whole).lstrip("./")
                if not candidate or PLACEHOLDER.search(candidate):
                    continue
                if candidate.endswith("/") or any(part in SKIP_DIRS
                                                  for part in Path(candidate).parts):
                    continue
                if candidate not in file_set and not (repo / candidate).exists():
                    add("missing-script-file", "high", doc, lineno,
                        f"documents running `{candidate}`, which does not exist.")

        # 2 與 3. 連結與反引號路徑 (links and backticked paths)
        for i, line in enumerate(text.splitlines(), start=1):
            for target in MD_LINK.findall(line):
                t = target.split("#")[0].strip()
                if not t or t.startswith(("http://", "https://", "mailto:", "#", "tel:", "data:")):
                    continue
                if PLACEHOLDER.search(t):
                    continue
                if not (repo / Path(doc).parent / t).exists():
                    add("broken-link", "high", doc, i,
                        f"relative link `{t}` does not resolve.")
            for chunk in (BACKTICK.findall(line) if check_paths else []):
                c = chunk.strip()
                # 僅在看起來像路徑時才視為路徑主張。
                if "/" not in c or " " in c or PLACEHOLDER.search(c):
                    continue
                # 開頭的斜線代表斜線指令或絕對路徑，例如
                # `/security-review`。兩者皆非關於此存放庫的主張。
                if c.startswith("/"):
                    continue
                if not re.match(r"^[A-Za-z0-9._/-]+$", c) or c.endswith("/"):
                    continue
                # 要求具備真正的副檔名。無副檔名的斜線 token
                # 本質上具二義性——`origin/staging` 是 git ref，`src/utils/billing`
                # 是一個說明用範例，`@scope/pkg` 是一個套件。指控這些為
                # 損壞的路徑所產生的雜訊遠多於有效訊號。
                if not re.match(r"^\.[A-Za-z0-9]{1,5}$", Path(c).suffix):
                    continue
                if c in file_set or (repo / c).exists():
                    continue
                # 文件通常會撰寫相對於其本身目錄的路徑。
                if (repo / Path(doc).parent / c).exists():
                    continue
                # 存在的目錄前綴已足夠接近，不予回報。
                if any(f.startswith(c.rstrip("/") + "/") for f in file_set):
                    continue
                # 文件也會引用重複出現的型態，例如 `agents/openai.yaml`
                # 而實際檔案為 skills/<name>/agents/openai.yaml。若其為
                # 實際路徑的尾端，則該主張已足夠真實。
                tail = "/" + c
                if any(f.endswith(tail) for f in file_set):
                    continue
                add("missing-path", "medium", doc, i,
                    f"references `{c}`, which does not exist in the repository.")

    # 4. 環境變數，雙向檢查 (env vars, both directions)
    in_code = env_names_from_code(repo, files)
    in_docs = env_names_documented(repo, files)
    dead = unreferenced_modules(repo, files)
    for name, where in sorted(in_docs.items()):
        readers = in_code.get(name, [])
        doc_path, _, doc_line = where.rpartition(":")
        if not readers:
            add("documented-unused-env", "medium", doc_path, int(doc_line),
                f"`{name}` is documented but nothing in the code reads it. "
                "Either it is dead configuration or the docs promise a knob that does not exist.",
                source="no reader found")
        elif all(r.rsplit(":", 1)[0] in dead for r in readers):
            where_read = ", ".join(readers[:3])
            add("documented-env-in-unreferenced-module", "medium", doc_path, int(doc_line),
                f"`{name}` is read only in a module nothing imports, so the documented setting "
                "cannot take effect. The docs describe a working knob that does nothing.",
                source=where_read)
    for name, readers in sorted(in_code.items()):
        if name not in in_docs:
            add("undocumented-env", "medium", "(docs)", None,
                f"`{name}` is read by the code but is not documented anywhere, "
                "and is not in an env sample file.",
                source=readers[0])

    # 5. 閒置過期判定 (staleness)
    code_dirs = {str(Path(f).parent).replace("\\", "/") for f in files
                 if Path(f).suffix in CODE_EXTS}
    newest_code = max((e for e in (newest_commit_epoch(repo, d) for d in list(code_dirs)[:40])
                       if e), default=None)
    if newest_code:
        for doc in docs:
            doc_epoch = newest_commit_epoch(repo, doc)
            if not doc_epoch:
                continue
            days = (newest_code - doc_epoch) / 86400
            if days > STALE_DAYS:
                add("stale-doc", "low", doc, None,
                    f"last changed {int(days)} days before the most recent code change. "
                    "Not wrong by itself, but worth reading against current behavior.")

    order = {"high": 0, "medium": 1, "low": 2}
    findings.sort(key=lambda f: (order.get(f["severity"], 3), f["doc"], f["line"] or 0))
    return {
        "repo": str(repo),
        "totals": {"docs_checked": len(docs), "findings": len(findings),
                   "npm_scripts_found": len(all_npm), "make_targets_found": len(make_targets),
                   "env_names_in_code": len(in_code), "env_names_documented": len(in_docs)},
        "findings": findings,
        "warnings": warnings,
    }


def render(d: dict, top: int) -> str:
    t = d["totals"]
    L = ["# Documentation Drift Check", "", f"Repo: {d['repo']}",
         f"Docs checked: {t['docs_checked']}   Findings: {t['findings']}",
         f"Known npm scripts: {t['npm_scripts_found']}   make targets: {t['make_targets_found']}",
         f"Env names in code: {t['env_names_in_code']}   documented: {t['env_names_documented']}", ""]

    if not d["findings"]:
        L.append("No machine-verifiable drift found. Prose accuracy is still unchecked.")
    else:
        shown = d["findings"][:top]
        if len(d["findings"]) > top:
            L.append(f"TRUNCATED: showing {top} of {len(d['findings'])} findings")
            L.append("")
        for f in shown:
            loc = f"{f['doc']}:{f['line']}" if f.get("line") else f["doc"]
            L.append(f"- [{f['severity']}] {f['kind']} -- {loc}")
            L.append(f"  {f['detail']}")
            if f.get("source"):
                L.append(f"  source of truth: {f['source']}")
    L.append("")
    if d["warnings"]:
        L.append("## Warnings")
        L.extend(f"- {w}" for w in d["warnings"])
        L.append("")
    L.append("Checks only claims with a definite answer. Wording, completeness and whether an")
    L.append("explanation is actually correct are not checked here. Confirm each finding by")
    L.append("opening both the doc and the source before reporting it.")
    return "\n".join(L)


def main() -> int:
    ap = argparse.ArgumentParser(description="Check documentation claims against the repo. Read-only.")
    ap.add_argument("--repo", default=".", help="Path inside the repository.")
    ap.add_argument("--format", choices=["text", "json"], default="text", help="Output format.")
    ap.add_argument("--top", type=int, default=30, help="Findings to show. Default 30.")
    ap.add_argument("--check-paths", action="store_true",
                    help=("Also check backticked paths against the filesystem. Off by default: on "
                          "real repos most such references are ambiguous -- a path a doc tells you "
                          "to create, or one an archived report described at the time -- and the "
                          "noise buries the unambiguous findings. Markdown links are always checked."))
    ap.add_argument("--no-git-root", action="store_true",
                    help="Treat --repo literally instead of expanding to the enclosing git repository root.")
    args = ap.parse_args()

    repo = Path(args.repo).resolve()
    if not repo.is_dir():
        print(f"error: not a directory: {repo}", file=sys.stderr)
        return 2
    if not args.no_git_root:
        root = run_git(["rev-parse", "--show-toplevel"], repo)
        if root and root.strip():
            repo = Path(root.strip()).resolve()

    files = list_files(repo)
    if not files:
        print(f"error: no files found under {repo}", file=sys.stderr)
        return 2

    data = build(repo, files, check_paths=args.check_paths)
    print(json.dumps(data, indent=2) if args.format == "json" else render(data, args.top))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
