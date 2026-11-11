/**
 * WebMCP API 的全域環境型別 — 供應商化自 https://github.com/TueJon/webmcpify
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
 * registerTool/ontoolchange/annotations/getTools/executeTool 遵循 CG 草案
 * (https://webmachinelearning.github.io/webmcp/)。Chrome 來源試用的 I/O 外觀
 * 可能落後於該草案；請保持下方的相容性備註帶有日期與明確說明。
 *
 * 這是一個全域腳本檔案 — 沒有 import（import 會使其變為模組並
 * 取消每個介面的全域化）。用於宣告式屬性的 React JSX 型別定義
 * 位於獨立的 webmcp-jsx.d.ts 範本中。
 */
 * (https://webmachinelearning.github.io/webmcp/). Chrome's origin-trial I/O shape
 * can lag that draft; keep the compatibility notes below dated and explicit.
 *
 * This is a GLOBAL script file — no imports (an import would turn it into a
 * module and un-globalize every interface). React JSX typings for the declarative
 * attributes live in the separate webmcp-jsx.d.ts template.
 */

interface ModelContextToolAnnotations {
  /** 開發者工具提示；絕非強制執行。 */
  debugging?: boolean;
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  /** 重大的現實世界或不可逆效果；提示，絕非強制執行。 */
  consequentialHint?: boolean;
}

type ModelContextToolResult =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | unknown[];

/** 目前的 CG 回呼選項。舊版 Chrome 150 可能省略選項引數。 */
interface ToolExecuteCallbackOptions {
  signal: AbortSignal;
}

interface ToolActivatedEvent extends Event { readonly toolName: string; }
interface ToolCancelEvent extends Event { readonly toolName: string; }
interface ModelContextEventMap {
  toolchange: Event;
  toolactivated: ToolActivatedEvent;
  toolcancel: ToolCancelEvent;
}

interface ModelContext extends EventTarget {
  ontoolactivated: ((this: ModelContext, ev: ToolActivatedEvent) => unknown) | null;
  ontoolcancel: ((this: ModelContext, ev: ToolCancelEvent) => unknown) | null;
  addEventListener<K extends keyof ModelContextEventMap>(
    type: K, listener: (this: ModelContext, ev: ModelContextEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof ModelContextEventMap>(
    type: K, listener: (this: ModelContext, ev: ModelContextEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions): void;
  registerTool(
    tool: ModelContextTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ): Promise<void>;
  ontoolchange: ((this: ModelContext, ev: Event) => unknown) | null;
  /**
   * 列舉向此文件公開的工具。於 2026-07 新增至 CG 草案；
   * 適用於頁內代理人與測試載具，而非應用程式邏輯。
   */
  getTools(options?: { fromOrigins?: string[] }): Promise<RegisteredTool[]>;
  /**
   * CG 草案中的代理人/測試執行介面。目前的 Chrome 接受物件
   * 並傳回其序列化結果；為了 Chrome/宣告式相容性保留了導覽 null，
   * 即使 2026-10-02 草案 IDL 列出 DOMString。Chrome 150 的 JSON 字串
   * 輸入保留在驗證配接器中。
   */
  executeTool?(
    tool: RegisteredTool,
    inputObject?: unknown,
    options?: { signal?: AbortSignal },
  ): Promise<string | null>;
  /** 供應商化工作台所使用的內部模擬功能。 */
  __webmcpStubObjectMode?: boolean;
}

interface ModelContextTool {
  /** [a-zA-Z0-9_.-]；規格允許最多 128 個字元，Google 建議 ≤30 */
  name: string;
  /** 選用的顯示標籤 */
  title?: string;
  /** 自然語言能力聲明，建議 ≤500 個字元 */
  description: string;
  /** 工具輸入的 JSON Schema */
  inputSchema?: object;
  /**
   * 目前草案傳遞帶有必要信號的選項；此處第二個引數為選用，
   * 以代表舊版 Chrome 150。原樣轉發選項；註冊信號僅控制可用性。
   * 傳回 JSON 安全的結果，絕不要單純缺席。原生 executeTool
   * 會序列化次回呼結果（已於 2026-10-05 檢查）。
   */
  execute(input: Record<string, unknown>, options?: ToolExecuteCallbackOptions): Promise<ModelContextToolResult>;
  annotations?: ModelContextToolAnnotations;
}

/** getTools() 傳回的外觀。較舊的 Chrome 可能會將 JSON Schema 字串化 — 請處理這兩種形式。 */
interface RegisteredTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: string | object;
  annotations?: ModelContextToolAnnotations;
  /** 註冊來源（僅限安全來源）。 */
  origin: string;
  /** 擁有的視窗（跨文件列舉）。 */
  window: Window;
}

interface Document {
  readonly modelContext?: ModelContext;
}

interface Navigator {
  /** 已棄用的 Chrome 149 來源試用介面；優先使用 document.modelContext。 */
  readonly modelContext?: ModelContext;
}

/** 宣告式表單提交：代理人叫用旗標 + 結果橋接器。 */
interface SubmitEvent {
  readonly agentInvoked?: boolean;
  respondWith?(result: Promise<unknown>): void;
}
