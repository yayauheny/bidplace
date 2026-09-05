# Task 07 — admin moderation без загрузки photo blob

## Кому дать

- Исполнитель: GPT Luna.
- Независимая проверка: GPT Terra.
- Приоритет: P2, маленькая локальная задача.

## Prompt исполнителю

```text
Repository: bidplace. Base branch: fix/mvp-reconciliation-review.

Убери последний известный случай чтения полного SellerProfile photo blob ради проверки
наличия фото в admin approval. Прочитай AGENTS.md, обязательные docs, stack review и этот
task. Примени nest и security, поскольку меняется admin moderation read path.

До правок напиши success criteria и сравни решения. Предпочтение: использовать уже
сохранённые metadata (`profilePhotoByteLength` и необходимые существующие признаки) в
узком Prisma select. Не добавляй новый storage abstraction, HEAD request или schema
column без доказанной необходимости. Поведение approval и ошибки должны сохраниться:
профиль без валидного загруженного фото нельзя одобрить.

Проверь все caller/select/mapper types. Добавь tests, которые доказывают:
- approval query не выбирает `profilePhotoData`;
- positive byte length проходит прежнюю requirement;
- null/zero length отклоняются тем же business error;
- response/audit не раскрывает storage metadata;
- другие moderation requirements не изменились.

Запусти targeted unit tests, API typecheck, lint и build. DB tests, если нужны, запускай
вне sandbox. Обнови PROJECT-STATUS только если там есть соответствующий residual.
Не меняй Figma, .pen, protected docs и object-storage roadmap.

Создай ветку fix/admin-photo-metadata. Один commit:
fix issue:

* removed admin profile photo blob hydration
* preserved seller approval validation
* added narrow select coverage

Верни ровно:
1. Outcome and commit coordinates.
2. Before/after query shape.
3. Changed files.
4. Exact checks/results.
5. Behavior parity evidence.
6. Remaining storage risks.
7. Diff stat/diff-check.
8. Confirmation protected assets untouched.
```

## Критерии готовности

- Admin approval path не выбирает и не загружает `profilePhotoData`.
- Проверка наличия фото остаётся server-side и не ослаблена.
- Нет изменения API, privacy или approval semantics.
- Typecheck/lint/tests/build проходят.

## Prompt проверки в новом чате Codex

```text
Review-only. Проверь Task 07 по
docs/tasks/2026-09-06-reconciliation/07-ADMIN-PHOTO-METADATA.md. Код не исправляй.
Проследи Prisma select до approval requirement, найди все profilePhotoData reads в admin
paths, проверь zero/null behavior и tests. Верни ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО;
findings P0–P3 с file:line; checks; correction prompt.
```
