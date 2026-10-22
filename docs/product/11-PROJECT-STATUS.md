# bidplace — текущий статус проекта

Краткий журнал **последних изменений** (portfolio MVP). Не загружайте целиком без задачи на историю.

| Нужно | Документ |
| --- | --- |
| Активный backlog | [`16-PORTFOLIO-ACTIVE-BACKLOG.md`](16-PORTFOLIO-ACTIVE-BACKLOG.md) |
| Релизные блокеры и приёмка | [`docs/audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md`](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md) |
| Очередь bounded review | [`docs/audits/current/06-NEXT-REVIEWS.md`](../audits/current/06-NEXT-REVIEWS.md) |
| Дизайн-статус | [`docs/design/04-DESIGN-STATUS.md`](../design/04-DESIGN-STATUS.md) |
| Решения | [`12-DECISION-LOG.md`](12-DECISION-LOG.md) |
| Записи до 2026-10-19 | [`docs/archive/product/11-PROJECT-STATUS-historical.md`](../archive/product/11-PROJECT-STATUS-historical.md) |

> Упоминания Pen до 2026-10-13 — история (DEC-119).

После изменения кода: добавьте **одну** датированную секцию в начало (ниже этой таблицы) со статусом `Implemented` / `Partial` / `Needs verification` и ссылками на модули и тесты. Не дублируйте длинные аудиты; переносите детали в owner audit или decision log.

## 2026-10-22 — Слияние responsive portfolio UI в MVP

**Implemented:** responsive AuthViewport и общий Reanimated sheet motion;
четыре этапа создания работы и редактор блоков без commerce; desktop-навигация
от1024px, общие footer/brand/layout, страница автора и ограничение empty-state CTA.
Доработки ревью: подписанные метаданные Review из формы/каталогов, фактическая
видимость dock, стабильные header/footer image nodes и восстановление фокуса.
Сохранены DEC-124/125: одно подтверждение регистрации, чтение документов не
блокирует её; API, права, медиа и ревизии UI-правками не менялись.

**Partial:** визуальное центрирование заголовка настроек оставлено по явному
исключению BackButton/FigmaIconButton; физический iPhone, реальный zoom200% и
увеличение текста — Needs verification. Последние проверки исходной UI-ветки:
mobile988/988, editor E2E26/26, UI68 passed/2 settings-center failures,
WebKit focus/motion20/20. На объединённой ветке полный `pnpm verify` прошёл:
mobile988, API integration155 passed/28 skipped, typecheck/lint и8 build tasks,
включая Expo web/iOS/Android export. Проверка184 Markdown-файлов прошла.
Исправление API legal-pack assertion `cc4911e5` уже присутствует в MVP.

Подробности: [UI completion](../audits/current/2026-10-21-UI-COMPLETION.md),
[author parity](../audits/current/2026-10-21-AUTHOR-PROFILE-PARITY.md),
[shared footer](../audits/current/2026-10-21-SHARED-FOOTER.md),
[independent review](../audits/current/2026-10-21-INDEPENDENT-UI-REVIEW.md).

## 2026-10-21 — Repository cleanup (docs only)

**Implemented.** Сокращены agent instructions (`AGENTS.md`, `docs/AGENT-MAP.md`), журнал статуса и execution roadmap; wave-prompts и audit PNG evidence удалены из активного дерева; First MVP tasks — в `docs/archive/tasks/`; тег `archive/audit-evidence-pre-cleanup` @ `3818f0f3` для PNG; `pnpm docs:link-check`; активный backlog — [`16-PORTFOLIO-ACTIVE-BACKLOG.md`](16-PORTFOLIO-ACTIVE-BACKLOG.md). Код, CI и runtime не менялись. Отчёт: [`docs/CLEANUP-REPORT.md`](../CLEANUP-REPORT.md).

## 2026-10-20 — Монохромный focus (DEC-127)

**Implemented (web).** По решению основателя общая семантическая роль focus
заменена на #121212 в light и #FFFFFF в black. FigmaTextField, глобальный
focus-visible и DateSelection продолжают читать единую роль; начальные значения
CSS синхронизированы с ней. Размер/offset индикатора, keyboard/pointer поведение,
ошибки/disabled не менялись. API и БД не затронуты. Black-палитра в целом остаётся
provisional, пользовательское включение темы не добавлено.

