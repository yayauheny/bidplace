# Future product

Для дизайнера: **какая логика может появиться после MVP**, чтобы система не упиралась в тупик.

Не описывает внешний вид. Не добавляет выключенные кнопки на MVP-экраны.

Классификация:

| Метка | Значение |
|---|---|
| CURRENT / MVP | Уже в продукте |
| CONFIRMED_FUTURE | Продукт/основатель явно сказал, что это должно быть позже |
| DESIGNED_POST_MVP | В текущих design/product specs уже есть контракт «после MVP» |
| POSSIBLE_FUTURE | Упоминалось или исследовалось, **не утверждено** |
| UNRESOLVED | Влияет на модель, решения нет |
| NOT PLANNED | Явно вне плана или запрещено как ядро |

Нельзя повышать POSSIBLE_FUTURE / UNRESOLVED до roadmap без нового решения.

---

## Core principle

bidplace — **creator-first**.

```text
автор
→ работа
→ история / авторство / происхождение / ценность
→ форма продажи
→ покупатель
```

Аукцион — первая и основная форма продажи. Это не универсальный маркетплейс и не вторичный resale.

Будущее расширяет эту цепочку, а не заменяет её витриной товаров.

Источник рамки: `docs/product/02-PRODUCT-EVOLUTION.md` — timed auction «первый клин, но не окончательная идентичность».

---

## 1. Sale formats

### Auction — CURRENT / MVP

- Автор публикует работу.
- У продажи есть начало и конец.
- Покупатели делают ставки.
- После завершения победитель — высшая принятая ставка; если ставок не было, продажи нет.

Подробности: [06-AUCTION-AND-BIDDING.md](./06-AUCTION-AND-BIDDING.md).

### Fixed price — CONFIRMED_FUTURE (направление); механика UNRESOLVED

Продуктовая рамка «ограниченной creator-продажи» включает фиксированную цену (`02-PRODUCT-EVOLUTION.md`). Roadmap ставит её кандидатом после первых сделок и в волне «несколько механизмов» (`06-ROADMAP-24-MONTHS.md`). Founder-пакет creator-first: экраны «могут рассматриваться» после публичной системы автор/работа, реализация post-MVP. Design spec помечает `fixed_price_sale` как **unresolved / product_decision_required**.

Семантика, которую можно закладывать в модель (не в MVP UI):

- у работы есть цена покупки без торгов;
- покупатель может купить, не ставя ставку.

Не выдумывать: платёжный провайдер, корзину, скидки, «купить сейчас» рядом с идущим аукционом.

**STATE MODEL NOT YET DEFINED** (available / sold / seller-is-buyer и т.д. не утверждены).

Конфликт design-unresolved vs evolution-frame: [11-DISCREPANCIES.md](./11-DISCREPANCIES.md).

### Presale / preorder — POSSIBLE_FUTURE; механика UNRESOLVED

В источниках термин **preorder**, не «presale». Входит в ту же рамку limited creator commerce. Roadmap: «Preorder только при реальном спросе». MVP RFC явно исключает preorder.

Концепт: автор объявляет работу до обычной доступности. Действие покупателя **не определено**.

Не выдумывать и считать UNRESOLVED:

- нужен ли депозит;
- платят ли сразу;
- количество;
- очередь;
- бронь;
- возвраты.

**STATE MODEL NOT YET DEFINED** (upcoming / open / closed не утверждены).

### Limited drop — POSSIBLE_FUTURE

Кандидат roadmap и «условный эксперимент» после первой сделки. Не обязан выпускаться. Количество, слоты, время окна — **UNRESOLVED**.

### Другие модели (поиск по источникам)

| Модель | Классификация | Evidence |
|---|---|---|
| Drops (как у Whatnot) | POSSIBLE_FUTURE | playbook «брать drops»; MVP исключает drops |
| Offers / оферты покупателя | NOT FOUND как формат bidplace | NFT/offer семантика запрещена; отдельного offer flow нет |
| Buy Now рядом с аукционом | UNRESOLVED | runtime исключает Buy Now; совместный формат не описан |
| Editions как формат продажи | не формат | signed editions — допустимый **тип предмета** позже (`08-SELLER-AND-ITEM-POLICY`); уникальность/тираж уже текст у работы |
| Creator collections | POSSIBLE_FUTURE / UNRESOLVED | поздние категории «ограниченные creator collections»; editorial collections в design — unresolved |
| Custom orders / на заказ | NOT FOUND | — |
| Услуги | POSSIBLE_FUTURE | evolution: «позднее услуги» |
| Live-торги | NOT PLANNED как ядро | playbook: не брать обязательный live |

