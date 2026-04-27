#!/usr/bin/env python3
"""
從存放庫文件 (README, CONTRIBUTING, docs/) 建立導覽草稿。

讀取 README.md (以及選用的 CONTRIBUTING.md, docs/) 來擷取：
  - 檔案與目錄參考
  - 架構 / 結構區段
  - 設定指示 (成為導引步驟)
  - 外部連結 (成為 uri 步驟)

輸出一個骨架 .tour JSON，code-tour 技能會用描述填寫。
技能讀取此骨架並充實它 — 它不會取代技能的判斷。

用法：
    python generate_from_docs.py [--repo-root <路徑>] [--persona <角色>] [--output <檔案>]

範例：
    python generate_from_docs.py
    python generate_from_docs.py --persona new-joiner --output .tours/from-readme.tour
    python generate_from_docs.py --repo-root /path/to/repo --persona vibecoder
"""

import json
import re
import sys
import os
from pathlib import Path
from typing import Optional


# ── Markdown 擷取輔助函式 ──────────────────────────────────────────────

# 比對看起來像檔案/目錄路徑的內嵌程式碼
_CODE_PATH = re.compile(r"`([^`]{2,80})`")
# 比對標題
_HEADING = re.compile(r"^(#{1,3})\s+(.+)$", re.MULTILINE)
# 比對 markdown 連結：[文字](url)
_LINK = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)")
# 建議路徑的模式 (包含 / 或帶副檔名的 .)
_LOOKS_LIKE_PATH = re.compile(r"^\.?[\w\-]+(/[\w\-\.]+)+$|^\./|^[\w]+\.[a-z]{1,5}$")
# 架構 / 結構區段關鍵字
_STRUCT_KEYWORDS = re.compile(
    r"\b(structure|architecture|layout|overview|directory|folder|module|component|"
    r"design|system|organization|getting.started|quick.start|setup|installation)\b",
    re.IGNORECASE,
)


def _extract_paths_from_text(text: str, repo_root: Path) -> list[str]:
    """擷取看起來像實際檔案/目錄路徑的內嵌程式碼。"""
    candidates = _CODE_PATH.findall(text)
    found = []
    for c in candidates:
        c = c.strip().lstrip("./")
        if not c:
            continue
        if not _LOOKS_LIKE_PATH.match(c) and "/" not in c and "." not in c:
            continue
        # 檢查路徑是否實際存在
        full = repo_root / c
        if full.exists():
            found.append(c)
    return found


def _extract_external_links(text: str) -> list[tuple[str, str]]:
    """擷取 URI 步驟的 [標籤](url) 對。"""
    links = _LINK.findall(text)
    # 過濾掉圖片連結和非常通用的錨點
    return [
        (label, url)
        for label, url in links
        if not url.endswith((".png", ".jpg", ".gif", ".svg"))
        and label.lower() not in ("here", "this", "link", "click", "see")
    ]


def _split_into_sections(text: str) -> list[tuple[str, str]]:
    """將 markdown 分割為 (標題, 內文) 對。"""
    headings = list(_HEADING.finditer(text))
    sections = []
    for i, m in enumerate(headings):
        heading = m.group(2).strip()
        start = m.end()
        end = headings[i + 1].start() if i + 1 < len(headings) else len(text)
        body = text[start:end].strip()
        sections.append((heading, body))
    return sections


def _is_structure_section(heading: str) -> bool:
    return bool(_STRUCT_KEYWORDS.search(heading))


# ── 步驟建立器 ─────────────────────────────────────────────────────────────

def _make_content_step(title: str, hint: str) -> dict:
    return {
        "title": title,
        "description": f"[TODO: {hint}]",
    }


def _make_file_step(path: str, hint: str = "") -> dict:
    step = {
        "file": path,
        "title": f"[TODO: {path} 的標題]",
        "description": f"[TODO: {hint or '為此角色解釋此檔案'}]",
    }
    return step


def _make_dir_step(path: str, hint: str = "") -> dict:
    return {
        "directory": path,
        "title": f"[TODO: {path}/ 的標題]",
        "description": f"[TODO: {hint or '解釋此處存放的內容'}]",
    }


def _make_uri_step(url: str, label: str) -> dict:
    return {
        "uri": url,
        "title": label,
        "description": "[TODO: 解釋為什麼此連結相關以及讀者應該注意什麼]",
    }


# ── 核心產生器 ────────────────────────────────────────────────────────────

