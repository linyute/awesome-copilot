# Dependabot 設定範例 (Dependabot Configuration Examples)

常見情境下的真實 `dependabot.yml` 設定。

---

## 1. 基礎單一生態系統

單一 npm 專案的最低限度設定：

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## 2. 包含萬用字元模式的 Monorepo

具有多個工作空間套件的 Turborepo/pnpm monorepo：

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directories:
      - "/"
      - "/apps/*"
      - "/packages/*"
      - "/services/*"
    schedule:
      interval: "weekly"
      day: "monday"
    groups:
      dev-dependencies:
        dependency-type: "development"
        update-types: ["minor", "patch"]
      production-dependencies:
        dependency-type: "production"
        update-types: ["minor", "patch"]
    labels:
      - "dependencies"
      - "npm"
    commit-message:
      prefix: "deps"
      include: "scope"
```

---

## 3. 開發 vs 生產依賴項目分組

將開發和生產更新分開，以優先審閱生產環境的變更：

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      production-deps:
        dependency-type: "production"
      dev-deps:
        dependency-type: "development"
        exclude-patterns:
          - "eslint*"
      linting:
        patterns:
          - "eslint*"
          - "prettier*"
          - "@typescript-eslint*"
```

---

## 4. 跨目錄分組 (Monorepo)

針對跨目錄共用的依賴項目建立單一 PR：

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directories:
      - "/frontend"
      - "/admin-panel"
      - "/mobile-app"
    schedule:
      interval: "weekly"
    groups:
      monorepo-dependencies:
        group-by: dependency-name
```

當 `lodash` 在所有三個目錄中都有更新時，Dependabot 會建立單一 PR。

---

## 5. 多生態系統群組 (Docker + Terraform)

將基礎設施依賴項目更新整合到單一 PR 中：

```yaml
version: 2

multi-ecosystem-groups:
  infrastructure:
    schedule:
      interval: "weekly"
    labels: ["infrastructure", "dependencies"]
    assignees: ["@platform-team"]

updates:
  - package-ecosystem: "docker"
    directory: "/"
    patterns: ["nginx", "redis", "postgres"]
    multi-ecosystem-group: "infrastructure"

  - package-ecosystem: "terraform"
    directory: "/"
    patterns: ["aws*", "terraform-*"]
    multi-ecosystem-group: "infrastructure"
```

---

## 6. 僅限安全性更新（停用版本更新）

監控安全性弱點而不產生版本更新 PR：

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 0  # 停用版本更新 PR
    groups:
      security-all:
        applies-to: security-updates
        patterns: ["*"]
        update-types: ["patch", "minor"]

  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 0
```

---

## 7. 私有登錄檔

存取私有 npm 和 Docker 登錄檔：

```yaml
version: 2

registries:
  npm-private:
    type: npm-registry
    url: https://npm.internal.example.com
    token: ${{secrets.NPM_PRIVATE_TOKEN}}

  docker-ghcr:
    type: docker-registry
    url: https://ghcr.io
    username: ${{secrets.GHCR_USER}}
    password: ${{secrets.GHCR_TOKEN}}

updates:
  - package-ecosystem: "npm"
    directory: "/"
    registries:
      - npm-private
    schedule:
      interval: "weekly"

  - package-ecosystem: "docker"
    directory: "/"
    registries:
      - docker-ghcr
    schedule:
      interval: "weekly"
```

---

## 8. 冷卻期 (Cooldown Periods)

延遲新發佈版本的更新，以避免早期採用者的錯誤：

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 5
      semver-major-days: 30
      semver-minor-days: 14
      semver-patch-days: 3
      include: ["*"]
      exclude:
        - "security-critical-lib"
        - "@company/internal-*"
```

---

## 9. Cron 排程

使用 cron 運算式在特定時間執行更新：

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "cron"
      cronjob: "0 9 * * 1"  # 每週一上午 9:00
      timezone: "America/New_York"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "cron"
      cronjob: "0 6 1 * *"  # 每月第一天上午 6:00
```

---

## 10. 全功能設定

結合多種優化技術的綜合範例：

```yaml
version: 2

registries:
  npm-private:
    type: npm-registry
    url: https://npm.example.com
    token: ${{secrets.NPM_TOKEN}}

updates:
  # npm — monorepo 工作空間
  - package-ecosystem: "npm"
    directories:
      - "/"
      - "/apps/*"
      - "/packages/*"
      - "/services/*"
    registries:
      - npm-private
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/New_York"
    groups:
      dev-dependencies:
        dependency-type: "development"
        update-types: ["minor", "patch"]
      production-dependencies:
        dependency-type: "production"
        update-types: ["minor", "patch"]
      angular:
        patterns: ["@angular*"]
        update-types: ["minor", "patch"]
      security-patches:
        applies-to: security-updates
        patterns: ["*"]
        update-types: ["patch", "minor"]
    ignore:
      - dependency-name: "aws-sdk"
        update-types: ["version-update:semver-major"]
    cooldown:
      default-days: 3
      semver-major-days: 14
    labels:
      - "dependencies"
      - "npm"
    commit-message:
      prefix: "deps"
      prefix-development: "deps-dev"
      include: "scope"
    assignees:
      - "security-lead"
    open-pull-requests-limit: 15

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    groups:
      actions:
        patterns: ["*"]
    labels:
      - "dependencies"
      - "ci"
    commit-message:
      prefix: "ci"

  # Docker
  - package-ecosystem: "docker"
    directories:
      - "/services/*"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "docker"
    commit-message:
      prefix: "deps"

  # pip
  - package-ecosystem: "pip"
    directory: "/scripts"
    schedule:
      interval: "monthly"
    labels:
      - "dependencies"
      - "python"
    versioning-strategy: "increase-if-necessary"
    commit-message:
      prefix: "deps"

  # Terraform
  - package-ecosystem: "terraform"
    directory: "/infra"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "terraform"
    commit-message:
      prefix: "infra"
```

---

## 11. 忽略模式與版本策略

精確控制更新內容與方式：

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    versioning-strategy: "increase"
    ignore:
      # 絕不自動更新至 Express 5.x（破壞性變更）
      - dependency-name: "express"
        versions: ["5.x"]
      # 跳過類型定義的修補更新
      - dependency-name: "@types/*"
        update-types: ["version-update:semver-patch"]
      # 忽略 vendored 套件的所有更新
      - dependency-name: "legacy-internal-lib"
    allow:
      - dependency-type: "all"
    exclude-paths:
      - "vendor/**"
      - "test/fixtures/**"
```

---

## 12. 以非預設分支為目標

在生產環境之前，先在開發分支上測試更新：

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    target-branch: "develop"
    labels:
      - "dependencies"
      - "staging"

  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
    target-branch: "develop"
```

注意：安全性更新一律以預設分支為目標，不論 `target-branch` 為何。
