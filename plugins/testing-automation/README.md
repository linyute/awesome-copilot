# Testing & Test Automation 外掛程式

撰寫測試、測試自動化與測試驅動開發 (TDD) 的完整集合，包含單元測試、整合測試以及端對端測試策略。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install testing-automation@awesome-copilot
```

## 包含內容

### 指令 (斜線指令)

| 指令 | 說明 |
|---------|-------------|
| `/testing-automation:playwright-explore-website` | 使用 Playwright MCP 進行網站探索以供測試 |
| `/testing-automation:playwright-generate-test` | 使用 Playwright MCP 根據情境產生 Playwright 測試 |
| `/testing-automation:csharp-nunit` | 取得 NUnit 單元測試最佳做法，包含資料驅動測試 |
| `/testing-automation:java-junit` | 取得 JUnit 5 單元測試最佳做法，包含資料驅動測試 |
| `/testing-automation:ai-prompt-engineering-safety-review` | 完整的 AI 提示工程安全性審查與改進提示。分析提示的安全性、偏見、安全性弱點及有效性，同時提供詳細的改進建議、廣泛的框架、測試方法與教育內容。 |

### Agent

| Agent | 說明 |
|-------|-------------|
| `tdd-red` | 透過在實作前撰寫說明預期行為的失敗測試（依據 GitHub issue 上下文），引導測試先行開發。 |
| `tdd-green` | 實作最少量的程式碼以滿足 GitHub issue 需求，並在不過度設計的情況下讓失敗的測試通過。 |
| `tdd-refactor` | 在維持測試通過 (green) 並符合 GitHub issue 的同時，提升程式碼品質、套用安全性最佳做法並強化設計。 |
| `playwright-tester` | Playwright 測試的測試模式 |

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，該專案為社群推動的 GitHub Copilot 擴充套件集合。

## 授權

MIT
