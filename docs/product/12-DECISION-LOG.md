# bidplace — журнал решений

Действующие решения: идентификатор, дата, статус и текст **Decision**.
Обоснования, отклонённые варианты и ход обсуждения сняты с рабочего дерева.
Полный журнал: `git show d0efc03b:docs/product/12-DECISION-LOG.md`.

Более поздний DEC заменяет более ранний, если они противоречат. Portfolio-only запуск — DEC-082 и следующие; commerce-записи до него описывают отложенную волну, не текущий публичный контракт.


## DEC-001 — Ценность является ядром

Date: 2026-07-18
Status: Confirmed

Главное слово и принцип bidplace — **ценность**.


## DEC-002 — Внешняя формулировка

Date: 2026-07-18
Status: Confirmed

`bidplace — место, где ценят`.


## DEC-003 — Первый механизм: timed auction

Date: 2026-07-18
Status: Confirmed

MVP тестирует timed auction.


## DEC-004 — Seller-tool-first

Date: 2026-07-18
Status: Confirmed

Первый traffic приводит seller.


## DEC-005 — Закрытый запуск

Date: 2026-07-18
Status: Confirmed

Первые sellers/lots допускаются вручную.


## DEC-006 — Первый рынок

Date: 2026-07-18
Status: Confirmed

Беларусь, русский интерфейс, BYN.


## DEC-007 — Первый creator

Date: 2026-07-18
Status: Hypothesis

Таисия Борисова — предпочтительный первый seller.


## DEC-008 — Hard close в MVP

Date: 2026-07-18
Status: Confirmed

Bids прекращаются строго по server `endsAt`.


## DEC-009 — Soft close planned

Date: 2026-07-18
Status: Planned

Позднее last-minute bid может продлевать auction.


## DEC-010 — Внешние уведомления не входят в MVP

Date: 2026-07-18
Status: Confirmed

Нет outbid/ending email, push, SMS. Вместо них — in-app participation status.


## DEC-011 — Искусственные ставки запрещены

Date: 2026-07-18
Status: Rejected

Никаких fake bids, linked accounts или platform seed bids.


## DEC-012 — Общий resale запрещён

Date: 2026-07-18
Status: Rejected

bidplace не становится вторичным рынком.


## DEC-013 — Два seller-направления

Date: 2026-07-18
Status: Confirmed

1. Творческие создатели.
2. Популярные люди с личными/связанными предметами.


## DEC-014 — Brands отложены

Date: 2026-07-18
Status: Rejected for current stage

Не строить brand onboarding.


## DEC-015 — Creator без известности может быть допущен

Date: 2026-07-18
Status: Confirmed

Follower count не абсолютный gate.


## DEC-016 — Телефон перед первой ставкой

Date: 2026-07-18
Status: Confirmed

Просмотр и базовая регистрация без обязательного телефона; verification перед bid.


## DEC-017 — Scheduled preview

Date: 2026-07-18
Status: Confirmed

Auction page публикуется заранее, bidding открывается в `startsAt`.


## DEC-018 — Seller privacy mode

Date: 2026-07-18
Status: Confirmed

Seller может скрыть личный contact и сам написать winner.


## DEC-019 — Bid history сохраняется

Date: 2026-07-18
Status: Confirmed

Bid audit не удаляется вместе с UI auction.


## DEC-020 — Первые пилоты без комиссии

Date: 2026-07-18
Status: Confirmed

0% для первых пилотов.


## DEC-021 — Монетизация не фиксируется заранее

Date: 2026-07-18
Status: Hypothesis

Buyer fee, seller fee, promotion, subscription, paid tools.


## DEC-022 — Discovery позднее

Date: 2026-07-18
Status: Planned

Feed, recommendations и AI не входят в первые фазы.


## DEC-023 — Technical gate: 10 users

Date: 2026-07-18
Status: Confirmed

До pilot полный scenario с 10 concurrent users и simultaneous bids.


## DEC-024 — Concierge для первых sellers

Date: 2026-07-18
Status: Confirmed

Первые 5–10 sellers сопровождаются вручную.


## DEC-025 — Профиль без рангов

Date: 2026-07-18
Status: Confirmed

Не использовать «профессионал/любитель».


## DEC-026 — Образовательный контент не продукт

Date: 2026-07-18
Status: Confirmed

Контент используется для роста и объяснения ценности.


## DEC-027 — Services/masterclasses отложены

Date: 2026-07-18
Status: Rejected for current roadmap

Не добавлять booking без повторяющегося спроса.


## DEC-028 — Charity и significant events отложены

Date: 2026-07-18
Status: Rejected for current stage

Не тратить resources до реального запроса.


## DEC-029 — Документы разделены по state

Date: 2026-07-18
Status: Confirmed

У каждого вида информации один документ-владелец.


## DEC-030 — Roadmap трёхмесячными волнами

Date: 2026-07-18
Status: Confirmed

План на 24 месяца, без недельной feature-гонки.


## DEC-031 — Market reports дают гипотезы

Date: 2026-07-18
Status: Confirmed

Внешний отчёт не становится проверенным фактом автоматически.


## DEC-032 — Admin panel сохраняется

Date: 2026-07-18
Status: Confirmed

Admin — controlled operations layer, расширяется по реальным задачам.


## DEC-033 — Mobile web first

Date: 2026-07-18
Status: Confirmed

Первый продукт распространяется ссылкой и должен отлично работать в mobile browser.


## DEC-034 — Start price и reserve

Date: 2026-07-18
Status: Hypothesis

MVP поддерживает hidden reserve; цена первого seller согласуется вручную.


## DEC-035 — Три источника ценности

Date: 2026-07-18
Status: Confirmed

Авторство, личная связь, подтверждённая ограниченность.


## DEC-036 — Mass brand не создаёт ценность автоматически

Date: 2026-07-18
Status: Confirmed

Логотип и retail scarcity недостаточны.


## DEC-037 — Product и Listing разделяют предмет и размещение

Date: 2026-07-18
Status: Confirmed

Каноническая модель MVP: `SellerProfile → Product → Listing → AuctionRules → Bid[] → Order`.
`Product` описывает физический предмет и может иметь несколько `Listing` во времени. `Auction` больше не является aggregate root; термин сохраняется только для аукционных правил и политик.


## DEC-038 — Публичная ссылка Product использует random publicId

Date: 2026-07-18
Status: Confirmed

Единственный публичный detail route — `/product/[publicId]`. `Product` и `Order` получают неизменяемый криптографически случайный publicId; title-derived slug и `/auctions/[slug]` удаляются без compatibility period.


## DEC-039 — BYN, startPrice и soft close для MVP

Date: 2026-07-18
Status: Confirmed

MVP использует только BYN. Reserve и Buy Now исключены. `AuctionRules.startPrice` — минимальная цена продавца. Soft close применяется как 60-second window, 60-second extension, 600-second total cap.


## DEC-040 — Order foundation и минимальная moderation входят в MVP

Date: 2026-07-18
Status: Confirmed

После завершённого Listing создаётся privacy-safe `Order` без payment/delivery machine. SellerProfile и Product используют минимальные admin-only approval transitions. Automatic winner replacement и visual redesign не входят в текущую реализацию; light redesign отложен в Task B.


## DEC-041 — Task A closed-pilot verification boundary

Date: 2026-07-19
Status: Confirmed

Task A is accepted for a closed pilot with manual controls after its focused Chromium E2E and full repository gates. WebKit, full browser/device matrix, visual regression, exhaustive seller/admin E2E, accessibility automation and ten-session rehearsal are release hardening after Task B, not prerequisites for the pilot.


## DEC-042 — Публичная заявка seller и отдельный доступ к продажам

Date: 2026-07-23
Status: Confirmed

Кнопка «Стать seller» доступна публично зарегистрированному User. Заявка создаёт SellerProfile, но не даёт право создавать или публиковать Product и Listing. После ручного admin approval выдаётся отдельный persisted seller access; admin может его отозвать. Buyer account и seller capability не являются одной ролью.


## DEC-043 — Данные публичного SellerProfile

Date: 2026-07-23
Status: Confirmed

Для заявки seller обязательны profile photo, имя и фамилия либо название seller, краткое описание автора/стиля работ и хотя бы один social link или другие публично проверяемые данные. SellerProfile отделён от buyer account; имя из регистрации может предзаполнять профиль, но seller может выбрать другое публичное имя или название.


## DEC-044 — Модерация Product до публичной публикации

Date: 2026-07-23
Status: Confirmed

Seller создаёт private Product draft и отправляет его на admin moderation. Пока Product не approved, он недоступен в public catalog и по public URL. Для creator-made Product обязательна минимум одна собственная фотография; состояние не является обязательным MVP-полем.


## DEC-045 — Ручная замена winner в MVP

