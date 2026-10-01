import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";
import {
  canRunPrCommand,
  classifyFailure,
  classifyRisk,
  computeState,
  evaluateApprovals,
  evaluateCheck,
  evaluateSubmission,
  globToRegExp,
  latestRunsByWorkflow,
  loadGateConfig,
  normalizeRouting,
  publishGateCheck,
  GATE_CHECK_EXTERNAL_ID,
  parsePrCommand,
  renderStatusComment,
  rerunChecks,
  resolvePullRequestForWorkflowRun,
  riskLabelSignature,
  runPrCommand,
  validatePrCommandRequest,
  PR_COMMAND_SCHEMA,
  sanitize,
  selectApplicableChecks,
  STATUS_MARKER,
  summarizeChecks,
  syncPullRequestStatus,
} from "./submission-gate.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = loadGateConfig(repoRoot);
const tiers = config.tiers;

const file = (filename, extra = {}) => ({ filename, status: "modified", additions: 1, deletions: 1, changes: 2, patch: "+x\n-y", ...extra });
const review = (login, state, submitted_at = "2026-09-29T10:00:00Z", extra = {}) => ({
  user: { login, type: "User" },
  state,
  submitted_at,
  ...extra,
});

// --- 萬用字元 ---------------------------------------------------------------

test("globToRegExp 遵循 GitHub 路徑篩選語義", () => {
  assert.ok(globToRegExp("skills/**").test("skills/a/SKILL.md"));
  assert.ok(globToRegExp("*.js").test("index.js"));
  assert.ok(!globToRegExp("*.js").test("eng/index.js"));
  assert.ok(globToRegExp("**/mcp.json").test("mcp.json"));
  assert.ok(globToRegExp("**/mcp.json").test("plugins/x/mcp.json"));
  assert.ok(globToRegExp("plugins/**/skills/**").test("plugins/p/skills/s/SKILL.md"));
  assert.ok(!globToRegExp("docs/**").test("docsx/a.md"));
});

// --- 設定漂移 --------------------------------------------------------------

test("check 路徑與分支篩選器與其 workflow 觸發條件保持一致", () => {
  for (const check of config.gate.checks.filter((candidate) => candidate.workflow)) {
    const workflowPath = path.join(repoRoot, ".github", "workflows", check.workflow);
    assert.ok(fs.existsSync(workflowPath), `${check.id}: ${check.workflow} 不存在`);
    const workflow = yaml.load(fs.readFileSync(workflowPath, "utf8"));
    const on = workflow.on ?? workflow[true];
    const trigger = on?.pull_request;
    assert.ok(on && Object.prototype.hasOwnProperty.call(on, "pull_request"), `${check.id}: ${check.workflow} 必須在 pull_request 時觸發`);
    // 沒有路徑篩選的 workflow 會回報每個 PR，因此 gate 可以縮窄其適用範圍。
    if (trigger?.paths) {
      assert.deepEqual([...(check.paths || [])].sort(), [...trigger.paths].sort(), `${check.id}: paths 已與 ${check.workflow} 漂移`);
    }
    // validate-agentic-workflows-pr.yml 拒絕任何 `.github/**` 變更，因此它無法因自身檔案而觸發。
    const selfPathExempt = ["validate-submission-gate.yml", "validate-agentic-workflows-pr.yml"];
    if (check.paths && !selfPathExempt.includes(check.workflow)) {
      assert.ok(
        check.paths.includes(`.github/workflows/${check.workflow}`),
        `${check.id}: paths 應包含其自身的 workflow 檔案`
      );
    }
    assert.deepEqual(check.branches || [], trigger?.branches || [], `${check.id}: branches 已與 ${check.workflow} 漂移`);
  }
});

test("每個 check 都有唯一的 id，以及 workflow 或 check 名稱", () => {
  const ids = new Set();
  for (const check of config.gate.checks) {
    assert.ok(check.id && !ids.has(check.id), `重複或缺失的 id ${check.id}`);
    ids.add(check.id);
    assert.ok(check.workflow || check.check_name, `${check.id} 需要 workflow 或 check_name`);
  }
  assert.ok(config.gate.checks.some((check) => check.check_name === "canvas-smoke-test" && check.optional));
});

test("selectApplicableChecks 遵循路徑與基底分支", () => {
  const ids = (files, base = "main") => selectApplicableChecks(config.gate.checks, files, base).map((check) => check.id);
  const docs = ids([file("docs/README.skills.md")]);
  assert.ok(docs.includes("line-endings"));
  assert.ok(docs.includes("readme"));
  assert.ok(!docs.includes("skill-validation"));
  assert.ok(!docs.includes("canvas-smoke-test"));

  const skill = ids([file("skills/foo/SKILL.md", { status: "added" })]);
  assert.ok(skill.includes("skill-validation"));
  assert.ok(skill.includes("risk-scan"));

  const canvas = ids([file("extensions/board/extension.mjs")]);
  assert.ok(canvas.includes("canvas-extension-validation"));
  assert.ok(canvas.includes("canvas-smoke-test"));

  const renamed = ids([file("docs/x.md", { status: "renamed", previous_filename: "skills/x/SKILL.md" })]);
  assert.ok(renamed.includes("skill-validation"), "前一個檔案名稱也計入路徑篩選");

  const otherBase = ids([file("skills/foo/SKILL.md")], "staged");
  assert.ok(!otherBase.includes("skill-validation"));
  assert.ok(otherBase.includes("contributor-reputation"));
});

// --- 風險等級 ------------------------------------------------------------------

test("文件與產生的輸出屬於低風險", () => {
  const result = classifyRisk({
    files: [file("docs/README.skills.md", { changes: 400 }), file(".github/plugin/marketplace.json", { changes: 90 })],
    tiers,
  });
  assert.equal(result.tier, "low");
});

test("對現有資源的小幅修改屬於低風險", () => {
  const result = classifyRisk({ files: [file("skills/foo/SKILL.md", { changes: 10 })], tiers });
  assert.equal(result.tier, "low");
});

test("大型更新或新增資源屬於中風險", () => {
  assert.equal(classifyRisk({ files: [file("skills/foo/SKILL.md", { changes: 300 })], tiers }).tier, "medium");
  assert.equal(
    classifyRisk({ files: [file("agents/new.agent.md", { status: "added", changes: 5 })], tiers }).tier,
    "medium"
  );
  assert.equal(
    classifyRisk({
      files: [file("extensions/board/extension.mjs", { status: "added", patch: "+export default {}\n+const x = 1;" })],
      tiers,
    }).tier,
    "medium"
  );
});

