import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const statuses = new Set(['verified', 'partial', 'blocked'])
const evidenceSources = new Set(['executed-now', 'supplied', 'mixed'])
const baselineResults = new Set(['failed', 'observed', 'not-run'])
const verificationResults = new Set(['passed', 'failed', 'not-run'])

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0

export const sampleReceipt = {
  version: 2,
  status: 'verified',
  evidenceSource: 'executed-now',
  problem: 'A 10% checkout discount returns 100 instead of 90 after currency rounding.',
  baseline: {
    command: 'npm test -- discount.test.ts',
    result: 'failed',
    evidence: 'Expected 90, received 100.',
  },
  rootCause: {
    summary: 'The subtotal was rounded before the percentage discount was applied.',
    evidence: [{ location: 'src/pricing.ts:42', observation: 'roundCurrency(subtotal) was passed into applyDiscount().' }],
  },
  changes: [{ file: 'src/pricing.ts', summary: 'Apply the discount to the subtotal before currency rounding.' }],
  verification: [
    { command: 'npm test -- discount.test.ts', result: 'passed', evidence: '1 test passed.' },
    { command: 'npm test', result: 'passed', evidence: '42 tests passed.' },
  ],
  gaps: [],
}

export function validateReceipt(receipt) {
  const issues = []
  const add = (path, message) => issues.push({ path, message })
  const rejectUnknown = (value, allowed, path) => {
    if (!isObject(value)) return
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) add(path ? `${path}.${key}` : key, '未知的欄位。')
    }
  }

  if (!isObject(receipt)) return { valid: false, issues: [{ path: '$', message: '收據必須是 JSON 物件。' }] }
  rejectUnknown(receipt, new Set(['version', 'status', 'evidenceSource', 'problem', 'baseline', 'rootCause', 'changes', 'verification', 'gaps']), '')

  if (receipt.version !== 1 && receipt.version !== 2) add('version', '必須等於 1 或 2。')
  if (!statuses.has(receipt.status)) add('status', '必須是 verified、partial 或 blocked。')
  if (receipt.evidenceSource !== undefined && !evidenceSources.has(receipt.evidenceSource)) add('evidenceSource', '必須是 executed-now、supplied 或 mixed。')
  if (receipt.version === 2 && !evidenceSources.has(receipt.evidenceSource)) add('evidenceSource', '版本 2 需要提供證據來源。')
  if (!nonEmpty(receipt.problem)) add('problem', '必須是非空字串。')

  if (!isObject(receipt.baseline)) {
    add('baseline', '必須是物件。')
  } else {
    rejectUnknown(receipt.baseline, new Set(['command', 'result', 'evidence']), 'baseline')
    if (!nonEmpty(receipt.baseline.command)) add('baseline.command', '必須是非空字串。')
    if (!baselineResults.has(receipt.baseline.result)) add('baseline.result', '必須是 failed、observed 或 not-run。')
    if (!nonEmpty(receipt.baseline.evidence)) add('baseline.evidence', '必須是非空字串。')
  }

  if (!isObject(receipt.rootCause)) {
    add('rootCause', '必須是物件。')
  } else {
    rejectUnknown(receipt.rootCause, new Set(['summary', 'evidence']), 'rootCause')
    if (!nonEmpty(receipt.rootCause.summary)) add('rootCause.summary', '必須是非空字串。')
    if (!Array.isArray(receipt.rootCause.evidence)) {
      add('rootCause.evidence', '必須是陣列。')
    } else {
      receipt.rootCause.evidence.forEach((entry, index) => {
        if (!isObject(entry)) return add(`rootCause.evidence[${index}]`, '必須是物件。')
        rejectUnknown(entry, new Set(['location', 'observation']), `rootCause.evidence[${index}]`)
        if (!nonEmpty(entry.location)) add(`rootCause.evidence[${index}].location`, '必須是非空字串。')
        if (!nonEmpty(entry.observation)) add(`rootCause.evidence[${index}].observation`, '必須是非空字串。')
      })
    }
  }

  if (!Array.isArray(receipt.changes)) {
    add('changes', '必須是陣列。')
  } else {
    receipt.changes.forEach((entry, index) => {
      if (!isObject(entry)) return add(`changes[${index}]`, '必須是物件。')
      rejectUnknown(entry, new Set(['file', 'summary']), `changes[${index}]`)
      if (!nonEmpty(entry.file)) add(`changes[${index}].file`, '必須是非空字串。')
      if (!nonEmpty(entry.summary)) add(`changes[${index}].summary`, '必須是非空字串。')
    })
  }

  if (!Array.isArray(receipt.verification)) {
    add('verification', '必須是陣列。')
  } else {
    receipt.verification.forEach((entry, index) => {
      if (!isObject(entry)) return add(`verification[${index}]`, '必須是物件。')
      rejectUnknown(entry, new Set(['command', 'result', 'evidence']), `verification[${index}]`)
      if (!nonEmpty(entry.command)) add(`verification[${index}].command`, '必須是非空字串。')
      if (!verificationResults.has(entry.result)) add(`verification[${index}].result`, '必須是 passed、failed 或 not-run。')
      if (!nonEmpty(entry.evidence)) add(`verification[${index}].evidence`, '必須是非空字串。')
    })
  }

  if (!Array.isArray(receipt.gaps) || receipt.gaps.some((gap) => !nonEmpty(gap))) add('gaps', '必須是非空字串的陣列。')

  if (receipt.status === 'verified') {
    if (receipt.baseline?.result === 'not-run') add('baseline.result', 'Verified 狀態需要已觀察到的基準線。')
    if (!Array.isArray(receipt.rootCause?.evidence) || receipt.rootCause.evidence.length === 0) add('rootCause.evidence', 'Verified 狀態需要具體的根本原因證據。')
    if (!Array.isArray(receipt.changes) || receipt.changes.length === 0) add('changes', 'Verified 狀態需要至少一個已變更的檔案或成品。')
    if (!Array.isArray(receipt.verification) || receipt.verification.length === 0) add('verification', 'Verified 狀態需要至少一項驗證檢查。')
    if (Array.isArray(receipt.verification) && receipt.verification.some((entry) => entry?.result !== 'passed')) add('verification', 'Verified 狀態下所有驗證檢查都必須通過。')
    if (Array.isArray(receipt.gaps) && receipt.gaps.length > 0) add('gaps', 'Verified 狀態不能包含證明缺口。')
  }

  if (receipt.status === 'partial' && Array.isArray(receipt.gaps) && receipt.gaps.length === 0) add('gaps', 'Partial 狀態必須指明至少一個缺失的證明層。')
  if (receipt.status === 'blocked' && Array.isArray(receipt.gaps) && receipt.gaps.length === 0) add('gaps', 'Blocked 狀態必須指明外部阻礙條件。')

  return { valid: issues.length === 0, issues }
}

async function main() {
  const path = process.argv[2]
  if (!path) throw new Error('用法：node scripts/validate-receipt.mjs <receipt.json> [--json]')

  let input = ''
  if (path === '-') {
    process.stdin.setEncoding('utf8')
    for await (const chunk of process.stdin) input += chunk
  } else {
    input = await readFile(resolve(path), 'utf8')
  }
  const receipt = JSON.parse(input)
  const result = validateReceipt(receipt)

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(result)}\n`)
  } else if (result.valid) {
    process.stdout.write(`✓ ${path} 是有效的 ${receipt.status.toUpperCase()} 錯誤收據。\n`)
  } else {
    process.stderr.write(`✗ ${path} 不是有效的錯誤收據：\n`)
    for (const issue of result.issues) process.stderr.write(`  ${issue.path}: ${issue.message}\n`)
  }

  process.exitCode = result.valid ? 0 : 1
}

const invokedUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (import.meta.url === invokedUrl) {
  main().catch((error) => {
    process.stderr.write(`bug-receipt: ${error.message}\n`)
    process.exitCode = 2
  })
}
