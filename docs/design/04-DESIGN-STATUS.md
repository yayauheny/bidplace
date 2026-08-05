# bidplace — статус дизайна

Дата снимка: 2026-08-05

Статус документа: Partial final migration — clean Modern UI cutover реализован без pilot bridge или fallback. Все маршруты используют target shell; до статуса `Implemented` остаются founder device/visual/accessibility acceptance и зафиксированное evidence.

## Pen workspace — 2026-08-05

- `Implemented`: `design/pen/bidplace-web.pen` is the versioned editable canvas
  for founder-reviewed prototypes; `design/pen/01-SCREEN-PROMPTS.md` maps the
  current MVP routes to bounded prototype prompts. The workspace, prompt index,
  and Pen handoff convention are documented in `00-DESIGN-INDEX.md` and
  `05-DESIGN-HANDOFF.md`.
- `Not implemented`: no new visual direction has been approved or transferred
  to production from Pen. Existing components, `modernTokens`, routes, and
  product behavior remain unchanged.
- `Needs review`: the public catalog prototype is available in
  `design/pen/bidplace-web.pen`, with the 2x review export at
  `design/pen/exports/catalog-review.png`. It covers 1440/1024/390 px default,
  loading, empty, network-error, long-title and unavailable-image states; no
  visual direction is approved for implementation yet.

## Wave A — structural responsive fixes — 2026-08-02

- `Implemented`: A1 uses shared modern layout, breakpoint and product-ratio contracts for the desktop shell and catalog column calculation. The catalog target is now 2 columns below 900px, 3 columns from 900 through 1439px and 4 columns from 1440px.

- `Implemented`: A1 has shared/unit evidence; A2 uses the shared web popover layer at all widths with collision-safe menu geometry and modal layer ordering; A3 uses one catalog grid for loading/loaded/fallback states and preserves the 4:5 media contract; A4 applies the 900px/440px product-wide geometry and keeps mobile bidding input in the auction panel with a compact safe-area dock, with buyer/admin first-viewport bounds and screenshots at 1440/1024/390; A5 applies equal-width mobile navigation cells and keyboard-scrollable auth viewports with validation/zoom evidence. Responsive browser coverage passes; founder/device/accessibility acceptance remains pending.

Wave 2 catalog/product layout: Catalog no longer renders the visible title/count on desktop and uses a left-starting, available-width grid with stable media ratio, description and secondary status. Product detail keeps gallery, author/title, publication date and auction together on desktop, preserves the mobile sequence, removes content tabs, and renders story, item history and bid history as linear sections. Shared buttons default to content width; `compact` and explicit `block` are available. Logic, API contracts, auction/moderation states and seed data are unchanged. Static checks, focused button unit coverage, target-width screenshots and disposable PostgreSQL Playwright verification pass; founder device/accessibility acceptance remains separate.

Mobile header correction (2026-08-02): below 1025 px `AppShell` no longer mounts the desktop account row; the mobile header keeps one bottom divider across brand row and navigation, without a navigation `borderTop`. Navigation cells are equal-width, icon-over-label, and use no tablist semantics. The 390 px screenshot test checks the first seed card starts immediately after mobile navigation. Desktop rail/account layout is unchanged.

## Wave B — shared component and visual-system fixes — 2026-08-02

- `Implemented`: B1 uses one canonical `modernTokens` public surface with contrast-safe accent/danger roles, a `#2457E6` focus role, disabled opacity, and preserved Wave A geometry. Independent contrast/unit evidence: `apps/mobile/src/lib/visual-token.spec.ts` (7 tests).
- `Implemented`: B2 supplies focus-visible, reduced-motion, 44px compact hit-area and decorative-child contracts in shared primitives.
- `Implemented`: B3 preserves 56px default and 44px compact button geometry; text-only labels are centered without an idle icon gap, and loading uses a hidden sizing layer with an absolute spinner.
- `Implemented`: B4 provides shared loaded/skeleton/fallback/gallery media geometry and stable narrow `AuctionCard` rows; `EditorialSection` is prepared for later detail application.
- `Implemented`: B5 provides one announced loading state and bounded modal dialog semantics with shared retry/empty/error distinctions; ProductDraft, ListingDraft and Order route loading states now have browser coverage for one polite progressbar, alongside dialog focus/scroll evidence.
- `Implemented`: B6 removes raw seller/admin/order enum presentation through shared localized adapters and keeps selectable controls at the compact 44px target.
- `Implemented`: B3–B6 interaction, media, dialog/state, and presentation-adapter automated evidence passes; founder device/accessibility acceptance remains `Needs verification`.

