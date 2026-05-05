# Arize 連結範例 (Arize Link Examples)

全程使用的預留位置：
- `{org_id}` — base64 編碼的組織 ID
- `{space_id}` — base64 編碼的空間 ID
- `{project_id}` — base64 編碼的專案 ID
- `{start_ms}` / `{end_ms}` — Epoch 毫秒（例如 1741305600000 / 1741392000000）

---

## Trace

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/projects/{project_id}?selectedTraceId={trace_id}&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA={start_ms}&endA={end_ms}&envA=tracing&modelType=generative_llm
```

## Span（Trace + Span 被標示） (Span (trace + span highlighted))

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/projects/{project_id}?selectedTraceId={trace_id}&selectedSpanId={span_id}&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA={start_ms}&endA={end_ms}&envA=tracing&modelType=generative_llm
```

## Session

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/projects/{project_id}?selectedSessionId={session_id}&queryFilterA=&selectedTab=llmTracing&timeZoneA=America%2FLos_Angeles&startA={start_ms}&endA={end_ms}&envA=tracing&modelType=generative_llm
```

## 資料集（範例分頁） (Dataset (examples tab))

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/datasets/{dataset_id}?selectedTab=examples
```

## 資料集（實驗分頁） (Dataset (experiments tab))

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/datasets/{dataset_id}?selectedTab=experiments
```

## 標記佇列清單 (Labeling Queue list)

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/queues
```

## 標記佇列（特定） (Labeling Queue (specific))

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/queues/{queue_id}
```

## 評估者（最新版本） (Evaluator (latest version))

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/evaluators/{evaluator_id}
```

## 評估者（特定版本） (Evaluator (specific version))

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/evaluators/{evaluator_id}?version={version_url_encoded}
```

## 標核配置 (Annotation Configs)

```
https://app.arize.com/organizations/{org_id}/spaces/{space_id}/annotation-configs
```
