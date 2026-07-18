# bidplace — статус дизайна

Дата снимка: 2026-07-18

Статус документа: Verified against working tree; approved Figma source not found

## Обозначения

`Designed`, `Partially designed`, `Implemented without approved design`, `Implemented`, `Needs redesign`, `Not started`, `Needs verification` описывают дизайн/реализацию, а не продуктовый статус. `Implemented` используется только при наличии согласованного макета и design QA; на текущем снимке таких доказательств нет.

## Routes and screens

| Экран                     | Route / код                                         | Макет     | Статус                              | Основные проблемы                                                          | Mobile / a11y                                        | MVP                     | Следующий шаг                                              |
| ------------------------- | --------------------------------------------------- | --------- | ----------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| Home                      | `/`; `storefront-home-screen.tsx`                   | не найден | Needs redesign                      | demo fallback, lifestyle/product copy, weak value/provenance               | responsive primitives; QA/a11y не проведены          | Entry: high             | Утвердить роль home и seller-led entry                     |
| Catalog                   | `/catalog`; `storefront-catalog-screen.tsx`         | не найден | Needs redesign                      | demo products скрывают отсутствие данных; general marketplace filters/grid | 2-column mobile may be dense; keyboard/labels verify | Low for direct-link MVP | Не делать catalog главным MVP flow                         |
| Legacy auction list       | `auction-list-screen.tsx` (route no longer primary) | не найден | Implemented without approved design | техническая лексика; competing public presentation                         | states есть; responsive hierarchy basic              | Low                     | Решить owner presentation, убрать дублирование отдельно    |
| Auction detail            | `/auctions/[slug]`; `auction-detail-screen.tsx`     | не найден | Needs redesign                      | reserve leak, неполная value card, no alias/participation/reconnect        | loading/empty/error есть; live/a11y QA missing       | Critical                | Спроектировать canonical MVP detail states                 |
| Storefront product detail | `/product/[id]`; `storefront-product-screen.tsx`    | не найден | Needs redesign                      | дублирует auction detail; commerce framing; incomplete auction states      | wrap layout; narrow/focus QA missing                 | Critical if retained    | Выбрать один canonical detail route                        |
| Public seller             | `/sellers/[slug]`; `public-seller-screen.tsx`       | не найден | Partially designed                  | нет verification/photo/examples; public contact preference                 | states present; privacy review needed                | High                    | Handoff public/private fields and states                   |
| Login                     | `/login`; auth route/form                           | не найден | Implemented without approved design | no end-to-end session evidence                                             | form errors/loading exist; keyboard QA needed        | Critical                | Design QA target web/native                                |
| Register                  | `/register`; auth route/form                        | не найден | Needs redesign                      | phone input is not verification; transition to bid unclear                 | form validation; input semantics verify              | Critical                | Design auth→OTP→return-to-bid flow                         |
| Phone verification        | отсутствует                                         | не найден | Not started                         | entire first-bid gate missing                                              | —                                                    | Critical                | Define OTP states without choosing provider UI prematurely |
| Seller dashboard          | `/seller`; `seller-dashboard-screen.tsx`            | не найден | Needs redesign                      | mixed Russian/English, no review/handoff status                            | states exist; navigation/keyboard QA missing         | High                    | Align tasks with seller MVP flow                           |
| Seller profile form       | `/profile`; `seller-profile-form.tsx`               | не найден | Partially designed                  | missing required public identity fields/status                             | form states exist; keyboard/safe-area verify         | High                    | Specify fields and private/public preview                  |
| Lot form                  | `/lots/new`; `lot-create-form.tsx`                  | не найден | Needs redesign                      | missing value/provenance fields and 3-image gate                           | picker states partial; a11y/order QA needed          | Critical                | Design complete draft and validation sequence              |
| Auction form              | `/auctions/new`; `auction-create-form.tsx`          | не найден | Needs redesign                      | USD/buy-now/public reserve inconsistent with MVP                           | form states; date/time usability unverified          | Critical                | Align form with BYN scheduled auction contract             |
| Post-auction seller/buyer | отсутствует                                         | не найден | Not started                         | no winner/lost/handoff/refusal/sale states                                 | —                                                    | Critical                | Design full end-to-end conclusion                          |
| Admin dashboard           | `/admin`; `admin-dashboard-screen.tsx`              | не найден | Needs redesign                      | no review queues, confirmation, audit, incident flow                       | responsive basics; destructive a11y/confirm missing  | Critical ops            | Design moderation and integrity workspace                  |

