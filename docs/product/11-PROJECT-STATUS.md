# bidplace — текущий статус проекта

Срез документации: 2026-10-23, база `872f22fc`. Portfolio-only контракт:
[05-MVP-RFC](05-MVP-RFC.md). Открытая работа — [active backlog](16-PORTFOLIO-ACTIVE-BACKLOG.md),
релизные gates и последние результаты — [release audit](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
Здесь только текущая сводка; старые checkpoints не являются новым green.

| Область | Статус и основание |
| --- | --- |
| Portfolio discovery, author/Work lifecycle и moderation | Implemented для проверенного локального среза: `portfolio`, `products`, `sellers`, `admin-moderation` в `apps/api/src`; revision/public guards и HTTP/media tests. Live acceptance остаётся отдельной. |
| Auth и согласие | Partial (PR #58 синхронизируется и проверяется): серверные сессии, email-code/OIDC и proof до создания пользователя добавлены локально; полная CI-приёмка текущего merge ещё не завершена. Сохранены: одно явное подтверждение (DEC-124/125), атомарный User+evidence, lazy legal GET не блокирует регистрацию; [приёмка](../audits/2026-10-20-REGISTRATION-DOCUMENT-ACCESS.md). Это не юридическая готовность пакета. |
| Author Story / каталоги / история Work | Implemented для проверенного client/API cutover: `use-product-story-editor.ts` вызывает `api.products.replaceCreation`, `ProductsController` → `ProductsService.replaceCreationStory`, revision-owned blocks; [UI completion](../audits/current/2026-10-21-UI-COMPLETION.md), [review](../audits/current/2026-10-21-INDEPENDENT-UI-REVIEW.md). Архивное «B6 не начат» — исторический checkpoint. |
| Responsive UI, account/settings, author/header/footer | Partial: реализация и browser evidence есть; настройки имеют исключённое смещение заголовка, физические устройства/zoom и точный desktop parity не закрыты. [Design status](../design/04-DESIGN-STATUS.md). |
| Фото Work и автора (DEC-131/132) | Partial: `ImageProcessor`/Sharp и пофайловый upload объединены с release wizard; local verify/media E2E прошли. Live R2/CDN, устройства и Figma новых статусов — Needs verification. |
| Удаление своей Work (DEC-123) | Not implemented: в `ProductsController` нет DELETE Work, в `Product` нет tombstone. Hide/unhide не удаляет работу. [Backlog и незакрытый backend/security-план](16-PORTFOLIO-ACTIVE-BACKLOG.md). |
| Legal / операции / live abuse protection | Partial / Needs verification: [legal owner](../legal/00-FINAL-LEGAL-AUDIT.md), [operations](../ops/00-RELEASE-AND-BACKUP.md), [release gates](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md). Локальные tests не доказывают SMTP delivery, production Turnstile или CDN purge. |
| Commerce, избранное/подписки, смена email/password из settings | Not implemented в launch scope / post-MVP; [следующая волна](15-POST-MVP-BACKLOG.md). Старый commerce runtime не разрешает включать продажи. |

## 2026-10-25 — Filled active dock icons

**Implemented (local browser verification passed).** `FloatingDock` passes its
existing selected state to `FigmaIcon` for filled Home/Search/Profile glyphs.
No route/API/auth/permission or navigation-state changes. Passed: 1051 mobile
unit tests, six Chromium/WebKit dock E2E, typecheck/lint and web build. Older dock
fixtures were checked against `8318f956`: direct login now hides the dock and
Home/footer have separate brand links; test routes/selectors were corrected
without weakening geometry, blur or focus assertions. Native devices not checked.

## 2026-10-25 — Explore acceptance refinements

**Implemented (local browser verification passed).** `FigmaTabs` moves one selection fill with
Reanimated and reduced motion; `FigmaIcon` owns constant physical 1.3/1.6px strokes
and the full Back arrow. Explore panes use the Figma empty-search state via
`SearchPaneStatus`/`PageState`; viewport content keeps the footer below the first
screen and active filters remain accessible. No API/schema/route changes.
Passed: 1051 mobile unit tests, 36 Chromium/WebKit E2E, typecheck/lint,
web/iOS/Android exports, 191 docs links and diff checks. Physical native
keyboard/Back/motion and exact desktop parity remain unverified.

## 2026-10-24 — Mobile moderation UI

**Partial (final verification pending).** `AdminModerationScreen` uses opt-in
summary cards; protected detail routes share gallery, vertical comparison,
history and captured-target decisions. Existing Users/catalog actions remain.
Admin dock separates `/admin`, `/analytics`, `/account`; ordinary dock unchanged.
Mobile source/UX review fixes and local checks are in the [UI audit](../audits/current/2026-10-24-ADMIN-MODERATION-UI.md).
No role/migration/deploy. Hardware/exact desktop parity remain unverified.

## 2026-10-24 — Moderation filter contract clarification

**Implemented (local verification passed).** `adminQueueQuerySchema` now describes existing overlapping
filters: `APPROVED` selects the parent; review filters select editing revisions.
Extended seller/Work summary integration assertions cover approved parents with
pending edits. No selection logic, authorization, DTO fields or UI taxonomy changed.
17 owner HTTP/PostgreSQL tests, 47 contracts tests, contracts/API typecheck, API
lint/build with dependencies, docs links and diff checks passed. Independent
review has no substantial open findings; remote CI is recorded in PR #62.

## 2026-10-23 — Admin foundation

**Implemented (local verification passed).** Protected summary/detail/history API in
`AdminController`/`AdminModerationService`, revision submission cursor with unknown
time, separate snapshots, additive audit metadata and restore generations.
Seller restore, replay and media completion/deletion ownership corrected in the
existing lifecycle. Owner integration specs cover three restore cycles, outage,
lease takeover, UTC/history and private preview. Full `pnpm verify` passed;
follow-up API checks passed after the final inline-history correction.
No production migration/deploy.
[Scope, compatibility and verification](../audits/current/2026-10-23-ADMIN-FOUNDATION.md).

## 2026-10-24 — Analytics review corrections

**Partial (local verification passed; production prerequisites remain).** `publicAnalyticsPage` now follows canonical `/seller/[slug]`
and excludes its redirect alias. `WebAnalyticsCollector` preserves delivery without
Web Locks using one in-tab queue; simultaneous cold tabs can establish separate
browser identities. Extended owner units and navigation browser checks cover both
modes: 1036 mobile unit tests and eight Chromium/WebKit scenarios passed, as did
typecheck, lint, web build and docs links. Independent review has no substantial
open findings; remote CI is recorded in PR #63. No production enablement.

## 2026-10-23 — Analytics foundation

**Partial (local verification passed; production prerequisites remain).** Additive version 2 web ingestion in
AnalyticsService/AnalyticsProvider, signed browser proof, database dedupe/shared
inactivity sessions, three registration creation boundaries and protected
`/api/admin/analytics/foundation` with UTC/cohort/first-publication metrics.
Existing collection/dashboard remain legacy; new flags default off. Additive
migration only; no production enabling, policy publication or consent UI.
Full workspace verify, Cloudflare checks and Chromium/WebKit opt-in/off scenarios
passed; independent review has no remaining substantial findings.
[Definitions](analytics-metrics.md), [scope/checks](../audits/current/2026-10-23-ANALYTICS-FOUNDATION.md).

## 2026-10-23 — Оптимизация документации

**Implemented (docs only).** Сокращены `AGENTS.md`, карта чтения и product index;
текущие design/project/release сводки отделены от полных исторических журналов.
Убраны устаревшие execution-промпты с восстановлением из Git; DEC, security,
legal, raw research и evidence сохранены. Изменений API/UI/БД/deploy нет.
Измерения, список удалений и проверки — [cleanup report](../CLEANUP-REPORT.md).

## 2026-10-23 — Фото в объединённом MVP

**Partial (local verification passed).** SOURCE — приватный нормализованный
мастер до 5 МиБ (портрет до 2 МиБ); галерея принимает до 25 МиБ/8192 px/50M,
мастер до 4096 px; JPEG/PNG/WebP, EXIF-поворот, compact 16-bit PNG,
удаление metadata из публичных производных. Сохраняются partial success,
abort/timeout/idempotency и совместимость p1/p2.

До выпуска API обязательны миграции `20261022120000_normalized_media_source`
и `20261022180000_legacy_image_upload_identity`. Production migrations/deploy
не выполнены этим проходом. Результаты объединённого дерева: `pnpm verify`
(479 API unit, 1023 mobile, 159 integration, 28 прежних skips, web/iOS/Android
exports), 6 media E2E Chromium/WebKit и production web build прошли по записи
PR #59. CI точного merge SHA в этой документационной задаче не перепроверялся.

## 2026-10-23 — Portfolio design

**Browser-verified; native/live acceptance remains Partial.** `ProductDraftImagesStep`
использует адаптивные media tiles и bottomAction; автор — пять визуальных шагов
без изменения numeric URL/API стадий, с сохранением фото и сверкой после потерянного
ответа create. Общие CoverFrost, icon-button surface и creation chrome обновлены;
существующий footer проверен на нужных routes. Backend/API/media lifecycle не менялись.
Проверки, независимые ревью, Figma mapping и ограничения —
[portfolio audit](../audits/current/2026-10-23-PORTFOLIO-DESIGN.md).

## История и обновление

- [Полный журнал 20–23 октября](../archive/product/11-PROJECT-STATUS-2026-10-20-23.md).
- [Журнал до 19 октября](../archive/product/11-PROJECT-STATUS-historical.md).

После изменения поведения обновить нужную строку и добавить одну короткую запись
со статусом, owner-модулями и фактически выполненными проверками. Детали приёмки
оставлять по ссылке в owner audit; не копировать его целиком сюда.


## 2026-10-23 — PR #58: auth + фото на актуальной MVP

**Partial (local verification passed; production gates remain).** База `7d0dc179`
объединена с auth `2e6fc2d1` в `feature/web-auth`. Сохранены SessionService,
EmailProofService/AuthAbuseService, normalized SOURCE/ImageProcessor, upload API
и новые auth/media migrations. Upgrade с MVP проверен с сохранением пользователя
и SOURCE; существующие security/media owners прошли полный `pnpm verify`; 32/32
Chromium/WebKit auth/media browser checks прошли. E2E API-транспорт получил
обязательные Origin/CSRF headers без изменения assertions/timeouts.
CI startup Expo воспроизвёл ошибку React Native из-за `NODE_ENV=test`:
только dev server получает development-окружение; workflow очищает группы
Expo/Vitest/Playwright при завершении и показывает Expo log при сбое.
Auth DEC-133–135 не перекрывают фото DEC-131/132. DEC-136 фиксирует синхронный
SMTP и открытый request timing; verify оценивается отдельно.

[Проверки, измерения, причины выбора SMTP и оставшиеся gates](../audits/current/2026-10-23-PR58-MERGE-VERIFICATION.md).
Ready — только после полного зелёного CI итогового SHA; merge/deploy не выполняются.

## 2026-10-23 — PR #58: SMTP rejection/replay

**Partial (release gates remain).** `EmailProofService` воспроизводил ложный
успех replay после SMTP rejection и раздельную запись outcome/очистки кода.
Исправление связывает replay с ledger операции, атомарно снимает код/cooldown
только её активного ключа, сохраняет расход трёх flow attempts и общие квоты.
`AuthFlowService` читает согласованный email state; `OnboardingForm` обновляет
rejected state и меняет ключ без reload, сохраняя ключ при неопределённом сбое.
HTTP owner покрывает delayed SMTP, поздние outcomes, rollback и потерю commit
acknowledgement; client submit owner — три класса отказа. Результаты итогового
SHA и CI — [PR #58](https://github.com/yayauheny/bidplace/pull/58) и
[отчёт](../audits/current/2026-10-23-PR58-MERGE-VERIFICATION.md).
DEC-136 и production gates сохраняются; merge/deploy не выполняются.


## 2026-10-23 — Сохранение незавершённого upload retry

**Implemented (client guard).** `useProductDraftImageActions` не открывает новый
picker, пока сохранена незавершённая пачка; `ProductDraftImagesStep` блокирует
Add до её завершения либо явной отмены остатка. Отмена не удаляет сохранённые
фотографии. Retry сохраняет Blob/ключ и не повторяет успешные файлы;
существующие lifecycle unit/media browser owners проверяют блокировку и повторное
разрешение выбора. Интро автора приглашает создать portfolio без обещания продаж.
Backend/API/media contract не изменены; детали проверок —
[portfolio audit](../audits/current/2026-10-23-PORTFOLIO-DESIGN.md).


## 2026-10-23 — Завершение галереи перед продолжением

**Implemented (client flow guard).** `canOpenProductWizardStep` и
`useProductDraftNavigation` блокируют последующие шаги при незавершённой upload
очереди. Continue/step selector используют то же правило; после retry/cancel
переход разрешён. Lifecycle/media browser owners проверяют ошибку, retry и отмену;
серверный контракт и возможность сохранить частичный draft не менялись.

## 2026-10-24 — Mobile analytics UI

**Partial (local API/mobile/adaptive acceptance and builds passed; CI/hardware pending).**
`AdminAnalyticsScreen` replaces legacy overview consumption with the protected
foundation API: browsers/sessions/views/all registrations, proven 30-day cohort,
first-publication growth and current moderation. Existing read contract accepts
opt-in activity fields; no persistence/dependency changes. Server collection
permission and client build collector are distinct; unknown history/coverage and
immature/empty cohorts stay explicit. PostgreSQL19 owner tests, period11 and client49
pass. Mobile screenshots/review and final checks: [audit](../audits/current/2026-10-24-ADMIN-ANALYTICS-UI.md).

Analytics UI accessibility follow-up: labelled period/metric panels and
keyboard/DOM associations use the existing public-screen pattern; no API change.

## 2026-10-24 — Analytics day selection review

**Partial (local browser/typecheck/lint passed; hardware/production remain open).**
`AdminAnalyticsGrowth` replaces up to 90 inline day tabs with one existing
`FigmaSelectField` and compact searchable `FilterSheet`. `FilterOptionRow` adds
opt-in radio navigation; the group preserves ordering, one Tab entry and focus
return. Independent source review found no remaining actionable issues.
No API, service, table, migration or dependency changes in this correction.
Checks and evidence: [analytics audit](../audits/current/2026-10-24-ADMIN-ANALYTICS-UI.md).

Moderation UI accessibility follow-up: labelled detail tabpanel and queue selection
toolbars replace dangling references; web keyboard/DOM acceptance4/4 passes. Native
selected-state branches are covered by owner units; physical screen reader remains
Needs verification.

## 2026-10-24 — Moderation UI review follow-up

**Partial (checks in progress).** `AdminModerationDetail` returns through existing
navigation after a decision, preserving a mounted queue/search/filter/scroll
instead of querying an unrelated default next item. Existing PUBLISH
PENDING/RUNNING metadata blocks further revision decisions and exposes status
refresh; FAILED retry and parent restoration keep their existing server rules.
No API, persistence or permission changes. Owner19 tests and independent source
review passed; browser/CI results are recorded in PR #64.

## 2026-10-25 — Unified Explore

**Partial / Needs verification.** `apps/mobile/src/features/explore` owns one
canonical route, URL codec, navigation-entry drafts/scroll, inline Reanimated
header and three panes reusing `usePortfolioWorks`, `usePortfolioAuthors` and
`categoryKeys.all`. Works/Authors/Search aliases and Dock/Home/Desktop/footer
are migrated; old overlay/provider/surfaces and standalone catalogs removed.
No backend/API/auth/media changes. Owner regressions cover X/filter separation,
section drafts, reload/Back/Forward, pagination/retry and result-tree identity.
Verified:1047 mobile unit tests, typecheck/lint,70 Chromium/WebKit E2E +8 geometry checks, Web/iOS/Android exports, fence and docs links. PR44 reconciliation and remaining device/design gaps:
[Explore report](../audits/current/2026-10-25-EXPLORE.md).
