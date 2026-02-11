# 🪝 Hooks

Hooks 可啟用自動化工作流程，當 GitHub Copilot 程式碼代理程式工作階段發生特定事件（例如工作階段開始、工作階段結束、使用者提示提交或工具使用）時觸發。
### 如何使用 Hooks

**包含內容：**
- 每個 hook 都是包含一個 `README.md` 檔案與一個 `hooks.json` 設定檔的資料夾
- Hooks 可能包含輔助腳本、公用工具或其他打包資源
- Hooks 遵循 [GitHub Copilot hooks 規範](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)

**安裝方式：**
- 將 hook 資料夾複製到您儲存庫的 `.github/hooks/` 目錄下
- 確保任何打包的腳本為可執行（`chmod +x script.sh`）
- 將 hook 提交到儲存庫的預設分支

**啟用/使用方式：**
- Hooks 會在 Copilot 程式碼代理程式的工作階段中自動執行
- 在 `hooks.json` 檔案中設定 hook 事件
- 可用事件：`sessionStart`、`sessionEnd`、`userPromptSubmitted`、`preToolUse`、`postToolUse`、`errorOccurred`

**何時使用：**
- 自動化工作階段紀錄與稽核追蹤
- 在工作階段結束時自動提交變更
- 追蹤使用分析
- 與外部工具與服務整合
- 自訂工作階段工作流程

| 名稱 | 描述 | 事件 | 捆綁資產 |
| ---- | ----------- | ------ | -------------- |
| [Session Auto-Commit](../hooks/session-auto-commit/README.md) | 當 Copilot 程式編碼代理程式會話結束時自動提交並推送變更 | sessionEnd | `auto-commit.sh`<br />`hooks.json` |
| [Session Logger](../hooks/session-logger/README.md) | 記錄所有 Copilot 程式編碼代理程式會話活動，以供稽核與分析 | sessionStart, sessionEnd, userPromptSubmitted | `hooks.json`<br />`log-prompt.sh`<br />`log-session-end.sh`<br />`log-session-start.sh` |
