# Discovery launch acceptance

Date: 2026-09-13  
Re-checked on `fix/figma-stabilization` against disposable `bidplace_e2e`
(18 works, 10 authors). Expo `http://localhost:8093`, API `:3003`.

## Result

- `Implemented`: Works supports URL-owned query/category/material filters,
  newest/oldest sorting, reset and server pagination without duplicate cards.
- `Implemented`: Authors supports URL-owned query/direction/city filters
  and name / date-added sorting (`added` → `latest_product_at`, label
  «По дате добавления»). Server pagination code is unchanged; this pass
  did not click «Показать ещё» because the reused DB has 10 authors.
- `Implemented`: Search renders independent Work and Author loading, result,
  empty and retry. Pagination controls were clicked only when visible.
  The excluded Figma search overlay was not added.
- Facet options come from `GET /api/portfolio/facets`; the endpoint exposes
  only normalized values from public authors and published Work revisions.

## What the tests actually cover

| Spec | Covered | Not covered |
|---|---|---|
| `e2e/discovery-launch.spec.ts` | Works filters + URL + Back + Reset; Authors filters + name sort + URL; Search result / empty / mocked works 500 retry; always `reducedMotion: reduce`; Chromium and WebKit in this pass | Hardcoded 12→15 remainder; Authors pagination; Search “Показать ещё”; normal motion |
| `e2e/figma-stabilization.spec.ts` | Works newest/oldest + URL + Back + “Показать ещё” without assuming a remainder of 3; Authors «По дате добавления» visible, «По активности» absent, name sort + URL + Back; Search result / empty / partial works error; Chromium + WebKit, 390 | Authors “Показать ещё” (10 authors < page size); Search “Показать ещё” only clicked when the button exists |

`discovery-launch` Works pagination asserted 12 then 15. On this database
the first page is 12 and the next page is 17 or 19 remaining items, so that
hardcoded remainder failed. Pagination itself is not a product regression:
the stabilization spec saw extra unique `/product/` links after
«Показать ещё».

## Evidence

- `works-390.png`, `authors-390.png`, `search-390.png` (historical 390
  captures from `70c5fd5`)
- This pass: `artifacts/figma-qa/stabilization/{chromium,webkit}-works-sort-390.png`,
  `*-authors-sort-390.png`, `*-search-partial-390.png`

## Technical gates (this worktree)

- `pnpm verify`: passed — typecheck 7/7, lint 2/2, API unit 282, contracts
  25, client 3, integration 78, build 7/7 (includes Expo export).
- `pnpm --filter @bidplace/mobile test`: 248/248.
- Playwright matrix: see `artifacts/figma-qa/stabilization/REPORT.md`.
- `.pen` diff: empty.
