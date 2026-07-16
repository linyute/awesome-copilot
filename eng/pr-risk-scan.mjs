#!/usr/bin/env node

import fs from "fs";
import path from "path";

const SCRIPT_EXTENSIONS = new Set([
  ".sh",
  ".bash",
  ".ps1",
  ".py",
  ".js",
  ".mjs",
  ".ts",
]);

function isLikelyAbsolutePath(value) {
  if (!value) {
    return false;
  }

  // POSIX 絕對路徑 (/foo), UNC (//server/share), Windows 磁碟路徑 (C:/foo)。
  return (
    value.startsWith("/") ||
    value.startsWith("//") ||
    /^[A-Za-z]:\//.test(value)
  );
}

function isPathWithinRoot(rootPath, targetPath) {
  const relative = path.relative(rootPath, targetPath);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function hasUnpinnedVersionIndicator(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return false;
  }

  // 浮動版本有風險的指令上下文。
  if (
    /\b(npm|pnpm|yarn|bun|npx|uvx|pip|pipx)\b[^\n]*(?:@latest\b|\blatest\b)/i.test(
      trimmed
    )
  ) {
    return true;
  }

  // 具有浮動範圍的 package.json/yaml 樣式依賴項目。
  if (
    /["'][^"']+["']\s*:\s*["'](\^|~|\*|latest\b)[^"']*["']/i.test(trimmed)
  ) {
    return true;
  }

  // 僅包含寬鬆下界規範的 Python 套件安裝指令。
  if (
    /\b(?:pip|pip3|uv|uvx|poetry|pdm)\s+install\b[^\n#]*\b[a-z0-9][a-z0-9_.-]*(?:\[[A-Za-z0-9_,.-]+\])?\s*(>=|>|~=)\s*\d+(?:\.\d+){0,2}\b(?!\s*,\s*<)/i.test(
      trimmed
    )
  ) {
    return true;
  }

  // 僅包含相依性規範的 requirements/constraints 樣式條目。
  if (
    /^\s*(?:-\s*)?(?:["'])?[a-z0-9][a-z0-9_.-]*(?:\[[A-Za-z0-9_,.-]+\])?(?:["'])?\s*(>=|>|~=)\s*\d+(?:\.\d+){0,2}\b(?!\s*,\s*<)(?:\s*(?:#.*)?)?$/.test(
      trimmed
    )
  ) {
    return true;
  }

  return false;
}

const severityLevels = {
  high: "high",
  medium: "medium",
  info: "info",
};

const LINE_RULES = [
  {
    rule_id: "guardrail-bypass-language",
    severity: severityLevels.high,
    regex:
      /\b(ignore (all|any|previous) (guardrails?|rules?|instructions?)|bypass (the )?(guardrails?|safety|policy)|disable (safety|guardrails?)|do not ask (for )?(confirmation|consent)|without prompting (the )?user)\b/i,
    reason: "用語暗示繞過政策或確認控制。",
    suggested_fix:
      "對於有風險的操作，要求明確遵守政策並執行使用者確認步驟。",
  },
  {
    rule_id: "remote-shell-execution",
    severity: severityLevels.high,
    regex: /\b(curl|wget)\b[^\n|]*\|\s*(sh|bash|zsh|pwsh|powershell)\b/i,
    reason: "將遠端內容直接透過管道傳送到 Shell 具有高風險。",
    suggested_fix:
      "下載、驗證完整性/簽章，然後從經過審查的本地文件執行。",
  },
  {
    rule_id: "autoyes-package-exec",
    severity: severityLevels.high,
    regex:
      /\b(npx|npm\s+exec|pnpm\s+dlx|uvx|pipx\s+run)\b[^\n]*\s(-y|--yes)\b/i,
    reason:
      "自動確認 (Auto-yes) 執行可能會繞過對套件/執行階段提示的人工審核。",
    suggested_fix:
      "移除自動同意旗標，並要求由審核者核准的明確調用方式。",
  },
  {
    rule_id: "package-exec-command",
    severity: severityLevels.medium,
    regex: /\b(npx|npm\s+exec|pnpm\s+dlx|uvx|pipx\s+run|uv\s+tool\s+run)\b/i,
    reason: "動態套件/執行階段執行會引入供應鏈風險。",
    suggested_fix:
      "鎖定 (Pin) 精確版本並記錄人工確認控制措施。",
  },
  {
    rule_id: "unpinned-version-indicator",
    severity: severityLevels.medium,
    reason: "未鎖定的依賴項可能會在兩次執行之間改變行為。",
    suggested_fix: "使用精確的不可變版本或 Commit Hash。",
    matcher: (line) => hasUnpinnedVersionIndicator(line),
  },
];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) {
      continue;
    }

    args[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

function ensureParentDir(filePath) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
}

