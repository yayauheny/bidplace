# bidplace — задание IT-юристу и таблица решений

> Актуальный пакет на консультацию: [`../legal/01-LAWYER-CONSULTATION-PACK.md`](../legal/01-LAWYER-CONSULTATION-PACK.md). Этот файл не удалён: здесь история вопросов от 20 августа и таблица L-01…L-24.

> **Актуализация 1.1 для консультации.** Первый MVP — только `TIMED_AUCTION`. Просим считать вопросы по Auction/Bid/result/ranking/direct payment/handoff/documents/privacy основным оплачиваемым объёмом. Fixed Price, Offer/Counteroffer, editions, preorder, made to order, commission и integrated payments — будущие механизмы; по ним сейчас нужен лишь короткий список красных флагов и указание, когда потребуется отдельная консультация. Старые формулировки ниже не удалены, чтобы сохранить историю пакета, но не определяют текущий launch scope.

Дата baseline: 20 августа 2026.

Просим консультацию по праву Республики Беларусь. Нужен практический письменный результат для дизайна, backend contracts, публичных документов и закрытого пилота. Продукт не просит составить абстрактный обзор всех возможных маркетплейсов.

## 1. Продукт в одном абзаце

bidplace — курируемая адаптивная площадка прямой продажи физических авторских, ограниченных или лично связанных вещей. Продавец проходит ручную проверку. Покупатель может купить по фиксированной цене или участвовать в timed online auction. В будущем/условно продавец может разрешить приватные предложения цены. В MVP деньги и доставка идут напрямую между продавцом и покупателем; платформа не принимает карту, не хранит средства и не является escrow.

## 2. Что решено продуктом

- Беларусь, русский язык, BYN;
- 18+ как предлагаемый default до вашего подтверждения;
- Fixed и Timed Auction — MVP;
- hidden reserve нет;
- soft close 60/60/600;
- одна валидная ставка продуктово может быть достаточной;
- Bid подтверждается как серьёзное действие;
- seller не должен произвольно отменять результат из-за цены;
- Offer включается продавцом;
- Available now/Scheduled — общая настройка;
- существенные условия блокируются после публикации;
- direct payment/delivery;
- контакты раскрываются только сторонам Deal и admin;
- first-party analytics;
- future integrated payment/success fee не входит в MVP.

## 3. Что существует технически сейчас

- email/password registration и 12h session;
- email verification перед первой Bid;
- versioned rules acceptance: userId/version/time;
- approved SellerProfile/Product moderation;
- auction-only Listing, BYN, schedule, soft close, ranked Bid;
- Order с final amount и contact snapshots;
- buyer/seller/admin role projections;
- manual admin Order cancellation/replacement;
- no Fixed/Offer/payment/shipping;
- no immutable legal text archive;
- no password reset;
- close/outcome transaction имеет известный P0 и до пилота будет исправлена.

## 4. Требуемый формат ответа

По каждому вопросу просим:

1. краткий вывод `можно / нельзя / можно при условиях / нужен отдельный анализ`;
2. применимые нормы и актуальную редакцию;
3. рекомендуемую конструкцию;
4. обязательный пользовательский текст/сведения;
5. момент юридически значимого действия;
6. какие доказательства хранить;
7. что изменить в UI/API/Terms;
8. остаточный риск и условие пересмотра.

## 5. Этап A — решить глубоко сейчас

### A1. Роль площадки

- Как квалифицировать bidplace в описанной MVP-модели?
- Кто сторона договора продажи?
- Является ли bidplace организатором торгов, электронной площадкой, маркетплейсом или иным посредником?
- Меняет ли отсутствие platform payment роль/обязанности?
- Какие operator details и contacts обязательны публично?

### A2. Типы продавца

- Какие статусы продавца допустимы: физлицо, НПД/самозанятость, ИП, организация?
- Какие товары/частота превращают деятельность в предпринимательскую?
- Что платформа должна запросить, проверить и показать для каждого статуса?
- Кто выдаёт чек/документ расчёта при direct payment?
- Какие налоговые/marketplace reporting обязанности могут возникнуть у bidplace?

### A3. Fixed Price

