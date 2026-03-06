---
name: 'Session Logger'
description: '記錄所有 Copilot 程式編碼代理程式會話活動，以供稽核與分析'
tags: ['logging', 'audit', 'analytics']
---

# Session Logger Hook

為 GitHub Copilot 程式編碼代理程式會話提供全方位的記錄，追蹤會話開始、結束以及使用者提示 (prompts)，以供稽核軌跡與使用狀況分析。

## 概觀

此 hook 提供 Copilot 程式編碼代理程式活動的詳細記錄：
- 包含工作目錄背景資訊的會話開始/結束時間
- 使用者提示提交事件
- 可設定的記錄層級 (log levels)

## 功能

- **會話追蹤**：記錄會話開始與結束事件
- **提示記錄**：紀錄使用者提交提示的時間
- **結構化記錄**：採用 JSON 格式以便於剖析
- **隱私意識**：可設定為完全停用記錄

## 安裝

1. 將此 hook 資料夾複製到您儲存庫的 `.github/hooks/` 目錄：
   ```bash
   cp -r hooks/session-logger .github/hooks/
   ```

2. 建立日誌 (logs) 目錄：
   ```bash
   mkdir -p logs/copilot
   ```

3. 確保腳本具備執行權限：
   ```bash
   chmod +x .github/hooks/session-logger/*.sh
   ```

4. 將 hook 設定提交到您儲存庫的預設分支

## 日誌格式

會話事件會以 JSON 格式寫入 `logs/copilot/session.log`，而提示事件則寫入 `logs/copilot/prompts.log`：

```json
{"timestamp":"2024-01-15T10:30:00Z","event":"sessionStart","cwd":"/workspace/project"}
{"timestamp":"2024-01-15T10:35:00Z","event":"sessionEnd"}
```

## 隱私與安全性

- 將 `logs/` 加入 `.gitignore` 以避免提交會話資料
- 使用 `LOG_LEVEL=ERROR` 僅記錄錯誤
- 設定 `SKIP_LOGGING=true` 環境變數以停用記錄
- 日誌僅儲存在本地端
