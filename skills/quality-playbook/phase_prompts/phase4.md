{skill_fallback_guide}

您是一位品質工程師，正在繼續執行逐階段的品質播放手冊。階段 1-3 已經完成。

請閱讀下列檔案以獲取內容：
1. quality/PROGRESS.md - 執行 Metadata、階段狀態、漏洞 (BUG) 追蹤器
2. quality/REQUIREMENTS.md - 衍生的需求
3. quality/BUGS.md - 在階段 3 (程式碼審查) 中發現的漏洞
4. SKILL.md - 閱讀階段 4 的章節 (「階段 4：規格稽核與分類」)。同時閱讀 references/spec_audit.md。請透過上述的文件後備方案清單解析 SKILL.md 與 references/ 目錄；「請勿」假設任何單一的安裝佈局。

執行階段 4：規格稽核 + 分類 + 第 2 層語意引用檢查。

部分 A — 規格稽核：
按照 quality/RUN_SPEC_AUDIT.md 執行規格稽核。產出：
- 個別稽核員報告，位於 quality/spec_audits/YYYY-MM-DD-auditor-N.md (每位稽核員一份)
- 分類綜合報告，位於 quality/spec_audits/YYYY-MM-DD-triage.md
- 可執行的分類探針，位於 quality/spec_audits/triage_probes.sh
- 針對任何淨新規格稽核漏洞的迴歸測試與補丁
- 使用任何新發現更新 BUGS.md 與 PROGRESS.md 的漏洞追蹤器

部分 B — 第 2 層語意引用檢查 (v1.5.1)：
閘道的不變量 #17 (schemas.md §10) 要求三位 Council 成員對每個第 1/2 層 REQ 的 citation_excerpt 進行投票。請執行下列步驟：

1. 產生每位 Council 成員的提示：
     python3 -m bin.quality_playbook semantic-check plan .
   這將為 Council 名冊中的每位成員 (bin/council_config.py: claude-opus-4.7, gpt-5.4,
   gemini-2.5-pro) 在 quality/council_semantic_check_prompts/<成員>.txt 寫入一或多個提示檔案。
   對於 >15 個第 1/2 層 REQ，提示將拆分為 5 個一組的批次 (<成員>-batch<N>.txt)。
   如果不存在第 1/2 層 REQ (規格落差執行)，此步驟會直接寫入一個空的
   quality/citation_semantic_check.json — 請跳過第 2-4 步。

2. 對於每位 Council 成員的提示檔案，將提示輸入該模型 (執行部分 A 的同一名冊)，
   並將其 JSON 陣列回應擷取到 quality/council_semantic_check_responses/<成員>.json。
   如果成員的回應是分批次的，請將各批次的回應合併到回應檔案中的單一陣列。
   每個條目都必須具有 req_id, verdict (supports|overreaches|unclear) 和 reasoning (理由)。

3. 組裝語意檢查輸出：
     python3 -m bin.quality_playbook semantic-check assemble . \
       --member claude-opus-4.7 --response quality/council_semantic_check_responses/claude-opus-4.7.json \
       --member gpt-5.4         --response quality/council_semantic_check_responses/gpt-5.4.json \
       --member gemini-2.5-pro  --response quality/council_semantic_check_responses/gemini-2.5-pro.json
   這將按照 schemas.md §9 寫入 quality/citation_semantic_check.json。

4. 驗證輸出檔案是否存在。階段 6 的閘道不變量 #17 要求在每次第 1/2 層執行中都必須有此檔案。

在 PROGRESS.md 中標記階段 4 (規格稽核 + 分類 + 語意檢查) 已完成（使用核取方塊格式 `- [x] Phase 4 - Spec Audit` — 階段 5 進入閘道會尋找該確切子字串，如果發現表格列或任何其他佈局，則會中止執行）。

重要：請「不要」繼續進入階段 5 (對帳)。下一階段將處理對帳與 TDD。
