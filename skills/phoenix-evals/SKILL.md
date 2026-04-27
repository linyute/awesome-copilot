---
name: 'phoenix-evals'
description: '使用 Phoenix 建立並執行 AI/LLM 應用程式的評估器。'
license: 'Apache-2.0'
compatibility: '需要 Phoenix 伺服器。Python 技能需要 phoenix 和 openai 套件；TypeScript 技能需要 @arizeai/phoenix-client。'
metadata:
  author: 'oss@arize.com'
  version: '1.0.0'
  languages: 'Python, TypeScript'
---

# Phoenix Evals (評估)

為 AI/LLM 應用程式建立評估器。程式碼優先，LLM 用於細微差別，針對人類標記進行驗證。

## 快速參考 (Quick Reference)

| 任務 | 檔案 |
| ---- | ----- |
| 設定 (Setup) | [setup-python](references/setup-python.md), [setup-typescript](references/setup-typescript.md) |
| 決定要評估什麼 | [evaluators-overview](references/evaluators-overview.md) |
| 選擇裁判模型 | [fundamentals-model-selection](references/fundamentals-model-selection.md) |
| 使用內建評估器 | [evaluators-pre-built](references/evaluators-pre-built.md) |
| 建立程式碼評估器 | [evaluators-code-python](references/evaluators-code-python.md), [evaluators-code-typescript](references/evaluators-code-typescript.md) |
| 建立 LLM 評估器 | [evaluators-llm-python](references/evaluators-llm-python.md), [evaluators-llm-typescript](references/evaluators-llm-typescript.md), [evaluators-custom-templates](references/evaluators-custom-templates.md) |
| 批次評估 DataFrame | [evaluate-dataframe-python](references/evaluate-dataframe-python.md) |
| 執行實驗 (Run experiment) | [experiments-running-python](references/experiments-running-python.md), [experiments-running-typescript](references/experiments-running-typescript.md) |
| 建立資料集 (Create dataset) | [experiments-datasets-python](references/experiments-datasets-python.md), [experiments-datasets-typescript](references/experiments-datasets-typescript.md) |
| 產生合成資料 | [experiments-synthetic-python](references/experiments-synthetic-python.md), [experiments-synthetic-typescript](references/experiments-synthetic-typescript.md) |
| 驗證評估器準確率 | [validation](references/validation.md), [validation-evaluators-python](references/validation-evaluators-python.md), [validation-evaluators-typescript](references/validation-evaluators-typescript.md) |
| 抽樣追蹤以進行審查 | [observe-sampling-python](references/observe-sampling-python.md), [observe-sampling-typescript](references/observe-sampling-typescript.md) |
| 分析錯誤 | [error-analysis](references/error-analysis.md), [error-analysis-multi-turn](references/error-analysis-multi-turn.md), [axial-coding](references/axial-coding.md) |
| RAG 評估 | [evaluators-rag](references/evaluators-rag.md) |
| 避免常見錯誤 | [common-mistakes-python](references/common-mistakes-python.md), [fundamentals-anti-patterns.md](references/fundamentals-anti-patterns.md) |
| 生產 (Production) | [production-overview](references/production-overview.md), [production-guardrails](references/production-guardrails.md), [production-continuous](references/production-continuous.md) |

## 工作流程 (Workflows)

**從頭開始：**
[observe-tracing-setup](references/observe-tracing-setup.md) → [error-analysis](references/error-analysis.md) → [axial-coding](references/axial-coding.md) → [evaluators-overview](references/evaluators-overview.md)

**建立評估器：**
[fundamentals](references/fundamentals.md) → [common-mistakes-python](references/common-mistakes-python.md) → evaluators-{code|llm}-{python|typescript} → validation-evaluators-{python|typescript}

**RAG 系統：**
[evaluators-rag](references/evaluators-rag.md) → evaluators-code-* (擷取) → evaluators-llm-* (忠實度)

**生產環境：**
[production-overview](references/production-overview.md) → [production-guardrails](references/production-guardrails.md) → [production-continuous](references/production-continuous.md)

## 參考類別 (Reference Categories)

| 前綴 | 說明 |
| ------ | ----------- |
| `fundamentals-*` | 類型、分數、反模式 |
| `observe-*` | 追蹤、抽樣 |
| `error-analysis-*` | 尋找失敗 |
| `axial-coding-*` | 失敗歸類 |
| `evaluators-*` | 程式碼、LLM、RAG 評估器 |
| `experiments-*` | 資料集、執行實驗 |
| `validation-*` | 針對人類標記驗證評估器準確率 |
| `production-*` | CI/CD、監控 |

## 關鍵原則 (Key Principles)

| 原則 | 行動 |
| --------- | ------ |
| 先進行錯誤分析 | 您無法自動化尚未觀察到的內容 |
| 自訂勝過通用 | 從您的失敗案例中建立 |
| 程式碼優先 | 在使用 LLM 前先嘗試決定性方法 |
| 驗證裁判模型 | 達成 >80% TPR/TNR |
| 二元勝過李克特 | 使用通過/失敗，而非 1-5 分 |
