# Task 06 — preflight legacy HTTP-ссылок

## Кому дать

- Исполнитель: GPT Luna или Terra.
- Независимая проверка: GPT-5.6 Sol с `security`.
- Приоритет: P1 до public deploy.

## Prompt исполнителю

```text
Repository: bidplace. Base branch: fix/mvp-reconciliation-review.

Закрой compatibility gap после введения HTTPS-only schema для публичных profile links.
Прочитай AGENTS.md, обязательные product/security/architecture docs, stack review и task.
Примени nest + security. Не читай и не печатай .env, URLs пользователей или PII.

До кода перечисли четыре затронутых поля, write/read schemas, current seed/fixtures,
success criteria и варианты:
- durable fix: repeatable preflight с aggregate-only отчётом, blocking exit code и
  явной remediation policy;
- acceptable workaround только если доказан одноразовый pre-public empty database;
- hack: silent `http`→`https`, response fallback или ослабление schema — запрещён.

Реализуй безопасный release preflight, который на выбранной database считает legacy
`http:`/otherwise invalid public URL rows по полям, не выводит сами значения и падает
ненулевым code при проблеме. Команда должна быть документирована и подключена к
релевантному release/migration checklist. Для remediation опиши только проверяемые
варианты: owner исправляет значение; оператор очищает optional field с audit; required
field возвращает профиль в исправление по согласованной процедуре. Не повышай protocol
автоматически: host может не поддерживать TLS. Не меняй real/prod data.

Если repository уже имеет migration/preflight framework, используй его. Не создавай
параллельную script architecture. Если нужен Prisma command, не загружай полную строку
в память/лог без причины. Не записывай реальные IDs/URLs в committed fixtures.

Tests:
- disposable PostgreSQL: all HTTPS => exit 0/zero counts;
- legacy HTTP в каждом поле => nonzero exit и только aggregate field counts;
- malformed/non-HTTP values, если DB constraint позволяет;
- output не содержит test URL, handle, user ID or PII;
- повторный запуск детерминирован и не мутирует данные.

Запускай DB tests вне sandbox. Выполни relevant tests, API typecheck/lint/build и сам
preflight на disposable/local DB без показа данных. Обнови PROJECT-STATUS и runbook.
Не меняй protected product docs, Figma или .pen.

Создай ветку fix/https-url-preflight. Один commit:
fix issue:

* added legacy public url preflight
* documented explicit remediation policy
* added non-mutating database coverage

Верни ровно:
1. Outcome and commit coordinates.
2. Fields/contracts inspected.
3. Preflight command and safe output example.
4. Changed files.
5. Exact checks/results.
6. Proof it is non-mutating and PII-safe.
7. Current local aggregate result without values.
8. Remaining operator action/public deploy gate.
9. Diff stat/diff-check.
10. Confirmation no real data, secrets, Figma or .pen touched.
```

## Критерии готовности

- Preflight покрывает все поля, которые strict response schema может отклонить.
- Он non-mutating, repeatable, aggregate-only и блокирует deploy при legacy data.
- Silent protocol coercion и schema weakening отсутствуют.
- Есть disposable PostgreSQL evidence и понятный operator remediation path.

## Prompt проверки в новом чате Codex

```text
Review-only + security. Проверь Task 06 по
docs/tasks/2026-09-06-reconciliation/06-HTTPS-LEGACY-PREFLIGHT.md. Код не исправляй.
Сверь все URL fields и read/write schemas, запусти preflight на disposable DB с HTTPS
и HTTP fixtures вне sandbox, проверь exit codes, отсутствие mutations/PII/secrets в
output и release integration. Верни ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО; findings P0–P3;
missed fields; correction prompt.
```
