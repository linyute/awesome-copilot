# 依據 Metadata 進行檔案分組

使用 Copilot 根據檔案的 Metadata，智慧地組織資料夾中的檔案。

> **可執行的範例：** [recipe/managing-local-files.ts](recipe/managing-local-files.ts)
>
> ```bash
> cd recipe && npm install
> npx tsx managing-local-files.ts
> # 或執行：npm run managing-local-files
> ```

## 範例情境

您有一個包含許多檔案的資料夾，並希望根據檔案類型、建立日期、大小或其他屬性等 Metadata 將它們組織到子資料夾中。Copilot 可以分析這些檔案並建議或執行分組策略。

## 範例程式碼

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";
import * as os from "node:os";
import * as path from "node:path";

// 建立並啟動用戶端
const client = new CopilotClient();
await client.start();

// 建立工作階段
const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: "gpt-5",
});

// 事件處理常式
session.on((event) => {
    switch (event.type) {
        case "assistant.message":
            console.log(`\nCopilot: ${event.data.content}`);
            break;
        case "tool.execution_start":
            console.log(`  → 執行中: ${event.data.toolName} ${event.data.toolCallId}`);
            break;
        case "tool.execution_complete":
            console.log(`  ✓ 已完成: ${event.data.toolCallId}`);
            break;
    }
});

// 要求 Copilot 組織檔案
const targetFolder = path.join(os.homedir(), "Downloads");

await session.sendAndWait({
    prompt: `
分析 "${targetFolder}" 中的檔案，並將它們組織到子資料夾中。

1. 首先，列出所有檔案及其 Metadata
2. 預覽依檔案副檔名進行分組
3. 建立適當的子資料夾 (例如 "images", "documents", "videos")
4. 將每個檔案移動到其適當的子資料夾中

在移動任何檔案之前，請先確認。
`,
});

await session.destroy();
await client.stop();
```

## 分組策略

### 依檔案副檔名

```typescript
// 分組檔案如下：
// images/   -> .jpg, .png, .gif
// documents/ -> .pdf, .docx, .txt
// videos/   -> .mp4, .avi, .mov
```

### 依建立日期

```typescript
// 分組檔案如下：
// 2024-01/ -> 建立於 2024 年 1 月的檔案
// 2024-02/ -> 建立於 2024 年 2 月的檔案
```

### 依檔案大小

```typescript
// 分組檔案如下：
// tiny-under-1kb/
// small-under-1mb/
// medium-under-100mb/
// large-over-100mb/
```

## 測試執行模式

為了安全起見，您可以要求 Copilot 僅預覽更改：

```typescript
await session.sendAndWait({
    prompt: `
分析 "${targetFolder}" 中的檔案，並向我展示您將如何
依檔案類型組織它們。請勿移動任何檔案 — 僅向我展示計劃。
`,
});
```

## 使用 AI 分析進行自訂分組

讓 Copilot 根據檔案內容決定最佳分組：

```typescript
await session.sendAndWait({
    prompt: `
檢視 "${targetFolder}" 中的檔案並建議一個邏輯組織方式。
考慮：
- 檔案名稱及其可能包含的內容
- 檔案類型及其典型用途
- 可能指示專案或事件的日期模式

提出具有描述性且實用的資料夾名稱。
`,
});
```

## 安全考量

1. **移動前確認**：要求 Copilot 在執行移動前進行確認
2. **處理重複檔案**：考慮如果存在同名檔案會發生什麼情況
3. **保留原始檔案**：對於重要檔案，考慮使用複製而非移動
