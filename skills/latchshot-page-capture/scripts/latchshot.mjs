#!/usr/bin/env node

import { randomBytes } from 'node:crypto';
import { access, mkdir, open, rename, rm, stat } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ORIGIN = 'https://latchshot.fly.dev';
const CAPTURE_URL = `${ORIGIN}/v1/render`;
const DEMO_URL = `${ORIGIN}/api/demo`;
const USAGE_URL = `${ORIGIN}/v1/usage`;
const USER_AGENT = 'latchshot-agent-skill/1.1';
const MAX_ARTIFACT_BYTES = 50 * 1024 * 1024;
const MAX_JSON_BYTES = 1024 * 1024;

const FORMAT_BY_EXTENSION = new Map([
  ['.png', 'png'],
  ['.jpg', 'jpeg'],
  ['.jpeg', 'jpeg'],
  ['.pdf', 'pdf'],
]);

const CONTENT_TYPE_BY_FORMAT = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  pdf: 'application/pdf',
};

const booleanFlags = new Set([
  'allow-query',
  'block-ads',
  'block-chats',
  'block-trackers',
  'dark',
  'force',
  'full-page',
  'hide-cookie-banners',
  'hide-popups',
  'landscape',
  'scroll-page',
]);

const valueFlags = new Set([
  'delay-ms',
  'format',
  'height',
  'output',
  'paper',
  'quality',
  'scale',
  'timeout-ms',
  'url',
  'wait-until',
  'width',
]);

class CliError extends Error {
  constructor(message, code = 'invalid_arguments', exitCode = 2) {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.exitCode = exitCode;
  }
}

function help() {
  return `用法：
  node scripts/latchshot.mjs capture --url URL --output FILE [選項]
  node scripts/latchshot.mjs demo --url URL --output FILE [選項]
  node scripts/latchshot.mjs usage

擷取單一公開的 HTTP(S) 網頁並驗證為本機成品。demo
指令不需要金鑰，且僅回傳 JPEG，每個 IP 每小時限制 3 次嘗試。
capture 與 usage 會讀取 LATCHSHOT_API_KEY；絕不接受將金鑰作為引數傳入。

Demo 選項：
  --width 320..2560           檢視區寬度（預設值：1440）
  --height 240..1440          檢視區高度（預設值：900）
  --allow-query               確認查詢字串不包含機密資訊
  --force                     以不可部分完成的方式覆寫已存在的輸出檔案

Capture 選項：
  --format png|jpeg|pdf       若省略則由輸出檔案副檔名推斷
  --width 320..2560           檢視區寬度（預設值：1440）
  --height 240..1440          檢視區高度（預設值：900）
  --scale 1|2                 裝置縮放比例（預設值：1）
  --quality 1..100            僅限 JPEG（預設值：85）
  --full-page                 擷取有邊界的完整頁面（僅限螢幕截圖）
  --scroll-page               有邊界的延遲載入內容捲動；需要 --full-page
  --wait-until load|domcontentloaded|networkidle
  --delay-ms 0..3000          載入後的額外等待時間
  --timeout-ms 3000..30000    導覽逾時時間
  --dark                      偏好深色配置
  --block-ads                 盡力阻擋已知的廣告主機
  --block-trackers            盡力阻擋已知的追蹤器主機
  --block-chats               盡力阻擋已知的對話外掛主機
  --hide-cookie-banners       隱藏常見的同意聲明浮層（不點擊）
  --hide-popups               隱藏常見的註冊/電子報/折扣浮層
  --paper A4|Letter|Legal     僅限 PDF（預設值：A4）
  --landscape                 僅限 PDF
  --allow-query               確認查詢字串不包含機密資訊
  --force                     以不可部分完成的方式覆寫已存在的輸出檔案
  --help                      顯示此說明

範例：
  node scripts/latchshot.mjs demo --url https://example.com --output demo.jpg
  node scripts/latchshot.mjs capture --url https://example.com --output page.png
  node scripts/latchshot.mjs capture --url https://example.com --output page.pdf --paper A4
  node scripts/latchshot.mjs usage

結束代碼：0 成功，2 輸入無效，3 缺少金鑰，4 API/網路失敗，
5 無效成品或檔案系統失敗。`;
}

