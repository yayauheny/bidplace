# bidplace MVP RFC

Версия: 1.5
Последнее обновление: 2026-09-06
Статус: Confirmed
Связанные решения: `DEC-003` — `DEC-011`, `DEC-016` — `DEC-020`, `DEC-023`, `DEC-039`, `DEC-042` — `DEC-054`, `DEC-070` — `DEC-077`

## 1. Цель MVP

Проверить полный сценарий:

> Реальный creator публикует реальную уникальную физическую работу, приводит аудиторию, получает конкурентные ставки, завершает продажу победителю и передаёт предмет.

MVP проверяет:

- понятность аукциона;
- способность автора привести покупателей;
- способность карточки объяснить ценность;
- техническую корректность торгов;
- готовность победителя оплатить;
- готовность автора повторить.

MVP не проверяет полноценный marketplace.

## 2. Первая гипотеза

> Creator с небольшой активной аудиторией способен через хорошо оформленный scheduled auction получить минимум две реальные ставки от разных людей и завершить продажу без встроенных платежей.

## 3. Первый запуск

- оператор — ИП Беларуси;
- актуальный legal launch gate и публичные документы проверяются по
  законодательству Беларуси (`DEC-077`);
- русский язык интерфейса;
- валюта MVP пока `BYN`; показ других валют или подсказки конвертации
  остаётся открытым до письменной проверки юристом;
- закрытый pilot: публичная заявка seller доступна, но продавать можно только после ручного admin approval;
- вероятный первый продавец — Таисия Борисова;
- оригинальная физическая работа;
- оплата и доставка вне платформы.

Юридические и налоговые выводы требуют отдельной проверки до публичного запуска.

## 4. Роли

### Visitor

- открывает страницу;
- видит автора, работу, цену, время, историю;
- понимает правила;
- переходит к регистрации.

### Buyer

После регистрации и verification перед первой ставкой:

- делает ставку;
- видит свой статус;
- видит историю;
- переживает refresh/reconnect;
- получает результат;
- видит доступные контакты после победы.

### Seller

- создаёт черновик;
- загружает изображения;
- заполняет карточку;
- назначает start/end;
- задаёт start price;
- публикует preview после модерации;
- видит ставки;
- получает winner;
- может скрыть личный контакт;
- подтверждает продажу.

### Admin

- подтверждает автора;
- подтверждает/скрывает лот;
- смотрит audit;
- блокирует пользователя;
- сопровождает failed handoff;
- фиксирует итог пилота.

## 5. Основной путь

### Seller onboarding

1. Visitor подаёт публичную заявку seller и заполняет SellerProfile со статусом `PENDING_REVIEW`.
2. Admin вручную проверяет заявку. Только `APPROVED` SellerProfile открывает seller cabinet для Product и Listing.
3. Approved seller создаёт Product draft.
4. Product отправляется на ручную модерацию.
5. После Product approval seller создаёт и планирует Listing.
6. Preview и публичная ссылка появляются только для approved Product.
7. Seller получает материалы для анонса.

### Buyer flow

1. Открывает ссылку без регистрации.
2. Изучает работу.
3. Нажимает bid CTA.
4. Регистрируется email/password.
5. Подтверждает email перед первой ставкой.
6. Перед первой ставкой видит и принимает версию правил сервиса.
7. Видит minimum и получает client-side feedback для числовой BYN суммы и правила increment.
8. Перед первой ставкой в конкретном Listing явно подтверждает предмет, сумму, server minimum, deadline и последствие действия.
9. Отправляет bid; повторная ставка в том же Listing не повторяет confirmation при известном participation status.
10. Backend атомарно фиксирует или отклоняет; при отклонении client refetches canonical snapshot и показывает новый minimum/price.
11. Клиенты получают realtime как сигнал для refetch.
12. Статус виден в разделе участия.

### Closing

1. Backend использует server time.
2. После `endsAt` bids не принимаются.
3. Cron закрывает идемпотентно.
4. Highest valid Bid становится winner.
5. Если valid Bid нет — Listing завершается без winner.
6. Contacts раскрываются по privacy mode.
7. Оплата/передача вне платформы.
8. Seller подтверждает результат или проблему.

## 6. Scheduled auction

