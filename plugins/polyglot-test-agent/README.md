# 多語言測試代理程式外掛程式 (Polyglot Test Agent Plugin)

用於在任何程式語言中產生全面單元測試的多代理程式管線。協調研究、計畫與實作階段，使用專用代理程式產生符合編譯、通過測試並遵循專案慣例的測試。

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install polyglot-test-agent@awesome-copilot
```

## 包含內容 (What's Included)

### 代理程式 (Agents)

| 代理程式 | 描述 |
|-------|-------------|
| `polyglot-test-generator` | 使用「研究-計畫-實作」管線協調全面的測試產生。當被要求產生測試、編寫單元測試、提高測試涵蓋率或新增測試時使用。 |
| `polyglot-test-researcher` | 分析程式碼庫以瞭解結構、測試模式與可測試性。識別原始程式檔、現有測試、建構指令與測試框架。 |
| `polyglot-test-planner` | 根據研究結果建立結構化的測試實作計畫。依優先順序與複雜度將測試組織成不同階段。 |
| `polyglot-test-implementer` | 實作測試計畫中的單一階段。編寫測試檔案並驗證其是否編譯並通過。 |
| `polyglot-test-builder` | 為任何語言執行建構/編譯指令並回報結果。 |
| `polyglot-test-tester` | 為任何語言執行測試指令並回報結果。 |
| `polyglot-test-fixer` | 修復原始碼或測試檔案中的編譯錯誤。 |
| `polyglot-test-linter` | 為任何語言執行程式碼格式化/分析 (linter)。 |

### 指令 (斜線指令) (Commands (Slash Commands))

| 指令 | 描述 |
|---------|-------------|
| `/polyglot-test-agent:unit-test-generation` | 在任何程式語言中產生具備 80% 程式碼涵蓋率之全面、參數化單元測試的最佳實務與指引 |

### 技能 (Skills)

| 技能 | 描述 |
|-------|-------------|
| `polyglot-test-agent` | 使用多代理程式管線為任何程式語言產生全面、可用的單元測試。支援 C#、TypeScript、JavaScript、Python、Go、Rust、Java 等。 |

## 支援的語言 (Supported Languages)

- C# / .NET (MSTest, xUnit, NUnit)
- TypeScript / JavaScript (Jest, Vitest, Mocha)
- Python (pytest, unittest)
- Go (testing)
- Rust (cargo test)
- Java (JUnit, Maven, Gradle)

## 運作方式 (How It Works)

該外掛程式在 **研究 → 計畫 → 實作** 管線中協調專用代理程式：

1. **研究** — 分析程式碼庫以偵測語言、框架、測試模式與建構指令
2. **計畫** — 建立按優先順序與複雜度組織的分階段實作計畫
3. **實作** — 逐階段編寫測試檔案，並在每個步驟驗證編譯與測試通過情況

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
