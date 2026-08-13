# Final Pen v2 Implementation Log

## Baseline

- Branch: `feature/final-pen-v2-flows`
- Starting commit: `8817185` (`implement feature: expand creator density fixtures`)
- Dirty files before work: `docs/design/03-DESIGN-SYSTEM.md`, `docs/design/04-DESIGN-STATUS.md`
- Untracked founder files intentionally preserved: `apps/api/.email.jsonl`, `design/pen/clipboard`, `design/pen/image.png`, `design/pen/image-1.png`, `design/pen/images/generated-1786150787345.png`, `design/pen/target-solution/`
- Attached Pen path: `/Users/yayauheny/Downloads/bidplace-web-v2 (3)/bidplace-web-v2.pen`
- Attached Pen SHA-256: `685bc2dee4ca643869e678378bf849ab3189c4072b417670df6c64fa6c3181cf`
- Canonical SHA-256 before replacement: `03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9`
- Canonical SHA-256 after replacement: `685bc2dee4ca643869e678378bf849ab3189c4072b417670df6c64fa6c3181cf`
- Selected FINAL roots: `nTnuM`, `Mycgk`, `JOjIY`, `NRlEW`, `jh6TI`, `H5vf2`, `N4ebBk`, `L7ytbv`, `MqUMz`, `cK8kD`, `XIzHe`
- Excluded/archive roots: `HOXkZ`, `B201v6`
- Source image audit: all 17 Pen-referenced images already exist under `design/pen/images/` and match the attached `images/` directory byte-for-byte; no additional image copy is required.

## Stage 0 — Adopt final Pen v2 baseline

- Status: Complete
- Pen references: attached Pen v2, selected FINAL roots above
- Success criteria: repository canonical is an exact byte-for-byte copy of the attached Pen; no later `.pen` edits; unrelated founder files remain untouched.
- Candidate fixes:
  - durable fix: exact baseline replacement and checksum verification;
  - acceptable workaround: none;
  - hack: editing or re-saving the Pen during implementation.
- Chosen solution and rationale: replace only `design/pen/bidplace-web-v2.pen` with the verified attached file and preserve the existing matching image assets.
- Backend changes: none.
- Frontend changes: none.
- Contract changes: none.
- Migration changes: none.
- Tests added: none.
- Checks executed: source and repository SHA verification; image reference audit.
- Runtime screenshots: not started.
- Deliberate visual differences: none declared.
- Security/privacy notes: no secrets or credentials read or staged.
- Files changed: `design/pen/bidplace-web-v2.pen`, this audit log.
- Commit subject: `implement feature: adopt final pen v2 baseline`
- Commit SHA: `ba3439b`
- Remaining risks: later implementation stages must not modify the canonical Pen.
- Next stage: close six prior review findings.

## Stage 1 — Close final Pen v2 review blockers

- Status: Complete
- Pen references: `nTnuM`, `L7ytbv`, `MqUMz`, shared `jh6TI`
- Success criteria: six findings are durably fixed or disproven with tests and evidence.
- Candidate fixes:
  - durable fix: shared server-derived eligibility state, database-side creator pagination, one native gradient primitive, bounded blur overscan, symmetric accordion toggle;
  - acceptable workaround: none selected;
  - hack: client-only eligibility, in-memory slicing, stacked fade overlays, edge-clipped blur, one-way accordion state.
