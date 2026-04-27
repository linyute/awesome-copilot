# React 18.3.1 稽核 - 完整搜尋指令

請按此順序執行。每個章節都對應到 react18-auditor 中的一個階段。

---

## 階段 0 - 程式碼庫概況

```bash
# 原始碼檔案總數 (不含測試)
find src/ \( -name "*.js" -o -name "*.jsx" \) \
  | grep -v "\.test\.\|\.spec\.\|__tests__\|node_modules" \
  | wc -l

# 類別元件 (Class component) 計數
grep -rl "extends React\.Component\|extends Component\|extends PureComponent" \
  src/ --include="*.js" --include="*.jsx" \
  | grep -v "\.test\." | wc -l

# 函式元件 (Function component) 概估計數
grep -rl "const [A-Z][a-zA-Z]* = \|function [A-Z][a-zA-Z]*(" \
  src/ --include="*.js" --include="*.jsx" \
  | grep -v "\.test\." | wc -l

# 目前 React 版本
node -e "console.log(require('./node_modules/react/package.json').version)" 2>/dev/null

# 是否正在使用 StrictMode？ (會影響已看到的生命週期警告數量)
grep -rn "StrictMode\|React\.StrictMode" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."
```

---

## 階段 1 - 不安全的生命週期方法

```bash
# componentWillMount (不含 UNSAFE_ 前綴)
grep -rn "componentWillMount\b" \
  src/ --include="*.js" --include="*.jsx" \
  | grep -v "UNSAFE_componentWillMount\|\.test\."

# componentWillReceiveProps (不含 UNSAFE_ 前綴)
grep -rn "componentWillReceiveProps\b" \
  src/ --include="*.js" --include="*.jsx" \
  | grep -v "UNSAFE_componentWillReceiveProps\|\.test\."

# componentWillUpdate (不含 UNSAFE_ 前綴)
grep -rn "componentWillUpdate\b" \
  src/ --include="*.js" --include="*.jsx" \
  | grep -v "UNSAFE_componentWillUpdate\|\.test\."

# 是否已透過 UNSAFE_ 前綴進行部分遷移？ (檢查團隊是否已完成部分工作)
grep -rn "UNSAFE_component" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# 快速計數摘要:
echo "=== 生命周期問題摘要 ==="
echo "componentWillMount: $(grep -rn "componentWillMount\b" src/ --include="*.js" --include="*.jsx" | grep -v "UNSAFE_\|\.test\." | wc -l)"
echo "componentWillReceiveProps: $(grep -rn "componentWillReceiveProps\b" src/ --include="*.js" --include="*.jsx" | grep -v "UNSAFE_\|\.test\." | wc -l)"
echo "componentWillUpdate: $(grep -rn "componentWillUpdate\b" src/ --include="*.js" --include="*.jsx" | grep -v "UNSAFE_\|\.test\." | wc -l)"
```

---

## 階段 2 - 自動批次處理 (Automatic Batching) 弱點

```bash
# 非同步類別方法 (主要風險區域)
grep -rn "^\s*async [a-zA-Z]" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# 箭頭函式非同步方法
grep -rn "=\s*async\s*(" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# .then() 回呼函式中的 setState
grep -rn "\.then\s*(" \
  src/ --include="*.js" --include="*.jsx" -A 3 \
  | grep "setState" | grep -v "\.test\."

# .catch() 回呼函式中的 setState
grep -rn "\.catch\s*(" \
  src/ --include="*.js" --include="*.jsx" -A 3 \
  | grep "setState" | grep -v "\.test\."

# setTimeout 中的 setState
grep -rn "setTimeout" \
  src/ --include="*.js" --include="*.jsx" -A 5 \
  | grep "setState" | grep -v "\.test\."

# await 之後的 this.state 讀取 (最危險的模式)
grep -rn "this\.state\." \
  src/ --include="*.js" --include="*.jsx" -B 3 \
  | grep "await" | grep -v "\.test\."

# 帶有 setState 的 document/window 事件處理常式
grep -rn "addEventListener" \
  src/ --include="*.js" --include="*.jsx" -A 5 \
  | grep "setState" | grep -v "\.test\."
```

---

## 階段 3 - 舊版 Context API

