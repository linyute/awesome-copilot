---
name: 'signal-write'
description: '發出結構化的代理程式訊號 — hands-up、blocked、done、checkpoint、partnership。訊號以 JSON 形式寫入 .signals/ 供儀表板取用，並記錄在日誌中以實現持久性。'
---

# 代理程式訊號 (Agent Signals)

從工作桌向操作員或其他工作桌發出結構化訊號。

## 何時使用

- 工作桌需要操作員的注意（hands-up、blocked）
- 工作已完成並準備好進行審查（done）
- 值得注意的重大進展（checkpoint）
- 兩個工作桌意見不合且無法解決（hands-up）
- TA 正在回報協調品質（partnership）

## 訊號類型

### `hands-up`
兩個工作桌意見不合且無法根據外部事實解決。
這是系統正常運作的表現 — 操作員讀取的是工作桌
*意見分歧*之處，而非它們表現自信之處。

### `blocked`
工作桌在沒有輸入的情況下無法繼續 — 缺少存取權限、
範圍不明確、需要只有操作員才能做出的決定。

### `done`
工作已完成並準備好進行審查。產物已放置在工作台上。

### `checkpoint`
值得操作員了解的重大進展，但工作
仍在繼續。未受阻、未完成 — 僅僅是一個標記。

### `partnership`
由 TA（會議室協調員）用於回報協調品質。
自我評估分數反映的是協調能力，而不是程式碼準確性：
- **intent** — 理解操作員的需求
- **confidence** — 將正確的工作分配給正確的工作桌
- **accuracy** — 指派的工作產出了正確的成果
- **completeness** — 沒有遺漏任何事項

## 如何發出訊號

### 1. 將 JSON 訊號檔案寫入 `.signals/`

這是主要輸出 — 它是儀表板讀取的內容。
建立 `desks/<desk-name>/.signals/<timestamp>.json`：

```json
{
  "signal_type": "execution",
  "subtype": "checkpoint",
  "timestamp": "2026-07-19T21:30:00Z",
  "run_id": "<optional; set to pair this with an outcome signal>",
  "agent_name": "<desk-name>",
  "self_assessment": {
    "intent": 4,
    "confidence": 5,
    "accuracy": 4,
    "completeness": 3
  },
  "patterns": {
    "what_worked": "description of what went well",
    "what_was_hard": "description of challenges",
    "skill_gap": "areas for improvement"
  },
  "escalation": {
    "reason": null,
    "blocked_on": null,
    "recommendation": null
  }
}
```

### 訊號類型對應

| 訊號 | `signal_type` | `subtype` |
|-----------|-----------------|----------------|
| hands-up | `"escalation"` | `"hands-up"` |
| blocked | `"escalation"` | `"blocked"` |
| done | `"execution"` | `"done"` |
| checkpoint| `"execution"` | `"checkpoint"` |
| partnership| `"partnership"` | `"partnership"`|

`subtype` 欄位為儀表板取用端保留了特定的訊號
狀態。`signal_type` 控制排序優先級
（升級 → 頂部）。

> **注意：** signals-dashboard 畫布擴充功能在存在時會讀取
> `subtype`，並在顯示時退回使用 `signal_type`。如果要在
> 自己的工具中取用訊號，請針對特定狀態
> 優先使用 `subtype`。

> **排序：** 包含 `timestamp`（ISO 8601 UTC）。儀表板
> 依其對訊號進行排序，僅在缺失時退回使用檔案 mtime —
> git clone/checkout 會重設 mtime，因此單憑 mtime 並不是可靠的
> 時鐘。

### 2. 在日誌中記錄訊號

同時將簡短的標記附加到工作桌的日誌中以實現持久性：

```markdown
## <date> — [signal:<type>] <summary>
- <key details>
```

日誌附註是軌跡標記。JSON 檔案是
機器可讀的訊號。

## 成果訊號（校準）

signals-dashboard 可以將工作桌的自我評估與
*成果 (outcome)*（對實現結果的獨立評分）進行配對，並顯示
**誠實差距 (honesty gap)**（工作桌的信心與交付
品質相差多遠）。成果訊號是可選的，通常
由審查者/評估者發出，而不是工作桌本身。

將它們寫入**相同的** `.signals/` 目錄：

```json
{
  "signal_type": "outcome",
  "run_id": "<same run_id as the signal it rates>",
  "agent_name": "<reviewer name>",
  "quality_rating": 4,
  "effort_to_merge": "minimal",
  "issues_found": ["optional short strings"],
  "timestamp": "2026-07-19T22:00:00Z"
}
```

- **`run_id`** 將成果與其評分的執行/夥伴關係
  訊號進行關聯 — 在兩者上設定相同的 `run_id`。如果缺失，
  儀表板將退回使用在最新訊號之後不久發出的最接近
  成果。
- **`quality_rating`** (0–5) 是實現的品質；儀表板
  將其與工作桌自我評估的 `confidence` 進行比較以計算
  誠實差距。
- **`effort_to_merge`** — `"minimal"`、`"moderate"` 或 `"significant"`。
- **`issues_found`** — 簡短字串的可選陣列。

## 原則

- 訊號是結構化的，而不是閒聊式的。簡短、客觀、可採取行動。
- hands-up 不是失敗 — 它是最有價值的訊號。它
  意味著系統捕捉到了單一視角會
  遺漏的事物。
- 不要為常規進展發出訊號。訊號是用於
  影響整個會議室的狀態變更，而不是一般狀態更新。
- blocked 意味著真正受阻 — 而非「我想要取得建議。」
  如果您可以使用合理的預設值繼續進行，請繼續進行並予以記錄。
- 自我評估分數應該是誠實的，而不是樂觀的。3/5
  是正常的。每項都是 5/5 是可疑的。
