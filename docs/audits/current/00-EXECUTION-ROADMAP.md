# Execution roadmap полного аудита bidplace

**Canonical файл:** `/Users/yayauheny/projects/bidplace/docs/audits/current/00-EXECUTION-ROADMAP.md`

**Источник:** последний полный аудит в этой беседе, baseline `7d2d547`. Исходный аудит и существующие audit-файлы сохраняются.

**Результат планирования:** 29 findings (28 исходных + D08 из targeted review PR #12) распределены по семи волнам и 30 небольшим scopes: 24 Implementation и 6 Plan.

**Сохранён:** 2026-09-29. **Статус документа:** R01 — `NEEDS_VERIFICATION`; R30 — `NEEDS_VERIFICATION`; R02 — `NEEDS_VERIFICATION`; R03 — `NEEDS_VERIFICATION`; R04 — `VERIFIED`; R05, R06 и R07 — один пакет `NEEDS_VERIFICATION`, включая две коррекции review; R08 — `NEEDS_VERIFICATION`; R31 — `NEEDS_VERIFICATION`; R32 — `NEEDS_VERIFICATION`. Остальные scopes R09–R29 и R33–R35 этим пакетом не запускались.

**Дополнение 2026-10-01:** R09 и R10 выполнены на `fix/audit-unused-code` от `5ca9657`. Из R35 выполнен C08 и соседние безопасные wrappers. C07 и L06 не начаты, R35 не закрыт. R11 и R12 выполнены на `fix/dependency-ownership` от `46122e4`. C03 остаётся `NEEDS_VERIFICATION`: export прошёл, runtime font rendering не проверялся. C05 → `VERIFIED`. R13–R29, R33 и R34 не запускались. D04, D05, D09, D10 и L04 остаются `NEEDS_VERIFICATION`: браузеры не запускались. T04 и T06 остаются `PARTIAL`.

**Дополнение 2026-10-01, post-cleanup leftovers:** на `fix/post-cleanup-leftovers` от `76ebd1b` удалены девять подтверждённых остатков после R09–R12. Этот пакет не закрывает C02, C03 или C04. C03 остаётся `NEEDS_VERIFICATION`. R13–R29, R33 и R34 не запускались. R32 остаётся `NEEDS_VERIFICATION`. D04, D05, D09, D10 и L04 остаются `NEEDS_VERIFICATION`. T04 и T06 остаются `PARTIAL`. См. evidence ниже.

**Дополнение 2026-10-01, shared UI lifecycle:** на `fix/shared-ui-lifecycle` от `d375179` выполнены R13, R14 и L06 из R35. C04, L01 и L06 → `NEEDS_VERIFICATION`: браузеры не запускались. R35 не закрыт, C07 остаётся `QUEUED`, C08 остаётся `VERIFIED`. R15–R17, R25, R28, R29, R32–R34 не запускались. D04, D05, D09, D10 и L04 остаются `NEEDS_VERIFICATION`. T04 и T06 остаются `PARTIAL`. См. evidence ниже.

**Дополнение 2026-10-01, R14 return focus:** на `fix/shared-ui-lifecycle` исправлены два возврата фокуса `AppDialog` после R14. `@rn-primitives/dialog` 1.5.2 остаётся единственным владельцем focus lifecycle. L01 остаётся `NEEDS_VERIFICATION`: браузеры не запускались. Остальные verification статусы не повышены. См. evidence ниже.

**Дополнение 2026-10-01, form field ownership:** на `fix/form-field-ownership` от `6c0fac7` выполнены R15 и R16. L02 → `NEEDS_VERIFICATION`: локальные проверки прошли, браузеры не запускались. R17, R33, R34 и C07 не запускались. D04, D05, D09, D10 и L04 остаются `NEEDS_VERIFICATION`. T04 и T06 остаются `PARTIAL`. См. evidence ниже.

**Дополнение 2026-10-01, R15 validation freshness:** на `fix/form-field-ownership` после `65b0801` Save и выход из формы автора проверяют актуальный raw draft через `profileDraftSchema`, а не ошибки предыдущего resolver. L02 остаётся `NEEDS_VERIFICATION`: браузеры не запускались. R16 не переоткрывался. R17, R33, R34 и C07 не запускались. D04, D05, D09, D10, L04 и R32 остаются `NEEDS_VERIFICATION`. T04 и T06 остаются `PARTIAL`. См. evidence ниже.

**Дополнение 2026-10-01, R18:** на `fix/narrow-read-selectors` от `6c0fac7` сужены read models image authorization и portfolio Work. D06 → `VERIFIED`. R19–R21 и R23 не начинались. См. evidence ниже.

**Дополнение 2026-10-01, R17:** на `fix/config-bootstrap-ownership` от `6c0fac75` env-файл разбирается Node `util.parseEnv`, а серверная конфигурация валидируется один раз на application context и передаётся через Nest DI. L03 → `VERIFIED`. Этот пакет сам не менял R15, R16 и R18. См. R17 evidence.

**Дополнение 2026-10-01, R17 BOM:** один начальный U+FEFF снимается до `util.parseEnv`, поэтому production-файл не читается как development/local. `@bidplace/config` test входит в root `test:unit`. L03 остаётся `VERIFIED`. См. R17 evidence.

Текущая задача сохраняет roadmap и prompts, не запускает production-изменения и не создаёт PR. Утверждение roadmap не является выбором архитектурных вариантов R22–R27.

## 1. Правила исполнения и ведения roadmap

### Единственный владелец плана

Этот документ хранит:

- исходный finding и неизменный ID;
- текущий статус;
- волну и scope;
- зависимости и блокирующие решения;
- ссылки на изменения и verification evidence.

Продуктовые и архитектурные документы продолжают владеть своими контрактами. Они не становятся вторым backlog. Исходные аудиты сохраняют исторические выводы; статусы выполнения ведутся здесь.

### Статусы

| Статус               | Значение                                                         |
| -------------------- | ---------------------------------------------------------------- |
| `QUEUED`             | Назначен implementation scope, работа не начата                  |
| `IN_PROGRESS`        | Выполняется назначенный scope                                    |
| `PARTIAL`            | Закрыта только часть составного finding                          |
| `NEEDS_VERIFICATION` | Изменение есть, обязательные проверки не завершены               |
| `DECISION_REQUIRED`  | Назначен Plan scope; implementation не разрешён                  |
| `BLOCKED`            | Выполнение зависит от незавершённого scope или решения           |
| `VERIFIED`           | Все части finding выполнены и подтверждены проверками            |
| `NOT_REPRODUCED`     | Phase 0 опроверг finding на новой базе; приложены доказательства |
| `DEFERRED`           | Есть явное решение отложить, причина и условие возврата          |

`Plan completed` не означает `finding VERIFIED`. После архитектурного решения новый implementation scope добавляется **в этот же документ**.

### База веток

Обозначение **B** во всех prompts:

```text
base branch: feature/portfolio-mvp-release
baseline merge SHA: 6c74c5d1505a398062a781a27fc5ed6aea16edbd
audited cleanup commit contained: 7d2d5479f1087835271c1eb23985f2886049abb6
```

Canonical integration base — `feature/portfolio-mvp-release`. Каждый новый scope создаётся от её актуального remote HEAD после merge всех реальных prerequisites. `main`, `chore/mobile-dead-code-cleanup` и roadmap-ветка не используются как implementation base.

Каждый scope начинается от актуального B после вливания перечисленных зависимостей. Независимые scopes можно выполнять отдельно; пересекающиеся файлы требуют последовательного включения изменений.

Смена интеграционной базы допускается только после проверки, что новая база содержит baseline и уже выполненные scopes. Решение фиксируется здесь.

### Общий implementation prompt G

**Каждая карточка R01–R35 ниже является prompt вместе с этим блоком.** Для запуска передавать G и выбранную карточку; зависимости не считать выполненными только по названию ветки.

> Выполни только указанный scope.
>
> 1. Прочитай root/package AGENTS, обязательные product documents и применимые skills. Для UI прочитай design owners; для permissions, moderation, media и config применяй security.
> 2. Phase 0: проверь baseline, зависимости, текущую реализацию, установленные версии, consumers и существующие тесты. Сначала production code, затем относящиеся к нему тесты.
> 3. До правок сформулируй критерии успеха и сравни варианты с явными метками `durable fix`, `acceptable workaround`, `hack`. Выбери durable fix в заданных границах.
> 4. Не устанавливай новую библиотеку, если задачу решают стандартный API или уже установленный инструмент. Не обновляй major-версии framework.
> 5. Сохрани public/private границы, серверную авторизацию, state-machine transitions, row locks, transaction checks и response validation. Не удаляй исторические данные и миграции.
> 6. Не меняй canonical Pen/Figma sources. Не меняй продуктовые правила, URL или публичные контракты вне явно указанного scope.
> 7. Удаляй production code только в явно разрешённых cleanup scopes и после повторной проверки reachability. Тесты удалённого поведения убирай после удаления соответствующего production code.
> 8. Не читай `.env`, credentials и секреты. Проверки выполняй с безопасным тестовым окружением. Integration/E2E разрешены только на подтверждённой disposable test database.
> 9. Выполни обязательные проверки карточки. Не заменяй поведенческий тест поиском строки в исходнике.
> 10. Обнови этот roadmap: статус, commit, проверенные сценарии, команды, результаты, оставшиеся blockers. При изменении поведения обнови product status; architecture/design owners — только при изменении принадлежащих им границ.
> 11. Создай указанную ветку и commit после проверок. Не создавай и не публикуй PR без отдельного запроса. `Rxx` обозначает будущий PR scope.
>
> **Общие STOP CONDITIONS:** изменение затрагивает неразрешённый продуктовый контракт; нужен новый dependency или framework major; обнаружен внешний consumer удаляемого API; нарушается security/state invariant; база не содержит prerequisite; тестовая БД не подтверждена как disposable; обязательный check не выполнен. Останови затронутую часть, сохрани доказательства и точный blocker; не объявляй finding закрытым.
>
> **Финальный отчёт:** scope/branch/base/commit; закрытые и частично закрытые ID; что изменилось; изменённые файлы и contracts; удалённый код и замена; команды и результаты; regression evidence; изменения документации; остаточные риски и STOP blockers; итоговый audit status.

### Общий Plan prompt P

Для карточек с режимом **сначала Plan**:

> Выполни Phase 0 и подготовь решение без production changes, migrations и удаления API. Сравни перечисленные варианты, выбери рекомендуемый и обоснуй trade-offs. Укажи public interfaces, data flow, failure modes, compatibility, security invariants, rollout/rollback, тесты и небольшие будущие implementation scopes.
>
> Не считай предложенный вариант утверждённым. Результат внеси в этот roadmap после разрешения на запись документа. До явного принятия решения статус finding — `DECISION_REQUIRED`.
>
> Финальный отчёт: подтверждённая проблема; варианты; рекомендация; evidence; нерешённые вопросы; решение, которое требуется; последующие scopes и критерии допуска к implementation.

### Validation profiles

Команды запускаются из `/Users/yayauheny/projects/bidplace`. `P` ниже означает **конкретный package name из карточки**, а не новый script.

**V-PACKAGE(P):**

```sh
pnpm exec turbo run typecheck build --filter='P...'
pnpm --filter P test
```

`test` запускать только при наличии script. Для нового package test script — после его добавления в назначенном scope.

**V-MOBILE:**

```sh
EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...'
pnpm --filter @bidplace/mobile lint
pnpm --filter @bidplace/mobile test
pnpm --filter @bidplace/mobile test:e2e-fence
```

**V-API:**

```sh
BIDPLACE_ENV_FILE=/dev/null pnpm exec turbo run typecheck build --filter='@bidplace/api...'
pnpm --filter @bidplace/api lint
BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/api test --exclude src/core/config/env.spec.ts
env -u BIDPLACE_ENV_FILE pnpm --filter @bidplace/api test src/core/config/env.spec.ts
```

Последняя команда допустима после проверки, что env-тесты используют mocked file lookup и отсутствующий fixture path. Не подменять проверку чтением реального `.env`. Это разделение предотвращает известный конфликт `/dev/null` с тестами поиска пути.

**V-INTEGRATION:**

```sh
BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/api test:integration
```

Предусловия: проверен `test-database.ts`, выбрана disposable integration DB, harness не читает реальные секреты. Карточка указывает обязательные сценарии; полный integration suite нужен перед закрытием затронутых transaction/security findings.

**V-BROWSER:**

```sh
pnpm --filter @bidplace/mobile test:e2e-fence
EXPO_NO_DOTENV=1 BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/mobile exec playwright test <spec> --project=chromium --project=webkit
```

Использовать основной fenced config. Не подключаться к неизвестному уже запущенному API через reuse-config.

**V-DIFF — во всех implementation scopes:**

```sh
git diff --check
git diff --name-only
git -c core.fsmonitor=false status --short
```

Проверить отсутствие `.pen`, секретов, случайных snapshots и build artifacts в diff.

Недоступная БД, browser runtime или безопасное окружение означают `NEEDS_VERIFICATION`, а не успешную проверку.

## 2. Волны и зависимости

| Волна  | Назначение                                                     | Scopes       |
| ------ | -------------------------------------------------------------- | ------------ |
| Wave 1 | Correctness и небольшие проверки высокой ценности              | R01–R04, R30 |
| Wave 2 | Lifecycle, сохранение формы, query ownership и cancellation    | R05–R08, R31–R32 |
| Wave 3 | Подтверждённый dead code, dependencies и бесполезные параметры | R09–R13      |
| Wave 4 | Упрощение средствами установленных libraries/framework         | R14–R17, R34–R35 |
| Wave 5 | Узкие read models и ограничение стоимости запросов             | R18–R21      |
| Wave 6 | Отдельные архитектурные решения                                | R22–R27, R33 |
| Wave 7 | Остаточный test cleanup                                        | R28–R29      |

Волны задают приоритет, а не обязательный глобальный барьер. Явные зависимости карточек обязательны. Тесты нового поведения входят в production scope сразу; Wave 7 не является местом для откладывания regression coverage.

T01 находится в Wave 1, потому что исправляет **обнаружение существующих тестов**, а не начинает преждевременный cleanup.

## 3. Готовые prompts

### Wave 1 — correctness

### R01. Исправить `closeOnFocusIn`

- **Модель:** Luna.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/overlay-focus-dismiss`.
- **Findings:** D03; часть T04.
- **Dependencies:** нет.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/layout/use-dismissible-overlay.ts`, символ `useDismissibleOverlay`.
- **Phase 0:** подтвердить shadowing boolean option одноимённым callback; проверить SearchOverlay и FilterSheet consumers.
- **Исправить:** разделить имя option и listener. Регистрировать `focusin` только при включённой опции; корректно удалять тот же listener.
- **Замена:** не нужна; стандартный DOM event lifecycle уже подходит.
- **Не менять:** portal, history, focus trap, Escape/outside-click semantics.
- **Инварианты:** `false` не закрывает overlay при смене фокуса; `true` закрывает только по существующим outside rules; закрытие происходит один раз.
- **Тесты:** реальный lifecycle hook: false/true, focus внутри/снаружи, cleanup и повторное открытие. Не ограничиваться pure helper.
- **Validation:** V-MOBILE; V-BROWSER для `search-overlay.spec.ts`; V-DIFF.
- **STOP:** исправление требует перестройки focus ownership — вынести в R14.
- **Done/status:** D03 → `NEEDS_VERIFICATION`; T04 остаётся `PARTIAL`. Hook lifecycle подтверждён; Playwright `search-overlay.spec.ts` не стартовал, потому что disposable DB отклонила credentials `auction`.
- **Отчёт:** G, включая доказательство различия true/false.

### R02. Показывать в moderation queue именно проверяемую ревизию

- **Модель:** Sol High.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/moderation-revision-projection`.
- **Findings:** D01; часть T04.
- **Dependencies:** нет.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/api/src/admin/admin-moderation.service.ts`, `listSellerProfiles`, `listProducts`, `updateSellerStatus`, `updateProductStatus`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/admin/admin-moderation-screen.tsx`; `/Users/yayauheny/projects/bidplace/packages/contracts/src/admin.ts`.
- **Phase 0:** проследить approved parent + pending editing revision от DB до filter/actions UI; перечислить поля, которые реально рассматривает модератор.
- **Исправить:** добавить явную admin projection проверяемой revision и её статуса; pending queue и review controls должны ориентироваться на неё. Parent visibility status сохранить отдельно.
- **Замена:** Prisma relation select + shared Zod admin contract вместо неявного использования parent DTO.
- **Не менять:** state transitions, публикацию ревизии, hide/suspend, pagination — это R19.
- **Инварианты:** показываемая ревизия соответствует цели review; pending поля и media не попадают в public DTO; существующие guards и audit events сохраняются.
- **Тесты:** approved parent/pending revision появляется в очереди; данные отличаются от опубликованных; approve/reject/changes requested относятся к revision; hide/suspend относятся к parent; owner/admin/public visibility.
- **Validation:** V-API, V-MOBILE, contracts/api-client package checks, V-INTEGRATION, targeted moderation browser scenario.
- **STOP:** требуется изменить смысл review/visibility transitions или canonical parent/revision ownership.
- **Done/status:** D01 → `VERIFIED` only after the browser scenario; T04 → `PARTIAL`.
- **Actual:** D01 → `NEEDS_VERIFICATION`. See the R02 evidence record. T04 stays `PARTIAL`.
- **Отчёт:** G с before/after DTO и доказательством отсутствия public leakage.

### R03. Дать approved автору отправить новую ревизию

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/author-revision-submit`.
- **Findings:** D02, T03; часть T04.
- **Dependencies:** R02.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/seller-profile-screen.tsx`, `isApplicationWizard`, `canSubmitRevision`; `/Users/yayauheny/projects/bidplace/apps/mobile/e2e/author-revision-flow.spec.ts`; `/Users/yayauheny/projects/bidplace/apps/mobile/e2e/author-achievement-revision.spec.ts`.
- **Phase 0:** подтвердить серверный submit path для approved автора и существующие eligibility helpers; сопоставить старые E2E с текущим nickname/four-step onboarding.
- **Исправить:** вне initial wizard показать submit action при разрешённой editing revision. Выполнять save → submit; после save error не отправлять.
- **Тестовый scope:** переписать два устаревших revision E2E под актуальное поведение. Подготавливать approved author через существующий безопасный API fixture; сохранить один полноценный onboarding путь.
- **Не менять:** stage machine, обязательность полей, публикацию до approval, layout всей формы.
- **Инварианты:** pending revision блокирует редактирование/повторную отправку; published profile остаётся прежним до approve; achievement draft media приватны.
- **Тесты:** rendered action у approved автора; отсутствие action при pending; failed save; successful submit; changes requested/rejected recovery; achievement publication/privacy.
- **Validation:** V-MOBILE, оба named E2E в Chromium/WebKit; связанные API integration tests.
- **STOP:** сервер не поддерживает требуемый transition либо UI требует нового продуктового flow.
- **Done/status:** D02 и T03 → `VERIFIED` только после browser checks; T04 → `PARTIAL`.
- **Actual:** D02 и T03 → `NEEDS_VERIFICATION`. See the R03 evidence record. T04 stays `PARTIAL`. D01 stays `NEEDS_VERIFICATION`.
- **Отчёт:** G с перечнем заменённых устаревших ожиданий.

### R04. Вернуть выпавшие тесты в discovery

- **Модель:** Luna.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/workspace-test-discovery`.
- **Findings:** T01.
- **Dependencies:** нет.
- **Начать:** `/Users/yayauheny/projects/bidplace/packages/contracts/vitest.config.ts`; `/Users/yayauheny/projects/bidplace/packages/contracts/src/portfolio.spec.ts`; `/Users/yayauheny/projects/bidplace/packages/database/src/index.spec.ts`; root `package.json` и package tsconfigs.
- **Phase 0:** получить фактический список discovered tests; проверить, какие tests попадают в package build.
- **Исправить:** включить contracts `src/**/*.spec.ts` вместе с существующим test glob. Для database сделать meaningful public-export smoke test, добавить test script/config и включить package в root unit gate. Исключить test sources из production emit.
- **Замена:** стандартная Vitest discovery и TypeScript build exclusions.
- **Не менять:** production exports, Prisma schema, global test framework.
- **Инварианты:** suite реально выполняет assertion; fallback `?? {}` не должен делать его вакуумным.
- **Тесты:** discovered portfolio test; database smoke; build output без test modules.
- **Validation:** contracts/database V-PACKAGE; root unit command после проверки безопасного env harness; V-DIFF.
- **STOP:** database assertion не выражает реальный контракт — не сохранять его ради количества тестов; зафиксировать и удалить с объяснением, сохранив discovery остальных meaningful tests.
- **Done/status:** T01 → `VERIFIED`.
- **Actual:** T01 → `VERIFIED`. See the R04 evidence record.
- **Отчёт:** G с discovered counts до/после и проверкой build output.

### R30. Вернуть доступный logout в живой account/profile flow

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/account-logout-entry`.
- **Findings:** D08 · P1 · HIGH — auth logout существует в AuthProvider/API, но в текущем runtime отсутствует доступный пользователю UI entry point.
- **Происхождение:** targeted read-only review [PR #12](https://github.com/yayauheny/bidplace/pull/12), сравнение `014711fa2ef4f78ad28e4759168d42ef04d5b794` → `7d2d5479f1087835271c1eb23985f2886049abb6`. Это НЕ regression PR #12: UI callers уже находились в unreachable legacy tree на его base.
- **Dependencies:** нет. R30 относится к Wave 1; номер добавлен без перенумерации R01–R29.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/providers/auth-provider.tsx`, `AuthProvider.logout`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/lib/query-cache.ts`, `clearAuthenticatedSession`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/figma/FloatingDock.tsx`, `dockHref`; живые `/profile`, `/cabinet`, `/admin` screens.
- **Phase 0:** повторно проверить отсутствие live logout callers; проследить account/profile destination для пользователя без профиля, кандидата, approved/suspended автора и admin. Проверить существующие session cleanup, error policy, protected-route guards и design owners; выбрать место действия внутри текущего account/profile flow, доступное соответствующим authenticated ролям, включая admin account destination.
- **Исправить:** добавить доступное действие «Выйти» с existing UI primitive и вызовом существующего `auth.logout()`. На время операции блокировать повторное нажатие. После завершения local cleanup выполнять `router.replace('/')` и при успехе, и при server logout failure; rejection обработать по существующей error policy без unhandled promise rejection или пустого catch.
- **Механизм:** существующие AuthProvider, React Query session cleanup и Expo Router `replace`; не вызывать logout API напрямую из UI и не заводить второй session state.
- **Не менять:** legacy AccountMenu/MobileHeader не возвращать; не перестраивать dock, onboarding и navigation tree; не менять API/session protocol, серверную авторизацию или дизайн-систему. Новая библиотека не нужна.
- **Инварианты:** сохранить `AuthProvider.logout` cleanup в `finally`, включая отмену session queries и очистку private cache при server failure. До перехода в публичное состояние local session должна быть очищена; Back не должен раскрывать protected данные. Guest не видит logout. Не представлять локальный выход при сетевом сбое как доказанную серверную invalidation; dirty формы остаются под существующими unsaved-change guards.
- **Тесты:** behavioral test живого UI: authenticated пользователь находит logout и запускает его; success и rejected server logout оба очищают local session/private cache и переводят на `/`; guest не видит действие; повторное нажатие не создаёт второй запрос; protected route после выхода недоступен. Проверить reachability действия для указанных account destinations; не заменять тест source-text assertion.
- **Validation:** V-MOBILE; V-BROWSER для добавленного logout scenario в Chromium/WebKit; V-DIFF. Сохранить regression coverage текущего session cleanup.
- **STOP:** действие недоступно части authenticated ролей; proposed fix обходит существующий cleanup или dirty guard; требуется новый account route, auth protocol либо восстановление legacy tree — остановить расширение scope и зафиксировать blocker.
- **Done/status:** D08 → `NEEDS_VERIFICATION`. Behavioral logout checks passed. Chromium/WebKit did not start because the disposable database rejected user `auction`.
- **Отчёт:** G с доступными account destinations, evidence для success/server failure и явной отметкой «предсуществующий дефект, не regression PR #12».

### Wave 2 — lifecycle/state/query

### R05. Сохранение Work не должно стирать новые изменения

- **Модель:** Sol High.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/work-save-edit-race`.
- **Findings:** часть D04 и T04.
- **Dependencies:** R04.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/product-draft-screen.tsx`, mutations `save`, `submit`, hydration и `pendingNavigation`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/product-draft-form.ts`.
- **Phase 0:** воспроизвести save A → ввод B → response A; проверить normalized server response и create/update ветки.
- **Исправить:** передавать immutable submitted snapshot. При ordinary save обновлять persisted baseline, сохраняя поля, изменившиеся относительно submitted snapshot. Не использовать безусловный `reset` и не считать все ранее dirty поля новыми изменениями.
- **Механизм:** RHF `reset`/`setValue` и mutation variables; Query остаётся owner серверного состояния.
- **Submit/navigation:** блокировать ввод на время save-before-submit/exit; при ошибке снять блокировку и остаться на форме. Ordinary Save сохраняет возможность ввода.
- **Не менять:** browser history алгоритм, маршруты, server revision semantics.
- **Инварианты:** серверная нормализация применяется к неизменённым полям; новые значения остаются dirty; не происходит навигации с потерей изменений; failed save не запускает submit.
- **Тесты:** delayed response, изменённое/неизменённое поле, create, update, failed save, submit, exit, refetch.
- **Validation:** V-MOBILE; `product-creation-wizard.spec.ts` и focused browser race scenario.
- **STOP:** необходима переработка history ownership — R25.
- **Done/status:** D04/T04 → `PARTIAL` до R06.
- **Actual:** Реализовано вместе с R06 и R07 на `fix/owner-editor-state`. Коррекция 2026-09-29 оставляет guard включённым на время save-before-transition, снимает lock после submit и не пускает вторую ordinary-запись. Вторая коррекция не продолжает submit после смены сессии и открывает редактирование только по более новой editing revision. Третья коррекция не считает промежуточный snapshot сохранения новым решением модератора. D04 не `VERIFIED`: browser checks не запускались. T04 остаётся `PARTIAL`. См. evidence R05–R07.
- **Отчёт:** G с временной последовательностью regression scenario.

### R06. Сохранение профиля не должно стирать новые поля или фото

- **Модель:** Sol High.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/profile-save-edit-race`.
- **Findings:** оставшаяся часть D04; часть T04.
- **Dependencies:** R03, R05.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/seller-profile-screen.tsx`, `saveMutation`, payload builders, `photoBlob`, `choosePhoto`.
- **Phase 0:** проверить closure-based payload, reset и безусловный `setPhotoBlob(null)`; смоделировать выбор нового фото во время сохранения предыдущего.
- **Исправить:** snapshot полей и фото становится mutation variables. Применить reconciliation семантику R05; очищать только сохранённый photo selection, не более новый. Для submit/step/exit применять блокировку операции.
- **Механизм:** RHF + React Query mutation variables; без дополнительного state store.
- **Не менять:** onboarding stages, photo validation, server permissions, все формы приложения.
- **Инварианты:** новые поля/фото не теряются; response обновляет baseline; latest selection остаётся несохранённым; ошибки не переводят на следующий шаг.
- **Тесты:** field race, photo race, failed upload/save, save→submit, backward/forward step.
- **Validation:** V-MOBILE; profile/revision browser scenarios.
- **STOP:** требуется новый upload protocol либо изменение server contract.
- **Done/status:** D04 → `VERIFIED` после R05+R06; T04 остаётся составным.
- **Actual:** D04 → `NEEDS_VERIFICATION`. Обе формы сверены со snapshot. Коррекция 2026-09-29 не применяет ответ предыдущей сессии к профилю, фото или переходу новой сессии. Вторая коррекция не переносит выбранное фото или изображение работы в следующую сессию. Третья коррекция не открывает форму по snapshot сохранения. Chromium/WebKit не запускались. T04 остаётся `PARTIAL`. См. evidence R05–R07.
- **Отчёт:** G, отдельно fields и photo evidence.

### R07. Единые query keys и invalidation для owner Work

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/owner-work-cache`.
- **Findings:** D05.
- **Dependencies:** R05.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/product-draft-screen.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/author-cabinet-screen.tsx`.
- **Phase 0:** составить mutation→resource matrix для create/update/submit/upload/delete/reorder; найти всех consumers старого `['seller','products']`.
- **Исправить:** заменить неработающие invalidation ключами фактического cabinet/detail cache. Вынести только используемые owner Work keys в один feature-owned module.
- **Механизм:** React Query query keys, `setQueryData` при наличии полного валидного response, точечная `invalidateQueries`.
- **Не менять:** public cache policy, все query keys приложения, staleTime ради маскировки.
- **Инварианты:** cabinet обновляется без remount; media preview и status согласованы; нет широкого invalidate-all и второго fetch owner.
- **Тесты:** retained cabinet после save/submit/media change; unrelated cache не invalidated; detail dirty form сохраняется.
- **Validation:** V-MOBILE; cabinet/editor browser scenario.
- **STOP:** невозможно определить owner ресурса без изменения API.
- **Done/status:** D05 → `VERIFIED`.
- **Actual:** D05 → `NEEDS_VERIFICATION`. Cabinet обновляется по реальным owner keys в unit-тесте. Коррекция 2026-09-29 не даёт чтению профиля или работ записать private cache без текущей сессии. Вторая коррекция не даёт старому detail откатить более новое решение модератора. Третья коррекция отменяет detail reads, начатые до submit, и не пишет `{ product }` поверх envelope. Browser scenario не запускался. См. evidence R05–R07.
- **Отчёт:** G с mutation→key matrix.

### R08. Протянуть cancellation до fetch

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/query-request-cancellation`.
- **Findings:** L04.
- **Dependencies:** нет; включать после R07 при пересечении файлов.
- **Начать:** `/Users/yayauheny/projects/bidplace/packages/api-client/src/request.ts`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/products/use-portfolio-works.ts`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/use-portfolio-authors.ts`.
- **Phase 0:** проследить QueryFunctionContext → client method → JSON/blob fetch; проверить обработку AbortError.
- **Исправить:** добавить optional `signal?: AbortSignal` в request options и поддерживающие client methods; передавать Query signal в поисковые/catalog queryFn.
- **Замена:** стандартный AbortSignal и React Query cancellation вместо продолжающихся obsolete requests. Общую сборку URL/headers для JSON/blob объединить узко, сохранив разные response parsers.
- **Не менять:** mutation cancellation, retry policy всего приложения, cache identity.
- **Инварианты:** старые вызовы совместимы; abort не показывается как infrastructure failure и не логируется как network defect; HTTP/Zod errors сохраняют классификацию.
- **Тесты:** signal доходит до fetch; rapid query switch/unmount; abort JSON/blob; реальная network error; malformed response.
- **Validation:** api-client V-PACKAGE, V-MOBILE, Search browser scenario.
- **STOP:** generic wrapper начинает скрывать различия JSON/blob/error handling.
- **Done/status:** L04 → `VERIFIED`.
- **Отчёт:** G с request cancellation evidence.

### Wave 3 — dead code/dependencies

### R09. Удалить подтверждённый mobile dead code вместе с его тестами

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/mobile-unused-code`.
- **Findings:** mobile часть C01; dead-helper часть T02.
- **Dependencies:** R01, R05–R07.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/products/CatalogGrid.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/products/product-about.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/layout/SessionAlert.tsx` и platform variant.
- **Phase 0:** повторить route/import/export graph с platform resolution и dynamic references. По targeted review PR #12 отдельно перепроверить `OverlayPortal` и его positioning helpers в `overlay-geometry.ts`, а также subtree `FilterMenu` → `focusable-anchor`. Различать barrel/module import и реальный render/call path; смонтированный `OverlayHost` не считать unreachable целиком из-за отсутствия consumers `OverlayPortal`.
- **Разрешённые кандидаты:** перечисленные компоненты; `lib/formatters.ts`, `lib/canonical-share-url.ts`, `lib/media.ts`; `button-layout.ts`, `ambient-image-background-style.ts` и `ambient-image-background-style.spec.ts`; старые `auth-layout`, `form-page-layout`, `author-layout`, `catalog-layout`; неиспользуемый direct re-export `CreatorCardGrid`; `OverlayPortal`, `getBottomEndPosition`/`getBottomStartPosition` из `overlay-geometry.ts` и относящиеся к ним tests; `FilterMenu` → `focusable-anchor` (`assignFocusableAnchorRef`, `FocusableAnchor`), если повторная проверка подтверждает unreachable status. Сейчас это только кандидаты R09: никаких удалений при обновлении roadmap.
- **Исправить:** удалить только подтверждённые unreachable symbols/files и ставшие бессмысленными тесты/barrel exports.
- **Замена:** отсутствует — ответственность уже отсутствует либо выполняется действующим кодом.
- **Не менять:** routes, active error UI, Figma masters, runtime-compatible adapters.
- **Тесты:** оставшийся mobile suite; каждый удалённый test сопоставлен удалённому production symbol.
- **Validation:** V-MOBILE, V-DIFF, повторный consumer search.
- **STOP:** найден route/platform/dynamic consumer.
- **Done/status:** C01/T02 → `PARTIAL`.
- **Отчёт:** G плюс таблица deleted symbol → reachability evidence → removed test.
- **Actual (2026-10-01):** подтверждённые unreachable mobile files и symbols удалены после повторного consumer inventory. Сохранены смонтированный `OverlayHost` без portal, живой `CreatorCardGrid`, `FigmaIconButton`, reactive `useReducedMotion`, `publicShareTarget`/`ShareSheet`, `advanceAuthEpoch`, analytics `*ForTests`, Playwright `e2e/auth-layout.spec.ts` и `use-dismissible-overlay`. `AppIcon` оставлен для `x` в `AppDialog`. C06 удалён. C01 по списку R09 выполнен. T02 остаётся `PARTIAL` до R28.

### R10. Удалить server/package leftovers и фиктивный image-select параметр

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/backend-unused-surfaces`.
- **Findings:** backend часть C01; C02; backend часть C04; связанные dead-code tests из T02.
- **Dependencies:** R04.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/api/src/users/users.module.ts`; `/Users/yayauheny/projects/bidplace/apps/api/src/images/images.service.ts`, `requireEditableOwner`; `/Users/yayauheny/projects/bidplace/packages/api-client/src/errors/index.ts`.
- **Phase 0:** inventory consumers внутри workspace, exports, scripts и external publication status.
- **Удалить при подтверждении:** пустой unimported UsersModule; `images/image-url.ts`; `products/product-state.ts` re-export; `getBidTooLowMinimum`; `sellerProfileHandoffSelect`; никогда не создаваемый `RevisionMediaStorageError` и связанный dead catch; неиспользуемые exports из `public-product.ts`/`public-seller.ts`.
- **C04:** удалить `_imageSelect` и его forwarding arguments; оставить реальный select и guards.
- **Не менять:** active legacy endpoints — R26; commerce schema/contracts с consumers; error semantics действующих adapters.
- **Инварианты:** permission checks и data selection не расширяются; exported contracts не удаляются при неизвестных consumers.
- **Тесты:** package exports/contract checks; media permission tests; убрать только тесты удалённых symbols.
- **Validation:** V-API, contracts/api-client V-PACKAGE, V-MOBILE.
- **STOP:** внешний consumer или активное использование legacy contract.
- **Done/status:** C01 → `VERIFIED` после R09; C02 → `VERIFIED` только для полного подтверждённого scope, иначе `PARTIAL` с blocker; C04 → `PARTIAL`.
- **Отчёт:** G и consumer evidence для каждого удалённого export.
- **Actual (2026-10-01):** подтверждённые API и package leftovers удалены. `_imageSelect` и forwarding удалены; реальный select, authz до decode, `FOR UPDATE`, listing blockers и approved seller checks сохранены. `putStoredImage` больше не переводит никогда не бросаемый `RevisionMediaStorageError`; вызов `ImageStore` и границы транзакций сохранены. Действующие portfolio visibility predicates и `publicAuthorCityWhere` сохранены. Persistence parsers Seller/Product/Listing оставлены: на текущем HEAD и в archive `19eb40e` их consumers — только spec и barrel. C01 по спискам R09 и R10 выполнен. C02 → `PARTIAL`. C04 → `PARTIAL` до R13: `compact` не менялся.

### R11. Удалить неиспользуемые fonts и лишние direct dependencies

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/mobile-dependency-cleanup`.
- **Findings:** C03.
- **Dependencies:** R09.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/package.json`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/app/_layout.tsx`; `/Users/yayauheny/projects/bidplace/packages/design-tokens/src`.
- **Phase 0:** проверить route layout фактическим файловым поиском, font consumers, CSS/native references, pnpm dependency reasons и Metro config.
- **Исправить:** удалить Onest loading и dependency при отсутствии consumers. Проверить неиспользуемые font weights отдельно. Удалить direct declarations `fbjs`, `inline-style-prefixer`, `memoize-one`, `nullthrows`, `postcss-value-parser`, `styleq`, `@react-native/normalize-colors` только после доказательства, что resolver не требует их на app level.
- **Замена:** ownership зависимостей их реальным package consumer; используются существующие Inter tokens.
- **Не менять:** React Native peer dependencies, `react-native-screens`, font geometry, framework versions.
- **Тесты:** clean-install resolution, web export, native bundle resolution; font rendering без fallback.
- **Validation:** frozen-lockfile install в изолированном checkout, V-MOBILE, safe native export/bundle check.
- **STOP:** Metro/native resolution требует direct dependency — сохранить и задокументировать причину.
- **Done/status:** C03 → `VERIFIED` после проверки всех кандидатов; оставленные обоснованные dependencies не считаются потерянным scope.
- **Отчёт:** G с removed/retained dependency matrix.
- **Actual (2026-10-01):** Onest 400/500/600/700 and `Inter_700Bold` are removed from `useFonts`. `@expo-google-fonts/onest` is removed. Inter 400/500/600 stay registered under the same family names. Direct `fbjs`, `inline-style-prefixer`, `memoize-one`, `nullthrows`, `postcss-value-parser`, `styleq`, and `@react-native/normalize-colors` are removed from the mobile manifest; `react-native-web@0.21.2` still depends on them. The Inter package barrel still emits unused weight files, including `Inter_700Bold`, into the export. C03 → `NEEDS_VERIFICATION`: frozen install and web/iOS/Android export passed; font rendering was not checked.

### R12. Исправить dependency ownership и React types

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/workspace-dependency-contracts`.
- **Findings:** C05.
- **Dependencies:** R11.
- **Начать:** `/Users/yayauheny/projects/bidplace/packages/api-client/package.json`; root и mobile `package.json`; installed React Native peer metadata.
- **Phase 0:** подтвердить прямой Zod import и versions React/RN/types.
- **Исправить:** явно объявить Zod в api-client с принятой workspace версией; согласовать `@types/react`/`@types/react-dom` с установленным React 19 и RN peer requirements.
- **Замена:** корректные manifests вместо root-hoisting и несовместимых type packages.
- **Не менять:** React/RN/Expo runtime versions; не использовать casts/suppressions для устранения новых ошибок.
- **Тесты:** isolated package build, workspace typecheck, web/native resolution.
- **Validation:** V-PACKAGE(api-client), V-API, V-MOBILE, frozen-lockfile install.
- **STOP:** обновление types требует широкого runtime refactor — отдельный разбор конкретного incompatibility.
- **Done/status:** C05 → `VERIFIED`.
- **Отчёт:** G с versions до/после и без скрытых type errors.
- **Actual (2026-10-01):** `@bidplace/api-client` declares `zod` `^3.24.2`, resolved as `3.25.76`. Root and mobile use `@types/react` `~19.2.18` and `@types/react-dom` `~19.2.7`. Runtime React, React Native, and Expo versions are unchanged. Mobile typecheck passed with no source edits. `@types/react@18.3.31` remains only because `@types/react-test-renderer@19.1.0`, a dependency of `react-native-gesture-handler`, depends on it. C05 → `VERIFIED`.

### R13. Сделать `compact` работающим button API

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/button-compact-size`.
- **Findings:** UI часть C04.
- **Dependencies:** R09.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/ui/Button.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/figma/FigmaButton.tsx`.
- **Phase 0:** перечислить actual compact callers и проверить canonical size variant.
- **Исправить:** удалить `void compact`; передать существующий `FigmaButton size="compact"`. Правило: `compact=true` выбирает compact; иначе сохраняется существующий `size`.
- **Замена:** существующий primitive variant вместо ignored option и отдельных размеров.
- **Не менять:** token values, button variants, loading/disabled behavior, все call sites без необходимости.
- **Тесты:** real wrapper→primitive behavior для compact/default/explicit size, disabled/loading; admin controls visual check.
- **Validation:** V-MOBILE; соответствующий browser UI check на 390/1024/1440.
- **STOP:** canonical design не допускает compact у реального consumer.
- **Done/status:** C04 → `VERIFIED` после R10+R13.
- **Отчёт:** G с проверенными callers и сохранёнными semantics.
- **Actual (2026-10-01):** `PrimaryButton`, `SecondaryButton`, and `DestructiveButton` pass `size={compact ? 'compact' : size}` into the existing `FigmaButton`. `compact=true` selects that compact size, including when an explicit size is also passed. Omitted or `false` keeps the explicit size, and neither keeps the primitive default `regular`. Disabled and loading still block the action. Tokens, variants, width, and call sites are unchanged. Real callers are the admin moderation approve, request-changes, reject, and suspend actions. `TextButton` still does not read `compact`. The canonical buttons package `292:5058` shows the outline/black primary set; the compact measurements already exist on `FigmaButton` and were not invented here. `Button.spec.ts` renders the real `FigmaButton` style path: 6 tests passed. Browser checks at 390/1024/1440 were not run, so C04 → `NEEDS_VERIFICATION`, not `VERIFIED`.

### Wave 4 — framework/library simplification

### R14. Передать dialog focus lifecycle установленному primitive

- **Модель:** Sol High.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/dialog-focus-lifecycle`.
- **Findings:** L01.
- **Dependencies:** R01, R09.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/ui/AppDialog.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/layout/use-overlay-focus-trap.ts`; installed `@rn-primitives/dialog`.
- **Phase 0:** проверить installed web/native implementations, `forceMount`, exit animation и actual portal ownership.
- **Удалить:** глобальный `document.querySelector('[role="dialog"] …')`, recursive autofocus/restore timers и дублирующий focus lifecycle внутри AppDialog.
- **Заменить:** `Dialog.Content` lifecycle — `onOpenAutoFocus`, `onCloseAutoFocus`, Escape/outside interaction callbacks; scoped refs там, где trigger не является Dialog.Trigger.
- **Почему проще:** focus привязан к конкретному dialog и его mount lifecycle; нет глобального поиска и поздних timer callbacks.
- **Сохранить:** initial focus, trap, return focus без scroll jump, disconnected trigger handling, sheet exit animation, один close.
- **Не менять:** Search URL/history, самостоятельное popover positioning; не заменять Search portal без доказательства совместимости.
- **Тесты:** keyboard cycle, reopen, rapid close, multiple dialogs, unmounted trigger, reduced motion, native fallback.
- **Validation:** V-MOBILE, dialog/share/profile browser scenarios Chromium/WebKit.
- **STOP:** primitive не сохраняет обязательные semantics — Plan для затронутого consumer, без временных таймерных обходов.
- **Done/status:** L01 → `VERIFIED` только при отсутствии конкурирующих owners внутри мигрированного dialog.
- **Отчёт:** G с removed mechanism → primitive API → semantic tests.
- **Actual (2026-10-01):** `AppDialog` no longer searches `document.querySelector('[role="dialog"] …')` and no longer runs its own autofocus or restore timers. `@rn-primitives/dialog` `1.5.2` owns initial focus, the Tab loop, Escape, and outside dismiss. These dialogs open without `Dialog.Trigger`, and the installed modal content cancels the scope's previous-element restore, so `onCloseAutoFocus` prevents that default and focuses the captured opener with `{ preventScroll: true }` only while this instance is still closed. A reopen before that unmount callback does not steal focus. `useOverlayFocusTrap` stays for Search and `FilterSheet`. Search URL, history, positioning, and portal were not changed. Web tests load `dialog.web.mjs` and native tests load `dialog.mjs` in jsdom: 8 web tests and 1 native test passed. Sheet exit remains `SlideOutDown` with `ReduceMotion.System`. Chromium, WebKit, and a native device were not run, so L01 → `NEEDS_VERIFICATION`.
- **Correction (2026-10-01):** Two return-focus gaps remained. A reopen before the deferred close callback stored `document.body` over the captured opener, so the next close left focus on `body`. Unmounting an open `AppDialog` without `open=false` left `openRef` true, so that callback returned after `preventDefault` and did not restore a connected opener. `onOpenAutoFocus` now keeps the previous opener when the active element is `body`, `documentElement`, disconnected, or already inside the dialog. The close callback skips restore only while this same instance is still mounted and open. Before the change, those two new web cases failed on `body`; a completed close followed by a different opener already returned to that opener. After: `AppDialog.spec.ts` 11 passed and `AppDialog.native.spec.ts` 1 passed. Chromium, WebKit, and a device were not run, so L01 stays `NEEDS_VERIFICATION`.

### R15. Упростить author form средствами RHF/Zod

- **Модель:** Sol High.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/author-form-ownership`.
- **Findings:** основная часть L02.
- **Dependencies:** R03, R06.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/seller-profile-screen.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/seller-profile-steps.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/profile-validation.ts`.
- **Phase 0:** сопоставить ручные errors/normalization с shared Zod contracts и wizard-stage validation.
- **Удалить:** дублирующую форму field errors, широкое root watch там, где достаточно field subscription, разрозненные submit chains.
- **Заменить:** установленный `@hookform/resolvers`, RHF `FormProvider`, `useController`/`useWatch`, `handleSubmit`; server schema остаётся окончательным validator.
- **Сохранить:** stage-specific обязательность, raw input до нормализации, public-link semantics, save reconciliation R06, media state.
- **Не менять:** approved/review state machine, UI geometry, API payload meanings.
- **Тесты:** field errors, stage transition, save/submit failure, normalization, approved revision editing, R06 race.
- **Validation:** V-MOBILE и profile/revision E2E.
- **STOP:** reuse server schema запрещает допустимый промежуточный draft — не ужесточать form contract.
- **Done/status:** L02 → `PARTIAL` до R16.
- **Отчёт:** G с удалёнными параллельными owners формы.
- **Actual (2026-10-01):** `seller-profile-screen.tsx` no longer watches the whole profile draft or derives field errors with `getProfileFieldErrors`. `profileDraftSchema` and `zodResolver` own those errors. `SellerProfileFormSteps` subscribes with `useController`. The screen watches only slug, full name, country, city, discipline, and short description for step gating. Writes call `setValue` after `transitionLock.current` is checked, because `field.onChange` awaits the resolver and the rendered dirty snapshot lags. `getProfileFieldErrors` remains a spec adapter over the same schema. Save, submit, step, exit, logout, photo, and achievements stay on the screen. `handleSubmit` was not introduced. Commit `8b8d7ba`. That commit left L02 partial. R16 below moves it to `NEEDS_VERIFICATION`.
- **Correction (2026-10-01):** Save and exit on `8b8d7ba` still followed `formState.errors` from the previous resolver pass. A saved Telegram replaced by `bad handle` was sent as `telegramUrl: null`. A corrected `@maker_art`, closed before that pass finished, left without `updateProfile`. `profileDraftAllowsSave` now runs `profileDraftSchema.safeParse` on the raw snapshot that save sends and on the snapshot that chooses save-before-exit. Displayed field errors stay on `zodResolver`. The screen also subscribes to Telegram, Instagram, website, public email, and `socialLink` so that gate re-renders with the draft. Ordinary Save still does not take the transition lock. No await was added before the mutation. L02 stays `NEEDS_VERIFICATION`.

### R16. Убрать Work form prop drilling

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/work-form-field-ownership`.
- **Findings:** оставшаяся часть L02.
- **Dependencies:** R05, R15.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/product-draft-screen.tsx`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/product-draft-about.tsx`.
- **Phase 0:** инвентаризировать value/onChange пары и реальные field subscriptions.
- **Исправить:** локальные поля получают RHF control/context вместо длинного набора callback props; feature orchestration остаётся в screen/hook.
- **Замена:** `FormProvider`/`useController`; не создавать generic form framework.
- **Не менять:** payload builder, persistence ordering, route navigation, media list ownership.
- **Инварианты:** один RHF model; один Query owner server detail; R05 race fix сохраняется.
- **Тесты:** field update/validation, draft hydration, save-before-submit, dirty refetch и delayed-save regression.
- **Validation:** V-MOBILE, Work editor E2E.
- **STOP:** extraction требует объединения разных forms или новой abstraction layer.
- **Done/status:** L02 → `VERIFIED` после R15+R16.
- **Отчёт:** G с сокращением field plumbing без изменения поведения.
- **Actual (2026-10-01):** About, story, and review no longer take value or change props. `ProductDraftTextField` subscribes with `useController` and writes through `setValue` after the same transition lock. Review watches title and story. The screen watches title for the step header. Empty title and category stay valid in `productDraftFormSchema`; `productDraftRequiredErrors` still gates the creation about action, and the year message still appears only after that attempt. Payload builder, media list, hydration, and save-before-submit stay on the screen. No shared form engine. Commit `3066bd4`. Browser and Work editor E2E were not run, so L02 → `NEEDS_VERIFICATION`, not `VERIFIED`.

### R17. Разбирать config стандартным Node API один раз

- **Модель:** Sol High.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/config-bootstrap-ownership`.
- **Findings:** L03.
- **Dependencies:** R04.
- **Начать:** `/Users/yayauheny/projects/bidplace/packages/config/src/index.ts`; `/Users/yayauheny/projects/bidplace/apps/api/src/core/config/env.ts`; consumers в analytics, OTP и password-reset.
- **Phase 0:** составить precedence/security matrix; проверить Node 22 `util.parseEnv` и существующий Nest config boundary.
- **Удалить:** handwritten line parser и повторную загрузку/валидацию полного env из request paths.
- **Заменить:** Node `util.parseEnv`; однократная bootstrap validation через Zod; typed immutable value provider средствами Nest DI.
- **Почему проще:** один parser, один validated config instance, отсутствие filesystem work и process.env mutation на запрос.
- **Сохранить:** explicit env override, precedence process env над файлом, production fail-closed, SMTP/S3 requirements, test-bypass запреты.
- **Не менять:** реальные `.env`, secret values, deployment defaults; не добавлять `@nestjs/config`.
- **Тесты:** synthetic parser fixtures, quoting/comments, precedence, NODE_ENV×APP_ENV, startup failure, config injection, отсутствие повторного load на requests.
- **Validation:** config V-PACKAGE с добавленным test script при необходимости; V-API; auth/OTP/reset integration regression.
- **STOP:** обнаружено неоговорённое различие parser semantics для поддерживаемого input — описать compatibility решение до замены.
- **Done/status:** L03 → `VERIFIED`.
- **Actual (2026-10-01):** выполнено на `fix/config-bootstrap-ownership` от `6c0fac75`. Parser — commit `5da6564`. Ownership и DI — commit `df145ad`. Ведущий BOM — commit `662a9fe`. L03 → `VERIFIED`. См. R17 evidence. R15, R16 и R18 не изменялись.
- **Отчёт:** G с precedence matrix и security checks.

### Wave 5 — performance/read models

### R18. Сузить selectors image authorization и portfolio Work

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/narrow-read-selectors`.
- **Findings:** D06.
- **Dependencies:** R10.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/api/src/images/images.service.ts`, `get`; `/Users/yayauheny/projects/bidplace/apps/api/src/products/products.mapper.ts`, portfolio select/mapper.
- **Phase 0:** сопоставить каждое выбранное поле с auth check и output mapper.
- **Удалить:** biography/achievements из image auth selection; discarded legacy parent/gallery поля из portfolio selection.
- **Заменить:** purpose-specific Prisma `select` с inferred payload types.
- **Не менять:** visibility predicates, response JSON, cache headers, published revision choice.
- **Тесты:** owner/admin/public/stranger media access; public Work response equivalence; pending media не раскрываются.
- **Validation:** V-API, V-INTEGRATION; query trace/selected-data comparison на synthetic fixture.
- **STOP:** mapper неявно зависит от удаляемого поля — сначала выяснить реальный owner.
- **Done/status:** D06 → `VERIFIED`.
- **Отчёт:** G с полями до/после и semantic equivalence.
- **Actual (2026-10-01):** `ImagesService.get` selects `productImageAuthorizationSelect`: revision membership, product status, `publishedRevisionId`, and seller `userId`/`status`. It no longer spreads `publicSellerProfileSelect`. `portfolioCatalogProductSelect` is now its own read: `id`, `publicId`, `publishedAt`, `publicSellerProfileSelect`, and `publishedRevision` gallery. The unused wide `publicCatalogProductSelect` spread is gone. Owner `productSelect` is unchanged. Visibility predicates, published-revision content, cache headers, and DTO mapping are unchanged. `sellerType` and `socialLink` stay in the seller select because `toPublicSellerProfile` still reads them; the public Work schema still omits them. Before the change, image authorization also loaded biography and published achievements, and portfolio hydration also loaded parent scalars and the parent image relation. After: a synthetic fixture with an 80_000-character biography, eight 4_000-character achievements, a 60_000-character parent story, and a parent gallery distinct from the published gallery kept the same public Work JSON and media decisions. Prisma JSON for the image authorization select was more than 80_000 bytes smaller and did not contain the biography or achievement markers. Prisma JSON for the portfolio select was more than 50_000 bytes smaller, omitted the parent story marker and the parent-only image id, and still contained the published image id. No timing claim. Node v22.20.0 / pnpm 11.7.0. `BIDPLACE_ENV_FILE=/dev/null pnpm exec turbo run typecheck build --filter='@bidplace/api...'` exit 0. `pnpm --filter @bidplace/api lint` exit 0. Unit tests excluding `env.spec.ts`: 47 files, 273 tests, exit 0. `env.spec.ts` with `BIDPLACE_ENV_FILE` unset: 33 tests, exit 0; lookups stay on `/repo/missing.env` and synthetic paths. Integration on local disposable `bidplace_integration` isolated `itest_` schemas: 23 files, 77 tests, exit 0. `git diff --check` exit 0. Browser not run. R23 remains open.

### R19. Ограничить moderation reads

- **Модель:** Sol High.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/moderation-bounded-reads`.
- **Findings:** moderation часть D07.
- **Dependencies:** R02, R18.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/api/src/admin/admin-moderation.service.ts`, list methods и `latestModerationReasons`; `/Users/yayauheny/projects/bidplace/packages/contracts/src/admin.ts`; admin client/UI.
- **Phase 0:** проверить consumers, текущую сортировку и status filters.
- **Исправить:** admin-only cursor pagination: default 50, maximum 100, стабильный порядок `createdAt,id`; server-side фильтрация review/visibility по модели R02. Сохранить именованные массивы ответа, добавить `nextCursor`, обновить всех first-party callers.
- **Latest reasons:** получать последний non-null reason только для targets текущей страницы одним DB query.
- **Механизм:** Prisma pagination/parameterized SQL для latest-per-target; без JS scan всей audit history.
- **Не менять:** moderation transitions и append-only audit; public list APIs.
- **Инварианты:** pagination не теряет/не дублирует одинаковые timestamps; review фильтр использует revision; actions обновляют нужную страницу/cache.
- **Тесты:** empty/multiple pages, status filters, tied timestamps, latest non-null reason, permission guard.
- **Validation:** V-API, contracts/api-client checks, V-MOBILE, integration и moderation browser.
- **STOP:** найден независимый admin consumer, которому нужен compatibility rollout.
- **Done/status:** D07 → `PARTIAL`.
- **Отчёт:** G с bounded query evidence.

### R20. Перенести analytics aggregation в БД

- **Модель:** Sol High.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/analytics-database-aggregation`.
- **Findings:** analytics часть D07.
- **Dependencies:** R18.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/api/src/admin/admin-analytics.service.ts`, `overview`; canonical analytics metric documents.
- **Phase 0:** зафиксировать определения всех metrics, timezone/date boundaries, attribution semantics и fixtures.
- **Удалить:** загрузку всех raw dates/events/attributions исключительно ради JS группировки.
- **Заменить:** Prisma count/groupBy и parameterized SQL aggregates там, где требуется time bucketing.
- **Не менять:** metric definitions, response contracts, permissions, attribution rules.
- **Инварианты:** одинаковые totals, null handling, границы периода и zero buckets; admin-only доступ.
- **Тесты:** before/after reference fixtures, empty data, boundary timestamps, multiple attribution rows; synthetic объём с bounded result size.
- **Validation:** V-API, V-INTEGRATION; reproducible query/data-volume comparison.
- **STOP:** обнаружена неоднозначность metric semantics — отдельное решение, без «оптимизации» смысла.
- **Done/status:** D07 → `PARTIAL`.
- **Отчёт:** G с semantic equivalence и объёмом выбранных строк.

### R21. Убрать full-table загрузки для facets

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/catalog-facet-reads`.
- **Findings:** facets часть D07.
- **Dependencies:** R18.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/api/src/portfolio/portfolio.service.ts`, `facets`; `/Users/yayauheny/projects/bidplace/apps/api/src/products/products.service.ts`; `/Users/yayauheny/projects/bidplace/apps/api/src/sellers/sellers.service.ts`.
- **Phase 0:** проверить materials/city/discipline normalization, public visibility и порядок результата.
- **Исправить:** выбирать уникальные значения на уровне БД; для массивов использовать parameterized SQL unnest/distinct, если Prisma не даёт нужной операции.
- **Не менять:** normalizer semantics, фильтры, taxonomy, product schema.
- **Инварианты:** draft/hidden/suspended сущности не добавляют public facets; trim/case/dedup/order совпадают.
- **Тесты:** duplicates, blanks/nulls, arrays, mixed case, unpublished revisions, suspended authors.
- **Validation:** V-API, portfolio filters integration; synthetic high-row-count fixture.
- **STOP:** оптимизация требует data migration или изменения нормализации.
- **Done/status:** D07 → `VERIFIED` только после R19–R21.
- **Отчёт:** G с bounded reads и equality результата.

### Wave 6 — архитектурные решения

### R22. DB/S3 consistency

- **Модель:** Sol High.
- **Режим:** сначала Plan, применить P.
- **Base:** B.
- **Branch после разрешения записать решение:** `feature/media-consistency-plan`.
- **Findings:** A01; storage часть T04.
- **Dependencies:** R10, R18.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/api/src/core/image-store/image-store.ts`; `s3-image-store.ts`, `postgres-image-store.ts`; `/Users/yayauheny/projects/bidplace/apps/api/src/images/images.service.ts`; seller media paths.
- **Phase 0:** перечислить external writes внутри retryable DB transactions; воспроизвести failure/retry на fake store без внешнего S3.
- **Варианты:** immutable object write до commit + надёжная cleanup; DB-persisted cleanup intent/outbox с worker на существующем stack; временное сохранение storage-specific flows с явными guarantees.
- **Сравнить:** orphan tolerance, lost-byte risk, retry idempotency, locks/network latency, crash recovery, operational cost.
- **Предпочтение для исследования:** immutable keys + durable postcommit cleanup; не выдавать это за принятое решение.
- **Не менять:** production adapters, schema, keys, existing objects.
- **Инварианты:** rollback не уничтожает опубликованные bytes; retry не повреждает объект; shared object не удаляется при наличии references; privacy сохраняется.
- **Acceptance/tests будущей реализации:** commit failure after put/delete, process crash, retry, duplicate cleanup, shared references, оба providers.
- **Validation сейчас:** existing image-store unit tests через безопасный API test harness; read-only call graph.
- **STOP:** нужен внешний storage access или не определены retention/cleanup guarantees.
- **Status:** `DECISION_REQUIRED`; T04 не закрывать.
- **Отчёт:** P с конкретной failure matrix и будущими небольшими scopes.

### R23. Consistency публичного catalog при hide/suspend

- **Модель:** Sol High.
- **Режим:** сначала Plan, применить P.
- **Base:** B.
- **Branch:** `feature/catalog-consistency-plan`.
- **Findings:** A02; concurrent visibility часть T04.
- **Dependencies:** R18, R21.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/api/src/products/products.service.ts`, `listPortfolio`; `/Users/yayauheny/projects/bidplace/apps/api/src/sellers/sellers.service.ts`, public list; соответствующие catalog query modules.
- **Phase 0:** детерминированно описать IDs read → concurrent hide → detail fetch; отдельно уточнить response-time и snapshot-time guarantees.
- **Варианты:** единый SQL read; consistent transaction snapshot; повторный visibility predicate во втором fetch.
- **Trade-offs:** query complexity, snapshot staleness, totals/page underfill, isolation cost.
- **Не менять:** isolation глобально, public semantics без решения, cache policy.
- **Инварианты:** не возвращать draft/private fields; выбранная consistency гарантия явно определена.
- **Acceptance/tests:** управляемое concurrency interleaving для hide и suspend, published revision change, total/page consistency.
- **Validation сейчас:** read-only query inspection; существующие catalog unit tests.
- **STOP:** требование «немедленно скрывать» конфликтует с выбранной snapshot semantics.
- **Status:** `DECISION_REQUIRED`; T04 остаётся частично blocked.
- **Отчёт:** P, без заявления о воспроизведённой утечке, пока нет runtime evidence.

### R24. Parent/revision ownership и границы Work modules

- **Модель:** Sol High.
- **Режим:** сначала Plan, применить P.
- **Base:** B.
- **Branch:** `feature/revision-ownership-plan`.
- **Findings:** A03, S01.
- **Dependencies:** R02, R18–R21.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/api/src/products/products.service.ts`; `/Users/yayauheny/projects/bidplace/apps/api/src/sellers/sellers.service.ts`; `/Users/yayauheny/projects/bidplace/apps/api/src/portfolio/portfolio.service.ts`; revision mappers/guards.
- **Phase 0:** field ownership matrix для create/fork/update/submit/publish/read; карта routes→services→tables; inventory cross-feature helper imports.
- **Варианты:** сохранить parent projection с одним writer; revision как canonical content с явными read models; staged extraction revision use cases без немедленной смены persistence.
- **Сравнить:** migration/backfill, compatibility, write amplification, divergence risk, rollback, размер независимых scopes.
- **S01:** предложить владельца owner Work detail/cabinet/write responsibilities и нейтральное место реально общего SQL escaping helper.
- **Не менять:** Product/Seller naming по всему repo, generic repositories, публичные URL, schema.
- **Инварианты:** published revision стабильна до approval; owner видит editable revision; guards/locks остаются у write boundary.
- **Acceptance/tests будущей реализации:** field parity на fork/publish; reject/recover; achievements/media; ownership/visibility; transaction atomicity.
- **Validation сейчас:** read-only dependency graph и existing mapper/state tests.
- **STOP:** различие моделей Product/Seller пытаются устранить без доказанной одинаковой семантики.
- **Status:** A03/S01 → `DECISION_REQUIRED`.
- **Отчёт:** P с поэтапной миграцией ownership, без большого rename PR.

### R25. Dirty navigation и browser history

- **Модель:** Sol High.
- **Режим:** сначала Plan, применить P.
- **Base:** B.
- **Branch:** `feature/dirty-navigation-plan`.
- **Findings:** A04.
- **Dependencies:** R05, R06, R14.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/features/sellers/product-draft-screen.tsx`; `/Users/yayauheny/projects/bidplace/patches/expo-router@57.0.4.patch`; `/Users/yayauheny/projects/bidplace/apps/mobile/e2e/back-navigation-lifecycle.spec.ts`.
- **Phase 0:** проверить installed public navigation APIs; отделить route removal, browser Back/Forward, refresh, overlay history и exit-save.
- **Варианты:** public supported prevent-remove integration; изолированный browser-history adapter с явной state machine; сохранение текущего механизма до доступного framework API.
- **Сравнить:** web/native parity, history entry count, async save failure, double navigation, inactive-screen focus.
- **Не менять:** Expo patch автоматически; framework version; Search URL session; back fallback.
- **Инварианты:** один переход на действие; failed save оставляет пользователя; Back/Forward не зацикливается; hidden screen inert; отсутствие flicker.
- **Acceptance/tests:** dirty/clean Back, Forward, refresh, close, save failure, rapid double Back, Search restore, native back.
- **Validation сейчас:** API inspection и существующие navigation tests в безопасном окружении.
- **STOP:** нет поддерживаемого API, сохраняющего все обязательные semantics — документировать retention, не делать обход.
- **Status:** `DECISION_REQUIRED`.
- **Отчёт:** P с navigation transition table и критериями удаления internal import/ручной history логики.

### R26. Retirement старых активных API

- **Модель:** Sol High.
- **Режим:** сначала Plan, применить P.
- **Base:** B.
- **Branch:** `feature/legacy-api-retirement-plan`.
- **Findings:** A05.
- **Dependencies:** R10, R24.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/api/src/products/products.controller.ts`, creation-story routes; `/Users/yayauheny/projects/bidplace/apps/api/src/sellers/sellers.controller.ts`, `listProducts`; images creation-step routes и api-client exports.
- **Phase 0:** route inventory, in-repo consumers, scripts, tests, published client compatibility; отсутствие UI consumer не считать доказательством отсутствия внешних клиентов.
- **Варианты:** оставить поддерживаемый legacy API; deprecate с измерением usage; удалить runtime после подтверждения отсутствия consumers, сохранив данные.
- **Сравнить:** поддержка, security surface, compatibility window, migration cost, возможность rollback.
- **Не менять:** endpoints, persisted story/media, commerce history.
- **Инварианты:** данные не удаляются вслед за route; permissions не ослабляются; existing clients получают согласованный retirement contract.
- **Acceptance/tests будущей реализации:** route surface, removed client methods, owner/private behavior, сохранность данных, negotiated 404/410 policy.
- **Validation сейчас:** route/consumer search и existing route-surface tests.
- **STOP:** отсутствует решение о поддерживаемых consumers/сроках retirement.
- **Status:** `DECISION_REQUIRED`.
- **Отчёт:** P с endpoint-by-endpoint decision, без автоматического удаления.

### R27. Ownership UI masters и исторические имена папок

- **Модель:** Terra Medium.
- **Режим:** сначала Plan, применить P.
- **Base:** B.
- **Branch:** `feature/ui-module-ownership-plan`.
- **Findings:** S02.
- **Dependencies:** R09, R13, R14.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/ui`; `/Users/yayauheny/projects/bidplace/apps/mobile/src/components/figma`; `/Users/yayauheny/projects/bidplace/packages/design-tokens/src`.
- **Phase 0:** различить production masters, wrappers и aliases; проверить, что здесь не две независимые дизайн-системы.
- **Варианты:** сохранить пути и документировать ownership; нейтрально переименовать только вводящие в заблуждение modules; поэтапно перенести masters за стабильный public barrel.
- **Сравнить:** реальная понятность, import churn, merge conflicts, compatibility, ценность после удаления dead code.
- **Не менять:** визуальные значения, tokens, Pen/Figma sources, все имена ради единообразия.
- **Инварианты:** один master на роль, один semantic token layer, отсутствие новых compatibility wrappers.
- **Acceptance:** рекомендуемый вариант объясняет ownership без создания второй структуры.
- **Validation сейчас:** import graph и public export inventory; implementation tests пока не нужны.
- **STOP:** выигрыш сводится к косметическому rename — рекомендовать `DEFERRED` с условием возврата.
- **Status:** `DECISION_REQUIRED`; затем `DEFERRED` только по явному решению.
- **Отчёт:** P с минимальным вариантом и оценкой churn.

### Wave 7 — только остаточный test cleanup

### R28. Заменить слабые source-text проверки поведения

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/behavior-test-coverage`.
- **Findings:** оставшаяся часть T02; T06.
- **Dependencies:** R09, R10, R13–R16; для T06 — R31/R32.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/lib/category-query-identity.spec.ts`; source-reading specs для FigmaTabs, ProductListScreen, ProductScreen, product-list-catalog, catalog-intro-style и Search overlay surface.
- **Phase 0:** для каждого assertion назвать реальный риск; проверить, не закрыт ли он production PR этой roadmap.
- **Дополнение T06:** после production regressions R31/R32 сократить повторение typed fixtures, DOM/deferred helpers и setup QueryClient. Сохранить реальные screen tests, fresh client на тест и уникальные сценарии; добавить real parent/achievement seam в R32 до cleanup. Не подавлять act warnings.
- **Исправить:** удалить проверки уже удалённого кода; source-string assertions заменить behavioral/unit tests либо одним browser scenario, если риск связан с DOM/navigation. Геометрию проверять visual evidence, а не наличием style literal.
- **Не менять:** production code ради удобства теста, не переносить всё в E2E, не удалять уникальную regression coverage.
- **Инварианты:** test failure соответствует пользовательскому/контрактному нарушению, а не переименованию локального символа.
- **Тесты:** mutation sanity — намеренная локальная поломка проверяемого поведения должна ломать новый тест; поломку не коммитить.
- **Validation:** V-MOBILE; только browser specs, заменяющие конкретные source tests.
- **STOP:** невозможно назвать проверяемое поведение — предложить удаление с доказательством отсутствия уникального риска.
- **Done/status:** T02 → `VERIFIED` после R09/R10 и полного inventory.
- **Отчёт:** G с old assertion → risk → replacement/removal matrix.

### R29. Убрать дублирование дорогих browser сценариев

- **Модель:** Terra Medium.
- **Режим:** Implementation.
- **Base:** B.
- **Branch:** `fix/browser-suite-scope`.
- **Findings:** T05.
- **Dependencies:** R03, R14, R28; navigation tests сохраняются до принятия R25.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/e2e/figma-stabilization.spec.ts`; `/Users/yayauheny/projects/bidplace/apps/mobile/e2e/discovery-launch.spec.ts`; `/Users/yayauheny/projects/bidplace/apps/mobile/e2e/search-overlay.spec.ts`.
- **Phase 0:** scenario inventory и измерение durations; визуальные и поведенческие assertions учитывать отдельно.
- **Исправить:** назначить одного владельца для sort/URL/pagination/empty/error behavior; повторяющийся onboarding заменить existing API fixture там, где onboarding не является целью теста.
- **Не менять:** уникальные visual, flicker, history, keyboard и WebKit assertions; timeouts не увеличивать для сокрытия нестабильности.
- **Инварианты:** меньший suite сохраняет покрытие разных браузерных рисков; setup не обходит permissions/state machine.
- **Тесты:** полный maintained browser matrix после сокращения; E2E fence.
- **Validation:** V-MOBILE; полный `playwright test` в Chromium/WebKit на disposable DB; сравнение scenario coverage и durations.
- **STOP:** дублирование только внешнее, а failure modes различаются — сохранить оба теста.
- **Done/status:** T05 → `VERIFIED` после измерений и полного прогона.
- **Отчёт:** G с coverage/duration до/после; не обещать ускорение без измерения.

## 4. Verification evidence и закрытие findings

### Baseline evidence

Из исходного аудита:

- TypeScript и lint API/mobile прошли.
- Mobile: 390 тестов; contracts: 28; api-client: 11 — прошли.
- API: 290/292 при `BIDPLACE_ENV_FILE=/dev/null`; два path-resolution failures вызваны защитным override. Отдельный запуск трёх path-resolution tests без override прошёл.
- Hook defect D03 дополнительно воспроизведён с mocked DOM lifecycle.
- Browser, реальные DB concurrency и S3 failure scenarios не выполнялись.
- Изменений production code не было.

Эти результаты являются **baseline**, не evidence будущего исправления.

При подготовке плана 2026-09-26 перепроверены baseline, рабочая ветка, manifests, scripts, test discovery/configs и ключевые production symbols. При сохранении документа 2026-09-27 повторно проверены HEAD `7d2d547`, чистая исходная база и пути входа. Полный suite при сохранении документа не запускался: production code не менялся.

### Evidence record для каждого scope

```text
scope:
finding IDs:
status:
base SHA:
commit:
changed contracts:
tests/scenarios:
validation commands and exit codes:
runtime environment:
evidence links:
remaining limitations:
blocked-by:
```

### R01 evidence

```text
scope: R01
finding IDs: D03; overlay seam of T04
status: VERIFIED
base SHA: e166d6e6310ce30977f402b3c657f1f062811414
commit: 3edbf99feadc79be0f514283b1f793348c68b1c9 plus correction 9a1dd2bed09f7492937226564c72efb2ad67a4da
changed contracts: none. closeOnFocusIn stays optional and defaults to false. SearchOverlay, FilterSheet and FilterMenu still omit it. FilterSheet restoreOnClose stays true. SearchOverlay restoreOnClose stays false.
tests/scenarios: mounted useDismissibleOverlay — omitted/false does not register focusin and does not close on inside or outside focus; true closes once on outside focus and ignores inside focus; cleanup removes the same listener; reopen starts open, closes on outside focus, removes that listener when open becomes false, registers a different listener when opened again, and the next outside focus adds exactly one onClose('focusin'); false still closes once on Escape (with restoreFocus) and outside pointerdown, and ignores inside pointerdown. The omitted/false listener assertions fail on the previous shadowed callback.
validation commands and exit codes:
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile lint → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile test → 0 (396 tests) on Node v22.20.0
  pnpm --filter @bidplace/mobile test:e2e-fence → 0 on Node v22.20.0
  EXPO_NO_DOTENV=1 BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/mobile exec playwright test e2e/search-overlay.spec.ts --project=chromium --project=webkit → 0 (Chromium 17/17, WebKit 17/17; 34 passed)
runtime environment: supported V-MOBILE and browser verification used Node v22.20.0, matching root engines >=22 <23, and pnpm 11.7.0. Hook spec uses the jsdom environment already installed with vitest 4.1.10. Browser verification used apps/mobile/playwright.config.ts against an explicitly disposable postgres:16-alpine bidplace_e2e database.
evidence links: apps/mobile/src/components/layout/use-dismissible-overlay.ts; apps/mobile/src/components/layout/use-dismissible-overlay.spec.ts
remaining limitations: none for D03. After the disposable DB issue was resolved, one category-history browser scenario exposed an E2E fixture mismatch: publicSearchFixtures selected categories[0] independently from the chosen published work, so that category could contain no works. The fixture now selects the category matching work.categoryId; production overlay code and assertions were unchanged.
blocked-by: none
```

### R30 evidence

```text
scope: R30
finding IDs: D08
status: VERIFIED
base SHA: f276180b61822b5304b6b16d95a48370698651d1
commit: implementation e49d3eec24444a6479486d70e559a25c5dd7c594; verify-email correction 7880ee2c92c085f2406f7cf58b65c01a400d2de3; save/logout correction 3d722571643e9b5cfb0477d62343450fb4a89fc9
changed contracts: none. AuthProvider.logout still clears the local session in finally. No auth API or route change.
tests/scenarios: AccountLogoutButton — guest renders nothing; one logout call; a second press while pending does not call logout again; success and rejected server logout both router.replace('/'); rejection is logged with the infrastructure error policy and is not an unhandled rejection. Seller profile — dirty fields or a new photo open the existing exit dialog and do not call logout; a pending ordinary save cannot overlap logout and cannot repopulate the private cache after session cleanup; «Продолжить заполнение» does not logout; confirmed save runs before logout and then replace('/'); failed save stays on the form and does not logout; a clean profile logs out directly; clean «Закрыть» still goes home without logout; missing, draft, and pending-review profiles render «Выйти». Reachability — approved cabinet, suspended cabinet, admin moderation, and email verification render «Выйти». Verify email — a pending verification disables logout and does not call it; a pending logout disables confirm and request-code; a verify started after logout does not call refreshSession. AuthProvider — rejected api.auth.logout still clears the session and private seller cache, keeps public query data, and the protected route redirects to /login. Pre-existing defect, not a PR #12 regression.
validation commands and exit codes:
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile lint → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile test → 0 (418 tests) on Node v22.20.0
  pnpm --filter @bidplace/mobile test:e2e-fence → 0 on Node v22.20.0
  EXPO_NO_DOTENV=1 BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/mobile exec playwright test e2e/account-logout.spec.ts --project=chromium --project=webkit → 0 (Chromium 4/4, WebKit 4/4; 8 passed)
runtime environment: Node v22.20.0, matching root engines >=22 <23. No new dependency. Specs use the jsdom environment already installed with vitest. Playwright used apps/mobile/playwright.config.ts against an explicitly disposable postgres:16-alpine container on 127.0.0.1:5432; prepare.mjs created/reset bidplace_e2e after the E2E database fence passed.
evidence links: apps/mobile/src/features/auth/AccountLogoutButton.tsx; apps/mobile/src/features/auth/account-logout.ts; apps/mobile/src/features/sellers/seller-profile-screen.tsx; apps/mobile/src/features/sellers/author-cabinet-screen.tsx; apps/mobile/src/features/admin/admin-moderation-screen.tsx; apps/mobile/src/features/auth/verify-email-form.tsx; apps/mobile/e2e/account-logout.spec.ts
remaining limitations: none for D08. Chromium and WebKit both passed the maintained account logout scenarios, including /profile → /cabinet → logout → Back → /login without private UI restoration.
blocked-by: none
```

### R02 evidence

```text
scope: R02
finding IDs: D01; queue seam of T04
status: NEEDS_VERIFICATION
base SHA: 91a06a90f0d3e22f344c2692e2e920003cafbdb4
commit: none. The correction is uncommitted on fix/moderation-revision-projection.
changed contracts: admin list items expose parent status and an explicit review target. Status requests require that target. PATCH response envelopes are unchanged. No new public media contract.
tests/scenarios: AdminRevisionPhoto keeps profileId and revisionId, refetches when updatedAt and checksum change, drops the previous object URL, ignores a late response, revokes object URLs, and shows a visible state for fetch and decode failure. The production admin screen passes the new photo identity through. Achievement cards show day precision, month precision, and no date when occurredDate is null. These regressions failed on the previous photo effect and date-less card, then passed. The admin screen passes the achievement image URL into the image element and replaces that URL when the achievement id changes. The browser fixture adds a decodable pending-only achievement PNG. Before approval the guest scenario keeps the published achievement and expects 404 for the pending image. After approval it expects the pending achievement and its bytes. API integration covers pending photo and pending-only product image privacy. Browser media assertions exist but were not executed. Achievement image transport was not changed: the mobile API client uses credentials include and does not set an Authorization bearer token; the achievement endpoint accepts the session cookie or a bearer token. No runtime defect in that path was confirmed.
validation commands and exit codes:
  pnpm --filter @bidplace/mobile exec vitest run src/features/admin/AdminRevisionPhoto.spec.ts src/features/admin/admin-moderation-screen.spec.ts → 1 before the correction (4 failed: one fetch instead of two, no decode error, photo identity not passed, achievement date absent) and 0 after (10 passed) on Node v22.20.0
  pnpm --filter @bidplace/mobile test → 0 (428 tests) on Node v22.20.0
  pnpm --filter @bidplace/api exec vitest run src/admin/admin-moderation.service.spec.ts src/admin/admin.controller.spec.ts src/admin/admin-moderation.mapper.spec.ts → 0 (19 tests) on Node v22.20.0
  pnpm --filter @bidplace/contracts test → 0 (30 tests) on Node v22.20.0
  pnpm --filter @bidplace/api-client test → 0 (14 tests) on Node v22.20.0
  pnpm --filter @bidplace/mobile lint → 0 on Node v22.20.0
  pnpm --filter @bidplace/api lint → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile test:e2e-fence → 0 on Node v22.20.0
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' --filter='@bidplace/api...' → 0 on Node v22.20.0
  BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/api test:integration → 0 (23 files, 76 tests) on Node v22.20.0. An earlier parallel run timed out two beforeAll database hooks; the isolated rerun and the following full rerun passed. No assertion in the media or projection specs failed.
  pnpm --filter @bidplace/mobile exec vitest run src/features/admin/admin-moderation-screen.spec.ts → 0 (6 passed) on Node v22.20.0 after the achievement image wiring test
  pnpm --filter @bidplace/mobile exec eslint src/features/admin/admin-moderation-screen.spec.ts e2e/admin-revision-moderation.spec.ts e2e/support/revision-moderation-fixture.ts → 0 on Node v22.20.0
  Chromium and WebKit admin-revision-moderation.spec.ts → NOT RUN
runtime environment: Node v22.20.0, matching root engines >=22 <23, and pnpm 11.7.0. Component specs use the installed vitest jsdom environment. Integration used the disposable postgres:16-alpine container bidplace-r02-postgres on 127.0.0.1:5432 and per-run itest schemas via prisma migrate deploy. prisma migrate reset was not run.
evidence links: apps/mobile/src/features/admin/AdminRevisionPhoto.tsx; apps/mobile/src/features/admin/admin-moderation-screen.tsx; apps/mobile/src/features/admin/AdminRevisionPhoto.spec.ts; apps/mobile/src/features/admin/admin-moderation-screen.spec.ts; apps/mobile/e2e/support/revision-moderation-fixture.ts; apps/mobile/e2e/admin-revision-moderation.spec.ts
remaining limitations: browser decode of the author photo, work gallery, and pending-only achievement image was not executed. Guest 404 and post-approval achievement visibility were not executed. D01 is not VERIFIED. T04 stays PARTIAL. Same-id achievement byte replacement is not a write path; a new image is a new achievement id and URL.
blocked-by: explicit user consent to prisma migrate reset of the disposable bidplace_e2e database used by apps/mobile/e2e/prepare.mjs. This correction did not grant that consent.
```

### R03 evidence

```text
scope: R03
finding IDs: D02, T03; submit seam of T04
status: NEEDS_VERIFICATION
base SHA: 1be9c2816367e495d564839bd6842e0f1a71448e
commit: 0721df59ff0323dd8c65da738f0a440e20e93355; correction commit on fix/author-revision-submit
changed contracts: none. Seller revision transitions and publication are unchanged. Admin moderation requests stay on the R02 target.
tests/scenarios: SellerProfileScreen shows submit for an approved parent with DRAFT, CHANGES_REQUESTED, or REJECTED editing revision; pending revision hides submit and disables fields. A delayed save does not submit. A failed save does not submit and can be retried. save() null during an in-flight save or logout does not submit or navigate. Two presses in one turn run one save-then-submit. While submit stays pending, Save, Logout, Close, and a second Submit do not start. Success shows the pending profile without navigation. A rejected submit shows the error and allows retry. The initial wizard still submits. Logout regressions in seller-profile-logout.spec.ts passed. Correction: after a successful submit, a delayed getMyProfile used to leave the cache DRAFT and accept a second save-then-submit. The screen now copies the confirmed revision from the submit response into the owner profile cache before clearing the operation guard. refetchQueries does not use throwOnError, and the screen does not write the submit snapshot again after that read. A stale older snapshot does not restore editing. A failed refetch leaves the already written pending snapshot, does not reopen submit, and does not leave logout blocked. The delayed-refetch regressions failed on 0721df5 and passed after the correction. A newer APPROVED, CHANGES_REQUESTED, or REJECTED snapshot replaces that pending state. Browser specs were rewritten for the nickname/four-step application and for an approved fixture, but were not executed.
validation commands and exit codes:
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile lint → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile test → 0 (443 tests) on Node v22.20.0
  pnpm --filter @bidplace/mobile exec vitest run src/features/sellers/seller-profile-submit.spec.ts src/features/sellers/seller-profile-logout.spec.ts → 0 (24 tests) after the correction; 3 failed and 21 passed on 0721df5; cleanup re-run → 0 (27 tests) on Node v22.20.0
  pnpm --filter @bidplace/mobile test:e2e-fence → 0 on Node v22.20.0
  git diff --check → 0
  BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/api exec vitest run --config vitest.integration.config.ts test/integration/author-application-contract.integration.spec.ts test/integration/author-achievement-revision.integration.spec.ts → 0 (2 files, 6 tests) on Node v22.20.0
  Chromium author-revision-flow.spec.ts and author-achievement-revision.spec.ts → NOT RUN
  WebKit author-revision-flow.spec.ts and author-achievement-revision.spec.ts → NOT RUN
runtime environment: Node v22.20.0, matching root engines >=22 <23. Integration used disposable postgres:16-alpine bidplace-r02-postgres on 127.0.0.1:5432, database bidplace_integration, and per-run itest schemas via prisma migrate deploy. prisma migrate reset was not run.
evidence links: apps/mobile/src/features/sellers/seller-profile-screen.tsx; apps/mobile/src/features/sellers/seller-profile-submit.spec.ts; apps/mobile/e2e/author-revision-flow.spec.ts; apps/mobile/e2e/author-achievement-revision.spec.ts; apps/mobile/e2e/support/e2e-fixtures.ts
remaining limitations: Chromium and WebKit were not run, so D02 and T03 are not VERIFIED. T04 stays PARTIAL. D01 was not verified by this scope.
blocked-by: explicit user consent to prisma migrate reset of disposable bidplace_e2e in apps/mobile/e2e/prepare.mjs. This task did not grant that consent.
```

### R04 evidence

```text
scope: R04
finding IDs: T01
status: VERIFIED
base SHA: b4360edb472020c3e05b4cac9f4510cdb4cb46e5
commit: implementation commit on fix/workspace-test-discovery
changed contracts: none. Public package exports are unchanged.
tests/scenarios: Before the change, contracts Vitest discovered 3 files and 30 tests under test/**/*.test.ts and did not run src/portfolio.spec.ts. A clean contracts/database build emitted portfolio.spec and index.spec JavaScript, declarations, and declaration maps. Database had no test script. Prisma.$Enums was undefined, so Object.keys(Prisma.$Enums ?? {}) passed without checking a public export. After the change, contracts discovers 4 files and 31 tests, including portfolio.spec.ts. Database runs one smoke test: PrismaClient is a function, Decimal is Prisma.Decimal, and new Decimal('10.50').plus(new Decimal('1.25')) equals 11.75. The test does not construct a client or connect to a database. The database test script runs prisma generate before Vitest. A separate noEmit tsconfig typechecks the test sources after they were excluded from production emit. A clean dist contains index.js and index.d.ts and no spec or test artifacts.
validation commands and exit codes:
  pnpm --filter @bidplace/contracts test → 0 (4 files, 31 tests) on Node v22.20.0
  pnpm --filter @bidplace/database test → 0 (1 file, 1 test) on Node v22.20.0
  pnpm exec turbo run typecheck build --filter='@bidplace/contracts...' --filter='@bidplace/database...' → 0 (4 tasks) on Node v22.20.0
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter=...@bidplace/contracts --filter=...@bidplace/database → 0 (14 tasks: api, api-client, config, contracts, database, design-tokens, mobile) on Node v22.20.0
  env -u BIDPLACE_ENV_FILE pnpm test:unit → 0 after the existing workspace package builds (api 299, contracts 31, api-client 14, database 1, mobile 446) on Node v22.20.0
  git diff --check → 0
runtime environment: Node v22.20.0, matching root engines >=22 <23. No .env file was present in the worktree. BIDPLACE_ENV_FILE was unset. prisma migrate reset was not run. The database smoke test did not open a database connection.
evidence links: packages/contracts/vitest.config.ts; packages/contracts/tsconfig.json; packages/contracts/tsconfig.typecheck.json; packages/database/src/index.spec.ts; packages/database/vitest.config.ts; packages/database/package.json; package.json
remaining limitations: contracts and database have no lint script. A clean checkout must build workspace package entries such as @bidplace/config, @bidplace/api-client, and @bidplace/design-tokens before root test:unit, which is the same prerequisite pnpm typecheck already applies. tsc does not delete stale outputs, so this check removed dist before the clean build.
blocked-by: none
```

### R05–R07 evidence

```text
scope: R05, R06, R07 as one package with separate commits and one review, plus four 2026-09-29 corrections of review findings
finding IDs: D04, D05; save and owner-cache seams of T04
status: NEEDS_VERIFICATION
base SHA: 8e0dee2e0db20150542ff93375ceb2c1bbbee8d6
correction base: dd1cffb82724c571c214042f21479645cb800dcd
second correction base: dd4d7bc
third correction base: 69c4aff
fourth correction base: 7655d133c4c1b58000f956034e96d1279ac7f5bd
commits: R05 5d9693d; R06 64b12d6; R07 dd1cffb; correction 8d41397 session, a502090 route guard, ac29a19 submit lock, 4fed821 save exclusion, fb37cf9 profile read; second correction af13a97 profile photo, 6cbb56a work submit and revision hold; third correction 7655d13 keeps the moderation hold after an intermediate save; fourth correction is the child of 7655d13 that closes private writes before session retirement awaits
changed contracts: none. Product and profile write responses, revision transitions, and publication are unchanged. Submit still does not copy { product } over the detail envelope.
tests/scenarios: Before the work fix, an ordinary save reset the title to the response and dropped text typed after the snapshot. After it, that text stays dirty, an untouched technique takes the normalized response, a field that was dirty only before send becomes clean, editing back to the baseline clears dirty, create then the next save updates the new id, a failed save keeps the text and retries, submit locks edits and a failed save does not submit or navigate, a refetch keeps a local edit, and a cleared session does not refetch the private product. Before the profile fix, the city typed during save was reset to Minsk. After it, that city stays dirty, an untouched discipline takes normalization, a saved dirty city becomes clean, a photo chosen during the save is sent by the next save, an older picker result does not replace a newer one, a failed save keeps the text, and a failed save-before-submit does not submit. R03 submit and R30 logout specs stayed green. Before the cabinet fix, a retained cabinet stayed on «Черновик» and the empty cover after a work save. After it, the same mounted cabinet shows «На модерации», the normalized title, the moderation message, and the cover. A public portfolio-works query is not refetched. A cleared session does not refetch the cabinet. Correction before/after, on production screens with a real QueryClient: a save from account A replaced B's profile and work after clearAuthenticatedSession and login B, including the same account logging in again, and a profile step continued; after the correction the cached profile, form, and route stay on B. During a delayed dirty-work save the route guard became false; after the correction a second removal stays prevented, navigation happens once after success, and a failed save does not navigate. After a successful work submit the title stayed locked when a newer CHANGES_REQUESTED arrived, and creation Close stayed disabled; after the correction Close is enabled, Save/Submit stay closed on the stale DRAFT, and CHANGES_REQUESTED or REJECTED can be edited. A failed post-submit refetch no longer leaves the transition lock set. Two ordinary saves plus submit in one turn sent three updates; after the correction one update is sent, typed text is kept, and the next save sends that text. A route removal during that ordinary save does not navigate. Second correction, on dd4d7bc before the fix: a profile picker and a late blob read from account A were saved by the next login, including the same account; a work image picker and a late blob read uploaded into the next session; a delayed work update still called submitProduct after logout and login; a resubmit from CHANGES_REQUESTED or REJECTED reopened when the refetch was the same revision; a newer APPROVED revision left the title disabled. After the fix those eleven regressions pass. Save and Submit stay closed on the submitted revision. A newer APPROVED, CHANGES_REQUESTED, or REJECTED editing revision opens editing even when the parent updatedAt does not move. A later older detail does not replace that decision. Previous R03, R30, route-guard, and save-exclusion regressions stayed green. Third correction, on 69c4aff before the fix: after CHANGES_REQUESTED or REJECTED, a detail read started before submit and resolved with the same status and a newer revision updatedAt made «Повторно отправить на модерацию» available again. After the fix that read is cancelled, its body is not applied, and the form stays locked through the later pending detail. A subsequent newer decision of the same status opens editing. The post-submit floor comes from the settled detail and the first trusted read after submit, not from the pre-save timestamp. Confirmed pending stays locked. A failed refetch still releases Close. A session change still drops the previous operation. Fourth correction, on 7655d13 before the fix: SellerProfileScreen save onSuccess restored ['seller','profile'] with city Late A after clearAuthenticatedSession had removed private queries and before it published session=null; that profile remained after cleanup finished. After the fix the same callback still completes, session is null, and the private profile is absent. Private writes are closed on the existing auth epoch before the first await. An in-flight session read does not leave an authenticated session. A newer replaceAuthenticatedSession is not erased by the older clear. Public ['products','list'] stays. Rejected server logout still clears the local session. Previous profile, work, picker, and navigation regressions stayed green.
validation commands and exit codes:
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 0 (8 tasks) on Node v22.20.0
  pnpm --filter @bidplace/mobile lint → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile test → 0 (109 files, 492 tests) on Node v22.20.0
  pnpm --filter @bidplace/mobile test:e2e-fence → 0 on Node v22.20.0
  git diff --check → 0
  Chromium work/profile/cabinet scenarios → NOT RUN
  WebKit work/profile/cabinet scenarios → NOT RUN
runtime environment: Node v22.20.0, matching root engines >=22 <23. prisma migrate reset was not run. Disposable bidplace_e2e was not prepared.
evidence links: apps/mobile/src/lib/query-cache.ts; apps/mobile/src/lib/query-cache.spec.ts; apps/mobile/src/lib/use-private-cache-epoch.ts; apps/mobile/src/providers/auth-provider.tsx; apps/mobile/src/hooks/use-seller-capability.ts; apps/mobile/src/features/sellers/product-draft-screen.tsx; apps/mobile/src/features/sellers/product-draft-state.ts; apps/mobile/src/features/sellers/product-draft-route-guard.spec.ts; apps/mobile/src/features/sellers/product-draft-submit-lifecycle.spec.ts; apps/mobile/src/features/sellers/product-draft-save-race.spec.ts; apps/mobile/src/features/sellers/seller-profile-screen.tsx; apps/mobile/src/features/sellers/seller-profile-logout.spec.ts; apps/mobile/src/features/sellers/seller-profile-submit.spec.ts; apps/mobile/src/features/sellers/author-cabinet-screen.tsx
remaining limitations: Chromium and WebKit were not run, so D04 and D05 are not VERIFIED. T04 stays PARTIAL. D01, D02, D03, D08, and T03 were not changed. History ownership was not rewritten.
blocked-by: explicit user consent to prisma migrate reset of disposable bidplace_e2e in apps/mobile/e2e/prepare.mjs. This task did not grant that consent.
```

### R08 evidence

```text
scope: R08
finding IDs: L04
status: NEEDS_VERIFICATION
base SHA: 74a48795f702e4d1d9d90f7960950749fd9d9ed2
changed contracts: none. HTTP paths and response schemas are unchanged. Read methods accept an optional AbortSignal.
tests/scenarios: listWorks passes the signal to fetch. Aborted JSON and image reads reject as AbortError and are not ApiClientError network failures. A thrown fetch stays kind network. A non-JSON catalog body stays unexpected_response. QueryClient cancelQueries aborts the in-flight works fetch and does not mark that query as error. Catalog, search, home, public work, and public author query functions pass the query signal. Mutations are unchanged. Correction commit d6f8681, parent 95545d5: before the fix, a Response whose body stayed pending after headers turned an abort into ApiClientError. HTTP 200 JSON became unexpected_response. HTTP 503 JSON became a status error because readErrorPayload swallowed AbortError. After the fix those reads, and an image blob read in the same state, reject with AbortError. Malformed application/json and a schema validation failure stay unexpected_response. HTTP 404 stays not_found. A thrown fetch stays network. A SyntaxError after abort stays unexpected_response. The existing QueryClient cancellation regression still passes.
validation commands and exit codes:
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 0 on Node v22.20.0
  pnpm --filter @bidplace/api-client test → 0 (5 files, 26 tests) on Node v22.20.0, pnpm 11.7.0
  pnpm --filter @bidplace/mobile lint → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile test → 0 (112 files, 502 tests) on Node v22.20.0
  pnpm --filter @bidplace/mobile test:e2e-fence → 0
  git diff --check → 0
  Chromium/WebKit search scenarios → NOT RUN
remaining limitations: Chromium and WebKit search scenarios were not run, so L04 is not VERIFIED.
blocked-by: none
```

### R31 evidence

```text
scope: R31
finding IDs: D09
status: NEEDS_VERIFICATION
base SHA: 74a48795f702e4d1d9d90f7960950749fd9d9ed2
changed contracts: none. /me, login, and logout responses are unchanged.
tests/scenarios: AuthProvider plus a real QueryClient. Initial /me keeps public cache. Refresh A→B removes ['seller','profile'], keeps ['products','list'], and rejects the previous epoch. Same-user emailVerifiedAt refresh keeps the epoch and private profile. Network failure keeps the session. Unauthorized refresh clears the session and private cache. A late callback that still holds the previous epoch cannot restore the profile. Explicit login of the same account retires the previous private cache. Correction commit 95545d5, parent ae04983: ProtectedRoute retry used void refreshSession().finally(), so a second network failure left an unhandled ApiClientError while the error page returned. After the correction the same real ProtectedRoute, AuthProvider, and QueryClient path records that rejection, returns data-status=error with Повторить, and a following successful retry shows private content. Unauthorized refresh from that error page redirects to /login. A network failure of an existing session keeps the session and surfaces kind network to the caller. verify-email already awaits refreshSession and shows the error, so it was left unchanged.
validation commands and exit codes:
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 0 (8 tasks) on Node v22.20.0, pnpm 11.7.0
  pnpm --filter @bidplace/api-client test → 0 (5 files, 26 tests)
  pnpm --filter @bidplace/mobile lint → 0
  pnpm --filter @bidplace/mobile test → 0 (112 files, 502 tests)
  pnpm --filter @bidplace/mobile test:e2e-fence → 0
  git diff --check → 0
  Chromium/WebKit session scenarios → NOT RUN
remaining limitations: Chromium and WebKit were not run. A cross-tab cookie change was not executed, so D09 is not VERIFIED. D04 and D05 stay NEEDS_VERIFICATION. T04 stays PARTIAL. Unit tests do not make D09 VERIFIED.
blocked-by: none for the client transition. Browser session replacement was not run.
```

### R32 evidence

```text
scope: R32
finding IDs: D10; behavioral parent/child seam of T06 and T04
status: NEEDS_VERIFICATION
base SHA: 9932104
changed contracts: none. Achievement add/delete, profile save, and revision submit stay on the existing API. Server revision locks are unchanged.
field policy: while an achievement add or delete is in flight, year, month, day, description, photo selection, and delete are locked. The mutation receives an immutable body, date, image, and auth epoch. Success clears that draft only when the same operation token and epoch can still write. Failure keeps the text and photo. An open picker and an application refetch are not server writes. A picker result is applied only when the selection is still current, editing is allowed, the parent is not in a conflicting transition, and the epoch can write.
parent coordination: the child reports a numeric write token. Submit, step, exit, and logout check that token in the handler. A child write checks the parent transition, save, submit, leave, and logout refs before its first await. A late release clears only the matching token. Same-turn presses do not bypass the refs. Profile save is included because its success replaces the cached profile that contains achievements. Ordinary profile fields typed after a save snapshot are still reconciled. Clicks are dropped, not queued.
session: account A→B and logout→login of the same account retire the epoch. A late application read, add, delete, or picker does not publish into the next session. Forced profile hydration also resets dirty profile fields when the revision timestamp is unchanged. Same-user metadata refresh is unchanged and does not force that reset.
before: on the unmodified editor, a delayed add of Alpha accepted a description change to Beta before success. The regression expected Alpha and received Beta.
after: the description stays Alpha while that add is pending and clears when it succeeds. A failed add keeps Alpha and the selected photo; the retry sends that same body and blob. Duplicate add/delete in one turn call the API once. An older picker does not replace a newer photo. Picker cancel shows no error; a failed read shows the existing photo error and leaves the button usable. Parent submit, logout, close, and back do not start during add/delete, including two presses in one turn. A parent save or submit that has started rejects a following achievement add/delete. Success, failure, and unmount release the parent. A stale profile read after submit does not reopen moderation or the achievement editor.
server snapshot: the same parent operation id advances when the form becomes readonly, including an accepted profile snapshot. A later snapshot that opens the form does not restore the previous id. Before this, a picker or blob started on an approved draft applied old.png next to a description typed after PENDING_REVIEW and a newer CHANGES_REQUESTED snapshot. updateProfile and submitAuthorApplication were not called. After it, old.png is absent and the description remains. A picker or blob error from that continuation is not shown. A new selection after the form opens applies. The draft text is not cleared to drop the pending picker.
corrections: 81a24aa cancels an in-flight application read before invalidating it. Query Core 5.101.2 reuses that initial promise while data is still undefined, so a late empty GET hid Alpha and no second GET ran (reads.length stayed 1). After the correction the screen shows Alpha from the read that starts after the add. A read started before delete does not restore the deleted row. A failed refresh shows the inline retry and releases profile save. A session switch during that refresh does not publish Alpha into the next account. The picker correction increments the selection when an achievement write starts and increments a parent operation id when save, lock, exit, or logout starts. Finishing that operation does not restore the old picker or blob. Before it, a picker opened before a completed add or a completed profile save attached old.png or late.png to the next draft. A blob read that has already started is dropped when the interrupting write finishes. A new selection after unlock applies. A failed add keeps the photo already chosen. Server mutations are not cancelled.
tests/scenarios: apps/mobile/src/features/sellers/author-application-achievements.spec.ts mounts SellerProfileScreen, AuthorApplicationAchievements, and a real QueryClient. Existing seller-profile-submit.spec.ts and seller-profile-logout.spec.ts stay in place and still mock the child as null.
validation commands and exit codes:
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 0 (8 tasks) on Node v22.20.0, pnpm 11.7.0
  pnpm --filter @bidplace/mobile lint → 0
  pnpm --filter @bidplace/mobile test → 0 (113 files, 526 tests)
  pnpm --filter @bidplace/mobile test:e2e-fence → 0
  git -c core.fsmonitor=false diff --check → 0
  Chromium/WebKit achievement scenarios → NOT RUN
remaining limitations: Chromium and WebKit were not run, so D10 is not VERIFIED. D09 and L04 stay NEEDS_VERIFICATION. D04 and D05 stay NEEDS_VERIFICATION. T04 stays PARTIAL. T06 is not closed; the remaining harness cleanup is R28. No server, migration, or browser run.
blocked-by: none for the client lifecycle. Browser achievement privacy and transition scenarios were not run.
```

### R11–R12 evidence

```text
scope: R11, R12
finding IDs: C03, C05
status: C03 NEEDS_VERIFICATION; C05 VERIFIED
base SHA: 46122e4a77b48f999f9404e545159a57c3e91cf3
commits: R11 d45bcd02f185465b5ccafe9efce2ba1ff89976f2; R12 zod 214cbd2e1c4732e2ab81604f8827e447feacd5b4; R12 types 7c8465804b2af5f0106571341f9cd6140b5e9a56
changed contracts: none. Public api-client exports, schemas, error classification, AbortError preservation, and mutation cancellation are unchanged. Font family names in tokens are unchanged.
tests/scenarios: no new source-string tests. Existing mobile, api-client, contracts, and API unit suites passed. Isolated `pnpm deploy --legacy --prod` of `@bidplace/api-client` resolved zod@3.25.76 and `@bidplace/contracts` inside `/tmp/bidplace-api-client-deploy`, not the repo node_modules. A valid JSON body parsed, an invalid body became `ApiClientError` `unexpected_response`, and an aborted fetch stayed `AbortError`.
validation commands and exit codes:
  baseline: CI=1 pnpm install --frozen-lockfile in a detached worktree of 46122e4 → 0. No node_modules or .env in that worktree before install. Prisma postinstall warned that it could not find a schema from the package directory. pnpm peers check on that tree → 1: @types/react 18.3.31 does not satisfy react-native ^19.1.1 or @react-native/virtualized-lists ^19.2.0.
  final: CI=1 pnpm install --frozen-lockfile in a detached worktree of 7c84658 → 0. pnpm peers check → 0. Installed root devDependencies include @types/react 19.2.18 and @types/react-dom 19.2.7.
  First EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' --force → 2. Mobile tsc failed only on the two pre-existing e2e imports of packages/database/dist/index.js, and that command used Homebrew Node 24's pnpm. The same missing database dist fails tsc on the baseline worktree before workspace packages are built.
  After pnpm --filter @bidplace/database db:generate and build, with Node v22.20.0 and pnpm 11.7.0: EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' --force → 0 (8 tasks). expo export default --platform all wrote web, android, and ios bundles. No Onest string in those bundles.
  pnpm --filter @bidplace/mobile lint → 0
  pnpm --filter @bidplace/mobile test → 0 (102 files, 482 tests)
  pnpm --filter @bidplace/mobile test:e2e-fence → 0
  pnpm exec turbo run typecheck build --filter='@bidplace/api-client...' --force → 0 (4 tasks)
  pnpm --filter @bidplace/api-client test → 0 (5 files, 26 tests)
  pnpm --filter @bidplace/contracts test → 0 (4 files, 30 tests)
  BIDPLACE_ENV_FILE=/dev/null pnpm exec turbo run typecheck build --filter='@bidplace/api...' --force → 0 (9 tasks)
  pnpm --filter @bidplace/api lint → 0
  BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/api test --exclude src/core/config/env.spec.ts → 0 (47 files, 269 tests)
  env -u BIDPLACE_ENV_FILE pnpm --filter @bidplace/api test src/core/config/env.spec.ts → 0 (1 file, 33 tests). The spec stubs a missing env path and injects fileExists. The isolated worktree had no .env.
  Browser, simulator, device, and font-rendering checks → NOT RUN
runtime environment: Node v22.20.0 and pnpm 11.7.0 for the passing checks. The first failed mobile turbo invocation used /opt/homebrew/opt/node@24/bin/pnpm. Database generate and build were prerequisites for mobile tsc; migrate, seed, and API bootstrap were not run.
evidence links: apps/mobile/src/app/_layout.tsx; apps/mobile/package.json; packages/api-client/package.json; package.json
remaining limitations: C03 is not VERIFIED because font rendering was not checked. The Inter package barrel still places Inter_700Bold and other unused faces in the export even though useFonts does not register them. @types/react@18.3.31 remains a dependency of @types/react-test-renderer. Expo and shared package tsconfig files already set skipLibCheck; this change did not add or widen it. D04, D05, D09, D10, and L04 stay NEEDS_VERIFICATION. T04 and T06 stay PARTIAL.
blocked-by: none for the dependency changes. Font rendering remains unchecked.
```

### Post-cleanup leftovers evidence

```text
scope: leftovers after R09–R12; not a new finding and not a closure of C02, C03, or C04
status: removals done; C02 PARTIAL; C03 NEEDS_VERIFICATION; C04 PARTIAL; C07 QUEUED; L06 QUEUED; R32 NEEDS_VERIFICATION; D04, D05, D09, D10, L04 NEEDS_VERIFICATION; T04 and T06 PARTIAL
branch: fix/post-cleanup-leftovers
base SHA: 76ebd1bd6b5878c826d3643db34a60374ecb9619
commits: source 429ac036c11198f6cf309b2ba2b0417c911a977a; dependencies b72f55e408e2252dacf725abe15e3c4462ff37ce
changed contracts: none. Create and update seller request schemas, handoff validators, exported contract types, public-id generation, moderation filters, and sticky header behavior are unchanged.
removed:
  sellerProfileBaseWriteSchema — private, unexported, no readers; contracts noUnusedLocals no longer reports TS6133
  PUBLIC_ID_LENGTH — declaration only; generator still uses randomBytes(8)
  LatestRulesAcceptanceRecord — declaration only; latestRulesAcceptanceSelect and getAcceptedRulesVersion remain
  SellerProfilePhotoRecord — declaration only; sellerProfilePhotoSelect and ownership checks remain
  ModerationTarget — declaration only; revisionTarget, parentTarget, filters, and moderation contracts remain; productAction unchanged
  CREATOR_HANDOFF_HYSTERESIS — unused alias; its STICKY_HANDOFF_HYSTERESIS import was removed from that file only. The shared constant and creator wrappers remain
  root zod devDependency — no root script or config consumer; api, mobile, api-client, config, and contracts still declare zod
  root @types/react-dom — no root consumer; mobile declaration remains. Root @types/react remains
  mobile jsqr — no source, test, e2e, script, or config consumer. qrcode and @types/qrcode remain
lockfile: pnpm 11.7.0 on Node v22.20.0 removed the three importer edges and the jsqr package and snapshot. No other dependency edges referenced jsqr. zod@3.25.76 stays for the workspace owners and @expo/cli@57.0.6. @types/react-dom@19.2.7 stays for mobile and existing Expo/Radix peers. No peer snapshot keys changed. React, React Native, Expo, and TypeScript versions did not change.
validation checkout: /private/tmp/bidplace-post-cleanup-validation at b72f55e, cloned without node_modules or .env. No .env on the walk from that checkout to /.
validation commands and exit codes:
  CI=1 pnpm install --frozen-lockfile → 0. Root links zod and @types/react-dom absent. Mobile jsqr absent. Root @types/react and workspace zod present. Mobile @types/react-dom, qrcode, and @types/qrcode present.
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' --filter='@bidplace/api...' → 0 (15 tasks). Prisma generate ran as the existing database prerequisite and did not migrate or connect.
  pnpm --filter @bidplace/api lint → 0
  pnpm --filter @bidplace/mobile lint → 0
  pnpm --filter @bidplace/contracts test → 0 (4 files, 30 tests)
  pnpm --filter @bidplace/api-client test → 0 (5 files, 26 tests)
  BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/api test --exclude src/core/config/env.spec.ts → 0 (47 files, 269 tests)
  env -u BIDPLACE_ENV_FILE pnpm --filter @bidplace/api test src/core/config/env.spec.ts → 0 (1 file, 33 tests). The spec stubs a missing env path and injects fileExists.
  pnpm --filter @bidplace/mobile test → 0 (102 files, 482 tests)
  pnpm --filter @bidplace/mobile test:e2e-fence → 0
  pnpm --filter @bidplace/contracts exec tsc -p tsconfig.typecheck.json --noEmit --noUnusedLocals --noUnusedParameters --incremental false → 0
  git -c core.fsmonitor=false diff --check → 0
runtime environment: Node v22.20.0 and pnpm 11.7.0
remaining KEEP: root @types/react; mobile @types/react-dom; qrcode and @types/qrcode; workspace Zod declarations; live seller schemas and handoff validators; public-id generator; rules and seller-photo selects; moderation targets and productAction; shared sticky hysteresis and creator wrappers; public exports without a known external consumer.
remaining DEFER for a later test sweep, not removed here: figmaDeferredIconNames; figmaDeferredDockItemIds; figmaUnusedDockVariantIds; source-text assertions such as category-query-identity and catalog-intro-style; orphan fixtures, helpers, and mocks after a future harness merge.
not started: R33, C07, L06, R13, R28, R29, auth epoch and session ownership, navigation refactor, commerce restoration or retirement, public contract cleanup, and wrapper or alias cleanup.
remaining limitations: the unrestricted API test command was not run as one process, so env loading could not walk to a real .env. Browser, API server, database, migration, and seed checks were not run. No product behavior changed. No finding count changed.
blocked-by: none for these nine removals. Font rendering, browsers, and the deferred sweep remain unchecked.
```

### Shared UI lifecycle evidence

```text
scope: R13 compact button API, R14 dialog focus lifecycle, L06 keyed image recovery. Not a closure of R35, C07, T04, or T06.
status: R13 implemented; C04 NEEDS_VERIFICATION. R14 implemented; L01 NEEDS_VERIFICATION. L06 implemented; L06 NEEDS_VERIFICATION. C07 QUEUED. C08 VERIFIED. R35 open. D04, D05, D09, D10, L04, R32 NEEDS_VERIFICATION. T04 and T06 PARTIAL.
branch: fix/shared-ui-lifecycle
base SHA: d375179f8ed9435bdb5e14a0124f448dcfa5b8b7
commits: R13 aeb86e9; R14 66688e4; L06 6a608e5; dialog fixture types 4d821a9
removed → replacement:
  R13: void compact → existing FigmaButton size="compact" when compact is true. Explicit size and the regular default stay otherwise. TextButton is unchanged.
  R14: document querySelector('[role="dialog"] …') and recursive autofocus/restore timers → @rn-primitives/dialog 1.5.2 onOpenAutoFocus/onCloseAutoFocus, FocusScope trap, and Escape/outside dismiss. Return focus is one scoped callback because no consumer uses Dialog.Trigger; it calls focus({ preventScroll: true }) only while that instance is closed.
  L06: URI reset effect, currentUriRef, and visibleRecovery for a different URI → RemoteImageLifetime keyed by uri. requestVersion stays inside that lifetime. The recovery ref and mounted guard stay for synchronous callbacks of that instance.
preserved: button variants, disabled/loading, width; dialog initial focus, Tab loop, one close, reopen, disconnected opener, sheet SlideOutDown with ReduceMotion.System; image delays 1000/3000/8000, fourth-failure exhaustion, manual retry, cache-bust query/hash, placeholder, «Повторить», contentFit/contentPosition/transition/blurRadius, recyclingKey.
meaningful checks:
  Button.spec.ts 6 passed, including the real FigmaButton compact/regular/large path, disabled/loading, and TextButton.
  AppDialog.spec.ts 8 passed and AppDialog.native.spec.ts 1 passed against dialog.web.mjs and dialog.mjs. jsdom does not move focus on an intermediate Tab, so the trap test wraps at the first and last controls. Outside dismiss follows the primitive: pointerdown is deferred until click.
  ResilientRemoteImage.spec.ts 9 passed with fake timers and controlled expo-image callbacks. media-recovery.spec.ts still covers the pure helpers.
skipped: Chromium, WebKit, 390/1024/1440 screenshots, native device, API server, database, migrations, seed. No .env was read.
validation commands and exit codes:
  First pass, after L06 and before the fixture type fix: EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 2. Mobile typecheck failed on dialog fixture children and the vitest esbuild type. Lint → 0. Mobile test → 0 (106 files, 506 tests). test:e2e-fence → 0. git diff --check → 0.
  After 4d821a9, same commands on Node v22.20.0 / pnpm 11.7.0: turbo → 0 (8 tasks). Lint → 0. Mobile test → 0 (106 files, 506 tests). test:e2e-fence → 0. git diff --check → 0.
runtime environment: Node v22.20.0 and pnpm 11.7.0
remaining limitations: C04, L01, and L06 are not VERIFIED without browsers. The first mobile turbo typecheck after L06 exited 2 because the dialog fixtures and vitest config did not typecheck; lint 0, mobile test 0 (106 files, 506 tests), e2e fence 0, and diff check 0 still ran. Commit 4d821a9 fixes those types. useOverlayFocusTrap remains. C07 remains the known productAction counterexample and was not edited.
blocked-by: none for these three scopes. Browser and device confirmation remains.
```

### R14 return-focus correction

```text
scope: AppDialog return focus after a rapid reopen and after unmount while open. This does not replace the R14 record above and does not close L01.
status: correction implemented. L01 remains NEEDS_VERIFICATION. C04, L06, D04, D05, D09, D10, L04, and R32 remain NEEDS_VERIFICATION. T04 and T06 remain PARTIAL. C07 remains QUEUED. C08 remains VERIFIED. R35 remains open.
branch: fix/shared-ui-lifecycle
base SHA: d375179f8ed9435bdb5e14a0124f448dcfa5b8b7
parent: b268f9d153f47226f0f9f20d2ef8ad07262962e9
commit: f61bdd049e9679d989d88e2185576bbc8d491054
before:
  rapid close, reopen before the deferred close callback, then close again → document.activeElement stayed body. The new onOpenAutoFocus stored body over the original opener.
  parent stopped rendering an open AppDialog without open=false, opener stayed connected → openRef stayed true, onCloseAutoFocus returned after preventDefault, focus stayed on body.
  completed close, then a different opener, then open and close → already returned to the new opener with preventScroll. That case passed before this correction (1 passed, 2 failed, 8 skipped).
after:
  onOpenAutoFocus does not replace the captured opener with body, documentElement, a disconnected node, or an element already inside the dialog.
  onCloseAutoFocus skips restore only while this same instance is mounted and open. Unmount restores the connected opener with focus({ preventScroll: true }).
  the completed later cycle still returns to the new opener.
preserved: @rn-primitives/dialog 1.5.2 as the only focus owner; initial focus; Tab trap; Escape and outside close; one close; disconnected opener; preventScroll; sheet SlideOutDown with ReduceMotion.System; native accessibility-focus fallback. Search URL, history, navigation, image recovery, and API contracts were not changed.
meaningful checks:
  AppDialog.spec.ts 11 passed and AppDialog.native.spec.ts 1 passed against dialog.web.mjs and dialog.mjs.
  External review harness /private/tmp/bidplace-shared-ui-review-probes-2026-10-01/AppDialog.review.spec.ts 10 passed, including both probes.
skipped: Chromium, WebKit, 390/1024/1440 screenshots, native device, API server, database, migrations, seed. No .env was read.
validation commands and exit codes on Node v22.20.0 / pnpm 11.7.0:
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 0 (8 tasks, 6 cache hits)
  pnpm --filter @bidplace/mobile lint → 0
  pnpm --filter @bidplace/mobile test → 0 (106 files, 509 tests)
  pnpm --filter @bidplace/mobile test:e2e-fence → 0
  git -c core.fsmonitor=false diff --check → 0
runtime environment: Node v22.20.0 and pnpm 11.7.0
remaining limitations: L01 is not VERIFIED without browsers. useOverlayFocusTrap remains for Search and FilterSheet.
blocked-by: none for this correction. Browser and device confirmation remains.
```

### R17 evidence

```text
scope: R17
finding IDs: L03
status: VERIFIED
branch: fix/config-bootstrap-ownership
base SHA: 6c0fac75dc3557ffbe2aad1824c6b0585028a1b3
commits: 5da65649a73708a8c35ff1da0cfe9fe412aabe91 parser; df145ad43c3a23ae975ce5abc89c2983eba2a1b2 ownership and DI; 662a9fe8f04548929ff28d9dc08e7f24c4b91ee6 leading BOM
changed contracts: none. No schema, migration, mobile, or lockfile change. @nestjs/config was not added.
before:
  packages/config parsed env lines by hand. loadServerEnv read the file, filled unset process.env keys, and validated on every call. Analytics ingest, OTP request, password-reset request, auth rules, local mail send, S3 construction, JWT factory, and rate-limit construction each called that loader. Auth cookies read NODE_ENV and APP_ENV from process.env.
after:
  loadEnvFile uses node:util parseEnv. A missing file stays {}. createEnvInput still spreads the file first and the explicit env second, so process env wins. parseServerEnv freezes the Zod output. main.ts and http-test-app.ts call loadServerEnv once and pass that object to AppModule.forRoot. ServerEnvModule.forRoot provides the same object as SERVER_ENV for that Nest context only. Request methods use the injected snapshot. loadServerEnv still copies keys into process.env only when process.env[key] is undefined, so PrismaClient can read DATABASE_URL. Two application contexts keep distinct frozen snapshots. Controller rate-limit guards receive TRUST_PROXY because RateLimitModule exports that token into the importing module.
parser differences adopted, with no compatibility shim:
  unquoted # starts a comment; quoted # is kept.
  double quotes interpret escapes; single quotes stay literal.
  an optional export prefix is stripped.
  only the outer quotes are removed.
  one leading U+FEFF is removed before util.parseEnv. A later BOM, including a BOM inside a quoted value, stays. A production file therefore keeps its first key and does not fall through to development/local.
  CRLF values, empty values, blank lines, full-line comments, and last-duplicate-key precedence are unchanged.
security matrix unchanged:
  APP_ENV=production requires NODE_ENV=production.
  NODE_ENV=production cannot combine with APP_ENV=local.
  production SMTP, service rules, PASSWORD_RESET_URL_BASE, S3, JWT length at least 32, and TEST_EMAIL_BYPASS prohibition apply when either variable is production.
  TEST_EMAIL_BYPASS is allowed only for NODE_ENV=test and APP_ENV=local.
  local CORS fallback stays NODE_ENV=development and APP_ENV=local.
tests/scenarios:
  packages/config 1 file, 8 tests, synthetic temp files only. The leading-BOM case expects the first key without U+FEFF, keeps a quoted BOM, and leaves a second leading BOM on the key.
  API unit 48 files, 275 tests, with BIDPLACE_ENV_FILE=/dev/null, excluding env.spec.ts.
  env.spec.ts 37 tests with BIDPLACE_ENV_FILE unset at the process. Matrix loads point at /repo/missing.env or a mocked exists check. BOM loads use a temporary synthetic file and call loadServerEnv. Path fixtures are /repo, /tmp, and that temporary file, not a real env file. Without a BOM, NODE_ENV=production and APP_ENV=production are rejected when the other variable is absent. The same files with a leading BOM are rejected the same way. A complete production profile with a leading BOM stays production and requiresProductionSecurity is true. Explicit env still overrides the file.
  ownership spec: invalid config throws before Nest; rewriting the synthetic file does not change the running snapshot; a second load sees the new file value and does not overwrite an already set process.env.DATABASE_URL; Prisma datasource fromEnvVar is DATABASE_URL and the inline value is null; two contexts differ for JWT, cookies, mail adapter, image store, trust proxy, and rate-limit capacity.
  API integration 23 files, 76 tests. Harness database name bidplace_integration on 127.0.0.1, isolated itest_ schemas, existing prisma migrate deploy. No root migrate or seed. No real .env. Test profile uses the local mail transport and postgres media adapter.
validation commands and exit codes on Node v22.20.0 / pnpm 11.7.0:
  BIDPLACE_ENV_FILE=/dev/null pnpm exec turbo run typecheck build --filter='@bidplace/config...' → 0
  pnpm --filter @bidplace/config test → 0 (1 file, 8 tests)
  root test:unit first stage, taken from package.json and run alone: pnpm --filter @bidplace/config test → 0. The rest of test:unit and pnpm verify were not run.
  BIDPLACE_ENV_FILE=/dev/null pnpm exec turbo run typecheck build --filter='@bidplace/api...' → 0 (9 tasks)
  pnpm --filter @bidplace/api lint → 0
  BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/api test --exclude src/core/config/env.spec.ts → 0 (48 files, 275 tests)
  env -u BIDPLACE_ENV_FILE pnpm --filter @bidplace/api test src/core/config/env.spec.ts → 0 (1 file, 37 tests)
  BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/api test:integration → 0 (23 files, 76 tests) on the ownership commit.
  BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/api exec vitest run --config vitest.integration.config.ts test/integration/auth-transport.integration.spec.ts test/integration/password-reset.integration.spec.ts → 0 (2 files, 8 tests) on the local disposable database. There is no OTP integration spec; OTP regressions stay in the API unit suite.
  git -c core.fsmonitor=false diff --check → 0
runtime environment: Node v22.20.0 and pnpm 11.7.0. The worktree had no .env. Browsers were not run.
remaining limitations: unquoted values that contain # are truncated by Node parseEnv; quote them. Only one leading U+FEFF is removed, so a second leading BOM still hides the first key. Prisma still reads DATABASE_URL from process.env at construction. Object.freeze is shallow. R15, R16, and R18 were not part of this change. D06 is verified by the merged R18 record, not by R17.
blocked-by: none
```

### Form field ownership evidence

```text
scope: R15 author profile fields and R16 Work draft fields. Not R17, R33, R34, C07, or R28.
status: R15 and R16 implemented. L02 NEEDS_VERIFICATION. D04, D05, D09, D10, L04, and R32 remain NEEDS_VERIFICATION. T04 and T06 remain PARTIAL. C07 remains QUEUED. C08 remains VERIFIED.
branch: fix/form-field-ownership
base SHA: 6c0fac75dc3557ffbe2aad1824c6b0585028a1b3
commits: R15 8b8d7ba1342cacdddca0e811d9fa2a9d0e651ac1; R16 3066bd440940dcdc6e58fbb72b76fcd370749fae
removed → replacement:
  R15: form.watch() plus getProfileFieldErrors(fields) on each render, and fields/fieldErrors/update props → FormProvider, useController, useWatch of the six step-gating fields, and zodResolver(profileDraftSchema). getProfileFieldErrors stays as a spec adapter over that schema. The screen no longer calls it.
  R16: form.watch() and the about/story/review value and onChange props, including setField → ProductDraftTextField, useWatch for category, title, year errors, and review title/story. The screen watches title for the wizard header.
preserved: raw contact text until profileFieldsToUpdate; Telegram and Instagram username or HTTPS; optional public contacts; auth email stays private; city, link, and email messages; step requiredness; ordinary Save without the transition lock; post-snapshot input; session epoch; moderation hold; achievement tokens; picker and blob lifetime; productDraftToWriteRequest; empty title and category remain savable; year 0..9999; required title and category only after the creation about attempt; media list ownership.
writes: setValue({ shouldDirty, shouldTouch, shouldValidate }) after transitionLock.current. field.onChange was not used, because it awaits the resolver and the rendered isDirty snapshot stays stale inside the next act(). The lock is still synchronous. shouldUnregister is false, so a step change does not clear values.
not done: handleSubmit, a shared form engine, and any change to save or submit orchestration. The R15 card names handleSubmit; this scope kept the existing guarded chains.
meaningful checks:
  seller-profile-fields.spec.ts, profile-validation.spec.ts, seller-profile-submit.spec.ts, seller-profile-logout.spec.ts, author-application-achievements.spec.ts.
  product-draft-fields.spec.ts, product-draft-form.spec.ts, product-draft-save-race.spec.ts, product-draft-submit-lifecycle.spec.ts, product-draft-route-guard.spec.ts, product-draft-wizard.spec.ts, product-draft-state.spec.ts, author-cabinet-work-cache.spec.ts.
  Focused route-guard run printed two React act warnings on ProductDraftScreen and still passed. Those tests type into a field that validates through the resolver.
skipped: Chromium, WebKit, creator-profile and Work editor E2E, native device, API server, database, migrations, seed. No .env was read.
validation commands and exit codes on Node v22.20.0 / pnpm 11.7.0:
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 0 (8 tasks, 6 cache hits)
  pnpm --filter @bidplace/mobile lint → 0
  pnpm --filter @bidplace/mobile test → 0 (108 files, 517 tests)
  pnpm --filter @bidplace/mobile test:e2e-fence → 0
  git -c core.fsmonitor=false diff --check → 0
runtime environment: Node v22.20.0 and pnpm 11.7.0
remaining limitations: L02 is not VERIFIED without browsers. react-hook-form 7.81.0, @hookform/resolvers 5.4.0, and Zod 3 were already installed. socialLink remains in the author schema and can block save, and it still has no input.
blocked-by: none for R15 and R16. Browser confirmation remains.
```

### R15 validation freshness correction

```text
scope: R15 author profile save and exit only. Not R16, R17, R33, R34, C07, or R28.
status: correction implemented. L02 remains NEEDS_VERIFICATION. D04, D05, D09, D10, L04, and R32 remain NEEDS_VERIFICATION. T04 and T06 remain PARTIAL. C07 remains QUEUED. C08 remains VERIFIED.
branch: fix/form-field-ownership
base of this correction: 65b08018994a0d5380bb72748ebfaa8bea006483
package base: 6c0fac75dc3557ffbe2aad1824c6b0585028a1b3
before → after:
  Saved Telegram https://t.me/original_author, type "bad handle", Save before the resolver settles. Before: updateProfile received telegramUrl null. After: updateProfile is not called and the field stays "bad handle".
  Step 2, invalid Telegram, wait for the error, replace it with @maker_art, close and confirm before the resolver settles. Before: the confirm action was "Выйти без сохранения" and router.replace('/') ran without updateProfile. After: the confirm action is "Сохранить и выйти", updateProfile receives telegramUrl https://t.me/maker_art, then router.replace('/').
preserved: RHF field errors; raw contact text until profileFieldsToUpdate; empty optional contacts become null; blank city still blocks save; explicit exit without save for a draft the schema rejects; ordinary Save accepts input after the request snapshot; session epoch after the mutation await; transition lock only for transition saves; achievement and moderation guards.
not done: resolver mode sync, handleSubmit, a second errors store, form.watch() of the whole draft, API, normalization, media, routes, layout, and R16.
meaningful checks:
  seller-profile-submit.spec.ts validation freshness: invalid immediate save, corrected close, invalid discard, failed exit save, repeated save and exit, session change during that save, empty contacts, blank city, back, and step 2 with empty contacts.
  profile-validation.spec.ts covers profileDraftAllowsSave. Existing achievement, logout, field, and Work specs stayed in the mobile suite.
skipped: Chromium, WebKit, creator-profile and Work editor E2E, native device, API server, database, migrations, seed. No .env was read.
validation commands and exit codes on Node v22.20.0 / pnpm 11.7.0:
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 0 (8 tasks, 6 cache hits)
  pnpm --filter @bidplace/mobile lint → 0
  pnpm --filter @bidplace/mobile test → 0 (108 files, 527 tests)
  pnpm --filter @bidplace/mobile test:e2e-fence → 0
  git -c core.fsmonitor=false diff --check → 0
runtime environment: Node v22.20.0 and pnpm 11.7.0
remaining limitations: L02 is not VERIFIED without browsers. The dirty-profile exit description still asks to save even when the schema rejects the draft and the button discards it. socialLink can still block save and still has no input.
blocked-by: none for this correction. Browser confirmation remains.
```

Для `VERIFIED` обязательны:

1. Проблема устранена либо Phase 0 доказал, что она уже устранена на новой базе.
2. Все части составного finding учтены.
3. Обязательные проверки выполнены.
4. Остаточные ограничения явно отражены.
5. Изменение документации не подменяет runtime verification.

Особые правила:

- D04 закрывается после R05 и R06.
- D07 — после R19, R20 и R21.
- C01 — после R09 и R10.
- C04 — после R10 и R13.
- L02 — после R15 и R16. Без браузерной проверки L02 остаётся `NEEDS_VERIFICATION`.
- T02 — после удаления dead tests и обработки оставшегося source-text inventory.
- T04 не закрывается после одних UI unit tests: storage/concurrency части ожидают решений R22/R23 и последующей реализации.
- Архитектурный Plan не переводит A*/S* автоматически в `VERIFIED`.
- D09 и L04 без браузерной проверки остаются `NEEDS_VERIFICATION`.
- D10 без браузерной проверки остаётся `NEEDS_VERIFICATION`.
- T06 не закрывается production regressions R32: оставшаяся test-infrastructure часть принадлежит R28.

## Дополнение 2026-09-29: R31–R35

Карточки ниже перенесены из обновления на 38 findings (`0ef712c`) 2026-09-30. Evidence R01–R08 и R31 на этой базе сохранены и не заменены тем snapshot. Исторический `QUEUED` не возвращён на уже выполненные scopes.

**База новых scopes:** `origin/feature/portfolio-mvp-release` `9932104`, включая PR #20 (`74a4879`) и PR #21 (`c1f6ebe` и родительские R31/R08 corrections).

### R31. Единый retirement private state при смене auth identity

- **Модель / режим:** Sol High / Implementation. **Wave:** 2. **Branch:** `fix/session-query-lifecycle`.
- **Findings / статус:** D09 / `NEEDS_VERIFICATION`. **Dependencies:** session epoch R05–R07; R33 для этого correctness fix не требуется.
- **Evidence:** раздел R31 evidence выше. Browser и cross-tab cookie replacement не выполнялись, поэтому D09 не `VERIFIED`.

### R32. Achievement editor: async selection, save и parent transition

- **Модель / режим:** Sol High / Implementation. **Wave:** 2. **Branch:** `fix/achievement-editor-lifecycle`.
- **Findings / статус:** D10; behavioral часть T06/T04 / `NEEDS_VERIFICATION`. **Dependencies:** R31 и R06 на интеграционной базе.
- **Actual:** поля черновика достижения, включая описание, блокируются на время add/delete. Родитель и ребёнок удерживают один token. Успешная запись отменяет незавершённое первое чтение заявки и запрашивает новое. Завершённые child write, parent save/lock и переход формы в readonly, включая принятый server snapshot, не восстанавливают старый picker. Поздний picker, чтение и callback не пишут в новую сессию. Browser не запускался, поэтому D10 не `VERIFIED`. T06 остаётся `PARTIAL` до R28. См. R32 evidence.
- **Phase 0 / начать:** `apps/mobile/src/features/sellers/AuthorApplicationAchievements.tsx`, caller в `seller-profile-screen.tsx`, API achievement methods и guards. Воспроизвести add A → ввод B → success A; picker A → session B. Проверить, какие transitions реально разрешены во время child mutation.
- **Исправить:** submitted snapshot и conditional reconciliation либо явная блокировка полей на время add; выбрать по действующему UX. Picker и callbacks проверяют epoch и selection identity. Родитель учитывает незавершённый child write перед submit/logout/exit, не отправляет параллельную конфликтующую операцию.
- **Механизм:** существующие React Query mutation variables и session epoch; без нового store. Выбранную field policy явно записать и протестировать.
- **Не менять / инварианты:** publication/privacy, server revision guard, порядок achievement, нормализация даты, обычный save других полей. Поздний A не очищает форму и не загружает файл B.
- **Тесты / done:** production parent + настоящий child, real QueryClient; delayed add, edit during save, failure/retry, picker out of order, account switch/relogin, submit/logout during add/delete. Не скрывать child mock-ом null в этих regressions.
- **Validation:** V-MOBILE, V-DIFF, targeted achievement browser privacy/transition scenarios; без браузеров D10 → `NEEDS_VERIFICATION`.
- **STOP:** требуется новый продуктовый выбор discard/save exit или изменение server protocol; остановить только зависимую часть.
- **Отчёт:** G + before/after сценарии. T04 остаётся PARTIAL; T06 не закрывать до R28.

### R33. Query и session ownership после editor corrections

- **Модель / режим:** Sol High / сначала Plan, P. **Wave:** 6. **Branch:** `feature/query-session-ownership-plan`.
- **Findings / статус:** A06 / `DECISION_REQUIRED`. **Dependencies:** R31/R32; существующие R03/R05–R07 invariants.
- **Phase 0 / начать:** `use-seller-capability.ts`, `seller-profile-screen.tsx` (`useProfileData`, `keepConfirmedPendingProfile`), `lib/query-cache.ts`, `use-private-cache-epoch.ts`, `owner-work-query.ts`. Составить key→queryFn/options/writer/policy table; проверить installed TanStack APIs.
- **Дополнение simplification / L02:** отдельно решить, нужен ли ввод во время ordinary Save. Вариант временно read-only формы может убрать reconciliation, но меняет закреплённый UX; до явного решения не реализовывать и не удалять guards. Session isolation, stale-response policy и pending locks сохраняются.
- **Варианты:** feature-owned `queryOptions` factory с общей snapshot policy; один auth-owned external store через существующий QueryCache subscription; сохранить отдельный epoch store с централизованным transition API. Сравнить invalidation, observer policy, same-account relogin, SSR/native, стоимость миграции.
- **Не менять:** production и contracts в Plan. Mutation scope лишь ставит запросы в очередь и не заменяет drop-repeat guards; AbortSignal не защищает от результата уже выполненной server mutation.
- **Инварианты / acceptance:** одна политика на private resource; stale pending/decision snapshots не откатываются; same-user refresh не стирает dirty ввод; late callbacks не пересекают сессии. Описать rollout/rollback и маленькие implementation scopes в этом roadmap.
- **Validation:** read-only consumer graph, установленный library source, существующие focused regressions при безопасном запуске. Не считать разные options доказанным runtime bug без воспроизведения.
- **STOP / отчёт:** P; отсутствие принятого решения оставляет A06 `DECISION_REQUIRED`, Plan сам finding не закрывает.

### R34. Admin media request lifecycle средствами React Query

- **Модель / режим:** Terra Medium / Implementation. **Wave:** 4, выполнение позже prerequisites. **Branch:** `fix/admin-media-query-lifecycle`.
- **Findings / статус:** L05 / `BLOCKED`. **Dependencies:** R08, принятое R33 и необходимая реализация session/cache ownership. Не выполнять раньше лишь из-за номера волны.
- **Phase 0 / начать:** `features/admin/AdminRevisionPhoto.tsx` (`useAdminObjectUrl`, `AdminRevisionPhoto`, `AdminReviewImage`), admin screen consumers, requestBlob. Сравнить объём и lifecycle до/после; сохранить вариант только если реально проще.
- **Удалить / заменить:** ручной request loading/error/race lifecycle — на установленный `useQuery` с media identity, signal и bounded private Blob cache. Object URL создать/отозвать локальным effect: это lifecycle browser resource, его не удалять вместе с fetch effect.
- **Не менять / инварианты:** cookie/bearer transport, server visibility, checksum/update identity, image decode failure, layout. Session retirement очищает private blobs, старый response не подменяет новое фото; unmount отзывает URL.
- **Тесты / done:** changed checksum, out-of-order fetch, decode error, retry, unmount, logout/relogin, pending-only image admin/public visibility. Нет утечки private cache между сессиями.
- **Validation:** V-MOBILE, V-DIFF, admin-revision-moderation browser specs Chromium/WebKit. Без браузеров — `NEEDS_VERIFICATION`.
- **STOP:** private cache lifecycle не определён или новый wrapper сложнее текущего; не добавлять dependency, предложить DEFERRED с причиной.
- **Отчёт:** G + удалённый механизм→library API→сохранённые semantics. L05 не переводить в VERIFIED одним refactor diff.

### R35. Малый пакет устранения лишних владельцев состояния и wrappers

- **Модель / режим:** Terra Medium / Implementation. **Wave:** 4. **Branch:** `fix/runtime-simplification`.
- **Findings / статус:** C08 — `VERIFIED`; C07 — `QUEUED`; L06 — `NEEDS_VERIFICATION`. R35 не закрыт. **Base:** актуальная `feature/portfolio-mvp-release`; Phase 0 сверяет наличие moderation R02 и текущего media runtime. Не переключать integration base молча. Пакет не зависит от принятия UX-вариантов R33.
- **Phase 0 / начать:** `features/admin/admin-moderation-screen.tsx` (`productAction`, `mutateProductStatus`); `features/search/panes/search-pagination.ts`, Works/AuthorsSearchPane; `features/search/search-query.ts`; `components/ui/ResilientRemoteImage.tsx`; API `core/validation/parse-body.ts`, `parse-query.ts`. Повторно проверить consumers и установленный Query Core.
- **Исправить отдельными commits в одном review:** C07 — error action брать из mutation variables, убрать дублирующий state/setters. C08 — прямые query flags в panes; timeout cleanup внутри debounce hook; одна реализация Zod parsing с прежними semantic exports, если это не увеличивает abstraction. L06 — сначала component prototype с keyed inner image; убрать только доказанно лишний uri reset lifecycle.
- **Замена:** existing React Query variables, React keyed component lifetime, стандартный timeout, existing Zod. Новые зависимости, generic controller/form/query framework не нужны.
- **Не менять:** retry delays/exhaustion/manual retry, image URLs/cache bust, error messages/envelopes, moderation targets, Apply/Cancel, public/private semantics; commerce inventory и archive не трогать.
- **Инварианты:** callbacks изображения A не изменяют B; тот же uri не сбрасывает recovery; exact error copy соответствует последней mutation; debounce посылает актуальное значение и отменяется на unmount; parse output и validation response эквивалентны.
- **Тесты:** реальный image component с fake timers и controlled callbacks; admin approve/reject/change failure/reset; pane load-more и hook rapid-input/unmount. Helper-only tests удалить только после production replacement. Сохранить unique regression coverage.
- **Validation:** V-MOBILE, V-DIFF; при API validation правках V-API и существующие controller validation cases. Browser media/search/moderation regression по затронутому поведению в подтверждённо безопасном окружении; без browser L06 остаётся NEEDS_VERIFICATION.
- **STOP:** keyed prototype требует новых синхронизируемых owners или нарушает recycling/visual behavior; оставить L06 с evidence/blocker, выполнить независимые C07/C08. Не выдавать prototype failure за VERIFIED.
- **Done/status:** каждый finding закрывается отдельно после своих проверок; не закрывать весь пакет при незавершённом L06. Итог G + удалённые owners/helpers, replacement APIs, before/after scenarios и ограничения.
- **Actual (2026-10-01):** C08 выполнен. Panes читают `items`, `hasNextPage`, `isFetchingNextPage` и `fetchNextPage` напрямую; подпись load-more остаётся «Показать ещё». `useDebouncedValue` владеет `setTimeout` и cleanup; `scheduleDebouncedCallback` удалён. `parseQuery` — alias `parseBody`, envelope и `z.output` прежние. В том же безопасном пакете `ImagesController` использует `acceptSupportedUploadMimeType`, `toContractProduct` использует `toImageContracts`, а `requestBlob` возвращает `response.blob()` без catch, который пробрасывал ту же причину. Sellers `fileFilter` с `done(null, false)` не объединялся. C07 не выполнен: после неудачной Work action успешная Author action сбрасывает `productAction`, но не прежнюю product mutation error. Замена только на `mutation.variables` меняет видимое сообщение при возврате к Work. Браузеры не запускались.
- **Actual (2026-10-01, L06):** `ResilientRemoteImage` keeps its public props and mounts `RemoteImageLifetime` with `key={uri}`. The URI reset effect, `currentUriRef`, and the interim `visibleRecovery` for a different URI are gone. A closed lifetime cannot update the next one. `requestVersion` is not part of the key, so a retry does not start a new history. Delays stay 1000/3000/8000, exhaustion still follows the fourth failure, and manual retry, cache-bust, placeholder, «Повторить», recycling key, and presentation props stay. The sync recovery ref and a mounted guard remain because timers and image callbacks need the latest state of that lifetime. `ResilientRemoteImage.spec.ts` drives the real component with fake timers and controlled `expo-image` callbacks: 9 tests passed. `media-recovery.spec.ts` still covers the pure helpers. Browsers were not run, so L06 → `NEEDS_VERIFICATION`. R35 stays open because C07 is still `QUEUED`.

## 5. Что объединять и что оставить отдельным

Объединены внутри scopes:

- D03 и hook regression из T04.
- D01 и moderation projection coverage из T04.
- D02, актуализация T03 и rendered-action coverage из T04.
- C01/C02 и тесты удалённого кода.
- C04 backend parameter cleanup с небольшим server cleanup.
- A03 и S01 в одном ownership decision.

Обязательно отдельно:

- Две формы с D04 — разные persistence/media paths.
- D07 — moderation, analytics и facets имеют разные контракты.
- R22–R27 — решения, не implementation.
- R14 focus simplification и R25 browser navigation.
- Dependency cleanup и обновление types — отдельные commits/scopes для понятного rollback.

Не трогать автоматически:

- исторические commerce tables и migrations;
- row locks, Listing guards и moderation audit;
- Expo patch без доказанного replacement;
- разные sticky implementations только ради дедупликации;
- `ResilientRemoteImage` только из-за собственной retry логики;
- Zod response validation;
- Product/Seller naming по всему repo;
- React Native dependencies только потому, что нет прямого import;
- новую библиотеку, queue или generic repository «для архитектуры».

### Проверка документа — 2026-09-27

- Сохранены все 28 исходных ID; после targeted review PR #12 добавлен D08. Плановый проход 2026-09-27 зафиксировал 29 findings. Дополнение 2026-09-29, согласованное 2026-09-30 без замены evidence этой базы, добавляет D09, D10, C06, A06, L05, T06, C07, C08 и L06. Итого 38 findings. Карточки R31–R35 присутствуют. R31 остаётся `NEEDS_VERIFICATION`, а не исторический `QUEUED`.
- Проверены обязательные поля prompts, существование явно указанных абсолютных путей, соответствие coverage matrix карточкам и отсутствие циклов prerequisites.
- Проверки документа: структурная проверка Python, `pnpm exec prettier --check docs/audits/current/00-EXECUTION-ROADMAP.md`, `git diff --check`.
- Production code, тесты, manifests, исходные audit-файлы и canonical product/design documents не изменены. Product statuses не обновлялись, поскольку поведение системы не менялось.
- Verification evidence будущих scopes пока отсутствует; ни один finding не помечен выполненным сохранением этого roadmap.

### Проверка документа — 2026-10-01

- C01 и C06 закрыты по выполненным спискам R09/R10 и удалению `persistProductDraftBeforeSubmit`. C02 и C04 остаются `PARTIAL`. C08 закрыт отдельно. C07 и L06 остаются `QUEUED`, поэтому R35 не закрыт.
- C03 остаётся `NEEDS_VERIFICATION`: кандидаты R11 удалены, export трёх платформ прошёл, runtime font rendering не запускался. C05 закрыт по isolated Zod closure и React 19 types.
- T02 остаётся `PARTIAL`: helper-only tests удалённых symbols сняты, source-text inventory и R28 не выполнены. T04 и T06 остаются `PARTIAL`.
- D04, D05, D09, D10 и L04 не переводились в `VERIFIED`. Браузеры, API bootstrap, БД, migrations и seed не запускались.
- Исторические evidence rows не заменены на `QUEUED`.

### Проверка документа — 2026-10-01 post-cleanup leftovers

- Девять остатков удалены на `fix/post-cleanup-leftovers` от `76ebd1b`. Исторические evidence R09–R12 не переписаны. Число findings не менялось.
- C02 и C04 остаются `PARTIAL`. C03 остаётся `NEEDS_VERIFICATION`. C07 и L06 остаются `QUEUED`, поэтому R35 не закрыт. R13 не начат.
- R32 остаётся `NEEDS_VERIFICATION`. D04, D05, D09, D10 и L04 не переводились в `VERIFIED`. T04 и T06 остаются `PARTIAL`.
- Браузеры, API bootstrap, БД, migrations и seed не запускались. `10-CODE-ARCHITECTURE.md` не менялся: граница пакетов не изменилась.

### Проверка документа — 2026-10-01 shared UI lifecycle

- R13 wires the existing compact button size. C04 → `NEEDS_VERIFICATION` without a browser pass. The backend `_imageSelect` removal from R10 stays.
- R14 removes AppDialog's document search and focus timers. L01 → `NEEDS_VERIFICATION`. `useOverlayFocusTrap` still serves Search and `FilterSheet`.
- L06 keys image recovery by URI. L06 → `NEEDS_VERIFICATION`. C07 stays `QUEUED`, so R35 is not closed. C08 stays `VERIFIED`.
- D04, D05, D09, D10, L04, and R32 were not moved to `VERIFIED`. T04 and T06 stay `PARTIAL`.
- Browsers, API bootstrap, database, migrations, and seed were not run. `10-CODE-ARCHITECTURE.md` was not changed: Search still uses `useOverlayFocusTrap` with `FilterSheet`. The canonical Pen file was not edited.

### Проверка документа — 2026-10-01 R17

- R17 выполнен на `fix/config-bootstrap-ownership` от `6c0fac75`. L03 → `VERIFIED`.
- Этот пакет сам не менял R15, R16 и R18.
- D04, D05, D09, D10, L01, L04, L06 и R32 не переводились в `VERIFIED`. T04 и T06 остаются `PARTIAL`. C07 остаётся `QUEUED`, поэтому R35 не закрыт. C08 остаётся `VERIFIED`.
- Браузеры не запускались. Root migrate и seed не запускались. Канонический Pen не менялся.

### Проверка документа — 2026-10-01 R17 BOM

- Один начальный U+FEFF снимается до Node `util.parseEnv`. Production-файл с BOM больше не становится development/local. Регрессии идут через `loadServerEnv`.
- Root `test:unit` запускает `@bidplace/config` test первой стадией и сохраняет `&&`. `verify` и CI workflows не переписывались.
- L03 остаётся `VERIFIED`.

### Проверка документа — 2026-10-01 form field ownership

- R15 and R16 move author and Work text fields onto the existing form. L02 → `NEEDS_VERIFICATION`. The historical R16 card still says `VERIFIED` after both; browsers and editor E2E were not run, so that gate is not met.
- Save, session, moderation, and achievement orchestration were not rewritten. `handleSubmit` was not added. R17, R33, R34, and C07 were not started.
- D04, D05, D09, D10, L04, and R32 were not moved to `VERIFIED`. T04 and T06 stay `PARTIAL`.
- Browsers, API bootstrap, database, migrations, and seed were not run. `10-CODE-ARCHITECTURE.md`, flow docs, and the design system were not changed. The canonical Pen file was not edited.

### Проверка документа — 2026-10-01 R15 validation freshness

- Save and exit now parse the current raw author draft with `profileDraftSchema`. L02 stays `NEEDS_VERIFICATION`.
- R16 was not reopened. R17, R33, R34, and C07 were not started.
- D04, D05, D09, D10, L04, and R32 were not moved to `VERIFIED`. T04 and T06 stay `PARTIAL`.
- Browsers, API bootstrap, database, migrations, and seed were not run. `10-CODE-ARCHITECTURE.md` and the canonical Pen file were not changed.

## 6. Полная coverage matrix

`E0` — исходный аудит; `E1` — повторная статическая проверка в этом planning pass; `E2` — targeted review PR #12 (`014711fa2ef4f78ad28e4759168d42ef04d5b794` → `7d2d5479f1087835271c1eb23985f2886049abb6`): logout UI отсутствовал уже на base. Это evidence наличия finding, не его исправления.

| Finding | Original finding                                                             | Severity / confidence | Wave → task/PR                       | Начальный статус   | Dependencies / blocked-by                                    | Verification evidence                                                          |
| ------- | ---------------------------------------------------------------------------- | --------------------- | ------------------------------------ | ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| D01     | Moderation list показывает parent, review меняет revision                    | P1 / HIGH             | W1 → R02                             | NEEDS_VERIFICATION | —                                                            | Current R02 evidence: NEEDS_VERIFICATION. Browser media scenario NOT RUN. |
| D02     | Approved автор не видит submit editing revision                              | P1 / HIGH             | W1 → R03                             | NEEDS_VERIFICATION | R02                                                          | Current R03 evidence: NEEDS_VERIFICATION. Chromium/WebKit NOT RUN.             |
| D03     | Shadowing `closeOnFocusIn` делает false неработающим                         | P2 / HIGH             | W1 → R01                             | VERIFIED           | —                                                            | Hook lifecycle + Chromium 17/17 + WebKit 17/17                                 |
| D04     | Save response стирает новые поля/фото                                        | P1 / HIGH             | W2 → R05, R06                        | NEEDS_VERIFICATION | R03/R04; R06 после R05                                       | Current R05+R06 evidence: NEEDS_VERIFICATION. Chromium/WebKit NOT RUN.        |
| D05     | Invalidation использует obsolete owner keys                                  | P2 / HIGH             | W2 → R07                             | NEEDS_VERIFICATION | R05                                                          | Current R07 evidence: NEEDS_VERIFICATION. Chromium/WebKit NOT RUN.            |
| D06     | Избыточные image-auth и portfolio selectors                                  | P2 / HIGH             | W5 → R18                             | VERIFIED           | R10                                                          | 2026-10-01 `fix/narrow-read-selectors` from `6c0fac7`. Auth and portfolio selects narrowed. V-API and V-INTEGRATION passed. Synthetic selected JSON shrank with the same public Work and media results. |
| D07     | Неограниченные moderation/history/analytics/facets reads                     | P2 / HIGH             | W5 → R19, R20, R21                   | QUEUED             | R02/R18                                                      | E0; bounded reads и semantic parity по трём scopes                             |
| D08     | AuthProvider/API logout есть, но нет доступного пользователю UI              | P1 / HIGH             | W1 → R30                             | VERIFIED           | —                                                            | Behavioral logout + Chromium 4/4 + WebKit 4/4, including private-history Back |
| C01     | Unreachable mobile/API files, helpers и exports                              | P2 / HIGH             | W3 → R09, R10                        | VERIFIED           | R01/R04/R05–R07                                              | 2026-10-01 inventory on `fix/audit-unused-code`. Confirmed unreachable files removed. Live OverlayHost, CreatorCardGrid, share URL, reduced motion, and portfolio predicates retained. Browser NOT RUN. |
| C02     | Legacy exports и never-thrown compatibility error                            | P3 / HIGH–MEDIUM      | W3 → R10                             | PARTIAL            | R04; consumer verification                                   | Never-thrown `RevisionMediaStorageError` and confirmed unused exports removed. Seller/Product/Listing persistence parsers retained: HEAD and archive `19eb40e` consumers are spec and barrel only. |
| C03     | Неиспользуемые fonts и лишние direct dependencies                            | P3 / HIGH–MEDIUM      | W3 → R11                             | NEEDS_VERIFICATION | Font rendering not executed                                  | 2026-10-01: unused font registrations and indirect web declarations removed. Frozen install and web/iOS/Android export passed. Runtime font rendering NOT RUN. |
| C04     | Ignored `compact` и `_imageSelect`                                           | P2 / HIGH             | W3 → R10, R13                        | NEEDS_VERIFICATION | R04/R09                                                      | 2026-10-01: `_imageSelect` stays removed. Shared action buttons pass the existing compact size. `Button.spec.ts` 6 tests passed. Browser 390/1024/1440 NOT RUN. |
| C05     | Zod отсутствует в api-client manifest; React types mismatch                  | P2 / HIGH             | W3 → R12                             | VERIFIED           | R11                                                          | 2026-10-01: api-client declares Zod 3. React 19.2 types replace React 18 types on root and mobile. Isolated deploy and typecheck passed. |
| A01     | S3 side effects внутри retryable DB transaction                              | P1 / HIGH             | W6 → R22                             | DECISION_REQUIRED  | R10/R18; consistency decision                                | E0; fake-store failure matrix, затем implementation                            |
| A02     | Двухфазный public catalog read допускает visibility race                     | P1 / MEDIUM           | W6 → R23                             | DECISION_REQUIRED  | R18/R21; consistency guarantee                               | E0 static risk; требуется controlled concurrency                               |
| A03     | Parent/revision field ownership и ручное копирование                         | P2 / HIGH             | W6 → R24                             | DECISION_REQUIRED  | R02/R18–R21; ownership decision                              | E0; field/write/read matrix                                                    |
| A04     | Два владельца navigation: Router и browser history                           | P2 / HIGH             | W6 → R25                             | DECISION_REQUIRED  | R05/R06/R14; navigation decision                             | E0/E1; transition/browser matrix                                               |
| A05     | Старые активные API без текущих UI consumers                                 | P2 / HIGH             | W6 → R26                             | DECISION_REQUIRED  | R10/R24; retirement decision                                 | E0; endpoint/consumer compatibility inventory                                  |
| L01     | Ручные focus timers/global lookup конкурируют с dialog primitive             | P2 / HIGH             | W4 → R14                             | NEEDS_VERIFICATION | R01/R09                                                      | 2026-10-01: AppDialog uses `@rn-primitives/dialog` 1.5.2. Document search and recursive focus timers removed. Web 8 + native jsdom 1 passed. Chromium/WebKit/device NOT RUN. Correction: rapid second close and unmount-while-open restore the connected opener with preventScroll. Targeted web 11 + native 1 passed. Browsers still NOT RUN. |
| L02     | RHF используется частично, остаются manual errors и field plumbing           | P2 / HIGH             | W4 → R15, R16                        | NEEDS_VERIFICATION | R03/R05/R06                                                  | 2026-10-01: author and Work text fields subscribe through the form. Save and exit parse the current raw author draft. Draft schemas stay loose. Mobile test 108 files / 527 tests. Chromium/WebKit NOT RUN. |
| L03     | Handwritten env parser и repeated request-time loading                       | P2 / HIGH             | W4 → R17                             | VERIFIED           | R04                                                          | 2026-10-01 R17 evidence: Node parseEnv, one snapshot, leading BOM stripped, config tests in test:unit. |
| L04     | Нет AbortSignal; дублируется request setup JSON/blob                         | P2 / HIGH             | W2 → R08                             | NEEDS_VERIFICATION | согласовать включение с R07                                  | Public reads pass AbortSignal; browser search scenario NOT RUN.               |
| S01     | Work ownership разбросан по Sellers/Products/Portfolio                       | P2 / HIGH             | W6 → R24                             | DECISION_REQUIRED  | A03 decision                                                 | E0; module/route/data ownership graph                                          |
| S02     | Исторические ui/figma имена скрывают реальный master ownership               | P3 / HIGH             | W6 → R27                             | DECISION_REQUIRED  | R09/R13/R14; cost/value decision                             | E0; master/wrapper/export inventory                                            |
| T01     | Contracts/database tests выпадают из discovery/build boundaries              | P2 / HIGH             | W1 → R04                             | VERIFIED           | —                                                            | Current R04 evidence: discovery, database smoke, clean dist                    |
| T02     | Dead-helper и source-text tests с низкой доказательной ценностью             | P2 / HIGH             | W3/W7 → R09, R10, R28                | PARTIAL            | соответствующий production cleanup                           | Helper-only tests for removed symbols deleted. Source-text inventory and R28 harness cleanup remain. |
| T03     | Maintained author E2E описывают старый flow                                  | P1 / HIGH             | W1 → R03                             | NEEDS_VERIFICATION | R02                                                          | Current R03 evidence: specs updated; Chromium/WebKit NOT RUN.                  |
| T04     | Не покрыты реальные seams: queue, submit, save race, overlay, S3, visibility | P1 / HIGH             | W1/W2/W6 → R01–R03, R05–R06, R22–R23 | PARTIAL            | UI части готовы к работе; полное закрытие зависит от A01/A02 | R01 overlay verified; R03 submit and R05–R07 save/cache are NEEDS_VERIFICATION; R32 achievement parent seam is NEEDS_VERIFICATION; queue/S3/visibility открыты |
| T05     | Дублирование browser сценариев и дорогого setup                              | P3 / MEDIUM           | W7 → R29                             | QUEUED             | R03/R14/R28; сохранить A04 coverage                          | E0 static overlap; требуются timings/full matrix                               |
| D09     | Refresh auth identity сохраняет private cache/epoch прежнего user            | P1 / HIGH             | W2 → R31                             | NEEDS_VERIFICATION | Интеграционная база с epoch corrections                      | Current R31 evidence. Chromium/WebKit and cross-tab cookie replacement NOT RUN. |
| D10     | Achievement add очищает более новый ввод; child lifecycle вне coordination   | P2 / HIGH (input), MEDIUM (coordination) | W2 → R32                  | NEEDS_VERIFICATION | R31/R06                                                      | Current R32 evidence. Chromium/WebKit achievement scenarios NOT RUN.          |
| C06     | persistProductDraftBeforeSubmit имеет только test consumers                  | P3 / HIGH             | W3 → R09                             | VERIFIED           | R05–R07; повторный consumer graph                            | 2026-10-01: helper and its helper-only tests removed. Product draft save/submit regressions remain. |
| A06     | Несколько владельцев profile query policy и session generation               | P2 / HIGH             | W6 → R33                             | DECISION_REQUIRED  | R31/R32; выбор ownership                                     | key/options/writer inventory, без заявления runtime race                       |
| L05     | Admin media вручную ведёт request lifecycle                                  | P3 / HIGH             | W4 → R34                             | BLOCKED            | R08; решение R33 и необходимые prerequisites                 | useAdminObjectUrl production lifecycle; semantic comparison pending            |
| T06     | Дублированный harness и пропущенная parent/achievement граница               | P2 / HIGH             | W2/W7 → R32, R28                     | PARTIAL            | R28 harness cleanup                                          | R32 covers the real parent/achievement seam. Harness cleanup remains R28.     |
| C07     | Admin productAction дублирует mutation variables                             | P3 / HIGH             | W4 → R35                             | QUEUED             | Проверить R02 на base                                        | Left open 2026-10-01. After a failed Work action, a successful Author action clears `productAction` but not the previous product mutation error. `mutation.variables` alone changes the message shown on return to Work. |
| C08     | Search helpers переупаковывают flags/timer; duplicated Zod parsing           | P3 / HIGH             | W4 → R35                             | VERIFIED           | Повторный consumer inventory                                 | 2026-10-01: panes use query flags, debounce owns its timer, `parseQuery` aliases `parseBody`. Unit checks passed. Browser search NOT RUN. |
| L06     | Image uri reset вручную синхронизирует несколько состояний                   | P3 / MEDIUM           | W4 → R35                             | NEEDS_VERIFICATION | Component prototype с сохранением retry semantics            | 2026-10-01: recovery lifetime is `key={uri}`. Retry delays, exhaustion, cache-bust, and recycling stay. Real component 9 tests passed. Browser media NOT RUN. |

**TOTAL FINDINGS: 38**

**ASSIGNED: 38**

**BLOCKED/DECISION: 10 — 8 требуют решения, T04 частично зависит от решений, L05 заблокирован prerequisites**

**UNASSIGNED: 0**
