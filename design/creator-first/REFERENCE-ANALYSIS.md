# bidplace creator-first — покадровый разбор референсов

Дата обновления: 2026-08-13  
Статус: founder reference set завершён; покадровый разбор готов для design architect pass.

Этот файл отвечает на три вопроса для каждого скриншота:

1. Что именно показано и где находится ключевой элемент.
2. Какую задачу bidplace может решить этим паттерном.
3. Что нельзя переносить буквально.

Главное решение текущей партии: визуальный target — равный синтез `WePresent 50% + Get Hyped 50%`. WePresent задаёт редакционную структуру, навигацию, воздух и культурное позиционирование. Get Hyped задаёт характер медиа, карточек, движения, типографической смелости и молодую энергию. Avant Arte используется точечно для work detail и спокойной транзакции.

## WePresent — desktop, изображения 1–6

### 1. Манифест и горизонтальный ряд историй

Файл: `references/wepresent/03-home-manifesto-card-rail.png`

- Сверху почти невидимый интерфейс: поиск слева, логотип по центру, меню справа.
- В центре — крупный display-serif манифест, под ним одна короткая sans-serif расшифровка.
- Внизу первого экрана — горизонтальный ряд разновысоких карточек с разными цветами заливки.
- Между навигацией, текстом и карточками много свободного пространства.
- В bidplace: основа первого экрана Home — короткое позиционирование, затем сразу живые работы/авторы, без витрины цен.
- Не переносить: логотип, фирменный шрифт, тексты и точную геометрию WePresent.

### 2. Асимметричная подборка

Файл: `references/wepresent/04-selects-asymmetric-grid.png`

- По центру страницы — спокойный заголовок и одно предложение контекста.
- Карточки собраны в нерегулярную сетку: узкие, широкие, портретные и горизонтальные форматы.
- Каждая карточка имеет одну и ту же анатомию — изображение сверху, короткая подпись снизу — но разный размер и пастельную заливку.
- Большие интервалы вокруг группы дают ощущение кураторской подборки, а не каталога.
- В bidplace: ключевой референс Home/Explore и карточек работ; реальная пропорция фотографии определяет акцент, но подпись остаётся короткой и предсказуемой.
- Не переносить: случайную masonry-сетку без правил responsive и accessibility.

### 3. Ритм всей главной страницы

Файл: `references/wepresent/05-homepage-rhythm-overview.png`

- Видна последовательность: манифест → движущийся горизонтальный парад карточек → большая спокойная editorial-секция → mixed grid.
- Секции отличаются плотностью и фоном, поэтому длинная страница не становится монотонной.
- В bidplace: Home должен чередовать сильный вход, авторов/работы и спокойные смысловые главы; не повторять одну и ту же сетку весь экран.

### 4. История автора или работы

Файл: `references/wepresent/06-story-detail-text-and-photo-sequence.png`

- Слева узкая мета-колонка: дата, автор текста, share/save.
- Справа основная колонка: большой заголовок, лид, затем короткие абзацы.
- Ниже текст сменяется парой фотографий пути/контекста, затем более крупным медиа.
- В bidplace: шаблон повествования для автора и работы — тезис → происхождение/процесс → фотографии → детали. Контент нужно дробить на короткие главы, а не копировать длину журнальной статьи.

### 5. `Keep exploring` и продуктовые карточки

Файл: `references/wepresent/07-keep-exploring-card-rail.png`

- В большой белой скруглённой секции находятся заголовок, два спокойных фильтра-чипа и горизонтальный ряд карточек.
- Карточки имеют разные ширины и цветные рамки; крупное изображение и одна короткая подпись — единственное содержимое.
- Центральная карточка крупнее соседних, поэтому ряд ощущается как кураторская последовательность.
- В bidplace: наиболее близкий референс карточки работы в discovery — фото, название, автор/одна строка смысла; цена и срок не находятся на первом визуальном слое.

### 6. Навигационный overlay и квадратная media-card

Файл: `references/wepresent/08-navigation-overlay-feature-card.png`

