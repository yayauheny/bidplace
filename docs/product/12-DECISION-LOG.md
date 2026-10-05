# bidplace — журнал решений

Последнее обновление: 2026-09-17

Записи не удаляются. При пересмотре создаётся новая запись со ссылкой на старую.

---

## DEC-001 — Ценность является ядром

Date: 2026-07-18
Status: Confirmed

### Decision

Главное слово и принцип bidplace — **ценность**.

### Rationale

Оно объединяет авторство, личность, историю, ограниченность, provenance и честное определение цены.

### Revisit when

Не пересматривается без полного изменения продукта.

---

## DEC-002 — Внешняя формулировка

Date: 2026-07-18
Status: Confirmed

### Decision

`bidplace — место, где ценят`.

### Alternatives

- место, где создаётся ценность;
- creator auction marketplace;
- verified scarcity commerce.

### Rationale

Коротко, понятно, без пафоса.

---

## DEC-003 — Первый механизм: timed auction

Date: 2026-07-18
Status: Confirmed

### Decision

MVP тестирует timed auction.

### Rationale

Уникальный предмет, несколько покупателей и неопределённая цена дают чистую проверку.

### Revisit when

После первой сделки и интервью.

---

## DEC-004 — Seller-tool-first

Date: 2026-07-18
Status: Confirmed

### Decision

Первый traffic приводит seller.

### Rationale

У нового marketplace нет buyer-аудитории.

### Revisit when

После каталога и repeat buyers.

---

## DEC-005 — Закрытый запуск

Date: 2026-07-18
Status: Confirmed

### Decision

Первые sellers/lots допускаются вручную.

### Revisit when

После 10–50 проверенных sellers.

---

## DEC-006 — Первый рынок

Date: 2026-07-18
Status: Confirmed

### Decision

Беларусь, русский интерфейс, BYN.

### Revisit when

После локальной повторяемости и legal review.

---

## DEC-007 — Первый creator

Date: 2026-07-18
Status: Hypothesis

### Decision

Таисия Борисова — предпочтительный первый seller.

### Rationale

Готовые работы, около 1 500 подписчиков, опыт и доверие после custdev.

---

## DEC-008 — Hard close в MVP

Date: 2026-07-18
Status: Confirmed

### Decision

Bids прекращаются строго по server `endsAt`.

### Alternative

Soft close.

### Revisit when

После pilot feedback или до крупных запусков.

---

## DEC-009 — Soft close planned

Date: 2026-07-18
Status: Planned

### Decision

Позднее last-minute bid может продлевать auction.

### Preconditions

Load test, понятный UI, отдельное решение.

---

## DEC-010 — Внешние уведомления не входят в MVP

Date: 2026-07-18
Status: Confirmed

### Decision

Нет outbid/ending email, push, SMS. Вместо них — in-app participation status.

### Risk

Пользователь не вернётся после outbid.

### Revisit when

После return metrics и интервью.

---

## DEC-011 — Искусственные ставки запрещены

Date: 2026-07-18
Status: Rejected

### Decision

Никаких fake bids, linked accounts или platform seed bids.

### Revisit when

Не пересматривается.

---

## DEC-012 — Общий resale запрещён

Date: 2026-07-18
Status: Rejected

### Decision

bidplace не становится вторичным рынком.

### Exception

Личная вещь продаётся самим связанным с ней человеком.

---

## DEC-013 — Два seller-направления

Date: 2026-07-18
Status: Confirmed

### Decision

1. Творческие создатели.
2. Популярные люди с личными/связанными предметами.

### Priority

Сначала creators.

---

## DEC-014 — Brands отложены

Date: 2026-07-18
Status: Rejected for current stage

### Decision

Не строить brand onboarding.

### Possible future exception

Проверенный first-party проект конкретного известного человека.

---

## DEC-015 — Creator без известности может быть допущен

Date: 2026-07-18
Status: Confirmed

### Decision

Follower count не абсолютный gate.

### Note

Для auction pilot нужен реальный план привлечения нескольких покупателей.

---

## DEC-016 — Телефон перед первой ставкой

Date: 2026-07-18
Status: Confirmed

### Decision

Просмотр и базовая регистрация без обязательного телефона; verification перед bid.

---

## DEC-017 — Scheduled preview

Date: 2026-07-18
Status: Confirmed

### Decision

Auction page публикуется заранее, bidding открывается в `startsAt`.

---

## DEC-018 — Seller privacy mode

Date: 2026-07-18
Status: Confirmed

### Decision

Seller может скрыть личный contact и сам написать winner.

### Future

Internal inbox/representative.

---

## DEC-019 — Bid history сохраняется

Date: 2026-07-18
Status: Confirmed

### Decision

Bid audit не удаляется вместе с UI auction.

---

## DEC-020 — Первые пилоты без комиссии

Date: 2026-07-18
Status: Confirmed

### Decision

0% для первых пилотов.

### Revisit when

После повторяемых продаж и/или payments.

---

## DEC-021 — Монетизация не фиксируется заранее

Date: 2026-07-18
Status: Hypothesis

### Candidates

Buyer fee, seller fee, promotion, subscription, paid tools.

### Rule

Не внедрять до подтверждённой ценности.

---

## DEC-022 — Discovery позднее

Date: 2026-07-18
Status: Planned

### Decision

Feed, recommendations и AI не входят в первые фазы.

---

## DEC-023 — Technical gate: 10 users

Date: 2026-07-18
Status: Confirmed

### Decision

До pilot полный scenario с 10 concurrent users и simultaneous bids.

---

## DEC-024 — Concierge для первых sellers

Date: 2026-07-18
Status: Confirmed

### Decision

Первые 5–10 sellers сопровождаются вручную.

---

## DEC-025 — Профиль без рангов

Date: 2026-07-18
Status: Confirmed

### Decision

Не использовать «профессионал/любитель».

---

## DEC-026 — Образовательный контент не продукт

Date: 2026-07-18
Status: Confirmed

### Decision

Контент используется для роста и объяснения ценности.

### Rejected

Отдельная educational platform.

---

## DEC-027 — Services/masterclasses отложены

Date: 2026-07-18
Status: Rejected for current roadmap

### Decision

Не добавлять booking без повторяющегося спроса.

---

## DEC-028 — Charity и significant events отложены

Date: 2026-07-18
Status: Rejected for current stage

### Decision

Не тратить resources до реального запроса.

---

## DEC-029 — Документы разделены по state

Date: 2026-07-18
Status: Confirmed

### Decision

У каждого вида информации один документ-владелец.

### Rule

Coding-agent обновляет status и релевантный документ после задачи.

---

## DEC-030 — Roadmap трёхмесячными волнами

Date: 2026-07-18
Status: Confirmed

### Decision

