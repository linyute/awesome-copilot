/**
 * 用於使用 Playwright 進行網頁應用程式測試的輔助公用程式
 */

/**
 * 等待條件在超時時間內為真
 * @param {Function} condition - 返回布林值的函式
 * @param {number} timeout - 超時時間（毫秒）
 * @param {number} interval - 檢查間隔（毫秒）
 */
async function waitForCondition(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('條件未在超時時間內達成');
}

/**
 * 擷取瀏覽器控制台日誌
 * @param {Page} page - Playwright 頁面物件
 * @returns {Array} 控制台訊息陣列
 */
function captureConsoleLogs(page) {
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });
  return logs;
}

/**
 * 自動命名擷取螢幕截圖
 * @param {Page} page - Playwright 頁面物件
 * @param {string} name - 螢幕截圖的基本名稱
 */
async function captureScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`螢幕截圖已儲存: ${filename}`);
  return filename;
}

module.exports = {
  waitForCondition,
  captureConsoleLogs,
  captureScreenshot
};
