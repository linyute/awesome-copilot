#!/usr/bin/env node

import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

const MAX_OUTPUT_LENGTH = 12000;
const SKILL_VALIDATOR_ARCHIVE_URL = "https://github.com/dotnet/skills/releases/download/skill-validator-nightly/skill-validator-linux-x64.tar.gz";

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
    throw new Error(`無效的外掛程式路徑 "${pluginPath}"`);
  }

  return normalized;
}

function resolveFetchSpec(pluginSource) {
  if (pluginSource.sha) {
    return pluginSource.sha;
  }

  if (!pluginSource.ref) {
    throw new Error("品質閘門需要 source.ref 或 source.sha");
  }

  const ref = String(pluginSource.ref).trim();
  if (!ref) {
    throw new Error("品質閘門需要 source.ref 或 source.sha");
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
    throw new Error(`git fetch 對於 ${fetchSpec} 失敗: ${fetch.output}`);
  }

  const checkout = runCommand("git", ["checkout", "--detach", "FETCH_HEAD"], { cwd: repoDir });
  if (checkout.exitCode !== 0) {
    throw new Error(`git checkout 失敗: ${checkout.output}`);
  }

  return repoDir;
}

function downloadSkillValidator(workDir) {
  const validatorDir = path.join(workDir, "skill-validator");
  ensureDirectory(validatorDir);
  const archivePath = path.join(validatorDir, "skill-validator-linux-x64.tar.gz");

  const download = runCommand("curl", ["-fsSL", SKILL_VALIDATOR_ARCHIVE_URL, "-o", archivePath]);
  if (download.exitCode !== 0) {
    throw new Error(`下載 skill-validator 失敗: ${download.output}`);
  }

  const untar = runCommand("tar", ["-xzf", archivePath, "-C", validatorDir]);
  if (untar.exitCode !== 0) {
    throw new Error(`解壓縮 skill-validator 失敗: ${untar.output}`);
  }

  const binaryPath = path.join(validatorDir, "skill-validator");
  if (!fs.existsSync(binaryPath)) {
    throw new Error("解壓縮後找不到 skill-validator 執行檔");
  }

  runCommand("chmod", ["+x", binaryPath]);
  return binaryPath;
}

// 候選 plugin.json 位置的排序清單，從最具體到最不具體。
// skill-validator 的 --plugin 模式預期 plugin.json 位於外掛程式根目錄，
// 但 Copilot CLI 和許多外部儲存庫都使用巢狀約定。我們自己讀取資訊清單 (manifest)，
// 以便可以從外掛程式根目錄一致地解析技能 (skill)/代理 (agent) 路徑，無論資訊清單位於何處。
// 注意：請與 external-plugin-validation.mjs 中的 EXTERNAL_PLUGIN_ROOT_MANIFEST_PATHS 保持同步
const PLUGIN_JSON_CANDIDATES = [
  [".github", "plugin", "plugin.json"],
  [".plugins", "plugin.json"],
  ["plugin.json"],
];

