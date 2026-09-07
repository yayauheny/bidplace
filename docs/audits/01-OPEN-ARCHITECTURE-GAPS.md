# bidplace — архитектурные пробелы: portfolio MVP и отложенный commerce

Дата актуализации: 2026-09-08

## Текущий статус

`DEC-082` перенёс commerce из первого запуска. Существующие A01–A09 ниже сохранены как
полный анализ **второй commerce wave** и не блокируют portfolio MVP. Их нельзя удалять
или реализовывать до отдельного решения открыть commerce.

Первый MVP сейчас имеет пять архитектурных блокеров:

| ID | Пробел | Durable target |
|---|---|---|
| P01 | Commerce нельзя безопасно выключить одним скрытием UI | Server-authoritative capability закрывает UI, API, jobs и public projections; default off |
| P02 | Approved Work нельзя удобно обновлять как живое портфолио | Pending revision отдельно от последней published revision; moderation атомарно продвигает новую версию |
| P03 | Binary media/storage boundary не готов к публичному портфолио | Object storage + metadata/renditions in DB + authorization/cleanup/backup/restore |
| P04 | Public Creator/Work contracts несут sale-oriented поля и состояния | Portfolio projections не зависят от Listing/Order; private moderation states не утекают публично |
| P05 | Auth surface содержит потенциальные варианты без ценности посетителя | Existing email/password для author/admin; OAuth/magic code/buyer-only account actions выключены до отдельного value case |

Выбор конкретной schema/migration выполняется задачами F01–F10 из First MVP backlog.
Нельзя использовать portfolio pivot для удаления исторических Bid/Order данных или
ослабления существующих security invariants.

Дата исходного commerce-аудита: 2026-09-07
Статус разделов A01–A09: deferred; варианты сохранены до commerce wave
Основа: текущий runtime и
[`MVP deal decision stress-test`](../research/2026-09-06-MVP-DEAL-DECISION-STRESS-TEST.md)

## Как использовать этот файл

Ниже сохранены архитектурные вопросы, обнаруженные до реализации Work-first commerce,
fixed sale, buyer offer и нового handoff. Реализованная архитектура остаётся в
[`10-CODE-ARCHITECTURE.md`](../product/10-CODE-ARCHITECTURE.md), продуктовые варианты —
в [`14-OPEN-MVP-DECISIONS.md`](../product/14-OPEN-MVP-DECISIONS.md).

Поле `Рекомендуемое направление` помогает обсуждению, но не считается выбранным
решением без ссылки на `DEC-*`. `DEC-079`–`DEC-081` закрыли часть commerce-границ, а `DEC-082` перенёс весь этот
контур после First MVP. Варианты нельзя переносить в schema/API до решения открыть
commerce и обновлённого Work-first contract.

## Короткая карта

| ID | Пробел | Статус выбора | Когда блокирует |
|---|---|---|---|
| A01 | Нет Work-level инварианта продажи | Founder preference: A; проверить модель после Task 10 | До fixed/offer schema |
| A02 | Order привязан только к Bid | Format-neutral Order подтверждён; persistence shape открыт | До fixed/offer schema |
| A03 | Seller единолично завершает handoff | Открыто до исследования | До нового handoff API |
| A04 | Replacement создаёт Order без согласия runner-up | Открыто до исследования | До second chance |
| A05 | Старые Orders используют live fallback | Выбран controlled test reset (`DEC-081`) | До public pilot |
| A06 | Нет evidence раскрытия контактов | Предпочтение: automatic reveal сторонам Order; research/legal gate | До public pilot/legal UX |
| A07 | Нет durable in-app notifications | Отложено после MVP; Task 10 проверяет минимальный канал результата | После MVP либо раньше по evidence |
| A08 | Не определена граница Work content и sale state | Основной lifecycle подтверждён; edit/remoderation открыты | До Work-first contract |
| A09 | Нет узкого transaction-dispute contract | Общие reports отложены; Order problem flow остаётся MVP | До handoff contract |

## A01 — единая доступность Work для продажи

### Текущее состояние

PostgreSQL запрещает один активный `SCHEDULED/LIVE` Listing на Product и один
не-`CANCELLED` Order на Listing. Ограничения не связывают Orders разных Listing одной
Work. После relist или конкурентного fixed/offer действия одной Work потенциально
соответствуют несколько действующих сделок.

Успешно переданную уникальную Work также требуется навсегда закрыть от повторной
продажи. Partial unique только по активным Orders этого не обеспечивает.

