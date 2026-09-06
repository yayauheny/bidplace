# Figma read-only inventory and gap map — 2026-09-06

## Outcome and method

**Outcome: partial.** The six supplied Figma entry nodes were opened in the
original `Bidplace` file in an anonymous, read-only session. No edit, comment,
share, export, duplicate, publish, permission, or component action was used.
The anonymous canvas exposed the boards visually but not the layer tree,
inspect values, or all frame names. Therefore this is a reliable inventory of
entry nodes and visually observable component families, not a reconstructed
specification. Exact geometry, fonts, token values, subframe names, and hidden
states are explicitly **not verifiable**.

Success criteria for this audit were: preserve the source; distinguish visual
evidence from product/API truth; map each accessible board to the current
runtime; and leave a dependency-ordered, decision-free gap list. The source
was never mutated, and this branch changes this file only.

## Evidence ledger

| Figma entry node | Result | Observable evidence | Limitation |
| --- | --- | --- | --- |
| `436:1136` — home | opened | Board caption `Главная страница`; a tall mobile home composition and several adjacent state/frame columns | Individual labels and content are not readable at the available canvas scale. |
| `143:147` — components | opened | `Иконки кнопок`, `Кнопки`, `Поля ввода`; visible button and input variants | Component property names, values, typography and measurements require Figma inspect access. |
| `117:72` — catalog | opened | Two catalog compositions and four filter compositions; labels include `Фильтры` | Filter option text and all responsive states are not fully legible. |
| `1:3` — author | opened | A board containing numerous author/profile and work-card-like frames | Canvas labels are truncated; individual frame identity is not defensibly recoverable. |
| `1:4` — work | opened | Multiple groups of tall work-detail and action-state frames | Frame titles and interaction transitions are not exposed. |
| `1:5` — auth | opened | `Section 1`, partially visible `Регис…`, `Фор…`, and `Стать автором` boards, including form-like frames | Full form copy, validation, focus and navigation behavior are not exposed. |

Source URLs are the six read-only links in
[`10-FIGMA-READONLY-INVENTORY.md`](../tasks/2026-09-06-reconciliation/10-FIGMA-READONLY-INVENTORY.md).
No claim below derives measurements or state behavior from the canonical Pen
file, screenshots outside this session, or a guess.

## Observed visual system

### Tokens and primitives

| Area | Actually observed | Not verifiable from this access |
| --- | --- | --- |
| Colour | Near-black filled primary buttons; white/transparent outlined alternatives; neutral disabled controls; blue focused input outline; red error outline and helper text; green success outline | Token names, hex values, contrast ratios and dark-mode behaviour. |
| Shape | Pill-like button variants and rounded text fields; icon-only controls in a compact grid | Radius values, spacing scale and hit-target dimensions. |
| Type | Russian interface labels; labels/placeholder text are visibly smaller than action labels | Font family, weights, sizes, line-height and truncation rules. |
| Elevation | Flat outlined controls and solid controls are visible | Shadow/elevation token values and overlay layering. |
| Icons | A semantic icon grid is present; visible roles include adjustment/filter, arrows/chevrons, search, trash, close, plus, external/social, play/media, share and navigation | Exact icon names, stroke weight, licensing and SVG/export assets. |

The task names Hugeicons “Stroke Rounded” as a reference. That is a visual
lead, not a license conclusion or a mandate to import/export any asset.

### Shared component and variant matrix

| Component family | Observed variants | Current production counterpart | Readiness |
| --- | --- | --- | --- |
| Buttons | Filled dark, outline, light/disabled, focus-like and compact text/icon presentations | [`Button.tsx`](../../apps/mobile/src/components/ui/Button.tsx) | Visual parity requires inspect values and a selected responsive contract. |
| Inputs | Default, hover, filled, focused, error with helper, success, disabled | [`Input.tsx`](../../apps/mobile/src/components/ui/Input.tsx) and feature forms | Validation semantics exist in feature code; Figma focus/keyboard states are not verifiable. |
| Icon controls | Semantic icon set | Shared navigation/header/card controls | Name-to-asset mapping is missing; do not substitute guessed icons. |
| Work/catalog cards | Home and catalog card compositions | [`AuctionCard.tsx`](../../apps/mobile/src/components/ui/AuctionCard.tsx), product list/detail features | Card variants, media ratios and long-content rules are not fully observable. |
| Filters | Filter entry board plus several choice/list states | [`product-list-screen.tsx`](../../apps/mobile/src/features/products/product-list-screen.tsx), [`public-seller-screen.tsx`](../../apps/mobile/src/features/sellers/public-seller-screen.tsx) | Which facets are canonical for each route is not confirmed by Figma. |
| Auth/author forms | Registration/form and `Стать автором` boards | Auth forms and seller profile/product draft features | Legal copy, consent placement and validation states require product/legal decisions. |

