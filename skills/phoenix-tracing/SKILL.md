---
name: phoenix-tracing
description: 用於 Phoenix AI 可觀測性的 OpenInference 語義慣例與檢測。在實作 LLM 追蹤、建立自訂 Span 或部署至生產環境時使用。
license: Apache-2.0
compatibility: 需要 Phoenix 伺服器。Python 技能需要 arize-phoenix-otel；TypeScript 技能需要 @arizeai/phoenix-otel。
metadata:
  author: oss@arize.com
  version: "1.0.0"
  languages: "Python, TypeScript"
---

# Phoenix 追蹤 (Phoenix Tracing)

在 Phoenix 中使用 OpenInference 追蹤來檢測 LLM 應用程式的完整指南。包含涵蓋設定、檢測、Span 類型以及生產環境部署的參考檔案。

## 何時套用 (When to Apply)

在下列情況參考這些指引：

- 設定 Phoenix 追蹤（Python 或 TypeScript）
- 為 LLM 操作建立自訂 Span
- 遵循 OpenInference 慣例新增屬性
- 將追蹤部署至生產環境
- 查詢與分析追蹤資料

## 參考類別 (Reference Categories)

| 優先順序 | 類別 | 描述 | 字首 |
| -------- | --------------- | ------------------------------ | -------------------------- |
| 1        | 設定 (Setup) | 安裝與配置 | `setup-*` |
| 2        | 檢測 (Instrumentation) | 自動與手動追蹤 | `instrumentation-*` |
| 3        | Span 類型 | 9 種 Span 種類及其屬性 | `span-*` |
| 4        | 組織 (Organization) | 專案與工作階段 | `projects-*`, `sessions-*` |
| 5        | 豐富化 (Enrichment) | 自訂屬性 | `metadata-*` |
| 6        | 生產環境 (Production) | 批次處理、遮蔽 (masking) | `production-*` |
| 7        | 回饋 (Feedback) | 標核 (Annotations) 與評估 | `annotations-*` |

## 快速參考 (Quick Reference)

### 1. 設定 (從此處開始) (1. Setup (START HERE))

- [setup-python](references/setup-python.md) - 安裝 arize-phoenix-otel，配置端點
- [setup-typescript](references/setup-typescript.md) - 安裝 @arizeai/phoenix-otel，配置端點

### 2. 檢測 (Instrumentation)

- [instrumentation-auto-python](references/instrumentation-auto-python.md) - 自動檢測 OpenAI, LangChain 等。
- [instrumentation-auto-typescript](references/instrumentation-auto-typescript.md) - 自動檢測支援的框架
- [instrumentation-manual-python](references/instrumentation-manual-python.md) - 使用裝飾器建立自訂 Span
- [instrumentation-manual-typescript](references/instrumentation-manual-typescript.md) - 使用包裝器建立自訂 Span

### 3. Span 類型（帶有完整的屬性結構描述） (3. Span Types (with full attribute schemas))

- [span-llm](references/span-llm.md) - LLM API 呼叫（模型、權杖、訊息、成本）
- [span-chain](references/span-chain.md) - 多步驟工作流程與管線
- [span-retriever](references/span-retriever.md) - 文件擷取（文件、分數）
- [span-tool](references/span-tool.md) - 函式/API 呼叫（名稱、參數）
- [span-agent](references/span-agent.md) - 多步驟推理代理程式
- [span-embedding](references/span-embedding.md) - 向量產生
- [span-reranker](references/span-reranker.md) - 文件重新排序
- [span-guardrail](references/span-guardrail.md) - 安全檢查
- [span-evaluator](references/span-evaluator.md) - LLM 評估

### 4. 組織 (Organization)

- [projects-python](references/projects-python.md) / [projects-typescript](references/projects-typescript.md) - 依應用程式將追蹤分組
- [sessions-python](references/sessions-python.md) / [sessions-typescript](references/sessions-typescript.md) - 追蹤對話

### 5. 豐富化 (Enrichment)

- [metadata-python](references/metadata-python.md) / [metadata-typescript](references/metadata-typescript.md) - 自訂屬性

### 6. 生產環境 (至關重要) (6. Production (CRITICAL))

- [production-python](references/production-python.md) / [production-typescript](references/production-typescript.md) - 批次處理、PII 遮蔽

### 7. 回饋 (Feedback)

- [annotations-overview](references/annotations-overview.md) - 回饋概念
- [annotations-python](references/annotations-python.md) / [annotations-typescript](references/annotations-typescript.md) - 為 Span 新增回饋

### 參考檔案 (Reference Files)

- [fundamentals-overview](references/fundamentals-overview.md) - 追蹤、Span、屬性基礎
- [fundamentals-required-attributes](references/fundamentals-required-attributes.md) - 每個 Span 類型的必填欄位
- [fundamentals-universal-attributes](references/fundamentals-universal-attributes.md) - 通用屬性 (user.id, session.id)
- [fundamentals-flattening](references/fundamentals-flattening.md) - JSON 扁平化規則
- [attributes-messages](references/attributes-messages.md) - 對話訊息格式
- [attributes-metadata](references/attributes-metadata.md) - 自訂 Metadata 結構描述
- [attributes-graph](references/attributes-graph.md) - 代理程式工作流程屬性
- [attributes-exceptions](references/attributes-exceptions.md) - 錯誤追蹤

## 常見工作流程 (Common Workflows)

- **快速開始**：setup-{lang} → instrumentation-auto-{lang} → 檢查 Phoenix
- **自訂 Span**：setup-{lang} → instrumentation-manual-{lang} → span-{type}
- **工作階段追蹤**：參考 sessions-{lang} 以瞭解對話分組模式
- **生產環境**：參考 production-{lang} 以瞭解批次處理、遮蔽與部署

## 如何使用此技能 (How to Use This Skill)

**導覽模式：**

```bash
# 依類別字首
references/setup-*              # 安裝與配置
references/instrumentation-*    # 自動與手動追蹤
references/span-*               # Span 類型規範
references/sessions-*           # 工作階段追蹤
references/production-*         # 生產環境部署
references/fundamentals-*       # 核心概念
references/attributes-*         # 屬性規範

# 依語言
references/*-python.md          # Python 實作
references/*-typescript.md      # TypeScript 實作
```

**閱讀順序：**
1. 從適用於您語言的 setup-{lang} 開始
2. 選擇 instrumentation-auto-{lang} 或 instrumentation-manual-{lang}
3. 視需要針對特定操作參考 span-{type} 檔案
4. 參見 fundamentals-* 檔案以瞭解屬性規範

## 參考資料 (References)

**Phoenix 文件：**

- [Phoenix Documentation](https://docs.arize.com/phoenix)
- [OpenInference Spec](https://github.com/Arize-ai/openinference/tree/main/spec)

**Python API 文件：**

- [Python OTEL Package](https://arize-phoenix.readthedocs.io/projects/otel/en/latest/) - `arize-phoenix-otel` API 參考
- [Python Client Package](https://arize-phoenix.readthedocs.io/projects/client/en/latest/) - `arize-phoenix-client` API 參考

**TypeScript API 文件：**

- [TypeScript Packages](https://arize-ai.github.io/phoenix/) - `@arizeai/phoenix-otel`, `@arizeai/phoenix-client` 以及其他 TypeScript 套件
