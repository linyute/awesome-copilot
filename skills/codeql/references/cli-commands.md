# CodeQL CLI 指令參考

CodeQL CLI 的詳細參考 — 安裝、資料庫建立、分析、SARIF 上傳和 CI 整合。

## 安裝

### 下載 CodeQL 組合包

始終從以下位置下載 CodeQL 組合包 (CLI + 預編譯查詢)：
**https://github.com/github/codeql-action/releases**

組合包包含：
- CodeQL CLI 產品
- 來自 `github/codeql` 的相容查詢和函式庫
- 用於更快速分析的預編譯查詢計劃

### 平台特定組合包

| 平台 | 檔案 |
|---|---|
| 所有平台 | `codeql-bundle.tar.zst` |
| Linux | `codeql-bundle-linux64.tar.zst` |
| macOS | `codeql-bundle-osx64.tar.zst` |
| Windows | `codeql-bundle-win64.tar.zst` |

> 對於不支援 Zstandard 的系統，也提供 `.tar.gz` 變體。

### 設定

```bash
# 解壓縮組合包
tar xf codeql-bundle-linux64.tar.zst

# 新增至 PATH
export PATH="$HOME/codeql:$PATH"

# 驗證安裝
codeql resolve packs
codeql resolve languages
```

`codeql resolve packs` 應列出所有受支援語言的可用查詢套件。如果缺少套件，請驗證您下載的是組合包 (而非獨立 CLI)。

### CI 系統設定

確保每台 CI 伺服器上都有完整的 CodeQL 組合包內容：
- 從中心位置複製並在每台伺服器上解壓縮，或者
- 使用 GitHub REST API 在每次執行時動態下載組合包

## 核心指令

### `codeql database create`

從原始碼建立 CodeQL 資料庫。

```bash
# 基本用法 (直譯語言)
codeql database create <output-dir> \
  --language=<language> \
  --source-root=<source-dir>

# 具有建構指令的編譯語言
codeql database create <output-dir> \
  --language=java-kotlin \
  --command='./gradlew build' \
  --source-root=.

# 多種語言 (叢集模式)
codeql database create <output-dir> \
  --db-cluster \
  --language=java,python,javascript-typescript \
  --command='./build.sh' \
  --source-root=.
```

**關鍵旗標：**

| 旗標 | 描述 |
|---|---|
| `--language=<lang>` | 要擷取的語言 (必要)。使用 CodeQL 語言識別碼。 |
| `--source-root=<dir>` | 原始碼的根目錄 (預設值：目前目錄) |
| `--command=<cmd>` | 編譯語言的建構指令 |
| `--db-cluster` | 在一次執行中建立多種語言的資料庫 |
| `--overwrite` | 覆寫現有的資料庫目錄 |
| `--threads=<n>` | 擷取使用的執行緒數 (預設值：1；使用 0 以使用所有可用核心) |
| `--ram=<mb>` | 擷取時的記憶體限制 (以 MB 為單位) |

### `codeql database analyze`

對 CodeQL 資料庫執行查詢並產生 SARIF 輸出。

```bash
codeql database analyze <database-dir> \
  <query-suite-or-pack> \
  --format=sarif-latest \
  --sarif-category=<category> \
  --output=<output-file>
```

**關鍵旗標：**

| 旗標 | 描述 |
|---|---|
| `--format=sarif-latest` | 輸出格式 (針對目前的 SARIF v2.1.0 使用 `sarif-latest`) |
| `--sarif-category=<cat>` | SARIF 結果的類別標記 (對於多語言儲存庫很重要) |
| `--output=<file>` | SARIF 結果的輸出檔案路徑 |
| `--threads=<n>` | 分析使用的執行緒數 |
| `--ram=<mb>` | 記憶體限制 (以 MB 為單位) |
| `--sarif-add-file-contents` | 在 SARIF 輸出中包含原始程式檔內容 |
| `--ungroup-results` | 停用結果群組化 (分別報告每個出現的情況) |
| `--no-download` | 跳過下載查詢套件 (僅使用本地可用的套件) |

**常見查詢套件：**

| 套件 | 描述 |
|---|---|
| `<lang>-code-scanning.qls` | 標準程式碼掃描查詢 |
| `<lang>-security-extended.qls` | 延伸安全性查詢 |
| `<lang>-security-and-quality.qls` | 安全性 + 程式碼品質查詢 |

**範例：**

```bash
# 使用延伸安全性進行 JavaScript 分析
codeql database analyze codeql-db/javascript-typescript \
  javascript-typescript-security-extended.qls \
  --format=sarif-latest \
  --sarif-category=javascript \
  --output=js-results.sarif

# 使用所有可用執行緒進行 Java 分析
codeql database analyze codeql-db/java-kotlin \
  java-kotlin-code-scanning.qls \
  --format=sarif-latest \
  --sarif-category=java \
  --output=java-results.sarif \
  --threads=0

# 在 SARIF 中包含檔案內容
codeql database analyze codeql-db \
  javascript-typescript-code-scanning.qls \
  --format=sarif-latest \
  --output=results.sarif \
  --sarif-add-file-contents
```

