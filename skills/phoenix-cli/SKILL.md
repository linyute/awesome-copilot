---
name: phoenix-cli
description: 使用 Phoenix CLI 偵錯 LLM 應用程式。獲取追蹤、分析錯誤、使用開放編碼和軸心編碼結構化追蹤審查、檢查資料集、審查實驗、查詢註釋配置以及使用 GraphQL API。當使用者正在分析追蹤或 span、調查 LLM/代理程式失敗、決定在檢測應用程式後要做什麼、建立失敗分類法、選擇要撰寫哪些評估或詢問「出了什麼問題」、「有哪些類型的錯誤」或「我該關注哪裡」時使用 — 即使沒有命名具體的技術。
license: Apache-2.0
compatibility: 需要 Node.js (用於 npx) 或全域安裝 @arizeai/phoenix-cli。選用 jq 以進行 JSON 處理。
metadata:
  author: arize-ai
  version: "3.3.0"
---

# Phoenix CLI

## 調用方式

```bash
px <資源> <動作>                          # 如果已全域安裝
npx @arizeai/phoenix-cli <資源> <動作>    # 不需要安裝
```

CLI 使用單數資源命令搭配子命令，例如 `list` 和 `get`：

```bash
px trace list
px trace get <trace-id>
px trace annotate <trace-id>
px trace add-note <trace-id>
px trace-annotations delete
px span list
px span annotate <span-id>
px span add-note <span-id>
px span-annotations delete
px session list
px session get <session-id>
px session annotate <session-id>
px session add-note <session-id>
px session-annotations delete
px dataset list
px dataset get <名稱>
px project list
px project get <名稱>
px annotation-config list
px auth status
px profile list
px profile show [名稱]
px profile create <名稱>
px profile use <名稱>
px profile edit <名稱>
px profile delete <名稱>
```

## 設定

```bash
export PHOENIX_HOST=http://localhost:6006
export PHOENIX_PROJECT=my-project
export PHOENIX_API_KEY=your-api-key  # 如果已啟用驗證
```

在傳輸到 `jq` 時，請務必使用 `--format raw --no-progress`。

## 快速參考

| 任務 | 檔案 |
| ---- | ----- |
| 查看抽樣的追蹤、span 或對話，並撰寫關於出錯之處的特定筆記 (尚未建立分類法) | [references/open-coding](references/open-coding.md) |
| 將這些筆記分組為結構化的失敗分類法，並量化重要的內容 | [references/axial-coding](references/axial-coding.md) |

