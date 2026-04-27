# Dependabot YAML 選項參考 (Dependabot YAML Options Reference)

`.github/dependabot.yml` 中所有設定選項的完整參考。

## 檔案結構

```yaml
version: 2                    # 必要，始終為 2

registries:                   # 選用：私有登錄檔存取
  REGISTRY_NAME:
    type: "..."
    url: "..."

multi-ecosystem-groups:       # 選用：跨生態系統分組
  GROUP_NAME:
    schedule:
      interval: "..."

updates:                      # 必要：生態系統設定列表
  - package-ecosystem: "..."  # 必要
    directory: "/"            # 必要（或使用 directories）
    schedule:                 # 必要
      interval: "..."
```

## 必要鍵值

### `version`

始終為 `2`。必須位於最頂層。

### `package-ecosystem`

定義要監控的套件管理員。每個生態系統一個項目（同一個生態系統可以有多個項目，但目錄不同）。

| 套件管理員 | YAML 值 | Manifest 檔案 |
|---|---|---|
| Bazel | `bazel` | `MODULE.bazel`, `WORKSPACE` |
| Bun | `bun` | `bun.lockb` |
| Bundler (Ruby) | `bundler` | `Gemfile`, `Gemfile.lock` |
| Cargo (Rust) | `cargo` | `Cargo.toml`, `Cargo.lock` |
| Composer (PHP) | `composer` | `composer.json`, `composer.lock` |
| Conda | `conda` | `environment.yml` |
| Dev Containers | `devcontainers` | `devcontainer.json` |
| Docker | `docker` | `Dockerfile` |
| Docker Compose | `docker-compose` | `docker-compose.yml` |
| .NET SDK | `dotnet-sdk` | `global.json` |
| Elm | `elm` | `elm.json` |
| Git 子模組 | `gitsubmodule` | `.gitmodules` |
| GitHub Actions | `github-actions` | `.github/workflows/*.yml` |
| Go Modules | `gomod` | `go.mod`, `go.sum` |
| Gradle | `gradle` | `build.gradle`, `build.gradle.kts` |
| Helm | `helm` | `Chart.yaml` |
| Hex (Elixir) | `mix` | `mix.exs`, `mix.lock` |
| Julia | `julia` | `Project.toml`, `Manifest.toml` |
| Maven | `maven` | `pom.xml` |
| npm/pnpm/yarn | `npm` | `package.json`, lock 檔案 |
| NuGet | `nuget` | `*.csproj`, `packages.config` |
| OpenTofu | `opentofu` | `*.tf` |
| pip/pipenv/poetry/uv | `pip` | `requirements.txt`, `Pipfile`, `pyproject.toml` |
| Pre-commit | `pre-commit` | `.pre-commit-config.yaml` |
| Pub (Dart/Flutter) | `pub` | `pubspec.yaml` |
| Rust Toolchain | `rust-toolchain` | `rust-toolchain.toml` |
| Swift | `swift` | `Package.swift` |
| Terraform | `terraform` | `*.tf` |
| uv | `uv` | `uv.lock`, `pyproject.toml` |
| vcpkg | `vcpkg` | `vcpkg.json` |

### `directory` / `directories`

套件 manifest 相對於儲存庫根目錄的位置。

- `directory` — 單一路徑（不支援萬用字元）
- `directories` — 路徑列表（支援 `*` 和 `**` 萬用字元）

```yaml
# 單一目錄
directory: "/"

# 多個目錄且包含萬用字元
directories:
  - "/"
  - "/apps/*"
  - "/packages/*"
```

對於 GitHub Actions，請使用 `/` — Dependabot 會自動搜尋 `.github/workflows/`。

### `schedule`

檢查更新的頻率。