### `codeql github upload-results`

將 SARIF 結果上傳至 GitHub 程式碼掃描。

```bash
codeql github upload-results \
  --repository=<owner/repo> \
  --ref=<git-ref> \
  --commit=<commit-sha> \
  --sarif=<sarif-file>
```

**關鍵旗標：**

| 旗標 | 描述 |
|---|---|
| `--repository=<owner/repo>` | 目標 GitHub 儲存庫 |
| `--ref=<ref>` | Git 參照 (例如：`refs/heads/main`、`refs/pull/42/head`) |
| `--commit=<sha>` | 完整的認可 SHA |
| `--sarif=<file>` | SARIF 檔案的路徑 |
| `--github-url=<url>` | GitHub 執行個體 URL (針對 GHES；預設值為 github.com) |
| `--github-auth-stdin` | 從標準輸入 (stdin) 讀取驗證權杖，而非從 `GITHUB_TOKEN` 環境變數讀取 |

**驗證：** 設定 `GITHUB_TOKEN` 環境變數，其權杖具有 `security-events: write` 範圍，或使用 `--github-auth-stdin`。

### `codeql resolve packs`

列出可用的查詢套件：

```bash
codeql resolve packs
```

用於驗證安裝並診斷缺失的套件。自 CLI v2.19.0 起可用 (早期版本：使用 `codeql resolve qlpacks`)。

### `codeql resolve languages`

列出支援的語言：

```bash
codeql resolve languages
```

顯示目前安裝中可用的語言擷取器。

### `codeql database bundle`

建立 CodeQL 資料庫的可遷移封存，用於共享或疑難排解：

```bash
codeql database bundle <database-dir> \
  --output=<archive-file>
```

對於與小組成員或 GitHub 支援人員共享資料庫非常有用。

## CLI 伺服器模式

### `codeql execute cli-server`

執行一個持續性的伺服器，以避免在執行多個指令時重複進行 JVM 初始化：

```bash
codeql execute cli-server [options]
```

**關鍵旗標：**

| 旗標 | 描述 |
|---|---|
| `-v, --verbose` | 增加進度訊息 |
| `-q, --quiet` | 減少進度訊息 |
| `--verbosity=<level>` | 設定詳細程度：`errors`、`warnings`、`progress`、`progress+`、`progress++`、`progress+++` |
| `--logdir=<dir>` | 將詳細記錄寫入目錄 |
| `--common-caches=<dir>` | 持續性快取資料的位置 (預設值：`~/.codeql`) |
| `-J=<opt>` | 將選項傳遞給 JVM |

該伺服器透過標準輸入 (stdin) 接受指令並傳回結果，在指令之間保持 JVM 溫暖。主要在執行多個循序 CodeQL 指令的 CI 環境中有用。

## CI 整合模式

### 完整 CI 指令碼範例

```bash
#!/bin/bash
set -euo pipefail

REPO="my-org/my-repo"
REF="refs/heads/main"
COMMIT=$(git rev-parse HEAD)
LANGUAGES=("javascript-typescript" "python")

# 為所有語言建立資料庫
codeql database create codeql-dbs \
  --db-cluster \
  --source-root=. \
  --language=$(IFS=,; echo "${LANGUAGES[*]}")

# 分析每種語言並上傳結果
for lang in "${LANGUAGES[@]}"; do
  echo "Analyzing $lang..."

  codeql database analyze "codeql-dbs/$lang" \
    "${lang}-security-extended.qls" \
    --format=sarif-latest \
    --sarif-category="$lang" \
    --output="${lang}-results.sarif" \
    --threads=0

  codeql github upload-results \
    --repository="$REPO" \
    --ref="$REF" \
    --commit="$COMMIT" \
    --sarif="${lang}-results.sarif"

  echo "$lang analysis uploaded."
done
```

### 外部 CI 系統

對於 GitHub Actions 以外的 CI 系統：
1. 在 CI 執行器上安裝 CodeQL 組合包
2. 使用適當的建構指令執行 `codeql database create`
3. 執行 `codeql database analyze` 以產生 SARIF
4. 執行 `codeql github upload-results` 將結果推送至 GitHub
5. 設定具有 `security-events: write` 權限的 `GITHUB_TOKEN`

## 環境變數

| 變數 | 用途 |
|---|---|
| `GITHUB_TOKEN` | 用於 `github upload-results` 的驗證 |
| `CODEQL_EXTRACTOR_<LANG>_OPTION_<KEY>` | 擷取器組態 (例如：`CODEQL_EXTRACTOR_GO_OPTION_EXTRACT_TESTS=true`) |
| `CODEQL_EXTRACTOR_CPP_AUTOINSTALL_DEPENDENCIES` | 在 Ubuntu 上自動安裝 C/C++ 建構相依性 |
| `CODEQL_RAM` | 覆寫分析的預設記憶體分配 |
| `CODEQL_THREADS` | 覆寫預設執行緒數 |