function findPluginJson(pluginRoot) {
  for (const segments of PLUGIN_JSON_CANDIDATES) {
    const candidate = path.join(pluginRoot, ...segments);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function buildSkillValidatorArgs(pluginRoot) {
  const pluginJsonPath = findPluginJson(pluginRoot);
  if (!pluginJsonPath) {
    // 找不到辨識出的 plugin.json 位置 — 讓驗證器以其自身的診斷訊息失敗
    // (涵蓋異國情調的佈局並向提交者顯示真正的錯誤)。
    return ["check", "--verbose", "--plugin", pluginRoot];
  }

  let pluginJson;
  try {
    pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
  } catch {
    // 格式錯誤的 plugin.json — 讓驗證器顯示解析錯誤。
    return ["check", "--verbose", "--plugin", pluginRoot];
  }

  const args = ["check", "--verbose"];

  // 無論 plugin.json 本身位於何處，plugin.json 中的路徑都是相對於外掛程式根目錄的。
  // 使用 [].concat() 來接受字串和陣列值。
  const skillPaths = [].concat(pluginJson.skills ?? [])
    .map((s) => path.resolve(pluginRoot, s))
    .filter((p) => fs.existsSync(p));

  // 代理項目可能是目錄路徑或明確的文件路徑；標準化為目錄
  // 以便 AgentDiscovery.DiscoverAgentsInDirectory 可以在其中發現代理。
  // 去除重複，以防多個文件項目共享相同的父目錄。
  const agentPaths = [...new Set(
    [].concat(pluginJson.agents ?? [])
      .map((a) => {
        const resolved = path.resolve(pluginRoot, a);
        if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
          return path.dirname(resolved);
        }
        return resolved;
      })
      .filter((p) => fs.existsSync(p))
  )];

  if (skillPaths.length > 0) {
    args.push("--skills", ...skillPaths);
  }
  if (agentPaths.length > 0) {
    args.push("--agents", ...agentPaths);
  }

  if (skillPaths.length === 0 && agentPaths.length === 0) {
    // 找到了 plugin.json 但沒有可解析的技能/代理 — 退回到 --plugin
    // 以便驗證器可以向提交者顯示特定的驗證錯誤。
    return ["check", "--verbose", "--plugin", pluginRoot];
  }

  return args;
}

function runSkillValidatorGate(workDir, pluginRoot) {
  try {
    const validatorBinary = downloadSkillValidator(workDir);
    const args = buildSkillValidatorArgs(pluginRoot);
    const check = runCommand(validatorBinary, args);

    if (check.exitCode === 0) {
      return { status: "pass", output: check.output };
    }

    return { status: "fail", output: check.output };
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
      output: "此執行器 (runner) 上無法使用 copilot CLI。",
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
        output: `外掛程式已安裝，但在 ${installedPluginPath} 找不到安裝目錄`,
      };
    }
    const pluginManifestPath = findPluginJson(installedPluginPath);
    if (!pluginManifestPath) {
      return {
        status: "fail",
        output: `外掛程式已安裝，但在 ${installedPluginPath} 下任何辨識出的位置都找不到 plugin.json`,
      };
    }

    return {
      status: "pass",
      output: `安裝冒煙測試成功。已驗證 ${pluginManifestPath}。`,
    };
  } catch (error) {
    return {
      status: "infra_error",
      output: truncateOutput(error.message),
    };
  }
}

function toOverallStatus(skillStatus, smokeStatus) {
  const states = [skillStatus, smokeStatus];
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

export function runExternalPluginQualityGates(plugin) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "external-plugin-quality-"));
  const result = {
    overall_status: "not_run",
    skill_validator_status: "not_run",
    smoke_status: "not_run",
    failure_class: "none",
    summary: "",
    skill_validator_output: "",
    smoke_output: "",
  };

  try {
    const repoDir = cloneSubmissionRepository(workDir, plugin);
    const normalizedPluginPath = normalizePluginPath(plugin.source?.path || "/");
    const pluginRoot = normalizedPluginPath ? path.join(repoDir, normalizedPluginPath) : repoDir;

    if (!fs.existsSync(pluginRoot) || !fs.statSync(pluginRoot).isDirectory()) {
      result.skill_validator_status = "fail";
      result.smoke_status = "fail";
      result.overall_status = "fail";
      result.failure_class = "submitter_fixes";
      result.summary = `在提交的儲存庫快照中找不到外掛程式路徑 "${plugin.source?.path || "/"}"。`;
      return result;
    }

    const skillResult = runSkillValidatorGate(workDir, pluginRoot);
    result.skill_validator_status = skillResult.status;
    result.skill_validator_output = skillResult.output;

    const smokeResult = runInstallSmokeGate(workDir, plugin);
    result.smoke_status = smokeResult.status;
    result.smoke_output = smokeResult.output;

    result.overall_status = toOverallStatus(result.skill_validator_status, result.smoke_status);
    result.failure_class = toFailureClass(result.overall_status);
    result.summary = [
      `- skill-validator: ${result.skill_validator_status}`,
      `- install smoke test: ${result.smoke_status}`,
      `- overall: ${result.overall_status}`,
    ].join("\n");

    return result;
  } catch (error) {
    result.overall_status = "infra_error";
    result.failure_class = "infra";
    result.summary = truncateOutput(error.message);
    result.skill_validator_output = truncateOutput(error.stack || error.message);
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
  const result = runExternalPluginQualityGates(plugin);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
