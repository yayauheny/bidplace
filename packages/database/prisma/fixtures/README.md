# Local demo fixture assets

These images are committed local inputs for the explicitly guarded development/test seed. They are not production content and the application never requests Figma or CDN URLs at runtime.

Source: Figma file `uMo04w9bgrchWXXDgO4W62`, plus one demo studio portrait for `pixelp`. Files are **raw image fills** or same-work detail crops, not composed overlay cards. User-facing copy is production-quality even when invented; invented/Figma-gap notes live only in this file and seed comments (`DEC-092`).

## Seller portraits

- `seller-profile/vex.png` — Opening portrait fill (`439:4412`), Илья Васильев.
- `seller-profile/quantumparadox.png` — authors catalog fill, Анастасия Винова.
- `seller-profile/havoc.png` — authors catalog fill, Константин Константинович.
- `seller-profile/bala_klava.png` — authors catalog fill, Клавдия Агаповна.
- `seller-profile/pixelp.png` — demo studio portrait for Павел Пиксель. Figma has no isolated unused male portrait (catalog four would collide). Not Unsplash and not another catalog author’s face.
- `seller-profile/pending-seller.png` — technical 1×1 for unpublished `pending-seller`. Not a public catalog avatar.

## Work covers

- `product-images/dali-estate.png` — Opening / catalog Dali cover (`pixelp`).
- `product-images/caricature.png` — «Картина по фото в стиле шарж» (`bala_klava`).
- `product-images/yellow-sapphire.png` — «Желтый сапфир» (`quantumparadox`).
- `product-images/color-calibration.png` — «Color calibration» (`havoc`).
- `product-images/rainbow-mask.png` — Home «Новые работы»: «Радуга (Mask Series 1997 no.8)» (`bala_klava`).
- `product-images/blossom-vase.png` — Home «Новые работы»: «Ваза "Блоссом"» (`bala_klava`).
- `product-images/memory.png` — Home «Новые работы»: «Память» (`bala_klava`).
- `product-images/alice-glass.png` — vex «Алиса в Зазеркалье». Figma search-grid fill; demo ownership on vex, not a confirmed Figma work card.
- `product-images/between-form.png` — vex «Между сном и формой». Figma search-grid fill; demo ownership on vex.
- `product-images/pending-placeholder.png` — technical 1×1 for the unpublished pending product. Not a public catalog asset.

Same-work `*-detail.png` crops are gallery extras from the matching cover, not another work’s photo. `between-form-detail.png` is the 3:4 crop of that fill.

## Achievements

Figma has no isolated exhibition-install photographs. Cards use same-event fills:

- vex «Алиса в Зазеркалье» → `product-images/alice-glass-detail.png` (search-grid glass fill detail, not cover).
- vex «Между сном и формой» → `product-images/between-form-detail.png` (search-grid fill detail, not cover).
- pixelp «После классики» → `seller-achievements/pixelp-after-classics.png` from Figma History node `437:3989` (Spectre / crutches Dali). Not Opening cover `dali-estate.png`.

## Work History extras

- Dali `daliEstate1` → existing `dali-estate-detail.png` between story paragraphs. Figma History frame uses a different painting (Spectre); that fill is not attached to Opening Dali. A second same-work History photo is absent.

Large Figma rasters were resized to a max long side of 1400px (portraits 800px) without upscaling smaller sources.