def generate_skeleton(repo_root: str = ".", persona: str = "new-joiner") -> dict:
    repo = Path(repo_root).resolve()

    # ── 讀取文件檔案 ─────────────────────────────────────────
    doc_files = ["README.md", "readme.md", "Readme.md"]
    extra_docs = ["CONTRIBUTING.md", "ARCHITECTURE.md", "docs/architecture.md", "docs/README.md"]

    readme_text = ""
    for name in doc_files:
        p = repo / name
        if p.exists():
            readme_text = p.read_text(errors="replace")
            break

    extra_texts = []
    for name in extra_docs:
        p = repo / name
        if p.exists():
            extra_texts.append((name, p.read_text(errors="replace")))

    all_text = readme_text + "\n".join(t for _, t in extra_texts)

    # ── 收集步驟 ─────────────────────────────────────────────────────
    steps = []
    seen_paths: set[str] = set()

    # 1. 簡介步驟
    steps.append(
        _make_content_step(
            "歡迎",
            f"介紹存放庫：它的功能、這個 {persona} 導覽是為誰準備的，以及他們在完成後會瞭解什麼。",
        )
    )

    # 2. 解析 README 區段
    if readme_text:
        sections = _split_into_sections(readme_text)
        for heading, body in sections:
            # 結構 / 架構區段 → 目錄步驟
            if _is_structure_section(heading):
                paths = _extract_paths_from_text(body, repo)
                for p in paths:
                    if p in seen_paths:
                        continue
                    seen_paths.add(p)
                    full = repo / p
                    if full.is_dir():
                        steps.append(_make_dir_step(p, f"在 README 的 '{heading}' 下提到"))
                    elif full.is_file():
                        steps.append(_make_file_step(p, f"在 README 的 '{heading}' 下提到"))

    # 3. 掃描所有文字中尚未擷取的檔案/目錄參考
    all_paths = _extract_paths_from_text(all_text, repo)
    for p in all_paths:
        if p in seen_paths:
            continue
        seen_paths.add(p)
        full = repo / p
        if full.is_dir():
            steps.append(_make_dir_step(p))
        elif full.is_file():
            steps.append(_make_file_step(p))

    # 4. 如果找到的檔案步驟很少，則退而求其次進行頂層目錄掃描
    file_and_dir_steps = [s for s in steps if "file" in s or "directory" in s]
    if len(file_and_dir_steps) < 3:
        # 新增頂層目錄
        for item in sorted(repo.iterdir()):
            if item.name.startswith(".") or item.name in ("node_modules", "__pycache__", ".git"):
                continue
            rel = str(item.relative_to(repo))
            if rel in seen_paths:
                continue
            seen_paths.add(rel)
            if item.is_dir():
                steps.append(_make_dir_step(rel, "頂層目錄"))
            elif item.is_file() and item.suffix in (".ts", ".js", ".py", ".go", ".rs", ".java", ".rb"):
                steps.append(_make_file_step(rel, "頂層原始碼檔案"))

    # 5. 來自 README 外部連結的 URI 步驟
    links = _extract_external_links(readme_text)
    # 僅包含看起來像架構 / 設計參考的連結
    for label, url in links[:3]:  # 上限為 3 以避免雜訊
        steps.append(_make_uri_step(url, label))

    # 6. 結束步驟
    steps.append(
        _make_content_step(
            "接下來要探索什麼",
            "總結讀者現在瞭解的內容。列出他們接下來應該閱讀的 2–3 個後續導覽。",
        )
    )

    # 依 (file/directory/uri 鍵) 對步驟進行去重
    seen_keys: set = set()
    deduped = []
    for s in steps:
        key = s.get("file") or s.get("directory") or s.get("uri") or s.get("title")
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append(s)

    return {
        "$schema": "https://aka.ms/codetour-schema",
        "title": f"[TODO: {persona} 導覽的描述性標題]",
        "description": f"[TODO: 一句話 — 這是為誰準備的以及他們會瞭解什麼]",
        "_skeleton_generated_by": "generate_from_docs.py",
        "_instructions": (
            "這是一個骨架。用實際內容填寫每個 [TODO: ...]。"
            "在撰寫描述之前閱讀每個參考的檔案。"
            "在儲存之前移除此 _skeleton_generated_by 和 _instructions 欄位。"
        ),
        "steps": deduped,
    }


def main():
    args = sys.argv[1:]
    if "--help" in args or "-h" in args:
        print(__doc__)
        sys.exit(0)

    repo_root = "."
    persona = "new-joiner"
    output: Optional[str] = None

    i = 0
    while i < len(args):
        if args[i] == "--repo-root" and i + 1 < len(args):
            repo_root = args[i + 1]
            i += 2
        elif args[i] == "--persona" and i + 1 < len(args):
            persona = args[i + 1]
            i += 2
        elif args[i] == "--output" and i + 1 < len(args):
            output = args[i + 1]
            i += 2
        else:
            i += 1

    skeleton = generate_skeleton(repo_root, persona)
    out_json = json.dumps(skeleton, indent=2)

    if output:
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        Path(output).write_text(out_json)
        print(f"✅ 骨架已寫入 {output}")
        print(f"   從文件產生了 {len(skeleton['steps'])} 個步驟")
        print(f"   在分享前填寫所有 [TODO: ...] 項目")
    else:
        print(out_json)


if __name__ == "__main__":
    main()
