# W1 — Один владелец статуса работы и проверки «работа в продаже»

## 0. Шапка

- Статус: не начато. Зависит от: W0 (основная ветка `main`).
- Ветка: `fix/publication-state-owner` от `main`.
- Факты проверены на `6720b7af`; перед правкой перепроверь символы.

## 1. Зачем

Статус работы (`Product.status`, `publishedRevisionId`) сейчас меняют четыре
места независимо, и одно из них обходит таблицу переходов. Проверка «есть
активный лот» написана литералами `['SCHEDULED','LIVE']` в нескольких местах и
не везде вызывается. W3 добавит лоты и заказы; без единого владельца они станут
пятым и шестым местом и начнутся регрессии (скрыли работу с идущими торгами,
модератор архивировал проданную работу, картинка работы видна, хотя работа
скрыта). После волны: один модуль решает переходы, один хелпер отвечает на
вопрос «можно ли менять/скрывать работу», один предикат публичности.

## 2. Промпт исполнителю

```text
Работай в /Users/yayauheny/projects/bidplace, ветка fix/publication-state-owner от main.
Прочитай AGENTS.md, docs/launch/AGENT-RULES.md, целиком
docs/launch/waves/W1-publication-owner.md. Скиллы: implement, nest, security.
Пакеты по порядку B1 → B2 → B3 → F1 → T1 → D1, один коммит на пакет. Поведение для
пользователя не меняется, кроме явно перечисленного в §3. Отчёт по AGENT-RULES §5.
```

## 3. Решения (не перерешивать)

1. Владелец переходов работы — модуль `apps/api/src/products/product-publication.ts`
   (создаётся из `product-revision-state.ts`, который удаляется после переноса).
   Все записи `Product.status` и `publishedRevisionId` в `apps/api/src` идут только
   через его функции.
2. Две машины, две таблицы (сейчас одна таблица смешивает обе):
   - ревизия: `DRAFT | REJECTED → PENDING_REVIEW → APPROVED | REJECTED`;
   - видимость работы: `PENDING_REVIEW → APPROVED`, `APPROVED ↔ ARCHIVED`
     (скрыть/показать), плюс решения админа.
3. Новая одобренная ревизия скрытой (`ARCHIVED`) работы публикуется как
   опубликованная ревизия, а работа остаётся скрытой — одинаково с медиа и без.
   Сейчас путь с медиа отказывает (`switchPublication` ~1072), путь без медиа —
   оставляет `ARCHIVED`. Это единственное изменение поведения волны.
4. Один хелпер `assertProductNotInSale(tx, productId)` в
   `apps/api/src/products/product-write-guard.ts`: в W1 проверяет лоты в
   `SCHEDULED | LIVE`; в W3 тот же хелпер дополнится незавершёнными заказами.
   Литералы статусов лотов вне него запрещены. Ошибка — `AppException` с новым
   кодом `PRODUCT_IN_SALE` в `packages/contracts/src/error.ts`.
5. Один предикат публичности работы — `public-visibility.ts`; `ImagesService.get`
   и каталог используют его же. Если `portfolioCatalogProductWhere` и
   `portfolioDirectProductWhere` идентичны — оставить один.
6. Профиль автора (`SellerProfile.status`) в этой волне не переделываем —
   только переводим проверку активных лотов при блокировке автора на хелпер.

## 4. Скоуп

Входит: `apps/api/src/products/*`, `admin/admin-moderation.service.ts` (ветки
работы), `core/media/media-lifecycle.service.ts` (`switchPublication`, ветка
работы), `core/media/publication-fields.ts`, `images/images.service.ts`
(`get`, `requireEditableOwner`), `sellers/sellers.service.ts` (только проверка
лотов при смене статуса автора), `packages/contracts/src/error.ts`, маппинг
ошибки на клиенте. Не входит: машина профиля автора, новые эндпоинты, лоты.

## 5. Факты из кода

