---
name: phoenix-cli
description: 使用 Phoenix CLI 偵錯 LLM 應用程式。獲取追蹤、分析錯誤、使用開放式編碼與軸心式編碼來建立追蹤審查結構、檢查資料集、審閱實驗、查詢標核配置，以及使用 GraphQL API。當使用者正在分析 Trace 或 Span、調查 LLM/代理程式失敗、決定檢測應用程式後的後續行動、建立失敗分類法、選擇要編寫的評估 (evals)，或詢問「出了什麼問題」、「有哪些錯誤類型」或「我應該關注哪裡」時使用 — 即使沒有明確說出技術名稱。
license: Apache-2.0
compatibility: 需要 Node.js (執行 npx) 或全域安裝 @arizeai/phoenix-cli。可選用 jq 進行 JSON 處理。
metadata:
  author: arize-ai
  version: "3.3.0"
---

# Phoenix CLI

## 叫用方式 (Invocation)

```bash
px <資源> <動作>                          # 若已全域安裝
npx @arizeai/phoenix-cli <資源> <動作>    # 無需安裝
```

CLI 使用單數資源指令搭配子指令（如 `list` 與 `get`）：

```bash
px trace list
px trace get <trace-id>
px trace annotate <trace-id>
px trace add-note <trace-id>
px span list
px span annotate <span-id>
px span add-note <span-id>
px session list
px session get <session-id>
px session annotate <session-id>
px session add-note <session-id>
px dataset list
px dataset get <名稱>
px project list
px annotation-config list
px auth status
```

## 設定 (Setup)

```bash
export PHOENIX_HOST=http://localhost:6006
export PHOENIX_PROJECT=my-project
export PHOENIX_API_KEY=your-api-key  # 若啟用了身份驗證
```

透過管線傳送至 `jq` 時，請務必使用 `--format raw --no-progress`。

## 快速參考 (Quick Reference)

| 任務 | 檔案 |
| ---- | ----- |
| 查看採樣的追蹤並寫下關於出錯原因的具體筆記（尚無分類法） | [references/open-coding](references/open-coding.md) |
| 將這些筆記分組為結構化的失敗分類法，並量化重要事項 | [references/axial-coding](references/axial-coding.md) |

## 工作流程 (Workflows)

**「檢測後我該做什麼？」 / 「我該關注哪裡？」 / 「出了什麼問題？」**
[開放式編碼 (open-coding)](references/open-coding.md) → [軸心式編碼 (axial-coding)](references/axial-coding.md) → 為熱門類別建立評估 (evals)。

## 參考類別 (Reference Categories)

| 字首 | 描述 |
| ------ | ----------- |
| `references/open-coding` | 針對採樣追蹤的自由格式筆記 — 每當使用者想理清追蹤但尚無失敗類別時使用 |
| `references/axial-coding` | 將筆記歸納分組為具備計數且互斥不遺漏 (MECE) 的分類法 — 每當使用者已有觀察結果且需要類別或評估目標時使用 |

## 驗證 (Auth)

```bash
px auth status                                # 檢查連線與身份驗證
px auth status --endpoint http://other:6006   # 檢查特定端點
```

## 專案 (Projects)

```bash
px project list                                            # 列出所有專案（表格檢視）
px project list --format raw --no-progress | jq '.[].name' # 以 JSON 格式獲取專案名稱
```

## 追蹤 (Traces)

```bash
px trace list --limit 20 --format raw --no-progress | jq .
px trace list --last-n-minutes 60 --limit 20 --format raw --no-progress | jq '.[] | select(.status == "ERROR")'
px trace list --since 2025-01-15T00:00:00Z --limit 50 --format raw --no-progress | jq .
px trace list --format raw --no-progress | jq 'sort_by(-.duration) | .[0:5]'
px trace list --include-notes --format raw --no-progress | jq '.[].notes'
px trace get <trace-id> --format raw | jq .
px trace get <trace-id> --format raw | jq '.spans[] | select(.status_code != "OK")'
px trace get <trace-id> --include-notes --format raw | jq '.notes'
px trace annotate <trace-id> --name reviewer --label pass
px trace annotate <trace-id> --name reviewer --score 0.9 --format raw --no-progress
px trace add-note <trace-id> --text "需要追蹤"
```

### Trace JSON 形狀 (Trace JSON shape)

```
Trace
  traceId, status ("OK"|"ERROR"), duration (ms), startTime, endTime
  annotations[] (搭配 --include-annotations，不含筆記)
    name, result { score, label, explanation }
  notes[] (搭配 --include-notes)
    name="note", result { explanation }
  rootSpan  — 頂層 Span (parent_id: null)
  spans[]
    name, span_kind ("LLM"|"CHAIN"|"TOOL"|"RETRIEVER"|"EMBEDDING"|"AGENT"|"RERANKER"|"GUARDRAIL"|"EVALUATOR"|"UNKNOWN")
    status_code ("OK"|"ERROR"|"UNSET"), parent_id, context.span_id
    notes[] (搭配 --include-notes)
      name="note", result { explanation }
    attributes
      input.value, output.value          — 原始輸入/輸出
      llm.model_name, llm.provider
      llm.token_count.prompt/completion/total
      llm.token_count.prompt_details.cache_read
      llm.token_count.completion_details.reasoning
      llm.input_messages.{N}.message.role/content
      llm.output_messages.{N}.message.role/content
      llm.invocation_parameters          — JSON 字串（溫度等）
      exception.message                  — 若 Span 發生錯誤則設定
```

## Span

