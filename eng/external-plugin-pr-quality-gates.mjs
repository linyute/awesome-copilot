#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { runExternalPluginQualityGates } from "./external-plugin-quality-gates.mjs";
import { validateExternalPlugin } from "./external-plugin-validation.mjs";

function normalizePluginPath(pluginPath) {
  if (!pluginPath || pluginPath === "/") {
    return "";
  }

  return String(pluginPath).trim().replace(/^\/+|\/+$/g, "");
}

function encodePathLikeValue(value) {
  return String(value)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function buildSourceTreeUrl(plugin) {
  const sourceRepo = plugin?.source?.repo;
  if (!sourceRepo) {
    return "";
  }

  const sourceLocator = plugin?.source?.sha || plugin?.source?.ref;
  if (!sourceLocator) {
    return `https://github.com/${sourceRepo}`;
  }

  const encodedLocator = encodeURIComponent(sourceLocator);
  const normalizedPath = normalizePluginPath(plugin?.source?.path);
  if (!normalizedPath) {
    return `https://github.com/${sourceRepo}/tree/${encodedLocator}`;
  }

  const encodedPath = encodePathLikeValue(normalizedPath);
  return `https://github.com/${sourceRepo}/tree/${encodedLocator}/${encodedPath}`;
}

function aggregateResultStatus(pluginResults) {
  if (pluginResults.some((entry) => entry.quality?.overall_status === "fail")) {
    return {
      overallStatus: "fail",
      failureClass: "submitter_fixes",
    };
  }

  if (pluginResults.some((entry) => entry.quality?.overall_status === "infra_error")) {
    return {
      overallStatus: "infra_error",
      failureClass: "infra",
    };
  }

  if (pluginResults.length === 0) {
    return {
      overallStatus: "not_run",
      failureClass: "none",
    };
  }

  return {
    overallStatus: "pass",
    failureClass: "none",
  };
}

function createValidationFailureQuality(errors) {
  const output = errors.map((error) => `- ${error}`).join("\n");
  return {
    overall_status: "fail",
    vally_lint_status: "fail",
    smoke_status: "not_run",
    version_match_status: "not_run",
    ref_sha_consistency_status: "not_run",
    canvas_structure_status: "not_run",
    failure_class: "submitter_fixes",
    summary: "插件項目未通過 external.json 驗證。請修正下列錯誤並重新執行品質檢查。",
    vally_lint_output: output,
    smoke_output: "因 external.json 驗證錯誤，已跳過安裝冒煙測試。",
    version_match_output: "因 external.json 驗證錯誤，已跳過版本比對。",
    ref_sha_consistency_output: "因 external.json 驗證錯誤，已跳過 Ref/SHA 一致性檢查。",
    canvas_structure_output: "因 external.json 驗證錯誤，已跳過 Canvas 結構檢查。",
  };
}

function createLogFilePath(logsDirectory, pluginName, index) {
  if (!logsDirectory) {
    return undefined;
  }

  const safeName = String(pluginName || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "unknown";
  return path.join(logsDirectory, `${String(index + 1).padStart(2, "0")}-${safeName}.log`);
}

function writeValidationFailureLog(logFile, plugin, quality) {
  if (!logFile) {
    return;
  }

  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.writeFileSync(
    logFile,
    [
      `外部插件品質閘門記錄：${plugin?.name || "unknown"}`,
      "",
      "外部插件項目驗證",
      quality.vally_lint_output || "未擷取任何輸出。",
      "",
    ].join("\n"),
  );
}

export async function runExternalPluginPrQualityGates(plugins, { logsDirectory } = {}) {
  if (!Array.isArray(plugins)) {
    throw new Error("plugins 必須是陣列");
  }

  const checkedPlugins = await Promise.all(plugins.map(async (plugin, index) => {
    const validation = validateExternalPlugin(plugin, "changed-plugin", { policy: "marketplace" });
    const logFile = createLogFilePath(logsDirectory, plugin?.name, index);
    let quality;
    if (validation.errors.length > 0) {
      quality = createValidationFailureQuality(validation.errors);
      writeValidationFailureLog(logFile, plugin, quality);
    } else {
      quality = await runExternalPluginQualityGates(plugin, { logFile });
    }
    return {
      name: plugin?.name ?? "unknown",
      source: plugin?.source ?? {},
      source_tree_url: buildSourceTreeUrl(plugin),
      quality,
    };
  }));

  const aggregate = aggregateResultStatus(checkedPlugins);
  const summary = checkedPlugins.length === 0
    ? "在 plugins/external.json 中未偵測到任何已變更的外部插件項目。"
    : checkedPlugins
      .map((entry) =>
        `- ${entry.name}: spec=${entry.quality.spec_compliance_status}, vally-lint=${entry.quality.vally_lint_status}, install-smoke=${entry.quality.smoke_status}, version-match=${entry.quality.version_match_status}, ref-sha-consistency=${entry.quality.ref_sha_consistency_status}, canvas-structure=${entry.quality.canvas_structure_status}, overall=${entry.quality.overall_status}`
      )
      .join("\n");

  return {
    overall_status: aggregate.overallStatus,
    failure_class: aggregate.failureClass,
    summary,
    checked_plugins: checkedPlugins,
  };
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
  if (!args["plugins-json"]) {
    console.error("用法：node ./eng/external-plugin-pr-quality-gates.mjs --plugins-json '<json-array>'");
    process.exit(1);
  }

  const plugins = JSON.parse(args["plugins-json"]);
  const result = await runExternalPluginPrQualityGates(plugins, {
    logsDirectory: args["logs-directory"],
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
