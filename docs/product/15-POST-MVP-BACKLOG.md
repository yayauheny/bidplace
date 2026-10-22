# bidplace — после portfolio MVP: продажи, аукционы и дальнейшее развитие

Последнее обновление: 2026-10-11
Статус: Planned/Deferred; направление следующей волны подтверждено (`DEC-115`)
Execution backlog (архив): [`../archive/tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md`](../archive/tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md)

Это единый продуктовый план функций после portfolio MVP. Сейчас сервис остаётся
портфолио; следующая волна добавляет продажи через площадку. Сам план не включает
commerce в runtime и не утверждает ещё не выбранные механики.

На вопрос «что нужно для подключения цен, аукционов или продаж?» сначала читать
этот файл целиком, затем execution backlog и документы-владельцы по ссылкам ниже.
Ответ должен охватывать все затронутые блоки, их принятые решения, открытые вопросы
и фактические пробелы реализации, а не только поле цены и кнопку ставки.

## 0. Граница волн и источники решений

- Текущий portfolio contract: [05-MVP-RFC.md](05-MVP-RFC.md).
- Подтверждённые решения и их пересмотры: [12-DECISION-LOG.md](12-DECISION-LOG.md).
- Фактический код и сохранённый commerce archive: [10-CODE-ARCHITECTURE.md](10-CODE-ARCHITECTURE.md).
- Проверенная готовность реализации: [11-PROJECT-STATUS.md](11-PROJECT-STATUS.md).
- Честность торгов и ограничения предметов: [09-TRUST-AND-AUCTION-INTEGRITY.md](09-TRUST-AND-AUCTION-INTEGRITY.md), [08-SELLER-AND-ITEM-POLICY.md](08-SELLER-AND-ITEM-POLICY.md).
- Application security: [13-APPLICATION-SECURITY.md](13-APPLICATION-SECURITY.md).
- Legal gate: [документы и checklist](../legal/00-FINAL-LEGAL-AUDIT.md).

По `DEC-112`–`DEC-114` и `DEC-116` блочная история, общие справочники, страна
с необязательным городом и пользовательские предложения категорий/терминов
входят в текущий MVP. Backend этих контрактов реализован; UI и API client ещё
нет, поэтому пользовательский сценарий не готов к выпуску. Video и расширенное
управление справочниками остаются будущими задачами. Полный объём продаж через
площадку в этом документе сохранён.

## 1. Первые кандидаты после запуска портфолио

- Clickable chips: переход из тега автора/Work в каталог с применённым фильтром.
- Video в галерее/истории после отдельного решения о форматах, лимитах и обработке.
- In-app notifications для moderation, новых работ и будущих commerce events.
- Общие reports на Work/автора и privacy-safe error report с показом отправляемого
  technical context.
- Именные серии и коллекции автора, ручной порядок работ и расширенный QR/social export.
- Likes/wishlist, follow и buyer collections только когда у visitor account появляется
  самостоятельная ценность.
  Для текущей поставки личного аккаунта избранное остаётся после MVP и скрыто,
  включая старые Figma controls и empty-state; подтверждено основателем
  2026-10-19 в DEC-123. Наличие личного аккаунта само по себе не включает wishlist.

## 2. Commerce wave: три формата

Следующая волна — продажи через площадку. Планируемые форматы сохраняются;
очерёдность fixed/offer относительно аукционов ещё требует решения:

1. Auction: start price, increment, start/end, server-authoritative bids.
2. Direct fixed price: бессрочный Listing до покупки или снятия.
3. Buyer price offer: optional только у fixed Listing.

Действующая граница — оплату за Work и доставку стороны согласовывают напрямую.
«Продажи через площадку» не означает автоматически приём денег, escrow или
перевозку самим bidplace. Для их добавления нужен отдельный product/legal contract
(см. §7). Перед commerce wave нужны:

- Work/Listing/Order/handoff contract;
- Work-level double-sale protection;
- immutable rule, Work, price, identity и outcome evidence;
- решения offer expiry/revoke/competing buy;
- сроки/notice/challenge для несостоявшейся сделки;
- ranked sequential second chance либо явный отказ от него;
- contact disclosure только сторонам Order;
- transactional delivery для критических событий;
- документы и legal UX, проверенные юристом Беларуси;
- кабинет `Покупки / Продажи` и controlled pilot.

