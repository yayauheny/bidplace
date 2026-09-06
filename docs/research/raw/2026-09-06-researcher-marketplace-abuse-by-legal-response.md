# bidplace — глубокое исследование marketplace mechanics, auction abuse и правовой рамки Беларуси

## Рамка исследования и итоговый статус

Исследование выполнено по состоянию на **6 сентября 2026 года**. В качестве обязательной продуктовой базы использован переданный контекст bidplace: creator-first модель, отдельные сущности **Work** и **Listing**, три формата MVP — scheduled auction, fixed-price sale и buyer offer, отсутствие встроенной оплаты и доставки, бесплатный public MVP, серверное определение победителя, неизменяемая история завершённых/отменённых продаж, кабинет «Покупки / Продажи», жалобы, audit trail и запрет self-bidding/shill bidding. Текущие BYN, 48 часов на контакт и admin replacement следующего участника являются runtime-состоянием, а не подтверждёнными финальными решениями. fileciteturn0file0

Юридический пакет также правильно считает открытыми применимость права РФ, контрактные моменты в трёх форматах, second chance, раскрытие контактов, валюту, cookies, diagnostics, retention и лицензию на изображения; Bidbaits рассматривается только как наблюдаемая практика другой площадки, а не источник права Беларуси или России. fileciteturn0file2 fileciteturn0file4 Сырой архив Bidbaits подтверждает, что даже внутри одной площадки могут расходиться формальные правила и help-тексты: например, соглашение говорит о 48 часах на контакт, а советы продавцам — о напоминании через 3 дня и возможности считать сделку незавершённой через 7 дней. Это хороший аргумент в пользу единого versioned transaction contract в bidplace. fileciteturn0file3

**Итог по пакетам:**

| Пакет | Статус | Почему |
|---|---|---|
| Marketplace mechanics | **COMPLETE с явными NOT VERIFIED** | Все 12 тем покрыты; по eBay, Etsy, Bidbaits, Catawiki и Whatnot найдены первичные источники либо отсутствие публичной проверки помечено отдельно. |
| Auction abuse | **COMPLETE с явными NOT VERIFIED** | Все 12 threat areas покрыты; shill bidding отделён от account linkage/IP coincidence, предусмотрены false positives и appeal. |
| BY legal primary-source | **PARTIAL** | НЦЗПД и МНС дали сильную первичную базу по персональным данным и ограничениям ИП с 2026 года, но прямой текст ряда актов на `pravo.by` в исследовательском браузере отвечал `403`; точный список разрешённых ОКЭД из приложения к постановлению № 457, гражданско-правовые contract moments, consumer law, currency/advertising и часть moderation law нельзя добросовестно объявить проверенными. |
| Git/repository deliverables | **BLOCKED в этой среде** | Репозиторий `/Users/yayauheny/projects/bidplace` здесь не подключён. Ветки, commit SHA, diff stat и запись файлов в `docs/research/` не выполнялись и не имитируются. App code, schemas, product decisions, Figma и `.pen` не изменялись. |

Особенно существенна одна юридическая находка: **устная гипотеза о регистрации именно ИП с ОКЭД 63.12/62.01/73.11 пока не должна считаться подтверждённой**. МНС прямо указывает, что с **1 января 2026 года** ИП может осуществлять только виды деятельности из приложения 1 к постановлению Совмина № 457 и обязан сопоставить фактическую деятельность одновременно с ОКЭД и этим перечнем; деятельность вне перечня для ИП считается незаконной. В доступных официальных страницах точное присутствие `63.12`, `62.01` и `73.11` в приложении не раскрылось, поэтому здесь нужен отдельный P0-check официального приложения, а не подтверждение по одному названию кода. citeturn25search0turn25search4turn25search7

## Сравнение marketplace mechanics

### Исполнительная матрица

