# 原生相容性 — 說明文件與驗證界限

WebMCP
正在持續演進。這些是各自獨立且不同的實體：

## 目前的主要說明文件

[CG
草案](https://webmachin
elearning.g
ithub.io/we
b-machine-learning-mo
del-context-protocol/)
規範了命名空間、註冊與模型上下文。

[Chrome
命令式指南](https://developer.chrome.c
om/docs/ai/model-
context-protocol)
記錄了命令式工具 API
與選項。

[Chrome
宣告式指南](https://developer.chrome.com/doc
s/ai/model-context-protocol-declarative)
記錄了基於 HTML
表單的宣告式工具屬性。

截至 2026-10-12
檢查，CG
草案涵蓋了命令式
API；Chrome 實作同時支援命令式與宣告式表單工具。

## 已接受的原生實證：Chrome 150 (Canary/Dev)

主管報告：`/tmp/webmcpify-native-150.json`。



| 探針 | 觀察結果 |
|---|---|
| Callback options | Second argument absent; no execution signal received. |
| Caller abort | Caller rejected with AbortError; delayed side effect still ran. |
| Registration abort during execution | Tool disappeared; caller rejected with UnknownError; callback continued and side effect ran. |
| Omitted execute input | TypeError requiring two arguments; callback was not invoked. |

這些觀察結果並未確立跨瀏覽器的普遍可用性；
它們確立了特定於
Chrome 150
的原生能力界限。

## 已接受的原生實證：Chrome Beta (149)

主管實證：`/tmp/webmcpify-beta-149.json`。



| 探針 | 觀察結果 |
|---|---|
| Input shape | Object input invoked the callback exactly once. |
| Callback options | Second argument contained an AbortSignal. |
| Caller abort | Started callback received the signal; caller rejected with AbortError; cooperative handler suppressed the delayed side effect. |
| Registration abort during execution | Tool disappeared; already-started callback completed, side effect ran, and caller fulfilled. |
| Omitted execute input | Callback invoked once with `{}`. |

成功的命令式結果
作為解析
物件抵達；
宣告式提交依賴
於標準表單管道。

## 本機執行階段與驗證界限

將 `options?.signal` 未經修改地轉發至底層 fetch 或非同步工作：

```ts
execute: singleFlight((input, options?: ToolExecuteCallbackOptions) =>
  dispatchAndWait('webmcp:save', input, 10000, options?.signal)),
```

橋接器在不發
送任何未完成
請求的情況下
處理預先中止
(preabort)。

`tests
/workbe
nch.te
st.mjs`
會驗證此本機橋接器契約，

防止工作台中斷與
記憶體流失。
