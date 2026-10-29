# W1 — Один владелец статуса работы — план реализации

> **Для агентов:** выполнять через superpowers `subagent-driven-development`
> (рекомендуется) или `executing-plans`. Шаги — чекбоксы. Общие правила —
> [AGENT-RULES.md](../AGENT-RULES.md).

**Goal:** все записи статуса работы и опубликованной ревизии идут через один
модуль; вопрос «работа в продаже?» отвечает один хелпер; публичность картинки
определяет тот же предикат, что публичность работы.

**Architecture:** модуль `product-publication.ts` (три функции, без DI-классов)
владеет двумя таблицами переходов — ревизии и видимости — и условной записью
`updateMany(... status in expected)` + `count === 1` внутри транзакции с
блокировкой строки работы. Вызывающие (автор, админ, медиа) решают «что
сделать», модуль — «разрешено ли и как записать». W3 добавит лоты и заказы
только через эти функции и хелпер «в продаже».

**Spec:** решения этого файла; [COMMERCE.md](../COMMERCE.md) §«Работа во время
продажи»; `10-CODE-ARCHITECTURE.md` (публикация и медиа).

**Ветка:** `fix/publication-state-owner` от `main`. Факты проверены на `6720b7af`.
Зависит от: W0.

## Global Constraints

- Поведение для пользователей не меняется, кроме одного: новая одобренная
  ревизия скрытой (`ARCHIVED`) работы становится опубликованной ревизией, а
  работа остаётся скрытой — одинаково с медиа и без.
- Записи `Product.status` и `Product.publishedRevisionId` в `apps/api/src` —
  только в `apps/api/src/products/product-publication.ts`.
- Статусы лотов (`SCHEDULED`, `LIVE`) упоминаются в коде только в
  `apps/api/src/products/product-write-guard.ts`.
- Ошибки — `AppException` с кодом из `packages/contracts/src/error.ts`, не
  `ConflictException` со строкой.
- Машину профиля автора (`SellerProfile.status`) не переделывать.

## Review Focus

1. Автор пытается скрыть работу, по которой идут торги, — отказ с понятным
   текстом, а не 500 и не тихое скрытие. → Task 3, шаг 1.
2. Админ архивирует работу с активным лотом — отказ тем же кодом. → Task 3, шаг 1.
3. Работа скрыта, но картинку можно открыть по прямой ссылке — нельзя. → Task 3, шаг 4.
4. Две вкладки одновременно: автор скрывает, модератор одобряет новую ревизию —
   результат согласован (одна запись проходит, вторая получает конфликт или
   применяется к новому состоянию по таблице). → Task 2, шаг 1.
5. Скрытая работа получает одобрение новой ревизии — остаётся скрытой, после
   «показать» видна новая ревизия, в режимах с медиа и без. → Task 2, шаг 1.

## Facts

| Место | Сейчас |
| --- | --- |
| `products/product-revision-state.ts` 4–30 `assertProductRevisionTransition` | одна таблица для двух машин |
| `products/products.service.ts` 448–566 submit | ревизия → `PENDING_REVIEW`; первая отправка — и родитель (556–566, `updateMany` + `count === 1`); правка одобренной/скрытой — только ревизия (496–498) |
| `products/products.service.ts` 606–670 hide/unhide | проверяет лоты `SCHEDULED/LIVE` (638–641) |
| `admin/admin-moderation.service.ts` 707–914 решение | грузит лоты (725–728) и не использует; без медиа оставляет `ARCHIVED` (821–828) |
| `core/media/media-lifecycle.service.ts` 1053–1096 `switchPublication` | `FOR UPDATE`, CAS (`expectedRevisionAt`, `previousRevisionId`), пишет `status: 'APPROVED'` напрямую, копирует `publishedProductData` (`core/media/publication-fields.ts` 1–25); скрытая работа отказывает (~1072) |
| `images/images.service.ts` 1149–1169 `get` | свой предикат публичности |
| `images/images.service.ts` 1422–1471 `requireEditableOwner` | форк `assertProductWritable` с литералом `['SCHEDULED','LIVE']` |
| `products/product-write-guard.ts` 16–34, 49–58 | `assertProductWritable`, `lockProductRowForUpdate` |
| `products/public-visibility.ts` 7–52 | `portfolioCatalogProductWhere` и `portfolioDirectProductWhere` — один предикат дважды |
| `sellers/sellers.service.ts` 475–490 | блокировка автора проверяет живые лоты |
| `core/database/transaction.ts` 23–33 | `runReadCommittedTransaction`, `runSerializableTransaction` |
| `core/errors/api-exception.filter.ts` 25–47 | строковый `ConflictException` → `conflict` без кода |

