# 工作台迴歸測試 (Workbench regressions)

已使用
Node.js
24.18 與
`jsdom`
28.1.0
驗證離線 DOM 迴歸測試：

```sh
NODE_PATH=/path/to/existing/node_modules node --test --test-isolation=none skills/webmcpify/tests/*.test.mjs
```

無需下載任何
Playw
right
套件或瀏覽器引擎。

DOM
測試會執行工作台範本，
包括所有內嵌樣式、腳本與
互動式控制項，以驗證沒有語法錯誤、
元素遺失或狀態損毀。
