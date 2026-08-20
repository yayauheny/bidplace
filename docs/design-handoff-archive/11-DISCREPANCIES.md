# Discrepancies

Аудит: код ↔ продуктовые документы ↔ дизайн-исследования ↔ future scope.

Слои не смешивались. Рекомендации — только пометки, не решения. Конфликты future **не разрешаются** здесь.

Сортировка: HIGH → MEDIUM → LOW, затем FUTURE vs MVP.

Классификация: `CODE_ONLY` · `DOCS_ONLY` · `CONFLICT` · `STALE_DOC` · `STALE_CODE_SUSPECTED` · `POST_MVP` · `UNKNOWN`

---

## HIGH — мешает дизайнеру или корректности продукта

| Area | Code says | Docs say | Classification | Impact | Recommended decision |
|---|---|---|---|---|---|
| Цена и дедлайн в discovery | Представление работы показывает цену, статус и дату конца. `AuctionCard` + `getAuctionCardContent`. | MVP RFC: посетитель «видит цену и время». Creator-first founder decision 10: в discovery **скрыть** цену и дедлайн. | **CONFLICT** | Два несовместимых информационных приоритета | Основатель выбирает, входят ли цена и дедлайн в discovery. Пока не выбрано — не смешивать слои |
| Featured на Главной | `/api/discovery/home`: 3 аукциона, 4 автора, 3 новых. Featured-сущности нет. `HomeScreen`. | DEC-065: те же три списка. Creator-first / HTML exploration: featured + statement + «Стать автором» | **CONFLICT** (intent vs exploration); implementation совпадает с DEC-065 | Неясно, есть ли featured как продукт | Для текущего продукта — три списка. Featured только после нового решения |
| Обязательные поля работы | Отправка требует: название, история, категория, уникальность, происхождение, город, передача, ≥1 фото. Техника/материалы/размеры/год **не** обязательны. `missingProductApprovalFields`. | MVP RFC §11: техника, материалы, размеры, год — в обязательном списке лота | **CONFLICT** | Форма и факты работы | Либо ослабить RFC под код (DEC-044 уже ослабил состояние), либо усилить submit. Для форм — текущий код |
| Лимит фото | Форма: 10. Сервер default: 8 файлов. `product-draft-screen` vs `LOT_IMAGE_MAX_FILES` | RFC: минимум 1; рекомендуемый набор кадров не gate | **CONFLICT** | Автор упрётся в ошибку на 9-м файле | Выравнять 8 или 10. В макете пока 8 |
| «Оплата и доставка» | Показывает `deliveryInfo` (текст передачи). Платежей нет. `ProductScreen` | RFC: оплата вне платформы | **CONFLICT** (подпись vs смысл) | Покупатель ждёт оплату | Переименовать или честно написать, что оплата вне сервиса |
| Пагинация Работ | API: page/limit. `/works` рисует одну страницу, без продолжения. `ProductListScreen` | DEC-065: пагинация на сервере | **CODE_ONLY** (API) / пробел UI | Каталог обрезан молча | Показать продолжение или «показаны первые 20» |
| Своя работа: ставка | Сервер: `Cannot bid on your own Listing`. UI те же действия, что у покупателя | RFC: seller не ставит на свой лот | **CONFLICT** (UI vs правило) | Автор может пройти подтверждение и получить ошибку | Состояние «это ваша работа» |
| Группировка контента работы | Три адресных вида: «О работе» / «Создание» / «Торги»; история в первой, процесс во второй | Exploration: последовательное чтение истории после идентичности работы | **CONFLICT** (IA реализации vs exploration) | Разная информационная архитектура | Решить группировку данных; композицию выбирает дизайнер |
| Discover в MVP RFC | Код: `/`, `/works`, `/authors`, `/search` работают | RFC §19: discovery **не входит** в MVP. Позже **DEC-065** ввёл маршруты | **STALE_DOC** (RFC §19) | Дизайнер может выкинуть каталог | Считать DEC-065 действующим; RFC §19 устарел в этой строке |

