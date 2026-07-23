# bidplace MVP RFC

Версия: 1.1
Последнее обновление: 2026-07-23
Статус: Confirmed  
Связанные решения: `DEC-003` — `DEC-011`, `DEC-016` — `DEC-020`, `DEC-023`, `DEC-039`, `DEC-042` — `DEC-047`

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

## 3. Первый рынок

- Беларусь;
- русский язык;
- BYN;
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

1. Visitor подаёт публичную заявку seller и заполняет SellerProfile.
2. Admin вручную проверяет заявку и выдаёт доступ к seller cabinet.
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
5. Подтверждает телефон перед первой ставкой.
6. Видит minimum.
7. Отправляет bid.
8. Backend атомарно фиксирует.
9. Клиенты получают realtime.
10. Статус виден в разделе участия.

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
DRAFT
→ PENDING_REVIEW
→ SCHEDULED
→ ACTIVE
→ ENDED_WITH_WINNER
→ ENDED_NO_WINNER
→ SALE_CONFIRMED
→ HANDOFF_FAILED
→ HIDDEN
```

- до `startsAt` bid недоступен;
- preview показывает дату запуска;
- backend переводит в `ACTIVE`;
- client timer не источник истины.

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

### Bid increments

| Цена | Шаг |
|---|---:|
| 0–25 BYN | 0.5 |
| 25–100 BYN | 1 |
| 100–500 BYN | 5 |
| 500–1 000 BYN | 10 |
| 1 000+ BYN | 25 |

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

## 10. Телефонная верификация

- не нужна для просмотра;
- может не требоваться при базовой регистрации;
- обязательна перед первой ставкой;
- Telegram/SMS provider;
- rate limit;
- OTP expiry;
- abuse check.

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

SellerProfile отделён от buyer account. Для MVP допустимо предзаполнять seller name из регистрации, но seller может указать другое публичное имя или название; данные buyer не становятся публичными автоматически.

Другие работы:

- простой блок примеров или других аукционов;
- без сложного portfolio engine.

Ранги «профессионал/любитель» не используются.

## 13. Контакты и handoff

По умолчанию обе стороны получают нужный контакт.

Privacy mode seller:

- личный контакт скрыт;
- seller получает buyer contact;
- пишет с отдельного аккаунта или через представителя.

Будущее: internal inbox.

SLA 24 часа и штрафы — Hypothesis, не MVP.

## 14. Отказ победителя

1. Seller отмечает отказ/нет ответа.
2. Admin проверяет.
3. Admin вручную отменяет исходный Order с причиной и выбирает replacement из ranked Bid list.
4. История не меняется.
5. Original winner остаётся в audit.

После MVP может появиться автоматизированная замена winner на основе подтверждённого evidence неудачного контакта, включая AI-assisted разбор предоставленного seller материала. До отдельной privacy, security и product decision такая автоматизация не запускается и не заменяет admin review.

## 15. Хранение

Bid history хранится долгосрочно. Все persisted entities должны иметь `createdAt` и `updatedAt`; для Product дополнительно требуется `publishedAt`, фиксируемый в момент первой публичной публикации. Эти timestamps становятся основой для будущих retention policies, но сами сроки хранения PII остаются отдельным legal/privacy решением.

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
- phone verification started/completed;
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

- fixed price;
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
- automatic penalties.

## 20. Критерии пересмотра

- users пропускают outbid;
- hard close вызывает sniping;
- reserve снижает trust;
- sellers требуют fixed price;
- нет двух bidders при достаточном traffic;
- value непонятна;
- winner не платит;
- seller не завершает;
- ads не конвертируются;
- code не проходит gate.

## Implementation verification — 2026-07-19

Task A established a partial technical baseline: BYN auction only, no reserve or Buy Now, verified-phone bids, soft close and authorized Orders. Seller application approval, Product moderation workflow, seller handoff actions, minimal analytics, production OTP transport and the 10-user rehearsal remain implementation work; the factual status belongs to `11-PROJECT-STATUS.md`.
