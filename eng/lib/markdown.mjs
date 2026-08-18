export function inlineCode(value) {
  const collapsed = String(value).replace(/\s+/g, " ").trim();
  const content = collapsed.length > 80 ? `${collapsed.slice(0, 77)}...` : collapsed;
  const longestBacktickRun = Math.max(0, ...Array.from(content.matchAll(/`+/g), (match) => match[0].length));
  const fence = "`".repeat(longestBacktickRun + 1);
  const pad = content.length === 0 || content.startsWith("`") || content.endsWith("`") ? " " : "";

  // 這些數值會逐字轉譯為 Markdown 機器人評論；使用長於內容中任何反引號序列的保護圍欄可防止程式碼跨距被提前關閉。
  return `${fence}${pad}${content}${pad}${fence}`;
}
