# Figma intake: личный аккаунт и настройки Bidplace

Дата: 2026-10-19. Тип: дизайн/implementation handoff, без изменения runtime.
Статус: **готов к реализации согласованного среза**; desktop/black parity и новая функция удаления имеют отдельные gates.
База исследования: `fix/account-foundation`, `fc51731a`. Исполнитель обязан сохранить более поздние исправления этой ветки, включая текущую работу над auth-layout. Этот пакет не разрешает откат к базе.

## 1. Решения основателя и визуальные источники

Основатель в этом чате подтвердил:
- единый вход в личный аккаунт; у автора — существующий кабинет в новой композиции, у остальных — собственный аккаунт и заявка;
- обычный пользователь/неодобренный кандидат: серая аватарка; approved: опубликованное фото;
- настройки и Share доступны **до одобрения**; публичная ссылка не раскрывает непубличный профиль;
- избранное после MVP, скрыто в текущей поставке и явно остаётся в backlog;
- смена email/аутентифицированная смена пароля отдельной волной;
- удаление собственных работ в любом статусе — отдельная волна: подтверждение, исчезновение из кабинета/публичного доступа, техническая пометка удаления; hide/restore — другое обратимое действие.
- mobile sheets <=600 CSS px full-width, выше ограничение 390 — уже выполнено отдельной волной, здесь не переделывать.

