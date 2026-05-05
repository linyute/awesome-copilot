"""
wiki_store.py — 管理持久化的 Wiki 層。

受到 Karpathy 的 LLM Wiki 模式啟發：Wiki 是一個由 LLM 生成的 Markdown 頁面目錄，
由代理程式編寫並維護。此模組提供確定性的檔案 I/O 以及索引/記錄管理，
讓代理程式可以專注於推理而非簿記。

Wiki 結構（相對於專案根目錄）：
    wiki/
        index.md        ← 所有頁面的內容導向目錄
        log.md          ← 按時間順序排列的僅附加操作記錄
        entities/       ← 每個實體一頁（人物、概念、系統等）
        summaries/      ← 來源文件摘要頁面
        topics/         ← 跨領域整合與主題頁面

代理程式編寫頁面；此模組處理檔案系統 + 索引 + 記錄。
"""
from __future__ import annotations

import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
import config

_WIKI_DIR = Path(os.environ.get("MINI_CONTEXT_GRAPH_WIKI_DIR", str(config.WIKI_DIR)))
_INDEX_FILE = _WIKI_DIR / "index.md"
_LOG_FILE = _WIKI_DIR / "log.md"

_CATEGORY_DIRS = {
    "entity": _WIKI_DIR / "entities",
    "summary": _WIKI_DIR / "summaries",
    "topic": _WIKI_DIR / "topics",
}

# ---------------------------------------------------------------------------
# 內部輔助函式
# ---------------------------------------------------------------------------

def _ensure_dirs() -> None:
    _WIKI_DIR.mkdir(parents=True, exist_ok=True)
    for d in _CATEGORY_DIRS.values():
        d.mkdir(parents=True, exist_ok=True)


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _slug(title: str) -> str:
    """將標題轉換為檔案系統安全的代稱（slug）。"""
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def _page_path(category: str, slug: str) -> Path:
    base = _CATEGORY_DIRS.get(category, _WIKI_DIR)
    return base / f"{slug}.md"


# ---------------------------------------------------------------------------
# 索引管理
# ---------------------------------------------------------------------------

def _load_index() -> list[dict]:
    """將 index.md 解析為分目字典列表。"""
    if not _INDEX_FILE.exists():
        return []
    entries = []
    for line in _INDEX_FILE.read_text().splitlines():
        # 預期表格行：| [[slug]] | category | summary | date |
        if line.startswith("| [["):
            parts = [p.strip() for p in line.split("|") if p.strip()]
            if len(parts) >= 3:
                link = parts[0]  # [[slug]]
                category = parts[1] if len(parts) > 1 else ""
                summary = parts[2] if len(parts) > 2 else ""
                date = parts[3] if len(parts) > 3 else ""
                slug = re.sub(r"\[\[|\]\]", "", link)
                entries.append({
                    "slug": slug,
                    "category": category,
                    "summary": summary,
                    "date": date,
                })
    return entries


def _save_index(entries: list[dict]) -> None:
    """根據分目列表重寫 index.md。"""
    _ensure_dirs()
    lines = [
        "# Wiki 索引\n",
        "_由 wiki_store 自動管理。請勿手動編輯表格。_\n\n",
        "| 頁面 | 類別 | 摘要 | 日期 |\n",
        "|------|----------|---------|------|\n",
    ]
    for e in entries:
        lines.append(
            f"| [[{e['slug']}]] | {e['category']} | {e['summary']} | {e['date']} |\n"
        )
    _INDEX_FILE.write_text("".join(lines))


def _append_log(operation: str, detail: str) -> None:
    """向 log.md 附加帶有時間戳記的分目。"""
    _ensure_dirs()
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    entry = f"\n## [{timestamp}] {operation} | {detail}\n"
    with open(_LOG_FILE, "a") as f:
        f.write(entry)


# ---------------------------------------------------------------------------
# 公開 API
# ---------------------------------------------------------------------------