Проверки:14/14 owner unit (темы и поля), адресные browser checks полей/ошибки,
вкладок, календаря и CSS theme mirror —12 успешных случаев Chromium/WebKit
в двух проходах; typecheck/lint, design-tokens build, production web export.
Один старый тест зависел от фиксированных6 Tab: заменён переходом от известного
соседа с сохранением assertions. Calendar mock получил DRAFT revision; guards
продукта не ослаблялись. Реальный iPhone/native runtime не проверялись.

## 2026-10-20 — Восстановление ручной dev-выдачи после E2E

**Implemented.** Исправлена ошибка запуска приёмки календаря на общей dev-базе:
19 синтетических опубликованных профилей сняты с публичной выдачи с сохранением
записей и предыдущих revision pointers; пять демо-авторов и их медиа не менялись.
В e2e-fixtures десять входов создания PrismaClient проверяют выделенную e2e-базу
или test schema через assertFixtureDatabaseIsolation. Пишущий achievement-revision
сценарий исключён из sheet-local preview-конфига. Это защита тестового запуска;
правила серверной выдачи и UI не менялись.

Проверки: guard1/1 без БД; Search/avatar4/4 Chromium/WebKit, включая click→буква,
загрузку обеих копий фото vex и blur15px/opacity0.5; восстановленные пять демо-фото
проверены в обоих движках. Typecheck/lint — чисто. Полный suite/build не повторялись
для тестовых изменений. Причины и границы — в [аудите](../audits/2026-10-20-DATE-SELECTION.md).

## 2026-10-20 — UI после общего календаря

**Implemented (web, адресная приёмка).** AuthViewport показывает крест на всех
полноэкранных шагах регистрации через существующий requestDismiss, с dirty guard
и возвратом на redirectTo. SearchOverlayTabs занимает ширину колонки;
AuthorSearchRow применяет radius.small к окрашиваемому hit target и отделяет
статическую геометрию от interactionStyle для совместимости с Link asChild.
PublicSellerScreen включает gutter внутрь viewport ScrollView: размытие доходит
до края страницы, контент сохраняет прежние отступы и ширину сетки.

Chromium/WebKit: 8/8 адресных browser checks; ширины320/390/765, без горизонтального
overflow, clean-close, dirty-cancel и клавиатурный возврат. Pointer click и
input→click не показывают focus ring; клавиатурный Tab/Shift+Tab сохраняет его по
дизайн-системе §6.4. API/данные и палитра focus не изменены. Подробности и evidence:
[аудит](../audits/2026-10-20-DATE-SELECTION.md).
**Needs verification:** физический iPhone, реальный browser zoom, увеличенный
системный текст; новых утверждённых desktop-макетов нет.

## 2026-10-20 — Общий календарь и безопасный web lifecycle шторки

**Implemented (web).** `DateField` заменяет текстовый ввод даты достижения:
общие FigmaSelectField/AppDialog, React Aria1.22.1 для календаря и клавиатуры,
@internationalized/date3.12.4 для календарных значений; стили из текущих токенов.
Выбор дня либо только месяца, подтверждение, отмена, очистка; восстановление
`dateInput` совместимо со старым форматом. Между аккаунтами picker remounts;
внешняя смена значения/блокировка закрывает выбор. Серверные проверки и write
leases не изменены. Год создания остаётся числом0..9999; время публикации
по-прежнему серверное, планирование публикации не добавлялось.

В `AppDialogSheetMotion.web` одна DOM-оболочка с withTiming: выходящий контент
inert/aria-hidden; входящий контент активируется только после завершения
анимации, settled transform удаляется. Быстрый reopen не создаёт live exit-клоны Reanimated.
Native сохраняет прежние enter/exit; DateSelection.native использует совместимый
с SDK57 datetimepicker9.1.0. **Needs verification (native runtime):** нативный
picker на устройствах/симуляторе не запускался; успешен iOS JS/Hermes export.

Проверки: owner/state/modal unit65/65, typecheck/lint/diff-check, production web
export. Browser gate6/6 Chromium/WebKit (дата, реальная запись/публикация,
auth confirm, Home/share;320/390/440 и короткий viewport), evidence — в [аудите](../audits/2026-10-20-DATE-SELECTION.md).
Полный suite, реальный browser zoom и физический iPhone не проверялись.

