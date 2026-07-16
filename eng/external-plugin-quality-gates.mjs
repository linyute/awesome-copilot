#!/usr/bin/env node

import fs from "fs";
import os from "os";
import path from "path";
import { Writable } from "stream";
import { spawnSync } from "child_process";
import { runLint, LintConsoleReporter } from "@microsoft/vally";

const MAX_OUTPUT_LENGTH = 12000;

const INFRA_ERROR_PATTERNS = [
  /\b401\b/,
  /\b403\b/,
  /authentication (required|failed|error)/,
  /unauthenticated/,
  /unauthorized/,
  /not logged in/,
  /please (log in|authenticate|sign in)/,
  /invalid (access |auth )?token/,
  /credentials? (are )?expired/,
  /dns.*(resolve|lookup|fail)/,
  /network.*unreachable/,
  /connection (refused|reset)/,
  /\btimeout\b/,
  /enotfound/,
  /econnrefused/,
  /etimedout/,
];

function truncateOutput(value) {
  const normalized = String(value ?? "").replace(/\x1b\[[0-9;]*m/g, "").trim();
  if (normalized.length <= MAX_OUTPUT_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_OUTPUT_LENGTH)}\n...輸出已截斷...`;
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });

  return {
    exitCode: typeof result.status === "number" ? result.status : 1,
    stdout: truncateOutput(result.stdout),
    stderr: truncateOutput(result.stderr),
    output: truncateOutput(`${result.stdout ?? ""}\n${result.stderr ?? ""}`),
    error: result.error ? String(result.error.message ?? result.error) : "",
  };
}

function normalizePluginPath(pluginPath) {
  if (!pluginPath || pluginPath === "/") {
    return "";
  }

  const normalized = String(pluginPath).trim().replace(/^\/+|\/+$/g, "");
  if (!normalized) {
    return "";
  }

  if (normalized.includes("..") || normalized.includes("\\")) {
    throw new Error(`無效的 plugin 路徑 "${pluginPath}"`);
  }

  return normalized;
}

function resolveFetchSpec(pluginSource) {
  if (pluginSource.sha) {
    return pluginSource.sha;
  }

  if (!pluginSource.ref) {
    throw new Error("品質檢查需要 source.ref 或 source.sha");
  }

  const ref = String(pluginSource.ref).trim();
  if (!ref) {
    throw new Error("品質檢查需要 source.ref 或 source.sha");
  }

  if (ref.startsWith("refs/")) {
    return ref;
  }

  return ref;
}

function classifySmokeFailure(output) {
  const normalized = String(output ?? "").toLowerCase();
  if (INFRA_ERROR_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return "infra_error";
  }

  return "fail";
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cloneSubmissionRepository(workDir, plugin) {
  const repoDir = path.join(workDir, "submission");
  ensureDirectory(repoDir);

  const sourceRepo = plugin.source?.repo;
  const fetchSpec = resolveFetchSpec(plugin.source ?? {});

  const init = runCommand("git", ["init", "-q"], { cwd: repoDir });
  if (init.exitCode !== 0) {
    throw new Error(`git init 失敗: ${init.output}`);
  }

  const addRemote = runCommand("git", ["remote", "add", "origin", `https://github.com/${sourceRepo}.git`], { cwd: repoDir });
  if (addRemote.exitCode !== 0) {
    throw new Error(`git remote add 失敗: ${addRemote.output}`);
  }

  const fetch = runCommand("git", ["fetch", "--depth=1", "origin", fetchSpec], { cwd: repoDir });
  if (fetch.exitCode !== 0) {
    throw new Error(`git fetch 失敗 ${fetchSpec}: ${fetch.output}`);
  }

  const checkout = runCommand("git", ["checkout", "--detach", "FETCH_HEAD"], { cwd: repoDir });
  if (checkout.exitCode !== 0) {
    throw new Error(`git checkout 失敗: ${checkout.output}`);
  }

  return {
    repoDir,
    fetchSpec,
  };
}

// 有序的候選位置清單，用於尋找 plugin.json，從最具體到最不具體。
// Copilot CLI 與許多外部 repo 使用巢狀慣例。我們自行讀取清單，以便無論 manifest 位於何處，
// 都能一致地從 plugin 根目錄解析技能路徑。
// 注意：此處需與 external-plugin-validation.mjs 中的 EXTERNAL_PLUGIN_ROOT_MANIFEST_PATHS 保持同步
const PLUGIN_JSON_CANDIDATES = [
  [".github", "plugin", "plugin.json"],
  [".plugin", "plugin.json"],
  ["plugin.json"],
];

