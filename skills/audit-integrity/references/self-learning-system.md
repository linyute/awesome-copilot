# 自我學習系統

在 `.github/SecurityLessons/` 與 `.github/SecurityMemories/` 中維護專案的學習產出物。

## 何時建立

### 教訓（Lesson）

符合下列情況時，建立一則教訓：

- 掃描產生了誤報，且需要人工修正
- 某發現類別、STRIDE 類別或缺陷類型在初步掃描中遺漏，並由自我批判循環抓出
- 發現工具或方法學的限制
- 特定語言的規則誤觸發
- 某 SCA 相依性無法解析

### 記憶（Memory）

符合下列情況時，建立一則記憶：

- 發現某項架構決策、安全慣例或技術堆疊細節
- 識別出某項相依性管理模式、領域特定威脅模式或威脅角色檔案（profile）
- 發現專案的程式碼慣例、框架慣用法或已知的誤報模式
- 任何對同一程式碼庫未來掃描有用的程式碼庫特定知識

## 教訓範本

```markdown
# 安全教訓：<短標題>

## Metadata

- CreatedAt: <日期>
- Status: active | deprecated
- Supersedes: <先前的教訓（若有的話）>

## 情境（Context）

- 觸發的掃描/任務：
- 分析的元件：

## 問題（Issue）

- 出了什麼問題或遺漏了什麼：
- 預期行為：
- 實際行為：

## 根本原因（Root Cause）

- 為何被遺漏或出錯：

## 解決方式（Resolution）

- 如何修正：

## 預防指引（Preventive Guidance）

- 未來掃描如何避免此問題：
```

## 記憶範本

```markdown
# 安全記憶：<短標題>

## Metadata

- CreatedAt: <日期>
- Status: active | deprecated
- Supersedes: <先前的記憶（若有的話）>

## 情境（Context）

- 觸發的掃描/任務：
- 範圍/系統：

## 關鍵事實（Key Fact）

- 發現了什麼：
- 對安全分析為何重要：

## 重用指引（Reuse Guidance）

- 何時套用此知識：
- 相關元件：
```

## 治理規則

1. **去重檢查**：在建立新的教訓或記憶前，搜尋既有檔案中的類似內容。更新既有記錄，而非建立重複項目。
2. **衝突解決**：若新證據與現有的 active 教訓/記憶衝突，將舊的標記為 `deprecated`，並建立附有 `Supersedes` 引用的更新版本。
3. **掃描開始時重用**：每次分析開始時，檢視 lessons/memories 目錄中適用的情境。在開始分析前套用相關指引。
