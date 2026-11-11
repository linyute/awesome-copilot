# 跨元件實作契約 (Cross-component implementation contract)

`foundry-agentic-loop` skill 的參考資料：在前端、後端、agent、資料擷取或基礎結構工作進行平行展開之前，必須先凍結的小型契約。將此表格複製至根目錄 `README.md` (rapid) 或 `./docs/spec.md` (SDD) 的 `Implementation contract` 區段，並替換每個預留位置。

## 契約表格 (Contract table)

| 契約 | 凍結數值 | 產生者 / 授權來源 | 取用者 | 驗證方式 |
| --- | --- | --- | --- | --- |
| `azure.yaml` 服務名稱 | 視情況填入 `<frontend>`、`<backend>`、`<agent>`、`<ingestion>` | 基礎結構 | azd 攔截勾點、部署指令碼、CI | `azd config list` 與資訊清單檢閱 |
| 環境變數 | 每個變數的精確名稱、型別、必要/選用狀態與預設值 | 佈建輸出或所屬服務 | 讀取該變數的每個元件 | 產生的環境變數對應與程式碼/設定讀取相符 |
| 託管 agent 通訊協定 | Responses API 版本與相容於 OpenAI 的 `/responses` 端點 | Foundry 託管 agent | 後端/用戶端 | 契約測試叫用已部署端點 |
| Responses metadata | 允許的索引鍵與 JSON 數值型別；無特定實作專屬物件 | 後端/用戶端契約 | Agent 與遙測 | 結構描述驗證 |
| Toolbox 端點 | `<project-endpoint>/toolboxes/<name>/versions/<version>/mcp?api-version=v1`；定義鎖定版本與提升版本之行為 | `azd ai toolbox create` / 佈建 | Agent MCP 橋接器 | MCP initialize 與 `tools/list` |
| MCP 工具 | 精確工具名稱、輸入 JSON 結構描述、輸出/錯誤結構形式 | 工具擁有者 | Agent | 結構描述快照與探索測試 |
| 模型推論 | 端點、部署名稱、模型/版本/SKU 與權杖範圍 (`https://ai.azure.com/.default`) | Foundry 佈建 | Agent 架構 | 具驗證的冒煙測試 |
| 回應主體 | 精確 JSON 結構形式、狀態/錯誤對應與串流行為 | 後端 API | 前端/用戶端 | API 契約測試 |
| 引用 (Citations) | 來源、區段、錨點/區塊識別碼與主張關聯 | Foundry IQ/toolbox | Agent、後端、前端 | 已知答案引用測試 |
| 基礎拒絕回答 | 無引用證據支援答案時所使用的精確確定性拒絕文字 | 產品/API 契約 | Agent、後端、evals | 無支援來源測試 |
| 執行階段版本 | Python、Node、託管 agent 執行階段與每個直接相依性，包含在實作期間解析為最新穩定發行版本、在產生程式碼前經過 API 驗證並精確鎖定的 `github-copilot-sdk`；精確映像檔標籤 (優先使用 digest)，絕不使用浮動的 "latest" | 官方套件索引、組建的套件索引與登錄檔 | 所有服務與 CI | 鎖定檔案/資訊清單與 CI 相符；組建的索引或登錄檔提供每個鎖定的版本 |

針對環境變數，當逐列列出比逗點分隔清單更清楚時，請為每個數值新增一列。同時記錄產生者與每個取用者；這可捕捉到佈建以某個名稱發出數值，而執行階段程式碼卻預期另一個名稱的情況。

## 合併前協調 (Reconciliation before merge)

1. 比對每個 `azure.yaml` 服務與攔截勾點目標與凍結的服務名稱。
2. 在程式碼、Bicep 輸出、azd 攔截勾點、CI 與文件中搜尋每個環境變數產生者與取用者。
3. 使用契約有效的 metadata 演練 Responses 端點，並驗證回應/引用/拒絕結構描述。
4. 初始化 toolbox 端點，比對探索到的 MCP 名稱與結構描述與凍結快照，並在出現偏差時宣告失敗。
5. 確認模型端點、部署名稱與權杖範圍在佈建與 agent 設定之間保持一致。
6. 比對執行階段與套件資訊清單與解析的版本列，並在產生的應用程式中執行相容性檢查。
7. 當需要刻意變更介面時，在單一變更中同時更新契約與所有取用者。
