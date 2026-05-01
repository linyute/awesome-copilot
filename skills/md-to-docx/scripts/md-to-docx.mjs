/**
 * md-to-docx.mjs - Markdown 轉 Word 轉換器
 * 純 JavaScript，無需外部工具。
 * 用法：node md-to-docx.mjs <input.md> [output.docx]
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join, resolve } from "path";
import { marked } from "marked";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  TableRow, TableCell, Table, WidthType, BorderStyle,
  AlignmentType, ShadingType, PageBreak
} from "docx";

// --- 從 PNG 標頭獲取圖片尺寸 ---
function pngDimensions(buffer) {
  // PNG 簽名檢查 + 偏移量 16 (寬度) 和 20 (高度) 處的 IHDR 區塊
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }
  return { width: 600, height: 400 }; // 備援
}

// --- CLI 引數解析 ---
const inputPath = process.argv[2];
if (!inputPath) {
  console.error("用法：node md-to-docx.mjs <input.md> [output.docx]");
  process.exit(1);
}
const outputPath = process.argv[3] || inputPath.replace(/\.md$/i, ".docx");
const inputDir = dirname(resolve(inputPath));

const mdSource = readFileSync(inputPath, "utf-8");

// --- 提取 YAML front-matter Metadata ---
let title = "文件";
let subtitle = "";
let date = new Date().toISOString().slice(0, 10);
let version = "1.0";
let audience = "";

const fmMatch = mdSource.match(/^---\n([\s\S]*?)\n---/m);
if (fmMatch) {
  const fm = fmMatch[1];
  title = fm.match(/^title:\s*(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "") || title;
  date = fm.match(/^date:\s*(.+)$/m)?.[1]?.trim() || date;
  version = fm.match(/^version:\s*(.+)$/m)?.[1]?.trim() || version;
  audience = fm.match(/^audience:\s*(.+)$/m)?.[1]?.trim() || "";
}

// 從 Markdown 內容中移除 front-matter
const md = mdSource.replace(/^---[\s\S]*?---\n*/m, "");