## 2026-10-20 — Домик в общем floating dock

**Implemented (код).** Главная использует `home-01` из общего FigmaIcon вместо
отдельного BidplaceMark. SVG path установленного Home01Icon точно совпал с
live Figma node 7008:16942 (источник 7008:16896). Состав меню и маршруты
не менялись: корзина из reference остаётся вне MVP. Убрана неиспользуемая
ветка logo. Общий registry spec также приведён к уже существующим
setting-07/log-out. Адресные unit5/5, mobile typecheck, lint/diff-check и production export чисто.
Rendered Chromium/WebKit: path, href, selected state и видимость на320/390/440
проверены; evidence /tmp/bidplace-home-icon-{chromium,webkit}.png.
Календарь — отдельная незавершённая часть: выбирается web/native реализация;
поведение дат и API в этом коммите не меняется.

## 2026-10-20 — Регистрация: компактный слот статуса никнейма

**Implemented (ветка `fix/registration-nickname-step`, от `6379fcf0`).** Шаг
выбора никнейма: слот статуса `nickname-status-slot` резервирует ровно одну
строку `authStatus` (`minHeight` из `designTokens.typography.authStatus.lineHeight`
вместо фиксированных 46) — появление статуса не двигает поле и «Дальше»,
`minHeight` позволяет области расти при переносе длинной ошибки. Подзаголовок
шага — «Можете выбрать свой никнейм или предложенный». Один видимый статус
(проверка/доступен/недоступен/ошибка) без изменения логики: проверка только
по «Дальше», локальные три предложения, защита от повторного нажатия и
устаревших ответов, серверная уникальность при регистрации. Центрирование
AuthViewport не трогалось — блок стал компактнее и заголовок естественно
опустился (277 вместо 274 при 390×874). Замечено: новый подзаголовок при
ширине 350 (viewport 390) занимает две строки (Inter, шрифт загружен) — в
Figma-референсе одна строка; принято как факт измерения, не скрыто подгонкой.

Проверки: owner specs registration-consent 19/19 + use-slug-availability
(всего 27/27, новая регрессия резерва слота), e2e auth-layout «nickname
suggestions check availability only on explicit Next» и «auth composition
is stacked in the S4 phone column» — 4/4 Chromium+WebKit (координаты
приведены к новой композиции: поле 390→387, кнопка 452→449, чипы 551→548),
typecheck (единственная ошибка предсуществующая, вне скоупа), eslint
затронутых файлов, diff-check, production web build (expo export).
Скриншоты 390×874 до проверки и с занятым ником — оба движка.
Push/merge/deploy не выполнялись.

Корректирующая проверка: восстановлен заголовок предыдущей записи DEC-125.
В существующем nickname E2E добавлено сравнение Y поля и кнопки до проверки
и после короткого статуса занятого ника (точность 0,1 px). Проверка overflow
после смены viewport ожидает применения responsive layout через expect.poll;
требование отсутствия overflow не ослаблено. Gate на свежем production export:
Chromium/WebKit 2/2. Сборка database и mobile typecheck, lint спеки и
diff-check — чисто. Предыдущая ошибка typecheck после сборки зависимости
не воспроизводится. Первоначальный dist был без EXPO_PUBLIC_API_URL и не
запускался; повторный export с явным локальным URL успешен. Полный suite и
физический iPhone в этом проходе не проверялись.

## 2026-10-20 — Регистрация отделена от выдачи текста документов

**Implemented (DEC-125).** Один explicit checkbox, обычная CTA «Дальше»; документы
запрашиваются только по ссылке, ошибка показывается в общем AppDialog. GET legal503
не блокирует email→nickname→password→register. API сохраняет обязательные
confirmed/18+ и серверную файловую редакцию в атомарном User+evidence create.
Legacy client versions поддерживаются и stale отклоняется. Миграций и отложенного
согласия нет. Публичная выдача незавершённых policy по-прежнему закрыта.

Дополнительно исправлена воспроизведённая гонка перехода register→verify-email:
навигация ждёт отрисованную установленную сессию, как существующий login receipt;
epoch/controller/focus guards сохранены, таймеров нет.

