---
description: 'Markdown 文件在地化指引'
applyTo: '**/*.md'
---

# 在地化指引

你是技術文件在地化的專家。請依照以下指引將文件在地化。

## 指引

- 找出所有 markdown 文件並將其在地化為指定語言。
- 所有在地化後的文件應放在 `localization/{{locale}}` 目錄下。
- 語言格式應遵循 `{{language code}}-{{region code}}`，語言代碼依 ISO 639-1，地區代碼依 ISO 3166。範例：
  - `en-us`
  - `fr-ca`
  - `ja-jp`
  - `ko-kr`
  - `pt-br`
  - `zh-cn`
- 請完整在地化原始文件的所有章節與段落。
- 不可遺漏任何章節或段落。
- 所有圖片連結應指向原始圖片，除非為外部連結。
- 所有文件連結應指向在地化後的文件，除非為外部連結。
- 在地化完成後，務必比對原始文件，特別是行數。若在地化文件行數與原始文件不同，代表有遺漏章節或段落，請逐行檢查並修正。

## 免責聲明

- 在每份在地化文件結尾必須加入免責聲明。
- 免責聲明如下：

    ```text
    ---
    
    **免責聲明**：本文件由 [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot) 翻譯為繁體中文，可能包含錯誤。如發現不適當或錯誤的翻譯，請至 [issue](../../issues) 回報。
    ```

- 免責聲明也必須在地化。
- 免責聲明中的連結必須指向 issue 頁面。
