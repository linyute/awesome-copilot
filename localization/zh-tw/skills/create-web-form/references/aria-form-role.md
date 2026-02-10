# ARIA 表單角色 (Form Role) 參考

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/form_role>

## 定義與描述

`form` 角色用於識別頁面上提供與 HTML 表單同等功能的一組元件。它是一個**地標角色 (landmark role)**，可協助使用者導覽至表單區段。

`form` 地標識別出一個包含項目與物件集合的內容區域，當沒有其他具名地標（例如 `main` 或 `search`）適合時，這些項目與物件共同組成一個表單。

**重要：** 除非具備無障礙名稱，否則表單不會作為地標區域公開。

## 偏好方法：改用 HTML `<form>`

除非您有非常充分的理由，否則請使用 HTML `<form>` 元件來包含您的表單控制項，而非使用 ARIA 的 `form` 角色。HTML `<form>` 元件足以告知輔助技術該處存在一個表單。

```html
<!-- 建議的語義化方法 -->
<form id="send-comment" aria-label="加入評論">
  <!-- 此處放置表單控制項 -->
</form>
```

如果提供了無障礙名稱，`<form>` 元件將自動作為 `form` 地標進行溝通。

## 何時使用 `role="form"`

`form` 角色應當用於識別包含表單內容的**頁面區域**，而非個別的表單欄位。當您沒有使用原生的 `<form>` 元件，但仍希望向輔助技術傳達表單語義時，使用此角色是合適的。

### 基本範例

```html
<div role="form" id="contact-info" aria-label="聯絡資訊">
  <!-- 表單內容 -->
</div>
```

### 包含表單控制項的完整範例

```html
<div role="form" id="send-comment" aria-label="加入評論">
  <label for="username">使用者名稱</label>
  <input
    id="username"
    name="username"
    autocomplete="nickname"
    autocorrect="off"
    type="text" />

  <label for="email">電子郵件</label>
  <input
    id="email"
    name="email"
    autocomplete="email"
    autocapitalize="off"
    autocorrect="off"
    spellcheck="false"
    type="text" />

  <label for="comment">評論</label>
  <textarea id="comment" name="comment"></textarea>

  <input value="評論" type="submit" />
</div>
```

## 無障礙命名（地標公開之必要條件）

每個需要作為地標公開的 `<form>` 元件與表單 `role` **必須被賦予一個無障礙名稱**，使用下列其中一項：

- `aria-label`
- `aria-labelledby`
- `title` 屬性

### `aria-label` 範例

```html
<div role="form" id="gift-cards" aria-label="購買禮物卡">
  <!-- 表單內容 -->
</div>
```

### 避免冗餘的描述

螢幕閱讀器會宣告角色類型，因此請勿在標籤中重複描述：

- **不正確：** `aria-label="聯絡表單"`（會宣告為「聯絡表單 表單」）
- **正確：** `aria-label="聯絡資訊"`（簡潔且非冗餘）

## 屬性與互動

### 關聯的 WAI-ARIA 角色、狀態與屬性

`form` 角色未定義特定的角色專屬狀態或屬性。

### 鍵盤互動

`form` 角色未定義特定的角色專屬鍵盤互動。

### 必要的 JavaScript 功能

- **`onsubmit` 事件處理常式：** 處理表單提交時引發的事件。
- 任何非原生 `<form>` 元件的事物都無法使用標準表單提交方式進行提交。您必須使用 JavaScript 建立替代的資料提交機制（例如使用 `fetch()` 或 `XMLHttpRequest`）。

## 無障礙空間考量

### 1. 謹慎使用

地標角色旨在用於文件中較大的整體區段。使用過多的地標角色會在螢幕閱讀器中產生「雜訊」，使用戶難以理解整體的頁面配置。

### 2. 輸入項不是表單

不要在個別表單元件（輸入項、文字區域、選取方塊等）上宣告 `role="form"`。請僅將該角色套用於**包裝元件 (wrapper element)**。

```html
<!-- 不正確 -->
<input role="form" type="text" />

<!-- 正確 -->
<div role="form" aria-label="使用者詳情">
  <input type="text" />
</div>
```

### 3. 為搜尋表單使用 `search` 角色

如果表單用於搜尋功能，請使用更專門的 `role="search"` 而非 `role="form"`。

### 4. 使用原生表單控制項

即使使用 `role="form"`，仍建議優先使用原生的 HTML 表單控制項：

- `<button>`
- `<input>`
- `<select>`
- `<textarea>`
- `<label>`

## 最佳實作

- **優先使用 HTML `<form>` 元件。** 使用語義化的 `<form>` 元件會自動傳達表單地標，無需使用 ARIA。
- **提供唯一的標籤。** 文件中的每個表單都應具備唯一的無障礙名稱，以協助使用者理解其目的。
- **讓標籤清晰可見。** 標籤應對所有使用者可見，而不僅僅是輔助技術使用者。
- **使用合適的地標角色。** 搜尋表單請使用 `role="search"`，一般表單群組請使用 `role="form"`，並儘可能使用 `<form>` HTML 元件。

## 規範

- [WAI-ARIA: form 角色規範](https://w3c.github.io/aria/#form)
- [WAI-ARIA APG: 表單地標範例](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/form.html)

## 相關參照

- [`<form>` HTML 元件 (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form)
- [`<legend>` HTML 元件 (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/legend)
- [`<label>` HTML 元件 (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)
- [`search` ARIA 角色 (MDN)](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/search_role)
