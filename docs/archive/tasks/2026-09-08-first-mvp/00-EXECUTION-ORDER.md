# bidplace — восемь пакетов до первого public MVP

Дата: 2026-09-08
Контракт: [`docs/product/05-MVP-RFC.md`](../../product/05-MVP-RFC.md)
Текущий backlog: [`00-FIRST-MVP-BACKLOG.md`](../2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md)
После MVP: [`99-POST-MVP-BACKLOG.md`](../2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md)

Эти файлы — готовые промты для отдельных задач. Они объединяют пятнадцать строк
канонического backlog в восемь проверяемых пакетов, ничего не удаляя.

Выбран **durable** формат: отдельный self-contained prompt на пакет плюс общий порядок
и единый review contract. Один огромный prompt был бы приемлемым workaround, но мешал
бы независимым branches и review. Хранить промты только в чате было бы хрупко: их
невозможно версионировать и сверять с RFC.

| Пакет                                     | Строки backlog     | Результат                                           | Когда запускать                 |
| ----------------------------------------- | ------------------ | --------------------------------------------------- | ------------------------------- |
| [01](01-COMMERCE-CAPABILITY-GATE.md)      | F01                | Commerce выключен fail-closed, код сохранён         | первым                          |
| [02](02-PORTFOLIO-WORK-LIFECYCLE.md)      | F02                | Work/revision/moderation contract реализован        | параллельно с 01                |
| [03](03-OBJECT-STORAGE-MEDIA.md)          | F03                | Медиа вынесены в S3-compatible storage              | после фиксации lifecycle schema |
| [04](04-DATA-SECURITY-PREFLIGHT.md)       | F04, F05, F06, F07 | Inventory, role freshness, HTTPS, security evidence | параллельно с 01–02             |
| [05](05-PORTFOLIO-CONTRACTS-AND-API.md)   | F08, F09, F10      | Author, Work и discovery API соответствуют RFC      | после 01–04                     |
| [06](06-PORTFOLIO-LEGAL-PACK.md)          | F11                | Portfolio-only legal pack готов к проверке юристом  | после inventory из 04           |
| [07](07-FIGMA-STACK-AND-UI.md)            | F12–F13            | Figma прочитан, stack проверен, UI реализован       | после 01–06                     |
| [08](08-PUBLIC-PILOT-AND-FINAL-REVIEW.md) | F14–F15            | Go/no-go evidence без самостоятельного deploy       | последним                       |

## Общий порядок передачи агентам

1. Каждую задачу начинать от актуальной локальной ветки `main`; ветку `master` не
   создавать. Перед своей feature/fix branch агент обязан проверить clean tree,
   записать SHA `main` и использовать его как Base SHA.
2. Одна задача — одна короткоживущая ветка. Не давать двум агентам одновременно менять
   Prisma schema, contracts или одни и те же owner-документы.
3. После выполнения не merge. Сначала передать отчёт, SHA и diff на review.
4. После принятого review обновить base для следующей зависимой задачи.
5. Все PostgreSQL integration/e2e проверки запускать вне sandbox и только против
   disposable test database.
6. Никогда не читать и не печатать `.env`, credentials, токены, сертификаты или
   реальные пользовательские данные.
7. Не менять ни один `.pen` файл. Figma в задаче 07 — read-only.

## Общий Definition of Done

- поведение совпадает с RFC 2.0 и `DEC-082`–`DEC-084`;
- commerce-код сохранён, но недоступен при default configuration;
- публичные страницы работают без регистрации и без Listing/price/timer/Bid/Order;
- автор проходит application → Work draft → moderation → publication;
- изображения, public/private projections и permissions fail-closed;
- юридические тексты описывают фактический portfolio flow;
- UI проверен на 390, 1024 и 1440 px и не содержит мёртвых controls;
- `pnpm verify`, релевантный Playwright и release drills имеют приложенные результаты;
- финальный пакет 08 выдаёт конкретный go/no-go, но ничего не развёртывает сам.

## Формат, который возвращает каждый исполнитель

```text
Result: implemented | partially implemented | blocked
Base SHA:
Branch:
Commit(s):
Changed behavior:
Changed files:
Database/API migrations:
Verification commands and exact results:
Diff summary:
Remaining risks/manual checks:
Documentation status updates:
git status --short:
```

Если задача blocked, агент всё равно должен вернуть доказательство блокера, безопасно
завершённую независимую часть и минимальный вопрос, без которого нельзя продолжить.

## Промт для review после каждого пакета

После ответа исполнителя передай reviewer следующий текст вместе с полным отчётом:

```text
Проведи review результата пакета <NN> первого portfolio MVP bidplace. Работай
review-only: не меняй код, не merge и не создавай PR. Проверь указанный Base SHA,
branch и commits против соответствующего prompt в
docs/tasks/2026-09-08-first-mvp/, AGENTS.md, docs/product/05-MVP-RFC.md и актуальных
owner docs. Сначала выведи findings P0–P3 с точными file/line, trigger, impact и
minimal durable fix. Затем проверь claims исполнителя по diff и тестовым evidence,
отдельно отметь missing tests, documentation overclaims, public/private leaks,
commerce leakage и изменения .pen. В конце дай verdict ACCEPT / ACCEPT WITH FOLLOW-UP /
REJECT, список обязательных исправлений и что именно надо перепроверить после них.
Не считать отчёт исполнителя доказательством без просмотра commit diff.
```
