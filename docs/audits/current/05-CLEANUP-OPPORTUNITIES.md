# Cleanup opportunities

These are bounded candidates, not deletion instructions. Verify build/typecheck and dynamic consumers before removal.

| Priority | Candidate                          | Evidence                                                                           | Direction                                                                                          |
| -------- | ---------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| P2       | Component generations              | `components/ui` and `components/figma`                                             | Consolidate by semantic role, not by directory rename.                                             |
| P3       | Icon families                      | Hugeicons is active; Lucide survives via `AppIcon`                                 | Consolidate only after legacy UI reachability cleanup.                                             |
| P3       | TypeScript version drift           | root/API/mobile manifests                                                          | Align only after checking Expo/Nest tooling constraints.                                           |

## Capabilities that should use what is already installed

- Form dirty state, reset, submit lifecycle and field errors: React Hook Form + current Zod contracts/resolvers.
- Server state and session invalidation: React Query query/mutation caches.
- Wizard/tab/filter history: Expo Router search params.
- Dialog focus/semantics: existing `@rn-primitives/dialog` wrapper.
- Icons: current Hugeicons master after legacy tree removal.
- Image rendering/recovery: existing `expo-image` + `ResilientRemoteImage` path.

No new third-party library is justified by this baseline.