function parseFlags(tokens) {
  const flags = new Map();
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith('--')) {
      throw new CliError(`未預期的引數：${token}`);
    }

    const separator = token.indexOf('=');
    const name = token.slice(2, separator === -1 ? undefined : separator);
    if (flags.has(name)) throw new CliError(`重複的選項：--${name}`);

    if (name === 'help') {
      flags.set(name, true);
      continue;
    }
    if (booleanFlags.has(name)) {
      if (separator !== -1) throw new CliError(`--${name} 不接受值`);
      flags.set(name, true);
      continue;
    }
    if (!valueFlags.has(name)) throw new CliError(`未知的選項：--${name}`);

    const value = separator === -1 ? tokens[++index] : token.slice(separator + 1);
    if (value === undefined || value.startsWith('--') || value === '') {
      throw new CliError(`--${name} 需要提供值`);
    }
    flags.set(name, value);
  }
  return flags;
}

function integerFlag(flags, name, fallback, minimum, maximum) {
  const raw = flags.get(name);
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new CliError(`--${name} 必須是介於 ${minimum} 到 ${maximum} 之間的整數`);
  }
  return value;
}

function choiceFlag(flags, name, fallback, allowed) {
  const value = flags.get(name) ?? fallback;
  if (!allowed.includes(value)) {
    throw new CliError(`--${name} 必須是以下之一：${allowed.join(', ')}`);
  }
  return value;
}

function targetUrl(raw, allowQuery) {
  if (!raw) throw new CliError('必須提供 --url');
  let target;
  try {
    target = new URL(raw);
  } catch {
    throw new CliError('--url 必須是有效的絕對 HTTP 或 HTTPS URL', 'invalid_target');
  }
  if (!['http:', 'https:'].includes(target.protocol)) {
    throw new CliError('--url 必須使用 http 或 https', 'invalid_target');
  }
  if (target.username || target.password) {
    throw new CliError('--url 不能包含認證資訊', 'invalid_target');
  }
  if (target.port && !['80', '443'].includes(target.port)) {
    throw new CliError('--url 只能使用網頁連接埠 80 或 443', 'invalid_target');
  }
  if (target.search && !allowQuery) {
    throw new CliError('--url 含有查詢字串；請確認其中不含機密資訊，然後傳入 --allow-query', 'query_confirmation_required');
  }
  if (target.hash) {
    throw new CliError('--url 不能包含片段識別碼 (fragment)', 'invalid_target');
  }
  return target.href;
}

function apiKey(env) {
  const key = env.LATCHSHOT_API_KEY;
  if (!key || typeof key !== 'string' || /\s/.test(key)) {
    throw new CliError('請將 LATCHSHOT_API_KEY 設定為 Latchshot 金鑰；請勿將其作為引數傳遞', 'missing_api_key', 3);
  }
  return key;
}

function outputContract(flags) {
  const raw = flags.get('output');
  if (!raw || raw === '-') throw new CliError('必須提供 --output 且必須為檔案路徑');
  const output = resolve(raw);
  const inferred = FORMAT_BY_EXTENSION.get(extname(output).toLowerCase());
  if (!inferred) throw new CliError('--output 必須以 .png、.jpg、.jpeg 或 .pdf 結尾');
  const format = choiceFlag(flags, 'format', inferred, ['png', 'jpeg', 'pdf']);
  if (format !== inferred) {
    throw new CliError(`--format ${format} 與輸出檔案 ${basename(output)} 不符`);
  }
  return { output, format };
}

function capturePayload(flags) {
  const { output, format } = outputContract(flags);
  const fullPage = flags.has('full-page');
  const scrollPage = flags.has('scroll-page');
  if (scrollPage && !fullPage) throw new CliError('--scroll-page 需要搭配 --full-page');
  if (format === 'pdf' && (fullPage || scrollPage)) {
    throw new CliError('--full-page 與 --scroll-page 是螢幕截圖選項，而非 PDF 選項');
  }
  if (flags.has('quality') && format !== 'jpeg') {
    throw new CliError('--quality 僅支援 JPEG 輸出');
  }
  if (format !== 'pdf' && (flags.has('paper') || flags.has('landscape'))) {
    throw new CliError('--paper 與 --landscape 僅支援 PDF 輸出');
  }

  const payload = {
    url: targetUrl(flags.get('url'), flags.has('allow-query')),
    format,
    width: integerFlag(flags, 'width', 1440, 320, 2560),
    height: integerFlag(flags, 'height', 900, 240, 1440),
    scale: integerFlag(flags, 'scale', 1, 1, 2),
    fullPage,
    scrollPage,
    waitUntil: choiceFlag(flags, 'wait-until', 'domcontentloaded', ['load', 'domcontentloaded', 'networkidle']),
    delayMs: integerFlag(flags, 'delay-ms', 0, 0, 3000),
    timeoutMs: integerFlag(flags, 'timeout-ms', 15000, 3000, 30000),
    darkMode: flags.has('dark'),
    blockAds: flags.has('block-ads'),
    blockTrackers: flags.has('block-trackers'),
    blockChats: flags.has('block-chats'),
    hideCookieBanners: flags.has('hide-cookie-banners'),
    hidePopups: flags.has('hide-popups'),
  };

  if (format === 'jpeg') payload.quality = integerFlag(flags, 'quality', 85, 1, 100);
  if (format === 'pdf') {
    payload.paper = choiceFlag(flags, 'paper', 'A4', ['A4', 'Letter', 'Legal']);
    payload.landscape = flags.has('landscape');
  }
  return { output, format, payload, force: flags.has('force') };
}