| Тема | eBay | Etsy | Bidbaits | Catawiki | Whatnot | Вывод для bidplace |
|---|---|---|---|---|---|---|
| Auction bid / binding | Ставка означает согласие купить при победе; отзыв ограничен специальными случаями. citeturn2view1 | Стандартный auction mechanism в исследованных официальных материалах **NOT VERIFIED**. | Архив соглашения: продавец должен продать победителю; собственные ставки/price pumping запрещены. fileciteturn0file3 | Ставки и auction transactions прямо названы binding. citeturn12search4turn12search11 | «You bid, you buy»; bids binding, отмена после победы ограничена. citeturn5search8turn16search4 | Перед первой ставкой нужен короткий consequence notice + immutable bid event; точный юридический момент — LAWYER GATE. |
| Bid retraction | Допускается узко: существенное изменение описания или ошибочная сумма; при <12 ч до конца — специальное ограниченное окно. citeturn2view1 | N/A / NOT VERIFIED. | Публичная актуальная процедура **NOT VERIFIED**. | Max bid нельзя отменить или уменьшить. citeturn6search6 | Pre-bid нельзя отменить/изменить; после покупки cancellation — отдельный процесс. citeturn5search1turn5search9 | Не давать произвольное delete-bid. Возможны A: вообще без отзыва; B: узкое mistake window; C: support-reviewed retraction с audit. |
| Soft close | Публичного подтверждения автоматического продления в найденных материалах нет: **NOT VERIFIED**. | N/A. | На текущей auction page наблюдается «Антиснайпер», но величина продления выводится шаблонным placeholder: точный алгоритм **NOT VERIFIED**. citeturn7search8 | Обычный аукцион: ставка в последнюю минуту добавляет 90 секунд; Live Auction — отдельная короткая схема. citeturn6search5turn12search0 | Live auction использует таймер; точная универсальная soft-close формула для всех форматов в найденном публичном evidence **NOT VERIFIED**. | Soft close — продуктовый выбор, а не «industry law». |
| Seller cancellation/edit | Существенные правки ограничиваются после ставок; early ending auction ограничен; систематические early endings могут привести к ограничениям. citeturn2view4turn2view5 | Listing можно deactivate/reactivate; после покупки cancellation делает seller. citeturn4search1turn4search12 | Архив позволяет seller снять lot даже после ставок, но частые снятия могут повлечь блокировку — pattern, который для bidplace лучше не копировать. fileciteturn0file3 | После начала auction объект удалить нельзя кроме исключительных случаев; низкая финальная цена не освобождает от продажи. citeturn12search3turn12search4 | Seller не должен отменять из-за неудовлетворительной цены; повторные cancellations влияют на account standing. citeturn5search0turn5search3 | После первой ставки блокировать price/essential-term edits и «не понравилась цена» как обычную причину отмены. |
| Non-payment | Buyer должен оплатить в течение 4 календарных дней; после этого seller может cancel; возможен second chance. citeturn1search2turn1search4 | Платёж встроен; общий auction nonpayment неприменим. | Формальный текст: 48 ч; seller advice: reminder на 3-й день, возможная незавершённость на 7-й. fileciteturn0file3 citeturn7search0turn7search1 | Auction payment — 3 дня; затем reminders и дальнейший recovery/second-offer flow. citeturn6search8turn6search4 | Платёж обычно связан с самой покупкой; cancellation/refund abuse отслеживается. citeturn5search1turn5search5 | У bidplace off-platform settlement: 48 часов — не доказанный стандарт. Реалистичнее исследовать 72 ч и 7 дней как альтернативы. |
| Second chance | Это **новое предложение** одному или нескольким non-winning bidders; seller выбирает, цена равна их последней ставке; original order сначала отменяется при nonpayment. citeturn3search17turn3search9 | N/A. | Публичная current next-bidder схема **NOT VERIFIED**. | На днях 7–9 может открываться предложение второму и третьему bidder; побеждает первый eligible, кто оплатил. citeturn6search8 | Универсальный ranked second-chance mechanism **NOT VERIFIED**. | Сильнейший pattern — не превращать второго автоматически в «старого победителя», а создать новый auditable second-chance offer. |
| Fixed price | Fixed listing; seller может end; изменения ограничиваются состоянием listing/offers. citeturn2view4turn2view5 | Listing-centric purchase; после заказа отменяет seller; sold-out item после cancellation не relist автоматически. citeturn4search1 | Публично есть fixed listings и checkout/order. citeturn7search2turn7search6 | Buy Now существует наряду с auction; payment flow отличается от auction. citeturn6search8turn6search9 | Buy It Now существует; offer может конкурировать с обычной покупкой. citeturn5search7 | Для inventory=1 требуется серверная атомарность: ровно один успешный confirmation/sale transition. |
| Buyer offer | Accept/reject/counter; buyer offer обычно 24 ч, seller counter — до 96 ч в соответствующей схеме; конкурирующие предложения возможны. citeturn3search7turn3search5turn3search11 | Offer не обязывает buyer и **не резервирует item**; seller final price действует 48 ч; изменение listing price аннулирует открытые offers. citeturn4search5turn4search13 | Buyer-offer lifecycle **NOT VERIFIED**. | Сопоставимая публичная offer-механика **NOT VERIFIED**. | Open offer auto-expires через 30 дней; buyer может отменить; seller может counter; acceptance создаёт покупку/charge. citeturn5search7 | Для bidplace нужно заранее выбрать, binding ли seller acceptance, нужен ли final buyer confirm и резервируется ли Work. |
| Currency | Marketplace поддерживает multi-currency; точные BYN/RUB rules в исследованных страницах **NOT VERIFIED**. | Buyer может выбрать display currency; конверсия помечена приблизительной, rates регулярно обновляются; checkout currency может отличаться. BYN/RUB не входят в найденный список Etsy Payments currencies. citeturn15search2turn15search3 | Основная наблюдаемая валюта — RUB; universal conversion metadata **NOT VERIFIED**. | Account может иметь preferred display currency; точное происхождение/timestamp каждой конверсии публично не установлено. citeturn15search1 | BYN/RUB viewer-conversion mechanism **NOT VERIFIED**. | На MVP безопаснее отделить **contract currency** от необязательного «≈ RUB» hint и snapshot-ить rate metadata, если hint вообще будет включён. |
| Work vs Listing | eBay в основном listing-centric; duplicate-listing rules регулируют listing, не creator Work history. citeturn14view1 | Listing-centric; деактивация/renewal не создаёт подтверждения Work-first provenance model. citeturn4search12 | Lot/listing-centric. citeturn7search2 | Есть object submission → auction lifecycle, но это не прямое доказательство нужной bidplace model. citeturn12search1 | Listing/show-centric. | **CONFIRMED PRODUCT DECISION:** сохранить bidplace Work-first; конкурентам здесь не нужно подражать. fileciteturn0file0 |
| Cabinet/history | My eBay/Seller Hub содержит Bids/Offers, Purchase History, Selling и sold items. citeturn13search2turn13search4 | Orders & Shipping сохраняет cancelled orders. citeturn4search1 | «Покупки/Продажи» и review по cancelled/completed orders наблюдаются в FAQ/archive. citeturn7search1 fileciteturn0file3 | Seller statuses включают auctioned, payment received, not sold, cancelled. citeturn12search1 | Activity/Offers/Purchases используются для состояния сделок и offers. citeturn5search6turn5search7 | Подтверждает выбранный bidplace pattern: active/history/problem + cancelled rows, а не удаление истории. |
| Complaints/notifications | Report seller, seller protections, account restrictions, messages/notifications. citeturn13search15turn13search4 | Help with order → seller contact → case; Messages. citeturn4search0 | Support/email/IP route; onsite messages используются как evidence. citeturn7search1 | Help Centre/Orders → support; outcomes include cancellation, restriction/suspension; email/in-app bid notifications. citeturn12search1turn12search3 | Profile/listing/order reports; attachments; support ticket; transactional notifications. citeturn5search6turn5search10 | Разделить report Work/seller/order от technical error report; in-app как canonical channel, email — transaction/security subset. |

### Наиболее важные наблюдаемые механики

**PRIMARY-SOURCE FACT — eBay.** Ставка не является свободно удаляемой записью: eBay связывает bid с намерением купить и допускает retraction только в ограниченных обстоятельствах. Одновременно eBay ограничивает существенные изменения auction listing после появления bid и early termination аукциона. Это сильный UX/audit precedent для bidplace, но не доказательство белорусской договорной квалификации. citeturn2view1turn2view4turn2view5

**PRIMARY-SOURCE FACT — second chance.** eBay не превращает автоматически runner-up в первоначального победителя: Second Chance Offer создаётся как отдельное предложение non-winning bidder; в случае nonpayment первоначальный order сначала отменяется. Catawiki реализует другой вариант: после неоплаты предложение может перейти к второму и третьему участникам, причём приобретает тот eligible bidder, кто первым выполняет требуемый payment step. Оба паттерна лучше поддерживают отдельную историю transitions, чем скрытая замена `winner_id`. citeturn3search17turn6search8

**PRIMARY-SOURCE FACT — offer races.** Etsy показывает особенно полезную модель для bidplace без встроенной оплаты: buyer offer не означает purchase, seller acceptance/final price не резервирует предмет, а покупатель получает 48 часов на checkout; предмет всё ещё может купить другой пользователь. Whatnot использует гораздо более длинное 30-дневное default expiry открытого offer и разрешает buyer отменить его до acceptance. eBay демонстрирует ещё более transaction-heavy модель со встречными предложениями и разными expiry windows. Значит, «рынок использует стандартный срок offer» — неверный вывод: механика фундаментально различается. citeturn4search5turn4search13turn5search7turn3search5

**PRIMARY-SOURCE FACT — currency hints.** Etsy явным образом отделяет listing currency от preferred browsing currency, называет display conversion приблизительной и предупреждает, что в некоторых случаях checkout возвращается к listing currency. Это ровно тот UX pattern, который можно изучать для `BYN contract price + ≈ RUB hint`, но rate source, timestamp, округление и допустимый disclaimer для BY/RF — отдельный LAWYER GATE. citeturn15search2turn15search3

### Жизненные циклы, которые должен уметь выразить bidplace

**Auction:**

```text
Work
  ↓
Auction Listing draft
  ↓ publish + seller snapshot
SCHEDULED
  ↓ server start
ACTIVE
  ↓
Bid #1 → Bid #2 → ... → final valid Bid
  ↓ server-owned close
AUCTION_ENDED
  ↓
Winner candidate + immutable auction snapshot
  ↓
[LAWYER GATE: direct-contract moment]
  ↓
Handoff/contact window
  ├─ completed
  ├─ cancelled with reason
  └─ non-payment / no-contact
         ↓
      original sale stays in history
         ↓
      optional Second-Chance Offer
         ↓
      new acceptance/snapshot
```

