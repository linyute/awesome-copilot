---
name: secret-scanning
description: 'GitHub 祕密掃描、推送保護、自訂模式以及祕密警示補救的組態設定與管理指南。對於在 AI 程式碼編寫代理程式中經由 GitHub MCP 伺服器進行提交前的祕密掃描，此技能參考了進階安全性外掛程式 (`advanced-security@copilot-plugins`)。在啟用祕密掃描、設定推送保護、定義自訂模式、分級警示、解決遭封鎖的推送，或當代理程式在提交前需要掃描程式碼中的祕密時，請使用此技能。'
---

# 祕密掃描

本技能提供設定 GitHub 祕密掃描的程序指南 — 偵測洩漏的認證、防止祕密推送、定義自訂模式以及管理警示。

## 何時使用此技能

當請求涉及以下內容時，請使用此技能：

- 為儲存庫或組織啟用或設定祕密掃描
- 設定推送保護，以在祕密到達儲存庫之前進行封鎖
- 使用正規表示式定義自訂祕密模式
- 從命令列解決遭封鎖的推送
- 分級、忽略或補救祕密掃描警示
- 為推送保護設定委派略過
- 透過 `secret_scanning.yml` 從祕密掃描中排除目錄
- 瞭解警示類型 (使用者、合作夥伴、推送保護)
- 啟用有效性檢查或延伸 Metadata 檢查
- 在提交前掃描本機程式碼變更中的祕密 (經由 MCP / AI 程式碼編寫代理程式) — 請參閱下方的 **經由 AI 程式碼編寫代理程式進行提交前掃描** 一節以取得推薦的外掛程式

## 祕密掃描的運作方式

祕密掃描會自動偵測以下範圍內暴露的認證：

- 所有分支上的整個 Git 歷史記錄
- 問題 (Issue) 的描述、評論和標題 (開啟和關閉)
- 提取要求 (Pull Request) 的標題、描述和評論
- GitHub 討論 (Discussions) 的標題、描述和評論
- Wiki 和祕密 Gist

### 可用性

| 儲存庫類型 | 可用性 |
|---|---|
| 公開儲存庫 | 自動、免費 |
| 私有/內部 (組織擁有) | 在 Team/Enterprise Cloud 上需要 GitHub 祕密保護 |
| 使用者擁有 | 具備企業管理使用者 (EMU) 的 Enterprise Cloud |

## 核心工作流程 — 啟用祕密掃描

### 步驟 1：啟用祕密保護

1. 導覽至儲存庫 **設定** → **進階安全性**
2. 點擊「祕密保護」旁邊的 **啟用**
3. 點擊 **啟用祕密保護** 以確認

對於組織，請使用安全性組態來大規模啟用：
- 設定 → 進階安全性 → 全域設定 → 安全性組態

### 步驟 2：啟用推送保護

推送保護在推送過程中封鎖祕密 — 在它們到達儲存庫之前。

1. 導覽至儲存庫 **設定** → **進階安全性**
2. 在「祕密保護」下啟用「推送保護」

推送保護會封鎖以下各項中的祕密：
- 命令列推送
- GitHub UI 提交
- 檔案上傳
- REST API 請求
- REST API 內容建立端點

### 步驟 3：設定排除項 (選填)

建立 `.github/secret_scanning.yml` 以自動關閉特定目錄的警示：

```yaml
paths-ignore:
  - "docs/**"
  - "test/fixtures/**"
  - "**/*.example"
```

**限制：**
- `paths-ignore` 中最多 1,000 個項目
- 檔案必須小於 1 MB
- 排除的路徑也會跳過推送保護檢查

**最佳實踐：**
- 排除路徑應盡可能具體
- 新增評論解釋為何排除各個路徑
- 定期審閱排除項 — 移除過時的項目
- 將排除項告知安全性團隊

### 步驟 4：啟用額外功能 (選填)

**非提供者模式** — 偵測私鑰、連接字串、泛用 API 金鑰：
- 設定 → 進階安全性 → 啟用「掃描非提供者模式」

**AI 驅動的泛用祕密偵測** — 使用 Copilot 偵測非結構化祕密 (如密碼)：
- 設定 → 進階安全性 → 啟用「使用 AI 偵測」

**有效性檢查** — 驗證偵測到的祕密是否仍然有效：
- 設定 → 進階安全性 → 啟用「有效性檢查」
- GitHub 會定期針對提供者 API 測試偵測到的認證
- 警示中顯示的狀態：`active` (有效)、`inactive` (無效) 或 `unknown` (未知)

**延伸 Metadata 檢查** — 關於誰擁有祕密的額外內容：
- 需要先啟用有效性檢查
- 有助於優先處理補救工作並識別負責團隊

## 核心工作流程 — 解決遭封鎖的推送

當推送保護從命令列封鎖推送時：

### 選項 A：移除祕密

**如果祕密在最新的提交中：**
```bash
# 移除檔案中的祕密
# 然後修正提交
git commit --amend --all
git push
```

**如果祕密在較早的提交中：**
```bash
# 尋找包含祕密的最早提交
git log

# 在該提交之前開始互動式變更基準
git rebase -i <COMMIT-ID>~1

# 將有問題的提交之 'pick' 更改為 'edit'
# 移除祕密，然後：
git add .
git commit --amend
git rebase --continue
git push
```

