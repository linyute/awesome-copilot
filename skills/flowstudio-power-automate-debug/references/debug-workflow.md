# FlowStudio MCP — 偵錯工作流程

診斷 Power Automate 流程失敗的端到端決策樹。

---

## 頂層決策樹

```
流程失敗
│
├── 流程從未啟動 / 未出現任何執行記錄
│   └── ► 檢查流程狀態：get_live_flow → properties.state
│       ├── "Stopped" → 流程已停用；請在 Power Automate 設計工具中啟用
│       └── "Started" + 無執行記錄 → 未滿足觸發條件 (檢查觸發程序組態)
│
├── 流程執行顯示為「失敗 (Failed)」
│   ├── 步驟 A：get_live_flow_run_error → 讀取 error.code + error.message
│   │
│   ├── error.code = "InvalidTemplate"
│   │   └── ► 運算式錯誤 (null 數值、類型錯誤、路徑錯誤)
│   │       └── 參閱：下方的「運算式錯誤工作流程」
│   │
│   ├── error.code = "ConnectionAuthorizationFailed"
│   │   └── ► 連線屬於其他使用者；請在 Power Automate 設計工具中修正
│   │
│   ├── error.code = "ActionFailed" + 訊息提到 HTTP
│   │   └── ► 參閱：下方的「HTTP 動作工作流程」
│   │
│   └── 未知 / 通用錯誤
│       └── ► 往回追蹤動作 (參閱下方的步驟 B)
│
└── 流程成功但輸出錯誤
    └── ► 使用 get_live_flow_run_action_outputs 檢視中間動作
        └── 參閱：下方的「資料品質工作流程」
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
│       └── 識別運算式讀取的是哪個上游數值
│
├── 3. 對失敗動作之前的動作呼叫 get_live_flow_run_action_outputs
│   └── 在該動作的輸出中尋找 null / 類型錯誤
│       ├── Null 字串欄位 → 使用 coalesce() 包裝：@coalesce(field, '')
│       ├── Null 物件 → 在動作前加入空白檢查條件
│       └── 錯誤的欄位名稱 → 修正鍵名 (區分大小寫)
│
└── 4. 使用 update_live_flow 套用修正，然後重新提交
```

---

## HTTP 動作工作流程

```
HTTP 動作發生 ActionFailed
│
├── 1. 對該 HTTP 動作呼叫 get_live_flow_run_action_outputs
│   └── 讀取：outputs.statusCode, outputs.body
│
├── statusCode = 401
│   └── ► 缺少授權標頭或 OAuth 權杖已過期
│       檢查：動作 inputs.authentication 區塊
│
├── statusCode = 403
│   └── ► 對目標資源的權限不足
│       檢查：服務主體 / 使用者是否具有存取權限
│
├── statusCode = 400
│   └── ► 請求本文格式錯誤
│       檢查：動作 inputs.body 運算式；剖析錯誤通常發生在巢狀 JSON 中
│
├── statusCode = 404
│   └── ► 錯誤的 URL 或資源已刪除/重新命名
│       檢查：動作 inputs.uri 運算式
│
└── statusCode = 500 / 逾時
    └── ► 目標系統錯誤；重試策略可能有所幫助
        加入："retryPolicy": {"type": "Fixed", "count": 3, "interval": "PT10S"}
```

---

## 資料品質工作流程

```
流程成功但輸出資料錯誤
│
├── 1. 識別第一個「錯誤」的輸出 — 哪個動作產生了它？
│
├── 2. 對該動作呼叫 get_live_flow_run_action_outputs
│   └── 比較實際輸出本文 vs 預期內容
│
├── 來源陣列包含 null / 非預期數值
│   ├── 檢查觸發程序資料 — 對觸發程序呼叫 get_live_flow_run_action_outputs
│   └── 逐個動作往前追蹤，直到發現數值損壞之處
│
├── 合併 (Merge) / 聯集 (union) 數值錯誤
│   └── 檢查 union 引數順序：
│       union(新資料, 舊資料) = 新值優先  ✓
│       union(舊資料, 新資料) = 舊值優先  ← 常見錯誤
│
├── Foreach 輸出缺少項目
│   ├── 檢查 foreach 條件 — 篩選器可能過於嚴格
│   └── 檢查平行 foreach 是否導致競爭條件 (加入 Sequential)
│
└── 日期/時間值時區錯誤
    └── 使用 convertTimeZone() — utcNow() 永遠是 UTC
```

---

## 溯源分析 (Walk-Back Analysis，未知失敗)

當錯誤訊息未明確指出根本原因時：

```python
# 1. 從定義中取得所有動作名稱
defn = mcp("get_live_flow", environmentName=ENV, flowName=FLOW_ID)
actions = list(defn["properties"]["definition"]["actions"].keys())

# 2. 檢查失敗執行中每個動作的狀態
for action in actions:
    actions_out = mcp("get_live_flow_run_action_outputs",
        environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID,
        actionName=action)
    # 傳回動作物件陣列
    item = actions_out[0] if actions_out else {}
    status = item.get("status", "unknown")
    print(f"{action}: {status}")

# 3. 尋找「成功 (Succeeded)」與「失敗 (Failed) / 跳過 (Skipped)」之間的界線
# 第一個「失敗」的動作很可能就是根本原因 (除非是設計上被跳過的)
```

Foreach / 條件分支內的動作可能會顯示為巢狀 —
請先檢查父動作，以確認該分支是否真的有執行。

---

## 修正後驗證檢查清單

1. `update_live_flow` 傳回 `error: null` — 定義已接受。
2. `resubmit_live_flow_run` 確認新執行已啟動。
3. 等待執行完成 (每 15 秒輪詢一次 `get_live_flow_runs`)。
4. 確認新執行的 `status = "Succeeded"`。
5. 如果流程有下游取用端 (子流程、電子郵件、SharePoint 寫入)，也請抽查這些部分。
