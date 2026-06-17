# 組件架構參考

此參考定義了 `src/components` 中的分類、檔案佈局和依賴方向。

## 設計意圖與原則

此技能的目標不僅是添加 React 組件，還在於應用與職責分離和依賴方向明確一致的 Container/Presentation 模式。

此參考不定義完整的應用程式範圍架構。它專注於組件邊界的設計品質。

- 將渲染責任與邏輯責任分開。
- 不要將狀態管理、副作用或業務決策放在表現層 (Presentation Layer)。
- 避免在邊界之間混合職責，並保持依賴方向明確。

## 分類

- 將所有組件放在 `src/components` 下。
- 僅使用兩個類別：
  - `ui`: 僅限渲染、無狀態組件。
  - `features`: 包含邏輯的組件。

## 重新分類規則

如果使用者請求 `ui` 但實施中包含以下任何內容，請將其視為 `features` 並在建立檔案之前徵求確認：

- `useState`, `useReducer`, 或 `useEffect`。
- 非同步行為（API 調用、定時器、訂閱）。
- 從 Context/Store 讀取或寫入。
- 業務/數據轉換邏輯。

使用這些選項進行詢問：

- `作為 features 建立`
- `保持 ui 並將邏輯/狀態移至父組件或 features`

## 分層職責

此技能分兩個階段定義層級。

### 1. 組件類型層

| 類型       | 職責                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------- |
| `ui`       | 可重用的僅限渲染組件。不得包含業務邏輯、副作用或狀態管理。                                   |
| `features` | 面向用例的組件。處理狀態轉換、事件解釋和非同步編排。                                         |

### 2. `features` 中的內部層級

| 層級          | 職責                                                                      | 主要檔案                                                              |
| -------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `container`    | 處理狀態管理、副作用、事件處理和數據獲取。                               | `index.tsx`, `use<ComponentName>.tsx`, `types.ts`                          |
| `presentation` | 接收 Props 且僅渲染 UI。不得執行外部 I/O 或狀態更新。                     | `presentation.tsx`, `presentation.module.scss`, `presentation.stories.tsx` |

注意：

- `ui` 僅由 Presentation 組成。
- `features` 必須分離 Container 和 Presentation。

## 實施規則

### ui

- 保持組件無狀態。
- 透過 Props 接收數據和回呼。
- 不要添加副作用或數據獲取。
- 首先考慮使用 Mantine 或其他 UI 庫的 primitives；僅在需要時使用自定義 JSX/SCSS。

### features

- 使用 Container/Presentation 模式。
- 將邏輯保留在 `use<ComponentName>.tsx` 中。
- 遵循下方的 `Container/Presentation 分離規則（反模式與決策示例）` 以了解詳細的職責邊界和反模式。

### Container/Presentation 分離規則（反模式與決策示例）

原則：

- Container 負責狀態管理、副作用、事件解釋和非同步處理。
- Presentation 僅負責從接收到的 Props 進行渲染。
- 將業務決策和數據轉換保留在 Container 側代碼中，而不是 Presentation 中。

放置規則：

- 放置在 Container：`useState` / `useReducer` / `useEffect`、API 調用、Context/Store 讀寫、業務規則應用。
- 放置在 Presentation：JSX 渲染和僅限顯示的分支（例如：空狀態、加載中、錯誤視圖）。
- 使用 `types.ts` 定義 Container 和 Presentation 之間的 I/O 合約。

反模式：

- 從 Presentation 調用 API 或 Mutations。
- 直接從 Presentation 更新 Context/Store。
- 在 Presentation 中實施業務決策（授權檢查、狀態轉換決策、數據整形）。
- 形式上拆分檔案，但在 Presentation 中保留實際邏輯。

好/壞示例：

- 壞：`presentation.tsx` 直接獲取數據並管理加載狀態。
- 好：`use<ComponentName>.tsx` 管理數據獲取和狀態，而 `presentation.tsx` 僅從 `isLoading`、`items` 和 `onAction` 等 Props 進行渲染。

## 依賴方向

- `features` -> `ui`: 允許。
- `ui` -> `features`: 禁止。

## 檔案結構

### ui

- `index.tsx`
- `presentation.tsx`
- `presentation.stories.tsx`
- `presentation.module.scss`

### features

- `index.tsx`
- `use<ComponentName>.tsx`
- `presentation.tsx`
- `types.ts`
- `presentation.stories.tsx`
- `presentation.module.scss`

## Storybook 最小值

- 始終建立 `Default`。
- 僅在存在不同狀態時添加特定於狀態的 Story。
- 優先考慮基於行為的 Story 集：
  - 互動控制：`Hover`。
  - 輸入類：`Focus`, `Error`, `Disabled`。
  - 佈局/展開-收起：`Open`, `Closed`, `Empty`。
