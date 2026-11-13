#!/usr/bin/env node

/**
 * 從 git 紀錄中提取最後修改日期的工具。
 * 為了效率使用單個 git log 指令。
 */

import { execSync } from "child_process";
import path from "path";

/**
 * 取得指定目錄中所有已追蹤檔案的最後修改日期。
 * 傳回一個 Map，鍵為檔案路徑 -> 值為 ISO 日期字串。
 *
 * @param {string[]} directories - 要掃描的目錄路徑陣列
 * @param {string} rootDir - 相對路徑的根目錄
 * @returns {Map<string, string>} 相對檔案路徑到 ISO 日期字串的 Map
 */
export function getGitFileDates(directories, rootDir) {
  const fileDates = new Map();

  try {
    // 取得指定目錄中包含檔案名稱的 git log
    // 格式：ISO 日期，然後是在該提交中修改的檔案名稱
    const gitArgs = [
      "--no-pager",
      "log",
      "--format=%aI", // ISO 8601 格式的作者日期
      "--name-only",
      "--diff-filter=ACMR", // 新增、複製、修改、重新命名
      "--",
      ...directories,
    ];

    const output = execSync(`git ${gitArgs.join(" ")}`, {
      encoding: "utf8",
      cwd: rootDir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // 解析輸出：交替的日期行和檔案名稱行
    // 格式為：
    // 2026-01-15T10:30:00+00:00
    //
    // file1.md
    // file2.md
    //
    // 2026-01-14T09:00:00+00:00
    // ...

    let currentDate = null;
    const lines = output.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      // 檢查這是否為日期行 (ISO 8601 格式)
      if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
        currentDate = trimmed;
      } else if (currentDate && trimmed) {
        // 這是檔案路徑 - 僅在尚未看過此檔案時設定
        // (第一次出現即為最近的修改)
        if (!fileDates.has(trimmed)) {
          fileDates.set(trimmed, currentDate);
        }
      }
    }
  } catch (error) {
    // Git 指令執行失敗 - 可能不是 git 儲存庫或沒有紀錄
    console.warn("警告：無法取得 git 日期：", error.message);
  }

  return fileDates;
}

/**
 * 取得單個檔案的最後修改日期。
 *
 * @param {string} filePath - 檔案路徑 (相對於 git 根目錄)
 * @param {string} rootDir - 根目錄
 * @returns {string|null} ISO 日期字串，若未找到則為 null
 */
export function getGitFileDate(filePath, rootDir) {
  try {
    const output = execSync(
      `git --no-pager log -1 --format="%aI" -- "${filePath}"`,
      {
        encoding: "utf8",
        cwd: rootDir,
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    const date = output.trim();
    return date || null;
  } catch (error) {
    return null;
  }
}