## Бэкенд

### Task 0: Тесты API под проверкой типов

**Files:** Modify: `apps/api/tsconfig.json` (или отдельный `tsconfig.spec.json`,
подключённый в `typecheck`), `apps/api/.eslintrc.cjs`.

- [x] Сейчас `**/*.spec.ts` и `test/**` исключены из `typecheck`, а `src/**/*.spec.ts`
  — из ESLint, хотя Vitest их запускает: тест с ошибкой типов проходит проверки.
  Включить оба; найденные ошибки исправить в тестах, не подавлять. Если их
  больше ~50 — `Ruling:` и отдельный коммит до Task 1. Коммит
  `chore: typecheck and lint api tests`.

### Task 1: Модуль переходов `product-publication.ts`

**Files:**
- Create: `apps/api/src/products/product-publication.ts`,
  `apps/api/src/products/product-publication.spec.ts`
- Delete: `apps/api/src/products/product-revision-state.ts` и его спек (случаи переносятся)
- Modify: `packages/contracts/src/error.ts`, `apps/api/src/core/errors/error-response-mapper.ts`

**Reuse:** `lockProductRowForUpdate`; паттерн `updateMany` + `count === 1`; CAS из
`switchPublication`; `AppException`.

**Interfaces:**
- Produces:

```ts
type PublicationActor = 'author' | 'admin' | 'media'
assertRevisionTransition(from: ProductRevisionStatus, to: ProductRevisionStatus): void
transitionProductVisibility(tx: Prisma.TransactionClient, input: {
  productId: string; expected: ProductStatus[]; next: ProductStatus; actor: PublicationActor
}): Promise<void>
publishRevision(tx: Prisma.TransactionClient, input: {
  productId: string; revisionId: string; expectedPublishedRevisionId: string | null; expectedRevisionAt: Date
}): Promise<'published' | 'stale'>
```

  Коды ошибок: `PRODUCT_STATE_CONFLICT` (409), `PRODUCT_IN_SALE` (409) в `ApiErrorCode`.

- [x] **Шаг 1: падающий спек.** `product-publication.spec.ts`: `it.each` по всем
  парам `from × to` ревизии (разрешено/запрещено, как сейчас в
  `product-revision-state`); `it.each` по `from × to × actor` видимости:
  author `APPROVED ↔ ARCHIVED`; admin одобрение/отклонение/архив; media только
  через `publishRevision`; всё прочее — `PRODUCT_STATE_CONFLICT`.
  `publishRevision`: `PENDING_REVIEW → APPROVED`, `APPROVED → APPROVED`,
  `ARCHIVED → ARCHIVED` с новой `publishedRevisionId`; устаревший CAS → `'stale'`
  без записи.
- [x] **Шаг 2:** FAIL.
- [x] **Шаг 3:** реализовать три функции. Видимость — `updateMany({ where: { id, status: { in: expected } } })`,
  `count !== 1` → `AppException(PRODUCT_STATE_CONFLICT)`. `publishRevision` —
  перенос записи из `switchPublication` (поля `publishedProductData`).
- [x] **Шаг 4:** перенести случаи из спека `product-revision-state`, удалить старый файл.
- [x] **Шаг 5:** PASS; коммит `refactor: add product publication state owner`.

### Task 2: Писатели статуса переходят на модуль

**Files:**
- Modify: `apps/api/src/products/products.service.ts` (submit, hide/unhide),
  `apps/api/src/admin/admin-moderation.service.ts` (решение по работе),
  `apps/api/src/core/media/media-lifecycle.service.ts` (`switchPublication`, ветка работы),
  `apps/api/src/core/media/publication-fields.ts` (только если перенос сделал его ненужным — удалить)
- Test: существующие интеграционные спеки модерации и медиа (найти по
  `switchPublication`/решению модератора), `products.service.spec.ts` — только
  сигнатуры.

**Interfaces:**
- Consumes: `transitionProductVisibility`, `publishRevision`,
  `assertRevisionTransition` (Task 1).

- [x] **Шаг 1: падающие интеграционные тесты** (`it.each` по режиму медиа вкл/выкл):
  скрытая работа + одобрение новой ревизии → остаётся `ARCHIVED`,
  `publishedRevisionId` = новая; после unhide каталог показывает новую ревизию.
  Гонка: автор скрывает и модератор одобряет одновременно → обе транзакции
  завершаются без 500, итог соответствует таблице, `count` второй записи
  обрабатывается как конфликт или успешный переход.
