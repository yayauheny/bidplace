# bidplace — сверка MVP, юридических материалов, дизайна и кода

Дата: 2026-09-05.
Проверенная база: `2d3326f`, ветка источника `fix/final-pen-v2-rework`.
Назначение: единая точка сверки и очередь заданий. Это не юридическое заключение.

## 1. Итог

Пять коммитов 24–30 августа полезны как сбор и структурирование исходных данных, но не закрывают юридическую готовность и не задают согласованный контракт MVP. Они смешали слова юриста, решения основателя, прежний auction-only RFC, будущие функции и обещания интерфейса, которых нет в коде.

К публичному запуску проект **не готов**. Закрытый локальный тест текущего аукциона возможен после технической репетиции, но это не проверка целевого MVP: теперь он включает фиксированную продажу и предложение цены, а runtime остаётся `AUCTION` + `BYN`.

Блокеры публичного запуска:

- не подтверждены допустимая форма деятельности и актуальные виды деятельности в Беларуси на 2026 год;
- не проверены обязанности при целевой работе с пользователями из России;
- согласие на ПДн и cookie-механика противоречат официальным разъяснениям НЦЗПД;
- legal drafts обещают функции и переходы, которых нет в коде;
- fixed sale и price offers отсутствуют в доменной модели, API и runtime;
- нет seller inbox, а Activity неверно отображает часть статусов;
- нет решения для пропущенного `SCHEDULED`, полный snapshot сделки не сохраняется, replacement получает уже истёкший deadline;
- решение «Figma — источник дизайна» противоречит AGENTS, design docs и decision log;
- create work, footer/legal UX и кабинет покупок/продаж ещё не имеют завершённого макета и state contract.

Порядок: продуктовый контракт → юридические решения → целостность ядра → fixed/offers и кабинет → Figma contract → редизайн → launch rehearsal.

## 2. Подтверждённая цель

- Web на Expo/React Native Web; mobile 390 сначала, затем 1024 и 1440 px.
- Сначала локальная/закрытая проверка с нескольких устройств.
- Публичный рынок: Беларусь и Россия, русский язык.
- Сервис на старте бесплатный; subscription/payment/paid promotion позже.
- Оплата работы и доставка напрямую между автором и покупателем.
- MVP: auction со стартовой ценой, шагом, временем и soft close; fixed price; optional price offer к fixed listing.
- Вне MVP: chat, reviews/rating, wishlist, встроенные платежи, доставка, подписка, drops, presale, services, native store release.
- Original Figma только читается и никогда не изменяется.
- Pen и старые screenshots не новый канон. Их cleanup допустим отдельной задачей после переноса правил и с сохранением Git history.

Открытые детали перечислены в §12. До решения их нельзя молча зашивать в production.

## 3. Evidence

Проверены пять SHA, все указанные legal/design файлы, аудит 20 августа и его 27 задач, product owner docs, Prisma schema, auction/Orders/Activity/auth/env/contracts/UI, все присланные материалы и доступная read-only структура Figma. Проверены официальные материалы МНС и НЦЗПД по состоянию на 2026-09-05.

Figma, код, Pen и пользовательские untracked-файлы не изменялись. Unit suites, typecheck, lint и build проходили. Integration run не считается evidence из-за известного ограничения песочницы с локальным PostgreSQL/Prisma; по решению основателя его повтор оставлен исполнителю.

## 4. Оценка пяти коммитов

| SHA | Хорошо | Проблема | Вердикт |
|---|---|---|---|
| `8fefc8c` | Собраны консультация и последствия | `02` объявлен каноном, хотя это вторичный memo; raw transcript не в Git; актуальность не проверена | Source memo, не legal canon |
| `514da5c` | Чужие документы отделены в raw, есть mapping | Bidbaits — лишь пример сервиса РФ и не доказывает применимость к bidplace | Только research input |
| `3a04829` | Шесть читаемых drafts и точки показа | Placeholders, future features, неверный consent/cookie UX, обещания без runtime | Не публиковать |
| `487f706` | Сильный handoff по полям, states, cabinet, legal microcopy | Расширяет RFC без decision entries и конфликтует с кодом | Backlog/design input, не contract |
| `2d3326f` | Удобные указатели и review questions | Закрепляет `02` и старый RFC выше новых решений основателя | Полезен исторически, порядок устарел |