### 選項 B：略過推送保護

1. 造訪推送錯誤訊息中傳回的 URL (以同一位使用者身分)
2. 選擇略過原因：
   - **用於測試** — 已建立警示並自動關閉
   - **這是誤判 (false positive)** — 已建立警示並自動關閉
   - **我稍後再修復** — 已建立未關閉的警示
3. 點擊 **允許我推送此祕密**
4. 在 3 小時內重新推送

### 選項 C：請求略過權限

如果啟用了委派略過且您缺乏略過權限：
1. 造訪推送錯誤中的 URL
2. 新增評論解釋為何該祕密是安全的
3. 點擊 **提交請求**
4. 等待核准/拒絕的電子郵件通知
5. 如果核准，則推送提交；如果拒絕，則移除祕密

> 有關詳細的略過和委派略過工作流程，請搜尋 `references/push-protection.md`。

## 自訂模式

使用正規表示式定義組織特定的祕密模式。

### 快速設定

1. 設定 → 進階安全性 → 自訂模式 → **建立新模式**
2. 輸入模式名稱和祕密格式的正規表示式
3. 新增範例測試字串
4. 點擊 **儲存並測試執行** 進行測試 (最多 1,000 個結果)
5. 審閱結果是否誤判
6. 點擊 **發佈模式**
7. 選擇性地為該模式啟用推送保護

### 範圍

自訂模式可以在以下層級定義：
- **儲存庫層級** — 僅套用於該儲存庫
- **組織層級** — 套用於所有啟用了祕密掃描的儲存庫
- **企業層級** — 套用於所有組織

### Copilot 輔助模式產生

使用 Copilot 祕密掃描從祕密類型的文字說明 (包含選填的範例字串) 產生正規表示式。

> 有關詳細的自訂模式設定，請搜尋 `references/custom-patterns.md`。

## 警示管理

### 警示類型

| 類型 | 說明 | 可見性 |
|---|---|---|
| **使用者警示** | 在儲存庫中發現的祕密 | 「安全性」索引標籤 |
| **推送保護警示** | 經由略過推送的祕密 | 「安全性」索引標籤 (篩選條件：`bypassed: true`) |
| **合作夥伴警示** | 回報給提供者的祕密 | 不顯示在儲存庫中 (僅限提供者) |

### 警示清單

- **預設警示** — 支援的提供者模式和自訂模式
- **泛用警示** — 非提供者模式和 AI 偵測到的祕密 (每個儲存庫限制 5,000 個)

### 補救優先順序

1. **立即輪換認證** — 這是關鍵動作
2. 審閱警示的內容 (位置、提交、作者)
3. 檢查有效性狀態：`active` (緊急)、`inactive` (較低優先順序)、`unknown`
4. 視需要從 Git 歷史記錄中移除 (耗時，輪換後通常沒必要)

### 忽略警示

使用記錄的原因忽略：
- **誤判 (False positive)** — 偵測到的字串不是真正的祕密
- **已撤銷** — 認證已被撤銷
- **用於測試** — 祕密僅存在於測試程式碼中

> 有關詳細的警示類型、有效性檢查和 REST API，請搜尋 `references/alerts-and-remediation.md`。

## 經由 AI 程式碼編寫代理程式進行提交前掃描

若要在提交前在 AI 程式碼編寫代理程式內部掃描程式碼變更中的祕密，請安裝 **進階安全性外掛程式 (Advanced Security plugin)**，它提供 `run_secret_scanning` MCP 工具和專用的掃描技能。

**GitHub Copilot CLI:**
```bash
/plugin install advanced-security@copilot-plugins
```

**Visual Studio Code:**
- 在 Copilot Chat, 開啟 **對話：外掛程式 (Chat: Plugins)** (或使用 `@agentPlugins`) 並安裝 `advanced-security` 外掛程式
- 然後在 Copilot Chat 執行 `/secret-scanning`

參閱：[進階安全性外掛程式 — 祕密掃描技能](https://github.com/github/copilot-plugins/blob/main/plugins/advanced-security/skills/secret-scanning/SKILL.md)

> 於 [AI 程式碼編寫代理程式經由 GitHub MCP 伺服器進行祕密掃描](https://github.blog/changelog/2026-03-17-secret-scanning-in-ai-coding-agents-via-the-github-mcp-server/) (2026 年 3 月) 宣布

## 參考檔案

如需詳細說明文件，請視需要載入以下參考檔案：

- `references/push-protection.md` — 推送保護機制、略過工作流程、委派略過、使用者推送保護
  - 搜尋模式：`bypass`, `delegated`, `bypass request`, `command line`, `REST API`, `user push protection`
- `references/custom-patterns.md` — 自訂模式建立、正規表示式語法、測試執行、Copilot 正規表示式產生、範圍
  - 搜尋模式：`custom pattern`, `regex`, `dry run`, `publish`, `organization`, `enterprise`, `Copilot`
- `references/alerts-and-remediation.md` — 警示類型、有效性檢查、延伸 Metadata、泛用警示、祕密移除、REST API
  - 搜尋模式：`user alert`, `partner alert`, `validity`, `metadata`, `generic`, `remediation`, `git history`, `REST API`
