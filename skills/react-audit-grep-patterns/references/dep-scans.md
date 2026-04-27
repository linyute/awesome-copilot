# 依賴項目搜尋 - 適用於兩者稽核器

搜尋依賴項相容性與同級依賴項目 (peer dependency) 衝突。在 R18 和 R19 稽核期間執行。

---

## 目前版本

```bash
# 一次取得所有與 react 相關的套件版本
cat package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
deps = {**d.get('dependencies',{}), **d.get('devDependencies',{})}
keys = ['react', 'react-dom', 'react-router', 'react-router-dom',
        '@testing-library/react', '@testing-library/jest-dom',
        '@testing-library/user-event', '@apollo/client', 'graphql',
        '@emotion/react', '@emotion/styled', 'jest', 'enzyme',
        'react-redux', '@reduxjs/toolkit', 'prop-types']
for k in keys:
    if k in deps:
        print(f'{k}: {deps[k]}')
" 2>/dev/null
```

---

## 同級依賴項目衝突

```bash
# 所有同級依賴項目警告 (在遷移完成前必須為 0)
npm ls 2>&1 | grep -E "WARN|ERR|peer|invalid|unmet"

# 同級錯誤計數
npm ls 2>&1 | grep -E "WARN|ERR|peer|invalid|unmet" | wc -l

# 特定套件的同級依賴項目需求
npm info @testing-library/react peerDependencies 2>/dev/null
npm info @apollo/client peerDependencies 2>/dev/null
npm info @emotion/react peerDependencies 2>/dev/null
npm info react-router-dom peerDependencies 2>/dev/null
```

---

## Enzyme 偵測 (R18 阻礙因素)

```bash
# 在 package.json 中
cat package.json | python3 -c "
import sys, json
d = json.load(sys.stdin)
deps = {**d.get('dependencies',{}), **d.get('devDependencies',{})}
enzyme = {k: v for k, v in deps.items() if 'enzyme' in k.lower()}
if enzyme:
    print('BLOCKER - 找到 Enzyme:', enzyme)
else:
    print('查無 Enzyme - 正常')
" 2>/dev/null

# Enzyme 轉接器檔案
find . -name "enzyme-adapter*" -not -path "*/node_modules/*" 2>/dev/null
```

---

## React Router 版本檢查

```bash
ROUTER=$(node -e "console.log(require('./node_modules/react-router-dom/package.json').version)" 2>/dev/null)
echo "react-router-dom 版本: $ROUTER"

# 如果是 v5 - 標記以進行評估
if [[ $ROUTER == 5* ]]; then
  echo "警告: 找到 react-router v5 - 在升級前需要進行範圍評估"
  echo "執行 router 遷移範圍搜尋:"
  echo "  Routes: $(grep -rn "<Route\|<Switch\|<Redirect" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l) 次命中"
  echo "  useHistory: $(grep -rn "useHistory()" src/ --include="*.js" --include="*.jsx" | grep -v "\.test\." | wc -l) 次命中"
fi
```

---

## 鎖定檔案 (Lock File) 一致性

```bash
# 檢查鎖定檔案是否與 package.json 同步
npm ls --depth=0 2>&1 | head -20

# 檢查重複安裝的 react (可能導致 hooks 錯誤)
find node_modules -name "package.json" -path "*/react/package.json" 2>/dev/null \
  | grep -v "node_modules/node_modules" \
  | xargs grep '"version"' | sort -u
```
