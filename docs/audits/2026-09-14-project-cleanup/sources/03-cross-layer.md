# Аудит сквозных гарантий portfolio MVP

**Вердикт: NO-GO для публичного запуска.** Visitor-контур (просмотр, каталоги, share на web 390) в API в основном собран и подтверждён тестами. Author/admin loop, legal UX, production providers и staging **не** составляют запускаемый MVP. Существование кода ≠ готовность запуска.

Это аудит без правок. Исходники, lockfile, канонические документы, Pen/Figma, ветка и коммиты не менялись.

## Фиксация среза

| | |
|---|---|
| **HEAD** | `70c5fd52ed306143d62b8352edd45d61943388b9` — `docs: accept mobile discovery launch` |
| **Ветка** | `fix/work-final` (не `main`; `origin/main` = `08b916e`) |
| **Рабочее дерево** | Грязное. CORS-allowlist, packaging omit, seed/fixtures, правки `env.ts`/`bootstrap.ts` **не входят** в этот срез. Аудит = **HEAD**, не dirty tree. |
| **Ориентир** | Portfolio MVP без сделок, mobile web 390 (`DEC-082`–`DEC-087`, founder 2026-09-13) |

**Критерии успеха аудита:** шесть цепочек прослежены по коду; матрица RFC → код → тест → факт → gap; blockers/test gaps/gates без квоты; временные проверки только в worktree; shared `bidplace` не трогали.

**План:** канонические docs → HEAD-код шести цепочек → skills review/security/nest/ui → изолированные тесты → матрица и gates.

`scripts/setup` **нет**. Ближайший onboarding: `docs/ops/00-RELEASE-AND-BACKUP.md` (`pnpm install`, `cp .env.example`, `docker:up`, `pnpm verify`).

---

## Документы расходятся с HEAD (не выбирать удобную версию)

1. **`docs/audits/00-CURRENT-MVP-READINESS.md` (F01)** всё ещё описывает `CommerceEnabledGuard` и `COMMERCE_ENABLED=false`, evidence-файл `commerce-disabled-reads.integration.spec.ts`. На HEAD этого файла нет; `COMMERCE_ENABLED` отсутствует в `apps/api/src`; default boot — unmatched 404 (`app.module.ts`, `commerce-removed-routes.integration.spec.ts`). Позже это закрыто в `10-CODE-ARCHITECTURE.md` / статусе 2026-09-11. **Текущий аудит готовности устарел.**
2. **Тот же файл, F03** — Postgres fail-closed 503 для revision keys. На HEAD `PostgresImageStore.put` пишет BYTEA (`postgres-image-store.ts:82–103`); `RevisionMediaStorageError` нигде не бросается. Поздняя запись статуса 2026-09-09 это уже исправляет (`11-PROJECT-STATUS.md` ~729–733).
3. **F09** — «sale-oriented wizard». На HEAD wizard четырёхшаговый и без цены в creation flow; packaging/delivery остаются в non-wizard `section === 'all'`. Dirty tree как раз убирает эти поля — **это не HEAD**.
4. **`docs/legal/09-PORTFOLIO-LEGAL-REVIEW-MANIFEST.md:24`** всё ещё пишет `COMMERCE_ENABLED=false`.
5. **Исторические counts** (`381 unit / 89 integration` в retrospective 2026-09-09) не доказательство текущего HEAD. В этом аудите заново гонялись только указанные ниже наборы.
6. Dirty `13-APPLICATION-SECURITY.md` / `env.ts` описывают comma-separated CORS и `canonicalizeCorsOrigin`. **На HEAD** `CORS_ORIGIN` — один `z.string().url()` (`env.ts:33`), `bootstrap.ts:15–20` передаёт одну строку.

---

## Подтверждённые blockers MVP

### B1 — Legal UX и юрист Беларуси  
**Приоритет: P0 · подтверждено · до MVP · L (внешнее) + S (UI)**