- Chosen solution and rationale: `useEmailRulesEligibility` derives bid access from the authenticated session and fetched rules version; guest CTA routes to login with `redirectTo`, while unavailable states do not expose an active bid CTA. Public creator pages use `useInfiniteQuery` over API pages. `SellersService.getPublic` uses PostgreSQL CTEs for canonical listing, filter, count, sort and pagination, then hydrates a metadata-only product select. `AmbientImageBackground` uses Expo LinearGradient with explicit stops and a 1.1x clipped blur layer. Product About uses a shared symmetric toggle helper.
- Backend changes: seller public detail query now performs filtering, sorting, counts and pagination in PostgreSQL; image hydration uses `publicCatalogProductSelect` without `ProductImage.data`.
- Frontend changes: server-page accumulation and loading/retry state on public creator works; eligibility-aware auction CTA; true gradient and bounded overscan; accordion close-on-repeat.
- Contract changes: no contract shape changes; existing page/limit/status/sort contract is now honored end-to-end.
- Migration changes: none; the existing page/limit/status/sort contract and schema are sufficient.
- Tests added: `email-rules-eligibility.spec.ts`, `ambient-image-background-style.spec.ts`, `seller-pagination.integration.spec.ts`; updated seller service query test and narrowed the seed contract assertion to deterministic `seedEnded03` after fixture expansion.
- Checks executed: contracts tests `11/11`; API unit `153/153`; mobile unit `124/124`; API/mobile/database typecheck pass; API/mobile lint pass; full PostgreSQL integration `40/40` pass with host access after Docker PostgreSQL was started. Initial sandboxed integration attempts were blocked by host networking before test execution.
- Runtime screenshots: pending.
- Deliberate visual differences: none declared.
- Security/privacy notes: bid eligibility remains tied to session email/rules state; admin remains excluded; public seller hydration does not select image blobs or private handoff fields.
- Files changed: `apps/api/src/products/products.service.ts`, `apps/api/src/sellers/sellers.service.ts`, `apps/api/src/sellers/sellers.service.spec.ts`, `apps/api/test/integration/seller-pagination.integration.spec.ts`, `apps/mobile/package.json`, `pnpm-lock.yaml`, `apps/mobile/src/components/ui/AmbientImageBackground.tsx`, `apps/mobile/src/components/ui/ambient-image-background-style.ts`, `apps/mobile/src/components/ui/ambient-image-background-style.spec.ts`, `apps/mobile/src/features/auth/email-rules-gate.tsx`, `apps/mobile/src/features/auth/email-rules-eligibility.ts`, `apps/mobile/src/features/auth/email-rules-eligibility.spec.ts`, `apps/mobile/src/features/products/product-screen.tsx`, `apps/mobile/src/features/sellers/public-seller-screen.tsx`.
- Commit subject: `fix issue: close final pen v2 review blockers`
- Commit SHA: `584d2ac`
- Remaining risks: full integration matrix, runtime screenshots, full Playwright, and final audit/status documentation remain.
- Next stage: mobile header.

## Stage 2 — New mobile header

- Status: Partial — implementation committed; runtime matrix pending
- Pen references: `SiCif`, `SCcmO`, `tEdoA`, `gRrv0`, `CGqDR`, `Lvnq4`, shared `h757v`
- Success criteria: at `≤767px`, render one 72px row with the canonical logo and 44px Search/Create/Menu actions; support search open/close, menu open/close, outside/Escape dismissal, focus return, role-aware Create and Cabinet routes; leave tablet/desktop header behavior unchanged.
- Candidate fixes:
  - durable fix: a dedicated `MobileHeader` selected by the shared 768px breakpoint, with one route-aware state owner and the existing overlay/focus primitives;
  - acceptable workaround: none selected;
  - hack: duplicating desktop header controls or hiding overflow from the desktop layout.
- Chosen solution and rationale: `AppHeader` delegates only widths below 768px to `MobileHeader`. The component owns the closed, search-open and menu-open states, uses a 320px bottom-end overlay on web, and keeps one source for navigation and Create permissions. Header geometry is tokenized in `@bidplace/design-tokens`.
- Backend changes: none.
- Frontend changes: added `MobileHeader`, mobile-only `AppHeader` routing, menu/search icon mappings, and mobile geometry tokens.
- Contract changes: none.
- Migration changes: none.
- Tests added: mobile visual-token geometry assertions; full runtime/Playwright coverage remains pending.
- Checks executed: design-token build, mobile typecheck, mobile lint, targeted mobile visual-token test `10/10`, and `git diff --check` pass.
- Runtime screenshots: pending at 1440/1024/390; 1440/1024 should confirm unchanged desktop/tablet headers.
- Deliberate visual differences: at widths below 768px, the final Pen mobile header replaces the prior compact desktop navigation row.
- Security/privacy notes: admin cannot use Create; guest Create routes through login with the current destination; authenticated Cabinet routes remain role-aware; logout remains the existing auth mutation.
- Files changed: `apps/mobile/src/components/layout/MobileHeader.tsx`, `apps/mobile/src/components/layout/AppHeader.tsx`, `apps/mobile/src/components/ui/AppIcon.tsx`, `packages/design-tokens/src/tokens.ts`, `apps/mobile/src/lib/visual-token.spec.ts`.
- Commit subject: `implement feature: add final mobile header`
- Commit SHA: `8f5c7e1`
- Remaining risks: browser/native runtime behavior, exact 390px overlay screenshot, keyboard/screen-reader acceptance, and visual parity at 1440/1024/390 remain.
- Next stage: auction participation and SlideToBid.

