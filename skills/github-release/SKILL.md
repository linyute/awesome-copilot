---
name: github-release
description: >
  引導 IA 完成 GitHub 函式庫新版本的端對端發布。
  自動處理 SemVer 版本管理與 Keep a Changelog 格式化。
compatibility: "需要：gh CLI 與 git"
---

# GitHub 發布技能

此技能可自動化單一封裝 (single-package) GitHub 存放庫的完整發布工作流程，
涵蓋從分析、變更日誌 (changelog) 撰寫到 PR 建立的過程。它完全依賴 
`gh` (GitHub CLI) 與 `git` — 不需要其他工具。

步驟 1–4 為**唯讀勘查** — 在步驟 5 確認版本號之前，不會對存放庫進行任何寫入。

## 何時使用此技能

每當使用者想要發布新版本、發行新版、升級版本、建立發布分支、產生變更日誌或 
在 GitHub 存放庫上開啟發布 PR 時，請使用此技能。即使使用者口語化地說出 
「讓我們發布一個新版本」或「是時候發布了」之類的內容，也要觸發此技能。

---

## 前提條件

下方的範例同時包含 Bash 與 PowerShell 變體；Windows 使用者應優先使用 
PowerShell 區塊。

在開始之前，請驗證環境：

```bash
gh auth status                        # 必須已通過身分驗證
gh repo view --json nameWithOwner     # 必須在 GitHub 存放庫中
git status                            # 工作樹應該是乾淨的
```

如果任何檢查失敗，請停止並告知使用者在繼續之前需要修正的問題。

接著詢問使用者一個問題：

