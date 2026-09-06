# bidplace — проверка marketplace, abuse и BY legal research

Дата проверки: 2026-09-06

Проверенный источник:
[`docs/research/raw/2026-09-06-researcher-marketplace-abuse-by-legal-response.md`](../research/raw/2026-09-06-researcher-marketplace-abuse-by-legal-response.md)

Задания: T01, T11, T12R. Режим: review-only; исследовательские рекомендации не
становятся решениями продукта или юридическим заключением.

## 1. Вердикт

| Блок | Вердикт | Что пригодно | Почему не закрыт полностью |
|---|---|---|---|
| T01 marketplace mechanics | **ЧАСТИЧНО / полезно для выбора вариантов** | Auction/fixed/offer разделены; eBay/Etsy/Catawiki/Whatnot дают реальные альтернативы; second chance описан отдельным действием; races и immutable history отмечены. | Внутренние `turn*` citations не переносимы; часть source register не содержит прямого URL; Bidbaits current flow и несколько platform details остались `NOT VERIFIED`; отдельный deliverable по prompt не создан. |
| T11 auction abuse | **ЧАСТИЧНО / направление качественное** | Threat model не приравнивает IP/device к вине; предлагает direct self-bid block, append-only evidence, reversible flags, manual review and appeal. | Нет проверяемой claim-to-source таблицы для каждого существенного вывода; внутренние detector mechanics закономерно неизвестны; часть будущих controls требует ещё data/legal decision. |
| T12R право Беларуси | **ЧАСТИЧНО / privacy-блок сильный** | Официальные материалы НЦЗПД подтверждают требования к consent, contract basis, minimization, transfer and breach handling; МНС подтверждает новый gate перечня разрешённых видов ИП с 2026 года. | Большинство commerce/contract/consumer/currency/moderation/IP вопросов не закрыто. Вывод по ОКЭД неполон: доступный текст приложения № 1 уже позволяет различить группы `62`, `731` и отсутствие общего `6312`. Российский блок остаётся отдельным counsel gate. |
| Формат результата | **НЕ ГОТОВО** | Автор честно указал отсутствие repository access и `NOT VERIFIED`. | Три результата объединены в один текст; нет ожидаемых отдельных files, стабильных citations, branch/commit и correction-ready evidence table. |

Ответ нельзя использовать как готовый legal/product contract. Его можно использовать
как качественный вход для решения основателя и для сокращения вопросов юристу после
одного correction pass.

## 2. Что подтверждено независимой выборочной проверкой

### Marketplace mechanics

