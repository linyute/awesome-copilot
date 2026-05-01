# 提交分類啟發法 (Heuristics)

> **在工作流程中的角色**：提交訊息是「次要」訊號。程式碼差異 (diff) 始終 
> 會被優先讀取並視為事實依據。請使用這些啟發法在差異顯示的基礎上 
> 增加意圖與背景 — 而非取代差異。當提交訊息與差異衝突時， 
> 請相信差異。

閱讀 `git log` 輸出時，將每個提交映射到下方的其中一個類別。 
遵循慣用提交 (Conventional Commits, https://www.conventionalcommits.org/) 的存放庫 
將具有明確的前綴 — 請直接使用。對於自由格式的提交訊息，請使用啟發法。

---

## 慣用提交前綴 → 類別

| 前綴 | 類別 |
|---|---|
| `feat:` / `feat(scope):` | feat (功能) |
| `fix:` / `fix(scope):` | fix (修復) |
| `perf:` | perf (效能) |
| `refactor:` | refactor (重構) |
| `docs:` | docs (文件) |
| `chore:` | chore (日常維護) |
| `test:` / `tests:` | test (測試) |
| `ci:` | chore (日常維護) |
| `build:` | chore (日常維護) |
| `style:` | chore (日常維護) |
| `revert:` | 取決於被還原的內容 |
| 頁尾中的 `BREAKING CHANGE` 或類型後的 `!` (例如 `feat!:`) | breaking (重大變更) |

---

## 自由格式提交訊息啟發法

**重大變更 (Breaking)：**
- 包含單字：*breaking*, *incompatible*, *remove*, *rename*, *drop support*
- 片語模式：*no longer*, *was removed*, *has been deleted*, *breaking change*

**功能 (Feat)：**
- 開頭為：*add*, *implement*, *introduce*, *support*, *new*
- 包含：*now supports*, *ability to*, *can now*

**修復 (Fix)：**
- 開頭為：*fix*, *patch*, *resolve*, *correct*, *handle*
- 包含：*bug*, *regression*, *crash*, *error*, *wrong*, *incorrect*, *broken*

**效能 (Perf)：**
- 包含：*speed up*, *faster*, *reduce memory*, *optimize*, *performance*

**重構 (Refactor)：**
- 包含：*refactor*, *clean up*, *reorganize*, *restructure*, *simplify*, *extract*

**文件 (Docs)：**
- 包含：*docs*, *readme*, *comment*, *example*, *typo*

**日常維護 (Chore)：**
- 包含：*bump*, *upgrade dependencies*, *update deps*, *version bump*, *ci*, *lint*

**測試 (Test)：**
- 包含：*test*, *spec*, *coverage*, *fixture*

---

## 分類合併提交 (Merge Commits)

合併提交 (例如：`Merge pull request #42`) 通常是雜訊。請查看 PR 標題 
或合併內部的提交。如果 PR 標題遵循慣用提交，請使用該標題。

---

## 當您無法判斷時

如果提交看起來像維護工作，請預設為 **PATCH**。如果有任何提及 
新功能，請提升為 **MINOR**。只有在存在重大變更的明確證據時， 
才提升為 **MAJOR** — 不要對重大變更進行猜測。

---

## 類別與 Keep a Changelog 章節的映射

| 類別 | 變更日誌章節 |
|---|---|
| `breaking` + 新行為 | Changed |
| `breaking` + 移除 | Removed |
| `feat` | Added |
| `fix`, `perf` | Fixed |
| `security` | Security |
| `refactor`, `docs`, `chore`, `test` | 省略 (除非對使用者可見) |

**對使用者可見的重構範例**：將先前內部的輔助程式提取為新的公開匯出 → 
視為 Added，而非 Refactor。