---

## MEDIUM — заметное расхождение

| Area | Code says | Docs say | Classification | Impact | Recommended decision |
|---|---|---|---|---|---|
| Год как фильтр | `yearFrom`/`yearTo` в `publicDiscoveryQuerySchema`, SQL есть | UI `/works` фильтра нет. RFC год как атрибут работы | **CODE_ONLY** | Дизайнер может обещать год-фильтр | Либо вывести в UI, либо не обещать |
| Вес | Поле есть, форма необязательна | RFC: «вес при необходимости». Страница работы вес **не показывает** | **CODE_ONLY** (не экспонирован в UI) | Факт пропадает | Показать в характеристиках или вычеркнуть из формы |
| Категория на странице работы | Обязательна, фильтр каталога есть | RFC: категория обязательна. `ProductScreen` категорию не пишет | **CODE_ONLY** | Покупатель не видит тип | Показать или сознательно скрыть |
| Дисциплина на профиле | API отдаёт. Каталог авторов показывает. Страница `/seller/[slug]` нет | RFC: направление optional | **CODE_ONLY** / пробел UI | Каталог и профиль расходятся | Показать дисциплину в профиле или убрать из каталога |
| Псевдоним ставки | `Bidder` + 6 hex. `createBidderAlias` | RFC §7: пример `user123` | **CONFLICT** | Английский префикс в RU UI | Заменить на русский шаблон |
| Создать на десктопе vs мобиле | Десктоп: только одобренный автор. Мобила «+»: всем не-админам | DEC-065: «Добавить»; creator-first: роль-зависимый Create всем | **CONFLICT** | Гость на десктопе не видит путь автора в шапке | Единое правило |
| Словарь ролей | «Стать продавцом», «предмет», «Аукционы» | Исследования: «Стать автором», «работа» | **CONFLICT** | Разный тон | Словарь для UI |
| Материал / уникальность как фильтры | Facets = сырые строки авторов, уникальность — exact match | Дизайн может ждать справочник | **CODE_ONLY** | Грязные меню | Либо таксономия, либо UI под свободный текст |
| Категории | Сид: 1 штука, «Авторская керамика» | RFC требует категорию; таксономия не утверждена | **DOCS_ONLY** (список) / данные бедны | Фильтр пустой | Список категорий — founder |
| Тип работы | NOT FOUND. Pen-контрол спрятан, `04-DESIGN-STATUS` | Pen v2 имел контрол | **DOCS_ONLY** / hidden | Не обещать | Ждать поле |
| Техника в поиске | `q` не ищет technique | Пользователь может искать «лепка» | **CODE_ONLY** | Поиск «не находит» | Расширить или не обещать |
| Soft close: факт vs сообщение | Продление `endsAt` на сервере есть | Исследования рисуют отдельное состояние «продлили». Отдельного утверждённого текста нет | **CODE_ONLY** (логика без сообщения) | Покупатель может не понять, почему дедлайн сдвинулся | Решить, сообщать ли факт продления. Не layout. |
| Список своих работ | `GET /api/seller/products` есть; экрана «мои работы» нет. Список нужен экрану расписания | RFC: seller видит свои лоты | **CODE_ONLY** | Автору некуда вернуться к черновикам кроме прямого URL | Экран списка |
| Condition в фактах | В `detailItems` всегда, даже если null | DEC-044: не обязательна, в форме не спрашивают | **STALE_CODE_SUSPECTED** | Пустая строка «Состояние» | Не рендерить пустое |
| `socialLink` | В API публичном ещё есть; UI профиля не делает из него сайт | Старый контракт «одна ссылка» | **STALE_CODE_SUSPECTED** | Путаница для форм | Оставить служебным, не дизайнить |
| Activity статусы RFC | Код: см. 06 | RFC: ещё «Ожидает завершения», «Требуется действие» | **CONFLICT** (имена) | Другие подписи | Свериться с кодом |
| Аналитика пилота | Не реализована (`11-PROJECT-STATUS`) | RFC §16 требует события | **DOCS_ONLY** / Not implemented | Не для UI | Не рисовать дашборд |
| Wishlist / follow / video | NOT FOUND в runtime | Creator-first: `designed_post_mvp` | **POST_MVP** | Не на MVP-кадрах | [13-FUTURE-PRODUCT.md](./13-FUTURE-PRODUCT.md). Не disabled-кнопки |
| Фильтр «только открытые торги» | По умолчанию видны и завершённые | RFC §6: open-only — будущий default | **DOCS_ONLY** (planned default) | Каталог шире | Не прятать ENDED без решения |

