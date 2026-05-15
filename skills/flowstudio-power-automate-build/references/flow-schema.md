# FlowStudio MCP — 流程定義結構描述

`update_live_flow` 預期的完整 JSON 結構（也是 `get_live_flow` 傳回的結構）。

---

## 頂層形狀

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

## `triggers` (觸發器)

每個流程定義只能有一個觸發器。索引鍵名稱是任意的，但通常會使用慣用名稱（例如 `Recurrence`, `manual`, `When_a_new_email_arrives`）。

有關所有觸發器範本，請參閱 [trigger-types.md](trigger-types.md)。

---

## `actions` (動作)

以唯一動作名稱為索引鍵的動作定義字典。
索引鍵名稱不可包含空格 — 請使用底線。

每個動作必須包含：
- `type` — 動作類型識別碼
- `runAfter` — 上游動作名稱的對應表 → 狀態條件陣列
- `inputs` — 動作專屬的輸入設定

有關範本，請參閱 [action-patterns-core.md](action-patterns-core.md), [action-patterns-data.md](action-patterns-data.md),
以及 [action-patterns-connectors.md](action-patterns-connectors.md)。

### 選用的動作屬性

除了必填的 `type`, `runAfter`, 和 `inputs` 之外，動作還可以包含：

| 屬性 | 用途 |
|---|---|
| `runtimeConfiguration` | 分頁、並行、安全資料、分段傳輸 |
| `operationOptions` | `"Sequential"` 用於 Foreach，`"DisableAsyncPattern"` 用於 HTTP |
| `limit` | 覆寫逾時（例如 `{"timeout": "PT2H"}`） |
| `metadata` | 設計器中使用的 Metadata，例如 `operationMetadataId` |

#### 設計器 Metadata (Designer Metadata)

對於現有的連接器動作，在編輯定義時請保留 `metadata.operationMetadataId`。對於新的連接器動作或技能/HTTP 回應動作，請新增一個穩定的 GUID，並在更新過程中保持其穩定。不要在每次部署時重新產生這些 ID；設計器和某些僅限執行的介面會使用它們來保持動作身分的一致性。

#### `runtimeConfiguration` 變體

**分頁**（處理大型清單的 SharePoint「取得多個項目」）：
```json
"runtimeConfiguration": {
  "paginationPolicy": {
    "minimumItemCount": 5000
  }
}
```
> 沒有此設定時，「取得多個項目」會默默地將結果限制在 256 筆。將 `minimumItemCount` 設定為您預期的最大資料列數。任何超過 256 個項目的 SharePoint 清單都需要此設定。

**並行 (Concurrency)**（平行的 Foreach）：
```json
"runtimeConfiguration": {
  "concurrency": {
    "repetitions": 20
  }
}
```

**安全輸入/輸出**（遮蓋執行歷程記錄中的值）：
```json
"runtimeConfiguration": {
  "secureData": {
    "properties": ["inputs", "outputs"]
  }
}
```
> 用於處理認證、權杖或 PII（個人識別資訊）的動作。被遮蓋的值在流程執行歷程記錄 UI 和 API 回應中會顯示為 `"<redacted>"`。

**分段傳輸 (Chunked transfer)**（大型 HTTP 承載資料）：
```json
"runtimeConfiguration": {
  "contentTransfer": {
    "transferMode": "Chunked"
  }
}
```
> 用於傳送或接收超過 100 KB 本文的 HTTP 動作（例如帶有大型陣列的父子流程呼叫）。

---

## `runAfter` 規則

分支中的第一個動作具有 `"runAfter": {}`（空 — 在觸發後執行）。

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

## `parameters` (流程層級的輸入參數)

選填。在流程層級定義可重複使用的值：

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

## `outputs` (輸出)

在雲端流程中鮮少使用。除非流程作為子流程被呼叫且需要傳回值，否則請保留為 `{}`。

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

## 具範圍的動作 (Scoped Actions) (在範圍區塊內)

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

## 完整的最簡範例

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
