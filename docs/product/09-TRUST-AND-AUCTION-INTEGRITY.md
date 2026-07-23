# bidplace — доверие и честность аукциона

Последнее обновление: 2026-07-23
Статус: Confirmed  
Связанные решения: `DEC-010`, `DEC-011`, `DEC-018`, `DEC-019`, `DEC-039`, `DEC-045`, `DEC-047`, `DEC-050`, `DEC-051`, `DEC-054`

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

## 6. Soft close

### MVP

- Bid в последние 60 seconds продлевает auction на 60 seconds.
- Общее продление ограничено 600 seconds от исходного `endsAt`.
- Server, а не client или WebSocket, рассчитывает и фиксирует новое `endsAt` в той же transaction, что и accepted Bid.
- Проверки покрывают границу close, repeat scheduler pass и bid/close race.

## 7. Уведомления и status

Сейчас:

- no external auction email/push/SMS;
- realtime и in-app status;
- user сам открывает history.

Риски:

- no return after outbid;
- missed ending;
- soft close должен быть ясно показан в UI, чтобы не восприниматься как скрытое продление.

Данные:

- return rate;
- status views;
- outbid-to-return;
- interviews;
- complaints;
- failed auctions.

Critical transactional messages позднее отделяются от marketing.

## 8. Identity и email verification

Перед first bid:

- verified email в production MVP;
- rate limits;
- attempt limits;
- verification-code expiry;
- abuse detection.

Dev/test bypass разрешён только в явно non-production окружении. Он не может попасть в production build и не ослабляет остальные ограничения ставок.

Buyer email и seller handoff contact не public. После создания active Order buyer получает выбранный seller contact (Telegram, phone или Instagram), seller получает verified buyer email; privacy mode seller сохраняется.

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
- admin фиксирует reason, отменяет исходный Order и вручную выбирает replacement из ranked Bid list;
- история исходного winner и Order не меняется;
- автоматическая замена и AI-анализ не входят в MVP. Весь replacement выполняется admin вручную; будущее поведение не определено до отдельного решения.

## 11. Хранение

Auction/bids не hard-delete при hide.

Разделить:

- UI hide;
- audit retention;
- PII deletion;
- legal hold;
- anonymization.

До legal/privacy решения используется бессрочное хранение. Self-service deletion в MVP отсутствует. Все persisted entities получают `createdAt` и `updatedAt`; Product также получает `publishedAt` при первой публичной публикации. Эти даты не отменяют будущую policy удаления или anonymization.

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

## Implementation verification — 2026-07-19

Task A closes the closed-pilot gate with unit/integration evidence for bid idempotency, soft close, close-vs-Bid concurrency and Order privacy, plus Chromium coverage for verified-phone bidding, outsider Order denial and ordinary-user admin denial. Production SMS delivery, multi-instance scheduler coordination and broader browser/device rehearsal remain future operational work.
