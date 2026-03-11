# 最終考試 (Final Exam)

使用 `ask_user` 呈現包含 10 個問題的綜合測驗，每個問題有 4 個選項。需要 80% 以上的正確率才能通過。每次都變換選擇。

## 題庫 (Question Bank)

1. 哪個指令可以在新專案中初始化 Copilot CLI？ → `/init`
2. 哪個快捷鍵可以循環切換模式？ → `Shift+Tab`
3. 存放庫層級的自訂 Agent 儲存在哪裡？ → `.github/agents/*.md`
4. MCP 代表什麼？ → Model Context Protocol (模型上下文協定)
5. 哪個 Agent 可以安全地平行執行？ → `explore`
6. 如何將檔案加入 AI 上下文？ → `@filename`（例如 `@src/auth.ts`）
7. 哪個檔案具有最高的指令優先權？ → `CLAUDE.md` / `GEMINI.md` / `AGENTS.md`（Git 根目錄 + 目前工作目錄）
8. 哪個指令可以壓縮對話歷史記錄？ → `/compact`
9. MCP 在專案層級於何處設定？ → `.github/mcp-config.json`
10. `--yolo` 的作用是什麼？ → 與 `--allow-all` 相同（跳過所有確認）
11. `/research` 的作用是什麼？ → 執行帶有來源的深度研究調查
12. 哪個快捷鍵可以在 $EDITOR 中開啟輸入？ → `Ctrl+G`
13. `/reset-allowed-tools` 的作用是什麼？ → 重新啟用確認提示
14. 哪個指令可以將最後一個 AI 回應複製到剪貼簿？ → `/copy`
15. `/compact` 的作用是什麼？ → 總結對話以釋放上下文

通過時 (80%+)：授予「CLI 巫師 (CLI Wizard)」稱號，熱烈祝賀！
未通過時：顯示哪些題目答錯了，鼓勵重新嘗試。