| Место | Что делает сейчас |
| --- | --- |
| `products/product-revision-state.ts` 4–30 `assertProductRevisionTransition` | одна таблица для ревизии и видимости |
| `products/products.service.ts` 448–566 (submit) | ревизия → `PENDING_REVIEW`; при первой отправке и родитель (556–566, `updateMany` + `count === 1`); при правке одобренной/скрытой — только ревизия (496–498) |
| `products/products.service.ts` 606–670 (hide/unhide) | проверяет лоты `SCHEDULED/LIVE` (638–641), ставит статус |
| `admin/admin-moderation.service.ts` 707–914 (решение) | грузит блокирующие лоты (725–728) и не использует; без медиа оставляет `ARCHIVED` (821–828) |
| `core/media/media-lifecycle.service.ts` 1053–1096 `switchPublication` | `FOR UPDATE`, CAS по времени ревизии и `publishedRevisionId`, ставит `status: 'APPROVED'` напрямую, копирует поля `publishedProductData` (`publication-fields.ts` 1–25), таблицу переходов не вызывает |
| `images/images.service.ts` 1149–1169 `get` | свой предикат публичности (APPROVED, автор одобрен, пользователь активен, фото опубликованной ревизии) |
| `images/images.service.ts` 1422–1471 `requireEditableOwner` | форк `assertProductWritable` с литералом `['SCHEDULED','LIVE']` |
| `products/product-write-guard.ts` 16–34, 49–58 | `assertProductWritable`, `lockProductRowForUpdate` |
| `products/public-visibility.ts` 7–52 | `portfolioCatalogProductWhere`, `portfolioDirectProductWhere` — один и тот же предикат дважды |
| `sellers/sellers.service.ts` 475–490 | блокировка автора проверяет живые лоты |
| `core/database/transaction.ts` 23–33 | `runReadCommittedTransaction`, `runSerializableTransaction` |
| `api-exception.filter.ts` 25–47 | `ConflictException` со строкой схлопывается в `conflict`; `AppException` + `ApiErrorCode` сохраняет код |

## 6. Бэкенд

### B1 — Модуль переходов

Переиспользовать: `lockProductRowForUpdate`, `updateMany` + `count === 1`,
CAS из `switchPublication`, `AppException`.
Создавать: `product-publication.ts` с тремя экспортами и ничем больше:

```ts
assertRevisionTransition(from: ProductRevisionStatus, to: ProductRevisionStatus): void
transitionProductVisibility(tx, input: { productId; expected: ProductStatus[]; next: ProductStatus; actor: 'author' | 'admin' | 'media' }): Promise<void>
publishRevision(tx, input: { productId; revisionId; expectedPublishedRevisionId; expectedRevisionAt }): Promise<'published' | 'stale'>
```

- `transitionProductVisibility` проверяет таблицу видимости для `actor`, делает
  `updateMany({ where: { id, status: { in: expected } } })` и требует `count === 1`,
  иначе `AppException` (`conflict` с кодом, не строкой).
- `publishRevision` — перенос записи из `switchPublication` (CAS + поля
  `publishedProductData`); статус работы меняет так: `PENDING_REVIEW → APPROVED`,
  `APPROVED → APPROVED`, `ARCHIVED → ARCHIVED` (решение §3.3).
- Удалить `product-revision-state.ts`, перенеся тесты.

Приёмка: `rg -n "status: '(APPROVED|ARCHIVED|PENDING_REVIEW|REJECTED|DRAFT)'" apps/api/src -g '!*.spec.ts' -g '!product-publication.ts'`
показывает только чтения (`where`), ни одной записи `data: { status`. Аналогично
`publishedRevisionId:` в `data` — только в `product-publication.ts`.

### B2 — Писатели переходят на модуль

1. Submit, hide/unhide (`products.service.ts`), решение админа
   (`admin-moderation.service.ts`), `switchPublication` (ветка работы) вызывают
   функции B1. Логика выбора «что делать» остаётся у вызывающего; «как записать
   и что разрешено» — у модуля.
2. Решение админа больше не грузит неиспользуемые лоты: либо вызывает
   `assertProductNotInSale` там, где это нужно по смыслу (архивирование работы
   админом), либо не грузит их вовсе.
3. Публикация с медиа и без даёт одинаковый результат для скрытой работы (§3.3).

### B3 — Один хелпер «в продаже» и один предикат публичности