function toPosixPath(...segments) {
  return segments
    .filter((segment) => segment !== undefined && segment !== null && String(segment).length > 0)
    .map((segment) => String(segment).replace(/\\/g, "/"))
    .join("/");
}

function findPluginJson(pluginRoot) {
  for (const segments of PLUGIN_JSON_CANDIDATES) {
    const candidate = path.join(pluginRoot, ...segments);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function buildVallyLintArgs(pluginRoot) {
  const pluginJsonPath = findPluginJson(pluginRoot);
  if (!pluginJsonPath) {
    // 找不到已識別的 plugin.json 位置 — 對整個 plugin root 執行 lint，讓 vally 向提交者顯示真實錯誤。
    return [pluginRoot];
  }

  let pluginJson;
  try {
    pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
  } catch {
    // plugin.json 格式錯誤 — 回退至對整個 root 執行 lint。
    return [pluginRoot];
  }

  // 從 plugin.json 收集 skill 目錄路徑
  const skillPaths = [].concat(pluginJson.skills ?? [])
    .map((s) => path.resolve(pluginRoot, s))
    .filter((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());

  if (skillPaths.length > 0) {
    return skillPaths;
  }

  // 找不到可解析的 skill 目錄 — 對整個 plugin root 執行 lint 以便 vally 向提交者顯示具體驗證錯誤。
  return [pluginRoot];
}

async function runVallyLintGate(pluginRoot) {
  try {
    const targets = buildVallyLintArgs(pluginRoot);

    let combinedOutput = "";
    let anyFailure = false;

    for (const target of targets) {
      const chunks = [];
      const captureStream = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(chunk.toString());
          callback();
        },
      });

      const result = await runLint({ rootPath: target });
      const reporter = new LintConsoleReporter({ verbose: true, stream: captureStream });
      await reporter.report(result);

      combinedOutput += chunks.join("") + "\n";
      if (!result.passed) {
        anyFailure = true;
      }
    }

    return {
      status: anyFailure ? "fail" : "pass",
      output: truncateOutput(combinedOutput),
    };
  } catch (error) {
    return {
      status: "infra_error",
      output: truncateOutput(error.message),
    };
  }
}

function buildEphemeralMarketplace(workDir, plugin) {
  const marketplaceDir = path.join(workDir, "marketplace");
  ensureDirectory(marketplaceDir);

  const marketplace = {
    name: "external-plugin-intake",
    metadata: {
      description: "用於外部外掛程式攝取冒煙測試的臨時市集",
      version: "1.0.0",
      pluginRoot: ".",
    },
    owner: {
      name: "awesome-copilot-intake",
      email: "noreply@github.com",
    },
    plugins: [plugin],
  };

  fs.writeFileSync(path.join(marketplaceDir, "marketplace.json"), `${JSON.stringify(marketplace, null, 2)}\n`);
  return marketplaceDir;
}

function runInstallSmokeGate(workDir, plugin) {
  if (runCommand("bash", ["-lc", "command -v copilot"]).exitCode !== 0) {
    return {
      status: "infra_error",
      output: "此執行環境無法使用 copilot CLI。",
    };
  }

  try {
    const homeDir = path.join(workDir, "copilot-home");
    ensureDirectory(homeDir);
    const marketplaceDir = buildEphemeralMarketplace(workDir, plugin);

    const env = {
      ...process.env,
      HOME: homeDir,
      XDG_CONFIG_HOME: path.join(homeDir, ".config"),
      XDG_CACHE_HOME: path.join(homeDir, ".cache"),
      XDG_DATA_HOME: path.join(homeDir, ".local", "share"),
    };

    const marketplaceAdd = runCommand("copilot", ["plugin", "marketplace", "add", marketplaceDir], { env });
    if (marketplaceAdd.exitCode !== 0) {
      const status = classifySmokeFailure(marketplaceAdd.output);
      return { status, output: marketplaceAdd.output };
    }

    const install = runCommand("copilot", ["plugin", "install", `${plugin.name}@external-plugin-intake`], { env });
    if (install.exitCode !== 0) {
      const status = classifySmokeFailure(install.output);
      return { status, output: install.output };
    }

    const installedPluginPath = path.join(homeDir, ".copilot", "installed-plugins", "external-plugin-intake", plugin.name);
    if (!fs.existsSync(installedPluginPath)) {
      return {
        status: "fail",
        output: `已安裝插件但找不到安裝目錄：${installedPluginPath}`,
      };
    }
    const pluginManifestPath = findPluginJson(installedPluginPath);
    if (!pluginManifestPath) {
      return {
        status: "fail",
        output: `已安裝插件但在 ${installedPluginPath} 下未找到任何可識別的 plugin.json`,
      };
    }

    return {
      status: "pass",
      output: `安裝 smoke 測試成功。已驗證 ${pluginManifestPath}。`,
    };
  } catch (error) {
    return {
      status: "infra_error",
      output: truncateOutput(error.message),
    };
  }
}

