#!/usr/bin/env python3
"""將存放庫的原始程式碼檔案對應到其測試，使涵蓋範圍缺口成為具體依據，而非憑空臆測。

唯讀。僅使用標準函式庫。不寫入任何內容。不執行任何測試。

    python coverage_map.py                    # 當前存放庫的文字摘要
    python coverage_map.py --repo ../other    # 不同的存放庫
    python coverage_map.py --format json      # 機器可讀
    python coverage_map.py --top 40           # 每個區段顯示更多列

偵測測試框架與命名慣例，然後依據基底名稱、鏡像路徑，以及——最重要的是——
透過掃描測試檔案實際匯入的內容，將每個原始程式碼檔案與測試進行比對。
匯入掃描使得「找不到 X 的測試」成為值得回報的事實，而非僅是合理的推測。

啟發式規則（HEURISTIC）。無法透過間接引用、fixtures 或執行該檔案但未明確具名的端對端測試來察覺涵蓋範圍。
請將 `untested` 項目視為待手動確認的線索，絕不可直接當作定論。
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

GIT_TIMEOUT = 30
MAX_READ_BYTES = 400_000  # 跳過病態異常檔案以避免停滯

IGNORED_DIRS = {
    ".git", ".hg", ".svn", "node_modules", "vendor", "venv", ".venv", "env",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache", ".tox",
    "dist", "build", "target", "out", ".next", ".nuxt", ".svelte-kit",
    ".idea", ".vscode", ".gradle", "Pods", ".terraform", "coverage",
}

SOURCE_EXTS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".vue", ".svelte",
    ".go", ".rs", ".rb", ".php", ".java", ".kt", ".swift", ".scala", ".cs", ".ex", ".exs", ".dart",
}

# 屬於組態、產生的檔案或進入點黏合程式碼，而非值得測試的邏輯檔案。
NON_LOGIC = re.compile(
    r"(^|/)(setup|conftest|__init__|index|main|migrations?|__generated__)\.[A-Za-z]+$"
    r"|\.(config|d)\.[A-Za-z]+$"
    r"|(^|/)(migrations|__generated__|generated|\.storybook)/",
    re.IGNORECASE,
)

TEST_PATH = re.compile(
    r"(^|/)(tests?|spec|specs|__tests__|e2e|integration|cypress|playwright)(/|$)"
    r"|(^|/)[^/]*[._-](test|spec)s?\.[A-Za-z0-9]+$"
    r"|(^|/)test_[^/]*\.[A-Za-z0-9]+$"
    r"|_test\.[A-Za-z0-9]+$",
    re.IGNORECASE,
)

# 框架標記 -> 標籤。在資訊清單 (manifests) 與組態檔名中搜尋。
FRAMEWORKS = {
    "vitest": "Vitest", "jest": "Jest", "mocha": "Mocha", "jasmine": "Jasmine",
    "@playwright/test": "Playwright", "cypress": "Cypress", "ava": "AVA",
    "@testing-library": "Testing Library", "karma": "Karma", "node:test": "node:test",
    "pytest": "pytest", "unittest": "unittest", "nose": "nose", "tox": "tox",
    "rspec": "RSpec", "minitest": "Minitest", "phpunit": "PHPUnit", "pest": "Pest",
    "junit": "JUnit", "testng": "TestNG", "go test": "go test", "cargo test": "cargo test",
    "xunit": "xUnit", "nunit": "NUnit", "exunit": "ExUnit",
}

ASSERTION_TOKENS = re.compile(
    r"\b(expect|assert|assert_|assertEqual|assertTrue|assertRaises|should|"
    r"toBe|toEqual|toThrow|toHaveBeenCalled|require\.Equal|assert\.|"
    r"refute|is_a|must_equal|shouldBe|verify)\b",
    re.IGNORECASE,
)
# 僅限實際的測試案例。`describe`、`context` 與 `class Test` 是分組
# 結構，計入它們會虛增案例數量——在一個 describe() 中只有一個 it() 的
# 檔案將會回報兩個案例，進而使下方的每案例斷言比例失真。
TEST_CASE_TOKENS = re.compile(
    r"^\s*(it|test|def test_|func Test|scenario|@Test|it\.each|test\.each)\b",
    re.MULTILINE,
)

RISK_KEYWORDS = (
    "auth", "login", "session", "token", "password", "permission", "role", "admin",
    "billing", "payment", "invoice", "subscription", "checkout", "charge", "refund",
    "migration", "delete", "destroy", "export", "import", "webhook", "crypto", "wallet",
    "security", "secret", "upload",
)

# 我們所處理之語言的匯入形式。群組 1 一律為模組參照。
IMPORT_RES = [
    re.compile(r"""(?:from|import)\s+['"]([^'"]+)['"]"""),          # JS/TS
    re.compile(r"""require\(\s*['"]([^'"]+)['"]\s*\)"""),            # CJS
    re.compile(r"""^\s*from\s+([A-Za-z0-9_.]+)\s+import""", re.M),   # Python from-import
    re.compile(r"""^\s*import\s+([A-Za-z0-9_.]+)""", re.M),          # Python/Java/Go import
    re.compile(r"""use\s+([A-Za-z0-9_:]+)"""),                       # Rust
    re.compile(r"""require(?:_relative)?\s+['"]([^'"]+)['"]"""),     # Ruby
]

warnings: list[str] = []


def run_git(args: list[str], repo: Path) -> str | None:
    git = shutil.which("git")
    if git is None:
        return None
    try:
        r = subprocess.run(
            [git, *args], cwd=str(repo), text=True, timeout=GIT_TIMEOUT,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            encoding="utf-8", errors="replace",
        )
    except (OSError, subprocess.SubprocessError) as exc:
        warnings.append(f"git {' '.join(args)} failed: {exc}")
        return None
    return r.stdout if r.returncode == 0 else None


def list_files(repo: Path) -> list[str]:
    out = run_git(["ls-files", "--cached", "--other", "--exclude-standard"], repo)
    if out is not None:
        files = [ln.strip() for ln in out.splitlines() if ln.strip()]
        if files:
            return sorted(files)
    warnings.append("git unavailable or empty index; using a filesystem walk (ignore rules approximated)")
    files = []
    for root, dirnames, filenames in os.walk(repo):
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS and not d.startswith(".")]
        for fn in filenames:
            files.append(Path(root, fn).relative_to(repo).as_posix())
    return sorted(files)


def read(path: Path) -> str:
    try:
        if path.stat().st_size > MAX_READ_BYTES:
            return ""
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def detect_frameworks(repo: Path, files: list[str]) -> list[str]:
    found: set[str] = set()
    haystacks: list[str] = []
    for name in ("package.json", "pyproject.toml", "requirements.txt", "Gemfile",
                 "composer.json", "pom.xml", "build.gradle", "mix.exs", "Cargo.toml"):
        for rel in [f for f in files if Path(f).name == name][:5]:
            haystacks.append(read(repo / rel).lower())
    config_names = " ".join(Path(f).name.lower() for f in files)
    haystacks.append(config_names)
    blob = "\n".join(haystacks)
    for marker, label in FRAMEWORKS.items():
        m = marker.lower()
        # 像 "ava"、"nose" 與 "pest" 等簡短字詞會在 "available"、"javascript"
        # 等內容中產生子字串比對，因此需要為它們加上單字邊界。
        # 帶有標點符號的標記（"@playwright/test"、"node:test"）本身已足夠
        # 明確，且 \b 在這些字元周圍本來就不起作用。
        if m.isalnum():
            if re.search(rf"\b{re.escape(m)}\b", blob):
                found.add(label)
        elif m in blob:
            found.add(label)
    # 語言隱含的執行器，無需資訊清單項目。
    if any(f.endswith("_test.go") for f in files):
        found.add("go test")
    if any(f.endswith(".rs") for f in files) and any("#[test]" in read(repo / f) for f in
                                                     [x for x in files if x.endswith(".rs")][:20]):
        found.add("cargo test")
    return sorted(found)


def infer_convention(test_files: list[str]) -> list[str]:
    patterns: Counter[str] = Counter()
    for rel in test_files:
        name = Path(rel).name
        if re.match(r"^test_.*\.py$", name):
            patterns["test_*.py"] += 1
        elif re.search(r"_test\.go$", name):
            patterns["*_test.go"] += 1
        elif re.search(r"\.(test|spec)\.[jt]sx?$", name):
            patterns[f"*.{'test' if '.test.' in name else 'spec'}.[jt]s(x)"] += 1
        elif re.search(r"_spec\.rb$", name):
            patterns["*_spec.rb"] += 1
        elif re.search(r"Test\.(java|kt|cs)$", name):
            patterns["*Test.{java,kt,cs}"] += 1
        if "__tests__/" in rel:
            patterns["__tests__/ directory"] += 1
        elif re.match(r"^tests?/", rel):
            patterns["tests/ directory"] += 1
        elif re.match(r"^spec/", rel):
            patterns["spec/ directory"] += 1
    return [f"{p} ({n})" for p, n in patterns.most_common()]


def module_tokens(rel: str) -> set[str]:
    """測試可能用來參照此原始程式碼檔案的識別碼。"""
    p = Path(rel)
    stem = p.stem
    tokens = {stem.lower()}
    # 位於 foo/Button/index.tsx 的元件會被稱為 "Button"。
    if stem.lower() in ("index", "__init__", "mod"):
        tokens.add(p.parent.name.lower())
    tokens.add(rel.lower())
    tokens.add(p.with_suffix("").as_posix().lower())
    return {t for t in tokens if t and t not in ("", ".")}


def build(repo: Path, files: list[str]) -> dict:
    test_files = [f for f in files if TEST_PATH.search(f) and Path(f).suffix in SOURCE_EXTS]
    test_set = set(test_files)
    source_files = [
        f for f in files
        if Path(f).suffix in SOURCE_EXTS and f not in test_set and not NON_LOGIC.search(f)
    ]

    # 為測試所匯入的內容建立索引，並記錄它們提及的每個單獨識別碼。
    imported: set[str] = set()
    mentioned: set[str] = set()
    weak: list[dict] = []
    for rel in test_files:
        text = read(repo / rel)
        if not text:
            continue
        for regex in IMPORT_RES:
            for m in regex.findall(text):
                ref = m.strip()
                imported.add(ref.lower())
                imported.add(Path(ref).name.lower())
                imported.add(Path(ref).stem.lower())
                for part in re.split(r"[./:\\]", ref):
                    if part and part not in (".", "..", "src", "lib", "app"):
                        mentioned.add(part.lower())
        assertions = len(ASSERTION_TOKENS.findall(text))
        cases = len(TEST_CASE_TOKENS.findall(text))
        lines = text.count("\n") + 1
        # 具有測試案例但幾乎沒有斷言的測試檔案，通常未斷言任何有用的項目。
        if cases and assertions <= max(1, cases // 4):
            weak.append({"path": rel, "test_cases": cases, "assertions": assertions, "lines": lines})

    # 其檔名本身標註為測試的測試檔案，相對於僅僅
    # 存在於 tests/ 或 e2e/ 下的檔案（fixtures、helpers、page objects、factories）。
    named_test_re = re.compile(r"([._-](test|spec)s?$)|(^test_)|(^test$)", re.IGNORECASE)
    named_tests = [t for t in test_files if named_test_re.search(Path(t).stem)]

    matched: dict[str, list[str]] = {}
    untested: list[dict] = []
    for rel in source_files:
        tokens = module_tokens(rel)
        how: list[str] = []

        stem = Path(rel).stem.lower()
        mirror = Path(rel).with_suffix("").as_posix().lower()

        # 1. 測試檔案本身的「名稱」帶有測試標記並嵌入了此檔案的名稱。
        #    要求標記至關重要：像 e2e/lib/api.mjs 這樣的協助程式由於其目錄而被歸類為測試檔案，
        #    否則將會「涵蓋」存放庫中的每一個 api.js。
        #    這裡的錯誤比對會掩蓋真正的缺口，因此請保持此規則嚴格。
        for t in named_tests:
            tl = Path(t).stem.lower()
            if tl in {f"{stem}test", f"test{stem}", f"{stem}spec", f"{stem}_test",
                      f"test_{stem}", f"{stem}.test", f"{stem}.spec"} or \
               re.sub(r"[._-]?(test|spec)s?$", "", tl) == stem:
                how.append(f"name match: {t}")
                break
        # 2. 鏡像目錄結構，例如 src/a/b.ts -> tests/a/b.test.ts
        if not how:
            tail = "/".join(mirror.split("/")[1:]) if "/" in mirror else mirror
            if tail and any(tail in t.lower() for t in test_files):
                how.append("mirrored path match")
        # 3. 測試實際匯入了該檔案
        if not how and (tokens & imported):
            how.append("imported by a test")
        # 4. 最弱訊號：測試中提及了該識別碼
        if not how and stem in mentioned and len(stem) > 3:
            how.append("mentioned in a test (weak signal)")

        if how:
            matched[rel] = how
        else:
            lines = read(repo / rel).count("\n") + 1
            hits = [k for k in RISK_KEYWORDS if k in rel.lower()]
            untested.append({
                "path": rel,
                "lines": lines,
                "dir": str(Path(rel).parent).replace("\\", "/"),
                "risk_keywords": hits,
            })

    untested.sort(key=lambda x: (not x["risk_keywords"], -x["lines"]))
    weak.sort(key=lambda x: -x["test_cases"])

    by_dir: dict[str, dict] = defaultdict(lambda: {"untested": 0, "lines": 0})
    for u in untested:
        by_dir[u["dir"]]["untested"] += 1
        by_dir[u["dir"]]["lines"] += u["lines"]

    return {
        "repo": str(repo),
        "frameworks": detect_frameworks(repo, files),
        "conventions": infer_convention(test_files),
        "totals": {
            "source_files": len(source_files),
            "test_files": len(test_files),
            "matched": len(matched),
            "untested": len(untested),
            "coverage_ratio": round(len(matched) / len(source_files), 3) if source_files else None,
        },
        "untested": untested,
        "untested_by_directory": sorted(
            ({"dir": d, **v} for d, v in by_dir.items()),
            key=lambda x: -x["untested"],
        ),
        "weak_tests": weak,
        "matched_sample": [{"path": p, "why": w} for p, w in list(matched.items())[:15]],
        "warnings": warnings,
    }


def truncate(items: list, limit: int, label: str, out: list[str]) -> list:
    if len(items) > limit:
        out.append(f"  TRUNCATED: showing top {limit} of {len(items)} {label}")
        return items[:limit]
    return items


def render(d: dict, top: int) -> str:
    t = d["totals"]
    L = ["# Test Coverage Map", "", f"Repo: {d['repo']}"]
    ratio = f"{t['coverage_ratio']:.0%}" if t["coverage_ratio"] is not None else "n/a"
    L.append(f"Source files: {t['source_files']}   Test files: {t['test_files']}   "
             f"Matched: {t['matched']} ({ratio})   Unmatched: {t['untested']}")
    L.append("")
    L.append(f"Frameworks detected: {', '.join(d['frameworks']) or 'none detected'}")
    L.append(f"Naming conventions: {', '.join(d['conventions']) or 'none inferred'}")
    L.append("")

    L.append("## Unmatched source files (risk-flagged first, then largest)")
    if d["untested"]:
        for u in truncate(d["untested"], top, "unmatched files", L):
            flag = f"  [risk: {', '.join(u['risk_keywords'])}]" if u["risk_keywords"] else ""
            L.append(f"- {u['path']}: {u['lines']} lines{flag}")
    else:
        L.append("- none; every source file matched at least one test signal")
    L.append("")

    L.append("## Unmatched by directory")
    for row in truncate(d["untested_by_directory"], top, "directories", L):
        L.append(f"- {row['dir']}: {row['untested']} files, {row['lines']} lines")
    L.append("")

    L.append("## Test files with test cases but few assertions")
    if d["weak_tests"]:
        for w in truncate(d["weak_tests"], top, "test files", L):
            L.append(f"- {w['path']}: {w['test_cases']} cases, {w['assertions']} assertions")
    else:
        L.append("- none flagged")
    L.append("")

    if d["warnings"]:
        L.append("## Warnings")
        L.extend(f"- {w}" for w in d["warnings"])
        L.append("")

    L.append("HEURISTIC MATCHER. An unmatched file is a lead, not a finding: coverage through")
    L.append("fixtures, end-to-end tests, or indirection is invisible here. Confirm by grepping for")
    L.append("the module name before reporting anything as P0 or P1.")
    return "\n".join(L)


def main() -> int:
    ap = argparse.ArgumentParser(description="Map source files against tests. Read-only.")
    ap.add_argument("--repo", default=".", help="Path inside the repository.")
    ap.add_argument("--format", choices=["text", "json"], default="text", help="Output format.")
    ap.add_argument("--top", type=int, default=25, help="Rows per section. Default 25.")
    ap.add_argument(
        "--no-git-root",
        action="store_true",
        help=(
            "Treat --repo literally instead of expanding to the enclosing git repository root. "
            "Use this to scope the survey to one package or subdirectory of a monorepo."
        ),
    )
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

    data = build(repo, files)
    print(json.dumps(data, indent=2) if args.format == "json" else render(data, args.top))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