Date: 2026-07-23
Status: Confirmed

При отказе или недоступности winner admin фиксирует причину, отменяет исходный Order и вручную выбирает replacement из ranked Bid list. История исходного Order и winner сохраняется.


## DEC-046 — Минимальная first-party analytics для pilot

Date: 2026-07-23
Status: Confirmed

MVP фиксирует только минимальные first-party события воронки и результата сделки. Dashboard и third-party marketing trackers не входят в решение.


## DEC-047 — Временные поля для будущих retention policies

Date: 2026-07-23
Status: Confirmed

Persisted entities должны иметь `createdAt` и `updatedAt`; Product дополнительно получает `publishedAt` при первой публичной публикации. PII и audit хранятся бессрочно до отдельной legal/privacy policy.


## DEC-048 — Дизайн не расширяется в ближайшей MVP-волне

Date: 2026-07-23
Status: Confirmed

Следующая MVP-волна использует существующий UI. Redesign и новые визуальные направления не входят в seller access, moderation, handoff, analytics и security work.


## DEC-049 — SellerProfile approval является seller capability

Date: 2026-07-23
Status: Confirmed

Любой зарегистрированный User может открыть seller cabinet и создать заявку SellerProfile со статусом `PENDING_REVIEW`. Отдельная сущность grant не создаётся: возможность писать Product и Listing появляется только у `APPROVED` SellerProfile и отзывается статусом `SUSPENDED`. Admin role и seller capability остаются независимыми.


## DEC-050 — Email verification и принятие правил перед первой ставкой

Date: 2026-07-23
Status: Confirmed

Production MVP использует email verification перед первой ставкой. В то же действие buyer принимает версию правил сервиса; версия и timestamp сохраняются. Telegram verification и phone verification не входят в MVP. Dev/test bypass допускается только вне production.


## DEC-051 — Публичный профиль и handoff contacts

Date: 2026-07-23
Status: Confirmed

SellerProfile использует одно публичное поле `fullName`, которое может содержать имя, имя и фамилию или название. Публично показываются базовые данные профиля: photo, `fullName`, description, страна и допустимые public links.

Seller отдельно указывает handoff contact: Telegram, phone или Instagram. После создания active Order buyer получает этот contact, seller получает verified buyer email. Privacy mode seller сохраняется.


## DEC-052 — Public catalog и история завершённого Product

Date: 2026-07-23
Status: Confirmed

Product появляется в public catalog только после moderation approval и при `SCHEDULED` либо `LIVE` Listing. После завершения он исключается из общего каталога, но сохраняется по прямому public URL с результатом и историей, пока admin его не скрыл.


## DEC-053 — Юридическая граница MVP в Беларуси

Date: 2026-07-23
Status: Confirmed

Для MVP в Беларуси bidplace не принимает оплату, не организует доставку и не выступает escrow. Сервис предоставляет авторизацию, seller application/moderation, размещение предмета, ставки и определение winner. Seller несёт ответственность за налоги, законность и точность размещаемого content, право продажи и фактическую передачу предмета.

До real pilot нужны public rules, privacy notice и legal review checklist. Это решение не является юридическим заключением.


## DEC-054 — Нет удаления и автоматизации replacement в MVP

Date: 2026-07-23
Status: Confirmed

В MVP нет self-service удаления account, Product, PII или audit. Все winner replacement выполняются вручную admin. AI-анализ и автоматическая replacement logic не входят в MVP и не получают заранее заданного post-MVP workflow.


## DEC-055 — Final Modern UI выполняется единым cutover

Date: 2026-07-27
Status: Confirmed

Modern UI реализуется в отдельной `feature/modern-ui-final` ветке как единая финальная система. В scope входят все уже работающие маршруты и только они. В runtime не остаётся bridge с Tamagui, legacy fallback, feature flag или частично мигрированный маршрут. После полной проверки Tamagui и legacy UI удаляются.

Временный логотип до поставки approved asset: compact mark на desktop и live lowercase `bidplace` в Inter на mobile. Product scope не расширяется Search, Settings, saved items, filters или новыми API.


## DEC-056 — Клиентская проверка ставки и подтверждение первой ставки

Date: 2026-07-27
Status: Confirmed

Client проверяет обязательность, числовой BYN формат и таблицу Bid increments из MVP RFC для немедленной обратной связи. Backend остаётся единственным источником истины для minimum next bid, current price, Listing status, deadline и soft close.

Перед первой Bid пользователя в конкретном Listing UI показывает confirmation с предметом, суммой, актуальным minimum, server deadline и последствием действия. Повторная Bid в том же Listing не требует повторного confirmation, если participation достоверно известен. Rejected/stale Bid refetches canonical HTTP snapshot и не получает success presentation.


## DEC-057 — Web-first UI polish boundary

Date: 2026-07-30
Status: Confirmed

Вторая UI-волна использует web-first spatial logic: белый canvas, компактный icon rail, единый account control справа и shared page-state primitives. Seller navigation derives capability from `SellerProfile.status`; `APPROVED` остаётся единственным доступом к созданию предмета. Автор Product берётся из публичного `SellerProfile.fullName`, а публичная история строится только из Product/Listing данных.

Tags, search, tag filtering, notifications, account settings, password reset, buyer profile page, new Product fields и mobile redesign отложены.


## DEC-058 — Admin не участвует в торгах

Date: 2026-07-30
Status: Confirmed

Admin имеет только Catalog и Moderation в навигации. Backend отклоняет admin Bid и не предоставляет admin buyer Activity; admin может просматривать каталог и модерировать SellerProfile/Product. Это уточняет роль admin без расширения buyer capability.


## DEC-059 — Завершённые лоты остаются в public catalog

Date: 2026-07-31
Status: Confirmed

Public catalog включает `APPROVED` Product с `SCHEDULED`, `LIVE` или `ENDED` Listing. Для Product с несколькими публичными Listing selector использует приоритет `LIVE`, затем `SCHEDULED`, затем последний `ENDED`. Default-фильтр только открытых торгов отложен.


## DEC-060 — Local/test-only demo Bid fixtures are allowed

Date: 2026-07-31
Status: Confirmed

Explicitly local/test-only Bid and Order fixtures are allowed solely in isolated
development and test databases. They support deterministic UI demos and E2E
fixtures; they are not platform bids and must never reach production runtime or
real auctions. E2E fixtures may dynamically create buyer/Bid/Order state in a
disposable PostgreSQL database.


## DEC-061 — Wave B semantic action and keyboard focus colors

Date: 2026-08-02
Status: Confirmed

For Wave B shared visual-system fixes, small accent text uses the contrast-safe semantic `accentDark` color `#BC3C1B`, destructive text and buttons use `#B63B3B`, and keyboard focus uses `#2457E6`.


## DEC-062 — Canonical Pen v2 is immutable during implementation

Date: 2026-08-10
Status: Confirmed

`design/pen/bidplace-web-v2.pen` is the canonical visual reference for the new
bidplace public UI. During implementation, refactoring, testing, review and
documentation work it must never be edited, deleted, renamed, moved, replaced,
formatted or resaved. Production code is adapted to the Pen reference, not the
other way around.

The canonical file may change only in a separately scoped design task with an
explicit founder or assigned-designer instruction. Even such a task does not
authorize deletion: design history and explicit version lineage must be
preserved.

The former `docs/modern-ui/` design system and Pen screen-prompt workflow are
retired. `docs/design/00`–`07` becomes the clean documentation module for
source hierarchy, visual principles, screen mapping, shared components,
status, assets, handoff and implementation planning.


## DEC-063 — Pen v2 UI uses durable shared architecture only

Date: 2026-08-10
Status: Confirmed

The Pen v2 production migration must use one semantic token layer, reusable
shared primitives, one production master for each canonical Pen component and
thin route screens. Exact design measurements are taken from the immutable Pen
source and verified by matched runtime screenshots at 1440, 1024 and 390 px.

Workarounds and hacks are not accepted as final or interim product solutions.
This includes duplicated route-local styles/components, repeated magic values,
parallel token systems, fake data or controls, client-side approximations of
missing API behavior, type/lint suppressions, silent fallbacks and hybrid final
shells. When a durable solution requires an unresolved route, field, data or
API decision, only that scope remains Blocked until the owner decision exists.


## DEC-064 — Foundation, Gamma and Avant Arte define approved interaction references

Date: 2026-08-10
Status: Confirmed

The immutable `design/pen/bidplace-web-v2.pen` remains the only source of exact
static visual composition. Founder-provided Foundation and Gamma archives,
the supplied screenshot set and Avant Arte are approved supporting references
for interaction details that are impractical to encode in static Pen frames:
card image hover zoom, button/menu/tab transitions, translucent controls,
artwork-derived edge blur and atmosphere, sticky surfaces, feedback and
reduced-motion behavior.

