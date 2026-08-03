# Test coverage audit — progress

Дата: 2026-08-03

Ветка: `feature/test-coverage-audit`

Commit under review: `5be687c`

## Scope и правила

- Цель: доказать фактическое автоматическое покрытие Waves A–C и критичных MVP-инвариантов либо точно зафиксировать пробелы.
- Изменения разрешены только в двух новых файлах `docs/audits/`.
- Source, tests, seed, API contracts, product-status и design docs не изменяются.
- Статусы запуска фиксируются только как `Passed`, `Failed`, `Blocked by infrastructure`, `Not run` или `Historical agent evidence only`.

## Завершено

- [x] Создана отдельная ветка `feature/test-coverage-audit` от `5be687c`.
- [x] Полностью прочитаны root `AGENTS.md`, обязательные product/design documents и два исторических audit/progress документа.
- [x] Прочитаны package/test configuration files и `apps/mobile/AGENTS.md`.
- [x] Собран начальный файловый инвентарь.
- [x] Подтверждена доступность всех четырёх screenshot directories.
- [x] API/domain body-level audit.
- [ ] Mobile unit/static body-level audit.
- [ ] E2E/fixtures body-level audit.
- [ ] Visual inspection of current screenshots.
- [ ] Real verification runs.
- [ ] Final matrices, findings, verdict and acceptance checklist.

## Инвентарь

| Область | Файлы | Наблюдение |
|---|---:|---|
| `apps/api/src/**/*.spec.ts` | 33 | Unit/controller/service/config/realtime coverage; assertions not yet classified |
| `apps/api/test/**` | 2 specs + helper | PostgreSQL integration; not yet run |
| `apps/mobile/src/**/*.spec.ts` | 15 | Geometry, tokens, adapters, auth/bid validation and cache/environment contracts |
| `apps/mobile/e2e/**/*.spec.ts` | 11 | 28 top-level Playwright scenarios, one worker, real API and disposable `bidplace_e2e` database |
| `packages/contracts/test/**` | 2 | Contract and seed-contract tests |
| `packages/design-tokens/**/*.spec.ts` | 0 | Package has build/typecheck only; visual token assertions are under mobile |
| `packages/database/**/*.spec.ts` | 1 | Export smoke only; schema/migration/seed need source-level audit |

## Screenshot evidence

| Directory | PNG files | Статус |
|---|---:|---|
| `/private/tmp/bidplace-wave-c-screenshots/a852f68` | 66 | Available; visual review pending; older than current `5be687c` |
| `/private/tmp/bidplace-wave-b-screenshots` | 21 | Available; visual review pending |
| `/private/tmp/bidplace-wave-a-screenshots` | 7 | Available; visual review pending |
| `/private/tmp/bidplace-wave2-screenshots` | 18 | Available; visual review pending |

## Findings уже добавлены

- P0: Order handoff/cancellation/replacement mutations have no behavioral automated coverage.
- P1: scheduled-bid E2E uses the admin identity; stale Bid never reaches the server; soft close lacks integration evidence.
- P1: pending-seller direct API matrix and successful seller application are missing.
- P1: moderation reason/audit coverage is incomplete; seed Bid fixtures remain unapproved and weakly tested.
- P2: auth transport round-trip and no-bid/tie close edges are missing.

## Фактические запуски

- Все обязательные команды: `Not run`.
- Исторические результаты из project status/Wave progress: `Historical agent evidence only`; они не считаются результатом этого аудита.

## Следующий блок

1. Mobile unit/static: distinguish pure helper contracts from rendered-component behavior.
2. E2E/fixtures: map each named scenario to the actual actor, state transition, DB/API assertion and screenshot.
3. Update design/responsive matrix and make the next checkpoint commit.

## Ограничения и открытые решения

- `DEC-060`: local/test seed содержит Bid fixtures, конфликтующие с буквальным запретом platform seed bids; founder decision отсутствует.
- Wave C screenshot names target `a852f68`, while the current commit is `5be687c`; artifacts must not be described as current-commit proof without a matching rerun or diff-based qualification.
