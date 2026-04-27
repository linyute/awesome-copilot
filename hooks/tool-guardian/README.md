---
name: 'Tool Guardian'
description: '在 Copilot 程式碼編寫代理程式執行危險工具操作 (破壞性檔案操作、強制推送、資料庫刪除等) 前進行阻擋'
tags: ['security', 'safety', 'preToolUse', 'guardrails']
---

# Tool Guardian Hook (工具守護 Hook)

在 GitHub Copilot 程式碼編寫代理程式執行工具操作前進行阻擋，作為防範破壞性指令、強制推送、刪除資料庫及其他高風險動作的安全網。

## 概覽

AI 程式碼編寫代理程式可能會自主執行 Shell 指令、檔案操作和資料庫查詢。若沒有防護措施，誤解指令可能會導致不可逆的損害。此 Hook 會在 `preToolUse` 事件攔截每個工具呼叫，並將其與 6 個類別中的約 20 個威脅模式進行比對：

- **破壞性檔案操作**：`rm -rf /`，刪除 `.env` 或 `.git`
- **破壞性 Git 操作**：向 main/master 執行 `git push --force`，`git reset --hard`
- **資料庫破壞**：`DROP TABLE`, `DROP DATABASE`, `TRUNCATE`, 沒有 `WHERE` 的 `DELETE FROM`
- **權限濫用**：`chmod 777`，遞迴全域可寫權限
- **網路外洩**：`curl | bash`, `wget | sh`, 透過 `curl --data @` 上傳檔案
- **系統危險**：`sudo`, `npm publish`

## 功能

- **兩種防護模式**：`block` (非零值退出以防止執行) 或 `warn` (僅記錄)
- **更安全的替代方案**：每個被阻擋的模式都包含更安全指令的建議
- **支援允許清單**：透過 `TOOL_GUARD_ALLOWLIST` 跳過特定模式
- **結構化日誌**：JSON Lines 輸出，可與監控工具整合
- **快速執行**：10 秒逾時；無需外部網路呼叫
- **零依賴**：僅使用標準 Unix 工具 (`grep`, `sed`)；可選擇性使用 `jq` 進行輸入解析

## 安裝

1. 將 hook 資料夾複製到您的儲存庫：

   ```bash
   cp -r hooks/tool-guardian your-repo/hooks/
   ```

2. 確保指令碼具有執行權限：

   ```bash
   chmod +x hooks/tool-guardian/guard-tool.sh
   ```

3. 建立日誌目錄並將其加入 `.gitignore`：

   ```bash
   mkdir -p .github/logs/copilot/tool-guardian
   echo ".github/logs/" >> .gitignore
   ```

4. 將 hook 設定提交到您儲存庫的預設分支。

## 設定

此 Hook 在 `hooks.json` 中設定，以便在 `preToolUse` 事件執行：

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "hooks/tool-guardian/guard-tool.sh",
        "cwd": ".",
        "env": {
          "GUARD_MODE": "block"
        },
        "timeoutSec": 10
      }
    ]
  }
}
```

### 環境變數

| 變數 | 值 | 預設值 | 說明 |
|----------|--------|---------|-------------|
| `GUARD_MODE` | `warn`, `block` | `block` | `warn` 僅記錄威脅；`block` 非零值退出以防止工具執行 |
| `SKIP_TOOL_GUARD` | `true` | 未設定 | 完全停用守護 |
| `TOOL_GUARD_LOG_DIR` | 路徑 | `.github/logs/copilot/tool-guardian` | 寫入守護日誌的目錄 |
| `TOOL_GUARD_ALLOWLIST` | 逗號分隔 | 未設定 | 要跳過的模式 (例如 `git push --force,npm publish`) |

## 運作方式

1. 在 Copilot 程式碼編寫代理程式執行工具前，此 Hook 接收 JSON 格式的工具呼叫作為 stdin
2. 提取 `toolName` 和 `toolInput` 欄位 (若有 `jq` 則使用，否則使用正規表示式回退)
3. 將組合後的文字與允許清單進行核對 — 若符合，則跳過所有掃描
4. 將組合後的文字與 6 個嚴重性類別中的約 20 個正規表示式威脅模式進行掃描
5. 報告結果，包含類別、嚴重性、比對到的文字以及更安全的替代方案
6. 為審計目的寫入結構化的 JSON 日誌條目
7. 在 `block` 模式下，非零值退出以防止工具執行
8. 在 `warn` 模式下，記錄威脅並允許執行

## 威脅類別

| 類別 | 嚴重性 | 關鍵模式 | 建議 |
|----------|----------|-------------|------------|
| `destructive_file_ops` | 嚴重 | `rm -rf /`, `rm -rf ~`, `rm -rf .`, 刪除 `.env`/`.git` | 對特定路徑使用目標性 `rm`，或使用 `mv` 備份 |
| `destructive_git_ops` | 嚴重/高 | 向 main/master 執行 `git push --force`, `git reset --hard`, `git clean -fd` | 使用 `--force-with-lease`, `git stash`, 試運行 |
| `database_destruction` | 嚴重/高 | `DROP TABLE`, `DROP DATABASE`, `TRUNCATE`, 無 WHERE 條件的 `DELETE FROM` | 使用遷移、備份，增加 WHERE 子句 |
| `permission_abuse` | 高 | `chmod 777` | 對目錄使用 `755`，對檔案使用 `644` |
| `network_exfiltration` | 嚴重/高 | `curl | bash`, `wget | sh`, `curl --data @file` | 先下載、檢閱再執行 |
| `system_danger` | 高 | `sudo`, `npm publish` | 使用最小權限；先使用 `--dry-run` |

## 範例

### 安全指令 (退出 0)

```bash
echo '{"toolName":"bash","toolInput":"git status"}' | bash hooks/tool-guardian/guard-tool.sh
```

### 被阻擋的指令 (退出 1)

```bash
echo '{"toolName":"bash","toolInput":"git push --force origin main"}' | \
  GUARD_MODE=block bash hooks/tool-guardian/guard-tool.sh
