# bidplace — текущий статус проекта

> Entries dated before 2026-10-13 mention Pen / .pen files; the Pen design was removed (DEC-119) — read those mentions as history.

## 2026-10-14 — W4 component dedup (Wave 2)

- `Implemented`: дедуп-коммит-срез плана. `BackButton` (3 варианта) вместо 3 ручных реализаций; одна RN `FigmaTabs` (`.web.tsx` удалён, паттерн `fill`, клавиатурная a11y сохранена); `PaddedGrid` вместо трёх инлайн-сеток; `DestructiveButton` удалён (дубликат `PrimaryButton`); `AppIcon` + `lucide-react-native` вычищены; галка `FilterOptionRow` — `FigmaIcon check`; `WorkGallery` — `onMomentumScrollEnd`. Детали — в `04-DESIGN-STATUS.md`.
- Нетто строк (факт по диффу, правка ревьюера W2.1): +443/−398 = **+45** по полному диапазону В2; **+10** без спек/доков/e2e/lockfile. Критерий «≤ 0» формально не достигнут и принят ревьюером по существу: новые общие компоненты (BackButton, PaddedGrid, клавиатурный слой табов) законно добавляют строки при первом введении при 5 устранённых классах дублей.
- Проверки: typecheck, lint, vitest 792 passed + 1 known; e2e `tab-switch-reveal` 5/5 (root-cause гейта: `creationStory` в фикстуре), `author-static-header`, `search-overlay` зелёные. rg-пусто по `lucide|AppIcon|DestructiveButton` — **вне `*.spec`** (в `author-cabinet-work-cache.spec` мёртвый мок, починка в В4). Known issues (проверено на базе 7f0e53ec): e2e `catalog-pagination` ×2 (данные), `creator-profile:11`, `search-overlay:35`, загрузка `author-cabinet-work-cache.spec`; админ-фейл «Описание не указано» — не «предсуществующий», а **вскрытый починкой загрузки дефект** теста/экрана (с диффом не связан) — в бэклог В4.
- Не тронуто (защищено): FigmaButton-метрики, dock 232×64, frost, AppDialog (только источник glyph закрытия), Safe Area, `BidplaceBrand`, auth-экраны, значения токенов.

## 2026-10-14 — W3 token diet (Wave 1 + W1.1)

- `Implemented`: единый источник токенов — `designTokens` (rename 61 файла, алиас удалён), 3 мёртвых токена удалены, `size.input` 51→50 (Q5). Ограждения: eslint храповик (deep-imports, lucide, RN Modal/Touchable, hex-литералы) + спека покрытия токенов. Dock z-index из токена `layer.dock`. Детали и 13 grandfathered нечётных значений — в `04-DESIGN-STATUS.md`.
- Проверки: typecheck, lint, полный vitest 770/770 (после пересборки токенов). Pre-existing не блокирует: `tab-switch-reveal` 4 падения e2e (root-cause — первый шаг Волны 2), 2 файловых падения vitest (Волна 4).
- Не тронуто (защищено): FigmaButton-метрики, dock 232×64, frost, AppDialog, Safe Area, `BidplaceBrand`, auth-экраны.

## 2026-10-13 — W2 fluid AppShell

- `Partial` (mobile web accepted): `navigation.spec.ts` passes in Chromium and WebKit for Home, Authors, Works, Work, public author and Search at 390/440/768/1024/1440. It verifies the 1280/12 content contract and no horizontal overflow for AppShell routes, 390px Work Gallery, and the separate full-viewport Search overlay contract; screenshots are in `/tmp/w2-shots`.
- `Needs verification`: native PWA Safe Area. The Dock deliberately remains the existing 232×64 capsule because W2 does not authorize a visual Dock change, even though the audit cites a separate 358×64 reference. No API, database or route changed.

## 2026-10-13 — W1 shared sheet mechanism

- `Partial`: Chromium and WebKit owner specs now exercise compact 390/1440 and full 390 sheets, including Escape, explicit close, compact-backdrop dismissal and focus return. Evidence and screenshots are in `author-static-header.spec.ts`, `discovery-launch.spec.ts`, and `/tmp/w1-fix-shots`.
- `Needs verification`: record a reliable base-to-HEAD comparison for compact/full/share/media bottom spacing before accepting W1. Native devices remain open; no product/API/database contract changed. This matches `05-MVP-RFC.md` discovery behavior and leaves commerce controls inactive.

## 2026-10-12 — Work Catalog integration (PR #37)

- **Implemented in code:** Work author editor uses catalog term IDs and moderated proposals; materials and techniques use searchable Figma chips, category uses single-select chips. Existing selected terms, rejected proposals and revision hydration are retained.
- **Admin moderation:** uses existing API to map proposals to active catalog entries, create new entries, or reject with a reason. Work approval is disabled while selected pending proposals remain; display uses canonical term names.
- **Verification policy:** expensive Browser E2E and Release Gate are manual-only. Current follow-up commits deliberately include `[skip ci]` at the founder's request; they have **not** had a fresh full test or E2E run. Earlier green checks apply to earlier SHAs only.
- **Pending handoff:** run local TypeScript, lint, targeted Vitest and browser smoke on exact PR HEAD before merge. The category catalog is flat and single-select by contract: Figma-style nested category grouping would require a separate taxonomy decision, not fabricated groups.
- **Merge order:** PR #34 author onboarding first, then this stacked PR #37; target portfolio MVP, never `main` directly.

## 2026-10-12 — GitHub Actions verification policy (`fix/portfolio-work-catalog-client`)

- `Needs verification`: `.github/workflows/verify.yml` checks draft PRs with TypeScript, lint, and config/contracts/API-client unit tests. Ready PRs, release-branch pushes, and manual dispatch run the unchanged full `pnpm verify`, Cloudflare checks, web build, and container image verification. Feature pushes are covered via PR events only, to avoid duplicate workflows; `ready_for_review` and `converted_to_draft` re-evaluate the gate.
- `Implemented` in source: root `test:unit` builds the API (including packaged disposable email domain assets) before the `disposable-email.spec.ts` built-module assertion. Test assertions are unchanged.
- `Implemented` in source: failure artifacts in manual Browser E2E and Portfolio Release Gate workflows are retained for seven days. No deployment trigger or production credentials changed.
- `Not implemented`: automatic preview deployment. Browser E2E and Release Gate are manual-only; full browser verification is deferred to the founder's local run. Tests and known failures are not waived. GitHub workflow execution on this commit is required to confirm results.

## 2026-10-12 — Consolidated legal documents (`fix/legal-pack`)

- `Implemented` (documentation): один актуальный юридический handoff в
  [`../legal/00-FINAL-LEGAL-AUDIT.md`](../legal/00-FINAL-LEGAL-AUDIT.md); прежние
  checklist/document-set/questions/manifest и drafts сохранены без переписывания
  в `docs/legal/archive`. Восстановлен закрытый вопросник из `0bb2f86e`, где вопросы
  1–7 закрыты основателем после уточнений юриста. Повторно предоставленный конспект
  сохранён побайтово в `docs/research/raw/2026-08-24-founder-lawyer-meeting-notes.txt`.
- `Prepared`: `docs/legal/site/01–04,06–09` содержит полные тексты и legal copy;
  `docs/legal/deferred/05-commerce-and-future-features.md` сохраняет условия будущей
  волны. DEC-118 подтверждает DEC-078, portfolio scope и целевые сроки хранения.
  Неактивное приложение не включает commerce и не создаёт согласие на будущие цели.
- `Partial` (publication readiness): основной открытый вопрос — основание текущей
  аналитики без отдельного выбора, явно оставленное основателем для юриста. Не
  заполнены полное наименование/УНП и отдельные provider/country/backup facts;
  адрес для официальных обращений требует проверки. Регистрационный номер
  `693460361` не обозначен как УНП, контакт — `work.evles@gmail.com`.
- `Not implemented` by this task: UI/API legal pages, отдельные registration
  confirmations/18+, многодокументный evidence, analytics control и cleanup.
  `AuthLegalText` пока показывает объединённую галочку и policy stub;
  `AuthService.register/acceptRules`, `TermsAcceptance`, `AnalyticsProvider`,
  `AnalyticsService`, `AnalyticsEvent`/`AcquisitionAttribution` остаются без изменений.
  Выбранное удаление до 30 дней и другие сроки не объявлены текущей функцией.
- Verification: Prettier `--check` passes on all 14 current package/navigation
  files; staged whitespace check of active documents passes. Whole staged check
  reports original trailing spaces in the byte-preserved source notes and restored
  consultation pack; sources were not formatted. Document QA checks 157 relative links;
  13 archived and 3 restored source files are byte-identical to their Git versions;
  the raw attachment SHA-256 matches. Diff is docs-only and excludes protected
  principles and `.pen`. Runtime typecheck/lint/tests/build were not run because
  application/schema behavior is unchanged; this is not a runtime verification claim.
  Architecture and production are unchanged.

## 2026-10-12 — Author application mobile-web (`fix/author-onboarding-figma`)

- `Implemented` for **intro + four URL steps** on **local mobile-web** (Chromium/WebKit
  publication/geometry E2E and affected Vitest). **Not** production, native iOS/Android,
  CI, or whole-repo green. Work **creation-story** product UI stays `Partial` and
  separate from this onboarding scope.
- UI: `AuthorApplicationStepShell` on all four steps; `author-application-*-step.tsx`;
  `FigmaSelectField` + `CountryPickerSheet`; `AuthorDirectionsPickerSheet` with
  `directionCategoryIds` and retained inactive category chips; `AuthorApplicationAchievements`
  (JSON date/body, no new photo); shared `ExitConfirmDialog` for author exit and auth
  interrupt paths (`auth-exit-confirm.tsx`, `author-application-exit-confirm.tsx`).
- Contracts / client / API alignment: `packages/contracts` seller-profile and portfolio
  shapes; JSON `POST`/`DELETE` achievement writes; directions as category UUIDs across
  mobile saves, `packages/api-client`, and `apps/api` sellers/portfolio services.
  `@bidplace/api-client` `requestJson` validates responses with **`z.output`**.
  Application **read** DTOs no longer treat legacy `discipline` as the gate for a
  partially saved draft; **submit**, **advance**, and server readiness remain
  authoritative (`sellers.service.ts`, application stage clamp).
- Verification (Codex, Node 22.20.0, `EXPO_NO_DOTENV=1`): design-tokens/contracts/
  api-client/database/API builds; mobile typecheck **0**; changed-file ESLint **0**;
  affected UI/author/auth Vitest **376/376**; full mobile **702 passed / 30 failed**
  (established Work/product-draft + **4** category-query-identity — **not** fixed here);
  contracts **42**, client **42**, API unit **444**, API integration **40/40** on isolated
  DB; author publication + geometry **8/8** (both browsers); source-geometry sub-checks
  **2/2**; matrix **10/10**; auth filled-login-dismiss **2/2**. Auth history **2/2** did
  **not** reach the shared dialog (blocked on Home «Все работы» catalog fixture) — track
  separately. Clean web export **passed** (2026-10-12, `EXPO_NO_DOTENV=1`, `apps/mobile/dist`,
  bundle `entry-e29b977a2398a6f0f9e6bec19d658305.js`). `category-query-identity` **4/4**
  still fails on base `d8bfba17` — not fixed or claimed caused by this branch.
- Evidence:
  [`docs/audits/current/evidence/2026-10-12-author-onboarding/README.md`](../audits/current/evidence/2026-10-12-author-onboarding/README.md),
  `author-application-publication.spec.ts`, owner specs under `apps/mobile/src/features/sellers`
  and `components/{figma,ui}`.

## 2026-10-12 — Author application step 1 (historical snapshot, superseded)

_Superseded by the section above. Retained for the step-1-only audit trail._

- Step 1 modules: `author-application-basics-step.tsx`, `ProfileBasicsFields`,
  `ProfileCountryField`, `CountryPickerSheet`, `FigmaSelectField` (not a separate
  `author-application-picker-field` module). `DEC-117` city optional; `DEC-114` country
  directory. Earlier claims that steps 2–4 or directions were missing are obsolete.

## 2026-10-11 — Author story review fixes

- `Partial` for the user-facing author application, dictionaries and Work story.
  The API review on `fix/author-story-review` closes the confirmed backend gaps:
  a guest reads a story image only from an IMAGE block on the current published
  revision; a hold is private draft access. Publication, hide, author suspend,
  restore, cleanup and public-reference checks use that same published block.
  Story saves write the current editing revision, including a private draft of
  an approved work, and do not mutate the published revision or `Product.status`.
  Owner detail and the admin review target return selected term IDs and
  proposals. A proposal decision locks the product and re-reads it. Mapping a
  term updates the revision, so the previous moderation target conflicts.
  Re-adding a proposal reuses the same row and keeps an existing rejection.
  A hidden category, term or direction is not a new selection. Catalog identity
  is the normalized name per role, separate from the stable slug. Story
  idempotency conflicts when the same key carries a different snapshot. One
  asset may appear in several IMAGE blocks; the byte budget counts it once.
  Country writes accept only the codes returned by `GET /countries`. Public
  search, the materials filter and material facets read published terms and
  story-block text. A successful product write returns the editing revision
  after the selection sync, so its product fields match the following owner
  read. `materials` and `technique` are read-only projections of selected
  terms; an empty selection is null. Owner detail and product writes project
  the editing revision. The owner list, hide/unhide, and the admin product
  snapshot project the published revision when one exists, and the editing
  revision only while the work is unpublished. A later editing draft does not
  replace the published names. Free-text writes of those fields are
  rejected. Owner, admin, and public author reads include metadata for the
  selected terms, category, and directions, including hidden records. New
  assignment of a hidden record stays rejected. Catalog name identity is
  `normalizeCatalogName` (NFKC, collapsed spaces, Russian lower case). The
  database column has no default and no insert trigger.
- Mobile, admin UI and `@bidplace/api-client` remain `Not implemented` for this
  contract. Backend readiness is not release readiness.
- Evidence: `images.service.ts`, `media-lifecycle.service.ts`,
  `products.service.ts`, `products.mapper.ts`, `product-story.ts`,
  `work-selection.ts`, `catalog.service.ts`, `admin-moderation.service.ts`,
  `admin-moderation.mapper.ts`,
  `products-catalog.query.ts`, contracts `catalog.ts`, `countries.ts`,
  `product.ts`, `admin.ts`, `portfolio.ts`, migration
  `20261011213000_catalog_normalized_name` and
  `20261011230000_product_revision_category_fk`. Isolated-schema coverage is
  `author-story-catalog.integration.spec.ts`,
  `media-lifecycle.integration.spec.ts`,
  `work-media-http.integration.spec.ts` and
  `portfolio-filters.integration.spec.ts`. The shared database was not reset.

## 2026-10-11 — Author story backend

- `Partial` for the user-facing author application, dictionaries and Work story.
  The API can save and resume an application, submit it, store directions as
  category IDs, accept catalog proposals, save revision-owned story blocks and
  publish their media. Mobile, admin UI and `@bidplace/api-client` are not
  adapted. That is the next stage, not a hidden compatibility layer.
- Backend readiness is not release readiness. Shipping the API together with
  updated clients is a separate release gate. No push and no deploy.
- Evidence: `apps/api/src/catalog`, `sellers.service.ts`, `products/product-story.ts`,
  `products/work-selection.ts`, `images.service.ts`, `media-lifecycle.service.ts`,
  `admin-moderation.service.ts`, Prisma migration
  `20261011180000_author_story_catalog`, contracts `catalog.ts`, `story.ts`,
  `countries.ts`. Integration coverage is
  `author-story-catalog.integration.spec.ts` on an isolated `itest_*` schema.
  The shared database was not reset.
- City is optional for approval and public author/work visibility. New
  achievements are date plus description. Story limits live in `STORY_LIMITS`.
- `Not implemented` for the client handoff:
  [UI-HANDOFF.md](../tasks/2026-10-11-author-story-backend/UI-HANDOFF.md).

## 2026-10-11 — Author/story backend target and next sales wave

- `Not implemented` for the new target (`DEC-112`–`DEC-114`). Product decisions
  now include revision-owned story blocks, common approved classifiers and
  required country / optional city. No application code, API, migration or
  runtime behavior was changed by this planning pass.
- Current evidence: `product-draft-story.tsx` still edits `story` as text;
  `work-content.ts` still interleaves gallery extras per the earlier `DEC-093`;
  Prisma `ProductCreationStep` belongs to Product rather than ProductRevision.
  `MediaLifecycleService` publication gathers revision gallery media, not new
  story-block references. Existing media/state ownership is the reuse boundary.
- Classifiers are not migrated: Prisma Category exists, while `materials`,
  `technique` and `discipline` remain text. `seller-profile.ts`, submit readiness
  in `SellersService`, `profile-validation.ts` and portfolio public author
  contracts/queries still require city. Their existing specs cover the previous
  behavior, not the new target.
- Backend execution, capture roots and unresolved points:
  [PLAN.md](../tasks/2026-10-11-author-story-backend/PLAN.md).
  Eight founder-provided author captures were inspected from 2026-10-11 exports.
  Their node source and product scope differ in places; UI parity is not claimed.
- `Not implemented` for the next sales wave (`DEC-115`). Its complete product
  map is [15-POST-MVP-BACKLOG.md](15-POST-MVP-BACKLOG.md); execution mapping stays
  in the post-MVP backlog. This documentation does not enable commerce.
- Verification for this pass is documentation links, diff and decision
  consistency only. Application tests, native, live Figma and production were
  not run; earlier green test totals below do not validate these planned changes.

## 2026-10-11 — Login dismissal (`fix/login-dismissal`)

- `Partial` on local web. `DEC-111` keeps entered-data confirmation on registration only. `/login` closes without «Прервать вход» when email and password are filled. The close button, Escape, backdrop, and Back/Forward use `authNavigationDismissal`. `/register` passes `protectEnteredData`: an empty registration leaves, and a filled one asks. Continue keeps the current step, values, and focus. Interrupt follows the chosen exit. Forgot-password, reset-password, and email verification do not ask. A busy request still keeps the sheet. Leaving does not cancel the request, and a late login response still cannot replace a newer session. This is not a 1:1 Figma match. Production was not updated. No push or deploy.
- Node 22.20.0, `EXPO_NO_DOTENV=1`, `BIDPLACE_ENV_FILE` pointed at a missing path for the API. Mobile `tsc` **0**, eslint of the touched auth files without autofix **0**, Vitest **725/725** (121 files), `expo export --platform web --clear` **0** (`entry-3af721c78097eccaf571e83da6104842.js`).
- Auth browser **44/44** (2.1m) on Chromium and WebKit against schema `auth_browser_login_20261011` in a new loopback database `bidplace_login_dismissal` (`playwright.auth-abuse.config.ts`, no webServer, no `migrate reset`). The API listened on `127.0.0.1` with `TURNSTILE_VERIFIER=test` and `TRUST_PROXY=true`.

## 2026-10-11 — Local release integration (`fix/portfolio-release-integration`)