test("儲存庫的 workflows、腳本、MCP 設定與政策檔案屬於高風險", () => {
  for (const name of [
    ".github/workflows/ci.yml",
    ".github/CODEOWNERS",
    ".github/review-routing.yml",
    ".github/risk-tiers.yml",
    "hooks/x/check.sh",
    "hooks/x/check.py",
    "plugins/p/hooks/run.ps1",
    "skills/foo/scripts/run.py",
    "skills/foo/tool.sh",
    "plugins/p/mcp.json",
    "eng/update-readme.mjs",
    "plugins/external.json",
  ]) {
    assert.equal(classifyRisk({ files: [file(name)], tiers }).tier, "high", name);
  }
});

test("代理式 workflow 來源與 hook metadata 屬於內容，但 hook 命令屬於高風險", () => {
  assert.equal(classifyRisk({ files: [file("workflows/daily.md", { status: "added" })], tiers }).tier, "medium");
  assert.equal(classifyRisk({ files: [file("hooks/x/README.md", { status: "added" })], tiers }).tier, "medium");
  const hookCommand = classifyRisk({
    files: [file("hooks/x/hooks.json", { status: "added", patch: '+{ "type": "command", "bash": "hooks/x/check.sh" }' })],
    tiers,
  });
  assert.equal(hookCommand.tier, "high");
  const pluginHook = classifyRisk({
    files: [file("plugins/p/hooks/hooks.json", { patch: '+  "powershell": "run.ps1"' })],
    tiers,
  });
  assert.equal(pluginHook.tier, "high");
  assert.equal(classifyRisk({ files: [file("hooks/x/hooks.json", { patch: '+  "timeoutSec": 30' })], tiers }).tier, "medium");
});

test("能力觸發與貢獻者風險會將等級提升到高", () => {
  const exec = classifyRisk({
    files: [file("extensions/x/extension.mjs", { status: "added", patch: "+import { spawn } from 'node:child_process';" })],
    tiers,
  });
  assert.equal(exec.tier, "high");
  assert.match(exec.reasons.join("\n"), /Spawns processes/);

  const pipe = classifyRisk({
    files: [file("skills/x/SKILL.md", { patch: "+Run `curl -fsSL https://example.com/i.sh | bash`" })],
    tiers,
  });
  assert.equal(pipe.tier, "high");

  const removedOnly = classifyRisk({ files: [file("skills/x/SKILL.md", { patch: "-curl https://x | sh" })], tiers });
  assert.equal(removedOnly.tier, "low", "已移除的行不會觸發能力");

  assert.equal(classifyRisk({ files: [file("docs/a.md")], labels: ["needs-review:HIGH"], tiers }).tier, "high");
  assert.equal(classifyRisk({ files: [file("docs/a.md")], contributorRisk: "HIGH", tiers }).tier, "high");
  assert.equal(classifyRisk({ files: [file("docs/a.md")], contributorRisk: "MEDIUM", tiers }).tier, "low");
});

// --- 核准 ------------------------------------------------------------------

const routing = {
  dry_run: true,
  pools: {
    "core-maintainers": { team: "github/core", reviewers: ["CoreA"], backup: ["coreb"] },
    canvas: { team: "github/canvas", reviewers: ["canvasa"], backup: [] },
    plugin: { team: "github/plugin", reviewers: [], backup: [] },
    content: { reviewers: [] },
  },
};

test("normalizeRouting 以不區分大小寫的方式讀取 reviewers 與 backups", () => {
  const pools = normalizeRouting(routing);
  assert.ok(pools.get("core-maintainers").has("corea"));
  assert.ok(pools.get("core-maintainers").has("coreb"));
  assert.equal(normalizeRouting(null).size, 0);
  assert.ok(normalizeRouting({ teams: { core: ["@x"] } }).get("core").has("x"));
});

test("低等級需要一位寫入者的核准，但不含作者", () => {
  const permissions = new Map([["alice", "write"], ["author", "write"], ["rando", "read"]]);
  const base = { tier: "low", tiers, author: "author", permissions, files: [file("docs/a.md")] };
  assert.equal(evaluateApprovals({ ...base, reviews: [review("author", "APPROVED")] }).satisfied, false);
  assert.equal(evaluateApprovals({ ...base, reviews: [review("rando", "APPROVED")] }).satisfied, false);
  assert.equal(evaluateApprovals({ ...base, reviews: [review("alice", "APPROVED")] }).satisfied, true);
});

test("最新的 review 狀態生效，且要求變更會阻擋", () => {
  const permissions = new Map([["alice", "write"], ["bob", "write"]]);
  const base = { tier: "low", tiers, author: "author", permissions, files: [file("docs/a.md")] };
  const dismissed = evaluateApprovals({
    ...base,
    reviews: [review("alice", "APPROVED", "2026-09-29T10:00:00Z"), review("alice", "DISMISSED", "2026-09-29T11:00:00Z")],
  });
  assert.equal(dismissed.satisfied, false);
  const commentAfterApproval = evaluateApprovals({
    ...base,
    reviews: [review("alice", "APPROVED", "2026-09-29T10:00:00Z"), review("alice", "COMMENTED", "2026-09-29T11:00:00Z")],
  });
  assert.equal(commentAfterApproval.satisfied, true);
  const blocked = evaluateApprovals({
    ...base,
    reviews: [review("alice", "APPROVED"), review("bob", "CHANGES_REQUESTED")],
  });
  assert.equal(blocked.satisfied, false);
  assert.deepEqual(blocked.changesRequestedBy, ["bob"]);
});

test("中等級在 pool 有人手配置時需要領域 reviewer", () => {
  const permissions = new Map([["alice", "write"], ["canvasa", "write"]]);
  const files = [file("extensions/x/extension.mjs", { status: "added" })];
  const base = { tier: "medium", tiers, author: "author", permissions, routing, files };
  assert.equal(evaluateApprovals({ ...base, reviews: [review("alice", "APPROVED")] }).satisfied, false);
  assert.equal(evaluateApprovals({ ...base, reviews: [review("canvasa", "APPROVED")] }).satisfied, true);
  assert.equal(evaluateApprovals({ ...base, reviews: [review("corea", "APPROVED")] }).satisfied, true, "core 算作領域");

  const unstaffed = evaluateApprovals({
    ...base,
    files: [file("plugins/p/README.md", { status: "added" })],
    reviews: [review("alice", "APPROVED")],
  });
  assert.equal(unstaffed.satisfied, true, "領域 pool 為空時回落到任何寫入者");
  assert.ok(unstaffed.notes.length > 0);

  const noRouting = evaluateApprovals({ ...base, routing: null, reviews: [review("alice", "APPROVED")] });
  assert.equal(noRouting.satisfied, true);
});