| 參數 | 值 | 備註 |
|---|---|---|
| `interval` | `daily`, `weekly`, `monthly`, `quarterly`, `semiannually`, `yearly`, `cron` | 必要 |
| `day` | `monday`–`sunday` | 僅限每週一次時 |
| `time` | `HH:MM` | 預設為 UTC |
| `timezone` | IANA 時區字串 | 例如 `America/New_York` |
| `cronjob` | Cron 運算式 | 當間隔為 `cron` 時必要 |

```yaml
schedule:
  interval: "weekly"
  day: "tuesday"
  time: "09:00"
  timezone: "Europe/London"
```

## 分組選項

### `groups`

將多個更新整合到較少的 PR 中。

| 參數 | 目的 | 值 |
|---|---|---|
| `IDENTIFIER` | 分組名稱（用於分支/PR 標題） | 字母、管道符號、底線、連字號 |
| `applies-to` | 更新類型 | `version-updates` (預設值), `security-updates` |
| `dependency-type` | 依類型篩選 | `development`, `production` |
| `patterns` | 包含相符的名稱 | 包含 `*` 萬用字元的字串列表 |
| `exclude-patterns` | 排除相符的名稱 | 包含 `*` 萬用字元的字串列表 |
| `update-types` | SemVer 篩選 | `major`, `minor`, `patch` |
| `group-by` | 跨目錄分組 | `dependency-name` |

```yaml
groups:
  dev-deps:
    dependency-type: "development"
    update-types: ["minor", "patch"]
  angular:
    patterns: ["@angular*"]
    exclude-patterns: ["@angular/cdk"]
  monorepo:
    group-by: dependency-name
```

### `multi-ecosystem-groups` (頂層)

將跨不同生態系統的更新整合到一個 PR 中。

```yaml
multi-ecosystem-groups:
  GROUP_NAME:
    schedule:
      interval: "weekly"
    labels: ["infrastructure"]
    assignees: ["@platform-team"]
```

在每個 `updates` 項目中以 `multi-ecosystem-group: "GROUP_NAME"` 指定生態系統。使用此功能時，每個生態系統項目中都必須包含 `patterns` 鍵值。

## 篩選選項

### `allow`

明確定義要維護的依賴項目。

| 參數 | 目的 |
|---|---|
| `dependency-name` | 依名稱比對（支援 `*` 萬用字元） |
| `dependency-type` | `direct`, `indirect`, `all`, `production`, `development` |

```yaml
allow:
  - dependency-type: "production"
  - dependency-name: "express"
```

### `ignore`

從更新中排除特定的依賴項目或版本。

| 參數 | 目的 |
|---|---|
| `dependency-name` | 依名稱比對（支援 `*` 萬用字元） |
| `versions` | 特定版本或範圍（例如 `["5.x"]`, `[">=2.0.0"]`） |
| `update-types` | SemVer 層級：`version-update:semver-major`, `version-update:semver-minor`, `version-update:semver-patch` |

```yaml
ignore:
  - dependency-name: "lodash"
  - dependency-name: "@types/node"
    update-types: ["version-update:semver-patch"]
  - dependency-name: "express"
    versions: ["5.x"]
```

規則：如果一個依賴項目同時符合 `allow` 和 `ignore`，它將會被 **忽略 (ignored)**。

### `exclude-paths`

在掃描 manifest 時忽略特定的目錄或檔案。

```yaml
exclude-paths:
  - "vendor/**"
  - "test/fixtures/**"
  - "*.lock"
```

支援萬用字元模式：`*`（單一層級）、`**`（遞迴）、特定檔案路徑。

## PR 自訂選項

### `labels`

```yaml
labels:
  - "dependencies"
  - "npm"
```

設定 `labels: []` 可停用所有標籤。如果儲存庫中存在 SemVer 標籤（`major`, `minor`, `patch`），它們一律會被套用。

### `assignees`

```yaml
assignees:
  - "user1"
  - "user2"
```

代理人必須具備寫入權限（若是組織儲存庫，則需具備讀取權限）。

### `milestone`

```yaml
milestone: 4  # 來自里程碑 URL 的數字 ID
```

