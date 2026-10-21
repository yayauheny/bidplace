# Independent UI review follow-up — 2026-10-21

Scope: UI commit `33ebe774`, MVP base `3818f0f3`, corrections `a9daeca1`.
Working branch `feature/shared-footer`. The main checkout was switched by another
session during verification; those mixed-checkout runs are not acceptance evidence.
Final checks use the branch-locked `/tmp/bidplace-ui-review-completion` worktree.
No automatic merges/cherry-picks of the cleanup or API-test branches were made.
The remote MVP advanced separately to `cc4911e5` (#54, legal-pack test fix); the
reviewed UI branch is not yet included there.

Success criteria: readable complete draft metadata; existing save/media/revision
invariants; one navigation/layout/focus owner; relevant owner and rendered checks.
BackButton/FigmaIconButton, their variants and visual consumers are excluded by
founder instruction. No new design, dependency, server API or database model.

## Findings and disposition

| Finding | Cause / classification | Confirmed | Resolution / owner | Files | Evidence |
| --- | --- | --- | --- | --- | --- |
| P1 Review metadata | Raw uniqueness/dimensions/year, no labels/category/terms; functional presentation bug | Yes | Reuse watched form values, current catalogs and persisted selected names, including inactive terms; share the existing term-label conversion with About | product-draft-review.tsx, product-draft-screen.tsx, product-draft-about.tsx, product-draft-form.ts | form + screen characterization tests; real catalog/proposal round-trip and Review assertions |
| P2 author/create destinations | Different intents, not different host rules; acceptable architecture | No defect | Keep onboarding → /profile; create uses actual seller status; profile uses account/admin | use-app-navigation.ts, header-chrome.ts; Footer/Dock/Header consumers | role matrix below, header-chrome specs, browser guest trigger/focus cases |
| P2 AppShell hideDock | Explicit fullscreen chrome suppression, public desktop scope is intentional | No split API required | Keep existing API; actual desktop/dock visibility remains in AppShell | AppShell.tsx, public-navigation.tsx, FormPageShell.tsx | policy table below; public/account/browser tests |
| P3 hidden Home bottom reserve | PageScrollView default ignored actual hidden navigation in loading/error | Yes | AppShell provides actual dock visibility; shared spacer checks it in every page state | AppShell.tsx, public-navigation.tsx, PageScrollView.tsx | page-scroll-view owner cases: loading/error/empty/ready, both scrollers, visible/hidden/desktop |
| Images remount under auth | Conditional role changed RN Web element type: nav/footer → div on focus loss | Yes | Keep semantic role stable, retain inert/hidden state and active-only test IDs | DesktopHeader.tsx, SiteFooter.tsx | original image-node continuity assertion retained; added desktop brand-node continuity |
| Intermittent initial field focus | The after-enter guard accepted a container fallback; additionally Radix can focus its outer container late after inert is removed | Yes, container fallback reproduced red → green | Existing focus helper distinguishes container/control; AuthViewport repairs late container fallback through its already existing focusin handler, preserving the last form control | use-return-focus.ts, AuthViewport.tsx, AppDialog.tsx, overlay-focus.spec.ts | outside/container/control unit cases; direct entry, handoff, focus and motion browser checks |
| Route-guard suite load error | Native presentation imports escaped the existing DOM test boundary | Yes | Add presentation stubs only; preserve all six save/navigation guard assertions | product-draft-route-guard.spec.ts | six owner guard cases plus full mobile suite |
| Stale rendered-test selectors | New footer duplicates onboarding CTA; desktop no longer has a mobile dock; scrollport is now full bleed | Yes, test contract mismatch | Scope CTA to identity, select mobile viewport for dock test, assert full scrollport and bounded content separately | account-presentation, auth-focus-restore, home-image-lifecycle specs | Original geometry/continuity/focus assertions retained; no timeout/retry/tolerance increases |
| Settings heading center | Unequal current Back and close visual widths yield approximately +7px title offset at390 | Yes, visual only | Record only; settings consumer and both buttons unchanged per explicit exclusion | account-settings-screen.tsx (not edited) | Original195px center assertion remains red in both browsers; functional settings navigation separately covered |

## Navigation matrix (same owner for every consumer)

| Role | Become author (Footer) | Create (Header/Dock/Footer) | Profile |
| --- | --- | --- | --- |
| Guest | /login?redirectTo=/profile | /login with current public return path | /login with current public return path |
| Signed in, no application | /profile | /profile | /account |
| Pending application | /profile | /profile | /account |
| Approved author | /profile (onboarding/profile destination, deliberately distinct intent) | /products/new | /account |
| Admin | Author/create actions hidden by consumers | Hidden | /admin |

No late-response/session behavior, ProtectedRoute/verified guard or seller-status
cache semantics changed. Existing profile route owns application/edit behavior.

## Chrome policy retained

| Routes | Desktop >=1024 web | Below1024/native | Footer |
| --- | --- | --- | --- |
| Home, catalog, work, public author | DesktopHeader | Dock | Yes |
| Legal document | Explicit hideDock suppresses both | No dock | Yes |
| Account | Existing private chrome, no public header | Existing dock | Yes |
| Settings | Explicit hideDock suppresses both | No dock | Yes |
| Login/registration | AuthViewport sheet/dialog/fullscreen owner | Same auth owner | No |
| Work/application editor and fullscreen forms | Existing form/seller owner | Existing form owner | No |

A separate desktop-header toggle has no demonstrated consumer requirement.
The dock spacer is96px for the zero-safe-inset mobile case,118px with34px inset;
it is0 when actual dock visibility is false. No second scrollport was introduced.

## Maintenance / affected boundaries

- Review adds presentation only. Photos and story blocks keep their existing order,
  PrivateStoryImage authorization and revision/media lifetime; no save/submit writes
  were moved into rendering. No extra catalog request or parallel form model.
- Term labels have one conversion used by About and Review; persisted inactive
  selections remain readable and missing catalog identifiers are never exposed.
- AppShell remains chrome owner; PageScrollView consumes actual visibility.
- Stable semantic tags preserve subtree identity under auth without cache tricks.
- Focus fallback uses the existing helper module; no additional animation controller,
  global listener or timer. Reanimated drag/exit logic itself was not rewritten.
- API/client/service/repository/database contracts and release configuration remain
  unchanged. Writing E2E runs use guarded disposable E2E DB at3123/8181.
- The read-only production-preview proxy allows GET/HEAD only, avoiding CORS changes
  or writes to the manually served dev data. User preview7899 remains untouched.

## Verification

- Mobile unit suite: **142 files, 988 tests passed**, including the save/navigation
  guard and focus regressions. Mobile typecheck and lint passed.
- Full `pnpm verify`: config8, API463, contracts45, api-client42, database1,
  mobile and ops31 unit checks passed; E2E fence passed. API integration stopped
  the command with **154 passed, 28 skipped, 1 failed**. The failure is the
  unchanged `auth-transport.integration.spec.ts` legal-pack assertion expecting
  one document from a five-document mock. Upstream fixes it in `cc4911e5` (#54);
  that commit was not transferred into this branch. The28 skipped auth-abuse
  cases require an optional database URL and are not counted as passes. The
  final monorepo build stage was consequently not reached.
- Separate production web export passed from this isolated checkout.
- Real API/editor E2E: **26/26 Chromium+WebKit passed** (catalog/proposal names,
  save/reload, media failure/retry/order/delete, story blocks, submit, dirty exit,
  approved revision/public isolation). New Review responsive checks passed in
  both engines at320/390/440/767/768/1023/1024/1440/1800.
- Final UI/focus/motion/browser run: **68 passed, 2 failed**. The only failures
  are the original settings-title centering invariant, now retained in a separate
  test; its functional Close/Back/navigation assertions pass. No tolerance,
  timeout, retry or expected coordinate was relaxed.
- Final WebKit stress run: **20/20 passed**, five repetitions each of header-only
  dismissal, busy guard, slow/fast/cancelled drag and late focus-trap fallback.
- `git diff --check` passed. Protected BackButton/FigmaIconButton source and
  visual variants remain unchanged. Temporary focus probes were removed.

Review screenshots: [Chromium390](evidence/2026-10-21-independent-ui-review/chromium-390.png),
[Chromium1440](evidence/2026-10-21-independent-ui-review/chromium-1440.png),
[WebKit390](evidence/2026-10-21-independent-ui-review/webkit-390.png),
[WebKit1440](evidence/2026-10-21-independent-ui-review/webkit-1440.png).

Overall acceptance: **Partial**, because the excluded settings geometry and the
upstream API-test integration remain open. Physical iPhone, real browser zoom200%,
system text scaling and native keyboard are Needs verification; browser emulation
is not proof of device acceptance.


## 2026-10-22 — MVP merge verification

The founder authorized merging `feature/shared-footer` (`ac8149ab`) into
`feature/portfolio-mvp-release` based on current remote `d0efc03b`. The only
conflict was the project-status journal: the compact MVP structure was preserved
and a dated UI summary links to the detailed owner audits. No runtime conflict
or additional UI change was introduced; mobile/client/contracts/tokens match the
reviewed source branch. The main checkout and production deployment were not
changed.

The MVP already contains `cc4911e5`, so the previous legal-pack integration
failure is resolved:155 integration tests passed,28 optional DB cases skipped.
Mobile988 unit tests, other workspace unit checks, ops31, E2E fence, typecheck,
lint and markdown link validation passed on the merged tree. Full `pnpm verify`
completed successfully (exit0), including all8 build tasks and Expo web/iOS/Android
export. `pnpm docs:link-check` passed for184 Markdown files. Existing browser acceptance results above were not rerun for
this documentation/API-test-only integration; the2 excluded settings geometry
failures and physical-device limitations remain open.
