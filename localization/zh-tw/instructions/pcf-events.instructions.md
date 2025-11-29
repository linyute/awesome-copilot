---
description: '在 PCF 元件中定義與處理自訂事件'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj}'
---

# 定義事件 (預覽)

[本主題為預發佈文件，可能會有所變更。]

使用 Power Apps Component Framework 建立自訂元件時，一個常見的需求是能夠對控制項中產生的事件做出反應。這些事件可以透過使用者互動或透過程式碼以程式設計方式叫用。例如，應用程式可以有一個程式碼元件，讓使用者建立產品組合。此元件還可以引發一個事件，該事件可以在應用程式的另一個區域中顯示產品資訊。

## 元件資料流

程式碼元件的常見資料流是資料從主機應用程式流向控制項作為輸入，以及更新的資料從控制項流向主機表單或頁面。此圖顯示典型 PCF 元件的標準資料流模式：

![顯示從程式碼元件到綁定欄位的資料更新會觸發 OnChange 事件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/component-events-onchange-example.png)

從程式碼元件到綁定欄位的資料更新會觸發 `OnChange` 事件。對於大多數元件情境，這已足夠，製造者只需新增處理常式即可觸發後續動作。然而，更複雜的控制項可能需要引發不是欄位更新的事件。事件機制允許程式碼元件定義具有獨立事件處理常式的事件。

## 使用事件

PCF 中的事件機制基於 JavaScript 中的標準事件模型。元件可以在資訊清單檔案中定義事件，並在程式碼中引發這些事件。主機應用程式可以偵聽這些事件並對其做出反應。

### 在資訊清單中定義事件

元件使用資訊清單檔案中的 [事件元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/event) 定義事件。此資料允許各自的主機應用程式以不同的方式對事件做出反應。

```xml
<property
  name="sampleProperty"
  display-name-key="Property_Display_Key"
  description-key="Property_Desc_Key"
  of-type="SingleLine.Text"
  usage="bound"
  required="true"
/>
<event
  name="customEvent1"
  display-name-key="customEvent1"
  description-key="customEvent1"
/>
<event
  name="customEvent2"
  display-name-key="customEvent2"
  description-key="customEvent2"
/>
```

### 畫布應用程式事件處理

畫布應用程式使用 Power Fx 運算式對事件做出反應：

![顯示畫布應用程式設計師中的自訂事件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/custom-events-in-canvas-designer.png)

### 模型導向應用程式事件處理

模型導向應用程式使用 [addEventHandler 方法](https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/controls/addeventhandler) 將事件處理常式與元件的自訂事件關聯。

```javascript
const controlName1 = "cr116_personid";

this.onLoad = function (executionContext) {
  const formContext = executionContext.getFormContext();

  const sampleControl1 = formContext.getControl(controlName1);
  sampleControl1.addEventHandler("customEvent1", this.onSampleControl1CustomEvent1);
  sampleControl1.addEventHandler("customEvent2", this.onSampleControl1CustomEvent2);
}
```

> **注意**：這些事件對於應用程式中程式碼元件的每個實例都會單獨發生。

## 為模型導向應用程式定義事件

對於模型導向應用程式，您可以傳遞包含事件的 payload，從而實現更複雜的情境。例如，下圖中元件在事件中傳遞回呼函式，允許腳本處理回呼元件。

![在此範例中，元件在事件中傳遞回呼函式，允許腳本處理回呼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/passing-payload-in-events.png)

```javascript
this.onSampleControl1CustomEvent1 = function (params) {
   //alert(`SampleControl1 Custom Event 1: ${params}`);
   alert(`SampleControl1 Custom Event 1`);
}.bind(this);

this.onSampleControl2CustomEvent2 = function (params) {
  alert(`SampleControl2 Custom Event 2: ${params.message}`);
  // prevent the default action for the event
  params.callBackFunction();
}
```

## 為畫布應用程式定義事件

製造者使用屬性窗格中 PCF 控制項上的 Power Fx 設定事件。

## 呼叫事件

請參閱如何在 [事件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/events) 中呼叫事件。

## 後續步驟

[教學課程：在元件中定義自訂事件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/tutorial-define-event)
