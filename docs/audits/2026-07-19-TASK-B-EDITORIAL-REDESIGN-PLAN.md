# Task B — Editorial Redesign: Implementation Plan

Date: 2026-07-19  
Branch: `feature/editorial-redesign`  
Starting SHA: `6fcf3f3`  
Task A status: ✅ Complete — Prisma, API, contracts, routes all stable

---

## Confirmed constraints

**Not touched in Task B:**
- `packages/database/**` — Prisma schema, migrations, seed
- `apps/api/**` — NestJS modules, services, controllers
- `packages/contracts/**` — Zod schemas, shared types
- `packages/api-client/**` — typed HTTP client
- Route semantics: `/product/[publicId]`, `/me/activity`, `/order/[publicId]`
- Soft close 60/60/600, bid rules, Order workflow

---

## API capabilities confirmed (no filter/sort — not in contracts)

`api.products.list()` accepts only `PaginationQuery { page, limit }` — **no filter or sort params**.  
Conclusion: toolbar shows only result count and pagination. No filter Sheet, no sort dropdown. Dead controls not added.

---

## UI Inventory

### Tokens / Theme

| Item | Action | Reason |
|------|--------|--------|
| `colors.accent = #111111` | **restyle** | Replace with cobalt `#2457E6` |
| `lightTheme` in `design-tokens` | **restyle** | Rename to semantic names, update primary |
| `darkTheme` in `design-tokens` | **delete** | Remove from exports; light-only MVP |
| `dark*` raw colors | **delete** | Dead code after theme removal |
| `darkTheme` in `theme/tokens.ts` | **delete** | Remove from runtime |
| `darkTheme` in `tamagui.config.ts` | **delete** | Remove from Tamagui themes |
| `useColorScheme()` in theme-provider | **delete** | Replace with hardcoded `'light'` |
| `fontFamilyBrand` token | **add** | New brand token |
| `fontSizeBrand`, `fontWeightBrand`, `letterSpacingBrand`, `brandMarkSize`, `brandGap` | **add** | New brand tokens |
| `primary`, `primaryHover`, `primaryPressed`, `primaryTint`, `focus` semantic names | **add** | Rename from `accent*` |
| `positive`, `warning`, `negative` semantic names | **add** | Rename from `success`, `danger` |

### Components

| Component | Action | Reason |
|-----------|--------|--------|
| `AppButton.tsx` | **restyle** | Cobalt primary, radius 8px control, proper disabled |
| `PrimaryButton.tsx` | **delete** | Thin unused wrapper around AppButton |
| `AppInput.tsx` | **restyle** | Semantic tokens, 44px min height, visible focus |
| `ControlledAppInput.tsx` | **preserve** | Works correctly, just inherits input restyle |
| `AppCard.tsx` | **consolidate → Surface** | Generic surface primitive, no business logic |
| `EntityPanel.tsx` | **consolidate → OperationalPanel** | Operational/admin panel with border |
| `AppSheet.tsx` | **restyle** | Keep primitive, add focus trapping hint |
| `Screen.tsx` | **restyle** | Use `background` semantic token, max-width layout |
| `FormField.tsx` | **preserve** | Label + error wrapper, works correctly |
| `DetailList.tsx` | **restyle** | Semantic tokens |
| `EmptyState.tsx` | **restyle** | Geometric skeleton match, no decorative graphics |
| `ErrorState.tsx` | **restyle** | Proper retry pattern, no internal tech message |
| `LoadingState.tsx` | **restyle** | Replace with typed skeleton variant |
| `PageIntro.tsx` | **restyle** | Editorial typography |
| `Price.tsx` | **restyle** | Cobalt accent, clear BYN display |
| `SectionHeader.tsx` | **restyle** | Semantic tokens |
| `StatGrid.tsx` | **restyle** | Semantic tokens |
| `StatusBadge.tsx` | **restyle** | Semantic positive/warning/negative, not color-only |
| `BrandLogo.tsx` | **restyle** | brand-mark.png + live text `bidplace` + brand tokens |
| `AppHeader.tsx` | **restyle** | Remove hardcoded hex, EN label, sticky, semantic |
| `DesktopNavigation.tsx` | **restyle** | Semantic tokens, clean active state |
| `MobileNavigationDrawer.tsx` | **restyle** | Full-screen or 95% Sheet, large touch targets |
| `ProductCard` | **add** | New component — image-first, minimal metadata |
| `ProductListScreen` | **restyle** | Grid layout, ProductCard, loading/empty/error |
| `ProductScreen` | **restyle** | Gallery, structured detail, bid panel, statuses |
| `ActivityScreen` | **restyle** | List rows with image+status |
| `OrderScreen` | **restyle** | Role-aware buyer/seller display |
| `AuthForm` | **restyle** | Clean whitespace, imwater-style |
| `SellerProfileScreen` | **restyle** | Form sections, clean layout |
| `ProductDraftScreen` | **restyle** | Sectioned form |
| `ListingDraftScreen` | **restyle** | Sectioned form |
| `AdminModerationScreen` | **restyle** | Separated admin controls |

