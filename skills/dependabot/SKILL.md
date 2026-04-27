---
name: dependabot
description: >-
  設定與管理 GitHub Dependabot 的完整指南。當使用者詢問關於建立或優化 dependabot.yml 檔案、管理 Dependabot 提取要求 (PR)、
  設定依賴項目更新策略、設定分組更新、Monorepo 模式、跨生態系統群組、
  安全性更新設定、自動分群規則，
  或任何與 Dependabot 相關的
  GitHub 進階安全性 (GHAS) 供應鏈安全主題時，請使用此技能。
---

# Dependabot 設定與管理 (Dependabot Configuration & Management)

## 總覽 (Overview)

Dependabot 是 GitHub 內建的依賴項目管理工具，具有三大核心功能：

1. **Dependabot 警示 (Dependabot Alerts)** — 當依賴項目有已知的安全弱點 (CVE) 時發出通知
2. **Dependabot 安全性更新 (Dependabot Security Updates)** — 自動建立 PR 以修復有弱點的依賴項目
3. **Dependabot 版本更新 (Dependabot Version Updates)** — 自動建立 PR 以保持依賴項目為最新版本

所有設定都儲存在預設分支中的 **單一檔案**：`.github/dependabot.yml`。GitHub **不支援** 每個儲存庫有多個 `dependabot.yml` 檔案。

## 設定流程 (Configuration Workflow)

建立或優化 `dependabot.yml` 時，請遵循以下程序：

### 步驟 1：偵測所有生態系統

掃描儲存庫中的依賴項目 manifest 檔案。尋找：

| 生態系統 | YAML 值 | Manifest 檔案 |
|---|---|---|
| npm/pnpm/yarn | `npm` | `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` |
| pip/pipenv/poetry/uv | `pip` | `requirements.txt`, `Pipfile`, `pyproject.toml`, `setup.py` |
| Docker | `docker` | `Dockerfile` |
| Docker Compose | `docker-compose` | `docker-compose.yml` |
| GitHub Actions | `github-actions` | `.github/workflows/*.yml` |
| Go modules | `gomod` | `go.mod` |
| Bundler (Ruby) | `bundler` | `Gemfile` |
| Cargo (Rust) | `cargo` | `Cargo.toml` |
| Composer (PHP) | `composer` | `composer.json` |
| NuGet (.NET) | `nuget` | `*.csproj`, `packages.config` |
| .NET SDK | `dotnet-sdk` | `global.json` |
| Maven (Java) | `maven` | `pom.xml` |
| Gradle (Java) | `gradle` | `build.gradle` |
| Terraform | `terraform` | `*.tf` |
| OpenTofu | `opentofu` | `*.tf` |
| Helm | `helm` | `Chart.yaml` |
| Hex (Elixir) | `mix` | `mix.exs` |
| Swift | `swift` | `Package.swift` |
| Pub (Dart) | `pub` | `pubspec.yaml` |
| Bun | `bun` | `bun.lockb` |
| Dev Containers | `devcontainers` | `devcontainer.json` |
| Git 子模組 | `gitsubmodule` | `.gitmodules` |
| Pre-commit | `pre-commit` | `.pre-commit-config.yaml` |

注意：pnpm 和 yarn 都使用 `npm` 作為生態系統值。

### 步驟 2：對應目錄位置

針對每個生態系統，識別 manifest 所在位置。對於 Monorepo，請使用 `directories`（複數）搭配萬用字元模式：

```yaml
directories:
  - "/"           # 根目錄
  - "/apps/*"     # 所有 app 子目錄
  - "/packages/*" # 所有套件子目錄
  - "/lib-*"      # 以 lib- 開頭的目錄
  - "**/*"        # 遞迴（所有子目錄）
```

重要提示：`directory`（單數）不支援萬用字元。請使用 `directories`（複數）來套用萬用字元。

### 步驟 3：設定每個生態系統項目

每個項目最少需要：

```yaml
- package-ecosystem: "npm"
  directory: "/"
  schedule:
    interval: "weekly"
```

### 步驟 4：透過分組、標籤與排程進行優化

請參閱下方各節以了解各項優化技術。

## Monorepo 策略

### 適用於工作空間涵蓋範圍的萬用字元模式

對於包含許多套件的 Monorepo，請使用萬用字元模式，以避免列出每個目錄：

```yaml
- package-ecosystem: "npm"
  directories:
    - "/"
    - "/apps/*"
    - "/packages/*"
    - "/services/*"
  schedule:
    interval: "weekly"
```

### 跨目錄分組