- На фоне полноэкранного изображения открывается огромная белая панель с сильным скруглением.
- Слева — крупный список разделов; в центре — почти квадратная скруглённая фотография в стеке; справа — короткий positioning text.
- Центральная карточка читается как самостоятельный объект и подходит для фотографии предмета.
- В bidplace: mobile/desktop menu может показывать один рекомендуемый work/creator; квадратная скруглённая media-card становится базовым вариантом для предмета. Меню при этом должно оставаться навигацией, а не рекламным экраном.

## WePresent — mobile, изображения 7–10

### 7. Mobile Home hero

Файл: `references/wepresent/09-mobile-home-hero-stack.png`

- Манифест и подзаголовок идут одним вертикальным потоком.
- Ниже — одна большая карточка, а соседние цветные карточки выглядывают из-за неё и намекают на swipe.
- Навигация закреплена отдельной белой pill-панелью у нижней границы viewport.
- В bidplace: mobile Home не уменьшается с desktop, а пересобирается в вертикальный editorial flow; следующий контент виден без инструкций.

### 8. Mobile story card

Файл: `references/wepresent/10-mobile-latest-story-card.png`

- Одна карточка почти во всю ширину; изображение доминирует, подпись занимает отдельную нижнюю область.
- Скругления большие, но контент остаётся взрослым и спокойным.
- Нижняя навигационная pill перекрывает контент и требует явного safe-area/scroll-offset контракта.
- В bidplace: single-column карточки могут быть крупными; sticky chrome не должен закрывать заголовок, CTA или последний контент.

### 9. Mobile navigation overlay

Файл: `references/wepresent/11-mobile-navigation-overlay.png`

- Большая белая скруглённая панель содержит вертикальные разделы, затем рекомендуемую карточку.
- Закрытие, поиск и логотип собраны в отдельной нижней панели.
- В bidplace: меню может сохранять культурное позиционирование через один recommended work, но основные маршруты всегда видны первыми.

### 10. Mobile story detail

Файл: `references/wepresent/12-mobile-story-detail.png`

- Цветной верх задаёт тему истории; заголовок и secondary headline формируют сильную иерархию.
- Большое скруглённое медиа сменяется белой мета-зоной с датой, автором и двумя круглыми действиями.
- Внизу начинается основной текст; sticky navigation остаётся поверх страницы.
- В bidplace: work detail может переходить от сочного hero к спокойной фактической зоне. Цена/ставка должны находиться легко, но не превращать hero в товарную карточку.

## Get Hyped — изображения 11–22

### 11. Hero с наклонёнными карточками

Файл: `references/gethyped/12-home-hero-tilted-card-field.png`

- Огромный grotesk-манифест занимает верхнюю часть.
- Снизу появляются разноцветные и media-карточки с мягкими скруглениями и небольшими поворотами.
- В bidplace: использовать эту энергию после спокойной editorial-структуры WePresent; не подменять ценность автора маркетинговыми цифрами.

### 12. Компактная pill-навигация

Файл: `references/gethyped/13-pill-navigation-active-state.png`

- Белая pill объединяет разделы, активный пункт становится чёрной внутренней pill.
- В bidplace: пригодно как grammar локальных tabs/filters, если количество пунктов мало; не обязательно как глобальный header.

### 13–14. Creator intro и work cards

Файлы:

- `references/gethyped/14-creator-intro-work-cards.png`
- `references/gethyped/15-work-card-trio-animation-state.png`

- Слева крупный creator/title и короткий абзац; ниже/справа три media-card с разной высотой и лёгким поворотом.
- Цветной info-слой занимает нижнюю часть фотографии, круглая стрелка вынесена в угол.
- Второй кадр показывает динамическое состояние тех же карточек: геометрия сохраняется, медиа меняется.
- В bidplace: основной референс preview-карточек работ — фото, название, автор/короткое описание, одна ясная стрелка. Не размещать размеры, цену, срок и длинные характеристики на этом слое.