The approved logo source is
`/Users/yayauheny/Downloads/Telegram Desktop/logo_assets_web_expo`; it may be
mapped into runtime platform assets without redesigning the mark.


## DEC-065 — Public discovery uses explicit routes and server-owned query semantics

Date: 2026-08-11
Status: Confirmed

The public discovery module uses `/` for Home, `/works` for public auctions and
works, `/authors` for approved creators, and `/search?q=...` for combined work
and author search. Discovery query state is represented in URL parameters and
validated by shared Zod contracts. Product status, category, materials, price,
year and sort semantics are applied by the API to the canonical public Listing
before pagination; clients must not filter, rank or construct Home sections from
an already loaded page.

`GET /api/discovery/home` owns the Home projection for top auctions, creators and
new works. The global header uses `Добавить` with accessibility label
`Добавить работу`, and approved sellers access `Кабинет` from the account
popover rather than a separate top-level utility item.


## DEC-066 — Creator profile uses the MVP v1 final frame

Date: 2026-08-11
Status: Confirmed

The public creator page `/seller/[slug]` uses `MqUMz`, named `FINAL — Desktop
Creator / Profile / MVP v1`, as its only canonical implementation and visual
acceptance target. `HOXkZ`, named `FINAL — Desktop Creator / Profile / Editorial
Refinement v1`, is a rejected alternative for this route and must not be used
as a second target, fallback composition or separate implementation.


## DEC-067 — First-party analytics foundation and admin dashboard

Date: 2026-08-20
Status: Confirmed

MVP analytics is first-party: client events ingest into PostgreSQL
(`analytics_events`, `acquisition_attributions`) via `POST /api/analytics/events`.
Canonical identity remains `User.id`; anonymous installations use a persistent
client `anonymousId`. First-touch attribution is immutable per anonymousId and
may link to a User once on register. Product events are limited to
`listing_viewed`, `seller_viewed`, `registration_started`, `bid_cta_clicked`,
`bid_rejected`. DB-derived marketplace outcomes are not duplicated as analytics
events.

Admin dashboard lives in the existing Expo admin surface
(`/admin/analytics`) and aggregates analytics tables plus PostgreSQL business
tables through `GET /api/admin/analytics/overview`. No third-party marketing
tracker, warehouse, or separate BI service for MVP.


## DEC-068 — MVP static-only image uploads with authz-before-decode

Date: 2026-08-21
Status: Confirmed

Product image uploads accept **static JPEG, PNG, and WebP only**. Reject GIF and
any animated WebP/PNG. Run ownership and approved-seller checks **before** Sharp
decode. Enforce max edge 4096px and 16_777_216 pixels; normalize sequentially to
canonical bytes with bounded `limitInputPixels`; rate-limit upload POSTs.


## DEC-069 — Pilot ops: single-replica Compose + pg_dump backup

Date: 2026-08-22
Status: Confirmed

Pilot production operations use **one API replica** deployed via Docker Compose
(`--profile app`) with PostgreSQL. Media remains in-database `BYTEA`; backup is
encrypted-optional `pg_dump -Fc` via `scripts/ops/backup-db.sh`. Restore targets a
separate database name only; integrity checks sample `ProductImage.checksum`
values after restore.


## DEC-070 — Fixed 48-hour Order contact window

Date: 2026-09-05
Status: Confirmed

Every new auction Order stores `contactDueAt` as a **48-hour snapshot** counted
from that Order's actual creation time. The same window applies to lifecycle
close, admin missing-Order recovery, and manual admin replacement. Seller-chosen
24/48/72 windows are deferred. Historical Orders are not rewritten.

Replacement creates a new Order and therefore receives a fresh 48-hour window. It
does not inherit the cancelled Order's deadline. Idempotent retry of an already
created Order must not extend `contactDueAt`.

The duration lives in one shared server policy
(`apps/api/src/orders/order-contact-deadline.ts`). Lifecycle close and admin
recovery apply it inside `createWinnerOrder` from an explicit `now`; replacement
uses the same `orderContactSchedule`. Callers cannot pass a custom
`contactDueAt`. It is not a database-configurable field in MVP. The snapshot is
not a server gate for `HANDOFF_FAILED`; seller-driven status changes stay
independent of the deadline until an explicit SLA decision.


## DEC-071 — REJECTED Product is recovered on the same Product

Date: 2026-09-05
Status: Confirmed

Product `REJECTED` is not a seller dead-end. An approved seller-owner may open the
same Product, see the latest moderation reason, edit the same fields, images and
creation story allowed in `CHANGES_REQUESTED`, and submit that same Product back
to `PENDING_REVIEW`. A new Product or Listing is not created. Previous
`AuditEvent` rows remain append-only. The Product stays non-public until a later
`APPROVED`. Admin role does not grant seller write. `APPROVED` Products and
scheduled/live Listings stay locked.


## DEC-072 — Expanded MVP product contract (founder defaults)

Date: 2026-09-05
Status: Confirmed

The target web MVP for RF+BY users is **auction + fixed-price sale + optional
price offer**. Item money and delivery stay direct between seller and buyer.
The service starts free; subscription stays future scope. Figma is the visual
direction; Pen remains on disk until a separate cleanup after a complete
handoff.

| Topic                 | Confirmed default                                                                                                                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Offers                | Buyer offer is server-owned. Seller may accept or reject. **No counteroffer** in MVP.                                                                                                                                                                      |
| Next bidder           | Manual audited admin replacement only. Automatic next bidder is out of MVP (`DEC-054` stands).                                                                                                                                                             |
| Contact window        | Fixed 48-hour snapshot on every new Order (`DEC-070`). Seller 24/48/72 is deferred.                                                                                                                                                                        |
| Fixed buy             | A unique work has at most one buyer. Buyer confirmation **atomically** creates the Order. Seller reconfirm is not required. The seller may withdraw the listing only **before** a successful buy. Auction Buy Now / buyout on a live auction is not added. |
| Currency              | Listing stores `BYN` or `RUB` by the seller's chosen market. No IP-based conversion.                                                                                                                                                                       |
| Portfolio             | Portfolio-only author surface is **wave 2**, even if a Figma frame exists. RFC §12 keeps a simple examples block.                                                                                                                                          |
| Transactional email   | In contract: verification, password reset, sale result, replacement/deadline, security/complaint. Outbid and marketing email stay later. RFC §9 still forbids outbid spam.                                                                                 |
| Complaint attachments | Limited private images only. No video or arbitrary files.                                                                                                                                                                                                  |
| Legal review          | Human legal review is required before a public audience. A closed local test among acquaintances is a separate gate.                                                                                                                                       |
| Pen files             | Do not delete or edit canonical Pen in ordinary work. Cleanup is a separate commit only after a complete Figma handoff and an untracked-file inventory.                                                                                                    |

Current runtime may remain auction + BYN until P0-E implements this contract.
Code status lives in `11-PROJECT-STATUS.md`.


## DEC-073 — Expired SCHEDULED listings are cancelled

Date: 2026-09-05
Status: Confirmed

A Listing that remains `SCHEDULED` after `endsAt` is **cancelled**, not left
stuck in the catalog, not silently extended +24h, and not closed as `ENDED`
without bids. The scheduler writes `CANCELLED`, `closedAt = now`, an append-only
`AuditEvent` (`EXPIRED_SCHEDULED_WINDOW`, no user actor) and emits
`listing.updated`. No Order is created. Activation still requires
`startsAt <= now AND endsAt > now` plus approved product/seller handoff.


## DEC-074 — Immutable Order deal snapshot

Date: 2026-09-05
Status: Confirmed

Every new Order freezes the deal surface at create: Product title, Listing
currency, Product public id, Listing identity (`listingId`) and `finalAmount`,
together with the existing handoff contact snapshot. Lifecycle close, admin
recovery and manual replacement load those fields inside the create
transaction through the shared snapshot helper. Order projections prefer the
frozen fields. Historical rows without snapshot columns keep the live
Product/Listing fallback and are not rewritten.


## DEC-075 — Work-first MVP and reopened marketplace mechanics

Date: 2026-09-06
Status: Confirmed scope; mechanics explicitly open

The public web MVP is built around a **Work** that exists independently from a
sale. An author creates the Work first and may keep it as a public portfolio item,
attach a sale later, or relist an archived Work. Portfolio-only is therefore MVP
scope, not wave 2.

The target MVP still includes auction, fixed-price sale and optional buyer price
offer. Current runtime remains auction + BYN until the unresolved mechanics below
are researched and explicitly selected. No implementation may infer those rules
from the former `DEC-072` defaults.

