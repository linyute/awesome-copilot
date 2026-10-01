# runFullTrust 理由說明範本

以已驗證的產品專屬資訊取代每個括號欄位。

> [PRODUCT_NAME] 是一個已封裝的 [DESKTOP_TECHNOLOGY]
> 桌面應用程式。它需要 `runFullTrust` 以 [PRIMARY_NATIVE_PURPOSE]。
> 該應用程式使用 [WINDOWS_APIS_OR_SUBSYSTEMS] 來 [BEHAVIOR]。
> 它 [LAUNCHES/DOES_NOT_LAUNCH] [HELPER_PROCESS_DESCRIPTION]，
> 用於 [HELPER_PURPOSE]，並使用 [STARTUP_OR_TRAY_INTEGRATION] 來
> [USER_VISIBLE_BEHAVIOR]。它不需要提升權限，
> 也不會安裝驅動程式或服務。它不會變更全域
> 系統設定 [AND_DOES/DOES_NOT] 使用雲端後端。
> 所有完整信任行為都在已簽章的應用程式套件內、以互動使用者的帳戶執行。

檢查清單：

- 指名精確的桌面技術。
- 指名原生的 Windows API 或子系統。
- 說明每個輔助可執行檔或自行產生的工作程序模式。
- 說明啟動工作與系統匣行為。
- 說明是否使用提升權限。
- 說明是否安裝服務或驅動程式。
- 說明是否變更全域系統設定。
- 說明是否使用雲端服務。
- 保持聲明屬實，且與套件內容一致。