## Stage 3 — Auction participation and SlideToBid

- Status: Partial — implementation committed; full responsive/runtime matrix pending
- Pen references: `Mzgej`, `rRI1V`, `W0YAS`, `X6Ksg`, `nTnuM`
- Success criteria: refresh the server-owned auction snapshot before confirmation; keep the existing idempotent bid mutation; require a deliberate horizontal drag to 90–95% completion; reset early release, block vertical-scroll takeover and duplicate submits, show loading/error reset states, and preserve email/rules/admin gates.
- Candidate fixes:
  - durable fix: shared `SlideToBid` primitive with bounded geometry, responder direction-lock, server snapshot refresh and the existing bid mutation as the only write owner;
  - acceptable workaround: none selected;
  - hack: treating a tap as confirmation or bypassing the API validation/idempotency path.
- Chosen solution and rationale: `SlideToBid` uses the canonical 56px track, 4px inset, 360/488 control ratio and 92% completion threshold. `ProductScreen` refetches before opening the modal, validates against fresh `minimumNextBid`, and sends only after the slider completes. Early releases spring back; loading holds the control at the end; accessibility increment remains available for assistive technology.
- Backend changes: none; existing authenticated `placeBid` endpoint remains authoritative.
- Frontend changes: added `SlideToBid`, geometry tests, auction modal amount editing, pre-confirmation snapshot refresh and drag-based buyer E2E helpers.
- Contract changes: none.
- Migration changes: none.
- Tests added/updated: `slide-to-bid-geometry.spec.ts`, `auction-bidding.spec.ts`, `auction-integrity.spec.ts`.
- Checks executed: mobile typecheck, mobile lint, mobile unit `128/128`, targeted Playwright buyer/integrity `2/2` pass with host PostgreSQL. An accidental full-suite invocation was interrupted after a pre-existing Wave 2 screenshot timeout; it is not treated as a Stage 3 pass.
- Runtime screenshots: targeted confirmation screenshot and full 1440/1024/390 visual matrix pending.
- Deliberate visual differences: bid confirmation now requires SlideToBid drag instead of a tap on a `Подтвердить ставку` button; server stale minimum is surfaced before modal opening.
- Security/privacy notes: email verification/rules eligibility and admin exclusion remain enforced; no bid payload or server authorization was moved to the client.
- Files changed: `apps/mobile/src/components/ui/SlideToBid.tsx`, `slide-to-bid-geometry.ts`, `slide-to-bid-geometry.spec.ts`, `apps/mobile/src/features/products/product-screen.tsx`, `apps/mobile/e2e/auction-bidding.spec.ts`, `apps/mobile/e2e/auction-integrity.spec.ts`.
- Commit subject: `implement feature: add slide to bid confirmation`
- Commit SHA: `0af6f98`
- Remaining risks: full Playwright suite, screenshot comparison, physical-device gesture behavior and final accessibility acceptance remain.
- Next stage: product creation.

## Stage 4 — Product creation

- Status: Partial — implementation committed; full visual/native matrix pending
- Pen references: `cK8kD`, `EGywf`, `S7Y2D`, `JOjIY` shared workspace conventions
- Success criteria: preserve server-owned Product draft/update/submit, add the final staged creation flow for description, images, creation history, review and moderation outcomes, support 1–10 product images and process photos, preserve edit locks and errors, and keep seller/admin role boundaries.
- Candidate fixes:
  - durable fix: stage the existing protected API contracts behind one `ProductDraftScreen` flow with explicit URL state after the first draft save;
  - acceptable workaround: use a local wizard state for step navigation while the server remains owner of every save/upload/submit;
  - hack: fake review state or keep all creation steps client-only without persistence.
