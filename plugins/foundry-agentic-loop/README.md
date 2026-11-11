# Foundry Agentic Loop

在 Microsoft Foundry、GitHub 和 Azure 上建構代理人解決方案，涵蓋從快速原型到經過驗證並部署的完整方案。

## 安裝

在 GitHub Copilot 應用程式中，按一下側邊欄的 **Customize**，然後選取 **Plugins**。找到 `foundry-agentic-loop` 並按一下 **Install**。

若要改從 Copilot CLI 安裝：

```
copilot plugin install foundry-agentic-loop@awesome-copilot
```

接著在應用程式中要求 Copilot **開啟 agentic loop**。`foundry-agentic-loop` 技能會尋找配套的畫布與工作流程，安裝遺漏的項目並開啟畫布。它只有在您同意後才會安裝 `microsoft-foundry` 技能。

## 兩種建構方式

| 模式 | 起始點 | 成果 |
| --- | --- | --- |
| **快速原型製作** | 現有的 Foundry 專案 | 託管代理人、受管控的工具箱、視需要使用的 Foundry IQ 基礎資料（grounding），以及 Container Apps 上的 React/FastAPI 應用程式，均由交談中建構 |
| **規格驅動開發 (SDD)** | 專案簡報與 Azure 訂用帳戶 | `foundry-agentic-loop-workflow` 建立 Foundry 專案並執行 **規格制定 (Specify) → 實作 (Implement) → 驗證 (Verify) → 部署 (Deploy)**，產生由 azd 部署的解決方案 |

從交談或畫布啟動任一模式。提示詞範本庫首先會以 **Shape it with Copilot** 開啟您的構想，接著提供 61 個產業範本，可依產業、功能、建構模組與模式進行篩選。

## 由 AGENTS.md 鎖定

建構開始時，Copilot 會在工作區根目錄的 `AGENTS.md` 加入 Agentic Loop 區段。它會鎖定交談、畫布與工作流程所選取的模式，並在後續提示詞中路由短命令：

| 模式 | 命令 |
| --- | --- |
| 快速原型製作 | `run`、`test`、`add agent`、`add tool`、`add skill`、`deploy`、`improve`、`convert to SDD` |
| SDD | `status`、`approve`、`resume`、`deploy`、`specify`、`implement`、`verify`、`build <brief>`、`improve` |

例如，在 SDD 工作區中執行 `deploy` 會繼續因等待部署核准而暫停的執行，或在沒有執行中的工作階段時執行部署階段。`build <brief>` 會在啟動新執行前詢問是否繼續執行中或暫停的執行。其他 `AGENTS.md` 內容將予以保留。Azure 設定（例如訂用帳戶、區域、Foundry 專案與資源名稱）僅儲存於 `.azure/deployment-plan.md`。若要切換模式，請洽詢 Copilot；它會先確認，然後重寫該區段。

## SDD 運作方式

各階段均在全新的子代理人環境中，遵循 `foundry-agentic-loop` 技能中的指引：

| 階段 | 工作內容 |
| --- | --- |
| 規格制定 (Specify) | 經過唯讀 Azure 預檢後的 EARS 規格、凍結的實作合約、工作串流與部署計畫 |
| 實作 (Implement) | azd 鷹架與佈建、託管整合檢查點，隨後展開平行工作串流 |
| 驗證 (Verify) | 針對各項驗收條件的本機端對端測試、託管呼叫、遙測以及 Foundry 評估 |
| 部署 (Deploy) | 核准後的 `azd up`、健康檢查，以及針對已部署端點的端對端測試 |

在每個階段中：

- 由 **主導者 (lead)** 負責執行工作。
- 獨立的 **審查者 (reviewer)** 重新執行檢查，並附帶具體事證回報問題。
- **修復者 (fixers)** 享有受限輪數的修改機會，唯有審查者裁定合格後門檻才會放行。

工作流程會暫停以等待您核准規格（除非自主性設為 `auto`），且在 `azd up` 之前一定會暫停。若門檻在修復輪數結束後仍未通過，將會帶著事證暫停等待您的決定。繼續執行時會從日誌重播已完成的步驟，因此已完成的工作絕不會執行兩次。每次執行都會將航程記錄寫入 `.agentic-loop/runs/`。

## 元件

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| 技能 | [Foundry Agentic Loop](../../skills/foundry-agentic-loop/) | 單一技能：安裝、模式選取、預設值與工作規則，加上快速原型製作、各 SDD 階段以及改進模式的指南 |
| 畫布 | [Foundry Agentic Loop 畫布](../../extensions/foundry-agentic-loop-canvas/) | 設定、專案選取、提示詞範本庫、即時工作流程檢視表、探索、最佳化與成本 |
| 工作流程 | [Foundry Agentic Loop 工作流程](../../extensions/foundry-agentic-loop-workflow/) | 在事證門檻背後循序執行四個 SDD 階段的動態工作流程 |

## 改進模式

每次建構都會在 `docs/LOOP.md` 中記錄已驗證的經驗教訓，且每次 SDD 執行都會留下航程記錄。要求 Copilot **改進 agentic loop** 以從兩者中挖掘深入資訊。Copilot 會針對技能與工作流程提出具事證支持的變更，每項均附有迴歸檢查，且僅套用您核准的變更。技能的評估執行器（`scripts/evals.mjs`）會在隔離的工作區中對照基準提交來衡量每項變更。核准、RBAC、安全與事證門檻絕不會被弱化。

## 需求

- 支援畫布的 GitHub Copilot 應用程式。工作流程也可透過 Copilot CLI 以 `copilot workflow run foundry-agentic-loop-workflow` 執行
- Azure 訂用帳戶、Azure CLI 以及隨附 Foundry（`azure.ai.*`）擴充功能的 Azure Developer CLI。畫布的 Start 索引標籤可協助透過 Foundry DevPack 安裝遺漏的工具，技能在安裝或升級任何項目之前均會詢問
- Python 3.13、Node.js 與 Git

兩種模式皆會建立計費的 Azure 資源，例如模型部署、託管代理人、Container Apps 與監視功能，以及基礎資料所需之 Azure AI Search。Copilot 在進行計費變更前皆會確認。若要移除 SDD 環境，請要求 Copilot 拆除。在您核准後，它會執行 `azd down --purge` 並刪除建構時所建立、位於資源群組之外的 Entra 應用程式註冊。

此技能絕不會從 URL 安裝擴充功能或編輯您的 Copilot 設定。若遺漏畫布或工作流程，在重新安裝此外掛程式前均會詢問。若其中一項被列為已停用，請在擴充功能設定中重新啟用，並在新的工作階段中繼續：執行中的工作階段將維持停用狀態。

## 鳴謝

建構於 [aiappsgbb/agentic-loop](https://github.com/aiappsgbb/agentic-loop)（MIT，版權所有 (c) 2026 aiappsgbb）以及 [Azure-Samples/Spec2Cloud](https://github.com/Azure-Samples/Spec2Cloud)（MIT，版權所有 (c) Microsoft Corporation）的精簡 spec2cloud 技能之上。

技能目錄中的六項產業 runSkill（`factory-operations-triage`、`production-flow-optimizer`、`care-gap-outreach-planner`、`post-discharge-care-coordinator`、`loan-file-readiness-reviewer` 與 `mortgage-underwriting-coordinator`）僅在建構提示詞點名時，才會透過 `gh skill install` 從 [aiappsgbb/agentic-loop](https://github.com/aiappsgbb/agentic-loop) 提取；Copilot 會在安裝前告知來源存放庫名稱。請如同對待任何第三方技能一樣審查它們。