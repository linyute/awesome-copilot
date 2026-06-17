---
name: react-container-presentation-component
description: "透過詢問組件名稱和類型（ui 或 features），在 src/components 中使用 Container/Presentation 模式建立 React 組件，然後建立遵循此儲存庫的 TypeScript、Storybook 和 SCSS 規範的檔案。當使用者明確要求基於 Container/Presentation 的組件或執行 /react-container-presentation-component 時使用。"
argument-hint: "組件名稱 類型(ui|features)"
user-invocable: true
---

# Container/Presentation 組件

使用此技能在 `src/components` 下建立遵循 Container/Presentation 模式的 React 組件。

有關詳細規則，請參閱此技能捆綁的參考資料。

- `references/component-architecture.md`
- `references/typescript-and-scss-rules.md`

如果 `/react-container-presentation-component` 輸入不完整，請在建立檔案之前先提問。

## 何時使用

- 當使用者執行 `/react-container-presentation-component` 時
- 當使用者明確要求遵循 Container/Presentation 模式的 React 組件時
- 當使用者想要在 Container/Presentation 模式中協助決定或實施 `ui` 與 `features` 分類時

## 必填問題

如果缺少以下任何資訊，請使用 `ask_user` 詢問使用者。

1. 組件名稱
2. 類型（`ui` 或 `features`）
3. 是否替換現有組件（僅在建立 `ui` 時）

問題要求：

- 將類型作為選項提供（`ui`、`features`）
- 要求組件名稱為 PascalCase
- 對於 `ui`，詢問現有 `features` 中直接使用 Mantine 或其他 UI 庫的部分是否應替換為新的組件

## 程序

1. 檢查現有組件

- 檢查 `src/components/ui/<ComponentName>` 或 `src/components/features/<ComponentName>` 是否已存在。
- 如果已存在，請勿覆蓋；與使用者確認偏好的方法。

2. 決定目標目錄

- `ui`: `src/components/ui/<ComponentName>`
- `features`: `src/components/features/<ComponentName>`

3. 重新檢查分類（僅在指定 `ui` 時）

- 即使指定了 `ui`，在建立檔案之前，請查看 `references/component-architecture.md` 中的 `重新分類規則`。
- 如果實施包含狀態管理、副作用、非同步處理、上下文/存儲更新或業務邏輯，請將其視為 `features`。
- 如果結果更接近 `features`，請勿以 `ui` 繼續；在繼續之前使用 `ask_user` 確認以下內容之一。
  - `作為 features 建立`
  - `保持 ui 並將狀態/邏輯移至父組件或 features`

4. 建立所需檔案

- `ui`: `index.tsx`, `index.module.scss`, `index.stories.tsx`
- `features`: `index.tsx`, `use<ComponentName>.tsx`, `presentation.tsx`, `types.ts`, `presentation.module.scss`, `presentation.stories.tsx`

5. 替換現有用法（僅在建立 `ui` 時）

- 僅在使用者批准時，將現有 `features` 中使用 Mantine 或其他 UI 庫的等效直接實施替換為新的 `ui` 組件。

6. 驗證

- 執行構建和 lint 命令，並確保兩者都通過；如果新添加或更新的檔案引入了問題，請修復它們。
- 遵循 `references/component-architecture.md` 中的 `Storybook 最小值` 來決定 Story 狀態。
- 透過 `ask_user` 詢問使用者是否執行 Storybook 檢查（例如：「執行」 / 「暫時跳過」）。
- 僅當使用者選擇「執行」時才執行 `npm run storybook`。
- 如果使用者選擇「暫時跳過」，請在最終報告中明確提到跳過了 Storybook 執行。

## 輸出合約

- 報告建立的檔案列表。
- 如果執行了替換，請報告更改的檔案列表和替換詳情。
- 提供一個所建立組件的用法示例。
- 報告是否執行了 Storybook 驗證（執行/跳過），如果執行了，請包括使用的命令。
- 解釋為什麼將該組件分類為 `ui` 或 `features`。
- 總結狀態、副作用和渲染責任的放置位置。
- 確認是否存在任何依賴方向違規。
- 明確說明任何未解決的項目。
