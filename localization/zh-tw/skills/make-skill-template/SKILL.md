---
name: make-skill-template
description: '從提示語或透過複製此範本來建立新的 GitHub Copilot Agent Skills。當被要求「建立技能」、「製作新技能」、「建構技能架構」或使用隨附資源建構專門的 AI 能力時使用。產生具備正確 Frontmatter、目錄結構以及選用的 scripts/references/assets 資料夾的 SKILL.md 檔案。'
---

# 製作技能範本 (Make Skill Template)

一個用於建立新 Agent Skills 的元技能 (Meta-skill)。當你需要建構新的技能資料夾架構、產生 SKILL.md 檔案或協助使用者理解 Agent Skills 規範時，請使用此技能。

## 何時使用此技能

- 使用者要求「建立一個技能」、「製作一個新技能」或「建構一個技能架構 (scaffold a skill)」
- 使用者想要在他們的 GitHub Copilot 設定中加入專門的能力
- 使用者需要協助建構包含隨附資源的技能
- 使用者想要複製此範本作為起點

## 必要條件

- 理解該技能應該完成什麼工作
- 對能力和觸發條件有清楚且包含關鍵字的說明
- 瞭解所需的任何隨附資源 (指令碼、參考資料、資產、範本)

## 建立新技能

### 步驟 1：建立技能目錄

建立一個名稱為小寫且使用連字號分隔的資料夾：

```
skills/<skill-name>/
└── SKILL.md          # 必要
```

### 步驟 2：產生具備 Frontmatter 的 SKILL.md

每個技能都需要包含 `name` 和 `description` 的 YAML Frontmatter：

```yaml
---
name: <skill-name>
description: '<做什麼工作>。當 <使用者可能說出的特定觸發條件、情境、關鍵字> 時使用。'
---
```

#### Frontmatter 欄位要求

| 欄位 | 必要 | 限制條件 |
|-------|----------|-------------|
| `name` | **是** | 1-64 個字元，僅限小寫字母/數字/連字號，必須與資料夾名稱相符 |
| `description` | **是** | 1-1024 個字元，必須說明它「做什麼」以及「何時」使用它 |
| `license` | 否 | 授權名稱或對隨附 LICENSE.txt 的參考 |
| `compatibility` | 否 | 1-500 個字元，如有需要則填寫環境要求 |
| `metadata` | 否 | 額外屬性的鍵值對 (Key-value pairs) |
| `allowed-tools` | 否 | 預先核准的工具列表 (實驗性，以空格分隔) |

#### 說明 (Description) 最佳實踐

**關鍵事項**：`description` 是自動技能探索的主要機制。請包含：

1. 該技能**做什麼** (能力)
2. **何時**使用它 (觸發條件、情境、檔案類型)
3. 使用者可能在提示語中提到的**關鍵字**

**佳例：**

```yaml
description: '使用 Playwright 測試本地網頁應用程式的工具箱。當被要求驗證前端功能、偵錯 UI 行為、擷取瀏覽器螢幕截圖或檢視瀏覽器主控台記錄時使用。支援 Chrome、Firefox 和 WebKit。'
```

**拙例：**

```yaml
description: '網頁測試輔助工具'
```

### 步驟 3：撰寫技能主體

在 Frontmatter 之後，加入 Markdown 指示。建議的區段如下：

| 區段 | 目的 |
|---------|---------|
| `# 標題` | 簡要總覽 |
| `## 何時使用此技能` | 強化說明中的觸發條件 |
| `## 必要條件` | 所需工具、相依性 |
| `## 逐步工作流程` | 任務的編號步驟 |
| `## 疑難排解` | 常見問題與解決方案 |
| `## 參考資料` | 指向隨附文件的連結 |

### 步驟 4：加入選用目錄 (如果需要)

| 資料夾 | 目的 | 何時使用 |
|--------|---------|-------------|
| `scripts/` | 可執行程式碼 (Python, Bash, JS) | 執行操作的自動化 |
| `references/` | Agent 讀取的文件 | API 參考、結構描述 (Schemas)、指南 |
| `assets/` | 原樣使用的靜態檔案 | 圖片、字型、範本 |
| `templates/` | Agent 修改的起點程式碼 | 用於擴充的架構 (Scaffolds) |

## 範例：完整的技能結構

```
my-awesome-skill/
├── SKILL.md                    # 必要指示
├── LICENSE.txt                 # 選用授權檔案
├── scripts/
│   └── helper.py               # 可執行自動化
├── references/
│   ├── api-reference.md        # 詳細文件
│   └── examples.md             # 使用範例
├── assets/
│   └── diagram.png             # 靜態資源
└── templates/
    └── starter.ts              # 程式碼架構
```

## 快速入門：複製此範本

1. 複製 `make-skill-template/` 資料夾
2. 重新命名為你的技能名稱 (小寫、連字號)
3. 更新 `SKILL.md`：
   - 變更 `name:` 以符合資料夾名稱
   - 撰寫包含豐富關鍵字的 `description:`
   - 將主體內容替換為你的指示
4. 根據需要加入隨附資源
5. 使用 `npm run skill:validate` 進行驗證

## 驗證核查清單

- [ ] 資料夾名稱為小寫且包含連字號
- [ ] `name` 欄位與資料夾名稱完全相符
- [ ] `description` 長度為 10-1024 個字元
- [ ] `description` 說明了「做什麼」以及「何時」
- [ ] `description` 使用單引號包裹
- [ ] 主體內容在 500 行以內
- [ ] 隨附資產每個都在 5MB 以內

## 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| 找不到技能 | 使用更多關鍵字和觸發條件來改進說明 |
| 名稱驗證失敗 | 確保使用小寫、無連續連字號，且與資料夾相符 |
| 說明太短 | 加入能力、觸發條件和關鍵字 |
| 找不到資產 | 使用相對於技能根目錄的相對路徑 |

## 參考資料

- Agent Skills 官方規範：<https://agentskills.io/specification>
