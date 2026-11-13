---
description: '建構 TanStack Start 應用程式的指引'
applyTo: '**/src/**/*.ts, **/src/**/*.tsx, **/src/**/*.js, **/src/**/*.jsx, **/src/**/*.css, **/vite.config.ts, **/vite.config.js, **/rsbuild.config.ts, **/rsbuild.config.js'
---

# TanStack Start 搭配 Shadcn/ui 開發指南

您是一位專精於採用現代 React 模式的 TanStack Start 應用程式之 TypeScript 專家開發人員。

在使用 `@tanstack/react-start` 的專案中套用這些規則。在變更 API 或相依性前，請先閱讀已安裝的 Start、Router、Query 與 Tailwind 版本以及現有的建置設定。

## 框架設定

- 遵循專案現有受支援的建置整合。在 Vite 專案中，從 `@tanstack/react-start/plugin/vite` 匯入 `tanstackStart` 並將其置於 React Vite 外掛程式之前；請勿複製過時的設定或將遷移現有應用程式作為副作用。
- 讓路由整合產生 `routeTree.gen.ts`；請編輯路由原始碼檔案，而非產生的樹狀檔案。
- 透過路由器預設值或路由層級的 `errorComponent` 與 `pendingComponent` 選項設定錯誤與擱置 UI。
- 將 Tailwind 設定與其已安裝的主要版本相符：v4 使用 CSS 優先設定與適當的建置外掛程式；在明確遷移前，請保留 v3 應用程式的設定。

參考資料：[Start 建置設定](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch)、[路由選項](https://tanstack.com/router/latest/docs/api/router/RouteOptionsType)、[Tailwind 升級指南](https://tailwindcss.com/docs/upgrade-guide)。

## 技術堆疊
- TypeScript（嚴格模式）
- TanStack Start（路由與 SSR）
- Shadcn/ui（UI 元件）
- Tailwind CSS（樣式設計）
- Zod（驗證）
- TanStack Query（用戶端狀態）

## 程式碼風格規則

- 切勿使用 `any` 型別 - 務必使用適當的 TypeScript 型別
- 優先使用函式元件而非類別元件
- 務必使用 Zod 結構描述驗證外部資料
- 透過路由器預設值或路由覆寫提供錯誤與擱置 UI
- 遵循具備 ARIA 屬性的無障礙性最佳實務

## 元件模式

使用具備適當 TypeScript 介面的函式元件：

```typescript
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export default function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={cn(buttonVariants({ variant }))}>
      {children}
    </button>
  );
}
```

## 資料擷取

使用路由載入器（Route Loaders）於：
- 轉譯所需的初始頁面資料
- SSR 需求
- SEO 關鍵資料

使用 React Query 於：
- 頻繁更新的資料
- 選用／次要資料
- 搭配樂觀更新的用戶端突變（mutations）

```typescript
// 路由載入器
export const Route = createFileRoute('/users')({
  loader: async () => {
    const users = await fetchUsers()
    return { users: userListSchema.parse(users) }
  },
  component: UserList,
})

// React Query
const { data: stats } = useQuery({
  queryKey: ['user-stats', userId],
  queryFn: () => fetchUserStats(userId),
  refetchInterval: 30000,
});
```

## Zod 驗證

務必驗證外部資料。在 `src/lib/schemas.ts` 中定義結構描述：

```typescript
export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user']).default('user'),
})

export type User = z.infer<typeof userSchema>

// 安全剖析
const result = userSchema.safeParse(data)
if (!result.success) {
  console.error('Validation failed:', result.error.format())
  return null
}
```

## 路由

在 `src/routes/` 中以檔案為基礎的路由（file-based routing）結構化路由。當路由需要不同行為時，覆寫路由器的錯誤與擱置 UI：

```typescript
export const Route = createFileRoute('/users/$id')({
  loader: async ({ params }) => {
    const user = await fetchUser(params.id);
    return { user: userSchema.parse(user) };
  },
  component: UserDetail,
  errorComponent: ({ error }) => (
    <div className="text-red-600 p-4">Error: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
});
```

## UI 元件

務必優先使用 Shadcn/ui 元件，而非自訂元件：

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>User Details</CardTitle>
  </CardHeader>
  <CardContent>
    <Button onClick={handleSave}>Save</Button>
  </CardContent>
</Card>
```

使用 Tailwind 進行響應式設計的樣式設定：

```typescript
<div className="flex flex-col gap-4 p-6 md:flex-row md:gap-6">
  <Button className="w-full md:w-auto">Action</Button>
</div>
```

## 無障礙性

優先使用語意化 HTML。僅在沒有語意化對等項目時才加入 ARIA：

```typescript
// ✅ 良好：具備最少 ARIA 的語意化 HTML
<button onClick={toggleMenu}>
  <MenuIcon aria-hidden="true" />
  <span className="sr-only">Toggle Menu</span>
</button>

// ✅ 良好：僅在需要時使用 ARIA（針對動態狀態）
<button
  aria-expanded={isOpen}
  aria-controls="menu"
  onClick={toggleMenu}
>
  Menu
</button>

// ✅ 良好：語意化表單元素
<label htmlFor="email">Email Address</label>
<input id="email" type="email" />
{errors.email && (
  <p role="alert">{errors.email}</p>
)}
```

## 檔案組織

```
src/
├── components/ui/    # Shadcn/ui 元件
├── lib/schemas.ts    # Zod 結構描述
├── routes/          # 以檔案為基礎的路由
└── routes/api/      # 伺服器路由 (.ts)
```

## 匯入標準

使用專案設定的路徑別名進行內部匯入；以下範例假設已設定 `@/`：

```typescript
// ✅ 良好
import { Button } from '@/components/ui/button'
import { userSchema } from '@/lib/schemas'

// ❌ 不佳
import { Button } from '../components/ui/button'
```

## 新增元件

需要時安裝 Shadcn 元件：

```bash
npx shadcn@latest add button card input dialog
```

## 常見模式

- 務必使用 Zod 驗證外部資料
- 使用路由載入器取得初始資料，使用 React Query 進行更新
- 透過路由器預設值或路由覆寫提供錯誤／擱置 UI
- 優先使用 Shadcn 元件而非自訂 UI
- 一致地使用設定的路徑別名
- 遵循無障礙性最佳實務