| Topic                            | Status after revision                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Work / Listing                   | Confirmed: separate identities and lifecycles; one Work may exist without an active Listing. Historical sale records remain immutable.                                                    |
| Sale formats                     | Confirmed target: auction + fixed + optional offer. Auction Buy Now is not currently requested.                                                                                           |
| Offer expiry/revoke/counteroffer | Open: compare current marketplace practice, then obtain the required legal answer.                                                                                                        |
| Fixed-buy contract moment        | Product direction is one explicit buyer confirmation for an active unique work; exact legal copy/required terms remain a lawyer gate. Atomicity and double-sale prevention are mandatory. |
| Next bidder / non-payment        | Open: manual admin replacement is current runtime only. Research second-chance offers, ranking, seller choice and contact disclosure before choosing target behavior.                     |
| Contact window                   | Current code stores 48 hours. Product duration, reminders, weekends and enforcement remain open to research/legal review.                                                                 |
| Currency                         | Current MVP stays BYN. RUB or viewer conversion is not confirmed. Research and lawyer review must define contract currency, display hint, rate source and RF implications.                |
| Cabinet                          | Confirmed IA name: `Покупки / Продажи`; cancelled and failed deals must remain visible as history.                                                                                        |
| Expired scheduled                | Confirmed: cancel with audit, notify the author and offer a simple relist path. No silent +24-hour shift.                                                                                 |
| Notifications                    | In-app notifications are required before redesign completion; email is reserved for appropriate transactional/security events after legal/product mapping.                                |
| Error complaint                  | Required before public MVP: explicit report action, privacy-safe technical context and optional private screenshot.                                                                       |
| Object storage                   | S3-compatible media migration and rendition plan occur before final redesign/launch proof, after the current audit tasks.                                                                 |
| Redesign                         | Final implementation layer after product, legal UX and core flows are stable. Original Figma is read-only and must never be modified.                                                     |


## DEC-076 — Sale mode boundaries for the public MVP

Date: 2026-09-06
Status: Confirmed

The public MVP has two separate sale modes attached to a Work:

1. **Auction:** start price, bid increment, start/end time and server-authoritative
   bids. It has no fixed-price buy action and no buyer price offer.
2. **Direct fixed-price sale:** the author sets a fixed price and may optionally
   allow buyers to propose another price.

Payment for the Work and delivery always occur directly between seller and buyer.
bidplace does not accept, hold or transfer item money and does not arrange delivery.

The exact contract moment and required confirmation copy for fixed buy and an
accepted offer remain gates for the written Belarus legal answer. Offer
expiry/revocation and competing-action rules remain separate product decisions.
This decision fixes the product boundary without inventing those rules.


## DEC-077 — Belarus-only current legal workstream

Date: 2026-09-06
Status: Confirmed project scope

The first operator is an individual entrepreneur registered in Belarus. Current
public-document drafting and the launch legal gate are limited to Belarus law.
The active lawyer questionnaire therefore excludes Russian registration,
Roskomnadzor, Russian data localization and other RF-specific questions.

Belarus-law questions about processors, hosting outside Belarus and cross-border
personal-data transfer remain in scope. Earlier BY+RF packs stay as historical
audit material and are not current implementation instructions.

This is a project-scope decision about the legal workstream. It does not turn an
unverified legal proposition into a repository fact.


## DEC-078 — Belarus launch documents and legal UX defaults

Date: 2026-09-06
Status: Confirmed

- The selected activity codes are `63.12` (main), `62.01` and `73.11`
  (additional), based on the lawyer's recheck that all three remain available.
  Their spelling and applicability are rechecked when the IP is registered.
- The seven-file launch document set contains the user agreement/offer, personal-data
  policy, author rules, auction and sale rules, prohibited items and behavior,
  a separate personal-data consent and a separate email-marketing consent. Cookie
  information is a section of the personal-data policy and is linked from a required
  cookie banner. Email-marketing consent is never required for registration and is
  used only where the user voluntarily subscribes.
- Author rules cover contact transfer. The same data-processing meaning appears
  in the personal-data policy and consent.
- Registration exposes the user agreement, policy and personal-data consent as
  three separate mandatory items. Registration is unavailable until they are
  accepted. The 18+ affirmation is separate.
- Direct fixed purchase creates the deal after explicit buyer confirmation.
  When an author explicitly accepts a buyer's price offer, that acceptance
  immediately creates the deal at the accepted price.
- The first error-report version sends only the user's text. Automatic technical
  context preview and optional screenshot are deferred.
- Exact placement and concise copy for the legal controls are selected after a
  read-only comparison of Belarus-facing services and Belarus primary sources.
  Competitor behavior is evidence of a market pattern, not evidence of law.


## DEC-079 — Work availability and persistent fixed sale

Date: 2026-09-07
Status: Confirmed scope; edit and moderation mechanics remain open

Work and its sale attempt remain separate lifecycles. When publishing a Work, the
author may keep it outside sale for the portfolio, attach an auction or attach a
direct fixed-price sale. A portfolio-only Work can receive a Listing later.

A fixed Listing has no required end time. It stays active until an Order is created or
the author withdraws it before a buyer action has created an Order. An auction that
ends without a sale, or a sale whose buyer-side failure is confirmed by the future
handoff rules, may be restarted through a new Listing without rewriting the previous
Listing or Order.

A successfully transferred unique Work remains visible as sold-through-bidplace and
cannot be listed again. The product must also distinguish a Work sold elsewhere from
a Work merely kept outside sale. The final user-facing names and whether the UI groups
these states under `Архив` remain design/research questions; one overloaded database
`ARCHIVED` state must not erase the distinction.

MVP still sells one unique Work at a time. Limited editions, quantity and presale are
future formats. The Work-first contract must document a migration boundary for them,
but unused inventory/presale behavior is not implemented speculatively in MVP.


## DEC-080 — One format-neutral Order identity

Date: 2026-09-07
Status: Confirmed domain boundary; persistence shape remains open

Auction, fixed purchase and accepted buyer offer all create the same domain entity:
one `Order` with one internal ID and one public deal code. UI and API may show how the
deal originated, but they do not create separate auction-order and fixed-order families.

Order must not require `Bid` as the source for non-auction formats and must never create
a synthetic Bid. A type alone is insufficient evidence: the accepted price, Work,
Listing/sale attempt, actors, confirmation and applicable rule versions remain
immutable provenance of the Order.

The exact persistence boundary is intentionally open. The architecture review must
compare a common `DealIntent/PurchaseIntent`, typed origin records and direct typed
references. The chosen model must retain referential integrity, idempotency and
Work-level double-sale protection without putting every future format into nullable
Order columns.

Future quantity and presale must be possible through an explicit inventory/edition
extension. They do not change the current rule that one MVP Order concerns one unique
Work and quantity one.


## DEC-081 — Test-data reset and deferred general platform tooling

Date: 2026-09-07
Status: Confirmed

All current business records are local test data and disposable. Before public pilot,
they may be removed through a controlled reset instead of reconstructing Order history
from mutable Product/Listing fields. Production-like Order reads must not retain a live
fallback after that boundary.

An in-app notification center is deferred until after MVP and is one of the first
follow-up candidates. Current cabinet/activity states remain the MVP status surface.
Research must still identify whether an auction result, accepted offer or second chance
requires a minimal transactional delivery channel before launch.

General reports about a Work or author and a full complaint workspace are deferred.
MVP still needs a narrow problem/outcome flow for the parties of a concrete Order so a
failed handoff can be resolved without rewriting history. The text-only service error
feedback selected in `DEC-078` remains a separate small function and is not changed by
this decision.


## DEC-082 — Первый публичный MVP проверяет портфолио автора

Date: 2026-09-08
Status: Confirmed

Первый публичный MVP bidplace — самостоятельный сервис-портфолио. Автор проходит
модерацию, создаёт публичный профиль, публикует работы и получает одну ссылку и QR для
распространения. Посетитель без регистрации открывает каталог авторов, каталог работ,
профиль и страницу работы.

В первом MVP нет активной коммерции: аукциона, fixed sale, предложения цены, ставок,
Order, handoff, корзины, истории покупок/продаж и контактов для сделки. Это не отказ от
commerce-направления. Оно сохраняется как следующая продуктовая волна после проверки
портфолио и отдельного legal/domain gate.


## DEC-083 — Публичная модель Work без «Архива» и простой creation flow

Date: 2026-09-08
Status: Confirmed

- Публичный профиль имеет вкладки `Работы` и `Об авторе`. Публичной вкладки `Архив`
  нет.
- Публичные работы вне продажи остаются обычными работами портфолио. Draft,
  moderation и hidden — внутренние состояния кабинета.
- Чипы направления, категории и материала сохраняют утверждённый вид. В первом MVP
  они могут быть описательными; переход к поиску по тегу включается позднее.
