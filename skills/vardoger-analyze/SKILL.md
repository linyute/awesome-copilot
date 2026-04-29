---
name: 'vardoger-analyze'
description: '當使用者要求個人化 GitHub Copilot CLI 助手、讓 Copilot 配合其風格、使用 vardoger 或分析其 GitHub Copilot CLI 對話紀錄時使用。讀取位於 `~/.copilot/session-state/` 的本地工作階段目錄，擷取重複出現的偏好和慣例，並將受範圍限制的個人化區塊寫入 `~/.copilot/copilot-instructions.md`。完全透過本地 `vardoger` CLI (`pipx install vardoger`) 在使用者的機器上執行；無網路呼叫且無上傳。觸發條件：''個人化我的 copilot''、''分析我的 copilot 紀錄''、''為我量身打造 copilot''、''執行 vardoger''、''從紀錄更新我的 copilot 指示''、''讓 copilot 學習我的風格''。'
license: 'Apache-2.0'
---

# 分析 Copilot CLI 紀錄並建立個人化指示

驅動本地 `vardoger` CLI 讀取使用者的 GitHub Copilot CLI 對話紀錄，擷取行為模式，並將個人化區塊寫入 `~/.copilot/copilot-instructions.md`。

## 運作方式

`vardoger` 分批準備紀錄。你（助手）總結每批的行為訊號，然後將所有總結綜合成最終的個人化內容。`vardoger` 會寫入結果，並以 `<!-- vardoger:start -->` / `<!-- vardoger:end -->` 標記圍住，以便保留同一檔案中任何手動撰寫的規則。

## 沙盒說明（在執行任何命令前閱讀）

`vardoger` 在目前工作區**之外**讀取和寫入檔案：

- 從 `~/.copilot/session-state/` 讀取 Copilot CLI 紀錄。
- 將檢查點狀態檔案寫入 `~/.vardoger/state.json`（在第一次執行時建立）。
- 將最終的個人化內容寫入 `~/.copilot/copilot-instructions.md`。

當主機要求核准 `vardoger` 命令時，請授予其工作區以外的寫入存取權。否則第一次 `vardoger prepare` 呼叫將失敗並顯示 `PermissionError: ... ~/.vardoger/state.tmp`，因為沙盒禁止在目前工作目錄之外進行寫入。

## 工作流程

1. 驗證是否已安裝 `vardoger` CLI，如果未安裝，請快速失敗並提供安裝指引。
2. 使用 `vardoger status --platform copilot --json` 檢查是否過時，如果個人化內容仍然新鮮，則提早停止。
3. 使用 `vardoger prepare --platform copilot` 獲取分批 Metadata 以了解批次數量。
4. 對於每一批，執行 `vardoger prepare --platform copilot --batch <N>` 並撰寫一份簡潔的行為訊號清單總結。
5. 使用 `vardoger prepare --platform copilot --synthesize` 獲取綜合提示。
6. 按照綜合提示，將所有分批總結綜合成單一的個人化內容。
7. 透過將個人化內容以管道傳送到 `vardoger write --platform copilot --scope global`（或 `--scope project --project <path>`）來寫入結果。
8. 向使用者回報寫入了什麼內容、位置，以及該寫入是冪等的。

## 步驟

### 1. 驗證 vardoger 是否已安裝

```bash
if ! command -v vardoger >/dev/null 2>&1; then
  cat <<'INSTALL_EOF'
vardoger CLI 未安裝。

此技能呼叫 `vardoger` CLI 來讀取你的 Copilot CLI 紀錄並
寫入個人化檔案，因此 CLI 必須在 PATH 中。

安裝選項：

  # 建議：
  pipx install vardoger

  # 或不安裝直接執行：
  uvx vardoger --help

如果你沒有 pipx，請參閱 https://pipx.pypa.io/stable/installation/。

專案頁面：https://github.com/dstrupl/vardoger

安裝後，重新執行個人化請求。
INSTALL_EOF
  exit 1
fi
```

### 2. 檢查是否需要重新整理

```bash
vardoger status --platform copilot --json
```

如果輸出顯示 `"is_stale": false`，請告知使用者其個人化內容已是最新，並詢問是否仍要重新執行。如果過時或從未產生，則繼續分析。

### 3. 獲取分批 Metadata

```bash
vardoger prepare --platform copilot
```

這會列印類似 `{"batches": 3, "total_conversations": 29}` 的 JSON。記下批次數量。告知使用者：「在 M 個批次中找到 N 個對話。正在分析...」

### 4. 總結每一批

對於從 1 到 N 的每個批次編號，執行：

```bash
vardoger prepare --platform copilot --batch 1
```

輸出包含一個總結提示，後跟對話資料。仔細閱讀輸出並針對在該批次中觀察到的行為訊號產生一份簡潔的項目總結。保留你的總結以備後用。

告知使用者你正在處理哪一批次：「正在分析第 1 批，共 N 批...」

對所有批次重複此操作（`--batch 2`、`--batch 3` 等）。

### 5. 獲取綜合提示

```bash
vardoger prepare --platform copilot --synthesize
```

### 6. 綜合個人化內容

按照綜合提示，將你的所有分批總結綜合成單一的個人化內容。輸出應為乾淨的 Markdown，並包含給 AI 助手的可執行指示。

### 7. 寫入結果

將你的個人化內容透過管道傳送到 `vardoger`：

```bash
echo "你的個人化內容寫在這裡" | vardoger write --platform copilot --scope global
```

將 `"你的個人化內容寫在這裡"` 取代為你產生的實際個人化 Markdown。`--scope global` 會寫入到 `~/.copilot/copilot-instructions.md`；使用 `--scope project --project <path>` 則將寫入範圍限制在特定的儲存庫。

### 8. 向使用者回報

告知使用者寫入了什麼內容以及位置。提到他們可以隨時要求你重新執行 vardoger 以更新個人化內容，且寫入是冪等的（受圍欄保護的區塊會被取代；區塊之外的任何內容都會被保留）。

## 何時使用

- 當使用者要求個人化其 Copilot CLI 助手時。
- 當使用者要求分析其 Copilot CLI 對話紀錄時。
- 當使用者提到 "vardoger" 時。
