---
description: '建構基於 TypeSpec 的宣告式 Agent 以及 Microsoft 365 Copilot API 外掛程式的最佳實踐指南'
applyTo: '**/*.tsp'
---

# 適用於 Microsoft 365 Copilot 開發的 TypeSpec 指南

## 核心原則

使用 TypeSpec 開發 Microsoft 365 Copilot 時：

1. **型別安全優先**：對所有模型和操作利用 TypeSpec 的強型別特性
2. **宣告式方法**：使用裝飾器 (Decorators) 描述意圖，而非實作
3. **限縮能力範圍**：儘可能將能力限縮於特定資源
4. **清晰的指示**：撰寫明確、詳細的 Agent 指示
5. **以使用者為中心**：針對 Microsoft 365 Copilot 中的終端使用者體驗進行設計

## 檔案組織

### 標準結構
```
project/
├── appPackage/
│   ├── cards/              # 調適型卡片 (Adaptive Card) 模板
│   │   └── *.json
│   ├── .generated/         # 生成的資訊清單 (自動生成)
│   └── manifest.json       # Teams 應用程式資訊清單
├── src/
│   ├── main.tsp           # Agent 定義
│   └── actions.tsp        # API 操作 (用於外掛程式)
├── m365agents.yml         # Agents Toolkit 配置
└── package.json
```

### 匯入語句
務必在 TypeSpec 檔案頂部包含必要的匯入：

```typescript
import "@typespec/http";
import "@typespec/openapi3";
import "@microsoft/typespec-m365-copilot";

using TypeSpec.Http;
using TypeSpec.M365.Copilot.Agents;  // 用於 Agent
using TypeSpec.M365.Copilot.Actions; // 用於 API 外掛程式
```

## Agent 開發最佳實踐

### Agent 宣告
```typescript
@agent({
  name: "Role-Based Name",  // 例如："客戶支援助手"
  description: "1,000 字元以內的清晰簡潔描述"
})
```

- 使用能描述 Agent 功能的角色化名稱
- 描述應具備資訊性且簡潔
- 避免使用如 "Helper" 或 "Bot" 之類的通用名稱

### 指示
```typescript
@instructions("""
  您是一位專精於 [領域] 的 [特定角色]。
  
  您的職責包括：
  - [關鍵職責 1]
  - [關鍵職責 2]
  
  在協助使用者時：
  - [行為準則 1]
  - [行為準則 2]
  
  您不應該：
  - [限制 1]
  - [限制 2]
""")
```

- 使用第二人稱撰寫（「您是...」）
- 明確定義 Agent 的角色與專業知識
- 同時定義「要做什麼」以及「不要做什麼」
- 保持在 8,000 字元以內
- 使用清晰、結構化的格式

### 交談啟動器
```typescript
@conversationStarter(#{
  title: "Action-Oriented Title",  // 例如："檢查狀態"
  text: "具體的範例查詢"           // 例如："我的工單狀態為何？"
})
```

- 提供 2-4 個多樣化的啟動器
- 讓每個啟動器展示不同的能力
- 使用以行動為導向的標題
- 撰寫真實的範例查詢

### 能力 - 知識來源

**網頁搜尋** - 儘可能限縮於特定網站：
```typescript
op webSearch is AgentCapabilities.WebSearch<Sites = [
  { url: "https://learn.microsoft.com" },
  { url: "https://docs.microsoft.com" }
]>;
```

**OneDrive 和 SharePoint** - 使用 URL 或 ID：
```typescript
op oneDriveAndSharePoint is AgentCapabilities.OneDriveAndSharePoint<
  ItemsByUrl = [
    { url: "https://contoso.sharepoint.com/sites/Engineering" }
  ]
>;
```

**Teams 訊息** - 指定頻道/聊天：
```typescript
op teamsMessages is AgentCapabilities.TeamsMessages<Urls = [
  { url: "https://teams.microsoft.com/l/channel/..." }
]>;
```

**電子郵件** - 限縮於特定資料夾：
```typescript
op email is AgentCapabilities.Email<
  Folders = [
    { folderId: "Inbox" },
    { folderId: "SentItems" }
  ],
  SharedMailbox = "support@contoso.com"  // 選用
>;
```

