# 適用於 Microsoft 365 Copilot 的 TypeSpec

## 概觀

適用於 Microsoft 365 Copilot 的 TypeSpec 是一個強大的特定領域語言 (DSL)，讓開發者能使用簡潔、具表現力的語法建立宣告式代理程式與 API 外掛程式。建構在 [TypeSpec](https://typespec.io/) 的基礎之上，此專用語言提供了 Microsoft 365 特有的裝飾器 (decorators) 與功能，簡化了擴充 Microsoft 365 Copilot 的開發過程。

## 為什麼使用 TypeSpec？

- **型別安全性** (Type Safety)：針對所有 Microsoft 365 Copilot 特定建構提供完整的型別檢查
- **開發者體驗** (Developer Experience)：在 Visual Studio Code 中提供豐富的 IntelliSense 支援與即時回饋
- **簡化撰寫** (Simplified Authoring)：以直覺的裝飾器語法取代冗長的 JSON 組態
- **自動產生資訊清單** (Automatic Manifest Generation)：自動產生有效的資訊清單檔案與 OpenAPI 規格
- **可維護性** (Maintainability)：與手動撰寫 JSON 相比，程式碼更具可讀性且更易於維護

## 核心概念

### 宣告式代理程式

宣告式代理程式是 Microsoft 365 Copilot 的自訂版本，允許使用者透過宣告特定的指示、動作與知識來建立個人化體驗。

**基本代理程式範例：**
```typescript
@agent(
  "客戶支援助手",
  "一個協助處理客戶支援查詢與工單管理的 AI 代理程式"
)
@instructions("""
  你是一位客戶支援專員。協助使用者處理他們的查詢、
  提供疑難排解步驟，並在必要時呈報複雜問題。
  始終保持助人且專業的語氣。
""")
@conversationStarter(#{
  title: "檢查工單狀態",
  text: "我的支援工單狀態為何？"
})
namespace CustomerSupportAgent {
  // 代理程式功能定義於此
}
```

### API 外掛程式

API 外掛程式透過自訂 API 作業擴充 Microsoft 365 Copilot，實現與外部服務與資料來源的整合。

**基本 API 外掛程式範例：**
```typescript
import "@typespec/http";
import "@microsoft/typespec-m365-copilot";

using TypeSpec.Http;
using Microsoft.M365Copilot;

@service
@server("https://api.contoso.com")
@actions(#{
  nameForHuman: "專案管理 API",
  descriptionForHuman: "管理專案與任務",
  descriptionForModel: "用於建立、更新與追蹤專案任務的 API"
})
namespace ProjectAPI {
  model Project {
    id: string;
    name: string;
    description?: string;
    status: "active" | "completed" | "on-hold";
    createdDate: utcDateTime;
  }

  @route("/projects")
  @get op listProjects(): Project[];

  @route("/projects/{id}")
  @get op getProject(@path id: string): Project;

  @route("/projects")
  @post op createProject(@body project: CreateProjectRequest): Project;
}
```

## 關鍵裝飾器

### 代理程式裝飾器

- **@agent**：定義代理程式的名稱、描述與選填 ID
- **@instructions**：為代理程式定義行為指示與指南
- **@conversationStarter**：為使用者定義對話啟動器提示字元
- **@behaviorOverrides**：修改代理程式協調行為設定
- **@disclaimer**：向使用者顯示法律或合規性免責聲明
- **@customExtension**：新增自訂的鍵值對 (key-value pairs) 以進行擴充

### API 外掛程式裝飾器

- **@actions**：定義動作 Metadata，包含名稱、描述與 URL
- **@authReferenceId**：指定用於 API 存取的驗證引用 ID
- **@capabilities**：設定功能特點，如確認對話與回應格式化
- **@card**：為函式回應定義調適型卡片 (Adaptive Card) 範本
- **@reasoning**：為函式呼叫提供推論指示
- **@responding**：為函式定義回應格式化指示

## 代理程式功能

TypeSpec 提供了存取 Microsoft 365 服務與外部資源的內建功能：

### 知識來源

**網頁搜尋 (Web Search)**
```typescript
op webSearch is AgentCapabilities.WebSearch<Sites = [
  {
    url: "https://learn.microsoft.com"
  }
]>;
```

**OneDrive 與 SharePoint**
```typescript
op oneDriveAndSharePoint is AgentCapabilities.OneDriveAndSharePoint<
  ItemsByUrl = [
    { url: "https://contoso.sharepoint.com/sites/ProductSupport" }
  ]
>;
```

**Teams 訊息 (Teams Messages)**
```typescript
op teamsMessages is AgentCapabilities.TeamsMessages<Urls = [
  {
    url: "https://teams.microsoft.com/l/team/...",
  }
]>;
```

**電子郵件 (Email)**
```typescript
op email is AgentCapabilities.Email<Folders = [
  {
    folderId: "Inbox",
  }
]>;
```

**人員 (People)**
```typescript
op people is AgentCapabilities.People;
```

**Copilot 連接器 (Copilot Connectors)**
```typescript
op copilotConnectors is AgentCapabilities.GraphConnectors<Connections = [
  {
    connectionId: "policieslocal",
  }
]>;
```

**Dataverse**
```typescript
op dataverse is AgentCapabilities.Dataverse<KnowledgeSources = [
  {
    hostName: "contoso.crm.dynamics.com";
    tables: [
      { tableName: "account" },
      { tableName: "contact" }
    ];
  }
]>;
```

### 生產力工具

**程式碼解譯器 (Code Interpreter)**
```typescript
op codeInterpreter is AgentCapabilities.CodeInterpreter;
```

**影像產生器 (Image Generator)**
```typescript
op graphicArt is AgentCapabilities.GraphicArt;
```

**會議 (Meetings)**
```typescript
op meetings is AgentCapabilities.Meetings;
```

**情境模型 (Scenario Models)**
```typescript
op scenarioModels is AgentCapabilities.ScenarioModels<ModelsById = [
  { id: "financial-forecasting-model-v3" }
]>;
```

## 驗證

TypeSpec 支援多種驗證方法以保護 API 外掛程式：

### 無驗證 (匿名存取)
```typescript
@service
@actions(ACTIONS_METADATA)
@server(SERVER_URL, API_NAME)
namespace API {
  // 端點
}
```

### API 金鑰驗證 (API Key Authentication)
```typescript
@service
@actions(ACTIONS_METADATA)
@server(SERVER_URL, API_NAME)
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "X-Your-Key">)
namespace API {
  // 端點
}
```

### OAuth2 授權碼流程 (OAuth2 Authorization Code Flow)
```typescript
@service
@actions(ACTIONS_METADATA)
@server(SERVER_URL, API_NAME)
@useAuth(OAuth2Auth<[{
  type: OAuth2FlowType.authorizationCode;
  authorizationUrl: "https://contoso.com/oauth2/v2.0/authorize";
  tokenUrl: "https://contoso.com/oauth2/v2.0/token";
  refreshUrl: "https://contoso.com/oauth2/v2.0/token";
  scopes: ["scope-1", "scope-2"];
}]>)
namespace API {
  // 端點
}
```

### 使用註冊的驗證
```typescript
@authReferenceId("NzFmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IyM5NzQ5Njc3Yi04NDk2LTRlODYtOTdmZS1kNDUzODllZjUxYjM=")
model Auth is OAuth2Auth<[{
  type: OAuth2FlowType.authorizationCode;
  authorizationUrl: "https://contoso.com/oauth2/v2.0/authorize";
  tokenUrl: "https://contoso.com/oauth2/v2.0/token";
  refreshUrl: "https://contoso.com/oauth2/v2.0/token";
  scopes: ["scope-1", "scope-2"];
}]>
```

## 常見案例

### 多功能知識工作者代理程式 (Multi-Capability Knowledge Worker Agent)
```typescript
import "@typespec/http";
import "@typespec/openapi3";
import "@microsoft/typespec-m365-copilot";

using TypeSpec.Http;
using TypeSpec.M365.Copilot.Agents;

@agent({
  name: "知識工作者助手",
  description: "一個協助研究、檔案管理與尋找同事的智慧助手"
})
@instructions("""
  你是一位博學的研究助手，專門協助知識工作者
  高效地尋找資訊。你可以搜尋網頁進行外部研究、存取
  SharePoint 文件以獲取組織內容，並協助在組織內
  尋找同事。
""")
namespace KnowledgeWorkerAgent {
  op webSearch is AgentCapabilities.WebSearch<Sites = [
    {
      url: "https://learn.microsoft.com";
    }
  ]>;

  op oneDriveAndSharePoint is AgentCapabilities.OneDriveAndSharePoint<
    ItemsByUrl = [
      { url: "https://contoso.sharepoint.com/sites/IT" }
    ]
  >;

  op people is AgentCapabilities.People;
}
```

### 具驗證功能的 API 外掛程式
```typescript
import "@typespec/http";
import "@microsoft/typespec-m365-copilot";

using TypeSpec.Http;
using TypeSpec.M365.Copilot.Actions;

@service
@actions(#{
    nameForHuman: "維修中心 API",
    descriptionForModel: "全方位的維修管理系統",
    descriptionForHuman: "管理設施維修並追蹤指派任務"
})
@server("https://repairshub-apikey.contoso.com", "維修中心 API")
@useAuth(RepairsHubApiKeyAuth)
namespace RepairsHub {
  @route("/repairs")
  @get
  @action
  @card(#{
    dataPath: "$",
    title: "$.title",
    url: "$.image",
    file: "cards/card.json"
  })
  op listRepairs(
    @query assignedTo?: string
  ): string;

  @route("/repairs")
  @post
  @action
  @capabilities(#{
    confirmation: #{
      type: "AdaptiveCard",
      title: "建立新維修任務",
      body: """
      正在建立具有以下詳細資訊的新維修任務：
        * **標題**: {{ function.parameters.title }}
        * **描述**: {{ function.parameters.description }}
      """
    }
  })
  op createRepair(
    @body repair: Repair
  ): Repair;

  model Repair {
    id?: string;
    title: string;
    description?: string;
    assignedTo?: string;
  }

  @authReferenceId("${{REPAIRSHUBAPIKEYAUTH_REFERENCE_ID}}")
  model RepairsHubApiKeyAuth is ApiKeyAuth<ApiKeyLocation.query, "code">;
}
```

## 入門指南

### 前提條件
- [Visual Studio Code](https://code.visualstudio.com/)
- [Microsoft 365 Agents Toolkit Visual Studio Code 擴充功能](https://aka.ms/M365AgentsToolkit)
- Microsoft 365 Copilot 授權

### 建立你的第一個代理程式

1. 開啟 Visual Studio Code
2. 選擇 **Microsoft 365 Agents Toolkit > Create a New Agent/App**
3. 選擇 **Declarative Agent**
4. 選擇 **Start with TypeSpec for Microsoft 365 Copilot**
5. 選擇您的專案位置與名稱
6. 編輯 `main.tsp` 檔案以自訂您的代理程式
7. 在 Lifecycle 窗格中選擇 **Provision** 進行部署

## 最佳做法

### 指示
- 對於代理程式的角色與專業領域提供具體且清晰的說明
- 定義要避免的行為以及期望的行為
- 保持指示在 8,000 個字元以內
- 對於多行指示使用三引號字串

### 對話啟動器
- 提供 2-4 個多樣化的範例說明如何與代理程式互動
- 使其具體對應於您代理程式的功能
- 保持標題簡潔 (100 個字元以內)

### 功能
- 僅包含您代理程式實際需要的功能
- 盡可能將功能限定在特定的資源範圍內
- 使用 URL 與 ID 限制對相關內容的存取

### API 作業
- 使用具描述性的作業名稱與清晰的參數名稱
- 為模型與人類使用者提供詳細的描述
- 為破壞性作業實作確認對話方塊
- 實作適當的錯誤處理並提供具意義的錯誤訊息

### 驗證
- 在正式環境中使用註冊的驗證組態
- 遵循範圍 (scopes) 的最小權限原則
- 將敏感認證儲存在環境變數中
- 使用 `@authReferenceId` 引用註冊的組態

## 開發工作流程

1. **建立**：使用 Microsoft 365 Agents Toolkit 架構您的專案
2. **定義**：在 `main.tsp` 與 `actions.tsp` 中撰寫您的 TypeSpec 定義
3. **設定**：設定驗證與功能
4. **佈署** (Provision)：部署到您的開發環境
5. **測試**：在 Microsoft 365 Copilot (https://m365.cloud.microsoft/chat) 中進行驗證
6. **偵錯**：使用 Copilot 開發者模式進行偵錯
7. **反覆運算**：根據測試回饋進行精煉
8. **發佈**：準備就緒後部署到正式環境

## 常見模式

### 檔案結構
```
project/
├── appPackage/
│   ├── cards/
│   │   └── card.json
│   ├── .generated/
│   ├── manifest.json
│   └── ...
├── src/
│   ├── main.tsp
│   └── actions.tsp
├── m365agents.yml
└── package.json
```

### 多檔案 TypeSpec
```typescript
// main.tsp
import "@typespec/http";
import "@microsoft/typespec-m365-copilot";
import "./actions.tsp";

using TypeSpec.Http;
using TypeSpec.M365.Copilot.Agents;
using TypeSpec.M365.Copilot.Actions;

@agent("我的代理程式", "描述內容")
@instructions("在此輸入指示")
namespace MyAgent {
  op apiAction is MyAPI.someOperation;
}

// actions.tsp
import "@typespec/http";
import "@microsoft/typespec-m365-copilot";

@service
@actions(#{...})
@server("https://api.example.com")
namespace MyAPI {
  @route("/operation")
  @get
  @action
  op someOperation(): Response;
}
```

### 調適型卡片
```json
{
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.5",
  "body": [
    {
      "type": "Container",
      "$data": "${$root}",
      "items": [
        {
          "type": "TextBlock",
          "text": "標題: ${if(title, title, 'N/A')}",
          "wrap": true
        },
        {
          "type": "Image",
          "url": "${image}",
          "$when": "${image != null}"
        }
      ]
    }
  ]
}
```

## 資源

- [TypeSpec 官方文件](https://typespec.io/)
- [Microsoft 365 Agents Toolkit](https://aka.ms/M365AgentsToolkit)
- [宣告式代理程式文件](https://learn.microsoft.com/zh-tw/microsoft-365-copilot/extensibility/overview-declarative-agent)
- [API 外掛程式文件](https://learn.microsoft.com/zh-tw/microsoft-365-copilot/extensibility/overview-api-plugins)
- [PnP Copilot 範例](https://github.com/pnp/copilot-pro-dev-samples)

## 深入了解

- [TypeSpec 概觀](https://learn.microsoft.com/zh-tw/microsoft-365-copilot/extensibility/overview-typespec)
- [使用 TypeSpec 建置宣告式代理程式](https://learn.microsoft.com/zh-tw/microsoft-365-copilot/extensibility/build-declarative-agents-typespec)
- [TypeSpec 情境](https://learn.microsoft.com/zh-tw/microsoft-365-copilot/extensibility/typespec-scenarios)
- [TypeSpec 驗證](https://learn.microsoft.com/zh-tw/microsoft-365-copilot/extensibility/typespec-authentication)
- [TypeSpec 裝飾器參考](https://learn.microsoft.com/zh-tw/microsoft-365-copilot/extensibility/typespec-decorators)
- [TypeSpec 功能參考](https://learn.microsoft.com/zh-tw/microsoft-365-copilot/extensibility/typespec-capabilities)
