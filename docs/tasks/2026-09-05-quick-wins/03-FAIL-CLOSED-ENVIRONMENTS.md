# QW-03 — fail-closed environment matrix

Общий аудит: [`../../audits/2026-09-05-MVP-RECONCILIATION-AND-TASKS.md`](../../audits/2026-09-05-MVP-RECONCILIATION-AND-TASKS.md), пункт 6.14.

## Prompt исполнителю

```text
Repository: bidplace. Выполни только QW-03: production environment должен fail closed.

Branch: fix/fail-closed-env.

Подтверждённое правило: APP_ENV=production включает production security/config requirements независимо от NODE_ENV. Комбинации APP_ENV=production + NODE_ENV=development|test запрещены. Local development/test paths должны остаться рабочими только в явных local/test profiles. Поведение staging не расширяй и не меняй без существующего канонического правила.

Используй security skill. До edit составь матрицу NODE_ENV × APP_ENV для production profile и связанных TEST_EMAIL_BYPASS/destructive seed/SMTP/service rules/CORS/JWT guards. Найди все guards, которые смотрят только NODE_ENV. Сравни central profile predicate, scattered conditions и silent fallback; выбери centralized fail-closed validation.

Implementation:
- centralize production-like/profile predicates;
- invalid combinations reject during env parsing/bootstrap with stable field-specific messages;
- production secrets/SMTP/rules/reset URL and bypass prohibitions применяются по confirmed profile;
- существующее staging behavior не менять без отдельного owner rule;
- не печатай и не открывай .env/secrets;
- не меняй business logic, deployment provider или design;
- update APPLICATION-SECURITY/ARCHITECTURE/PROJECT-STATUS только по факту.

Tests:
- parameterized full environment matrix with positive and negative cases;
- regression APP_ENV=production + NODE_ENV=development/test;
- regression production test bypass and seed rejection;
- local development and NODE_ENV=test+APP_ENV=local remain valid as intended;
- affected API/config unit tests, typecheck/lint/build.

Commit:
fix issue:

* fixed production environment validation
* changed security profile guards
* added environment matrix coverage

Ответ: outcome; branch/SHA/base; matrix before/after; files/diff stat; exact checks/results; docs; risks; no secrets read/printed; no Figma/.pen/untracked changes.
```

## Критерии готовности

- `APP_ENV=production` невозможно запустить с non-production `NODE_ENV`.
- Все bypass/seed возможности fail closed при `APP_ENV=production`.
- Нет scattered противоречащих predicates.
- Positive local/test paths сохранены и покрыты.
- Никакие secrets не читались и не попали в output/diff.

## Prompt проверки в новом чате Codex

```text
Review QW-03 по docs/tasks/2026-09-05-quick-wins/03-FAIL-CLOSED-ENVIRONMENTS.md. Review-only, используй review + security skills. Не открывай .env. Проверь base..SHA, полную env matrix, все NODE_ENV-only guards, mail/rules/reset/bypass/seed behavior и отсутствие production-like silent fallback.

Верни ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО, findings P0–P3 с files/lines, пропущенные matrix cases, checks evidence и correction prompt.
```
