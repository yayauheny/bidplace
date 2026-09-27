# Execution roadmap полного аудита bidplace

**Canonical файл:** `/Users/yayauheny/projects/bidplace/docs/audits/current/00-EXECUTION-ROADMAP.md`

**Источник:** последний полный аудит в этой беседе, baseline `7d2d547`. Исходный аудит и существующие audit-файлы сохраняются.

**Результат планирования:** 29 findings (28 исходных + D08 из targeted review PR #12) распределены по семи волнам и 30 небольшим scopes: 24 Implementation и 6 Plan.

**Сохранён:** 2026-09-27. **Статус документа:** R01 — `NEEDS_VERIFICATION`; R30 — `NEEDS_VERIFICATION`; scopes R02–R29 не запущены.

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

**Каждая карточка R01–R30 ниже является prompt вместе с этим блоком.** Для запуска передавать G и выбранную карточку; зависимости не считать выполненными только по названию ветки.

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
| Wave 2 | Lifecycle, сохранение формы, query ownership и cancellation    | R05–R08      |
| Wave 3 | Подтверждённый dead code, dependencies и бесполезные параметры | R09–R13      |
| Wave 4 | Упрощение средствами установленных libraries/framework         | R14–R17      |
| Wave 5 | Узкие read models и ограничение стоимости запросов             | R18–R21      |
| Wave 6 | Отдельные архитектурные решения                                | R22–R27      |
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
- **Done/status:** D01 → `VERIFIED`; T04 → `PARTIAL`.
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
- **Findings:** оставшаяся часть T02.
- **Dependencies:** R09, R10, R13–R16.
- **Начать:** `/Users/yayauheny/projects/bidplace/apps/mobile/src/lib/category-query-identity.spec.ts`; source-reading specs для FigmaTabs, ProductListScreen, ProductScreen, product-list-catalog, catalog-intro-style и Search overlay surface.
- **Phase 0:** для каждого assertion назвать реальный риск; проверить, не закрыт ли он production PR этой roadmap.
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
status: NEEDS_VERIFICATION
base SHA: e166d6e6310ce30977f402b3c657f1f062811414
commit: 3edbf99feadc79be0f514283b1f793348c68b1c9 plus the correction commit on fix/overlay-focus-dismiss whose parent is that SHA
changed contracts: none. closeOnFocusIn stays optional and defaults to false. SearchOverlay, FilterSheet and FilterMenu still omit it. FilterSheet restoreOnClose stays true. SearchOverlay restoreOnClose stays false.
tests/scenarios: mounted useDismissibleOverlay — omitted/false does not register focusin and does not close on inside or outside focus; true closes once on outside focus and ignores inside focus; cleanup removes the same listener; reopen starts open, closes on outside focus, removes that listener when open becomes false, registers a different listener when opened again, and the next outside focus adds exactly one onClose('focusin'); false still closes once on Escape (with restoreFocus) and outside pointerdown, and ignores inside pointerdown. The omitted/false listener assertions fail on the previous shadowed callback.
validation commands and exit codes:
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile lint → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile test → 0 (396 tests) on Node v22.20.0
  pnpm --filter @bidplace/mobile test:e2e-fence → 0 on Node v22.20.0
  EXPO_NO_DOTENV=1 BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/mobile exec playwright test e2e/search-overlay.spec.ts --project=chromium --project=webkit → 1
runtime environment: supported V-MOBILE re-run used Node v22.20.0, matching root engines >=22 <23, and pnpm 11.7.0. An earlier local run used Node v24.17.0 and is not supported-runtime verification. Hook spec uses the jsdom environment already installed with vitest 4.1.10. No new dependency. Playwright was not repeated.
evidence links: apps/mobile/src/components/layout/use-dismissible-overlay.ts; apps/mobile/src/components/layout/use-dismissible-overlay.spec.ts
remaining limitations: Playwright webServer exited before any browser test. prepare.mjs failed with PrismaClientInitializationError: authentication failed for user auction at 127.0.0.1:5432. The fenced default URL was not replaced.
blocked-by: disposable database credentials for postgresql://auction@127.0.0.1:5432/bidplace_e2e
```

### R30 evidence

```text
scope: R30
finding IDs: D08
status: NEEDS_VERIFICATION
base SHA: f276180b61822b5304b6b16d95a48370698651d1
commit: single commit on fix/account-logout-entry, parent f276180b61822b5304b6b16d95a48370698651d1
changed contracts: none. AuthProvider.logout still clears the local session in finally. No auth API or route change.
tests/scenarios: AccountLogoutButton — guest renders nothing; one logout call; a second press while pending does not call logout again; success and rejected server logout both router.replace('/'); rejection is logged with the infrastructure error policy and is not an unhandled rejection. Seller profile — dirty fields or a new photo open the existing exit dialog and do not call logout; «Продолжить заполнение» does not logout; confirmed save runs before logout and then replace('/'); failed save stays on the form and does not logout; a clean profile logs out directly; clean «Закрыть» still goes home without logout; missing, draft, and pending-review profiles render «Выйти». Reachability — approved cabinet, suspended cabinet, admin moderation, and email verification render «Выйти». Verify email — a pending verification disables logout and does not call it; a pending logout disables confirm and request-code; a verify started after logout does not call refreshSession. AuthProvider — rejected api.auth.logout still clears the session and private seller cache, keeps public query data, and the protected route redirects to /login. Pre-existing defect, not a PR #12 regression.
validation commands and exit codes:
  EXPO_NO_DOTENV=1 pnpm exec turbo run typecheck build --filter='@bidplace/mobile...' → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile lint → 0 on Node v22.20.0
  pnpm --filter @bidplace/mobile test → 0 (416 tests) on Node v22.20.0
  pnpm --filter @bidplace/mobile test:e2e-fence → 0 on Node v22.20.0
  EXPO_NO_DOTENV=1 BIDPLACE_ENV_FILE=/dev/null pnpm --filter @bidplace/mobile exec playwright test e2e/account-logout.spec.ts --project=chromium --project=webkit → 1
runtime environment: Node v22.20.0, matching root engines >=22 <23. No new dependency. Specs use the jsdom environment already installed with vitest. Playwright used apps/mobile/playwright.config.ts and the default disposable database URL.
evidence links: apps/mobile/src/features/auth/AccountLogoutButton.tsx; apps/mobile/src/features/auth/account-logout.ts; apps/mobile/src/features/sellers/seller-profile-screen.tsx; apps/mobile/src/features/sellers/author-cabinet-screen.tsx; apps/mobile/src/features/admin/admin-moderation-screen.tsx; apps/mobile/src/features/auth/verify-email-form.tsx; apps/mobile/e2e/account-logout.spec.ts
remaining limitations: Playwright webServer exited before Chromium or WebKit ran a test. prepare.mjs failed with PrismaClientInitializationError: authentication failed for user auction at 127.0.0.1:5432. The fenced default URL was not replaced. Browser Back and role flows in e2e/account-logout.spec.ts are therefore not verified.
blocked-by: disposable database credentials for postgresql://auction@127.0.0.1:5432/bidplace_e2e
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
- L02 — после R15 и R16.
- T02 — после удаления dead tests и обработки оставшегося source-text inventory.
- T04 не закрывается после одних UI unit tests: storage/concurrency части ожидают решений R22/R23 и последующей реализации.
- Архитектурный Plan не переводит A*/S* автоматически в `VERIFIED`.

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

- Сохранены все 28 исходных ID; после targeted review PR #12 добавлен D08. Итого 29 findings и 30 prompts; 24 Implementation и 6 Plan. Существующие scopes не перенумерованы; дополнены только кандидаты R09 и новый Wave 1 scope R30.
- Проверены обязательные поля prompts, существование явно указанных абсолютных путей, соответствие coverage matrix карточкам и отсутствие циклов prerequisites.
- Проверки документа: структурная проверка Python, `pnpm exec prettier --check docs/audits/current/00-EXECUTION-ROADMAP.md`, `git diff --check`.
- Production code, тесты, manifests, исходные audit-файлы и canonical product/design documents не изменены. Product statuses не обновлялись, поскольку поведение системы не менялось.
- Verification evidence будущих scopes пока отсутствует; ни один finding не помечен выполненным сохранением этого roadmap.

## 6. Полная coverage matrix

`E0` — исходный аудит; `E1` — повторная статическая проверка в этом planning pass; `E2` — targeted review PR #12 (`014711fa2ef4f78ad28e4759168d42ef04d5b794` → `7d2d5479f1087835271c1eb23985f2886049abb6`): logout UI отсутствовал уже на base. Это evidence наличия finding, не его исправления.

| Finding | Original finding                                                             | Severity / confidence | Wave → task/PR                       | Начальный статус   | Dependencies / blocked-by                                    | Verification evidence                                                          |
| ------- | ---------------------------------------------------------------------------- | --------------------- | ------------------------------------ | ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| D01     | Moderation list показывает parent, review меняет revision                    | P1 / HIGH             | W1 → R02                             | QUEUED             | —                                                            | E0/E1; после: revision queue + security integration                            |
| D02     | Approved автор не видит submit editing revision                              | P1 / HIGH             | W1 → R03                             | QUEUED             | R02                                                          | E0/E1; после: rendered action + E2E                                            |
| D03     | Shadowing `closeOnFocusIn` делает false неработающим                         | P2 / HIGH             | W1 → R01                             | NEEDS_VERIFICATION | —                                                            | Hook lifecycle passed; Playwright search-overlay blocked on disposable DB auth |
| D04     | Save response стирает новые поля/фото                                        | P1 / HIGH             | W2 → R05, R06                        | QUEUED             | R03/R04; R06 после R05                                       | E0/E1; delayed-response regressions                                            |
| D05     | Invalidation использует obsolete owner keys                                  | P2 / HIGH             | W2 → R07                             | QUEUED             | R05                                                          | E0/E1; retained cabinet scenario                                               |
| D06     | Избыточные image-auth и portfolio selectors                                  | P2 / HIGH             | W5 → R18                             | QUEUED             | R10                                                          | E0; auth/DTO parity + query evidence                                           |
| D07     | Неограниченные moderation/history/analytics/facets reads                     | P2 / HIGH             | W5 → R19, R20, R21                   | QUEUED             | R02/R18                                                      | E0; bounded reads и semantic parity по трём scopes                             |
| D08     | AuthProvider/API logout есть, но нет доступного пользователю UI              | P1 / HIGH             | W1 → R30                             | NEEDS_VERIFICATION | —                                                            | Behavioral logout passed; Chromium/WebKit blocked on disposable DB auth        |
| C01     | Unreachable mobile/API files, helpers и exports                              | P2 / HIGH             | W3 → R09, R10                        | QUEUED             | R01/R04/R05–R07                                              | E0 graph+rg; повторный consumer inventory                                      |
| C02     | Legacy exports и never-thrown compatibility error                            | P3 / HIGH–MEDIUM      | W3 → R10                             | QUEUED             | R04; consumer verification                                   | E0/E1; export inventory и package builds                                       |
| C03     | Неиспользуемые fonts и лишние direct dependencies                            | P3 / HIGH–MEDIUM      | W3 → R11                             | QUEUED             | R09; Metro/native verification                               | E0/E1; clean install + bundles                                                 |
| C04     | Ignored `compact` и `_imageSelect`                                           | P2 / HIGH             | W3 → R10, R13                        | QUEUED             | R04/R09                                                      | E0/E1; primitive behavior + media guards                                       |
| C05     | Zod отсутствует в api-client manifest; React types mismatch                  | P2 / HIGH             | W3 → R12                             | QUEUED             | R11                                                          | E0/E1 manifests; isolated builds/typecheck                                     |
| A01     | S3 side effects внутри retryable DB transaction                              | P1 / HIGH             | W6 → R22                             | DECISION_REQUIRED  | R10/R18; consistency decision                                | E0; fake-store failure matrix, затем implementation                            |
| A02     | Двухфазный public catalog read допускает visibility race                     | P1 / MEDIUM           | W6 → R23                             | DECISION_REQUIRED  | R18/R21; consistency guarantee                               | E0 static risk; требуется controlled concurrency                               |
| A03     | Parent/revision field ownership и ручное копирование                         | P2 / HIGH             | W6 → R24                             | DECISION_REQUIRED  | R02/R18–R21; ownership decision                              | E0; field/write/read matrix                                                    |
| A04     | Два владельца navigation: Router и browser history                           | P2 / HIGH             | W6 → R25                             | DECISION_REQUIRED  | R05/R06/R14; navigation decision                             | E0/E1; transition/browser matrix                                               |
| A05     | Старые активные API без текущих UI consumers                                 | P2 / HIGH             | W6 → R26                             | DECISION_REQUIRED  | R10/R24; retirement decision                                 | E0; endpoint/consumer compatibility inventory                                  |
| L01     | Ручные focus timers/global lookup конкурируют с dialog primitive             | P2 / HIGH             | W4 → R14                             | QUEUED             | R01/R09                                                      | E0/E1; focus/animation/browser regressions                                     |
| L02     | RHF используется частично, остаются manual errors и field plumbing           | P2 / HIGH             | W4 → R15, R16                        | QUEUED             | R03/R05/R06                                                  | E0/E1; form/state regressions                                                  |
| L03     | Handwritten env parser и repeated request-time loading                       | P2 / HIGH             | W4 → R17                             | QUEUED             | R04                                                          | E0/E1; synthetic config/security matrix                                        |
| L04     | Нет AbortSignal; дублируется request setup JSON/blob                         | P2 / HIGH             | W2 → R08                             | QUEUED             | согласовать включение с R07                                  | E0/E1; cancellation/error-classification tests                                 |
| S01     | Work ownership разбросан по Sellers/Products/Portfolio                       | P2 / HIGH             | W6 → R24                             | DECISION_REQUIRED  | A03 decision                                                 | E0; module/route/data ownership graph                                          |
| S02     | Исторические ui/figma имена скрывают реальный master ownership               | P3 / HIGH             | W6 → R27                             | DECISION_REQUIRED  | R09/R13/R14; cost/value decision                             | E0; master/wrapper/export inventory                                            |
| T01     | Contracts/database tests выпадают из discovery/build boundaries              | P2 / HIGH             | W1 → R04                             | QUEUED             | —                                                            | E0/E1; discovered tests + build output                                         |
| T02     | Dead-helper и source-text tests с низкой доказательной ценностью             | P2 / HIGH             | W3/W7 → R09, R10, R28                | QUEUED             | соответствующий production cleanup                           | E0; assertion→behavior matrix                                                  |
| T03     | Maintained author E2E описывают старый flow                                  | P1 / HIGH             | W1 → R03                             | QUEUED             | R02                                                          | E0/E1; оба актуализированных browser specs                                     |
| T04     | Не покрыты реальные seams: queue, submit, save race, overlay, S3, visibility | P1 / HIGH             | W1/W2/W6 → R01–R03, R05–R06, R22–R23 | PARTIAL            | UI части готовы к работе; полное закрытие зависит от A01/A02 | R01 покрыл overlay hook lifecycle; browser seam и остальные seams открыты      |
| T05     | Дублирование browser сценариев и дорогого setup                              | P3 / MEDIUM           | W7 → R29                             | QUEUED             | R03/R14/R28; сохранить A04 coverage                          | E0 static overlap; требуются timings/full matrix                               |

**TOTAL FINDINGS: 29**

**ASSIGNED: 29**

**BLOCKED/DECISION: 8 — 7 требуют решения, T04 частично зависит от этих решений**

**UNASSIGNED: 0**
