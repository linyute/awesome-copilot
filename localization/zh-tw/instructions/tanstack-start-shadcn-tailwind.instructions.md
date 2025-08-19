---
description: 'TanStack Start 應用程式建構指引'
applyTo: '**/*.ts, **/*.tsx, **/*.js, **/*.jsx, **/*.css, **/*.scss, **/*.json'
---

# TanStack Start 搭配 Shadcn/ui 開發指南

你是專精於 TanStack Start 應用程式與現代 React 模式的 TypeScript 開發者。

## 技術堆疊
- TypeScript（嚴格模式）
- TanStack Start（路由與 SSR）
- Shadcn/ui（UI 元件）
- Tailwind CSS（樣式）
- Zod（驗證）
- TanStack Query（用戶端狀態）

## 程式碼風格規則

- 絕不使用 `any` 型別，務必使用正確的 TypeScript 型別
- 優先使用函式元件而非類別元件
- 所有外部資料皆以 Zod schema 驗證
- 所有路由皆需包含錯誤與等待邊界
- 遵循無障礙最佳實務，使用 ARIA 屬性

## 元件模式

請使用函式元件並搭配正確的 TypeScript 介面：

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

Route Loader 用於：
- 頁面初始渲染所需資料
- SSR 需求
- SEO 關鍵資料

React Query 用於：
- 頻繁更新的資料
- 選用/次要資料
- 用戶端操作與樂觀更新

```typescript
// Route Loader
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

所有外部資料皆需驗證。請在 `src/lib/schemas.ts` 定義 schema：

```typescript
export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user']).default('user'),
})

export type User = z.infer<typeof userSchema>

// 安全解析
const result = userSchema.safeParse(data)
if (!result.success) {
  console.error('驗證失敗:', result.error.format())
  return null
}
```

## 路由

路由結構請放在 `src/routes/`，採用檔案式路由。所有路由皆需包含錯誤與等待邊界：

```typescript
export const Route = createFileRoute('/users/$id')({
  loader: async ({ params }) => {
    const user = await fetchUser(params.id);
    return { user: userSchema.parse(user) };
  },
  component: UserDetail,
  errorBoundary: ({ error }) => (
    <div className="text-red-600 p-4">錯誤：{error.message}</div>
  ),
  pendingBoundary: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
});
```

## UI 元件

優先使用 Shadcn/ui 元件而非自訂元件：

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>使用者詳情</CardTitle>
  </CardHeader>
  <CardContent>
    <Button onClick={handleSave}>儲存</Button>
  </CardContent>
</Card>
```

Tailwind 用於響應式設計：

```typescript
<div className="flex flex-col gap-4 p-6 md:flex-row md:gap-6">
  <Button className="w-full md:w-auto">操作</Button>
</div>
```

## 無障礙設計

優先使用語意化 HTML，僅在無語意等價時加 ARIA：

```typescript
// ✅ 良好：語意化 HTML 並最小化 ARIA
<button onClick={toggleMenu}>
  <MenuIcon aria-hidden="true" />
  <span className="sr-only">切換選單</span>
</button>

// ✅ 良好：僅在需要時加 ARIA（動態狀態）
<button
  aria-expanded={isOpen}
  aria-controls="menu"
  onClick={toggleMenu}
>
  選單
</button>

// ✅ 良好：語意化表單元件
<label htmlFor="email">電子郵件地址</label>
<input id="email" type="email" />
{errors.email && (
  <p role="alert">{errors.email}</p>
)}
```

## 檔案組織

```
src/
├── components/ui/    # Shadcn/ui 元件
├── lib/schemas.ts    # Zod schema
├── routes/           # 檔案式路由
└── routes/api/       # 伺服器路由 (.ts)
```

## 匯入標準

所有內部匯入皆用 `@/` 別名：

```typescript
// ✅ 良好
import { Button } from '@/components/ui/button'
import { userSchema } from '@/lib/schemas'

// ❌  不佳
import { Button } from '../components/ui/button'
```

## 新增元件

需要時安裝 Shadcn 元件：

```bash
npx shadcn@latest add button card input dialog
```

## 常見模式

- 所有外部資料皆用 Zod 驗證
- 初始資料用 route loader，更新用 React Query
- 所有路由皆加錯誤/等待邊界
- 優先使用 Shadcn 元件
- 一致使用 `@/` 匯入
- 遵循無障礙最佳實務
