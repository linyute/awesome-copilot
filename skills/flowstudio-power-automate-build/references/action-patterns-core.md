# FlowStudio MCP — 動作模式：核心

適用於 Power Automate 流程定義的變數、控制流程與運算式模式。

> 所有範例皆假定已適當設定 `"runAfter"`。
> 將 `<connectionName>` 替換為您在 `connectionReferences` 對應中所使用的**金鑰**
> （例如 `shared_teams`、`shared_office365`）— 而不是連線 GUID。

---

## 資料與變數

### Compose（儲存值）

```json
"Compose_My_Value": {
  "type": "Compose",
  "runAfter": {},
  "inputs": "@variables('myVar')"
}
```

參考：`@outputs('Compose_My_Value')`

---

### Initialize Variable

```json
"Init_Counter": {
  "type": "InitializeVariable",
  "runAfter": {},
  "inputs": {
    "variables": [{
      "name": "counter",
      "type": "Integer",
      "value": 0
    }]
  }
}
```

類型：`"Integer"`、`"Float"`、`"Boolean"`、`"String"`、`"Array"`、`"Object"`

---

### Set Variable

```json
"Set_Counter": {
  "type": "SetVariable",
  "runAfter": {},
  "inputs": {
    "name": "counter",
    "value": "@add(variables('counter'), 1)"
  }
}
```

---

### Append to Array Variable

```json
"Collect_Item": {
  "type": "AppendToArrayVariable",
  "runAfter": {},
  "inputs": {
    "name": "resultArray",
    "value": "@item()"
  }
}
```

---

### Increment Variable

```json
"Increment_Counter": {
  "type": "IncrementVariable",
  "runAfter": {},
  "inputs": {
    "name": "counter",
    "value": 1
  }
}
```

> 在迴圈內的計數器請使用 `IncrementVariable`（而非搭配 `add()` 的 `SetVariable`）—
> 它是不可部分完成的（atomic），並可避免在同一次反覆運算中的其他位置使用該變數時發生運算式錯誤。
> `value` 可以是任何整數或運算式，例如 `@mul(item()?['Interval'], 60)`
> 以將 Unix 時間戳記游標推進 N 分鐘。

---

## 控制流程

### Condition（If/Else）

```json
"Check_Status": {
  "type": "If",
  "runAfter": {},
  "expression": {
    "and": [{ "equals": ["@item()?['Status']", "Active"] }]
  },
  "actions": {
    "Handle_Active": {
      "type": "Compose",
      "runAfter": {},
      "inputs": "Active user: @{item()?['Name']}"
    }
  },
  "else": {
    "actions": {
      "Handle_Inactive": {
        "type": "Compose",
        "runAfter": {},
        "inputs": "Inactive user"
      }
    }
  }
}
```

比較運算子：`equals`、`not`、`greater`、`greaterOrEquals`、`less`、`lessOrEquals`、`contains`  
邏輯：`and: [...]`、`or: [...]`

---

### Switch

```json
"Route_By_Type": {
  "type": "Switch",
  "runAfter": {},
  "expression": "@triggerBody()?['type']",
  "cases": {
    "Case_Email": {
      "case": "email",
      "actions": { "Process_Email": { "type": "Compose", "runAfter": {}, "inputs": "email" } }
    },
    "Case_Teams": {
      "case": "teams",
      "actions": { "Process_Teams": { "type": "Compose", "runAfter": {}, "inputs": "teams" } }
    }
  },
  "default": {
    "actions": { "Unknown_Type": { "type": "Compose", "runAfter": {}, "inputs": "unknown" } }
  }
}
```

---

### Scope（群組 / Try-Catch）

在 Scope 中包裝相關動作，為它們賦予共用名稱、在設計工具中將其收合，
且—最重要的是—將它們的錯誤作為一個整體單元來處理。

