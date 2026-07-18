# bidplace — текущий статус проекта

Дата снимка: 2026-07-18  
Статус: Verified against repository source and executed checks

## Область и этап

Проверены apps/packages, Prisma schema/migrations, API, Expo routes, contracts, auth, seller/lot/images, auctions/bids/lifecycle/realtime, admin, tests, seed, configuration и UI. `.env` и секреты не читались. Подробный исторический снимок: `../audits/2026-07-18-INITIAL-REPOSITORY-AUDIT.md`.

Текущий этап: **Phase 0 — техническая устойчивость перед rehearsal и первым реальным пилотом**.

`Implemented` означает завершённое узкое поведение, но не готовность всего pilot flow. `Partial` означает, что рабочее ядро есть, а обязательная часть MVP отсутствует или не проверена.

## Function status

| Функция                   | Статус / путь                                                                  | Фактическое поведение                                                                            | Не хватает / риск                                                                          | Тесты                                     | Pilot blocker     | Следующее действие                                    |
| ------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------- | ----------------- | ----------------------------------------------------- |
| Auth/session              | Partial — `apps/api/src/auth`, `apps/mobile/src/features/auth`                 | register/login/me/logout; argon2; cookie/bearer; session invalidation; rate limit                | native cookie persistence и полный HTTP/mobile flow не подтверждены                        | unit auth/token/guards                    | Да, technical     | E2E на target web/native                              |
| Identity/phone            | Phone verification Not implemented — `User.phone`                              | phone хранится как строка регистрации                                                            | нет verified state, OTP, expiry/abuse limits и first-bid gate                              | нет OTP tests                             | Да                | Спроектировать provider-neutral verification contract |
| Seller onboarding/profile | Implemented but inconsistent with product — `sellers/*`, seller forms          | пользователь сам создаёт сразу active profile; public page существует                            | нет invitation/admin verification, photo/city/directions; public contact preference        | seller unit tests                         | Да                | Добавить ручную review-модель отдельной задачей       |
| Category                  | Implemented — `categories/*`, `Category`                                       | простой public справочник                                                                        | admin management не требуется для manual MVP                                               | unit                                      | Нет               | Оставить manual                                       |
| Lot/content               | Partial — `lots/*`, `lot-create-form.tsx`                                      | owner создаёт draft с базовыми полями                                                            | нет technique/materials/dimensions/year/uniqueness/city/delivery/provenance                | lot unit                                  | Да                | Согласовать schema с RFC без расширения scope         |
| Images                    | Partial — `images/*`, `LotImage`                                               | binary DB storage, signature/decode/MIME/size validation, access, order/delete                   | можно опубликовать <3; нет moderation/object store                                         | unit + PostgreSQL integration             | Да                | Ввести RFC completeness gate                          |
| Auction draft/schedule    | Implemented but inconsistent with product — `auctions/*`, auction form         | draft, dates, prices, publish to scheduled/active                                                | USD default, required public reserve, `buyNowPrice`, state mismatch                        | service/lifecycle unit                    | Да                | Привести MVP contract/UI к BYN scheduled auction      |
| Moderation/publication    | Implemented but inconsistent with product — `publishAuction`                   | seller публикует сам                                                                             | нет pending review, preview, admin approval/audit                                          | publish unit только текущего поведения    | Да                | Создать manual review transition                      |
| Bid placement             | Implemented but unsafe for pilot — `bids/bids.service.ts`                      | serializable transaction/retry, server time, self-bid ban, increment, atomic price/count         | нет idempotency, verified-phone/BYN gates и durable audit                                  | unit + concurrent integration             | Да, technical     | Idempotency и audit до rehearsal                      |
| Reserve                   | Partial/inconsistent — contracts/API/UI/lifecycle                              | участвует в выборе winner                                                                        | обязательный и раскрыт public, хотя RFC задаёт optional hidden                             | reserve unit/integration                  | Да                | Разделить private/public contract                     |
| Bid history/privacy       | Partial — public/seller/admin bid APIs, `BidHistory.tsx`                       | public payload не содержит user ID; seller/admin имеют полную запись                             | нет public alias/audit metadata; UI показывает status вместо bidder                        | contract/service tests                    | Да                | Добавить alias и explicit privacy tests               |
| Scheduled start/close     | Partial — lifecycle service + scheduler                                        | server-time activate/close каждые 30s; status predicate; serializable close                      | нет durable audit и доказанной multi-instance/single-runner topology                       | unit + close race/idempotency integration | Да, technical     | Зафиксировать deployment invariant и audit            |
| Winner                    | Implemented narrow — lifecycle service                                         | winner вычисляется из DB детерминированно; reserve/no-reserve result                             | дальнейший handoff отсутствует; product state names differ                                 | reserve/concurrent close integration      | Да для real sale  | Добавить canonical result/handoff states отдельно     |
| Realtime/reconnect        | Partial — `core/realtime/*`                                                    | backend emits `auction.updated`, `bid.placed`, `auction.ended` по room                           | mobile subscription, version, gap detection, reconnect snapshot отсутствуют                | event contract/publisher unit             | Да, technical     | Authoritative snapshot + client recovery              |
| Participation status      | Not implemented                                                                | отсутствует query/model/UI                                                                       | нет winning/outbid/won/lost/next action                                                    | нет                                       | Да                | Добавить user-scoped participation read model         |
| Handoff/refusal/sale      | Not implemented                                                                | отсутствуют model/API/UI                                                                         | real transaction нельзя корректно завершить и измерить                                     | нет                                       | Да                | Сначала утвердить operational flow/privacy            |
| Admin/moderation          | Partial — `apps/api/src/admin`, `/admin`                                       | list users/auctions, ban, hide, bids endpoint                                                    | нет approval, confirmation, investigation, handoff и audit                                 | admin unit                                | Да                | Сделать pilot operations queue                        |
| Audit log                 | Not implemented                                                                | append-only entity/service отсутствует                                                           | bids/close/admin/handoff не имеют расследуемого trail                                      | нет                                       | Да                | Ввести durable security event model                   |
| Analytics                 | Not implemented                                                                | pilot events/store отсутствуют                                                                   | нельзя измерить funnel/результат первой сделки                                             | нет                                       | Да для validation | Определить минимальные server-side events             |
| Public UI                 | Implemented but inconsistent with product — routes/features/storefront/auction | public view, auth, bid form, timer, basic states                                                 | competing detail routes, demo fallback, reserve leak, mass-market copy; no approved design | 3 mobile unit tests; export passed        | Да                | Утвердить canonical direct-link flow                  |
| Seller/admin UI           | Partial                                                                        | forms/dashboards и basic feedback states                                                         | нет review/handoff; mixed terminology; destructive confirmation absent                     | limited mobile tests                      | Да                | Handoff экранов из design status                      |
| Seed/operations           | Partial — `prisma/seed.js`, config, Docker Compose                             | local PostgreSQL/config validation                                                               | seed uses removed field, legacy statuses/USD; нет CI/deploy/observability/backups          | env unit; build/integration               | Да                | Исправить reproducible BYN rehearsal dataset          |
| Future mechanics          | Not implemented as intended                                                    | fixed price/drops/payments/shipping/inbox отсутствуют; `buyNowPrice` только преждевременное поле | future abstractions не должны расширять MVP                                                | нет end-to-end                            | Нет сейчас        | Не реализовывать до roadmap gates                     |

