# CodeQL 疑難排解參考

用於診斷和解決 CodeQL 分析錯誤、SARIF 上傳問題以及常見組態問題的綜合指南。

## 建構與分析錯誤

### 「在建構期間未見到原始程式碼」

**原因：** CodeQL 擷取器在建立資料庫期間未找到任何來源檔案。

**解決方案：**
- 驗證 `--source-root` 指向正確的目錄
- 對於編譯語言，確保建構命令確實編譯了來源檔案
- 檢查 `autobuild` 是否偵測到正確的建構系統
- 從 `autobuild` 切換到具有明確建構命令的 `manual` 建構模式
- 驗證指定的語言與實際的原始程式碼語言匹配

### 自動建構失敗

**原因：** `autobuild` 無法偵測或執行專案的建構系統。

**解決方案：**
- 切換到 `build-mode: manual` 並提供明確的建構命令
- 確保在執行器 (runner) 上安裝了所有建構相依性
- 對於 C/C++：驗證 `gcc`、`make`、`cmake` 或 `msbuild` 是否可用
- 對於 C#：驗證是否安裝了 `.NET SDK` 或 `MSBuild`
- 對於 Java：驗證是否安裝了 `gradle` 或 `maven`
- 檢查自動建構記錄中失敗的特定偵測步驟

### C# 編譯器意外失敗

**原因：** CodeQL 追蹤器注入了可能與專案組態衝突的編譯器旗標。

**詳情：** CodeQL 注入了 `/p:EmitCompilerGeneratedFiles=true`，這可能會導致以下問題：
- 舊版 .NET Framework 專案
- 使用 `.sqlproj` 檔案的專案

**解決方案：**
- 在有問題的專案檔案中添加 `<EmitCompilerGeneratedFiles>false</EmitCompilerGeneratedFiles>`
- 如果建構準確性可以接受，對於 C# 使用 `build-mode: none`
- 從 CodeQL 分析中排除有問題的專案

### 分析花費時間太長

**原因：** 程式碼庫龐大、查詢複雜或資源不足。

**解決方案：**
- 在準確性可以接受的情況下使用 `build-mode: none`（顯著加快速度）
- 啟用相依性快取：`dependency-caching: true`
- 在工作 (job) 上設定 `timeout-minutes` 以防止工作流程掛起
- 使用 `--threads=0` (CLI) 以使用所有可用的 CPU 核心
- 縮小查詢範圍：使用 `default` 套組而非 `security-and-quality`
- 對於自我裝載 (self-hosted) 的執行器，確保硬體符合建議：
  - 小型 (<100K LOC)：8 GB RAM, 2 核心
  - 中型 (100K–1M LOC)：16 GB RAM, 4–8 核心
  - 大型 (>1M LOC)：64 GB RAM, 8 核心
- 如果可用，設定較大的 GitHub 裝載執行器
- 在組態檔案中使用 `paths` 來限制分析的目錄

### CodeQL 掃描的行數少於預期

**原因：** 建構命令未編譯所有來源檔案，或 `build-mode: none` 遺漏了產生的程式碼。

**解決方案：**
- 從 `none` 切換到 `autobuild` 或 `manual` 建構模式
- 確保建構命令編譯完整的程式碼庫（而不僅僅是子集）
- 檢查程式碼掃描記錄中的擷取指標：
  - 程式碼庫中的程式碼行數（基準）
  - 已擷取的程式碼行數
  - 排除自動產生檔案後的行數
- 驗證語言偵測包含所有預期的語言

### 在無建構模式下偵測到 Kotlin

**原因：** 儲存庫使用 `build-mode: none`（僅限 Java）但亦包含 Kotlin 程式碼。

**解決方案：**
- 停用預設設定並重新啟用它（切換到 `autobuild`）
- 或切換到進階設定，對於 `java-kotlin` 使用 `build-mode: autobuild`
- Kotlin 需要建構才能進行分析；`none` 模式僅適用於 Java

## 權限與存取錯誤

### 錯誤：403 "Resource not accessible by integration"

**原因：** `GITHUB_TOKEN` 缺少所需的權限。

**解決方案：**
- 在工作流程中加入明確的權限：
  ```yaml
  permissions:
    security-events: write
    contents: read
    actions: read
  ```
- 對於 Dependabot PR，使用 `pull_request_target` 而非 `pull_request`
- 驗證儲存庫是否已啟用 GitHub 程式碼安全性（針對私人儲存庫）

### 無法在私人儲存庫中啟用 CodeQL

**原因：** GitHub 程式碼安全性 (GitHub Code Security) 未啟用。

**解決方案：** 在儲存庫 Settings → Advanced Security 中啟用 GitHub 程式碼安全性。

### 錯誤："GitHub Code Security or Advanced Security must be enabled"

**原因：** 嘗試在沒有所需授權的情況下在私人儲存庫上使用程式碼掃描。

**解決方案：**
- 為儲存庫啟用 GitHub 程式碼安全性
- 聯絡組織管理員以啟用進階安全性 (Advanced Security)

## 組態錯誤

### 執行了兩個 CodeQL 工作流程

**原因：** 預設設定和預先存在的 `codeql.yml` 工作流程皆處於作用中狀態。

**解決方案：**
- 如果使用進階設定，請停用預設設定，或者
- 如果使用預設設定，請刪除舊的工作流程檔案
- 檢查儲存庫 Settings → Advanced Security 以查看作用中的組態