RFC §13 / §16.6 и `docs/legal/00-MVP-LAUNCH-CHECKLIST.md` требуют документы, основание обработки, cookie control, author rules. Манифест: `Prepared, external lawyer review pending`; все чеклисты пустые.

**Код:** `GET/POST /api/auth/rules` есть (`auth.controller.ts:59–61`, `110–123`). В `apps/mobile/src` нет `acceptRules`, cookie notice, ссылок на оферту/privacy/footer legal. Регистрация (`auth-form.tsx`) — email/phone/password/displayName без legal controls.

**Сценарий:** публичный signup без воспроизводимого acceptance evidence.

**Минимальный durable fix:** ответ юриста + inventory cookies/providers → UI controls, которые бьют в `TermsAcceptance` и footer. Не заменять CSS-галочкой без серверной записи версии.

**Альтернатива:** закрытый preview без публичной регистрации (founder decision).  
**Упростить:** не строить commerce legal pack (`drafts/05-auction-and-sale-rules.md` уже deferred).

### B2 — Production providers, SMTP/S3, staging evidence  
**P0 · подтверждено · до MVP · L · Needs verification внешне**

`requiresProductionSecurity` требует SMTP bundle, `PASSWORD_RESET_URL_BASE`, S3 (`env.ts:131–176`). Compose `app` ставит `NODE_ENV/APP_ENV=production` и **не** задаёт `MEDIA_STORAGE_PROVIDER` (`docker-compose.yml:32–48`). Runbook HEAD не включает S3 в pre-deploy list (`00-RELEASE-AND-BACKUP.md:74–82`). Staging TLS/email/migrations/observability в репозитории нет (только `artifacts/figma-qa`).

**Последствие:** `docker compose --profile app up` в production-профиле не поднимется без полного секрета/S3; даже после boot нет доказанного restore/email/TLS.

**Fix:** выбрать hosting/SMTP/S3, заполнить inventory, disposable restore+backfill, staging smoke.  
**Нельзя:** объявить local MinIO «production storage».

### B3 — Author cabinet / hide / правка опубликованного — API есть, UI нет  
**P0 · подтверждено · до MVP · M**

RFC §3 / §16.3–4: автор видит drafts/pending/published/hidden и скрывает работу; обновляет профиль с повторной модерацией.

| Возможность | API | Mobile HEAD |
|---|---|---|
| Список работ кабинета | `GET /api/author/cabinet/works` (`portfolio.controller.ts:182–185`) | **нет вызова** `listCabinetWorks` |
| Hide/unhide | `POST /api/products/:id/hide\|unhide` (`products.controller.ts:39+`, `products.service.ts:421–427`) | **нет вызова** `hideWork`/`unhideWork` |
| Правка published Work | fork editing revision на PATCH | `canOwnerEditProduct('APPROVED') === false` (`product-draft-state.ts:6–8`, spec:16) |
| Правка published профиля | PATCH forks DRAFT (`sellers.service.ts:276–348`) | `isSellerProfileFormEditable(APPROVED, APPROVED) === false` (`seller-profile-editable.ts:15–27`) |

После approve `publishedRevisionId` = текущая editing revision со статусом `APPROVED` (`admin-moderation.service.ts:87–99`). UI: «Сейчас профиль нельзя редактировать.» (`seller-profile-screen.tsx:421–426`), Save требует `editable` (`:270–272`). Курица и яйцо: fork на сервере случается на PATCH, UI PATCH не шлёт.

«Кабинет» в `AccountMenu.tsx:74–75` — только label на `/profile` (форма заявки), не список работ. Dock «Добавить» ведёт на `/products/new` (`header-chrome.ts:51–53`).

**Сценарий:** одобренный автор не может скрыть работу, продолжить draft (кроме прямого URL), обновить опубликованный профиль. Гипотеза RFC §1 «возвращается ли автор обновлять портфолио» с продукта не проверяется.

**Доказательство:** grep по `apps/mobile` = 0 `hideWork`/`listCabinetWorks`; unit-тесты **закрепляют** lock APPROVED. API hide доказан integration (ниже).

