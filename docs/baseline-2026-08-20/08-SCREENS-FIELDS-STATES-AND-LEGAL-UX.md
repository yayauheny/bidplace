# bidplace — экраны, реальные поля, состояния и legal UX

Это подробный рабочий справочник для дизайнера и разработчика. `Есть сейчас` означает наличие в текущей schema/API, а не обязательную визуальную готовность.

> **Актуализация 1.1.** MVP-экраны используют только Timed Auction. Все Fixed/Offer-разделы ниже сохранены как future reference и должны находиться в отдельной зоне Figma. В текущий дизайн профиля автора добавлена универсальная карточка факта и выбор до трёх публичных акцентов; в API этой модели пока нет.

## 1. Общая оболочка

### Header

| Элемент | Сейчас | Целевой MVP |
|---|---|---|
| Logo | есть | ссылка Home |
| Поиск | есть | works/authors search, mobile open/close |
| Работы/Аукционы | есть auction wording | обобщить после Fixed без потери Auction |
| Авторы | есть | сохранить |
| Создать | role-aware есть | guest→login, approved seller→creation, остальные→become creator/status |
| Login/Register | есть | сохранить |
| Account menu | есть | cabinet, seller/admin actions, logout |

Состояния: guest, buyer, seller, admin, compact mobile, search open, menu open, keyboard focus, scroll/sticky, network-independent shell.

### Footer

Нужны:

- о проекте;
- правила сервиса;
- privacy/personal data;
- seller/prohibited items rules;
- support/problem;
- operator details после юриста;
- version/date where appropriate;
- future language/appearance settings entry.

## 2. Главная

### Реальные данные сейчас

`GET /api/discovery/home`:

- `topAuctions`;
- `creators`;
- `newWorks`.

### Целевая композиция

- hero/editorial intro;
- работы/активные продажи;
- новые работы;
- авторы;
- все работы/все авторы;
- voting module;
- author-of-week result module.

### Voting states

- loading;
- active with candidates;
- guest CTA→login or allowed guest rule after decision;
- voted;
- error/retry;
- closed/counting;
- winner announced;
- tie/admin incident;
- no candidates.

До решения rules макеты marked `product contract pending`.

## 3. WorkCard

### Реальные данные

- Product publicId;
- title;
- main image URL/metadata;
- public creator summary;
- canonical Listing status;
- current price;
- currency BYN;
- starts/ends;
- category/material/uniqueness parts where projected.

### Целевая anatomy

- media;
- title;
- creator;
- format/status label;
- price/current Bid;
- time/state;
- accessible link label;
- future favourites/cart positions only in separate variant.

### States

Scheduled Fixed, Fixed available, Auction upcoming, Auction live, ended/pending deal, sold/unavailable, missing/broken media, long title, loading skeleton.

Не показывать «Sold» только из `Listing.ENDED`; Deal status должен это подтверждать.

## 4. CreatorCard

Реальные данные:

- profile photo;
- fullName;
- discipline;
- country;
- shortDescription where density permits;
- slug;
- current `workCount` exists in list contract, но старый канон сознательно не показывал unsupported vanity metrics.

Не добавлять followers, ratings, sales, verified badge или awards без contract.

States: normal, missing/broken photo, long name/discipline, loading, link focus.

## 5. Список работ

### Реальные filters/query

- `q`;
- author;
- status: SCHEDULED/LIVE/ENDED;
- category;
- materials array;
- uniqueness;
- price min/max;
- year from/to;
- sort: activity, endingSoon, newest, priceAsc, priceDesc;
- pagination.

После Fixed статус и sort copy нужно обобщить. Не добавлять «тип работы» без domain field.

States: initial loading, filtered loading, results, empty catalog, empty filter, invalid URL range correction, network retry, next page, no more, broken card image.

## 6. Список авторов

Реальные query:

- `q`;
- sort activity/name;
- pagination.

