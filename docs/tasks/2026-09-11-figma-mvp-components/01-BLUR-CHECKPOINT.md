# Blur and card continuation

Branch: `fix/creator-atmosphere-scroll`, based on `4bf789f` plus the existing
uncommitted CORS, C3 and single-ramp changes.

## Author atmosphere — corrected scroll ownership

- Removed temporary debug ingest from Home, FilterMenu and the API wrapper.
  These were uncommitted insertions; cleanup returns them to their tracked behavior.
- `public-seller-screen.tsx` now puts `AuthorAtmosphere` inside its ScrollView.
  Removed viewport `overflow: visible`, which prevented web scrolling.
- Preserved Figma `526:13352` / `621:19476`: 485×485, x=-47, y=-36,
  opacity .5, 40px runtime layer blur, white wash .4, bottom radii 200.
  Capture render bounds extend to y=529. Increasing the photo's height would
  distort the source crop and is not a valid substitute for C5 hero composition.
- Live local author at 390×844: 320px wheel scroll moves the atmosphere by
  320px. The photo background extends under the first work and fades into canvas.
- C5 remains open: current hero lacks the captured logo/top spacing and social
  group composition. This checkpoint does not claim full profile parity.

## Reviewed follow-up packages

- C3 geometry saved separately: 366×488 at 390 viewport, radii 24/28,
  single-row tags and photo-only hover; temporary identity preview removed.
- Single masked frost saved separately as the smooth approximation. Figma
  equality remains open; no stronger claim follows from passing DOM checks.
- FilterMenu uses the existing OverlayPortal above cards. Its portal panel is
  included in outside-click detection. Browser check covers selection, URL,
  Escape/focus return and outside dismissal.
- Checks: mobile typecheck/lint, 11 focused unit tests, 3 focused browser tests,
  Expo web export. Database and existing CORS modifications were not changed.

## Pending sequence

1. Cover frost: existing uncommitted single masked 30/20px blur is an
   approximation. Opacity cross-fade is not a variable blur radius. Do not mark
   pixel-match or progressive rendering implemented on that basis.
2. C3: final matched reference imagery/typography comparison, especially Geist
   versus the currently approved Inter runtime. Geometry is verified separately.
3. C4: complete filter design composition if required; stacking/click defect fixed.
4. C5: compose the hero against the local captures, then compare the atmosphere
   in that final geometry. Keep the single shared atmosphere master.

Figma API returned access denied for the supplied file. Local immutable captures
remain available. No Pen edits, database reset, or backend changes in this work.