當同一個依賴項目在多個目錄中更新時，使用 `group-by: dependency-name` 來建立單一 PR：

```yaml
groups:
  monorepo-deps:
    group-by: dependency-name
```

這會針對所有指定目錄中的每個依賴項目建立一個 PR，從而降低 CI 成本和審閱負擔。

限制：
- 所有目錄必須使用相同的套件生態系統
- 僅適用於版本更新
- 不相容的版本限制會產生獨立的 PR

### 工作空間以外的獨立套件

如果某個目錄有自己的 lock 檔案且不屬於工作空間（例如 `.github/` 中的指令碼），請為其建立獨立的生態系統項目。

## 依賴項目分組

透過將相關的依賴項目整合到單一 PR 中，減少 PR 的干擾。

### 依依賴項目類型

```yaml
groups:
  dev-dependencies:
    dependency-type: "development"
    update-types: ["minor", "patch"]
  production-dependencies:
    dependency-type: "production"
    update-types: ["minor", "patch"]
```

### 依名稱模式

```yaml
groups:
  angular:
    patterns: ["@angular*"]
    update-types: ["minor", "patch"]
  testing:
    patterns: ["jest*", "@testing-library*", "ts-jest"]
```

### 適用於安全性更新

```yaml
groups:
  security-patches:
    applies-to: security-updates
    patterns: ["*"]
    update-types: ["patch", "minor"]
```

關鍵行為：
- 符合多個群組的依賴項目會進入 **第一個** 匹配項
- 若未指定，`applies-to` 預設為 `version-updates`
- 未分組的依賴項目會獲得個別的 PR

## 多生態系統群組

將跨不同套件生態系統的更新整合到單一 PR 中：

```yaml
version: 2

multi-ecosystem-groups:
  infrastructure:
    schedule:
      interval: "weekly"
    labels: ["infrastructure", "dependencies"]

updates:
  - package-ecosystem: "docker"
    directory: "/"
    patterns: ["nginx", "redis"]
    multi-ecosystem-group: "infrastructure"

  - package-ecosystem: "terraform"
    directory: "/"
    patterns: ["aws*"]
    multi-ecosystem-group: "infrastructure"
```

使用 `multi-ecosystem-group` 時，必須指定 `patterns` 鍵值。

## PR 自訂

### 標籤 (Labels)

```yaml
labels:
  - "dependencies"
  - "npm"
```

設定 `labels: []` 可停用所有標籤（包括預設標籤）。若儲存庫中存在 SemVer 標籤（`major`, `minor`, `patch`），則一律會套用。

### 提交訊息 (Commit Messages)

```yaml
commit-message:
  prefix: "deps"
  prefix-development: "deps-dev"
  include: "scope"  # 在前綴後加上 deps/deps-dev 範圍
```

### 代理人與里程碑

```yaml
assignees: ["security-team-lead"]
milestone: 4  # 來自里程碑 URL 的數字 ID
```

### 分支名稱分隔符號

```yaml
pull-request-branch-name:
  separator: "-"  # 預設為 /
```

### 目標分支

```yaml
target-branch: "develop"  # PR 以此分支為目標，而非預設分支
```

注意：設定 `target-branch` 時，安全性更新仍以預設分支為目標；所有生態系統設定僅適用於版本更新。

## 排程優化

### 間隔

支援：`daily`, `weekly`, `monthly`, `quarterly`, `semiannually`, `yearly`, `cron`

```yaml
schedule:
  interval: "weekly"
  day: "monday"         # 僅適用於每週一次
  time: "09:00"         # HH:MM 格式
  timezone: "America/New_York"
```

### Cron 運算式

```yaml
schedule:
  interval: "cron"
  cronjob: "0 9 * * 1"  # 每週一上午 9 點
```

### 冷卻期 (Cooldown Periods)

延遲新發佈版本的更新，以避免早期採用者的問題：

```yaml
cooldown:
  default-days: 5
  semver-major-days: 30
  semver-minor-days: 7
  semver-patch-days: 3
  include: ["*"]
  exclude: ["critical-lib"]
```

冷卻期僅適用於版本更新，不適用於安全性更新。

## 安全性更新設定

### 透過儲存庫設定啟用

Settings → Advanced Security → 啟用 Dependabot alerts, security updates, and grouped security updates。

### 在 YAML 中分組安全性更新

```yaml
groups:
  security-patches:
    applies-to: security-updates
    patterns: ["*"]
    update-types: ["patch", "minor"]
```

### 停用版本更新（僅限安全性）

