# CodeQL 工作流程組態參考

關於透過 GitHub Actions 工作流程設定 CodeQL 分析的詳細參考。這補充了 SKILL.md 中的程序性指南。

## 觸發器組態 (Trigger Configuration)

### 推送觸發器 (Push Trigger)

在每次推送到指定分支時進行掃描：

```yaml
on:
  push:
    branches: [main, protected]
```

- 每次推送到列出的分支都會觸發程式碼掃描
- 工作流程必須存在於目標分支上才能啟動掃描
- 結果會顯示在儲存庫的 Security 索引標籤中
- 當推送結果對應到開啟的 PR 時，警示也會以 PR 註釋的形式出現

### 提取要求觸發器 (Pull Request Trigger)

掃描提取要求的合併提交 (merge commits)：

```yaml
on:
  pull_request:
    branches: [main]
```

- 掃描 PR 的合併提交（而非 head 提交）以獲得更準確的結果
- 對於私有分叉 (private fork) 的 PR，請在儲存庫設定中啟用 "Run workflows from fork pull requests"
- 結果會顯示為 PR 檢查註釋

### 排程觸發器 (Schedule Trigger)

在預設分支上進行定期掃描：

```yaml
on:
  schedule:
    - cron: '20 14 * * 1'  # 星期一 14:20 UTC
```

- 僅當工作流程檔案存在於預設分支上時才會觸發
- 即使沒有活躍的開發，也能捕捉到新發現的弱點

### 合併群組觸發器 (Merge Group Trigger)

使用合併佇列 (merge queues) 時需要：

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  merge_group:
```

### 路徑篩選 (Path Filtering)

根據變更的檔案控制工作流程執行的時機：

```yaml
on:
  pull_request:
    paths-ignore:
      - '**/*.md'
      - '**/*.txt'
      - 'docs/**'
```

或者使用 `paths` 僅針對特定目錄觸發：

```yaml
on:
  pull_request:
    paths:
      - 'src/**'
      - 'apps/**'
```

> **重要：** `paths-ignore` 和 `paths` 控制工作流程是否執行。當工作流程執行時，它會分析 PR 中所有變更的檔案（包括與 `paths-ignore` 匹配的檔案），除非透過 CodeQL 組態檔案的 `paths-ignore` 排除檔案。

### 工作流程分派（手動觸發器）

```yaml
on:
  workflow_dispatch:
    inputs:
      language:
        description: 'Language to analyze'
        required: true
        default: 'javascript-typescript'
```

## 執行器與作業系統組態

### GitHub 裝載的執行器 (GitHub-Hosted Runners)

```yaml
jobs:
  analyze:
    runs-on: ubuntu-latest    # 亦可使用：windows-latest, macos-latest
```

- `ubuntu-latest` — 最常用，建議用於大多數語言
- `macos-latest` — Swift 分析所需
- `windows-latest` — 某些使用 MSBuild 的 C/C++ 和 C# 專案所需

### 自我裝載執行器 (Self-Hosted Runners)

```yaml
jobs:
  analyze:
    runs-on: [self-hosted, ubuntu-latest]
```

自我裝載執行器的需求：
- Git 必須在 PATH 中
- 建議使用 SSD 且具有 ≥14 GB 磁碟空間
- 請參閱 SKILL.md 中的硬體需求表

### 超時組態

防止工作流程掛起：

```yaml
jobs:
  analyze:
    timeout-minutes: 120
```

## 語言與建構模式 Matrix

### 標準 Matrix 模式

```yaml
strategy:
  fail-fast: false
  matrix:
    include:
      - language: javascript-typescript
        build-mode: none
      - language: python
        build-mode: none
      - language: java-kotlin
        build-mode: none
      - language: c-cpp
        build-mode: autobuild
```

### 具有混合建構模式的多語言儲存庫

```yaml
strategy:
  fail-fast: false
  matrix:
    include:
      - language: c-cpp
        build-mode: manual
      - language: csharp
        build-mode: autobuild
      - language: java-kotlin
        build-mode: none
```

### 建構模式摘要

| 語言 | `none` | `autobuild` | `manual` | 預設設定模式 |
|---|:---:|:---:|:---:|---|
| C/C++ | ✅ | ✅ | ✅ | `none` |
| C# | ✅ | ✅ | ✅ | `none` |
| Go | ❌ | ✅ | ✅ | `autobuild` |
| Java | ✅ | ✅ | ✅ | `none` |
| Kotlin | ❌ | ✅ | ✅ | `autobuild` |
| Python | ✅ | ❌ | ❌ | `none` |
| Ruby | ✅ | ❌ | ❌ | `none` |
| Rust | ✅ | ✅ | ✅ | `none` |
| Swift | ❌ | ✅ | ✅ | `autobuild` |
| JavaScript/TypeScript | ✅ | ❌ | ❌ | `none` |
| GitHub Actions | ✅ | ❌ | ❌ | `none` |

## CodeQL 資料庫位置 (CodeQL Database Location)

覆寫預設的資料庫位置：

```yaml
- uses: github/codeql-action/init@v4
  with:
    db-location: '${{ github.runner_temp }}/my_location'
