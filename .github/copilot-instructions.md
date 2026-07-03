以下說明僅在進行程式碼審查時套用。

## README 更新

- [ ] 新檔案應新增至 `docs/README.<type>.md`。

## Prompt 檔案指南

**僅套用於以 `.prompt.md` 結尾的檔案**

- [ ] Prompt 具有 markdown front matter。
- [ ] Prompt 指定了 `agent` 欄位，其值為 `agent`、`ask` 或 `Plan` 其中之一。
- [ ] Prompt 具有 `description` 欄位。
- [ ] `description` 欄位不可為空。
- [ ] 檔案名稱為小寫，單字之間以連字號分隔。
- [ ] 鼓勵使用 `tools`，但非強制要求。
- [ ] 強烈建議使用 `model` 來指定該 prompt 所最佳化的模型。
- [ ] 強烈建議使用 `name` 來設定該 prompt 的名稱。

## Instruction 檔案指南

**僅套用於以 `.instructions.md` 結尾的檔案**

- [ ] Instruction 具有 markdown front matter。
- [ ] Instruction 具有 `description` 欄位。
- [ ] `description` 欄位不可為空。
- [ ] 檔案名稱為小寫，單字之間以連字號分隔。
- [ ] Instruction 具有 `applyTo` 欄位，用以指定該說明所套用的一個或多個檔案。若要指定多個檔案路徑，其格式應類似於 `'**.js, **.ts'`。

## Agent 檔案指南

**僅套用於以 `.agent.md` 結尾的檔案**

- [ ] Agent 具有 markdown front matter。
- [ ] Agent 具有 `description` 欄位。
- [ ] `description` 欄位不可為空。
- [ ] 檔案名稱為小寫，單字之間以連字號分隔。
- [ ] 鼓勵使用 `tools`，但非強制要求。
- [ ] 強烈建議使用 `model` 來指定該 agent 所最佳化的模型。
- [ ] 強烈建議使用 `name` 來設定該 agent 的名稱。

## Agent Skills 指南

**僅套用於 `skills/` 目錄中的資料夾**

- [ ] Skill 資料夾包含一個 `SKILL.md` 檔案。
- [ ] SKILL.md 具有 markdown front matter。
- [ ] SKILL.md 具有 `name` 欄位。
- [ ] `name` 欄位值為小寫，單字之間以連字號分隔。
- [ ] `name` 欄位與資料夾名稱相符。
- [ ] SKILL.md 具有 `description` 欄位。
- [ ] `description` 欄位不可為空，長度至少為 10 個字元，且最多為 1024 個字元。
- [ ] `description` 欄位值被包在單引號中。
- [ ] 資料夾名稱為小寫，單字之間以連字號分隔。
- [ ] 任何隨附的資產（指令碼、範本、資料檔案）皆在 SKILL.md 的說明中被引用。
- [ ] 隨附的資產大小合理（每個檔案小於 5MB）。

## Plugin 指南

**僅套用於 `plugins/` 目錄中的目錄**

- [ ] Plugin 目錄包含一個 `.github/plugin/plugin.json` 檔案。
- [ ] Plugin 目錄包含一個 `README.md` 檔案.
- [ ] plugin.json 具有一個與目錄名稱相符的 `name` 欄位。
- [ ] plugin.json 具有 `description` 欄位。
- [ ] `description` 欄位不可為空。
- [ ] 目錄名稱為小寫，單字之間以連字號分隔。
- [ ] 若存在 `tags`，則其應為小寫且以連字號分隔的字串陣列。
- [ ] 若存在 `items`，則每個項目皆具有 `path` 與 `kind` 欄位。
- [ ] `kind` 欄位的值為下列之一：`prompt`、`agent`、`instruction`、`skill` 或 `hook`。
- [ ] Plugin 不得引用不存在的檔案。
