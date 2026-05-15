# phase_prompts/

品質播放手冊 (Quality Playbook) 的外部化階段提示主體。

v1.5.4 F-1 (Bootstrap_Findings 2026-04-30) 將這些內容從 `bin/run_playbook.py` 的行內字串範本中擷取出來，以便兩種執行模式 — UI 上下文技能直接執行 (UI-context skill-direct) (編碼代理程式行內周遊 SKILL.md) 和 CLI 自動化執行器驅動執行 (CLI-automation runner-driven) (`python -m bin.run_playbook`) — 都能從同一個單一真實來源 (single source of truth) 讀取內容。如果沒有外部化，這兩種模式會發生飄移；有了它，對階段提示的編輯只需執行一次即可讓兩者受益。

## 檔案佈局

- `phase1.md` ... `phase6.md` — 每個管線階段一個檔案。由 `bin/run_playbook.py::_load_phase_prompt` 載入。
- `single_pass.md` — 舊版的單次提示調用 (當操作員希望 LLM 行內驅動所有六個階段，而非透過逐階段協調器時使用)。
- `iteration.md` — 反覆運算策略提示 (gap, unfiltered, parity, adversarial — 參見 `bin/run_playbook.py::next_strategy`)。

## 替換慣例

大多數檔案是純文字的 Markdown — 載入器會原封不動地傳回它們。有三個檔案使用具有具名佔位符的 `str.format()` 進行替換：

- `phase1.md` — `{seed_instruction}` (在 `--no-seeds` 時跳過階段 0/0b 的開場白) 以及 `{role_taxonomy}` (從 `bin.role_map.ROLE_DESCRIPTIONS` 轉譯而來)。
- `single_pass.md` — `{skill_fallback_guide}` 以及 `{seed_instruction}`。
- `iteration.md` — `{skill_fallback_guide}` 以及 `{strategy}`。

在經過 `.format()` 處理的檔案內部，JSON 大括號和其他常值 `{` / `}` 字元「必須」根據 Python 的格式化字串逸出規則加倍為 (`{{` / `}}`)。純文字檔案不需要任何逸出處理。

## 編輯紀律

當您更改階段提示時，載入器會在下一次調用時獲取新內容 — 不存在需要使其失效的快取層。位於 `bin/tests/test_phase_prompts_externalized.py` 的測試套件固定了載入器的合約；如果您新增了新的替換變數，請擴展那些測試。
