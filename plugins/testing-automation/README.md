# 測試與測試自動化外掛程式 (Testing & Test Automation Plugin)

用於編寫測試、測試自動化與測試驅動開發 (TDD) 的全面集合，包含單元測試、整合測試與端對端測試策略。

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install testing-automation@awesome-copilot
```

## 包含內容 (What's Included)

### 指令 (斜線指令) (Commands (Slash Commands))

| 指令 | 描述 |
|---------|-------------|
| `/testing-automation:playwright-explore-website` | 使用 Playwright MCP 進行測試用的網站探索 |
| `/testing-automation:playwright-generate-test` | 使用 Playwright MCP 根據情境產生 Playwright 測試 |
| `/testing-automation:csharp-nunit` | 獲取 NUnit 單元測試的最佳實務，包含資料驅動測試 |
| `/testing-automation:java-junit` | 獲取 JUnit 5 單元測試的最佳實務，包含資料驅動測試 |
| `/testing-automation:ai-prompt-engineering-safety-review` | 全面的 AI 提示工程安全性檢閱與改善提示。分析提示的安全性、偏見、安全性弱點與有效性，同時透過廣泛的框架、測試方法論與教育內容提供詳細的改善建議。 |

### 代理程式 (Agents)

| 代理程式 | 描述 |
|-------|-------------|
| `tdd-red` | 透過在實作存在前根據 GitHub issue 情境編寫描述預期行為的失敗測試，引導測試先行開發 (test-first development)。 |
| `tdd-green` | 實作最精簡的程式碼以滿足 GitHub issue 需求，並在不過度工程的情況下使失敗的測試通過。 |
| `tdd-refactor` | 在保持測試通過 (green tests) 並符合 GitHub issue 的同時，改善程式碼品質、套用安全性最佳實務並增強設計。 |
| `playwright-tester` | Playwright 測試的測試模式 |

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