### 15. Work hero с видео и отдельной подписью

Файл: `references/gethyped/16-work-hero-video-caption-plate.png`

- Огромное скруглённое видео занимает почти весь экран.
- В левом нижнем углу лежит отдельная наклонная белая информационная карточка с title, одной строкой и tags.
- Mute и переход к следующей главе не конкурируют с медиа.
- В bidplace: один из главных референсов hero работы; transaction action остаётся отдельной спокойной зоной и не накладывается на лицо/предмет.

### 16. Тезис и фото процесса

Файл: `references/gethyped/17-story-thesis-photo-triptych.png`

- Большой короткий абзац расположен сверху слева.
- Под ним три вертикальные фотографии разной высоты, выстроенные с намеренным смещением.
- В bidplace: глава истории создания — одна мысль + 2–3 доказательных фотографии; полезно для процесса, автора и предмета в контексте.

### 17. Behind-the-scenes filmstrip

Файл: `references/gethyped/18-behind-the-scenes-filmstrip.png`

- Горизонтальная лента высоких фото, каждое слегка повёрнуто; внизу counter и пара стрелок.
- В bidplace: процесс/путь можно перелистывать как лёгкую ленту. Founder rule: оставить одну видимую стрелку вправо, добавить swipe/drag и клавиатуру; не копировать две декоративные стрелки.

### 18. Автор: фото слева, текст справа

Файл: `references/gethyped/19-author-left-photo-right-copy.png`

- Сверху огромный тезис; ниже маленькое вертикальное фото слева и короткий сильный текст справа.
- Много воздуха делает человека важнее интерфейса.
- В bidplace: базовая глава creator profile/creator story; для long bio текст дробится на несколько таких смысловых модулей.

### 19. Цветные главы в стеке

Файл: `references/gethyped/20-stacked-color-chapters.png`

- Полноразмерные цветные панели с большими номерами и заголовками перекрывают друг друга по вертикали.
- Фото только частично входит в композицию и создаёт anticipation следующего блока.
- В bidplace: можно использовать ограниченно для 2–4 смысловых глав работы; не превращать всю страницу в scroll-jacking или набор гигантских пустых блоков.

### 20 и 22. Желаемый формат work presentation

Файлы:

- `references/gethyped/21-work-media-stack-info-card.png`
- `references/gethyped/23-work-video-stack-info-card.png`

- В центре находится стек высоких медиа-карточек с небольшим поворотом и видимыми задними слоями.
- Слева отдельно лежит короткая info-card: title, одна фраза, tags.
- Управление минимально; окружающий фон спокойный.
- В bidplace: это ключевой hero/галерея работы. Для предмета медиа может быть square/portrait; одна правая стрелка означает следующее фото, свайп работает на touch, детали идут ниже последовательными главами.

### 21. Creator story: портрет и текст

Файл: `references/gethyped/22-creator-story-editorial-layout.png`

- Огромный заголовок занимает левую верхнюю часть.
- Под ним узкий портрет слева и ограниченная по ширине текстовая колонка справа.
- В bidplace: профиль автора не должен быть dashboard. Это human story с ясными contact/social actions, затем работы.

## Avant Arte — изображения 23–25

### 23. Галерея работы и тихая transaction-панель

Файл: `references/avant-arte/01-work-gallery-sticky-transaction.png`

- Левая часть страницы — большая галерея: общий вид, макро-фактура, подпись, рамка в интерьере.
- Справа — sticky-панель с вариантами, deadline, одним primary action и последовательными accordions.
- В bidplace: сильный паттерн `сначала увидеть предмет → затем понять покупку`. Использовать цену и ставку как ясный, но визуально спокойный слой.
- Не переносить: draw-механику или варианты, которых нет в MVP.

### 24. Первый экран work detail

Файл: `references/avant-arte/02-work-hero-quiet-commerce.png`

