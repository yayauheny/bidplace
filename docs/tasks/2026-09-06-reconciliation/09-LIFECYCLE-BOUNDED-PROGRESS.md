# Task 09 — доказательство bounded lifecycle progress

## Кому дать

- Исполнитель: GPT Terra.
- Независимая проверка: GPT-5.6 Sol.
- Приоритет: P2; диагностическая задача, queue topology не выбирать.

## Prompt исполнителю

```text
Repository: bidplace. Base branch: fix/mvp-reconciliation-review.

Докажи текущую batch semantics ListingLifecycleService и точно зафиксируй residual
poison-prefix risk. Прочитай AGENTS.md, обязательные docs, stack review и этот task.
Примени nest. Код production меняй только если тест обнаружит узкий deterministic bug;
не проектируй queue, distributed lock, skip-locked или retry architecture в этой задаче.

До кода опиши три independent phases/ticks, ordering, batch size, captured `now`, error
isolation и success criteria. Нужна проверка `51 → 50 + 1` для каждого релевантного
bounded selector: первый run обрабатывает ровно первые 50 в стабильном порядке, второй
run достигает 51-й. Убедись, что fixture действительно создаёт 51 eligible database row,
а assertion не повторяет mock implementation.

Дополнительно создай короткий dated evidence section в существующем test/result doc или
PROJECT-STATUS: количество queries/rows на tick, что именно ограничено, и воспроизводимый
сценарий, где постоянно падающие первые rows могут скрыть хвост. Не объявляй starvation
решённым. Не используй wall-clock benchmark как гарантию; если измеряешь duration,
пометь environment-specific.

Tests PostgreSQL запускай вне sandbox. Запусти targeted lifecycle unit/integration tests,
API typecheck/lint/build. Проверь повторный run/idempotency и single-row failure isolation.
Не меняй product decisions, Figma и .pen.

Создай ветку fix/lifecycle-progress-proof. Один commit:
fix issue:

* proved bounded lifecycle batch progress
* covered follow-up processing beyond batch limit
* documented poison-prefix residual

Верни ровно:
1. Outcome and commit coordinates.
2. Selector/phase matrix with batch and ordering.
3. Changed files.
4. Exact checks and pass counts.
5. Evidence for 51→50+1 and idempotency.
6. Poison/starvation scenario still open.
7. Any production change and why it was unavoidable.
8. Diff stat/diff-check.
9. Confirmation no queue topology decision or protected asset change.
```

## Критерии готовности

- Реальные tests доказывают batch boundary и достижение 51-й записи следующим run.
- Stable ordering и per-row isolation проверены.
- Poison-prefix starvation назван residual, без ложного статуса «решено».
- Новая инфраструктурная архитектура не введена.

## Prompt проверки в новом чате Codex

```text
Review-only. Проверь Task 09 по
docs/tasks/2026-09-06-reconciliation/09-LIFECYCLE-BOUNDED-PROGRESS.md. Код не исправляй.
Убедись, что tests создают 51 реальную eligible row, доказывают ровно 50+1 для каждого
selector, stable order/idempotency и не маскируют starvation. Запусти DB tests вне
sandbox. Верни ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО; findings P0–P3; false-positive test risks;
remaining operations decision; correction prompt.
```
