# Quality checklist

Status: target acceptance checklist; no item is evidence of implementation.

## Before creating a component

- [ ] Read `00-project-decisions.md`.
- [ ] Check `04-component-catalog.md` for an existing role.
- [ ] Check React Native Reusables and RN Primitives.
- [ ] Check the official Expo/React Native solution.
- [ ] Check Lucide for an existing icon.
- [ ] Check centralized Reanimated presets.
- [ ] Check the relevant local reference README.
- [ ] Confirm the need is not solved by an existing bidplace adapter.
- [ ] Define public/private data, loading, empty, error, offline, and accessibility behavior.

## Before merge

- [ ] Web smoke test.
- [ ] Android smoke test.
- [ ] iOS smoke test.
- [ ] Narrow and wide viewport checks.
- [ ] Keyboard order and input behavior.
- [ ] Visible focus/focus-visible state.
- [ ] Screen-reader label and status announcement.
- [ ] Reduced-motion behavior.
- [ ] Loading, empty, error, disabled, and offline states.
- [ ] Long Russian content and missing images.
- [ ] Safe-area and sticky action behavior.
- [ ] No raw HEX or route-local animation values.
- [ ] No direct Reanimated, Gorhom, Haptics, or icon-pack import in a route.
- [ ] Light-only theme is intentional; no legacy dark-mode behaviour remains visible.
- [ ] Mobile dock is centred in the safe-area reach zone and desktop rail exposes the same role-filtered destinations.
- [ ] Temporary Inter wordmark appears only on mobile; desktop uses compact mark only.

## AuctionCard matrix

- [ ] Long title.
- [ ] No author.
- [ ] Optional author.
- [ ] Live, scheduled, ending soon, ended, and cancelled states.
- [ ] Loading, missing, and failed image.
- [ ] Hover, focus, pressed, disabled, and reduced-motion.
- [ ] Current price, bid count, deadline/status remain understandable.
- [ ] Screen-reader label describes item and auction state.
- [ ] Card does not contain a bid action unless the catalog explicitly adds one.

## Dependency update

- [ ] Exact production version recorded; no `^` or `~` for target UI dependencies.
- [ ] Official changelog and migration guide checked.
- [ ] Version compatibility with Expo/RN recorded.
- [ ] Migration branch and ADR link exist.
- [ ] Final cutover screenshots captured; the experimental pilot is not used as implementation input.
- [ ] Web/Android/iOS smoke test passes.
- [ ] Rollback commit identified.
- [ ] No preview, alpha, beta, or unstable API without explicit ADR.

## Bid and auction truth

- [ ] Client rejects empty, non-numeric and increment-invalid BYN input using the MVP increment table.
- [ ] Server rejection after an otherwise valid client check refetches Product and explains the changed price/minimum.
- [ ] First Bid per buyer/Listing shows Product, entered amount, server minimum, deadline and irreversible consequence before the API call.
- [ ] Later Bid in an established Listing participation does not repeat confirmation; unknown participation fails safe with confirmation.
- [ ] Duplicate submit is impossible while request is pending; retry reuses the idempotency key, changed amount gets a new key.
- [ ] Soft-close extension is stated in text with the new server deadline.
- [ ] Reconnect/offline state never appears as accepted Bid.

## Seller and destructive actions

- [ ] Preview is read-only and does not call a status mutation or create a public route.
- [ ] Product visibility remains Product approval plus Listing lifecycle; creator cannot self-publish.
- [ ] Upload uses a truthful spinner and image count, picker denial and recoverable upload error.
- [ ] Image delete, admin archive/suspend/cancel and irreversible Order actions use a confirmation dialog; reorder does not.

## Documentation completion

- [ ] CURRENT and TARGET are separate.
- [ ] New component is in the catalog.
- [ ] New motion is in project decisions.
- [ ] New library is behind a bidplace adapter.
- [ ] Product contract and privacy boundaries remain unchanged.
- [ ] Status is not marked Implemented before required verification.