План на 24 месяца, без недельной feature-гонки.

---

## DEC-031 — Market reports дают гипотезы

Date: 2026-07-18
Status: Confirmed

### Decision

Внешний отчёт не становится проверенным фактом автоматически.

---

## DEC-032 — Admin panel сохраняется

Date: 2026-07-18
Status: Confirmed

### Decision

Admin — controlled operations layer, расширяется по реальным задачам.

---

## DEC-033 — Mobile web first

Date: 2026-07-18
Status: Confirmed

### Decision

Первый продукт распространяется ссылкой и должен отлично работать в mobile browser.

### Rejected MVP

Обязательный app-store launch.

---

## DEC-034 — Start price и reserve

Date: 2026-07-18
Status: Hypothesis

### Decision

MVP поддерживает hidden reserve; цена первого seller согласуется вручную.

### Revisit when

После auction interviews, особенно по trust.

---

## DEC-035 — Три источника ценности

Date: 2026-07-18
Status: Confirmed

### Decision

Авторство, личная связь, подтверждённая ограниченность.

---

## DEC-036 — Mass brand не создаёт ценность автоматически

Date: 2026-07-18
Status: Confirmed

### Decision

Логотип и retail scarcity недостаточны.

### Example

Обычные брюки массового производства не подходят; личная вещь известного человека или сделанная им вещь может подходить.

---

## DEC-037 — Product и Listing разделяют предмет и размещение

Date: 2026-07-18
Status: Confirmed

### Decision

Каноническая модель MVP: `SellerProfile → Product → Listing → AuctionRules → Bid[] → Order`.
`Product` описывает физический предмет и может иметь несколько `Listing` во времени. `Auction` больше не является aggregate root; термин сохраняется только для аукционных правил и политик.

### Source

Решение основателя, Task A, 2026-07-18.

---

## DEC-038 — Публичная ссылка Product использует random publicId

Date: 2026-07-18
Status: Confirmed

### Decision

Единственный публичный detail route — `/product/[publicId]`. `Product` и `Order` получают неизменяемый криптографически случайный publicId; title-derived slug и `/auctions/[slug]` удаляются без compatibility period.

---

## DEC-039 — BYN, startPrice и soft close для MVP

Date: 2026-07-18
Status: Confirmed

### Decision

MVP использует только BYN. Reserve и Buy Now исключены. `AuctionRules.startPrice` — минимальная цена продавца. Soft close применяется как 60-second window, 60-second extension, 600-second total cap.

### Revises

`DEC-008`, `DEC-009` и `DEC-034` в части hard close и reserve.

---

## DEC-040 — Order foundation и минимальная moderation входят в MVP

Date: 2026-07-18
Status: Confirmed

### Decision

После завершённого Listing создаётся privacy-safe `Order` без payment/delivery machine. SellerProfile и Product используют минимальные admin-only approval transitions. Automatic winner replacement и visual redesign не входят в текущую реализацию; light redesign отложен в Task B.

---

## DEC-041 — Task A closed-pilot verification boundary

Date: 2026-07-19
Status: Confirmed

### Decision

Task A is accepted for a closed pilot with manual controls after its focused Chromium E2E and full repository gates. WebKit, full browser/device matrix, visual regression, exhaustive seller/admin E2E, accessibility automation and ten-session rehearsal are release hardening after Task B, not prerequisites for the pilot.

---

## DEC-042 — Публичная заявка seller и отдельный доступ к продажам

Date: 2026-07-23
Status: Confirmed

### Decision

Кнопка «Стать seller» доступна публично зарегистрированному User. Заявка создаёт SellerProfile, но не даёт право создавать или публиковать Product и Listing. После ручного admin approval выдаётся отдельный persisted seller access; admin может его отозвать. Buyer account и seller capability не являются одной ролью.

### Rationale

MVP не требует ручных приглашений, но сохраняет curated supply и не допускает неподтверждённые товары на площадку.

---

## DEC-043 — Данные публичного SellerProfile

Date: 2026-07-23
Status: Confirmed

### Decision

Для заявки seller обязательны profile photo, имя и фамилия либо название seller, краткое описание автора/стиля работ и хотя бы один social link или другие публично проверяемые данные. SellerProfile отделён от buyer account; имя из регистрации может предзаполнять профиль, но seller может выбрать другое публичное имя или название.

---

## DEC-044 — Модерация Product до публичной публикации

Date: 2026-07-23
Status: Confirmed

### Decision

Seller создаёт private Product draft и отправляет его на admin moderation. Пока Product не approved, он недоступен в public catalog и по public URL. Для creator-made Product обязательна минимум одна собственная фотография; состояние не является обязательным MVP-полем.

### Future

Поздние классы предметов могут потребовать condition/defects отдельным решением.

---

## DEC-045 — Ручная замена winner в MVP

Date: 2026-07-23
Status: Confirmed

### Decision

При отказе или недоступности winner admin фиксирует причину, отменяет исходный Order и вручную выбирает replacement из ranked Bid list. История исходного Order и winner сохраняется.

### Planned after MVP

Автоматическая замена может быть рассмотрена после MVP на основании подтверждённого evidence неудачного контакта, включая AI-assisted разбор материала, предоставленного seller. Для неё нужны отдельные privacy, security и product decisions.

---

## DEC-046 — Минимальная first-party analytics для pilot

Date: 2026-07-23
Status: Confirmed

### Decision

MVP фиксирует только минимальные first-party события воронки и результата сделки. Dashboard и third-party marketing trackers не входят в решение.

---

## DEC-047 — Временные поля для будущих retention policies

Date: 2026-07-23
Status: Confirmed

### Decision

Persisted entities должны иметь `createdAt` и `updatedAt`; Product дополнительно получает `publishedAt` при первой публичной публикации. PII и audit хранятся бессрочно до отдельной legal/privacy policy.

---

## DEC-048 — Дизайн не расширяется в ближайшей MVP-волне

Date: 2026-07-23
Status: Confirmed

### Decision

Следующая MVP-волна использует существующий UI. Redesign и новые визуальные направления не входят в seller access, moderation, handoff, analytics и security work.

---

## DEC-049 — SellerProfile approval является seller capability

Date: 2026-07-23
Status: Confirmed

### Decision

Любой зарегистрированный User может открыть seller cabinet и создать заявку SellerProfile со статусом `PENDING_REVIEW`. Отдельная сущность grant не создаётся: возможность писать Product и Listing появляется только у `APPROVED` SellerProfile и отзывается статусом `SUSPENDED`. Admin role и seller capability остаются независимыми.

### Revises

`DEC-042` в части отдельного persisted seller grant.

---

## DEC-050 — Email verification и принятие правил перед первой ставкой

Date: 2026-07-23
Status: Confirmed

