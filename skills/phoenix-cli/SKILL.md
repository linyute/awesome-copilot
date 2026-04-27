---
name: 'phoenix-cli'
description: '使用 Phoenix CLI 進行 LLM 應用程式的除錯。擷取追蹤、分析錯誤、檢閱實驗、檢查資料集，並查詢 GraphQL API。當您在除錯 AI/LLM 應用程式、分析追蹤資料、使用 Phoenix 可觀測性工作，或調查 LLM 效能問題時使用。'
license: 'Apache-2.0'
compatibility: '需要 Node.js (用於 npx) 或全域安裝 @arizeai/phoenix-cli。可選用 jq 進行 JSON 處理。'
metadata:
  author: 'arize-ai'
  version: '2.0.0'
---

# Phoenix CLI

## 呼叫 (Invocation)

```bash
px <resource> <action>                          # 如果是全域安裝
npx @arizeai/phoenix-cli <resource> <action>    # 不需要安裝
```

CLI 使用單數資源指令與子指令（如 `list` 和 `get`）：

```bash
px trace list
px trace get <trace-id>
px span list
px dataset list
px dataset get <name>
```

## 設定 (Setup)

```bash
export PHOENIX_HOST=http://localhost:6006
export PHOENIX_PROJECT=my-project
export PHOENIX_API_KEY=your-api-key  # 如果已啟用驗證
```

在透過管線傳送到 `jq` 時，請務必使用 `--format raw --no-progress`。

## 追蹤 (Traces)

```bash
px trace list --limit 20 --format raw --no-progress | jq .
px trace list --last-n-minutes 60 --limit 20 --format raw --no-progress | jq '.[] | select(.status == "ERROR")'
px trace list --format raw --no-progress | jq 'sort_by(-.duration) | .[0:5]'
px trace get <trace-id> --format raw | jq .
px trace get <trace-id> --format raw | jq '.spans[] | select(.status_code != "OK")'
```

## Spans

```bash
px span list --limit 20                                    # 最近的 spans (表格檢視)
px span list --last-n-minutes 60 --limit 50                # 過去一小時的 spans
px span list --span-kind LLM --limit 10                    # 僅限 LLM spans
px span list --status-code ERROR --limit 20                # 僅限發生錯誤的 spans
px span list --name chat_completion --limit 10             # 依 span 名稱過濾
px span list --trace-id <id> --format raw --no-progress | jq .   # 一個追蹤的所有 spans
px span list --include-annotations --limit 10              # 包含 annotation 分數
px span list output.json --limit 100                       # 儲存至 JSON 檔案
px span list --format raw --no-progress | jq '.[] | select(.status_code == "ERROR")'
```

### Span JSON 結構 (shape)

```
Span
  name, span_kind ("LLM"|"CHAIN"|"TOOL"|"RETRIEVER"|"EMBEDDING"|"AGENT"|"RERANKER"|"GUARDRAIL"|"EVALUATOR"|"UNKNOWN")
  status_code ("OK"|"ERROR"|"UNSET"), status_message
  context.span_id, context.trace_id, parent_id
  start_time, end_time
  attributes (與上述追蹤 span 屬性相同)
  annotations[] (搭配 --include-annotations)
    name, result { score, label, explanation }
```

### 追蹤 (Trace) JSON 結構 (shape)

```
Trace
  traceId, status ("OK"|"ERROR"), duration (ms), startTime, endTime
  rootSpan  — 頂層 span (parent_id: null)
  spans[]
    name, span_kind ("LLM"|"CHAIN"|"TOOL"|"RETRIEVER"|"EMBEDDING"|"AGENT")
    status_code ("OK"|"ERROR"), parent_id, context.span_id
    attributes
      input.value, output.value          — 原始輸入/輸出 (raw input/output)
      llm.model_name, llm.provider
      llm.token_count.prompt/completion/total
      llm.token_count.prompt_details.cache_read
      llm.token_count.completion_details.reasoning
      llm.input_messages.{N}.message.role/content
      llm.output_messages.{N}.message.role/content
      llm.invocation_parameters          — JSON 字串 (temperature 等)
      exception.message                  — 如果 span 發生錯誤則設定此欄位
```

## 階段 (Sessions)

```bash
px session list --limit 10 --format raw --no-progress | jq .
px session list --order asc --format raw --no-progress | jq '.[].session_id'
px session get <session-id> --format raw | jq .
px session get <session-id> --include-annotations --format raw | jq '.annotations'
```

### 階段 (Session) JSON 結構 (shape)

```
SessionData
  id, session_id, project_id
  start_time, end_time
  traces[]
    id, trace_id, start_time, end_time

SessionAnnotation (搭配 --include-annotations)
  id, name, annotator_kind ("LLM"|"CODE"|"HUMAN"), session_id
  result { label, score, explanation }
  metadata, identifier, source, created_at, updated_at
```

## 資料集 (Datasets) / 實驗 (Experiments) / 提示 (Prompts)

```bash
px dataset list --format raw --no-progress | jq '.[].name'
px dataset get <name> --format raw | jq '.examples[] | {input, output: .expected_output}'
px experiment list --dataset <name> --format raw --no-progress | jq '.[] | {id, name, failed_run_count}'
px experiment get <id> --format raw --no-progress | jq '.[] | select(.error != null) | {input, error}'
px prompt list --format raw --no-progress | jq '.[].name'
px prompt get <name> --format text --no-progress   # 純文字，適合透過管線傳送給 AI
```

## GraphQL

用於上述指令未涵蓋的臨機查詢。輸出為 `{"data": {...}}`。

```bash
px api graphql '{ projectCount datasetCount promptCount evaluatorCount }'
px api graphql '{ projects { edges { node { name traceCount tokenCountTotal } } } }' | jq '.data.projects.edges[].node'
px api graphql '{ datasets { edges { node { name exampleCount experimentCount } } } }' | jq '.data.datasets.edges[].node'
px api graphql '{ evaluators { edges { node { name kind } } } }' | jq '.data.evaluators.edges[].node'

# 內省 (Introspect) 任何類型
px api graphql '{ __type(name: "Project") { fields { name type { name } } } }' | jq '.data.__type.fields[]'
```

關鍵根欄位：`projects`、`datasets`、`prompts`、`evaluators`、`projectCount`、`datasetCount`、`promptCount`、`evaluatorCount`、`viewer`。

## 文件 (Docs)

下載 Phoenix 文件的 markdown 以供開發代理 (coding agents) 在地使用。

```bash
px docs fetch                                # 擷取預設的工作流程文件至 .px/docs
px docs fetch --workflow tracing             # 僅擷取追蹤文件
px docs fetch --workflow tracing --workflow evaluation
px docs fetch --dry-run                      # 預覽將下載的內容
px docs fetch --refresh                      # 清除 .px/docs 並重新下載
px docs fetch --output-dir ./my-docs         # 自訂輸出目錄
```

關鍵選項：`--workflow` (可重複，值：`tracing`、`evaluation`、`datasets`、`prompts`、`integrations`、`sdk`、`self-hosting`、`all`)、`--dry-run`、`--refresh`、`--output-dir` (預設為 `.px/docs`)、`--workers` (預設為 10)。
