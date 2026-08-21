# bidplace — решения, переопределения, источники и открытые вопросы

Этот файл является журналом сборки baseline. Он не переписывает историю: показывает, какое решение действует для новой работы и откуда оно взято.

## 1. Подтверждённые решения основателя

| ID | Решение | Статус |
|---|---|---|
| B-001 | Ядро продукта — ценность, авторство, история, ограниченность, прямой источник | Решено |
| B-002 | Беларусь, русский язык, BYN, закрытый ручной пилот | Решено |
| B-003 | MVP не auction-only: Fixed и Timed Auction | Решено |
| B-004 | Current Auction не является video live auction | Решено |
| B-005 | Hidden reserve не используется | Решено |
| B-006 | Один валидный bidder продуктово может быть достаточен | Решено; право открыто |
| B-007 | Bid — серьёзное подтверждённое действие | Решено; точный эффект открыт |
| B-008 | Необоснованный отказ может вести к restriction/verification/ban | Решено направление; policy открыта |
| B-009 | Следующий bidder не должен зависеть от постоянного online присутствия | Решено намерение; legal implementation blocked |
| B-010 | Offer — seller-configurable capability, не SaleType | Решено |
| B-011 | Offer не обязателен для Fixed | Решено |
| B-012 | Архитектура не запрещает Offer + Auction навсегда | Решено; production combination открыта |
| B-013 | Available now/Scheduled — отдельная ось | Решено |
| B-014 | Drop — композиция, не SaleType | Решено |
| B-015 | Limited Edition — scarcity, не SaleType | Решено |
| B-016 | Preorder/MTO/Commission не MVP, но отдельные future designs нужны | Решено |
| B-017 | Payment MVP: Buyer → Seller | Решено |
| B-018 | Delivery MVP: Seller ↔ Buyer | Решено |
| B-019 | Platform fee MVP = 0 | Решено |
| B-020 | Вероятная monetization позже — seller success fee | Направление, не тариф |
| B-021 | BYN — canonical technical currency | Решено |
| B-022 | Новый знак BYN — visual asset с BYN/accessibility fallback | Решено, legal/source check |
| B-023 | USD/EUR equivalent не показывать до юриста | Решено |
| B-024 | Material terms lock after publication | Решено |
| B-025 | Review → Correct → Confirm — общий transaction pattern | Решено |
| B-026 | Adaptive site phone+desktop; native later from same screens | Решено |
| B-027 | Email/password registration; email before first Bid | Решено |
| B-028 | Google auth позже, Telegram auth не сейчас | Решено по приоритету |
| B-029 | Cabinet: purchases and sales; seller edit after requested changes | Решено, designer phase 2 |
| B-030 | Required loading/error/empty/validation/broken-media states | Решено |
| B-031 | Shared Figma components instead of one-off buttons/cards | Решено |
| B-032 | Hugeicons Stroke Rounded Free; custom owned fills for approved gaps | Решено |
| B-033 | Old docs and history are preserved | Решено |
| B-034 | New versioned folder becomes entry point for new work | Решено |
| B-035 | Первый MVP и первый пилот остаются auction-only: только Timed Auction | Решено; пересматривает B-003 |
| B-036 | Fixed, Offer и остальные способы продажи показываются отдельно как будущее, не как MVP | Решено; пересматривает прежнюю очередность B-010–B-016, но не отменяет целевую модель |
| B-037 | Факты автора создаются одной универсальной формой; до трёх выбранных фактов выносятся на публичную страницу как акценты | Решено; design MVP, code gap |

### Актуализация 1.1: приоритет решений

`B-035` — последнее решение основателя и имеет приоритет над `B-003` и всеми старыми фразами «Fixed входит в MVP». `B-010`–`B-016` сохраняются как решения о форме будущей модели, но не о сроке её реализации. История не удаляется: в owner-файлах сверху добавлена датированная оговорка.

## 2. Что переопределено относительно старых документов

### Fixed Price

Старый `docs/product/05-MVP-RFC.md` §19: fixed price не входит.

Новый baseline: Fixed Price входит в целевой MVP. Integrated payment всё ещё не входит.

### Auction-only MVP

Старый RFC проверяет только auction journey.

Новый baseline: пилот проверяет creator commerce через Fixed и Auction. Auction сохраняется, а не заменяется.

### Offer

Старые owners не содержат seller-configurable Offer.

Новый baseline: `allowOffers` — отдельная capability. Runtime ждёт lawyer/architecture pass.

### Scheduled

Старый Scheduled относится к Auction Listing.

Новый baseline: release timing — общая ось Fixed/Auction и будущих форматов.

### Winner replacement

Старый `05-MVP-RFC.md` §14 и `10-CODE-ARCHITECTURE.md`: ручная admin replacement; автоматическая не входит и будущая модель не утверждена.

