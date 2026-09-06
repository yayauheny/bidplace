# bidplace — открытые юридические вопросы BY + RF

> Исторический широкий аудит. Для текущей консультации основатель ограничил рабочую
> юридическую рамку законодательством Беларуси. Актуальный файл для пересылки юристу:
> [`bidplace-voprosy-yuristu-by-final.txt`](bidplace-voprosy-yuristu-by-final.txt).

Дата: 2026-09-06  
Статус: пакет на письменную проверку; не юридическое заключение и не публичный текст

## 1. Вывод аудита

Юридическая модель верхнего уровня сформирована: bidplace предоставляет ПО,
деньги за работу и доставку проходят напрямую между сторонами, запуск бесплатный,
первый оператор планируется как ИП Беларуси, аудитория — Беларусь и Россия.

Юридическую часть нельзя считать закрытой. Встреча 24 августа дала направление,
но не закрыла применимость российского права к пользователям РФ, data
localization/transfers, точный момент договора в трёх форматах, legal UX,
retention, complaints и актуальность ОКЭД на дату регистрации.

Bidbaits полезен как карта сценариев. Его тексты не доказывают соответствие
bidplace праву Беларуси или России и не заменяют проверку юриста.

## 2. Что уже можно считать продуктовым фактом

- Площадка не принимает деньги за работы и не оформляет доставку.
- Сделка по работе происходит напрямую между продавцом и покупателем.
- Public MVP бесплатный; подписка, платное продвижение и платёжный провайдер позже.
- Public MVP включает аукцион, фиксированную продажу и предложение цены.
- Work существует отдельно от Listing: автор может оставить его как портфолио и
  выставить позже, в том числе из архива.
- Runtime сейчас использует BYN; расширение валюты и conversion hint не решены.
- Оператор и реквизиты до регистрации ИП неизвестны; placeholders публично
  недопустимы.
- Регистрация/ставки/продажа задуманы для 18+, без паспортной проверки.
- Ручная модерация, жалобы и блокировки существуют или планируются.

ОКЭД `63.12` (основной), `62.01`, `73.11` и запрет использовать `64.19`,
`64.92`, `92.00`, `47.91` зафиксированы как совет на встрече. Перед регистрацией
нужна повторная проверка актуального классификатора и допустимости этих видов для
ИП в Беларуси в 2026 году.

## 3. Решения, которые преждевременно названы закрытыми

| Тема | Что сейчас написано | Почему открыто |
|---|---|---|
| `DEC-072` | manual admin next bidder, BYN/RUB, no counteroffer, portfolio wave 2 | Основатель вернул replacement/currency/offers на research; portfolio теперь подтверждён для MVP. |
| Cookie | «Понятно» и ссылка | Официальный сайт НЦЗПД сам даёт «Принять / Отклонить»; нужно разделить essential и optional cookies и получить мнение юриста. |
| Три обязательные галочки | agreement + policy + PD consent | Политика обычно информирует, а consent должен быть конкретным и свободным. Нужно проверить, какие основания обработки действительно требуют consent и допустимо ли блокировать регистрацию. |
| Один acceptance перед первым действием | ставка, fixed buy и offer вместе | У действий разные последствия и существенные условия. Fixed buy/offer требуют transaction-level confirmation даже если общие правила принимались раньше. |
| 48 часов и следующий участник | единый срок и admin replacement | Это временный кодовый default. Нужны market research и юридическая схема, прежде чем раскрывать контакты нескольких участников. |
| «Решение площадки окончательное» | бан/апелляция 14 дней | Договорная фраза не может отменить обязательные права пользователя и судебную защиту. Нужна допустимая формулировка. |
| «Суд по месту оператора» | draft agreement | Может не применяться к потребителю или пользователю из РФ. Нужна BY+RF проверка. |
| «Не несём ответственности» | широкие disclaimers | Статус технической площадки снижает, но не обнуляет обязанности по данным, рекламе, контенту, жалобам и собственной услуге. |
| Бессрочная отзывная лицензия | реклама и соцсети | Нужно точно определить эффект отзыва, срок удаления из active promotion, архив сделки и уже опубликованные материалы. |
| Будущие функции в drafts | chat/subscription/AI и другое «если включено» | Публичный документ должен описывать реально включённые процессы либо ясно versioned optional clauses. Иначе невозможно дать точное информированное согласие. |
| Сбой старта | `03-BIDBAITS-MAPPING.md` всё ещё говорит `+24 часа` | Текущее подтверждённое решение — cancellation + уведомление + relist; mapping устарел. |
| Offers | handoff допускает встречную цену, `DEC-072` запрещает | Research должен определить механику; до решения тексты и код не фиксировать. |

## 4. Почему нужен отдельный RF-блок

Официальный текст российского 152-ФЗ прямо распространяет закон на обработку
данных граждан РФ иностранными лицами на основании договора или согласия.
Статья 12 регулирует трансграничную передачу, а статья 18 содержит localization
requirements. Роскомнадзор отдельно указывает общий порядок уведомления
оператора. Следствие для конкретного ИП Беларуси должен подтвердить юрист; фраза
«Роскомнадзор не будет трогать» не является launch evidence.

