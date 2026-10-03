# R29 preparation — E2E scope plan — 2026-10-03

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
| `search-overlay.spec.ts` — focus, Escape, Tab, Forward, dimmer history, `/search` deep link, result navigation, query replace, Back from Author/Work/Category | History and focus ownership of the overlay. | browser | KEEP. `search-overlay-surface.spec.ts` checks portal, native `onRequestClose`, and one dimmer dismiss in jsdom. It does not press Tab, Escape, or browser Forward. |
| `figma-stabilization.spec.ts` — `Work page and ShareSheet focus, Escape, and download` | Share dialog docking, focus, Escape, and download. | browser | KEEP. S04 checks that the header button exists. It does not open the sheet. |
| `figma-stabilization.spec.ts` — auth 390 overflow, card hover/focus, 390 zoom and reduced motion | Layout and motion. | browser | KEEP. |

No test in this family is a DELETE PROPOSAL.

### 2. Creator profile

| Test | Risk | Level | Decision |
| --- | --- | --- | --- |
| `creator-profile.spec.ts` — `creator profile creation stages public identity, links and private handoff` | Three-step wizard: «Шаг 2 из 3», «Шаг 3 из 3», «Создать профиль», «URL-slug», «Контакт для передачи». | browser | DELETE PROPOSAL. Those strings have no match in `apps/mobile/src`. The live application is four steps. |
| `creator-profile.spec.ts` — `public creator profile shows only public data and remains responsive` | Public name is visible, private contact and both buyer emails are absent, Share remains, 1440 and 390 do not overflow. | browser | KEEP. |

Replacement for the three-step path:

- `author-revision-flow.spec.ts` — `new author submits the four-step application` asserts «Шаг 2 из 4» and «Отправить на проверку».
- `author-application-publication.spec.ts` — `city application is approved and appears in the public authors catalog` walks steps 2–4, including persisted Telegram.
- `profile-validation.spec.ts` asserts «Введите HTTPS-ссылку, начиная с https://» for invalid links. That string still exists in `profile-validation.ts`.

Prerequisite before anyone deletes the three-step test: run `author-revision-flow.spec.ts` and the public-privacy test in the maintained browser matrix. This package did not run them.

### 3. Catalog page 2

See the fixture section. Decision for the current tests: KEEP, with a MOVE PROPOSAL of the conditional page-2 branch into one required-button test after the fixture exists. Hook H02 is the jsdom owner for overlapping ids. It is not the browser owner.

### 4. Product creation wizard

| Test | Risk | Level | Decision |
| --- | --- | --- | --- |
| `product-creation-wizard.spec.ts` — `persists a dirty Work before browser Back and restores its values` | `history.back()` saves a dirty title and restores it by id. | browser | KEEP. |
| `product-creation-wizard.spec.ts` — `blocks browser Back and retains dirty input when persistence fails` | A failed PATCH leaves the dirty title on the edit URL. | browser | KEEP. |
| `product-creation-wizard.spec.ts` — `allows browser Back from a clean Work without saving` | Clean Back does not save. | browser | KEEP. |
| Earlier wizard tests in the same file: step return, PATCH on step 1, edit save, URL clamp, step 1 validation, save-then-submit, dirty close | Browser URL and step chrome. | browser | KEEP. Screen specs cover save races and submit lifecycle. They do not drive `history.back()`. |

`product-draft-route-guard.spec.ts` blocks route removal until a delayed save, and it refuses to leave when that save fails. That is the jsdom guard. R25 is not implemented, so the three browser Back tests stay.

### 5. Author application publication

| Test | Risk | Level | Decision |
| --- | --- | --- | --- |
| `author-application-publication.spec.ts` — disabled «Продолжить» when city is empty | The step 1 button stays disabled without a city. | browser | KEEP. |
| Same test, `POST /api/seller/profile` with `city: ''` and `profilePhoto` set to the string `e2e/fixtures/profile-photo.png`, expecting HTTP 400 | Intended city rejection. | browser request | DEFER. The photo part is a string, not a file from the chooser. A 400 from upload parsing would look the same. It does not prove city validation. |
| `city application is approved and appears in the public authors catalog` | Four-step submit, admin approve, public catalog. | browser | KEEP. |

Unit owners for a blank city, which do not replace the browser button: `profile-validation.spec.ts` — `requires a non-blank city`; `seller-profile-submit.spec.ts` — `saves empty optional contacts and still blocks a blank city`.

A later API proof needs a multipart body whose other fields, including a real photo file, are valid, with only city empty. That request was not added here.

### 6. Admin revision, photo, achievements

| Test | Risk | Level | Decision |
| --- | --- | --- | --- |
| `admin-revision-moderation.spec.ts` — pending seller revision | Guest sees the published name and decoded photo (`naturalWidth`), and the pending achievement image is HTTP 404. | browser | KEEP. |
| `admin-revision-moderation.spec.ts` — pending product revision | Pending gallery stays off the public page. | browser | KEEP. |
| `author-achievement-revision.spec.ts` | An approved author replaces a published achievement without publishing the draft. | browser | KEEP. |
| `AdminRevisionPhoto.spec.ts` | Object URL reload and a late older response. | component | KEEP. It does not decode an image in a browser. |

### 7. Logout

| Test | Risk | Level | Decision |
| --- | --- | --- | --- |
| `account-logout.spec.ts` — guest, approved author, intro author, admin | «Выйти» is absent for a guest. After click, Back and a later visit to `/cabinet`, `/profile`, or `/admin` land on login. | browser | KEEP. |
| `account-logout-button.spec.ts` | Guest renders nothing. Logout calls replace `/`. | component | KEEP. It does not set a cookie or follow browser Back. |
| `account-logout-reachability.spec.ts` | The button is present on cabinet, admin, and verification destinations. | component | KEEP. Presence is not the redirect. |

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

## Other declared browser tests

These were not proposed for deletion. No replacement was found, and no obsolete product string was found for them: `00-seeded-demo.spec.ts`, `navigation.spec.ts`, `auth-layout.spec.ts`, `product-layout.spec.ts`, `media-resilience.spec.ts`, `author-cabinet.spec.ts`, `author-header-motion.spec.ts` (also listed under motion).

## What this plan does not claim

- No measured speedup. Durations were not collected.
- Dropping a `test(` declaration is not coverage.
- T05 stays queued. R29 is not `VERIFIED`.
- D04, D05, D09, D10, L04, and R32 stay at their previous status. Their browser scenarios were not run.
