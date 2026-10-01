---
name: 'agentic-workflows'
description: '將 gh-aw 工作流程設計/建立/除錯/升級請求路由至正確的提示詞。'
---

# Agentic Workflows 路由器

當使用者要求在此存放庫中設計、建立、更新、除錯或升級 GitHub Agentic Workflows 時，請使用此技能。

此技能為分派器：識別任務類型，載入相符的工作流程提示詞/技能檔案，並直接遵循。保持回應簡潔，若正確的提示詞不明確，請提出澄清問題。

存放庫覆蓋（選用）：
- 若 `.github/aw/instructions.md` 存在，在載入相符的提示詞/技能後，使用 `@.github/aw/instructions.md` 載入它。
- 優先順序：當發生衝突時，存放庫覆蓋指示會覆寫上游預設值。

僅讀取您需要的檔案：
從 `github/gh-aw` 載入這些檔案（本機無法使用）。
- `.github/aw/action-container-substitutions.md`
- `.github/aw/agent-runtime-instructions.md`
- `.github/aw/agentic-chat.md`
- `.github/aw/agentic-workflows-mcp.md`
- `.github/aw/asciicharts.md`
- `.github/aw/campaign.md`
- `.github/aw/charts-trending.md`
- `.github/aw/charts.md`
- `.github/aw/cli-commands.md`
- `.github/aw/compat.md`
- `.github/aw/configure-agentic-engine.md`
- `.github/aw/context.md`
- `.github/aw/create-agentic-workflow-trigger-details.md`
- `.github/aw/create-agentic-workflow.md`
- `.github/aw/create-shared-agentic-workflow.md`
- `.github/aw/debug-agentic-workflow.md`
- `.github/aw/dependabot.md`
- `.github/aw/deployment-status.md`
- `.github/aw/designer-mappings.md`
- `.github/aw/designer.md`
- `.github/aw/drive-memory.md`
- `.github/aw/enclaves.md`
- `.github/aw/evals.md`
- `.github/aw/experiments.md`
- `.github/aw/github-agentic-workflows.md`
- `.github/aw/github-mcp-server-pagination.md`
- `.github/aw/github-mcp-server-tools.md`
- `.github/aw/github-mcp-server.md`
- `.github/aw/instructions.md`
- `.github/aw/intent.md`
- `.github/aw/jobs.md`
- `.github/aw/linter-workflows.md`
- `.github/aw/llms.md`
- `.github/aw/loop.md`
- `.github/aw/lsp.md`
- `.github/aw/maintainer.md`
- `.github/aw/mcp-clis.md`
- `.github/aw/memory-stateful-patterns.md`
- `.github/aw/memory.md`
- `.github/aw/messages.md`
- `.github/aw/multi-agent-research.md`
- `.github/aw/network.md`
- `.github/aw/optimize-agentic-workflow.md`
- `.github/aw/patterns.md`
- `.github/aw/playwright.md`
- `.github/aw/pr-reviewer.md`
- `.github/aw/release-workflow.md`
- `.github/aw/report.md`
- `.github/aw/reuse.md`
- `.github/aw/safe-outputs-automation.md`
- `.github/aw/safe-outputs-content.md`
- `.github/aw/safe-outputs-management.md`
- `.github/aw/safe-outputs-runtime.md`
- `.github/aw/safe-outputs.md`
- `.github/aw/serena-tool.md`
- `.github/aw/shared-safe-jobs.md`
- `.github/aw/skills.md`
- `.github/aw/subagents.md`
- `.github/aw/syntax-agentic.md`
- `.github/aw/syntax-core.md`
- `.github/aw/syntax-engine.md`
- `.github/aw/syntax-tools-imports.md`
- `.github/aw/syntax.md`
- `.github/aw/test-coverage.md`
- `.github/aw/test-expression.md`
- `.github/aw/token-optimization-caching-budgets.md`
- `.github/aw/token-optimization-observability.md`
- `.github/aw/token-optimization.md`
- `.github/aw/triggers.md`
- `.github/aw/update-agentic-workflow.md`
- `.github/aw/upgrade-agentic-workflows.md`
- `.github/aw/visual-regression.md`
- `.github/aw/workflow-constraints.md`
- `.github/aw/workflow-editing.md`
- `.github/aw/workflow-patterns.md`

載入相符的工作流程提示詞或技能後，直接遵循：
- 透過訪談從頭設計工作流程：`.github/aw/designer.md`
- 建立新工作流程：`.github/aw/create-agentic-workflow.md`
- 設定或新增宣告式引擎：`.github/aw/configure-agentic-engine.md`
- 更新現有工作流程：`.github/aw/update-agentic-workflow.md`
- 除錯、稽核或調查工作流程：`.github/aw/debug-agentic-workflow.md`
- 升級工作流程並修復已棄用項目：`.github/aw/upgrade-agentic-workflows.md`
- 建立共用元件或 MCP 包裝器：`.github/aw/create-shared-agentic-workflow.md`
- 建立產生報告的工作流程：`.github/aw/report.md`
- 修復 Dependabot 宣示說明 PR：`.github/aw/dependabot.md`
- 分析涵蓋範圍工作流程：`.github/aw/test-coverage.md`
- 轉譯精簡 Markdown 圖表：`.github/aw/asciicharts.md`
- 將 CLI 命令對應至 MCP 用法：`.github/aw/cli-commands.md`
- 選擇工作流程架構與模式：`.github/aw/patterns.md`
- 最佳化權杖使用量與成本：`.github/aw/token-optimization.md`
- 設計長時間運行的多代理人研究工作流程：`.github/aw/multi-agent-research.md`
- 新增使用者要求的技能或代理人外掛（`skills:` / `plugins:` frontmatter，絕不即席安裝）：`.github/aw/skills.md`

當任務涉及 OTEL、OTLP、追蹤、可觀測性後端或遙測驅動分析時，請在載入相符的工作流程提示詞或技能後，亦閱讀並遵循 `skills/otel-queries/SKILL.md`。
