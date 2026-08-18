#!/usr/bin/env python3
"""預覽或安裝已下載並完成審查的技能目錄，不進行覆寫。"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path


NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def parse_name(skill_file: Path) -> str:
    lines = skill_file.read_text(encoding="utf-8", errors="strict").splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"{skill_file}: 缺少開頭 frontmatter 定界符")
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    if end is None:
        raise ValueError(f"{skill_file}: 缺少結尾 frontmatter 定界符")
    for line in lines[1:end]:
        match = re.match(r"^name:\s*([^#]+?)\s*$", line)
        if match:
            name = match.group(1).strip().strip('"\'')
            if len(name) > 63 or not NAME_RE.fullmatch(name):
                raise ValueError(f"{skill_file}: 無效的技能名稱 {name!r}")
            return name
    raise ValueError(f"{skill_file}: 缺少 name")


def collect_files(source: Path) -> list[Path]:
    files: list[Path] = []
    for current, dirs, filenames in os.walk(source, followlinks=False):
        current_path = Path(current)
        for dirname in dirs:
            path = current_path / dirname
            if path.is_symlink():
                raise ValueError(f"不允許符號連結目錄：{path}")
        for filename in filenames:
            path = current_path / filename
            if path.is_symlink():
                raise ValueError(f"不允許符號連結檔案：{path}")
            if not path.is_file():
                raise ValueError(f"不支援的檔案系統項目：{path}")
            files.append(path)
    return sorted(files, key=lambda path: str(path.relative_to(source)))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def source_record(source: Path, dest: Path) -> dict[str, object]:
    if source.is_symlink() or not source.is_dir():
        raise ValueError(f"來源不是一般目錄：{source}")
    skill_file = source / "SKILL.md"
    if not skill_file.is_file():
        raise ValueError(f"來源缺少 SKILL.md：{source}")
    name = parse_name(skill_file)
    files = collect_files(source)
    file_records = [
        {
            "path": str(path.relative_to(source)),
            "sha256": sha256_file(path),
            "bytes": path.stat().st_size,
        }
        for path in files
    ]
    aggregate = hashlib.sha256()
    for item in file_records:
        aggregate.update(str(item["path"]).encode("utf-8"))
        aggregate.update(str(item["sha256"]).encode("ascii"))
    return {
        "name": name,
        "source": str(source),
        "target": str(dest / name),
        "content_sha256": aggregate.hexdigest(),
        "file_count": len(file_records),
        "files": file_records,
    }


def atomic_write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temp_name = handle.name
    os.replace(temp_name, path)


def apply_install(records: list[dict[str, object]], dest: Path) -> list[str]:
    dest.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".agent-skill-stack-", dir=dest))
    created: list[str] = []
    try:
        for record in records:
            source = Path(str(record["source"]))
            staged = staging / str(record["name"])
            shutil.copytree(source, staged, symlinks=False)
            if parse_name(staged / "SKILL.md") != record["name"]:
                raise RuntimeError(f"{record['name']} 的暫存驗證失敗")
        for record in records:
            staged = staging / str(record["name"])
            target = Path(str(record["target"]))
            os.replace(staged, target)
            created.append(str(target))
        return created
    finally:
        shutil.rmtree(staging, ignore_errors=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", action="append", required=True, help="已完成審查的本機技能目錄；可重複指定")
    parser.add_argument("--dest", required=True, help="目的地技能根目錄")
    parser.add_argument("--manifest", required=True, help="鎖定/預覽資訊清單的路徑")
    parser.add_argument("--apply", action="store_true", help="驗證後進行複製；預設為模擬執行 (dry-run)")
    parser.add_argument(
        "--record-existing",
        action="store_true",
        help="當每個來源已位於其確切的目的地時記錄鎖定資訊清單",
    )
    args = parser.parse_args()

    if args.apply and args.record_existing:
        raise SystemExit("--apply 與 --record-existing 互斥")

    dest = Path(os.path.expandvars(os.path.expanduser(args.dest))).resolve()
    manifest = Path(os.path.expandvars(os.path.expanduser(args.manifest))).resolve()
    sources = [Path(os.path.expandvars(os.path.expanduser(raw))).resolve() for raw in args.source]

    records = [source_record(source, dest) for source in sources]
    names = [str(record["name"]) for record in records]
    if len(names) != len(set(names)):
        raise SystemExit("選定的來源中存在重複的技能名稱")

    existing = [str(record["target"]) for record in records if Path(str(record["target"])).exists()]
    if args.record_existing:
        mismatched = [
            str(record["name"])
            for record in records
            if Path(str(record["source"])).resolve() != Path(str(record["target"])).resolve()
        ]
        if mismatched:
            raise SystemExit("--record-existing 要求以下項目的來源必須等於目的地：" + ", ".join(mismatched))
    elif existing:
        raise SystemExit("拒絕覆寫現有的目的地：" + ", ".join(existing))

    payload: dict[str, object] = {
        "schema": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mode": "record-existing" if args.record_existing else ("apply" if args.apply else "dry-run"),
        "destination": str(dest),
        "skills": records,
        "created": [],
        "notice": "在使用此安裝程式前必須先下載並審查來源。絕不覆寫現有的目的地。",
    }

    if args.record_existing:
        payload["status"] = "recorded"
    elif args.apply:
        payload["created"] = apply_install(records, dest)
        payload["status"] = "installed"
    else:
        payload["status"] = "planned"

    atomic_write_json(manifest, payload)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
