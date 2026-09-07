# bidplace — execution backlog после первого portfolio MVP

Дата: 2026-09-08
Статус: deferred; задачи сохранены, не входят в First MVP
Product directions: [`docs/product/15-POST-MVP-BACKLOG.md`](../../product/15-POST-MVP-BACKLOG.md)

Эти задачи не удаляются и не маскируются под portfolio scope. Они возвращаются в
работу только после отдельного решения, обновлённого RFC и соответствующего legal/
data/design gate.

## Первая commerce wave

| ID | Сохранённая задача | Состояние перед возвратом |
|---|---|---|
| C01 | [Creator-commerce research](10-CREATOR-COMMERCE-FLOWS-RESEARCH.md) | Исследование выполнено; raw response сохранён в `docs/research/raw/2026-09-08-creator-commerce-research.md`; перед implementation нужен review источников и решения mechanics |
| C02 | [Work-first domain contract](04-WORK-FIRST-DOMAIN-CONTRACT.md) | Переформулировать под `Work → Listing → Bid/Offer → Order → handoff`; portfolio-only часть закрывает F02 |
| C03 | Auction capability reopen | Проверить текущий runtime против нового contract; не включать старый flow одним флагом без review |
| C04 | Fixed sale | Бессрочный Listing, atomic purchase, Work-level double-sale protection, отдельное подтверждение |
| C05 | Buyer price offer | Только fixed Listing; expiry/revoke/competing buy/counteroffer должны быть решены заранее |
| C06 | Order/handoff/outcome | Format-neutral Order, immutable snapshots/events, contact disclosure, reason-coded outcomes |
| C07 | Non-payment и second chance | Notice/challenge, ranked sequential offer, mutual exclusion с relist, admin только для exceptions |
| C08 | [Seller sales history](01-SELLER-SALES-HISTORY-INTEGRATION.md) | Ветка/commit требуют review и адаптации к format-neutral Order перед переносом |
| C09 | [Auction lifecycle bounded progress](03-LIFECYCLE-BOUNDED-PROGRESS.md) | Возвращается вместе с scheduler/auction capability; multi-instance и poison rows policy обязательны |
| C10 | Commerce legal pack | Auction/sale rules, contract moments, contacts, consumer duties, outcomes и retention; Belarus lawyer review |
| C11 | Commerce UI | Auction/fixed/offer, purchases/sales, contact/outcome/problem states на базе утверждённого Figma handoff |
| C12 | Commerce release review | Race, idempotency, privacy, notification delivery, abuse, backup/rollback и controlled pilot |

## Ранние улучшения портфолио после запуска

1. Clickable chips и tag discovery.
2. История создания из упорядоченных photo/text этапов; затем video.
3. In-app notification center.
4. Likes/wishlist, follow author и buyer collections только после появления понятной
   visitor-account value.
5. Общие reports на Work/автора и privacy-safe `Сообщить об ошибке` с preview context.
6. Именные серии/коллекции, ручная сортировка работ, расширенный social export.
7. AI draft для профиля/Work, category hints и photo assistance после data/legal gate.

## Более поздние направления

- reviews, ratings, transaction chat и dispute workspace;
- subscription, paid promotion и creator analytics;
- inventory, editions, drops, presale и services;
- platform payments, escrow, commission, delivery/tracking;
- additional currencies, languages and country launches;
- recommendations, related works ranking и saved filters.

## Правило возврата задачи

Перед началом любой строки:

1. зафиксировать проблему и наблюдение пилота;
2. принять append-only `DEC-*`;
3. обновить product RFC и data/legal impact;
4. определить server contract, abuse/race cases и UX states;
5. создать короткоживущую feature branch и отдельный reviewable commit;
6. не использовать этот backlog как разрешение включить старый commerce runtime.
