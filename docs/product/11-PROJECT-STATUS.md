# bidplace — текущий статус проекта

Дата снимка: 2026-07-18  
Статус документа: Verified against repository source and executed checks

## 1. Область аудита

Проверены monorepo/workspaces, backend, Expo client, Prisma schema и migrations, shared contracts/API client, auth, seller profile, lot/images, auctions, bids, reserve, history, Socket.IO, scheduler, admin, tests, seed и конфигурация. `.env` и секреты не читались. Новые продуктовые функции в ходе аудита не реализовывались.

Статус `Implemented` означает завершённое поведение в своей узкой области, а не готовность всего pilot flow. `Partial` используется, если существует рабочее ядро, но отсутствует обязательная часть MVP или critical gate.

## 2. Текущий этап

```text
Phase 0 — техническая устойчивость перед первым реальным пилотом
```

Цель: полный rehearsal с 10 участниками, затем первая реальная продажа.

## 3. Карта фактической реализации

| Область                | Product               | Code            | Доказательство                                                            | Работает                                                                      | Не хватает / риск                                                                            |
| ---------------------- | --------------------- | --------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Email/password auth    | Confirmed             | Partial         | `apps/api/src/auth/*`; `apps/mobile/src/features/auth/*`; auth unit tests | register/login/me/logout, argon2, HttpOnly cookie/bearer, rate limit          | Нет HTTP/mobile E2E; native cookie persistence не подтверждён                                |
| User identity          | Confirmed             | Implemented     | `packages/database/prisma/schema.prisma`; `auth.mapper.ts`                | Buyer и seller используют один `User`; role только admin/user                 | Нет verification state                                                                       |
| SellerProfile          | Confirmed             | Partial         | `sellers.service.ts`; seller profile screens/tests                        | create/update/self/public profile                                             | Профиль сразу `active`, нет invitation/admin verification, фото, города и направления        |
| Public seller page     | Confirmed             | Partial         | `sellers.controller.ts`; `public-seller-screen.tsx`                       | Профиль и scheduled/active auctions                                           | Нет фото, past auctions, examples; contact preference публичен                               |
| Category               | Confirmed             | Implemented     | `categories.*`; `Category` model; unit test                               | Детерминированный простой справочник                                          | Нет admin management, что допустимо для manual MVP                                           |
| Lot creation           | Confirmed             | Partial         | `lots.service.ts`; `lot-create-form.tsx`; unit tests                      | Draft lot, ownership, category, title/description/condition                   | Нет техники, материалов, размеров, года, uniqueness, city, delivery и provenance             |
| Images                 | Confirmed             | Partial         | `LotImage`; `images/*`; image integration tests                           | Upload, MIME/signature/decode validation, size limits, access, order/delete   | Можно создать lot без изображений; нет minimum 3, moderation и object storage                |
| Auction entity         | Confirmed             | Partial         | `Auction` model; contracts; `auctions.service.ts`                         | Draft creation, schedule, prices, dates, state                                | State machine расходится с RFC; reserve обязательный; `buyNowPrice` находится в MVP contract |
| Seller publication     | Confirmed             | Partial         | `publishAuction`; auction service tests                                   | Seller публикует draft как scheduled/active атомарно с lot                    | Нет `PENDING_REVIEW` и admin approval; seller обходит moderation                             |
| Scheduled start        | Confirmed             | Implemented     | `AuctionLifecycleService.activateScheduledAuctions`; unit test            | Server-time activation с status predicate                                     | Нет durable audit; scheduler topology не определена                                          |
| Timed end / hard close | Confirmed             | Implemented     | `BidsService`; lifecycle scheduler/service; integration race test         | Reject после `endsAt`, server clock, 30-second close cycle                    | Нет rehearsal/deployment evidence                                                            |
| Reserve                | Confirmed             | Partial         | pricing policy; lifecycle reserve tests                                   | Reserve влияет на winner/no-winner                                            | Значение обязательное и раскрывается public API/UI, хотя должно быть optional hidden         |
| Manual bids            | Confirmed             | Partial         | `BidsService`; unit/integration concurrency tests                         | Serializable transaction, self-bid ban, increments, atomic price/count/status | Нет phone verification, idempotency key, BYN-only gate и audit record                        |
| Bid history            | Confirmed             | Partial         | public auction detail; seller/admin bids endpoints                        | Public history не раскрывает bidder user ID; seller/admin видят полную запись | Нет публичного псевдонима и audit metadata; UI показывает bid status вместо участника        |
| Realtime               | Confirmed             | Partial         | `core/realtime/*`; event contract tests                                   | Backend публикует auction/bid/end events по room                              | Нет mobile subscription, version, gap detection, reconnect snapshot и integration test       |
| Cron close             | Confirmed             | Partial         | `auction-closing.scheduler.ts`; lifecycle tests                           | Каждые 30 секунд, `waitForCompletion`, повторное закрытие идемпотентно        | Нет durable close audit и single-runner deployment guarantee                                 |
| Winner                 | Confirmed             | Implemented     | lifecycle service; reserve/concurrent-close integration tests             | Winner вычисляется из DB транзакционно и детерминированно                     | Дальнейший handoff не реализован                                                             |
| Phone verification     | Confirmed             | Not implemented | `User.phone` и registration form — только ввод строки                     | Телефон сохраняется при регистрации                                           | Нет verified flag, OTP/provider/rate limit/expiry и gate перед первой ставкой                |
| Participation status   | Confirmed             | Not implemented | Нет route/model/query                                                     | —                                                                             | Нет «Побеждает/Перебита/Выиграна/…» и next action                                            |
| External notifications | Rejected MVP          | Not implemented | Нет notification integration                                              | Соответствует MVP                                                             | Критические security/payment сообщения потребуют отдельного решения позже                    |
| Seller privacy         | Confirmed             | Not implemented | Только `contactPreference` в profile                                      | —                                                                             | Нет privacy mode и правил раскрытия контакта                                                 |
| Handoff                | Confirmed             | Not implemented | Нет entity/API/UI                                                         | —                                                                             | Нельзя завершить pilot flow после winner                                                     |
| Winner refusal         | Confirmed             | Not implemented | Нет entity/API/admin flow                                                 | —                                                                             | Нет сохранённого audit и перехода к next bidder                                              |
| Sale confirmation      | Confirmed             | Not implemented | Нет status/API/UI                                                         | —                                                                             | Нет `SALE_CONFIRMED` и результата пилота                                                     |
| Admin panel            | Confirmed             | Partial         | `admin/*`; mobile admin screen; unit tests                                | List users/auctions, ban, hide, view bids endpoint                            | Нет seller/lot approval, failed handoff, audit и подтверждений действий                      |
| Audit log              | Confirmed             | Not implemented | Нет Prisma model/service                                                  | —                                                                             | Critical bids/close/admin actions не имеют append-only trail                                 |
| Minimal analytics      | Confirmed             | Not implemented | Нет events/store/provider                                                 | —                                                                             | Нельзя измерить pilot funnel                                                                 |
| Seed/demo data         | Confirmed operational | Partial         | `packages/database/prisma/seed.js`                                        | Содержит demo users/category/lots/auctions/bids                               | Использует удалённое `Lot.images`, legacy statuses и USD; seed требует исправления           |
| Environment config     | Confirmed technical   | Partial         | `core/config/env.ts`; `packages/config`; `docker-compose.yml`             | Zod validation и local PostgreSQL                                             | Нет production deployment, CI, observability, backups/restore evidence                       |
| Soft close             | Planned               | Not implemented | Нет кода                                                                  | —                                                                             | После пилота                                                                                 |
| Fixed price            | Planned               | Not implemented | `buyNowPrice` хранится, но поведения нет                                  | —                                                                             | Поле/UI опережает подтверждённый scope                                                       |
| Drops                  | Planned               | Not implemented | Нет кода                                                                  | —                                                                             | После validation                                                                             |
| Payments               | Planned               | Not implemented | Нет кода                                                                  | —                                                                             | Не входят в MVP                                                                              |
| Shipping               | Planned               | Not implemented | Нет кода                                                                  | —                                                                             | Не входит в MVP                                                                              |
| Inbox                  | Planned               | Not implemented | Нет кода                                                                  | —                                                                             | Позднее для public sellers                                                                   |
| Discovery              | Planned               | Partial         | Public catalog/storefront routes существуют                               | Есть list/detail UI                                                           | Без search/ranking/recommendations; mass-market storefront требует продуктовой сверки        |
| AI                     | Planned distant       | Not implemented | Нет кода                                                                  | —                                                                             | Не core                                                                                      |
| Services               | Rejected current      | Not implemented | Нет кода                                                                  | Соответствует продукту                                                        | —                                                                                            |
| Brand accounts         | Rejected current      | Not implemented | Нет отдельной роли                                                        | Соответствует текущей политике                                                | `influencer` enum не равен утверждённому `PUBLIC_PERSON` extension point                     |
| Resale                 | Rejected              | Not implemented | Нет отдельного flow                                                       | Нет общего resale-механизма                                                   | Provenance policy технически не моделируется и не проверяется                                |

