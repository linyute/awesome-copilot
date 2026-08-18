/**
 * webmcpify 驗證範本 — 擷取自 https://github.com/TueJon/webmcpify
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
 * webmcpify skill 為每個資訊清單工具實例化一個 describe 區塊，從
 * .webmcpify/manifest.json 填入 route/auth/examples/expect。下方的範例區塊
 * 展示了包含真實斷言的完整模式 — 產生的區塊必須進行斷言，切勿將其註解掉。
 *
 * 需求：真實 Chrome，有介面模式 (HEADED)（WebMCP 需要可見的分頁 — 無介面模式 (headless)
 * 永遠無法運作；在 CI 中請使用 xvfb-run）。列舉/執行使用正式環境的
 * document.modelContext.getTools()/executeTool() 層面 (Chrome 2026-07+)，並針對較舊版本
 * 具備探測回退至已移除的 navigator.modelContextTesting 之機制。
 * 替代測試架構：Puppeteer 的第一方 WebMCP API (pptr.dev/guides/webmcp)。
 */
import { chromium, expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

const BASE_URL = process.env.WEBMCP_BASE_URL ?? 'http://localhost:5173';

let context: BrowserContext;
let page: Page;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    channel: 'chrome',
    headless: false,
    args: ['--enable-features=WebMCP,WebMCPTesting'],
  });
  page = await context.newPage();
});

test.afterAll(async () => {
  await context.close();
});

/** 列舉已註冊的工具；inputSchema 以字串形式傳回 (JSON Schema)。 */
async function listTools(p: Page): Promise<
  Array<{
    name: string;
    inputSchema?: string;
    annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  }>
> {
  return p.evaluate(async () => {
    const mc = (document as any).modelContext ?? (navigator as any).modelContext;
    if (mc?.getTools) return mc.getTools();
    const legacy = (navigator as any).modelContextTesting; // 於 2026-07 移除；僅適用於較舊版本
    if (legacy?.listTools) return legacy.listTools();
    throw new Error('找不到 WebMCP 列舉層面 — Chrome 版本或旗標不正確');
  });
}

/**
 * 執行工具。約定 (Chrome)：解析為字串結果，或者在執行引發導覽時為 null；
 * 執行/驗證失敗會拒絕 (REJECT) — 在預期失敗的情況下使用 expect(...).rejects 進行斷言。
 */
async function executeTool(p: Page, name: string, args: object): Promise<string | null> {
  return p.evaluate(
    async ({ name, args }) => {
      const mc = (document as any).modelContext ?? (navigator as any).modelContext;
      if (mc?.getTools && mc?.executeTool) {
        const tools = await mc.getTools();
        const tool = tools.find((t: { name: string }) => t.name === name);
        if (!tool) throw new Error(`工具 ${name} 尚未註冊`);
        return mc.executeTool(tool, JSON.stringify(args));
      }
      const legacy = (navigator as any).modelContextTesting;
      if (legacy?.executeTool) return legacy.executeTool(name, JSON.stringify(args));
      throw new Error('找不到 WebMCP 執行層面 — Chrome 版本或旗標不正確');
    },
    { name, args },
  );
}

/**
 * registerTool 是非同步 (ASYNC) — 頁面載入瞬間工具無法立即被列舉。
 * 請輪詢（或等待 `toolchange` 事件），而非立即斷言。
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

/** 現代層面會公開註解 (annotations)；舊版回退則不會。 */
async function hasModernSurface(p: Page): Promise<boolean> {
  return p.evaluate(() => {
    const mc = (document as any).modelContext ?? (navigator as any).modelContext;
    return !!mc?.getTools;
  });
}

test('WebMCP 在測試環境中可用', async () => {
  await page.goto(BASE_URL);
  const available = await page.evaluate(
    () => !!(document as any).modelContext || !!(navigator as any).modelContext,
  );
  expect(available, '請啟用 chrome://flags/#enable-webmcp-testing 並使用最新 Chrome').toBe(
    true,
  );
});

// ── 依資訊清單工具產生 ──────────────────────────────────────────────
// 唯讀命令式工具的完整範例。從資訊清單項目填入 route/examples/expect；
// 針對 `auth != none`，在工具測試前使用記錄的 app.authFixtures fixture 登入 —
// 針對 `auth` 中列出的每個角色各執行一次。

