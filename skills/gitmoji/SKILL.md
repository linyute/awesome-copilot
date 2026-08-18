---
name: 'gitmoji'
description: '遵循 gitmoji 慣例 (https://gitmoji.dev) 產生認可訊息 — 針對變更的意圖選取正確的表情符號，並撰寫格式良好的訊息。適用於「撰寫 gitmoji 認可」、「在我的認可訊息中新增表情符號」、「我應該使用哪個 gitmoji」、「為此變更添加 gitmoji」，或專案使用 gitmoji 風格的認可訊息時。可根據 git diff、暫存的變更或對變更的純文字描述運作。僅產生訊息 — 不執行 git 指令。'
license: 'MIT'
---

# Gitmoji

遵循 [gitmoji](https://gitmoji.dev/) 慣例產生認可 (commit) 訊息：每個認可都以表情符號開頭，讓人一眼就能識別變更的意圖。給定一個 diff、已暫存檔案的清單或變更的純文字描述，此技能會挑選最合適的單一 gitmoji，並圍繞它撰寫簡潔、格式良好的認可訊息。

此技能**僅產生訊息** — 它絕不執行 `git commit` 或任何其他 git 指令。輸出是供使用者使用的可複製訊息。

## 何時使用此技能

- 使用者說「撰寫 gitmoji 認可」、「為此變更添加 gitmoji」或「在我的認可訊息中新增表情符號」
- 使用者詢問「我應該為此使用哪個 gitmoji？」
- 使用者在採用 gitmoji 風格認可記錄的專案中貼上 git diff 或描述變更
- 使用者希望使用表情符號建立富有表現力且易於掃視的認可歷史

**何時不使用：** 如果專案遵循沒有表情符號的純 [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, ...)，請改用 `conventional-commit` 或 `commit-message-storyteller` 技能。如果不確定專案使用哪種慣例，請讓使用者提供最近的認可歷史（例如 `git log --oneline -10` 的輸出）。

## 訊息格式

gitmoji 規範：

```
<intention> [scope?][:?] <message>
```

- **intention** — 恰好一個表達認可目標的 gitmoji
- **scope** *(可選)* — 受影響的程式碼庫區段，放在括號內
- **message** — 對變更的簡短祈使句說明

範例：

```
✨ add multi-tenant support to the billing service
🐛 (auth) prevent token refresh loop on expired sessions
♻️ (api): extract pagination logic into shared helper
```

### 表情符號風格：Unicode vs Shortcode

Gitmoji 支援兩種等效的標記法：

| 風格 | 範例 | 何時優先採用 |
|-------|---------|----------------|
| Unicode | `✨ add dark mode` | 預設 — 在任何地方呈現，主旨行更短 |
| Shortcode | `:sparkles: add dark mode` | 呈現短代碼的平台（GitHub、GitLab）或透過代碼 grep 認可日誌的團隊 |

**匹配存放庫的現有歷史記錄。** 如果最近的認可使用 `:sparkles:` 風格的短代碼，請產生短代碼；否則預設為 Unicode 表情符號。

## 運作方式

### 步驟 1：理解變更

從使用者提供的任何內容開始工作：

1. **git diff** — 閱讀並識別變更了什麼以及原因
2. **已暫存/已修改檔案的清單** — 從檔案名稱和路徑推斷意圖
3. **純文字描述** — 直接使用它

如果意圖確實不明確（例如「更新了 auth.js」可能是修復、功能或重構），請提出一個簡短的澄清問題，而不是猜測。

### 步驟 2：識別主要意圖

確定變更的主要目的。常見的意圖及其 gitmojis：

| 表情符號 | 短代碼 | 意圖 |
|-------|-----------|--------|
| ✨ | `:sparkles:` | 引入新功能 |
| 🐛 | `:bug:` | 修復錯誤 (Bug) |
| 🚑️ | `:ambulance:` | 緊急修復 (Critical hotfix) |
| 📝 | `:memo:` | 新增或更新文件 |
| ♻️ | `:recycle:` | 重構程式碼（無行為變更） |
| ✅ | `:white_check_mark:` | 新增、更新或通過測試 |
| ⚡️ | `:zap:` | 提升效能 |
| 🎨 | `:art:` | 改進程式碼結構 / 格式 |
| 🔥 | `:fire:` | 移除程式碼或檔案 |
| 🔒️ | `:lock:` | 修復安全性或隱私問題 |
| ⬆️ | `:arrow_up:` | 升級相依性 |
| 🔧 | `:wrench:` | 新增或更新設定檔 |
| 💄 | `:lipstick:` | 新增或更新 UI 與樣式檔案 |
| 💥 | `:boom:` | 引入重大變更 (Breaking changes) |
| 🚨 | `:rotating_light:` | 修復編譯器 / Linter 警告 |
| 🌐 | `:globe_with_meridians:` | 國際化與在地化 |

這只是最常見的子集 — 在確定使用前，**請務必查閱 [`references/gitmoji-reference.md`](references/gitmoji-reference.md) 以取得 75 個 gitmoji 的完整官方清單**；通常存在更具體的表情符號（例如 🩹 用於微不足道的修復，✏️ 用於錯字，🚚 用於檔案移動）。

### 步驟 3：恰好挑選一個表情符號

針對模稜兩可情況的規則：

- **具體勝於通用** — 錯字修復是 ✏️，而不是 🐛；移動檔案是 🚚，而不是 ♻️；瑣碎的非關鍵修復是 🩹，而不是 🐛
- **測試：** ✅ 用於新增/更新通過的測試；🧪 僅用於刻意失敗的測試（例如 TDD 紅燈步驟）
- **修復 vs 緊急修復：** 🚑️ 僅用於緊急的生產修復；日常錯誤修復為 🐛
- **安全性修復：** 當錯誤為安全性問題時，🔒️ 優先於 🐛
- **僅格式變更：** 🎨 用於程式碼結構/格式；💄 僅用於 UI/樣式檔案（CSS、主題）
- **每次認可一個表情符號** — 切勿堆疊表情符號；如果兩種意圖同等主導，請參閱下方的混合變更

### 步驟 4：撰寫訊息

- 祈使句態："add", "fix", "remove" — 不是 "added" 或 "fixes"
- 保持主旨行在 72 個字元以內（包含表情符號）
- 開頭小寫，無結尾句點
- 當專案歷史記錄使用範圍時，在括號內新增範圍
- 僅在從主旨中無法明顯看出*原因*時，才新增內文（以空白行分隔）

### 步驟 5：輸出

在可複製的程式碼區塊中產出認可訊息，後接一行說明選擇該 gitmoji 的原因。**請勿**執行 `git commit`。

**輸出範例：**

```
🐛 (auth) prevent token refresh loop on expired sessions

Expired sessions triggered a refresh that failed validation and
re-triggered itself, crashing the app. A recursion guard now aborts
the cycle and returns a clean 401.
```

> **為何選擇 🐛：** 該變更更正了不正確的執行階段行為 — 屬於錯誤修復，但尚未緊急到需要 🚑️。

## 特殊邊界情況

| 情況 | 如何處理 |
|-----------|---------------|
| 混合變更（例如一個 diff 中同時包含功能與重構） | 為*主要*意圖選取表情符號，且如果關注點不相關，建議拆分為單獨的認可 |
| 重大變更 (Breaking change) | 使用 💥 作為意圖，並在內文中描述中斷處 |
| 還原 (Revert) | ⏪️ 且主旨參照被還原的認可 |
| 合併認可 | 🔀 `merge branch '<name>' into <target>` |
| 初始認可 | 🎉 `begin project` |
| 進行中工作 | 🚧 且清楚註明剩餘內容 |
| 沒有合適的表情符號 | 重新瀏覽[完整參考資料](references/gitmoji-reference.md)；如果仍然沒有適合的，退回到最接近的通用意圖（✨、🐛 或 ♻️） |

## 快速參考

```bash
# 取得已暫存的 diff 以貼入 Copilot
git diff --staged

# 檢查存放庫已經使用的表情符號風格
git log --oneline -10
```

有關完整的官方 gitmoji 清單，請參閱 [`references/gitmoji-reference.md`](references/gitmoji-reference.md)。