- Огромное изображение работы слева; справа компактно расположены автор, название, цена, edition/shipping и action.
- Транзакция читается сразу, но изображение остаётся главным.
- В bidplace: полезная пропорция между предметом и торгами. Founder preference: цена + ставка видимы, deadline и правила подчинены; история и фотографии продолжаются ниже.

### 25. Выбор варианта в modal

Файл: `references/avant-arte/03-variant-selection-modal.png`

- Простая modal поверх затемнённой work page: заголовок, короткая инструкция, две visual-option cards, одно primary action.
- В bidplace: паттерн годится для будущих вариантов/фиксированной продажи или уточнения действия. В текущем auction MVP не добавлять variant selection без product contract.

## Medallion — native mobile, изображения 1–8 следующей партии

Medallion здесь не задаёт итоговую палитру и не превращает bidplace в музыкальную social platform. Его роль — показать, как mobile-интерфейс остаётся стильным при очень малом количестве controls и как один путь разбивается на понятные последовательные решения.

### 1. Поиск автора и visual grid

Файл: `references/medallion/01-onboarding-artist-search-grid.png`

- Сверху одна крупная формулировка вопроса; ниже широкая тёмная search-pill без дополнительной рамочной сложности.
- Результаты/популярные авторы собраны в три колонки круглых изображений с одной короткой подписью.
- Маленькие badges не мешают распознаванию лица или работы.
- В bidplace: референс mobile-поиска авторов и простого выбора интересов/категорий; основной экран должен отвечать на один вопрос.
- Не переносить: verification badges и popularity/trending как неподтверждённые продуктовые признаки.

### 2. Один выбор — две большие кнопки

Файл: `references/medallion/02-onboarding-connect-options.png`

- Вверху есть необязательный `Skip for now`.
- Три маленькие preview-card дают контекст, затем идут один вопрос, одна короткая расшифровка и две одинаково крупные pill-кнопки.
- В bidplace: onboarding/auth/provider choice или выбор способа публичного контакта; одна задача на экран, одинаковая анатомия вариантов.
- Не переносить: Spotify/Apple Music integration.

### 3. Добавление фотографии профиля

Файл: `references/medallion/03-onboarding-profile-photo.png`

- Большой preview-card по центру показывает будущий профиль ещё до сохранения.
- Camera action прикреплён непосредственно к avatar, поэтому связь действия и объекта очевидна.
- Снизу — маленькая help-link и одна полноширинная primary button.
- В bidplace: сильный референс шага создания creator profile и preview before publish; изображение, подсказка и действие не конкурируют.

### 4–5. Async validation: loading → success

Файлы:

- `references/medallion/04-username-validation-loading.png`
- `references/medallion/05-username-validation-success.png`

- Поле содержит prefix, введённое значение и счётчик длины, но остаётся визуально чистым.
- В loading state под полем показаны spinner и конкретный статус; primary action disabled.
- В success state та же строка меняется на короткое зелёное подтверждение, а CTA активируется.
- Keyboard не перекрывает поле и действие; основная композиция не прыгает между состояниями.
- В bidplace: обязательный референс для username/slug, email/OTP, загрузки фото, проверки формы и server validation. Ошибка должна занимать ту же предсказуемую feedback-zone.

### 6. Auth/email first screen

Файл: `references/medallion/06-auth-hero-email.png`

- Небольшой media-card stack быстро объясняет ценность сервиса, но не превращает auth в landing page.
- Ниже один тезис, одно поле email, одна полноширинная кнопка и тихий legal text.
- В bidplace: auth/onboarding должен быть коротким и визуально связанным с авторами/работами; не добавлять лишние secondary actions.

### 7. Explore: поиск, рекомендации и bottom navigation

Файл: `references/medallion/07-explore-search-suggested-artists.png`

- Тихая search-pill находится первой.
- Suggested artists идут горизонтальным рядом крупных карточек с одной pill-action.
- Ниже отдельная contextual panel имеет stacked media, короткий title/body и один secondary action.
- Bottom navigation содержит только три направления и хорошо читаемые иконки.
- В bidplace: референс mobile Explore, карточек авторов, contextual share panel и компактной навигации. Для MVP card action ведёт в профиль/работу; `Follow` и social graph не добавляются.

