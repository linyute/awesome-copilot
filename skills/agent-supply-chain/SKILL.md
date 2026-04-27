---
name: agent-supply-chain
description: |
  驗證 AI 代理 (Agent) 插件、工具與依賴項的供應鏈完整性。在以下情況使用此技能：
  - 為代理插件或工具套件產生 SHA-256 完整性資訊清單
  - 驗證安裝的插件是否與其發佈的資訊清單相符
  - 偵測代理工具目錄中遭竄改、修改或未追蹤的檔案
  - 稽核代理元件的依賴項固定 (Pinning) 與版本政策
  - 為代理插件晉級 (開發 → 測試 → 生產) 建立來源證明 (Provenance) 鏈
  - 任何如「驗證插件完整性」、「產生資訊清單」、「檢查供應鏈」或「簽署此插件」的請求
---

# 代理供應鏈完整性

為 AI 代理插件與工具產生並驗證完整性資訊清單。偵測竄改、強制執行版本固定，並建立供應鏈來源證明。

## 概觀

代理插件與 MCP 伺服器面臨與 npm 套件或容器映像檔相同的供應鏈風險 — 但目前生態系統中尚無與 npm 來源證明、Sigstore 或 SLSA 對等的機制。此技能填補了這一空白。

```
插件目錄 → 雜湊所有檔案 (SHA-256) → 產生 INTEGRITY.json
                                                    ↓
稍後：插件目錄 → 重新雜湊檔案 → 與 INTEGRITY.json 進行比較
                                                    ↓
                                          符合？ 已驗證 (VERIFIED) : 遭竄改 (TAMPERED)
```

## 何時使用

- 在將插件從開發環境晉級至生產環境之前
- 在對插件 PR 進行程式碼審查期間
- 作為 CI 步驟，用以核實審查後沒有檔案被修改
- 在稽核第三方代理工具或 MCP 伺服器時
- 建立具有完整性要求的插件市集時

---

## 模式 1：產生完整性資訊清單

建立一個包含所有插件檔案 SHA-256 雜湊值的決定性 `INTEGRITY.json`。

```python
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

EXCLUDE_DIRS = {".git", "__pycache__", "node_modules", ".venv", ".pytest_cache"}
EXCLUDE_FILES = {".DS_Store", "Thumbs.db", "INTEGRITY.json"}

def hash_file(path: Path) -> str:
    """計算檔案的 SHA-256 十六進位摘要。"""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def generate_manifest(plugin_dir: str) -> dict:
    """為插件目錄產生完整性資訊清單。"""
    root = Path(plugin_dir)
    files = {}

    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if path.name in EXCLUDE_FILES:
            continue
        if any(part in EXCLUDE_DIRS for part in path.relative_to(root).parts):
            continue
        rel = path.relative_to(root).as_posix()
        files[rel] = hash_file(path)

    # 鏈式雜湊：按排序順序連接的所有檔案雜湊值的 SHA-256
    chain = hashlib.sha256()
    for key in sorted(files.keys()):
        chain.update(files[key].encode("ascii"))

    manifest = {
        "plugin_name": root.name,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "algorithm": "sha256",
        "file_count": len(files),
        "files": files,
        "manifest_hash": chain.hexdigest(),
    }
    return manifest

# 產生並儲存
manifest = generate_manifest("my-plugin/")
Path("my-plugin/INTEGRITY.json").write_text(
    json.dumps(manifest, indent=2) + "\n"
)
print(f"已產生資訊清單：{manifest['file_count']} 個檔案，"
      f"雜湊值：{manifest['manifest_hash'][:16]}...")
```

**輸出 (`INTEGRITY.json`)：**
```json
{
  "plugin_name": "my-plugin",
  "generated_at": "2026-04-01T03:00:00+00:00",
  "algorithm": "sha256",
  "file_count": 12,
  "files": {
    ".claude-plugin/plugin.json": "a1b2c3d4...",
    "README.md": "e5f6a7b8...",
    "skills/search/SKILL.md": "c9d0e1f2...",
    "agency.json": "3a4b5c6d..."
  },
  "manifest_hash": "7e8f9a0b1c2d3e4f..."
}
```

---

## 模式 2：驗證完整性

檢查目前的檔案是否與資訊清單相符。

```python
# 需要：上述模式 1 中的 hash_file() 與 generate_manifest()
import json
from pathlib import Path

def verify_manifest(plugin_dir: str) -> tuple[bool, list[str]]:
    """根據 INTEGRITY.json 驗證插件檔案。"""
    root = Path(plugin_dir)
    manifest_path = root / "INTEGRITY.json"

    if not manifest_path.exists():
        return False, ["找不到 INTEGRITY.json"]

    manifest = json.loads(manifest_path.read_text())
    recorded = manifest.get("files", {})
    errors = []

    # 檢查記錄的檔案
    for rel_path, expected_hash in recorded.items():
        full = root / rel_path
        if not full.exists():
            errors.append(f"缺失 (MISSING)：{rel_path}")
            continue
        actual = hash_file(full)
        if actual != expected_hash:
            errors.append(f"已修改 (MODIFIED)：{rel_path}")

    # 檢查新的未追蹤檔案
    current = generate_manifest(plugin_dir)
    for rel_path in current["files"]:
        if rel_path not in recorded:
            errors.append(f"未追蹤 (UNTRACKED)：{rel_path}")

    return len(errors) == 0, errors

# 驗證
passed, errors = verify_manifest("my-plugin/")
if passed:
    print("已驗證：所有檔案皆與資訊清單相符")
else:
    print(f"失敗：發現 {len(errors)} 個問題")
    for e in errors:
        print(f"  {e}")
```