### `commit-message`

```yaml
commit-message:
  prefix: "deps"              # 最多 50 個字元；若以字母/數字結尾，會自動加上冒號
  prefix-development: "deps-dev"  # 開發依賴項目的獨立前綴
  include: "scope"            # 在前綴後加上 deps/deps-dev 範圍
```

### `pull-request-branch-name`

```yaml
pull-request-branch-name:
  separator: "-"  # 選項："-", "_", "/"
```

### `target-branch`

```yaml
target-branch: "develop"
```

設定後，版本更新設定僅適用於版本更新。安全性更新一律以預設分支為目標。

## 排程與速率限制

### `cooldown`

延遲新發佈版本的更新：

| 參數 | 目的 |
|---|---|
| `default-days` | 預設冷卻期 (1–90 天) |
| `semver-major-days` | 主要更新 (major) 的冷卻期 |
| `semver-minor-days` | 次要更新 (minor) 的冷卻期 |
| `semver-patch-days` | 修補更新 (patch) 的冷卻期 |
| `include` | 套用冷卻期的依賴項目（最多 150 個，支援 `*`） |
| `exclude` | 豁免冷卻期的依賴項目（最多 150 個，優先級較高） |

```yaml
cooldown:
  default-days: 5
  semver-major-days: 30
  semver-minor-days: 7
  semver-patch-days: 3
  include: ["*"]
  exclude: ["critical-security-lib"]
```

### `open-pull-requests-limit`

```yaml
open-pull-requests-limit: 10  # 預設值：版本更新為 5
```

設定為 `0` 可完全停用版本更新。安全性更新有獨立的內部限制 10。

## 進階選項

### `versioning-strategy`

支援：`bundler`, `cargo`, `composer`, `mix`, `npm`, `pip`, `pub`, `uv`。

| 值 | 行為 |
|---|---|
| `auto` | 預設：應用程式調升版本，函式庫擴大範圍 |
| `increase` | 一律調升最低版本 |
| `increase-if-necessary` | 僅在目前範圍排除新版本時變更 |
| `lockfile-only` | 僅更新 lock 檔案 |
| `widen` | 擴大範圍以包含舊版本與新版本 |

### `rebase-strategy`

```yaml
rebase-strategy: "disabled"
```

預設行為：Dependabot 在發生衝突時自動對 PR 進行 rebase。PR 開啟 30 天後停止 rebase。

在提交訊息中包含 `[dependabot skip]`，可允許 Dependabot 在額外提交上進行強制推送 (force push)。

### `vendor`

支援：`bundler`, `gomod`。

```yaml
vendor: true  # 維護 vendored 依賴項目
```

Go modules 會自動偵測 vendored 依賴項目。

### `insecure-external-code-execution`

支援：`bundler`, `mix`, `pip`。

```yaml
insecure-external-code-execution: "allow"
```

允許 Dependabot 在更新期間執行 manifest 中的程式碼。某些在解析期間需要執行程式碼的生態系統需要此設定。

## 私有登錄檔

### 頂層登錄檔定義

```yaml
registries:
  npm-private:
    type: npm-registry
    url: https://npm.example.com
    token: ${{secrets.NPM_TOKEN}}

  maven-central:
    type: maven-repository
    url: https://repo.maven.apache.org/maven2
    username: ""
    password: ""

  docker-ghcr:
    type: docker-registry
    url: https://ghcr.io
    username: ${{secrets.GHCR_USER}}
    password: ${{secrets.GHCR_TOKEN}}

  python-private:
    type: python-index
    url: https://pypi.example.com/simple
    token: ${{secrets.PYPI_TOKEN}}
```

### 將登錄檔與生態系統關聯

```yaml
updates:
  - package-ecosystem: "npm"
    directory: "/"
    registries:
      - npm-private
    schedule:
      interval: "weekly"
```

使用 `registries: "*"` 可允許存取所有定義的登錄檔。
