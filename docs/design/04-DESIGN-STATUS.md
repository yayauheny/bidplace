# bidplace — статус дизайна и UI-реализации

Последнее обновление: 2026-08-20

Общий статус: **Pen v2 public discovery implementation is Partial; automated checks and runtime matrices pass, while matched Pen overlay and founder/device acceptance remain pending**

## 2026-08-20 — Admin analytics screen

- `Implemented`: admin-only `/admin/analytics` (Expo route `/(admin)/analytics`)
  with KPI overview, acquisition, buyer/seller funnels, marketplace health,
  growth bars, recent activity and needs-attention drilldowns. Linked from
  account menu and moderation. Not a Pen v2 public surface; operational admin UI.

## Creator-first exploration (not production canon)

- `Partial`: пакет направления лежит в репозитории: `design/creator-first/spec/`
  плюс `design/pen/bidplace-creator-first-v1.pen`. Это рабочий контракт и
  canvas, не замена `bidplace-web-v2.pen`.
- `Partial`: V2 art-direction correction лежит в `design/creator-first-v2/`
  (копия пакета с переписанным визуальным направлением). Pen V2 не начат;
  три golden-экрана ждут визуального утверждения. Канон production не менялся.
- `Confirmed`: production UI по-прежнему читает канон из
  `design/pen/bidplace-web-v2.pen`.
- Вход: `design/creator-first/README.md` (V1) и
  `design/creator-first-v2/README.md` (V2). Аудит/runbook:
  `docs/audits/creator-first-redesign/`.

## Текущий результат

- `Implemented`: final Pen v2 review blockers for the shared atmosphere,
  bounded blur overscan, Product About accordion, public creator pagination and
  eligibility-aware auction CTA are now backed by shared runtime code and
  focused tests. Mobile header and SlideToBid runtime primitives are now
  implemented, and Product Creation now has a staged runtime wizard with
  server-backed media/history/review states. Creator Profile Creation and
  moderation workspace are now staged/partial pending full visual acceptance.

- `Implemented`: структура `docs/design/00`–`07` пересобрана с чистого листа
  вокруг нового Pen v2 направления.
- `Implemented`: старая design system в `docs/modern-ui/` выведена из проекта;
  её visual rules и cutover plan больше не действуют.
- `Implemented`: точная локальная копия восстановлена по canonical path; SHA-256
  `685bc2dee4ca643869e678378bf849ab3189c4072b417670df6c64fa6c3181cf`.
- `Implemented`: canonical baseline принят commit `ba3439b`; после него любой
  `.pen` diff запрещён.
- `Confirmed`: `design/pen/bidplace-web-v2.pen` — защищённый визуальный эталон,
  который нельзя менять или удалять во время code work.
- `Verified`: canvas читается в Pen, canonical nodes экспортированы read-only;
  публичная копия доступна по founder-provided Pen URL.
- `Implemented`: reference hierarchy и motion/blur/hover specification внесены
  в `01`, `03`, `05`, `06` и основной аудит `07`.
- `Partial`: production UI перенесён на Pen v2 foundation, header, Browse
  Works, Home, Authors, Search, Product/Auction, Creator Profile, auth
  (login/register/forgot/reset), seller editors и supporting routes. Discovery
  data is server-authoritative, but exact fixed-scale comparison and visual/device
  acceptance are open.
- `Verified`: 1440/1024/390 runtime compositions, Onest/Inter loading,
  responsive overflow, Product URL/back tabs, related public works, focused E2E
  and production Expo exports.
- `Verified`: complete Chromium runtime suite `35/35`, including eight seeded
  catalog products, eight author cards, 1440/1024/390 layouts, loading/error/
  missing-media states, route boundaries and moderation flows.
- `Verified`: the guarded discovery seed now gives all eight public catalog
  cards distinct local main images; the Wave 2 matrix asserts unique image
  sources at 1440/1024/390. Fixture source attribution is recorded outside
  runtime API responses.
- `Verified`: post-implementation API/security audit aligned public Product,
  Bid history, realtime and image visibility; aggregate image limits are
  transactional and bidder aliases are Listing-scoped.
