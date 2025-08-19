---
title: Power Platform 連接器 Schema 開發指引
description: 'Power Platform 自訂連接器 JSON Schema 開發完整指南，涵蓋 API 定義（Swagger 2.0）、API 屬性與設定檔，並說明 Microsoft 擴充設定。'
applyTo: '**/*.{json,md}'
---

# Power Platform 連接器 Schema 開發指引

## 專案概述
本工作區包含 Power Platform 自訂連接器的 JSON Schema 定義，特別針對 `paconn`（Power Apps Connector）工具。這些 schema 用於驗證並提供 IntelliSense，涵蓋：

- **API 定義**（Swagger 2.0 格式）
- **API 屬性**（連接器 metadata 與設定）
- **設定檔**（環境與部署設定）

## 檔案結構說明

### 1. apiDefinition.swagger.json
- **用途：** 此檔案包含 Swagger 2.0 API 定義，並含 Power Platform 擴充。
- **重點特色：**
  - 標準 Swagger 2.0 屬性（info、paths、definitions 等）
  - Microsoft 專屬擴充（`x-ms-*` 前綴）
  - Power Platform 專用格式（如 `date-no-tz`、`html`）
  - 支援動態 schema，提升執行時彈性
  - 支援 OAuth2、API Key、Basic Auth 等安全性定義

### 2. apiProperties.json
- **用途：** 定義連接器 metadata、認證設定與政策設定。
- **重點組件：**
  - **連線參數：** 支援多種認證（OAuth、API Key、Gateway）
  - **政策範本實例：** 處理資料轉換與路由政策
  - **連接器 metadata：** 包含發行者、功能、品牌等資訊

### 3. settings.json
- **用途：** 提供 paconn 工具的環境與部署設定。
- **設定選項：**
  - 目標環境 GUID
  - 連接器資產與設定檔路徑
  - API 端點 URL（生產/測試）
  - API 版本規格，確保與 Power Platform 相容

## 開發指引

### API 定義（Swagger）
1. **務必遵循 Swagger 2.0 規範** - schema 嚴格檢查規範

2. **Microsoft 操作擴充：**
   - `x-ms-summary`：用於顯示友善名稱，需採用標題格式
   - `x-ms-visibility`：控制參數顯示（`important`、`advanced`、`internal`）
   - `x-ms-trigger`：標記操作為觸發器（`batch` 或 `single`）
   - `x-ms-trigger-hint`：提供觸發器提示文字
   - `x-ms-trigger-metadata`：定義觸發器設定（kind、mode）
   - `x-ms-notification`：設定 webhook 操作即時通知
   - `x-ms-pageable`：指定 `nextLinkName` 啟用分頁
   - `x-ms-safe-operation`：POST 操作無副作用時標記安全
   - `x-ms-no-generic-test`：停用自動測試
   - `x-ms-operation-context`：設定操作模擬測試

3. **Microsoft 參數擴充：**
   - `x-ms-dynamic-list`：啟用 API 呼叫動態下拉選單
   - `x-ms-dynamic-values`：設定動態值來源
   - `x-ms-dynamic-tree`：建立階層式選擇器
   - `x-ms-dynamic-schema`：根據選擇動態變更 schema
   - `x-ms-dynamic-properties`：依情境動態設定屬性
   - `x-ms-enum-values`：加強 enum 定義並顯示友善名稱
   - `x-ms-test-value`：提供測試範例值，勿含機密
   - `x-ms-trigger-value`：指定觸發器參數值（`value-collection`、`value-path`）
   - `x-ms-url-encoding`：指定 URL 編碼方式（`single` 或 `double`，預設 `single`）
   - `x-ms-parameter-location`：API 參數位置提示（AutoRest 擴充，Power Platform 忽略）
   - `x-ms-localizeDefaultValue`：啟用預設值在地化
   - `x-ms-skip-url-encoding`：跳過路徑參數 URL 編碼（AutoRest 擴充，Power Platform 忽略）

4. **Microsoft Schema 擴充：**
   - `x-ms-notification-url`：標記 schema 屬性為 webhook 通知 URL
   - `x-ms-media-kind`：指定內容媒體型態（`image` 或 `audio`）
   - `x-ms-enum`：加強 enum metadata（AutoRest 擴充，Power Platform 忽略）
   - 以上參數擴充也可用於 schema 屬性