**Fix:** owner cabinet на `listCabinetWorks` + hide/unhide; «Изменить» создаёт editing revision (пустой PATCH или dedicated start-edit); ослабить client lock согласованно с API. Не оставлять hide только админу, если RFC отдаёт его автору.

**Альтернатива (workaround):** оператор архивирует через admin; авторы только создают новые работы. Это ломает RFC §3.

**Удалить:** мёртвый client API `hideWork` без UI — нет, сначала привязать.

### B4 — Email verification опциональна на сервере и отсутствует в UI  
**P0 · подтверждено · до MVP · S–M**

RFC §3 / §12 / §16.3: кандидат подтверждает email.

`auth.service.ts:84–85` регистрирует `emailVerifiedAt: null` и сразу выдаёт сессию. `POST /api/seller/profile` не читает `emailVerifiedAt` (grep sellers/products = пусто). OTP: `POST /api/auth/email/request|verify` (`otp.controller.ts:16–32`). Mobile: **нет** `auth/email`. Integration-фикстуры ставят `emailVerifiedAt` (`permission-fixtures.ts`). HTTP OTP specs нет.

**Сценарий:** любой клиент создаёт заявку с неподтверждённым email.

**Fix:** `emailVerifiedAt != null` на create application (и желательно product create); экран verify.  
**Контраргумент:** UI мог бы гейтить. **Опровержение:** сервер — источник правды; UI гейта нет.

### B5 — Публичный signup без legal + copy «проверенных авторов»  
**P1 (copy) / связан с B1 · подтверждено · до MVP · S**

RFC §6 и legal UI gate: нет claims «проверенный автор». Search: «Ищите опубликованные работы и проверенных авторов.» (`search-screen.tsx:70`).

**Fix:** заменить на «опубликованных» / «авторов на bidplace» (`AUTHORS_CATALOG_INTRO` уже нейтрален).

---

## Наиболее опасные пробелы тестов

| ID | Пробел | Почему опасно | Размер |
|---|---|---|---|
| **T1** | Mobile vitest (60 файлов) и Playwright e2e (21 spec) **не** в `pnpm verify` и `.github/workflows/verify.yml` | Зелёный CI не доказывает visitor UI, share, retry, wizard | L gate |
| **T2** | Нет HTTP+DB теста OTP / unverified → application denied | B4 маскируется фикстурами | S |
| **T3** | Нет e2e цепочки register → verify → apply → moderate → publish → hide → guest 404 | RFC §16.3–4 не имеют сквозного доказательства | M |
| **T4** | `dropSchema` в `test-database.ts:120–137` ходит в БД `postgres`, а migrate создаёт `itest_*` в целевой БД | После успешных тестов в disposable DB остались 8 схем `itest_*` | S |
| **T5** | Нет e2e QR → guest land → другая работа; share e2e = copy | Гипотеза RFC §1 не закрыта автотестом | S |
| **T6** | Нет теста user ban → public `/works` 404 | RFC §16.4 можно закрыть только suspend, не ban | S |
| **T7** | Stale docs ссылаются на несуществующий `commerce-disabled-reads` | Ложная уверенность ревью | S docs |

Что **не** ложная уверенность: `portfolio-published-revision`, `media-transport`, `commerce-removed-routes`, `admin-user-emergency`, `moderation`, `optional-socials` — реальный HTTP+PostgreSQL. Controller-моки (`images.controller.spec.ts` и т.п.) слабее, но не единственное покрытие authz.

---

## Матрица гарантий

