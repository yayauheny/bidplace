# Продажи на bidplace — механика, данные, гонки

Единственный владелец правил продаж для волн W1–W7. Решения основателя —
`DEC-149` (в [12-DECISION-LOG.md](../product/12-DECISION-LOG.md)); здесь — как они
устроены. Если код или макет расходится с этим файлом — прав этот файл, а
расхождение записывается в отчёт волны.

## 1. Принципы

- bidplace — технологический посредник. Деньги и доставку не трогает: оплату и
  передачу автор и покупатель согласуют напрямую. Мы фиксируем договорённость,
  открываем контакты и храним историю.
- Не азартная игра: участие бесплатное, случайности нет, ставка — предложение
  купить по указанной цене. Слова «розыгрыш», «лотерея», «приз», «выигрыш» в
  интерфейсе и письмах запрещены. Вместо «Вы выиграли» — «Ваша ставка лучшая —
  работа ваша».
- Как конструктор: работа существует сама по себе; лот — временное предложение
  её продать. Лот можно снять и выставить заново, но не менять на ходу.
- Меньше статусов: всё, что можно вычислить из времени и связей, вычисляется.
- Сервер — единственный источник цены, времени и статуса. Клиент только показывает.

## 2. Сущности

| Сущность | Что это | Таблица |
| --- | --- | --- |
| Работа | Одобренная работа автора (портфолио). Без лота — просто в портфолио | `products` |
| Лот | Предложение продать работу: фиксированная цена или аукцион | `listings` (+ `auction_rules`) |
| Ставка | Неотменяемое предложение купить по сумме | `bids` |
| Заказ | Договорённость конкретного покупателя с автором о конкретной работе | `orders` |
| Жалоба | Обращение к администрации; на запуске — только по заказу | `reports` |
| Настройки уведомлений | Необязательные письма пользователя | `user_notification_settings` |
| Письмо в очереди | Обязательное или включённое письмо, отправляется тиком | `notification_outbox` |
| Избранное | Работы, отмеченные пользователем | `favorite_works` |

Пользовательских страниц «лот» нет: лот — блок на странице работы.

## 3. Лот

### 3.1 Создание

Только автор, только для своей работы, если одновременно:

- автор `APPROVED`, пользователь `active`, почта подтверждена;
- работа `APPROVED` (не скрыта), есть опубликованная ревизия;
- нет другого лота `SCHEDULED`/`LIVE` и нет открытого заказа (`OFFERED`/`ACTIVE`) по работе;
- нет завершённого заказа (`COMPLETED`) по работе — проданная работа не продаётся повторно.

Модерации лота нет: модерацию прошли работа и автор. Админ может снять лот.

Поля:

| Поле | Фиксированная цена | Аукцион |
| --- | --- | --- |
| `currency` | `BYN` или `RUB` | `BYN` или `RUB` |
| `priceMinor` | цена, > 0 | — |
| `startPriceMinor` | — | стартовая цена, > 0, кратна шагу |
| `startsAt` | сейчас | сейчас или позже, не дальше 30 дней |
| `endsAt` | нет (до покупки или снятия) | `startsAt` + от 1 до 14 дней |

Деньги — целые копейки (`Int`, минимальные единицы), без конвертации валют.
Верхний предел суммы — 100 000 000 минимальных единиц (1 000 000 BYN/RUB).

### 3.2 Статусы лота

| Статус | Значение | Как попадает |
| --- | --- | --- |
| `SCHEDULED` | Аукцион ждёт начала | создан с `startsAt` в будущем |
| `LIVE` | Идёт продажа | создан сразу или наступил `startsAt` |
| `ENDED` | Продажа закончилась (куплен, аукцион завершён со ставками или без) | покупка, тик по `endsAt` |
| `CANCELLED` | Снят автором (до первой ставки) или админом | действие |

Время главнее записанного статуса. Функция домена
`effectiveListingState(listing, now)` возвращает фактическое состояние:
`SCHEDULED` с `startsAt <= now` — это `LIVE`; `LIVE` с `endsAt <= now` — это
«завершён, итоги подводятся». Чтения используют её; запись статуса делает тик
(W2) и действия. Поэтому неважно, спал ли контейнер.

Публичная метка на работе — из лота и заказа:

