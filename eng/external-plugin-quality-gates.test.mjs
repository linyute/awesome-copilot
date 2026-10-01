import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { after, test } from "node:test";
import {
  formatQualityGateLog,
  runCanvasStructureGate,
  runRefShaConsistencyGate,
  runVersionMatchGate,
} from "./external-plugin-quality-gates.mjs";
import { runExternalPluginPrQualityGates } from "./external-plugin-pr-quality-gates.mjs";

const tempDirs = [];

after(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function runGit(repoDir, ...args) {
  const result = spawnSync("git", args, { cwd: repoDir, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} 失敗: ${result.stdout}\n${result.stderr}`);
  }
  return String(result.stdout ?? "").trim();
}

function createTempRepo() {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "external-plugin-quality-"));
  tempDirs.push(repoDir);

  runGit(repoDir, "init", "-q");
  runGit(repoDir, "config", "user.name", "Copilot Test");
  runGit(repoDir, "config", "user.email", "copilot@example.com");
  return repoDir;
}

function commitAll(repoDir, message) {
  runGit(repoDir, "add", "-A");
  runGit(repoDir, "commit", "-m", message, "--quiet");
  return runGit(repoDir, "rev-parse", "HEAD");
}

test("formatQualityGateLog 對產出物保留完整的 vally 輸出", () => {
  const fullVallyOutput = `lint failure\n${"x".repeat(13000)}`;
  const log = formatQualityGateLog(
    { name: "example-plugin" },
    {
      summary: "- vally lint: fail",
      spec_compliance_output: "spec output",
      vally_lint_output: "truncated output",
      smoke_output: "smoke output",
      version_match_output: "version output",
      ref_sha_consistency_output: "ref output",
      canvas_structure_output: "canvas output",
    },
    { vallyLintOutput: fullVallyOutput },
  );

  assert.match(log, /External plugin quality gate log: example-plugin/);
  assert.match(log, /lint failure/);
  assert.equal(log.includes("x".repeat(13000)), true);
  assert.equal(log.includes("truncated output"), false);
});

test("runExternalPluginPrQualityGates 為驗證失敗寫入日誌", async () => {
  const logsDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "external-plugin-pr-logs-"));
  tempDirs.push(logsDirectory);

  const result = await runExternalPluginPrQualityGates(
    [{ name: "Invalid Plugin", source: {} }],
    { logsDirectory },
  );

  assert.equal(result.overall_status, "fail");
  const logFiles = fs.readdirSync(logsDirectory);
  assert.deepEqual(logFiles, ["01-invalid-plugin.log"]);
  assert.match(
    fs.readFileSync(path.join(logsDirectory, logFiles[0]), "utf8"),
    /External plugin entry validation/,
  );
});

test("runCanvasStructureGate 在具名擴充功能存在時通過", () => {
  const repoDir = createTempRepo();
  fs.mkdirSync(path.join(repoDir, "com.github.copilot", "extensions", "canvas-plugin"), { recursive: true });
  fs.writeFileSync(
    path.join(repoDir, "com.github.copilot", "extensions", "canvas-plugin", "extension.mjs"),
    "export default {};\n",
  );
  const sha = commitAll(repoDir, "Add canvas extension container");

  const plugin = {
    name: "canvas-plugin",
    keywords: ["canvas"],
    source: {
      source: "github",
      repo: "owner/repo",
      sha,
    },
  };

  const result = runCanvasStructureGate(repoDir, plugin, sha);
  assert.equal(result.status, "pass");
  assert.match(result.output, /found "com\.github\.copilot\/extensions"/);
});

test("runCanvasStructureGate 在擴充功能入口點僅位於存放庫根目錄時失敗", () => {
  const repoDir = createTempRepo();
  fs.writeFileSync(path.join(repoDir, "extension.mjs"), "export default {};\n");
  const sha = commitAll(repoDir, "Add root extension entrypoint");

  const plugin = {
    name: "canvas-plugin",
    keywords: ["canvas"],
    source: {
      source: "github",
      repo: "owner/repo",
      sha,
    },
  };

  const result = runCanvasStructureGate(repoDir, plugin, sha);
  assert.equal(result.status, "fail");
  assert.match(result.output, /missing required canvas extension directory "com\.github\.copilot\/extensions"/);
});

test("runCanvasStructureGate 在具名擴充功能入口點路徑為目錄時失敗", () => {
  const repoDir = createTempRepo();
  fs.mkdirSync(path.join(repoDir, "com.github.copilot", "extensions", "canvas-plugin", "extension.mjs"), { recursive: true });
  fs.writeFileSync(
    path.join(repoDir, "com.github.copilot", "extensions", "canvas-plugin", "extension.mjs", "placeholder.txt"),
    "not-a-module\n",
  );
  const sha = commitAll(repoDir, "Add invalid extension entrypoint directory");

  const plugin = {
    name: "canvas-plugin",
    keywords: ["canvas"],
    source: {
      source: "github",
      repo: "owner/repo",
      sha,
    },
  };

  const result = runCanvasStructureGate(repoDir, plugin, sha);
  assert.equal(result.status, "fail");
  assert.match(result.output, /"com\.github\.copilot\/extensions\/<extension>\/extension\.mjs" must be a file/);
});

test("runCanvasStructureGate 在缺少 Copilot 命名空間時失敗", () => {
  const repoDir = createTempRepo();
  fs.mkdirSync(path.join(repoDir, "extensions", "modernize-dashboard"), { recursive: true });
  fs.writeFileSync(path.join(repoDir, "extensions", "modernize-dashboard", "extension.mjs"), "export default {};\n");
  const sha = commitAll(repoDir, "Add extension outside Copilot namespace");

  const plugin = {
    name: "canvas-plugin",
    keywords: ["canvas"],
    source: {
      source: "github",
      repo: "owner/repo",
      sha,
    },
  };

  const result = runCanvasStructureGate(repoDir, plugin, sha);
  assert.equal(result.status, "fail");
  assert.match(result.output, /missing required canvas extension directory "com\.github\.copilot\/extensions"/);
});

test("runCanvasStructureGate 在具名目錄中沒有 extension.mjs 時失敗", () => {
  const repoDir = createTempRepo();
  fs.mkdirSync(path.join(repoDir, "com.github.copilot", "extensions", "modernize-dashboard"), { recursive: true });
  fs.writeFileSync(
    path.join(repoDir, "com.github.copilot", "extensions", "modernize-dashboard", "index.mjs"),
    "export default {};\n",
  );
  const sha = commitAll(repoDir, "Add extensions directory without entry point");

  const plugin = {
    name: "canvas-plugin",
    keywords: ["canvas"],
    source: {
      source: "github",
      repo: "owner/repo",
      sha,
    },
  };

  const result = runCanvasStructureGate(repoDir, plugin, sha);
  assert.equal(result.status, "fail");
  assert.match(result.output, /missing required canvas extension entry point/);
});

test("runCanvasStructureGate 能找到列在傳統輸出上限之外的巢狀擴充功能", () => {
  const repoDir = createTempRepo();
  // 許多同層目錄會把真正的擴充功能推到約 12 KB 的標準輸出上限之外，而該上限正是
  // 先前會截斷的實作所施加的，它會使真正的擴充功能在清單中靜默遺失。
  // 較長的名稱會膨脹每筆 git ls-tree 記錄，因此只需較少的目錄即可超過上限。
  for (let index = 0; index < 160; index += 1) {
    const filler = path.join(
      repoDir,
      "com.github.copilot",
      "extensions",
      `filler-directory-that-pads-the-tree-listing-${String(index).padStart(4, "0")}`,
    );
    fs.mkdirSync(filler, { recursive: true });
    fs.writeFileSync(path.join(filler, "readme.txt"), "filler\n");
  }
  fs.mkdirSync(path.join(repoDir, "com.github.copilot", "extensions", "zzz-real-extension"), { recursive: true });
  fs.writeFileSync(
    path.join(repoDir, "com.github.copilot", "extensions", "zzz-real-extension", "extension.mjs"),
    "export default {};\n",
  );
  const sha = commitAll(repoDir, "Add nested extension after many siblings");

  const plugin = {
    name: "canvas-plugin",
    keywords: ["canvas"],
    source: {
      source: "github",
      repo: "owner/repo",
      sha,
    },
  };

  const result = runCanvasStructureGate(repoDir, plugin, sha);
  assert.equal(result.status, "pass");
  assert.match(result.output, /entry point "com\.github\.copilot\/extensions\/zzz-real-extension\/extension\.mjs"/);
});

// 針對問題 #2397 的回歸測試：標籤名稱的定位器（例如 "v1.0.0"）必須
// 能被版本比對（version-match）與畫布結構（canvas-structure）品質閘門讀取。`git fetch origin <tag>`
// 只會更新 FETCH_HEAD，絕不在本地建立 `refs/tags/<tag>`，因此透過
// `git show <tag>:...` 讀取時，過去會以 "fatal: invalid object name" 失敗，
// 並向上滾動成假的 infra_error/fail，即使被引用的內容本身是有效的。

function initRemoteRepo() {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "external-plugin-quality-remote-"));
  tempDirs.push(repoDir);
  runGit(repoDir, "init", "-q");
  runGit(repoDir, "config", "user.name", "Copilot Test");
  runGit(repoDir, "config", "user.email", "copilot@example.com");
  // 模擬 github.com：允許送審存放庫以 shallow-fetch 抓取任意 SHA。
  runGit(repoDir, "config", "uploadpack.allowAnySHA1InWant", "true");
  return repoDir;
}

function writeValidPluginContent(repoDir) {
  fs.mkdirSync(path.join(repoDir, ".github", "plugin"), { recursive: true });
  fs.writeFileSync(
    path.join(repoDir, ".github", "plugin", "plugin.json"),
    `${JSON.stringify({ name: "tag-plugin", version: "1.0.0" }, null, 2)}\n`,
  );
  fs.mkdirSync(path.join(repoDir, "com.github.copilot", "extensions", "tag-plugin"), { recursive: true });
  fs.writeFileSync(
    path.join(repoDir, "com.github.copilot", "extensions", "tag-plugin", "extension.mjs"),
    "export default {};\n",
  );
}

// 模擬 external-plugin-quality-gates.mjs 中的 cloneSubmissionRepository：只抓取
// 主要定位器，並將 HEAD 分離（detach）到其上。刻意不在本地建立 tag 參照，
// 以重現 CI 環境中 `git show <tag>:...` 會失敗的情況。
function cloneSubmissionRepo(remoteDir, primaryFetchSpec) {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "external-plugin-quality-sub-"));
  tempDirs.push(repoDir);
  runGit(repoDir, "init", "-q");
  runGit(repoDir, "remote", "add", "origin", remoteDir);
  runGit(repoDir, "fetch", "--depth=1", "origin", primaryFetchSpec);
  runGit(repoDir, "checkout", "--detach", "FETCH_HEAD");
  return repoDir;
}

test("runVersionMatchGate 在 tag 參照與 sha 並存時通過", () => {
  const remoteDir = initRemoteRepo();
  writeValidPluginContent(remoteDir);
  const sha = commitAll(remoteDir, "Add plugin manifest");
  runGit(remoteDir, "tag", "-a", "v1.0.0", "-m", "release 1.0.0");

  const repoDir = cloneSubmissionRepo(remoteDir, sha);
  const plugin = {
    name: "tag-plugin",
    version: "1.0.0",
    source: { source: "github", repo: "owner/repo", ref: "v1.0.0", sha },
  };

  const result = runVersionMatchGate(repoDir, plugin, sha);
  assert.equal(result.status, "pass", result.output);
  // tag 參照與 sha 兩者都必須被驗證。
  assert.match(result.output, /- v1\.0\.0: matched version "1\.0\.0"/);
  assert.match(result.output, new RegExp(`- ${sha}: matched version "1\\.0\\.0"`));
});

test("runCanvasStructureGate 在 tag 參照與 sha 並存時通過", () => {
  const remoteDir = initRemoteRepo();
  writeValidPluginContent(remoteDir);
  const sha = commitAll(remoteDir, "Add canvas extension container");
  runGit(remoteDir, "tag", "-a", "v1.0.0", "-m", "release 1.0.0");

  const repoDir = cloneSubmissionRepo(remoteDir, sha);
  const plugin = {
    name: "tag-plugin",
    keywords: ["canvas"],
    source: { source: "github", repo: "owner/repo", ref: "v1.0.0", sha },
  };

  const result = runCanvasStructureGate(repoDir, plugin, sha);
  assert.equal(result.status, "pass", result.output);
  assert.match(result.output, /- v1\.0\.0: found "com\.github\.copilot\/extensions"/);
  assert.match(result.output, new RegExp(`- ${sha}: found "com\\.github\\.copilot/extensions"`));
});

test("runVersionMatchGate 在主要定位器為 tag 參照時通過", () => {
  const remoteDir = initRemoteRepo();
  writeValidPluginContent(remoteDir);
  commitAll(remoteDir, "Add plugin manifest");
  runGit(remoteDir, "tag", "-a", "v1.0.0", "-m", "release 1.0.0");

  const repoDir = cloneSubmissionRepo(remoteDir, "v1.0.0");
  const plugin = {
    name: "tag-plugin",
    version: "1.0.0",
    source: { source: "github", repo: "owner/repo", ref: "v1.0.0" },
  };

  const result = runVersionMatchGate(repoDir, plugin, "v1.0.0");
  assert.equal(result.status, "pass", result.output);
  assert.match(result.output, /- v1\.0\.0: matched version "1\.0\.0"/);
});

test("runCanvasStructureGate 在主要定位器為 tag 參照時通過", () => {
  const remoteDir = initRemoteRepo();
  writeValidPluginContent(remoteDir);
  commitAll(remoteDir, "Add canvas extension container");
  runGit(remoteDir, "tag", "-a", "v1.0.0", "-m", "release 1.0.0");

  const repoDir = cloneSubmissionRepo(remoteDir, "v1.0.0");
  const plugin = {
    name: "tag-plugin",
    keywords: ["canvas"],
    source: { source: "github", repo: "owner/repo", ref: "v1.0.0" },
  };

  const result = runCanvasStructureGate(repoDir, plugin, "v1.0.0");
  assert.equal(result.status, "pass", result.output);
  assert.match(result.output, /- v1\.0\.0: found "com\.github\.copilot\/extensions"/);
});

test("runRefShaConsistencyGate 在 ref 與 sha 指向不同提交時失敗", () => {
  const remoteDir = initRemoteRepo();
  writeValidPluginContent(remoteDir);
  const firstSha = commitAll(remoteDir, "Add plugin manifest v1");
  runGit(remoteDir, "tag", "-a", "v1.0.0", "-m", "release 1.0.0");
  fs.writeFileSync(path.join(remoteDir, "README.md"), "v2\n");
  const secondSha = commitAll(remoteDir, "Add plugin manifest v2");

  const repoDir = cloneSubmissionRepo(remoteDir, secondSha);
  const plugin = {
    name: "tag-plugin",
    source: { source: "github", repo: "owner/repo", ref: "v1.0.0", sha: secondSha },
  };

  const result = runRefShaConsistencyGate(repoDir, plugin, secondSha);
  assert.equal(result.status, "fail", result.output);
  assert.match(result.output, new RegExp(`resolves to "${firstSha}"`));
});

test("runRefShaConsistencyGate 在 ref 與 sha 指向同一提交時通過", () => {
  const remoteDir = initRemoteRepo();
  writeValidPluginContent(remoteDir);
  const sha = commitAll(remoteDir, "Add plugin manifest");
  runGit(remoteDir, "tag", "-a", "v1.0.0", "-m", "release 1.0.0");

  const repoDir = cloneSubmissionRepo(remoteDir, sha);
  const plugin = {
    name: "tag-plugin",
    source: { source: "github", repo: "owner/repo", ref: "v1.0.0", sha },
  };

  const result = runRefShaConsistencyGate(repoDir, plugin, sha);
  assert.equal(result.status, "pass", result.output);
});
