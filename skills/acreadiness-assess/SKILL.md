---
name: acreadiness-assess
description: '在目前的存放庫執行 AgentRC 就緒評估，並在 reports/index.html 產出一個靜態的 HTML 儀表板。封裝了 `npx github:microsoft/agentrc readiness` 並將呈現工作移交給 @ai-readiness-reporter 自訂代理程式。支援用於組織特定評分的政策 (--policy)。當被要求評估、稽核或對存放庫的 AI 就緒程度進行評分時使用。'
argument-hint: "[--policy <path-or-pkg>] [--per-area] — 例如 /acreadiness-assess, /acreadiness-assess --policy ./policies/strict.json"
---

# /acreadiness-assess — AI 就緒評估

每當使用者要求進行 **AI 就緒評估 (AI-readiness assessment)**、**就緒檢查 (readiness check)**、**稽核 (audit)**，或是想 **查看他們的存放庫對 AI 的就緒程度** 時，請使用此技能。

此技能是 AgentRC 的 **測量 (Measure) → 建立 (Generate) → 維護 (Maintain)** 循環中的「測量」步驟。其結果是一個獨立的 HTML 儀表板，使用者可以使用 `file://` 開啟或提交到存放庫。

## 步驟 (Steps)

1. **確認先決條件**。PATH 中必須具備 Node 20+。如果不確定，請執行 `node --version`。

2. **決定政策** (選填但建議使用)：
   - 如果使用者提供了 `--policy <source>`，請擷取它。
   - 否則，檢查 `agentrc.config.json` 是否有 `policies` 陣列。
   - 如果兩者皆無，則在不使用政策的情況下執行（使用內建預設值）。
   - 有關政策的入門介紹，請建議使用 `acreadiness-policy` 技能。

3. **在存放庫根目錄執行就緒掃描**，並產生結構化輸出：
   ```bash
   npx -y github:microsoft/agentrc readiness --json [--policy <source>] [--per-area]
   ```
   `CommandResult<T>` JSON 封套是您下一步的輸入。

4. **移交給 `ai-readiness-reporter` 自訂代理程式** 來解讀 JSON 並產出 `reports/index.html`。該代理程式透過隨附的範本 `report-template.html`（與此技能一同提供）進行呈現，因此每份報告都有相同的觀感。該代理程式會：
   - 讀取隨附的 `report-template.html` 並將預留位置替換為實際資料。
   - 內嵌所有 CSS，交付單一靜態檔案（可在 `file://` 下運作）。
   - 呈現成熟度等級、總分、等級、通過率 vs 門檻。
   - 詳解 **存放庫健康狀況 (Repo Health)** (8) 與 **AI 設定 (AI Setup)** (1) 的所有 9 個支柱，包含「*測量內容*」、「*對 AI 的重要性*」、「*目前狀態*」以及「*具體建議*」。
   - 為每個支柱加上 **AI 相關性 (AI relevance)** 徽章（高 / 中 / 低）。
   - 分開呈現 **額外項目 (Extras)**（它們絕不會影響評分）。
   - 顯示 **作用中政策 (Active Policy)**，包括任何已停用/覆寫的標準與門檻。
   - 產出 **優先補救計畫 (Prioritised Remediation Plan)** (🔴 優先修復 / 🟡 下步修復 / 🔵 計畫)。
   - 內嵌原始 AgentRC JSON 以供重複使用。

5. **告知使用者報告所在位置** (`reports/index.html`) 以及如何開啟它。在聊天中總結：成熟度等級、總分、分數最低的前三個支柱，以及單一最高槓桿的下一步行動（幾乎總是：執行 `acreadiness-generate-instructions` 技能）。

## 附註 (Notes)

- AgentRC 也內建了 HTML 呈現器 (`--visual` / `--output report.html`)，但其輸出意圖在於通用。此技能透過自訂代理程式產出量身定制且具備專業見解的儀表板 — 更接近程式碼審查而非數據堆湊。
- 對於 CI 閘控，建議執行 `agentrc readiness --fail-level <n>` (1–5)。
- 除了建立 `reports/index.html` 外，此技能絕不會修改存放庫檔案。
