# Edit Tutorial 外掛程式

將 Copilot 在工作階段中所做的程式碼編輯轉化為互動式課程：透過變更前後的檢視與測驗，逐步引導瀏覽每項變更，接著進行實作練習以變化這些編輯內容，讓您親自完成變更。

## 安裝

```bash
copilot plugin install edit-tutorial@awesome-copilot
```

## 運作方式

1. 讓 Copilot 對您的程式碼進行變更，然後開啟 Edit Tutorial 畫布並點擊「Build my tutorial」（或直接提問：「teach me what you changed」）。
2. Copilot 會審查其在工作階段中所做的編輯並發佈課程：每個重點變更為一個步驟，各包含檔案、說明、變更前後檢視表以及選用的理解度測驗。
3. 逐步完成這些步驟。完成後即可解鎖練習題：將相同的技巧套用至稍有不同的目標，例如另一個函式或不同的參數值。
4. 在畫布編輯器中撰寫您的解決方案。「Check my work」會在本地執行課程檢查、提示會逐一顯示，而「Ask Copilot for a review」則會將您的嘗試傳送至聊天室進行指導。通過檢查或獲得核准的審查即完成課程。

## 範例

若 Copilot 在範例專案中將具有輪詢輪詢退避機制的邏輯新增至 `fetchUser`，課程會逐步引導說明該變更，然後要求您使用不同的重試上限與初始延遲將相同的模式套用至 `fetchOrders`。

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分。

## 授權條款

MIT
