# 步驟 2a：使用 `wrap` 進行檢測

> 有關完整的 `wrap()` API 參考，請參閱 `wrap-api.md`。

**目標**：在資料邊界處增加 `wrap()` 呼叫，以便評估控具 (Harness) 可以 (1) 注入受控輸入來替代真實的外部相依性，以及 (2) 擷取輸出用於評分。

---

## 資料流分析

從 LLM 呼叫位置開始，向後和向前追蹤程式碼以尋找：

- **相依性輸入**：來自外部系統的資料（資料庫、API、快取、檔案系統、網路獲取）。
- **應用程式輸出**：發送給使用者或外部系統的資料。
- **中間狀態**：與評估相關的內部決策（路由、工具呼叫）。

你**不需要**包裝 LLM 呼叫的參數或回應 — 這些已由 OpenInference 自動檢測擷取。

## 增加 `wrap()` 呼叫

對於找到的每個資料點，在應用程式程式碼中增加一個 `wrap()` 呼叫：

```python
import pixie

# 外部相依性資料 — 函式形式 (防止在評估模式下執行真實呼叫)
profile = pixie.wrap(db.get_profile, purpose="input", name="customer_profile",
    description="從資料庫獲取的客戶設定檔")(user_id)

# 外部相依性資料 — 函式形式 (防止在評估模式下執行真實呼叫)
history = pixie.wrap(redis.get_history, purpose="input", name="conversation_history",
    description="來自 Redis 的對話紀錄")(session_id)

# 應用程式輸出 — 使用者收到的內容
response = pixie.wrap(response_text, purpose="output", name="response",
    description="助手對使用者的回應")

# 中間狀態 — 與評估相關的內部決策
selected_agent = pixie.wrap(selected_agent, purpose="state", name="routing_decision",
    description="選擇處理此請求的代理")
```

### 數值與函式包裝

```python
# 數值形式：包裝資料值 (結果已計算出)
profile = pixie.wrap(db.get_profile(user_id), purpose="input", name="customer_profile")

# 函式形式：包裝可呼叫物件 — 在評估模式下，原始函式
# 「不會」被呼叫；而是直接回傳註冊表中的值。
profile = pixie.wrap(db.get_profile, purpose="input", name="customer_profile")(user_id)
```

**關鍵要求：對於針對外部呼叫（HTTP 請求、資料庫查詢、API 呼叫、檔案讀取、快取查詢）的 `purpose="input"` 包裝，務必使用「函式形式」** — 函式形式可防止在評估模式下執行真實呼叫，因此會直接回傳資料集中的值，而不會發起真實的網路請求或資料庫查詢。數值形式仍會先執行真實呼叫，事後才替換結果 — 這會浪費時間，產生不穩定的測試，並使評估依賴於外部服務的可用性。

唯一接受對 `purpose="input"` 使用數值形式的情況是：該包裝值是本地計算結果（無 I/O，無副作用），且重新計算的成本很低。

### 放置規則

1. **在資料邊界處包裝** — 即資料進入或離開應用程式的地方，而不是在公用程式函式的深處。
2. **名稱必須在整個應用程式中唯一** (用作註冊表鍵值和資料集欄位名稱)。
3. **名稱使用 `lower_snake_case`**。
4. **不要更改函式的介面** — `wrap()` 是純增量式的，會回傳相同的類型。

### 按用途放置

#### `purpose="input"` — 外部資料進入的地方

將 Input Wrap 放在**外部資料進入應用程式的邊界**，而不是中間處理階段。在管線架構 (獲取 → 處理 → 擷取 → 格式化) 中：

- **正確**：在 HTTP 獲取邊界使用**函式形式**：`wrap(fetch_page, purpose="input", name="fetched_page")(url)` — 在評估模式下，獲取過程會被完全跳過並回傳資料集中的值；在追蹤模式下，會執行真實獲取並擷取結果。
- **錯誤**：使用數值形式 `wrap(html_content, purpose="input", name="fetched_page")` — HTTP 獲取在評估模式下仍會執行 (浪費時間並導致測試不穩定)，事後才替換結果。
- **錯誤**：在解析後使用 `wrap(processed_chunks, purpose="input", name="chunks")` — 評估模式會完全繞過解析和分塊過程。

**原則**：`wrap(purpose="input")` 以最小程度替換外部相依性，同時最大程度測試內部邏輯。請盡可能將邊界推向上游。**務必使用函式形式**處理外部呼叫的 Input Wrap — 這樣可以防止在評估模式下執行真實呼叫。

#### `purpose="output"` — 處理後的資料離開的地方

追蹤 LLM 回應的**下游**，尋找資料離開應用程式的位置 — 發送給使用者、寫入儲存空間、渲染到 UI 或傳遞給外部系統。在該出口邊界進行包裝。

- 不要包裝原始的 LLM 回應 — 這些已由 OpenInference 自動檢測作為 `llm_span` 項目擷取。
- 包裝應用程式的**最終處理結果** — 即在應用程式對 LLM 輸出套用任何後處理、格式化或轉換之後。
- 如果應用程式有多個輸出管道（例如：對使用者的回應「以及」寫入資料庫的副作用），請分別包裝。

```python
# 應用程式格式化管線後的最終回應
response = pixie.wrap(formatted_response, purpose="output", name="response",
    description="發送給使用者的最終回應")

# 副作用輸出 — 寫入外部儲存空間的資料
pixie.wrap(saved_record, purpose="output", name="saved_summary",
    description="儲存到資料庫的摘要記錄")
```

**原則**：Output Wrap 僅供觀察 — 它們擷取應用程式產生的內容，以便評估器進行評分。在評估執行期間絕不會被模擬或注入。

#### `purpose="state"` — 與評估相關的內部決策

某些評估標準需要判斷應用程式的內部推理 — 不僅僅是輸入或輸出什麼，還包括應用程式「如何」做出決定。當評估標準需要且該資料在輸入或輸出中不可見時，請包裝內部狀態。

常見範例：

- **代理路由**：選擇了哪個子代理或工具來處理請求。
- **計畫/步驟決策**：代理選擇執行哪些步驟。
- **記憶體更新**：代理在其工作記憶體中增加或移除了什麼。
- **檢索結果**：在餵給 LLM 之前檢索到了哪些文件/分塊。

```python
# 代理路由決策
selected_agent = pixie.wrap(selected_agent, purpose="state", name="routing_decision",
    description="選擇處理此請求的代理")

# 餵給 LLM 的檢索背景
pixie.wrap(retrieved_chunks, purpose="state", name="retrieved_context",
    description="RAG 在 LLM 呼叫前檢索到的文件分塊")
```

**原則**：僅包裝評估標準實際需要的狀態。不要包裝每個變數 — State Wrap 適用於評估器必須看到但不會出現在應用程式輸入或輸出中的內部資料。

### 覆蓋率檢查

在增加所有 `wrap()` 呼叫後，逐一檢查 `pixie_qa/02-eval-criteria.md` 中的評估標準並驗證：

1. 每個判斷「輸入什麼」的標準都有對應的 `input` 或 `entry` Wrap。
2. 每個判斷「輸出什麼」的標準都有對應的 `output` Wrap。
3. 每個判斷「應用程式如何決定」的標準都有對應的 `state` Wrap。

如果某個標準所需的資料未被擷取，請現在增加 Wrap — 不要延後處理。

---

## 輸出

修改後的應用程式原始碼檔案，在資料邊界處包含 `wrap()` 呼叫。