## Shared components

| Component/pattern                                | Код                                           | Статус                              | Основная проблема                                               | Следующий шаг                                    |
| ------------------------------------------------ | --------------------------------------------- | ----------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| Tokens/themes                                    | `packages/design-tokens`, mobile theme        | Needs verification                  | unapproved palette/fonts/dark mode; some hard-coded values      | Token audit and designer approval                |
| `AppButton`                                      | `components/ui/AppButton.tsx`                 | Partially designed                  | variants exist; semantics/pressed/contrast QA incomplete        | Document canonical variants                      |
| `PrimaryButton`                                  | `components/ui/PrimaryButton.tsx`             | Needs redesign                      | thin duplicate of `AppButton`                                   | Select one API in later code task                |
| `AppCard` / `EntityPanel`                        | `components/ui`                               | Partially designed                  | overlapping containers, local hard-coded colors                 | Define roles and token use                       |
| `AuctionCard` / `ProductCard`                    | auction/storefront components                 | Needs redesign                      | competing domain representations and routes                     | Choose value-first auction card                  |
| `SectionHeader` / `SectionHeading` / `PageIntro` | ui/storefront                                 | Needs verification                  | overlapping hierarchy without documented roles                  | Establish typographic hierarchy                  |
| Inputs/forms                                     | `AppInput`, `ControlledAppInput`, `FormField` | Partially designed                  | validation present; keyboard/autofill/labels not fully verified | Form accessibility QA                            |
| Status badge/banner                              | `StatusBadge`, `AuctionStateBanner`           | Partially designed                  | actual states incomplete; color semantics unapproved            | Map canonical states including own participation |
| Countdown                                        | `AuctionTimer.tsx`                            | Implemented without approved design | no server-offset/reconnect/reduced-motion spec                  | Define stale/resume behavior                     |
| Bid panel/history                                | `BidPanel.tsx`, `BidHistory.tsx`              | Needs redesign                      | no confirmation/idempotency/alias/own status                    | Design critical bid state machine                |
| Loading/empty/error                              | `components/ui/*State.tsx`                    | Partially designed                  | reusable basics; offline/stale/success absent                   | Add state coverage spec before code              |
| Header/navigation                                | `components/layout`                           | Needs verification                  | new working-tree implementation; route/role coverage incomplete | Responsive navigation QA                         |
| Sheets/modals                                    | `AppSheet.tsx`, filter/sort sheets            | Partially designed                  | no canonical confirmation/destructive dialog                    | Define modal taxonomy                            |

## Missing MVP screens

- phone verification;
- first-bid confirmation and definitive result;
- own participation status/history;
- outbid/winning/lost/won states;
- reconnect/stale snapshot handling;
- seller invitation/verification;
- lot/auction preview and moderation;
- admin seller/lot review and investigation;
- buyer/seller handoff, refusal and sale confirmation.

## Unresolved UX scenarios

- return destination after login/OTP;
- what a scheduled auction exposes before start;
- hidden reserve communication without disclosure;
- own bid state across devices/reconnect;
- contact consent/release and refusal timeline;
- no-winner outcome;
- admin confirmation and incident ownership;
- canonical relationship among `/`, `/catalog`, `/product/[id]`, `/auctions/[slug]`.

## Visual inconsistencies and duplicates

- auction components and storefront components express the same domain differently;
- `AppButton`/`PrimaryButton`, card/panel, section heading patterns overlap;
- hard-coded colors coexist with semantic tokens;
- Russian product text is mixed with `Seller area`, `Admin area`, `auction`, `Editorial selection`;
- technical dashboard language conflicts with calm value-first public experience;
- demo product fallback can imply inventory that does not exist.

## Design debt and forgotten states

- no approved Figma links/assets or design QA records;
- no accessibility target/test matrix;
- offline, stale, reconnect and event-gap states;
- destructive confirmation and success acknowledgement;
- image upload progress/failure/reorder accessibility;
- long content, missing images and extreme prices/times;
- background/resume and server/client clock drift;
- dark mode coverage and contrast;
- responsive admin/seller tables with real data volume.

## First-pilot design blockers

1. No canonical auction detail covering value, preview, bid confirmation and authoritative states.
2. No phone verification, participation, outbid/winning, reconnect or post-auction screens.
3. Hidden reserve is displayed publicly.
4. Seller and admin moderation flows are absent.
5. Competing routes/components make the public journey ambiguous.
6. No evidence of mobile-web, keyboard, screen-reader or design QA on pilot devices.
