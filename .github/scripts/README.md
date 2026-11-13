# 儲存庫腳本

腳本依照所維護的儲存庫區域分組。測試與其對應項目放在一起；畫布看板測試集中於 `canvas/boards/`，不會與擴充功能一起打包。

| 目錄 | 職責 |
| --- | --- |
| `catalog/` | 產生儲存庫與網站目錄、建立及驗證外掛程式與技能，並具體化外掛程式。 |
| `external-plugins/` | 外部外掛程式驗證、收件、品質關卡、核准及重新審查。 |
| `review/` | 提交關卡、PR 風險掃描、審查者分派、審查指標及報告。 |
| `canvas/` | Canvas 冒煙測試、錯誤交接同步及看板迴歸測試。 |
| `content-sync/` | 同步 App for Beginners 鏡像。 |
| `maintenance/` | 貢獻者工具、行尾正規化及分支清理。 |
| `lib/`、`utils/` | 各腳本群組共用的模組。 |

常見的建置、目錄及貢獻者工作請使用 `package.json` 中的 npm 指令。部分維護及工作流程腳本會由其工作流程直接呼叫，或記錄於相關功能旁。

## 維護者參考資料

- [Canvas 證據與指標](../../docs/maintainers/canvas-evidence-and-metrics.md)
- [審查分派](../../docs/maintainers/review-routing.md)
- [提交關卡](../../docs/maintainers/submission-gate.md)
- [外部外掛程式貢獻指南](../../CONTRIBUTING.md#adding-external-plugins)
