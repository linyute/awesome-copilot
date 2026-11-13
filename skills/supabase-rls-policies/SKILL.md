---
name: supabase-rls-policies
description: '撰寫、審查並測試 Supabase 資料列層級安全性（RLS）原則，確保一位使用者無法讀取或變更另一位使用者的資料列。適用於在 Supabase 專案中建立或變更資料表、原則、檢視表或 security definer 函式、審查涉及 RLS 的資料庫遷移，或被要求以兩位使用者登入的 pgTAP 測試來證明使用者隔離時。'
---

# Supabase RLS 原則

為 Supabase 資料表撰寫資料列層級安全性（RLS）原則，接著使用分別代表兩位不同使用者的 pgTAP 測試來證明其有效性。在測試證明第二位使用者無法讀取、變更、刪除或建立屬於第一位使用者的資料列之前，原則皆不算完成。

## 何時使用此技能

- 在公開的結構描述（預設為 `public`）中建立資料表
- 新增或變更原則、檢視表或 `security definer` 函式
- 審查涉及 RLS 的資料庫遷移或提取請求（pull request）
- 回答使用者或租戶之間是否彼此隔離

## 工作流程

1. **先列出存取規則。** 針對每個資料表，寫下哪個角色（`anon` 或 `authenticated`）可以在哪些資料列上執行哪個操作（`select`、`insert`、`update`、`delete`）。在撰寫 SQL 前與使用者確認清單。每條規則對應一個測試。
2. **撰寫資料庫遷移。** 啟用 RLS、為每個操作新增一個原則，並為原則所篩選的每個欄位建立索引。
3. **為該資料表撰寫 pgTAP 測試檔案**，放在 `supabase/tests/` 下，並使用下方的範本。
4. **執行 `supabase test db`** 並閱讀每一行輸出。
5. **僅在本機資料庫上刻意破壞原則。** 複製測試檔案並在 `begin;` 之後立即加入一個帶有 `using (true)` 的暫時原則，例如 `create policy "tmp_open" on public.notes for select to authenticated using (true);`。針對來自 `supabase start` 的本機堆疊執行 `supabase test db`，確認至少有一個測試失敗，然後刪除該複本。對暫時的 `for update` 與 `for delete` 原則執行相同操作。檔案以 `rollback` 結尾，因此即使執行失敗或提前停止，暫時原則也會被復原。切勿將暫時原則放入資料庫遷移中，也切勿針對共用或正式環境資料庫執行此操作。請勿透過卸除真實原則來執行此操作：沒有原則時每個讀取都會被拒絕，因此拒絕測試仍會通過且無法證明任何事。
6. **切勿僅為了讓測試通過而變更原則。** 回報哪個斷言失敗以及它涵蓋哪個原則，讓使用者決定哪一方有誤。

## 每個資料表的規則

### 啟用 RLS 並指定角色

- 在公開結構描述中的每個資料表上執行 `alter table ... enable row level security`。一旦啟用 RLS 且沒有任何原則存在，API 將不會傳回任何資料列。
- 為每個原則加上 `to` 子句。若無此子句，原則將套用至 `PUBLIC`，這表示包含 `anon` 在內的每個角色皆適用。
- 當請求沒有已登入的使用者時，`auth.uid()` 會傳回 `null`。`to authenticated` 可完全阻止匿名請求進入檢查。

### 每個操作一個原則，並在寫入時檢查擁有者

```sql
alter table public.notes enable row level security;

create policy "notes_select_own" on public.notes
  for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "notes_insert_own" on public.notes
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "notes_update_own" on public.notes
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "notes_delete_own" on public.notes
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

create index notes_owner_id_idx on public.notes using btree (owner_id);
```

- `using` 檢查已存在的資料列。`with check` 檢查正在寫入的資料列。未通過 `using` 的資料列會被略過且不產生錯誤；未通過 `with check` 的資料列會引發錯誤。
- **在每個 insert 與 update 檢查中繫結擁有者欄位。** 諸如 `auth.uid() is not null` 之類的檢查僅證明呼叫者已登入。任何已登入的使用者隨後都可以在擁有者欄位中插入帶有其他使用者 id 的資料列。
- 諸如 `default auth.uid()` 之類的欄位預設值並無法保護擁有者欄位。Postgres 僅在 insert 未提供值時才使用預設值，而用戶端永遠可以自行提供值。
- `update` 需要一個相符的 `select` 原則，否則更新將無法如預期運作。
- 將 `auth.uid()` 與 `auth.jwt()` 包裝在 `(select ...)` 中，讓 Postgres 每個陳述式僅執行一次，而非每個資料列執行一次。
- 為原則所篩選的每個欄位建立索引。僅當欄位是 btree 索引的第一個欄位時，該欄位才算已建立索引。

