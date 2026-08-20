# bidplace — repo-wide MVP readiness audit

Дата: 2026-08-20

Ветка: `fix/final-pen-v2-rework`

Статус: Complete — audit-only, production code не изменён

## 0. Scope and evidence rules

Цель аудита — определить небольшой backlog с максимальной отдачей для одного
разработчика перед реальным MVP: надёжность, UX, trust, maintainability и
готовность к первым 10–1 000 пользователям.

Границы:

- auction core считается стабилизированным; новые задачи по нему появляются
  только при найденном новом production risk;
- analytics foundation и legal review выполняются отдельно;
- P0/P1 выводы требуют evidence из code/schema/test/doc;
- canonical Product и Design документы не изменяются в рамках аудита;
- отдельно reviewed committed snapshots `7189219` и `450d405`; оставшийся
  uncommitted analytics/design/API-client WIP других задач не оценивается как
  готовый release и не включается в audit commit.

## 1. Executive verdict

Текущий modular monolith соответствует размеру bidplace. NestJS services,
Prisma/PostgreSQL, shared Zod contracts, typed API client, React Query и Expo
Router образуют понятную и в целом долговечную границу. Microservices, queue,
Redis, CQRS или event sourcing до MVP не нужны.

Главные риски находятся вокруг auction outcome и реальной эксплуатации продукта:

1. generic Order-create failure rollback-ит `ENDED` вместе с transaction и
   оставляет просроченный Listing `LIVE`, вопреки гарантии `7189219`;
2. пользователь без password recovery после истечения 12-часовой session
   теряет доступ к своим Bid/Order и контактам;
3. founder не может безопасно остановить проблемный LIVE/SCHEDULED Listing,
   скрыть его или заблокировать User без ручной работы с БД;
4. upload pipeline выполняет дорогой полный decode изображений до проверки
   seller capability, без upload rate limit и без явного pixel/frame budget;
5. backup/restore и воспроизводимый production release pipeline в репозитории
   не обнаружены;
6. Order snapshot сохраняет деньги и контакты, но читает mutable Product title
   из текущего Product, поэтому старая сделка может менять отображаемую историю;
7. seller не имеет списка собственных Orders: маршрут Order существует, но
   discoverable link создаётся только из buyer Activity/Product participation;
8. текущая DB-blob модель допустима для закрытого pilot, но без thumbnails и
   общего process-image budget быстро превращает public cards и backup в
   bandwidth/storage bottleneck.

Итоговый вывод: архитектуру сохранять; до pilot закрыть необратимое auction close,
account recovery, emergency admin operations, upload resource limits и
release/backup runbook.

## 2. Current architecture health

### Healthy boundaries

- `apps/api` — modular NestJS monolith; controllers в основном парсят shared
  Zod contracts, services владеют бизнес-правилами и транзакциями.
- `packages/contracts` — runtime HTTP/event schemas; `packages/api-client`
  валидирует ответы и централизует transport errors.
- `packages/database/prisma/schema.prisma` — Product отделён от Listing,
  AuctionRules, Bid и Order; критичные participant relations используют
  `Restrict`.
- `apps/mobile` — один Expo Router client для web/native; React Query хранит
  server state, realtime является сигналом на canonical refetch.
- Bidding и lifecycle имеют serializable/CAS/idempotency/soft-close и
  PostgreSQL integration coverage; повторный косметический refactor не нужен.

### Material boundary violations / scaling pressure

- `AdminController` напрямую владеет unbounded moderation list queries, а UI
  фильтрует их локально. Для первых десятков сущностей это приемлемо, но admin
  operations остаются неполными.
- `ProductsService.getPublic` использует `include.images`, загружая binary
  `ProductImage.data` в память для JSON metadata projection, хотя публичный
  response возвращает только URL/metadata.
- `SellersService.listPublic` загружает всех approved sellers, сортирует и
  делает pagination через `Array.slice`; это не blocker закрытого pilot, но
  должно стать server-side pagination до десятков/сотен creators.
- `ActivityService.get` загружает все Bids пользователя, дедуплицирует Listing
  в памяти и не имеет pagination.

## 3. Confirmed P0/P1 findings — part 1

### [P0] Нет account recovery для buyer/winner

**Exploit/failure flow:** buyer делает Bid или выигрывает, затем cookie/JWT
истекает через 12 часов либо пользователь выходит. Если пароль забыт, endpoints
forgot/reset password отсутствуют, поэтому `/me/activity` и `/order/:publicId`
с контактами становятся недоступны. Founder также не имеет безопасного admin
recovery action для восстановления доступа.

Evidence:

- `apps/api/src/auth/auth.constants.ts` — `AUTH_TOKEN_TTL_SECONDS = 12h`;
- `apps/api/src/auth/auth.controller.ts` — только register/login/rules/me/logout;
- `apps/api/src/otp/otp.controller.ts` — OTP обслуживает только email
  verification уже аутентифицированного User;
- `packages/contracts/src/auth.ts`, `packages/api-client/src/auth.ts` — reset
  contracts/client methods отсутствуют;
- `apps/mobile/src/features/activity/activity-screen.tsx` и
  `apps/mobile/src/features/orders/order-screen.tsx` требуют активную session.

Durable fix: одноразовый hashed password-reset token с expiry, generic response
без user enumeration, rate limits по IP/email, sessionVersion increment после
reset, SMTP delivery и web/native deep-link route. Это важнее social login.

### [P0] Нет emergency hide/cancel и User ban через admin

**Failure flow:** после начала аукциона обнаружен запрещённый предмет, compromised
seller или abuse account. Admin не может перевести Product в
`CHANGES_REQUESTED/ARCHIVED` и SellerProfile в `SUSPENDED`, пока существует
SCHEDULED/LIVE Listing; admin cancel/hide Listing и user ban endpoints/UI
отсутствуют. Остаётся Prisma Studio/SQL.

Evidence:

- `apps/api/src/admin/admin.controller.ts` — moderation, order recovery и
  replacement есть; user list/ban и listing cancel/hide отсутствуют;
- `apps/api/src/admin/admin-moderation.service.ts:43-58` — suspension blocked
  при SCHEDULED/LIVE Listing;
- `apps/api/src/admin/admin-moderation.service.ts:115-125` — Product hide/change
  blocked при SCHEDULED/LIVE Listing;
- `apps/api/src/listings/listings.service.ts:78-113` — cancel принадлежит только
  owner seller path, а LIVE Listing не входит в cancellable states;
- `docs/product/05-MVP-RFC.md` §4 Admin обещает скрытие лота и блокировку User;
  current code этого не предоставляет.

Durable fix: маленькие reasoned, audited admin actions: emergency cancel/hide
Listing с сохранением Bid history; ban/unban User с `sessionVersion` invalidation;
очередь/поиск affected entities. Нельзя реализовывать это delete/cascade.

### [P0] Image decode допускает authenticated resource-exhaustion

**Exploit flow:** любой зарегистрированный User отправляет повторные multipart
uploads с несколькими сжатыми high-dimension PNG/GIF. Controller вызывает
`validateProductImageUploads` до ownership/approved-seller проверки. Validator
параллельно делает `sharp(..., animated: true).raw().toBuffer()` для каждого
файла; upload endpoints не имеют rate limit. Byte limit 5 MiB не ограничивает
decoded pixels, frames, CPU или raw memory.

Evidence:

- `apps/api/src/images/images.controller.ts:33-56` — validation до
  `ImagesService.add` capability check;
- `apps/api/src/images/image-policy.ts:123-188` — animated full raw decode внутри
  `Promise.all`;
- `apps/api/src/images/images.service.ts:25-40` — approved seller проверяется
  только после controller decode;
- `apps/api/src/sellers/sellers.controller.ts:45-72` — seller application image
  также доступен любому authenticated User без upload rate limit;
- тесты проверяют MIME/bytes/decodability, но не pixel/frame bomb и request
  throttling.

Durable fix: дешёвая authorization/capability boundary до decode, request rate
limit, explicit max width/height/total pixels/pages, sequential bounded decode,
и canonical normalization в безопасный raster output. GIF стоит оставить только
при доказанной продуктовой необходимости.

### [P1] Seller не может найти собственный выигранный Order

Order route поддерживает seller projection и seller actions, но seller-facing
list/search отсутствует. `ActivityService` строится только по buyer Bids; ссылку
на Order получает buyer. Для seller единственный практический путь — знать
`publicId` извне или получить прямую ссылку от admin/dev.

Evidence:

- `apps/api/src/activity/activity.service.ts` — выборка по
  `bidderUserId=userId`;
- `apps/api/src/orders/orders.controller.ts` — только get-by-publicId и mutations,
  list endpoint отсутствует;
- `apps/mobile/src/features/activity/activity-screen.tsx` — buyer list;
- `apps/mobile/src/features/orders/order-screen.tsx` — seller projection/actions
  реализованы, но route discovery для seller отсутствует;
- `apps/mobile/src/app` — seller Orders screen отсутствует.

Durable fix: bounded `GET /api/seller/orders` + cabinet list with active/problem
states and direct Order links. Не нужен новый workflow engine.

### [P1] Order title history mutable, replacement deadline уже истёк

Order snapshots final amount, buyer email и seller contact, но Product title
берётся из текущего Product. После ENDED Listing admin может вернуть approved
Product в CHANGES_REQUESTED, seller может изменить title, и старый Order начнёт
показывать новое название. Кроме того, replacement Order получает
`contactDueAt = new Date()`, то есть deadline наступает сразу.

Evidence:

- `apps/api/src/orders/order-snapshot.ts` — snapshot содержит только handoff
  contacts/email/initiator;
- `apps/api/src/orders/orders.service.ts:22-50,605-627` — Order response joins
  current Product title;
- `apps/api/src/admin/admin-moderation.service.ts:187-195` и
  `apps/api/src/products/product-state.ts` — ended Product может вернуться в
  editable CHANGES_REQUESTED;