1. `assertProductNotInSale(tx, productId)` в `product-write-guard.ts`;
   `assertProductWritable` и `requireEditableOwner` вызывают его;
   `requireEditableOwner` больше не дублирует `assertProductWritable` — либо
   вызывает его, либо удаляется.
2. Блокировка автора (`sellers.service.ts` 475–490) — через тот же запрос лотов
   (вынести `findActiveSaleProductIds(tx, sellerId)` рядом с хелпером, если
   нужен набор по автору).
3. `ImagesService.get` использует предикат из `public-visibility.ts`; дубль
   предиката удалён.
4. Код ошибки `PRODUCT_IN_SALE` в `packages/contracts/src/error.ts` и маппинг в
   `error-response-mapper.ts` (HTTP 409).

Приёмка: `rg -n "'SCHEDULED'|'LIVE'" apps/api/src -g '!*.spec.ts'` → только
`product-write-guard.ts`; `rg -n "portfolioDirectProductWhere" apps` → пусто
(если предикаты были идентичны).

## 7. Фронтенд

### F1 — Текст ошибки

Переиспользовать: существующий маппинг кодов API в тексты (найти место, где
`apps/mobile` превращает `ApiErrorCode` в сообщение).
Создавать: ничего, кроме строки для `PRODUCT_IN_SALE`: «Работа сейчас в продаже.
Снимите лот, чтобы изменить или скрыть её».

## 8. Тесты и проверки

### T1

- Новый owner-спек `apps/api/src/products/product-publication.spec.ts`:
  `it.each` по всем парам `from × to × actor` для обеих таблиц (разрешено /
  запрещено); `publishRevision` для `PENDING_REVIEW`, `APPROVED`, `ARCHIVED` и
  устаревшего CAS.
- Интеграция (существующие спеки модерации и медиа): скрытая работа с новой
  ревизией после одобрения остаётся скрытой и показывает новую ревизию после
  «показать» — в режимах с медиа и без (`it.each`).
- Интеграция: скрытие/правка/загрузка фото/архивирование админом работы с лотом
  `LIVE` → `PRODUCT_IN_SALE` (лот создаётся прямой записью в БД, API лотов ещё нет).
- Публичность картинки: для каждого состояния (работа скрыта, автор не одобрен,
  пользователь заблокирован, фото не из опубликованной ревизии) `GET` картинки и
  каталог согласны (`it.each`).
- Удалить спеки `product-revision-state` после переноса случаев.

Не трогать: `admin-moderation-pagination.integration.spec.ts`,
`products.service.spec.ts` (кроме мест, где менялись сигнатуры),
`media-lifecycle.integration.spec.ts`.

### D1 — Документы и проверки

- `10-CODE-ARCHITECTURE.md`: владелец переходов работы, хелпер «в продаже»,
  один предикат публичности.
- `11-PROJECT-STATUS.md`: одна запись.
- Проверки: `typecheck`, `lint` для `@bidplace/api`, `@bidplace/contracts`,
  `@bidplace/mobile`; API unit + интеграция (модерация, медиа, продукты, изображения);
  `git diff --check`; `pnpm docs:link-check`.

## 9. Промпт ревьюеру

```text
Прочитай docs/launch/AGENT-RULES.md §6 и этот файл. Ревью ветки
fix/publication-state-owner против main. Сам выполни команды rg из приёмки B1 и B3,
прогони указанные тесты. Вердикт по AGENT-RULES §6.
```

Инварианты:
- запись статуса работы и `publishedRevisionId` — только в `product-publication.ts`;
- каждая запись условная (`expected` + `count === 1`) и внутри транзакции с
  блокировкой строки работы;
- вопрос «в продаже?» — только `assertProductNotInSale`;
- публичность картинки = публичность работы (один предикат);
- единственное изменение поведения — §3.3.

Красные флаги: новый «сервис статусов» с DI и интерфейсом вместо трёх функций;
таблица переходов разрешает больше, чем раньше; `ConflictException` со строкой в
новых местах; тесты, которые проверяют вызовы внутренних функций вместо
результата в БД; затронут профиль автора сверх проверки лотов.
