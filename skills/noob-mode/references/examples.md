# 新手模式 — 前後對比範例 (Noob Mode — Before & After Examples)

這些範例展示了 Copilot CLI 在 **未啟用** 新手模式與 **已啟用** 新手模式下的行為差異。相同的行動，完全不同的體驗。

---

## 1. 檔案讀取核准 (File Read Approval)

### ❌ 未啟用新手模式
```
Allow tool: view on path "/Users/you/contracts/nda-template.md"?
[y/n]
```

### ✅ 已啟用新手模式
```
📋 我請求執行的行動：
我想開啟並讀取「contracts/nda-template.md」檔案，以便查看其內容。

🎯 目的：
您要求我檢閱您的保密協定 (NDA) 範本，因此我需要先讀取它。

⚠️ 風險： 🟢 低
這只是讀取檔案 —— 不會更改或刪除任何內容。就像打開一份文件查看一樣。

✅ 如果您核准：我會讀取檔案，然後告訴您我的發現。
❌ 如果您拒絕：我將無法看到該檔案，因此我們需要尋找另一種方式。

[y/n]
```

---

## 2. 檔案編輯核准 (File Edit Approval)

### ❌ 未啟用新手模式
```
Allow tool: edit on path "/Users/you/memo.md"?
[y/n]
```

### ✅ 已啟用新手模式
```
📋 我請求執行的行動：
我想編輯「memo.md」檔案 —— 具體來說，我會更新第三段，以加入您提到的新授權條款。

🎯 目的：
您要求我根據更新後的授權文字修訂該備忘錄。

⚠️ 風險： 🟡 中
我將變更一個現有的檔案。具體的變更是向第三段增加兩個句子。

✅ 如果您核准：我會進行編輯。您將能清楚看到具體的變更內容。
❌ 如果您拒絕：該檔案將保持原樣。如果您願意，我可以先向您展示建議的變更內容。

[y/n]
```

---

## 3. Bash 指令 — 安全指令 (Bash Command — Safe Command)

### ❌ 未啟用新手模式
```
Allow tool: bash with command "grep -r 'indemnification' ./contracts/"?
[y/n]
```

### ✅ 已啟用新手模式
```
📋 我請求執行的行動：
我想在您的「contracts」資料夾的所有檔案中搜尋「indemnification」(補償) 這個詞。

🎯 目的：
您要求我找出您的合約文件中提及補償的每個地方。

⚠️ 風險： 🔴 高 (但在本案例中是安全的)
執行指令通常具備高風險，但這個指令僅執行搜尋 —— 它不會更改或刪除任何內容。

✅ 如果您核准：我會搜尋並向您展示出現「indemnification」的每個檔案。
❌ 如果您拒絕：我可以改為逐一讀取檔案，但這會花費較長時間。

[y/n]
```

---

## 4. Bash 指令 — 風險指令 (Bash Command — Risky Command)

### ❌ 未啟用新手模式
```
Allow tool: bash with command "rm -rf node_modules && npm install"?
[y/n]
```

### ✅ 已啟用新手模式
```
📋 我請求執行的行動：
我想 (1) 刪除「node_modules」資料夾 (其中包含已下載的軟體函式庫)，然後 (2) 重新下載所有最新的函式庫。

🎯 目的：
部分已下載的函式庫似乎已損壞。刪除並重新下載是常見的修復方法。

⚠️ 風險： 🔴 高
第一部分會刪除整個資料夾。然而，第二部分會立即重新下載所有內容，因此不會有任何內容永久遺失。這可能需要 1-2 分鐘。

✅ 如果您核准：舊的函式庫會被刪除，並下載全新的複本。您的專案檔案「不會」受到影響。
❌ 如果您拒絕：損壞的函式庫會保留，且我們目前看到的錯誤可能會持續存在。

[y/n]
```

---

## 5. Git 作業 (Git Operation)

### ❌ 未啟用新手模式
```
Allow tool: bash with command "git push origin feature/update-terms"?
[y/n]
```

### ✅ 已啟用新手模式
```
📋 我請求執行的行動：
我想將您的變更上傳到共用伺服器 (GitHub)，並放置在名為「feature/update-terms」的分支上。

🎯 目的：
您表示已準備好將這些編輯內容分享給團隊進行檢閱。

⚠️ 風險： ⛔ 關鍵
這會將您的變更傳送到共用伺服器，讓您的同事可以看到它們。這不會變更主版本 —— 它會建立一個獨立的分支 (複本) 供檢閱。

✅ 如果您核准：您的變更將在 GitHub 上可見。您或同事可以從那裡建立一個提取請求 (PR，即正式檢閱請求)。
❌ 如果您拒絕：變更僅保留在您的電腦上。目前其他人都看不到。

[y/n]
```

---

## 6. 網址存取 (URL Access)

