# Промт 04 — data inventory и security preflight

Рекомендуемый исполнитель: security-minded full-stack агент.
Обязательный skill: `security`; для backend fixes также `nest`.
Ветка: `fix/portfolio-security-preflight`.

## Готовый промт

Ты работаешь в `/Users/yayauheny/projects/bidplace`. Закрой F04, F05, F06 и F07 четырьмя
последовательными фазами: factual data/provider/cookie inventory; JWT role freshness;
legacy HTTPS preflight; evidence-based dependency/application security review. Не
merge и не создавай PR. Не смешивай найденный, но не исправленный риск со статусом
`Implemented`.
Начни с clean актуальной `main`, запиши её SHA и создай указанную fix branch.

### Общая цель и критерии успеха

До изменений сформулируй threat model, practical plan и критерии успеха:

- data map описывает только наблюдаемые поля, storage, recipients, processors,
  countries, cookies, retention и delete behavior; неизвестное помечено `UNKNOWN`;
- ban, role/capability downgrade и session revoke действуют без ожидания expiry старого
  access token;
- strict HTTPS validation не ломает целый public object из-за legacy value и не
  разрешает unsafe schemes;
- security/dependency findings имеют severity, exploit condition, code evidence,
  existing mitigations и минимальное durable решение;
- подтверждённые launch blockers исправлены и покрыты tests; остальные заведены как
  reviewable backlog, без массового dependency update;
- ни один secret, `.env`, реальная строка DB или PII не прочитаны и не попали в output.

### Обязательное чтение

Прочитай AGENTS, RFC, architecture, status, application security, legal document set,
legal open questions, readiness audit и старые task prompts `02`, `05`, `06`, `08` в
`docs/tasks/2026-09-06-reconciliation/`. Проверь tracked manifests/lockfile/config
schemas и код auth/admin/uploads/email/analytics/logging/backups/external URLs.
Внешние сведения бери только из official advisories, upstream repositories и exact
version docs; для Expo используй versioned v57 docs. Указывай URL и дату проверки.

### Фаза A — factual inventory, docs-only commit

Инвентаризируй account/auth, author application/profile, Work/revisions/media,
moderation/audit, email, analytics, logs/errors, backups и legacy commerce data,
отдельно отметив, что commerce не обрабатывается в новом user flow, но его historical
tables/code пока существуют. Для каждой категории укажи source field, purpose,
public/private, storage, recipient/provider, proven country, retention или `UNKNOWN`,
delete/anonymize behavior, endpoint/screen и controls. Не открывай data rows.

Запиши dated report под `docs/research/` или в существующий owner-файл согласно index.
Этот commit не меняет runtime.

### Фаза B — JWT role/session freshness

Составь карту bearer/optional/logout/admin guards и sensitive endpoints. Сравни:

- **Durable fix:** проверяемый session/version/current-account invariant на sensitive
  requests с централизованным account status/role/capability validation.
- **Acceptable workaround:** короткий token TTL плюс explicit revoke только как
  дополнительный слой, если downgrade всё равно применяется немедленно.
- **Hack:** доверять роли в старом JWT, проверять status только в отдельных controllers
  или ослаблять guards — запрещено.

Исправь найденные paths. Не добавляй бессистемный DB lookup на каждый anonymous public
request. Покрой active→banned, admin→user, approved author→suspended, revoke/version
change, optional auth и websocket authentication.

### Фаза C — legacy HTTPS preflight

Найди все URL fields/write schemas/read mappers/fixtures. Добавь dry-run, который
выдаёт только counts по field/category, не значения. Не переписывай `http:` в `https:`
без доказательства. Invalid schemes остаются запрещены; legacy values очищаются,
блокируются или отправляются на ручное исправление по документированной политике.
Повторный запуск идемпотентен. Если factual risk отсутствует, оставь доказательство и
не создавай ненужную migration.

### Фаза D — security/dependency evidence и fixes

Проверь custom JWT/token logic, Argon2, OTP/reset, rate limiting/trusted proxy, uploads,
URL/redirect/CORS, Socket.IO, email links, errors/logs, row locks/idempotency и exact
production dependency advisories. Классифицируй `исправить до public launch`,
`после MVP`, `false positive/dev-only`. Не заменяй рабочий utility библиотекой только
ради preference. Если исправление существенно расширяет scope, оставь отдельный
готовый task prompt вместо рискованного комбайна.

### Tests и проверки

Добавь tests только для изменённого поведения и каждого закрытого finding. Обязательны
unit/integration auth downgrade/revoke tests и URL preflight tests. Затем:

```bash
pnpm db:generate
pnpm --filter @bidplace/contracts test
pnpm --filter @bidplace/api test
pnpm --filter @bidplace/api test:integration
pnpm --filter @bidplace/api typecheck
pnpm --filter @bidplace/api lint
pnpm --filter @bidplace/mobile typecheck
pnpm --filter @bidplace/mobile lint
pnpm build
```

PostgreSQL checks — только disposable DB вне sandbox. Dependency audit output
сохраняй без registry tokens и отделяй reachable production findings от общего шума.

### Не входит

Не выбирать production vendors, не менять legal copy до фактического inventory, не
обновлять все dependencies, не внедрять OAuth/magic link, не реализовывать commerce,
не деплоить и не менять Figma/`.pen`.

### Документация и Git

Обнови `11-PROJECT-STATUS.md`, `13-APPLICATION-SECURITY.md`, при необходимости
architecture/legal questions. Не объявляй lawyer/hosting decisions закрытыми. Сделай
до четырёх небольших commits по фазам; code commits — `fix issue:`, inventory —
`implement feature:` docs-only. `.pen` diff пуст.

Верни общий формат, отдельный outcome каждой фазы, findings по severity, источники,
commands/results, commits и оставшиеся launch blockers.