**遭竄改插件的輸出範例：**
```
失敗：發現 3 個問題
  已修改 (MODIFIED)：skills/search/SKILL.md
  缺失 (MISSING)：agency.json
  未追蹤 (UNTRACKED)：backdoor.py
```

---

## 模式 3：依賴項版本稽核

檢查代理依賴項是否使用固定的版本。

```python
import re

def audit_versions(config_path: str) -> list[dict]:
    """稽核組態檔案中的依賴項版本固定情況。"""
    findings = []
    path = Path(config_path)
    content = path.read_text()

    if path.name == "package.json":
        data = json.loads(content)
        for section in ("dependencies", "devDependencies"):
            for pkg, ver in data.get(section, {}).items():
                if ver.startswith("^") or ver.startswith("~") or ver == "*" or ver == "latest":
                    findings.append({
                        "package": pkg,
                        "version": ver,
                        "severity": "高 (HIGH)" if ver in ("*", "latest") else "中 (MEDIUM)",
                        "fix": f'固定至精確版本："{pkg}": "{ver.lstrip("^~")}"'
                    })

    elif path.name in ("requirements.txt", "pyproject.toml"):
        for line in content.splitlines():
            line = line.strip()
            if ">=" in line and "<" not in line:
                findings.append({
                    "package": line.split(">=")[0].strip(),
                    "version": line,
                    "severity": "中 (MEDIUM)",
                    "fix": f"新增上限值：{line},<下一個主要版本"
                })

    return findings
```

---

## 模式 4：晉級閘口 (Promotion Gate)

在將插件晉級至生產環境前，將完整性驗證作為一道閘口。

```python
def promotion_check(plugin_dir: str) -> dict:
    """檢查插件是否已準備好進行生產環境晉級。"""
    checks = {}

    # 1. 完整性資訊清單存在且通過驗證
    passed, errors = verify_manifest(plugin_dir)
    checks["integrity"] = {
        "passed": passed,
        "errors": errors
    }

    # 2. 必要檔案存在
    root = Path(plugin_dir)
    required = ["README.md"]
    missing = [f for f in required if not (root / f).exists()]

    # 要求至少有一個插件資訊清單 (支援兩種配置)
    manifest_paths = [
        root / ".github/plugin/plugin.json",
        root / ".claude-plugin/plugin.json",
    ]
    if not any(p.exists() for p in manifest_paths):
        missing.append(".github/plugin/plugin.json (或 .claude-plugin/plugin.json)")

    checks["required_files"] = {
        "passed": len(missing) == 0,
        "missing": missing
    }

    # 3. 無未固定的依賴項
    mcp_path = root / ".mcp.json"
    if mcp_path.exists():
        config = json.loads(mcp_path.read_text())
        unpinned = []
        for server in config.get("mcpServers", {}).values():
            if isinstance(server, dict):
                for arg in server.get("args", []):
                    if isinstance(arg, str) and "@latest" in arg:
                        unpinned.append(arg)
        checks["pinned_deps"] = {
            "passed": len(unpinned) == 0,
            "unpinned": unpinned
        }

    # 整體評估
    all_passed = all(c["passed"] for c in checks.values())
    return {"ready": all_passed, "checks": checks}

result = promotion_check("my-plugin/")
if result["ready"]:
    print("插件已準備好進行生產環境晉級")
else:
    print("插件尚未準備好：")
    for name, check in result["checks"].items():
        if not check["passed"]:
            print(f"  失敗：{name}")
```

---

## CI 整合

新增至您的 GitHub Actions 工作流程：

```yaml
- name: Verify plugin integrity
  run: |
    PLUGIN_DIR="${{ matrix.plugin || '.' }}"
    cd "$PLUGIN_DIR"
    python -c "
    from pathlib import Path
    import json, hashlib, sys

    def hash_file(p):
        h = hashlib.sha256()
        with open(p, 'rb') as f:
            for c in iter(lambda: f.read(8192), b''):
                h.update(c)
        return h.hexdigest()

    manifest = json.loads(Path('INTEGRITY.json').read_text())
    errors = []
    for rel, expected in manifest['files'].items():
        p = Path(rel)
        if not p.exists():
            errors.append(f'缺失 (MISSING)：{rel}')
        elif hash_file(p) != expected:
            errors.append(f'已修改 (MODIFIED)：{rel}')
    if errors:
        for e in errors:
            print(f'::error::{e}')
        sys.exit(1)
    print(f'已驗證 {len(manifest[\"files\"])} 個檔案')
    "
```

---

## 最佳實務

| 做法 | 理由 |
|----------|-----------|
| **在程式碼審查後產生資訊清單** | 確保審查過的程式碼與生產環境程式碼一致 |
| **在 PR 中包含資訊清單** | 審查者可以核實被雜湊的內容 |
| **在部署前於 CI 中驗證** | 捕捉審查後的任何修改 |
| **鏈式雜湊以提供防竄改證據** | 單一雜湊值即可代表整個插件狀態 |
| **排除建構產出物** | 僅雜湊原始碼檔案 — 排除 .git, __pycache__, node_modules |
| **固定所有依賴項版本** | 未固定的依賴項 = 每次安裝時程式碼可能不同 |

---

## 相關資源

- [OpenSSF SLSA](https://slsa.dev/) — 軟體成品供應鏈層級
- [npm 來源證明 (Provenance)](https://docs.npmjs.com/generating-provenance-statements) — 基於 Sigstore 的套件來源證明
- [代理治理工具箱 (Agent Governance Toolkit)](https://github.com/microsoft/agent-governance-toolkit) — 包含完整性驗證與插件簽署
- [OWASP ASI-09：供應鏈完整性](https://owasp.org/www-project-agentic-ai-threats/)
