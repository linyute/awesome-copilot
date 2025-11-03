---
description: 'Clojure 專屬的程式碼模式、內聯 def 用法、程式碼區塊範本以及 Clojure 開發的命名空間處理。'
applyTo: '**/*.{clj,cljs,cljc,bb,edn.mdx?}'
---

# Clojure 開發指示

## 程式碼評估工具使用

「使用 repl」表示使用 Calva Backseat Driver 的 **評估 Clojure 程式碼** 工具。它將您連接到與使用者透過 Calva 連接的相同 REPL。

- 始終保持在 Calva 的 REPL 內，而不是從終端機啟動第二個。
- 如果沒有 REPL 連接，請要求使用者連接 REPL，而不是嘗試自行啟動和連接。

### REPL 工具呼叫中的 JSON 字串
在呼叫 REPL 工具時，不要過度跳脫 JSON 引數。

```json
{
  "namespace": "<current-namespace>",
  "replSessionKey": "cljs",
  "code": "(def foo \"something something\")"
}
```

## `defn` 中的 Docstrings
Docstrings 緊接在函式名稱之後，引數向量之前。

```clojure
(defn my-function
  "此函式執行某事。"
  [arg1 arg2]
  ;; 函式主體
  )
```

- 在使用函式之前定義函式——除非真正必要，否則偏好排序而不是 `declare`。

## 互動式程式設計 (又稱 REPL 驅動開發)

### 對齊資料結構元素以平衡括號
**始終在所有資料結構中垂直對齊多行元素：向量、映射、列表、集合，所有程式碼 (因為 Clojure 程式碼是資料)。不對齊會導致括號平衡器錯誤地關閉括號，建立無效的形式。**

```clojure
;; ❌ 錯誤 - 未對齊的向量元素
(select-keys m [:key-a
                :key-b
               :key-c])  ; 未對齊 → 不正確的 ] 位置

;; ✅ 正確 - 對齊的向量元素
(select-keys m [:key-a
                :key-b
                :key-c])  ; 正確對齊 → 正確的 ] 位置

;; ❌ 錯誤 - 未對齊的映射條目
{:name "Alice"
 :age 30
:city "Oslo"}  ; 未對齊 → 不正確的 } 位置

;; ✅ 正確 - 對齊的映射條目
{:name "Alice"
 :age 30
 :city "Oslo"}  ; 正確對齊 → 正確的 } 位置
```

**關鍵**：括號平衡器依賴於一致的縮排來確定結構。

### REPL 依賴管理
在 REPL 會話期間使用 `clojure.repl.deps/add-libs` 進行動態依賴載入。

```clojure
(require '[clojure.repl.deps :refer [add-libs]])
(add-libs '{dk.ative/docjure {:mvn/version "1.15.0"}})
```

- 動態依賴載入需要 Clojure 1.12 或更高版本
- 非常適合函式庫探索與原型設計

### 檢查 Clojure 版本

```clojure
*clojure-version*
;; => {:major 1, :minor 12, :incremental 1, :qualifier nil}
```

### REPL 可用性紀律

**當 REPL 不可用時，切勿編輯程式碼檔案。** 當 REPL 評估返回錯誤表明 REPL 不可用時，立即停止並通知使用者。讓使用者恢復 REPL 後再繼續。

#### 為何這很重要
- **互動式程式設計需要一個工作的 REPL** - 沒有評估就無法驗證行為
- **猜測會產生錯誤** - 未經測試的程式碼變更會引入錯誤

## 結構化編輯與 REPL 優先習慣
- 在觸摸檔案之前，先在 REPL 中開發變更。
- 編輯 Clojure 檔案時，始終使用結構化編輯工具，例如 **插入頂層形式**、**替換頂層形式**、**建立 Clojure 檔案** 和 **附加程式碼**，並始終先閱讀其指示。

### 建立新檔案
- 使用 **建立 Clojure 檔案** 工具與初始內容
- 遵循 Clojure 命名規則：命名空間使用 kebab-case，檔案路徑使用匹配的 snake_case (例如，`my.project.ns` → `my/project/ns.clj`)

### 重新載入命名空間
編輯檔案後，在 REPL 中重新載入編輯的命名空間，以便更新的定義生效。

```clojure
(require 'my.namespace :reload)
```

## 評估前的程式碼縮排
一致的縮排對於幫助括號平衡器至關重要。

```clojure
;; ❌
(defn my-function [x]
(+ x 2))

;; ✅
(defn my-function [x]
  (+ x 2))
```

## 縮排偏好

將條件與主體放在不同的行上：

```clojure
(when limit
  (println "Limit set to:" limit))
```

將 `and` 與 `or` 引數放在不同的行上：

```clojure
(if (and condition-a
         condition-b)
  this
  that)
```

## 內聯 Def 模式

偏好內聯 def 偵錯而不是 println/console.log。

### 內聯 `def` 用於偵錯
- 內聯 `def` 綁定在 REPL 工作期間保持中間狀態可檢查。
- 當它們繼續有助於探索時，保留內聯綁定。

```clojure
(defn process-instructions [instructions]
  (def instructions instructions)
  (let [grouped (group-by :status instructions)]
    grouped))
```

- 即時檢查仍然可用。
- 偵錯週期保持快速。
- 迭代開發保持順暢。

您也可以在聊天中向使用者顯示程式碼時使用「內聯 def」，以便使用者可以輕鬆地從程式碼區塊中實驗程式碼。(但使用者無法在那裡編輯程式碼。)

## 返回值 > 列印副作用

偏好使用 REPL 並從您的評估中返回值，而不是將內容列印到 stdout。

