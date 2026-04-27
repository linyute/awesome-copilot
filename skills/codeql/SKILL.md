---
name: 'codeql'
description: 'GitHub Actions 工作流程與 CodeQL CLI 設定及組態 CodeQL 程式碼掃描的完整指南。當使用者需要關於程式碼掃描組態、CodeQL 工作流程檔案、CodeQL CLI 指令、SARIF 輸出、安全性分析設定或 CodeQL 分析疑難排解的協助時，應使用此技能。'
---

# CodeQL 程式碼掃描

此技能提供組態與執行 CodeQL 程式碼掃描的程序性指南 — 包含透過 GitHub Actions 工作流程以及獨立的 CodeQL CLI。

## 何時使用此技能

當要求涉及以下內容時，請使用此技能：

- 建立或自訂 `codeql.yml` GitHub Actions 工作流程
- 在程式碼掃描的預設設定與進階設定之間進行選擇
- 組態 CodeQL 語言 Matrix、建構模式或查詢套件
- 在本機執行 CodeQL CLI (`codeql database create`, `database analyze`, `github upload-results`)
- 理解或解讀 CodeQL 的 SARIF 輸出
- 疑難排解 CodeQL 分析失敗（建構模式、編譯式語言、執行器需求）
- 為具有各元件掃描需求的 monorepo 設定 CodeQL
- 組態相依性快取、自訂查詢套件或模型套件

## 支援的語言

CodeQL 支援以下語言識別碼：

| 語言 | 識別碼 | 替代項 |
|---|---|---|
| C/C++ | `c-cpp` | `c`, `cpp` |
| C# | `csharp` | — |
| Go | `go` | — |
| Java/Kotlin | `java-kotlin` | `java`, `kotlin` |
| JavaScript/TypeScript | `javascript-typescript` | `javascript`, `typescript` |
| Python | `python` | — |
| Ruby | `ruby` | — |
| Rust | `rust` | — |
| Swift | `swift` | — |
| GitHub Actions | `actions` | — |

> 替代識別碼與標準識別碼等效（例如：`javascript` 不會排除 TypeScript 分析）。

## 核心工作流程 — GitHub Actions

### 步驟 1：選擇設定類型

- **預設設定 (Default setup)** — 從儲存庫「設定 (Settings)」→「程式碼安全性與分析 (Code security and analysis)」→「CodeQL 分析 (CodeQL analysis)」啟用。最適合快速入門。對大多數語言使用 `none` 建構模式。
- **進階設定 (Advanced setup)** — 建立 `.github/workflows/codeql.yml` 檔案，以完全控制觸發器、建構模式、查詢套件和 Matrix 策略。

若要從預設設定切換為進階設定：請先停用預設設定，然後提交工作流程檔案。

### 步驟 2：組態工作流程觸發器

定義掃描執行的時機：

```yaml
on:
  push:
    branches: [main, protected]
  pull_request:
    branches: [main]
  schedule:
    - cron: '30 6 * * 1'  # 每週一 6:30 UTC
```

- `push` — 每次推送到指定分支時進行掃描；結果會顯示在「安全性 (Security)」索引標籤中
- `pull_request` — 掃描 PR 的合併提交；結果會顯示為 PR 檢查註釋
- `schedule` — 對預設分支進行定期掃描（cron 必須存在於預設分支上）
- `merge_group` — 如果儲存庫使用合併佇列，請新增此項

若要跳過僅限文件變更的 PR 掃描：

```yaml
on:
  pull_request:
    paths-ignore:
      - '**/*.md'
      - '**/*.txt'
```

> `paths-ignore` 控制工作流程是否執行，而非分析哪些檔案。

### 步驟 3：組態權限

設定最小權限：

```yaml
permissions:
  security-events: write   # 上傳 SARIF 結果所需
  contents: read            # 檢出程式碼所需
  actions: read             # 使用 codeql-action 的私有儲存庫所需
```

### 步驟 4：組態語言 Matrix

使用 Matrix 策略來並行分析各個語言：

```yaml
jobs:
  analyze:
    name: Analyze (${{ matrix.language }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        include:
          - language: javascript-typescript
            build-mode: none
          - language: python
            build-mode: none
```

對於編譯式語言，請設定適當的 `build-mode`：
- `none` — 不需要建構（支援 C/C++, C#, Java, Rust）
- `autobuild` — 自動建構偵測
- `manual` — 自訂建構指令（僅限進階設定）

> 關於各語言的詳細自動建構 (autobuild) 行為與執行器需求，請搜尋 `references/compiled-languages.md`。

### 步驟 5：組態 CodeQL 初始化與分析

```yaml
steps:
  - name: Checkout repository
    uses: actions/checkout@v4

  - name: Initialize CodeQL
    uses: github/codeql-action/init@v4
    with:
      languages: ${{ matrix.language }}
      build-mode: ${{ matrix.build-mode }}
      queries: security-extended
      dependency-caching: true

  - name: Perform CodeQL Analysis
    uses: github/codeql-action/analyze@v4
    with:
      category: "/language:${{ matrix.language }}"
```

