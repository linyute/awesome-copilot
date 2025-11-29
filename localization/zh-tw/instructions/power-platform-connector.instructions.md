---
title: Power Platform 連接器結構描述開發說明
description: 'Power Platform 自訂連接器使用 JSON 結構描述定義的綜合開發指南。涵蓋 API 定義 (Swagger 2.0)、API 屬性和使用 Microsoft 擴充功能的設定組態。'
applyTo: '**/*.{json,md}'
---

# Power Platform 連接器結構描述開發說明

## 專案概觀
此工作區包含 Power Platform 自訂連接器的 JSON 結構描述定義，特別是針對 `paconn` (Power Apps 連接器) 工具。這些結構描述驗證並提供以下項目的 IntelliSense：

- **API 定義** (Swagger 2.0 格式)
- **API 屬性** (連接器中繼資料和組態)
- **設定** (環境和部署組態)

## 檔案結構理解

### 1. apiDefinition.swagger.json
- **目的**：此檔案包含具有 Power Platform 擴充功能的 Swagger 2.0 API 定義。
- **主要功能**：
  - 標準 Swagger 2.0 屬性，包括資訊、路徑、定義等。
  - 以 `x-ms-*` 前綴開頭的 Microsoft 特定擴充功能。
  - 專為 Power Platform 設計的自訂格式類型，例如 `date-no-tz` 和 `html`。
  - 提供執行階段彈性的動態結構描述支援。
  - 支援 OAuth2、API 金鑰和基本驗證方法的安全性定義。

### 2. apiProperties.json
- **目的**：此檔案定義連接器中繼資料、驗證組態和原則組態。
- **主要元件**：
  - **連線參數**：這些支援各種驗證類型，包括 OAuth、API 金鑰和閘道組態。
  - **原則範本實例**：這些處理連接器的資料轉換和路由原則。
  - **連接器中繼資料**：這包括發行者資訊、功能和品牌元素。

### 3. settings.json
- **目的**：此檔案提供 paconn 工具的環境和部署組態設定。
- **組態選項**：
  - 針對特定 Power Platform 環境的環境 GUID 目標設定。
  - 連接器資產和組態檔案的檔案路徑對應。
  - 生產和測試環境 (PROD/TIP1) 的 API 端點 URL。
  - API 版本規格，以確保與 Power Platform 服務的相容性。

## 開發指南

### 使用 API 定義 (Swagger) 時
1. **始終根據 Swagger 2.0 規格進行驗證** - 結構描述強制執行嚴格的 Swagger 2.0 合規性

2. **操作的 Microsoft 擴充功能**：
   - `x-ms-summary`：使用此項提供使用者友善的顯示名稱，並確保使用標題大小寫格式。
   - `x-ms-visibility`：使用此項控制參數可見性，其值為 `important`、`advanced` 或 `internal`。
   - `x-ms-trigger`：使用此項將操作標記為觸發器，其值為 `batch` 或 `single`。
   - `x-ms-trigger-hint`：使用此項提供有用的提示文字，引導使用者使用觸發器。
   - `x-ms-trigger-metadata`：使用此項定義觸發器組態設定，包括種類和模式屬性。
   - `x-ms-notification`：使用此項組態 Webhook 操作以進行即時通知。
   - `x-ms-pageable`：使用此項透過指定 `nextLinkName` 屬性來啟用分頁功能。
   - `x-ms-safe-operation`：使用此項將沒有副作用的 POST 操作標記為安全。
   - `x-ms-no-generic-test`：使用此項停用特定操作的自動測試。
   - `x-ms-operation-context`：使用此項組態用於測試目的的操作模擬設定。

