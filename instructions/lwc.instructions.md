---
description: '在 Salesforce 平台上開發 Lightning Web Components (LWC) 的指南與最佳實踐。'
applyTo: 'force-app/main/default/lwc/**'
---

# LWC 開發

## 一般指示

- 每個 LWC 應位於 `force-app/main/default/lwc/` 下其專屬的資料夾中。
- 資料夾名稱應與元件名稱匹配（例如：`myComponent` 元件對應 `myComponent` 資料夾）。
- 每個元件資料夾應包含以下檔案：
    - `myComponent.html`：HTML 模板檔案。
    - `myComponent.js`：JavaScript 控制器檔案。
    - `myComponent.js-meta.xml`：Metadata 配置文件。
    - 選用：`myComponent.css` 用於元件特定樣式。
    - 選用：`myComponent.test.js` 用於 Jest 單元測試。

## 核心原則

### 1. 優先使用 Lightning 元件而非 HTML 標籤
始終優先選擇 Lightning Web Component 函式庫元件，而非純 HTML 元素，以確保一致性、無障礙性 (Accessibility) 並具備未來相容性。

#### 推薦做法
```html
<!-- 使用 Lightning 元件 -->
<lightning-button label="儲存" variant="brand" onclick={handleSave}></lightning-button>
<lightning-input type="text" label="名稱" value={name} onchange={handleNameChange}></lightning-input>
<lightning-combobox label="類型" options={typeOptions} value={selectedType}></lightning-combobox>
<lightning-radio-group name="duration" label="持續時間" options={durationOptions} value={duration} type="radio"></lightning-radio-group>
```

#### 避免純 HTML
```html
<!-- 避免這些做法 -->
<button onclick={handleSave}>儲存</button>
<input type="text" onchange={handleNameChange} />
<select onchange={handleTypeChange}>
    <option value="option1">選項 1</option>
</select>
```

### 2. Lightning 元件對應指南

| HTML 元素 | Lightning 元件 | 關鍵屬性 |
|--------------|-------------------|----------------|
| `<button>` | `<lightning-button>` | `variant`, `label`, `icon-name` |
| `<input>` | `<lightning-input>` | `type`, `label`, `variant` |
| `<select>` | `<lightning-combobox>` | `options`, `value`, `placeholder` |
| `<textarea>` | `<lightning-textarea>` | `label`, `max-length` |
| `<input type="checkbox">` | `<lightning-input type="checkbox">` | `checked`, `label` |
| `<input type="radio">` | `<lightning-radio-group>` | `options`, `type`, `name` |
| `<input type="toggle">` | `<lightning-input type="toggle">` | `checked`, `variant` |
| 自訂 pills | `<lightning-pill>` | `label`, `name`, `onremove` |
| 圖示 | `<lightning-icon>` | `icon-name`, `size`, `variant` |

### 3. 符合 Lightning Design System (SLDS) 規範

#### 使用 SLDS 實用類別 (Utility Classes)
始終使用帶有 `slds-var-` 前綴的 Salesforce Lightning Design System 實用類別進行現代化實作：

```html
<!-- 間距 -->
<div class="slds-var-m-around_medium slds-var-p-top_large">
    <div class="slds-var-m-bottom_small">內容</div>
</div>

<!-- 佈局 -->
<div class="slds-grid slds-wrap slds-gutters_small">
    <div class="slds-col slds-size_1-of-2 slds-medium-size_1-of-3">
        <!-- 內容 -->
    </div>
</div>

<!-- 排版 -->
<h2 class="slds-text-heading_medium slds-var-m-bottom_small">章節標題</h2>
<p class="slds-text-body_regular">描述文字</p>
```

#### SLDS 元件模式
```html
<!-- 卡片佈局 -->
<article class="slds-card slds-var-m-around_medium">
    <header class="slds-card__header">
        <h2 class="slds-text-heading_small">卡片標題</h2>
    </header>
    <div class="slds-card__body slds-card__body_inner">
        <!-- 卡片內容 -->
    </div>
    <footer class="slds-card__footer">
        <!-- 卡片操作 -->
    </footer>
</article>

<!-- 表單佈局 -->
<div class="slds-form slds-form_stacked">
    <div class="slds-form-element">
        <lightning-input label="欄位標籤" value={fieldValue}></lightning-input>
    </div>
</div>
```

