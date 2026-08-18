#!/usr/bin/env python3
"""適用於 GitHub Copilot 編碼代理的 attester-import-check hook (preToolUse)。

透過 stdin 讀取 JSON 格式的工具呼叫 ({"toolName", "toolInput"})，
從正在引入的程式碼中擷取套件匯入，並對照 attester.dev 存在預言機檢查每個
名稱（免金鑰的免費層級，每個用戶端 IP 每天 25 次呼叫）。
若確定「不存在」則以 exit 1 封鎖。
配額耗盡、離線及承載資料問題會安全開放 (exit 0)：防護機制
若封鎖了錯誤的操作，比漏掉一個還要糟糕。

僅使用標準函式庫。回覆會快取於 ~/.cache/attester-import-check/cache.json
（存在保留 30 天，不存在保留 1 天），因此重複編輯不會消耗配額。

環境變數：
    ATTESTER_MODE=block|warn          預設為 block（warn 絕不封鎖）
    ATTESTER_BASE_URL                 預設為 https://attester.dev
    ATTESTER_IMPORT_CHECK_NO_CACHE=1  略過回覆快取
"""

from __future__ import annotations

import ast
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

BASE_URL = os.environ.get("ATTESTER_BASE_URL", "https://attester.dev").rstrip("/")
CACHE_PATH = Path.home() / ".cache" / "attester-import-check" / "cache.json"
TTL_POSITIVE_S = 30 * 24 * 3600
TTL_NEGATIVE_S = 24 * 3600
TIMEOUT_S = 10.0

PY_EXTS = {".py", ".pyi"}
JS_EXTS = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".mts", ".cts"}
NODE_BUILTINS = frozenset(
    """
    assert async_hooks buffer child_process cluster console constants crypto
    dgram diagnostics_channel dns domain events fs http http2 https inspector
    module net os path perf_hooks process punycode querystring readline repl
    sea sqlite stream string_decoder sys test timers tls trace_events tty url
    util v8 vm wasi worker_threads zlib
    """.split()
)
PATH_KEYS = {"path", "filePath", "file_path", "filename", "file"}

_JS_SPEC_RE = re.compile(
    r"""
      \bfrom\s*['"]([^'"]+)['"]
    | \bimport\s*['"]([^'"]+)['"]
    | \brequire\(\s*['"]([^'"]+)['"]\s*\)
    | \bimport\(\s*['"]([^'"]+)['"]\s*\)
    """,
    re.VERBOSE,
)


def extract_python(source: str) -> set[str]:
    try:
        tree = ast.parse(source)
    except (SyntaxError, ValueError):
        return set()
    names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names.update(a.name.split(".")[0] for a in node.names)
        elif isinstance(node, ast.ImportFrom):
            if not node.level and node.module:
                names.add(node.module.split(".")[0])
    stdlib = sys.stdlib_module_names
    return {n for n in names if n not in stdlib}


def js_package(spec: str) -> str | None:
    if not spec or spec.startswith((".", "/")) or spec.startswith("node:"):
        return None
    parts = spec.split("/")
    name = f"{parts[0]}/{parts[1]}" if spec.startswith("@") and len(parts) > 1 and parts[1] else parts[0]
    return None if name in NODE_BUILTINS else name


def extract_js(source: str) -> set[str]:
    names = set()
    for match in _JS_SPEC_RE.finditer(source):
        name = js_package(next(g for g in match.groups() if g is not None))
        if name:
            names.add(name)
    return names


def walk_strings(node):
    """為巢狀 JSON 值中的每個字串產出 (key, value)。"""
    if isinstance(node, dict):
        for key, value in node.items():
            yield from walk_strings(value) if not isinstance(value, str) else [(key, value)]
    elif isinstance(node, list):
        for item in node:
            yield from walk_strings(item)


def load_cache() -> dict:
    if os.environ.get("ATTESTER_IMPORT_CHECK_NO_CACHE"):
        return {}
    try:
        return json.loads(CACHE_PATH.read_text())
    except (OSError, ValueError):
        return {}


