# CURRENT STATE audit

Audit date: 2026-07-27. This document records the repository snapshot; it does not approve a migration.

## Repository and package baseline

- Package manager: pnpm 11.7.0 from root `package.json`; lockfile: `pnpm-lock.yaml`.
- Monorepo: Turborepo workspace with `apps/api`, `apps/mobile`, and packages including `api-client`, `contracts`, `database`, `config`, and `design-tokens`.
- Frontend: `apps/mobile`, one Expo entrypoint with React Native Web export; no Next.js app was found.
- Exact runtime versions in `apps/mobile/package.json`: Expo `~57.0.4`, Expo Router `~57.0.4`, React `19.2.3`, React Native `0.86.0`, React Native Web `0.21.2`, Reanimated `4.5.0`, Gesture Handler `~2.32.0`, Tamagui `2.4.5`, Expo Image `~57.0.1`, Expo Image Picker `^57.0.2`, React Hook Form `7.81.0`, Zod `^3.24.2`.
- Current target-adjacent libraries absent from the mobile manifest: NativeWind, React Native Reusables, RN Primitives, Lucide React Native, Gorhom Bottom Sheet, Expo Haptics, and FlashList. No icon package was found.

## Structure and routes

`apps/mobile/src/app/_layout.tsx` loads fonts, providers, status bar, and the root Stack. Routes are:

| Area | Current route files |
| --- | --- |
| Public | `src/app/index.tsx`, `src/app/(public)/product/[publicId].tsx` |
| Auth | `src/app/(auth)/login.tsx`, `src/app/(auth)/register.tsx` |
| Buyer | `src/app/me/activity.tsx`, `src/app/order/[publicId].tsx` |
| Seller | `src/app/(seller)/profile.tsx`, `products/new.tsx`, `products/[id].tsx`, `listings/new.tsx` |
| Admin | `src/app/(admin)/admin.tsx` |

Feature logic lives in `src/features/{products,activity,orders,sellers,admin,auth}`. Layout/navigation lives in `src/components/layout`; UI wrappers live in `src/components/ui`.

## Tamagui integration

`apps/mobile/tamagui.config.ts` imports `defaultConfig` from `@tamagui/config/v5`, creates body and heading fonts, defines media queries mobile/tablet/desktop/wide, and creates a light theme. `src/providers/theme-provider.tsx` provides `TamaguiProvider`; `src/providers/app-providers.tsx` also provides Gesture Handler root, safe area, API, query, and auth providers. `babel.config.js` includes `react-native-reanimated/plugin`; `metro.config.js` uses Expo Metro defaults. These files are protected by the task constraints.

Current primitives include Tamagui `Text`, `Button`, `Input`-adjacent wrappers, `XStack`, `YStack`, `Sheet`, and `useMedia`. Direct Tamagui imports remain in feature screens and layout components.

## Tokens, fonts, and styles

Current tokens are exported from `packages/design-tokens/src/index.ts` and re-exported/adapted by `apps/mobile/src/theme/tokens.ts` and `palette.ts`. Current canvas is `#F7F6F3`, primary is cobalt `#2457E6`, text is `#171717`, and status colors are green/yellow/red. Current spacing includes 2–96 px values; current radius values are 4/8/12/16/999; `touch` is 44.

Current fonts are Inter 400/500/600 and Cormorant Garamond 500/600, loaded in `src/app/_layout.tsx`. There is no PT Mono asset. Current breakpoints are mobile ≤640, tablet ≤1024, desktop ≥1025, wide ≥1440.

Repeated local styling remains in feature screens: screen-local font sizes, colors, gaps, status colors, and direct `style` objects. `ProductCard`, `AppButton`, `AppInput`, `Surface/AppCard`, `AppSheet`, `StatusBadge`, and loading/error/empty primitives are the main shared set. `PrimaryButton` is an alias to `AppButton`, showing an existing naming bridge.

## Media, navigation, platform files, and accessibility

Expo Image is used in `BrandLogo`, `ProductCard`, product detail, and seller profile; Expo Image Picker is used in seller profile. No `.web.tsx` or `.native.tsx` source files were found in `apps/mobile/src`; differences use `Platform.select` or runtime checks, notably sticky web header and clipboard behavior.

`AppHeader`, `DesktopNavigation`, and `MobileNavigationDrawer` provide responsive navigation. The current mobile pattern is a Tamagui Sheet drawer, not a visual tab bar.

Accessibility evidence includes `accessibilityRole`, `aria-label`, `accessibilityLiveRegion`, `accessibilityElementsHidden`, form `htmlFor`/description/error IDs, and 44 px targets in several controls. The audit found no dedicated screen-reader, keyboard, focus-visible, or reduced-motion test matrix. `aria-label` usage is present but not systematically verified across every state.

## Testing and verification

Current test tools are Vitest (`apps/mobile/vitest.config.ts`), Playwright (`apps/mobile/playwright.config.ts` and `e2e/closed-pilot.spec.ts`), TypeScript, ESLint, Expo export, and API/integration tests. Playwright takes screenshots only on failure; no Storybook, component preview, or visual regression suite was found. Existing project design status says device/accessibility QA remains for key screens.

## CURRENT → TARGET map

| CURRENT | TARGET MODERN UI | Complexity | Notes |
| --- | --- | --- | --- |
| Tamagui 2.4.5 providers/config/primitives | NativeWind v4 + bidplace UI-kit + RN Primitives | High | Requires a bridge and provider/config migration; not started. |
| `@bidplace/design-tokens` cobalt/light tokens | Target warm editorial semantic tokens | Medium | Target values are approved here, but are not runtime values. |
| Inter + Cormorant Garamond | Inter + one mono family, preferably PT Mono | Medium | Cyrillic/font asset verification is required. |
| Direct Tamagui in screens | Screen → bidplace domain → generic → primitive → library | High | Most screen files need boundary work. |
| Expo Image direct usage | `AppImage` adapter over Expo Image | Low/medium | Preserve caching, placeholder, aspect ratio, and alt behavior. |
| Tamagui `Sheet` in `AppSheet` | `AppSheet` adapter over Gorhom on mobile and dialog/popover desktop | Medium | Gorhom is not installed; do not add it during audit. |
| No icon library | `AppIcon` over Lucide React Native | Low | Need icon and accessibility inventory. |
| Local press opacity and no shared motion layer | MotionPressable + centralized presets | Medium | Existing Reanimated is installed but direct usage in screens was not found. |
| Responsive header/drawer | Stable Router tabs + custom visual tab bar and desktop sidebar | Medium/high | Preserve one route tree. |
| Playwright functional smoke, screenshots on failure | Three-platform smoke + visual/accessibility matrix | High | Requires future tooling/owner acceptance. |

## Risks and dependencies that cannot be removed immediately

1. Tamagui owns current provider and primitives; removal before the bridge is complete would break every route.
2. The target asks for exact versions, while current Expo-managed packages intentionally use `~`/`^`; version pinning is future migration work.
3. NativeWind, Reusables, RN Primitives, Lucide, Gorhom, Haptics, and FlashList are not current dependencies.
4. `@bidplace/design-tokens` is a shared package and contains the current visual contract; it cannot be silently replaced by route-local target values.
5. The existing design docs mark visual status Partial and device/accessibility QA pending; Modern UI cannot mark those screens implemented.
6. The available brand asset is `apps/mobile/assets/brand-mark.png`; a separate approved wordmark/bp-mark and PT Mono asset are not present.
7. Existing dirty-tree files outside this package predate this task; they are not evidence of Modern UI implementation and must remain untouched.
