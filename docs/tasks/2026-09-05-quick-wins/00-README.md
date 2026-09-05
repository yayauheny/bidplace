# Приоритетные независимые задачи — 2026-09-05

Эти четыре задачи можно выполнять уже сейчас на Grok 4.6 High. Они не требуют завершённого Figma, fixed-price domain model или юридического заключения.

Источник общей сверки: [`../../audits/2026-09-05-MVP-RECONCILIATION-AND-TASKS.md`](../../audits/2026-09-05-MVP-RECONCILIATION-AND-TASKS.md).

## Порядок

Задачи независимы и выполняются в отдельных ветках:

| ID | Файл | Ветка | Риск пересечения |
|---|---|---|---|
| QW-01 | [`01-HTTPS-PUBLIC-LINKS.md`](01-HTTPS-PUBLIC-LINKS.md) | `fix/https-public-links` | Низкий |
| QW-02 | [`02-ACTIVITY-STATUSES.md`](02-ACTIVITY-STATUSES.md) | `fix/activity-statuses` | Низкий |
| QW-03 | [`03-FAIL-CLOSED-ENVIRONMENTS.md`](03-FAIL-CLOSED-ENVIRONMENTS.md) | `fix/fail-closed-env` | Низкий |
| QW-04 | [`04-REJECTED-PRODUCT-RECOVERY.md`](04-REJECTED-PRODUCT-RECOVERY.md) | `fix/rejected-product-recovery` | Средний: Product moderation/UI |

QW-01, QW-02 и QW-03 можно запускать параллельно. QW-04 также не зависит от них, но требует внимательной проверки moderation audit и повторной отправки.

## Общие правила

- Перед работой прочитать root `AGENTS.md`, `docs/product/00-PROJECT-INDEX.md`, `01-PRODUCT-FOUNDATION.md`, `05-MVP-RFC.md`, `10-CODE-ARCHITECTURE.md`, `11-PROJECT-STATUS.md`, `12-DECISION-LOG.md` и owner docs конкретной задачи.
- До edit перечислить проблему, варианты с метками `durable fix`, `acceptable workaround`, `hack`, сравнить trade-offs и выбрать durable fix.
- Не изменять Figma, `.pen`, legal drafts, unrelated code или будущие функции.
- Один prompt — одна ветка и один commit. Не объединять четыре задачи.
- Поведение покрыть meaningful tests. Запустить точечные tests, affected typecheck/lint/build. Integration/E2E выполнять только в среде, где PostgreSQL/Prisma доступны; невозможность запуска честно указать, не объявлять успехом.
- После code behavior update обновить `docs/product/11-PROJECT-STATUS.md`; architecture менять только при изменении границ/contracts/persistence.
- Перед commit проверить `git diff --check`, `git status --short` и отсутствие `.pen` в diff.
- Не добавлять существующие untracked design-файлы.

## Как проверять результат в новом чате Codex

После выполнения открыть новый чат в том же repository и передать:

1. путь к task-файлу;
2. SHA результата и base SHA;
3. полный ответ исполнителя;
4. следующий prompt:

```text
Проверь выполнение задачи по указанному task-файлу и общему аудиту docs/audits/2026-09-05-MVP-RECONCILIATION-AND-TASKS.md. Это review-only: не исправляй код, пока я отдельно не попрошу.

Прочитай AGENTS.md и используй review skill; для security-sensitive задачи также security skill. Проверь реальный diff base..SHA, затронутые contracts/schema/API/UI/docs/tests и не доверяй отчёту исполнителя без evidence.

Ответ начни одним статусом: ГОТОВО, ЧАСТИЧНО или НЕ ГОТОВО. Затем перечисли findings по приоритету P0–P3 с точными файлами/строками, пропущенные критерии готовности, фактически выполненные проверки и риски. Если findings нет, явно напиши это. В конце дай короткий следующий prompt исполнителю только для исправления найденных недостатков.
```

Каждый task-файл ниже содержит более точную версию review prompt для своей области.
