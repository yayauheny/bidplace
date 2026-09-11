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

## Pending sequence

1. Cover frost: existing uncommitted single masked 30/20px blur is an
   approximation. Opacity cross-fade is not a variable blur radius. Do not mark
   pixel-match or progressive rendering implemented on that basis.
2. C3: review existing geometry/hover changes, remove the temporary
   AuthorIdentity catalog preview after verification, commit as its own package.
3. C4: filter stacking/click behavior, independent of blur.
4. C5: compose the hero against the local captures, then compare the atmosphere
   in that final geometry. Keep the single shared atmosphere master.

Figma API returned access denied for the supplied file. Local immutable captures
remain available. No Pen edits, database reset, or backend changes in this work.