### 8. Mobile detail: действие, About и secondary content

Файл: `references/medallion/08-content-detail-action-about-comments.png`

- Back и share вынесены в простой top bar.
- Затем последовательно идут access/status label, title, creator identity, одна большая pill-action, строка объекта и отдельная rounded About-surface.
- Secondary content начинается только после основной информации.
- В bidplace: полезна сама последовательность work detail — контекст → название/автор → ставка → `О работе` → дополнительные сведения.
- Не переносить: subscribers-only gate, comments, likes и music-track semantics.

### Системные mobile-паттерны Medallion

- Один экран — один главный вопрос или одно primary action.
- Primary action почти всегда большая нижняя pill с предсказуемым положением.
- Search/input используют одну спокойную rounded surface без визуального шума.
- Feedback располагается inline: loading, success, error и disabled не требуют лишней modal.
- Иконки понятные и используются экономно; подпись добавляется там, где одной иконки недостаточно.
- Safe area и keyboard являются частью композиции, а не исправлением после макета.
- Переход между шагами должен сохранять геометрию и ощущаться последовательным; конкретные duration/easing архитектор определит в motion contract.
- Тёмная тема — свойство Medallion, а не требование bidplace. Эти же паттерны должны работать в новой creator-first палитре.

## Новая партия — creator activation, Foundation, Avant Arte и авторские карточки

Эта партия не меняет основную пропорцию `WePresent 50% + Get Hyped 50%`. Она уточняет три практических слоя: как автор начинает работу с площадкой, как транзакция остаётся понятной, и как показывать автора современно без ручной арт-дирекции.

### 1. COLORS: лёгкий welcome/auth

Файл: `references/colors/01-auth-hello-split-gradient.png`

- Desktop разделён на две равные области: слева почти пустой белый auth-экран, справа большое цветовое поле.
- `Hello!` — единственный сильный типографический акцент; под ним короткое объяснение и три ровных, легко сравнимых варианта входа.
- Юридический текст остаётся внизу и не конкурирует с решением.
- В bidplace: auth/creator onboarding должен начинаться дружелюбно и прямо — одна выразительная приветственная фраза, короткое объяснение, минимум вариантов.
- Не переносить: фирменный шрифт/копирайт COLORS и случайный AI-gradient. Цветовое поле может быть собственной семантической заливкой или разрешённой creator/work atmosphere.

### 2. Mobile creator publishing: основная функция видна сразу

Файл: `references/creator-publishing/01-mobile-create-work-flow.png`

- Первый экран не прячет создание: внизу постоянно видна яркая `+ New post`, а выше в трёх коротких пунктах объясняется смысл действия.
- Следующие экраны последовательно показывают media preview, title/caption, category, дополнительные настройки, hashtags и disabled action.
- Категории представлены простым searchable list с различимыми иконками; экран отвечает на одну задачу.
- В bidplace: это референс не social post, а пути `создать кабинет → добавить работу → проверить → отправить на модерацию`. Главная кнопка должна быть видна из global shell, а сам flow дробится на понятные шаги.
- Не переносить: суточную collect-механику, rewards, hashtags, content-sensitivity и термин `post`, если их нет в реальном contract.

### 3. Неидентифицированный auction concept: общая пропорция

Файл: `references/concepts/01-auction-work-hero-purple-frame.png`

- Большое изображение занимает левую половину; справа в короткой колонке находятся creator chip, title, текущая ставка, deadline и два действия.
- Много белого пространства помогает разделить желание увидеть работу и решение участвовать.
- В bidplace: допустимый композиционный ориентир split work hero, но не источник визуального языка.
- Не переносить: ETH, wallet и NFT-семантику; источник изображения не подтверждён.

## Avant Arte — дополнительные изображения 4–6

### 4. Works catalog как negative/positive evidence

Файл: `references/avant-arte/04-works-catalog-object-grid.png`