- `apps/api/src/orders/orders.service.ts:463-479` — replacement deadline равен
  текущему времени.

Durable fix: snapshot minimum sale identity (`productTitleAtClose`, currency,
listing dates; при необходимости seller display name) и читать Order summary из
snapshot; отдельно исправить replacement deadline либо удалить misleading SLA
семантику после product decision.

## 4. Data/media scaling — verified observations

DB storage остаётся приемлемым только как controlled pilot boundary:

- main Product images: до 8 × 5 MiB и 40 MiB aggregate;
- creation process: до 20 шагов × 5 MiB, но эти bytes не входят в Product
  aggregate budget;
- profile photo: ещё до 5 MiB;
- оригиналы сохраняются как PostgreSQL `BYTEA`; thumbnail/normalized rendition
  не создаётся.

Worst-case payload: примерно 145 MiB на Product+creator association до WAL,
indexes, MVCC и backup overhead. Порядок величины:

| Products | Main + process blobs, worst case | Operational effect                                           |
| -------: | -------------------------------: | ------------------------------------------------------------ |
|      100 |                          ~14 GiB | backup/restore и local copies уже ощутимы                    |
|    1 000 |                         ~140 GiB | DB backup, WAL и public egress становятся отдельной системой |
|   10 000 |                         ~1.4 TiB | текущая модель практически непригодна без media migration    |

Даже раньше storage упирается в bandwidth: card запрашивает original image,
поэтому каталог из восьми 5 MiB originals может передать около 40 MiB до cache.
Не требуется немедленный S3 rewrite: до pilot достаточно normalization,
thumbnail/card rendition, process-image aggregate budget и измерение реальных
размеров. Object storage становится P1/P2 migration после подтверждения
deployment/backup constraints или при устойчивом объёме сотен Products.

## 5. Release, operations and database integrity — verified observations

### [P0] Нет воспроизводимого production release и проверенного restore path

В repository не обнаружены CI workflows, production Dockerfile/deployment
manifest, release script/runbook, backup policy или restore drill. Есть только
local PostgreSQL compose и `prisma migrate deploy`. Это означает, что перед
пилотом нельзя доказуемо ответить: какой commit развернут, кто и когда применяет
migrations, как откатить несовместимый app release, как восстановить Users,
Bids, Orders и media после потери volume.

Evidence:

- root `package.json` — build/lint/typecheck и integration script есть, но
  production release/backup/restore scripts отсутствуют;
- `turbo.json` — tasks только `build`, `lint`, `typecheck`, `dev`, `clean`; root
  test task и release gate отсутствуют;
- `.github/workflows`, `Dockerfile*`, `eas.json`, production manifests в tracked
  tree не обнаружены;
- `docker-compose.yml` — только local `postgres:16-alpine` с dev credentials;
- `packages/database/package.json` — Prisma generate/migrate/seed, но не backup;
- git remote в текущем checkout не настроен, поэтому repository сам не даёт
  evidence внешнего CI/CD.

Durable fix до pilot: один documented production profile с pinned build
artifact, migrate-before-start sequence, ровно одной API replica, readiness
probe, rollback procedure; encrypted automated PostgreSQL backup с retention и
хотя бы один restore drill в отдельную БД. Media `BYTEA` входит в этот backup,
поэтому время/размер restore нужно измерить на representative fixture.

### [P1] `/health` сообщает `ok` при недоступной БД

`HealthService` возвращает timestamp и статический `status: ok`; database query
и различие liveness/readiness отсутствуют. После startup connection либо при
сетевом/DB outage traffic продолжит направляться на instance, который не может
обслуживать ни каталог, ни Bid.

Evidence: `apps/api/src/core/health/health.service.ts`; `PrismaService` connect
при bootstrap не заменяет ongoing readiness.

Durable fix: дешёвый bounded readiness check (`SELECT 1`) с failure status;
отдельный liveness endpoint можно оставить process-only. Deployment probe
должен использовать readiness, а не статический endpoint.

### [P1] Production guards зависят от `NODE_ENV`, а профиль — ещё и от `APP_ENV`

Env schema допускает противоречивые пары. Например,
`APP_ENV=production,NODE_ENV=development` проходит без mandatory SMTP/service
rules checks, потому что production `superRefine` смотрит только на `NODE_ENV`.
При этом другие решения (CORS, seed guards, client environment) используют обе
переменные. `JWT_SECRET` во всех профилях имеет только `min(1)`.

Evidence: `apps/api/src/core/config/env.ts`; production validation starts only
under `env.NODE_ENV === 'production'`; `APP_ENV` defaults to `local`;
`JWT_SECRET: z.string().min(1)`.

Durable fix: явно разрешённая матрица profiles и fail-fast на inconsistent
combination; production/staging secret policy с достаточной длиной/entropy;
tests для всех разрешённых и запрещённых pairs. Не читать и не логировать
фактические secret values.

### [P1] Critical relational invariants не закреплены в PostgreSQL

Service transactions сейчас проверяют большинство правил, но schema допускает
исторически невозможные состояния при regression, manual operation или новом
code path:

- `Bid.listing` имеет `onDelete: Cascade`, хотя Bid history должна сохраняться;
- `Order.listingId` и unique `sourceBidId` не гарантируют, что source Bid
  принадлежит тому же Listing;
- нет CHECK для `currentPrice/startPrice/amount >= 0`, `bidCount >= 0`,
  `endsAt > startsAt`, согласованности contact quartet/creation image metadata;
- User `role/status` и SellerProfile `sellerType` остаются свободными strings;
  application mappers fail closed, но DB не защищает инвариант.

Evidence: `packages/database/prisma/schema.prisma`; runtime cross-checks есть в
`apps/api/src/orders/orders.service.ts` и Listing/Bid services, но это не DB
constraints.

Durable fix: прежде всего `Bid → Listing ON DELETE RESTRICT` и same-listing
constraint для Order/sourceBid через composite key/FK; затем небольшая migration
с domain CHECK constraints после preflight query существующих данных. Не вводить
универсальный soft-delete: canonical MVP прямо запрещает deletion и требует
сохранять Bid/Order history.

### [P1] Product `REJECTED` — необратимый тупик даже для admin

SellerProfile `REJECTED` admin может вернуть в `CHANGES_REQUESTED`, но Product
state machine задаёт `REJECTED: new Set([])`. Seller редактирует только DRAFT и
CHANGES_REQUESTED. После ошибки модерации или успешной апелляции Product нельзя
исправить/пересмотреть через API — только создать заново или править БД.

Evidence: `apps/api/src/admin/admin-moderation.service.ts` methods
`isAllowedSellerTransition` и `isAllowedProductTransition`;
`apps/api/src/products/product-state.ts`; existing moderation integration tests
закрепляют terminal Product rejection.

Durable fix: reasoned/audited `REJECTED → CHANGES_REQUESTED` только для admin,
после чего обычный seller edit → resubmit path. Это реализация заявленной ручной
апелляции, а не новый moderation engine.

### [P1] Listing DRAFT теряется после reload и размножается

UI создаёт Listing отдельным POST, сохраняет его id только в local React state,
затем вторым запросом делает SCHEDULE. При reload/tab close между запросами либо
после schedule error seller больше не имеет list/resume route. Product снова
выглядит доступным и позволяет создать следующий DRAFT. API предотвращает только
второй active `SCHEDULED/LIVE`, но не duplicate DRAFTs.

Evidence:

- `apps/mobile/src/features/sellers/listing-draft-screen.tsx` —
  `createdListing` local state и последовательные mutations;
- `apps/api/src/listings/listings.service.ts` — create всегда вставляет DRAFT,
  duplicate check выполняется только на schedule и только для active Listing;
- seller listings list/update-dates endpoint отсутствует.

Durable MVP fix: сделать create+schedule одной server transaction для этого
одноэкранного flow либо добавить bounded seller drafts list/resume/cancel и
редактирование дат. Первый вариант проще, если отдельный сохраняемый Listing
draft не является подтверждённой продуктовой потребностью.

### [P1] Cancelled Order ведёт buyer на гарантированный 403

`ActivityService` возвращает `orderPublicId` и статус `WIN_CANCELLED`; mobile
показывает кнопку открытия Order при любом non-null id. `OrdersService.get`
запрещает CANCELLED Order всем, кроме admin. В итоге UI предлагает действие,
которое заведомо не может завершиться успешно.

Evidence: `apps/api/src/activity/activity.service.ts`,
`apps/mobile/src/features/activity/activity-screen.tsx`,
`apps/api/src/orders/orders.service.ts`.

Durable fix: либо не отдавать link для cancelled state и показать ясную
следующую операцию, либо вернуть buyer безопасный tombstone без seller contact.
Нельзя снова раскрывать cancelled handoff contact.

### [P1] Public social URLs разрешают произвольные URL schemes

Handoff contact schemas строгие, но публичные `socialLink`, `telegramUrl`,
`instagramUrl`, `websiteUrl` используют общий `z.string().url()` и затем
передаются в Expo Router `<Link target="_blank">`. Zod `url()` не является
allowlist протоколов/доменов; creator-controlled external navigation должна
разрешать только `https:` и ожидаемые Telegram/Instagram hosts, а website —
`https:` с явным external-link поведением.

Evidence: `packages/contracts/src/seller-profile.ts`,
`apps/mobile/src/features/sellers/CreatorSocialLink.tsx`,
`apps/mobile/src/features/sellers/CreatorHero.tsx`.

Durable fix: shared normalized URL schemas (`https` only; domain-specific where
semantically required), server-side validation for create/update, safe migration
preflight and tests with `javascript:`, credentials, lookalike domains and mixed
case/punycode inputs. React escaping already protects biography/title text; это
не XSS claim про обычный rendered text.

## 6. Изолированное code review свежих коммитов

Ревью выполнено отдельно от незакоммиченного WIP: сравнивались содержимое самих
коммитов, их tests и текущие canonical contracts. В review не включались
`design/**`, `.email.jsonl`, audit drafts и незакоммиченные api-client stubs.

