#!/usr/bin/env node
// 掃描 Cypress 規格檔、支援檔案與設定檔，找出易引發不穩定測試的反模式，
// 以及在 Cypress 12 到 16 中移除的 API。
//
// 零相依性。需要 Node.js 18 或更高版本。
// 此掃描為啟發式（基於文字，非 AST）。請將發現項目視為待確認的線索，
// 而非絕對依據。

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const HELP = `用法: node scan-cypress.mjs [paths...] [options]

掃描 Cypress 測試程式碼中易引發不穩定測試的反模式及已移除的 API。
若未提供路徑，則掃描目前目錄。

選項:
  --json               輸出機器可讀取的 JSON 格式而非純文字
  --strict             同時回報低信賴度的規則 (CY1xx)
  --rule <ids>         僅回報指定的規則識別碼，以逗號分隔 (例如 CY001,CY005)
  --max-per-rule <n>   在文字輸出中每條規則列出的發現項目上限 (預設 20，0 代表全部)
  --fail-on <level>    若存在達到或超過此層級的發現項目時以代碼 1 結束:
                       error | warn | info | never (預設 never)
  --cypress-major <n>  覆寫從 package.json 偵測到的 Cypress 主版本號
  --list-rules         輸出規則目錄並結束
  -h, --help           顯示此說明訊息

在同一行或前一行加上註解即可抑制發現項目:
  // cy-scan-ignore            (所有規則)
  // cy-scan-ignore CY001      (一或多個規則識別碼)

結束代碼: 0 正常，1 達到 --fail-on 門檻，2 使用方式或 I/O 錯誤。`

const RULES = {
  CY001: ['fixed-wait', 'warn', 'cy.wait(<number>) 依據時間等待。請改為等待 cy.intercept() 別名或具重試機制的斷言。'],
  CY002: ['assigned-return-value', 'error', '指派了 cy 指令的傳回值。指令會排入佇列並於稍後產生結果；請使用 .then()、.should() 或別名。'],
  CY003: ['async-await', 'error', '在 Cypress 指令中使用了 async/await。指令並非 Promise；請移除 async 與 await。'],
  CY004: ['force-true', 'warn', '{ force: true } 會略過可操作性檢查。請找出遮擋或停用該元件的原因。'],
  CY005: ['chain-after-action', 'warn', '在操作後鏈結了指令。僅在元件不會重新轉譯時安全；否則請重新發起新的 cy.get()。'],
  CY006: ['one-shot-assertion', 'warn', '在 .then() 內的 expect() 僅執行一次且不會重試。請使用 .should() 或 .should(callback)。'],
  CY007: ['removed-api', 'error', 'API 已在較新的 Cypress 主版本中移除或變更。'],
  CY008: ['conditional-on-dom', 'warn', '測試依據 DOM 狀態分支。請先使狀態確定，然後對其進行斷言。'],
  CY009: ['exclusive-or-debug', 'warn', '程式碼中遺留了 .only、cy.pause() 或 cy.debug()。'],
  CY010: ['cleanup-in-after-hook', 'info', '狀態在 after/afterEach 中清理。請在 before/beforeEach 中重設狀態，以避免中斷的執行造成外洩。'],
  CY011: ['absolute-local-visit', 'info', 'cy.visit() 使用了絕對本機 URL。請設定 baseUrl 並瀏覽相對路徑。'],
  CY012: ['ui-login-without-session', 'info', '在多個檔案中透過 UI 輸入密碼，且從未使用 cy.session()。'],
  CY013: ['positional-selector', 'info', '選取器相依於元件位置。建議優先使用 data-* 屬性。'],
  CY101: ['brittle-selector', 'info', '選取器相依於 CSS class 或 id。建議優先使用 data-* 屬性。'],
  CY102: ['negative-assertion-as-wait', 'info', '在元件尚未轉譯前負向斷言便已通過。請確認已先斷言正向狀態。'],
  CY103: ['variable-wait', 'info', '使用識別碼呼叫 cy.wait()。請確認其為別名而非毫秒數。'],
}

