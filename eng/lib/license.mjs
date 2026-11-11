// 外部外掛程式目錄驗證器 (eng/external-plugin-validation.mjs) 與
// 本地 plugin.json 驗證器 (eng/validate-plugins.mjs) 共用的授權條款驗證。
// 保留在這裡可避免兩者互相匯入，並為授權條款規則提供單一專屬位置。
//
// agent-plugins-spec 結構描述 (https://github.com/agentplugins/agent-plugins-spec)
// 並未強制要求 SPDX，且外掛程式依法可使用專有或非開放原始碼授權條款。
// 因此非 SPDX 授權條款僅為警告，絕非錯誤。

import { inlineCode } from "./markdown.mjs";

// 單一 SPDX 授權條款識別碼權杖（例如 "MIT"、"Apache-2.0"、"LicenseRef-Foo"）。
const SPDX_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.-]*\+?$/;
const SPDX_IDSTRING_PATTERN = /^[A-Za-z0-9.-]+$/;

// 精選的常見 SPDX 授權條款識別碼集合。非詳盡無遺：無法識別
// 但格式正確的識別碼會產生警告而非錯誤。
const KNOWN_SPDX_IDS = new Set([
  "0BSD",
  "AGPL-3.0",
  "AGPL-3.0-only",
  "AGPL-3.0-or-later",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "BSL-1.0",
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "CC0-1.0",
  "EPL-2.0",
  "GPL-2.0",
  "GPL-2.0-only",
  "GPL-2.0-or-later",
  "GPL-3.0",
  "GPL-3.0-only",
  "GPL-3.0-or-later",
  "ISC",
  "LGPL-2.1",
  "LGPL-2.1-only",
  "LGPL-2.1-or-later",
  "LGPL-3.0",
  "LGPL-3.0-only",
  "LGPL-3.0-or-later",
  "MIT",
  "MPL-2.0",
  "Unlicense",
  "WTFPL",
  "Zlib",
]);

const KNOWN_SPDX_EXCEPTIONS = new Set([
  "Classpath-exception-2.0",
  "GCC-exception-3.1",
  "LLVM-exception",
  "Autoconf-exception-3.0",
  "Bison-exception-2.2",
  "Font-exception-2.0",
  "GPL-3.0-linking-exception",
  "Linux-syscall-note",
  "OpenSSL-exception",
  "Qt-GPL-exception-1.0",
]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isSpdxIdString(value) {
  return SPDX_IDSTRING_PATTERN.test(value);
}

function isRecognizedLicenseRef(token) {
  if (token.startsWith("LicenseRef-")) {
    return isSpdxIdString(token.slice("LicenseRef-".length));
  }

  if (!token.startsWith("DocumentRef-")) {
    return false;
  }

  const separatorIndex = token.indexOf(":LicenseRef-");
  if (separatorIndex === -1) {
    return false;
  }

  const documentRef = token.slice("DocumentRef-".length, separatorIndex);
  const licenseRef = token.slice(separatorIndex + ":LicenseRef-".length);
  return isSpdxIdString(documentRef) && isSpdxIdString(licenseRef);
}

function isRecognizedSpdxIdToken(token) {
  if (isRecognizedLicenseRef(token)) {
    return true;
  }

  if (!SPDX_ID_PATTERN.test(token)) {
    return false;
  }

  const normalized = token.endsWith("+") ? token.slice(0, -1) : token;
  return KNOWN_SPDX_IDS.has(normalized);
}

function isRecognizedSpdxExceptionToken(token) {
  return isSpdxIdString(token) && KNOWN_SPDX_EXCEPTIONS.has(token);
}

function tokenizeSpdxExpression(license) {
  return license
    .replace(/([()])/g, " $1 ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

// 僅在由已識別識別碼並透過 SPDX 運算子聯結（可選加括號）所組成的
// 格式正確 SPDX 授權條款運算式時傳回 true。
// 其他任何內容（專有字串、自由文字、無法識別的識別碼）均傳回 false，
// 以便呼叫端發出警告而不拒絕——外掛程式規格並未強制要求 SPDX。
export function isRecognizedSpdxExpression(license) {
  if (typeof license !== "string") {
    return false;
  }

  const tokens = tokenizeSpdxExpression(license);

  if (tokens.length === 0) {
    return false;
  }

  let position = 0;

  function peek() {
    return tokens[position];
  }

  function consume() {
    return tokens[position++];
  }

  function parsePrimary() {
    const token = peek();

    if (token === "(") {
      consume();
      if (!parseOrExpression()) {
        return false;
      }
      if (peek() !== ")") {
        return false;
      }
      consume();
      return true;
    }

    if (!token || token === ")" || ["AND", "OR", "WITH"].includes(token.toUpperCase())) {
      return false;
    }

    consume();
    return isRecognizedSpdxIdToken(token);
  }

  function parseSimpleExpression() {
    const token = peek();
    if (!token || token === ")" || ["AND", "OR", "WITH"].includes(token.toUpperCase())) {
      return false;
    }

    consume();
    return isRecognizedSpdxIdToken(token);
  }

  function parseWithExpression() {
    if (peek() === "(") {
      return parsePrimary() && peek()?.toUpperCase() !== "WITH";
    }

    if (!parseSimpleExpression()) {
      return false;
    }

    if (peek()?.toUpperCase() !== "WITH") {
      return true;
    }

    consume();
    const exceptionToken = peek();
    if (!exceptionToken || exceptionToken === ")" || ["AND", "OR", "WITH"].includes(exceptionToken.toUpperCase())) {
      return false;
    }
    consume();
    return isRecognizedSpdxExceptionToken(exceptionToken);
  }

  function parseAndExpression() {
    if (!parseWithExpression()) {
      return false;
    }

    while (peek()?.toUpperCase() === "AND") {
      consume();
      if (!parseWithExpression()) {
        return false;
      }
    }

    return true;
  }

  function parseOrExpression() {
    if (!parseAndExpression()) {
      return false;
    }

    while (peek()?.toUpperCase() === "OR") {
      consume();
      if (!parseAndExpression()) {
        return false;
      }
    }

    return true;
  }

  return parseOrExpression() && position === tokens.length;
}

// 標準授權條款驗證。非 SPDX 授權條款為警告（絕非錯誤），
// 因此作者可以使用專有或非開放原始碼授權條款。傳回收集到的
// 錯誤／警告，以便每個呼叫端能將其整合至自己的報告中。
//
// 選項：
//   required — 為 true 時，缺少授權條款即為錯誤（預設為 false）。
//   prefix   — 可選的訊息前綴（例如 "external.json[3]"）以提供上下文。
export function validateLicenseField(license, options = {}) {
  const { required = false } = options;
  const prefix = options.prefix ? `${options.prefix}: ` : "";
  const errors = [];
  const warnings = [];

  if (license === undefined) {
    if (required) {
      errors.push(`${prefix}"license" is required`);
    }
    return { errors, warnings };
  }

  if (!isNonEmptyString(license)) {
    errors.push(`${prefix}"license" must be a non-empty string`);
    return { errors, warnings };
  }

  if (!isRecognizedSpdxExpression(license)) {
    warnings.push(
      `${prefix}"license" value ${inlineCode(license)} is not a recognized SPDX identifier; prefer a standard SPDX id (https://spdx.org/licenses), though non-SPDX or proprietary licenses are allowed`
    );
  }

  return { errors, warnings };
}
