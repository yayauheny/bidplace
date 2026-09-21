# Cleanup opportunities

These are bounded candidates, not deletion instructions. Verify build/typecheck and dynamic consumers before removal.

| Priority | Candidate                          | Evidence                                                                           | Direction                                                                                          |
| -------- | ---------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| P1       | Work/profile form state            | `product-draft-screen.tsx`, `seller-profile-screen.tsx`; RHF/Zod already installed | Replace manual dirty/reset/validation state with existing form stack as part of persistence fixes. |
| P1       | Auth state duplication             | `providers/auth-provider.tsx`, `lib/query-client.ts`                               | Move `/me` ownership into React Query and centralize unauthorized recovery.                        |
| P2       | Categories key duplication         | four live category consumers                                                       | Export one key/factory and invalidate it once.                                                     |
| P2       | Author double query                | `PublicSellerScreen`, `useAuthorWorks`                                             | One infinite query keyed by category/sort.                                                         |
| P2       | Cabinet N+1                        | `PortfolioService.listCabinetWorks`                                                | One server projection with moderation reason and pagination decision.                              |
| P2       | Duplicate application submit route | portfolio and sellers controllers                                                  | One canonical endpoint after consumer inventory.                                                   |
| P2       | Legacy header tree                 | `AppHeader` and dependent layout components                                        | Remove after extracting any live safe-redirect/accessibility helpers.                              |
| P2       | Component generations              | `components/ui` and `components/figma`                                             | Consolidate by semantic role, not by directory rename.                                             |
| P3       | Dead UI primitives                 | `AmbientImageBackground`, `EditorialSection`, `ProductGallery`, `Skeleton`         | Remove barrel exports and files if production reachability remains zero.                           |
| P3       | Test-only adapter                  | `portfolio-work-adapter.ts`                                                        | Delete adapter and its mirror test if no product consumer is intended.                             |
| P3       | Unused bottom-sheet dependency     | `apps/mobile/package.json`                                                         | Confirm lock/config/runtime absence, then remove package.                                          |
| P3       | Icon families                      | Hugeicons is active; Lucide survives via `AppIcon`                                 | Consolidate only after legacy UI reachability cleanup.                                             |
| P3       | NativeWind stack                   | Metro/Tailwind config is live; app styles are mostly inline                        | Treat as a separate build/config review; do not remove from import count alone.                    |
| P3       | TypeScript version drift           | root/API/mobile manifests                                                          | Align only after checking Expo/Nest tooling constraints.                                           |
| P3       | `parseBody` for query              | portfolio controller                                                               | Use existing `parseQuery`; no new validation abstraction needed.                                   |

## Capabilities that should use what is already installed

- Form dirty state, reset, submit lifecycle and field errors: React Hook Form + current Zod contracts/resolvers.
- Server state and session invalidation: React Query query/mutation caches.
- Wizard/tab/filter history: Expo Router search params.
- Dialog focus/semantics: existing `@rn-primitives/dialog` wrapper.
- Icons: current Hugeicons master after legacy tree removal.
- Image rendering/recovery: existing `expo-image` + `ResilientRemoteImage` path.

No new third-party library is justified by this baseline.