---

## System states required (every major screen)

- `loading` — skeleton matching real geometry
- `empty` — short text + real action
- `error` — retry + no tech message, distinguish 404/403/network
- `success` — bid accepted state
- `forbidden` — 403 guard
- `notFound` — 404 message + navigation
- `reconnecting` — restrained banner, no false success
- `stale` — subtle indicator, canonical refetch after restore
- `offline` — network unavailable indicator

---

## Logo asset

**Source**: raster PNG provided by founder (coin + arrow mark, monochrome, line-art on white)  
**Asset path**: `apps/mobile/assets/brand-mark.png`  
**Usage**: `<Image source={brandMark} />` + live text `bidplace` in `BrandLogo.tsx`  
**Variants**: black on light surface / white on dark overlay  
**Note**: founder places PNG at the above path; code references it directly

---

## Brand tokens

```ts
fontFamilyBrand: 'CormorantGaramond_500Medium'  // initial; replaceable without touching BrandLogo
fontSizeBrand: 17
fontWeightBrand: '500'
letterSpacingBrand: 0.2
brandMarkSize: 28  // mobile compact
brandMarkSizeDefault: 34  // desktop
brandGap: 8
```

---

## Color palette (approved)

```
background:      #F7F6F3
surface:         #FFFFFF
surfaceMuted:    #F1F0ED
textPrimary:     #171717
textSecondary:   #595959
textMuted:       #7A7A7A
border:          #DEDDD9
borderStrong:    #BEBDB8

primary:         #2457E6
primaryHover:    #1E49C7
primaryPressed:  #18399D
primaryTint:     #EEF3FF
focus:           #7FA1FF

positive:        #247A4A
warning:         #9A6415
negative:        #B63B3B

overlay:         rgba(23,23,23,0.40)
imageBackground: #F1F0ED
```

---

## QA matrix (after each screen group)

Widths: 320, 375, 390, 430, 768, 1024, 1280, 1440  
Checks: keyboard nav, visible focus ring, touch target ≥44px, WCAG AA contrast, zoom 200%, reduced motion, Sheet/Dialog focus trap, Escape, timer not spamming screen-reader, long names, portrait/landscape images, missing image fallback

---

## Commit sequence

```
docs: add task b redesign plan
feat(assets): note brand mark placement, prepare brand tokens
refactor(tokens): implement cobalt semantic tokens, delete dark theme
refactor(theme): lock to light-only, remove color scheme switching
refactor(ui): consolidate primitives Surface OperationalPanel ProductCard
refactor(ui): restyle feedback states loading empty error
feat(ui): redesign brand lockup and header navigation
feat(ui): redesign product grid catalog screen
feat(ui): redesign product detail gallery bid panel statuses
feat(ui): redesign auth login register screens
feat(ui): redesign activity order screens
feat(ui): redesign seller product listing forms
feat(ui): redesign admin moderation screen
test(ui): update theme light-only and component tests
docs: update design system status and handoff
docs: task b implementation report
```

---

## Definition of Done checklist

See task prompt §41 for full checklist. Blocking items:
- [ ] Frontend lint passes
- [ ] Frontend typecheck passes
- [ ] Unit tests pass
- [ ] No `packages/database/**`, `apps/api/**`, `packages/contracts/**`, `packages/api-client/**` changes
- [ ] Light-only runtime confirmed
- [ ] Brand mark + live text confirmed
- [ ] No hardcoded hex in feature components
- [ ] WCAG AA checked for primary CTA
