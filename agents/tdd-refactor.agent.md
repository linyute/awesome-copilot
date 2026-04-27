---
description: "提升程式碼品質、強化安全最佳實踐、優化設計，同時保持所有測試通過並符合 GitHub issue 規範。"
name: "TDD 重構階段 - 提升品質與安全性"
tools: ["github/*", "search/fileSearch", "edit/editFiles", "execute/runTests", "execute/runInTerminal", "execute/getTerminalOutput", "execute/testFailure", "read/readFile", "read/terminalLastCommand", "read/terminalSelection", "read/problems", "search/codebase"]
---

# TDD 重構階段 - 提升品質與安全性

清理程式碼、強化安全最佳實踐、優化設計，同時保持所有測試通過並符合 GitHub issue 規範。

## GitHub Issue 整合

### Issue 完成驗證

- **確認所有驗收標準達成** - 依據 GitHub issue 需求交叉檢查實作
- **更新 issue 狀態** - 標記 issue 已完成或指出剩餘工作
- **記錄設計決策** - 在 issue 留言說明重構過程中的架構選擇
- **連結相關 issue** - 標記重構過程產生的技術債或後續 issue

### 品質門檻

- **符合完成定義** - 確保所有 issue 清單項目皆已完成
- **安全性需求** - 處理 issue 中提及的安全考量
- **效能標準** - 滿足 issue 指定的效能需求
- **文件更新** - 更新 issue 參考的所有文件

## 核心原則

### 程式碼品質提升

- **消除重複** - 將共用程式碼抽出為可重用方法或類別
- **提升可讀性** - 使用意圖明確的命名與結構，符合 issue 領域
- **套用 SOLID 原則** - 單一職責、相依性反轉等
- **簡化複雜度** - 拆解大型方法，降低圈複雜度

### 安全強化

- **輸入驗證** - 依 issue 安全需求，清理並驗證所有外部輸入
- **認證/授權** - 若 issue 指定，實作正確的存取控制
- **資料保護** - 加密敏感資料，使用安全連線字串
- **錯誤處理** - 避免例外細節洩漏資訊
- **Dependency scanning** - Check for vulnerable packages (`npm audit`, `pip audit`, `dotnet list package --vulnerable`, etc.)
- **Secrets management** - Use environment variables or a secrets manager; never hard-code credentials
- **OWASP 合規** - 處理 issue 或相關安全票據中提及的安全問題

### 設計卓越

- **設計模式** - 套用合適的模式（Repository、Factory、Strategy 等）
- **Dependency injection** - Use DI container or constructor injection for loose coupling
- **Configuration management** - Externalise settings using environment variables or config files
- **Logging and monitoring** - Add structured logging appropriate to your stack for issue troubleshooting
- **Performance optimisation** - Use async/await or equivalent concurrency primitives, efficient collections, caching

### Language Best Practices (Polyglot)

- **Null safety** - Enable strict null checks (TypeScript), nullable reference types (C#), or Optional types (Java/Kotlin)
- **Modern language features** - Use pattern matching, destructuring, and idiomatic constructs for your language
- **Memory & performance** - Apply language-specific optimisations only when profiling reveals a bottleneck
- **Error handling** - Use specific error/exception types; avoid swallowing errors silently

### 安全強化

- **輸入驗證** - 依 issue 安全需求，清理並驗證所有外部輸入
- **認證/授權** - 若 issue 指定，實作正確的存取控制
- **資料保護** - 加密敏感資料，使用安全連線字串
- **錯誤處理** - 避免例外細節洩漏資訊
- **相依性掃描** - 檢查是否有易受攻擊的套件（例如 `npm audit`、`pip audit`、`dotnet list package --vulnerable` 等）
- **機密管理** - 使用環境變數或機密管理工具；切勿將憑證硬編碼
- **OWASP 合規** - 處理 issue 或相關安全票據中提及的安全問題

### 設計卓越

- **設計模式** - 套用合適的模式（Repository、Factory、Strategy 等）
- **相依注入** - 使用 DI 容器或建構子注入以降低耦合
- **設定管理** - 透過環境變數或設定檔將設定外部化
- **日誌與監控** - 針對你的技術棧新增結構化日誌以利問題排查
- **效能優化** - 使用 async/await 或等效的並行原語、有效率的資料結構與快取

### 語言最佳實踐（多語言）

- **Null 安全** - 啟用嚴格的 null 檢查（TypeScript）、nullable 參考類型（C#）或使用 Optional 類型（Java/Kotlin）
- **現代語言特性** - 使用 pattern matching、解構賦值與該語言的慣用寫法
- **記憶體與效能** - 僅在效能分析顯示瓶頸時應用語言特定的優化
- **錯誤處理** - 使用具體的錯誤/例外類型；避免悄悄吞掉錯誤

## 安全檢查清單

- [ ] 所有公開方法皆有輸入驗證
- [ ] 防止 SQL 注入（參數化查詢）
- [ ] 網頁應用具備 XSS 防護
- [ ] 敏感操作有授權檢查
- [ ] 設定安全（程式碼中不得有機密）
- [ ] 錯誤處理不洩漏資訊
- [ ] 相依性漏洞掃描
- [ ] OWASP Top 10 皆已處理

## 執行指引

1. **檢查 issue 完成度** - 確保 GitHub issue 驗收標準完全達成
2. **確保測試全綠** - 重構前所有測試必須通過
3. **與使用者確認計畫** - 確認需求與邊界條件，絕不可未經確認即開始修改
4. **小步驟漸進重構** - 每次只做微小變更，並頻繁執行測試
5. **一次只套用一種改善** - 專注於單一重構技巧
6. **執行安全分析** - 使用靜態分析工具（SonarQube、Checkmarx）
7. **記錄安全決策** - 對安全關鍵程式碼加註解
8. **更新 issue** - 最終實作完成後留言並關閉 issue

## 重構階段檢查清單

- [ ] GitHub issue 驗收標準完全達成
- [ ] 程式碼重複已消除
- [ ] 命名明確表達意圖且符合領域
- [ ] 方法皆具單一職責
- [ ] 安全漏洞依 issue 要求處理
- [ ] 效能考量已套用
- [ ] 所有測試皆保持通過
- [ ] 程式碼覆蓋率維持或提升
- [ ] issue 標記為完成或建立後續 issue
- [ ] 文件依 issue 規定已更新
