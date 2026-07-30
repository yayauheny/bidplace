# bidplace — дизайн-система

Последнее обновление: 2026-07-31

Статус: final Modern UI cutover is in Partial final migration pending founder acceptance. Automated regression has passed; the experimental bridge/pilot is not the accepted implementation strategy.

Wave 2 additions: `modernTokens` uses a white canvas with neutral muted/chip surfaces and semantic content/chrome/popover/modal layers; `AppShell` owns the 72 px desktop rail, account row and web `OverlayHost`; `AppHeader` owns role-derived icon navigation; `AccountMenu`, `PageHeader` and `PageState` are shared primitives. Product detail uses the existing public Product/SellerProfile/Listing data for author, facts, publication date and history.

## Current implementation

Это фактическая инвентаризация committed final UI; она не является утверждением бренда и остаётся Partial до founder acceptance.

| Область             | Фактическая реализация                                                                                                         | Путь                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Colors/themes       | light-only semantic palette through `modernTokens`; web canvas and surface are white with neutral muted surfaces and semantic borders | `packages/design-tokens/src/modern.ts`, `apps/mobile/src/providers/theme-provider.tsx` |
| Spacing             | 2–96 px шкала                                                                                                                  | `packages/design-tokens/src/index.ts`                                                  |
| Radius              | `xs`–`2xl`, `full`                                                                                                             | `packages/design-tokens/src/index.ts`                                                  |
| Size/touch          | control sizes и `touch: 44`                                                                                                    | `packages/design-tokens/src/index.ts`                                                  |
| Typography tokens   | display/hero/heading/title/body/small/caption/nav                                                                              | `packages/design-tokens/src/index.ts`                                                  |
| Fonts               | Inter and PT Mono runtime loading                                                                                              | `apps/mobile/src/app/_layout.tsx`                                                      |
| Layout              | page/content/reading/form max widths; shared `AppShell` keeps a 72 px desktop rail, desktop account row, mobile header account control and flexible page area | `packages/design-tokens/src/index.ts`, `apps/mobile/src/components/layout/AppShell.tsx`, `AppHeader.tsx` |
| Breakpoints         | final responsive shell: mobile below 1025 px and desktop rail from 1025 px                                                     | `apps/mobile/src/components/layout/AppHeader.tsx`                                      |
| Elevation           | semantic surface and overlay tokens                                                                                            | `packages/design-tokens/src/modern.ts`                                                 |
| Buttons             | semantic primary, secondary and destructive actions with loading/disabled/accessibility state                                  | `apps/mobile/src/components/modern-ui/Button.tsx`                                      |
| Fields/forms        | `TextField`, form sections and route-level RHF forms                                                                           | `apps/mobile/src/components/modern-ui`, `apps/mobile/src/features`                     |
| Cards/panels        | `AuctionCard`, `AuctionPanel`, `FormSection` and route-local surfaces                                                          | `apps/mobile/src/components/modern-ui`, `apps/mobile/src/features`                     |
| Status              | semantic text tones, auction panel facts and server-projected route states                                                     | `apps/mobile/src/components/modern-ui`, `apps/mobile/src/features`                     |
| Auction patterns    | gallery, auction panel, bid history and seller summary                                                                         | `apps/mobile/src/components/modern-ui`, `apps/mobile/src/features/products`            |
| Navigation          | role-derived icon rail with hover/focus labels, seller capability actions and shared account menu                              | `apps/mobile/src/components/layout/AppHeader.tsx`, `apps/mobile/src/components/layout/AccountMenu.tsx` |
| Feedback            | shared `PageHeader` and `PageState` provide consistent loading, empty, error and retry states                                  | `apps/mobile/src/components/modern-ui/PageHeader.tsx`, `PageState.tsx`                 |
| Media               | Expo Image, `getApiAssetUrl`, loading surface, missing/error placeholder, image picker and truthful seller image count          | `apps/mobile/src/lib/environment.ts`, `apps/mobile/src/components/modern-ui`, `apps/mobile/src/features/sellers` |
| Final UI foundation | Final semantic namespace, AppText/Icon/press, buttons, text field, skeleton, image placeholder, content tabs and auction panel | `packages/design-tokens/src/modern.ts`, `apps/mobile/src/components/modern-ui/`        |
| Form sections       | Semantic section container for seller/admin forms; presentation-only children                                                  | `apps/mobile/src/components/modern-ui/FormSection.tsx`                                 |

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
