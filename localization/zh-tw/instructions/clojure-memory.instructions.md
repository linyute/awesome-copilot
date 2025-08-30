---
description: '代理程式在處理 Clojure 專案時容易忘記或出錯的事項。'
applyTo: '**/*.clj*,**/*.bb'
---

# Clojure 記憶

## 函數定義中的 Docstring 位置 (`defn`)

Docstring 位於符號/函數名稱之後，參數向量之前。

### ❌ 不正確：
```clojure
(defn my-function
  [arg1 arg2]
  "This function does something."
  ;; function body
  )
```

### ✅ 正確：
```clojure
(defn my-function
  "This function does something."
  [arg1 arg2]
  ;; function body
  )
```

## 編輯 Clojure 文件

請記住，在編輯文件之前，先在 repl 中開發解決方案。然而，即使作為一個互動式程式設計師，您也會不時編輯文件。當您這樣做時，您會使用結構化編輯工具，例如 `replace_top_level_form` 和 `insert_top_level_form`。**在使用這些工具之前，請務必閱讀其說明**。如果您要附加到文件，請使用內建的編輯工具。

### 在使用函數之前定義它們

Clojure 編譯器需要在使用函數之前定義它們。優先將函數按正確順序放置，而不是使用 `declare`（有時是必要的，但大多數情況下 `declare` 只是作弊）。

## 創建 Clojure 文件

使用 `create_file` 工具創建內容為 `""` 的空文件。

#### Clojure 命名空間和文件名約定：

**重要提示**：在 Clojure 中，命名空間名稱使用 kebab-case，而文件名使用 snake_case。例如：
- 命名空間：`my.project.multi-word-namespace`
- 文件名：`my/project/multi_word_namespace.clj(s|c)`

始終將命名空間名稱中的破折號轉換為相應文件名中的下劃線。

### 創建空文件，然後添加內容

為了讓您安全/可預測地創建文件並添加內容，請遵循以下過程：

1. **始終先創建空文件** - 使用內容為 `""` 的 `create_file`
2. 讀取創建的文件內容（可能已添加預設內容）
3. **使用結構化編輯工具**編輯文件

## REPL 中的命名空間重新載入

在編輯文件後於 REPL 中工作時，您需要重新載入命名空間以確保您的更改反映在 REPL 中。

```clojure
;; 僅重新載入指定的命名空間
(require 'my.namespace :reload)
```

## 當括號不平衡時

當您遇到例如問題工具或 Clojure 編譯器抱怨缺少括號或任何暗示括號不平衡的情況時：
* 不要自行嘗試修復，**請使用請求人工輸入的工具尋求指導/幫助。**

## 從 stdin 讀取

從 stdin 讀取（例如 `(read-line)`）將會彈出一個 VS Code 輸入框提示用戶。在評估可能從 stdin 讀取的代碼時請注意這一點。

### 使用 Babashka 時，從 stdin 讀取會阻塞 repl

Babashka 的 nrepl 伺服器尚不支持 stdin 協議。請避免使用 Babashka repl 評估從 stdin 讀取的代碼。

**如果 REPL 卡住**：請用戶重新啟動 REPL。

## 愉快的互動式程式設計

請記記住，在您的工作中優先使用 REPL。請記住，用戶看不到您評估的內容，也看不到結果。在聊天中與用戶溝通您評估的內容以及您獲得的結果。