| Гарантия / RFC | Реализация HEAD | Тест | Факт этого аудита | Gap | Launch impact |
|---|---|---|---|---|---|
| **§16.1 Commerce off** | Модули не в `AppModule`; HTTP unmatched 404 | `commerce-removed-routes` + `app.module.spec` (нет `COMMERCE_ENABLED`) | 22 integration incl. commerce-removed **pass** | Prisma Listing/Bid/Order до P4 | Не блокер runtime; inventory P4 |
| **§16.2 Visitor Home→catalog→author→Work** | Portfolio APIs; aliases `/works/:id`→`/product`, `/authors/:slug`→`/seller` | e2e `wave-one`, `discovery-launch` **не в CI**; unit adapters | Код есть; e2e **не гонялись** | Curator UI нет; e2e вне verify | Visitor demo возможен; gate незелёный |
| **§16.3 Author email→app→moderation→Work→published** | API цепочка есть | moderation + published-revision integration **pass** | OTP/UI cabinet/hide отсутствуют | **B3, B4** | **Blocker** |
| **§16.4 Admin changes/hide/ban/revoke** | Admin moderation + `AdminUsersPanel` ban/revoke; seller suspend | `admin-user-emergency` + `moderation` **pass** | Ban **не** трогает Product/SellerProfile (`admin-user.service.ts:90–96`) | Ban ≠ public takedown | P1 ops: всегда suspend+archive |
| **§16.5 Upload/storage/backup** | Authz-before-decode, pixel budgets, S3 required in prod parse | `image-upload-safety`, `media-transport` **pass** (BYTEA path) | Restore drill / prod S3 **не** запускались | F03/ops | **Blocker** внешнего |
| **§16.6 Legal + lawyer** | Drafts + unused rules API | Нет runtime evidence | UI legal нет | **B1** | **Blocker** |
| **§16.7 390 states** | Figma QA artifacts; founder accepted 390 | e2e/figma **не в CI**; этот аудит браузер не гонял | Needs verification | Screen-reader/physical | Не код-блокер visitor, если принять прошлый QA |
| **§16.8 No .pen** | Не проверяли diff как задачу UI | `git diff --name-only -- '*.pen'` **не** запускался в этой сессии | — | — | Process |
| **§16.9 verify + staging + restore** | `pnpm verify` = generate/typecheck/lint/api+contracts+client unit/integration/build | Часть unit+integration в worktree **pass** | Full `pnpm verify`, e2e, restore, staging **не** гонялись | T1, B2 | **Blocker** evidence |
| **Цепочка 1** | Register→OTP→application→moderate→public author | Integration с **пропущенным** OTP | Public не отдаёт email/handoff/socialLink (`optional-socials` **pass**) | B4; нет server draft заявки (§8) | Blocker + P1 UX |
| **Цепочка 2** | Draft→images→submit→approve→`GET /works` | `portfolio-published-revision` **pass** | API ок | UI cabinet | API ready, product loop нет |
| **Цепочка 3** editing revision leak | Public = `publishedRevision`; guest image 404 | тот же spec **pass** | Утечки JSON/bytes не найдено | `creationIntro` на Product, не в public DTO | OK для launch API |
| **Цепочка 4** hide/block | Hide ARCHIVED; seller SUSPENDED | hide+bytes 404 и suspend 404 **pass** | User ban не прячет | B3 UI hide; ban gap | Partial |
| **Цепочка 5** Share/QR | Client QR (`ShareSheet.tsx:48–63`); `sharePath` с сервера | unit `public-share` **pass**; e2e QR funnel нет | Web-only QR; native out of scope | Нет `share_*` analytics | Visitor web OK; hypothesis Partial |
| **Цепочка 6** failure/session/submit | `query-retry.ts`; 401 clears session; submit `updateMany` count | unit retry/page-state **pass**; e2e double-submit нет | Mutations `retry: 0` | Нет e2e expiry-in-wizard | Acceptable + test gap |
| **§5 Открытие недели** | API `curatorSelection` | `curator-selection.integration` не гонялся здесь | `home-screen.tsx` не читает `curatorSelection` | DEC-086 UI missing | P2 editorial |
| **§7 draft не в public profile** | `getApprovedPublicAuthor` + published achievements | published-revision photo test **pass** | — | Имя pending — hypothesis (тот же механизм) | OK |
| **§12 session revocation** | `sessionVersion++` logout/ban/reset/revoke | emergency + password-reset **pass** | JWT 12h | OptionalBearer 401 на stale cookie | OK |
| **Abuse limits** | in-memory `RateLimitService` | unit rate-limit | Single replica (документировано) | Multi-instance | OK для pilot |
| **Fail-closed prod env** | `env-profile` + env superRefine | `env.spec` в 99 unit **pass** | Staging+`NODE_ENV=development` без SMTP/S3 | Document staging as `NODE_ENV=production` | P1 ops |
| **Media cache** | Product images `immutable` 1y (`image-policy.ts:244–259`) | media-transport headers **pass** | Hide → API 404; browser/CDN cache | Purge/mutable if CDN | P2 |
| **Analytics RFC §1** | `work_viewed`, `seller_viewed`, `registration_started`; first-touch `landingPath` | analytics unit **pass** | Нет share/QR event; ingest off в `NODE_ENV=test` | Слабая проверка «перешли по QR» | Partial hypothesis |
| **DB/storage consistency** | Delete: DB commit then S3 delete (`images.service.ts:183+`) | BYTEA path tested; S3 orphan unverified | Postgres revision bytes implemented | S3 TX, restore checksum | B2 |

