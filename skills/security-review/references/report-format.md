# 安全性報告格式 (Security Report Format)

將此範本用於所有 `/security-review` 輸出。在步驟 7 中產生。

---

## 報告結構 (Report Structure)

### 標頭 (Header)
```
╔══════════════════════════════════════════════════════════╗
║           🔐 安全性審查報告 (SECURITY REVIEW REPORT)     ║
║           由 /security-review 技能產生                   ║
╚══════════════════════════════════════════════════════════╝

專案：<專案名稱或路徑>
掃描日期：<今天的日期>
範圍：<已掃描的檔案/目錄>
偵測到的語言：<列表>
偵測到的框架：<列表>
```

---

### 管理摘要表 (Executive Summary Table)

一律先顯示此表 — 一目了然的總覽：

```
┌────────────────────────────────────────────────┐
│           發現摘要 (FINDINGS SUMMARY)          │
├────────────────────┬───────────────────────────┤
│ 🔴 極高 (CRITICAL) │  <n> 項發現               │
│ 🟠 高 (HIGH)       │  <n> 項發現               │
│ 🟡 中 (MEDIUM)     │  <n> 項發現               │
│ 🔵 低 (LOW)        │  <n> 項發現               │
│ ⚪ 資訊 (INFO)     │  <n> 項發現               │
├────────────────────┼───────────────────────────┤
│ 總計 (TOTAL)       │  <n> 項發現               │
└────────────────────┴───────────────────────────┘

相依性稽核：發現 <n> 個有弱點的套件
秘密掃描：發現 <n> 個洩漏的認證
```

---

### 發現 (按類別分組)

針對每一項發現，使用此卡片格式：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[嚴重性表情符號] [嚴重性] — [弱點類型]
信心程度：高 (HIGH) / 中 (MEDIUM) / 低 (LOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 位置：src/routes/users.js，第 47 行

🔍 有弱點的程式碼：
  const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
  db.execute(query);

⚠️  風險：
  攻擊者可以操縱 `id` 參數來執行任意 SQL 命令，可能導致傾印
  (dump) 整個資料庫、規避驗證或刪除資料。

  攻擊範例：GET /users/1 OR 1=1--

✅ 建議修復方式：
  使用參數化查詢：

  const query = 'SELECT * FROM users WHERE id = ?';
  db.execute(query, [req.params.id]);

📚 參照：OWASP A03:2021 – 插入 (Injection)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 相依性稽核區段 (Dependency Audit Section)

```
📦 相依性稽核 (DEPENDENCY AUDIT)
══════════════════

🟠 高 (HIGH) — lodash@4.17.20 (package.json)
  CVE-2021-23337: 透過 zipObjectDeep() 進行原型污染 (Prototype pollution)
  修復方式：npm install lodash@4.17.21

🟡 中 (MEDIUM) — axios@0.27.2 (package.json)
  CVE-2023-45857: 透過 withCredentials 進行 CSRF
  修復方式：npm install axios@1.6.0

⚪ 資訊 (INFO) — express@4.18.2
  無已知 CVE。目前版本為 4.19.2 — 請考慮更新。
```

---

### 秘密與曝光掃描區段 (Secrets & Exposure Scan Section)

```
🔑 秘密與曝光掃描 (SECRETS & EXPOSURE SCAN)
═══════════════════════════

🔴 極高 (CRITICAL) — 寫死的 API 金鑰
  檔案：src/config/database.js，第 12 行
  
  發現：STRIPE_SECRET_KEY = "sk_live_FAKE_KEY_..."
  
  需要採取的行動：
  1. 立即在 https://dashboard.stripe.com 更換此金鑰
  2. 從原始程式碼中移除
  3. 新增至 .env 檔案並透過 process.env.STRIPE_SECRET_KEY 載入
  4. 將 .env 新增至 .gitignore
  5. 稽核 git 歷程紀錄 — 金鑰可能存在於先前的提交中：
     git log --all -p | grep "sk_live_"
     如果發現，請使用 git-filter-repo 或 BFG 從歷程紀錄中清除。
```

---

### 修補建議區段 (Patch Proposals Section)

僅包含「極高 (CRITICAL)」和「高 (HIGH)」發現：

````
🛠️  修補建議 (PATCH PROPOSALS)
══════════════════
⚠️  套用前請先審查每項修補 — 尚未進行任何更改。

─────────────────────────────────────────────
修補 1/3：src/routes/users.js 中的 SQL 插入 (SQL Injection)
─────────────────────────────────────────────

之前 (有弱點)：
```js
// 第 47 行
const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
db.execute(query);
```

之後 (已修復)：
```js
// 第 47 行 — 已修復：使用參數化查詢以防止 SQL 插入
const query = 'SELECT * FROM users WHERE id = ?';
db.execute(query, [req.params.id]);
```

是否套用此修補？(請先審查 — AI 產生的修補可能需要調整)
─────────────────────────────────────────────
````

---

### 頁尾 (Footer)

```
══════════════════════════════════════════════════════════

📋 掃描涵蓋範圍 (SCAN COVERAGE)
  已掃描檔案數：     <n>
  已分析行數：       <n>
  掃描持續時間：     <time>

⚡ 下一步 (NEXT STEPS)
  1. 立即處理所有「極高 (CRITICAL)」發現
  2. 將「高 (HIGH)」發現排入目前的衝刺 (sprint)
  3. 將「中 (MEDIUM)/低 (LOW)」新增至您的安全性待辦清單 (backlog)
  4. 在 CI/CD 管線中設定自動重複掃描

💡 注意：此為靜態分析掃描。它不會執行您的應用程式，
   且無法偵測到所有執行階段弱點。請搭配動態測試 (DAST)
   進行全方位涵蓋。

══════════════════════════════════════════════════════════
```

---

## 信心程度評等指南 (Confidence Ratings Guide)

套用於每項發現：

| 信心程度 | 何時使用 |
|------------|-------------|
| **高 (HIGH)** | 弱點明確。顯然缺乏清理 (Sanitization)。可以直接利用。 |
| **中 (MEDIUM)** | 弱點可能存在，但取決於代理程式無法完全追蹤的執行階段情境、設定或呼叫路徑。 |
| **低 (LOW)** | 偵測到可疑模式，但可能是誤判。標記以供人工審查。 |

切勿遺漏信心程度 — 這有助於開發人員優先處理他們的審查工作。