**Fixed price:**

```text
Work → Fixed Listing ACTIVE
                 ↓
       Buyer opens confirmation
                 ↓
       atomic server commit
          ↙              ↘
    success              already sold
       ↓
transaction snapshot
       ↓
[LAWYER GATE: contract moment]
       ↓
contact handoff → completed / cancelled
```

Самая опасная реализация здесь — сначала показать нескольким пользователям «успешно куплено», а потом разрешить клиентскому UI решить, кто победил. **RECOMMENDATION:** inventory=1 должен переходить в sold/reserved state только одной атомарной серверной операцией; неудавшиеся конкурирующие запросы получают deterministic `already_sold`.

**Buyer offer:**

```text
Buyer submits Offer
        ↓
      OPEN
  ↙      ↓       ↘
revoke  expire   seller action
                  ├─ reject
                  ├─ counter → new Offer state
                  └─ accept
                        ↓
              [A/B/C contract model]
                        ↓
                sale/contact handoff
```

Etsy дополнительно показывает полезное правило invalidation: изменение цены listing делает существующие offers недействительными. citeturn4search5 Для bidplace это должно быть либо таким же явным правилом, либо listing version должен сохранять offer действующим именно против старого snapshot; не должно быть неопределённого третьего состояния.

### Failure и race matrix

| Race/failure | Что нельзя допустить | Детерминированный вариант |
|---|---|---|
| Два fixed-buy одновременно | Два победителя одного physical Work | Server transaction/CAS; первый committed transition выигрывает, остальные получают sold. |
| Seller accepts offer одновременно с fixed buy | Два договора/два contact handoff | Один server ordering point; проигравшее действие получает terminal conflict. |
| Listing price изменён при открытом offer | Неясно, к какой цене относится offer | A: void open offers; B: запрет edit; C: offer остаётся на immutable listing version. Etsy использует A. citeturn4search5 |
| Bid приходит около deadline | Client clock решает победителя | Server timestamp + authoritative auction state/log; Catawiki также делает официальный bidding log источником результата. citeturn6search7 |
| Seller cancel одновременно с bid | Bid исчезает без объяснения | Once bid accepted, cancellation — отдельный audited transition с reason. |
| Winner отвечает после non-payment cancellation | «Возрождение» уже отменённой сделки | Старый transaction остаётся cancelled; возврат возможен только новым explicit agreement. |
| Seller запускает second chance нескольким людям | Раскрытие контактов без определённой сделки | Contact reveal только после выбранного acceptance/contract trigger. |
| Work перевыставлен до закрытия старой проблемы | Две активные продажи одного экземпляра | Active-sale uniqueness rule на физический экземпляр Work. |
| RUB hint меняется после сделки | История показывает новую сумму вместо виденной | Snapshot contract currency + display conversion/rate timestamp отдельно. |
| Scheduled auction не стартовал | Silent +24h меняет условия участия | Уже подтверждённый bidplace rule: cancel + audit + author notification + relist path. fileciteturn0file0 |

## Защита от auction abuse

### Threat model

Для creator-first low-volume marketplace самые опасные угрозы — не обязательно те, для которых нужен сложный fingerprinting. Большая часть P0-risk видима в самой транзакционной истории.

| Угроза | Вероятность | Impact | Выгода атакующего | Пострадавший | Evidence, доступный без invasive tracking |
|---|---|---:|---|---|---|
| Self-bid с тем же account | Средняя | Очень высокий | Поднять цену | Buyer, доверие marketplace | seller user ID, bidder user ID, Listing/Work ID |
| Friend/linked-account shill | Средняя | Очень высокий | Поднять цену без прямого self-bid | Buyer | repeated seller↔bidder graph, timing, cancellations, wins/non-wins; дополнительные device/IP данные — только после legal gate |
| Seller отменяет слишком дешёвый auction | Средняя | Высокий | Не выполнять невыгодную продажу | Winner | winner price, cancellation reason/time, relist history |
| Ложный `buyer_non_payment` | Средняя | Высокий | Снять ответственность с seller | Buyer | contact deadline, notifications, party actions, cancellation actor/reason |
| Serial non-payment | Средняя | Высокий | Disruption/price suppression | Sellers | completed vs unpaid orders, bidder history |
| Disposable/multiple accounts | Средняя | Высокий | Обход санкций | Marketplace/users | account graph; сама множественность accounts **не доказательство злоупотребления** |
| Duplicate unique Work | Средняя | Высокий | Продать один экземпляр несколько раз | Buyers | Work ID, active Listings, archived sales |
| False authorship/resale | Средняя | Очень высокий | Монетизировать чужую репутацию | Автор/buyer | author claim, ownership/provenance, prior bidplace sale |
| Stolen photos | Высокая | Высокий | Сделать fake listing убедительным | Автор/buyer | uploaded media, reports, prior Work media; reverse-image tooling — later |
| Forged provenance/authenticity | Низкая–средняя | Очень высокий | Получить premium price | Buyer/author | seller declarations + submitted evidence; platform не должна обещать экспертизу |
| Complaint abuse | Средняя | Средний | Убрать конкурента/давить на seller | Seller/moderation | reporter history, duplicate reports, outcome history |
| Technical-report abuse | Средняя | Средний | Spam, malicious attachments, leakage | Ops/platform | rate, attachment metadata, report records; не собирать «весь browser/session» автоматически |

**PRIMARY-SOURCE FACT:** eBay определяет shill bidding как ставки с целью искусственно повысить цену/желательность/search standing; прямо включает family, friends, roommates, employees и online connections, запрещает bid на собственные items с другим account и заявляет о системах мониторинга bidding patterns. Возможные меры включают removal, warning, restrictions и suspension. citeturn14view0

**PRIMARY-SOURCE FACT:** Whatnot формулирует почти тот же risk: seller или связанный с seller пользователь, включая family/household/friends/online connections, не должен искусственно повышать цену; Whatnot сообщает, что мониторит bids и transactions. Одновременно Whatnot официально разрешает пользователю несколько buyer accounts. Следовательно, «multiple account = proven shill» — ложная модель даже по практике самой платформы. citeturn16search4turn16search0

**PRIMARY-SOURCE FACT:** eBay тоже допускает несколько accounts, но запрещает использовать их для собственных bids; нарушения одного account могут затрагивать связанные accounts. Это дополнительно подтверждает принцип для bidplace: **account relation — signal, transaction intent/behavior — evidence, policy breach — отдельное решение moderation**. citeturn13search12

**PRIMARY-SOURCE FACT:** Catawiki технически не даёт seller bid на собственный submission через тот же account, отдельно запрещает побуждать других искусственно повышать цену и использует automated + human moderation. В privacy material Catawiki раскрывает использование transaction history, location, technical connection/IP information, communications и risk assessments для fraud/trust-and-safety. Это показывает, какие сигналы возможны у зрелой площадки, но не означает, что low-volume bidplace должен собирать их все. citeturn12search0turn12search7turn12search11turn12search3

