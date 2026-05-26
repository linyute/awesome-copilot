---
name: github-codespaces-efficiency
description: '審核並改進 GitHub Codespaces 效率。當使用者需要更快的 Codespaces 啟動速度、降低 Codespaces 支出、精簡 devcontainers、調整機器大小、調整閒置逾時，或將預建置 (prebuilds) 範圍限制在持續使用的分支時，請使用此技能。'
---

# GitHub Codespaces 效率

將此技能作為 GitHub Codespaces 效率工作的精簡入口。檢查儲存庫、識別浪費，並僅載入所需的參考資料。

如果尚未存在 `.devcontainer/`，請載入 [`references/codespaces.md`](./references/codespaces.md) 並在執行下列步驟前定義基準。

## 何時使用此技能

- 使用者希望更快的 Codespaces 啟動速度或更低的 Codespaces 支出。
- 儲存庫有 `.devcontainer/` 或關於 Codespaces 配置的問題。
- 使用者詢問 devcontainer 優化、機器大小調整、預建置策略或閒置逾時指導。
- 使用者是第一次設定 Codespaces，或需要協助從頭建立新的 `.devcontainer/`。

## 僅載入您需要的內容

- [`references/codespaces.md`](./references/codespaces.md) — devcontainer、機器大小、預建置、閒置逾時指引以及報告。
- [`references/review-rubric.md`](./references/review-rubric.md) — 僅在審查過程中載入。

## 核心工作流程

### 1. 先測量

```bash
find .devcontainer -maxdepth 2 -type f
gh codespace list
repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
gh api "/repos/$repo/codespaces/machines"
```

如果 `gh` 驗證失敗或使用者缺乏儲存庫管理員權限，請繼續對 `.devcontainer/` 檔案進行靜態分析；將機器類型和預建置建議標記為未驗證。

尋找：大於 2 GB 的 devcontainer 映像檔或超過 10 個功能的設定、大於使用數據支持的機器類型、缺少 `devcontainer-lock.json`（建議新增 — 許多儲存庫早於 lock-file 的支援）、預建置範圍過廣，以及閒置逾時與使用模式不符。

### 2. 應用護欄 (Guardrails)

在建議每個修復方案之前，請對照以下規則進行檢查：

1. 不移除團隊每天使用的工具 — 放棄任何刪除必要開發工具或擴充功能的修復方案。
2. 不假設越小越好 — 在機器成本與開發者體驗及吞吐量之間取得平衡。
3. 不將 devcontainer 變成正式環境 (production) 映像檔 — 放棄任何增加僅供正式環境使用之依賴項的修復方案，除非團隊明確要求。
4. 優先進行增量變更 — 僅在不存在 `.devcontainer/` 時才適合建立全新的基準；對於重組現有設定的變更，請標記（不要直接刪除）。
5. 儲存庫變更與組織設定保持分開 — 將任何混合儲存庫可編輯檔案與組織級別或使用者級別 Codespaces 設定的修復方案拆分為兩個不同的建議。

### 3. 選擇前 3 大修復方案

從下方的六個候選方案中，僅保留那些有步驟 1 中的審核證據支持 *且* 通過步驟 2 中所有護欄檢查的方案。按預計每月成本節省 (USD) 對倖存方案進行排名。選擇所有符合這兩個標準的候選方案，最多 3 個。

1. 精簡 devcontainer — 移除日常開發工作不需要的功能、套件或擴充功能；目標映像檔 <2 GB 且少於 10 個功能
2. 調整機器類型大小 — 配合觀察到的使用模式；如果數據不可用，請明確說明假設
3. 限制預建置範圍 — 僅針對預設分支、過去 14 天內活躍的 `release/*` 分支，以及每週有超過 5 個 Codespaces 的分支啟用；其餘全部停用
4. 調整閒置逾時 — 預設 30 分鐘；如果大多數工作階段在 30 分鐘前結束，則調整為 15 分鐘；如果大多數工作階段執行時間更長，則調整為 60 分鐘
5. 移除未使用的擴充功能或連接埠轉發規則
6. 縮減 devcontainer 映像檔大小並改善層快取

### 4. 驗證

- 啟動一個測試 Codespace，以確認 devcontainer 的變更是否如預期建置並啟動。
- 在有遙測數據可用時，根據觀察到的使用情況驗證機器大小；否則標記為未驗證。
- 將意外的建置或啟動失敗視為真實錯誤，即使設定看起來正確無誤。

## 必要輸出

**浪費來源：** [主要的成本或啟動時間驅動因素]

**建議修復方案：** [審核證據支持且通過護欄檢查的前 3 大變更]

**驗證：** [已實際驗證 / 僅靜態分析 / 剩餘風險]

**影響：**
- 啟動時間：[預期] / [測量值（若可用）]
- 每月支出：[預期] / [測量值（若可用）]
- 資源利用率：[預期] / [測量值（若可用）]

## 參考資料

- [`references/codespaces.md`](./references/codespaces.md)
- [`references/review-rubric.md`](./references/review-rubric.md) — 在審查已完成的效率工作時載入
