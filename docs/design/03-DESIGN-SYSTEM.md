# bidplace — дизайн-система

Последнее обновление: 2026-08-02

Статус: final Modern UI cutover is in Partial final migration pending founder acceptance. Automated regression has passed; the experimental bridge/pilot is not the accepted implementation strategy.

Wave A token update: `modernTokens.layout` now owns `railWidth` and the existing Product detail measure; `modernTokens.breakpoint` owns the desktop shell and catalog transitions; `modernTokens.ratio.productPortrait` owns the confirmed 4:5 product media ratio. No page/content max-width token was added.

Wave A overlay update: `OverlayPortal` is the web adapter for account popovers at every viewport, with `layer.popover` and an 8px collision inset; `AppDialog` uses `layer.modal` and a viewport-bounded internal scroll container.

Wave A catalog update: `CatalogGrid`, `AuctionCard`, `Skeleton` and `ImagePlaceholder` share the confirmed `ratio.productPortrait` geometry. Compact cards keep the amount with `BYN` on one line and put listing status/deadline on the next line; loading and failed-image wrappers use the same grid cells as loaded cards.

Wave A responsive detail/navigation update: the requested product-wide threshold is `900px`, the wide hero is `440px` with the shared `4:5` ratio, and the mobile bid dock is limited to a summary plus one compact `44px` action with safe-area padding. Mobile navigation uses equal-width icon-over-label cells with `Inter 500 / 13 / 18`, while auth routes use a keyboard-aware scroll viewport. These values follow the explicit Wave A implementation request; visual/device/accessibility acceptance remains separate.

Wave 2 additions: `modernTokens` uses a white canvas with neutral muted/chip surfaces and semantic content/chrome/popover/modal layers; `AppShell` owns the 72 px desktop rail, account row and web `OverlayHost`; `AppHeader` owns role-derived icon navigation. Catalog uses the available page width after the rail, while Product detail keeps gallery, author/title and auction in one responsive top block and renders the item story as linear sections. Product detail uses the existing public Product/SellerProfile/Listing data for author, facts, publication date and history.

## Current implementation

Это фактическая инвентаризация committed final UI; она не является утверждением бренда и остаётся Partial до founder acceptance.

| Область             | Фактическая реализация                                                                                                                                                                     | Путь                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Colors/themes       | light-only semantic palette through `modernTokens`; web canvas and surface are white with neutral muted surfaces and semantic borders                                                      | `packages/design-tokens/src/modern.ts`, `apps/mobile/src/providers/theme-provider.tsx`                           |
| Spacing             | 2–96 px шкала                                                                                                                                                                              | `packages/design-tokens/src/index.ts`                                                                            |
| Radius              | `xs`–`2xl`, `full`                                                                                                                                                                         | `packages/design-tokens/src/index.ts`                                                                            |
| Size/touch          | control sizes и `touch: 44`                                                                                                                                                                | `packages/design-tokens/src/index.ts`                                                                            |
| Typography tokens   | display/hero/heading/title/body/small/caption/nav                                                                                                                                          | `packages/design-tokens/src/index.ts`                                                                            |
| Fonts               | Inter and PT Mono runtime loading                                                                                                                                                          | `apps/mobile/src/app/_layout.tsx`                                                                                |
| Layout              | page/content/reading/form max widths; shared `AppShell` keeps a 72 px desktop rail, desktop account row, mobile header account control and flexible page area                              | `packages/design-tokens/src/index.ts`, `apps/mobile/src/components/layout/AppShell.tsx`, `AppHeader.tsx`         |
| Breakpoints         | final responsive shell: mobile below 1025 px and desktop rail from 1025 px; Product detail uses the wide two-column transition at 900 px                                                           | `packages/design-tokens/src/modern.ts`, `apps/mobile/src/components/layout/AppHeader.tsx`, `apps/mobile/src/features/products/product-screen.tsx` |
| Elevation           | semantic surface and overlay tokens                                                                                                                                                        | `packages/design-tokens/src/modern.ts`                                                                           |
| Buttons             | semantic primary, secondary and destructive actions with loading/disabled/accessibility state; `content` default, `compact` inline and explicit `block` width variants; compact action is 44 px with a 14 px radius | `apps/mobile/src/components/modern-ui/Button.tsx`, `button-layout.ts`                                      |
| Fields/forms        | `TextField`, form sections and route-level RHF forms                                                                                                                                       | `apps/mobile/src/components/modern-ui`, `apps/mobile/src/features`                                               |
| Cards/panels        | `AuctionCard`, `AuctionPanel`, `FormSection` and route-local surfaces                                                                                                                      | `apps/mobile/src/components/modern-ui`, `apps/mobile/src/features`                                               |
| Status              | semantic text tones, auction panel facts and server-projected route states                                                                                                                 | `apps/mobile/src/components/modern-ui`, `apps/mobile/src/features`                                               |
| Auction patterns    | gallery, auction panel, bid history and seller summary                                                                                                                                     | `apps/mobile/src/components/modern-ui`, `apps/mobile/src/features/products`                                      |
| Navigation          | role-derived icon rail with hover/focus labels, seller capability actions and shared account menu; mobile uses equal-width icon-over-label cells and no tablist role | `apps/mobile/src/components/layout/AppHeader.tsx`, `apps/mobile/src/components/layout/AccountMenu.tsx` |
| Feedback            | shared `PageHeader` and `PageState` provide consistent loading, empty, error and retry states                                                                                              | `apps/mobile/src/components/modern-ui/PageHeader.tsx`, `PageState.tsx`                                           |
| Media               | Expo Image, `getApiAssetUrl`, loading surface, missing/error placeholder, image picker and truthful seller image count                                                                     | `apps/mobile/src/lib/environment.ts`, `apps/mobile/src/components/modern-ui`, `apps/mobile/src/features/sellers` |
| Final UI foundation | Final semantic namespace, AppText/Icon/press, buttons, text field, skeleton, image placeholder and auction panel                                                                           | `packages/design-tokens/src/modern.ts`, `apps/mobile/src/components/modern-ui/`                                  |
| Form sections       | Semantic section container for seller/admin forms; presentation-only children                                                                                                              | `apps/mobile/src/components/modern-ui/FormSection.tsx`                                                           |

