# Pen — prompts для экранов MVP

Используйте один пронумерованный prompt за раз. Он создаёт или уточняет только
указанный экран в `design/pen/bidplace-web.pen`, а не меняет production-код.

## Общий контракт для каждого prompt

1. Используйте `$pen` и прочитайте документы, которые требует skill.
2. Сначала сверьте указанные route и source files с текущим кодом.
3. Используйте действующие `modernTokens` и shared primitives; не создавайте
   второй дизайн-системы и не генерируйте HTML/CSS для вставки в Expo.
4. Создайте только нужные frames: 1440, 1024 и 390 px; default, loading, empty,
   error и дополнительные состояния, перечисленные в prompt.
5. Сохраните canvas в `design/pen/bidplace-web.pen`, экспортируйте согласованные
   review PNG в `design/pen/exports/` и обновите `design/pen/README.md`.
6. Не меняйте product behavior, API, права, тексты статусов или source code.
   Остановитесь и сформулируйте вопрос, если красивое решение требует этого.
7. После экспорта верните только: изменённые frames, что не менялось, открытые
   вопросы и пути к PNG. Не начинайте реализацию без явного одобрения основателя.

## 1. Каталог — главная публичная страница

**Route:** `/`  
**Source:** `apps/mobile/src/features/products/product-list-screen.tsx`,
`apps/mobile/src/components/modern-ui/AuctionCard.tsx`,
`apps/mobile/src/components/layout/AppShell.tsx`

```text
Use $pen. Refine the existing bidplace public catalog prototype only.

Recreate the current MVP behavior from the source files. The desktop catalog has
no visible “Каталог” heading or item count. Start cards at the left edge of the
available content area after the 72 px desktop rail; do not center a narrow
catalog column. Keep the white canvas, quiet borders, real product photos,
Pinterest-inspired visual density, and the existing 2/3/4-column responsive
grid contract.

Show reusable product cards with photo, author, title, one-line description,
atomic price with BYN, and a secondary auction status/deadline. Do not add
search, filters, tags, favourite controls, pagination, recommendations, cart,
or fake product actions: they are not in the MVP.

Create frames at 1440, 1024, and 390 px for default, loading skeleton, empty,
and network error. In the error state, keep title, explanation, and “Повторить”
as one vertically stacked, horizontally centered group; the retry button must
be centered below the explanation. Include a long-title and unavailable-image
card state without breaking price/status alignment.

Do not change product logic or navigation. Export review PNGs for all target
widths and report only visual decisions and open questions.
```

## 2. Карточка предмета — reusable component

**Used by:** каталог и публичный профиль автора  
**Source:** `apps/mobile/src/components/modern-ui/AuctionCard.tsx`

```text
Use $pen. Design only the reusable bidplace AuctionCard component, based on the
current source and design tokens. It represents one authored item and remains
fully clickable as a single link to its public product page.

Use a stable 4:5 media area, real image, explicit unavailable-image fallback,
author name, title, one-line description, price with BYN kept together, and a
secondary listing status/deadline. Preserve the calm white Pinterest-inspired
style with restrained borders and no decorative controls.

Create component frames for catalog density and author-profile density at
1440, 1024, and 390 px. Cover long title, missing image, scheduled/live/ended
status, and a narrow-card case. Do not add tags, like/save buttons, seller
actions, product variants, or business data not present in the current card.
Export component review PNGs and state the exact reusable spacing, typography,
media, and overflow decisions.
```

## 3. Публичная страница предмета и аукцион

**Route:** `/product/[publicId]`  
**Source:** `apps/mobile/src/features/products/product-screen.tsx`,
`apps/mobile/src/features/products/AuctionPanel.tsx`,
`apps/mobile/src/features/products/ProductGallery.tsx`

```text
Use $pen. Refine only the public bidplace product-detail and auction screen.

Preserve the current information order. On desktop, gallery, author/title/
publication date, and AuctionPanel form one coherent top block. On mobile,
preserve the gallery → author/title → auction sequence. The author name is a
lightweight visible link to the public author profile. Below the top block,
render linear editorial sections for story, item facts, item history, and bid
history; do not restore tabs.

AuctionPanel is the only transactional block. Keep current price, minimum next
bid, end timing, bid field, and CTA visually clear. Do not invent payment,
checkout, direct chat, buy-now, reserve, watchlist, or extra auction rules.

Create 1440, 1024, and 390 px frames for guest, eligible buyer, winning buyer,
outbid buyer, scheduled, live, ended/result, bid-history loading/error/empty,
and unavailable-image states. Show the compact mobile bid dock only as the
existing summary + action pattern. Keep private buyer data out of the design.
Export review PNGs and list any open product decision separately.
```

