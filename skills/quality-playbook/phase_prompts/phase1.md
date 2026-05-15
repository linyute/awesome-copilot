您是一位品質工程師。{skill_fallback_guide} 對於此階段，請「僅」閱讀到階段 1 為止的章節（在「階段 2」之前的「---」線處停止）。此外，請閱讀與探索相關的參考檔案（位於與您解析的安裝路徑相符的任何 references/ 目錄下）。

{seed_instruction}

執行階段 1：探索程式碼庫。reference_docs/ 目錄包含收集到的文件 — 請閱讀這些內容以補充您的探索。頂層檔案是第 4 層上下文（AI 聊天內容、設計筆記、回顧內容）。reference_docs/cite/ 下的檔案是可引用的來源（專案規格、RFC）。如果 reference_docs/ 缺失或為空，請僅使用第 3 層證據（原始碼樹）繼續執行，並在 EXPLORATION.md 中註明此點。

### 強制性檔案角色標記 (MANDATORY FILE-ROLE TAGGING) (v1.5.4 第 1 部分)

在撰寫 EXPLORATION.md 之前（或作為撰寫過程的一部分），請產出 `quality/exploration_role_map.json`。首先閱讀存放庫根目錄下的 `SKILL.md` (如果有的話)（也要檢查是否有任何其他頂層的技能形狀進入檔案 — 指標是內容與名稱，而非副檔名；`README.md` 不僅僅因為它位在根目錄，就是技能形狀的進入檔案）。文字內容將知會隨後每個檔案的角色標記。

**檔案來源 (v1.5.4 階段 3.6.1，codex 預防)。** 當目標是 Git 存放庫時，使用 `git ls-files` 作為規範檔案清單 — 這會自動遵循 `.gitignore`，且是「唯一」受支援的列舉來源。不要使用 `os.walk`、`find`、`os.listdir` 或任何遞迴目錄周遊工具 — 這些將會拉入 `.git/`、`.venv/`、`venv/`、`node_modules/`、`__pycache__/`、組建輸出以及供應商相依性，所有這些在角色地圖中都是「禁止」的（驗證器會拒絕它們並終止執行）。當目標不是 Git 存放庫時，請使用檔案系統周遊，明確跳過下方列出的禁止路徑；將此後備方案記錄在角色地圖的 `provenance` 欄位中。

**禁止路徑（絕不能以任何角色出現在角色地圖中）：** `.git/`、`.venv/`、`venv/`、`node_modules/`、`__pycache__/`、`.pytest_cache/`、`.mypy_cache/`、`.ruff_cache/`、`.tox/`，以及任何路徑中包含以 `.egg-info` 或 `.dist-info` 結尾的組件。位於 `bin/role_map.py::DISALLOWED_PATH_PREFIXES` 的驗證器會強制執行此點 — 如果您的角色地圖包含任何此類路徑，執行將會終止。此外，還有 2000 個項目的硬性上限；超過此數量的角色地圖會被視為階段 1 周遊了受 `.gitignore` 忽略內容的證據。

**出處 (Provenance) (v1.5.4 階段 3.6.1)。** 角色地圖的頂層 `provenance` 欄位「必須」為下列其中之一：
- `"git-ls-files"` — 偏好選項。目標是 Git 存放庫；您執行了 `git ls-files` 進行列舉。
- `"filesystem-walk-with-skips"` — 後備方案。目標不是 Git 存放庫；您執行了檔案系統周遊，並明確跳過上方禁止路徑清單中的每個項目。
- `"unknown"` — 僅在舊版角色地圖上接受；「請勿」在全新的執行中發出此值。

針對每個範圍內的檔案，發出一個帶有下方角色分類法的記錄。判斷是基於內容的：閱讀檔案（或足夠判斷的部分），「不要」僅憑副檔名或目錄名稱進行樣式匹配。

**哨兵檔案 (Sentinel files) (v1.5.4 階段 3.6.1)。** 存放庫受監控樹中名為 `.gitkeep`（或類似的空目錄標記）的檔案「絕不能」被刪除。它們在 Git 歷程記錄中保留原本為空的目錄。如果您發現此類檔案且不理解其用途，請不要更動。預檢會驗證所有 `.gitignore !` 規則的哨兵是否存在，若有任何缺失則終止執行。

