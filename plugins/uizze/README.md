# UIZZE 外掛程式

停止讓通用 UI 直接上線。UIZZE 協助 GitHub Copilot 建立符合產品特色的介面，並完成讓介面真正可用的各種狀態。

## 安裝

```bash
copilot plugin install uizze@awesome-copilot
```

## 在實際畫面上試用

開啟包含帳單設定畫面的專案，並將其檔案路徑提供給 Copilot：

```text
使用 anti-ui-slop 改善 [file path] 中的帳單設定畫面。
重複使用此專案的元件與設計權杖。讓目前方案、使用量限制、發票，
以及升級或取消操作易於找到。
在適用的情況下，涵蓋載入、空白、付款失敗與權限遭拒狀態。
如果環境支援，請檢查算繪結果，然後修正可觀察到的版面配置與互動問題。
```

請根據產品實際具備的功能調整提示。此技能應保留產品的設計系統，
並完成所要求畫面的各種狀態。它不應捏造帳單行為、資料或後端整合。

如需其他工作，請參閱[資料表、權限、iOS 與 UI 審查範例](https://github.com/uizze/uizze/blob/main/examples/agent-workflows.md)。

## 包含內容

| 技能 | 描述 |
|---|---|
| `anti-ui-slop` | 使用產品簡介與現有設計系統，載入一份聚焦的操作手冊，視需要尋找相關介面參考資料，並在完成前檢查算繪結果。 |

## 運作方式

1. 檢查目標產品、工作項目、元件與現有設計系統。
2. 針對正在進行的介面工作類型，載入一份聚焦的操作手冊。
3. 只有在具體的視覺問題能從中受益時，才使用 UIZZE 參考資料。
4. 可能時算繪一次，並在完成前修正可觀察到的問題。

此技能僅依據儲存庫中的證據即可運作。UIZZE 參考資料為選用項目，搜尋結果為空是正常的不執行操作。

## 需求與範圍

- 不需要帳戶、認證資訊、權杖或外部伺服器。
- 此外掛程式未內含 MCP 伺服器。
- 免費工作流程本身即可發揮作用。內含操作手冊的授權範圍請見下方說明。

選用且獨立的經過驗證之 UIZZE MCP 僅提供 `find_ui_references` 與 `find_ui_materials`。此功能並非此外掛程式的必要項目。

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分。正式的 UIZZE 套件由 [uizze/uizze](https://github.com/uizze/uizze) 維護。

## 授權

此外掛程式入口採用 MIT 授權。內含的設計操作手冊採用
[Apache-2.0](https://github.com/github/awesome-copilot/blob/main/skills/anti-ui-slop/LICENSE)
條款，並附有[第三方聲明](https://github.com/github/awesome-copilot/blob/main/skills/anti-ui-slop/NOTICE)。
套件範圍請參閱上游的[授權對照表](https://github.com/uizze/uizze/blob/main/LICENSING.md)。