### 權杖中的授權資料

- 切勿將原則建立在 `user_metadata`（`raw_user_meta_data`）之上。已登入的使用者可以自行變更它。
- 將角色、團隊與方案儲存在使用者無法變更的 `app_metadata`（`raw_app_meta_data`）中，並使用 `auth.jwt()` 讀取它。
- 對 `app_metadata` 的變更僅在使用者的權杖重新整理後才會到達 `auth.jwt()`。在此之前，從團隊中移除的使用者仍保有存取權。

### 多重要素驗證

若要要求第二個驗證要素，請新增一個限制性（restrictive）原則：

```sql
create policy "notes_require_aal2" on public.notes
  as restrictive
  for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2');
```

限制性原則僅會縮小存取範圍。僅有限制性原則的資料表不會傳回任何資料列，因此請保留上方的寬容性（permissive）原則。

### 檢視表

檢視表預設會繞過 RLS，因為它們以建立該檢視表的角色權限執行。在 Postgres 15 及更新版本上，請使用 `security_invoker = true` 建立檢視表：

```sql
create view public.my_notes
  with (security_invoker = true)
  as select id, body from public.notes;
```

在較舊的版本上，請移除每個授與路徑，或將檢視表保留在未公開的結構描述中。僅撤銷直接授與是不夠的：對 `PUBLIC` 的授與、對 API 角色所屬角色的授與，或對單一欄位的授與，仍會讓它們讀取該檢視表。請使用 `has_any_column_privilege` 檢查結果，它會計算上述全部三種情況；`relacl` 僅列出直接的資料表授與。

```sql
revoke all on public.my_notes from public, anon, authenticated;
select has_any_column_privilege('anon', 'public.my_notes', 'select'),
       has_any_column_privilege('authenticated', 'public.my_notes', 'select');  -- 兩者皆必須為 false
```

### Security definer 函式

- `security definer` 函式以其擁有者的身份執行。若擁有者是 `postgres`，它就會繞過 RLS。
- 切勿在公開的結構描述中建立此類函式。它可能會透過 Data API 以擁有者的權限被呼叫。
- 設定 `search_path = ''`，並在函式內部為每個名稱加上結構描述限定詞。

### 金鑰

- 機密金鑰（以及舊版的 `service_role` 金鑰）會繞過 RLS。僅在伺服器上使用它們，切勿在瀏覽器或行動應用程式中使用。
- 機密金鑰僅在請求沒有使用者存取權杖時才會繞過 RLS。若請求帶有使用者存取權杖，則會套用該使用者的原則。

## 雙使用者 pgTAP 測試範本

儲存為 `supabase/tests/notes_rls_test.sql` 並調整資料表、欄位與 id。檔案在單一交易中執行並會回滾，因此測試資料永遠不會保留。

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- 兩位使用者，在切換角色前建立。
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'user1@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'user2@test.com');

insert into public.notes (id, owner_id, body) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'user 1 note');

-- 作為使用者 1：擁有者可以讀取與變更自己的資料列。
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select results_eq(
  $$select body from public.notes where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  $$values ('user 1 note'::text)$$,
  'user 1 reads their own note'
);

select results_eq(
  $$update public.notes set body = 'edited' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' returning body$$,
  $$values ('edited'::text)$$,
  'user 1 updates their own note'
);

-- 作為使用者 2：對使用者 1 資料列的每次嘗試都必須失敗。
-- 使用者 2 尚未擁有任何資料列，因此寫入探測不需要 where 子句。
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is_empty(
  $$select 1 from public.notes where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'user 2 cannot read user 1 note'
);

select is_empty(
  $$update public.notes set body = 'changed' returning 1$$,
  'user 2 cannot update user 1 note'
);

select is_empty(
  $$delete from public.notes returning 1$$,
  'user 2 cannot delete user 1 note'
);

select throws_ok(
  $$insert into public.notes (owner_id, body) values ('11111111-1111-1111-1111-111111111111', 'forged')$$,
  '42501', null,
  'user 2 cannot create a note owned by user 1'
);

select results_eq(
  $$insert into public.notes (owner_id, body) values ('22222222-2222-2222-2222-222222222222', 'user 2 note') returning owner_id$$,
  $$values ('22222222-2222-2222-2222-222222222222'::uuid)$$,
  'user 2 creates their own note'
);

-- 沒有 where 子句：僅 update 原則會選取使用者 2 的資料列，
-- 因此只有其 with check 能阻止轉移。
select throws_ok(
  $$update public.notes set owner_id = '11111111-1111-1111-1111-111111111111'$$,
  '42501', null,
  'user 2 cannot hand their note to user 1'
);