```bash
# 提供者 (Provider) 端
grep -rn "childContextTypes\s*=" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

grep -rn "getChildContext\s*(" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# 消費者 (Consumer) 端
grep -rn "contextTypes\s*=" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# this.context 的使用 (可能表示舊版或新版 - 請逐一確認命中結果)
grep -rn "this\.context\." \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# 不同的舊版 context 計數 (透過計算 childContextTypes 區塊)
grep -rn "childContextTypes" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l
```

---

## 階段 4 - 字串 Ref (String Refs)

```bash
# JSX 中的字串 ref 賦值
grep -rn 'ref="[^"]*"' \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# 另一種引號風格
grep -rn "ref='[^']*'" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# this.refs 存取器使用
grep -rn "this\.refs\." \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."
```

---

## 階段 5 - findDOMNode

```bash
grep -rn "findDOMNode\|ReactDOM\.findDOMNode" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."
```

---

## 階段 6 - 根節點 API (ReactDOM.render)

```bash
grep -rn "ReactDOM\.render\s*(" \
  src/ --include="*.js" --include="*.jsx"

grep -rn "ReactDOM\.hydrate\s*(" \
  src/ --include="*.js" --include="*.jsx"

grep -rn "unmountComponentAtNode" \
  src/ --include="*.js" --include="*.jsx"
```

---

## 階段 7 - 事件委派 (Event Delegation) (React 16 延續項目)

```bash
# document 層級的事件監聽器 (React 17 委派變更後可能會錯過 React 事件)
grep -rn "document\.addEventListener\|document\.removeEventListener" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."

# window 事件監聽器
grep -rn "window\.addEventListener" \
  src/ --include="*.js" --include="*.jsx" | grep -v "\.test\."
```

---

## 階段 8 - Enzyme 偵測 (硬性阻礙因素)

```bash
# package.json 中的 Enzyme
cat package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
deps = {**d.get('dependencies',{}), **d.get('devDependencies',{})}
enzyme_pkgs = [k for k in deps if 'enzyme' in k.lower()]
print('找到 Enzyme 套件:', enzyme_pkgs if enzyme_pkgs else '無')
"

# 測試檔案中的 Enzyme 匯入
grep -rn "from 'enzyme'\|require.*enzyme" \
  src/ --include="*.test.*" --include="*.spec.*" 2>/dev/null | wc -l
```

---

## 完整摘要腳本

在進行詳細搜尋前，執行此腳本以取得快速概況：

```bash
#!/bin/bash
echo "=============================="
echo "React 18 遷移稽核摘要"
echo "=============================="
echo ""
echo "生命週期方法 (LIFECYCLE METHODS):"
echo "  componentWillMount:          $(grep -rn "componentWillMount\b" src/ --include="*.js" --include="*.jsx" | grep -v "UNSAFE_\|\.test\." | wc -l | tr -d ' ') 次命中"
echo "  componentWillReceiveProps:   $(grep -rn "componentWillReceiveProps\b" src/ --include="*.js" --include="*.jsx" | grep -v "UNSAFE_\|\.test\." | wc -l | tr -d ' ') 次命中"
echo "  componentWillUpdate:         $(grep -rn "componentWillUpdate\b" src/ --include="*.js" --include="*.jsx" | grep -v "UNSAFE_\|\.test\." | wc -l | tr -d ' ') 次命中"
echo ""
echo "舊版 API (LEGACY APIS):"
echo "  舊版 context (提供者):       $(grep -rn "childContextTypes" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l | tr -d ' ') 次命中"
echo "  字串 ref (this.refs):        $(grep -rn "this\.refs\." src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l | tr -d ' ') 次命中"
echo "  findDOMNode:                 $(grep -rn "findDOMNode" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l | tr -d ' ') 次命中"
echo "  ReactDOM.render:             $(grep -rn "ReactDOM\.render\s*(" src/ --include="*.js" --include="*.jsx" | wc -l | tr -d ' ') 次命中"
echo ""
echo "ENZYME (阻礙因素):"
echo "  Enzyme 測試檔案:             $(grep -rl "from 'enzyme'" src/ --include="*.test.*" 2>/dev/null | wc -l | tr -d ' ') 個檔案"
echo ""
echo "非同步批次處理風險 (ASYNC BATCHING RISK):"
echo "  非同步類別方法:              $(grep -rn "^\s*async [a-zA-Z]" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l | tr -d ' ') 次命中"
```
