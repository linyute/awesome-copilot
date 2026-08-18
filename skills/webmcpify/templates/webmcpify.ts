/**
 * webmcpify 執行階段 — 擷取自 https://github.com/TueJon/webmcpify
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
 * 圍繞 WebMCP API（document.modelContext、W3C Web Machine
 * Learning CG 草案 / Chrome 原生試用）符合規格的輔助程式。請直接納入此檔案；
 * 不要將其新增為相依套件。所有內容皆透過功能偵測：在沒有 WebMCP 的瀏覽器中，
 * 每個函式都是安全的不執行作業 (no-op)，應用程式行為完全一致。
 */

/**
 * 打包工具會將 `process.env.NODE_ENV` 替換為常值（Vite/webpack 會自動處理；
 * esbuild 則透過 `--define`）。此宣告僅用於滿足型別檢查器 — 瀏覽器檔案中不需要
 * 也不想要 Node 環境型別。
 */
declare const process: { env: { NODE_ENV?: string } };

export interface ToolScopeOptions {
  exposedTo?: string[];
  /**
   * 協定驗證（名稱/說明長度上限）。預設值：當打包工具替換 `process.env.NODE_ENV`
   * （Vite/webpack 自動；esbuild 透過 `--define`）且其值不為 `'production'` 時啟用；
   * 未打包的專案預設為 false — 開發期間請傳遞 `validate: true`。
   */
  validate?: boolean;
  /**
   * 當範疇內任何註冊失敗時呼叫（該範疇會被復原）。
   * 若在註冊完成前已處置範疇，則不會呼叫。
   */
  onError?: (error: unknown) => void;
}

/**
 * 由 `createToolScope` 回傳的可呼叫處置控制代碼 — 呼叫以進行處置
 * （向後相容於 `const dispose = createToolScope(...)`）。
 */
export interface ToolScopeHandle {
  /** 處置：中止註冊訊號，釋放索引鍵。 */
  (): void;
  /**
   * true = 所有註冊皆已確認且範疇仍處於作用狀態；
   * false = 無 WebMCP / 索引鍵已在使用 / 註冊失敗（已復原）/
   * 先被處置。絕不會拒絕 — 失敗會傳遞至 `onError`。
   */
  ready: Promise<boolean>;
}

/** 唯一引用原始 API 的地方 — 規格變更只需修改此單一檔案。 */
export function getModelContext(): ModelContext | undefined {
  if (typeof document !== 'undefined' && document.modelContext) return document.modelContext;
  // Chrome 149 原生試用所使用的已棄用層面；過時後將移除。
  if (typeof navigator !== 'undefined' && navigator.modelContext) return navigator.modelContext;
  return undefined;
}

export function isWebMCPAvailable(): boolean {
  return getModelContext() !== undefined;
}

const scopes = new Map<string, AbortController>();

function makeHandle(dispose: () => void, ready: Promise<boolean>): ToolScopeHandle {
  const handle = dispose as ToolScopeHandle;
  handle.ready = ready;
  return handle;
}

/**
 * 在單一範疇索引鍵下註冊一組工具。回傳帶有 `ready: Promise<boolean>`
 * 的可呼叫處置控制代碼（參見 ToolScopeHandle）。
 *
 * - AbortSignal 是規格中唯一的取消註冊機制 — 處置會中止該訊號。
 * - 驗證在任何註冊之前執行，因此不良協定永遠不會留下半註冊的範疇。
 * - 註冊失敗 — 包含拒絕以及同步拋出例外的 registerTool 實作
 *   （2026-07 之前的 Chromium）— 都會復原整個範疇，將 `ready` 解析為
 *   false，並透過 `onError` 回報（預設：console.error）；
 *   索引鍵絕不會滯留。
 * - 在註冊完成前進行處置（例如 React StrictMode 卸載）會以無提示方式
 *   復原：`ready` 解析為 false 且不會呼叫 `onError`。
 * - 使用已處於作用狀態的索引鍵呼叫時，會回傳一個不執行作業的控制代碼
 *   (`ready` → false) 且保留現有範疇不變。
 */
export function createToolScope(
  key: string,
  tools: ModelContextTool[],
  options?: ToolScopeOptions,
): ToolScopeHandle {
  const mc = getModelContext();
  if (!mc) return makeHandle(() => {}, Promise.resolve(false));
  if (scopes.has(key)) return makeHandle(() => {}, Promise.resolve(false));

  if (shouldValidate(options)) for (const tool of tools) validateTool(tool);

  const controller = new AbortController();
  scopes.set(key, controller);

  let disposed = false;
  const rollback = () => {
    if (scopes.get(key) === controller) {
      controller.abort();
      scopes.delete(key);
    }
  };

  const registerOptions: { signal: AbortSignal; exposedTo?: string[] } = {
    signal: controller.signal,
  };
  if (options?.exposedTo) registerOptions.exposedTo = options.exposedTo;

  let registrations: Promise<unknown>;
  try {
    // 舊版 registerTool 實作會同步拋出例外而非拒絕 — 進行正規化
    // 使下方的復原路徑能涵蓋兩者。
    registrations = Promise.all(tools.map((tool) => mc.registerTool(tool, registerOptions)));
  } catch (error) {
    registrations = Promise.reject(error);
  }

  const ready = registrations.then(
    () => scopes.get(key) === controller, // 若在敲定前已處置則為 false
    (error) => {
      rollback();
      if (!disposed) {
        const report =
          options?.onError ??
          ((e: unknown) => console.error(`webmcpify: registration failed for scope "${key}"`, e));
        report(error);
      }
      return false;
    },
  );

  return makeHandle(() => {
    disposed = true;
    rollback();
  }, ready);
}

