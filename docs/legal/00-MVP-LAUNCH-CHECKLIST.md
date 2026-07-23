# bidplace — legal checklist для MVP запуска в Беларуси

Последнее обновление: 2026-07-23
Статус: Needs legal review
Связанные решения: `DEC-053`, `DEC-054`

## 1. Назначение и граница

Этот файл — рабочий checklist для founder и профильного юриста. Он не является юридической консультацией, публичной офертой или подтверждением compliance.

MVP запускается в Беларуси и предоставляет только:

- регистрацию и авторизацию;
- seller application, ручную модерацию и публикацию approved предметов;
- просмотр scheduled/live аукционов;
- участие в ставках после email verification и принятия правил;
- определение winner и передачу контактов участникам active Order.

MVP не принимает payment, не хранит деньги, не организует delivery, не является escrow, не создаёт внутренний чат и не гарантирует исполнение сделки между seller и buyer.

## 2. Что должно быть подготовлено до real pilot

### Правила сервиса

- кто является оператором сервиса и как с ним связаться;
- что ставка является намерением/обязательством buyer по правилам пилота;
- server time, soft close, winner determination и ручная replacement procedure;
- отсутствие встроенных payment и delivery;
- право admin скрыть Product, ограничить account или остановить auction при incident;
- порядок обращений при споре, ошибке или privacy incident;
- versioned acceptance before first Bid и способ доказать дату/версию принятия.

### Privacy notice

- controller/контакт по персональным данным;
- категории данных: account, seller profile, email verification, Bid/Order/audit и handoff contacts;
- кто видит данные: public visitors, active Order parties, admin;
- что контакты не public и раскрываются только по правилам active Order;
- бессрочное хранение MVP до отдельной retention/deletion policy;
- отсутствие self-service deletion в MVP и канал для ручного privacy request;
- меры для security incident и контакт для обращения.

### Seller responsibility

- seller самостоятельно отвечает за налоги, законность деятельности, права на предмет, authenticity/provenance, точность описания, фото и public content;
- seller самостоятельно договаривается об оплате и передаче с winner;
- seller не размещает запрещённые, чужие, counterfeit или reseller goods;
- seller предоставляет корректный handoff contact и отвечает за дальнейшее общение с winner в privacy mode.

### Buyer responsibility

- buyer не использует fake, linked или чужие accounts;
- buyer не размещает personal data других лиц;
- buyer понимает, что платформа не принимает payment и не организует delivery;
- buyer использует полученный handoff contact только для конкретного Order.

## 3. Открытые вопросы для профильного юриста

- форма отношений сервиса, seller и buyer в Беларуси;
- точный текст правил ставки и правовой смысл accepted Bid;
- applicable personal-data, consumer and e-commerce duties;
- налогообложение seller и допустимые disclosures;
- сроки retention, deletion/anonymization procedure и legal hold;
- возрастные ограничения, consent и обработка обращений субъектов данных;
- incident response и уведомления при data breach;
- допустимость Instagram, Telegram и phone как handoff contacts.

## 4. Release evidence

Перед real pilot founder фиксирует ссылку или версию:

- утверждённых правил сервиса;
- privacy notice;
- контакта operator/support;
- юридического review и открытых рисков;
- технической проверки того, что MVP не запускает payment или delivery flow.
