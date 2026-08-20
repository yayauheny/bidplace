# Technical appendix

Связка: смысл для дизайнера → поле / контракт → API → UI.

Не для макета. Для проверки с инженером.

---

## Routes

| Product | Path | Screen |
|---|---|---|
| Home | `/` | `apps/mobile/src/features/home/home-screen.tsx` → `HomeScreen` |
| Works | `/works` | `product-list-screen.tsx` → `ProductListScreen` |
| Authors | `/authors` | `public-authors-screen.tsx` |
| Search | `/search` | `search-screen.tsx` |
| Work | `/product/[publicId]` | `product-screen.tsx` → `ProductScreen` |
| Creator | `/seller/[slug]` | `public-seller-screen.tsx` |
| Auth | `/login`, `/register` | `auth-form.tsx` |
| Activity | `/me/activity` | `activity-screen.tsx` |
| Order | `/order/[publicId]` | `order-screen.tsx` |
| Apply / cabinet | `/profile` | `seller-profile-screen.tsx` |
| New work | `/products/new` | `product-draft-screen.tsx` |
| Edit work | `/products/[id]` | тот же |
| Schedule | `/listings/new` | `listing-draft-screen.tsx` |
| Admin | `/admin` | `admin-moderation-screen.tsx` |

---

## Home

| Product | Backend | Endpoint | Frontend |
|---|---|---|---|
| Top auctions | `ProductsService.listPublic` sort `activity` limit 3 | `GET /api/discovery/home` → `topAuctions` | `HomeScreen` `AuctionCardGrid` |
| New works | `listPublic` sort `newest` limit 3 | `newWorks` | то же |
| Creators | `SellersService.listPublic` sort `activity` limit 4 | `creators` | `CreatorCardGrid` |

Contract: `packages/contracts/src/discovery.ts` → `publicHomeResponseSchema`.

---

## Work (product)

| Product | DB / DTO | Endpoint | UI |
|---|---|---|---|
| Public id | `Product.publicId` | `GET /api/products/:publicId` | route param |
| Title | `Product.title` | `product.title` | идентичность работы; discovery |
| Story / история | `Product.story` | `product.story` | история работы (в текущем UI также укороченный заход) |
| Uniqueness | `Product.uniqueness` | `product.uniqueness` | факты; facet `/works` |
| Provenance | `Product.provenance` | `product.provenance` | под историей |
| Technique | `Product.technique` | `product.technique` | факты, если есть |
| Materials | `Product.materials` | `product.materials` | факты; поиск; facet |
| Dimensions | `Product.dimensions` | `product.dimensions` | факты |
| Weight | `Product.weight` | `product.weight` | **не рендерится** |
| Year | `Product.year` | `product.year` | факты; API filter `yearFrom`/`yearTo` |
| Condition | `Product.condition` | `product.condition` | факты (может быть пусто) |
| City | `Product.city` | `product.city` | факты |
| Packaging | `Product.packaging` | `product.packaging` | факты, если есть |
| Delivery | `Product.deliveryInfo` | `product.deliveryInfo` | «Передача» и «Оплата и доставка» |
| Category | `Product.categoryId` → `Category` | `categoryId`; `GET /api/categories` | форма + facet; **не** work detail |
| Cover / gallery | `ProductImage` ordered by `position` | `product.images[].url` → `/api/images/:id` | `ProductGallery`, `AuctionCard` first image |
| Creation intro | `Product.creationIntro` | `creationIntro` | процесс создания |
| Process steps | `ProductCreationStep` | `creationSteps[]` | то же; image `/api/creation-steps/:id/image` |
| Published | `Product.publishedAt` | `publishedAt` | sort `newest` |
| Status (moderation) | `Product.status` | owner/admin | не на публичной странице |

Public contract: `packages/contracts/src/public-product.ts`.  
Write: `product.ts` → `productWriteRequestSchema`.  
Submit gate: `apps/api/src/products/product-requirements.ts`.

---

## Listing / auction

