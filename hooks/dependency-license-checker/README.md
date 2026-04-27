---
name: 'Dependency License Checker'
description: '在工作階段結束時掃描新增加的相依套件以確保授權合規性 (GPL, AGPL 等)'
tags: ['compliance', 'license', 'dependencies', 'session-end']
---

# Dependency License Checker Hook (相依套件授權檢查 Hook)

在 GitHub Copilot 程式碼編寫工作階段結束時，掃描新增加的相依套件是否符合授權規範，在提交前標記出 Copyleft 和限制性授權 (GPL, AGPL, SSPL 等)。

## 概覽

AI 程式碼編寫代理程式可能會在工作階段中新增相依套件，而未考慮到授權的影響。此 Hook 作為合規性的安全網，檢測多個生態系統中的新相依套件，查找其授權，並針對可設定的 Copyleft 和限制性授權阻擋清單進行檢查。

## 功能

- **多生態系統支援**：npm, pip, Go, Ruby 和 Rust 相依套件檢測
- **兩種模式**：`warn` (僅記錄) 或 `block` (非零值退出以防止提交)
- **可設定阻擋清單**：預設涵蓋完整的 SPDX 變體 Copyleft 授權集合
- **支援允許清單**：透過 `LICENSE_ALLOWLIST` 跳過已知的可接受套件
- **智慧檢測**：使用 `git diff` 僅檢測新增加的相依套件
- **多種查找策略**：本地快取、套件管理工具 CLI，並提供 UNKNOWN 回退機制
- **結構化日誌**：JSON Lines 輸出，可與監控工具整合
- **逾時保護**：每個授權查找均封裝在 5 秒逾時內
- **零強制依賴**：僅使用標準 Unix 工具；可選擇性使用 `jq` 以進行更好的 JSON 解析

## 安裝

1. 將 hook 資料夾複製到您的儲存庫：

   ```bash
   cp -r hooks/dependency-license-checker .github/hooks/
   ```

2. 確保指令碼具有執行權限：

   ```bash
   chmod +x .github/hooks/dependency-license-checker/check-licenses.sh
   ```

3. 建立日誌目錄並將其加入 `.gitignore`：

   ```bash
   mkdir -p logs/copilot/license-checker
   echo "logs/" >> .gitignore
   ```

4. 將 hook 設定提交到您儲存庫的預設分支。

## 設定

此 Hook 在 `hooks.json` 中設定，以便在 `sessionEnd` 事件執行：

```json
{
  "version": 1,
  "hooks": {
    "sessionEnd": [
      {
        "type": "command",
        "bash": ".github/hooks/dependency-license-checker/check-licenses.sh",
        "cwd": ".",
        "env": {
          "LICENSE_MODE": "warn"
        },
        "timeoutSec": 60
      }
    ]
  }
}
```

### 環境變數

| 變數 | 值 | 預設值 | 說明 |
|----------|--------|---------|-------------|
| `LICENSE_MODE` | `warn`, `block` | `warn` | `warn` 僅記錄違規；`block` 非零值退出以防止自動提交 |
| `SKIP_LICENSE_CHECK` | `true` | 未設定 | 完全停用檢查器 |
| `LICENSE_LOG_DIR` | 路徑 | `logs/copilot/license-checker` | 寫入檢查日誌的目錄 |
| `BLOCKED_LICENSES` | 逗號分隔的 SPDX ID | Copyleft 集合 | 要標記為違規的授權 |
| `LICENSE_ALLOWLIST` | 逗號分隔 | 未設定 | 要跳過的套件名稱 (例如 `linux-headers,glibc`) |

## 運作方式

1. 當 Copilot 程式碼編寫工作階段結束時，此 Hook 執行
2. 針對清單檔案 (package.json, requirements.txt, go.mod 等) 執行 `git diff HEAD`
3. 從差異輸出中提取新增加的套件名稱
4. 使用本地快取和套件管理工具 CLI 查找每個套件的授權
5. 使用不區分大小寫的子字串比對，將每個授權與阻擋清單進行核對
6. 在標記前跳過允許清單中的套件
7. 以格式化的表格報告結果，包含套件、生態系統、授權和狀態
8. 為審計目的寫入結構化的 JSON 日誌條目
9. 在 `block` 模式下，非零值退出以通知代理程式在提交前停止

## 支援的生態系統

| 生態系統 | 清單檔案 | 主要查找方式 | 回退方式 |
|-----------|--------------|----------------|----------|
| npm/yarn/pnpm | `package.json` | `node_modules/<pkg>/package.json` 授權欄位 | `npm view <pkg> license` |
| pip | `requirements.txt`, `pyproject.toml` | `pip show <pkg>` License 欄位 | UNKNOWN |
| Go | `go.mod` | 模組快取中的 LICENSE 檔案 (關鍵字比對) | UNKNOWN |
| Ruby | `Gemfile` | `gem spec <pkg> license` | UNKNOWN |
| Rust | `Cargo.toml` | `cargo metadata` 授權欄位 | UNKNOWN |

