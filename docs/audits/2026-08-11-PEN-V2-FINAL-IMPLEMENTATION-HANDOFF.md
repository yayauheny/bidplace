# bidplace — Pen v2 FINAL audit and implementation handoff

Date: 2026-08-11
Status: Ready for staged implementation after Stage 0 baseline commit and the explicit blockers in section 8

## 1. Objective

Bring the public bidplace frontend and the minimum required backend contracts to the approved FINAL desktop frames in design/pen/bidplace-web-v2.pen. The implementation must preserve existing auction, authorization, privacy, moderation, upload and order behavior.

This document is the self-contained package for the next implementation window. It replaces the previous assumption that the visual cutover was already complete.

## 2. Non-negotiable source and protection rule

Canonical path:

    design/pen/bidplace-web-v2.pen

Expected SHA-256:

    03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9

Pen file version: 2.17
File token: e1e5bb62-da68-4706-90e7-f0b8802272d7

The new file is an explicitly approved design baseline replacement. Commit it separately before production implementation. From that baseline commit onward the file is immutable: never edit, delete, rename, move, format, resave or auto-fix it during code work. Code follows Pen, not the reverse.

Do not use generated Pen HTML/CSS. Read nodes and implement them with the existing Expo/React Native stack, shared tokens and shared components.

Preserve all unrelated founder files already present in design/pen. Do not clean untracked files and do not synchronize assets with a destructive delete.

## 3. Verified FINAL node audit

| ID     | Exact name                                                  | Canvas position | Size        |
| ------ | ----------------------------------------------------------- | --------------- | ----------- |
| H5vf2  | FINAL — Desktop Browse / Auction Cards / Gamma 4-col Test   | 12000, 4700     | 1440 × 940  |
| N4ebBk | FINAL — Desktop Browse / Authors / v1                       | 13560, 4700     | 1440 × 1280 |
| L7ytbv | FINAL — Desktop Product / Auction / Gamma Final Polish      | 15120, 4700     | 1440 × 2203 |
| HOXkZ  | FINAL — Desktop Creator / Profile / Editorial Refinement v1 | 16680, 4700     | 1440 × 1800 |
| MqUMz  | FINAL — Desktop Creator / Profile / MVP v1                  | 18240, 4700     | 1440 × 1740 |
| cK8kD  | FINAL — Product Tab State / Создание                        | 12000, 7063     | 1440 × 1360 |
| XIzHe  | FINAL — Product Tab State / Торги                           | 13560, 7063     | 1440 × 620  |
| jh6TI  | FINAL — Shared UI Components                                | 8000, 4700      | width 1600  |
| B201v6 | ARCHIVE — Historical UI                                     | 6000, 4700      | width 1600  |

Verified facts:

- all eight requested FINAL IDs exist exactly once and are top-level nodes;
- top-level order starts with the seven final screens, followed by shared UI, then archive;
- FINAL screens are separated by 120 px horizontally; product and lower tab frames have a 160 px vertical gap;
- Shared UI ends at x=9600; the first FINAL screen starts at x=12000;
- Archive ends at x=7600; Shared UI starts at x=8000;
- every top-level FINAL node is enabled and visible;
- all 110 component references resolve to one of 54 reusable masters; no dangling refs were found;
- all 17 local image assets referenced by FINAL screens exist under design/pen/images and matched the supplied asset hashes;
- no missing, unavailable, loading or skeleton node exists inside the seven FINAL screen trees;
- SearchPlaceholder is the normal search input placeholder, not a missing-design placeholder;
- missing-media and skeleton examples exist only inside ARCHIVE and are not visual authority;
- no warning or invalid-layout marker is stored in the new file;
- clip=true on a top-level frame is normal frame overflow behavior. It is not proof of clipped content. Final runtime clipping still requires rendered screenshot verification.

N4ebBk includes external Unsplash URLs as design fixture imagery. Production must use API-provided creator photos and must not copy those remote URLs into seeds or runtime code.

## 4. Authority order

