# bidplace — roadmap на 24 месяца

Последнее обновление: 2026-07-18  
Статус: Planned  
Горизонт: 8 циклов по 3 месяца

## 1. Ограничения

Ресурсы:

- один основной разработчик;
- возможно 1–2 человека позднее;
- ограниченный бюджет;
- ручная работа допустима;
- скорость не цель;
- крупный механизм получает месяцы, не неделю.

Принцип:

```text
сделать → проверить → исправить → повторить → расширять
```

Не более двух крупных продуктовых целей на цикл.

## 2. Переходные правила

Следующая волна не начинается автоматически. Нужен gate:

- технический;
- продуктовый;
- операционный;
- trust;
- capacity.

Сдвиг вправо допустим.

## 3. Месяцы 0–3: техническая устойчивость

### Цель

Надёжный auction flow.

### Работы

- auth;
- SellerProfile;
- lot;
- images;
- structured card;
- scheduled auction;
- reserve;
- atomic bids;
- increments;
- realtime;
- participation status;
- phone verification;
- hard close;
- cron;
- handoff;
- admin;
- audit;
- analytics;
- mobile web.

### Тест

10 users, conflicts, reconnect, close race, privacy, recovery.

### Gate

Нет critical defects из MVP RFC.

## 4. Месяцы 4–6: первые продажи

### Цель

1–5 реальных аукционов.

### Работы

- concierge;
- preview assets;
- первый seller;
- ads;
- moderation;
- checklist;
- sale confirmation;
- interviews;
- UX fixes;
- status center;
- incidents.

### Условные эксперименты

После первой сделки:

- soft close prototype;
- simplified fixed price;
- limited drop prototype.

Не обязательно выпускать все. Выбирается реально запрошенное.

### Gate

- одна завершённая сделка;
- нет trust incident;
- creator готов повторить или ясно отказывается;
- известны drop-off.

## 5. Месяцы 7–9: повторяемый запуск

### Цель

Снизить стоимость запуска следующего creator.

### Работы

- onboarding checklist;
- listing template;
- social assets;
- creator profile;
- other works;
- relist;
- drafts;
- availability;
- category attributes;
- ad tracking;
- case studies.

### Gate

- 3 creators;
- 5 real auctions;
- 3 sales;
- один repeat seller.

## 6. Месяцы 10–12: несколько механизмов

### Цель

Добавить доказанные форматы.

Кандидаты:

- timed auction;
- soft-close auction;
- fixed price;
- limited drop.

Preorder только при реальном спросе.

### Работы

- common Sale model;
- lifecycle;
- quantity;
- order intent;
- purchase history;
- seller status;
- dispute tools;
- category navigation;
- editorial landing.

Не делать recommendations, open marketplace, international payments.

### Gate

Каждый новый формат — минимум 3 реальных запуска и интервью.

## 7. Месяцы 13–15: payment readiness

### Цель

Подготовить безопасные platform transactions.

### Работы

- legal review;
- merchant/intermediary model;
- provider talks;
- KYC;
- refunds;
- chargebacks;
- ledger;
- payout;
- idempotency;
- antifraud;
- reconciliation.

Entities:

- Order;
- PaymentIntent;
- LedgerEntry;
- Payout;
- Refund.

Не проводить деньги без sandbox, double-entry, legal approval.

## 8. Месяцы 16–18: payment pilot

### Цель

Ограниченные сделки через платформу.

### Работы

- one provider;
- one currency;
- checkout;
- payout;
- one fee model;
- refund;
- payout delay;
- fraud flags;
- manual review;
- delivery confirmation;
- runbooks.

Gate: reconciliation без расхождений и ошибочных выплат.

## 9. Месяцы 19–21: публичные creators

### Цель

Движение к North Star.

### Работы

- enhanced verification;
- representative account;
- privacy mode;
- inbox;
- provenance evidence;
- labels personal/signed;
- concierge workspace;
- approval workflow;
- media kit;
- high-traffic hardening;
- soft close default для крупных запусков, если подтверждено.

Sellers:

- локальные известные creators;
- музыканты;
- блогеры;
- предприниматели;
- artists с аудиторией.

Brands всё ещё не open segment.

Gate: один запуск публичного человека без privacy/trust incident.

## 10. Месяцы 22–24: controlled discovery

### Цель

Помочь найти других creators.

Предпосылки:

- каталог;
- repeat buyers;
- category data;
- moderation;
- несколько active sales.

Работы:

- search;
- filters;
- curated collections;
- similar works;
- creator follow без spam;
- limited feed;
- ending soon;
- new creators;
- value editorial.

Не делать без данных:

- сложный AI;
- black-box ranking;
- infinite feed;
- popularity-only.

Gate: cross-creator engagement без mass-market шума.

## 11. Вне обязательного плана

- visual search;
- room-photo search;
- AR/3D;
- masterclasses;
- booking;
- corporate procurement;
- charity;
- brand onboarding;
- international shipping;
- multi-currency;
- collectibles;
- verified resale;
- financing;
- advanced recommendations.

## 12. Когда замедлиться

- текущая механика не прошла сделки;
- растут incidents;
- docs расходятся с code;
- нет времени на tests;
- privacy/security issue;
- capacity падает;
- feature не усиливает value;
- рынок просит другой механизм.

## 13. Обновление

Для каждой волны:

- статус;
- фактические даты;
- gates;
- перенесённое;
- причины;
- новые decisions.

Текущий progress хранится только в `11-PROJECT-STATUS.md`.
