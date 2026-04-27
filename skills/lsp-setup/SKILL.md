---
name: lsp-setup
description: '透過為 Copilot CLI 安裝並設定 LSP 伺服器，為任何程式語言啟用程式碼智慧功能（前往定義、尋找參考、懸停提示、型別資訊）。可偵測作業系統、安裝正確的伺服器並產生 JSON 設定（使用者層級或儲存庫層級）。當您需要更深入的程式碼理解但未設定 LSP 伺服器時，或當使用者要求設定、安裝或配置 LSP 伺服器時使用。'
---

# 為 GitHub Copilot CLI 設定 LSP

**工具類技能** — 為 Copilot CLI 安裝並設定語言伺服器協定 (Language Server Protocol, LSP) 伺服器。
適用於：「設定 LSP」、「安裝語言伺服器」、「為 Java 設定 LSP」、「加入 TypeScript LSP」、「啟用程式碼智慧功能」、「我需要前往定義功能」、「尋找參考功能失效」、「需要更深入的程式碼理解」。
請勿用於：一般的編碼任務、IDE/編輯器的 LSP 設定、非 Copilot CLI 的設定。

## 工作流程

1. **詢問語言** — 使用 `ask_user` 詢問使用者想要為哪些程式語言提供 LSP 支援。
2. **偵測作業系統** — 執行 `uname -s`（或檢查 Windows 的 `$env:OS` / `%OS%`）以判斷是 macOS、Linux 還是 Windows。
3. **查詢 LSP 伺服器** — 閱讀 `references/lsp-servers.md` 以獲取已知的伺服器、安裝指令和設定片段。
4. **詢問範圍** — 使用 `ask_user` 詢問設定應該是使用者層級 (`~/.copilot/lsp-config.json`) 還是儲存庫層級（位於儲存庫根目錄的 `lsp.json` 或 `.github/lsp.json`）。
5. **安裝伺服器** — 針對偵測到的作業系統執行適當的安裝指令。
6. **寫入設定** — 將新的伺服器項目合併到所選的設定檔中（使用者層級為 `~/.copilot/lsp-config.json`；儲存庫層級為 `lsp.json` 或 `.github/lsp.json`）。如果儲存庫層級的設定已存在，請繼續使用該位置；否則詢問使用者偏好哪種儲存庫層級的位置。若檔案缺失請建立之，並保留既有項目。
7. **驗證** — 確認 LSP 執行檔已加入 `$PATH` 且設定檔為有效的 JSON。

## 設定格式

Copilot CLI 會從使用者層級或儲存庫層級的位置讀取 LSP 設定，且儲存庫層級的設定優先權高於使用者層級：

- **使用者層級**：`~/.copilot/lsp-config.json`
- **儲存庫層級**：`lsp.json`（儲存庫根目錄）或 `.github/lsp.json`

JSON 結構如下：

```json
{
  "lspServers": {
    "<server-key>": {
      "command": "<binary>",
      "args": ["--stdio"],
      "fileExtensions": {
        ".<ext>": "<languageId>",
        ".<ext2>": "<languageId>"
      }
    }
  }
}
```

### 關鍵規則

- `command` 是執行檔名稱（必須位於 `$PATH` 中）或絕對路徑。
- `args` 幾乎總是包含 `"--stdio"` 以使用標準 I/O 傳輸。
- `fileExtensions` 將每個副檔名（帶有前導點）映射到一個 [語言 ID (Language ID)](https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers)。
- `lspServers` 中可以同時存在多個伺服器。
- 合併至現有檔案時，**絕不要覆寫**其他伺服器項目 — 僅加入或更新目標語言鍵 (key)。

## 行為

- 詢問使用者選擇語言或範圍時，務必使用帶有 `choices` 的 `ask_user`。
- 如果語言未列在 `references/lsp-servers.md` 中，請在網路上搜尋「<language> LSP server」並引導使用者進行手動設定。
- 如果套件管理員不可用（例如 macOS 上沒有 Homebrew），請從參考文件中建議替代的安裝方法。
- 安裝後，執行 `which <binary>`（或 Windows 上的 `where.exe`）以確認執行檔可存取。
- 在寫入設定 JSON 之前，先向使用者展示最終結果。
- 如果設定檔已存在，請先讀取並合併 — 不要直接覆蓋。

## 驗證

設定完成後，告知使用者：

1. 輸入 `/exit` 退出 Copilot CLI — 這是**必須的**，以便在下次啟動時載入新的 LSP 設定。
2. 在包含已設定語言檔案的專案中重新啟動 `copilot`。
3. 執行 `/lsp` 檢查伺服器狀態。
4. 嘗試使用程式碼智慧功能，例如「前往定義」或懸停提示。