### Карта обязательной проверки перед подключением продаж

| Область | Что должно быть определено и проверено |
|---|---|
| Work и Listing | Отдельное предложение продажи, связь с одобренной Work revision, разрешённые статусы и смена существенных данных после старта |
| Цена и валюта | Стартовая/фиксированная/текущая цена, допустимая валюта, точность и округление, серверная валидация; деньги не считать через float |
| Аукцион | Шаг ставки, начало/окончание и часовой пояс, серверное время, ranking/ties, ставка в момент закрытия, повтор запроса, конкурентные ставки, правила продления/отмены |
| Покупатель | Нужные регистрация/verification, согласия перед ставкой/покупкой, eligibility, запрет self-bid и защита от злоупотреблений |
| Fixed и offer | Atomic purchase; для offer — expiry, revoke, принятие, competing buy и решение о counteroffer |
| Защита предмета | Work-level double-sale protection между всеми форматами, lock релевантных полей, mutual exclusion relist/second chance |
| Order и результат | Immutable Work/rule/price/identity snapshots, победитель/покупатель, контакты, состояния сделки, outcome evidence и повторные запросы |
| Оплата и доставка | Информационные поля/фото упаковки из Figma, сроки действий сторон и отображение способа связи; не путать с platform payments/shipping |
| Неоплата и second chance | Notice/challenge, reason-coded closure, ranked sequential offer либо явный отказ от него, исключения для администратора |
| Уведомления | Ставка перебита, старт/конец, победа, покупка, handoff и проблемы; durable delivery/retry и защита от повторных отправок |
| Жалобы и модерация | Work/автор/сделка, причина и evidence, статус рассмотрения, решение администратора, последствия для опубликованных данных и торгов; см. §3 |
| UI и discovery | Цены, таймеры, торговые статусы, фильтры/сортировка, ставка/покупка, подтверждения, кабинет покупок/продаж, ошибки/empty/loading и доступность |
| Runtime | API authorization, повторное включение необходимых jobs/events, bounded lifecycle, multi-instance/concurrency, audit, совместимость и migration/rollback |
| Legal и запуск | Договорные моменты, правила продаж/ставок, раскрытие контактов, retention, проверка юристом, abuse/race проверки и controlled pilot |

Это карта вопросов и acceptance gates, а не утверждение новых параметров.
Значения increment, anti-sniping, сроков, валют и cancellation policy нельзя
выбрать по старому макету или включить из архивного кода без согласования.

### Торговые экраны Figma, явно отложенные из текущего MVP

- Статус продажи/формат: продажа, аукцион и связанные состояния. Статус Work
  `Hidden` не становится публичным торговым `Архив` автоматически.
- Цена, валюта, продолжительность и запланированное начало продаж.
- Оплата и доставка: город продажи, способы, комментарий и фотография упаковки.
- Связь с покупателем: выбор каналов и переключатели; правила приватности
  контактов определяются Order/handoff contract.
- Work page: цена, таймер, ставка/покупка, подтверждение действия и результат.
- Кабинет: покупки/продажи, отменённые и несостоявшиеся сделки, сообщения о проблеме.

Композиции и состояния брать из актуального versioned Figma handoff. Наличие
экрана в capture не включает его в текущий portfolio contract и не заменяет
server-side правила.

Исследование механик выполнено и хранится как raw evidence. Оно рекомендует 24h
expected / 48h overdue / около 72h до uncontested closure, reveal-on-click и
sequential second chance, но эти значения не становятся product contract без отдельного
решения и legal review.

## 3. Общение, доверие и споры

- Жалобы на Work, автора и проблему сделки: определить причины, кто может
  отправлять, нужен ли аккаунт, rate limits, дедупликацию, attachments/evidence,
  private/public границы, retention и ответ заявителю. Один существующий admin
  moderation/audit boundary расширять по необходимости, без параллельной системы.
- Для администратора: очередь, состояния рассмотрения, причина решения,
  скрытие/блокировка/восстановление и влияние на активный Listing/Order.
- Технический error report держать отдельно от жалобы на контент и спора по
  сделке; перед отправкой показывать пользователю состав diagnostic context.
- Portfolio legal/rightsholder contact остаётся требованием текущего MVP;
  полный in-app reports workflow отложен, а не сам канал обязательного обращения.