### Decision

Production MVP использует email verification перед первой ставкой. В то же действие buyer принимает версию правил сервиса; версия и timestamp сохраняются. Telegram verification и phone verification не входят в MVP. Dev/test bypass допускается только вне production.

### Revises

`DEC-016` в части обязательной phone verification.

---

## DEC-051 — Публичный профиль и handoff contacts

Date: 2026-07-23
Status: Confirmed

### Decision

SellerProfile использует одно публичное поле `fullName`, которое может содержать имя, имя и фамилию или название. Публично показываются базовые данные профиля: photo, `fullName`, description, страна и допустимые public links.

Seller отдельно указывает handoff contact: Telegram, phone или Instagram. После создания active Order buyer получает этот contact, seller получает verified buyer email. Privacy mode seller сохраняется.

---

## DEC-052 — Public catalog и история завершённого Product

Date: 2026-07-23
Status: Confirmed

### Decision

Product появляется в public catalog только после moderation approval и при `SCHEDULED` либо `LIVE` Listing. После завершения он исключается из общего каталога, но сохраняется по прямому public URL с результатом и историей, пока admin его не скрыл.

---

## DEC-053 — Юридическая граница MVP в Беларуси

Date: 2026-07-23
Status: Confirmed

### Decision

Для MVP в Беларуси bidplace не принимает оплату, не организует доставку и не выступает escrow. Сервис предоставляет авторизацию, seller application/moderation, размещение предмета, ставки и определение winner. Seller несёт ответственность за налоги, законность и точность размещаемого content, право продажи и фактическую передачу предмета.

До real pilot нужны public rules, privacy notice и legal review checklist. Это решение не является юридическим заключением.

---

## DEC-054 — Нет удаления и автоматизации replacement в MVP

Date: 2026-07-23
Status: Confirmed

### Decision

В MVP нет self-service удаления account, Product, PII или audit. Все winner replacement выполняются вручную admin. AI-анализ и автоматическая replacement logic не входят в MVP и не получают заранее заданного post-MVP workflow.

---

## DEC-055 — Final Modern UI выполняется единым cutover

Date: 2026-07-27
Status: Confirmed

### Decision

Modern UI реализуется в отдельной `feature/modern-ui-final` ветке как единая финальная система. В scope входят все уже работающие маршруты и только они. В runtime не остаётся bridge с Tamagui, legacy fallback, feature flag или частично мигрированный маршрут. После полной проверки Tamagui и legacy UI удаляются.

Временный логотип до поставки approved asset: compact mark на desktop и live lowercase `bidplace` в Inter на mobile. Product scope не расширяется Search, Settings, saved items, filters или новыми API.

### Rationale

Гибридный UI делает аукционные, privacy и role flows труднее проверяемыми. До production допустим единый чистый переход без runtime rollback; обычный Git revert остаётся техническим средством восстановления после merge.

### Revises

`DEC-048` в части запрета redesign в ближайшей MVP-волне.

---

## DEC-056 — Клиентская проверка ставки и подтверждение первой ставки

Date: 2026-07-27
Status: Confirmed

### Decision

Client проверяет обязательность, числовой BYN формат и таблицу Bid increments из MVP RFC для немедленной обратной связи. Backend остаётся единственным источником истины для minimum next bid, current price, Listing status, deadline и soft close.

Перед первой Bid пользователя в конкретном Listing UI показывает confirmation с предметом, суммой, актуальным minimum, server deadline и последствием действия. Повторная Bid в том же Listing не требует повторного confirmation, если participation достоверно известен. Rejected/stale Bid refetches canonical HTTP snapshot и не получает success presentation.

### Rationale

Это снижает случайные ставки, но не создаёт клиентский аукционный rule engine и не допускает расхождения с конкурентной server transaction.

### Revisit when

Right-swipe confirmation может рассматриваться после MVP только с отдельной accessibility и web-equivalence проверкой.

---

## DEC-057 — Web-first UI polish boundary

Date: 2026-07-30
Status: Confirmed

### Decision

Вторая UI-волна использует web-first spatial logic: белый canvas, компактный icon rail, единый account control справа и shared page-state primitives. Seller navigation derives capability from `SellerProfile.status`; `APPROVED` остаётся единственным доступом к созданию предмета. Автор Product берётся из публичного `SellerProfile.fullName`, а публичная история строится только из Product/Listing данных.

Tags, search, tag filtering, notifications, account settings, password reset, buyer profile page, new Product fields и mobile redesign отложены.

### Rationale

Это улучшает web hierarchy и role clarity без дублирования автора, изменения Product schema, расширения API или ослабления auction/privacy boundaries.

---

## DEC-058 — Admin не участвует в торгах

Date: 2026-07-30
Status: Confirmed

### Decision

Admin имеет только Catalog и Moderation в навигации. Backend отклоняет admin Bid и не предоставляет admin buyer Activity; admin может просматривать каталог и модерировать SellerProfile/Product. Это уточняет роль admin без расширения buyer capability.

### Revises

Связанные ограничения роли из `DEC-052` и UI-решения `DEC-057`; правило завершённых лотов из `DEC-052` пересмотрено выше.

---

## DEC-059 — Завершённые лоты остаются в public catalog

Date: 2026-07-31
Status: Confirmed

### Decision

Public catalog включает `APPROVED` Product с `SCHEDULED`, `LIVE` или `ENDED` Listing. Для Product с несколькими публичными Listing selector использует приоритет `LIVE`, затем `SCHEDULED`, затем последний `ENDED`. Default-фильтр только открытых торгов отложен.

### Revises

Эта запись пересматривает только правило public catalog из `DEC-052`; исходный текст `DEC-052` сохранён без изменений.

---

## DEC-060 — Local/test-only demo Bid fixtures are allowed

Date: 2026-07-31
Status: Confirmed

### Decision

Explicitly local/test-only Bid and Order fixtures are allowed solely in isolated
development and test databases. They support deterministic UI demos and E2E
fixtures; they are not platform bids and must never reach production runtime or
real auctions. E2E fixtures may dynamically create buyer/Bid/Order state in a
disposable PostgreSQL database.

### Constraints

- The seed runs only for `NODE_ENV=development|test`, `APP_ENV=local` and an
  explicit destructive-demo-seed flag.
- Production-like profiles fail closed before any database write.
- An executable PostgreSQL test verifies seeded price, bid count, winner and
  Order consistency, and confirms that production-like denial leaves the
  database unchanged.
- Demo Bid fixtures are removed from the ordinary local/demo seed or replaced
  with neutral data before the real MVP release.

### Revises

Clarifies the technical-fixture boundary of `DEC-011`; its prohibition on
artificial bids remains unchanged for production and real auctions.

---

## DEC-061 — Wave B semantic action and keyboard focus colors