- Chosen solution and rationale: new product creation starts at Step 1, saves to a server draft, then routes to Step 2 with `flow=creation&step=2`. Product images use the existing multipart image API; Step 3 persists creation intro/steps and uploads process photos through a new API-client method; Step 4 exposes a review and submits through the existing moderation transaction. Legacy edit route behavior remains available without `flow=creation`.
- Backend changes: no controller, schema or migration changes; the new client method targets the existing guarded `POST /api/products/:productId/creation-steps/:stepId/image` endpoint.
- Frontend changes: staged ProductDraftScreen, route step params, creation-story editor, process-photo upload, review/submit state and seller E2E updates.
- Contract changes: no contract shape changes; API client now exposes an already-existing endpoint.
- Migration changes: none.
- Tests added/updated: `auction-creation.spec.ts` now covers draft save, staged image upload, creation-story save, review submit, approval and auction handoff.
- Checks executed: API client build/typecheck, mobile typecheck/lint, mobile unit `128/128`, and targeted seller Playwright `1/1` pass with host PostgreSQL.
- Runtime screenshots: pending at 1440/1024/390 for every wizard state and native picker/device acceptance.
- Deliberate visual differences: wizard state is URL-persisted only after the first save; existing non-wizard edit route remains the backwards-compatible maintenance surface.
- Security/privacy notes: product/image/creation-step operations continue through authenticated seller ownership, approved-seller and editable-status checks; process images are not public until the product is publicly visible.
- Files changed: `apps/mobile/src/features/sellers/product-draft-screen.tsx`, `apps/mobile/src/app/(seller)/products/[id].tsx`, `packages/api-client/src/images.ts`, `apps/mobile/e2e/auction-creation.spec.ts`.
- Commit subject: `implement feature: add product creation wizard`
- Commit SHA: `5ab461a`
- Remaining risks: full responsive screenshot matrix, native file picker behavior, loading/error screenshot evidence and founder/device accessibility acceptance remain.
- Next stage: creator profile creation.

## Stage 5 — Creator profile creation

- Status: Partial — implementation committed; full visual/native matrix pending
- Pen references: `JOjIY`, `DtJDi`, `m9a3A`, `I8p0K`, `T6vFm`
- Success criteria: stage creator creation into public identity, public links, and private handoff/review; keep public previews free of private transfer data; preserve structured Telegram/Instagram/website contracts, profile photo upload and seller status/edit locks.
- Candidate fixes:
  - durable fix: one `ProfileFields` model mapped to the existing seller profile contract, with explicit step gating and separate public/private sections;
  - acceptable workaround: local step state while server submission remains the only profile write;
  - hack: copying handoff data into public preview or inventing a second social-link schema.
- Chosen solution and rationale: `SellerProfileScreen` now stages the existing create/update API. Step 1 requires identity, description and photo; Step 2 collects structured public links and derives the required legacy `socialLink` only when needed; Step 3 collects handoff data and shows a public-only review summary before submit. Existing profiles continue to use the editable/locked single-page maintenance view.
- Backend changes: none; existing seller ownership, approved-seller, status and private projection boundaries remain authoritative.
- Frontend changes: staged seller profile creation, structured link fields, public-only review summary and profile E2E coverage.
- Contract changes: none; existing `telegramUrl`, `instagramUrl`, `websiteUrl` fields are now wired into the UI.
- Migration changes: none.
- Tests added/updated: `creator-profile.spec.ts` covers staged creation, public links, private handoff and post-submit status; the existing public privacy/responsive test remains in the same file.
- Checks executed: mobile typecheck/lint and targeted creator profile Playwright `2/2` pass with host PostgreSQL.
- Runtime screenshots: pending at 1440/1024/390 and native image-picker/accessibility acceptance.
- Deliberate visual differences: public profile review intentionally omits handoff contact value and initiator; structured links are now first-class creation inputs while the server-required legacy link remains compatibility data.
- Security/privacy notes: handoff fields are sent only to authenticated seller profile endpoints and are not rendered in the review preview or public profile route.
- Files changed: `apps/mobile/src/features/sellers/seller-profile-screen.tsx`, `apps/mobile/e2e/creator-profile.spec.ts`.
- Commit subject: `implement feature: add creator profile wizard`
- Commit SHA: `7f69e45`
- Remaining risks: full responsive screenshots, image picker failures, invalid-link error state and final device/screen-reader acceptance remain.
- Next stage: admin moderation workspace.

## Stage 6 — Admin moderation workspace

- Status: Partial — implementation committed; full visual/native matrix pending
- Pen references: `NRlEW`, author/work moderation states around `47935`, `49189`, `50432`, `51152`
- Success criteria: provide distinct Authors and Works moderation domains with search, status filtering, loading/empty/error states, public preview data, private-data separation, reasoned decisions, blocking/conflict/success handling and mobile/tablet/desktop responsive behavior; keep Orders out of the queue domain.
- Candidate fixes:
  - durable fix: extend the existing admin screen with explicit queue tab/filter/search state and preserve existing server mutation/dialog primitives;
  - acceptable workaround: client-side filtering of already authorized admin queue data while the server remains the decision owner;
  - hack: inline irreversible decisions without reason/confirmation or exposing transfer contacts in queue previews.
