# WebMCP 工作台 — 臨時視覺檢查器

僅在資訊清單核准之後且在進
行原生驗證調查時使用工作台。

**唯讀檢查器：**僅檢查觀察到的、



已列舉的工具狀態。
不透過工作台發出未經核准的異動。

## 實證模式

-
**原生**表示頁面已向原生模型上下文公開工具。






針對每個宣告為
`verified`
的工具至少執行一次原生工作階段。

## 代理人管理的啟動（包含相依性）

代理人負責啟動與
停止工作台處理程序：

```sh
node <skill-dir>/scripts/workbench.mjs \
  --url https://the-recorded-verification-origin.test \
  --manifest .webmcpify/manifest.json \
  --browser chromium
```

啟動器會重用已安裝的
Playwright
瀏覽器或目前系統上的
Chrome。

-
`--allo
w-playw
right-i
nstall`
授權在缺少時下載瀏覽器。

兩個旗標互不隱含。
請勿在沒有使用者同意的情況下啟動靜態下載。

使用
`--native`
針對目前的
Chrome 原生 WebMCP 實作進行測試。

## 實體裝置或現有瀏覽器

當使用者需要確切的裝
置/瀏覽器
執行個體時：

```html
<script>
  globalThis.__WEBMCPIFY_WORKBENCH__ = {
    expectedTools: [/* approved manifest tools */],
    open: true
  };
</script>
<script src="/development-only/webmcp-workbench.js"></script>
```

代理人建
立並在之
後移除此
臨時標記。

## 互動契約

-
浮動的
`w`
啟動器不會遮蔽底層應用程式的關鍵控制項。








## 檢查重點

將觀察到的註冊狀態與
應用程式核准的資訊清單進行比較。




關於無障礙功能與
回應式檢查，
請參閱主要驗證指南。

