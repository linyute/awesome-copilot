---
name: lsp-setup
description: '透過為 Copilot CLI 安裝並設定 LSP 伺服器，為任何程式語言啟用程式碼智慧功能（移至定義、尋找參考、暫留提示、型別資訊）。偵測作業系統、安裝正確的伺服器，並產生 JSON 設定檔（使用者層級或存放庫層級）。當您需要更深入的程式碼理解且尚未設定 LSP 伺服器時，或當使用者要求設定、安裝或配置 LSP 伺服器時使用。'
---

# GitHub Copilot CLI 的 LSP 設定

**公用程式技能** — 為 Copilot CLI 安裝與設定語言伺服器協定（Language Server Protocol, LSP）伺服器。
適用於：「設定 LSP」、「安裝語言伺服器」、「為 Java 設定 LSP」、「新增 TypeScript LSP」、「啟用程式碼智慧功能」、「我需要移至定義」、「尋找參考無法運作」、「需要更深入理解程式碼」
請勿用於：一般編碼任務、IDE/編輯器的 LSP 設定、非 Copilot CLI 的設定

## 工作流程

1. **詢問語言** — 使用 `ask_user` 詢問使用者需要哪種程式語言的 LSP 支援
2. **偵測作業系統** — 執行 `uname -s`（或在 Windows 上透過 `$env:OS` / `%OS%` 檢查）以判定 macOS、Linux 或 Windows
3. **查閱 LSP 伺服器** — 閱讀 `references/lsp-servers.md` 以取得已知伺服器、安裝指令與設定程式碼片段（針對 Java，另請閱讀 `references/java-jdtls.md`）
4. **詢問範圍** — 使用 `ask_user` 詢問設定檔應為使用者層級（`~/.copilot/lsp-config.json`）還是存放庫層級（`.github/lsp.json`）
5. **安裝伺服器** — 針對偵測到的作業系統執行適當的安裝指令
6. **寫入設定** — 將新伺服器項目合併至所選的設定檔（使用者層級為 `~/.copilot/lsp-config.json`；存放庫層級為 `.github/lsp.json`）。若檔案不存在則建立，並保留現有項目。
7. **驗證** — 確認 LSP 二進位檔位於 `$PATH` 中，且設定檔為合法的 JSON

## 設定格式

Copilot CLI 會從使用者層級或存放庫層級位置讀取 LSP 設定，且存放庫層級設定優先於使用者層級設定：

- **使用者層級**：`~/.copilot/lsp-config.json`
- **存放庫層級**：`.github/lsp.json`（存放庫根目錄下的單純 `lsp.json` 不會被讀取：在 Copilot CLI 1.0.95 中，`copilot lsp list` 會列出 `.github/lsp.json` 中的伺服器，但不會列出根目錄 `lsp.json` 中的伺服器）

JSON 結構：

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

- `command` 為二進位檔名稱（必須位於 `$PATH` 中）或絕對路徑。
- `args` 幾乎總是包含 `"--stdio"` 以使用標準 I/O 傳輸。
- `fileExtensions` 將每個副檔名（帶前導點）映射至 [Language ID](https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers)。
- 多個伺服器可共存於 `lspServers` 中。
- 合併至現有檔案時，**切勿覆蓋**其他伺服器項目 — 僅新增或更新目標語言索引鍵。

## 行為指引

- 當要求使用者選擇語言或範圍時，一律使用帶有 `choices` 的 `ask_user`。
- 若語言未列在 `references/lsp-servers.md` 中，請在網路上搜尋「<language> LSP server」並引導使用者完成手動設定。
- 若套件管理器無法使用（例如 macOS 上沒有 Homebrew），請從參考檔案中建議其他安裝方式。
- 安裝後，執行 `which <binary>`（或 Windows 上的 `where.exe`）確認可存取該二進位檔。
- 在寫入前向使用者顯示最終的設定 JSON。
- 若設定檔已存在，請先讀取它並進行合併 — 切勿直接覆蓋。

## 驗證

設定完成後，告知使用者：

1. 輸入 `/exit` 退出 Copilot CLI — 這是**必需**步驟，以便在下次啟動時載入新的 LSP 設定
2. 在包含已設定語言檔案的專案中重新啟動 `copilot`
3. 執行 `/lsp` 檢查伺服器狀態
4. 嘗試程式碼智慧功能，例如移至定義或暫留提示

## Java

針對 Java 語意導覽，一旦設定好伺服器，優先使用 `lsp` 工具（`goToDefinition`、`findReferences`、`hover`、`incomingCalls`）而非 grep/檢視。LSP 對於 Java 是選用的，並非建構或執行時期診斷的必要條件。有關設定詳細資訊與疑難排解，請參閱 `references/java-jdtls.md`。
