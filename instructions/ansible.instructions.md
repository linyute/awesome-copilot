---
description: 'Ansible 慣例與最佳實務'
applyTo: '**/*.yaml, **/*.yml'
---

# Ansible 慣例與最佳實務

## 一般指示

- 使用 Ansible 設定與管理基礎設施。
- 為您的 Ansible 設定使用版本控制。
- 保持簡單；僅在必要時使用進階功能
- 為每個 play、block 和 task 提供簡潔但具描述性的 `name`
  - 名稱以表示正在執行的操作的動詞開頭，例如「安裝」、「設定」或「複製」
  - 任務名稱的第一個字母大寫
  - 為了簡潔，任務名稱結尾省略句點
  - 角色任務中省略角色名稱；Ansible 在執行角色時會自動顯示角色名稱
  - 從單獨的檔案中包含任務時，您可以在每個任務名稱中包含檔案名稱，以便更容易找到任務 (例如，`<TASK_FILENAME> : <TASK_NAME>`)
- 使用註解提供有關 **什麼**、**如何** 和/或 **為什麼** 正在執行某事的額外上下文
  - 不要包含冗餘註解
- 對於雲端資源使用動態庫存
  - 使用標籤根據環境、功能、位置等動態建立群組
  - 使用 `group_vars` 根據這些屬性設定變數
- 盡可能使用冪等 Ansible 模組；避免使用 `shell`、`command` 和 `raw`，因為它們會破壞冪等性
  - 如果您必須使用 `shell` 或 `command`，請在可行時使用 `creates:` 或 `removes:` 參數，以防止不必要的執行
- 使用 [完全限定集合名稱 (FQCN)](https://docs.ansible.com/ansible/latest/reference_appendices/glossary.html#term-Fully-Qualified-Collection-Name-FQCN) 以確保選擇正確的模組或外掛程式
  - 對於 [內建模組與外掛程式](https://docs.ansible.com/ansible/latest/collections/ansible/builtin/index.html#plugin-index) 使用 `ansible.builtin` 集合
- 將相關任務分組以提高可讀性與模組化
- 對於 `state` 為可選的模組，明確設定 `state: present` 或 `state: absent` 以提高清晰度與一致性
- 使用執行任務所需的最低權限
  - 僅在 play 層級或 `include:` 語句上設定 `become: true`，如果所有包含的任務都需要超級使用者權限；否則，在任務層級指定 `become: true`
  - 僅在任務需要超級使用者權限時才設定 `become: true`

## 密碼管理

- 單獨使用 Ansible 時，使用 Ansible Vault 儲存密碼
  - 使用以下流程，以便輕鬆找到定義加密變數的位置
    1. 建立一個以群組命名的 `group_vars/` 子目錄
    2. 在此子目錄中，建立兩個名為 `vars` 和 `vault` 的檔案
    3. 在 `vars` 檔案中，定義所有需要的變數，包括任何敏感變數
    4. 將所有敏感變數複製到 `vault` 檔案中，並在這些變數前加上 `vault_`
    5. 調整 `vars` 檔案中的變數以使用 Jinja2 語法指向匹配的 `vault_` 變數：`db_password: "{{ vault_db_password }}"`
    6. 加密 `vault` 檔案以保護其內容
    7. 在您的 playbook 中使用 `vars` 檔案中的變數名稱
- 將其他工具與 Ansible 一起使用時 (例如 Terraform)，將密碼儲存在第三方密碼管理工具中 (例如 Hashicorp Vault、AWS Secrets Manager 等)
  - 這允許所有工具引用單一密碼真相來源，並防止設定不同步

## 樣式

- 使用 2 個空格縮排並始終縮排列表
- 以下每個項目之間用一個空行分隔：
  - 兩個主機區塊
  - 兩個任務區塊
  - 主機與包含區塊
- 變數名稱使用 `snake_case`
- 在 `vars:` 映射或變數檔案中定義變數時按字母順序排序
- 始終使用多行映射語法，無論映射中存在多少對
  - 它提高了可讀性並減少了版本控制的變更集衝突
- 偏好單引號而不是雙引號
  - 唯一應該使用雙引號的時候是它們嵌套在單引號中 (例如 Jinja 映射引用)，或者您的字串需要跳脫字元 (例如，使用「\n」表示換行符)
  - 如果您必須撰寫長字串，請使用折疊區塊純量語法 (即 `>`) 將換行符替換為空格，或使用文字區塊純量語法 (即 `|`) 保留換行符；省略所有特殊引號
- play 的 `host` 部分應遵循以下一般順序：
  - `hosts` 宣告
  - 按字母順序排列的主機選項 (例如 `become`、`remote_user`、`vars`)
  - `pre_tasks`
  - `roles`
  - `tasks`
- 每個任務應遵循以下一般順序：
  - `name`
  - 任務宣告 (例如 `service:`、`package:`)  
  - 任務參數 (使用多行映射語法)
  - 迴圈運算子 (例如 `loop`)
  - 按字母順序排列的任務選項 (例如 `become`、`ignore_errors`、`register`)
  - `tags`
- 對於 `include` 語句，引用檔案名稱，並且只有在它們是多行時 (例如，它們有標籤) 才在 `include` 語句之間使用空行

## Linting

- 使用 `ansible-lint` 和 `yamllint` 檢查語法並強制執行專案標準
- 使用 `ansible-playbook --syntax-check` 檢查語法錯誤
- 使用 `ansible-playbook --check --diff` 執行 playbook 執行的試運行

<!-- 
這些指南基於或複製自以下來源：

- [Ansible 文件 - 提示與技巧](https://docs.ansible.com/ansible/latest/tips_tricks/index.html)
- [Whitecloud Ansible 樣式指南](https://github.com/whitecloud/ansible-styleguide)
-->