States: loading, results, empty, search empty, error/retry, next page, missing photo.

## 7. Search

- общий ввод «Найти работу или автора»;
- results sections или clear tabs;
- URL-backed query;
- recent/suggestions только если появится contract;
- no fake autocomplete.

States: empty query, typing, loading, works only, authors only, both, zero, error, offline.

## 8. Страница работы: общие данные

### Product fields в current API

| Поле | Сейчас | UX |
|---|---|---|
| title | nullable draft, required before public | primary heading |
| story | есть | основной рассказ |
| technique | optional | характеристики |
| materials | optional | характеристики/filter source |
| dimensions | optional | характеристики |
| weight | optional | характеристики |
| year | optional | характеристики |
| condition | optional | не требовать creator-made без решения |
| uniqueness | optional | scarcity/provenance |
| provenance | optional | доверие |
| city | optional | delivery/origin |
| packaging | optional | упаковка |
| deliveryInfo | required by current publication boundary | оплата/доставка |
| creationIntro | optional | tab «Создание» |
| creationSteps | 0–20 | title/body/image |
| images | 1–10 | gallery |

### Общие блоки

- gallery с thumb/zoom;
- title/creator;
- story;
- characteristics;
- creation process;
- provenance/uniqueness;
- sale action;
- payment/delivery;
- seller info;
- legal/document links;
- share;
- other works by same creator.

Tags clickable only after defining whether they map to materials/category/curated tags and a real query route.

## 9. SaleAction variants

### Auction upcoming

- start price;
- starts at;
- duration/end;
- rule summary;
- no active Bid;
- future notify.

### Auction live

- current bid;
- minimum next bid;
- ends at/countdown;
- soft-close explanation;
- Bid CTA;
- own participation status;
- recent/history entry;
- extension announcement.

### Auction ended

- auction ended;
- result wording after lawyer;
- selected bidder/deal pending only if role/contract permits;
- no Bid CTA;
- history remains.

### Fixed available

- fixed price;
- availability;
- Buy/Confirm CTA wording after lawyer;
- Offer CTA only if enabled;
- delivery/returns summary.

### Fixed scheduled

- price;
- start date/time;
- not available before start;
- future notify;
- seller/delivery summary.

### Fixed unavailable/deal pending

- reserved/unavailable/sold wording based on Deal legal status;
- no stale active CTA;
- pending Offer closure explanation where relevant.

## 10. Bid flow

### Eligibility gates

```text
Guest → Login/Register → return
Unverified → Email code
Rules not accepted → Rule card + Accept
Eligible → Amount
```

Admin and seller self-bid must be denied by server and reflected with honest UI.

### Amount

- work thumbnail/title;
- current price;
- server minimum;
- input BYN;
- quick additions;
- validation;
- continue to review.

### Review

- Product;
- creator summary if legally needed;
- Bid amount;
- current/minimum refreshed;
- current deadline;
- soft close summary;
- consequences;
- rules version/link;
- back/correct;
- confirm via accessible button and optional slide.

### Result errors

- `BID_TOO_LOW` + new minimum;
- `LISTING_CHANGED` + refetch;
- not started/ended/cancelled;
- self-bid/admin forbidden;
- email/rules eligibility;
- network unknown — check canonical state before blind retry;
- idempotent success after retry.

## 11. Bid history

Показывать:

- amount;
- time;
- Listing-scoped alias;
- leader/own state where appropriate;
- pagination if list grows.

Не показывать email, phone, internal user ID или cross-auction identity.

## 12. Fixed Review/Confirm

- work;
- seller required info;
- price BYN;
- delivery cost/status;
- returns/cancellation summary;
- direct payment disclosure;
- legal documents;
- back/correct;
- Confirm;
- atomic pending/success/unavailable result.

Success не должен говорить «Оплачено».

## 13. Offer screens

### Buyer

