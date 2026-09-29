# Аудит на упрощение: меньше механизмов, а не больше abstractions

Дата: 2026-09-29. Production не изменён. План и статусы — только в [roadmap](00-EXECUTION-ROADMAP.md).

Цель прохода: найти ответственность, которую можно убрать, состояние, которое можно вычислить, и требования, отказ от которых убирает целый класс гонок. Установка библиотеки сама по себе не считается упрощением.

## Границы и критерии

- Production baseline: `fix/owner-editor-state` @ `69c4aff0bcef40bdefeb853f44317f32bdc7a15c`. Незакоммиченные corrections в этом worktree обнаружены; editor state/screen проверены через `git show 69c4aff:...`. Эти corrections не оценивались и worktree не редактировался.
- Остальные прочитанные файлы на момент проверки не имели local diff. Основной checkout используется только для записи audit documents.
- Прочитаны product foundation/RFC/status, relevant architecture/design flows; применены review/code-review-best-practices и security. Сначала production и consumers, затем tests, затем сверка с прошлым аудитом.
- Это целевой проход: editor, search/catalog, media, moderation UI, validation, mail, transactions и commerce inventory. Не полная повторная проверка backend.
- Успех будущего refactor: меньше независимых владельцев состояния и путей исполнения при тех же обязательных сценариях. Перенос 500 строк в пять hooks без устранения ответственности успехом не считается.
- **Durable fix:** удалить избыточный owner/механизм или заменить его существующим framework lifecycle. **Acceptable workaround:** extraction ради читаемости при сохранении всех владельцев. **Hack:** удалить guard/тест, поставить timeout или спрятать ошибку, чтобы упростить diff. Последнее не рекомендуется.

## 1. Наибольший выигрыш требует небольшого продуктового решения

### L02 / A06: блокировать ввод на время обычного Save

**Не новый defect. Вариант для R33, затем R15/R16. Confidence HIGH по причине сложности; MEDIUM по суммарному выигрышу.**

Точные точки: `features/sellers/product-draft-screen.tsx :: persistCurrentForm, rememberSavedProduct`; `seller-profile-screen.tsx :: save, rememberSavedProfile`; `reconcile-saved-fields.ts :: persistedFieldOverrides`.

Сейчас обычный Save допускает ввод B, пока snapshot A сохраняется. После ответа требуется сравнить submitted/current/persisted, применить server normalization, восстановить более новые поля через `setValue`, пересчитать dirty baseline и не очистить более новое фото. Сам helper короткий; сложность находится в его lifecycle и callers.

**Рекомендация на обсуждение:** для текущих коротких author/Work forms блокировать все изменяемые поля и picker на время Save, сохраняя введённые значения при ошибке. Тогда successful save может делать обычный RHF `reset(savedValues)` и очищать только сохранённый selection. Обычный Save и save-before-transition используют одну policy записи; transition остаётся отдельным продолжением.

Это меняет зафиксированное поведение `docs/design/02-USER-FLOWS-AND-SCREENS.md` (строки 209–214, 242–246 на baseline), поэтому **не разрешено к implementation без принятия UX-решения**. Цена: во время медленного запроса нельзя продолжать ввод. Альтернатива — оставить текущую возможность и признать reconciliation необходимой, а не «лишним кодом».

**Что не исчезает:** synchronous duplicate guard, session epoch, защита stale reads, validation/error UI, server locks, pending-review lock и photo picker identity. Блокировка ввода сама по себе не решает смену аккаунта и запоздалый ответ.

Критерии выбора: приемлемость временно read-only формы на slow network, доступность recovery после timeout/failure, сохранение dirty input при ошибке. Проверки: double click, failed save/retry, normalization, photo upload failure, logout/session switch. Не заменять reconciliation только `keepDirtyValues`: это другая семантика.

### A03 / A06: вернуть подтверждённую revision identity из Work submit

**Вариант для R24/R33; Plan, не локальная правка cache. Confidence HIGH.**

`apps/api/src/products/products.service.ts :: submit` уже читает `submittedRevision` в transaction. Но `productResponseSchema` возвращает только `{ product }`; `toOwnerContractProduct` копирует content полей revision в Product, сохраняя `updatedAt` parent. Клиентский `product-draft-screen.tsx` отдельно держит `submittedRevision`, ожидает detail refetch и определяет, является ли последующее решение новым.