test("高等級需要包含一位核心維護者在內的兩個核准", () => {
  const permissions = new Map([["alice", "write"], ["bob", "write"], ["corea", "write"], ["admin1", "admin"]]);
  const files = [file(".github/workflows/x.yml")];
  const base = { tier: "high", tiers, author: "author", permissions, routing, files };
  assert.equal(evaluateApprovals({ ...base, reviews: [review("corea", "APPROVED")] }).satisfied, false);
  assert.equal(evaluateApprovals({ ...base, reviews: [review("alice", "APPROVED"), review("bob", "APPROVED")] }).satisfied, false);
  assert.equal(evaluateApprovals({ ...base, reviews: [review("alice", "APPROVED"), review("corea", "APPROVED")] }).satisfied, true);

  const fallback = { ...base, routing: null };
  assert.equal(evaluateApprovals({ ...fallback, reviews: [review("alice", "APPROVED"), review("bob", "APPROVED")] }).satisfied, false);
  assert.equal(evaluateApprovals({ ...fallback, reviews: [review("alice", "APPROVED"), review("admin1", "APPROVED")] }).satisfied, true);
});

// --- 檢查（checks）--------------------------------------------------------------

const readmeCheck = config.gate.checks.find((check) => check.id === "readme");
const infraSteps = config.gate.infrastructure_steps;
const failedJob = (stepName) => [
  {
    name: "job",
    conclusion: "failure",
    steps: [
      { name: "Set up job", conclusion: "success" },
      { name: stepName, conclusion: "failure" },
    ],
  },
];

test("失敗的步驟會分類為貢獻失敗或基礎設施失敗", () => {
  assert.equal(classifyFailure(readmeCheck, failedJob("Fail workflow if files need updating"), infraSteps).category, "contribution");
  assert.equal(classifyFailure(readmeCheck, failedJob("Install dependencies"), infraSteps).category, "infrastructure");
  assert.equal(classifyFailure(readmeCheck, failedJob("Checkout code"), infraSteps).category, "infrastructure");
  assert.equal(classifyFailure(readmeCheck, failedJob("Something new"), infraSteps).category, "contribution");
  assert.equal(classifyFailure(readmeCheck, [{ name: "job", conclusion: "timed_out", steps: [] }], infraSteps).category, "infrastructure");
  assert.equal(classifyFailure({ failure_kind: "infrastructure" }, [], infraSteps).category, "infrastructure");
  assert.equal(classifyFailure(readmeCheck, [], infraSteps).category, "infrastructure");
});

test("evaluateCheck 將執行狀態映射到 gate 結果", () => {
  const check = { id: "x", title: "X", hint: "fix it" };
  assert.equal(evaluateCheck(check, { found: false }).outcome, "pending");
  assert.equal(evaluateCheck(check, { found: false }, { gaveUp: true }).category, "infrastructure");
  assert.equal(evaluateCheck({ ...check, optional: true }, { found: false }, { gaveUp: true }).outcome, "skipped");
  assert.equal(evaluateCheck(check, { found: true, status: "in_progress" }).outcome, "pending");
  assert.equal(evaluateCheck(check, { found: true, status: "in_progress" }, { gaveUp: true }).category, "infrastructure");
  assert.equal(evaluateCheck(check, { found: true, status: "completed", conclusion: "success" }).outcome, "pass");
  const skipped = evaluateCheck(check, { found: true, status: "completed", conclusion: "skipped" });
  assert.equal(skipped.outcome, "failure", "被跳過的必需 check 什麼都沒驗證");
  assert.equal(skipped.category, "infrastructure");
  const skippedOk = { found: true, status: "completed", conclusion: "skipped" };
  assert.equal(evaluateCheck({ ...check, allow_skip: true }, skippedOk).outcome, "skipped");
  assert.equal(evaluateCheck({ ...check, optional: true }, skippedOk).outcome, "skipped");
  assert.equal(evaluateCheck({ ...check, required: false }, skippedOk).outcome, "skipped");
  assert.equal(config.gate.checks.find((c) => c.id === "contributor-reputation").allow_skip, true, "bot 作者的跳過");
  assert.equal(evaluateCheck(check, { found: true, status: "completed", conclusion: "cancelled" }).category, "infrastructure");
  assert.equal(evaluateCheck(check, { found: true, status: "completed", conclusion: "action_required" }).category, "infrastructure");
  const advisory = evaluateCheck({ ...check, required: false, failure_kind: "infrastructure" }, { found: true, status: "completed", conclusion: "failure" });
  assert.equal(advisory.required, false);
  assert.equal(summarizeChecks([advisory]).warnings.length, 1);
  assert.equal(summarizeChecks([advisory]).infrastructureFailures.length, 0, "建議性失敗永遠不會阻擋");
});

test("狀態機優先順序", () => {
  const approvals = { changesRequestedBy: [], satisfied: false, reviewers: [] };
  const automation = (overrides = {}) => ({ contributionFailures: [], pending: [], infrastructureFailures: [], ...overrides });
  assert.equal(computeState({ automation: automation({ contributionFailures: [{}], pending: [{}] }), approvals }), "requires-submitter-fixes");
  assert.equal(computeState({ automation: automation(), approvals: { ...approvals, changesRequestedBy: ["x"] } }), "requires-submitter-fixes");
  assert.equal(computeState({ automation: automation({ pending: [{}] }), approvals: { ...approvals, satisfied: true } }), "awaiting-automation");
  assert.equal(computeState({ automation: automation({ infrastructureFailures: [{}] }), approvals }), "awaiting-automation");
  assert.equal(computeState({ automation: automation(), approvals: { ...approvals, satisfied: true } }), "approved");
  assert.equal(computeState({ automation: automation(), approvals: { ...approvals, reviewers: ["a"] } }), "review-in-progress");
  assert.equal(computeState({ automation: automation(), approvals }), "ready-for-review");
});

test("latestRunsByWorkflow 對每個 workflow 保留最新的 PR 觸發執行", () => {
  const latest = latestRunsByWorkflow([
    { id: 1, path: ".github/workflows/a.yml", event: "pull_request", created_at: "2026-09-29T10:00:00Z" },
    { id: 2, path: ".github/workflows/a.yml", event: "pull_request", created_at: "2026-09-29T11:00:00Z" },
    { id: 3, path: ".github/workflows/b.yml", event: "push", created_at: "2026-09-29T12:00:00Z" },
  ]);
  assert.equal(latest.get("a.yml").id, 2);
  assert.ok(!latest.has("b.yml"));
});

// --- 命令與渲染 ------------------------------------------------------------

test("parsePrCommand 只接受留言開頭的支援命令", () => {
  assert.deepEqual(parsePrCommand("/rerun-checks"), { command: "rerun-checks" });
  assert.deepEqual(parsePrCommand("/Request-Review please\nthanks"), { command: "request-review" });
  assert.equal(parsePrCommand("\n/rerun-checks"), null, "符合 workflow 的 startsWith 篩選");
  assert.equal(parsePrCommand("  /rerun-checks"), null);
  assert.equal(parsePrCommand("please /rerun-checks"), null);
  assert.equal(parsePrCommand("/rerun-checksx"), null);
  assert.equal(parsePrCommand(""), null);
});