### 6.1 `7189219` — Close auction core with admin Order recovery

#### [P0] Обещание «Listing всегда ENDED, Order best-effort» не выполняется

`ListingLifecycleService.close()` переводит Listing в `ENDED`, ищет победителя и
создаёт Order внутри одной serializable transaction. `tryCreateWinnerOrder()`
поглощает только два известных отсутствующих prerequisite и исчерпание пяти
`P2002`; любая иная ошибка `tx.order.create()` пробрасывается наружу. PostgreSQL
откатывает всю transaction, включая `LIVE → ENDED`. Таким образом transient DB
error, новый constraint или serialization failure после исчерпания общего retry
оставляет истёкший аукцион `LIVE` — прямо противоположно описанию коммита и
архитектурному утверждению.

Evidence:

- `apps/api/src/lifecycle/listing-lifecycle.service.ts:91-133` — close и Order в
  одной transaction;
- там же `:172-208`, особенно generic rethrow на `:199`;
- `docs/product/10-CODE-ARCHITECTURE.md` заявляет безусловное закрытие;
- tests покрывают success, missing buyer и missing handoff, но не generic
  `order.create` failure с проверкой сохранённого `ENDED`.

Durable fix: атомарно и идемпотентно зафиксировать `ENDED` в первой transaction,
затем создавать Order отдельной idempotent operation. Ошибку Order записывать с
`listingId/requestId` и оставлять для recovery queue/API; ошибка одного Listing
не должна прерывать обработку остальных expired Listings. Обязателен regression
test: injected Order failure оставляет Listing `ENDED`, повторный close/recovery
создаёт ровно один Order.

#### [P1] Пропущенный целиком интервал аукциона оставляет `SCHEDULED` навсегда

Activation выбирает только `startsAt <= now AND endsAt > now`, а close — только
`LIVE AND endsAt <= now`. Если scheduler/API не работал от старта до конца,
Listing больше не попадает ни в один набор. Он не станет ни LIVE, ни ENDED, и
текущий dashboard stale check его тоже не увидит, потому что ищет только LIVE.

Evidence: `apps/api/src/lifecycle/listing-lifecycle.service.ts:35-50,80-87`;
`apps/api/src/admin/admin-analytics.service.ts:822-839`.

Durable fix требует явного product/operations rule: просроченный не
активировавшийся Listing либо детерминированно закрывается без победителя, либо
попадает в admin recovery с audited reschedule/cancel action. Молча активировать
его после `endsAt` нельзя.

#### [P1] Admin Order recovery пока API-only, а не операционный workflow

Контракт и guarded endpoints существуют, ranking победителя и защита от второго
Order реализованы. Но в admin UI нет списка `needs-order` и action
`create-order`; founder должен вручную вызывать API. Для инцидента, который
должен восстанавливать главный auction outcome, это `Partial`, не завершённая
операционная recovery capability.

Evidence: `apps/api/src/admin/admin.controller.ts`,
`apps/api/src/orders/orders.service.ts`, `packages/api-client/src/admin.ts`;
route tree `apps/mobile/src/app/(admin)` содержит только `admin.tsx` и
`analytics.tsx`.

Durable fix: компактная admin queue с причиной отсутствия Order, link на Listing,
idempotent create action, per-row success/error и audit event. До UI — минимум
documented authenticated runbook с exact request/response и verification query.

#### [P1/test gap] Retry `P2002` внутри одной PostgreSQL transaction не проверен

Оба пути повторяют `order.create()` после `P2002` в том же interactive
transaction. Unique violation в PostgreSQL обычно переводит transaction в failed
state до rollback/savepoint. Текущие tests не вызывают реальную collision
сгенерированного `publicId`, поэтому не доказывают, что вторая попытка возможна с
используемой Prisma/PostgreSQL версией.

Evidence: `apps/api/src/lifecycle/listing-lifecycle.service.ts:172-208` и retry
в `apps/api/src/orders/orders.service.ts`; recovery integration test проверяет
идемпотентность существующего Order, но не collision нового `publicId`.

Durable fix: вынести каждую попытку public-id insertion в отдельную transaction
или генерировать collision-resistant id и повторять whole operation; добавить
реальный PostgreSQL integration test с детерминированной первой collision.

Что в этой части выглядит корректно: Bid CAS retry ограничен тремя service-level
повторами и дополняет serializable transaction retry; error contract переводит
ожидаемые bid failures в стабильные codes, включая `BID_TOO_LOW` с
`details.minimumBid`; handoff gate проверяется при schedule и activation. Это не
снимает перечисленные lifecycle gaps.

### 6.2 `450d405` — First-party analytics foundation/admin dashboard

#### [P1] Часть drilldown links гарантированно ведёт на несуществующие routes

API возвращает `/products/:id`, `/sellers/:slug`,
`/admin/listings/:id/bids` и `/admin/products`. Реальные Expo routes — singular
`/product/:publicId`, `/seller/:slug`, `/admin`, `/admin/analytics`; двух
последних detail routes нет. UI без проверки превращает каждый `href` в Link.
Unit test дополнительно закрепил ошибочный `/products/P1`.

Evidence: `apps/api/src/admin/admin-analytics.service.ts:643-839`, в частности
`:673,707,727,796,819,838`; `apps/mobile/src/features/admin/admin-analytics-screen.tsx:204-218`;
`apps/mobile/src/app/(public)/product/[publicId].tsx`,
`apps/mobile/src/app/(public)/seller/[slug].tsx`, route tree `(admin)`.

Durable fix: contracts должны возвращать domain identifiers/action kind, а route
строится shared mobile route helper; немедленный минимальный fix — исправить
singular public routes и не возвращать `href` для отсутствующих admin screens.
Добавить route-contract tests на каждый drilldown.

#### [P1] Attribution contract принимает данные, которые PostgreSQL отвергает

Все attribution fields разрешают до 512 символов, но columns
`source/medium/campaign/content` — `VARCHAR(120)`. Ошибка create ловится и только
логируется, ingest всё равно сообщает `accepted`; валидный по public contract UTM
теряется молча, нарушая first-touch promise.

Evidence: `packages/contracts/src/analytics.ts:20-35`;
`packages/database/prisma/schema.prisma:365-382`;
`apps/api/src/analytics/analytics.service.ts:87-109`.

Durable fix: единый shared limit 120 для четырёх UTM fields либо migration до
512; возвращать distinguishable attribution outcome или хотя бы не считать
операцию успешной при unexpected DB error. Contract/DB integration test должен
проверять exact boundary 120/121.

#### [P1] `auctionsSoldRate` смешивает разные cohorts и может быть > 100%

Числитель — все Orders, созданные в период; знаменатель — Listings, закрытые в
период. Recovery или replacement Order для старого Listing увеличивает текущий
числитель, а исходный аукцион остаётся в прошлом знаменателе. Кроме неверной
семантики, несколько Orders одного Listing позволяют rate превысить 1.

Evidence: `apps/api/src/admin/admin-analytics.service.ts:159-163,197-200,531-535,578-579`.

Durable fix: считать distinct sold Listings из cohort `closedAt in period`, с
явным правилом выбора effective/non-cancelled Order; либо переименовать показатель
в `ordersCreated` и не делить его на ended-auction cohort. Закрепить recovery и
replacement cases в metric tests.

#### [P1] Production dashboard доверяет client-supplied `environment`

Public ingest принимает любую строку `environment`, сервер сохраняет её как есть,
а все admin aggregations считают события без environment filter. Local/staging
client или намеренный caller может загрязнить production funnel произвольным
значением. Наличие поля в строке не обеспечивает isolation.

Evidence: `packages/contracts/src/analytics.ts:110-119`;
`apps/api/src/analytics/analytics.service.ts:37-50`;
analytics queries в `apps/api/src/admin/admin-analytics.service.ts` фильтруют
event name/time, но не environment.

Durable fix: environment назначает сервер из validated config; если одна БД
разделяется профилями, dashboard явно фильтрует server environment. Клиент может
прислать app channel/build metadata, но не authority field.

#### [P2] Public ingest не имеет idempotency, retention и устойчивой delivery

Лимит `60/min/IP × 25` допускает 1 500 строк в минуту с одного IP; entity UUIDs
и event payload валидны синтаксически, но не подтверждаются существованием.
Client queue in-memory: потеря response повторно ставит весь batch и может
дублировать уже записанные события, а закрытие page/offline теряет очередь.
У событий нет client event id/unique key и нет retention policy. Это приемлемо
для best-effort telemetry prototype, но не для точных founder metrics или
неограниченного production retention.

Evidence: `apps/api/src/analytics/analytics.controller.ts:17-34`,
`apps/api/src/analytics/analytics.service.ts:34-51`,
`apps/mobile/src/lib/analytics/client.ts`, AnalyticsEvent schema/migration.

Durable staged fix: UUID event id + unique ingest key и conflict-ignore;
server-side abuse budget/body ceiling; scheduled retention/aggregation policy;
persistent bounded queue только если loss budget этого требует. Не нужен SaaS или
warehouse до появления реального объёма.

#### [P2] Request correlation отражает в headers/logs неограниченный client id

Middleware принимает любой непустой `X-Request-Id`, не ограничивая длину и
символы, затем отражает его в response и request/5xx logs. Это создаёт log
injection/cardinality risk и может приблизиться к header-size failures downstream.

Evidence: `apps/api/src/core/request-context/request-id.middleware.ts:14-25`.

Durable fix: принимать только bounded ASCII/UUID-like value (например, до 128
символов), иначе генерировать UUID; structured logger обязан экранировать value.

#### [P2] Custom analytics period не ограничен и может выделить огромный массив

Для `period=custom` нет `from <= to` и максимальной длительности. `eachUtcDate()`
материализует каждый UTC day. Endpoint admin-only, поэтому это не public DoS, но
ошибочная дата может создать тяжёлый query fan-out/heap pressure.