Runtime hardening (2026-07-31): `OverlayHost` uses a stable callback-ref boundary and anchor wrappers with real web refs; the full-screen host is non-interactive while portal content remains interactive, portals do not mount before geometry exists, and binary image responses send PNG `Buffer` bytes. Static checks pass; the current 24-test disposable browser suite reran successfully. Founder device/visual/accessibility acceptance remains separate.

Wave 1 state verification: activity distinguishes the truthful empty response from retryable API errors; seller profile renders the application form only for a confirmed 404; moderation exposes pending actions, required action reasons, latest moderation reasons, LIVE-listing explanation and concise empty sections (`Нет продавцов` / `Нет предметов` describe the full lists). The public author route reuses seller detail data and Product links to it. The route-group layouts also remove the two legacy Expo Router warnings. This wave's browser verification remains pending without disposable PostgreSQL; device visual and accessibility acceptance remains pending.

Wave 2 web UI polish: `AppShell` now provides a white canvas, 72 px desktop icon rail and desktop right-side `AccountMenu`, while `AppHeader` keeps the account control in the mobile brand row and derives seller actions from the private SellerProfile query. `OverlayHost` portals desktop account and navigation overlays above ordinary content; account positioning follows the trigger rectangle. The account menu supports click, hover and keyboard focus with reset-safe dismissal. `PageHeader`/`PageState` are shared by Catalog, Activity, SellerProfile, Admin and Product loading/error/empty paths; catalog background refetch uses a compact status line. Current seeded browser/media/overlay verification is 24/24 Playwright tests passed.

Final foundation status: `modernTokens` and `components/modern-ui` provide target typography, semantic palette, accessible basic controls, skeleton and image placeholder. Mobile typecheck and lint pass; current disposable Chromium Playwright execution passes 28/28 with Docker PostgreSQL. Founder visual/device/accessibility acceptance remains `Needs verification`; no route may be marked `Implemented` until founder acceptance evidence is recorded.

Shared navigation is in partial final migration: `components/layout/AppShell.tsx` now owns the responsive safe-area shell and `AppHeader.tsx` renders role-filtered navigation with a full-height desktop rail, unified 44 px nav items, active Product context and keyboard focus state. Legacy drawer, desktop navigation, Tamagui provider/config and legacy UI kit have been removed; founder device and accessibility acceptance remains.

Visual polish evidence: `getApiAssetUrl` is used by Catalog, Product gallery, seller profile and Product draft media; `ProductGallery` and `AuctionCard` expose a labeled unavailable-image fallback after `expo-image` errors; desktop Product places the gallery and auction panel at the same top level; Login validation uses Russian field messages; desktop `Link` styling keeps the active Catalog item visible and `AppIcon` no longer forwards `accessible` to web SVG DOM. Mobile typecheck and lint pass. The current 24-test disposable Playwright suite and target-width screenshots pass; founder visual/accessibility/device evidence remains pending.

## Wave C — screen polish and visual acceptance — 2026-08-03

- `Implemented`: C1 preserves the no-heading catalog, confirmed 2/3/4 columns and shared 4:5 bounds while separating price from status/deadline.
- `Implemented`: C2 keeps `AuctionPanel` as the only transactional block; story, provenance and histories are linear `EditorialSection`s, and mobile dock remains summary + CTA.
- `Implemented`: C3 adds 120px author identity/fallback, localized seller type, an author-specific 2/3-column AuctionCard grid capped below the catalog's four-column density, and compact divider-led purchases with existing price/status/deadline.
- `Implemented`: C4 adds 200px seller preview/fallback, 160×200 contain Product draft media rows and strict calendar/time validation for readable Listing dates while preserving ISO payloads and locks.
- `Implemented`: C5 lays admin queues side by side within 1180px on desktop, stacks below the breakpoint, keeps author links lightweight and localizes existing Order cancellation reasons.
- `Implemented`: C6 keeps auth isolated/scrollable, makes registration copy truthful and gives async states one loading announcement plus plain-language retry feedback.
- `Implemented`: C7 targeted acceptance passed 4/4 and the full repository Playwright suite passed 28/28 with real seed/API state, role restrictions, first-viewport bounds, overflow checks, naturalWidth/opacity, focus, empty/error/long-content states and dialogs. 66 commit-stamped screenshots are in `/private/tmp/bidplace-wave-c-screenshots/a852f68`; founder physical-device/screen-reader acceptance remains separate.