```text
SellerProfile: PENDING_REVIEW → APPROVED | CHANGES_REQUESTED | REJECTED | SUSPENDED
Product:       DRAFT → PENDING_REVIEW → APPROVED | CHANGES_REQUESTED | REJECTED | ARCHIVED
               CHANGES_REQUESTED | REJECTED → PENDING_REVIEW (owner resubmit, same Product)
Listing:       DRAFT → SCHEDULED → LIVE → ENDED | CANCELLED
               SCHEDULED → CANCELLED if `endsAt` passes without activation (`DEC-073`)
Order:         PENDING_CONTACT → CONTACTED → COMPLETED | HANDOFF_FAILED | CANCELLED
```

- SellerProfile в `PENDING_REVIEW` доступен заявителю только для просмотра статуса; Product и Listing writes открываются только после `APPROVED`.
- Product в `DRAFT`, `PENDING_REVIEW`, `CHANGES_REQUESTED` или `REJECTED` не виден публично.
- Approved seller-owner может править Product в `REJECTED` в тех же границах, что `CHANGES_REQUESTED` (поля, изображения, creation story), видеть последнюю причину модерации и отправить тот же Product обратно в `PENDING_REVIEW`. Новый Product не создаётся. AuditEvent остаётся append-only. См. `DEC-071`.
- Product попадает в public catalog только при `APPROVED` Product и `SCHEDULED`, `LIVE` либо `ENDED` Listing. Фильтр только открытых торгов остаётся будущим default-фильтром; завершённый Product сохраняет public URL и историю, если его не скрыл admin.
- до `startsAt` bid недоступен; backend переводит Listing в `LIVE`; client timer не источник истины.
- Если `SCHEDULED` Listing так и не активировался до `endsAt`, cron переводит его в `CANCELLED` с append-only audit, без Order и без тихого +24h. См. `DEC-073`.

## 7. Правила ставок

### Backend — источник истины

Server определяет time, price, status, winner.

WebSocket только ускоряет отображение.

### Конкурентность

Ставка выполняется в transaction.

Инварианты:

- цена не откатывается;
- конфликтующие bids не получают одинаковое winning state;
- history, currentPrice, bidCount, winner согласованы;
- rejected bid получает причину и новый minimum.

### Soft close

MVP:

- bid валиден, если backend фиксирует его до актуального `endsAt`;
- device time игнорируется;
- Bid в последние 60 seconds продлевает `endsAt` на 60 seconds;
- суммарное продление ограничено 600 seconds от исходного `endsAt`;
- после актуального `endsAt` bid отклоняется.

Server рассчитывает и атомарно фиксирует новое `endsAt`; client timer не источник истины.

### Принятие правил

Перед первой ставкой buyer видит краткие правила сервиса и явным действием соглашается с их versioned text. Backend хранит версию правил и timestamp принятия. Это не payment flow и не заменяет юридические документы.

### Bid increments

| Цена | Шаг |
|---|---:|
| 0–25 BYN | 0.5 |
| 25–100 BYN | 1 |
| 100–500 BYN | 5 |
| 500–1 000 BYN | 10 |
| 1 000+ BYN | 25 |

Client проверяет формат суммы и эту таблицу для немедленной обратной связи. Он не является источником истины: server transaction окончательно решает current price, minimum next bid, Listing state, `endsAt` и soft close.

### История

Показывается:

- сумма;
- время;
- псевдоним типа `user123`;
- порядок.

Не показываются email, phone, internal ID, полное имя без необходимости.

## 8. Цена

MVP использует только start price в BYN. Это минимальная цена seller; hidden reserve и reserve status не существуют в runtime, public UI или API.

Нельзя:

- использовать связанные accounts;
- создавать platform bids;
- менять start price после планирования Listing.

## 9. Статус участия вместо внешних уведомлений

Нет email/push/SMS о торгах.

Раздел «Мои покупки / Ставки»:

- `Побеждает`;
- `Перебита`;
- `Выиграна`;
- `Проиграна`;
- `Ожидает завершения`;
- `Требуется действие`.

Статус realtime и визуально различим.

Причина:

- не засорять почту;
- no-name сервис не должен начинать со spam;
- пользователь сам контролирует участие.

Риск: не вернётся после outbid.

Проверка:

- post-interview;
- return rate;
- status views;
- пересмотр при систематическом drop-off.

Критические сообщения об оплате и безопасности позднее отделяются от маркетинговых.

In-app notifications входят в MVP до redesign. Точный набор transactional email
для результата сделки, replacement/deadline, security и complaint определяется
после legal/product mapping (`DEC-075`). Verification и password reset остаются
обязательными service messages. Outbid/marketing email пока вне MVP.

## 10. Email verification

- не нужна для просмотра;
- может не требоваться при базовой регистрации;
- обязательна перед первой ставкой в production;
- production MVP использует email; Telegram verification и phone verification рассматриваются после MVP;
- rate limit;
- verification code expiry;
- abuse check.