- amount;
- expiry/rule summary;
- privacy;
- review;
- sent/pending;
- counter received;
- accept/decline;
- expired/withdrawn/closed because sold.

### Seller

- private list grouped by work;
- buyer privacy-safe identity;
- amount/time/expiry;
- accept/counter/decline;
- conflict if work already unavailable;
- legal confirmation.

No public offer count.

## 14. Public creator profile

Реальные fields:

- photo;
- fullName;
- discipline;
- country;
- description;
- public Telegram/Instagram/website;
- works;
- status counts SCHEDULED/LIVE/ENDED;
- works filter/sort/pagination.

Private handoff contact никогда не показывается здесь.

### Новая целевая секция «Опыт и события»

Одна универсальная карточка покрывает выставку, образование, награду, публикацию, коллекцию, сотрудничество и свободный факт. Поля:

| Поле | Обязательность | Поведение |
|---|---|---|
| Заголовок | обязательно | короткий самостоятельный смысл |
| Пояснение | необязательно | подробности без требования заполнять |
| Категория | необязательно | помогает сгруппировать, не создаёт отдельную форму |
| Год начала | необязательно | число года |
| Год окончания | необязательно | не раньше начала |
| По настоящее время | необязательно | доступно только при начале, исключает окончание |
| Ссылка | необязательно | публичная безопасная HTTPS-ссылка после contract validation |
| Главный факт | необязательно | максимум три на профиль |
| Порядок | системное/управляемое | drag или доступные кнопки вверх/вниз |

Формат показа даты:

- `2024` — одно событие;
- `2021–2024` — завершённый период;
- `с 2022 года` — продолжающийся период;
- без даты — карточка не резервирует пустое место.

На публичной странице:

- до трёх выбранных фактов — компактные акценты рядом с вводным блоком;
- они не выглядят кликабельными тегами без действия;
- полный список — ниже как «Опыт и события»;
- никакого автоматически присвоенного verified/award/rating;
- missing/empty/long text/broken external link состояния.

В форме автора:

- добавить, редактировать, удалить;
- reorder с доступной альтернативой перетягиванию;
- ограничение трёх главных фактов объясняется до ошибки;
- при выборе четвёртого предлагается снять один из выбранных;
- черновик формы не теряется при validation/network error.

## 15. Auth

### Register

- display name;
- email;
- password;
- document links/checkbox only as lawyer requires;
- submit/loading/success/network/conflict/validation;
- redirect back to intended action.

### Login

- email;
- password;
- forgot password;
- submit/loading/error;
- no email enumeration.

### Password recovery

- request email;
- neutral result;
- expired/invalid link;
- new password/confirm;
- success→login;
- rate-limit state.

Google is future reference. Telegram omitted.

## 16. Email verification

- masked/current account email;
- six-digit code;
- wrong code;
- expired;
- attempts/rate limit;
- resend cooldown;
- change account/relogin path;
- success returns to Bid flow.

## 17. Become creator

### Public

- slug;
- seller type;
- discipline;
- public name;
- country;
- profile photo;
- social link legacy requirement until contract cleanup;
- Telegram/Instagram/website;
- short description.

### Private

- handoff type;
- handoff value;
- who contacts whom.

### Moderation

- draft/edit;
- pending;
- changes requested + reason + edit;
- rejected + reason/appeal/recovery after product decision;
- approved;
- suspended.

Review/public preview never leaks handoff data.

## 18. Create work + sale

### Step 1 — Work

Use Product fields from §8. Show required vs optional accurately. No fake inventory/edition yet.

### Step 2 — Photos

- 1–10;
- reorder;
- upload progress;
- unsupported/too large/dimensions;
- retry/remove;
- preview/crop only if actual pipeline supports it.

### Step 3 — Creation story

- optional intro;
- 0–20 steps;
- title/body/optional process image;
- reorder;
- explicit Skip/Continue.

### Step 4 — Sale