```json
"Scope_Get_Customer": {
  "type": "Scope",
  "runAfter": {},
  "actions": {
    "HTTP_Get_Customer": {
      "type": "Http",
      "runAfter": {},
      "inputs": {
        "method": "GET",
        "uri": "https://api.example.com/customers/@{variables('customerId')}"
      }
    },
    "Compose_Email": {
      "type": "Compose",
      "runAfter": { "HTTP_Get_Customer": ["Succeeded"] },
      "inputs": "@outputs('HTTP_Get_Customer')?['body/email']"
    }
  }
},
"Handle_Scope_Error": {
  "type": "Compose",
  "runAfter": { "Scope_Get_Customer": ["Failed", "TimedOut"] },
  "inputs": "Scope failed: @{result('Scope_Get_Customer')?[0]?['error']?['message']}"
}
```

> 參考 scope 結果：`@result('Scope_Get_Customer')` 會傳回動作結果的陣列。
> 在後續動作上使用 `runAfter: {"MyScope": ["Failed", "TimedOut"]}`
> 即可建立 try/catch 語意，而不需要 Terminate。

---

### Foreach（循序）

```json
"Process_Each_Item": {
  "type": "Foreach",
  "runAfter": {},
  "foreach": "@outputs('Get_Items')?['body/value']",
  "operationOptions": "Sequential",
  "actions": {
    "Handle_Item": {
      "type": "Compose",
      "runAfter": {},
      "inputs": "@item()?['Title']"
    }
  }
}
```

> 除非刻意平行處理，否則請一律包含 `"operationOptions": "Sequential"`。

---

### Foreach（具並行限制的平行）

```json
"Process_Each_Item_Parallel": {
  "type": "Foreach",
  "runAfter": {},
  "foreach": "@body('Get_SP_Items')?['value']",
  "runtimeConfiguration": {
    "concurrency": {
      "repetitions": 20
    }
  },
  "actions": {
    "HTTP_Upsert": {
      "type": "Http",
      "runAfter": {},
      "inputs": {
        "method": "POST",
        "uri": "https://api.example.com/contacts/@{item()?['Email']}"
      }
    }
  }
}
```

> 設定 `repetitions` 以控制同時處理的項目數量。
> 實用數值：外部 API 呼叫為 `5–10`（遵守速率限制），
> 內部/快速作業為 `20–50`。
> 若要使用平台預設值（目前為 50），請完全省略 `runtimeConfiguration.concurrency`。
> 切勿同時使用 `"operationOptions": "Sequential"` 與 concurrency。

---

### Wait（延遲）

```json
"Delay_10_Minutes": {
  "type": "Wait",
  "runAfter": {},
  "inputs": {
    "interval": {
      "count": 10,
      "unit": "Minute"
    }
  }
}
```

有效的 `unit` 值：`"Second"`、`"Minute"`、`"Hour"`、`"Day"`

> 使用延遲 + 重新擷取作為去重複防護機制：等待任何競爭處理程序完成，
> 然後在採取動作之前重新讀取該記錄。這可避免在多個觸發程序或手動編輯可能對
> 同一項目產生競爭情況時發生重複處理。

---

### Terminate（成功或失敗）

```json
"Terminate_Success": {
  "type": "Terminate",
  "runAfter": {},
  "inputs": {
    "runStatus": "Succeeded"
  }
},
"Terminate_Failure": {
  "type": "Terminate",
  "runAfter": { "Risky_Action": ["Failed"] },
  "inputs": {
    "runStatus": "Failed",
    "runError": {
      "code": "StepFailed",
      "message": "@{outputs('Get_Error_Message')}"
    }
  }
}
```

---

### Do Until（迴圈直到符合條件）

重複執行一組動作區塊，直到結束條件為 true 為止。
適用於事先未知反覆運算次數的情況（例如分頁 API、
遍歷時間範圍、輪詢直到狀態變更）。

