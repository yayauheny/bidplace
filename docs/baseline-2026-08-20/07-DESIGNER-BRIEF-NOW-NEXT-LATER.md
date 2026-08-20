# bidplace — задание дизайнеру: сейчас, следующим этапом и позже

Рабочая Figma: https://www.figma.com/design/rOVJLc8pJMD32mLGIeqhl5/Bidplace--Copy-?node-id=79-62&p=f&t=akw3jSl1jVTX7P3S-0

В Figma блок «Сюда весь текст скидывать» содержит полный founder input. Короткие подписи/комментарии дизайнера помогают работе, но не заменяют эту базу. При конфликте designer уточняет, а не упрощает значимое правило.

Эта Figma — рабочий источник нового дизайнерского задания. В репозитории `design/pen/bidplace-web-v2.pen` пока остаётся защищённым каноном текущего production UI. Figma заменит или расширит его только после явной приёмки основателем и отдельного controlled cutover; разработчик не смешивает два визуальных направления по своему усмотрению.

## 1. Что мы проектируем

Один адаптивный сайт:

- телефон;
- планшет/промежуточная ширина;
- компьютер.

Это не два продукта «приложение и web». Позже нативные сборки используют те же экраны и компоненты. Основной пилот browser-first.

## 2. Каким должен ощущаться продукт

- работа и автор на первом плане;
- история раньше торгового шума;
- спокойно, современно, человечно;
- серьёзные действия понятны и подтверждаются;
- без дешёвых скидок, ложного дефицита и визуального давления;
- не доска объявлений и не NFT marketplace;
- редакционная подача, крупные изображения, честные состояния.

## 3. Что входит в первую часть дизайна сейчас

### Общая оболочка

- header: logo, поиск, меню, вход/аккаунт, «Создать»;
- mobile search/menu states;
- footer с legal/support links;
- адаптивная сетка;
- loading/error/empty/missing media foundations.

### Главная

- авторы;
- работы;
- ссылки «все авторы» и «все работы»;
- поиск/навигация;
- блок голосования и «Проголосовать» как отдельный продуктовый модуль;
- после определения результата — «Автор недели»: фон, автор, 1–3 работы, переходы.

Важно: backend сейчас отдаёт top auctions, creators и new works. Voting/author-of-week в API нет. Дизайн может проработать модуль и состояния, но его нельзя считать готовым к коду до решения правил из `10`: кто голосует, период, кандидаты, один голос, anti-abuse, tie и переход между состояниями.

### Каталоги

- список работ;
- список авторов;
- search result;
- повторное использование WorkCard/CreatorCard;
- поддержанные фильтры не придумывать: query, author, status, category, materials, uniqueness, price, year, sort; authors — query/sort.

### Страница работы

- gallery;
- название/автор;
- описание и история;
- характеристики;
- создание/процесс;
- sale action variants;
- история ставок для Auction;
- оплата и доставка;
- seller/legal summary;
- tags only if exact data/route agreed;
- другие работы этого автора, не generic similar items;
- share;
- states Upcoming/Active/Ended/Unavailable.

### Страница автора

- фото;
- имя;
- направление;
- описание;
- публичные Telegram/Instagram/website, если есть;
- список работ и статусы;
- витрина, не личный кабинет;
- никаких выдуманных followers/sales/rating/awards.

### Вход и регистрация

- email + пароль;
- регистрация: имя, email, пароль;
- field errors;
- loading/network retry;
- password reset нужен как P0 и должен получить макеты, хотя backend ещё отсутствует;
- Google можно оставить как future reference после пилота;
- Telegram auth не проектировать как текущий flow.

### Стать автором

- public identity;
- profile photo;
- public links;
- описание/направление/страна;
- private contact для передачи;
- выбор кто инициирует контакт;
- review без раскрытия private data публично;
- moderation states и замечания.

### Создание работы и продажи

Для человека это один последовательный маршрут:

1. описание работы;
2. фотографии;
3. история создания — optional, автор сам решает;
4. способ продажи: Fixed или Auction;
5. сейчас или по расписанию;
6. price/start price/time;
7. allowOffers — только там, где разрешено;
8. payment/delivery disclosures;
9. review;
10. moderation/publication result.

Код сейчас сохраняет Product и Auction Listing отдельно. Дизайн не обязан показывать эту техническую границу как два несвязанных продукта, но должен позволять сохранить/вернуться к server-backed drafts.

### Ставка

- CTA;
- отдельный verification/rules gate;
- amount form;
- current/minimum;
- быстрые amount actions;
- Review/Confirm;
- success/rejected/stale/network outcomes;
- soft-close extension;
- accessible alternative drag/slide confirmation.

### Fixed и Offer

- Fixed available;
- Fixed scheduled;
- Fixed sold/unavailable;
- Fixed + Offer enabled;
- Offer submit/review/sent;
- seller accept/counter/decline;
- buyer counter review;
- pending/expired/closed states.

Юридически значимый copy помечается placeholder «после юриста», но место и иерархия прорабатываются сейчас.

