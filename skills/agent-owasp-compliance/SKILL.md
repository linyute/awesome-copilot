---
name: agent-owasp-compliance
description: |
  根據 OWASP 代理安全性倡議 (ASI) 前 10 大風險檢查任何 AI 代理 (Agent) 程式碼庫。
  在以下情況使用此技能：
  - 在正式環境部署前評估代理系統的安全形勢
  - 根據 OWASP ASI 2026 標準執行合規性檢查
  - 將現有的安全控制措施與 10 大代理風險進行對照
  - 為安全性審查或稽核產生合規性報告
  - 比較代理框架的安全功能與標準
  - 任何如「我的代理是否符合 OWASP 標準？」、「檢查 ASI 合規性」或「代理安全性稽核」的請求
---

# 代理 OWASP ASI 合規性檢查

根據 OWASP 代理安全性倡議 (ASI) 前 10 大風險 (代理安全形勢的業界標準) 來評估 AI 代理系統。

## 概觀

OWASP ASI 前 10 大風險定義了自主 AI 代理特有的關鍵安全性風險 — 不是指 LLM，也不是聊天機器人，而是會呼叫工具、存取系統並代表使用者行動的代理。此技能會檢查您的代理實作是否解決了每一項風險。

```
程式碼庫 → 針對每項 ASI 控制措施進行掃描：
  ASI-01：提示詞注入防護
  ASI-02：工具使用治理
  ASI-03：代理邊界
  ASI-04：權限提升控制
  ASI-05：信任邊界強制執行
  ASI-06：記錄與稽核
  ASI-07：身分管理
  ASI-08：政策完整性
  ASI-09：供應鏈驗證
  ASI-10：行為監控
→ 產生合規性報告 (已涵蓋 X/10 項)
```

## 10 大風險

| 風險 | 名稱 | 檢查重點 |
|------|------|-----------------|
| ASI-01 | 提示詞注入 | 在呼叫工具前進行輸入驗證，而不僅僅是過濾 LLM 輸出 |
| ASI-02 | 不安全的工具使用 | 工具允許列表 (Allowlist)、參數驗證，禁止執行原始 Shell 指令 |
| ASI-03 | 過度授權 | 能力邊界、範圍限制、最小權限原則 |
| ASI-04 | 未經授權的權限提升 | 在敏感操作前進行權限檢查，禁止自我提升權限 |
| ASI-05 | 信任邊界違規 | 代理之間的信任驗證、已簽署的認證資訊，禁止盲目信任 |
| ASI-06 | 記錄不足 | 為所有工具呼叫提供結構化稽核追蹤，具有防篡改功能的日誌 |
| ASI-07 | 不安全的身分 | 密碼學代理身分，而不僅僅是字串名稱 |
| ASI-08 | 政策繞過 | 決定性的政策強制執行，禁止基於 LLM 的權限檢查 |
| ASI-09 | 供應鏈完整性 | 已簽署的插件/工具、完整性驗證、依賴項稽核 |
| ASI-10 | 行為異常 | 偏移偵測、斷路器、緊急停止開關功能 |

---

## 檢查 ASI-01：提示詞注入防護

尋找在工具執行**之前** (而非 LLM 產生之後) 執行的輸入驗證。

```python
import re
from pathlib import Path

def check_asi_01(project_path: str) -> dict:
    """ASI-01：在到達工具執行之前是否對使用者輸入進行了驗證？"""
    positive_patterns = [
        "input_validation", "validate_input", "sanitize",
        "classify_intent", "prompt_injection", "threat_detect",
        "PolicyEvaluator", "PolicyEngine", "check_content",
    ]
    negative_patterns = [
        r"eval\(", r"exec\(", r"subprocess\.run\(.*shell=True",
        r"os\.system\(",
    ]

    # 掃描 Python 檔案以獲取訊號
    root = Path(project_path)
    positive_matches = []
    negative_matches = []

    for py_file in root.rglob("*.py"):
        content = py_file.read_text(errors="ignore")
        for pattern in positive_patterns:
            if pattern in content:
                positive_matches.append(f"{py_file.name}: {pattern}")
        for pattern in negative_patterns:
            if re.search(pattern, content):
                negative_matches.append(f"{py_file.name}: {pattern}")

    positive_found = len(positive_matches) > 0
    negative_found = len(negative_matches) > 0

    return {
        "risk": "ASI-01",
        "name": "提示詞注入",
        "status": "通過" if positive_found and not negative_found else "失敗",
        "controls_found": positive_matches,
        "vulnerabilities": negative_matches,
        "recommendation": "在工具執行前加入輸入驗證，而不僅僅是過濾輸出"
    }
```