When sources disagree, use this order:

1. latest explicit founder instruction;
2. the FINAL nodes listed in section 3;
3. reusable masters inside jh6TI;
4. product owner documents for behavior, permissions and vocabulary;
5. existing runtime behavior and contracts;
6. references from Foundation, Gamma and Avant Arte for motion details absent from Pen;
7. ARCHIVE only for historical context, never for visual decisions.

The old Главная / Обзор header implementation is not authority for the new FINAL canvas. The FINAL header shows the content selector Аукционы, a direct Авторы navigation item, centered search, and right-side actions.

MqUMz is the selected and only primary creator-profile implementation target:
`FINAL — Desktop Creator / Profile / MVP v1`. HOXkZ (`Editorial Refinement v1`)
is explicitly not the target for the creator page and must not be used as an
alternative implementation source. Keep one route and one shared creator
screen implementation.

## 5. Confirmed shared anatomy

Implement shared masters before screens. Exact child properties must be read from the node, not guessed from the overview screenshot.

| Master                              | Required anatomy                                                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| L9UV9 GlobalHeader                  | 1440 × 72; left discovery zone width 420 at x=32; search 480 × 48 at x=480; right zone width 420 at x=988; white/light background |
| Uulvx SearchBar                     | 480 × 48, radius 24, search icon, placeholder Найти предмет или автора                                                            |
| MsOKe Content Type Dropdown Trigger | 142 × 44, radius 22, label Аукционы, chevron                                                                                      |
| SHHWu Content Type Dropdown Menu    | width 240, radius 26, real menu semantics and keyboard behavior                                                                   |
| b4MbV Profile Dropdown Trigger      | 40 × 40 circle, Material Symbols Outlined person icon                                                                             |
| S1HL8 Profile Dropdown Menu         | width 280, radius 22, Cabinet and Logout rows, 48 px row height, focus enters first item and Escape restores trigger focus        |
| P42M0d Admin Profile Menu           | Cabinet, Moderation, Analytics and Logout only when backed by real routes and permissions                                         |
| g7INs AuctionStateTabs              | 40 px height, active/scheduled/finished states                                                                                    |
| s2ARGu SortControl                  | 160 × 40, radius 20, По активности                                                                                                |
| Nvxj8 Editorial sort trigger        | 164 × 32 compact transparent variant used by H5vf2                                                                                |
| k5vYGf AuctionCard                  | width 322, square 322 media, radius 12, #F7F7F5 information area, avatar and @handle, two auction metrics                         |
| SrXPq CreatorCard                   | width 322, square 322 photo radius 12, name 20/700 and discipline 15/500, no outer grey panel                                     |
| X6Ksg AuctionPlayer                 | 404 × 68, radius 20, bid block, remaining-time block and 124 × 44 action button in one horizontal row                             |
| Jh9jr ProductTabs                   | 430 × 72, О работе / Создание / Торги, 2 px active underline                                                                      |

Shared visual values present in the FINAL file:

- catalog background #FFFFFF and warm screen background #FBFBF8;
- catalog text #1A1A1A, muted #6B6B66, soft #F6F6F3, border #DADAD3, focus #2457E6;
- header control #F1F1ED, hover #EAEAE6, open #ECECE8, action #090909;
- Onest is used for catalog/card content and Inter for navigation/editorial text;
- catalog-data-font is declared as Geist Mono but no actual FINAL text node uses Geist Mono. Do not add a font dependency merely because the unused variable exists.

## 6. Screen contracts

### H5vf2 — /works

Required:

- exact FINAL header state with Создать and circular profile action for an authenticated user;
- title Работы;
- filter toolbar for Категория, Автор, Материал, Тип работы, Цена, Статус and Уникальность;
- state controls Идут торги, Запланированы, Завершены with server-owned counts;
- compact По активности sort control aligned on the same toolbar row;
- four k5vYGf cards at 1440;
- media-only hover zoom, no card-bound shift;
- URL-backed search, filters, status, sort and pagination.

