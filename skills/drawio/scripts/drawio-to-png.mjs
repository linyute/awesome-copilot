/**
 * drawio-to-png.mjs - 將 .drawio 檔案轉換為 PNG，並確保算繪準確。
 *
 * 算繪優先順序：
 *   1. draw.io CLI (如果已安裝) — 像素級完美，速度最快
 *   2. 無頭瀏覽器中的官方 draw.io 檢視器 JS — 像素級完美，需要網路
 *
 * 用法：node drawio-to-png.mjs <input.drawio> [output.png]
 *       node drawio-to-png.mjs --dir <directory>   (轉換目錄中所有的 .drawio 檔案)
 *       node drawio-to-png.mjs --renderer=cli|viewer|auto <input.drawio> [output.png]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, basename, dirname, resolve } from "path";
import { spawnSync } from "child_process";
import { inflateRawSync } from "zlib";
import puppeteer from "puppeteer-core";

// --- 建立使用官方 draw.io 檢視器進行算繪的 HTML ---
function buildViewerHtml(rawFileContent) {
  // 逸出字元以嵌入到 JS 範本字串中
  const escaped = rawFileContent
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");

  // 官方 draw.io 檢視器 (viewer-static.min.js) 包含完整的 mxGraph
  // 算繪引擎 — 它處理正交邊緣路由、所有圖形類型、
  // 容器配置以及壓縮/未壓縮的圖表格式。
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; }
    body { background: white; }
  </style>
</head>
<body>
  <div id="diagram-host"></div>
  <script>
    // 準備圖表 XML 並設置檢視器目標 div
    (function() {
      var raw = \`${escaped}\`;

      // 如果需要，將原始 mxGraphModel 包裝在 mxfile 中 (檢視器預期為 mxfile 格式)
      var xmlStr = raw.trim();
      if (xmlStr.startsWith('<mxGraphModel')) {
        xmlStr = '<mxfile><diagram name="Page-1">' + xmlStr + '</diagram></mxfile>';
      } else if (!xmlStr.startsWith('<mxfile')) {
        // 假設它已經是 mxfile 或 diagram 元素
        if (xmlStr.startsWith('<diagram')) {
          xmlStr = '<mxfile>' + xmlStr + '</mxfile>';
        }
      }

      var config = {
        xml: xmlStr,
        highlight: "none",
        nav: false,
        resize: true,
        toolbar: null,
        "toolbar-nohide": true,
        edit: null,
        lightbox: false,
        "auto-fit": true,
        "check-visible-state": false
      };

      var div = document.createElement('div');
      div.className = 'mxgraph';
      div.setAttribute('data-mxgraph', JSON.stringify(config));
      document.getElementById('diagram-host').appendChild(div);
    })();

    // 輪詢直到檢視器算繪圖表 (檢視器腳本另行載入)
    window.__pollStarted = false;
    window.__startPoll = function() {
      if (window.__pollStarted) return;
      window.__pollStarted = true;
      // 明確觸發檢視器處理
      if (typeof GraphViewer !== 'undefined' && GraphViewer.processElements) {
        GraphViewer.processElements();
      }
      (function poll() {
        // 檢視器將 SVG 直接放置在 .mxgraph div 中
        var mxDiv = document.querySelector('.mxgraph');
        if (mxDiv) {
          var svg = mxDiv.querySelector('svg');
          if (svg) {
            var rect = mxDiv.getBoundingClientRect();
            if (rect.width > 10 && rect.height > 10) {
              window.__renderComplete = true;
              window.__renderWidth = rect.width;
              window.__renderHeight = rect.height;
              return;
            }
          }
        }
        setTimeout(poll, 150);
      })();
    };
  </script>
</body>
</html>`;
}

// --- 從 .drawio 輸入中提取 mxGraph XML (支援 mxGraphModel 和 mxfile) ---
function extractMxGraphModelXml(inputXml) {
  const trimmed = inputXml.trim();

  if (trimmed.startsWith("<mxGraphModel")) {
    return trimmed;
  }

  const diagramMatch = trimmed.match(/<diagram\b[^>]*>([\s\S]*?)<\/diagram>/i);
  if (!diagramMatch) {
    throw new Error("不支援的 .drawio 格式：缺少 <mxGraphModel> 或 <diagram> 內容");
  }

  const diagramContent = diagramMatch[1].trim();

  if (diagramContent.startsWith("<mxGraphModel")) {
    return diagramContent;
  }

  // draw.io 壓縮圖表為 base64(deflateRaw(encodeURIComponent(xml)))
  try {
    const inflated = inflateRawSync(Buffer.from(diagramContent, "base64")).toString("utf-8");
    const decoded = decodeURIComponent(inflated);
    if (!decoded.trim().startsWith("<mxGraphModel")) {
      throw new Error("解碼後的內容不是 mxGraphModel XML");
    }
    return decoded;
  } catch (err) {
    throw new Error(`無法解碼壓縮的 <diagram> 內容：${err.message}`);
  }
}

function resolveRenderer(rawArgs) {
  let renderer = "auto";
  const args = [];

  for (const arg of rawArgs) {
    if (arg.startsWith("--renderer=")) {
      renderer = arg.substring("--renderer=".length).trim().toLowerCase();
      continue;
    }
    args.push(arg);
  }

  if (!["auto", "cli", "viewer"].includes(renderer)) {
    throw new Error(`無效的算繪器 '${renderer}'。請使用 auto、cli 或 viewer。`);
  }

  return { renderer, args };
}

function findDrawioCliPath() {
  const envPath = process.env.DRAWIO_PATH;
  if (envPath) {
    try {
      if (statSync(envPath).isFile()) return envPath;
    } catch { /* 忽略 */ }
  }

  const candidates = [
    "C:\\Program Files\\draw.io\\draw.io.exe",
    "C:\\Program Files (x86)\\draw.io\\draw.io.exe",
    "/Applications/draw.io.app/Contents/MacOS/draw.io",
    "/usr/bin/drawio",
    "/usr/local/bin/drawio",
  ];

  for (const p of candidates) {
    try {
      if (statSync(p).isFile()) return p;
    } catch { /* 忽略 */ }
  }

  const locator = process.platform === "win32" ? "where" : "which";
  const names = process.platform === "win32" ? ["drawio", "draw.io"] : ["drawio"];

  for (const name of names) {
    const probe = spawnSync(locator, [name], { encoding: "utf-8" });
    if (probe.status === 0 && probe.stdout) {
      const first = probe.stdout.split(/\r?\n/).map(line => line.trim()).find(Boolean);
      if (first) return first;
    }
  }

  return null;
}