| Ситуация | Метка |
| --- | --- |
| Лот `LIVE`, фиксированная цена | «Купить за N» |
| Лот `LIVE`, аукцион | текущая цена, ставок, осталось времени |
| Лот `SCHEDULED` | «Аукцион начнётся DD.MM в HH:MM» |
| Открытый заказ (`OFFERED`/`ACTIVE`) | «Забронировано» |
| Заказ `COMPLETED` | «Продано» |
| Нет лота / снят / заказ не состоялся | ничего (портфолио) |

### 3.3 Снятие и изменения

- Лот не редактируется. Изменить цену или сроки = снять и создать новый.
- Фиксированная цена: автор снимает в любой момент до покупки.
- Аукцион: автор снимает только пока нет ставок. После первой ставки — только админ.
- Админ снимает любой лот (`CANCELLED`, `cancelReason = ADMIN_REMOVED`); заказ
  при этом не создаётся, участники получают письмо «аукцион остановлен».
- Пока есть лот или открытый заказ, работу нельзя скрыть, изменить, удалить
  (`PRODUCT_IN_SALE`, хелпер `assertProductNotInSale` из W1).

## 4. Аукцион

### 4.1 Ставка

Условия (проверяются в одной транзакции, время — `now()` базы):

- пользователь `active`, почта подтверждена, не автор работы, не админ, не заблокирован
  для покупок (§7), у него < 3 активных заказов;
- лот фактически `LIVE` (`startsAt <= now < endsAt`);
- пользователь не лидер сейчас (поднимать свою же ставку нельзя — `BID_ALREADY_LEADING`);
- сумма ≥ минимальной: без ставок — `startPriceMinor`, иначе текущая цена + шаг;
- сумма ≤ верхнего предела и кратна минимальной единице шага.

Шаг зависит от текущей цены и валюты. Таблица — одна, в `packages/contracts`:

| BYN, текущая цена до | шаг | RUB, текущая цена до | шаг |
| --- | --- | --- | --- |
| 25 | 0,50 | 500 | 10 |
| 100 | 1 | 2 500 | 25 |
| 500 | 5 | 10 000 | 100 |
| 1 000 | 10 | 25 000 | 250 |
| выше | 25 | выше | 500 |

BYN — из `archive/commerce-v1` (`DEC-039`). RUB — пропорционально, предложение
к подтверждению основателем (§12).

Ставку можно сделать больше минимальной. Если сумма больше минимальной более
чем вдвое, интерфейс просит подтвердить («Вы ставите 500 BYN, минимальная — 120 BYN»).

### 4.2 Продление в конце

Если ставка пришла, когда до `endsAt` осталось ≤ 60 с, `endsAt` становится
`now + 60 с`, но не позже `originalEndsAt + 600 с`. Числа хранятся в
`auction_rules`, логика — одна чистая функция `resolveSoftCloseEndsAt` (есть в
архиве, перенести с тестами).

### 4.3 Идемпотентность

Клиент шлёт `idempotencyKey` (тот же regex, что в W0). Уникальность —
`(listing_id, bidder_user_id, idempotency_key)`. Повтор с тем же ключом и той же
суммой возвращает исходную ставку; с другой суммой — `IDEMPOTENCY_KEY_REUSED`.

### 4.4 Завершение

Тик (W2) вызывает `closeEndedListings(now)`: для каждого лота `LIVE` с
`endsAt <= now` в отдельной транзакции `closeListing(tx, listingId)`:

1. блокировка строки работы, условный переход `LIVE → ENDED` (`count === 1`, иначе уже закрыт — выйти);
2. есть ставки → заказ `ACTIVE` для лучшей ставки (`source = AUCTION_WIN`);
3. письма в очередь: покупателю «Ваша ставка лучшая», автору «Аукцион завершён»
   (или «без ставок»).

Ставка после `endsAt` отклоняется (`LISTING_NOT_OPEN`) даже если тик ещё не
прошёл. Победитель видит заказ после ближайшего тика (≤ 1 мин); до этого
страница показывает «Аукцион завершён, подводим итоги».

### 4.5 Следующему участнику

Если заказ по аукциону `FAILED` по вине покупателя или покупатель отказался,
автор видит кнопку «Предложить следующему». Нажатие создаёт заказ `OFFERED`
(`source = SECOND_CHANCE`) для следующего участника по его лучшей ставке:

