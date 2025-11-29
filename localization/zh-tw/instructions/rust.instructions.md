---
description: 'Rust 程式語言的撰寫慣例與最佳實踐'
applyTo: '**/*.rs'
---

# Rust 程式撰寫慣例與最佳實踐

撰寫 Rust 程式時，請遵循 Rust 社群的慣例與標準。

本指引內容參考自 [The Rust Book](https://doc.rust-lang.org/book/)、[Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)、[RFC 430 命名慣例](https://github.com/rust-lang/rfcs/blob/master/text/0430-finalizing-naming-conventions.md)，以及 [users.rust-lang.org](https://users.rust-lang.org) 社群。

## 一般指引

- 優先考量可讀性、安全性與可維護性。
- 善用強型別與 Rust 的所有權系統確保記憶體安全。
- 將複雜函式拆分為小型、易管理的函式。
- 演算法相關程式碼需說明設計思路。
- 程式碼應易於維護，並註明設計決策原因。
- 錯誤處理請用 `Result<T, E>` 並提供明確錯誤訊息。
- 使用外部套件時，請於文件註明用途。
- 命名遵循 [RFC 430](https://github.com/rust-lang/rfcs/blob/master/text/0430-finalizing-naming-conventions.md)。
- 程式碼應符合 Rust 借用檢查規則，並保持慣用、安全、高效。
- 確保程式編譯無警告。

## 建議模式

- 用模組（`mod`）與公開介面（`pub`）封裝邏輯。
- 錯誤處理用 `?`、`match` 或 `if let`。
- 序列化用 `serde`，自訂錯誤用 `thiserror` 或 `anyhow`。
- 用 trait 抽象服務或外部依賴。
- 非同步程式用 `async/await`，搭配 `tokio` 或 `async-std`。
- 型別安全優先，狀態建議用 enum 取代旗標。
- 複雜物件建立建議用 builder。
- 二進位與函式庫程式分離（`main.rs` 與 `lib.rs`），利於測試與重用。
- CPU 密集型任務用 `rayon` 實現資料平行。
- 優先用 iterator 取代索引迴圈，通常更快更安全。
- 函式參數優先用 `&str`，除非需要所有權。
- 優先借用與零拷貝，避免不必要配置。

### 所有權、借用與生命週期

- 優先借用（`&T`），除非需轉移所有權才用 clone。
- 需修改借用資料時用 `&mut T`。
- 編譯器無法推斷時，請明確標註生命週期。
- 單執行緒參考計數用 `Rc<T>`，多執行緒用 `Arc<T>`。
- 單執行緒內部可變性用 `RefCell<T>`，多執行緒用 `Mutex<T>` 或 `RwLock<T>`。

## 避免模式

- 除非必要，勿用 `unwrap()` 或 `expect()`，請妥善處理錯誤。
- 函式庫程式勿 panic，請回傳 `Result`。
- 勿依賴全域可變狀態，建議用依賴注入或執行緒安全容器。
- 避免深層巢狀邏輯，建議用函式或組合子重構。
- 警告視為錯誤，CI 時勿忽略。
- 除非必要且有完整文件，勿用 `unsafe`。
- 避免過度使用 `clone()`，除非需要所有權。
- 避免過早 `collect()`，iterator 保持 lazy 直到需要。
- 避免不必要配置，優先借用與零拷貝。

## 程式風格與格式化

- 遵循 Rust Style Guide，並用 `rustfmt` 自動格式化。
- 行寬盡量不超過 100 字元。
- 函式與結構文件註解用 `///`，緊接於項目前。
- 用 `cargo clippy` 檢查常見錯誤並強化最佳實踐。

## 錯誤處理

- 可恢復錯誤用 `Result<T, E>`，不可恢復錯誤僅用 `panic!`。
- 錯誤傳遞優先用 `?`，勿用 `unwrap()` 或 `expect()`。
- 自訂錯誤型別建議用 `thiserror` 或實作 `std::error::Error`。
- 可選值用 `Option<T>`。
- 錯誤訊息需明確且具脈絡。
- 錯誤型別需具意義並實作標準 trait。
- 函式參數需驗證並針對無效輸入回傳錯誤。

## API 設計指引

### 常見 trait 實作
建議適時實作以下 trait：
- `Copy`、`Clone`、`Eq`、`PartialEq`、`Ord`、`PartialOrd`、`Hash`、`Debug`、`Display`、`Default`
- 標準轉換 trait：`From`、`AsRef`、`AsMut`
- 集合建議實作 `FromIterator` 與 `Extend`
- 註：`Send` 與 `Sync` 由編譯器自動實作，除非用 `unsafe`，勿手動實作

### 型別安全與可預測性
- 用 newtype 提供靜態區分
- 參數型別需具意義，優先用具體型別取代泛用 `bool`
- `Option<T>` 僅用於真正可選值
- 明確 receiver 的函式建議用 method
- 只有 smart pointer 應實作 `Deref` 與 `DerefMut`

### 前瞻性設計
- 用 sealed trait 保護下游實作
- 結構欄位設為私有
- 函式需驗證參數
- 所有公開型別必須實作 `Debug`

## 測試與文件

- 用 `#[cfg(test)]` 與 `#[test]` 撰寫單元測試。
- 測試模組建議與被測程式碼同檔（`mod tests { ... }`）。
- 整合測試放在 `tests/` 目錄，檔名具描述性。
- 所有函式、結構、enum 及複雜邏輯皆需明確註解。
- 函式命名具描述性，並附完整文件。
- 所有公開 API 用 rustdoc（`///` 註解）並遵循 [API Guidelines](https://rust-lang.github.io/api-guidelines/)。
- 實作細節用 `#[doc(hidden)]` 隱藏於公開文件。
- 文件需說明錯誤情境、panic 條件與安全考量。
- 範例建議用 `?`，勿用 `unwrap()` 或過時的 `try!`。

## 專案組織

- `Cargo.toml` 用語意化版本。
- metadata 完整：`description`、`license`、`repository`、`keywords`、`categories`。
- 可選功能用 feature flag。
- 程式碼用 `mod.rs` 或命名檔案分模組。
- `main.rs` 或 `lib.rs` 保持精簡，邏輯移至模組。

## 品質檢查清單

發佈或審查 Rust 程式前，請確認：

### 核心要求
- [ ] **命名**：遵循 RFC 430 命名慣例
- [ ] **Trait**：適當實作 `Debug`、`Clone`、`PartialEq`
- [ ] **錯誤處理**：用 `Result<T, E>` 並提供明確錯誤型別
- [ ] **文件**：所有公開項目皆有 rustdoc 註解與範例
- [ ] **測試**：涵蓋單元測試與邊界情境

### 安全與品質
- [ ] **安全**：無不必要 `unsafe`，錯誤處理妥善
- [ ] **效能**：iterator 高效、配置最小化
- [ ] **API 設計**：函式可預測、彈性且型別安全
- [ ] **前瞻性**：結構欄位私有、trait sealed
- [ ] **工具**：程式通過 `cargo fmt`、`cargo clippy`、`cargo test`