## Screens, routes, contracts and states

Status definitions: **observed** means visible in the supplied Figma board;
**missing** means no supplied board/evidence was found; **not verifiable** means
the state may exist but cannot be established without layer/prototype access.

| Figma area / node | Current mobile route and primary component | Current API / contract truth | State evidence and readiness |
| --- | --- | --- | --- |
| Home `436:1136` | `/` → [`apps/mobile/src/app/index.tsx`](../../apps/mobile/src/app/index.tsx); discovery/card components | Discovery and public Product/listing responses through `packages/api-client` | Base mobile composition observed. Loading, empty, error, long-content, keyboard, focus, screen-reader and breakpoint states: not verifiable. **Needs product completion** because Work-first/sale formats are unresolved. |
| Catalog `117:72` | `/works`, `/search` → product list/search features | `GET /api/products`; public discovery query/contracts | Catalog and filters observed. Filter flow, results-empty/error, URL state, applied-filter accessibility and responsive layout: not verifiable. **Usable only for current auction runtime**, not final target mechanics. |
| Author `1:3` | `/authors`, `/seller/[slug]` → public seller screens | `GET /api/sellers`, `GET /api/sellers/:slug/detail` | Author/profile-like frames observed. Portfolio-only Work, author long profile, unavailable author, error and responsive states: not verifiable. **Needs product completion.** |
| Work `1:4` | `/product/[publicId]` → [`product-screen.tsx`](../../apps/mobile/src/features/products/product-screen.tsx) | `GET /api/products/:publicId`; current `Product` + auction-only `Listing` | Work/detail and action-state groups observed. Auction action error/loading, fixed buy, offer, cancelled/relist, legal consent and keyboard/focus states: missing or not verifiable. **Needs product completion.** |
| Auth / author application `1:5` | `/login`, `/register`, seller profile and draft routes | Auth, seller-profile and product-write contracts | Form and `Стать автором` groups observed. Versioned registration/publish acceptance, validation, recovery and accessibility states: not verifiable. **Needs product and legal completion.** |
| Components `143:147` | Shared UI primitives and layout components | No API contract | Button/input/icon variants observed. Full variant matrix, accessibility names, focus rings and responsive primitives: not verifiable. **Not a production handoff.** |
| Purchases / sales | `/me/activity`, `/order/[publicId]`, `/(seller)/orders` | `GET /api/me/activity`, `GET /api/orders`, `GET /api/orders/:publicId`; activity/order contracts | No separately identified supplied Figma board. T04/T05 runtime screens exist, including cancelled history. **Missing visual handoff.** |
| Complaints / notifications / legal footer | No current dedicated route or contract found | No complaint or in-app notification client/model found | No supplied, identifiable board. **Missing.** |

The current schema confirms that `ListingType` is `AUCTION` only and that
`Product` remains the persisted item identity; there is no separate `Work`
model yet in [`schema.prisma`](../../packages/database/prisma/schema.prisma).
This runtime fact overrides any visual implication from a static frame.

## Product and owner-document conflicts

`DEC-075` and MVP RFC §21 confirm a future separate Work/Listing lifecycle,
portfolio-only Work, three sale mechanics, immutable history, visible cancelled
outcomes, in-app notifications, complaints and action-specific legal UX. The
current runtime is auction-only `Product`/`Listing`, with seller orders and
buyer activity added by T04/T05. This is a known implementation gap, not a
choice for this audit to resolve.

| Topic | Owner-document truth | Figma evidence | Conflict / required owner |
| --- | --- | --- | --- |
| Work-first | Work can exist without an active Listing; separate identities/lifecycles | Work-like visual area exists, but its persistence/state semantics are not readable | Do not treat a visual “work” frame as proof of Work-first implementation. T12/founder contract required. |
| Sale mechanics | Auction, fixed sale and optional buyer offer are target MVP; offer/fixed details open | Action-state frames exist but their labels/flows are not fully readable | Do not infer fixed/offer policy from Figma. Founder + lawyer after T01/T02/T11. |
| Cabinet history | IA is `Покупки / Продажи`; cancelled/failed stay visible | No identified dedicated board | T04/T05 are runtime-only visual gaps. Designer handoff required. |
| Legal UX | Versioned acceptances at registration, publish, bid, fixed buy, offer and contact disclosure | Form/action boards are present, but copy and placement are not readable | Legal matrix and lawyer validation are P0 dependencies. |
| Complaints/notifications | Both are required before public MVP | No identified supplied board | Missing product/API/UI specification. |
| Redesign timing | Final redesign comes after stable product/legal/core flows; source Figma is read-only | Static frames alone cannot close dependencies | Preserve the ordering; do not start redesign. |