Date: 2026-08-02
Status: Confirmed

### Decision

For Wave B shared visual-system fixes, small accent text uses the contrast-safe semantic `accentDark` color `#BC3C1B`, destructive text and buttons use `#B63B3B`, and keyboard focus uses `#2457E6`.

### Rationale

These values are explicitly confirmed in the Wave B implementation request and provide readable semantic action text plus a visible keyboard focus ring without changing the Wave A layout or brand canvas decisions.

### Scope

Wave B shared tokens and primitives only; product flows, API contracts, and protected product/design foundations remain unchanged.

---

## DEC-062 — Canonical Pen v2 is immutable during implementation

Date: 2026-08-10
Status: Confirmed

### Decision

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

### Boundaries

Pen owns visual composition, styling and canonical component anatomy. It does
not independently change routes, API contracts, data models, permissions,
privacy or auction rules; product owner documents and server contracts retain
those responsibilities. Unsupported Pen concepts require a separate decision
or remain blocked.

### Revises

Revises `DEC-055`, `DEC-057` and `DEC-061` only where they define the previous
visual target or its implementation documentation. Their product boundaries,
server-authoritative auction behavior and accessibility obligations remain in
force.

---

## DEC-063 — Pen v2 UI uses durable shared architecture only

Date: 2026-08-10
Status: Confirmed

### Decision

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

### Rationale

The founder is delegating detailed design implementation and requires the
result to remain visually exact, scalable, understandable and maintainable
without relying on subjective design judgment during coding.

---

## DEC-064 — Foundation, Gamma and Avant Arte define approved interaction references

Date: 2026-08-10
Status: Confirmed

### Decision

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

### Boundaries

- Pen is never changed merely to illustrate motion and never loses canonical
  priority.
- Reference archives are historical visual evidence. Gamma cards/positioning
  may be outdated and are not copied over a newer Pen decision.
- Wallet, NFT, mint, blockchain, ETH/BTC, followers, sales and verified badges
  are not bidplace behavior and must not be introduced from a reference.
- Motion values and accessibility fallbacks are centralized in
  `docs/design/03-DESIGN-SYSTEM.md`; route-local animation guesses are rejected.
- Production auction, auth, permissions, privacy and data contracts remain
  server/product-authoritative.

### Rationale

The founder explicitly requires a polished, maintainable implementation with
smooth transitions and artwork-led atmosphere while acknowledging that static
design frames cannot efficiently show every interactive state.

---

## DEC-065 — Public discovery uses explicit routes and server-owned query semantics

Date: 2026-08-11
Status: Confirmed

### Decision

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

### Boundaries

This decision does not introduce wallets, NFT/crypto concepts, followers,
verified badges, payments, or artificial bids. Product Creation steps/media,
structured public social links and the dedicated creator `discipline` field
remain separate data work and are not inferred from the Pen alone.

### Revises

Revises the unresolved route/data status recorded in `DEC-057` and the Pen v2
mapping in `docs/design/02-USER-FLOWS-AND-SCREENS.md`; auction, auth, privacy and
moderation rules remain unchanged.

## DEC-066 — Creator profile uses the MVP v1 final frame

Date: 2026-08-11
Status: Confirmed

### Decision

The public creator page `/seller/[slug]` uses `MqUMz`, named `FINAL — Desktop
Creator / Profile / MVP v1`, as its only canonical implementation and visual
acceptance target. `HOXkZ`, named `FINAL — Desktop Creator / Profile / Editorial
Refinement v1`, is a rejected alternative for this route and must not be used
as a second target, fallback composition or separate implementation.

### Rationale

The founder selected the MVP v1 composition as the final creator-profile
direction. One route and one shared implementation prevent visual drift and
duplicate screen anatomy.

### Boundaries

This decision changes only the creator-profile visual target. It does not alter
seller permissions, public data visibility, auction behavior or the requirement
to use structured public social fields rather than private handoff contact.

## DEC-067 — First-party analytics foundation and admin dashboard

Date: 2026-08-20
Status: Confirmed

### Decision

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

### Revises

Revises `DEC-046` only where it excluded any dashboard: a compact admin
dashboard is now in scope for pilot operations. The first-party / no marketing
tracker constraint remains.

### Rationale

Pre-signup journey and acquisition are otherwise irrecoverable. Storing events
in PostgreSQL lets the founder join funnels with Bid/Order without ETL and keep
one operational UI.

## DEC-068 — MVP static-only image uploads with authz-before-decode

Status: Confirmed
Date: 2026-08-21

### Decision

Product image uploads accept **static JPEG, PNG, and WebP only**. Reject GIF and
any animated WebP/PNG. Run ownership and approved-seller checks **before** Sharp
decode. Enforce max edge 4096px and 16_777_216 pixels; normalize sequentially to
canonical bytes with bounded `limitInputPixels`; rate-limit upload POSTs.

### Alternatives considered

- Allow GIF/animated assets for creator storytelling — rejected for MVP decode
  risk and catalog consistency.
- Client-only size limits — rejected; server must enforce regardless of client.

### Revisit when

Creators need motion assets, print-resolution uploads above the pixel budget, or
object-storage/CDN replaces PostgreSQL blobs. Any animated-media change requires
an explicit product decision and update to `13-APPLICATION-SECURITY.md`.

## DEC-069 — Pilot ops: single-replica Compose + pg_dump backup

Status: Confirmed
Date: 2026-08-22

### Decision

Pilot production operations use **one API replica** deployed via Docker Compose
(`--profile app`) with PostgreSQL. Media remains in-database `BYTEA`; backup is
encrypted-optional `pg_dump -Fc` via `scripts/ops/backup-db.sh`. Restore targets a
separate database name only; integrity checks sample `ProductImage.checksum`
values after restore.

### Alternatives considered

- Kubernetes / managed PaaS for pilot — rejected as unnecessary scope before first
  users.
- Separate object-storage backup for images — rejected while blobs live in Postgres.

### Revisit when

Multi-instance API, object storage for media, or managed backup/restore service is
required for scale or compliance.

## DEC-070 — Fixed 48-hour Order contact window

Status: Confirmed
Date: 2026-09-05
Revises: contact-deadline arithmetic implied by close/recovery implementation

### Decision

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

### Alternatives considered

- Keep 24 hours for first Orders and fix only replacement — rejected; one window
  is the founder MVP rule.
- Configurable 24/48/72 per seller or Listing — deferred.
- Automatic next-bidder replacement — still outside MVP (`DEC-054`).

### Revisit when

Seller-configurable contact windows, automatic replacement, or a different
handoff SLA is an explicit product decision.

## DEC-071 — REJECTED Product is recovered on the same Product

Date: 2026-09-05
Status: Confirmed

