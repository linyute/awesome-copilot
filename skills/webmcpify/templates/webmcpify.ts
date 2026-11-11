/**
 * webmcpify 執行階段 — 供應商化自 https://github.com/TueJon/webmcpify
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
 * 圍繞 WebMCP API 的規格外觀輔助程式（document.modelContext，W3C Web Machine
 * Learning CG 草案 / Chrome 來源試用）。請供應商化此檔案；不要將其作為
 * 相依套件新增。所有功能皆經過特性偵測：在沒有 WebMCP 的瀏覽器中，每個
 * 函式都是安全的空操作 (no-op)，且應用程式行為完全相同。
 */
 * Full text: https://github.com/TueJon/webmcpify/blob/main/LICENSE
 *
 * Spec-shaped helper around the WebMCP API (document.modelContext, W3C Web Machine
 * Learning CG draft / Chrome origin trial). Vendor this file; do not add it as a
 * dependency. Everything is feature-detected: in browsers without WebMCP every
 * function is a safe no-op and the app behaves identically.
 */

/**
 * 打包工具會將 `process.env.NODE_ENV` 替換為常值（Vite/webpack 會
 * 自動處理；esbuild 則透過 `--define`）。此宣告僅用於滿足
 * 型別檢查器 — 在瀏覽器檔案中不需要也不希望有 Node 環境型別。
 */
declare const process: { env: { NODE_ENV?: string } };

export interface ToolScopeOptions {
  exposedTo?: string[];
  /**
   * 契約驗證（名稱/說明長度預算）。預設值：當打包工具替換
   * `process.env.NODE_ENV`（Vite/webpack 自動；esbuild 透過 `--define`）
   * 且非 `'production'` 時啟用；未打包的專案預設為 false — 在開發期間請傳遞 `validate: true`。
   */
   */
  validate?: boolean;
  /**
   * 當範圍中的任何註冊失敗時呼叫（該範圍會被回復）。
   * 若在註冊確立前已處置範圍，則不會呼叫。
   */
  onError?: (error: unknown) => void;
}

/**
 * `createToolScope` 傳回的可呼叫處置控制代碼 — 呼叫它即可進行處置
 * （回溯相容於 `const dispose = createToolScope(...)`）。
 */
export interface ToolScopeHandle {
  /** 處置：中止註冊信號，釋放索引鍵。 */
  (): void;
  /**
   * true = 所有註冊皆已提交且範圍仍然作用中；
   * false = 無 WebMCP / 索引鍵已作用中 / 註冊失敗（已回復）/
   * 先被處置。絕不拒絕 — 失敗會傳至 `onError`。
   */
  ready: Promise<boolean>;
}

/** 唯一參照原始 API 的地方 — 規格變更只需修改此單一檔案。 */
export function getModelContext(): ModelContext | undefined {
  if (typeof document !== 'undefined' && document.modelContext) return document.modelContext;
  // Chrome 149 來源試用使用的已棄用介面；過時後移除。
  if (typeof navigator !== 'undefined' && navigator.modelContext) return navigator.modelContext;
  return undefined;
}

export function isWebMCPAvailable(): boolean {
  return getModelContext() !== undefined;
}

const scopes = new Map<string, AbortController>();
let warnedMissingModelContext = false;

function makeHandle(dispose: () => void, ready: Promise<boolean>): ToolScopeHandle {
  const handle = dispose as ToolScopeHandle;
  handle.ready = ready;
  return handle;
}

/**
 * 在一個範圍索引鍵下註冊一組工具。傳回可呼叫的處置控制代碼，
 * 帶有 `ready: Promise<boolean>`（請參閱 ToolScopeHandle）。
 *
 * - AbortSignal 是規格中唯一的取消註冊機制 — 處置即中止它。
 * - 驗證在任何註冊之前執行，因此不良契約絕不會留下半註冊的範圍。
 * - 註冊失敗 — 拒絕以及同步擲出例外的 registerTool 實作（2026-07 之前的 Chromium）
 *   — 會回復整個範圍，將 `ready` 解析為 false，並透過 `onError` 回報（預設：console.error）；
 *   索引鍵絕不會滯留。
 * - 在註冊確立前進行處置（例如 React StrictMode 卸載）會以無訊息方式回復：
 *   `ready` 解析為 false 且不會呼叫 `onError`。
 * - 使用已作用中的索引鍵呼叫會傳回無操作的控制代碼（`ready` → false）並保留現有範圍不受影響。
 */
 * - Calling with a key that is already active returns a no-op handle
 *   (`ready` → false) and leaves the existing scope untouched.
 */