### Варианты

**A — Work state + Work ID в Order.** Добавить явное commerce state Work, сохранить
`workId` в Order и поставить DB constraint/index для blocking deal states. Все действия
fixed purchase, offer acceptance, auction close, second chance и relist блокируют одну
строку Work. `COMPLETED` переводит Work в `SOLD`; подтверждённый buyer-side failure
возвращает её в доступное состояние.

- Плюсы: небольшая модель, быстрые проверки и прямой DB invariant.
- Минусы: список blocking/terminal статусов должен быть одинаковым в schema и domain
  contract; migration сложнее при уже существующих реальных Orders.

**B — отдельный WorkCommerceSlot.** Одна строка на Work хранит commerce state,
текущий Listing и текущий Order. Все commerce actions блокируют эту строку.

- Плюсы: единая точка сериализации, проще расширять резервами и несколькими форматами.
- Минусы: дополнительная сущность, связи и recovery logic для MVP.

**C — только проверки в сервисах.** Перед созданием Order искать другие сделки и
полагаться на serializable transaction.

- Плюсы: минимум schema changes.
- Минусы: новый write path легко забудет проверку; без DB constraint ошибка становится
  двойной продажей. Вариант недостаточно надёжен.

### Рекомендуемое направление

Founder preference — вариант A. Task 10 и Work-first contract должны проверить, не
создаёт ли выбранный набор состояний ложную блокировку relist. Правильный invariant
запрещает параллельную/повторную продажу `SOLD`, но возвращает Work в доступное
состояние после отсутствия продажи или подтверждённого buyer-side failure.

### Что ещё нужно решить

- Точный список состояний, блокирующих новый Listing.
- Может ли admin исправить ошибочно поставленный `SOLD`, не переписывая историю.
- Требует ли seller-side failure повторной модерации Work перед relist.

## A02 — источник и snapshot Order

### Текущее состояние

`Order.sourceBidId` обязателен и уникален. Это подходит только для аукциона. Создать
fixed Order или Order из accepted buyer offer без фиктивной ставки нельзя. Snapshot
сохраняет базовые поля сделки, но будущим форматам также понадобятся sale mode,
правила и evidence подтверждения.

### Варианты

**A — общий DealIntent/PurchaseIntent.** Auction close, fixed confirmation, accepted
buyer offer и accepted second chance сначала дают одну format-neutral запись намерения
заключить сделку. Order имеет одну обязательную ссылку на accepted intent; Bid и Offer
остаются evidence своих механизмов, а не обязательными полями каждого Order.

- Плюсы: один Order contract и FK, одинаковые idempotency/acceptance правила, чистая
  точка расширения для будущих форматов.
- Минусы: новая сущность и риск превратить intent в слишком универсальную таблицу с
  большим количеством условных полей.

**B — typed origin tables.** Общий Order хранит `originType`, а детали лежат в одной
из таблиц `AuctionOrderOrigin`, `FixedOrderOrigin`, `OfferOrderOrigin` с уникальным
`orderId` и CHECK/trigger, который допускает ровно один origin.

- Плюсы: сильная referential integrity и отсутствие nullable source-полей в Order.
- Минусы: больше таблиц, сложнее Prisma queries и добавление каждого нового формата.

**C — nullable typed sources в Order.** `sourceType` и nullable уникальные
`sourceBidId`, `sourceBuyerOfferId`, `sourceSecondChanceId` с DB CHECK: заполнен ровно
один подходящий источник.

- Плюсы: прямые FK и простые запросы для известных форматов.
- Минусы: Order накапливает привязки; новый формат требует колонку и migration.

**D — создавать synthetic Bid.** Fixed и offer маскируются под ставку.

- Плюсы: почти не меняет Order.
- Минусы: портит историю торгов, аналитику и юридический смысл. Вариант является hack.

### Рекомендуемое направление

`DEC-080` уже подтверждает один общий Order/publicId и запрещает synthetic Bid.
Предварительно вариант A лучше соответствует желанию не привязывать Order к каждому
механизму продажи. Task 10 должен установить, какие business facts и evidence требуют
реальные площадки; затем технический Work-first contract сравнит A, B и C по
referential integrity, Prisma complexity, performance и расширению к editions/quantity.

### Что ещё нужно решить

- Какие версии пользовательского соглашения и action-specific правил входят в
  snapshot/evidence.
