# FlowStudio MCP — 觸發程序類型

適用於 Power Automate 流程定義的複製貼上觸發程序定義。

---

## 週期性 (Recurrence)

依排程執行。

```json
"Recurrence": {
  "type": "Recurrence",
  "recurrence": {
    "frequency": "Day",
    "interval": 1,
    "startTime": "2026-01-01T08:00:00Z",
    "timeZone": "AUS Eastern Standard Time"
  }
}
```

每週在特定日期執行：
```json
"Recurrence": {
  "type": "Recurrence",
  "recurrence": {
    "frequency": "Week",
    "interval": 1,
    "schedule": {
      "weekDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    },
    "startTime": "2026-01-05T09:00:00Z",
    "timeZone": "AUS Eastern Standard Time"
  }
}
```

常見的 `timeZone` 值：
- `"AUS Eastern Standard Time"` — 雪梨/墨爾本 (UTC+10/+11)
- `"UTC"` — 通用時間
- `"E. Australia Standard Time"` — 布里斯本 (UTC+10 無日光節約時間)
- `"New Zealand Standard Time"` — 奧克蘭 (UTC+12/+13)
- `"Pacific Standard Time"` — 洛杉磯 (UTC-8/-7)
- `"GMT Standard Time"` — 倫敦 (UTC+0/+1)

---

## 手動 (HTTP 要求 / Power Apps)

接收包含 JSON 本文的 HTTP POST。

```json
"manual": {
  "type": "Request",
  "kind": "Http",
  "inputs": {
    "schema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "value": { "type": "integer" }
      },
      "required": ["name"]
    }
  }
}
```

存取值：`@triggerBody()?['name']`  
儲存後可用的觸發程序 URL：`@listCallbackUrl()`

#### 無結構描述變體 (接受任意 JSON)

當傳入的承載結構未知或有所變化時，省略結構描述
即可接受任何有效的 JSON 本文而不進行驗證：

```json
"manual": {
  "type": "Request",
  "kind": "Http",
  "inputs": {
    "schema": {}
  }
}
```

動態存取任何欄位：`@triggerBody()?['anyField']`

> 將此用於外部 Webhook（Stripe、GitHub、Employment Hero 等），其中
> 承載外觀可能會變更或未完整記錄。流程接受任何
> JSON，而不會因為非預期的屬性傳回 400。

---

## 手動 (Copilot Studio Skills)

當流程預期由 Copilot Studio 代理工具呼叫時，
使用 Skills 觸發程序。保持觸發程序結構描述明確，讓代理能收到可預測的
輸入名稱與類型。

```json
"manual": {
  "type": "Request",
  "kind": "Skills",
  "inputs": {
    "schema": {
      "type": "object",
      "properties": {
        "itemId": { "type": "string" },
        "notes": { "type": "string" }
      },
      "required": ["itemId"]
    }
  },
  "metadata": {
    "operationMetadataId": "<stable-guid>"
  }
}
```

在部署生產環境的 Skills 觸發流程後，以目標
`solutionId` 呼叫 `add_live_flow_to_solution`；Copilot Studio 代理
工具探索預期該流程具有解決方案感知能力。若要從 MCP 進行測試，請以
`body` 中的輸入呼叫 `trigger_live_flow` — Skills 觸發程序會像
按鈕和 PowerApps 觸發程序一樣透過連接器執行階段執行。

---

## 自動化 (SharePoint 建立項目)

```json
"When_an_item_is_created": {
  "type": "OpenApiConnectionNotification",
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connectionName": "<connectionName>",
      "operationId": "OnNewItem"
    },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "table": "MyList"
    },
    "subscribe": {
      "body": { "notificationUrl": "@listCallbackUrl()" },
      "queries": {
        "dataset": "https://mytenant.sharepoint.com/sites/mysite",
        "table": "MyList"
      }
    }
  }
}
```

存取觸發程序資料：`@triggerBody()?['ID']`、`@triggerBody()?['Title']` 等。

---

## 自動化 (SharePoint 修改項目)

```json
"When_an_existing_item_is_modified": {
  "type": "OpenApiConnectionNotification",
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connectionName": "<connectionName>",
      "operationId": "OnUpdatedItem"
    },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "table": "MyList"
    },
    "subscribe": {
      "body": { "notificationUrl": "@listCallbackUrl()" },
      "queries": {
        "dataset": "https://mytenant.sharepoint.com/sites/mysite",
        "table": "MyList"
      }
    }
  }
}
```

---

## 自動化 (Outlook：收到新電子郵件時)

```json
"When_a_new_email_arrives": {
  "type": "OpenApiConnectionNotification",
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_office365",
      "connectionName": "<connectionName>",
      "operationId": "OnNewEmail"
    },
    "parameters": {
      "folderId": "Inbox",
      "to": "monitored@contoso.com",
      "isHTML": true
    },
    "subscribe": {
      "body": { "notificationUrl": "@listCallbackUrl()" }
    }
  }
}
```

---

## 子流程 (由另一個流程呼叫)

```json
"manual": {
  "type": "Request",
  "kind": "Button",
  "inputs": {
    "schema": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": { "type": "object" }
        }
      }
    }
  }
}
```

存取父流程提供的資料：`@triggerBody()?['items']`

若要將資料傳回父流程，請新增 `Response` 動作：
```json
"Respond_to_Parent": {
  "type": "Response",
  "runAfter": { "Compose_Result": ["Succeeded"] },
  "inputs": {
    "statusCode": 200,
    "body": "@outputs('Compose_Result')"
  }
}
```
