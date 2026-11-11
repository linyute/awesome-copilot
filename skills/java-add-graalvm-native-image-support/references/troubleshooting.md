# 常見原生映像檔錯誤與修正方式 (Common native image errors and fixes)

| 徵兆 | 可能原因 | 修正方式 |
|---|---|---|
| 執行時期出現 `ClassNotFoundException`, `NoSuchMethodException`, `NoSuchFieldException` | 缺少反射中繼資料 | 追蹤代理程式；架構提示；`reflect-config.json` |
| `MissingReflectionRegistrationError` | 同上，精準回報 | 註冊具名型別/成員 |
| 類別路徑檔案的資源為 `null` / `FileNotFoundException` | 未包含該資源 | `resource-config.json` 模式；架構資源設定 |
| `Proxy class defined by interfaces [...] not found` | 缺少動態代理中繼資料 | `proxy-config.json` / 架構提示 |
| `Classes that should be initialized at run time got initialized during image building` | 包含執行階段狀態（隨機數、通訊端、執行緒、系統屬性）的類別在建置時期初始化 | `--initialize-at-run-time=<class>` |
| `Object of type X was found in the image heap` (隨機數、執行緒、檔案控制代碼) | 建置時期初始化儲存了非映像檔安全的狀態 | 將所屬類別的初始化移至執行時期 |
| `Detected a started Thread in the image heap` | 在靜態初始化器中啟動了執行緒 | 延遲至執行時期 |
| `UnsatisfiedLinkError` | 缺少 JNI/原生函式庫 | `jni-config.json`；隨附或連結原生函式庫 |
| `Unsupported features in ...` / `Discovered unresolved type during parsing` | 缺少選用相依性或函式庫不受支援 | 新增相依性；升級函式庫；檢查可達性中繼資料存放庫 |
| 序列化錯誤 (`java.io.Serializable`) | 缺少序列化中繼資料 | `serialization-config.json` / 架構提示 |
| 建置期間記憶體不足 (Out of memory) | 原生建置需要數 GB | 提高容器/CI 記憶體；將 `-J-Xmx<size>` 作為建置引數；關閉其他處理程序 |
| 建置非常緩慢 | 進行完整最佳化時屬正常現象 | 僅限開發時使用 `-O b`；使用 CI 快取；僅在特定設定檔中建構 |
| 二進位檔行為與 JVM 不同 | 建置時期初始化、缺少中繼資料、無法動態載入類別 | 原生測試；在完整測試套件上執行追蹤代理程式 |
| 二進位檔體積過大 | 相依性過多 | 檢閱相依性；`-Os`；在 Oracle GraalVM 上檢查 `--emit build-report` (Community Edition 不提供) |
| 動態類別載入、針對未知名稱的 `Class.forName`、代理程式、`MethodHandles` 技巧 | 原生映像檔不支援 | 重構為靜態註冊 |

## 診斷工作流程 (Diagnosis workflow)

1. 搭配 `-H:+ReportExceptionStackTraces` 執行建置以取得完整錯誤資訊。
2. 在 Oracle GraalVM 上，新增 `--emit build-report` 以檢視是什麼將類別引入（Build Report 在 GraalVM Community Edition 中不提供；在該環境下請使用標準建置輸出）。
3. 針對執行階段錯誤，在 JVM 上搭配追蹤代理程式執行相同情境，並將輸出與您的中繼資料比對差異。
4. 在 Oracle GraalVM 上，使用建置報告找出是哪一個相依性造成體積過大或初始化問題。

## 注意事項 (Cautions)

- 即使上述有建議，相依性/架構升級以及 CI 或執行器變更仍需取得使用者核准；在相依性變更後保留受管理的版本並重新執行 JVM 基準線。
- `--initialize-at-build-time` 是一項伴隨風險的最佳化；請套用至具名類別而非廣泛套件，除非架構文件另有說明。
- `--report-unsupported-elements-at-runtime` 只會延遲失敗的發生；請將其用於診斷，而非作為解決方案。
- 原生二進位檔具平台專屬性；請在目標作業系統/架構上（或在相符的容器中）進行建構。