---

## LOW — имена, чистка, мелочи

| Area | Code says | Docs say | Classification | Impact | Recommended decision |
|---|---|---|---|---|---|
| Default sort | UI `/works` шлёт `activity`. Контракт API default `newest` | DEC-065 не фиксирует default UI | **CONFLICT** мелкий | Пока клиент шлёт sort — ок | Зафиксировать default |
| Home empty vs newWorks | Empty, если нет top и авторов, даже если newWorks есть | — | **CODE_ONLY** quirk | Редкий | Чинить empty |
| Сброс фильтра статуса | На `/works` повторное снятие не как на профиле автора | — | **CONFLICT** внутри UI | Неконсистентно | Один паттерн |
| «Аукционы» vs «Работы» | Оба живые | DEC-065: `/works` = auctions and works | **CONFLICT** словарь | — | Один термин |
| Уникальность max | Фильтр query max 160, колонка БД 240 | — | **CONFLICT** технический | Длинная строка не фильтруется | Выравнять |
| RFC «user123» | `Bidder …` | RFC пример | **STALE_DOC** | — | Обновить пример |
| Phone verification | Колонки/коды в БД есть | RFC: email для MVP, телефон после | **STALE_CODE_SUSPECTED** | Не UI | Не дизайнить SMS-вход |
| `sellerType=influencer` | Enum есть, форма пишет `creator` | Foundation: два типа продавцов, North Star позже | **CODE_ONLY** / не UI | Не рисовать переключатель | Одному пути автора |

---

## FUTURE vs MVP — не смешивать и не «чинить» макетом

Эти строки влияют на то, что можно обещать после MVP. Не повышать POSSIBLE/UNRESOLVED до факта.

