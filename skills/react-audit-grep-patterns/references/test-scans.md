# 測試檔案搜尋 - 適用於兩者稽核器

專門針對測試檔案問題的搜尋。在 R18 和 R19 稽核期間執行。

---

## 設定檔案 (Setup Files)

```bash
# 尋找測試設定檔案
find src/ -name "setupTests*" -o -name "jest.setup*" 2>/dev/null
find . -name "jest.config.js" -o -name "jest.config.ts" 2>/dev/null | grep -v "node_modules"

# 檢查設定檔案中的舊版模式
grep -n "ReactDOM\|react-dom/test-utils\|Enzyme\|configure\|Adapter" \
  src/setupTests.js 2>/dev/null
```

---

## 匯入搜尋 (Import Scans)

```bash
# 測試中所有 react-dom/test-utils 的匯入
grep -rn "from 'react-dom/test-utils'\|require.*react-dom/test-utils" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null

# Enzyme 匯入
grep -rn "from 'enzyme'\|require.*enzyme" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null

# react-test-renderer
grep -rn "from 'react-test-renderer'" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null

# 舊的 act 位置
grep -rn "act.*from 'react-dom'" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null
```

---

## 渲染模式搜尋 (Render Pattern Scans)

```bash
# 測試中的 ReactDOM.render (應改用 RTL render)
grep -rn "ReactDOM\.render\s*(" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null

# Enzyme shallow/mount
grep -rn "shallow(\|mount(" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null

# 自訂渲染輔助函式 (Custom render helpers)
find src/ -name "test-utils.js" -o -name "renderWithProviders*" \
  -o -name "customRender*" -o -name "render-helpers*" 2>/dev/null
```

---

## 斷言搜尋 (Assertion Scans)

```bash
# 呼叫計數斷言 (對 StrictMode 敏感)
grep -rn "toHaveBeenCalledTimes" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null

# console.error 斷言 (React 錯誤記錄在 R19 中已變更)
grep -rn "console\.error" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null

# 中間狀態斷言 (對批次處理敏感)
grep -rn "fireEvent\|userEvent" \
  src/ --include="*.test.*" --include="*.spec.*" -A 1 \
  | grep "expect\|getBy\|queryBy" | head -20 2>/dev/null
```

---

## 非同步搜尋 (Async Scans)

```bash
# act() 使用
grep -rn "\bact(" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null

# waitFor 使用 (正常 - 請檢查這些是否已正確使用非同步)
grep -rn "waitFor\|findBy" \
  src/ --include="*.test.*" --include="*.spec.*" | wc -l

# 測試中的 setTimeout (可能對批次處理敏感)
grep -rn "setTimeout\|setInterval" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null
```