## 4. Публичный профиль автора

**Route:** `/seller/[slug]`  
**Source:** `apps/mobile/src/features/sellers/public-seller-screen.tsx`

```text
Use $pen. Design only the public author profile for bidplace.

Show the approved author’s photo or the existing 120 px fallback, name, seller
type, short description, social link when available, and authored public item
grid. Keep the author grid intentionally less dense than the catalog: two
columns through 1024 px and three from 1025 px. Reuse AuctionCard rather than
inventing a new item card.

Create 1440, 1024, and 390 px frames for default with four works, author with
no published items, loading, profile-not-found, network error/retry, long name,
and missing author photo. Do not add follow, messaging, reviews, ratings,
collections, or private seller contacts.
Export review PNGs and identify only reusable author-profile patterns.
```

## 5. Мои покупки

**Route:** `/me/activity`  
**Source:** `apps/mobile/src/features/activity/activity-screen.tsx`

```text
Use $pen. Refine only the authenticated buyer’s “Мои покупки” screen.

Preserve its role-safe activity projection: compact divider-led rows for the
user’s participation, auction result, and applicable Order state. Do not show
a universal “Проверить результат” CTA on unrelated public product pages or to
admins. Keep purchase wording broad enough for future sale types, without
adding future features to this screen.

Create 1440, 1024, and 390 px frames for populated activity, truthful empty
state, loading, retryable error, long product title, winning/losing/ended
states, and an order-linked row. Do not expose another bidder’s identity,
seller private contact, payment, shipping tracking, or admin controls.
Export review PNGs and preserve the existing data hierarchy.
```

## 6. Заказ после завершения торгов

**Route:** `/order/[publicId]`  
**Source:** `apps/mobile/src/features/orders/order-screen.tsx`

```text
Use $pen. Design only the role-scoped bidplace order screen after a successful
auction result.

Keep the current order status, product summary, and handoff actions. Respect
privacy: only server-authorized participants see their allowed contact and
handoff information. Preserve the existing destructive confirmation before
reporting a failed handoff. Do not add payment, delivery tracking, invoices,
chat, dispute automation, or unconfirmed commerce features.

Create 1440, 1024, and 390 px frames for buyer, seller, loading, not-found or
forbidden state, retryable action error, completed handoff, and confirmed
handoff-failed state. Keep primary and destructive actions compact and clear.
Export review PNGs and list any behavior question rather than designing around
it.
```

## 7. Кабинет и заявка продавца

**Route:** `/(seller)/profile`  
**Source:** `apps/mobile/src/features/sellers/seller-profile-screen.tsx`

```text
Use $pen. Refine only the seller profile/application screen.

Preserve current behavior: the creator provides profile identity, photo,
description, social link, country, and handoff contact; editing is available
only in the existing CHANGES_REQUESTED state. Pending, approved, rejected, and
suspended states are read-only according to current behavior. Keep real photo
preview and its fallback, not a decorative avatar.

Create 1440, 1024, and 390 px frames for initial application, pending review,
changes requested with moderation reason, approved read-only profile, rejected,
suspended, loading, error/retry, long input content, and unavailable photo.
Do not add subscriptions, public analytics, payment settings, or future account
management features.
Export review PNGs and preserve form-field requirements.
```

## 8. Создание и редактирование предмета

**Routes:** `/(seller)/products/new`, `/(seller)/products/[id]`  
**Source:** `apps/mobile/src/features/sellers/product-draft-screen.tsx`