- [x] **Шаг 2:** FAIL (путь с медиа сейчас отказывает).
- [x] **Шаг 3:** заменить прямые записи статуса и `publishedRevisionId` вызовами
  Task 1. Решение «что делать» остаётся у вызывающего.
- [x] **Шаг 4:** решение модератора не грузит лоты, если не архивирует работу; при
  архивировании — вызывает `assertProductNotInSale` (Task 3).
- [x] **Шаг 5:** PASS;
  `rg -n "data: \{[^}]*status:" apps/api/src/products apps/api/src/admin apps/api/src/core/media -g '!*.spec.ts' -g '!product-publication.ts'`
  → нет записей статуса работы (записи статусов других сущностей — допустимы, перечислить в отчёте);
  `rg -n "publishedRevisionId:" apps/api/src -g '!*.spec.ts'` → записи только в `product-publication.ts`.
- [x] **Шаг 6:** коммит `refactor: route product status writes through publication owner`.

### Task 3: Хелпер «в продаже» и один предикат публичности

**Files:**
- Modify: `apps/api/src/products/product-write-guard.ts`,
  `apps/api/src/images/images.service.ts` (`get`, `requireEditableOwner`),
  `apps/api/src/sellers/sellers.service.ts` (проверка лотов при смене статуса автора),
  `apps/api/src/products/public-visibility.ts`
- Test: интеграционные спеки продуктов/изображений/модерации (добавить случаи), спек изображений

**Reuse:** `lockProductRowForUpdate`; `portfolioCatalogProductWhere`.

**Interfaces:**
- Produces:

```ts
assertProductNotInSale(tx: Prisma.TransactionClient, productId: string): Promise<void>   // PRODUCT_IN_SALE
findSellerProductIdsInSale(tx: Prisma.TransactionClient, sellerId: string): Promise<string[]>
```

  W3 расширит обе функции незавершёнными заказами — сигнатуры не меняются.

- [x] **Шаг 1: падающие тесты** (`it.each` по действию): скрыть, править, загрузить
  фото, архивировать админом работу с лотом `LIVE` (лот вставляется прямо в БД —
  API лотов ещё нет) → `PRODUCT_IN_SALE`; блокировка автора с таким лотом →
  прежнее поведение через `findSellerProductIdsInSale`.
- [x] **Шаг 2:** FAIL.
- [x] **Шаг 3:** реализовать хелперы; `assertProductWritable` и `requireEditableOwner`
  вызывают `assertProductNotInSale`; `requireEditableOwner` больше не дублирует
  `assertProductWritable` (вызывает его или удаляется).
- [x] **Шаг 4: падающий тест публичности.** `it.each` по состояниям (работа
  скрыта, автор не одобрен, пользователь заблокирован, фото не из опубликованной
  ревизии, всё ок): ответ `GET` картинки совпадает с наличием работы в каталоге.
- [x] **Шаг 5:** `ImagesService.get` использует предикат из `public-visibility.ts`;
  если два предиката идентичны — оставить один.
- [x] **Шаг 6:** PASS; `rg -n "'SCHEDULED'|'LIVE'" apps/api/src -g '!*.spec.ts'` →
  только `product-write-guard.ts`.
- [x] **Шаг 7:** коммит `refactor: single in-sale guard and public visibility predicate`.

## Фронтенд

### Task 4: Тексты новых кодов ошибок

Общей таблицы «код → текст» в `apps/mobile` нет: экраны ветвятся по
`classifyApiError(error).kind`. Эта задача создаёт таблицу; W4 добавляет в неё
коды продаж.

**Files:**
- Create: `apps/mobile/src/lib/api-error-messages.ts`, `apps/mobile/src/lib/api-error-messages.spec.ts`
- Modify: экраны черновика и кабинета, где показывается ошибка скрытия/сохранения работы

**Reuse:** `getApiErrorCode` из `@bidplace/api-client`; существующий показ ошибки на экране.

**Interfaces:**
- Produces: `apiErrorMessage(error: unknown): string | null` — текст по
  `ApiErrorCode` или `null` (экран оставляет свой общий текст).

- [x] **Шаг 1:** падающий тест: `PRODUCT_IN_SALE` → «Работа сейчас в продаже.
  Снимите лот, чтобы изменить или скрыть её»; `PRODUCT_STATE_CONFLICT` → «Работа
  изменилась. Обновите страницу и попробуйте снова»; неизвестный код → `null`.