---

## Остальные подтверждённые находки (не P0 продукта)

### G1 — Нет server-side draft заявки (RFC §8)  
**P1 · подтверждено · до MVP если ждут resume · M**  
`POST /api/seller/profile` сразу `PENDING_REVIEW` (`sellers.service.ts:209–232`). Wizard держит шаги локально до финального create (`seller-profile-screen.tsx:443–456`). Закрытие браузера = потеря. `PENDING_REVIEW` нельзя править (`:394–399`) до `CHANGES_REQUESTED`.

### G2 — Discipline default `'Автор'`  
**P2 · подтверждено · опционально · S**  
`sellers.service.ts:215`; create schema `discipline` optional (`seller-profile.ts:116`). Mobile шаг About требует discipline. API-обход остаётся.

### G3 — Packaging/delivery в non-wizard edit  
**P2 · подтверждено на HEAD · dirty tree уже чинит · S**  
`product-draft-about.tsx:241–267` при `section === 'all'`. Creation wizard не показывает. RFC §10. Не путать с uncommitted omit.

### G4 — Compose CORS default localhost в production container  
**P2 · подтверждено · до staging · S**  
`docker-compose.yml:38` `CORS_ORIGIN:-http://localhost:8081`. Забытый prod origin = credentialed browsers без CORS (fail-closed для сайта, открытый localhost origin).

### G5 — Observability  
**P2 · подтверждено · до launch желательно · M**  
`X-Request-Id` + request logs есть. Метрик/алертов/Sentry нет. Ready не проверяет SMTP/S3 (`health.service.ts:29–60`).

### G6 — Backup без fingerprint цели  
**P2 · подтверждено · до prod ops · S**  
`backup-db.sh:8–28` дампит любой `DATABASE_URL`. Restore/commerce-inventory защищены лучше.

### G7 — Archive GitHub rulesets  
**P2 · из статуса · Needs verification**  
`Not implemented` защита `archive/commerce-v1`. Не код-блокер portfolio, риск потери commerce archive.

---

## Неподтверждённые подозрения

- Практическая утечка hidden image из-за `immutable` без CDN (код заголовка подтверждён; поведение браузера не ловили).
- S3 `put` вне той же TX, что Prisma — orphan objects (код читался; S3 не гоняли).
- `creationIntro` на `Product` vs revision `story`, если появится новый public endpoint.
- Stale `bidplace_session` → 401 на optional-auth media вместо гостевого 200 (код optional bearer подтверждён; UX не ловили).
- Flake e2e из-за seed coupling `anna-morozova` / `seedAnna*` (читался `prepare.mjs`; e2e не гонялись).
- Накопление `itest_*` в **чужой** `bidplace_integration` (наш disposable DB дропнут; чужие БД не чистили).

---

## Недоступные / не запускавшиеся проверки

