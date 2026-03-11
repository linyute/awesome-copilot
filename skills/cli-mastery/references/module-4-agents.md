# 模組 4：Agent 系統 (Module 4: Agent System)

## 內建 Agent (Built-in Agents)

| Agent | 模型 | 最適用於 | 關鍵特徵 |
|-------|-------|----------|-----------|
| `explore` | Haiku | 快速程式碼庫問答 | 唯讀，少於 300 字，可安全地平行執行 |
| `task` | Haiku | 執行指令 (測試、建構、Lint) | 成功時簡短，失敗時詳細 |
| `general-purpose` | Sonnet | 複雜的多步驟任務 | 完整工具集，獨立上下文視窗 |
| `code-review` | Sonnet | 分析程式碼變更 | 絕不修改程式碼，高訊雜比 (High signal-to-noise) |

## 自訂 Agent — 在 Markdown 中定義您自己的 Agent

| 層級 | 位置 | 範圍 |
|-------|----------|-------|
| 個人 | `~/.copilot/agents/*.md` | 您所有的專案 |
| 專案 | `.github/agents/*.md` | 此存放庫上的每個人 |
| 組織 | 組織存放庫中的 `.github-private/agents/` | 整個組織 |

## Agent 檔案結構 (Agent file anatomy)

```markdown
---
name: my-agent
description: 此 Agent 的作用
tools:
  - bash
  - edit
  - view
---

# Agent 指令 (Agent Instructions)
在此處填寫您的詳細行為指令。
```

## Agent 編排模式 (Agent orchestration patterns)

1. **扇出探索 (Fan-out exploration)** — 平行啟動多個 `explore` Agent，以同時回答不同的問題
2. **流水線 (Pipeline)** — `explore` → 理解 → `general-purpose` → 實作 → `code-review` → 驗證
3. **專家交接 (Specialist handoff)** — 識別任務 → 使用 `/agent` 挑選專家 → 使用 `/fleet` 或 `/tasks` 進行檢閱

關鍵見解：AI 會在適當時自動委派給子 Agent。