- Chosen solution and rationale: `AdminModerationScreen` now exposes Authors/Works/All tabs, search and status filters, renders filtered empty states, and retains the existing reason-required confirmation dialogs, seller blocking-listing guard, product seller dependency, conflict/error messages and separate order handoff section. No private handoff values are added to queue cards.
- Backend changes: none; existing guarded admin list/status/order contracts remain authoritative.
- Frontend changes: moderation tab/filter/search state and queue projections; E2E updated for explicit all-status continuation after an approval changes queue status.
- Contract changes: none.
- Migration changes: none.
- Tests added/updated: `wave-one.spec.ts`, `wave-c-screen-acceptance.spec.ts`.
- Checks executed: mobile typecheck/lint and targeted admin moderation Playwright `1/1` pass with host PostgreSQL.
- Runtime screenshots: pending at 1440/1024/390 for queue/detail/decision/loading/empty/error states.
- Deliberate visual differences: queue defaults to pending review and requires explicit filter selection to inspect approved/changed items; the existing order replacement tool remains below the two moderation domains.
- Security/privacy notes: admin API remains guarded; queue cards render public/administrative review fields only; irreversible decisions still require server validation and reason where required.
- Files changed: `apps/mobile/src/features/admin/admin-moderation-screen.tsx`, `apps/mobile/e2e/wave-one.spec.ts`, `apps/mobile/e2e/wave-c-screen-acceptance.spec.ts`.
- Commit subject: `implement feature: add moderation workspaces`
- Commit SHA: `18bb1c6`
- Remaining risks: full responsive screenshot matrix, status conflict simulation, native accessibility and final founder/device acceptance remain.
- Next stage: overall verification.

## Stage 7 — Overall verification

- Status: Partial — automated checks pass; visual/device acceptance remains Needs verification
- Pen references: all selected FINAL roots; canonical baseline SHA `685bc2dee4ca643869e678378bf849ab3189c4072b417670df6c64fa6c3181cf`
- Success criteria: run affected unit/type/lint/build checks, targeted browser flows, PostgreSQL integration, canonical SHA and `.pen` diff checks; reconcile product/design status without overstating unrun screenshot/device acceptance.
- Checks executed: contracts `11/11`; API unit `153/153`; mobile unit `128/128`; API client build; database typecheck; API/mobile typecheck; API/mobile lint; API build; mobile Expo export for web/Android/iOS bundles; targeted Playwright buyer/integrity `2/2`, seller product creation `1/1`, creator profile `2/2`, admin moderation `1/1`, mobile header/navigation `4/4`; prior full PostgreSQL integration `40/40` remains valid because no backend changes followed Stage 1.
- Canonical verification: repository and attached Pen SHA both equal `685bc2dee4ca643869e678378bf849ab3189c4072b417670df6c64fa6c3181cf`; `git diff --name-only -- '*.pen'` returns no paths; `git diff --check` passes.
- Runtime screenshots: targeted E2E screenshot artifacts exist from prior suites, but a new matched Pen overlay matrix at 1440/1024/390 for every required state was not completed.
- Known non-passing/limited checks: an accidental full Playwright invocation was interrupted after a pre-existing Wave 2 screenshot test exceeded its 120s timeout; it is not counted as a full-suite pass. Native physical-device and screen-reader acceptance were not run. Pen CLI status reported the stored authenticated endpoint as unreachable, so no remote Pen export was used.
- Product/design status: all staged flows are recorded as `Partial` until matched visual/device/accessibility evidence exists; no protected product principle or contract was changed.
- Commit ledger: `ba3439b`, `584d2ac`, `8f5c7e1`, `b39709f`, `0af6f98`, `33bf14b`, `5ab461a`, `afd3ae4`, `7f69e45`, `0b36ed9`, `18bb1c6`, `820aec3`.
- Remaining risks: full Playwright matrix, matched screenshots/overlay comparison, native iOS/Android gesture and picker behavior, screen-reader validation, isolated 10-user rehearsal and founder visual acceptance.
- Final recommendation: keep release status Partial/Needs verification; do not claim visual or device-complete acceptance from the automated evidence above.

