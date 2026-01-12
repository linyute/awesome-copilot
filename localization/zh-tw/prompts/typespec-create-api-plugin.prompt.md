---
mode: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems']
description: '產生包含 REST 作業、驗證和調適型卡片的 Microsoft 365 Copilot TypeSpec API 外掛程式'
model: 'gpt-4.1'
tags: [typespec, m365-copilot, api-plugin, rest-api]
---

# 建立 TypeSpec API 外掛程式

建立一個完整的 Microsoft 365 Copilot TypeSpec API 外掛程式，以便與外部 REST API 整合。

## 需求

產生包含以下內容的 TypeSpec 檔案：

### main.tsp - 代理程式定義
```typescript
import "@typespec/http";
import "@typespec/openapi3";
import "@microsoft/typespec-m365-copilot";
import "./actions.tsp";

using TypeSpec.Http;
using TypeSpec.M365.Copilot.Agents;
using TypeSpec.M365.Copilot.Actions;

@agent({
  name: "[代理程式名稱]",
  description: "[說明]"
})
@instructions("""
  [使用 API 作業的指令]
""")
namespace [AgentName] {
  // 參考 actions.tsp 中的作業
  op operation1 is [APINamespace].operationName;
}
```

### actions.tsp - API 作業
```typescript
import "@typespec/http";
import "@microsoft/typespec-m365-copilot";

using TypeSpec.Http;
using TypeSpec.M365.Copilot.Actions;

@service
@actions(#{
    nameForHuman: "[API 顯示名稱]",
    descriptionForModel: "[模型說明]",
    descriptionForHuman: "[使用者說明]"
})
@server("[API_BASE_URL]", "[API 名稱]")
@useAuth([AuthType]) // 選用
namespace [APINamespace] {
  
  @route("[/path]")
  @get
  @action
  op operationName(
    @path param1: string,
    @query param2?: string
  ): ResponseModel;

  model ResponseModel {
    // 回應結構
  }
}
```

## 驗證選項

根據 API 需求選擇：

1. **無驗證** (公開 API)
   ```typescript
   // 不需要 @useAuth 裝飾器
   ```

2. **API 金鑰**
   ```typescript
   @useAuth(ApiKeyAuth<ApiKeyLocation.header, "X-API-Key">)
   ```

3. **OAuth2**
   ```typescript
   @useAuth(OAuth2Auth<[{
     type: OAuth2FlowType.authorizationCode;
     authorizationUrl: "https://oauth.example.com/authorize";
     tokenUrl: "https://oauth.example.com/token";
     refreshUrl: "https://oauth.example.com/token";
     scopes: ["read", "write"];
   }]>)
   ```

4. **註冊的驗證參考 (Registered Auth Reference)**
   ```typescript
   @useAuth(Auth)
   
   @authReferenceId("registration-id-here")
   model Auth is ApiKeyAuth<ApiKeyLocation.header, "X-API-Key">
   ```

## 函式能力

### 確認對話方塊
```typescript
@capabilities(#{
  confirmation: #{
    type: "AdaptiveCard",
    title: "確認動作",
    body: """
    您確定要執行此動作嗎？
      * **參數**: {{ function.parameters.paramName }}
    """
  }
})
```

### 調適型卡片回應
```typescript
@card(#{
  dataPath: "$.items",
  title: "$.title",
  url: "$.link",
  file: "cards/card.json"
})
```

### 推理與回應指令
```typescript
@reasoning("""
  呼叫此作業時請考慮使用者的情境。
  優先處理最近的項目而非舊項目。
""")
@responding("""
  以清楚的表格格式呈現結果，欄位包含：ID、標題、狀態。
  最後包含總計計數。
""")
```

## 最佳做法

1. **作業名稱**：使用清楚、動作導向的名稱 (listProjects, createTicket)
2. **模型**：為要求和回應定義類似 TypeScript 的模型
3. **HTTP 方法**：使用適當的動詞 (@get, @post, @patch, @delete)
4. **路徑**：使用 @route 遵循 RESTful 路徑慣例
5. **參數**：適當使用 @path, @query, @header, @body
6. **說明**：為模型理解提供清楚的說明
7. **確認**：為破壞性作業 (刪除、更新關鍵資料) 新增確認
8. **卡片**：針對具有多個資料項目的豐富視覺化回應使用卡片

## 工作流程

詢問使用者：
1. API 基底 URL 和目的是什麼？
2. 需要哪些作業 (CRUD 作業)？
3. API 使用哪種驗證方法？
4. 是否有任何作業需要確認？
5. 回應是否需要調適型卡片？

然後產生：
- 包含代理程式定義的完整 `main.tsp`
- 包含 API 作業與模型的完整 `actions.tsp`
- 選用的 `cards/card.json` (如果需要調適型卡片)