## 4. Тестовые доказательства

### Unit и contract tests

- auth, token, session invalidation и guards;
- rate limiting и environment parsing;
- seller, category, lot, image, auction, bid, lifecycle и admin services;
- persistence parsing и Prisma error mapping;
- HTTP/WebSocket Zod contracts;
- React Query auth-scope cache behavior.

### Integration tests

- concurrent bids;
- bid/close race и post-close rejection;
- duplicate idempotent close;
- reserve-met и reserve-unmet close;
- transaction rollback;
- draft/public image access, delete/reorder и cascade.

### Отсутствуют

- E2E browser/native flow;
- 10-user rehearsal/load test;
- realtime reconnect/gap recovery;
- phone verification;
- moderation/preview;
- privacy/handoff/refusal/sale confirmation;
- production deployment, backup и restore tests.

## 5. Расхождения с `05-MVP-RFC.md`

1. SellerProfile создаётся active без invitation и admin verification.
2. Seller сам публикует auction; `PENDING_REVIEW` и preview moderation отсутствуют.
3. Auction statuses используют `sold`/`failed`, а не канонические `ENDED_WITH_WINNER`/`ENDED_NO_WINNER`; нет `SALE_CONFIRMED` и `HANDOFF_FAILED`.
4. Телефон обязателен при регистрации, но не верифицируется перед первой ставкой.
5. `reservePrice` обязательный и публично раскрывается API и UI вместо optional hidden reserve.
6. Bid request не имеет idempotency key.
7. UI по умолчанию создаёт USD auction; MVP определяет BYN.
8. Lot contract содержит только title/description/condition/category и не покрывает обязательные provenance/content fields.
9. Нет требования минимум трёх изображений.
10. Public bid history не показывает псевдоним участника.
11. Realtime есть только на backend; клиент делает refetch после mutation и не восстанавливает snapshot после reconnect.
12. Нет participation status, seller privacy, handoff, winner refusal, sale confirmation, audit log и analytics.
13. Admin не подтверждает seller/lot/auction и не сопровождает failed handoff.
14. `buyNowPrice` и storefront-лексика присутствуют до подтверждения fixed-price scope; сам fixed-price flow отсутствует.
15. Seed не соответствует текущей Prisma schema и рынку BYN.