Dev/test окружение может использовать явный non-production bypass, который невозможен в production build и не отключает authorization, transaction или idempotency checks.

## 11. Карточка лота

Обязательно:

- название;
- автор;
- категория;
- короткая идея;
- история;
- техника;
- материалы;
- размеры;
- вес при необходимости;
- год;
- уникальность/тираж;
- город;
- передача/доставка;
- start price;
- startsAt;
- endsAt;
- изображения.

Для MVP обязателен минимум один собственный снимок предмета. Главное изображение, деталь и масштаб/интерьер остаются рекомендуемым набором для качественной модерации и анонса, но не являются техническим gate. Состояние не запрашивается для creator-made Product: предполагается новая авторская вещь; поле может понадобиться поздним классам предметов и не является обязательным MVP-атрибутом.

Требования: чистота, качество, честный цвет, отсутствие мусора и чужих изображений.

## 12. Профиль автора

Минимум:

- profile photo;
- имя и фамилия либо название seller;
- короткое описание автора, его стиля и работ;
- хотя бы один social link либо другие публично проверяемые данные;
- страна; город и направление — optional.

SellerProfile отделён от buyer account. Для MVP используется одно поле `fullName`: в нём seller указывает публичное имя, имя и фамилию или название. Оно может предзаполняться из регистрации, но данные buyer не становятся публичными автоматически.

Другие работы:

- простой блок примеров или других аукционов;
- Work автора может существовать как portfolio-only и позже получить Listing.
  Collections, сложная сортировка и social portfolio mechanics остаются после MVP
  (`DEC-075`).

Ранги «профессионал/любитель» не используются.

## 13. Контакты и handoff

Seller при onboarding указывает обязательный `handoffContact` и его тип: Telegram, phone или Instagram. Public profile не делает этот contact автоматически доступным.

По умолчанию обе стороны получают нужный contact после создания активного Order: buyer видит выбранный seller handoff contact, seller видит verified buyer email. Контакты доступны только сторонам active Order и admin.

Privacy mode seller:

- личный контакт скрыт;
- seller получает buyer contact;
- пишет с отдельного аккаунта или через представителя.

Будущее: internal inbox.

Каждый новый Order (lifecycle close, admin recovery и manual replacement) сохраняет `contactDueAt` как 48-часовой snapshot от фактического момента создания этой сделки. Настройка seller 24/48/72 отложена. См. `DEC-070`.

Тот же create-path замораживает title, final amount, currency и Listing identity (`listingId` + product public id). Карточка сделки и seller Orders inbox читают эти поля, а не живой Product. Исторические ряды без snapshot-колонок читают live Product/Listing до отдельного backfill. См. `DEC-074`.

Seller находит свои сделки, кроме `CANCELLED`, через paginated `GET /api/orders` (sellerId из сессии, не из query). Cancelled Orders скрыты так же, как в карточке.

SLA 24 часа и штрафы — Hypothesis, не MVP.

## 14. Отказ победителя

1. Seller отмечает отказ/нет ответа.
2. Admin проверяет.
3. Admin вручную отменяет исходный Order с причиной и выбирает replacement из ranked Bid list. Replacement Order получает новое 48-часовое окно контакта от своего создания и не наследует deadline исходной сделки.
4. История не меняется.
5. Original winner остаётся в audit.

Текущий runtime выполняет replacement вручную через admin. Target-механика
second chance, ранга и раскрытия контактов открыта до marketplace research и
письменного legal answer (`DEC-075`). AI-анализ evidence вне MVP.

## 15. Хранение

Bid history хранится долгосрочно. Все persisted entities должны иметь `createdAt` и `updatedAt`; для Product дополнительно требуется `publishedAt`, фиксируемый в момент первой публичной публикации. Удаление аккаунта, Product или PII в MVP не реализуется; сроки и процедура будущего удаления остаются отдельным legal/privacy решением.

Bid audit хранит:

- auctionId;
- bidderId;
- amount;
- createdAt;
- server order;
- status;
- audit metadata.

Hide из UI не удаляет audit.

Сроки PII/device data требуют legal/privacy решения.

## 16. Analytics

Без сложного dashboard и third-party marketing trackers. MVP собирает только минимальные first-party события, необходимые для проверки гипотезы и сопровождения пилота.

Events:

- lot viewed;
- bid CTA clicked;
- registration started/completed;
- email verification started/completed;
- bid attempted/accepted/rejected;
- participation viewed;
- seller viewed;
- auction closed;
- handoff opened;
- sale confirmed;
- handoff failed.