def save_cache(cache: dict) -> None:
    if os.environ.get("ATTESTER_IMPORT_CHECK_NO_CACHE"):
        return
    try:
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        CACHE_PATH.write_text(json.dumps(cache))
    except OSError:
        pass


def oracle(package: str, ecosystem: str, cache: dict):
    """True/False 回覆，或在未檢查（離線）時為 None。引發 SystemExit-free
    的 sentinel 字串 'quota' 會透過下方的快取中立標記回傳。"""
    key = f"{ecosystem}:{package}"
    entry = cache.get(key)
    now = time.time()
    if entry is not None:
        ttl = TTL_POSITIVE_S if entry.get("exists") else TTL_NEGATIVE_S
        if now - entry.get("ts", 0) < ttl:
            return entry.get("exists"), entry.get("adjacent_to") or []
    body = json.dumps({"ecosystem": ecosystem, "name": package}).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/demo/v1/package/exists",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
            info = json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        if exc.code == 429:
            return "quota", []
        return None, []
    except Exception:
        return None, []
    if "exists" not in info:
        return None, []
    cache[key] = {
        "exists": bool(info["exists"]),
        "adjacent_to": info.get("adjacent_to") or [],
        "ts": now,
    }
    save_cache(cache)
    return bool(info["exists"]), info.get("adjacent_to") or []


def load_allowlist() -> set[str]:
    path = Path.cwd() / ".attester-allowlist"
    if not path.is_file():
        return set()
    return {
        line.strip()
        for line in path.read_text(errors="replace").splitlines()
        if line.strip() and not line.strip().startswith("#")
    }


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (ValueError, OSError):
        return 0
    tool_input = payload.get("toolInput") or payload.get("tool_input") or {}

    filename = ""
    code_chunks: list[str] = []
    for key, value in walk_strings(tool_input):
        if not filename and key in PATH_KEYS and "/" in value or (
            not filename and key in PATH_KEYS and "." in value
        ):
            filename = value
        if len(value) > 15 and ("import" in value or "require(" in value):
            code_chunks.append(value)
    if not code_chunks:
        return 0

    ext = Path(filename).suffix.lower()
    candidates: dict[str, str] = {}  # 套件 -> 生態系統
    if ext in JS_EXTS:
        for chunk in code_chunks:
            for name in extract_js(chunk):
                candidates.setdefault(name, "npm")
    elif ext in PY_EXTS or not ext:
        for chunk in code_chunks:
            for name in extract_python(chunk):
                candidates.setdefault(name, "pypi")
        if not ext:  # 未知檔案類型：亦嘗試 JS 風格的匯入
            for chunk in code_chunks:
                for name in extract_js(chunk):
                    candidates.setdefault(name, "npm")
    if not candidates:
        return 0

    allowlist = load_allowlist()
    cache = load_cache()
    findings: list[tuple[str, str, list[str]]] = []
    warn_only = os.environ.get("ATTESTER_MODE", "block").lower() == "warn"
    try:
        for package in sorted(candidates):
            if package in allowlist:
                continue
            answer, adjacent = oracle(package, candidates[package], cache)
            if answer == "quota":
                print(
                    "attester-import-check: attester quota exhausted, unchecked",
                    file=sys.stderr,
                )
                return 0
            if answer is False:
                findings.append((package, candidates[package], adjacent))
    except Exception:
        return 0

    for package, ecosystem, adjacent in findings:
        registry = "PyPI" if ecosystem == "pypi" else "npm"
        msg = f"attester-import-check: '{package}' does not exist on {registry} (attester.dev oracle)."
        if adjacent:
            msg += f" Closest real name: {', '.join(adjacent)}."
        msg += " Remove or fix the import, or add the name to .attester-allowlist if this is a false positive."
        print(msg, file=sys.stderr)
    if findings and not warn_only:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