const LEVELS = { info: 1, warn: 2, error: 3 }

const REMOVED = [
  [/\bCypress\s*\.\s*env\s*\(/g, 16, 'Cypress.env() 已在 16.0 移除 (15.10 淘汰)。機密資訊請使用 cy.env([...])，公開值請使用 Cypress.expose()。'],
  [/\bcy\s*\.\s*exec\s*\(/g, 16, 'cy.exec() 已在 16.0 移除。請在 setupNodeEvents 中註冊工作並呼叫 cy.task()。'],
  [/\)\s*\.\s*end\s*\(\s*\)/g, 16, '.end() 已在 16.0 移除。請刪除此呼叫。'],
  [/\bexecTimeout\b/g, 16, 'execTimeout 已在 16.0 隨 cy.exec() 一同移除。請使用 taskTimeout。'],
  [/\bexperimentalMemoryManagement\b/g, 16, 'experimentalMemoryManagement 已在 16.0 移除。請刪除此設定，或設為 manageBrowserMemory: false 以退出。'],
  [/\bexperimentalFastVisibility\b/g, 16, 'experimentalFastVisibility 已在 16.0 移除。visibilityStrategy 現預設為 "modern"。'],
  [/\bexperimentalSourceRewriting\b/g, 16, 'experimentalSourceRewriting 已在 16.0 移除。請刪除此設定；SRI 錯誤請使用 removeSRIAttributes。'],
  [/\ballowCypressEnv\b/g, 16, 'allowCypressEnv 已在 16.0 移除。請刪除此設定。'],
  [/\bCypress\s*\.\s*config\s*\(\s*['"`](?:viewportWidth|viewportHeight|blockHosts)['"`]\s*,/g, 16, '在測試期間透過 Cypress.config() 設定此項在 16.0 會擲出錯誤。請使用 cy.viewport() 或測試設定物件。'],
  [/\bCypress\s*\.\s*Commands\s*\.\s*overwrite\s*\(\s*['"`](?:getCookie|getCookies|getAllCookies|getAllLocalStorage|getAllSessionStorage)['"`]/g, 16, '此指令在 16.0 屬於查詢。請使用 Cypress.Commands.overwriteQuery()。'],
  [/\bCypress\s*\.\s*SelectorPlayground\b/g, 15, 'Cypress.SelectorPlayground 已在 15.0 重新命名為 Cypress.ElementSelector。'],
  [/\bexperimentalSkipDomainInjection\b/g, 14, 'experimentalSkipDomainInjection 已在 14.0 移除。子網域請使用 cy.origin()。'],
  [/\bexperimentalJustInTimeCompile\b/g, 14, 'experimentalJustInTimeCompile 已在 14.0 變更為 justInTimeCompile。'],
  [/\bvideoUploadOnPasses\b/g, 13, 'videoUploadOnPasses 已在 13.0 移除。'],
  [/\bcy\s*\.\s*(?:server|route)\s*\(/g, 12, 'cy.server() 與 cy.route() 已在 12.0 移除。請使用 cy.intercept()。'],
  [/\bCypress\s*\.\s*Cookies\s*\.\s*(?:preserveOnce|defaults)\b/g, 12, 'Cypress.Cookies.preserveOnce() 與 .defaults() 已在 12.0 移除。請使用 cy.session()。'],
  [/\bexperimentalSessionAndOrigin\b/g, 12, 'experimentalSessionAndOrigin 已在 12.0 移除。cy.session() 與 cy.origin() 現已穩定。'],
  [/\bcy\s*\.\s*route2\s*\(/g, 7, 'cy.route2() 已在 7.0 重新命名為 cy.intercept()。'],
  [/\bcy\s*\.\s*xpath\s*\(/g, null, 'cy.xpath() 來自已淘汰的 cypress-xpath 外掛模組。請使用 cy.get() 或 cy.contains()。'],
]

const ACTIONS = 'click|dblclick|rightclick|type|clear|check|uncheck|select|selectFile|trigger|focus|blur|submit|scrollIntoView|scrollTo'
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt', 'out', 'screenshots', 'videos', 'downloads'])
const CODE_EXT = /\.(?:[cm]?[jt]sx?)$/

function rel(file) {
  const relative = path.relative(process.cwd(), file)
  const shown = relative && !relative.startsWith('..') && !path.isAbsolute(relative) ? relative : file
  return shown.split(path.sep).join('/')
}

function fail(message) {
  process.stderr.write(`scan-cypress: ${message}\n`)
  process.exit(2)
}

function parseArgs(argv) {
  const opts = { paths: [], json: false, strict: false, rules: null, maxPerRule: 20, failOn: 'never', major: undefined }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const next = () => {
      if (i + 1 >= argv.length) fail(`${arg} 需要提供數值`)
      return argv[++i]
    }
    if (arg === '-h' || arg === '--help') { process.stdout.write(`${HELP}\n`); process.exit(0) }
    else if (arg === '--list-rules') {
      for (const [id, [name, level, text]] of Object.entries(RULES)) process.stdout.write(`${id}  ${name.padEnd(28)} ${level.padEnd(5)} ${text}\n`)
      process.exit(0)
    }
    else if (arg === '--json') opts.json = true
    else if (arg === '--strict') opts.strict = true
    else if (arg === '--rule') opts.rules = new Set(next().split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))
    else if (arg === '--max-per-rule') {
      opts.maxPerRule = Number(next())
      if (!Number.isInteger(opts.maxPerRule) || opts.maxPerRule < 0) fail('--max-per-rule 需要非負整數')
    }
    else if (arg === '--fail-on') {
      opts.failOn = next()
      if (!['error', 'warn', 'info', 'never'].includes(opts.failOn)) fail('--fail-on 必須是 error、warn、info 或 never')
    }
    else if (arg === '--cypress-major') {
      opts.major = Number(next())
      if (!Number.isInteger(opts.major) || opts.major < 1) fail('--cypress-major 需要正整數')
    }
    else if (arg.startsWith('-')) fail(`未知的選項 ${arg} (請嘗試 --help)`)
    else opts.paths.push(arg)
  }
  if (opts.paths.length === 0) opts.paths.push('.')
  if (opts.rules) for (const id of opts.rules) if (!RULES[id]) fail(`未知的規則 ${id} (請嘗試 --list-rules)`)
  return opts
}

function isCypressFile(file) {
  const normalized = rel(file)
  const base = path.basename(normalized)
  if (/^cypress\.config\.[cm]?[jt]s$/.test(base)) return true
  if (!CODE_EXT.test(base)) return false
  if (/\.cy\.[cm]?[jt]sx?$/.test(base)) return true
  return /(?:^|\/)cypress\//.test(normalized)
}

function walk(target, files, coffee) {
  let stat
  try { stat = fs.statSync(target) } catch { fail(`無法讀取 ${target}`) }
  if (stat.isFile()) {
    if (isCypressFile(target) || CODE_EXT.test(target)) files.push(target)
    return
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, files, coffee)
    } else if (entry.isFile()) {
      if (isCypressFile(full)) files.push(full)
      else if (/\.coffee$/.test(entry.name) && /(?:^|\/)cypress\//.test(full.split(path.sep).join('/'))) coffee.push(full)
    }
  }
}

function detectCypress(startDir) {
  let dir = path.resolve(startDir)
  for (let depth = 0; depth < 8; depth++) {
    const file = path.join(dir, 'package.json')
    if (fs.existsSync(file)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
        const range = pkg.devDependencies?.cypress ?? pkg.dependencies?.cypress
        if (range) {
          const match = String(range).match(/\d+/)
          return { range: String(range), major: match ? Number(match[0]) : null, source: file }
        }
      } catch { /* 無法讀取的 package.json: 繼續往上層尋找 */ }
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return { range: null, major: null, source: null }
}

// 將註解替換為空白以保持偏移量與行號有效。
function blankComments(src) {
  let out = ''
  let state = 'code'
  for (let i = 0; i < src.length;) {
    const c = src[i]
    const d = src[i + 1]
    if (state === 'code') {
      if (c === '\\') { out += c + (d ?? ''); i += 2; continue }
      if (c === '/' && d === '/') { state = 'line'; out += '  '; i += 2; continue }
      if (c === '/' && d === '*') { state = 'block'; out += '  '; i += 2; continue }
      if (c === "'") state = 'sq'
      else if (c === '"') state = 'dq'
      else if (c === '`') state = 'tpl'
      out += c; i++; continue
    }
    if (state === 'line') {
      if (c === '\n') { state = 'code'; out += c } else out += ' '
      i++; continue
    }
    if (state === 'block') {
      if (c === '*' && d === '/') { state = 'code'; out += '  '; i += 2; continue }
      out += c === '\n' ? '\n' : ' '
      i++; continue
    }
    if (c === '\\') { out += c + (d ?? ''); i += 2; continue }
    if ((state === 'sq' && c === "'") || (state === 'dq' && c === '"') || (state === 'tpl' && c === '`')) state = 'code'
    else if ((state === 'sq' || state === 'dq') && c === '\n') state = 'code'
    out += c; i++
  }
  return out
}

// 在 `open` 處閉合的括號索引，若未找到則傳回 -1。
function matchParen(src, open) {
  let depth = 0
  let quote = null
  for (let i = open; i < src.length; i++) {
    const c = src[i]
    if (quote) {
      if (c === '\\') { i++; continue }
      if (c === quote) quote = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue }
    if (c === '(') depth++
    else if (c === ')') { depth--; if (depth === 0) return i }
  }
  return -1
}

// 包含偏移量 `idx` 之鏈結陳述式的起始偏移量。
function chainStart(src, idx) {
  let depth = 0
  for (let j = idx - 1; j >= 0; j--) {
    const c = src[j]
    if (c === ')' || c === ']' || c === '}') depth++
    else if (c === '(' || c === '[' || c === '{') {
      if (depth === 0) return j + 1
      depth--
    } else if (depth === 0) {
      if (c === ';') return j + 1
      if (c === '\n') {
        const rest = src.slice(j + 1, idx).trimStart()
        if (rest && rest[0] !== '.') return j + 1
      }
    }
  }
  return 0
}

function countTopLevelCommas(args) {
  let depth = 0
  let quote = null
  let commas = 0
  for (let i = 0; i < args.length; i++) {
    const c = args[i]
    if (quote) {
      if (c === '\\') { i++; continue }
      if (c === quote) quote = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') quote = c
    else if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') depth--
    else if (c === ',' && depth === 0 && args.slice(i + 1).trim()) commas++
  }
  return commas
}

function scanFile(file, opts, major, findings) {
  const raw = fs.readFileSync(file, 'utf8')
  const rawLines = raw.split('\n')
  const src = blankComments(raw)
  const lineStarts = [0]
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') lineStarts.push(i + 1)

  const lineOf = (offset) => {
    let lo = 0
    let hi = lineStarts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (lineStarts[mid] <= offset) lo = mid
      else hi = mid - 1
    }
    return lo + 1
  }

  const suppressed = (line, rule) => {
    for (const text of [rawLines[line - 1], rawLines[line - 2]]) {
      const match = text?.match(/cy-scan-ignore\b([^\n]*)/)
      if (!match) continue
      const ids = match[1].match(/CY\d{3}/g)
      if (!ids || ids.includes(rule)) return true
    }
    return false
  }

  const add = (rule, offset, message, level) => {
    if (opts.rules && !opts.rules.has(rule)) return
    if (!opts.strict && /^CY1\d\d$/.test(rule) && !(opts.rules && opts.rules.has(rule))) return
    const line = lineOf(offset)
    if (suppressed(line, rule)) return
    const snippet = (rawLines[line - 1] ?? '').trim()
    findings.push({
      rule,
      name: RULES[rule][0],
      level: level ?? RULES[rule][1],
      file: rel(file),
      line,
      message: message ?? RULES[rule][2],
      snippet: snippet.length > 140 ? `${snippet.slice(0, 137)}...` : snippet,
    })
  }

  const each = (regex, fn) => {
    regex.lastIndex = 0
    let match
    while ((match = regex.exec(src)) !== null) {
      fn(match)
      if (match[0].length === 0) regex.lastIndex++
    }
  }

  // CY001 固定等待
  each(/(?:\bcy|\))\s*\.\s*wait\s*\(\s*\d[\d_.]*\s*[,)]/g, (m) => add('CY001', m.index + m[0].indexOf('wait')))

  // CY103 等待識別碼 (嚴格模式)
  each(/\bcy\s*\.\s*wait\s*\(\s*[A-Za-z_$][\w$.]*\s*\)/g, (m) => add('CY103', m.index))

  // CY002 指派傳回值。cy.stub() 與 cy.spy() 為同步故不受此限。
  each(/\b(?:const|let|var)\s+[^=;\n]+=\s*cy\s*\.\s*(\w+)/g, (m) => {
    if (!['stub', 'spy', 'state'].includes(m[1])) add('CY002', m.index)
  })

  // CY003 非同步測試與 await 指令
  each(/\b(?:it|specify|before|beforeEach|after|afterEach)(?:\s*\.\s*(?:only|skip))?\s*\(\s*(?:(['"`])(?:\\.|(?!\1)[^\\])*\1\s*,\s*)?(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*,\s*)?async\b/g, (m) => add('CY003', m.index))
  each(/\bawait\s+cy\s*\./g, (m) => add('CY003', m.index, '對 cy 指令使用了 await。指令並非 Promise；請使用 .then()。'))

  // CY004 強制操作
  each(/\bforce\s*:\s*true\b/g, (m) => add('CY004', m.index))

  // CY005 操作後鏈結
  each(new RegExp(`\\.\\s*(${ACTIONS})\\s*\\(`, 'g'), (m) => {
    const open = m.index + m[0].length - 1
    const close = matchParen(src, open)
    if (close === -1) return
    const tail = src.slice(close + 1).match(/^\s*\.\s*([A-Za-z_$][\w$]*)/)
    if (!tail) return
    const next = tail[1]
    if (['then', 'as', 'catch', 'finally', 'end'].includes(next)) return
    const start = chainStart(src, m.index)
    if (!/^\s*(?:return\s+)?cy\b/.test(src.slice(start, m.index))) return
    const soft = next === 'should' || next === 'and'
    add(
      'CY005',
      m.index,
      soft
        ? `.${next}() 鏈結在 .${m[1]}() 之後。若操作導致元件重新轉譯，目標將會過期；請在斷言前重新查詢。`
        : `.${next}() 鏈結在 .${m[1]}() 之後。除非元件不會重新轉譯，否則請發起新的 cy.get()。`,
      soft ? 'info' : 'warn',
    )
  })

  // CY006 在 DOM 或頁面查詢後的 .then() 內部使用 expect()
  each(/\.\s*then\s*\(/g, (m) => {
    const open = m.index + m[0].length - 1
    const close = matchParen(src, open)
    if (close === -1) return
    const body = src.slice(open + 1, close)
    if (!/\bexpect\s*\(|\bassert\s*[.(]/.test(body) || /\bcy\s*\./.test(body)) return
    const chain = src.slice(chainStart(src, m.index), m.index)
    if (!/^\s*(?:return\s+)?cy\b/.test(chain)) return
    if (/\bcy\s*\.\s*(?:request|task|wait|env|fixture|readFile|wrap|window|exec|origin|session)\s*\(/.test(chain)) return
    if (/\bcy\s*\.\s*get\s*\(\s*['"`]@/.test(chain)) return
    if (!/\bcy\s*\.\s*(?:get|contains|url|title|location|hash|focused|getCookie|getCookies|getAllCookies|getAllLocalStorage|getAllSessionStorage)\s*\(/.test(chain)) return
    add('CY006', m.index)
  })

  // CY007 已移除的 API
  for (const [regex, removedIn, text] of REMOVED) {
    each(regex, (m) => {
      const broken = removedIn === null ? false : major === null ? null : major >= removedIn
      const level = broken === true ? 'error' : 'warn'
      const suffix = removedIn === null || major === null ? '' : broken ? ` 已安裝的主版本為 ${major}：此項已經失敗。` : ` 已安裝的主版本為 ${major}：請在升級前修正。`
      add('CY007', m.index, `${text}${suffix}`, level)
    })
  }
  each(/\bcy\s*\.\s*stub\s*\(/g, (m) => {
    const open = m.index + m[0].length - 1
    const close = matchParen(src, open)
    if (close === -1) return
    if (countTopLevelCommas(src.slice(open + 1, close)) >= 2) {
      const broken = major !== null && major >= 15
      add('CY007', m.index, 'cy.stub(obj, name, fn) 已在 15.0 移除。請使用 cy.stub(obj, name).callsFake(fn)。', broken ? 'error' : 'warn')
    }
  })

  // CY008 條件式測試
  each(/\bif\s*\(\s*!?\s*\$\w+\s*\.\s*(?:find|is|hasClass|children|text|length)\b/g, (m) => add('CY008', m.index))

  // CY009 排他測試與除錯指令
  each(/\b(?:it|describe|context|specify)\s*\.\s*only\s*\(/g, (m) => add('CY009', m.index, '提交了 .only：其餘的測試套件將不會執行。'))
  each(/(?:\bcy|\))\s*\.\s*(?:pause|debug)\s*\(\s*\)/g, (m) => add('CY009', m.index, '程式碼中遺留了 cy.pause() 或 cy.debug()。'))

  // CY010 清理掛鉤
  each(/(?:^|\n)[ \t]*(?:after|afterEach)\s*\(/g, (m) => add('CY010', m.index + m[0].search(/a/)))

  // CY011 絕對本機瀏覽
  each(/\bcy\s*\.\s*visit\s*\(\s*['"`]https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)/g, (m) => add('CY011', m.index))

  // CY013 與 CY101 選取器
  each(/(?:\bcy\s*\.\s*get|\.\s*find)\s*\(\s*(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g, (m) => {
    const selector = m[2]
    if (selector.startsWith('@') || selector.includes('${')) return
    if (/:nth-(?:child|of-type|last-child)\(|:eq\(|:first\b|:last\b/.test(selector)) add('CY013', m.index)
    else if (!/\[data-|\[aria-|\[role=|\[name=/.test(selector) && /(?:^|[\s>+~])[.#][\w-]+/.test(selector)) add('CY101', m.index)
  })

  // CY102 負向斷言
  each(/\.\s*should\s*\(\s*['"`]not\.(?:exist|be\.visible)['"`]\s*\)/g, (m) => add('CY102', m.index))

  return {
    typesPassword: /(?:password|passwd|pwd)[^\n]{0,80}\.\s*type\s*\(|type\s*=\s*["']?password/i.test(src),
    usesSession: /\bcy\s*\.\s*session\s*\(/.test(src),
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  const files = []
  const coffee = []
  for (const target of opts.paths) walk(target, files, coffee)
  const unique = [...new Set(files)].sort()

  const firstPath = opts.paths[0]
  const startDir = fs.statSync(firstPath).isDirectory() ? firstPath : path.dirname(firstPath)
  const detected = detectCypress(startDir)
  const major = opts.major ?? detected.major

  const findings = []
  const passwordFiles = []
  let sessionUsed = false
  for (const file of unique) {
    const facts = scanFile(file, opts, major, findings)
    if (facts.typesPassword) passwordFiles.push(rel(file))
    if (facts.usesSession) sessionUsed = true
  }

  const wants = (rule) => !opts.rules || opts.rules.has(rule)
  if (wants('CY012') && !sessionUsed && passwordFiles.length >= 2) {
    findings.push({
      rule: 'CY012', name: RULES.CY012[0], level: RULES.CY012[1], file: passwordFiles[0], line: 1,
      message: `${RULES.CY012[2]} 檔案: ${passwordFiles.slice(0, 8).join(', ')}${passwordFiles.length > 8 ? ', ...' : ''}`,
      snippet: '',
    })
  }
  if (wants('CY007')) {
    for (const file of coffee) {
      findings.push({
        rule: 'CY007', name: RULES.CY007[0], level: major !== null && major >= 16 ? 'error' : 'warn',
        file: rel(file), line: 1,
        message: '內建的 CoffeeScript 支援已在 16.0 移除。請將檔案轉換為 JavaScript 或 TypeScript。', snippet: '',
      })
    }
  }

  findings.sort((a, b) => a.rule.localeCompare(b.rule) || a.file.localeCompare(b.file) || a.line - b.line)
  const summary = {}
  for (const f of findings) summary[f.rule] = (summary[f.rule] ?? 0) + 1

  if (opts.json) {
    process.stdout.write(`${JSON.stringify({
      cypress: { range: detected.range, major, source: detected.source },
      filesScanned: unique.length,
      strict: opts.strict,
      summary,
      findings,
    }, null, 2)}\n`)
  } else {
    const lines = ['Cypress 反模式掃描', '']
    lines.push(major === null
      ? 'Cypress 版本: 未偵測到 (傳遞 --cypress-major <n> 以評定已移除的 API)'
      : `Cypress 版本: 主版本 ${major}${detected.range && opts.major === undefined ? ` (範圍 ${detected.range} 於 ${detected.source})` : ' (來自 --cypress-major)'}`)
    lines.push(`已掃描檔案數:   ${unique.length}`)
    lines.push(`發現項目數:     ${findings.length}`, '')
    if (unique.length === 0) lines.push('未找到 Cypress 檔案。請傳遞包含 cypress/ 或 *.cy.* 檔案的資料夾。')
    for (const rule of Object.keys(summary)) {
      const group = findings.filter((f) => f.rule === rule)
      lines.push(`${rule} ${RULES[rule][0]}  (${group.length})`)
      lines.push(`  ${RULES[rule][2]}`)
      const shown = opts.maxPerRule === 0 ? group : group.slice(0, opts.maxPerRule)
      for (const f of shown) {
        lines.push(`  [${f.level}] ${f.file}:${f.line}  ${f.snippet}`)
        if (f.message !== RULES[rule][2]) lines.push(`         ${f.message}`)
      }
      if (shown.length < group.length) lines.push(`  ... 還有 ${group.length - shown.length} 項 (使用 --max-per-rule 0 或 --json)`)
      lines.push('')
    }
    if (!opts.strict && findings.length > 0) lines.push('加上 --strict 執行以納入低信賴度規則 (CY1xx)。')
    process.stdout.write(`${lines.join('\n')}\n`)
  }

  if (opts.failOn !== 'never') {
    const threshold = LEVELS[opts.failOn]
    if (findings.some((f) => LEVELS[f.level] >= threshold)) process.exit(1)
  }
}

main()
