# Discovery launch acceptance

Date: 2026-09-13
Scope: mobile web, 390×844, reduced motion

## Result

- `Implemented`: Works supports URL-owned query/category/material filters,
  newest/oldest sorting, reset and server pagination without duplicate cards.
- `Implemented`: Authors supports URL-owned query/direction/city filters,
  activity/name sorting and server pagination.
- `Implemented`: Search renders independent Work and Author loading, result,
  empty, retry and pagination states. The excluded Figma search overlay was not
  added.
- Facet options come from `GET /api/portfolio/facets`; the endpoint exposes
  only normalized values from public authors and published Work revisions.
- The accepted Work card remains title + author. RFC §6 “brief facts” remains a
  documented product/design ambiguity; no unsupported card fields were invented.

## Evidence

- `works-390.png`
- `authors-390.png`
- `search-390.png`
- `apps/mobile/e2e/discovery-launch.spec.ts`: 3/3 passed against the preview
  database without resetting it. Coverage includes Apply/Reset, URL persistence
  through navigation Back, combined filters, sort, pagination deduplication,
  search result/empty/retry, reduced motion and horizontal overflow.

## Technical gates

- `pnpm verify`: passed — typecheck 7/7, lint 2/2, API unit 297, contracts 25,
  API client 3, API integration 79, build 7/7.
- `pnpm --filter @bidplace/mobile test`: 239/239 passed.
- `.pen` diff: empty.