Более простая граница: сервер возвращает подтверждённые `{id, version, status, updatedAt}` editing revision либо полный owner detail envelope. Клиент обновляет один канонический query record по фактическому результату submit. Это уменьшает необходимость угадывать pending по pre-save snapshot и содержать параллельный hold.

Сравнить два варианта: additive revision metadata (меньше payload, остаётся узкий merge) и общий read/write owner envelope (проще cache, больше contract coupling). Удаление local hold разрешено только после доказательства эквивалентности. Старые reads всё ещё требуют cancellation/version policy; нельзя просто записать `{product}` поверх detail envelope. Locks, transaction, public projection и review transitions сохраняются. Это полезно и будущим продажам: revision identity не должна выводиться из часов parent.

### A04: упростить уход с dirty формы можно только выбором UX

В `product-draft-screen.tsx` совместно работают `usePreventRemove`, pending navigation callback и ручной browser history guard. Если оставить автоматическое save-before-Back, эта координация имеет реальную задачу.

В R25 сравнить текущий контракт с явным «Сохранить / Остаться / Уйти без сохранения» для поддерживаемых in-app переходов и штатным browser unload warning. Это **изменение flow**, не готовая замена Expo API для всех Back/Forward. Не утверждать, что `beforeunload` перехватывает SPA navigation. Не добавлять новый history adapter, пока не решено, нужен ли auto-save на каждом уходе. Поведение пока сохраняется.

## 2. Новые узкие opportunities без изменения продукта

### C07 — status мутации хранится второй раз в React state

**P3 · HIGH · Wave 4 / R35.**

**Файл/символ:** `apps/mobile/src/features/admin/admin-moderation-screen.tsx:99 :: productAction, mutateProductStatus` и error copy около строки 778.

`setProductAction(input.status)` копирует `productStatus.variables.status`; состояние используется только для выбора текста ошибки. Отдельные reset выполняются при открытии confirmation и после seller mutation. Это дополнительный owner, который приходится синхронизировать с mutation lifecycle.

**Доказательство:** все три product-action callers проходят через `mutateProductStatus`; единственный read `productAction` — ветка error message. В установленном Query Core 5.101.2 `pending` сохраняет variables, `error` сохраняет их через spread предыдущего state.

**Удалить / заменить:** `productAction` state и его setters → `productStatus.variables?.status` в error branch. Сохранить `productStatus.reset()`, confirmation и `moderationReason`, которые имеют собственную задачу. Не строить generic moderation command framework.

**Риск LOW:** проверить текст approve/reject/change failure, повтор после ошибки и переключение confirmation. Это не подтверждённый текущий bug; выигрыш — один owner вместо двух. Можно включить в один небольшой пакет R35, отдельным commit.

### L06 — смену image identity обслуживает ручная синхронизация state

**P3 · MEDIUM · Wave 4 / R35.**

**Файл/символ:** `apps/mobile/src/components/ui/ResilientRemoteImage.tsx:67–81 :: ResilientRemoteImage, useMediaRecovery`.

На смену `uri` сейчас одновременно реагируют `currentUriRef`, `isCurrentUri`, временный `visibleRecovery`, reset effect и recovery state с собственным uri. Они нужны потому, что один экземпляр внутреннего state обслуживает разные изображения.

**Предлагаемая замена:** тонкий public wrapper + внутренний компонент с `key={uri}`. React remount задаёт lifetime recovery state конкретному image identity; cleanup снимает старые timers. Удалять только uri-reset plumbing, которое стало лишним. Синхронный ref для нескольких callbacks одного attempt может остаться.

**Сохранить:** существующие 1/3/8-секундные retries, exhausted/manual retry, cache bust, placeholder, decoding events, reduced-motion/transition props и accessibility. Это не предложение удалить `ResilientRemoteImage`, retry policy или заменить его на Query Blob cache.