**PRIMARY-SOURCE FACT:** Etsy запрещает shilling, в том числе friend/family transactions, compensated third-party behavior и дополнительные accounts, которые притворяются независимыми buyers для искусственного повышения репутации. Это не auction-shill evidence, поскольку исследованный Etsy workflow не является auction workflow, но полезно для будущих reviews/likes. citeturn4search3

### Что площадки делают с дублями, фото и authenticity

eBay запрещает одновременно держать более одного identical fixed-price listing того же seller и отдельно ограничивает identical auctions; duplicate-policy касается search integrity, а не вопроса авторства. eBay также требует от seller следить за authenticity/IP и рекомендует собственные photos/descriptions вместо чужого контента. citeturn14view1turn13search6

Etsy намного ближе к creator-first позиционированию: handmade item должен быть made/designed seller в предусмотренных policy рамках, seller должен использовать собственные фотографии, а обычная перепродажа commercially available items в большинстве категорий запрещена; допустимы отдельные исключения вроде vintage и supplies. citeturn4search12turn4search4

Whatnot требует seller быть готовым предоставить authenticity evidence для предметов, на которые распространяется counterfeit policy. Важный зрелый pattern — **inconclusive ≠ proven counterfeit**: policy различает подтверждённую подделку, подтверждённую подлинность и ситуацию, когда вывод невозможен; единичный inconclusive outcome сам по себе не должен автоматически наказывать seller, хотя повторяемость может стать сигналом для дополнительной проверки. Это очень хороший precedent для разделения `signal / allegation / finding`. citeturn16search1

Catawiki до listing review проверяет description/photos и при необходимости provenance documentation, использует human+automated moderation, но это не повод для bidplace обещать такую же экспертизу. citeturn12search7

### P0-контроли для low-volume pilot

**RECOMMENDATION — hard block.** Запретить user технически разместить bid на Listing, где он является seller/author-side owner. Для этого не нужны IP, device fingerprint или payment data: достаточно `seller_user_id`, `bidder_user_id`, `listing_id`. Это прямо соответствует уже подтверждённому правилу bidplace и практике eBay/Catawiki. fileciteturn0file0 citeturn14view0turn12search0

**RECOMMENDATION — immutable cancellation evidence.** Любая отмена должна хранить `actor`, `reason`, `timestamp`, предыдущее состояние, winning bid/price snapshot и связь с новым relist. Причина `buyer_non_payment` не должна быть доступна seller до объективно наступившего deadline. Seller cancellation из-за низкой цены должна быть отдельной policy violation/anomaly category, а не маскироваться под non-payment. eBay прямо запрещает злоупотреблять причиной «buyer hasn’t paid», а Catawiki считает низкую финальную цену недостаточным основанием отказаться от продажи. citeturn1search4turn12search4

**RECOMMENDATION — no silent history deletion.** Canceled auction/order остаётся в read-only history. Это уже confirmed bidplace decision и одновременно делает abuse detection возможным без новых персональных данных. fileciteturn0file0

**RECOMMENDATION — graph flags, not auto-bans.** Для ручной очереди moderation считать reversible flags по существующим событиям: повторные auctions одного seller с одними и теми же bidders; частый runner-up после одного связанного bidder; unusually frequent seller cancellation/relist; serial non-payment; повторные reports, систематически признанные необоснованными. Ни один такой сигнал отдельно не является доказательством shill/fraud.

**RECOMMENDATION — unique physical instance control.** Если Work описывает один конкретный физический экземпляр, не разрешать одновременно две активные sale Listings для этого экземпляра. Это должно быть отличимо от легитимного edition/multiple-unit Work, если такие модели появятся позже.

**RECOMMENDATION — report + appeal.** Модератор должен видеть allegation, evidence, user response, decision и appeal отдельно. Whatnot counterfeit handling особенно полезен как пример того, что seller получает возможность предоставить evidence до окончательного authenticity finding. citeturn16search1

### Что не включать как P0 hard block

Не следует блокировать account только потому, что совпал **IP, device, Wi‑Fi, город, фамилия или контактный домен**. Общая сеть в семье, студии, офисе, университете или мобильном операторе создаёт очевидные false positives; сами крупные платформы разрешают multiple accounts в определённых сценариях. eBay и Whatnot подтверждают допустимость нескольких accounts при запрете конкретных abusive действий. citeturn13search12turn16search0

Сбор persistent device fingerprint, full IP history, behavioral fingerprint, cross-site identifiers, payment linkage или широких session breadcrumbs должен быть **P1/later + LAWYER GATE**, а не скрытым условием пилота. Официальная белорусская рамка требует ограничивать данные заявленной целью и не собирать избыточные данные. citeturn23view1

### Варианты политики duplicate/resale

| Вариант | Механика | Плюсы | Риски |
|---|---|---|---|
| **A — creator-only** | Work может продавать только подтверждённый creator; вторичная перепродажа внутри bidplace запрещена | Максимально чистое creator-first позиционирование; простая moderation policy | Законный владелец оригинала не сможет перепродать; provenance history обрывается |
| **B — controlled secondary ownership** | Secondary sale разрешён законному владельцу; `creator` остаётся неизменным, seller указывается отдельно; Work/derived resale связывается с provenance и предыдущей sale history | Не смешивает авторство и владение; сохраняет происхождение; не превращает resale в ложное авторство | Нужны ownership-transfer rules, evidence и lawyer validation |
| **C — open resale marketplace** | Любой законный owner может создать resale listing с attribution | Самая широкая ликвидность | Сильно отдаляет продукт от creator-first, резко увеличивает counterfeit/IP/duplicate workload |

**Research preference:** B — наиболее содержательная архитектурная альтернатива, если основатель вообще хочет разрешить secondary market. Она не должна молча становиться решением. A остаётся вполне последовательным MVP-вариантом. C противоречит заявленным границам продукта и для MVP выглядит как pattern to reject. fileciteturn0file0

## Правовая карта Беларуси по первичным источникам

### Что уже подтверждается официальными материалами

**PRIMARY-SOURCE FACT — consent не должен быть «галкой на всё».** Национальный центр защиты персональных данных Беларуси разъясняет, что consent должен быть свободным, однозначным и информированным; его нельзя механически связывать с принятием договора, а одно согласие на несколько несвязанных целей по общему правилу не обеспечивает свободный выбор. Предварительно отмеченные checkbox и отсутствие сопоставимой возможности отказаться приводятся как проблемные примеры; cookie wall также приводится как пример несвободного consent. citeturn21view0

Следовательно, существующая идея «обязательно принять Agreement + Privacy Policy + универсальный PD Consent для регистрации» действительно требует пересмотра. **INFERENCE:** Privacy notice лучше рассматривать как информирование; данные, необходимые для договора с самой платформой, следует map-ить к соответствующему основанию, а отдельный consent оставлять там, где он реально нужен. НЦЗПД прямо разъясняет, что обработка данных стороны договора, необходимая для заключения/исполнения договора с оператором, может выполняться без отдельного consent по абзацу пятнадцатому статьи 6 Закона № 99-З. citeturn23view0turn21view0