Moderation correction (2026-08-05): the admin Product queue disables approval until the related author is approved, shows `Сначала одобрите автора`, refreshes both queues after author approval, and presents errors for the actual moderation action. The behavior is covered by `apps/mobile/e2e/wave-one.spec.ts`; the AppDialog web `pointerEvents` warning is also removed. Founder visual/device/accessibility acceptance remains separate.

## Functional screen status

Auth (`/login`, `/register`) is in partial final migration: the forms retain existing validation and redirect behavior through final fields and buttons; device/accessibility QA remains.

| Экран                      | Route                                               | Статус                  | Evidence / remaining work                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------- | --------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public Product list        | `/`                                                 | Partial final migration | `product-list-screen.tsx` uses the available-width grid without visible Catalog heading/count; `AuctionCard` is fully clickable and includes media fallback, author, title, short description, atomic price with `BYN` and secondary status/deadline. 10–15 works, pagination, visual/device and accessibility QA remain.                                                                           |
| Product detail and bidding | `/product/[publicId]`                               | Partial final migration | `product-screen.tsx` keeps gallery, author/title and auction in one desktop top block, uses linear story/history/bids sections without tabs, and preserves mobile safe-area action. `bid-validation.ts` and existing query/mutation/realtime behavior are unchanged. Visual/device and accessibility QA remain.                                                                                     |
| My purchases               | `/me/activity`                                      | Partial final migration | `activity-screen.tsx` renders final `ActivityRow` instances from the role-safe Activity projection and distinguishes all current participation/Order states without adding private data. Shared legacy navigation, iOS/Android smoke and accessibility QA remain.                                                                                                                                   |
| Order                      | `/order/[publicId]`                                 | Partial final migration | `order-screen.tsx` uses final panels and role-scoped server projections. Buyer contact visibility remains API-authorized, seller actions retain loading/error/retry, and `handoffFailed` now requires an explicit destructive confirmation. Device/accessibility QA and regression E2E remain.                                                                                                      |
| Seller profile             | `/(seller)/profile`                                 | Partial final migration | `seller-profile-screen.tsx` uses final form/media primitives while retaining the server `CHANGES_REQUESTED` edit gate, multipart photo requirement and read-only states. Device/accessibility and regression upload QA remain.                                                                                                                                                                      |
| Product draft              | `/(seller)/products/new`, `/(seller)/products/[id]` | Partial final migration | `product-draft-screen.tsx` now uses final `FormSection`, `TextField`, media and dialog primitives; it preserves server locks, create/update/submit, upload/delete/reorder, truthful count and read-only preview. Image delete is confirmed; reorder is direct; creator input does not ask for condition. Founder device/accessibility QA remains.                                                   |
| Listing draft              | `/(seller)/listings/new`                            | Partial final migration | `listing-draft-screen.tsx` now uses final form primitives while retaining approved-product selection, local request feedback, server validation/retry and explicit schedule. Founder device/accessibility QA remains.                                                                                                                                                                               |
| Admin moderation           | `/admin`                                            | Partial final migration | Final primitives retain the administrative route guard and server authority. Seller suspension and Product correction requests require `AppDialog` confirmation with a reason; LIVE listings explain why ordinary correction is unavailable. Order cancel and replacement remain confirmed; loading/error/retry and anonymous ranked Bid behaviour remain. Founder device/accessibility QA remains. |

## Removed routes and promises

The retired public `/auctions/[slug]`, cart, swatches, fake variants, Buy Now and reserve UI are not part of the Task A surface. The only public commerce route is Product public ID; draft records remain seller-only.

## Design QA still required

- mobile/web keyboard and screen-reader audit for Product, OTP, seller and Order flows;
- loading, empty, network-error, reconnect and long-content states on pilot devices;
- real LAN API media loading on a physical device and direct verification of approved versus private image access;
- approval of visual treatment before marking any screen `Implemented`;
- admin controls and Product draft image-management flow.