- Создание Work состоит из трёх шагов: основные фотографии и название; детали;
  необязательная текстовая история создания. Фото-текстовые этапы истории отложены.
- В деталях `Тираж` описывает произведение и не является inventory продажи;
  `Год/дата создания` не называется датой продажи.
- После заполнения Work отправляется на модерацию. Выбор способа продажи, цена,
  валюта, сроки, оплата, доставка и buyer contact отсутствуют.
- Если история не заполнена, пустая вкладка `История` не показывается.

Public likes, wishlist, notification bell и cart/navigation purchase entry отсутствуют
в первом MVP. Share и QR профиля входят в первый MVP.


## DEC-084 — Commerce сохраняется в коде и выключается fail-closed

Date: 2026-09-08
Status: Confirmed implementation boundary

Существующие auction, bid, Order и handoff модули, migrations и tests не удаляются.
Публичный portfolio MVP запускается с server-authoritative commerce capability,
выключенной по умолчанию. Клиент скрывает commerce navigation и actions, а API также
отклоняет прямой вызов выключенных mutations/routes. Одного client-side скрытия
недостаточно.

Commerce tests могут явно включать capability в изолированном test environment.
Долгоживущая отдельная ветка не является хранилищем уже принятого кода: она быстро
расходится с общими исправлениями auth, media и security. Отдельная feature branch
используется только для будущей ограниченной разработки commerce v2 до review/merge.


## DEC-085 — Figma is the production visual source; Pen file stays historical

Date: 2026-09-09
Status: Confirmed

- Production visual source for First MVP phone UI is the read-only Figma inspect
  copy `uMo04w9bgrchWXXDgO4W62`. Canonical origin file `NM63j9lwRMqpo2HvAiYNll`
  stays read-only.
- Runtime has one token layer (`packages/design-tokens` `designTokens`) measured
  from Figma. Nested `designTokens.figma` is not a second system.
- Pen primitives (`AppHeader`, Pen buttons/fields, auction player, slide-to-bid)
  are removed from the render path. `design/pen/bidplace-web-v2.pen` stays in git
  as protected history.
- Layout is phone-only (~390). Wide windows keep a centered 390 column. 1024/1440
  compositions are out of this wave.
- Search overlay, `Открытие недели`, catalog tabs Аукционы/Анонсы/Архив, cart and
  Geist font files are deferred. Work shows an `Оплата и доставка` unavailable
  stub.


## DEC-086 — Opening of the week is a server-owned editorial selection

Date: 2026-09-09
Status: Confirmed

Home may show `Открытие недели` when a durable server-owned editorial pointer
selects a published, publicly visible Work and author. Local/test seed may
include one deterministic example. Production does not invent a selection.
Missing, hidden, rejected or unpublished pointers resolve to `null` and the
section is omitted. Newest-work, random pick and client hardcoded `publicId`
are forbidden.


## DEC-087 — Commerce v1 archived; active main becomes portfolio-native

Date: 2026-09-10
Status: Confirmed

- First public MVP stays portfolio-only with **no displayed price**, sale status,
  timer, bid, order or purchase CTA.
- The last verified full commerce-v1 implementation is frozen at
  `598d8696295d18d32956da7dd366dc19464cc366` under protected refs
  `archive/commerce-v1` and annotated tag `commerce-v1-pre-portfolio`.
  Manifest: `docs/audits/commerce-v1-archive-manifest.md`.
- Do not develop on the archive branch and do not merge it wholesale back into
  `main`. Future `commerce-v2` starts from then-current `main` and uses the
  archive as reference material only.
- After archive recovery verification, physically remove commerce application
  code from `main` in small reviewed commits (P1–P6 in the removal graph). This
  is a separate execution track from Git-history or storage cleanup.
- Do **not** remove Prisma commerce models or edit applied migrations until a
  verified database inventory exists for every supported environment.
- Do **not** rewrite Git history or introduce Git LFS as part of source cleanup.
- Commerce is deferred and may be redesigned; it is not `Rejected`.


## DEC-089 — Discovery facets are derived from public server data

Date: 2026-09-13
Status: Confirmed

Works material options and Authors city/direction options are returned by
`GET /api/portfolio/facets`. Values are normalized, deduplicated and sorted on
the server from currently public authors and published Work revisions only.
The client must not invent Figma/static fallback options. Each stored Work
material string is one canonical facet value; delimiters are not guessed.

The accepted Figma Work card remains title + author. RFC §6 “brief facts” is a
documented product/design ambiguity and does not authorize adding unapproved
fields or changing the Figma master during this implementation.


## DEC-090 — Home Opening curator note is an optional selection field

Date: 2026-09-14
Status: Confirmed

- Editorial copy for Home «Открытие недели» belongs on `CuratorSelection.note`,
  not on `author.shortDescription` or `work.story`. The heading «Выбор куратора»
  is UI chrome.
- `note` is optional (`TEXT NULL`). Empty/null hides the heading and paragraph
  and keeps the author row, profile button, and work card. Section visibility
  still follows `DEC-086`.
- Pre-production schema amendment of
  `20260909120000_portfolio_media_socials_curator/migration.sql` is allowed for
  this unreleased table. After the first production apply, further columns are
  additive. This does not authorize editing commerce or baseline migrations.
- Visual identity for Opening typography remains a later pass. The seed-identity
  clause that kept `@vex` in Playwright only and Anna in Prisma is superseded
  by `DEC-091`.
- Do not change global `outline`. Do not reuse a typography or fill role because
  it is close. The quiet profile pill hugs contents (padding 8/14, radius 28,
  `#EFEFEF` fill, 16% white→`#999999` stroke).


## DEC-091 — Figma Opening identity is local seed; curator is not the work owner

Date: 2026-09-14
Status: Confirmed

- Ordinary local `db:seed` is the Figma Home catalog, not Anna/Unsplash and not
  a Playwright-only fixture. `@vex` is a seeded public author. Opening selected
  work is Dali (`daliEstate1`), owned by `pixelp`. Curator is `vex`.
- `CuratorSelection.curatorSellerProfileId` is required and points at an
  approved public `SellerProfile`. `selectedByUserId` remains the admin actor.
  Pre-production amendment of the unreleased `curator_selections` CREATE is
  allowed for this FK (`DEC-090` table-amendment clause).
- Home DTO is `{ curator, work: { ...work, author }, note }`. `work.author` is
  the Product owner. Do not expose a sibling `author` on the selection.
- Public slugs may include underscore (`bala_klava`) to match Figma handles.
- `SellerProfile.biography` is additive and distinct from Opening
  `shortDescription`. Author About prefers `biography` when present.
- Do not invent a vex-owned Product from achievement copy unless a later
  decision (`DEC-092`) assigns a demo work for catalog completeness. Missing
  Figma rasters are not replaced with Unsplash.


## DEC-092 — Demo data is invented in seed, production-quality in the UI

Date: 2026-09-15
Status: Confirmed

- Demo data may be invented. It must look like production content in the UI.
- Seed comments, fixture README and status docs may record Figma gaps.
- User-facing fields must not contain `Demo copy`, `invented`, `placeholder`,
  `not in Figma`, `test fixture`, `seed` or `mock`.
- Allowed to invent: display names, biographies, practice, descriptions,
  technique, story, exhibition text, and demo work ownership that does not
  conflict with a confirmed Figma relation (Dali stays on `pixelp`).
- `@vex` is a complete public author and may have demo works. Achievement
  titles are not automatically Products; assigning a Figma fill to vex for
  demo completeness is allowed when labeled in seed comments.
- Public Work `История` stays RFC plain-text paragraphs. Extra `ProductImage`
  rows are gallery photos, not a process-builder content model.


## DEC-093 — Phone gallery hides arrows; History and achievements reuse media

Date: 2026-09-15
Status: Confirmed

- Phone-width Work gallery keeps prev/next in `WorkGallery` but does not
  render them when layout width ≤ `layout.phoneWidth`. Swipe/drag paging,
  pagination dots and share stay. Wider galleries may show arrows.
- Authoring of Work `История` remains one plain-text `story` field. Public
  rendering may interleave published non-cover `ProductImage` rows between
  story paragraphs. This is not `ProductCreationStep` and not a CMS.
- Achievement cards use existing `SellerProfileRevisionAchievement` image
  fields. Figma has no isolated exhibition-install photographs; seed may
  attach a same-event Figma fill or same-work **detail** crop, never the
  product cover and never one raster reused across authors.


## DEC-088 — MVP dock is one four-item glass capsule

Date: 2026-09-11
Status: Confirmed

Production phone navigation is **one** 232×64 glass capsule with four items:
logo (Home), search, plus (Add), profile. Search is an item inside that
capsule. Figma first-fold split chrome (`Frame 182` + `Frame 46` 64×64 search
FAB) and the long-Home five-icon pill (`436:1366`, 288×64 with cart) are unused
variants, not separate production components. Cart stays deferred.