### N4ebBk — /authors

Required:

- exact FINAL header;
- title Авторы;
- server sort По активности;
- eight SrXPq cards in the reference fixture and four columns at 1440;
- creator name and discipline from public API;
- API images only; no hard-coded stock URLs.

### L7ytbv — /product/[publicId]?tab=about

Required:

- 852 px integrated header and artwork atmosphere region;
- title/context left, sharp natural-ratio artwork center, facts/author/share right;
- artwork itself is rounded; do not fake width with grey side bands;
- decorative blurred duplicate remains behind the sharp artwork and outside the accessibility tree;
- X6Ksg below the artwork and sticky at viewport bottom after the hero scroll threshold;
- tabs use URL as source of truth and preserve browser back;
- about text, characteristics accordion, packaging, payment/delivery, author panel and four related works;
- all bids, countdowns, price and listing state stay server-authoritative.

### cK8kD — /product/[publicId]?tab=creation

Required:

- title История создания and intro;
- ordered steps 01–04 with titles, real descriptions and four process images;
- the same shared tabs and the same X6Ksg sticky player;
- no technical fallback such as author/year/published date presented as a creation story.

### XIzHe — /product/[publicId]?tab=bids

Required:

- shared tabs;
- bid table with participant alias, amount and timestamp;
- leader badge only for the real highest current bid;
- private identity and email must never enter the public contract;
- shared sticky X6Ksg, not a second local player.

### MqUMz — /seller/[slug]

Required:

- centered profile hero with photo, name, @handle, public social icons and bio;
- MqUMz defines the default spacing, hierarchy, long biography, state controls,
  sort and two-row card density;
- HOXkZ is excluded from implementation and visual acceptance for this route;
- one shared creator screen, one shared AuctionCard implementation;
- works state and sort are server-owned, not client filtering of an incomplete response;
- structured Telegram, Instagram and website fields only when present; do not display fake icons or reuse private handoff contact.

## 7. Current implementation gaps and exact owners

| Area                  | Current owner                                                                                           | Required change                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Tokens and type       | packages/design-tokens/src/tokens.ts; apps/mobile/src/app/\_layout.tsx                                  | Reconcile exact FINAL values; keep one token layer; do not add unused Geist Mono                                 |
| Header shell          | apps/mobile/src/components/layout/AppHeader.tsx                                                         | Replace content-based flex drift with stable three-zone geometry and FINAL IA                                    |
| Account menu          | apps/mobile/src/components/layout/AccountMenu.tsx                                                       | Put profile/cabinet/application/purchases and logout inside the 280 px popover; preserve keyboard focus behavior |
| Icons                 | apps/mobile/src/components/ui/AppIcon.tsx                                                               | Map exact Material/Lucide icons used by FINAL masters; do not use approximate generic icons                      |
| Auction card          | apps/mobile/src/components/ui/AuctionCard.tsx; AuctionCardGrid.tsx                                      | Rebuild k5vYGf anatomy, image crop, avatar/handle, typography and metrics                                        |
| Creator card          | apps/mobile/src/components/ui/CreatorCard.tsx; CreatorCardGrid.tsx                                      | Rebuild SrXPq with no outer surface and exact photo/text spacing                                                 |
| Browse works          | apps/mobile/src/features/products/product-list-screen.tsx                                               | FINAL title, filters, counts, one-row toolbar and four-column layout                                             |
| Browse authors        | apps/mobile/src/features/sellers/public-authors-screen.tsx                                              | FINAL title, sort and CreatorCard grid                                                                           |
| Product media         | apps/mobile/src/components/ui/ProductGallery.tsx; product-media-style.ts                                | Natural aspect metadata, rounded sharp image, no grey extension                                                  |
| Product player        | apps/mobile/src/components/ui/AuctionPlayer.tsx                                                         | Replace vertical panel with X6Ksg horizontal master and sticky state                                             |
| Product tabs          | apps/mobile/src/components/ui/ProductTabs.tsx                                                           | Preserve URL/a11y behavior while matching Jh9jr exactly                                                          |
| Product screen        | apps/mobile/src/features/products/product-screen.tsx                                                    | Recompose L7ytbv and render real about/creation/bid state owners                                                 |
| Creator profile       | apps/mobile/src/features/sellers/public-seller-screen.tsx                                               | Recompose MqUMz only, structured socials, server query controls                                                  |
| Seller profile editor | apps/mobile/src/features/sellers/seller-profile-screen.tsx                                              | Edit separate public social links without exposing handoff contact                                               |
| Product editor        | apps/mobile/src/features/sellers/product-draft-screen.tsx                                               | Add ordered creation story and process image editing                                                             |
| Public contracts      | packages/contracts/src/discovery.ts, product.ts, public-product.ts, public-seller.ts, seller-profile.ts | Add only the fields and query metadata required below                                                            |
| Persistence           | packages/database/prisma/schema.prisma and a new migration                                              | Structured socials, creation steps/media and image dimensions                                                    |
| API                   | apps/api/src/discovery, products, sellers and images                                                    | Server filters/counts, public detail fields, owner CRUD and visibility checks                                    |
| Client                | packages/api-client/src/products.ts, sellers.ts, images.ts, discovery.ts                                | Typed access to the new endpoints only through package exports                                                   |
| Fixtures              | packages/database/prisma/seed.js; E2E fixture helpers                                                   | Deterministic FINAL-like creator, works, creation steps and bids                                                 |