## 預設阻擋授權

以下授權預設被阻擋 (Copyleft 和限制性)：

- **GPL**: GPL-2.0, GPL-2.0-only, GPL-2.0-or-later, GPL-3.0, GPL-3.0-only, GPL-3.0-or-later
- **AGPL**: AGPL-1.0, AGPL-3.0, AGPL-3.0-only, AGPL-3.0-or-later
- **LGPL**: LGPL-2.0, LGPL-2.1, LGPL-2.1-only, LGPL-2.1-or-later, LGPL-3.0, LGPL-3.0-only, LGPL-3.0-or-later
- **其他**: SSPL-1.0, EUPL-1.1, EUPL-1.2, OSL-3.0, CPAL-1.0, CPL-1.0
- **Creative Commons (限制性)**: CC-BY-SA-4.0, CC-BY-NC-4.0, CC-BY-NC-SA-4.0

使用 `BLOCKED_LICENSES` 覆寫以進行自訂。

## 輸出範例

### 清潔掃描 (無新增加相依套件)

```
✅ 沒有檢測到新的相依套件
```

### 清潔掃描 (全部合規)

```
🔍 正在檢查 3 個新相依套件的授權...

  套件                           生態系統     授權                           狀態
  -------                        ---------    -------                        ------
  express                        npm          MIT                            OK
  lodash                         npm          MIT                            OK
  axios                          npm          MIT                            OK

✅ 所有 3 個相依套件皆有合規的授權
```

### 檢測到違規 (warn 模式)

```
🔍 正在檢查 2 個新相依套件的授權...

  套件                           生態系統     授權                           狀態
  -------                        ---------    -------                        ------
  react                          npm          MIT                            OK
  readline-sync                  npm          GPL-3.0                        BLOCKED

⚠️  發現 1 個授權違規：

  - readline-sync (npm): GPL-3.0

💡 請檢閱上述違規。將 LICENSE_MODE=block 設定為防止在有授權問題時提交。
```

### 檢測到違規 (block 模式)

```
🔍 正在檢查 2 個新相依套件的授權...

  套件                           生態系統     授權                           狀態
  -------                        ---------    -------                        ------
  flask                          pip          BSD-3-Clause                   OK
  copyleft-lib                   pip          AGPL-3.0                       BLOCKED

⚠️  發現 1 個授權違規：

  - copyleft-lib (pip): AGPL-3.0

🚫 工作階段已阻擋：請在提交前解決上述授權違規。
   將 LICENSE_MODE=warn 設定為僅記錄而不阻擋，或將套件加入 LICENSE_ALLOWLIST。
```

## 日誌格式

檢查事件以 JSON Lines 格式寫入 `logs/copilot/license-checker/check.log`：

```json
{"timestamp":"2026-03-17T10:30:00Z","event":"license_check_complete","mode":"warn","dependencies_checked":3,"violation_count":1,"violations":[{"package":"readline-sync","ecosystem":"npm","license":"GPL-3.0","status":"BLOCKED"}]}
```

```json
{"timestamp":"2026-03-17T10:30:00Z","event":"license_check_complete","mode":"warn","status":"clean","dependencies_checked":0}
```

## 與其他 Hook 的搭配

此 Hook 可與以下項目良好搭配：

- **Secrets Scanner**：在自動提交前，先執行機密掃描，再進行授權檢查
- **工作階段自動提交**：當兩者皆安裝時，將其排序，使 `dependency-license-checker` 先執行。設定 `LICENSE_MODE=block` 以在檢測到違規時防止自動提交。

## 自訂

- **修改阻擋授權**：將 `BLOCKED_LICENSES` 設定為自訂的逗號分隔 SPDX ID 清單
- **允許清單套件**：使用 `LICENSE_ALLOWLIST` 處理具有 Copyleft 授權但已知可接受的套件
- **變更日誌位置**：設定 `LICENSE_LOG_DIR` 以將日誌路由至您偏好的目錄
- **新增生態系統**：擴充 `check-licenses.sh` 中的檢測和查找部分

## 停用

若要暫時停用檢查器：

- 在 Hook 環境中設定 `SKIP_LICENSE_CHECK=true`
- 或從 `hooks.json` 中移除 `sessionEnd` 條目

## 限制

- 授權檢測依賴於清單檔案的差異；在標準清單檔案之外新增的相依套件不會被檢測到
- 授權查找需要套件管理工具 CLI 或本地快取可用
- 若複合 SPDX 表達式 (例如 `MIT OR GPL-3.0`) 的任何組件符合阻擋清單，即會被標記
- 不執行深層遞移相依套件的授權分析
- 網路查找 (npm view 等) 在離線或受限環境中可能會失敗
- 需要在執行環境中提供 `git`
