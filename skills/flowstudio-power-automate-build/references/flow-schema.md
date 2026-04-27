# FlowStudio MCP — 流程定義結構描述 (Flow Definition Schema)

`update_live_flow` 預期（以及 `get_live_flow` 回傳）的完整 JSON 結構。

---

## 頂層形狀 (Top-Level Shape)

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
    "<TriggerName>": { ... }
  },
  "actions": {
    "<ActionName>": { ... }
  },
  "outputs": {}
}
```

---

## `triggers`

每個流程定義必須且僅有一個觸發程序。鍵名稱可任意設定，但通常使用慣例名稱（例如 `Recurrence`、`manual`、`When_a_new_email_arrives`）。

請參閱 [trigger-types.md](trigger-types.md) 以取得所有觸發程序範本。

---

## `actions`

由唯一動作名稱作為鍵的動作定義字典。
鍵名稱不得包含空格 — 請使用底線。

每個動作必須包含：
- `type` — 動作型別識別碼
- `runAfter` — 上游動作名稱至狀態條件陣列的對應
- `inputs` — 動作特定的輸入設定

請參閱 [action-patterns-core.md](action-patterns-core.md)、[action-patterns-data.md](action-patterns-data.md) 以及 [action-patterns-connectors.md](action-patterns-connectors.md) 以取得範本。

### 選用動作屬性

除了必要的 `type`、`runAfter` 和 `inputs` 之外，動作還可以包含：

| 屬性 | 用途 |
|---|---|
| `runtimeConfiguration` | 分頁、並發處理、安全資料、區塊傳輸 |
| `operationOptions` | Foreach 的 `"Sequential"`，HTTP 的 `"DisableAsyncPattern"` |
| `limit` | 逾時覆寫 (例如 `{"timeout": "PT2H"}`) |

#### `runtimeConfiguration` 變體

**分頁** (SharePoint Get Items，處理大型清單)：
```json
"runtimeConfiguration": {
  "paginationPolicy": {
    "minimumItemCount": 5000
  }
}
```
> 若無此設定，Get Items 會靜默截斷為 256 個結果。將 `minimumItemCount` 設定為您預期的最大列數。對於任何超過 256 個項目的 SharePoint 清單都是必要的。

**並發處理** (平行 Foreach)：
```json
"runtimeConfiguration": {
  "concurrency": {
    "repetitions": 20
  }
}
```

**安全輸入/輸出** (在執行歷程記錄中遮罩數值)：
```json
"runtimeConfiguration": {
  "secureData": {
    "properties": ["inputs", "outputs"]
  }
}
```
> 用於處理憑證、權杖或 PII 的動作。遮罩後的數值在流程執行歷程記錄 UI 和 API 回應中顯示為 `"<redacted>"`。

**區塊傳輸** (大型 HTTP 負載)：
```json
"runtimeConfiguration": {
  "contentTransfer": {
    "transferMode": "Chunked"
  }
}
```
> 在傳送或接收 >100 KB 本文的 HTTP 動作上啟用（例如帶有大型陣列的 父流程→子流程 呼叫）；可避免請求大小限制。

---

## `runAfter` 規則

分支中的第一個動作具有 `"runAfter": {}` (空物件 — 在觸發後執行)。

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

錯誤處理動作（在上游失敗時執行）：
```json
"Log_Error": {
  "runAfter": {
    "Risky_Action": ["Failed"]
  }
}
```

---

## `parameters` (流程層級輸入參數)

選用。在流程層級定義可重複使用的值：

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

參考：運算式字串中的 `@parameters('listName')`。

---

## `outputs`

在雲端流程中很少使用。除非流程被呼叫為子流程並需要回傳值，否則請保持為 `{}`。

對於回傳資料的子流程：

```json
"outputs": {
  "resultData": {
    "type": "object",
    "value": "@outputs('Compose_Result')"
  }
}
```

---

## 範圍動作 (Scope 區塊內)

需要分組以進行錯誤處理或保持結構清晰的動作：

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
      "inputs": "Good Monday!"
    }
  },
  "outputs": {}
}
```
