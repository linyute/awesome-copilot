---
description: '智慧型 Git Flow 分支建立工具，分析 git 狀態與差異，依 nvie Git Flow 分支模型自動建立語意分支。'
tools: ['runCommands/runInTerminal', 'runCommands/getTerminalOutput']
agent: 'agent'
---

### 指南

```xml
<instructions>
	<title>Git Flow 分支建立工具</title>
	<description>本提示會分析你目前的 git 變更（git status 與 git diff 或 git diff --cached），智慧判斷最適合的分支型態並建立語意分支名稱。</description>
	<note>
		只需執行本提示，Copilot 會自動分析並建立最適合的 Git Flow 分支。
	</note>
</instructions>
```

### 流程

**請依下列步驟操作：**

1. 執行 `git status` 檢查目前儲存庫狀態與變更檔案。
2. 執行 `git diff`（未暫存變更）或 `git diff --cached`（已暫存變更）分析變更內容。
3. 依下方 Git Flow 分支分析框架分析變更。
4. 判斷最適合的分支型態。
5. 依 Git Flow 慣例產生語意分支名稱。
6. 建立分支並自動切換。
7. 提供分析摘要與後續建議。

### Git Flow 分支分析框架

```xml
<analysis-framework>
	<branch-types>
		<feature>
			<purpose>新功能、增強、非關鍵改善</purpose>
			<branch-from>develop</branch-from>
			<merge-to>develop</merge-to>
			<naming>feature/描述性名稱 或 feature/工單號-描述</naming>
			<indicators>
				<indicator>新增功能</indicator>
				<indicator>UI/UX 改善</indicator>
				<indicator>新增 API 或方法</indicator>
				<indicator>資料庫結構新增（非破壞性）</indicator>
				<indicator>新增組態選項</indicator>
				<indicator>效能改善（非關鍵）</indicator>
			</indicators>
		</feature>

		<release>
			<purpose>發行準備、版本提升、最終測試</purpose>
			<branch-from>develop</branch-from>
			<merge-to>develop 與 master</merge-to>
			<naming>release-X.Y.Z</naming>
			<indicators>
				<indicator>版本號變更</indicator>
				<indicator>建構組態更新</indicator>
				<indicator>文件最終化</indicator>
				<indicator>發行前小型修正</indicator>
				<indicator>發行說明更新</indicator>
				<indicator>相依套件版本鎖定</indicator>
			</indicators>
		</release>

		<hotfix>
			<purpose>緊急修正生產環境重大錯誤</purpose>
			<branch-from>master</branch-from>
			<merge-to>develop 與 master</merge-to>
			<naming>hotfix-X.Y.Z 或 hotfix/重大問題描述</naming>
			<indicators>
				<indicator>安全性漏洞修正</indicator>
				<indicator>生產環境重大錯誤</indicator>
				<indicator>資料損毀修正</indicator>
				<indicator>服務中斷排除</indicator>
				<indicator>緊急組態變更</indicator>
			</indicators>
		</hotfix>
	</branch-types>
</analysis-framework>
```

### 分支命名慣例

```xml
<naming-conventions>
	<feature-branches>
		<format>feature/[工單號-]描述性名稱</format>
		<examples>
			<example>feature/user-authentication</example>
			<example>feature/PROJ-123-shopping-cart</example>
			<example>feature/api-rate-limiting</example>
			<example>feature/dashboard-redesign</example>
		</examples>
	</feature-branches>

	<release-branches>
		<format>release-X.Y.Z</format>
		<examples>
			<example>release-1.2.0</example>
			<example>release-2.1.0</example>
			<example>release-1.0.0</example>
		</examples>
	</release-branches>

	<hotfix-branches>
		<format>hotfix-X.Y.Z 或 hotfix/重大描述</format>
		<examples>
			<example>hotfix-1.2.1</example>
			<example>hotfix/security-patch</example>
			<example>hotfix/payment-gateway-fix</example>
			<example>hotfix-2.1.1</example>
		</examples>
	</hotfix-branches>
</naming-conventions>
```

### 分析流程

```xml
<analysis-process>
	<step-1>
		<title>變更性質分析</title>
		<description>檢查修改檔案型態與變更內容</description>
		<criteria>
			<files-modified>檢查副檔名、資料夾結構與用途</files-modified>
			<change-scope>判斷新增、修正或準備發行</change-scope>
			<urgency-level>評估是否為重大或開發性變更</urgency-level>
		</criteria>
	</step-1>

	<step-2>
		<title>Git Flow 分類</title>
		<description>將變更對應至適合的 Git Flow 分支型態</description>
		<decision-tree>
			<question>是否為生產環境重大修正？</question>
			<if-yes>考慮 hotfix 分支</if-yes>
			<if-no>
				<question>是否為發行準備（版本提升、最終調整）？</question>
				<if-yes>考慮 release 分支</if-yes>
				<if-no>預設為 feature 分支</if-no>
			</if-no>
		</decision-tree>
	</step-2>

	<step-3>
		<title>分支命名產生</title>
		<description>建立語意且具描述性的分支名稱</description>
		<guidelines>
			<use-kebab-case>使用小寫加連字號</use-kebab-case>
			<be-descriptive>名稱需明確表達目的</be-descriptive>
			<include-context>有工單號或專案上下文時加上</include-context>
			<keep-concise>避免過長名稱</keep-concise>
		</guidelines>
	</step-3>
</analysis-process>
```

