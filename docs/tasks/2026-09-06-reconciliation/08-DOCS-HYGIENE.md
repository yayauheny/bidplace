# Task 08 — механическая гигиена документации

## Кому дать

- Исполнитель: Grok Composer 2.5.
- Независимая проверка: GPT Luna.
- Приоритет: P2; выполнять после слияния текущего reconciliation docs checkpoint.

## Prompt исполнителю

```text
Repository: bidplace. Docs-only. Base branch: fix/mvp-reconciliation-review.

Выполни только механическую гигиену документации. Прочитай AGENTS.md, docs/product/
00-PROJECT-INDEX.md, 01-PRODUCT-FOUNDATION.md, 11-PROJECT-STATUS.md, 12-DECISION-LOG.md,
docs/tasks/2026-09-06-reconciliation/00-MASTER-BACKLOG.md и этот task.

До правок выдай inventory и success criteria. Найди:
- trailing whitespace/invalid Markdown links;
- явно устаревшие `Last updated` относительно истории самого файла;
- документы, которые выглядят current, хотя уже имеют named successor;
- повторённые claims, которым не хватает короткой ссылки на owner;
- broken repository-relative links после прошлых reorganizations.

Разрешено: whitespace, точечные даты с evidence из git history, исправление paths,
короткий banner «superseded/historical; current owner: link», index pointer. Запрещено:
переписывать product/legal conclusions, удалять/переименовывать файлы, изменять raw
research, transcript, protected product docs по смыслу, DEC entries, Figma, .pen и app
code. Не превращай задачу в нормализацию всей документационной архитектуры T27.

Для каждого non-whitespace edit в результате укажи source of truth и почему это
механическое исправление. Запусти `git diff --check`, repository link check если он уже
есть, и targeted `rg` for stale paths. Не запускай app tests: behavior не меняется.

Создай ветку fix/docs-hygiene. Один commit:
fix issue:

* cleaned documentation formatting
* repaired stale repository links
* marked superseded references

Верни ровно:
1. Outcome and commit coordinates.
2. Files changed grouped as whitespace/date/link/banner.
3. For each semantic-looking line, owner/source justification.
4. Exact static checks/results.
5. Items deliberately deferred to T27.
6. Diff stat and diff-check.
7. Confirmation no claims, raw sources, code, Figma or .pen changed.
```

## Критерии готовности

- `git diff --check` чист.
- Нет broken internal links в затронутом наборе.
- Старый документ не выдаётся за current, если successor уже определён.
- Ни одно решение, юридическое утверждение или raw source не переписано.
- Diff остаётся небольшим и полностью объяснимым.

## Prompt проверки в новом чате Codex

```text
Review-only. Проверь Task 08 по
docs/tasks/2026-09-06-reconciliation/08-DOCS-HYGIENE.md. Код не исправляй.
Сравни каждую изменённую строку: mechanical ли она, не переписан ли product/legal claim,
не изменены ли protected/raw files по смыслу. Проверь links и `git diff --check`.
Верни ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО; findings P0–P3; список suspicious semantic edits;
correction prompt.
```