5. **根層級擴充：**
   - `x-ms-capabilities`：定義連接器功能（如檔案選取、testConnection）
   - `x-ms-connector-metadata`：補充連接器 metadata
   - `x-ms-docs`：設定文件與參考
   - `x-ms-deployment-version`：追蹤部署版本
   - `x-ms-api-annotation`：API 層級註記

6. **路徑層級擴充：**
   - `x-ms-notification-content`：定義 webhook 路徑通知內容 schema

7. **操作層級功能：**
   - `x-ms-capabilities`（操作層級）：啟用如 `chunkTransfer` 等功能

8. **安全性考量：**
   - API 需定義適當 `securityDefinitions`，確保認證
   - **最多可定義兩種認證方式**（如 oauth2 + apiKey, basic + apiKey）
   - **例外：** 若用「None」認證，不能有其他安全性定義
   - 建議現代 API 用 `oauth2`，簡單 token 用 `apiKey`，`basic` 僅限內部/舊系統
   - 每個安全性定義僅能有一種型態（oneOf 驗證）

9. **參數最佳實踐：**
   - 參數 `description` 需具描述性，便於理解
   - 實作 `x-ms-summary` 提升使用體驗（需標題格式）
   - 必要參數務必標記 `required`
   - 適當使用 `format`（含 Power Platform 擴充）
   - 善用動態擴充提升體驗與驗證

10. **Power Platform 格式擴充：**
   - `date-no-tz`：無時區資訊的日期時間
   - `html`：編輯時顯示 HTML 編輯器，檢視時顯示 HTML 檢視器
   - 標準格式：`int32`、`int64`、`float`、`double`、`byte`、`binary`、`date`、`date-time`、`password`、`email`、`uri`、`uuid`

### API 屬性
1. **連線參數：**
   - 適當選用 `string`、`securestring`、`oauthSetting` 等型別
   - OAuth 設定需正確指定身分提供者
   - 下拉選單用 `allowedValues`
   - 參數依賴可用於條件式參數

2. **政策範本：**
   - 後端路由用 `routerequesttoendpoint`
   - 查詢參數預設值用 `setqueryparameter`
   - 分頁用 `updatenextlink` 處理分頁
   - 觸發器需輪詢行為用 `pollingtrigger`

3. **品牌與 metadata：**
   - 必須指定 `iconBrandColor`（所有連接器必備）
   - 適當定義 `capabilities`（支援動作或觸發器）
   - `publisher` 與 `stackOwner` 需具意義，明確標示連接器歸屬

### 設定檔
1. **環境設定：**
   - `environment` 需用正確 GUID 格式
   - `powerAppsUrl`、`flowUrl` 需正確指向目標環境
   - API 版本需符合需求

2. **檔案參照：**
   - 檔名需與預設一致（`apiProperties.json`、`apiDefinition.swagger.json`）
   - 本地開發用相對路徑
   - icon 檔案需存在且正確參照

## Schema 驗證規則

### 必要屬性
- **API 定義：** `swagger: "2.0"`、`info`（含 `title`、`version`）、`paths`
- **API 屬性：** `properties` 且含 `iconBrandColor`
- **設定檔：** 無必要屬性（皆為選填，預設值）

### 格式驗證
- **Vendor 擴充：** 非 Microsoft 擴充需符合 `^x-(?!ms-)` 格式
- **路徑項目：** API 路徑需以 `/` 開頭
- **環境 GUID：** 需符合 UUID 格式 `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`
- **URL：** 端點設定需為合法 URI
- **Host 格式：** 需符合 `^[^{}/ :\\]+(?::\d+)?$`（不可含空格、協定或路徑）

### 型別限制
- **安全性定義：**
  - `securityDefinitions` 最多兩種
  - 每個安全性定義僅能有一種型別（oneOf 驗證：`basic`、`apiKey`、`oauth2`）
  - **例外：** 「None」認證不可與其他安全性定義共存