3. **參數的 Microsoft 擴充功能**：
   - `x-ms-dynamic-list`：使用此項啟用從 API 呼叫填充的動態下拉式清單。
   - `x-ms-dynamic-values`：使用此項組態填充參數選項的動態值來源。
   - `x-ms-dynamic-tree`：使用此項為巢狀資料結構建立階層式選取器。
   - `x-ms-dynamic-schema`：使用此項允許根據使用者選取進行執行階段結構描述變更。
   - `x-ms-dynamic-properties`：使用此項進行適應內容的動態屬性組態。
   - `x-ms-enum-values`：使用此項提供增強的列舉定義，並帶有顯示名稱以提供更好的使用者體驗。
   - `x-ms-test-value`：使用此項提供用於測試的範例值，但絕不包含機密或敏感資料。
   - `x-ms-trigger-value`：使用此項指定觸發器參數的特定值，並帶有 `value-collection` 和 `value-path` 屬性。
   - `x-ms-url-encoding`：使用此項指定 URL 編碼樣式為 `single` 或 `double` (預設為 `single`)。
   - `x-ms-parameter-location`：使用此項提供 API 的參數位置提示 (AutoRest 擴充功能 - Power Platform 忽略)。
   - `x-ms-localizeDefaultValue`：使用此項啟用預設參數值的本地化。
   - `x-ms-skip-url-encoding`：使用此項跳過路徑參數的 URL 編碼 (AutoRest 擴充功能 - Power Platform 忽略)。

4. **結構描述的 Microsoft 擴充功能**：
   - `x-ms-notification-url`：使用此項將結構描述屬性標記為 Webhook 組態的通知 URL。
   - `x-ms-media-kind`：使用此項指定內容的媒體類型，支援的值為 `image` 或 `audio`。
   - `x-ms-enum`：使用此項提供增強的列舉中繼資料 (AutoRest 擴充功能 - Power Platform 忽略)。
   - 請注意，上面列出的所有參數擴充功能也適用於結構描述屬性，並可在結構描述定義中使用。

5. **根層級擴充功能**：
   - `x-ms-capabilities`：使用此項定義連接器功能，例如檔案選擇器和 testConnection 功能。
   - `x-ms-connector-metadata`：使用此項提供超出標準屬性的額外連接器中繼資料。
   - `x-ms-docs`：使用此項組態連接器的文件設定和參考。
   - `x-ms-deployment-version`：使用此項追蹤部署管理的版本資訊。
   - `x-ms-api-annotation`：使用此項新增 API 層級註釋以增強功能。

6. **路徑層級擴充功能**：
   - `x-ms-notification-content`：使用此項定義 Webhook 路徑項目的通知內容結構描述。

7. **操作層級功能**：
   - `x-ms-capabilities` (在操作層級)：使用此項啟用操作特定功能，例如用於大型檔案傳輸的 `chunkTransfer`。

8. **安全性考量**：
   - 您應該為您的 API 定義適當的 `securityDefinitions` 以確保正確的驗證。
   - **允許多個安全性定義** - 您最多可以定義兩種驗證方法 (例如，oauth2 + apiKey，basic + apiKey)。
   - **例外**：如果使用「無」驗證，則同一連接器中不能存在其他安全性定義。
   - 您應該為現代 API 使用 `oauth2`，為簡單的權杖驗證使用 `apiKey`，並且只考慮用於內部/舊版系統的 `basic` 驗證。
   - 每個安全性定義必須恰好是一種類型 (此約束由 oneOf 驗證強制執行)。

9. **參數最佳實務**：
   - 您應該使用描述性 `description` 欄位來幫助使用者理解每個參數的目的。
   - 您應該實作 `x-ms-summary` 以提供更好的使用者體驗 (需要標題大小寫)。
   - 您必須正確標記必要的參數以確保正確的驗證。
   - 您應該使用適當的 `format` 值 (包括 Power Platform 擴充功能) 以啟用正確的資料處理。
   - 您應該利用動態擴充功能以提供更好的使用者體驗和資料驗證。

10. **Power Platform 格式擴充功能**：
    - `date-no-tz`：這表示沒有時區資訊的日期時間。
    - `html`：此格式告知用戶端在編輯時發出 HTML 編輯器，在檢視內容時發出 HTML 檢視器。
    - 標準格式包括：`int32`、`int64`、`float`、`double`、`byte`、`binary`、`date`、`date-time`、`password`、`email`、`uri`、`uuid`。

