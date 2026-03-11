# 模組 5：技能系統 (Module 5: Skills System)

## 什麼是技能？ (What are skills?)

- AI 可以呼叫的專業功能套件
- 將它們視為具有領域特定知識的「專家模式」
- 透過 `/skills` 指令進行管理

## 技能位置 (Skill locations)

| 層級 | 位置 |
|-------|----------|
| 使用者 | `~/.copilot/skills/<name>/SKILL.md` |
| 存放庫 | `.github/skills/<name>/SKILL.md` |
| 組織 | 透過組織層級設定共享 |

## 建立自訂技能 (Creating a custom skill)

1. 建立目錄：`mkdir -p ~/.copilot/skills/my-skill/`
2. 建立包含 YAML Frontmatter（`name`、`description`，選填 `tools`）的 `SKILL.md`
3. 撰寫 AI 行為的詳細指令
4. 使用 `/skills` 進行驗證

## 技能設計最佳實踐 (Skill design best practices)

- **清晰的描述** — 幫助 AI 自動將任務與您的技能配對
- **專注的範圍** — 每個技能應專注於做好一件事
- **包含指令** — 明確指定技能應如何運作
- **徹底測試** — 使用 `/skills` 進行驗證，然後呼叫並檢查結果

## 自動配對 (Auto-matching)

當您描述一項任務時，AI 會檢查是否有任何技能相符，並建議使用它。
