# bidplace — product and MVP design audit

Snapshot: 2026-08-13
Status: design-input snapshot; not a canonical product decision
Purpose: give a design model a complete product/data boundary without opening the repository or inheriting the current frontend.

## 1. Source hierarchy

When claims conflict, use this order:

1. Confirmed product behavior and boundaries in `docs/product/01-PRODUCT-FOUNDATION.md`, `05-MVP-RFC.md`, `08-SELLER-AND-ITEM-POLICY.md`, `09-TRUST-AND-AUCTION-INTEGRITY.md`, and later revising entries in `12-DECISION-LOG.md`.
2. Runtime contracts in `packages/contracts/src/*` and server-owned behavior in `apps/api/src/*`.
3. Current implementation status in `docs/product/11-PROJECT-STATUS.md`.
4. Founder decisions recorded in `design/creator-first/FOUNDER-DECISIONS.md`.
5. This audit's synthesis.

The existing frontend, its design tokens, and the canonical Pen v2 file are not visual inputs for the new direction. They are consulted only by the audit author to preserve supported behavior. The new direction is exploratory until the founder explicitly promotes it; it does not silently replace protected product/design documents.

## 2. Product in one sentence

> bidplace is a curated creator homebase and cultural commerce surface where a person, their story, and their authored work establish value before a direct auction action.

Confirmed product core: `docs/product/01-PRODUCT-FOUNDATION.md` sections 1–10.

### Value chain

```text
creator
→ creator story and practice
→ authored works
→ the story/process/provenance of one work
→ scheduled release/auction
→ bid and off-platform handoff
```

Auction, release, editorial collections, and recommendations organize these relationships. They must not displace the creator and work as the primary entities.

### Promise to creators

- Bring a real authored object, its story, and media.
- Receive a coherent public profile and a presentation-ready work URL.
- Share that URL directly with an existing audience.
- Use a clear scheduled auction without designing a storefront or learning marketplace merchandising.
- Keep public identity separate from private handoff contact data.

Only the current profile, Product, Listing, moderation, auction, and handoff capabilities are confirmed. Automated launch planning, fixed-price sales, rich creator analytics, and concierge tooling remain future concepts.

### Promise to visitors and buyers

- Discover a person and understand why their work matters.
- Browse quickly without a wall of commerce metadata.
- Open a work and study its story in calm, sequential chapters.
- Find price, auction status, and the bid action without hunting.
- Trust that identity, visibility, bidding, winner selection, and contacts are server-controlled.

## 3. Product boundaries

bidplace is not:

- a universal marketplace, classified-ads board, resale platform, or dropshipping catalog;
- a social network optimized for posting, likes, comments, and engagement;
- an academic gallery or luxury auction house;
- a live-stream-first platform;
- a crypto, NFT, investment, or artificial-scarcity product;
- a platform that manufactures demand with fake bids, fake counters, or fake sold-out states.

The useful social qualities are identity, continuity, following a creator's world, sharing, and discovery. They must always deepen understanding of a creator, work, or release.

## 4. Market, language, and platform

| Dimension | Confirmed boundary |
| --- | --- |
| Initial market | Belarus |
| Primary interface | Russian |
| Currency | BYN only |
| Initial supply | Original physical creator-made work |
| Seller access | Public application, manual approval |
| Product visibility | Manual moderation before public visibility |
| Payment/delivery | Outside the platform in MVP |
| Runtime client | Expo 57, React Native 0.86, React Native Web, Expo Router |
| Target surfaces | Web, iOS, Android from one product/design system |
| Validation viewports | 1440 desktop, 1024 tablet, 390 mobile |

Implementation source: `apps/mobile/package.json`, `docs/product/10-CODE-ARCHITECTURE.md`.

## 5. Roles and capabilities

### Visitor

- Open Home, Explore, creator profile, work/release, creation story, and public bid history.
- See real author/work/auction information without registration.
- Share a public Product URL.
- Start registration when attempting to bid.

### Registered buyer

- Verify email before the first bid.
- Accept the current version of service rules.
- Confirm the first bid in a particular Listing against a fresh server snapshot.
- See participation states and an authorized Order after winning.

### Creator

- Apply for a SellerProfile and wait for moderation.
- After approval, create a private Product draft and its story/process steps.
- Upload and reorder Product images.
- Submit Product for moderation.
- Create and schedule an auction Listing for an approved Product.
- Share public preview only after supported approval/visibility conditions.
- See bids and complete an off-platform handoff through role-scoped Order data.

### Admin

- Moderate seller applications and Products.
- Inspect auction history and audit facts.
- Cancel an Order and manually choose a replacement winner when necessary.
- Cannot bid and has no buyer activity.

## 6. Supported entity and data model

### Public creator profile

Runtime public fields:

