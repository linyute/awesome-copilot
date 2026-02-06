# 測試與測試自動化延伸模組

用於編寫測試、測試自動化和測試驅動開發 (TDD) 的全面集合，包含單元測試、整合測試和端對端 (E2E) 測試策略。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install testing-automation@awesome-copilot
```

## 包含內容

### 指令 (斜線指令)

| 指令 | 描述 |
|---------|-------------|
| `/testing-automation:playwright-explore-website` | 使用 Playwright MCP 進行測試用的網站探索 |
| `/testing-automation:playwright-generate-test` | 使用 Playwright MCP 根據場景產生 Playwright 測試 |
| `/testing-automation:csharp-nunit` | 獲取 NUnit 單元測試的最佳做法，包含資料驅動測試 |
| `/testing-automation:java-junit` | 獲取 JUnit 5 單元測試的最佳做法，包含資料驅動測試 |
| `/testing-automation:ai-prompt-engineering-safety-review` | 全面的 AI 提示工程 (Prompt Engineering) 安全性檢閱與改進提示。分析提示的安全性、偏見、安全性弱點和有效性，同時透過廣泛的框架、測試方法論和教育內容提供詳細的改進建議。 |

### Agent

| Agent | 描述 |
|-------|-------------|
| `tdd-red` | 在實作存在之前，透過編寫描述 GitHub Issue 內容中所需行為的失敗測試，來引導測試優先開發。 |
| `tdd-green` | 實作最精簡的程式碼以滿足 GitHub Issue 需求，並使失敗的測試通過，而不進行過度設計。 |
| `tdd-refactor` | 改善程式碼品質、套用安全性最佳做法並增強設計，同時保持測試通過並符合 GitHub Issue 要求。 |
| `playwright-tester` | 適用於 Playwright 測試的測試模式 |

## 來源

此延伸模組是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
