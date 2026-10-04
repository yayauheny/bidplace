# R29 preparation — E2E scope plan — 2026-10-03

2026-10-04 follow-up: author/Work failures and replacement evidence are owned by
[`12-PORTFOLIO-MVP-RELEASE-AUDIT.md`](12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
The media lifecycle has a separate browser owner,
`work-media-lifecycle.spec.ts`, run with `playwright.media.config.ts` because it
uses a test transport server. Integration/release regression must run both the
maintained default browser suite and that media gate. This does not close R29/T05.

Plan only. No E2E file, Playwright config, or fixture was edited. Playwright was not executed, so this document does not report durations or a smaller suite. Declaration count: 26 files under `apps/mobile/e2e`, 100 `test(` calls. That is AST, not a browser run.

A DELETE PROPOSAL below is a proposal. It is not a deletion. Each one names the current owner and the replacement, or the product copy that is absent from `apps/mobile/src`.

R25 stays a plan. Browser Back tests are not replaced by the jsdom route guard.

## Catalog page 2 fixture

Production page sizes stay `WORKS_PAGE_SIZE = 12` (`apps/mobile/src/features/products/portfolio-works-query.ts`) and `AUTHORS_PAGE_SIZE = 8` (`apps/mobile/src/features/sellers/portfolio-authors-query.ts`).

The hook tests already use 13 works and 9 authors with an overlapping id (`use-portfolio-catalog-hooks.spec.ts`, H02). Those tests do not click «Показать ещё» in a browser.

Conditional browser branches, which skip page 2 when the seed has no next page:

- `apps/mobile/e2e/discovery-launch.spec.ts` lines 55–82, inside `Works keeps filters in the URL and paginates without duplicates`. `hasNextPage` is computed from the live first response. The button is clicked only inside that branch. Otherwise the test expects the button count to be 0.
- `apps/mobile/e2e/figma-stabilization.spec.ts` lines 41–50, inside `Works sort, URL, back, and pagination stay server-owned`. The button is clicked only when `more.isVisible()`.
- `apps/mobile/e2e/figma-stabilization.spec.ts` lines 73–78, the same pattern for Authors.

Future fixture contract, for a later package:

- 13 works that match one isolated category and material, or 9 authors that match one isolated tag and city. No other seeded row matches that scope.
- The «Показать ещё» button is required. A missing button fails the test.
- The last id is known before the click.
- After the click, the rendered links contain that id once, and the set of hrefs has no duplicates.
- The observed request is page 2 for that same filter scope.

Until that fixture exists, the three branches stay. They are not DELETE PROPOSALs. The surrounding URL, sort, and back assertions stay in the current tests.

## Family decisions

### 1. Discovery, stabilization, search

| Test | Risk | Level | Decision |
| --- | --- | --- | --- |
| `discovery-launch.spec.ts` — `Works keeps filters in the URL and paginates without duplicates` | Category and material stay in the Works URL, Back from Authors restores them, reset clears them. | browser | KEEP. Hook H04 checks the works request, not the address bar. Page 2 stays conditional until the fixture above. |
| `discovery-launch.spec.ts` — `Authors filters and sort are server-backed and URL-owned` | Tag, city, and `sort=name` are in the Authors URL. | browser | KEEP. No page-2 assertion. |
| `discovery-launch.spec.ts` — `Search overlay live-updates without submit` | Dock search sets `overlay=search` and a live `q` request. | browser | KEEP. Not a duplicate of the hook tests. |
| `figma-stabilization.spec.ts` — `Works sort, URL, back, and pagination stay server-owned` | `sort=oldest`, then newest, survives Back from Authors. | browser | KEEP the sort and Back assertions. Page 2 stays conditional. |
| `figma-stabilization.spec.ts` — `Authors date-added label, URL, back, and pagination` | «По дате добавления» is present, «По активности» is absent, `sort=name` survives Back from Works. | browser | KEEP. `discovery-launch` does not check those radio labels. |
| `figma-stabilization.spec.ts` — `Search overlay results, empty, and inline error` | A real title returns in the overlay, load-more is absent, empty copy is «Работы не найдены», and a works HTTP 500 shows the retry button. The retry button is not clicked. | browser | KEEP. `search-overlay.spec.ts` aborts the authors request, clicks «Повторить», and expects author links to return. The failure modes differ. |
| `search-overlay.spec.ts` — `focused Search input Escape closes Search once` | Keyboard: Escape from the focused field closes once. | browser | KEEP. S07 does not press Escape. |
| `search-overlay.spec.ts` — `Search dimmer click consumes exactly one history step` | History: one dimmer click consumes one history entry. | browser | KEEP. S07 checks one jsdom dismiss, not the history stack. |
| `search-overlay.spec.ts` — `FilterSheet Escape closes the sheet once and keeps Works` | Keyboard: Escape closes the sheet and leaves Works. | browser | KEEP. |
| `search-overlay.spec.ts` — `Search overlay tabs, live query, navigation, and close` | Business results, tab selection, and close returning to Home chrome. | browser | KEEP. |
| `search-overlay.spec.ts` — `typed empty results and active-tab inline retry stay in the overlay` | Empty copy for categories, authors, and works; authors abort; «Повторить» restores an author link. | browser | KEEP. The stabilization search test shows a works HTTP 500 retry button and does not click it. |
| `search-overlay.spec.ts` — `/search deep link hosts the overlay and close uses the Home fallback` | URL: `/search?q=dali` opens the overlay; close leaves `/search`. | browser | KEEP. |
| `search-overlay.spec.ts` — `/search Escape leaves the dedicated Search route` | Keyboard and URL. | browser | KEEP. |
| `search-overlay.spec.ts` — `/search result navigation leaves Search without forcing Home` | URL: a category hit leaves Search for the category query. | browser | KEEP. |
| `search-overlay.spec.ts` — `client-side Back from Search returns the underlying route, not Home` | History. | browser | KEEP. |
| `search-overlay.spec.ts` — `query and tab edits replace the current Search entry` | History: query and tab edits replace one entry. | browser | KEEP. |
| `search-overlay.spec.ts` — `Back from Author and Work restores the Search session` | History. | browser | KEEP. |
| `search-overlay.spec.ts` — `Back from a Category result restores Search, then keeps Works filters` | History and Works URL filters. | browser | KEEP. |
| `search-overlay.spec.ts` — `detail Back follows history from Home, Works, and Author` | History. | browser | KEEP. |
| `search-overlay.spec.ts` — `browser Forward after Search → Author does not corrupt Search` | History: Forward. | browser | KEEP. |
| `search-overlay.spec.ts` — `Search overlay focuses the field, traps Tab, and restores dock focus` | Focus and keyboard. | browser | KEEP. |
| `search-overlay.spec.ts` — `Search overlay does not overflow at phone widths` | Geometry. | browser | KEEP. |
| `search-overlay.spec.ts` — `desktop pointer hover marks Author, Category, and Work hits` | Pointer hover. | browser | KEEP. |
| `figma-stabilization.spec.ts` — `Work page and ShareSheet focus, Escape, and download` | Share dialog docking, focus, Escape, and download. | browser | KEEP. S04 checks that the header button exists. It does not open the sheet. |
| `figma-stabilization.spec.ts` — auth 390 overflow, card hover/focus, 390 zoom and reduced motion | Layout and motion. | browser | KEEP. |

No test in this family is a DELETE PROPOSAL.

### 2. Creator profile

| Test | Risk | Level | Decision |
| --- | --- | --- | --- |
| `creator-profile.spec.ts` — `four-step creator application validates public links before submit` | Four-step flow, invalid website blocks continue, public links/slug persist, submit reaches pending. | browser | REPLACED obsolete three-step owner only after canonical four-step submit passed both browsers. Details: `12-PORTFOLIO-MVP-RELEASE-AUDIT.md`. |
| `creator-profile.spec.ts` — `public creator profile shows only public data and remains responsive` | Public name is visible, private contact and both buyer emails are absent, Share remains, 1440 and 390 do not overflow. | browser | KEEP. |

Replacement for the three-step path:

- `author-revision-flow.spec.ts` — `new author submits the four-step application` asserts «Шаг 2 из 4» and «Отправить на проверку».
- `author-application-publication.spec.ts` — `city application is approved and appears in the public authors catalog` walks steps 2–4, including persisted Telegram.
- `profile-validation.spec.ts` asserts «Введите HTTPS-ссылку, начиная с https://» for invalid links. That string still exists in `profile-validation.ts`.

Prerequisite before anyone deletes the three-step test: run `author-revision-flow.spec.ts` and the public-privacy test in the maintained browser matrix. This package did not run them.

### 3. Catalog page 2

See the fixture section. Decision for the current tests: KEEP, with a MOVE PROPOSAL of the conditional page-2 branch into one required-button test after the fixture exists. Hook H02 is the jsdom owner for overlapping ids. It is not the browser owner.

### 4. Product creation wizard

All ten tests are in `apps/mobile/e2e/product-creation-wizard.spec.ts`. The three `history.back()` cases are separate from the seven earlier cases. Absence of `history.back()` in a component spec is not a reason to keep an unrelated browser assertion.

| Test | Assertions | Lower layer | Decision |
| --- | --- | --- | --- |
| `keeps later steps open after returning to step 1` | Form: file chooser, «1/10 изображений», story text. URL: `flow=creation&step=1` through `step=4`, including reload on step 1 and a direct `step=3` visit. Later step buttons stay enabled after returning to step 1. | `product-draft-wizard.spec.ts` — `keeps later steps openable after requesting an earlier step` and `opens all steps when a draft has at least one image`. Those are pure functions. They do not set the address bar, reload, or use a file chooser. | KEEP. Distinct browser risks: URL, reload, file chooser. |
| `patches an existing draft on step 1 and continues to step 2` | HTTP: one PATCH to `/api/products/:id` is ok, and no second POST `/api/products`. URL: save lands on `step=2`, then step 1 shows the edited title. | `product-draft-save-race.spec.ts` — `assigns the created id and updates on the next save` expects one `createProduct`, then `updateProduct` with the created id. It uses a mock router. It does not observe the browser address bar. | KEEP. Distinct browser risk: the real URL and the absence of a second POST on that page. |
| `regular edit save stays on the edit screen` | HTTP: PATCH ok. URL: stays on `/products/:id` with no `flow=creation`. Form: the title remains. | Save-race cases click «Сохранить изменения» and assert the mock client. They do not assert this URL. | KEEP. Distinct browser risk: the edit route stays put. |
| `clamps inaccessible URL steps to the highest openable step` | URL: `step=4` without images becomes `step=2`; after an upload, `step=99` becomes `step=4`; reload keeps `step=4`. Buttons 3 and 4 are disabled before the upload and enabled after it. Copy: «Проверка перед модерацией». | `product-draft-wizard.spec.ts` — `clamps non-integer and out-of-range steps before opening them` expects `clampProductWizardStep(99)` and `resolveProductWizardStep(99, productWithoutImages)`. `rewrites URL params that do not match the resolved current step` expects `shouldRewriteProductWizardStepParam`. Neither drives the router or reload. | KEEP. Distinct browser risk: the address bar and reload. |
| `shows step 1 validation without locking later tabs` | Form: empty title, one «Введите название», and «Проверьте обязательные поля». URL: stays on `step=1`, then the enabled «2. Изображения» control goes to `step=2`. | `product-draft-fields.spec.ts` — `keeps an incomplete draft editable and reveals required errors only after the step is attempted` shows «Введите название» and «Проверьте обязательные поля» after «Проверить шаг». `product-draft-wizard.spec.ts` expects `productWizardStepOneIncompleteMessage` to be «Проверьте обязательные поля». Neither clicks «Сохранить и продолжить» nor changes `step` in the address bar. | KEEP. Distinct browser risk: failed save leaves `step=1` and the images tab still navigates. The component text is not a replacement for that URL. |
| `persists the current form values before submitting` | HTTP: opening step 4 sends PATCH `{ title }`. Submit then sends PATCH and POST `/submit` in that order. Copy: «Предмет отправлен на модерацию.» URL: `step=4`. | `product-draft-save-race.spec.ts` and `product-draft-submit-lifecycle.spec.ts` cover save-then-submit against a mock client. They do not record this browser request list or `step=4`. | KEEP. Distinct browser risk: request order on the real step URL. |
| `saves a dirty draft before closing and restores it by id` | HTTP: «Сохранить и закрыть» PATCH ok. URL: `/profile`, then reopen `/products/:id`. Form: the saved title is restored. This test does not call `history.back()`. | `product-draft-route-guard.spec.ts` — `keeps route removal blocked until a delayed save succeeds once` and `does not navigate when the save before route removal fails`. Those drive the jsdom removal guard, not «Сохранить и закрыть» to `/profile`. | KEEP. Distinct browser risk: close navigation and restore by id. |
| `persists a dirty Work before browser Back and restores its values` | History: `history.back()` on a dirty title. HTTP: PATCH ok. URL: `/profile`, then restore by id. | No component test calls `history.back()`. The route guard is not this gesture. | KEEP. R25 is still a plan. |
| `blocks browser Back and retains dirty input when persistence fails` | History: `history.back()`. HTTP: PATCH 500. URL stays `/products/:id`. Form: the unsaved title remains. | No component test owns this browser history failure. | KEEP. |
| `allows browser Back from a clean Work without saving` | History: `history.back()`. HTTP: no PATCH. URL: `/profile`. | No component test owns clean browser Back. | KEEP. |

### 5. Author application publication

| Test | Risk | Level | Decision |
| --- | --- | --- | --- |
| `author-application-publication.spec.ts` — disabled «Продолжить» when city is empty | The step 1 button stays disabled without a city. | browser | KEEP. |
| Same test, `POST /api/seller/profile` multipart `city: ''` and `profilePhoto` set to the string `e2e/fixtures/profile-photo.png`, expecting HTTP 400 | Intended city rejection. | browser request | DEFER. The photo part is a string, not a file. A 400 from upload parsing would look the same. |
| `city application is approved and appears in the public authors catalog` | Four-step submit, admin approve, public catalog. | browser | KEEP. |

`apps/api/test/integration/author-application-contract.integration.spec.ts` already sends a binary photo. `applicationForm` (lines 62–81) sets `profilePhoto` to `new Blob([permissionImage], { type: 'image/png' })`. `persists a private draft, synchronizes updates, then submits the same revision` (lines 177–187) posts `applicationForm({ city: null })` and expects 400, then posts a neighboring draft with city `Minsk` and expects 201. `city: null` skips the field. That is a missing city, not `city: ''` and not the browser button. It does not prove the empty-string boundary. This plan does not add another API test for that boundary.

UI owners for a blank city, which do not replace the browser button: `profile-validation.spec.ts` — `requires a non-blank city`; `seller-profile-submit.spec.ts` — `saves empty optional contacts and still blocks a blank city`.

### 6. Admin revision, photo, achievements

| Test | Risk | Level | Decision |
| --- | --- | --- | --- |
| `admin-revision-moderation.spec.ts` — pending seller revision | Guest sees the published name and decoded photo (`naturalWidth`), and the pending achievement image is HTTP 404. | browser | KEEP. |
| `admin-revision-moderation.spec.ts` — pending product revision | Pending gallery stays off the public page. | browser | KEEP. |
| `author-achievement-revision.spec.ts` | An approved author replaces a published achievement without publishing the draft. | browser | KEEP. |
| `AdminRevisionPhoto.spec.ts` | Object URL reload and a late older response. | component | KEEP. It does not decode an image in a browser. |

### 7. Logout

Only the approved-author browser test calls `page.goBack()`. The other three do not.

| Test | Assertions | Lower layer | Decision |
| --- | --- | --- | --- |
| `account-logout.spec.ts` — `guest does not see logout` | At 390, Home has zero buttons named «Выйти». No click and no Back. | `account-logout-button.spec.ts` — `renders nothing for a guest` mounts the button alone. | KEEP. Distinct browser risk: the guest Home route. |
| `account-logout.spec.ts` — `approved author logout leaves the cabinet and a later visit requires auth` | Cabinet shows «Выйти». After click the URL is `/`. `goBack()` does not restore the cabinet or the author profile and lands on `/login`. A later `/cabinet` visit also lands on `/login`. | `account-logout-button.spec.ts` expects `replace('/')` after logout. `account-logout-reachability.spec.ts` — `shows logout in the approved author cabinet` only shows the button. | KEEP. This is the logout test that owns browser Back. |
| `account-logout.spec.ts` — `author without a profile can logout from the intro` | `/profile?intro=1`, click «Выйти», URL `/`, then `/profile` lands on `/login`. No `goBack()`. | Reachability covers verification and cabinet buttons, not this intro route and not the later login redirect. | KEEP. Distinct browser risk: intro entry and the protected redirect. |
| `account-logout.spec.ts` — `admin can logout from moderation` | `/admin`, click «Выйти», URL `/`, then `/admin` lands on `/login`. No `goBack()`. | `account-logout-reachability.spec.ts` — `shows logout on the admin moderation destination` shows the button. | KEEP. Distinct browser risk: leaving `/admin` and the next visit requiring auth. |

### 8. Motion and visual

KEEP all of these. A jsdom callback or a mock router does not own the risk:

- `work-header-motion.spec.ts` — sticky geometry, one action pair, gallery swipe, 390 overflow.
- `back-navigation-lifecycle.spec.ts` — Home → Work → Back flicker, inactive Home inertness, Search restore.
- `author-header-motion.spec.ts` — expanded and compact identity.
- `share-sheet-motion.spec.ts` — one sheet, rapid reopen.
- `tab-switch-reveal.spec.ts` — rest and deep tab switches, keyboard focus.
- `figma-glass-dock.spec.ts`, `figma-cover-frost.spec.ts`, `visual/home-opening-figma.spec.ts` — pixel and glass sampling.
- `home-figma.spec.ts`, `figma-error-state.spec.ts` — loading, error, retry, zoom, reduced motion.

S04 and S06 remain component evidence. They are not substitutes for this list.

## Declaration index

100 `test(` declarations. This is the AST inventory, not a Playwright result. Decisions above name the tests that were analyzed. The rest stay KEEP because this pass found neither a replacement nor an obsolete product string.

- `00-seeded-demo.spec.ts`: `demo seed exposes public portfolio authors, works and media`
- `account-logout.spec.ts`: `guest does not see logout`; `approved author logout leaves the cabinet and a later visit requires auth`; `author without a profile can logout from the intro`; `admin can logout from moderation`
- `admin-revision-moderation.spec.ts`: `admin reviews a pending seller revision without exposing it publicly`; `admin reviews a pending product revision without exposing its gallery publicly`
- `auth-layout.spec.ts`: `auth composition is stacked in the S4 phone column`
- `author-achievement-revision.spec.ts`: `approved author replaces a published achievement without publishing the draft`
- `author-application-publication.spec.ts`: `author application without city cannot continue and city=null is rejected`; `city application is approved and appears in the public authors catalog`
- `author-cabinet.spec.ts`: `approved author opens an owned Work from the cabinet`
- `author-header-motion.spec.ts`: `shows the expanded creator identity at rest`; `parks one compact identity after the natural handoff`; `restores expanded identity on reverse without losing tabs`
- `author-revision-flow.spec.ts`: `new author submits the four-step application`; `approved author submits an editing revision without changing the public page until approve`
- `back-navigation-lifecycle.spec.ts`: `Home → Work → Back does not flash loading or keep Work after Home`; `inactive Home stays laid out and is not pointer or keyboard reachable`; `Work → Author → Back does not flash Author or a collapsed Work gallery`; `Search → Author → Back restores Search without a naked Home frame`; `direct Works catalog has no history Back control`; `Search → Work → Back restores Search without a Work flash after overlay`
- `creator-profile.spec.ts`: `four-step creator application validates public links before submit`; `public creator profile shows only public data and remains responsive`
- `discovery-launch.spec.ts`: `Works keeps filters in the URL and paginates without duplicates`; `Authors filters and sort are server-backed and URL-owned`; `Search overlay live-updates without submit`
- `figma-cover-frost.spec.ts`: `cover frost keeps Figma regions and samples artwork once on web`
- `figma-error-state.spec.ts`: `public API failure renders one coherent retry state`; `protected session failure reuses the shared retry state`; `session check failure on Home keeps public content without infrastructure UI`; `page infrastructure state replaces Home chrome`; `home pending uses the branded mark without loading copy`; `search active-tab failure keeps chrome and one inline state`
- `figma-glass-dock.spec.ts`: `floating dock is one glass capsule with live blur and no icon halo`; `dock glass samples page content without a split search FAB`
- `figma-stabilization.spec.ts`: `Works sort, URL, back, and pagination stay server-owned`; `Authors date-added label, URL, back, and pagination`; `Search overlay results, empty, and inline error`; `Work page and ShareSheet focus, Escape, and download`; `auth forms fit 390 without overflow`; `card hover and focus keep geometry`; `390 zoom 200% and reduced motion keep Home and Works usable`
- `home-figma.spec.ts`: `selected opening, null opening, and catalog empty states`; `renders curator heading only when the selection has a note`; `loading, error retry, broken media, long copy, zoom and motion`; `keyboard and centered phone column at 390, 1024 and 1440`
- `media-resilience.spec.ts`: `cold-start guest author profile renders its photo`; `guest author photo logs a failed request and keeps a safe fallback`
- `navigation.spec.ts`: `guest 390 dock is one four-item capsule without auction chrome`; `guest dock search, home, profile and plus stay inside the capsule`; `pending seller plus opens the application profile, not create-work`; `approved seller plus opens the existing create-work flow`; `admin dock hides plus and opens admin from profile`
- `product-creation-wizard.spec.ts`: the ten names in the wizard table above
- `product-layout.spec.ts`: `product composition stays portfolio-only without auction chrome`
- `search-overlay.spec.ts`: the seventeen names in the search table above
- `share-sheet-motion.spec.ts`: `opens one Work sheet and closes it with X`; `does not duplicate the Work sheet on rapid open and close`; `opens one Creator sheet and closes it with X`
- `tab-switch-reveal.spec.ts`: `Work rest switch does not dock; deep switch reveals the new start`; `keeps a direct Work ?tab= load at the page start`; `keyboard Work tab switch reveals the new panel and keeps tab focus`; `short Payment can undock and still starts at Payment`; `Creator rest switch does not compact; deep switch reveals the new start`
- `visual/home-opening-figma.spec.ts`: `Home Opening author column matches first-fold 390×860 capture`
- `work-header-motion.spec.ts`: `shows one Back and Share at expanded rest geometry`; `keeps the same Back and Share pinned while tabs are still travelling`; `joins tabs under Back and Share without remounting actions`; `lets tabs leave on reverse while Back and Share stay`; `keeps one action pair across fast reverse jumps`; `keeps gallery swipe after the header mounts`; `does not overflow at 390 or compact 384`; `deactivates the dock surface on slow reverse`

## What this plan does not claim

- No measured speedup. Durations were not collected.
- Dropping a `test(` declaration is not coverage.
- T05 stays queued. R29 is not `VERIFIED`.
- D04, D05, D09, D10, L04, and R32 stay at their previous status. Their browser scenarios were not run.