- Нужен ли отдельный public ID intent либо пользователю достаточно кода Order.
- Может ли DealIntent остаться компактным без JSON, nullable-поля на все будущие
  форматы и дублирование Bid/Offer state machines.
- Финальный набор origin types после решения D01–D03.

## A03 — подтверждение результата handoff

### Текущее состояние

Seller API единолично переводит Order в `CONTACTED`, `COMPLETED` или
`HANDOFF_FAILED`. Buyer не подтверждает результат. `HANDOFF_FAILED` влияет на замену
покупателя, поэтому это не просто визуальный статус.

### Варианты

**A — отдельный OrderOutcomeClaim.** Каждая сторона подаёт claim `COMPLETED` или
`FAILED` с actor, reason и timestamp. Совпавшие claims завершают Order; конфликт или
молчание второй стороны уходит в auditable admin resolution.

- Плюсы: полная история заявлений, чистая работа со спорами и будущим рейтингом.
- Минусы: отдельная сущность, admin queue и больше UI states.

**B — поля подтверждений в Order.** Хранить seller/buyer completion/failure timestamps
и reasons непосредственно в Order; admin resolution — дополнительные поля.

- Плюсы: меньше таблиц и проще MVP queries.
- Минусы: Order быстро разрастается; повторные/изменённые заявления и спорная история
  моделируются хуже.

**C — оставить односторонний terminal status с апелляцией.**

- Плюсы: минимум изменений.
- Минусы: продавец может освободить Work после невыгодного аукциона; покупатель может
  потерять результат до рассмотрения жалобы. Вариант создаёт прямой abuse path.

### Рекомендуемое направление

Предварительно вариант A. Task 10 должен проверить его против более лёгкого
self-service flow: две совпавшие отметки закрывают обычный случай, timeout сам не
освобождает Work, а admin получает только конфликт или длительное молчание.
`CONTACTED` можно оставить односторонним marker, поскольку он не освобождает Work.

### Что ещё нужно решить

- Через сколько времени claim без ответа попадает администратору.
- Какие причины seller-side/buyer-side допустимы и какие из них разрешают relist.
- Что вправе считать доказательством администратор; требуется ответ юриста.

## A04 — безопасный second chance

### Текущее состояние

Admin replacement принимает конкретный `bidId` и сразу создаёт новый Order после
отмены старого. Runner-up не подтверждает новую сделку. История исходного Order
сохраняется, но согласие нового покупателя и безопасный contact release отсутствуют.

### Варианты

**A — отдельный SecondChanceInvitation.** Сервер выбирает runner-up по immutable
ranking, автор отправляет одно приглашение, runner-up принимает или отклоняет. Только
acceptance создаёт новый Order и раскрывает контакты.

- Плюсы: прозрачная семантика, явное согласие, нет переписывания результата аукциона.
- Минусы: отдельная state machine и уведомления.

**B — общий Offer с обязательным type.** Buyer offer и second chance используют одну
таблицу, но имеют разные направления, цены и разрешённые transitions.

- Плюсы: меньше таблиц и общие expiry/idempotency primitives.
- Минусы: легко смешать юридически разные действия и получить сложные nullable поля.

**C — текущий direct admin replacement.**

- Плюсы: уже реализован как emergency path.
- Минусы: новый покупатель получает Order без подтверждения; admin может выбрать не
  runner-up. Не подходит как публичная механика.

### Рекомендуемое направление

Предварительно вариант A. Текущий replacement оставить только временным admin recovery
до выбора публичного flow. Task 10 отдельно сравнивает runner-up, очередь, выбор автора
и новый Listing; ни один из вариантов пока не утверждён.

### Что ещё нужно решить

- Принять ли рекомендацию T07: только runner-up, 24 часа, одна попытка.
- Какие buyer-side failure reasons открывают это действие.
- Подтвердить у юриста, что acceptance создаёт новое обязательство.

## A05 — immutable history и старые snapshot-поля

### Текущее состояние

Новые Orders фиксируют title, currency и Work public ID. Старые nullable snapshots
читаются через fallback на изменяемые Product/Listing, поэтому отображаемая история
может измениться после редактирования карточки.

### Варианты

**A — очистить disposable test data.** Перед public pilot удалить тестовые Orders и
после этого сделать snapshot обязательным; production fallback убрать.

- Плюсы: честая граница данных и простая migration.
- Минусы: теряются демонстрационные записи.

