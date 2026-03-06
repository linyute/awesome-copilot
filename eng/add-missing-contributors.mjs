/**
 * 一次性貢獻者偵測與新增腳本。
 * 探索缺失的貢獻者，從儲存庫歷史紀錄中確定其貢獻類型，
 * 並透過 all-contributors 命令列介面更新 .all-contributorsrc。
 *
 * 用法: node add-missing-contributors.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getContributionTypes,
  getMissingContributors,
  fetchContributorMergedPrs
} from './contributor-report.mjs';
import { setupGracefulShutdown } from './utils/graceful-shutdown.mjs';

const DEFAULT_CMD_TIMEOUT = 30_000; // 30 秒

setupGracefulShutdown('add-missing-contributors');

/**
 * 從已合併的 PR 中獲取貢獻者接觸過的所有檔案。
 * @param {string} username
 * @returns {string[]}
 */
const getContributorFiles = (username) => {
  try {
    console.log(`📁 正在獲取貢獻者的檔案: ${username}`);

    const prs = fetchContributorMergedPrs(username, { includeAllFiles: true });

    if (prs.length === 0) {
      console.log(`📭 未找到 ${username} 的已合併 PR`);
      return [];
    }

    const files = new Set();
    for (const pr of prs) {
      for (const file of pr.files || []) {
        if (file?.path) {
          files.add(file.path);
        }
      }
    }

    const fileList = Array.from(files);
    console.log(`📄 為 ${username} 找到 ${fileList.length} 個不重複的檔案: ${fileList.slice(0, 3).join(', ')}${fileList.length > 3 ? '...' : ''}`);
    return fileList;

  } catch (error) {
    console.error(`❌ 獲取 ${username} 的檔案時發生錯誤:`, error.message);
    return [];
  }
};

/**
 * 從貢獻者的檔案中確定其貢獻類型。
 * @param {string} username
 * @returns {string}
 */
const analyzeContributor = (username) => {
  try {
    console.log(`🔍 正在分析 ${username} 的貢獻類型`);
    const files = getContributorFiles(username);

    if (files.length === 0) {
      console.log(`💡 未找到 ${username} 的檔案，使用 'code' 作為備案`);
      return 'code';
    }

    const contributionTypes = getContributionTypes(files);

    if (!contributionTypes || contributionTypes.trim() === '') {
      console.log(`💡 未找到 ${username} 的匹配類型，使用 'code' 作為備案`);
      return 'code';
    }

    console.log(`✅ 已確定 ${username} 的類型: ${contributionTypes}`);
    return contributionTypes;

  } catch (error) {
    console.error(`❌ 分析 ${username} 的檔案時發生錯誤:`, error.message);
    return 'code';
  }
};

/**
 * 將使用者名稱新增至 .all-contributorsrc 中的忽略清單。
 * @param {string} username
 * @returns {boolean}
 */
