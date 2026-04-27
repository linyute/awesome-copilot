# Arize 連結範例

貫穿全文使用的預留位置：
- `{org_id}` — Base64 編碼的組織 ID
- `{space_id}` — Base64 編碼的空間 ID
- `{project_id}` — Base64 編碼的專案 ID
- `{start_ms}` / `{end_ms}` — Unix 紀元毫秒數 (例如：1741305600000 / 1741392000000)

---

## 追蹤 (Trace)

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/projects/{project_id}?selectedTraceId={trace_id}&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA={start_ms}&endA={end_ms}&envA=tracing&modelType=generative_llm
```

## Span (追蹤 + 已醒目提示的 Span)

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/projects/{project_id}?selectedTraceId={trace_id}&selectedSpanId={span_id}&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA={start_ms}&endA={end_ms}&envA=tracing&modelType=generative_llm
```

## 會話 (Session)

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/projects/{project_id}?selectedSessionId={session_id}&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA={start_ms}&endA={end_ms}&envA=tracing&modelType=generative_llm
```

## 資料集 (範例標籤頁)

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/datasets/{dataset_id}?selectedTab=examples
```

## 資料集 (實驗標籤頁)

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/datasets/{dataset_id}?selectedTab=experiments
```

## 標註佇列列表

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/queues
```

## 特定標註佇列

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/queues/{queue_id}
```

## 評估器 (最新版本)

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/evaluators/{evaluator_id}
```

## 評估器 (特定版本)

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/evaluators/{evaluator_id}?version={version_url_encoded}
```

## 標註組態

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/annotation-configs
```
