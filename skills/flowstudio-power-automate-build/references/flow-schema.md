# FlowStudio MCP — 流程定義 Schema

`update_live_flow` 所預期的完整 JSON 結構 (並由 `get_live_flow` 傳回)。

---

## 頂層結構 (Top-Level Shape)

```json
{
  "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "$connections": {
      "defaultValue": {},
      "type": "Object"
    }
  },
  "triggers": {
    "<觸發程序名稱>": { ... }
  },
  "actions": {
    "<動作名稱>": { ... }
  },
  "outputs": {}
}
```

---

## `triggers` (觸發程序)

每個流程定義中恰好有一個觸發程序。鍵名 (Key name) 是任意的，但通常使用慣用名稱 (例如 `Recurrence`、`manual`、`When_a_new_email_arrives`)。

有關所有觸發程序範本，請參閱 [trigger-types.md](trigger-types.md)。

---

## `actions` (動作)

以唯一動作名稱為鍵的動作定義字典。
鍵名不可包含空格 — 請使用底線。

每個動作必須包含：
- `type` — 動作類型識別碼
- `runAfter` — 上游動作名稱 → 狀態條件陣列的對應表
- `inputs` — 動作特定的輸入組態

有關範本，請參閱 [action-patterns-core.md](action-patterns-core.md)、[action-patterns-data.md](action-patterns-data.md)
及 [action-patterns-connectors.md](action-patterns-connectors.md)。

### 選用的動作屬性

除了必要的 `type`、`runAfter` 及 `inputs` 之外，動作還可以包含：

| 屬性 | 用途 |
|---|---|
| `runtimeConfiguration` | 分頁、並行、安全資料、分塊傳輸 |
| `operationOptions` | Foreach 使用 `"Sequential"`，HTTP 使用 `"DisableAsyncPattern"` |
| `limit` | 逾時覆寫 (例如 `{"timeout": "PT2H"}`) |

#### `runtimeConfiguration` 變體

**分頁 (Pagination)** (處理大型清單的 SharePoint 取得項目)：
```json
"runtimeConfiguration": {
  "paginationPolicy": {
    "minimumItemCount": 5000
  }
}
```
> 若無此設定，「取得項目」會無聲地將結果限制在 256 個。請將 `minimumItemCount` 設定為您預期的最大資料列數。對於任何超過 256 個項目的 SharePoint 清單，此設定皆為必要。

**並行 (Concurrency)** (平行 Foreach)：
```json
"runtimeConfiguration": {
  "concurrency": {
    "repetitions": 20
  }
}
```

**安全輸入/輸出 (Secure data)** (在執行歷程記錄中遮蔽數值)：
```json
"runtimeConfiguration": {
  "secureData": {
    "properties": ["inputs", "outputs"]
  }
}
```
> 用於處理認證、權杖或個人識別資訊 (PII) 的動作。遮蔽後的數值在流程執行歷程記錄 UI 及 API 回應中會顯示為 `"<redacted>"`。

**分塊傳輸 (Chunked transfer)** (大型 HTTP 裝載)：
```json
"runtimeConfiguration": {
  "contentTransfer": {
    "transferMode": "Chunked"
  }
}
```
> 對於傳送或接收超過 100 KB 本文的 HTTP 動作 (例如包含大型陣列的父流程對子流程呼叫) 啟用此功能。

---

## `runAfter` 規則

分支中的第一個動作具有 `"runAfter": {}` (空物件 — 在觸發程序之後執行)。

後續動作宣告其相依性：

```json
"My_Action": {
  "runAfter": {
    "Previous_Action": ["Succeeded"]
  }
}
```

多個上游相依性：
```json
"runAfter": {
  "Action_A": ["Succeeded"],
  "Action_B": ["Succeeded", "Skipped"]
}
```

錯誤處理動作 (在上游失敗時執行)：
```json
"Log_Error": {
  "runAfter": {
    "Risky_Action": ["Failed"]
  }
}
```

---

## `parameters` (流程層級輸入參數)

選填。在流程層級定義可重複使用的數值：

```json
"parameters": {
  "listName": {
    "type": "string",
    "defaultValue": "MyList"
  },
  "maxItems": {
    "type": "integer",
    "defaultValue": 100
  }
}
```

參考：在運算式字串中使用 `@parameters('listName')`。

---

## `outputs` (輸出)

在雲端流程中很少使用。除非流程作為子流程被呼叫且需要傳回數值，否則請保持為 `{}`。

對於傳回資料的子流程：

```json
"outputs": {
  "resultData": {
    "type": "object",
    "value": "@outputs('Compose_Result')"
  }
}
```

---

## 範圍動作 (Scoped Actions，在範圍區塊內)

為了錯誤處理或清晰起見而需要分組的動作：

```json
"Scope_Main_Process": {
  "type": "Scope",
  "runAfter": {},
  "actions": {
    "Step_One": { ... },
    "Step_Two": { "runAfter": { "Step_One": ["Succeeded"] }, ... }
  }
}
```

---

## 完整最小範例

```json
{
  "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
  "contentVersion": "1.0.0.0",
  "triggers": {
    "Recurrence": {
      "type": "Recurrence",
      "recurrence": {
        "frequency": "Week",
        "interval": 1,
        "schedule": { "weekDays": ["Monday"] },
        "startTime": "2026-01-05T09:00:00Z",
        "timeZone": "AUS Eastern Standard Time"
      }
    }
  },
  "actions": {
    "Compose_Greeting": {
      "type": "Compose",
      "runAfter": {},
      "inputs": "週一愉快！"
    }
  },
  "outputs": {}
}
```
