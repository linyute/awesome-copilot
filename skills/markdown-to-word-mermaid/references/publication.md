# 範圍與評估注意事項

## 範圍 vs. 一般 Markdown 轉換器

本技能將包含 Mermaid 程式碼區塊的 Markdown 文件轉換為 Word (`.docx`) 文件。它透過 Mermaid CLI 在本機轉譯圖表，透過 Office OOXML 關聯性 (`asvg:svgBlip`) 嵌入向量 SVG，保留 3 倍解析度 PNG 備用影像，並透過頁面感知排版保持高長圖表不被跨頁截斷。

像 `md-to-docx` 這類一般轉換器可處理 Markdown 內文與預先轉譯的 PNG 影像。當輸入包含必須轉譯為具備 Office 相容文字標籤 (`htmlLabels: false`) 與頁面感知尺寸的向量 SVG Mermaid 來源區塊時，請使用 `markdown-to-word-mermaid`。嵌入 SVG 並不會使個別圖表節點、連接線或標籤成為可編輯的原生 Word 圖形。

## 評估案例

| 輸入 / 請求 | 預期行為 |
| --- | --- |
| 將包含 Mermaid 流程圖的設計文件匯出為 Word | 選擇本技能，並在 DOCX 中同時嵌入向量 SVG 與 PNG 備用影像 |
| 將包含高長 Mermaid 圖表的運作手冊 (runbook) 匯出為 Word | 將圖表保持在同一頁面上，需要時從新分頁開始並進行縮放 |
| 轉換僅連結至既有 PNG 影像的純 Markdown 文件 | 若不需要 Mermaid 轉譯，優先使用一般 Markdown 轉 DOCX 轉換器 |
| 直接在 Word 內部編輯個別 Mermaid 形狀與連接線 | 說明嵌入的 SVG 並非可編輯的 Office 圖形，並建議可編輯圖表的工作流程 |
| Mermaid CLI 或相容的本機瀏覽器不可用 | 回報缺少先決條件，並在未獲核准前停止轉譯或安裝套件 |

## 驗證檢查清單

- 確認範例測試檔案 (fixture) 與產生的輸出不包含機密路徑、認證資訊或非綜合性資料。
- 執行單元測試套件 (`python -m unittest discover -s tests -v`)，以驗證 SVG 關聯性注入、PNG 備用影像保留、自訂字型傳播、排序清單編號、圖表替代文字、逾時處理以及原子性輸出暫存。
- 當設定了 `MERMAID_CLI` 時，針對 `assets/example.md` 執行真實轉譯器測試，並確認嵌入的 SVG 中沒有殘留 `foreignObject` 標籤元素。
- 將 Word 中的目視檢查與自動化套件測試分開執行，檢查標籤清晰度、連接線、字型外觀與分頁情況。