function isMissingPathAtLocator(output) {
  const normalized = String(output ?? "").toLowerCase();
  return (
    normalized.includes("does not exist in") ||
    normalized.includes("exists on disk, but not in") ||
    (normalized.includes("path '") && normalized.includes("not in"))
  );
}

function fetchLocatorIntoRepo(repoDir, locator) {
  const result = runCommand("git", ["fetch", "--depth=1", "origin", locator], { cwd: repoDir });
  if (result.exitCode === 0) {
    return {
      status: "pass",
      output: "",
    };
  }

  const status = classifySmokeFailure(result.output);
  return {
    status,
    output: `git fetch 失敗，locator "${locator}": ${result.output}`,
  };
}

function readPluginManifestAtLocator(repoDir, locator, normalizedPluginPath) {
  const manifestCandidates = PLUGIN_JSON_CANDIDATES.map((segments) =>
    toPosixPath(normalizedPluginPath, ...segments)
  );

  for (const manifestPath of manifestCandidates) {
    const showResult = runCommand("git", ["show", `${locator}:${manifestPath}`], { cwd: repoDir });
    if (showResult.exitCode === 0) {
      const rawShow = spawnSync("git", ["show", `${locator}:${manifestPath}`], { cwd: repoDir, encoding: "utf8" });
      const rawStdout = String(rawShow.stdout ?? "");

      try {
        return {
          kind: "found",
          manifestPath,
          manifest: JSON.parse(rawStdout),
        };
      } catch (error) {
        return {
          kind: "invalid",
          manifestPath,
          message: `在 "${manifestPath}" 的 "${locator}" 中 JSON 無效: ${error.message}`,
        };
      }
    }

    if (isMissingPathAtLocator(showResult.output)) {
      continue;
    }

    return {
      kind: "infra_error",
      message: `無法讀取 "${manifestPath}" 在 "${locator}": ${showResult.output}`,
    };
  }

  return {
    kind: "not_found",
    message: `在 "${locator}" 找不到 plugin.json。預期位置為: ${manifestCandidates.join(", ")}`,
  };
}

function runVersionMatchGate(repoDir, plugin, primaryFetchSpec) {
  const expectedVersion = String(plugin?.version ?? "").trim();
  const normalizedPluginPath = normalizePluginPath(plugin?.source?.path || "/");
  const locators = [plugin?.source?.ref, plugin?.source?.sha]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim())
    .filter((value, index, values) => values.indexOf(value) === index);

  if (locators.length === 0) {
    return {
      status: "not_run",
      output: "版本比對檢查已跳過，因為未提供 source.ref 或 source.sha。",
    };
  }

  const messages = [];
  let hasFailure = false;
  let hasInfraError = false;

  for (const locator of locators) {
    if (locator !== primaryFetchSpec) {
      const fetchResult = fetchLocatorIntoRepo(repoDir, locator);
      if (fetchResult.status === "fail") {
        hasFailure = true;
        messages.push(`- ${locator}: ${fetchResult.output}`);
        continue;
      }

      if (fetchResult.status === "infra_error") {
        hasInfraError = true;
        messages.push(`- ${locator}: ${fetchResult.output}`);
        continue;
      }
    }

    const manifestResult = readPluginManifestAtLocator(repoDir, locator, normalizedPluginPath);
    if (manifestResult.kind === "not_found" || manifestResult.kind === "invalid") {
      hasFailure = true;
      messages.push(`- ${locator}: ${manifestResult.message}`);
      continue;
    }

    if (manifestResult.kind === "infra_error") {
      hasInfraError = true;
      messages.push(`- ${locator}: ${manifestResult.message}`);
      continue;
    }

    const actualVersion = String(manifestResult.manifest?.version ?? "").trim();
    if (!actualVersion) {
      hasFailure = true;
      messages.push(`- ${locator}: "${manifestResult.manifestPath}" 缺少非空的 "version" 欄位。`);
      continue;
    }

    if (actualVersion !== expectedVersion) {
      hasFailure = true;
      messages.push(
        `- ${locator}: external.json 版本 "${expectedVersion}" 與 "${manifestResult.manifestPath}" 版本 "${actualVersion}" 不相符。`
      );
      continue;
    }

    messages.push(`- ${locator}: 在 "${manifestResult.manifestPath}" 中比對到版本 "${expectedVersion}"。`);
  }

  if (hasFailure) {
    return {
      status: "fail",
      output: messages.join("\n"),
    };
  }

  if (hasInfraError) {
    return {
      status: "infra_error",
      output: messages.join("\n"),
    };
  }

  return {
    status: "pass",
    output: messages.join("\n"),
  };
}