**Почему проще:** framework управляет lifetime, вместо двух представлений текущего URL. **Риск MEDIUM:** visual remount/recycling и late callbacks; runtime prototype нужен до удаления guards. Проверки на настоящем компоненте: URL A→B, timer A после B, unmount, retry exhaustion, manual retry, successful load, одинаковый URL без сброса. Pure `media-recovery` tests недостаточны. Если компонентная замена требует новых counters/effects, отклонить вариант.

### C08 — промежуточные helpers без самостоятельной ответственности

**P3 · HIGH · Wave 4 / R35; test cleanup вместе с production.**

1. `features/search/panes/search-pagination.ts :: searchPaginationView` только переименовывает query flags в `{nextPage:{label,loading}}` и возвращает те же items. Два consumers — `WorksSearchPane` и `AuthorsSearchPane`. Каталоги уже непосредственно рендерят `hasNextPage`/`isFetchingNextPage`. Удалить этот view-model слой, использовать query flags в двух коротких JSX местах. Не заменять новым generic pagination component без иной пользы.
2. `features/search/search-query.ts :: scheduleDebouncedCallback` имеет один production caller — `useDebouncedValue`. Убрать отдельный exported wrapper вокруг `setTimeout/clearTimeout`, оставить timeout и cleanup внутри hook. **Сам debounce сохранить:** `useDeferredValue` не ограничивает частоту network requests и не является эквивалентом 300 мс.
3. `apps/api/src/core/validation/parse-body.ts` и `parse-query.ts` выполняют одинаковые `schema.safeParse` и `createValidationException`. При следующем касании validation оставить одну реализацию с двумя смысловыми exports, если они полезны callers. Не переписывать controllers на новый pipe framework ради этих 15 строк. Этот micro-cleanup можно отложить; ценность ниже первых двух.

**Риск LOW, для validation MEDIUM:** сохранение точных error envelopes/Zod output types обязательно. Сначала production consumers, затем удаление helper-only assertions. Новые tests должны проверять реальный hook debounce/unmount и pane load-more, а не воспроизводить новую форму object literal. Совместный R35, не отдельный PR на каждый wrapper. Не относится к commerce archive.

## 3. Проверенные места, которые пока не стоит «упрощать»

- `CatalogFilterSheet`/`FilterSortSheet`: local draft нужен по утверждённому Apply/Cancel contract. JSON roundtrip для committed values выглядит тяжеловесно, но его устранение не оправдывает новый generic form/store. Если возвращаться к нему — сохранить reset на reopen и external URL change, не remount-ить весь dialog с потерей exit animation/focus. Отдельную задачу пока не добавляю.
- `usePortfolioWorks` и `usePortfolioAuthors`: похожие небольшие hooks нормально выражают разные ресурсы. Generic `useCatalog<Resource,Filter,Mapper>` добавит параметров больше, чем уберёт логики. `uniqueCatalogItems` полезен при page-based pagination и изменении данных между запросами.
- `SearchOverlayProvider`: query/tab/open уже выводятся из URL. Не нужен второй store и новая router library. Back restoration и focus — реальная обязанность, не мёртвая обвязка.
- `ShareSheet`: effect QR generation и один локальный error/retry state достаточно просты; не переводить каждый Promise в Query ради единообразия.
- L05 из прошлого прохода остаётся низкоприоритетной возможностью: Query для admin media оправдан, только если упрощает реальные consumers. Если добавляет Blob-cache ownership и ещё один cleanup lifecycle, оставить существующий scoped effect.
- `MailTransport`: local/SMTP — два реальных режима, общий SMTP builder использован. Это не две параллельные mail-системы, удалять слой ради прямого вызова nodemailer не нужно.
- `runSerializableTransaction`/`runReadCommittedTransaction`, Zod boundary validation, narrow Prisma selects, row locks и `hasBlockingListing`: сохранять. Размер guard не доказывает лишность.

## 4. Задел аукционов и прямой продажи: сохранить для переиспользования

Пожелание пользователя в этом проходе: аукционы и прямая продажа добавляются в ближайшей следующей волне; учитывать существующий задел, не удалять его как ненужный portfolio runtime. Это **не** команда восстановить модули сейчас или утвердить детали будущих торгов.