test("canRunPrCommand 只允許作者與寫入者", () => {
  assert.ok(canRunPrCommand({ commenter: "Author", prAuthor: "author", permission: "read" }));
  assert.ok(canRunPrCommand({ commenter: "m", prAuthor: "author", permission: "maintain" }));
  assert.ok(!canRunPrCommand({ commenter: "x", prAuthor: "author", permission: "triage" }));
  assert.ok(!canRunPrCommand({ commenter: "", prAuthor: "", permission: "read" }));
});

test("sanitize 會中和提及、HTML 與表格換行", () => {
  assert.equal(sanitize("@team <b>|x"), "@\u200bteam &lt;b&gt;\\|x");
  assert.equal(sanitize("a".repeat(10), 5).length, 5);
});

// --- 使用假定的 GitHub 用戶端進行協調 ---------------------------------------

function fakeGithub({ pr, files = [], reviews = [], runs = [], jobs = {}, checkRuns = [], comments = [], reactions = [], permissions = {} }) {
  const calls = [];
  const record = (name, fn) => async (params) => {
    calls.push({ name, params });
    return fn(params);
  };
  const rest = {
    pulls: {
      get: record("pulls.get", async ({ pull_number }) => ({ data: { ...pr, number: pull_number } })),
      listFiles: "pulls.listFiles",
      listReviews: "pulls.listReviews",
      list: "pulls.list",
    },
    actions: {
      listWorkflowRunsForRepo: "actions.listWorkflowRunsForRepo",
      listJobsForWorkflowRun: "actions.listJobsForWorkflowRun",
      getJobForWorkflowRun: record("actions.getJobForWorkflowRun", async () => {
        throw Object.assign(new Error("nope"), { status: 404 });
      }),
      reRunWorkflowFailedJobs: record("actions.reRunWorkflowFailedJobs", async () => ({})),
      reRunWorkflow: record("actions.reRunWorkflow", async () => ({})),
      createWorkflowDispatch: record("actions.createWorkflowDispatch", async () => ({})),
    },
    checks: {
      listForRef: record("checks.listForRef", async ({ check_name }) => ({
        data: { check_runs: checkRuns.filter((checkRun) => !check_name || checkRun.name === check_name) },
      })),
      create: record("checks.create", async () => ({ data: { id: 999 } })),
      update: record("checks.update", async () => ({ data: {} })),
    },
    repos: {
      getCollaboratorPermissionLevel: record("repos.getCollaboratorPermissionLevel", async ({ username }) => ({
        data: { permission: permissions[username] || "read" },
      })),
    },
    issues: {
      addLabels: record("issues.addLabels", async () => ({})),
      removeLabel: record("issues.removeLabel", async () => ({})),
      listComments: "issues.listComments",
      updateComment: record("issues.updateComment", async () => ({})),
      createComment: record("issues.createComment", async () => ({})),
      getComment: record("issues.getComment", async ({ comment_id }) => {
        const found = comments.find((comment) => comment.id === comment_id);
        if (!found) throw Object.assign(new Error("Not Found"), { status: 404 });
        return { data: found };
      }),
    },
    reactions: {
      listForIssueComment: "reactions.listForIssueComment",
      createForIssueComment: record("reactions.createForIssueComment", async () => ({})),
    },
  };
  const pages = {
    "pulls.listFiles": files,
    "pulls.listReviews": reviews,
    "pulls.list": [pr],
    "actions.listWorkflowRunsForRepo": runs,
    "issues.listComments": comments,
    "reactions.listForIssueComment": reactions,
  };
  return {
    calls,
    rest,
    paginate: async (method, params) => {
      calls.push({ name: method, params });
      if (method === "actions.listJobsForWorkflowRun") return jobs[params.run_id] || [];
      return pages[method] || [];
    },
  };
}

const basePr = {
  number: 7,
  state: "open",
  head: { sha: "a".repeat(40), ref: "feature", repo: { full_name: "fork/awesome-copilot" } },
  base: { ref: "main", repo: { full_name: "github/awesome-copilot" } },
  user: { login: "author" },
  labels: [{ name: "review-due:2026-10-01" }, { name: "merge-risk:high" }],
  requested_reviewers: [{ login: "alice" }],
  requested_teams: [],
};

const run = (id, workflow, conclusion, status = "completed") => ({
  id,
  path: `.github/workflows/${workflow}`,
  name: workflow,
  event: "pull_request",
  status,
  conclusion,
  created_at: "2026-09-29T10:00:00Z",
  html_url: `https://example.test/runs/${id}`,
});

test("checks 通過且核准存在時，evaluateSubmission 達到 approved", async () => {
  const github = fakeGithub({
    pr: basePr,
    files: [file("docs/a.md")],
    reviews: [review("alice", "APPROVED")],
    permissions: { alice: "write" },
    runs: [
      run(1, "check-line-endings.yml", "success"),
      run(90, "codespell.yml", "success"),
      run(2, "validate-readme.yml", "success"),
      run(3, "contributor-check.yml", "success"),
      run(4, "pr-duplicate-check.lock.yml", "failure"),
      run(5, "pr-quality-signal.lock.yml", "skipped"),
    ],
  });
  const evaluation = await evaluateSubmission(github, {
    owner: "github",
    repo: "awesome-copilot",
    pullNumber: 7,
    config,
    readContributorRisk: () => "LOW",
  });
  assert.equal(evaluation.risk.tier, "low");
  assert.equal(evaluation.state, "approved");
  assert.equal(evaluation.passed, true);
  assert.equal(evaluation.automation.warnings.length, 1, "重複掃描的基礎設施失敗屬於建議性");
  assert.equal(evaluation.reviewAssignment.due, "2026-10-01");

  await syncPullRequestStatus(github, { owner: "github", repo: "awesome-copilot", evaluation });
  const added = github.calls.find((call) => call.name === "issues.addLabels");
  assert.deepEqual(added.params.labels.sort(), ["approved", "merge-risk:low"]);
  const removed = github.calls.filter((call) => call.name === "issues.removeLabel").map((call) => call.params.name);
  assert.deepEqual(removed, ["merge-risk:high"]);
  const created = github.calls.find((call) => call.name === "issues.createComment");
  assert.ok(created.params.body.startsWith(STATUS_MARKER));
});