**如果您在此次執行期間發現 QPB 本身存在錯誤** (例如來自 `bin/run_playbook.py` 的異常、遺漏匯入、QPB 原始碼中損壞的斷言)，請立即「停止」執行並回報：
1. 錯誤的確切內容及其發生位置 (檔案:列 + 追蹤記錄 (traceback))
2. 對可能根本原因的診斷
3. 建議的修復形狀（請「不要」套用修復）

「不要」親自修補 QPB 原始碼。QPB 原始碼變更須通過 Council 審查（參見 `~/Documents/AI-Driven Development/CLAUDE.md`）。結構化背板會在執行啟動時擷取 QPB 原始碼樹的 Git SHA，並在每個階段邊界驗證原始碼樹未經變更；自主的原始碼修補將會因診斷出已修改檔案而導致閘道驗證失敗。

角色分類法（單一資訊來源：`bin/role_map.py::ROLE_DESCRIPTIONS`）：
{role_taxonomy}

如果一個檔案確實不符合任何這些角色，您可以新增一個新角色 — 但請在角色地圖的第一個項目中以註解樣式的理由記錄該新增項目。

輸出檔案 `quality/exploration_role_map.json` 必須符合此結構描述：

```
{{
  "schema_version": "1.0",
  "timestamp_start": "<階段 1 啟動時的 ISO 8601 UTC 時間戳記>",
  "provenance": "git-ls-files",
  "files": [
    {{
      "path": "<相對於存放庫的 POSIX 路徑>",
      "role": "<角色分類法值之一>",
      "size_bytes": <整數>,
      "rationale": "<一或兩個句子的判斷理由，基於內容>"
    }}
    // ... 每個範圍內的檔案一個條目。當角色為 "skill-tool" 時，還要
    // 包含一個 "skill_prose_reference" 字串，指向命名此指令碼的
    // SKILL.md / 參考檔案位置 (例如 "SKILL.md:47" 或
    // "references/forms.md:section-3")；階段 4 中的文字到程式碼
    // 飄移檢查會讀回此欄位以尋找被引用的文字。
  ]
}}
```

**您只需產出 `files[]` 和 `provenance`。** 兩個可機械式推導的欄位 — `breakdown` 和 `summary` — 是由執行器在階段 1 LLM 結束與階段 2 進入閘道之間計算的 (v1.5.6 叢集 047 架構修復)。執行器會呼叫 `bin.role_map.compute_breakdown(files)` 和 `bin.role_map.summarize_role_map(...)`，並在驗證前將權威值寫入磁碟上的檔案。不要在您的輸出中包含 `breakdown` 或 `summary` — 即使包含，執行器也會將其覆寫。您的工作是分析工作（在 `files[]` 中進行逐檔案角色標記以及 `provenance`）；確定的彙整是由執行器擁有的。（在 v1.5.6 之前，LLM 被指示也要計算這些，這產生了一類失敗情況，即 LLM 回歸到偏離嚴格機械合約的直覺式摘要；執行器端計算移除了此失敗模式。）

標記紀律：
1. `skill-tool` 和 `code` 是具負重能力的區別。只有在 SKILL.md（或 SKILL.md 引用的文件）明確命名並指示代理程式調用該指令碼時，它才是 `skill-tool`。獨立的程式碼模組 — 即使是 `scripts/` 目錄中的小型模組 — 如果沒有 SKILL.md 文字指示代理程式使用它們，則為 `code`。
2. 任何來自先前播放手冊執行的內容（目標的 `quality/` 子樹，或 QPB 本身安裝的 `quality_gate.py` — 無論使用哪種 AI 工具安裝佈局，安裝程式複製到 SKILL.md 旁邊的檔案）皆為 `playbook-output`，絕不會是如果它是目標自身表面時所具有的角色。這可防止 v1.5.3 的 LOC 污染失敗模式，即目標明顯的程式碼表面被 QPB 自身的基礎設施所充實。
3. 如果根目錄缺失 SKILL.md 且沒有其他技能形狀的進入檔案，角色地圖將包含零個 `skill-prose` 條目。這沒問題 — 四步推導管線將針對此目標不執行任何操作 (no-op)。