- кандидаты — разные участники лота по убыванию их максимальной ставки, кроме
  тех, кому уже предлагали, и заблокированных для покупок;
- всего не больше двух предложений на лот (2-й и 3-й участник);
- предложение действует 48 ч: «Принять» → `ACTIVE`; «Отказаться» или истекло →
  `FAILED` (`OFFER_DECLINED` / `OFFER_EXPIRED`, без вины);
- принять нельзя при 3 активных заказах или блокировке.

Кнопка — решение автора, не автоматика: автор мог уже договориться иначе.
Если кандидатов нет или автор не хочет — он выставляет новый лот.

## 5. Фиксированная цена

«Купить» → подтверждение («Вы бронируете работу за N. Оплату и передачу вы
согласуете с автором напрямую») → в одной транзакции:

1. блокировка строки работы; лот фактически `LIVE`, условия покупателя как у ставки;
2. заказ `ACTIVE` (`source = FIXED_PURCHASE`, сумма = `priceMinor`);
3. лот `LIVE → ENDED` условно;
4. письма в очередь обоим.

Две одновременные покупки: вторая получает `LISTING_NOT_OPEN` (блокировка
строки + частичный уникальный индекс «один открытый заказ на работу»).

## 6. Заказ

### 6.1 Статусы

| Статус | Значение | Метка в интерфейсе |
| --- | --- | --- |
| `OFFERED` | Предложение следующему участнику ждёт ответа (48 ч) | «Предложено» |
| `ACTIVE` | Покупатель определён, стороны связываются | «Ждёт связи» |
| `COMPLETED` | Сделка состоялась (подтвердил автор или прошло 14 дней) | «Состоялась» |
| `FAILED` | Не состоялась, с причиной | «Не состоялась: <причина>» |

Переходы — одна таблица в модуле заказа:

| Из | В | Кто | Условие |
| --- | --- | --- | --- |
| `OFFERED` | `ACTIVE` | покупатель | до `offerExpiresAt`, < 3 активных, не заблокирован |
| `OFFERED` | `FAILED` (`OFFER_DECLINED`) | покупатель | — |
| `OFFERED` | `FAILED` (`OFFER_EXPIRED`) | система | `offerExpiresAt <= now` |
| `ACTIVE` | `COMPLETED` | автор | — |
| `ACTIVE` | `COMPLETED` (`completedBy = SYSTEM`) | система | `autoCompleteAt <= now`, нет открытой жалобы |
| `ACTIVE` | `FAILED` (`BUYER_REFUSED`) | автор или покупатель | — |
| `ACTIVE` | `FAILED` (`BUYER_NO_CONTACT`) | автор | `noContactAllowedAt <= now` (48 ч после активации) |
| `ACTIVE` | `FAILED` (`SELLER_REFUSED`) | автор | — |
| `ACTIVE` | `COMPLETED` / `FAILED` (любая причина) | админ | разбор жалобы |

`FAILED` и `COMPLETED` — конечные. Админ может только поменять «чья вина» у
`FAILED` (снять страйк, §7). Заказы не удаляются никогда — ни автором, ни
покупателем (защита от фиктивных покупок, скрывающих работу).

Вина по причине: `BUYER_REFUSED`, `BUYER_NO_CONTACT` → покупатель;
`SELLER_REFUSED` → автор; `OFFER_*`, `ADMIN_CANCELLED` → нет. Хранится в
`faultSide`, чтобы админ мог исправить.

### 6.2 Что видно в заказе

| Поле | Кто видит |
| --- | --- |
| Номер заказа (`publicId`, напр. `BP-7K3M9Q`) | оба, админ |
| Код сделки (6 цифр) — назвать друг другу при связи | оба, админ |
| Работа: название, обложка, автор (снимок на момент заказа) | оба, админ |
| Сумма и валюта, способ (аукцион / фикс / следующему) | оба, админ |
| Контакты второй стороны: подтверждённая почта + Telegram / Instagram / телефон из профиля, если заполнены | вторая сторона (пока заказ не `FAILED`), админ |
| Комментарий покупателя (≤ 500, при покупке/принятии) | оба, админ |
| Заметка автора (≤ 1000) | только автор, админ |
| Сроки: когда можно отметить «не выходит на связь», когда автозакрытие | оба |
| Подсказка: «bidplace не принимает оплату. Не переводите деньги, пока не договорились с автором» | покупатель |
| Кнопки по таблице 6.1, «Пожаловаться», «Поддержка», «Чек» | по ролям |

