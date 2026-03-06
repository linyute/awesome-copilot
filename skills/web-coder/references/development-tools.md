# 開發人員工具參考 (Development Tools Reference)

網頁開發的工具與工作流程。

## 版本控制

### Git

分散式版本控制系統。

**基本指令**：
```bash
# 初始化儲存庫
git init

# 複製儲存庫
git clone https://github.com/user/repo.git

# 檢查狀態
git status

# 暫存變更
git add file.js
git add . # 所有檔案

# 提交 (Commit)
git commit -m "提交訊息"

# 推送至遠端
git push origin main

# 從遠端拉取
git pull origin main

# 分支
git branch feature-name
git checkout feature-name
git checkout -b feature-name # 建立並切換

# 合併
git checkout main
git merge feature-name

# 查看歷史記錄
git log
git log --oneline --graph
```

**最佳實踐**：
- 頻繁提交並撰寫具意義的訊息
- 針對新功能使用分支
- 先拉取再推送
- 在提交前審閱變更
- 使用 .gitignore 排除產生的檔案

### GitHub/GitLab/Bitbucket

具備協作功能的 Git 代管平台：
- 提取要求 (Pull requests) / 合併要求 (Merge requests)
- 程式碼審閱 (Code review)
- 議題追蹤 (Issue tracking)
- CI/CD 整合
- 專案管理

## 套件管理員 (Package Managers)

### npm (Node 套件管理員)

```bash
# 初始化專案
npm init
npm init -y # 跳過提示

# 安裝相依套件
npm install package-name
npm install -D package-name # 開發環境相依套件
npm install -g package-name # 全域安裝

# 更新套件
npm update
npm outdated

# 執行腳本 (Scripts)
npm run build
npm test
npm start

# 安全性稽核
npm audit
npm audit fix
```

**package.json**：
```json
{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "build": "webpack",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "webpack": "^5.75.0"
  }
}
```

### Yarn

npm 的快速替代方案：
```bash
yarn add package-name
yarn remove package-name
yarn upgrade
yarn build
```

### pnpm

高效的套件管理員（節省磁碟空間）：
```bash
pnpm install
pnpm add package-name
pnpm remove package-name
```

## 建構工具 (Build Tools)

### Webpack

模組封裝器 (Module bundler)：

```javascript
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ]
};
```

### Vite

快速的現代建構工具：

```bash
# 建立專案
npm create vite@latest my-app

# 開發伺服器
npm run dev

# 建構
npm run build
```

### Parcel

零配置的封裝器：
```bash
parcel index.html
parcel build index.html
```

## 任務執行器 (Task Runners)

### npm 腳本 (Scripts)

```json
{
  "scripts": {
    "dev": "webpack serve --mode development",
    "build": "webpack --mode production",
    "test": "jest",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

## 測試框架 (Testing Frameworks)

### Jest

JavaScript 測試框架：

```javascript
// sum.test.js
const sum = require('./sum');

describe('sum 函式', () => {
  test('1 + 2 應等於 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
  
  test('應能處理負數', () => {
    expect(sum(-1, -2)).toBe(-3);
  });
});
```

### Vitest

由 Vite 驅動的測試框架（相容於 Jest）：
```javascript
import { describe, test, expect } from 'vitest';

describe('數學', () => {
  test('加法', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Playwright

端到端 (E2E) 測試：
```javascript
import { test, expect } from '@playwright/test';

test('首頁應有標題', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});
```

## Linter 與格式化工具 (Formatters)

### ESLint

JavaScript Linter：

```javascript
// .eslintrc.js
module.exports = {
  extends: ['eslint:recommended'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error'
  }
};
```

### Prettier

程式碼格式化工具：

```json
// .prettierrc
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### Stylelint

CSS Linter：
```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "indentation": 2,
    "color-hex-length": "short"
  }
}
```

## IDE 與編輯器

### Visual Studio Code

**關鍵特性**：
- 智慧提示 (IntelliSense)
- 除錯 (Debugging)
- Git 整合
- 擴充功能市場
- 終端機整合

**熱門擴充功能**：
- ESLint
- Prettier
- Live Server
- GitLens
- Path Intellisense

### WebStorm

由 JetBrains 開發、功能齊全的網頁開發 IDE。

### Sublime Text

輕量且快速的文字編輯器。

### Vim/Neovim

基於終端機的編輯器（學習曲線較陡峭）。

## TypeScript

JavaScript 的具型別超集：

```typescript
// types.ts
interface User {
  id: number;
  name: string;
  email?: string; // 選填
}

function getUser(id: number): User {
  return { id, name: 'John' };
}

// 泛型 (Generics)
function identity<T>(arg: T): T {
  return arg;
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## 持續整合 (CI/CD)

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
```

### 其他 CI/CD 平台

- **GitLab CI**
- **CircleCI**
- **Travis CI**
- **Jenkins**

## 除錯 (Debugging)

### 瀏覽器開發人員工具

```javascript
// 除錯語句
debugger; // 暫停執行
console.log('值：', value);
console.error('錯誤：', error);
console.trace(); // 堆疊追蹤
```

### Node.js 除錯

```bash
# 內建除錯器
node inspect app.js

# Chrome 開發人員工具
node --inspect app.js
node --inspect-brk app.js # 在啟動時中斷
```

## 效能分析 (Performance Profiling)

### Chrome 開發人員工具效能面板

- 記錄 CPU 活動
- 分析火焰圖 (Flame charts)
- 識別瓶頸

### Lighthouse

```bash
# CLI
npm install -g lighthouse
lighthouse https://example.com

# 開發人員工具
開啟 Chrome 開發人員工具 > Lighthouse 分頁
```

## 監控

### 錯誤追蹤

- **Sentry**：錯誤監控
- **Rollbar**：即時錯誤追蹤
- **Bugsnag**：錯誤監控

### 分析

- **Google Analytics**
- **Plausible**：重視隱私
- **Matomo**：自我代管 (Self-hosted)

### RUM (即時使用者監控)

- **SpeedCurve**
- **New Relic**
- **Datadog**

## 開發人員工作流程

### 典型工作流程

1. **設定**：複製儲存庫，安裝相依套件
2. **開發**：撰寫程式碼，執行開發伺服器
3. **測試**：執行單元/整合測試
4. **Lint/格式化**：檢查程式碼品質
5. **提交**：Git 提交並推送
6. **CI/CD**：自動化測試與部署
7. **部署**：推送至生產環境

### 環境變數 (Environment Variables)

```bash
# .env
DATABASE_URL=postgres://localhost/db
API_KEY=secret-key-here
NODE_ENV=development
```

```javascript
// 在 Node.js 中存取
const dbUrl = process.env.DATABASE_URL;
```

## 術語表 (Glossary Terms)

**涵蓋的核心術語**：
- Bun
- 持續整合 (Continuous integration)
- Deno
- 開發人員工具 (Developer tools)
- 分支 (Fork)
- 模糊測試 (Fuzz testing)
- Git
- IDE
- Node.js
- 儲存庫 (Repo)
- Rsync
- SCM
- SDK
- 冒煙測試 (Smoke test)
- SVN
- TypeScript

## 額外資源

- [Git 文件](https://git-scm.com/doc)
- [npm 文件](https://docs.npmjs.com/)
- [Webpack 指南](https://webpack.js.org/guides/)
- [Jest 文件](https://jestjs.io/docs/getting-started)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/handbook/intro.html)
