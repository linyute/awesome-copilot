# 衝刺計畫範本

## 計畫檔案

儲存為 `docs/sprint-N/plan.md`：

```markdown
# 衝刺 N — [名稱]

> 衝刺目標：[用一句話描述交付成果]
> 分支：feature/sprint-N
> 預估努力：[時間預估]

## 優先排序的工作清單

| # | 工作 | 負責人 | 預估 | 說明 |
|---|------|-------|-----|-------------|
| 1 | [工作] | Nova | 1h | [要建構什麼] |
| 2 | [工作] | Sage | 2h | [要建構什麼] |
| 3 | [工作] | Milo | 1h | [要設計什麼樣式] |

## 工作時程

### 階段 1：[名稱] (工作 1-3)
- 建構 [元件]
- 階段結束後的檢查點提交 (Checkpoint commit)

### 階段 2：[名稱] (工作 4-6)
- 建構 [元件]
- 階段結束後的檢查點提交

### 階段 3：磨光與整合 (Polish & Integration)
- 整合測試
- 錯誤修復
- 最終提交

## 成功準則

- [ ] [可測試的準則 1]
- [ ] [可測試的準則 2]
- [ ] [可測試的準則 3]
- [ ] 所有測試通過
- [ ] 無主控台錯誤

## 此衝刺「不」包含的內容

| 功能 | 原因 |
|---------|--------|
| [刪減的功能] | [原因 — 範圍、複雜度、目前還不需要] |

## 代理提示 (Agent Prompt)

> 閱讀 PROJECT_BRIEF.md，然後閱讀 docs/sprint-N/plan.md。執行衝刺 N。
>
> 首先：git pull origin main && git checkout -b feature/sprint-N
>
> 在提交中關閉 GitHub Issues：「fix: 說明 (Fixes #NN)」
> 在每個階段後更新 docs/sprint-N/progress.md。
> 完成後，推送並建立 PR：git push origin feature/sprint-N
> 遵循 PROJECT_BRIEF.md 的第 12-14 節。
```

## 進度追蹤器 (Progress Tracker)

在衝刺開始時建立 `docs/sprint-N/progress.md`：

```markdown
# 衝刺 N — 進度追蹤器

> 如果內容溢出，請啟動新的對話：
> 「閱讀 PROJECT_BRIEF.md 和 docs/sprint-N/progress.md。
>  從上次中斷的地方繼續。」

## 工作狀態

| # | 工作 | 狀態 | 註記 |
|---|------|--------|-------|
| 1 | [工作] | ⬜ 未開始 | |
| 2 | [工作] | 🔨 進行中 | |
| 3 | [工作] | ✅ 已完成 | |
| 4 | [工作] | ❌ 已阻塞 | [原因] |

## 發現的錯誤

| # | 說明 | 嚴重性 | 狀態 | 修復 |
|---|-------------|----------|--------|-----|
| 1 | [錯誤] | 阻礙者/重大/次要 | 開放/已修復 | [提交或 PR] |

## 註記

[關於決策、問題或復原內容的自由格式註記]
```

## 完成檔案 (Done File)

在衝刺結束時撰寫 `docs/sprint-N/done.md`：

```markdown
# 衝刺 N — 已完成

## 已建構的內容
- [功能 1]
- [功能 2]

## 未完成的內容
- [延期的項目 — 原因]

## 變更/建立的檔案
- `src/components/NewComponent.tsx` — [用途]
- `api/src/functions/newEndpoint.ts` — [用途]

## 需要的手動設定
- [任何需要的環境變數、設定或手動步驟]

## 已知問題
- [問題 — 以 GitHub Issue #NN 追蹤]
```

## QA 簽署範本 (QA Sign-off Template)

```markdown
# QA 衝刺 N 簽署

日期：[日期]
測試員：Ivy (QA)

## 測試結果
- 執行測試數：X
- 通過測試數：X
- 失敗測試數：0

## 阻礙者
無

## 提報的 Issues
- #NN — [說明] (嚴重性：次要)

## 結果
✅ 通過 — 無阻礙者。衝刺 N 已準備好合併。
```