處理邊緣情況 (v1.5.4 階段 1 邊緣情況紀律)：
- **根目錄無 SKILL.md，無其他技能形狀進入點。** 如常按內容標記每個檔案。角色地圖將攜帶零個 `skill-prose` 和 `skill-reference` 條目；四步管線將無操作。請「不要」發明合成的 SKILL.md 或為一個確實沒有技能表面的專案標記 `skill-prose`。
- **SKILL.md 引用了一個不存在的指令碼。** 向角色地圖新增頂層 `broken_references` 陣列，其中包含 `{{"prose_location": "<檔案>:<列>", "missing_script": "<如引用所示的路徑>"}}` 條目。「不要」為遺漏的指令碼新增合成檔案條目。在 EXPLORATION.md 中註明損壞的引用，以便階段 4 的文字到程式碼飄移檢查可以將其註冊為已知缺口。（此欄位是附加的；閘道的角色地圖驗證器不要求它。）
- **檔案數量非常龐大 (1000+) 的目標。** 採批次處理。`files` 陣列可以在您周遊樹狀結構時增量增長；一旦您做出了所有逐檔案判斷，請一次寫入檔案。「不要」在周遊中途寫入部分角色地圖 — 驗證器在檔案出現時即視其為完整，且執行器端的 `normalize_role_map_for_gate` 步驟 (v1.5.6 叢集 047) 會在您退出階段 1 後計算 `breakdown` 和 `summary`。
- **模糊的文字 (「協助程式指令碼」、「驗證器」)。** 預設為 `code`。`skill-tool` 需要明確的引用：SKILL.md 或被引用的文件必須命名該檔案（或能唯一識別該檔案的路徑字尾），「並且」指示代理程式調用它。如有疑慮，請標記為 `code` 並在 `rationale` 中記錄模糊之處 — 與其充實階段 4 文字到程式碼檢查的操作表面，不如對 `skill-tool` 進行不足標記。
- **產出的檔案 (組建輸出、供應商相依性、鎖定檔)。** 在忽略規則層級跳過它們；不要將它們包含在角色地圖中。如果您無法分辨檔案是否為產出的，請尋找產生標記（命名產生器的標頭註解、同層級 `.generated` 檔案、存在於 `.gitignore` 中）；如果是產出的，請從角色地圖中省略。

當階段 1 完成時，將您完整的探索發現寫入 `quality/EXPLORATION.md`。該檔案「必須」逐字包含下列「所有」章節標題（位於 SKILL.md:1257-1273 的階段 1 閘道會對每一項進行機械式強制執行；`bin/run_state_lib.validate_phase_artifacts(quality_dir, phase=1)` 是程式化執行器 — 您的產出物必須通過該驗證，階段 2 才能啟動）。確切的標題是具備結構負重能力的 — 「請勿」以「等效」標題取代：

1. `## Open Exploration Findings` — 至少 8 個編號條目 (`1.`, `2.`, ...)。每個條目在本文中至少有一個 檔案:列 引用 (例如 `bin/foo.py:120-135`)。這些條目中至少有 3 個必須追蹤跨 2 個或更多不同 檔案:列 位置的行為（多位置追蹤 — 該條目引用兩個或更多不同的檔案:列範圍）。

2. `## Quality Risks` — 基於領域知識的風險分析。使用編號或項目符號；在程式碼或文件中具體可見風險之處引用 檔案:列。

3. `## Pattern Applicability Matrix` — 一個 Markdown 表格，每一列代表來自 `references/exploration_patterns.md` 的一種探索模式。決策資料欄的值為 `FULL` 或 `SKIP`。必須有 3 到 4 種模式被標記為 `FULL`（包含邊界值 — 閘道會拒絕低於 3 種的情況，因為探索未選取足夠模式，且拒絕超過 4 種的情況，因為探索執行了每一種模式而非進行選取）。被跳過的模式仍會列出 `SKIP` 和簡短原因，以便矩陣是詳盡無遺的。

4. `## Pattern Deep Dive — <模式名稱>` — 至少 3 個章節，每個 `FULL` 模式一個。每個深鑽章節都會列舉具備 檔案:列 參照的具體發現。這些章節中至少有 2 個必須追蹤跨 2 個或更多不同識別碼 (例如反引號括起來的函式或符號名稱，如 `\`docs_present\``, `\`_evaluate_documentation_state\``) 「或」跨 2 個或更多不同 檔案:列 位置的程式碼路徑 — 這是閘道偵測「多函式追蹤」而非單一錨點發現的方式。