export function createToolScope(
  key: string,
  tools: ModelContextTool[],
  options?: ToolScopeOptions,
): ToolScopeHandle {
  const mc = getModelContext();
  const validate = shouldValidate(options);
  if (!mc) {
    if (validate && !warnedMissingModelContext) {
      warnedMissingModelContext = true;
      console.warn(
        `webmcpify: WebMCP is unavailable for scope "${key}". Check window.isSecureContext, the verification origin, current Chrome, and the WebMCP feature flag. Registration remains a safe no-op.`,
      );
    }
    return makeHandle(() => {}, Promise.resolve(false));
  }
  if (scopes.has(key)) return makeHandle(() => {}, Promise.resolve(false));

  if (validate) for (const tool of tools) validateTool(tool);
  const guardedTools = tools.map((tool) => guardToolResult(tool, validate));

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
    // 舊版 registerTool 實作會同步擲出例外而非拒絕 — 進行標準化以使下方的回復路徑涵蓋兩者。
    const registered: Promise<void>[] = [];
    registrations = Promise.all(
      guardedTools.map((tool) => mc.registerTool(tool, registerOptions)),
    );
  } catch (error) {
    registrations = Promise.reject(error);
  }

  const ready = registrations.then(
    () => scopes.get(key) === controller, // 若在確立前處置則為 false
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

/** 命令式工具絕不能向 Chrome 傳回不明確的缺席結果。 */
function guardToolResult(tool: ModelContextTool, reportInDevelopment: boolean): ModelContextTool {
  return {
    ...tool,
    async execute(input: Record<string, unknown>, options?: ToolExecuteCallbackOptions): Promise<ModelContextToolResult> {
      const result = await tool.execute(input, options);
      if (result !== null && result !== undefined) return result;
      const error =
        `Tool "${tool.name}" returned ${result === null ? 'null' : 'undefined'}. ` +
        'Return a JSON-safe structured result before any route-changing UI action.';
      if (reportInDevelopment) console.error(`webmcpify: ${error}`);
      return { ok: false, error };
    },
  };
}

/**
 * 將 execute() 橋接至應用程式本身的事件/狀態流程。派送的 detail
 * 攜帶 `{ ...detail, requestId, signal }` — `signal` 是一個在逾時或呼叫端取消時中止的 AbortSignal；
 * 處理常式應將其傳遞給 fetch()，並在中止後跳過狀態提交與完成派送。僅在元件藉由派送
 * 帶有 `detail: { ok: boolean, message?: string, error?: string }` 的 `tool-completion-<requestId>`
 * 確認結果後解析 — 且它必須在非同步工作真正完成後（await fetch/狀態提交/轉譯）才執行，
 * 因為代理人是根據畫面上的內容進行規劃。
 *
 * 完成契約採失敗關閉設計：`ok === true` 解析訊息，
 * `ok === false` 解析為 `"ERROR: <error>"`，而任何其他情況（缺少或非布林值的 `ok`、無 detail）
 * 則解析為回報未知結果的 ERROR 字串。逾時亦解析為 ERROR 字串。絕不拒絕 — 模型可在
 * execute() 內部無未處理拒絕的情況下進行自我更正。
 */
 * outcome. Timeouts resolve an ERROR string too. Never rejects — the model can
 * self-correct without unhandled rejections inside execute().
 */
export function dispatchAndWait(
  eventName: string,
  detail: Record<string, unknown> = {},
  timeoutMs = 10000,
  callerSignal?: AbortSignal,
): Promise<string> {
  return new Promise((resolve) => {
    const requestId = Math.random().toString(36).slice(2, 12);
    const completionEvent = `tool-completion-${requestId}`;
    const abort = new AbortController();
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener(completionEvent, onDone as EventListener);
      callerSignal?.removeEventListener('abort', onCancel);
    };
    const cancel = (message: string, reason?: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      // 在中止之前移除完成接聽程式：處理常式可能會同步回應。
      abort.abort(reason);
      resolve(message);
    };
    const onCancel = () => cancel(
      'ERROR: This action was cancelled. The outcome is unknown and may still be processing — check the current page state before retrying.',
      callerSignal?.reason,
    );
    const timer = setTimeout(() => cancel(
      'ERROR: The interface did not confirm this action in time. The request was signalled to cancel but may still be processing — check the current page state before retrying.',
    ), timeoutMs);
    const onDone = (event: Event) => {
      if (settled) return;
      settled = true;
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
    if (callerSignal?.aborted) {
      onCancel();
      return;
    }
    callerSignal?.addEventListener('abort', onCancel, { once: true });
    window.addEventListener(completionEvent, onDone as EventListener);
    try {
      window.dispatchEvent(
        new CustomEvent(eventName, { detail: { ...detail, requestId, signal: abort.signal } }),
      );
    } catch {
      cancel('ERROR: The interface could not dispatch this action. The outcome is unknown — check the current page state before retrying.');
    }
  });
}

/**
 * 序列化工具的 execute()：當一個呼叫正在進行時，後續呼叫
 * 會立即解析為忙碌 ERROR 字串，而非與共享的 UI 狀態競爭。
 *
 * ```ts
 * execute: singleFlight(async (input, options) =>
 *   dispatchAndWait('webmcp:save', input, 10000, options?.signal)),
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
  // 打包工具會替換常值；未打包時，單純參照會擲出例外 → false。
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

/** 契約品質檢查（Google 建議的長度預算）。 */
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