/**
 * 將 execute() 橋接至應用程式本身的事件/狀態流程。派送的 detail
 * 攜帶 `{ ...detail, requestId, signal }` — `signal` 是一個在逾時時會中止的 AbortSignal；
 * 處理常式應將其傳遞給 fetch()，並在中止後跳過狀態確認和完成派送。
 * 僅在元件透過派送帶有 `detail: { ok: boolean, message?: string, error?: string }`
 * 的 `tool-completion-<requestId>` 確認結果後才進行解析 — 且必須在非同步作業真正完成
 * （等待 fetch/狀態確認/轉譯）之後執行，因為 Agent 會根據畫面上的內容進行規劃。
 *
 * 完成協定採用失敗閉合 (fails closed)：`ok === true` 解析訊息，
 * `ok === false` 解析為 `"ERROR: <error>"`，其他任何情況（缺少或非布林值的 `ok`、
 * 無 detail）皆解析為回報未知結果的 ERROR 字串。逾時亦解析為 ERROR 字串。
 * 絕不拒絕 — 模型可以在 execute() 內無未處理拒絕的情況下進行自我修正。
 */
export function dispatchAndWait(
  eventName: string,
  detail: Record<string, unknown> = {},
  timeoutMs = 10000,
): Promise<string> {
  return new Promise((resolve) => {
    const requestId = Math.random().toString(36).slice(2, 12);
    const completionEvent = `tool-completion-${requestId}`;
    const abort = new AbortController();
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener(completionEvent, onDone as EventListener);
    };
    const timer = setTimeout(() => {
      cleanup();
      abort.abort();
      resolve(
        'ERROR: The interface did not confirm this action in time. The request was signalled to cancel but may still be processing — check the current page state before retrying.',
      );
    }, timeoutMs);
    const onDone = (event: Event) => {
      cleanup();
      const result =
        (event as CustomEvent<{ ok?: unknown; message?: string; error?: string }>).detail ?? {};
      if (result.ok === true) {
        resolve(result.message ?? 'Action completed successfully.');
      } else if (result.ok === false) {
        resolve(`ERROR: ${result.error ?? 'The action failed.'}`);
      } else {
        resolve(
          'ERROR: The interface sent a completion without a boolean `ok` — the outcome is unknown. Check the current page state before retrying.',
        );
      }
    };
    window.addEventListener(completionEvent, onDone as EventListener);
    window.dispatchEvent(
      new CustomEvent(eventName, { detail: { ...detail, requestId, signal: abort.signal } }),
    );
  });
}

/**
 * 序列化工具的 execute()：當一次呼叫正在處理中時，後續的呼叫會立即解析為
 * 忙碌 ERROR 字串，而非競爭共享的使用者介面狀態。
 *
 * ```ts
 * execute: singleFlight(async (input) => dispatchAndWait('webmcp:save', input)),
 * ```
 */
export function singleFlight<A extends unknown[]>(
  fn: (...args: A) => string | Promise<string>,
  busyMessage = 'ERROR: A previous invocation of this tool is still in progress. Wait for it to finish, then check the current page state before retrying.',
): (...args: A) => Promise<string> {
  let inFlight = false;
  return async (...args: A) => {
    if (inFlight) return busyMessage;
    inFlight = true;
    try {
      return await fn(...args);
    } finally {
      inFlight = false;
    }
  };
}

function shouldValidate(options?: ToolScopeOptions): boolean {
  if (options?.validate !== undefined) return options.validate;
  // 打包工具會替換常值；未打包時，直接引用會拋出例外 → false。
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

/** 協定品質檢查（Google 建議的長度上限）。 */
function validateTool(tool: ModelContextTool): void {
  const problems: string[] = [];
  if (!/^[a-zA-Z0-9_.-]{1,30}$/.test(tool.name)) {
    problems.push(`name "${tool.name}" should be 1-30 chars of [a-zA-Z0-9_.-]`);
  }
  if (!tool.description) problems.push(`tool "${tool.name}" is missing a description`);
  else if (tool.description.length > 500) {
    problems.push(`tool "${tool.name}" description exceeds 500 chars`);
  }
  if (problems.length) throw new Error(`webmcpify: ${problems.join('; ')}`);
}
