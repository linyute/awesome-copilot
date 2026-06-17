# TypeScript 與 SCSS 規則參考

## TypeScript 規則

- 請勿使用 `any`。

  ```ts
  // 錯誤
  const handler = (e: any) => {};

  // 正確
  const handler = (e: React.ChangeEvent<HTMLInputElement>) => {};
  ```

- 為 Props 使用 `type` 而非 `interface`。

  ```ts
  // 錯誤
  interface ButtonProps {
    label: string;
  }

  // 正確
  type ButtonProps = { label: string };
  ```

- 明確標註函數返回類型。

  ```ts
  // 錯誤
  const getLabel = () => "hello";

  // 正確
  const getLabel = (): string => "hello";
  ```

## SCSS 規則

### 標記 (Tokens)

- 使用來自 `src/styles/theme.scss` 的顏色變數。
- 使用來自 `src/styles/animation.scss` 的動畫變數。
- 在 `src/styles/z-index.scss` 中定義 z-index 標記，並在組件樣式中使用這些標記。
- 在組件 SCSS 中，請勿硬編碼 z-index 值（例如：避免使用 `z-index: 10;`，而應使用 z-index 標記）。

### 樣式限制

- 優先考慮使用 Mantine 或其他 UI 庫；僅在補充庫樣式必要時才使用 SCSS。
- 請勿使用負邊距 (negative margins)。
- 優先使用無單位 `line-height`。
- 優先使用以 `em` 為單位的 `letter-spacing`。
- 當需要邊距時，僅允許使用 `margin-top` 和 `margin-left`。
- 請勿在根元素上設定 `margin` 或 `position`。
- `src/styles/z-index.scss` 中的數值必須遵循 50 步長刻度（100, 150, ...）。
