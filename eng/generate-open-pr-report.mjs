#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT_FOLDER } from "./constants.mjs";
import { setupGracefulShutdown } from "./utils/graceful-shutdown.mjs";

const DEFAULT_REPO = "github/awesome-copilot";
const DEFAULT_LIMIT = 500;
const DEFAULT_CMD_TIMEOUT = 30_000;

const REPORT_DEFINITIONS = [
  {
    heading: "目標為 `main` 的 PR",
    fileName: "prs-targeting-main.json",
    predicate: (pr) => pr.targetBranch === "main"
  },
  {
    heading: "目標為 `staged` 且通過所有檢查且檔案少於 10 個的 PR",
    fileName: "prs-staged-passing-under-10-files.json",
    predicate: (pr) => pr.targetBranch === "staged" && pr.checksPass && pr.fileCount < 10
  },
  {
    heading: "目標為 `staged` 且檔案數量介於 10 到 50 之間的 PR",
    fileName: "prs-staged-10-to-50-files.json",
    predicate: (pr) => pr.targetBranch === "staged" && pr.fileCount >= 10 && pr.fileCount <= 50
  },
  {
    heading: "目標為 `staged` 且檔案數量超過 50 個的 PR",
    fileName: "prs-staged-over-50-files.json",
    predicate: (pr) => pr.targetBranch === "staged" && pr.fileCount > 50
  }
];

setupGracefulShutdown("generate-open-pr-report");

function printUsage() {
  console.log(`用法: node eng/generate-open-pr-report.mjs [--repo 擁有者/名稱] [--output-dir 路徑] [--limit N]

為 GitHub 存放庫產生開放 PR 報告。

輸出內容:
  - open-pr-report.md
  - prs-targeting-main.json
  - prs-staged-passing-under-10-files.json
  - prs-staged-10-to-50-files.json
  - prs-staged-over-50-files.json

選項:
  --repo        GitHub 存放庫，格式為 擁有者/名稱 (預設值: ${DEFAULT_REPO})
  --output-dir  產生報告的目錄 (預設值: <存放庫根目錄>/reports)
  --limit       要擷取的開放 PR 最大數量 (預設值: ${DEFAULT_LIMIT})
  --help, -h    顯示此說明文字`);
}

function parseArgs(argv) {
  const options = {
    repo: DEFAULT_REPO,
    outputDir: path.join(ROOT_FOLDER, "reports"),
    limit: DEFAULT_LIMIT
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    if (arg === "--repo") {
      options.repo = argv[i + 1] ?? "";
      i += 1;
      continue;
    }

    if (arg === "--output-dir") {
      options.outputDir = argv[i + 1] ?? "";
      i += 1;
      continue;
    }

    if (arg === "--limit") {
      options.limit = Number.parseInt(argv[i + 1] ?? "", 10);
      i += 1;
      continue;
    }

    throw new Error(`未知選項: ${arg}`);
  }

  if (!options.repo || !options.repo.includes("/")) {
    throw new Error("--repo 必須採用 擁有者/名稱 格式。");
  }

  if (!Number.isInteger(options.limit) || options.limit < 1) {
    throw new Error("--limit 必須是正整數。");
  }

  if (!options.outputDir) {
    throw new Error("--output-dir 是必填項。");
  }

  return options;
}

function ensureCommandAvailable(command) {
  try {
    execFileSync(command, ["--version"], {
      stdio: "ignore",
      timeout: DEFAULT_CMD_TIMEOUT
    });
  } catch (error) {
    throw new Error(`遺失必要的指令: ${command}`);
  }
}

function runGhJson(args) {
  const output = execFileSync("gh", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: DEFAULT_CMD_TIMEOUT
  });

  return JSON.parse(output);
}

function getCheckState(statusCheckRollup) {
  if (!Array.isArray(statusCheckRollup) || statusCheckRollup.length === 0) {
    return "NONE";
  }

  if (statusCheckRollup.some((check) => check.status !== "COMPLETED")) {
    return "PENDING";
  }

  const failureConclusions = new Set([
    "FAILURE",
    "TIMED_OUT",
    "ACTION_REQUIRED",
    "CANCELLED",
    "STALE",
    "STARTUP_FAILURE"
  ]);

  if (statusCheckRollup.some((check) => failureConclusions.has(check.conclusion ?? ""))) {
    return "FAILURE";
  }

  const successConclusions = new Set(["SUCCESS", "NEUTRAL", "SKIPPED"]);
  const allSuccessful = statusCheckRollup.every((check) => successConclusions.has(check.conclusion ?? ""));
  return allSuccessful ? "SUCCESS" : "FAILURE";
}

