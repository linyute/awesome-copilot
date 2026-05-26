---
name: github-actions-efficiency
description: '稽核 GitHub Actions 工作流程效率並建議修復，以減少 CI 分鐘數與成本。'
---

# GitHub Actions 效率

將此技能作為 GitHub Actions 效率工作的輕量級入口點。檢查儲存庫，識別浪費來源，並僅載入當前任務所需的參考資料。

如果尚未存在任何工作流程，請載入 [`references/actions.md`](./references/actions.md) 並定義基準，然後再繼續進行以下步驟。

**如果無法使用 shell 或 `gh` CLI：** 請要求使用者貼上 `.github/workflows/` 的內容以及 `gh run list --limit 10` 的輸出。如果僅提供部分檔案，請註明：「僅根據提供的檔案進行稽核；部分洞察可能不完整。」對於僅來自檔案的回答，請開頭註明：「**僅靜態分析**（未經即時執行確認）。」

## 在下列情況使用此技能

- 使用者想要減少 GitHub Actions 執行時間、CI 成本或浪費的工作流程執行。
- 儲存庫在 `.github/workflows/` 中有現有的工作流程，或有明確的 GitHub Actions 設定問題。
- 使用者要求快取、併發 (concurrency)、路徑篩選器、矩陣精簡、作業優化或工作流程特定的修復。
- 使用者需要協助從零開始建立新的 GitHub Actions 工作流程或 CI 基準。

## 僅載入您需要的內容

- [`references/actions.md`](./references/actions.md) — 稽核、作業閘控、矩陣精簡、即時驗證與工作流程特定的修復。
- [`references/reporting.md`](./references/reporting.md) — 當使用者要求變更前後的效率報告時。
- [`references/patterns.md`](./references/patterns.md) — 當內聯稽核指令不足時的完整 YAML 範例。

## 核心工作流程

### 1. 先測量

```bash
rg -n "on:|concurrency:|paths:|paths-ignore:|strategy:|matrix:|cache:" .github/workflows
gh run list --limit 10
run_id=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')
gh run view "$run_id" --log-failed
```

尋找：遺失相依性快取、遺失 `concurrency` 取消設定、過於寬泛的觸發器、重複的工作流程涵蓋範圍，以及無論範圍如何，每次變更都會執行的昂貴作業。

### 2. 應用防護措施 (Guardrails)

在建議任何修復之前，請根據這些規則進行檢查：

1. 不隱藏必要的驗證 — 刪除任何移除發行、結構描述、遷移或共用程式庫檢查的修復。
2. 不在無正當理由下減少平行處理 — 除非使用者將成本置於延遲之上 *且* 新的關鍵路徑保持在原始路徑的 1.25 倍以內，否則請刪除。
3. 僅保留已記錄的矩陣分段 — 刪除沒有明確版本或平台承諾的矩陣分段。
4. 回寫作業使用「選擇性加入」(opt-in) 觸發器 — 標記（不要刪除）自動執行的格式化程式或機器人作業；建議使用「選擇性加入」觸發器代替。
5. 儲存庫變更與組織設定分開 — 將任何混合儲存庫可編輯 YAML 與組織層級或 GitHub 帳戶設定的修復，拆分為兩個不同的建議。

### 3. 選擇前 3 大修復

從以下六個候選項目中，僅保留那些有步驟 1 的稽核證據支持 *且* 通過步驟 2 中所有防護措施的項目。根據估計每日節省的 CI 分鐘數（單次執行節省 × 每日執行次數）對倖存者進行排名。選擇所有符合這兩個標準的候選項目，最多 3 個。

1. 新增基於鎖定檔 (lockfile) 金鑰的相依性快取
2. 新增或修正 `concurrency` 取消設定
3. 在合併作業之前，移除重複的工作流程涵蓋範圍
4. 安全地縮窄工作流程或作業觸發器
5. 縮減矩陣廣度以匹配風險與事件類型
6. 平行處理關鍵路徑上的獨立作業

### 4. 驗證

- 如果可以使用 `gh` CLI，請在非保護分支上進行即時測試推送，以驗證路徑閘控和併發取消設定。
- 如果無法進行即時驗證，請在輸出中明確說明。
- 即使 YAML 看起來正確，也要將意外的即時行為視為真正的錯誤。

## 必要輸出

1. **浪費來源** — 在步驟 1 中發現的主要成本或延遲驅動因素
2. **建議修復** — 前 3 名（或所有剩餘的）及其支援的稽核證據
3. **驗證** — 哪些已即時證明，哪些僅在本地檢查，以及任何剩餘的風險
4. **影響** — 預期的節省與實際測量的節省；將 PR 時鐘時間與總執行器執行時間分開

## 參考資料

- [`references/actions.md`](./references/actions.md)
- [`references/reporting.md`](./references/reporting.md)
- [`references/patterns.md`](./references/patterns.md)
- [`references/review-rubric.md`](./references/review-rubric.md) — 審查已完成的效率工作時載入