Numbered DEC-071 on land because DEC-070 was already assigned to the 48-hour
Order contact window.

### Decision

Product `REJECTED` is not a seller dead-end. An approved seller-owner may open the
same Product, see the latest moderation reason, edit the same fields, images and
creation story allowed in `CHANGES_REQUESTED`, and submit that same Product back
to `PENDING_REVIEW`. A new Product or Listing is not created. Previous
`AuditEvent` rows remain append-only. The Product stays non-public until a later
`APPROVED`. Admin role does not grant seller write. `APPROVED` Products and
scheduled/live Listings stay locked.

### Revises

`DEC-044` only where the previous implementation treated Product `REJECTED` as
terminal with no owner recovery. `DEC-044` still requires moderation before
public publication.

### Alternatives considered

- Clone a rejected Product into a new draft — rejected: duplicates identity and
  splits the audit trail.
- A dedicated reset endpoint that rewrites status or history — rejected: mutates
  audit and adds a second write path.

### Revisit when

A later item class needs a different post-rejection workflow, or legal process
requires a distinct appeal record separate from Product identity.

## DEC-072 — Expanded MVP product contract (founder defaults)

Date: 2026-09-05
Status: Confirmed
Source: founder defaults in the 2026-09-05 reconciliation audit §12, recorded
here so P0-E can proceed. This is a product contract, not an implementation
claim.

### Decision

The target web MVP for RF+BY users is **auction + fixed-price sale + optional
price offer**. Item money and delivery stay direct between seller and buyer.
The service starts free; subscription stays future scope. Figma is the visual
direction; Pen remains on disk until a separate cleanup after a complete
handoff.

| Topic | Confirmed default |
| --- | --- |
| Offers | Buyer offer is server-owned. Seller may accept or reject. **No counteroffer** in MVP. |
| Next bidder | Manual audited admin replacement only. Automatic next bidder is out of MVP (`DEC-054` stands). |
| Contact window | Fixed 48-hour snapshot on every new Order (`DEC-070`). Seller 24/48/72 is deferred. |
| Fixed buy | A unique work has at most one buyer. Buyer confirmation **atomically** creates the Order. Seller reconfirm is not required. The seller may withdraw the listing only **before** a successful buy. Auction Buy Now / buyout on a live auction is not added. |
| Currency | Listing stores `BYN` or `RUB` by the seller's chosen market. No IP-based conversion. |
| Portfolio | Portfolio-only author surface is **wave 2**, even if a Figma frame exists. RFC §12 keeps a simple examples block. |
| Transactional email | In contract: verification, password reset, sale result, replacement/deadline, security/complaint. Outbid and marketing email stay later. RFC §9 still forbids outbid spam. |
| Complaint attachments | Limited private images only. No video or arbitrary files. |
| Legal review | Human legal review is required before a public audience. A closed local test among acquaintances is a separate gate. |
| Pen files | Do not delete or edit canonical Pen in ordinary work. Cleanup is a separate commit only after a complete Figma handoff and an untracked-file inventory. |

Current runtime may remain auction + BYN until P0-E implements this contract.
Code status lives in `11-PROJECT-STATUS.md`.

### Revises

- `DEC-039` only where it said the product uses BYN alone: the **product**
  allows `BYN` or `RUB` on Listing. Soft close, startPrice and the ban on auction
  reserve / auction Buy Now stay.
- RFC §19 “fixed price is out of MVP”: fixed-price sale and optional offer are
  now in the product contract for P0-E. They are not in the current runtime.

### Alternatives considered

- Counteroffer in cabinet — rejected for MVP; accept/reject only.
- Automatic next bidder at close — rejected for MVP; keep manual admin
  replacement.
- IP-detected currency — rejected; seller market on Listing is the source.
- Seller reconfirm after fixed buy — rejected; the buy itself creates the deal.
- Portfolio-only in wave 1 because Figma drew it — rejected; wave 2.

### Revisit when

P0-E implementation starts, a lawyer requires a different contract moment for
fixed vs auction, or an explicit founder decision adds counteroffer or
automatic replacement.

## DEC-073 — Expired SCHEDULED listings are cancelled

Date: 2026-09-05
Status: Confirmed

### Decision

A Listing that remains `SCHEDULED` after `endsAt` is **cancelled**, not left
stuck in the catalog, not silently extended +24h, and not closed as `ENDED`
without bids. The scheduler writes `CANCELLED`, `closedAt = now`, an append-only
`AuditEvent` (`EXPIRED_SCHEDULED_WINDOW`, no user actor) and emits
`listing.updated`. No Order is created. Activation still requires
`startsAt <= now AND endsAt > now` plus approved product/seller handoff.

### Alternatives considered

- Silent +24h reschedule — rejected; hides scheduler failure.
- `ENDED` without bids — rejected; looks like a completed auction.
- Leave `SCHEDULED` forever — rejected; catalog and bid path stay broken.

### Revisit when

A founder decision restores a published recovery window or a different missed-
schedule outcome.

## DEC-074 — Immutable Order deal snapshot

Date: 2026-09-05
Status: Confirmed

### Decision

Every new Order freezes the deal surface at create: Product title, Listing
currency, Product public id, Listing identity (`listingId`) and `finalAmount`,
together with the existing handoff contact snapshot. Lifecycle close, admin
recovery and manual replacement load those fields inside the create
transaction through the shared snapshot helper. Order projections prefer the
frozen fields. Historical rows without snapshot columns keep the live
Product/Listing fallback and are not rewritten.

### Alternatives considered

- Snapshot only contacts — rejected; seller inbox and P0-E would keep reading a
  mutable title.
- Backfill old Orders — rejected for this change; additive nullable columns
  avoid a data rewrite.
- Duplicate `snapshotListingId` — rejected; `listingId` is already the frozen
  Listing identity.

### Revisit when

P0-E reuses this helper for fixed/offers, or a founder decision requires
backfilling historical Orders.

## DEC-075 — Work-first MVP and reopened marketplace mechanics

Date: 2026-09-06
Status: Confirmed scope; mechanics explicitly open
Revises: `DEC-072`; extends `DEC-073`

### Decision

The public web MVP is built around a **Work** that exists independently from a
sale. An author creates the Work first and may keep it as a public portfolio item,
attach a sale later, or relist an archived Work. Portfolio-only is therefore MVP
scope, not wave 2.

The target MVP still includes auction, fixed-price sale and optional buyer price
offer. Current runtime remains auction + BYN until the unresolved mechanics below
are researched and explicitly selected. No implementation may infer those rules
from the former `DEC-072` defaults.