test("evaluateSubmission 區分貢獻失敗與基礎設施失敗", async () => {
  const github = fakeGithub({
    pr: basePr,
    files: [file("skills/x/SKILL.md", { status: "added" })],
    runs: [
      run(1, "check-line-endings.yml", "success"),
      run(90, "codespell.yml", "success"),
      run(2, "validate-readme.yml", "failure"),
      run(3, "contributor-check.yml", "success"),
      run(4, "validate-skills.yml", "failure"),
      run(5, "skill-check.yml", "success"),
      run(6, "pr-risk-scan.yml", "cancelled"),
    ],
    jobs: {
      2: failedJob("Fail workflow if files need updating"),
      4: failedJob("Install dependencies"),
    },
  });
  const evaluation = await evaluateSubmission(github, {
    owner: "github",
    repo: "awesome-copilot",
    pullNumber: 7,
    config,
    finalized: true,
    readContributorRisk: () => null,
  });
  assert.deepEqual(evaluation.automation.contributionFailures.map((r) => r.id), ["readme"]);
  assert.deepEqual(
    evaluation.automation.infrastructureFailures.map((r) => r.id).sort(),
    ["risk-scan", "skill-validation"]
  );
  assert.equal(evaluation.state, "requires-submitter-fixes");
  const body = renderStatusComment(evaluation);
  assert.match(body, /Contribution failure/);
  assert.match(body, /Infrastructure failure/);
  assert.match(body, /npm start/);
  assert.match(body, /\/rerun-checks/);
  assert.match(body, /2026-10-01/);
});

test("evaluateSubmission 在 gate 模式下等待暫止中的 checks", async () => {
  let clock = 0;
  let polls = 0;
  const runs = [
    run(1, "check-line-endings.yml", null, "in_progress"),
    run(90, "codespell.yml", "success"),
    run(3, "contributor-check.yml", "success"),
    run(4, "pr-duplicate-check.lock.yml", "success"),
    run(5, "pr-quality-signal.lock.yml", "success"),
  ];
  const github = fakeGithub({ pr: basePr, files: [file("LICENSE")], runs });
  const originalPaginate = github.paginate;
  github.paginate = async (method, params) => {
    if (method === "actions.listWorkflowRunsForRepo") {
      polls += 1;
      if (polls >= 2) runs[0] = run(1, "check-line-endings.yml", "success");
    }
    return originalPaginate(method, params);
  };
  const evaluation = await evaluateSubmission(github, {
    owner: "github",
    repo: "awesome-copilot",
    pullNumber: 7,
    config,
    wait: true,
    now: () => clock,
    sleep: async (ms) => {
      clock += ms;
    },
    readContributorRisk: () => null,
  });
  assert.equal(polls, 2);
  assert.equal(evaluation.automation.pending.length, 0);
  assert.equal(evaluation.state, "ready-for-review");
});

test("未回報的必需 checks 在寬限期後成為基礎設施失敗", async () => {
  let clock = 0;
  const github = fakeGithub({ pr: basePr, files: [file("LICENSE")], runs: [run(3, "contributor-check.yml", "success")] });
  const evaluation = await evaluateSubmission(github, {
    owner: "github",
    repo: "awesome-copilot",
    pullNumber: 7,
    config,
    wait: true,
    now: () => clock,
    sleep: async (ms) => {
      clock += ms;
    },
    readContributorRisk: () => null,
  });
  const lineEndings = evaluation.automation.results.find((result) => result.id === "line-endings");
  assert.equal(lineEndings.category, "infrastructure");
  assert.ok(clock >= config.gate.wait.report_grace_minutes * 60_000);
  assert.ok(clock < config.gate.wait.timeout_minutes * 60_000);
});

test("rerunChecks 重新執行失敗的 workflows 與 gate，但略過受核准把關的執行", async () => {
  const github = fakeGithub({
    pr: basePr,
    runs: [
      run(1, "validate-readme.yml", "failure"),
      run(2, "check-line-endings.yml", "success"),
      run(3, "contributor-check.yml", "action_required"),
      run(4, "submission-gate.yml", "failure"),
      run(5, "pr-risk-scan.yml", null, "in_progress"),
    ],
  });
  const result = await rerunChecks(github, { owner: "github", repo: "awesome-copilot", headSha: basePr.head.sha });
  assert.deepEqual(result.rerun, ["validate-readme.yml", "submission-gate.yml"]);
  assert.equal(result.skipped.length, 1);
  assert.ok(github.calls.some((call) => call.name === "actions.reRunWorkflow" && call.params.run_id === 4));
});

test("syncPullRequestStatus 將狀態 labels 留給外部 plugin 接收，並就地更新留言", async () => {
  const pr = { ...basePr, labels: [{ name: "external-plugin" }, { name: "ready-for-review" }] };
  const github = fakeGithub({
    pr,
    comments: [
      { id: 1, user: { login: "someone" }, body: STATUS_MARKER },
      { id: 2, user: { login: "github-actions[bot]" }, body: `${STATUS_MARKER}\nold` },
    ],
  });
  const evaluation = {
    pr,
    headSha: pr.head.sha,
    labels: ["external-plugin", "ready-for-review"],
    risk: { tier: "high", reasons: ["`plugins/external.json` is a high-risk path"] },
    automation: summarizeChecks([]),
    approvals: { required: 2, requirement: "2 approvals", approvers: [], changesRequestedBy: [], reviewers: [], missing: ["2 more approval(s)"], notes: [], satisfied: false },
    state: "awaiting-automation",
    reviewAssignment: { users: [], teams: [], due: null },
  };
  await syncPullRequestStatus(github, { owner: "github", repo: "awesome-copilot", evaluation });
  assert.deepEqual(github.calls.find((call) => call.name === "issues.addLabels").params.labels, ["merge-risk:high"]);
  assert.ok(!github.calls.some((call) => call.name === "issues.removeLabel"));
  const updated = github.calls.find((call) => call.name === "issues.updateComment");
  assert.equal(updated.params.comment_id, 2);
  assert.ok(!github.calls.some((call) => call.name === "issues.createComment"));
});

test("resolvePullRequestForWorkflowRun 需要精確的 head 相符", async () => {
  const github = fakeGithub({ pr: basePr });
  const workflowRun = {
    head_sha: basePr.head.sha,
    head_branch: "feature",
    head_repository: { full_name: "fork/awesome-copilot" },
    pull_requests: [],
  };
  assert.equal(await resolvePullRequestForWorkflowRun(github, { owner: "github", repo: "awesome-copilot", workflowRun }), 7);
  assert.equal(
    await resolvePullRequestForWorkflowRun(github, {
      owner: "github",
      repo: "awesome-copilot",
      workflowRun: { ...workflowRun, head_sha: "b".repeat(40) },
    }),
    null
  );
});

// --- 審查強化 ------------------------------------------------------------

test("沒有可掃描 diff 的文字檔案或被截斷的檔案清單會 fail closed 為高", () => {
  const noPatch = classifyRisk({ files: [file("extensions/x/extension.mjs", { patch: undefined })], tiers });
  assert.equal(noPatch.tier, "high");
  assert.match(noPatch.reasons.join("\n"), /no diff available/);
  assert.equal(classifyRisk({ files: [file("skills/x/guide.pdf", { patch: undefined, status: "added" })], tiers }).tier, "medium");
  assert.equal(classifyRisk({ files: [file("docs/a.md", { patch: undefined })], tiers }).tier, "low", "超出能力範圍");
  assert.equal(classifyRisk({ files: [file("docs/a.md")], tiers, incompleteFiles: true }).tier, "high");
});