- **參數型別：** 僅限特定 enum（`string`、`number`、`integer`、`boolean`、`array`、`file`）
- **政策範本：** 依型別有特定參數需求
- **格式值：** 包含 Power Platform 擴充
- **顯示值：** 僅限 `important`、`advanced`、`internal`
- **觸發器型別：** 僅限 `batch` 或 `single`

### 其他驗證規則
- **$ref 參照：** 僅能指向 `#/definitions/`、`#/parameters/`、`#/responses/`
- **路徑參數：** 必須標記 `required: true`
- **Info 物件：** description 不可與 title 相同
- **Contact 物件：** email 需為合法 email，URL 需為合法 URI
- **License 物件：** name 必填，URL 若有需為合法 URI
- **External Docs：** URL 必填且需為合法 URI
- **Tags：** 陣列內名稱需唯一
- **Schemes：** 僅限合法 HTTP 協定（`http`、`https`、`ws`、`wss`）
- **MIME 型別：** `consumes`、`produces` 需為合法 MIME 格式

## 常見模式與範例

### API 定義範例

#### 基本操作含 Microsoft 擴充
```json
{
  "get": {
    "operationId": "GetItems",
    "summary": "Get items",
    "x-ms-summary": "Get Items",
    "x-ms-visibility": "important",
    "description": "Retrieves a list of items from the API",
    "parameters": [
      {
        "name": "category",
        "in": "query",
        "type": "string",
        "x-ms-summary": "Category",
        "x-ms-visibility": "important",
        "x-ms-dynamic-values": {
          "operationId": "GetCategories",
          "value-path": "id",
          "value-title": "name"
        }
      }
    ],
    "responses": {
      "200": {
        "description": "Success",
        "x-ms-summary": "Success",
        "schema": {
          "type": "object",
          "properties": {
            "items": {
              "type": "array",
              "x-ms-summary": "Items",
              "items": {
                "$ref": "#/definitions/Item"
              }
            }
          }
        }
      }
    }
  }
}
```

#### 觸發器操作設定
```json
{
  "get": {
    "operationId": "WhenItemCreated",
    "x-ms-summary": "When an Item is Created",
    "x-ms-trigger": "batch",
    "x-ms-trigger-hint": "To see it work now, create an item",
    "x-ms-trigger-metadata": {
      "kind": "query",
      "mode": "polling"
    },
    "x-ms-pageable": {
      "nextLinkName": "@odata.nextLink"
    }
  }
}
```

#### 動態 schema 範例
```json
{
  "name": "dynamicSchema",
  "in": "body",
  "schema": {
    "x-ms-dynamic-schema": {
      "operationId": "GetSchema",
      "parameters": {
        "table": {
          "parameter": "table"
        }
      },
      "value-path": "schema"
    }
  }
}
```

#### 檔案選取器功能
```json
{
  "x-ms-capabilities": {
    "file-picker": {
      "open": {
        "operationId": "OneDriveFilePickerOpen",
        "parameters": {
          "dataset": {
            "value-property": "dataset"
          }
        }
      },
      "browse": {
        "operationId": "OneDriveFilePickerBrowse",
        "parameters": {
          "dataset": {
            "value-property": "dataset"
          }
        }
      },
      "value-title": "DisplayName",
      "value-collection": "value",
      "value-folder-property": "IsFolder",
      "value-media-property": "MediaType"
    }
  }
}
```

#### 測試連線功能（注意：自訂連接器不支援）
```json
{
  "x-ms-capabilities": {
    "testConnection": {
      "operationId": "TestConnection",
      "parameters": {
        "param1": "literal-value"
      }
    }
  }
}
```

#### 操作模擬設定
```json
{
  "x-ms-operation-context": {
    "simulate": {
      "operationId": "SimulateOperation",
      "parameters": {
        "param1": {
          "parameter": "inputParam"
        }
      }
    }
  }
}
```

### 基本 OAuth 設定
```json
{
  "type": "oauthSetting",
  "oAuthSettings": {
    "identityProvider": "oauth2",
    "clientId": "your-client-id",
    "scopes": ["scope1", "scope2"],
    "redirectMode": "Global"
  }
}
```

