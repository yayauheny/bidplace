# Local demo fixture assets

These images are committed local inputs for the explicitly guarded development/test seed. They are not production content and the application never requests Figma or CDN URLs at runtime.

Source: Figma file `uMo04w9bgrchWXXDgO4W62`. Files are **raw image fills**, not composed overlay cards.

## Seller portraits

- `seller-profile/vex.png` — Opening portrait fill (`439:4412`), Илья Васильев.
- `seller-profile/quantumparadox.png` — authors catalog fill, Анастасия Винова.
- `seller-profile/havoc.png` — authors catalog fill, Константин Константинович.
- `seller-profile/bala_klava.png` — authors catalog fill, Клавдия Агаповна.
- `seller-profile/pixelp-placeholder.png` — **gap**. Figma has no isolated `pixelp` portrait. The Dali work-card chip is a circular crop of the painting, not a person photo. Technical 1×1 PNG so `SellerProfile` can persist required photo bytes. Do not replace with Unsplash or another author’s face.

## Work covers

- `product-images/dali-estate.png` — Opening / catalog Dali cover (`pixelp`).
- `product-images/caricature.png` — «Картина по фото в стиле шарж» (`bala_klava`).
- `product-images/yellow-sapphire.png` — «Желтый сапфир» (`quantumparadox`).
- `product-images/color-calibration.png` — «Color calibration» (`havoc`).
- `product-images/rainbow-mask.png` — Home «Новые работы»: «Радуга (Mask Series 1997 no.8)» (`bala_klava`).
- `product-images/blossom-vase.png` — Home «Новые работы»: «Ваза "Блоссом"» (`bala_klava`).
- `product-images/memory.png` — Home «Новые работы»: «Память» (`bala_klava`).
- `product-images/pending-placeholder.png` — technical 1×1 for the unpublished `pending-seller` moderation product. Not a public catalog asset.

Large Figma rasters were resized to a max long side of 1400px (portraits 800px) without upscaling smaller sources. No Unsplash fallbacks.