**B — проверяемый backfill.** Сохраняемые реальные Orders восстановить только из
immutable audit/source evidence и отметить reconstructed provenance.

- Плюсы: сохраняет реальные данные.
- Минусы: ручная проверка; для части строк достоверного источника может не быть.

**C — оставить live fallback.**

- Плюсы: нет migration.
- Минусы: историческая сделка меняется вслед за Work. Для production неприемлемо.

### Рекомендуемое направление

Выбран вариант A (`DEC-081`): все текущие строки подтверждены как локальные и тестовые.
Controlled reset выполняется отдельной задачей перед public pilot; до него runtime
fallback остаётся фактом кода, а не разрешённой production policy.

### Что ещё нужно решить

- Определить точный reset/preflight procedure и момент удаления fallback.
- Получить у юриста retention period для будущих Orders, claims и audit evidence.

## A06 — раскрытие контактов и evidence

### Текущее состояние

Контакты замораживаются в Order и выдаются через role-scoped projection. Отдельного
события, которое показывает, кто и когда фактически открыл контакты, нет. Правовое
основание и точный набор раскрываемых полей остаются у юриста.

### Варианты

**A — явный reveal endpoint.** Пользователь нажимает `Показать контакты`; сервер ещё
раз проверяет участие в Order, пишет append-only audit event и возвращает разрешённые
поля.

- Плюсы: точное evidence, понятный UX и минимальное раскрытие.
- Минусы: дополнительное действие и endpoint.

**B — автоматическое раскрытие при первом Order GET.** Первый успешный ответ пишет
audit, следующие остаются idempotent.

- Плюсы: меньше действий пользователя.
- Минусы: обычная загрузка экрана становится юридически значимым раскрытием; сложнее
  retries, prefetch и caching.

**C — продолжать возвращать контакты без reveal audit.**

- Плюсы: текущий простой flow.
- Минусы: есть только факт создания Order, но нет evidence доступа к данным.

### Рекомендуемое направление

Founder preference — автоматическое раскрытие разрешённого контакта сторонам Order без
дополнительной кнопки, если правило `кто пишет первым` показано до ставки/покупки и
действие пользователя включает необходимое согласие. Это ближе к варианту B, но Task
10 и юрист должны проверить минимальный набор данных, evidence и влияние prefetch/
повторных GET. До этого не фиксировать contract или microcopy.

### Что ещё нужно решить

- Какие контакты видит каждая сторона и кто должен инициировать связь.
- Нужен ли отдельный action consent перед раскрытием.
- Срок доступности контактов после failed/cancelled outcome.

## A07 — надёжные уведомления о commerce events

### Текущее состояние

Lifecycle и сервисы фиксируют business state в БД, но нет общей durable outbox для
Order created, offer accepted/declined/expired, contact reminder, failure claim и
second chance. Прямой email или realtime после commit может потеряться при сбое.

### Варианты

**A — transactional outbox.** Business transaction добавляет event в outbox; worker
доставляет in-app/email/realtime с retry и idempotency.

- Плюсы: состояние и обязательное уведомление не расходятся; единый audit delivery.
- Минусы: worker, cleanup, monitoring и retry policy.

**B — периодический reconciliation job.** Job ищет business rows без notification
receipt и досылает сообщения.

- Плюсы: проще внедрить поверх существующих таблиц.
- Минусы: задержка, сложные запросы и отдельные marker fields на каждом flow.

**C — отправлять непосредственно из request/lifecycle.**

- Плюсы: минимум инфраструктуры.
- Минусы: падение между commit и send теряет уведомление; retry может создать дубль.

### Рекомендуемое направление

In-app notification center отложен после MVP (`DEC-081`) и является одним из первых
кандидатов следующей волны. Task 10 должен установить, нужен ли до запуска минимальный
transactional канал для результата аукциона, accepted offer и second chance. Если
нужен, отдельно выбрать outbox или reconciliation; полноценный notification center
из этого не следует.

### Что ещё нужно решить

- Какие события обязательны in-app, какие дублируются email.
- Retry/retention policy и кто наблюдает dead-letter failures.
- Один scheduler/worker или безопасная multi-instance обработка.

## A08 — граница Work, Listing и sale state

### Текущее состояние

Product совмещает карточку Work и часть публикационного lifecycle. Work-first требует
портфолио без продажи, позднее attach/relist Listing, архив и постоянный `SOLD` после
успешной передачи. Не определено, какие поля можно менять при активной продаже и что
происходит с pending offers при изменении карточки.