Контакты берутся из профиля в момент чтения (не снимок): исправленный телефон
сразу виден второй стороне. После `FAILED` контакты скрываются.

Чек — изображение/PDF из данных заказа, рисуется на клиенте (W5, [SHARE-EXPORT.md](SHARE-EXPORT.md)).
Отдельного серверного документа нет.

### 6.3 Автозакрытие

`ACTIVE` заказ без действий 14 дней и без открытой жалобы становится
`COMPLETED` (`completedBy = SYSTEM`) по тику. Перед этим, за 2 дня, автор
получает письмо «Отметьте, состоялась ли сделка» (обязательное).

## 7. Защита от срыва и обмана

| Правило | Как |
| --- | --- |
| Не больше 3 активных заказов у покупателя | ставка, покупка и принятие отклоняются (`BUYER_ORDER_LIMIT`); победа в аукционе всё равно создаёт заказ |
| Страйк покупателя | каждый `FAILED` с `faultSide = BUYER` и `strikeVoidedAt = null` |
| Блокировка покупок | ≥ 2 страйка → ставки, покупки, принятие запрещены (`BUYER_BLOCKED`) до решения админа (снять страйк) |
| Страйк автора | жалоба по заказу признана (`UPHELD`) с виной автора. На запуске — только сигнал для админа; блокировка автора — существующим `SUSPENDED` вручную |
| Нельзя покупать у себя | автор не ставит и не покупает свою работу |
| Частота | ставки — `RateLimit` `user-resource`, 10 в минуту на лот |
| Удаление | заказы, ставки и жалобы не удаляются; удаление аккаунта (`DEC-123`) обезличивает, но не стирает их |

Отдельной таблицы блокировок нет: блокировка вычисляется из заказов.

`getTrustSignals(userId)` — одна функция, только реальные факты, без
рейтингов-заглушек:

```ts
type TrustSignals = {
  completedAsSeller: number; completedAsBuyer: number
  buyerStrikes: number; sellerFaultFailures: number
  upheldReportsAgainst: number; memberSince: Date; emailVerified: boolean
}
```

На запуске показывается админу (заказ, жалоба, пользователь) и автору в карточке
заказа («3 состоявшиеся покупки»). Публичный рейтинг и отзывы — после запуска,
поверх этих же фактов.

## 8. Жалобы и поддержка

Таблица `reports` общая на будущее, интерфейс запуска — только по заказу.

| Поле | Значение |
| --- | --- |
| `targetType` | `ORDER` (запуск), `WORK`, `AUTHOR`, `USER` (позже) |
| `targetId` | id цели |
| `reporterUserId` | автор жалобы |
| `reason` | для заказа: `NO_CONTACT`, `TERMS_CHANGED`, `NOT_AS_DESCRIBED`, `NOT_HANDED_OVER`, `FRAUD`, `OTHER` |
| `text` | ≤ 1000 |
| `status` | `OPEN`, `UPHELD`, `REJECTED` |
| `faultSide` | при `UPHELD`: `BUYER` / `SELLER` / `NONE` |
| `adminNote`, `resolvedAt`, `resolvedById` | разбор |

- Пожаловаться может участник заказа в `ACTIVE`, `COMPLETED` (30 дней) и `FAILED` (30 дней).
- Одна открытая жалоба от участника на заказ (частичный уникальный индекс).
- Открытая жалоба останавливает автозакрытие.
- Вторая сторона получает письмо «По вашему заказу открыта жалоба» (без текста жалобы).
- Админ: список открытых, разбор → статус, вина, при необходимости смена
  статуса заказа или снятие страйка.
- «Открыть спор» и «Поддержка» ведут в Telegram поддержки. Ссылка — одна
  настройка окружения (`SUPPORT_TELEGRAM_URL`), показывается в настройках и в заказе.

## 9. Уведомления

Писем мало и только по делу. Обязательные (выключить нельзя, нужны юридически
и для сделки):

| Событие | Кому |
| --- | --- |
| Ваша ставка лучшая / вы забронировали работу | покупатель |
| Работа забронирована / аукцион завершён (со ставками или без) | автор |
| Вам предлагают работу (следующий участник) | покупатель |
| Отметьте, состоялась ли сделка (за 2 дня до автозакрытия) | автор |
| По вашему заказу открыта жалоба | вторая сторона |
| Аукцион остановлен администрацией | автор, участники |