- `Implemented`: admin moderation screen adds **Пользователи** (email lookup, ban/unban, session revoke) and **Восстановление** (needs-order queue, emergency listing cancel) tabs alongside Authors/Works/Orders.
- `Partial`: route/IA для Home, Browse Authors и Search, contracts для
  search/filter/sort/author directory, header/account popover and shared
  controls. Creation story and structured socials are now implemented in the
  API; screen composition and visual acceptance remain open.
- `Implemented`: desktop account popover keyboard-open now moves focus into the
  portaled menu, with Escape returning focus to the trigger; the current header
  follows `Аукционы` / `Авторы` / `Создать` / profile-menu IA. Desktop hover
  dismiss closes after a short grace period only when the pointer leaves both
  trigger and dropdown; hovering nested items (Кабинет, Модерация, Выйти) does
  not count as leaving the menu surface. Full browser execution still needs
  matched Pen screenshots and device verification.
- `Implemented`: Browse Works now consumes server facets for category, author,
  material and uniqueness menus, confirmed price ranges, a separate
  server-backed `Статус` facet, status counts and state tabs; server-side
  sort/query state is URL-backed. The unsupported Pen
  `Тип работы` control remains intentionally omitted because no domain field
  is confirmed. Browse Authors exposes the API-backed activity/name sort
  control. The runtime now matches the measured discovery container at 1440px
  (1360px content width, 40px outer gutter, four 322px cards with 24px gaps),
  while the 1024/390 derived states remain pending screenshot and device
  acceptance.
- `Implemented`: the shared discovery header is contextual on `/authors`: the
  selector is `Авторы`, the direct peer link is `Работы`, and the search
  placeholder is `Найти работу или автора`. Other routes retain the confirmed
  auction context and existing navigation behavior.
- `Implemented`: Product hero now composes the Pen three-column identity,
  natural-ratio artwork and object-facts regions where viewport pressure
  permits; the shared AuctionPlayer is the measured 404×68 compact
  inline/sticky transaction bar, with a verified desktop inline→fixed
  transition after the hero threshold, while the existing bid form and server
  mutation remain the single state owner. Product Creation and Bids now use
  the direct `cK8kD`/`XIzHe` tab compositions: four distinct seeded process images with
  an accessible accordion, server-sorted bids with an explicit leader badge,
  and URL-backed deep links/history. Fixed-scale overlay and device
  acceptance remain pending.
- `Implemented`: `/seller/[slug]` now targets only `MqUMz` (`FINAL — Desktop
Creator / Profile / MVP v1`): centered hero, 120px avatar, handle/copy,
  present structured social links, biography, server-owned status counts and
  work filters, 64px desktop works gutters, and the shared AuctionCard grid.
  `HOXkZ` is not an implementation target. The shared header now uses the
  measured 420 / 480 / 420 desktop zones from `L9UV9`.
- `Implemented`: Creator status controls wrap at narrow widths instead of
  extending document width; Product keeps the same shared bid form in the
  mobile reading flow while the safe-area action remains sticky. Runtime smoke
  passed for Product and Creator at 1440/1024/390. Full Wave C visual/route
  acceptance passes 4/4 across 1440/1024/390; matched Pen overlay review and
  founder/device acceptance remain release gates.
- `Implemented`: Product share is a working public-link action with Web Share,
  clipboard and bounded browser-copy fallback; the result is announced in the
  button label and covered by Product E2E. Discovery facet/sort menus close on
  Escape, outside pointer interaction and accessibility escape, while Creator
  status controls expose a semantic tablist/tabpanel relationship.
- `Implemented`: Product About now has the distinct `О работе`,
  `Характеристики`, `Упаковка` and `Оплата и доставка` accordion anatomy plus
  the public author panel required by `L7ytbv`. Existing `deliveryInfo` is used
  where available; unsupported payment/packaging fields remain honest
  уточняющие states.
- `Implemented`: Creator Profile renders only structured public Telegram,
  Instagram and website fields; the legacy public `socialLink` is no longer
  promoted into a website icon, and E2E covers the absent-structured-social
  state.
