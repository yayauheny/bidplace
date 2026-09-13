# S7 — mobile-web filter and sort masters

## Scope

- Source: Figma nodes `874:5434`, `526:12980`, `526:13009`,
  `526:13065`, `526:13142`, and `584:17554`.
- Runtime acceptance: mobile web at `390 × 900`.
- Android, iOS, and desktop web are explicitly outside the current scope.
- Catalog wiring remains separate from S7, as required by the parallel task plan.

## Result

`Implemented` for the standalone mobile-web masters:

- `FilterSortBar` uses the shared glass surface and the Figma 42 px controls
  inside a 43 px bar.
- `FilterSheet` owns the 390 px full-height panel, header, scroll area,
  sticky action, Escape dismissal, focus trap, and focus restoration.
- `FilterSheetSectionRow`, `FilterSearchField`, `FilterOptionRow`, and
  `FilterSortSheet` cover root, search, radio, checkbox, empty, and selected
  states without route-local visual copies.
- The temporary acceptance consumer was removed after capture; production
  catalog screens are intentionally unchanged.

## Geometry and behavior

| Element | Figma | Runtime DOM | Status |
| --- | --- | --- | --- |
| Sort/filter bar | 43 px frame | 43 px minimum frame | Match |
| Sort/filter pill | 42 px height, radius 14 | 42 px height, radius 14 | Match |
| Sheet panel | 390 px, 12 px gutter | 390 px, 12 px gutter | Match |
| Root close/title | x 12 / x 42 | x 12 / x 42 | Match |
| Root section row | x 12, y 82, 366 × 52 | x 12, y 82, 366 × 52 | Match |
| Search field | x 12, y 82, 366 × 52 | x 12, y 82, 366 × 52 | Match |
| Option control | 20 × 20 | 20 × 20 | Match |
| Option row | 38 px | 38 px | Match |
| Primary action | x 12, 366 × 44 | x 12, 366 × 44 | Match |

Keyboard evidence:

- opening a sheet focuses its close/back control;
- Tab remains within the sheet;
- Enter and Space activate radio/checkbox options;
- Escape closes the sheet;
- focus returns to the trigger after dismissal;
- radio and checkbox options expose checked state to the accessibility tree.

## Captures

- `runtime/filter-bar-390.png`
- `runtime/filter-root-390.png`
- `runtime/filter-city-390.png`
- `runtime/filter-city-empty-390.png`
- `runtime/filter-materials-390.png`
- `runtime/filter-sort-390.png`

## Verification

- Focused ESLint: passed.
- Mobile TypeScript gate: S7 files report no errors; the full command is
  currently blocked by unrelated concurrent errors in cover-frost/glass-dock
  e2e files and `CreatorHeader.web.tsx`.