```

```
🛡️  工具守護：在 'bash' 呼叫中檢測到 1 個威脅

  類別                     嚴重性     比對                                    建議
  --------                 --------   -----                                    ----------
  destructive_git_ops      嚴重       git push --force origin main             使用 'git push --force-with-lease' 或推送到功能分支

🚫 操作已阻擋：請解決上述威脅或調整 TOOL_GUARD_ALLOWLIST。
   將 GUARD_MODE=warn 設定為僅記錄而不阻擋。
```

### Warn 模式 (退出 0，威脅已記錄)

```bash
echo '{"toolName":"bash","toolInput":"rm -rf /"}' | \
  GUARD_MODE=warn bash hooks/tool-guardian/guard-tool.sh
```

### 允許清單指令 (退出 0)

```bash
echo '{"toolName":"bash","toolInput":"git push --force origin main"}' | \
  TOOL_GUARD_ALLOWLIST="git push --force" bash hooks/tool-guardian/guard-tool.sh
```

## 日誌格式

守護事件以 JSON Lines 格式寫入 `.github/logs/copilot/tool-guardian/guard.log`：

```json
{"timestamp":"2026-03-16T10:30:00Z","event":"threats_detected","mode":"block","tool":"bash","threat_count":1,"threats":[{"category":"destructive_git_ops","severity":"critical","match":"git push --force origin main","suggestion":"Use 'git push --force-with-lease' or push to a feature branch"}]}
```

```json
{"timestamp":"2026-03-16T10:30:00Z","event":"guard_passed","mode":"block","tool":"bash"}
```

```json
{"timestamp":"2026-03-16T10:30:00Z","event":"guard_skipped","reason":"allowlisted","tool":"bash"}
```

## 自訂

- **新增自訂模式**：編輯 `guard-tool.sh` 中的 `PATTERNS` 陣列以新增專案特定的威脅模式
- **調整嚴重性**：變更需要不同處理模式的嚴重性等級
- **允許清單已知指令**：使用 `TOOL_GUARD_ALLOWLIST` 處理在您的環境中是安全的指令
- **變更日誌位置**：設定 `TOOL_GUARD_LOG_DIR` 以將日誌路由至您偏好的目錄

## 停用

若要暫時停用守護：

- 在 Hook 環境中設定 `SKIP_TOOL_GUARD=true`
- 或從 `hooks.json` 中移除 `preToolUse` 條目

## 限制

- 基於模式的檢測；不執行指令意圖的語意分析
- 可能會對在安全情境中符合模式的指令產生誤報 (請使用允許清單來抑制)
- 掃描工具輸入的文字表示法；無法檢測混淆或編碼後的指令
- 需要以 JSON 格式透過 stdin 傳遞工具呼叫，並包含 `toolName` 和 `toolInput` 欄位