| Topic | Status after revision |
| --- | --- |
| Work / Listing | Confirmed: separate identities and lifecycles; one Work may exist without an active Listing. Historical sale records remain immutable. |
| Sale formats | Confirmed target: auction + fixed + optional offer. Auction Buy Now is not currently requested. |
| Offer expiry/revoke/counteroffer | Open: compare current marketplace practice, then obtain the required legal answer. |
| Fixed-buy contract moment | Product direction is one explicit buyer confirmation for an active unique work; exact legal copy/required terms remain a lawyer gate. Atomicity and double-sale prevention are mandatory. |
| Next bidder / non-payment | Open: manual admin replacement is current runtime only. Research second-chance offers, ranking, seller choice and contact disclosure before choosing target behavior. |
| Contact window | Current code stores 48 hours. Product duration, reminders, weekends and enforcement remain open to research/legal review. |
| Currency | Current MVP stays BYN. RUB or viewer conversion is not confirmed. Research and lawyer review must define contract currency, display hint, rate source and RF implications. |
| Cabinet | Confirmed IA name: `Покупки / Продажи`; cancelled and failed deals must remain visible as history. |
| Expired scheduled | Confirmed: cancel with audit, notify the author and offer a simple relist path. No silent +24-hour shift. |
| Notifications | In-app notifications are required before redesign completion; email is reserved for appropriate transactional/security events after legal/product mapping. |
| Error complaint | Required before public MVP: explicit report action, privacy-safe technical context and optional private screenshot. |
| Object storage | S3-compatible media migration and rendition plan occur before final redesign/launch proof, after the current audit tasks. |
| Redesign | Final implementation layer after product, legal UX and core flows are stable. Original Figma is read-only and must never be modified. |

### Why `DEC-072` changed

The founder had asked the prior work to expose weak points and propose defaults,
not to silently promote every proposed default to a final product decision. The
September 6 review explicitly reopened the marketplace-specific choices and
confirmed portfolio-first behavior.

### Revisit when

The marketplace comparison and written BY+RF legal response are available. Record
each selected mechanic as a new append-only decision before implementation.

## DEC-076 — Sale mode boundaries for the public MVP

Date: 2026-09-06
Status: Confirmed
Source: explicit founder decision in the legal reconciliation session

### Decision

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

### Revises

`DEC-075` where “auction + fixed + optional offer” could be read as allowing an
offer inside an auction. It does not revise Work-first portfolio behavior.

### Revisit when

A written legal answer requires a different transaction flow or the founder adds
another sale format.

## DEC-077 — Belarus-only current legal workstream

Date: 2026-09-06
Status: Confirmed project scope
Source: explicit founder decision in the legal reconciliation session

### Decision

The first operator is an individual entrepreneur registered in Belarus. Current
public-document drafting and the launch legal gate are limited to Belarus law.
The active lawyer questionnaire therefore excludes Russian registration,
Roskomnadzor, Russian data localization and other RF-specific questions.

Belarus-law questions about processors, hosting outside Belarus and cross-border
personal-data transfer remain in scope. Earlier BY+RF packs stay as historical
audit material and are not current implementation instructions.

This is a project-scope decision about the legal workstream. It does not turn an
unverified legal proposition into a repository fact.

### Revises

`DEC-075` and RFC references that made a written BY+RF answer the active launch
gate. Product language and public accessibility do not add a second active legal
workstream without a new founder decision.

### Revisit when

The founder deliberately opens a separate country launch, changes the operator
jurisdiction or receives legal advice that requires a broader review.

## DEC-078 — Belarus launch documents and legal UX defaults

Date: 2026-09-06
Status: Confirmed
Source: founder clarification based on the 2026-08-24 lawyer consultation and
follow-up messages

### Decision

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

### Revises

- `DEC-075` and `DEC-076`: accepted-offer contract outcome is no longer open.
- `DEC-076`: exact fixed-buy contract outcome is no longer open; microcopy remains
  subject to the legal UX research.
- `DEC-077`: the broad lawyer questionnaire is replaced by focused Belarus legal
  UX research and final review of the adapted documents.

### Revisit when

The Belarus research finds a primary-source conflict, the final lawyer review
requires a change, marketing email is enabled, or technical diagnostics are added
to error reports.

## DEC-079 — Work availability and persistent fixed sale

Date: 2026-09-07
Status: Confirmed scope; edit and moderation mechanics remain open
Source: explicit founder clarification after the T07 architecture review

### Decision

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

### Revises

- Extends `DEC-075` with the fixed Listing lifetime and explicit sold-through-platform,
  sold-elsewhere and portfolio-only distinctions.
- Clarifies that relist means a new sale attempt on the same Work, not reuse or rewrite
  of the previous Listing/Order.

### Still open

- Which edits require repeat moderation in each Work/Listing state.
- Which confirmed failure reasons release a Work for relist.
- Exact state names and UI grouping after the marketplace/community research.

### Revisit when

The service introduces quantity, editions, presale, platform payment or a legal answer
requires a fixed Listing deadline.

## DEC-080 — One format-neutral Order identity

Date: 2026-09-07
Status: Confirmed domain boundary; persistence shape remains open
Source: explicit founder clarification after the T07 architecture review

### Decision

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

### Revises

Extends `DEC-074`: immutable Order snapshot is format-neutral. The current mandatory
`sourceBidId` is a runtime limitation, not a target contract for fixed/offer.

### Revisit when

The research and Work-first contract choose the persistence model, or a multi-unit
format is approved for implementation.

## DEC-081 — Test-data reset and deferred general platform tooling

Date: 2026-09-07
Status: Confirmed
Source: explicit founder clarification after the T07 architecture review

### Decision

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

### Revises

- Resolves D04 from `DEC-075`/`DEC-074` in favor of clearing disposable test data.
- Revises `DEC-075`: an in-app notification center is no longer required before the
  redesign or MVP completion.
- Narrows pre-MVP complaints to transaction-specific handoff problems; general content
  and author reports move after MVP.

### Revisit when

Research shows that the auction cannot produce a reliable result without a minimal
notification, public users enter the database, or abuse volume requires general
reporting before the planned post-MVP phase.

## DEC-082 — Первый публичный MVP проверяет портфолио автора

Date: 2026-09-08
Status: Confirmed
Source: explicit founder decision after review of the final creator-first Figma screens
Revises for the first public release: `DEC-003`, `DEC-016`–`DEC-020`, `DEC-075`–`DEC-081`

### Decision

Первый публичный MVP bidplace — самостоятельный сервис-портфолио. Автор проходит
модерацию, создаёт публичный профиль, публикует работы и получает одну ссылку и QR для
распространения. Посетитель без регистрации открывает каталог авторов, каталог работ,
профиль и страницу работы.