- Полный `pnpm verify`, `format:check`, mobile vitest целиком, Playwright e2e  
- `pnpm ops:verify-restore` / backfill / backup (нужны оператор и S3; не destructive против `bidplace`)  
- Staging TLS, реальная SMTP-доставка, production S3, cookie/SDK inventory на деплое  
- Юрист Беларуси, реквизиты ИП, retention  
- Браузер 390 / screen reader / 200% zoom в этой сессии  
- `git diff --name-only -- '*.pen'`  
- Чтение `.env` / секретов (намеренно)  
- Native iOS/Android (вне acceptance)

---

## Минимальный быстрый gate vs полный release gate

**Быстрый gate (закрытый preview, без публичной регистрации):**
1. API integration как сейчас + `commerce-removed-routes` / published-revision / hide / suspend.  
2. Mobile vitest owner/public recovery specs.  
3. Ручной visitor: Home → Work → Author → share copy на 390.  
4. Admin: approve author+work, suspend → guest 404.  
5. Не включать публичный register; `COMMERCE` и так отсутствует.

**Полный release gate (RFC §16):**
1. B1 legal UI + lawyer sign-off.  
2. B3 cabinet + hide + start-edit профиля/Work.  
3. B4 server email verify.  
4. Providers + `MEDIA_STORAGE_PROVIDER=s3` в compose/runbook.  
5. Staging: migrate, SMTP mail, CORS real origin, TLS, ready, restore checksum after backfill.  
6. CI: `pnpm verify` **плюс** `pnpm --filter @bidplace/mobile test` и узкий e2e (discovery + share alias + error retry + wizard).  
7. Cookie inventory с деплоя vs policy.  
8. Ops: backup fingerprint, suspend+ban playbook, no multi-replica.  
9. Copy: убрать «проверенных авторов».

---

## Staging rehearsal (pass/fail)

Среда: disposable DB+S3+SMTP, не `bidplace`. Pass только если все пункты зелёные.

| # | Проверка | Pass | Fail |
|---|---|---|---|
| 1 | Migrate deploy на пустую staging DB | 0, schema current | drift / rewrite old migrations |
| 2 | Boot с `NODE_ENV=production` `APP_ENV=staging` | слушает; без S3/SMTP — **не** должен | silent postgres media |
| 3 | `GET /health/ready` | 200 | 503 |
| 4 | Guest: `/`, `/works`, `/authors`, `/product/:id`, `/works/:id` redirect, share URL | 200, нет price/bid | 404 alias, commerce JSON |
| 5 | Register → **verify email** → application → admin approve → public author | только после verify | заявка без OTP |
| 6 | Work draft → photo → submit → approve → guest JSON/bytes | published only | editing leak |
| 7 | Owner hide → guest work+image 404; unhide restore | | cache/CDN still serves (если CDN — fail без purge) |
| 8 | Admin suspend seller → author+works+images 404 | | только session ban, страницы живы |
| 9 | Ban user → сессии 401; **отдельно** проверить public pages | документированный playbook | сюрприз |
| 10 | SMTP: reset mail доходит | | LocalMailTransport в prod |
| 11 | Restore dump в `*_restore` + checksum sample objects | | `NoSuchKey` без backfill |
| 12 | Double submit / 401 mid-wizard | conflict или login, без дубля | два PENDING |
| 13 | Legal controls на register + footer | version evidence | пустая форма |
| 14 | Analytics: `work_viewed` с share landingPath | row есть | ingest выключен |

---

## Что разумно оставить как есть

- Unmatched 404 вместо capability-флага для commerce (`DEC-087`).  
- Public = published revision (API модель здравая).  
- Hide как `APPROVED↔ARCHIVED`, не public «Архив».  
- In-memory rate limits на одном replica.  
- Prisma Listing/Bid/Order до staging inventory (P4).  
- Native share/QR — вне текущего 390 web acceptance.  
- Карточка без «brief facts» — записанная design-ambiguity, не баг.  
- `RevisionMediaStorageError` — мёртвый код, чистить после MVP, не блокер.  
- Не возвращать сделки/оплату/доставку в scope.

