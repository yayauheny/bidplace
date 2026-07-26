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
- [ ] Pilot screenshots captured.
- [ ] Web/Android/iOS smoke test passes.
- [ ] Rollback commit identified.
- [ ] No preview, alpha, beta, or unstable API without explicit ADR.

## Documentation completion

- [ ] CURRENT and TARGET are separate.
- [ ] New component is in the catalog.
- [ ] New motion is in project decisions.
- [ ] New library is behind a bidplace adapter.
- [ ] Product contract and privacy boundaries remain unchanged.
- [ ] Status is not marked Implemented before required verification.
