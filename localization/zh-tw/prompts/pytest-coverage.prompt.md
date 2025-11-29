---
agent: agent
description: '執行 pytest 測試並產生覆蓋率報告，找出缺少覆蓋率的程式碼行，並將覆蓋率提高到 100%。'
---

目標是讓測試覆蓋所有程式碼行。

使用以下指令產生覆蓋率報告：

pytest --cov --cov-report=annotate:cov_annotate

如果要檢查特定模組的覆蓋率，可以這樣指定：

pytest --cov=your_module_name --cov-report=annotate:cov_annotate

您也可以指定要執行的特定測試，例如：

pytest tests/test_your_module.py --cov=your_module_name --cov-report=annotate:cov_annotate

開啟 cov_annotate 目錄以檢視帶有註釋的原始程式碼。
每個原始程式碼檔案都會有一個對應的檔案。如果檔案的原始程式碼覆蓋率達到 100%，表示所有程式碼行都已由測試覆蓋，因此您不需要開啟該檔案。

對於每個測試覆蓋率低於 100% 的檔案，請在 cov_annotate 中找到匹配的檔案並進行檢閱。

如果程式碼行以 ! (驚嘆號) 開頭，表示該行未被測試覆蓋。
新增測試以覆蓋缺少的程式碼行。

持續執行測試並改進覆蓋率，直到所有程式碼行都被覆蓋。
