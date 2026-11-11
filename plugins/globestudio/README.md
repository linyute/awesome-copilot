# Globestudio 外掛程式

為您的網站提供點陣世界地圖與 3D 動畫地球儀，一次安裝即可搞定：`globestudio` 技能可將設計撰寫為單一設定並嵌入，而託管的 [Globestudio](https://globestudio.app) MCP 伺服器則提供預設集、分享連結與嵌入程式碼。

## 安裝

```bash
copilot plugin install globestudio@awesome-copilot
```

## 包含內容

### 技能

| 技能 | 說明 |
|-------|-------------|
| `globestudio` | 使用 Globestudio 的 21 種外觀建立、編輯並嵌入點陣世界地圖與 3D 動畫地球儀：將設計化為單一 JSON 設定，透過 `@globestudio/react`、`<globe-studio>` Web 元件或 iframe 嵌入，並支援區域、資料點與弧線、品牌色彩，以及匯出為 PNG、SVG、GLB、MP4、WebM 或 GIF。隨附設定機碼、嵌入方式與外觀的參考檔案。 |

### MCP 伺服器

此外掛程式包含在 [`./mcp.json`](./mcp.json) 中設定的 `globestudio` MCP 伺服器，託管於 https://globestudio.app/mcp。它不需要帳戶或 API 金鑰，也不會儲存任何內容：每個工具都是建構或讀取連結。

| 工具 | 功能說明 |
|------|--------------|
| `list_presets` | 所有外觀：id、名稱、簡介、標籤、縮圖與嵌入 URL |
| `find_presets` | 依樣式關鍵字或短語尋找外觀，例如 `print` 或 `synthwave` |
| `build_share_url` | 從外觀建構 studio 分享連結與嵌入 URL，或修改使用者貼上的連結 |
| `read_share_url` | 將 Globestudio 連結解碼為其外觀與設定 |
| `embed_snippet` | 外觀的嵌入程式碼：iframe、React 或 script 標籤 |
| `preview_url` | 外觀的即時嵌入 URL 與 PNG 縮圖 |

該技能了解設計與嵌入的運作方式，而伺服器負責建構與讀取連結，因此修改使用者貼上的連結時，仍能保留其中的其他所有設定。

## 範例提示詞

```text
在首頁主視覺（hero）中加入一個旋轉的點陣地球儀，標示我們在奧斯汀、柏林與新加坡的辦公室。
```

```text
以我們的品牌色彩製作平面的歐洲點陣地圖，附帶地球儀（Globe）與地圖（Map）切換按鈕，並提供嵌入程式碼。
```

```text
這是一個 Globestudio 連結。請保留設計，但將點陣改為我們的品牌藍色。
```

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分。技能與 MCP 伺服器開發於 [alevizio/globestudio](https://github.com/alevizio/globestudio)。

## 授權

MIT