```

- 預設值：`${{ github.runner_temp }}/codeql_databases`
- 路徑必須是可寫入的，且必須不存在或者是個空目錄
- 在自我裝載執行器上，請確保各次執行之間的清理工作

## 查詢套件與套件 (Query Suites and Packs)

### 內建查詢套件 (Built-In Query Suites)

```yaml
- uses: github/codeql-action/init@v4
  with:
    queries: security-extended
```

選項：
- (預設) — 標準安全性查詢
- `security-extended` — 額外的安全性查詢，誤判率稍微較高
- `security-and-quality` — 安全性加上程式碼品質查詢

### 自訂查詢套件 (Custom Query Packs)

```yaml
- uses: github/codeql-action/init@v4
  with:
    packs: |
      codeql/javascript-queries:AlertSuppression.ql
      codeql/javascript-queries:~1.0.0
      my-org/my-custom-pack@1.2.3
```

### 模型套件 (Model Packs)

擴展 CodeQL 對自訂函式庫/框架的涵蓋範圍：

```yaml
- uses: github/codeql-action/init@v4
  with:
    packs: my-org/my-model-pack
```

## 分析類別 (Analysis Category)

區分同一個提交的多個分析：

```yaml
- uses: github/codeql-action/analyze@v4
  with:
    category: "/language:${{ matrix.language }}"
```

### Monorepo 類別模式

```yaml
# 依語言（預設自動生成的模式）
category: "/language:${{ matrix.language }}"

# 依元件
category: "/language:${{ matrix.language }}/component:frontend"

# 依 monorepo 中的應用程式
category: "/language:javascript-typescript/app:blog"
```

`category` 的值會出現在 SARIF 輸出中的 `<run>.automationDetails.id`。

## CodeQL 組態檔案 (CodeQL Configuration File)

建立 `.github/codeql/codeql-config.yml` 以進行進階的路徑和查詢設定：

```yaml
name: "CodeQL Configuration"

# 要掃描的目錄
paths:
  - apps/
  - services/
  - packages/

# 要排除的目錄
paths-ignore:
  - node_modules/
  - '**/test/**'
  - '**/fixtures/**'
  - '**/*.test.ts'

# 額外查詢
queries:
  - uses: security-extended
  - uses: security-and-quality

# 自訂查詢套件
packs:
  javascript-typescript:
    - codeql/javascript-queries
  python:
    - codeql/python-queries
```

在工作流程中引用：

```yaml
- uses: github/codeql-action/init@v4
  with:
    config-file: .github/codeql/codeql-config.yml
```

## 相依性快取 (Dependency Caching)

啟用快取以加速相依性解析：

```yaml
- uses: github/codeql-action/init@v4
  with:
    dependency-caching: true
```

值：
- `false` / `none` / `off` — 停用（進階設定的預設值）
- `restore` — 僅還原現有快取
- `store` — 僅儲存新快取
- `true` / `full` / `on` — 還原並儲存快取

> GitHub 裝載的執行器上的預設設定會自動啟用快取。

## 警示嚴重性與合併保護 (Alert Severity and Merge Protection)

使用儲存庫規則集，根據程式碼掃描警示來封鎖 PR：

- 必要的工具發現了符合定義的嚴重性臨界值的警示
- 必要工具的分析仍在進行中
- 儲存庫未設定必要工具

透過「儲存庫設定 (Settings)」→「規則 (Rules)」→「規則集 (Rulesets)」→「程式碼掃描 (Code scanning)」進行設定。

## 並行控制 (Concurrency Control)

防止重複的工作流程執行：

```yaml
concurrency:
  group: codeql-${{ github.ref }}
  cancel-in-progress: true
```

## 完整工作流程範例 (Complete Workflow Example)

```yaml
name: "CodeQL Analysis"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '30 6 * * 1'

permissions:
  security-events: write
  contents: read
  actions: read

concurrency:
  group: codeql-${{ github.ref }}
  cancel-in-progress: true

jobs:
  analyze:
    name: Analyze (${{ matrix.language }})
    runs-on: ${{ matrix.language == 'swift' && 'macos-latest' || 'ubuntu-latest' }}
    timeout-minutes: 120
    strategy:
      fail-fast: false
      matrix:
        include:
          - language: javascript-typescript
            build-mode: none
          - language: python
            build-mode: none

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

      - if: matrix.build-mode == 'manual'
        name: Manual Build
        run: |
          echo 'Replace with actual build commands'
          exit 1

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v4
        with:
          category: "/language:${{ matrix.language }}"
```
