# QW-04 — редактирование и повторная модерация отклонённой работы

Общий аудит: [`../../audits/2026-09-05-MVP-RECONCILIATION-AND-TASKS.md`](../../audits/2026-09-05-MVP-RECONCILIATION-AND-TASKS.md), пункт 6.11.

## Prompt исполнителю

```text
Repository: bidplace. Выполни только QW-04: Product REJECTED должен редактироваться и повторно отправляться на модерацию как тот же Product.

Branch: fix/rejected-product-recovery.

Это явное решение основателя. REJECTED остаётся private. Approved seller-owner может открыть ту же форму, увидеть последнюю причину, изменить разрешённые поля/images/creation story и submit тот же Product обратно в PENDING_REVIEW. Новый Product/duplicate не создаётся. Предыдущие moderation events/reasons остаются append-only в audit. Admin и посторонние не получают seller write capability.

До edit изучи product-state, ProductsService, moderation/audit model, owner detail contract, ProductDraftScreen and existing CHANGES_REQUESTED flow. Сравни: treat REJECTED as editable; clone flow; new reset endpoint. Выбери reuse same Product/state transition as durable fix.

Implementation:
- server authorization/state machine — источник истины;
- разреши owner edits в REJECTED по тем же safe boundaries, что CHANGES_REQUESTED;
- submit REJECTED → PENDING_REVIEW atomically, без удаления audit history;
- owner detail/UI показывает actionable rejection reason and reopens same form;
- public visibility остаётся false до нового APPROVED;
- active/listed Product invariants не ослаблять;
- никаких fixed/offers/redesign;
- explicit founder decision записать append-only в DECISION-LOG со ссылкой на прежнее решение; update RFC/status/architecture only where needed.

Tests:
- owner can load/edit/resubmit rejected same Product ID;
- non-owner/unapproved seller/admin-through-seller-route denied;
- rejected remains non-public before and after edits/PENDING_REVIEW;
- audit reason/history preserved and new transition appended;
- no duplicate Product/Listing;
- UI reload hydrates rejected draft and displays reason;
- affected unit/integration/contract/UI tests, typecheck/lint/build.

Commit:
fix issue:

* fixed rejected product recovery
* changed moderation resubmission flow
* added ownership and visibility coverage

Ответ: outcome; branch/SHA/base; state transition before/after; files/diff stat; audit/visibility evidence; exact checks/results; docs/decision entry; risks; no Figma/.pen/untracked changes.
```

## Критерии готовности

- Повторно используется тот же Product ID.
- Reason виден владельцу и история audit не переписывается.
- `REJECTED`/`PENDING_REVIEW` никогда не становятся public.
- Ownership и approved-seller gates сохранены.
- Reload продолжает форму, duplicate не создаётся.

## Prompt проверки в новом чате Codex

```text
Review QW-04 по docs/tasks/2026-09-05-quick-wins/04-REJECTED-PRODUCT-RECOVERY.md и общему аудиту. Review-only; используй review + security skills. Проверь base..SHA, state machine, owner permissions, moderation audit immutability, public visibility, same Product identity, reload UI and tests. Убедись, что решение не разрешило edits APPROVED/LIVE Products.

Верни ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО, findings P0–P3 с files/lines, DoD gaps, checks evidence и correction prompt.
```