- Transaction chat с audit/evidence boundary.
- Reviews только по реальному Order outcome.
- Прозрачный rating автора и покупателя.
- Earned trust badge; его нельзя купить.
- Dispute/moderation workspace и апелляции.
- Anti-abuse signals для связанных аккаунтов и coordinated bids; сигнал не является
  автоматическим доказательством.

## 4. Монетизация сервиса

- Необязательная creator subscription, а не обязательная комиссия с Work.
- Базовая публикация и будущая базовая продажа остаются доступными бесплатно.
- Возможные бонусы: больше активных работ, scheduled publication, автоповтор,
  расширенная статистика, early access, AI assistance.
- Paid promotion только с маркировкой `Продвигается`; нельзя продавать место в bid
  history, winner, rating или review.
- Физические QR-наклейки, бирки и другие creator packs.

До включения нужны pricing research, billing provider, налоги, договорные условия и
marketing consent.

## 5. Медиа и creator profile

- Video, отдельные captions/dates и более сложные story blocks после MVP;
  базовые `HEADING`/`PARAGRAPH`/`IMAGE` входят в текущий RFC (`DEC-112`).
- Manual media/work ordering.
- История по годам, образование, выставки и опыт с более сложной структурой.
- Social frame/story card, embed и интеграции с соцсетями.
- Creator analytics: views, profile transitions, QR sources and future commerce.
- AI draft профиля и Work, category/material hints и photo assistance.

### Расширенное управление справочниками

Предложение категории, материала и техники, сопоставление с существующей записью
и отклонение с возвратом Work на доработку входят в текущий MVP (`DEC-116`,
пересмотр отложенной части `DEC-113`). После MVP остаются:

- массовый перенос уже используемых терминов между записями;
- aliases, семантическое объединение и дополнительная локализация;
- отдельная административная очередь вне модерации конкретной ревизии Work.

## 6. Количество и новые предложения

- Edition/production definition и numbered editions.
- Sale units и inventory отдельно от Work.
- Drops и limited series.
- Presale/made-to-order как отдельный fulfilment contract.
- Counteroffers и negotiation chain.
- Services, commissions and masterclasses как отдельная продуктовая модель.

## 7. Платежи и доставка платформы

- Оплата subscription может стать первым billing flow.
- Work payment, escrow, commission, payouts, refunds and chargebacks появляются только
  после отдельной legal/financial architecture.
- Delivery integration, tracking and insurance не обещаются до operational readiness.

## 8. Международность и discovery

- RUB/USD/EUR/CNY, справочная конвертация и contract currency.
- Languages and localized documents.
- New countries only after operator/tax/data/payment/shipping review.
- Curated collections, related works, saved filters and recommendations после появления
  достаточных реальных данных; без black-box popularity ranking.

## 9. Gate переноса в разработку

Для функции требуется:

1. наблюдаемая проблема/метрика portfolio или commerce pilot;
2. явное решение основателя и append-only `DEC-*`;
3. обновление RFC и owner docs;
4. data/legal/security impact;
5. server contract и abuse/race matrix;
6. утверждённые UX states;
7. отдельная короткоживущая branch и review.

## 10. Как составлять полный план подключения аукционов

1. Сопоставить каждую строку карты §2 с execution задачами `C01`–`C15` и реальным
   кодом. Архивный модуль/таблица не являются доказательством работающей функции.
2. Для каждой затронутой области указать: принятое решение с `DEC-*`, что реально
   реализовано и проверено, что требуется сделать и какой вопрос ещё открыт.
3. Прочитать соответствующие документы-владельцы §0. Старые task-prompts и raw
   research проверять против последних решений, не копировать их как contract.
4. Вынести существенные нерешённые механики через `$grilling` до реализации.
   Согласовать first sales slice, валюту/цены, аукционные правила, contacts/outcomes,
   complaints и notification channels; точные сроки не выводить из raw research.
5. Составить последовательность backend → UI → проверки → legal/operations pilot
   с зависимостями и acceptance gates. Отдельно назвать осознанно отложенные функции.

Подписки, платное продвижение, platform payments/escrow, интеграция доставки,
ratings/reviews, сложный chat, inventory/drops, video и AI не становятся
обязательными для первого sales slice только из-за присутствия в этом файле.
