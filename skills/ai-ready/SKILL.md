---
name: ai-ready
description: '讓任何存放庫具備 AI 就緒能力 — 分析您的程式碼庫並產生 AGENTS.md、copilot-instructions.md、CI 工作流程、案件 (issue) 範本等。挖掘您的 PR 檢閱模式並根據您的技術棧建立自定義檔案。當使用者要求「使此存放庫具備 AI 就緒能力」、「設置 AI 設定」或「為 AI 貢獻準備此存放庫」時，請使用此技能。'
---

# AI 就緒 (AI Ready)

此技能幫助使用者將最新的 [ai-ready](https://github.com/johnpapa/ai-ready) `SKILL.md` (由 [John Papa](https://github.com/johnpapa) 編寫) 安裝到他們的個人技能目錄中。

*為什麼？*：完整的 ai-ready 技能包含約 600 行詳細指令且經常更新。此包裝器使其在此處可供搜尋，而事實來源則保留在 [johnpapa/ai-ready](https://github.com/johnpapa/ai-ready) — 始終保持最新狀態。

## 步驟

1. 告訴使用者透過在終端機中執行以下其中一個指令，將最新的 `SKILL.md` 下載到他們的個人技能目錄中。這將覆蓋任何現有的本機複本。

   **bash / zsh**
   ```bash
   mkdir -p ~/.copilot/skills/ai-ready
   curl -fsSL https://raw.githubusercontent.com/johnpapa/ai-ready/main/skills/ai-ready/SKILL.md \
     -o ~/.copilot/skills/ai-ready/SKILL.md
   ```

   **PowerShell**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$HOME/.copilot/skills/ai-ready" | Out-Null
   Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/johnpapa/ai-ready/main/skills/ai-ready/SKILL.md" -OutFile "$HOME/.copilot/skills/ai-ready/SKILL.md"
   ```

   為了獲得可重現的行為，使用者可以將 URL 中的 `main` 替換為特定的標籤 (tag) 或提交 SHA。
2. 建議使用者在載入下載的技能之前先檢閱它，以確認其包含預期的指令：
   ```bash
   head -20 ~/.copilot/skills/ai-ready/SKILL.md
   ```
3. 在使用者確認已安裝後，告訴他們使用 `/skills reload` 重新載入技能，然後說 `make this repo ai-ready`。
4. **不要**代表使用者執行安裝指令。使用者必須自行執行。