```bash
px span list --limit 20                                    # 最近的 Span（表格檢視）
px span list --last-n-minutes 60 --limit 50                # 過去一小時的 Span
px span list --since 2025-01-15T00:00:00Z --limit 50       # 自特定時間戳記起的 Span
px span list --span-kind LLM --limit 10                    # 僅限 LLM Span
px span list --status-code ERROR --limit 20                # 僅限發生錯誤的 Span
px span list --name chat_completion --limit 10             # 依 Span 名稱篩選
px span list --trace-id <id> --format raw --no-progress | jq .   # 某個 Trace 的所有 Span
px span list --parent-id null --limit 10                   # 僅限根 Span
px span list --parent-id <span-id> --limit 10              # 僅限某個 Span 的子項
px span list --include-annotations --limit 10              # 包含標核分數
px span list --include-notes --limit 10                    # 包含 Span 筆記
px span list --attribute llm.model_name:gpt-4 --limit 10  # 依字串屬性篩選
px span list --attribute llm.token_count.total:500 --limit 10  # 依數值屬性篩選
px span list --attribute 'user.id:"12345"' --limit 10     # 強制對數值型值進行字串比對
px span list --attribute session.id:sess:abc:123 --limit 20  # 值中包含冒號 OK（僅在第一個冒號處分割）
px span list --attribute llm.model_name:gpt-4 --attribute session.id:abc --limit 10  # 使用 AND 組合多個篩選器
px span list output.json --limit 100                       # 儲存至 JSON 檔案
px span list --format raw --no-progress | jq '.[] | select(.status_code == "ERROR")'
px span annotate <span-id> --name reviewer --label pass
px span annotate <span-id> --name checker --score 1 --annotator-kind CODE
px span add-note <span-id> --text "已由代理程式驗證"
```

### Span JSON 形狀 (Span JSON shape)

```
Span
  name, span_kind ("LLM"|"CHAIN"|"TOOL"|"RETRIEVER"|"EMBEDDING"|"AGENT"|"RERANKER"|"GUARDRAIL"|"EVALUATOR"|"UNKNOWN")
  status_code ("OK"|"ERROR"|"UNSET"), status_message
  context.span_id, context.trace_id, parent_id
  start_time, end_time
  attributes
    input.value, output.value          — 原始輸入/輸出
    llm.model_name, llm.provider
    llm.token_count.prompt/completion/total
    llm.input_messages.{N}.message.role/content
    llm.output_messages.{N}.message.role/content
    llm.invocation_parameters          — JSON 字串（溫度等）
    exception.message                  — 若 Span 發生錯誤則設定
  annotations[] (搭配 --include-annotations，不含筆記)
    name, result { score, label, explanation }
  notes[] (搭配 --include-notes)
    name="note", result { explanation }
```

## 工作階段 (Sessions)

```bash
px session list --limit 10 --format raw --no-progress | jq .
px session list --order asc --format raw --no-progress | jq '.[].session_id'
px session list --include-annotations --include-notes --format raw --no-progress | jq '.[].notes'
px session get <session-id> --format raw | jq .
px session get <session-id> --include-annotations --format raw | jq '.session.annotations'
px session get <session-id> --include-notes --format raw | jq '.session.notes'
px session annotate <session-id> --name reviewer --label pass
px session annotate <session-id> --name reviewer --score 0.9 --format raw --no-progress
px session add-note <session-id> --text "已由代理程式驗證"
```

### Session JSON 形狀 (Session JSON shape)

```
SessionData
  id, session_id, project_id
  start_time, end_time
  annotations[] (搭配 --include-annotations，不含筆記)
    name, result { score, label, explanation }
  notes[] (搭配 --include-notes)
    name="note", result { explanation }
  traces[]
    id, trace_id, start_time, end_time
```

## 資料集 / 實驗 / 提示詞 (Datasets / Experiments / Prompts)

```bash
px dataset list --format raw --no-progress | jq '.[].name'
px dataset get <名稱> --format raw | jq '.examples[] | {input, output: .expected_output}'
px dataset get <名稱> --split train --format raw | jq .    # 依 Split 篩選
px dataset get <名稱> --version <version-id> --format raw | jq .
px experiment list --dataset <名稱> --format raw --no-progress | jq '.[] | {id, name, failed_run_count}'
px experiment get <id> --format raw --no-progress | jq '.[] | select(.error != null) | {input, error}'
px prompt list --format raw --no-progress | jq '.[].name'
px prompt get <名稱> --format text --no-progress   # 純文字，非常適合透過管線傳送至 AI
```

## 標核配置 (Annotation Configs)

```bash
px annotation-config list                                           # 列出所有配置（表格檢視）
px annotation-config list --format raw --no-progress | jq '.[].name' # 以 JSON 格式獲取配置名稱
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

關鍵根欄位：`projects`, `datasets`, `prompts`, `evaluators`, `projectCount`, `datasetCount`, `promptCount`, `evaluatorCount`, `viewer`。

## 文件 (Docs)

下載 Phoenix 文件 Markdown 以供編碼代理程式在本地端使用。

```bash
px docs fetch                                # 擷取預設工作流程文件至 .px/docs
px docs fetch --workflow tracing             # 僅擷取追蹤文件
px docs fetch --workflow tracing --workflow evaluation
px docs fetch --dry-run                      # 預覽將下載的內容
px docs fetch --refresh                      # 清除 .px/docs 並重新下載
px docs fetch --output-dir ./my-docs         # 自訂輸出目錄
```

關鍵選項：`--workflow`（可重複使用，值：`tracing`, `evaluation`, `datasets`, `prompts`, `integrations`, `sdk`, `self-hosting`, `all`）、`--dry-run`、`--refresh`、`--output-dir`（預設 `.px/docs`）、`--workers`（預設 10）。
