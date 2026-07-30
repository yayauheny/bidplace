# bidplace — журнал решений

Последнее обновление: 2026-07-18

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

## DEC-060 — Founder decision required for local demo Bid fixtures

Date: 2026-07-31
Status: Needs founder decision

### Conflict

The deterministic local seed creates one Bid for the seeded buyer on the live Listing and one Bid on the ended Listing so browser demos can show bid history and the ended result. `docs/product/09-TRUST-AND-AUCTION-INTEGRITY.md` currently prohibits platform seed bids.

### Required decision

Confirm whether explicitly local/test-only seeded buyer fixtures are allowed when they cannot reach production data or production runtime. Until confirmed, this remains a documented implementation risk rather than a product-policy exception.
