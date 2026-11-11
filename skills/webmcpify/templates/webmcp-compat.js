/**
 * webmcpify 相容性協助程式 — vendored 自 https://github.com/TueJon/webmcpify
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
 * 共用的字串/物件相容性協助程式，用於從 JSON
 * 字串過渡到 JavaScript 物件的原生轉換。
 * 由 templates/webmcp.spec.ts (針對瀏覽器邊界部分內嵌於 page.evaluate 內部)
 * 與 tests/compat.test.mjs 使用 — 單一可靠事實來源。
 * 當不再支援 Chrome 154 時，即可移除 JSON 字串分支。
 */

export function parseInputSchema(raw) {
  return typeof raw === 'string' ? JSON.parse(raw) : raw ?? { type: 'object', properties: {} };
}

/**
 * 明確的轉接器模式 — 先探測功能，不重試真實工具：
 * - 透過直接 tool.execute(object) 進行虛設常式 (stub) — 無前端無周邊時代的 stub
 * - 目前的原生/規格 mc.executeTool(tool, object)
 * - 舊版 Chrome mc.executeTool(tool, JSON string)
 * 測試控管 (harness) 在呼叫應用程式工具之前，
 * 會先使用無副作用的暫存工具判定原生模式。
 * 處理常式失敗絕不會觸發重試，因此變更不會執行兩次。
 */
export function isStubTool(tool) {
  return typeof tool?.execute === 'function';
}

export function isStubObjectExecute(mc) {
  return !!mc?.__webmcpStubObjectMode;
}

export function normalizeResult(r) {
  return r == null ? null : typeof r === 'string' ? r : JSON.stringify(r);
}
