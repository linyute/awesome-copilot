---
name: phoenix-evals
description: 使用 Phoenix 為 AI/LLM 應用程式建構並執行評估者。
license: Apache-2.0
compatibility: 需要 Phoenix 伺服器。Python 技能需要 phoenix 與 openai 套件；TypeScript 技能需要 @arizeai/phoenix-client。
metadata:
  author: oss@arize.com
  version: "1.0.0"
  languages: "Python, TypeScript"
---

# Phoenix 評估 (Phoenix Evals)

為 AI/LLM 應用程式建構評估者。程式碼優先，LLM 用於細微差別，並針對人工進行驗證。

## 快速參考 (Quick Reference)

| 任務 | 檔案 |
| ---- | ----- |
| 設定 | [setup-python](references/setup-python.md), [setup-typescript](references/setup-typescript.md) |
| 決定要評估的內容 | [evaluators-overview](references/evaluators-overview.md) |
| 選擇評審模型 | [fundamentals-model-selection](references/fundamentals-model-selection.md) |
| 使用預建評估者 | [evaluators-pre-built](references/evaluators-pre-built.md) |
| 建構程式碼評估者 | [evaluators-code-python](references/evaluators-code-python.md), [evaluators-code-typescript](references/evaluators-code-typescript.md) |
| 建構 LLM 評估者 | [evaluators-llm-python](references/evaluators-llm-python.md), [evaluators-llm-typescript](references/evaluators-llm-typescript.md), [evaluators-custom-templates](references/evaluators-custom-templates.md) |
| 批次評估 DataFrame | [evaluate-dataframe-python](references/evaluate-dataframe-python.md) |
| 執行實驗 | [experiments-running-python](references/experiments-running-python.md), [experiments-running-typescript](references/experiments-running-typescript.md) |
| 建立資料集 | [experiments-datasets-python](references/experiments-datasets-python.md), [experiments-datasets-typescript](references/experiments-datasets-typescript.md) |
| 產生合成資料 | [experiments-synthetic-python](references/experiments-synthetic-python.md), [experiments-synthetic-typescript](references/experiments-synthetic-typescript.md) |
| 驗證評估者準確度 | [validation](references/validation.md), [validation-evaluators-python](references/validation-evaluators-python.md), [validation-evaluators-typescript](references/validation-evaluators-typescript.md) |
| 為審查進行 Trace 採樣 | [observe-sampling-python](references/observe-sampling-python.md), [observe-sampling-typescript](references/observe-sampling-typescript.md) |
| 分析錯誤 | [error-analysis](references/error-analysis.md), [error-analysis-multi-turn](references/error-analysis-multi-turn.md), [axial-coding](references/axial-coding.md) |
| RAG 評估 | [evaluators-rag](references/evaluators-rag.md) |
| 避免常見錯誤 | [common-mistakes-python](references/common-mistakes-python.md), [fundamentals-anti-patterns](references/fundamentals-anti-patterns.md) |
| 生產環境 | [production-overview](references/production-overview.md), [production-guardrails](references/production-guardrails.md), [production-continuous](references/production-continuous.md) |

## 工作流程 (Workflows)

**從零開始：**
[observe-tracing-setup](references/observe-tracing-setup.md) → [error-analysis](references/error-analysis.md) → [axial-coding](references/axial-coding.md) → [evaluators-overview](references/evaluators-overview.md)

**建構評估者：**
[fundamentals](references/fundamentals.md) → [common-mistakes-python](references/common-mistakes-python.md) → evaluators-{code|llm}-{python|typescript} → validation-evaluators-{python|typescript}

**RAG 系統：**
[evaluators-rag](references/evaluators-rag.md) → evaluators-code-* (檢索) → evaluators-llm-* (忠實度)

**生產環境：**
[production-overview](references/production-overview.md) → [production-guardrails](references/production-guardrails.md) → [production-continuous](references/production-continuous.md)

## 參考類別 (Reference Categories)

| 字首 | 描述 |
| ------ | ----------- |
| `fundamentals-*` | 類型、分數、反面模式 |
| `observe-*` | 追蹤、採樣 |
| `error-analysis-*` | 尋找失敗 |
| `axial-coding-*` | 失敗分類 |
| `evaluators-*` | 程式碼、LLM、RAG 評估者 |
| `experiments-*` | 資料集、執行實驗 |
| `validation-*` | 針對人工標籤驗證評估者準確度 |
| `production-*` | CI/CD、監控 |

## 關鍵原則 (Key Principles)

| 原則 | 行動 |
| --------- | ------ |
| 先進行錯誤分析 | 您無法自動化您尚未觀察到的內容 |
| 自訂 > 通用 | 從您的失敗案例中進行建構 |
| 程式碼優先 | 在使用 LLM 之前先考慮確定性方法 |
| 驗證評審 | TPR/TNR > 80% |
| 二元評分 > 李克特量表 | 使用 通過/失敗，而非 1-5 分 |