Необязательное: «Вашу ставку перебили» — включено по умолчанию, выключается в
настройках (`user_notification_settings.outbid_email`). Новые необязательные
виды — новые колонки этой таблицы.

Доставка надёжная и простая: событие кладёт строку в `notification_outbox` в
той же транзакции; тик отправляет до 20 писем за запуск через существующий
`MailTransport`, с ретраями (потолок 10). Письмо — тема и текст, как сейчас.

В приложении: точка на колокольчике и список «Требует внимания»
(`GET /api/me/attention`), вычисляемый из данных: предложения мне, мои `ACTIVE`
заказы без отметки, заказы с открытой жалобой, кнопка «Предложить следующему».
Истории уведомлений нет. Пуши — с нативными приложениями.

## 10. Схема базы (W3)

Прод пуст: одна миграция пересоздаёт таблицы продаж. Поля — минимально
необходимые; новые виды — значения enum, не новые таблицы.

```prisma
enum ListingType   { FIXED AUCTION }
enum ListingStatus { SCHEDULED LIVE ENDED CANCELLED }
enum ListingCancelReason { AUTHOR_WITHDREW ADMIN_REMOVED }
enum OrderSource   { AUCTION_WIN SECOND_CHANCE FIXED_PURCHASE }
enum OrderStatus   { OFFERED ACTIVE COMPLETED FAILED }
enum OrderFailReason { BUYER_REFUSED BUYER_NO_CONTACT SELLER_REFUSED OFFER_DECLINED OFFER_EXPIRED ADMIN_CANCELLED }
enum FaultSide     { BUYER SELLER NONE }
enum CompletedBy   { SELLER SYSTEM ADMIN }
enum ReportTarget  { ORDER WORK AUTHOR USER }
enum ReportStatus  { OPEN UPHELD REJECTED }

model Listing {
  id, productId, sellerUserId
  type ListingType; status ListingStatus; currency Char(3)   // BYN | RUB
  priceMinor Int?                     // FIXED
  startsAt DateTime; endsAt DateTime?; originalEndsAt DateTime?   // AUCTION
  currentPriceMinor Int?; bidCount Int @default(0)                // AUCTION, денормализация под блокировкой
  cancelReason ListingCancelReason?; endedAt DateTime?; cancelledAt DateTime?
  createdAt
  @@index([status, startsAt]) @@index([status, endsAt]) @@index([productId])
}
model AuctionRules { listingId @id; startPriceMinor Int; stepTableCode VarChar(20) // BYN_V1 | RUB_V1
  softCloseWindowSeconds Int @default(60); softCloseExtensionSeconds Int @default(60); softCloseMaxTotalSeconds Int @default(600) }
model Bid { id, listingId, bidderUserId, amountMinor Int, idempotencyKey VarChar(100), createdAt
  @@unique([listingId, bidderUserId, idempotencyKey]) @@index([listingId, amountMinor]) }
model Order {
  id; publicId VarChar(16) @unique; dealCode Char(6)
  productId; listingId; sellerUserId; buyerUserId
  source OrderSource; sourceBidId? @unique   // null для FIXED_PURCHASE
  amountMinor Int; currency Char(3)
  status OrderStatus; failReason OrderFailReason?; faultSide FaultSide?; strikeVoidedAt DateTime?
  completedBy CompletedBy?
  offerExpiresAt DateTime?; activatedAt DateTime?; noContactAllowedAt DateTime?; autoCompleteAt DateTime?
  completedAt DateTime?; failedAt DateTime?
  buyerComment VarChar(500)?; sellerNote VarChar(1000)?
  workTitleSnapshot VarChar(...); workPublicIdSnapshot; coverImageIdSnapshot?; sellerNameSnapshot
  createdAt; updatedAt
  @@index([buyerUserId, status]) @@index([sellerUserId, status]) @@index([status, autoCompleteAt]) @@index([status, offerExpiresAt])
}
model Report { id; targetType ReportTarget; targetId Uuid; reporterUserId; reason VarChar(40); text VarChar(1000)?
  status ReportStatus @default(OPEN); faultSide FaultSide?; adminNote VarChar(2000)?; resolvedAt?; resolvedById?; createdAt
  @@index([status, createdAt]) @@index([targetType, targetId]) }
model UserNotificationSettings { userId @id; outbidEmail Boolean @default(true); updatedAt }
model NotificationOutbox { id; userId; kind VarChar(40); payload Json; status (PENDING|SENT|FAILED); attemptCount Int; nextAttemptAt; sentAt?; createdAt
  @@index([status, nextAttemptAt]) }
model FavoriteWork { userId; productId; createdAt  @@id([userId, productId]) @@index([productId]) }
```

