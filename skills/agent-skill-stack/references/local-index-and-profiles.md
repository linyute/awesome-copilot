# 本機索引與專案 Skill Stack Profiles (Local index and project Skill Stack Profiles)

## 為何兩者皆不可或缺

漸進式載入與專案設定檔解決了不同層次的問題：

- **漸進式載入**控制單一可用 Skill 進入上下文的量：首先是 Metadata，僅在匹配後才載入完整指示。
- **專案設定檔 (Project profile)** 控制針對單一專案應優先考量哪些 Skills 以及它們如何交接。

兩者相輔相成。設定檔在匹配前縮小候選集合與路由範圍；漸進式載入在之後保持所選 Skill 的輕量化。

當客戶端支援專案本機 Skill 目錄時，安裝至專案是最強大的範圍控制手段。單憑設定檔僅能表達路由偏好，但無法強制底層客戶端卸載全域安裝的 Metadata。

## 標準本機索引

該索引可防止已安裝的 Skills 變成不可見的庫存。請從所有相關根目錄建構它，並在安裝、移除或更新後重新整理。

每筆記錄包含：

- 穩定的 Skill 名稱與來源根目錄；
- 白話摘要；
- 用於檢索的別名與能力術語；
- 全域或專案範圍；
- 上次本機修改時間；
- 內部 Skill 檔案指紋；
- 重複或 Metadata 問題。

該索引不執行 Skills，也不儲存任何提示、命中率或使用記錄。

建構：

```bash
python3 scripts/skill_index.py build \
  --root ~/.codex/skills \
  --root ~/.codex/plugins/cache \
  --root .codex/skills \
  --root ~/.agents/skills \
  --root ~/.hermes/skills \
  --output ~/.codex/skill-index.json
```

搜尋：

```bash
python3 scripts/skill_index.py search \
  --index ~/.codex/skill-index.json \
  --query "natural Chinese writing" \
  --limit 8
```

在內部使用 JSON 結果。向初學者僅呈現名稱、白話摘要、目前範圍與建議狀態。

## 專案設定檔

將選取的堆疊儲存於 `<project>/.codex/skill-stack.json`。

設定檔記錄：

- 簡單的專案/設定檔名稱；
- 作用中的 Skill 名稱；
- 簡單的意圖至主要/支援路由；
- 設定檔優先 (profile-first) 行為；
- 是否允許針對未涵蓋的需求在設定檔之外進行搜尋。

建立預覽：

```bash
python3 scripts/project_profile.py \
  --project /path/to/project \
  --name my-project-stack \
  --skill primary-skill \
  --skill helper-skill \
  --route "main task=primary-skill" \
  --route "writing quality=helper-skill"
```

僅在確認後帶有 `--apply` 重複執行。建立設定檔不會安裝 Skill，也不會授予新權限。

## 設定檔路由

當設定檔存在時：

1. 根據設定檔路由與作用中 Skills 匹配請求。
2. 將設定檔主要 Skill 用於主要任務。
3. 僅在其定義的交接點新增輔助工具。
4. 僅在缺少必要功能或使用者要求替代方案時，才在設定檔之外搜尋。
5. 即使無關的全域 Skills 描述很寬泛，也將其排除在建議的堆疊之外。

變更設定檔後，重新建構本機索引並重新執行召回檢查。