Не добавлять форматы только потому, что они есть у маркетплейсов.

---

## 2. Follow creator — DESIGNED_POST_MVP

Спека: `follow_creator` в creator-first (`designed_post_mvp`, backend ещё нет). Roadmap 22–24 мес.: «creator follow без spam». DEC-065 **не** вводит followers. Публичные счётчики подписчиков запрещены.

Семантика:

- вошедший пользователь может следить за автором;
- состояние принадлежит паре зритель × автор;
- смысл в спеке: напоминание о будущих релизах.

Не выдумывать: число подписчиков, рейтинги популярности, публичные социальные метрики, частоту писем.

Уведомления подписчикам о релизе — в спеке «отдельный будущий контракт». **Поведение уведомлений UNRESOLVED / NOT APPROVED.**

Список «Мои авторы» — concept, **unresolved until product decision**.

Не показывать контроль follow в MVP. Пока нет API — контроля нет совсем, не disabled.

---

## 3. Save / wishlist work — DESIGNED_POST_MVP

Спека: `wishlist_saved_work`. MVP RFC исключает watchlist. Evolution относит watchlist к отложенным. Founder: можно спроектировать как расширение, не выдавать за MVP.

Семантика:

- вошедший пользователь может сохранить работу;
- состояние принадлежит паре зритель × работа;
- позже нужен доступ к сохранённым работам.

Не выдумывать: папки, публичные коллекции, счётчики, лайки, социальные сигналы. Словарь спеки: «сохранить», не «избранное».

Список «Сохранённые работы» — concept, **unresolved until product decision**.

Не показывать контроль сохранения в MVP.

---

## 4. Video / process media — DESIGNED_POST_MVP

`video_process_story`: необязательное видео о процессе создания. Отсутствие видео **не делает работу неполной**. Autoplay запрещён. Live-video / лента коротких видео — не этот контракт (live video в evolution отложен).

Держать раздельно:

| Слой | Сейчас |
|---|---|
| Галерея работы | фото предмета, MVP |
| Процесс создания | текст + опциональные фото шагов, MVP |
| Видео процесса | optional, post-MVP |

Не выдумывать: комментарии, livestream, autoplay-feed, social short-video.

Загрузка видео при создании работы в спеке **unresolved**.

---

## 5. Payments

**MVP:** оплата вне платформы.

**CONFIRMED_FUTURE (направление):** волны 13–18 мес. roadmap — подготовка и ограниченный payment pilot (legal review, один провайдер, одна валюта, payout, refund). Деньги не проводить без sandbox, бухгалтерии и legal approval.

Архитектура кода: не добавлять payments, пока нет продуктового решения на реализацию.

Если когда-нибудь утвердят, roadmap называет сущности: PaymentIntent, LedgerEntry, Payout, Refund (Order уже есть). Это **не** текущие требования к макету.

Не специфицировать checkout, комиссии, статусы оплаты как обязательные экраны сейчас.

**STATE MODEL NOT YET DEFINED** для success/failure/refund/payout.

---

## 6. Delivery / handoff

**MVP:** передача договорённостью вне платформы. У работы есть текст автора про передачу (`deliveryInfo`). После победы — контакт по правилу «кто пишет первым».

**POSSIBLE_FUTURE:** shipping в playbook «после повторяемости»; в payment pilot — «delivery confirmation».

**NOT PLANNED:** international shipping (вне обязательного плана).

Не выдумывать: калькулятор доставки, курьеров, трекинг, ярлыки, страховку.

Платформенная логистика **не спроектирована**. Текущее поле передачи — не будущая служба доставки.

---

## 7. Messaging / communication

**MVP:** нет чата.

`No confirmed future chat contract found.`

Отдельно:

