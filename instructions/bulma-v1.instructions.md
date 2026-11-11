---
description: 'Bulma v1 慣例：Dart Sass 模組、CSS 變數、佈景主題與深色模式、智慧格線和骨架屏'
applyTo: '**/*.html, **/*.css, **/*.scss, **/*.sass, **/*.jsx, **/*.tsx, **/*.vue'
---

# Bulma v1

Bulma v1 是基於 Dart Sass 與 CSS 變數重寫的 Bulma CSS 框架。大多數教學與舊程式碼都展示 Bulma 0.9，因此在撰寫或審查 Bulma 程式碼時，請遵循這些規則。

## Bulma v1 的重要變更

- **HTML 相同，除了圖磚（tiles）。** 類別名稱沒有變更，因此大多數 0.9 標記仍可轉譯。圖磚已被移除。
- **僅支援 Dart Sass。** 使用 `sass` 套件進行建構。`node-sass` 與 LibSass 無法編譯它。
- **Sass 模組。** 使用 `@use "bulma/sass" with (...)` 進行自訂。設定變數然後呼叫 `@import "bulma"` 是 0.9 的模式。
- **CSS 變數。** 每個元件都會讀取帶有 `--bulma-` 前置詞的變數，因此您可以直接使用純 CSS 設定佈景主題，無需建構步驟。
- **佈景主題與深色模式。** 預設隨附淺色主題與深色主題。深色主題遵循使用者的系統設定。
- **調色盤。** 7 種主要顏色的每一種都具有 soft、bold、light、dark、invert 以及 21 種編號色調。
- **格線。** 智慧格線（smart grid）與固定格線（fixed grid）取代了圖磚。
- **骨架屏（Skeletons）。** 載入預留位置，作為獨立區塊以及 `is-skeleton` 修飾符。
- **具前置詞的建構版本。** 預建構版本會為每個類別加上 `bulma-` 前置詞。

## 安裝

```bash
npm install bulma
```

匯入編譯後的 CSS 一次：

```js
import 'bulma/css/bulma.min.css';
```

或從 CDN 載入：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css" />
```

其他建構版本位於 `bulma/css/versions/`：

| 檔案                            | 使用時機                                             |
| ------------------------------- | ---------------------------------------------------- |
| `bulma-prefixed.css`            | Bulma 必須與其他 CSS 框架共享頁面                    |
| `bulma-no-helpers.css`          | 您只需要元件，不需要 `has-*` 輔助程式                |
| `bulma-no-helpers-prefixed.css` | 上述兩種情況皆符合                                   |
| `bulma-no-dark-mode.css`        | 網站應一律以淺色主題轉譯                             |

## 使用 Sass 自訂

透過 `@use ... with` 傳遞變數：

```scss
@use "bulma/sass" with (
  $primary: #8a4d76,
  $link: #fa7c91,
  $family-primary: '"Nunito", sans-serif'
);
```

- 請勿產生 `$primary: ...;` 後接 `@import "bulma";`。那是 0.9 的設定，且 Sass 已棄用 `@import`。
- 僅匯入您需要的內容，方法是先載入公用程式，然後再載入單一模組，例如 `@use "bulma/sass/utilities" with (...)` 與 `@use "bulma/sass/form"`。
- 數個元件變數現在已拆分為色相、飽和度與亮度（`$input-h`、`$input-s`、`$input-background-l`）。0.9 教學中的變數名稱可能已不存在。使用前請先檢查 Bulma 的 Sass 變數清單。

## 使用 CSS 變數自訂

您可以在執行階段變更顏色而無需 Sass。主要顏色由色相、飽和度與亮度變數建構而成，因此覆寫這些變數會更新衍生自它們的每個色調：

```css
/* 在 Bulma 之後載入 */
:root {
  --bulma-primary-h: 280deg;
  --bulma-primary-s: 60%;
  --bulma-primary-l: 45%;
}
```

- 將變數範圍限制在元件內以僅變更單一部分，例如 `.button { --bulma-button-border-width: 2px; }`。
- 在您自己的 CSS 中，請使用 `var(--bulma-...)` 讀取 Bulma 的值，而不是複製十六進位代碼，以確保自訂樣式遵循佈景主題。

## 深色模式

- 頁面預設為淺色，並在使用者系統偏好深色時轉為深色。
- 在 `<html>` 或任何元素上使用 `data-theme="dark"` 或 `theme-dark` 類別強制使用特定主題。`data-theme="light"` 與 `theme-light` 強制使用淺色。
- 若網站絕不應切換主題，請使用 `bulma-no-dark-mode.css`。
- 將 **soft** 背景與 **bold** 文字搭配使用，例如 `has-background-primary-soft has-text-primary-bold`。Soft 與 bold 在深色模式下會互換，因此能維持對比度。
- 頁面表面應避免使用固定顏色（例如 `has-background-white`）或硬式編碼的十六進位值。在自訂 CSS 中，請為頁面背景使用 `var(--bulma-scheme-main)`，使其遵循佈景主題。

## 版面配置

圖磚（`tile is-ancestor`、`is-parent`、`is-child`）已從 Bulma v1 中移除，因此該標記不會獲得任何樣式。請使用智慧格線，它會在每行容納其最小寬度所允許的最多儲存格：

```html
<div class="grid">
  <div class="cell">One</div>
  <div class="cell">Two</div>
  <div class="cell is-col-span-2">Three, two columns wide</div>
</div>
```

若要使用固定欄數，請將格線包裝在 `fixed-grid` 中：

```html
<div class="fixed-grid has-3-cols">
  <div class="grid">
    <div class="cell">One</div>
    <div class="cell">Two</div>
    <div class="cell">Three</div>
  </div>
</div>
```

- 儲存格支援 `is-col-span-*`、`is-row-span-*`、`is-col-start-*` 與 `is-row-start-*`。
- `columns` 與 `column`（具有像是 `is-half` 或 `is-one-third` 等大小）仍適用於單一 flex 列。

## 骨架屏

- 為元件新增 `is-skeleton` 以顯示其載入狀態，例如 `button is-skeleton`、`input is-skeleton` 或 `image is-64x64 is-skeleton`。
- 使用 `skeleton-block` 作為純預留位置方塊，並使用帶有空白子 `div` 的 `skeleton-lines` 作為文字行。

## Bulma 不包含 JavaScript

- Bulma 僅包含 CSS。導覽列漢堡選單、下拉式選單、強制回應視窗與分頁標籤都需要您自己的程式碼來切換 `is-active`。
- 在 React 或 Vue 中，Bulma 元件函式庫（例如 [Bestax](https://bestax.io) 或 [Buefy](https://buefy.org)）會為您處理該狀態。請繼續使用專案中既有的函式庫。
- 請勿新增像是 `data-bs-toggle` 的 Bootstrap 屬性。它們在 Bulma 中沒有任何作用。
- 請勿混用 Bootstrap 或 Tailwind 類別。請使用 Bulma 自己的名稱：使用 `button` 而非 `btn`，使用 `column is-half` 而非 `col-md-6`，使用 `is-flex` 而非 `d-flex`，使用 `mt-4` 與 `px-2` 設定間距，使用 `has-text-centered` 設定對齊方式。
