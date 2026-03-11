---
name: cli-mastery
description: 'GitHub Copilot CLI 的互動式訓練。引導式課程、測驗、情境挑戰，以及涵蓋斜線指令、快捷鍵、模式、Agent、技能、MCP 和設定的完整參考。說「cliexpert」即可開始。'
metadata:
  version: 1.2.0
license: MIT
---

# Copilot CLI 精通 (Copilot CLI Mastery)

**工具技能** — 互動式 Copilot CLI 訓練員。
呼叫：`ask_user`, `sql`, `view`
適用於：「cliexpert」、「教我 Copilot CLI」、「考考我斜線指令」、「CLI 備忘單」、「Copilot CLI 最終考試」
不適用於：一般編碼、非 CLI 問題、僅限 IDE 的功能

## 路由與內容 (Routing and Content)

| 觸發詞 | 行動 |
|---------|--------|
| 「cliexpert」、「教我」 | 讀取下一個 `references/module-N-*.md`，進行教學 |
| 「考考我」、「測試我」 | 讀取目前模組，透過 `ask_user` 提出 5 個以上問題 |
| 「情境」、「挑戰」 | 讀取 `references/scenarios.md` |
| 「參考」 | 讀取相關模組，進行總結 |
| 「最終考試」 | 讀取 `references/final-exam.md` |

特定的 CLI 問題將直接獲得回答，而不載入參考資料。
參考檔案位於 `references/` 目錄中。使用 `view` 依需求讀取。

## 行為 (Behavior)

在首次互動時，初始化進度追蹤：
```sql
CREATE TABLE IF NOT EXISTS mastery_progress (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS mastery_completed (module TEXT PRIMARY KEY, completed_at TEXT DEFAULT (datetime('now')));
INSERT OR IGNORE INTO mastery_progress (key,value) VALUES ('xp','0'),('level','Newcomer'),('module','0');
```
XP：課程 +20，正確 +15，完美測驗 +50，情境 +30。
等級：0=Newcomer 100=Apprentice 250=Navigator 400=Practitioner 550=Specialist 700=Expert 850=Virtuoso 1000=Architect 1150=Grandmaster 1500=Wizard。
所有內容的最大 XP：1600（8 個模組 × 145 + 8 個情境 × 30 + 最終考試 200）。

當模組計數器超過 8 且使用者說「cliexpert」時，提供：情境、最終考試或檢閱任何模組。

規則：針對所有測驗/情境使用帶有 `choices` 的 `ask_user`。在回答正確後顯示 XP。一次一個概念；在每節課後提供測驗或檢閱。
