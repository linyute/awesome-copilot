# ax 設定檔設置 (ax Profile Setup)

當驗證失敗（401、缺少設定檔、缺少 API 金鑰）時參考此文件。請勿主動執行這些檢查。

當沒有設定檔，或設定檔設置不正確（API 金鑰錯誤、區域錯誤等）時使用。

## 1. 檢查目前狀態 (Inspect the current state)

```bash
ax profiles show
```

查看輸出以瞭解已配置的內容：
- `API Key: (not set)` 或缺失 → 需要建立/更新金鑰
- 無設定檔輸出或「No profiles found」 → 尚不存在任何設定檔
- 已連線但收到 `401 Unauthorized` → 金鑰錯誤或已過期
- 已連線但端點/區域錯誤 → 需要更新區域

## 2. 修復配置錯誤的設定檔 (Fix a misconfigured profile)

如果設定檔已存在但一個或多個設置不正確，請僅修補損壞的部分。

**絕不要將原始 API 金鑰值作為旗標傳遞。** 請務必透過 `ARIZE_API_KEY` 環境變數引用它。如果 Shell 中尚未設定該變數，請指示使用者先設定它，然後執行指令：

```bash
# 如果 ARIZE_API_KEY 已在 Shell 中匯出：
ax profiles update --api-key $ARIZE_API_KEY

# 修復區域（不涉及秘密資訊 — 可直接執行）
ax profiles update --region us-east-1b

# 同時修復兩者
ax profiles update --api-key $ARIZE_API_KEY --region us-east-1b
```

`update` 僅變更您指定的欄位 — 所有其他設置都將保留。如果未指定設定檔名稱，則更新作用中的設定檔。

## 3. 建立新設定檔 (Create a new profile)

如果尚不存在任何設定檔，或者現有設定檔需要指向完全不同的設置（不同的組織、不同的區域）：

**請務必透過 `$ARIZE_API_KEY` 引用金鑰，絕不內嵌原始值。**

```bash
# 需要先在 Shell 中匯出 ARIZE_API_KEY
ax profiles create --api-key $ARIZE_API_KEY

# 建立並指定區域
ax profiles create --api-key $ARIZE_API_KEY --region us-east-1b

# 建立具名設定檔
ax profiles create work --api-key $ARIZE_API_KEY --region us-east-1b
```

若要在任何 `ax` 指令中使用具名設定檔，請加入 `-p NAME`：
```bash
ax spans export PROJECT -p work
```

## 4. 取得 API 金鑰 (Getting the API key)

**絕不要求使用者將其 API 金鑰貼到聊天室中。絕不記錄、回應 (echo) 或顯示 API 金鑰值。**

如果尚未設定 `ARIZE_API_KEY`，請指示使用者在他們的 Shell 中匯出它：

```bash
export ARIZE_API_KEY="..."   # 使用者在自己的終端機中貼上其金鑰
```

他們可以在 https://app.arize.com/admin > API Keys 找到其金鑰。建議他們建立一個 **限定範圍的服務金鑰 (scoped service key)**（而非個人使用者金鑰）— 服務金鑰不與個人帳戶綁定，對於程式化使用更為安全。金鑰限定於空間範圍 — 請確保他們複製了正確空間的金鑰。

一旦使用者確認已設定該變數，請按照上述說明繼續執行 `ax profiles create --api-key $ARIZE_API_KEY` 或 `ax profiles update --api-key $ARIZE_API_KEY`。

## 5. 驗證 (Verify)

在任何建立或更新之後：

```bash
ax profiles show
```

確認 API 金鑰和區域正確無誤，然後重試原始指令。

## 空間 (Space)

空間沒有設定檔旗標。請將其儲存為環境變數 — 接受空間 **名稱**（例如 `my-workspace`）或 base64 空間 **ID**（例如 `U3BhY2U6...`）。請使用 `ax spaces list -o json` 查找您的資訊。

**macOS/Linux** — 加入至 `~/.zshrc` 或 `~/.bashrc`：
```bash
export ARIZE_SPACE="my-workspace"    # 名稱或 base64 ID
```
然後執行 `source ~/.zshrc`（或重啟終端機）。

**Windows (PowerShell)：**
```powershell
[System.Environment]::SetEnvironmentVariable('ARIZE_SPACE', 'my-workspace', 'User')
```
重啟終端機以使其生效。

## 儲存認證供日後使用 (Save Credentials for Future Use)

在 **工作階段結束** 時，如果使用者在此對話期間手動提供了任何認證，**且** 這些值尚未從儲存的設定檔或環境變數中載入，請主動提供儲存選項。

**如果出現以下情況，請完全跳過此步驟：**
- API 金鑰已從現有設定檔或 `ARIZE_API_KEY` 環境變數中載入
- 空間已透過 `ARIZE_SPACE` 環境變數設定
- 使用者僅使用 base64 專案 ID（不需要空間）

**如何提供：** 使用 **AskQuestion**：「*您是否想要儲存您的 Arize 認證，以便下次無需再次輸入？*」，選項為「`是，請儲存`」/「`不用了，謝謝`」。

**如果使用者說「是」：**

1. **API 金鑰** — 執行 `ax profiles show` 檢查目前狀態。然後執行 `ax profiles create --api-key $ARIZE_API_KEY` 或 `ax profiles update --api-key $ARIZE_API_KEY`（金鑰必須已匯出為環境變數 — 絕不傳遞原始金鑰值）。

2. **空間** — 參見上方的空間章節以將其持久化為環境變數。
