---
mode: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems']
description: '透過整合具有驗證、工具選取和組態的 MCP 伺服器，為 Microsoft 365 Copilot 建立宣告式代理程式'
model: 'gpt-4.1'
tags: [mcp, m365-copilot, declarative-agent, model-context-protocol, api-plugin]
---

# 為 Microsoft 365 Copilot 建立基於 MCP 的宣告式代理程式

建立一個完整的 Microsoft 365 Copilot 宣告式代理程式，整合模型內容協定 (MCP) 伺服器以存取外部系統和資料。

## 需求

使用 Microsoft 365 Agents Toolkit 產生以下專案結構：

### 專案設定
1. 透過 Agents Toolkit **建立宣告式代理程式架構**
2. **新增 MCP 動作**，指向 MCP 伺服器
3. **選取工具**，以便從 MCP 伺服器匯入
4. **設定驗證** (OAuth 2.0 或 SSO)
5. **檢閱產生的檔案** (manifest.json, ai-plugin.json, declarativeAgent.json)

### 產生的關鍵檔案

**appPackage/manifest.json** - 包含外掛程式參考的 Teams 應用程式資訊清單：
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/vDevPreview/MicrosoftTeams.schema.json",
  "manifestVersion": "devPreview",
  "version": "1.0.0",
  "id": "...",
  "developer": {
    "name": "...",
    "websiteUrl": "...",
    "privacyUrl": "...",
    "termsOfUseUrl": "..."
  },
  "name": {
    "short": "代理程式名稱",
    "full": "代理程式完整名稱"
  },
  "description": {
    "short": "簡短說明",
    "full": "完整說明"
  },
  "copilotAgents": {
    "declarativeAgents": [
      {
        "id": "declarativeAgent",
        "file": "declarativeAgent.json"
      }
    ]
  }
}
```

**appPackage/declarativeAgent.json** - 代理程式定義：
```json
{
  "$schema": "https://aka.ms/json-schemas/copilot/declarative-agent/v1.0/schema.json",
  "version": "v1.0",
  "name": "代理程式名稱",
  "description": "代理程式說明",
  "instructions": "您是一個協助處理 [特定領域] 的助手。使用可用工具來 [執行能力]。",
  "capabilities": [
    {
      "name": "WebSearch",
      "websites": [
        {
          "url": "https://learn.microsoft.com"
        }
      ]
    },
    {
      "name": "MCP",
      "file": "ai-plugin.json"
    }
  ]
}
```

**appPackage/ai-plugin.json** - MCP 外掛程式資訊清單：
```json
{
  "schema_version": "v2.1",
  "name_for_human": "服務名稱",
  "description_for_human": "使用者說明",
  "description_for_model": "AI 模型說明",
  "contact_email": "support@company.com",
  "namespace": "serviceName",
  "capabilities": {
    "conversation_starters": [
      {
        "text": "範例查詢 1"
      }
    ]
  },
  "functions": [
    {
      "name": "functionName",
      "description": "函式說明",
      "capabilities": {
        "response_semantics": {
          "data_path": "$",
          "properties": {
            "title": "$.title",
            "subtitle": "$.description"
          }
        }
      }
    }
  ],
  "runtimes": [
    {
      "type": "MCP",
      "spec": {
        "url": "https://api.service.com/mcp/"
      },
      "run_for_functions": ["functionName"],
      "auth": {
        "type": "OAuthPluginVault",
        "reference_id": "${{OAUTH_REFERENCE_ID}}"
      }
    }
  ]
}
```

**/.vscode/mcp.json** - MCP 伺服器組態：
```json
{
  "serverUrl": "https://api.service.com/mcp/",
  "pluginFilePath": "appPackage/ai-plugin.json"
}
```

## MCP 伺服器整合

### 支援的 MCP 端點
MCP 伺服器必須提供：
- **伺服器中繼資料 (Metadata)** 端點
- **工具清單** 端點 (公開可用函式)
- **工具執行** 端點 (處理函式呼叫)

### 工具選取
從 MCP 匯入時：
1. 從伺服器擷取可用工具
2. 選取要包含的特定工具 (考量安全性/簡潔性)
3. 工具定義會在 ai-plugin.json 中自動產生

### 驗證類型

**OAuth 2.0 (靜態註冊)**
```json
"auth": {
  "type": "OAuthPluginVault",
  "reference_id": "${{OAUTH_REFERENCE_ID}}",
  "authorization_url": "https://auth.service.com/authorize",
  "client_id": "${{CLIENT_ID}}",
  "client_secret": "${{CLIENT_SECRET}}",
  "scope": "read write"
}
```

**單一登入 (SSO)**
```json
"auth": {
  "type": "SSO"
}
```

## 回應語義 (Response Semantics)

### 定義資料對應
使用 `response_semantics` 從 API 回應中擷取相關欄位：

```json
"capabilities": {
  "response_semantics": {
    "data_path": "$.results",
    "properties": {
      "title": "$.name",
      "subtitle": "$.description",
      "url": "$.link"
    }
  }
}
```

### 新增調適型卡片 (選用)
請參閱 `mcp-create-adaptive-cards` 提示以新增視覺化卡片範本。

## 環境組態

建立 `.env.local` 或 `.env.dev` 以儲存認證：

```env
OAUTH_REFERENCE_ID=your-oauth-reference-id
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
```

## 測試與部署

### 本地測試
1. 在 Agents Toolkit 中 **佈建** 代理程式
2. **開始偵錯** 以側載到 Teams
3. 在 Microsoft 365 Copilot (https://m365.cloud.microsoft/chat) 進行測試
4. 出現提示時進行驗證
5. 使用自然語言查詢代理程式

### 驗證
- 檢查 ai-plugin.json 中的工具匯入
- 檢查驗證組態
- 測試每個公開的函式
- 驗證回應資料對應

## 最佳做法

### 工具設計
- **專注的函式**：每個工具應該做好一件事
- **清楚的說明**：協助模型了解何時使用每個工具
- **最小範圍**：僅匯入代理程式需要的工具
- **描述性名稱**：使用動作導向的函式名稱

### 安全性
- 在生產情境中 **使用 OAuth 2.0**
- 將 **秘密 (Secrets) 儲存** 在環境變數中
- 在 MCP 伺服器端 **驗證輸入**
- 將 **權限範圍限制** 為所需的最小權限
- 為 OAuth 註冊 **使用參考 ID (Reference ID)**

### 指令 (Instructions)
- **具體說明** 代理程式的目的和能力
- **定義行為**，包括成功和錯誤情境
- 在指令中明確 **參考工具** (如果適用)
- 為使用者 **設定預期**，說明代理程式可以和不可以做什麼

### 效能
- 在 MCP 伺服器上適時 **快取回應**
- 盡可能進行 **批次作業**
- 為長時間執行的作業 **設定逾時**
- 為大型資料集進行 **結果分頁**

## 常見 MCP 伺服器範例

### GitHub MCP 伺服器
```
URL: https://api.githubcopilot.com/mcp/
工具: search_repositories, search_users, get_repository
驗證: OAuth 2.0
```

### Jira MCP 伺服器
```
URL: https://your-domain.atlassian.net/mcp/
工具: search_issues, create_issue, update_issue
驗證: OAuth 2.0
```

### 自訂服務
```
URL: https://api.your-service.com/mcp/
工具: 您的服務公開的自訂工具
驗證: OAuth 2.0 或 SSO
```

## 工作流程

詢問使用者：
1. 您要整合哪個 MCP 伺服器 (URL)？
2. 應該向 Copilot 公開哪些工具？
3. 伺服器支援哪種驗證方法？
4. 代理程式的主要目的是什麼？
5. 您是否需要回應語義或調適型卡片？

然後產生：
- 完整的 appPackage/ 結構 (manifest.json, declarativeAgent.json, ai-plugin.json)
- mcp.json 組態
- .env.local 範本
- 佈建和測試說明

## 疑難排解

### MCP 伺服器無回應
- 驗證伺服器 URL 是否正確
- 檢查網路連線
- 驗證 MCP 伺服器是否實作了必要的端點

### 驗證失敗
- 驗證 OAuth 認證是否正確
- 檢查參考 ID 是否與註冊相符
- 確認權限範圍要求正確
- 獨立測試 OAuth 流程

### 工具未出現
- 確保 mcp.json 指向正確的伺服器
- 驗證匯入期間是否選取了工具
- 檢查 ai-plugin.json 是否有正確的函式定義
- 如果伺服器已變更，請從 MCP 重新擷取動作

### 代理程式不理解查詢
- 檢閱 declarativeAgent.json 中的指令
- 檢查函式說明是否清楚
- 驗證 response_semantics 是否擷取正確資料
- 使用更具體的查詢進行測試