### 部分語言未經分析

**原因：** Matrix 組態未包含所有語言。

**解決方案：**
- 將缺失的語言加入 `matrix.include` 陣列
- 驗證語言識別碼是否正確（例如：`javascript-typescript` 而非僅 `javascript`）
- 檢查每種語言是否具有適當的 `build-mode`

### 不清楚是什麼觸發了工作流程執行

**解決方案：**
- 檢查儲存庫 Settings → Advanced Security 中的工具狀態頁面
- 檢閱工作流程執行記錄以獲取觸發事件詳情
- 查看工作流程檔案中的 `on:` 觸發器

### 錯誤："is not a .ql file, .qls file, a directory, or a query pack specification"

**原因：** 工作流程中的查詢或套件引用無效。

**解決方案：**
- 驗證查詢套件名稱和版本是否存在
- 使用正確格式：`owner/pack-name@version` 或 `owner/pack-name:path/to/query.ql`
- 執行 `codeql resolve packs` 以驗證可用的套件

## 資源錯誤

### 「磁碟空間不足」或「記憶體不足」

**原因：** 執行器 (runner) 缺少足夠的資源進行分析。

**解決方案：**
- 使用較大的 GitHub 裝載執行器（如果可用）
- 對於自我裝載執行器，增加 RAM 和磁碟（建議 SSD 且 ≥14 GB）
- 使用 `paths` 組態縮小分析範圍
- 每個工作 (job) 分析較少的語言
- 使用 `build-mode: none` 以減少資源使用

### 資料庫中的擷取錯誤

**原因：** 某些來源檔案無法由 CodeQL 擷取器處理。

**解決方案：**
- 檢查工作流程記錄中的擷取指標以查看錯誤計數
- 啟用偵錯記錄以進行詳細的擷取診斷
- 驗證來源檔案在語法上是否有效
- 確保所有建構相依性均可用

## 記錄與偵錯

### 啟用偵錯記錄

若要獲取更詳細的診斷資訊：

**GitHub Actions：**
1. 重新執行已啟用偵錯記錄的工作流程
2. 在工作流程執行中，點擊 "Re-run jobs" → "Enable debug logging"

**CodeQL CLI：**
```bash
codeql database create my-db \
  --language=javascript-typescript \
  --verbosity=progress++ \
  --logdir=codeql-logs
```

**詳細程度 (Verbosity levels)：** `errors`, `warnings`, `progress`, `progress+`, `progress++`, `progress+++`

### 程式碼掃描記錄指標

工作流程記錄包含摘要指標：
- **程式碼庫中的程式碼行數** — 擷取前的基準
- **CodeQL 資料庫中的程式碼行數** — 已擷取的部分，包含外部函式庫
- **排除自動產生檔案後的行數** — 淨分析程式碼
- **擷取成功/錯誤/警告計數** — 每個檔案的擷取結果

### 私有登錄 (Private Registry) 診斷

針對具有私有套件登錄的 `build-mode: none`：
- 檢查工作流程記錄中的 "Setup proxy for registries" 步驟
- 尋找 `Credentials loaded for the following registries:` 訊息
- 驗證組織層級的私有登錄組態
- 確保可用網際網路存取以進行相依性解析

## SARIF 上傳錯誤

### SARIF 檔案太大

**限制：** 最大 10 MB (gzip 壓縮)。

**解決方案：**
- 專注於最重要的查詢套組 (query suites)（使用 `default` 而非 `security-and-quality`）
- 透過組態減少查詢數量
- 將分析拆分為具有獨立 SARIF 上傳的多個工作
- 移除 `--sarif-add-file-contents` 旗標

### SARIF 結果超過限制

GitHub 對 SARIF 資料物件強制執行限制：

| 物件 | 最大值 |
|---|---|
| 每個檔案的執行次數 | 20 |
| 每次執行的結果數 | 25,000 |
| 每次執行的規則數 | 25,000 |
| 每次執行的工具擴充功能數 | 100 |
| 每個結果的執行緒流位置數 | 10,000 |
| 每個結果的位置數 | 1,000 |
| 每個規則的標籤數 | 20 |

**解決方案：**
- 縮小查詢範圍以專注於具高影響力的規則
- 使用不同的 `--sarif-category` 將分析拆分到多個 SARIF 上傳中
- 停用產生大量結果的吵雜查詢

### SARIF 檔案無效

**解決方案：**
- 針對 [Microsoft SARIF 驗證器](https://sarifweb.azurewebsites.net/) 進行驗證
- 確保 `version` 為 `"2.1.0"` 且 `$schema` 指向正確的結構 (schema)
- 驗證必填屬性 (`runs`、`tool.driver`、`results`) 是否存在

### 上傳被拒絕：預設設定已啟用

**原因：** 預設設定處於作用中狀態時，無法上傳 CodeQL 產生的 SARIF。

**解決方案：**
- 在透過 CLI/API 上傳之前停用預設設定
- 或者切換到僅使用預設設定（不進行手動上傳）

### 缺少身份驗證權杖 (Token)

**解決方案：**
- 設定具有 `security-events: write` 範圍的 `GITHUB_TOKEN` 環境變數
- 或者使用 `--github-auth-stdin` 以管線方式傳遞權杖
- 對於 GitHub Actions：權杖會自動透過 `${{ secrets.GITHUB_TOKEN }}` 提供