function demoPayload(flags) {
  const allowed = new Set(['allow-query', 'force', 'height', 'output', 'url', 'width']);
  for (const name of flags.keys()) {
    if (!allowed.has(name)) throw new CliError(`demo 不接受 --${name}`);
  }
  const { output, format } = outputContract(flags);
  if (format !== 'jpeg') throw new CliError('demo 輸出必須以 .jpg 或 .jpeg 結尾');
  return {
    output,
    format,
    payload: {
      url: targetUrl(flags.get('url'), flags.has('allow-query')),
      width: integerFlag(flags, 'width', 1440, 320, 2560),
      height: integerFlag(flags, 'height', 900, 240, 1440),
    },
    force: flags.has('force'),
  };
}

async function readBounded(response, maximum) {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maximum) {
    throw new CliError(`回應大小超過 ${maximum} 位元組`, 'response_too_large', 5);
  }
  if (!response.body) return Buffer.alloc(0);

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximum) {
      await reader.cancel();
      throw new CliError(`回應大小超過 ${maximum} 位元組`, 'response_too_large', 5);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, total);
}

function redact(value) {
  return String(value || '')
    .replace(/ls_live_[A-Za-z0-9_-]+/g, '[redacted-key]')
    .replace(/https?:\/\/[^\s"']+/g, '[redacted-url]')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 500);
}

function apiFailure(status, body) {
  let code = `http_${status}`;
  let message = `Latchshot 回傳 HTTP ${status}`;
  try {
    const parsed = JSON.parse(body.toString('utf8'));
    code = redact(parsed?.error?.code || code);
    message = redact(parsed?.error?.message || message);
  } catch {
    const text = redact(body.toString('utf8'));
    if (text) message = text;
  }
  throw new CliError(message, code, 4);
}

function validateArtifact(format, contentType, body) {
  const expected = CONTENT_TYPE_BY_FORMAT[format];
  if (contentType !== expected) {
    throw new CliError(`預期為 ${expected} 但收到 ${contentType || '無內容類型'}`, 'invalid_content_type', 5);
  }
  const valid = format === 'png'
    ? body.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    : format === 'jpeg'
      ? body.length >= 4 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff
      : body.subarray(0, 5).equals(Buffer.from('%PDF-'));
  if (!valid) throw new CliError(`回應主體不是有效的 ${format} 成品`, 'invalid_artifact', 5);
}

async function exists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function writeAtomic(output, body, force) {
  if (!force && await exists(output)) {
    throw new CliError(`輸出檔案已存在：${output}；請選擇其他路徑或傳入 --force`, 'output_exists', 5);
  }
  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.latchshot-${process.pid}-${randomBytes(6).toString('hex')}.tmp`;
  let handle;
  try {
    handle = await open(temporary, 'wx', 0o600);
    await handle.writeFile(body);
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporary, output);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await rm(temporary, { force: true }).catch(() => {});
    if (error instanceof CliError) throw error;
    throw new CliError(`無法寫入輸出檔案：${redact(error.message)}`, 'output_failed', 5);
  }
}

function numericHeader(headers, name) {
  const value = headers.get(name);
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function capture(flags, env, fetchImpl) {
  const key = apiKey(env);
  const { output, format, payload, force } = capturePayload(flags);
  if (!force && await exists(output)) {
    throw new CliError(`輸出檔案已存在：${output}；請選擇其他路徑或傳入 --force`, 'output_exists', 5);
  }
  let response;
  try {
    response = await fetchImpl(CAPTURE_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        'user-agent': USER_AGENT,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(payload.timeoutMs + 15000),
    });
  } catch (error) {
    throw new CliError(`請求失敗：${redact(error.message)}`, 'request_failed', 4);
  }

  const body = await readBounded(response, response.ok ? MAX_ARTIFACT_BYTES : MAX_JSON_BYTES);
  if (!response.ok) apiFailure(response.status, body);
  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  validateArtifact(format, contentType, body);
  await writeAtomic(output, body, force);
  const file = await stat(output);

  return {
    ok: true,
    operation: 'capture',
    output,
    format,
    contentType,
    bytes: file.size,
    render: {
      durationMs: numericHeader(response.headers, 'x-latchshot-render-ms'),
      navigation: response.headers.get('x-latchshot-navigation'),
      fonts: response.headers.get('x-latchshot-fonts'),
      scripts: response.headers.get('x-latchshot-scripts'),
      scroll: response.headers.get('x-latchshot-scroll'),
    },
    quota: {
      limit: numericHeader(response.headers, 'x-quota-limit'),
      remaining: numericHeader(response.headers, 'x-quota-remaining'),
      resetAt: response.headers.get('x-quota-reset'),
    },
  };
}

async function demo(flags, fetchImpl) {
  const { output, format, payload, force } = demoPayload(flags);
  if (!force && await exists(output)) {
    throw new CliError(`輸出檔案已存在：${output}；請選擇其他路徑或傳入 --force`, 'output_exists', 5);
  }
  let response;
  try {
    response = await fetchImpl(DEMO_URL, {
      method: 'POST',
      headers: {
        accept: 'image/jpeg',
        'content-type': 'application/json',
        'user-agent': USER_AGENT,
        'x-latchshot-acquisition': 'agentskill',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    throw new CliError(`請求失敗：${redact(error.message)}`, 'request_failed', 4);
  }

  const body = await readBounded(response, response.ok ? MAX_ARTIFACT_BYTES : MAX_JSON_BYTES);
  if (!response.ok) apiFailure(response.status, body);
  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  validateArtifact(format, contentType, body);
  await writeAtomic(output, body, force);
  const file = await stat(output);

  return {
    ok: true,
    operation: 'demo',
    output,
    format,
    contentType,
    bytes: file.size,
    render: {
      durationMs: numericHeader(response.headers, 'x-latchshot-render-ms'),
      navigation: response.headers.get('x-latchshot-navigation'),
      fonts: response.headers.get('x-latchshot-fonts'),
      scripts: response.headers.get('x-latchshot-scripts'),
    },
    demo: {
      authenticationRequired: false,
      attemptsPerIpPerHour: 3,
    },
  };
}

async function usage(env, fetchImpl) {
  const key = apiKey(env);
  let response;
  try {
    response = await fetchImpl(USAGE_URL, {
      headers: {
        authorization: `Bearer ${key}`,
        accept: 'application/json',
        'user-agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new CliError(`請求失敗：${redact(error.message)}`, 'request_failed', 4);
  }
  const body = await readBounded(response, MAX_JSON_BYTES);
  if (!response.ok) apiFailure(response.status, body);
  try {
    return { ok: true, operation: 'usage', usage: JSON.parse(body.toString('utf8')) };
  } catch {
    throw new CliError('usage 回應不是有效的 JSON', 'invalid_usage_response', 5);
  }
}

export async function run(argv, options = {}) {
  const env = options.env || process.env;
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const stdout = options.stdout || ((line) => console.log(line));
  const stderr = options.stderr || ((line) => console.error(line));

  try {
    if (argv.length === 0 || argv.includes('--help')) {
      stdout(help());
      return 0;
    }
    const [command, ...tokens] = argv;
    const flags = parseFlags(tokens);
    if (flags.has('help')) {
      stdout(help());
      return 0;
    }
    let result;
    if (command === 'capture') result = await capture(flags, env, fetchImpl);
    else if (command === 'demo') result = await demo(flags, fetchImpl);
    else if (command === 'usage') {
      if (flags.size > 0) throw new CliError('usage 不接受選項');
      result = await usage(env, fetchImpl);
    } else {
      throw new CliError(`指令必須是 capture、demo 或 usage；收到：${command}`);
    }
    stdout(JSON.stringify(result));
    return 0;
  } catch (error) {
    const safe = error instanceof CliError
      ? error
      : new CliError(redact(error.message), 'unexpected_error', 5);
    stderr(JSON.stringify({ ok: false, error: { code: safe.code, message: redact(safe.message) } }));
    return safe.exitCode;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await run(process.argv.slice(2));
}
