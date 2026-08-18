import assert from "node:assert/strict";
import { test } from "node:test";
import { inlineCode } from "./markdown.mjs";

test("inlineCode 將純數值包裝在單一反引號程式碼跨距中", () => {
  assert.equal(inlineCode("plain value"), "`plain value`");
});

test("inlineCode 使用長於最長反引號序列的保護圍欄", () => {
  assert.equal(inlineCode("a `` b"), "```a `` b```");
});

test("inlineCode 為以反引號開頭或結尾的數值加入填補空格", () => {
  assert.equal(inlineCode("`leading"), "`` `leading ``");
  assert.equal(inlineCode("trailing`"), "`` trailing` ``");
});

test("inlineCode 折疊空白字元並為空數值加入填補空格", () => {
  assert.equal(inlineCode("a\n\t b"), "`a b`");
  assert.equal(inlineCode(" \n\t "), "`  `");
});

test("inlineCode 將數值截斷至 80 個字元", () => {
  assert.equal(inlineCode("x".repeat(81)), `\`${"x".repeat(77)}...\``);
});
