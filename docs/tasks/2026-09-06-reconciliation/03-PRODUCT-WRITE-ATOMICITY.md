# Task 03 — атомарность изменений Work/Product

## Кому дать

- Исполнитель: Grok 4.6 High.
- Независимая проверка: GPT-5.6 Sol с навыками `review` и `security`.
- Приоритет: P0, выполнить первым.

## Prompt исполнителю

```text
Repository: bidplace. Base branch: fix/mvp-reconciliation-review.

Исправь только race condition между изменениями Work/Product, submit на модерацию,
решением модератора и блокирующим Listing. Прочитай AGENTS.md, обязательные product
docs из него, docs/audits/2026-09-06-IMPLEMENTATION-STACK-REVIEW.md и этот task.
Примени навыки nest и security.

До правок напиши в commentary:
1. success criteria;
2. полный список write paths для Product, его media и creation story;
3. candidate fixes с метками durable fix / acceptable workaround / hack;
4. выбранный durable fix и его transaction/concurrency invariant.

Проблема: часть методов сначала читает status/Listings, а затем отдельно пишет.
Concurrent submit, moderation или создание блокирующего Listing может пройти между
check и mutation. Инвариант: DRAFT и REJECTED можно менять только при отсутствии
SCHEDULED/LIVE Listing; PENDING_REVIEW и APPROVED нельзя менять. Проверка права,
актуального статуса, блокирующего Listing и сама запись должны быть связаны одной
атомарной database operation/serializable transaction. Дорогую обработку изображения
можно выполнить до transaction, но перед persistence обязательно повторить guard
внутри transaction.

Обязательно обследуй:
- ProductsService.create/update/submit;
- replaceCreationStory и reorderCreationSteps;
- ImagesService add/remove/reorder;
- add/remove/reorder creation-step media и все controller routes к ним;
- admin moderation paths, меняющие Product status;
- Listing creation/activation, если именно там появляется edit lock.

Сохрани существующие публичные ошибки и API contracts либо сделай одно согласованное
business error для конфликта состояния. Не добавляй глобальный mutex, in-memory lock,
sleep/retry loop, any, @ts-ignore, silent fallback или новую зависимость без доказанной
необходимости. Не реализуй portfolio/fixed sale/offers и не меняй product decisions.

Нужны meaningful tests:
- последовательные unit tests для всех guarded write families;
- PostgreSQL integration races, синхронизированные barrier/hook или эквивалентом,
  где write конкурирует с submit/moderation/listing lock;
- после race разрешён ровно один допустимый итог: поздняя запись не меняет locked
  Product, нет частично записанных media/story и нет orphaned object-store record;
- проверка REJECTED remains editable и resubmit работает.

Tests PostgreSQL запускай сразу вне sandbox. Не повторяй известный sandbox failure.
Запусти affected unit/integration tests, API typecheck, lint без auto-fix, затем
релевантный build. Обнови docs/product/11-PROJECT-STATUS.md; architecture doc меняй
только если реально изменён долгоживущий invariant. Не меняй protected product docs,
Figma и любые .pen files. Проверь `git diff --name-only` и `git diff --check`.

Создай ветку fix/product-write-atomicity. Один логический commit; migration выноси
во второй commit только если она действительно нужна. Commit format:
fix issue:

* fixed atomic product write guards
* added concurrent persistence coverage
* updated implementation status

Верни ровно:
1. Outcome: complete / partial / blocked.
2. Branch, base SHA, commit SHA(s).
3. Reproduced race and chosen invariant.
4. Changed files with one-line purpose each.
5. Tests/checks with exact commands and pass/fail counts.
6. Concurrency cases proved and cases not proved.
7. API/DB/error-contract changes.
8. Remaining risks.
9. Diff stat and `git diff --check` result.
10. Confirmation protected docs, Figma and .pen untouched.
```

## Критерии готовности

- Каждый Product/media/story write повторяет state and Listing guard атомарно с записью.
- Submit/moderation/Listing lock нельзя обойти конкурентной записью.
- Object-store и database не расходятся при проигранной гонке.
- Есть настоящие PostgreSQL race tests, а не только последовательные mocks.
- Все релевантные проверки проходят, статус проекта обновлён, `.pen` отсутствует в diff.

## Prompt проверки в новом чате Codex

```text
Review-only. Код не исправляй. Проверь результат Task 03 по
docs/tasks/2026-09-06-reconciliation/03-PRODUCT-WRITE-ATOMICITY.md.
Используй review + security. Сверь весь commit/diff с base SHA, все Product/media/
creation-story write paths, границы Prisma transactions, object-store rollback и
реальность PostgreSQL race tests. Попытайся построить interleavings update↔submit,
media↔moderation и story↔Listing lock. Запусти указанные проверки вне sandbox.
Верни ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО; findings P0–P3 с file:line; непокрытые races;
проверки; и готовый correction prompt. Ничего не коммить.
```
