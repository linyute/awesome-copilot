#!/usr/bin/env python3
"""
CodeTour 驗證器 — 與 code-tour 技能綑綁。

檢查 .tour 檔案中的：
  - 有效的 JSON
  - 必要欄位 (標題、步驟、每個步驟的描述)
  - 存放庫中實際存在的檔案路徑
  - 檔案範圍內的行號
  - 檔案範圍內的選取範圍
  - 存在的目錄路徑
  - 可編譯且至少比對到一行的模式正規表示式
  - URI 格式 (必須以 https:// 開頭)
  - nextTour 比對 .tours/ 中現有的導覽標題
  - 僅限內容的步驟數量 (建議最多 2 個)
  - 敘事弧 (第一步應該是導向，最後一步應該是結束)

用法：
    python validate_tour.py <導覽檔案> [--repo-root <路徑>]

範例：
    python validate_tour.py .tours/new-joiner.tour
    python validate_tour.py .tours/new-joiner.tour --repo-root /path/to/repo
"""

import json
import re
import sys
import os
from pathlib import Path


RESET = "\033[0m"
RED = "\033[31m"
YELLOW = "\033[33m"
GREEN = "\033[32m"
BOLD = "\033[1m"
DIM = "\033[2m"


def _line_count(path: Path) -> int:
    try:
        with open(path, errors="replace") as f:
            return sum(1 for _ in f)
    except Exception:
        return 0


def _file_content(path: Path) -> str:
    try:
        return path.read_text(errors="replace")
    except Exception:
        return ""


def validate_tour(tour_path: str, repo_root: str = ".") -> dict:
    repo = Path(repo_root).resolve()
    errors = []
    warnings = []
    info = []

    # ── 1. JSON 有效性 ────────────────────────────────────────────────────
    try:
        with open(tour_path, errors="replace") as f:
            tour = json.load(f)
    except json.JSONDecodeError as e:
        return {
            "passed": False,
            "errors": [f"無效的 JSON: {e}"],
            "warnings": [],
            "info": [],
            "stats": {},
        }
    except FileNotFoundError:
        return {
            "passed": False,
            "errors": [f"找不到檔案: {tour_path}"],
            "warnings": [],
            "info": [],
            "stats": {},
        }

    # ── 2. 必要頂層欄位 ────────────────────────────────────────
    if "title" not in tour:
        errors.append("缺少必要欄位：'title'")
    if "steps" not in tour:
        errors.append("缺少必要欄位：'steps'")
        return {"passed": False, "errors": errors, "warnings": warnings, "info": info, "stats": {}}

    steps = tour["steps"]
    if not isinstance(steps, list):
        errors.append("'steps' 必須是一個陣列")
        return {"passed": False, "errors": errors, "warnings": warnings, "info": info, "stats": {}}

    if len(steps) == 0:
        errors.append("導覽沒有步驟")
        return {"passed": False, "errors": errors, "warnings": warnings, "info": info, "stats": {}}

    # ── 3. 導覽級別選用欄位 ───────────────────────────────────────
    if "nextTour" in tour:
        tours_dir = Path(tour_path).parent
        next_title = tour["nextTour"]
        found_next = False
        for tf in tours_dir.glob("*.tour"):
            if tf.resolve() == Path(tour_path).resolve():
                continue
            try:
                other = json.loads(tf.read_text())
                if other.get("title") == next_title:
                    found_next = True
                    break
            except Exception:
                pass
        if not found_next:
            warnings.append(
                f"nextTour '{next_title}' — .tours/ 中沒有任何 .tour 檔案具有相符的標題"
            )

    # ── 4. 逐步驗證 ───────────────────────────────────────────────
    content_only_count = 0
    file_step_count = 0
    dir_step_count = 0
    uri_step_count = 0

    for i, step in enumerate(steps):
        label = f"步驟 {i + 1}"
        if "title" in step:
            label += f" — {step['title']!r}"

        # 每個步驟都必須有描述
        if "description" not in step:
            errors.append(f"{label}：缺少必要欄位 'description'")

        has_file = "file" in step
        has_dir = "directory" in step
        has_uri = "uri" in step
        has_selection = "selection" in step

        if not has_file and not has_dir and not has_uri:
            content_only_count += 1

        # ── 檔案 ──────────────────────────────────────────────────────────
        if has_file:
            file_step_count += 1
            raw_path = step["file"]

            # 必須是相對路徑 — 不能有前導斜線，不能是 ./
            if raw_path.startswith("/"):
                errors.append(f"{label}：檔案路徑必須是相對路徑 (不能有前導 /)：{raw_path!r}")
            elif raw_path.startswith("./"):
                warnings.append(f"{label}：檔案路徑不應以 './' 開頭：{raw_path!r}")

            file_path = repo / raw_path
            if not file_path.exists():
                errors.append(f"{label}：檔案不存在：{raw_path!r}")
            elif not file_path.is_file():
                errors.append(f"{label}：路徑不是檔案：{raw_path!r}")
            else:
                lc = _line_count(file_path)

                # 行號
                if "line" in step:
                    ln = step["line"]
                    if not isinstance(ln, int):
                        errors.append(f"{label}：'line' 必須是整數，得到 {ln!r}")
                    elif ln < 1:
                        errors.append(f"{label}：行號必須 >= 1，得到 {ln}")
                    elif ln > lc:
                        errors.append(
                            f"{label}：行號 {ln} 超過檔案長度 ({lc} 行)：{raw_path!r}"
                        )

                # 選取範圍
                if has_selection:
                    sel = step["selection"]
                    start = sel.get("start", {})
                    end = sel.get("end", {})
                    s_line = start.get("line", 0)
                    e_line = end.get("line", 0)
                    if s_line > lc:
                        errors.append(
                            f"{label}：選取範圍起始行 {s_line} 超過檔案長度 ({lc})"
                        )
                    if e_line > lc:
                        errors.append(
                            f"{label}：選取範圍結束行 {e_line} 超過檔案長度 ({lc})"
                        )
                    if s_line > e_line:
                        errors.append(
                            f"{label}：選取範圍起始位置 ({s_line}) 在結束位置 ({e_line}) 之後"
                        )

                # 模式
                if "pattern" in step:
                    try:
                        compiled = re.compile(step["pattern"], re.MULTILINE)
                        content = _file_content(file_path)
                        if not compiled.search(content):
                            errors.append(
                                f"{label}：模式 {step['pattern']!r} 在 {raw_path!r} 中沒有比對到任何內容"
                            )
                    except re.error as e:
                        errors.append(f"{label}：無效的正規表示式模式：{e}")

        # ── 目錄 ─────────────────────────────────────────────────────
        if has_dir:
            dir_step_count += 1
            raw_dir = step["directory"]
            dir_path = repo / raw_dir
            if not dir_path.exists():
                errors.append(f"{label}：目錄不存在：{raw_dir!r}")
            elif not dir_path.is_dir():
                errors.append(f"{label}：路徑不是目錄：{raw_dir!r}")

        # ── uri ───────────────────────────────────────────────────────────
        if has_uri:
            uri_step_count += 1
            uri = step["uri"]
            if not uri.startswith("https://") and not uri.startswith("http://"):
                warnings.append(f"{label}：URI 應該以 https:// 開頭：{uri!r}")

        # ── 命令 ──────────────────────────────────────────────────────
        if "commands" in step:
            if not isinstance(step["commands"], list):
                errors.append(f"{label}：'commands' 必須是一個陣列")
            else:
                for cmd in step["commands"]:
                    if not isinstance(cmd, str):
                        errors.append(f"{label}：每個命令都必須是字串，得到 {cmd!r}")

    # ── 5. 僅限內容的步驟數量 ──────────────────────────────────────────
    if content_only_count > 2:
        warnings.append(
            f"{content_only_count} 個僅限內容的步驟 (無檔案/目錄/uri)。"
            f"建議最多：2 (簡介 + 結束)。"
        )

    # ── 6. 敘事弧檢查 ─────────────────────────────────────────────
    first = steps[0]
    last = steps[-1]
    first_is_orient = "file" not in first and "directory" not in first and "uri" not in first
    last_is_closing = "file" not in last and "directory" not in last and "uri" not in last

    if not first_is_orient and "directory" not in first:
        info.append(
            "第一步是檔案/uri 步驟 — 考慮從內容或目錄導引步驟開始。"
        )
    if not last_is_closing:
        info.append(
            "最後一步不是內容步驟 — 考慮以結束/總結步驟作為結尾。"
        )

    stats = {
        "total_steps": len(steps),
        "file_steps": file_step_count,
        "directory_steps": dir_step_count,
        "content_steps": content_only_count,
        "uri_steps": uri_step_count,
    }

    return {
        "passed": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "info": info,
        "stats": stats,
    }