## Explicit gap list and screen readiness

The following is ordered by product risk, not visual size.

1. **P0 — T12 Work-first contract:** separate Work/Listing states, attach/relist
   preconditions, archival, visibility and immutable historical links have no
   executable specification.
2. **P0 — fixed sale:** contract moment, atomic unique-work purchase,
   cancellation/non-payment and consent copy are not selected.
3. **P0 — buyer offer:** expiry, revoke, counteroffer and competing-buy rules
   are open; no UI state may decide them.
4. **P0 — legal UX:** current rules acceptance is only user/rules-version based;
   written BY/RF answers and action-specific versioned acceptance surfaces for
   registration, publish, bid, purchase, offer and contact disclosure are absent.
5. **P0 — complaint and notification contracts:** no current domain/API/UI
   handoff for privacy-safe complaint evidence or in-app notices.
6. **P1 — Work-first creation:** current product draft combines item and sale
   workflow; no verified Figma handoff separates portfolio creation and sale
   attachment.
7. **P1 — sale-format selection:** no verified final step that cleanly presents
   auction/fixed/offer with only the confirmed mechanics.
8. **P1 — cabinet:** `Покупки / Продажи`, cancelled order history and activity
   variants lack a verified Figma board despite current runtime support.
9. **P1 — catalogue/detail state contracts:** filters, long content, loading,
   error, focus, keyboard, screen-reader and responsive variants cannot be
   accepted from the visible boards.
10. **P1 — asset handoff:** icon semantic names, token values, media crops and
    export policy cannot be taken from anonymous canvas viewing.

## Asset/export manifest for a later approved handoff

Do not export now. The designer should provide a versioned manifest containing:

- semantic icon role, exact Hugeicons/other source name, stroke/size/color token
  and license/source reference;
- image/artwork asset identity, crop/aspect-ratio, responsive rendition needs,
  alt-text owner and storage source;
- token names and values for colour, typography, spacing, radius, elevation and
  motion/reduced-motion;
- every component property, default, disabled/loading/error/focus state and
  accessibility name;
- breakpoint and long-content behaviour for each screen; and
- export eligibility and file/version identifier, without overwriting the
  canonical Pen or the original Figma file.

## Questions for founder and designer

### P0

1. Approve the executable T12 Work/Listing lifecycle: who can see a
   portfolio-only/archived Work, when a Listing can attach/relist, and what
   history remains immutable.
2. After T01/T11 and written lawyer advice, select fixed-sale and buyer-offer
   contracts before designing their action modals or confirmation copy.
3. Approve the legal UX matrix and exact owner/version/retention contract for
   each acceptance and contact disclosure.
4. Define complaint and in-app notification domain contracts, privacy rules and
   mandatory UI states before any screens are handed off.

### P1

5. Provide a Figma board for `Покупки / Продажи`, including cancelled/failed
   history, empty/error/loading and order-detail navigation.
6. Provide a Work-first create flow and a separate final sale-format step;
   identify every allowed state and transition rather than encoding policy in
   button copy.
7. Identify canonical catalogue/detail responsive, keyboard/focus, long-content
   and screen-reader states for the currently supported routes.
8. Publish a read-only inspect/export handoff or token/component manifest so
   exact asset and token claims can be verified.

### P2

9. Confirm whether current mobile-first boards are the intended source for a
   later public web MVP, and which desktop/tablet breakpoints must be designed.
10. Identify the canonical icon source, semantic names and licensing evidence;
    the anonymous board alone is insufficient.

## Dependency order

1. Finish the implementation invariant from T03 and retain its review evidence.
2. Use T01 marketplace evidence and T11 abuse controls with the written T02
   legal validation to select the open fixed-sale, offer, non-payment/contact
   and consent contracts.
3. Approve and document T12 Work-first lifecycle and immutable-history rules.
4. Implement the resulting domain, API and audit/authorization invariants;
   then complaints, notifications and required legal surfaces.
5. Verify purchase/sales history, cancelled/relist and all error/edge flows
   against those contracts.
6. Obtain the approved Figma token/component/asset handoff and map every screen
   to actual API fields.
7. **Only then start redesign implementation.**

## Immutability proof

- Figma was accessed through supplied URLs only; no mutating Figma action was
  invoked.
- No `.pen` path was read, written, renamed or exported during this task.
- The intended Git diff contains only this audit file; the pre-commit checks
  recorded with the task verify that fact and `git diff --check` is clean.