#### 多重安全性定義範例
```json
{
  "securityDefinitions": {
    "oauth2": {
      "type": "oauth2",
      "flow": "accessCode",
      "authorizationUrl": "https://api.example.com/oauth/authorize",
      "tokenUrl": "https://api.example.com/oauth/token",
      "scopes": {
        "read": "Read access",
        "write": "Write access"
      }
    },
    "apiKey": {
      "type": "apiKey",
      "name": "X-API-Key",
      "in": "header"
    }
  }
}
```

**注意：** 最多僅能有兩種安全性定義，「None」認證不可與其他方式共存。

### 動態參數設定
```json
{
  "x-ms-dynamic-values": {
    "operationId": "GetItems",
    "value-path": "id",
    "value-title": "name"
  }
}
```

### 路由政策範本
```json
{
  "templateId": "routerequesttoendpoint",
  "title": "Route to backend",
  "parameters": {
    "x-ms-apimTemplate-operationName": ["GetData"],
    "x-ms-apimTemplateParameter.newPath": "/api/v2/data"
  }
}
```

## 最佳實踐

1. **善用 IntelliSense：** schema 提供自動完成與驗證，提升開發效率。
2. **遵循命名慣例：** 操作與參數名稱具描述性，提升可讀性。
3. **實作錯誤處理：** 定義適當回應 schema 與錯誤碼，妥善處理失敗情境。
4. **徹底測試：** 部署前驗證 schema，及早發現問題。
5. **註解擴充設定：** Microsoft 專屬擴充需加註解，便於團隊理解與維護。
6. **版本管理：** API info 用語意化版本追蹤變更與相容性。
7. **安全優先：** API 端點務必實作適當認證機制。

## 疑難排解

### 常見 Schema 違規
- **缺少必要屬性：** `swagger: "2.0"`、`info.title`、`info.version`、`paths`
- **格式錯誤：**
  - GUID 需完全符合 `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`
  - URL 需為合法 URI 且含正確協定
  - 路徑需以 `/` 開頭
  - Host 不可含協定、路徑或空格
- **Vendor 擴充命名錯誤：** Microsoft 用 `x-ms-*`，其他用 `^x-(?!ms-)`
- **安全性定義型別不符：** 每個安全性定義僅能有一種型別
- **enum 值錯誤：** 檢查 `x-ms-visibility`、`x-ms-trigger`、參數型別
- **$ref 指向錯誤位置：** 只能指向 `#/definitions/`、`#/parameters/`、`#/responses/`
- **路徑參數未標記 required：** 所有路徑參數必須 `required: true`
- **file 型別用錯位置：** 僅能用於 formData 參數，schema 不可用

### API 定義常見問題
- **動態 schema 衝突：** `x-ms-dynamic-schema` 不可與固定 schema 屬性並用
- **觸發器設定錯誤：** `x-ms-trigger-metadata` 需同時有 kind 與 mode
- **分頁設定：** `x-ms-pageable` 需有 `nextLinkName`
- **檔案選取器設定錯誤：** 必須同時有 open 操作與必要屬性
- **功能衝突：** 某些功能可能與參數型別衝突
- **測試值安全：** `x-ms-test-value` 不可含機密或個資
- **操作模擬設定：** `x-ms-operation-context` 需有 simulate 物件與 operationId
- **通知內容 schema：** 路徑層級 `x-ms-notification-content` 需正確定義 schema
- **媒體型別限制：** `x-ms-media-kind` 僅支援 `image` 或 `audio`
- **觸發器值設定：** `x-ms-trigger-value` 至少需有一個屬性（`value-collection` 或 `value-path`）

### 驗證工具
- 用 JSON Schema 驗證工具檢查 schema 合規性
- 善用 VS Code 內建 schema 驗證
- 部署前用 paconn CLI 測試：`paconn validate --api-def apiDefinition.swagger.json`
- 驗證 Power Platform 連接器需求，確保相容
- 用 Power Platform Connector portal 驗證與測試
- 檢查操作回應是否符合預期 schema，避免執行時錯誤

請記住：這些 schema 可確保你的 Power Platform 連接器格式正確，並能在 Power Platform 生態系統中正常運作。
