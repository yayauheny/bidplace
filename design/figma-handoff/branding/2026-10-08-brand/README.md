# Current bidplace brand sources — 2026-10-08

Founder requested replacement of the old eye mark throughout the project.
This is a source handoff, not a completed runtime replacement.

- `source-logo-icon.svg`: byte-identical supplied SVG, 256×256, white background,
  brush mark #111111. Do not silently edit the original.
- `bidplace-mark.svg`: exact transparent fillGeometry from node `4562:31593`,
  30.35×30.35, #121212; identical geometry in all four new captures.
- `bidplace-wordmark.svg`: exact outlined lettering from node `4562:31592`,
  93×22, #121212; identical geometry in all four new captures. No font dependency.

The existing runtime wordmark has viewBox 961×239 and is not an exact substitute
for this 93×22 source. Do not type `bidplace` in an approximate font.
Use [PROVENANCE.json](PROVENANCE.json) and [CHECKSUMS.sha256](CHECKSUMS.sha256).

Auth mark slot is 46.29×48 at x172/y60 in a 390×874 frame. The visible vector
is 30.35×30.35 at roughly x179.87/y67.07 in the reference. Figma GROUP child
coordinates must be interpreted against the reference, not blindly summed twice.
Wordmark is x149/y793, 93×22; its bottom inset is 59. Auth captures use #121212;
the supplied raw SVG has #111111. That difference is recorded, not averaged.

Runtime derivatives (favicon/Expo icons/splash) are future work. Generate only
the assets consumed by the existing build/config, preserve geometry, keep the
favicon readable at 16/32 px, and keep opaque platform icon backgrounds separate
from transparent web/UI assets. Do not add services, icon packs or dependencies.