В первом MVP нет активной коммерции: аукциона, fixed sale, предложения цены, ставок,
Order, handoff, корзины, истории покупок/продаж и контактов для сделки. Это не отказ от
commerce-направления. Оно сохраняется как следующая продуктовая волна после проверки
портфолио и отдельного legal/domain gate.

### Why

Одновременный запуск портфолио, трёх способов сделки, невыкупа, раскрытия контактов и
споров делает первую проверку слишком большой и задерживает выход. Публичное портфолио
само проверяет ценность профиля, работ, creator onboarding, discovery и share loop.

### Revisit when

Есть несколько одобренных авторов с реальными работами, публичные страницы используются
внешней аудиторией, а основатель готов открыть отдельную commerce wave.

## DEC-083 — Публичная модель Work без «Архива» и простой creation flow

Date: 2026-09-08
Status: Confirmed
Source: explicit founder decisions during creator-page and creation-flow review
Extends: `DEC-075`, `DEC-079`

### Decision

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

### Revisit when

Добавляются clickable tag discovery, rich creation story, commerce availability или
buyer account value.

## DEC-084 — Commerce сохраняется в коде и выключается fail-closed

Date: 2026-09-08
Status: Confirmed implementation boundary
Source: founder instruction not to delete implemented functionality

### Decision

Существующие auction, bid, Order и handoff модули, migrations и tests не удаляются.
Публичный portfolio MVP запускается с server-authoritative commerce capability,
выключенной по умолчанию. Клиент скрывает commerce navigation и actions, а API также
отклоняет прямой вызов выключенных mutations/routes. Одного client-side скрытия
недостаточно.

Commerce tests могут явно включать capability в изолированном test environment.
Долгоживущая отдельная ветка не является хранилищем уже принятого кода: она быстро
расходится с общими исправлениями auth, media и security. Отдельная feature branch
используется только для будущей ограниченной разработки commerce v2 до review/merge.

### Revisit when

Commerce contract, документы, UX и release gates утверждены и проверены отдельно.

## DEC-085 — Figma is the production visual source; Pen file stays historical

Date: 2026-09-09
Status: Confirmed
Source: explicit founder cutover plan for phone UI
Revises: `DEC-062` / `DEC-063` **runtime** role only. The `.pen` file remains
protected historical source on disk and must not be edited, deleted, or adapted
to code.

### Decision

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

### Revisit when

Desktop/tablet Figma compositions exist, search overlay is in scope, or commerce
capability is enabled with matching frames.

## DEC-086 — Opening of the week is a server-owned editorial selection

Date: 2026-09-09
Status: Confirmed
Source: explicit founder correction that skipping Home «Открытие недели» was a
mistake
Revises: `DEC-085` only for `Открытие недели`. Search overlay, catalog tabs
Аукционы/Анонсы/Архив, cart and Geist font files stay deferred.

### Decision

Home may show `Открытие недели` when a durable server-owned editorial pointer
selects a published, publicly visible Work and author. Local/test seed may
include one deterministic example. Production does not invent a selection.
Missing, hidden, rejected or unpublished pointers resolve to `null` and the
section is omitted. Newest-work, random pick and client hardcoded `publicId`
are forbidden.

### Revisit when

Home UI implements the section from an approved capture, or editorial workflow
needs a non-admin operator tool.

## DEC-087 — Commerce v1 archived; active main becomes portfolio-native

Date: 2026-09-10
Status: Confirmed
Source: explicit founder decision after
`docs/audits/2026-09-10-portfolio-simplification-and-commerce-archive.md`
Revises: retention clause of `DEC-084` only. Does not reopen `DEC-082`, `DEC-083`,
`DEC-085`, or `DEC-086`.

### Decision

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

### Why

Portfolio MVP is already the public product contract. Keeping commerce modules,
adapters and schema in the active tree preserves naming drift, test burden and
accidental re-exposure risk even with `COMMERCE_ENABLED=false`. A protected
archive preserves the exact prior implementation without maintaining two active
product lines.

### Revisit when

Commerce contract, legal/domain gate, UX and release gates are approved for a
new wave; then port deliberate concepts from the archive into `commerce-v2`.

## DEC-089 — Discovery facets are derived from public server data

Date: 2026-09-13
Status: Confirmed
Source: explicit founder choice during the mobile-web discovery launch pass

### Decision

Works material options and Authors city/direction options are returned by
`GET /api/portfolio/facets`. Values are normalized, deduplicated and sorted on
the server from currently public authors and published Work revisions only.
The client must not invent Figma/static fallback options. Each stored Work
material string is one canonical facet value; delimiters are not guessed.

The accepted Figma Work card remains title + author. RFC §6 “brief facts” is a
documented product/design ambiguity and does not authorize adding unapproved
fields or changing the Figma master during this implementation.

### Why

Server ownership keeps available filters aligned with public visibility and
prevents stale, fake or private values from entering discovery. Preserving the
accepted card avoids resolving an incomplete visual contract by invention.

### Revisit when

The domain gains structured multi-material data, or an approved Figma/card
contract defines which brief facts must be visible.

## DEC-090 — Home Opening curator note is an optional selection field

Date: 2026-09-14
Status: Confirmed
Source: explicit founder acceptance of an in-place unreleased-table amendment
plus Figma first-fold `439:4404` (390×860) as the Opening visual fixture
Revises: `DEC-086` (editorial copy on the selection) and the additive-migration
clause in `10-CODE-ARCHITECTURE.md` only for this unreleased
`curator_selections` table. Does not reopen `DEC-087` commerce/baseline
migrations.

### Decision

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

### Revisit when

The table has been applied in production, an admin editor for `note` is in
scope, or live Figma inspect copy `uMo04w9bgrchWXXDgO4W62` disagrees with the
versioned first-fold snapshot.

## DEC-091 — Figma Opening identity is local seed; curator is not the work owner

Date: 2026-09-14
Status: Confirmed
Source: explicit founder instruction to implement the Figma-aligned local demo
seed on `feature/portfolio-mvp-release`
Revises: `DEC-090` (Playwright-only `@vex` / Anna seed). Does not reopen
`DEC-087` commerce/baseline migrations or typography/layout of Opening.

### Decision

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

### Revisit when

Figma confirms a vex-owned work, an isolated `pixelp` portrait exists, or the
unreleased `curator_selections` table is applied in production.

## DEC-092 — Demo data is invented in seed, production-quality in the UI

Date: 2026-09-15
Status: Confirmed
Source: explicit founder instruction to revise local demo data quality on
`feature/portfolio-mvp-release`
Revises: `DEC-091` (empty vex Works / labeled demo stubs / pixelp 1×1 gap).
Does not reopen Opening ownership (`vex` curator, Dali / `pixelp`) or
`DEC-087` commerce/baseline migrations.

### Decision

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

### Revisit when