```json
"Do_Until_Done": {
  "type": "Until",
  "runAfter": {},
  "expression": "@greaterOrEquals(variables('cursor'), variables('endValue'))",
  "limit": {
    "count": 5000,
    "timeout": "PT5H"
  },
  "actions": {
    "Do_Work": {
      "type": "Compose",
      "runAfter": {},
      "inputs": "@variables('cursor')"
    },
    "Advance_Cursor": {
      "type": "IncrementVariable",
      "runAfter": { "Do_Work": ["Succeeded"] },
      "inputs": {
        "name": "cursor",
        "value": 1
      }
    }
  }
}
```

> 請一律明確設定 `limit.count` 與 `limit.timeout` — 平台預設值較低
> （60 次反覆運算，1 小時）。對於時間範圍遍歷程式，請使用 `limit.count: 5000` 與
> `limit.timeout: "PT5H"`（ISO 8601 持續時間）。
>
> 結束條件會在每次反覆運算**之前**進行評估。在迴圈之前初始化您的游標變數，
> 讓條件在第一次執行時就能正確評估。

---

### Agent 重試迴圈

當流程呼叫 AI 或 Copilot 樣式的 Agent 直到其達到終端
結果時，請保持迴圈狀態明確：

- 在 `Until` 之前初始化如 `agentStatus`、`attempt` 和 `finalPayload`
  等變數。
- 在迴圈內部呼叫 Agent、驗證回應、更新狀態，並僅在
  狀態為非終端時進行延遲/重試。
- 將最終發送動作（例如電子郵件、SharePoint 更新或 Teams 貼文）放在
  迴圈之後，讓重試不會產生重複的副作用。
- 如果平台拒絕巢狀在 `Until` 內的複雜 `Switch`，請讓
  迴圈主體保持簡單的驗證與狀態更新，然後在迴圈之後使用 `Switch`
  進行路由。

---

### 具 RequestId 相互關聯的非同步輪詢

當 API 以非同步方式啟動長時間執行的作業時（例如 Power BI 資料集重新整理、
報表產生、批次匯出），觸發程序呼叫會傳回要求識別碼。請從
**回應標頭**擷取該識別碼，然後輪詢依該精確識別碼篩選的狀態端點：

```json
"Start_Job": {
  "type": "Http",
  "inputs": { "method": "POST", "uri": "https://api.example.com/jobs" }
},
"Capture_Request_ID": {
  "type": "Compose",
  "runAfter": { "Start_Job": ["Succeeded"] },
  "inputs": "@outputs('Start_Job')?['headers/X-Request-Id']"
},
"Initialize_Status": {
  "type": "InitializeVariable",
  "inputs": { "variables": [{ "name": "jobStatus", "type": "String", "value": "Running" }] }
},
"Poll_Until_Done": {
  "type": "Until",
  "expression": "@not(equals(variables('jobStatus'), 'Running'))",
  "limit": { "count": 60, "timeout": "PT30M" },
  "actions": {
    "Delay": { "type": "Wait", "inputs": { "interval": { "count": 20, "unit": "Second" } } },
    "Get_History": {
      "type": "Http",
      "runAfter": { "Delay": ["Succeeded"] },
      "inputs": { "method": "GET", "uri": "https://api.example.com/jobs/history" }
    },
    "Filter_This_Job": {
      "type": "Query",
      "runAfter": { "Get_History": ["Succeeded"] },
      "inputs": {
        "from": "@outputs('Get_History')?['body/items']",
        "where": "@equals(item()?['requestId'], outputs('Capture_Request_ID'))"
      }
    },
    "Set_Status": {
      "type": "SetVariable",
      "runAfter": { "Filter_This_Job": ["Succeeded"] },
      "inputs": {
        "name": "jobStatus",
        "value": "@first(body('Filter_This_Job'))?['status']"
      }
    }
  }
},
"Handle_Failure": {
  "type": "If",
  "runAfter": { "Poll_Until_Done": ["Succeeded"] },
  "expression": { "equals": ["@variables('jobStatus')", "Failed"] },
  "actions": { "Terminate_Failed": { "type": "Terminate", "inputs": { "runStatus": "Failed" } } },
  "else": { "actions": {} }
}
```