**查詢套件選項：**
- `security-extended` — 預設安全性查詢加上額外的涵蓋範圍
- `security-and-quality` — 安全性加上程式碼品質查詢
- 透過 `packs:` 輸入使用自訂查詢套件（例如：`codeql/javascript-queries:AlertSuppression.ql`）

**相依性快取：** 在 `init` 動作上設定 `dependency-caching: true`，以在多次執行之間快取還原的相依性。

**分析類別：** 使用 `category` 來區分 monorepo 中的 SARIF 結果（例如：依語言、依元件）。

### 步驟 6：Monorepo 組態

對於具有多個元件的 monorepo，請使用 `category` 參數來分隔 SARIF 結果：

```yaml
category: "/language:${{ matrix.language }}/component:frontend"
```

若要將分析限制在特定目錄，請使用 CodeQL 組態檔案 (`.github/codeql/codeql-config.yml`)：

```yaml
paths:
  - apps/
  - services/
paths-ignore:
  - node_modules/
  - '**/test/**'
```

在工作流程中引用它：

```yaml
- uses: github/codeql-action/init@v4
  with:
    config-file: .github/codeql/codeql-config.yml
```

### 步驟 7：手動建構步驟（編譯式語言）

如果 `autobuild` 失敗或需要自訂建構指令：

```yaml
- language: c-cpp
  build-mode: manual
```

然後在 `init` 與 `analyze` 之間新增明確的建構步驟：

```yaml
- if: matrix.build-mode == 'manual'
  name: Build
  run: |
    make bootstrap
    make release
```

## 核心工作流程 — CodeQL CLI

### 步驟 1：安裝 CodeQL CLI

下載 CodeQL 組合包 (bundle)（包含 CLI + 預編譯的查詢）：

```bash
# 從 https://github.com/github/codeql-action/releases 下載
# 解壓縮並新增至 PATH
export PATH="$HOME/codeql:$PATH"

# 驗證安裝
codeql resolve packs
codeql resolve languages
```

> 請務必使用 CodeQL 組合包，而非獨立的 CLI 下載。組合包可確保查詢相容性，並提供預編譯的查詢以獲得更好的效能。

### 步驟 2：建立 CodeQL 資料庫

```bash
# 單一語言
codeql database create codeql-db \
  --language=javascript-typescript \
  --source-root=src

# 多種語言（叢集模式）
codeql database create codeql-dbs \
  --db-cluster \
  --language=java,python \
  --command=./build.sh \
  --source-root=src
```

對於編譯式語言，透過 `--command` 提供建構指令。

### 步驟 3：分析資料庫

```bash
codeql database analyze codeql-db \
  javascript-code-scanning.qls \
  --format=sarif-latest \
  --sarif-category=javascript \
  --output=results.sarif
```

常用的查詢套件：`<language>-code-scanning.qls`、`<language>-security-extended.qls`、`<language>-security-and-quality.qls`。

### 步驟 4：將結果上傳至 GitHub

```bash
codeql github upload-results \
  --repository=owner/repo \
  --ref=refs/heads/main \
  --commit=<commit-sha> \
  --sarif=results.sarif
```

需要具有 `security-events: write` 權限的 `GITHUB_TOKEN` 環境變數。

### CLI 伺服器模式

若要在執行多個指令時避免重複的 JVM 初始化：

```bash
codeql execute cli-server
```

> 關於詳細的 CLI 指令參考，請搜尋 `references/cli-commands.md`。

## 警示管理

### 嚴重性層級

警示有兩個嚴重性維度：
- **標準嚴重性：** `Error` (錯誤)、`Warning` (警告)、`Note` (附註)
- **安全性嚴重性：** `Critical` (緊急)、`High` (高)、`Medium` (中)、`Low` (低)（衍生自 CVSS 分數；優先顯示）

### Copilot 自動修復 (Autofix)

GitHub Copilot Autofix 會自動為提取要求中的 CodeQL 警示產生修復建議 — 不需要 Copilot 訂閱。在提交之前請仔細審查建議。

### PR 中的警示分級 (Triage)

- 警示會以檢查註釋的形式出現在變更的行上
- 對於 `error`/`critical`/`high` 嚴重性的警示，檢查預設會失敗
- 組態合併保護規則集以自訂臨界值
- 對於誤判，請註明原因以供稽核追蹤

> 關於詳細的警示管理指南，請搜尋 `references/alert-management.md`。

## 自訂查詢與套件

### 使用自訂查詢套件

```yaml
- uses: github/codeql-action/init@v4
  with:
    packs: |
      my-org/my-security-queries@1.0.0
      codeql/javascript-queries:AlertSuppression.ql
```

### 建立自訂查詢套件

使用 CodeQL CLI 建立並發佈套件：

```bash
# 初始化新套件
codeql pack init my-org/my-queries

# 安裝相依性
codeql pack install

# 發佈至 GitHub Container Registry
codeql pack publish
```

### CodeQL 組態檔案

對於進階查詢和路徑組態，請建立 `.github/codeql/codeql-config.yml`：