**人員** - 無需限縮範圍：
```typescript
op people is AgentCapabilities.People;
```

**Copilot 連接器** - 指定連線 ID：
```typescript
op copilotConnectors is AgentCapabilities.GraphConnectors<
  Connections = [
    { connectionId: "your-connector-id" }
  ]
>;
```

**Dataverse** - 限縮於特定資料表：
```typescript
op dataverse is AgentCapabilities.Dataverse<
  KnowledgeSources = [
    {
      hostName: "contoso.crm.dynamics.com";
      tables: [
        { tableName: "account" },
        { tableName: "contact" }
      ];
    }
  ]
>;
```

### 能力 - 生產力工具

```typescript
// Python 程式碼執行
op codeInterpreter is AgentCapabilities.CodeInterpreter;

// 圖像生成
op graphicArt is AgentCapabilities.GraphicArt;

// 會議內容存取
op meetings is AgentCapabilities.Meetings;

// 專用 AI 模型
op scenarioModels is AgentCapabilities.ScenarioModels<
  ModelsById = [
    { id: "model-id" }
  ]
>;
```

## API 外掛程式開發最佳實踐

### 服務定義
```typescript
@service
@actions(#{
  nameForHuman: "使用者友好的 API 名稱",
  descriptionForHuman: "使用者能理解的內容",
  descriptionForModel: "模型需要知道的內容",
  contactEmail: "support@company.com",
  privacyPolicyUrl: "https://company.com/privacy",
  legalInfoUrl: "https://company.com/terms"
})
@server("https://api.example.com", "API 名稱")
@useAuth([AuthType])  // 如果需要驗證
namespace APINamespace {
  // 操作定義於此
}
```

### 操作定義
```typescript
@route("/resource/{id}")
@get
@action
@card(#{
  dataPath: "$.items",
  title: "$.title",
  file: "cards/card.json"
})
@capabilities(#{
  confirmation: #{
    type: "AdaptiveCard",
    title: "確認操作",
    body: "確認執行，參數為 {{ function.parameters.param }}"
  }
})
@reasoning("當 Y 時考慮 X")
@responding("將結果呈現為 Z")
op getResource(
  @path id: string,
  @query filter?: string
): ResourceResponse;
```

### 模型
```typescript
model Resource {
  id: string;
  name: string;
  description?: string;  // 選填欄位
  status: "active" | "inactive";  // 列舉的聯集型別
  @format("date-time")
  createdAt: utcDateTime;
  @format("uri")
  url?: string;
}

model ResourceList {
  items: Resource[];
  totalCount: int32;
  nextPage?: string;
}
```

### 驗證

**API 金鑰**
```typescript
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "X-API-Key">)

// 或使用參考 ID
@useAuth(Auth)
@authReferenceId("${{ENV_VAR_REFERENCE_ID}}")
model Auth is ApiKeyAuth<ApiKeyLocation.header, "X-API-Key">;
```

**OAuth2**
```typescript
@useAuth(OAuth2Auth<[{
  type: OAuth2FlowType.authorizationCode;
  authorizationUrl: "https://auth.example.com/authorize";
  tokenUrl: "https://auth.example.com/token";
  refreshUrl: "https://auth.example.com/refresh";
  scopes: ["read", "write"];
}]>)

// 或使用參考 ID
@useAuth(Auth)
@authReferenceId("${{OAUTH_REFERENCE_ID}}")
model Auth is OAuth2Auth<[...]>;
```

## 命名慣例

### 檔案
- `main.tsp` - Agent 定義
- `actions.tsp` - API 操作
- `[feature].tsp` - 額外功能檔案
- `cards/*.json` - 調適型卡片模板

### TypeSpec 元素
- **命名空間 (Namespaces)**：PascalCase（例如：`CustomerSupportAgent`）
- **操作 (Operations)**：camelCase（例如：`listProjects`, `createTicket`）
- **模型 (Models)**：PascalCase（例如：`Project`, `TicketResponse`）
- **模型屬性 (Model Properties)**：camelCase（例如：`projectId`, `createdDate`）

## 常見模式

