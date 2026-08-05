# Wave 1 — Order trust flows and test-only seed boundary

Дата: 2026-08-05
Ветка: `feature/order-trust-test-coverage`
Статус: Implemented; release hardening remains outside Wave 1

## Краткая матрица Order mutations

Матрица восстановлена из `apps/api/src/orders/orders.controller.ts`,
`apps/api/src/admin/admin.controller.ts`, `apps/api/src/orders/orders.service.ts`
и `docs/product/05-MVP-RFC.md` §6, §13–14.

| Операция                | Кто может вызвать                                       | Кто не может                                                                                         | Сейчас есть test        | Нужный test                                            |
| ----------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------ |
| Получить Order          | buyer/seller своей стороны; admin                       | outsider; buyer/seller cancelled Order                                                               | projection unit tests   | PostgreSQL role/privacy matrix                         |
| Seller `contacted`      | seller этого Order в `PENDING_CONTACT`                  | buyer; outsider; admin; чужой seller; повтор/terminal                                                | нет behavioral coverage | PostgreSQL success, role denial, repeat                |
| Seller `completed`      | seller этого Order в `CONTACTED`                        | buyer; outsider; admin; чужой seller; повтор/terminal                                                | нет behavioral coverage | PostgreSQL success, role denial, repeat                |
| Seller `handoff-failed` | seller этого Order в `PENDING_CONTACT` или `CONTACTED`  | buyer; outsider; admin; чужой seller; повтор/terminal                                                | нет behavioral coverage | PostgreSQL success, terminal idempotency               |
| Admin cancel            | admin; только non-terminal Order                        | buyer; seller; outsider; повтор cancelled                                                            | нет behavioral coverage | PostgreSQL reason, snapshot, audit, unchanged repeat   |
| Admin ranked Bids       | admin                                                   | buyer; seller; outsider                                                                              | нет behavioral coverage | PostgreSQL ranked ordering and role denial             |
| Admin replacement       | admin; cancelled исходный Order; Bid из того же Listing | buyer; seller; outsider; исходный winner; arbitrary user/non-listed Bid; active replacement повторно | нет behavioral coverage | PostgreSQL history, snapshots, audit, one active Order |

## Решение и scope

- Реализовать только уже существующие переходы и роли; новые статусы, payment,
  delivery и automatic replacement не добавляются.
- Тестируемые действия проходят через `OrdersService` public methods с явным
  actor role/user id; исходное состояние подготавливается Prisma fixture helper.
- Browser flow использует существующий seller Order route и действие handoff;
  новый UI не создаётся.
- Demo Bids остаются только в явно разрешённом local/test seed profile. Seed
  production-like profile должен fail closed до любой записи.

## Evidence log

| Область                                | Статус  | Evidence                                                                                                                  |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL Order mutation matrix       | Passed  | `apps/api/test/integration/order-mutations.integration.spec.ts`                                                           |
| PostgreSQL manual replacement          | Passed  | `apps/api/test/integration/order-replacement.integration.spec.ts`                                                         |
| Seed DB contract and production denial | Passed  | `apps/api/test/integration/seed-contract.integration.spec.ts`                                                             |
| Browser seller handoff                 | Passed  | `apps/mobile/e2e/order-handoff.spec.ts`                                                                                   |
| Product/status documentation           | Updated | `docs/product/09-TRUST-AND-AUCTION-INTEGRITY.md`, `10-CODE-ARCHITECTURE.md`, `11-PROJECT-STATUS.md`, `12-DECISION-LOG.md` |

## Проверки

- Passed: `corepack pnpm --filter @bidplace/api typecheck`.
- Passed: `corepack pnpm --filter @bidplace/api test` — 136 tests.
- Passed: `corepack pnpm --filter @bidplace/contracts test` — 7 tests.
- Passed: `corepack pnpm --filter @bidplace/api test:integration -- order-mutations.integration.spec.ts order-replacement.integration.spec.ts seed-contract.integration.spec.ts` — 20 tests against local Docker PostgreSQL. Vitest also executed the existing Product/Listing integration suite.
- Passed: `corepack pnpm --filter @bidplace/mobile test:e2e -- order-handoff.spec.ts` — full Chromium suite, 29/29 scenarios including the new seller handoff flow, against disposable PostgreSQL.
- Remaining outside Wave 1: WebKit/device/accessibility acceptance and the isolated 10-user rehearsal.
