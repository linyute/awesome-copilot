# FlowStudio MCP — 偵錯工作流程 (Debug Workflow)

用於診斷 Power Automate 流程失敗的端對端決策樹。

---

## 頂層決策樹 (Top-Level Decision Tree)

```
流程失敗
│
├── 流程未啟動 / 未顯示任何執行記錄
│   └── ► 檢查流程狀態：get_live_flow → properties.state
│       ├── "Stopped" → 流程已停用；請在 PA 設計工具中啟用
│       └── "Started" + 無執行記錄 → 未滿足觸發條件 (檢查觸發程序設定)
│
├── 流程執行顯示 "Failed" (失敗)
│   ├── 步驟 A：get_live_flow_run_error  → 讀取 error.code + error.message
│   │
│   ├── error.code = "InvalidTemplate"
│   │   └── ► 運算式錯誤 (null 值、型別錯誤、路徑錯誤)
│   │       └── 請參閱下方的：運算式錯誤工作流程
│   │
│   ├── error.code = "ConnectionAuthorizationFailed"
│   │   └── ► 連接由其他使用者擁有；請在 PA 設計工具中修復
│   │
│   ├── error.code = "ActionFailed" + 訊息提及 HTTP
│   │   └── ► 請參閱下方的：HTTP 動作工作流程
│   │
│   └── 未知 / 一般錯誤
│       └── ► 逐一往回檢查動作 (下方的步驟 B)
│
└── 流程成功但輸出錯誤
    └── ► 使用 get_live_flow_run_action_outputs 檢查中間動作
        └── 請參閱下方的：資料品質工作流程
```

---

## 運算式錯誤工作流程 (Expression Error Workflow)

```
InvalidTemplate 錯誤
│
├── 1. 讀取 error.message — 識別動作名稱與函式
│
├── 2. 取得流程定義：get_live_flow
│   └── 在 definition["actions"][action_name]["inputs"] 中尋找該動作
│       └── 識別該運算式讀取的是什麼上游數值
│
├── 3. 取得失敗動作之前的動作的 get_live_flow_run_action_outputs
│   └── 在該動作的輸出中尋找 null / 型別錯誤
│       ├── Null 字串欄位 → 使用 coalesce() 包裹：@coalesce(field, '')
│       ├── Null 物件 → 在動作前加入空值檢查條件
│       └── 錯誤的欄位名稱 → 更正鍵值 (區分大小寫)
│
└── 4. 使用 update_live_flow 套用修復，然後重新提交
```

---

## HTTP 動作工作流程 (HTTP Action Workflow)

```
HTTP 動作上的 ActionFailed
│
├── 1. 針對該 HTTP 動作執行 get_live_flow_run_action_outputs
│   └── 讀取：outputs.statusCode, outputs.body
│
├── statusCode = 401
│   └── ► 遺失授權標頭或 OAuth 權杖過期
│       檢查：動作 inputs.authentication 區塊
│
├── statusCode = 403
│   └── ► 目標資源權限不足
│       檢查：服務主體 (service principal) / 使用者是否具有存取權
│
├── statusCode = 400
│   └── ► 錯誤的請求本文
│       檢查：動作 inputs.body 運算式；解析錯誤通常發生在巢狀 JSON 中
│
├── statusCode = 404
│   └── ► URL 錯誤或資源已刪除/重新命名
│       檢查：動作 inputs.uri 運算式
│
└── statusCode = 500 / 逾時
    └── ► 目標系統錯誤；重試原則 (retry policy) 可能有幫助
        新增： "retryPolicy": {"type": "Fixed", "count": 3, "interval": "PT10S"}
```

---

## 資料品質工作流程 (Data Quality Workflow)

```
流程成功但輸出資料錯誤
│
├── 1. 識別第一個「錯誤的」輸出 — 是哪個動作產生的？
│
├── 2. 針對該動作執行 get_live_flow_run_action_outputs
│   └── 比對實際輸出本文與預期結果
│
├── 來源陣列包含 null / 未預期的值
│   ├── 檢查觸發資料 — 針對觸發程序執行 get_live_flow_run_action_outputs
│   └── 逐個動作追蹤，直到數值損毀為止
│
├── 合併/union 數值錯誤
│   └── 檢查 union 引數順序：
│       union(NEW, old) = 新的獲勝  ✓
│       union(OLD, new) = 舊的獲勝  ← 常見 Bug
│
├── Foreach 輸出遺失項目
│   ├── 檢查 foreach 條件 — 過濾器可能太嚴格
│   └── 檢查平行 Foreach 是否導致競爭條件 (新增 Sequential)
│
└── 日期/時間值時區錯誤
    └── 使用 convertTimeZone() — utcNow() 一律為 UTC
```

---

## 逐一往回檢查分析 (Walk-Back Analysis，未知失敗)

當錯誤訊息未明確指出根本原因時：

```python
# 1. 從定義取得所有動作名稱
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
actions = list(defn["properties"]["definition"]["actions"].keys())

# 2. 檢查失敗執行記錄中每個動作的狀態
for action in actions:
    actions_out = mcp("get_live_flow_run_action_outputs",
        environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID,
        actionName=action)
    # 回傳動作物件陣列
    item = actions_out[0] if actions_out else {}
    status = item.get("status", "unknown")
    print(f"{action}: {status}")

# 3. 找出 Succeeded 與 Failed/Skipped 之間的邊界
# 第一個 Failed 動作通常是根本原因 (除非是設計上被跳過的)
```

Foreach / Condition 分支內的動作可能會以巢狀方式出現 —
請先檢查父動作以確認分支是否確實有執行。

---

## 修復後驗證清單

1. `update_live_flow` 回傳 `error: null` — 定義已接受  
2. `resubmit_live_flow_run` 確認已啟動新執行  
3. 等待執行完成 (每 15 秒輪詢 `get_live_flow_runs`)  
4. 確認新執行 `status = "Succeeded"`  
5. 如果流程有下游消費者（子流程、電子郵件、SharePoint 寫入），請同時進行抽查
