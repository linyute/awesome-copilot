# FlowStudio MCP — 觸發器類型

供 Power Automate 流程定義使用的觸發器定義複製貼上範本。

---

## 定期執行 (Recurrence)

按排程執行。

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

每週在特定幾天執行：
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
- `"UTC"` — 通用協調時間
- `"E. Australia Standard Time"` — 布里斯本 (UTC+10 無日光節約時間)
- `"New Zealand Standard Time"` — 奧克蘭 (UTC+12/+13)
- `"Pacific Standard Time"` — 洛杉磯 (UTC-8/-7)
- `"GMT Standard Time"` — 倫敦 (UTC+0/+1)

---

## 手動 (Manual) (HTTP 要求 / Power Apps)

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
儲存後可取得觸發 URL：`@listCallbackUrl()`

#### 無結構描述變體 (接受任意 JSON)

當傳入的承載資料結構未知或各異時，省略結構描述即可接受任何有效的 JSON 本文，而不進行驗證：

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

> 用於外部 Webhook（Stripe, GitHub, Employment Hero 等），其承載資料形狀可能會變更或未完全記錄。流程會接受任何 JSON，而不會對未預期的屬性傳回 400 錯誤。

---

## 手動 (Manual) (Copilot Studio 技能)

當流程旨在供 Copilot Studio 代理程式工具呼叫時，請使用技能觸發器。保持觸發器結構描述明確，以便代理程式接收可預測的輸入名稱和類型。

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

部署生產環境的技能觸發流程後，使用目標 `solutionId` 呼叫 `add_live_flow_to_solution`；Copilot Studio 代理程式工具發現程序預期流程必須具備方案感知能力。對於 MCP 驅動的測試，請使用具有相同動作和承載資料形狀的臨時 HTTP 孿生流程，在驗證動作後再恢復技能觸發器。

---

## 自動化 (Automated) (建立 SharePoint 項目時)

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

存取觸發資料：`@triggerBody()?['ID']`, `@triggerBody()?['Title']` 等。

---

## 自動化 (Automated) (修改現有 SharePoint 項目時)

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

## 自動化 (Automated) (Outlook：新郵件抵達時)

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

要將資料傳回給父流程，請新增「回應」動作：
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