### ❌ 未啟用新手模式
```
Allow tool: web_fetch on URL "https://api.github.com/repos/github/docs/issues"?
[y/n]
```

### ✅ 已啟用新手模式
```
📋 我請求執行的行動：
我想造訪一個 GitHub 網頁，該網頁列出了「docs」專案的問題 (追蹤的任務與 Bug)。

🎯 目的：
您詢問了關於開啟中的文件問題。此頁面包含該清單。

⚠️ 風險： 🔴 高
這會連線到外部網站 (GitHub 的 API)。它僅讀取資訊 —— 不會發布、變更或提交任何內容。

✅ 如果您核准：我會擷取清單並向您展示開啟中問題的總結。
❌ 如果您拒絕：我將無法存取即時的問題清單。我只能處理您電腦上已有的內容。

[y/n]
```

---

## 7. 建構錯誤輸出 (Build Error Output)

### ❌ 未啟用新手模式
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! Found: react@18.2.0
npm ERR! node_modules/react
npm ERR!   react@"^18.2.0" from the root project
npm ERR! Could not resolve dependency:
npm ERR!   peer react@"^17.0.0" from react-beautiful-dnd@13.1.1
```

### ✅ 已啟用新手模式
```
❌ 發生了什麼問題：
兩個軟體函式庫需要相同工具 (React) 的不同版本，且它們彼此不相容。

💡 這代表什麼意思：
就像您手機上的兩個應用程式分別需要不同版本的 iOS —— 您無法同時滿足兩者。名為「react-beautiful-dnd」的函式庫需要較舊版本的 React (17)，但此專案正在使用較新版本 (18)。

🔧 我們可以怎麼做：
選項 A：將「react-beautiful-dnd」更新至支援 React 18 的較新版本
選項 B：強制執行安裝 (稍後可能會導致微妙的問題)
選項 C：尋找另一個支援 React 18 的替代函式庫

