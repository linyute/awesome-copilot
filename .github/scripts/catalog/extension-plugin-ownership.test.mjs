import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildExtensionPluginOwners,
  resolveExtensionPluginName,
} from "./extension-plugin-ownership.mjs";

const namespace = "com.github.awesome-copilot";

test("解析僅由其父外掛程式隨附的擴充功能", () => {
  const owners = buildExtensionPluginOwners([
    {
      directoryName: "ember",
      manifest: {
        name: "ember",
        extensions: {
          [namespace]: {
            extensions: ["./extensions/daily-focus-board"],
          },
        },
      },
    },
  ]);

  assert.equal(
    resolveExtensionPluginName("daily-focus-board", owners),
    "ember"
  );
});

test("偏好同名的獨立外掛程式而非其他擁有者", () => {
  const owners = buildExtensionPluginOwners([
    {
      directoryName: "parent-plugin",
      manifest: {
        name: "parent-plugin",
        extensions: {
          [namespace]: {
            extensions: ["./extensions/daily-focus-board/"],
          },
        },
      },
    },
    {
      directoryName: "daily-focus-board",
      manifest: { name: "daily-focus-board" },
    },
  ]);

  assert.equal(
    resolveExtensionPluginName("daily-focus-board", owners),
    "daily-focus-board"
  );
});

test("當沒有外掛程式擁有它時保留擴充功能名稱", () => {
  assert.equal(
    resolveExtensionPluginName("daily-focus-board", new Map()),
    "daily-focus-board"
  );
});
