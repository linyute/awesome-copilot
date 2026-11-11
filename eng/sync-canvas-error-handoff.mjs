#!/usr/bin/env node

// 保持存放庫本地看板延伸模組自給自足，並具有單一標準實作。
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const template = (await readFile(path.join(root, "eng", "canvas-error-handoff", "runtime.mjs"), "utf8")).replace(/\r\n/g, "\n");
const check = process.argv.includes("--check");
const defaults = "[data-agent-error]";
let count = 0;
let stale = false;
for (const parent of [path.join(".github", "extensions")]) {
    for (const entry of await readdir(path.join(root, parent), { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const directory = path.join(root, parent, entry.name);
        let files = [];
        async function walk(dir) {
            for (const item of await readdir(dir, { withFileTypes: true })) {
                if (["node_modules", ".git"].includes(item.name)) continue;
                const file = path.join(dir, item.name);
                if (item.isDirectory()) await walk(file);
                else if (item.name.endsWith(".mjs") && !item.name.includes(".test.") && item.name !== "error-handoff.mjs") files.push(file);
            }
        }
        await walk(directory);
        const sources = await Promise.all(files.map(file => readFile(file, "utf8")));
        if (!sources.some(source => /\bcreateCanvas\s*[(,}]/.test(source))) continue;
        const source = `${parent.split(path.sep).join("/")}/${entry.name}`;
        const selectors = defaults;
        const generated = `// 由 node eng/sync-canvas-error-handoff.mjs 產生；請勿編輯。\n` +
            template + `\nconst runtime = createErrorHandoffRuntime({}, ${JSON.stringify(source)}, ${JSON.stringify(selectors)});\n` +
            `export const { configure: configureErrorHandoff, joinSession, createCanvas, createServer } = runtime;\nexport default runtime.http;\n`;
        const target = path.join(directory, "error-handoff.mjs");
        let previous;
        try { previous = await readFile(target, "utf8"); }
        catch (error) { if (error.code !== "ENOENT") throw error; }
        if (previous !== generated) {
            if (check) { console.error(`過期的 canvas 錯誤協助程式：${source}`); stale = true; }
            else await writeFile(target, generated);
        }
        count++;
    }
}
if (stale) process.exitCode = 1;
else console.log(`已${check ? "檢查" : "同步"} ${count} 個 canvas 的錯誤交接協助程式。`);