- [x] **Шаг 2:** реализовать; экраны скрытия и сохранения работы показывают
  `apiErrorMessage(error) ?? <прежний текст>`; PASS; коммит `feat: map work state errors to messages`.

## Документы и проверки

### Task 5

- [x] `10-CODE-ARCHITECTURE.md`: владелец переходов работы, хелпер «в продаже»,
  один предикат публичности. `11-PROJECT-STATUS.md`: одна запись.
- [x] Проверки: `typecheck` и `lint` для `@bidplace/api`, `@bidplace/contracts`,
  `@bidplace/mobile`; API unit + интеграция (модерация, медиа, продукты,
  изображения); mobile unit; `git diff --check`; `pnpm docs:link-check`.
- [x] Коммит `docs: record publication state owner`.

Не трогать: `admin-moderation-pagination.integration.spec.ts`,
`media-lifecycle.integration.spec.ts` (кроме добавленных случаев).

## Промпт исполнителю

```text
Работай в /Users/yayauheny/projects/bidplace, ветка fix/publication-state-owner от main.
Прочитай AGENTS.md, docs/launch/AGENT-RULES.md, целиком
docs/launch/waves/W1-publication-owner.md. Скиллы: implement, nest, security +
superpowers subagent-driven-development (или executing-plans), test-driven-development.
Задачи Task 0 → Task 5 по порядку, один коммит на задачу. Отчёт по AGENT-RULES §6.
```

## Промпт ревьюеру

```text
Прочитай docs/launch/AGENT-RULES.md §7 и docs/launch/waves/W1-publication-owner.md.
Ревью ветки fix/publication-state-owner против main. Сам выполни команды rg из
шагов приёмки, прогони тесты, проверь Review Focus. Вердикт по AGENT-RULES §7.
```

Инварианты:
- запись статуса работы и `publishedRevisionId` — только в `product-publication.ts`;
- каждая запись условная (`expected` + `count === 1`) и внутри транзакции с
  блокировкой строки работы;
- вопрос «в продаже?» — только `assertProductNotInSale` / `findSellerProductIdsInSale`;
- публичность картинки = публичность работы (один предикат);
- единственное изменение поведения — скрытая работа и новая ревизия.

Красные флаги: класс-сервис статусов с DI и интерфейсом вместо трёх функций;
таблица переходов разрешает больше, чем раньше; строковые `ConflictException` в
новых местах; тесты на вызовы внутренних функций вместо результата в БД;
изменения машины профиля автора сверх проверки лотов.


## Журнал исполнения — 2026-10-29

**Implemented локально.** База W1 `abdef630`, ветка `feature/scheduler-tick`
по явному указанию основателя; W2 остаётся в той же ветке. Оригинал документов
`54925364`, архив и решения не изменялись. После W1 — остановка, следующие волны
не запускались. Финальное whole-wave review — отдельный этап; scoped review
Task 0–4 принят, P1 Task 2 и P2 Task 4 исправлены и повторно приняты.

| Задача | Локальные коммиты | Результат |
| --- | --- | --- |
| 0 | `cadb4c24`, `8ea5c9cc` | Tests включены в API types/lint; исправлены 240 diagnostics в 39 test/helper файлах, build scope сохранён |
| 1 | `3319aecf` | Три функции publication owner, таблицы переходов, checked writes, два contract error code |
| 2 | `1b58a851`, `a5472a13` | Author/admin/media writers мигрированы; старый helper удалён; hidden approval, deterministic race и cleanup/manual retry |
| 3 | `33f4c3cd` | Sale owner и один public predicate, actual seller suspension caller |
| 4 | `22578ea9`, `6b473212` | Общий mapper и реальные hide/save consumers; cabinet reason внутри AppDialog |
| 5 | Этот документирующий коммит | Architecture/status/security/design owners, финальная локальная приёмка |

Ruling: первоначальная ветка плана переопределена указанием основателя.
Task 0 превысил порог ~50 ошибок: конфигурация и 39 fixture repairs разделены
на два коммита. Изменения существующих pagination/media specs в Task 0 — только
типизация fixture/parser/thenable, не ослабление утверждений; Task 2 добавляет
media regressions. Старый helper удалён атомарно с callers в Task 2, а не в
Task 1. Минимальный archive guard добавлен в Task 2 для собираемого состояния;
полная миграция consumers — Task 3. Существующий ProductStatus сохранён, новой
schema enum нет. Seller suspension фактически в AdminModerationService,
не SellersService. publishedProductData теперь локален publication owner;
SellerProfile helper и машина сохраняются. Эти уточнения меняют реализацию
плана, не продуктовые решения.