| Field | Required/public behavior |
| --- | --- |
| `slug` | Stable public creator route identifier |
| `sellerType` | `creator` or later `influencer`; do not foreground this label |
| `discipline` | Free public discipline, maximum 160 characters |
| `fullName` | Public name, personal name, or creator title |
| `profilePhotoUrl` | Public profile image |
| `country` | Public; city is not currently a creator field |
| `shortDescription` | Current public creator statement/description |
| `telegramUrl` | Optional structured public link |
| `instagramUrl` | Optional structured public link |
| `websiteUrl` | Optional structured public link |
| `socialLink` | Legacy required public URL; do not invent its platform |
| `workCount` | Available on author-list cards |
| `statusCounts` | Counts of `SCHEDULED`, `LIVE`, `ENDED` works on creator detail |

Not available and therefore forbidden as real UI facts: follower counts, ratings, awards, sales totals, verification badge, response time, location beyond country, custom per-author theme, posts, likes, or comments.

Sources: `packages/contracts/src/seller-profile.ts`, `public-seller.ts`.

### Public work/Product

| Group | Available fields |
| --- | --- |
| Identity | `publicId`, `title`, category, author profile |
| Value story | `story`, `uniqueness`, `provenance` |
| Object facts | technique, materials, dimensions, weight, year, condition, packaging |
| Place/handoff | city, delivery information |
| Media | 1–10 ordered Product images with dimensions when known |
| Creation story | optional intro and up to 20 ordered steps; each step has title, body, and optional image |
| Publication | `publishedAt` and moderation status |

Public projection requires non-empty title, story, uniqueness, provenance, city, delivery information, category, and at least one Product image. Optional data must have honest missing states.

Sources: `packages/contracts/src/product.ts`, `public-product.ts`.

### Auction Listing

| Field | Behavior |
| --- | --- |
| Type | `AUCTION` only |
| Status | `DRAFT`, `SCHEDULED`, `LIVE`, `ENDED`, `CANCELLED` |
| Currency | `BYN` only |
| Time | `startsAt`, original end, current server-controlled end, close time |
| Price | start price, current price, server-calculated next minimum |
| Activity | bid count and public bid history |
| Soft close | bid in final 60 seconds extends by 60 seconds, capped at 600 seconds total |

No reserve, Buy Now, proxy bid ceiling, platform bids, payment UI, or delivery machine exists in MVP.

Sources: `packages/contracts/src/listing.ts`, `bid.ts`, `DEC-039`, `DEC-050`, `DEC-056`.

### Participation and handoff

Buyer activity states:

```text
LEADING
OUTBID
WON
LOST
AWAITING_SELLER_CONTACT
WIN_CANCELLED
COMPLETED
```

Order states:

```text
PENDING_CONTACT → CONTACTED → COMPLETED | HANDOFF_FAILED | CANCELLED
```

Contacts are private. Buyer and seller receive different Order projections. Public creator profiles never expose the private handoff contact merely because a public social link exists.

Sources: `packages/contracts/src/activity.ts`, `order.ts`, `docs/product/09-TRUST-AND-AUCTION-INTEGRITY.md`.

## 7. Public screen contract

### P0-A — Creator profile

Primary question: who is this person, what do they make, and what should I open next?

Required blocks:

1. Public creator identity and portrait.
2. Short creator statement.
3. Present public contact/social links.
4. One current or highlighted work drawn from real public Products.
5. Works grouped or filterable by `LIVE`, `SCHEDULED`, `ENDED` when useful.
6. Compact biography/practice context using existing description only.
7. Clear shareable URL and transition into a selected work.

The first system uses one resilient template. No full-page photo-derived theme, manually art-directed creator page, or autogenerated low-contrast palette. A bounded lower caption inside one creator/work media component may reuse that same public image as a mirror/blur layer only when it has an opaque fallback and verified contrast.

### P0-B — Work/release detail

Primary question: why is this work valuable, and what can I do now?

Required reading order:

1. Work hero: image, title, creator, one concise value statement.
2. Minimal auction state: current/start price and primary action; deadline remains accessible but visually secondary.
3. Full object views and details.
4. The story of the work.
5. Creation intro and ordered process steps.
6. Technique, materials, dimensions, year, uniqueness, provenance.
7. Delivery/city and other practical facts.
8. Public bid history using alias, amount, time only.
9. More works from the creator.

Transaction data must remain available in `LIVE` state, including on mobile, without turning the page hero into a marketplace SKU panel.

### P1 — Home

Use current Home projection only:

- `topAuctions`;
- `creators`;
- `newWorks`.

Home should feel like an editorial issue, not a dashboard. First viewport presents one creator/work/moment together. It then creates clear routes into creators, works, and Explore.

### P1 — Global creator action

Creator activation is a primary service capability and remains visible in the public shell without turning Home or Explore into a creator dashboard.

Capability-aware destinations:

| Current capability | Visible action and destination |
| --- | --- |
| Visitor or registered non-creator | `Стать автором` / `Создать кабинет` → authentication when needed, then SellerProfile application/onboarding with return path |
| Seller application awaiting review or changes | Honest cabinet/status/correction path; never imply that a work can already be published |
| Approved creator | `+ Добавить работу` → private Product draft creation |
| Restricted or rejected state | Real status and allowed next step; no fake enabled action |