### Email verification перед первой ставкой

```text
Bid CTA
→ окно кода для уже известной почты
→ неверный/истёкший код
→ повторить письмо/cooldown
→ success
→ окно ставки
```

Не спрашивать email снова. Не помещать code field внутрь amount form.

## 4. Вторая часть — кабинет

Дизайнер подтвердил, что кабинет не входил в первоначальную оценку и будет оценён/сделан после первой части. Для продукта он нужен до полноценного MVP handoff.

Возможен один экран с вкладками или два маршрута. Предпочтительно один личный раздел с понятными `Покупки` и `Продажи`, если это не ухудшает mobile navigation.

### Покупки

- preview работы;
- название и автор;
- лидируете;
- ставка перебита;
- выиграли;
- проиграли;
- после победы: ждём контакт, контакт установлен, завершено, проблема/отмена;
- переход к работе и Deal;
- loading/error retry/empty/broken image.

### Продажи

- draft;
- на проверке;
- нужны правки;
- отклонено;
- запланировано;
- торги/продажа идут;
- не продано;
- продано/сделка ожидает передачи;
- handoff problem/completed;
- причина модерации;
- открыть предзаполненное редактирование;
- открыть Sale/Deal.

## 5. Обязательные состояния

Для каждого списка, страницы, формы, кнопки и медиа:

- initial loading;
- refresh/background updating, где видно пользователю;
- network error + retry;
- empty;
- field validation;
- server conflict/stale data;
- submitting/disabled;
- success;
- missing photo;
- broken photo;
- long text;
- keyboard focus;
- reduced motion;
- unauthorised/forbidden/not found;
- legal copy not yet approved — design placeholder, не ложный текст.

Дизайнер может экономить время, показывая два состояния в одном frame и оставляя однозначный annotation. Но нельзя полностью пропускать состояние, влияющее на transaction, accessibility или разработку.

## 6. Повторяемые элементы

В Figma должны быть masters/variants, а не уникальная кнопка на каждый frame:

- buttons;
- fields/select/date/amount/code;
- WorkCard;
- CreatorCard;
- status badges;
- header/menu/search;
- dialogs/sheets;
- page states;
- media states;
- SaleAction Fixed/Auction/Offer;
- ReviewCard;
- Money/BYN;
- document/legal cards;
- seller/payment/delivery disclosure blocks;
- AppIcon family.

Не нужна бесконечная design system. Нужны реальные повторяющиеся роли и их состояния.

## 7. Юридический UX, который закладываем сейчас

- BYN как техническая валюта;
- новый знак BYN визуально + text fallback;
- seller identity/legal status slot;
- «оплата напрямую продавцу»;
- delivery cost/status;
- returns/cancellation entry;
- Terms/Privacy/Seller Rules cards;
- version/date у документа;
- short summary рядом с Bid/Buy/Offer;
- agreement before first Bid, если подтвердит юрист;
- Review → Correct → Confirm;
- durable result;
- handoff privacy explanation;
- support/problem link.

Точные формулировки после юриста, но отсутствие места под них — ошибка дизайна.

## 8. Что показать как future-ready отдельно

- limited edition/quantity;
- upcoming drop/countdown/notify/sold out/waitlist;
- preorder;
- made to order;
- commission request/proposal/milestones;
- future integrated payment pending/success/failure/refund;
- partial prepayment/remaining;
- seller payout;
- shipping variants/tracking;
- RU/EN;
- display currency selector;
- System/Light/Dark;
- favourites/cart icon positions only as future components.

Future pages не должны смешиваться с MVP prototype и вводить разработчика в заблуждение.

## 9. Что не рисовать как готовое

- wallet/escrow;
- crypto/NFT;
- live-video host room;
- draw/lottery;
- crowdfunding;
- сложный rating score;
- buyer premium;
- fake reviews/followers/sales;
- действующий USD/EUR equivalent;
- работающий cart/favourites без product decision;
- Telegram login;
- admin technical pages, кроме отдельной согласованной founder работы.

## 10. Формат handoff

Для каждого экрана:

- route/role;
- MVP или future;
- desktop 1440;
- tablet 1024;
- mobile 390;
- states;
- component instances;
- field names и optional/required;
- source of data;
- interactions;
- keyboard/focus;
- legal placeholder/approved copy;
- unknown/blocked note;
- asset/icon names;
- measurements/tokens;
- acceptance screenshot/prototype path.

## 11. Критерий приёмки дизайна

- все согласованные flows присутствуют;
- компоненты повторно используются;
- mobile и desktop — полноценные композиции;
- transaction states не оставлены комментариями «разработчик поймёт»;
- existing fields не потеряны;
- unsupported fields помечены;
- Fixed/Auction/Scheduled/Offer различаются;
- legal blocks имеют место;
- future pages отделены;
- loading/error/empty/media/validation показаны;
- icon sources/licensing отмечены;
- основатель подтвердил визуальное направление и спорные interaction choices.