## DEC-094 — Infrastructure errors have one layered path

Date: 2026-09-17
Status: Confirmed

Backend owns what happened. Frontend owns how it is shown. Backend `message`
is not a UI contract.

There is one Nest `ApiExceptionFilter`. Shared public shape stays
`{ status, code, message, details?, requestId? }` in `packages/contracts`.
Transport parsing lives in `packages/api-client/src/errors/`. Mobile
infrastructure policy lives in `apps/mobile/src/errors/` and presents through
`PageState`. `SessionAlert` remains the session-only banner when page content
loaded. Feature domain errors stay in their modules.

Infrastructure UI copy is one sentence: «Проверьте соединение и попробуйте ещё раз.»


## DEC-095 — Public session failure is silent; ProtectedRoute owns the UI

Date: 2026-09-17
Status: Confirmed

A loaded public page plus `/api/auth/me` infrastructure failure keeps public
content. The session error is logged. Public chrome does not show SessionAlert.
Auth state is not masked as guest: 401/403 stay anonymous; network/5xx stay
`status='error'`.

`ProtectedRoute` is the owner of blocking session failure and shows the
canonical infrastructure state with Retry → `auth.refreshSession()`.

Feature screens do not suppress or coordinate session alerts. Infrastructure
UI is one sentence plus Retry, via `InfrastructureErrorState`.


## DEC-096 — Search is a fullscreen overlay over the current public page

Date: 2026-09-18
Status: Confirmed

Search is a fullscreen overlay over the current public context, not a landing
page. Dock Search opens it as one history entry on the current public route.
Close (X) and Escape return to the underlying entry. Query and tab edits
replace the current Search entry. Result navigation pushes the detail route;
Back restores Search from history. `/search` remains a deep-link compatibility
host for the same overlay; close falls back to Home when there is no
predecessor.

Empty query shows the active tab’s public list. Typing live-searches: Categories
are filtered client-side on name/slug; Authors and Works use existing `q` on
`GET /api/authors` and `GET /api/works`. No `/search` API, no category backend
`q`, and no category images in this batch. Default tab is Категории. One shared
input query across tabs. Overlay pagination is first page only.

Category visual fidelity is blocked until a taxonomy + media decision.


## DEC-097 — Portfolio release uses R2 and native Cloudflare CDN

Date: 2026-10-04
Status: Confirmed

First public release includes email/password auth, author profiles, portfolio
editing/publication, existing moderation and direct R2/CDN media delivery.
Private SOURCE remains byte-identical, including original metadata; published
public derivatives strip private metadata. Two separate buckets use the portable
S3 boundary and a custom media domain. No Cloudflare Worker, Images, Redis,
Kafka, external queue service or separate worker process.

Publication waits for all media and preserves the previous snapshot until ready.
Admin sees pending delivery. Neon stores a durable operation journal; unfinished
operations retry inside existing NestJS. Hide/suspend/delete delete public
variants and purge CDN with a target of ≤5 minutes. This Q01 answer explicitly
replaces the earlier founder instruction to defer revocation. Downloaded copies
cannot be recalled.

JPEG/PNG/WebP retain current upload caps. HEIC and 20 MiB/~50 MP follow resource
verification after MVP. Work FULL loads on viewer open; avatars and achievements
do not automatically receive FULL. No original-archive guarantee, tariffs or
90-day retention. Internal backup targets start at RPO ~24h / RTO ~1 day and
require restore verification. Migration may briefly freeze media writes and
moderation, without dual write; public reads should remain available.

Domain is `bid.place`; PostgreSQL is Neon. Container hosting is undecided,
including Render as a candidate. Production includes a labelled demo catalog
without known-password test accounts. Google follows launch. Self-hosted SMTP/
Postfix is excluded; existing Nodemailer may use minimal external SMTP.
Portfolio Rules/Privacy are pending and do not stop technical implementation.


## DEC-098 — Cloudflare application deployment boundary

Date: 2026-10-05
Status: Confirmed

Source: founder's pasted deployment implementation task and domain clarification.
Revises only hosting and the application Worker restriction in `DEC-097`.
`bid.place`, registered at Porkbun, is the primary domain. `bidplace.lol` is
reserved for a future development environment. The selected target is a thin
Cloudflare Worker routing API to a private Nest Container and serving Expo Web
Static Assets, with Neon PostgreSQL. Public media continues to use R2 Custom
Domain/native CDN; the application Worker does not proxy media or own auth,
permissions, business rules or database queries. The required Container DO is


## DEC-099 — Explicit publication, manual retry, revoke executor kept

Date: 2026-10-05
Status: Confirmed

Source: founder instruction on the portfolio load reduction.
Does not revise the ≤5 minute public revoke in `DEC-097`. An answer about a
future route change is not permission to leave old public CDN links available.
Publication runs as the explicit approve, restore or unhide action. The action
prepares media, then the existing short transaction switches the published
snapshot. HTTP success means the journal operation is done and the published
revision matches. After an error, the same user or admin retries that action.
Journal identity, idempotency and state checks stay. A lost upload SOURCE


## DEC-100 — Cloudflare Email Service SMTP and secret custody

Date: 2026-10-05
Status: Confirmed

Outbound mail stays on the existing Nodemailer transport. The provider is
Cloudflare Email Service over standard SMTP. No Cloudflare mail SDK, Workers
email binding, or new mail adapter.

Confirmed connection, both staging and production:

- `SMTP_HOST=smtp.mx.cloudflare.net`
- `SMTP_PORT=465`
- `SMTP_SECURE=true` (implicit TLS; STARTTLS on 587 is not this provider)
- `SMTP_AUTH_MODE=login`
- `SMTP_USERNAME` is the literal string `api_token`
- `SMTP_PASSWORD` is a separate Cloudflare API token with Email Sending: Edit
- `SMTP_FROM` is an address on a domain onboarded to Email Sending

Provider replacement remains a configuration change.

Secret custody:

- The recoverable copy is an operator-encrypted store, with a backup that is
  outside both GitHub and Cloudflare.
- GitHub Environments may supply values at deployment time.
- Cloudflare holds the runtime copies the Container needs.
- GitHub Secrets is not a backup: stored values cannot be read back in normal
  operation.
- Staging and production credentials stay separate.
- No new CI workflow is added for this model. A later Actions deploy must not
  place secret values in logs, artifacts, the image, or the frontend bundle.

Email Sending on Workers Paid includes 3,000 outbound emails per account per
billing month, then $0.35 per 1,000. That quota counts emails, not users.
Email Service is a Cloudflare expense inside the agreed operating budget of
about $5–7 per month, ceiling $10, together with Neon. Reaching 3,000 emails
does not stop further sending or spending. Overage remains inside that budget.


## DEC-101 — Public revoke keeps deletion and retry without a hard deadline

Date: 2026-10-05
Status: Confirmed

The mandatory public revoke within five minutes after a failure, stop, or
sleep of the process is withdrawn for MVP. Deletion of public copies, CDN
purge, the operation journal, the existing `REVOKE`/`CLEANUP` executor, and
recovery of unfinished operations after the process starts all stay. Private
SOURCE stays. An old public URL may keep working until that recovery succeeds.

No executor was removed. No cron, alarm, or new service was added. Timers were
not changed. This decision does not implement a wake of a stopped process and
is not a runtime fix.

`05-MVP-RFC.md` requires hidden works to stay out of the public profile. It
does not set a five-minute CDN deadline, so the RFC is unchanged.


## DEC-102 — One production deployment contour

Date: 2026-10-06
Status: Confirmed

The first portfolio MVP deployment has one contour: Cloudflare Worker
`bidplace-production` on `https://bid.place`, Neon project
`calm-rain-59989397`, existing default branch `production`
`br-polished-haze-b2d6rop9`, database `neondb`. The founder deleted the Neon
staging branch. No replacement staging project, branch, database, or role is
created. Leftover staging buckets and DNS stay in place and are not part of
the deployment.

Deployment is a manual `workflow_dispatch` on
`feature/portfolio-mvp-release`. It does not run on push, pull request, or a
schedule. Checks, the production build, an explicitly confirmed direct-URL
migration, and the deploy use one SHA. GitHub Repository secrets supply the
deployment. They are not a recoverable backup. The operator keeps the
originals in an encrypted store. `SERVICE_RULES_TEXT` is an Actions Variable.
An empty value blocks the deploy. This decision does not approve the rules
text.


## DEC-103 — Production values stay in GitHub Environment prod

Date: 2026-10-06
Status: Confirmed

