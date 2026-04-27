---
name: mcp-security-audit
description: |
  稽核 MCP (Model Context Protocol) 伺服器設定的安全問題。當出現以下情況時使用此技能：
  - 檢查 .mcp.json 檔案中的安全風險
  - 檢查 MCP 伺服器參數 (args) 是否包含寫死的秘密資訊或 shell 注入模式
  - 驗證 MCP 伺服器是否使用固定版本（而非 @latest）
  - 偵測 MCP 伺服器設定中未固定版本的相依性
  - 稽核專案註冊了哪些 MCP 伺服器，以及它們是否在核准清單中
  - 檢查 MCP 設定中是否使用了環境變數而非寫死的憑證
  - 任何諸如「我的 MCP 設定安全嗎？」、「稽核我的 MCP 伺服器」或「檢查 .mcp.json」的請求
  關鍵字：[mcp, security, audit, secrets, shell-injection, supply-chain, governance]
---

# MCP 安全性稽核 (MCP Security Audit)

稽核 MCP 伺服器設定中的安全性問題 — 秘密資訊外洩、shell 注入、未固定版本的相依性以及未經核准的伺服器。

## 概覽

MCP 伺服器讓代理人具備直接存取外部系統工具的權限。錯誤配置的 `.mcp.json` 可能會外洩憑證、允許 shell 注入或連線至不受信任的伺服器。此技能可在這些問題進入生產環境前將其攔截。

```
.mcp.json → 解析伺服器 → 檢查每個伺服器：
  1. 參數/環境變數中是否有秘密資訊？
  2. 是否有 shell 注入模式？
  3. 是否使用未固定版本 (@latest)？
  4. 是否有危險指令 (eval, bash -c)？
  5. 伺服器是否在核准清單中？
→ 產生報告
```

## 何時使用

- 檢閱專案中的任何 `.mcp.json` 檔案
- 在專案中導入新的 MCP 伺服器時
- 在單一儲存庫 (monorepo) 或插件市集中稽核所有 MCP 伺服器
- 針對 MCP 設定變更進行預提交 (pre-commit) 檢查
- 針對代理人工具設定進行安全性檢閱

---

## 稽核檢查 1：寫死的秘密資訊 (Hardcoded Secrets)

掃描 MCP 伺服器參數 (args) 與環境變數 (env) 值，檢查是否有寫死的憑證。

```python
import json
import re
from pathlib import Path

# 秘密資訊模式
SECRET_PATTERNS = [
    (r'(?i)(api[_-]?key|token|secret|password|credential)\s*[:=]\s*["\'][^"\']{8,}', "寫死的秘密資訊"),
    (r'(?i)Bearer\s+[A-Za-z0-9\-._~+/]+=*', "寫死的 Bearer 權杖"),
    (r'(?i)(ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9]{30,}', "GitHub 權杖"),
    (r'sk-[A-Za-z0-9]{20,}', "OpenAI API 金鑰"),
    (r'AKIA[0-9A-Z]{16}', "AWS 存取金鑰"),
    (r'-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----', "私鑰"),
]

def check_secrets(mcp_config: dict) -> list[dict]:
    """檢查 MCP 伺服器設定中是否有寫死的秘密資訊。"""
    findings = []
    raw = json.dumps(mcp_config)
    for pattern, description in SECRET_PATTERNS:
        matches = re.findall(pattern, raw)
        if matches:
            findings.append({
                "severity": "CRITICAL",
                "check": "hardcoded-secret",
                "message": f"在 MCP 設定中發現 {description}",
                "evidence": f"比對到的模式：{pattern}",
                "fix": "請改用環境變數引用：${ENV_VAR_NAME}"
            })
    return findings
```

**良好做法 — 使用環境變數引用：**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "API_KEY": "${MY_API_KEY}",
        "DB_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

**不良做法 — 寫死的憑證：**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["server.js", "--api-key", "sk-abc123realkey456"],
      "env": {
        "DB_URL": "postgresql://admin:password123@prod-db:5432/main"
      }
    }
  }
}
```

---

## 稽核檢查 2：Shell 注入模式

偵測 MCP 伺服器參數中危險的指令模式。

```python
import json
import re

# 危險模式
DANGEROUS_PATTERNS = [
    (r'\$\(', "指令替換 $(...)"),
    (r'`[^`]+`', "反引號指令替換"),
    (r';\s*\w', "使用分號的指令鏈接"),
    (r'\|\s*\w', "管線傳輸至另一個指令"),
    (r'&&\s*\w', "使用 && 的指令鏈接"),
    (r'\|\|\s*\w', "使用 || 的指令鏈接"),
    (r'(?i)eval\s', "使用 eval"),
    (r'(?i)bash\s+-c\s', "執行 bash -c"),
    (r'(?i)sh\s+-c\s', "執行 sh -c"),
    (r'>\s*/dev/tcp/', "TCP 重新導向（反向 shell 模式）"),
    (r'curl\s+.*\|\s*(ba)?sh', "透過管線將 curl 內容傳給 shell"),
]

