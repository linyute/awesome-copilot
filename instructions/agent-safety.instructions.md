---
description: '建立安全、受控的 AI 代理程式系統指引。在撰寫使用代理程式框架、具備工具呼叫能力的 LLM 或多代理程式協調的程式碼時套用，以確保適當的安全邊界、原則強制執行和可稽核性。'
applyTo: '**'
---

# 代理程式安全與治理 (Agent Safety & Governance)

## 核心原則

- **失敗即關閉 (Fail closed)**：如果治理檢查發生錯誤或結果模糊，請拒絕該動作而非允許
- **原則即設定 (Policy as configuration)**：在 YAML/JSON 檔案中定義治理規則，而非在應用程式邏輯中硬編碼
- **最小權限**：代理程式應僅具備其任務所需的最低限度工具存取權
- **僅限附加的稽核 (Append-only audit)**：絕不修改或刪除稽核追蹤條目 — 不可變動性是實現合規性的關鍵

## 工具存取控制

- 務必為代理程式定義明確的工具允許清單 (allowlist) — 絕不給予不受限的工具存取權
- 將工具註冊與工具授權分離 — 框架知道存在哪些工具，原則則控制允許使用哪些工具
- 針對已知的危險作業 (Shell 執行、檔案刪除、資料庫 DDL) 使用封鎖清單 (blocklists)
- 對於高影響工具 (發送電子郵件、部署、刪除記錄) 要求人介入 (human-in-the-loop) 核准
- 對每個請求的工具呼叫強制執行速率限制，以防止無限迴圈和資源耗盡

## 內容安全

- 在將使用者輸入傳遞給代理程式之前，先掃描是否存在威脅訊號 (資料盜取、提示注入、權限提升)
- 篩選代理程式引數中的敏感模式：API 金鑰、認證、PII (個人識別資訊)、SQL 注入
- 使用可不經程式碼變更即可更新的正規表達式 (regex) 模式清單
- 同時檢查使用者的原始提示 (prompt) 以及代理程式產生的工具引數

## 多代理程式安全

- 多代理程式系統中的每個代理程式都應具備自己的治理原則
- 當代理程式委派給其他代理程式時，套用兩者中最嚴格的原則
- 追蹤代理程式委派對象的信任評分 — 在失敗時降低信任度，要求持續表現良好行為
- 絕不允許內部代理程式具備比呼叫它的外部代理程式更廣泛的權限

## 稽核與可觀察性

- 記錄每一次工具呼叫，包含：時間戳記、代理程式 ID、工具名稱、允許/拒絕決策、原則名稱
- 記錄每一次治理違規，包含相符的規則與證據
- 以 JSON Lines 格式匯出稽核追蹤，以便與記錄彙送系統整合
- 在稽核記錄中包含工作階段邊界 (開始/結束) 以進行關聯分析

## 程式碼模式

撰寫代理程式工具函式時：
```python
# 正確：受明確原則控管的工具
@govern(policy)
async def search(query: str) -> str:
    ...

# 錯誤：無治理保護的工具
async def search(query: str) -> str:
    ...
```

定義原則時：
```yaml
# 正確：明確的允許清單、內容篩選、速率限制
name: my-agent
allowed_tools: [search, summarize]
blocked_patterns: ["(?i)(api_key|password)\s*[:=]"]
max_calls_per_request: 25

# 錯誤：無限制
name: my-agent
allowed_tools: ["*"]
```

組合多代理程式原則時：
```python
# 正確：最嚴格優先 (most-restrictive-wins) 的組合
final_policy = compose_policies(org_policy, team_policy, agent_policy)

# 錯誤：僅使用代理程式層級原則，忽略組織限制
final_policy = agent_policy
```

## 特定框架說明

- **PydanticAI**：使用 `@agent.tool` 並配合治理裝飾器封裝。PydanticAI 即將推出的 Traits 功能正是為此模式設計。
- **CrewAI**：在 Crew 層級套用治理以涵蓋所有代理程式。使用 `before_kickoff` 回呼進行原則驗證。
- **OpenAI Agents SDK**：使用治理封裝 `@function_tool`。使用交接守衛 (handoff guards) 進行多代理程式信任管理。
- **LangChain/LangGraph**：使用 `RunnableBinding` 或工具封裝進行治理。在圖表邊緣 (graph edge) 層級套用以進行流程控制。
- **AutoGen**：在 `ConversableAgent.register_for_execution` 勾點中實作治理。

## 常見錯誤

- 僅依賴輸出護欄 (產出後檢查) 而非執行前治理
- 硬編碼原則規則而非從設定載入
- 允許代理程式自行修改其治理原則
- 忘記對工具 *引數* 進行治理檢查，而僅檢查工具 *名稱*
- 未隨時間衰減信任評分 — 過時的信任是危險的
- 在稽核追蹤中記錄提示內容 — 應記錄決策與 Metadata，而非使用者內容
