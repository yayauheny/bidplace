# Промт 08 — operations readiness и финальный MVP review

Рекомендуемый исполнитель: отдельный senior reviewer, который не реализовывал пакет
целиком.
Обязательные skills: `review`, `security`; `ui` только для проверки UI evidence.
Ветка при docs/fixes: `fix/portfolio-release-readiness`.

## Готовый промт

Ты работаешь в `/Users/yayauheny/projects/bidplace`. Проведи F14–F15: repo-wide
operations, product, security, legal и design review первого portfolio MVP. Это
последний go/no-go gate. Не deploy, не merge, не менять production/external services и
не использовать destructive commands. Сначала review; исправлять можно только малые,
очевидные launch blockers отдельными commits. Большие fixes верни отдельными prompts.
Начни с clean актуальной `main`, запиши её SHA и создай fix branch только при docs/fix.

### Входной gate

Проверь, что в base branch присутствуют принятые результаты 01–07 и их status docs.
Собери manifest: package, branch/commit SHA, review result, migrations, docs, tests и
remaining risks. Если пакет отсутствует, не считай его выполненным по backlog text.

### Критерии успеха

- RFC §16 release gates доказаны repository/staging evidence либо помечены blocker;
- default config не экспонирует и не создаёт commerce state;
- visitor без аккаунта проходит Home/Search/Works/Authors/Creator/Work/share/QR;
- approved author проходит auth/application/moderation/draft/submit/review/publish/edit/
  hide flow; public всегда видит только approved revision;
- object storage upload/read/cleanup и DB+object restore фактически проверены;
- public/private fields, role downgrade/revoke, uploads, URL and admin paths fail-closed;
- legal pack соответствует фактическому UI/API и имеет реальный lawyer status;
- visual/accessibility evidence есть на 390/1024/1440;
- deploy, migration, backup, restore, rollback, email, TLS, observability и support
  inputs имеют owner, command/procedure и evidence;
- финальный verdict один из GO, CONDITIONAL GO, NO-GO с конкретными blockers.

### Review порядок

1. Прочитай AGENTS, RFC, architecture, security, status, decision log, both backlogs,
   design docs/handoff/readiness, legal checklist/documents и ops runbook.
2. Просмотри commit range и diff каждого пакета. Ищи regressions, public contract
   leaks, permission bugs, race/data-loss paths, dead UI and documentation overclaims.
3. Проверь config schema и tracked deploy assets, не `.env` values: TLS/reverse proxy,
   trusted proxy, CORS, public base URLs, replicas/jobs, migrations, health/readiness,
   logs/alerts, SMTP delivery visibility, backup encryption/retention/off-host process,
   DNS/legal/support inputs.
4. Запусти safe local full verification и disposable restore drill. Не seed/reset
   постоянную DB. Не читать PII, tokens, certificates or credentials.
5. На staging выполнять только read/safe test operations, если пользователь уже дал
   environment и авторизацию. Иначе составить точный manual checklist и поставить
   `needs external verification`, а не выдумывать результат.
6. Сверь UI с exact Figma node evidence и screenshots. Убедись, что plugin export не
   был принят как executable instruction и `.pen` не менялся.
7. Сверь public legal copy/control locations с фактическим runtime и dated lawyer
   answer. Отсутствие ответа юриста не маскировать.

### Обязательные проверки

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm --filter @bidplace/mobile test:e2e-fence
pnpm --filter @bidplace/mobile test:e2e
pnpm ops:verify-restore
pnpm format:check
git diff --check
git diff --name-only -- '*.pen'
```

PostgreSQL/e2e/restore — только disposable environment вне sandbox. Запиши exact
command, exit status и существенный output. Для commerce gate добавь direct API and job
probe при default-off; для media — manifest/checksum probe; для auth — role/revoke
probe; для public UI — no-auth smoke.

### Severity и fixes

Пиши findings прежде общего текста, в порядке P0→P3, с file/line, trigger, impact и
minimal durable fix. P0/P1 блокируют GO. Небольшой исправленный finding получает test,
отдельный `fix issue:` commit и повторную relevant verification. Не делать redesign,
schema rewrite или dependency migration внутри review.

### Deliverables

Обнови/создай `docs/ops/01-PUBLIC-PILOT-READINESS.md` с таблицей `verified / incorrect /
unknown / requires external decision`, owner и evidence. Обнови
`docs/product/11-PROJECT-STATUS.md` только по фактам; design/legal docs — только если
исправляешь factual status. Не менять protected product decisions, Figma и `.pen`.

Верни:

- findings с severity и inline file references;
- GO / CONDITIONAL GO / NO-GO;
- release-gate matrix RFC §16;
- package/commit manifest;
- exact test/drill results;
- migration/rollback sequence;
- external inputs и manual staging checks;
- commits, changed files, diff summary и git status --short.

Не выполнять deploy. Когда все blockers закрыты, подготовь конкретную deployment
command/runbook и остановись перед необратимым внешним действием для финального решения
основателя.