Desktop uses an explicit dark rounded action with a white plus and text. Mobile may use a compact high-contrast plus in the global shell, but it retains an accessible name and is never available only through an overflow menu.

The creator profile/application and Product draft flows are sequential service flows, not social posting. Use one principal task per step, preview supplied media, show inline loading/success/error/disabled states, and preserve real moderation and permission boundaries. Use `работа` or `предмет`, never `post`, `mint`, or `drop` as an MVP field label.

### P1 — Explore works and creators

Current server-backed capabilities:

- Works: query, author, status, category, materials, uniqueness, price/year ranges, pagination, and sort.
- Creators: query, pagination, activity/name sort.
- Creator works: status filter and activity/newest/price sort.

Founder direction: discovery cards hide price and deadline by default to prioritize desire and meaning. Filters may expose transactional narrowing in a secondary control layer. This is a design decision, not a change to backend availability.

### P1 — Auction interaction

Required states:

- scheduled/preview;
- live guest;
- live authenticated but email/rules not ready;
- live eligible;
- first-bid confirmation;
- submitting;
- accepted/leading;
- outbid;
- stale minimum/refetch;
- validation/server rejection;
- soft-close extension;
- ended won/lost/no bids;
- role-disabled, including admin and self-bid protection.

### P2 — Supporting MVP

- Registration/login and return route.
- Email code verification and versioned rule acceptance.
- Buyer Activity.
- Role-scoped Order/handoff.
- Creator application/profile creation.
- Product creation, creation story, images, moderation, Listing scheduling.
- Admin moderation.

These remain functionally required. Full state coverage follows the public creator/work vertical slice, but the first design contract must already include the global creator action and a minimum 390 px creator-onboarding/work-creation sequence so the product's main creator utility is not designed as an afterthought.

## 8. Discovery-card presentation rule

For Home, recommendations, and Explore, the default work card contains:

```text
strong media
work title
creator name
one short descriptor when the composition supports it
unambiguous navigation/gallery affordance
```

Do not put price, countdown, dimensions, materials, bid count, tags, and a CTA stack on every card. Price and deadline remain available on the work page and in explicit auction-oriented filtering/status contexts.

## 9. Content contract for design fixtures

Design must be tested with at least these fixtures:

1. Short creator name, short statement, rich work story, six process frames, video available.
2. Long creator name, long statement, one Product image, no creation steps, no video.
3. Three public social links versus one legacy link only.
4. Scheduled, live, soft-close-extended, ended-with-winner, and ended-with-no-bids.
5. Missing optional technique/year/weight/packaging without fake placeholders.
6. Portrait, landscape, square, detail, and scale/reference artwork images.

Video is a design-ready optional extension, not a confirmed Product contract. It must never be required for the MVP layout to work.

## 10. MVP versus future

### Must work now

- Creator profile and public links.
- Public work story and process images.
- Scheduled timed auction in BYN.
- Shareable Product URL.
- Email/rules gate, bid confirmation, status, history, and handoff.
- Manual moderation and role/privacy constraints.

### Design-compatible, implement later

- Wishlist/saved work.
- Follow creator and release reminders.
- Fixed-price sale and limited drops.
- Better creator launch planning and reusable presentation assistance.
- Editorial collections and Pinterest-like recommendations.
- Video process stories.

These may appear only in clearly labelled future boards after P0/P1. They must not masquerade as working MVP controls.

### Explicitly out of scope

- Feed, comments, public likes, public follower metrics.
- Chat/internal inbox.
- Payments, escrow, shipping workflow.
- Live streaming.
- Ratings and marketplace reputation scores.
- AI-generated provenance or automated scarcity.

## 11. Required states and quality gates

Every approved screen requires:

- default, realistic long content, and minimal content;
- loading, empty, recoverable error, and missing/failed media;
- guest and relevant authenticated roles;
- keyboard focus, hover, pressed, disabled, validation, and success;
- 1440, 1024, and 390 compositions;
- text zoom/localization resilience;
- reduced motion;
- 44×44 minimum touch targets and WCAG AA contrast.

## 12. Known design risks

1. **Marketplace drift:** exposing price/time on every discovery card makes the product feel like inventory.
2. **Magazine drift:** editorial beauty without a persistent understandable auction action hides the actual service.
3. **Social drift:** creator-first can become an empty engagement feed.
4. **Luxury drift:** art storytelling can become conservative, expensive, and exclusionary.
5. **Maximalism drift:** Get Hyped energy can overwhelm navigation and object comprehension.
6. **Content dependency:** rich editorial layouts fail when a creator supplies one image and a short description.
7. **Manual-art-direction dependency:** unique creator theming does not scale and can make contrast unreliable.
8. **Contract hallucination:** current backend has no wishlist, follow, video, fixed price, payment, or recommendation contract.

The final system succeeds only when it remains expressive with sparse content and straightforward under a live auction.
