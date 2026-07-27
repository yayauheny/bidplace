# Final Modern UI cutover

Status: **Approved implementation strategy — start only from `feature/modern-ui-final`**.

This supersedes the former bridge/pilot strategy. The final branch starts from the documentation baseline before the experimental Modern UI pilot. It must not merge an adapter over Tamagui, a partial target route, a feature flag, or a legacy fallback screen.

## Non-negotiable boundaries

- Keep Expo Router, API client, React Query, route ownership, server authorization and database contracts.
- Keep server-authoritative Bid, realtime refetch, email verification, rules acceptance, privacy projections, Product locks and moderation.
- Do not add Search, filters, saved items, Settings, dashboard metrics or a new public route.
- Do not delete Cormorant/Tamagui or switch a production route until the final implementation is complete and verified.

## Phase 0 — contract and clean baseline

1. Work only in `feature/modern-ui-final`; the pilot branch is historical evidence, not a source of production code.
2. Record one ADR with the selected libraries, exact compatible versions, Expo 57 proof, overlay split, icon policy, light-only policy, responsive breakpoints and acceptance owner.
3. Confirm Inter and PT Mono Cyrillic on web, iOS and Android. Use temporary Inter live wordmark on mobile and compact mark on desktop until approved logo assets exist.
4. Capture the baseline matrix at 320, 375, 390, 768, 1024, 1025 and 1440 px.

Gate: mobile typecheck, lint, Expo web export and E2E fence pass before UI code changes.

## Phase 1 — feature controllers and final foundations

1. Separate feature controllers/hooks from UI: Product snapshot/realtime/Bid state, auth/email/rules sequence, Seller Product mutations, Activity/Order role projection and admin actions.
2. Build the final UI-kit and no screen-local substitutes: tokens, text, icons, motion, fields, buttons, tabs, sheets/dialogs, images, skeletons, navigation, focus/reduced-motion behaviour.
3. Implement platform adapters only inside the UI-kit: Gorhom on native and RN Primitives on web for overlays; Lucide only through `AppIcon`.

Gate: no UI-kit component receives API clients, query keys, permissions, raw contacts or auction policy.

## Phase 2 — final Product and Bid slice

1. Implement Catalog and Product detail with image-first layout, missing/failed/loading media states, auction facts before tabs and server deadline/status.
2. Use mobile `BottomActionBar` and desktop contextual sticky auction panel.
3. Replace `EmailRulesGate` with the explicit flow: CTA → auth → email verification → rules → amount → first-Bid confirmation → submit/result.
4. Client validates numeric BYN amount and the documented increment table; server decides final price, minimum, close and soft close. A rejection refetches and explains the changed amount.
5. First Bid in a Listing confirms; later Bids in that Listing do not, unless participation cannot be established.

Gate: accepted/rejected, stale-minimum, retry/idempotency, soft close, reconnect and public-alias tests pass.

## Phase 3 — all remaining existing flows

Migrate, in order: auth routes, Activity, Order, Seller profile, Seller Product create/edit, Listing creation, role-aware navigation and admin moderation.

- Seller Product has staged fields, an explicit read-only preview mode in the existing seller route, honest upload count spinner, server errors, permission denial and delete/reorder recovery.
- Preview never changes Product status. Existing submit-to-moderation, admin approval and Listing lifecycle remain the only visibility path.
- Confirm image delete, admin archive/suspend/cancel and irreversible Order actions. Do not confirm reorder.
- Mobile uses centred floating navigation; desktop uses the same role-filtered destinations in a left rail. No invented destination appears.

Gate: every route has loading, empty, error, retry, unauthorized, long-content, focus and responsive evidence; realtime routes also have stale/reconnect evidence.

## Phase 4 — atomic route cutover and legacy removal

1. Switch every existing route to the final screen tree in one reviewed change.
2. Remove legacy screens/components, header/drawer navigation, `EmailRulesGate`, legacy palette/tokens, Cormorant UI font, Tamagui providers/config/compiler/dependencies and the experimental Modern UI pilot code.
3. Confirm `rg "from 'tamagui'" apps/mobile/src` has no production callers.

There is no runtime rollback or feature flag. Before production, failure is handled by correcting the final branch; after merge, ordinary Git revert remains the repository recovery mechanism.

## Phase 5 — acceptance and source-of-truth transition

Run the full matrix in `06-quality-checklist.md`, including web, iOS, Android, browser/device, privacy, Bid and accessibility checks. Founder performs the visual/device acceptance. Only then update factual status documents and declare Modern UI the implemented source of truth.
