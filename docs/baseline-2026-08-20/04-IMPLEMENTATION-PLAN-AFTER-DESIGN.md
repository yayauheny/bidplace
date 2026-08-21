# bidplace — технический план и работа после Figma

> **Актуализация 1.1.** Fixed и Offer больше не входят в первый MVP. Сначала закрываются P0 аукционного пилота, кабинет, legal UX и карточки фактов автора. Разделы про multi-format architecture, Fixed и Offer ниже сохранены как план последующих волн и не являются условием запуска первого аукционного MVP.

## 0. Действующая последовательность до пилота

1. Исправить необратимое завершение аукциона и доказать сценарии ошибок/retry.
2. ~~Закрыть password recovery~~ (2026-08-21), ~~emergency admin actions~~ (2026-08-21), image resource limits и проверенный release/backup/restore.
3. Реализовать принятые responsive-экраны аукциона, состояния и кабинеты без подмешивания будущих CTA.
4. Добавить модель фактов автора, API, одну форму управления карточками и публичную выдачу трёх выбранных акцентов.
5. Провести legal/content pass для аукциона, прямой оплаты и передачи.
6. Пройти закрытую репетицию и пилот.
7. Только после данных пилота открыть отдельную архитектурную волну Fixed; Offer — следующей самостоятельной волной.

Этот файл предназначен для coding-agent и технического владельца. Он задаёт порядок, но не разрешает заранее угадывать schema или юридическую семантику.

## 1. Главный принцип

Не начинать реализацию Fixed с добавления нескольких полей в существующий auction Listing. Сначала закрыть риски живого пилота, затем сделать узкий multi-format architecture pass, получить ответы юриста и только после этого реализовать вертикальный Fixed flow.

## 2. Порядок работ

### Волна A — необратимое завершение аукциона

Цель:

```text
Sale lifecycle завершается независимо
→ outcome/deal создаётся отдельно
→ recovery идемпотентен
```

Scope:

- split `LIVE → ENDED` и Order creation;
- один expired Listing не останавливает обработку остальных;
- injected generic Order failure оставляет ENDED;
- repeat/recovery создаёт ровно один Order;
- решить real P2002 collision retry;
- определить expired SCHEDULED behavior;
- immutable Order identity snapshot;
- DB invariants для listing/source bid/order.

Не менять ranking и не включать automatic replacement.

### Волна B — безопасность аккаунта и email

- forgot password с neutral response;
- hashed single-use token, expiry и rate limiting;
- reset route для web/native deep link;
- `sessionVersion++` и invalidation старых sessions;
- stable auth/OTP codes;
- patched Nodemailer;
- staging SMTP smoke без OTP/PII в logs.

Google login — после пилота. Telegram login — не планировать.

### Волна C — media safety

- capability/ownership check до decode;
- upload rate limit;
- width/height/total pixels/frame/page budgets;
- sequential или bounded-concurrency decode;
- canonical safe raster normalization;
- решить, нужны ли animated images вообще;
- metadata-only Product query;
- versioned mutable image URLs;
- thumbnail policy и capacity measurement.

### Волна D — founder recovery

Generic Sale-oriented, а не только auction-oriented:

- user ban/unban и revoke sessions;
- listing/sale emergency hide/cancel;
- stuck scheduled queue;
- missing Deal/Order queue;
- per-row reason, retry, success/error;
- append-only AuditEvent;
- no Bid edit/delete и no arbitrary winner selection.

### Волна E — release safety

- точные Node/pnpm versions;
- один clean-checkout verification command;
- typecheck/lint/unit/integration/browser/build gate;
- readiness падает без DB;
- fail-closed production env;
- documented deploy/rollback;
- backup по расписанию;
- restore в отдельную БД;
- сверка Bid/Listing/Order/media counts и sample checksums.

Волны A–E являются pre-pilot и могут идти технически до финального нового визуального кода.

## 3. Multi-format Sale Architecture Audit

После P0, до реализации Fixed, отдельная review-only задача должна ответить:

### Что проверить

- `Product`, `Listing`, `AuctionRules`, `Bid`, `Order`;
- seller Product/Listing creation;
- public projections/catalog sorting;
- Activity и Order screens;
- admin moderation/recovery;
- analytics business queries;
- migrations/indexes/constraints;
- API errors and permissions.

