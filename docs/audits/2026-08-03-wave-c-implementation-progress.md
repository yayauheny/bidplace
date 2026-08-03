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

## C3 — автор и покупки

Решение: публичная identity-зона использует только существующие публичные поля, 120px photo/fallback и локализованный тип автора. Works используют responsive grid с общими `AuctionCard`; purchases остаются divider-led и показывают текущие status, price и deadline без лишней строки действия.

Изменённые файлы:

- `apps/mobile/src/features/sellers/public-seller-screen.tsx`
- `apps/mobile/src/features/activity/activity-screen.tsx`

Результаты проверок:

- `corepack pnpm --filter @bidplace/mobile typecheck` — passed после исправления импорта `DimensionValue`.
- `corepack pnpm --filter @bidplace/mobile lint` — passed.
- `corepack pnpm --filter @bidplace/mobile exec vitest run` — 13 files / 58 tests passed.

## C4 — seller profile, Product draft, Listing draft

Решение: формы сохраняют существующие fields, mutations, ISO payloads, upload/delete/reorder и lock rules, но читаются как последовательные задачи. Seller profile preview ограничен 200px с broken-photo fallback; Product draft media — 160×200 contain rows; Listing draft принимает и человекочитаемый `ДД.ММ.ГГГГ, ЧЧ:ММ`, и прежний ISO input, отправляя прежний ISO payload.

Изменённые файлы:

- `apps/mobile/src/features/sellers/seller-profile-screen.tsx`
- `apps/mobile/src/features/sellers/product-draft-screen.tsx`
- `apps/mobile/src/features/sellers/listing-draft-screen.tsx`

Результаты проверок:

- `corepack pnpm --filter @bidplace/mobile typecheck` — passed после добавления `ImagePlaceholder` в imports.
- `corepack pnpm --filter @bidplace/mobile lint` — passed.
- `corepack pnpm --filter @bidplace/mobile exec vitest run` — 13 files / 58 tests passed.

## Изменённые файлы

- См. C1 выше.

## C2 — Product detail и ставки

Решение: `AuctionPanel` остаётся единственным транзакционным блоком. Story/provenance, история ставок и история предмета используют существующий `EditorialSection` без panel chrome. Mobile `BottomActionBar` ограничен summary и CTA; поле суммы, validation error и retry остаются внутри scrollable auction panel.

Изменённые файлы:

- `apps/mobile/src/features/products/product-screen.tsx`
- `apps/mobile/src/components/modern-ui/BottomActionBar.tsx`

Результаты проверок:

- `corepack pnpm --filter @bidplace/mobile typecheck` — passed.
- `corepack pnpm --filter @bidplace/mobile lint` — passed.
- `corepack pnpm --filter @bidplace/mobile exec vitest run` — 13 files / 58 tests passed.

## Результаты проверок

- Создана ветка `feature/wave-c-screen-polish` от `ea93e84`.
- Полные проверки Wave C ещё не запускались.

## Незакрытые риски

- Требуется детальный screen-by-screen audit и реализация C1–C7.
- Требуется проверить доступность Docker PostgreSQL/Playwright и physical-device/screen-reader acceptance.

## C5 — moderation и order

Решение: `/admin` получает две очереди в max 1180px на desktop и один столбец ниже desktop breakpoint. Moderation rows сохраняют status/context/reason и существующие confirmations, но author остаётся лёгкой text-link, а row approvals/destructive actions — compact. Order сохраняет role-safe projection, добавляет локализованную причину отмены только если API её уже вернул и делает long-value rows устойчивыми.

Изменённые файлы:

- `apps/mobile/src/features/admin/admin-moderation-screen.tsx`
- `apps/mobile/src/features/orders/order-screen.tsx`

Результаты проверок:

- Выполняются ниже.

## C6 — auth, long content, all page states

Решение: регистрационный copy описывает buyer flow и будущую seller application без обещания admin-доступа. `PageState` сохраняет один polite loading announcement и добавляет plain-language error message, если retryable caller не передал собственный текст. Auth viewport, validation, focus/zoom и существующие redirects не меняются.

Изменённые файлы:

- `apps/mobile/src/features/auth/auth-form.tsx`
- `apps/mobile/src/components/modern-ui/PageState.tsx`

Дополнение C6: декоративные `Skeleton` больше не объявляются отдельными progressbar; loading announcement остаётся единственным shared `PageState` announcement.

Изменённый файл:

- `apps/mobile/src/components/modern-ui/Skeleton.tsx`
- `apps/mobile/src/features/products/product-list-screen.tsx` — catalog-specific single loading announcement.

Результаты проверок:

- `corepack pnpm --filter @bidplace/mobile typecheck` — passed.
- `corepack pnpm --filter @bidplace/mobile lint` — passed.
- `corepack pnpm --filter @bidplace/mobile exec vitest run` — 13 files / 58 tests passed.