The production workflow job uses `environment: prod`. No second environment
is created, and the operator does not move or re-enter credentials.
`NEON_DIRECT_URL` is the direct migration URL and is passed to the existing
migration script as `DATABASE_URL`. Pooled `DATABASE_URL` stays the runtime
URL. `CLOUDFLARE_ACCOUNT_ID`, `SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`,
and `SERVICE_RULES_TEXT` are variables of `prod`. An empty rules value still
blocks the deploy. This revision does not approve the rules text. Secret
values were not read.


## DEC-104 — No mint ring on ordinary press

Date: 2026-10-07
Status: Confirmed

Pressed `FigmaButton` and `FigmaChoiceChip` controls do not draw
`rgba(0, 235, 151, 0.25)`. Pressed feedback stays the existing fill, inset,
or opacity change. A selected chip keeps its charcoal fill. Keyboard focus
keeps the existing blue outline. Field success `#039600` and real success
messages stay. The captured Figma field board and the protected `.pen` file
are not rewritten.


## DEC-105 — Auth sheets follow the supplied versioned capture

Date: 2026-10-08
Status: Confirmed

The next auth UI wave uses the scoped
[`2026-10-07-auth-dialogs`](../../design/figma-handoff/auth/2026-10-07-auth-dialogs/README.md)
capture set for login/registration sheets, verification and shared exit-confirm
presentation. The imported source library and protected Pen stay unchanged.
Exact style differences, missing assets/ranges and derived states are recorded
in that package, not silently filled from another design version.

Email/password remains the login method. The code design is adapted to existing
email verification. Registration's first field is «Имя»/`displayName`, not an
account nickname or reserved author slug. Google/Telegram are honest unavailable
UI placeholders, without OAuth. Recovery retains the working single-use link
and neutral response, with the entered email masked in result presentation.
Exit-confirm copy reflects the actual pending/saved state; closing does not
delete an account or cancel committed server work.


## DEC-106 — Updated brand and fullscreen auth source

Date: 2026-10-08
Status: Confirmed source/visual decision; runtime replacement pending.

Source: founder supplied the new brush-mark SVG and four updated Figma captures,
requested project-wide logo/favicon replacement and removal of the superseded
fullscreen packages. Revises only the visual source of `DEC-105`.
Registration and email confirmation use
[`2026-10-08-auth-fullscreen`](../../design/figma-handoff/auth/2026-10-08-auth-fullscreen/README.md),
with the mark above the form and outlined `bidplace` wordmark below. The new
brush mark replaces the eye mark in live project branding and consumed icon
assets. Shared exact vector sources and original SVG are preserved in


## DEC-107 — New account nickname length, historical reads preserved

Date: 2026-10-09
Status: Confirmed.

Source: founder requested a shared 3–20 character limit for a new nickname,
without truncating or renaming historical nicknames or migrating the database.
Revises the length constraint of DEC-105; ownership remains `User.slug`.
`newAccountSlugSchema` owns the existing grammar and 3–20 character write
constraint for registration, claim-slug and availability. Availability does
not reserve a name. `accountSlugSchema` remains the 1–120 character read
contract for stored users and claim responses. Existing account nicknames,
author addresses, revision snapshots and the database column are unchanged.


## DEC-108 — Local nickname suggestions and explicit availability check

Date: 2026-10-09
Status: Confirmed.

Source: founder approved the first library option and the registration behavior.
Registration shows exactly three neutral suggestions generated locally with
locked `unique-names-generator`, curated short color/animal dictionaries, a
three-digit suffix, and the existing nickname write contract. The 49,500-value
space keeps labels compact while reducing collisions. The generator sits behind
one small synchronous replaceable interface. Library imports stay in one
adapter. There is no email derivation, AI, remote generation, reservation, new
endpoint, or new persistence.


## DEC-109 — Auth abuse protection: PostgreSQL ledger, mail truth, deferred Redis

Date: 2026-10-10
Status: Confirmed

Source: explicit founder auth/email MVP brief (pasted thresholds and ownership)
Durable auth-abuse state lives in PostgreSQL (`auth_abuse_operations`,
`auth_abuse_counters`) behind one Nest module (`apps/api/src/auth-abuse/`).
Mail sends, OTP verify pause, login failure/Turnstile escalation, and password-reset
send quotas use short locked transactions; SMTP and Siteverify run outside those
transactions. Cheap per-IP spray limits stay process-local in
`RateLimitService` until a future shared store is justified.
Selected for MVP:


## DEC-110 — Shared text-button matrix (`292:5058`)

Date: 2026-10-10
Status: Confirmed

Source: founder button brief; Figma component set `292:5058` (`Кнопки.figmacapture.zip`)
All text buttons use one renderer (`FigmaButton`) and one four-variant × four-state
matrix (`solid`, `outline`, `ghost`, `muted` × idle, hover, pressed, disabled).
Geometry, colors, gradient stroke axes, and disabled handling live in
`packages/design-tokens` (`figma-button.ts`). This replaces special auth sizes,
Home quiet+compact pill parameters, and the red `danger` text-button variant.
`DestructiveButton` remains a semantic wrapper that renders `solid`.
Pressed feedback stays on fill/overlay only; **DEC-104** still means no mint press


## DEC-111 — Entered-data confirmation stays on registration only

Date: 2026-10-11
Status: Confirmed

Source: refined designer and founder decision.
Revises the runtime scope of the shared exit confirmation from `DEC-105`.
The dialog component and its registration copy stay. Login, forgot-password,
reset-password, and email verification no longer ask before closing, including
when their fields contain input. Close, Escape, backdrop, and Back/Forward use
that same policy. Registration explicitly protects entered data: an empty
registration leaves without asking; a registration with input asks before an
exit that leaves auth. Continue keeps the current step, values, and focus.


## DEC-112 — Portfolio Work story uses revision-owned blocks

Date: 2026-10-11
Status: Confirmed product decision; implementation planned

Source: explicit founder answer to the story/MVP scope question.
Revises: the plain-text authoring and automatic gallery-interleaving scope of
`DEC-092`/`DEC-093`, and the story-builder deferral in `DEC-082` / RFC §10/§15.
The earlier decision entries remain unchanged as history.
The current portfolio MVP includes optional ordered `HEADING`, `PARAGRAPH`,
`IMAGE` blocks, with add/delete/up/down and a server-confirmed save. Gallery and
story have independent order; an image may be referenced in both via the existing
`MediaAsset`. The selected target binds blocks to `ProductRevision` and reuses


## DEC-113 — Shared approved classifiers now; user proposals after MVP

Date: 2026-10-11
Status: Confirmed product decision; implementation planned

Source: explicit founder answer selecting common dictionaries now and deferring proposals.
Categories, materials/techniques and author directions use shared approved
dictionaries with stable IDs and a safely bootstrapped initial set. Forms,
checkboxes/chips and public filters use those same records. No separate copy of
the list belongs to each screen. The exact initial set and term applicability
must be checked against the capture and existing data before migration.
User-created suggestions, approval/mapping/rejection, admin proposal queues and
controlled reclassification are explicitly deferred; their scope is preserved


## DEC-114 — Country selection hides codes; city is optional

Date: 2026-10-11
Status: Confirmed product decision; implementation planned

Source: explicit founder geography answer: popup list/search, country names only.
Revises: mandatory city in RFC §8. Country remains required and is selected
from a searchable popup. The UI shows a localized country name; the standard
country code is internal storage/API data. City is one optional text value,
without a city table, geocoding, multiple locations or delivery geography.
An approved author is not hidden just because city is absent. Country selection
does not itself authorize a new launch country.
The change must cover validation, profile/revision writes, submit readiness,


## DEC-115 — Next wave adds sales; one complete post-MVP plan

Date: 2026-10-11
Status: Confirmed direction; sales mechanics and implementation remain planned

Source: explicit founder request to preserve all deferred work and make the next
wave sales through the platform.
The current launch remains portfolio-only. The next wave introduces sales,
including the price/auction direction and required complaint/problem handling.
[15-POST-MVP-BACKLOG.md](15-POST-MVP-BACKLOG.md) is the single product entrypoint
for the complete future plan. The index routes auction/sales planning there;
the execution backlog maps work without duplicating the full product contract.
The plan must retain deferred Figma trade screens, classifier proposals, prices,


## DEC-116 — Eighteen categories, proposals in MVP, story limits

Date: 2026-10-11
Status: Confirmed; backend implemented, client integration not started

Source: explicit founder instruction for the author-story backend.
Revises the deferred-proposal part of `DEC-113`. User proposals for a missing
category, material or technique are in the current MVP. The author selects the
existing category «Другое» when proposing a category name. A proposal stores the
raw name, a Unicode/case/space normalized value, status and review result. It is
not a substitute foreign key. Confirming it writes the real category or term onto
the pending Work revision and does not publish the Work. Rejecting a still
selected proposal returns that revision for changes. An old rejected proposal