def write_page(
    category: str,
    title: str,
    content: str,
    summary: str = "",
) -> str:
    """
    編寫（或覆寫）Wiki 頁面。

    代理程式提供完整的 Markdown 內容。此方法處理：
    - 將 .md 檔案寫入相應的類別子目錄。
    - 使用單行分目更新 index.md。
    - 向 log.md 附加一個分目。

    參數：
        category: "entity"、"summary"、"topic" 之一。
        title:    人類可讀的頁面標題（用於代稱 + 索引）。
        content:  代理程式編寫的完整 Markdown 內容。
        summary:  索引的單行摘要（選填；如果為空則自動提取）。

    回傳：
        相對於 Wiki 根目錄的路徑（例如 "entities/memory-leak.md"）。
    """
    _ensure_dirs()
    slug = _slug(title)
    path = _page_path(category, slug)

    # 如果未提供摘要，則自動提取第一個非標題、非空行作為摘要
    if not summary:
        for line in content.splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                summary = stripped[:100]
                break

    path.write_text(content)

    # 更新索引
    entries = _load_index()
    existing = next((e for e in entries if e["slug"] == slug), None)
    if existing:
        existing["summary"] = summary
        existing["date"] = _now_iso()
    else:
        entries.append({
            "slug": slug,
            "category": category,
            "summary": summary,
            "date": _now_iso(),
        })
    _save_index(entries)
    _append_log("write", title)

    return str(path.relative_to(_WIKI_DIR))


def read_page(category: str, title: str) -> str | None:
    """讀取 Wiki 頁面的內容。如果找不到則回傳 None。"""
    slug = _slug(title)
    path = _page_path(category, slug)
    if not path.exists():
        return None
    return path.read_text()


def read_page_by_slug(slug: str) -> str | None:
    """透過代稱讀取 Wiki 頁面，搜尋所有類別。"""
    for d in list(_CATEGORY_DIRS.values()) + [_WIKI_DIR]:
        path = d / f"{slug}.md"
        if path.exists():
            return path.read_text()
    return None


def search_wiki(query: str) -> list[dict]:
    """
    對所有 Wiki 頁面進行簡單的關鍵字搜尋。
    回傳按相關性排序的 {slug, category, path, snippet} 列表。
    """
    query_tokens = set(re.findall(r"[a-z0-9]+", query.lower()))
    if not query_tokens:
        return []

    results = []
    for category, base_dir in _CATEGORY_DIRS.items():
        if not base_dir.exists():
            continue
        for page_path in base_dir.glob("*.md"):
            content = page_path.read_text().lower()
            content_tokens = set(re.findall(r"[a-z0-9]+", content))
            overlap = len(query_tokens & content_tokens)
            if overlap > 0:
                # 提取第一個匹配項周圍的短片段
                first_token = next(iter(query_tokens & content_tokens), "")
                idx = content.find(first_token)
                snippet = content[max(0, idx - 30):idx + 80].replace("\n", " ").strip()
                results.append({
                    "slug": page_path.stem,
                    "category": category,
                    "path": str(page_path.relative_to(_WIKI_DIR)),
                    "score": overlap,
                    "snippet": snippet,
                })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def list_pages(category: str | None = None) -> list[dict]:
    """列出所有 Wiki 頁面，可選擇按類別過濾。"""
    entries = _load_index()
    if category:
        return [e for e in entries if e["category"] == category]
    return entries


def get_log(last_n: int = 20) -> list[str]:
    """從 log.md 回傳最後 N 個記錄分目。"""
    if not _LOG_FILE.exists():
        return []
    lines = _LOG_FILE.read_text().splitlines()
    entries = [l for l in lines if l.startswith("## [")]
    return entries[-last_n:]


def lint_wiki() -> dict:
    """
    按照 Karpathy 的 LLM Wiki 模式所述對 Wiki 進行健康檢查。

    檢查：
    - 孤立頁面（在目錄中但不在索引中）
    - 缺失頁面（在索引中但檔案已刪除）
    - 損壞的 Wiki 連結（[[slug]] 指向不存在的檔案）
    - 沒有 Wiki 連結的頁面（孤立頁面）

    回傳：
        {
          "orphan_pages": [...],
          "missing_pages": [...],
          "broken_wikilinks": {slug: [broken_links]},
          "isolated_pages": [...],
        }
    """
    index_entries = {e["slug"] for e in _load_index()}
    file_slugs: dict[str, Path] = {}
    for d in _CATEGORY_DIRS.values():
        if d.exists():
            for p in d.glob("*.md"):
                file_slugs[p.stem] = p

    orphans = [s for s in file_slugs if s not in index_entries]
    missing = [s for s in index_entries if s not in file_slugs]

    broken_wikilinks: dict[str, list[str]] = {}
    isolated: list[str] = []
    all_slugs = set(file_slugs.keys())

    for slug, path in file_slugs.items():
        content = path.read_text()
        links = re.findall(r"\[\[([^\]]+)\]\]", content)
        if not links:
            isolated.append(slug)
        broken = [lnk for lnk in links if _slug(lnk) not in all_slugs]
        if broken:
            broken_wikilinks[slug] = broken

    return {
        "orphan_pages": orphans,
        "missing_pages": missing,
        "broken_wikilinks": broken_wikilinks,
        "isolated_pages": isolated,
    }