### 多能力 Agent
```typescript
@agent("知識工作者", "描述內容")
@instructions("...")
namespace KnowledgeWorker {
  op webSearch is AgentCapabilities.WebSearch;
  op files is AgentCapabilities.OneDriveAndSharePoint;
  op people is AgentCapabilities.People;
}
```

### CRUD API 外掛程式
```typescript
namespace ProjectAPI {
  @route("/projects") @get @action
  op list(): Project[];
  
  @route("/projects/{id}") @get @action
  op get(@path id: string): Project;
  
  @route("/projects") @post @action
  @capabilities(#{confirmation: ...})
  op create(@body project: CreateProject): Project;
  
  @route("/projects/{id}") @patch @action
  @capabilities(#{confirmation: ...})
  op update(@path id: string, @body project: UpdateProject): Project;
  
  @route("/projects/{id}") @delete @action
  @capabilities(#{confirmation: ...})
  op delete(@path id: string): void;
}
```

### 調適型卡片資料繫結
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
          "text": "標題：${if(title, title, '不適用')}",
          "wrap": true
        }
      ]
    }
  ]
}
```

## 驗證與測試

### 佈建前
1. 執行 TypeSpec 驗證：`npm run build` 或使用 Agents Toolkit
2. 檢查 `@card` 裝飾器中的所有檔案路徑是否存在
3. 驗證驗證參考是否與配置匹配
4. 確保能力限縮範圍適當
5. 審查指示的清晰度與長度

### 測試策略
1. **佈建 (Provision)**：部署至開發環境
2. **測試**：在 https://m365.cloud.microsoft/chat 使用 Microsoft 365 Copilot
3. **偵錯**：啟用 Copilot 開發者模式以取得編排器資訊
4. **反覆運算**：根據實際行為進行精煉
5. **驗證**：測試所有交談啟動器與能力

## 效能最佳化

1. **限縮能力範圍**：如果僅需部分資料，不要授予完整資料存取權
2. **限制操作**：僅公開 Agent 實際使用的 API 操作
3. **高效模型**：使回應模型專注於必要資料
4. **卡片優化**：在調適型卡片中使用條件渲染 (`$when`)
5. **快取**：設計具備適當快取標頭的 API

## 安全最佳實踐

1. **驗證**：對非公開 API 始終使用驗證
2. **限縮範圍**：將能力存取限制在所需的最小資源
3. **驗證**：在 API 操作中驗證所有輸入
4. **秘密**：對敏感資料使用環境變數
5. **參考**：對生產環境憑證使用 `@authReferenceId`
6. **權限**：要求最低限度的必要 OAuth 範圍

## 錯誤處理

```typescript
model ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
}

model ErrorDetail {
  field?: string;
  message: string;
}
```

## 文件化

在 TypeSpec 中為複雜操作包含註解：

```typescript
/**
 * 擷取專案詳細資訊以及關聯的任務和團隊成員。
 * 
 * @param id - 唯一的專案識別碼
 * @param includeArchived - 是否包含已封存的任務
 * @returns 完整的專案資訊
 */
@route("/projects/{id}")
@get
@action
op getProjectDetails(
  @path id: string,
  @query includeArchived?: boolean
): ProjectDetails;
```

## 應避免的常見錯誤

1. ❌ 通用的 Agent 名稱（例如 "Helper Bot"）
2. ❌ 模糊的指示（例如 "幫助使用者處理事情"）
3. ❌ 未限縮能力範圍（存取所有資料）
4. ❌ 破壞性操作缺少確認步驟
5. ❌ 過於複雜的調適型卡片
6. ❌ 在 TypeSpec 檔案中硬編碼憑證
7. ❌ 缺少錯誤回應模型
8. ❌ 命名慣例不一致
9. ❌ 過多能力（僅使用所需的能力）
10. ❌ 指示超過 8,000 字元

## 資源

- [TypeSpec 官方文件](https://typespec.io/)
- [Microsoft 365 Copilot 擴充性](https://learn.microsoft.com/microsoft-365-copilot/extensibility/)
- [Agents Toolkit](https://aka.ms/M365AgentsToolkit)
- [調適型卡片設計器 (Adaptive Cards Designer)](https://adaptivecards.io/designer/)
