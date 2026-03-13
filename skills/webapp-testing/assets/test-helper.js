/**
 * 用於 Playwright 網頁應用程式測試的輔助公用程式 (Helper utilities for web application testing with Playwright)
 */

/**
 * 等待條件在逾時內變為 true (Wait for a condition to be true with timeout)
 * @param {Function} condition - 回傳布林值的函式 (Function that returns boolean)
 * @param {number} timeout - 逾時，以毫秒為單位 (Timeout in milliseconds)
 * @param {number} interval - 檢查間隔，以毫秒為單位 (Check interval in milliseconds)
 */
async function waitForCondition(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Condition not met within timeout');
}

/**
 * 擷取瀏覽器主控台記錄 (Capture browser console logs)
 * @param {Page} page - Playwright 頁面物件 (Playwright page object)
 * @returns {Array} 主控台訊息陣列 (Array of console messages)
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
 * 使用自動命名進行螢幕截圖 (Take screenshot with automatic naming)
 * @param {Page} page - Playwright 頁面物件 (Playwright page object)
 * @param {string} name - 螢幕截圖的基本名稱 (Base name for screenshot)
 */
async function captureScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Screenshot saved: ${filename}`);
  return filename;
}

module.exports = {
  waitForCondition,
  captureConsoleLogs,
  captureScreenshot
};