select * from finish();
rollback;
```

範本注意事項：

- 在寫入時使用 `returning`。被 RLS 篩選掉的 update 或 delete 會以零個資料列成功執行，因此只有傳回的資料列能顯示實際發生的情況。
- 在使用者 2 的 update 與 delete 探測中，請勿篩選欄位或傳回欄位。當 update 或 delete 讀取欄位時，Postgres 也會套用 `select` 原則，因此正確的 `select` 原則可能會掩蓋過於寬鬆的 `update` 或 `delete` 原則。請傳回常數 `1`，並仰賴使用者 2 尚未擁有任何資料列的前提。
- 依測試插入的 id 篩選讀取。一旦存在其他資料，對整個資料表進行計數就會失敗。
- 錯誤 `42501` 是當寫入的資料列未通過 `with check` 運算式時，Postgres 所引發的代碼。
- 針對匿名訪客不得讀取的任何資料表新增 `anon` 測試案例，並將計畫計數加一。請先取代 claims：變更角色不會清除它們，因此 `auth.uid()` 仍會傳回使用者 2 的 id。

  ```sql
  set local request.jwt.claims = '{"role": "anon"}';
  set local role anon;
  select is_empty(
    $$select 1 from public.notes where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
    'an anonymous visitor cannot read user 1 note'
  );
  ```

  若您的專案未將資料表權限授與 `anon`，該讀取會改為引發 `42501`，因此請使用 `throws_ok`。

## 測試讀取其他 Claims 的原則

範本在 `request.jwt.claims` 中設定了整個 claims 物件，這是 PostgREST 從權杖填入的設定。`auth.uid()` 與 `auth.jwt()` 都會讀取它。若測試僅設定 `request.jwt.claim.sub`，`auth.uid()` 仍可運作，但 `auth.jwt()` 會傳回 `null`，因此比較諸如 `aal` 之類的 claim 或 `app_metadata` 中的值的原則將會看到 `null`。上方的 `aal2` 原則在該狀態下會拒絕每個使用者，導致預期拒絕的測試因錯誤的原因而通過。

針對具有限制性 `aal2` 原則的資料表，請在範本中的兩次使用者切換時於 claims 中加入 `"aal": "aal2"`，使擁有者檢查仍能通過。接著在 `select * from finish();` 之前測試另一側，並將這兩個斷言加入計畫計數中：

```sql
-- 若 anon 案例先執行，SQL 角色仍為 anon。JSON 中的 role claim 並不會變更它。
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal1"}';
select is_empty(
  $$select 1 from public.notes where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'an aal1 session cannot read user 1 note'
);

set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated", "aal": "aal2"}';
select isnt_empty(
  $$select 1 from public.notes where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'an aal2 session reads user 1 note'
);
```

## 審查檢查清單

- [ ] 公開結構描述中的每個資料表皆已啟用 RLS
- [ ] 每個原則皆使用 `to` 指定角色
- [ ] Insert 與 update 檢查皆將擁有者欄位繫結至 `(select auth.uid())`
- [ ] 沒有任何原則讀取 `user_metadata`
- [ ] 檢視表使用 `security_invoker = true`，或未公開
- [ ] Security definer 函式位於公開結構描述之外，並設定 `search_path = ''`
- [ ] 每個原則欄位皆有一個以該欄位為首的索引
- [ ] 每個使用者資料表皆有一個涵蓋讀取、更新、刪除與插入的雙使用者測試
- [ ] 第二位使用者的更新與刪除探測未讀取任何欄位
- [ ] 測試在每次使用者切換時皆設定完整的 `request.jwt.claims` 物件，並在 `anon` 案例前取代它
- [ ] 當在本機資料庫的測試交易內加入暫時的 `using (true)` 原則時，測試套件會失敗

## 參考資料

- [資料列層級安全性（Row Level Security）](https://supabase.com/docs/guides/database/postgres/row-level-security)，Supabase 文件
- [使用 pgTAP 測試資料列層級安全性原則](https://supabase.com/docs/guides/database/postgres/testing-row-level-security)，Supabase 文件
- [多重要素驗證（Multi-Factor Authentication）](https://supabase.com/docs/guides/auth/auth-mfa)，Supabase 文件
- [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html)，PostgreSQL 文件
- [交易（Transactions）](https://docs.postgrest.org/en/stable/references/transactions.html)，PostgREST 文件（`request.jwt.claims`）
- [CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)，PostgreSQL 文件（欄位預設值）
- [auth.uid() 原始碼](https://github.com/supabase/auth/blob/35307ce6c1ca59016fd820f1d77d9b6201dc2e15/migrations/20220224000811_update_auth_functions.up.sql)與 [auth.jwt() 原始碼](https://github.com/supabase/auth/blob/35307ce6c1ca59016fd820f1d77d9b6201dc2e15/migrations/20220531120530_add_auth_jwt_function.up.sql)，Supabase Auth