| Product | Field | Endpoint | UI |
|---|---|---|---|
| Status | `Listing.status` | внутри product detail `listing` | аукцион; discovery |
| Starts | `startsAt` | то же | «Начало» если SCHEDULED |
| Ends | `endsAt` | то же | таймер / дата |
| Original end | `originalEndsAt` | то же | soft-close cap, не UI |
| Current price | `currentPrice` | то же | «Ставка» / «Цена» |
| Bid count | `bidCount` | то же | **не UI** |
| Start price | `AuctionRules.startPrice` | `listing.auctionRules.startPrice` | sr-only / данные |
| Min next | computed | `minimumNextBid` на detail если LIVE | форма ставки |
| Place bid | `POST /api/listings/:id/bids` | `BidsController.place` | `SlideToBid` / `BidForm` |
| History | `GET /api/listings/:id/bids` | `bidSchema` | история ставок |
| Alias | `createBidderAlias` | `bid.bidderAlias` | участник в истории |

Enums: `packages/contracts/src/enums.ts`.  
Pricing: `apps/api/src/core/auction/pricing-policy.ts`.

---

## Creator

| Product | Field | Endpoint | UI |
|---|---|---|---|
| Name | `SellerProfile.fullName` | public seller | идентичность автора; каталог авторов |
| Slug | `slug` | `/seller/:slug` | `@slug` |
| Photo | bytes → URL | `GET /api/sellers/:slug/photo` | `CreatorCard`, `CreatorHero` |
| Discipline | `discipline` | public profile | каталог авторов; **не** страница профиля |
| Country | `country` | public | **не** страница профиля |
| Bio | `shortDescription` | public | описание / практика |
| Telegram/IG/site | `telegramUrl` `instagramUrl` `websiteUrl` | public | публичные ссылки |
| Legacy link | `socialLink` | public schema | не иконка сайта |
| Handoff | `handoffContactType/Value` `handoffInitiator` | owner + order snapshot | не публично |
| Work counts | computed | `statusCounts` on detail | фильтр работ по статусу |
| Directory | | `GET /api/sellers` | `/authors` |
| Profile detail | | `GET /api/sellers/:slug/detail` | профиль; related works на product |

Apply: `POST /api/seller/profile`.  
Owner works: `GET /api/seller/products`.

---

## Discovery query

`GET /api/products` + `publicDiscoveryQuerySchema`:

`q`, `author` (slug), `status`, `category` (uuid), `materials[]`, `uniqueness`, `priceMin`/`priceMax`, `yearFrom`/`yearTo`, `sort`, `page`, `limit`.

Facets в ответе: `statusCounts`, `categories`, `authors`, `materials`, `uniquenesses`.

UI `/works` не шлёт `yearFrom`/`yearTo` и не листает `page`.

---

## Auth / roles

| Product | Field | Endpoint | UI |
|---|---|---|---|
| Register | `displayName`, `email`, `password`, optional `phone` | `POST /auth/register` | `RegisterForm` |
| Login | email, password | `POST /auth/login` | `LoginForm` |
| Me | `User` + `acceptedRulesVersion` | `GET /auth/me` | session |
| Rules | versioned text | `GET /auth/rules`, `POST /auth/rules/accept` | `EmailRulesDialog` |
| Email OTP | | `POST` otp request/verify | тот же диалог |
| Role | `User.role` `admin` \| `user` | token | admin vs rest |
| Seller status | `SellerProfile.status` | `GET /api/seller/profile` | `useSellerCapability` |

Bid gate: `apps/api/src/bids/bid-eligibility.ts` + UI `email-rules-eligibility.ts`.

---

## Orders / activity

| Product | Field | Endpoint | UI |
|---|---|---|---|
| My bids | `ActivityStatus` | `GET /me/activity` | `ActivityScreen` |
| Order | `Order.publicId` | `GET /api/orders/:publicId` | `OrderScreen` |
| Seller contacted | | `POST .../contacted` | seller actions |
| Completed | | `.../completed` | |
| Handoff failed | | `.../handoff-failed` | |

---

## Image limits

`apps/api/src/core/config/env.ts` + `apps/api/src/images/image-policy.ts`:

- max files default **8** (`LOT_IMAGE_MAX_FILES`)
- max file **5 MB**
- max total **40 MB**
- MIME: jpeg, png, webp, gif

Write order schema allows up to 10 ids — расходится с default 8.

---

## Seed (local/test only)

`packages/database/prisma/seed.js` — не production-контент.

Категория: slug `art-object`, name `Авторская керамика`.  
Флаг: `ALLOW_DESTRUCTIVE_DEMO_SEED=true`.
