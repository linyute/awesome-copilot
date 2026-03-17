---
name: unit-test-vue-pinia
category: testing
description: '為 Vue 3 + TypeScript + Vitest + Pinia 程式碼庫編寫並審查單元測試。適用於建立或更新元件、composables 與 stores 的測試；使用 createTestingPinia 模擬 Pinia；應用 Vue Test Utils 模式；以及對實作細節強制執行黑箱斷言。'
---

# unit-test-vue-pinia

使用此技能來建立或審查 Vue 元件、composables 和 Pinia stores 的單元測試。保持測試小巧、確定性且以行為優先。

## 工作流程

1. 首先確定行為邊界：元件 UI 行為、composable 行為或 store 行為。
2. 選擇能夠證明該行為的最窄測試樣式。
3. 以最簡單但仍能涵蓋該情境的選項來設定 Pinia。
4. 透過公開輸入驅動測試，例如 props、表單更新、按鈕點擊、發出的子事件和 store API。
5. 在考慮任何實體層級的斷言之前，先斷言可觀察的輸出和副作用。
6. 回傳或審查具有清晰行為導向名稱的測試，並註記任何剩餘的涵蓋範圍缺口。

## 核心規則

- 每個測試僅測試一個行為。
- 首先斷言可觀察的輸入/輸出行為（渲染的文字、發出的事件、回呼呼叫、store 狀態變更）。
- 避免與實作耦合的斷言。
- 僅在沒有合理的 DOM、prop、發出事件 (emit) 或 store 層級斷言的例外情況下，才存取 `wrapper.vm`。
- 偏好在 `beforeEach()` 中進行明確的設定，並在每次測試時重設模擬 (mocks)。
- 使用 `references/pinia-patterns.md` 中簽入的參考資料作為標準 Pinia 測試設定的在地可靠資料來源。

## Pinia 測試方法

首先使用 `references/pinia-patterns.md`，當簽入的範例無法涵蓋該案例時，再參考 Pinia 的測試指南 (cookbook)。

### 元件測試的預設模式

掛載時將 `createTestingPinia` 作為全域插件使用。
偏好將 `createSpy: vi.fn` 作為預設值，以保持一致性並更容易進行 action-spy 斷言。

```ts
const wrapper = mount(ComponentUnderTest, {
	global: {
		plugins: [
			createTestingPinia({
				createSpy: vi.fn,
			}),
		],
	},
});
```

根據預設，actions 會被虛設 (stubbed) 並被監視 (spied)。
當測試僅需要驗證 action 是否被呼叫（或未被呼叫）時，請使用 `stubActions: true`（預設值）。

### 接受的最簡 Pinia 設定

以下也是有效的，不應被標記為錯誤：

- 當測試不中斷言 Pinia action spy 行為時，使用 `createTestingPinia({})`。
- 當測試僅需要狀態植入 (state seeding) 或 action 虛設行為，且不檢查產生的 spies 時，使用 `createTestingPinia({ initialState: ... })` 或 `createTestingPinia({ stubActions: ... })` 但不包含 `createSpy`。
- 在以 store/composable 為中心的測試中（不掛載元件），當需要模擬/植入相依的 stores 時，使用 `setActivePinia(createTestingPinia(...))`。

當 action spy 斷言是測試意圖的一部分時，請使用 `createSpy: vi.fn`。

### 僅在需要時執行真實 actions

僅當測試必須驗證 action 的真實行為和副作用時，才使用 `stubActions: false`。不要為了簡單的「已被呼叫」斷言而預設開啟它。

```ts
const wrapper = mount(ComponentUnderTest, {
	global: {
		plugins: [
			createTestingPinia({
				createSpy: vi.fn,
				stubActions: false,
			}),
		],
	},
});
```

### 使用 `initialState` 植入 store 狀態

```ts
const wrapper = mount(ComponentUnderTest, {
	global: {
		plugins: [
			createTestingPinia({
				createSpy: vi.fn,
				initialState: {
					counter: { n: 20 },
					user: { name: "Leia Organa" },
				},
			}),
		],
	},
});
```