**通過的範例：**
```python
# 良好：在工具執行前進行驗證
result = policy_engine.evaluate(user_input)
if result.action == "deny":
    return "請求已被政策阻擋"
tool_result = await execute_tool(validated_input)
```

**失敗的範例：**
```python
# 不良：使用者輸入直接傳遞給工具
tool_result = await execute_tool(user_input)  # 未經驗證
```

---

## 檢查 ASI-02：不安全的工具使用

確認工具有允許列表、參數驗證，且無不受限制的執行行為。

**搜尋重點：**
- 具有明確允許列表的工具註冊 (非開放式)
- 工具執行前的參數驗證
- 禁止對受使用者控制的輸入執行 `subprocess.run(shell=True)`
- 禁止在沒有沙箱的情況下對代理產生的程式碼執行 `eval()` 或 `exec()`

**通過範例：**
```python
ALLOWED_TOOLS = {"search", "read_file", "create_ticket"}

def execute_tool(name: str, args: dict):
    if name not in ALLOWED_TOOLS:
        raise PermissionError(f"工具 '{name}' 不在允許列表中")
    # 驗證參數...
    return tools[name](**validated_args)
```

---

## 檢查 ASI-03：過度授權

確認代理能力是受限的 — 而非開放式的。

**搜尋重點：**
- 明確的能力列表或執行環 (Execution rings)
- 代理可存取內容的範圍限制
- 套用於工具存取的最小權限原則

**失敗：** 代理預設可存取所有工具。
**通過：** 代理能力定義為固定的允許列表，拒絕未知的工具。

---

## 檢查 ASI-04：未經授權的權限提升

確認代理無法自行提升權限。

**搜尋重點：**
- 敏感操作前的權限層級檢查
- 禁止自我提升模式 (代理更改自己的信任分數或角色)
- 權限提升需要外部證實 (人工或 SRE 見證)

**失敗：** 代理可以修改自己的組態或權限。
**通過：** 權限變更需要頻寬外 (Out-of-band) 的核准 (例如：Ring 0 需要 SRE 證實)。

---

## 檢查 ASI-05：信任邊界違規

在多代理系統中，確認代理在接受指令前會驗證彼此的身分。

**搜尋重點：**
- 代理身分驗證 (DID、已簽署的權杖、API 金鑰)
- 接受委派工作前的信任分數檢查
- 禁止對代理間訊息的盲目信任
- 委派範圍縮減 (子範圍 <= 父範圍)

**通過範例：**
```python
def accept_task(sender_id: str, task: dict):
    trust = trust_registry.get_trust(sender_id)
    if not trust.meets_threshold(0.7):
        raise PermissionError(f"代理 {sender_id} 信任度過低：{trust.current()}")
    if not verify_signature(task, sender_id):
        raise SecurityError("工作簽章驗證失敗")
    return process_task(task)
```

---

## 檢查 ASI-06：記錄不足

確認所有代理行動都會產生結構化、防篡改的稽核項目。

**搜尋重點：**
- 每次工具呼叫的結構化記錄 (不僅僅是列印陳述式)
- 稽核項目包含：時間戳記、代理 ID、工具名稱、參數、結果、政策決策
- 僅限附加 (Append-only) 或雜湊鏈 (Hash-chained) 日誌格式
- 記錄儲存在與代理可寫目錄分開的位置

**失敗：** 代理行動透過 `print()` 記錄或完全未記錄。
**通過：** 帶有鏈雜湊的結構化 JSONL 稽核追蹤，並匯出至安全儲存空間。

---

## 檢查 ASI-07：不安全的身分

確認代理具有密碼學身分，而不僅僅是字串名稱。

**失敗指標：**
- 代理僅透過 `agent_name = "my-agent"` (僅字串) 進行識別
- 代理之間無身分驗證
- 多個代理共用認證資訊

**通過指標：**
- 基於 DID 的身分 (`did:web:`, `did:key:`)
- Ed25519 或類似的密碼學簽署
- 每個代理獨立且具備輪替機制的認證資訊
- 身分繫結至特定能力

---

## 檢查 ASI-08：政策繞過

確認政策強制執行是決定性的 — 而非基於 LLM。

