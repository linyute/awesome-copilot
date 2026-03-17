# Pinia 測試程式碼片段 (與測試指南一致)

編寫 `@pinia/testing` 測試時，可以直接使用這些模式。

## 使用 `createTestingPinia` 掛載元件

```ts
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { vi } from "vitest";

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

## 執行真實 actions

僅當 action 內部的行為必須執行時才使用此選項。
如果測試僅檢查呼叫/未呼叫的預期，請保留預設的虛設 (stubbing) (`stubActions: true`)。

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

## 植入初始狀態

```ts
const wrapper = mount(ComponentUnderTest, {
  global: {
    plugins: [
      createTestingPinia({
        createSpy: vi.fn,
        initialState: {
          counter: { n: 10 },
          profile: { name: "Sherlock Holmes" },
        },
      }),
    ],
  },
});
```

## 在測試中使用 store 並斷言 action 呼叫

```ts
const pinia = createTestingPinia({ createSpy: vi.fn });
const store = useCounterStore(pinia);

store.increment();
expect(store.increment).toHaveBeenCalledTimes(1);
```

## 加入受測插件

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

## 為邊緣測試覆寫並重設 getters

```ts
const pinia = createTestingPinia({ createSpy: vi.fn });
const store = useCounterStore(pinia);

store.double = 42;
expect(store.double).toBe(42);

// @ts-expect-error 僅供測試用的重設
store.double = undefined;
```
