# FlowStudio MCP — 偵錯工作流程

診斷 Power Automate 流程失敗的端對端決策樹。

---

## 頂層決策樹

```
流程發生失敗
│
├── 流程從未啟動 / 未出現執行記錄
│   └── ► 檢查流程狀態 (State)：get_live_flow → properties.state
│       ├── "Stopped" → 流程已停用；請在 PA 設計器中啟用
│       └── "Started" + 無執行記錄 → 未滿足觸發條件 (請檢查觸發器設定)
│
├── 流程執行顯示 "Failed" (失敗)
│   ├── 步驟 A：get_live_flow_run_error → 讀取 error.code + error.message
│   │
│   ├── error.code = "InvalidTemplate"
│   │   └── ► 運算式錯誤 (null 值、錯誤類型、錯誤路徑)
│   │       └── 參見：下方的「運算式錯誤工作流程」
│   │
│   ├── error.code = "ConnectionAuthorizationFailed"
│   │   └── ► 連線由不同使用者擁有；請在 PA 設計器中修復
│   │
│   ├── error.code = "ActionFailed" + 訊息提及 HTTP
│   │   └── ► 參見：下方的「HTTP 動作工作流程」
│   │
│   ├── 父代動作為 Foreach / Apply to each
│   │   └── ► 檢查子動作；已處理的子系失敗仍可能導致父代失敗
│   │
│   └── 未知 / 通用錯誤
│       └── ► 向後追溯動作 (參見下方的步驟 B)
│
└── 流程成功 (Succeeds) 但輸出錯誤
    └── ► 使用 get_live_flow_run_action_outputs 檢查中間動作
        └── 參見：下方的「資料品質工作流程」
```

---

## 運算式錯誤工作流程

```
InvalidTemplate 錯誤
│
├── 1. 讀取 error.message — 識別動作名稱和函式
│
├── 2. 取得流程定義：get_live_flow
│   └── 在 definition["actions"][action_name]["inputs"] 中找到該動作
│       └── 識別運算式讀取的是哪個上游值
│
├── 3. 對失敗動作之前的動作執行 get_live_flow_run_action_outputs
│   └── 在該動作的輸出中尋找 null / 錯誤類型
│       ├── Null 字串欄位 → 使用 coalesce() 包裝：@coalesce(field, '')
│       ├── Null 物件 → 在動作前新增「不為空」檢查條件
│       └── 錯誤的欄位名稱 → 修正索引鍵 (區分大小寫)
│
└── 4. 使用 update_live_flow 套用修復，然後重新提交
```

---

## HTTP 動作工作流程

```
HTTP 動作發生 ActionFailed
│
├── 1. 對該 HTTP 動作執行 get_live_flow_run_action_outputs
│   └── 讀取：outputs.statusCode, outputs.body
│
├── statusCode = 401
│   └── ► 缺少驗證標頭或 OAuth 權杖已過期
│       檢查：動作 inputs.authentication 區塊
│
├── statusCode = 403
│   └── ► 對目標資源的權限不足
│       檢查：服務主體 / 使用者是否具有存取權限
│
├── statusCode = 400
│   └── ► 請求本文格式錯誤
│       檢查：動作 inputs.body 運算式；解析錯誤通常發生在巢狀 JSON 中
│
├── statusCode = 404
│   └── ► 錯誤的 URL 或資源已刪除/重新命名
│       檢查：動作 inputs.uri 運算式
│
└── statusCode = 500 / 逾時
    └── ► 目標系統錯誤；重試原則可能會有幫助
        新增："retryPolicy": {"type": "Fixed", "count": 3, "interval": "PT10S"}
```

---

## 資料品質工作流程

```
流程成功但輸出資料錯誤
│
├── 1. 識別第一個「錯誤」輸出 — 是由哪個動作產生的？
│
├── 2. 對該動作執行 get_live_flow_run_action_outputs
│   └── 比較實際輸出本文與預期值
│
├── 來源陣列包含 null / 意外值
│   ├── 檢查觸發器資料 — 對觸發器執行 get_live_flow_run_action_outputs
│   └── 逐一動作向前追溯，直到發現數值損壞點
│
├── 合併/聯集 (Merge/union) 的數值錯誤
│   ├── 檢查 union 引數順序：
│   │   union(NEW, old) = 新值勝出  ✓
│   │   union(OLD, new) = 舊值勝出  ← 常見錯誤
│
├── Foreach 輸出遺漏項目
│   ├── 檢查 foreach 條件 — 篩選器可能過於嚴格
│   └── 檢查平行 foreach 是否導致競爭條件 (新增 Sequential)
│
├── 篩選/查詢 (Filter/Query) 結果意外匹配 null 或傳回空值
│   ├── 在篩選前保護查閱鍵；不要進行 null 對 null 的比較
│
└── 日期/時間值時區錯誤
    └── 使用 convertTimeZone() — utcNow() 始終為 UTC
```

---

## 追溯分析 (Walk-Back Analysis) (針對未知失敗)

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

# 3. 找出「成功」(Succeeded) 與「失敗/跳過」(Failed/Skipped) 之間的邊界
# 第一個失敗 (Failed) 的動作很可能就是根本原因 (除非是設計使然被跳過)
```

Foreach / 條件分支內部的動作可能會以巢狀方式出現 —
請先檢查父代動作，以確認該分支是否確實執行。

---

## 修復後驗證清單

1. `update_live_flow` 傳回 `error: null` — 定義已被接受。
2. `resubmit_live_flow_run` 確認新執行已啟動。
3. 等待執行完成（每 15 秒輪詢一次 `get_live_flow_runs`）。
4. 確認新執行 `status = "Succeeded"`。
5. 如果流程有下游取用者（子流程、電子郵件、SharePoint 寫入），也請抽查這些部分。
