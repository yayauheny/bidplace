# Промт 02 — lifecycle и revision-модель portfolio Work

Рекомендуемый исполнитель: сильный NestJS/PostgreSQL агент.
Обязательные skills: `nest` и `security`.
Ветка: `feature/portfolio-work-lifecycle`.

## Готовый промт

Ты работаешь в `/Users/yayauheny/projects/bidplace`. Реализуй пакет F02: независимый
от продаж lifecycle Work с повторной модерацией, при которой последняя одобренная
версия остаётся публичной, пока новая revision проверяется. Не merge и не создавай PR.

### Цель и критерии успеха до реализации

До кода сформулируй state machine, invariants, permissions и критерии успеха. Нужно
получить:

- `Draft → Pending review → Published`, ветки `Changes requested` и `Rejected`, а также
  `Published ↔ Hidden` согласно RFC §9;
- публично видна только последняя approved revision опубликованного Work;
- редактирование существенных публичных полей опубликованной работы создаёт/обновляет
  pending revision и не меняет текущую публичную версию;
- rejection/changes-requested не снимает предыдущую approved версию;
- hide немедленно закрывает public visibility, unhide возвращает только approved data;
- owner и admin видят нужный moderation context, посетитель не видит drafts/revisions;
- race edit/submit/moderate/hide решён транзакциями, locks/versions и DB constraints;
- Work не зависит от Listing, Bid или Order.

### Обязательное чтение и inventory

Прочитай обязательный пакет AGENTS, RFC, `DEC-082`–`DEC-084`, architecture, security,
status и audit. Проверь реальную Prisma schema и migrations, `products`, `images`,
`sellers`, `admin-moderation`, public visibility, mappers, contracts/api-client и tests.
Текущий `ProductStatus.ARCHIVED` нельзя молча переименовать: составь data migration и
API compatibility plan, который не возвращает public `Архив`.

### Сравнение решений

- **Durable fix:** immutable approved snapshot/revision и отдельный current editing
  revision с атомарным publish pointer или эквивалентным доказуемым invariant.
- **Acceptable workaround:** версионированная snapshot-колонка на Work, если она
  сохраняет все public поля, изображения/cover и moderation evidence атомарно и не
  блокирует будущую нормализацию.
- **Hack:** менять live row in-place, копировать её частично, скрывать Published на
  каждом edit или доверять client status — запрещено.

Выбери простейший durable вариант после сравнения migration complexity, query cost,
image ownership, audit trail и future evolution. Если точная модель противоречит
существующему подтверждённому contract, останови только конфликтующую часть и верни
один конкретный founder decision; остальное продолжай.

### Реализация

1. Запиши короткий technical contract с таблицей states/transitions, author/admin
   actions, material fields и visibility outcome.
2. Добавь additive Prisma migration. Не редактируй старые migration files.
3. Держи controllers тонкими; state machine и transactional invariant размести в
   service/domain boundary. Все moderation decisions должны иметь audit evidence.
4. Адаптируй owner/admin/public queries и contracts. Не добавляй sale semantics.
5. Определи material fields: title, category, details, story, public images/cover и
   author-visible attribution относятся к revision. Технические timestamps/status не
   должны случайно публиковать draft.
6. Реализуй submit/resubmit/request-changes/reject/approve/hide/unhide и идемпотентное
   поведение повторных запросов там, где это требуется.

### Не входит

Не реализуй UI wizard, object storage, auctions, prices, buyer flows и новый дизайн.
Не удаляй commerce history/schema. Не меняй `.pen` или Figma.

### Tests и проверки

Обязательны unit и PostgreSQL integration tests:

- draft и pending никогда не public;
- first approve публикует точную revision;
- edit опубликованного Work оставляет старую approved revision public;
- approve атомарно меняет public revision;
- request changes/reject сохраняет старую public revision;
- hide/unhide; owner/admin/visitor permissions;
- конкурентные edit vs submit, approve vs edit, hide vs public read;
- invalid transition, repeated action и stale revision;
- image/cover reference не может перескочить между Work/user.

Выполни:

```bash
pnpm db:generate
pnpm --filter @bidplace/database build
pnpm --filter @bidplace/contracts test
pnpm --filter @bidplace/contracts typecheck
pnpm --filter @bidplace/api test
pnpm --filter @bidplace/api test:integration
pnpm --filter @bidplace/api typecheck
pnpm --filter @bidplace/api lint
pnpm build
```

### Документация и Git

Обнови `10-CODE-ARCHITECTURE.md`, `11-PROJECT-STATUS.md` и только фактически
изменившиеся flow/status docs. Не меняй protected product contract. `.pen` diff пуст.
Допустимы два reviewable commit: сначала contract/schema, затем behavior/tests. Формат
каждого:

```text
implement feature:

* changed portfolio work lifecycle
* added moderated revision persistence
* updated lifecycle verification
```

Верни формат из `00-EXECUTION-ORDER.md`, state/permission matrix, migration rollback
limits и точное доказательство поведения public revision.