- Когда возникает договор: Confirm покупателя, принятие продавца, оплата или иной момент?
- Нужна ли отдельная seller acceptance?
- Может ли seller отклонить full-price request?
- Как юридически назвать CTA/result/status?
- Какие сведения обязательны до Confirm?
- Как оформить one-of-one reservation и race двух покупателей?
- Какие правила отмены/возврата/отказа применяются по типу seller/buyer/item?

### A4. Timed Auction

- Подпадает ли механизм под нормы о торгах/аукционе?
- Кто организатор?
- Какие требования к извещению, сроку, протоколу и форме?
- Что происходит при одном участнике/одной ставке?
- Что означает Bid и когда она связывает bidder?
- Что означает highest Bid после окончания?
- Когда возникает договор/обязанность заключить договор?
- Допустимы ли soft close и server timer в правилах?
- Можно ли seller отменить результат и по каким причинам?
- Какие слова допустимы в UI?

### A5. Ranking и замена

- Может ли ставка #2 сохранять eligibility после проигрыша?
- Как долго?
- Можно ли после отказа #1 автоматически перейти к #2?
- Нужна ли новая воля #2?
- Какой notice и срок действия нужны?
- Как связаны withdrawal/cancellation/consumer rights?
- Что считается необоснованным отказом #1?
- Какие platform restrictions законны и справедливы?
- Нужна ли отдельная версия правил/consent для standby?

### A6. Offer/Counteroffer

- Юридическая природа Offer и Counteroffer;
- момент binding effect;
- отзыв и expiry;
- что означает seller Accept;
- допустимость individualized price;
- full-price purchase при pending Offer;
- прекращение pending Offers после продажи;
- допустимое сочетание с Auction;
- можно ли выключить `allowOffers` при активных предложениях.

### A7. Scheduled и publication lock

- Какие terms должны быть известны до scheduled publication?
- Что нельзя менять после публикации?
- Как оформлять correction/cancel/recreate?
- Нужно ли уведомлять viewers/bidders/offerers и как?
- Какое evidence хранить?
- Что делать с listing, который не стартовал из-за технической недоступности и уже просрочен?

### A8. Payment boundary

- Достаточно ли disclosure «платите продавцу напрямую»?
- Какие риски и обязанности остаются у платформы?
- Может ли платформа хранить payment/handoff statuses по подтверждению сторон?
- Какие способы оплаты можно упоминать?
- Влияет ли Order creation на marketplace reporting?
- Как описать отсутствие гарантий, не исключая неотчуждаемые права потребителя?

### A9. Delivery, returns, disputes

- Какие сведения о доставке нужны до Confirm?
- Может ли cost быть «уточняется с продавцом»?
- Кто несёт риск повреждения/утраты и когда?
- Какие возвраты/отказы применяются к уникальной авторской вещи?
- Есть ли исключения для custom/personalized goods?
- Какой complaint/support process обязателен?

### A10. BYN и display

- Как правильно показывать цену и новый знак белорусского рубля?
- Можно ли ставить знак до/после суммы?
- Должен ли `BYN` оставаться рядом?
- Требуются ли специальные правила для рекламы/карточки/договора?
- Можно ли показывать справочный USD/EUR equivalent; источник, частота и disclaimer?

### A11. Personal data и contacts

- Правовые основания по каждой категории данных;
- нужен ли отдельный consent для передачи handoff contact/email;
- можно ли хранить immutable contact snapshot;
- retention Bid/Order/audit/verification/logs/analytics/images;
- deletion, anonymization, legal hold;
- privacy request channel;
- breach response;
- third-party processors/cross-border;
- cookie/local storage/analytics notice.

### A12. Документы и доказательства

- минимальный набор документов;
- нужно ли разделять Terms, Privacy, Seller Rules, seller agreement, returns/complaints;
- какие checkboxes обязательны и где;
- достаточно ли userId + version + time;
- нужно ли хранить immutable text/hash/render;
- сколько хранить accepted version;
- нужно ли отправлять подтверждение на email;
- как доказать Review/Confirm content и результат.

### A13. Возраст, санкции и модерация

