# 評估器：自訂範本 (Custom Templates)

設計 LLM 裁判提示 (judge prompts)。

## 完整範本模式 (Complete Template Pattern)

```python
TEMPLATE = """Evaluate faithfulness of the response to the context.

<context>{{context}}</context>
<response>{{output}}</response>

CRITERIA:
"faithful" = ALL claims supported by context
"unfaithful" = ANY claim NOT in context

EXAMPLES:
Context: "Price is $10" → Response: "It costs $10" → faithful
Context: "Price is $10" → Response: "About $15" → unfaithful

EDGE CASES:
- Empty context → cannot_evaluate
- "I don't know" when appropriate → faithful
- Partial faithfulness → unfaithful (strict)

Answer (faithful/unfaithful):"""
```

## 範本結構 (Template Structure)

1. 任務說明 (Task description)
2. XML 標籤中的輸入變數
3. 準則定義 (Criteria definitions)
4. 範例 (2-4 個案例)
5. 邊緣案例 (Edge cases)
6. 輸出格式 (Output format)

## XML 標籤

```
<question>{{input}}</question>
<response>{{output}}</response>
<context>{{context}}</context>
<reference>{{reference}}</reference>
```

## 常見錯誤 (Common Mistakes)

| 錯誤 | 修正方式 |
| ------- | --- |
| 準則模糊 | 精確定義每個標籤 |
| 缺乏範例 | 包含 2-4 個案例 |
| 格式不明確 | 指定精確的輸出 |
| 未考慮邊緣案例 | 處理歧義情況 |
