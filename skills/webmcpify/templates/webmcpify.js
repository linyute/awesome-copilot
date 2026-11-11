/**
 * webmcpify runtime (JavaScript variant) — vendored from https://github.com/TueJon/webmcpify
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
 * 遵循規格定義的 WebMCP API (document.modelContext) 包裝協助程式。請以 vendored 方式引入
 * 此檔案；切勿將其作為相依套件新增。所有功能皆採特性偵測：在沒有
 * WebMCP 的瀏覽器中，每個函式都是安全的無操作 (no-op)。此檔案為 ES 模組
 * (`export`) — 請透過打包工具或 `<script type="module">` 載入；針對
 * CommonJS/傳統指令碼專案，請改為轉譯或 vendor 其 TS 版本。
 */

/**
 * @typedef {(() => void) & { ready: Promise<boolean> }} ToolScopeHandle
 * 可呼叫的釋放控制代碼: 呼叫它即可釋放 (中止註冊信號，
 * 釋放鍵)。當所有註冊完成且範圍仍處於使用中狀態時，`ready` 會解析為 true；
 * 若無 WebMCP / 鍵已處於使用中 / 註冊失敗 (已復原) /
 * 優先被釋放，則解析為 false。絕不拒絕 (reject) — 失敗會傳至 onError。
 */

/** 唯一參照原始 API 的地方 — 規格變更只需修改此單一檔案。 */
export function getModelContext() {
  if (typeof document !== 'undefined' && document.modelContext) return document.modelContext;
  // Chrome 149 origin trial 使用的已淘汰介面；廢棄後即可移除。
  if (typeof navigator !== 'undefined' && navigator.modelContext) return navigator.modelContext;
  return undefined;
}

export function isWebMCPAvailable() {
  return getModelContext() !== undefined;
}

const scopes = new Map();
let warnedMissingModelContext = false;

/**
 * @param {() => void} dispose
 * @param {Promise<boolean>} ready
 * @returns {ToolScopeHandle}
 */
function makeHandle(dispose, ready) {
  return Object.assign(dispose, { ready });
}

/**
 * 在一個範圍鍵下註冊一組工具。傳回帶有 `ready: Promise<boolean>` 的可呼叫釋放控制代碼
 * (參見 ToolScopeHandle)。
 *
 * - AbortSignal 是規格中唯一的取消註冊機制 — dispose 會將其中止。
 * - 驗證在任何註冊之前執行，因此不良合約絕不會留下
 *   半註冊的範圍。
 * - 註冊失敗 — 包括 rejection 以及同步拋出例外的 registerTool
 *   實作 (2026-07 之前的 Chromium) — 會復原整個範圍，將
 *   `ready` 解析為 false，並透過 `onError` 回報 (預設: console.error)；
 *   鍵絕不會被遺棄。當範圍在註冊完成前被釋放時，
 *   不會呼叫 `onError`。
 * - 在註冊完成前釋放 (例如 React StrictMode 取消掛載) 會以無訊息方式
 *   復原：`ready` 解析為 false 且不會呼叫 `onError`。
 * - 使用已處於使用中狀態的鍵進行呼叫會傳回無操作控制代碼
 *   (`ready` → false) 且現有的範圍維持不變。
 *
 * @param {string} key
 * @param {Array<object>} tools
 * @param {{ exposedTo?: string[], validate?: boolean, onError?: (e: unknown) => void }} [options]
 * @returns {ToolScopeHandle}
 */
