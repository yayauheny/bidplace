# Cleanup opportunities

These are bounded candidates, not deletion instructions. Verify build/typecheck and dynamic consumers before removal.

| Priority | Candidate                          | Evidence                                                                           | Direction                                                                                          |
| -------- | ---------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| P2       | Legacy header tree                 | `AppHeader` and dependent layout components                                        | Remove after extracting any live safe-redirect/accessibility helpers.                              |
| P2       | Component generations              | `components/ui` and `components/figma`                                             | Consolidate by semantic role, not by directory rename.                                             |
| P3       | Dead UI primitives                 | `AmbientImageBackground`, `EditorialSection`, `ProductGallery`, `Skeleton`         | Remove barrel exports and files if production reachability remains zero.                           |
| P3       | Test-only adapter                  | `portfolio-work-adapter.ts`                                                        | Delete adapter and its mirror test if no product consumer is intended.                             |
| P3       | Unused bottom-sheet dependency     | `apps/mobile/package.json`                                                         | Confirm lock/config/runtime absence, then remove package.                                          |
| P3       | Icon families                      | Hugeicons is active; Lucide survives via `AppIcon`                                 | Consolidate only after legacy UI reachability cleanup.                                             |
| P3       | NativeWind stack                   | Metro/Tailwind config is live; app styles are mostly inline                        | Treat as a separate build/config review; do not remove from import count alone.                    |
| P3       | TypeScript version drift           | root/API/mobile manifests                                                          | Align only after checking Expo/Nest tooling constraints.                                           |

## Capabilities that should use what is already installed

- Form dirty state, reset, submit lifecycle and field errors: React Hook Form + current Zod contracts/resolvers.
- Server state and session invalidation: React Query query/mutation caches.
- Wizard/tab/filter history: Expo Router search params.
- Dialog focus/semantics: existing `@rn-primitives/dialog` wrapper.
- Icons: current Hugeicons master after legacy tree removal.
- Image rendering/recovery: existing `expo-image` + `ResilientRemoteImage` path.

No new third-party library is justified by this baseline.
