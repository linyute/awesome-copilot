import assert from "node:assert/strict";
import { test } from "node:test";
import { isReusableExtensionRegistered } from "./validate-plugins.mjs";

test("接受僅由父外掛程式隨附的可重複使用擴充功能", () => {
  assert.equal(
    isReusableExtensionRegistered(
      "daily-focus-board",
      new Set(["ember"]),
      new Set(["daily-focus-board"])
    ),
    true
  );
});

test("接受同名的獨立擴充功能外掛程式", () => {
  assert.equal(
    isReusableExtensionRegistered(
      "daily-focus-board",
      new Set(["daily-focus-board"]),
      new Set()
    ),
    true
  );
});

test("拒絕孤立的可重複使用擴充功能", () => {
  assert.equal(
    isReusableExtensionRegistered(
      "daily-focus-board",
      new Set(["ember"]),
      new Set()
    ),
    false
  );
});
