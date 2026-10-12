# Author onboarding — local mobile-web evidence (2026-10-12)

Branch `fix/author-onboarding-figma` (base `d8bfba17`). Screenshots are copied
unchanged from the Codex review run; this folder does not regenerate captures.

## Source priority

1. User-selected **2026-10-11** author-application Figma handoff:
   [`design/figma-handoff/author-application/2026-10-11/README.md`](../../../../design/figma-handoff/author-application/2026-10-11/README.md)
2. Older September `portfolio-phone-v1` geometry is **not** canonical for this flow when it
   conflicts with Oct-11 captures.
3. Protected product/design foundations, RFC, decision log, and `.pen` were not edited for
   this pass.

## Intentional accepted deviations from archive copy

- Country directory + ISO code; optional separate city (`DEC-117`).
- Directions as **category IDs** (`DEC-116`), not free-text material names.
- No **new** achievement photo on append; one date field (`MM.YYYY` or `DD.MM.YYYY`).
- Basics subtitle and ghost logout; nickname shown from stored account slug.

## Verification method

- **No automated pixel diff** against `reference.png` archives.
- **Node metrics** from handoff `nodes.json` and **rendered geometry** from Playwright
  (`author-application-publication.spec.ts`, auth/matrix suites) at 390 / 1024 / 1440 and
  selected zoom/reduced-motion cases.

## Environment and builds (Codex)

- Node **22.20.0**, `EXPO_NO_DOTENV=1`.
- `packages/design-tokens`, `contracts`, `api-client`, `database`, API builds and relevant
  typechecks; mobile **typecheck 0** and changed-file **ESLint without autofix 0**.

## Automated checks (Codex)

| Area                                           | Result                                 | Notes                                                                                                                                                                                                              |
| ---------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Affected UI/author/auth Vitest                 | **376 / 376** (58 files)               | Owner graph for this change set                                                                                                                                                                                    |
| Full mobile Vitest                             | **702 passed / 30 failed** (122 files) | Unrelated Work/product-draft + **4** category-query-identity failures; **not** claimed fixed                                                                                                                       |
| `packages/contracts`                           | **42 / 42**                            |                                                                                                                                                                                                                    |
| `packages/api-client`                          | **42 / 42**                            | `requestJson` uses `z.output`                                                                                                                                                                                      |
| API unit                                       | **444**                                |                                                                                                                                                                                                                    |
| API integration (isolated DB)                  | **40 / 40** (8 files)                  | No shared DB reset                                                                                                                                                                                                 |
| Author publication + geometry E2E              | **8 / 8** Chromium + WebKit            | Projects run separately (login budget)                                                                                                                                                                             |
| Source geometry sub-checks                     | **2 / 2**                              | Field icon physical stroke **1.3**, steps **390/1024/1440**, country keyboard, directions spacing, hidden selection, errors/retry/data retention, date precision, dialog **390×400** zoom **200%**, reduced motion |
| Figma button matrix                            | **10 / 10** both browsers              | 16 states; short screen, resize, zoom, focus, motion                                                                                                                                                               |
| Auth filled login dismiss                      | **2 / 2**                              | Shared `ExitConfirmDialog` boundary                                                                                                                                                                                |
| Auth history (2 cases)                         | **Did not reach** changed dialog       | Blocked in `openWorksCatalog` expecting «Все работы»; separate fixture gap — **not** full auth suite green                                                                                                         |
| Clean web export                               | **Passed** (2026-10-12)                | `EXPO_NO_DOTENV=1`, `apps/mobile/dist`, `entry-e29b977a2398a6f0f9e6bec19d658305.js`                                                                                                                                |
| `category-query-identity` attribution          | **Not caused by this diff**            | **4/4** fail on base `d8bfba17` and on branch; no category-consumer files in commit                                                                                                                                |
| Native iOS/Android                             | Not run                                | No simulator                                                                                                                                                                                                       |
| Production mail / live Turnstile / deploy / CI | Not tested                             |                                                                                                                                                                                                                    |

## Screenshot naming (Playwright `E2E_EVIDENCE_DIR`)

Pattern: `{project}-{label}.png` where `project` is `chromium` or `webkit`.

Expected labels from `author-application-publication.spec.ts` and related captures:

| Label                                            | Viewport / note                         |
| ------------------------------------------------ | --------------------------------------- |
| `intro-390`                                      | Intro dialog                            |
| `basics-390`, `basics-1024`, `basics-1440`       | Step 1                                  |
| `contacts-390`, `contacts-1024`, `contacts-1440` | Step 2                                  |
| `about-390`, `about-1024`, `about-1440`          | Step 3                                  |
| `directions-390`                                 | Directions sheet                        |
| `exit-390`, `exit-1024`, `exit-1440`             | Exit confirm centered                   |
| `exit-short-zoom`                                | **390×400**, `zoom: 2`                  |
| `achievements-390`, …                            | Step 4 responsive captures when enabled |

Codex copies files from the review runtime directory (for example
`/private/tmp/bidplace-author-review-runtime/evidence/`) into this folder without
renaming content.

## Maintenance

Shared ownership: `AuthorApplicationStepShell`, `ExitConfirmDialog`, `FigmaTextField`
/`FigmaSelectField`, `FilterSheet` directions variant, `packages/design-tokens`
(`authorApplication`, `exitConfirm*`, `stroke.authorApplicationFieldPx`). Future
layout fixes should stay in tokens and shared figma/ui primitives — no new zoom
observers, dependencies, or migrations for this flow.

Status owner: [`docs/design/04-DESIGN-STATUS.md`](../../../design/04-DESIGN-STATUS.md),
[`docs/product/11-PROJECT-STATUS.md`](../../../product/11-PROJECT-STATUS.md).
