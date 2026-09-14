Проверил слой данных против актуального portfolio MVP (без сделок, mobile web 390). Исходники, lockfile, канонические документы, Pen/Figma, ветку и коммиты не менял.

## Контекст аудита

**HEAD:** `70c5fd52ed306143d62b8352edd45d61943388b9` (`docs: accept mobile discovery launch`)  
**Ветка:** `fix/work-final`  
**Working tree:** грязный (CORS/env, seed/fixtures, product-draft-write). Аудит опирается на текущие `schema.prisma` и `apps/api` в checkout; uncommitted seed/fixtures не принимал за канон.

**Критерии успеха:** все подтверждённые дефекты слоя данных с файлом:строкой; списки «удалить / упростить / исправить до MVP / оставить»; расхождения код ↔ RFC/DEC/архитектура; без правок и без общей БД.

**План:** schema/migrations → revisions/publish → queries/SQL → media/S3 → seed/tests → документы-владельцы (`05`, `10`, `11`, `12`, `13`). Skills: review, nest, security.

**Актуальные решения:** `DEC-082/083/086/087/089`. Commerce-таблицы в Prisma оставлять до inventory (`DEC-087`). Исторические `Implemented` в `11-PROJECT-STATUS.md` и `00-CURRENT-MVP-READINESS.md` не считал доказательством.

---

## Расхождения документов, кода и решений

1. **`docs/audits/00-CURRENT-MVP-READINESS.md`** всё ещё описывает `COMMERCE_ENABLED` и живые `GET /api/products`. **`10-CODE-ARCHITECTURE.md` и `DEC-087`:** commerce HTTP снят, Prisma Listing/Bid/Order остаются до P4. Код: `prisma.listing|bid|order` в `apps/api/src` нет.
2. **`10-CODE-ARCHITECTURE.md`** одновременно: Postgres хранит revision/achievement BYTEA, и «new revision/achievement binaries require S3». Код: `PostgresImageStore.put` пишет BYTEA; `RevisionMediaStorageError` нигде не бросается.
3. **`11-PROJECT-STATUS.md`:** «owner DTO includes `editingRevision`». Для **профиля** это так (`seller-profile.ts`). Для **Work** `productSchema` / cabinet DTO статуса ревизии не содержат.
4. **RFC §10 / `DEC-083`:** process media и repeating photo/text blocks отложены. В runtime остаются `ProductCreationStep`, `PUT /api/products/:id/creation`, admin UI и seed (64 шага). Текущий wizard пишет `story` (`product-draft-screen.tsx`), не creation-steps.
5. **RFC §6 «полнотекстовый поиск»:** реализация — `ILIKE '%q%'`, не PostgreSQL FTS. Для корпуса пилота это может быть приемлемо; это не FTS.
6. **Архитектура обещает copy-on-approve на `Product`.** Публичный каталог всё ещё требует и `p.title`/`p.category_id`, и поля published revision (`public-visibility.ts`). Два источника правды сохранены намеренно, не случайно.

---

## Подтверждённые находки

### D1 — P1, подтверждено, до MVP  
**Символ:** `Product.status` vs `ProductRevision.status`

**Где:**  
`apps/api/src/products/products.service.ts:311-358` (submit опубликованной работы меняет только ревизию)  
`apps/api/src/products/products.service.spec.ts:622-667` (тест: Product остаётся `APPROVED`)  
`packages/contracts/src/product.ts:80` и `packages/contracts/src/portfolio.ts:155-160` (в ответе только `product.status`)  
`apps/api/src/admin/admin.controller.ts:120-125`  
`apps/mobile/src/features/admin/admin-moderation-screen.tsx:185-187, 454-466`

**Проблема:** после первой публикации повторный submit ставит `editingRevision.status = PENDING_REVIEW`, а `Product.status` остаётся `APPROVED`, чтобы прошлое не скрывалось. Owner/admin контракты отдают только статус Work. Админская очередь фильтрует `product.status === 'PENDING_REVIEW'`; кнопка «Одобрить» тоже. Повторная модерация публичных правок (RFC §3, §9) в UI не видна и не одобряется.