### Вопросы

1. Какие Listing поля действительно общие?
2. Что принадлежит AuctionRules?
3. Где хранить Fixed price/rules без nullable soup?
4. Как представить `AVAILABLE_NOW` и `SCHEDULED` независимо от pricing?
5. Где живёт `allowOffers`?
6. Как Deal/Order получает source из Auction, Fixed или Offer?
7. Как отделить Sale status от Deal status?
8. Как закрепить publication lock?
9. Как обеспечить atomic one-of-one purchase?
10. Как сохранить future quantity/edition без реализации сейчас?
11. Какие current public contracts переименовывать нельзя без migration plan?
12. Какие admin/analytics queries auction-specific?

### Ожидаемый результат

- current-state diagram;
- target minimal model;
- keep/change/remove table;
- migration sequence с backward compatibility;
- public/API contract impact;
- DB invariants;
- risks and rollback;
- implementation slices;
- список founder/lawyer decisions, без которых slice blocked.

### Чего не делать

- не писать production migration в review task;
- не создавать `FixedListing`, `AuctionListing`, `DropListing` без доказательства;
- не вводить giant enum;
- не строить generic workflow engine;
- не делать все future formats;
- не превращать Product в payment/order aggregate.

## 4. После письменного ответа юриста

1. Заполнить decision table в `06` дословным коротким выводом, ссылкой на memo и датой.
2. Перевести каждый `Вопрос юристу` в `Решено`, `Запрещено` или `Нужен отдельный анализ`.
3. Обновить юридические слова в designer screens.
4. Заморозить contract point для Fixed, Auction и Offer.
5. Только затем финализировать enums/status copy/API mutations.
6. Подготовить Terms, Privacy Notice и Seller/Prohibited Items Rules с counsel-approved text.

## 5. Реализация Fixed вертикальным срезом

Минимальный slice:

```text
Seller configures Fixed
→ moderation/publication locks
→ public Product renders Fixed available/scheduled
→ Buyer Review/Confirm
→ atomic one-of-one allocation
→ generic Deal/Order
→ buyer and seller cabinets
→ direct payment/handoff
→ admin incident recovery
→ analytics from business facts
```

Нельзя считать Fixed готовым, если есть только price + button. Нужны concurrency, permission, duplicate/retry, seller/buyer discoverability, incident path и legal copy.

### Тесты Fixed

- два покупателя одновременно — один success;
- retry одного Confirm — одна сделка;
- already sold честный error/status;
- scheduled до старта запрещает покупку;
- publication lock работает server-side;
- seller не покупает свою работу;
- admin не покупает;
- unverified/ineligible user проходит правильный gate;
- cancelled/failed flow не раскрывает чужие контакты;
- Product mutation после сделки не меняет snapshot.

## 6. Реализация Offer после Fixed

Только если lawyer/product table закрыта.

Slices:

1. seller `allowOffers` и publication rules;
2. buyer submit/review/expiry;
3. seller inbox и accept/counter/decline;
4. buyer counter review;
5. accepted Offer → generic Deal;
6. full-price Fixed race/pending Offer closure;
7. privacy/admin incident/audit;
8. business-derived analytics.

Не добавлять auto accept/reject thresholds и public offer count.

## 7. Кабинеты

### Покупки

Текущий Activity расширяется, а не дублируется:

- image preview;
- title, creator, sale format;
- Leading/Outbid/Won/Lost;
- handoff Waiting/Contacted/Completed/Cancelled/Problem;
- direct Product/Deal links;
- pagination;
- truthful loading/error/empty/broken image.

### Продажи

Нужен bounded server endpoint, объединяющий понятную проекцию:

- Product moderation state;
- Sale draft/scheduled/active/ended state;
- Deal/handoff state;
- moderation reason;
- next allowed action;
- direct edit/view/handoff links.

Не вычислять статус на клиенте из случайного набора полей. Server возвращает канонический display status/action or typed primitives with one shared mapper.

## 8. Seller creation: один проход для человека, разделённые сущности в домене

Дизайнерский flow может выглядеть единым:

