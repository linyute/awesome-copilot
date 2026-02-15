---
name: aspire
description: 'Aspire 技能涵蓋 Aspire CLI、AppHost 編排 (orchestration)、服務探索 (service discovery)、整合 (integrations)、MCP 伺服器、VS Code 延伸模組、開發容器 (Dev Containers)、GitHub Codespaces、範本、儀表板和部署。當使用者要求建立、執行、偵錯、設定、部署或疑難排解 Aspire 分散式應用程式時使用。'
---

# Aspire — 多語言分散式應用程式編排

Aspire 是一個**程式碼優先、多語言的工具鏈**，用於建構可觀測、生產就緒的分散式應用程式。它從單個 AppHost 專案編排容器、可執行檔和雲端資源 — 無論工作負載是 C#、Python、JavaScript/TypeScript、Go、Java、Rust、Bun、Deno 還是 PowerShell。

> **心理模型：** AppHost 是一位*指揮家* — 它不演奏樂器，它告訴每個服務何時開始、如何找到彼此，並觀察問題。

詳細的參考資料位於 `references/` 資料夾中 — 根據需求載入。

---

## 參考資料

| 參考資料 | 何時載入 |
|---|---|
| [CLI 參考](references/cli-reference.md) | 命令旗標、選項或詳細用法 |
| [MCP 伺服器](references/mcp-server.md) | 為 AI 助理設定 MCP、可用工具 |
| [整合目錄](references/integrations-catalog.md) | 透過 MCP 工具探索整合、佈線模式 |
| [多語言 API](references/polyglot-apis.md) | 方法簽章、鏈式選項、語言特定模式 |
| [架構](references/architecture.md) | DCP 內部機制、資源模型、服務探索、網路、遙測 |
| [儀表板](references/dashboard.md) | 儀表板功能、獨立模式、GenAI 視覺化檢視器 |
| [部署](references/deployment.md) | Docker、Kubernetes、Azure 容器應用程式、App Service |
| [測試](references/testing.md) | 針對 AppHost 的整合測試 |
| [疑難排解](references/troubleshooting.md) | 診斷代碼、常見錯誤和修正 |

---

## 1. 搜尋 Aspire 文件

Aspire 小組提供了一個 **MCP 伺服器**，直接在您的 AI 助理中提供文件工具。有關設定詳細資訊，請參閱 [MCP 伺服器](references/mcp-server.md)。

### Aspire CLI 13.2+ (推薦 — 內建文件搜尋)

如果執行 Aspire CLI **13.2 或更高版本** (`aspire --version`)，MCP 伺服器包含文件搜尋工具：

| 工具 | 說明 |
|---|---|
| `list_docs` | 列出來自 aspire.dev 的所有可用文件 |
| `search_docs` | 在索引文件中執行加權詞法搜尋 |
| `get_doc` | 透過別名 (slug) 擷取特定文件 |