---

## Приоритетные действия (код, не внешнее)

1. Owner cabinet + hide/unhide + start-edit (B3).  
2. Server `emailVerifiedAt` gate + экран verify (B4).  
3. Legal controls на register/footer (после юриста) (B1).  
4. «проверенных авторов» (B5).  
5. Починить `dropSchema` на целевую БД (T4).  
6. Вставить mobile unit (и узкий e2e) в release CI (T1).  
7. Runbook: `MEDIA_STORAGE_PROVIDER=s3` + CORS production origin (B2/G4).

---

## Юридические и founder decisions (отдельно)

- Публиковать ли до ответа юриста по `06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md` (возраст, основание, лицензия контента, retention, cookies). Сейчас **нельзя** честно закрыть §16.6.  
- Закрытый preview без signup vs публичный MVP.  
- Обязателен ли author hide/cabinet до запуска, или достаточно admin suspend (конфликт с RFC §3).  
- Нужен ли UI «Открытие недели» или curator не используется в пилоте.  
- Staging profile: `NODE_ENV=production` или ослабленный `development`+`staging` (сейчас без SMTP/S3).  
- Providers и страны обработки.  
- GitHub rulesets на commerce archive.

---

## Внешние зависимости запуска

Hosting, Postgres, S3-compatible storage, SMTP, DNS/TLS, backup encryption key, Belarus lawyer, operator identity/реквизиты, cookie/SDK inventory с живого деплоя, поддержка/rightsholder contact.

---

## Проверенные области

- Default Nest composition без commerce HTTP/jobs/realtime.  
- Public Work/Author projections и image authz (published revision).  
- Hide/unhide и seller suspend на API.  
- Session bump: logout, ban, revoke, password reset.  
- Admin cannot ban/revoke self/other admins.  
- Handoff/email/socialLink не в public author JSON.  
- Prod env parse: S3/SMTP/JWT/bypass.  
- Seed guard (`ALLOW_DESTRUCTIVE_DEMO_SEED` + local/test).  
- E2E fence отказывается от не-`bidplace_e2e`.  
- Analytics contract без commerce ingest names.

---

## Выполненные команды

Изолированный worktree `/tmp/bidplace-mvp-guarantees-audit` @ `70c5fd5` (удалён после проверок). `node_modules` — symlink, **без** `pnpm install` в основном checkout.

Disposable Postgres `bidplace_audit_guarantees_test` (создана, после тестов `DROP DATABASE`). Не использовались `bidplace`, `bidplace_e2e`, preview/figma DB. Seed/reset/migrate против рабочей БД не запускались.

| Команда | Результат |
|---|---|
| vitest API: `env`, `app.module`, `auth.service`, `otp.service`, `admin-user`, `products.service`, `images.service`, `postgres-image-store` | **99 passed** |
| vitest contracts | **25 passed** |
| vitest mobile: draft-state, profile-editable, public-share, query-retry, work-page-state, portfolio-copy, analytics | **43 passed** |
| integration на isolated DB: commerce-removed, admin-emergency, published-revision, test-database | **22 passed** |
| integration: media-transport, moderation, password-reset, auth-transport, optional-socials | **18 passed** |

После integration в disposable DB оставались `itest_*` (T4); база дропнута целиком.

**Не** запускались: полный `pnpm verify`, e2e, restore, format, typecheck/lint целиком.

---

## Ограничения аудита

Срез = HEAD `70c5fd5`, не dirty tree и не `main`. Параллельные worktree других задач не читались как истина. Исторические Implemented/test counts не принимались. Юридический compliance не подтверждался. Production/staging не существовали для этого ревью как evidence.

**Итог:** для гостевого просмотра опубликованного портфолио на mobile web API в основном готов. Для запуска, который RFC называет MVP — авторский цикл, legal, почта/медиа/staging и CI-доказательства UI — **нет**.