Проверено наличие archive commit `19eb40eaa867120f0498c31088dc01605d8cbf6d` (документирован как `feature/commerce-runtime-archive`). Ниже inventory кандидатов на reuse, **не сертификат готовности старого кода**.

| Задел                                                     | Где сохранён                                                                                           | Как использовать позже / что перепроверить                                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Listing/Bid/Order и исторические данные                   | Текущий `packages/database/prisma/schema.prisma`, migrations                                           | Сохранить; проверить additive evolution под auction + fixed price, Work-level double-sale constraints                               |
| Product write guards, seller capability, listing blockers | Текущие `products/product-write-guard.ts`, `sellers/seller-capability.ts`, portfolio/admin/image paths | Переиспользовать инварианты; не удалять ссылки на активные listings из текущих guards                                               |
| Listing lifecycle, bid eligibility/aliases, bids          | Archive `apps/api/src/listings`, `lifecycle`, `bids`                                                   | Извлечь подходящие правила/тесты; перепроверить seller/revision ownership, transaction/idempotency и актуальные contracts           |
| Order snapshot, winner order, contact deadlines           | Archive `apps/api/src/orders`                                                                          | Переиспользовать snapshot/privacy patterns; auction winner не является fixed-price purchase path, сроки не переносить автоматически |
| Listing/Bid/Order Zod contracts                           | Archive `packages/contracts/src/listing.ts`, `bid.ts`, `order.ts`                                      | Сверить с будущим Work/Listing/Order контрактом; не публиковать старые exports автоматически                                        |
| Realtime/activity                                         | Archive `apps/api/src/realtime`, `activity`                                                            | Сохранить как источник; подключать только при конкретных realtime требованиях, с повторной auth/delivery проверкой                  |
| Commerce inventory                                        | Текущий `scripts/ops/commerce-inventory.mjs`                                                           | Сохранить read-only инструмент; не запускать на неизвестной БД ради аудита                                                          |

Текущая schema содержит `ListingType.AUCTION`; наличие archive **не означает готовую прямую продажу**. Owner будущих форматов — `docs/product/15-POST-MVP-BACKLOG.md`, §2. Общая Work identity, права, snapshots и защита двойной продажи полезны обоим форматам. Ставки, завершение аукциона и выбор победителя специфичны для auction и не должны усложнять fixed-price flow.

R09/R10/R26 должны отличать **избыточность внутри действующего механизма** от **намеренно отложенного commerce**. Сохранить archive commit, миграции, исторические данные и понятный reuse inventory. Сохранение задела не требует подключать dormant endpoints в active AppModule.

## 5. Тесты и проверка этого прохода

После production просмотрены `media-recovery.spec.ts`, `search-query.spec.ts`, `search-pagination.spec.ts`, catalog query specs и browser Apply assertions. Выводы C08 подтверждаются тем, что pagination test проверяет переупаковку flags, а debounce test вызывает wrapper вместо React hook и не доказывает effect cleanup при смене value/unmount.

Выполнено на Node v22.20.0 из `apps/mobile` owner-editor worktree, без cache:

```sh
node ../../node_modules/vitest/vitest.mjs run src/components/ui/media-recovery.spec.ts src/features/search/search-query.spec.ts src/features/search/panes/search-pagination.spec.ts --no-cache
```

**3 файла, 9 tests passed.** Это baseline существующих helpers, не доказательство корректности предложенного refactor. Компонентный prototype, full suite, browser/native и DB не запускались. Файлы worktree не изменялись.

## Практический порядок

1. Выбрать, нужен ли ввод во время Save (R33/L02). Это потенциально самый полезный способ убрать механизм, а не перенести его.
2. Выбрать authoritative Work submit response (R24/A03 + R33/A06). Это улучшение границы, полезное portfolio и commerce.
3. Один небольшой пакет R35: C07, C08, затем L06 только при успешном component prototype. Не растягивать три маленьких cleanup на цепочку review.
4. Сохранить работающие guards и старые regressions до доказанной эквивалентности; browser history отдельно R25.
5. Не делать universal form engine, generic repository, глобальный event bus или новую state-management библиотеку. Не переделывать стабильные простые effects только ради использования установленной зависимости.
