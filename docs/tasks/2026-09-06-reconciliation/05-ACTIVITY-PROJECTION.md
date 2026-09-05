# Task 05 — детерминированная Activity projection

## Кому дать

- Исполнитель: GPT Terra.
- Независимая проверка: GPT-5.6 Sol.
- Приоритет: P1.

## Prompt исполнителю

```text
Repository: bidplace. Base branch: fix/mvp-reconciliation-review.

Исправь только две ошибки Activity: cancelled auction без Order не должен называться
OUTBID, а relevant Order нельзя выбирать случайным `.find` из unordered relation.
Прочитай AGENTS.md, обязательные product docs, implementation stack review и этот task.
Примени nest; если меняется shared/mobile contract, сохрани типобезопасность end-to-end.

До кода укажи success criteria, candidate fixes и выбранное правило projection.
Durable rule:
- в shared contract есть отдельный truthful status для отменённых торгов;
- для текущего пользователя Orders запрашиваются/выбираются детерминированно;
- non-cancelled relevant Order приоритетнее старого cancelled; внутри одинакового
  класса используется явный createdAt/id order;
- cancelled-only Order не получает рабочую ссылку, если detail для этой роли запрещён;
- CONTACTED, HANDOFF_FAILED, WON, LOST/OUTBID остаются совместимы с текущим контрактом.

Обследуй Prisma query, mapper, shared schema/types, mobile labels/icons/actions и tests.
Не добавляй pagination, next-bidder, новое окно оплаты или редизайн в эту задачу.

Добавь table-driven tests минимум для Listing CANCELLED без Order; один cancelled Order;
cancelled + replacement/current Order; несколько rows в разном входном порядке;
CONTACTED; HANDOFF_FAILED; completed; ordinary outbid. Два массива с одинаковыми
данными в разном порядке должны давать один status/link.

Запусти relevant unit/contract tests, typecheck, lint и affected builds. PostgreSQL
tests, если понадобятся, запускай вне sandbox. Обнови PROJECT-STATUS и design status
только по факту. Не меняй protected docs, Figma и .pen.

Создай ветку fix/activity-projection. Один commit:
fix issue:

* fixed cancelled auction activity status
* made order projection deterministic
* added activity state coverage

Верни ровно:
1. Outcome and commit coordinates.
2. Projection priority as a short truth table.
3. Changed files.
4. Exact checks/results.
5. Cases proved.
6. Deferred scope.
7. Remaining risks.
8. Diff stat/diff-check.
9. Confirmation protected assets untouched.
```

## Критерии готовности

- Отмена торгов имеет отдельное правдивое состояние и copy.
- Результат не зависит от порядка Orders из Prisma/fixture.
- Ссылка появляется только при разрешённом detail route.
- Старые честные статусы не регрессировали; shared/mobile contracts согласованы.

## Prompt проверки в новом чате Codex

```text
Review-only. Проверь Task 05 по
docs/tasks/2026-09-06-reconciliation/05-ACTIVITY-PROJECTION.md. Код не исправляй.
Перемешай Order fixtures мысленно и тестом, проверь priority, links, shared schema и
mobile labels для всех statuses. Верни ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО; findings P0–P3
с file:line; missing cases; exact checks; correction prompt.
```
