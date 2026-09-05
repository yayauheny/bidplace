# bidplace — журнал решений

Последнее обновление: 2026-09-05

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
(`apps/api/src/orders/order-contact-deadline.ts`). It is not a database-configurable
field in MVP.

### Alternatives considered

- Keep 24 hours for first Orders and fix only replacement — rejected; one window
  is the founder MVP rule.
- Configurable 24/48/72 per seller or Listing — deferred.
- Automatic next-bidder replacement — still outside MVP (`DEC-054`).

### Revisit when

Seller-configurable contact windows, automatic replacement, or a different
handoff SLA is an explicit product decision.