**PRIMARY-SOURCE FACT — data minimization и retention.** НЦЗПД указывает: цели должны быть конкретными и заранее заявленными; объём данных не должен быть избыточным; идентифицируемые данные хранятся не дольше, чем того требуют заявленные цели. Поэтому идея одного срока вроде «храним все audit/log/contact data 5 лет» без per-purpose analysis не поддерживается официальной рамкой. citeturn23view1

**PRIMARY-SOURCE FACT — cross-border.** НЦЗПД указывает, что для государств с надлежащим уровнем защиты применяются общие правила без дополнительного разрешения; в перечень включены государства — члены ЕАЭС. Для стран без надлежащего уровня действует запрет с перечисленными законом исключениями, среди которых informed consent с предупреждением о рисках, contract necessity и отдельное разрешение Центра. citeturn23view2

**INFERENCE:** с белорусской стороны передача в Россию имеет более простой режим, поскольку РФ — член ЕАЭС; это **не отвечает** на отдельный российский вопрос о localization, уведомлении Роскомнадзора и применимости 152-ФЗ к белорусскому оператору. Этот блок остаётся **RF COUNSEL** именно так, как уже зафиксировано в вашем legal gap package. fileciteturn0file2

**PRIMARY-SOURCE FACT — breach process.** Оператор обязан уведомить НЦЗПД о подпадающем под требование нарушении системы защиты незамедлительно, но не позднее **трёх рабочих дней** после того, как ему стало известно о нарушении; официальная страница также перечисляет сведения, включаемые в уведомление, и исключения, установленные приказом Центра. citeturn24view0

**PRIMARY-SOURCE FACT — operator registry needs review before launch.** НЦЗПД ведёт реестр информационных ресурсов, содержащих персональные данные, и описывает обязанности операторов по внесению в него соответствующих систем при выполнении установленных критериев. Точное применение этой нормы к планируемому ИП bidplace следует подтвердить применительно к его форме и системе, а не выводить из одной общей страницы. citeturn24view1

**PRIMARY-SOURCE FACT — cookies UX evidence.** Сам сайт НЦЗПД показывает пользователю `Принять` и `Отклонить`, а разъяснение по consent отдельно осуждает отсутствие реальной возможности отказаться и cookie walls. Это сильный официальный UX/evidence signal против Bidbaits-подхода «продолжая использовать сайт, вы соглашаетесь», но точный набор cookies bidplace, которые требуют consent, всё равно должен определяться по фактическим purposes/providers. citeturn20view0turn21view0 Raw Bidbaits действительно использует широкую формулу continuing-use consent, которую переносить в bidplace нельзя. fileciteturn0file3

### Критический вопрос формы ИП и ОКЭД

МНС сообщает, что с **1 января 2026 года** ИП вправе осуществлять только виды деятельности из перечня, установленного постановлением Совета Министров от 28 июня 2024 г. № 457; фактическую деятельность нужно сначала сопоставить с ОКЭД ОКРБ 005-2011, а затем с разрешённым перечнем. Для иных разрешённых видов деятельности, которые не подпадают под ограниченный единый налог, в 2026 году действует общий порядок налогообложения. citeturn25search7turn25search1

Из этого **нельзя** получить вывод «63.12 точно разрешён» или «62.01 точно разрешён». В текущем browsing evidence приложение 1 не раскрыло содержимое этих строк, а поиск по кодам выдавал российские, а не белорусские записи. Поэтому:

> **P0 / NOT VERIFIED:** `63.12` основной, `62.01` и `73.11` дополнительные пока не подтверждены официальным приложением № 1 к постановлению № 457. Аналогично не подтверждён совет специально избегать `64.19`, `64.92`, `92.00`, `47.91`.

Это один из наиболее важных результатов исследования: регистрационную форму бизнеса нельзя проектировать на основании старой устной схемы до проверки **фактической деятельности bidplace → ОКЭД → приложение № 1 № 457**. citeturn25search0turn25search4turn25search7

### Coverage исследовательских вопросов и исходного legal pack

Статусы ниже означают: `ANSWERED` — есть пригодный официальный primary evidence; `PARTIAL` — есть официальная норма/разъяснение, но она не закрывает конкретную модель bidplace; `NOT FOUND` — в текущем проходе нет достаточного первичного источника; `RF COUNSEL` — вопрос нельзя закрыть исследованием белорусского права.

| Исходный вопрос | Статус | Результат |
|---:|---|---|
| 1 | PARTIAL / P0 | ИП как форма возможна только для разрешённых с 2026 видов деятельности; квалификация именно marketplace bidplace не установлена. citeturn25search7 |
| 2 | PARTIAL / P0 | Требуется actual-activity → ОКЭД → Annex 1 №457; конкретные `63.12/62.01/73.11` NOT VERIFIED. citeturn25search7 |
| 3 | NOT FOUND | Полный набор публичных реквизитов ИП/сервиса для этой модели по official sources не закрыт. |
| 4 | RF COUNSEL | Применимость российского consumer/information/advertising/PD law к BY operator требует российского анализа. fileciteturn0file2 |
| 5 | PARTIAL / LAWYER GATE | Квалификация как marketplace/aggregator/agent не доказана первичным BY source. |
| 6 | NOT FOUND | Оптимальный public document set требует lawyer drafting после закрытия модели. |
| 7 | PARTIAL | НЦЗПД имеет operator register; точная обязанность конкретного ИП требует проверки criteria. citeturn24view1 |
| 8 | RF COUNSEL | RF localization не выводится из BY law. |
| 9 | ANSWERED BY-side / RF COUNSEL | Трансграничная передача регулируется статьёй 9 framework; EAEU treated as adequate in BY framework; RF duties separate. citeturn23view2 |
| 10 | PARTIAL | Processors должны попасть в purpose/data map; точный формат naming/DPA требует отдельной нормы/юриста. |
| 11 | PARTIAL | НЦЗПД подтверждает purpose limitation, minimization и contract basis; нужен field-by-field map. citeturn23view0turn23view1 |
| 12 | ANSWERED principle / PARTIAL periods | Нет универсального retention: хранение ограничивается purpose; конкретные сроки по категориям надо определить отдельно. citeturn23view1 |
| 13 | PARTIAL / LAWYER GATE | Contact reveal — отдельная обработка/предоставление данных; основание и минимум полей надо привязать к конкретной сделке. |
| 14 | NOT FOUND / LAWYER GATE | Раскрытие seller контактов нескольких ranked bidders автоматически не подтверждено. |
| 15 | PARTIAL | НЦЗПД подтверждает систему контроля, security/breach functions; внутренний organisational pack требует отдельного mapping. citeturn24view0turn24view3 |
| 16 | PARTIAL, сильное evidence | Consent должен быть свободным, reject реально доступен; exact cookie categories bidplace требуют data map. citeturn21view0 |
| 17 | PARTIAL | Отдельный cookie document vs section policy первичным evidence не закрыт. |
| 18 | PARTIAL | Нельзя автоматически считать analytics «договорно необходимой»; purpose/legal basis надо определить отдельно. citeturn23view0turn23view1 |
| 19 | PARTIAL | Diagnostics допустимо исследовать через minimization/purpose; конкретный набор route/browser/request IDs требует legal mapping. |
| 20 | PARTIAL | Screenshot должен быть user-controlled из-за риска чужих ПД; специальная BY rule для этого flow не найдена. |
| 21 | NOT FOUND | Exact service-vs-marketing notification qualification не закрыта primary evidence. |
| 22 | NOT FOUND / LAWYER GATE | Auction offeror/acceptor не установлен. |
| 23 | NOT FOUND / P0 | Точный direct-contract moment auction/fixed/offer не установлен. |
| 24 | NOT FOUND / P0 | Mandatory pre-action information не закрыта. |
| 25 | PARTIAL / LAWYER GATE | Seller status физлицо/самозанятый/ИП/организация потенциально меняет consumer regime; конкретное применение не подтверждено. |
| 26 | NOT FOUND | Binding period/revocation Bid/Offer требует contract-law research. |
| 27 | NOT FOUND | Допустимые seller cancellation exceptions требуют BY contract/consumer analysis. |
| 28 | NOT FOUND / P0 | Правовая форма second-chance не установлена; market evidence поддерживает отдельный offer, но это не law. |
| 29 | NOT FOUND | «Reasonable» contact/payment window законом не установлен в найденном evidence; 48h/3d/7d — marketplace practice, не норма. |
| 30 | NOT FOUND / LAWYER GATE | BYN-only + RUB hint требует отдельной валютной/consumer проверки. |
| 31 | NOT FOUND | BY/RF notice-and-action по prohibited/IP/fraud требует отдельного legal pass. |
| 32 | NOT FOUND | Hide/temporary/permanent ban + appeal legal minimum не закрыт. |
| 33 | PARTIAL | Complaint/evidence data подпадает под purpose/minimization/retention; специальные сроки не найдены. citeturn23view1 |
| 34 | NOT FOUND | Photo/content licence scope и campaign promotion требуют IP counsel. |
| 35 | NOT FOUND | Withdrawal effect на cache/backups/social ads/history не установлен. |
| 36 | NOT FOUND | Seller declarations не заменяют собственные обязанности platform; конкретный minimum needs counsel. |
| 37 | NOT FOUND / LAWYER GATE | 18+ checkbox и handling discovered minors требуют отдельного анализа; собирать passport «на всякий случай» research не обосновывает. |