const addToIgnoreList = (username) => {
  try {
    const configPath = path.join(process.cwd(), '.all-contributorsrc');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const ignoreList = config.ignoreList || config.ignore || [];
    if (!ignoreList.includes(username)) {
      ignoreList.push(username);
      config.ignoreList = ignoreList;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.warn(`⚠️  已將 ${username} 新增至忽略清單 (在 GitHub 上找不到此使用者)`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ 無法將 ${username} 新增至忽略清單:`, error.message);
    return false;
  }
};

/**
 * 執行 all-contributors 命令列介面以將貢獻者新增至專案。
 * @param {string} username
 * @param {string} types
 * @returns {boolean}
 */
const addContributor = (username, types) => {
  try {
    console.log(`➕ 正在新增貢獻者: ${username}，類型為: ${types}`);

    const command = `npx all-contributors add ${username} ${types}`;

    execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: DEFAULT_CMD_TIMEOUT
    });

    return true;

  } catch (error) {
    // 應向上傳遞的系統級錯誤
    if (error.message.includes('rate limit') || error.message.includes('403')) {
      console.error(`⏱️  新增 ${username} 時遇到速率限制。`);
      throw error;
    }
    if (error.message.includes('network') || error.message.includes('timeout')) {
      console.error(`🌐 新增 ${username} 時發生網路錯誤。`);
      throw error;
    }

    // 可跳過的特定使用者錯誤
    if (error.message.includes('404') || error.message.includes('not found')) {
      addToIgnoreList(username);
      console.error(`❌ 找不到使用者 ${username}，已新增至忽略清單`);
      return false;
    }

    // 未知錯誤 - 記錄並跳過
    console.error(`❌ 新增貢獻者 ${username} 失敗:`, error.message);
    return false;
  }
};

/**
 * 處理單個缺失的貢獻者：偵測類型並透過 all-contributors 命令列介面新增。
 * @param {string} username
 * @returns {{added:number, failed:number}}
 */
const processContributor = async (username) => {
  let added = 0;
  let failed = 0;

  try {
    console.log(`📊 步驟 2: 正在分析 ${username} 的貢獻類型...`);
    const contributionTypes = analyzeContributor(username);

    console.log(`➕ 步驟 3: 正在新增 ${username}，類型為: ${contributionTypes}...`);

    const success = addContributor(username, contributionTypes);
    if (success) {
      added++;
      console.log(`✅ 成功處理 ${username}`);
    } else {
      failed++;
      console.log(`❌ 處理 ${username} 失敗`);
    }

  } catch (error) {
    failed++;
    console.error(`💥 處理 ${username} 時發生錯誤:`, error.message);
  }

  return { added, failed };
};

/**
 * 主要進入點：偵測並新增缺失的貢獻者。
 */
const main = async () => {
  console.log('🚀 開始執行新增缺失貢獻者腳本');
  console.log('='.repeat(50));

  try {
    console.log('\n📋 步驟 1: 正在偵測缺失的貢獻者...');
    const missingContributors = getMissingContributors();

    if (missingContributors.length === 0) {
      console.log('🎉 未找到缺失的貢獻者！所有貢獻者皆已正確辨識。');
      return { processed: 0, added: 0, failed: 0 };
    }

    console.log(`\n🔄 正在處理 ${missingContributors.length} 位缺失的貢獻者...`);

    let processed = 0;
    let added = 0;
    let failed = 0;

    for (const username of missingContributors) {
      console.log(`\n${'─'.repeat(30)}`);
      console.log(`👤 正在處理貢獻者: ${username}`);

      processed++;

      try {
        const { added: deltaAdded, failed: deltaFailed } = await processContributor(username);
        added += deltaAdded;
        failed += deltaFailed;
      } catch (error) {
        // 重新拋出系統級錯誤 (速率限制、網路、SIGINT)
        console.error(`💥 處理 ${username} 時發生系統錯誤:`, error.message);
        throw error;
      }
    }

    return { processed, added, failed };
  } catch (error) {
    console.error('\n💥 主要執行流程發生致命錯誤:', error.message);
    console.error('🛑 腳本執行已停止');
    throw error;
  }
};

/**
 * 列印執行的摘要報告。
 * @param {{processed:number, added:number, failed:number}} results
 */
const printSummaryReport = (results) => {
  const { processed, added, failed } = results;

  console.log('\n' + '='.repeat(50));
  console.log('📊 執行摘要');
  console.log('='.repeat(50));

  console.log(`📋 已處理的貢獻者總數: ${processed}`);
  console.log(`✅ 成功新增: ${added}`);
  console.log(`❌ 新增失敗: ${failed}`);

  if (processed === 0) {
    console.log('\n🎉 成功: 未找到缺失的貢獻者 - 所有貢獻者皆已正確辨識！');
  } else if (failed === 0) {
    console.log('\n🎉 成功: 所有缺失的貢獻者皆已成功新增！');
    console.log('💡 後續步驟: 檢視更新後的 .all-contributorsrc 檔案並提交變更。');
  } else if (added > 0) {
    console.log('\n⚠️  部分成功: 已新增部分貢獻者，但部分失敗。');
    console.log(`💡 已成功新增 ${added} 位貢獻者。`);
    console.log(`🔄 ${failed} 位貢獻者處理失敗 - 請查看上方錯誤訊息以獲取詳細資訊。`);
    console.log('💡 您可能需要再次執行腳本以重試失敗的貢獻者。');
  } else {
    console.log('\n❌ 失敗: 無法新增任何貢獻者。');
    console.log('💡 請查看上方錯誤訊息以獲取疑難排解建議。');
    console.log('💡 常見問題: 缺少 GITHUB_TOKEN、網路問題或 API 速率限制。');
  }

  console.log('\n📝 可執行的後續步驟:');
  if (added > 0) {
    console.log('• 檢視更新後的 .all-contributorsrc 檔案');
    console.log('• 提交並推送變更以更新 README');
    console.log('• 考慮執行 "npm run contributors:generate" 以更新 README');
  }
  if (failed > 0) {
    console.log('• 查看上方的錯誤訊息以了解具體的失敗原因');
    console.log('• 驗證 GITHUB_TOKEN 已設定且具備適當權限');
    console.log('• 解決問題後，考慮再次執行腳本');
  }
  if (processed === 0) {
    console.log('• 無須採取任何行動 - 所有貢獻者皆已辨識！');
  }

  console.log('\n' + '='.repeat(50));
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const results = await main();
    printSummaryReport(results);

    if (results.failed > 0 && results.added === 0) {
      process.exit(1);
    } else if (results.failed > 0) {
      process.exit(2);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('\n💥 腳本執行失敗:', error.message);
    console.log('\n📝 疑難排解提示:');
    console.log('• 確保您處於 git 儲存庫中');
    console.log('• 驗證已安裝 all-contributors-cli');
    console.log('• 檢查 .all-contributorsrc 檔案是否存在');
    console.log('• 確保已設定 GITHUB_TOKEN 環境變數');
    process.exit(1);
  }
}
