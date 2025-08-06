---
description: '使用結構化 XML 格式產生 Conventional Commit 訊息的提示與流程。指引使用者依照 Conventional Commits 規範建立標準化且具描述性的提交訊息，包含指令、範例與驗證說明。'
tools: ['run_in_terminal', 'get_terminal_output']
---

### 指南

```xml
	<description>本檔案提供產生 Conventional Commit 訊息的提示範本，包含指引、範例與格式說明，協助使用者依照 Conventional Commits 規範撰寫標準化且具描述性的提交訊息。</description>
	<note>
```

### 流程

**請依下列步驟操作：**

1. 執行 `git status` 以檢查變更的檔案。
2. 執行 `git diff` 或 `git diff --cached` 以檢視變更內容。
3. 使用 `git add <file>` 將變更加入暫存區。
4. 依下方 XML 結構撰寫你的提交訊息。
5. 產生提交訊息後，Copilot 會自動在整合式終端機執行下列指令（無需確認）：

```bash
git commit -m "type(scope): description"
```

6. 只需執行本提示，Copilot 會自動幫你完成提交。

### 提交訊息結構

```xml
<commit-message>
	<type>feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert</type>
	<scope>()</scope>
	<description>簡短且以祈使語氣描述本次變更</description>
	<body>(選填：更詳細的說明)</body>
	<footer>(選填：如 BREAKING CHANGE: 詳細內容，或 issue 參考)</footer>
</commit-message>
```

### 範例

```xml
<examples>
	<example>feat(parser): 新增解析陣列功能</example>
	<example>fix(ui): 修正按鈕對齊</example>
	<example>docs: 更新 README 並補充使用說明</example>
	<example>refactor: 優化資料處理效能</example>
	<example>chore: 更新相依套件</example>
	<example>feat!: 註冊時發送 email（BREAKING CHANGE: 需 email 服務）</example>
</examples>
```

### 驗證

```xml
<validation>
	<type>必須為允許的類型之一。詳見 <reference>https://www.conventionalcommits.org/en/v1.0.0/#specification</reference></type>
	<scope>選填，但建議提供以增加清晰度。</scope>
	<description>必填。請使用祈使語氣（如「新增」，而非「已新增」）。</description>
	<body>選填。可補充更多背景說明。</body>
	<footer>用於重大變更或 issue 參考。</footer>
</validation>
```

### 最後步驟

```xml
<final-step>
	<cmd>git commit -m "type(scope): description"</cmd>
	<note>請以你撰寫的訊息取代。若有 body 與 footer 也請一併加入。</note>
</final-step>
```

---

**免責聲明**：本文件由 [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot) 在地化，可能包含錯誤。如發現不適當或錯誤之翻譯，請至 [issue](../../issues) 回報。