Figma confirms an isolated `pixelp` portrait or a vex-owned work card, or the
process photo/text story builder leaves the post-MVP backlog.

## DEC-093 — Phone gallery hides arrows; History and achievements reuse media

Date: 2026-09-15
Status: Confirmed
Source: explicit founder instruction on `feature/portfolio-mvp-release`
Revises: `DEC-092` History-rendering clause only. Does not reopen Opening
ownership, demo-copy quality, or the post-MVP process builder (`05-MVP-RFC` §15).
Does not rewrite `05-MVP-RFC.md`.

### Decision

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

### Why

Phone UI was duplicating swipe with overlay arrows. About cards were
text-only grey blocks while Figma shows date → photo → description.
History was a text wall despite existing gallery extras.

### Revisit when

Figma supplies isolated exhibition-install photos, a second same-work Dali
History fill, or the process-builder leaves the post-MVP backlog.

## DEC-088 — MVP dock is one four-item glass capsule

Date: 2026-09-11
Status: Confirmed
Source: explicit founder instruction during Figma phone UI correction
Revises: visual variant choice under `DEC-085` only. Does not reopen search
overlay, cart, or 1024/1440 compositions.

### Decision

Production phone navigation is **one** 232×64 glass capsule with four items:
logo (Home), search, plus (Add), profile. Search is an item inside that
capsule. Figma first-fold split chrome (`Frame 182` + `Frame 46` 64×64 search
FAB) and the long-Home five-icon pill (`436:1366`, 288×64 with cart) are unused
variants, not separate production components. Cart stays deferred.

### Why

Handoff captures show two dock layouts. Implementing both would create two
shells. The founder selected the unified capsule already described in
`02-USER-FLOWS-AND-SCREENS.md` (Home, Search, Add, Profile).

### Revisit when

Search overlay, cart, or a designer-approved second dock layout is in scope.

## DEC-094 — Infrastructure errors have one layered path

Date: 2026-09-17
Status: Confirmed
Source: explicit founder instruction before canonical infrastructure error UX
Does not reopen validation, password, registration, conflict, rate-limit, or
domain/not-found copy.

### Decision

Backend owns what happened. Frontend owns how it is shown. Backend `message`
is not a UI contract.

There is one Nest `ApiExceptionFilter`. Shared public shape stays
`{ status, code, message, details?, requestId? }` in `packages/contracts`.
Transport parsing lives in `packages/api-client/src/errors/`. Mobile
infrastructure policy lives in `apps/mobile/src/errors/` and presents through
`PageState`. `SessionAlert` remains the session-only banner when page content
loaded. Feature domain errors stay in their modules.

Infrastructure UI copy is one sentence: «Проверьте соединение и попробуйте ещё раз.»

### Why

Infrastructure copy, mappers and dual Home retry/banner were scattered across
screens. A second filter, a giant error enum, or a coordinator/state machine
would duplicate existing layers.

### Revisit when

Form validation and other public-kind `error.message` leaks are migrated off
the old mapper, or a product-specific infrastructure title is required.

## DEC-095 — Public session failure is silent; ProtectedRoute owns the UI

Date: 2026-09-17
Status: Confirmed
Source: explicit founder instruction during infrastructure error cleanup
Revises: presentation ownership under `DEC-094` only. Does not reopen backend
filter, contracts, api-client kinds, or canonical copy.

### Decision

A loaded public page plus `/api/auth/me` infrastructure failure keeps public
content. The session error is logged. Public chrome does not show SessionAlert.
Auth state is not masked as guest: 401/403 stay anonymous; network/5xx stay
`status='error'`.

`ProtectedRoute` is the owner of blocking session failure and shows the
canonical infrastructure state with Retry → `auth.refreshSession()`.

Feature screens do not suppress or coordinate session alerts. Infrastructure
UI is one sentence plus Retry, via `InfrastructureErrorState`.

### Why

Per-screen `showSessionAlert={!query.isError}` recreated scattered policy.
New public pages should not need to know about session-bootstrap chrome.

### Revisit when

A contextual, non-chrome use of `SessionAlert` is required, or logo-motion is
wired into `InfrastructureErrorState`.

## DEC-096 — Search is a fullscreen overlay over the current public page

Date: 2026-09-18
Status: Confirmed
Source: explicit founder instruction for the Figma Search overlay batch
Revises: `DEC-085` / `DEC-086` only for Search overlay deferral. Catalog tabs
Аукционы/Анонсы/Архив, cart and Geist stay deferred. Does not change Works or
Authors catalog URL filter contracts.

### Decision

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

### Revision 2026-09-18 — Browser Back

Dock Search does not push a history entry. X and Escape dismiss the overlay and
keep the underlying route. Browser Back follows browser history; if that changes
the route, the overlay closes as a consequence of leaving the page. Custom
overlay `pushState` plumbing was rejected as fragile against Expo Router.

### Revision 2026-09-18 — Search is route/history state

Supersedes the previous Back revision: Search must be restorable. Opening Search
from the dock creates exactly one history entry on the current public route
(`overlay=search`, plus `oq` / `otab` when they differ from empty / Категории).
Query and tab edits `replace` that entry, so typing does not stack Back. Result
navigation pushes the Author/Work/Works-filter route; Back restores the Search
session from that history entry. Ordinary detail Back is history-first with a
canonical fallback only when the stack is empty (`/works`, `/authors`). Direct
`/search` and `/search?q=` still host the same overlay; close falls back to Home
when there is no predecessor. Search does not use scenario flags
(`cameFromSearch`, category parent, and similar).

### Why

The Figma Search frames are an overlay on the current page. A submit-only
`/search` landing with stacked Works+Authors fought that contract.

### Revisit when

Category taxonomy and media are decided, or overlay result limits require
in-overlay pagination.


## DEC-097 — Portfolio release uses R2 and native Cloudflare CDN

Date: 2026-10-04
Status: Confirmed
Source: explicit founder answers Q01–Q10 and final portfolio-only release scope.
Reaffirms `DEC-082`–`DEC-084`; does not activate commerce capability.

### Decision

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

### Implementation boundary

Confirmed choices are not evidence of implementation. Current runtime still
uses one ImageStore bucket and API media reads. Exact phased plan and remaining
operational inputs: [R2/CDN second pass](../audits/2026-10-04-R2-MEDIA-IMPLEMENTATION-PLAN.md).
Lazy FULL generation is not implicitly selected by the lazy loading requirement.

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
an infrastructure adapter, not a business database or queue.

Separate staging/production configuration and secrets are required. Production
source remains the existing `feature/portfolio-mvp-release`. No real deployment
is authorized before credentials and environment readiness. Secrets storage
location and media polling optimization were asked separately and are not
inferred as new founder decisions. `DEC-097` media journal, atomic publication
and revocation semantics remain in force.