| Понятие | Статус |
|---|---|
| Контакт победителя / автора после заказа | CURRENT (handoff, не чат) |
| «Будущее: internal inbox» (RFC, trust doc) | POSSIBLE_FUTURE; модели нет |
| Simple inbox после первых продаж (playbook) | POSSIBLE_FUTURE |
| Inbox в волне 19–21 | Planned в roadmap, контракта нет |
| Шумный live-chat | явно не брать |

Handoff ≠ платформенный мессенджер.

---

## 8. Notifications

**MVP:** внешних уведомлений нет (`DEC-010`). Вместо них — статус участия в «Покупках».

Пересмотр DEC-010: после метрик возврата и интервью. Playbook: «optional transactional notification, если нужна».

Подтверждённого списка событий **нет**. Ниже — **NOT APPROVED** (не рисовать центр уведомлений как факт):

| Событие | В источниках |
|---|---|
| Ставка принята / перебита | сейчас только in-app статус |
| Аукцион начинается / кончается | не утверждено внешне |
| Победа | in-app + заказ |
| Автор выпустил новую работу | связано с follow; уведомление UNRESOLVED |
| Сохранённая работа сменила статус | NOT FOUND |
| Заявка автора одобрена / отклонена | автор видит статус в кабинете; push не описан |
| Критические сообщения об оплате/безопасности | RFC: позднее отделить от маркетинга; платежей ещё нет |

Не обещать email/push/SMS в MVP.

---

## 9. Auction evolution

| Механика | Сейчас | Intent | Дальше |
|---|---|---|---|
| Timed scheduled auction | да | ядро MVP | остаётся |
| Soft close (60 / 60 / 600 сек) | **да, в runtime** | DEC-039; RFC | CURRENT. Поздний roadmap «default для крупных запусков, если подтверждено» — не новая механика. Ранний DEC-008 hard close **пересмотрен** |
| Шаг ставки | да, таблица BYN | RFC | CURRENT |
| Proxy / автоставка | нет | playbook «позднее»; evolution откладывает; MVP исключает | POSSIBLE_FUTURE |
| Reserve / скрытый резерв | нет в runtime | DEC-039 исключил; RFC: снижает trust | не возвращать без нового решения |
| Offers | нет | — | NOT FOUND |
| Buy Now вместе с аукционом | нет | runtime без Buy Now | UNRESOLVED |
| Продление (soft close) | да | сервер двигает `endsAt` | CURRENT; отдельного утверждённого текста для покупателя нет |
| Автозамена победителя | нет, вручную админ | DEC-045 Planned после MVP | CONFIRMED_FUTURE как направление; workflow автозамены не утверждён |

Не возвращать reserve/proxy/Buy Now только потому, что они мелькают в старых или exploratory файлах.

---

## 10. Creator capabilities

| Возможность | Классификация |
|---|---|
| Заявка, модерация, статусы | CURRENT |
| Черновик работы, отправка, фото, процесс | CURRENT |
| Планирование аукциона | CURRENT |
| Список своих работ | API есть; отдельного экрана нет — пробел MVP, не «будущий dashboard» |
| Relist | POSSIBLE_FUTURE (roadmap 7–9) |
| Availability (доступность) | POSSIBLE_FUTURE (тот же цикл) |
| Listing template / checklist запуска | POSSIBLE_FUTURE |
| Несколько форматов продажи | CONFIRMED_FUTURE как направление; механика UNRESOLVED |
| Scheduled releases как отдельная сущность | частично покрыто SCHEDULED аукционом; отдельный «релиз» UNRESOLVED |
| Коллекции автора | UNRESOLVED / POSSIBLE |
| Analytics дашборд автора | минимальные first-party события — контракт MVP, **не реализованы**; богатая аналитика — POSSIBLE после данных |
| Работа с победителями | CURRENT через заказ |
| Representatives / усиленная верификация | POSSIBLE (волна 19–21, North Star) |

Не выдумывать полный seller CRM.

---

## 11. Buyer library / account