- Ровная четырёхколоночная сетка хорошо ставит разные типы объектов в одинаково спокойные media-сцены.
- Цена, deadline и `Draw` вынесены на первый слой и сразу делают страницу каталогом продаж.
- В bidplace берём только аккуратную постановку объектов и единый media rhythm. Цена/deadline остаются скрытыми на default discovery card по founder rule.

### 5–6. Creator profile: work-context banner → identity → works

Файлы:

- `references/avant-arte/05-artist-profile-artwork-banner.png`
- `references/avant-arte/06-artist-profile-works-tabs.png`

- Большой горизонтальный фрагмент работы задаёт контекст практики; маленький square portrait пересекает нижнюю границу banner.
- Имя стоит отдельно и уверенно, после него идут простые `Works / About`, затем крупная сетка работ.
- В bidplace: полезна иерархия `мир/работа автора → сам автор → его работы`, если она выдерживает missing/one-image state без ручного баннера.
- Не переносить: `Get updates` до отдельного product contract и пустую luxury-галерейность.

## Foundation — изображения 1–8, только composition/interaction

Foundation в этой подборке не является продуктовым референсом. Все NFT/wallet/ETH/mint/feed/offer/pack semantics запрещены. Полезны только конкретные структуры.

### 1. Created grid и постоянный Create

Файл: `references/foundation/01-created-grid-visible-create.png`

- Поиск и общая навигация остаются сверху, `Create` находится среди основных направлений, а artwork grid занимает центральную часть.
- В bidplace: доказательство, что заметный creator action может сосуществовать с чистой public discovery. На desktop это чёрная pill с белым плюсом и ясной подписью.

### 2. Work detail со стеком медиа

Файл: `references/foundation/02-work-detail-story-media-stack.png`

- Слева компактно размещены title, creator context, description и transaction; справа доминирует квадратная работа с видимыми задними слоями.
- В bidplace: ещё один аргумент за Get Hyped-like stack, но с более строгим fact/action placement.

### 3. Pack modal

Файл: `references/foundation/03-pack-selection-modal.png`

- Три равные колонки показывают количество через stack depth, название и одну action.
- В bidplace: только future-option anatomy. Packs/variants отсутствуют в MVP и не попадают в начальные экраны.

### 4. Ended/archive works

Файл: `references/foundation/04-sold-works-archive-grid.png`

- Четыре законченные работы показаны спокойно и одинаково, продолжение оформлено одной кнопкой `View all`.
- В bidplace: может помочь секции архива автора; статус важнее проданной цены, NFT label исключается.

### 5. Place bid modal

Файл: `references/foundation/05-place-bid-modal.png`

- Белая modal содержит короткое объяснение, тёмную summary-card с thumbnail/title/deadline/highest bid, поле суммы и одну disabled/active action.
- В bidplace: правильная последовательность `контекст ставки → ввод → доступный минимум/правило → подтверждение`. Баланс wallet и ETH исключаются, сервер остаётся владельцем minimum/status/deadline.

### 6–7. Create остаётся видимым на feed/detail

Файлы:

- `references/foundation/06-feed-visible-create-action.png`
- `references/foundation/07-work-detail-visible-create.png`

- Чёрная `Create` pill всегда находится справа в global header и не зависит от текущего public screen.
- В bidplace: ключевое founder decision. Guest/non-creator получает вход в creator onboarding; approved creator — `+ Добавить работу`; pending/restricted creator — честный путь в статус/кабинет.
- Не переносить: public social feed, Make Offer, wallet или crypto dropdown.

### 8. Immersive image-derived atmosphere

Файл: `references/foundation/08-immersive-work-atmosphere.png`

- Центральная работа остаётся резкой, а вокруг неё весь экран получает сильно тонированную версию изображения.
- В bidplace: допустима только bounded atmosphere с нейтральным veil/fallback и проверенным contrast. Это не custom theme автора и не разрешение размывать страницу так, что текст перестаёт читаться.

## Mobbin Awards — изображения авторов 1–3

