#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const playwrightVersion = '1.61.1';
const usage = '用法: node workbench.mjs --url <dev-url> [--manifest <path>] [--browser chromium|firefox|webkit] [--native] [--allow-playwright-install] [--allow-browser-download]';
const value = (flag, fallback) => {
  const index = argv.indexOf(flag);
  if (index === -1) return fallback;
  const result = argv[index + 1];
  if (!result || result.startsWith('--')) throw new Error(`${flag} 需要一個值。`);
  return result;
};
if (argv.includes('--help')) {
  console.log(usage);
  process.exit(0);
}
const url = value('--url');
if (!url) {
  console.error(usage);
  process.exit(2);
}
const browserName = value('--browser', 'chromium');
if (!['chromium', 'firefox', 'webkit'].includes(browserName)) throw new Error(`不支援的瀏覽器 "${browserName}"。`);
const native = argv.includes('--native');
if (native && browserName !== 'chromium') throw new Error('--native 需要 Chromium/Chrome。');

function run(command, args, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.once('error', rejectRun);
    child.once('exit', (code, signal) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} 已結束，${signal ? `信號為 ${signal}` : `結束代碼為 ${code}`}。`));
    });
  });
}

async function consent(flag, action) {
  if (argv.includes(flag)) return;
  const instruction = `${action} 需要明確核准。請加上 ${flag} 重新執行以僅核准此操作。`;
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error(instruction);
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await prompt.question(`${action}? [y/N] `);
    if (!/^y(es)?$/i.test(answer.trim())) throw new Error(instruction);
  } finally {
    prompt.close();
  }
}

async function loadPlaywright() {
  const localRequire = createRequire(import.meta.url);
  try {
    return { playwright: localRequire('playwright'), resolveModule: localRequire.resolve };
  } catch (error) {
    if (error?.code !== 'MODULE_NOT_FOUND' || !String(error.message).includes("'playwright'")) throw error;
  }

  const scratch = join(tmpdir(), `webmcpify-workbench-playwright-${playwrightVersion}`);
  const scratchRequire = createRequire(join(scratch, 'package.json'));
  try {
    return { playwright: scratchRequire('playwright'), resolveModule: scratchRequire.resolve };
  } catch (error) {
    if (error?.code !== 'MODULE_NOT_FOUND' || !String(error.message).includes("'playwright'")) throw error;
  }

  await consent('--allow-playwright-install', `使用 npm 將 Playwright ${playwrightVersion} 安裝至 ${scratch} (不下載瀏覽器)`);
  await mkdir(scratch, { recursive: true });
  console.error(`正在目標專案外部準備暫存的 Playwright ${playwrightVersion} 執行階段…`);
  await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
    'install', '--no-save', '--no-package-lock', `playwright@${playwrightVersion}`,
  ], { cwd: scratch, env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' } });
  return { playwright: scratchRequire('playwright'), resolveModule: scratchRequire.resolve };
}

const loaded = await loadPlaywright();
const { chromium, firefox, webkit } = loaded.playwright;
const browserType = { chromium, firefox, webkit }[browserName];

const manifestPath = value('--manifest');
const manifest = manifestPath ? JSON.parse(await readFile(resolve(manifestPath), 'utf8')) : { tools: [] };
const source = await readFile(resolve(here, '..', 'templates', 'webmcp-workbench.js'), 'utf8');
const bootSource = `globalThis.__WEBMCPIFY_WORKBENCH__ = ${JSON.stringify({ manifest, open: true })};\n${source}`;
const launchOptions = {
  headless: false,
  ...(native ? { channel: 'chrome', args: ['--enable-features=WebMCP,WebMCPTesting'] } : {}),
};
let browser;
try {
  browser = await browserType.launch(launchOptions);
} catch (error) {
  const missingBundledBrowser = !native && /Executable doesn't exist|browserType\.launch: Executable/.test(String(error));
  if (!missingBundledBrowser) throw error;
  await consent('--allow-browser-download', `將 Playwright ${browserName} 瀏覽器下載至其快取中`);
  console.error(`正在下載暫存的 ${browserName} 瀏覽器執行階段…`);
  await run(process.execPath, [loaded.resolveModule('playwright/cli'), 'install', browserName]);
  browser = await browserType.launch(launchOptions);
}
try {
  const context = await browser.newContext();
  await context.addInitScript({ content: bootSource });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') console.error(`[page] ${message.text()}`);
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const evidence = await page.locator('#webmcpify-workbench').getAttribute('data-evidence');
  console.log(`WebMCP 工作台: ${url} · ${browserName} · ${evidence}`);
  console.log('關閉瀏覽器或按 Ctrl+C 即可結束暫存工作階段。');

  await new Promise((resolveDone) => {
    const done = () => resolveDone();
    browser.on('disconnected', done);
    process.once('SIGINT', done);
    process.once('SIGTERM', done);
  });
} finally {
  await browser.close().catch(() => {});
}
