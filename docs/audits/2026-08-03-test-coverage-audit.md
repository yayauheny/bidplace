# Test coverage audit — 2026-08-03

## 1. Итоговый вердикт

- Общий статус: **Pending audit completion**.
- P0: pending classification.
- P1: pending classification.
- P2: pending classification.
- Подтверждено: обязательные источники доступны; тестовый и screenshot-инвентарь собран.
- Нельзя принимать без завершения: API/domain, mobile unit, E2E/fixtures, visual/accessibility evidence и реальные запуски ещё не сверены целиком.

## 2. Scope и evidence

- Commit under review: `5be687c` (`feature/test-coverage-audit` создана от `feature/wave-c-screen-polish`).
- Разрешённые изменения: только новые audit-файлы в `docs/audits/`.
- Прочитаны: `AGENTS.md`, обязательные product/design owner-документы, `2026-08-02-web-design-audit.md`, `2026-08-03-wave-c-implementation-progress.md`.
- Просмотрены конфигурации: root/API/mobile/contracts/design-tokens/database `package.json`, `turbo.json`, `apps/mobile/playwright.config.ts`, `apps/mobile/AGENTS.md`.
- Screenshot directories доступны: Wave C — 66 PNG, Wave B — 21 PNG, Wave A — 7 PNG, Wave 2 — 18 PNG.
- Ограничение evidence: Wave C artifacts помечены commit `a852f68`, а commit under review — `5be687c`; до проверки diff и фактического E2E rerun они являются commit-specific historical evidence.
- Важный product conflict для трассировки: `DEC-060` оставляет local/test seeded Bid fixtures без founder decision, хотя `09-TRUST-AND-AUCTION-INTEGRITY.md` запрещает platform seed bids.

### Начальная инвентаризация

| Область | Файлы | Обнаруженные сценарии | Типы проверки | Текущий статус аудита |
|---|---:|---:|---|---|
| API unit | 33 | 114 вместе с API integration по синтаксическому подсчёту | Vitest, mocks/fakes | Pending body-level review |
| API integration | 2 | входит в 114 | Vitest + PostgreSQL | Pending body-level review/run |
| Mobile unit/static | 15 | 43 | Vitest, source/style/geometry contracts | Pending body-level review |
| Browser E2E | 11 | 28 top-level Playwright tests | Chromium, real API, disposable PostgreSQL, screenshots | Pending body-level review/run |
| Contracts | 2 | входит в 8 shared-package tests | Vitest/Zod contracts and seed contract | Pending body-level review |
| Design tokens | 0 package-local specs | 0 | Build only; visual token tests live in mobile | Pending verification |
| Database | 1 | входит в 8 shared-package tests | Vitest export smoke; schema/migration/seed require inspection | Pending body-level review |

## 3. Результаты реальных запусков

| Проверка | Команда | Статус | Результат | Ограничения |
|---|---|---|---|---|
| Design tokens build | `corepack pnpm --filter @bidplace/design-tokens build` | Not run | Pending | — |
| API typecheck | `corepack pnpm --filter @bidplace/api typecheck` | Not run | Pending | — |
| API unit | `corepack pnpm --filter @bidplace/api test` | Not run | Pending | — |
| Mobile typecheck | `corepack pnpm --filter @bidplace/mobile typecheck` | Not run | Pending | — |
| Mobile lint | `corepack pnpm --filter @bidplace/mobile lint` | Not run | Pending | — |
| Mobile Vitest | `corepack pnpm --filter @bidplace/mobile exec vitest run` | Not run | Pending | — |
| Mobile Playwright | `corepack pnpm --filter @bidplace/mobile test:e2e` | Not run | Pending | Requires Docker/PostgreSQL |
| Mobile build | `corepack pnpm --filter @bidplace/mobile build` | Not run | Pending | Pinned-pnpm equivalence may be needed |
| Diff whitespace | `git diff --check` | Not run | Pending | — |

## 4. Матрица функционального покрытия

| Функция / инвариант | Product owner document | Реализация | Тесты | Тип проверки | Статус | Доказательство / пробел |
|---|---|---|---|---|---|---|
| Registration/login/logout; cookie/CORS/local origin | MVP RFC §§4, 10; architecture | Pending trace | Pending trace | Pending | Pending | Body-level review not started |
| Guest/buyer/pending/approved/admin permissions | MVP RFC §§4–6; seller policy §10; DEC-058 | Pending trace | Pending trace | Pending | Pending | API authorization must be distinguished from UI hiding |
| Seller application and moderation statuses | Seller policy §§10, 13 | Pending trace | Pending trace | Pending | Pending | — |
| Product/Listing lifecycle and public visibility | MVP RFC §§5–6; DEC-059 | Pending trace | Pending trace | Pending | Pending | — |
| Media delivery and privacy | MVP RFC §§11–13; trust §§8–9 | Pending trace | Pending trace | Pending | Pending | — |
| Bid increment, stale price, idempotency, history, soft close | MVP RFC §§7, 17; trust §§4–6 | Pending trace | Pending trace | Pending | Pending | — |
| No artificial bids / deterministic seed | Foundation §8; trust §3; DEC-060 | Pending trace | Pending trace | Pending | Pending | Founder decision remains open |
| Order/activity privacy and role projections | MVP RFC §§9, 13–14; trust §§8–10 | Pending trace | Pending trace | Pending | Pending | — |
| Moderation reason, audit trail and active-listing locks | Seller policy §13; trust §12 | Pending trace | Pending trace | Pending | Pending | — |
| Public author profile and Product navigation | MVP RFC §12 | Pending trace | Pending trace | Pending | Pending | — |

## 5. Матрица дизайна и responsive-покрытия

| Экран / состояние | 1440 | 1024 | 390 | Роли | Assertions | Screenshot evidence | Вердикт |
|---|---|---|---|---|---|---|---|
| Shell/navigation/overlays | Pending | Pending | Pending | guest/buyer/pending/approved/admin | Pending | Artifacts found | Pending visual review |
| Catalog loaded/loading/failed media | Pending | Pending | Pending | public + role variants | Pending | Artifacts found | Pending visual review |
| Product buyer/admin/keyboard/dialog | Pending | Pending | Pending | buyer/admin | Pending | Artifacts found | Pending visual review |
| Author many/zero/error | Pending | Pending | Pending | public | Pending | Artifacts found | Pending visual review |
| Purchases empty/error/long | Pending | Pending | Pending | buyer/admin absence | Pending | Artifacts found | Pending visual review |
| Seller profile/Product/Listing drafts | Pending | Pending | Pending | pending/approved/changes | Pending | Artifacts found | Pending visual review |
| Admin moderation and Order | Pending | Pending | Pending | admin/buyer/seller/outsider | Pending | Artifacts found | Pending visual review |
| Login/register/loading/error/zoom | Pending | Pending | Pending | anonymous | Pending | Artifacts found | Pending visual review |

## 6. Findings

### P0

Pending audit completion.

### P1

Pending audit completion.

### P2

Pending audit completion.

## 7. Что покрыто хорошо

Pending body-level and execution verification.

## 8. Test debt и порядок исправлений

Pending finding classification.

## 9. Финальный acceptance checklist

- [ ] API/domain
- [ ] auth/roles
- [ ] bidding/order/moderation
- [ ] media/seed
- [ ] responsive visual behavior
- [ ] accessibility automation
- [ ] browser E2E
- [ ] founder manual acceptance