**Сценарий:** автор правит опубликованную работу → submit → гость видит старую published revision (это правильно) → админ во вкладке «Ожидают проверки» работы нет → в «Одобрены» видит overlay editing-полей без кнопки Approve.

**Последствия:** цикл «правка → модерация → новая published revision» сломан на проекции, не на указателях `publishedRevisionId`.

**Доказательство:** unit-тест `submits an editing revision without changing an approved public Product` (прогнан). Call path: `submit` → не `product.updateMany` → `productRevision.update`. Admin: `visibleProducts` сравнивает `product.status`. HTTP-интеграция `portfolio-published-revision` одобряет повторный submit через прямой `PATCH` по id, не через очередь.

**Минимальный durable fix:** в owner/admin/cabinet DTO добавить `editingRevision: { id, status }` (как у профиля). Очередь и Approve смотреть на `editingRevision.status === PENDING_REVIEW`, не трогая `Product.status`.  
**Альтернативы:** при submit ревизии ставить Work в `PENDING_REVIEW` — сломает публичность (хуже). Отдельный moderation-inbox SQL по `product_revisions.status` — тоже durable, чуть больше работы.  
**Упрощение:** один видимый moderation-status; `Product.status` оставить visibility (`APPROVED`/`ARCHIVED`).  
**Риск:** низкий, если не менять public SQL.  
**Проверка:** unit + integration: submit published work → `GET /api/admin/products` содержит pending; Approve публикует новую revision, старая остаётся до approve.  
**Размер:** M.

---

### D2 — P1, подтверждено, до MVP  
**Символ:** `SellerProfile.status` vs `SellerProfileRevision.status`

**Где:**  
`apps/api/src/sellers/sellers.service.ts:508-517` (submit после approve не меняет live status)  
`apps/api/src/admin/admin.controller.ts:91-93` (`sellerProfileResponseSelect` без `editingRevision`)  
`apps/api/src/sellers/seller-profile.mapper.ts:40-61, 163-228`  
`apps/mobile/src/features/admin/admin-moderation-screen.tsx:175-177, 326-333`

**Проблема:** owner overlay ревизии есть; admin list — нет. Одобренный автор отправляет правку профиля: live колонки остаются последней published-копией, ревизия `PENDING_REVIEW`. Админ фильтр `seller.status === PENDING_REVIEW` её не показывает; «Одобрить» скрыта. Даже во «Все статусы» админ видит старые public-поля, не pending revision.

**Сценарий:** смена имени/фото/bio после approve. Публика правильно держит старое. Модератор не видит новое и не может approve из UI.

**Доказательство:** call path `submitProfileRevision` → update revision only if `profile.status === 'APPROVED'`. Admin select = `sellerProfileResponseSelect`. Owner mapper spec намеренно отдаёт draft overlay только при `editingRevision` в select.

**Минимальный fix:** тот же контракт `editingRevision` на admin seller list; очередь по revision status; админский select — editing revision fields + published snapshot.  
**Не делать:** писать правки сразу в `seller_profiles` — это публичный leak черновика.  
**Размер:** M. **Риск изменения:** средний (нужно не показать черновик гостю).

---

### D3 — P2, подтверждено, после MVP (упростить SoT)  
**Символ:** дубли колонок `Product` ↔ `ProductRevision`, `SellerProfile` ↔ `SellerProfileRevision`

**Где:** schema `Product` `211:233:packages/database/prisma/schema.prisma` и `ProductRevision` `250:277`; create/update dual-write `apps/api/src/products/products.service.ts:74-117, 145-208, 256-278`; copy-on-approve `apps/api/src/admin/admin-moderation.service.ts:216-225, 296-329`; public SQL всё ещё проверяет `p.title` и `p.category_id` `21:25:apps/api/src/products/public-visibility.ts`.