## 8. Backend and product decisions

### Chosen durable fix: structured public social links

Add optional validated public fields for Telegram, Instagram and website. Keep handoffContactType and handoffContactValue private and unchanged. Public mappers may expose only the new public fields.

Rejected acceptable workaround: infer platform from the existing socialLink. It cannot represent three links and creates unstable UI.

Rejected hack: reuse handoff contact as a public social link. This violates the privacy boundary.

### Chosen durable fix: normalized creation story

Add an ordered ProductCreationStep model owned by Product. A step needs position, title, body and one validated process image with mime type, byte length, checksum and binary data, or an equally normalized child image record if the implementation proves multiple images per step are required. Add an optional creation intro on Product.

Expose creation story only in the public detail contract, never in catalog rows. Provide owner CRUD/reorder and a dedicated image response protected by the same owner/admin/public visibility rules as ProductImage.

Do not make creation story a new moderation requirement without a separate product decision. Existing products may return an empty creation story; the UI must render an honest empty state.

Rejected acceptable workaround: JSON steps in Product. It shortens the migration but weakens validation, ordering, image ownership and partial updates.

Rejected hack: reinterpret the first four gallery images and technical metadata as creation history.

### Chosen durable fix: natural image dimensions

Store width and height from sharp metadata for ProductImage and process images. Make the migration safe for existing records, populate all new uploads, and provide a documented fallback until existing binaries are backfilled. Never download binary data in list queries merely to calculate aspect ratio.

### Chosen durable fix: server-owned discovery metadata

Extend the discovery response with status counts/facets needed by H5vf2. Add a paginated seller-works endpoint or equivalent server query accepting status, sort, page and limit. Creator pages must not sort/filter only the subset already returned by seller detail.

### Explicit blockers that must not be guessed

1. The H5vf2 filter Тип работы has no confirmed domain field. Before exposing it, map it to an existing owner-approved field or obtain a product decision and contract. Do not create a decorative filter.
2. The 40 px Utility Action in the authenticated header has no confirmed product behavior, and the product currently supports light mode only. Do not turn it into a fake theme toggle. Omit it with a recorded deliberate difference until its purpose is approved.
3. P42M0d contains Analytics. Do not show it unless a real authorized route exists.
4. FINAL Pen contains desktop frames only. Tablet/mobile behavior is derived implementation, not pixel-authoritative design; it requires founder review before release.

These blockers do not prevent shared components and confirmed fields from being implemented. They prevent the affected control from being called complete.

## 9. Chosen implementation strategy