Evidence: `apps/api/src/admin/admin-analytics.service.ts:23-68` и admin analytics
query schema в `packages/contracts/src/analytics.ts`.

Durable fix: schema-level chronological check и bounded span (например, 366
дней), с тестами reversed range и boundary.

Что в этой части выглядит корректно: endpoint защищён Bearer+Admin guard; `userId`
берётся из server auth context, а не request body; register-only attribution
claim и отсутствие PII/amount в текущих event properties соответствуют DEC-046.
First-party PostgreSQL — разумный MVP baseline, но dashboard нельзя считать
надёжным до исправления P1 metric/data-integrity defects.

## 7. Authentication, account lifecycle и social login

### 7.1 Что уже защищено корректно

- Ставка требует authenticated User с `emailVerifiedAt`; auction rules также
  принимаются до bid. Это соответствует актуальному DEC-050 и не требует
  возвращать phone/Telegram verification.
- Password хранится как Argon2 hash; email OTP хранится как hash, ограничен пятью
  попытками и TTL, request/verify имеют rate limit. Test bypass включается только
  при `NODE_ENV=test`.
- Logout повышает `sessionVersion`, поэтому украденный старый token перестаёт
  проходить database-backed guard. Server не доверяет `userId` из analytics или
  bidding payload.
- Duplicate register раскрывает существование email/phone, тогда как login
  использует generic invalid-credentials response. Для pilot это privacy trade-off,
  не blocker, но его следует осознанно принять и rate-limit register.

### 7.2 [P0] У существующего пользователя нет восстановления доступа

Нет forgot-password/reset-password, смены password/email и управления sessions.
Пользователь, потерявший пароль, навсегда теряет доступ к своим ставкам, победам,
handoff и истории. Founder тоже не имеет безопасного admin recovery action. Это
не edge case: для auction outcome нельзя полагаться на новый аккаунт или ручное
изменение hash в PostgreSQL.

Evidence: auth routes/services и mobile auth screens покрывают register/login/
logout/me/email-verification, но route, token model и screen для password reset
отсутствуют; user/admin modules не предоставляют recovery operation.

Durable fix:

1. Одноразовый криптографически случайный reset token; в БД хранить hash, User,
   `expiresAt`, `usedAt`; ответ forgot endpoint всегда нейтральный.
2. Отправлять link через тот же server-side mail boundary; ограничить IP+email,
   инвалидировать старые outstanding tokens.
3. В одной transaction заменить hash, отметить token used и повысить
   `sessionVersion`, завершив все прежние sessions.
4. Добавить web/mobile-browser screens и integration/E2E: unknown email, expired,
   replay, second request, successful login, invalidation старого token.

Workaround с ручным SQL reset — hack: он не аудируется, легко оставляет активные
sessions и не может быть штатной founder recovery procedure.

### 7.3 [P1] Ошибки auth/verification остаются нестабильным UI-контрактом

Новый bidding contract правильно переводит ожидаемые bid failures на `code`, но
auth и seller/product/order flows продолжают показывать сырые английские Nest
messages. Изменение server wording становится UI regression, локализация
невозможна, resend cooldown/invalid/expired OTP трудно объяснить отдельно.

Evidence: unified exception filter сериализует Nest messages; mobile auth и
email-verification screens используют server message как user-facing text;
стабильные constants сейчас введены главным образом для bidding.

Durable fix — не создавать сотню codes, а закрепить короткий operational набор:
`INVALID_CREDENTIALS`, `EMAIL_ALREADY_REGISTERED`, `OTP_COOLDOWN`, `OTP_INVALID`,
`OTP_EXPIRED`, `SELLER_NOT_APPROVED`, `SELLER_PROFILE_NOT_EDITABLE`,
`PRODUCT_NOT_EDITABLE`, `PRODUCT_MISSING_FIELDS`, `LISTING_ALREADY_ACTIVE`,
`LISTING_NOT_SCHEDULABLE`, `ORDER_INVALID_TRANSITION`,
`ORDER_RECOVERY_UNAVAILABLE`. UI map локализует их, неизвестный code получает
один безопасный fallback; integration contract tests проверяют code/details.

### 7.4 [P1] SMTP — синхронная single point of failure без release proof

OTP отправляется inline. При SMTP error код удаляется и API возвращает 503 — это
лучше ложного успеха, но нет provider smoke check, delivery telemetry, retry/runbook
и доказанного production sender/domain configuration. Без email registration и
bidding gate практически недоступны.

Durable MVP fix не обязан сразу добавлять queue: нужен staging smoke через
реального provider, verified sender/domain, понятный timeout, structured outcome
без адреса/кода в logs, alert на sustained failures и ручной resend runbook.
Queue/outbox добавлять только если smoke/pilot покажет необходимость.

### 7.5 [P1/security maintenance] Установленный Nodemailer ниже patched line

В repo установлен `nodemailer@6.10.1`. Advisory GHSA-rcmh-qjqh-p98v описывает
high-severity DoS в recursive address parser для версий ниже 7.0.11;
исправление опубликовано в 7.0.11. Текущий public email contract
reject-ит проверенные nested/group address forms, поэтому прямой exploit через
обычный register payload не подтверждён, но уязвимую parser implementation
оставлять в production dependency graph не следует.

