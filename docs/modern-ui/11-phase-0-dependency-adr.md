# Phase 0 ADR — Modern UI production dependencies

Status: **Accepted for configuration and platform proof**

Date: 2026-07-27  
Decision owner: frontend owner, under `DEC-055` / `DEC-056`

## Context

The final cutover uses Expo SDK 57, React Native 0.86.0 and React 19.2.3. The target visual stack must use stable, exact production versions: NativeWind v4, RN Primitives, Lucide and a native bottom-sheet adapter. Preview and floating version ranges are prohibited.

## Decision

Use these exact packages for the Phase 0 proof:

| Package | Exact version | Role |
| --- | --- | --- |
| `nativewind` | `4.2.1` | Stable v4 styling foundation |
| `tailwindcss` | `3.4.17` | NativeWind v4 compiler peer |
| `prettier-plugin-tailwindcss` | `0.5.11` | Class ordering in source files |
| `@rn-primitives/dialog` | `1.5.2` | Accessible dialog behavior behind bidplace adapters |
| `lucide-react-native` | `1.27.0` | Icons, only through future `AppIcon` |
| `@gorhom/bottom-sheet` | `5.2.14` | iOS/Android `AppSheet` implementation |

`react-native-svg` resolves to `15.15.5` as Lucide's required peer. It is not imported directly by routes.

## Compatibility evidence

- Expo SDK 57 specifies React Native 0.86 and React 19.2.3. The mobile manifest already pins both versions.
- NativeWind identifies v4 as safe while v5 remains preview; `4.2.1` is the last stable v4 release and peers with Tailwind `>3.3.0`.
- Gorhom `5.2.14` requires Gesture Handler `>=2.16.1` and Reanimated `>=3.16.0 || >=4.0.0-`; the app resolves 2.32.0 and 4.5.0.
- Lucide `1.27.0` declares React 19 and `react-native-svg` 15 as supported peers.
- RN Primitives Dialog `1.5.2` provides unstyled cross-platform accessible dialog behavior and resolves against the app's React Native and React Native Web versions.

## Boundaries

- These packages do not authorize a route migration or vendor imports from a route.
- `AppIcon`, `AppDialog` and `AppSheet` remain the only public application APIs.
- The remaining gate is a clean typecheck, lint, Expo web export and native device smoke after configuration. No route is marked migrated before all pass.

## Sources

- [Expo SDK reference](https://docs.expo.dev/versions/latest/)
- [NativeWind package](https://www.npmjs.com/package/nativewind)
- [Gorhom Bottom Sheet package](https://www.npmjs.com/package/@gorhom/bottom-sheet)
- [RN Primitives](https://rn-primitives.vercel.app/)
- [Lucide React Native package](https://www.npmjs.com/package/lucide-react-native)