這兩個階段都會為每個產出物標記一個共享的 **編碼註釋識別碼 (coding annotation identifier)**（具描述性的形式，例如 `coding-run:chatbot-context-loss-2026-05-06`），以便該執行操作是可查詢、可還原且可作為整體查看的。在每次 `px` 呼叫中明確傳遞 `--identifier <值>` — 在各個代理程式導向裝置中，Shell 繼承是不具可靠性的。開放編碼透過 `px ... add-note` 撰寫筆記，並在 `.px/coding/<標準化後的識別碼>.jsonl` 記錄一個小型本機 JSONL 附屬檔案；軸心編碼將該附屬檔案視為確定的移交內容進行讀取，並在 `.px/coding/<標準化後的識別碼>-axial.jsonl` 中記錄標籤。在每次執行中選取一次識別碼（請參閱 [references/open-coding.md](references/open-coding.md#編碼註釋識別碼 — 優先選取此項)），然後從總結部分分享 Phoenix UI 連結。還原是可選擇的，且僅在使用者明確確認後才執行三個與識別碼繫結的 DELETE 動作。

> **工作流程術語 vs. 伺服器註釋名稱。** 此技能文字將此值稱為 **編碼註釋識別碼** (Shell 變數提示：`CODING_ANNOTATION_IDENTIFIER`)。用於 UI 篩選器的伺服器端註釋名稱 (NAME) 保持不變 — `coding_session_id` — 以保持與先前執行已寫入之資料列的資料相容性。不要嘗試重新命名伺服器端註釋；請將這種不對稱性視為結構的一部分。

## 工作流程

**「在檢測後我該做什麼？」 / 「我該關注哪裡？」 / 「出了什麼問題？」**
[開放編碼 (open-coding)](references/open-coding.md) → [軸心編碼 (axial-coding)](references/axial-coding.md) → 為熱門類別建構評估。

## 參考類別

| 前綴 | 說明 |
| ------ | ----------- |
| `references/open-coding` | 針對抽樣的追蹤、span 或對話撰寫自由格式的筆記 — 每當使用者想要理解 LLM 流量但尚無失敗類別時使用。包含一個分析單位診斷程序，以便工作流程在失敗模式實際所在的層級執行 (對無狀態的單次呼叫使用追蹤，對多輪代理程式使用對話，對機械性/孤立失敗使用 span)。 |
| `references/axial-coding` | 將筆記歸納分組到具有計數的 MECE 分類法中 — 每當使用者已有觀察結果並需要類別或評估目標時使用。 |

## 驗證 (Auth)

```bash
px auth status                                # 檢查連線和驗證
px auth status --endpoint http://other:6006   # 檢查特定的端點
px auth status --profile staging              # 檢查具名設定檔的連線
```

## 設定檔 (Profiles)

具名設定檔讓您可以在多個 Phoenix 實體（本機、預備環境、雲端）之間切換，而無需處理環境變數。設定檔儲存在 `~/.px/settings.json` (或 `$XDG_CONFIG_HOME/px/settings.json`) 中。

配置優先順序（由高至低）：CLI 旗標 > 環境變數 > 作用中設定檔 > 內建預設值。

```bash
px profile list                              # 列出所有設定檔 (顯示作用中設定檔)
px profile show                              # 顯示作用中設定檔的設定
px profile show staging                      # 顯示具名設定檔的設定
px profile create prod --endpoint https://app.phoenix.arize.com --api-key <金鑰> --activate
px profile create local --endpoint http://localhost:6006 --project my-app
px profile use prod                          # 切換作用中設定檔
px profile edit prod                         # 在 $EDITOR 中開啟設定檔 JSON (儲存時驗證)
px profile delete prod --yes                 # 刪除設定檔 (--yes 可跳過確認)
```

在任何命令上使用 `--profile <名稱>` 來鎖定特定的設定檔，而不更改作用中設定檔：

```bash
px trace list --profile staging --limit 10 --format raw --no-progress | jq .
px auth status --profile prod
```

`px profile create` 選項：`--endpoint <url>`、`--project <名稱>`、`--api-key <金鑰>`、`--header <鍵=值>` (可重複)、`--activate`。

## 專案 (Projects)

```bash
px project list                                            # 列出所有專案 (表格檢視)
px project list --format raw --no-progress | jq '.[].name' # 專案名稱 (以 JSON 格式)
px project get my-project --format raw --no-progress       # 按精確名稱獲取單一記錄
px project get my-project --format raw --no-progress | jq -r '.id'  # 擷取專案 ID
```

當名稱不符時，`project get` 會以 `ExitCode.FAILURE` (1) 退出，並在 `--format json|raw` 中向 stderr 寫入一個 `StructuredError` `{error, code: "FAILURE", hint}`。

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
px trace annotate <trace-id> --name reviewer --label pass --identifier "<編碼註釋識別碼>"  # 標記編碼註釋識別碼
px trace add-note <trace-id> --text "需要後續追蹤"
px trace add-note <trace-id> --text "需要後續追蹤" --identifier "<編碼註釋識別碼>"  # 標記 + 在識別碼上更新
px trace-annotations delete --identifier "<編碼註釋識別碼>" --all -y            # 刪除與此編碼註釋識別碼繫結的所有註釋
```

`px <實體>-annotations delete` 需要 `--all` 或者同時具備 `--start-time` 和 `--end-time`，並在成功時發出 `{deleted: true, target, filter}`。

### 追蹤 JSON 形狀

```
Trace
  traceId, status ("OK"|"ERROR"), duration (ms), startTime, endTime
  annotations[] (包含 --include-annotations，排除 note)
    name, result { score, label, explanation }
  notes[] (包含 --include-notes)
    name="note", result { explanation }
  rootSpan  — 頂層 span (parent_id: null)
  spans[]
    name, span_kind ("LLM"|"CHAIN"|"TOOL"|"RETRIEVER"|"EMBEDDING"|"AGENT"|"RERANKER"|"GUARDRAIL"|"EVALUATOR"|"UNKNOWN")
    status_code ("OK"|"ERROR"|"UNSET"), parent_id, context.span_id
    notes[] (包含 --include-notes)
      name="note", result { explanation }
    attributes
      input.value, output.value          — 原始輸入/輸出
      llm.model_name, llm.provider
      llm.token_count.prompt/completion/total
      llm.token_count.prompt_details.cache_read
      llm.token_count.completion_details.reasoning
      llm.input_messages.{N}.message.role/content
      llm.output_messages.{N}.message.role/content
      llm.invocation_parameters          — JSON 字串 (溫度等)
      exception.message                  — 如果 span 發生錯誤則設定
```

## Spans

```bash
px span list --limit 20                                    # 最近的 span (表格檢視)
px span list --last-n-minutes 60 --limit 50                # 過去一小時內的 span
px span list --since 2025-01-15T00:00:00Z --limit 50       # 自時間戳記以來的 span
px span list --span-kind LLM --limit 10                    # 僅 LLM span
px span list --status-code ERROR --limit 20                # 僅出錯的 span
px span list --name chat_completion --limit 10             # 按 span 名稱篩選
px span list --trace-id <id> --format raw --no-progress | jq .   # 追蹤的所有 span
px span list --parent-id null --limit 10                   # 僅根 span
px span list --parent-id <span-id> --limit 10              # 僅 span 的子項
px span list --include-annotations --limit 10              # 包含註釋分數
px span list --include-notes --limit 10                    # 包含 span 筆記
px span list --attribute llm.model_name:gpt-4 --limit 10  # 按字串屬性篩選
px span list --attribute llm.token_count.total:500 --limit 10  # 按數值屬性篩選
px span list --attribute 'user.id:"12345"' --limit 10     # 對看似數值的值強制進行字串比對
px span list --attribute session.id:sess:abc:123 --limit 20  # 值中包含冒號也可以 (僅在第一個冒號處分割)
px span list --attribute llm.model_name:gpt-4 --attribute session.id:abc --limit 10  # 且 (AND) 多個篩選器
px span list output.json --limit 100                       # 儲存到 JSON 檔案
px span list --format raw --no-progress | jq '.[] | select(.status_code == "ERROR")'
px span annotate <span-id> --name reviewer --label pass
px span annotate <span-id> --name checker --score 1 --annotator-kind CODE
px span annotate <span-id> --name reviewer --label pass --identifier "<編碼註釋識別碼>"  # 標記編碼註釋識別碼
px span add-note <span-id> --text "由代理程式驗證"
px span add-note <span-id> --text "由代理程式驗證" --identifier "<編碼註釋識別碼>"  # 標記 + 在識別碼上更新
px span-annotations delete --identifier "<編碼註釋識別碼>" --all -y           # 刪除與此編碼註釋識別碼繫結的所有註釋
```

### Span JSON 形狀

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
    llm.invocation_parameters          — JSON 字串 (溫度等)
    exception.message                  — 如果 span 發生錯誤則設定
  annotations[] (包含 --include-annotations，排除 note)
    name, result { score, label, explanation }
  notes[] (包含 --include-notes)
    name="note", result { explanation }
```

## 對話 (Sessions)

```bash
px session list --limit 10 --format raw --no-progress | jq .
px session list --order asc --format raw --no-progress | jq '.[].session_id'
px session list --include-annotations --include-notes --format raw --no-progress | jq '.[].notes'
px session get <session-id> --format raw | jq .
px session get <session-id> --include-annotations --format raw | jq '.session.annotations'
px session get <session-id> --include-notes --format raw | jq '.session.notes'
px session annotate <session-id> --name reviewer --label pass
px session annotate <session-id> --name reviewer --score 0.9 --format raw --no-progress
px session annotate <session-id> --name reviewer --label pass --identifier "<編碼註釋識別碼>"  # 標記編碼註釋識別碼
px session add-note <session-id> --text "由代理程式驗證"
px session add-note <session-id> --text "由代理程式驗證" --identifier "<編碼註釋識別碼>"  # 標記 + 在識別碼上更新
px session-annotations delete --identifier "<編碼註釋識別碼>" --all -y              # 刪除與此編碼註釋識別碼繫結的所有註釋
```

### 對話 JSON 形狀

```
SessionData
  id, session_id, project_id
  start_time, end_time
  token_count_prompt, token_count_completion, token_count_total  — 對話中所有 LLM span 的累計值 (int，預設為 0)
  annotations[] (包含 --include-annotations，排除 note)
    name, result { score, label, explanation }
  notes[] (包含 --include-notes)
    name="note", result { explanation }
  traces[]
    id, trace_id, start_time, end_time
```

## 資料集 / 實驗 / 提示 (Datasets / Experiments / Prompts)

```bash
px dataset list --format raw --no-progress | jq '.[].name'
px dataset get <名稱> --format raw | jq '.examples[] | {input, output: .expected_output}'
px dataset get <名稱> --split train --format raw | jq .    # 按 split 篩選
px dataset get <名稱> --version <版本-id> --format raw | jq .
px experiment list --dataset <名稱> --format raw --no-progress | jq '.[] | {id, name, failed_run_count}'
px experiment get <id> --format raw --no-progress | jq '.[] | select(.error != null) | {input, error}'
px prompt list --format raw --no-progress | jq '.[].name'
px prompt get <名稱> --format text --no-progress   # 純文字，適合傳輸到 AI
```

## 註釋配置 (Annotation Configs)

```bash
px annotation-config list                                           # 列出所有配置 (表格檢視)
px annotation-config list --format raw --no-progress | jq '.[].name' # 配置名稱 (以 JSON 格式)
```

## GraphQL

用於上述命令未涵蓋的臨機查詢。輸出為 `{"data": {...}}`。

```bash
px api graphql '{ projectCount datasetCount promptCount evaluatorCount }'
px api graphql '{ projects { edges { node { name traceCount tokenCountTotal } } } }' | jq '.data.projects.edges[].node'
px api graphql '{ datasets { edges { node { name exampleCount experimentCount } } } }' | jq '.data.datasets.edges[].node'
px api graphql '{ evaluators { edges { node { name kind } } } }' | jq '.data.evaluators.edges[].node'

# 內省任何類型
px api graphql '{ __type(name: "Project") { fields { name type { name } } } }' | jq '.data.__type.fields[]'
```

關鍵根欄位：`projects`、`datasets`、`prompts`、`evaluators`、`projectCount`、`datasetCount`、`promptCount`、`evaluatorCount`、`viewer`。

## 文件 (Docs)

下載 Phoenix 文件 Markdown 以供編碼代理程式在本機使用。

```bash
px docs fetch                                # 下載預設的工作流程文件至 .px/docs
px docs fetch --workflow tracing             # 僅下載追蹤文件
px docs fetch --workflow tracing --workflow evaluation
px docs fetch --dry-run                      # 預覽將下載的內容
px docs fetch --refresh                      # 清除 .px/docs 並重新下載
px docs fetch --output-dir ./my-docs         # 自定義輸出目錄
```

關鍵選項：`--workflow` (可重複，值：`tracing`、`evaluation`、`datasets`、`prompts`、`integrations`、`sdk`、`self-hosting`、`all`)、`--dry-run`、`--refresh`、`--output-dir` (預設為 `.px/docs`)、`--workers` (預設為 10)。
