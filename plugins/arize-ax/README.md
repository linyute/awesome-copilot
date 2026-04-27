# Arize AX 外掛程式

Arize AX 平台技能，用於大型語言模型 (LLM) 的可觀測性、評估與最佳化。包含追蹤匯出 (trace export)、檢測 (instrumentation)、資料集、實驗、評估器、AI 提供者整合、標註 (annotations)、提示詞 (prompt) 最佳化，以及指向 Arize 使用者介面的深層連結。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install arize-ax@awesome-copilot
```

## 包含的內容

### 技能

| 技能 | 描述 |
|-------|-------------|
| `arize-trace` | 使用 ax CLI 匯出並分析 Arize 追蹤和範圍 (spans)，以偵錯大型語言模型應用程式。 |
| `arize-instrumentation` | 使用兩階段代理輔助工作流程，將 Arize AX 追蹤加入到應用程式中。 |
| `arize-dataset` | 使用 ax CLI 建立、管理和查詢版本化的評估資料集。 |
| `arize-experiment` | 使用 ax CLI 針對資料集執行實驗並比較結果。 |
| `arize-evaluator` | 建立並執行「大語言模型作為裁判」(LLM-as-judge) 評估器，對範圍和實驗進行自動化評分。 |
| `arize-ai-provider-integration` | 儲存並管理大型語言模型提供者的憑證，以供評估器使用。 |
| `arize-annotation` | 建立標註設定，並將人工反饋標籤大量套用到範圍中。 |
| `arize-prompt-optimization` | 使用生產追蹤資料、評估和標註來最佳化大型語言模型的提示詞。 |
| `arize-link` | 產生指向 Arize 使用者介面的深層連結，以獲取追蹤、範圍、工作階段、資料集等資訊。 |
