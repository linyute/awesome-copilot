---
name: 'Session Auto-Commit'
description: '當 Copilot 程式編碼代理程式會話結束時自動提交並推送變更'
tags: ['automation', 'git', 'productivity']
---

# Session Auto-Commit Hook

在 GitHub Copilot 程式編碼代理程式會話結束時自動提交並推送變更，確保您的工作始終得到儲存與備份。

## 概觀

此 hook 在每個 Copilot 程式編碼代理程式會話結束時執行，並自動：
- 偵測是否有未提交的變更
- 暫存 (stage) 所有變更
- 建立帶有時間戳記的提交 (commit)
- 推送 (push) 至遠端儲存庫

## 功能

- **自動備份**：絕不遺失來自 Copilot 會話的工作內容
- **帶有時間戳記的提交**：每個自動提交都包含會話結束時間
- **安全執行**：僅在有實際變更時才進行提交
- **錯誤處理**：優雅地處理推送失敗的情況

## 安裝

1. 將此 hook 資料夾複製到您儲存庫的 `.github/hooks/` 目錄：
   ```bash
   cp -r hooks/session-auto-commit .github/hooks/
   ```

2. 確保腳本具備執行權限：
   ```bash
   chmod +x .github/hooks/session-auto-commit/auto-commit.sh
   ```

3. 將 hook 設定提交到您儲存庫的預設分支

## 設定

此 hook 在 `hooks.json` 中設定為在 `sessionEnd` 事件時執行：

```json
{
  "version": 1,
  "hooks": {
    "sessionEnd": [
      {
        "type": "command",
        "bash": ".github/hooks/session-auto-commit/auto-commit.sh",
        "timeoutSec": 30
      }
    ]
  }
}
```

## 運作方式

1. 當 Copilot 程式編碼代理程式會話結束時，執行該 hook
2. 檢查是否位於 Git 儲存庫內
3. 使用 `git status` 偵測未提交的變更
4. 使用 `git add -A` 暫存所有變更
5. 建立提交，格式為：`auto-commit: YYYY-MM-DD HH:MM:SS`
6. 嘗試推送到遠端
7. 回報成功或失敗

## 客製化

您可以透過修改 `auto-commit.sh` 來自客製化此 hook：

- **提交訊息格式**：變更時間戳記格式或訊息前綴
- **選擇性暫存**：使用特定的 git add 模式而非 `-A`
- **分支選擇**：僅推送至特定分支
- **通知**：加入桌面通知或 Slack 訊息

## 停用

若要暫時停用自動提交：

1. 移除或註解掉 `hooks.json` 中的 `sessionEnd` hook
2. 或設定環境變數：`export SKIP_AUTO_COMMIT=true`

## 注意事項

- 此 hook 使用 `--no-verify` 以避免觸發 pre-commit hooks
- 推送失敗不會阻礙會話結束
- 需要設定適當的 git 認證資訊
- 支援 Copilot 程式編碼代理程式與 GitHub Copilot CLI
