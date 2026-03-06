---
description: '使用 Fluent UI 透過現代佈景主題樣式化元件'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj}'
---

# 使用現代佈景主題樣式化元件 (預覽)

[本主題是預覽文件，可能會有所變更。]

開發人員需要能夠樣式化其元件，使其看起來與其所包含的應用程式其餘部分一致。當畫布應用程式 (透過 [現代控制項和佈景主題](https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/controls/modern-controls/overview-modern-controls) 功能) 或模型導向應用程式 (透過 [全新外觀](https://learn.microsoft.com/en-us/power-apps/user/modern-fluent-design)) 啟用現代佈景主題時，他們就可以這樣做。

使用基於 [Fluent UI React v9](https://react.fluentui.dev/) 的現代佈景主題來樣式化您的元件。建議採用此方法，以獲得元件的最佳效能和佈景主題體驗。

## 應用現代佈景主題的四種方式

1. **Fluent UI v9 控制項**
2. **Fluent UI v8 控制項**
3. **非 Fluent UI 控制項**
4. **自訂佈景主題提供者**

## Fluent UI v9 控制項

將 Fluent UI v9 控制項包裝為元件是利用現代佈景主題最簡單的方式，因為現代佈景主題會自動應用於這些控制項。唯一的前提是確保您的元件依賴於 [React 控制項和平台函式庫](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/react-controls-platform-libraries)。

此方法允許您的元件使用與平台相同的 React 和 Fluent 函式庫，因此共享相同的 React 上下文，將佈景主題權杖傳遞給元件。

```xml
<resources>
  <code path="index.ts" order="1"/>
  <!-- 依賴於 React 控制項和平台函式庫 -->
  <platform-library name="React" version="16.14.0" />
  <platform-library name="Fluent" version="9.46.2" />
</resources>
```

## Fluent UI v8 控制項

Fluent 提供了一種遷移路徑，用於在您在元件中使用 Fluent UI v8 控制項時應用 v9 佈景主題結構。使用 [Fluent 的 v8 到 v9 遷移套件](https://www.npmjs.com/package/@fluentui/react-migration-v8-v9) 中包含的 `createV8Theme` 函式，根據 v9 佈景主題權杖建立 v8 佈景主題：

```typescript
const theme = createV8Theme(
  context.fluentDesignLanguage.brand,
  context.fluentDesignLanguage.theme
);
return <ThemeProvider theme={theme}></ThemeProvider>;
```

## 非 Fluent UI 控制項

如果您的元件不使用 Fluent UI，您可以直接依賴透過 `fluentDesignLanguage` 上下文參數可用的 v9 佈景主題權杖。使用此參數可存取所有 [佈景主題](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/theming) 權杖，以便它可以參考佈景主題的任何方面來樣式化自身。

```typescript
<span style={{ fontSize: context.fluentDesignLanguage.theme.fontSizeBase300 }}>
  {"使用平台提供的佈景主題樣式化 HTML。"}
</span>
```

## 自訂佈景主題提供者

當您的元件需要與應用程式當前佈景主題不同的樣式時，請建立您自己的 `FluentProvider` 並傳遞您自己的佈景主題權杖集供元件使用。

```typescript
<FluentProvider theme={context.fluentDesignLanguage.tokenTheme}>
  {/* 您的控制項 */}
</FluentProvider>
```

## 範例控制項

這些使用案例的範例可在 [現代佈景主題 API 控制項](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/sample-controls/modern-theming-api-control) 中找到。

## 常見問題

### 問：我的控制項使用 Fluent UI v9 並依賴於平台函式庫，但我不想利用現代佈景主題。我該如何為我的元件停用它？

答：您可以透過兩種不同的方式來做到這一點：

**選項 1**：建立您自己的元件級 `FluentProvider`

```typescript
<FluentProvider theme={customFluentV9Theme}>
  {/* 您的控制項 */}
</FluentProvider>
```

**選項 2**：將您的控制項包裝在 `IdPrefixContext.Provider` 內並設定您自己的 `idPrefix` 值。這可以防止您的元件從平台獲取佈景主題權杖。

```typescript
<IdPrefixProvider value="custom-control-prefix">
  <Label weight="semibold">此標籤未獲取現代佈景主題</Label>
</IdPrefixProvider>
```

### 問：我的一些 Fluent UI v9 控制項未獲取樣式

答：依賴 React Portal 的 Fluent v9 控制項需要重新包裝在佈景主題提供者中，以確保正確應用樣式。您可以使用 `FluentProvider`。

### 問：我如何檢查現代佈景主題是否已啟用？

答：您可以檢查權杖是否可用：`context.fluentDesignLanguage?.tokenTheme`。或者在模型導向應用程式中，您可以檢查應用程式設定：`context.appSettings.getIsFluentThemingEnabled()`。

## 相關文件

- [佈景主題 (Power Apps Component Framework API 參考)](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/theming)
- [現代佈景主題 API 控制項](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/sample-controls/modern-theming-api-control)
- [在畫布應用程式中使用現代佈景主題 (預覽)](https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/controls/modern-controls/modern-theming)
