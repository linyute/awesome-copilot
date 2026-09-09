# FlowStudio MCP — 偵錯工作流程

診斷 Power Automate 流程失敗的端對端決策樹。

---

## 頂層決策樹

```
流程失敗
│
├── 流程從未啟動 / 未出現任何執行紀錄
│   └── ► 檢查流程 State：get_live_flow → properties.state
│       ├── "Stopped" → 流程已停用；請在 PA 設計工具中啟用
│       └── "Started" + 無執行紀錄 → 未滿足觸發條件（檢查觸發程序設定）
│
├── 流程執行顯示 "Failed"
│   ├── 步驟 A：get_live_flow_run_error  → 讀取 error.code + error.message
│   │
│   ├── error.code = "InvalidTemplate"
│   │   └── ► 運算式錯誤（null 值、錯誤型別、無效路徑）
│   │       └── 請參閱：下方的運算式錯誤工作流程
│   │
│   ├── error.code = "ConnectionAuthorizationFailed"
│   │   └── ► 連線由不同使用者所擁有；請在 PA 設計工具中修正
│   │
│   ├── error.code = "ActionFailed" + 訊息提及 HTTP
│   │   └── ► 請參閱：下方的 HTTP 動作工作流程
│   │
│   ├── 父動作為 Foreach / Apply to each
│   │   └── ► 檢查子動作；已處理的子動作失敗仍可能使父動作失敗
│   │
│   └── 未知 / 一般通用錯誤
│       └── ► 往回逐一檢查動作（下方的步驟 B）
│
└── 流程成功但輸出錯誤
    └── ► 使用 get_live_flow_run_action_outputs 檢查中繼動作
        └── 請參閱：下方的資料品質工作流程
```

---

## 運算式錯誤工作流程

```
InvalidTemplate 錯誤
│
├── 1. 讀取 error.message — 識別動作名稱與函式
│
├── 2. 取得流程定義：get_live_flow
│   └── 在 definition["actions"][action_name]["inputs"] 中尋找該動作
│       └── 識別運算式讀取了哪個上游數值
│
├── 3. 針對失敗動作「之前」的動作執行 get_live_flow_run_action_outputs
│   └── 在該動作的輸出中尋找 null / 錯誤型別
│       ├── Null 字串欄位 → 使用 coalesce() 包裹：@coalesce(field, '')
│       ├── Null 物件 → 在動作前新增空白檢查條件
│       └── 錯誤的欄位名稱 → 更正索引鍵（區分大小寫）
│
└── 4. 使用 update_live_flow 套用修正，然後重新提交
```

---

## HTTP 動作工作流程

```
HTTP 動作發生 ActionFailed
│
├── 1. 在該 HTTP 動作上執行 get_live_flow_run_action_outputs
│   └── 讀取：outputs.statusCode, outputs.body
│
├── statusCode = 401
│   └── ► 缺少驗證標頭或 OAuth 權杖已過期
│       檢查：動作 inputs.authentication 區塊
│
├── statusCode = 403
│   └── ► 目標資源權限不足
│       檢查：服務主體 / 使用者是否具有存取權
│
├── statusCode = 400
│   └── ► 格式錯誤的請求內文
│       檢查：動作 inputs.body 運算式；剖析錯誤常見於巢狀 JSON
│
├── statusCode = 404
│   └── ► 錯誤的 URL 或資源已被刪除/重新命名
│       檢查：動作 inputs.uri 運算式
│
└── statusCode = 500 / 逾時
    └── ► 目標系統錯誤；重試原則可能有所幫助
        新增："retryPolicy": {"type": "Fixed", "count": 3, "interval": "PT10S"}
```

---

## 資料品質工作流程

```
流程成功但輸出資料錯誤
│
├── 1. 找出第一個「錯誤」的輸出 — 是由哪個動作產生的？
│
├── 2. 在該動作上執行 get_live_flow_run_action_outputs
│   └── 比較實際輸出內文與預期內容
│
├── 來源陣列包含 null / 非預期數值
│   ├── 檢查觸發程序資料 — 在觸發程序上執行 get_live_flow_run_action_outputs
│   └── 逐個動作向前追蹤，直到數值發生損毀
│
├── 合併/union 產生錯誤數值
│   └── 檢查 union 引數順序：
│       union(NEW, old) = new 勝出  ✓
│       union(OLD, new) = old 勝出  ← 常見錯誤
│
├── Foreach 輸出遺失項目
│   ├── 檢查 foreach 條件 — 篩選器可能過於嚴格
│   └── 檢查平行 foreach 是否導致競爭條件（新增 Sequential）
│
├── 篩選/查詢結果意外比對到 null 或傳回空白
│   └── 在篩選前保護查閱索引鍵；切勿比較 null 與 null
│
└── 日期/時間值時區錯誤
    └── 使用 convertTimeZone() — utcNow() 永遠為 UTC
```

---

## 往回追蹤分析（未知失敗）

當錯誤訊息未明確指出根本原因時：

```python
# 1. 從定義取得所有動作名稱
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
actions = list(defn["properties"]["definition"]["actions"].keys())

# 2. 檢查失敗執行中各動作的狀態
for action in actions:
    actions_out = mcp("get_live_flow_run_action_outputs",
        environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID,
        actionName=action)
    # 傳回動作物件的陣列
    item = actions_out[0] if actions_out else {}
    status = item.get("status", "unknown")
    print(f"{action}: {status}")

# 3. 找出 Succeeded 與 Failed/Skipped 之間的邊界
# 第一個 Failed 的動作很可能就是根本原因（除非是依設計跳過）
```

Foreach / Condition 分支內的動作可能會以巢狀方式呈現 —
請先檢查父動作以確認該分支是否確實執行過。

---

## 修正後驗證檢查清單

1. `update_live_flow` 傳回 `error: null` — 定義已被接受  
2. `resubmit_live_flow_run` 確認新的執行已開始  
3. 等候執行完成（每 15 秒輪詢一次 `get_live_flow_runs`）  
4. 確認新的執行 `status = "Succeeded"`  
5. 若流程有下游取用者（子流程、電子郵件、SharePoint 寫入），
   也請抽查這些項目
