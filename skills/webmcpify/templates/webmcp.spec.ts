/**
 * webmcpify 驗證範本 — 供應商化自 https://github.com/TueJon/webmcpify
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
 * 完整文字：https://github.com/TueJon/webmcpify/blob/main/LICENSE
 *
 * The webmcpify skill instantiates one describe-block per manifest tool, filling
 * route/auth/examples/expect from .webmcpify/manifest.json. The example blocks
 * below show the complete patterns with REAL assertions — generated blocks must
 * assert, never comment out.
 *
 * Requirements: real current Chrome, HEADED (headless exposes no modelContext in
 * the supported verification path), a virtual display when needed, and a dedicated
 * user-data directory. Enumeration/execution uses the production
 * document.modelContext.getTools()/executeTool() surface (Chrome 2026-07+).
 * Alternative harness: Puppeteer's first-class WebMCP API (pptr.dev/guides/webmcp).
 */
import { chromium, expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
// @ts-expect-error — 共享 JS 輔助程式；行內複本存在於 page.evaluate 內部（瀏覽器界限）
import { parseInputSchema } from './webmcp-compat.js';
import { openMutationJournal, type MutationJournal } from './mutation-journal.js';

test.describe.configure({ mode: 'serial', retries: 0 });

function requiredEnv(name: 'WEBMCP_BASE_URL' | 'WEBMCP_PROFILE_DIR'): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required; do not pin a host port or profile path in the spec`);
  return value;
}

const BASE_URL = requiredEnv('WEBMCP_BASE_URL');
const PROFILE_DIR = requiredEnv('WEBMCP_PROFILE_DIR');
const MANIFEST_PATH = fileURLToPath(new URL('./manifest.json', import.meta.url));

let context: BrowserContext | undefined;
let page: Page;
let mutationJournal: MutationJournal | undefined;
type ExecuteInputMode = 'object' | 'json-string';
let executeInputMode: ExecuteInputMode | undefined;

test.beforeAll(async () => {
  // 輔助程式在首次讀取資訊清單前取得永久的 manifest.lock sidecar，
  // 並在每次派送、清理與確認過程中持續持有它。
  mutationJournal = await openMutationJournal({ manifestPath: MANIFEST_PATH });
  if (mutationJournal.unresolved.length > 0) {
    const ids = mutationJournal.unresolved.map(({ executionId }) => executionId).join(', ');
    await mutationJournal.close();
    mutationJournal = undefined;
    throw new Error(`reconcile unresolved mutation executions before running the harness: ${ids}`);
  }
  try {
    context = await chromium.launchPersistentContext(PROFILE_DIR, {
      channel: 'chrome',
      headless: false,
      args: ['--enable-features=WebMCP,WebMCPTesting'],
    });
    page = await context.newPage();
  } catch (error) {
    await mutationJournal.close();
    mutationJournal = undefined;
    throw error;
  }
});

test.afterAll(async () => {
  try {
    await context?.close();
  } finally {
    await mutationJournal?.close();
  }
});

/** 列舉已註冊工具；較舊的原生組建可能會將 JSON Schema 字串化，而目前的組建則傳回物件 — 處理這兩種情況。 */
async function listTools(p: Page): Promise<
  Array<{
    name: string;
    inputSchema?: string | object;
    annotations?: {
      readOnlyHint?: boolean;
      untrustedContentHint?: boolean;
      consequentialHint?: boolean;
    };
  }>
> {
  return p.evaluate(async () => {
    const mc = (document as any).modelContext;
    if (mc?.getTools) return mc.getTools();
    throw new Error('No document.modelContext enumeration surface — insecure origin, headless/wrong Chrome, reused profile, or missing flag');
  });
}

/**
 * 輪詢直到工具出現在 document.modelContext.getTools() 中。
 * 註冊是非同步的（React 效果、延遲區塊、網狀連線），因此在斷言工具缺失之前必須進行輪詢。
 */
 */
async function detectExecuteInputMode(p: Page): Promise<ExecuteInputMode> {
  return p.evaluate(async () => {
    const mc = (document as any).modelContext;
    if ((mc as any)?.__webmcpStubObjectMode) return 'object';
    if (!mc?.registerTool || !mc?.getTools || !mc?.executeTool) {
      throw new Error('No complete document.modelContext execution surface for capability probe');
    }
    const controller = new AbortController();
    const name = `webmcpify_input_probe_${crypto.randomUUID().replaceAll('-', '')}`;
    const probeState = { calls: 0 };
    await mc.registerTool({
      name,
      description: 'Side-effect-free verification of the browser executeTool input contract.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      async execute() { probeState.calls += 1; return 'webmcpify-input-probe'; },
    }, { signal: controller.signal });
    try {
      const tool = (await mc.getTools()).find((candidate: { name: string }) => candidate.name === name);
      if (!tool) throw new Error('WebMCP input-contract probe did not register');
      try {
        await mc.executeTool(tool, {});
        if (Number(probeState.calls) !== 1) throw new Error('Object-input probe did not execute exactly once');
        return 'object';
      } catch (error) {
        if (Number(probeState.calls) !== 0) throw error;
        await mc.executeTool(tool, '{}');
        if (Number(probeState.calls) !== 1) throw new Error('JSON-string input probe did not execute exactly once');
        return 'json-string';
      }
    } finally {
      controller.abort();
    }
  });
}

/**
 * 透過 document.modelContext.executeTool 執行工具。
 * 針對舊版/目前 Chrome 原生形狀與虛設常式外觀使用共享的相容性配接器邏輯。
 */
 */
async function executeTool(p: Page, name: string, args: object): Promise<string | null> {
  executeInputMode ??= await detectExecuteInputMode(p);
  return p.evaluate(
    async ({ name, args, inputMode }) => {
      // 行內輔助程式：page.evaluate 無法封閉外部 import — 與 webmcp-compat.js 保持同步
      const normalizeResult = (r: unknown) => (r == null ? null : typeof r === 'string' ? (r as string) : JSON.stringify(r));
      const mc = (document as any).modelContext;
      if (mc?.getTools) {
        const tools = await mc.getTools();
        const tool = tools.find((t: { name: string }) => t.name === name);
        if (!tool) throw new Error(`tool ${name} is not registered`);
        // 明確配接器模式 — 無害探針選擇了原生外觀。
        // - tool.execute(object): 無周邊時代的虛設常式
        // - mc.__webmcpStubObjectMode + mc.executeTool(tool, object): 規格外觀虛設常式（列舉工具無 .execute）
        // - 目前原生/規格 mc.executeTool(tool, object)
        // - 舊版 Chrome mc.executeTool(tool, JSON string)
        // 真實工具絕不重試：處理常式失敗可能接續在異動之後。
        if (typeof tool?.execute === 'function') return normalizeResult(await tool.execute(args));
        if (mc.executeTool) {
          const input = inputMode === 'object' ? args : JSON.stringify(args);
          return normalizeResult(await mc.executeTool(tool, input));
        }
      }
      throw new Error('No document.modelContext execution surface — insecure origin, headless/wrong Chrome, reused profile, or missing flag');
    },
    { name, args, inputMode: executeInputMode },
  );
}

/**
 * 標準化由 getTools() 傳回的 inputSchema — 較舊的原生組建會將其字串化；目前的組建回傳物件。
 */
 */
async function waitForTool(p: Page, name: string, timeoutMs = 5000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const tools = await listTools(p);
    if (tools.some((t) => t.name === name)) return true;
    if (Date.now() >= deadline) return false;
    await p.waitForTimeout(100);
  }
}

test('驗證來源安全且 WebMCP 可用', async () => {
  await page.goto(BASE_URL);
  const probe = await page.evaluate(() => ({
    secureContext: window.isSecureContext,
    hasDocumentModelContext: !!(document as any).modelContext,
  }));
  expect(probe.secureContext, `Verification origin must be secure: ${BASE_URL}`).toBe(true);
  expect(
    probe.hasDocumentModelContext,
    '請使用目前具外觀的 Chrome、專用設定檔，並啟用 chrome://flags/#enable-webmcp-testing',
  ).toBe(true);
  executeInputMode = await detectExecuteInputMode(page);
  test.info().annotations.push({
    type: 'webmcp-compatibility',
    description: `executeTool input mode: ${executeInputMode}`,
  });
});

// ── 依資訊清單工具產生 ──────────────────────────────────────────────
// 唯讀命令式工具的完整範例。從資訊清單項目填入 route/examples/expect；
// 對於 `auth != none`，在工具測試前使用記錄的 app.authFixtures 燈具進行登入
// — 針對 `auth` 中列出的每個角色執行一次。

test.describe('search_tickets', () => {
  test.beforeEach(async () => {
    // 依據「每個測試」而非每個 describe 進行導覽 — 較早的測試可能已導覽
    // 離開（executeTool 傳回 null 即代表此情況）。
    await page.goto(`${BASE_URL}/projects/demo/tickets`); // 資訊清單: route
  });

  test('已註冊且具備預期的結構描述與註解', async () => {
    expect(await waitForTool(page, 'search_tickets')).toBe(true); // 非同步註冊 — 輪詢
    const tools = await listTools(page);
    const tool = tools.find((t) => t.name === 'search_tickets')!;
    const schema = parseInputSchema(tool.inputSchema); // 處理字串、物件或 undefined
    expect(schema.required).toContain('query'); // 資訊清單: inputSchema
    // 資訊清單: annotations — 精確斷言資訊清單所記錄的內容
    expect(tool.annotations?.readOnlyHint).toBe(true);
    expect(tool.annotations?.untrustedContentHint).toBe(true);
    // CG 草案 + 目前 Chrome 文件定義了 consequentialHint，但 Chrome 150
    // 在註冊時接受它而未從 getTools() 傳回。若存在則斷言原生傳播；
    // 透過應用程式/單元測試涵蓋註冊物件，並將省略的欄位回報為瀏覽器相容性實證。
    // app/unit tests and report an omitted field as browser compatibility evidence.
    if (tool.annotations?.consequentialHint !== undefined) {
      expect(tool.annotations.consequentialHint).toBe(false);
    } else {
      test.info().annotations.push({
        type: 'webmcp-compatibility',
        description: 'Browser omitted consequentialHint from getTools(); last reproduced in Chrome 150',
      });
    }
  });

  test('執行有效範例並變更 UI', async () => {
    expect(await waitForTool(page, 'search_tickets')).toBe(true);
    // 在執行前擷取相關的 UI 狀態 — 成功必須是差異 (DELTA)，
    // 而非僅僅是畫面原本已存在的內容的可見性。
    const before = await page.getByRole('list', { name: 'Tickets' }).innerText();
    const out = await executeTool(page, 'search_tickets', { query: 'test' }); // 資訊清單: examples.valid
    expect(out).not.toBeNull(); // null 代表「已導覽離開」— 此工具不預期此情況
    expect(out).not.toMatch(/^ERROR:/);
    await expect(page.getByRole('list', { name: 'Tickets' })).toBeVisible(); // 資訊清單: expect.ui
    const after = await page.getByRole('list', { name: 'Tickets' }).innerText();
    expect(after).not.toBe(before); // UI 確實產生變更
  });

  test('以自我修正訊息拒絕無效範例', async () => {
    // 先證明工具「存在」— 否則此測試可能會因為
    // 工具從未註冊所引發的拒絕而「通過」。
    expect(await waitForTool(page, 'search_tickets')).toBe(true);
    const out = await executeTool(page, 'search_tickets', {}); // 資訊清單: examples.invalid
    expect(out).toMatch(/^ERROR:/); // 命令式慣例：解析為 "ERROR: ..."
    // 宣告式工具則在結構描述/驗證失敗時拒絕 (REJECT) — 針對該類工具，
    // 請產生: await expect(executeTool(page, '<tool>', {})).rejects.toThrow();
  });
});

// 異動型宣告式表單工具的完整範例。Chrome 填寫表單，
// 接著暫停 (PAUSES) 執行直到真實的提交互動發生 — 單獨等待
// executeTool 會發生死結。以非等待方式啟動，等待代理人填寫的
// 值，點擊提交，然後等待結果。

test.describe('send_contact_message', () => {
  test.beforeEach(async () => {
    // 依據每個測試進行導覽 — 提交導覽的執行會離開路由。
    await page.goto(`${BASE_URL}/contact`); // 資訊清單: route
  });

  test('透過並行提交點擊模式執行', async () => {
    expect(await waitForTool(page, 'send_contact_message')).toBe(true);
    const args = {
      email: 'qa@example.test', // 資訊清單: examples.valid
      message: '[webmcpify verification] harness test message',
    };
    // 在派送前持久化記錄 `started`。此行之後的任何例外都會將其保留為
    // 未確認狀態，以便在下一次執行時進行權威性讀取路徑對賬。
    const execution = await mutationJournal!.beforeDispatch({
      tool: 'send_contact_message',
      contractRevision: 1, // 資訊清單: contractRevision
      origin: BASE_URL, // 資訊清單: app.verificationOrigin
      role: 'none', // 資訊清單: auth fixture role
      fixtureRevision: 'contact-seed-v1', // 資訊清單: app.authFixtures fixture revision
      arguments: args,
      evidence: '.webmcpify/evidence/send-contact-message.json',
    });
    // 1. 在不等待的情況下啟動執行（Chrome 會在表單處暫停它）。
    const pending = executeTool(page, 'send_contact_message', args);
    // 2. 等待直到代理人填寫的值在表單中可見。
    await expect(page.getByLabel('Email')).toHaveValue('qa@example.test');
    // 3. 執行真實的提交互動以繼續已暫停的執行。
    await page.getByRole('button', { name: 'Send' }).click();
    // 4. 此時 Promise 完成解析。
    const out = await pending;
    if (out === null) {
      // null = 執行已導覽（提交導覽表單）— 斷言目的路徑而非傳回值。
      // beforeEach 會還原路由。
      await expect(page).toHaveURL(/thank-you/); // 資訊清單: expect.navigation
    } else {
      expect(out).not.toMatch(/^ERROR:/);
      expect(out).toContain('received'); // 資訊清單: expect.result
    }
    // 資訊清單: cleanup — 此 UI 動作也會產生異動，因此它有自己的耐久
    // 項目連結至仍處於 started 狀態的父項。具現化範本時，
    // 請將選取器替換為資訊清單具體的清理/讀取路徑。
    const cleanup = await mutationJournal!.beforeDispatch({
      tool: 'cleanup:send_contact_message',
      manifestTool: 'send_contact_message',
      contractRevision: 1,
      origin: BASE_URL,
      role: 'none',
      fixtureRevision: 'contact-seed-v1',
      arguments: { email: 'qa@example.test' },
      evidence: '.webmcpify/evidence/send-contact-message-cleanup.json',
      parentExecutionId: execution.executionId,
    });
    await page.goto(`${BASE_URL}/admin/messages`); // 資訊清單: cleanup 讀取路徑
    const fixtureRow = page.getByRole('row', { name: /qa@example\.test/ });
    await expect(fixtureRow).toHaveCount(1); // 獨立讀取路徑在清理前證明異動已發生
    await fixtureRow.getByRole('button', { name: 'Delete' }).click();
    await expect(fixtureRow).toHaveCount(0); // 獨立證明清理已完成
    await mutationJournal!.settle(cleanup.executionId, {
      outcome: 'fixture removed',
      evidence: '.webmcpify/evidence/send-contact-message-cleanup-settled.json',
    });
    await mutationJournal!.settle(execution.executionId, {
      outcome: 'effect verified and cleanup reconciled',
      evidence: '.webmcpify/evidence/send-contact-message-settled.json',
    });
  });

  test('拒絕無效範例而不變更伺服器狀態', async () => {
    expect(await waitForTool(page, 'send_contact_message')).toBe(true);
    const before = await page.getByRole('status', { name: 'Sent message count' }).innerText();
    const execution = await mutationJournal!.beforeDispatch({
      tool: 'send_contact_message',
      contractRevision: 1,
      origin: BASE_URL,
      role: 'none',
      fixtureRevision: 'contact-seed-v1',
      arguments: {}, // 資訊清單: examples.invalid
      evidence: '.webmcpify/evidence/send-contact-message-invalid.json',
    });
    await expect(executeTool(page, 'send_contact_message', {})).rejects.toThrow();
    const after = await page.getByRole('status', { name: 'Sent message count' }).innerText();
    expect(after).toBe(before); // 獨立讀取路徑證明無任何效果產生
    await mutationJournal!.settle(execution.executionId, {
      outcome: 'validation rejected; no effect observed',
      evidence: '.webmcpify/evidence/send-contact-message-invalid-settled.json',
    });
  });
});

// 遵循零參數慣例 ({"unexpected": true}) 帶有 `examples.invalid` 的
// 零參數讀取工具完整範例。雙重結果：拒絕非預期索引鍵或良性解析
// （接受並忽略）兩者皆算通過 — 絕不能通過的情況是缺少工具或缺少 WebMCP 介面。
// what must never pass is a missing tool or a missing WebMCP surface.

test.describe('get_page_summary', () => {
  test.beforeEach(async () => {
    await page.goto(BASE_URL); // 資訊清單: route
  });

  test('在無副作用的情況下處理非預期輸入（雙重結果）', async () => {
    expect(await waitForTool(page, 'get_page_summary')).toBe(true); // 首先確認存在
    try {
      const out = await executeTool(page, 'get_page_summary', { unexpected: true }); // 資訊清單: examples.invalid
      // 已解析：必須為良性 — 正常結果（readOnlyHint 工具：不可能有副作用）
      // 或自我修正的 "ERROR: ..." 字串。
      expect(out).not.toBeNull();
    } catch (err) {
      // 已拒絕：僅可作為驗證拒絕接受 — 缺少介面
      // 或未註冊工具是真實的失敗，而非通過。
      expect(String(err)).not.toMatch(/No document\.modelContext|is not registered/);
    }
  });
});
