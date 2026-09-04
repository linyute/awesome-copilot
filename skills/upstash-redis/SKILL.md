---
name: 'upstash-redis'
description: '在無伺服器 (serverless) 和邊緣 (edge) 執行階段透過 @upstash/redis 經由 HTTP 使用 Redis，並使用 @upstash/ratelimit 加入速率限制。適用於使用者提及 Upstash Redis、需要在 Next.js 路由處理常式或中介軟體、Vercel、Cloudflare Workers、Deno 或 Bun 中使用無需 TCP 連線集區的 Redis，或是想要具有 TTL 的旁路快取 (cache-aside)、工作階段儲存 (session store)、計數器，或使用固定視窗、滑動視窗或權杖桶的 429 速率限制器。請勿用於自我託管或 TCP Redis 用戶端 (ioredis, node-redis)、Redis 叢集管理或向量相似度搜尋。'
license: 'MIT'
compatibility: '@upstash/redis 1.x, @upstash/ratelimit 2.x, Node.js 18+ or any runtime with global fetch'
metadata:
  author: 'Upstash'
---

# Upstash Redis 技能

此技能涵蓋了無伺服器應用程式最常需要 Redis 的三件事：快取、工作階段和速率限制。用戶端透過 HTTP 與 Redis 通訊，因此它可以在長連線 TCP 無法運作的地方運作（邊緣中介軟體、短生命週期的函式）。請依序遵循各步驟；每個步驟都以檢查點結尾。

## 需求與限制

- Upstash Redis 資料庫（託管服務；具免費層的依用量計費模式）。憑證是來自資料庫頁面的 REST URL 和權杖 (token)。
- 環境變數 `UPSTASH_REDIS_REST_URL` 與 `UPSTASH_REDIS_REST_TOKEN`。
- 每個命令都是一個 HTTP 請求。當每個請求發出多個命令時，請使用 `pipeline()` 或 `MGET`/`MSET` 進行批次處理；在實際環境中避免使用 `KEYS *`。
- 數值會自動序列化（物件、陣列、數字皆可往返轉換）。不要在 `set` 之前使用 `JSON.stringify`，或在 `get` 之後使用 `parseInt`。

## 步驟 1 — 安裝並為每個模組建立一個用戶端

```bash
npm install @upstash/redis @upstash/ratelimit
```

```ts
// lib/redis.ts
import { Redis } from "@upstash/redis";

// 讀取 UPSTASH_REDIS_REST_URL 與 UPSTASH_REDIS_REST_TOKEN
export const redis = Redis.fromEnv();
```

在模組範圍建立用戶端，而不是在請求處理常式內部，這樣暫時性快取和管線才能跨呼叫重複使用。

> **檢查點**：`await redis.ping()` 傳回 `"PONG"`。

## 步驟 2 — 具備 TTL 的旁路快取 (Cache-aside)

```ts
import { redis } from "@/lib/redis";

type User = { id: string; name: string; plan: "free" | "pro" };

export async function getUser(userId: string): Promise<User | null> {
  const key = `user:${userId}`;
  const cached = await redis.get<User>(key);
  if (cached) return cached;

  const user = await db.users.findById(userId); // 你的資料來源
  if (user) await redis.set(key, user, { ex: 3600 }); // 1 小時 TTL
  return user;
}

export async function updateUser(userId: string, patch: Partial<User>) {
  const user = await db.users.update(userId, patch);
  await redis.set(`user:${userId}`, user, { ex: 3600 }); // 寫穿 (write-through)
  return user;
}

export async function deleteUser(userId: string) {
  await db.users.delete(userId);
  await redis.del(`user:${userId}`); // 使失效
}
```

一律在快取項目上設定 TTL；為索引鍵設定命名空間（`user:123`、`session:abc`）。

> **檢查點**：第二次呼叫 `getUser` 時未存取資料庫即傳回，且 `await redis.ttl("user:123")` 為正數。

## 步驟 3 — 具備滑動到期機制的工作階段

```ts
import { redis } from "@/lib/redis";

const SESSION_TTL = 60 * 60 * 24; // 24 小時

export async function createSession(userId: string, data: Record<string, unknown>) {
  const sessionId = crypto.randomUUID();
  await redis.set(`session:${sessionId}`, { userId, ...data, createdAt: Date.now() }, { ex: SESSION_TTL });
  return sessionId;
}

export async function getSession<T = Record<string, unknown>>(sessionId: string) {
  const session = await redis.get<T>(`session:${sessionId}`);
  if (session) await redis.expire(`session:${sessionId}`, SESSION_TTL); // 滑動延長
  return session;
}

export async function destroySession(sessionId: string) {
  await redis.del(`session:${sessionId}`);
}
```

將工作階段識別碼儲存在 `HttpOnly; Secure; SameSite` cookie 中；切勿將 Redis 權杖放在用戶端程式碼中。

> **檢查點**：在 `createSession` 之後呼叫 `getSession` 會傳回帶有 `userId` 的物件；在 `destroySession` 之後則傳回 `null`。

## 步驟 4 — 對路由處理常式進行速率限制

```ts
// app/api/search/route.ts (Next.js App Router；對任何 fetch 處理常式使用相同模式)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 每 10 秒 10 個請求
  prefix: "ratelimit:search", // 隔離每個限制器的索引鍵
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "Retry-After": String(Math.max(0, Math.ceil((reset - Date.now()) / 1000))),
      },
    });
  }

  // 處理請求
  return Response.json({ ok: true });
}
```

- 識別碼：經過驗證時使用使用者識別碼或 API 金鑰；未驗證時退回使用 IP。
- 演算法：`Ratelimit.fixedWindow(n, "1 m")`（成本最低）、`slidingWindow`（邊界平滑，預設選擇）、`tokenBucket(refill, "10 s", max)`（允許突發量）。視窗接受 `ms`、`s`、`m`、`h`、`d`。
- 層級：為每個層級建立一個具有不同 `prefix` 值的 `Ratelimit`。
- 具有 `analytics: true` 的邊緣中介軟體 / Cloudflare Workers：結果具有 `pending` promise；將其傳遞給 `context.waitUntil(pending)`，使背景工作在執行階段結束前完成。
- `reset` 是以毫秒為單位的 Unix 時間戳記。

> **檢查點**：10 秒內的第 11 個請求傳回 429 並帶有 `Retry-After` 標頭；在視窗時間過後再次成功。

## 常見陷阱

- **在處理常式內部建立用戶端**：限制器的記憶體內 `ephemeralCache` 只有在執行個體的生命週期長於請求時才有幫助。
- **手動處理 JSON**：`redis.set("k", JSON.stringify(v))` 之後 `redis.get` 會傳回已剖析的物件；重複剖析會擲回例外。
- **快取索引鍵上沒有 TTL**：記憶體會持續增加直到逐出；務必傳遞 `{ ex }`。
- **盲目信任 `x-forwarded-for`**：在 Proxy 背後時，採用第一躍點 (first hop) 或使用平台的 IP 協助程式。
- **在具有分析功能或多區域限制器的邊緣執行階段上遺漏 `pending`**。

## 何時「不」該使用此技能

- 已經建立 TCP Redis 連線的長時間執行伺服器：保留 ioredis/node-redis。
- 向量搜尋或 RAG：改用向量資料庫技能。
- 次毫秒級、處理序內的快取：使用記憶體內 LRU。

## 參考資料

- https://upstash.com/docs/redis/sdks/ts/overview
- https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
- https://github.com/upstash/redis-js
- https://github.com/upstash/ratelimit-js
