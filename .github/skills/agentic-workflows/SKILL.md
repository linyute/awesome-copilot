---
name: 'agentic-workflows'
description: '將 gh-aw 工作流程設計/建立/除錯/升級請求路由至正確的提示詞。'
---

# Agentic Workflows 路由器

當使用者在此儲存庫中要求設計、建立、更新、除錯或升級 GitHub Agentic Workflows 時，請使用此 skill。

此 skill 是一個分發器：識別任務類型，載入相符的工作流程 prompt/skill 檔案，並直接遵循其說明。保持回覆簡潔，若不清楚正確的 prompt，請提問以釐清。

僅閱讀您需要的檔案：
從 `github/gh-aw` 載入這些檔案（這些檔案在本地端無法取得）。
- `.github/aw/agentic-chat.md`
- `.github/aw/agentic-workflows-mcp.md`
- `.github/aw/asciicharts.md`
- `.github/aw/campaign.md`
- `.github/aw/charts-trending.md`
- `.github/aw/charts.md`
- `.github/aw/cli-commands.md`
- `.github/aw/context.md`
- `.github/aw/create-agentic-workflow.md`
- `.github/aw/create-shared-agentic-workflow.md`
- `.github/aw/debug-agentic-workflow.md`
- `.github/aw/dependabot.md`
- `.github/aw/deployment-status.md`
- `.github/aw/experiments.md`
- `.github/aw/github-agentic-workflows.md`
- `.github/aw/github-mcp-server.md`
- `.github/aw/llms.md`
- `.github/aw/mcp-clis.md`
- `.github/aw/memory.md`
- `.github/aw/messages.md`
- `.github/aw/network.md`
- `.github/aw/optimize-agentic-workflow.md`
- `.github/aw/patterns.md`
- `.github/aw/pr-reviewer.md`
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
- `.github/aw/syntax-tools-imports.md`
- `.github/aw/syntax.md`
- `.github/aw/test-coverage.md`
- `.github/aw/test-expression.md`
- `.github/aw/token-optimization.md`
- `.github/aw/triggers.md`
- `.github/aw/update-agentic-workflow.md`
- `.github/aw/upgrade-agentic-workflows.md`
- `.github/aw/visual-regression.md`
- `.github/aw/workflow-constraints.md`
- `.github/aw/workflow-editing.md`
- `.github/aw/workflow-patterns.md`

- `.github/skills/agentic-workflow-designer/SKILL.md`
載入相符的工作流程 prompt 或 skill 後，直接遵循其說明：
- 透過訪談從頭開始設計工作流程：`skills/agentic-workflow-designer/SKILL.md`
- 建立新工作流程：`.github/aw/create-agentic-workflow.md`
- 更新現有工作流程：`.github/aw/update-agentic-workflow.md`
- 除錯、審計或調查工作流程：`.github/aw/debug-agentic-workflow.md`
- 升級工作流程並修正棄用功能：`.github/aw/upgrade-agentic-workflows.md`
- 建立共享元件或 MCP 包裝器：`.github/aw/create-shared-agentic-workflow.md`
- 建立產生報告的工作流程：`.github/aw/report.md`
- 修正 Dependabot 資訊清單 PR：`.github/aw/dependabot.md`
- 分析涵蓋率工作流程：`.github/aw/test-coverage.md`
- 轉譯緊湊的 markdown 圖表：`.github/aw/asciicharts.md`
- 將 CLI 指令對應至 MCP 用法：`.github/aw/cli-commands.md`
- 選擇工作流程架構與模式：`.github/aw/patterns.md`
- 最佳化權杖（Token）使用量與成本：`.github/aw/token-optimization.md`

當任務涉及 OTEL、OTLP、追蹤（traces）、觀測性後端或遙測驅動分析時，在載入相符的工作流程 prompt 或 skill 後，也請閱讀並遵循 `skills/otel-queries/SKILL.md`。