Source: [Nodemailer security advisory](https://github.com/nodemailer/nodemailer/security/advisories/GHSA-rcmh-qjqh-p98v).

Durable fix: отдельный controlled upgrade Nodemailer 6→current patched major с
SMTP unit/integration smoke, а не blind package bump. До него явно сохранять
single-address validation на всех mail entry points.

### 7.6 Legacy phone/Telegram auth footprint следует удалить, не оживлять

После DEC-050 в schema/contracts/UI всё ещё присутствуют optional phone,
`phoneVerifiedAt`, `PhoneVerificationCode`, а env template содержит
`TELEGRAM_BOT_TOKEN`/`TELEGRAM_WEBAPP_URL`, хотя runtime auth flow их не использует.
Это создаёт ложное ожидание verification и лишнее поле регистрации. Не путать с
seller handoff method `PHONE`: контактный телефон для передачи лота остаётся
валидным business field.

Durable cleanup: подтвердить миграцией отсутствие нужных production данных,
убрать только auth-verification model/fields/input/unused env, обновить fixtures и
docs. Не удалять handoff phone. До data check это P2 cleanup, не emergency change.

### 7.7 Social auth: решение и безопасная модель

#### Google — `ADD AFTER PILOT`, не pre-launch blocker

Google уменьшит friction для части покупателей, но не исправит отсутствие
password recovery у существующих users, release/backup риски или auction-close
rollback. Для текущего web-first MVP сначала важнее безопасно завершить core.

Если добавлять после pilot:

- создать `AuthIdentity(provider, providerSubject, userId)` с unique
  `(provider, providerSubject)`;
- проверять Google ID token/code только server-side и использовать стабильный
  claim `sub`, а не email, как внешний identity key;
- затем выпускать обычную bidplace session, сохраняя единые guards/roles;
- не объединять молча с локальным аккаунтом по совпавшему email: link требует
  входа в существующий аккаунт или завершённого recovery proof;
- для нового Google user считать email verified только при допустимом verified
  claim; social-only account требует явной модели credential capability вместо
  фиктивного password hash.

Sources: [Expo authentication guide](https://docs.expo.dev/guides/authentication/),
[Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect),
[Expo Google authentication](https://docs.expo.dev/guides/google-authentication/).

Для будущего native distribution OAuth надо проверять в development build, а не
Expo Go; web cookie-only assumptions также нужно пересмотреть отдельно. Это не
расширяет текущий подтверждённый browser-first launch scope.

#### Telegram — `DO NOT ADD` в текущий web-first flow

Telegram identity не даёт email, а verified email всё равно нужен для bidding и
recovery. Поэтому путь станет `Telegram approval → collect email → verify email →
rules → bid`: выигрыш мал, а появляются linking, HMAC/initData validation,
timestamp/replay и account-takeover risks. Возвращаться к нему разумно только
после решения о Telegram Mini App/distribution.

Если решение изменится: ключ — numeric Telegram user id; Login Widget hash или
Mini App raw `initData` проверяются server-side с freshness bound; username/phone
не identity keys; account linking только explicit, без synthetic email.

Sources: [Telegram Login Widget](https://core.telegram.org/widgets/login/),
[Telegram Mini Apps data validation](https://core.telegram.org/bots/webapps).

#### Сравнение реального bid funnel

| Flow            | До первой ставки                                                            | Главный риск                                         |
| --------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| Текущий guest   | CTA → login/register → email verify → возврат → повторный CTA → rules → bid | recovery отсутствует, intent не восстанавливается    |
| Google позже    | CTA → provider → возврат → rules → bid                                      | account linking и provider/platform setup            |
| Telegram сейчас | Telegram → email collection → email verify → rules → bid                    | почти не сокращает funnel, добавляет второй identity |

Первое funnel-улучшение без нового provider: убрать legacy phone из register,
сохранить return intent и автоматически открыть bid flow после успешного
login/verification.

## 8. Buyer, seller и founder flow audit

### 8.1 Browser buyer happy path

Основной путь существует end-to-end: discovery → Product detail → auth → email
verification/rules → bid → realtime refresh → Activity → Order handoff. Bid CAS,
minimum bid, soft close и стабильные bidding codes заметно усилились в `7189219`.
Критические остатки:

#### [P1/a11y] Единственный submit ставки не управляется обычной клавиатурой web

В confirmation dialog `BidForm` скрывает primary action, а `SlideToBid` остаётся
единственным submit. Это `View` с PanResponder и RN accessibility action
`increment`, но не button/control с web `Enter`/`Space`; keyboard-only пользователь
может заполнить форму и застрять перед ставкой. Role `adjustable` также не передаёт
семантику необратимого подтверждения так ясно, как button.

Evidence: `apps/mobile/src/components/ui/SlideToBid.tsx:69-130` и его использование
в Product bid dialog; нет `onKeyDown`/Pressable fallback и нет browser keyboard
test для submit.

Durable fix: оставить slide как pointer affordance, но дать тот же guarded
`onComplete` нативному focusable control/доступному альтернативному button;
disabled/loading/focus state должны быть едиными. Playwright: Tab до control,
Enter/Space, single request, server error, reduced motion, 200% zoom.

#### [P1] Activity неверно сообщает победителю `HANDOFF_FAILED` как «Выиграли»

Mapping отдельно распознаёт `PENDING_CONTACT`, `COMPLETED`, `CANCELLED`; statuses
`CONTACTED` и `HANDOFF_FAILED` падают в Listing-derived branch. Для ENDED Listing
leading buyer получает `WON`, поэтому failed handoff визуально не отличим от
успешной активной победы.

Evidence: `apps/api/src/activity/activity.service.ts:25-50`; UI labels уже имеют
`HANDOFF_FAILED`, но activity contract этого состояния не возвращает.

Durable fix: расширить activity status contract минимум на `CONTACTED` и
`HANDOFF_FAILED`, отобразить next action/нейтральное состояние и добавить tests
на все Order statuses. Для `CANCELLED` link на Order надо убрать или заменить на
объяснение — текущая деталь Order закономерно отвечает 403, что уже отмечено в §5.

#### [P2/UX] После auth теряется намерение открыть bid dialog

Guest возвращается на Product, но должен снова найти и нажать CTA. Состояние bid
не следует хранить с amount через redirect; достаточно безопасного return intent
`openBid=1`, который после успешной auth/verification повторно проходит server
eligibility и открывает пустой dialog. Это более дешёвое funnel improvement, чем
social provider.

### 8.2 Seller creation/moderation/listing/handoff

- Product creation story после первого save server-backed и переживает reload;
  это хороший durable pattern, подтверждённый browser test.
- Listing create и schedule — две separate mutations, а созданный DRAFT не
  сохраняется в route/server lookup для продолжения после reload. Это P1 gap из
  §5: retry способен создать duplicate drafts.
- Product `REJECTED` terminal без resubmit/clone path — P1 для первой волны
  creators: founder может написать reason, но seller не может восстановиться.
- Seller не может получить список своих Orders/покупателей — P1 handoff blocker
  из §3. Победитель видит Order, продавец должен знать случайный `publicId`.
- Approved SellerProfile редактировать нельзя; это консервативно и безопасно для
  модерации. Если pilot требует правки bio/photo, нужен audited
  edit→re-moderation contract, а не прямое изменение published record.

### 8.3 Founder/admin recovery matrix

| Entity        | Что founder может сейчас                            | Не хватает до безопасного pilot                         |
| ------------- | --------------------------------------------------- | ------------------------------------------------------- |
| User          | только косвенно увидеть analytics                   | поиск, status/ban/unban, session revoke, recovery audit |
| SellerProfile | approve/request changes/reject с reason             | emergency path при blocking Listing, bounded list       |
| Product       | approve/request changes/reject с reason             | восстановление terminal REJECTED, bounded list          |
| Listing       | recovery Order через API после ENDED                | hide/cancel LIVE, stuck SCHEDULED recovery, UI queue    |
| Bid           | append-only; ручная mutation отсутствует            | так и оставить; только read/audit при dispute           |
| Order         | lookup/cancel/replacement; create missing Order API | seller list, needs-order UI, clear cancelled activity   |

Этот набор следует реализовывать не как generic CRUD. Каждая destructive state
transition: named action, reason, actor, previous/new state, timestamp, idempotency
и invariant checks. Bid deletion/редактирование и произвольная смена победителя
противоречат trust model; replacement допустим только по уже подтверждённому
manual next-ranked-bidder process.

## 9. Performance, media и accessibility

### 9.1 [P1] Product detail загружает image BYTEA, которые не возвращает

`ProductsService.getPublic()` делает `include.images` без select, поэтому Prisma
читает `data` для каждого ProductImage. Contract использует только metadata/URL.
Один detail refetch может дополнительно поднять до 40 MiB raw images; realtime и
bid mutations делают это особенно заметным.

Evidence: `apps/api/src/products/products.service.ts:370-399`; list path уже
показывает правильный metadata-only `publicCatalogProductSelect` pattern.

Durable quick fix: заменить include на explicit metadata select, запретив `data`;
unit test Prisma shape + integration response parity. Blob bytes читаются только
image endpoint. Это не заменяет decode/pixel limits из §4.

### 9.2 [P1] `immutable` cache выдан mutable image URLs

Public seller photo URL keyed стабильным slug, creation-step image — стабильным
step id; оба содержимых могут быть заменены. Тем не менее endpoint отвечает
`public, max-age=31536000, immutable`, поэтому browser/CDN вправе год показывать
старое изображение. Product image id меняется при add/delete и для него immutable
семантика подходит.

Evidence: `apps/api/src/images/image-policy.ts:201-205`, seller photo controller и
creation-step image controller используют общий helper.

Durable fix: content-address/version parameter (`?v=checksum`) в contract и
immutable URL либо короткий revalidation cache для mutable routes. Предпочтителен
первый вариант; test должен заменить image и доказать новый URL/content.

### 9.3 [P2→P1 при росте] Unbounded list/query fan-out

- Home вызывает product list дважды и seller list один раз. Каждый product list:
  page query, hydrate и пять facet queries, хотя Home facets не использует — около
  шестнадцати queries на один landing request.
- Public seller list читает все APPROVED profiles, сортирует и slice-ит в Node.
- Activity читает все bids пользователя, вложенные Product/Orders/top Bid, затем
  deduplicate в памяти.
- Admin moderation читает все SellerProfiles/Products и audit reasons без
  pagination.

Evidence: `apps/api/src/discovery/discovery.service.ts:13-20`,
`products.service.ts:443-535`, `sellers.service.ts:311-365`,
`activity/activity.service.ts:5-20`, `admin/admin.controller.ts:87-154`.

Для закрытого pilot с десятками объектов это допустимый временный scale profile,
но admin и sellers становятся P1 до первой широкой creator wave. Durable staged
fix: lightweight Home projections без facets; SQL ordering+pagination creators;
distinct Listing activity query/cursor; bounded admin pagination. Сначала добавить
query-count/latency baseline, не speculative caching.

### 9.4 Media scaling уже требует policy до загрузки pilot-контента

Текущая верхняя граница хранения — примерно 145 MiB на Product association:
40 MiB product gallery + 100 MiB process images + 5 MiB seller photo. Это около
14 GiB на 100, 140 GiB на 1 000 и 1.4 TiB на 10 000 таких associations без
thumbnail variants/backups. Originals отдаются каждому viewer.

Кроме storage, decode выполняется до authorization и для набора файлов через
`Promise.all`; byte cap не ограничивает decoded pixels/frames. Этот [P0]
resource-exhaustion finding и durable fix уже подробно описаны в §4: capability
first, pixel/frame budget, bounded concurrency, derivatives/object storage,
quotas/metrics. `sharp@0.35.3` уже находится выше patched threshold для
GHSA-f88m-g3jw-g9cj; проблема здесь в application policy, не в известной старой
версии Sharp. Source: [Sharp advisory](https://github.com/lovell/sharp/security/advisories/GHSA-f88m-g3jw-g9cj).

### 9.5 Accessibility verification status

В shared UI присутствуют roles, dialog focus management, visible focus/reduced
motion CSS и semantic loading/error primitives. Но нет доказательства полной
клавиатурной проходимости bid confirmation, moderation и handoff; automated tests
не заменяют screen-reader/manual checks.

Release gate для 390/1024/1440: keyboard-only happy paths, focus trap/restore,
200% zoom/reflow, VoiceOver/TalkBack labels, error announcement, touch targets,
prefers-reduced-motion и contrast. Особый blocker — `SlideToBid`; остальные
результаты фиксировать как verification evidence, а не как предположение о parity.

## 10. Release engineering, environments и test evidence

### 10.1 Текущее verification evidence на `450d405`

Запущено из рабочего дерева 2026-08-20:

| Проверка                                                     | Результат                                          |
| ------------------------------------------------------------ | -------------------------------------------------- |
| API unit                                                     | 39 files, 178/178 passed                           |
| Mobile unit                                                  | 34 files, 201/201 passed                           |
| Contracts unit                                               | 2 files, 13/13 passed                              |
| Database unit                                                | 1/1 passed                                         |
| API PostgreSQL integration                                   | 14 files, 50/50 passed                             |
| API/mobile lint                                              | passed                                             |
| API/mobile typecheck                                         | passed                                             |
| contracts/api-client/database/design-tokens/config typecheck | passed                                             |
| API + workspace library builds                               | passed                                             |
| Expo web production export                                   | passed; 3 652 modules, JS bundle около 5.4 MB      |
| Targeted Chromium E2E                                        | **не стартовал**: package-manager bootstrap defect |

`packages/api-client/test` дал 2/2 локально, но файлы untracked и принадлежат
параллельному WIP, поэтому это не evidence коммита `450d405` и не включается в
release claim.

Первый integration запуск внутри filesystem sandbox не имел доступа к
`127.0.0.1:5432`; повтор с разрешённым loopback прошёл 50/50. Это environment
ограничение инструмента, не test failure проекта.

### 10.2 [P1/tooling] Репозиторный browser E2E bootstrap сейчас невоспроизводим

Root pin — `packageManager: pnpm@11.7.0`. Локальный `corepack pnpm` запускает
11.10.0. Playwright webServer явно вызывает `corepack pnpm --filter ... build`;
вложенный database build вызывает `pnpm run generate` и падает с:
`This project is configured to use 11.7.0 ... current pnpm is v11.10.0`.
Следовательно, четыре выбранных critical specs не дошли до browser assertions.

Evidence: `package.json`, `apps/mobile/playwright.config.ts`,
`packages/database/package.json`; `corepack pnpm@11.7.0 --version` стабильно
возвращает 11.7.0, то есть exact pin технически доступен.

Durable fix: определить один package-manager bootstrap для local и CI. Например,
setup активирует exact `pnpm@11.7.0`, а scripts не меняют tool version внутри
task graph; либо осознанно обновить единственный repo pin до проверенной версии.
После этого прогнать full disposable Chromium suite, не только targeted specs.
Удаление version check или `pmOnFail=ignore` — workaround, не fix.

### 10.3 [P0] Release/backup/restore остаются недоказанными

Подробный finding находится в §5. В tracked tree нет CI workflow, production
container/deployment manifest, automated migration release, backup policy или
restore drill. Local Docker Compose не является production topology. Перед
первым реальным аукционом требуются:

1. pinned Node/pnpm install и clean build from checkout;
2. ephemeral PostgreSQL migrate-from-zero + full unit/integration/E2E gate;
3. staging deploy с production-like env validation и real SMTP smoke;
4. one-instance API/scheduler enforcement, HTTPS/proxy/CORS/cookie probe;
5. pre-deploy backup, forward migration, health/readiness smoke, rollback rules;
6. automated encrypted backup retention и timed restore drill в другую БД.

### 10.4 [P1] `/health` проверяет процесс, но не готовность приложения

`HealthService` всегда возвращает `{status:'ok', timestamp}` и не проверяет DB,
migrations или scheduler readiness. Оркестратор может направить трафик в process,
который не способен принять Bid или закрыть Listing.

Durable fix: разделить liveness и readiness. Readiness выполняет bounded DB query,
сверяет applied migration state/requisite startup services; scheduler heartbeat и
stale lifecycle counts идут в operations signal, но не превращают каждый
liveness probe в тяжёлую aggregation.

### 10.5 Environment fail-closed gaps

Полные findings уже записаны в §5; release gate должен отдельно доказать:

- `APP_ENV=production` не может сочетаться с non-production `NODE_ENV`;
- `NODE_ENV=production` не может сочетаться с local/staging semantics;
- production JWT secret имеет достаточную entropy/length, а не `min(1)`;
- CORS origin — exact expected HTTPS origin; `TRUST_PROXY` соответствует
  фактическому proxy topology;
- analytics environment назначается сервером;
- test bypass и destructive seed гарантированно fail closed.

### 10.6 Test strategy gaps

Root Turbo graph не содержит task `test`: `build/lint/typecheck` централизованы,
а unit/integration/E2E запускаются отдельными scripts и легко пропускаются. До
release нужен один non-destructive verification command/CI pipeline со стадиями:

- format check, lint, typecheck;
- unit всех workspace packages;
- migrations from zero + PostgreSQL integration;
- Expo web export и выбранные native exports в зависимости от launch target;
- full Chromium E2E на disposable guarded DB;
- dependency/license/advisory scan с сохранённым result;
- explicit artifact/version/SHA и smoke result.

Не надо включать real production DB/seed в такой command. E2E fence уже хороший
паттерн и должен оставаться обязательным.

## 11. Dependencies, dead code и documentation drift

### 11.1 Обновлять пакетами риска, не одной большой волной

Снимок `pnpm outdated -r` на дату аудита показывает низкорисковые patch/minor
candidates: Expo 57.0.4→57.0.14 и согласованный Expo family, React
19.2.3→19.2.8, React Query 5.101.2→5.101.4, React Navigation 7.3.8→7.3.16,
Socket.IO client 4.8.1→4.8.3, Turbo 2.10.0→2.10.11, Vitest 4.1.10→4.1.11,
Playwright 1.61.1→1.62.1.

Применять их после фикса package-manager/CI, небольшими cohorts с полным affected
graph. Не смешивать с feature work или critical auction fixes.

Отдельные planned migrations после pilot: Nest 10→11, Prisma 6→7, Zod 3→4,
ESLint 8→10, Tailwind 3→4, AsyncStorage 2→3, React Native 0.86→0.87,
TypeScript 6→7. Nodemailer обновить раньше из-за advisory, но как отдельный
security upgrade со SMTP tests. Major upgrades вслепую до pilot увеличат риск.

`pnpm audit --prod` в этой среде не завершился с пригодным результатом; поэтому
заявлять «0 vulnerabilities» нельзя. CI advisory scan с lockfile и сохранённым
output — незакрытый release gate.

### 11.2 Dead/legacy candidates

#### Удалить после targeted verification

- `apps/api/src/users/users.module.ts`: пустой и не импортируется.
- Legacy phone verification model/fields/contracts/register input: только после
  data check и DEC-050-aligned migration; handoff phone сохранить.
- `TELEGRAM_BOT_TOKEN`/`TELEGRAM_WEBAPP_URL` env schema/template: runtime consumer
  не найден, пока Telegram scope не утверждён.

#### Не удалять без dependency proof

В mobile source не найдены прямые imports ряда packages:
`@gorhom/bottom-sheet`, `@react-native/normalize-colors`, `fbjs`,
`inline-style-prefixer`, `memoize-one`, `nullthrows`, `postcss-value-parser`,
`react-native-css-interop`. Они могут быть намеренно pinned transitive/runtime
requirements Expo/RNW/NativeWind. Их статус `UNCERTAIN`: сначала depcheck/manual
resolution, clean web+iOS+Android builds и runtime smoke; только потом remove.

`nativewind` нельзя объявлять dead только из-за отсутствия `className`: текущий
Babel/Metro/global CSS pipeline использует его для web focus/reduced-motion.

### 11.3 [P1/docs] Clean start инструкция сейчас противоречит seed

README и `.env.example` требуют `SEED_ADMIN_PASSWORD_HASH`, но seed читает
`SEED_ADMIN_PASSWORD` и сам делает Argon2 hash; дополнительно нужен явный
`ALLOW_DESTRUCTIVE_DEMO_SEED=true`. Новый разработчик или deployment rehearsal
получит broken documented path либо начнёт импровизировать с credentials.

Evidence: `README.md:144`, `.env.example`,
`packages/database/prisma/seed.js:169`, актуальная запись Project Status.

Durable fix: безопасный local-only example без рабочего secret, точные guard
requirements и отдельные команды create/migrate/seed; затем проверить буквально
с чистого checkout/volume. Не документировать production seed credentials.

### 11.4 Canonical document drift, требующий founder-controlled cleanup

- `05-MVP-RFC.md:453` сохраняет исторический footer про verified-phone и старые
  gaps, хотя актуальный текст/DEC-050 используют email.
- Protected `09-TRUST-AND-AUCTION-INTEGRITY.md` содержит старые hard-close/reserve/
  phone statements, пересмотренные DEC-039/DEC-050 и текущим кодом.
- README всё ещё описывает analytics как отсутствующую, тогда как `450d405`
  добавил first-party foundation/dashboard.
- `11-PROJECT-STATUS.md` смешивает исторические test counts с текущими и может
  создавать впечатление общей user-facing recovery, хотя password recovery нет.
- `10-CODE-ARCHITECTURE.md` после `7189219` утверждает безусловный ENDED, но generic
  Order failure всё ещё rollback-ит close (§6.1).

Protected owner docs нельзя править в обычной engineering задаче. Сначала founder
подтверждает, что более поздние decisions действительно пересматривают строки;
затем append/revision сохраняет историю и один owner per claim. Architecture/status
обновляются только после фактического исправления и свежей проверки.

## 12. First real users, operations и cost simulation

### 10 users, 1 creator, 1 real auction

Самый вероятный ущерб не от scale: пользователь теряет password; SMTP не доставляет
verification; единственный seller не видит Order; generic Order error оставляет
завершившийся Listing LIVE; founder не может безопасно скрыть спорный Listing или
заблокировать User; keyboard-only buyer не может подтвердить ставку. Один такой
случай затрагивает весь pilot outcome.

Ежедневно founder будет вручную: модерировать Seller/Product, проверять будущие и
завершившиеся Listings, разбирать email verification, следить за handoff, отменять
или заменять Order, отвечать на account access и исправлять контент. Сейчас часть
этого требует догадаться о publicId/API или SQL. Tiny named admin actions полезнее
новой большой feature.

### 100 users, 5 creators, 5 concurrent auctions

Появляются scheduler-downtime case со stuck SCHEDULED, медленные unbounded admin/
seller queries, шум analytics, duplicate/lost best-effort events, SMTP rate/
delivery support и заметный DB/image egress. Single API replica всё ещё допустим,
если явно enforced и monitored; distributed system пока не нужен.

### 1 000 users, 50 creators

Нужны cursor/bounded lists, lifecycle/recovery queue visibility, object storage и
derivatives, retention для analytics, capacity/backup measurements, externalized
rate limiting/realtime только если появляется >1 API instance. Текущий modular
monolith остаётся правильной архитектурой; его не надо делить на services.

### Cost traps

1. PostgreSQL BYTEA originals + backups/WAL + повторный full-image egress — главный
   потенциально неожиданный расход.
2. First-party analytics без retention/idempotency увеличивает основную БД и
   backup; до pilot стоимость мала, бесконечный retention — нет.
3. SMTP при малом объёме дешевле сложной notification platform; важнее delivery
   proof и abuse limits.
4. Socket.IO/scheduler в одной replica дёшев, пока topology enforced. Redis/Kafka
   «на будущее» только добавят ops cost.
5. Expo web bundle около 5.4 MB требует measurement/lazy-loading после core gates,
   но сейчас не оправдывает rewrite или отдельный web frontend.

### Mobile/Web architecture verdict

Один Expo Router/React Native Web client соответствует подтверждённому
browser-first MVP и размеру команды. Создавать отдельный Next/web app сейчас не
нужно. Перед реальным native pilot надо отдельно доказать session persistence:
client полагается на `credentials:'include'`, но не реализует native SecureStore/
Bearer credential lifecycle. Тогда же понадобятся deep-link OAuth details и
platform review; это P2, пока App Store/Google Play launch не входит в MVP.

## 13. Features worth building

| Feature                          | User value                                 | Complexity | MVP priority       | Recommendation                                       |
| -------------------------------- | ------------------------------------------ | ---------: | ------------------ | ---------------------------------------------------- |
| Password reset                   | возвращает доступ к bids/wins/handoff      |          M | critical           | **NOW**                                              |
| Seller Order inbox               | делает handoff реально выполнимым          |          M | critical           | **NOW**                                              |
| Admin lifecycle/recovery console | убирает опасные SQL/API операции           |          M | critical           | **NOW**                                              |
| Rejected Product resubmit/clone  | сохраняет первых creators после moderation |          M | high               | **AFTER FIRST PILOT** или раньше при реальном reject |
| Google login                     | сокращает register/verify для части buyers |          L | medium             | **AFTER FIRST PILOT**                                |
| Watchlist/favorites              | даёт намерение вернуться без messaging     |          M | medium             | **AFTER FIRST PILOT**                                |
| Share/referral tracking          | измеряет creator-led acquisition           |        S–M | medium             | **AFTER FIRST PILOT**                                |
| Relist previous Product          | снижает seller setup для повторной продажи |          M | medium             | **AFTER 5–10 SALES**                                 |
| Outbid/ending reminder           | возвращает bidder в аукцион                |          L | medium после proof | **AFTER 5–10 SALES**, начать с email-only            |
| Telegram login                   | мало сокращает flow без email              |          L | low                | **LATER**; текущий MVP — **REJECT**                  |

Не строить generic notification system для одной гипотезы. Если первые продажи
покажут необходимость, сначала одна server-side email notification с preference,
idempotency, delivery log и abuse limit.

## 14. Final prioritized backlog — 27 задач

|   # | Priority | Task                                                                         | Why                                                             | Effort | Risk if ignored                   |
| --: | :------: | ---------------------------------------------------------------------------- | --------------------------------------------------------------- | :----: | --------------------------------- |
|   1 |    P0    | Разделить Listing close и Order creation; generic failure сохраняет ENDED    | заявленная core guarantee сейчас rollback-ится                  |   M    | поздние bids, неверный outcome    |
|   2 |    P0    | Password reset + session invalidation + UI                                   | потерянный пароль блокирует bids/wins навсегда                  |   M    | потеря доступа/доверия            |
|   3 |    P0    | Named admin User ban/session revoke и Listing hide/cancel/recovery           | founder не может остановить инцидент без SQL                    |   M    | abuse и необратимые ручные ошибки |
|   4 |    P0    | Upload authorization-before-decode, pixel/frame budgets, bounded concurrency | authenticated compressed/animated images могут истощить process |   M    | API outage                        |
|   5 |    P0    | Reproducible release + backup/restore drill + one-replica control            | нет доказанного безопасного пути выпуска/возврата данных        |   L    | потеря auction data/downtime      |
|   6 |    P1    | Seller Orders inbox и handoff actions                                        | seller не знает выигранный Order id                             |   M    | реальная продажа не завершается   |
|   7 |    P1    | Policy/recovery для expired SCHEDULED                                        | downtime оставляет Listing навсегда SCHEDULED                   |   M    | пропущенный/непонятный аукцион    |
|   8 |    P1    | Admin needs-order UI queue + audited idempotent action                       | recovery API операционно скрыт                                  |   S    | Order остаётся потерянным         |
|   9 |    P1    | DB constraints для Bid/Order/status/money/cross-listing invariants           | сервисные проверки обходятся concurrency/manual writes          |   M    | историческая corruption           |
|  10 |    P1    | Immutable Order Product snapshot + replacement deadline policy               | история меняется, текущий deadline сразу expired                |   M    | dispute/нерабочая замена          |
|  11 |    P1    | Resume Listing DRAFT и Product REJECTED recovery                             | reload/reject создают тупики и duplicates                       |   M    | потеря creator conversion         |
|  12 |    P1    | Keyboard-accessible bid confirmation                                         | часть buyers не может сделать ставку                            |   S    | inaccessible core action          |
|  13 |    P1    | Исправить Activity для CONTACTED/HANDOFF_FAILED/CANCELLED                    | UI показывает неверный outcome/403                              |   S    | buyer confusion/support           |
|  14 |    P1    | Fail-closed env/JWT + DB readiness endpoint                                  | опасные profile combinations проходят validation                |  S–M   | insecure/misrouted release        |
|  15 |    P1    | SMTP staging smoke + Nodemailer patched upgrade                              | verification — обязательный gate                                |   M    | signup outage/security debt       |
|  16 |    P1    | Analytics cohort formulas + attribution DB limits                            | dashboard принимает неверные решения/теряет first touch         |   M    | ложные founder metrics            |
|  17 |    P1    | Analytics routes/environment/range/request-id bounds                         | broken links и загрязнение production data                      |   S    | dashboard/support degradation     |
|  18 |    P1    | Metadata-only Product detail + versioned mutable image cache                 | лишние 40 MiB reads и годовой stale content                     |   S    | latency/memory/stale UI           |
|  19 |    P1    | Починить exact pnpm bootstrap; единый CI verification gate                   | browser tests сейчас не воспроизводятся                         |   M    | regressions доходят до release    |
|  20 |    P1    | Stable business error codes для auth/seller/product/order                    | UI зависит от английского server wording                        |   M    | плохая recovery/локализация       |
|  21 |    P1    | HTTPS-only social link schemes                                               | public profiles могут открывать unsafe schemes                  |   XS   | phishing/client abuse             |
|  22 |    P1    | Исправить README/.env seed path и canonical status/architecture claims       | clean rehearsal и release evidence вводят в заблуждение         |   S    | неверные ручные действия          |
|  23 |    P1    | Patch/minor dependency wave + завершённый production advisory scan           | known drift и audit result отсутствует                          |   M    | скрытый dependency risk           |
|  24 |    P2    | Home lightweight queries; bounded seller/activity/admin pagination           | текущий fan-out/unbounded memory растут линейно                 |   M    | latency при 100–1 000 users       |
|  25 |    P2    | Analytics event idempotency, abuse budget и retention                        | best-effort data дублируется/растёт бесконечно                  |   M    | DB cost/неточные trends           |
|  26 |    P2    | Удалить legacy phone/Telegram auth footprint и доказанно dead dependencies   | лишняя модель/поля/поддержка                                    |   M    | путаница и upgrade surface        |
|  27 |    P2    | Native session/OAuth architecture перед mobile-store pilot                   | cookie-only path не доказан на native                           |   M    | native login instability          |

P3 tasks намеренно не добавлены: при ограничении в 30 задач polish без реальной
launch value только разбавляет очередь.

## 15. TOP 10 NEXT TASKS

Порядок учитывает не только severity, но и отдачу для одного разработчика:

1. Исправить rollback generic Order failure и regression test `LIVE→ENDED`.
2. Реализовать password reset с invalidation всех старых sessions.
3. Починить exact pnpm bootstrap и сделать один воспроизводимый verification gate.
4. Выполнить release rehearsal + backup/restore drill на staging/disposable DB.
5. Добавить founder emergency User/Listing actions с audit trail.
6. Дать seller Orders inbox и пройти один полный handoff реальными ролями.
7. Закрыть image decode resource limits и metadata-only detail query.
8. Решить expired SCHEDULED recovery и показать его в admin attention.
9. Добавить admin missing-Order queue/action, не оставлять recovery API-only.
10. Закрепить critical Bid/Order invariants в PostgreSQL additive migration.

Google/Telegram, watchlist и advanced analytics сознательно не входят в Top 10:
они не спасают первый auction при недоступном аккаунте, broken close или отсутствии
операционного восстановления.

## 16. QUICK WINS

- `XS`: allowlist `https:` (при необходимости `mailto:`) для public social links.
- `XS`: убрать пустой unimported `UsersModule` после affected build.
- `S`: metadata-only select в `ProductsService.getPublic`.
- `S`: исправить Activity statuses и не линковать cancelled Order к forbidden page.
- `S`: сделать bid confirmation keyboard-operable с browser test.
- `S`: исправить analytics public route links; удалить href отсутствующих screens.
- `S`: ограничить custom period/request id и назначать analytics environment сервером.
- `S`: согласовать attribution contract/column limits.
- `S`: version/checksum URLs для mutable seller/process images.
- `S`: исправить README/`.env.example` на реальный guarded seed contract.
- `S`: закрепить exact pnpm bootstrap в Playwright/CI.
- `S`: убрать registration phone после data/migration check; не трогать handoff phone.

Каждый quick win всё равно требует test и documentation/status update, если меняет
поведение; «маленький» не означает unreviewed.

## 17. DELETE / SIMPLIFY

1. Удалить пустой unimported `apps/api/src/users/users.module.ts`.
2. Удалить legacy phone-verification table/fields/contracts/UI после migration
   data check; оставить seller handoff phone.
3. Удалить unused Telegram env placeholders до отдельного Telegram decision.
4. Не создавать routes только ради analytics links: удалить несуществующие hrefs,
   пока реальные admin detail screens не нужны.
5. Убрать повторные route-local draft assumptions после появления server-backed
   Listing resume; должен остаться один source of truth.
6. После dependency proof удалить только реально лишние direct mobile packages;
   список из §11.2 не является разрешением на blind uninstall.
7. Удалить/переписать stale README/status statements, но не стирать historical
   decisions: revision должна сохранять причину изменения.

Не найдено убедительного основания дробить крупные services прямо сейчас. Некоторые
из них велики, но разделение без конкретного invariant/ownership результата будет
cosmetic refactor. Сначала выделять transaction/lifecycle boundaries, которые
исправляют найденные дефекты.

## 18. DOCS THAT MUST BE UPDATED

| File                                             | Outdated statement                                                | Canonical truth/action                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `README.md`                                      | seed использует `SEED_ADMIN_PASSWORD_HASH`; analytics отсутствует | seed читает guarded plaintext input и хеширует; first-party analytics уже Partial/Implemented по компонентам |
| `.env.example`                                   | stale seed hash и unused Telegram placeholders                    | local guarded seed variables; удалить неподтверждённый Telegram config                                       |
| `docs/product/10-CODE-ARCHITECTURE.md`           | close безусловно сохраняет ENDED                                  | сначала исправить generic rollback, затем описать two-step recovery invariant                                |
| `docs/product/11-PROJECT-STATUS.md`              | смешаны старые counts/широкая recovery формулировка               | свежая evidence table; password recovery = Not implemented; admin Order recovery = Partial до UI             |
| `docs/product/05-MVP-RFC.md:453`                 | исторический verified-phone/gaps footer                           | DEC-050: email verification; status живёт в `11`; менять только как controlled contract cleanup              |
| `docs/product/09-TRUST-AND-AUCTION-INTEGRITY.md` | reserve/hard close/phone drift                                    | DEC-039/DEC-050 и soft close; protected file — только после explicit founder decision                        |
| `docs/product/analytics-contract.md`             | first-touch promise без contract/DB boundary outcome              | после фикса зафиксировать exact limits/idempotency/environment authority                                     |
| `docs/product/analytics-metrics.md`              | sold rate допускает смешанные cohorts                             | определить Listing close cohort/effective Order semantics                                                    |

Audit-only работа не меняет `11-PROJECT-STATUS.md`: фактическое product behavior не
изменилось. Этот audit не является founder decision и не создаёт запись в
`12-DECISION-LOG.md`.

## 19. DO NOT TOUCH YET

- canonical `design/pen/bidplace-web-v2.pen` и любой `.pen` source в code tasks;
- protected product/design owner documents без explicit founder/designer decision;
- microservices, Kafka, CQRS, event sourcing, Kubernetes;
- Redis/distributed locks, пока deployment остаётся enforced single replica;
- отдельный web frontend/rewrite Expo Router;
- payments, delivery integration, Buy Now, reserve price, auto winner replacement;
- generic notification platform, advanced recommendations/cohorts/LTV/warehouse;
- Google/Telegram auth до password recovery и release gates;
- массовые Nest/Prisma/Zod/Tailwind/RN/TypeScript major upgrades одним PR;
- native App Store/Play launch и native auth redesign, пока launch browser-first;
- arbitrary admin CRUD, Bid edit/delete или ручную подмену auction history;
- полную object-storage migration до capacity/hosting decision; immediate upload
  decode limits и derivative URL architecture при этом откладывать нельзя.

## 20. Suggested implementation batches

Каждый batch ниже можно отдать отдельной coding задаче. Обязательные общие условия:
сначала candidate fixes/trade-offs, затем smallest durable fix; unit+PostgreSQL/
browser tests по границе; update `11-PROJECT-STATUS.md`; `.pen` diff = 0.

### Batch A — auction outcome integrity

**Scope:** backlog 1, 7, 9, 10.

**Prompt-ready objective:** сделать завершение Listing необратимым и независимо
восстанавливаемым, определить поведение просроченного SCHEDULED, закрепить Bid/
Order invariants additive migration и immutable Order snapshot/deadline. Не
менять winner ranking или вводить auto replacement.

**Acceptance:** injected generic Order failure → ENDED; повтор создаёт один Order;
stuck SCHEDULED имеет deterministic audited state; real P2002 collision доказан;
cross-listing sourceBid невозможен в DB; migrate-from-zero и integration suite
green.

### Batch B — production/release safety

**Scope:** backlog 5, 14, 19, 23.

**Prompt-ready objective:** закрепить exact Node/pnpm bootstrap, CI verification,
fail-closed production profile/JWT/readiness, staged dependency scan и один
documented deploy/backup/restore rehearsal. Не подключать новую hosting platform
без founder choice.

**Acceptance:** clean checkout выполняет один gate; full Chromium suite стартует и
проходит; invalid env combinations fail startup; readiness падает без DB; restore
в отдельную БД подтверждает Bid/Listing/Order/media counts и sample checksums.

### Batch C — account recovery и email

**Scope:** backlog 2, 15, 20 и auth-часть 22.

**Prompt-ready objective:** безопасный password reset, stable auth/OTP codes,
patched Nodemailer и real staging SMTP smoke. Не добавлять social providers.

**Acceptance:** neutral forgot response; hashed expiring single-use token; reset
инвалидирует sessions; replay/expired/rate tests; локализованные mobile states;
verified SMTP sender/TLS smoke без PII/OTP в logs.

### Batch D — seller/buyer completion

**Scope:** backlog 6, 11, 12, 13 плюс return bid intent.

**Prompt-ready objective:** seller видит свои Orders и выполняет handoff; Listing
draft можно продолжить после reload; rejected creator имеет подтверждённый recovery
path; bid keyboard accessible; Activity различает все Order outcomes.

**Acceptance:** role-based browser E2E creator→moderation→schedule→bid→close→seller
contact→complete; reload/retry без duplicate; Enter/Space отправляет ровно одну
ставку; cancelled/failed handoff не ведут на forbidden screen.

### Batch E — founder recovery console

**Scope:** backlog 3 и 8.

**Prompt-ready objective:** tiny named admin actions для User status/session revoke,
Listing emergency hide/cancel/stuck recovery и missing-Order queue. Все mutations
reasoned, audited, idempotent, invariant-aware; не generic CRUD.

**Acceptance:** admin UI показывает attention queues; double click/retry безопасен;
обычный user получает 403; current DB role/status проверяется; AuditEvent содержит
actor/target/reason/transition; запрещённые history rewrites отсутствуют.

### Batch F — media/performance

**Scope:** backlog 4, 18, 24.

**Prompt-ready objective:** capability check до image decode, bounded pixel/frame/
concurrency budgets, metadata-only Product detail, versioned mutable images и
измеренное устранение Home/admin/seller fan-out.

**Acceptance:** decompression/animated abuse fixtures fail bounded; unauthorised
upload не вызывает Sharp; detail Prisma select исключает BYTEA; replaced image URL
меняется; query-count/latency tests подтверждают improvement.

### Batch G — analytics correctness

**Scope:** backlog 16, 17, 25.

**Prompt-ready objective:** исправить cohort metrics, first-touch limits,
server-owned environment, routes и bounds; затем добавить event idempotency/
retention policy. Не подключать SaaS/BI.

**Acceptance:** sold rate не >100% из-за recovery/replacement; 120/121 boundary
test; staging events не попадают в production view; все href ведут на реальные
routes; duplicate event id не удваивает count; custom period bounded.

### Batch H — cleanup/docs после functional batches

**Scope:** backlog 21, 22, 26.

**Prompt-ready objective:** HTTPS social URLs, корректный clean-start/seed guide,
legacy phone/Telegram removal и доказанный dependency cleanup. Protected docs
только после founder confirmation.

**Acceptance:** unsafe schemes rejected; clean local reset проходит буквально по
README; migration проверена на representative data; handoff phone сохранён;
web/iOS/Android build после removals; current docs не заявляют больше, чем tests.

## 21. Files map для постановки следующих задач

| Area                   | Основные files/modules                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Auction close/recovery | `apps/api/src/lifecycle/listing-lifecycle.service.ts`, `apps/api/src/orders/orders.service.ts`, `apps/api/test/integration/auction/*`      |
| Bid contract           | `apps/api/src/bids/*`, `packages/contracts/src`, `packages/api-client/src`, Product bid UI                                                 |
| Auth/account           | `apps/api/src/auth`, `apps/api/src/otp`, `apps/api/src/core/config/env.ts`, mobile auth/verification routes                                |
| Admin                  | `apps/api/src/admin`, `apps/mobile/src/features/admin`, `apps/mobile/src/app/(admin)`                                                      |
| Seller/Product/Listing | `apps/api/src/sellers`, `apps/api/src/products`, `apps/api/src/listings`, corresponding mobile features/routes                             |
| Buyer Activity/Order   | `apps/api/src/activity`, `apps/api/src/orders`, `apps/mobile/src/features/activity`, Order screens                                         |
| Media                  | `apps/api/src/images`, seller photo controllers, Prisma ProductImage/CreationStep/SellerProfile fields                                     |
| Analytics              | `apps/api/src/analytics`, `apps/api/src/admin/admin-analytics.service.ts`, `apps/mobile/src/lib/analytics`, analytics contracts/docs       |
| Persistence            | `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations`, seed/tests                                                |
| Release/tests          | root `package.json`, `turbo.json`, `apps/mobile/playwright.config.ts`, API Vitest configs, Docker/local docs                               |
| Canonical product docs | `docs/product/05-MVP-RFC.md`, `09-TRUST-AND-AUCTION-INTEGRITY.md`, `10-CODE-ARCHITECTURE.md`, `11-PROJECT-STATUS.md`, `12-DECISION-LOG.md` |

## 22. Final executive handoff

### P0 blockers

Auction generic-close rollback, password recovery, emergency founder controls,
image decode resource exhaustion и отсутствие доказанного release/restore path.

### P1 pre-pilot improvements

Seller Orders, stuck SCHEDULED recovery, admin missing-Order UI, DB invariants,
Order snapshots, draft/rejection recovery, bid accessibility, correct Activity,
production env/readiness, SMTP/dependency security, analytics correctness,
image metadata/cache, reproducible E2E и stable business errors.

### P2 post-pilot

Measured query pagination/optimization, durable analytics delivery/retention,
legacy cleanup, native session architecture и product features из §13 согласно
реальному usage. Google — после первого pilot; Telegram — не сейчас.

### Итог

**NO-GO для первого необратимого реального аукциона сегодня.** Не потому, что
modular monolith или UI foundation неверны: они в целом подходят. Причина — пять
конкретных P0 operational/core risks, включая новый counterexample к заявлению
«auction core закрыт». После backlog 1–5 и повторного full release rehearsal можно
дать **GO для закрытого browser pilot**. Остальные P1 следует закрывать до или
непосредственно в ходе первых 5–10 пользователей, начиная с seller handoff и
founder recovery.

Audit не изменял production code, schema, protected documents или canonical Pen.
