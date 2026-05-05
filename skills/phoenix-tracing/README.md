# Phoenix 追蹤技能 (Phoenix Tracing Skill)

Phoenix 的 OpenInference 語義慣例與檢測指南。

## 用法 (Usage)

請從 `SKILL.md` 開始，以獲取索引與快速參考。

## 檔案組織 (File Organization)

所有檔案位於扁平的 `rules/` 目錄中，並帶有語義字首：

- `span-*` - Span 種類（LLM, CHAIN, TOOL 等）
- `setup-*`, `instrumentation-*` - 入門指南
- `fundamentals-*`, `attributes-*` - 參考文件
- `annotations-*`, `export-*` - 進階功能

## 參考資料 (Reference)

- [OpenInference Spec](https://github.com/Arize-ai/openinference/tree/main/spec)
- [Phoenix Documentation](https://docs.arize.com/phoenix)
- [Python OTEL API](https://arize-phoenix.readthedocs.io/projects/otel/en/latest/)
- [Python Client API](https://arize-phoenix.readthedocs.io/projects/client/en/latest/)
- [TypeScript API](https://arize-ai.github.io/phoenix/)
