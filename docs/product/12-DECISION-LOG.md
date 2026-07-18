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
