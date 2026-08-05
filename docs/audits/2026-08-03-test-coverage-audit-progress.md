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
- [x] Mobile unit/static body-level audit.
- [x] E2E/fixtures body-level audit.
- [x] Visual inspection of all supplied screenshots (112/112).
- [x] Real verification runs.
- [x] Final matrices, findings, verdict and acceptance checklist.

## Инвентарь

| Область | Файлы | Наблюдение |
|---|---:|---|
| `apps/api/src/**/*.spec.ts` | 33 | Reviewed/classified; 136 tests Passed |
| `apps/api/test/**` | 2 specs + helper | PostgreSQL integration; 10 tests Passed |
| `apps/mobile/src/**/*.spec.ts` | 15 | Geometry, tokens, adapters, auth/bid validation and cache/environment contracts |
| `apps/mobile/e2e/**/*.spec.ts` | 11 | 28 top-level Playwright scenarios, one worker, real API and disposable `bidplace_e2e` database |
| `packages/contracts/test/**` | 2 | Contract and seed-contract tests |
| `packages/design-tokens/**/*.spec.ts` | 0 | Package has build/typecheck only; visual token assertions are under mobile |
| `packages/database/**/*.spec.ts` | 1 | Export smoke 1/1 Passed; schema/migration/seed reviewed separately |

## Screenshot evidence

| Directory | PNG files | Статус |
|---|---:|---|
| `/private/tmp/bidplace-wave-c-screenshots/a852f68` | 66/66 viewed | Reviewed; same source/tests as `5be687c`, but historical commit label |
| `/private/tmp/bidplace-wave-b-screenshots` | 21/21 viewed | Reviewed |
| `/private/tmp/bidplace-wave-a-screenshots` | 7/7 viewed | Reviewed |
| `/private/tmp/bidplace-wave2-screenshots` | 18/18 viewed | Reviewed |

## Findings уже добавлены

- P0: Order handoff/cancellation/replacement mutations have no behavioral automated coverage.
- P1: scheduled-bid E2E uses the admin identity; stale Bid never reaches the server; soft close lacks integration evidence.
- P1: pending-seller direct API matrix and successful seller application are missing.
- P1: moderation reason/audit coverage is incomplete; seed Bid fixtures remain unapproved and weakly tested.
- P2: auth transport round-trip and no-bid/tie close edges are missing.
- P2: mobile Vitest covers pure contracts but mounts no components; registration schema and real reduced-motion consumers are not unit-tested.
- P1: 1440 catalog assertion accepts three cards; mobile keyboard does not constrain the visual viewport; no page-level accessibility scanner.
- P2: desktop tooltip is hover-tested under a focus-labelled screenshot, broad route captures have title-only assertions, and Playwright is Chromium-only.
- P1 visual: PageState retry button is visibly left-aligned; registration leaks English phone validation; role-model “loaded” captures are race-dependent and the fresh pending-seller artifact still contains skeletons.
- P2 determinism: catalog visual data depends on records accumulated by earlier specs.

## Фактические запуски

- `Passed`: design-tokens build.
- `Passed`: API typecheck, build and unit suite — 33 files / 136 tests.
- `Passed`: API PostgreSQL integration — 2 files / 10 tests. Первый sandboxed запуск не видел localhost; разрешённый rerun к существующему `bidplace-postgres` прошёл.
- `Passed`: contracts — 2 files / 7 tests.
- `Passed`: database export smoke — 1 file / 1 test via direct Vitest (package has no `test` script).
- `Passed`: mobile typecheck, lint and Vitest — 15 files / 73 tests.
- `Passed`: full mobile Chromium Playwright — 28/28, 3.0 minutes, disposable `bidplace_e2e`.
- `Failed`: literal mobile `build` script stopped before export because its nested `pnpm` resolved to 11.10.0 against root pin 11.7.0.
- `Passed`: project-equivalent pinned build — design-tokens build plus direct Expo export; web/iOS/Android bundles generated.
- `Passed`: final `git diff --check`.
- Historical project-status/Wave results remain `Historical agent evidence only`; none were substituted for these runs.

## Свежий visual rerun

- 66 current-run Wave C PNG generated in `/private/tmp/bidplace-wave-c-screenshots/042f599`.
- Visually rechecked the known-risk artifacts: registration still shows the English phone error; PageState retry remains left-aligned; pending-seller “loaded” capture still shows skeletons; approved-seller loaded successfully on this run, confirming a race-dependent evidence wait; programmatic Product focus does not emulate a shrunken mobile visual viewport.

## Следующий блок

1. Run final diff/status checks.
2. Commit the completed audit only.

## Ограничения и открытые решения

- `DEC-060`: local/test seed содержит Bid fixtures, конфликтующие с буквальным запретом platform seed bids; founder decision отсутствует.
- Fresh Wave C screenshots target audit HEAD `042f599`; source and tests are unchanged from commit under review `5be687c`, while audit-only commits account for the hash difference.