### 1. Portrait grid с нижней caption-зоной

Файл: `references/mobbin-awards/01-curator-portrait-grid-blur-caption.png`

- Авторы собраны в простую трёхколоночную сетку больших чёрно-белых портретов со скруглением.
- Имя и роль находятся внизу изображения на спокойной media-связанной зоне, не создавая отдельную тяжёлую карточку.
- В bidplace: сильный референс creator card — портрет прежде метрик, короткая дисциплина/описание, большой hit area.

### 2–3. Creator preview modal и long bio

Файлы:

- `references/mobbin-awards/02-curator-profile-modal.png`
- `references/mobbin-awards/03-curator-profile-bio.png`

- Большая белая rounded surface открывается поверх grid, сразу показывает name/role, огромный portrait и текст ниже.
- Нижняя часть фотографии использует blur/mirror-like caption strip; сам эффект ограничен media, а не всей страницей.
- Long bio разбит на короткие абзацы с комфортной длиной строки и почти без secondary chrome.
- В bidplace: архитектор должен выбрать одно основное применение эффекта — creator card, featured work или отказаться после contrast/resilience теста. Нужен opaque fallback, long-name state и отсутствие ручной обработки фото.
- Не переносить: awards, curator-only positioning и modal как единственный способ открыть публичного автора.

## Решение этой партии: creator action

```text
public global shell
→ всегда заметный creator action
→ capability-aware destination
→ последовательное создание профиля/работы
```

- Desktop: тёмная rounded pill, белый плюс, текст.
- Mobile: компактный высококонтрастный плюс может жить в header/bottom shell; точное место выбирает design architect, но действие не прячется в overflow и имеет accessible label.
- Guest/non-creator: вход в creator onboarding/auth с return path.
- Approved creator: `+ Добавить работу`.
- Pending/changes-requested/restricted creator: реальный cabinet/status/correction path без ложного обещания публикации.
- Work creation использует реальную последовательность backend/audit; reference влияет на presentation, а не создаёт новые поля или permissions.

## Синтез для bidplace

### Что берём почти напрямую на уровне принципа

- От WePresent: композиционный воздух, editorial hierarchy, mixed-size cards, цветные card surfaces, ясный mobile reading flow и спокойную навигацию.
- От Get Hyped: stacked/rotated media, сильный grotesk, яркие рамки/info-plates, короткие главы, процесс и молодой темп.
- От Avant Arte: large detail gallery, sticky transaction facts, progressive accordions и ненавязчивое продолжение действия.
- От Medallion: low-control-count mobile composition, pill actions, quiet search, inline validation, keyboard/safe-area discipline и последовательный onboarding.
- От COLORS: лёгкий, дружелюбный welcome/auth и выразительный heading при малом числе решений.
- От Foundation: постоянный creator action, отдельную bid modal anatomy и выбранные split/stack patterns без crypto semantics.
- От Mobbin Awards: portrait-first creator cards, readable bio и кандидат на bounded lower mirror/blur caption.

### Как это соединяется

```text
WePresent page structure
+ Get Hyped media behavior
+ Avant Arte transaction clarity
+ Medallion mobile interaction discipline
+ visible creator activation
= creator-first editorial commerce
```

### Инварианты результата

- При входе понятно, где Home, Works, Authors, Search и account actions.
- Автор и работа визуально появляются раньше цены.
- Карточка discovery не выглядит товарной строкой.
- Work detail последовательно раскрывает желание, историю, факты и действие.
- Яркость локализована в медиа/поверхностях; chrome и transaction states остаются спокойными.
- Ни desktop, ни mobile не требуют ручной арт-дирекции для каждого автора.
- `Создать`/`+ Добавить работу` остаётся заметным и capability-aware на любом основном public screen.
- Blur/mirror никогда не становится full-page generated theme: это bounded candidate-pattern с solid fallback и проверенным contrast.
- Карусель не зависит только от hover: есть одна видимая next-кнопка, swipe/drag, keyboard и reduced-motion state.