function normalizePullRequest(pr) {
  const checkState = getCheckState(pr.statusCheckRollup);

  return {
    id: pr.number,
    title: pr.title,
    author: pr.author?.login ?? "ghost",
    checksPass: checkState === "SUCCESS",
    checkState,
    targetBranch: pr.baseRefName,
    fileCount: pr.changedFiles,
    createdAt: pr.createdAt,
    updatedAt: pr.updatedAt,
    createdAgeDays: getAgeInDays(pr.createdAt),
    updatedAgeDays: getAgeInDays(pr.updatedAt),
    url: pr.url
  };
}

function getCheckLabel(pr) {
  if (pr.checkState === "SUCCESS") {
    return "是";
  }

  if (pr.checkState === "PENDING") {
    return "待處理";
  }

  if (pr.checkState === "NONE") {
    return "無檢查";
  }

  return "否";
}

function escapeMarkdownCell(value) {
  return String(value).replaceAll("|", "\\|");
}

function getAgeInDays(timestamp) {
  const milliseconds = Date.now() - new Date(timestamp).getTime();
  return Math.max(0, Math.floor(milliseconds / (24 * 60 * 60 * 1000)));
}

function formatTimestampWithAge(timestamp) {
  return `${timestamp.slice(0, 10)} (${getAgeInDays(timestamp)} 天前)`;
}

function renderTable(prs) {
  const lines = [
    "| PR 標題 + ID | 作者 | 檢查是否通過 | 建立時間 | 更新時間 | PR 連結 |",
    "| --- | --- | --- | --- | --- | --- |"
  ];

  if (prs.length === 0) {
    lines.push("| 無 | - | - | - | - | - |");
    return lines.join("\n");
  }

  for (const pr of prs) {
    lines.push(
      `| ${escapeMarkdownCell(pr.title)} (#${pr.id}) | ${escapeMarkdownCell(pr.author)} | ${getCheckLabel(pr)} | ${formatTimestampWithAge(pr.createdAt)} | ${formatTimestampWithAge(pr.updatedAt)} | [連結](${pr.url}) |`
    );
  }

  return lines.join("\n");
}

function renderMarkdownReport(repo, generatedAt, categorizedReports) {
  const sections = [
    "# 開放 PR 報告",
    "",
    `**存放庫:** \`${repo}\`  `,
    `**產生時間:** \`${generatedAt}\``
  ];

  for (const report of categorizedReports) {
    sections.push("", `## ${report.heading}`, "", renderTable(report.items));
  }

  return `${sections.join("\n")}\n`;
}

function writeJsonReport(filePath, items) {
  fs.writeFileSync(filePath, `${JSON.stringify(items, null, 2)}\n`);
}

function generateOpenPrReport() {
  const options = parseArgs(process.argv.slice(2));

  ensureCommandAvailable("gh");

  console.log(`正在從 ${options.repo} 擷取開放 PR...`);

  const pullRequests = runGhJson([
    "pr",
    "list",
    "--repo",
    options.repo,
    "--state",
    "open",
    "--limit",
    String(options.limit),
    "--json",
    "number,title,url,author,baseRefName,changedFiles,createdAt,updatedAt,statusCheckRollup"
  ]);

  const normalizedPullRequests = pullRequests.map(normalizePullRequest);
  const categorizedReports = REPORT_DEFINITIONS.map((report) => ({
    ...report,
    items: normalizedPullRequests.filter(report.predicate)
  }));

  fs.mkdirSync(options.outputDir, { recursive: true });

  for (const report of categorizedReports) {
    writeJsonReport(path.join(options.outputDir, report.fileName), report.items);
  }

  const markdownReport = renderMarkdownReport(
    options.repo,
    new Date().toISOString(),
    categorizedReports
  );

  const markdownFilePath = path.join(options.outputDir, "open-pr-report.md");
  fs.writeFileSync(markdownFilePath, markdownReport);

  console.log(`已在 ${options.outputDir} 產生報告:`);
  console.log("  open-pr-report.md");
  for (const report of categorizedReports) {
    console.log(`  ${report.fileName}`);
  }
}

generateOpenPrReport();