### 4. 避免自訂 CSS

#### 使用 SLDS 類別
```html
<!-- 顏色與主題 -->
<div class="slds-theme_success slds-text-color_inverse slds-var-p-around_small">
    成功訊息
</div>

<div class="slds-theme_error slds-text-color_inverse slds-var-p-around_small">
    錯誤訊息
</div>

<div class="slds-theme_warning slds-text-color_inverse slds-var-p-around_small">
    警告訊息
</div>
```

#### 避免自訂 CSS (反模式)
```css
/* 不要建立會覆寫 SLDS 的自訂樣式 */
.custom-button {
    background-color: red;
    padding: 10px;
}

.my-special-layout {
    display: flex;
    justify-content: center;
}
```

#### 必須使用自訂 CSS 時
如果必須使用自訂 CSS，請遵循以下指南：
- 儘可能使用 CSS 自訂屬性 (Design Tokens)
- 為自訂類別加上前綴以避免衝突
- 絕不覆寫 SLDS 基礎類別

```css
/* 自訂 CSS 範例 */
.my-component-special {
    border-radius: var(--lwc-borderRadiusMedium);
    box-shadow: var(--lwc-shadowButton);
}
```

### 5. 元件架構最佳實踐

#### 反應式屬性 (Reactive Properties)
```javascript
import { LightningElement, track, api } from 'lwc';

export default class MyComponent extends LightningElement {
    // 使用 @api 定義公開屬性
    @api recordId;
    @api title;

    // 基本類型屬性 (string, number, boolean) 會自動具備反應性
    // 不需要裝飾器 - 重新賦值會觸發重新渲染
    simpleValue = 'initial';
    count = 0;

    // 計算屬性
    get displayName() {
        return this.name ? `Hello, ${this.name}` : 'Hello, Guest';
    }

    // 對於簡單的屬性重新賦值，不需要 @track
    // 這將自動觸發反應性：
    handleUpdate() {
        this.simpleValue = 'updated'; // 無需 @track 即可響應
        this.count++; // 無需 @track 即可響應
    }

    // 當在不重新賦值的情況下修改巢狀屬性時，需要 @track
    @track complexData = {
        user: {
            name: 'John',
            preferences: {
                theme: 'dark'
            }
        }
    };

    handleDeepUpdate() {
        // 需要 @track，因為我們正在修改巢狀屬性
        this.complexData.user.preferences.theme = 'light';
    }

    // 更好：使用不可變 (Immutable) 模式來避免使用 @track
    regularData = {
        user: {
            name: 'John',
            preferences: {
                theme: 'dark'
            }
        }
    };

    handleImmutableUpdate() {
      // 不需要 @track - 我們正在建立一個新的物件參考
      this.regularData = {
        ...this.regularData,
        user: {
          ...this.regularData.user,
          preferences: {
            ...this.regularData.user.preferences,
            theme: 'light'
          }
        }
      };
    }

    // 陣列：僅在使用變更方法 (Mutating methods) 時需要 @track
    @track items = ['a', 'b', 'c'];

    handleArrayMutation() {
      // 需要 @track
      this.items.push('d');
      this.items[0] = 'z';
    }

    // 更好：使用不可變陣列操作
    regularItems = ['a', 'b', 'c'];

    handleImmutableArray() {
      // 不需要 @track
      this.regularItems = [...this.regularItems, 'd'];
      this.regularItems = this.regularItems.map((item, idx) =>
        idx === 0 ? 'z' : item
      );
    }

    // 僅在修改巢狀屬性時，對複雜物件/陣列使用 @track。
    // 例如，在不重新賦值 complexObject 的情況下更新 complexObject.details.status。
    @track complexObject = {
      details: {
        status: 'new'
      }
    };
}
```

#### 事件處理模式
```javascript
// 分派自訂事件
handleSave() {
    const saveEvent = new CustomEvent('save', {
        detail: {
            recordData: this.recordData,
            timestamp: new Date()
        }
    });
    this.dispatchEvent(saveEvent);
}

// Lightning 元件事件處理
handleInputChange(event) {
    const fieldName = event.target.name;
    const fieldValue = event.target.value;

    // 適用於 lightning-input, lightning-combobox 等
    this[fieldName] = fieldValue;
}

handleRadioChange(event) {
    // 適用於 lightning-radio-group
    this.selectedValue = event.detail.value;
}

handleToggleChange(event) {
    // 適用於 lightning-input type="toggle"
    this.isToggled = event.detail.checked;
}
```