5. `## Candidate Bugs for Phase 2` — 從深鑽 + 公開探索中提升的候選錯誤編號清單。每個條目都有一個 `Stage:` 行標記來源 (例如 `Stage: open exploration`, `Stage: quality risks`, 或 `Stage: <模式名稱>`)。至少 2 個條目必須源自 `open exploration` / `quality risks`，「並且」至少 1 個條目必須源自模式深鑽。組合階段 (如 `Stage: open exploration + Cross-Implementation Consistency`) 同時計入兩個貯體。

6. `## Gate Self-Check` — 證明您執行了階段 1 閘道。列出 13 項檢查（≥120 列 + 六個必要標題 + ≥3 個模式深鑽章節 + PROGRESS.md 標記 + ≥8 個帶引用的發現 + ≥3 個多位置發現 + 3-4 個 FULL 模式矩陣列 + ≥2 個多函式深鑽 + 候選錯誤來源組合）並標記產出物是否符合每一項。

此外，在宣告階段 1 完成前，請確保 `quality/PROGRESS.md` 存在且其階段 1 行已標記 `[x]`（閘道的檢查項 8）。

先前版本提示所要求的探索內容（領域與技術堆疊識別、架構地圖、現有測試盤點、規格摘要、骨架/分派分析、衍生需求 `REQ-NNN`、衍生使用案例 `UC-NN`、檔案角色標記摘要）位於這些必要章節「內部」 — 例如，架構地圖和模組列舉屬於 `## Open Exploration Findings` 下的多位置發現；檔案角色標記摘要和 `exploration_role_map.json` 明細摘要屬於 `## Open Exploration Findings` 或 `## Quality Risks` 下的分析內容；衍生 `REQ-NNN` 和 `UC-NN` 章節可以出現在 `## Gate Self-Check` 之後，作為播放手冊後續階段取用的額外分析材料。「不要」將這些替代名稱用作「頂層」章節標題 — 閘道需要上述六個精確標題以及模式深鑽 (Pattern Deep Dive) 前綴；超過這些標題的額外 `## ` 章節是可以容忍的分析擴展，但六個閘道要求的標題「必須」逐字出現。

### 強制性笛卡兒使用案例規則 (CARTESIAN UC RULE) (槓桿 1, v1.5.2)

對於每個 `References` 欄位命名 ≥2 個檔案（或在不同檔案中有 ≥2 個檔案:列範圍）的需求，在決定發出單一傘狀 UC 還是各位置獨立 UC 前，請套用 **笛卡兒適用性檢查 (Cartesian eligibility check)**：

**閘道 1 — 路徑字尾匹配。** 至少有兩個引用必須共享路徑字尾角色：副檔名前的最後一個區段，或跨檔案出現的相符函式名稱樣式。
- 匹配範例：`virtio_mmio.c`、`virtio_vdpa.c`、`virtio_pci_modern.c` 都實作了 `_finalize_features`。`_finalize_features` 函式是共享角色。
- 不匹配範例：同一個 kconfig 檔案中的 `CONFIG_FOO`、`CONFIG_BAR` 旗標 — 同類事物，但非平行實作。

**閘道 2 — 函式級別相似性。** 每個相符的引用必須引用大小相似（在中位數 2 倍以內）的列範圍，且每個範圍必須位於函式主體內 — 而不是檔案標頭、kconfig 區塊或巨集展開清單。

**決策：**
- **兩個閘道均通過 →** 針對每個位置發出一個 UC，編號為 `UC-N.a`、`UC-N.b`、`UC-N.c`……每個位置獨立 UC 都有其自身的參與者、前置條件、流程、後置條件。父項 REQ-N 保留作為傘狀結構。
- **僅閘道 1 通過 →** 保留單一傘狀 UC，並在 UC 主體的 `<!-- cluster: heterogeneous -->` HTML 註解中將引用叢集標記為 `heterogeneous` (異質)。如果階段 3 發現位置間存在分歧，仍可進行覆寫。
- **兩個閘道均未通過 →** 單一傘狀 UC，不進行特殊標記。

### 工作範例 — REQ-010 / VIRTIO_F_RING_RESET (virtio)

