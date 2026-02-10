# HTML 表單元件參考

這是一份整合式的 HTML 表單相關元件參考，資料來源為 Mozilla 開發者網路 (MDN) 網頁文件。

---

## 目錄

1. [`<form>`](#form)
2. [`HTMLFormElement.elements`](#htmlformelementelements)
3. [`<button>`](#button)
4. [`<datalist>`](#datalist)
5. [`<fieldset>`](#fieldset)
6. [`<input>`](#input)
7. [`<label>`](#label)
8. [`<legend>`](#legend)
9. [`<meter>`](#meter)
10. [`<optgroup>`](#optgroup)
11. [`<option>`](#option)
12. [`<output>`](#output)
13. [`<progress>`](#progress)
14. [`<select>`](#select)
15. [`<textarea>`](#textarea)

---

## `<form>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form>

### 描述

`<form>` 元件代表文件中包含互動式控制項的部分，用於向伺服器提交資訊。起始標籤和結束標籤都是強制的。表單不能巢狀於其他表單中。

### 關鍵屬性

| 屬性 | 描述 |
|-----------|-------------|
| `action` | 處理表單提交的 URL。可由提交按鈕上的 `formaction` 覆蓋。 |
| `method` | HTTP 方法： `get`（預設）、`post` 或 `dialog`。定義資料的傳送方式。 |
| `enctype` | POST 提交的 MIME 類型： `application/x-www-form-urlencoded`（預設）、`multipart/form-data`（用於檔案）、`text/plain`。 |
| `novalidate` | 布林屬性，在提交時停用表單驗證。 |
| `autocomplete` | 控制自動完成： `on`（預設）或 `off`。 |
| `accept-charset` | 接受的字元編碼（通常為 `UTF-8`）。 |
| `name` | 表單識別碼；必須是唯一的。會成為 `window`、`document` 和 `document.forms` 的屬性。 |
| `target` | 回應的顯示位置： `_self`（預設）、`_blank`、`_parent`、`_top`。 |
| `rel` | 連結關係類型： `external`、`nofollow`、`noopener`、`noreferrer` 等。 |

### 使用注意事項

- 表單**不可包含巢狀表單**。
- 支援 CSS 虛擬類別： `:valid` 和 `:invalid`，用於根據表單有效性設定樣式。
- DOM 介面： `HTMLFormElement`。
- 隱含 ARIA 角色： `form`。

### 範例

```html
<form action="/submit" method="post">
  <div>
    <label for="name">姓名：</label>
    <input type="text" id="name" name="name" required />
  </div>
  <div>
    <label for="email">電子郵件：</label>
    <input type="email" id="email" name="email" required />
  </div>
  <input type="submit" value="提交" />
</form>
```

---

## `HTMLFormElement.elements`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/elements>

### 描述

`elements` 屬性會傳回一個 `HTMLFormControlsCollection`，其中包含與 `<form>` 元件相關聯的所有表單控制項。可以透過索引或其 `name`/`id` 屬性存取控制項。

### 回傳值

- **型別：** `HTMLFormControlsCollection`（以 `HTMLCollection` 為基礎的即時集合）
- **即時 (Live)：** 是 -- 當新增或移除控制項時會自動更新。
- **順序：** 樹狀順序（前序、深度優先文件搜尋）。

### 包含的表單控制項

此集合包含：

- `<button>`
- `<fieldset>`
- `<input>`（`type="image"` 除外）
- `<object>`
- `<output>`
- `<select>`
- `<textarea>`
- 與表單關聯的自訂元件

**注意：** `<label>` 和 `<legend>` 元件**不**包含在內。

### 範例

```javascript
// 存取表單控制項
const inputs = document.getElementById("my-form").elements;
const firstControl = inputs[0];           // 依索引
const byName = inputs["username"];        // 依 name 屬性

// 逐一查看控制項
for (const control of inputs) {
  if (control.nodeName === "INPUT" && control.type === "text") {
    control.value = control.value.toUpperCase();
  }
}

// 取得控制項數量
console.log(inputs.length);
```

---

## `<button>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button>

### 描述

`<button>` 元件是一個互動式元件，由使用者（透過滑鼠、鍵盤、手指、語音或輔助技術）啟動，執行提交表單或開啟對話方塊等動作。預設情況下，其外觀反映了使用者的平台，但可以使用 CSS 進行完全自訂。

### 關鍵屬性

| 屬性 | 描述 |
|-----------|-------------|
| `type` | 指定行為： `submit`（表單預設值）、`reset`（清除表單）、`button`（無預設行為）。 |
| `disabled` | 布林值；防止使用者互動。 |
| `name` | 用於表單提交的按鈕名稱。 |
| `value` | 隨表單資料提交的數值。 |
| `form` | 透過 ID 將按鈕與表單關聯。 |
| `formaction` | 覆蓋表單的 `action` URL。 |
| `formmethod` | 覆蓋表單的 HTTP 方法 (`post`/`get`)。 |
| `autofocus` | 頁面載入時讓按鈕獲得焦點。 |
| `popovertarget` | 透過 ID 控制彈出 (popover) 元件。 |
| `popovertargetaction` | 彈出動作： `show`, `hide`, 或 `toggle`。 |

### 使用注意事項

- `<button>` 比 `<input type="button">` 更容易設定樣式，因為它支援內部 HTML 內容（文字、影像、圖示、虛擬元件）。
- 為非表單按鈕務必設定 `type="button"` 以防止意外的表單提交。
- 預設顯示方式為 `flow-root`；按鈕會將子元件水平與垂直置中。

### 無障礙空間考量

- 僅含圖示的按鈕必須包含可見文字或描述功能的 ARIA 屬性。
- 建議的最小互動目標尺寸： 44x44 CSS 像素。
- 按鈕之間應有足夠間距以防止誤觸。
- 為鍵盤焦點指示器使用具備足夠對比度（4.5:1 比例）的 `:focus-visible`。
- 使用 `aria-pressed` 描述切換按鈕狀態（而非 `aria-checked` 或 `aria-selected`）。

### 範例

```html
<!-- 基本按鈕 -->
<button type="button">點擊我</button>

<!-- 表單提交按鈕 -->
<form>
  <input type="text" name="username" />
  <button type="submit">提交</button>
</form>

<!-- 樣式化按鈕 -->
<button class="favorite" type="button">加入最愛</button>

<style>
  .favorite {
    padding: 10px 20px;
    background-color: tomato;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  .favorite:hover {
    background-color: red;
  }
</style>
```

---

## `<datalist>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist>

### 描述

`<datalist>` 元件包含一組 `<option>` 元件，代表在其他控制項（如 `<input>` 元件）中可供選擇的允許或推薦選項。它提供自動完成/建議功能，但不會限制使用者輸入。

### 運作方式

`<datalist>` 透過以下方式與 `<input>` 元件關聯：

1. 為 `<datalist>` 提供一個唯一的 `id`。
2. 在 `<input>` 中加入 `list` 屬性，並設定相同的 `id` 值。

### 關鍵屬性

- **`<datalist>` 本身：** 無特定屬性（僅有全域屬性如 `id`）。
- **`<option>` 子代：** `value`（建議值；必要）、`label`（顯示文字；選用）。

### 支援的輸入類型

- 文字類： `text`, `search`, `url`, `tel`, `email`, `number`
- 日期/時間類： `month`, `week`, `date`, `time`, `datetime-local`
- 視覺類： `range`, `color`

### 使用注意事項

- **不可取代 `<select>`** -- 使用者仍可輸入清單中沒有的值。
- 提供建議而非限制。
- 瀏覽器對下拉選單的樣式設定有限。
- 某些螢幕閱讀器可能不會宣告建議內容。

### 範例

```html
<label for="ice-cream-choice">選擇一種口味：</label>
<input list="ice-cream-flavors" id="ice-cream-choice" />

<datalist id="ice-cream-flavors">
  <option value="巧克力"></option>
  <option value="椰子"></option>
  <option value="薄荷"></option>
  <option value="草莓"></option>
  <option value="香草"></option>
</datalist>
```

---

## `<fieldset>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fieldset>

### 描述

`<fieldset>` 元件用於在網頁表單中對多個表單控制項和標籤進行分組。它提供相關表單欄位的語義分組和視覺組織。

### 關鍵屬性

| 屬性 | 描述 |
|-----------|-------------|
| `disabled` | 布林屬性，停用 fieldset 內的所有表單控制項（`<legend>` 內的除外）。停用的控制項將無法編輯或提交。 |
| `form` | 透過參照表單的 `id` 將 fieldset 連結到 `<form>`，即使 fieldset 沒有巢狀於其中。 |
| `name` | 指定與該群組關聯的名稱。 |

### 使用注意事項

- fieldset 內巢狀的第一個 `<legend>` 元件提供其標題，且應為第一個子元件。
- 預設顯示為 `block`，帶有 2px 的溝槽邊框和內距。
- 停用時，所有後代表單控制項都會被停用，「除了」 `<legend>` 元件內部的控制項。
- 隱含 ARIA 角色： `group`。
- DOM 介面： `HTMLFieldSetElement`。

### 範例

```html
<form>
  <fieldset>
    <legend>選擇您最愛的怪物</legend>

    <input type="radio" id="kraken" name="monster" value="K" />
    <label for="kraken">克拉肯</label><br />

    <input type="radio" id="sasquatch" name="monster" value="S" />
    <label for="sasquatch">大腳野人</label><br />

    <input type="radio" id="mothman" name="monster" value="M" />
    <label for="mothman">天蛾人</label>
  </fieldset>
</form>
```

---

## `<input>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input>

### 描述

`<input>` 元件建立供網頁表單使用的互動式控制項，以接收使用者資料。由於輸入類型和屬性的眾多組合，它是最強大且最複雜的 HTML 元件之一。

### 輸入類型 (共 24 種)

| 類型 | 用途 |
|------|---------|
| `button` | 無預設行為的按鈕 |
| `checkbox` | 單選/取消選取控制項 |
| `color` | 顏色選取控制項 |
| `date` | 日期輸入（年、月、日） |
| `datetime-local` | 不含時區的日期與時間 |
| `email` | 電子郵件地址欄位 |
| `file` | 檔案上傳控制項 |
| `hidden` | 提交至伺服器的非顯示值 |
| `image` | 圖形化提交按鈕 |
| `month` | 月份與年份輸入 |
| `number` | 具有驗證功能的數字輸入 |
| `password` | 遮蔽文字欄位 |
| `radio` | 多選一控制項 |
| `range` | 數值選取器（滑桿） |
| `reset` | 表單重設按鈕 |
| `search` | 搜尋字串輸入 |
| `submit` | 表單提交按鈕 |
| `tel` | 電話號碼欄位 |
| `text` | 單行文字（預設） |
| `time` | 時間輸入 |
| `url` | 具有驗證功能的 URL 欄位 |
| `week` | 週別與年份輸入 |

### 關鍵屬性

| 屬性 | 適用類型 | 用途 |
|-----------|-----------------|---------|
| `type` | 全部 | 指定輸入控制項類型 |
| `name` | 全部 | 表單提交用的控制項識別碼 |
| `value` | 全部 | 控制項的初始/目前值 |
| `id` | 全部 | 元件唯一識別碼 |
| `required` | 大多數 | 設定為必填項目 |
| `disabled` | 全部 | 停用使用者互動 |
| `readonly` | 類文字 | 防止數值編輯 |
| `placeholder` | 類文字 | 空白時的提示文字 |
| `min` / `max` | 數字/日期 | 數值範圍限制 |
| `minlength` / `maxlength` | 類文字 | 字元數限制 |
| `pattern` | 類文字 | Regex 驗證模式 |
| `step` | 數字/日期 | 數值增加間隔 |
| `autocomplete` | 大多數 | 表單自動填寫提示 |
| `list` | 大多數 | 與 `<datalist>` 關聯 |
| `checked` | 核取/選項按鈕 | 預先選取狀態 |
| `multiple` | 電子郵件/檔案 | 允許複數值 |

### 使用注意事項

- **標籤是必要的：** 務必將輸入項與 `<label>` 元件配對以確保無障礙空間。
- **預留位置 (Placeholders) 不是標籤：** 預留位置在打字時會消失，且並非所有螢幕閱讀器都能存取。
- **用戶端驗證：** 使用條件屬性（`required`, `pattern`, `min`, `max`）進行瀏覽器驗證，但務必同時進行伺服器端驗證。
- **預設類型：** 如果未指定 `type`，預設值為 `text`。
- **表單關聯：** 使用 `name` 屬性進行表單提交；不具備 `name` 的輸入項不會被提交。
- **CSS 虛擬類別：** 使用 `:invalid`, `:valid`, `:checked`, `:disabled`, `:placeholder-shown` 等進行樣式設定。

### 範例

```html
<label for="name">姓名（4 到 8 個字元）：</label>
<input
  type="text"
  id="name"
  name="name"
  required
  minlength="4"
  maxlength="8"
  size="10" />
```

---

## `<label>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label>

### 描述

`<label>` 元件代表使用者介面中項目的標題。它將描述性文字與表單控制項關聯，以增強可用性和無障礙空間。

### 關鍵屬性

| 屬性 | 描述 |
|-----------|-------------|
| `for` | 要與此標籤關聯的可標籤表單控制項的 `id`。JavaScript 反射： `htmlFor`。 |

### 將標籤與控制項關聯

**明確關聯 (建議)：**

```html
<label for="username">輸入您的使用者名稱：</label>
<input id="username" name="username" type="text" />
```

**隱含關聯：**

```html
<label>
  我喜歡豌豆。
  <input type="checkbox" name="peas" />
</label>
```

**結合使用 (為達最大相容性，同時使用兩種方法)：**

```html
<label for="peas">
  我喜歡豌豆。
  <input type="checkbox" name="peas" id="peas" />
</label>
```

### 可標籤元件

標籤可以與下列元件關聯： `<button>`, `<input>`（`type="hidden"` 除外）, `<meter>`, `<output>`, `<progress>`, `<select>`, 和 `<textarea>`。

### 無障礙空間指南

**應該：**
- 使用 `for` 屬性進行明確關聯，以獲得廣泛的工具相容性。
- 將上下文（如條款連結）放在表單控制項「之前」。
- 在 `<fieldset>` 內使用 `<legend>` 作為表單區段標題。

**不該：**
- 在標籤內放置互動式元件（連結、按鈕） -- 這會使表單控制項難以啟動。
- 在標籤內使用標題元件 -- 這會干擾輔助技術的導覽。
- 為 `<input type="button">` 或 `<button>` 元件加入標籤（它們已透過內容/值內建標籤）。

---

## `<legend>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/legend>

### 描述

`<legend>` 元件代表其父代 `<fieldset>` 內容的標題。它提供了一種語義化的方式來標記分組的表單控制項。

### 關鍵詳情

- **必須是** `<fieldset>` 元件的第一個子元件。
- 為整個 fieldset 群組提供無障礙標籤。
- 僅支援全域屬性（無元件專屬屬性）。
- 可以包含語句內容 (phrasing content) 和標題 (`h1`--`h6`)。
- DOM 介面： `HTMLLegendElement`。

### 範例

```html
<fieldset>
  <legend>選擇您最愛的怪物</legend>

  <input type="radio" id="kraken" name="monster" value="K" />
  <label for="kraken">克拉肯</label><br />

  <input type="radio" id="sasquatch" name="monster" value="S" />
  <label for="sasquatch">大腳野人</label>
</fieldset>
```

```css
legend {
  background-color: black;
  color: white;
  padding: 3px 6px;
}
```

---

## `<meter>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meter>

### 描述

`<meter>` 元件代表已知範圍內的純量值或分數值。常用於顯示燃料水平、溫度、磁碟使用率或評分等測量值。

### 關鍵屬性

| 屬性 | 預設值 | 描述 |
|-----------|---------|-------------|
| `value` | `0` | 目前數值（必須介於 `min` 和 `max` 之間）。 |
| `min` | `0` | 測量範圍的下限。 |
| `max` | `1` | 測量範圍的上限。 |
| `low` | `min` 值 | 範圍「低」端的上限。 |
| `high` | `max` 值 | 範圍「高」端的下限。 |
| `optimum` | -- | 最佳數值；指示偏好的範圍區段。 |

### 使用注意事項

- 除非 `value` 介於 0 和 1 之間，否則請定義 `min` 和 `max` 以確保 `value` 落在範圍內。
- 瀏覽器會根據值是否低於 `low`、介於 `low` 和 `high` 之間、高於 `high` 或相對於 `optimum` 而為計量條顯示不同的顏色。
- 不能包含巢狀的 `<meter>` 元件。
- 隱含 ARIA 角色： `meter`。

### 與 `<progress>` 的差異

- **`<meter>`**： 顯示範圍內的純量測量（例如溫度、磁碟使用率）。
- **`<progress>`**： 顯示從 0 到最大值的任務完成進度。

### 範例

```html
<!-- 簡單的電池電量 -->
<p>電池電量： <meter min="0" max="100" value="75">75%</meter></p>

<!-- 包含低/高範圍 -->
<p>
  學生的考試成績：
  <meter low="50" high="80" max="100" value="84">84%</meter>
</p>

<!-- 包含最佳值的完整範例 -->
<label for="fuel">油量：</label>
<meter id="fuel" min="0" max="100" low="33" high="66" optimum="80" value="50">
  位於 50/100
</meter>
```

---

## `<optgroup>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/optgroup>

### 描述

`<optgroup>` 元件在 `<select>` 元件中建立選項分組，讓您可以將相關選項組織成帶標籤的群組。

### 關鍵屬性

| 屬性 | 描述 |
|-----------|-------------|
| `label` | 選項群組的名稱（**強制性**）。瀏覽器在 UI 中將此顯示為不可選取的標籤。 |
| `disabled` | 布林屬性。設定時，此群組中的所有選項都將變為不可選取並顯示為灰色。 |

### 使用注意事項

- 必須是 `<select>` 元件的子元件。
- 包含一個或多個 `<option>` 元件。
- 不能巢狀於其他 `<optgroup>` 元件中。
- `label` 屬性是**強制性**的。
- 隱含 ARIA 角色： `group`。

### 範例

```html
<label for="dino-select">選擇恐龍：</label>
<select id="dino-select">
  <optgroup label="獸腳亞目">
    <option>暴龍</option>
    <option>迅猛龍</option>
    <option>恐爪龍</option>
  </optgroup>
  <optgroup label="蜥腳下目">
    <option>梁龍</option>
    <option>薩爾塔龍</option>
    <option>雷龍</option>
  </optgroup>
  <optgroup label="已滅絕群組" disabled>
    <option>劍龍</option>
  </optgroup>
</select>
```

---

## `<option>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/option>

### 描述

`<option>` 元件定義包含在 `<select>`、`<optgroup>` 或 `<datalist>` 元件中的項目。它代表個別選單項目或可選取的選項。

### 關鍵屬性

| 屬性 | 描述 |
|-----------|-------------|
| `value` | 如果選取該選項，則隨表單提交的數值。如果省略，則使用元件的文字內容。 |
| `selected` | 布林屬性，將選項標記為初始選取。每個 `<select>`（不含 `multiple`）僅能有一個 `<option>` 具備此屬性。 |
| `disabled` | 布林屬性，停用該選項（灰色顯示，無法互動）。如果其 `<optgroup>` 祖先被停用，選項也會被停用。 |
| `label` | 選項的文字標籤。如果未定義，則使用元件的文字內容。 |

### 使用情境

- **在 `<select>` 內**： 列出可選取選項；使用者選擇一個（或多個，如果 select 設定了 `multiple` 屬性）。
- **在 `<optgroup>` 內**： 將相關選項群組化。
- **在 `<datalist>` 內**： 為 `<input>` 元件提供自動完成建議。

### 使用注意事項

- 如果緊接在另一個 `<option>` 或 `<optgroup>` 之後，結束標籤是選用的。
- 隱含 ARIA 角色： `option`。

### 範例

```html
<label for="pet-select">選擇寵物：</label>
<select id="pet-select">
  <option value="">--請選擇一個選項--</option>
  <option value="dog">狗</option>
  <option value="cat">貓</option>
  <option value="hamster" disabled>倉鼠</option>
  <option value="parrot" selected>鸚鵡</option>
</select>
```

---

## `<output>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/output>

### 描述

`<output>` 元件是一個容器元件，用於顯示計算結果或使用者動作的產出。它是表單關聯的，且被大多數瀏覽器實作為 ARIA live region，這意味著輔助技術將自動宣告其變更。

### 關鍵屬性

| 屬性 | 描述 |
|-----------|-------------|
| `for` | 以空格分隔的元件 `id` 清單，這些元件對計算有所貢獻。 |
| `form` | 透過 `id` 將輸出與特定 `<form>` 關聯（會覆蓋祖先表單）。 |
| `name` | 元件名稱；用於 `form.elements` API。 |

### 使用注意事項

- `<output>` 的數值、名稱和內容「不會」隨表單提交。
- 實作為 `aria-live` 區域；輔助技術會自動宣告變更。
- 必須具備起始標籤和結束標籤。

### 範例

```html
<form id="example-form">
  <input type="range" id="b" name="b" value="50" /> +
  <input type="number" id="a" name="a" value="10" /> =
  <output name="result" for="a b">60</output>
</form>

<script>
  const form = document.getElementById("example-form");
  form.addEventListener("input", () => {
    const result = form.elements["a"].valueAsNumber +
                   form.elements["b"].valueAsNumber;
    form.elements["result"].value = result;
  });
</script>
```

---

## `<progress>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress>

### 描述

`<progress>` 元件顯示進度指示器，指示任務的完成程度，通常轉譯為進度條。

### 關鍵屬性

| 屬性 | 描述 |
|-----------|-------------|
| `max` | 所需工作的總量。必須大於 0 且為有效的浮點數。預設值： `1`。 |
| `value` | 已完成量（0 到 `max`，或如果省略 `max` 則為 0 到 1）。如果省略，則顯示不定進度條 (indeterminate progress bar)。 |

### 與 `<meter>` 的差異

- 最小值一律為 0（`<progress>` **不允許**使用 `min` 屬性）。
- `<progress>` 專門用於任務完成進度； `<meter>` 用於純量測量。

### 使用注意事項

- 起始標籤和結束標籤皆為必要。
- 隱含 ARIA 角色： `progressbar`。
- 標籤之間的文字是舊版瀏覽器的後備內容（並非無障礙標籤）。
- 使用 `:indeterminate` 虛擬類別設定不定進度條的樣式。
- 移除 `value` 屬性 (`element.removeAttribute('value')`) 以建立不定進度條。

### 無障礙空間考量

- 務必使用 `<label>` 元件、`aria-labelledby` 或 `aria-label` 提供無障礙標籤。
- 對於正在載入的頁面區段：在要更新的區段上設定 `aria-busy="true"`，使用 `aria-describedby` 連結至進度元件，並在載入完成時移除 `aria-busy`。

### 範例

```html
<!-- 基本進度條 -->
<label for="file">檔案進度：</label>
<progress id="file" max="100" value="70">70%</progress>

<!-- 具有隱含標籤的無障礙進度條 -->
<label>
  上傳文件中： <progress value="70" max="100">70%</progress>
</label>

<!-- 不定狀態（無 value 屬性） -->
<progress max="100"></progress>
```

---

## `<select>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select>

### 描述

`<select>` 元件代表一個提供選項選單的控制項，讓使用者可以從下拉式選項清單中進行選擇。

### 關鍵屬性

| 屬性 | 描述 |
|-----------|-------------|
| `name` | 指定用於表單提交的控制項名稱。 |
| `multiple` | 布林屬性，允許選取多個選項。 |
| `size` | 捲動清單方塊中可見列的數量（預設值： `0`）。 |
| `required` | 布林屬性，要求必須選取非空選項。 |
| `disabled` | 布林屬性，防止使用者互動。 |
| `autofocus` | 布林屬性，在載入頁面時讓控制項獲得焦點。 |
| `form` | 透過 ID 將 select 與特定表單關聯。 |
| `autocomplete` | 為自動完成行為提供提示。 |

### 使用注意事項

- 每個選項都使用巢狀的 `<option>` 元件定義。
- 使用 `<optgroup>` 在視覺上對相關選項進行分組。
- 使用 `<hr>` 元件在選項之間建立視覺分隔線。
- `<option>` 元件上的 `value` 屬性指定提交至伺服器的資料。
- 如果選項上沒有 `value` 屬性，則使用選項的文字內容。
- 若無 `selected` 屬性，則預設選取第一個選項。
- 帶有 `multiple` 屬性的多重選取會以 `name=value1&name=value2` 形式提交。

### 無障礙空間考量

- 使用 `<label>` 搭配與 select 的 `id` 相符的 `for` 屬性來關聯標籤。
- 隱含 ARIA 角色： `combobox`（單選）、`listbox`（多選或尺寸 > 1）。

### 範例

```html
<label for="pet-select">選擇寵物：</label>

<select name="pets" id="pet-select">
  <option value="">--請選擇一個選項--</option>
  <option value="dog">狗</option>
  <option value="cat">貓</option>
  <option value="hamster">倉鼠</option>
</select>
```

---

## `<textarea>`

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/textarea>

### 描述

`<textarea>` 元件代表多行純文字編輯控制項，讓使用者可以輸入大量的自由格式文字（例如評論、回饋、評論）。

### 關鍵屬性

| 屬性 | 描述 |
|-----------|-------------|
| `rows` | 可見文字行數（預設值： `2`）。 |
| `cols` | 依平均字元寬度計的可見寬度（預設值： `20`）。 |
| `name` | 用於表單提交的控制項名稱。 |
| `id` | 用於與 `<label>` 元件關聯。 |
| `placeholder` | 顯示給使用者的提示文字。 |
| `maxlength` | 最大字串長度（UTF-16 程式碼單元）。 |
| `minlength` | 最小字串長度（UTF-16 程式碼單元）。 |
| `wrap` | 換行行為： `soft`（預設）、`hard` 或 `off`。 |
| `disabled` | 布林值；停用使用者互動。 |
| `readonly` | 布林值；使用者無法修改內容，但仍可聚焦與提交。 |
| `required` | 布林值；使用者必須填寫數值。 |
| `autocomplete` | 瀏覽器自動完成的 `on` 或 `off`。 |
| `spellcheck` | 拼字檢查行為的 `true`, `false`, 或 `default`。 |
| `autofocus` | 布林值；頁面載入時獲得焦點。 |

### 使用注意事項

- 初始內容放在起始標籤和結束標籤之間（而非作為 `value` 屬性）。
- 在 JavaScript 中使用 `.value` 屬性取得/設定內容；使用 `.defaultValue` 取得初始值。
- 預設可調整大小；在 CSS 中使用 `resize: none` 停用調整大小功能。
- 使用 `:valid` 和 `:invalid` 虛擬類別，根據 `minlength`/`maxlength`/`required` 約束設定樣式。

### 範例

```html
<label for="story">訴說您的故事：</label>

<textarea
  id="story"
  name="story"
  rows="5"
  cols="33"
  placeholder="在此處輸入您的回饋..."
  maxlength="500"
  required>
那是一個漆黑且風雨交加的夜晚...
</textarea>
```

```css
textarea {
  padding: 10px;
  border: 1px solid #cccccc;
  border-radius: 5px;
  font-family: Arial, sans-serif;
  resize: vertical;
}

textarea:invalid {
  border-color: red;
}

textarea:valid {
  border-color: green;
}
```