### 6. 資料處理與 Wire 服務

#### 使用 @wire 存取資料
```javascript
import { getRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

const FIELDS = ['Account.Name', 'Account.Industry', 'Account.AnnualRevenue'];

export default class MyComponent extends LightningElement {
    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    record;

    @wire(getObjectInfo, { objectApiName: 'Account' })
    objectInfo;

    get recordData() {
        return this.record.data ? this.record.data.fields : {};
    }
}
```

### 7. 錯誤處理與使用者體驗

#### 實作適當的錯誤邊界 (Error Boundaries)
```javascript
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class MyComponent extends LightningElement {
    isLoading = false;
    error = null;

    async handleAsyncOperation() {
        this.isLoading = true;
        this.error = null;

        try {
            const result = await this.performOperation();
            this.showSuccessToast();
        } catch (error) {
            this.error = error;
            this.showErrorToast(error.body?.message || '發生錯誤');
        } finally {
            this.isLoading = false;
        }
    }

    performOperation() {
        // 開發者定義的非同步操作
    }

    showSuccessToast() {
        const event = new ShowToastEvent({
            title: '成功',
            message: '操作成功完成',
            variant: 'success'
        });
        this.dispatchEvent(event);
    }

    showErrorToast(message) {
        const event = new ShowToastEvent({
            title: '錯誤',
            message: message,
            variant: 'error',
            mode: 'sticky'
        });
        this.dispatchEvent(event);
    }
}
```

### 8. 效能最佳化

#### 條件渲染
優先使用 `lwc:if`, `lwc:elseif` 和 `lwc:else` 進行條件渲染 (API v58.0+)。舊版的 `if:true` / `if:false` 仍受支援，但在新元件中應避免使用。

```html
<!-- 使用模板指令進行條件渲染 -->
<template lwc:if={isLoading}>
    <lightning-spinner alternative-text="載入中..."></lightning-spinner>
</template>
<template lwc:elseif={error}>
    <div class="slds-theme_error slds-text-color_inverse slds-var-p-around_small">
        {error.message}
    </div>
</template>
<template lwc:else>
    <template for:each={items} for:item="item">
        <div key={item.id} class="slds-var-m-bottom_small">
            {item.name}
        </div>
    </template>
</template>
```

```html
<!-- 舊版做法 (在新元件中請避免) -->
<template if:true={isLoading}>
    <lightning-spinner alternative-text="載入中..."></lightning-spinner>
</template>
<template if:true={error}>
    <div class="slds-theme_error slds-text-color_inverse slds-var-p-around_small">
        {error.message}
    </div>
</template>
<template if:false={isLoading}>
  <template if:false={error}>
    <template for:each={items} for:item="item">
        <div key={item.id} class="slds-var-m-bottom_small">
            {item.name}
        </div>
    </template>
  </template>
</template>
```

### 9. 無障礙 (Accessibility) 最佳實踐

#### 使用正確的 ARIA 標籤與語義化 HTML
```html
<!-- 使用語義化結構 -->
<section aria-label="產品選擇">
    <h2 class="slds-text-heading_medium">產品</h2>

    <lightning-input
        type="search"
        label="搜尋產品"
        placeholder="輸入產品名稱..."
        aria-describedby="search-help">
    </lightning-input>

    <div id="search-help" class="slds-assistive-text">
        輸入內容以篩選產品列表
    </div>
</section>
```

## 應避免的常見反模式
- **直接操作 DOM**：絕不使用 `document.querySelector()` 或類似方法
- **jQuery 或外部函式庫**：避免使用與 Lightning 不相容的函式庫
- **內嵌樣式**：使用 SLDS 類別而非 `style` 屬性
- **全域 CSS**：所有樣式應侷限於元件範圍內
- **硬編碼數值**：使用自訂標籤 (Custom Labels)、自訂 Metadata 或常數
- **命令式 API 呼叫**：儘可能優先使用 `@wire` 而非命令式 `import` 呼叫
- **記憶體洩漏**：務必在 `disconnectedCallback()` 中清理事件監聽器