def check_shell_injection(server_config: dict) -> list[dict]:
    """檢查 MCP 伺服器參數中的 shell 注入風險。"""
    findings = []
    args_text = json.dumps(server_config.get("args", []))
    for pattern, description in DANGEROUS_PATTERNS:
        if re.search(pattern, args_text):
            findings.append({
                "severity": "HIGH",
                "check": "shell-injection",
                "message": f"MCP 伺服器參數中存在危險模式：{description}",
                "fix": "請直接執行指令，不要使用 shell 插值"
            })
    return findings
```

---

## 稽核檢查 3：未固定版本的相依性

標記在套件引用中使用 `@latest` 的 MCP 伺服器。

```python
def check_pinned_versions(server_config: dict) -> list[dict]:
    """檢查 MCP 伺服器相依性是否使用固定版本而非 @latest。"""
    findings = []
    args = server_config.get("args", [])
    for arg in args:
        if isinstance(arg, str):
            if "@latest" in arg:
                findings.append({
                    "severity": "MEDIUM",
                    "check": "unpinned-dependency",
                    "message": f"未固定版本的相依性：{arg}",
                    "fix": f"請固定至特定版本：{arg.replace('@latest', '@1.2.3')}"
                })
            # 不含版本號的 npx 套件
            if arg.startswith("-y") or (not "@" in arg and not arg.startswith("-")):
                pass  # npx 旗標或普通參數，可接受
    # 檢查是否在沒有 -y 的情況下使用 npx（CI 中的互動式提示）
    command = server_config.get("command", "")
    if command == "npx" and "-y" not in args:
        findings.append({
            "severity": "LOW",
            "check": "npx-interactive",
            "message": "不帶 -y 旗標的 npx 可能會在 CI 中出現互動式提示",
            "fix": "請加入 -y 旗標：npx -y package-name"
        })
    return findings
```

**良好做法 — 固定版本：**
```json
{ "args": ["-y", "my-mcp-server@2.1.0"] }
```

**不良做法 — 未固定版本：**
```json
{ "args": ["-y", "my-mcp-server@latest"] }
```

---

## 稽核檢查 4：完整稽核執行器

將所有檢查項結合成單次稽核。

```python
def audit_mcp_config(mcp_path: str) -> dict:
    """對 .mcp.json 檔案進行完整的安全性稽核。"""
    path = Path(mcp_path)
    if not path.exists():
        return {"error": f"找不到 {mcp_path}"}

    config = json.loads(path.read_text(encoding="utf-8"))
    servers = config.get("mcpServers", {})
    results = {"file": str(path), "servers": {}, "summary": {}}
    total_findings = []

    # 在整個設定層級執行一次秘密資訊檢查（而非針對單一伺服器）
    config_level_findings = check_secrets(config)
    total_findings.extend(config_level_findings)

    for name, server_config in servers.items():
        if not isinstance(server_config, dict):
            continue
        findings = []
        findings.extend(check_shell_injection(server_config))
        findings.extend(check_pinned_versions(server_config))
        results["servers"][name] = {
            "command": server_config.get("command", ""),
            "findings": findings,
        }
        total_findings.extend(findings)

    # 摘要
    by_severity = {}
    for f in total_findings:
        sev = f["severity"]
        by_severity[sev] = by_severity.get(sev, 0) + 1

    results["summary"] = {
        "total_servers": len(servers),
        "total_findings": len(total_findings),
        "by_severity": by_severity,
        "passed": len(total_findings) == 0,
    }
    return results
```

**用法：**
```python
results = audit_mcp_config(".mcp.json")
if not results["summary"]["passed"]:
    for server, data in results["servers"].items():
        for finding in data["findings"]:
            print(f"[{finding['severity']}] {server}: {finding['message']}")
            print(f"  修正：{finding['fix']}")
```

---

## 輸出格式

```
MCP 安全性稽核 — .mcp.json
═══════════════════════════════
已掃描伺服器數量：5
發現問題：3 個（1 個嚴重 (CRITICAL), 1 個高風險 (HIGH), 1 個中等風險 (MEDIUM)）

[CRITICAL] my-api-server: 在 MCP 設定中發現寫死的秘密資訊
  修正：請改用環境變數引用：${ENV_VAR_NAME}

[HIGH] data-processor: MCP 伺服器參數中存在危險模式：執行 bash -c
  修正：請直接執行指令，不要使用 shell 插值

[MEDIUM] analytics: 未固定版本的相依性：analytics-mcp@latest
  修正：請固定至特定版本：analytics-mcp@2.1.0
```

---

## 相關資源

- [MCP 規範 (MCP Specification)](https://modelcontextprotocol.io/)
- [代理人治理工具箱 (Agent Governance Toolkit)](https://github.com/microsoft/agent-governance-toolkit) — 帶有 MCP 信任代理的完整治理框架
- [OWASP ASI-02：不安全的工具使用 (Insecure Tool Use)](https://owasp.org/www-project-agentic-ai-threats/)
