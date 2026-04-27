---
name: 'phoenix-tracing'
description: '適用於 Phoenix AI 可觀測性 (observability) 的 OpenInference 語義慣例 (semantic conventions) 與檢測 (instrumentation)。在實作 LLM 追蹤、建立自訂 spans 或部署至生產環境時使用。'
license: 'Apache-2.0'
compatibility: '需要 Phoenix 伺服器。Python 技能需要 arize-phoenix-otel；TypeScript 技能需要 @arizeai/phoenix-otel。'
metadata:
  author: 'oss@arize.com'
  version: '1.0.0'
  languages: 'Python, TypeScript'
---

# Phoenix 追蹤 (Tracing)

在 Phoenix 中使用 OpenInference 追蹤來檢測 (instrumenting) LLM 應用程式的完整指南。包含涵蓋設定、檢測、span 種類以及生產部署的參考檔案。

## 何時適用 (When to Apply)

在下列情況下請參考這些指南：

- 設定 Phoenix 追蹤（Python 或 TypeScript）
- 為 LLM 操作建立自訂 spans
- 遵循 OpenInference 慣例加入屬性
- 將追蹤部署至生產環境
- 查詢與分析追蹤資料

## 參考類別 (Reference Categories)

| 優先權 | 類別 | 說明 | 前綴 |
| -------- | --------------- | ------------------------------ | -------------------------- |
| 1 | 設定 (Setup) | 安裝與組態 | `setup-*` |
| 2 | 檢測 (Instrumentation) | 自動與手動追蹤 | `instrumentation-*` |
| 3 | Span 種類 | 9 種 span 種類及其屬性 | `span-*` |
| 4 | 組織 (Organization) | 專案 (Projects) 與階段 (Sessions) | `projects-*`, `sessions-*` |
| 5 | 豐富化 (Enrichment) | 自訂 Metadata | `metadata-*` |
| 6 | 生產 (Production) | 批次處理、資料遮罩 | `production-*` |
| 7 | 回饋 (Feedback) | 標記 (Annotations) 與評估 | `annotations-*` |

## 快速參考 (Quick Reference)

### 1. 設定 (請從此處開始)

- [setup-python](references/setup-python.md) - 安裝 arize-phoenix-otel，設定端點 (endpoint)
- [setup-typescript](references/setup-typescript.md) - 安裝 @arizeai/phoenix-otel，設定端點

### 2. 檢測 (Instrumentation)

- [instrumentation-auto-python](references/instrumentation-auto-python.md) - 自動檢測 OpenAI、LangChain 等。
- [instrumentation-auto-typescript](references/instrumentation-auto-typescript.md) - 自動檢測支援的框架
- [instrumentation-manual-python](references/instrumentation-manual-python.md) - 使用裝飾器建立自訂 spans
- [instrumentation-manual-typescript](references/instrumentation-manual-typescript.md) - 使用包裝器建立自訂 spans

### 3. Span 種類（包含完整的屬性結構/attribute schemas）

- [span-llm](references/span-llm.md) - LLM API 呼叫（模型、符記/tokens、訊息、成本）
- [span-chain](references/span-chain.md) - 多步驟工作流程與管線 (pipelines)
- [span-retriever](references/span-retriever.md) - 文件擷取（文件、分數）
- [span-tool](references/span-tool.md) - 函式/API 呼叫（名稱、參數）
- [span-agent](references/span-agent.md) - 多步驟推理代理 (reasoning agents)
- [span-embedding](references/span-embedding.md) - 向量產生
- [span-reranker](references/span-reranker.md) - 文件重排
- [span-guardrail](references/span-guardrail.md) - 安全檢查
- [span-evaluator](references/span-evaluator.md) - LLM 評估

### 4. 組織 (Organization)

- [projects-python](references/projects-python.md) / [projects-typescript](references/projects-typescript.md) - 按應用程式對追蹤進行分組
- [sessions-python](references/sessions-python.md) / [sessions-typescript](references/sessions-typescript.md) - 追蹤對話

### 5. 豐富化 (Enrichment)

- [metadata-python](references/metadata-python.md) / [metadata-typescript](references/metadata-typescript.md) - 自訂屬性

### 6. 生產 (Production) (關鍵提醒)

- [production-python](references/production-python.md) / [production-typescript](references/production-typescript.md) - 批次處理、PII 遮罩

### 7. 回饋 (Feedback)

- [annotations-overview](references/annotations-overview.md) - 回饋概念
- [annotations-python](references/annotations-python.md) / [annotations-typescript](references/annotations-typescript.md) - 將回饋加入至 spans

### 參考檔案

- [fundamentals-overview](references/fundamentals-overview.md) - 追蹤、spans、屬性基本概念
- [fundamentals-required-attributes](references/fundamentals-required-attributes.md) - 每種 span 種類的必要欄位
- [fundamentals-universal-attributes](references/fundamentals-universal-attributes.md) - 通用屬性（user.id, session.id）
- [fundamentals-flattening](references/fundamentals-flattening.md) - JSON 扁平化規則
- [attributes-messages](references/attributes-messages.md) - 聊天訊息格式
- [attributes-metadata](references/attributes-metadata.md) - 自訂 Metadata 結構
- [attributes-graph](references/attributes-graph.md) - 代理工作流程屬性
- [attributes-exceptions](references/attributes-exceptions.md) - 錯誤追蹤

## 常見工作流程 (Common Workflows)

- **快速開始**：setup-{lang} → instrumentation-auto-{lang} → 檢查 Phoenix
- **自訂 Spans**：setup-{lang} → instrumentation-manual-{lang} → span-{type}
- **階段追蹤**：sessions-{lang} 用於對話分組模式
- **生產環境**：production-{lang} 用於批次處理、遮罩與部署

## 如何使用此技能

**導覽模式 (Navigation Patterns)：**

```bash
# 按類別前綴
references/setup-*              # 安裝與組態
references/instrumentation-*    # 自動與手動追蹤
references/span-*               # Span 種類規格
references/sessions-*           # 階段追蹤
references/production-*         # 生產環境部署
references/fundamentals-*       # 核心概念
references/attributes-*         # 屬性規格

# 按語言
references/*-python.md          # Python 實作
references/*-typescript.md      # TypeScript 實作
```

**閱讀順序：**
1. 從您所使用語言的 setup-{lang} 開始
2. 選擇 instrumentation-auto-{lang} 或 instrumentation-manual-{lang}
3. 視特定操作需要，參考 span-{type} 檔案
4. 參閱 fundamentals-* 檔案以取得屬性規格

## 參考資料 (References)

**Phoenix 文件：**

- [Phoenix 文件](https://docs.arize.com/phoenix)
- [OpenInference 規格](https://github.com/Arize-ai/openinference/tree/main/spec)

**Python API 文件：**

- [Python OTEL 套件](https://arize-phoenix.readthedocs.io/projects/otel/en/latest/) - `arize-phoenix-otel` API 參考
- [Python Client 套件](https://arize-phoenix.readthedocs.io/projects/client/en/latest/) - `arize-phoenix-client` API 參考

**TypeScript API 文件：**

- [TypeScript 套件](https://arize-ai.github.io/phoenix/) - `@arizeai/phoenix-otel`、`@arizeai/phoenix-client` 以及其他 TypeScript 套件
