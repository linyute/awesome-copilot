---
description: "僅將產出的內容寫入檔案。絕對不要將提示指令、理由或元評論（meta-commentary）寫入由提示詞產生的文件、註解或程式碼中。"
applyTo: '**'
---

# 排除提示詞資料 (Exclude Prompt Data)

當提示詞包含用於引導變更的指令或上下文資料時，該資料絕不應出現在正在更新的檔案中。輸出必須僅反映指令的 *結果* — 而不是指令本身、背後的推理，或任何關於它已被應用的確認。

## 核心規則

> **絕不要將提示詞內容寫入正在變更的檔案中。**
>
> 僅寫入結果。去除任何源自提示詞的元評論、理由或框架。

## 什麼算作提示詞資料

提示詞資料是使用者作為指令或上下文提供的任何內容，而非作為預期的檔案內容：

- 關於要新增或變更內容的描述 (`"add a --verbose flag that..."`)
- 內聯理由或動機 (`"because the old behavior caused..."`)
- 對提示詞本身的參照 (`"as requested"`, `"per the prompt"`, `"the new feature has been added as"`)
- 關於更新的元評論 (`"This section has been updated to reflect..."`)
- 敘述變更而非描述程式碼的程式碼註解 (`"// Added email validation as requested"`, `"// Now validates the input per the new requirement"`)
- 用作區段標記或模板插槽的結構化鷹架標籤 (在 `## this Title` 中的 `this` 一詞是鷹架，而非標題文字)

## 什麼應該出現在輸出中

輸出檔案應僅包含：

- 提示詞請求的功能、修復或內容 — 書寫方式應如同它原本就屬於那裡
- 閱讀者會覺得有用且與請求變更方式無關的文件或程式碼
- 範例中通用的、陳腔濫調的預留資料 (例如：`Jane Doe`, `jane.doe@example.com`, `Acme Corp`, `example.com`) — 絕不使用從提示詞或本地配置中拉出的真實姓名、電子郵件、網域或組織識別碼
- 提示詞中術語應用的語言格式會延續到輸出中 — 如果提示詞將術語用反引號包裹或使用特定的語法慣例，在輸出中請遵循相同的慣例

## 輸出品質

提示詞的寫作品質並不決定輸出的標準。無論提示詞如何表述，結果都必須經過潤飾並準備好進行生產使用：

- 整個過程中的正確語法、大寫和標點符號
- 沒有草稿品質的散文或隨意書寫的章節
- 提示詞中非正式或粗糙的措辭絕不能延續到輸出中

## 使用案例

### 在文件中新增功能旗標 (Feature Flag)

**提示詞**

```text
Update file.ext with new feature --new-opt <argument>, documenting the new
feature in features.md
```

**可接受的結果 — `features.md`**

```text
### --new-opt

Enables extended output. Requires a value argument. Example:

    ```bash
    file --new-opt foo
    ```
```

**不可接受的結果 — `features.md`**

```text
### --new-opt

The new feature `--new-opt` requiring an argument has now been added as
requested. The feature is documented as such.

Enables extended output. Requires a value argument. Example:

    ```bash
    file --new-opt foo
    ```
```

不可接受的版本回應了提示詞的框架 (`"has now been added as requested"`, `"The feature is documented as such"`)。該語言屬於提示詞，而不是檔案。

---

### 更新程式碼檔案

**提示詞**

```text
Add input validation to the createUser function — email must be a valid format.
```

**可接受的結果**

```js
function createUser(name, email) {
  // Rejects addresses missing a local part, @ sign, or domain
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email address.');
  }
  // ...
}
```

**不可接受的結果**

```js
// Added email validation as requested in the prompt
function createUser(name, email) {
  // Per the instruction, we now validate that email must be a valid format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email address.');
  }
  // ...
}
```

不可接受的版本將提示詞措辭洩漏到程式碼註解中。程式碼註解和文件更新是適當且受鼓勵的 — 它們應該描述程式碼做什麼、其限制或其意圖。它們絕對不能做的是敘述變更、參照提示詞，或像向請求變更的使用者回報那樣報告。

## 例外

少數情況下確實需要提示詞內容出現在檔案中。將這些視為例外，而非漏洞：

- **請求逐字轉錄。** 使用者明確要求將提示詞文字按原樣插入 (例如：`"paste this block into the README under ## Notice"` )。僅插入所請求的內容，不多不少。
- **檔案本身就是提示詞或指令工件。** 編輯提示詞檔案、技能定義或指令檔案時，指令內容是預期的承載體。該規則仍適用於上一層：不要將關於 *此* 次編輯的元評論新增到這些檔案中。
- **變更日誌或發行說明條目。** 簡短、事實性的描述變更的行是適當的。保持關於變更本身，而不是關於請求 (`Added --verbose flag` ✓ / `Added --verbose flag as requested by user` ✗)。

## 儲存前的自我檢查

在提交由提示詞產生的編輯之前，掃描差異檔以查找以下任何內容並刪除您找到的內容：

- [ ] 諸如 "as requested", "per the prompt", "per your instruction", "as you asked" 之類的短語
- [ ] 宣佈變更而非描述主題的句子 ("This section now covers...", "Updated to include...")
- [ ] 解釋為什麼寫程式碼而不是它做什麼的註解
- [ ] 在檔案內逐字重述使用者的請求
- [ ] 對提示詞存在性的任何確認

如果出現任何這些情況，請重寫受影響的區段，以便一個對提示詞一無所知的新閱讀者 — 會發現內容自然且自成一體。

## 疑難排解

| 症狀 | 修復 |
|---|---|
| 輸出包含 "as requested" 或 "per the prompt" | 移除它 |
| 文件宣佈變更而不是紀錄變更 | 直接重寫 |
| 程式碼註解敘述變更 | 描述程式碼行為 |
| 輸出標題中出現提示詞鷹架標籤 | 替換為原始標題 |

## 總結

寫出結果，而不是寫出您如何得到它的故事。輸出檔案的閱讀者應該看到乾淨、有用的內容 — 不帶任何產生它的提示詞痕跡。
