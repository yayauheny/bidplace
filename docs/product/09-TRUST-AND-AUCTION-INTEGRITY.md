# bidplace — доверие и честность аукциона

Последнее обновление: 2026-07-18  
Статус: Confirmed  
Связанные решения: `DEC-008`, `DEC-009`, `DEC-010`, `DEC-011`, `DEC-018`, `DEC-019`

## 1. Роль доверия

Доверие — часть основного продукта.

Покупатель верит:

- seller реален;
- item существует;
- связь подтверждена;
- bids настоящие;
- платформа не разгоняет цену;
- winner корректен;
- contacts не утекут;
- история сохранится.

Seller верит:

- bids не потеряются;
- winner честный;
- PII защищены;
- платформа не обесценит;
- incident расследуем.

## 2. Provenance

Тип связи:

- `CREATED_BY_SELLER`;
- `OWNED_BY_SELLER`;
- `SIGNED_BY_SELLER`;
- `AUTHORIZED_FIRST_PARTY_RELEASE`.

MVP: `CREATED_BY_SELLER`.

Evidence:

- process photos;
- исходники;
- signature;
- publications;
- item with seller;
- certificate;
- exhibition history;
- representative documents;
- video confirmation.

Не всё обязано быть public.

## 3. Искусственные ставки

Запрещены:

- seller bids;
- employee bids;
- друзья по просьбе;
- platform seed bids;
- linked accounts;
- price raising without intent;
- отмена fake winner.

Статус: Rejected, не пересматривается.

Альтернативы:

- start price;
- reserve;
- preview;
- real traffic;
- better story;
- перенести auction;
- fixed price;
- отказаться продавать.

## 4. Bid audit

Хранить:

- bid ID;
- auction ID;
- user ID;
- amount;
- server timestamp;
- accepted/rejected;
- reason;
- price before/after;
- request ID;
- transaction result;
- limited risk metadata;
- session/device signal.

Доступ:

- buyer — public history;
- seller — handoff data по правилам;
- admin — full audit;
- logs — минимум PII.

## 5. Атомарность

Bid только через backend transaction.

Нельзя:

- winner на client;
- client timestamp;
- offline cached bid;
- WebSocket order как bid order.

Подход:

- row lock или optimistic version;
- growth constraint;
- idempotency;
- one bid service;
- event post-commit.

## 6. Hard и soft close

### MVP hard close

Плюсы: проще, тестируемо, точный контракт.

Риски: sniping, latency, пользователь не успевает.

### Planned soft close

- bid в последние 60 sec;
- +2 minutes;
- repeat;
- optional cap.

Перед включением: load test, UI, server calculation, no double close, new decision.

## 7. Уведомления и status

Сейчас:

- no external auction email/push/SMS;
- realtime и in-app status;
- user сам открывает history.

Риски:

- no return after outbid;
- missed ending;
- hard close усиливает.

Данные:

- return rate;
- status views;
- outbid-to-return;
- interviews;
- complaints;
- failed auctions.

Critical transactional messages позднее отделяются от marketing.

## 8. Identity и phone

Перед first bid:

- verified phone;
- rate limits;
- attempt limits;
- OTP expiry;
- abuse detection.

Phone не public.

Winner phone передаётся seller только в handoff и по правилам.

## 9. Seller privacy

Default — рабочий contact.

Privacy mode:

- seller contact hidden;
- seller receives buyer;
- separate account;
- later inbox;
- representative support.

Для public people privacy default.

## 10. Handoff

После close:

- final price фиксируется;
- winner неизменяем;
- seller получает data;
- buyer видит instruction;
- actions logged;
- sale confirmation не меняет history.

Winner refusal:

- winner остаётся;
- admin фиксирует reason;
- next bidder manual;
- future offer flow.

## 11. Хранение

Auction/bids не hard-delete при hide.

Разделить:

- UI hide;
- audit retention;
- PII deletion;
- legal hold;
- anonymization.

Сроки — legal/privacy решение.

## 12. Admin MVP

- seller approval;
- item approval;
- hide;
- disable bidding;
- ban;
- audit;
- suspicious mark;
- incident;
- winner refusal;
- content correction;
- pilot export.

Admin не редактирует bid amount.

## 13. Risk flags позднее

- seller/bidder IP overlap;
- device overlap;
- bid without wins;
- only one seller;
- repeated refusals;
- multiple accounts per phone;
- timing;
- bids below reserve;
- cancellations.

Flag не доказательство.

## 14. Incidents

### Severity 0

- data leak;
- wrong winner;
- lost accepted bid;
- double payout;
- platform shill.

Stop, preserve, notify, review.

### Severity 1

- seller no response;
- winner refusal;
- condition dispute;
- suspicious bidder.

Manual review.

### Severity 2

- content/UX error.

Fix without changing bid facts.

## 15. Public rules

Перед bid:

- bid is commitment;
- server timer;
- hard close;
- reserve;
- contacts after;
- off-platform payment;
- delivery responsibility;
- platform role;
- no manipulation;
- privacy use.

## 16. Tests

- double submit;
- concurrent;
- stale minimum;
- retry;
- idempotency;
- endsAt boundary;
- cron repeat;
- reserve;
- self-bid;
- admin hide;
- privacy;
- deletion with audit;
- reconnect;
- out-of-order WebSocket.
