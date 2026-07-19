# bidplace brand mark

The brand mark PNG (`brand-mark.png`) must be placed in this directory by the founder.

**Path**: `apps/mobile/assets/brand-mark.png`

**Source**: The monochrome line-art mark (coin + arrow) provided by the founder.

**Requirements**:
- Raster PNG, ideally 256×256 or 512×512 px
- Black mark on transparent or white background
- Used as-is; do not trace, recreate, or convert to SVG unless the founder provides an SVG source

**Usage in code**: `BrandLogo.tsx` references `../../../assets/brand-mark.png`

Until this file is placed, BrandLogo falls back to the text-only lockup with a placeholder border box.