```yaml
open-pull-requests-limit: 0  # 停用版本更新 PR
```

### 自動分群規則

GitHub 預設會自動關閉對開發依賴項目影響較小的警示。自訂規則可以依嚴重性、套件名稱、CWE 等進行篩選。請在儲存庫的 Settings → Advanced Security 中進行設定。

## PR 指令註解

透過 `@dependabot` 註解與 Dependabot PR 互動。

> **注意：** 自 2026 年 1 月起，merge/close/reopen 指令已棄用。
> 請改用 GitHub 原生介面、CLI (`gh pr merge`) 或自動合併功能。

| 指令 | 效果 |
|---|---|
| `@dependabot rebase` | 對 PR 進行 rebase |
| `@dependabot recreate` | 從頭重新建立 PR |
| `@dependabot ignore this dependency` | 關閉且不再更新此依賴項目 |
| `@dependabot ignore this major version` | 忽略此主要版本 |
| `@dependabot ignore this minor version` | 忽略此次要版本 |
| `@dependabot ignore this patch version` | 忽略此修補版本 |

對於分組 PR，還有額外指令：
- `@dependabot ignore DEPENDENCY_NAME` — 忽略群組中的特定依賴項目
- `@dependabot unignore DEPENDENCY_NAME` — 清除忽略，並以更新重新開啟
- `@dependabot unignore *` — 清除群組中所有依賴項目的所有忽略條件
- `@dependabot show DEPENDENCY_NAME ignore conditions` — 顯示目前的忽略條件

如需完整的指令參考，請參閱 `references/pr-commands.md`。

## 忽略與允許規則

### 忽略特定依賴項目

```yaml
ignore:
  - dependency-name: "lodash"
  - dependency-name: "@types/node"
    update-types: ["version-update:semver-patch"]
  - dependency-name: "express"
    versions: ["5.x"]
```

### 僅允許特定類型

```yaml
allow:
  - dependency-type: "production"
  - dependency-name: "express"
```

規則：如果依賴項目同時符合 `allow` 和 `ignore`，它將會被 **忽略 (ignored)**。

### 排除路徑

```yaml
exclude-paths:
  - "vendor/**"
  - "test/fixtures/**"
```

## 進階選項

### 版本策略 (Versioning Strategy)

控制 Dependabot 如何編輯版本限制：

| 值 | 行為 |
|---|---|
| `auto` | 預設 — 應用程式調升版本，函式庫擴大範圍 |
| `increase` | 一律調升最低版本 |
| `increase-if-necessary` | 僅在目前範圍排除新版本時變更 |
| `lockfile-only` | 僅更新 lock 檔案，忽略 manifest |
| `widen` | 擴大範圍以包含舊版本與新版本 |

### Rebase 策略

```yaml
rebase-strategy: "disabled"  # 停止自動 rebase
```

在提交訊息中包含 `[dependabot skip]`，可允許在額外提交上進行 rebase。

### 開放 PR 限制

```yaml
open-pull-requests-limit: 10  # 預設為版本更新 5，安全性更新 10
```

設定為 `0` 可完全停用版本更新。

### 私有登錄檔

```yaml
registries:
  npm-private:
    type: npm-registry
    url: https://npm.example.com
    token: ${{secrets.NPM_TOKEN}}

updates:
  - package-ecosystem: "npm"
    directory: "/"
    registries:
      - npm-private
```

## 常見問題 (FAQ)

**我可以有多個 `dependabot.yml` 檔案嗎？**
不可以。GitHub 僅支援一個位於 `.github/dependabot.yml` 的檔案。請在該檔案中使用多個 `updates` 項目來處理不同的生態系統和目錄。

**Dependabot 支援 pnpm 嗎？**
支援。請使用 `package-ecosystem: "npm"` — Dependabot 會自動偵測 `pnpm-lock.yaml`。

**如何在 Monorepo 中減少 PR 干擾？**
使用 `groups` 來批次更新、使用包含萬用字元的 `directories` 以涵蓋多個目錄，以及使用 `group-by: dependency-name` 進行跨目錄分組。對於低優先級的生態系統，可以考慮將間隔設定為 `monthly` 或 `quarterly`。

**如何處理工作空間以外的依賴項目？**
建立一個獨立的生態系統項目，並將其 `directory` 指向該位置。

## 資源 (Resources)

- `references/dependabot-yml-reference.md` — 完整的 YAML 選項參考
- `references/pr-commands.md` — 完整的 PR 指令註解參考
- `references/example-configs.md` — 真實世界的設定範例