這些工具是在 [PR #14028](https://github.com/dotnet/aspire/pull/14028) 中新增的。更新方式：`aspire update --self --channel daily`。

有關此方法的更多資訊，請參閱 David Pine 的部落格文章：https://davidpine.dev/posts/aspire-docs-mcp-tools/

### Aspire CLI 13.1 (僅限整合工具)

在 13.1 版本中，MCP 伺服器提供整合查詢，但**不提供**文件搜尋：

| 工具 | 說明 |
|---|---|
| `list_integrations` | 列出可用的 Aspire 裝載 (hosting) 整合 |
| `get_integration_docs` | 獲取特定整合套件的文件 |

對於 13.1 上的通用文件查詢，請使用 **Context7** 作為主要來源 (見下文)。

### 備用方案：Context7

當 Aspire MCP 文件工具不可用 (13.1) 或 MCP 伺服器未執行時，請使用 **Context7** (`mcp_context7`)：

**步驟 1 — 解析函式庫 ID** (每個工作階段一次)：

呼叫 `mcp_context7_resolve-library-id` 並帶入 `libraryName: ".NET Aspire"`。

| 排名 | 函式庫 ID | 何時使用 |
|---|---|---|
| 1 | `/microsoft/aspire.dev` | 主要來源。指南、整合、CLI 參考、部署。 |
| 2 | `/dotnet/aspire` | API 內部機制、原始碼層級的實作詳細資訊。 |
| 3 | `/communitytoolkit/aspire` | 非 Microsoft 的多語言整合 (Go、Java、Node.js、Ollama)。 |

**步驟 2 — 查詢文件：**

```
libraryId: "/microsoft/aspire.dev", query: "Python integration AddPythonApp service discovery"
libraryId: "/communitytoolkit/aspire", query: "Golang Java Node.js community integrations"
```

### 備用方案：GitHub 搜尋 (當 Context7 也不可用時)

搜尋 GitHub 上的官方文件儲存庫：
- **文件儲存庫：** `microsoft/aspire.dev` — 路徑：`src/frontend/src/content/docs/`
- **原始碼儲存庫：** `dotnet/aspire`
- **範例儲存庫：** `dotnet/aspire-samples`
- **社群整合：** `CommunityToolkit/Aspire`

---

## 2. 先決條件與安裝

| 要求 | 詳細資訊 |
|---|---|
| **.NET SDK** | 10.0+ (即使是非 .NET 工作負載也需要 — 因為 AppHost 是 .NET) |
| **容器執行階段** | Docker Desktop、Podman 或 Rancher Desktop |
| **IDE (選用)** | VS Code + C# Dev Kit、Visual Studio 2022、JetBrains Rider |

```bash
# Linux / macOS
curl -sSL https://aspire.dev/install.sh | bash

# Windows PowerShell
irm https://aspire.dev/install.ps1 | iex

# 驗證
aspire --version

# 安裝範本
dotnet new install Aspire.ProjectTemplates
```

---

## 3. 專案範本

| 範本 | 命令 | 說明 |
|---|---|---|
| **aspire-starter** | `aspire new aspire-starter` | ASP.NET Core/Blazor 入門版 + AppHost + 測試 |
| **aspire-ts-cs-starter** | `aspire new aspire-ts-cs-starter` | ASP.NET Core/React 入門版 + AppHost |
| **aspire-py-starter** | `aspire new aspire-py-starter` | FastAPI/React 入門版 + AppHost |
| **aspire-apphost-singlefile** | `aspire new aspire-apphost-singlefile` | 空的單一檔案 AppHost |

---

## 4. AppHost 快速入門 (多語言)

AppHost 編排所有服務。非 .NET 工作負載以容器或可執行檔的形式執行。

```csharp
var builder = DistributedApplication.CreateBuilder(args);

// 基礎設施
var redis = builder.AddRedis("cache");
var postgres = builder.AddPostgres("pg").AddDatabase("catalog");

// .NET API
var api = builder.AddProject<Projects.CatalogApi>("api")
    .WithReference(postgres).WithReference(redis);

// Python ML 服務
var ml = builder.AddPythonApp("ml-service", "../ml-service", "main.py")
    .WithHttpEndpoint(targetPort: 8000).WithReference(redis);

// React 前端 (Vite)
var web = builder.AddViteApp("web", "../frontend")
    .WithHttpEndpoint(targetPort: 5173).WithReference(api);

// Go 工作者 (worker)
var worker = builder.AddGolangApp("worker", "../go-worker")
    .WithReference(redis);

builder.Build().Run();
```

有關完整的 API 簽章，請參閱[多語言 API](references/polyglot-apis.md)。

---

## 5. 核心概念 (摘要)

| 概念 | 重點 |
|---|---|
| **執行 vs 發佈** | `aspire run` = 本地開發 (DCP 引擎)。`aspire publish` = 產生部署資訊清單 (manifests)。 |
| **服務探索** | 透過環境變數自動進行：`ConnectionStrings__<name>`、`services__<name>__http__0` |
| **資源生命週期** | DAG 排序 — 相依項目優先啟動。`.WaitFor()` 門控健康檢查。 |
| **資源類型** | `ProjectResource`、`ContainerResource`、`ExecutableResource`、`ParameterResource` |
| **整合** | 跨 13 個類別的 144 個以上整合。裝載套件 (AppHost) + 用戶端套件 (服務)。 |
| **儀表板** | 即時記錄、追蹤、計量、GenAI 視覺化檢視器。使用 `aspire run` 自動執行。 |
| **MCP 伺服器** | AI 助理可以透過 CLI (STDIO) 查詢執行中的應用程式並搜尋文件。 |
| **測試** | `Aspire.Hosting.Testing` — 在 xUnit/MSTest/NUnit 中啟動完整的 AppHost。 |
| **部署** | Docker、Kubernetes、Azure 容器應用程式、Azure App Service。 |

---

## 6. CLI 快速參考

Aspire CLI 13.1 中的有效命令：

| 命令 | 說明 | 狀態 |
|---|---|---|
| `aspire new <template>` | 從範本建立 | 穩定 |
| `aspire init` | 在現有專案中初始化 | 穩定 |
| `aspire run` | 在本地啟動所有資源 | 穩定 |
| `aspire add <integration>` | 新增整合 | 穩定 |
| `aspire publish` | 產生部署資訊清單 | 預覽 |
| `aspire config` | 管理組態設定 | 穩定 |
| `aspire cache` | 管理磁碟快取 | 穩定 |
| `aspire deploy` | 部署到定義的目標 | 預覽 |
| `aspire do <step>` | 執行管線步驟 | 預覽 |
| `aspire update` | 更新整合 (或使用 `--self` 更新 CLI) | 預覽 |
| `aspire mcp init` | 為 AI 助理設定 MCP | 穩定 |
| `aspire mcp start` | 啟動 MCP 伺服器 | 穩定 |

包含旗標的完整命令參考：[CLI 參考資料](references/cli-reference.md)。

---

## 7. 常見模式

### 新增服務

1. 建立您的服務目錄 (任何語言)
2. 新增至 AppHost：`Add*App()` 或 `AddProject<T>()`
3. 連接相依性：`.WithReference()`
4. 門控健康狀況：如果需要，使用 `.WaitFor()`
5. 執行：`aspire run`

### 從 Docker Compose 遷移

1. `aspire new aspire-apphost-singlefile` (空的 AppHost)
2. 將每個 `docker-compose` 服務替換為 Aspire 資源
3. `depends_on` → `.WithReference()` + `.WaitFor()`
4. `ports` → `.WithHttpEndpoint()`
5. `environment` → `.WithEnvironment()` 或 `.WithReference()`

---

## 8. 重要 URL

| 資源 | URL |
|---|---|
| **文件** | https://aspire.dev |
| **執行階段儲存庫** | https://github.com/dotnet/aspire |
| **文件儲存庫** | https://github.com/microsoft/aspire.dev |
| **範例** | https://github.com/dotnet/aspire-samples |
| **社群工具箱 (Community Toolkit)** | https://github.com/CommunityToolkit/Aspire |
| **儀表板映像** | `mcr.microsoft.com/dotnet/aspire-dashboard` |
| **Discord** | https://aka.ms/aspire/discord |
| **Reddit** | https://www.reddit.com/r/aspiredotdev/ |