## 6. P0 — blockers до rehearsal

- добавить idempotency для ставок;
- провести контролируемый 10-user concurrency test;
- подключить mobile realtime с snapshot/refetch on reconnect;
- подтвердить запуск ровно одного lifecycle runner либо безопасную multi-instance модель;
- добавить durable audit для bid/close/admin;
- закрыть reserve leak;
- проверить end-to-end auth session на целевых native/web средах;
- исправить seed и воспроизводимый reset/demo flow;
- подтвердить отсутствие PII в public/event payloads автоматическим тестом.

## 7. P1 — blockers до real pilot

- invitation/admin verification seller;
- lot/auction moderation и preview;
- phone OTP gate;
- полная карточка лота и image minimum;
- participation statuses;
- privacy mode и contact handoff;
- refusal и sale confirmation;
- minimal analytics;
- rules/privacy/legal readiness для Беларуси;
- observability, incident contact, backups и restore rehearsal.

## 8. Открытые решения основателя

- первый seller и первый item;
- start price, reserve и duration;
- сохранять hidden reserve после пилота или перейти к minimum acceptable start price;
- допустима ли текущая storefront/catalog подача или она слишком близка к mass-market;
- убрать ли `buyNowPrice` до отдельного решения о fixed price;
- как сопоставить технический `influencer` с продуктовым `PUBLIC_PERSON`;
- privacy mode, handoff contact и delivery process;
- seller legal status, rules acceptance и pilot incident owner.

## 9. Готовность

### Rehearsal

Not ready. Основные серверные bidding/close invariants существуют, но отсутствуют idempotency, client realtime/reconnect, durable audit, 10-user gate и воспроизводимый seed.

### Pilot

Not ready. Дополнительно отсутствуют phone verification, moderation, полная карточка, participation, privacy, handoff, sale confirmation и analytics.

## 10. Update 2026-07-18

- Verified: monorepo, API, mobile, contracts, persistence, migrations, scheduler, realtime backend, tests и config.
- Implemented: фактические статусы подтверждены путями и test inventory.
- Changed: исходный `Needs verification` заменён полным repository snapshot.
- Still blocked: rehearsal и pilot gates из разделов 6–7.
- Docs updated: `10-CODE-ARCHITECTURE-AND-DESIGN.md`, `11-PROJECT-STATUS.md`.

## 11. Выполненные проверки 2026-07-18

- TypeScript typecheck всех apps/packages: passed.
- API unit tests: 156 passed.
- Contracts tests: 27 passed.
- Mobile unit tests: 3 passed.
- PostgreSQL integration tests: 14 passed.
- API build: passed.
- Expo web/iOS/Android export с отключённой загрузкой `.env`: passed.
- API lint: passed.
- Formatting изменённых `10` и `11`: passed.
- Mobile lint: 3 existing errors в `BrandLogo.tsx`, `seller-dashboard-screen.tsx` и `storefront-home-screen.tsx`; файлы не менялись этой документальной задачей.