Classification: durable fix.

Order:

    canonical baseline
    → contracts and persistence
    → shared tokens/primitives
    → header
    → cards
    → browse screens
    → product composition and tabs
    → creator profile
    → responsive derivation
    → cleanup and final acceptance

Why: the previous attempt changed complete screens before proving their shared masters. That allowed old layout anatomy to survive under new tokens. This order makes every reused element pass visual review once before screens consume it.

Rejected acceptable workaround: route-local CSS patches against the current screens. It is faster initially but duplicates spacing and guarantees drift.

Rejected hack: magic offsets, fixed negative margins, duplicate cards/players, fake API fields, hard-coded fixture values, any, ts-ignore, disabled lint rules, silent fallbacks or suppressHydrationWarning.

## 10. Sequential work packages and commit gates

### Stage 0 — lock the new design baseline

1. Validate current branch, dirty tree and starting SHA.
2. Verify the canonical SHA and all eight IDs.
3. Commit only the new Pen baseline and supplied tracked assets in a dedicated design commit.
4. Update design/pen/README.md and design status documents to the new SHA and set existing UI screens to Needs visual reimplementation.
5. Export or capture each FINAL frame at a fixed scale without mutating Pen.
6. Record the current runtime at 1440, 1024 and 390 with deterministic data.

Gate: canonical baseline commit exists; post-commit Pen diff is zero; high-resolution target evidence exists.

Suggested commit: docs: lock final pen baseline

### Stage 1 — backend contracts and deterministic fixtures

1. Add migrations for structured public socials, creation story/media and image dimensions.
2. Add strict contracts, public/private mappers and API client methods.
3. Add owner CRUD/reorder and public image visibility checks.
4. Add discovery facets and server-side creator-work filters/sort/pagination.
5. Update seller and product editors.
6. Update seed and E2E fixtures to match FINAL copy density, four creation steps and bid history.
7. Cover ownership, moderation lock, MIME validation, aggregate limits, public visibility and private handoff non-exposure.

Gate: backend/unit/contracts/integration checks pass with PostgreSQL. No UI uses fake values.

Suggested commit: feat: add final design data contracts

### Stage 2 — shared tokens, typography, icons and interaction primitives

1. Extract exact active values from jh6TI and FINAL instances.
2. Reconcile packages/design-tokens/src/tokens.ts; do not create a second system.
3. Update AppText roles only when multiple FINAL consumers need the role.
4. Implement exact icon mappings and shared menu/focus states.
5. Preserve minimum touch targets and focus-visible rings even when the visible glyph is smaller.
6. Add reduced-motion behavior for opacity/transform transitions.

Gate: isolated component harness matches jh6TI for default, hover, focus, pressed, open and reduced-motion states.

Suggested commit: refactor: align final shared ui foundation

### Stage 3 — GlobalHeader and account IA

1. Implement L9UV9 stable three-zone geometry at 1440.
2. Implement content selector, Authors route and real search submit.
3. Implement guest Login and authenticated Create/Profile states.
4. Route Create by seller capability: no profile → /profile; approved → /products/new; pending/changes requested → account menu profile state.
5. Move cabinet, purchases/application state and logout into AccountMenu.
6. Align each dropdown directly below its trigger; no large empty right space.
7. Preserve outside click, Escape, arrow-key/menu focus and focus return.

Gate: founder comparison for guest, buyer, pending seller, approved seller, admin and both open menus at 1440. No visible center drift between roles.

Suggested commit: feat: align final global header

### Stage 4 — shared AuctionCard and CreatorCard

1. Implement k5vYGf and SrXPq once.
2. Use square media with deliberate fill crop on catalog cards.
3. Zoom only the media 1 → 1.05 around 300 ms; bounds and text do not move.
4. Implement exact avatar/handle, metric labels, countdown and completed state.
5. Add long title, missing image, loading, focus and reduced-motion cases without borrowing ARCHIVE styling as visual authority.

Gate: component screenshots overlaid with jh6TI and no grid shift across interaction states.