**Текущая модель → проблема:** Work content живёт в revision, но unpublished path пишет оба слоя; public JSON читает published revision, public SQL ещё требует denormalized Product. Любой пропуск dual-write скрывает работу или показывает рассинхрон.

**Минимальный вариант:** Product = identity + `status` + `publishedAt` + pointers + seller FK. Каталог/facets только из `product_revisions` по `published_revision_id`.  
**Сохраняемые гарантии:** public = published revision; hide = `ARCHIVED`; row lock.  
**Миграционный риск:** M — SQL + Prisma where + seed. Колонки можно оставить nullable, перестать писать.  
**Проверка:** catalog/getWork не зависят от `products.title`.  
**Размер:** L. Не блокирует 390, если D1 закрыт.

---

### D4 — P2, подтверждено, после MVP  
**Символ:** `ProductRevision.categoryId` без FK

**Где:** `256:256:packages/database/prisma/schema.prisma`; migration `20260908000000_add_product_revisions/migration.sql` добавляет колонку, FK на `categories` нет. У `Product.categoryId` FK есть.

**Проблема:** историческая/editing revision может ссылаться на удалённую категорию. Сейчас `Category` почти наверняка не удаляют — эксплуатация слабая.

**Fix:** `ON DELETE RESTRICT` с `Product`.  
**Размер:** S. **Проверка:** migrate + попытка delete referenced category.

---

### D5 — P1 для публичного запуска, подтверждено  
**Символ:** dual-write БД ↔ S3

**Где:**  
`apps/api/src/core/image-store/s3-image-store.ts:44-53, 80-82` (`put`/`delete` игнорируют TX)  
`apps/api/src/images/images.service.ts:90-124` (S3 put внутри Prisma TX до commit)  
`apps/api/src/images/images.service.ts:183-191` (S3 delete после commit, ошибка только log)  
то же для achievements `sellers.service.ts:549-560, 655-662`

**Сценарий:** `put` в S3 успел, commit Prisma упал → orphan object. Commit прошёл, `put` упал → в каталоге metadata, `get` = 404. Delete row committed, S3 delete failed → платный orphan.

**Это уже Partial в `10`/`13`.** Для RFC gate 5 («storage verified») всё ещё дыра. `PostgresImageStore` атомарнее, потому что BYTEA в той же TX.

**Минимальный durable fix:** outbox или «commit metadata → put → confirm»; не удалять DB row до успешного S3 delete (или GC по `object_key`).  
**Workaround:** только Postgres до доказанного S3 drill — противоречит production fail-closed `MEDIA_STORAGE_PROVIDER=s3`.  
**Размер:** L. **Проверка:** integration с MinIO: fail put after insert; fail delete after unlink.

---

### D6 — P1 для запуска со staging Postgres-байтами, подтверждено  
**Символ:** backfill не покрывает revision/achievement

**Где:** `scripts/ops/backfill-media-to-s3.mjs:64-95` — только `product_images`, `seller_profiles.profile_photo_data`, `product_creation_steps`. Нет `seller_profile_revisions.profile_photo_data` и `seller_profile_revision_achievements.data`.

**Сценарий:** локальный/staging Postgres уже хранит revision photo (seed и `PostgresImageStore`). Переход на S3 + restore checksum → `NoSuchKey` на `/api/sellers/:slug/photo`, если live `objectKey` уже `seller-profile-revision:{id}` после второго approve.

**Fix:** добавить те же checksum put для revision/achievement keys.  
**Размер:** S. **Проверка:** dry-run backfill counts; restore drill.

---

### D7 — P2, подтверждено, после MVP  
**Символ:** `include: { editingRevision: true }` тянет BYTEA

**Где:** `apps/api/src/admin/admin-moderation.service.ts:39-42`; также `sellers.service.ts:491, 588, 742`.

**Проблема:** в Serializable TX модерации профиля в Node попадает `profilePhotoData`. Для пилота терпимо; это лишняя память и риск логирования.

**Fix:** `select` без `*Data`.  
**Размер:** S.