Иными словами, Task 12R **сильно продвинул privacy/data block**, но не должен быть выдан за завершённое юридическое заключение. Это соответствует самой постановке вашего legal research task. fileciteturn0file1

### P0 launch gates после исследования

До public launch наиболее опасно оставлять неопределёнными следующие вопросы.

**Форма оператора и деятельность.** Проверить по официальному приложению № 1 к постановлению № 457, вправе ли ИП в 2026 году фактически вести именно такую platform/web-marketplace activity и какие коды ей соответствуют. citeturn25search7

**BY + RF data architecture.** До выбора PostgreSQL hosting, object storage, SMTP, analytics/error tracking и иных providers нельзя закончить processor/country/cross-border map. BY-side framework требует purpose/data minimization и отдельного анализа transfers; RF localization/applicability остаётся RF COUNSEL. citeturn23view1turn23view2

**Contract moments.** Нельзя писать рядом со ставкой «ставка заключает договор», рядом с fixed buy — другое, а offer acceptance — третье, пока BY/RF counsel не подтвердит квалификацию каждого действия. Конкурентская практика этого не доказывает.

**Contact disclosure.** Не раскрывать контакты winner, runner-up или seller нескольким лицам просто потому, что runtime умеет это делать. Disclosure должен иметь конкретного получателя, purpose, moment и audit evidence.

**Consent/cookies.** Blanket consent Bidbaits-style нельзя брать как модель. НЦЗПД прямо поддерживает свободный, granular и reversible consent; contract-required processing следует отделять от optional purposes. citeturn21view0turn23view0

**Incident process.** До launch должен существовать operational breach flow, способный зафиксировать момент обнаружения, affected subjects/data, последствия и принятые меры, поскольку применимый BY process предусматривает уведомление не позднее трёх рабочих дней в подпадающих случаях. citeturn24view0

## Варианты MVP и технические последствия

### Открытые решения A/B/C

Ниже — именно **варианты**, а не тихо принятые product decisions.

| Решение | A | B | C | Исследовательская оценка |
|---|---|---|---|---|
| Buyer offer binding | Etsy-like: seller accept → buyer ещё должен final confirm; item не reserved | Seller accept сразу создаёт transaction и блокирует Work | Seller accept создаёт short reservation; buyer final-confirm завершает сделку | **C** хорошо выражает off-platform nature, но создаёт дополнительное abandoned state. **B** проще, но требует особенно чёткого legal consequence. LAWYER GATE. |
| Offer expiry | 24 ч | 48 ч | Seller-selectable из малого набора, например 24/48/72 ч | Рынок не даёт единого стандарта: eBay ~24 ч для многих buyer offers, Etsy 48 ч final price, Whatnot 30 дней. citeturn3search7turn4search5turn5search7 |
| Counteroffer | Нет | Один seller counter | Symmetric buyer/seller counter chain | **B** — разумный MVP middle ground; сохранять parent offer и версии, не перезаписывать original. |
| Second chance | Automatic next winner | Seller выбирает любого ranked bidder | Sequential Second-Chance Offer по рангу, один active offer одновременно | **C** лучше всего сохраняет ranking + consent/contact minimization. eBay подтверждает new-offer model; Catawiki — ranked recovery. citeturn3search17turn6search8 |
| Можно ли «перепрыгнуть» runner-up | Нет | Да без причины | Да только после documented disqualification/no-response и audit | **C** лучше против seller favoritism/manipulation. |
| Contact reveal | При auction close | После transaction/second-chance acceptance | Минимальный contact только после explicit handoff trigger | **B/C**; раскрытие runner-up до принятия second chance выглядит плохо и privacy-wise, и audit-wise. LAWYER GATE. |
| Non-payment window | 48 ч | 72 ч | 7 дней | Evidence разбросан: eBay 4 дня, Catawiki 3 дня, Bidbaits 48h/3d/7d. Для off-platform pilot **72h** — разумный research candidate, но не decision. citeturn1search2turn6search8turn7search0 |
| Soft close | Hard close | +90 sec when bid in final 60 sec | Configurable by auction | Catawiki подтверждает B как понятный UX. Но founder должен решить, хочет ли bidplace anti-sniping или традиционный hard close. citeturn6search5 |
| Currency | BYN only | BYN contract + `≈ RUB` informational hint | Native BYN or RUB per Listing | **A** минимизирует MVP legal/FX complexity. **B** лучше для RF UX, но требует source/timestamp/rounding/disclaimer. **C** резко увеличивает contract complexity. |
| Resale | Запрещён | Controlled secondary ownership | Open resale | A или B; C не соответствует creator-first MVP. |
| Diagnostics | Только typed report | Standard privacy-safe bundle + preview + optional screenshot | Automatic broad session/device logs | **B** предпочтителен; C для MVP отвергнуть до explicit need/legal gate. |
| Photo licence | Только display Work/listing | Display + отдельный promotion scope | Blanket broad perpetual promotion licence | **A/B**; C не переносить из чужих terms. LAWYER GATE. |

### Cabinet и immutable history

**CONFIRMED PRODUCT DECISION:** один Work должен переживать несколько sale attempts, при этом старый sale не меняется новым. fileciteturn0file0 Из этого естественно следуют четыре уровня данных:

