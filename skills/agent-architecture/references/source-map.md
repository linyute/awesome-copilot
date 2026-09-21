# 技能基礎與轉移邊界 (Skill Foundations and Transfer Boundaries)

## 新增內容：工作發掘與架構交接

審查了 [kotlyar/agent-architecture-builder](https://github.com/kotlyar/agent-architecture-builder/tree/d3e5570cef4f01adc142aa478f3967b7bf165fec)，快照 `d3e5570cef4f01adc142aa478f3967b7bf165fec` (MIT)。依據：skills/hermes-agent-builder 下的 SKILL.md 以及 references/discovery-interview.md、architecture-decisions.md、control-interface-and-storage.md、delivery-package.md。這是構想來源，而非訪談有效性或特定執行階段就緒度的佐證。

改編內容：從期望的變更走向真實的情節／功能；單一實質問題；可見進展與充分性條件；方法／工具／臨時工作者／持久化邊界的分開選型；控制介面／儲存庫的獨立合理解釋；可驗證的實作交接。這些制定於 discovery-protocol.md、architecture-selection.md 與 result-delivery.md 中。

未轉移內容：強制的 Hermes 套件／安裝程式／ZIP、固定前端技術棧、在完整訪談前禁止提供有用的早期設計，或通用的設定檔／協調器准入公式。此技能設計不同類別的代理人，包含無狀態代理人與簡單工作流程；外部服務可擁有狀態。採納的是決策因素而非平台限制。合成了新措辭；未複製上游程式碼／範本。

額外依據來自 Jira/Pipeline 角色測試的觀察：過載的複合問題、隱含的操作者介面、缺失的簡要負責人頁面、提議限制的後果，以及未驗證的試點可行性。它們定義了回歸情境，但單一合成測試並不能證明通用品質。

## 來源

「Инженерия AI-агентов и ремесло разработчика」（《AI 代理人工程與開發者工藝》），2026 年，基於 Dmitry Bereznitsky 頻道的教科書。提供的檔案：`Учебник-AI-агенты-и-ремесло-разработчика_1.pdf`（《教科書——AI 代理人與開發者工藝》），287 頁 PDF。SHA-256：`441f1c37a6b42bcae2bf10ce4c130a6f34271f930e67f6b90338437a4256fe73`。

在此版本中，印刷頁碼 n 對應於 PDF 頁碼 n+1。該教科書是由 32 部影片及自動取得的逐字稿進行編輯改寫而成，非規範性標準或 API 參考（印刷頁碼 10–12；PDF 11–13）。影片對應圖：印刷頁碼 284–286；PDF 285–287。未經查證切勿假設版本或特定數據為最新。

本技能自成一體：以下內容保留了綜合彙整的原則與出處，而非書籍複本。若需要原始驗證，請找出提供的 PDF；其缺失不會阻止使用該程序，但會阻止確認新的引文。

## 決策起源

| 教科書依據 | 印刷／PDF 頁碼 | 用途 |
|---|---|---|
| 第 1–4 章：LLM、情境、知識、模型選型 | 15–40 / 16–41 | 情境作為有限資源；依任務與測量選取模型／知識存取方式 |
| 第 5 章：剖析、模式階梯、迴圈、工具 | 43–50 / 44–51 | 從簡開始；工作流程與動態模型選擇分開；明確的迴圈限制與事前檢查 |
| 第 6 章：記憶體生命週期與知識來源 | 51–58 / 52–59 | 記憶體類型、來源與衍生摘要分開；考慮衝突、過期、並行、投毒 |
| 第 7 章：約束、通知、驗證、修正；七層框架 | 59–66 / 60–67 | 執行階段、工具、情境、生命週期、可觀察性、驗證、治理作為涵蓋圖；提示之外的限制 |
| 第 8–9 章：工具、MCP、多代理人 | 67–79 / 68–80 | 領域工具合約；合理解釋協定／協調機制而非強制多代理人系統 |
| 第 10 章：安全、失敗、可觀察性 | 80–92 / 81–93 | 動作政策、等冪性、特定操作的降級、動作成果、每任務成本 |
| 第 11–13 章：研究、設計、AI 工作驗證 | 95–116 / 96–117 | 事實、架構、實作分開；架構檢視表「何物／如何／為何／如何驗證」 |
| 第 14–18 章：架構與領域 | 119–151 / 120–152 | 職責／擁有權邊界、不變量、成比例的分散／抽象化 |
| 第 19–21 章：SOLID 與程式碼品質 | 153–171 / 154–172 | 可變更性／清晰度作為情境；切勿將技能變成樣式 linter |
| 第 22–23 章：安全與 MCP | 174–188 / 175–189 | 不受信任的工具描述／資料、最低權限、觀察到的真實副作用 |
| 附錄 B.1、B.3、B.5 | 266–269, 272–274, 277–279 / 267–270, 273–275, 278–280 | 架構、領域、維運、安全涵蓋範圍檢查 |

職涯、倦怠、求職面試與後量子遷移等章節不是強制的代理人檢查：它們在宣告的兩種模式之外。適應性訪談收集產品需求，而非評估對話者的能力。

## 本技能的原創綜合彙整內容

設計／稽核模式、訪談順序、帶有出處的需求登錄表、R→D→E 連結、發現格式、「缺陷／未知／不適用」區分、停止條件以及就緒狀態皆是針對使用者請求而制定的。教科書提供了技術基礎，但未提供現成完整的客戶需求發掘流程。

依參數／過期界定的核准細節、設計就緒度對比正式環境就緒度、索引／快取中已撤銷的 ACL 檢查以及當機後行為皆屬於工程操作化，而非教科書作者的逐字要求。

## 注意事項與更正

1. **範例數字非標準規範。** 窗口的 40–50%、十個步驟、工具數量、強制的 20→3–5 重新排序結果、延遲與價格皆取決於模型／任務。若具相關性，請作為可測試的假設使用。數值架構限制需要具備狀態與依據。
2. **不存在通用的子系統集合。** 四種記憶體類型為分類法，而非對四個儲存庫的要求。RAG、重新排序器、圖形、模型路由器、整合防護、語意迴圈偵測器、MCP 與獨立服務皆需提出合理解釋。現有執行階段或擁有該功能的 API 即可強制執行控制。
3. **記憶體與規範。** 「Wiki 僅僅是快取」、僅附加（append-only）與單一寫入者屬於共享記憶體架構選項。切勿自動套用於每個 Wiki、交易型資料庫或經編寫的文件。版本控制可防止遺失更新，但本身無法解決語意衝突。記錄商業副作用與背景記錄選用記憶體是相異的操作。
4. **不變量。** 在領域／政策版本邊界內定義。檢查可依賴權威狀態、時間與明確例外，而不必變成機率性的。切勿照字面匯入「任何可變更或具例外的內容皆不得存在於程式碼中」。
5. **安全性。** 印刷頁碼 90（PDF 91）錯誤指出 Excessive Agency 在 OWASP Top 10 之外。在 2025 年版中它屬於 LLM06。分類器無法防止所有注入，亦無法取代權限檢查。本機／開源的 MCP 伺服器並不能證明安全。
6. **分數與案例。** 書中的事件故事、攻擊率、節省費用與比較百分比不能作為特定實作品質／風險的佐證。稽核依賴於可達路徑與專案需求。

## 經過驗證的主要材料

於 2026-09-08 研讀；針對具體設計重新檢查變動中的 API、版本與政策。這些完善了原則，而未增加強制技術棧。

- [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)：預定義工作流程對比模型選取的下一步、簡單解決方案、回饋、停止條件。文章本身指出了工具的變動；其產品清單未被採納為當前技能建議。
- [OWASP — LLM06:2025 Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/)：證實了分類修正；權限控制屬於 LLM 決策之外，可存在於擁有系統／工具中。
- [AWS Builders’ Library — Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)：客戶端意圖識別碼、伺服器端重試處理保證、參數繫結、金鑰保留。單純客戶端金鑰無法消除副作用模稜兩可的情況。

## 新增內容：能力結構與 Harness_ru

於 2026-09-09 分析：[Harness_ru, 修訂版 91750c0337f449bad1764d0e2b813ce9f8d8f2b1](https://github.com/justxor/Harness_ru/tree/91750c0337f449bad1764d0e2b813ce9f8d8f2b1)。此課程主要涉及寫程式的代理人；它屬於補充材料，非通用標準。模組 4–5、8–11、13–14 貢獻了可定址指示、從外部狀態繼續執行、結果確認與回饋。指令碼／範本未包含在技能中。

能力規格、「無需新領域設計」條件以及草圖／套件區分皆為針對使用者請求的原創綜合彙整。詳細內容不需要更多代理人、服務或檔案。於 2026-09-09 研讀的主要材料：

- [Anthropic — Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)：封裝程序專業知識並隨需載入材料。
- [Agent Skills — Specification](https://agentskills.io/specification)：套件結構作為可能的實作格式，而非為每項能力要求獨立套件。
- [Anthropic — Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)：情境選取、隨需載入、保留實質狀態。
- [Anthropic — Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)：跨工作階段產物／可驗證進度；將軟體開發範例改編至各領域。
- [Anthropic — Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)：成果／互動檢查、結合程式化／模型／人工評估；成功情境仍作為回歸測試。

未轉移內容：通用數值閾值、存放庫作為唯一的單一事實來源、強制圖形／獨立 LLM 評估器，或將靜態檢查等同於代理人品質。獨立評估依風險具備實用性，但無法提供保證。透過 eval 執行 JSON 命令並非建議的信任邊界。切勿僅因小型樣本在沒有權限檢查或已知關鍵回歸測試下通過，就將其移除。

## 新增內容：診斷與審查

README 的「如何修復代理人：診斷通訊協定」小節與 Harness_ru 模組 1–2 於 2026-09-09 在相同修訂版下重新檢查。分層調查、冷啟動情境載入檢查、檢查敏感度與元件比較被改編成 [diagnostic-review.md](diagnostic-review.md)。案例卡片、競爭假設、失敗條件保留、原因／後果分開與修正審查為本技能將其操作化。

未接受為規則的內容：「單一症狀——單一層級」、兩次重複作為原因證明、強制基於檔案的修復、將人工評估視為無檢查、單一端對端測試作為充分證明，或將模型視為幾乎不可能的原因。模組 2 已指出停用後零惡化屬於模稜兩可情況；保留了該更精確的注意事項。修復時間與「模型一律最後」非規範性標準。來源診斷指令碼既未執行也未轉移；負向控制必須檢查實際專案閘門，而非僅檢查獨立工具。

## 新增內容：通用架構與測量

於 2026-09-09/10 的研究涵蓋了 21 個存放庫與 34 份主要材料。轉移的是原則，而非熱門度排名、現成技術棧或函式庫設定。下方來源直接支援變更 A1–A10；卡片結構描述／適用性邊界為原創綜合彙整。固定的快照證實了該版本的行為；在設計期間請重新檢查當前 API 與產品預設值。

| 新增內容 | 主要依據 | 轉移與限制 |
|---|---|---|
| A1: 拓撲選型 | [Scaling Agent Systems](https://arxiv.org/abs/2512.08296), [12-Factor Agents](https://github.com/humanlayer/12-factor-agents/blob/d20c728368bf9c189d6d7aab704744decb6ec0cc/README.md) | 任務屬性與總額預算比較；外部效益閾值非規範性標準 |
| A2: 評估軸向／閘門 | [tau2 evaluation](https://github.com/sierra-research/tau2-bench/blob/672227c6b6676edc20d57ea53b7000262aae77b9/docs/evaluation.md), [AgentDojo task contracts](https://github.com/ethz-spylab/agentdojo/blob/089ed468cf3ed0322acc66b0211f26d9d90dbf60/src/agentdojo/base_tasks.py) | 成果／動作／限制分開；AgentDojo 的 security=True 意味著攻擊成功，因此需驗證指標方向 |
| A3: 測量可靠性 | [Inspect scoring policy](https://inspect.aisi.org.uk/scoring-policy.html), [tau2 grading changes](https://github.com/sierra-research/tau2-bench/blob/672227c6b6676edc20d57ea53b7000262aae77b9/README.md), [Anthropic evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | 遺漏、分母、版本、可重複性；歸納器／NaN 語意屬於工具專屬 |
| A4: 工具作為選型介面 | [Writing effective tools](https://www.anthropic.com/engineering/writing-tools-for-agents) | 領域語意、可區分性、完整性／輸出量；不需要為每個端點強制提供包裝器 |
| A5: 確切執行保證 | [Agents SDK guardrails](https://github.com/openai/openai-agents-python/blob/83c737fd0b8d9a53bd39fa2a0856070417bb0bd3/docs/guardrails.md), [LangGraph checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers), [mini-swe-agent DefaultAgent](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/agents/default.py) | 控制範圍／時序、持久性／重放、已啟動呼叫的預算超支；SDK 預設值非規範標準 |
| A6: 委派 | [MAST v3](https://arxiv.org/abs/2503.13657v3), [Multiagent patterns](https://www.anthropic.com/research/multiagent-systems) | 交接／整合合約；失敗分類法不能證明特定失敗的原因 |
| A7: 程序演進 | [Hermes](https://github.com/NousResearch/hermes-agent/blob/474143da81de5661424475a2e9e4ba60dfefa467/README.md), [Letta Code](https://github.com/letta-ai/letta-code/blob/d043d4626f244e1804d5304ed4d5fee891aa7fa4/README.md) | 經驗記錄與行為准入分開；執行階段自我變更能力不能證明改進 |
| A8: 隔離 | [smolagents secure execution](https://huggingface.co/docs/smolagents/tutorials/secure_code_execution) | 程式碼／工具／處理程序隔離邊界；虛擬檔案系統／篩選器非完整的安全邊界 |
| A9: 互動 | [Pydantic deferred tools](https://github.com/pydantic/pydantic-ai/blob/0ec8a5dcc9c30e82e91d63af20e5d92f1456fac5/docs/deferred-tools.md) | 對話／任務／執行、暫停／繼續；從產品需求綜合彙整的取消／更正／串流合約 |
| A10: 受控改進 | [GEPA adapter](https://github.com/gepa-ai/gepa/blob/0632cdb5dcc052e690eab439e1b4a7e3e9cfe407/src/gepa/core/adapter.py), [GEPA paper](https://arxiv.org/abs/2507.19457) | 針對元件的回饋、受保護的評估／比較；無強制最佳化器或變更條件的權限 |

切勿在沒有權限的情況下轉移程式碼、通用 bash、強制作為多代理人或發布新程序。函式庫範例用以說明機制；適用性、設定與品質需要個別佐證。

## 新增內容：AI-Disrupt PDLC——驗證與延續性

於 2026-09-10 研讀的使用者提供文件：`whitepaper_full_ru.pdf`（175 頁；SHA-256 `5e1aeccece8567d2f0db14b5f6f2f6626086ccc86f8f1f0e159fdd039237d3ba`）與 `whitepaper_short_ru.pdf`（44 頁；SHA-256 `374ae1fbc5875ba107d6fd4574ad90120608b5914257896045e5aa42653bc87d`）。簡短版呈現相同的 AI-Disrupt PDLC 概念，非對完整版的獨立確認。下方數字為 PDF 頁碼；完整版印刷頁碼低 4 頁。由於西里爾文字擷取不正確，關鍵簡短版表格經過了視覺化檢查。

| 來源章節 | PDF 頁碼 | 轉移內容 |
|---|---|---|
| 成果假設與人工決策圖 | full 36–44; short 14 | 價值卡、實質人工參與、執行／副作用區分 |
| 驗證迴圈與 Evidence Bundle | full 52–54 | validation-loop.md 中的七項功能、佐證連結、可驗證完成合約 |
| 壓縮、檢查點、交接、長工作階段 | full 48–53, 84; short 21 | execution-continuity.md 與轉換矩陣；依環境選取儲存格式 |
| 4.2「環境比模型更重要」：環境功能、隔離、長任務、容量 | full 80–87 (印刷 76–83) | 四項功能與整合／強制執行分開；熱／溫／冷、監督者／RTO／RPO、任務／工作階段／時間範圍、斷路器、非同步決策、排程器。遷移、公平性、隔離、窗口邊界與測試合約皆屬改編，非逐字來源保證 |
| 情境權限、ADLC、Guardian | full 96–105, 135; short 24, 31–32 | 具體操作准入、控制器驗證、複合版本、淘汰 |
| 驗證節奏與測量失真 | full 53–55, 133–135 | 審查佇列、人工勞力、分數可比較性；無固定投資比例 |

這是企業軟體開發概念，非通用代理人標準。合約結構描述、對非編程任務的改編、具版本繫結的佐證、快照一致性以及延遲事件檢查為本技能的工程綜合彙整。七項功能並不意味著七個服務；四項交接功能並未在每個作業系統上強制要求 init.sh/progress.md/feature-list.json。

切勿將第 4.2 節的框架程式碼共享、零副作用、固定 RTO/RPO、三個實體儲存層級、強制的 Kubernetes/Redis/解釋用 LLM 或無條件的互動優先權轉移為保證。環境設計並不排除模型錯誤；已接受的政策定義優先級，真實路徑確立復原／安全性。移至冷儲存庫並不會自動滿足適用的保留規則。

未接受為規範的內容：算術 R0–R5 階梯；強制作為多代理人／LLM 審查者；原生 API 一律比 MCP 更可靠；固定的評估通過／壓縮百分比與時間預算；漂移時自動微調；來自 hook／沙箱的安全保證；未經適用性檢查的法律保留／落地期限。白皮書中的商業預測、風險機率與相對改進不能證明特定代理人的成果。
