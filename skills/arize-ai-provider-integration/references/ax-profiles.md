# ax 設定檔 (Profile) 設置

當身分驗證失敗 (401、缺少設定檔、缺少 API 金鑰) 時，請參閱此文件。請勿主動執行這些檢查。

當沒有設定檔，或設定檔設定錯誤 (API 金鑰錯誤、區域錯誤等) 時，請使用此文件。

## 1. 檢查目前狀態

```bash
ax profiles show
```

查看輸出以瞭解已設定的內容：
- `API Key: (not set)` 或缺失 → 需要建立/更新金鑰
- 無設定檔輸出或「No profiles found」→ 尚未存在任何設定檔
- 已連線但收到 `401 Unauthorized` → 金鑰錯誤或已過期
- 已連線但端點/區域錯誤 → 需要更新區域

## 2. 修復設定錯誤的設定檔

若設定檔存在但有一個或多個設定錯誤，請僅修補錯誤的部分。

**絕不可將原始 API 金鑰值作為旗標 (Flag) 傳遞。** 請務必透過 `ARIZE_API_KEY` 環境變數來引用它。若 Shell 中尚未設定該變數，請引導使用者先設定變數，然後再執行指令：

```bash
# 若 ARIZE_API_KEY 已在 Shell 中匯出：
ax profiles update --api-key $ARIZE_API_KEY

# 修復區域 (不涉及機密 — 可直接安全執行)
ax profiles update --region us-east-1b

# 同時修復兩者
ax profiles update --api-key $ARIZE_API_KEY --region us-east-1b
```

`update` 僅會變更您指定的欄位 — 所有其他設定都將保留。若未指定設定檔名稱，則會更新目前使用中的設定檔。

## 3. 建立新的設定檔

若設定檔不存在，或現有設定檔需要指向完全不同的設置 (不同的組織、不同的區域)：

**請務必透過 `$ARIZE_API_KEY` 引用金鑰，絕不可內嵌原始值。**

```bash
# 需要先在 Shell 中匯出 ARIZE_API_KEY
ax profiles create --api-key $ARIZE_API_KEY

# 建立並指定區域
ax profiles create --api-key $ARIZE_API_KEY --region us-east-1b

# 建立具名設定檔
ax profiles create work --api-key $ARIZE_API_KEY --region us-east-1b
```

若要在任何 `ax` 指令中使用具名設定檔，請加入 `-p 名稱`：
```bash
ax spans export PROJECT_ID -p work
```

## 4. 獲取 API 金鑰

**絕不可要求使用者將其 API 金鑰貼入對話中。絕不可記錄、回應 (Echo) 或顯示 API 金鑰值。**

若尚未設定 `ARIZE_API_KEY`，請引導使用者在其 Shell 中匯出該變數：

```bash
export ARIZE_API_KEY="..."   # 使用者在自己的終端機中貼入金鑰
```

使用者可以在 https://app.arize.com/admin > API Keys 找到金鑰。建議他們建立**具範圍限制的服務金鑰 (Scoped service key)** (而非個人使用者金鑰) — 服務金鑰不與個人帳號繫結，對於程式化用途而言更為安全。金鑰具有空間範圍限制 — 請確保他們複製的是正確空間的金鑰。

一旦使用者確認變數已設定，請按照上述說明繼續執行 `ax profiles create --api-key $ARIZE_API_KEY` 或 `ax profiles update --api-key $ARIZE_API_KEY`。

## 5. 核實

在任何建立或更新操作之後：

```bash
ax profiles show
```

確認 API 金鑰與區域皆正確，然後重試原始指令。

## 空間 ID (Space ID)

設定檔旗標中沒有空間 ID。請將其儲存為環境變數：

**macOS/Linux** — 新增至 `~/.zshrc` 或 `~/.bashrc`：
```bash
export ARIZE_SPACE_ID="U3BhY2U6..."
```
然後執行 `source ~/.zshrc` (或重啟終端機)。

**Windows (PowerShell)：**
```powershell
[System.Environment]::SetEnvironmentVariable('ARIZE_SPACE_ID', 'U3BhY2U6...', 'User')
```
重啟終端機後即可生效。

## 儲存認證資訊供未來使用

在對話**結束時**，若使用者在此次對話中手動提供了任何認證資訊，**且**這些數值尚未從儲存的設定檔或環境變數中載入，請詢問是否要儲存它們。

**若符合以下情況，請完全跳過此步驟：**
- API 金鑰已從現有設定檔或 `ARIZE_API_KEY` 環境變數載入
- 空間 ID 已透過 `ARIZE_SPACE_ID` 環境變數設定
- 使用者僅使用了 Base64 專案 ID (不需要空間 ID)

**如何詢問：** 使用 **詢問問題 (AskQuestion)**：*「您是否想要儲存您的 Arize 認證資訊，以便下次無需再次輸入？」*，並提供選項 `「是，請儲存」` / `「不用了，謝謝」`。

**若使用者選擇是：**

1. **API 金鑰** — 執行 `ax profiles show` 檢查目前狀態。接著執行 `ax profiles create --api-key $ARIZE_API_KEY` 或 `ax profiles update --api-key $ARIZE_API_KEY` (金鑰必須已匯出為環境變數 — 絕不可傳遞原始金鑰值)。

2. **空間 ID** — 參閱上述「空間 ID」章節，將其持久化為環境變數。