Новый baseline: продуктово желателен asynchronous deterministic переход по ranking без требования #2 сидеть online. Юридическая семантика не утверждена, поэтому текущий manual flow остаётся runtime до ответа.

### Sale/Deal

Старые документы используют Auction Listing → Bid → Order как всю коммерческую модель.

Новый baseline: Product, Sale, Bid/Offer, Deal, Payment, Handoff разделяются. Current schema остаётся фактом, но не target multiple-format model.

### «Auction core закрыт»

`7189219` и обновлённая архитектурная документация утверждали безусловное `ENDED` best-effort Order.

Аудит baseline нашёл counterexample: generic `Order.create` error откатывал одну transaction. **Исправлено 2026-08-21**: двухфазный close + shared `createWinnerOrder`; injected-failure integration доказательство в `lifecycle.integration.spec.ts`.

### Buy Now в `DO NOT TOUCH`

Repo audit был корректен на момент старого решения.

Новый baseline: Fixed входит в roadmap MVP после P0, architecture pass и lawyer. Payment/delivery integration остаются `не делать сейчас`.

## 3. Что не переопределено

- ценность и creator-first boundaries;
- запрет mass resale/shill bids;
- ручной seller/product admission;
- BYN MVP;
- no hidden reserve;
- soft close 60/60/600;
- server-authoritative bidding;
- direct payment/delivery;
- privacy of handoff contacts;
- modular monolith;
- protected old docs/history;
- canonical Pen protection во время code tasks;
- no microservices/Redis/Kafka/CQRS without need.

## 4. Источники сборки

### Repository

- `docs/product/00-PROJECT-INDEX.md`;
- `docs/product/01-PRODUCT-FOUNDATION.md`;
- `docs/product/05-MVP-RFC.md`;
- `docs/product/08-SELLER-AND-ITEM-POLICY.md`;
- `docs/product/09-TRUST-AND-AUCTION-INTEGRITY.md`;
- `docs/product/10-CODE-ARCHITECTURE.md`;
- `docs/product/11-PROJECT-STATUS.md`;
- `docs/product/12-DECISION-LOG.md`;
- `docs/design/00`–`04`;
- `docs/legal/00-MVP-LAUNCH-CHECKLIST.md`;
- `docs/audits/2026-08-20-MVP-READINESS-REPO-WIDE-AUDIT.md`;
- Prisma schema, shared contracts, current routes и lifecycle source.

### Founder/agent inputs

1. `/Users/yayauheny/Downloads/BIDPLACE_SALE_AND_PAYMENT_FORMATS_MASTER_SPEC_2026-08-20.md`
   - 1475 lines;
   - SHA-256 `fe371e5324fbaf3d923a3e82944c787f9ab062f0b1b20ed35d21b488b226bae6`.
2. `/Users/yayauheny/Downloads/bidplace_legal_commerce_pack_2026-08-20_v2.zip`
   - safe entry names checked;
   - 00–20, 99 и один full research source inspected;
   - master copy внутри полностью совпадает по SHA-256 с отдельным файлом.
3. Designer agreement в сообщении основателя: screens, cabinet scope, states, responsive, components.
4. Icon prompt attachment `7497cb9a.../pasted-text.txt`: Hugeicons/free/custom fill/AppIcon rules.
5. Audit correction attachment `065931e4.../pasted-text.txt`: chronology and new-baseline overlay.
6. Figma URL `rOVJLc8pJMD32mLGIeqhl5`, node `79:62`.

### Figma inspection note

Публичная/гостевая доска открылась в браузере и показала группы экранов и отдельный текстовый блок, но board screen-reader layer был отключён, а весь canvas находился на обзорном масштабе. Поэтому baseline не притворяется, что извлёк все внутренние Figma annotations автоматически. Полный founder text из сообщения и блока считается обязательным input; перед code handoff конкретные frames/nodes нужно просмотреть в Figma вручную/Dev Mode.

### External primary/reference sources

Legal source map находится в `05`. Exact applicability проверяет lawyer.

Hugeicons free/license/package source: https://github.com/hugeicons/hugeicons

## 5. Известные противоречия, которые нельзя скрывать

| Тема | Сейчас в коде | Target | Следующее действие |
|---|---|---|---|
| Sale type | AUCTION only | FIXED + AUCTION | architecture audit |
| Offer | нет | seller capability | lawyer + design + later code |
| Scheduled | auction lifecycle | common release | architecture audit |
| Order source | required Bid | Auction/Fixed/Offer | domain design |
| Close | two-step ENDED then Order (2026-08-21) | independent ENDED | done for P0-1 |
| Replacement | manual admin | async ranking intent | lawyer gate |
| Seller cabinet | нет | purchases/sales workspace | design phase 2 + API |
| Password reset | нет | required | P0 |
| Emergency controls | нет | required | P0 |
| Icon family | Lucide | Hugeicons free/custom | approved mapping + migration |
| New BYN sign | нет | visual + fallback | official asset/legal check |
| Voting | no API | design module requested | founder product rules |
| Legal archive | version/time only | immutable evidence | lawyer + data design |
| Visual source | protected Pen is current production canon | new Figma is working direction | founder acceptance + controlled cutover |