```text
Work
  identity / creator / media / provenance
      ↓
Listing
  format + sale terms + version/snapshot
      ↓
Transaction attempt
  winner/buyer/seller + terminal status
      ↓
Events
  bids / offers / cancellations / disclosures / complaints
```

Это не требование к конкретным названиям SQL-таблиц, а contract boundary. Критично не делать, например, `Work.price = last_sale_price`, если это уничтожает прошлый context.

Для «Покупки / Продажи» достаточно трёх пользовательских bucket-ов:

| Bucket | Примеры |
|---|---|
| Active | active auction bid, open offer, awaiting handoff |
| Problem/action required | awaiting reply, deadline approaching, complaint, cancellation request |
| History | completed, lost auction, expired offer, cancelled/non-paid transaction |

Canceled rows должны оставаться read-only — это уже product decision и одновременно anti-abuse evidence. fileciteturn0file0

### Минимальный audit vocabulary

Без решения о конкретной schema исследование обосновывает как минимум следующие semantic events:

`WORK_CREATED`, `LISTING_PUBLISHED`, `LISTING_TERMS_SNAPSHOTTED`, `BID_PLACED`, `BID_RETRACTION_REQUESTED`, `BID_RETRACTED`, `AUCTION_CLOSED`, `WINNER_DETERMINED`, `FIXED_BUY_CONFIRMED`, `OFFER_CREATED`, `OFFER_REVOKED`, `OFFER_EXPIRED`, `OFFER_COUNTERED`, `OFFER_ACCEPTED`, `SALE_CANCELLED`, `NON_PAYMENT_MARKED`, `SECOND_CHANCE_SENT`, `SECOND_CHANCE_ACCEPTED`, `CONTACT_DISCLOSED`, `RELIST_CREATED`, `COMPLAINT_CREATED`, `MODERATION_ACTION`, `APPEAL_CREATED`, `TERMS_ACCEPTED`.

**RECOMMENDATION:** для integrity-sensitive events не хранить только текущую строку `status=...`; сохранять actor, timestamp, previous/new state и relevant immutable snapshot. Это необходимо и для dispute reconstruction, и для отличения seller cancellation от buyer nonpayment.

### Notification matrix

| Событие | In-app | Email candidate | Причина |
|---|---|---|---|
| Bid accepted | Да | Не обязательно | Immediate UI confirmation |
| Outbid | Да | Да/настройка | Time-sensitive |
| Auction won/lost | Да | Winner — да | Transactional |
| Seller sale notification | Да | Да | Transactional |
| Offer received/countered/accepted | Да | Да для deadline-sensitive | Transactional |
| Offer expiry approaching | Да | Optional | Reminder |
| Contact/non-payment deadline | Да | Да | Высокая цена пропуска |
| Cancellation | Да | Да | Изменяет transaction state |
| Second-chance offer | Да | Да | Ограниченный срок |
| Complaint status | Да | Email для существенного решения | Case-management |
| Security/account action | Да | Да | Security |
| Marketing/news | Отдельный preference | Только при соответствующем основании | Не смешивать с service messages |

Разделение transactional/security и marketing особенно важно, поскольку НЦЗПД отдельно разъясняет, что contractual legal basis нельзя использовать для посторонней рекламной цели. citeturn23view0

### Legal UX, который следует отдать юристу на подтверждение

| Точка | Минимальный исследовательский proposal | Статус |
|---|---|---|
| First visit | Essential only before choice; optional categories off until valid choice; visible accept/reject/settings | LAWYER GATE; consent principles strongly supported by НЦЗПД. citeturn21view0 |
| Registration | Agreement acceptance отдельно от optional PD consents; privacy notice informative; 18+ explicit | LAWYER GATE |
| Create Work | Seller declares truthful authorship/rights/description; no promise platform authenticated it | Policy + LAWYER GATE |
| Publish auction | Start, step, end/soft close, currency, delivery, cancellation consequences | Contract-law gate |
| First bid | Exact amount/currency + consequence + auction end mechanics + link to versioned rules | Contract-law gate |
| Fixed buy | Exact Work/seller/price/currency/delivery + explicit confirmation | Contract-law gate |
| Send offer | Price, expiry, revocation, competing fixed-buy rule, consequence of seller acceptance | Contract-law gate |
| Accept offer | Price, buyer, exact consequence, reservation/contact rule | Contract-law gate |
| Contact reveal | Кто получает какие поля и для чего | PD lawyer gate |
| Complaint | Type, evidence, privacy notice, case status | PARTIAL legal evidence |
| Report error | Show auto-attached fields before submit; screenshot explicit/removable | PD lawyer gate |
| Footer/settings | Operator identity, current versioned documents, privacy rights/consent controls/support | P0 legal pack |

## Решения основателя, вопросы юристу и реестр доказательств

### Что ещё должен решить основатель

Чтобы следующий product pass был конечным, а не новым исследованием, достаточно следующих решений.

| Вопрос основателю | Варианты, которые уже можно выбрать |
|---|---|
| Какой offer contract flow нужен продукту? | Seller-accept final / seller-accept + buyer-final-confirm / reservation model |
| Нужен ли counteroffer в MVP? | none / seller-only / symmetric |
| Какой offer expiry? | 24h / 48h / limited seller-defined |
| Как работает second chance? | auto winner / seller selected / sequential ranked offer |
| Может ли seller пропустить runner-up? | никогда / свободно / только documented reason |
| Какое non-payment/contact window? | 48h / 72h / 7d |
| Нужен ли soft close? | hard / 90-sec extension / configurable |
| Валюта MVP? | BYN only / BYN + RUB hint / native dual listing currency |
| Secondary resale? | creator-only / controlled provenance resale |
| Diagnostics package? | manual / previewed privacy-safe bundle / broader later |

После этих ответов legal counsel сможет проверять **конкретную** механику, а не абстрактный marketplace.

### Вопросы практикующему BY/RF юристу после этого research pass

Первый вопрос теперь должен быть максимально конкретным: **входит ли фактическая деятельность bidplace — бесплатная software/platform service для публикации creator Works и сведения seller/buyer без движения средств за Work — в разрешённую для ИП деятельность по приложению 1 постановления № 457; какой точный ОКЭД или комбинация ОКЭД соответствует ей в 2026 году?** Старые `63.12/62.01/73.11` нужно либо подтвердить официальным приложением, либо заменить. citeturn25search7

Далее юристу нужны ответы именно на gaps, которые research не закрыл: правовая квалификация platform в BY и RF; offeror/acceptor и момент прямого договора для auction/fixed/offer; binding effect и lawful cancellation; consumer consequences в зависимости от seller status; second-chance как новый договор/offer либо продолжение торгов; lawful contact disclosure; BYN/RUB display; cookies/analytics; diagnostics/screenshot; moderation/appeal; photo licence; minors; российские localization/transfers/notifications.

По privacy следует просить не общую фразу «нужно согласие», а **матрицу `purpose → data → legal basis → recipient/processor → country → retention trigger → user right`**. Официальные материалы НЦЗПД уже показывают, почему blanket consent будет слабой моделью. citeturn21view0turn23view0turn23view1

### NOT VERIFIED, которые нельзя превращать в product facts