Проверка writers: AST всех non-spec Product create/update/upsert calls и
проверка переданных data подтверждают два status/published-pointer updateMany,
оба в product-publication.ts; create полагается на DRAFT default, остальные
пишут editing pointer или content. Grep publishedRevisionId включает reads,
selects/types и два SellerProfile writer в admin/media — это другие сущности.
Grep data.status также включает ProductRevision/SellerProfileRevision/
SellerProfile, а не дополнительные Product writers. SCHEDULED/LIVE production
literals — только product-write-guard.ts. Raw SQL writer не найден.

Финальные проверки и ограничения фиксируются ниже; никаких remote Verify,
Turbo/generate, dotenv reads, push/merge/deploy не выполнялось. БД — disposable
localhost bidplace_integration, изолированные itest_ схемы с cleanup.

Финальная локальная приёмка Task 5 (Node 22.20.0):

- API unit, serial `--maxWorkers=1`: 661 pass + 2 mocked-path cases pass отдельным
  безопасным запуском, всего **663**. Первый sandbox запуск: 660 pass/1 fail,
  Turnstile loopback EPERM; полный разрешённый rerun — green, без изменения теста.
- API integration, 13 affected files: **114 pass** — moderation/revision projection,
  media lifecycle/transport, product atomicity/published revision, author story,
  rejected recovery, hide/listing, image/upload safety, work-media HTTP, permissions.
- Mobile unit, serial: **143 files / 1 158 pass**; contracts: **5 files / 50 pass**.
- API/contracts/mobile typecheck и lint без autofix: pass. Contracts не имеет
  lint script: выполнен прямой ESLint с shared packages/eslint-config. API-client
  typecheck, contracts/api-client/design-tokens/API builds и Expo web export: pass.
- `pnpm docs:link-check` и `git diff --check`: pass.

Runtime checks используют отсутствующий безопасный BIDPLACE_ENV_FILE, APP_ENV=local,
NODE_ENV=test; Expo отключает dotenv и получает только synthetic local public
settings. Отдельный точный mocked-path запуск использует пустой override и
подставленный fileExists; реальный env файл не читается. Ошибочный первый выбор
server-env.module.spec.ts пропустил все 3 теста; исправленный env.spec.ts выполнил
ровно требуемые 2. Не выдаётся этот skipped запуск за доказательство.

Не повторялись dedicated auth-abuse (28 opt-in) и browser smoke (1 opt-in) из
Task 0; отсутствие опций не считается green. Live R2/CDN, deployment, native,
длинный текст/wrapping, responsive screenshots, реальный focus/zoom/device —
**Needs verification**. Figma не редактировалась; геометрия UI не менялась.
Продажи/заказы не включены. Расширение W3 должно менять общий sale owner, а не
размножать проверки; один public predicate удерживает каталог и картинки вместе.

Ruling: устаревшая фраза Runtime topology «no scheduler» исправлена на
фактический global TickModule из уже реализованной W2 в той же ветке; это
устраняет противоречие текущего architecture owner, без нового решения.

### 2026-10-29 — Opus P1 hidden media privacy

`media-lifecycle.service.ts` skips PUBLIC delivery for ARCHIVED nonrestore approval
while preserving revision CAS, pointer/audit completion and PRIVATE restore bytes.
Per-object Product row locks serialize PUBLIC delivery with hide; operation lease,
generation and status are rechecked under lock. The total 60s I/O abort deadline
propagates through S3 get/body/put before the 65s transaction timeout; slow hide can
wait or fail instead of returning success ahead of a late PUBLIC PUT. No new
schema, dependency, profile transition or product decision. Deterministic regressions
cover zero hidden PUBLIC PUTs, known former URL absence, unwritten manifests,
PRIVATE-read/hide and PUBLIC-put/blocked-hide orderings, explicit restore and retries.
Local verification: 72 focused integration tests; 665 API unit cases green across
the main run and isolated reruns; API typecheck/lint/build; docs link check and
`git diff --check`. Initial unit command exposed environment/tool ordering limits
(dist rebuild overlap, sandbox loopback, explicit env-path override); each affected
spec passed after correcting invocation. Live R2/CDN verification remains open.
