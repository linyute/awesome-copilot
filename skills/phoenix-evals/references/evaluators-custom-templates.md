# 評估者：自訂範本 (Evaluators: Custom Templates)

設計 LLM 評審提示詞。

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

1. 任務描述 (Task description)
2. 使用 XML 標籤包覆的輸入變數
3. 標準定義 (Criteria definitions)
4. 範例 (2-4 個案例)
5. 邊緣情況 (Edge cases)
6. 輸出格式 (Output format)

## XML 標籤 (XML Tags)

```
<question>{{input}}</question>
<response>{{output}}</response>
<context>{{context}}</context>
<reference>{{reference}}</reference>
```

## 常見錯誤 (Common Mistakes)

| 錯誤 | 修復方式 |
| ------- | --- |
| 標準模糊 | 精確定義每個標籤 |
| 沒有範例 | 包含 2-4 個案例 |
| 格式不明確 | 指定精確的輸出 |
| 未考慮邊緣情況 | 處理模糊性 |
