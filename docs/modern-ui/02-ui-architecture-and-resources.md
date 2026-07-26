# UI architecture and resources

Status: target architecture only; implementation not started.

## Layering

```text
Screen / route
  → bidplace domain component
    → generic component
      → primitive
        → third-party library
```

Correct examples: `ProductDetailScreen → BidButton → PrimaryButton → MotionPressable → Reanimated`.
Incorrect: `route → Gorhom → Reanimated → Lucide → raw styles`.

### Target layers

Primitives: `AppText`, `Surface`, `AppIcon`, `MotionPressable`, `IconButton`, `TextField`, `Separator`, `Skeleton`.

Generic: `Button`, `Dialog`, `AlertDialog`, `Tabs`, `ToggleGroup`, `Checkbox`, `Switch`, `Toast`, `AppSheet`, `AppImage`, `AppTabs`.

Domain: `AuctionCard`, `CompactAuctionRow`, `AuctionCountdown`, `BidButton`, `ProductGallery`, `FilterChip`, `BottomActionBar`, `ActivityRow`, `SettingsRow`, `SellerProductForm`, `OrderSummary`.

The target public API is the bidplace layer, not the underlying library. Domain logic, contracts, query state, and auction rules remain outside visual components.

## Resource map

| Library/resource | Role | Use | Adapt/forbid |
| --- | --- | --- | --- |
| [Expo](https://docs.expo.dev/) | App/runtime foundation | Existing Expo app and native modules | Do not add Next.js or split apps. |
| [Expo Router](https://docs.expo.dev/router/introduction/) | Route tree | Shared routes; stable [tabs](https://docs.expo.dev/router/advanced/tabs/) with custom visual tab bar | Do not fork screen trees for platforms. |
| [NativeWind](https://www.nativewind.dev/docs) | Target styling foundation | v4 utilities and centralized theme tokens | Target only; absent from current app. |
| [React Native Reusables](https://reactnativereusables.com/docs) / [CLI](https://reactnativereusables.com/docs/cli) | Copy-paste component source | Start from accessible, inspectable patterns | Adapt into bidplace API; do not expose source library across routes. |
| [RN Primitives](https://rn-primitives.vercel.app/) | Accessible behavior source | Dialog, tabs, toggle, checkbox, switch, toast patterns | Verify API/version before use; no unstable API without ADR. |
| [Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Shared motion | Presets only; [entering/exiting](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations/) where needed | No direct route imports or local arbitrary springs. |
| [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) | Complex gestures | Sheet/drag interactions | Ordinary buttons use MotionPressable, not gestures. |
| [Lucide](https://lucide.dev/icons/) / [Studio](https://studio.lucide.dev/) | Icon source | `AppIcon` and consistent outline set | No new icon pack for one icon. |
| [Gorhom Bottom Sheet](https://gorhom.dev/react-native-bottom-sheet/) | Mobile sheet behavior | Future `AppSheet` adapter | Never import in a route; not installed now. |
| [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/) | Image rendering | Future `AppImage` with caching, placeholder, transition | Keep stable aspect ratio and accessible description. |
| [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | Seller media input | Future adapter for selection and permissions | Keep permission/error states in domain flow. |
| [React Hook Form](https://react-hook-form.com/) | Form state | Seller/auth forms through `SellerProductForm` and fields | Do not duplicate server validation. |
| [Zod](https://zod.dev/) | Schema validation | Shared input parsing where contracts require it | Preserve API contract source of truth. |
| [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) | Optional native feedback | Significant auction/action confirmation only | Never call from a route or on every tap. |
| [FlashList](https://shopify.github.io/flash-list/) | Conditional list performance | Only after measured need | No speculative dependency. |

External links above are official resource links supplied for the target plan. Version applicability to the current app is **not verified** for target-only libraries; current installed versions are in [`01-current-audit.md`](./01-current-audit.md). Check exact release docs and changelogs during Phase 0.

## Decision table

| Need | First use | Fallback | Forbidden |
| --- | --- | --- | --- |
| Settings icon | `AppIcon` + Lucide `Settings` | Custom SVG via Lucide Studio, then `AppIcon` | New icon pack for one icon |
| Press animation | `MotionPressable` preset | Official Reanimated example | Local `useSharedValue` in each screen |
| Bottom sheet | `AppSheet` | Platform dialog adapter | Gorhom import in route |
| Image | `AppImage` | Existing Expo Image adapter during bridge | Raw image implementation per screen |
| Form field | `TextField` + React Hook Form | Existing `AppInput` bridge | Screen-local label/error wiring |
| Large list | `AppList` after measurement | FlatList/current list | FlashList before evidence |
| Tabs | `AppTabs` / stable Expo Router tabs | Existing route navigation bridge | Multiple tab systems for one flow |

## Short boundary examples

```tsx
// Future route usage: public bidplace API only.
<BidButton listing={listing} onConfirm={openBidSheet} />
```

```tsx
// Future adapter boundary: library details stay inside AppSheet.
export function AppSheet(props: AppSheetProps) {
  // Mobile implementation may use Gorhom; desktop may use a dialog.
  return <SheetAdapter {...props} />;
}
```

These are documentation examples, not production components.
