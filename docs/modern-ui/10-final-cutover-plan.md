# Final Modern UI implementation contract

Status: **Confirmed plan — implementation has not started**
Decision: `DEC-055`, `DEC-056`
Branch: `feature/modern-ui-final` from `5e71627`

This is the executable plan for the final redesign. It replaces the bridge/pilot implementation strategy. It does not add product features or change backend authority.

## 1. Goal and definition of done

Deliver one final UI system for every existing working route:

- `/`, `/product/[publicId]`;
- `/login`, `/register`, email verification and rules acceptance;
- `/me/activity`, `/order/[publicId]`;
- seller profile, Product create/edit and Listing creation;
- `/admin` moderation;
- shared role-aware navigation.

Done means all of the following are true:

1. every route uses the same Modern UI-kit;
2. no production source imports Tamagui or a legacy UI component;
3. no runtime bridge, legacy fallback, feature flag or partial target route remains;
4. Bid, OTP/rules, realtime refetch, soft close, Order privacy, moderation and seller locks pass their existing and new tests;
5. web, iOS and Android pass the acceptance matrix; founder accepts visual/device QA;
6. code and design/product documentation describe the same commit.

## 2. Fixed decisions

| Area | Decision |
| --- | --- |
| Visual stack | NativeWind v4, RN Primitives, Lucide only through `AppIcon`; React Native Reusables is pattern source only. Exact Expo 57-compatible pins are a Phase 0 ADR gate. |
| Overlays | One bidplace adapter. Gorhom Bottom Sheet on native; RN Primitives Dialog/Popover on web/desktop. |
| Brand | Temporary Inter wordmark on mobile; compact existing mark on desktop. Replace only when approved assets arrive. |
| Theme | Light-only MVP. Semantic tokens must permit later dark mode without shipping it now. |
| Navigation | Centred mobile floating dock; desktop left rail. Only implemented role-filtered destinations. |
| Bid | Client validates documented increments; server decides final result. First Bid per buyer/Listing confirms; later Bid does not when participation is known. |
| Product detail | Mobile bottom action; desktop contextual sticky auction panel. Auction facts precede tabs. |
| Seller preview | Read-only mode in existing seller route; no status change, public route or self-publication. |
| Upload | Spinner and truthful image count; no fake percentage. |
| Destructive actions | Confirm image delete, admin archive/suspend/cancel and irreversible Order action; do not confirm reorder. |
| Motion | Shared reduced-motion-safe presets; no haptics in MVP. |
| Delivery | Clean final cutover before production; no runtime rollback UI. |

## 3. Phase 0 — baseline, ADR and proof

### Work

- Record exact versions, Expo/RN compatibility, package licences and adapter ownership in an ADR.
- Install only selected target libraries with exact pins after proof. Do not retain experimental dependencies from the pilot branch.
- Configure NativeWind, Metro, Babel, TypeScript and ESLint without automatic `tsconfig` mutation.
- Load Inter and PT Mono and verify Cyrillic with real Russian content on web, iOS and Android.
- Create the screenshot/interaction baseline at 320, 375, 390, 768, 1024, 1025 and 1440 px.

### Files likely changed

- `apps/mobile/package.json`, lockfile, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`;
- `apps/mobile/src/app/_layout.tsx` and provider setup;
- ADR and Modern UI status documents.

### Gate

`typecheck`, lint, Expo web export and `test:e2e-fence` pass on the clean branch. No route visual migration starts earlier.

## 4. Phase 1 — final tokens, primitives and controllers

### Architecture

```text
Expo route
  → feature controller / hook
  → final screen
  → domain component
  → generic UI component
  → primitive / platform adapter
