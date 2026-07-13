# RFC: MVP аукционов

## 1. Цель

Собрать первый рабочий вертикальный срез `seller creates auction -> buyer places bid -> system closes auction -> seller gets winner contact`.

## 2. Критерий успеха MVP

Успешной считаем версию, в которой возможна первая завершённая сделка:

- продавец создал аукцион;
- покупатели поставили ставки;
- система корректно определила победителя;
- продавец получил контакт победителя;
- дальнейшее общение продолжилось вне платформы.

## 3. Что входит в MVP

- email/password auth;
- один пользователь может быть buyer и seller;
- минимальный seller profile;
- создание лота;
- создание timed auction;
- reserve price;
- публикация аукциона;
- список аукционов;
- публичная страница аукциона;
- история ставок;
- realtime-обновления;
- cron-завершение аукциона;
- seller public page;
- минимальная admin-панель;
- seed/demo data;
- документация и базовые тесты.

## 4. Что не входит в MVP

- buy now;
- drops;
- custom requests;
- proxy bids;
- offers;
- soft close;
- watchlist;
- notifications;
- chat;
- payments;
- shipping;
- analytics;
- recommendations;
- full moderation UI;
- AI moderation;
- native app store release.

## 5. Минимальная модель данных

### `User`

- `id`
- `email`
- `passwordHash`
- `phone`
- `displayName`
- `role`
- `createdAt`
- `updatedAt`

### `SellerProfile`

- `id`
- `userId`
- `slug`
- `sellerType`
- `storeName`
- `country`
- `contactPreference`
- `socialLink` nullable
- `shortDescription` nullable
- `status`
- `createdAt`
- `updatedAt`

### `Category`

- `id`
- `slug`
- `name`
- `description` nullable

### `Lot`

- `id`
- `sellerProfileId`
- `categoryId`
- `title`
- `description`
- `condition`
- `images`
- `status`
- `createdAt`
- `updatedAt`

### `Auction`

- `id`
- `lotId`
- `sellerProfileId`
- `slug`
- `startPrice`
- `reservePrice`
- `currentPrice`
- `currency`
- `bidStep`
- `startsAt`
- `endsAt`
- `status`
- `bidCount`
- `winnerBidId` nullable
- `buyNowPrice` nullable
- `createdAt`
- `updatedAt`

### `Bid`

- `id`
- `auctionId`
- `bidderUserId`
- `amount`
- `status`
- `createdAt`
- `updatedAt`

## 6. MVP статусы

### `UserRole`

- `admin`
- `user`

Seller capability определяется не ролью, а наличием `SellerProfile`.

### `SellerType`

- `creator`
- `influencer`

### `SellerStatus`

- `draft`
- `active`
- `restricted`
- `suspended`

### `LotStatus`

- `draft`
- `published`
- `sold`
- `hidden`
- `archived`

### `AuctionStatus`

- `draft`
- `scheduled`
- `active`
- `ended`
- `sold`
- `cancelled`
- `failed`
- `hidden`

### `BidStatus`

- `active`
- `winning`
- `outbid`
- `won`
- `lost`
- `cancelled`
- `invalid`

## 7. Бизнес-правила MVP

### Создание аукциона

- аукцион создаётся seller-ом;
- seller должен иметь `SellerProfile`;
- lot и auction создаются как отдельные сущности;
- `reservePrice` не может быть ниже `startPrice`;
- `endsAt` должен быть позже `startsAt`.

### Публикация

- seller может опубликовать только корректно заполненный аукцион;
- опубликованный аукцион становится `scheduled` или `active` в зависимости от времени старта.

### Ставка

- bidder не может ставить на собственный аукцион;
- ставка должна быть не меньше `currentPrice + effectiveBidStep`;
- effectiveBidStep определяется диапазоном текущей цены;
- ставка сохраняется транзакционно;
- текущая цена и счётчики обновляются атомарно;
- после ставки отправляется realtime event.

### Завершение аукциона

- cron закрывает истёкшие `active` аукционы;
- если reserve достигнут, выбирается победитель с максимальной валидной ставкой;
- если reserve не достигнут, аукцион получает `failed`;
- seller получает доступ к контакту победителя только если аукцион завершён успешно.

## 8. Таблица шагов ставок для MVP

- `0 - 25` -> `0.5`
- `25 - 100` -> `1`
- `100 - 500` -> `5`
- `500 - 1000` -> `10`
- `1000+` -> `25`

Это временный конфиг.

Future:

- вынести в конфигурацию по валютам;
- адаптировать под рынок.

## 9. Контактный флоу MVP

- пользователь обязан указать телефон;
- продавец получает контакт победителя после успешного завершения аукциона;
- по умолчанию контакты продавца победителю не показываются;
- связь и оплата происходят вне платформы;
- future: seller-controlled contact reveal;
- future: chat;
- future: handoff к следующему bidder.

## 10. Admin scope MVP

- просмотр списка пользователей;
- бан пользователя;
- просмотр списка аукционов;
- скрытие аукциона;
- просмотр ставок по аукциону.

## 11. Технические решения MVP

### API

- REST без `/v1`;
- базовый префикс `/api`;
- DTO и event payloads живут в `packages/contracts`.

### Auth

- email/password;
- `argon2` для хэширования;
- базовые роли без сложной ACL-модели.

### Realtime

- WebSocket;
- события `auction.updated`, `bid.placed`, `auction.ended`.

### Jobs

- простой cron внутри NestJS;
- интервал `15-30` секунд;
- идемпотентная логика закрытия аукционов.

### Storage

- локальное файловое хранилище для dev;
- `FileStorageService` abstraction;
- future S3 implementation.

### I18n

- закладываем структуру;
- контент MVP на русском.

## 12. Индексы MVP

Не индексируем всё заранее.

### Структурные constraints

- `users.email` unique
- `users.phone` unique
- `seller_profiles.slug` unique
- `auctions.slug` unique

### Явные рабочие индексы

- `auctions(status, ends_at)`
- `bids(auction_id, created_at)`

## 13. Тестирование

### Unit

- расчёт допустимого шага ставки;
- валидация минимально допустимой ставки;
- запрет self-bidding;
- логика определения победителя;
- логика завершения аукциона без победителя при недостижении reserve.

### Integration

- `register/login`;
- `create seller profile`;
- `create auction`;
- `publish auction`;
- `place bid`;
- `close auction by cron`.

## 14. Что переносим из старой схемы `art-market`

Используем как вдохновение:

- разделение `auction`, `bid`, `orders`, `payment`;
- статусы `won/lost/cancelled`;
- `condition` у лота;
- future wallet/balance idea;
- future expiration logic.

Не переносим в первую реализацию:

- wallet;
- hold balance;
- платёжные резервы;
- адреса и персональные поля, не нужные для MVP.

## 15. Осознанно отложенные решения

- queue/worker infrastructure;
- multi-currency rules;
- payment provider choice;
- shipping provider choice;
- anti-fraud heuristics по устройствам и IP;
- AI moderation;
- unified UI layer для web/mobile.
- offset pagination для list/history endpoints оставляем на MVP, cursor pagination добавим позже;
- public/private DTO пока могут содержать внутренние IDs, но при ужесточении privacy policy вынесем отдельные public shapes без `userId`/`bidderUserId`.