- `Implemented`: Product About and Creator Profile now use one shared
  shell-level `AmbientImageBackground` with their public artwork/profile image
  URL, neutral veil, lower fade, safe media fallback and reduced-motion-aware
  fade-in. Product-local blur was removed; runtime checks confirm the shared
  atmosphere is present on both routes. Fixed-scale Pen overlay and
  founder/device acceptance remain release gates.
- `Verified`: local/test seed density now provides eight public works for the
  primary creator profile, with server-owned `2 / 4 / 2` LIVE/SCHEDULED/ENDED
  counts and local thematic media for the two-row Creator Profile composition.
- `Implemented`: the canonical mobile header masters in shared section `h757v`
  now render through `MobileHeader` at widths below 768px. Search open/close,
  menu open/close, outside/Escape dismissal, focus return and role-aware
  Create/Cabinet navigation are implemented; 1440/1024/390 screenshot and
  device/accessibility acceptance remain pending.
- `Partial`: Product Creation board `cK8kD` now maps to the staged
  `ProductDraftScreen` flow for description, images, history, review and
  submit. Owner-detail hydration now preserves creation intro, ordered story
  steps and process-photo metadata across reload/save; exact Pen visual
  comparison, full state screenshots and native picker acceptance remain
  pending.
- `Partial`: the shared mobile menu now uses `min(320px, viewport - 32px)`
  with right-gutter bounds, and Creator Profile fields reuse contract-derived
  Telegram, Instagram, website and handoff validation with field-local errors.
  Targeted regression coverage passes; the full Playwright, visual overlay,
  native-device and screen-reader/keyboard gates remain pending.
- `Partial`: Creator Profile Creation board `JOjIY` now maps to staged public
  identity, structured links, profile photo and private handoff/review states.
  The review intentionally omits private transfer fields; exact Pen comparison
  and device/accessibility acceptance remain pending.
- `Partial`: canonical Pen now includes design-only board `JOjIY` (`FINAL —
  Creator Profile Creation Flow`) with 20 desktop, 9 mobile and 3 tablet states,
  canonical Creator Profile previews, slug and avatar interaction matrices,
  public/private transfer separation and moderation outcomes. Persistent wizard
  previews no longer embed CreatorCard. At ≤767px one reusable compact
  `MobileHeader` shows only the canonical logo plus matching 44px Search, black
  Create (+) and Menu triggers. Search opens a back-trigger + canonical SearchBar
  state; Menu opens a 320px canonical-style dropdown for Auctions, Authors,
  Cabinet and Sign Out, with no duplicated Create or Search. Mobile header/menu
  masters and interaction states live in the dedicated bottom section of
  `FINAL — Shared UI Components`. Tablet/desktop headers are unchanged. No
  frontend/backend implementation or runtime verification has started.
- `Verified`: canonical Pen platform-grid audit aligned Browse Works, Browse
  Authors, Product/Auction, both Creator Profile finals, Product Creation/Bids,
  Product Creation flow and Creator Profile Creation flow to the header's
  Auctions anchor (`x=104`, `width=1232`) using shared Pen layout variables.
  Tablet wizard frames use 48 px and mobile frames use 16 px gutters. Overlay
  and comparison canvases without a platform header remain intentionally scoped
  to their own modal/board coordinate systems.
- `Verified`: all 16 Product Creation and 19 two-column Creator Profile Creation
  desktop states now share centered `WorkspaceLayout` geometry (`1088 = 600 +
  48 + 440`, x=176, top=56). Forms, review, loading, errors, success and
  moderation outcomes keep identical column positions. Three tablet states use
  the centered `928 = 500 + 32 + 396` workspace; nine mobile states remain
  single-column with the approved compact header and collapsible preview.
- `Partial`: canonical Pen now includes design-only board `NRlEW` (`FINAL —
  Admin Moderation Workspace`) with exactly two moderation domains: Authors and
  Works. It contains 23 required desktop, 14 mobile and 4 tablet states, wide
  queue rows without inline decisions, canonical public previews, separated
  private transfer data, centered `800 + 40 + 360` review workspaces, decision
  dialogs/sheets, blocking/conflict/success states and loading/empty/error
  references. Orders are explicitly excluded for future `/admin/orders`.
  Runtime now provides Authors/Works/All queue tabs, search/status filters,
  reasoned decisions and existing order controls; exact visual state coverage
  and device/accessibility acceptance remain pending.