Проверки: API owner32/32, mobile focused67/67, HTTP/БД3/3 в disposable schema,
production browser Chromium/WebKit (полный register201→verify-email после сбоя
чтения), API/mobile typecheck и builds, lint/diff-check. Browser gate использует scripted proof; дополнительно без подмены проверен
публичный test widget Cloudflare с реальным201 и verify-email. Production
challenge не проверялся; local/test адаптер принимает официальный dummy token
только в явно разрешённом test/local профиле.
[Аудит](../audits/2026-10-20-REGISTRATION-DOCUMENT-ACCESS.md).

## 2026-10-20 — Подтверждённые реквизиты оператора в legal pack

**Partial (документы).** По прямому сообщению основателя в шести подготовленных
текстах `docs/legal/site` указаны ИП Лешок Евгений Петрович и УНП693460361.
Источником реквизитов является основатель; независимая реестровая сверка не
выполнялась. Владелец статуса и оставшихся условий —
[итоговый юридический аудит](../legal/00-FINAL-LEGAL-AUDIT.md), §4/§7.

Публикация пакета и регистрация пока заблокированы незаполненными полями
privacy-policy: основание аналитики, страны/условия провайдеров, backup и
browser inventory. Серверный gate не менялся, API/БД/код UI не менялись.
Проверены одинаковые реквизиты во всех шести файлах, оставшиеся placeholders
и diff-check; runtime suite не запускался для текстовой подстановки.

## 2026-10-20 — Регистрация: состояние загрузки без отдельного error-блока

**Implemented.** Удалены красный текст недоступности legal-пакета, отдельная
кнопка «Повторить» и дублирующий loading-caption под формой. Состояние и retry
принадлежат существующей primary-кнопке: «Дальше» → при сбое «Повторить загрузку»;
во время загрузки штатный loading. Повтор не отправляет регистрацию, сохраняет
email и не отмечает согласие. Без пакета checkbox остаётся disabled.
API/серверный legal gate не менялись.

Проверки: registration-consent17/17, mobile tsc, lint/diff-check, production export,
адресные Chromium/WebKit (centered initial +503→retry→ready), без full suite.

## 2026-10-20 — Регистрация: центрирование и один consent control

**Implemented (web UI).** Fullscreen AuthViewport больше не ограничен sheetMax390;
его внутренняя колонка350 остаётся центрированной на320/390/440. AuthConsentCheckbox
показывает одно изначально пустое подтверждение с inline RegistrationLegalText:
три чёрные ссылки, серый основной текст, явное18+, без повторов названий и
служебной подписи редакции. Ложное предупреждение о смене сессии на ещё пустой форме устранено; epoch guards сохраняются.
Обязательные флаги, версии, reset при смене пакета,
защита операции/сессии и серверный legal gate сохранены. Решение основателя:
DEC-124, пересмотр UI-композиции DEC-078; это не юридическое заключение.

Проверки: unit25/25 (registration-consent + theme), mobile tsc, tokens build,
production export, адресный browser gate Chromium/WebKit на320/390/440,
eslint и diff-check. Серверная публикация юридических документов остаётся
отдельным блокером: локальный GET /auth/legal возвращает503 при незаполненных
реквизитах; эта правка не подставляет фиктивные документы в runtime.
[Приёмка](../audits/2026-10-20-REGISTRATION-LAYOUT.md).

## 2026-10-20 — Account: финальная приёмка и исправления

**Implemented (проверенный web-срез); Needs verification — реальный iPhone,
browser zoom/text enlargement.** Исправлены дубликат account после закрытия
настроек (обе кнопки используют dismissTo), растянутая CTA, верхние отступы
через варианты FormPageShell, композиция AccountIdentity и симметрия settings
header. settingsTitle/settingsRow сохраняют source line-height normal.
API, права, БД и backend удаления не менялись.

Проверки: production web export, mobile tsc, адресные unit40/40,
production browser6/6 Chromium+WebKit (320/390/414/440, long identity,
unverified settings, published identity, scroll8works, close→Back),
eslint/format/diff-check. Backend e2e/full suite не повторялись.
[Итоговый аудит и evidence](../audits/2026-10-20-ACCOUNT-FINAL-ACCEPTANCE.md).
Delete-план дополнен реальной Worker JSON cache policy; реализация удаления —
отдельная волна. Desktop1024/1440 и black parity: NEEDS-FIGMA.