### 邊界情境與驗證

```xml
<edge-cases>
	<mixed-changes>
		<scenario>同時包含新功能與修正</scenario>
		<resolution>以最重要變更為主，或建議拆分多分支</resolution>
	</mixed-changes>

	<no-changes>
		<scenario>git status/diff 無變更</scenario>
		<resolution>提醒使用者檢查 git 狀態或先進行變更</resolution>
	</no-changes>

	<existing-branch>
		<scenario>已在 feature/hotfix/release 分支</scenario>
		<resolution>分析是否需新分支或目前分支已適用</resolution>
	</existing-branch>

	<conflicting-names>
		<scenario>建議分支名稱已存在</scenario>
		<resolution>加上遞增後綴或建議替代名稱</resolution>
	</conflicting-names>
</edge-cases>
```

### 範例

```xml
<examples>
	<example-1>
		<scenario>新增使用者註冊 API</scenario>
		<analysis>新增功能，屬於開發性變更，非重大</analysis>
		<branch-type>feature</branch-type>
		<branch-name>feature/user-registration-api</branch-name>
		<command>git checkout -b feature/user-registration-api develop</command>
	</example-1>

	<example-2>
		<scenario>修正認證安全性漏洞</scenario>
		<analysis>安全性修正，屬於生產環境重大，需立即部署</analysis>
		<branch-type>hotfix</branch-type>
		<branch-name>hotfix/auth-security-patch</branch-name>
		<command>git checkout -b hotfix/auth-security-patch master</command>
	</example-2>

	<example-3>
		<scenario>版本升級至 2.1.0 並完成發行說明</scenario>
		<analysis>發行準備，版本提升，文件更新</analysis>
		<branch-type>release</branch-type>
		<branch-name>release-2.1.0</branch-name>
		<command>git checkout -b release-2.1.0 develop</command>
	</example-3>

	<example-4>
		<scenario>優化資料庫查詢效能並更新快取</scenario>
		<analysis>效能改善，屬於非重大增強</analysis>
		<branch-type>feature</branch-type>
		<branch-name>feature/database-performance-optimization</branch-name>
		<command>git checkout -b feature/database-performance-optimization develop</command>
	</example-4>
</examples>
```

### 驗證清單

```xml
<validation>
	<pre-analysis>
		<check>儲存庫狀態乾淨（無未提交變更衝突）</check>
		<check>目前分支為適合起始點（feature/release 用 develop，hotfix 用 master）</check>
		<check>遠端儲存庫已同步</check>
	</pre-analysis>

	<analysis-quality>
		<check>變更分析涵蓋所有修改檔案</check>
		<check>分支型態選擇符合 Git Flow 原則</check>
		<check>分支名稱語意且符合慣例</check>
		<check>邊界情境皆有考量</check>
	</analysis-quality>

	<execution-safety>
		<check>目標分支（develop/master）存在且可存取</check>
		<check>建議分支名稱不與現有分支衝突</check>
		<check>使用者有建立分支權限</check>
	</execution-safety>
</validation>
```

### 最終執行

```xml
<execution-protocol>
	<analysis-summary>
		<git-status>git status 指令輸出</git-status>
		<git-diff>git diff 相關輸出</git-diff>
		<change-analysis>詳細變更分析</change-analysis>
		<branch-decision>分支型態選擇理由</branch-decision>
	</analysis-summary>

	<branch-creation>
		<command>git checkout -b [分支名稱] [來源分支]</command>
		<confirmation>確認分支建立與目前分支狀態</confirmation>
		<next-steps>後續操作建議（提交、推送分支等）</next-steps>
	</branch-creation>

	<fallback-options>
		<alternative-names>如主要建議不適用，提供 2-3 替代分支名稱</alternative-names>
		<manual-override>如分析不符，允許使用者手動指定分支型態</manual-override>
	</fallback-options>
</execution-protocol>
```

### Git Flow 參考

```xml
<gitflow-reference>
	<main-branches>
		<master>生產環境程式，每次提交即為發行</master>
		<develop>整合分支，包含最新開發變更</develop>
	</main-branches>

	<supporting-branches>
		<feature>自 develop 分支建立，合併回 develop</feature>
		<release>自 develop 分支建立，合併至 develop 與 master</release>
		<hotfix>自 master 分支建立，合併至 develop 與 master</hotfix>
	</supporting-branches>

	<merge-strategy>
		<flag>合併時一律使用 --no-ff 保留分支歷史</flag>
		<tagging>於 master 分支標記發行版本</tagging>
		<cleanup>成功合併後刪除分支</cleanup>
	</merge-strategy>
</gitflow-reference>
```