---

### D8 — P2, подтверждено, после MVP  
**Символ:** unbounded admin reads

**Где:**  
`apps/api/src/admin/admin.controller.ts:91-125` — все sellers/products без `take`  
`apps/api/src/admin/admin-analytics.service.ts:112-197` — `findMany` всех `work_viewed` / users за период вместо `GROUP BY date`  
`sellers.service.ts:766-770` — все owner products  
Ingest по умолчанию включён вне test (`env.ts:292-295`).

**Для 390-пилота с десятками работ** admin list приемлем. `work_viewed` может вырасти быстрее.

**Fix:** pagination на admin list; SQL aggregate для графиков.  
**Размер:** M.

---

### D9 — P2, подтверждено, до MVP если фильтры уже в приёмке  
**Символ:** facet exact vs `ILIKE` substring

**Где:** `DEC-089` — одно canonical material string, delimiters не угадывать.  
`apps/api/src/products/products-catalog.query.ts:48-52` — `published.materials ILIKE %facet%`  
`apps/api/src/sellers/sellers-catalog.query.ts:37-41` — `discipline ILIKE %tag%`  
Facets отдают полную строку (`listPortfolioMaterialFacets`).

**Сценарий:** работы «Холст» и «Холст, масло»; выбор facet «Холст» находит обе. Два material в query — AND по подстрокам.

**Fix:** `LOWER(BTRIM(published.materials)) = LOWER($facet)` (и discipline).  
**Trade-off:** не ищет внутри свободного текста — это как раз DEC-089.  
**Размер:** S. **Проверка:** два fixtures, разный materials; facet click.

---

### D10 — P2, подтверждено, опционально до роста  
**Символ:** сортировка `published_at` без индекса

**Где:** `products-catalog.query.ts:16-22`; `schema.prisma` Product indexes: только `sellerProfileId,status` и unique pointers. Нет `@@index([publishedAt, id])`. Author CTE: correlated subquery latest product на каждого автора до `LIMIT` (`sellers-catalog.query.ts:52-70`).

**При N≈15 seed** неважно.  
**Fix:** индекс `(status, published_at DESC, id)`; latest_product_at считать после page или LATERAL.  
**Размер:** S/M.

---

### D11 — P2, подтверждено, после MVP (упростить, не удалять сейчас)  
**Символ:** `ProductCreationStep` + process-story API

**Где:** schema `317:337`; `PUT /api/products/:id/creation` `products.controller.ts:65-77`; admin list/render steps `admin.controller.ts:49-67, 151-167`; seed ожидает 64 шага `seed-contract.integration.spec.ts:77, 107`.

**Потребители:** admin moderation, owner detail, seed, atomicity tests. Текущий mobile wizard creation-steps не импортирует (`ProductDraftCreationStep` нигде не используется кроме своего файла). Public Work DTO steps не содержит.

**Нельзя удалить** без снятия API/admin/seed. Это не «поле пропало из UI».

**Упрощение:** после явного product-cut: перестать писать steps, оставить таблицу до P4-подобного inventory, public не трогать.  
**Размер:** L вместе с UI.

---

### D12 — P2, подтверждено, опционально  
**Символ:** `creationIntro` на Product, не на revision

**Где:** `replaceCreationStory` пишет только `product.creationIntro` `511-514:apps/api/src/products/products.service.ts`. Approve копирует `revision.creationIntro` `296-329:admin-moderation.service.ts` и может затереть Product intro, если revision null.

**Сейчас wizard пишет `story`, не `/creation`.** Дыра в API остаётся.  
**Fix:** писать intro в editing revision или удалить endpoint вместе с D11.  
**Размер:** S.

---

### D13 — P2, подтверждено, оставить до доказанного S3  
**Символ:** обязательные BYTEA

`SellerProfile.profilePhotoData Bytes` и `ProductImage.data Bytes` NOT NULL. S3-путь пишет `emptyImageBytes` (`images.service.ts:96`, `sellers.service.ts:191`). Колонку нельзя drop до backfill+inventory.