test.describe('search_tickets', () => {
  test.beforeEach(async () => {
    // 依據各個測試 (TEST) 進行導覽，而非依據 describe — 稍早的測試可能已經導覽離開
    // （executeTool 回傳 null 即代表此情況）。
    await page.goto(`${BASE_URL}/projects/demo/tickets`); // 資訊清單: route
  });

  test('已使用預期的結構描述 (schema) 和註解 (annotations) 進行註冊', async () => {
    expect(await waitForTool(page, 'search_tickets')).toBe(true); // 非同步註冊 — 進行輪詢
    const tools = await listTools(page);
    const tool = tools.find((t) => t.name === 'search_tickets')!;
    const schema = JSON.parse(tool.inputSchema ?? '{}'); // 字串化 → 先進行解析
    expect(schema.required).toContain('query'); // 資訊清單: inputSchema
    if (await hasModernSurface(page)) {
      // 資訊清單: annotations — 精確斷言資訊清單所記錄的內容
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.untrustedContentHint).toBe(true);
    } else {
      // 舊版 modelContextTesting 回退無法列舉註解 —
      // 跳過斷言並在報告中記錄落差。
      test.info().annotations.push({
        type: 'webmcpify',
        description: '此 Chrome 版本無法列舉註解 — 已跳過斷言',
      });
    }
  });

  test('執行有效範例並變更使用者介面', async () => {
    expect(await waitForTool(page, 'search_tickets')).toBe(true);
    // 在執行前擷取相關的使用者介面狀態 — 成功必須是一項變化量 (DELTA)，
    // 而不僅僅是原本就存在於畫面上的內容可見。
    const before = await page.getByRole('list', { name: 'Tickets' }).innerText();
    const out = await executeTool(page, 'search_tickets', { query: 'test' }); // 資訊清單: examples.valid
    expect(out).not.toBeNull(); // null 代表「已導覽」— 對於此工具並非預期情況
    expect(out).not.toMatch(/^ERROR:/);
    await expect(page.getByRole('list', { name: 'Tickets' })).toBeVisible(); // 資訊清單: expect.ui
    const after = await page.getByRole('list', { name: 'Tickets' }).innerText();
    expect(after).not.toBe(before); // 使用者介面確實發生了變更
  });

  test('以自我修正訊息拒絕無效範例', async () => {
    // 首先證明工具存在 — 否則此測試可能因為工具根本未註冊導致拒絕而「通過」。
    expect(await waitForTool(page, 'search_tickets')).toBe(true);
    const out = await executeTool(page, 'search_tickets', {}); // 資訊清單: examples.invalid
    expect(out).toMatch(/^ERROR:/); // 命令式約定：解析為 "ERROR: ..."
    // 宣告式工具則會在 schema/驗證失敗時直接拒絕 (REJECT) — 針對該類工具，
    // 請產生：await expect(executeTool(page, '<tool>', {})).rejects.toThrow();
  });
});

// 變更狀態宣告式 (MUTATING DECLARATIVE) 表單工具的完整範例。Chrome 會填寫表單，
// 然後暫停 (PAUSE) 執行，直到真實的提交互動發生 — 僅等待 executeTool 會導致死鎖。
// 在不等待的情況下啟動它，等待 Agent 填入的值，點擊提交，然後等待結果。

test.describe('send_contact_message', () => {
  test.beforeEach(async () => {
    // 依據各測試進行導覽 — 提交導覽的執行會離開路由。
    await page.goto(`${BASE_URL}/contact`); // 資訊清單: route
  });

  test('透過並行提交點擊模式執行', async () => {
    expect(await waitForTool(page, 'send_contact_message')).toBe(true);
    // 1. 在不等待的情況下啟動執行（Chrome 會在表單處將其暫停）。
    const pending = executeTool(page, 'send_contact_message', {
      email: 'qa@example.test', // 資訊清單: examples.valid
      message: '[webmcpify verification] harness test message',
    });
    // 2. 等待直到 Agent 填入的值在表單中可見。
    await expect(page.getByLabel('Email')).toHaveValue('qa@example.test');
    // 3. 執行真實的提交互動，以恢復已暫停的執行。
    await page.getByRole('button', { name: 'Send' }).click();
    // 4. 此時 Promise 敲定。
    const out = await pending;
    if (out === null) {
      // null = 執行引發了導覽（提交後導覽的表單）— 斷言目的地而非傳回值。
      // beforeEach 會還原路由。
      await expect(page).toHaveURL(/thank-you/); // 資訊清單: expect.navigation
    } else {
      expect(out).not.toMatch(/^ERROR:/);
      expect(out).toContain('received'); // 資訊清單: expect.result
    }
    // 資訊清單: cleanup — mutating:"server" 工具必須在此處復原副作用
    // （例如透過使用者介面自有的管理路徑刪除測試訊息）。
  });
});

// ZERO-PARAM READ 工具的完整範例，其 `examples.invalid` 遵循
// 零參數約定 ({"unexpected": true})。雙重結果：拒絕非預期的索引鍵或良性解析
// （接受並忽略）兩者皆視為通過 — 絕對不能通過的是遺失工具或遺失 WebMCP 層面。

test.describe('get_page_summary', () => {
  test.beforeEach(async () => {
    await page.goto(BASE_URL); // 資訊清單: route
  });

  test('處理非預期輸入且無副作用（雙重結果）', async () => {
    expect(await waitForTool(page, 'get_page_summary')).toBe(true); // 首先確認存在
    try {
      const out = await executeTool(page, 'get_page_summary', { unexpected: true }); // 資訊清單: examples.invalid
      // 已解析：必須為良性 — 正常結果（readOnlyHint 工具：不可能產生副作用）
      // 或自我修正的 "ERROR: ..." 字串。
      expect(out).not.toBeNull();
    } catch (err) {
      // 已拒絕：僅可接受作為驗證拒絕 — 遺失層面或未註冊工具為真正的失敗，
      // 而非通過。
      expect(String(err)).not.toMatch(/No WebMCP|is not registered/);
    }
  });
});