```yaml
paths:
  - apps/
  - services/
paths-ignore:
  - '**/test/**'
  - node_modules/
queries:
  - uses: security-extended
packs:
  javascript-typescript:
    - my-org/my-custom-queries
```

## 程式碼掃描記錄

### 摘要指標

工作流程記錄包含關鍵指標：
- **程式碼庫中的程式碼行數** — 擷取前的基準
- **擷取的行數** — 包含外部函式庫與自動產生的檔案
- **擷取錯誤/警告** — 在擷取期間失敗或產生警告的檔案

### 偵錯記錄

若要啟用詳細診斷：
- **GitHub Actions：** 勾選 "Enable debug logging" 並重新執行工作流程
- **CodeQL CLI：** 使用 `--verbosity=progress++` 與 `--logdir=codeql-logs`

## 疑難排解

### 常見問題

| 問題 | 解決方案 |
|---|---|
| 工作流程未觸發 | 驗證 `on:` 觸發器是否與事件相符；檢查 `paths`/`branches` 篩選器；確保工作流程存在於目標分支上 |
| `Resource not accessible` 錯誤 | 新增 `security-events: write` 與 `contents: read` 權限 |
| 自動建構 (Autobuild) 失敗 | 切換至 `build-mode: manual` 並新增明確的建構指令 |
| 未看到原始程式碼 | 驗證 `--source-root`、建構指令與語言識別碼 |
| C# 編譯器失敗 | 檢查 `/p:EmitCompilerGeneratedFiles=true` 是否與 `.sqlproj` 或舊版專案發生衝突 |
| 掃描的行數少於預期 | 從 `none` 切換至 `autobuild`/`manual`；驗證建構是否編譯了所有原始碼 |
| Kotlin 處於無建構模式 | 停用並重新啟用預設設定以切換至 `autobuild` |
| 每次執行都快取未中 | 在 `init` 動作上驗證 `dependency-caching: true` |
| 磁碟/記憶體不足 | 使用較大的執行器；透過 `paths` 組態減少分析範圍；使用 `build-mode: none` |
| SARIF 上傳失敗 | 確保權杖具有 `security-events: write` 權限；檢查 10 MB 檔案大小限制 |
| SARIF 結果超出限制 | 使用不同的 `--sarif-category` 分割成多次上傳；減少查詢範圍 |
| 兩個 CodeQL 工作流程 | 如果使用進階設定，請停用預設設定，或移除舊的工作流程檔案 |
| 分析緩慢 | 啟用相依性快取；使用 `--threads=0`；減少查詢套件範圍 |

> 關於包含詳細解決方案的完整疑難排解，請搜尋 `references/troubleshooting.md`。

### 硬體需求（自我裝載執行器）

| 程式碼庫大小 | 記憶體 (RAM) | CPU |
|---|---|---|
| 小型 (<100K LOC) | 8 GB+ | 2 核心 |
| 中型 (100K–1M LOC) | 16 GB+ | 4–8 核心 |
| 大型 (>1M LOC) | 64 GB+ | 8 核心 |

所有大小：建議使用 SSD 且具有 ≥14 GB 可用磁碟空間。

### Action 版本控制

將 CodeQL actions 釘選至特定的主版本：

```yaml
uses: github/codeql-action/init@v4      # 建議做法
uses: github/codeql-action/autobuild@v4
uses: github/codeql-action/analyze@v4
```

為了獲得最高安全性，請釘選至完整的提交 SHA 而非版本標籤。

## 參考文件

根據需要載入以下參考文件以取得詳細文件：

- `references/workflow-configuration.md` — 完整的工作流程觸發器、執行器與組態選項
  - 搜尋模式：`trigger`, `schedule`, `paths-ignore`, `db-location`, `model packs`, `alert severity`, `merge protection`, `concurrency`, `config file`
- `references/cli-commands.md` — 完整的 CodeQL CLI 指令參考
  - 搜尋模式：`database create`, `database analyze`, `upload-results`, `resolve packs`, `cli-server`, `installation`, `CI integration`
- `references/sarif-output.md` — SARIF v2.1.0 物件模型、上傳限制與第三方支援
  - 搜尋模式：`sarifLog`, `result`, `location`, `region`, `codeFlow`, `fingerprint`, `suppression`, `upload limits`, `third-party`, `precision`, `security-severity`
- `references/compiled-languages.md` — 各語言的建構模式與自動建構行為
  - 搜尋模式：`C/C++`, `C#`, `Java`, `Go`, `Rust`, `Swift`, `autobuild`, `build-mode`, `hardware`, `dependency caching`
- `references/troubleshooting.md` — 完整的錯誤診斷與解決方案
  - 搜尋模式：`no source code`, `out of disk`, `out of memory`, `403`, `C# compiler`, `analysis too long`, `fewer lines`, `Kotlin`, `extraction errors`, `debug logging`, `SARIF upload`, `SARIF limits`
- `references/alert-management.md` — 警示嚴重性、分級、Copilot Autofix 與關閉
  - 搜尋模式：`severity`, `security severity`, `CVSS`, `Copilot Autofix`, `dismiss`, `triage`, `PR alerts`, `data flow`, `merge protection`, `REST API`