## 2026-10-20 — Account UI: волны 3A–3D, повторное ревью AC-01…AC-07

**Implemented (ветка `fix/account-foundation`).** Реальные маршруты
`(account)/account` и `(account)/account/settings`; легаси-плоские
`account.tsx`/`settings.tsx` удалены. AccountScreen — композиция на
FormPageShell (единый scroll-owner): published identity при APPROVED
только из публичного author-кэша (owner profile с editing overlay не
читается — read-цепочка фото подтверждена волнами 1–2), иначе identity
из сессии; локальная ошибка identity («Не удалось загрузить профиль» +
retry) не блочит кабинет. Owner-кабинет на аккаунте делает общий
контроллер с /cabinet (один query key, дедупликация; attempt-based retry
hide/restore; inline-ошибка следующей страницы с сохранением работ).
Сессия и приватный кэш: общие guards (auth epoch, not_found→null
классификация) без изменений. Shared-компоненты: AccountIdentity
(row + CTA slot), SettingsGroup/SettingsRow (trailingArrow/busy),
WorkCoverCaption (новая роль `coverCaptionTitle`; author — `coverCaptionAuthor`),
ResilientRemoteImage `fallback: 'plain'|'labelled'`, новая semantic-роль
`accountMeta` (black остаётся provisional). FormPageShell получил
testID `form-page`.

Проверки: account consumer specs 9/9 + адресные 42/42 (5 файлов),
production web build (expo export, Node 22), браузерный gate
`e2e/account-screen.spec.ts` 10/10 Chromium+WebKit (dock→/account с
ожиданием гидратации сессии, published identity, настройки пуш/закрытие/
прямой URL/refresh, guest neutral not-found /authors/<slug> до публикации,
320 без горизонтального переполнения, прокрутка на 320×568).
tsc/eslint чисто. Коммиты `e59c35bc`, `aaa0972d`, `fb8923c4` (+docs).

Волна 3D: backend/security-план удаления работ уточнён по DP-01
(`{ok:true}` вместо 204, tombstone-проверки под существующим lock у всех
поздних writers включая admin approve, CDN purge через revoke-путь,
owner/admin bypass не вводится) — план на review, кодинг не начат,
delete CTA в UI отсутствует. Остаток: точная Figma-сверка экрана
аккаунта (следующий этап — один экран по exact Figma node), физический
iPhone/native, browser zoom 200%/увеличение текста — Needs verification.
Push/merge/deploy не выполнялись.
Второе повторное ревью (CR-01/02/03, DP-02, коммиты `5ffafb5e`,
`1d482747`, `56d11b8a`): owner hide/restore переведён на единый intent
(`{workId, action}`) — ошибка, confirm и retry принадлежат одной работе
(красные регрессии A→ошибка→отмена→B и restore(A)→hide(B); legacy
/cabinet на том же контроллере, кнопка «Скрыть» блокируется при pending).
Settings: безопасный возврат через `dismissTo('/account')`/крест
`replace('/account')` — прямые URL/reload возвращают в аккаунт, e2e
обновлён (reload-close не исключён), gate 10/10 Chromium+WebKit.
Identity: без displayName имя — один `@slug`, дубля нет. План 3D
дожат по DP-02: единый `200 {ok:true}` и в §6 тестов, фактическая
cache policy зафиксирована по коду (`private,no-store` owner JSON,
`no-store`/`must-revalidate` публичные JSON — решение до кодинга;
product images остаются `immutable`), аналитическая «отдельная строка»
снята. Consumer specs 14/14, адресные 28/28. Визуальные детали
(CTA width, insets) сознательно оставлены для измеренной приёмки
следующего этапа по сохранённому intake ace4a323.
[Файл выполнения](../audits/2026-10-19-ACCOUNT-FOUNDATION-PROGRESS.md).