test("低等級需要變更資源的 owner 核准", () => {
  const permissions = new Map([["alice", "write"], ["canvasa", "write"], ["corea", "write"]]);
  const base = { tier: "low", tiers, author: "author", permissions, routing };
  const canvas = { ...base, files: [file("extensions/x/README.md")] };
  assert.equal(evaluateApprovals({ ...canvas, reviews: [review("alice", "APPROVED")] }).satisfied, false);
  assert.equal(evaluateApprovals({ ...canvas, reviews: [review("canvasa", "APPROVED")] }).satisfied, true);
  const docs = { ...base, files: [file("docs/a.md")] };
  assert.equal(evaluateApprovals({ ...docs, reviews: [review("alice", "APPROVED")] }).satisfied, false, "core pools 擁有 docs");
  assert.equal(evaluateApprovals({ ...docs, reviews: [review("corea", "APPROVED")] }).satisfied, true);
  const unstaffed = evaluateApprovals({ ...base, files: [file("skills/x/SKILL.md")], reviews: [review("alice", "APPROVED")] });
  assert.equal(unstaffed.satisfied, true, "未配置人手的內容 pool 回落到任何寫入者");
});

test("無法讀取 reviewer 權限時，核准會 fail closed", async () => {
  const github = fakeGithub({ pr: basePr, files: [file("docs/a.md")], reviews: [review("alice", "APPROVED", undefined, { author_association: "COLLABORATOR" })] });
  github.rest.repos.getCollaboratorPermissionLevel = async () => {
    throw Object.assign(new Error("forbidden"), { status: 403 });
  };
  const evaluation = await evaluateSubmission(github, { owner: "github", repo: "awesome-copilot", pullNumber: 7, config, finalized: true, readContributorRisk: () => null });
  assert.deepEqual(evaluation.approvals.approvers, []);
});

test("GitHub 截斷變更檔案清單時，evaluateSubmission 會阻擋", async () => {
  const github = fakeGithub({ pr: { ...basePr, changed_files: 3001 }, files: [file("docs/a.md")] });
  const evaluation = await evaluateSubmission(github, { owner: "github", repo: "awesome-copilot", pullNumber: 7, config, finalized: true, readContributorRisk: () => null });
  assert.equal(evaluation.risk.tier, "high");
  const truncated = evaluation.automation.infrastructureFailures.find((result) => result.id === "changed-files");
  assert.ok(truncated);
  assert.equal(evaluation.passed, false);
});

test("head 與預期或重新讀取的 head 不同時，evaluateSubmission 會過期", async () => {
  const expected = await evaluateSubmission(fakeGithub({ pr: basePr }), {
    owner: "github", repo: "awesome-copilot", pullNumber: 7, config, expectedHeadSha: "b".repeat(40), readContributorRisk: () => null,
  });
  assert.equal(expected.stale, true);

  const github = fakeGithub({ pr: basePr, files: [file("docs/a.md")] });
  let gets = 0;
  github.rest.pulls.get = async ({ pull_number }) => {
    gets += 1;
    return { data: { ...basePr, number: pull_number, head: { ...basePr.head, sha: gets === 1 ? basePr.head.sha : "c".repeat(40) } } };
  };
  const moved = await evaluateSubmission(github, { owner: "github", repo: "awesome-copilot", pullNumber: 7, config, readContributorRisk: () => null });
  assert.equal(moved.stale, true);
  assert.notEqual(moved.passed, true);
});

test("非 writer 發佈的 submission-gate check 會被標記為竄改", async () => {
  const github = fakeGithub({
    pr: basePr,
    files: [file("docs/a.md")],
    reviews: [review("alice", "APPROVED")],
    permissions: { alice: "write" },
    checkRuns: [{ id: 5, name: "submission-gate", external_id: "", html_url: "https://example.test/impostor" }],
    runs: [run(1, "check-line-endings.yml", "success"), run(90, "codespell.yml", "success"), run(2, "validate-readme.yml", "success"), run(3, "contributor-check.yml", "success")],
  });
  const evaluation = await evaluateSubmission(github, { owner: "github", repo: "awesome-copilot", pullNumber: 7, config, finalized: true, readContributorRisk: () => null });
  assert.equal(evaluation.risk.tier, "high");
  assert.ok(evaluation.automation.contributionFailures.some((result) => result.id === "gate-integrity"));
  assert.equal(evaluation.passed, false);

  await publishGateCheck(github, { owner: "github", repo: "awesome-copilot", evaluation });
  const created = github.calls.find((call) => call.name === "checks.create");
  assert.equal(created.params.name, "submission-gate");
  assert.equal(created.params.external_id, GATE_CHECK_EXTERNAL_ID);
  assert.equal(created.params.conclusion, "failure");
});

test("publishGateCheck 更新 writer 的 check 執行，並將 pending 報告為進行中", async () => {
  const ours = { id: 42, name: "submission-gate", external_id: GATE_CHECK_EXTERNAL_ID };
  const github = fakeGithub({ pr: basePr, checkRuns: [ours] });
  const evaluation = {
    headSha: basePr.head.sha,
    state: "approved",
    passed: true,
    risk: { tier: "low" },
    automation: summarizeChecks([]),
    approvals: { satisfied: true, missing: [] },
  };
  await publishGateCheck(github, { owner: "github", repo: "awesome-copilot", evaluation, detailsUrl: "https://example.test/run" });
  const updated = github.calls.find((call) => call.name === "checks.update");
  assert.equal(updated.params.check_run_id, 42);
  assert.equal(updated.params.conclusion, "success");
  assert.equal(updated.params.details_url, "https://example.test/run");

  const pending = { ...evaluation, state: "awaiting-automation", passed: false, automation: summarizeChecks([{ id: "x", title: "X", required: true, outcome: "pending" }]) };
  const github2 = fakeGithub({ pr: basePr });
  await publishGateCheck(github2, { owner: "github", repo: "awesome-copilot", evaluation: pending });
  const created = github2.calls.find((call) => call.name === "checks.create");
  assert.equal(created.params.status, "in_progress");
  assert.equal(created.params.conclusion, undefined);
});