## Screen matrix

| Target           | Pen      | Visual spec       | Data/route                            | Code        | Acceptance             |
| ---------------- | -------- | ----------------- | ------------------------------------- | ----------- | ---------------------- |
| Global Header    | `L9UV9` + `h757v` | measured desktop/tablet and mobile masters | role logic, mobile states and overlays exist | partial | pending visual QA/device QA |
| Home             | `BJd1P`  | exported/readable | `/api/discovery/home`                 | partial     | pending responsive QA  |
| Browse Works     | `H5vf2`  | exported/readable | server query + controls               | partial     | pending responsive QA  |
| Browse Authors   | `N4ebBk` | exported/readable | approved author list API + discipline | partial     | pending visual QA      |
| Product About    | `L7ytbv` | exported/readable | compatible contract                   | implemented | verified               |
| Product Creation | `cK8kD`  | exported/readable | existing fields only                  | implemented | verified               |
| Product Bids     | `XIzHe`  | exported/readable | compatible core fields                | implemented | verified               |
| Creator Profile  | `MqUMz`  | exported/readable | current public links                  | partial     | pending visual/data QA |
| Profile Creation | `JOjIY`  | responsive staged flow | public identity/links + private handoff | partial | pending visual/device QA |
| Admin Moderation | `NRlEW`  | responsive queue/review states | Authors/Works admin contracts | partial | pending visual/device QA |

## Shared component matrix

| Component     | Pen      | Runtime status                                                                  |
| ------------- | -------- | ------------------------------------------------------------------------------- |
| GlobalHeader  | `L9UV9`  | implemented horizontal responsive header                                        |
| AuctionCard   | `k5vYGf` | implemented shared card with media hover and responsive grid                    |
| CreatorCard   | `SrXPq`  | reusable production component uses public discipline; visual acceptance remains |
| AuctionPlayer | `X6Ksg`  | implemented controlled transaction component                                    |
| FilterMenu    | shared discovery controls | implemented shared sort/facet control in `components/layout` |
| ProductTabs   | `Jh9jr`  | implemented keyboard tabs with deep-link/back history                           |
| AmbientImageBackground | shared atmosphere | one shell-level image-derived background for Product and Creator; runtime verified |

## Legacy production state

Current Expo UI uses one `designTokens` contract and one `components/ui` layer.
Auth, auction, role, privacy, moderation, media recovery and route behavior
remain protected by tests; runtime code does not replace Pen as visual authority.

## Remaining release gates

1. Keep zero `.pen` diff and verify the canonical checksum after every UI stage.
2. Verify Home/Authors/Search/filter/sort states at 1440/1024/390 and record
   deliberate differences for unsupported H5vf2 controls.
3. Complete founder visual review and physical iOS/Android smoke acceptance.

## Definition of complete

A screen can become code-level `Implemented` only after comparison at
1440/1024/390, loading/empty/error/media states, keyboard/accessibility checks
and affected typecheck/lint/tests/build. Release-level `Accepted` additionally
requires founder/designer and physical-device approval. Documentation-only
mapping or a desktop screenshot is insufficient.

## Product Creation regression verification — 2026-08-13

- `Functional implemented`: creation-story save remains on step 3 so persisted
  steps can receive process photos before the explicit review transition; the
  URL preserves the current step across reload.
- `Automated regression passed`: Product Creation `1/1`, responsive Wave A
  `3/3`, core public route/console Wave One `5/5`, full Chromium `38/38`, and
  Expo production export for web/iOS/Android.
- `Visual compared`: fresh Product and Creator runtime captures were inspected
  at 1440/1024/390 for composition, overflow and responsive action ownership.
- `Needs verification`: formal matched Pen overlay, native-device behavior,
  physical screen-reader QA and founder approval remain open.
