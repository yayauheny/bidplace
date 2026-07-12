# Future roadmap

## 1. Принцип планирования

Roadmap делится:

- по целевым ролям;
- по важности;
- по этапам внедрения.

### Обозначения

- `P0` — критично для core value и запуска
- `P1` — усиливает продукт сразу после MVP
- `P2` — важное стратегическое расширение
- `P3` — дальнее направление, не мешающее текущему фокусу

## 2. Buyer roadmap

### P0

- timed auction participation
- realtime price updates
- bid history
- seller page
- contact handoff after win

### P1

- buy now
- статус победы/проигрыша
- прозрачный fee breakdown
- future contact preferences

### P2

- watchlist
- favorites
- in-app notifications
- text chat
- safer post-auction workflow

### P3

- payments
- shipping tracking
- recommendations
- category discovery
- cross-border purchase flow

## 3. Seller roadmap

### P0

- seller profile
- create lot
- create timed auction
- publish and share link
- winner contact handoff

### P1

- buy now
- relist failed auctions
- richer seller page
- moderation statuses
- seller settings

### P2

- drops
- custom requests
- templates and listing helpers
- analytics
- payout balance
- post-sale workflow

### P3

- shipping tools
- integrated payments
- share assets
- advanced storefront
- multi-currency pricing

## 4. Marketplace / platform roadmap

### P0

- creator-first positioning
- minimal admin
- minimal moderation foundation
- anti-resale rules
- reliable auction closure

### P1

- search
- categories
- search filters
- fee engine
- moderation queue
- report flow

### P2

- recommendation system
- curated collections
- creator verification
- influencer/celebrity tab
- dispute resolution

### P3

- international expansion
- payments and payouts
- shipping integrations
- analytics platform
- mobile-first surfaces

## 5. Feature roadmap по направлениям

### Аукционы

- `P0` timed auctions
- `P1` buy now
- `P2` reserve UX improvements
- `P2` soft close
- `P2` proxy bidding
- `P2` offers
- `P3` sealed bid
- `P3` dutch auction

### Лоты и storefront

- `P0` public auction page
- `P0` minimal seller page
- `P1` richer seller profile
- `P2` custom storefront blocks
- `P2` curated featured shelves

### Trust & safety

- `P0` self-bid prevention
- `P0` admin hide/ban
- `P1` reports
- `P1` moderation queue
- `P2` AI pre-screening
- `P2` verification layers
- `P2` dispute handling
- `P3` reputation system

### Деньги

- `P0` fee model in data model
- `P1` clear fee presentation
- `P2` order/payment entities
- `P2` seller balance
- `P3` payouts
- `P3` tax logic

### Доставка

- `P2` order handoff model
- `P3` addresses
- `P3` shipment tracking
- `P3` shipping integrations

### Social / communication

- `P0` shareable links
- `P2` text chat
- `P2` follows/favorites
- `P3` seller updates
- `P3` light social layer

## 6. Этапы после MVP

### Stage 1

- стабильный timed auction MVP
- reserve price
- seller page
- admin actions

### Stage 2

- buy now
- richer seller profile
- categories UX
- базовый report flow

### Stage 3

- drops
- custom requests
- search
- filters

### Stage 4

- notifications
- chat
- analytics
- recommendation groundwork

### Stage 5

- orders
- payments
- seller balance
- payout flow

### Stage 6

- shipping
- disputes
- verification
- moderation pipeline

### Stage 7

- proxy bids
- offers
- soft close
- relist/reopen logic

### Stage 8

- influencer/celebrity discovery
- curated collections
- global growth groundwork

## 7. Что обязательно помнить при расширении модели

- seller types уже заложены
- reserve price уже заложен
- buy now price уже заложен
- future fees нужны как отдельные поля
- future report/dispute relations нужны
- future order/payment/payout entities не должны ломать MVP auction model
- future chat не должен требовать переделки user/seller identity
- future multi-currency должна опираться на конфиг шагов ставок
- future relist flow должен работать с `failed` auctions
