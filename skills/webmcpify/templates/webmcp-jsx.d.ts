/**
 * 宣告式 WebMCP 屬性的 React JSX 型別定義 — 供應商化自
 * https://github.com/TueJon/webmcpify
 *
 * MIT License
 * Copyright (c) 2026 Jonas Tüchler
 *
 * 特此免費授予任何取得本軟體及相關說明文件檔案（「軟體」）副本之人，
 * 在不受限制的情況下處理本軟體，包括但不限於使用、複製、修改、合併、發布、
 * 散布、再授權及/或販售本軟體之副本的權利，並允許獲得本軟體之人遵循下列條件：
 *
 * 上述著作權聲明及本授權聲明應包含於本軟體之所有副本或重要部分中 —
 * 當將此檔案複製到你的專案中時，請保留此標頭。
 *
 * 本軟體係「依現狀」提供，不提供任何明示或默示之保證，包括但不限於
 * 適銷性、特定目的之適用性及不侵權之保證。在任何情況下，作者或著作權持有人
 * 均不對因本軟體或本軟體之使用或其他交易而產生或與之相關的任何合約、
 * 侵權或其他訴訟中的任何索賠、損害或其他責任負責。
 *
 * 完整文字：https://github.com/TueJon/webmcpify/blob/main/LICENSE
 *
 * 注意：此檔案是一個模組（`declare module 'react'` 需要 `import`）
 * — 請將其與 webmcp.d.ts 分開保存。若將其合併至該處，會為該檔案新增 import，
 * 進而使其變成模組並失去全域環境介面的特性（已透過經驗驗證）。
 * 在 React TSX 專案中請並排供應商化這兩個檔案。
 */
 * Full text: https://github.com/TueJon/webmcpify/blob/main/LICENSE
 *
 * NOTE: this file is a MODULE (`declare module 'react'` requires the `import`)
 * — keep it SEPARATE from webmcp.d.ts. Merging it there would add an import to
 * that file, turning it into a module and un-globalizing its ambient interfaces
 * (empirically verified). Vendor both files side by side in React TSX projects.
 */

import 'react';

declare module 'react' {
  interface FormHTMLAttributes<T> {
    toolname?: string;
    tooldescription?: string;
    /**
     * 布林屬性 — 在 TSX 中寫入 `toolautosubmit=""`。僅用於純讀取
     * 表單（搜尋/篩選/可用性）；絕不要在變更狀態的表單中使用。
     */
    toolautosubmit?: string;
  }
  interface InputHTMLAttributes<T> {
    toolparamdescription?: string;
  }
  interface SelectHTMLAttributes<T> {
    toolparamdescription?: string;
  }
  interface TextareaHTMLAttributes<T> {
    toolparamdescription?: string;
  }
  interface FieldsetHTMLAttributes<T> {
    toolparamdescription?: string;
  }
}