## Final acceptance matrix

## Stage 8 — Review findings and regression verification

- Status: Partial — requested P1/P2 fixes are implemented; release acceptance remains Needs verification.
- P1 hydration: `GET /api/seller/products/:id` is owner-guarded and returns the shared detail contract with `creationIntro`, ordered `creationSteps` and process-photo metadata. `ProductDraftScreen` initializes only after the detail query resolves and does not save the editor's known-empty row during loading.
- P2 mobile menu: `getMobileMenuWidth` applies `min(320px, viewport - 32px)` with 32px total horizontal inset; unit coverage verifies 320/375/390 widths and browser coverage verifies the 320px viewport bounds.
- P2 profile validation: Telegram, Instagram, website and handoff validation use exported contract schemas; field-local errors disable progression while API validation remains authoritative. Regression coverage includes invalid and valid handle/URL variants.
- Regression checks: API unit `154/154`, mobile unit `143/143`, contracts `11/11`, affected typecheck/lint/build checks, targeted seller/profile/navigation Playwright `12/12`, Wave 2 at 1440/1024/390 `1/1`, Wave B at 390px `1/1`, and the full disposable Chromium Playwright suite `38/38` pass. Expo iOS and Android exports also pass. The catalog evidence capture now resets the production ScrollView before each screenshot, so the fresh 1440/1024/390 frames retain the canonical title/filter/state/grid composition.
- External gates still open: formal Pen pixel-diff overlay, native iOS/Android device smoke, physical screen-reader QA, and final founder approval. Browser keyboard/focus, semantic DOM/accessibility tree and reduced-motion evidence is included in Wave B and the full suite. `pen status` reports the authenticated Pen API unreachable; `simctl` and `adb` are unavailable on this host. Canonical Pen SHA remains `685bc2dee4ca643869e678378bf849ab3189c4072b417670df6c64fa6c3181cf`; no `.pen` file was changed.

Staged implementation and targeted runtime evidence exist; release acceptance is still pending the visual/device gates listed above.

## Stage 9 — Final product and auction regression closure

- Status: Automated acceptance complete; physical native and screen-reader acceptance remain external gates.
- Reported regressions: oversized product artwork and bid control, duplicate mobile auction actions, imprecise fractional prices, inline/stale bid behavior, outdated creation/moderation browser flows, and hidden failures caused by tests that no longer followed the modal interaction model.
- Chosen durable fixes: restore the approved desktop product media geometry (`360 × 514` for the three-column hero), keep the compact `AuctionPlayer` action only at product-wide breakpoints, use the bottom action bar as the single mobile CTA, preserve meaningful 0–2 digit currency precision, validate the currently typed amount inside the bid dialog, reset the slide control when the amount changes, and refetch canonical listing data after a rejected bid.
- Security and failure handling: an HTTP 400 is described as a stale bid only when the refreshed server minimum is greater than the attempted amount. Other failures keep their explicit user-facing error instead of being swallowed or mislabeled. The server remains authoritative for the minimum, lifecycle and accepted bid.
- Flow coverage updates: shared Playwright auction actions now open the modal and complete `SlideToBid`; product creation covers all required metadata plus the optional first creation-history step; moderation tests switch explicitly between the separate Authors and Works queues.
- Visual verification: fresh screenshots at 1440/1024/390 were inspected. Desktop uses the approved compact artwork/player composition. Mobile has one bottom CTA and no duplicate hero button or horizontal overflow.
- Checks executed: mobile unit suite passes; mobile typecheck and lint pass; complete Chromium Playwright suite `38/38` passes; Expo production export passes for web, Android and iOS; `git diff --check` passes. The previous React Native Web warnings for deprecated `shadow*`, `props.pointerEvents` and unsupported `useNativeDriver` did not appear in the full E2E console output.
- Commits: `30b9ba4` (public visibility SQL typing), `bed4715` (bid dialog and precise price behavior), `84d9ec6` (final product hero geometry and mobile CTA boundary), `3a70231` (creation and moderation flow acceptance).
- Canonical verification: Pen SHA remains `685bc2dee4ca643869e678378bf849ab3189c4072b417670df6c64fa6c3181cf`; the `.pen` file was not modified.
- Remaining external gates: native iOS/Android device smoke, physical screen-reader QA and founder visual acceptance against the canonical Pen on target devices.