```text
Use $pen. Design only the seller’s product draft and edit screen.

Preserve current fields, image management, create/update/submit flow, server
locks, read-only preview, truthful image count, and correction workflow. Use
the existing 160×200 contain media-row contract. Keep at least one image as a
clear requirement before submission. Show the existing authored-item facts;
do not add tags, condition selector, AI content tooling, variants, inventory,
shipping calculator, or price controls not present in the current MVP.

Create 1440, 1024, and 390 px frames for new draft, draft with several images,
validation error, upload progress, image unavailable, CHANGES_REQUESTED with
reason, submitted/pending read-only state, approved locked state, loading, and
network retry. Keep destructive image removal visually distinct but not
full-width by default.
Export review PNGs and note only visual decisions.
```

## 9. Создание лота

**Route:** `/(seller)/listings/new`  
**Source:** `apps/mobile/src/features/sellers/listing-draft-screen.tsx`

```text
Use $pen. Design only the seller’s new listing screen.

Preserve approved-product selection, start price, dates/times, local feedback,
server validation/retry, and explicit scheduling. Dates remain readable to a
human while the app retains its existing ISO payload behavior. A seller cannot
use this screen to bypass product approval.

Create 1440, 1024, and 390 px frames for product selection, no eligible
products, invalid date/time, invalid price, schedule confirmation/success,
loading, network error/retry, long product title, and a locked unavailable
product. Do not add recurring auctions, reserve price, automatic extensions,
fee controls, payment, or auction options outside current behavior.
Export review PNGs and identify spacing/field hierarchy decisions.
```

## 10. Административная moderation

**Route:** `/admin`  
**Source:** `apps/mobile/src/features/admin/admin-moderation-screen.tsx`

```text
Use $pen. Refine only the admin moderation screen, preserving the existing
server-authoritative workflow.

On desktop, present seller and product queues side by side up to the current
1180 px breakpoint; stack them below it. Each queue item shows only the current
moderation data: identity/title, status, allowed action, latest reason, image
when available, and a lightweight author link. Keep compact actions instead of
full-width controls by default.

Preserve all current restrictions: correction or suspension requires a reason;
scheduled/live listings block ordinary seller suspension or product correction;
product approval remains disabled until its author is approved and states
“Сначала одобрите автора”. Keep confirmation dialogs bounded and centered.

Create 1440, 1024, and 390 px frames for pending seller, pending product,
approved seller/product, changes requested with reason, blocked active listing,
empty queues, loading, error/retry, confirmation dialog, long moderation reason,
and no-image item. Include the existing order cancellation/replacement area
only as currently implemented; do not add dashboards, bulk actions, analytics,
or new moderation policies.
Export review PNGs and flag only real behavior questions.
```

## 11. Вход

**Route:** `/login`  
**Source:** `apps/mobile/src/features/auth/auth-form.tsx`,
`apps/mobile/src/features/auth/schemas.ts`

```text
Use $pen. Design only the bidplace login screen.

Keep the current truthful email/password login, field validation, redirect
behavior, loading state, safe generic server feedback, and link to account
creation. Preserve the isolated and scrollable mobile auth layout. Do not add
social login, password recovery, magic links, marketing panels, remembered
devices, or fields not in the current MVP.

Create 1440, 1024, and 390 px frames for default, invalid email, invalid
password, loading, generic login failure, keyboard/long-content-safe mobile,
and focus state. Use the existing compact content-width button rules.
Export review PNGs and keep the form functional hierarchy simple.
```

## 12. Регистрация

**Route:** `/register`  
**Source:** `apps/mobile/src/features/auth/auth-form.tsx`,
`apps/mobile/src/features/auth/schemas.ts`,
`apps/mobile/src/features/auth/email-rules-gate.tsx`

```text
Use $pen. Design only the bidplace account-registration screen.

Preserve the current registration fields, validation, redirect behavior, email
verification and rules-acceptance gate, one announced loading state, and
plain-language retry feedback. Keep copy truthful: creating an account does
not by itself make a person a seller.

Create 1440, 1024, and 390 px frames for default, field validation, submitting,
generic retryable server error, email verification, rules acceptance, and
keyboard/long-content-safe mobile. Do not add social login, onboarding
questionnaires, seller approval, marketing consent, or future profile fields.
Export review PNGs and retain a calm, minimal auth hierarchy.
```

## После утверждения любого экрана

Не начинайте реализацию. Сначала заполните handoff из
`docs/design/05-DESIGN-HANDOFF.md`: Pen source, approved export, route, role,
viewports, changed shared components, existing tokens, states, assets,
accessibility, acceptance criteria и open questions.
