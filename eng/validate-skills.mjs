#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { parseSkillMetadata } from "./yaml-parser.mjs";
import {
  ROOT_FOLDER,
  SKILLS_DIR,
  SKILL_NAME_MIN_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  SKILL_DESCRIPTION_MIN_LENGTH,
  SKILL_DESCRIPTION_MAX_LENGTH,
} from "./constants.mjs";

// 驗證函式
function validateSkillName(name) {
  if (!name || typeof name !== "string") {
    return "name is required and must be a string";
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    return "name must contain only lowercase letters, numbers, and hyphens";
  }
  if (name.length < SKILL_NAME_MIN_LENGTH || name.length > SKILL_NAME_MAX_LENGTH) {
    return `name must be between ${SKILL_NAME_MIN_LENGTH} and ${SKILL_NAME_MAX_LENGTH} characters`;
  }
  return null;
}

function validateSkillDescription(description) {
  if (!description || typeof description !== "string") {
    return "description is required and must be a string";
  }
  if (description.length < SKILL_DESCRIPTION_MIN_LENGTH) {
    return `description must be at least ${SKILL_DESCRIPTION_MIN_LENGTH} characters`;
  }
  if (description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
    return `description must not exceed ${SKILL_DESCRIPTION_MAX_LENGTH} characters`;
  }
  return null;
}

function validateSkillFolder(folderPath, folderName) {
  const errors = [];

  // 檢查 SKILL.md 是否存在
  const skillFile = path.join(folderPath, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    errors.push("Missing SKILL.md file");
    return errors; // 無法在沒有 SKILL.md 的情況下繼續
  }

  // 解析並驗證 frontmatter
  const metadata = parseSkillMetadata(folderPath);
  if (!metadata) {
    errors.push("Failed to parse SKILL.md frontmatter");
    return errors;
  }

  // 驗證 name 欄位
  const nameError = validateSkillName(metadata.name);
  if (nameError) {
    errors.push(`name: ${nameError}`);
  } else {
    // 驗證資料夾名稱是否與技能名稱相符
    if (metadata.name !== folderName) {
      errors.push(
        `Folder name "${folderName}" does not match skill name "${metadata.name}"`
      );
    }
  }

  // 驗證 description 欄位
  const descError = validateSkillDescription(metadata.description);
  if (descError) {
    errors.push(`description: ${descError}`);
  }

  // 檢查隨附資產的檔案大小是否合理
  const MAX_ASSET_SIZE = 5 * 1024 * 1024; // 5 MB
  for (const asset of metadata.assets) {
    const assetPath = path.join(folderPath, asset);
    try {
      const stats = fs.statSync(assetPath);
      if (stats.size > MAX_ASSET_SIZE) {
        errors.push(
          `Bundled asset "${asset}" exceeds maximum size of 5MB (${(
            stats.size /
            1024 /
            1024
          ).toFixed(2)}MB)`
        );
      }
    } catch (error) {
      errors.push(`Cannot access bundled asset "${asset}": ${error.message}`);
    }
  }

  return errors;
}

// 主要驗證函式
function validateSkills() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.log("No skills directory found - validation skipped");
    return true;
  }

  const skillFolders = fs
    .readdirSync(SKILLS_DIR)
    .filter((file) => {
      const filePath = path.join(SKILLS_DIR, file);
      return fs.statSync(filePath).isDirectory();
    });

  if (skillFolders.length === 0) {
    console.log("No skill folders found - validation skipped");
    return true;
  }

  console.log(`Validating ${skillFolders.length} skill folder(s)...`);

  let hasErrors = false;
  const usedNames = new Set();

  for (const folder of skillFolders) {
    const folderPath = path.join(SKILLS_DIR, folder);
    console.log(`\nValidating ${folder}...`);

    const errors = validateSkillFolder(folderPath, folder);

    if (errors.length > 0) {
      console.error(`❌ Validation errors in ${folder}:`);
      errors.forEach((error) => console.error(`   - ${error}`));
      hasErrors = true;
    } else {
      console.log(`✅ ${folder} is valid`);

      // 檢查是否有重複的名稱 (僅在沒有錯誤時執行)
      const metadata = parseSkillMetadata(folderPath);
      if (metadata) {
        if (usedNames.has(metadata.name)) {
          console.error(
            `❌ Duplicate skill name "${metadata.name}" found in ${folder}`
          );
          hasErrors = true;
        } else {
          usedNames.add(metadata.name);
        }
      }
    }
  }

  if (!hasErrors) {
    console.log(`\n✅ All ${skillFolders.length} skills are valid`);
  }

  return !hasErrors;
}

// 執行驗證
try {
  const isValid = validateSkills();
  if (!isValid) {
    console.error("\n❌ Skill validation failed");
    process.exit(1);
  }
  console.log("\n🎉 Skill validation passed");
} catch (error) {
  console.error(`Error during validation: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}