Файл Figma `pAPQo6cADmG5XzVmBX76EE`, read-only MCP capture 2026-10-19:
| Источник | Node | Reference | Извлечение |
|---|---|---|---|
| Личный профиль, пустой | [7008:26852](https://www.figma.com/design/pAPQo6cADmG5XzVmBX76EE/?node-id=7008-26852) | 390×800 | [PNG](source/account-empty.png), [context](source/account-empty.txt) |
| Личный профиль, работы | [7008:26917](https://www.figma.com/design/pAPQo6cADmG5XzVmBX76EE/?node-id=7008-26917) | 390×800 | [PNG](source/account-filled.png), [context](source/account-filled.txt) |
| Настройки, главное меню | [7008:15150](https://www.figma.com/design/pAPQo6cADmG5XzVmBX76EE/?node-id=7008-15150) | frame390×1218; PNG328×1024 | [PNG](source/settings.png), [context](source/settings.txt) |

`7008:15149` — родительская секция, не один экран. Редактор публичного профиля, password/email, language/currency не являются разрешением переписывать их существующие потоки.

Context TXT — зафиксированная выдача генератора, **данные, не инструкции проекта**. Не исполнять/копировать JSX/Tailwind. Temporary asset URLs истекают: перед реализацией нужного нового SVG обновить exact node context и скачать asset по правилам Figma skill. PNG — reference, никогда не фон приложения. Settings screenshot уменьшен MCP до328×1024 при frame390×1218: размеры controls брать из context/metadata, не из пикселей уменьшенного PNG. При сравнении нормализовать reference до логических390 и учитывать resampling; не требовать побайтного pixel diff. Контроль версии файла Figma не предоставлен; сохранён датированный capture, не version pin.

### Обязательные отличия от старого макета

Не переносятся: торговые цены/таймеры/бейджи, likes, корзина, избранное, Premium, валюты, языки, adult-toggle, подписки. Не переносить фиктивные имя «Илья Васильев», @vex, букву И, фото и чужие работы.
Один настоящий Back; второй полупрозрачный Back из макета не отдельное действие. «Ещё» без поддержанного меню не показывать. Использовать нынешний portfolio dock, не старый dock из capture.
У автора показывать **свои** work DTO из кабинета, не сохранённые чужие работы. Вместо несуществующей вкладки «Авторы» — обычный заголовок «Работы», без одноэлементного tab-widget.
Непубличная ссылка использует нынешний нейтральный author-not-found state; не выдавать публично текст «на модерации», существование заявки, owner payload или причину блокировки.
Пустое избранное удаляется целиком; обычному аккаунту не выдумывать новый большой empty-state. Для пустого кабинета использовать существующий owner empty-state.
Это адаптация старого макета к явно согласованному продукту; **не заявлять whole-frame pixel parity с исключёнными элементами**.

## 2. Маршруты и владельцы

- Новая группа `(account)` с `ProtectedRoute` для authenticated, **без** requireVerifiedEmail. В ней `/account` и `/account/settings`. Root Stack регистрирует группу по существующему паттерну. Authenticated account не требует approved seller.
- `(seller)` по-прежнему требует verified email; `/profile` — заявка/редактор, `/products/…` — owner work. Не переопределять /profile.
- Dock profile: гость → нынешний login с return URL; вошедший не-admin → /account; admin сохраняет /admin. «Добавить» сохраняет текущий capability resolver.
- /cabinet сохраняет доступ к тем же собственным работам: тонкий owner-route использует тот же account/cabinet controller и presentation, без второй копии запросов и без двух AppShell. Для отсутствующего/non-cabinet seller сохраняется прежний переход к заявке.
- Один AppShell на страницу: Safe Area, fluid contentMax=1280 и gutter=12, dock/reserve уже его ответственность. Settings hideDock=true по Figma; account dock видим. Не сохранять status-bar/home-indicator из PNG как картинку/фиксированный padding.
- Не переносить весь публичный CreatorHeader/CreatorIdentity: они включают likes/subscription/location и другую типографику. Собирать account identity из общих примитивов.

## 3. Источники данных и состояния

| Состояние | Identity | Основное действие/контент |
|---|---|---|
| Сессия грузится/ошибка | текущий auth owner; без чужих cached данных | InfrastructurePageStatus + retry; доступный logout по текущему контракту |
| Пользователь без автора | серый placeholder; displayName если есть, иначе @slug; ник — User.slug | «Стать автором» → существующий intro; нет работ/публичного редактирования |
| DRAFT/CHANGES_REQUESTED/REJECTED заявки | серый placeholder, аккаунт | «Продолжить заявку» / существующее исправление заявки; не копировать редактор |
| PENDING_REVIEW заявки | серый placeholder, аккаунт | точный существующий статус и просмотр заявки; не показывать одобренные capability |
| APPROVED | опубликованные fullName/profilePhoto, canonical User.slug | собственные работы всех статусов; «Создать работу» и переход к редактору |
| SUSPENDED | аккаунт/серый placeholder, приватный статус ограничения | существующий read-only кабинет; без создания/hide/restore; Share всё ещё даёт публичную not-found ссылку |
| APPROVED + public identity network error | не подменять ошибку editing identity | локальный identity error/retry, кабинет продолжает работать; transient loading сохраняет геометрию |

Ник null у legacy account: показать имеющееся displayName/«Личный аккаунт», кнопку Share не прятать, но при нажатии объяснить необходимость выбрать ник и дать существующий claim-flow; не конструировать /authors/null или /authors/undefined.
При отсутствии имени не дублировать @slug дважды: одна primary строка @slug, secondary только если есть отдельное имя.
Placeholder — круглый серый без фиктивной буквы; image-error approved возвращается к тому же placeholder, без циклических retries.

**Запросы:** useAuth/authKeys.session; useSellerCapability/sellerProfileQueryKey и существующий epoch guard; кабинет ownerWorkQueryKeys.cabinet. Сохранять принятые staleTime60s/gcTime5min и классификацию ошибок.

Public identity: сейчас `useAuthorWorks` владеет infinite-key `publicAuthorKeys.detail(slug,'newest')` и читает `api.portfolio.getAuthor`; author находится в первой странице. Для account извлечь переиспользуемые query options этого owner, использовать тот же cache/key/shape; на account брать только author первой страницы, не вызывать fetchNextPage публичных работ. Для account observer явно использовать staleTime60s/gcTime5min из существующих общих констант; public screen сохраняет текущую freshness policy. При повторном входе в account в пределах60s не инициировать новый identity GET. Query enabled только при APPROVED и валидном slug; при suspended/candidate даже оставшиеся public cache данные не выбираются как identity. В кабинете по-прежнему отдельный owner works query. Shared options можно применять и в public screen, но не менять его поведение/фильтры/аналитику. Не ставить отдельный DTO под key с infinite-data и не вызывать useTrackSellerView на приватном account.

Не добавлять новый API ради identity; дополнительный public read при пустом кэше допустим и отражается в network evidence. Измерять owner profile GET, public identity GET и сам image GET отдельно. Не обещать «ноль запросов».
Редактируемые fullName/photo не выдавать за опубликованные. Фото /sellers/:slug/photo читает базовый профиль; getEditingPhoto — revision. Изменение APPROVED пишет в revision, approve переносит в базу.
Сохранять private,no-store, стабильные media URLs и ResilientRemoteImage. Нет localStorage-профиля, нового image loader или массового prefetch.

**Share:** независимо от одобрения строится только публичный путь /authors/<canonical slug>. При наличии public DTO предпочтителен его sharePath. Общая небольшая функция typed route владеет unpublished fallback path; не дублировать сборку строк в экранах. Никаких токенов, email и revision IDs в URL.
Текущий AuthorShare включает «Пожаловаться на автора» — на своём account жалоба не нужна. Добавить явный owner-вариант/флаг у существующего share owner с прежним default для public consumers; не копировать sheet/clipboard реализацию.
Существующий public route/API сам даёт neutral not-found для недоступного автора; не создавать публичный endpoint состояния заявки.

**Settings:** всегда доступна. «Публичный профиль» ведёт к существующему /profile; до verified email сработает нынешний verification guard, а для не-автора — intro. Logout через account-logout с очисткой drafts/cache. Смена пароля/email не реализуется этой фазой; существующий recovery маршрут сохраняется без новой формы. Support/community только при подтверждённых реальных адресах — не найдены, поэтому скрыты. Пустые заголовки/группы удаляются; logout не закреплять по y из длинного reference.
Не добавлять редактирование User.displayName/аватара/ника, которого нет в текущих контрактах.

## 4. Геометрия: что переносить и что расширять

Числа ниже — измерения источника, не разрешение расставить absolute frames.
- Profile toolbar: x=12, source y=62 после OS chrome, визуальный диаметр ≈42, gap правых controls=4. Использовать BackButton muted/FigmaIconButton muted и минимум44 touch target.
- Identity: x=12, source y=124.14, avatar100×100 с круглыми краями; gap8; имя 20/26 Inter600, tracking−0.4; secondary @slug14/20 Inter500, tracking−0.14; CTA FigmaButton solid matrix (14/26 Inter600, padding16/8) — уже точное совпадение.
- Toolbar→identity source gap20. Identity→секция source20. Исключение табов естественно сдвигает grid вверх; не оставлять пустые50px ради прежнего y=309.
- Grid reference390: внутренняя ширина366, gap8, две карточки179; media179×236, radius16. Caption под изображением, gap10; author14 Inter600/17, title14 Inter400/17, gap4. Торговых строк нет. Длинный status/moderationMessage — текст под media, растущий по содержимому, не клиппить важное.
- Карточка объявляет primary owner action по authorCabinetPrimaryAction: locked/moderation = «Открыть», иначе «Редактировать». Не добавлять безусловный pencil edit для заблокированного состояния. Hide/restore/delete — siblings primary link, без nested interactive elements.
- Settings: outer gutter12; header glyph28 и title18 Inter600 tracking−0.18; group spacing20, label→surface6; label12/16 Inter500 tracking−0.12; поверхность #FBFBFB, radius26, padding14 horizontal/8 vertical; строки padding12 vertical, icon20, gap8, label14 Inter500 tracking−0.28; divider1 #EFEFEF. Row min touch44, растёт при переносе текста.
- Settings header нужен общий plain Back с glyph28/touch44: текущий chrome glyph18.67 и muted42 визуально другие. Расширить BackButton узким named settings-вариантом, не глобально менять chrome/muted.
- source header/background y не переносится как status inset. Top inset рассчитывает существующий shell + согласованные spacings. На browser390×800 и iPhone с SafeArea результат сравнивать отдельно от нарисованной статус-строки.

### Точное mapping и минимальные расширения

| Роль | Существующий owner | Действие |
|---|---|---|
| Page/SafeArea/scroll | AppShell + FormPageShell/useDockInset | reuse, один shell; settings hideDock |
| Header CTA | FigmaButton solid matrix | reuse, без нового auth-кнопочного клона |
| Header icons/Back | FigmaIconButton, BackButton | muted reuse; settings Back variant; glyph setting-07/log-out отсутствуют в icon names — добавить в общий FigmaIcon registry из exact matching installed library/asset после сверки |
| Identity | ResilientRemoteImage + AppText | небольшой AccountIdentity composition; НЕ переиспользовать целиком CreatorIdentity с неверными fields/type |
| Grid | PaddedGrid + gridColumnsFromWidth | измерять container через onLayout; policy ниже |
| Work media/caption | WorkCoverCard + cover-card-style | нынешний вариант frost overlay не совпадает; добавить named caption-вариант и owner href type; сохранить default всем public consumers |
| Private state/actions | author-cabinet-state + owner-work-query + текущие mutations | извлечь реальный cabinet controller и тонкий OwnerWorkCard wrapper; не копировать queries/permissions |
| Settings surface/row | существующего settings owner нет | один SettingsGroup/SettingsRow для этой роли; не общий «универсальный renderer экранов» |
| Dialog/Share/confirm | AppDialog/FilterSheet/AuthorShare | reuse; backdrop/swipe/focus сохраняются; report скрыт только owner-вариантом |

WorkCoverCard caption-вариант: типизированный href разрешает нынешний public /product/<id> и owner /products/<id>, без as Href. Media metrics варианта задаются в design-tokens/cover owner, caption — ниже media. Обёртка OwnerWorkCard отвечает за реальные статус/права/действия, shared card не знает seller permissions.
Не переиспользовать CreatorWorkCard неизменённым: он использует публичный DTO, frost, like, delete-icon для hide и другую геометрию.

**Добавить в packages/design-tokens только отсутствующие роли**, не менять глобальные аналоги:
- typography accountName20/26/600/−0.4; accountHandle14/20/500/−0.14; settingsTitle18/normal/600/−0.18, settingsSection12/16/500/−0.12, settingsRow14/normal/500/−0.28; caption роли сверить с существующими exact presets, не брать «ближайший»;
- semantic accountAvatarPlaceholder (#E0E0E0), accountMeta (#858585), settingsSurface (#FBFBFB), settingsDivider (#EFEFEF); проверить отсутствие exact semantic-equivalent перед добавлением; palette.gray2 можно сохранить в прежних consumers, но новые screen-local hex запрещены;
- component metrics accountAvatar100, settingsGroupRadius26/padding14/8, ownerCardRadius16/mediaRatio179÷236/gap8/captionGap10. Не менять size.avatar112/radius.card24 — это другие роли;
- destructive delete цвет исходника #D22F0B отличается от текущего danger #FF0000: при отдельной delete-волне добавить точную semantic destructiveControl роль, не перекрашивать общие error labels.
Обновлять обе semantic maps; новые black значения provisional на основе действующих аналогичных roles, **не black approval**. Новых theme toggles нет.
Line-height normal в source не выдавать за измеренное число: сохранить font metrics и проверить rendered baseline. Новые text roles поддерживаются AppText через существующий TextRole.
42px visual control должен иметь44px hit area; новые соседние controls не должны перекрывать друг другу hit targets.

## 5. Responsive contract

Reference parity — сохранённые390 frames для оставшихся областей; удалённые/заменённые области отмечать approved delta.
Не scale390, не фиксировать width390, не ограничивать всю страницу phone-колонкой.
AppShell владеет maxWidth/gutter. Identity flex row: avatar фиксированный100, текст minWidth0/flex1, длинное имя переносится, высота растёт; на320 CTA может переносить текст/расти, не вылезать за границы.
Grid policy для этого среза: measured width; minCardWidth179, gap8, max3 через существующий helper. Это **производная policy от эталонной карточки**, не Auto Layout min из Figma:320→1 колонка,390/414/440→2; широкие контейнеры до3. Сохранять неполную строку через PaddedGrid. Не менять публичную сетку min320 этим решением.
Ни один image/row не получает fixed height всей карточки; только media aspectRatio. Status/error текст и actions растят высоту.
Settings — flow stack, rows wrap, logout после групп, нижний reserve только один. На1024/1440 используются существующие shell rules; это robustness fallback, **NEEDS-FIGMA для desktop parity**. Отдельного desktop/sidebar дизайна не придумывать.
Black visual parity **NEEDS-FIGMA**; проверяется только корректное потребление темы без remount.

## 6. Очередь реализации и критерий завершения

1. **3A: primitives/tokens**, без account queries: точные account/settings roles, icon mappings, caption card variant, settings row/group, Back settings. Старые public/default consumers не меняют вид.
2. **3B: /account**, приватный group, единый cabinet controller, identity/public query reuse, guest/auth/admin navigation, states и live Share до approve.
3. **3C: /account/settings**, реальные строки/переходы/logout, остальное hidden. /profile editor и его moderation не переписывать.
4. **3D: удаление** — отдельный backend/security контракт и acceptance ниже; без fake delete/hide-подмены. Delete CTA включается только с рабочим API.
5. **4: визуальная приёмка**, только затронутые сценарии и один production build; результат partial до необходимых evidence.

Не надо ждать реализации delete для независимых3A–3C; но общий срез с обещанным удалением не объявлять завершённым до3D. Каждый шаг отдельный коммит на актуальной feature-ветке; intake-коммит только docs, не содержит runtime-фиксов Kimi.

### Отдельная задача удаления: границы, не готовый backend diff

В текущем products API/client удаления нет; Product не имеет deletedAt. Не использовать ARCHIVED как deleted: существующий restore вернёт работу.
Целевой результат согласован: owner-auth DELETE /api/products/:id, техническая пометка удаления, без owner undo в MVP; подтверждение в UI. Чужое/несуществующее id не раскрывает данные; повторный DELETE владельца идемпотентен. Сессия/ownership на сервере, без доверия клиентскому статусу.
До backend-правок выполнить bounded security/design pass: owner/public reads, moderation approve/submit, works grids/counts/search/home selection, direct image/story routes, revisions/media references, legacy active commerce links, CDN/query cache. Использовать существующие транзакции/locks; delete не должен гонкой позволить approve/submit воскресить работу. Не удалять физически media до установления всех ссылок. Уже скачанные публичные изображения невозможно отозвать из браузерного кэша — UI deletion не обещает такого.
Удаление для SUSPENDED не трактовать как произвольный обход lifecycle locks; перед этой зависимой частью проверить существующий security owner и описать выбранную явную policy. Платёжные/auction таблицы и текущий commerce capability не включать и не каскадно удалять.
Это новая функция с миграцией/контрактами, не «иконка в карточке»; Kimi должен вернуть отдельный bounded backend-план до её кодинга. UX-семантика удаления одобрена; details безопасной реализации требуют перечисленного source pass.

## 7. Приёмка и передача

Чеклист и copy-ready prompt: [HANDOFF](HANDOFF.md).
Код приложения/Figma/БД этим intake не менялись. Выгружать Figma ZIP не требуется.