### Варианты

**A — стабильная Work + отдельный sale snapshot.** Work проходит собственную
модерацию. Listing в `DRAFT` фиксирует sale parameters; при публикации создаётся
immutable sale snapshot. Существенные изменения требуют cancel/relist. Несущественные
поля Work не меняют историю активной продажи.

- Плюсы: ясное разделение портфолио и commerce; история сделки стабильна.
- Минусы: нужно определить существенные поля и показывать различие текущей Work и
  snapshot.

**B — versioned Work revisions.** Каждое изменение создаёт ревизию, Listing ссылается
на конкретную версию.

- Плюсы: полная provenance-модель.
- Минусы: заметно больше schema, moderation и UI для MVP.

**C — разрешить live edits и аннулировать offers.**

- Плюсы: автору проще исправлять карточку.
- Минусы: сложные уведомления, спор об условиях ставки/покупки и новые race paths.

### Рекомендуемое направление

`DEC-079` подтвердил portfolio-only Work, бессрочный fixed Listing, relist после
отсутствия продажи/подтверждённого buyer-side failure и постоянный sold state после
успешной передачи. Предварительно вариант A лучше всего отделяет Work от попытки
продажи. Task 10 должен определить edit/remoderation matrix и понятные пользовательские
названия; versioned revisions остаются после MVP.

### Что ещё нужно решить

- Состояния portfolio-only, available, active sale, handoff pending, sold и archived.
- Какие поля Work существенны для сделки.
- Различие между скрытием из портфолио и разрешением повторной продажи.

## A09 — проблема конкретной сделки отдельно от commerce outcome

### Текущее состояние

Публичного dispute domain нет. Общие reports на Work/автора отложены после MVP
(`DEC-081`), но сторонам конкретного Order нужен минимальный способ сообщить о
несвязи, отказе или споре. Если кодировать сообщение напрямую через terminal Order
status, одно действие сможет освободить Work или изменить историю сделки.

### Варианты

**A — отдельные OrderIssue и Case.** OrderIssue хранит заявление стороны; Case
появляется только при конфликте или отсутствии ответа и объединяет review, evidence и
resolution. Commerce state меняется только явным resolution action.

- Плюсы: разделяет сообщение пользователя, модерацию и состояние сделки.
- Минусы: две сущности и admin workflow.

**B — один OrderDispute record.** Одна запись содержит Order, стороны, category,
claims, status, resolver и outcome link.

- Плюсы: достаточно для малого MVP и проще админка.
- Минусы: сложнее объединять повторные reports и хранить несколько решений.

**C — специальные Order statuses для заявления о проблеме.**

- Плюсы: не нужна отдельная таблица.
- Минусы: смешивает review и commerce lifecycle и плохо хранит разные заявления
  сторон.

### Рекомендуемое направление

Task 10 должен сравнить A и B с целью оставить admin только конфликтные случаи.
Обязательное правило уже определено: создание issue/dispute само не меняет Listing,
Work или terminal Order outcome. Общие content/author reports в этот contract не входят.

### Что ещё нужно решить

- Категории и обязательные поля transaction issue.
- Какие resolution actions доступны администратору.
- Retention, доступ стороны к ответу и legal deadline.

## Порядок закрытия

1. Task 10 собирает official/community evidence по D01–D03 и A01–A09; юрист закрывает
   только отмеченные legal gates.
2. Основатель отвечает на D01–D03; D04 уже закрыт `DEC-081`.
3. Work-first contract финализирует A08, затем A01 и A02 как одну transaction model.
4. Handoff contract совместно выбирает A03, A04, A06 и A09.
5. A05 реализуется отдельным reset/preflight перед public pilot. A07 остаётся после
   MVP, если Task 10 не докажет необходимость минимального launch channel.
6. Только после выбора оставшиеся варианты переносятся append-only решением в decision log,
   затем в RFC/architecture и задачи реализации.

## Запрещённые короткие пути

- Не создавать synthetic Bid для fixed или accepted offer.
- Не полагаться только на service-level `findFirst` для защиты от двойной продажи.
- Не считать истечение 48 часов доказательством неоплаты.
- Не раскрывать контакты runner-up до его подтверждения новой сделки.
- Не освобождать Work после одного seller action.
- Не использовать текущую изменяемую Work для восстановления исторического snapshot.
- Не связывать открытие Complaint с автоматическим изменением Order status.
