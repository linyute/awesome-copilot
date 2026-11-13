export function inlineCode(value) {
  const collapsed = String(value).replace(/\s+/g, " ").trim();
  const content = collapsed.length > 80 ? `${collapsed.slice(0, 77)}...` : collapsed;
  const longestBacktickRun = Math.max(0, ...Array.from(content.matchAll(/`+/g), (match) => match[0].length));
  const fence = "`".repeat(longestBacktickRun + 1);
  const pad = content.length === 0 || content.startsWith("`") || content.endsWith("`") ? " " : "";

  // 這些值會逐字呈現在 Markdown 機器人評論中；使用比內容中任何
  // 反引號序列更長的反引號標記，可防止代碼區段被提早關閉。
  return `${fence}${pad}${content}${pad}${fence}`;
}
