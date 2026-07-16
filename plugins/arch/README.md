# Arch 外掛程式

Architecture and modernization toolkit for locally-cloned repositories. It produces a single, cited architecture document from the code on disk, and generates a phased modernization plan that automatically runs Documentation mode first when no architecture document exists yet.

## 安裝

```bash
copilot plugin install arch@awesome-copilot
```

## 包含內容

### 技能

- **`doc-and-modernize`** — 在單一技能中為本機複製的儲存庫提供兩個互補的工作流程（透過此外掛程式安裝後，會以 `arch:doc-and-modernize` 的形式呈現）：
  - **Documentation 模式** — 為您已在本機簽出的儲存庫產生一份完整、可驗證的架構文件。以本機優先運作（優先使用本機簽出，將遠端/API 查詢視為標記的最後手段），將每項聲明引用至檔案 + 行號，標記未經驗證的事實，解決矛盾，並深入探索最複雜的子系統。非常適合用於上線文件和系統設計地圖。
  - **Modernization 模式** — 為舊版程式碼庫產生分階段的現代化計畫。若已有目前的架構文件，則在此基礎上繼續建構；否則，會先執行 Documentation 模式工作流程產生文件，再繼續進行計畫。產出的內容包括各功能的遷移文件、附有 ADR 的技術堆疊建議，以及具適應性且分階段安全推進的實作計畫。

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分。

## 授權條款

MIT