- достаточно ли ограничения 18+;
- нужна ли verification;
- допустимы ли temporary bidding restriction, verification required и ban;
- какие основания/уведомление/апелляция нужны;
- как избежать unfair penalty при вине seller/technical failure;
- как описать moderation, не обещая экспертизу/аутентичность;
- takedown и prohibited items procedure.

### A14. Content/IP

- лицензия на фото/текст/продвижение;
- seller warranties;
- удаление/архивирование;
- use in ads/social materials;
- handling third-party claims;
- доказательство limited edition/scarcity claims.

## 6. Этап B — сейчас только red flags

Просим по 3–5 предложений: какие правовые блокеры возникнут и когда нужен отдельный проект.

- limited edition/quantity;
- scheduled drop/waitlist;
- preorder;
- made to order;
- commission/custom work;
- partial prepayment: аванс/предоплата/задаток;
- future PSP/marketplace split/success fee;
- international buyers/sellers/currency display;
- seller-owned payment links;
- marketing notifications.

## 7. Этап C — не тратить консультацию сейчас

- wallet/escrow/stored balance;
- credit/installments provider;
- live-video auction;
- draw/lottery;
- sealed/Dutch auction;
- crowdfunding;
- global tax engine;
- crypto/NFT.

## 8. Требуемые итоговые материалы

- memo по этапу A;
- заполненная таблица решений ниже;
- список обязательных публичных документов;
- обязательные seller fields/disclosures;
- короткие формулировки для Bid/Buy/Offer Review;
- разрешённые status words;
- схема contract point по каждому flow;
- retention/evidence matrix;
- список вопросов, которые нельзя закрыть без данных о юридическом лице/налоговом статусе/provider.

## 9. Таблица решений

Заполняется после консультации. Не заменять ответ догадкой команды.

| ID | Решение | Ответ юриста | Условия/нормы | Изменение UI | Изменение кода/данных | Документ/версия | Статус |
|---|---|---|---|---|---|---|---|
| L-01 | Роль оператора/platform |  |  |  |  |  | Открыто |
| L-02 | Допустимые seller statuses |  |  |  |  |  | Открыто |
| L-03 | Обязательные seller disclosures |  |  |  |  |  | Открыто |
| L-04 | Contract point Fixed |  |  |  |  |  | Открыто |
| L-05 | Seller acceptance Fixed |  |  |  |  |  | Открыто |
| L-06 | Fixed cancellation/returns |  |  |  |  |  | Открыто |
| L-07 | Qualification Auction |  |  |  |  |  | Открыто |
| L-08 | One bidder result |  |  |  |  |  | Открыто |
| L-09 | Legal effect of Bid |  |  |  |  |  | Открыто |
| L-10 | Seller auction commitment |  |  |  |  |  | Открыто |
| L-11 | Ranked replacement/standby |  |  |  |  |  | Открыто |
| L-12 | Offer/Counteroffer effect |  |  |  |  |  | Открыто |
| L-13 | Fixed vs pending Offer |  |  |  |  |  | Открыто |
| L-14 | Offer + Auction combinations |  |  |  |  |  | Открыто |
| L-15 | Scheduled/publication lock |  |  |  |  |  | Открыто |
| L-16 | Direct payment boundary |  |  |  |  |  | Открыто |
| L-17 | Delivery disclosure |  |  |  |  |  | Открыто |
| L-18 | BYN sign/FX display |  |  |  |  |  | Открыто |
| L-19 | Handoff contact disclosure |  |  |  |  |  | Открыто |
| L-20 | Retention/deletion/legal hold |  |  |  |  |  | Открыто |
| L-21 | Required legal documents |  |  |  |  |  | Открыто |
| L-22 | Acceptance evidence/archive |  |  |  |  |  | Открыто |
| L-23 | Age/eligibility/sanctions |  |  |  |  |  | Открыто |
| L-24 | Marketplace tax/reporting |  |  |  |  |  | Открыто |

## 10. После консультации

1. Founder подтверждает выбранные варианты.
2. В таблице появляется дата, author/memo и ссылка на exact answer.
3. `10-DECISIONS...` получает revision entries.
4. Designer получает утверждённые слова/карточки.
5. Architecture audit фиксирует contract/deal states.
6. Counsel-reviewed documents публикуются versioned.
7. Только затем включаются соответствующие production actions.