## 17. Technical rehearsal gate

До real seller:

- минимум 10 concurrent users;
- разные sessions/devices;
- synchronized bids;
- refresh/reconnect;
- delayed WebSocket;
- stale state;
- last-second bid;
- cron close/repeat;
- bid after close;
- correct winner;
- soft-close cases;
- seller handoff.

Blockers:

- потеря accepted bid;
- double winner;
- price mismatch;
- wrong winner;
- post-close bid;
- contact leak;
- impossible handoff.

## 18. Первый pilot

Автор: Таисия или аналогичный creator.

Подготовка:

- выбрать работу;
- согласовать цену;
- подготовить фото и историю;
- preview;
- branded asset;
- analytics;
- анонс;
- небольшой ad test.

Длительность:

- default 2–3 дня;
- допустимо до 7;
- preview заранее.

Minimum success:

- 2 valid bidders;
- конкуренция;
- winner;
- оплата;
- передача;
- interviews seller/winner/loser.

## 19. Не входит

- drops;
- preorder;
- services;
- brands;
- resale;
- charity;
- collectibles;
- proxy;
- hidden reserve;
- live;
- chat;
- external notifications;
- payments;
- shipping;
- watchlist;
- recommendations;
- discovery;
- AI moderation;
- app-store launch;
- full disputes;
- KYC;
- ratings;
- automatic penalties;
- auction Buy Now / buyout on a live auction;
- counteroffer;
- automatic next bidder;
- IP-based currency conversion.

Fixed-price sale and optional buyer price offers for that sale are **in the target
product scope** (`DEC-075`, `DEC-076`, §21) and **not in the current runtime**.
Price offers and Buy Now are not auction mechanics. Exact offer, currency,
non-payment and contact mechanics remain open; do not implement the superseded
`DEC-072` defaults.

## 20. Критерии пересмотра

- users пропускают outbid;
- hard close вызывает sniping;
- reserve снижает trust;
- sellers требуют изменения контракта fixed/offer после P0-E;
- нет двух bidders при достаточном traffic;
- value непонятна;
- winner не платит;
- seller не завершает;
- ads не конвертируются;
- code не проходит gate.

## 21. Контракт expanded MVP (`DEC-075` — `DEC-077`)

Целевой web MVP: портфолио работ и два раздельных формата продажи:
аукцион и прямая продажа по фиксированной цене. В фиксированной продаже автор
может разрешить покупателю предложить свою цену. На аукционе этой функции нет.
Деньги за работу и доставка всегда идут напрямую между продавцом и покупателем.
bidplace не принимает оплату и не оформляет доставку. Старт бесплатный; подписка вне этой волны.

- **Work first:** автор создаёт Work независимо от продажи. Work может быть
  portfolio-only, позже получить Listing или быть перевыставлен из архива.
- **Auction:** стартовая цена, шаг, время старта/окончания и server-authoritative
  ставки. Нет «Купить» и «Предложить цену».
- **Fixed:** unique Work нельзя продать дважды; buyer confirmation должно быть
  атомарным. Точный legal contract moment/copy проверяет юрист.
- **Offer:** только опция fixed Listing, которую включает автор; expiry, revoke,
  counteroffer and competing-buy rules не выбраны.
- **Next bidder/contact:** manual admin replacement и 48h — текущий runtime, а не
  финальная marketplace policy. Target выбирается после research + legal review.
- **Currency:** пока `BYN`; другие валюты и conversion hint не подтверждены.
- **History:** кабинет называется `Покупки / Продажи`; cancelled/failed outcomes
  сохраняются в истории.
- **Missed schedule:** `CANCELLED` + audit + уведомление + удобный relist; без
  silent `+24h`.
- **Legal UX:** registration, publish, bid, fixed buy, offer and contact disclosure
  имеют разные versioned acceptance/confirmation points согласно письменной
  проверке.
- **Redesign:** только после стабилизации contract/data/flows; Figma read-only.

До новых append-only решений P0-E может проектировать варианты и race matrix, но
не реализует спорные mechanics. Две сделки на одну unique Work недопустимы.

## Implementation verification — 2026-07-19

Task A established a partial technical baseline: BYN auction only, no reserve or Buy Now, verified-phone bids, soft close and authorized Orders. Seller application approval, Product moderation workflow, seller handoff actions, minimal analytics, production OTP transport and the 10-user rehearsal remain implementation work; the factual status belongs to `11-PROJECT-STATUS.md`.
