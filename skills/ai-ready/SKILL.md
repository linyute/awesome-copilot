---
name: ai-ready
description: '讓任何儲存庫都具備 AI 準備就緒功能 — 分析您的程式碼並產生 AGENTS.md、copilot-instructions.md、CI 工作流程、問題範本等。挖掘您的 PR 審核模式並建立根據您的技術棧自訂的檔案。當使用者要求「使此儲存庫具備 AI 準備就緒功能」、「設定 AI 配置」或「為 AI 貢獻準備此儲存庫」時，請使用此技能。'
---

# AI Ready

此技能可協助使用者安裝由 [John Papa](https://github.com/johnpapa) 開發的最新 [ai-ready](https://github.com/johnpapa/ai-ready) 技能。

*為什麼？*：完整的 ai-ready 技能包含約 600 行經常演進的詳細指示。此封裝使其在此處可被搜尋到，而事實來源則保留在 [johnpapa/ai-ready](https://github.com/johnpapa/ai-ready) 中 — 始終保持最新狀態。

## 步驟

1. 告訴使用者在 Copilot CLI 中執行此命令來加入技能：

   ```
   /skills add johnpapa/ai-ready
   ```

   這會將最新版本的技能下載到他們的個人技能目錄中。重新執行該命令會更新至最新版本。

2. 提醒使用者在載入技能之前先進行檢閱。他們可以使用以下命令進行檢查：
   ```bash
   head -20 ~/.copilot/skills/ai-ready/SKILL.md
   ```
3. 在使用者確認已檢閱並安裝後，告訴他們使用 `/skills reload` 重新載入技能，然後輸入 `make this repo ai-ready`。
4. **不要**代表使用者執行命令。使用者必須自行執行。