假設階段 1 衍生出：

    ### REQ-010: Virtio 傳輸必須遵守 VIRTIO_F_RING_RESET 協商
    - 引用：drivers/virtio/virtio_mmio.c, drivers/virtio/virtio_vdpa.c, drivers/virtio/virtio_pci_modern.c
    - 模式：whitelist

套用笛卡兒檢查：
- 閘道 1：所有三個檔案都包含 `_finalize_features` 函式 — 匹配。
- 閘道 2：每個被引用的範圍都在大小相似的函式主體內 — 匹配。

兩個閘道均通過 → 發出各位置獨立 UC：

    ### UC-10.a: PCI modern 傳輸上的 VIRTIO_F_RING_RESET
    - 參與者：virtio_pci_modern 驅動程式、客體核心 (guest kernel)
    - 前置條件：裝置通告 VIRTIO_F_RING_RESET
    - 流程：vp_modern_finalize_features 透過設定空間傳播位元……
    - 後置條件：特徵位元反映在最終設定中

    ### UC-10.b: MMIO 傳輸上的 VIRTIO_F_RING_RESET
    - 參與者：virtio_mmio 驅動程式、客體核心
    - 前置條件：裝置通告 VIRTIO_F_RING_RESET
    - 流程：vm_finalize_features 必須鏡像 PCI modern 的行為……
    - 後置條件：特徵位元在 finalize 呼叫後得以保留

    ### UC-10.c: vDPA 傳輸上的 VIRTIO_F_RING_RESET
    - 參與者：virtio_vdpa 驅動程式、vdpa 裝置後端
    - 前置條件：裝置通告 VIRTIO_F_RING_RESET
    - 流程：virtio_vdpa_finalize_features 透過 set_driver_features 轉發……
    - 後置條件：特徵位元對 vdpa 後端可見

### 確認清單 (笛卡兒使用案例規則)

在完成階段 1 之前，請在 EXPLORATION.md 中標題為「笛卡兒使用案例規則確認」的章節中明確確認每一項：

1. 對於每個具有 ≥2 個引用的 REQ，我執行了閘道 1（路徑字尾匹配）。
2. 對於每個通過閘道 1 的 REQ，我執行了閘道 2（函式級別相似性）。
3. 在兩個閘道均通過之處，我發出了各位置獨立 UC (UC-N.a, UC-N.b, …)。
4. 在僅閘道 1 通過之處，我將叢集標記為 `<!-- cluster: heterogeneous -->`。
5. 在兩個閘道均未通過之處，我保留了單一傘狀 UC 且未作標記。
6. 對於閘道 1 中有模式匹配的每個 REQ，我向 REQ 區塊新增了 `Pattern: whitelist|parity|compensation`。

同時使用執行 Metadata 和下方的「確切」核取方塊格式初始化 `quality/PROGRESS.md` 中的階段追蹤器。此格式是硬性合約：階段 5 閘道會檢查子字串 `- [x] Phase 4`，才允許對帳開始，且該閘道僅匹配核取方塊形式。「請勿」以 Markdown 表格、項目符號文字或任何其他佈局取代 — 使用表格格式的執行曾在管線中途終止，因為閘道不認為表格儲存格中的「完成」是等效的。

PROGRESS.md 的階段追蹤器章節範本（填入來自 SKILL.md Metadata 的技能版本）：

```
# 品質播放手冊進度 (Quality Playbook Progress)

技能版本：<vX.Y.Z>
日期：<YYYY-MM-DD>

## 階段追蹤器

- [x] 階段 1 - 探索 (Explore)
- [ ] 階段 2 - 產生 (Generate)
- [ ] 階段 3 - 程式碼審查 (Code Review)
- [ ] 階段 4 - 規格稽核 (Spec Audit)
- [ ] 階段 5 - 對帳 (Reconciliation)
- [ ] 階段 6 - 驗證 (Verify)
```

隨著後續各階段的完成，它會將其自身的 `- [ ]` 翻轉為 `- [x]` — 請保持行內文字（包括破折號後的階段名稱）穩定，以便階段 5 閘道中的子字串匹配和下游工具能正常運作。

重要：請「不要」繼續進入階段 2。您唯一的工作是探索並將發現寫入磁碟。請撰寫徹底、詳細的發現 — 下一階段將閱讀 EXPLORATION.md 以產生各項成品，因此所有重要事項都必須記錄在該檔案中。
