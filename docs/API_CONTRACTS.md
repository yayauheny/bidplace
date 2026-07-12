# API контракты

Документ фиксирует целевой MVP surface и не является финальной OpenAPI-спецификацией.

## Общие правила

- Базовый префикс: `/api`
- Формат: JSON
- Auth: email/password, session или token-слой будет уточнён на этапе реализации auth
- Контракты описываются в `packages/contracts`
- DTO валидируются через Zod

## MVP REST surface

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Public sellers

- `GET /api/sellers/:slug`
- `GET /api/sellers/:slug/auctions`

### Public auctions

- `GET /api/auctions`
- `GET /api/auctions/:slug`
- `GET /api/auctions/:slug/bids`

### Seller auction management

- `POST /api/seller/profile`
- `PATCH /api/seller/profile`
- `POST /api/auctions`
- `GET /api/my/auctions`
- `GET /api/my/auctions/:id`
- `POST /api/my/auctions/:id/publish`
- `POST /api/my/auctions/:id/cancel`

### Bids

- `POST /api/auctions/:id/bids`

### Admin MVP

- `GET /api/admin/users`
- `POST /api/admin/users/:id/ban`
- `GET /api/admin/auctions`
- `GET /api/admin/auctions/:id/bids`
- `POST /api/admin/auctions/:id/hide`

## MVP WebSocket events

Подключение:

- `WS /api/ws`

События:

- `auction.updated`
- `bid.placed`
- `auction.ended`

### `auction.updated`

Используется для обновления:

- текущей цены;
- количества ставок;
- статуса аукциона;
- таймера;
- признака достижения reserve.

### `bid.placed`

Используется для:

- мгновенного обновления истории ставок;
- синхронизации новой текущей цены;
- обновления количества участников.

### `auction.ended`

Используется для:

- финального статуса;
- winner summary;
- отметки, что reserve достигнут или не достигнут.

## Что не входит в MVP surface

- payments API;
- shipping API;
- watchlist API;
- notifications API;
- reports/disputes UI surface;
- proxy bidding;
- offers;
- buy now;
- drops;
- chat.