---

### D14 — P2, гипотеза→скорее подтверждённый класс, опционально  
OFFSET pagination `LIMIT/OFFSET` + `published_at,id` (`products.service.ts:650-656`). При публикации новой работы во время листания возможны skip/duplicate. Для пилота приемлемо; keyset (`published_at, id`) стабильнее. Размер M.

---

## Что удалить / упростить / исправить / оставить

### Исправить до MVP (поведение portfolio)

| ID | Что |
|----|-----|
| D1 | Owner/admin/cabinet: статус **editing revision** Work; очередь и Approve по нему |
| D2 | То же для author profile; admin select editing revision, не только live row |
| D9 | Exact match materials/discipline, если discovery 390 уже accepted |

Публичный запуск (RFC storage gate), не 390-UI: **D5, D6**.

### Упростить (после MVP, без ослабления гарантий)

- D3: Product/SellerProfile перестать быть копией content; SQL только published revision.
- D7: select без BYTEA.
- D8: admin pagination + SQL aggregates.
- D10: индекс `published_at`.
- D11/D12: process-story API, когда продукт подтвердит cut.
- `publicCatalogProductSelect.images` — не грузить live gallery в public path (`products.mapper.ts:184-187`); JSON уже из published revision.
- Имена `ARCHIVED` → смысл Hidden только в API/labels, не обязательно rename enum.
- `ImageStore` product-image `objectKey` на read не используется (`images.service.ts:365`) — колонка для backfill, не второй SoT.

### Удалить — нельзя сейчас, кандидаты после inventory

| Объект | Почему нельзя сейчас |
|--------|----------------------|
| `Listing`, `Bid`, `AuctionRules`, `Order`, связанные enum | `DEC-087` + unknown staging/prod migrations. P4 blocked. |
| `HandoffContact*` на профиле | RFC §8: private handoff в заявке обязателен |
| `packaging` / `deliveryInfo` | опциональные колонки; PATCH не null; public stub RFC §11; UI их больше не шлёт |
| `ProductCreationStep` | admin, owner GET, seed, tests |
| `PhoneVerificationCode` | в `apps/api/src` не читается (OTP = email). Удаление = migration. После inventory. |
| `User.phone` unique | контракт/регистрация ещё могут писать |
| BYTEA колонки | пока S3+backfill не доказаны |
| applied migrations rewrite | запрещено архитектурой |

### Оставить как есть

- Указатели `editingRevisionId` / `publishedRevisionId` и fork-on-edit.
- Public Work/Author JSON из published revision; image GET только если image ∈ published revision (`images.service.ts:351-359`).
- Achievement bytes 404 пока revision не published (`sellers.service.ts:723-727`).
- `SELECT … FOR UPDATE` на Product / profile revision; Read Committed + unique `(revisionId, position)` two-phase reindex.
- Custom SQL CTE каталога (Prisma `skip/take` хуже для join+count+order).
- Тонкий `@bidplace/database` (re-export Prisma, без лишнего repository).
- Commerce tables в schema до P4.
- `CuratorSelection` (`DEC-086`).
- Seed fail-closed (`ALLOW_DESTRUCTIVE_DEMO_SEED`).
- Partial unique SQL `one_active_listing_per_product` / `one_active_order_per_listing` — пусть живут, пока таблицы живы.
- `User.role`/`status` как String + parse в приложении — достаточно для пилота; DB enum необязателен.

---

## Контраргументы