### 透過 `createTestingPinia` 加入 Pinia 插件

```ts
const wrapper = mount(ComponentUnderTest, {
	global: {
		plugins: [
			createTestingPinia({
				createSpy: vi.fn,
				plugins: [myPiniaPlugin],
			}),
		],
	},
});
```

### 邊緣案例的 Getter 覆寫模式

```ts
const pinia = createTestingPinia({ createSpy: vi.fn });
const store = useCounterStore(pinia);

store.double = 999;
// @ts-expect-error 僅供測試用的覆寫 getter 重設
store.double = undefined;
```

### 純 store 單元測試

當目標是在不進行元件渲染的情況下驗證 store 狀態轉換和 action 行為時，偏好使用 `createPinia()` 的純 store 測試。僅在需要虛設相依 stores、植入測試替身 (test doubles) 或 action spies 時，才使用 `createTestingPinia()`。

```ts
beforeEach(() => {
	setActivePinia(createPinia());
});

it("遞增", () => {
	const counter = useCounterStore();
	counter.increment();
	expect(counter.n).toBe(1);
});
```

## Vue Test Utils 方法

遵循 Vue Test Utils 指南：<https://test-utils.vuejs.org/guide/>

- 針對集中的單元測試，預設進行淺層掛載 (mount shallow)。
- 僅當整合行為是主體時，才掛載完整的元件樹。
- 透過 props、類使用者互動和發出的事件來驅動行為。
- 針對子元件虛設事件，偏好使用 `findComponent(...).vm.$emit(...)`，而非接觸父元件內部。
- 僅當更新是非同步時才使用 `nextTick`。
- 使用 `wrapper.emitted(...)` 斷言發出的事件和裝載資料 (payloads)。
- 僅在沒有 DOM 斷言、發出事件斷言、prop 斷言或 store 層級斷言可以表達該行為時，才存取 `wrapper.vm`。將其視為例外情況，並保持斷言的範圍狹窄。

## 關鍵測試程式碼片段

發出並斷言裝載資料 (payload)：

```ts
await wrapper.find("button").trigger("click");
expect(wrapper.emitted("submit")?.[0]?.[0]).toBe("Mango Mission");
```

更新輸入並斷言輸出：

```ts
await wrapper.find("input").setValue("Agent Violet");
await wrapper.find("form").trigger("submit");
expect(wrapper.emitted("save")?.[0]?.[0]).toBe("Agent Violet");
```

## 測試撰寫工作流程

1. 確定要測試的行為邊界。
2. 建立最簡的測試資料 (fixture data)（僅包含該行為所需的欄位）。
3. 設定 Pinia 和所需的測試替身。
4. 透過公開輸入觸發行為。
5. 斷言公開輸出和副作用。
6. 重構測試名稱以描述行為，而非實作。

## 限制與安全性

- 不要測試私有/內部實作細節。
- 對於動態 UI 行為，不要過度使用快照 (snapshots)。
- 如果只有一個行為重要，不要斷言大型物件中的每個欄位。
- 保持假資料的確定性；避免使用隨機值。
- 當 Pinia 設定是上述接受的最簡設定之一時，不要聲稱它是錯誤的。
- 除非受測行為需要額外的表面區域，否則不要將運作良好的測試重寫為更深層的掛載或真實 actions。
- 在審查期間明確標記缺失的測試涵蓋範圍、脆弱的選取器和與實作耦合的斷言。

## 輸出合約

- 對於 `建立` 或 `更新`，回傳完成的測試程式碼加上一則簡短的說明，描述所選的 Pinia 策略。
- 對於 `審查`，首先回傳具體的發現，然後是缺失的涵蓋範圍或脆弱性風險。
- 當最安全的選擇不明確時，請說明驅動所選測試設定的假設。

## 參考資料

- `references/pinia-patterns.md`
- Pinia 測試指南：<https://pinia.vuejs.org/cookbook/testing.html>
- Vue Test Utils 指南：<https://test-utils.vuejs.org/guide/>
