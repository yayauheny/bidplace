# QW-01 — HTTPS-only публичные ссылки

Общий аудит: [`../../audits/2026-09-05-MVP-RECONCILIATION-AND-TASKS.md`](../../audits/2026-09-05-MVP-RECONCILIATION-AND-TASKS.md), пункты 6.21 и P0-D.

## Prompt исполнителю

```text
Repository: bidplace. Выполни только QW-01: сделай публичные ссылки автора HTTPS-only.

Branch: fix/https-public-links.

Контекст: packages/contracts/src/seller-profile.ts использует общий z.string().url(), который допускает нежелательные schemes. Подтверждённое правило: public socialLink/websiteUrl/telegramUrl/instagramUrl принимают только https:// URLs. Существующие формы @username для Telegram/Instagram остаются допустимыми там, где их уже поддерживает отдельная schema. http:, javascript:, data:, file: и любые другие URL schemes запрещены. Handoff PHONE и другие private contacts вне scope.

До edit:
1. Прочитай AGENTS и owner docs.
2. Найди все write/response schemas и UI validation, использующие public URLs.
3. Сравни durable shared HTTPS schema, локальный refine и UI-only validation. Выбери shared contract schema как durable fix, если repository evidence не опровергает.

Implementation:
- создай один reusable HTTPS URL contract без unsafe coercion;
- используй его во всех public seller URL write/response fields;
- сохрани специальные @handle forms;
- ошибки должны быть field-local и понятными;
- не меняй дизайн, private handoff, auth или URL resolution media;
- обнови PROJECT-STATUS фактическим evidence.

Tests/verification:
- contract parameterized tests: https accepted; http/javascript/data/file/relative rejected;
- existing Telegram/Instagram handle cases pass;
- affected contracts, API and mobile tests/typecheck/lint/build;
- git diff --check; no .pen/unrelated files.

Commit:
fix issue:

* fixed public profile link schemes
* changed shared url validation
* added unsafe scheme coverage

Ответ строго:
1. Outcome: complete/partial/blocked.
2. Branch and commit SHA; base SHA.
3. Before/after behavior.
4. Changed files + diff stat.
5. Tests: exact command and result.
6. Docs/status update.
7. Remaining risks or none.
8. Confirmation that Figma/.pen and unrelated untracked files were untouched.
```

## Критерии готовности

- Все public profile URLs принимают только HTTPS.
- Handles продолжают работать по прежнему контракту.
- Server contract является источником истины; UI не расходится с ним.
- Есть отрицательные tests по всем запрещённым schemes.
- Нет изменений private handoff и design sources.

## Prompt проверки в новом чате Codex

```text
Review QW-01 по docs/tasks/2026-09-05-quick-wins/01-HTTPS-PUBLIC-LINKS.md и аудиту docs/audits/2026-09-05-MVP-RECONCILIATION-AND-TASKS.md. Base и SHA, а также отчёт исполнителя приложены ниже. Review-only.

Используй review + security skills. Проверь diff, все public seller URL schemas, handle compatibility, server/client parity и отрицательные tests. Ищи обход через alternate write schema, nullable field, response schema или UI normalization.

Начни: ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО. Затем findings P0–P3 с файлами/строками, невыполненные DoD, evidence checks и короткий correction prompt.
```