| Area | Current / MVP | Later sources | Classification | Impact | Do not |
|---|---|---|---|---|---|
| Soft close | **Реализовано** 60/60/600; `DEC-039` пересмотрел ранний hard close (`DEC-008`) | RFC/trust doc §15 местами ещё hard close / reserve. Roadmap 19–21 «soft close default for large launches if confirmed» | **STALE_DOC** (старый hard close) + CURRENT mechanic | Дизайнер может думать, что soft close «будущее» | Не возвращать hard close. Не рисовать баннер, пока нет решения о **тексте** продления |
| Reserve / скрытый резерв | Runtime без reserve. `DEC-039` исключил после `DEC-034` | Trust doc / старые RFC упоминают reserve | **STALE_DOC** | Можно случайно вернуть | Новое решение обязательно |
| Fixed price | Только аукцион | Evolution: формат в рамке. Roadmap: эксперимент/кандидат. Founder-first: может рассматриваться post-MVP. Creator-first spec: `fixed_price_sale` = unresolved | **CONFLICT** (направление vs design-unresolved) | Расширяемая модель listing vs кнопка «купить» | Не рисовать Buy на MVP. Механика UNRESOLVED |
| Preorder / «presale» | RFC исключает | Evolution + roadmap «только при спросе» | **POSSIBLE_FUTURE** | Можно выдумать депозит/очередь | Механика UNRESOLVED. STATE MODEL NOT YET DEFINED |
| Limited drop | RFC исключает drops | Evolution / roadmap кандидат | **POSSIBLE_FUTURE** | — | Не MVP |
| Follow creator | Нет API. DEC-065 **не** вводит followers | `follow_creator` designed_post_mvp; roadmap 22–24 «follow без spam» | **POST_MVP** | Слот vs живой контроль | Не показывать. Нет счётчиков |
| Save work | Нет API. RFC исключает watchlist | `wishlist_saved_work` designed_post_mvp | **POST_MVP** | — | Не показывать. Списка «сохранённые» нет |
| Process video | Нет. Галерея = фото | `video_process_story` designed_post_mvp | **POST_MVP** | Работа без видео полная | Не делать видео обязательным |
| Notifications | `DEC-010`: нет внешних. Есть in-app статусы в «Покупках» | Playbook: optional transactional «если нужна». Пересмотр после метрик | **POSSIBLE_FUTURE**; event list **NOT APPROVED** | Колокольчик как факт | Не проектировать notification center |
| Chat / inbox | Нет. Есть winner contact handoff | RFC «будущее: internal inbox»; roadmap 19–21 inbox; playbook simple inbox | **POSSIBLE_FUTURE**; **no confirmed chat contract** | Handoff ≠ мессенджер | Не рисовать чат |
| Payments | Вне платформы | Roadmap 13–18 payment readiness/pilot. Architecture: не добавлять, пока нет решения на реализацию | **CONFIRMED_FUTURE direction**, gated | Checkout как будто есть | Не проектировать оплату сейчас |
| Delivery | Текст автора + handoff | Playbook shipping после повторяемости; international вне плана | **POSSIBLE_FUTURE** / **NOT PLANNED** (intl) | Калькулятор/трекинг | Не выдумывать логистику |
| Proxy / автоставка | Нет. MVP исключает | Playbook «позднее»; evolution откладывает | **POSSIBLE_FUTURE** | — | Не возвращать в MVP |
| Buy Now + auction | Runtime без Buy Now (`DEC-039`) | Совместный формат не описан | **UNRESOLVED** | — | Не комбинировать |
| Recommendations | Related works = другие работы **того же** автора, max 4 | Founder: важны, post-MVP. Roadmap 10–12: **не** делать recommendations. Advanced recs вне плана | **CONFLICT** (важность vs «не делать в этой волне») | Бесконечная лента | Related ≠ алгоритм. Feed не проектировать |
| Followers / likes / rankings | Нет | Запрещены как социальные метрики | запрет | — | Никогда на MVP |

---

## Sources (обязательны для строк выше)

Код: `apps/mobile/src/components/ui/AuctionCard.tsx`, `auction-card-layout.ts`, `apps/mobile/src/features/home/home-screen.tsx`, `product-list-screen.tsx`, `product-screen.tsx`, `product-draft-screen.tsx`, `AppHeader.tsx`, `MobileHeader.tsx`, `apps/api/src/products/product-requirements.ts`, `apps/api/src/core/config/env.ts`, `apps/api/src/bids/bids.service.ts`, `bid-alias.ts`, `packages/contracts/src/discovery.ts`, `packages/database/prisma/schema.prisma`.

Документы: `docs/product/02-PRODUCT-EVOLUTION.md`, `05-MVP-RFC.md`, `06-ROADMAP-24-MONTHS.md`, `09-TRUST-AND-AUCTION-INTEGRITY.md`, `10-CODE-ARCHITECTURE.md`, `12-DECISION-LOG.md` (`DEC-008`, `DEC-010`, `DEC-034`, `DEC-039`, `DEC-044`, `DEC-045`, `DEC-065`), `design/creator-first/FOUNDER-DECISIONS.md`, `design/creator-first/spec/component-specs.yaml`, `content-fixtures.yaml`.
