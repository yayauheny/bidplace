# Next bounded reviews

Run these as independent read-only reviews first. Each scope is small enough for a separate task and produces a fix-ready decision pack.

## 1. Author MVP completion loop — RESOLVED; follow-up review only

**Scope:** mobile cabinet route/navigation, cabinet contract/projection, hide/unhide, moderation reason, create/edit return paths.

Files:

- `apps/mobile/src/app/(seller)/**`
- `apps/mobile/src/features/sellers/**`
- `packages/api-client/src/portfolio.ts`
- `apps/api/src/portfolio/portfolio.service.ts`

Acceptance: route/state matrix from application approval through create, close, reopen, submit, changes requested, publish, hide and unhide; no implementation.

## 2. Work editor persistence and product-scope alignment — PARTIAL follow-up

**Scope:** dirty hydration, save-before-submit, close-save, four-step creation story, packaging/delivery, validation ownership.

Files:

- `product-draft-screen.tsx` and its step components
- product/image contracts and services
- current RFC sections 9–10

Acceptance: one canonical state owner, exact fields kept/removed from UI/API, migration-data boundary, test matrix.

## 3. Auth, OTP and legal contract — P1

**Scope:** `/me` cache ownership, global 401 handling, safe deep-link return, OTP gate for author writes, rules acceptance response.

Files:

- mobile auth provider/query client/protected route
- API auth/OTP/seller capability
- auth/rules contracts and api-client

Acceptance: explicit server invariants and redirect/error matrix; distinguish founder/legal decisions from code defects.

## 4. Application draft persistence — RESOLVED; regression review only

**Scope:** local step loss, server DRAFT semantics, URL step, photo handling, create versus submit endpoints.

Acceptance: reload/Back/close behavior and minimum API change; preserve revision concurrency fixes.

## 5. Release gate and isolated E2E — external evidence required

**Scope:** root `verify`, CI workflow, mobile Vitest, e2e fence, Playwright subsets, disposable DB cleanup.

Acceptance: fast PR gate versus release gate, exact commands, isolation proof, no shared database.

## 6. Runtime/documentation reconciliation — P1

**Scope:** AppModule/routes, retained Prisma commerce data, RFC DEC-084 wording, architecture and current status claims.

Acceptance: current executable surface and retained-data policy documented without making a new product decision.

## 7. Frontend subtraction and dependency cleanup — P2

**Scope:** dead header tree, generic dead primitives, test-only adapter, bottom-sheet, Lucide/Hugeicons, NativeWind configuration.

Acceptance: importer graph, build/config consumers, deletion order and verification commands. No visual redesign.

## 8. Query/cache normalization — P2

**Scope:** category keys, public-author query, cabinet projection/pagination, search overlay first-page behavior.

Acceptance: key factory map, URL ownership decision, request-count before/after target, no new cache library.

## 9. Backend boundary cleanup — P2

**Scope:** admin Prisma logic in controller, duplicate submit route, query parser, malformed UUID response probes.

Acceptance: concrete HTTP behavior and smallest service/controller moves; no repository abstraction.

## 10. Visual/accessibility acceptance — P2

**Scope:** current canonical Pen versus production at 390 first, then shared 1024/1440 correctness only where still required; keyboard, focus, zoom, reduced motion, loading/empty/error states.

Acceptance: matched evidence per live screen and shared primitive; do not edit `design/pen/bidplace-web-v2.pen`.

## Recommended order

1. Reviews 1–3 in parallel.
2. Review 4 after the author contract decision from review 3.
3. Reviews 5–6 before release claims.
4. Reviews 7–9 after functional boundaries settle.
5. Review 10 after shared-component cleanup, before founder acceptance.