function exportWithDrawioCli(drawioPath, input, output) {
  const args = ["-x", "-f", "png", "-e", "-b", "10", "-o", output, input];
  const result = spawnSync(drawioPath, args, { encoding: "utf-8" });
  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();
    throw new Error(stderr || stdout || `draw.io CLI 失敗，結束代碼為 ${result.status}`);
  }
}

// --- 主程式 ---
async function main() {
  const parsed = resolveRenderer(process.argv.slice(2));
  const renderer = parsed.renderer;
  const args = parsed.args;

  let files = [];
  if (args[0] === "--dir") {
    const dir = resolve(args[1] || ".");
    files = readdirSync(dir)
      .filter(f => f.endsWith(".drawio"))
      .map(f => ({
        input: join(dir, f),
        output: join(dir, f.replace(/\.drawio$/, ".drawio.png"))
      }));
  } else if (args[0]) {
    const input = resolve(args[0]);
    const output = args[1] || input.replace(/\.drawio$/, ".drawio.png");
    files = [{ input, output }];
  } else {
    console.error("用法：node drawio-to-png.mjs <input.drawio> [output.png]");
    console.error("      node drawio-to-png.mjs --dir <directory>");
    console.error("      node drawio-to-png.mjs --renderer=cli|auto|custom <input.drawio> [output.png]");
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("找不到 .drawio 檔案。");
    return;
  }

  const drawioCliPath = findDrawioCliPath();

  // --- 路徑 1：draw.io CLI (最佳保真度，不需要網路) ---
  if (renderer === "cli" || (renderer === "auto" && drawioCliPath)) {
    if (!drawioCliPath) {
      console.error("找不到 draw.io CLI。請安裝 draw.io 桌面版或設置 DRAWIO_PATH。");
      process.exit(1);
    }
    console.log(`使用算繪器：draw.io CLI (${basename(drawioCliPath)})`);
    for (const { input, output } of files) {
      console.log(`正在算繪：${basename(input)}`);
      try {
        exportWithDrawioCli(drawioCliPath, input, output);
        let kb = "?";
        try {
          kb = (statSync(output).size / 1024).toFixed(0);
        } catch { /* 忽略大小讀取錯誤 */ }
        console.log(`  -> ${basename(output)} (${kb} KB)`);
      } catch (err) {
        console.error(`  算繪 ${basename(input)} 時發生錯誤：${err.message}`);
      }
    }
    console.log("完成。");
    return;
  }

  // --- 路徑 2：無頭瀏覽器中的官方 draw.io 檢視器 ---
  // 尋找瀏覽器
  const browserPaths = [
    process.env.CHROME_PATH,
    process.env.EDGE_PATH,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ].filter(Boolean);

  let execPath;
  for (const p of browserPaths) {
    try {
      if (statSync(p).isFile()) { execPath = p; break; }
    } catch { /* 找不到 */ }
  }

  if (!execPath) {
    console.error("找不到瀏覽器。請設置 CHROME_PATH 或 EDGE_PATH 環境變數。");
    process.exit(1);
  }

  console.log(`使用算繪器：draw.io 檢視器 (${basename(execPath)})`);

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  for (const { input, output } of files) {
    console.log(`正在算繪：${basename(input)}`);
    try {
      const rawContent = readFileSync(input, "utf-8");
      const html = buildViewerHtml(rawContent);

      const page = await browser.newPage();
      await page.setViewport({ width: 2400, height: 1600, deviceScaleFactor: 2 });

      // 首先設置 HTML 內容 (設置帶有圖表 XML 的 .mxgraph div)
      await page.setContent(html, { waitUntil: "domcontentloaded" });

      // 透過 addScriptTag 載入官方 draw.io 檢視器 JS (比內嵌 src 更可靠)
      const VIEWER_URL = "https://viewer.diagrams.net/js/viewer-static.min.js";
      try {
        await page.addScriptTag({ url: VIEWER_URL });
      } catch (scriptErr) {
        throw new Error(`無法載入 draw.io 檢視器 JS：${scriptErr.message}`);
      }

      // 開始輪詢已算繪的圖表
      await page.evaluate(() => window.__startPoll());

      // 等待檢視器完成算繪
      await page.waitForFunction(() => window.__renderComplete === true, { timeout: 30000 });

      // 檢查算繪是否成功
      const viewerOk = await page.evaluate(() => window.__renderWidth > 0);
      if (!viewerOk) {
        throw new Error("draw.io 檢視器載入或算繪失敗 (請檢查網路存取)");
      }

      // 對圖表 div 進行元素截圖以獲取準確邊界
      const containerHandle = await page.$('.mxgraph');
      let pngBuffer;

      if (containerHandle) {
        pngBuffer = await containerHandle.screenshot({ type: "png" });
      } else {
        // 備援：全頁面截圖
        const dims = await page.evaluate(() => ({
          w: Math.ceil(window.__renderWidth),
          h: Math.ceil(window.__renderHeight)
        }));
        pngBuffer = await page.screenshot({
          type: "png",
          clip: { x: 0, y: 0, width: dims.w + 20, height: dims.h + 20 },
        });
      }

      writeFileSync(output, pngBuffer);
      console.log(`  -> ${basename(output)} (${(pngBuffer.length / 1024).toFixed(0)} KB)`);

      await page.close();
    } catch (err) {
      console.error(`  算繪 ${basename(input)} 時發生錯誤：${err.message}`);
    }
  }

  await browser.close();
  console.log("完成。");
}

main().catch(err => { console.error(err); process.exit(1); });
