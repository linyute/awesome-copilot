# XML 參考

---

## XML 簡介

> 來源：<https://developer.mozilla.org/en-US/docs/Web/XML/Guides/XML_introduction>

### 概觀

**XML (可延伸標記語言，Extensible Markup Language)** 是一種與 HTML 類似的標記語言，但沒有預定義的標籤。相反地，您可以根據特定需求定義自己的標籤。它能以標準化格式進行強大的資料儲存，並可在不同系統和平台之間進行搜尋和共用。

**以 XML 為基礎的語言包括：** XHTML、MathML、SVG、RSS 和 RDF。

### XML 文件的結構

#### XML 宣告

XML 宣告傳遞有關文件的 Metadata。

```xml
<?xml version="1.0" encoding="UTF-8"?>
```

**屬性：**

- **`version`** -- 文件中使用的 XML 版本。
- **`encoding`** -- 文件中使用的字元編碼。

#### 註解

```xml
<!-- 註解 -->
```

### 「正確」的 XML (有效且格式良好)

要使 XML 文件正確，必須滿足以下條件：

1. 文件必須**格式良好 (well-formed)**。
2. 文件必須符合**所有 XML 語法規則**。
3. 文件必須符合**語義規則**（通常在 XML schema 或 DTD 中設定）。

#### 範例 -- 不正確的 XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<message>
    <warning>
        Hello World
    <!--缺少 </warning> -->
</message>
```

#### 範例 -- 修正後的 XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<message>
    <warning>
         Hello World
    </warning>
</message>
```

包含未定義標籤的文件是無效的。標籤必須在 schema 或 DTD 中正確定義。

### 字元參照

與 HTML 一樣，XML 對特殊的保留字元使用字元參照：

| 實體    | 字元 | 描述              |
|-----------|-----------|--------------------------|
| `&lt;`    | `<`       | 小於符號           |
| `&gt;`    | `>`       | 大於符號           |
| `&amp;`   | `&`       | 連結符號           |
| `&quot;`  | `"`       | 雙引號    |
| `&apos;`  | `'`       | 撇號 / 單引號 |

#### 自訂實體定義

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE body [
  <!ENTITY warning "警告：發生了一些問題... 請重新整理並再試一次。">
]>
<body>
  <message> &warning; </message>
</body>
```

#### 數字字元參照

使用數字參照來表示特殊字元：

- `&#xA9;` = (c) (版權符號)

### 顯示 XML

#### 使用 CSS 樣式表

```xml
<?xml-stylesheet type="text/css" href="stylesheet.css"?>
```

#### 使用 XSLT (建議用於複雜轉換)

```xml
<?xml-stylesheet type="text/xsl" href="transform.xsl"?>
```

**XSLT (可延伸樣式表語言轉換，Extensible Stylesheet Language Transformations)** 是一種將 XML 轉換為其他語言（如 HTML）的強大方法，使 XML 具有極高的通用性。

### 關鍵重點

- XML 是**標準化**的，確保資料可以在不同系統之間一致地解析。
- XML 文件需要正確的**標籤巢狀與閉合**才能成為格式良好的文件。
- XML 是**與平台和語言無關**的。
- 使用 **DTD 或 XML Schema** 來定義有效的標籤結構。
- 使用 **XSLT** 以獲得強大的 XML 轉換能力。

---

## 解析與序列化 XML

> 來源：<https://developer.mozilla.org/en-US/docs/Web/XML/Guides/Parsing_and_serializing_XML>

### 概觀

有時，您可能需要解析 XML 內容並將其轉換為 DOM 樹，或者相反地，將現有的 DOM 樹序列化為 XML。

### 關鍵網頁平台物件

| 物件               | 用途                                                                                      |
|----------------------|----------------------------------------------------------------------------------------------|
| **XMLSerializer**    | 序列化 DOM 樹，將其轉換為包含 XML 的字串                            |
| **DOMParser**        | 透過解析包含 XML 的字串來建構 DOM 樹，傳回 XMLDocument 或 Document |
| **fetch()**          | 從 URL 載入內容；XML 內容會以文字字串形式傳回，您可以使用 DOMParser 進行解析 |
| **XMLHttpRequest**   | fetch() 的前身；可以透過其 `responseXML` 屬性將資源作為 Document 傳回      |
| **XPath**            | 為 XML 文件的特定部分建立位址字串                              |