Suggested commit: feat: align final discovery cards

### Stage 5 — Browse Works and Browse Authors

1. Compose H5vf2 from approved shared components and server query state.
2. Compose N4ebBk from CreatorCard and server sort.
3. Keep filter/search/sort/page in URL and reset page when query dimensions change.
4. Do not render unsupported controls from the blocker list.
5. Validate loading, empty, error, retry, no-image and long-content states.

Gate: exact 1440 overlays for H5vf2 and N4ebBk; functional query tests; no horizontal overflow.

Suggested commit: feat: align final browse screens

### Stage 6 — Product About composition

1. Rebuild ProductGallery for natural aspect and the sharp rounded artwork.
2. Rebuild X6Ksg as the one shared transaction component.
3. Compose L7ytbv hero, facts, author/share, atmosphere, tabs, about accordion and related works.
4. Preserve real bid validation, idempotency, minimum bid, realtime refresh, first-participation confirmation and role restrictions.
5. Implement sticky player from the same component, not a copy.

Gate: L7ytbv overlay at 1440 plus live/scheduled/ended and guest/buyer/seller states. Bid integration tests remain green.

Suggested commit: feat: align final product about

### Stage 7 — Product Creation and Bids states

1. Render cK8kD from the normalized creation-story contract.
2. Render XIzHe from the public alias-only bid contract.
3. Reuse Jh9jr and X6Ksg in both states.
4. Preserve deep links, invalid-tab fallback and browser history.

Gate: exact 1440 overlays for both tab states, four process images from real seed data, no PII in bids.

Suggested commit: feat: align final product tabs

### Stage 8 — Creator Profile

1. Recompose the public screen using MqUMz as the only target.
2. Do not compare against or implement HOXkZ; it is a rejected alternative for
   this route.
3. Render only present structured social links with correct accessible names.
4. Fetch creator works through server-owned status/sort/pagination.
5. Reuse AuctionCard; do not fork a profile card.

Gate: MqUMz overlay at 1440; public contract contains no handoff contact or user email.

Suggested commit: feat: align final creator profile

### Stage 9 — responsive derivation

1. Keep 1440 as the exact authority.
2. At 1024 reduce gutters/columns while preserving content order and complete controls.
3. At 390 use a single-column reading flow, safe-area sticky action, non-overlapping compact header and no clipped menus.
4. Do not scale the entire desktop canvas. Reflow components at composition pressure breakpoints.
5. Capture default, menu-open, long-content, loading, empty, error and sticky states.

Gate: founder approval of 1024 and 390 derived compositions, keyboard and physical iOS/Android smoke checks.

Suggested commit: feat: complete final responsive states

### Stage 10 — cleanup and truthfully close documentation

1. Remove only code made unused by these changes.
2. Remove route-local visual duplicates; keep one token layer and one master per shared component.
3. Update design status, implementation log, architecture and project status with actual evidence.
4. Do not mark a screen Implemented before overlay, state, responsive and accessibility gates pass.
5. Verify the canonical SHA and zero post-baseline Pen diff.

Gate: full affected graph green, founder approval recorded, no open P0/P1 mismatch.

Suggested commit: docs: close final ui cutover

## 11. Verification commands

Run from repository root. Validate package names and scripts against the current tree before execution.

    shasum -a 256 design/pen/bidplace-web-v2.pen
    git diff --check
    pnpm --filter @bidplace/database build
    pnpm --filter @bidplace/contracts test
    pnpm --filter @bidplace/contracts build
    pnpm --filter @bidplace/api-client build
    pnpm --filter @bidplace/design-tokens build
    pnpm --filter @bidplace/api typecheck
    pnpm --filter @bidplace/api lint
    pnpm --filter @bidplace/api test
    pnpm --filter @bidplace/api build
    pnpm --filter @bidplace/mobile typecheck
    pnpm --filter @bidplace/mobile lint
    pnpm --filter @bidplace/mobile build
    pnpm --filter @bidplace/mobile test:e2e-fence

