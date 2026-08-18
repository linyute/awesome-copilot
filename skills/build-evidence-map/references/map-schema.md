# 證據圖結構描述 (Evidence map schema)

規範產物為 UTF-8 JSON。在可行的情況下使用 `.doubt.json` 後置詞。

```json
{
  "title": "Short artifact title",
  "question": "One decision-changing question?",
  "updatedAt": "YYYY-MM-DD",
  "verdict": "A provisional, evidence-bounded answer.",
  "nodes": [
    {
      "id": "current-position",
      "type": "position",
      "label": "Current position",
      "text": "The proposition represented by this node."
    },
    {
      "id": "primary-observation",
      "type": "evidence",
      "label": "Observed result",
      "text": "A faithful statement of the source region.",
      "sourceId": "source-1"
    },
    {
      "id": "missing-baseline",
      "type": "unknown",
      "label": "Missing baseline",
      "text": "The exact absent fact and why it matters."
    }
  ],
  "edges": [
    {
      "from": "primary-observation",
      "to": "current-position",
      "relation": "supports",
      "note": "Why the observation increases reason to accept the position."
    },
    {
      "from": "missing-baseline",
      "to": "current-position",
      "relation": "missing",
      "note": "Why this missing baseline could reverse the position."
    }
  ],
  "sources": [
    {
      "id": "source-1",
      "title": "Source title",
      "url": "https://example.com/source",
      "publisher": "Publisher",
      "date": "YYYY-MM-DD",
      "retrievedAt": "YYYY-MM-DD",
      "locator": "Section: Results, p. 7, § 2.1, L12-L18, or 00:04:31",
      "excerpt": "A short, checkable excerpt or bounded source-region description."
    }
  ]
}
```

## 不變量

- 允許的節點類型：`position`、`claim`、`evidence`、`unknown`。
- 允許的關聯：`supports`、`contradicts`、`qualifies`、`missing`。
- 恰好需要一個 `position` 節點。
- 證據節點需要 `sourceId`。
- 每個證據節點必須是至少一條邊線的 `from` 側。
- 每個非立場節點都必須有一條通往立場的有向路徑。
- 重複的推理邊線和有向循環會被拒絕。
- 每個來源都必須由證據節點使用。
- 每條邊線都需要白話 `note`。
- 圖與來源日期為真實的 ISO 日曆日期；來源日期不能晚於
  `updatedAt`。
- 每個來源記錄 `retrievedAt`。收據涵蓋該值與記錄的
  節錄，而非目前由 URL 提供的可變動位元組。
- 定位器識別有界的章節、頁面、行範圍或時間戳記。
- 節錄包含 40–500 個字元的多樣化、可檢查內容；重複的
  填充文字無效。
- `confidence` 欄位無效。使用 `unknown` 節點或限制修飾的主張。

## 選擇性驗證記錄

僅成功的明確來源驗證指令可以將此物件新增至
來源：

```json
{
  "verification": {
    "status": "verified",
    "method": "normalized-excerpt-match",
    "checkedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
    "contentSha256": "64 lowercase hexadecimal characters",
    "excerptSha256": "64 lowercase hexadecimal characters",
    "finalUrl": "The checked URL or absolute local path",
    "locatorStatus": "matched"
  }
}
```

對於頁面、章節和時間戳記定位器，`locatorStatus` 可以是 `not-machine-checked`。
請勿將其視為該區域已由手動確認的證明。
