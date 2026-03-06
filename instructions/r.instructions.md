---
description: 'R 語言和文件格式 (R, Rmd, Quarto): 程式碼標準和 Copilot 指導，用於生成慣用、安全且一致的程式碼。'
applyTo: '**/*.R, **/*.r, **/*.Rmd, **/*.rmd, **/*.qmd'
---

# R 程式語言說明

## 目的

協助 GitHub Copilot 在專案中生成慣用、安全且可維護的 R 程式碼。

## 核心慣例

- **符合專案風格。** 如果檔案顯示偏好 (tidyverse vs. base R, `%>%` vs. `|>`)，請遵循。
- **偏好清晰、向量化的程式碼。** 保持函式簡潔並避免隱藏的副作用。
- **在範例/程式碼片段中限定非基礎函式**，例如 `dplyr::mutate()`、`stringr::str_detect()`。在專案程式碼中，如果這是儲存庫的規範，則可以使用 `library()`。
- **命名：** 物件/檔案使用 `lower_snake_case`；避免在名稱中使用點。
- **副作用：** 切勿呼叫 `setwd()`；偏好專案相關路徑 (例如 `here::here()`)。
- **可重現性：** 使用 `withr::with_seed()` 在隨機操作周圍設定本地種子。
- **驗證：** 驗證並約束使用者輸入；盡可能使用類型檢查和允許列表。
- **安全性：** 避免 `eval(parse())`、未經驗證的 shell 呼叫和未參數化的 SQL。

### 管道運算子

- **原生管道 `|>` (R ≥ 4.1.0)：** 在 R ≥ 4.1 中偏好使用 (無需額外依賴)。
- **Magrittr 管道 `%>%`：** 在已承諾使用 magrittr 的專案中繼續使用，或者當您需要像 `.`、`%T>%` 或 `%$%` 這樣的功能時。
- **保持一致：** 除非有明確的技術原因，否則不要在同一個腳本中混合使用 `|>` 和 `%>%`。

## 效能考量

- **大型資料集：** 考慮 `data.table`；使用您的工作負載進行基準測試。
- **dplyr 相容性：** 使用 `dtplyr` 編寫 dplyr 語法，該語法會自動轉換為 data.table 操作以提高效能。
- **分析：** 使用 `profvis::profvis()` 來識別程式碼中的效能瓶頸。在優化之前進行分析。
- **快取：** 使用 `memoise::memoise()` 快取昂貴的函式結果。對於重複的 API 呼叫或複雜的計算特別有用。
- **向量化：** 偏好向量化操作而不是迴圈。對於剩餘的迭代需求，請使用 `purrr::map_*()` 系列或 `apply()` 系列。

## 工具與品質

- **格式化：** `styler` (tidyverse 風格)，兩個空格縮排，約 100 個字元行。
- **程式碼檢查：** 透過 `.lintr` 配置 `lintr`。
- **預提交：** 考慮使用 `precommit` 鉤子自動進行程式碼檢查/格式化。
- **文件：** 導出函式使用 roxygen2 (`@param`、`@return`、`@examples`)。
- **測試：** 偏好小型、純粹、可組合且易於單元測試的函式。
- **依賴項：** 使用 `renv` 管理；添加套件後進行快照。
- **路徑：** 偏好 `fs` 和 `here` 以實現可移植性。

## 資料整理與 I/O

- **資料框：** 在大量使用 tidyverse 的檔案中偏好 tibbles；否則基礎 `data.frame()` 即可。
- **迭代：** 在 tidyverse 程式碼中使用 `purrr`。在基礎風格程式碼中，當它們提高清晰度或效能時，偏好類型穩定、向量化的模式，例如 `vapply()` (用於原子輸出) 或 `Map()` (用於元素級操作)，而不是明確的 `for` 迴圈。
- **字串與日期：** 如果已存在，請使用 `stringr`/`lubridate`；否則使用清晰的基礎輔助函式 (例如 `nchar()`、`substr()`、帶有明確格式的 `as.Date()`)。
- **I/O：** 偏好明確、類型化的讀取器 (例如 `readr::read_csv()`)；明確解析假設。