## MVP readiness

| Направление       | Статус          | Причина                                                                                                                 |
| ----------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Product           | Blocked         | seller/lot moderation, complete value card и canonical flow не соответствуют RFC                                        |
| Auction integrity | Partially ready | atomic bids/DB winner/idempotent close есть; idempotency, audit, reserve privacy и deployment invariant отсутствуют     |
| Technical test    | Blocked         | нет 10-user rehearsal, client realtime/reconnect, reproducible seed и end-to-end session evidence                       |
| UX                | Blocked         | нет phone verification, own status, reconnect и post-auction; public flow дублируется                                   |
| Operations        | Unknown         | первый seller/item, price, assets, announcement, payment/handoff and interview ownership не зафиксированы в репозитории |

## Pilot blockers

### До технического rehearsal

1. Bid idempotency и durable audit.
2. Mobile realtime с authoritative reconnect snapshot.
3. Single-runner либо безопасная multi-instance lifecycle topology.
4. Закрытый public reserve.
5. Воспроизводимый BYN seed/reset.
6. E2E session на target web/native и 10-user near-simultaneous bid rehearsal.
7. Automated privacy assertions для public/event payloads.

### До первой реальной сделки

1. Manual seller/lot/auction approval и preview.
2. Phone verification before first bid.
3. Полная карточка ценности и минимум три изображения.
4. Participation, winner/loser and post-auction states.
5. Privacy-safe contact handoff, refusal and sale confirmation.
6. Minimal analytics, incident owner, rules/privacy/legal review.
7. Observability, backup and restore rehearsal.

## Technical debt affecting product validation

- stale seed делает rehearsal невоспроизводимым;
- backend realtime без клиента не проверяет live experience;
- отсутствующие analytics не позволяют отличить product failure от technical failure;
- state names и premature `buyNowPrice` усложняют однозначный MVP flow;
- in-memory rate limit и scheduler topology не описывают production behavior;
- DB image storage работает для пилота, но требует capacity monitoring.

## Product inconsistencies

- seller активируется и публикует без ручной проверки;
- reserve обязателен и публичен;
- mobile auction defaults to USD, MVP requires BYN;
- lot model не объясняет provenance/value согласно RFC;
- public history lacks aliases;
- external notifications корректно отсутствуют как `Rejected MVP`, несмотря на raw research suggestions;
- storefront/demo language приближает продукт к general marketplace;
- canonical handoff and sale states отсутствуют.

## Security and integrity risks

- no verified-phone gate, bid idempotency or append-only audit;
- public hidden-reserve disclosure;
- no review trail for seller/publication/admin actions;
- no explicit reconnect/gap handling may show stale leader/price;
- no automated PII regression test;
- distributed rate limit, deployment topology, logging/monitoring and restore readiness unknown.

## Design readiness

Approved Figma/assets не найдены. Shared tokens/components и responsive primitives существуют, но часть находится в незакоммиченном working tree. Critical screens for verification, participation, moderation, reconnect and post-auction are not started. Детали: `../design/04-DESIGN-STATUS.md`.

## Unknowns requiring manual verification

- выбранные первый seller и lot;
- утверждённые start price/reserve/duration;
- seller legal status and accepted rules;
- фактические pilot devices/browsers and accessibility target;
- production host/topology, incident contact, observability, backups;
- payment/contact/delivery manual process;
- approved Figma, brand assets, photography and announcement plan;
- native session behavior and 10-user network/reconnect behavior outside local tests.

## Executed checks (2026-07-18)

- TypeScript typecheck all apps/packages: passed.
- API unit tests: 156 passed; contracts: 27; mobile: 3.
- PostgreSQL integration tests: 14 passed.
- API build and Expo web/iOS/Android export: passed.
- API lint: passed.
- Mobile lint: 3 pre-existing working-tree errors (`BrandLogo.tsx`, `seller-dashboard-screen.tsx`, `storefront-home-screen.tsx`).