> *「哪一個目錄包含您函式庫對外公開的原始程式碼？
> (例如 `src/`, `lib/`, `pkg/` — 用於將差異比較對焦在使用者實際
> 看到的內容。按 Enter 鍵以掃描整個存放庫。）」*

將答案儲存為 `PUBLIC_PATH`。如果為空，`PUBLIC_PATH` 即為 `.` (存放庫根目錄)。
無論如何，請從所有差異比較中排除以下路徑： `tests/`, `test/`, `spec/`, 
`__tests__/`, `docs/`, `*.lock`, `*-lock.json`, `*.sum`, 產生的檔案 
(具有「不要編輯」標頭註解的檔案) 以及建構產物。

---

## 發布工作流程 9 步驟

請依序執行每個步驟。向使用者展示您即將執行的指令及其輸出。
僅在明確註明的地方才暫停並詢問確認。

---

### 步驟 1 — 確保 main 分支為最新狀態

```bash
git checkout main
git pull origin main
```

暫時留在 `main` 分支。發布分支將在步驟 5 確認版本後建立。

---

### 步驟 2 — 獲取最新的版本標籤 (Tag)

> **為什麼不使用 `gh release list`？** GitHub 發布 (Releases) 是建構在 Git 標籤 
> 之上的選填層。許多存放庫使用 `git tag` 標記發布而從未建立 GitHub 發布， 
> 因此即使版本標籤存在，`gh release list` 也可能傳回空結果。直接從 git 
> 讀取標籤是可靠的事實來源。

```bash
# 從遠端獲取所有標籤，以確保本機檢視是最新的
git fetch --tags

# 尋找最新的版本標籤，依語義排序
# --sort=-version:refname 能正確處理 1.10.0 > 1.9.0 (與按字母排序不同)
PREV_TAG=$(git tag --sort=-version:refname | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+' | head -1)
echo "最新標籤：$PREV_TAG"
```

```PowerShell
# 從遠端獲取所有標籤，以確保本機檢視是最新的
git fetch --tags

# 尋找最新的版本標籤，依語義排序
# --sort=-version:refname 能正確處理 1.10.0 > 1.9.0 (與按字母排序不同)
$prevTag = git tag --sort='-version:refname' | `
  Select-String '^[vV]?\d+\.\d+\.\d+' | `
  Select-Object -First 1 -ExpandProperty Line

if ($prevTag) {
  $prevSha = git rev-list -n 1 $prevTag
} else {
  $prevSha = git rev-list --max-parents=0 HEAD
}

Write-Output "最新標籤：$prevTag"
```

接著驗證該標籤存在於遠端 (而不僅僅是在本機)：

```bash
git ls-remote --tags origin | grep "refs/tags/$PREV_TAG$"
```

如果遠端檢查未傳回任何內容，請警告使用者該標籤似乎僅存在於本機且尚未推播 — 
他們可能希望在繼續之前先將其推播。

- `PREV_TAG` 是找到的確切標籤名稱 (例如 `v1.4.2`)。在進行算術運算時請 
  去除前導的 `v`；在命名事物時請保留它。
- 如果**完全不存在標籤**，請將 `PREV_TAG` 視為 `(無)`，將 `PREV_SHA` 設為 
  第一個提交，並將新版本預設為 `1.0.0` (略過步驟 4 的版本控制邏輯， 
  直接進入步驟 5)。
- 如果標籤未指向真實提交 (孤立標籤)，請退回到 
  `git rev-list --max-parents=0 HEAD` 並警告使用者。

```bash
PREV_SHA=$(git rev-list -n 1 "$PREV_TAG" 2>/dev/null || git rev-list --max-parents=0 HEAD)
```

---

### 步驟 3 — 分析自上次發布以來的變更

此步驟使用**兩個互補的訊號**。程式碼差異 (diff) 是主要的事實來源； 
提交訊息則提供關於意圖的輔助背景資訊。

#### 3a — 程式碼差異 (主要訊號)

```bash
# 對焦於對外公開的原始碼路徑，排除雜訊
git diff "$PREV_SHA"..HEAD -- "$PUBLIC_PATH" \
  ':(exclude)tests/' ':(exclude)test/' ':(exclude)spec/' \
  ':(exclude)__tests__/' ':(exclude)docs/' \
  ':(exclude)*.lock' ':(exclude)*-lock.json' ':(exclude)*.sum'
```

```PowerShell
# 對焦於對外公開的原始碼路徑，排除雜訊
git diff "$($prevSha)..HEAD" -- $publicPath `
  ':(exclude)tests/' ':(exclude)test/' ':(exclude)spec/' `
  ':(exclude)__tests__/' ':(exclude)docs/' `
  ':(exclude)*.lock' ':(exclude)*-lock.json' ':(exclude)*.sum'
```

閱讀完整的差異輸出。針對每個變更的檔案，識別：

1. **移除的符號** — 先前存在但現在已消失的函式、類別、方法、常量、匯出的名稱。 ? MAJOR 的強力訊號。
2. **變更的特徵 (Signature)** — 在兩個版本中皆存在，但參數、傳回類型或拋出的錯誤不同的函式。 ? MAJOR 的強力訊號。
3. **新增的匯出符號** — 先前不存在的公開函式、類別、常量。 ? MINOR 訊號。
4. **僅限內部的變更** — 未接觸任何公開介面的修改 (私有輔助程式、未匯出的函式、演算法內部實作)。 ? PATCH。
5. **臭蟲修復** — 對可證明錯誤的邏輯 (例如：差一錯誤、空值檢查、錯誤條件) 進行修正，且未變更公開 API。 ? PATCH。

如果差異非常龐大 (數千行)，請先執行統計摘要，以排定閱讀完整檔案的優先順序：

```bash
git diff "$PREV_SHA"..HEAD --stat -- "$PUBLIC_PATH"
```

將詳細閱讀重點放在變更最多的檔案，以及檔名暗示定義了公開介面的檔案 
(例如 `index.*`, `api.*`, `exports.*`, `public.*`, `mod.*`, `__init__.*`)。

#### 3b — 提交記錄 (次要訊號)

```bash
git log "$PREV_SHA"..HEAD --oneline --no-merges
```

用於：
- 了解僅憑差異無法自我說明的程式碼變更**意圖** (例如標記為安全修復的一行代碼)。
- 捕捉可能位於 `PUBLIC_PATH` 之外但仍對使用者可見的變更 
  (例如 `cmd/` 目錄中的 CLI 旗標變更)。
- 為變更日誌條目補充程式碼本身無法完整說明的背景資訊。

訊息模式與變更類型的映射請參閱 `references/commit-classification.md`。

#### 3c — 協調兩個訊號

當訊號一致時 ? 帶著信心使用該分類。

當訊號衝突時 ? **優先考慮程式碼差異**。範例：
- 提交訊息顯示 `fix: typo` 但差異顯示移除了一個公開方法 ? 視為 MAJOR。
- 提交訊息顯示 `feat: new API` 但差異僅觸及私有內部實作 ? 視為 PATCH。
- 提交訊息顯示 `chore: refactor` 但差異新增了新的匯出符號 ? 視為 MINOR。

記錄您注意到的任何衝突 — 在步驟 6 的變更日誌檢閱中向使用者標記這些衝突。

---

### 步驟 4 — 確定下一個 SemVer 版本

將以下規則套用於步驟 3 的分析 (完整規則請見 `references/semver-rules.md`)：

| 條件 | 升級 |
|---|---|
| 公開 API 的任何重大變更 (移除、特徵變更、行為變更) | MAJOR |
| 新增匯出的符號或功能，且無重大變更 | MINOR |
| 僅限臭蟲修復、效能改進、安全修復、文件、日常維護 (chore) | PATCH |

當發布中包含多種變更時，**最高優先順序者勝出**：
`MAJOR > MINOR > PATCH`。

計算 `NEXT_VERSION`：
- 將 `PREV_TAG` 分解為 `MAJOR.MINOR.PATCH` 整數。
- 套用適當的升級。
- 格式化為 `vMAJOR.MINOR.PATCH`。

**向使用者展示提議的版本**，並附上引用特定程式碼發現 (而不僅僅是提交訊息) 的簡短理由。範例：

> *「我提議 v2.1.0。差異顯示 `src/client.go` 中有兩個新的匯出函式 (`NewClient` 
> 與 `WithTimeout`)，且沒有現有的公開符號被移除或變更。提交訊息證實了 
> 這些是新增功能。」*

詢問：*「這個版本看起來正確嗎？或者您想要調整它？」*
等待確認後再繼續。

---

### 步驟 5 — 建立發布分支

現在版本已確認，請從一開始就使用正確的名稱建立分支：

```bash
git checkout -b release/vX.Y.Z
git push -u origin release/vX.Y.Z
```

---

### 步驟 6 — 更新 CHANGELOG.md

閱讀現有的 `CHANGELOG.md` (若無則建立)。嚴格遵循 
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 格式。

**插入到頂部的結構** (就在 `# Changelog` 標頭下方)：

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Deprecated
- ...

### Removed
- ...

### Fixed
- ...

### Security
- ...
```

規則：
- 使用今天的日期，格式為 `YYYY-MM-DD`。
- 省略沒有條目的章節 — 不要留下空白標題。
- 以**使用者的視角用平易近人的文字**撰寫條目，主要根據程式碼差異推導， 
  並輔以提交訊息背景。
  佳：*「在 HTTP 用戶端建構函式中新增了 `WithTimeout` 選項。」*
  劣：*「feat: add timeout cfg param」*
- 將發現映射到章節：
  - 新增匯出符號 ? Added
  - 重大移除 ? Removed
  - 對現有 API 的重大變更 ? Changed (將其標記為重大變更)
  - 臭蟲/邏輯修正、效能 ? Fixed
  - 安全修復 ? Security
  - 內部重構、文件、日常維護、測試 ? 除非對使用者可見，否則省略
- 如果提交訊息揭露了僅憑程式碼差異無法傳達的意圖 
  (例如偽裝成一行變更的安全修復)，請在變更日誌條目中包含該背景。
- 同時更新檔案底部的差異比較連結：
  ```markdown
  [X.Y.Z]: https://github.com/OWNER/REPO/compare/vPREV...vNEXT
  ```

**在將提議的變更日誌章節寫入磁碟前，先向使用者展示。**
如果在步驟 3c 中發現任何訊號衝突，請在此處標記以便使用者驗證。
詢問：*「這份變更日誌看起來準確嗎？有任何條目需要新增、移除或修飾嗎？」*
整合回饋，然後寫入磁碟。

---

### 步驟 7 — 提交並推播

```bash
git add CHANGELOG.md
git commit -m "chore: release vX.Y.Z"
git push origin release/vX.Y.Z
```

確認推播成功後再繼續。

---

### 步驟 8 — 開啟提取要求 (Pull Request)

**?? 重要：** 務必使用 `--body-file` 傳遞 PR 描述文字，絕不要使用內嵌文字的 `--body`。
PowerShell 不會將內嵌的逸出序列 (如 `\n`) 解釋為換行符號，而是會作為文字出現在 PR 中。 
使用檔案可確保正確的 Markdown 格式。

```bash
gh pr create \
  --base main \
  --head release/vX.Y.Z \
  --title "Release vX.Y.Z" \
  --body "$(cat <<'EOF'
## Release vX.Y.Z

此 PR 準備了 **vX.Y.Z** 發布。

### 包含內容
<!-- 在此貼上變更日誌章節 -->

### 檢查清單
- [ ] 已檢閱變更日誌
- [ ] 已驗證版本升級
- [ ] CI 已通過

合併後，請在合併提交上建立標籤：
\`\`\`
git tag vX.Y.Z <merge-commit-sha>
git push origin vX.Y.Z
\`\`\`
EOF
)"
```

```PowerShell
# 使用 here-string 建立 PR 描述 (保留實際換行，而非逸出序列)
$prBody = @"
## Release vX.Y.Z

此 PR 準備了 **vX.Y.Z** 發布。

### 包含內容
<在此貼上變更日誌>

### 檢查清單
- [ ] 已檢閱變更日誌
- [ ] 已驗證版本升級
- [ ] CI 已通過

合併後，請在合併提交上建立標籤：
``````
git tag vX.Y.Z <merge-commit-sha>
git push origin vX.Y.Z
``````
"@

# 寫入檔案並使用 --body-file (不要使用帶有逸出序列的內嵌 --body)
$prBody | Out-File -FilePath release_pr_body.md -Encoding utf8 -NoNewline
gh pr create --base main --head release/vX.Y.Z --title "Release vX.Y.Z" --body-file release_pr_body.md
```

將變更日誌章節貼入 PR 描述的「包含內容」區塊 (或保留預留位置以便手動檢閱)。


---

### 步驟 9 — 移交給使用者

告訴使用者：

> **發布 PR 已開啟！ ??**
>
> 新版本：**vX.Y.Z**
>
> 一旦 PR 被檢閱並合併，您需要**自行在合併提交上建立標籤**：
>
> ```bash
> git tag vX.Y.Z <merge-commit-sha>
> git push origin vX.Y.Z
> ```
>
> 接著前往 GitHub Releases 並從該標籤發布。您可以將變更日誌章節直接複製到發布說明中。

---

## 錯誤處理

| 情況 | 該怎麼做 |
|---|---|
| `gh auth status` 失敗 | 停止；告訴使用者執行 `gh auth login` |
| 不在 git 存放庫中 | 停止；告訴使用者 `cd` 進入他們的存放庫 |
| 工作樹不乾淨 | 警告；詢問是否要暫存 (stash) 或中止 |
| 自上次標籤以來無提交 | 告知使用者沒有可發布的內容 |
| 標籤存在但未指向任何提交 | 使用第一個提交作為差異比較基準；警告使用者 |
| 最新標籤僅存在於本機而不在遠端 | 警告使用者；詢問是否要先推播標籤，或無論如何繼續 |
| `PUBLIC_PATH` 無差異但存在提交 | 警告；所有變更可能皆為內部變更；詢問是否仍要繼續 |
| `git push` 失敗 (例如：受保護分支規則) | 逐字報告錯誤；建議他們檢查分支保護設定 |

---

## PowerShell 疑難排解

- 如果在本機運作良好的指令印出了 gh 用法，或者將子指令視為獨立權杖，請確保您呼叫的是 PATH 上的 gh.exe (Get-Command gh)，並避免傳遞未展開的巢狀替換；請使用上方的 PowerShell 模式。
- 建議測試： gh --version; git fetch --tags; 執行 PowerShell 片段來設定 $prevTag，並執行 git diff --name-only $prevSha..HEAD -- src/

---

## 限制

- 需要安裝 `gh` CLI 並已通過身分驗證。
- 需要 git 標籤來確定當前版本。

---

## 參考檔案

- `references/semver-rules.md` — 擴展的 SemVer 決策規則與邊緣案例
- `references/commit-classification.md` — 將提交訊息分類為變更類型的啟發法 (Heuristics)