| Область | Статус |
|---|---|
| Ставки и статусы участия | CURRENT (`/me/activity`) |
| Выигранный аукцион / заказ | CURRENT |
| Сохранённые работы | DESIGNED_POST_MVP; список UNRESOLVED |
| Авторы, за которыми следят | DESIGNED_POST_MVP; список UNRESOLVED |
| История покупок как отдельный магазинный архив | POSSIBLE (roadmap «purchase history» в волне форматов) |
| Buyer profile page | откладывалось в старых решениях; **не утверждено** как экран |
| Настройки аккаунта / сброс пароля | откладывались; не текущий scope |

---

## 12. Discovery / personalization

Не превращать bidplace в бесконечную социальную ленту.

| Тема | Статус |
|---|---|
| Главная, работы, авторы, поиск, фильтры | CURRENT (`DEC-065`) |
| Другие работы того же автора | CURRENT (не алгоритм) |
| Recommendations / персонализация | founder: стратегически важны, **post-MVP**. Roadmap 10–12: не делать recommendations. Advanced recs — вне плана | UNRESOLVED / POSSIBLE, не MVP |
| Similar works | Planned 22–24 | POSSIBLE_FUTURE |
| Editorial / curated collections | playbook после повторяемости; design `editorial_collections` unresolved | UNRESOLVED |
| Категории | поле CURRENT; таксономия UNRESOLVED |
| Limited feed / ending soon / new creators | частично ending soon = CURRENT сорт; «limited feed» 22–24 | POSSIBLE; infinite feed запрещён |
| Visual / room / AR search | вне плана | NOT PLANNED |

Related works автора ≠ рекомендательный движок.

---

## 13. Creator content / editorial

| Тема | Статус |
|---|---|
| История работы, уникальность, происхождение | CURRENT |
| Процесс (шаги + фото) | CURRENT |
| Более длинные тексты | лимиты позволяют; отдельных полей «эссе» нет |
| Видео процесса | DESIGNED_POST_MVP |
| Интервью / case studies | операционный рост (пилот, roadmap 7–9), не CMS |
| Editorial collections | UNRESOLVED |
| Releases / series как сущности | UNRESOLVED (аукцион-событие уже есть) |
| Editions | атрибут предмета / uniqueness, не отдельный продукт |
| Provenance evidence (усиленное) | POSSIBLE, волна публичных creators |

Не проектировать медиа-издание.

---

## 14. Product entities — future map

Логические связи, не схема БД.

```text
Creator
  - profile                    CURRENT
  - works                      CURRENT
  - public links               CURRENT
  - followers                  DESIGNED_POST_MVP
  - «Мои авторы» list          UNRESOLVED

Work
  - media (photos)             CURRENT
  - story / uniqueness / provenance  CURRENT
  - creation process           CURRENT
  - optional process video     DESIGNED_POST_MVP
  - sale / listing             CURRENT (auction only)
  - saved-by-viewer            DESIGNED_POST_MVP

Listing
  - auction                    CURRENT / MVP
  - fixed price                CONFIRMED_FUTURE direction; mechanics UNRESOLVED
  - presale / preorder         POSSIBLE_FUTURE; mechanics UNRESOLVED
  - limited drop               POSSIBLE_FUTURE
  - other formats              UNRESOLVED / NOT FOUND

Buyer
  - account                    CURRENT
  - bids / participation       CURRENT
  - won auction / order        CURRENT
  - saved works                DESIGNED_POST_MVP
  - followed creators          DESIGNED_POST_MVP

Order / handoff                CURRENT (off-platform pay/delivery)
Payment / payout / refund      CONFIRMED_FUTURE direction; not current
Platform chat                  no contract
Notifications                  no approved event list
```

---

## 15. Future state checklist

Только семантика. Не композиция.

### Follow creator (DESIGNED_POST_MVP)

- гость (действие ведёт к входу, затем возврат);
- не подписан;
- подписан;
- загрузка запроса;
- ошибка с откатом;
- нельзя следить за собой / админ — контроль не показывают.

Список «Мои авторы»: **STATE MODEL NOT YET DEFINED**.

### Save work (DESIGNED_POST_MVP)

- гость → вход и возврат;
- не сохранено;
- сохранено;
- загрузка;
- ошибка с откатом;
- свою работу не сохраняют (контроль скрыт).

