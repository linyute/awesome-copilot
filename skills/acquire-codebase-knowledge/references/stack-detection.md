# 堆疊偵測參考

當技術堆疊模糊時請載入此檔案 — 例如，存在多個資訊清單檔案、不熟悉的副檔名，或沒有明顯的 `package.json` / `go.mod`。

---

## 資訊清單檔案 → 生態系統

| 檔案 | 生態系統 | 建議閱讀的關鍵欄位 |
|------|-----------|--------------------|
| `package.json` | Node.js / JavaScript / TypeScript | `dependencies`, `devDependencies`, `scripts`, `main`, `type`, `engines` |
| `go.mod` | Go | 模組路徑, Go 版本, `require` 區塊 |
| `requirements.txt` | Python (pip) | 帶有固定版本的套件列表 |
| `Pipfile` | Python (pipenv) | `[packages]`, `[dev-packages]`, `[requires]` python 版本 |
| `pyproject.toml` | Python (poetry / uv / hatch) | `[tool.poetry.dependencies]`, `[project]`, `[build-system]` |
| `setup.py` / `setup.cfg` | Python (setuptools, 舊版) | `install_requires`, `python_requires` |
| `Cargo.toml` | Rust | `[dependencies]`, `[[bin]]`, `[lib]` |
| `pom.xml` | Java / Kotlin (Maven) | `<dependencies>`, `<artifactId>`, `<groupId>`, `<java.version>` |
| `build.gradle` / `build.gradle.kts` | Java / Kotlin (Gradle) | `dependencies {}`, `sourceCompatibility` |
| `composer.json` | PHP | `require`, `require-dev` |
| `Gemfile` | Ruby | `gem` 宣告, `ruby` 版本限制 |
| `mix.exs` | Elixir | `deps/0`, `elixir: "~> X.Y"` |
| `pubspec.yaml` | Dart / Flutter | `dependencies`, `dev_dependencies`, `environment.sdk` |
| `*.csproj` | .NET / C# | `<PackageReference>`, `<TargetFramework>` |
| `*.sln` | .NET 解決方案 | 參考多個 `.csproj` 專案 |
| `deno.json` / `deno.jsonc` | Deno (TypeScript 執行階段) | `imports`, `tasks` |
| `bun.lockb` | Bun (JavaScript 執行階段) | 二進位鎖定檔案 — 檢查 `package.json` 以獲取依賴項 |

---

## 語言執行階段版本偵測

| 語言 | 哪裡可以找到版本資訊 |
|----------|--------------------------|
| Node.js | `.nvmrc`, `.node-version`, `package.json` 中的 `engines.node`, Docker `FROM node:X` |
| Python | `.python-version`, `pyproject.toml [requires-python]`, Docker `FROM python:X` |
| Go | `go.mod` 的第一行 (`go 1.21`) |
| Java | `pom.xml` 中的 `<java.version>`, `build.gradle` 中的 `sourceCompatibility`, Docker `FROM eclipse-temurin:X` |
| Ruby | `.ruby-version`, `Gemfile` 中的 `ruby 'X.Y.Z'` |
| Rust | `rust-toolchain.toml`, `rust-toolchain` 檔案 |
| .NET | `.csproj` 中的 `<TargetFramework>` (例如：`net8.0`) |

---

## 框架偵測 (Node.js / TypeScript)

| `package.json` 中的依賴項 | 框架 |
|-----------------------------|-----------|
| `express` | Express.js (極簡 HTTP 伺服器) |
| `fastify` | Fastify (高效能 HTTP 伺服器) |
| `next` | Next.js (SSR/SSG React — 檢查是否有 `pages/` 或 `app/` 目錄) |
| `nuxt` | Nuxt.js (SSR/SSG Vue) |
| `@nestjs/core` | NestJS (帶有 DI 的成套 Node.js 框架) |
| `koa` | Koa (以中介軟體為中心，無內建路由) |
| `@hapi/hapi` | Hapi |
| `@trpc/server` | tRPC (無須 REST/GraphQL 結構定義的類型安全 API) |
| `routing-controllers` | routing-controllers (基於裝飾器的 Express 包裝器) |
| `typeorm` | TypeORM (帶有裝飾器的 SQL ORM) |
| `prisma` | Prisma (類型安全 ORM，檢查 `prisma/schema.prisma`) |
| `mongoose` | Mongoose (MongoDB ODM) |
| `sequelize` | Sequelize (SQL ORM) |
| `drizzle-orm` | Drizzle (輕量級 SQL ORM) |
| `react` (不含 `next`) | 原生 React SPA (檢查是否有 `react-router-dom`) |
| `vue` (不含 `nuxt`) | 原生 Vue SPA |

---

## 框架偵測 (Python)

| 套件 | 框架 |
|---------|-----------|
| `fastapi` | FastAPI (非同步 REST，自動產生 OpenAPI 文件) |
| `flask` | Flask (極簡 WSGI 網頁框架) |
| `django` | Django (功能完備，檢查 `settings.py`) |
| `starlette` | Starlette (ASGI，常用作 FastAPI 基礎) |
| `aiohttp` | aiohttp (非同步 HTTP 客戶端與伺服器) |
| `sqlalchemy` | SQLAlchemy (SQL ORM；檢查是否有 `alembic` 遷移) |
| `alembic` | Alembic (SQLAlchemy 遷移工具) |
| `pydantic` | Pydantic (資料驗證；FastAPI 的核心) |
| `celery` | Celery (分散式作業佇列) |

---

## Monorepo 偵測

依序檢查這些訊號：

1. `pnpm-workspace.yaml` — pnpm 工作區
2. `lerna.json` — Lerna Monorepo
3. `nx.json` — Nx Monorepo (同時檢查 `workspace.json`)
4. `turbo.json` — Turborepo
5. `rush.json` — Rush (Microsoft Monorepo 管理員)
6. `moon.yml` — Moon
7. 帶有 `"workspaces": [...]` 的 `package.json` — npm/yarn 工作區
8. 存在擁有各自 `package.json` 的 `packages/`、`apps/`、`libs/` 或 `services/` 目錄

若偵測到 Monorepo：每個工作區可能擁有**獨立**的依賴項與規範。請在 `STACK.md` 中分別對照每個子套件，並在 `STRUCTURE.md` 中註明 Monorepo 結構。

---

## TypeScript 路徑別名偵測

若 `tsconfig.json` 具有 `paths` 鍵，則帶有非相對前綴的匯入即為別名。在記錄結構前請先對照這些別名。

```json
// tsconfig.json 範例
"paths": {
  "@/*": ["./src/*"],
  "@components/*": ["./src/components/*"],
  "@utils/*": ["./src/utils/*"]
}
```

如 `import { foo } from '@/utils/bar'` 類的匯入會解析為 `src/utils/bar`。請記錄為 `src/utils/bar`，而非 `@/utils/bar`。

---

## Docker 基礎映像檔 → 執行階段

若不存在資訊清單檔案但存在 `Dockerfile`，則 `FROM` 行會揭露執行階段資訊：

| FROM 行模式 | 執行階段 |
|------------------|---------|
| `FROM node:X` | Node.js X |
| `FROM python:X` | Python X |
| `FROM golang:X` | Go X |
| `FROM eclipse-temurin:X` | Java X (Eclipse Temurin JDK) |
| `FROM mcr.microsoft.com/dotnet/aspnet:X` | .NET X |
| `FROM ruby:X` | Ruby X |
| `FROM rust:X` | Rust X |
| `FROM alpine` (單獨出現) | 檢查透過 `RUN apk add` 安裝了什麼 |