```text
Работа
→ фото
→ история
→ способ продажи
→ цена/время/Offer
→ review
→ moderation/publish
```

Это не требует объединять Product и Sale в одну таблицу. UI orchestrates two server-backed drafts. Reload восстанавливает оба. Product moderation и Sale publication gates остаются явными.

Recommended durable direction: server-backed Sale draft, который можно открыть заново. One-shot create+schedule проще, но хуже соответствует уже решённой multi-format настройке.

## 9. Как брать Figma в код

После передачи дизайна агент обязан:

1. открыть новый designer package `07`–`09`;
2. открыть конкретный Figma frame и developer handoff;
3. составить matrix: frame → route → existing contract → missing contract → blocked legal copy;
4. проверить 1440, 1024 и 390 states;
5. выделить shared components до route implementation;
6. переиспользовать текущие primitives/tokens, расширяя один production master;
7. не редактировать `.pen`;
8. не подключать fake API или client-only business rule;
9. реализовывать один vertical flow за раз;
10. сравнить runtime screenshots с approved Figma/Pen;
11. пройти keyboard, screen reader, zoom и reduced-motion;
12. обновить current status docs с evidence.

### Conflict protocol

Если Figma требует поля/действия, которого нет:

- `static presentation` — только если это честный текст/preview;
- `hidden until contract` — CTA не активен;
- `future reference` — отдельная Figma page, не production route;
- `blocked` — если действие меняет сделку/права/приватность;
- founder/lawyer decision — записать в `10`/`06`, не угадывать.

## 10. Компонентная реализация

Должен быть один production master на роль:

- Button;
- TextField/Select/Date/Amount;
- WorkCard;
- CreatorCard;
- StatusBadge;
- Dialog/Sheet;
- ReviewCard;
- Money;
- Media with loading/missing/error;
- SaleAction panel с variants Fixed/Auction/Offer;
- LegalNotice/AgreementCard;
- Empty/Error/Loading PageState;
- AppIcon.

Не делать giant component с десятками boolean props. Разделять общую рамку и typed variants/composition.

## 11. Архитектурные инварианты

- Product != Sale;
- scarcity != pricing;
- release != pricing;
- Offer — capability;
- currency code != visual symbol;
- Sale status != Deal status;
- one-of-one allocation atomic;
- auction ranking deterministic;
- material terms locked after publication;
- contacts role-scoped and snapshotted;
- analytics outside critical transaction;
- admin recovery reasoned, audited, idempotent;
- no silent fallback in transaction or icon system;
- no client authority for time/price/status/permission.

## 12. Verification по каждому slice

Минимум:

- unit tests для pure rules;
- PostgreSQL integration для transaction, constraint, permission и recovery;
- contracts/api-client tests;
- browser E2E с реальными ролями;
- mobile typecheck/lint/tests;
- API typecheck/lint/tests;
- affected builds/Expo export;
- exact clean command;
- zero `.pen` diff;
- status update with modules/tests;
- security review для auth, bids, purchases, admin, contacts и files.

## 13. План релизов без расширения инфраструктуры

### Pilot

- один API replica;
- один scheduler;
- PostgreSQL;
- current Socket.IO;
- controlled images;
- browser-first;
- small manual admin operations;
- direct Seller payment/delivery.

### Когда действительно понадобится изменение

- second API replica → distributed lifecycle lock/queue и realtime adapter;
- media capacity threshold → object storage + derivatives migration;
- integrated PSP → отдельный security/legal/payment project;
- native store pilot → native session/OAuth architecture;
- сотни creators → measured pagination/query optimization.

Redis, Kafka и микросервисы не являются задачей «на будущее» без конкретного threshold.

## 14. Definition of done для нового MVP baseline

- все P0 закрыты evidence;
- multi-format model реализует Fixed и Auction без enum explosion;
- Offer включён только при закрытых rules;
- seller/buyer cabinets проходят полный flow;
- legal documents/version acceptance доступны и доказуемы;
- publication lock покрыт DB/service tests;
- admin может безопасно восстановить каждый критичный outcome;
- Figma acceptance на 1440/1024/390;
- accessibility/device gates;
- one clean release gate и successful restore drill;
- `03` больше не содержит NO-GO blocker.