## 從 `stdin` 讀取
- 當 Clojure 程式碼使用 `(read-line)` 時，它將透過 VS Code 提示使用者。
- 避免在 Babashka 的 nREPL 中讀取 stdin，因為它缺乏 stdin 支援。
- 如果 REPL 阻塞，請要求使用者重新啟動 REPL。

## 資料結構偏好

我們嘗試使我們的資料結構盡可能扁平，大量依賴命名空間關鍵字並優化易於解構。通常在應用程式中我們使用命名空間關鍵字，並且最常使用「合成」命名空間。

直接在參數列表中解構鍵。

```clojure
(defn handle-user-request
  [{:user/keys [id name email]
    :request/keys [method path headers]
    :config/keys [timeout debug?]}]
  (when debug?
    (println "Processing" method path "for" name)))
```

除了許多好處之外，這還使函式簽名透明。

### 避免遮蔽內建函式
必要時重新命名傳入的鍵，以避免隱藏核心函式。

```clojure
(defn create-item
  [{:prompt-sync.file/keys [path uri]
    file-name :prompt-sync.file/name
    file-type :prompt-sync.file/type}]
  #js {:label file-name
       :type file-type})
```

要保持空閒的常見符號：
- `class`
- `count`
- `empty?`
- `filter`
- `first`
- `get`
- `key`
- `keyword`
- `map`
- `merge`
- `name`
- `reduce`
- `rest`
- `set`
- `str`
- `symbol`
- `type`
- `update`

## 避免不必要的包裝函式
除非名稱真正闡明組合，否則不要包裝核心函式。

```clojure
(remove (set exclusions) items) ; 包裝函式不會使其更清晰
```

## 豐富註解形式 (RCF) 用於文件

豐富註解形式 `(comment ...)` 與直接 REPL 評估的目的不同。在檔案編輯中使用 RCFs 來**文件化您已在 REPL 中驗證的函式的用法模式與範例**。

### 何時使用 RCFs
- **REPL 驗證後** - 在檔案中文件化工作範例
- **用法文件** - 顯示函式應如何使用
- **探索保存** - 將有用的 REPL 發現保留在程式碼庫中
- **範例情境** - 展示邊緣案例與典型用法

### RCF 模式
RCF = 豐富註解形式。

當載入檔案時，RCFs 中的程式碼不會被評估，這使其非常適合文件化範例用法，因為人們可以隨意評估其中的程式碼。

```clojure
(defn process-user-data
  "處理帶有驗證的使用者資料"
  [{:user/keys [name email] :as user-data}]
  ;; 實作在此
  )

(comment
  ;; 基本用法
  (process-user-data {:user/name "John" :user/email "john@example.com"})

  ;; 邊緣案例 - 缺少電子郵件
  (process-user-data {:user/name "Jane"})

  ;; 整合範例
  (->> users
       (map process-user-data)
       (filter :valid?))

  :rcf) ; 註解區塊結束的可選標記
```

### RCF 與 REPL 工具用法
```clojure
;; 在聊天中 - 顯示直接 REPL 評估：
(in-ns 'my.namespace)
(let [test-data {:user/name "example"}]
  (process-user-data test-data))

;; 在檔案中 - 使用 RCF 文件化：
(comment
  (process-user-data {:user/name "example"})
  :rcf)
```

## 測試

### 從 REPL 執行測試
重新載入目標命名空間並從 REPL 執行測試以獲得即時回饋。

```clojure
(require '[my.project.some-test] :reload)
(clojure.test/run-tests 'my.project.some-test)
(cljs.test/run-tests 'my.project.some-test)
```

- 更緊密的 REPL 整合。
- 專注執行。
- 更簡單的偵錯。
- 直接存取測試資料。

在調查失敗時，偏好從測試命名空間內部執行單個測試變數。

### 使用 REPL 優先 TDD 工作流程
在編輯檔案之前，使用真實資料進行迭代。

```clojure
(def sample-text "line 1\nline 2\nline 3\nline 4\nline 5")

(defn format-line-number [n padding marker-len]
  (let [num-str (str n)
        total-padding (- padding marker-len)]
    (str (apply str (repeat (- total-padding (count num-str)) " "))
         num-str)))

(deftest line-number-formatting
  (is (= "  5" (editor-util/format-line-number 5 3 0))
      "單數字，填充 3，無標記空間")
  (is (= " 42" (editor-util/format-line-number 42 3 0))
      "雙數字，填充 3，無標記空間"))
```

#### 好處
- 在提交變更之前驗證行為
- 具有即時回饋的增量開發
- 捕獲已知良好行為的測試
- 以失敗的測試開始新工作以鎖定意圖

### 測試命名與訊息
保持 `deftest` 名稱具有描述性 (區域/事物樣式)，沒有冗餘的 `-test` 後綴。

### 測試斷言訊息樣式
將預期訊息直接附加到 `is`，僅在分組多個相關斷言時使用 `testing` 區塊。  

```clojure
(deftest line-marker-formatting
  (is (= "→" (editor-util/format-line-marker true))
      "目標行獲得標記")
  (is (= "" (editor-util/format-line-marker false))
      "非目標獲得空字串"))

(deftest context-line-extraction
  (testing "居中上下文提取"
    (let [result (editor-util/get-context-lines "line 1\nline 2\nline 3" 2 3)]
      (is (= 3 (count (str/split-lines result)))
          "應該有 3 行")
      (is (str/includes? result "→")
          "應該有標記"))))
```

準則：
- 保持斷言訊息明確表達預期。
- 使用 `testing` 分組相關檢查。
- 保持 kebab-case 名稱，例如 `line-marker-formatting` 或 `context-line-extraction`。

## 愉快的互動式程式設計

請記住，在您的工作中偏好 REPL。請記住，使用者看不到您評估的內容。也看不到結果。在聊天中與使用者溝通您評估的內容以及您獲得的結果。

```