Сохранено хорошо: посредническая модель без денег за работу; ответственность автора; запрет self/shill bids; правила до действия; no reserve; доставка/город/история создания; private handoff contact; footer/complaint/cabinet; Bidbaits не выдан за собственный текст.

Потеряно или искажено:

- free launch и РФ+РБ не доведены до всех документов;
- automatic next bidder записан как правило, хотя RFC/code используют manual admin replacement;
- 24/48/72 обещаны, код использует 24h, а replacement создаётся с `contactDueAt = now`;
- `REJECTED` объявлен редактируемым, код разрешает только `DRAFT|CHANGES_REQUESTED`;
- сбой старта обещает +24h, но пропущенный интервал остаётся `SCHEDULED`;
- «шесть финальных документов» создаёт ложное закрытие при пустых реквизитах, сроках, hosting и RF scope;
- raw transcript и личные сообщения нельзя проверить из Git.

## 5. Юридическая проверка

### 5.1 Устойчивая рамка

Сервис можно проектировать как техническую платформу без приёма денег за работы и без организации доставки. UI должен ясно показывать стороны договора и то, что модерация не подтверждает подлинность. Это не отменяет обязанности оператора сайта, ПДн, рекламы, обращений, контента и consumer rules. Фразы «не отвечаем» не являются универсальным освобождением.

### 5.2 P0: форма деятельности

