---
title: 'Mermaid 交付範例'
---

此綜合範例不包含任何專案或客戶資料。

## 核准流程

文件擁有者提交草稿。審查者可以核准或要求修改。

```mermaid
flowchart LR
    Draft[Draft] --> Review{Approved?}
    Review -->|Yes| Publish[Publish]
    Review -->|No| Revise[Revise]
    Revise --> Draft
```

## 日文標籤

```mermaid
flowchart LR
    Input[入力] --> Check{確認済み?}
    Check -->|はい| Output[出力]
    Check -->|いいえ| Return[差戻し]
```

## 高長圖表

此圖表用於演練縮放與明確的分頁規則。

```mermaid
flowchart TD
    Receive[Receive request] --> Validate[Validate input]
    Validate --> Read[Read Markdown]
    Read --> Parse[Parse blocks]
    Parse --> Render[Render SVG]
    Render --> Fallback[Render PNG fallback]
    Fallback --> Package[Package document]
    Package --> Inspect[Inspect package]
    Inspect --> Preview[Preview in Word]
    Preview --> Deliver[Deliver document]
```

## 一般內容

| 項目 | 預期結果 |
| ---- | --------------- |
| SVG  | 保留 SVG |
| PNG  | 保留 PNG |
| 文字 | 兩種語言 |

- 保留 Markdown 原始碼。
- 在 Word 中檢查文件。

> 向量輸出並非可編輯的 Office 流程圖。