- `Partial` on local web. Node 22.23.3, `EXPO_NO_DOTENV=1`. Not deployed, not native, and not a production migration. Logs: `/private/tmp/bidplace-release-integration-checks/`.
- Earlier green checks, not repeated: config/contracts/api-client/database/API typechecks **0**; API graph build and `pnpm build` **0**; turbo lint **0**; contracts ESLint **0**; config **8**, contracts **41**, api-client **35**, database **1**, API unit **437**, ops **31**, e2e fence **0**, cookie-proxy wire **6**; Cloudflare local tsc/eslint/vitest/node specs **0**; API integration **138** passed (**28** skipped) on disposable `bidplace_integration`; auth-abuse PostgreSQL **28/28** on caller-owned `127.0.0.1:53189` / `bidplace_auth_abuse_test`.
- This pass: design-tokens `tsc` and build **0**; mobile TypeScript **6.0.3** **0**; mobile eslint **0**; mobile Vitest **725/725** (121 files), including `LegalLink` and the auth/suggestion cases in `Button.spec.ts` and `figma-button-style.spec.ts`.
- Fresh `expo export --platform web --clear` to `web-dist-geometry` (`entry-60dc056ca7b8420536eaac498f298184.js`) embeds `http://127.0.0.1:50281` once and `127.0.0.1:50181` zero times.
- Search chrome and the 16-cell button matrix: **14/14** (48.2s) on Chromium and WebKit against that export. Full `search-overlay.spec.ts` was not run: the standard Playwright config starts `e2e/prepare.mjs`, which loads `.env` and runs `migrate reset --force`.
- Auth browser **44/44** (1.8m) on schema `auth_browser_release_20261011_v3` (`playwright.auth-abuse.config.ts`, no webServer). The previous four geometry failures passed first (14.1s). Test API only uses `TRUST_PROXY=true`; `assignAuthClientIp` keeps a distinct documentation IP per test so the register limit stays **5/60s per IP**. «Вернуться ко входу» and «Регистрация» stay links. Chromium privacy Escape restores the legal span after `LegalLink` focuses itself before open.
- Auth and nickname layout geometry is restored on the shared `FigmaButton` renderer via size presets `auth` and `suggestion` (default matrix unchanged for the 4×4 board). Tokens and measurements: [design system §6.2](../design/03-DESIGN-SYSTEM.md#62-shared-text-button).
- Production Cloudflare SPA build: Node 22, `EXPO_NO_DOTENV=1`, `node scripts/cloudflare/build-web.mjs production` with synthetic public Turnstile site key **exit 0**. Output `apps/mobile/dist` (`entry-d486afb3492577ae340f2a839e167129.js`). Post-export checks passed: production API origin present, staging origin absent, build secret canary absent from assets.
- Rollout still needs a coordinated old-writer stop and a separate operator deploy for slug `20261008040000`, auth-abuse `20261010010000`, and legacy import `20261010100000`. Real SMTP, live Turnstile, and WAF were not exercised. Workflow wiring passes the public Turnstile site key into both SPA builds and the Turnstile secret only into backend validation/runtime. Secret values and their GitHub environment scope were not inspected.

## 2026-10-10 — Search popup chrome (`fix/control-reuse`)

- `Partial` on local web. Text action buttons stay on the 16-cell matrix in
  `figma-button.ts`. Search field `456:8369`, close `456:8375`, and tab capsule
  `4306:9061` use `search-chrome.ts` and `FigmaSearchGlass`. The scoped stroke is
  `#D1D1D1 → #EBEBEB` from `fallbacks/001-456_8298.svg`. Tabs stay 41px Medium
  14/20. Icon buttons, chips, dock, and catalog fields keep their own roles.
- Node 22.23.3, `EXPO_NO_DOTENV=1`: design-tokens `tsc` and build **0**,
  mobile `tsc` 6.0.3 **0**, mobile eslint **0**, Vitest **722/722** (121 files),
  `expo export --platform web` **0**. Chromium and WebKit search chrome
  **4/4** and the existing 16-cell button matrix **10/10** against the already
  running `localhost:8081` (390, 1024, 1440, short, resize, zoom 200%,
  keyboard focus, reduced motion). Evidence:
  `docs/audits/current/evidence/2026-10-10-search-chrome/`. Native is not claimed.
- Stroke viewport includes the outer half of the 0.5px stroke, the three tabs
  share the rail equally (115.67px at 364px), and web SVG sizes use shared
  `useCssBorderBox` (`use-css-border-box.ts`) with text buttons.
- Completion pass (Node 22.23.3, `EXPO_NO_DOTENV=1`): design-tokens `tsc` and
  build **0**, mobile `tsc` 6.0.3 **0**, mobile eslint **0**, Vitest **723/723**
  (121 files), `expo export --platform web` **0**. Chromium and WebKit search
  chrome **4/4** and text-button matrix **10/10** on `localhost:8081` (390,
  1024, 1440, short, resize, zoom 200%, keyboard, reduced motion). Evidence
  refreshed under `docs/audits/current/evidence/2026-10-10-search-chrome/`.
  Native is not claimed.

## 2026-10-10 — Shared text-button matrix (`fix/button-states`)

- `Implemented` on local web. `/dev/figma-buttons` static 4×4
  `FigmaButtonStatePreview` board (handoff `292:5058`, `714×283` chrome, Russian
  headings, one `image` name per cell) plus live controls below. Preview and
  production share `FigmaButtonVisualContent` → `FigmaButtonSurface` (one `Svg`
  for fill, overlay, stroke), transparent `figmaButtonStyle` shells, and
  `useFigmaButtonLayout` fractional web sizing. Handoff:
  `design/figma-handoff/buttons/2026-10-10-buttons/`.
- `Implemented` on local web. `packages/design-tokens/src/figma-button.ts`
  owns the 16-cell matrix. `FigmaButton` is the only text-button renderer
  (`solid` | `outline` | `ghost` | `muted`, typed `href`). `MotionPressable`
  `opacityFeedback: 'component'` keeps matrix opacity from being darkened again.
  Auth, Home «Смотреть все», admin «Модерация», and exit confirmation use that
  matrix.
- Node 22 verification (2026-10-10, SVG surface track): design-tokens `tsc
--noEmit` and build **0**, `apps/mobile/node_modules/typescript`
  `tsc --noEmit` **0**, mobile eslint **0**, Vitest **721/721** (121 files),
  `EXPO_NO_DOTENV=1` `expo export` → `/private/tmp/bidplace-buttons-grid/dist`
  **0**, Playwright Chromium+WebKit **10/10** (private
  `playwright.figma-matrix.config.mjs`, loopback-only): SVG paint probes,
  preview-vs-live, pointer/keyboard/disabled/loading/link/focus/reduced-motion,
  resize, 200% zoom, 390 horizontal scroll. Evidence:
  `/private/tmp/bidplace-buttons-grid/evidence/` (`figma-button-matrix-*`,
  `figma-button-matrix-cells-{browser}-{width}x{height}.json`,
  `matrix-1440-{chromium,webkit}.png`). Coverage:
  `Button.spec.ts`, `figma-button-style.spec.ts`,
  `e2e/figma-button-matrix.spec.ts`, `e2e/support/figma-button-svg-probe.ts`.
  Native touch/loading remains unverified.
- Manual verification on `localhost:8081`: all 16 preview SVG viewports match
  their shells. Login «Войти», Telegram, and Google paint inside 350×43 frames;
  Home «Смотреть все» paints inside 366×43. Analytics «Модерация» and ShareSheet
  remain unverified on their actual screens; the stand link is covered above.
- Capture geometry: solid stroke gradient `#2A2A2A → #585858`, outline
  `#D1D1D1 → #EBEBEB`, pressed ghost `292:5046` paints 82×42 at `0,0` with no
  stroke inside the hug frame; sample «Кнопка» shell ≈ 82.71875×43 must not pair
  with an 83-wide `Svg` viewport.

## 2026-10-10 — Verification state retry after email correction

- `Implemented` (automated unit and local web verification). `use-email-verification.ts` keeps the
  saved canonical `User` when its following state GET fails, clears the obsolete
  mailbox/code state, and exposes the existing read retry. A successful retry
  clears the read error without another address POST or automatic mail send.
  `use-email-verification.spec.ts` and `verify-email-form.spec.ts` cover network
  and 503 failures, retry recovery, and a late failure after another owner
  becomes active. Recovery remains owned by the existing verification hook.
  Cursor checks on Node
  22 passed: 52/52 focused auth tests, 713/713 mobile tests (120 files),
  typecheck, lint, and web export. The unmodified export passed 6/6 synthetic
  API scenarios in Chromium/WebKit at 390×874, 390×400, and 1280×720: keyboard
  read retry, saved address after reload, one address POST, and no send/verify
  POST. Private check logs: `/private/tmp/bidplace-verification-retry-units.log`,
  `/private/tmp/bidplace-verification-retry-export-fresh.log`, and
  `/private/tmp/bidplace-verification-retry-browser.log`. Server contracts,
  quotas, persistence, and the MVP scope are unchanged. Native and deployed
  environment verification remain outside this correction's evidence.

## 2026-10-10 — Auth abuse protection (branch `feature/auth-abuse-protection`)

- `Implemented` (automated backend/contracts/SDK/database on Node 22): durable
  auth-abuse ledger in `apps/api/src/auth-abuse/` (`AuthAbuseModule`,
  `auth_abuse_operations`, `auth_abuse_counters`); OTP, password-reset, and auth
  services/controllers delegate mail quotas, idempotency, login assessment,
  Turnstile, and disposable-email checks. Shared contracts and API client carry
  idempotency keys (OTP send/verify and forgot only), Turnstile tokens,
  `delivery`, and `emailVerificationState` with `serverNow`.
  Mobile auth surfaces use `use-email-verification.ts`, `verify-email-copy.ts`,
  `turnstile-widget.tsx`, and recovery copy in `apps/mobile/src/errors/copy.ts`.
  Login continuation after `redirectTo` uses automatic receipt handling; an
  independent security review found no correctness defect in that path.
  Evidence: API **437** unit cases (**395** API / **64** files + **42**
  env/config unit, not an auth-abuse-only unit bucket), PostgreSQL integration
  **28**, HTTP integration **22**, contracts **41**, API client **35**, Cloudflare
  config/scripts **12**; typecheck, build, and targeted lint on the affected graph
  exited **0**. Optional full `packages/contracts` ESLint remains a known baseline
  failure on `ee37e9d` (`admin.ts` `import/no-duplicates`, unchanged here).
- `Implemented` (automated mobile units and web export): **709** unit cases across
  **120** files (includes **11** owner form-unit cases); mobile `tsc`, ESLint, and
  e2e database fence **0** with `EXPO_NO_DOTENV=1` on Node **22.23.3**. Production
  web export embeds the configured API origin (root verification).
- `Implemented` (mobile web, local loopback + scripted Turnstile fixture): **44/44**
  Playwright project runs (**22** tests × Chromium and WebKit) via
  `playwright.auth-abuse.config.ts` — layout (**7**), lifecycle (**7**), and
  auth-abuse (**8**) files covering five viewports, CSS zoom, keyboard, and resize.
  Harness: loopback cookie proxy, **6** `auth-cookie-proxy.unit.mjs` wire tests,
  **6** accepted cookie cases (withheld **2xx** + `hasSetCookie`, `/api/auth/me`,
  reload, same document, no manual **Continue**). API runs with `TEST_EMAIL_BYPASS=false`.
  E2e gates password visibility on `expectTurnstileReady` after the local fixture;
  where Turnstile is not in-frame for layout evidence, the register nickname PNG is
  taken at initial stable **390×874** before resize/zoom. Repro:
  [`apps/mobile/e2e/README.md`](../../apps/mobile/e2e/README.md). Visual QA: **50**
  blank-form PNGs (scripted Turnstile only) —
  [`forms/CAPTURE-MANIFEST.md`](../audits/current/evidence/2026-10-10-auth-abuse-protection/forms/CAPTURE-MANIFEST.md);
  audit summary:
  [`README.md`](../audits/current/evidence/2026-10-10-auth-abuse-protection/README.md).
- `Needs verification` (production): real SMTP mailbox delivery, live Cloudflare
  Turnstile hostname/Siteverify, edge WAF/rate rules, and coordinated application
  of migrations `20261010010000_auth_abuse_protection` and
  `20261010100000_auth_abuse_legacy_import` on production data remain separate
  operator steps. Legacy import semantics and rollout order are in
  `10-CODE-ARCHITECTURE.md` and **DEC-109**.
- `Unchanged` for MVP product scope: no MFA, breach-password list, or Redis
  dependency for durable quotas. Foreign login failures still do not revoke
  sessions. Neutral forgot-password still does not prove delivery.

## 2026-10-09 — Local nickname suggestions and explicit availability

- `Partial`. Registration generates exactly three distinct contract-valid
  nickname suggestions locally through `NicknameSuggestionGenerator` and the
  `unique-names-generator` adapter. Curated bundled color/animal dictionaries
  supply compact stems; a three-digit suffix provides 49,500 possible readable
  values. There is no remote generator, reservation, endpoint, or persistence
  change. Chips only fill the field and make no availability claim.
- Typing performs local 3–20 validation only. Nickname `Next` issues one
  existing availability request, rejects rapid duplicate submits, and advances
  only on an available response. Taken responses refresh all three suggestions;
  retryable failures preserve input; stale value, route, session, and unmount
  replies are ignored. Registration remains the unique final authority, and
  `slug_taken` returns to nickname while retaining the other fields.
- Node 22 verification passed the design-token build, affected mobile
  typecheck and lint, five focused owner specs (47/47), and
  `EXPO_NO_DOTENV=1` web export. Earlier Node 26 evidence covered the broader
  mobile suite (637/637), contracts (39/39), and API client (31/31).
- The existing nickname browser scenario passed in Chromium and WebKit (2/2)
  through a temporary config outside the repository, with no web server or
  database setup. Synthetic coverage includes a completed available response
  ignored after editing, 1.5× nickname-chip zoom, five viewport sizes, and
  resize without horizontal overflow or page errors.
- Native runtime and real local availability remain unverified. The latter is
  blocked by the pre-existing missing `users.slug` (`P2022`); no migration or
  fallback was added. The reported 14MB artifact is the whole app web bundle,
  not a measured `unique-names-generator` bundle delta.

## 2026-10-09 — Decorative brand pointer selection

- `Partial`. Shared `BidplaceBrand` mark and wordmark stay decorative on web
  without `focusable`/`tabindex`; local standard and WebKit user-selection
  styles prevent click, double-click and drag from focusing or selecting the
  SVG. Parent `BrandLogo` and dock links retain their own keyboard focus,
  accessible names and Enter activation. Native decorative accessibility props
  are unchanged; native runtime was not exercised.
- Existing browser scenarios passed in Chromium/WebKit against localhost:8081
  with no web server or database preparation: infrastructure error 2/2,
  pending brand 2/2, auth composition 2/2 and valid Home BrandLogo/dock keyboard
  coverage 2/2. Error coverage resizes without reload through 390×874,
  1280×720 and 390×400, preserves selectable message copy and keeps Retry
  reachable by Tab.

## 2026-10-09 — Auth runtime and new nickname validation

- `Partial`. Shared `AuthPasswordField` restores focus and cursor with
  supported web/native APIs. `AppDialogFrame` centers the actual limited
  surface; `AppDialog` wraps its shared title next to the close control.
  `BidplaceBrand` separates decorative web/native accessibility props.
  Registration, claim-slug and availability reuse the contracts write schema
  (3–20); stored `User.slug` reads remain 1–120 (`DEC-107`). Login 401 copy is
  «Неверная почта или пароль»; network, 5xx, 429 and field errors remain separate.
- Own checks: API unit 409/409, mobile unit 625/625, contracts 39/39,
  api-client 31/31. Affected graph typecheck, lint without autofix, API build
  and Expo web export passed. Three existing `auth-layout` scenarios passed
  in Chromium/WebKit (6/6), including five password fields, cursor/focus/value,
  real dialog surfaces, long titles, Escape/return focus, zoom, resize without
  reload, 390×874 / 375×667 / 440×956 / 1280×720 / 390×400 (plus 1024/1440).
  Layout-only registration uses synthetic rules/availability and never sends
  `register`; 401/429/500 UI checks use synthetic HTTP responses. Existing
  consent/session/single-register unit coverage stays intact. Native runtime
  and the full database-backed `auth-lifecycle`/history gate are not verified.
- Local API readiness is 200, but a synthetic unknown-email login returned 500. Read-only schema checks found no `users.slug` in `bidplace`,
  `bidplace_e2e` or `bidplace_integration`; a slug-only lookup in the test DB
  returns Prisma `P2022`, column `users.slug`. Both invalid credential branches
  return the same 401 in `AuthService` unit tests; their real local HTTP gate
  remains blocked by schema compatibility. No migration/reset was run.
  Standard e2e preparation migrates/resets its DB, so it was not used.
- Evidence and exact verification boundaries:
  [`auth runtime audit`](../audits/current/evidence/2026-10-09-auth-runtime-validation/README.md).
  Privacy policy stays a placeholder and OAuth stays unavailable. This does
  not claim 1:1, launch readiness or a production schema update.

## 2026-10-09 — Single-line field height stays 51 when the border snaps

- `Partial`. A single-line `FigmaTextField` now has a fixed outer height of
  51, so a 0.5 border that paints as 1px at devicePixelRatio 1 no longer
  grows the border box. Multiline fields still use only `minHeight` and can
  grow. Registration password stays 53 with a 1px border. Focus stays
  `#004DFF`, error stays red, and the error line remains outside the shell.
- Measured at 390×874, DPR 1: login and registration email are 51 in
  Chromium and WebKit (they were 52). The used border is still 1px; the
  content box is 49. Nickname is 51. Registration passwords are 53×1.
  The in-app tab at DPR 2 already kept the 0.5 border and height 51; it
  still does. The login sheet is 546 in Chromium and WebKit, down from 547.
  The in-app sheet stays 543.5. Source anatomy is 545.
- The remaining 2.5px between DPR 1 and DPR 2 is not the field: «Забыли
  пароль?» is 15 vs 14.5, «или» is 19 vs 18, and the legal line is 30 vs 29. Those nodes use `line-height: normal`. This is not 1:1.

## 2026-10-09 — Auth visual check against the current handoff

- `Partial`. Login sheet, registration email/nickname/password, and email
  confirmation were measured at 390×874 with local synthetic data. Mark
  30.3 at about x180/y67 and wordmark 93×22 at y793 match the fullscreen
  source. Email title is y319.5. Password step title is y308.5 and those
  fields are 350×53 with a 1px border. Dock stays hidden. 375 and 440 do
  not add horizontal overflow. Login password now uses the same 0.5 field
  border as the login email field; the 53px registration password keeps
  the 1px border. At 1× the used border can still paint as 1px.
- Still not exact: the login surface is 547px at y327 against source 545
  at y329. The email field shell measures 52px. Nickname title position
  does not copy the sample-status group. Confirmation copy is the adapted
  sentence. Policy remains the temporary dialog. Google and Telegram stay
  unavailable. This is not 1:1.

## 2026-10-09 — Auth dialogs stay out of form measurement

- `Partial`. Closed policy/rules `AppDialog` roots no longer sit in the
  login and registration `gap` flow: their host is `position: absolute`
  with zero size, the same out-of-flow treatment used for auth overlays.
  Opening and closing those dialogs does not change the form height.
  The earlier email-title band of 306–311 was a mistaken tolerance for
  that extra gap, not a design change. `auth-layout` again expects
  319–321.5 at 390×874, and Chromium/WebKit pass that range after resize
  without reload. Auth primary and provider strokes run left to right
  (`start` 0,0.5 → `end` 1,0.5) at the agreed weights; outline and quiet
  keep the previous border width. The Google glyph is an 18×18 slot with
  the imported 16×16 paths inset by 1. Email `manifest.json` and
  `PROVENANCE.json` now match `Создать_с_паролем_кнопки.figmacapture.zip`;
  `nodes.json` and the reference PNG were already identical and were not
  rewritten. Policy remains the temporary «Документ готовится» dialog.
  Rules still use `getRules`. Session ownership, `acceptRules`, and
  DEC-078 are unchanged. This is not 1:1.

## 2026-10-08 — Auth fullscreen layout no longer depends on resize history

- `Partial`. Fullscreen `AuthViewport` chooses center-or-band from padded
  dialog height and content `onLayout`. Clearing both on viewport resize
  was removed; scroll resets to top on height change. Resize without reload
  (874→437→400→600→874) matches a fresh load and keeps the title below the
  mark. At 390×874 the email title stays ~320.5. Registration dock hiding
  and session/consent behavior are unchanged. This is not 1:1.
- `auth-layout.spec.ts` checks mark/title overlap, the resize sequence
  without `goto`, fresh-load parity, a short-window validation error, and
  375×667 / 440×956 without horizontal overflow.

## 2026-10-08 — Late registration does not replace a newer session

- `Partial`. `AuthProvider.register` installs its session only when the epoch
  captured at the start of that call still owns the client. While the request
  is in flight, an external session is not suppressed. The late response does
  not replace that session, call `acceptRules`, or navigate. The request is
  not cancelled and the created account is not deleted. A thrown `register`
  clears the same in-flight claim. One successful `register` and a later
  `acceptRules` retry for that same account remain.
- Covered by `registration-consent.spec.ts` together with the real
  `AuthProvider.register`: start `register`, install session B, then deliver
  register A. Session stays B, acceptance and navigation do not run, and a
  second submit does not register again. The earlier same-account retry,
  blur, and A-after-accept cases still pass (18 tests in the auth/session
  files). Mobile `tsc --noEmit` and eslint on the changed files passed.
  This is not 1:1.
- Still open: no approved privacy-policy source, so the policy words are not
  links. Google vector `I526:14901;298:6024;521:10381` and its parent frame
  `google` have no fills. Mixed ranges `4547:23406`, `4547:25029`,
  `526:14902`, `526:15580` and `558:16958` have no styled ranges. Checkbox
  frames `4547:23400` and `4547:23403` have no stroke weight. Production
  remains `541d763547f7b021895daa3d533c3196c37a4e67`.

## 2026-10-08 — Registration consent stays with the account that was created

- `Partial`. The account created by the current registration attempt is the
  only owner of its rules acceptance. After `acceptRules` fails, a later
  session for a different user does not receive that attempt's version or
  acceptance. The epoch change from this attempt's own `register` is not
  reused to authorize an older operation. Leaving the route, including while
  Expo keeps it mounted, stops the in-flight acceptance from writing or
  navigating. One `register` and one successful continuation remain.
- `getRules` shows the returned text in the existing dialog. A failed load
  has a visible retry that calls `getRules` again without toggling the
  checkbox. The accepted version is the one that text belonged to. There is
  still no approved privacy-policy source, so the policy words are not
  links. Consent is not fully ready.
- On the 390×874 frame the email title stays at y320.5, the mark vector at
  y67.06 and the wordmark at y793. On 240×437 the title is below the mark
  and the form scrolls in the band above the wordmark. 375×667 and 440×956
  do not add horizontal overflow; at 440 the column stays 390 wide. The
  login sheet remains 543.5. This is not 1:1.
- Still open: Google vector `I526:14901;298:6024;521:10381` and its parent
  frame `google` have no fills in
  `screens/login-password/design/nodes.json`. Mixed ranges `4547:23406`,
  `4547:25029`, `526:14902`, `526:15580` and `558:16958` have no
  `characterStyleOverrides` or `styleOverrideTable`. Checkbox frames
  `4547:23400` and `4547:23403` have gradient strokes and no stroke weight.
  Production remains `541d763547f7b021895daa3d533c3196c37a4e67`.

## 2026-10-08 — Auth completion, consent retry and sheet anatomy

- `Partial`. A visitor who was already signed in still leaves registration
  through the existing next step. An account created by the current attempt
  stays on the form until `acceptRules` confirms the rules version returned
  by `getRules` for that attempt. `auth.register` no longer hides a failed
  acceptance, and submission success no longer navigates on its own. The
  retry calls only `acceptRules`. A changed auth epoch, a different session
  user, or an unmounted route does not write consent or publish that
  attempt's error. A failed `getRules` stays visible and does not accept a
  later version. Missing approved documents and legal drafts are not
  published.
- The consent control is one checkbox. Tab reaches it, Space toggles it, and
  the shared `focus-visible` outline is the focus ring. Nickname availability
  belongs to the value that was checked: editing clears the previous result,
  a late response does not relabel the new value, and a failed request does
  not claim the nickname is free. Debounce, server uniqueness and the lack
  of reservation stay.
- The loading page mark no longer carries `logoMotion` or a settle cycle.
  Loading and error/retry fetch states remain.
- Measured on the local 390×874 frame: email title y320.5, mark vector
  y67.06, wordmark y793. Login sheet height is 543.5 against the source
  anatomy 545; the legal line box is 29 and the source box is 30 with no
  exported line-height. At 375×667 and 440×956 the column scrolls without
  horizontal overflow; at 440 the sheet stays 390 wide and centered. Zoom
  1.5 does not add a horizontal scrollbar. This is not 1:1.
- Still open: Google vector `I526:14901;298:6024;521:10381` has no fills in
  `screens/login-password/design/nodes.json`, and that capture's `assets/`
  PNGs are not a colored glyph. Mixed ranges `4547:23406`, `4547:25029`,
  `526:14902`, `526:15580` and `558:16958` are unresolved. Checkbox stroke
  weight is absent on `4547:23403`. There is no public policy page. Nickname
  suggestion chips are sample data. Production remains
  `541d763547f7b021895daa3d533c3196c37a4e67`.

## 2026-10-08 — Brand/auth sources prepared; runtime correction pending

- `Not implemented` for the new runtime branding/consent correction. Four latest
  fullscreen captures and exact shared brand vectors are imported and validated;
  the previous four fullscreen packages were removed from checkout with recorded
  Git lineage. Current source and executor prompt:
  [HANDOFF.md](../../design/figma-handoff/auth/2026-10-08-auth-fullscreen/HANDOFF.md).
- Read-only localhost review confirmed the login dock overlap at three phone
  sizes and missing brand/checkbox/style details in registration. Synthetic
  email/nickname were used only for local step navigation; no password entry,
  register request or mail delivery occurred. Confirmation was code-reviewed.
- No application code, public contract, migration, role, production deployment
  or release gate changed. Existing `User.slug` decisions and the migration
  hold remain. Import checks do not close auth/MVP acceptance. See design status
  and handoff for missing exact ranges/Google/policy/suggestion inputs.

## 2026-10-08 — Release routes and container image proof

- `Partial`. `/_release/stop` and `/_release/state` are in
  `assets.run_worker_first`, so the SPA fallback does not answer them.
  Opening no longer treats `RELEASE_IMAGE` or `RELEASE_ID` as proof that the
  new container image is installed. Wrangler 4.147.0 uploads the Worker
  before it pushes and rolls out the container. Opening reads the live
  deployment, registry tag, container application, and requires `/api` to
  still return 503. This gate is not deployed. Production remains
  `541d763547f7b021895daa3d533c3196c37a4e67`. Design gaps stay `Partial`.
- Local check: `pnpm cloudflare:check` on Node 22.20.0. Typecheck and lint
  passed. Vitest: 29 passed. `scripts/cloudflare` node tests: 16 passed,
  including the Miniflare asset router. The registration browser gate was
  not repeated.

## 2026-10-08 — Local slug release gate

- `Partial`. The local release gate can keep `/api` closed, stop the current
  API container, and open access only after nickname and version checks.
  It is not deployed. Production remains
  `541d763547f7b021895daa3d533c3196c37a4e67`. No production migration, push,
  deploy, or production stop. Design gaps stay `Partial`: consent text,
  mixed-text ranges, the Google glyph, a public policy page, `acceptRules`,
  nickname change, and dropping `seller_profiles.slug`.
- Public hold is the Worker var `RELEASE_HOLD`. Only the value `closed`
  makes `routeRequest` return 503 and `Cache-Control: no-store` for `/api`
  and `/api/*` before cache lookup and before `API.getByName`. A new request
  does not clear the var. A Worker restart keeps the deployed var. A failed
  deploy does not replace the live Worker, so a closed hold stays closed.
- Stop control is `POST /_release/stop` and `GET /_release/state`. Both sit
  outside `/api`. The Worker compares `Authorization: Bearer` with the Worker
  secret `RELEASE_CONTROL` and returns 404 without calling the container when
  the secret is missing or wrong. The incoming request is not forwarded.
  `PortfolioApi.fetch` accepts only the internal paths `/__release/stop` and
  `/__release/state`. Stop sends `SIGTERM` through `@cloudflare/containers`
  0.3.7 `stop()`, which reaches the existing Nest `enableShutdownHooks()` and
  Prisma disconnect. Success is `getState()` status `stopped` or
  `stopped_with_code`, not the return of `stop()`. There is no request
  counter and no log-based stop condition.
- `pnpm cloudflare:migrate` refuses while another database session is
  `active`, `idle in transaction`, or `idle in transaction (aborted)`. Plain
  `idle` is not a blocker. The migration workflow also requires a live
  `GET /_release/state` of HTTP 200 with a terminal status before that SQL.
  The preparatory image deploy uses Wrangler `--containers-rollout none` and
  skips the API image build, so the previous production image stays in place.
- Nickname equality and the migration row are checked on the direct Neon URL
  before `RELEASE_HOLD` can become `open`. `RELEASE_ID` identifies the commit.
  It does not prove that the container image for that Worker version was
  published. The exact operator steps are in `docs/ops/CLOUDFLARE-DEPLOYMENT.md`.
- Local check: `pnpm cloudflare:check` on Node 22.20.0. Worker typecheck and
  lint passed. Vitest: 29 passed. `scripts/cloudflare` node tests: 14 passed.
  The registration browser gate was not repeated.
- Nickname check for step 4, once access is still closed: copy any null
  `users.slug` from `seller_profiles.slug`, then require every pair of
  strings to be equal. If any pair differs, do not open `bid.place`.
  Dropping `seller_profiles.slug` stays a later migration, after that check
  and after no live query reads the profile column.
- Gate on `2faf15edf8851cc69eca0af5ae8473c941d7ff32`, Node 22.20.0, before
  this documentation update. `pnpm build:web` exported
  `entry-13eae3b238c3f20d386a48ef61b493df.js` and verified the SPA for
  `https://bid.place`. One Playwright run of `auth-layout` and
  `auth-lifecycle`, Chromium and WebKit, `--workers=1 --retries=0`: 16
  passed in 2.1m. No second run. No production migration.

## 2026-10-08 — Claim, verification, owner slug, and fullscreen frame

- `Partial`. A nickname claim checks the existing `authEpoch` and
  `sessionOperation` before `createProfile` and before any form, cache, or
  lock change. A stored slug is a normal result, not an exception class.
  New registration opens `/verify-email` even without `redirectTo`, keeps
  that safe destination, and still uses one `register` plus the existing OTP
  request and cooldown. The owner profile response uses `users.slug`;
  `editingRevision.slug` stays a snapshot and old revision rows are not
  rewritten. Fullscreen registration and verification do not mount Home or
  the dock. Consent text, mixed-text ranges, the Google glyph, a public
  policy page, `acceptRules`, nickname change, and dropping
  `seller_profiles.slug` stay open. This is not a 1:1 match. Production
  remains `541d763547f7b021895daa3d533c3196c37a4e67`. No push or deploy.
- The release order for `20261008040000_add_user_slug` is the local gate in
  the section above. Do not apply that migration before the hold is closed
  and the previous container is confirmed stopped. Drop
  `seller_profiles.slug` later only after every pair of nicknames is equal
  and no live query reads the profile column.
- Local checks on Node 22.20.0: API and mobile typecheck passed. Lint of the
  touched files passed. `seller-profile.mapper.spec` (3), `sellers.service.spec` (20), and
  `seller-profile-submit.spec` (48) passed. Chromium and WebKit
  `auth-layout` and `auth-lifecycle` passed, including registration without
  `redirectTo` and the fullscreen column without Home. One WebKit history
  run failed while the previous layout test was still timing out; the same
  history test passed on the next run. No production migration.

## 2026-10-08 — One account slug and fullscreen registration

- `Implemented` for the nickname and registration path in this wave. `users.slug`
  is the only canonical nickname. Migration `20261008040000_add_user_slug`
  makes `display_name` nullable, copies each existing `seller_profiles.slug`
  onto `users.slug` without changing the string, keeps `display_name` and
  revision rows, and leaves `seller_profiles.slug` in place. `POST /api/auth/register`
  requires `slug` and stores `displayName` as null. `POST /api/auth/slug`
  writes the session user's slug once; a repeat or lost race returns the stored
  slug. Author create copies that stored slug and does not accept another.
  Approval and media publication do not write `users.slug` or the profile slug
  from a revision snapshot. A public author still requires `APPROVED` and
  `active`. Nickname change is not in this wave. `seller_profiles.slug` can be
  dropped only after this application is the only writer, the two strings
  match, and no live query reads the profile column. Production remains
  `541d763547f7b021895daa3d533c3196c37a4e67`. No push or deploy.
- Local checks on Node 22.20.0: the migration was applied only to disposable
  `bidplace_e2e` at `127.0.0.1:5432`. Six existing addresses copied unchanged,
  display names stayed, revision slugs stayed, and `seller_profiles.slug`
  remained. Contracts, api-client, database, API, and mobile typecheck passed.
  API and mobile lint passed. Affected unit and integration tests passed,
  including auth, seller create, moderation, media publication, and the
  author HTTP contract. `build:web` exported
  `entry-386fc44e159daf26df6ad91f3b944d27.js`. Chromium and WebKit
  `auth-layout` and `auth-lifecycle` passed (14).

## 2026-10-08 — Slug claim and revision snapshots stay on one nickname

- `Partial` for portfolio auth. The confirmed `User.slug` plan now includes
  two cases and no nickname change. A signed-in user with no slug chooses it
  once, with the registration nickname field, before creating an author
  profile. Publishing or restoring an old revision does not write `User.slug`.
  `publishedSellerProfileData` still returns `revision.slug`, and both admin
  approval and media publication still copy it onto the live profile. A slug
  alone does not make a public author: catalog and photo stay behind an
  approved profile and an active user. Runtime is unchanged. Production
  remains `541d763547f7b021895daa3d533c3196c37a4e67`. No push or deploy.

## 2026-10-08 — Account slug replaces a second nickname

- `Partial` for portfolio auth. The later `DEC-105` revision makes `User.slug`
  the only nickname. `SellerProfile.slug` is copied onto that column without
  changing the string, then removed as an editor. `User.username` is not
  added. Runtime still stores the public address on `seller_profiles.slug`
  and `register` still requires `displayName`. No migration ran. Production
  remains `541d763547f7b021895daa3d533c3196c37a4e67`. No push or deploy.

## 2026-10-08 — Registration nickname is decided, not built

- `Partial` for portfolio auth. The `DEC-105` revision records the registration
  sequence email `4547:23379`, nickname `4547:24138`, password `4547:24428`,
  and confirmation `4547:25026`. `User.username` is not in the schema.
  `register` still requires `displayName`. No migration ran. Login, recovery,
  exit confirmation, and the history owner are unchanged. Production remains
  `541d763547f7b021895daa3d533c3196c37a4e67`. No push or deploy.
- The public author address remains `SellerProfile.slug`. Consent is still not
  `acceptRules`: mixed text ranges, a public policy page, and persistence are
  separate gaps. The selected checkbox in the capture is not saved consent.

## 2026-10-08 — Auth history position is one number per entry

- `Partial` for the portfolio auth presentation. Each history entry stores its
  own integer `index` beside Expo's id. Push writes the next integer and drops
  a copied `entries` list; replace keeps the same index, the Expo id, and
  foreign fields such as the work-draft guard key. Back, Forward, reload,
  branching, a busy request, and one successful replace use the difference of
  those two numbers. After 80 pushed entries Chromium keeps `history.length`
  at 50, and the current state has no growing list. This is not a 1:1 Figma
  match. Production remains `541d763547f7b021895daa3d533c3196c37a4e67`. No
  push or deploy.
- Local checks on Node 22.20.0 against disposable `bidplace_e2e` at
  `127.0.0.1:5432`: mobile typecheck, lint of the touched auth files,
  `auth-dismissal` plus the product-draft guard specs (27), `build:web`, and
  `e2e/auth-layout.spec.ts` plus `e2e/auth-lifecycle.spec.ts` — 14 passed on
  Chromium and WebKit. The shared login scenario is unchanged. The new check
  pushes 80 copied states, then Back and a branch.

## 2026-10-08 — Auth history position survives reload

- `Partial` for the portfolio auth presentation. The same `entries` list is
  stored beside Expo's history id and read back before Expo's startup
  `replaceState`. After Home → Login → reload, Back still returns to that
  login entry. Continue keeps the URL, the login route, and the typed value.
  Interrupt opens the entry the traversal reached. One Back, several steps,
  Forward, auth-to-auth, an in-flight request, and one successful replace keep
  the previous contract, with and without the Navigation API. This is not a
  1:1 Figma match. Production remains
  `541d763547f7b021895daa3d533c3196c37a4e67`. No push or deploy.
- Local checks on Node 22.20.0 against disposable `bidplace_e2e` at
  `127.0.0.1:5432`: mobile typecheck, lint of the touched auth files,
  `auth-dismissal` unit tests (7), `build:web`, and `e2e/auth-layout.spec.ts`
  plus `e2e/auth-lifecycle.spec.ts` — 12 passed on Chromium and WebKit. The
  shared browser scenario now reloads a filled login before Back.

## 2026-10-08 — Auth history stays armed without the Navigation API

- `Partial` for the portfolio auth presentation. The history guard follows the
  ids Expo already stores in `history.state`. A dirty or busy leave returns to
  that entry by the real index delta, including one Back, several steps, and
  Forward, whether or not `window.navigation` exists. Only the `popstate`
  whose id is that entry is stopped. An empty form still leaves with one Back.
  Auth steps do not ask. Continue keeps the value and focus. Interrupt opens
  the entry the traversal reached. A request in progress still keeps the sheet.
  One successful replace does not reopen a finished sheet. This is not a 1:1
  Figma match. Production remains
  `541d763547f7b021895daa3d533c3196c37a4e67`. No push or deploy.
- Local checks on Node 22.20.0 against disposable `bidplace_e2e` at
  `127.0.0.1:5432`: mobile typecheck, lint of the touched auth files,
  `auth-dismissal` unit tests (7), `build:web`, and `e2e/auth-layout.spec.ts`
  plus `e2e/auth-lifecycle.spec.ts` — 12 passed on Chromium and WebKit,
  including the same browser history scenario with the Navigation API removed.

## 2026-10-08 — Auth history restores the entry that was left

- `Partial` for the portfolio auth presentation. A browser traversal that
  leaves a dirty or busy auth form returns to the Expo entry that was current
  when the traversal started. The step is the Navigation API index delta, so a
  two-step Back and a Forward both return to that entry. The following
  `popstate` is stopped only when its `history.state.id` is that entry. An
  empty form still leaves with one Back. Auth steps do not ask. A filled form
  asks, Continue keeps the value and focus, and Interrupt opens the entry the
  traversal reached. A request in progress still keeps the sheet. One
  successful replace does not reopen a finished sheet. This is not a 1:1
  Figma match. Production remains
  `541d763547f7b021895daa3d533c3196c37a4e67`. No push or deploy.
- Local checks on Node 22.20.0 against disposable `bidplace_e2e` at
  `127.0.0.1:5432`: mobile typecheck, lint of the touched auth files,
  `auth-dismissal` unit tests (7), and `e2e/auth-layout.spec.ts` plus
  `e2e/auth-lifecycle.spec.ts` — 10 passed on Chromium and WebKit.

## 2026-10-07 — Auth browser history follows Expo entries

- `Partial` for the portfolio auth presentation. Browser history no longer
  keeps a sentinel that copies the Expo history id. The auth listener is
  installed before Expo Router's history listener. A dirty or busy leave stops
  that one `popstate` and returns to the same Expo entry. An empty login leaves
  with one Back. A filled form asks only when Back leaves auth. Back from
  registration to login does not ask. Continue keeps the value and focus.
  A successful login and a closed sheet are not opened again from a leftover
  entry. A request in progress still keeps the sheet. The earlier measured
  actions and the open Google, mixed-text, and consent gaps are unchanged.
  This is not a 1:1 Figma match. Production remains
  `541d763547f7b021895daa3d533c3196c37a4e67`. No push or deploy.
- Local checks on Node 22.20.0 against disposable `bidplace_e2e` at
  `127.0.0.1:5432`: mobile typecheck, lint of the touched auth files,
  `auth-dismissal` unit tests, `build:web`, and `e2e/auth-layout.spec.ts` plus
  `e2e/auth-lifecycle.spec.ts` — 10 passed on Chromium and WebKit.

## 2026-10-07 — Auth sheet completion, Back and one visible sheet

- `Partial` for the portfolio auth presentation. Successful login, registration
  and email confirmation each continue once through the sheet completion path.
  The leave warning appears only for a user close, backdrop, Escape or browser
  Back. A filled form stays until Continue or Interrupt; Continue restores the
  value and focus, and Interrupt follows the confirmed leave. A pending request
  still keeps the sheet and is not cancelled. Only the focused auth route
  paints the sheet. Primary actions use `authPrimary` (`#121212`, Inter 500).
  Resend is the `authQuiet` text action. The exit panel at 390 px is 366 wide
  with 12 px outer gutters. Before a send is accepted, and when sending is
  refused, verification says the code has not been sent. An accepted
  `requestEmailVerification` starts the existing 60s countdown and says the
  send was accepted, not that the letter arrived. Forgot/reset stay the
  single-use link. Google remains without a glyph. Telegram uses the measured
  13.88×11.5 path. Registration still sends `displayName`.
- Local checks: mobile typecheck, lint of the touched auth files, 35 unit
  tests, `build:web`, and `e2e/auth-layout.spec.ts` plus
  `e2e/auth-lifecycle.spec.ts` — 10 passed on Chromium and WebKit against
  disposable `bidplace_e2e` on `127.0.0.1:5432`. The earlier registration stop
  after HTTP 201 was the leave guard swallowing `router.replace`. The login
  failure after reload was a separate locator: the reset dialog and the
  password field share the name «Новый пароль». WebKit Back needed the history
  sentinel before Expo handled `popstate`.
- Still open, so this is not a 1:1 match: Google vector
  `I526:14901;298:6024;521:10381` has paths and no fills; mixed text ranges
  `558:16958`, `526:14902` and `526:15580` are unresolved; there is no public
  rules route and consent is not sent to `acceptRules`. Recovery and wide
  layouts stay derived. Production remains
  `541d763547f7b021895daa3d533c3196c37a4e67`. No push or deploy.

## 2026-10-07 — Auth forms use the supplied sheet locally

- `Partial` for the portfolio auth presentation. `/login` and `/register` share
  a bottom sheet over public Home. Verification is the existing six-digit email
  code, with a 60s countdown only after a confirmed send. Forgot/reset still
  use the single-use link; the result masks the address the user typed. Exit
  confirmation does not cancel a request, delete an account or log out.
  Google/Telegram show an unavailable message. Registration still sends
  `displayName` and omits the repeated password. Covered by
  `auth-dismissal.spec.ts`, `schemas.spec.ts` and `verify-email-logout.spec.ts`.
- Superseded for the browser suite and the 350 px button measurement by the
  entry above. That pass had not run the disposable-database suite. A complete
  Google asset, mixed legal styles and consent remain open. There is no public
  rules route in the mobile app, so the consent sentence is not a link and is
  not sent to `acceptRules`. Recovery and wide screens are derived. This check
  does not accept the portfolio MVP. Production remains
  `541d763547f7b021895daa3d533c3196c37a4e67`. No push or deploy.

## 2026-10-07 — Safe request logs are on production

- `Partial` for the portfolio MVP. Production code is
  `541d763547f7b021895daa3d533c3196c37a4e67` on
  `feature/portfolio-mvp-release`, deployed by
  [Production deploy run 37584564977](https://github.com/yayauheny/bidplace/actions/runs/37584564977).
  Worker version `3afe08d5-b204-495c-8dcc-91d43e6af92b`. The migration step was
  skipped. The SPA bundle is unchanged:
  `/_expo/static/js/web/entry-0c3534c00f9410858393160c2cc504e6.js`. This
  documentation commit is later than the deployed SHA and was not deployed.
  The previous production code remains
  `0085353954cfc3c6b1b5f29682260fbee0dc5060`, Worker
  `8b9c125e-11f4-4db3-b185-629e563c4a2b`.
- Live smoke: `https://bid.place/` opened with Home current and «Пока здесь
  тихо». Catalog opened at `/works` with filters and «Пока нет работ».
  `/login` opened with «Вход на Bidplace». `GET /api/portfolio/home` returned 200. `GET /api/health` and `GET /api/health/ready` each returned 200 once.
  A public home GET sent with a synthetic `X-Request-Id` and query marker
  returned a new server UUID in the response header. The cacheable
  unauthenticated home response still omits that header.
- `Needs verification` for the Nest summary of that request. Live Worker
  settings keep `invocation_logs: false` and `traces.enabled: false`. The
  observability query and the Logpush list returned 403, so they were not
  read. A worker tail of the probe matched script version
  `3afe08d5-b204-495c-8dcc-91d43e6af92b`, outcome ok, and status 200, with an
  empty `logs` array. That event did not include the Nest line: the same
  server UUID, route template, status, and `durationMs`. Historical logs were
  not inspected. This check does not close full MVP acceptance. No new
  services, Logpush jobs, keepalive, probes, environments, budget changes,
  accounts, roles, SMTP credentials, or user data.

## 2026-10-07 — Ordinary warn logs no longer copy failures

- `Implemented` locally for the remaining ordinary diagnostics. A failed
  achievement-image delete still returns `{ ok: true }` and logs a fixed
  warning, optionally with `safeFailureLocation`. Attribution create and
  claim failures still let the analytics event through and log a fixed
  warning. Those lines do not include the exception, stack, `anonymousId`,
  or object key. Covered by `sellers.service.spec.ts` and
  `analytics.service.spec.ts`. Admin moderation warnings keep their server
  ids. Security `auditEvent` records are unchanged.
- Deployed later as `541d763547f7b021895daa3d533c3196c37a4e67`. The Nest
  summary line stays `Needs verification`. Historical logs were not inspected.

## 2026-10-07 — Password-reset mail failure log

- `Implemented` locally: a failed password-reset delivery still deletes the
  new token and completes the request. The log keeps
  `Password reset email delivery failed; token removed` and may add a short
  `safeFailureLocation`. The SMTP message and raw stack are not logged.
  Covered by `password-reset.service.spec.ts`. Other runtime `logger.error`
  calls already use a fixed line or the sanitized 5xx logger.
- Deployed later as `541d763547f7b021895daa3d533c3196c37a4e67`. The Nest
  summary line stays `Needs verification`.

## 2026-10-07 — Failure location ignores message text

- `Implemented` locally for the 5xx failure site. `safeFailureLocation` drops
  the whole `Error.toString()` header, including a multiline message, before
  it reads stack frames. A line inside that message is not a location.
  A container frame `/app/dist/<path>.js:line:col` from `node dist/main.js`
  is stored as `dist/<path>.js:line`. Source frames stay
  `apps/api/src/<path>.ts:line`. Absolute paths and other files are omitted.
  Covered by two cases in `api-exception.filter.spec.ts`. Those filter tests
  and the request-log interceptor tests: 10 passed. API typecheck, lint, and
  build exit 0. The built `safe-request-log.js` returns
  `dist/products/products.service.js:88` for an `/app/dist` frame and `null`
  for the message frame, without starting the API or connecting to Neon.
- Deployed later as `541d763547f7b021895daa3d533c3196c37a4e67`. Workers
  invocation logs and traces stay off. The Nest summary line stays
  `Needs verification`. The server request id, request summary, 5xx codes,
  health skip, and security/admin audit are unchanged.

## 2026-10-07 — Safe request logs, local only

- `Implemented` locally for the Nest request summary and the unexpected-error
  line. An ordinary request logs one line: server UUID, method, registered
  route template or `unmatched`, status, `durationMs`, and the existing user
  id when that id is a UUID. `/health` and `/health/ready`, with or without
  the `/api` prefix, stay out of that summary even if the URL has a query.
  The 5xx line keeps `requestId`, status, a known API error code, and an
  `apps/api` stack frame when one can be selected. It does not record the raw
  URL, pathname, exception message, original stack, or `String(exception)`.
  An inbound `X-Request-Id` is ignored; the response still returns the server
  id. Security and admin `auditEvent` logging is unchanged. Covered by
  `apps/api/src/core/errors/api-exception.filter.spec.ts` and
  `apps/api/src/core/request-context/request-logging.interceptor.spec.ts`.
  Those unit tests: 8 passed. `pnpm --filter @bidplace/api typecheck`, lint,
  and build exit 0.
- Deployed later as `541d763547f7b021895daa3d533c3196c37a4e67`. Workers
  invocation logs and traces stay off. The Nest summary line stays
  `Needs verification`. Response bodies, keepalive, and an external `/ready`
  monitor were not enabled.

## 2026-10-07 — Test maintenance cleanup, no behavior change

- `Partial` for the portfolio MVP, unchanged in product behavior. The
  frame-scanning press e2e is gone. Pressed button and chip styles still
  cover fill, inset, disabled opacity, the selected chip, and one check that
  the shared pressed style omits `boxShadow`. The seller client test now
  requires the second invalid profile call to throw `fieldErrors`. Save,
  media, session, field-error, auth, publish, and revoke regressions stay.
  Local checks: mobile unit 7 files / 79 tests; api-client sellers 2 passed;
  mobile and api-client typecheck exit 0; mobile eslint on the edited specs
  exit 0; e2e fence exit 0; field-focus Chromium/WebKit 12 passed. The full
  portfolio gate was not rerun. Production was not updated. A later check
  showed the catalog-after-Home note was retained DOM (`opacity: 0`,
  `aria-hidden`, `inert`), not a visible overlay. No navigation change.

## 2026-10-07 — Ordinary press has no mint ring, and the form fixes are deployed

- `Implemented` for the press change: pressed `FigmaButton` and
  `FigmaChoiceChip` no longer draw `rgba(0, 235, 151, 0.25)`. Pressed fill,
  inset, and opacity stay. Selected chips stay charcoal. Keyboard focus stays
  the blue `#2457e6` outline. Field success `#039600` stays. Dock was already
  `boxShadow: none` and was not the flash. `DEC-104`. Figma and the protected
  `.pen` file were not rewritten. Covered by `figma-button-style.spec.ts`,
  `figma-choice-chip-style.spec.ts`. The frame-scanning
  `e2e/press-feedback.spec.ts` was removed after this deploy; pressed fill,
  inset, disabled opacity, selected chips, and one shared absence of
  `boxShadow` remain in those style specs.
- `Partial` for the portfolio MVP: release
  `0085353954cfc3c6b1b5f29682260fbee0dc5060` is on production from
  `feature/portfolio-mvp-release` by
  [Production deploy run 37541612877](https://github.com/yayauheny/bidplace/actions/runs/37541612877).
  Worker `8b9c125e-11f4-4db3-b185-629e563c4a2b`. The site serves
  `/_expo/static/js/web/entry-0c3534c00f9410858393160c2cc504e6.js`. No new
  migration ran. Health ready is ok, and empty Home stays «Пока здесь тихо».
  Login shows one shell and «Введите корректный email». The smoke author
  profile is still pending review and readonly, so its required-field messages
  were not exercised live. Moderation, publication, viewer, republish,
  hide/revoke, and a full reset still have no new live evidence. The full
  portfolio gate remains 228 passed / 2 failed, only the known Home Opening
  ratios. That gate is not green.

## 2026-10-06 — Step 3 requiredness after async validation

- `Partial`: the earlier note that empty direction and short description keep
  «Укажите направление» and «Добавьте короткое описание о себе» after blur or
  Continue was premature. A space, or deleting the text, cleared the message
  once the async draft resolver finished, because that resolver accepts an
  incomplete draft. The visible required message is now derived from a reveal
  flag and the current trimmed value. A schema or server message still wins.
  Untouched fields stay quiet. Reset and a session change clear the reveal.
  Whitespace discipline and short description still save. Covered by
  `seller-profile-submit.spec.ts` and `profile-validation.spec.ts`.
  `pnpm verify` exit 0 with the existing integration `maxWorkers: 4`.
  `pnpm build:web` exit 0. Chromium/WebKit field and author checks: 12 passed
  in 45.0s. Production was not updated. The live Worker is still
  `4b41ca7f-3eb5-4849-83f8-e045bc016cff` from
  `bbac1fa9578931c3c4b35173bd586bdebb45bfe8`.

## 2026-10-06 — Portfolio form error lifecycle

- `Partial`: a failed product or profile save no longer keeps its message after
  the next accepted attempt succeeds. A later failure replaces it. A response
  from the previous session does not publish or clear the new session's message.
  Empty author direction and short description show «Укажите направление» and
  «Добавьте короткое описание о себе» after blur or Continue; an untouched step
  stays quiet, and an allowed incomplete draft still saves. Achievement year,
  month, and day show their own Russian messages. A server `occurredDate` error
  without a precise path stays on the date group. Covered by
  `product-draft-save-race.spec.ts`, `seller-profile-submit.spec.ts`,
  `achievement-date.spec.ts`, and `author-application-achievements.spec.ts`.
  `pnpm verify` exit 0: mobile unit 112 files / 602 tests; integration 28 files /
  134 tests with `maxWorkers: 4` in `apps/api/vitest.integration.config.ts`.
  `pnpm build:web` exit 0. Chromium/WebKit field checks 12 passed. Full portfolio
  gate 222 passed / 2 failed, only the known Home Opening ratios
  `0.12231040564373898` and `0.12205687830687831`. Dedicated media gate 2 passed.
  Production was not updated. The live Worker is still
  `4b41ca7f-3eb5-4849-83f8-e045bc016cff` from
  `bbac1fa9578931c3c4b35173bd586bdebb45bfe8`.

## 2026-10-06 — Portfolio form fields and validation

- `Partial`: shared `FigmaTextField` matches the 2026-10-06 field export
  through semantic tokens (`size.input` 51, `size.fieldBorder` 0.5,
  `typography.field` 14/24, `typography.fieldLabel` / `fieldError` 12).
  Author, work, auth, and admin forms map `validation_error` `fieldErrors`
  onto the matching controls. `parseRequest` applies the same details before
  HTTP. A taken slug returns `{ reason: 'slug_taken' }`; an existing profile
  returns `{ reason: 'profile_exists' }`. Empty draft nickname stays allowed;
  invalid grammar does not. Covered by `form-fields.spec.ts`,
  `figma-text-field-style.spec.ts`, `profile-validation.spec.ts`,
  `seller-profile-submit.spec.ts`, `packages/api-client/test/sellers.test.ts`,
  `sellers.service.spec.ts`, and
  `author-application-contract.integration.spec.ts` on the disposable local
  database. Local checks: mobile unit 592 passed; integration 134 passed with
  `--maxWorkers=4` after the unlimited run hit the existing 10s `beforeAll`
  timeout on a rotating file; `pnpm build` and `pnpm build:web` passed.
  Chromium/WebKit field checks 12 passed. Full portfolio gate 222 passed / 2
  failed, only the known Home Opening ratios `0.12231040564373898` and
  `0.12205687830687831`. Dedicated media gate 2 passed. Production still shows
  the previous field and the generic save error. The live Worker is still
  `4b41ca7f-3eb5-4849-83f8-e045bc016cff` from
  `bbac1fa9578931c3c4b35173bd586bdebb45bfe8`. This checkout is not deployed.

## 2026-10-06 — First admin is not assigned

- `Needs verification`: `work.evles@gmail.com` is not in production `neondb`.
  The smoke account stays `user`, `active`, email verified, seller
  `mvp-smoke` `PENDING_REVIEW`. A second account,
  `starosvetskayavarvara@gmail.com`, is also `user` and email verified.
  Admins: 0. No seed, password change, email confirmation, or role update
  was run. The first admin update is prepared only for
  `work.evles@gmail.com` after that account exists, the email is verified
  through the product, and the operator confirms the update.

## 2026-10-06 — Field focus is deployed, empty Home stays the quiet state

- `Implemented`: release `bbac1fa9578931c3c4b35173bd586bdebb45bfe8` is
  deployed from `feature/portfolio-mvp-release` by
  [Production deploy run 37485616958](https://github.com/yayauheny/bidplace/actions/runs/37485616958).
  Worker version `4b41ca7f-3eb5-4849-83f8-e045bc016cff`. No migration ran.
  `FigmaTextField` suppresses only its own web outline. Live Chromium and
  WebKit on `/login` show one shell border `rgb(0, 77, 255)` for click and
  Tab, with `outline-style: none`.
- `Implemented` for the empty public Home: `/api/portfolio/home` returns
  200 `curatorSelection: null`, `newWorks: []`, `newAuthors: []`. The page
  shows «Пока здесь тихо». The same response held on the first open, a
  reload, and the first open after the Container sleep window. No catalog
  rows were added. Anonymous `GET /api/auth/me` remains 401 and does not
  replace the Home screen.

## 2026-10-06 — Production deploy is live, smoke is partial

- `Partial`: release `814295a78fc90807450c571f9a8ae8346fc70427` is deployed
  from `feature/portfolio-mvp-release` by
  [Production deploy run 37470450369](https://github.com/yayauheny/bidplace/actions/runs/37470450369).
  Worker `bidplace-production` version `08ecae5a-8bce-4be4-8c13-5f00dd36eb47`,
  custom domain `bid.place`. Container application
  `bidplace-production-portfolioapi-production`
  `a038d351-fdc6-4976-981a-5d57029a40a8`. `migrate deploy` applied 22
  migrations. Production `neondb` now has 27 public tables. The database was
  empty before that migration, so no user-data dump was taken.
- `Partial`: `https://bid.place` returns the SPA. `/api/health` and
  `/api/health/ready` return 200 with `database: ok`. An unknown API path
  returns a Nest 404. Public rules are version `MVP_RULES_V1`, owner
  `bidplace`, contact `work.evles@gmail.com`. The rules text was not copied
  into the repository. One controlled account was registered and the
  verification screen reports that the code was sent. The operator confirmed
  the mailbox code after the first code expired. Email is verified. Logout
  invalidates the session, and login with the same account works again.
  Password reset request returns 201. The reset link was not opened. Author
  `mvp-smoke` is `PENDING_REVIEW`. Work upload, moderation, publish, and
  revoke are not finished. There is no admin account, and production seed
  was not run.

## 2026-10-06 — Production rules source is GitHub, deploy not started

- `Confirmed` (`DEC-102`): one production contour. Neon project
  `calm-rain-59989397` lists only default branch `production`
  `br-polished-haze-b2d6rop9`, database `neondb`. The founder deleted the
  staging branch. No replacement branch, database, or role was created.
  Leftover staging R2 buckets and DNS were not deleted.
- `Confirmed` (`DEC-103`): the production job uses the existing GitHub
  Environment `prod`. Migration reads `secrets.NEON_DIRECT_URL` as
  `DATABASE_URL`. Runtime keeps pooled `secrets.DATABASE_URL`.
  `SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`, `SERVICE_RULES_TEXT`, and
  `CLOUDFLARE_ACCOUNT_ID` come from that environment's variables into a
  temporary production config. Committed production Wrangler fields for the
  three rules are empty. The first-launch owner is `bidplace`; the contact
  is `work.evles@gmail.com`. The founder approved the short temporary rules
  text already stored in `prod` for this launch. The text is not copied into
  the repository. An empty rules variable still stops the deploy. Secret
  values were not read.
- `Partial`: the rules package
  `0b4987f8c0f0271bba11633006cc6607c1524708` is on
  `origin/feature/portfolio-mvp-release` by fast-forward, with this status
  note committed after it. `origin/main` is
  `5a052ad18bc06f4ed856870a9450dcb4408d4679` and contains only the same
  production workflow file; the default branch was not changed. Production
  `neondb` has 0 public tables, so there is no user data to back up.
  Endpoint `ep-withered-shadow-b230htte` is the production compute.
  `pnpm cloudflare:check`, the production SPA build for `https://bid.place`,
  and image verify on a disposable local database passed. The GitHub CLI is
  not authenticated, so the production workflow has not been dispatched.
  Migration and deploy have not run.

## 2026-10-05 — Cloudflare resources started, not deployed

- `Partial`: Cloudflare account `56b0c4b96497366c262447d2a18bf632`. Zone
  `bid.place` `f10d49913e125d8b0d424018322aeb07` is `active` on Free Website.
  `media-staging.bid.place` is attached to `bidplace-staging-media-public`
  and is active. `media.bid.place` is attached to `bidplace-media-public`
  and was still `pending` at the last read. Private buckets have no custom
  domain and `r2.dev` stays disabled. Cache rule
  `85b85dfb40204a2d9d978a03b4dab4b0` ignores the entire query string only on
  those two media hosts. Browser and edge TTL stay `respect_origin`.
- `Partial`: Email Sending for `bid.place` is enabled. DKIM selector
  `cf-bounce`, return path `cf-bounce.bid.place`. MX, SPF, DKIM, and DMARC
  records are present. `smtp.mx.cloudflare.net:465` accepts implicit TLS
  and answers `220`/`221`. That is not mailbox delivery. The earlier
  unauthorized limits call is stale: the same call now returns HTTP 200,
  quota 200 per day, sent 0. That daily figure does not replace the monthly
  included quota. No Workers email binding was added. Confirmed
  `SMTP_FROM` is `noreply@bid.place`.
- `Partial`: confirmed `SERVICE_RULES_OWNER` and `SERVICE_RULES_CONTACT` are
  `work.evles@gmail.com` in both Wrangler environments. `SERVICE_RULES_TEXT`
  stays empty. The approval line was left as the placeholder
  `[утверждаю / мои изменения]`, so the draft was not written into config.
  Preflight still fails closed on that empty text.
- `Confirmed` for the current Neon bill shape: organization
  `org-flat-night-30430100` is plan `free` / `free_v3`. Project
  `bidplace (main)` `calm-rain-59989397` has production branch
  `br-polished-haze-b2d6rop9` and staging branch `br-summer-wind-b2gz0gcm`.
  There is no branch named `main`. Staging endpoint
  `ep-twilight-recipe-b2ials8i` stores `suspend_timeout_seconds=0`, which
  remains the plan default. No Neon upgrade, Auth, or Data API. Staging
  Data API is absent (`404`). No migration was applied. The only role on
  both branches is `neondb_owner`, copied with the branch. Separate staging
  credentials are not established, and different hostnames do not prove
  isolation.
- `Needs verification`: the endpoint read itself marks compute active, so
  this check did not watch an idle suspend. Free has no paid overage; hitting
  the compute quota suspends the database until the next period. Staging
  reports `pooler_enabled=false` while still publishing a pooled hostname.
- `Partial`: Wrangler CLI 4.147.0 is logged into account
  `56b0c4b96497366c262447d2a18bf632`. Worker `bidplace-staging` does not
  exist yet, so secrets are not stored. No secret values were read. No deploy.
  `pnpm cloudflare:check`, the staging SPA build, and image verify on a
  disposable local database passed. Neon `migrate deploy` was not run.

## 2026-10-05 — Revoke deadline withdrawn

- `Accepted MVP limitation` (F01, deadline): a stopped, crashed, or sleeping
  process does not guarantee public revoke within five minutes. `DEC-101`
  revises that target in `DEC-097` and `DEC-099`. This is not an implemented
  wake and not a runtime fix. Earlier notes in this file that the deadline is
  not withdrawn describe the state before this decision.
- `Needs verification` (F01, retry/recovery): deletion of public copies, CDN
  purge, the journal, the existing `REVOKE`/`CLEANUP` executor, and recovery
  of unfinished operations after the process starts remain required. Private
  SOURCE stays. An old public URL may work until recovery succeeds. Live
  confirmation is still open.
- No executor, cron, alarm, service, or timer change.
- `05-MVP-RFC.md` keeps hidden works out of the public profile and does not
  set a CDN deadline. The RFC was not edited.
- `Needs verification` (F11/D08) is unchanged. Local tests do not accept a
  live CDN purge.

## 2026-10-05 — Cloudflare Email Service SMTP

- `Confirmed` (`DEC-100`): исходящая почта остаётся на существующем Nodemailer.
  Провайдер — Cloudflare Email Service, `smtp.mx.cloudflare.net:465`, implicit
  TLS, `SMTP_AUTH_MODE=login`, username — литерал `api_token`. Password —
  отдельный API token с Email Sending: Edit. `SMTP_FROM` — адрес на домене,
  подключённом к Email Sending. SDK, email binding и новый adapter не добавлены.
- Контракт: `deploy/cloudflare/wrangler.jsonc` задаёт host, port `465` и
  `SMTP_SECURE=true` для staging и production. Позже подтверждённый
  `SMTP_FROM` записан как `noreply@bid.place`; см. верхний раздел. Username и
  password остаются Worker secrets.
- Совместимость: `apps/api/src/core/email/smtp-transport.ts` и
  `smtp-transport.spec.ts`. Runtime не переписывался.
- `Needs verification`: Email Sending в аккаунте, Workers Paid, DNS домена
  отправителя, раздельные credentials и реальная доставка OTP и reset в ящик.
  SMTP acceptance эту доставку не закрывает.
- Бюджет: Email Service входит в расходы Cloudflare внутри общего бюджета
  `DEC-099` (около $5–7 в месяц, потолок $10, вместе с Neon). Квота 3 000
  писем на аккаунт за billing month, далее $0.35 за 1 000, не останавливает
  отправку и не выносит overage за этот бюджет. Квота считает письма, не
  пользователей.
- Секреты: восстанавливаемая копия — зашифрованное хранилище оператора вне
  GitHub и Cloudflare. Токены не создавались, DNS и deploy не менялись,
  значения секретов не читались.

## 2026-10-05 — Portfolio MVP local completion

- `Implemented`: work creation in the media browser test uses `fillControl`,
  so a controlled title must hold its value before save. An approved gallery
  add or reorder waits for an in-flight ordinary save and then continues. A
  save that does not persist does not add or reorder.
- Screen: `apps/mobile/src/features/sellers/product-draft-screen.tsx`.
  Browser: `apps/mobile/e2e/work-media-lifecycle.spec.ts`.
  Regression: `product-draft-save-race.spec.ts`.
- `Partial` (F01) and `Needs verification` (F11/D08) are unchanged. Local gates
  do not accept a sleeping Container or a live CDN purge.
- Checks on Node 22.20.0 / pnpm 11.7.0, code
  `a8d0acb50be727ceda257289deb3c9d042beed66`: `pnpm verify` exit 0
  (mobile 587, integration 132, API unit 389). `pnpm cloudflare:check` exit 0.
  Staging and production SPA exports exit 0. Image verify exit 0. Full
  Chromium/WebKit: 210 passed / 2 failed Home Opening visual, 12.2m. Dedicated
  media on the same code: 2 passed, then 2 passed. No push or deploy.

## 2026-10-05 — One confirmed image delete while a save is in flight

- `Implemented`: two confirms of the same image while an ordinary save is
  still waiting produce one `images.remove` for that image id. The confirm
  lock starts before the first await and stays through the save wait and the
  DELETE. A failed save sends no DELETE, releases the lock, and a later
  confirm can delete. A session cleared before the save finishes sends no
  DELETE. The existing delete-button loading state and cancel disabled state
  cover the attempt. Other `persistCurrentForm()` callers and the route guard
  are unchanged.
- Screen: `apps/mobile/src/features/sellers/product-draft-screen.tsx`.
  Regression: `product-draft-save-race.spec.ts`. Route guard:
  `product-draft-route-guard.spec.ts`.
- `Partial` (F01) and `Needs verification` (F11/D08) are unchanged.
- Checks on Node 22.20.0 / pnpm 11.7.0, branch `fix/portfolio-media-execution`:
  targeted save-race and route-guard tests 16 passed. `pnpm verify` exit 0
  (typecheck 13/13, lint 2/2, config 8, API unit 389, contracts 32, api-client
  28, database 1, mobile 585, ops 31/0, integration 132, build 8/8). Dedicated
  media Playwright on disposable `bidplace_e2e`: Chromium passed the lifecycle
  in 26.6s. WebKit timed out at creation, `work-media-lifecycle.spec.ts:126`,
  blank `/products/new`, no `POST /api/products`. That miss is before delete.
  Workers 1, retries 0. Timeout was not raised. No push or deploy.

## 2026-10-05 — Confirmed image delete during an in-flight save

- `Implemented`: an approved work editor that confirms image deletion while an
  ordinary save is still running waits for that save, then calls
  `images.remove` with the same image id. The delete dialog closes only after
  that remove succeeds. A save that does not persist leaves the dialog open
  and sends no DELETE. Other callers of `persistCurrentForm()` still receive
  `false` while a save is in flight, so route removal during an ordinary save
  still does not navigate.
- Screen: `apps/mobile/src/features/sellers/product-draft-screen.tsx`.
  Regression: `product-draft-save-race.spec.ts`. Route guard:
  `product-draft-route-guard.spec.ts`.
- `Partial` (F01) and `Needs verification` (F11/D08) are unchanged. This
  screen fix does not close a dead process or live CDN purge.
- Checks on Node 22.20.0 / pnpm 11.7.0, branch `fix/portfolio-media-execution`,
  code `2c9dc89eb185e478860da2f9178bc7d0421a3b00`: `pnpm verify` exit 0
  (typecheck 13/13, lint 2/2, config 8, API unit 389, contracts 32, api-client
  28, database 1, mobile 583, ops 31/0, integration 132, build 8/8). Dedicated
  media Playwright after the fix: 2 passed, 1.0m, Chromium 26.3s, WebKit 12.0s,
  workers 1, retries 0, disposable `bidplace_e2e` only. No push or deploy.

## 2026-10-05 — Non-blocking media recovery

- `Implemented` (F29): API startup schedules the existing five-second recovery
  timer and returns. `app.init()` no longer waits for revoke or cleanup against
  object storage. No new scheduler was added, and the timeout was not increased.
- `Implemented` (F30): one failed abandoned-staging scan keeps the next attempt
  on that same timer. Empty counts after the failed scan do not count as
  success. After a later empty pass, fifteen minutes add no further reads.
  Shutdown cancels the timers.
- `Implemented` (F27, F28): the earlier recovery guarantees stay. A read error
  and young staging still leave a one-shot timer. Attached assets, an active
  lease, and a needed private SOURCE stay. Publication and upload are not
  retried by the executor.
- `Partial` (F01): the idle loop stays off. A dead process with nothing to wake
  it still does not guarantee the DEC-097 revoke within five minutes.
- `Needs verification`: live Cloudflare cache and purge. This package is not
  ready for staging.
- Checks on Node 22.20.0 / pnpm 11.7.0, branch `fix/portfolio-media-execution`,
  code `1d6ab422d3896a1f0a64d9d0d32ea60bd7221c9c` from
  `59b5de6fa999502a645462107d132d6a1d92993e`: `pnpm verify` exit 0
  (typecheck 13/13, lint 2/2, config 8, API unit 389, contracts 32, api-client
  28, database 1, mobile 582, ops 31/0, integration 132, build 8/8).
  `pnpm cloudflare:check` exit 0 (26 unit + 7 script).
  `pnpm cloudflare:image:verify` exit 0. Dedicated media Playwright 2 passed,
  1.0m, workers 1, retries 0. Full Chromium/WebKit: 210 passed / 2 failed,
  0 skipped, 0 retries, 12.0m. Both failures are Home Opening visual mismatch
  (Chromium 0.12231040564373898, WebKit 0.12205687830687831, threshold 0.12)
  and stay post-MVP debt. No push or deploy.

## 2026-10-05 — Media recovery after a failed read

- `Implemented` (F27): a database read error during revoke or cleanup recovery
  keeps a later one-shot attempt. Recovery stops only after a successful read
  shows no `REVOKE` or `CLEANUP` work, or when the process shuts down.
- `Implemented` (F28): a restart with staging younger than ten minutes schedules
  the existing grace-period cleanup. Saving a staging intent schedules that
  cleanup even if the later object write fails. Attached assets, an active
  lease, and a needed private SOURCE stay. Publication and upload are not
  retried by the executor.
- `Partial` (F01): the idle loop stays off, and F27/F28 no longer drop recovery
  on a live process. A dead process with nothing to wake it still does not
  guarantee the DEC-097 revoke within five minutes.
- `Needs verification`: live Cloudflare cache and purge. This package is not
  ready for staging.
- Checks on Node 22.20.0 / pnpm 11.7.0, branch `fix/portfolio-media-execution`,
  code `659a6cc648aef7269fedfc96ce8a56a901d22bf8`: `pnpm verify` exit 0
  (typecheck 13/13, config 8, API unit 387, contracts 32, api-client 28,
  database 1, mobile 582, ops 31/0, integration 132, build 8/8).
  `pnpm cloudflare:check` exit 0 (26 unit + 7 script). Staging SPA verified for
  `https://staging.bid.place`. Production SPA verified for `https://bid.place`.
  `pnpm cloudflare:image:verify` exit 0. The literal Playwright file command
  reported no tests because the maintained config ignores
  `work-media-lifecycle.spec.ts`. The dedicated media config then passed 2/2
  in 1.1m, workers 1, retries 0. Full Chromium/WebKit: 210 passed / 2 failed,
  0 skipped, 0 retries, 12.8m. Both failures are Home Opening visual mismatch
  about 0.122 against the 0.12 threshold and stay post-MVP debt.
  `git diff --check` passed; no `.pen` changes. No push or deploy.

## 2026-10-05 — Synchronous publication and view attribution

- `Partial` (F01): approve, restore and unhide confirm media delivery before
  HTTP success. A busy lease, a failed provider call or a missing publication
  switch is not success. The previous published snapshot stays until the switch
  commits. The idle 5-second reconciliation loop no longer runs when no
  `REVOKE` or `CLEANUP` work exists. The executor itself remains, so
  `DEC-097` revoke within five minutes is not withdrawn and F01 is not closed.
- `Implemented` (F02, publication and upload): retry uses the same journal
  identity. A lost upload SOURCE is `SOURCE_RESEND_REQUIRED` and is not retried
  by the executor. The file must be sent again through the existing upload API.
- `Implemented` (F03): author, work and admin screens no longer poll delivery
  every five seconds. Pending and failed delivery show a manual retry message.
- `Implemented` (analytics requests): same-turn `listing_viewed`,
  `seller_viewed` and `registration_started` leave as one ingest after
  attribution is already stored, and that request does not read attribution.
  The event rows are still written to Neon. Analytics flags are unchanged.
- `Needs verification`: live Cloudflare cache and purge, including the base
  URL, `?media_retry=1` and an arbitrary query after hide or revoke. Local
  checks do not replace that acceptance.
- Checks on Node 22.20.0 / pnpm 11.7.0, branch `fix/portfolio-media-execution`
  from `2a3a11024a101e91f47553ff7ecb76b4f9f1367a`: `pnpm verify` exit 0
  (typecheck 13/13, config 8, API unit 383, contracts 32, api-client 28,
  database 1, mobile 582, ops 31/0, integration 128, build 8/8).
  `pnpm cloudflare:check` exit 0 (26 unit + 7 script). Staging SPA verified for
  `https://staging.bid.place`. Production SPA verified for `https://bid.place`.
  `pnpm cloudflare:image:verify` exit 0. Dedicated media Playwright
  `--workers=1 --retries=0`: the first WebKit run timed out waiting for
  `POST /api/products` before publication; the identical rerun passed 2/2 in
  54.9s. Full Chromium/WebKit: 210 passed / 2 failed, 0 skipped, 0 retries,
  11.8m. Both failures are Home Opening visual mismatch about 0.122 against
  the 0.12 threshold and stay post-MVP debt. `git diff --check` passed; no
  `.pen` changes. No push or deploy. Local checks do not replace live
  Cloudflare acceptance.

## 2026-10-05 — Portfolio upload safety

- `Implemented`: profile photo create and update share `images:profile-photo-upload`
  at 10 requests / 60s through the existing `RateLimitGuard`. Author photo,
  achievement, and work decode share one process-local admission of two
  operations. Nested pipeline validation reuses that slot, and `finally` releases
  it after success and failure. A rate-limited request does not start image
  processing. Auth, verified email, ownership, MIME/magic, size, pixel, and
  animation checks, real decode, byte-identical private SOURCE, and metadata
  stripping of public derivatives stay in place. Postgres and local storage are
  unchanged.
- `Implemented`: a new Work upload that would exceed gallery count or total
  bytes is rejected before media stage, Sharp, and R2. The locked Read Committed
  transaction still rechecks capacity, so two parallel requests cannot both
  pass. Replaying an Idempotency-Key whose bytes are already attached to the
  current revision returns success and does not create another image. Different
  bytes and an attachment from an earlier revision stay 409.
- `Needs verification`: F11 live cache. Purge still sends the exact base URL.
  Acceptance of that URL, `?media_retry=1`, and an arbitrary query after
  hide/revoke remains mandatory before public launch. This package did not
  change the Cloudflare account or secrets, and local green does not close F11.
- `Unchanged`: F01–F03 scheduler, journal execution, automatic retry, and
  frontend delivery polling. A sync/manual proposal is not a revision of
  DEC-097. Manual recovery conflicts with automatic revoke within 5 minutes
  after crash or outage, because a stopped process has no execution trigger.
- Checks on Node 22.20.0 / pnpm 11.7.0, branch `fix/portfolio-upload-safety`
  from `bf6eb9831f6b81cb25971c2c5ec425994b2588dc`. Remote
  `feature/cloudflare-deployment` was absent, so that local HEAD was used
  without substituting another branch. Release `507bb5b` was not changed.
  No push or deploy.
  `pnpm verify` exit 0: typecheck 13/13, lint 2/2, config 8, API unit 57 files /
  382 tests, contracts 32, api-client 28, database 1, mobile 111 files / 581
  tests, ops 31 pass / 0 fail, integration 28 files / 126 tests, build 8/8.
  `pnpm cloudflare:check` exit 0 (26 unit + 7 script tests).
  `pnpm cloudflare:build:staging` exit 0 for `https://staging.bid.place`.
  `pnpm build:web` exit 0 for `https://bid.place`.
  `pnpm cloudflare:image:verify` exit 0: linux/amd64 native modules, migrated
  disposable database, HTTP/auth boundary, and SIGTERM passed.
  Dedicated media Playwright, one worker and no retries: 2 passed (Chromium and
  WebKit). The first start stopped before tests because Prisma blocked
  `migrate reset` for the agent; the rerun used only the fenced local
  `bidplace_e2e` database. `git diff --check` PASS; no `.pen` changes. Known
  Home Opening visual failures stay post-MVP and were not rerun.
- Evidence: `apps/api/src/images/image-processing-admission.ts`,
  `sellers.controller.ts`, `images.service.ts`,
  `upload-safety.integration.spec.ts`. Audit:
  [FinOps](../audits/current/13-FINOPS-SCALE-TO-ZERO-AUDIT.md),
  [deployment verification](../audits/current/14-CLOUDFLARE-DEPLOYMENT-VERIFICATION.md).

## 2026-10-05 — Cloudflare deployment package

- `Implemented` (prepared code): Worker API routing + anonymous public JSON cache,
  Expo SPA Static Assets, one basic private Container, separate staging/production
  vars and required secrets. `deploy/cloudflare`, `scripts/cloudflare` own the
  deployment/image/migration gates; GitHub Verify includes edge/web/image checks.
- `Implemented` (local verification): Worker typecheck/lint, 26 unit + 7 script
  tests; API dependency graph 14/14 and mobile graph 9/9, API 372 / mobile 581
  tests; ops 31 and E2E fence pass. Both target web exports and Wrangler dry-runs
  pass. Native amd64 smoke covers migrations/HTTP/auth/SIGTERM; local Wrangler
  runtime serves root and Work/Author deep links. Metro export now clears stale
  origin state; build canary proves tested non-public settings are absent.
- `Partial`: actual staging/production readiness. Resource setup, domains/DNS,
  SMTP/rules vars, independent Neon/R2/JWT secrets, live CDN/purge and full cloud
  portfolio smoke are outstanding. Existing journal retry/polling and analytics
  remain unchanged; neither scale-to-zero optimization nor live secret setup is
  claimed. Runtime secret location and media optimization await founder answers.
- Source: updated remote release `507bb5b`; work stays in separate deployment
  branch, without release integration/push/deploy. Exact results, registry and
  manual blockers: [deployment verification](../audits/current/14-CLOUDFLARE-DEPLOYMENT-VERIFICATION.md).

## 2026-10-05 — Container runtime safety

- `Implemented`: recursive `.dockerignore` excludes nested dotenv and dev-vars
  files. Filename-only inspection found `packages/database/.env` packaged in an
  earlier local API image; contents were not read and images were not published.
  The rebuilt linux/amd64 image rejects dotenv filenames and passes the gate.
- `Implemented`: `apps/api/src/main.ts` enables Nest shutdown hooks. A disposable
  PostgreSQL smoke with production security, 0.25 CPU / 1 GiB verifies native
  Sharp/Argon2/Prisma, migrations, health/readiness/auth HTTP and SIGTERM exit 0.
  API graph typecheck/lint/test/build passes (14 tasks, 372 API unit tests).
- `Needs verification`: Cloudflare runtime deployment and live resource/security
  acceptance. These local container fixes do not alter portfolio/auth/media rules.

> The dated entries below are historical implementation records. The 2026-09-24
> snapshot describes the base portfolio runtime; later dated entries record
> subsequent verified changes. Retained
> commerce-schema references below do not mean that Listing, Bid, Order,
> lifecycle, realtime, discovery or activity modules are currently booted.

## 2026-10-05 — Malformed session HTTP boundary

- `Implemented`: `OptionalBearerAuthGuard` returns 401 for malformed bearer
  headers, malformed session-cookie encoding and an empty supplied cookie.
  Requests without credentials still access public media. User persistence
  failures remain server failures and are not treated as anonymous access.
- `Implemented`: `LogoutAuthGuard` permits invalid-cookie cleanup through the
  existing logout contract, without attaching a user or changing an account.
  `AuthTokenService` requires three base64url JWT segments and compares the
  signed signature encoding with `timingSafeEqual`; trailing segments, padding,
  punctuation and alternate signature pad bits are rejected.
- `Implemented` (release verification): auth guard/token units and HTTP
  media/logout/session regressions pass. On release code/test HEAD `6af9096`,
  `pnpm verify` exits 0 (API 372, integration 123, builds 8/8); dedicated media
  passes in both engines. Full Chromium/WebKit remains `Partial`: 210 passed
  and the same two known Home Opening visual failures, no skips/retries. Exact results and source
  reproduction are in the [permanent audit](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
  Existing valid sessions, roles, ownership and anonymous catalog contracts are
  preserved. No Google OAuth, new dependencies or UI changes are included.

## 2026-10-05 — Catalog visibility during concurrent revoke

- `Implemented`: `ProductsService.loadPortfolioCatalogPage` and
  `SellersService.listPortfolioAuthors` reapply existing public visibility on
  hydration. Hide, author suspension and user ban committed after catalog ID
  selection exclude the target; an unaffected item keeps its order. Six real
  PostgreSQL interleavings in `portfolio-filters.integration.spec.ts` pass,
  including an unpublished-revision negative case.
- `Partial`: A02/R23 consistency beyond visibility. Total remains from ID
  selection; a concurrent revoke can shorten a page. Search/filter changes on
  republish and a consistent snapshot are outside this local fix.
- `Implemented` (release transfer and regression): both local fix commits were
  cherry-picked without conflicts into `feature/portfolio-mvp-release`, code/test
  HEAD `6af9096`. Full verify, browser and media results are recorded above;
  all browser statuses match the previous release baseline. Backend typecheck/build,
  lint, targeted ProductsService tests and the catalog integration file pass.
  Exact evidence and current branch are in
  the [permanent audit](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
  UI, public contracts, Prisma and deployment configuration are unchanged.

## 2026-10-04 — Portfolio release verification

- `Implemented` (release code verification): `feature/portfolio-mvp-release`
  fast-forwarded to confirmed integration 9af7ecc without conflicts. Production,
  tests, Prisma, auth and media code are identical to the integration package.
  Sequential release-source checks: `pnpm verify` exit 0, integration 112,
  builds 8/8; full Chromium/WebKit 210 passed / 2 failed, 0 skips/retries, 12.0m;
  dedicated media 2 passed, 55.8s. Every test status/attempt matches baseline.
- `Partial`: full visual/R29/T05 gate; only known Home Opening visual failures
  remain post-MVP. Golden, threshold, timeout and canonical design files unchanged.
- `Implemented` (handoff prepared): docs-only evidence commit preserves verified
  application/test tree; release is ready for authorized normal push. Actual
  verified release SHA, source manifest, inventory and exact evidence live in the
  [permanent release audit](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
  External deployment/provider acceptance was outside this pass.

## 2026-10-04 — Portfolio integration candidate

- `Implemented` (candidate assembled): `feature/portfolio-mvp-integration` starts
  from release `6c0fac7` and includes the verified media/Work package `047f2c7`.
  The release ref is unchanged. Deterministic catalog page-2 owners from `b9d0f5f`
  are included; earlier conditional owners retain filters/sort/Back coverage.
- `Implemented` (existing Search behavior, test alignment): Search Works/Authors
  support load-more through their existing query hooks. The older first-page-only
  Search record below is historical. Mandatory isolated Search page-2 owners and
  server-derived button expectations replace a stale no-load-more assertion.
- `Implemented` (functional integration verified): code/test HEAD `0f1a499`;
  final `pnpm verify` exit 0, API 358 / mobile 581 unit, integration 112,
  builds 8/8. Full Chromium/WebKit: 210 passed / 2 failed, 0 skipped/retries,
  11.8m; only post-MVP Home Opening visual failures. Dedicated media: 2 passed,
  58.0s, no retries/skips. Critical author/auth/Work/media lifecycle passes.
- `Partial`: full browser/R29/T05 gate due to those two visual failures. Threshold,
  golden and `.pen` unchanged. The combined package is ready for release transfer;
  release ref `6c0fac7` is unchanged and release-HEAD regression is not run.
- `Needs verification`: live R2/CDN/cache/purge, production startup/email/restore,
  portfolio Rules/Privacy and conditional valuable-data cutover. No deployment,
  push or PR. The permanent
  [release audit](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md) owns exact
  commands, findings, classification and preserved evidence.

## 2026-10-04 — Portfolio Work runtime and critical media flow

- `Implemented` (application behavior): stable single-file upload identities and
  client retry, pending submit/completed approve replay, owner/admin media waiting
  states with bounded polling, PREVIEW-only Work page and lazy selected FULL viewer.
  `ImagesController/ImagesService`, `ProductsService`, `AdminModerationService`,
  `dashboard.ts`, `api-client/images.ts`, `MediaDeliveryNotice`, `WorkGallery`.
- `Implemented`: Work save/submit retires its history guard before navigation;
  shared AppDialog completes focus after entering. Public Work/Author/catalog/media
  reads require active author user; private admin photo reads are no-store.
  HTTP/PostgreSQL regression covers upload conflicts, permissions, duplicate
  actions, delivery outage, atomic republish, hide/restore/ban and exact purge.
- `Implemented` (tool only): minimal dry-run/maintenance legacy importer attaches
  all five existing owners through the same media lifecycle, verifies source and
  retains Bytes. Disposable integration covers cross-page import, corrupt source,
  outage/resume and rerun. It has not run on real data; no further legacy work is
  part of the current MVP priority.
- Critical browser evidence: all author/Work wizard owners pass in Chromium and
  WebKit (`bidplace-work-critical-v5`: 40 passed; only two frost stale assertions
  failed). Dedicated media v4: 2 passed, 55.5s, no retries/skips; two-file unknown
  upload response, actual synthetic CDN WebP 200, explicit outage/recovery, FULL
  switching and 390/1024/1440 control bounds, edit/republish/hide/revoke. The earlier
  media v2 green is not acceptance: test commands returned unchecked 404. This
  harness defect is corrected and recorded in the audit.
- `Partial`: public release. Live R2/custom-domain/cache/purge, real-data cutover
  if required, production startup/email/restore and Rules/Privacy acceptance remain
  unverified. The package stays on `feature/portfolio-media-lifecycle`; no release
  integration, push or PR. Full release regression/R29/T05 remains open. Home
  Opening visual parity is post-MVP under the founder's latest scope; thresholds
  and canonical design files are unchanged.
- Verification checkpoint: full unit (358 API, 32 contracts, 28 API client,
  581 mobile), integration 112, graph typecheck/lint/build 17/17 and ops 31 passed.
  Final `pnpm verify` exit 0 (8/8 builds); frost follow-up 2 passed, 43.6s.
  The package is ready for integration regression, not accepted as a live release.
  Exact commands/results and remaining public-launch gates are recorded in the permanent
  [release audit](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md), which owns
  every finding, severity, decision and exact command/evidence.

## 2026-10-04 — R2 media lifecycle implementation in progress

- `Partial`: `core/media` and the additive `20261004170000_media_lifecycle`
  migration implement private/public transport, SOURCE identity, WebP PREVIEW/FULL,
  operation manifests, operation/object leases, retry in the existing Nest process,
  delayed revision publication, cancellation, cleanup and exact-URL CDN purge.
  New media is attached by Images/Sellers after external writes; public Work/Author
  contracts support HTTPS derivative URLs. Owner/admin DTOs expose publication state.
- `Needs verification`: this is a working implementation package, not the release
  completion requested by the founder. Remaining code: connect upload idempotency
  to HTTP/client actions; operator import of all five legacy owners into assets;
  admin waiting/error presentation and viewer FULL loading; Work lifecycle HTTP
  matrix, stale-intent/restore coverage, bounded-processing benchmark and live
  provider acceptance. Existing transport-only backfill is not that importer.
- `Not implemented in this package`: author/work browser defect corrections,
  classification of every R29 failure, integration into
  `feature/portfolio-mvp-release`, and regression from release HEAD. No reduction
  of the maintained release gate was made. No `.pen`, hosting or SMTP changes.
- Verified kernel checks: repository `pnpm verify` passed (API 357 unit tests,
  contracts 32, API client 28, mobile 573; API integration 110; builds 8/8).
  After the last restoration change, API typecheck/lint/build and the eight media
  integration scenarios passed again. Evidence:
  `/private/tmp/bidplace-media-root-verify-final.log`,
  `/private/tmp/bidplace-media-final-api-checks.log`,
  `/private/tmp/bidplace-media-integration-expanded.log`.
  This does not substitute for release-HEAD browser verification.
- Verification uses an isolated tracked-source copy without personal dotenv files,
  Node 22.20.0, pnpm 11.7.0 and disposable PostgreSQL on port 55433. Eight new
  PostgreSQL scenarios cover outage/restart, purge retry, late PUT cancellation,
  idempotency, old snapshot preservation, shared references, rollback cleanup,
  and restore racing DELETE. Provider tests use synthetic stores; they do not
  prove live R2/CDN operation.

## 2026-10-04 — Developer commands and API container

- `Implemented`: root `Makefile` exposes 15 local development/build/check targets.
  `doctor` checks toolchain and config presence without reading env contents.
  `make dev` waits for PostgreSQL, applies migrations and starts API + Expo;
  `build-web` includes shared packages/tokens. `rebuild` runs clean → locked
  install → generate → build sequentially. `clean` preserves dependencies and
  DB data. README contains Quick start and exact target mappings.
- `Implemented`: local Compose no longer interpolates production API settings;
  the existing pilot API profile moved to `docker-compose.app.yml`. No provider
  deployment target or new infrastructure was introduced. Database migration
  accepts process configuration without requiring an env file. Turbo passes
  runtime variables to uncached `dev` tasks; build remains strict.
- `Implemented`: API Docker build copies the Expo patch and all included package
  manifests before frozen install. API-only deploy tolerates the unused mobile
  patch without relaxing patch application for used packages.
- Verification: isolated `make rebuild` (8 uncached successful tasks), `make
build-web` (4 successful tasks), `make test` and dev smoke passed. Production
  container on Linux arm64: health/readiness, empty Authors/Home 200; anonymous
  session 401; native Argon2/Sharp/Prisma passed. No external SMTP/R2 calls.
- `Needs verification`: `make check` types/lint passed; formatting still fails on
  existing repository files. HEAD comparison found 372 baseline files; new
  formatting warnings were corrected and Expo generated artifacts excluded.
  Global format debt, full maintained browser gate and live providers remain
  open; these local checks do not prove a public deployment.

## 2026-10-04 — Public launch auth verification and media backfill

- `Implemented`: blank optional registration phone becomes `null`; successful
  login/register navigation waits for canonical authenticated context. Real
  forms cover registration, email verification, invalid login, reload, logout,
  password recovery, old-password rejection and single-use reset links.
  `auth-form.tsx`, `schemas.ts`, `schemas.spec.ts`, `e2e/auth-lifecycle.spec.ts`.
- `Implemented`: `AdminModerationService` requires `discipline` before approving
  legacy, suspended-parent or revision targets. Six negative unit cases and
  HTTP/PostgreSQL regression prove 409 without publication or audit writes.
  This closes the separate server gap recorded in the locator entry below.
- `Partial`: media backfill now inventories all five media owners in bounded
  pages, verifies source and target checksum/type/length, avoids conflicting
  target overwrite, supports reruns and retains original DB bytes. Nine unit
  cases plus real Prisma/PostgreSQL with a synthetic transport passed. A live
  R2 migration and CDN deployment have not happened. The selected private/public
  R2 + native CDN target and NestJS retry are confirmed in `DEC-097`; runtime
  implementation remains pending.
- Verification: `pnpm verify` exit 0; 342 API unit, 573 mobile unit, 31 ops and
  102 integration tests. Targeted Chromium/WebKit run: 16 passed, 0 skipped,
  0 flaky. Publication tests now wait for completed save-and-exit navigation.
  Full maintained browser baseline and external SMTP/R2/TLS checks remain open.
  Details and remaining launch gates:
  [launch audit](../audits/2026-10-04-PUBLIC-LAUNCH-READINESS.md).

## 2026-10-04 — City publication browser locator

- `Implemented`: `author-application-publication.spec.ts` selects the public
  author link by the current test's unique `@slug`, then opens that same link.
  Duplicate display names across Chromium and WebKit no longer cause a strict
  locator failure or select the earlier browser's author.
- Verification: logout followed by publication, one worker and one disposable
  database across both browsers: 12 passed, 0 failed, 0 skipped. Both approved
  city authors remain in that database. Commands and evidence:
  [execution roadmap](../audits/current/00-EXECUTION-ROADMAP.md#2026-10-04--city-publication-locator-follow-up).
- `Needs verification`: the full R29/T05 browser baseline, timings and cleanup
  remain open. The production approval guard still lacks the `discipline`
  requirement enforced by the public seller mapper; this test correction does
  not close that separate server gap.

## 2026-10-03 — Residual test cleanup

- `Partial`: five specs now call the shared `flush`. Three private Figma metadata lists and the unused catalog `enabled` argument are removed. `useInfiniteQuery` stays explicitly enabled. The mobile suite is 109 files and 568 tests.
- Owner report: `docs/audits/current/09-TEST-CLEANUP-FOLLOWUP.md`, R28-C section. Commands: R28-C evidence in `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Unchanged`: the matrix still lists R28, T02, and T06 as partial until review. The recommendation is to close those three. R29 and T05 are not verified. D04, D05, D09, D10, L04, and R32 stay needs verification. No E2E file was deleted.

## 2026-10-03 — Test cleanup follow-up

- `Partial`: identical `flush`, `setInput`, and `inputValue` live in
  `apps/mobile/src/testing/dom.ts`. The category publication wait no longer
  blocks on `categoryKeys.all`. The mobile suite stays 109 files and 569 tests.
- Owner report: `docs/audits/current/09-TEST-CLEANUP-FOLLOWUP.md`. E2E mapping:
  `docs/audits/current/10-E2E-SCOPE-PLAN.md`. Commands are in the R28-B evidence
  of `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Unchanged`: R28, T02, and T06 stay partial. R29 and T05 are not verified.
  D04, D05, D09, D10, L04, and R32 stay needs verification. No E2E file was
  deleted. Browsers, API, database, migrations, and seed were not run.

## 2026-10-03 — Behavior test coverage

- `Partial`: catalog hook tests drive the works and authors hooks, and nine
  former source-reading cases now drive their production owners. The revision
  photo reload case names the target change and the revoked object URL. The
  pending older response case is still there.
- Coverage and commands: `docs/audits/current/00-EXECUTION-ROADMAP.md`, R28-A
  evidence. Node v22.20.0. After that correction the mobile suite is 109 files
  and 569 tests. The diff is nine spec files. Production files are unchanged.
- `Unchanged`: R28, T02, and T06 stay partial. D04, D05, D09, D10, and L04 stay
  needs verification. Mutation checks, browsers, API, database, migrations, and
  seed were not run. This record does not accept the package.

## 2026-10-02 — R19 search cursor time zone

- `Partial`: admin search pages compare the cursor instant as UTC wall time.
  `created_at` stays a `timestamp(3)` without time zone. The bound parameter is
  `timestamptz AT TIME ZONE 'UTC'` for both the greater-than and the equal
  check, for authors and works. A session TimeZone no longer drops or repeats
  a later page.
- Before: UTC returned three tied and one-millisecond rows once. Europe/Minsk
  stopped after the first row. America/Los_Angeles repeated the first page.
- After: UTC, Europe/Minsk, and America/Los_Angeles each return those three
  rows once for both lists, and `nextCursor` ends. The TimeZone is set only
  inside the transaction that runs the list query.
- Coverage: `admin-moderation-list.ts` and
  `admin-moderation-pagination.integration.spec.ts`. Node v22.20.0 / pnpm
  11.7.0. API unit tests are 49 files and 288 tests, plus 37 env tests.
  Integration is 24 files and 91 tests on local disposable
  `bidplace_integration` schemas. Commands are in the R19 search cursor
  timezone evidence of `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Unchanged`: literal search, joined display text, revision filters, page
  size, reason reads, permissions, and public contracts. R20 and R21 were not
  started. D07 stays partial. Browsers were not run. This correction is not
  accepted by this record.

## 2026-10-01 — Distinct public portfolio facet reads

- `Implemented`: `GET /api/portfolio/facets` reads distinct values from the
  existing public catalog CTEs (`products.service.ts`
  `listPortfolioMaterialFacets`, `sellers.service.ts` `listPublicFacets`,
  `portfolio.service.ts` `facets`). Materials come from the published Work
  revision. Cities and tags use the current public author predicates as two
  separate distinct reads. `normalizeFacetValues` still trims, drops blanks,
  deduplicates with `toLocaleLowerCase('ru-RU')`, and sorts with
  `localeCompare`. Draft, hidden (`ARCHIVED`), suspended, and non-public
  revisions do not add values.
- On one synthetic fixture, 36 qualifying material rows became 2 distinct
  rows and 25 author pairs became 2 city rows plus 2 tag rows. The facets
  JSON stayed `{ materials: [Дерево, Холст], cities: [Гродно, Минск], tags:
[Живопись, Керамика] }`. The transferred row count follows distinct stored
  values. This is not a latency claim.
- Coverage: `portfolio.service.spec.ts`, `products.service.spec.ts`,
  `sellers.service.spec.ts`, and
  `portfolio-filters.integration.spec.ts`. Node v22.20.0 / pnpm 11.7.0. API
  unit tests are 48 files and 283 tests, plus 37 env tests. Integration is
  23 files and 80 tests on disposable `bidplace_integration` schemas.
  Commands are in the R21 evidence of
  `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Unchanged`: the response schema, filter matching, taxonomy, and visibility
  predicates. When stored strings differ only by case, the kept spelling is
  the first unordered distinct row. The baseline fixture previously observed
  `Холст` and this read observed `холст`; both are the same locale key, and
  no new spelling canon was added. D07 stays partial: R19 and R20 are in this
  tree, and the moderation browser check is still not run. Browsers were not
  run. No founder decision was added.

## 2026-10-01 — R19 moderation read correction

- `Partial`: the admin moderation shell keeps search, filters, and tabs mounted
  while a new list query is loading or has failed. The results area shows
  loading, error, empty, retry, and a search longer than 200 characters. That
  over-limit value is not sent and is not truncated. Refresh cancels in-flight
  seller and product pages before it trims the cache. Search matches the
  previous joined display text, and `%`, `_`, and `\` are literal.
- Coverage: `admin-moderation-screen.tsx`, `admin-moderation-list.ts`,
  `admin-moderation.service.ts`, and
  `admin-moderation-pagination.integration.spec.ts`. Node v22.20.0 / pnpm
  11.7.0. API unit tests are 49 files and 288 tests, plus 37 env tests.
  Integration is 24 files and 85 tests on local disposable
  `bidplace_integration` schemas. Mobile tests are 108 files and 543 tests.
  Commands are in the R19 correction evidence of
  `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Unchanged`: page size, keyset order, latest-reason scope, permissions,
  moderation transitions, append-only audit, public list APIs, and
  `productAction`. R20 and R21 were not started. D07 stays partial. Browsers
  were not run. This correction is not accepted by this record. No `.pen`
  file was changed.

## 2026-10-01 — Bounded admin moderation reads

- `Implemented`: admin seller and product lists are cursor pages. The default
  page is 50 and the maximum is 100, ordered by `createdAt` ascending and then
  `id` ascending. `nextCursor` is null when the page is the last one. An
  invalid cursor is rejected. Review and visibility filters, and search, run
  on the server using the revision projection from R02. The latest non-empty
  moderation reason is one SQL row per target on the current page.
- `Implemented`: the admin screen loads the next page, retries a failed next
  page, and starts again when the filter or search changes. Approve, reject,
  changes, suspend, and a conflict refresh replace the loaded pages so a stale
  later page is not kept. `productAction` and its error text are unchanged.
- Coverage: `admin-moderation-list.ts`, `admin-moderation.service.ts`,
  `admin.controller.ts`, `packages/contracts/src/admin.ts`,
  `packages/api-client/src/admin.ts`, `admin-moderation-screen.tsx`, and
  `admin-moderation-pagination.integration.spec.ts`. On the synthetic fixture,
  limit 1 returns one seller while five audit rows remain for that target;
  the latest-reason query returns one row. Node v22.20.0 / pnpm 11.7.0.
  API unit tests are 49 files and 287 tests, plus 37 env tests. Integration
  is 24 files and 83 tests on local disposable `bidplace_integration`
  schemas. Mobile tests are 108 files and 532 tests. Commands are in the R19
  evidence of `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Unchanged`: moderation transitions, append-only audit, permissions, and
  public list APIs. R20 and R21 were not started. D07 stays partial.
  Browsers were not run. No `.pen` file was changed.

## 2026-10-01 — Admin analytics aggregates in PostgreSQL

- `Implemented`: `GET /api/admin/analytics/overview` still returns the same
  overview contract. Active users are `COUNT(DISTINCT user_id)` for non-null
  ids in the period. Acquisition groups `AcquisitionAttribution` by
  `coalesce(source, 'direct')` in the database. Growth reads UTC day counts
  and the service fills the zero buckets. `apps/api/src/admin/admin-analytics.query.ts`
  and `admin-analytics.service.ts`.
- Signup counts stay inside the captured-at cohort: a row counts only when
  `capturedAt` is in the period and `userId` plus `linkedAt` are also in that
  period. `docs/product/analytics-metrics.md` does not explicitly require
  counting a linked row whose capture is outside the period, so that metric
  was not redefined.
- Equal visitor counts are ordered by source after the visitor count. The
  previous read had no order, so tied sources were not a defined sequence.
  The checked 7-day fixture has distinct visitor counts, and its full JSON
  matches the overview from before this change.
- Recent lists stay at 8 rows. Drilldowns stay at 50. Stuck moderation is
  still `PENDING_REVIEW` with `updatedAt` strictly older than seven days.
  No new transaction snapshot was added.
- Coverage: `admin-analytics.service.spec.ts`, `admin.guard.spec.ts`,
  `admin.controller.spec.ts`, and
  `test/integration/admin-analytics-aggregation.integration.spec.ts`, on
  Node v22.20.0 / pnpm 11.7.0 / PostgreSQL 16.14. API unit tests are 49 files
  and 286 tests, plus 37 env tests. Integration is 24 files and 84 tests on
  local disposable `bidplace_integration` schemas. Commands are in the R20
  evidence of `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Partial`: D07. Catalog facets (R21) are still open. R19 moderation reads
  are in this tree; the moderation browser check is still not run.
  `05-MVP-RFC.md` §16 leftover event names stay DB-derived or deferred.
- Index predicate correction, same overview contract: `inUtcPeriod` compares
  the bare `timestamp(3)` column with
  `(bound::timestamptz AT TIME ZONE 'UTC')`. On an isolated fixture of 100000
  rows outside the period and 10 inside, the previous column-side predicate
  was a sequential scan that removed 100000 rows by filter for active users,
  acquisition, and views growth. The corrected queries returned the same rows,
  including under `Europe/Minsk` and `America/Los_Angeles`, and the date range
  was an index condition. Active users still filtered non-null `user_id` and
  removed 0 rows; views still filtered `listing_viewed` and removed 0 rows.
  This is one plan observation, not a measured speedup. The correction checks
  are in the R20 evidence.
- `Unchanged`: analytics ingestion, attribution writes, admin permissions,
  contracts, schema, and migrations. Browsers were not run. No founder
  decision was added.

## 2026-10-01 — Leading env BOM and config unit discovery

- `Implemented`: `loadEnvFile` removes one leading U+FEFF and then calls Node
  `util.parseEnv`. A production file no longer loses its first key, so
  `NODE_ENV=production` or `APP_ENV=production` still fails closed when the
  rest of the production profile is absent. A complete production profile that
  starts with a BOM stays production. A BOM inside a quoted value stays. Explicit
  env still overrides the file.
- `Implemented`: root `test:unit` runs `@bidplace/config` test before the
  existing API, contracts, api-client, database, and mobile stages, and still
  stops on the first failure. `pnpm verify` and the current CI workflows call
  that script.
- Coverage: `@bidplace/config` 8 tests; `env.spec.ts` 37 tests, including both
  production BOM rejections through `loadServerEnv`. Node v22.20.0 / pnpm
  11.7.0. Commands are in the R17 evidence.
- `Unchanged`: the frozen `SERVER_ENV` snapshot, Nest DI, Prisma
  `DATABASE_URL` fill, and the auth, OTP, reset, mail, and rate-limit rules.
  L03 stays verified after these regressions. Browsers were not run.

## 2026-10-01 — Server config loaded once per application

- `Implemented`: env files are parsed with Node `util.parseEnv` in
  `packages/config`. HTTP bootstrap validates the merged environment once,
  freezes it, and passes that object through Nest `SERVER_ENV`
  (`apps/api/src/core/config/env.ts`, `server-env.module.ts`, `main.ts`,
  `AppModule.forRoot`). Analytics, auth, OTP, password reset, mail, image
  storage, and rate limits read that snapshot. Request handlers do not reread
  the env file or rerun schema validation. Unset `process.env` keys are still
  filled so Prisma can read `DATABASE_URL` when `PrismaService` constructs
  `PrismaClient`.
- Node parser differences, locked by synthetic fixtures: an unquoted `#`
  starts a comment, double quotes interpret escapes, an optional `export`
  prefix is accepted, and only outer quotes are removed. One leading U+FEFF
  is removed before parsing, so the first key stays visible. A BOM later in
  the file, including inside a quoted value, is preserved. Process env still
  overrides the file. A missing file stays empty. The last duplicate key
  still wins.
- The `NODE_ENV` × `APP_ENV` security matrix is unchanged, including
  production SMTP, service rules, reset URL, S3, JWT length, and the
  `TEST_EMAIL_BYPASS` prohibition. Bypass remains `NODE_ENV=test` with
  `APP_ENV=local`.
- Coverage: `@bidplace/config` 7 tests; API unit 275 tests plus 33 env tests;
  API integration 76 tests on local disposable `bidplace_integration` schemas.
  Node v22.20.0 / pnpm 11.7.0. Commands and exit codes are in the R17 evidence
  of `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Unchanged`: auth, OTP, reset, analytics, media, and rate-limit rules;
  mobile, contracts, schema, and migrations. R15, R16, and R18 evidence is
  unchanged. L03 is verified. No founder decision was added. Browsers were
  not run. Root migrate and seed were not run.

## 2026-10-01 — Narrow image authorization and portfolio Work reads

- `Implemented`: `ImagesService.get` authorizes a Product image from revision
  membership, product status, `publishedRevisionId`, and the seller's user id
  and status. The read no longer includes biography or achievements.
  Owner, admin, and public approved membership still receive the stored bytes.
  Anonymous and stranger reads of private or pending images stay 404.
  `isPublic` and Cache-Control are unchanged.
- `Implemented`: public portfolio Work hydration selects product id, public id,
  `publishedAt`, the public seller profile, and the published revision gallery.
  Parent product fields and the parent image relation are not selected.
  Published revision content, image order, completeness checks, and page order
  stay in place. Owner and moderation reads still use `productSelect`.
- Coverage: `images.service.ts`, `products.mapper.ts`, `products.service.ts`,
  `images.service.spec.ts`, `products.mapper.spec.ts`,
  `products.service.spec.ts`, and
  `portfolio-published-revision.integration.spec.ts`, on Node v22.20.0 /
  pnpm 11.7.0. API unit tests are 48 files and 306 tests. Integration is
  23 files and 77 tests. Lint, the API graph typecheck and build, and diff
  check passed. Commands are in `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Unchanged`: upload selectors, row locks, storage transactions, visibility
  predicates, response contracts, and the canonical Pen file. D06 is verified.
  The two-phase catalog visibility race stays open for R23.
- Browser checks were not run.

## 2026-10-01 — Author draft validation before save and exit

- `Needs verification` (mobile): save, submit, step, back, and exit read the
  current raw author draft through `profileDraftSchema` before they write or
  decide to save. Displayed field errors still come from `zodResolver`.
  `profileFieldsToUpdate` still normalizes Telegram and Instagram only after
  that check. An invalid contact is not sent as null. A corrected valid draft
  is saved before exit. A draft the schema rejects can still leave without a
  write. Empty optional contacts still become null. A blank city still blocks
  the write.
- Before: typing `bad handle` over a saved Telegram and pressing Save sent
  `telegramUrl: null`. Correcting that field to `@maker_art` and confirming
  exit before the resolver finished left with `router.replace('/')` and no
  `updateProfile`.
- After: the first case does not call `updateProfile`. The second case shows
  «Сохранить и выйти», sends `https://t.me/maker_art`, then navigates.
  Ordinary Save still keeps text typed after the request snapshot. A session
  change during that save does not publish the old result. A failed exit save
  keeps the author on the form.
- Coverage: `seller-profile-screen.tsx`, `profile-validation.ts`,
  `seller-profile-submit.spec.ts`, and `profile-validation.spec.ts`, on Node
  v22.20.0 / pnpm 11.7.0. The mobile suite is 108 files and 527 tests. Lint,
  the mobile graph typecheck and build, the e2e fence, and diff check passed.
  Commands are in `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Unchanged`: routes, layout, API contracts, normalization of a valid
  contact, server authorization, and the canonical Pen file. L02 stays needs
  verification. D04, D05, D09, D10, L04, and R32 stay needs verification. T04
  and T06 stay partial.
- Browser, device, API bootstrap, database, migration, and seed checks were
  not run.

## 2026-10-01 — Author and Work form field ownership

- `Needs verification` (mobile): the author profile form keeps values, dirty
  state, and field errors in react-hook-form 7.81.0. `profileDraftSchema`
  with `zodResolver` is the field-error source. Sections use `useController`.
  The screen watches slug, name, country, city, discipline, and short
  description for step gating. City, Telegram, Instagram, website, and public
  email messages are unchanged. Raw contact text stays in the field;
  `profileFieldsToUpdate` still normalizes Telegram and Instagram on write.
  Empty public contacts stay allowed. Auth email stays private.
- `Needs verification` (mobile): Work about, story, and review subscribe to
  the existing draft form. Empty title and category remain savable.
  `productDraftRequiredErrors` still blocks only the creation about action,
  and the year message still appears after that attempt. The write request
  still turns blank text into null and a blank year into null.
- Writes check `transitionLock` before `setValue`. Ordinary Save still accepts
  input after the request snapshot. Session epoch, moderation hold,
  achievements, and the image picker were not given a second owner.
- Coverage: `seller-profile-screen.tsx`, `seller-profile-steps.tsx`,
  `profile-validation.ts`, `product-draft-screen.tsx`,
  `product-draft-fields.tsx`, `product-draft-about.tsx`,
  `product-draft-story.tsx`, `product-draft-review.tsx`, on Node v22.20.0 /
  pnpm 11.7.0. The mobile suite is 108 files and 517 tests. Lint, the mobile
  graph typecheck and build, the e2e fence, and diff check passed. Commands
  are in `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Unchanged`: routes, copy, layout, API contracts, server authorization, and
  the canonical Pen file. L02 stays needs verification. D04, D05, D09, D10,
  L04, and R32 stay needs verification. T04 and T06 stay partial.
- Browser, device, API bootstrap, database, migration, and seed checks were
  not run.

## 2026-10-01 — Dialog return focus after reopen and unmount

- `Needs verification` (mobile web): `AppDialog` still uses `@rn-primitives/dialog`
  1.5.2 as the only focus owner. `onOpenAutoFocus` does not replace a captured
  opener with `document.body`, `documentElement`, a disconnected node, or an
  element already inside the dialog. The deferred `onCloseAutoFocus` skips
  restore only while that same instance is mounted and open. A closed or
  unmounted instance restores `focus({ preventScroll: true })` on the
  connected opener.
- Before: a rapid close, reopen, and second close left focus on `body`, and
  unmounting an open dialog without `open=false` did the same. A completed
  close followed by a different opener already returned to that opener.
- After: `apps/mobile/src/components/ui/AppDialog.tsx`,
  `AppDialog.spec.ts` (11), and `AppDialog.native.spec.ts` (1), on Node
  v22.20.0 / pnpm 11.7.0. The mobile suite is 106 files and 509 tests. Lint,
  the mobile graph typecheck and build, the e2e fence, and diff check passed.
  Commands are in `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Unchanged`: Search URL and history, navigation, image recovery, routes,
  auth, server contracts, and the canonical Pen file. L01 stays needs
  verification. C04, L06, D04, D05, D09, D10, L04, and R32 stay needs
  verification. T04 and T06 stay partial. C07 stays open, so R35 stays open.
  C08 stays verified.
- Browser, device, API bootstrap, database, migration, and seed checks were
  not run.

## 2026-10-01 — Shared button, dialog, and image lifetimes

- `Needs verification` (mobile): `PrimaryButton`, `SecondaryButton`, and
  `DestructiveButton` pass `compact` through to the existing `FigmaButton`
  size. Admin moderation already passes `compact` on approve, request-changes,
  reject, and suspend. Omitted or false `compact` keeps an explicit size.
  Disabled and loading still block the press. `TextButton` does not use
  `compact`. Tokens and variants are unchanged.
- `Needs verification` (mobile web and native): `AppDialog` no longer searches
  the document for a dialog control and no longer retries focus on its own
  timers. `@rn-primitives/dialog` 1.5.2 owns initial focus, the Tab loop,
  Escape, and outside close. Return focus uses `focus({ preventScroll: true })`
  only when that dialog is still closed, because these dialogs have no
  `Dialog.Trigger`. Sheet exit stays `SlideOutDown` with system reduced motion.
  `useOverlayFocusTrap` still serves Search and `FilterSheet`.
- `Needs verification` (mobile): `ResilientRemoteImage` mounts one recovery
  lifetime per URI. A later image does not see the previous URI's load or
  error. The same URI rerender keeps the retry count. Delays stay
  1000/3000/8000 ms, the fourth failure still shows «Повторить», and
  cache-bust plus `recyclingKey` still follow `requestVersion`.
- Coverage: `Button.tsx`, `Button.spec.ts` (6), `AppDialog.tsx`,
  `AppDialog.spec.ts` (8), `AppDialog.native.spec.ts` (1),
  `ResilientRemoteImage.tsx`, `ResilientRemoteImage.spec.ts` (9), on Node
  v22.20.0 / pnpm 11.7.0. The mobile suite, lint, e2e fence, and diff check
  are recorded in `docs/audits/current/00-EXECUTION-ROADMAP.md`.
- `Unchanged`: routes, auth, server contracts, admin `productAction`, Search
  URL and history, and the canonical Pen file. C07 stays open, so R35 stays
  open. C08 stays verified. D04, D05, D09, D10, L04, and R32 stay needs
  verification. T04 and T06 stay partial.
- Browser, device, API bootstrap, database, migration, and seed checks were
  not run. C04, L01, and L06 stay needs verification.

## 2026-10-01 — Post-cleanup leftovers after R09–R12

- `Implemented`: six unused source objects were removed after a fresh
  consumer search on `76ebd1b`. The private `sellerProfileBaseWriteSchema`,
  `PUBLIC_ID_LENGTH`, `LatestRulesAcceptanceRecord`,
  `SellerProfilePhotoRecord`, `ModerationTarget`, and
  `CREATOR_HANDOFF_HYSTERESIS` are gone, along with the sticky hysteresis
  import that only served that alias. Create and update seller schemas, handoff
  validators, the public-id generator, the rules-acceptance select, the seller
  photo select, moderation filters and targets, and the shared sticky
  hysteresis stay.
- `Implemented`: the root manifest no longer declares `zod` or
  `@types/react-dom`. Mobile no longer declares `jsqr`. Root `@types/react`,
  mobile `@types/react-dom`, `qrcode`, `@types/qrcode`, and the Zod
  declarations in api, mobile, api-client, config, and contracts stay. The
  lockfile dropped those three importer edges and the unused `jsqr` package.
  Zod `3.25.76` and `@types/react-dom` `19.2.7` remain for their owners.
  React, React Native, Expo, and TypeScript versions are unchanged.
- Coverage: frozen install, typecheck and build of the mobile and API graphs
  (15 tasks), API and mobile lint, contracts 30 tests, api-client 26 tests,
  API unit 269 tests plus 33 env tests, mobile 482 tests, and the mobile e2e
  fence, on Node v22.20.0 / pnpm 11.7.0. The contracts unused-local typecheck
  passed.
- `Unchanged`: product behavior, public contracts, auth epoch, `productAction`,
  button `compact`, image lifecycle, and the canonical Pen file. Browser
  checks, API bootstrap, database connections, migrations, and seed were not
  run. D04, D05, D09, D10, and L04 stay needs verification. R32 stays needs
  verification. T04 and T06 stay partial. C02, C03, and C04 stay open. C07 and
  L06 stay open.

## 2026-10-01 — Font loading and dependency ownership

- `Implemented`: the root layout loads Inter 400/500/600 through `useFonts`.
  Onest and `Inter_700Bold` are no longer registered. Current typography
  tokens use only those three Inter faces. Mobile no longer declares
  `@expo-google-fonts/onest`, `fbjs`, `inline-style-prefixer`, `memoize-one`,
  `nullthrows`, `postcss-value-parser`, `styleq`, or
  `@react-native/normalize-colors`. `react-native-web@0.21.2` still depends
  on those helper packages.
- `Implemented`: `@bidplace/api-client` declares `zod` `^3.24.2`. Root and
  mobile use `@types/react` `~19.2.18` and `@types/react-dom` `~19.2.7`.
  Runtime React `19.2.3`, React Native `0.86.0`, and Expo `~57.0.4` are
  unchanged. Mobile typecheck needed no source edits.
- `Needs verification`: a fresh install and `expo export` for web, iOS, and
  Android completed. That export is not a font-rendering check. The Inter
  package barrel still copies unused weight files, including
  `Inter_700Bold`, into the export.
- Coverage: isolated api-client deploy, mobile 482 tests, api-client 26
  tests, contracts 30 tests, API unit 269 tests plus 33 env tests, on Node
  v22.20.0 / pnpm 11.7.0.
- `Unchanged`: token sizes, routes, session ownership, and the canonical Pen
  file. Browser checks were not run. D04, D05, D09, D10, and L04 stay needs
  verification. T04 and T06 stay partial. C04, C07, and L06 stay open.

## 2026-10-01 — Confirmed unused code and duplicate helpers

- `Implemented`: confirmed mobile files and helpers with no production caller
  were removed, including `CatalogGrid`, `product-about`, `SessionAlert`,
  unused layout helpers, `FilterMenu`, `focusable-anchor`, `OverlayPortal`,
  and `persistProductDraftBeforeSubmit`. `OverlayHost` stays mounted with its
  relative content layer and absolute `app-overlay-host` layer, without a
  portal. Live `CreatorCardGrid`, `FigmaIconButton`, reactive
  `useReducedMotion`, share/QR, auth epoch, and analytics test seams stay.
  `AppIcon` keeps the dialog `x` icon.
- `Implemented`: confirmed API and package leftovers were removed, including
  the empty `UsersModule`, unused image and product re-exports, the ignored
  `_imageSelect` argument, and the never-thrown `RevisionMediaStorageError`
  translation in `putStoredImage`. Image storage calls, transaction
  boundaries, portfolio visibility predicates, `publicAuthorCityWhere`, and
  the existing permission and listing guards stay. Seller, Product, and
  Listing persistence parsers stay because their current and archived
  consumers are the parser spec and the contracts barrel.
- `Implemented`: search panes read query items and paging flags directly.
  Debounce owns its timer. `parseQuery` uses the same safe parse as
  `parseBody`. Product image upload MIME checks use
  `acceptSupportedUploadMimeType`. Product image DTOs use
  `toImageContracts`. Blob reads return `response.blob()` without a catch
  that rethrew the same cause. Seller profile upload rejection still uses
  `done(null, false)`.
- Coverage: mobile search pane and debounce specs, API parse and product
  image mapper specs, existing image MIME and request-cancellation specs,
  and the remaining mobile, API, contracts, and api-client suites on Node
  v22.20.0 / pnpm 11.7.0.
- `Unchanged`: routes, auth policy, server contracts, button `compact`,
  admin `productAction`, and keyed image retry. C07 and L06 stay open. C04
  stays partial until the compact button work. D04, D05, D09, D10, and L04
  stay needs verification. T04 and T06 stay partial.
- Browser verification, API bootstrap, database integration, migrations, and
  seed were not run.

## 2026-09-30 — Achievement editor lifecycle

- `Needs verification` (mobile web): an achievement add locks year, month,
  day, description, and photo selection until that request finishes. Success
  clears only the draft of the operation that started it. A failed add keeps
  the text and selected photo for retry. A later picker result does not replace
  a newer choice, and a result that finishes after the form locks, the session
  changes, or editing closes is not applied. Submit, step change, exit, and
  logout do not start during an achievement add or delete. An achievement write
  does not start after one of those parent transitions has started. Profile
  text typed after an ordinary save snapshot is still kept. A stale profile
  read does not reopen a pending revision or the achievement editor. Switching
  accounts, including login of the same account, drops the previous draft,
  photo, error, and private application read. A successful add or delete
  replaces an application read that started before that write, so a late empty
  or pre-delete response does not stay on screen. A photo selection started
  before that write, before a profile save or lock, or before a server snapshot
  makes the form readonly, is not applied after the form opens again. A new
  selection after the form is editable again applies.
  A failed refresh shows retry and releases the profile actions.
- Coverage: `AuthorApplicationAchievements.tsx`, `seller-profile-screen.tsx`,
  and `author-application-achievements.spec.ts` with the real profile screen,
  achievement editor, and QueryClient. Existing profile save, submit, and
  logout specs stay in place.
- Browser verification: Chromium and WebKit are NOT RUN.
- `Unchanged`: achievement order, date precision, publication, and server
  revision guards. D09, L04, D04, and D05 remain needs verification. D10
  remains needs verification. T04 remains partial. T06 remains partial until
  the test-harness cleanup in R28. Server contracts are unchanged.

## 2026-09-30 — Abort during response body reads

- `Needs verification` (mobile web): cancelling a public read after response
  headers preserves `AbortError` for a successful JSON body, an error JSON
  body, and an image blob. Malformed JSON and a payload that fails schema
  validation stay unexpected responses. An ordinary HTTP error keeps its
  status classification. A failed fetch stays a network error. An aborted
  signal does not turn a different body error into cancellation. Mutations
  stay uncancelled unless a caller passes a signal.
- Coverage: `packages/api-client/src/errors/abort.ts`,
  `packages/api-client/src/request.ts`, `packages/api-client/src/errors/parse.ts`,
  and `packages/api-client/test/request-cancellation.test.ts`.
  `apps/mobile/src/lib/public-query-cancellation.spec.ts` still covers
  QueryClient cancellation.
- Browser verification: Chromium and WebKit are NOT RUN.
- `Unchanged`: D04 and D05 remain needs verification. T04 remains partial. L04
  remains needs verification. Server contracts are unchanged.

## 2026-09-30 — Protected route refresh rejection

- `Needs verification` (mobile web): `ProtectedRoute` handles a rejected
  `refreshSession` on retry. A second network failure returns the error/retry
  page and releases the refreshing state. The rejection is recorded with the
  existing infrastructure logger. It does not clear the session. An unauthorized
  refresh still clears the local session. A network failure while a session
  exists keeps that session. A later successful retry opens the protected
  content.
- Coverage: `apps/mobile/src/components/shared/protected-route.tsx` and
  `apps/mobile/src/components/shared/protected-route-refresh.spec.ts`, with the
  real `AuthProvider` and `QueryClient`.
- Browser verification: Chromium and WebKit are NOT RUN.
- `Unchanged`: D04 and D05 remain needs verification. T04 remains partial. D09
  remains needs verification. Server auth contracts are unchanged.

## 2026-09-29 — Public read cancellation

- `Needs verification` (mobile web): catalog, search, home, public work, and
  public author reads pass the React Query `AbortSignal` through the API client
  to `fetch`. Aborting a JSON or image read rejects with `AbortError` and is
  not classified as a network failure. A failed fetch stays a network error. A
  malformed catalog response stays an unexpected response. Cancelling a works
  query aborts the in-flight fetch and does not store that query as an error.
  Mutations do not receive a signal unless a caller passes one.
- Coverage: `packages/api-client/test/request-cancellation.test.ts` and
  `apps/mobile/src/lib/public-query-cancellation.spec.ts`.
- Browser verification: Chromium and WebKit are NOT RUN.
- `Unchanged`: D04 and D05 remain needs verification. T04 remains partial. L04
  remains needs verification. Server contracts are unchanged.

## 2026-09-29 — Refresh session identity

- `Needs verification` (mobile web): `refreshSession` publishes a different
  authenticated user only through the existing session retirement. Private
  seller cache from the previous user is removed and that user's epoch cannot
  write again. A same-user metadata refresh updates the session and leaves the
  private profile and auth epoch in place. A network failure leaves the current
  session. An unauthorized `/me` clears the local session and private cache.
  Public catalog cache stays. An explicit login of the same account still
  retires the previous private cache.
- Coverage: `auth-provider-refresh.spec.ts`. Logout and owner-editor session
  specs stay in place.
- Browser verification: Chromium and WebKit are NOT RUN. Cross-tab cookie
  replacement was not executed.
- `Unchanged`: D04 and D05 remain needs verification. T04 remains partial. D09
  remains needs verification. Server auth contracts are unchanged.

## 2026-09-29 — Owner editor private cache during session retirement

- `Needs verification` (mobile web): session retirement closes private cache
  writes before the first async gap. A profile save that finishes during
  cancel, after private queries are removed, or before the anonymous session
  is published does not restore `['seller','profile']`. After cleanup the
  session is null. A newer login published during an older retirement stays.
  An in-flight session read does not leave an authenticated session. Public
  catalog cache stays. A rejected server logout still clears the local session.
- Coverage: `seller-profile-logout.spec.ts` and `query-cache.spec.ts`. Previous
  profile, work, session, picker, and navigation specs stay in place.
- Browser verification: Chromium and WebKit are NOT RUN. `prepare.mjs` was not
  allowed to reset disposable `bidplace_e2e`.
- `Unchanged`: D04 and D05 remain needs verification. T04 remains partial.
  Server contracts, refresh identity, and product route lifetime are unchanged.

## 2026-09-29 — Owner editor moderation hold after an intermediate save

- `Needs verification` (mobile web): after a confirmed resubmit, a detail read
  that started before or during save→submit does not reopen the form. An
  intermediate `CHANGES_REQUESTED` or `REJECTED` snapshot with a newer revision
  `updatedAt` stays locked. The hold floor is the settled editing revision
  after submit, then the first trusted post-submit detail; it is not the
  pre-save timestamp. Confirmed pending does not reopen Save or Submit. A later
  `APPROVED`, `CHANGES_REQUESTED`, or `REJECTED` revision does. An older detail
  does not roll that decision back. A failed reconciliation keeps the hold and
  still releases Close. A session change drops the previous operation's detail
  reads. Update and submit responses are still `{ product }` and are not
  written over the detail envelope. Parent and revision clocks are not compared.
- Coverage: `product-draft-submit-lifecycle.spec.ts` and
  `product-draft-state.spec.ts`. Previous session, picker, route-guard, and
  save-exclusion specs stay in place.
- Browser verification: Chromium and WebKit are NOT RUN. `prepare.mjs` was not
  allowed to reset disposable `bidplace_e2e`.
- `Unchanged`: D04 and D05 remain needs verification. T04 remains partial.
  Server contracts and revision transitions are unchanged.

## 2026-09-29 — Owner editor picker, submit continuation, and moderation freshness

- `Needs verification` (mobile web): a profile photo or work image selected
  before logout is not written into the next session, including a late file
  read and a repeated login of the same account. A work save that resolves
  after logout does not call submit. After a confirmed resubmit, the same
  changes-requested or rejected revision stays locked. A newer editing
  revision that is approved, changes-requested, or rejected can be edited.
  Freshness uses that revision's id, version, and updatedAt. A late older
  detail does not replace a newer decision, and `{ product }` is not written
  over the detail envelope. Close stays available. A failed refetch still
  offers retry.
- Coverage: `seller-profile-submit.spec.ts`,
  `product-draft-submit-lifecycle.spec.ts`, and `product-draft-state.spec.ts`.
  Previous session, route-guard, and save-exclusion specs stay in place.
- Browser verification: Chromium and WebKit are NOT RUN. `prepare.mjs` was not
  allowed to reset disposable `bidplace_e2e`.
- `Unchanged`: D04 and D05 remain needs verification. T04 remains partial.
  Server contracts and revision transitions are unchanged.

## 2026-09-29 — Owner editor session, leave guard, and save exclusion

- `Needs verification` (mobile web): a private profile or work response is
  applied only for the session that started it. Logout and a later login,
  including the same account, leave the new profile, work, form, and photo
  selection unchanged, and do not continue a step or submit. While a dirty work
  is saving before a route change, external removal stays blocked; a second
  request does not start another save, success navigates once, and failure
  stays on the form. After a confirmed work submit, Save and Submit stay closed
  on a stale draft, Close is available, and a newer changes-requested or
  rejected decision can be edited. A failed refetch does not leave the
  transition locked. Ordinary saves still allow typing, and a second save or
  submit in the same turn does not send a competing write or navigate.
- Coverage: `seller-profile-submit.spec.ts`, `seller-profile-logout.spec.ts`,
  `product-draft-save-race.spec.ts`, `product-draft-route-guard.spec.ts`,
  `product-draft-submit-lifecycle.spec.ts`, `author-cabinet-work-cache.spec.ts`,
  and `account-logout-reachability.spec.ts`.
- Browser verification: Chromium and WebKit are NOT RUN. `prepare.mjs` was not
  allowed to reset disposable `bidplace_e2e`.
- `Unchanged`: D04 and D05 remain needs verification. T04 remains partial.
  Server contracts, revision transitions, and navigation history are unchanged.

## 2026-09-28 — Owner editor save and cabinet refresh

- `Needs verification` (mobile web): ordinary save of a work or author profile
  keeps values changed after the request snapshot and applies server
  normalization only to fields that still match that snapshot. A newer profile
  photo selected during the previous save stays unsaved. Save before a step
  change, exit, or submit locks the form and does not continue after a failure.
  The retained author cabinet reads `['seller','cabinet','works']` and refreshes
  status and cover after a work create, update, submit, or image change.
  `{ product }` and `{ ok: true }` are not written over the detail envelope.
- Coverage: `product-draft-save-race.spec.ts`, `seller-profile-submit.spec.ts`,
  `seller-profile-logout.spec.ts`, and `author-cabinet-work-cache.spec.ts`.
- Browser verification: work creation/edit, profile/revision, and retained
  cabinet scenarios were not run. Chromium and WebKit are NOT RUN.
  `prepare.mjs` was not allowed to reset disposable `bidplace_e2e`.
- `Unchanged`: server contracts, revision transitions, publication, public cache
  invalidation on hide/unhide, navigation history, and required profile fields.

## 2026-09-28 — Workspace test discovery

- `Implemented` (tooling only): contracts Vitest discovers `src/**/*.spec.ts`
  together with `test/**/*.test.ts`. `@bidplace/database` runs a public-export
  smoke test for `PrismaClient` and `Decimal` without connecting to a database,
  and root `test:unit` includes that package. Production emit for contracts and
  database excludes test modules; those tests stay in a separate typecheck
  project. Product behavior is unchanged.

## 2026-09-28 — Author revision submit

- `Needs verification` (mobile web): an approved author sees «Отправить на проверку»
  on the live `/profile` screen when `canSubmitSellerProfileRevision` allows the
  editing revision. The same handler serves that action and the final step of
  the initial application. It saves first, submits only after a saved result,
  and keeps one synchronous guard around the whole cycle. A successful submit
  response updates the owner profile cache to the confirmed revision before
  that guard clears. The following profile read is not used to write that
  snapshot again. A failed read or an older snapshot leaves the confirmed
  pending revision in place. A newer approved, changes-requested, or rejected
  revision replaces it. A pending revision hides the
  action and disables editing. The approved parent stays public until a
  moderator approves the revision.
- Coverage: `seller-profile-submit.spec.ts` and the existing logout regressions
  in `seller-profile-logout.spec.ts`. `author-revision-flow.spec.ts` keeps one
  four-step onboarding submit and starts the approved edit from
  `createApprovedAuthorFixture`. `author-achievement-revision.spec.ts` uses the
  same fixture and still checks that a draft achievement and its image stay
  private until approval.
- Browser verification: those two Playwright specs were not run. Chromium and
  WebKit are NOT RUN. `apps/mobile/e2e/prepare.mjs` resets disposable
  `bidplace_e2e`, and this task did not include consent for that reset.
- `Unchanged`: seller revision transitions, publication, R30 logout exclusion,
  and the admin review target.

## 2026-09-28 — Admin revision review

- `Needs verification`: the admin queue reads an explicit review target and
  keeps parent publication status separate. Review actions send the revision
  the moderator saw. The seller photo reloads when that revision's `updatedAt`
  or photo checksum changes, drops the previous object URL, and shows a visible
  failure if the bytes cannot be fetched or decoded. Work images are fetched by
  the mobile API client with `credentials: 'include'`. That client does not set
  an Authorization bearer token; the image checksum is the reload identity.
  Achievement images stay on the direct `/api/author-achievements/:id/image`
  URL. `OptionalBearerAuthGuard` accepts the session cookie or a bearer token,
  and `getAchievementImage` allows an admin to read a non-public image. A new
  achievement row changes that URL, so the card loads the replacement. An
  achievement shows `occurredDate` through the existing month/day formatter; a
  null date adds no date text.
- Coverage: `AdminRevisionPhoto.spec.ts`, `admin-moderation-screen.spec.ts`,
  admin service/controller/mapper specs, and
  `moderation-revision-projection.integration.spec.ts`. The photo and date
  regressions failed before the correction and passed after it. The admin
  screen test now checks that an achievement image URL from the review target
  is rendered and replaced when the achievement id changes. The browser fixture
  adds a decodable pending-only achievement PNG beside the published one.
- Browser verification: `e2e/admin-revision-moderation.spec.ts` was not run.
  Chromium and WebKit are NOT RUN. The spec asserts decoded pending achievement
  bytes on the admin card, the published achievement before approval, a guest
  404 for the pending image, and the published image after approval.
  `prepare.mjs` was not allowed to reset disposable `bidplace_e2e`.
- `Unchanged`: review and visibility transitions, publication, audit, public
  and owner projections, and PATCH response envelopes.

## 2026-09-27 — Account logout

- `Verified` (mobile web): an authenticated user can press «Выйти»
  on the live account destinations. The author cabinet, admin moderation, and
  email verification call `AuthProvider.logout()`. On the author profile, an
  ordinary save and logout cannot run together, so a delayed save cannot write
  the private profile cache back after session cleanup. On email verification, logout
  and a new code request or confirmation cannot run together, so confirmation
  cannot call `refreshSession` after logout has started. On the author profile, a
  dirty form or a newly selected photo opens the existing exit dialog first.
  «Продолжить заполнение» does not log out. When the draft can be saved, logout
  runs only after that save succeeds. A failed save stays on the form. A clean
  profile logs out immediately. Guests do not see the action. After logout,
  local session and private query data are cleared and the app replaces `/`,
  including when the server logout fails. That failure is not presented as a
  confirmed server-session invalidation.
- Coverage: `account-logout-button.spec.ts`, `seller-profile-logout.spec.ts`,
  `account-logout-reachability.spec.ts`, `verify-email-logout.spec.ts`, and
  `auth-provider-logout.spec.ts`.
- Browser verification: `e2e/account-logout.spec.ts` passed Chromium 4/4 and
  WebKit 4/4 against an explicitly disposable `bidplace_e2e` PostgreSQL
  database. The history case `/profile → /cabinet → logout → Back` returned to
  `/login` without restoring private author UI.
- `Unchanged`: `AuthProvider.logout` still clears the local session in
  `finally`. The dock, onboarding, auth API, and route architecture are
  unchanged.

## 2026-09-27 — Overlay focus dismissal

- `Verified` (mobile web): `useDismissibleOverlay` registers a
  `focusin` listener only when `closeOnFocusIn` is true and removes that same
  listener. SearchOverlay, FilterSheet and FilterMenu still omit the option, so
  moving focus no longer closes them. Escape and outside pointer dismissal are
  unchanged. FilterSheet keeps `restoreOnClose: true`. SearchOverlay keeps
  `restoreOnClose: false`.
- Coverage: `use-dismissible-overlay.spec.ts` mounts the hook for omitted/false,
  true, inside/outside focus, cleanup and reopen. Those false cases fail on the
  previous shadowed listener.
- Browser verification: full `e2e/search-overlay.spec.ts` passed Chromium
  17/17 and WebKit 17/17 against an explicitly disposable `bidplace_e2e`
  database. The earlier category-history failure was an E2E fixture mismatch:
  the category was selected independently from the published work; the fixture
  now selects the category matching `work.categoryId` without changing
  production overlay behavior or weakening assertions.
- `Unchanged`: focus trap, portal, overlay history and outside-click ownership.

## 2026-09-26 — Backend API boundary cleanup

- `Implemented`: `POST /api/author/application/submit` is the single public
  application submit endpoint and retains its verified-email protection and
  existing Seller-service transition. The removed `/api/seller/profile/submit`
  route has no current runtime consumer.
- `Implemented`: Portfolio public GET handlers use query validation, and active
  Work, image, creation-step, owner Work and achievement UUID parameters reject
  malformed values with HTTP 400 while valid unknown UUIDs retain HTTP 404.

## 2026-09-24 — Portfolio release gate and runtime boundary

- `Implemented`: root `pnpm verify` now includes API, contracts, API-client and
  mobile unit suites plus the disposable-E2E database fence. The maintained full
  browser suite is intentionally separate: Chromium runs on pull requests to and
  pushes of `feature/portfolio-mvp-release`; the manual Portfolio Release Gate
  runs both Chromium and WebKit after the same frozen install and root verify.
- `Implemented`: production Compose fixes `MEDIA_STORAGE_PROVIDER=s3`, forwards
  all five required S3 settings and keeps SMTP credentials optional for
  `SMTP_AUTH_MODE=none`. `pnpm ops:media-preflight` only creates, checksums and
  deletes one uniquely named object beneath its configured isolated prefix.
  `pnpm ops:staging-smoke` performs read-only API readiness/public-list and SPA
  deep-link checks from explicit staging URLs.
- `Implemented`: executable portfolio runtime is Health, Auth, Analytics,
  Products, OTP, Password Reset, Admin, Images, Sellers and Portfolio (with
  core infrastructure and Categories). Listing, Bid, Order, lifecycle, realtime,
  discovery and activity modules are not imported by `AppModule`; their Prisma
  schema is retained as historical data, never restored as a runtime claim.
- `Deferred`: successful external S3 preflight, staging smoke, backup restore
  drill and the manual WebKit gate require provisioned deployment credentials and
  environment URLs; they are release operations, not source-only evidence.

## 2026-09-24 — Author Cabinet

- `Implemented` (mobile web): `/cabinet` is the management home for approved
  and suspended Authors. It uses the existing owner profile query for access,
  redirects applicants to `/profile`, and links to profile editing, public
  profile, Work creation and owner Work editing.
- `Implemented` (API/contracts): the paginated owner-scoped cabinet projection
  returns every owner Work state, parent visibility, editing-revision status,
  current moderation reason and an owner-visible editing-revision title/gallery
  without calling the full Work detail once per card. It orders and paginates by
  the effective latest parent-or-editing-revision timestamp. Drafts, review
  states and archived Works remain private; approved Works remain the sole
  public state. Authors can hide an approved Work and restore an archived Work
  through the existing guarded visibility endpoints.
- `Deferred`: buyer cabinet, commerce and final cabinet-specific visual polish.

## 2026-09-23 — Auth session recovery and redirects

- `Implemented` (mobile web): `AuthProvider` derives the current user from one
  React Query `['user', 'me']` record. Login and registration write their
  returned user to that record without a second `/me` request; logout clears it
  even if the server call fails. Logout and structured 401 recovery preserve
  that active query entry, cancel its in-flight request, and set its data to
  `null` while clearing other user/seller/admin data. A 403 or an
  infrastructure failure leaves a valid session intact, and unauthorized
  requests do not retry.
- `Implemented` (contracts/API): `POST /api/auth/rules/accept` has one
  `{ user }` response contract across controller, contracts and API client;
  the obsolete `{ ok: true }` shape is rejected. Protected routes preserve a
  validated internal pathname and query in `redirectTo`; external, data,
  JavaScript and auth-route targets resolve to `/`.
- Coverage: `unauthorized-session-recovery.spec.ts`, `query-client.spec.ts`,
  `auth-redirect.spec.ts`, contracts and API-client response tests, and
  `auth-transport.integration.spec.ts`.

## 2026-09-23 — Mobile Expo production build

- `Implemented` (mobile web): Expo export uses the plain Expo Metro and Babel
  configuration. The unused NativeWind/Tailwind integration
  (`nativewind`, `react-native-css-interop`, Tailwind config and declarations)
  was removed after a full mobile-source consumer inventory found no NativeWind
  runtime or utility-class consumers. `global.css` remains imported by the root
  layout and retains focus, reduced-motion, glass, hover/active and font CSS.
  `pnpm --filter @bidplace/mobile build` completes its web bundle without the
  previous `react-native-css-interop` `parseAspectRatio` crash.
- `Unchanged`: Work editor, product behavior, React Native style props and all
  visual values.

## 2026-09-22 — Work editor persistence and revision lifecycle

- `Implemented` (mobile web): the Work editor has one React Hook Form model
  hydrated from the owner React Query detail. Ordinary refetch does not reset
  dirty input. Step changes, explicit close, in-app navigation, browser Back
  and submit persist current form values; browser unload warns while values are
  dirty. Submit is an
  ordered update → submit operation and does not continue after a failed save.
  Reopening `/products/:id` restores the saved draft. The creation flow is
  URL-owned and consists of Work details, gallery, one optional plain-text story,
  and review.
- `Implemented` (API/contracts): owner detail exposes editing revision metadata
  and projects its fields/gallery while preserving the public Product status.
  An approved/archived Work forks an editable revision on the first field save;
  every editable field save mirrors the persisted author values to the active
  `ProductRevision`, which is the submit/moderation payload. Owner detail also
  exposes the editing revision `updatedAt`; clean forms hydrate on that token
  and dirty forms retain local input. Later field and image writes are limited
  to editable revision statuses and remain locked during moderation or an
  active Listing. Revision gallery order no longer mutates the published gallery.
- `Implemented` (MVP boundary): editor writes only category, title, technique,
  materials, dimensions, year, uniqueness and optional story. Packaging,
  delivery, condition, provenance, city, weight and repeated process blocks are
  absent from this UI; legacy persistence/contracts remain available outside
  the portfolio editor.
- Coverage: `product-draft-form.spec.ts`, `product-draft-state.spec.ts`,
  `product-draft-wizard.spec.ts`, `products.service.spec.ts`,
  `images.service.spec.ts`, `sellers.service.spec.ts`, contracts tests, and
  `e2e/product-creation-wizard.spec.ts` for save-before-submit and close/reopen;
  `product-write-atomicity.integration.spec.ts` and
  `rejected-product-recovery.integration.spec.ts` cover canonical revision
  persistence through review/publication when PostgreSQL is available.
- `Unchanged`: cabinet/list entry points are outside this batch; public Work,
  moderation transitions, Listing locks, commerce persistence, and canonical
  Pen/Figma sources are unchanged.

## 2026-09-18 — Global Back flicker

- `Implemented` (mobile web): Back no longer flashes the outgoing public
  page. Installed `expo-router@57.0.4` web `NativeStackView` has no public
  hide API, so `patches/expo-router@57.0.4.patch` keeps inactive screens
  laid out (`display: flex`, `opacity: 0`, `pointerEvents: none`) and
  sets `inert` on the web Screen boundary. `global.css` does not override
  navigator internals. Search overlay on web paints in the same commit via
  a body portal (`search-overlay-surface.web.tsx`); outside click is owned
  only by `useDismissibleOverlay` (visual-only `OverlayDimmer`). Works
  catalog shows history-first `works-back` iff `router.canGoBack()`;
  Author Search row is a flex `[avatar][handle+description]` row. Coverage:
  `e2e/back-navigation-lifecycle.spec.ts` (flicker, inert, Tab isolation),
  `e2e/search-overlay.spec.ts` (dimmer one-step close, Escape),
  `works-catalog-back.spec.ts`, `author-search-row-style.spec.ts`.
- `Unchanged`: `navigateBack` history-first contract, Search URL session
  (`overlay`/`oq`/`otab`), FloatingDock geometry, no scenario flags
  (`fromSearch` / `cameFromAuthor`). No Expo/React Navigation major bump.

## 2026-09-18 — Search overlay

- `Partial` (mobile web): Figma Search is a fullscreen overlay over the
  current public context. `SearchOverlayProvider` owns URL/history session
  state (`overlay=search`, `oq`, `otab`); one `SearchOverlayHost` in the root
  layout renders it. Dock Search `push`es one overlay entry on the current
  route and does not `router.push('/search')`. Query/tab updates `replace`
  that entry. Result links push Author/Work/filtered Works; Back restores
  the Search tab and query. X/Escape/`navigateBack` return to the underlying
  route; dedicated `/search?q=` close falls back to Home. Live input (300ms
  debounce, trim for request only)
  queries the active tab: Categories via `GET /api/categories` plus client
  name/slug filter; Authors `usePortfolioAuthors` `sort=added`; Works
  `usePortfolioWorks` `sort=newest`. Empty query lists public data. Category
  tiles are a truthful no-media placeholder; Category has no image field and
  seed still has one category. Compact AuthorSearchRow and 2-column
  `WorkCoverCardGrid`. Domain empty copy is «Категории/Авторы/Работы не
  найдены». Loading and infrastructure error stay inline
  (`presentation="inline"`). Overlay pagination is first-page only
  (works 12 / authors 8). Search field/close use canvas + `border` 0.5px
  (Figma `439:4789`). Coverage: `search-overlay-route.spec.ts`,
  `search-overlay-header-style.spec.ts`, `navigate-back.spec.ts`,
  `e2e/search-overlay.spec.ts` (history restore, `/search`, hover).
- `Unchanged`: Nest/api-client contracts, category seed/taxonomy, catalog
  FilterSheet URL apply/reset, dock geometry/glass, branded page
  loading/error motion.

## 2026-09-18 — Page loading → error motion lifecycle

- `Implemented` (mobile web): `InfrastructurePageStatus` is the shared page
  composition for blocking fetch. One `AnimatedBidplaceLogo` instance
  (`motion` `static | intro | loading | error | glance`) survives
  pending → error: bounce stays until `animationiteration`, then error blink.
  Bounce 900ms / 16px / squash 1.02×0.97 / rest 80–100%. Blink 520ms on the
  eyes group, no delay. Success unmounts immediately. Fetch derivation treats
  existing `data` as ready, including background refetch and a later failed
  refetch. Reduced motion skips bounce/blink. Glance is not dock-wired.
  Screens: Home, Work, Creator, ProtectedRoute, admin analytics/moderation,
  seller profile, draft. Inline: Search, catalogs, seller works tab,
  achievements. Coverage: `infrastructure-error-state.spec.ts`,
  `public-work-page-state.spec.ts`.
- `Unchanged`: accepted error proportions, Nest/api-client/mobile error
  policy, FloatingDock, no interval/rAF/physics.

## 2026-09-18 — Infrastructure error proportions

- `Implemented` (mobile web): `InfrastructurePageStatus` page cluster is a
  104px `AnimatedBidplaceLogo`, `workTitle` canonical copy (max 300px),
  `space.x8` gap, and `SecondaryButton` `size="large"` `width="full"` with
  `space.x5` horizontal padding. Dock clearance stays `size.dockReserve`.
  Inline keeps copy + regular outline Retry, now also `workTitle`. Motion and
  error policy are unchanged. Coverage: `infrastructure-error-state.spec.ts`.
- `Unchanged`: bounce/blink CSS, refetch ownership, FloatingDock, outline
  variant, canonical sentence.

## 2026-09-18 — Branded page loading → error motion

- `Implemented` (mobile web): blocking page fetch uses
  `InfrastructurePageStatus` with one `AnimatedBidplaceLogo` at
  `BIDPLACE_PAGE_LOGO_SIZE` (104). Semantic motion is
  `static | intro | loading | error`. Loading is the mark only (CSS
  `bidplace-logo-bounce`, 900ms, 16px lift, squash 1.02/0.97). Success
  unmounts immediately. Pending → error pauses the bounce on
  `animationiteration`, then a 520ms double blink on the
  eyes group, then canonical
  «Проверьте соединение и попробуйте ещё раз.» plus outline «Повторить».
  Retry uses existing `refetch` / `refreshSession` (ProtectedRoute keeps a
  local `refreshing` flag). Reduced motion: static mark, no bounce/blink.
  Native: static mark. Screens: Home, Work, Creator, ProtectedRoute, admin
  analytics/moderation, seller profile, product draft. Inline Search,
  catalogs, seller works tab, achievements, and `PageState` compact loaders
  are unchanged. Error architecture (`src/errors/`, QueryCache logging,
  no SessionAlert) is unchanged. Coverage:
  `infrastructure-error-state.spec.ts`, `public-work-page-state.spec.ts`,
  `e2e/figma-error-state.spec.ts`.
- `Unchanged`: Nest filter/mapper, api-client errors, canonical copy,
  `presentation="inline"`, no interval/rAF/physics, no LogBox suppression.

## 2026-09-17 — Infrastructure error visual integration

- `Implemented` (mobile web): `InfrastructureErrorState` lives in
  `apps/mobile/src/components/shared/` with `presentation="page"` (default) and
  `presentation="inline"`. Page mode is an `AppShell` flex child:
  `AnimatedBidplaceLogo` `motion="intro"` `size={112}`,
  `INFRASTRUCTURE_ERROR_COPY` with normal wrapping, full-width outline retry
  via `SecondaryButton` / `FigmaButton variant="outline"`. Home infrastructure
  failure early-returns and does not render `BrandLogo` or Home scroll chrome.
  Inline mode: copy + outline retry only, no logo, no dock reserve; used in
  Search (field remains), works/authors catalogs, `AuthorApplicationAchievements`,
  and seller works tab. Processed infrastructure failures log through
  `console.info` in `logInfrastructureError` so Expo LogBox does not overlay
  the canonical UI; `console.error` stays for real programming errors. Logo
  animation is finite CSS on web; native falls back to static mark. Reduced
  motion keeps static logo. Coverage: `infrastructure-error-state.spec.ts`,
  `error-policy.spec.ts`, `figma-error-state.spec.ts`.
- `Unchanged`: error policy/copy in `apps/mobile/src/errors/` (one canonical
  sentence, no copy formatter), retry ownership in features, no session-alert
  coordination, no timers/polling/rAF.

## 2026-09-17 — Infrastructure error ownership cleanup

- `Implemented`: public pages no longer coordinate `showSessionAlert`. Public
  `AppShell` has no session banner. If a public page loaded and `/api/auth/me`
  failed as infrastructure, content stays usable, the failure is logged, and
  no SessionAlert is shown. Auth state is unchanged: 401/403 → anonymous,
  network/5xx → `status='error'`. `ProtectedRoute` owns blocking session
  failure with `InfrastructureErrorState` and `auth.refreshSession()`.
  Feature screens pass only `onRetry`. Search dual query failure is one
  visual error. Mobile classification trusts api-client kinds (no extra
  `INTERNAL_ERROR` branch). `ApiClientError.code` is
  `ApiErrorCodeValue | null`. QueryCache/MutationCache still log query
  events; AuthProvider logs `/me` separately. Coverage:
  `apps/mobile/src/errors/error-policy.spec.ts`,
  `packages/api-client/test/errors.test.ts`,
  `e2e/figma-error-state.spec.ts`. This run: api-client 6, mobile unit 295,
  typecheck/lint for api-client and mobile. Full Playwright webServer was not
  started (Prisma migrate reset is blocked in this environment). Local Chromium
  against Expo `:8090` confirmed: dual Home+session → one alert/one Retry;
  session-only Home → usable, no infrastructure UI; protected `/profile` → one
  canonical state; Search dual abort → one canonical state. Logo-motion is
  not wired into this state.
- `Partial` / future: form `getUserFacingErrorMessage` still renders backend
  `message` for public kinds; next batch can add logo + layout + button to
  `InfrastructureErrorState`.
- `Unchanged`: Nest filter/mapper/logger, contracts `requestId`, api-client
  `errors/` split, mobile `src/errors/`, canonical copy, QueryClient
  `retry: 1`, `SessionAlert` / `PageState` primitives, no polling/rAF.

## 2026-09-17 — Infrastructure error architecture

- `Implemented`: one infrastructure error path without a second Nest filter.
  Backend: existing `apps/api/src/core/errors/ApiExceptionFilter` plus
  `error-response-mapper.ts` / `error-logger.ts`. Public contract
  `apiErrorResponseSchema` gained optional `requestId`; `message` stays
  diagnostic. Transport: `packages/api-client/src/errors/` (`ApiClientError`
  keeps `cause` and `requestId`). Mobile policy: `apps/mobile/src/errors/`
  maps infrastructure kinds to «Проверьте соединение и попробуйте ещё раз.»
  Presentation ownership was cleaned up in the 2026-09-17 cleanup section
  above (`InfrastructureErrorState`, no public SessionAlert).
  TanStack Query stays `retry: 1` (public Work/Author still
  `retryTransientPublicQuery`). Coverage: `api-exception.filter.spec.ts`,
  contracts `apiErrorResponseSchema`, `packages/api-client/test/errors.test.ts`,
  `apps/mobile/src/errors/error-policy.spec.ts`, `e2e/figma-error-state.spec.ts`.
  This run: contracts 24, api-client 5, api unit 275, mobile unit 294,
  typecheck/lint for api and mobile. Full Playwright webServer was not
  started (Prisma migrate reset is blocked in this environment). Local
  Chromium against Expo `:8090` confirmed dual Home+session failure shows
  one `PageState` alert and one «Повторить».
- `Partial` / future migration: form `getUserFacingErrorMessage` still renders
  backend `message` for validation, unauthorized, forbidden, not-found,
  conflict and rate-limited kinds. Domain/not-found PageState titles stay
  screen-local.
- `Unchanged`: `SessionAlert` / `PageState` primitives kept; QueryClient
  does not add a second retry layer; no polling/rAF/interval retry.

## 2026-09-17 — Work/Creator compact uses navigation glass

- `Partial` (mobile web visual experiment): compact Work and Creator chrome
  reuse `FigmaGlassSurface preset="navigation"` as a full-width square fill
  (`borderRadius: 0`, flush to the page). Work still activates
  `StickyDockSurface` with `surfaceActive = !entry.isIntersecting`; Creator
  still parks and fades the same host on compact. Docked tabs use
  `FigmaTabs surface="transparent"` so they do not paint a second canvas.
  FloatingDock stays the capsule geometry with the same material.
  Coverage: `StickyDockSurface.web.tsx`, `WorkHeader.web.tsx`,
  `CreatorHeader.web.tsx`, `FigmaTabs.web.tsx`,
  `e2e/work-header-motion.spec.ts`, `e2e/author-header-motion.spec.ts`.
- `Unchanged`: Work persistent Back/Share, CSS sticky, sentinel, observer,
  tab reveal, Creator hysteresis/park, native headers.

## 2026-09-17 — Local-only Bidplace logo intro experiment

- `Partial` (lab only): mobile-web `/dev/logo-motion` plays one finite
  CSS intro on a single SVG copied from `bidplace-logo-master.svg`:
  fall/bounce/settle on a transform wrapper (`size={112}` on the lab
  page; component default stays 168), then a pupil-group glance.
  Bounce uses `%` of the wrapper, not px. Body and white eyes stay
  static. Replay remounts. Production `NODE_ENV` redirects the route
  to `/`. Not wired to Home, AppShell, FloatingDock, auth, or the
  loader. Native fallback is static.

## 2026-09-17 — Work/Creator in-session tab switches reveal panel start

- `Implemented`: Web Work and Creator content-tab switches open the new
  panel from its own start under the current header, without a page-top
  jump. Direct Work `?tab=` loads stay at page top. Coverage:
  `e2e/tab-switch-reveal.spec.ts`.
- `Unchanged`: StickyDock, Creator park, native Work/Creator, wizards,
  auction ProductTabs.

## 2026-09-17 — Share sheet bottom-sheet transition

- `Implemented`: Share sheet now opens and closes with the accepted
  bottom-sheet transition on Work and Creator. Coverage:
  `e2e/share-sheet-motion.spec.ts`.
- `Unchanged`: sheet geometry, QR/copy actions, StickyDock, Creator park.

## 2026-09-17 — StickyDock: shared metrics, persistent Work overlay, Creator park

- `Implemented`: Creator and Work share `stickyDock.*` (`actionHeight` 80,
  `controlTop` 12, `controlSize` 48, `controlInset` 20, `tabsHeight` 26,
  `fullHeight` 106). `StickyDockSurface` is presentation-only (canvas,
  opacity, pointer-events, web opacity fade). Each screen host owns
  `stickyDock.fullHeight` placement.
- `Implemented`: Web Work keeps one persistent Back/Share pair in
  `StickyDockActionRow` (CSS sticky overlay, no remount). Tabs are sticky
  at `top: stickyDock.actionHeight`. The dock canvas is
  `surfaceActive = !entry.isIntersecting` with observer root
  `product-scroll-view`, `rootMargin: -${stickyDock.actionHeight}px 0px 0px 0px`,
  `threshold: 0`. Coverage: `WorkHeader.web.tsx`, `StickyDockActionRow.tsx`,
  `StickyDockSurface.web.tsx`, `e2e/work-header-motion.spec.ts`.
- `Implemented`: Web Creator still parks with measured `heroHeight` and
  `LinearTransition` on one `CreatorIdentity`. Compact paint order is
  surface, identity, tabs. Surface activation follows compact.
  Coverage: `CreatorHeader.web.tsx`, `CreatorIdentity.tsx`,
  `e2e/author-header-motion.spec.ts`.
- `Unchanged`: expanded Work rest (media 520), native headers, Creator
  hysteresis, Figma compact tokens 186/44.

## 2026-09-16 — Restore expanded Work vertical composition

- `Implemented`: Expanded Work rest restored `sectionGap` 20 between gallery
  dots and identity, and `space.x10` 40 between chips and tabs. The artwork
  viewport remains 520. Coverage: `WorkHeader.web.tsx`, `WorkHeader.tsx`,
  `e2e/work-header-motion.spec.ts`.
- `Unchanged`: Creator, gallery crop, Work data.

## 2026-09-16 — Creator sticky handoff parks with measured heroHeight

- `Implemented`: Web Creator header has two product states, `expanded` and
  `compact`. Compact starts at the measured park
  `scrollTop >= heroHeight - compactStack` and returns at `park - 20`.
  Sticky positioning is CSS. One `CreatorIdentity` stays mounted; compact
  restyles the same avatar, handle and actions nodes. Reanimated
  `LinearTransition` interpolates that layout change. Tabs are a
  sibling of identity and are not animated. Coverage:
  `CreatorHeader.web.tsx`, `CreatorIdentity.tsx`,
  `creator-header-motion.ts`, `e2e/author-header-motion.spec.ts`.
- `Unchanged`: expanded Creator Figma rest layout, native headers,
  Figma compact tokens 186/44.

## 2026-09-15 — onGlass chips use a 1px outside gradient ring

- `Implemented`: Web `FigmaChip` `onGlass` paints `#FFFFFF` @ 0.8 with a
  1px outside `#DEDEDE`→`#F3F3F3` ring (not a filled plate behind the
  fill). Work chips `745:21232` are pad 6/12; Creator chips `621:19490`
  stay pad 6/16. Coverage: `FigmaChip.web.tsx`, `figma-chip-style.ts`,
  `figma-chip-style.spec.ts`.
- `Unchanged`: Home, quiet buttons, catalog/cover chips, gallery chrome.

## 2026-09-15 — Catalog segment, intro ink, Work back chrome

- `Implemented`: `/works` hides catalog-segment tabs (`874:5421` /
  `526:13314`). Screen order is title → intro → Filter/Sort → cards.
  Coverage: `product-list-screen.tsx`, `product-list-catalog.spec.ts`.
- `Implemented`: `/authors` and `/works` intros stay on approved MVP copy
  with `bodySmall` default ink `#2A2A2A` 14/20/400/−1%. `textSecondary`
  `#8A8A8A` is unchanged. Coverage: `public-authors-screen.tsx`,
  `catalog-intro-style.spec.ts`, `visual-token.spec.ts`.
- `Implemented`: Work gallery inactive dots are `color.border` `#DEDEDE`.
  Work hero adds Frame 76 48×48 Back, keeps Share, hides Like, and does
  not insert a web status-bar gap. Coverage: `WorkGallery.tsx`,
  `work-gallery-chrome.ts`, `product-screen.tsx`, `work-page-back.ts`,
  `work-page-back.spec.ts`, `work-gallery-chrome.spec.ts`.
- `Unchanged`: Home, creator motion/header, dock/glass blur, Work History.

## 2026-09-15 — Author page About closer to Figma `621:19475`

- `Implemented`: Public Creator About atmosphere, tabs, chips, city line,
  and achievement rail/dates follow `621:19475` + Frame 219 `742:20510`.
  Atmosphere stays 485 at x −47 in the 390 column. Coverage:
  `CreatorHero.tsx`, `AuthorAtmosphere.tsx`, `AuthorAbout.tsx`,
  `FigmaTabs.web.tsx`, `FigmaChip.web.tsx`, `author-achievement-rail.ts`.
- `Unchanged`: Home, dock, Works tab, public Archive remains hidden.

## 2026-09-15 — Shared light quiet button is flat `#EFEFEF`

- `Implemented`: `FigmaButton` `quiet` uses `quietFill` `#EFEFEF` as the
  control background. Gradient `#FFFFFF`→`#999999` @ 0.16 is a 1px
  outside stroke behind the fill (`439:4419` `renderBounds` −1), not an
  inset overlay. Coverage: `FigmaButton.tsx`, `figma-button-style.ts`,
  `figma-button-style.spec.ts`. Opening and New works keep `quiet`+`compact`.
- `Unchanged`: Home layout, Opening/New works/Authors fan composition,
  authors dark CTA, card frost/gradients.

## 2026-09-15 — Home authors fan uses Frame 47 rotation signs

- `Implemented`: Rear-right rotates `+1deg`, rear-left `-1deg`, origin
  `0px 0px`. x/y stay Frame 47. Coverage: `home-author-fan.ts`,
  `home-author-fan.spec.ts`.
- `Unchanged`: photos, Opening, New works, `/authors`.

## 2026-09-15 — Home authors fan rotates from Frame 47 top-left

- `Implemented`: Rear fan cards use `transform-origin: 0px 0px` so Frame 47
  x/y stay as measured (`2.45` / `55.6` / `22` / `17.34` / `22.72`). Front
  shadow remains `0 6px 20px rgba(58, 58, 58, 0.40)` on the rounded shell.
  Coverage: `home-author-fan.ts`, `home-new-authors.tsx`,
  `home-author-fan.spec.ts`.
- `Unchanged`: photos, Opening, New works, `/authors`, CTA fill, CoverFrost.

## 2026-09-15 — Home authors fan uses Frame 47 radius and shadow shell

- `Implemented`: Home fan `AuthorCoverCard` keeps catalog radius 28 unless
  `frameRadius` is passed. Fan cards use 24, a rounded front shadow shell,
  and `interaction="static"` so hover does not change geometry. Coverage:
  `cover-card-style.ts`, `AuthorCoverCard.tsx`, `home-new-authors.tsx`,
  `cover-card-style.spec.ts`.
- `Unchanged`: Opening, New works, `/authors` grid, photo mapping.

## 2026-09-15 — Home «Новые авторы» uses Frame 47 geometry

- `Implemented`: Home «Новые авторы» is a 366 fan from Figma Frame 47
  (`436:1320`) filled with real `Home.newAuthors` `AuthorCoverCard` photos
  (`profilePhotoUrl`). CTA «Смотреть все» → `/authors`. Coverage:
  `home-new-authors.tsx`, `home-author-fan.ts`, `home-author-fan.spec.ts`,
  `home-figma.spec.ts`.
- `Unchanged`: Opening, New works scroller, `/authors` `CreatorCardGrid`,
  `05-MVP-RFC.md`, canonical Pen.

## 2026-09-15 — Home «Новые работы» is a horizontal catalog

- `Implemented`: Home «Новые работы» is a flow section after Opening:
  `sectionTitle` + hug quiet «Смотреть все» (`/works`) and a horizontal
  `WorkCoverCard` scroller from `Home.newWorks` (`listWorks` newest, limit 6).
  No price/timer/sale chrome. Coverage: `home-new-works.tsx`, `home-screen.tsx`,
  `home-figma.spec.ts` card metrics 264×352.
- `Implemented` (demo seed): `aliceGlass1` `publishedAt` is 2026-09-14 so the
  newest-six query includes a `@vex`-owned work without moving Dali off
  `pixelp`. Coverage: `seed.js`, `seed-contract.integration.spec.ts`.
- `Unchanged`: Opening composition, authors section, `/works` grid,
  `05-MVP-RFC.md`, canonical Pen.

## 2026-09-15 — Phone gallery arrows, achievement photos, History media

- `Implemented`: `WorkGallery` still owns prev/next controls, but they render
  only when gallery layout width is greater than `layout.phoneWidth` (390).
  Phone-width Dali keeps swipe paging, dots and share; arrows are absent.
  Coverage: `work-gallery-arrows.ts`, `work-gallery-arrows.spec.ts`.
- `Implemented`: public Work `История` still authors as one plain-text `story`.
  The tab now interleaves non-cover published `ProductImage` rows between
  paragraphs (`workHistoryBlocks`). Not a process-builder CMS
  (`ProductCreationStep` stays owner-only / post-MVP, `05-MVP-RFC` §15).
  Dali History uses existing `dali-estate-detail.png`. Coverage:
  `work-content.ts`, `work-content.spec.ts`, `product-screen.tsx`.
- `Implemented`: vex and pixelp achievement cards use existing
  `SellerProfileRevisionAchievement` image fields (`objectKey` + bytes).
  Photos are distinct same-event Figma fills / same-work detail crops, not
  product covers and not one shared raster. Coverage: `seed.js`,
  `seed-contract.integration.spec.ts`.
- `Partial`: Figma has no isolated exhibition-install photographs. Vex cards
  use Alice / Between **detail** crops; pixelp uses History Spectre fill
  `437:3989`, not Opening Dali cover. A second Dali History photo is absent.
- Unchanged: Opening curator=`vex`, work=`daliEstate1`, owner=`pixelp`;
  production-quality copy (`DEC-092`); no new visual regression tests.

## 2026-09-15 — Production-quality local demo copy

- `Implemented`: local seed copy is production-quality. User-facing biography,
  practice, story, technique, materials and achievements no longer contain
  `Demo copy`, `invented`, `not in Figma` or other internal notes (`DEC-092`).
  Opening remains curator=`vex`, work=`daliEstate1`, owner=`pixelp`.
- `Implemented`: `@vex` has two published works (`aliceGlass1` «Алиса в
  Зазеркалье», `sleepForm01` «Между сном и формой») on unused Figma fills.
  Ownership is demo and recorded in seed comments; Dali stays on `pixelp`.
- `Implemented`: `@pixelp` is `Художник`, Минск, with a real-looking studio
  portrait, biography/practice, and Dali in Works. Gallery extras are same-work
  3:4 detail crops, not another work’s photo.
- `Partial`: public Work `История` is still one authored plain-text field.
  The public tab may now interleave same-work gallery extras between
  paragraphs (`DEC-093`); that is rendering, not the post-MVP process builder.
- Coverage: `packages/database/prisma/seed.js`,
  `seed-contract.integration.spec.ts`.

## 2026-09-14 — Figma-aligned local demo seed

- `Implemented`: `CuratorSelection.curatorSellerProfileId` FK → `SellerProfile`
  on the unreleased `curator_selections` CREATE
  (`20260909120000_portfolio_media_socials_curator`). Admin PUT is
  `{ publicId, curatorSlug, note }`. Home DTO is
  `{ curator, work: { ...work, author }, note }` with no sibling `author`.
  Coverage: `portfolio.service.spec.ts`, `curator-selection.integration.spec.ts`,
  `packages/contracts/test/contracts.test.ts`.
- `Implemented`: additive `SellerProfile.biography` /
  `SellerProfileRevision.biography` (`20260914200000_add_seller_biography`).
  Public author DTO includes `biography`. Author About uses `biography` when
  present, else `shortDescription`. Opening keeps `shortDescription`.
- `Implemented`: local/test seed is the Figma Home catalog, not Anna/Unsplash.
  Public authors: `vex`, `quantumparadox`, `havoc`, `bala_klava` first in
  `Home.newAuthors` (`createdAt` DESC); `pixelp` is a public profile and Dali
  owner but older so not in the leading cards. Works: `daliEstate1`,
  `caricature1`, `yellowSapph`, `colorCalib1`, `rainbowMask`, `blossomVase`,
  `memoryWork1`. No Listing/Bid/Order rows. Opening curator=`vex`,
  work=`daliEstate1` / `pixelp`, Figma `note`. `seller@bidplace.test` is vex.
  Vex product rows and public copy quality are updated in the 2026-09-15
  demo-copy entry. Coverage: `seed-contract.integration.spec.ts`,
  `packages/database/prisma/seed.js`.
- `Implemented` (mobile web binding): `home-opening.tsx` left column / profile
  button → `selection.curator`; `WorkCoverCard` → `selection.work.author.slug`.
- `Partial` / gaps: Playwright visual golden remains a later typography pass.
  Isolated exhibition-install photos are still missing in Figma.
- `Unchanged`: `05-MVP-RFC.md` Opening as author or work; canonical Pen;
  commerce Prisma leftovers. `DEC-091` revises `DEC-090` seed-identity clause.

## 2026-09-14 — Home Opening curator note and Figma visual fixture

- `Implemented`: `CuratorSelection.note` (`TEXT NULL`) on the unreleased
  `curator_selections` CREATE TABLE (Prisma +
  `20260909120000_portfolio_media_socials_curator`, not a new migration).
  `GET /api/portfolio/home` `curatorSelection` includes `note`; catalog work
  items do not. Admin `PUT /api/admin/curator-selection` body is
  `{ publicId, note }` with `note` required on write (`string | null`).
  Seed identity in this checkpoint (Anna / `seedLive002`, `note` null) is
  superseded by the Figma-aligned local demo seed and `DEC-091`.
  Coverage:
  `packages/contracts/test/contracts.test.ts`,
  `portfolio.service.spec.ts` (null, trimmed note, blank → null),
  `curator-selection.integration.spec.ts`,
  `seed-contract.integration.spec.ts`.
- `Implemented` (mobile web): Home Opening uses Figma first-fold roles
  (`authorRowHandle`, `authorRowBio`/`subtle`, `editorialTitle`, `editorial`,
  quiet compact `FigmaButton`). Empty/null `note` hides «Выбор куратора» and
  the paragraph. Work overlay and «Активные торги» stay out of this slice.
  Coverage: `home-sections.spec.ts`, `figma-button-style.spec.ts`,
  `visual-token.spec.ts`, `app-text-role-style.spec.ts`, `home-figma.spec.ts`.
- `Implemented` (e2e-only): Playwright mocks production `HomeScreen` with
  `e2e/visual` `@vex` fixtures and compares the clipped `#home-opening-author`
  column to the 390×860 first-fold golden. Isolated
  `playwright.stabilization.config.ts` Chromium+WebKit passed
  (`e2e/visual/home-opening-figma.spec.ts`). Actuals go to gitignored
  `apps/mobile/test-results/`. Cover raster is the Figma card fill at 3:4,
  not the clipped first-fold `renderBounds` PNG. Playwright-only `@vex` /
  Anna seed identity is superseded by `DEC-091`.
- `Unchanged`: `WorkCoverCard` frost/price/timer, admin note editor, global
  `outline`, canonical Pen. `DEC-090` recorded.

## 2026-09-14 — Share sheet docks to the bottom on mobile web

- `Implemented` (mobile web): `AppDialog` `presentation="sheet"` now sets an
  explicit column flex on the portal host so `justifyContent: 'flex-end'`
  docks ShareSheet to the bottom. The web host had been `display:flex`
  without an axis, so CSS `row` stretched the sheet to the top. Native
  `AppDialogFrame` gets the same column style. Centered
  `presentation="dialog"` is unchanged. No API, auth, token, ShareSheet
  contract, or FilterSheet rewrite. Evidence:
  `app-dialog-host-style.ts`, `app-dialog-host-style.spec.ts`,
  `app-dialog-layer.web.tsx`, `AppDialog.tsx`.
- `Verified` at 390 on the live release stand: computed
  `flex-direction: column` and `justify-content: flex-end` on
  `#app-dialog-host`, and `#app-dialog-content` bottom equals the 844px
  viewport. Playwright in `figma-stabilization.spec.ts` now asserts the
  same geometry; the isolated e2e webServer was not rerun here because
  `prepare.mjs` wants a disposable `bidplace_e2e` `migrate reset`.
- Mobile vitest 251/251; `tsc --noEmit` passed. Canonical Pen was not
  touched.

## 2026-09-14 — PR C: commerce application runtime removed

- `Implemented`: Nest Listings, Bids, Orders, Lifecycle, Realtime, Activity,
  Discovery, `core/commerce` and `core/auction` are off the default API boot
  graph. `AppModule` has no `ScheduleModule`. `bootstrap.ts` has no Socket.IO
  adapter. `COMMERCE_ENABLED` is gone from server env. API package no longer
  depends on `@nestjs/platform-socket.io`, `@nestjs/schedule`,
  `@nestjs/websockets` or `socket.io`.
- `Implemented`: public `GET /api/products` and `GET /api/sellers` catalog
  routes are gone. Public catalog is portfolio-only:
  `GET /api/works`, `GET /api/authors`, `GET /api/portfolio/*`.
  Owner Product create/update/hide/unhide and seller profile HTTP remain.
  Hide still fails closed on leftover `SCHEDULED`/`LIVE` Listing rows.
  Admin listing/order/recovery HTTP is gone. Admin moderation keeps
  `hasBlockingListing`. Admin analytics overview no longer queries
  Listing/Bid/Order marketplace metrics.
- `Implemented`: Listing/Bid/Order/Discovery/Activity/event contracts and
  api-client surfaces without HTTP are removed. Shared leftover enums
  (`LISTING_STATUSES`, `ORDER_STATUSES`) and listing/bid error codes remain.
  Ingest event names `listing_viewed` / `bid_cta_clicked` / `bid_rejected`
  stay as leftover analytics taxonomy.
- `Implemented`: mobile admin no longer has Orders or Recovery tabs.
  `AdminRecoveryPanel` is gone. Admin analytics UI matches the portfolio
  overview contract.
- `Unchanged`: Prisma Listing/Bid/Order models, applied migrations and seed
  auction fixtures. `scripts/ops/commerce-inventory.mjs` and the
  `test:ops` script remain. Archive
  `feature/commerce-runtime-archive` @ `19eb40e` is not modified.
- `Partial` vs `05-MVP-RFC.md`: the RFC still describes `DEC-084` fail-closed
  commerce runtime. `DEC-087` is the accepted physical-removal direction for
  application code. This branch does not rewrite the RFC.
- `Not claimed`: Founder Accepted, launch-ready, Prisma leftover deletion,
  seed rewrite, or cloud deploy.
- Coverage: contracts `packages/contracts/test/contracts.test.ts`; API unit
  `admin-analytics.service.spec.ts`, `products.service.spec.ts`,
  `sellers.service.spec.ts`; HTTP/integration leftovers
  `portfolio-route-surface.integration.spec.ts`,
  `media-transport.integration.spec.ts`,
  `rejected-product-recovery.integration.spec.ts`,
  `seller-permissions.integration.spec.ts`,
  `author-hide-listing.integration.spec.ts`,
  `commerce-inventory.integration.spec.ts`,
  `seed-contract.integration.spec.ts`.
- `Verified` (this branch, this run): `pnpm verify` — typecheck 7/7, lint 2/2,
  API unit 272/272, contracts 23/23, ops inventory 11/11, PostgreSQL
  integration 62/62, build 7/7. Mobile unit 248/248. Maintained Playwright
  Chromium+WebKit `retries=0`: 86/86. Expo web export wrote `apps/mobile/dist`.
  `git diff --check` clean. `artifacts/cleanup/` stays untracked.

## 2026-09-14 — Mobile-web correction

- `Implemented` (mobile web only): public AppShell originally showed an in-flow
  Yoga `SessionAlert.web.tsx`. That chrome was removed in the 2026-09-17
  ownership cleanup; `SessionAlert` remains a primitive. Home catalog stays
  available when only `/api/auth/me` fails. Protected `/profile` uses
  `InfrastructureErrorState`. Coverage: `figma-error-state.spec.ts`.
- `Implemented` (mobile web only): approved-author first mutation DELETE of a
  published achievement id forks a DRAFT via the exact created-id map, then
  POST adds to that draft. Public stays unchanged until submit → approve.
  Add/delete await query invalidation and disable further writes until refetch.
  Coverage: `author-achievement-revision.spec.ts`.
- `Implemented`: maintained Playwright `test:e2e` runs Chromium and WebKit.
  `test:e2e:stabilization` stays the 38 visual Chromium+WebKit suite.
- `Implemented` (compile-only, mobile web): CreatorHero compact fades pass CSS
  `visibility` through a web-only helper. React Native `ViewStyle` is not
  globally augmented.
- `Partial`: first-application optional achievements remain the founder decision
  in [`14-OPEN-MVP-DECISIONS.md`](14-OPEN-MVP-DECISIONS.md).
- `Unchanged`: 232×64 dock, Home/Works/Authors/Search/ShareSheet/cards/frost
  and `CreatorHeader.web` except the listed AppShell/achievement/e2e files.
  Fixed 390 mobile-web column stays expected. Commerce archive `19eb40e` is not
  modified.
- `Not claimed`: Founder Accepted, launch-ready, desktop/tablet/native.

## 2026-09-14 — Portfolio foundation correction

- `Implemented`: `ensureEditableEditingRevision` is the single seller editing-revision
  use case. `update`, `addAchievement` and `deleteAchievement` lock the
  `seller_profiles` row, then the editing revision row, inside a Read Committed
  transaction. An approved author whose editing pointer still equals the published
  revision can add or delete an achievement without a dummy profile save: the
  operation copies the published revision (photo metadata + achievements, including
  `objectKey`/`data`) into a new `DRAFT`, leaves the published page unchanged, and
  applies the write only to that draft. Delete of a published achievement id
  during that same fork uses the exact created draft id. A later delete does
  not guess a draft copy from body, date, object key or position.
  `PENDING_REVIEW` stays locked (409). Coverage:
  `ensure-editable-seller-profile-revision.spec.ts`, `sellers.service.spec.ts`,
  `author-achievement-revision.integration.spec.ts`.
- `Partial`: the first author application still creates a `PENDING_REVIEW` revision
  immediately, so optional achievements cannot be added before the first moderation.
  Design `02-USER-FLOWS-AND-SCREENS.md` §8 allows a fourth visual step and a saved
  incomplete draft; that workflow is not implemented here. Exact founder decision:
  [`14-OPEN-MVP-DECISIONS.md`](14-OPEN-MVP-DECISIONS.md).
- `Implemented` (compile-only, no UI redesign): mobile typecheck accepts the
  `global.css` side-effect import and web overlay positioning via a CSS `div` /
  platform dialog layer instead of `ViewStyle['position'] = 'fixed'`.
- `Not claimed`: Founder Accepted, launch-ready, first-application achievement
  step, desktop/tablet/native, or commerce removal.

## 2026-09-14 — Portfolio foundation preservation

- `Implemented`: author create requires non-blank `city`; `socialLink` is nullable
  when Telegram/Instagram/website is sent and is never coerced to `''`. Owner
  `GET /api/seller/profile` and `/api/author/application` return `editingRevision`
  and overlay draft public fields; the published author page stays on the approved
  revision until admin approve. Coverage: `packages/contracts/test/contracts.test.ts`,
  `seller-profile.mapper.spec.ts`, `author-application-contract.integration.spec.ts`.
- `Implemented`: profile-photo editing revision plus optional achievement image
  upload/delete/read. Public achievement bytes come only from the published
  revision; owner/admin can read draft; stranger/anonymous draft reads 404.
  MIME/size/count, rate limits and private/public Cache-Control follow the
  existing image policy. `ImageStore` keys `seller-profile-revision` and
  `seller-achievement` keep the seller-photo fallback. Coverage:
  `postgres-image-store.spec.ts`, `sellers.service.spec.ts`,
  `portfolio-published-revision.integration.spec.ts`.
- `Implemented`: `PortfolioWorkDetailResponse` is exported from `@bidplace/contracts`.
- `Implemented`: `GET /api/authors?sort=added` orders by author `created_at` with
  `id` tie-break; `sort=name` stays name/`id`. Coverage:
  `sellers-catalog.query.spec.ts`, `portfolio-filters.integration.spec.ts`.
- `Implemented`: `POST /products/:id/hide` fails closed when a `SCHEDULED` or
  `LIVE` Listing exists (no Product/Listing/audit write). ENDED/no-listing hide
  still works. Concurrent hide writes one ARCHIVED audit. Coverage:
  `products.service.spec.ts`, `author-hide-listing.integration.spec.ts`.
- `Unchanged`: Nest Listings/Bids/Orders, Prisma commerce tables,
  `COMMERCE_ENABLED`, recovery APIs and archive lineage stay on this branch.
- `Partial`: the seller application form collects required `city` and optional
  `practice`. Public catalog e2e and approved-author revision coverage live on
  `fix/mobile-web-preservation`.
- `Not claimed`: Founder Accepted, launch-ready, or commerce removal.

## 2026-09-14 — Mobile-web Figma staged on portfolio foundation

- `Implemented` (mobile-web 390 only): `apps/mobile` and `packages/design-tokens`
  now render the Figma public surfaces on top of PR A portfolio APIs
  (`api.portfolio.home|listWorks|getWork|listAuthors|getAuthor|facets`).
  Dock is the `DEC-088` 232×64 four-item capsule. Auction/listing/order/activity
  screens and `socket.io-client` are removed from mobile runtime. Public cards
  stay title + `@author`. Home opening reads server `curatorSelection`.
  Expo web export has no `socket.io-client`. This is not founder Accepted or
  launch-ready.
- `Partial`: native iOS/Android, RFC §10 create-work rewrite and launch-ready
  are out of scope for mobile web only.

## 2026-09-14 — Mobile-web preservation on corrected PR A

- `Implemented` (mobile web only): author application requires `city`; approved
  authors edit via revision + «Отправить на проверку»; optional achievement
  images render in Author About and can be uploaded/deleted by the owner;
  AdminRecoveryPanel + «Восстановление» stay while commerce runtime is loaded;
  `DestructiveButton` uses shared `danger`; `sort=added` and hide-vs-live
  listing stay from [PR A preservation](#2026-09-14--portfolio-foundation-preservation);
  dock is `navigation` with links/`aria-current` and a create button;
  `PortfolioWorkDetailResponse` is imported from `@bidplace/contracts`;
  `test:e2e` is the maintained Playwright gate and
  `test:e2e:stabilization` is the 38 visual Chromium+WebKit suite;
  `media-resilience.spec.ts` is restored without the obsolete header/login
  assertion. Protected `/profile` uses canonical infrastructure UI + «Повторить».
  Public Home does not show a session banner. Coverage:
  `seller-profile-editable.spec.ts`, `figma-button-style.spec.ts`,
  `floating-dock.spec.ts`, `author-application-publication.spec.ts`,
  `author-revision-flow.spec.ts`, `media-resilience.spec.ts`,
  `figma-error-state.spec.ts`.
- `Unchanged`: 232×64 dock, author header motion, Home `curatorSelection`,
  ShareSheet, Works/Authors/Search URL state, cover frost, FigmaTabs
  typography. Commerce archive `19eb40e` is not modified.
- `Not claimed`: Founder Accepted, launch-ready, native, or 1024/1440
  compositions. Absence of desktop/native is not a remaining defect.
- `Unchanged`: Nest commerce modules, Listing/Bid/Order contracts, Prisma
  commerce tables and `COMMERCE_ENABLED` remain from PR A until PR C.
- `Confirmed`: `DEC-088` is recorded here; `DEC-085`/`086`/`087`/`089` stay
  owned by PR A and are not duplicated.

## 2026-09-14 — Portfolio foundation staged beside commerce runtime

- `Implemented`: portfolio backend foundation on the existing commerce runtime.
  Public catalog reads for `GET /api/works`, `GET /api/works/:publicId`,
  `GET /api/authors`, `GET /api/authors/:slug` and `GET /api/portfolio/home` use
  the published `ProductRevision` projection (`ProductsService.listPortfolio` /
  `getPortfolio`, `apps/api/src/products/products-catalog.query.ts`).
  `GET /api/portfolio/facets` returns normalized public materials, cities and
  tags (`DEC-089`). Home curator selection is server-owned (`DEC-086`) via
  `PUT`/`DELETE /api/admin/curator-selection` with 401/403/409 and unpublished
  pointers resolving to `null`. Public product-image GET continues to 404 for
  draft/unpublished revision bytes. Additive Prisma migrations
  `20260909010000_add_profile_revision_media` and
  `20260909120000_portfolio_media_socials_curator` add revision photo/achievement
  bytes and `curator_selections`. Local seed keeps listings and adds one home
  curator row on `seedLive002`. New portfolio contracts (`uniqueness`,
  `sharePath`, facets) sit beside unchanged Listing/Bid/Order/discovery
  contracts and api-client methods. Coverage: API unit (`portfolio.service.spec.ts`),
  contracts facets/work isolation, integration
  `curator-selection`, `portfolio-filters`, `portfolio-published-revision`,
  `commerce-inventory`, plus existing commerce HTTP suites.
- `Partial`: mobile still consumes the current main commerce/portfolio client
  surface. Mobile migration is a separate PR B and is not in this branch
  (`apps/mobile` unchanged).
- `Planned`: commerce runtime removal (Nest modules, routes, Socket.IO/schedule
  deps, `COMMERCE_ENABLED` teardown) is PR C after PR B and a verified inventory.
  `DEC-087` remains the accepted direction; this branch does **not** remove
  commerce application code. Listing emergency, bids, orders and discovery stay
  Implemented on the current boot path.
- `Implemented` (ops, read-only): `scripts/ops/commerce-inventory.mjs` reports
  leftover listing/bid/order counts and decision ids without `--apply`. Unit:
  `scripts/ops/lib/commerce-inventory.spec.mjs`. Integration:
  `apps/api/test/integration/commerce-inventory.integration.spec.ts`.
- `Confirmed product lineage`: `DEC-085` (Figma production visual source; Pen
  historical) is recorded so `DEC-086` has a previous decision record. `DEC-087`
  and `DEC-089` are appended without rewriting the decision text. `DEC-088`
  (mobile dock) is not part of this backend foundation PR.

## 2026-09-08 — First MVP scope changed to public portfolio

- `Confirmed product`: `DEC-082`–`DEC-084` replace the first public release target
  with creator profiles and portfolio Work; commerce moves to the post-MVP backlog.
- `Partial`: `apps/api/src/core/commerce` now provides a typed
  `COMMERCE_ENABLED=false` capability gate. Listing, Bid, Order and commerce-admin
  HTTP paths return unavailable while disabled; the Listing lifecycle and realtime
  gateway no-op/disconnect; public Work discovery no longer joins `Listing`.
  Commerce persistence and explicit-enabled service code remain preserved. Mobile
  navigation hides commerce controls and legacy commerce routes render an
  unavailable state; public portfolio cards omit commerce text. API unit,
  contracts and mobile checks pass; PostgreSQL integration verification remains
  blocked locally because no database is listening on `127.0.0.1:5432`.
- `Partial`: Portfolio Work revisions are persisted in
  `ProductRevision` with additive migration
  `20260908000000_add_product_revisions`. New Works create an editing revision;
  edits to an approved Work copy it first, moderation promotes only an approved
  revision, and change requests leave the prior published projection public.
  Work media is attached to the editing revision. API typecheck, lint and 336 unit
  tests pass. PostgreSQL transition/race integration coverage remains blocked until
  a local disposable database is available.
- `Partial`: S3-compatible media storage is selected through the `ImageStore` port;
  production requires complete S3 configuration, media rows have deterministic object
  keys, and backfill/restore commands validate checksums. Unit coverage verifies S3
  commands without a live bucket. A real MinIO plus PostgreSQL migration/restore drill
  is still required before marking this operationally verified.
- `Partial`: security preflight documents factual data handling and evidence-based
  launch risks. Bearer and optional bearer guards refresh role, status and session
  version from the current account record; URL preflight reports legacy public URL
  counts without exposing or rewriting values. PostgreSQL and object-store drills,
  release-environment dependency audit and operator decisions remain required.
- `Partial`: `packages/contracts/src/portfolio.ts`, `packages/api-client/src/portfolio.ts`
  and `apps/api/src/portfolio` add strict portfolio-only Home, Work and Author
  projections. Their DTOs exclude Listing, price, bid, timer, Order and sale fields;
  Work category/material and Author tag/city filtering run on the server. Portfolio
  Author queries require a city in the database query, so incomplete legacy profiles
  are omitted rather than causing a public response failure. SellerProfile revisions
  now keep approved public fields stable while the author edits/submits a draft, and
  moderation promotes only the approved revision. Revision-scoped achievements have
  text and optional date and are exposed only from the published profile revision.
  A new draft copies the published achievement set, while append locks the revision row
  before assigning its position. Optional achievement images and profile-photo revision
  storage are not implemented API contracts, and PostgreSQL integration coverage is
  blocked locally, so this is not a complete RFC visitor-to-author flow.
- `Implemented`: portfolio Work approval in
  `apps/api/src/products/product-requirements.ts` requires title, category and one
  primary image. The optional plain-text story is not a publication blocker; legacy
  delivery, packaging and provenance fields no longer gate moderation. API unit tests
  (343/343), typecheck and lint pass; PostgreSQL integration remains blocked locally.
- `Partial`: portfolio legal drafts and the review manifest are prepared for external
  Belarus lawyer review. They describe the portfolio-only release and retain auction
  rules as deferred. Operator identity, provider/country/retention facts, lawful basis,
  age control and deployed cookie inventory remain launch blockers; see
  `docs/tasks/2026-09-08-first-mvp/11-EXTERNAL-BLOCKERS.md`.
- `Planned`: object storage, creator onboarding, simplified
  Work creation, portfolio discovery and the read-only Figma cutover are tracked in
  [`00-FIRST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md).
- `Prepared, not implemented`: эти launch gaps собраны в восемь self-contained
  implementation/review prompts с dependencies, success criteria и checks в
  [`00-EXECUTION-ORDER.md`](../tasks/2026-09-08-first-mvp/00-EXECUTION-ORDER.md).
- `Deferred`: seller history, auction lifecycle residuals, fixed/offer, handoff and the
  completed creator-commerce research are preserved in
  [`99-POST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md).
- `Needs verification`: `pnpm verify` reaches database generation, typecheck (7/7),
  lint (2/2), API unit tests (353/353) and contracts tests (30/30), but its PostgreSQL
  integration stage cannot initialize because no server is listening at `127.0.0.1:5432`.
  A standalone `pnpm build` succeeds for all seven packages. Figma/`.pen` were not
  changed.

## 2026-09-07 — Work/Order boundaries and research gate

- `Implemented` (docs only): `DEC-079` confirms portfolio-first Work states,
  persistent fixed sale, relist boundaries and permanent sold history; `DEC-080`
  confirms one format-neutral Order/public code without synthetic Bid; `DEC-081`
  selects controlled test-data reset and defers in-app notifications/general reports.
- `Needs research`: contact timeout, chat dependency, second chance, outcome
  confirmation, contact disclosure, edit/remoderation and the business evidence an
  Order must preserve are assigned to a browser-only GPT researcher. The exact
  persistence model remains the later technical contract. The researcher receives a
  standalone prompt and returns text plus direct web sources without repository access:
  [`../tasks/2026-09-06-reconciliation/10-CREATOR-COMMERCE-FLOWS-RESEARCH.md`](../tasks/2026-09-06-reconciliation/10-CREATOR-COMMERCE-FLOWS-RESEARCH.md).
- `Not implemented`: all named changes are product/documentation boundaries. Current
  auction-only schema, mandatory `sourceBidId`, seller-only handoff transitions and
  live snapshot fallback remain unchanged.
- `Needs future design cutover`: current `docs/design/*` still governs the Pen-based
  runtime. The founder-selected original Figma is a read-only source for the later
  redesign; its exact file/version and inspect/token/asset handoff must be recorded
  before replacing the current design authority.
- This entry supersedes the 2026-09-06 stress-test status below: D04 is closed by
  `DEC-081`; only D01–D03 remain open.
- Tests were not rerun for this docs-only task.

## 2026-09-07 — open architecture gaps retained

- `Implemented` (docs only): обнаруженные в T07 технические пробелы и варианты их
  решения сохранены в
  [`../audits/01-OPEN-ARCHITECTURE-GAPS.md`](../audits/01-OPEN-ARCHITECTURE-GAPS.md).
  Карта покрывает Work-level deal uniqueness, Order sources, handoff outcomes,
  second chance, snapshots, contact disclosure, notifications, Work/Listing boundary
  и complaints.
- `Needs founder decision`: рекомендуемые направления не являются утверждённой
  архитектурой и не меняют RFC, decision log, schema или runtime.
- Code behavior is unchanged. Tests were not rerun for this docs-only task.

## 2026-09-06 — MVP deal decision stress-test

- `Implemented` (research/docs only): D01–D04 проверены как единая модель
  `Work → Listing → Bid/offer → Order → handoff`. Рекомендации, rejected alternatives,
  race/abuse invariants и вопросы юристу находятся в
  [`../research/2026-09-06-MVP-DEAL-DECISION-STRESS-TEST.md`](../research/2026-09-06-MVP-DEAL-DECISION-STRESS-TEST.md).
- `Needs founder decision`: memo не меняет RFC или decision log. D01–D04 остаются
  открыты в [`14-OPEN-MVP-DECISIONS.md`](14-OPEN-MVP-DECISIONS.md).
- `Needs future implementation`: текущая БД ограничивает активный Order только на
  уровне Listing, а seller единолично меняет `CONTACTED`, `COMPLETED` и
  `HANDOFF_FAILED`. Для Work-first/fixed/offer нужен Work-level deal invariant и
  раздельные pending/confirmed outcomes.
- Code behavior is unchanged. Tests were not rerun for this docs-only task.

## 2026-09-06 — current documentation and legal UX research

- `Implemented` (docs only): выполненные task-prompts и закрытые legal-вопросники
  удалены из активной структуры; текущие blockers сведены в
  [`../audits/00-CURRENT-MVP-READINESS.md`](../audits/00-CURRENT-MVP-READINESS.md),
  активные задачи — в
  [`../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md).
- `Implemented` (research): Belarus legal UX findings перенесены в
  [`../research/2026-09-06-BELARUS-LEGAL-UX-PATTERNS.md`](../research/2026-09-06-BELARUS-LEGAL-UX-PATTERNS.md).
  Research определяет понятные места controls, но не заменяет заключение юриста.
- `Needs verification`: отдельный обязательный PD consent из `DEC-078` требует
  purpose-by-purpose legal basis check. Это не отменяет решение основателя молча;
  финальный registration contract остаётся заблокирован вопросом 1 из
  [итоговый юридический аудит](../legal/00-FINAL-LEGAL-AUDIT.md).
- Code behavior is unchanged by this documentation update. Tests were not rerun.
- `Planned` (docs only): backlog содержит независимые security/dependency evidence и
  public-pilot operations reviews. Они не разрешают открытые вопросы автоматически и
  не меняют runtime.

## 2026-09-06 — Belarus launch scope

- `Implemented` (docs only): `DEC-076` separates auction from direct fixed-price
  sale. Buyer price offers are optional only for fixed sale; payment and delivery
  always stay outside bidplace.
- `Implemented` (docs only): `DEC-077` makes Belarus law the current operator,
  public-document and legal-review workstream. Earlier BY+RF packs are historical.
- `Implemented` (docs only): `DEC-078` records the founder-selected document set,
  registration layout, separate 18+, cookie banner, BYN, fixed-buy/accepted-offer
  outcomes and text-only V1 error report. Exact legal basis and wording remain
  subject to the focused Belarus questions and final review of adapted drafts.

## 2026-09-06 — Product write atomicity

- `Implemented`: owner Product field, submit, creation-story, ProductImage add/remove/reorder and creation-step image writes take the Product row lock (`SELECT … FOR UPDATE`) inside a Read Committed transaction and re-check owner, approved seller, editable status (`DRAFT`/`CHANGES_REQUESTED`/`REJECTED`) and the absence of a `SCHEDULED`/`LIVE` Listing before mutating. Conditional `updateMany` predicates back Product row writes. Listing `SCHEDULE` and admin Product moderation take the same row lock. Image decode stays outside the TX; a lost race rolls back with the TX so Postgres image bytes are not left behind. `remove`/`reorder` re-read the image set under the row lock (`temporaryBase` from locked rows). `SCHEDULE` repeats handoff and `startsAt > now` after the lock and writes `publishedAt` from that post-lock clock.
- Coverage: unit `product-write-guard.spec.ts`, `products.service.spec.ts`, `images.service.spec.ts`, `listings.service.spec.ts`; PostgreSQL `product-write-atomicity.integration.spec.ts` (fail-closed `pg_blocking_pids` barrier, forced update↔submit, media↔moderation, story↔Listing lock, concurrent update/submit, REJECTED resubmit, add↔remove/reorder, `ListingsService.transition('SCHEDULE')` vs Product leaving `APPROVED` and vs admin `CHANGES_REQUESTED`).
- `Verified`: API unit 325/325; PostgreSQL `product-write-atomicity.integration.spec.ts` 11/11; API typecheck; eslint on changed product/image/listing files.
- Decision unchanged: `DEC-071`. RFC §6 owner edit/resubmit loop is preserved.

## 2026-09-06 — reconciliation review and product correction

- `Implemented` (docs only): `DEC-075` revises the product assumptions recorded
  in `DEC-072`. Work-first portfolio is target MVP scope. Offer expiry,
  counteroffer, next bidder/contact release, contact window policy and currency
  expansion are explicitly open pending marketplace research and written Belarus
  legal review.
- `Needs verification`: current runtime still implements auction + BYN, manual
  admin replacement and fixed 48-hour Order contact snapshots. These are truthful
  code facts, not final target mechanics.
- `Partial`: seller Orders inbox exists but hides `CANCELLED` history; expired
  scheduled cancellation exists without author notification/relist. Activity
  distinguishes a cancelled auction from an outbid state and selects a relevant
  Order deterministically.
- Full repository verification on `fix/mvp-reconciliation-review` passed:
  typecheck 7/7, lint 2/2, API unit 302, contracts 27, integration 73 and build
  7/7. Passing tests do not cover the named concurrency/product gaps.
- Current audit: `../audits/00-CURRENT-MVP-READINESS.md`; backlog:
  `../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md`; legal questions:
  `../legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`.

## 2026-09-06 — Seller inbox HTTP 401/403

- `Implemented`: no route or permission change. Guest `GET /api/orders` remains 401 (`BearerAuthGuard`); admin remains 403 (`listForSeller` `role !== 'user'`).
- Coverage: HTTP `seller-orders-inbox-http.integration.spec.ts` (guest 401, admin 403). Service-level admin deny remains in `seller-orders-inbox.integration.spec.ts`.
- `Verified`: PostgreSQL integration 73/73 including the new HTTP file (2/2).

## 2026-09-06 — Deterministic buyer Activity projection

- `Implemented`: `ActivityService` requests only the current buyer's Orders
  with explicit `createdAt DESC, id DESC` order and then deterministically
  selects a non-cancelled Order before a cancelled historical row. Equal-class
  ties use the same `createdAt`/`id` ordering. A cancelled Listing with no
  Order now returns shared status `AUCTION_CANCELLED` (`Торги отменены`) rather
  than `OUTBID`; cancelled-only Orders remain `WIN_CANCELLED` with no order
  detail link.
- Scope preserved: no pagination, next-bidder, payment or contact-release
  behavior was added.
- `Verified`: API unit 319/319; contracts 27/27; mobile presentation 12/12;
  contracts/API/mobile typecheck; filtered API/mobile/contracts lint; API and
  Expo builds.

## 2026-09-06 — Bounded lifecycle tick batch

- `Implemented`: `ListingLifecycleService.run` activate, expired-`SCHEDULED` cancel, and LIVE close `findMany` queries use `take: LIFECYCLE_TICK_BATCH_SIZE` (50) and stable `orderBy`. Activate orders by `startsAt`/`id`; cancel and close keep `endsAt`/`id`. Remainder stays for the next 30s tick. No queue or distributed lock.
- Coverage: `listing-lifecycle.service.spec.ts` asserts `take`/`orderBy` on all three tick queries.
- `Verified`: lifecycle unit 5/5; API typecheck; eslint on `src/lifecycle/listing-lifecycle.service.ts`; PostgreSQL `lifecycle.integration.spec.ts` in the 73/73 suite.
- Remaining: prove `51 → 50 + 1`, prevent poison-prefix starvation and record the
  single/multi-instance scheduler policy. Active task:
  [`../tasks/2026-09-06-reconciliation/03-LIFECYCLE-BOUNDED-PROGRESS.md`](../tasks/2026-09-06-reconciliation/03-LIFECYCLE-BOUNDED-PROGRESS.md).

## 2026-09-06 — Narrow SellerProfile and ProductImage hydration

- `Implemented`: `placeBid`, public Product GET, listing get/transition/create, lifecycle `ensureWinnerOrder`, admin Order replace/recovery and product moderation no longer `include` full `SellerProfile`. Shared `sellerProfileAuthSelect` / `sellerProfileHandoffSelect` omit `profilePhotoData`. `getPublic` reuses `productImageMetadataSelect` so `ProductImage.data` is not copied into the product page. Image-store byte GET paths unchanged. Listing owner responses omit nested `product`.
- Coverage: `bids.service.spec.ts`, `products.service.spec.ts`, `listings.service.spec.ts`, `listing-lifecycle.service.spec.ts`, `orders.service.spec.ts`, `admin-moderation.service.spec.ts`.
- `Verified`: targeted API unit 43/43; API typecheck; eslint on changed `src/{bids,products,listings,lifecycle,orders,admin,sellers}` files.

## 2026-09-05 — Order projection select without seller photo bytes

- `Implemented`: `orderWithProductSelect` for `GET /api/orders` and `GET /api/orders/:publicId` loads Order snapshot scalars plus `listing.currency` and `product.title`/`publicId` only. `SellerProfile` (including `profilePhotoData`) and live `buyer`/`seller` joins are not selected. Replacement/recovery create TXs now use `sellerProfileHandoffSelect` (no photo bytes); see 2026-09-06 hydration note.
- Coverage: `orders.service.spec.ts` asserts `get` `findUnique` and list `findMany` use the same projection select (`listing.currency` + `product.publicId`/`title`; no `sellerProfile`, `buyer`, or `seller`).
- `Verified`: API orders unit 26/26; API typecheck; eslint on `src/orders`; PostgreSQL integration 71/71 including `seller-orders-inbox.integration.spec.ts` (2/2).

## 2026-09-05 — Seller Orders inbox

- `Implemented`: `GET /api/orders` lists the authenticated seller's non-cancelled Orders with `page`/`limit` (max 100). `sellerId` comes from the session, not the query. Admin is denied. Projection is the seller Order contract and reads frozen snapshot title/currency/product public id (`DEC-074`).
- `Implemented`: Expo `/(seller)/orders` (`/orders`) reuses Activity-style current UI with loading/empty/error/pagination. Linked from seller profile and the account menu. Not a Pen/Figma redesign.
- Coverage: `orders.service.spec.ts` list bounds and admin deny; `contracts.test.ts` rejects `sellerId` query; PostgreSQL `seller-orders-inbox.integration.spec.ts`; HTTP `seller-orders-inbox-http.integration.spec.ts` (guest 401, admin 403).
- `Verified`: contracts 27/27; API orders unit 22/22; API typecheck/lint on `src/orders`; mobile typecheck; PostgreSQL inbox 2/2 plus HTTP 2/2 in the 2026-09-06 73/73 suite.

## 2026-09-05 — Immutable Order deal snapshot

- `Implemented`: new Orders freeze `snapshotTitle`, `snapshotCurrency` and `snapshotProductPublicId` at create. `listingId` and `finalAmount` remain the Listing identity and price snapshot. `createWinnerOrder` and admin replacement load Listing/Product inside the create TX via `loadOrderDealSnapshot` / `createOrderSnapshot`. GET projections prefer frozen fields; historical null columns fall back to live Product/Listing. Additive Prisma only; old rows are not rewritten. Decision: `DEC-074`.
- Coverage: `order-snapshot.spec.ts`; `create-winner-order.spec.ts` create payload and fail-closed missing title; `orders.service.spec.ts` frozen vs live title; PostgreSQL lifecycle close, recovery and replacement including post-create Product title change.
- `Verified`: contracts 26/26; targeted API unit 20/20; API typecheck/lint on `src/orders`; mobile typecheck after api-client rebuild; PostgreSQL integration 19/19 (lifecycle, recovery, replacement).

## 2026-09-05 — Expired SCHEDULED listings (P0-D)

- `Implemented`: cron in `listing-lifecycle.service.ts` cancels `SCHEDULED` rows with `endsAt <= now` to `CANCELLED` + `closedAt`, audit reason `EXPIRED_SCHEDULED_WINDOW` (nullable `AuditEvent.actorUserId`), realtime `listing.updated`, no Order. Activation window unchanged. Decision: `DEC-073`.
- Coverage: `state-machine.spec.ts`; `listing-lifecycle.service.spec.ts`; PostgreSQL `lifecycle.integration.spec.ts` including missing-handoff expired windows and idempotent rerun.
- `Verified`: API typecheck/lint; lifecycle/state-machine unit; PostgreSQL integration 68/68 including expired SCHEDULED cancel.

## 2026-09-05 — Mutable image cache (QW-06)

- `Implemented`: `getImageCacheControl({ isPublic, kind })` in `apps/api/src/images/image-policy.ts`. Private remains `private, no-store`. Public Product images by id stay `public, max-age=31536000, immutable` because add/delete allocate a new id and do not replace bytes in place. Public seller photo (`/sellers/:slug/photo`) and creation-step (`/creation-steps/:stepId/image`) use `public, max-age=0, must-revalidate`.
- Coverage: parameterized `image-policy.spec.ts`; `images.controller.spec.ts` product + creation-step; `sellers.controller.spec.ts` photo; `media-transport.integration.spec.ts` product vs seller headers.
- `Verified`: API typecheck/lint; image/seller unit 35/35; PostgreSQL integration 66/66 including `media-transport`.

## 2026-09-05 — BY+RF lawyer pack (P0-B)

- `Superseded`: этот исторический BY+RF пакет удалён из рабочего дерева после
  `DEC-077`. Текущая юридическая работа ограничена Беларусью; исходная версия остаётся
  в Git. Актуальный список — `docs/legal/00-FINAL-LEGAL-AUDIT.md`.

## 2026-09-05 — Expanded MVP product contract (P0-A)

- `Superseded` (product): the former `DEC-072` defaults were revised by
  `DEC-075`–`DEC-077`; they are not current implementation instructions.
- `Not implemented` (code): fixed-price Listing, optional offers, and `RUB` runtime. Current runtime remains `AUCTION` + `BYN`. Order snapshot (`DEC-074`) and seller inbox are in place; P0-E remains unstarted.
- Protected `01` / `08` / `09` were not rewritten. RFC §3, §9, §12, §14, §19 and §21 were updated to match `DEC-072`.

## 2026-09-05 — Rejected Product recovery (QW-04)

- `Implemented`: Product `REJECTED` is owner-editable on the same Product ID.
  `isEditableProductStatus` in `packages/contracts` now includes `REJECTED`
  alongside `DRAFT` and `CHANGES_REQUESTED`; `ProductsService.update` /
  `submit`, creation-story writes and `ImagesService` reuse that gate.
  `submit` moves `REJECTED → PENDING_REVIEW` atomically with an append-only
  `AuditEvent`; previous rejection reasons are not rewritten.
- `Implemented`: owner detail `GET /api/seller/products/:id` returns
  `lastModerationReason`. `ProductDraftScreen` hydrates the same form, shows the
  reason for `REJECTED`/`CHANGES_REQUESTED`, and resubmits without creating a
  new Product. Public catalog/direct predicates still require `APPROVED`.
  Admin cannot reopen `REJECTED` through the seller write path or the admin
  product status machine.
- Coverage: `products.service.spec.ts`, `images.service.spec.ts`,
  `sellers.service.spec.ts`, `admin-moderation.service.spec.ts`,
  `contracts.test.ts`, `product-draft-state.spec.ts`, PostgreSQL HTTP
  `rejected-product-recovery.integration.spec.ts`.
- `Verified`: contracts 15/15; targeted API unit 37/37; API unit 236/236;
  mobile helper 3/3; API lint; contracts/API typecheck; integration 2/2 plus
  related seller-permissions/moderation 6/6.
- Decision: **DEC-071**. RFC §6 records the owner resubmit loop.

## 2026-09-05 — Order contact deadline (QW-05)

- `Implemented`: shared `orderContactSchedule(now)` in `apps/api/src/orders/order-contact-deadline.ts` stores matching `createdAt` and 48-hour `contactDueAt` on every new auction Order. Lifecycle close and admin `createOrderForEndedListing` go through `createWinnerOrder`, which computes the schedule internally from `now` and cannot take a custom deadline. Manual replacement uses the same schedule once before publicId retry. Idempotent recovery returns the existing Order without extending the deadline. Historical Orders are not migrated. Seller 24/48/72 configuration is not added. `contactDueAt` remains a snapshot, not a `HANDOFF_FAILED` gate. Decision: `DEC-070`.
- Coverage: `order-contact-deadline.spec.ts`; `create-winner-order.spec.ts` asserts create payload schedule; lifecycle close asserts exact `closeAt + 48h`; recovery and replacement assert exact `contactDueAt - createdAt === 48h` and unchanged retry deadline.
- `Verified`: API typecheck, lint, build; API unit `233/233`; PostgreSQL integration `63/63` including lifecycle close, admin recovery and replacement.

## 2026-09-05 — Buyer Activity statuses (QW-02)

- `Implemented`: `packages/contracts/src/activity.ts` adds `CONTACTED` and `HANDOFF_FAILED`. `ActivityService` maps every Order status and LIVE/ENDED/SCHEDULED/CANCELLED Listing without Order; cancelled wins return `orderPublicId: null` while keeping the Product publicId.
- `Implemented`: Activity and product participation copy use `auctionParticipationLabels` (`Связались`, `Сделка не состоялась`, `Покупка отменена`). Order GET privacy for cancelled Orders is unchanged.
- Coverage: table-driven `activity.service.spec.ts`; cancelled-order navigation omission; `presentation.spec.ts` labels.
- `Verified`: contracts tests 23/23; API unit 265/265; API typecheck/lint; mobile presentation unit 12/12; mobile typecheck/lint.

## 2026-09-05 — HTTPS-only public seller links (QW-01)

- `Implemented`: `packages/contracts/src/primitives.ts` `httpsUrlSchema` is the shared HTTPS-only URL contract. Seller public write and response fields `socialLink`, `telegramUrl`, `instagramUrl` and `websiteUrl` in `packages/contracts/src/seller-profile.ts` use it. Mobile profile validation and creator-profile e2e reuse the same schema and HTTPS error copy.
- `Implemented`: Telegram/Instagram `@handle` and private PHONE handoff schemas are unchanged. Media URL resolution is unchanged.
- Coverage: parameterized contract tests for https vs `http`/`javascript`/`data`/`file`/relative/`ftp`; existing handle cases; `profile-validation.spec.ts`.
- `Needs verification`: Playwright `creator-profile.spec.ts` copy update is in tree; run against a live app when e2e is next executed.

## 2026-09-05 — Fail-closed environment matrix (QW-03)

- `Implemented`: `apps/api/src/core/config/env-profile.ts` centralizes production-like predicates. `APP_ENV=production` requires `NODE_ENV=production`; `NODE_ENV=production` cannot combine with `APP_ENV=local`. SMTP, service rules, `PASSWORD_RESET_URL_BASE`, 32-character `JWT_SECRET`, test-bypass prohibition, SMTP mail transport, secure session cookies and production service-rules text follow that profile.
- `Implemented`: `TEST_EMAIL_BYPASS` parses only for `NODE_ENV=test` and `APP_ENV=local`. Destructive demo seed still fails closed outside `NODE_ENV=development|test`, `APP_ENV=local` and `ALLOW_DESTRUCTIVE_DEMO_SEED=true`. Compose `app` profile now sets `APP_ENV=production`. Staging combinations are unchanged except that `NODE_ENV=production` plus `APP_ENV=staging` continues to require production security.
- Coverage: parameterized `env.spec.ts` matrix; `env-profile.spec.ts`; `rules.spec.ts`; `local-mail-transport.spec.ts`; cookie `secure` in `auth.controller.spec.ts`; seed denial includes `development`/`production` in `seed-contract.integration.spec.ts`.
- `Verified`: API typecheck, lint, build; API unit `260/260`; seed-contract PostgreSQL integration `5/5`.

## 2026-08-22 — ImageStore + MailTransport ports (review fixes)

- `Implemented`: `core/image-store/` — `ImageStore` port with `PostgresImageStore`;
  product/creation-step/seller photo bytes written via `put` and read via `get`.
- `Implemented`: seller photo and creation-step writes — meta update + `ImageStore.put`
  in the same Prisma transaction (`SellersService`, `ImagesService.addCreationStepImage`).
- `Implemented`: `ImagesService.add` — Sharp outside TX; SERIALIZABLE TX re-checks
  owner/capacity, then `create` + `ImageStore.put` per image.
- `Implemented`: `get` / `getCreationStepImage` — authz before `imageStore.get`;
  Prisma queries exclude binary columns.
- `Implemented`: `core/mail/` — unified `MailTransport` for OTP and password-reset.
- Coverage: `postgres-image-store.spec.ts`, `images.service.spec.ts`,
  `media-transport`, `image-upload-safety`, `password-reset` integration.
- `Verified`: API typecheck; API unit 228/228; targeted integration 5/5 (`media-transport`, `image-upload-safety`).

## 2026-08-22 — Release / backup / restore (P0-5)

- `Implemented`: pinned Node `22` (`.nvmrc`); root `test:unit` and `pnpm verify`
  (`db:generate` → typecheck → lint → unit → integration → build).
- `Implemented`: GitHub Actions [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml)
  with PostgreSQL service container.
- `Implemented`: `GET /api/health/ready` — Prisma `SELECT 1` with 2s timeout; `503`
  when DB unreachable; liveness remains `GET /api/health` (`health.service.ts`,
  `health.service.spec.ts`). Playwright waits on `/api/health/ready`.
- `Implemented`: API `Dockerfile` (`pnpm deploy --prod` runtime layout),
  `docker compose --profile app` with production env from `.env`, ops runbook
  [`docs/ops/00-RELEASE-AND-BACKUP.md`](../ops/00-RELEASE-AND-BACKUP.md).
- `Implemented`: `scripts/ops/backup-db.sh`, `restore-db.sh`,
  `verify-restore-integrity.mjs` with `pnpm ops:backup|restore|verify-restore`;
  local restore drill to `bidplace_restore` verified counts + 5 image checksums
  (2026-08-22).
- `Verified`: `pnpm verify`; health/ready smoke; restore drill evidence in ops doc;
  Compose `app` profile image boot + `/api/health/ready` smoke (2026-08-22).
- `Implemented` (review polish): ready probe clears timeout in `finally`;
  Prisma `binaryTargets` for debian/linux-arm64 deploy engines; Compose omits
  empty `SMTP_USERNAME`/`SMTP_PASSWORD` unless `SMTP_AUTH_MODE=login`.
- Pilot P0-1…P0-5 closed. Remaining pre-pilot queue: P1 stuck SCHEDULED
  auto-rule and separate UI/release-gate items in status history.

## 2026-08-21 — Image upload TX boundary follow-up (P0-4 polish)

- `Implemented`: `ImagesService.add` runs authz, then Sharp normalize **outside**
  `runSerializableTransaction`; SERIALIZABLE TX only re-checks owner/capacity and
  persists normalized bytes.
- `Implemented`: Multer `fileFilter` returns `400 Unsupported image type` for GIF
  and other disallowed MIME types (not empty-upload wording).
- `Implemented`: animated WebP detection via metadata read with `animated: true`
  (`pages`/`delay` gate); unit fixture + `image-policy.spec.ts` coverage.
- `Implemented`: early `maxFiles` capacity gate before Sharp normalize when the
  product is already full (`images.service.ts`, `images.service.spec.ts`).
- Coverage: `images.service.spec.ts` (authz-before-decode spy), extended
  `image-policy.spec.ts`, `image-upload-safety.integration.spec.ts`.
- `Verified`: API typecheck; targeted unit + integration.

## 2026-08-21 — Image upload safety (P0-4) + admin incident guards

- `Implemented`: `ImagesService` validates ownership and approved-seller capability
  **before** Sharp decode/normalize. Controller accepts multipart byte limits only;
  `validateAndNormalizeProductImageUploads` runs in the service.
- `Implemented`: static-only policy — GIF and animated WebP/PNG rejected; max edge
  4096px and 16_777_216 pixels; sequential bounded normalize stores canonical JPEG/PNG
  bytes (`apps/api/src/images/image-policy.ts`).
- `Implemented`: upload rate limits (10/min per user) on product and creation-step
  image POSTs (`images.controller.ts`).
- `Implemented`: admin incident guards — cannot ban/revoke self or other admins;
  session revoke audit uses `oldStatus: session`, `newStatus: revoked`.
- `Implemented`: engineering owner doc [`13-APPLICATION-SECURITY.md`](13-APPLICATION-SECURITY.md);
  **DEC-068** in decision log.
- Coverage: `image-policy.spec.ts`, `image-upload-safety.integration.spec.ts`,
  extended `admin-user.service.spec.ts`, `admin-user-emergency.integration.spec.ts`.
- `Verified`: API unit + targeted integration; API/mobile typecheck.
- Remaining pilot P0: release/backup (P0-5) only. Stuck SCHEDULED auto-rule queue
  remains P1.

## 2026-08-21 — Emergency admin controls (P0-3)

- `Implemented`: `AdminUserService` with `GET /api/admin/users?email=`,
  `PATCH /api/admin/users/:id/status` (ban/unban + reason, ban increments
  `sessionVersion`), and `POST /api/admin/users/:id/revoke-sessions`.
- `Implemented`: `AdminListingEmergencyService` with
  `POST /api/admin/listings/:listingId/emergency-cancel` for `SCHEDULED|LIVE →
CANCELLED` (bids preserved, no Order create, append-only `AuditEvent`, realtime
  `listing.updated`). Idempotent when already `CANCELLED`.
- `Implemented`: `AuditTargetType.USER` migration
  `20260821130000_add_audit_target_user`; contracts + `api-client` admin methods.
- `Implemented`: mobile admin tabs **Пользователи** (`AdminUsersPanel`) and
  **Восстановление** (`AdminRecoveryPanel`) — email lookup, ban/revoke, needs-order
  queue, emergency cancel by listing id.
- Coverage: unit `admin-user.service.spec.ts`, `admin-listing-emergency.service.spec.ts`,
  `state-machine.spec.ts`; PostgreSQL HTTP
  `admin-user-emergency.integration.spec.ts`, `admin-listing-emergency.integration.spec.ts`.
- `Verified`: API/mobile typecheck; targeted integration suites.
- Remaining pilot P0: ~~image limits (P0-4)~~, release/backup (P0-5). Stuck
  SCHEDULED auto-rule queue remains P1.

## 2026-08-21 — Password recovery (P0-2)

- `Implemented`: `PasswordResetModule` (`apps/api/src/password-reset/`) with
  `POST /api/auth/password/forgot` and `POST /api/auth/password/reset`.
  Forgot always returns neutral `{ ok: true }` (unknown email, banned user, SMTP
  failure after token create). Reset stores only `sha256(token)`, invalidates
  outstanding tokens, updates password hash and increments `sessionVersion` in
  one transaction.
- `Implemented`: shared SMTP helper in `apps/api/src/core/email/` used by OTP
  and password-reset transports; single-address recipient guard.
- `Implemented`: contracts `forgotPasswordRequestSchema` /
  `resetPasswordRequestSchema`, `ApiErrorCode.PASSWORD_RESET_INVALID`, and
  `api-client` auth methods.
- `Implemented`: mobile routes `(auth)/forgot-password` and
  `(auth)/reset-password` with feature forms, login link, localized invalid-link
  copy, and success → login (no auto-login).
- `Implemented`: `PasswordResetToken` persistence +
  `20260821120000_add_password_reset_tokens` migration; production requires
  `PASSWORD_RESET_URL_BASE`.
- Coverage: unit `password-reset.service.spec.ts`, `core/email/smtp-transport.spec.ts`;
  PostgreSQL HTTP `password-reset.integration.spec.ts` (neutral forgot, replay,
  session invalidation, second-forgot invalidates first token).
- `Verified`: API/contracts typecheck; API unit + integration; mobile schema
  unit for confirm-password mismatch.
- Review polish (2026-08-21): resend cooldown applies only to unused tokens;
  per-email forgot rate limit runs after active-user lookup; reset link base
  falls back to `resolveCorsOrigin()` in local dev; mobile forgot flow preserves
  `redirectTo`; local OTP/reset mail artifacts ignored via `.gitignore`.
- Remaining pilot P0: image limits, release/backup.

## 2026-08-21 — Irreversible auction close (P0-1)

- `Implemented`: `ListingLifecycleService.close` commits `LIVE → ENDED` in its
  own SERIALIZABLE transaction, emits `listing.ended`, then creates the winner
  Order via `createWinnerOrder` in separate short-lived transactions. Generic
  Order failures leave `ENDED` without Order and are logged; they no longer roll
  back the close.
- `Implemented`: shared `createWinnerOrder` helper
  (`apps/api/src/orders/create-winner-order.ts`) for close and admin recovery.
  Each create attempt is its own SERIALIZABLE TX. On `P2002`, classification uses
  `getPrismaUniqueConstraintTargets` **after** the failed TX ends: `public_id`
  retries with a new id; `source_bid_id` resolves via a fresh root
  `findUnique` to `already_exists`. Exhausted publicId attempts throw without
  undoing `ENDED`. Admin recovery writes its AuditEvent in the same TX as create
  via optional `onCreated`.
- `Implemented`: cron `run()` isolates activate/close per Listing so one failure
  does not stop the remaining expired queue.
- Ranking and admin recovery API unchanged; no new Listing statuses, queues, or
  outbox.
- Coverage: unit `create-winner-order.spec.ts` (fresh-TX retry mocks), lifecycle
  cron isolation; PostgreSQL real `orders_public_id_key` collision → retry → one
  Order; secondary generate-throw → `ENDED` + admin recovery
  (`lifecycle.integration.spec.ts`); `order-recovery.integration.spec.ts` green.
- `Verified`: API typecheck; eslint on touchpoints; API unit helper/lifecycle;
  auction PostgreSQL integration under `test/integration/auction/`.
- Remaining pilot P0 (image limits, release/backup) are unchanged.

## 2026-08-20 — Admin Order recovery for ended Listings

- `Implemented`: admin path for `Listing=ENDED`, Bids present, Order absent:
  `GET /api/admin/listings/needs-order` and
  `POST /api/admin/listings/:listingId/create-order`.
- `Implemented`: `OrdersService.listEndedWithoutOrder` and
  `createOrderForEndedListing` (SERIALIZABLE). Winner is re-read from canonical
  Bid ranking (`amount DESC`, `createdAt ASC`, `id ASC`). Existing non-cancelled
  Order is returned unchanged; cancelled-only history conflicts; no Bids or
  missing handoff conflicts. Repeated retry does not duplicate Orders.
- Auction state / winner semantics at close were not changed; no new Listing
  statuses, queues, outbox, or workflow engine.
- Contracts: `adminListingNeedsOrderItemSchema`,
  `adminListingsNeedingOrderResponseSchema`,
  `adminCreateListingOrderResponseSchema`. Client methods on `@bidplace/api-client`.
- Coverage: `apps/api/test/integration/auction/order-recovery.integration.spec.ts`.
- `Partial` (superseded 2026-08-21): recovery API was complete, but close could
  still roll back `ENDED` on generic Order create failure until the two-step
  close fix.
- `Verified`: API typecheck; API unit `178/178` (orders filter); auction
  PostgreSQL integration including recovery (all passed under `auction/`);
  eslint on recovery touchpoints.

## 2026-08-20 — Analytics foundation + admin dashboard

- `Implemented`: first-party analytics ingest (`AnalyticsEvent`,
  `AcquisitionAttribution`), request `X-Request-Id` + request logging,
  `POST /api/analytics/events`, and `GET /api/admin/analytics/overview`.
- `Implemented`: mobile anonymousId / first-touch / identify / logout reset and
  funnel events `listing_viewed`, `seller_viewed`, `registration_started`,
  `bid_cta_clicked`, `bid_rejected` (no impressions/search/`bid_accepted`).
- `Implemented`: admin UI `/admin/analytics` (overview, acquisition, funnels,
  marketplace health, growth, recent activity, needs attention); linked from
  account menu and moderation. Public seller profiles now expose `id` for
  stable `seller_viewed` joins.
- `Implemented`: docs `analytics-contract.md`, `analytics-metrics.md`, `DEC-067`.
- `Partial` vs `05-MVP-RFC.md` §16: remaining planned names
  (`email verification*`, `participation viewed`, `auction closed`, handoff
  outcomes) stay DB-derived or deferred; not duplicated as analytics events.
- `Verified`: API unit `178/178`, mobile unit `201/201`, contracts `13/13`,
  API/mobile typecheck and lint.

## 2026-08-19 — Post-refactor hardening

## 2026-08-20 — Auction core concurrency and close hardening

- `Implemented`: `BidsService.place` retries CAS `LISTING_CHANGED` up to 3 times
  with full re-validation against a fresh Listing snapshot; `LISTING_CHANGED`
  remains only after retries are exhausted.
- `Partial` (corrected 2026-08-21): earlier claim that Order creation was
  best-effort inside the same close transaction was wrong for generic
  `Order.create` failures (they rolled back `ENDED`). Two-step close now matches
  the intended invariant; see 2026-08-21 entry.
- `Implemented`: schedule/activation require seller handoff contact; activation
  cron also filters on non-null handoff fields.
- `Implemented`: auction business integration suites live under
  `apps/api/test/integration/auction/` (bidding, lifecycle, soft-close) with
  Listing/Bid DB invariants after concurrent scenarios.
- Error contract / business codes were not changed in this pass.
- `Verified`: API unit `167/167`, PostgreSQL integration `46/46`, API
  typecheck/lint. E2E not re-run in this pass.

## 2026-08-20 — API error contract for bidding

- `Implemented`: unified API errors keep `{ status, code, message, details? }`.
  Category codes remain the default for plain Nest exceptions; bidding now throws
  `AppException` with stable business codes (`BID_TOO_LOW`, `LISTING_NOT_OPEN`,
  `SELF_BID_FORBIDDEN`, `ADMIN_BID_FORBIDDEN`, eligibility and idempotency codes,
  `LISTING_CHANGED`, `LISTING_NOT_FOUND`). `BID_TOO_LOW` includes `details.minimumBid`.
- `Implemented`: `ApiExceptionFilter` honors explicit codes/details, maps Zod
  validation to `validation_error`, and masks unexpected exceptions as
  `internal_error`. Shared `ApiErrorCode` lives in `packages/contracts`;
  `@bidplace/api-client` parses codes and exposes `getBidTooLowMinimum`.
- `Implemented`: Product bid UI branches on `ApiErrorCode.BID_TOO_LOW` instead of
  HTTP 400 + message heuristics.
- Bid placement rules, soft close and auction lifecycle were not changed.
- `Verified`: contracts `13/13`, api-client `2/2`, API unit `166/166`, API
  typecheck/lint, mobile typecheck, PostgreSQL integration `40/40`.

## 2026-08-19 — Post-refactor hardening

- `Implemented`: Product Creation step-1 validation keeps a unique field error
  (`Введите название`) and a distinct form-level summary
  (`Проверьте обязательные поля`) so screen readers and Playwright are not
  given two copies of the same live text. Coverage is in
  `product-draft-wizard.spec.ts` and `product-creation-wizard.spec.ts`.
- `Implemented`: desktop account-menu Escape stays closed until the pointer
  leaves the trigger; the Playwright hover suite now leaves the trigger before
  reopening. Overlay dismiss listeners no longer resubscribe every render.
- `Implemented`: `components/layout/index.ts` no longer re-exports the pure
  hover delay constant. Node/Playwright imports
  `account-menu-hover.ts` directly.
- `Verified`: mobile typecheck/lint, mobile unit `195/195`, API typecheck,
  API unit `158/158`, PostgreSQL integration `40/40`, focused Playwright
  `11/11` (account menu + wizard) with the three former failures repeating
  `30/30`, and the full disposable Chromium suite `49/49`.

## 2026-08-16 — Desktop account menu hover items

- `Implemented`: desktop account dropdown hover tracking uses `pointerenter` /
  `pointerleave` on the portal surface instead of a nested `Pressable` hover
  wrapper. Hovering Кабинет, Модерация or Выйти no longer schedules a dismiss.
  Coverage is in `account-menu-hover.spec.ts` (unit + Playwright).

## 2026-08-19 — Phase 7 screen splitting cleanup

- `Implemented`: Phase 7 component extraction keeps the same screen behavior while
  making screens orchestration-only (public seller, admin moderation, seller
  profile steps, and seller product-draft wizard steps). Verified with
  `pnpm --filter @bidplace/mobile typecheck`, `lint`, and `vitest` passing.

## 2026-08-19 — Phase 8 API products mapper/catalog query split

- `Implemented`: moved `publicCatalogProductSelect` and `toCreationStepContract`
  into `apps/api/src/products/products.mapper.ts` and updated sellers imports
  accordingly.
- `Implemented`: moved the canonical-listing CTE, status-aware catalog sort,
  and LIKE escaping (`publicCatalogCte`, `publicCatalogOrderBy`,
  `escapeLikePattern`) into `apps/api/src/products/products-catalog.query.ts`,
  keeping SQL behavior unchanged.
- `Verified`: `pnpm --filter @bidplace/api typecheck`, `lint`, unit `test`
  and integration `test:integration` passing.

## 2026-08-13 — Product Creation contract and E2E determinism

- `Implemented`: Product submit, moderation and public visibility now share the
  confirmed creator-made Product requirement boundary from `05-MVP-RFC.md`
  section 11 and `DEC-044`. `condition` and `packaging` remain supported
  nullable metadata but no longer block submission or public projection;
  `deliveryInfo` and the other confirmed required fields remain enforced. The
  shared public Product contract accepts the existing nullable representation.
- `Implemented`: Product Creation writes the selected wizard step to the URL,
  restores it after reload and keeps the author on the creation-story step after
  saving so a newly persisted step can receive its process photo before an
  explicit move to review. Image-picker read failures are visible and do not
  silently discard the selected operation.
- `Implemented`: the Playwright API web server builds the API workspace
  dependency graph before startup, preventing stale compiled contracts from
  being loaded with current application source. A 12-minute global watchdog
  prevents a stalled full suite from running indefinitely. Core public-route
  E2E now rejects legacy React Native Web `shadow*`, `pointerEvents` and
  `useNativeDriver` warnings.
- `Verified`: API unit `158/158`, mobile unit `156/156`, contracts `12/12`,
  PostgreSQL integration `40/40`, API/mobile typecheck and lint, Product
  Creation Playwright `1/1`, responsive Wave A `3/3`, core route/console Wave
  One `5/5`, the full disposable Chromium suite `38/38`, and Expo production
  export for web/iOS/Android pass. Fresh Product and Creator captures were
  inspected at 1440/1024/390. Matched Pen overlay, native device, screen-reader
  and founder acceptance remain `Needs verification`.

## 2026-08-12 — Final Pen v2 review blockers

- `Implemented`: public creator work pagination now preserves `status`/`sort`, loads additional server pages through `useInfiniteQuery`, and exposes loading/retry states in `apps/mobile/src/features/sellers/public-seller-screen.tsx`.
- `Implemented`: `SellersService.getPublic` applies canonical listing selection, filtering, ordering, counts and `LIMIT/OFFSET` in PostgreSQL before hydrating `publicCatalogProductSelect`; public lists do not select `ProductImage.data`. Coverage is in `apps/api/test/integration/seller-pagination.integration.spec.ts` and `apps/api/src/sellers/sellers.service.spec.ts`.
- `Implemented`: bid CTA eligibility is derived from the authenticated session and current rules response in `apps/mobile/src/features/auth/email-rules-gate.tsx` and `email-rules-eligibility.ts`; guests receive the login return route, admins remain excluded, and unavailable email/rules states do not expose an active bid action.
- `Implemented`: `AmbientImageBackground` uses the shared Expo `LinearGradient` primitive with explicit stops and a bounded 1.1× clipped media overscan; `apps/mobile/src/components/ui/ambient-image-background-style.spec.ts` covers the geometry contract.
- `Implemented`: Product About accordion rows close on repeated activation through one shared toggle helper with semantic expanded state.
- `Verified`: API unit `154/154`, mobile unit `143/143`, contracts `11/11`, API/mobile/database typechecks, API/mobile lint, PostgreSQL integration `40/40`, and the full disposable Chromium Playwright suite `38/38` pass on 2026-08-12. The five prior Playwright failures were corrected in the responsive Wave 2/Wave B evidence flows, product scroll assertion, and Wave C responsive selectors.
- `Partial`: all requested Final Pen v2 flows now have staged runtime implementations and browser evidence; matched Pen overlay comparison, native/device accessibility, and founder acceptance remain open. The canonical Pen baseline is the attached SHA recorded in the implementation audit.
- `Verified`: fresh Wave 2 catalog captures at 1440/1024/390 now reset the production catalog scroll container before capture, preserving the Pen frame's filters, title, state toolbar and grid in the evidence. The full Playwright suite remains `38/38` after this verification fix.
- `Partial`: final Pen v2 mobile header implementation now exists in `apps/mobile/src/components/layout/MobileHeader.tsx` and is selected below the shared 768px breakpoint. It provides the canonical 72px logo/Search/Create/Menu row, route-aware search/menu states, focus return and role-aware Create/Cabinet navigation. Runtime screenshots and browser/native accessibility acceptance remain pending.
- `Partial`: final Pen v2 auction participation now uses `SlideToBid` in `apps/mobile/src/components/ui/SlideToBid.tsx`. Product detail refetches the auction snapshot before confirmation, validates against the fresh minimum, and preserves the existing server/idempotency mutation. Unit `128/128` and targeted buyer/integrity Playwright `2/2` pass; full visual/device/accessibility acceptance remains pending.
- `Partial`: final Pen v2 Product Creation now has a staged `ProductDraftScreen` flow: draft description, 1–10 images, persisted creation story/process photos, review and moderation submit. The owner-only `GET /api/seller/products/:id` detail route hydrates `creationIntro`, ordered `creationSteps` and process-photo metadata before the wizard initializes; local empty state is not persisted while that detail is loading. The reload/save regression and full Playwright `38/38` pass; matched Pen overlay, native picker and accessibility acceptance remain pending.
- `Partial`: final Pen v2 mobile menu uses the shared `getMobileMenuWidth` contract (`min(320px, viewport - 32px)`) with 320/375/390 coverage in unit and browser tests. Visual/device/accessibility acceptance remains pending.
- `Partial`: final Pen v2 Creator Profile Creation now stages public identity, structured public links, profile photo, private handoff data and a public-only review before submit in `apps/mobile/src/features/sellers/seller-profile-screen.tsx`. Telegram, Instagram, website and handoff validation reuse shared contract schemas, show field-local errors and block progression while the server remains authoritative. Targeted creator profile Playwright coverage passes; visual/device/accessibility acceptance remains pending.
- `Partial`: final Pen v2 Admin Moderation now separates Authors and Works queues with search/status filters, filtered empty states, existing reasoned confirmations and server-owned status decisions in `apps/mobile/src/features/admin/admin-moderation-screen.tsx`. Targeted admin Playwright `1/1` passes; full responsive state screenshots and device/accessibility acceptance remain pending.

Последнее обновление: 2026-08-12
Статус: Public discovery completion is Partial; trust-critical backend
boundaries remain Implemented; founder visual/device/screen-reader acceptance,
full metadata migration and isolated 10-user rehearsal remain Needs
verification.

## Canonical Pen v2 design direction — 2026-08-10

- `Implemented` as documentation: `docs/design/00`–`07` is rebuilt as the
  canonical Pen-led design module. The former `docs/modern-ui/` design system
  and the old screen-prompt workflow are retired and removed.
- `Confirmed`: `design/pen/bidplace-web-v2.pen` is the immutable visual
  reference for UI implementation. Code work must never edit, delete, rename,
  move, replace, format, or resave it; only a separately authorized design task
  may change it, and it must never be deleted. See `DEC-062`.
- `Implemented` as protected source restoration: the founder-provided local
  file is restored byte-for-byte at `design/pen/bidplace-web-v2.pen`; SHA-256 is
  `685bc2dee4ca643869e678378bf849ab3189c4072b417670df6c64fa6c3181cf`.
  Canonical roots and the public read-only Pen publication were verified without
  modifying the canvas.
- `Implemented` as specification: selected Foundation/Gamma/Avant Arte patterns,
  card hover, button/menu/tab/sticky motion, artwork-derived blur/atmosphere and
  reduced-motion rules are recorded in design docs. These references do not add
  wallet/NFT/crypto or unsupported marketplace behavior.
- `Partial`: production UI uses Pen v2 foundation for GlobalHeader, Browse
  Works, Product states, Creator Profile, auth, seller editors and supporting
  routes. Public Home, Authors and Search routes now exist; matched visual,
  device and screen-reader acceptance remain open.
- `Partial`: Home/Works routing, Authors directory/API and discovery
  search/filter/sort contracts are implemented in `apps/api/src/discovery`,
  the Product/Seller services and the corresponding mobile routes. Creation
  process data and structured public social links are implemented and projected;
  matched visual/device acceptance remains open. `SellerProfile.discipline` is
  persisted and projected for public CreatorCard/profile surfaces.
- `Verified`: semantic tokens, Onest/Inter runtime loading, 1440/1024/390
  compositions, focused accessibility behavior, Product deep-link/back tabs,
  related public works, E2E and production Expo export. Founder/device visual
  acceptance remains a release gate.
- `Verified`: local/test discovery seed imagery covers eight distinct public
  catalog cards, with source attribution in
  `packages/database/prisma/fixtures/README.md`; the browser matrix confirms
  distinct main image sources without runtime dependence on external URLs.

## Pen v2 content and public-profile contracts — 2026-08-11

- `Implemented`: public Creator Profile detail now returns server-owned
  `statusCounts` for the visible `LIVE`/`SCHEDULED`/`ENDED` listings through
  `packages/contracts/src/public-seller.ts` and
  `apps/api/src/sellers/sellers.service.ts`; the profile UI renders those
  counts without exposing private seller or bidder data. API unit, contract,
  and seeded browser checks pass. Founder visual/device/screen-reader
  acceptance remains a separate release gate.

- `Implemented`: Product image contracts now carry nullable `width`/`height`,
  and `ProductCreationStep` stores validated process text plus optional image
  metadata/data behind the migration
  `packages/database/prisma/migrations/20260811010000_add_pen_v2_content_data`.
  Public Product detail returns `creationIntro` and ordered `creationSteps`
  with image URLs only; binary data remains outside JSON responses.
- `Implemented`: seller profiles persist structured nullable
  `telegramUrl`/`instagramUrl`/`websiteUrl` fields and public author detail
  returns only those public links plus paginated server-side works. Existing
  handoff contact and email fields remain private.
- `Implemented`: public catalog responses expose server-computed discovery
  facets for listing status, category, author, material and uniqueness, with
  confirmed price ranges carried through the URL-backed query contract.
  Product and creator work queries are filtered, sorted and paginated in the
  API rather than derived from a client page slice.
- `Implemented`: owner-only creation-story replace/reorder and creation-step
  image upload/read routes enforce approved-seller, editable-product and
  public-visibility boundaries in `apps/api/src/products` and
  `apps/api/src/images`; contract, API unit and PostgreSQL integration checks
  remain required evidence for the final visual release.
- `Partial`: Pen v2 screen composition is implemented through the shared shell;
  matched visual/runtime acceptance at 1440/1024/390 remains open. The canonical file
  `design/pen/bidplace-web-v2.pen` is locked at SHA-256
  `03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9`.
- `Implemented`: Browse Works and Browse Authors now use the shared Pen v2
  header/card primitives and server-backed category/material/status/sort state;
  the Works toolbar exposes a separate URL-backed `Статус` facet while the
  state tabs use the same source of truth. The Authors header context is
  `Авторы` / `Работы` with the cross-discovery search placeholder. Exact visual parity and
  responsive/device acceptance remain `Needs verification`.
- `Implemented`: Product hero uses the Pen three-region layout at desktop
  pressure, the compact AuctionPlayer keeps one bid mutation owner, and the
  Creation tab renders ordered API-backed intro/steps with safe process-image
  URLs. Bid validation, role restrictions and privacy behavior remain covered
  by the existing Product/Auction contracts and tests.
- `Verified`: the guarded Creation seed supplies four distinct process-image
  sources, and Product detail moves the same controlled AuctionPlayer between
  inline and fixed desktop placement after the hero scroll threshold. Product
  E2E covers the transition and restoration without changing bid ownership.
- `Implemented`: Public creator profile `/seller/[slug]` uses only the founder
  selected `MqUMz` frame, renders structured public links when present, and
  fetches status/sort/paginated works server-side. Private handoff contacts and
  user email remain outside the public projection.
- `Implemented`: the Product mobile reading flow keeps the shared validated bid
  form available alongside the sticky bottom action; the same mutation owner
  is used at desktop and mobile breakpoints. Creator status controls wrap at
  390px without horizontal document overflow.
- `Implemented`: the public Product share control now copies or shares the
  current Product URL with bounded Web/native fallbacks and visible result
  state. Discovery menus close through Escape/outside interaction, and Creator
  status controls expose semantic tablist/tabpanel relationships; mobile
  typecheck/lint and Product E2E pass.
- `Implemented`: Product About composes the canonical text, characteristics,
  packaging, payment/delivery and author sections from existing public Product
  and SellerProfile fields, with explicit honest states for unsupported details;
  Product layout E2E asserts the required anatomy.
- `Implemented`: public Creator Profile no longer maps the legacy `socialLink`
  into a website control; only structured public social fields are rendered,
  preserving the handoff-contact boundary.
- `Implemented`: Product About and public Creator Profile now receive one
  shared shell-level image-derived atmosphere. The public artwork/profile-photo
  URL is used only for a decorative blurred layer with neutral veil, lower fade,
  safe fallback and reduced-motion-aware appearance; no private fields or image
  binary data enter the UI. Fixed-scale visual and founder/device acceptance
  remain `Needs verification`.
- `Verified`: guarded local/test seed data now provides twelve public products
  and eight works for the primary public creator profile, with deterministic
  local media and `LIVE/SCHEDULED/ENDED` listing coverage. This supports the
  selected Creator Profile density without changing production contracts.

## Public discovery WIP — 2026-08-11

- `Implemented`: `packages/contracts/src/discovery.ts` defines normalized
  public query input/output, status, material, price/year and server sort
  contracts; contract tests cover defaults, trimming, unknown keys, length and
  invalid ranges.
- `Implemented`: `GET /api/discovery/home` returns separate top-auction,
  creator and new-work projections. Product and seller list services select the
  canonical public Listing before server-side filtering, sorting and
  pagination; the client no longer derives Home rankings from a page slice.
- `Partial`: `/`, `/works`, `/authors` and `/search` consume real API data and
  expose loading, empty and retry states. URL-backed Works status/sort controls,
  account popover and bottom-start discovery geometry are implemented, but
  matched 1440/1024/390 screenshots, physical-device QA and full accessibility
  acceptance remain open.
- `Implemented`: `CreatorCard` now follows the Pen anatomy by removing the
  outer card surface, CTA and unsupported work count. `SellerProfile.discipline`
  is persisted through the `20260811000000_add_creator_discipline` migration
  and returned by public/profile contracts; visual acceptance remains open.
- `Implemented`: local SMTP configuration accepts explicit `SMTP_AUTH_MODE`
  (`none` or `login`), treats empty local relay credentials as absent, omits
  Nodemailer auth in `none` mode, requires an explicit production auth mode and
  keeps production TLS/credential checks.
  Coverage is in `apps/api/src/core/config/env.spec.ts` and
  `apps/api/src/otp/otp.service.spec.ts`.
- `Implemented`: public Product discovery now selects canonical listing rows and
  applies filtering, ranking, count and `LIMIT/OFFSET` in PostgreSQL before
  hydrating the requested page. Catalog hydration uses explicit projections and
  does not select `ProductImage.data`; `endingSoon` ranks LIVE/SCHEDULED before
  ENDED and `newest` uses `publishedAt`.
- `Implemented`: `/api/sellers` now accepts only its supported `q`, pagination
  and `activity`/`name` sort contract. Discipline writes and responses share a
  `.max(160)` contract matching the database column.
- `Implemented`: desktop account-menu keyboard open moves focus to Cabinet (or
  Logout when Cabinet is unavailable); navigation and discovery Playwright
  expectations now use the current IA and `/api/discovery/home` interception.
- `Verified`: guarded local/test demo data now provides eight public products
  across scheduled/live/ended states, multiple author/price/uniqueness
  values, and eight approved creators with local thematic PNG media. Full
  Chromium E2E passes `35/35`; mobile unit,
  typecheck, lint and E2E fence also pass. Founder visual/device and
  screen-reader acceptance remain release gates.
- `Verified`: PostgreSQL integration `39/39`, full Chromium E2E `35/35`, mobile
  unit/typecheck/lint and E2E fence pass on the disposable local test database.

## Pen v2 completion and backend/security audit — 2026-08-10

- `Implemented`: Product tabs now use URL state (`about`, `creation`, `bids`)
  with deep links and browser-back restoration; semantic selected state is
  explicit. Product About reuses a shared `AuctionCardGrid` for real public
  works from the same author and never invents recommendation ranking.
- `Implemented`: public Bid history, Product images and realtime Listing joins
  now share the approved Product + approved SellerProfile visibility boundary.
  Non-public media is not marked with public immutable caching.
- `Implemented`: Product image count and aggregate-byte limits are enforced
  inside a serializable transaction across repeated/concurrent uploads, not
  only per multipart request.
- `Implemented`: public bidder aliases are deterministic within one Listing and
  differ between Listings; public UI no longer exposes or reuses a `userId`
  prefix. Duplicate SellerProfile/slug races map to a stable conflict response.
- `Verified`: monorepo typecheck 7/7, lint 2/2, contracts 7/7, API unit 145/145,
  mobile unit 113/113, PostgreSQL integration 39/39, Chromium Playwright 35/35,
  E2E fence and production build 7/7 including web/iOS/Android export.

## Test/demo author media — 2026-08-05

- `Implemented`: the local/test-only seed now uses the supplied 740×493 PNG for the approved demo author `Анна Морозова` (`anna-morozova`); anonymous `GET /api/sellers/:slug/photo` is intentionally allowed for approved public profiles, and the seeded Chromium test verifies both the direct guest HTTP response and the rendered natural dimensions. Existing databases must be re-seeded explicitly to replace the former transparent 1×1 row. Pending moderation fixtures continue using the technical 1×1 placeholder.

## Resilient remote media — 2026-08-05

- `Implemented`: `apps/mobile/src/components/ui/ResilientRemoteImage.tsx` centralizes public and seller/admin remote-image loading. It shows the existing layout-preserving placeholder on failure, retries at 1/3/8 seconds with a bounded three-retry schedule, changes the request URL/key for each retry, resets on successful load or URL change, and exposes a final `Повторить` action after the automatic retry budget is exhausted. Local `ImagePicker` previews remain outside this network retry path.
- `Implemented`: `apps/mobile/src/components/ui/media-recovery.ts` owns the retry state machine, cache-bust URL construction and query-string-free diagnostic sanitization. Development failures emit structured `media_load_failed` records without cookies, tokens or other URL query credentials.
- `Implemented`: AuctionCard, ProductGallery, public AuthorPhoto, admin Product media and remote seller/Product-draft previews use the shared component. `apps/mobile/e2e/media-resilience.spec.ts` covers first guest opening, aborted media fallback and sanitized diagnostic logs; the state-machine suite covers bounded retries, success, URL reset, cache-bust behavior and manual recovery.
- `Verified`: mobile typecheck/lint, media recovery unit 5/5 and targeted Chromium media resilience 2/2 passed on 2026-08-05. The API media terminal `@Res()` fix remains separate and unchanged.

## Wave 1 — trust-critical Order flows and test-only seed boundary — 2026-08-05

- `Implemented`: `apps/api/src/orders/orders.service.ts` and the existing controllers now enforce actor roles at the service boundary. Seller `contacted`, `completed` and `handoff-failed` transitions retain the existing statuses and payloads, while terminal repeats are rejected without a second audit event.
- `Implemented`: `apps/api/test/integration/order-mutations.integration.spec.ts` and `order-replacement.integration.spec.ts` run isolated PostgreSQL fixtures through the public OrdersService boundary. They cover allowed/forbidden seller, buyer, outsider and admin actors, cancellation reasons, terminal/repeated calls, privacy/contact snapshots, ranked Bid replacement, original Order history, append-only audit actor/status/reason/timestamp fields and the one-active-Order invariant.
- `Implemented`: `apps/mobile/e2e/order-handoff.spec.ts` uses the existing seller Order route and action, then reads the authenticated API projection to verify the persisted `CONTACTED` status. No UI route or product behavior was added.
- `Implemented`: `packages/database/prisma/seed.js` fails closed unless `NODE_ENV` is `development` or `test`, `APP_ENV=local` and `ALLOW_DESTRUCTIVE_DEMO_SEED=true`. `apps/api/test/integration/seed-contract.integration.spec.ts` executes the seed against a temporary PostgreSQL schema and verifies Bid count, current prices, counters, winner, buyer identity, one Order and production-like denial with no writes. `DEC-060` is Confirmed; demo Bids remain local/test-only and must be removed or replaced before real MVP release.
- `Verified`: API unit 136/136, contracts 7/7, PostgreSQL integration 20/20, API/mobile lint, API/database/mobile typecheck and Chromium Playwright 29/29 passed on 2026-08-05.

## Wave 2 — auction integrity: stale bid, scheduled bid, soft close — 2026-08-05

- `Implemented`: `apps/api/test/integration/auction-integrity.integration.spec.ts` exercises the ordinary buyer `BidsService` boundary against isolated PostgreSQL fixtures. It proves that a `SCHEDULED` Listing rejects a direct Bid without changing Listing timestamps, price, count, Bid history, audit state or realtime emission.
- `Implemented`: the same PostgreSQL suite creates one canonical snapshot for two buyers, accepts Buyer A's higher Bid, rejects Buyer B's stale minimum with the canonical server minimum, accepts the refetched retry, verifies two-Bid history, current price, count, winner Order and idempotent replay, and proves rejected writes leave persisted state unchanged.
- `Implemented`: PostgreSQL coverage proves the soft-close window is exclusive outside 60 seconds and inclusive at 60 seconds, persists each extension with the accepted Bid, supports the next Bid against the extended deadline, caps total extension at 600 seconds from `originalEndsAt`, rejects the cap boundary without writes, and closes only after the persisted extended deadline.
- `Implemented`: `apps/mobile/e2e/auction-integrity.spec.ts` proves the real Chromium reject → refetch → retry flow through the existing buyer UI and API. The test uses two ordinary verified buyers, confirms the stale attempt, observes the server error and canonical `11.50 BYN` minimum, retries successfully, and verifies API current price, bid count and history. Realtime is isolated only in Buyer B's test context so the initial snapshot remains genuinely stale; no production UI or contract change was made.
- `Verified`: API unit 136/136, API PostgreSQL integration 25/25, API/mobile lint, API/mobile typecheck and targeted Chromium Playwright 1/1 passed on 2026-08-05. No confirmed MVP rule or architecture boundary was changed.

## Wave 3 — core permission, moderation and lifecycle coverage — 2026-08-05

- `Implemented`: `apps/api/test/integration/seller-permissions.integration.spec.ts` runs real HTTP requests through the Nest app, session cookie, `BearerAuthGuard`, controllers, capability checks and PostgreSQL. Guest, ordinary buyer, pending/changes-requested/suspended owners, approved owner and another approved seller are covered for Product, Listing, ProductImage and SellerProfile writes, including denied Listing `PATCH` and image `DELETE`; pending/changes-requested/suspended cases target their own fixture Listing and ProductImage so the status gate is exercised before any ownership ambiguity. Denied paths compare persisted Product, Listing, ProductImage, SellerProfile and AuditEvent state before and after.
- `Implemented`: `apps/api/test/integration/moderation.integration.spec.ts` proves normalized seller application persistence and the existing admin SellerProfile/Product state machines, including SellerProfile `REJECTED`, Product `REJECTED`, accepted Product `ARCHIVED` and active-listing archive lock denial. Accepted transitions persist actor, old/new status, required reason and exactly one append-only AuditEvent; repeated, reasonless and scheduled/live-listing-blocked transitions leave persisted state unchanged.
- `Implemented`: `apps/api/test/integration/auth-transport.integration.spec.ts` proves HTTP registration normalization, session cookie and `/auth/me`, duplicate no-write behavior, allowed-origin login, HttpOnly/SameSite/Path/TTL cookie attributes, logout cookie clearing and session-version invalidation, stale/invalid session rejection and allowed/forbidden CORS response behavior. `apps/api/src/bootstrap.ts` is the shared HTTP configuration used by production `main.ts` and the integration helper, so CORS/proxy tests use the production bootstrap path.
- `Implemented`: `apps/api/test/integration/lifecycle-close.integration.spec.ts` proves no-bid close without winner/Order, canonical equal-amount/equal-timestamp tie ordering, aligned persisted Order/realtime event state and idempotent repeated close.
- `Verified`: API typecheck/lint, unit 136/136, PostgreSQL integration 37/37, mobile typecheck/lint, relevant Chromium Wave 3 5/5, full Chromium E2E 30/30 and `git diff --check` passed on 2026-08-05. No production product rule, status machine, API contract, UI or seed behavior changed.

## Runtime media and moderation hardening — 2026-08-05

- `Implemented`: `apps/api/src/images/images.controller.ts` and `apps/api/src/sellers/sellers.controller.ts` use terminal `@Res()` handling for manual binary responses. `apps/api/test/integration/media-transport.integration.spec.ts` requests an approved Product image and public SellerProfile photo anonymously, verifies `200`, `image/png` and exact bytes, then makes another API request after each response to cover the server lifecycle after media delivery.
- `Implemented`: `apps/mobile/src/features/admin/admin-moderation-screen.tsx` disables Product approval until the related SellerProfile is `APPROVED`, shows `Сначала одобрите автора`, refreshes both moderation queues after SellerProfile approval, and reports Product mutation errors according to the actual action. A new action clears the previous error state.
- `Implemented`: `apps/mobile/src/components/ui/AppDialog.tsx` expresses `pointerEvents` through the style object, removing the web warning without changing dialog behavior.
- `Verified`: API unit 136/136, PostgreSQL integration 38/38, mobile typecheck/lint, and the relevant Chromium moderation scenario 5/5 passed on 2026-08-05. No product rule, API contract, seed behavior or architecture boundary changed.

## Wave A — structural responsive fixes — 2026-08-02

- `Implemented`: A1 centralizes the confirmed responsive contracts in `packages/design-tokens/src/modern.ts`: desktop shell `1025`, catalog columns `900`/`1440`, rail width `72`, product portrait ratio `4/5` and the existing product detail measure `1180`. `AppShell`, `AppHeader`, Catalog and Product consumers use these shared values; `catalog-layout.spec.ts` covers 899/900/1024/1025/1439/1440 boundaries.
- `Partial`: A2 now portals the web account menu at every viewport, clamps its bottom-end geometry to an 8px viewport inset, returns focus to the trigger on Escape, and gives dialogs modal layer 30 with viewport-bounded internal scrolling. Unit/static evidence and browser coverage pass; physical-device and accessibility acceptance remain pending.
- `Implemented`: A3 now uses one catalog grid wrapper for loading and loaded cards, shared 4:5 media geometry for loaded/fallback/skeleton states, and separate atomic price and status/deadline rows. Unit, full static, Expo export, target-width screenshot/bounding-box and browser coverage pass; founder/device/accessibility acceptance remains pending.
- `Implemented`: A4 uses the requested product-wide contract at `900px`: the gallery switches to `440×550`, the author/title/auction block becomes two-column from that boundary, and below it the amount input stays in the scrollable auction panel while the bottom action contains only a short summary and one compact primary action with safe-area padding. Buyer/admin responsive E2E coverage preserves the existing server-side bid restrictions; first-viewport bounds and buyer/admin screenshots are captured at 1440/1024/390.
- `Implemented`: A5 uses compact `44px` buttons with `14px` radius, Inter `500/13/18` navigation typography, equal-width icon-over-label mobile navigation cells, `navigation` semantics instead of tablist semantics, and keyboard-scrollable auth viewports. Responsive browser coverage includes validation errors, enlarged-scale CTA reachability and auth evidence; founder visual/device/accessibility acceptance remains pending. No Wave B/C work is included.

## Wave B — shared component and visual-system fixes — 2026-08-02

- `Implemented`: B1 canonical semantic token surface and contrast roles are in `packages/design-tokens/src/modern.ts`; `AppText`, `TextField`, and the mobile runtime consume the modern surface. Verification: design-tokens build passed and `visual-token.spec.ts` passed 7 tests, including destructive button text on the danger surface.
- `Implemented`: B2 shared focus-visible/reduced-motion contracts, 44px logo/author hit areas, and single-name composite image/icon semantics are in the mobile shared primitives. Mobile typecheck/lint passed; the targeted B2 suite passed 16 tests.
- `Implemented`: B3 shared buttons retain 56px default/44px compact geometry; text-only labels are centered without an idle icon gap, and loading uses an invisible sizing layer plus absolute spinner. Updated button unit and browser centering/width coverage passes; mobile typecheck/lint passed.
- `Implemented`: B4 centralizes the 4:5 media contract and narrow AuctionCard metadata geometry, and adds a reusable plain EditorialSection without changing Product order or auction flow. Targeted media/card coverage passed 11 tests; mobile typecheck/lint passed.
- `Implemented`: B5 PageState separates loading/empty/error/retry and is now used by ProductDraft, ListingDraft and Order route-level loading branches; AppDialog preserves modal layer, bounded scroll, and accessibility semantics, including focus return on cancel/Escape. Targeted state coverage passed 9 tests; route-level browser evidence passes for all three loading branches.
- `Implemented`: B6 localized seller/admin/order presentation paths and date-time normalization live in `apps/mobile/src/lib/presentation.ts`; `SelectableRow` preserves raw API values while presenting 44px localized choices. Adapter coverage passed 12 tests; mobile typecheck/lint passed.
- `Implemented`: final Wave B evidence includes 13 Vitest files / 58 tests and 24/24 disposable PostgreSQL Playwright tests; 21 target-width screenshots are in `/private/tmp/bidplace-wave-b-screenshots`.
- `Partial`: the overall product status remains Partial until founder physical-device, screen-reader, and visual acceptance is recorded.

## Wave C — screen polish and final visual acceptance — 2026-08-03

- `Implemented`: C1 catalog polish preserves the no-heading catalog, confirmed 2/3/4 columns, shared 4:5 bounds and separate price/status-deadline rows. Loading/loaded/failed-media evidence is in the C7 targeted spec.
- `Implemented`: C2 Product detail uses `EditorialSection` for linear story/history/bids and keeps `AuctionPanel` as the only transaction block. `BottomActionBar` remains summary + CTA; bid validation, OTP/rules, realtime, privacy and API contracts are unchanged.
- `Implemented`: C3 public author and purchases use 120px identity fallback, shared responsive AuctionCard grid and divider-led activity rows with existing role-safe data.
- `Implemented`: C4 seller/profile/draft screens use capped previews, 160×200 contain media rows, truthful failed-media states and strict calendar/time validation for readable listing date input with existing ISO serialization and server lock/upload/delete/reorder behavior.
- `Implemented`: C5 admin/order presentation uses two desktop queues within 1180px, compact moderation row actions, author text links, localized order cancellation reason and long-value-safe rows without changing permissions or lifecycle rules.
- `Implemented`: C6 auth copy and shared PageState/Skeleton loading semantics cover truthful registration, one loading announcement, plain-language retry errors and keyboard/zoom-compatible existing forms.
- `Implemented`: C7 targeted `apps/mobile/e2e/wave-c-screen-acceptance.spec.ts` passed 4/4 and the full repository `mobile test:e2e` passed 28/28 with Docker PostgreSQL; 66 commit-stamped screenshots are in `/private/tmp/bidplace-wave-c-screenshots/a852f68` across the 1440×900, 1024×900 and 390×844 route/role/state matrix, including catalog roles, author empty/error, long activity rows and responsive overlay states. Final founder physical-device/screen-reader acceptance remains the remaining gate.

## Runtime defect hardening — 2026-07-31

- `Implemented`: `OverlayHost` now supplies the web overlay boundary through a memoized callback ref; `OverlayPortal` waits for both the boundary and anchor rectangle, and navigation/account anchors use ref-supporting `View` wrappers. Web pointer-events are expressed through styles. Existing account hover/click/focus, Escape/outside dismissal and logout behavior remain in scope.
- `Implemented`: `ImagesController.get` and `SellersController.getPhoto` convert Prisma `Uint8Array` payloads to Node `Buffer` before Express sends them. Controller coverage verifies PNG signature bytes, `image/png`, 200-path handling and anonymous private-media rejection.
- `Partial`: seeded Catalog/Product natural-width assertions, real overlay-host child/visibility/logout assertions, and the 14-test disposable PostgreSQL Playwright suite are historical evidence from the prior baseline; the suite was not rerun against the current moderation/lifecycle changes because PostgreSQL was unavailable. Playwright explicitly disables existing-server reuse; its test-only forwarded IPs keep the production login rate-limit policy unchanged while isolating fixture sessions.

## Волна 1 — private web session, seed and truthful states — 2026-07-30

- `Implemented`: local browser/API configuration uses canonical `http://localhost` origins (`apps/mobile/src/lib/environment.ts`, Playwright webServer and the local CORS bootstrap fallback in `apps/api/src/main.ts`). The fallback is restricted to `NODE_ENV=development` plus `APP_ENV=local`, with production coverage in `apps/api/src/core/config/env.spec.ts`. Requests still use `credentials: 'include'`; the HttpOnly `bidplace_session` cookie, guards and restricted CORS policy were not weakened.
- `Implemented`: `(public)` and `(auth)` now own Expo Router layouts, removing the root references that caused the two legacy route warnings. Public URLs remain unchanged.
- `Implemented`: activity keeps the server-provided empty array separate from network/5xx errors; seller onboarding treats only API 404 as an absent profile; moderation shows pending actions, non-repeatable approval controls and explicit empty sections.
- `Implemented`: the guarded local seed creates four public Products with four local PNG fixtures in `SCHEDULED`, `LIVE`, `ENDED` and a second `SCHEDULED` state, eight approved creator profiles with local profile photos, plus pending SellerProfile and pending Product fixtures. The pending Product remains private because it is `PENDING_REVIEW` and has no public listing.
- `Partial`: `apps/mobile/e2e/wave-one.spec.ts` covers authenticated activity, account logout, new-user seller form, non-admin admin denial, admin approval and reasoned limiting actions, admin bid/activity restrictions and route-warning regression; current browser execution passes as part of the 24-test disposable suite. Founder device/accessibility acceptance remains.
- `Implemented`: moderation limiting actions now require a reason in the shared contract, persist the reason in `AuditEvent`, expose the latest reason and unified `hasBlockingListing` guard in the admin projection, and use `CHANGES_REQUESTED` for ordinary Product correction requests. Scheduled and live listings are blocked by the moderation service; lifecycle activation and bid eligibility also require approved Product and SellerProfile state. API/admin/lifecycle unit and contract coverage passes; browser verification for this wave remains pending without disposable PostgreSQL.
- `Partial`: public author navigation now reuses `GET /api/sellers/:slug/detail` through `/seller/[slug]`, and Product detail links to the author. The generic ended-auction Activity CTA was removed; only an existing winner Order link remains. Device/accessibility acceptance and browser verification remain pending.

## Волна 2 — web UI polish — 2026-07-30

## Wave 2 — catalog/product layout — 2026-08-01

- `Partial`: `product-list-screen.tsx` now starts the catalog grid after the desktop rail, removes the visible Catalog heading/count, and lets `AuctionCard` show stable media, author, title, short description, atomic price with `BYN` and secondary listing status/deadline. Loading, empty, error, query, filters, pagination and seed data are unchanged.
- `Partial`: `product-screen.tsx` now places gallery, author/title and auction together in the desktop top block, preserves the mobile gallery → author/title → auction order, and renders item story, item history and bid history linearly. Auction/bid/realtime/auth logic and public contracts are unchanged.
- `Implemented`: shared `Button` defaults to content width; `compact` and explicit `block` variants are available through `button-layout.ts`, with focused unit coverage in `Button.spec.ts`. `AppDialog` has a desktop max width; media uses stable contain presentation and existing fallbacks.
- `Implemented`: screenshots at 1440/1024/390 px are captured in `/private/tmp/bidplace-wave2-screenshots`; the full disposable PostgreSQL Playwright suite passes 24/24, including catalog/product/dialog and Wave A responsive coverage. Founder device/accessibility and reduced-motion acceptance remain separate.
- `Implemented`: mobile header layout below 1025 px no longer renders the desktop account row; `AppHeader` keeps one bottom divider and no navigation top divider. The 390 px screenshot E2E asserts the first seed card begins directly after navigation; desktop layout remains covered by the full 24/24 suite.
- Deferred by scope: 10–15 works, pagination, search, filters, tags, favorites and recommendations.

- `Partial`: desktop web now has a white canvas, 72 px icon rail and desktop right-side account menu; mobile keeps account access in the AppHeader brand row. `OverlayHost` portals account dropdowns and rail tooltips above content using trigger-rectangle positioning. Account menu supports click, desktop hover and keyboard focus, with hover dismiss after leaving both trigger and dropdown, route-change reset, Escape/outside dismissal resetting keyboard state and a visible pending-aware `Выйти` action. SellerProfile-derived navigation exposes cabinet/add-product only for `APPROVED`; admin navigation remains Catalog + Moderation.
- `Implemented`: admin bid placement is denied in `BidsService`, admin buyer Activity is denied at `ActivityController`, and Product detail does not request buyer Activity or render a bid form for admin. `BidsService` unit coverage and admin browser API assertions cover the rule.
- `Partial`: public catalog includes approved Products whose Listing is `SCHEDULED`, `LIVE` or `ENDED`, using a shared `LIVE` → `SCHEDULED` → latest `ENDED` selector; the open-only default filter is deferred. Current guarded seed and browser `naturalWidth` checks cover four public demo products, including the fourth card needed for the desktop catalog density. Final founder visual/device/accessibility acceptance is still pending.
- `Partial`: shared `PageHeader`/`PageState` and Product linear section presentation cover the main loading, empty, retry, author, authored-item facts, publication date and public history states; bid history now distinguishes loading, error/retry and empty/data states. Browser automation covers mobile header placement, guest/pending/approved navigation, desktop account hover/focus, admin restrictions and seeded buyer/media states; Wave C targeted evidence is current, while final founder visual/device/accessibility acceptance is still pending.

## Local seed password handling — 2026-07-30

- `Implemented`: `packages/database/prisma/seed.js` now accepts the local-only `SEED_ADMIN_PASSWORD`, hashes it with Argon2 before creating the deterministic admin, seller and buyer records, and never writes the plaintext password to the database. Runtime login continues to verify the submitted password against `User.passwordHash` through `apps/api/src/auth/password-hasher.service.ts`.
- The previous `SEED_ADMIN_PASSWORD_HASH` variable is no longer read by the seed. A local database reset must provide `SEED_ADMIN_PASSWORD` and rerun the guarded demo seed.

## Visual polish — 2026-07-30

- `Implemented`: the light branding source assets are stored in `apps/mobile/assets/branding/`; the current Pen v2 `BrandLogo.tsx` uses the black `bidplace-logo.png` mark at the canonical `38×30` header geometry, while `app.json` uses the light favicon. The separate `bidplace-wordmark-light.*` asset remains available but is not the current Pen v2 header target. The previous placeholder border and duplicated text lockup were removed. Expo web/native rendering still needs founder visual/device acceptance because the supplied source assets are SVG.
- `Partial`: `apps/mobile/src/components/layout/AppShell.tsx` now provides the shared 1025 px responsive shell; all screens that used the repeated `SafeAreaView + AppHeader` composition use the shell, with mobile bottom actions and scroll ownership preserved.
- `Partial`: `apps/mobile/src/lib/environment.ts` provides `getApiAssetUrl`; Catalog/Product/seller profile/Product draft media use it. `ProductGallery` and `AuctionCard` display labeled unavailable-image states after load errors. API image authorization and seeded live-media/device behavior still need direct founder/device verification.
- `Partial`: `product-screen.tsx` places desktop gallery and auction panel in the same row and keeps mobile gallery → auction facts → linear detail sections → bottom action ordering. Auction business logic, realtime refetch, privacy and contracts are unchanged.
- `Partial`: `AppHeader.tsx` applies desktop nav geometry on the Expo Router `Link` itself, so the active Catalog item remains visible on web; `AppIcon.tsx` no longer forwards the native-only `accessible` prop to SVG DOM nodes. `apps/mobile/e2e/navigation.spec.ts` covers the visible root link and the warning regression.
- `Partial`: Login field validation now maps invalid email/password input to Russian messages, while server error handling remains generic/safe for unrecognized errors.
- Automated evidence for this snapshot: mobile typecheck, lint, unit tests (33/33), E2E fence, Expo web export and isolated headless web smoke passed; the smoke found a visible `/` Catalog link and no `accessible` warning. Founder visual/accessibility/device acceptance remains required; no route status is changed to `Implemented`.
- `Partial`: the historical disposable Playwright suite covered the auction creation, bidding and closing regressions; its 14-test result is not current verification for this branch because the rerun could not start without PostgreSQL.

## Auth logout resilience — 2026-07-30

## Author email verification gate — 2026-09-26

- `Implemented`: `VerifiedEmailGuard` checks persisted `User.emailVerifiedAt`
  after Bearer authentication on Author application/profile, Work, image, and
  achievement mutations. Existing unverified drafts and legacy unverified
  approved authors fail closed, while public and owner reads remain available.
- `Implemented`: authenticated `/verify-email` reuses the existing OTP API,
  refreshes `['user','me']` after success, and returns only to a validated
  internal Author destination. Full production SMTP delivery remains `Needs
verification` in staging.

- `Implemented`: `POST /auth/logout` uses `LogoutAuthGuard` to identify only a valid current session. It always clears the session cookie, including when the submitted cookie is missing, expired, malformed, or stale; server-side session invalidation runs only for an authenticated current session. `apps/api/src/auth/logout-auth.guard.spec.ts` covers invalid, stale, and current tokens.

## Auction browser E2E — 2026-07-28

- `Implemented`: three independent Playwright scenarios cover seller Product draft/submission and scheduled Listing preview (`apps/mobile/e2e/auction-creation.spec.ts`), two-buyer canonical bid/outbid/minimum behavior (`auction-bidding.spec.ts`), and lifecycle-driven close with winner Order and loser privacy (`auction-closing.spec.ts`). Shared setup lives in `e2e/support`; there is no `.state.json` or serial dependency.
- `Verified`: `test:e2e:auction` passes against disposable local `bidplace_e2e`; mobile typecheck, E2E lint and the disposable-database fence pass.

## Реализовано

| Поведение                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical storage model          | `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/20260716000000_baseline/migration.sql`: nullable `phone`, `email_verified_at`, `TermsAcceptance`, `EmailVerificationCode`, moderation enums, handoff snapshot fields and append-only `AuditEvent` are present with the expected partial indexes.                                                                                                                                                                                                                                                                                                                                                                                 |
| Product and Listing rules        | `apps/api/src/products`, `apps/api/src/listings`, `apps/api/src/admin`, `apps/api/src/sellers/seller-capability.ts`, `apps/api/src/products/public-visibility.ts`: draft Product, submit-to-review, approval gate, owner lock after `SCHEDULED`/`LIVE`, shared public visibility predicates and BYN-only auction rules.                                                                                                                                                                                                                                                                                                                                                                                         |
| Seller privacy and image reorder | `apps/api/src/orders/orders.service.ts`, `apps/api/src/images/images.service.ts`: buyer-facing Order projections hide seller contacts in `SELLER_CONTACTS_BUYER`, keep them in `BUYER_CONTACTS_SELLER`; image reordering avoids unique-position collisions and aggregate count/byte capacity is enforced transactionally across uploads.                                                                                                                                                                                                                                                                                                                                                                        |
| Bids and soft close              | `apps/api/src/bids`, `apps/api/src/core/auction/pricing-policy.ts`, `apps/api/src/bids/bid-eligibility.ts`: serializable transaction, idempotency key, self-bid gate, compare-and-update, Listing-scoped public aliases, BYN increment policy, first-bid start-price floor, 60/60/600 soft close, email verification and versioned rules acceptance.                                                                                                                                                                                                                                                                                                                                                            |
| Lifecycle and Order              | `apps/api/src/lifecycle`, `apps/api/src/orders`, `apps/api/src/orders/order-snapshot.ts`, `apps/api/test/integration/order-mutations.integration.spec.ts`, `apps/api/test/integration/order-replacement.integration.spec.ts`: scheduler activation/closing, deterministic winner, atomic Order foundation, role-gated seller handoff, manual admin cancellation/replacement, immutable snapshots and append-only audit. PostgreSQL tests cover terminal repeats, unauthorized actions, ranked replacement and one-active-Order behavior.                                                                                                                                                                        |
| Email verification and rules     | `apps/api/src/otp`, `apps/api/src/auth`, `apps/api/src/core/rules.ts`: hashed one-time OTP, expiry, retry/cooldown/rate limiting, production SMTP transport via nodemailer, versioned service-rules text and test-only bypass validation. Password recovery: `apps/api/src/password-reset`, `PasswordResetToken`, neutral forgot + session-invalidating reset.                                                                                                                                                                                                                                                                                                                                                  |
| Public and realtime API          | `packages/contracts`, `packages/api-client`, `apps/api/src/products/public-visibility.ts`, `apps/api/src/realtime`: public Product, Bid history, media and socket joins share approved Product/SellerProfile gates; projections exclude seller internal identifiers and buyer PII; sockets are origin allow-listed, credential-free, IP rate-limited and room-capped; mobile uses HTTP as canonical snapshot and refetches on reconnect/events.                                                                                                                                                                                                                                                                 |
| Local reset and seed             | The reset guard is present. The deterministic local/test-only seed creates four approved demo Products with local PNG fixtures (three auction states plus a second scheduled vase), eight approved creator profiles with local profile photos, plus pending seller/product moderation fixtures. Bid/Order fixtures require an explicit local/test profile and fail closed in production-like environments; `apps/api/test/integration/seed-contract.integration.spec.ts` verifies current price, bid count, winner and Order consistency. The dedicated `test:e2e-fence` guard and disposable guarded seed smoke pass; the public catalog includes the four approved Products and excludes the pending Product. |
| Prisma generated client          | `packages/database` generates its custom Prisma Client before build. The generated directory is intentionally ignored and is not part of the source baseline.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Partial / needs verification

Current verification (2026-08-12): API/mobile/database typechecks and lint,
API unit 154/154, mobile unit 143/143, contracts 11/11, PostgreSQL integration
40/40 and disposable Chromium Playwright 38/38 pass. Founder visual/device/
screen-reader acceptance and the isolated 10-user rehearsal remain pending.

| Area                          | Current evidence                                                                                                                                                                                                                                                                                                                        | Remaining gap                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seller and admin mobile flows | Seller profile, Product draft/edit, Listing draft and `/admin` use the Pen v2 shared primitives. Product retains server edit locks, aggregate image limits, upload/delete/reorder and preview; Listing retains server validation and explicit schedule; destructive admin actions require confirmation while API remains authoritative. | Runtime implementation and automated evidence are complete; founder physical-device/accessibility acceptance remains.                               |
| Product detail UX             | `/product/[publicId]` has gallery/atmosphere, value fields, AuctionPlayer, URL-backed About/Creation/Bids tabs, Listing-scoped aliases, related public author works, OTP/actions, Activity participation, Order link and realtime refetch.                                                                                              | Founder pixel review, physical-device and screen-reader QA remain.                                                                                  |
| Tests                         | API/mobile/database typechecks and lint, contracts 11/11, API unit 154/154, mobile unit 143/143, PostgreSQL integration 40/40, E2E fence and disposable Chromium Playwright 38/38 pass; Expo iOS/Android exports pass.                                                                                                                  | Formal Pen pixel-diff overlay, native physical-device and founder screen-reader acceptance remain deferred; the isolated 10-user rehearsal remains. |
| Operations                    | Single-process scheduler and Socket.IO gateway work for MVP. Root `dev` and direct mobile start commands build workspace dependencies first, preventing stale package output at runtime.                                                                                                                                                | Multi-instance deployment requires a distributed lock or external queue before scaling; binary database image storage remains pilot-only.           |

## Historical Modern UI implementation baseline — 2026-07-27

This section is a dated historical record and is superseded by the canonical
Pen v2 section above. References to `modernTokens`, `components/modern-ui`, the
left rail and absence of `components/ui` callers no longer describe runtime.

- `feature/modern-ui-final` starts from the documentation baseline before the experimental pilot; the pilot bridge is not the accepted production strategy.
- The redesign has migrated all existing working mobile routes and removed Tamagui, the legacy mobile UI kit, legacy palette/theme exports and Cormorant runtime loading. Server-authoritative auctions, email/rules gates, privacy projections, moderation and seller locks remain unchanged.
- Bid confirmation and client-side increment validation remain confirmed UI behaviour; backend remains authoritative. See `DEC-055`, `DEC-056` and the current design handoff in `docs/design/05-DESIGN-HANDOFF.md`.
- Final UI cutover is Partial final migration: `apps/mobile` has one light-only React Navigation theme derived from `modernTokens`, Inter and PT Mono loading, no production Tamagui or `components/ui` callers, and final navigation on every route. Catalog (`/`) retains its existing API query and public route. Founder iOS/Android, browser/device visual and accessibility acceptance remain required.
- Product/Bid final content is Partial: `features/products/product-screen.tsx`, `features/auth/email-rules-gate.tsx` and `components/modern-ui/AuctionPanel.tsx` render the Product facts, desktop contextual auction panel, mobile safe-area action, OTP/rules gate, confirmation and retry through final primitives. `bid-validation.ts` still validates the confirmed BYN increment table; unknown/no participation requires confirmation; same-amount retry preserves its idempotency key; stale/rejected mutations refetch canonical Product/Bid/Activity projections. The API remains authoritative for minimum, Listing state and close. Final global navigation, iOS/Android smoke and accessibility evidence remain.
- Activity final content is Partial: `features/activity/activity-screen.tsx` renders the server-projected participation and authorized Order link through final `ActivityRow` UI. Shared navigation, device smoke and accessibility evidence remain.
- Order final content is Partial: `features/orders/order-screen.tsx` preserves buyer/seller/admin server projections and seller action refetches through final primitives; the irreversible handoff-failed action now has explicit client confirmation. Full device and accessibility evidence remains.
- Auth final content is Partial: `features/auth/auth-form.tsx` retains RHF/Zod validation, safe redirect and user-facing recovery through final form primitives; forgot/reset flows live in `(auth)/forgot-password`, `(auth)/reset-password` with neutral success and invalid-link states. Device and accessibility evidence remains.
- Seller profile final content is Partial: `features/sellers/seller-profile-screen.tsx` retains the server `CHANGES_REQUESTED` edit lock and multipart public-photo contract through final primitives. Device acceptance evidence remains.
- Seller Product draft/edit is Partial final migration: `features/sellers/product-draft-screen.tsx` uses `FormSection`, `TextField` and final media/actions, preserves create/update/submit, server locks, image upload/delete/reorder, and confirms only image deletion. Creator input no longer asks for `condition`; an existing returned value is read-only. Listing draft and `/admin` likewise use final primitives, with explicit Listing scheduling and confirmed destructive admin actions. Automated evidence is complete; founder acceptance remains.

## Confirmed MVP implementation gaps — 2026-07-23

This is a dated backlog snapshot. Current implementation and verification facts
in the 2026-08-10 sections above supersede its old rerun/test-count wording;
remaining product boundaries still apply.

| Area                                     | Status             | Required implementation evidence                                                                                                                                                                                                                                                                   |
| ---------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public seller application and capability | Partial            | `POST/PATCH /seller/profile`, seller status projection and the seller-write capability gate now exist, and the mobile application screen uses multipart photo upload; prior closed-pilot browser/E2E evidence is historical and current rerun remains Needs verification.                          |
| Seller profile data                      | Partial            | Handoff contact, handoff initiator, immutable public `fullName`, profile photo upload/public URL and `CHANGES_REQUESTED` edit flow for public and handoff fields now exist in schema, API and mobile; prior browser seller-path evidence is historical and current rerun/device QA remain pending. |
| Product moderation and visibility        | Implemented        | `submit`, admin moderation service, reasoned `CHANGES_REQUESTED` correction flow, `REJECTED` owner edit/resubmit on the same Product (`DEC-071`), LIVE-listing guard, audit records, `publishedAt`, one-image approval gate and shared public catalog/direct visibility predicates are in place.   |
| Seller handoff actions                   | Implemented        | Order snapshots contacts plus frozen deal fields (`DEC-074`); seller inbox `GET /api/orders` is session-scoped and paginated; seller actions and admin replacement/cancellation preserve audit and role-scoped projections.                                                                        |
| Timestamps                               | Partial            | Most mutable records have timestamps; the confirmed all-entity `createdAt`/`updatedAt` and Product `publishedAt` requirement is not yet implemented.                                                                                                                                               |
| Pilot analytics                          | Implemented        | First-party ingest + admin `/admin/analytics` dashboard (`DEC-067`). Canonical events in `analytics-contract.md`; metrics definitions in `analytics-metrics.md`. Remaining RFC §16 names are DB-derived or deferred, not duplicate analytics events.                                               |
| Production email verification            | Implemented        | `apps/api/src/otp`, `apps/api/src/auth`, `apps/api/src/bids/bid-eligibility.ts` now enforce SMTP-backed email verification, versioned rules acceptance and a test-only bypass that stays disabled in production.                                                                                   |
| Closed-pilot rehearsal                   | Needs verification | Chromium Playwright now covers the buyer path, seller/admin browser flow, seller handoff actions, and the order privacy matrix against disposable PostgreSQL; the isolated 10-user rehearsal still needs to be run.                                                                                |

## Intentional MVP boundaries

## Author onboarding and resumable drafts — 2026-09-23

- `Implemented`: `SellerProfile.status` and `SellerProfileRevision.status` now
  begin as `DRAFT`; `POST /api/seller/profile` persists the profile photo and
  canonical editing revision without submitting either for moderation.
  `SellersService.update` updates the unpublished parent mirror and editing
  revision together under the existing row lock; `submitProfileRevision` moves
  the saved revision and parent to `PENDING_REVIEW` only after server-side
  requirements pass. Drafts are excluded from `/api/admin/seller-profiles` and
  existing public predicates continue to expose only approved authors.
- `Implemented`: `SellerProfileScreen` is a four-step, URL-owned author
  application: basic information, optional public contacts, required author
  information, then optional achievements. `SellerProfile.applicationStage`
  is private, server-owned resume state; guarded advancement prevents a draft
  from skipping locked steps and submission clears it only after complete
  server validation in the existing locked transaction.
- `Implemented`: partial `DRAFT` profiles keep only step-three fields nullable
  and remain excluded from public discovery and moderation. `publicEmail` is
  explicit author-provided data, normalized and published only with an approved
  author; it is never derived from `User.email`. Achievement dates preserve
  month versus day precision, with undated legacy records remaining undated.
  Mobile/device and Playwright acceptance remain Needs verification.

## Mobile query normalization — 2026-09-26

- `Implemented`: `categoryKeys.all` is the sole React Query identity for
  `api.categories.list()` in the Work editor, catalog, public Author and Search.
  Public Author category selection is a validated URL parameter and one infinite
  query owns the current Author header and Work pages.
- `Implemented`: Search Works and Authors expose explicit next-page loading with
  the current React Query infinite queries. Browser E2E policy remains manual-only.

- Only `ListingType.AUCTION` and `BYN` exist.
- No `Lot`, central `Auction`, Buy Now, reserve price, reserve UI or USD fixture remains in the runtime model.
- Payment, delivery, chat, automatic winner replacement and notifications are not implemented.
- Manual admin replacement preserves cancelled Order history; automatic replacement is Planned.
- Domain/security tasks do not absorb incidental visual work. The new Pen v2 refactor is governed by `DEC-062` and `docs/design/07-PEN-V2-UI-AUDIT-AND-IMPLEMENTATION-PLAN.md`; `DEC-056` remains authoritative for bid confirmation and client validation.

## Historical closed-pilot verification — 2026-07-19

- Frozen workspace install; full lint and typecheck; API build; Expo web export; Prisma validation; isolated reset and seed passed.
- API typecheck passed on the current tree.
- API unit suite passed: 20 files, 86 tests.
- API integration suite passed: 2 files, 8 tests, against local PostgreSQL.
- Production SMTP env validation passed in `apps/api/src/core/config/env.spec.ts`.
- Chromium E2E, mobile typecheck, lint and seed reset were not rerun in this snapshot.

## Task B Editorial Redesign — 2026-07-19

- Task B Editorial Redesign завершена.
- Выполнен основной type-safety commit.
- Выполнено исправление explicit protected admin route в коммите `79e6ad7` (admin URL теперь `/admin` и защищён administrative guard).
- Проверки: mobile TypeScript проходит; targeted ESLint изменённых файлов проходит; `expo export --platform web` проходит (SPA refresh `/admin` в production зависит от hosting fallback на `index.html`).
- Результаты ручного smoke-test:
  [ЗДЕСЬ Я ВСТАВЛЮ РЕАЛЬНЫЕ РЕЗУЛЬТАТЫ:

- `/` как гость:
- `/admin` как администратор:
- refresh `/admin`:
- `/admin` как обычный пользователь:
- mobile drawer 375 px:
- desktop navigation 1440 px:
- переключение 1024/1025 px:
- browser console:
- краткая проверка основных экранов:
  ]

## Post-Task-B release hardening TODO

- WebKit and full cross-browser matrix; physical-device QA; visual regression; exhaustive seller/admin E2E; full accessibility automation; ten-session browser rehearsal.

## Checks executed for this snapshot

- `packages/database`: Prisma client generation and TypeScript build completed against the updated seller-profile schema.
- `packages/contracts`: TypeScript build completed after seller-profile, order and auth contract updates.
- `packages/api-client`: TypeScript build completed after multipart seller application and auth response updates.
- `apps/api` typecheck passed.
- `apps/api` build passed.
- `apps/api` unit Vitest suite passed: 25 files, 115 tests.
- `apps/api` integration Vitest suite passed against local PostgreSQL after the order snapshot regression was fixed.
- `apps/mobile` typecheck passed after the buyer/seller order projection fixes.
- `apps/mobile` build passed (`expo export`).
- `apps/mobile` Playwright closed-pilot browser suite reran against the current code with Docker PostgreSQL; 24/24 tests passed, including Wave 2 screenshots and Wave A responsive checks.
- `corepack pnpm lint` passed once Turbo was forced through the pinned pnpm 11.7.0 wrapper.
- `corepack pnpm format:check` failed with repo-wide Prettier warnings across 162 files.

See `10-CODE-ARCHITECTURE.md` for boundaries and `05-MVP-RFC.md` for product contract gaps.
