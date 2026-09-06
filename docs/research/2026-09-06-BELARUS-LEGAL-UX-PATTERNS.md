# bidplace — legal UX для Беларуси

Дата проверки: 2026-09-06
Статус: исследовательская основа; не юридическое заключение
Применение: конкретные места controls и объём текста для дизайна и технического контракта

## Что подтверждают официальные источники

1. Согласие на обработку персональных данных должно быть свободным, однозначным,
   информированным и выраженным активным действием. Заранее отмеченные поля и
   блокирование услуги из-за несогласия на необязательную обработку проблемны.
2. Несвязанные цели нельзя объединять в одно согласие. Маркетинг и необязательные
   cookies отделяются от основной услуги.
3. Данные, объективно необходимые для договора с пользователем, могут обрабатываться
   на самостоятельном основании. Нельзя автоматически включать в него аналитику,
   рекламу или данные «на будущее».
4. Политика должна быть публичной и описывать конкретные цели, категории данных,
   сроки, уполномоченных лиц, права пользователя и фактическую передачу данных.
5. Требования к трансграничной обработке зависят от реальных стран, поставщиков и
   оснований передачи.

Основные источники:

- [НЦЗПД: согласие на обработку персональных данных](https://cpd.by/zachita-personalnyh-dannyh/grajdaninu/soglasiye-na-obrabotku-personalnykh-dannykh/), доступ 2026-09-06;
- [НЦЗПД: правовые основания обработки](https://cpd.by/zachita-personalnyh-dannyh/operatoru/pravovye-osnovanija-obrabotki/), доступ 2026-09-06;
- [НЦЗПД: ознакомление с политикой](https://cpd.by/oznakomlenie-s-politikoj-v-otnoshenii-obrabotki-personalnyh-dannyh/), доступ 2026-09-06;
- [НЦЗПД: трансграничная передача](https://cpd.by/zachita-personalnyh-dannyh/operatoru/transgranichnaya-peredacha/), доступ 2026-09-06.

## Что показывает рынок

Kufar, Onliner, Wildberries BY, Ozon BY, Flagma, Bidbaits, eBay и Etsy используют
разные комбинации links, confirmations, cookie controls и support routes. Это помогает
выбрать понятный интерфейс, но не подтверждает его законность для bidplace.

Полезные прямые примеры:

- [Onliner: политика обработки cookies](https://blog.onliner.by/politika-v-otnoshenii-obrabotki-cookie-fajlov);
- [Onliner: политика конфиденциальности](https://blog.onliner.by/politika-konfidencialnosti);
- [Onliner: правила сайта](https://blog.onliner.by/siterules);
- [Onliner: поддержка](https://support.onliner.by/);
- [Flagma: пользовательское соглашение](https://flagma.by/agreement);
- [Flagma: cookies](https://flagma.by/cookies);
- [Flagma: контакты и обращения](https://flagma.by/contacts);
- [Etsy: сообщение о нарушении интеллектуальных прав](https://help.etsy.com/hc/en-us/articles/360000344448-How-to-Report-Intellectual-Property-Infringement);
- [eBay: privacy request](https://ocswf.ebay.com/guest/privacy).

Deal.by, 5element.by и Realt.by в исходном проходе не дали достаточно проверяемого
материала. Выводы на них не опираются.

## Текущий UX-контракт

| Шаг | Что показывать | Control | Что фиксировать | Статус |
|---|---|---|---|---|
| Первый визит, только необходимые cookies | Короткое объяснение и ссылка на cookie-раздел политики | `Понятно` | Версия текста не требует consent record, если выбора нет | Проверить у юриста |
| Первый визит, есть optional cookies | Обязательные работают всегда, остальные только после выбора | `Принять все`, `Только необходимые`, `Настроить` | Версия категорий, выбор, время, user/anonymous consent ID | LAW-backed pattern |
| Регистрация | Отдельные строки соглашения, политики, ПДн и 18+; marketing отсутствует | Unchecked controls, ссылки без потери формы | Document ID/version, время, пользователь, action | Обязательность PD consent — lawyer check |
| Email-маркетинг | Новости и предложения bidplace | Отдельная optional checkbox, default off | Consent version/time и отзыв | LAW-backed pattern |
| Заявка автора | Право публиковать свои материалы; ссылки на правила авторов и запрещённое | Action-specific confirmation | Версии правил, application ID, время | Lawyer wording |
| Создание Work | Напоминание загружать только материалы, на которые есть права | Inline notice + link | Work publication event и версия правил | Pattern |
| Включение продажи | Продажа добавляется к Work; оплата и передача напрямую между сторонами | Inline notice; first-time rules confirmation | Work, sale type, rules version, time | Product contract |
| Публикация аукциона | Сводка цены, шага и времени; нельзя снять только из-за неудобной цены | Final confirmation | Snapshot условий и rules version | Legal effect — lawyer check |
| Первая ставка | Сумма, обязанность купить при победе, оплата/доставка напрямую | Confirmation modal + rules link | Сумма, auction, user, rules/copy version, server time | Contract moment — lawyer check |
| Повторная ставка | Новая сумма и подтверждение | Compact confirmation | Каждая ставка и server time | Product contract |
| Fixed purchase | Работа, цена, создание сделки после подтверждения | `Подтвердить покупку` / `Отмена` | Terms snapshot, rules version, resulting deal | Wording — lawyer check |
| Отправка offer | Сейчас сделки нет; принятие автором создаст сделку по этой цене | `Отправить предложение` / `Отмена` | Offer amount/version/time | Wording — lawyer check |
| Принятие offer | Принятая сумма и немедленное создание сделки | `Принять и создать сделку` / `Назад` | Offer state/version, seller, time, deal | Wording — lawyer check |
| Second chance | Только как отдельное предложение после утверждения механики | Два отдельных confirmation шага | Исходный result, новый offer, ответ, новая deal | Не утверждено |
| Раскрытие контакта | Контакт доступен стороне этой сделки для оплаты и передачи | `Показать контакт` либо постоянное notice на private deal page | Кому, чей контакт, какие поля, deal, policy/rules version, time | Legal basis — lawyer check |
| Жалоба | Объект подставлен; пользователь описывает проблему и не добавляет лишние ПДн | Submit + privacy notice | Reporter, target, reason, text, status, decisions, audit times | Retention — lawyer check |
| Удаление аккаунта | Последствия для активных торгов, сделок, истории и жалоб | Destructive confirmation | Request, legal holds, deletion/anonymization result | Lawyer check |

## Footer MVP

Показывать ссылки на:

- пользовательское соглашение;
- политику персональных данных и cookies;
- согласие на обработку персональных данных;
- правила для авторов;
- правила аукционов и продаж;
- запрещённые товары и поведение;
- правообладателям;
- поддержку;
- настройки cookies, когда есть optional categories;
- реквизиты фактического оператора.

Согласие на email-маркетинг доступно в месте подписки и может иметь ссылку в footer,
но не является условием регистрации. Плейсхолдеры оператора, домена и поддержки нельзя
оставлять в публичной версии.

## Что исследование не решает

- обязательность отдельного PD consent при регистрации;
- юридический момент договора для bid/fixed/offer;
- основание раскрытия контактов;
- сроки хранения и удаление аккаунта;
- точный текст лицензии на материалы;
- достаточность 18+ self-declaration;
- second chance и правила невыкупа;
- фактические cookies, processors, страны и сроки до составления data map.

Эти вопросы передаются юристу через
[`docs/legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`](../legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md).