В Беларуси Закон № 99-З и разъяснения НЦЗПД требуют определить оператора,
уполномоченных лиц, основания и цели обработки, трансграничные передачи, меры
защиты и порядок incident handling. Страна PostgreSQL, object storage, SMTP,
analytics/error tracking и AI processors пока не выбрана, поэтому финализировать
политику до infrastructure data map нельзя.

Primary anchors для проверки юристом:

- [Закон РБ № 99-З «О защите персональных данных»](https://pravo.by/document/?guid=12551&p0=H12100099);
- [Национальный центр защиты персональных данных РБ](https://cpd.by/);
- [официальный текст Федерального закона РФ № 152-ФЗ](https://ips.pravo.gov.ru/api/ips/legislation/document?baseid=None&hash=98490812b3409e2a8d78a11ca9010f434ea3d9250a11dbbdb78690cd5551bdd6);
- [разъяснение Роскомнадзора об уведомлении оператора](https://82.rkn.gov.ru/directions/pers/p15375/).

## 5. Вопросы юристу

Для каждого ответа нужны: юрисдикция, норма/официальное разъяснение, дата,
обязательность, допустимый текст, следствие для UI/data/code и риск.

### A. Оператор, рынок и документы

1. Достаточно ли ИП Беларуси для бесплатной публичной площадки с пользователями
   BY и RF, без движения денег за товар и без своей доставки?
2. Какие актуальные ОКЭД нужны на дату регистрации? Подтвердить или исправить
   `63.12`, `62.01`, `73.11` и список кодов, которых следует избегать.
3. Какие реквизиты, адрес, контакты, сведения об услуге и применимом праве должны
   быть постоянно доступны на сайте и в приложении?
4. Применимо ли к ИП РБ российское consumer, information, advertising и personal
   data law при целенаправленной работе с пользователями РФ? Какие отдельные
   документы/оговорки нужны для RF?
5. Является ли bidplace владельцем агрегатора/иной регулируемой информационной
   площадкой в BY или RF, даже без приёма денег за товар? Какие обязанности нельзя
   снять disclaimer-ом?
6. Нужны ли шесть отдельных документов или часть следует объединить? Дайте
   окончательный комплект и owner каждого правила без дублирования.

### B. Персональные данные и инфраструктура

7. Нужны ли регистрация/уведомление оператора в РБ и/или РФ до public MVP?
8. Требует ли RF localization первичного сбора данных граждан РФ в России для
   иностранного ИП РБ? Как совместить это с одной базой и последующей передачей?
9. Какие уведомления/разрешения нужны для трансграничной передачи между BY, RF и
   странами будущих hosting/SMTP/S3/error-tracking providers?
10. Какие processors надо перечислять поимённо, а какие категориями? Какие
    договорные условия/DPA нужны с ними?
11. Для каждого поля code data map определить legal basis: account email,
    password/session/token hashes, public profile, private contact, bids, Orders,
    aliases, images, complaints/attachments, audit/security/session logs,
    analytics and notifications.
12. Какие retention periods и deletion/anonymization rules нужны для этих
    категорий? Что можно сохранять после удаления аккаунта для сделки, fraud,
    audit и защиты требований?
13. Можно ли автоматически раскрывать private handoff contact победителю? Какие
    поля, на каком основании, каким сторонам и в какой момент?
14. Допустимо ли когда-либо раскрыть автору контакты нескольких участников после
    non-payment, или каждый следующий contract/contact требует отдельного шага?
15. Какие organizational/technical документы нужны помимо public policy:
    responsible person, access matrix, incident register, processor register,
    breach response and subject request procedure?

### C. Cookie, analytics, diagnostics и сообщения

16. Какие cookies strictly necessary и могут работать без consent? Какие требуют
    prior opt-in? Нужны ли равные «Принять / Отклонить / Настроить»?
17. Достаточно ли раздела cookies в privacy policy либо нужен отдельный документ?
    Что показать до выбора и как хранить доказательство/version?
18. Можно ли first-party product analytics включать по legitimate/contract basis,
    или требуется consent в BY и/или RF?
19. Для «Сообщить об ошибке»: можно ли по явному действию пользователя приложить
    route, app/browser version, request/error IDs, timestamps and recent technical
    breadcrumbs? Что запрещено собирать; нужен ли preview/checkbox; срок хранения?
20. Можно ли прикладывать screenshot? Как предупредить о чужих ПДн и как ограничить
    доступ/retention?
21. Какие письма и in-app notifications являются service messages и не требуют
    marketing consent? Какие требуют отдельного согласия и unsubscribe?

### D. Аукцион, fixed sale и offer

22. Кто делает оферту и кто акцептует в каждом формате: auction Listing + Bid,
    fixed Listing + Buy confirmation, buyer Offer + seller Accept?
23. В какой точный момент возникает прямой договор продавец–покупатель и какие
    условия должны быть неизменяемо сохранены?
24. Какие обязательные сведения о продавце, работе, цене, валюте, доставке,
    возврате/отказе и сроках должны быть показаны до действия?
25. Имеет ли значение, продаёт автор как физлицо, ИП/самозанятый или регулярно?
    Как меняются consumer rights и информация в карточке?
26. Как долго Bid и Offer обязательны; можно ли их отозвать; что происходит при
    изменении/снятии Listing и конкурирующей fixed покупке?
27. Может ли seller отказаться после winning bid/fixed buy/accepted offer, и
    какие законные исключения нужны вместо абсолютной формулировки?
28. Как legally корректно перейти к следующему участнику после non-payment:
    новый offer/accept, second-chance offer или автоматический winner? Можно ли
    продавцу выбирать не по рангу?
29. Каким должен быть reasonable contact/payment window; можно ли seller задавать
    его; как учитывать выходные; когда считать сделку несостоявшейся?
30. Можно ли оставить BYN единственной contract currency для RF users и показать
    ориентировочную RUB conversion hint? Как маркировать provider, rate timestamp,
    rounding и то, что расчёт сторон идёт в contract currency?

### E. Moderation, complaints, content и лицензия

31. Какие notice-and-action обязанности есть у площадки в BY/RF по prohibited
    goods, extremist content, IP violations, fraud and user complaints?
32. Допустимы ли immediate hide/temporary ban/permanent ban; что сообщать
    пользователю; какой appeal process и срок ответа нужен?
33. Какие основания и сроки обработки complaints, session diagnostics и evidence?
34. Как сформулировать неисключительную лицензию на public display и promotion;
    нужна ли отдельная consent для конкретной рекламной кампании?
35. Что происходит после отзыва лицензии: active card, catalog cache, social ads,
    backups and anonymized sale history?
36. Какие seller declarations о правах, подлинности, налогах, cultural export and
    delivery полезны, а какие создают ложное ощущение, что площадка освобождена от
    собственной обязанности реагировать?
37. Достаточен ли 18+ checkbox, что делать при обнаружении несовершеннолетнего и
    какие данные для проверки возраста нельзя собирать без отдельной необходимости?

## 6. Legal UX matrix на подтверждение

Это proposal для проверки, а не готовый законный экран.

| Шаг | Короткий UI | Полный документ | Acceptance evidence |
|---|---|---|---|
| Первый визит | Essential cookies работают; optional выключены до выбора; «Принять / Отклонить / Настроить» | Cookie section/policy | anonymous ID, categories, policy version, timestamp; проверить допустимость |
| Регистрация | Одна ясная фраза acceptance agreement + отдельные элементы только там, где нужен consent; 18+ отдельно | Agreement, privacy notice, PD consent при необходимости | user, versions, timestamp, locale, source; состав подтвердит юрист |
| Seller application | Кратко: eligibility, moderation, public profile, private handoff contact | Author rules + prohibited | versioned seller acceptance |
| Create Work | Права на материалы, достоверность, запрещённое; Work может быть portfolio-only | Author/prohibited rules | повтор только при новой версии или первой публикации |
| Publish auction | Старт, step, end, delivery, невозможность снять из-за цены | Auction/sale rules | Listing-specific seller confirmation + version |
| First bid under version | Сумма/валюта, binding consequence, end/soft-close, delivery/contact | Auction rules | user + rules version; вопрос, достаточно ли once-per-version |
| Fixed buy | Сумма/валюта, продавец, delivery, direct payment, явное confirmation | Fixed rules | transaction-specific confirmation; нельзя заменить старой общей галкой |
| Send offer | Сумма/валюта, expiry/revocation, competing buy, consequence of acceptance | Offer rules | Offer-specific confirmation |
| Seller accepts offer | Сумма, buyer, момент договора, contact release | Offer rules | Accept event + immutable snapshot |
| Reveal contact | Кто увидит какой contact и зачем | Privacy/consent | disclosure audit event |
| Report/error | Что приложится автоматически; preview/remove screenshot; запрет secrets/payment data | Privacy + complaint notice | report record, diagnostics version, retention |
| Footer/settings | Operator details, current documents, withdraw/manage consent, support | Current version pages | public version history |

Юрист должен для каждой строки вернуть минимальный обязательный смысл. Нет
универсального «разрешённого количества символов»: задача — показать существенные
последствия рядом с действием, а полный versioned текст открыть по ссылке.

## 7. Launch gates

Публичный запуск юридически не готов, пока нет:

1. зарегистрированного оператора и реквизитов;
2. выбранных hosting/SMTP/object-storage/analytics processors и data map;
3. письменного BY+RF ответа на разделы A–E;
4. исправленного product contract по offers/replacement/currency;
5. вычитанного final document set без future-feature fiction;
6. versioned TermsAcceptance/consent/cookie/disclosure evidence в коде;
7. проверенных footer, registration, action confirmations, complaint/privacy и
   withdrawal/subject-request paths.

Закрытый локальный тест без реальных денег и публичного привлечения остаётся
отдельным operational решением; он не превращает drafts в готовые публичные документы.