Частичные индексы (raw SQL в миграции, как сейчас):

```sql
CREATE UNIQUE INDEX one_active_listing_per_product ON listings(product_id) WHERE status IN ('SCHEDULED','LIVE');
CREATE UNIQUE INDEX one_open_order_per_product     ON orders(product_id)   WHERE status IN ('OFFERED','ACTIVE');
CREATE UNIQUE INDEX one_completed_order_per_product ON orders(product_id)  WHERE status = 'COMPLETED';
CREATE UNIQUE INDEX one_open_report_per_reporter   ON reports(reporter_user_id, target_type, target_id) WHERE status = 'OPEN';
```

Контакты пользователя: в `users` добавить `contactTelegram`, `contactInstagram`,
`contactPhone` (необязательные, без SMS, без уникальности; формат — схемы в
`packages/contracts`). Существующий `users.phone` не трогать. Поля
`seller_profiles.handoff_*` и снимки `orders.seller_handoff_*`,
`buyer_email_at_close`, `handoff_initiator` удаляются вместе с enum
`HandoffContactType`, `HandoffInitiator` (проверить потребителей).

## 11. Гонки и защита

Общее правило: любое действие продаж — одна транзакция `ReadCommitted`, первым
шагом `lockProductRowForUpdate(productId)`; все записи статусов условные
(`updateMany where status in (...)` + `count === 1`); время — `now()` базы.
Блокировка строки работы сериализует всё по одной работе, не мешая другим.

| Сценарий | Что защищает | Тест (W3/W7) |
| --- | --- | --- |
| 50 ставок одновременно на один лот | блокировка работы; каждая видит актуальную цену; лишние — `BID_TOO_LOW` | интеграция: 50 параллельных, итог — цена = максимум, `bidCount` = числу принятых, ни одной потерянной |
| Ставка в последнюю секунду и тик закрытия | обе берут блокировку; кто второй — видит новый `endsAt` или `ENDED` | интеграция с двумя транзакциями |
| Два покупателя «Купить» | блокировка + `one_open_order_per_product` | второй — `LISTING_NOT_OPEN` |
| Автор снимает лот, а покупатель покупает | блокировка, условный переход | ровно одно действие проходит |
| Автор снимает аукцион, а приходит первая ставка | проверка `bidCount = 0` под блокировкой | ровно одно |
| Повтор ставки после обрыва сети | idempotency-ключ | один ряд, тот же ответ |
| Два тика одновременно | условный `LIVE → ENDED`, уникальность `sourceBidId` | один заказ |
| Принятие предложения в момент истечения | сравнение с `now()` базы под блокировкой | ровно одно |
| Автор скрывает работу во время продажи | `assertProductNotInSale` (W1) | `PRODUCT_IN_SALE` |
| Лидер блокирован админом | блокировка покупок проверяется на ставке/покупке/принятии; уже выигранный заказ разбирает админ | — |
| Пользователь видит чужой заказ | все чтения заказа — `where buyerUserId = me OR sellerUserId = me` (или админ); 404, не 403 | интеграция по ролям |
| Утечка контактов | контакты только в ответе заказа участнику; в публичных ответах и логах их нет | проверка контрактов |

## 12. API (контракты в `packages/contracts`, клиент в `packages/api-client`)