### 建立 XML 文件

#### 將字串解析為 DOM 樹

```javascript
const xmlStr = '<q id="a"><span id="b">嘿！</span></q>';
const parser = new DOMParser();
const doc = parser.parseFromString(xmlStr, "application/xml");
// 列印根元件名稱或錯誤訊息
const errorNode = doc.querySelector("parsererror");
if (errorNode) {
  console.log("解析時發生錯誤");
} else {
  console.log(doc.documentElement.nodeName);
}
```

#### 將 URL 可定址資源解析為 DOM 樹

使用 `fetch()`：

```javascript
fetch("example.xml")
  .then((response) => response.text())
  .then((text) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");
    console.log(doc.documentElement.nodeName);
  });
```

這會將資源作為文字字串擷取，然後使用 `DOMParser.parseFromString()` 建構 `XMLDocument`。

**注意：** 如果文件是 HTML，程式碼會傳回 `Document`。如果文件是 XML，產生的物件則是 `XMLDocument`。這兩種類型基本上是相同的；區別主要是歷史原因。

### 序列化 XML 文件

#### 將 DOM 樹序列化為字串

要將 DOM 樹 `doc` 序列化為 XML 文字，請呼叫 `XMLSerializer.serializeToString()`：

```javascript
const serializer = new XMLSerializer();
const xmlStr = serializer.serializeToString(doc);
```

#### 序列化 HTML 文件

如果 DOM 是 HTML 文件，您可以使用：

使用 `innerHTML` (僅限子代)：

```javascript
const docInnerHtml = document.documentElement.innerHTML;
```

使用 `outerHTML` (節點及其所有子代)：

```javascript
const docOuterHtml = document.documentElement.outerHTML;
```

### 相關技術

- XPath
- fetch()
- XMLHttpRequest
- Document、XMLDocument 和 HTMLDocument API

---

## OpenSearch 描述格式

> 來源：<https://developer.mozilla.org/en-US/docs/Web/XML/Guides/OpenSearch>

### 概觀

**OpenSearch 描述格式** 允許網站描述其搜尋引擎介面，使瀏覽器和用戶端應用程式能夠將網站特定的搜尋功能整合到網址列中。支援的瀏覽器包括 Firefox、Edge、Safari 和 Chrome。

- 瀏覽器透過 URL 範本查詢搜尋引擎。
- 瀏覽器在指定的預留位置中填入使用者的搜尋字詞。
- 範例：`https://example.com/search?q={searchTerms}` 變為 `https://example.com/search?q=foo`。
- 網站透過連結在 HTML 中的 XML 描述檔案來註冊搜尋引擎。
- **注意：** Chrome 預設將網站搜尋引擎註冊為「非使用中」；使用者必須手動啟用它們。

### OpenSearch 描述檔案

#### 基本 XML 範本

```xml
<OpenSearchDescription
  xmlns="http://a9.com/-/spec/opensearch/1.1/"
  xmlns:moz="http://www.mozilla.org/2006/browser/search/">
  <ShortName>[SNK]</ShortName>
  <Description>[搜尋引擎全名與摘要]</Description>
  <InputEncoding>[UTF-8]</InputEncoding>
  <Image width="16" height="16" type="image/x-icon">[https://example.com/favicon.ico]</Image>
  <Url type="text/html" template="[searchURL]"/>
  <Url type="application/x-suggestions+json" template="[suggestionURL]"/>
</OpenSearchDescription>
```

### 元件規格

#### ShortName

- 搜尋引擎的簡短名稱。
- **必須為 16 個字元或更少。**
- 僅限純文字；不含 HTML 或標記。

#### Description

- 搜尋引擎的簡短描述。
- **最多 1024 個字元。**
- 僅限純文字；不含 HTML 或標記。

#### InputEncoding

