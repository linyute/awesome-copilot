# 模組 7：進階技巧 (Module 7: Advanced Techniques)

1. **`@` 檔案提及** — 始終提供精確的上下文，不要依賴 AI 尋找檔案
   - `@src/auth.ts` — 單一檔案
   - `@src/components/` — 目錄清單
   - 「修正 @src/auth.ts 以符合 @tests/auth.test.ts」 — 多檔案上下文

2. **`! Shell 略過`** — `!git log --oneline -5` 會立即執行，沒有 AI 額外開銷

3. **`/research`** — 使用 GitHub 搜尋和網路來源執行深度研究調查

4. **`/resume` + `--continue`** — 跨 CLI 啟動的工作階段連續性

5. **`/compact`** — 當上下文變大時壓縮歷史記錄 (在 95% 時自動執行)
   - 先使用 `/context` 檢查
   - 最好在自然的任務邊界使用
   - 警訊：AI 矛盾先前的陳述、權杖使用量 >80%

6. **`/context`** — 視覺化哪些內容正在消耗您的權杖預算

7. **自訂指令優先權 (Custom instructions precedence)** (由高至低)：
   - `CLAUDE.md` / `GEMINI.md` / `AGENTS.md` (Git 根目錄 + 目前工作目錄)
   - `.github/instructions/**/*.instructions.md` (路徑特定！)
   - `.github/copilot-instructions.md`
   - `~/.copilot/copilot-instructions.md`
   - `COPILOT_CUSTOM_INSTRUCTIONS_DIRS` (透過環境變數加入的其他目錄)

8. **路徑特定指令：**
   - `.github/instructions/backend.instructions.md` 包含 `applyTo: "src/api/**"`
   - 針對程式碼庫的不同部分採用不同的編碼標準

9. **LSP 設定** — `~/.copilot/lsp-config.json` 或 `.github/lsp.json`

10. **`/review`** — 無需離開終端機即可獲取程式碼檢閱

11. **`--allow-all` / `--yolo`** — 完全信任模式 (請負責任地使用！)

12. **`Ctrl+T`** — 觀察 AI 思考 (學習其推理模式)
