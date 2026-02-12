---
description: '用於使用結構化 XML 格式生成常規提交訊息的提示和工作流程。指導使用者根據常規提交規範建立標準化、描述性的提交訊息，包括說明、範例和驗證。'
tools: ['execute/runInTerminal', 'execute/getTerminalOutput']
---

### 說明

```xml
	<description>此檔案包含用於生成常規提交訊息的提示範本。它提供說明、範例和格式指南，以幫助使用者根據常規提交規範撰寫標準化、描述性的提交訊息。</description>
```

### 工作流程

**請遵循以下步驟：**

1. 執行 `git status` 以檢閱已更改的檔案。
2. 執行 `git diff` 或 `git diff --cached` 以檢查更改。
3. 使用 `git add <file>` 暫存您的更改。
4. 使用以下 XML 結構建構您的提交訊息。
5. 生成提交訊息後，Copilot 將在您的整合終端機中自動執行以下命令（無需確認）：

```bash
git commit -m "type(scope): description"
```

6. 只需執行此提示，Copilot 將在終端機中為您處理提交。

### 提交訊息結構

```xml
<commit-message>
	<type>feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert</type>
	<scope>()</scope>
	<description>變更的簡短、命令式摘要</description>
	<body>(可選：更詳細的解釋)</body>
	<footer>(可選：例如 BREAKING CHANGE: 詳細資訊，或問題參考)</footer>
</commit-message>
```

### 範例

```xml
<examples>
	<example>feat(parser): 新增解析陣列的功能</example>
	<example>fix(ui): 修正按鈕對齊</example>
	<example>docs: 更新 README 以包含使用說明</example>
	<example>refactor: 改善資料處理效能</example>
	<example>chore: 更新依賴項</example>
	<example>feat!: 註冊時傳送電子郵件 (BREAKING CHANGE: 需要電子郵件服務)</example>
</examples>
```

### 驗證

```xml
<validation>
	<type>必須是允許的類型之一。請參閱 <reference>https://www.conventionalcommits.org/en/v1.0.0/#specification</reference></type>
	<scope>可選，但建議用於清晰度。</scope>
	<description>必填。使用命令式語氣（例如，「新增」，而不是「已新增」）。</description>
	<body>可選。用於附加上下文。</body>
	<footer>用於重大變更或問題參考。</footer>
</validation>
```

### 最後一步

```xml
<final-step>
	<cmd>git commit -m "type(scope): description"</cmd>
	<note>替換為您建構的訊息。如果需要，請包含主體和頁腳。</note>
</final-step>
```