Список сохранённых: **STATE MODEL NOT YET DEFINED**.

### Process video (DESIGNED_POST_MVP)

- нет видео → слоя нет, работа полная;
- есть видео: постер / готовность / играет / пауза / без звука / загрузка / ошибка.

### Fixed price

**STATE MODEL NOT YET DEFINED**

### Presale / drop

**STATE MODEL NOT YET DEFINED**

### Payments / shipping / chat / notifications

**STATE MODEL NOT YET DEFINED** (нет утверждённого контракта состояний)

---

## 16. Plan for vs design now

«Anticipate» = не сделать расширение структурно невозможным.  
Это **не** значит рисовать будущие контроли на MVP.

| Capability | Phase | Logic defined? | Needs design now? |
|---|---|---|---|
| Timed auction | MVP | YES | YES |
| Soft close | MVP | YES (сервер) | OPTIONAL / anticipate (честный факт, что дедлайн мог сдвинуться) |
| Work story + process photos | MVP | YES | YES |
| Related works same creator | MVP | YES | YES |
| Discovery search/filter | MVP | YES | YES |
| Creator apply / create work | MVP | YES | YES |
| Winner handoff | MVP | YES | YES |
| Participation statuses | MVP | YES | YES |
| Listing type besides auction | CONFIRMED_FUTURE / POSSIBLE | NO — mechanics UNRESOLVED | OPTIONAL / anticipate (работа ≠ только аукцион) |
| Fixed price screens | CONFIRMED_FUTURE direction | NO | NO — future only; BLOCKED for MVP UI |
| Presale / drop | POSSIBLE_FUTURE | NO | NO — future only |
| Follow creator | DESIGNED_POST_MVP | YES (спека; backend нет) | NO — future only; anticipate slot, не рисовать |
| Save work | DESIGNED_POST_MVP | YES (спека; backend нет) | NO — future only; anticipate slot, не рисовать |
| Saved / followed libraries | DESIGNED_POST_MVP | list UNRESOLVED | NO — future only |
| Process video | DESIGNED_POST_MVP | YES optional | NO — future only; work complete without it |
| In-platform payments | CONFIRMED_FUTURE gated | NO | NO — future only |
| Platform shipping | POSSIBLE_FUTURE | NO | NO — future only |
| Chat / inbox | POSSIBLE / no contract | NO | NO — future only |
| External notifications | POSSIBLE after metrics | NO event list | NO — future only |
| Proxy bidding | POSSIBLE_FUTURE | NO | NO — future only |
| Reserve / Buy Now combo | excluded / UNRESOLVED | NO | NO — future only |
| Recommendations / infinite feed | UNRESOLVED / not planned as feed | NO | NO — future only |
| Editorial collections | UNRESOLVED | NO | NO — future only |
| Creator works list (own) | MVP gap | data YES | OPTIONAL / anticipate |
| Automatic winner replacement | CONFIRMED_FUTURE direction | admin manual now | NO — future only |
| Follower counts / likes / ratings | forbidden | YES (запрет) | NO — never on MVP |

---

## What must stay extensible now

- Работа и продажа — разные понятия: одна работа, разные будущие форматы listing.
- Автор — сущность с работами, не «магазин SKU».
- История / процесс / медиа — часть работы, не атрибуты аукциона.
- Аккаунт покупателя может позже получить сохранённое и подписки — не завязывать «Покупки» так, что туда больше ничего нельзя добавить.
- Handoff и будущие платежи не смешивать в одном «чекауте», которого нет.

## What must not appear on MVP

Follow, сохранить, видео процесса как обязательное, купить по фикс. цене, чат, колокольчик уведомлений, подписчики, лайки, рекомендации, корзина, трекинг посылки, NFT/wallet.

Sources: `docs/product/02-PRODUCT-EVOLUTION.md`, `05-MVP-RFC.md`, `06-ROADMAP-24-MONTHS.md`, `04-MARKET-AND-COMPETITIVE-PLAYBOOK.md`, `12-DECISION-LOG.md` (DEC-010, DEC-039, DEC-045, DEC-065), `design/creator-first/spec/component-specs.yaml`, `content-fixtures.yaml`, `FOUNDER-DECISIONS.md`.
