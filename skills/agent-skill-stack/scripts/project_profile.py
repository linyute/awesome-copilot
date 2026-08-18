#!/usr/bin/env python3
"""預覽或建立專案本地的技能堆疊 (Skill Stack) 路由設定檔 (profile)。"""

from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path


SKILL_NAME = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def validate_skill_name(value: str) -> str:
    if not SKILL_NAME.fullmatch(value):
        raise argparse.ArgumentTypeError(f"無效的技能名稱：{value!r}")
    return value


def parse_route(raw: str, active: set[str]) -> dict[str, object]:
    if "=" not in raw:
        raise ValueError(f"路由必須使用 'intent=primary[,helper]' 格式：{raw!r}")
    intent, raw_skills = raw.split("=", 1)
    intent = intent.strip()
    skills = [item.strip() for item in raw_skills.split(",") if item.strip()]
    if not intent or not skills:
        raise ValueError(f"路由缺少意圖 (intent) 或技能 (Skill)：{raw!r}")
    invalid = [name for name in skills if not SKILL_NAME.fullmatch(name)]
    if invalid:
        raise ValueError("路由包含無效的技能名稱：" + ", ".join(invalid))
    missing = [name for name in skills if name not in active]
    if missing:
        raise ValueError("路由參照了未列在 --skill 中的技能：" + ", ".join(missing))
    return {
        "intent": intent,
        "primary": skills[0],
        "supporting": skills[1:],
    }


def atomic_write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temporary = handle.name
    os.replace(temporary, path)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, help="專案根目錄")
    parser.add_argument("--name", required=True, help="設定檔名稱")
    parser.add_argument("--skill", action="append", required=True, type=validate_skill_name, help="啟用的技能；可重複指定")
    parser.add_argument("--route", action="append", default=[], help="意圖路由：intent=primary[,helper]")
    parser.add_argument("--strict", action="store_true", help="不自動在此設定檔之外進行搜尋")
    parser.add_argument("--apply", action="store_true", help="寫入設定檔；預設僅預覽")
    parser.add_argument("--update", action="store_true", help="替換現有的設定檔；需要搭配 --apply")
    args = parser.parse_args()

    if args.update and not args.apply:
        raise SystemExit("--update 需要搭配 --apply")

    project = Path(os.path.expandvars(os.path.expanduser(args.project))).resolve()
    if project.is_symlink() or not project.is_dir():
        raise SystemExit(f"專案不是一般目錄：{project}")

    active_skills = list(dict.fromkeys(args.skill))
    active_set = set(active_skills)
    try:
        routes = [parse_route(raw, active_set) for raw in args.route]
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc

    profile_path = project / ".codex" / "skill-stack.json"
    if profile_path.exists() and not args.update:
        raise SystemExit(f"設定檔已存在；拒絕覆寫：{profile_path}")

    payload: dict[str, object] = {
        "schema": 1,
        "profile_name": args.name.strip(),
        "project_root": str(project),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "active_skills": active_skills,
        "routes": routes,
        "routing": {
            "preference": "profile-first",
            "outside_search": "never" if args.strict else "only-for-uncovered-capabilities",
        },
        "privacy": "此設定檔僅儲存路由偏好設定。不包含任何提示、使用歷程記錄或回饋記錄。",
        "technical_note": "設定檔用於引導路由。在客戶端支援的情況下，真正的嚴格範疇劃分需要專案本地技能安裝。",
    }

    if args.apply:
        atomic_write_json(profile_path, payload)
        status = "updated" if args.update else "created"
    else:
        status = "preview"

    print(json.dumps({
        "status": status,
        "profile_path": str(profile_path),
        "profile": payload,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
