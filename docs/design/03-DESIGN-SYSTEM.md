# bidplace — дизайн-система

Последнее обновление: 2026-07-18

Статус: Current implementation verified; target foundations partial

## Current implementation

Часть перечисленного находится в незакоммиченном рабочем состоянии и требует design QA. Это инвентаризация кода, не утверждение бренда.

| Область           | Фактическая реализация                                    | Путь                                                                                   |
| ----------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Colors/themes     | light/dark semantic palettes                              | `packages/design-tokens/src/index.ts`, `apps/mobile/src/theme/tokens.ts`, `palette.ts` |
| Spacing           | 2–96 px шкала                                             | `packages/design-tokens/src/index.ts`                                                  |
| Radius            | `xs`–`2xl`, `full`                                        | `packages/design-tokens/src/index.ts`                                                  |
| Size/touch        | control sizes и `touch: 44`                               | `packages/design-tokens/src/index.ts`                                                  |
| Typography tokens | display/hero/heading/title/body/small/caption/nav         | `packages/design-tokens/src/index.ts`                                                  |
| Fonts             | Inter body, Cormorant Garamond heading                    | `apps/mobile/src/theme/tokens.ts`, `tamagui.config.ts`, `_layout.tsx`                  |
| Layout            | page/content/reading/form max widths                      | `packages/design-tokens/src/index.ts`                                                  |
| Breakpoints       | mobile ≤640, tablet ≤1024, desktop ≥1025, wide ≥1440      | `apps/mobile/src/theme/tokens.ts`, `tamagui.config.ts`                                 |
| Elevation         | shadow tokens плюс local card shadows                     | tokens, `AppCard.tsx`                                                                  |
| Buttons           | tones, sizes, loading/disabled/focus                      | `components/ui/AppButton.tsx`; thin duplicate `PrimaryButton.tsx`                      |
| Fields/forms      | input, controlled input, field error, RHF forms           | `components/ui/AppInput.tsx`, `ControlledAppInput.tsx`, `FormField.tsx`; `features/*`  |
| Cards/panels      | `AppCard`, `EntityPanel`, auction/storefront cards        | `components/ui`, `components/auction`, `components/storefront`                         |
| Status            | status badge and mapping                                  | `StatusBadge.tsx`, `features/auctions/utils.ts`                                        |
| Auction patterns  | timer, banner, gallery, bid panel/history, seller summary | `components/auction`                                                                   |
| Navigation        | responsive header, desktop navigation, mobile drawer      | `components/layout`                                                                    |
| Feedback          | loading/empty/error states                                | `components/ui/LoadingState.tsx`, `EmptyState.tsx`, `ErrorState.tsx`                   |
| Media             | Expo Image, API URL resolver, image picker                | `components/auction`, `components/storefront`, `features/seller`                       |

Icon library или утверждённая iconography не найдены. Общего modal/dialog pattern нет; `AppSheet` используется как bottom-sheet primitive. Dark mode tokens существуют, но продуктовая необходимость и полное покрытие не подтверждены.

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
- icon set;
- focus/keyboard/screen-reader test matrix;
- component documentation или visual regression tests;
- canonical confirmation modal и destructive action pattern;
- offline/reconnect banner и stale-data state;
- participation status pattern;
- verified seller/provenance patterns;
- complete countdown/bid/auction state specification;
- image gallery states для обязательных трёх изображений;
- desktop/mobile navigation model для всех ролей;
- единый выбор между `AuctionCard` и `ProductCard`, `AppButton` и `PrimaryButton`;
- dark mode decision и contrast audit;
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