test("head 或 reviews 變更時，syncPullRequestStatus 不會寫入", async () => {
  const evaluation = {
    pr: basePr,
    headSha: "b".repeat(40),
    labels: [],
    reviewsSignature: "",
    risk: { tier: "low", reasons: [] },
    automation: summarizeChecks([]),
    approvals: { required: 1, requirement: "1 approval", approvers: [], changesRequestedBy: [], reviewers: [], missing: [], notes: [], satisfied: true },
    state: "approved",
    passed: true,
    reviewAssignment: { users: [], teams: [], due: null },
  };
  const moved = fakeGithub({ pr: basePr });
  assert.deepEqual(await syncPullRequestStatus(moved, { owner: "github", repo: "awesome-copilot", evaluation, publishCheck: true }), {
    updated: false,
    reason: "head-changed",
  });
  assert.ok(!moved.calls.some((call) => /addLabels|removeLabel|Comment|checks\.(create|update)/.test(call.name)));

  const reviewed = fakeGithub({ pr: basePr, reviews: [review("alice", "CHANGES_REQUESTED")] });
  const result = await syncPullRequestStatus(reviewed, {
    owner: "github",
    repo: "awesome-copilot",
    evaluation: { ...evaluation, headSha: basePr.head.sha },
    publishCheck: true,
  });
  assert.equal(result.reason, "reviews-changed");
  assert.ok(!reviewed.calls.some((call) => /addLabels|checks\.create/.test(call.name)));
});

test("即使 label 或留言寫入失敗，syncPullRequestStatus 仍會發佈 gate check", async () => {
  const evaluation = {
    pr: basePr,
    headSha: basePr.head.sha,
    labels: [],
    reviewsSignature: "",
    risk: { tier: "low", reasons: [] },
    automation: summarizeChecks([]),
    approvals: { required: 1, requirement: "1 approval", approvers: [], changesRequestedBy: [], reviewers: [], missing: ["1 more approval"], notes: [], satisfied: false },
    state: "review-in-progress",
    passed: false,
    reviewAssignment: { users: [], teams: [], due: null },
  };
  const github = fakeGithub({ pr: basePr });
  github.rest.issues.addLabels = async () => {
    throw Object.assign(new Error("Resource not accessible"), { status: 403 });
  };
  github.rest.issues.createComment = async () => {
    throw Object.assign(new Error("Server Error"), { status: 502 });
  };
  await assert.rejects(
    syncPullRequestStatus(github, { owner: "github", repo: "awesome-copilot", evaluation, publishCheck: true }),
    /labels: Resource not accessible; status comment: Server Error/
  );
  assert.ok(github.calls.some((call) => call.name === "checks.create"), "check 在 label 與留言寫入之前已發佈");
});

test("成功但無法讀取產出物的 contributor check 會 fail closed", async () => {
  const runs = [
    run(1, "check-line-endings.yml", "success"),
    run(90, "codespell.yml", "success"),
    run(2, "validate-readme.yml", "success"),
    run(3, "contributor-check.yml", "success"),
  ];
  const approved = { reviews: [review("alice", "APPROVED")], permissions: { alice: "write" } };
  const options = { owner: "github", repo: "awesome-copilot", pullNumber: 7, config, finalized: true, readContributorRisk: () => null };

  const lost = await evaluateSubmission(
    fakeGithub({ pr: basePr, files: [file("docs/a.md")], runs, jobs: { 3: [{ name: "pr-check", conclusion: "success" }] }, ...approved }),
    options
  );
  assert.deepEqual(lost.automation.infrastructureFailures.map((r) => r.id), ["contributor-risk-signal"]);
  assert.equal(lost.passed, false);

  const skipped = await evaluateSubmission(
    fakeGithub({ pr: basePr, files: [file("docs/a.md")], runs, jobs: { 3: [{ name: "pr-check", conclusion: "skipped" }] }, ...approved }),
    options
  );
  assert.equal(skipped.automation.infrastructureFailures.length, 0, "被跳過的 PR job 不帶有任何訊號");
  assert.equal(skipped.passed, true);
});

test("基底分支或風險 labels 變更時，評估結果與最終寫入會被捨棄", async () => {
  const github = fakeGithub({ pr: basePr, files: [file("docs/a.md")] });
  let gets = 0;
  github.rest.pulls.get = async ({ pull_number }) => {
    gets += 1;
    return { data: { ...basePr, number: pull_number, base: { ...basePr.base, ref: gets === 1 ? "main" : "staged" } } };
  };
  const retargeted = await evaluateSubmission(github, { owner: "github", repo: "awesome-copilot", pullNumber: 7, config, readContributorRisk: () => null });
  assert.equal(retargeted.stale, true);

  const evaluation = await evaluateSubmission(fakeGithub({ pr: basePr, files: [file("docs/a.md")] }), {
    owner: "github", repo: "awesome-copilot", pullNumber: 7, config, finalized: true, readContributorRisk: () => null,
  });
  assert.equal(evaluation.baseRef, "main");
  assert.equal(evaluation.riskLabelSignature, "");

  const rebased = fakeGithub({ pr: { ...basePr, base: { ...basePr.base, ref: "staged" } } });
  assert.equal((await syncPullRequestStatus(rebased, { owner: "github", repo: "awesome-copilot", evaluation })).reason, "base-changed");

  const flagged = fakeGithub({ pr: { ...basePr, labels: [...basePr.labels, { name: "needs-review:HIGH" }] } });
  assert.equal((await syncPullRequestStatus(flagged, { owner: "github", repo: "awesome-copilot", evaluation })).reason, "labels-changed");
  assert.ok(!flagged.calls.some((call) => /addLabels|removeLabel|Comment|checks\./.test(call.name)));

  assert.equal(riskLabelSignature(["b", "needs-review:HIGH", "a"], ["needs-review:HIGH"]), "needs-review:HIGH");
});

test("publishGateCheck 會修正 writer 的 check 副本對失敗評估宣稱 success 的情況", async () => {
  const older = { id: 10, name: "submission-gate", external_id: GATE_CHECK_EXTERNAL_ID, conclusion: "failure" };
  const forged = { id: 11, name: "submission-gate", external_id: GATE_CHECK_EXTERNAL_ID, conclusion: "success" };
  const github = fakeGithub({ pr: basePr, checkRuns: [older, forged] });
  const evaluation = {
    headSha: basePr.head.sha,
    state: "review-in-progress",
    passed: false,
    risk: { tier: "high" },
    automation: summarizeChecks([]),
    approvals: { satisfied: false, missing: ["1 more approval"] },
  };
  const logs = [];
  await publishGateCheck(github, { owner: "github", repo: "awesome-copilot", evaluation, log: (line) => logs.push(line) });
  const updates = github.calls.filter((call) => call.name === "checks.update");
  assert.deepEqual(updates.map((call) => call.params.check_run_id), [11]);
  assert.equal(updates[0].params.conclusion, "failure");
  assert.ok(logs.some((line) => /Correcting 1/.test(line)));
});