// 從 front-matter 標題或第一個 H1 衍生標題 / 副標題
const titleParts = title.split(/\s*[—–]\s*/);
const mainTitle = titleParts[0] || title;
subtitle = titleParts[1] || "";
if (!subtitle) {
  const h1Match = md.match(/^#\s+(.+)$/m);
  if (h1Match) {
    const h1Parts = h1Match[1].split(/\s*[—–]\s*/);
    if (h1Parts.length > 1) {
      subtitle = h1Parts[1];
      if (!mainTitle || mainTitle === "文件") title = h1Parts[0];
    }
  }
}

// --- 解析 Markdown Token ---
const tokens = marked.lexer(md);

// --- 樣式常量 ---
const FONT = "Calibri";
const HEADER_COLOR = "1F3864";
const ACCENT_COLOR = "2E75B6";
const TABLE_HEADER_BG = "D6E4F0";
const TABLE_ALT_BG = "F2F7FB";
const CODE_BG = "F5F5F5";
const CODE_FONT = "Consolas";
const BORDER_COLOR = "B4C6E7";

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const tableBorders = {
  top: tableBorder, bottom: tableBorder,
  left: tableBorder, right: tableBorder,
  insideHorizontal: tableBorder, insideVertical: tableBorder,
};

// --- 工具：解碼 HTML 實體 ---
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// --- 將行內 Token 轉換為 TextRun[] ---
function inlineToRuns(inlineTokens, parentBold = false, parentItalic = false) {
  const runs = [];
  if (!inlineTokens) return runs;
  for (const t of inlineTokens) {
    switch (t.type) {
      case "text":
        runs.push(new TextRun({
          text: decodeEntities(t.text || t.raw || ""),
          bold: parentBold, italics: parentItalic, font: FONT, size: 22,
        }));
        break;
      case "strong":
        runs.push(...inlineToRuns(t.tokens, true, parentItalic));
        break;
      case "em":
        runs.push(...inlineToRuns(t.tokens, parentBold, true));
        break;
      case "codespan":
        runs.push(new TextRun({
          text: t.text, font: CODE_FONT, size: 20, bold: parentBold,
          shading: { type: ShadingType.SOLID, color: CODE_BG, fill: CODE_BG },
        }));
        break;
      case "link":
        runs.push(new TextRun({
          text: t.text || t.href, bold: parentBold, italics: parentItalic,
          font: FONT, size: 22, color: ACCENT_COLOR, underline: {},
        }));
        break;
      case "image":
        // 圖片在段落層級處理；行內略過
        break;
      case "br":
        runs.push(new TextRun({ break: 1, font: FONT }));
        break;
      default:
        if (t.raw) {
          runs.push(new TextRun({
            text: decodeEntities(t.raw), bold: parentBold, italics: parentItalic,
            font: FONT, size: 22,
          }));
        }
        break;
    }
  }
  return runs;
}

// --- 段落行內 Run ---
function paragraphRuns(token) {
  if (token.tokens) return inlineToRuns(token.tokens);
  return [new TextRun({ text: token.text || token.raw || "", font: FONT, size: 22 })];
}

// --- 表格建立器 ---
function buildTable(token) {
  const rows = [];
  if (token.header) {
    rows.push(new TableRow({
      tableHeader: true,
      children: token.header.map(cell => new TableCell({
        shading: { type: ShadingType.SOLID, color: TABLE_HEADER_BG, fill: TABLE_HEADER_BG },
        children: [new Paragraph({
          children: inlineToRuns(cell.tokens, true),
          spacing: { before: 40, after: 40 },
        })],
      })),
    }));
  }
  if (token.rows) {
    token.rows.forEach((row, idx) => {
      rows.push(new TableRow({
        children: row.map(cell => new TableCell({
          shading: idx % 2 === 1
            ? { type: ShadingType.SOLID, color: TABLE_ALT_BG, fill: TABLE_ALT_BG }
            : undefined,
          children: [new Paragraph({
            children: inlineToRuns(cell.tokens),
            spacing: { before: 30, after: 30 },
          })],
        })),
      }));
    });
  }
  return new Table({
    rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders: tableBorders,
  });
}

// --- 程式碼區塊建立器 ---
function buildCodeBlock(token) {
  const lines = (token.text || "").split("\n");
  return lines.map(line => new Paragraph({
    children: [new TextRun({ text: line || " ", font: CODE_FONT, size: 18 })],
    spacing: { before: 20, after: 20 },
    shading: { type: ShadingType.SOLID, color: CODE_BG, fill: CODE_BG },
    indent: { left: 360 },
  }));
}

// --- 清單建立器 ---
function buildList(token, level = 0) {
  const items = [];
  for (const item of token.items) {
    const textTokens = item.tokens?.find(t => t.type === "text");
    const bullet = token.ordered ? `${item.raw?.match(/^\d+/)?.[0] || "1"}.` : "\u2022";
    const indent = 720 + level * 360;
    items.push(new Paragraph({
      children: [
        new TextRun({ text: `${bullet}  `, font: FONT, size: 22 }),
        ...(textTokens ? inlineToRuns(textTokens.tokens) : [new TextRun({
          text: decodeEntities(item.text || ""), font: FONT, size: 22,
        })]),
      ],
      spacing: { before: 40, after: 40 },
      indent: { left: indent },
    }));
    const nestedList = item.tokens?.find(t => t.type === "list");
    if (nestedList) items.push(...buildList(nestedList, level + 1));
  }
  return items;
}

// --- 建立文件子項目 ---
const children = [];

// 標題頁 (來自 front-matter Metadata)
children.push(
  new Paragraph({ spacing: { before: 2400 } }),
  new Paragraph({
    children: [new TextRun({ text: mainTitle, font: FONT, size: 56, bold: true, color: HEADER_COLOR })],
    alignment: AlignmentType.CENTER,
  }),
);
if (subtitle) {
  children.push(new Paragraph({
    children: [new TextRun({ text: subtitle, font: FONT, size: 36, color: ACCENT_COLOR })],
    alignment: AlignmentType.CENTER, spacing: { after: 400 },
  }));
}
children.push(
  new Paragraph({
    children: [new TextRun({
      text: `日期：${date}  |  版本：${version}`,
      font: FONT, size: 22, color: "666666",
    })],
    alignment: AlignmentType.CENTER,
  }),
);
if (audience) {
  children.push(new Paragraph({
    children: [new TextRun({ text: `對象：${audience}`, font: FONT, size: 22, color: "666666" })],
    alignment: AlignmentType.CENTER, spacing: { after: 600 },
  }));
}
children.push(new Paragraph({ children: [new PageBreak()] }));

// 目錄 (靜態，從 Markdown 中發現的標題建立)
children.push(
  new Paragraph({
    children: [new TextRun({ text: "目錄", font: FONT, size: 32, bold: true, color: HEADER_COLOR })],
    spacing: { before: 200, after: 400 },
  }),
);

// 預先掃描標題以建立目錄
for (const tok of tokens) {
  if (tok.type !== "heading" || tok.depth > 3) continue;
  // 略過第一個 H1 標題和目錄標題本身
  if (tok.depth === 1 && mainTitle !== "文件" &&
      decodeEntities(tok.text || "").includes(mainTitle)) continue;
  if (tok.text === "目錄" || tok.text === "Table of Contents") continue;

  const indent = (tok.depth - 1) * 360;
  const tocSize = tok.depth === 1 ? 24 : tok.depth === 2 ? 22 : 20;
  const tocBold = tok.depth <= 2;
  const tocColor = tok.depth <= 2 ? HEADER_COLOR : ACCENT_COLOR;

  children.push(new Paragraph({
    children: [new TextRun({
      text: decodeEntities(tok.text),
      font: FONT, size: tocSize, bold: tocBold, color: tocColor,
    })],
    spacing: { before: tok.depth === 2 ? 80 : 40, after: 40 },
    indent: { left: indent },
  }));
}

children.push(new Paragraph({ children: [new PageBreak()] }));

// --- Token 遍歷器 ---
let skipToc = false;

for (const token of tokens) {
  switch (token.type) {
    case "heading": {
      // 略過第一個 H1 (如果它與 front-matter 標題相符，因為已經在標題頁上了)
      if (token.depth === 1 && mainTitle !== "文件" &&
          decodeEntities(token.text || "").includes(mainTitle)) {
        continue;
      }
      // 略過 Markdown 的目錄章節
      if (token.text === "目錄" || token.text === "Table of Contents") { skipToc = true; continue; }
      if (skipToc && token.depth > 2) continue;
      skipToc = false;

      const headingMap = {
        1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4,
      };
      children.push(new Paragraph({
        heading: headingMap[token.depth] || HeadingLevel.HEADING_4,
        children: [new TextRun({
          text: decodeEntities(token.text),
          font: FONT, bold: true,
          color: token.depth <= 2 ? HEADER_COLOR : ACCENT_COLOR,
          size: token.depth === 2 ? 32 : token.depth === 3 ? 26 : 24,
        })],
        spacing: { before: token.depth === 2 ? 360 : 240, after: 120 },
      }));
      break;
    }
    case "paragraph": {
      if (skipToc) continue;
      // 檢查段落是否為獨立圖片
      const imgToken = token.tokens && token.tokens.length === 1 && token.tokens[0].type === "image"
        ? token.tokens[0] : null;
      if (imgToken) {
        const href = imgToken.href || "";
        const imgPath = resolve(inputDir, href);
        if (existsSync(imgPath)) {
          const imgBuf = readFileSync(imgPath);
          const dims = pngDimensions(imgBuf);
          const maxW = 580; // 最大寬度 (點) (~6 英吋)
          const scale = dims.width > maxW ? maxW / dims.width : 1;
          const w = Math.round(dims.width * scale);
          const h = Math.round(dims.height * scale);
          children.push(new Paragraph({
            children: [new ImageRun({ data: imgBuf, transformation: { width: w, height: h }, type: "png" })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 40 },
          }));
          // 如果存在替代文字則新增標題
          if (imgToken.text) {
            children.push(new Paragraph({
              children: [new TextRun({ text: imgToken.text, font: FONT, size: 18, italics: true, color: "666666" })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 120 },
            }));
          }
        } else {
          children.push(new Paragraph({
            children: [new TextRun({ text: `[找不到圖片：${href}]`, font: FONT, size: 20, italics: true, color: "888888" })],
            spacing: { before: 80, after: 80 },
          }));
        }
      } else {
        children.push(new Paragraph({
          children: paragraphRuns(token), spacing: { before: 80, after: 80 },
        }));
      }
      break;
    }
    case "table":
      if (skipToc) continue;
      children.push(buildTable(token));
      children.push(new Paragraph({ spacing: { after: 120 } }));
      break;
    case "code":
      if (skipToc) continue;
      if (token.lang === "mermaid") {
        children.push(new Paragraph({
          children: [new TextRun({
            text: "[圖表：請參閱原始 .md 檔案以檢視互動式 Mermaid 圖表]",
            font: FONT, size: 20, italics: true, color: "888888",
          })],
          spacing: { before: 80, after: 80 },
          shading: { type: ShadingType.SOLID, color: CODE_BG, fill: CODE_BG },
          indent: { left: 360 },
        }));
      } else {
        children.push(...buildCodeBlock(token));
      }
      children.push(new Paragraph({ spacing: { after: 80 } }));
      break;
    case "list":
      if (skipToc) continue;
      children.push(...buildList(token));
      break;
    case "hr":
      skipToc = false;
      children.push(new Paragraph({
        spacing: { before: 200, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } },
      }));
      break;
    case "space":
      break;
    default:
      if (token.raw && !skipToc) {
        children.push(new Paragraph({
          children: [new TextRun({ text: decodeEntities(token.raw.trim()), font: FONT, size: 22 })],
          spacing: { before: 80, after: 80 },
        }));
      }
      break;
  }
}

// --- 建立並寫入文件 ---
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FONT, size: 22 } },
      heading1: {
        run: { font: FONT, size: 36, bold: true, color: HEADER_COLOR },
        paragraph: { spacing: { before: 360, after: 160 } },
      },
      heading2: {
        run: { font: FONT, size: 32, bold: true, color: HEADER_COLOR },
        paragraph: { spacing: { before: 320, after: 120 } },
      },
      heading3: {
        run: { font: FONT, size: 26, bold: true, color: ACCENT_COLOR },
        paragraph: { spacing: { before: 240, after: 100 } },
      },
    },
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
    },
    children,
  }],
  features: { updateFields: false },
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(outputPath, buffer);
console.log(`產生的檔案：${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
