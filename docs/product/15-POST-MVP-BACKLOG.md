# bidplace — продуктовый backlog после portfolio MVP

Дата: 2026-09-08
Статус: Planned/Deferred
Execution backlog: [`../tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md)

Первый MVP ограничен публичным портфолио (`DEC-082`). Этот файл сохраняет все
актуальные направления, которые сознательно не входят в его contract. Порядок ниже не
означает автоматическое обещание реализации.

## 1. Первые кандидаты после запуска портфолио

- Clickable chips: переход из тега автора/Work в каталог с применённым фильтром.
- История создания как упорядоченные `фото + текст` этапы; затем video.
- In-app notifications для moderation, новых работ и будущих commerce events.
- Общие reports на Work/автора и privacy-safe error report с показом отправляемого
  technical context.
- Именные серии и коллекции автора, ручной порядок работ и расширенный QR/social export.
- Likes/wishlist, follow и buyer collections только когда у visitor account появляется
  самостоятельная ценность.

## 2. Commerce wave: три формата

Планируемые форматы сохраняются:

1. Auction: start price, increment, start/end, server-authoritative bids.
2. Direct fixed price: бессрочный Listing до покупки или снятия.
3. Buyer price offer: optional только у fixed Listing.

Оплата за Work и доставка остаются напрямую между сторонами. bidplace не принимает и
не удерживает деньги за работу и не оформляет перевозку. Перед commerce wave нужны:

- Work/Listing/Order/handoff contract;
- Work-level double-sale protection;
- immutable rule, Work, price, identity и outcome evidence;
- решения offer expiry/revoke/competing buy;
- сроки/notice/challenge для несостоявшейся сделки;
- ranked sequential second chance либо явный отказ от него;
- contact disclosure только сторонам Order;
- transactional delivery для критических событий;
- документы и legal UX, проверенные юристом Беларуси;
- кабинет `Покупки / Продажи` и controlled pilot.

Исследование механик выполнено и хранится как raw evidence. Оно рекомендует 24h
expected / 48h overdue / около 72h до uncontested closure, reveal-on-click и
sequential second chance, но эти значения не становятся product contract без отдельного
решения и legal review.

## 3. Общение, доверие и споры

- Transaction chat с audit/evidence boundary.
- Reviews только по реальному Order outcome.
- Прозрачный rating автора и покупателя.
- Earned trust badge; его нельзя купить.
- Dispute/moderation workspace и апелляции.
- Anti-abuse signals для связанных аккаунтов и coordinated bids; сигнал не является
  автоматическим доказательством.

## 4. Монетизация сервиса

- Необязательная creator subscription, а не обязательная комиссия с Work.
- Базовая публикация и будущая базовая продажа остаются доступными бесплатно.
- Возможные бонусы: больше активных работ, scheduled publication, автоповтор,
  расширенная статистика, early access, AI assistance.
- Paid promotion только с маркировкой `Продвигается`; нельзя продавать место в bid
  history, winner, rating или review.
- Физические QR-наклейки, бирки и другие creator packs.

До включения нужны pricing research, billing provider, налоги, договорные условия и
marketing consent.

## 5. Медиа и creator profile

- Process story blocks, captions, dates and video.
- Manual media/work ordering.
- История по годам, образование, выставки и опыт с более сложной структурой.
- Social frame/story card, embed и интеграции с соцсетями.
- Creator analytics: views, profile transitions, QR sources and future commerce.
- AI draft профиля и Work, category/material hints и photo assistance.

## 6. Количество и новые предложения

- Edition/production definition и numbered editions.
- Sale units и inventory отдельно от Work.
- Drops и limited series.
- Presale/made-to-order как отдельный fulfilment contract.
- Counteroffers и negotiation chain.
- Services, commissions and masterclasses как отдельная продуктовая модель.

## 7. Платежи и доставка платформы

- Оплата subscription может стать первым billing flow.
- Work payment, escrow, commission, payouts, refunds and chargebacks появляются только
  после отдельной legal/financial architecture.
- Delivery integration, tracking and insurance не обещаются до operational readiness.

## 8. Международность и discovery

- RUB/USD/EUR/CNY, справочная конвертация и contract currency.
- Languages and localized documents.
- New countries only after operator/tax/data/payment/shipping review.
- Curated collections, related works, saved filters and recommendations после появления
  достаточных реальных данных; без black-box popularity ranking.

## 9. Gate переноса в разработку

Для функции требуется:

1. наблюдаемая проблема/метрика portfolio или commerce pilot;
2. явное решение основателя и append-only `DEC-*`;
3. обновление RFC и owner docs;
4. data/legal/security impact;
5. server contract и abuse/race matrix;
6. утверждённые UX states;
7. отдельная короткоживущая branch и review.