- 向搜尋引擎提交輸入時使用的字元編碼。
- 範例：`UTF-8`。

#### Image

- 搜尋引擎圖示的 URL 或資料 URL。
- **建議大小：**
  - 16x16 影像，類型為 `image/x-icon` (例如：`/favicon.ico`)
  - 64x64 影像，類型為 `image/jpeg` 或 `image/png`

**圖示 URL 範例：**

```xml
<Image height="16" width="16" type="image/x-icon">https://example.com/favicon.ico</Image>
```

```xml
<Image height="16" width="16">data:image/x-icon;base64,AAABAAEAEBAAA...DAAA=</Image>
```

**圖示重要注意事項：**

- Firefox 將圖示快取為 base64 `data:` URL。
- 搜尋外掛程式儲存在設定檔的 `searchplugins/` 資料夾中。
- `http:` 和 `https:` URL 會轉換為 `data:` URL。
- **Firefox 會拒絕大於 10 KB 的遠端載入圖示。**

#### Url

使用 `template` 屬性描述用於搜尋查詢的 URL。

**Firefox 支援的 URL 類型：**

| 類型                                      | 用途                                    |
|-------------------------------------------|--------------------------------------------|
| `type="text/html"`                        | 實際的搜尋查詢 URL                    |
| `type="application/x-suggestions+json"`   | JSON 格式的搜尋建議          |
| `type="application/x-moz-keywordsearch"`  | 網址列中的關鍵字搜尋 (僅限 Firefox) |

**動態參數：**

- `{searchTerms}` -- 使用者的搜尋字詞。
- 也支援其他 OpenSearch 1.1 參數。

### 連結到 OpenSearch 描述檔案

#### HTML Link 元件

```html
<link
  rel="search"
  type="application/opensearchdescription+xml"
  title="[searchTitle]"
  href="[descriptionURL]" />
```

**必要屬性：**

- `rel="search"` -- 建立搜尋引擎關係。
- `type="application/opensearchdescription+xml"` -- MIME 類型。
- `title="[searchTitle]"` -- 搜尋名稱（必須與 `<ShortName>` 相符）。
- `href="[descriptionURL]"` -- XML 描述檔案的 URL。

#### 多個搜尋引擎範例

```html
<link
  rel="search"
  type="application/opensearchdescription+xml"
  title="MySite: 依作者"
  href="http://example.com/mysiteauthor.xml" />

<link
  rel="search"
  type="application/opensearchdescription+xml"
  title="MySite: 依標題"
  href="http://example.com/mysitetitle.xml" />
```

### 支援自動更新

包含一個具有自動更新額外功能的 `Url` 元件：

```xml
<Url
  type="application/opensearchdescription+xml"
  rel="self"
  template="https://example.com/mysearchdescription.xml" />
```

這允許 OpenSearch 描述檔案自動更新。

### 疑難排解提示

1. **伺服器 Content-Type** -- 使用 `Content-Type: application/opensearchdescription+xml` 提供 OpenSearch 描述。
2. **XML 格式良好性** -- 直接在瀏覽器中載入檔案進行驗證。連結符號 (`&`) 必須轉義為 `&amp;`。標籤必須以斜槓或對應的結束標籤閉合。
3. **缺少 xmlns 屬性** -- 務必包含 `xmlns="http://a9.com/-/spec/opensearch/1.1/"`，否則 Firefox 會回報：「Firefox 無法下載搜尋外掛程式。」
4. **缺少 text/html URL** -- **必須**包含 `text/html` URL 類型；僅含 Atom 或 RSS 的 URL 將會產生錯誤。
5. **小圖示 (Favicon) 大小** -- 遠端擷取的小圖示不得超過 10KB。
6. **瀏覽器啟用** -- 瀏覽器可能不會預設啟用網站搜尋捷徑；請檢查瀏覽器設定並視需要手動啟用。

#### Firefox 偵錯

使用 `about:config` 啟用記錄功能：

1. 將偏好設定 `browser.search.log` 設為 `true`。
2. 在 Firefox 瀏覽器主控台中檢視記錄：工具 > 瀏覽器工具 > 瀏覽器主控台。
