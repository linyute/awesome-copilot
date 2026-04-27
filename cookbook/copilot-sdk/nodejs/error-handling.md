# 錯誤處理模式

在您的 Copilot SDK 應用程式中優雅地處理錯誤。

> **可執行的範例：** [recipe/error-handling.ts](recipe/error-handling.ts)
>
> ```bash
> cd recipe && npm install
> npx tsx error-handling.ts
> # 或執行：npm run error-handling
> ```

## 範例情境

您需要處理各種錯誤狀況，例如連線失敗、逾時和無效的回應。

## 基礎 try-catch

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();

try {
    await client.start();
    const session = await client.createSession({
        onPermissionRequest: approveAll,
        model: "gpt-5",
    });

    const response = await session.sendAndWait({ prompt: "哈囉！" });
    console.log(response?.data.content);

    await session.destroy();
} catch (error) {
    console.error("錯誤：", error.message);
} finally {
    await client.stop();
}
```

## 處理特定錯誤類型

```typescript
try {
    await client.start();
} catch (error) {
    if (error.message.includes("ENOENT")) {
        console.error("找不到 Copilot CLI。請先安裝它。");
    } else if (error.message.includes("ECONNREFUSED")) {
        console.error("無法連線到 Copilot CLI 伺服器。");
    } else {
        console.error("未預期的錯誤：", error.message);
    }
}
```

## 逾時處理

```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
});

try {
    // sendAndWait 具有逾時設定 (以毫秒為單位)
    const response = await session.sendAndWait(
        { prompt: "複雜的問題..." },
        30000 // 30 秒逾時
    );

    if (response) {
        console.log(response.data.content);
    } else {
        console.log("未收到回應");
    }
} catch (error) {
    if (error.message.includes("timeout")) {
        console.error("請求逾時");
    }
}
```

## 中止請求

```typescript
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
});

// 開始一個請求
session.send({ prompt: "寫一個很長的故事..." });

// 在某些條件後中止它
setTimeout(async () => {
    await session.abort();
    console.log("請求已中止");
}, 5000);
```

## 優雅關閉

```typescript
process.on("SIGINT", async () => {
    console.log("正在關閉...");

    const errors = await client.stop();
    if (errors.length > 0) {
        console.error("清理錯誤：", errors);
    }

    process.exit(0);
});
```

## 強制停止

```typescript
// 如果 stop() 花費太長時間，則強制停止
const stopPromise = client.stop();
const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("逾時")), 5000));

try {
    await Promise.race([stopPromise, timeout]);
} catch {
    console.log("正在強制停止...");
    await client.forceStop();
}
```

## 最佳實務

1. **始終進行清理**：使用 try-finally 確保呼叫 `client.stop()`
2. **處理連線錯誤**：CLI 可能未安裝或未執行
3. **設定適當的逾時**：長期執行的請求應該設定逾時
4. **記錄錯誤**：擷取錯誤詳細資訊以供偵錯