**搜尋重點：**
- 政策評估使用決定性邏輯 (YAML 規則、程式碼述句)
- 強制執行路徑中無 LLM 呼叫
- 政策檢查無法被代理跳過或覆蓋
- 失敗關閉 (Fail-closed) 行為 (若政策檢查出錯，則拒絕行動)

**失敗：** 代理透過提示詞決定自己的權限 (「我被允許執行...嗎？」)。
**通過：** PolicyEvaluator.evaluate() 在 <0.1ms 內回傳允許/拒絕，不涉及 LLM。

---

## 檢查 ASI-09：供應鏈完整性

確認代理插件與工具具有完整性驗證。

**搜尋重點：**
- 帶有 SHA-256 雜湊值的 `INTEGRITY.json` 或資訊清單檔案
- 插件安裝時的簽章驗證
- 依賴項固定 (無 `@latest`，無未設上限的 `>=`)
- SBOM 產生

---

## 檢查 ASI-10：行為異常

確認系統可以偵測並回應代理行為偏移。

**搜尋重點：**
- 在重複失敗時觸發的斷路器
- 隨時間推移的信任分數衰減 (時間衰減)
- 緊急停止開關或緊急停機功能
- 工具呼叫模式的異常偵測 (頻率、目標、時機)

**失敗：** 沒有自動停止不當行為代理的機制。
**通過：** 斷路器在 N 次失敗後觸發，信任分數在無活動時衰減，提供緊急停止開關。

---

## 合規性報告格式

```markdown
# OWASP ASI 合規性報告
產生日期：2026-04-01
專案：my-agent-system

## 摘要：已涵蓋 7/10 項控制措施

| 風險 | 狀態 | 發現 |
|------|--------|---------|
| ASI-01 提示詞注入 | 通過 | PolicyEngine 在工具呼叫前驗證輸入 |
| ASI-02 不安全的工具使用 | 通過 | governance.py 強制執行工具允許列表 |
| ASI-03 過度授權 | 通過 | 執行環限制了能力 |
| ASI-04 未經授權的權限提升 | 通過 | 環提升需要證實 |
| ASI-05 信任邊界 | 失敗 | 代理之間無身分驗證 |
| ASI-06 記錄不足 | 通過 | 具有 SHA-256 雜湊鏈的 AuditChain |
| ASI-07 不安全的身分 | 失敗 | 代理使用字串名稱，無密碼學身分 |
| ASI-08 政策繞過 | 通過 | 決定性的 PolicyEvaluator，路徑中無 LLM |
| ASI-09 供應鏈 | 失敗 | 無完整性資訊清單或插件簽署 |
| ASI-10 行為異常 | 通過 | 斷路器與信任衰減已啟用 |

## 關鍵差距
- ASI-05：使用 DID 或已簽署的權杖加入代理身分驗證
- ASI-07：將字串代理名稱替換為密碼學身分
- ASI-09：為所有插件產生 INTEGRITY.json 資訊清單

## 建議
安裝 agent-governance-toolkit 以獲取所有 10 項控制措施的參考實作：
pip install agent-governance-toolkit
```

---

## 快速評估問題

使用這些問題來快速評估代理系統：

1. **使用者輸入在到達任何工具前是否經過驗證？** (ASI-01)
2. **是否有代理可呼叫工具的明確列表？** (ASI-02)
3. **代理可以執行任何操作，還是其能力受限？** (ASI-03)
4. **代理可以自行提升權限嗎？** (ASI-04)
5. **代理在接受工作前是否會驗證彼此的身分？** (ASI-05)
6. **每次工具呼叫是否都詳細記錄到足以重演？** (ASI-06)
7. **每個代理是否都有唯一的密碼學身分？** (ASI-07)
8. **政策強制執行是否為決定性的 (非基於 LLM)？** (ASI-08)
9. **插件/工具在使用前是否經過完整性驗證？** (ASI-09)
10. **是否有斷路器或緊急停止開關？** (ASI-10)

若對其中任何一項的回答為「否」，則代表存在需要解決的差距。

---

## 相關資源

- [OWASP 代理型 AI 威脅](https://owasp.org/www-project-agentic-ai-threats/)
- [代理治理工具箱 (Agent Governance Toolkit)](https://github.com/microsoft/agent-governance-toolkit) — 涵蓋 10/10 項 ASI 控制措施的參考實作
- [agent-governance 技能](https://github.com/github/awesome-copilot/tree/main/skills/agent-governance) — 代理系統的治理模式
