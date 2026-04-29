---
name: 'ai-team-orchestration'
description: '引導並執行一個多代理 AI 開發團隊。適用於：使用 AI 代理開始新的軟體專案、設定平行的開發/QA 團隊、建立衝刺計畫、撰寫具有鮮明代理語氣的集思廣益提示、復原專案工作流程或規劃衝刺。'
---

# AI 團隊協調

## 何時使用
- 開始一個需要計畫、開發、測試和部署的新專案
- 設定平行的 AI 代理團隊（開發、QA、DevOps）
- 撰寫能產生真實辯論（而非通用輸出）的集思廣益提示
- 建立具備跨對話內容延續能力的衝刺計畫
- 在衝刺中途從內容溢出中復原

## 團隊角色

| 代理 | 名稱 | 角色 | 重點 |
|-------|------|------|-------|
| 製作人 | **Remy** | 衝刺計畫、協調、合併 PR | 範圍控制、交接、問題分流 |
| 產品設計師 | **Kira** | UX、機制、使用者體驗 | 趣味因素、使用者流程、功能設計 |
| 視覺/藝術總監 | **Milo** | CSS、動畫、視覺識別 | 設計系統、磨光、無障礙 |
| 前端工程師 | **Nova** | UI 框架、狀態管理、元件 | React/Vue/Svelte、用戶端邏輯 |
| 後端工程師 | **Sage** | API、資料庫、驗證、安全性 | 伺服器端邏輯、基礎設施 |
| DevOps 工程師 | **Dash** | CI/CD、雲端部署、管線 | GitHub Actions、Azure/AWS/GCP |
| QA 工程師 | **Ivy** | E2E 測試、自動化、遊戲測試 | Playwright/Cypress、提報錯誤、簽署 |

為你的專案自訂名稱和角色。並非每個專案都需要所有角色。

## 對話架構

人類（執行長）是平行對話之間的訊息匯流排：

```
┌────────────────────────────────────────┐
│  @ai-team-producer — 計畫、合併         │
│  絕不撰寫程式碼                           │
└────────────────┬───────────────────────┘
                 │ 人類傳遞訊息
      ┌──────────┼──────────┐
      ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌────────┐
│@ai-team  │ │@ai-team│ │DevOps  │
│-dev      │ │-qa     │ │(視需求) │
│          │ │        │ │        │
│ Nova     │ │ Ivy    │ │        │
│ Sage     │ │        │ │        │
│ Milo     │ │        │ │        │
│          │ │feature/│ │feature/│
│ feature/ │ │qa-N    │ │devops-N│
│ sprint-N │ └────────┘ └────────┘
└──────────┘
```

每個團隊在**獨立的 VS Code 視窗**中工作，並擁有自己的複製版本：
```bash
git clone <repo> project-dev    # 開發團隊
git clone <repo> project-qa     # QA
git clone <repo> project-devops # DevOps (僅在需要時)
```

## 專案引導 (Bootstrap)

### 1. 建立 PROJECT_BRIEF.md

所有對話的單一事實來源。參見 [專案簡介範本](./references/project-brief-template.md)。

**必要章節（不要縮寫）：**
1. 專案概觀
2. 概念 / 產品說明
3. 技術堆疊
4. 架構 (ASCII 圖表)
5. 關鍵檔案映射
6. 團隊角色
7. 衝刺狀態（每個衝刺更新）
8. 目前狀態（每個衝刺重寫）
9. 安全性規則
10. 如何在本地執行
11. 如何部署
12. **跨對話交接協定** — 內容如何在對話之間延續
13. **錯誤與修復追蹤** — 以 GitHub Issues 作為單一事實來源
14. **多儲存庫設定** — 獨立的複製版本、分支策略、合併規則

### 2. 執行集思廣益 (Brainstorm)

參見 [集思廣益格式](./references/brainstorm-format.md)。關鍵：明確命名每個代理，並賦予其鮮明的個性和觀點。要求至少 2 次真正的分歧，以防止集體盲思。

### 3. 建立衝刺計畫

參見 [衝刺計畫範本](./references/sprint-plan-template.md)。每個衝刺都會獲得：
- `docs/sprint-N/plan.md` — 優先排序的工作、成功準則
- `docs/sprint-N/progress.md` — 即時追蹤器，支援復原
- `docs/sprint-N/done.md` — 在衝刺結束時撰寫的交接文件

### 4. 執行衝刺

```
閱讀 PROJECT_BRIEF.md，然後閱讀 docs/sprint-N/plan.md。執行衝刺 N。

首先：git pull origin main && git checkout -b feature/sprint-N

在提交中關閉 GitHub Issues：「fix: 說明 (Fixes #NN)」
在每個階段後更新 docs/sprint-N/progress.md。
完成後，推送並建立 PR：git push origin feature/sprint-N
遵循 PROJECT_BRIEF.md 的第 12-14 節。
```

### 5. QA 簽署

在開發合併後，QA 進行完整的全程測試 (playthrough)：
```
閱讀 PROJECT_BRIEF.md。你是 Ivy (QA)。
衝刺 N 已合併到 main。進行完整的全程測試。
將錯誤提報為 GitHub Issues。撰寫 docs/qa/sprint-N-signoff.md。
```

## 內容復原 (Context Recovery)

當對話變得太長（>100 則訊息）時，請儲存狀態並重新開始：

**關閉前：**
1. 以目前狀態更新 `docs/sprint-N/progress.md`
2. 更新 `PROJECT_BRIEF.md` 第 7 和 8 節
3. 撰寫 `docs/sprint-N/done.md`

**冷啟動提示：**
```
閱讀 PROJECT_BRIEF.md 和 docs/sprint-N/progress.md。
從上次中斷的地方繼續。
```

## 反模式 (Anti-Patterns)

參見 [反模式參考](./references/anti-patterns.md) 獲取完整清單。前 5 名：

| 不要 | 應該改做 |
|-------|------------|
| 變更功能分支的基底 (Rebase) | 合併 (變更基底會導致提交遺失) |
| 製作人撰寫程式碼 | 製作人僅負責計畫、合併、提報問題 |
| 批量的「修復所有問題」提交 | 每個修復一個提交並附上問題編號 |
| 模糊的集思廣益提示 | 命名每個代理並賦予鮮明的觀點 |
| 僅在對話中保留錯誤 | 提報 GitHub Issues (對話內容會消失) |

## 獲得更好結果的秘訣

- 提示詞中使用 **「慢慢來，正確地完成它」** 比匆忙執行能產生更好的輸出
- **合併前測試** — 你進行遊戲測試、提報問題、開發修復，然後合併
- 在重大衝刺前**執行團隊諮議會 (consiliums)** — 每個代理從其觀點審查計畫
- 在每個里程碑後將**教訓儲存到記憶體中**
