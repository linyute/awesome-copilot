# Arize AX 外掛程式

用於 LLM 可觀測性、評估與最佳化的 Arize AX 平台技能。包含追蹤匯出、檢測（instrumentation）、資料集、實驗、評估器、AI 提供者整合、標註、提示最佳化，以及指向 Arize UI 的深層連結。

## 安裝

```bash
# Using Copilot CLI
copilot plugin install arize-ax@awesome-copilot
```

## 包含內容

### 技能

| 技能 | 說明 |
|-------|-------------|
| `arize-trace` | 使用 ax CLI 匯出並分析 Arize 追蹤與 span，以針對 LLM 應用程式進行除錯。 |
| `arize-instrumentation` | 使用兩階段 agent 輔助工作流程，將 Arize AX 追蹤加入至應用程式中。 |
| `arize-dataset` | 使用 ax CLI 建立、管理及查詢具版本控制的評估資料集。 |
| `arize-experiment` | 使用 ax CLI 針對資料集執行實驗並比較結果。 |
| `arize-evaluator` | 建立並執行 LLM-as-judge 評估器，以對 span 和實驗進行自動評分。 |
| `arize-ai-provider-integration` | 儲存並管理 LLM 提供者認證資訊，以供評估器使用。 |
| `arize-annotation` | 建立標註設定並將人類回饋標籤批次套用至 span。 |
| `arize-prompt-optimization` | 使用實際正式環境追蹤資料、評估與標註來最佳化 LLM 提示。 |
| `arize-link` | 針對追蹤、span、工作階段、資料集等產生指向 Arize UI 的深層連結。 |