## 繪圖

- 偏好 `ggplot2` 用於出版品質的圖。保持圖層可讀並標記軸和單位。

## 錯誤處理

- 在 tidyverse 環境中，使用 `rlang::abort()` / `rlang::warn()` 處理結構化條件；在僅限基礎程式碼中，使用 `stop()` / `warning()`。
- 對於可恢復的操作：
- 當您需要相同類型的類型化備用值時，請使用 `purrr::possibly()` (更簡單)。
- 當您需要捕獲結果和錯誤以供以後檢查或記錄時，請使用 `purrr::safely()`。
- 在基礎 R 中使用 `tryCatch()` 以進行細粒度控制或與非 tidyverse 程式碼的相容性。
- 偏好一致的返回結構——正常流程的類型化輸出，僅在需要錯誤詳細資訊時才使用結構化列表。

## 安全最佳實踐

- **命令執行：** 偏好 `processx::run()` 或 `sys::exec_wait()` 而不是 `system()`；驗證並清理所有參數。
- **資料庫查詢：** 使用參數化 `DBI` 查詢以防止 SQL 注入。
- **檔案路徑：** 標準化並清理使用者提供的路徑 (例如 `fs::path_sanitize()`)，並根據允許列表進行驗證。
- **憑證：** 切勿硬編碼密鑰。使用環境變數 (`Sys.getenv()`)、VCS 外部配置或 `keyring`。

## Shiny

- 對於非平凡的應用程式，將 UI 和伺服器邏輯模組化。使用 `eventReactive()` / `observeEvent()` 處理明確的依賴項。
- 使用 `req()` 和清晰、使用者友好的訊息驗證輸入。
- 對於資料庫使用連接池 (`pool`)；避免長時間存在的全域物件。
- 隔離昂貴的計算，並偏好 `reactiveVal()` / `reactiveValues()` 處理小狀態。

## R Markdown / Quarto

- 保持程式碼塊專注；偏好明確的程式碼塊選項 (`echo`、`message`、`warning`)。
- 避免全域狀態；偏好本地輔助函式。使用 `withr::with_seed()` 處理確定性程式碼塊。

## Copilot 特定指南

- 如果當前檔案使用 tidyverse，**建議 tidyverse 優先模式** (例如 `dplyr::across()` 而不是已取代的動詞)。如果存在基礎 R 風格，**請使用基礎慣用語**。
- 在建議中限定非基礎呼叫 (例如 `dplyr::mutate()`)。
- 在慣用的情況下，建議向量化或整潔的解決方案而不是迴圈。
- 偏好小型輔助函式而不是長管道。
- 當多種方法等效時，偏好可讀性和類型穩定性，並解釋權衡。

---

## 最小範例

```r
# 基礎 R 變體
scores <- data.frame(id = 1:5, x = c(1, 3, 2, 5, 4))
safe_log <- function(x) tryCatch(log(x), error = function(e) NA_real_)
scores$z <- vapply(scores$x, safe_log, numeric(1))

# Tidyverse 變體 (如果此檔案使用 tidyverse)
result <- tibble::tibble(id = 1:5, x = c(1, 3, 2, 5, 4)) |>
dplyr::mutate(z = purrr::map_dbl(x, purrr::possibly(log, otherwise = NA_real_))) |>
dplyr::filter(z > 0)

# 帶有 roxygen2 文件的可重用輔助函式範例
#' 計算數值向量的 z 分數
#' @param x 數值向量
#' @return 數值向量的 z 分數
#' @examples z_score(c(1, 2, 3))
z_score <- function(x) (x - mean(x, na.rm = TRUE)) / stats::sd(x, na.rm = TRUE)
```