function normalizeRelativePath(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "");
  if (!cleaned) {
    return "";
  }

  if (/(^|\/)\.\.(\/|$)/.test(cleaned)) {
    throw new Error(`變更文件清單中存在不安全的相對路徑: ${value}`);
  }

  if (isLikelyAbsolutePath(cleaned)) {
    throw new Error(`變更文件清單中不允許使用絕對路徑: ${value}`);
  }

  return cleaned;
}

function isPotentialText(contentBuffer) {
  const nullByte = contentBuffer.includes(0x00);
  return !nullByte;
}

function addFinding(findings, finding) {
  findings.push({
    rule_id: finding.rule_id,
    severity: finding.severity,
    file: finding.file,
    line: finding.line,
    match: finding.match.slice(0, 180),
    reason: finding.reason,
    suggested_fix: finding.suggested_fix,
  });
}

function scanLineRules(filePath, content, findings) {
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const rule of LINE_RULES) {
      if (typeof rule.shouldApply === "function" && !rule.shouldApply(line)) {
        continue;
      }

      const matchedByRegex = rule.regex ? rule.regex.test(line) : false;
      const matchedByFunction =
        typeof rule.matcher === "function" ? rule.matcher(line) : false;
      if (!matchedByRegex && !matchedByFunction) {
        continue;
      }

      addFinding(findings, {
        rule_id: rule.rule_id,
        severity: rule.severity,
        file: filePath,
        line: index + 1,
        match: line.trim(),
        reason: rule.reason,
        suggested_fix: rule.suggested_fix,
      });
    }
  }
}

function scanSkillScriptPath(filePath, findings) {
  const normalized = filePath.replace(/\\/g, "/");
  const isSkillScript =
    normalized.startsWith("skills/") ||
    /^plugins\/[^/]+\/skills\//.test(normalized);
  if (!isSkillScript) {
    return;
  }

  const extension = path.extname(normalized).toLowerCase();
  if (!SCRIPT_EXTENSIONS.has(extension)) {
    return;
  }

  addFinding(findings, {
    rule_id: "skill-script-touched",
    severity: severityLevels.info,
    file: normalized,
    line: 1,
    match: normalized,
    reason:
      "技能 (skill) 下的腳本資產可能需要外部執行階段/依賴項。",
    suggested_fix:
      "記錄依賴項、鎖定版本，並避免隱式的網路安裝。",
  });
}

function severityCounts(findings) {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      return acc;
    },
    { high: 0, medium: 0, info: 0 }
  );
}