| Метод | Кто | Что |
| --- | --- | --- |
| `POST /api/works/:productId/listings` | автор | создать лот |
| `POST /api/listings/:id/cancel` | автор | снять |
| `GET /api/works/:publicId/lot` | все | лот работы: тип, фактический статус, цена, мин. ставка, ставок, сроки, метка, `serverNow`; для вошедшего — блок `viewer` (`role`, `isLeading`, `blockedReason`). `Cache-Control: no-store`. Ответ самой работы (кэш на краю 30 с) лот не содержит |
| `GET /api/listings/:id/bids` | все | последние 20 ставок: сумма, время, «Участник N» (без имён) |
| `POST /api/listings/:id/bids` | покупатель | `{ amountMinor, idempotencyKey }` |
| `POST /api/listings/:id/purchase` | покупатель | `{ idempotencyKey, comment? }` |
| `GET /api/me/orders?role=buyer\|seller&state=open\|closed` | участник | список |
| `GET /api/orders/:publicId` | участник, админ | карточка |
| `POST /api/orders/:publicId/accept` · `/decline` | покупатель | ответ на предложение |
| `POST /api/orders/:publicId/complete` | автор | состоялась |
| `POST /api/orders/:publicId/fail` | автор, покупатель | `{ reason }` по таблице 6.1 |
| `PUT /api/orders/:publicId/note` | автор | заметка |
| `POST /api/orders/:publicId/offer-next` | автор | следующему участнику |
| `POST /api/orders/:publicId/reports` | участник | жалоба |
| `GET /api/me/attention` | пользователь | список «требует внимания» |
| `GET/PUT /api/me/notification-settings`, `PUT /api/me/contacts` | пользователь | настройки |
| `PUT/DELETE /api/works/:productId/favorite`, `GET /api/me/favorites` | пользователь | избранное |
| `GET /api/admin/reports`, `POST /api/admin/reports/:id/resolve` | админ | жалобы |
| `POST /api/admin/listings/:id/remove`, `POST /api/admin/orders/:publicId/void-strike` | админ | вмешательство |
| `POST /api/internal/tick` | Worker Cron (W2) | закрытие, автозакрытие, истечение предложений, письма, медиа |

Коды ошибок (`ApiErrorCode`, через `AppException`). Уже есть в
`packages/contracts/src/error.ts`, переиспользовать: `LISTING_NOT_FOUND`,
`LISTING_NOT_OPEN` (лот не идёт: не начался, закончился, куплен, снят),
`LISTING_CHANGED`, `BID_TOO_LOW`, `SELF_BID_FORBIDDEN` (ставка и покупка своей
работы), `ADMIN_BID_FORBIDDEN` (админ не участвует в торгах). Новые:
`BID_ALREADY_LEADING`, `BID_AMOUNT_INVALID`, `BUYER_ORDER_LIMIT`, `BUYER_BLOCKED`,
`IDEMPOTENCY_KEY_REUSED`, `ORDER_TRANSITION_NOT_ALLOWED`, `PRODUCT_IN_SALE` (W1),
`PRODUCT_ALREADY_SOLD`, `NO_NEXT_BIDDER`. Каждому — текст в клиенте (W4).

Обновление без realtime: страница работы с лотом `LIVE` опрашивает `GET /api/works/:publicId/lot`
раз в 10 с, пока вкладка видна; последние 2 минуты аукциона — раз в 3 с. Заказы и
«требует внимания» — при фокусе и раз в 60 с.

## 13. Чем вдохновлялись (hendis.ru)

Hendis — CRM мастера с витриной, денег не касается, аукционов нет. Берём:
статус наличия и «скрыть после продажи» (наша метка «Продано»), одну карточку
заказа с заметками и сроками, комментарий покупателя, контакты только после
заказа, ссылку на работу. Не берём: открытую регистрацию (у них в ленте курсы
и растения), публичные телефоны на витрине, «платформа не отвечает за споры»
(у нас жалоба по заказу), склад и производство как продукт, неформальные
«брони на 24 часа». Позже стоит взять: «на заказ» со сроком изготовления,
поле трек-номера, калькулятор себестоимости.

## 14. Вопросы основателю (работа идёт с указанным вариантом)

| # | Вопрос | Вариант по умолчанию |
| --- | --- | --- |
| C1 | Таблица шагов RUB | как в §4.1 |
| C2 | Проданную работу нельзя выставить снова (одна работа — один экземпляр) | да, `PRODUCT_ALREADY_SOLD` |
| C3 | Отказ покупателя сразу после покупки — тоже страйк | да (ставка и бронь неотменяемы) |
| C4 | Лидер не может поднять свою ставку | да |
| C5 | Контакты скрываются после «не состоялась» | да |
| C6 | Жалоба возможна 30 дней после закрытия заказа | да |
