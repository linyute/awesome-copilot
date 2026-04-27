# React 19 稽核 - 完整搜尋指令

請按此順序執行。每個章節都對應到 react19-auditor 中的一個階段。

---

## 階段 1 - 已移除的 API (重大變更 - 必須修正)

```bash
# 1. ReactDOM.render - 已移除
grep -rn "ReactDOM\.render\s*(" \
  src/ --include="*.js" --include="*.jsx" 2>/dev/null

# 2. ReactDOM.hydrate - 已移除
grep -rn "ReactDOM\.hydrate\s*(" \
  src/ --include="*.js" --include="*.jsx" 2>/dev/null

# 3. unmountComponentAtNode - 已移除
grep -rn "unmountComponentAtNode" \
  src/ --include="*.js" --include="*.jsx" 2>/dev/null

# 4. findDOMNode - 已移除
grep -rn "findDOMNode\|ReactDOM\.findDOMNode" \
  src/ --include="*.js" --include="*.jsx" 2>/dev/null

# 5. createFactory - 已移除
grep -rn "createFactory\|React\.createFactory" \
  src/ --include="*.js" --include="*.jsx" 2>/dev/null

# 6. react-dom/test-utils 匯入 - 大部分匯出項目已移除
grep -rn "from 'react-dom/test-utils'\|from \"react-dom/test-utils\"\|require.*react-dom/test-utils" \
  src/ --include="*.js" --include="*.jsx" 2>/dev/null

# 7. 舊版 Context API - 已移除
grep -rn "contextTypes\|childContextTypes\|getChildContext" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." 2>/dev/null

# 8. 字串 ref (String refs) - 已移除
grep -rn "this\.refs\." \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." 2>/dev/null
```

---

## 階段 2 - 棄用的 API (應進行遷移)

```bash
# 9. forwardRef - 已棄用 (ref 現在是直接 prop)
grep -rn "forwardRef\|React\.forwardRef" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." 2>/dev/null

# 10. 函式元件上的 defaultProps - 函式元件已移除此功能
grep -rn "\.defaultProps\s*=" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." 2>/dev/null

# 11. 未含初始值的 useRef()
grep -rn "useRef()\|useRef( )" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." 2>/dev/null

# 12. propTypes (執行階段驗證已悄悄移除)
grep -rn "\.propTypes\s*=" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l

# 13. react-test-renderer - 已棄用
grep -rn "react-test-renderer\|TestRenderer" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." 2>/dev/null

# 14. 不需要的 React 預設匯入 (新的 JSX 轉換)
grep -rn "^import React from 'react'" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." 2>/dev/null
```

---

## 階段 3 - 測試檔案搜尋

```bash
# 來自錯誤位置的 act()
grep -rn "from 'react-dom/test-utils'" \
  src/ --include="*.test.js" --include="*.test.jsx" \
       --include="*.spec.js" --include="*.spec.jsx" 2>/dev/null

# Simulate 使用 - 已移除
grep -rn "Simulate\." \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null

# 測試中的 react-test-renderer
grep -rn "from 'react-test-renderer'" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null

# Spy 呼叫計數斷言 (可能需要 StrictMode 差異更新)
grep -rn "toHaveBeenCalledTimes" \
  src/ --include="*.test.*" --include="*.spec.*" | head -20 2>/dev/null

# console.error 呼叫計數斷言 (React 19 錯誤回報變更)
grep -rn "console\.error.*toHaveBeenCalledTimes\|toHaveBeenCalledTimes.*console\.error" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null
```

---

## 階段 4 - StrictMode 行為變更

```bash
# StrictMode 使用
grep -rn "StrictMode\|React\.StrictMode" \
  src/ --include="*.js" --include="*.jsx" 2>/dev/null

# 可能受 StrictMode 雙重呼叫變更影響的 Spy 斷言
grep -rn "toHaveBeenCalledTimes\|\.mock\.calls\.length" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null
```

---

## 完整摘要腳本

```bash
#!/bin/bash
echo "=============================="
echo "React 19 遷移稽核摘要"
echo "=============================="
echo ""
echo "已移除的 API (關鍵):"
echo "  ReactDOM.render:             $(grep -rn "ReactDOM\.render\s*(" src/ --include="*.js" --include="*.jsx" | wc -l | tr -d ' ') 次命中"
echo "  ReactDOM.hydrate:            $(grep -rn "ReactDOM\.hydrate\s*(" src/ --include="*.js" --include="*.jsx" | wc -l | tr -d ' ') 次命中"
echo "  unmountComponentAtNode:      $(grep -rn "unmountComponentAtNode" src/ --include="*.js" --include="*.jsx" | wc -l | tr -d ' ') 次命中"
echo "  findDOMNode:                 $(grep -rn "findDOMNode" src/ --include="*.js" --include="*.jsx" | wc -l | tr -d ' ') 次命中"
echo "  react-dom/test-utils:        $(grep -rn "from 'react-dom/test-utils'" src/ --include="*.js" --include="*.jsx" | wc -l | tr -d ' ') 次命中"
echo "  舊版 context:                $(grep -rn "contextTypes\|childContextTypes\|getChildContext" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l | tr -d ' ') 次命中"
echo "  字串 ref (String refs):      $(grep -rn "this\.refs\." src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l | tr -d ' ') 次命中"
echo ""
echo "棄用的 API:"
echo "  forwardRef:                  $(grep -rn "forwardRef" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l | tr -d ' ') 次命中"
echo "  defaultProps (函式元件):     $(grep -rn "\.defaultProps\s*=" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l | tr -d ' ') 次命中"
echo "  useRef() 未含引數:           $(grep -rn "useRef()" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l | tr -d ' ') 次命中"
echo ""
echo "測試檔案問題:"
echo "  react-dom/test-utils:        $(grep -rn "from 'react-dom/test-utils'" src/ --include="*.test.*" --include="*.spec.*" | wc -l | tr -d ' ') 次命中"
echo "  Simulate 使用:               $(grep -rn "Simulate\." src/ --include="*.test.*" | wc -l | tr -d ' ') 次命中"
```