function toOverallStatus(states) {
  if (states.includes("infra_error")) {
    return "infra_error";
  }
  if (states.includes("fail")) {
    return "fail";
  }
  if (states.every((state) => state === "not_run")) {
    return "not_run";
  }
  return "pass";
}

function toFailureClass(overallStatus) {
  if (overallStatus === "infra_error") {
    return "infra";
  }
  if (overallStatus === "fail") {
    return "submitter_fixes";
  }
  return "none";
}

export async function runExternalPluginQualityGates(plugin) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "external-plugin-quality-"));
  const result = {
    overall_status: "not_run",
    vally_lint_status: "not_run",
    smoke_status: "not_run",
    version_match_status: "not_run",
    failure_class: "none",
    summary: "",
    vally_lint_output: "",
    smoke_output: "",
    version_match_output: "",
  };

  try {
    const { repoDir, fetchSpec } = cloneSubmissionRepository(workDir, plugin);
    const normalizedPluginPath = normalizePluginPath(plugin.source?.path || "/");
    const pluginRoot = normalizedPluginPath ? path.join(repoDir, normalizedPluginPath) : repoDir;

    if (!fs.existsSync(pluginRoot) || !fs.statSync(pluginRoot).isDirectory()) {
      result.vally_lint_status = "fail";
      result.smoke_status = "fail";
      result.version_match_status = "fail";
      result.overall_status = "fail";
      result.failure_class = "submitter_fixes";
      result.summary = `在提交的儲存庫快照中找不到 plugin 路徑 "${plugin.source?.path || "/"}"。`;
      result.version_match_output = result.summary;
      return result;
    }

    const versionMatchResult = runVersionMatchGate(repoDir, plugin, fetchSpec);
    result.version_match_status = versionMatchResult.status;
    result.version_match_output = versionMatchResult.output;

    const vallyResult = await runVallyLintGate(pluginRoot);
    result.vally_lint_status = vallyResult.status;
    result.vally_lint_output = vallyResult.output;

    const smokeResult = runInstallSmokeGate(workDir, plugin);
    result.smoke_status = smokeResult.status;
    result.smoke_output = smokeResult.output;

    result.overall_status = toOverallStatus([result.vally_lint_status, result.smoke_status, result.version_match_status]);
    result.failure_class = toFailureClass(result.overall_status);
    result.summary = [
      `- vally lint: ${result.vally_lint_status}`,
      `- install smoke test: ${result.smoke_status}`,
      `- version match: ${result.version_match_status}`,
      `- overall: ${result.overall_status}`,
    ].join("\n");

    return result;
  } catch (error) {
    result.overall_status = "infra_error";
    result.failure_class = "infra";
    result.summary = truncateOutput(error.message);
    result.vally_lint_output = truncateOutput(error.stack || error.message);
    return result;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

function parseCliArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) {
      continue;
    }

    args[key.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseCliArgs(process.argv.slice(2));
  if (!args["plugin-json"]) {
    console.error("用法: node ./eng/external-plugin-quality-gates.mjs --plugin-json '<json>'");
    process.exit(1);
  }

  const plugin = JSON.parse(args["plugin-json"]);
  const result = await runExternalPluginQualityGates(plugin);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
