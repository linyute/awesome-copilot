# `winapp ui --json` 封套 (v0.3.1+) (`winapp ui --json` envelope (v0.3.1+))

`winapp ui` 指令群組的 `--json` 輸出在 v0.3.1 中進行了重塑。
請針對這些形狀產生解析器 — v0.3.1 之前的解析器將會靜默失效，
因為大多數欄位都已重新命名、移除或移動到封套 (envelopes) 中。

## `ui inspect --json`

頂層形狀（元素現在巢狀於 `windows[]` 下，而非扁平結構）：

```json
{
  "depth": 0,
  "interactive": false,
  "hideDisabled": false,
  "hideOffscreen": false,
  "windows": [
    {
      "hwnd": "0x...",
      "title": "...",
      "className": "...",
      "elementCount": 0,
      "elements": [
        {
          "selector": "...",
          "name": "...",
          "controlType": "...",
          "children": [ ... ]
        }
      ]
    }
  ]
}
```

在 v0.3.1 之前，其形狀為 `{ "elements": [...] }`。每個元素的 `id`、`depth`、
`parentSelector` 與 `windowHandle` 欄位皆已 **移除** — `selector` 
是公開的控制代碼 (handle)。

## `ui inspect --ancestors --json`

祖先 (Ancestors) 現在巢狀為父項 → 子項鏈結，並以 `Depth=i` 為鍵
（先前是以兄弟根節點形式發出）。

## `ui inspect --interactive`

非互動式祖先會被折疊，並在倖存的後代上呈現為 `ancestorPath`。
`+more` 標記在文字與 JSON 模式下皆表示被截斷的子樹。

## `ui get-focused --json`

一律發出封套（絕非裸值）：

- 無焦點：`{ "hasFocus": false }`
- 有焦點：`{ "hasFocus": true, "element": { ... } }`

v0.3.1 之前，在沒有焦點時會發出裸值 `null`。

## `ui search --json` / `ui wait-for --json`

這兩個指令皆使用與 `ui inspect` 相同的元素形狀傳回符合的元素（即 `selector`、
`name`、`controlType`、`children` 等）。
每個符合項還可能包含一個 `invokableAncestor` 欄位 — 其本身也是一個
元素形狀的物件 — 指向支援 `InvokePattern` 的最近父項（當搜尋命中不可叫用的
元素，例如按鈕內的標籤時非常有用）。

```json
[
  {
    "selector": "btn-save-c3d4",
    "name": "Save",
    "controlType": "Button",
    "children": [ ... ],
    "invokableAncestor": {
      "selector": "btn-save-c3d4",
      "name": "Save",
      "controlType": "Button"
    }
  }
]
```

內部的 `id`、`parentSelector` 與 `windowHandle` 欄位會從結果中
**清除 (scrubbed)** — 不論是在頂層還是巢狀的 `invokableAncestor` 中。
請勿依賴這些欄位；請使用 `selector` 作為控制代碼。