- Fixed/Auction;
- Now/Scheduled;
- Fixed price or Auction start/end/start price;
- allowOffers where available;
- BYN;
- payment/delivery disclosures.

### Step 5 — Review

- public preview;
- sale summary;
- legal/seller confirmation;
- save draft;
- submit for moderation/publish according to backend state.

### Recovery

- refresh restores draft;
- duplicate submit safe;
- conflict updated elsewhere;
- rejected/changes requested prefilled edit;
- Sale draft separate but visually continuous.

## 19. Кабинет покупателя

Current Activity fields:

- status;
- Listing snapshot fields;
- Product publicId/title;
- Order publicId nullable.

Target adds image/creator/format and pagination through expanded server projection.

Status copy:

- Лидируете;
- Ставка перебита;
- Выиграли;
- Проиграли/торги завершены;
- Ожидаем контакта;
- Контакт установлен;
- Передача завершена;
- Возникла проблема;
- Сделка отменена.

Fixed/Offer future states join the same Deal-oriented cabinet instead of separate apps.

## 20. Кабинет продавца

Rows/cards combine server-authoritative state:

- Product title/image;
- moderation status/reason;
- Sale format/status/time/price;
- Bid/Offer/Deal attention summary;
- next action.

Actions:

- continue draft;
- edit requested changes;
- view public page;
- configure/publish Sale;
- open active Sale;
- open Deal/handoff;
- report problem.

Admin-only actions не показывать продавцу.

## 21. Deal/Order/handoff

### Common

- immutable work title/snapshot;
- amount/currency;
- source/format;
- status;
- contact deadline only if approved;
- direct payment/delivery notice;
- support/problem.

### Buyer

- seller contact only according to handoff mode;
- what to do next;
- confirm/contact/problem actions only if contract exists.

### Seller

- buyer email snapshot;
- mark contacted;
- complete;
- handoff failed with confirmation/reason.

### Admin

- both allowed contacts;
- audit/recovery actions;
- no silent history edit.

## 22. Document cards and agreements

### Registration

- Terms;
- Privacy;
- required consent/acknowledgement after lawyer.

### Become creator

- Seller Rules;
- prohibited items;
- content licence/rights;
- handoff data explanation.

### Before first Bid

- Auction/Bid rules version;
- brief consequences;
- server time/soft close;
- direct payment/delivery;
- Accept.

### Fixed/Offer Review

- seller/returns/delivery summary;
- full applicable terms;
- confirmation copy.

### Card anatomy

- title;
- 1–2 line purpose;
- version/effective date;
- open/download;
- required state;
- accepted state and date where useful.

## 23. Money component

- canonical amount numeric;
- currency `BYN` always available;
- official sign asset optional visual prefix/suffix after approval;
- screen reader label «N белорусских рублей»;
- no ambiguous `$`/`₽`;
- locale formatting consistent;
- no live USD/EUR in MVP;
- price plus separate delivery status.

## 24. Error and empty language

Писать действие, а не техническую причину:

- «Не удалось загрузить работы» + «Повторить»;
- «Работ пока нет» + relevant CTA;
- «Ставка уже изменилась. Минимум — … BYN»;
- «Работа уже недоступна»;
- «Код истёк. Отправить новый»;
- «Мы не можем подтвердить результат запроса. Обновить статус»;
- «Фото не загрузилось» без подмены artwork.

Не показывать raw Prisma/Nest messages, stack traces или English contract wording.

## 25. Accessibility acceptance

- логический heading order;
- tabs/menu/dialog semantics;
- focus entry/return;
- Escape/outside behavior;
- 44×44 touch targets;
- no color-only statuses;
- error linked to field and summary;
- countdown не объявляется каждую секунду;
- slide confirmation имеет button/keyboard alternative;
- zoom 200% без потери action;
- reduced motion;
- alt describes artwork, decorative atmosphere hidden;
- legal text readable and links named meaningfully.