- [eBay Best Offer](https://www.ebay.com/help/buying/buy-now/making-best-offer?id=4019)
  подтверждает 24-часовое окно ответа seller, counteroffer и сценарий, где accepted
  offer не резервирует item до оплаты. Условия зависят от payment/autopay flow.
- [eBay unpaid item policy](https://www.ebay.com/help/payment-policies/default/unpaid-item-policy?id=4271)
  подтверждает четыре календарных дня, запись unpaid cancellation и возможность appeal.
- [eBay Second Chance Offer](https://www.ebay.com/help/selling/listings/making-second-chance-offers?id=4142)
  подтверждает отдельное предложение non-winning bidder по его последней ставке после
  отмены original unpaid transaction. Buyer сам принимает его; срок выбирается отдельно.
- [Etsy Make an Offer](https://help.etsy.com/hc/en-gb/articles/16792774373143-How-to-Use-the-Make-an-Offer-Tool)
  подтверждает: seller final price действует 48 часов, buyer не обязан купить, item не
  резервируется, изменение listing price аннулирует offers. Функция ограничена USD и
  остаётся тестируемой возможностью Etsy, поэтому это pattern, не универсальный стандарт.
- [Catawiki non-payment flow](https://www.catawiki.com/en/help/seller-payment-issues/what-happens-if-the-buyer-does-not-pay-for-my-object)
  подтверждает 3-дневный срок и возможность multi-offer второму/третьему bidder на
  днях 7–9. Это payment-integrated flow и не переносится целиком в bidplace.
- [Catawiki Terms](https://www.catawiki.com/en/help/buyer-terms/general-terms-of-use?1519129965=)
  подтверждают binding bids/Buy Now, 90-second extension в последнюю минуту и отдельные
  after-auction options. Catawiki имеет fees, payment and notary model, которой нет у
  bidplace.

Следовательно, основной исследовательский вывод устойчив: индустрия не даёт одного
стандарта offer/non-payment/second chance. Для bidplace нужен явный state machine и
transaction-specific acceptance, а не копирование срока конкурента.

### Персональные данные Беларуси

- [НЦЗПД о согласии](https://cpd.by/zachita-personalnyh-dannyh/grajdaninu/soglasiye-na-obrabotku-personalnykh-dannykh/)
  прямо требует свободного, однозначного и информированного consent; указывает, что
  согласие нельзя связывать с принятием договора, несвязанные цели следует разделять,
  cookie wall и заранее проставленные checkbox проблемны.
- [НЦЗПД о правовых основаниях](https://cpd.by/zachita-personalnyh-dannyh/operatoru/pravovye-osnovanija-obrabotki/)
  подтверждает, что обработка, необходимая для договора с субъектом, может иметь
  отдельное от consent основание. Это не разрешает объявить любую аналитику или
  маркетинг «необходимыми для договора».
- [НЦЗПД о трансграничной передаче](https://cpd.by/zachita-personalnyh-dannyh/operatoru/transgranichnaya-peredacha/)
  относит государства ЕАЭС к обеспечивающим надлежащий уровень защиты с белорусской
  стороны. Это не закрывает самостоятельные требования РФ.
- [МНС о деятельности ИП с 1 января 2026](https://nalog.gov.by/news/33527/)
  подтверждает обязательную цепочку: фактическая деятельность → ОКЭД → наличие в
  приложении № 1 к постановлению № 457.

Вывод исследователя о blanket consent верен. Старую схему «три обязательные галочки»
нельзя отдавать дизайнеру как финальный legal UX до purpose-by-purpose mapping.

## 3. Findings

### [P0] ОКЭД исследован недостаточно и устный совет нельзя считать подтверждённым

Исследователь остановился на `NOT VERIFIED`, хотя доступная опубликованная копия
приложения № 1 к постановлению № 457 содержит:

- группу `62` — компьютерное программирование, консультационные и сопутствующие услуги;
- группу `731` — рекламную деятельность;
- `63119` — только в части предоставления места и времени для рекламы в интернете;
- общего `6312` / деятельности web portals в списке не найдено.

Это означает:

- `62.01` и `73.11` могут попадать под более широкие разрешённые группы, если именно
  им соответствует фактическая деятельность;
- совет использовать `63.12` как основной не подтверждается найденным приложением и
  может оказаться несовместимым с перечнем для ИП;
- `63119` нельзя подменять общим ведением web portal: в приложении есть узкое примечание
  про предоставление рекламного места/времени.

Источником проверки служат официальный комментарий МНС и опубликованная копия текста
постановления с приложением. До регистрации нужны официальный актуальный экземпляр,
письменное сопоставление фактической модели и ответ компетентного органа/юриста. Это
P0 business-form gate, а не основание самостоятельно выбрать новый код.

### [P1] Research citations непереносимы

Маркеры `turn25search7`, `turn21view0` и `filecite` работают только внутри исходной
research session. После вставки в repository reviewer не может открыть их. Direct URL
register частично исправляет проблему, но не для каждого существенного утверждения.

Correction должен заменить каждый claim-level marker на стабильную Markdown-ссылку,
название страницы, дату доступа и, для закона, статью/пункт/редакцию.

### [P1] Юридическое покрытие остаётся недостаточным для public MVP

Сам отчёт оставляет `NOT FOUND` или `PARTIAL` по operator qualification, public
requisites, document set, auction/fixed/offer contract moments, consumer status,
cancellation, second chance, currency, moderation, photo licence and minors. Эти
вопросы определяют реальный UI и договорную модель. Статус legal остаётся launch gate.

### [P1] Исследователь повторно открыл уже подтверждённый soft close

Текущий owner contract фиксирует bid в последние 60 секунд → продление на 60 секунд,
с общим cap 600 секунд. `DEC-075` не пересматривает этот пункт. Catawiki 90 seconds —
полезное сравнение, но не причина молча вернуть soft close в founder questions.
Изменение возможно только новым явным решением основателя.

### [P1] Resale option B не является равноправным вариантом MVP

Product foundation исключает general resale/resellers, а основатель отдельно просил
запретить перепродажу приобретённой работы на этой же площадке. Creator-only остаётся
MVP boundary. Controlled provenance resale можно хранить как future hypothesis, но
нельзя проектировать сейчас или ставить рядом с A как уже открытый MVP выбор.

### [P2] Рекомендация 72 часа слабо обоснована

eBay использует 4 дня, Catawiki 3 дня, материалы Bidbaits конфликтуют между 48 часами,
3 и 7 днями. Из этого не следует, что 72 часа оптимальны именно для off-platform сделки
bidplace. Нужны pilot operating assumptions: канал контакта, выходные, способ доказать
ответ, reminder schedule и момент lawful second chance.

### [P2] Marketplace scope выполнен одним монолитом

T01, T11 и T12R требовали отдельные outputs, чтобы независимо менять evidence и
отправлять legal часть юристу. Монолит затрудняет versioning и review. Raw следует
сохранить неизменным, а correction разложить по трём dated documents.

## 4. Что уже можно использовать

Без нового product decision можно использовать как design/engineering constraints:

- Work, Listing, transaction attempt and events имеют разные identities/lifecycles;
- cancellation/non-payment не удаляет историю;
- fixed buy и offer acceptance для единственного Work требуют atomic server outcome;
- second chance не переписывает прежнего winner и должен быть отдельным auditable action;
- контакты runner-up не раскрываются до отдельного разрешённого transition;
- direct self-bid блокируется по ownership без device fingerprint;
- IP/device/location совпадение является сигналом, а не доказательством;
- жалоба, evidence, решение и appeal хранятся раздельно;
- optional cookies/marketing purposes нельзя прятать в blanket registration consent.

Это не определяет contract moment, expiry, cancellation rights, retention или public copy.

## 5. Что остаётся на решение основателя после correction

| ID | Решение | Состояние evidence |
|---|---|---|
| D01 | Offer: final acceptance/reservation/final buyer confirm; expiry; counteroffer | Рыночных вариантов достаточно; legal gate открыт. |
| D02 | Non-payment и sequential second-chance offer | Separate-offer pattern подтверждён; legal/contact gate открыт. |
| D03 | Contact/payment window и reminders | Единого стандарта нет; operating assumptions отсутствуют. |
| D04 | BYN only либо BYN + labelled RUB hint | Market pattern понятен; currency/consumer gate открыт. |
| D05 | Contract moment и minimum nearby terms | Исследованием не закрыт; нужен BY+RF юрист. |
| D06 | Cookies/analytics choices | Consent principles подтверждены; фактический cookie/provider map отсутствует. |

Soft close и creator-only MVP resale boundary в этот список не добавляются без
отдельной просьбы основателя пересмотреть их.

## 6. Следующий шаг

1. Отдать исследователю correction prompt T13R.
2. Получить три самостоятельных files со стабильными direct citations.
3. Отдельно закрыть официальное приложение № 1/ОКЭД и actual-activity mapping.
4. После correction дать основателю D01–D04 на выбор.
5. Передать T02 практикующему BY+RF юристу с фактическим processor/data map.
6. Только после written answer менять public drafts, legal UX and fixed/offer code.