function toMarkdownReport(findings, scannedFiles, skippedFiles) {
  const marker = "<!-- pr-risk-scan-results -->";
  const counts = severityCounts(findings);
  const summary = [
    marker,
    "## 🔒 PR 風險掃描結果",
    "",
    `已掃描 **${scannedFiles.length}** 個變更的文件。`,
    "",
    "| 嚴重程度 | 數量 |",
    "|---|---:|",
    `| 🔴 高 | ${counts.high} |`,
    `| 🟠 中 | ${counts.medium} |`,
    `| ℹ️ 資訊 | ${counts.info} |`,
    "",
  ];

  if (findings.length === 0) {
    summary.push(
      "✅ 在變更的文件中未偵測到相符的風險模式。"
    );
  } else {
    summary.push("| 嚴重程度 | 規則 | 文件 | 行號 | 匹配內容 |");
    summary.push("|---|---|---|---:|---|");
    for (const finding of findings.slice(0, 100)) {
      const severity =
        finding.severity === severityLevels.high
          ? "🔴"
          : finding.severity === severityLevels.medium
          ? "🟠"
          : "ℹ️";
      const matchText = finding.match
        .replace(/\\/g, "\\\\")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\|/g, "\\|")
        .replace(/@/g, "@\u200b");
      const backtickRuns = matchText.match(/`+/g);
      const fenceLength = backtickRuns
        ? Math.max(...backtickRuns.map((run) => run.length)) + 1
        : 1;
      const fence = "`".repeat(fenceLength);
      const match = `${fence}${matchText}${fence}`;
      summary.push(
        `| ${severity} | \`${finding.rule_id}\` | \`${finding.file}\` | ${finding.line} | ${match} |`
      );
    }

    if (findings.length > 100) {
      summary.push(
        "",
        `_表格中省略了 ${findings.length - 100} 個額外的發現。_`
      );
    }
  }

  if (skippedFiles.length > 0) {
    summary.push(
      "",
      "<details>",
      "<summary>跳過的非文字或遺失文件</summary>",
      ""
    );
    summary.push(skippedFiles.map((filePath) => `- ${filePath}`).join("\n"));
    summary.push("", "</details>");
  }

  summary.push(
    "",
    "> 這是自動化的軟閘門報告。發現的項目代表審核重點，本身不會阻礙合併。"
  );

  return `${summary.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.files || !args["output-json"] || !args["output-md"]) {
    throw new Error(
      "用法: node ./eng/pr-risk-scan.mjs --files <changed-files.txt> --output-json <results.json> --output-md <report.md>"
    );
  }

  const changedFilesPath = path.resolve(args.files);
  const outputJsonPath = path.resolve(args["output-json"]);
  const outputMarkdownPath = path.resolve(args["output-md"]);
  const repoRootPath = process.cwd();

  const changedFiles = fs
    .readFileSync(changedFilesPath, "utf8")
    .split(/\r?\n/)
    .map(normalizeRelativePath)
    .filter(Boolean);

  const findings = [];
  const scannedFiles = [];
  const skippedFiles = [];

  for (const relativePath of changedFiles) {
    const absolutePath = path.resolve(repoRootPath, relativePath);
    if (!isPathWithinRoot(repoRootPath, absolutePath)) {
      throw new Error(`路徑逃脫了儲存庫根目錄: ${relativePath}`);
    }

    scanSkillScriptPath(relativePath, findings);

    if (!fs.existsSync(absolutePath)) {
      skippedFiles.push(relativePath);
      continue;
    }

    const stat = fs.lstatSync(absolutePath);
    if (stat.isSymbolicLink()) {
      skippedFiles.push(`${relativePath} (跳過: 符號連結)`);
      continue;
    }
    if (!stat.isFile()) {
      skippedFiles.push(relativePath);
      continue;
    }

    if (stat.size > 1024 * 1024) {
      skippedFiles.push(`${relativePath} (跳過: 文件太大)`);
      continue;
    }

    const contentBuffer = fs.readFileSync(absolutePath);
    if (!isPotentialText(contentBuffer)) {
      skippedFiles.push(relativePath);
      continue;
    }

    const content = contentBuffer.toString("utf8");
    scanLineRules(relativePath, content, findings);
    scannedFiles.push(relativePath);
  }

  const results = {
    generated_at: new Date().toISOString(),
    scanned_files: scannedFiles,
    skipped_files: skippedFiles,
    finding_count: findings.length,
    severity_counts: severityCounts(findings),
    findings,
  };

  ensureParentDir(outputJsonPath);
  ensureParentDir(outputMarkdownPath);
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(results, null, 2)}\n`);
  fs.writeFileSync(
    outputMarkdownPath,
    toMarkdownReport(findings, scannedFiles, skippedFiles)
  );
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
