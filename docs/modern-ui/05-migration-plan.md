# Migration plan

Status: **planning only — no migration performed**. This plan does not authorize dependency, config, route, or source changes.

## Phases

### Phase 0 — baseline and gates

- Pin and record the current versions without changing them.
- Create a migration branch and record the owner/ADR process.
- Define web, Android, iOS, narrow, wide, keyboard, screen-reader, and reduced-motion screenshot matrix.
- Define acceptance criteria for tokens, component states, accessibility, performance, and rollback.
- Verify official docs and exact production versions for every target dependency.

### Phase 1 — foundation and bridge

Target work: NativeWind v4, target tokens, fonts, `AppText`, `AppIcon`, `MotionPressable`, Button family, `AppImage`, and `AppSheet`. Keep old Tamagui screens working while adapters are introduced. No screen should import a new third-party library directly.

### Phase 2 — pilot screens

Migrate only Home, Product detail, and Seller product form. Together they test responsive layout, cards, images, tabs, forms, overlays, motion, navigation, accessibility, and auction-critical data. Compare against the screenshot matrix and existing product contract.

### Phase 3 — buyer flows

Activity, order, auth/OTP, search/filter, and navigation. Verify privacy projections, server snapshot/reconnect behavior, and rejected/accepted bid states.

### Phase 4 — seller flows

Seller profile, product create/edit, image reorder/upload, and auction creation. Verify permissions, staged forms, validation, keyboard, safe area, and upload errors.

### Phase 5 — admin

Moderation and order actions using the same foundation. Verify confirmation, audit-safe copy, role-gated controls, and narrow-screen usability.

### Phase 6 — source-of-truth transition

After explicit owner approval, cross-link or archive old design docs without deleting them, update status documents, and declare `00-project-decisions.md` the target source of truth. This is a decision gate, not an automatic consequence of code landing.

### Phase 7 — Tamagui removal

Only after all routes are migrated and verified: remove Tamagui imports/providers/config/compiler integration and dependencies; validate bundle, typecheck, web, Android, and iOS. Do not begin this phase while any bridge dependency remains.

## Temporary bridge rules

- Existing Tamagui remains the current system; Modern UI components may coexist only behind explicit adapters.
- A route may use an old component while its target replacement is documented as Partial.
- Do not mix Tamagui and NativeWind styling inside a new target component except at the adapter boundary.
- Keep data contracts and business logic unchanged during visual migration.
- Mark target components as Planned/Partial until the full state matrix passes.

## Rollback and stop conditions

Rollback to the last verified migration commit when a pilot screen breaks routing, public/private data exposure, bid correctness, form submission, accessibility, or platform build. Keep the old screen available until the replacement passes acceptance.

Stop the phase if any of these occur: target dependency lacks stable official docs; exact version is unavailable; web/native behavior diverges without an adapter; visual changes hide auction-critical data; accessibility regresses; bundle/build or typecheck fails; performance degradation is measured; or a product-flow change is needed without an owner decision.

## Main risks

Tamagui provider/config coupling, absent target libraries, exact-version compatibility with Expo SDK 57, missing PT Mono and brand assets, differing web/native overlay behavior, incomplete visual regression coverage, and the need to preserve auction privacy and server-authoritative state.