存取回應標頭：`@outputs('Start_Job')?['headers/X-Request-Id']`

> **狀態變數初始化**：在迴圈之前設定哨兵值（`"Running"`、`"Unknown"`）。
> 結束條件會測試哨兵值以外的任何值。
> 如此一來，空的輪詢結果（作業尚未出現在歷程記錄中）會讓變數保持不變，
> 且迴圈會繼續執行 — 不會在 null 時意外結束。
>
> **擷取前先篩選**：在呼叫 `first()` 之前，一律將歷程記錄 `Filter Array` 為您特定的
> 要求識別碼。歷程端點會傳回所有作業；若不進行篩選，
> 來自其他並行作業的狀態可能會損毀您的輪詢。

---

### runAfter 遞補（Failed → 替代動作）

當主要動作失敗時路由至遞補動作 — 不需要 Condition 區塊。
只需在遞補動作上設定 `runAfter` 以接受來自主要動作的 `["Failed"]`：

```json
"HTTP_Get_Hi_Res": {
  "type": "Http",
  "runAfter": {},
  "inputs": { "method": "GET", "uri": "https://api.example.com/data?resolution=hi-res" }
},
"HTTP_Get_Low_Res": {
  "type": "Http",
  "runAfter": { "HTTP_Get_Hi_Res": ["Failed"] },
  "inputs": { "method": "GET", "uri": "https://api.example.com/data?resolution=low-res" }
}
```

> 後續動作可以使用同時接受 `["Succeeded", "Skipped"]` 的 `runAfter` 來
> 處理任一路徑 — 請參閱下方的**扇入結合閘（Fan-In Join Gate）**。

---

### 扇入結合閘（合併兩個互斥分支）

當兩個分支互斥時（每次執行只能有一個成功），請使用單一
下游動作，接受來自**這兩個**分支的 `["Succeeded", "Skipped"]`。
無論哪一個分支執行，該閘門皆恰好引發一次：

```json
"Increment_Count": {
  "type": "IncrementVariable",
  "runAfter": {
    "Update_Hi_Res_Metadata":  ["Succeeded", "Skipped"],
    "Update_Low_Res_Metadata": ["Succeeded", "Skipped"]
  },
  "inputs": { "name": "LoopCount", "value": 1 }
}
```

> 這可避免在每個分支中重複下游動作。關鍵概念：
> 無論哪一個分支被略過都會回報 `Skipped` — 該閘門接受該狀態並
> 引發一次。僅在兩個分支確實互斥時才能俐落運作
> （例如其中一個是另一個的 `runAfter: [...Failed]`）。

---

## 運算式

### 常見運算式模式

```
Null-safe field access:    @item()?['FieldName']
Null guard:                @coalesce(item()?['Name'], 'Unknown')
String format:             @{variables('firstName')} @{variables('lastName')}
Date today:                @utcNow()
Formatted date:            @formatDateTime(utcNow(), 'dd/MM/yyyy')
Add days:                  @addDays(utcNow(), 7)
Array length:              @length(variables('myArray'))
Filter array:              Use the "Filter array" action (no inline filter expression exists in PA)
Union (new wins):          @union(body('New_Data'), outputs('Old_Data'))
Sort:                      @sort(variables('myArray'), 'Date')
Unix timestamp → date:     @formatDateTime(addseconds('1970-1-1', triggerBody()?['created']), 'yyyy-MM-dd')
Date → Unix milliseconds:  @div(sub(ticks(startOfDay(item()?['Created'])), ticks(formatDateTime('1970-01-01Z','o'))), 10000)
Date → Unix seconds:       @div(sub(ticks(item()?['Start']), ticks('1970-01-01T00:00:00Z')), 10000000)
Unix seconds → datetime:   @addSeconds('1970-01-01T00:00:00Z', int(variables('Unix')))
Coalesce as no-else:       @coalesce(outputs('Optional_Step'), outputs('Default_Step'))
Flow elapsed minutes:      @div(float(sub(ticks(utcNow()), ticks(outputs('Flow_Start')))), 600000000)
HH:mm time string:         @formatDateTime(outputs('Local_Datetime'), 'HH:mm')
Response header:           @outputs('HTTP_Action')?['headers/X-Request-Id']
Array max (by field):      @reverse(sort(body('Select_Items'), 'Date'))[0]
Integer day span:          @int(split(dateDifference(outputs('Start'), outputs('End')), '.')[0])
ISO week number:           @div(add(dayofyear(addDays(subtractFromTime(date, sub(dayofweek(date),1), 'Day'), 3)), 6), 7)
Join errors to string:     @if(equals(length(variables('Errors')),0), null, concat(join(variables('Errors'),', '),' not found.'))
Normalize before compare:  @replace(coalesce(outputs('Value'),''),'_',' ')
Robust non-empty check:    @greater(length(trim(coalesce(string(outputs('Val')), ''))), 0)
```

