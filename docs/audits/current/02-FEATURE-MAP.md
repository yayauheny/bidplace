# Current feature and dependency map

## Runtime surfaces

| Feature                    | Mobile entry                                | Client/contracts                         | API owner                | State                              |
| -------------------------- | ------------------------------------------- | ---------------------------------------- | ------------------------ | ---------------------------------- |
| Home discovery             | `app/index.tsx`, `features/home`            | portfolio home                           | `portfolio`              | Live                               |
| Works catalog/detail       | `app/(public)/works*`                       | portfolio works                          | `portfolio`, `products`  | Live                               |
| Authors catalog/detail     | `app/(public)/authors*`                     | portfolio authors                        | `portfolio`, `sellers`   | Live                               |
| Search overlay             | root `SearchOverlayHost`, `features/search` | portfolio list APIs, categories          | portfolio/categories     | Live, first loaded page only       |
| Authentication             | `app/(auth)/*`                              | auth/password-reset                      | `auth`, `password-reset` | Live                               |
| Email OTP                  | no route/screen                             | OTP client/contracts                     | `otp`                    | Backend/client only                |
| Author application/profile | `app/(seller)/profile.tsx`                  | sellers + portfolio wrappers             | `sellers`, `portfolio`   | Live, draft persistence incomplete |
| Work creation/edit         | `app/(seller)/products/*`                   | products/images                          | `products`, `images`     | Live, four-step implementation     |
| Author cabinet             | no route                                    | portfolio cabinet + products hide/unhide | `portfolio`, `products`  | Backend/client only                |
| Admin moderation/analytics | `app/(admin)/*`                             | admin                                    | `admin`, `analytics`     | Live                               |
| Commerce                   | no mobile route                             | retained schema/types vary               | no imported API module   | Runtime absent; docs conflict      |

## State ownership

| State                      | Current owner                                       | Review note                                                                |
| -------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| Catalog filters/search     | URL + React Query                                   | Good reference pattern.                                                    |
| Search overlay session     | `overlay`, `oq`, `otab` URL params + local debounce | Bounded and tested; panes expose only loaded first page.                   |
| Public author tab/category | component `useState`                                | Back/Forward and share do not restore it; category creates a second query. |
| Auth user/session          | `AuthProvider` local state                          | Duplicates server resource ownership outside React Query.                  |
| Work form                  | 15+ local states synchronized by effects            | Dirty/save semantics are implicit.                                         |
| Application form/step      | local object + `profileStep`                        | Steps 1–2 are not persisted or URL-owned.                                  |
| Images/revision status     | React Query                                         | Server remains authoritative; row locks are present.                       |

## Dependency observations

- React Query is the established server-state mechanism; use it before adding another cache.
- React Hook Form + Zod resolver are already installed and used by auth forms; work/profile forms reimplement dirty state, reset and field handling.
- Expo Router already provides pathname/search params and safe route replacement; local wizard/tab history should not need another router library.
- `@rn-primitives/dialog`, Hugeicons, Expo image/blur/linear-gradient, AsyncStorage and QRCode have live consumers.
- `@gorhom/bottom-sheet` has no source import. Existing sheets use project components.
- NativeWind is wired through Metro/Tailwind but production UI is almost entirely inline React Native styles; removal requires build/config review, not import count alone.
- Lucide remains through legacy `AppIcon`; the active Figma layer uses Hugeicons. Reachability should decide consolidation.
- Root and package TypeScript versions differ (`5.8.3`, `5.9.3`, `~6.0.3`), increasing toolchain drift risk.

## Backend dependency direction

`mobile -> api-client -> contracts` and `api -> contracts + database` remains clear. The main boundary leak is `AdminController` issuing Prisma queries. Portfolio delegates mutations to Sellers and Products, which is preferable to duplicating domain writes.