**Implemented (волны 1–2, ветка `fix/account-foundation`).** Единая политика
ширины для AuthViewport и общего AppDialog: viewport ≤600 CSS px — sheet во всю
ширину; >600 — ограничение 390; центрированные диалоги сохранены; fullscreen-
регистрация держит измеренную колонку 350. Общий `fetchSellerProfile` с одним
query key, staleTime 60s/gcTime 5min, кэшированным отсутствием (404 → null) и
guard'ом auth epoch; общий `classifySellerProfileQuery`: текущая ошибка
(network/5xx/401) приоритетнее кэшированного null, отсутствие = успешный null
или актуальная not_found. Трассировка фото подтвердила: `getPhoto` отдаёт
базовое (опубликованное) фото, editing-фото — `getEditingPhoto`; approve копирует
фото ревизии в базовый профиль (approve mapping закреплён unit-тестом с мокнутой
записью; read-сторона цепочки покрыта отдельными спеками, не end-to-end).
API не расширялся; опубликованная идентичность для /account берётся из
существующего публичного контракта (`/api/authors/:slug` + `/api/sellers/:slug/photo`).

Production web build на Node 22; браузерная приёмка Chromium + WebKit: 320/390/414/440/600 —
шторки во всю ширину, 601/1024 — 390, поля заполняют внутреннюю ширину;
fullscreen-регистрация 350; centered exit-confirm 366 (центровка delta 0);
короткая высота 390×500 — шторка в пределах вьюпорта со свайпом; login↔forgot без
изменения ширины; свайп закрывает, URL стабилен. Evidence и измерения:
`docs/audits/current/evidence/2026-10-19-sheet-widths/`.
Адресные тесты: 32/32 (mobile owner specs AF-01), 43/43 (API moderation/sellers),
tsc/eslint чисто. Коммиты `ba00fb37`, `2eed81dd`, `6e89f8b9`, `d14734e6`.

Известный остаток: возврат фокуса после закрытия auth-шторки не попадает на
триггер dock — FloatingDock полностью размонтируется пока шторка открыта
(предшествующее поведение, волнами 1–2 не затронуто); share/report диалоги фокус
возвращают (pinned gate). Browser zoom 200% / увеличение текста — Needs
verification (ручные шаги переданы ранее). Волна 3 (/account) не начата — ждёт
Figma intake. Push/merge/deploy не выполнялись.
[Файл выполнения](../audits/2026-10-19-ACCOUNT-FOUNDATION-PROGRESS.md).


## 2026-10-22 — Web auth: server-session wave

**Partial (overall auth migration).** Server session transport implemented in
SessionService, session/optional/logout guards, bootstrap and api-client. Additive
AuthSession migration; no production migration/deploy. Session/auth/config unit
checks and isolated HTTP transport pass (including restart, CSRF and late-save
after logout). OIDC/email-code/onboarding UI are the next waves.


## 2026-10-22 — Web auth completion

**Implemented locally (auth waves 3–5); external acceptance pending.** One User ID
for password, email code and explicitly linked Google/Telegram. openid-client owns
OIDC signature/state/nonce/S256 PKCE; PostgreSQL owns one-use browser flows.
Social accounts keep a real email and may have no password; pending identity
requires its own proof and grants no ordinary principal. Recovery, logout and
account switching invalidate pending proof. Shared auth-abuse owns OTP HMAC,
mail budgets, cooldowns, pause, purpose isolation and idempotency. Session save
failure can resume committed proof without another User.

API/contracts/database, api-client/AuthProvider, login/code/onboarding/settings,
CI and Cloudflare runtime bindings are implemented. Local independent security
review findings were fixed (in-flight account switch, private cache, delayed
hydration, clock skew, navigation receipt and suspended-route retry).
Chromium/WebKit: 8/8; signed test IdP HTTP owner: 33/33 including browser runner.
`pnpm verify` passed: typecheck/lint, 1535 unit tests, 218 integration checks,
31 operations checks, E2E fence and API/web/iOS/Android builds. One optional
browser-runner skip in the general integration run was executed explicitly in
the 33/33 gate above. Cloudflare: 31 Vitest + 20 Node checks passed. Docs links
and diff whitespace checks passed. Production `build:web` passed with canary
checks for session/OTP/provider server settings in SPA assets. Server wave commit: `d6752e6c` (sessions
were committed earlier as `061294e3`). The isolated linux/amd64 image smoke
passed migration, auth boundary, native modules and SIGTERM. See [rollout and remaining acceptance](../ops/WEB-AUTH-ROLLOUT.md).

Google/Telegram real-provider smoke requires safe provider configuration and is
not claimed. New UI compositions remain NEEDS-FIGMA. PR56 media remains OPEN
and draft when checked on 2026-10-22; it was not integrated. No push/merge/deploy
or production migration was performed.
