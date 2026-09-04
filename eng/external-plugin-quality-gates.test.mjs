import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { after, test } from "node:test";
import { runCanvasStructureGate, runRefShaConsistencyGate, runVersionMatchGate } from "./external-plugin-quality-gates.mjs";

const tempDirs = [];

after(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function runGit(repoDir, ...args) {
  const result = spawnSync("git", args, { cwd: repoDir, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stdout}\n${result.stderr}`);
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

test("runCanvasStructureGate passes when a named extension exists", () => {
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

test("runCanvasStructureGate fails when extension entrypoint is only at repo root", () => {
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

test("runCanvasStructureGate fails when the named extension entrypoint path is a directory", () => {
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

test("runCanvasStructureGate fails when the Copilot namespace is missing", () => {
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

test("runCanvasStructureGate fails when no extension.mjs exists in a named directory", () => {
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

test("runCanvasStructureGate finds a nested extension listed past the legacy output cap", () => {
  const repoDir = createTempRepo();
  // 眾多同層目錄會將真正的 extension 推移超出先前截斷實作所套用的約 12 KB stdout 上限，
  // 導致其從列表中被無聲無息地丟棄。
  // 長名稱會放大每筆 git ls-tree 記錄，因此只需較少目錄即可超出上限。
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

// Issue #2397 的迴歸測試：tag 名稱定位項 (例如 "v1.0.0") 必須可被
// version-match 與 canvas-structure 關卡讀取。`git fetch origin <tag>`
// 僅會更新 FETCH_HEAD，絕不會在本地建立 `refs/tags/<tag>`，因此透過
// `git show <tag>:...` 讀取過去會因 "fatal: invalid object name" 而終止，並累積成
// 虛假的 infra_error/fail，即使引用的內容是有效的。

function initRemoteRepo() {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "external-plugin-quality-remote-"));
  tempDirs.push(repoDir);
  runGit(repoDir, "init", "-q");
  runGit(repoDir, "config", "user.name", "Copilot Test");
  runGit(repoDir, "config", "user.email", "copilot@example.com");
  // 鏡像 github.com：允許提交存放庫 shallow-fetch 任意 SHA。
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

// 鏡像 external-plugin-quality-gates.mjs 中的 cloneSubmissionRepository：僅擷取主要定位項
// 並將 HEAD detach 到其上。刻意不在本地建立 tag ref，
// 重現 `git show <tag>:...` 失敗的 CI 環境。
function cloneSubmissionRepo(remoteDir, primaryFetchSpec) {
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "external-plugin-quality-sub-"));
  tempDirs.push(repoDir);
  runGit(repoDir, "init", "-q");
  runGit(repoDir, "remote", "add", "origin", remoteDir);
  runGit(repoDir, "fetch", "--depth=1", "origin", primaryFetchSpec);
  runGit(repoDir, "checkout", "--detach", "FETCH_HEAD");
  return repoDir;
}

test("runVersionMatchGate passes for a tag ref alongside a sha", () => {
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
  // tag ref 與 sha 皆必須通過驗證。
  assert.match(result.output, /- v1\.0\.0: matched version "1\.0\.0"/);
  assert.match(result.output, new RegExp(`- ${sha}: matched version "1\\.0\\.0"`));
});

test("runCanvasStructureGate passes for a tag ref alongside a sha", () => {
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

test("runVersionMatchGate passes when the primary locator is a tag ref", () => {
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

test("runCanvasStructureGate passes when the primary locator is a tag ref", () => {
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

test("runRefShaConsistencyGate fails when ref and sha point to different commits", () => {
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

test("runRefShaConsistencyGate passes when ref and sha point to the same commit", () => {
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