Final Modern UI uses Lucide only through `AppIcon`, one overlay adapter and a light-only MVP theme; semantic tokens keep a future dark-mode option without shipping it now. `AppDialog` is required for destructive seller media and admin moderation actions.

Every route uses the final shell and primitives. `AppShell` preserves the mobile header/bottom-action composition and provides the desktop rail/page split; the account control stays in the mobile brand row and desktop right-side account row respectively. `FormSection` groups seller/admin forms; seller media retains truthful count, direct reorder and confirmed deletion. No bridge or legacy UI import remains; image fallback is a truthful unavailable-media state, not a substitute for a valid asset URL.

## Target principles

- semantic tokens вместо screen-local hex/spacing;
- один canonical component на роль;
- variants отражают смысл, а не конкретный экран;
- состояние различается текстом, структурой и при необходимости цветом;
- минимум 44 px для интерактивной цели;
- формы связывают label, hint, error и focus;
- destructive/admin actions имеют явное подтверждение;
- bid confirmation показывает amount, minimum, auction и необратимость;
- countdown устойчив к background/resume и опирается на server snapshot;
- bid history использует public alias и не раскрывает identity;
- responsive layout проектируется для mobile и desktop, а не только переносится;
- animation не скрывает задержку сети и поддерживает reduced motion;
- media имеет aspect ratio, placeholder, error и accessible description;
- loading/empty/error/offline/reconnect покрываются на уровне каждого flow.

## Missing foundations

- утверждённые brand tokens, typography и assets;
- token governance и документированная семантика colors;
- focus/keyboard/screen-reader test matrix;
- component documentation или visual regression tests;
- offline/reconnect banner и stale-data state;
- participation status pattern;
- verified seller/provenance patterns;
- complete countdown/bid/auction state specification;
- image gallery states для обязательных трёх изображений;
- final light-mode contrast audit;
- design QA evidence на целевых устройствах.

## Wave B shared-system progress

- `Implemented`: B1 semantic contrast roles are canonical in `packages/design-tokens/src/modern.ts`; normal text/action roles and keyboard focus meet the tested contrast thresholds, while `textMuted` remains reserved for non-essential/disabled/placeholder content.
- `Implemented`: runtime consumers use `modernTokens`; conflicting legacy token exports were removed after an import audit found no current workspace consumers. Wave A canvas, success color, layout, radius, and ratio values remain unchanged.
- `Needs verification`: founder physical-device and screen-reader/visual acceptance remains open after automated Wave B evidence.
- `Implemented`: B2 supplies the shared focus-visible CSS contract, web/native reduced-motion adapter, 44px compact hit areas, and single-name composite icon semantics. Target-width browser evidence passes; founder device/screen-reader acceptance remains `Needs verification`.
- `Implemented`: B3 keeps default/compact button geometry tokenized and preserves the original label plus a stable icon/spinner slot during busy state.
- `Implemented`: B4 centralizes the 4:5 product media geometry, stable narrow-card metadata rows, and a plain `EditorialSection` primitive prepared for Wave C without changing current Product section order.
- `Implemented`: B5 separates shared loading/empty/error PageState semantics and strengthens AppDialog modal/scroll accessibility while preserving the existing focus primitive.
- `Implemented`: B6 provides localized presentation maps, date-time normalization, and 44px selectable rows for existing seller/admin values without changing API serialization or business statuses.

## Do not invent without designer approval

- финальные цвета, gradients, shadows и decorative motifs;
- финальные font families и typographic scale;
- логотип, иллюстрации, photo treatment и iconography;
- новый layout breakpoint;
- dark mode как обязательный продуктовый scope;
- animation timings и celebration;
- badges, verification marks и trust language;
- новый component variant, если существующий pattern можно использовать;
- изменение flow или business state ради удобства макета.