### 不受支援 / 具風險的運算式假設

Power Automate 運算式為工作流程定義語言（Workflow Definition Language），而非 JavaScript。
這些模式通常看起來合理，但無法部署或無法如 Agent
預期般運作：

| 目標 | 避免 | 改用 |
|---|---|---|
| 內嵌建構物件 | `createObject(...)` | 含有 JSON 物件常值的 Compose 動作 |
| 內嵌轉換陣列 | 運算式內的 `select(...)` | 資料作業 `Select` 動作 |
| 內嵌篩選陣列 | 運算式內的 `filter(...)` | 資料作業 `Filter array` 動作 |
| 尋找陣列項目索引 | `indexOf(array, item)` | 搭配計數器變數的 Foreach，或建構具索引鍵的物件對應 |

### 運算式中的換行字元

> **`\n` 不會在 Power Automate 運算式內部產生換行。** 它會被
> 視為逐字反斜線 + `n`，且會以原樣顯示或導致
> 驗證錯誤。

在需要換行字元的任何位置，請使用 `decodeUriComponent('%0a')`：

```
換行 (LF)：      decodeUriComponent('%0a')
CRLF:           decodeUriComponent('%0d%0a')
```

範例 — 透過 `concat()` 的多行 Teams 或電子郵件本文：
```json
"Compose_Message": {
  "type": "Compose",
  "inputs": "@concat('Hi ', outputs('Get_User')?['body/displayName'], ',', decodeUriComponent('%0a%0a'), 'Your report is ready.', decodeUriComponent('%0a'), '- The Team')"
}
```

範例 — 搭配換行分隔符號的 `join()`：
```json
"Compose_List": {
  "type": "Compose",
  "inputs": "@join(body('Select_Names'), decodeUriComponent('%0a'))"
}
```

> 這是 Power Automate 流程定義中，在動態建構字串裡嵌入換行字元
> 唯一可靠的方式（已對照 Logic Apps 執行階段確認）。

---

### 加總陣列（XPath 技巧）

Power Automate 沒有原生 `sum()` 函式。請改對 XML 使用 XPath：

```json
"Prepare_For_Sum": {
  "type": "Compose",
  "runAfter": {},
  "inputs": { "root": { "numbers": "@body('Select_Amounts')" } }
},
"Sum": {
  "type": "Compose",
  "runAfter": { "Prepare_For_Sum": ["Succeeded"] },
  "inputs": "@xpath(xml(outputs('Prepare_For_Sum')), 'sum(/root/numbers)')"
}
```

`Select_Amounts` 必須輸出數值的扁平陣列（請先使用 **Select** 動作擷取單一數值欄位）。其結果為可直接用於條件或計算中的數值。

> 這是 Power Automate 中唯一不需要迴圈即可彙總（sum/min/max）陣列的方法。