### 使用 API 屬性時
1. **連線參數**：
   - 您應該選擇適當的參數類型，例如 `string`、`securestring` 或 `oauthSetting`。
   - 您應該使用正確的身份提供者組態 OAuth 設定。
   - 適當時，您應該使用 `allowedValues` 作為下拉式選項。
   - 您應該在需要條件參數時實作參數相依性。

2. **原則範本**：
   - 您應該使用 `routerequesttoendpoint` 將後端路由到不同的 API 端點。
   - 您應該實作 `setqueryparameter` 以設定查詢參數的預設值。
   - 您應該使用 `updatenextlink` 進行分頁情境以正確處理分頁。
   - 您應該為需要輪詢行為的觸發器操作應用 `pollingtrigger`。

3. **品牌和中繼資料**：
   - 您必須始終指定 `iconBrandColor`，因為此屬性是所有連接器都需要的。
   - 您應該定義適當的 `capabilities` 以指定您的連接器是否支援動作或觸發器。
   - 您應該設定有意義的 `publisher` 和 `stackOwner` 值以識別連接器的所有權。

### 使用設定時
1. **環境組態**：
   - 您應該為 `environment` 使用符合驗證模式的正確 GUID 格式。
   - 您應該為目標環境設定正確的 `powerAppsUrl` 和 `flowUrl`。
   - 您應該將 API 版本與您的特定要求相符。

2. **檔案參考**：
   - 您應該保持與 `apiProperties.json` 和 `apiDefinition.swagger.json` 預設值一致的檔案命名。
   - 您應該為本機開發環境使用相對路徑。
   - 您應該確保圖示檔案存在並在您的組態中正確參考。

## 結構描述驗證規則

### 必要屬性
- **API 定義**：`swagger: "2.0"`、`info` (帶有 `title` 和 `version`)、`paths`
- **API 屬性**：`properties` 帶有 `iconBrandColor`
- **設定**：沒有必要屬性 (所有都是可選的，帶有預設值)

### 模式驗證
- **廠商擴充功能**：非 Microsoft 擴充功能必須符合 `^x-(?!ms-)` 模式
- **路徑項目**：API 路徑必須以 `/` 開頭
- **環境 GUID**：必須符合 UUID 格式模式 `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`
- **URL**：端點組態必須是有效的 URI
- **主機模式**：必須符合 `^[^{}/ :\\]+(?::\d+)?$` (無空格、協定或路徑)

### 類型約束
- **安全性定義**：
  - `securityDefinitions` 物件中最多允許兩個安全性定義
  - 每個單獨的安全性定義必須恰好是一種類型 (oneOf 驗證：`basic`、`apiKey`、`oauth2`)
  - **例外**：「無」驗證不能與其他安全性定義共存
- **參數類型**：限於特定的列舉值 (`string`、`number`、`integer`、`boolean`、`array`、`file`)
- **原則範本**：類型特定的參數要求
- **格式值**：擴展集，包括 Power Platform 格式
- **可見性值**：必須是 `important`、`advanced` 或 `internal` 之一
- **觸發器類型**：必須是 `batch` 或 `single`

### 其他驗證規則
- **$ref 參考**：應僅指向 `#/definitions/`、`#/parameters/` 或 `#/responses/`
- **路徑參數**：必須標記為 `required: true`
- **資訊物件**：描述應與標題不同
- **聯絡人物件**：電子郵件必須是有效的電子郵件格式，URL 必須是有效的 URI
- **授權物件**：名稱是必要的，如果提供，URL 必須是有效的 URI
- **外部文件**：URL 是必要的，並且必須是有效的 URI
- **標籤**：陣列中必須具有唯一的名稱
- **方案**：必須是有效的 HTTP 方案 (`http`、`https`、`ws`、`wss`)
- **MIME 類型**：必須遵循 `consumes` 和 `produces` 中的有效 MIME 類型格式

## 常見模式和範例

### API 定義範例