Точная soft-close формула Bidbaits; current Bidbaits second-chance mechanism; auction functionality Etsy; universal second-chance mechanics Whatnot; BYN/RUB support и rate metadata большинства исследованных foreign platforms; exact eBay soft-close behavior; exact legal deadline для off-platform payment/contact в Беларуси; точная допустимость `63.12/62.01/73.11` для ИП Беларуси после 1 января 2026 года; BY contract moment для всех трёх formats; RF localization/applicability; legal basis для раскрытия runner-up contacts; retention periods; exact mandatory cookie configuration; universal complaint SLA; blanket licence consequences — всё это остаётся **NOT VERIFIED / LAWYER GATE**, а не предполагается по аналогии.

### Основной register первичных источников

Дата доступа для всех web-источников ниже: **2026-09-06**.

| Площадка / орган | Страница | Регион / формат | Direct URL / evidence |
|---|---|---|---|
| eBay | Shill bidding policy | Global/US marketplace, auction | `https://www.ebay.com/help/policies/selling-policies/selling-practices-policy/shill-bidding-policy?id=4353` citeturn14view0 |
| eBay | Duplicate listings policy | Marketplace, fixed + auction | `https://www.ebay.com/help/policies/listing-policies/duplicate-listings-policy?id=4255` citeturn14view1 |
| eBay | Retracting a bid | Auction | Официальная Help page. citeturn2view1 |
| eBay | Revise a listing | Auction/fixed/offers | Официальная Help page. citeturn2view4 |
| eBay | Ending a listing | Auction/fixed | Официальная Help page. citeturn2view5 |
| eBay | What to do if a buyer has not paid | Orders/auction | Official eBay Export help. citeturn1search2 |
| eBay | Second Chance Offer API/help | Auction | Official eBay Developers. citeturn3search17turn3search9 |
| eBay | Best Offer | Fixed/offer | Official eBay Developers/Help. citeturn3search7turn3search5 |
| Etsy | Make an Offer | Fixed listing + offer | Official Etsy Help. citeturn4search5turn4search13 |
| Etsy | Currency settings | Buyer browsing/checkout | `https://help.etsy.com/hc/en-in/articles/115015520608-How-to-Change-Your-Currency-Settings-for-Shopping-on-Etsy` citeturn15search2 |
| Etsy | Supported Etsy Payments currencies | Checkout | Official Etsy Help. citeturn15search3 |
| Etsy | Shilling | Marketplace integrity | Official Etsy policy. citeturn4search3 |
| Etsy | Reselling / listing | Creator marketplace | Official Etsy Help/policy. citeturn4search4turn4search12 |
| Bidbaits | Seller advice | Auction/fixed | Official current site evidence. citeturn7search0 |
| Bidbaits | FAQ | Orders/relist/reviews | Official current site evidence. citeturn7search1 |
| Bidbaits | Current auction page | Auction/anti-sniper | Official current site; exact extension not rendered. citeturn7search8 |
| Bidbaits | Raw legal/help archive supplied by founder | RU auction/fixed | `https://bidbaits.ru/`; archive is evidence only, not bidplace law. fileciteturn0file3 |
| Catawiki | Fair business practice | Auction | `https://www.catawiki.com/en/help/eerlijkzakendoen` citeturn12search0 |
| Catawiki | Highest bid too low | Auction | `https://www.catawiki.com/en/help/bidding-selling-process/i-feel-the-highest-bid-is-too-low-am-i-required-to-sell-my-lot` citeturn12search4 |
| Catawiki | Content moderation approach | Auction/content | `https://www.catawiki.com/en/help/lots-in-auction/what-is-catawiki-s-content-moderation-approach` citeturn12search7 |
| Catawiki | Non-payment / next bidders | Auction/order | Official Help. citeturn6search8 |
| Catawiki | Privacy/data use | Trust & Safety | Official marketplace privacy/help. citeturn12search3turn15search1 |
| Whatnot | Community Guidelines | Live auction/fixed | `https://help.whatnot.com/hc/en-us/articles/360061197472-Whatnot-Community-Guidelines` citeturn16search4 |
| Whatnot | Multiple accounts | Account integrity | `https://help.whatnot.com/hc/en-us/articles/5904575215501-Use-multiple-accounts-on-Whatnot` citeturn16search0 |
| Whatnot | Counterfeit Policy | Trust & Safety | `https://help.whatnot.com/hc/en-us/articles/360061604031-Counterfeit-Policy-and-Restricted-Branded-Items-Policy` citeturn16search1 |
| Whatnot | Buyer offers | Buy It Now/offer | Official Whatnot Help. citeturn5search7 |
| НЦЗПД РБ | Согласие на обработку персональных данных | BY | `https://cpd.by/zachita-personalnyh-dannyh/grajdaninu/soglasiye-na-obrabotku-personalnykh-dannykh/` citeturn21view0 |
| НЦЗПД РБ | Правовые основания обработки | BY | `https://cpd.by/zachita-personalnyh-dannyh/operatoru/pravovye-osnovanija-obrabotki/` citeturn23view0 |
| НЦЗПД РБ | Требования к обработке | BY | `https://cpd.by/zachita-personalnyh-dannyh/operatoru/trebovaniya-k-obrabotke/` citeturn23view1 |
| НЦЗПД РБ | Трансграничная передача | BY | `https://cpd.by/zachita-personalnyh-dannyh/operatoru/transgranichnaya-peredacha/` citeturn23view2 |
| НЦЗПД РБ | Уведомление о нарушениях систем защиты | BY | `https://cpd.by/zachita-personalnyh-dannyh/operatoru/uvedomit-o-narushenii-sistemy-zashchity/` citeturn24view0 |
| НЦЗПД РБ | Реестр операторов персональных данных | BY | `https://cpd.by/zachita-personalnyh-dannyh/operatoru/reestr-operatorov-personalnih-dannih/` citeturn24view1 |
| МНС РБ | О деятельности ИП с 1 января 2026 | BY business form | `https://nalog.gov.by/news/33527/` citeturn25search7 |
| МНС РБ | О деятельности ИП после 2025 | BY business form | `https://nalog.gov.by/news/32025/` citeturn25search0 |
| МНС РБ | Налогообложение ИП в 2026 | BY tax | `https://nalog.gov.by/news/34704/` citeturn25search1 |

Исследование подтверждает исходный принцип handoff: **конкурентская механика — evidence и источник вариантов, но не право; текущий runtime — evidence о реализации, но не product decision; рекомендации становятся контрактом продукта только после явного выбора основателя и соответствующего lawyer gate**. fileciteturn0file0

Наиболее сильная комбинация для следующего reconciliation pass выглядит так: Work-first оставить неизменным; transaction history сделать append-only; не подменять winner при non-payment, а моделировать second chance как отдельное действие; не раскрывать контакты runner-up заранее; offer race сделать серверно детерминированным; non-payment reason сделать auditable; anti-abuse P0 построить на transaction graph и ручной review без скрытого fingerprinting; blanket consent/cookie practices Bidbaits не переносить; а до регистрации оператора отдельно закрыть официальный Annex № 1 к постановлению № 457, поскольку именно этот вопрос сейчас способен изменить саму предпосылку «оператор = ИП Беларуси». citeturn3search17turn6search8turn14view0turn21view0turn25search7