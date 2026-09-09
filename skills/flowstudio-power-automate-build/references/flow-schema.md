# FlowStudio MCP — 流程定義結構描述

`update_live_flow` 所預期的完整 JSON 結構（且由 `get_live_flow` 傳回）。

---

## 最上層外觀

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

每個流程定義只能有恰好一個觸發程序。索引鍵名稱是任意的，但
通常會使用慣用名稱（例如 `Recurrence`、`manual`、`When_a_new_email_arrives`）。

請參閱 [trigger-types.md](trigger-types.md) 以取得所有觸發程序範本。

---

## `actions`

以唯一動作名稱作為索引鍵的動作定義字典。
索引鍵名稱不可包含空格 — 請使用底線。

每個動作都必須包含：
- `type` — 動作類型識別碼
- `runAfter` — 上游動作名稱 → 狀態條件陣列的對應
- `inputs` — 該動作專屬的輸入設定

請參閱 [action-patterns-core.md](action-patterns-core.md)、[action-patterns-data.md](action-patterns-data.md)，
以及 [action-patterns-connectors.md](action-patterns-connectors.md) 以取得範本。

### 選用動作屬性

除了必要的 `type`、`runAfter` 和 `inputs` 之外，動作還可以包含：

| 屬性 | 用途 |
|---|---|
| `runtimeConfiguration` | 分頁、並行、保護資料、區塊傳輸 |
| `operationOptions` | Foreach 使用 `"Sequential"`，HTTP 使用 `"DisableAsyncPattern"` |
| `limit` | 覆寫逾時（例如 `{"timeout": "PT2H"}`） |
| `metadata` | 設計工具中繼資料，例如 `operationMetadataId` |

#### 設計工具中繼資料

針對現有的連接器動作，當您編輯定義時請保留
`metadata.operationMetadataId`。針對新的連接器動作或 Skills/HTTP 回應動作，
請新增一個穩定的 GUID 並在各次更新之間保持穩定。請勿在每次部署時
重新產生這些識別碼；設計工具和某些僅供執行的介面會使用它們來保持動作
識別的一致性。

#### `runtimeConfiguration` 變體

**分頁**（大型清單的 SharePoint 取得項目）：
```json
"runtimeConfiguration": {
  "paginationPolicy": {
    "minimumItemCount": 5000
  }
}
```
> 若未設定此項，取得項目會靜默限制在最多 256 個結果。將 `minimumItemCount`
> 設定為您預期的最大資料列數。任何超過 256 個項目的 SharePoint 清單皆為必要。

**並行**（平行 Foreach）：
```json
"runtimeConfiguration": {
  "concurrency": {
    "repetitions": 20
  }
}
```

**保護輸入/輸出**（在執行歷程記錄中遮罩數值）：
```json
"runtimeConfiguration": {
  "secureData": {
    "properties": ["inputs", "outputs"]
  }
}
```
> 用於處理認證、權杖或 PII 的動作上。遮罩後的值會在流程執行
> 歷程記錄 UI 和 API 回應中顯示為 `"<redacted>"`。

**區塊傳輸**（大型 HTTP 承載）：
```json
"runtimeConfiguration": {
  "contentTransfer": {
    "transferMode": "Chunked"
  }
}
```
> 在傳送或接收 >100 KB 本文的 HTTP 動作上啟用（例如包含
> 大型陣列的父流程→子流程呼叫）。

---

## `runAfter` 規則

分支中的第一個動作具有 `"runAfter": {}`（空白 — 在觸發程序之後執行）。

後續動作則宣告其相依性：

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

## `parameters`（流程層級輸入參數）

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

在雲端流程中鮮少使用。除非流程作為子流程呼叫
且需要傳回值，否則請保留為 `{}`。

若為傳回資料的子流程：

```json
"outputs": {
  "resultData": {
    "type": "object",
    "value": "@outputs('Compose_Result')"
  }
}
```

---

## 範圍動作（在範圍區塊內部）

需要為錯誤處理或易讀性進行分組的動作：

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

## 完整最低限度範例

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
