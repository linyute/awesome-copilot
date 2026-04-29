# AI 團隊協作 (AI Team Orchestration)

引導建立並執行一個具有具名角色（製作人、開發團隊、測試）的多代理 AI 開發團隊。規劃衝刺、以不同代理的聲音進行腦力激盪、協調平行的開發/測試工作流，並透過結構化的交接範本在上下文溢出時生存下來。

## 包含內容

### 代理 (Agents)

| 代理 | 提及 | 角色 | 工具存取權 |
|-------|---------|------|-------------|
| **製作人** (Remy) | `@ai-team-producer` | 衝刺規劃、協調、PR 合併 | 唯讀（不編輯程式碼） |
| **開發團隊** (Nova, Sage, Milo) | `@ai-team-dev` | 前端、後端和視覺實作 | 完整程式碼編寫工具 |
| **測試** (Ivy) | `@ai-team-qa` | 測試、回報 Bug、核可 (sign-off) | 讀取 + 測試（不編輯原始碼） |

### 技能 (Skill)

`/ai-team-orchestration` 提供的範本包括：
- **PROJECT_BRIEF.md** — 跨對話的 14 個章節單一真理來源
- **腦力激盪格式** — 具有不同聲音的多代理辯論
- **衝刺計畫** — 優先排序的工作任務、進度追蹤器、交接文件
- **反模式** — 來自真實多代理專案的 19 個記錄在案的陷阱

## 快速入門

### 1. 引導專案建立

```
@ai-team-producer 我想要建立 [描述您的專案]。
使用 /ai-team-orchestration 來引導此專案建立。
從腦力激盪開始，然後建立包含所有章節 (1-14) 的 PROJECT_BRIEF.md。
```

### 2. 規劃一個衝刺

```
@ai-team-producer 建立衝刺 1 計畫。範圍：[要建構的內容]。
執行團隊會商 (consilium) 以驗證計畫。
```

### 3. 執行（獨立的 VS Code 視窗）

```
@ai-team-dev 閱讀 PROJECT_BRIEF.md，然後閱讀 docs/sprint-1/plan.md。執行衝刺 1。
```

### 4. 測試（另一個 VS Code 視窗）

```
@ai-team-qa 衝刺 1 已合併至 main。進行完整試玩。
將 Bug 作為 GitHub Issues 回報。撰寫 docs/qa/sprint-1-signoff.md。
```

## 運作方式

人類扮演平行對話之間的訊息匯流排。每個團隊在獨立的 VS Code 視窗中工作，並擁有自己的存放庫複製 (clone)：

- **@ai-team-producer** — 無法編輯程式碼（受工具限制強制執行）
- **@ai-team-qa** — 無法編輯原始檔，僅能讀取/測試/回報 Bug
- **@ai-team-dev** — 完整工具，角色包含 Nova（前端）、Sage（後端）、Milo（設計）

## 來源

將交付 [Arcade After Dark](https://github.com/denis-a-evdokimov/guess-and-get) 的工作流程式碼化 — 這是一個由 7 個 AI 代理在 5 天內完全不使用人類編寫的程式碼而建構的 30 款遊戲生日禮物應用程式。
