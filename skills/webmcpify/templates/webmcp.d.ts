/**
 * WebMCP API 的環境型別 — 擷取自 https://github.com/TueJon/webmcpify
 *
 * MIT License
 * Copyright (c) 2026 Jonas Tüchler
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software — keep this header when
 * copying this file into your project.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Full text: https://github.com/TueJon/webmcpify/blob/main/LICENSE
 *
 * registerTool/ontoolchange/annotations/getTools 遵循 CG 草案
 * (https://webmachinelearning.github.io/webmcp/)；executeTool 是 Chrome 專屬的
 * 擴充功能，尚未納入草案。此 API 仍在變動中 — 更新時請對照草案與
 * https://developer.chrome.com/docs/ai/webmcp 重新確認。
 *
 * 這是一個全域指令碼檔案 — 沒有 imports（import 會將其轉為模組，
 * 並取消每個介面的全域化）。宣告式屬性的 React JSX 型別定義位於獨立的
 * webmcp-jsx.d.ts 範本中。
 */

interface ModelContextToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

interface ModelContext extends EventTarget {
  registerTool(
    tool: ModelContextTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ): Promise<void>;
  ontoolchange: ((this: ModelContext, ev: Event) => unknown) | null;
  /**
   * 列舉公開給此文件的工具。於 2026-07 新增至 CG 草案中；
   * 適用於頁面內的 Agent 和測試控治架構，而非應用程式邏輯。
   */
  getTools(options?: { fromOrigins?: string[] }): Promise<RegisteredTool[]>;
  /**
   * 僅限 Chrome 的執行層面（2026-07+；尚未納入 CG 草案）；
   * 取代了已移除的 navigator.modelContextTesting API。
   */
  executeTool?(
    tool: RegisteredTool,
    inputJson: string,
    options?: { signal?: AbortSignal },
  ): Promise<string | null>;
}

interface ModelContextTool {
  /** [a-zA-Z0-9_.-]；規格允許最多 128 個字元，Google 建議 ≤30 個字元 */
  name: string;
  /** 選用的顯示標籤 */
  title?: string;
  /** 自然語言功能陳述，建議 ≤500 個字元 */
  description: string;
  /** 工具輸入的 JSON Schema */
  inputSchema?: object;
  /**
   * 僅傳遞 `input` — IDL 中沒有 client/session 引數。
   * IDL：`Promise<any>` — WebIDL 會自動將同步回傳（以及拋出例外）包裝在
   * Promise 中，因此同步實作在執行階段仍符合此型別；
   * 為了型別精確性，請將其宣告為非同步 (async)。
   */
  execute(input: Record<string, unknown>): Promise<unknown>;
  annotations?: ModelContextToolAnnotations;
}

/** getTools() 回傳的結構。注意 inputSchema 是一個字串化的 JSON Schema。 */
interface RegisteredTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: string;
  annotations?: ModelContextToolAnnotations;
  /** 註冊來源（僅限安全來源）。 */
  origin: string;
  /** 所屬視窗（跨文件列舉）。 */
  window: Window;
}

interface Document {
  readonly modelContext?: ModelContext;
}

interface Navigator {
  /** 已棄用的 Chrome 149 原生試用 (origin-trial) 層面；建議改用 document.modelContext。 */
  readonly modelContext?: ModelContext;
}

/** 宣告式表單提交：Agent 呼叫旗標 + 結果橋接器。 */
interface SubmitEvent {
  readonly agentInvoked?: boolean;
  respondWith?(result: Promise<unknown>): void;
}