## DEC-117 — Author basics step copy, country popup and city clearing

Date: 2026-10-12
Status: Confirmed for the requester's answers in the author-application-figma task; extends `DEC-114` and `DEC-116` without revising them.

Step 1 of the author application uses the subtitle «Город можно не указывать».
Its placeholders are «Ваше имя фамилия, (обязательное)», «Никнейм, (обязательное)»
and «Страна (обязательное)», and the city placeholder is «Город». Step 1 shows no
extra asterisk marks, and the validation does not depend on a visual marker.

Country starts empty. «Продолжить» stays unavailable until a country is chosen, and
a saved country is not replaced by a default. The popup reuses the shared filter
sheet with search and radio rows. The shown value is the country name; the stored
and sent value is the ISO code. City is an optional separate field under the country.

Clearing the city goes in one save. The `PATCH` is `multipart/form-data`: profile
JSON in the `data` part and the photo in the `profilePhoto` part. An absent field
keeps the stored value, `null` clears it, and `[]` clears a list. The string `"null"`
is not used. The shared serializer is unchanged.

The initial photo state has no «Фото обязательно» line. The requirement stays in
readiness and the server contract. Upload, selection and validation errors use the
existing mechanisms. The logout action is a ghost «Выйти» below «Продолжить» in the
normal flow. The field variant `authorApplication` changes only the empty border and
the placeholder to `#999999`; icons keep their color.


## DEC-118 — One legal handoff, DEC-078 registration and target retention

Date: 2026-10-12
Status: Confirmed product/documentation decisions; analytics legal basis Open

- This task consolidates the audit and prepares legal texts. Connecting pages,
  cookies/consents to UI/API is a separate task; runtime is not changed here.
- Reaffirm DEC-078: three separate mandatory registration items (agreement,
  policy acknowledgement, PD consent for the main service), plus separate 18+.
  Analytics and marketing as distinct purposes are not silently bundled into them.
- The first MVP has no auctions, purchases, payments, delivery or reviews. Preserve
  future terms in an explicitly inactive annex; its presence does not activate a
  feature or provide advance consent to every future processing purpose.
- Keep the current immediately enabled analytics. Its legal basis remains open
  until a specific Belarus lawyer answer addresses the actual persistent ID,
  events, attribution, account linkage and infrastructure. A policy acknowledgement
  is not recorded as that answer or as optional consent.
- IP registration is reported complete. Public contact is `work.evles@gmail.com`;
  `693460361` is a registration number, not a confirmed UNP. The home address is not
  published. Full legal name/UNP and correspondence requirements remain factual
  publication inputs, with public values suitable for GitHub Variables.
- Neon is reported located in Frankfurt, Germany; R2 provider is Cloudflare.
  Do not infer R2/backup geography or contract conditions from the provider name.
- Adopt the retention schedule in the legal audit: main service data for the
  service duration and removal from working systems within 30 calendar days after
  a substantiated request; incomplete accounts and expired/used OTP/reset records
  30 days; security logs 30 days; analytics 90 days; acceptance evidence 3 years
  after termination, moderation/request evidence 3 years after resolution; backups
  30 days. Mandatory shorter legal deadlines take precedence. Cleanup/restore
  reapplication is a separate implementation and release requirement.
- Restore historical consultation/closed-question evidence in the archive;
  preserve source text and the new raw notes. Do not reclassify all settled points
  as unanswered merely because the September manifest used a broad pending status.


## DEC-119 — Pen removed; Figma is the single visual source

Date: 2026-10-13
Status: Confirmed

The `.pen` files and the creator-first explorations were deleted (recoverable
from git history). Live Figma file
`pAPQo6cADmG5XzVmBX76EE` is the only visual source. `design/figma-handoff` is
secondary and may be stale; live Figma wins on disagreement. `AGENTS.md` and
`docs/design/*` were updated accordingly.


## DEC-120 — Fluid container

Date: 2026-10-13
Status: Confirmed

Mobile/tablet content is 100% wide with a 12 px horizontal gutter; desktop
content is centered with max-width 1280 and no extra padding. Wider windows
no longer keep a 390 column.


## DEC-121 — Local browser-only draft restore; no sync

Date: 2026-10-15
Status: Confirmed

Restore of in-progress input (Work creation and author application) is local
to the browser only: `localStorage` keyed by account + entity, throttled
writes, Zod-checked payload that tolerates an incomplete first step. No new
backend endpoints, tables, server autosaves, offline queues, live-sync or
cross-device conflict UI. Uploaded media stays server-side; not-yet-uploaded
files are re-selected. Drafts clear on logout/session change, confirmed
submit, and successful save without edits after the request snapshot; after
the first confirmed create the `…:new` key migrates to the confirmed id.
Simultaneous editing from several devices resolves to the last successful
server save (server revision token decides whether a stored draft still
applies).


## DEC-122 — Auth over the current page; sheets dismiss from their header

Date: 2026-10-18. Status: Confirmed by founder in this task.

Login opened from Home, a profile or a catalog keeps that current page and its
scroll position underneath. A direct auth URL uses Home as its fallback anchor.
Do not mount a second Home inside auth to imitate a background.
Sheet dismissal starts with a downward drag from the handle/header. Content
scrolling does not dismiss it. Existing dirty-state confirmation and busy-save
blocking apply to this gesture through the same close owner as the cross button.
Centered confirmation dialogs and full-screen registration are not draggable sheets.
Owner: Expo Router root/auth presentation + AuthViewport; shared interaction:


## DEC-123 — Личный аккаунт, Share до одобрения и удаление Work


Дата: 2026-10-19. Статус продукта: Confirmed — прямые ответы основателя в задаче личного профиля.
Статус кода: Not implemented для новых account/settings и удаления; наличие intake не означает реализованную функцию.
Личный аккаунт объединяет вход пользователя и автора; автору доступен кабинет
своих работ. До одобрения фото остаётся серым placeholder; у одобренного автора
используется опубликованная identity, не редактируемая ревизия.
Настройки и Share доступны также до публикации. Публичная ссылка недоступного
профиля показывает нейтральный not-found: существование аккаунта/заявки, её
поля и статус проверки не становятся публичными.


## DEC-124 — Одно явное подтверждение регистрации


Дата:2026-10-20. Статус:Confirmed. Источник: прямое требование основателя
в этом чате — один чекбокс, документы ссылками внутри текста, без дублей.
Пересматривает DEC-078 и handoff12октября только в UI-композиции регистрации:
один изначально не отмеченный control явно подтверждает18+, принятие соглашения,
ознакомление с политикой и согласие на необходимые данные. Три документа доступны
отдельными inline-ссылками; открытие ссылки не означает принятия.
Серверный контракт отдельных флагов/версий сохраняется, но один клик больше не
выдаётся за четыре независимых пользовательских действия. При смене версии или


## DEC-125 — Согласие при регистрации независимо от чтения документа


Дата:2026-10-20. Статус:Confirmed. Источник: прямое уточнение основателя:
согласие происходит сразу при регистрации; недоступность чтения не блокирует
аккаунт. Пересматривает зависимость выдачи текстов от регистрации в DEC-124/
legal handoff, сохраняя единый explicit control и подтверждение18+.
Не вводить отложенное принятие, pending-legal accounts или новые consent gates
перед заявкой/публикацией. Register фиксирует подтверждения в той же транзакции,
что User, с редакцией реальных канонических файлов, определённой сервером.
Чтение —отдельный lazy GET по ссылке, ошибка внутри существующего AppDialog;


## DEC-126 — Общий контрол дат: React Aria web и системный native picker


Дата: 2026-10-20. Статус: Confirmed (прямой выбор основателя в чате).
Основателю нравится React Aria; использовать его везде, где платформа позволяет.
Веб, включая Safari на телефонах, использует React Aria. Нативный Expo не имеет
DOM, поэтому за тем же DateField API находится системный SDK57 picker. Фирменный
web стиль собирается существующими токенами и компонентами. Отдельную Material
дизайн-систему и самописную календарную арифметику не вводим. Точность даты и
серверные правила сохраняются; время/планирование не добавляется без потребителя.


## DEC-127 — Монохромный фокус во всём сервисе


Дата: 2026-10-20. Статус: Confirmed (прямое согласие основателя в чате).
Общая роль focus становится #121212 в светлой теме и #FFFFFF в black вместо
синей. Решение уточняет DEC-104 и заменяет старый Figma focus292:5037 только
по цвету. Видимый клавиатурный фокус, существующий border полей и outline
прочих контролов сохраняются. Компонентных/маршрутных исключений не вводим.
Это не решение о запуске всей provisional black-палитры пользователям.