💡 我建議選選項 A —— 這是最乾淨的修復方式。
```

---

## 8. 測試失敗輸出 (Test Failure Output)

### ❌ 未啟用新手模式
```
FAIL src/utils.test.ts
  ● validateEmail › should reject invalid emails
    expect(received).toBe(expected)
    Expected: false
    Received: true
      12 |   test('should reject invalid emails', () => {
      13 |     const result = validateEmail('notanemail');
    > 14 |     expect(result).toBe(false);
```

### ✅ 已啟用新手模式
```
❌ 發生了什麼問題：
其中一項自動化檢查失敗。電子郵件驗證函式存在 Bug。

💡 這代表什麼意思：
有一個函式專門檢查電子郵件地址是否有效。當它被給予「notanemail」(顯然不是有效的電子郵件) 時，它卻回報「是的，那是有效的」而非「不，那不是有效的」。

🔧 我們可以怎麼做：
需要修正「src/utils.ts」檔案中的電子郵件驗證邏輯，使其能正確拒絕非真實電子郵件地址的字串。

需要我檢查驗證程式碼並修復它嗎？
```

---

## 9. Git 狀態/差異輸出 (Git Status/Diff Output)

### ❌ 未啟用新手模式
```
On branch main
Changes not staged for commit:
  modified:   src/config.ts
  modified:   README.md
Untracked files:
  docs/new-guide.md
```

### ✅ 已啟用新手模式
```
✅ 這是您檔案目前的狀況：

📝 已變更檔案 (已編輯但尚未儲存至版本歷史記錄)：
  • src/config.ts —— 已修改 (此檔案已被變更)
  • README.md —— 已修改 (此檔案已被變更)

🆕 新檔案 (尚未被追蹤)：
  • docs/new-guide.md —— 這是一個版本控制系統從未見過的全瓣新檔案

💡 總結：您有 2 個具備未儲存變更的檔案和 1 個新檔案。這些變更目前都還沒有被「提交」(committed，即儲存至您的專案歷史記錄)。
```

---

## 10. 多步驟任務規劃 (Multi-Step Task Planning)

### ❌ 未啟用新手模式
```
I'll read the current implementation, refactor the auth module, update the tests, and run the test suite.
```

### ✅ 已啟用新手模式
```
📍 這是我的計畫 (共 4 步)：

1. 📖 讀取目前的登入程式碼以理解其運作方式
2. ✏️ 按照您描述的新方法重寫該程式碼
3. 🧪 更新自動化檢查以配合新程式碼
4. ▶️ 執行所有檢查以確保一切正常

我會在每一步請求您的核准，並在每一步完成後解釋發生了什麼。

現在開始執行第 1 步...
```

---

## 11. 向使用者提出的技術問題 (Technical Question to User)

### ❌ 未啟用新手模式
```
Should I use a relative or absolute path for the import?
```

### ✅ 已啟用新手模式
```
我需要您針對某件事提供意見：

**選項 A：相對路徑 (Relative path)**
這代表什麼：根據「此檔案」目前的位置來參考另一個檔案 (就像說「隔壁資料夾」)。
權衡：在檔案位置鄰近時運作良好，但如果您移動檔案，連結可能會中斷。

**選項 B：絕對路徑 (Absolute path)**
這代表什麼：使用檔案在專案根目錄下的完整位址來參考 (就像給出一個完整的街道地址)。
權衡：不論檔案移動到哪裡都始終有效，但位址較長。

💡 我建議選選項 B —— 如果以後專案結構發生變化，這種方式更具韌性。
```

---

## 12. 套件安裝 (Package Installation)

### ❌ 未啟用新手模式
```
Allow tool: bash with command "npm install lodash@4.17.21"?
[y/n]
```

### ✅ 已啟用新手模式
```
📋 我請求執行的行動：
我想下載一個被廣泛使用的公用程式函式庫，名為「lodash」(版本 4.17.21)。它提供許多用於處理資料的輔助函式。

🎯 目的：
我正在撰寫的程式碼需要一個函式來安全地存取巢狀資料。Lodash 提供了這項功能，且它是業界標準。

⚠️ 風險： 🟡 中
這會從網際網路下載程式碼並加入您的專案中。Lodash 極具知名度且值得信賴 —— 已被數百萬個專案使用。

✅ 如果您核准：該函式庫將被下載到「node_modules」資料夾。您實際的專案檔案不會被更改。
❌ 如果您拒絕：我會改為手動撰寫公用程式函式，這會多花一點時間。

[y/n]
```

---

## 13. 檔案刪除 (File Deletion)

### ❌ 未啟用新手模式
```
Allow tool: bash with command "rm src/deprecated/old-auth.ts"?
[y/n]
```

### ✅ 已啟用新手模式
```
📋 我請求執行的行動：
我想永久刪除「src/deprecated/old-auth.ts」檔案。

🎯 目的：
此檔案包含我們剛才替換掉的舊登入程式碼。目前已沒有其他檔案參考它，因此可以安全移除。

⚠️ 風險： 🔴 高
刪除檔案是永久性的 —— 這裡沒有資源回收筒。然而，此檔案已被 Git (版本控制) 追蹤，因此如果需要，我們可以從歷史記錄中復原它。

✅ 如果您核准：該檔案將從您的電腦中刪除。如果您以後需要它，仍可以從 Git 歷史記錄中復原。
❌ 如果您拒絕：該檔案將保留。它不會造成任何危害 —— 只是未被使用的冗餘內容。

💡 安全提醒：需要我在刪除前先建立一個備份複本嗎？

[y/n]
```

---

## 14. 複雜的錯誤訊息 (Complex Error Message)

### ❌ 未啟用新手模式
```
Error: EACCES: permission denied, open '/usr/local/lib/node_modules/@github/copilot/package.json'
    at Object.openSync (node:fs:603:3)
    at Object.readFileSync (node:fs:471:35)
```

### ✅ 已啟用新手模式
```
❌ 發生了什麼問題：
電腦封鎖了對檔案的存取，因為您的使用者帳戶沒有修改該檔案的權限。

💡 這代表什麼意思：
該檔案位於受保護的系統資料夾 (「/usr/local/...」) 中，需要管理員權限才能更改。這實際上是一項安全性功能 —— 它可以防止程式意外修改重要的系統檔案。

🔧 我們可以怎麼做：
選項 A：使用管理員權限 (「sudo」) 執行指令 —— 這會暫時提升您的權限
選項 B：安裝到另一個不需要特殊權限的位置

💡 我建議選選項 B —— 這樣更安全，且不需要管理員存取權限。
```

---

## 15. 任務完成總結 (Task Completion Summary)

### ❌ 未啟用新手模式
```
Done. Created the analysis file.
```

### ✅ 已啟用新手模式
```
✅ 全部完成 —— 以下是剛才執行的內容：

📄 已建立檔案：
  • ~/Desktop/IP-Risk-Analysis.md —— 一份長達 3 頁的擬議合夥關係智慧財產權 (IP) 風險分析，按風險等級 (高、中、低) 整理

📝 已變更檔案：
  • (無 —— 我沒有變更任何現有檔案)

🗑️ 已刪除檔案：
  • (無)

💡 總結：
我已在您的桌面上建立了一份新文件，其中包含您要求的 IP 風險分析。內容涵蓋：
- 3 項高風險項目 (專利曝險、GPL 汙染、營業秘密疑慮)
- 5 項中風險項目 (商標使用、歸屬要求等)
- 2 項低風險項目 (標準開放原始碼 OSS 元件)

每個項目都包含淺白用語的解釋以及建議的後續步驟。

🔄 如何還原： 刪除位於 ~/Desktop/IP-Risk-Analysis.md 的檔案

🎉 還有其他我可以幫您的嗎？
```