```

### Build

- Canonical semantic token layer; remove screen-local colours, type scales and animation values from routes.
- `AppText`, `AppIcon`, `MotionPressable`, `Separator`, `Skeleton`, `ImagePlaceholder`.
- Button family, `TextField`, tabs/chips, focus/error/disabled/loading states.
- `AppImage`, `ProductGallery`, overlay adapters, navigation adapters and form adapters.
- Feature controllers for Product/Bid/realtime, auth/email/rules, Seller Product media/form, Activity/Order projections and moderation actions.

### Boundaries

UI-kit props carry presentation data and callbacks only. It does not receive API clients, React Query keys, raw private contacts, permissions or auction pricing policy.

## 5. Phase 2 — Product and Bid flow

### Catalog

- `AuctionCard`: 4:5 image, title, current price/bid and deadline/status; full accessible label.
- Skeleton, empty/error/retry, missing/failed image and responsive grid.
- No search/filter/saved affordance unless it has an implemented backend flow.

### Product detail

- First viewport: gallery, title/seller, current bid, minimum next bid, server deadline/status and CTA.
- Mobile: safe-area sticky action; desktop: contextual sticky panel; neither duplicates or hides auction facts.
- Tabs carry only progressive item/story/provenance content.
- Scheduled, live, ended, cancelled, stale/reconnect, participation and Order states remain explicit.

### Bid controller

1. CTA starts login/register, email verification and rules only when required.
2. Client validates amount with the confirmed increment table: `0–25: 0.5`, `25–100: 1`, `100–500: 5`, `500–1,000: 10`, `1,000+: 25` BYN.
3. First buyer participation in the Listing opens confirmation. It names Product, amount, current server minimum, deadline and irreversible consequence.
4. Confirm submits with idempotency key. Retry reuses the key; changing amount creates a key.
5. Any stale/minimum/close rejection refetches the canonical HTTP snapshot and communicates the actual new price/minimum. Realtime only triggers refetch.

## 6. Phase 3 — remaining routes

### Auth and activity/order

- Auth forms retain RHF/Zod validation, safe redirect and error recovery in final visual shell.
- Activity becomes compact `ActivityRow` without private data.
- Order remains server-projected by buyer/seller/admin role; allowed contacts only appear where API permits.
- Seller Order actions retain loading/error/retry; irreversible action uses confirmation.

### Seller flows

- Seller profile respects `CHANGES_REQUESTED` editing gate and public-photo permissions.
- Seller Product stages: category, story, attributes, provenance, handoff, images, read-only preview, submit.
- Creator Product does not ask for `condition`; old value may remain display-only where returned by the API.
- Preview does not call a mutation. Existing submit-to-moderation → admin approval → Listing schedule/public lifecycle remains unchanged.
- Listing draft preserves server price/date validation and explicit schedule action.

### Navigation and admin

- Guest: Catalog, Sign in.
- Buyer: Catalog, Activity, Account sheet/logout.
- Seller: buyer items plus Seller sheet: Profile, New Product, New Listing and Account/logout.
- Admin: Catalog, Moderation, Account/logout.
- Admin confirmation is mandatory for archive/suspend/cancel; no client-side permission emulation.

## 7. Phase 4 — one cutover, then retirement

Switch all existing route files to final screens in one reviewed change. Then remove:

- Tamagui imports, providers, config/compiler and dependencies;
- `Screen`, `AppButton`, `ProductCard`, legacy header/drawer, `EmailRulesGate`, palette and old theme exports;
- Cormorant from UI/font loading;
- experimental pilot UI code and duplicate component systems.

Required proof:

```text
rg "from 'tamagui'" apps/mobile/src
```

must return no production caller.

## 8. Verification and acceptance

### Automated

- repository typecheck and lint;
- API unit and integration suites;
- mobile unit-test command for new controllers/components;
- Expo web export, iOS build/smoke, Android build/smoke;
- E2E fence and full closed-pilot Playwright suite;
- Product/Bid privacy and role-matrix tests.

### Manual founder acceptance

- iPhone Safari, Android Chrome, macOS Safari/Chrome and Windows Chrome;
- all required viewport widths;
- keyboard-only navigation, focus-visible, screen reader, focus return, contrast, 200% text and reduced motion;
- long Russian copy, missing/failed images, keyboard/safe-area behaviour;
- bid accepted/rejected/stale/soft-close/reconnect; seller upload/delete/reorder/permission errors; buyer/seller/admin/outsider privacy.

## 9. Documentation completion

After acceptance update `docs/product/11-PROJECT-STATUS.md`, `docs/design/02-USER-FLOWS-AND-SCREENS.md`, `docs/design/03-DESIGN-SYSTEM.md`, `docs/design/04-DESIGN-STATUS.md`, Modern UI current baseline and decision log. Do not mark a route Implemented before its full state and platform evidence exists.
