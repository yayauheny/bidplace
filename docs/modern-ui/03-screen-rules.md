# Screen rules

Status: final target composition; implementation order is governed by `05-migration-plan.md` and `10-final-cutover-plan.md`.

Every target screen must have loading, empty, error, offline/stale where relevant, responsive, keyboard/focus, screen-reader, and reduced-motion states. Business behavior follows `docs/product/05-MVP-RFC.md`; Modern UI does not change it.

## Shared shell

```text
Desktop: compact left rail | centred main content | optional contextual panel
Mobile: local context at top | scroll content | sticky BottomActionBar when needed | centred floating bottom navigation
```

Use 20–24 px mobile gutters, 32 px desktop gutters, one dominant CTA, and no hidden auction price/deadline. Loading preserves image/card geometry; empty states explain the next meaningful action; errors allow retry; offline states never imply a bid succeeded.

Guest gets Catalog and Sign in. Buyer gets Catalog, Activity and an Account/logout sheet. Seller additionally gets a Seller sheet with Profile, New Product and New Listing. Admin gets Moderation. Desktop rail exposes the same role-filtered destinations. Search, filters, saved items, Settings and dashboard routes are not created by this redesign.

## Screen matrix

| Screen | Goal and mandatory data | Primary / secondary actions | Desktop | Mobile |
| --- | --- | --- | --- | --- |
| Home | Discover approved items; image, title, current price/bid, deadline/state | Open item | Rail, editorial grid | Local context, discovery grid/list |
| Product detail | Understand item and place an honest bid | Bid CTA; back, share/save only if scoped | Gallery + content + auction panel | Gallery, auction-critical summary, tabs, sticky action |
| Activity | Understand participation and outcomes | Open item/order; retry | Compact rows in content column | Compact rows, one status per row |
| Order | Complete authorized handoff | Role-specific handoff action | Summary + status panel | Summary + sticky action where applicable |
| Seller profile | Submit or correct seller identity/profile | Save/submit; upload photo | Profile form + preview | Staged form, permission-safe image picker |
| Product creation | Create an authored item draft | Continue/save/submit | Form and preview columns | Step form, current fields only |
| Product editing | Correct unlocked item data/media | Save, reorder, submit | Form + gallery management | Staged fields + stable gallery controls |
| Auction creation | Set product, BYN start price, schedule | Create/schedule | Form with clear timing/price | Staged form, validation near field |
| Admin moderation | Review and act on seller/product/order | Approve/suspend/archive/cancel with confirmation | Functional review table/panel | Compact review rows and confirmation sheet |

## Detailed invariants and wireframes

### Home

```text
Local context: logo · account/menu
Editorial intro (optional)
Image-first results
  image 4:5
  title
  current price or bid · deadline/status
```

Do not add a badge stack, fake scarcity, unimplemented filters/search or author/metadata lines that push the item out of discovery density. Network error offers retry; offline says the snapshot may be stale.

### Product detail

```text
Back
Gallery / placeholder
Title · seller/provenance summary
Current bid · minimum next bid · server deadline/status
Primary: Сделать ставку
ContentTabs: О предмете | История создания | Происхождение
Bid history / participation / related information
Mobile: BottomActionBar
```

OTP and bid confirmation are progressive disclosure after the CTA. Loading keeps gallery and auction summary geometry. Live screens show reconnect/stale state; rejected bids explain the server result and never show success styling.

Client-side input validation uses the MVP BYN increment table for immediate feedback. The server is authoritative for current price, minimum, state, close and soft close. The first Bid per buyer/Listing explicitly confirms Product, amount, server minimum, deadline and irreversible consequence; later Bids skip confirmation only when participation is known. A stale rejection refetches the HTTP snapshot and explains the new price/minimum.

### Activity and order

```text
Screen title
ActivityRow: image · item · primary status · price · deadline/order action
```

Order shows only role-authorized contacts and handoff state. Do not expose bidder identity or private contacts in public/activity rows. Loading, empty, error, stale, and unauthorized states are distinct.

### Seller forms

```text
Back · step/status
Current step fields only
Field label → hint → input → error
Image selection/preview when relevant
Save / Continue / Submit
```

Use React Hook Form + Zod through adapters, preserve server validation, and keep preview separate from editing. Long Russian text, keyboard avoidance, permission denial, upload progress, and failed upload are mandatory test cases.

Preview is a read-only mode in the existing authorized seller route. It never changes Product status or public visibility: submit-to-moderation, admin approval and Listing lifecycle remain the existing publication path. Upload progress uses a truthful spinner and image count when byte progress is unavailable.

### Account sheet and admin

```text
Account sheet: account identity · logout
Admin: filters/status · review row/panel · explicit confirmation · result/error
```

Account sheet is limited to existing logout/account access and is not a Settings route. Admin is functional and uses the same tokens, typography, and components. A destructive or irreversible action requires explicit confirmation and clear result; do not introduce a generic dashboard/card grid.

## State rules

| State | Rule |
| --- | --- |
| Loading | Preserve layout geometry; use Skeleton/AppImage placeholder; do not shift CTA unpredictably. |
| Empty | Explain why and give one next action; no decorative empty illustration unless approved. |
| Error | Plain-language message, retry, preserve safe input; no silent fallback. |
| Offline/stale | Label stale/reconnecting data; never claim a bid/order action completed without server confirmation. |
| Focus-visible | Visible non-color-only ring and keyboard order on web. |
| Reduced motion | Remove scale/translate transitions; preserve state changes and timing semantics. |
| Accessibility | Every icon-only control has a label; status uses text and structure, not color alone; fields bind label/hint/error. |