def print_report(tour_path: str, result: dict) -> None:
    title = f"{BOLD}{tour_path}{RESET}"
    print(f"\n{title}")
    print("─" * 60)

    stats = result.get("stats", {})
    if stats:
        parts = [
            f"{stats.get('total_steps', 0)} 個步驟",
            f"{stats.get('file_steps', 0)} 個檔案",
            f"{stats.get('directory_steps', 0)} 個目錄",
            f"{stats.get('content_steps', 0)} 個內容",
            f"{stats.get('uri_steps', 0)} 個 uri",
        ]
        print(f"{DIM}  {' · '.join(parts)}{RESET}")

    errors = result.get("errors", [])
    warnings = result.get("warnings", [])
    info = result.get("info", [])

    for e in errors:
        print(f"  {RED}✗ {e}{RESET}")
    for w in warnings:
        print(f"  {YELLOW}⚠ {w}{RESET}")
    for i in info:
        print(f"  {DIM}ℹ {i}{RESET}")

    if result["passed"] and not warnings:
        print(f"  {GREEN}✓ 所有檢查皆通過{RESET}")
    elif result["passed"]:
        print(f"  {GREEN}✓ 通過{RESET} {YELLOW}(有警告){RESET}")
    else:
        print(f"  {RED}✗ 失敗 — {len(errors)} 個錯誤{RESET}")

    print()


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0)

    repo_root = "."
    tour_files = []

    i = 0
    while i < len(args):
        if args[i] == "--repo-root" and i + 1 < len(args):
            repo_root = args[i + 1]
            i += 2
        else:
            tour_files.append(args[i])
            i += 1

    if not tour_files:
        # 驗證 .tours/ 中的所有導覽
        tours_dir = Path(".tours")
        if tours_dir.exists():
            tour_files = [str(p) for p in sorted(tours_dir.glob("*.tour"))]
        if not tour_files:
            print("找不到 .tour 檔案。請提供檔案路徑，或在具有 .tours/ 目錄的存放庫中執行。")
            sys.exit(1)

    all_passed = True
    for tf in tour_files:
        result = validate_tour(tf, repo_root)
        print_report(tf, result)
        if not result["passed"]:
            all_passed = False

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
