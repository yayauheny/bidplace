# bidplace — после запуска: дальнейшее развитие

Последнее обновление: 2026-10-28
Статус: Planned/Deferred.

Продажи (фиксированная цена, аукцион, заказы, жалобы по заказу, страйки) входят
в запуск по `DEC-149`: механика — [docs/launch/COMMERCE.md](../launch/COMMERCE.md),
план — [docs/launch/README.md](../launch/README.md), что остаётся после волн —
[AFTER-WAVES.md](../launch/AFTER-WAVES.md). Этот файл — функции после запуска.

## 1. Первые кандидаты после запуска

- Clickable chips: переход из тега автора/Work в каталог с фильтром.
- Video в галерее/истории после решения о форматах, лимитах и обработке.
- Лента уведомлений и push (на запуске — письма и точка «требует внимания»).
- Жалобы на Work и автора в интерфейсе (таблица `reports` уже общая) и
  privacy-safe error report с показом отправляемого technical context.
- Именные серии и коллекции автора, ручной порядок работ.
- Follow авторов и buyer collections. Избранные работы входят в запуск (`DEC-149`).

## 2. Доверие и споры

- Transaction chat с audit/evidence boundary.
- Reviews только по реальному Order outcome; прозрачный rating автора и
  покупателя поверх `getTrustSignals`.
- Earned trust badge; его нельзя купить.
- Dispute/moderation workspace и апелляции; последствия для автора по
  признанным жалобам.
- Anti-abuse signals для связанных аккаунтов и coordinated bids; сигнал не
  является автоматическим доказательством.

## 3. Монетизация сервиса

- Необязательная creator subscription, а не комиссия с Work.
- Базовая публикация и базовая продажа остаются бесплатными.
- Возможные бонусы: расширенная статистика, автоповтор лота, early access, AI assistance.
- Paid promotion только с маркировкой `Продвигается`; нельзя продавать место в
  bid history, winner, rating или review.
- Физические QR-наклейки, бирки и другие creator packs.

До включения нужны pricing research, billing provider, налоги, договорные условия
и marketing consent.

## 4. Количество и новые предложения

- Edition/production definition и numbered editions (на запуске одна работа —
  один экземпляр, COMMERCE §14 C2).
- Drops и limited series.
- Presale/made-to-order со сроком изготовления; поле трек-номера.
- Counteroffers и negotiation chain.
- Services, commissions and masterclasses как отдельная продуктовая модель.
- Донаты и сборы, вишлист автора, галереи и события, посты и истории,
  комментарии, подборки и доски, карта «рядом».

## 5. Медиа и creator profile

- Video, отдельные captions/dates и более сложные story blocks;
  базовые `HEADING`/`PARAGRAPH`/`IMAGE` уже в продукте (`DEC-112`).
- Manual media/work ordering.
- История по годам, образование, выставки и опыт с более сложной структурой.
- Embed и интеграции с соцсетями (карточки для соцсетей — в запуске, W5).
- Creator analytics: views, profile transitions, QR sources, воронка продаж.
- AI draft профиля и Work, category/material hints и photo assistance.

### Расширенное управление справочниками

- массовый перенос уже используемых терминов между записями;
- aliases, семантическое объединение и дополнительная локализация;
- отдельная административная очередь вне модерации конкретной ревизии Work.

## 6. Платежи и доставка платформы

- Оплата subscription может стать первым billing flow.
- Work payment, escrow, commission, payouts, refunds and chargebacks — только
  после отдельной legal/financial architecture.
- Delivery integration, tracking and insurance не обещаются до operational readiness.

## 7. Международность и discovery

- Валюты сверх BYN/RUB, справочная конвертация.
- Languages and localized documents.
- New countries only after operator/tax/data/payment/shipping review.
- Curated collections, related works, saved filters and recommendations после
  появления данных; без black-box popularity ranking.

## 8. Gate переноса в разработку

1. наблюдаемая проблема или метрика;
2. явное решение основателя и append-only `DEC-*`;
3. обновление RFC и owner docs;
4. data/legal/security impact;
5. server contract и abuse/race matrix;
6. утверждённые UX states;
7. отдельная короткоживущая branch и review.
