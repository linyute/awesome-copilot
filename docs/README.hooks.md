# 🪝 勾點 (Hooks)

勾點可實作由 GitHub Copilot 編碼代理程式工作階段期間的特定事件觸發的自動化工作流程，例如工作階段開始、結束、使用者提示和工具使用。
### 如何貢獻

請參閱 [CONTRIBUTING.md](../CONTRIBUTING.md#adding-hooks) 以獲取有關如何貢獻新勾點、改進現有勾點以及分享您的使用案例的準則。

### 如何使用勾點

**包含內容：**
- 每個勾點都是一個包含 `README.md` 檔案和 `hooks.json` 設定的資料夾
- 勾點可能包含輔助指令碼、工具或其他隨附資產
- 勾點遵循 [GitHub Copilot 勾點規格](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)

**安裝方式：**
- 將勾點資料夾複製到您存放區的 `.github/hooks/` 目錄
- 確保任何隨附指令碼皆具備執行權限 (`chmod +x script.sh`)
- 將勾點提交至您存放區的預設分支

**啟動/使用方式：**
- 勾點在 Copilot 編碼代理程式工作階段期間自動執行
- 在 `hooks.json` 檔案中設定勾點事件
- 可用事件：`sessionStart`, `sessionEnd`, `userPromptSubmitted`, `preToolUse`, `postToolUse`, `errorOccurred`

**何時使用：**
- 自動化工作階段記錄與稽核追蹤
- 在工作階段結束時自動提交變更
- 追蹤使用情形分析
- 與外部工具和服務整合
- 自定義工作階段工作流程

| 名稱 | 說明 | 事件 | 隨附資產 |
| ---- | ----------- | ------ | -------------- |
| [Dependency License Checker](../hooks/dependency-license-checker/README.md) | 在工作階段結束時掃描新增加的相依套件以確保授權合規性 (GPL, AGPL 等) | sessionEnd | `check-licenses.sh`<br />`hooks.json` |
| [Governance Audit](../hooks/governance-audit/README.md) | 掃描 Copilot 代理程式提示以尋找威脅訊號並記錄治理事件 | sessionStart, sessionEnd, userPromptSubmitted | `audit-prompt.sh`<br />`audit-session-end.sh`<br />`audit-session-start.sh`<br />`hooks.json` |
| [Secrets Scanner](../hooks/secrets-scanner/README.md) | 掃描 Copilot 編碼代理程式工作階段中修改的檔案，尋找洩漏的機密、認證資訊和敏感資料 | sessionEnd | `hooks.json`<br />`scan-secrets.sh` |
| [Session Auto-Commit](../hooks/session-auto-commit/README.md) | 當 Copilot 程式編碼代理程式會話結束時自動提交並推送變更 | sessionEnd | `auto-commit.sh`<br />`hooks.json` |
| [Session Logger](../hooks/session-logger/README.md) | 記錄所有 Copilot 程式編碼代理程式會話活動，以供稽核與分析 | sessionStart, sessionEnd, userPromptSubmitted | `hooks.json`<br />`log-prompt.sh`<br />`log-session-end.sh`<br />`log-session-start.sh` |
| [Tool Guardian](../hooks/tool-guardian/README.md) | 在 Copilot 程式碼編寫代理程式執行危險工具操作 (破壞性檔案操作、強制推送、資料庫刪除等) 前進行阻擋 | preToolUse | `guard-tool.sh`<br />`hooks.json` |
