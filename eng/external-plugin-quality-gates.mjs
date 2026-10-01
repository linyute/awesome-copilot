#!/usr/bin/env node

import fs from "fs";
import os from "os";
import path from "path";
import { Writable } from "stream";
import { spawnSync } from "child_process";
import { runLint, LintConsoleReporter } from "@microsoft/vally";
import { evaluateRefShaConsistency, normalizeCommitSha } from "./lib/external-plugin-source-ref-sha.mjs";
import { validateAgentPluginManifest } from "./agent-plugin-schema.mjs";

const MAX_OUTPUT_LENGTH = 12000;
const AGENT_PLUGIN_SCHEMA_URL = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const AGENT_PLUGIN_ALLOWED_TOP_LEVEL_FIELDS = new Set([
  "$schema",
  "name",
  "version",
  "description",
  "author",
  "homepage",
  "repository",
  "license",
  "keywords",
  "extensions",
]);
const AGENT_PLUGIN_NAME_PATTERN = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const EXTERNAL_CANVAS_KEYWORD = "canvas";
const COPILOT_CLIENT_NAMESPACE = "com.github.copilot";
const COPILOT_EXTENSIONS_DIRECTORY = "extensions";

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

function normalizeOutput(value) {
  return String(value ?? "").replace(/\x1b\[[0-9;]*m/g, "").trim();
}

function truncateOutput(value) {
  const normalized = normalizeOutput(value);
  if (normalized.length <= MAX_OUTPUT_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_OUTPUT_LENGTH)}\n...output truncated...`;
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

function hasCanvasKeyword(plugin) {
  return (plugin?.keywords ?? []).some(
    (keyword) => String(keyword).trim().toLowerCase() === EXTERNAL_CANVAS_KEYWORD,
  );
}

function resolveFetchSpec(pluginSource) {
  if (pluginSource.sha) {
    return pluginSource.sha;
  }

  if (!pluginSource.ref) {
    throw new Error("quality gates 需要 source.ref 或 source.sha");
  }

  const ref = String(pluginSource.ref).trim();
  if (!ref) {
    throw new Error("quality gates 需要 source.ref 或 source.sha");
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
    throw new Error(`git fetch ${fetchSpec} 失敗: ${fetch.output}`);
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

// 依特定程度由高到低排列的 plugin.json 候選位置清單。
// Copilot CLI 與許多外部 repository 皆使用巢狀慣例。我們自行讀取
// manifest，以便無論 manifest 位於何處，都能一致地從 plugin
// 根目錄解析 skill 路徑，而不受 manifest 位置影響。
// 注意：請與 external-plugin-validation.mjs 中的 EXTERNAL_PLUGIN_ROOT_MANIFEST_PATHS 保持同步
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

function inspectAgentPluginSpecCompliance(pluginRoot) {
      const pluginJsonPath = findPluginJson(pluginRoot);
      if (!pluginJsonPath) {
        return {
          status: "warning",
          output: "未在已識別的位置找到 plugin.json。Agent Plugins v1.0.0 預期 plugin.json 位於 plugin 根目錄。",
        };
      }

      const rootPluginJsonPath = path.join(pluginRoot, "plugin.json");
      const issues = [];
      if (pluginJsonPath !== rootPluginJsonPath) {
        issues.push(`manifest 位於 "${path.relative(pluginRoot, pluginJsonPath)}"；預期 plugin 根目錄的 "plugin.json"`);
      }

      let manifest;
      try {
        manifest = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
      } catch (error) {
        return {
          status: "warning",
          output: `plugin.json 不是有效的 JSON: ${error.message}`,
        };
      }

      if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
        issues.push("plugin.json 頂層值必須是 JSON 物件");
      } else {
        if (manifest.$schema !== AGENT_PLUGIN_SCHEMA_URL) {
          issues.push(`$schema 應該是 "${AGENT_PLUGIN_SCHEMA_URL}"`);
        }

        const pluginName = manifest.name;
        if (typeof pluginName !== "string") {
          issues.push('必要欄位 "name" 必須是字串');
        } else {
          if (pluginName.length < 1 || pluginName.length > 64) {
            issues.push('欄位 "name" 必須為 1-64 個字元');
          }
          if (!AGENT_PLUGIN_NAME_PATTERN.test(pluginName)) {
            issues.push('欄位 "name" 不符合 Agent Plugins 命名限制');
          }
        }

        const requiredStringFields = ["version", "description"];
        for (const field of requiredStringFields) {
          if (typeof manifest[field] !== "string" || manifest[field].trim() === "") {
            issues.push(`必要欄位 "${field}" 必須是非空字串`);
          }
        }

        const optionalStringFields = ["homepage", "repository", "license"];
        for (const field of optionalStringFields) {
          if (manifest[field] !== undefined && typeof manifest[field] !== "string") {
            issues.push(`欄位 "${field}" 若提供則必須是字串`);
          }
        }

        if (manifest.author !== undefined) {
          if (!manifest.author || typeof manifest.author !== "object" || Array.isArray(manifest.author)) {
            issues.push('欄位 "author" 若提供則必須是物件');
          } else {
            const allowedAuthorFields = new Set(["name", "email", "url"]);
            for (const authorField of Object.keys(manifest.author)) {
              if (!allowedAuthorFields.has(authorField)) {
                issues.push(`欄位 "author.${authorField}" 不被允許`);
              } else if (typeof manifest.author[authorField] !== "string") {
                issues.push(`欄位 "author.${authorField}" 必須是字串`);
              }
            }
          }
        }

        if (manifest.keywords !== undefined) {
          if (!Array.isArray(manifest.keywords)) {
            issues.push('欄位 "keywords" 若提供則必須是字串陣列');
          } else if (manifest.keywords.some((entry) => typeof entry !== "string")) {
            issues.push('欄位 "keywords" 只能包含字串');
          }
        }

        if (manifest.extensions !== undefined) {
          if (!manifest.extensions || typeof manifest.extensions !== "object" || Array.isArray(manifest.extensions)) {
            issues.push('欄位 "extensions" 若提供則必須是物件');
          } else {
            for (const [namespace, value] of Object.entries(manifest.extensions)) {
              if (!value || typeof value !== "object" || Array.isArray(value)) {
                issues.push(`欄位 "extensions.${namespace}" 必須是物件`);
              }
            }
          }
        }

        for (const field of Object.keys(manifest)) {
          if (!AGENT_PLUGIN_ALLOWED_TOP_LEVEL_FIELDS.has(field)) {
            issues.push(`頂層欄位 "${field}" 不屬於 Agent Plugins v1.0.0`);
          }
        }
      }

      if (manifest && typeof manifest === "object" && !Array.isArray(manifest)) {
        issues.push(...validateAgentPluginManifest(manifest).map((error) => `schema validation: ${error}`));
      }

      if (issues.length === 0) {
        return {
          status: "pass",
          output: `Agent Plugins v1.0.0 manifest 檢查已通过 ${path.relative(pluginRoot, pluginJsonPath) || "plugin.json"}。`,
        };
      }

      return {
        status: "warning",
        output: [
          "Agent Plugins v1.0.0 manifest 警告:",
          ...issues.map((issue) => `- ${issue}`),
        ].join("\n"),
      };
}

function buildVallyLintArgs(pluginRoot) {
  const pluginJsonPath = findPluginJson(pluginRoot);
  if (!pluginJsonPath) {
    // 未找到已識別的 plugin.json 位置——lint 整個 plugin 根目錄，
    // 並讓 vally 向提交者顯示真正的錯誤。
    return [pluginRoot];
  }

  let pluginJson;
  try {
    pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
  } catch {
    // plugin.json 格式錯誤——改以 lint 整個根目錄。
    return [pluginRoot];
  }

  // 從 plugin.json 收集 skill 目錄路徑。
  const skillPaths = [].concat(pluginJson.skills ?? [])
    .map((s) => path.resolve(pluginRoot, s))
    .filter((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());

  if (skillPaths.length > 0) {
    return skillPaths;
  }

  // 無法解析任何 skill 目錄——lint 整個 plugin 根目錄，
  // 以便 vally 能向提交者顯示具體的驗證錯誤。
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

    const logOutput = normalizeOutput(combinedOutput);
    return {
      status: anyFailure ? "fail" : "pass",
      output: truncateOutput(logOutput),
      logOutput,
    };
  } catch (error) {
    const logOutput = normalizeOutput(error.stack || error.message);
    return {
      status: "infra_error",
      output: truncateOutput(logOutput),
      logOutput,
    };
  }
}

export function formatQualityGateLog(plugin, result, { vallyLintOutput } = {}) {
  const pluginName = String(plugin?.name || "unknown");
  const sections = [
    `外部 plugin 品質 gate 記錄: ${pluginName}`,
    "",
    "摘要",
    String(result.summary || "未提供摘要。"),
  ];
  const gateOutputs = [
    ["規格符合性", result.spec_compliance_output],
    ["Vally lint", vallyLintOutput ?? result.vally_lint_output],
    ["安裝冒煙測試", result.smoke_output],
    ["版本比對", result.version_match_output],
    ["Ref/SHA 一致性", result.ref_sha_consistency_output],
    ["Canvas 結構", result.canvas_structure_output],
  ];

  for (const [heading, output] of gateOutputs) {
    sections.push("", heading, normalizeOutput(output) || "未擷取到輸出。");
  }

  return `${sections.join("\n")}\n`;
}

function buildEphemeralMarketplace(workDir, plugin) {
  const marketplaceDir = path.join(workDir, "marketplace");
  ensureDirectory(marketplaceDir);

  const marketplace = {
    name: "external-plugin-intake",
    metadata: {
      description: "供外部 plugin 接收冒煙測試使用的暫時 marketplace",
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
      output: "此 runner 上沒有可用的 copilot CLI。",
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
        output: `plugin 已安裝，但在 ${installedPluginPath} 找不到安裝目錄`,
      };
    }
    const pluginManifestPath = findPluginJson(installedPluginPath);
    if (!pluginManifestPath) {
      return {
        status: "fail",
        output: `plugin 已安裝，但在 ${installedPluginPath} 下的任何已識別位置都找不到 plugin.json`,
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

function isMissingPathAtLocator(output) {
  const normalized = String(output ?? "").toLowerCase();
  return (
    normalized.includes("does not exist in") ||
    normalized.includes("exists on disk, but not in") ||
    (normalized.includes("path '") && normalized.includes("not in"))
  );
}

// 解析 locator 的內容應從哪個 git 物件讀取。
//
// locator 可以是 commit SHA、精簡 tag 名稱（例如 "v1.1.247"），
// 或完整限定的 tag ref。`git fetch origin <locator>` 只會更新 FETCH_HEAD，
// 並不會建立本機的 `refs/tags/<name>`，因此 `git show <tag>:...` 會以
// "invalid object name" 失敗。改由 FETCH_HEAD（或對已
// check-out 的 primary 使用 HEAD）讀取，即可規避此問題而無需對 locator 分類。
function resolveLocatorReadRef(repoDir, locator, primaryFetchSpec) {
  if (locator === primaryFetchSpec) {
    // primary locator 在 submission 被複製時已 fetch 並 check-out 到 HEAD，
    // 因此其內容可透過 HEAD 讀取，無需再次 fetch。
    return { status: "pass", readRef: "HEAD", output: "" };
  }

  const result = runCommand("git", ["fetch", "--depth=1", "origin", locator], { cwd: repoDir });
  if (result.exitCode === 0) {
    // FETCH_HEAD 指向剛 fetch 的物件。每個 gate 最多 fetch 一個非 primary
    // locator，且會立即在下方讀取，因此 FETCH_HEAD
    // 不會在使用前被覆蓋。
    return { status: "pass", readRef: "FETCH_HEAD", output: "" };
  }

  const status = classifySmokeFailure(result.output);
  return {
    status,
    readRef: null,
    output: `git fetch "${locator}" 失敗: ${result.output}`,
  };
}

function readPluginManifestAtLocator(repoDir, readRef, locator, normalizedPluginPath) {
  const manifestCandidates = PLUGIN_JSON_CANDIDATES.map((segments) =>
    toPosixPath(normalizedPluginPath, ...segments)
  );

  for (const manifestPath of manifestCandidates) {
    const showResult = runCommand("git", ["show", `${readRef}:${manifestPath}`], { cwd: repoDir });
    if (showResult.exitCode === 0) {
      const rawShow = spawnSync("git", ["show", `${readRef}:${manifestPath}`], { cwd: repoDir, encoding: "utf8" });
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
          message: `"${manifestPath}"（位於 "${locator}"）中的 JSON 無效: ${error.message}`,
        };
      }

    }

    if (isMissingPathAtLocator(showResult.output)) {
      continue;
    }

    return {
      kind: "infra_error",
      message: `無法在 "${locator}" 讀取 "${manifestPath}": ${showResult.output}`,
    };
  }

  return {
    kind: "not_found",
    message: `未在 "${locator}" 找到 plugin.json。預期為以下之一: ${manifestCandidates.join(", ")}`,
  };
}

function resolveCommitShaAtReadRef(repoDir, readRef, locator) {
  const revParse = runCommand("git", ["rev-parse", `${readRef}^{commit}`], { cwd: repoDir });
  if (revParse.exitCode !== 0) {
    return {
      status: "fail",
      commitSha: null,
      output: `source.ref "${locator}" 未指向 commit（它可能指向 tag 物件、tree 或 blob）；僅支援以 commit 為基礎的 ref`,
    };
  }

  const commitSha = normalizeCommitSha(revParse.stdout);
  if (!commitSha) {
    return {
      status: "infra_error",
      commitSha: null,
      output: `無法從 "${readRef}" 解析 "${locator}" 的 commit SHA。`,
    };
  }

  return {
    status: "pass",
    commitSha,
    output: "",
  };
}

export function runRefShaConsistencyGate(repoDir, plugin, primaryFetchSpec) {
  const sourceRef = typeof plugin?.source?.ref === "string" ? plugin.source.ref.trim() : "";
  const sourceSha = typeof plugin?.source?.sha === "string" ? plugin.source.sha.trim() : "";
  if (!sourceRef || !sourceSha) {
    return {
      status: "not_run",
      output: "因 source.ref 或 source.sha 有一者未提供，已略過 Ref/SHA 一致性 gate。",
    };
  }

  const refResult = resolveLocatorReadRef(repoDir, sourceRef, primaryFetchSpec);
  if (refResult.status === "fail") {
    return {
      status: "fail",
      output: refResult.output,
    };
  }

  if (refResult.status === "infra_error") {
    return {
      status: "infra_error",
      output: refResult.output,
    };
  }

  const commitResult = resolveCommitShaAtReadRef(repoDir, refResult.readRef, sourceRef);
  if (commitResult.status !== "pass") {
    return commitResult;
  }

  const consistency = evaluateRefShaConsistency({
    ref: sourceRef,
    sha: sourceSha,
    resolvedRefCommitSha: commitResult.commitSha,
  });
  if (!consistency.comparable) {
    return {
      status: "not_run",
      output: "因 source.sha 不是完整的 40 字元 commit SHA，已略過 Ref/SHA 一致性 gate。",
    };
  }

  if (!consistency.matches) {
    return {
      status: "fail",
      output: `source.ref "${sourceRef}" 解析為 "${consistency.normalizedRefCommitSha}"，與 source.sha "${sourceSha}" 不符。`,
    };
  }

  return {
    status: "pass",
    output: `source.ref "${sourceRef}" 解析到的 commit 與 source.sha "${sourceSha}" 相同。`,
  };
}

export function runVersionMatchGate(repoDir, plugin, primaryFetchSpec) {
  const expectedVersion = String(plugin?.version ?? "").trim();
  const normalizedPluginPath = normalizePluginPath(plugin?.source?.path || "/");
  const locators = [plugin?.source?.ref, plugin?.source?.sha]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim())
    .filter((value, index, values) => values.indexOf(value) === index);

  if (locators.length === 0) {
    return {
      status: "not_run",
      output: "因 source.ref 與 source.sha 皆未提供，已略過版本比對 gate。",
    };
  }

  const messages = [];
  let hasFailure = false;
  let hasInfraError = false;

  for (const locator of locators) {
    const refResult = resolveLocatorReadRef(repoDir, locator, primaryFetchSpec);
    if (refResult.status === "fail") {
      hasFailure = true;
      messages.push(`- ${locator}: ${refResult.output}`);
      continue;
    }

    if (refResult.status === "infra_error") {
      hasInfraError = true;
      messages.push(`- ${locator}: ${refResult.output}`);
      continue;
    }

    const manifestResult = readPluginManifestAtLocator(repoDir, refResult.readRef, locator, normalizedPluginPath);
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
        `- ${locator}: external.json 版本 "${expectedVersion}" 與 "${manifestResult.manifestPath}" 版本 "${actualVersion}" 不符。`
      );
      continue;
    }

    messages.push(`- ${locator}: 於 "${manifestResult.manifestPath}" 找到相符的版本 "${expectedVersion}"。`);
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

function checkPathExistsAtLocator(repoDir, readRef, locator, repoPath, expectedType) {
  const result = runCommand("git", ["cat-file", "-e", `${readRef}:${repoPath}`], { cwd: repoDir });
  if (result.exitCode === 0) {
    if (!expectedType) {
      return { exists: true, output: "" };
    }

    const typeResult = runCommand("git", ["cat-file", "-t", `${readRef}:${repoPath}`], { cwd: repoDir });
    if (typeResult.exitCode !== 0) {
      return {
        exists: false,
        output: `無法在 "${locator}" 驗證路徑 "${repoPath}" 的類型: ${typeResult.output}`,
      };
    }

    const actualType = String(typeResult.stdout ?? "").trim();
    if (actualType !== expectedType) {
      return {
        exists: false,
        output: "",
        kindMismatch: true,
        actualType,
      };
    }

    return { exists: true, output: "" };
  }

  const normalizedOutput = String(result.output ?? "").toLowerCase();
  if (
    normalizedOutput.includes("not a valid object name")
    || normalizedOutput.includes("path '")
    || normalizedOutput.includes("does not exist")
  ) {
    return { exists: false, output: "" };
  }

  return {
    exists: false,
    output: `無法在 "${locator}" 驗證路徑 "${repoPath}": ${result.output}`,
  };
}

function listTreeEntries(repoDir, readRef, locator, treePath, { recursive = false } = {}) {
  // 直接解析完整且未截斷的 tree 清單。runCommand()/truncateOutput()
  // 會將 stdout 限制在 MAX_OUTPUT_LENGTH 並靜默略掉後續項目，且
  // 預設（非 "-z"）輸出會為不尋常的名稱加引號；"-z" 則提供原始的 NUL 分隔記錄。
  // "-r -t" 以單一程序遞迴，且仍會列出中間的 tree 物件，因此
  // 可以在不需為每個候選路徑各自啟動 git 程序的情況下檢視整棵子樹。
  const args = recursive
    ? ["ls-tree", "-r", "-t", "-z", `${readRef}:${treePath}`]
    : ["ls-tree", "-z", `${readRef}:${treePath}`];
  const result = spawnSync("git", args, {
    cwd: repoDir,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const detail = truncateOutput(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
    return {
      entries: [],
      output: `無法在 "${locator}" 列出目錄 "${treePath}": ${detail}`,
    };
  }

  const entries = [];
  for (const record of String(result.stdout ?? "").split("\0")) {
    if (!record) {
      continue;
    }

    const tabIndex = record.indexOf("\t");
    if (tabIndex === -1) {
      continue;
    }

    const meta = record.slice(0, tabIndex).trim().split(/\s+/);
    const name = record.slice(tabIndex + 1);
    if (!name) {
      continue;
    }

    entries.push({ type: meta[1] ?? "", name });
  }

  return { entries, output: "" };
}

function locateCanvasEntryPoint(repoDir, readRef, locator, extensionsDir) {
  // 以單一個遞迴的 git 程序列舉 extensions 子樹，
  // 而非為每個候選目錄各自啟動 git cat-file，如此無論不受信任的 repository 在
  // "extensions/" 下塞入多少資料夾，探索都能保持有界。"-r" 會產出
  // 相對於 extensionsDir 的路徑，因此巢狀 entry point 會顯示為 "<name>/extension.mjs"。
  const listing = listTreeEntries(repoDir, readRef, locator, extensionsDir, { recursive: true });
  if (listing.output) {
    return { entryPoint: null, output: listing.output };
  }

  let nestedEntryPoint = null;
  let nestedEntryIsNotFile = false;
  for (const entry of listing.entries) {
    const segments = entry.name.split("/");
    if (segments.length === 2 && segments[1] === "extension.mjs" && !nestedEntryPoint) {
      if (entry.type === "blob") {
        nestedEntryPoint = toPosixPath(extensionsDir, segments[0], "extension.mjs");
      } else {
        nestedEntryIsNotFile = true;
      }
    }
  }

  if (nestedEntryPoint) {
    return { entryPoint: nestedEntryPoint, output: "" };
  }

  return { entryPoint: null, output: "", kindMismatch: nestedEntryIsNotFile };
}

export function runCanvasStructureGate(repoDir, plugin, primaryFetchSpec) {
  if (!hasCanvasKeyword(plugin)) {
    return {
      status: "not_run",
      output: "Canvas 結構 gate 已略過，因為 plugin 未標記 \"canvas\"。",
    };
  }

  const normalizedPluginPath = normalizePluginPath(plugin?.source?.path || "/");
  const locators = [plugin?.source?.ref, plugin?.source?.sha]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim())
    .filter((value, index, values) => values.indexOf(value) === index);

  if (locators.length === 0) {
    return {
      status: "not_run",
      output: "Canvas 結構 gate 已略過，因為 source.ref 與 source.sha 皆未提供。",
    };
  }

  const namespaceDir = toPosixPath(normalizedPluginPath, COPILOT_CLIENT_NAMESPACE);
  const extensionsDir = toPosixPath(namespaceDir, COPILOT_EXTENSIONS_DIRECTORY);

  let hasFailure = false;
  let hasInfraError = false;
  const messages = [];

  for (const locator of locators) {
    const refResult = resolveLocatorReadRef(repoDir, locator, primaryFetchSpec);
    if (refResult.status === "fail") {
      hasFailure = true;
      messages.push(`- ${locator}: ${refResult.output}`);
      continue;
    }

    if (refResult.status === "infra_error") {
      hasInfraError = true;
      messages.push(`- ${locator}: ${refResult.output}`);
      continue;
    }

    const readRef = refResult.readRef;

    const extensionDirCheck = checkPathExistsAtLocator(repoDir, readRef, locator, extensionsDir, "tree");
    if (extensionDirCheck.output) {
      hasInfraError = true;
      messages.push(`- ${locator}: ${extensionDirCheck.output}`);
      continue;
    }
    if (!extensionDirCheck.exists) {
      hasFailure = true;
      if (extensionDirCheck.kindMismatch) {
        messages.push(`- ${locator}: "${extensionsDir}" 必須是目錄。`);
      } else {
        messages.push(`- ${locator}: 缺少必要的 canvas extension 目錄 "${extensionsDir}"。`);
      }
      continue;
    }

    const extensionEntryCheck = locateCanvasEntryPoint(repoDir, readRef, locator, extensionsDir);
    if (extensionEntryCheck.output) {
      hasInfraError = true;
      messages.push(`- ${locator}: ${extensionEntryCheck.output}`);
      continue;
    }
    if (!extensionEntryCheck.entryPoint) {
      hasFailure = true;
      if (extensionEntryCheck.kindMismatch) {
        messages.push(
          `- ${locator}: "${extensionsDir}/<extension>/extension.mjs" 必須是檔案。`,
        );
      } else {
        messages.push(
          `- ${locator}: 缺少必要的 canvas extension entry point "${extensionsDir}/<extension>/extension.mjs"。`,
        );
      }
      continue;
    }

    messages.push(`- ${locator}: 找到 "${extensionsDir}"，entry point 為 "${extensionEntryCheck.entryPoint}"。`);
  }

  if (hasInfraError) {
    return {
      status: "infra_error",
      output: messages.join("\n"),
    };
  }

  if (hasFailure) {
    return {
      status: "fail",
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

export async function runExternalPluginQualityGates(plugin, { logFile } = {}) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "external-plugin-quality-"));
  let vallyLintLogOutput = "";
  const result = {
    overall_status: "not_run",
    vally_lint_status: "not_run",
    smoke_status: "not_run",
    spec_compliance_status: "not_run",
    version_match_status: "not_run",
    ref_sha_consistency_status: "not_run",
    canvas_structure_status: "not_run",
    failure_class: "none",
    summary: "",
    vally_lint_output: "",
    smoke_output: "",
    spec_compliance_output: "",
    version_match_output: "",
    ref_sha_consistency_output: "",
    canvas_structure_output: "",
  };

  try {
    const { repoDir, fetchSpec } = cloneSubmissionRepository(workDir, plugin);
    const normalizedPluginPath = normalizePluginPath(plugin.source?.path || "/");
    const pluginRoot = normalizedPluginPath ? path.join(repoDir, normalizedPluginPath) : repoDir;

    if (!fs.existsSync(pluginRoot) || !fs.statSync(pluginRoot).isDirectory()) {
      result.vally_lint_status = "fail";
      result.smoke_status = "fail";
      result.spec_compliance_status = "warning";
      result.version_match_status = "fail";
      result.ref_sha_consistency_status = "not_run";
      result.canvas_structure_status = hasCanvasKeyword(plugin) ? "fail" : "not_run";
      result.overall_status = "fail";
      result.failure_class = "submitter_fixes";
      result.summary = `plugin 路徑 "${plugin.source?.path || "/"}" 未在提交的 repository 快照中找到。`;
      result.spec_compliance_output = result.summary;
      result.version_match_output = result.summary;
      if (hasCanvasKeyword(plugin)) {
        result.canvas_structure_output = result.summary;
      }
      return result;
    }

    const specResult = inspectAgentPluginSpecCompliance(pluginRoot);
    result.spec_compliance_status = specResult.status;
    result.spec_compliance_output = specResult.output;

    const versionMatchResult = runVersionMatchGate(repoDir, plugin, fetchSpec);
    result.version_match_status = versionMatchResult.status;
    result.version_match_output = versionMatchResult.output;

    const refShaConsistencyResult = runRefShaConsistencyGate(repoDir, plugin, fetchSpec);
    result.ref_sha_consistency_status = refShaConsistencyResult.status;
    result.ref_sha_consistency_output = refShaConsistencyResult.output;

    const canvasStructureResult = runCanvasStructureGate(repoDir, plugin, fetchSpec);
    result.canvas_structure_status = canvasStructureResult.status;
    result.canvas_structure_output = canvasStructureResult.output;

    const vallyResult = await runVallyLintGate(pluginRoot);
    result.vally_lint_status = vallyResult.status;
    result.vally_lint_output = vallyResult.output;
    vallyLintLogOutput = vallyResult.logOutput;

    const smokeResult = runInstallSmokeGate(workDir, plugin);
    result.smoke_status = smokeResult.status;
    result.smoke_output = smokeResult.output;

    result.overall_status = toOverallStatus([
      result.vally_lint_status,
      result.smoke_status,
      result.version_match_status,
      result.ref_sha_consistency_status,
      result.canvas_structure_status,
    ]);
    result.failure_class = toFailureClass(result.overall_status);
    result.summary = [
      `- 規格符合性: ${result.spec_compliance_status}`,
      `- vally lint: ${result.vally_lint_status}`,
      `- 安裝冒煙測試: ${result.smoke_status}`,
      `- 版本比對: ${result.version_match_status}`,
      `- ref/sha 一致性: ${result.ref_sha_consistency_status}`,
      `- canvas 結構: ${result.canvas_structure_status}`,
      `- 整體: ${result.overall_status}`,
    ].join("\n");

    return result;
  } catch (error) {
    result.overall_status = "infra_error";
    result.failure_class = "infra";
    result.summary = truncateOutput(error.message);
    result.vally_lint_output = truncateOutput(error.stack || error.message);
    vallyLintLogOutput = normalizeOutput(error.stack || error.message);
    return result;
  } finally {
    if (logFile) {
      fs.mkdirSync(path.dirname(logFile), { recursive: true });
      fs.writeFileSync(
        logFile,
        formatQualityGateLog(plugin, result, { vallyLintOutput: vallyLintLogOutput }),
      );
    }
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
  const result = await runExternalPluginQualityGates(plugin, { logFile: args["log-file"] });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