test("validatePrCommandRequest 只接受來自觸發執行且格式正確的請求", () => {
  const request = { schema_version: PR_COMMAND_SCHEMA, pr_number: 7, comment_id: 55, run_id: "123" };
  assert.deepEqual(validatePrCommandRequest(request, { workflowRunId: 123 }), { prNumber: 7, commentId: 55 });
  assert.throws(() => validatePrCommandRequest({ ...request, run_id: "124" }, { workflowRunId: 123 }), /run_id/);
  assert.throws(() => validatePrCommandRequest({ ...request, pr_number: "7" }, { workflowRunId: 123 }), /pr_number/);
  assert.throws(() => validatePrCommandRequest({ ...request, comment_id: 0 }, { workflowRunId: 123 }), /comment_id/);
  assert.throws(() => validatePrCommandRequest({ ...request, schema_version: "x" }, { workflowRunId: 123 }), /schema_version/);
  assert.throws(() => validatePrCommandRequest(null, { workflowRunId: 123 }), /not an object/);
});

const commandComment = (body, login = "author", extra = {}) => ({
  id: 55,
  body,
  user: { login, type: "User" },
  issue_url: "https://api.github.com/repos/github/awesome-copilot/issues/7",
  ...extra,
});
const commandOptions = { owner: "github", repo: "awesome-copilot", prNumber: 7, commentId: 55, config };

test("runPrCommand 在寫入前重新讀取留言、PR 與權限", async () => {
  const request = fakeGithub({ pr: basePr, comments: [commandComment("/request-review")] });
  assert.deepEqual(await runPrCommand(request, commandOptions), { status: "handled", command: "request-review" });
  assert.deepEqual(request.calls.find((call) => call.name === "issues.addLabels").params.labels, ["needs-reviewer"]);
  const dispatched = request.calls.find((call) => call.name === "actions.createWorkflowDispatch");
  assert.equal(dispatched.params.workflow_id, "review-routing.yml");
  assert.deepEqual(dispatched.params.inputs, { pr_number: "7" });
  assert.ok(request.calls.some((call) => call.name === "reactions.createForIssueComment"));
  assert.ok(request.calls.some((call) => call.name === "issues.createComment"));
  const order = request.calls.map((call) => (call.name === "reactions.createForIssueComment" ? `reaction:${call.params.content}` : call.name));
  assert.ok(order.indexOf("reaction:eyes") < order.indexOf("issues.addLabels"), "認領標記先於動作寫入");
  assert.ok(order.indexOf("reaction:rocket") > order.indexOf("issues.createComment"), "完成標記在回覆之後寫入");

  const rerun = fakeGithub({ pr: basePr, comments: [commandComment("/rerun-checks", "maint")], permissions: { maint: "maintain" } });
  assert.equal((await runPrCommand(rerun, commandOptions)).command, "rerun-checks");
  assert.equal(rerun.calls.find((call) => call.name === "actions.createWorkflowDispatch").params.workflow_id, "submission-gate-writer.yml");
});

test("runPrCommand 會忽略局外人、已關閉的 PR、編輯、重放與不符的留言", async () => {
  const writes = /addLabels|createComment|createForIssueComment|createWorkflowDispatch|reRun/;

  const outsider = fakeGithub({ pr: basePr, comments: [commandComment("/rerun-checks", "stranger")] });
  assert.equal((await runPrCommand(outsider, commandOptions)).status, "ignored");
  assert.ok(!outsider.calls.some((call) => writes.test(call.name)));

  const closed = fakeGithub({ pr: { ...basePr, state: "closed" }, comments: [commandComment("/rerun-checks")] });
  assert.equal((await runPrCommand(closed, commandOptions)).reason, "PR is not open");

  const edited = fakeGithub({ pr: basePr, comments: [commandComment("thanks!")] });
  assert.equal((await runPrCommand(edited, commandOptions)).reason, "no supported command");

  const replay = fakeGithub({
    pr: basePr,
    comments: [commandComment("/request-review")],
    reactions: [
      { content: "eyes", user: { login: "github-actions[bot]" } },
      { content: "rocket", user: { login: "github-actions[bot]" } },
    ],
  });
  assert.equal((await runPrCommand(replay, commandOptions)).reason, "already handled");
  assert.ok(!replay.calls.some((call) => writes.test(call.name)));

  const elsewhere = fakeGithub({
    pr: basePr,
    comments: [commandComment("/request-review", "author", { issue_url: "https://api.github.com/repos/github/awesome-copilot/issues/70" })],
  });
  await assert.rejects(runPrCommand(elsewhere, commandOptions), /does not belong/);
});
test("runPrCommand 會重試已被認領但從未完成的命令", async () => {
  const claimedOnly = fakeGithub({
    pr: basePr,
    comments: [commandComment("/request-review")],
    reactions: [{ content: "eyes", user: { login: "github-actions[bot]" } }],
  });
  assert.equal((await runPrCommand(claimedOnly, commandOptions)).status, "handled");

  const failing = fakeGithub({ pr: basePr, comments: [commandComment("/request-review")] });
  failing.rest.issues.createComment = async () => {
    throw Object.assign(new Error("boom"), { status: 502 });
  };
  await assert.rejects(runPrCommand(failing, commandOptions), /boom/);
  const reactionsWritten = failing.calls.filter((call) => call.name === "reactions.createForIssueComment").map((call) => call.params.content);
  assert.deepEqual(reactionsWritten, ["eyes"], "失敗的執行只留下認領標記，因此可以重試");
});

test("仍暫止中的建議性 checks 不會擋住 gate", () => {
  const advisory = evaluateCheck({ id: "quality", required: false }, { found: true, status: "in_progress" });
  const required = evaluateCheck({ id: "build" }, { found: true, status: "completed", conclusion: "success" });
  const automation = summarizeChecks([advisory, required]);
  assert.equal(automation.pending.length, 0);
  assert.equal(automation.advisoryPending.length, 1);
  const approvals = { satisfied: true, reviewers: [], changesRequestedBy: [] };
  assert.equal(computeState({ automation, approvals }), "approved");

  const requiredPending = summarizeChecks([evaluateCheck({ id: "build" }, { found: true, status: "queued" })]);
  assert.equal(computeState({ automation: requiredPending, approvals }), "awaiting-automation");
});

test("無法解析的 review-routing.yml 會讓 loadGateConfig fail closed，但容忍檔案缺失", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gate-config-"));
  try {
    fs.mkdirSync(path.join(dir, ".github"));
    for (const name of ["submission-gate.yml", "risk-tiers.yml"]) {
      fs.copyFileSync(path.join(repoRoot, ".github", name), path.join(dir, ".github", name));
    }
    assert.equal(loadGateConfig(dir).routing, null, "routing 檔案缺失時回退");

    const routingPath = path.join(dir, ".github", "review-routing.yml");
    fs.writeFileSync(routingPath, "pools: [unclosed\n");
    assert.throws(() => loadGateConfig(dir), /review-routing\.yml could not be parsed/);

    fs.writeFileSync(routingPath, "pools:\n  - core\n");
    assert.throws(() => loadGateConfig(dir), /`pools` must be a mapping/);

    fs.writeFileSync(routingPath, "- just\n- a list\n");
    assert.throws(() => loadGateConfig(dir), /must be a mapping/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
