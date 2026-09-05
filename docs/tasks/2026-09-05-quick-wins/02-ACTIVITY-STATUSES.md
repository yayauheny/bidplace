# QW-02 — корректные Activity statuses

Общий аудит: [`../../audits/2026-09-05-MVP-RECONCILIATION-AND-TASKS.md`](../../audits/2026-09-05-MVP-RECONCILIATION-AND-TASKS.md), пункт 6.13.

## Prompt исполнителю

```text
Repository: bidplace. Выполни только QW-02: исправь buyer Activity status projection и navigation отменённой покупки.

Branch: fix/activity-statuses.

Подтверждённое отображение:
- PENDING_CONTACT → AWAITING_SELLER_CONTACT / «Ожидает связи»;
- CONTACTED → отдельный truthful status «Связались»;
- COMPLETED → COMPLETED;
- HANDOFF_FAILED → отдельный truthful status «Сделка не состоялась»;
- CANCELLED → WIN_CANCELLED / «Покупка отменена»;
- cancelled Order недоступен buyer через GET /orders/:id, поэтому Activity не должна вести на гарантированный 403.

До edit изучи Activity service/contract/screen, Order visibility, API client и tests. Сравни расширение Activity enum, переиспользование Order enum и client-side mapping. Durable fix должен дать server-owned exhaustive projection и typed client contract.

Implementation:
- сделай exhaustive mapping каждого relevant Listing/Order state;
- добавь typed statuses для CONTACTED и HANDOFF_FAILED с русскими labels;
- для CANCELLED не отдавай actionable Order link либо используй существующий безопасный public Product route; не ослабляй Order privacy;
- одна карточка на Listing и deterministic deduplication сохраняются;
- query pagination, seller inbox, fixed/offers и новый дизайн вне scope;
- обнови architecture только если меняется public contract; PROJECT-STATUS обязательно.

Tests:
- table-driven mapping для LIVE/SCHEDULED/ENDED и всех Order statuses;
- cancelled item не создаёт forbidden navigation;
- contract/API/mobile tests;
- affected typecheck/lint/build.

Commit:
fix issue:

* fixed buyer activity status projection
* changed cancelled activity navigation
* added lifecycle coverage

Ответ: outcome; branch/SHA/base; before/after; contract changes; files/diff stat; exact checks/results; status docs; risks; confirmation no Figma/.pen/untracked changes.
```

## Критерии готовности

- `CONTACTED` и `HANDOFF_FAILED` больше не выглядят как обычное `WON`.
- Cancelled card не ведёт на 403 и privacy не ослаблена.
- Mapping exhaustive и проверен таблицей tests.
- Одна карточка на Listing и текущая сортировка сохранены.
- Pagination, seller inbox, fixed и design не затронуты.

## Prompt проверки в новом чате Codex

```text
Review QW-02 по docs/tasks/2026-09-05-quick-wins/02-ACTIVITY-STATUSES.md. Используй приложенные base/SHA и отчёт; review-only. Проверь review skill, contracts/API/UI, exhaustive lifecycle mapping, deterministic deduplication, cancelled navigation and privacy.

Верни ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО, findings P0–P3 с files/lines, DoD gaps, checks evidence и correction prompt.
```