With PostgreSQL available:

    pnpm docker:up
    pnpm db:migrate
    pnpm db:seed
    pnpm --filter @bidplace/api test:integration
    pnpm --filter @bidplace/mobile test:e2e

Do not report integration or visual acceptance as passed when PostgreSQL, Chromium, fonts or target exports were unavailable.

## 12. Visual acceptance protocol

For each screen and state:

1. Use the same deterministic fixture as the Pen frame.
2. Wait for Onest and Inter to load.
3. Capture runtime and target at the same viewport, DPR and scale.
4. Compare an overlay/difference image for page axes, component bounds, spacing, type metrics, radii, borders, colors, crop and sticky positions.
5. Classify every mismatch as code defect, renderer variance, missing asset, responsive derivation or approved deliberate difference.
6. Fix at the highest shared owner: token → primitive → shared component → screen.
7. Never compensate one mismatch with an opposite route-local offset.
8. Store evidence with route, role, fixture, viewport, commit and Pen node ID.

Any systematic shift, wrong icon, incorrect crop, wrong text hierarchy, missing state or unsupported fake control fails acceptance even when typecheck and E2E are green.

Minimum evidence matrix:

| Screen   | 1440                  | 1024    | 390     | Critical states                                                  |
| -------- | --------------------- | ------- | ------- | ---------------------------------------------------------------- |
| Header   | exact                 | derived | derived | guest, buyer, pending seller, approved seller, admin, menus open |
| Works    | exact H5vf2           | derived | derived | loading, empty, error, filters, hover, long title                |
| Authors  | exact N4ebBk          | derived | derived | loading, empty, error, sort, missing photo                       |
| Product  | exact L7ytbv          | derived | derived | live, scheduled, ended, sticky, bid validation                   |
| Creation | exact cK8kD           | derived | derived | four steps, empty story, missing process image                   |
| Bids     | exact XIzHe           | derived | derived | zero bids, leader, long alias, privacy                           |
| Creator  | exact MqUMz            | derived | derived | socials absent/present, filters, long bio                        |

## 13. Definition of done

The cutover is complete only when all of the following are true:

- the new canonical baseline is committed and unchanged by code work;
- all confirmed backend fields are real, validated and permission-safe;
- no public response exposes private handoff contact, email or binary data;
- one shared implementation exists for Header, AuctionCard, CreatorCard, AuctionPlayer and ProductTabs;
- every FINAL desktop screen passes fixed-scale comparison;
- derived 1024 and 390 states are founder-approved;
- loading, empty, error, missing media, focus, pressed, menu-open, sticky, long-content and reduced-motion states are verified;
- all required unit, integration, E2E, typecheck, lint and build commands pass;
- there are no route-local hacks, fake controls, dead links or duplicated business rules;
- status documentation says only what the evidence proves.

## 14. 2step handoff — Plan

### Objective

Implement the FINAL Pen v2 public UI and its minimum real data dependencies exactly and sequentially.

### Success criteria

Use sections 11–13. Desktop fidelity is measured against the exact FINAL IDs; responsive states require explicit review.

### Verified context

- Repository: /Users/yayauheny/projects/bidplace
- Branch at audit time: feature/pen-v2-ui
- Starting HEAD at audit time: 15dcaf0ef47fbca14090543be9c86bda2c16973c
- Canonical path and expected SHA are in section 2.
- The working tree already contained unrelated founder files; preserve them.
- Existing backend discovery/auth/auction work is useful and must not be rewritten without cause.

### Chosen approach

Durable fix: backend contracts first, then shared masters, then one screen at a time with a visual gate and a separate commit.

### Instruction for the execution window

Validate this package against the current working tree before editing. Stop if the canonical SHA, FINAL IDs, branch, contracts or protected-file rules differ. Never edit the Pen file after its baseline commit. Do not begin the next stage until the current stage gate passes. Record exact commands, screenshots, deliberate differences and remaining blockers in every handoff.