#### 帶有 Microsoft 擴充功能的基本操作
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

#### 觸發器操作組態
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

#### 動態結構描述範例
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

#### 檔案選擇器功能
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

#### 測試連線功能 (注意：自訂連接器不支援)
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

#### 用於模擬的操作內容
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

### 基本 OAuth 組態
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

#### 多個安全性定義範例
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

**注意**：最多兩個安全性定義可以共存，但「無」驗證不能與其他方法結合。

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

### 用於路由的原則範本
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

## 最佳實務

1. **使用 IntelliSense**：這些結構描述提供豐富的自動完成和驗證功能，有助於開發。
2. **遵循命名慣例**：為操作和參數使用描述性名稱，以提高程式碼可讀性。
3. **實作錯誤處理**：定義適當的回應結構描述和錯誤程式碼，以正確處理失敗情境。
4. **徹底測試**：在部署前驗證結構描述，以在開發過程早期發現問題。
5. **文件擴充功能**：註解 Microsoft 特定擴充功能，以供團隊理解和未來維護。
6. **版本管理**：在 API 資訊中使用語義版本控制來追蹤變更和相容性。
7. **安全性優先**：始終實作適當的驗證機制來保護您的 API 端點。

## 疑難排解

### 常見結構描述違規
- **缺少必要屬性**：`swagger: "2.0"`、`info.title`、`info.version`、`paths`
- **無效模式格式**：
  - GUID 必須符合確切格式 `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`
  - URL 必須是具有正確方案的有效 URI
  - 路徑必須以 `/` 開頭
  - 主機不得包含協定、路徑或空格
- **不正確的廠商擴充功能命名**：Microsoft 擴充功能使用 `x-ms-*`，其他使用 `^x-(?!ms-)`
- **不匹配的安全性定義類型**：每個安全性定義必須恰好是一種類型
- **無效的列舉值**：檢查 `x-ms-visibility`、`x-ms-trigger`、參數類型的允許值
- **$ref 指向無效位置**：必須指向 `#/definitions/`、`#/parameters/` 或 `#/responses/`
- **路徑參數未標記為必要**：所有路徑參數都必須具有 `required: true`
- **錯誤內容中的「file」類型**：僅允許在 `formData` 參數中，不允許在結構描述中

### API 定義特定問題
- **動態結構描述衝突**：不能將 `x-ms-dynamic-schema` 與固定結構描述屬性一起使用
- **觸發器組態錯誤**：`x-ms-trigger-metadata` 需要 `kind` 和 `mode`
- **分頁設定**：`x-ms-pageable` 需要 `nextLinkName` 屬性
- **檔案選擇器組態錯誤**：必須包含 `open` 操作和必要屬性
- **功能衝突**：某些功能可能與某些參數類型衝突
- **測試值安全性**：絕不將機密或 PII 包含在 `x-ms-test-value` 中
- **操作內容設定**：`x-ms-operation-context` 需要一個帶有 `operationId` 的 `simulate` 物件
- **通知內容結構描述**：路徑層級 `x-ms-notification-content` 必須定義適當的結構描述結構
- **媒體種類限制**：`x-ms-media-kind` 僅支援 `image` 或 `audio` 值
- **觸發器值組態**：`x-ms-trigger-value` 必須至少有一個屬性 (`value-collection` 或 `value-path`)

### 驗證工具
- 使用 JSON 結構描述驗證器檢查您的結構描述定義是否符合規範。
- 利用 VS Code 的內建結構描述驗證在開發期間發現錯誤。
- 在部署前使用 paconn CLI 進行測試：`paconn validate --api-def apiDefinition.swagger.json`
- 根據 Power Platform 連接器要求進行驗證，以確保相容性。
- 使用 Power Platform 連接器入口網站進行目標環境中的驗證和測試。
- 檢查操作回應是否與預期結構描述相符，以防止執行階段錯誤。

請記住：這些結構描述可確保您的 Power Platform 連接器格式正確，並在 Power Platform 生態系統中正常運作。