Совет «ИП Беларусь + 63.12, 62.01, 73.11» нельзя использовать без новой проверки. МНС указывает: с 1 января 2026 года ИП вправе продолжать только виды из приложения 1 к постановлению №457; иначе нужен разрешённый вид либо коммерческая организация. Источники: [МНС о деятельности ИП с 2026 года](https://nalog.gov.by/news/34947/), [МНС об изменениях предпринимательской деятельности](https://nalog.gov.by/landing-innovations-taxation/).

Нужен письменный ответ специалиста на фактическую модель: бесплатная платформа сейчас, будущая подписка/реклама отдельно, РФ+РБ, деньги/доставка работ вне сервиса. Ответ должен назвать форму и точные актуальные виды деятельности для каждой выручки и функции.

### 5.3 P0: персональные данные

Схему «обязательные соглашение + политика + общее согласие, иначе нет регистрации» нужно переделать. НЦЗПД разъясняет: согласие свободно, не связывается с договором, не объединяет несвязанные цели и не блокирует услугу из-за необязательных данных. До согласия нужны оператор/адрес, цели, данные, срок, уполномоченные лица, действия/способы, права и последствия отказа. `03-pd-consent.md` этого не содержит полностью. Источник: [НЦЗПД — согласие на обработку ПДн](https://cpd.by/zachita-personalnyh-dannyh/grajdaninu/soglasiye-na-obrabotku-personalnykh-dannykh/).

Нужен data inventory и отдельное основание на каждую цель. Contractual processing, marketing, optional analytics, AI и будущий chat нельзя складывать в одну галочку.

### 5.4 P0: cookies

Одна кнопка «Понятно» и включение своей аналитики в «необходимые» недостаточны. Нужны necessary-only default, одновременные accept/reject для optional categories, список cookies/целей/сроков/получателей и изменение выбора. Источник: [НЦЗПД — политика cookie](https://cpd.by/politika-cookie/).

### 5.5 P0: Россия и трансграничная обработка

Drafts написаны только под Беларусь, но цель — пользователи РФ. Нельзя опираться на устное «Роскомнадзор не трогает». До запуска специалист определяет применимость российских норм, уведомление/локализацию, трансграничную передачу, public info и consumer scope. Для оценки нужны hosting, email, analytics, crash reporting, storage и AI processors.

### 5.6 Другие gaps

- Нет реквизитов, hosting, processors и сроков хранения.
- Нет effective date, полного version registry и repeat acceptance policy.
- «18+ одной галочкой» не подтверждено для обеих стран.
- Нет процедуры прав субъекта, идентификации, сроков ответа/удаления и incident notification.
- Не разделены transactional emails и marketing.
- Не определён retention bids, Orders, audit, complaints, IP/device logs.
- Лицензия на фото одновременно бессрочная и отзывная без ясного эффекта отзыва.
- «Раскрыть другим пользователям» слишком широко; нужно ограничить затронутой стороной/законом.
- «Удалить без причин» и «решение окончательное» надо согласовать с appeal и правом.
- Prohibited matrix требует проверки для РФ+РБ.
- Current drafts заранее регулируют chat/subscription/reviews/buyout/drops/AI. Публичная версия должна содержать только shipped MVP; future requirements хранятся внутри до включения функции.

Legal pack готов, когда известны operator/markets/infrastructure; есть data map; product states совпадают с текстом; UI хранит versioned choices; специалист проверил BY+RF; placeholders и выключенные функции отсутствуют.

## 6. Сверка 27 задач аудита 20 августа

| # | Задача | Статус | Остаток |
|---:|---|---|---|
| 1 | Close отдельно от Order | Закрыто | Separate close/create и isolation есть |
| 2 | Password reset/session invalidation | Закрыто | Token flow, `sessionVersion++`, UI есть |
| 3 | Admin emergency controls | Закрыто | Ban/revoke/cancel/recovery + audit/UI есть |
| 4 | Safe image decode | Закрыто | Auth before decode, pixel/frame/size/concurrency policies |
| 5 | Release + backup/restore | Частично | Artifacts/runbook есть; нет evidence выбранного host, staging restore/rollback/one replica |
| 6 | Seller Orders inbox | Открыто | Только get по известному publicId; list endpoint нет |
| 7 | Expired `SCHEDULED` | Открыто | `endsAt <= now` не активируется и не получает outcome |
| 8 | Admin needs-order UI | Закрыто | Panel + endpoints есть |
| 9 | DB invariants | Частично | Unique active Listing/Order/sourceBid есть; CHECK/cross-table money/status/ownership неполны |
| 10 | Immutable Order snapshot/deadline | Открыто | Snapshot только contacts; title mutable; replacement deadline равен now |
| 11 | Resume draft/rejected | Частично | Draft hydrate есть; Product `REJECTED` terminal |
| 12 | Keyboard bid confirmation | Частично | Focus dialog есть; полный Figma/device/screen-reader acceptance отсутствует |
| 13 | Activity statuses | Открыто | `CONTACTED|HANDOFF_FAILED` становятся `WON`; query unbounded; cancelled link ведёт в 403 |
| 14 | Fail-closed env + readiness | Частично | Readiness есть; production guards зависят от NODE_ENV и не всех APP_ENV combinations |
| 15 | SMTP smoke/dependency | Частично | MailTransport и patched line есть; staging delivery/retry evidence нет |
| 16 | Analytics formulas/limits | Частично | Dashboard есть; cohorts/column limits требуют независимой сверки |
| 17 | Analytics routes/env/range/request ID | Частично | Улучшено, но production pollution/drill evidence нет |
| 18 | Metadata/cache | Частично | ImageStore улучшен; mutable image URLs могут получать `immutable` без version |
| 19 | Bootstrap + CI gate | Частично | `pnpm verify`/workflow есть; root gate не включает browser E2E, bootstrap хрупок |
| 20 | Stable business error codes | Частично | Bids имеют codes; другие domains зависят от message text |
| 21 | HTTPS-only public links | Открыто | `z.string().url()` допускает нежелательные schemes |
| 22 | README/env/status truth | Открыто | Status/design still Pen + auction-only и перегружены историей |
| 23 | Dependency/advisory wave | Частично | Нет итогового production advisory report/triage |
| 24 | Bounded queries | Частично | Public pagination улучшена; Activity/admin/recovery имеют unbounded paths |
| 25 | Analytics idempotency/abuse/retention | Открыто | Client session dedupe не server guarantee |
| 26 | Legacy phone/Telegram auth cleanup | Открыто | User phone, verification table и Telegram env остаются; handoff phone сохраняется |
| 27 | Native session/OAuth | Отложить | Нужно перед store pilot, не web MVP |

Четыре из пяти прежних P0 закрыты технически; release закрыт лишь на уровне tooling. Заявление status, что pilot P0 полностью закрыты, слишком сильное без deployment/restore evidence.

## 7. Новые gaps целевого MVP

| Требование | Сейчас | Нужно |
|---|---|---|
| Auction + fixed + offer | `ListingType.AUCTION`, auction/BYN contracts | Domain model, migrations, transactions, permissions, UI |
| РФ + РБ | RFC/code только BY/BYN | Currency per Listing и seller market; без IP conversion |
| Покупки/продажи | buyer Activity из bids; seller list нет | Server projections обоих кабинетов |
| Price offer | Сущности/state machine нет | Offer status, expiry/concurrency, accept/reject; counter only if approved |
| Fixed buy | Order только из winning Bid | Atomic unique sale, snapshot, audit |
| Next bidder | Manual admin | Явно выбрать manual/automatic и реализовать |
| Contact window | First 24h, replacement 0h | Одна policy, snapshot срока |
| Status mapping | Неполный | Общая state projection |
| Legal acceptance | Только rules before Bid | Versioning для buy/offer и отдельные lawful bases |
| Cookies | Consent platform нет | Necessary default + optional choices |
| Complaint | User incident flow нет | Target/category/text/private attachments/admin queue |
| Notifications | RFC почти всё исключает | Определить transaction-critical events |
| Portfolio-only | Figma имеет frame, contract только sales | Решить MVP/wave 2 |

## 8. Дизайн

В read-only Figma видны `Структура`, `Компоненты`, `Главная`, `Каталог`, `Страница автора`, `Страница работы`, `Аккаунт и регистрация`. Work frames включают «не для продажи», «завершён», «идут торги/участие» и tabs ставок, оплаты/доставки, деталей и истории. Home/catalog содержат auction и fixed-price states. Это подтверждает направление, но не backend semantics.

Handoff хорошо раскрывает поля работы, creation story, public bid history, buyer/seller states, QR/share, legal microcopy и edge states. Пока нельзя реализовывать целиком:

- не завершены Figma screens create work, footer/cookies/complaint и cabinet;
- static frames не отвечают на races buy/buy, buy/accept, withdrawal/accept и offer expiry;
- не зафиксированы все responsive, focus/keyboard, 200% zoom, reduced motion, long text и offline states;
- шаги `+1/+5/+100` конфликтуют с RFC `0.5/1/5/10/25`;
- cabinet содержит counteroffer без окончательного MVP decision;
- «оплата и доставка» не должна выглядеть как platform checkout;
- слово «корзина» не подходит: accessible label — «Покупки и продажи»;
- runtime AppIcon сейчас использует Lucide, а новое решение требует Hugeicons Free.

Перед UI implementation для каждого route фиксируются node, viewport, roles, states, data/actions, empty/loading/error, keyboard/focus, long text и responsive behavior. Исполнитель читает Figma, не редактирует и не угадывает.

## 9. Нормализация docs

| Слой | Owner | Действие |
|---|---|---|
| Product | `product/01,05,06,08,09,12` | Revised decisions fixed/offer, market/currency, replacement, free start, Figma; затем RFC |
| Implementation | `product/10,11,13` | Короткая current matrix вместо дублирующей хронологии |
| Design | `design/00`–`04` | Заменить Pen-направление на Figma nodes + interaction/state contract |
| Legal | `legal/` | Sources, decisions и public drafts разделить; drafts только shipped features |
| Research | `research/raw/` | Immutable archive, не canon |
| Audits | `audits/`, `baseline-*` | Historical snapshots, исключить из active owner map |

Сохранить raw Bidbaits, полный raw transcript отдельным dated immutable file, founder notes отдельно, `02` как source memo и этот audit. После migration map консолидировать consultation pack/questions/review prompt, временный design handoff, baseline и Pen audits. `.DS_Store`, clipboard/screenshots/fonts/Pen copies чистить отдельным commit после inventory и reference/license check. Нельзя удалять до переноса уникальных claims.

## 10. Приоритет

1. **P0-A Product contract/decisions.**
2. **P0-B Current BY+RF legal/business validation.** Может готовиться параллельно без code changes.
3. **P0-C Data/consent/cookie architecture.**
4. **P0-D Existing auction/order integrity.**
5. **P0-E Fixed purchase + offers.**
6. **P0-F Complaints/minimum abuse controls.**
7. **P1-A Cabinet state contract.**
8. **P1-B Complete read-only Figma handoff.**
9. **P1-C Docs normalization and Pen retirement.**
10. **P1-D Hugeicons/AppIcon migration.**
11. **P1-E Full mobile-first redesign.**
12. **P1-F Public launch rehearsal.**

После MVP: chat, reviews/rating, wishlist, subscription/payment, promotion, AI, QR merchandise, drops/presale, services, languages, native auth и advanced fraud scoring.

## 11. Готовые промпты исполнителю

Для каждого: прочитать AGENTS/owners; до кода дать problem/candidates/trade-offs и выбрать durable fix; не менять Figma/.pen; одна задача — отдельная branch/commit; в ответе branch, SHA, diff stat, files, before/after, migrations, exact checks/results, risks/open decisions. `Implemented` только при server + UI primary states + evidence.

### P0-A — единый product contract

```text
Проведи founder-controlled reconciliation docs, код не меняй. Цель: бесплатный web MVP РФ+РБ; auction + fixed + optional price offer; item money/delivery direct; future scope вне MVP; Figma read-only source.

Составь decision table: fixed purchase moment/races, offer states/counteroffer, cancellation, currency/market, next bidder, contact window, notifications, portfolio-only. Не угадывай остаток. После подтверждения добавь append-only revisions в 12-DECISION-LOG, затем обнови RFC и затронутые protected docs только по явным решениям. Обнови index/status, отделив product от implementation status. Figma заменяет Pen как direction; Pen пока не удаляй.

DoD: one owner per claim; нет auction-only/RB-only/subscription-at-launch/Pen-canon conflicts; future scope отделён; links/terms checked.
```

### P0-B — legal validation pack

```text
Подготовь пакет квалифицированному юристу по актуальному BY+RF праву. Не публикуй drafts и не выдавай AI/старую консультацию за заключение.

Вход: P0-A contract, free start, future subscription, RF+BY users, direct item money/delivery, actual hosting/processors/data map. Закрытые вопросы: форма/виды деятельности 2026; стороны/момент fixed и auction договора; RF applicability/localization/notifications; consent/cookies/transfers; 18+; content/moderation/complaints; creator advertising; retention/deletion; public requisites.

Сохрани raw ответ, затем mapping question → answer → source/date → product/code/UI consequence → risk. DoD: каждый launch gate имеет owner/evidence, placeholders и устные assumptions не считаются закрытием.
```

### P0-C — data, consent, cookies

```text
После P0-A/B создай data inventory: field/event/file, purpose, basis, audience, processor/country, retention, deletion, security. Раздели contractual processing, optional consent, marketing and analytics. Implement versioned registry/acceptances where required, separate marketing choice, necessary-only cookies, equal accept/reject optional analytics and change-choice UI. No third-party trackers.

Обнови six public docs только для shipped MVP, убери future clauses. DoD: UI/API/text/version совпадают; отказ optional не ломает сервис; tests cover reject/accept/change/version update.
```

### P0-D — auction/order integrity

```text
Без fixed/offers/redesign исправь: deterministic expired-SCHEDULED outcome; immutable Order snapshot Product/Listing/price/currency/terms; единый contact deadline для first/replacement; Activity CONTACTED/HANDOFF_FAILED/CANCELLED; paginated seller Orders; HTTPS-only public links; fail-closed APP_ENV/NODE_ENV. Automatic next bidder не делать до P0-A; manual admin recovery сохранить.

DoD: additive migrations; concurrency/integration/contract/permission tests; seller находит сделки без publicId; replacement не expired; Product edits не меняют deal history; stuck schedule имеет audited outcome; architecture/status updated.
```

### P0-E — fixed и offers

```text
Реализуй P0-A fixed + optional offer end-to-end. Не добавляй chat/payment/shipping/reviews/subscription/auction buyout. Сначала state machine и race invariants. Fixed unique work атомарно имеет одного buyer; buy/offer accept/withdraw races не создают две сделки. Offer server-owned: status, amount, expiry, permissions. Counteroffer только если утверждён.

Additive Prisma, contracts, Nest, client, buyer/seller projections, audit, minimal current-style UI. Reuse Order snapshot/handoff. DoD: race tests one sale; stale offer cannot be accepted; no own/admin trade; stable errors; refresh/reconnect truthful.
```

### P0-F — complaints/abuse

```text
Сделай minimum production complaint flow: service bug, work, author, buyer/order; category/text/IDs/contact/status/timestamps. Screenshots only through private hardened ImageStore/auth/static limits; no arbitrary files/video. Admin queue/audit/status/notification.

Отдельно research official marketplace policies for self/friend shill bids, duplicate works and resale. MVP: permission check, explicit prohibition, report, audit, admin action; no fake automatic detection.

DoD: reporter/accused privacy, audited admin, bounded upload/rate limits, retention defined.
```

### P1-A — cabinet contract

```text
По реальным auction/fixed/offer APIs опиши без UI code полный state contract «Покупки / Продажи»: label/actions/visible price-contact-deadline-reason/route и empty/loading/error/offline для каждой роли. One buyer card per work, one seller card per Product. No checkout/cart semantics, no contact before active Order. Сверь Figma и верни missing frames. DoD: every backend state has one truthful presentation and recovery path.
```

### P1-B — Figma handoff

```text
Read-only inspect original Figma, never edit. Для Home/components/catalog/author/work/auth/create/footer/legal/complaint/cabinet дай exact nodes. Для 390/1024/1440: measurements/tokens/components/interactions/states/loading/empty/error/offline/roles/long text/focus/keyboard/200% zoom/reduced motion. Конфликты с P0-A/P1-A вернуть вопросами, не угадывать. DoD: every shipped route has approved frame/state or explicit written rule.
```

### P1-C — normalize docs

```text
После P0-A/B/P1-B сделай migration map old claim → owner/status/source. Добавь raw transcript и founder notes как разные immutable sources. Перенеси unique claims, сократи active indexes, mark audit/baseline/consultation/handoff historical. Retire Pen canon by founder decision; Figma не менять. Pen/assets cleanup — отдельный commit после reference/license inventory.

DoD: links pass; active docs не содержат Pen-canon/auction-only/subscription-launch conflicts; raw immutable; one owner per claim.
```

### P1-D — Hugeicons

```text
Мигрируй Lucide на Hugeicons Stroke Rounded Free/MIT по founder icon prompt. UI imports only semantic AppIcon registry. No Pro/Solid/Bulk/Duotone/tracing. Custom fill only bidplace react-native-svg 24x24 with inherited color and explicit registry; missing fill fails validation. Remove Lucide after zero imports. Add registry tests and visual board line/fill 16/20/24/32 light/dark/button; Web/iOS/Android evidence; update design/license inventory. One commit.
```

### P1-E — Figma redesign

```text
Implement approved P1-B in production. Figma/.pen immutable. Tokens/primitives → shell/cards → public/auth/work/create/cabinet/legal. 390 first, then 1024/1440. Only server-backed P0-D/E actions; no fake controls, duplicate tokens, local patches or hybrid shell. Preserve privacy/concurrency/accessibility.

DoD: matched screenshots 390/1024/1440 per route; all states; keyboard/zoom/screen-reader/reduced-motion/refresh-reconnect; no .pen diff.
```

### P1-F — launch rehearsal

```text
На disposable/staging без production data: 10 concurrent sessions; auction races/soft-close/cron/stuck schedule; fixed buy-vs-buy and buy-vs-accept; refresh/reconnect; seller inbox/deadline/replacement; complaint; email verification/reset/transactional; consent/cookies; backup-change-restore-integrity; one-replica scheduler/deploy/rollback.

Верни timestamped commands/results/screens/log refs/failures/rollback, no secrets. GO only if no accepted bid/order loss, double sale/winner, contact leak; restore passes; legal/config placeholders absent.
```

## 12. Один пакет решений основателя

Рекомендуемые defaults стоят первыми; можно ответить только на разногласия.

1. Offer: accept/reject only, no counteroffer in MVP.
2. Next bidder: manual audited admin replacement в MVP; автоматизация позже. Ранее было явное «автопереход сразу», поэтому выбор надо подтвердить.
3. Contact window: fixed 48h snapshot; 24/48/72 отложить.
4. Fixed buy: buyer confirmation атомарно создаёт сделку; seller reconfirm не нужен; снять можно только до buy.
5. Currency: Listing stores `BYN|RUB` by seller market; no IP-based conversion.
6. Portfolio-only: wave 2, несмотря на Figma frame.
7. Transactional email: verification/reset, sale result, replacement/deadline, security/complaint; outbid/marketing позже.
8. Complaint attachments: limited private images; no video/arbitrary files.
9. Human legal review: required before public audience; closed local test is separate.
10. Pen cleanup: separate commit only after complete Figma handoff/migration map; list untracked files before deletion.

## 13. Что брать сейчас

Начать с **P0-A**. Параллельно без code changes готовить **P0-B**. После ответов — P0-C и P0-D. Fixed/offers идут после state decisions. Redesign начинается после ядра и завершённого Figma handoff.

Не начинать сейчас: subscription, payments, chat, reviews/rating, wishlist, AI, native app, drops/presale и advanced fraud scoring.

## 14. Актуальный реестр работ

Подробные ready-now prompts находятся в [`../tasks/2026-09-05-quick-wins/00-README.md`](../tasks/2026-09-05-quick-wins/00-README.md).

| Категория | Сейчас | После решений/зависимостей | После MVP |
|---|---|---|---|
| Код и безопасность | QW-01 HTTPS links; QW-02 Activity; QW-03 env; QW-04 rejected recovery | expired SCHEDULED; Order snapshot/deadline; seller inbox; DB invariants; stable error codes; fixed/offers; complaints; CI/release proof | analytics retention; legacy auth cleanup; native auth |
| Product | Зафиксировать ответы §12 и подготовить P0-A | revised decision log/RFC; cabinet contract; currency/market; next bidder | subscription, chat, reviews, wishlist, drops/presale/services |
| Legal и данные | Подготовить факты и вопросы P0-B | BY+RF written validation; operator/form; data map; consent/cookies; final public docs | payment/subscription/AI/chat-specific revisions |
| Design | Завершить дизайнером create/footer/cabinet frames | read-only Figma handoff; docs normalization; Hugeicons; redesign 390→1024→1440 | native app and future feature screens |
| Operations | Не блокировать quick wins | staging email; 10-user auction/fixed races; backup/restore/rollback; one scheduler | scale/object storage/advanced monitoring |

QW-01–QW-04 имеют согласованные founder defaults и не требуют сильного дополнительного анализа. Каждая выполняется и проверяется отдельно; merge order определяется после независимого review.
