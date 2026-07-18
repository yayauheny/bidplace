# bidplace MVP RFC

Версия: 1.0  
Последнее обновление: 2026-07-18  
Статус: Confirmed  
Связанные решения: `DEC-003` — `DEC-011`, `DEC-016` — `DEC-020`, `DEC-023`

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
- закрытый запуск;
- вручную приглашённые продавцы;
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
- задаёт start price и optional reserve;
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

1. Приглашение.
2. Регистрация.
3. SellerProfile.
4. Выбор работы.
5. Создание лота.
6. Admin review.
7. Preview.
8. Ссылка и материалы анонса.

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
4. Если reserve достигнут или отсутствует — winner.
5. Иначе — no winner.
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

### Hard close

MVP:

- bid валиден, если backend фиксирует до `endsAt`;
- device time игнорируется;
- после `endsAt` reject;
- без automatic extension.

Soft close — Planned.

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

## 8. Цена и reserve

MVP поддерживает:

- start price;
- optional hidden reserve;
- статус reserve reached/not reached.

Для первого пилота цена согласуется вручную.

Нельзя:

- использовать связанные accounts;
- создавать platform bids;
- менять reserve после первой ставки.

После пилотов отдельно решить: hidden reserve или start price = minimum acceptable.

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
- состояние;
- город;
- передача/доставка;
- start price;
- reserve;
- startsAt;
- endsAt;
- изображения.

Изображения минимум:

1. главное;
2. деталь;
3. масштаб/интерьер.

Требования: чистота, качество, честный цвет, отсутствие мусора и чужих изображений.

## 12. Профиль автора

Минимум:

- имя/псевдоним;
- фото;
- короткое описание;
- город/страна;
- направление;
- social links.

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
3. Seller связывается со следующим bidder вручную.
4. История не меняется.
5. Original winner остаётся в audit.

## 15. Хранение

Bid history хранится долгосрочно:

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

Без сложного dashboard.

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
- reserve cases;
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
- soft close;
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
