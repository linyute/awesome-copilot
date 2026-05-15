{skill_fallback_guide}

您是一位品質工程師，正在繼續執行逐階段的品質播放手冊。階段 1 (探索) 已經完成。

請閱讀下列檔案以獲取內容：
1. quality/EXPLORATION.md - 您在階段 1 的發現 (需求、風險、架構)
2. quality/PROGRESS.md - 執行 Metadata 和階段狀態
3. SKILL.md - 閱讀階段 2 的章節 (從「階段 2：產生品質播放手冊」到「檢查點：產生產出物後更新 PROGRESS.md」章節)。同時閱讀該章節引用的參考檔案。請透過上述的文件後備方案清單解析 SKILL.md 和參考檔案；「請勿」假設任何單一的安裝佈局 (`.github/skills/`, `.claude/skills/quality-playbook/`, `.cursor/skills/quality-playbook/`, `.continue/skills/quality-playbook/` 或根目錄)。

**欄位保留規則 (v1.5.2, 槓桿 2)。** 在將 EXPLORATION.md 中的 REQ 假設轉錄到 `quality/REQUIREMENTS.md` 和 `quality/requirements_manifest.json` 時，來源假設上存在的每個 `- Pattern: <值>` 欄位「必須」出現在這兩個輸出檔案的對應 REQ 中。Pattern 的值為 `whitelist | parity | compensation`。階段 1 的笛卡兒使用案例規則 (確認清單第 6 項) 要求對兩個使用案例閘道皆匹配的每個 REQ 進行 Pattern 標記；階段 2 絕不能默默捨棄這些標記。如果您認為某個假設應該有 Pattern 但目前缺失 (例如以 `UC-N.a`/`UC-N.b` 字尾發出的各位置獨立 UC、建議平行結構的多檔案 `References`)，請在階段 2 期間新增 Pattern — 「請勿」省略該欄位。階段 5 的基數閘道無法對它不知道是模式標記的 REQ 強制執行涵蓋範圍；默默省略是記錄在案的 v1.4.5 退步向量。

執行階段 2：產生所有品質成品。使用 EXPLORATION.md 中的探索發現作為來源 — 「不要」重新從頭探索程式碼庫。產生：
- quality/QUALITY.md (品質憲法)
- quality/CONTRACTS.md (行為合約)
- quality/REQUIREMENTS.md (包含來自 EXPLORATION.md 的 REQ-NNN 和 UC-NN 識別碼)
- quality/COVERAGE_MATRIX.md
- 功能測試 (quality/test_functional.*)
- quality/RUN_CODE_REVIEW.md (程式碼審查協定)
- quality/RUN_INTEGRATION_TESTS.md (整合測試協定)
- quality/RUN_SPEC_AUDIT.md (規格稽核協定)
- quality/RUN_TDD_TESTS.md (TDD 驗證協定)
- quality/COMPLETENESS_REPORT.md (基準線，不含判定結果)
- 如果存在分派/列舉合約：包含 verify.sh 和擷取產出物的 quality/mechanical/。立即執行 verify.sh 並儲存收據。

更新 PROGRESS.md：標記階段 2 已完成（使用核取方塊格式 `- [x] Phase 2 - Generate` — 「請勿」切換為表格），更新產出物清單。

重要：請「不要」繼續進入階段 3 (程式碼審查)。您的工作僅限於產出物生成。下一階段將執行您產生的審查協定。
