# Wave C — implementation progress

Дата: 2026-08-03
Ветка: `feature/wave-c-screen-polish`
Базовый коммит: `ea93e84`

## Текущая задача

Довести C1–C7 screen polish и visual/accessibility evidence для bidplace без изменения API, domain, auth, moderation или bidding logic.

## Просмотренные файлы

- `docs/product/00-PROJECT-INDEX.md`
- `docs/product/01-PRODUCT-FOUNDATION.md`
- `docs/product/05-MVP-RFC.md`
- `docs/product/08-SELLER-AND-ITEM-POLICY.md`
- `docs/product/09-TRUST-AND-AUCTION-INTEGRITY.md`
- `docs/product/10-CODE-ARCHITECTURE.md`
- `docs/product/11-PROJECT-STATUS.md`
- `docs/product/12-DECISION-LOG.md`
- `docs/design/00-DESIGN-INDEX.md`
- `docs/design/01-DESIGN-FOUNDATION.md`
- `docs/design/02-USER-FLOWS-AND-SCREENS.md`
- `docs/design/03-DESIGN-SYSTEM.md`
- `docs/design/04-DESIGN-STATUS.md`
- `docs/design/05-DESIGN-HANDOFF.md`
- `docs/audits/2026-08-02-web-design-audit.md`
- `docs/modern-ui/DESIGN.md`
- `docs/modern-ui/00-project-decisions.md`
- `docs/modern-ui/03-screen-rules.md`
- `docs/modern-ui/04-component-catalog.md`
- `docs/modern-ui/references/README.md`
- `docs/modern-ui/references/REFERENCE-AUDIT.md`
- Wave C screen files under `apps/mobile/src/features` and related `apps/mobile/src/components/modern-ui`.

## Принятые решения и причины

- Сохранить существующие `modernTokens`, shared shell/primitives и доменные контракты Wave B.
- Доводить композиции локально и через уже существующие layout helpers; не добавлять новые продуктовые CTA, tabs, API-поля или статусы.
- Проверять целевые ширины `1440×900`, `1024×900`, `390×844`; evidence хранить вне репозитория.
- При недоступной инфраструктуре фиксировать точный блокер и оставлять соответствующий статус `Needs verification`.

## C1 — каталог

Решение: сохранить единую grid-композицию и 4:5 media bounds, но разделить цену и строку статуса/дедлайна в `AuctionCard`. Skeleton повторяет те же media и metadata bounds; дата публикации не добавляется.

Изменённые файлы:

- `apps/mobile/src/components/modern-ui/AuctionCard.tsx`
- `apps/mobile/src/features/products/product-list-screen.tsx`

Результаты проверок:

- `corepack pnpm --filter @bidplace/mobile typecheck` — passed.
- `corepack pnpm --filter @bidplace/mobile lint` — passed.
- `corepack pnpm --filter @bidplace/mobile exec vitest run` — 13 files / 58 tests passed.

## Изменённые файлы

- См. C1 выше.

## Результаты проверок

- Создана ветка `feature/wave-c-screen-polish` от `ea93e84`.
- Полные проверки Wave C ещё не запускались.

## Незакрытые риски

- Требуется детальный screen-by-screen audit и реализация C1–C7.
- Требуется проверить доступность Docker PostgreSQL/Playwright и physical-device/screen-reader acceptance.