export function createToolScope(key, tools, options) {
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

  const registerOptions = { signal: controller.signal };
  if (options?.exposedTo) registerOptions.exposedTo = options.exposedTo;

  let registrations;
  try {
    // 舊版 registerTool 實作會同步拋出例外而非
    // reject — 在此進行標準化以便下方的復原路徑可同時涵蓋兩者。
    registrations = Promise.all(
      guardedTools.map((tool) => mc.registerTool(tool, registerOptions)),
    );
  } catch (error) {
    registrations = Promise.reject(error);
  }

  const ready = registrations.then(
    () => scopes.get(key) === controller, // 在完成前釋放時為 false
    (error) => {
      rollback();
      if (!disposed) {
        const report =
          options?.onError ??
          ((e) => console.error(`webmcpify: registration failed for scope "${key}"`, e));
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
 * 命令式工具絕不能向 Chrome 傳回模糊的缺失結果。
 * @param {object & { name: string, execute: (input: Record<string, unknown>, options?: { signal: AbortSignal }) => unknown }} tool
 * @param {boolean} reportInDevelopment
 * @returns {object}
 */
function guardToolResult(tool, reportInDevelopment) {
  return {
    ...tool,
    async execute(input, options) {
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
 * 將 execute() 銜接至應用程式本身的事件/狀態流程。派送的 detail
 * 帶有 `{ ...detail, requestId, signal }` — `signal` 是一個在逾時或呼叫端取消時會中止的 AbortSignal；
 * 處理常式應將其傳遞給 fetch() 並在中止後略過狀態認可及完成派送。
 * 只有在元件透過派送帶有
 * `detail: { ok: boolean, message?: string, error?: string }` 的 `tool-completion-<requestId>`
 * 確認結果後才會解析 — 且必須在非同步工作真正完成後
 * (已 await fetch/狀態認可/轉譯)，
 * 因為代理人是依據螢幕上的內容進行規劃。
 *
 * 完成合約採預設失敗原則: `ok === true` 會解析為訊息，
 * `ok === false` 會解析為 `"ERROR: <error>"`，其他任何狀況 (缺少或
 * 非布林值的 `ok`、沒有 detail) 都會解析為回報未知結果的 ERROR
 * 字串。逾時也會解析為 ERROR 字串。絕不 reject — 模型可在
 * execute() 內部自我修正而不會產生未處理的 rejection。
 *
 * @param {string} eventName
 * @param {Record<string, unknown>} [detail]
 * @param {number} [timeoutMs]
 * @param {AbortSignal} [callerSignal]
 * @returns {Promise<string>}
 */
export function dispatchAndWait(eventName, detail = {}, timeoutMs = 10000, callerSignal) {
  return new Promise((resolve) => {
    const requestId = Math.random().toString(36).slice(2, 12);
    const completionEvent = `tool-completion-${requestId}`;
    const abort = new AbortController();
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener(completionEvent, onDone);
      callerSignal?.removeEventListener('abort', onCancel);
    };
    const cancel = (message, reason) => {
      if (settled) return;
      settled = true;
      cleanup();
      // 在中止前先移除完成接聽程式：處理常式可能會同步回應。
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
    const onDone = (event) => {
      if (settled) return;
      settled = true;
      cleanup();
      const result = event.detail ?? {};
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
    window.addEventListener(completionEvent, onDone);
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
 * 序列化工具的 execute()：當一次呼叫正在執行時，後續的呼叫
 * 會立即解析為忙碌的 ERROR 字串，而不是與共享的 UI 狀態競爭。
 *
 * ```js
 * execute: singleFlight(async (input, options) =>
 *   dispatchAndWait('webmcp:save', input, 10000, options?.signal)),
 * ```
 *
 * @template {unknown[]} A
 * @param {(...args: A) => string | Promise<string>} fn
 * @param {string} [busyMessage]
 * @returns {(...args: A) => Promise<string>}
 */
export function singleFlight(
  fn,
  busyMessage = 'ERROR: A previous invocation of this tool is still in progress. Wait for it to finish, then check the current page state before retrying.',
) {
  let inFlight = false;
  return async (...args) => {
    if (inFlight) return busyMessage;
    inFlight = true;
    try {
      return await fn(...args);
    } finally {
      inFlight = false;
    }
  };
}

/**
 * @param {{ validate?: boolean }} [options]
 * 預設值: 當打包工具替換 `process.env.NODE_ENV`
 * (Vite/webpack 自動；esbuild 透過 `--define`) 且不為 `'production'` 時啟用；
 * 未打包專案預設為 false — 在開發期間請傳遞 `validate: true`。
 */
function shouldValidate(options) {
  if (options?.validate !== undefined) return options.validate;
  // 打包工具會替換字面常數；未打包時，直接參照會拋出例外 → false。
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

/** 合約品質檢查 (Google 建議的預算限制)。 */
function validateTool(tool) {
  const problems = [];
  if (!/^[a-zA-Z0-9_.-]{1,30}$/.test(tool.name)) {
    problems.push(`name "${tool.name}" should be 1-30 chars of [a-zA-Z0-9_.-]`);
  }
  if (!tool.description) problems.push(`tool "${tool.name}" is missing a description`);
  else if (tool.description.length > 500) {
    problems.push(`tool "${tool.name}" description exceeds 500 chars`);
  }
  if (problems.length) throw new Error(`webmcpify: ${problems.join('; ')}`);
}
