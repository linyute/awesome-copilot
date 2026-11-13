/**
 * 用於單次執行腳本的輕量級優雅關閉協助工具。
 *
 * 在腳本早期呼叫 setupGracefulShutdown('script-name') 以掛載
 * 訊號和異常處理程式，從而乾淨地結束處理程序。
 *
 * @param {string} name - 用於日誌訊息的人類可讀名稱
 * @param {{exitCode?:number}} [opts]
 * @returns {() => void} 清除函式，用於移除處理程式 (在測試中很有用)
 */
export const setupGracefulShutdown = (name, { exitCode = 1 } = {}) => {
  let _shuttingDown = false;

  const cleanup = (signal) => {
    if (_shuttingDown) return;
    _shuttingDown = true;
    console.log(`\n🛑 ${name}: 收到 ${signal}，正在優雅地關閉...`);
    // 盡力進行清理：保持短暫且同步
    try {
      // 未來如有需要，可在此處放置輕量級清理任務
    } catch (e) {
      console.error(`${name}: 關閉清理期間發生錯誤:`, e);
    }

    // 以非零代碼結束，表示異常終止
    try {
      process.exit(exitCode);
    } catch (e) {
      // 如果 process.exit 被虛擬 (stubbed) 或覆寫 (例如在測試中)，則呈現失敗資訊。
      console.error(`${name}: process.exit 失敗:`, e?.message || e);
      throw e;
    }
  };

  const onSigInt = () => cleanup('SIGINT');
  const onSigTerm = () => cleanup('SIGTERM');
  const onSigHup = () => cleanup('SIGHUP');
  const onUncaught = (err) => {
    console.error(`${name}: 未捕獲的異常:`, err);
    cleanup('uncaughtException');
  };
  const onUnhandledRejection = (reason) => {
    console.error(`${name}: 未處理的 promise 拒絕:`, reason);
    cleanup('unhandledRejection');
  };

  process.on('SIGINT', onSigInt);
  process.on('SIGTERM', onSigTerm);
  process.on('SIGHUP', onSigHup);
  process.on('uncaughtException', onUncaught);
  process.on('unhandledRejection', onUnhandledRejection);

  // 傳回一個清除函式，對測試或呼叫者想要移除處理程式時很有用
  return () => {
    process.removeListener('SIGINT', onSigInt);
    process.removeListener('SIGTERM', onSigTerm);
    process.removeListener('SIGHUP', onSigHup);
    process.removeListener('uncaughtException', onUncaught);
    process.removeListener('unhandledRejection', onUnhandledRejection);
  };
};