- **D1/D2 «так задумано, чтобы не скрывать published».** Сохранение `Product.status = APPROVED` верное. Дефект не в указателе, а в том, что moderation queue и DTO не несут revision status. Профиль уже показал правильный паттерн для owner.
- **D3 «copy-on-approve упрощает SQL».** Да, и это цена. Не баг, пока dual-write не расходится; D1 показывает, что расхождение статусов уже болезненное.
- **D5 «задокументировано Partial».** Да. Для 390-приёмки UI не блокер; для RFC storage/restore — блокер запуска.
- **D9 «ILIKE ≈ contains, удобнее».** Против `DEC-089` («не угадывать delimiters», одно значение). Contains как раз смешивает значения.
- **D11 «длина модели / unused UI».** Сам размер файла не дефект. Таблица жива из-за API/admin/seed. Удалять рано.
- **ILIKE vs «полнотекстовый» RFC.** В продуктовом языке это может значить «поиск по полям». Не помечал как баг.
- **OFFSET.** При 15 работах не проявляется. Не раздувал в P1.
- **Черновик публично через Product columns.** Для APPROVED update пишет только revision (`products.service.ts:237-252`). Public `toPortfolioItem` берёт `publishedRevision`. Утечки черновика Work в visitor JSON не нашёл. Image UUID unpublished → 404.

---

## Неподтверждённые подозрения

- Рассинхрон `Product.title` и published title на реальных staging-рядах (нужен SELECT, БД не трогал).
- Orphan S3 objects уже есть на MinIO (нужен bucket listing).
- `getCreationStepImage` отдаёт process-фото гостю при `Product.status === APPROVED` без membership в revision (`images.service.ts:304-306`) — эндпоинт не в public DTO, UUID угадать трудно. Гипотеза низкой эксплуатации.
- Admin «Запросить изменения» с копией «работа будет снята с публикации» при `CHANGES_REQUESTED` на ревизии **не** меняет `Product.status` (`admin-moderation.service.ts:228-233`) — UI-текст врёт; публичность сохраняется (это плюс к RFC). Не отдельный data-bug.
- `parseImageKey` не проверяет UUID — мусорный id → Prisma miss → 404.

## Недоступные проверки (не объявляю пройденными)

- PostgreSQL integration (`bidplace_integration` / чужие схемы).
- `pnpm db:seed` / migrate / restore / backfill (destructive / shared / secrets).
- Живой MinIO/S3 checksum drill.
- Staging/prod `_prisma_migrations` inventory (блокер P4).
- Чтение `.env` / credentials.
- `scripts/setup` — файла нет; README: `pnpm install`, `docker:up`, `pnpm verify`. Пакеты в checkout не ставил.
- Worktree не создавал: unit-тесты без БД и без записи в git.

---

## Приоритетные действия

1. **D1+D2 (M, до MVP):** revision status в admin/owner/cabinet; очередь модерации по `editingRevision.status`. Без этого RFC-цикл правок после первой публикации не работает в продукте, хотя указатели revision сделаны.
2. **D9 (S):** exact facet match.
3. Перед публичным запуском: **D6** backfill revision/achievement; затем **D5** хотя бы MinIO fail-path test, не только happy-path put.
4. Не начинать P4 drop Listing/Bid/Order.
5. Не удалять BYTEA, creation steps, packaging/handoff «потому что нет в Figma».

Разумно не трогать: published-pointer модель, image authz по revision membership, catalog CTE, Product row lock, commerce schema до inventory.

---

## Что проверено

- Prisma schema + 17 forward migrations (совпадает с `10-CODE-ARCHITECTURE.md`).
- Create/update/submit/hide, fork, admin approve copy-on-approve.
- Public SQL vs Prisma where vs `toPortfolioItem`.
- ImageStore postgres/S3, upload TX, delete-after-commit.
- Seed guards, fixtures README, seed-contract ожидания (0 listings, 64 creation steps).
- Integration test-database: per-schema `itest_*`, отказ от non-test DB names — сами тесты не гонял.
- Документы: foundation, RFC, architecture, status, DEC-082–089, security, readiness audit.

**Команды:**  
`git rev-parse` / `git status` / `git log -1`  
`pnpm --filter @bidplace/api exec vitest run` по 6 файлам → **63/63 pass** (без Postgres).

**Ограничения:** audit-only; dirty tree не откатывал; integration/S3/staging не запускались; секреты не читались.

Нет правок кода, документации, Git и зависимостей.