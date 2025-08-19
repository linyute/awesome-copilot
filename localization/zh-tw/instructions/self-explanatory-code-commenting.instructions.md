---
description: 'GitHub Copilot 寫註解以達到自我說明程式碼的指引。範例為 JavaScript，但適用於所有支援註解的語言。'
applyTo: '**'
---

# 自我說明程式碼註解指引

## 核心原則
**程式碼本身即具說明力。僅在必要時註解「為什麼」，而非「做什麼」。**
大多數情況下不需註解。

## 註解指引

### ❌ 避免以下註解類型

**明顯註解**
```javascript
// 不佳：陳述明顯事實
let counter = 0;  // 初始化計數器為零
counter++;  // 計數器加一
```

**冗餘註解**
```javascript
// 不佳：註解重複程式碼
function getUserName() {
    return user.name;  // 回傳使用者名稱
}
```

**過時註解**
```javascript
// 不佳：註解與程式碼不符
// 計算稅率 5%
const tax = price * 0.08;  // 實際為 8%
```

### ✅ 應撰寫以下註解類型

**複雜商業邏輯**
```javascript
// 良好：說明此計算的原因
// 採用累進稅率：10% 於 10k 以下，20% 於以上
const tax = calculateProgressiveTax(income, [0.10, 0.20], [10000]);
```

**非顯而易見演算法**
```javascript
// 良好：說明演算法選擇
// 使用 Floyd-Warshall 計算所有節點最短路徑
// 因需取得所有節點間距離
for (let k = 0; k < vertices; k++) {
    for (let i = 0; i < vertices; i++) {
        for (let j = 0; j < vertices; j++) {
            // ... 實作
        }
    }
}
```

**正則表達式**
```javascript
// 良好：說明正則用途
// 匹配 email 格式：username@domain.extension
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
```

**API 限制或注意事項**
```javascript
// 良好：說明外部限制
// GitHub API 速率限制：認證用戶每小時 5000 次
await rateLimiter.wait();
const response = await fetch(githubApiUrl);
```

## 決策框架

撰寫註解前請自問：
1. **程式碼本身是否已清楚？** → 不需註解
2. **更好的命名是否可取代註解？** → 請重構
3. **是否說明「為什麼」而非「做什麼」？** → 好註解
4. **是否有助未來維護者？** → 好註解

## 特殊註解情境

### 公開 API
```javascript
/**
 * 使用標準公式計算複利。
 * 
 * @param {number} principal - 初始投資金額
 * @param {number} rate - 年利率（小數，如 0.05 代表 5%）
 * @param {number} time - 年數
 * @param {number} compoundFrequency - 每年複利次數（預設：1）
 * @returns {number} 複利後金額
 */
function calculateCompoundInterest(principal, rate, time, compoundFrequency = 1) {
    // ... 實作
}
```

### 設定與常數
```javascript
// 良好：說明來源或原因
const MAX_RETRIES = 3;  // 依據網路可靠性研究
const API_TIMEOUT = 5000;  // AWS Lambda 超時 15s，留緩衝
```

### 標註
```javascript
// TODO: 安全審查後改用正式使用者認證
// FIXME: 生產環境記憶體洩漏 - 檢查連線池
// HACK: 函式庫 v2.1.0 bug workaround - 升級後移除
// NOTE: 本實作假設所有計算皆採 UTC 時區
// WARNING: 此函式會修改原陣列，未建立副本
// PERF: 熱路徑頻繁呼叫建議快取
// SECURITY: 查詢前請驗證輸入以防 SQL 注入
// BUG: 陣列為空時邊界失敗 - 需調查
// REFACTOR: 抽出至獨立工具函式以利重用
// DEPRECATED: 請改用 newApiFunction()，本函式將於 v3.0 移除
```

## 反模式

### 死程式碼註解
```javascript
// 不佳：勿註解掉程式碼
// const oldFunction = () => { ... };
const newFunction = () => { ... };
```

### 變更紀錄註解
```javascript
// 不佳：勿於註解維護歷史
// John 於 2023-01-15 修改
// Sarah 於 2023-02-03 修正 bug
function processData() {
    // ... 實作
}
```

### 分隔線註解
```javascript
// 不佳：勿用裝飾性註解
//=====================================
// UTILITY FUNCTIONS
//=====================================
```

## 品質檢查表

提交前請確認註解：
- [ ] 說明「為什麼」而非「做什麼」
- [ ] 文法正確且清楚
- [ ] 隨程式碼演進仍正確
- [ ] 真正提升程式理解
- [ ] 放在描述程式碼之上
- [ ] 拼字正確且專業

## 總結

請記住：**最好的註解是程式碼本身已自我說明，無需額外註解。**