## 6. Открытые founder/product вопросы

Эти вопросы не являются юридическими: основателю нужно выбрать поведение. Рекомендуемые defaults будут заданы через grilling после первой версии.

### Home voting

- входит ли функционально в первый MVP или только design scope;
- кто кандидаты и кто выбирает;
- кто может голосовать;
- период и один голос;
- можно ли менять голос;
- anti-abuse и tie;
- как выбирается 1–3 работы автора недели.

### Fixed purchase

- резервируется ли работа сразу после Confirm или после seller acceptance;
- срок, за который стороны должны связаться;
- что показывать второму concurrent buyer;
- кто и когда может отменить до оплаты, если право допускает варианты.

### Offers

- default `allowOffers` off/on;
- Offer резервирует или нет;
- full-price purchase overtakes pending Offer;
- срок по умолчанию;
- можно ли отключить при pending;
- Offer на Auction: когда/если.

### Seller creation

- Product moderation до Sale configuration или единый submit;
- можно ли public preview до модерации;
- server-backed Sale draft как выбранный default;
- что делать с rejected Product: revise/resubmit или final rejection/appeal.

### Cabinet

- один screen с tabs или два routes;
- какой handoff status видит buyer/seller;
- нужны ли external notifications для critical events;
- pagination/default grouping.

### Authentication

- Google после первого пилота или только после измеренного спроса;
- нужно ли полностью удалить legacy phone verification;
- 18+ checkbox vs stronger verification after lawyer.

### Future design

- favourites/cart: показывать ли icons сейчас как future-only components;
- theme System/Light/Dark нужен ли дизайнеру сейчас;
- RU/EN и currency settings: full screen или compact future reference;
- насколько глубоко рисовать payment/commission flows в текущем бюджете.

## 7. Юридические вопросы

Не дублируются здесь. Единственный owner — `06-IT-LAWYER-BRIEF-AND-DECISION-TABLE.md`.

## 8. Правила обновления baseline

### После grilling

- disagreement становится новым B-ID или revision;
- open question закрывается;
- owner docs обновляются;
- версия baseline становится 1.1.

### После юриста

- заполняются L-ID;
- решение получает дату/memo/source;
- legal words/statuses переносятся в `02`, `05`, `07`, `08`;
- версия становится 1.2;
- code work получает точный contract point.

### После дизайна

- Figma frame/node registry добавляется в `07`/`08`;
- каждый frame получает MVP/future/blocked;
- founder acceptance записывается;
- Figma не меняет server behavior без B/L decision.

### После кода

- `03` обновляет факты/status/evidence;
- `04` отмечает завершённую волну;
- старые current-status owner docs обновляются в отдельной founder-controlled cleanup task;
- historical audits не переписываются.

## 9. Машиночитаемое резюме

```yaml
baseline: 2026-08-20-v1.0
market: BY
language: ru
currency: BYN
product:
  supply_now: ONE_OF_ONE
  production_now: READY
  sale_mechanisms_now_target: [FIXED, TIMED_AUCTION]
  sale_mechanisms_runtime: [TIMED_AUCTION]
  offer_capability_target: seller_configurable
  release_target: [AVAILABLE_NOW, SCHEDULED]
  payment_now: BUYER_TO_SELLER
  delivery_now: SELLER_TO_BUYER
  integrated_payment: not_mvp
legal:
  consultation_required: true
  source: 06-IT-LAWYER-BRIEF-AND-DECISION-TABLE.md
release:
  current: NO_GO_REAL_IRREVERSIBLE_SALE
  p0:
    # auction_close_generic_rollback closed 2026-08-21
    # password_recovery closed 2026-08-21
    # founder_emergency_controls closed 2026-08-21
    # image_decode_resource_limits closed 2026-08-21
    - release_backup_restore_unproven
design:
  product: adaptive_web_first
  widths: [1440, 1024, 390]
  icon_target: HUGEICONS_STROKE_ROUNDED_FREE
  icon_runtime: LUCIDE_VIA_APPICON
  required_states: [loading, error_retry, empty, validation, submitting, missing_media, broken_media]
code_invariants:
  - product_separate_from_sale
  - sale_separate_from_deal
  - release_separate_from_pricing
  - offer_is_capability
  - atomic_one_of_one_allocation
  - deterministic_auction_ranking
  - material_terms_locked_after_publication
  - analytics_outside_transaction
```

## 10. Статус сборки

- все запрошенные темы разложены по owner-файлам;
- старые документы и Pen не изменены;
- current code claims перепроверены по source;
- legal conclusions оставлены lawyer gates;
- designer package отделяет current MVP, phase 2 cabinet и future references;
- следующий шаг — founder grilling, затем revision 1.1.
