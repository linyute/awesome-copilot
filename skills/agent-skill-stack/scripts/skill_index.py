#!/usr/bin/env python3
"""建構並搜尋已安裝 Agent 技能的本機唯讀索引。"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from inventory_skills import iter_skill_files, parse_frontmatter, tokenize


QUERY_EXPANSIONS = [
    (
        ("技能組合", "技能棧", "技能包", "配齊", "skill stack", "一套skills", "一套 skills"),
        "agent-skill-stack build curate skill stack capability workflow project profile local index compare conflicts install 組合 技能棧 能力 工作流 專案",
    ),
    (
        ("找一個", "找個", "找一款", "find a skill", "有沒有skill", "有沒有 skill", "有沒有能"),
        "find-skills find skills discover install common capability 尋找 單個 技能",
    ),
    (
        ("去ai", "ai味", "humanize", "natural writing", "文風", "自然一點"),
        "humanizer humanize writing rewrite natural style tone voice 文案 改寫 自然 文風",
    ),
    (
        ("事實核查", "fact check", "引用", "citation", "可信"),
        "fact check verify evidence citation grounded accuracy 核查 引用 證據 準確",
    ),
    (
        ("合規", "compliance", "版權", "copyright", "規則"),
        "compliance policy copyright legal safety audit 合規 版權 規則 審核",
    ),
    (
        ("調研", "research", "對標", "競品", "蒐集"),
        "research search collect compare benchmark competitor evidence 調研 搜尋 收集 對標 競品",
    ),
    (
        ("發布", "publish", "定時", "schedule"),
        "publish schedule post upload automation approval 發布 定時 上傳 自動化 審批",
    ),
    (
        ("整理", "入庫", "知識庫", "organize", "knowledge base"),
        "organize knowledge base notes database deduplicate structure 整理 入庫 知識庫 去重 結構化",
    ),
]


def utc_iso(timestamp: float | None = None) -> str:
    moment = datetime.fromtimestamp(timestamp, tz=timezone.utc) if timestamp is not None else datetime.now(timezone.utc)
    return moment.isoformat()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temporary = handle.name
    os.replace(temporary, path)


def infer_scope(skill_file: Path, project_root: Path | None) -> str:
    if project_root is not None:
        try:
            skill_file.relative_to(project_root)
            return "project"
        except ValueError:
            pass
    return "global"


def build_record(skill_file: Path, root: Path, project_root: Path | None) -> dict[str, object]:
    text = skill_file.read_text(encoding="utf-8", errors="replace")
    metadata, issues = parse_frontmatter(text[:300_000])
    name = metadata.get("name", "")
    description = metadata.get("description", "")
    headings = [
        re.sub(r"\s+#+$", "", heading).strip()
        for heading in re.findall(r"^#{1,3}\s+(.+)$", text, flags=re.MULTILINE)
    ][:40]
    capability_terms = sorted(tokenize(" ".join([name, description, *headings])))
    if name and skill_file.parent.name != name:
        issues.append(f"目錄名稱 '{skill_file.parent.name}' 與技能名稱 '{name}' 不一致")
    fingerprint = sha256_file(skill_file)
    summary = re.sub(r"\s+", " ", description).strip()
    if len(summary) > 360:
        summary = summary[:357].rstrip() + "..."
    return {
        "id": f"{name or 'invalid'}:{fingerprint[:12]}",
        "name": name,
        "display_name": name.replace("-", " ").strip().title() if name else "Invalid Skill",
        "summary": summary,
        "scope": infer_scope(skill_file, project_root),
        "aliases": capability_terms[:80],
        "capability_terms": capability_terms,
        "headings": headings,
        "last_local_change": utc_iso(skill_file.stat().st_mtime),
        "issues": issues,
        "technical": {
            "source_root": str(root),
            "path": str(skill_file.parent),
            "skill_file_fingerprint": fingerprint,
        },
    }


def build_index(args: argparse.Namespace) -> int:
    project_root = Path(args.project_root).expanduser().resolve() if args.project_root else None
    roots: list[Path] = []
    missing: list[str] = []
    for raw in args.root:
        root = Path(os.path.expandvars(os.path.expanduser(raw))).resolve()
        if root.is_dir():
            roots.append(root)
        else:
            missing.append(str(root))

    records: list[dict[str, object]] = []
    seen: set[Path] = set()
    for root in roots:
        for skill_file in iter_skill_files(root):
            resolved = skill_file.resolve()
            if resolved in seen:
                continue
            seen.add(resolved)
            records.append(build_record(skill_file, root, project_root))
    records.sort(key=lambda item: (str(item.get("name", "")), str(item["technical"]["path"])))

    names: dict[str, list[str]] = {}
    for record in records:
        if record["name"]:
            names.setdefault(str(record["name"]), []).append(str(record["id"]))
    duplicates = {name: ids for name, ids in sorted(names.items()) if len(ids) > 1}

    output = Path(os.path.expandvars(os.path.expanduser(args.output))).resolve()
    payload: dict[str, object] = {
        "schema": 1,
        "generated_at": utc_iso(),
        "roots": [str(root) for root in roots],
        "missing_roots": missing,
        "skills": records,
        "duplicates": duplicates,
        "privacy": "此索引僅儲存技能中繼資料 (metadata)。不包含任何提示、使用歷程記錄或路由回饋。",
    }
    atomic_write_json(output, payload)
    print(json.dumps({
        "status": "built",
        "output": str(output),
        "skills_indexed": len(records),
        "duplicate_names": len(duplicates),
        "missing_roots": missing,
    }, ensure_ascii=False, indent=2))
    return 0


def expanded_query(query: str) -> str:
    lower = query.lower()
    additions = [terms for triggers, terms in QUERY_EXPANSIONS if any(trigger in lower for trigger in triggers)]
    return " ".join([query, *additions])


def score_record(
    record: dict[str, object],
    query: str,
    direct_tokens: set[str],
    expanded_tokens: set[str],
) -> tuple[float, list[str]]:
    name = str(record.get("name", "")).lower()
    summary = str(record.get("summary", "")).lower()
    aliases = set(str(item) for item in record.get("aliases", []))
    capability_terms = set(str(item) for item in record.get("capability_terms", []))
    lower_query = query.lower().strip()
    record_tokens = aliases | capability_terms
    direct_matched = sorted(direct_tokens & record_tokens)
    helper_matched = sorted((expanded_tokens - direct_tokens) & record_tokens)
    matched = [*direct_matched, *helper_matched]

    # 使用者實際輸入的內容權重必須高於通用的查詢擴展詞。
    score = float(len(direct_matched) * 4 + len(helper_matched))
    if lower_query and lower_query == name:
        score += 20
    elif lower_query and lower_query in name:
        score += 10
    if lower_query and lower_query in summary:
        score += 8
    if name and name in direct_tokens:
        score += 18
    elif name and name in expanded_tokens:
        score += 14
    if direct_tokens:
        score += 10 * len(direct_matched) / len(direct_tokens)
    if score > 0 and record.get("scope") == "project":
        score += 1
    if record.get("issues"):
        score -= 2
    return score, matched


def search_index(args: argparse.Namespace) -> int:
    index_path = Path(os.path.expandvars(os.path.expanduser(args.index))).resolve()
    payload = json.loads(index_path.read_text(encoding="utf-8"))
    expanded = expanded_query(args.query)
    direct_tokens = tokenize(args.query)
    expanded_tokens = tokenize(expanded)
    results: list[dict[str, object]] = []
    for record in payload.get("skills", []):
        score, matched = score_record(record, args.query, direct_tokens, expanded_tokens)
        if score <= 0:
            continue
        results.append({
            "name": record.get("name"),
            "display_name": record.get("display_name"),
            "summary": record.get("summary"),
            "scope": record.get("scope"),
            "score": round(score, 3),
            "matched_terms": matched[:20],
            "issues": record.get("issues", []),
            "technical": record.get("technical", {}),
        })
    results.sort(key=lambda item: (-float(item["score"]), str(item["name"])))
    results = results[:args.limit]

    if args.format == "simple":
        for position, result in enumerate(results, start=1):
            scope = "專案內" if result["scope"] == "project" else "全域"
            print(f"{position}. {result['display_name']}（{scope}）— {result['summary']}")
    else:
        print(json.dumps({
            "query": args.query,
            "expanded_query": expanded,
            "results": results,
            "notice": "搜尋分數僅供檢索參考，並非品質或安裝分數。",
        }, ensure_ascii=False, indent=2))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    build = subparsers.add_parser("build", help="建構或重新整理本機技能索引")
    build.add_argument("--root", action="append", required=True, help="技能根目錄；可重複指定")
    build.add_argument("--output", required=True, help="索引 JSON 輸出路徑")
    build.add_argument("--project-root", help="選用的專案根目錄，用於標記專案範圍的技能")
    build.set_defaults(handler=build_index)

    search = subparsers.add_parser("search", help="搜尋先前建構的本機技能索引")
    search.add_argument("--index", required=True, help="索引 JSON 路徑")
    search.add_argument("--query", required=True, help="自然語言能力查詢詞")
    search.add_argument("--limit", type=int, default=10)
    search.add_argument("--format", choices=("json", "simple"), default="json")
    search.set_defaults(handler=search_index)

    args = parser.parse_args()
    return int(args.handler(args))


if __name__ == "__main__":
    raise SystemExit(main())
