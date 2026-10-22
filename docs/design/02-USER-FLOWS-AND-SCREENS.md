# bidplace — пользовательские потоки и экраны First MVP

Последнее обновление: 2026-10-11
Статус: Confirmed product/UI scope for mobile-web 390 Figma cutover
Product contract: [`../product/05-MVP-RFC.md`](../product/05-MVP-RFC.md)

## 1. Источник и граница

Новый оригинальный Figma-файл `NM63j9lwRMqpo2HvAiYNll` — read-only visual target
portfolio-first UI. Его запрещено редактировать, переименовывать, очищать или
пересохранять в code-задачах. Screenshots являются review evidence, но точные tokens,
assets и measurements берутся только из versioned inspect/handoff.

Текущий production visual source на mobile-web 390 — live Figma
`pAPQo6cADmG5XzVmBX76EE` (`DEC-119`). Product owner documents и server contracts
по-прежнему определяют routes, data, permissions и auction behavior.

### Registration document reading —2026-10-20, DEC-125

Один explicit control подтверждает документы и18+ при регистрации. Создание
аккаунта не зависит от GET текста, CTA всегда «Дальше». По ссылке —существующий
AppDialog, loading или ошибка чтения; закрытие сохраняет email/checkbox.
Сервер определяет фактическую редакцию при атомарном создании аккаунта.
Дополнительного принятия перед заявкой/публикацией нет. Это уточнение заменяет
описанное ниже переключение primary action на повтор загрузки.

### Registration consent —2026-10-20

DEC-124 уточняет предыдущие auth-описания: один пустой checkbox явно подтверждает
три документа и18+. Полные тексты доступны inline до принятия, без потери формы.
Один клик заполняет существующие обязательные флаги и версии документов; открытие
ссылки не принимает документы. Недоступный пакет блокирует продолжение, смена
редакции требует повторного подтверждения. В UI нет служебной подписи версии и отдельного error/retry-блока под формой.
Сбой загрузки переключает основную кнопку на «Повторить загрузку»; успешный
повтор сохраняет email и возвращает «Дальше», без автоматического принятия.
Регистрация остаётся fullscreen, центрированная form-column350 без sheetMax390.

### Web auth additions — 2026-10-22

Password login remains `/login`; `/email-login` is its explicit alternative for
an already registered, verified account. Unknown email does not create a User.
Google/Telegram start through `/api/auth/providers/:provider/start` and return to
the exact configured server callback. Known active identity signs in; a new
identity continues at `/auth/complete` with email, nickname and one legal consent.
Social profile completion reuses the existing browser-bound provider proof,
without a second registration CAPTCHA. Pending email proof grants no ordinary
session; mail requests retain CAPTCHA. Failed email-code verification uses one
neutral typed refusal; provider failure/cancellation preserves redirectTo. A conflicting email asks for
ordinary login, then a new explicit link intent in `/account/settings`.
Connections require authentication within five minutes and never transfer an
identity owned by another User. No unlink, phone/SMS, native provider login,
magic links, passkeys or MFA were added. New composition geometry is NEEDS-FIGMA;
existing shared auth and settings primitives own layout and interaction.

### Auth presentation — 2026-10-08

Current fullscreen registration/confirmation source:
[`2026-10-08-auth-fullscreen`](../../design/figma-handoff/auth/2026-10-08-auth-fullscreen/README.md).
`DEC-106` adds the brush mark at the top and outlined wordmark at the bottom.
Only the previous four fullscreen captures were replaced; login/recovery/exit
retain the dialog source. The runtime mark sits in the source frame and the
wordmark uses the source bottom inset. The email checkbox is one control.
Registration continues once, only after `acceptRules` confirms the version
shown to the account this attempt created. A failed acceptance stays on the
form and the retry calls only `acceptRules` for that account. A different
session does not inherit the version or the acceptance. A session that
arrives while `register` is still waiting stays in place: the late response
does not replace it, accept rules, or continue that attempt. A failed
`register` drops that in-flight claim. The request is not cancelled and the
created account is not deleted. The published rules
text can be read before acceptance; a failed load can be retried. The
privacy-policy link opens the temporary «Документ готовится» dialog, not an
approved policy. The confirmation body has no extra logout button;
account logout stays on the profile, cabinet and moderation screens.
The two captured consent checkboxes are two states of one control, not two
simultaneous fields. This visual source update does not approve legal drafts.

Login stays a bottom sheet. Registration is the full-screen sequence email,
nickname, password, then email confirmation (`DEC-105` revision). Deep links
stay `/login`, `/register`, `/verify-email`, `/forgot-password`, and
`/reset-password`. The nickname is `User.slug`, including the public author
address. New registration and claim requests require 3–20 characters through
the shared write contract (`DEC-107`); invalid registration input cannot check
availability or advance. The nickname step shows three neutral local
suggestions. Typing or selecting one only updates and locally validates the
field. `Next` performs exactly one availability read: available advances,
taken stays and refreshes all three suggestions, and a retryable failure stays
with the entered value. Suggestions remain when returning from password.
Availability does not reserve the nickname; final `slug_taken` returns to this
step without clearing email or password. Historical stored nicknames retain
their read contract.
The author profile does not edit a second slug. An existing account
with no slug chooses that nickname, with the registration field, before the
author profile is created. A slug that is already set is not edited in this
wave. The name is entered later as `fullName`. Having a slug does not by
itself publish the author. Password repeat stays on the client. The
account is created once. Recovery stays the single-use link. Google and
Telegram report that sign-in is unavailable. A successful login, registration,
or confirmation continues once and does not ask to leave. Login, password
recovery, and email verification close without an interruption confirmation,
including when their fields contain input. Close, Escape, backdrop, and
Back/Forward share that policy (`DEC-111`). Registration is the only auth form
that protects entered data. An empty registration leaves without asking. A
registration that has input asks before a close, Escape, backdrop, or history
traversal that leaves auth. Continue keeps the current step, values, and
focus. Interrupt performs that exit. Back from one auth route to another does
not ask, even when registration has input. A multi-step Back or a Forward that
leaves a filled registration returns the address to that registration until
the user confirms. A request in progress still keeps the sheet and is not
cancelled. Successful completion navigates once. Leaving does not
cancel an in-flight request, delete an account, or log out. A session change
during registration, including while `register` is still waiting, does not
let the old attempt replace the newer session, write consent, or continue.
Verification can be finished later, and the screen does not say a code arrived
before the send is accepted. Recovery and wide layouts are derived from the phone sheet.
Details:
[`current auth HANDOFF.md`](../../design/figma-handoff/auth/2026-10-08-auth-fullscreen/HANDOFF.md).

## 2. Основной flow

```text
Visitor
  → Home / Works / Authors / Search
  → Creator profile
  → Work
  → Share / QR

Author candidate
  → Email registration and verification
  → Author application/profile
  → Admin moderation
  → Work draft
  → Work moderation
  → Published Creator + Work
```

Commerce routes/actions отсутствуют в First MVP navigation и fail-closed на сервере.

## 3. Screen matrix

| Экран              | First MVP                                                                                              | Убирается/откладывается                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Global navigation  | Home, Search, Add, Profile                                                                             | Cart, likes, notification bell                                              |
| Home               | Открытие недели (optional server selection), новые работы, авторы                                      | Активные торги, цены, timers                                                |
| Works              | Search, category/material filters, newest/oldest sort, pagination                                      | Auction/announcement/archive tabs, price/status filters                     |
| Authors            | Search, tag/city filters, name/date sort                                                               | Rating, followers, sales and verified authenticity claims                   |
| Creator            | Header, chips, socials, share/QR, `Работы`, `Об авторе`, achievements                                  | Public `Архив`, cart, like, bell, private states                            |
| Work               | Gallery, title, author, chips, optional story, details, related works, payment/delivery stub           | Price, timer, archive badge, bid CTA/history                                |
| Auth               | Email/password, verify email, forgot/reset                                                             | Telegram/Google OAuth, passwordless code, buyer-only promotion              |
| Author application | Photo, name, slug, location, about, tags, optional socials/achievements                                | Sale language, buyer handoff contact                                        |
| Work creation      | Photos/title, details, optional heading/paragraph/image blocks, moderation submit (`DEC-112`; planned) | Sale mode, price/currency/time, payment, delivery, buyer contact, AI, video |
| Admin              | Author and Work moderation, user ban/session revoke                                                    | Commerce Orders/recovery as active First MVP workflow                       |

The admin author card shows the revision approval publishes, including an
achievement date at its stored month or day precision. A null date is omitted.
The revision photo is the photo of that same review target.

Search, status filters, and the Authors and Works tabs stay on the moderation
screen while a new list query is loading or has failed. A search longer than
200 characters stays in the field and can be corrected. Loading, empty, error,
retry, and that limit message appear in the results area. The previous cards
are not treated as the results of the new query.

When a guest opens a protected internal route, Login receives its validated
pathname and query as `redirectTo`; successful authentication returns to that
route. External targets and auth routes are never restored.

An authenticated unverified user who opens an Author route is sent to
`/verify-email` with the same validated internal destination. A new
registration opens that confirmation even when `/register` has no
`redirectTo`; the safe destination stays in the query and is `/` when none
was given. Confirmation returns to that route. The email step starts with
one unchecked consent control; continuing requires that choice, and the
choice stays while the later steps are filled. Nickname availability is a
read of `User.slug` and does not reserve it. Login, recovery, registration
and email confirmation hide the dock; leaving auth shows it again. Public
browsing and an already authenticated Home visit do not require email
verification.

Email confirmation is **state-first**: status copy follows server `sendStatus`
and timers (`none`, SMTP-accepted without mailbox proof, `unknown`, `rejected`)
before field-level reasons. Wrong-code feedback tells the user to edit the code
then retry verify; cooldown, quota, pause, Turnstile, and disposable outcomes
use dedicated reason lines. Unverified email correction is a separate explicit
action, not mixed into resend. After it succeeds, confirmation reads fresh
state for the saved canonical address. A failed read keeps that address and
offers «Повторить чтение»; retry performs only GET and does not send mail.
Repeating the same idempotent send after a network or `unknown` outcome does not
imply another message was sent. Turnstile
must succeed before send when required; missing site key or script on web shows
unavailable copy and blocks submit (fail closed). Recovery forgot-password keeps
neutral accepted copy for successful suppression paths; validation and Turnstile
refusals stay typed errors. Neutral copy does not prove delivery.

Phone chrome is one 232×64 four-item glass dock: Home, Search, Add, Profile
(`DEC-088`). Search lives inside the capsule. Cart and the unused split-search
FAB are not production items. Public share aliases `/works/:id` and
`/authors/:slug` resolve to the existing Work and Creator routes.

## 4. Home

`Открытие недели` рендерится только из `home.curatorSelection` (`DEC-086`).
Если selection `null` или недоступна, секция отсутствует. Left column, handle,
and «Смотреть профиль» bind `selection.curator`. Work card `@author` binds
`selection.work.author`. Optional `note` is editorial copy on the selection
(`DEC-090`); empty/null hides «Выбор куратора» and the paragraph, not the
curator row, profile button, or work card. Work cards показывают название и
`@author`. «Новые работы» — header + hug quiet «Смотреть все» (`/works`) and
a horizontal `WorkCoverCard` scroller from `home.newWorks`. После работ —
`Новые авторы` is Frame 47 geometry with `AuthorCoverCard` photos from
`home.newAuthors` and «Смотреть все» → `/authors`.
If Home content loads while `/api/auth/me` has an infrastructure failure, Home
stays usable and public chrome does not show a session banner. Blocking session
failure belongs to protected routes.
Blocking page fetch (Home, Work, Creator, protected session, admin/form
loads) shows only the Bidplace mark as a loading indicator. It does not use
«Загружаем bidplace…» or other large loading titles. Compact inline loaders
stay on Search, catalogs, seller works tab, and achievements.

## 5. Works and Authors discovery

Works filters: category and material. Authors filters: direction/tag and city. Search и
filtering выполняются сервером до pagination. Чипы в profile/cards сохраняют Figma
appearance; пока переход по тегу не включён, они семантически не являются кнопками.

Кнопка результата использует `работ`, не `лотов`. Unsupported placeholder filters не
рендерятся. Popularity/price/availability sorting отсутствует.

`/works` and `/authors` share title → intro → Filter/Sort → cards. Catalog-segment
tabs (`874:5421` / `526:13314`) stay hidden (`HIDE_FOR_FIRST_MVP`). Catalog intro
copy is the approved MVP strings; the visual role is `bodySmall` default ink
14/20/400/−1% `#2A2A2A` (`526:12957`, `526:13308`), not `textSecondary`.

На mobile web `/works` и `/authors` коммитят фильтры и сортировку в URL только
после `Применить`; sheet хранит локальный draft до Apply/Reset. Dock Search
opens a fullscreen overlay over the current public page (`DEC-096`). Empty
query shows the active tab’s public list; typing live-filters Categories
client-side and sends `q` to Works/Authors after 300ms. `/search` remains a
thin deep-link host for the same overlay. Opening Search adds one history
entry on the current route; query/tab edits replace it. X and Escape return
to the underlying entry. Back from an Author/Work/category result restores
that Search session. Direct `/search` close falls back to Home. Work and
Author detail Back follow history first (`navigateBack`), with `/works` or
`/authors` only when the stack is empty. Works catalog shows the same
history-first Back when `router.canGoBack()`, and hides it on a direct
`/works` load. Active-tab infrastructure failure
is one inline Retry; header, field and tabs stay. Category tiles have no
production media yet. Work `?tab=`
is URL-owned; Author About is local state and is not a `?tab=` contract.

## 6. Creator profile

Публичные вкладки:

```text
Работы N | Об авторе
```

Все published portfolio Work находятся в `Работы`. Draft, Pending, Rejected и Hidden
видит только автор в кабинете. Sold/unsold taxonomy вернётся вместе с commerce и не
восстанавливает один общий public `Архив`.

`/cabinet` — owner-management home одобренного или ограниченного автора: profile
summary, переход в редактор профиля, все собственные Works и их текущие moderation
states. Карточка хранит раздельно public Product state и editing-revision state;
скрытие и восстановление меняют только public visibility. Buyer cabinet не входит в
portfolio MVP.

`Об авторе` поддерживает about, practice и optional achievements timeline. Пустые
секции скрываются. Bottom navigation учитывает safe area и не закрывает текст/cards.

Web 390 Creator sticky header has two product states: expanded and compact.
Compact starts when scrolling reaches the measured park
`scrollTop >= heroHeight - compactStack` (`compactStack` is
`space.x3 + size.header + space.x5` = 80). Returning to
`scrollTop <= park - 20` expands again. Between those values the current
state is kept. CSS `position: sticky` parks the header. One `CreatorIdentity`
stays mounted; avatar, handle and actions keep the same nodes. Compact only
changes their layout. Reanimated `LinearTransition` (`200ms`,
`cubic-bezier(0.2, 0, 0, 1)`, `ReduceMotion.System`) interpolates those
nodes. Tabs sit below identity at `y≈80` and are not part of that
animation. Compact chrome is a presentational `StickyDockSurface` filling a
host owned by the Creator header (`stickyDock.fullHeight`), painted behind
identity and tabs as full-width square navigation glass. See
[`03-DESIGN-SYSTEM.md`](03-DESIGN-SYSTEM.md). In-session Works/About switches open the new panel from
its own start under the current header, without reopening the hero.
Direct loads stay at the page start. Page scroll is not
snapped. Web compact chrome (~106px with tabs) is an intentional deviation
from Figma iPhone `y=44` / tabs `y=186`. Canonical tokens
`creatorCompactTop` 44 and `creatorCompactHeader` 186 stay Figma source.

## 7. Work

Work page uses PREVIEW. Opening a gallery photo mounts the selected FULL in the
shared AppDialog viewer; closing removes it. Previous/next operate inside the
viewer without preloading the full gallery. Legacy images without a FULL URL
retain their existing image. Image loading/error stays with ResilientRemoteImage.

Owner Work/author and admin show publication waiting or delivery error while the
existing Nest executor retries. A first publication remains unavailable until
media delivery; a replacement keeps the previous public revision until atomic
publish. Successful Work save/submit completes its dirty-history guard before
navigation. Detailed implementation evidence lives in
[Work lifecycle result](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).

Hero chrome follows Frame 76 (`745:21332`) relative to the web gallery, not the
Figma iOS status bar: 12px from the hero top, 20px side inset, 48×48 glass Back,
Like hidden, Share kept. Inactive gallery dots (`745:21219`) are `color.border`
`#DEDEDE`. Metadata chips (`745:21232`) share Creator `onGlass` fill and a 1px
outside `#DEDEDE`→`#F3F3F3` ring, with Work pad 6/12 and 14/500 `#565656`.
Expanded 390 composition is gallery media 520, dots after `space.x3`, identity
after `sectionGap` 20, tabs after `space.x10` 40.

Web 390 Work sticky chrome shares Creator compact `stickyDock` geometry
(action zone 80, controls 12/48/20, tabs 26) without sharing Creator park
physics. Back/Share overlay the gallery at rest and remain the same nodes
while scrolling (CSS sticky). The full-width square navigation-glass dock appears only when
tabs stick at `y≈80` under Back/Share. Identity and chips scroll away. Tab
labels keep `space.pageGutter` inset; the tab divider stays full-bleed. There
is no compact thumbnail and no Figma scrolled Work frame. Page scroll is not
snapped. In-session Story/Details/Payment switches open the new panel from
its own start under the current chrome, without scrolling the page to top.
Direct `?tab=` loads stay at the gallery top. Short Payment may undock if
maxScroll shrinks; no fake min-height. Native Work stays expanded-only.

Portfolio variant сохраняет визуальную галерею и информационные блоки. Tabs:

- Цель `DEC-112`: `История` появляется при наличии блоков в опубликованной
  ревизии, показывает их в сохранённом порядке и не вставляет галерею автоматически.
  Текущий runtime всё ещё показывает plain text с gallery extras по прежнему `DEC-093`;
- `Детали` всегда.

`Оплата и доставка` пока присутствует в runtime как v1 stub; в portfolio target
она отсутствует и отложена в [sales plan](../product/15-POST-MVP-BACKLOG.md).
`Ставки` отсутствуют. `Другие работы автора` содержит только Work cards; ссылка имени уже
ведёт в Creator profile. Claims об authenticity/provenance маркируются как
информация автора, если platform не проводила экспертизу.

## 8. Author application

Четыре URL-owned шага:

1. photo/name/slug/location;
2. optional public Telegram, Instagram, HTTPS website and author-provided email;
3. short about, practice and directions;
4. optional achievements.

Шаг 1 реализован в мобильном клиенте (`DEC-114`, `DEC-117`): страна выбирается по названию в popup со списком и поиском, код хранится и отправляется в API; страна пустая, пока не выбрана, и «Продолжить» без неё недоступно. Город необязателен и стоит отдельным полем под страной; очистка города уходит в том же сохранении, что и замена фото. Подзаголовок шага — «Город можно не указывать». Фото в начальном состоянии без строки «Фото обязательно»: требование остаётся в готовности и в контракте сервера. Интро и все четыре шага используют общий мобильный chrome (`AuthorApplicationStepShell`, модули `author-application-*-step.tsx`) и Figma-поля; актуальный статус — [04-DESIGN-STATUS.md](04-DESIGN-STATUS.md) (2026-10-12). Шаг 3 подключает направления через `AuthorDirectionsPickerSheet` (`DEC-116`): поиск, чекбоксы и снимаемые чипы работают с теми же category ID, что и сервер. Шаг 4 — опциональные достижения: одно поле «Дата достижения» (месяц и год `MM.YYYY` либо точная дата `DD.MM.YYYY`), без выбора фото для новой записи. Источники 2026-10-11 и расхождения с product copy: [backend/capture plan](../archive/tasks/2026-10-11-author-story-backend/PLAN.md).

Никнейм принадлежит `User.slug`, а не заявке автора. Уже выбранное значение
не редактируется и не отправляется в create/update профиля. Для аккаунта без
никнейма claim выполняется до создания профиля; его write-контракт описан в
`DEC-107`, исторические значения не обрезаются. Ошибки сервера
`validation_error` показываются у известных полей одновременно; неизвестный
ключ остаётся общей ошибкой формы. Занятый никнейм и уже созданная заявка —
разные сообщения. Сбой сети и 5xx не выглядят как ошибка ввода. Черновик
можно сохранить без описания и ссылок. Пустые направление и короткое описание
на шаге 3 молчат, пока поле не покинули и «Продолжить» не нажали. После этого
у поля видно «Укажите направление» или «Добавьте короткое описание о себе», и
шаг 4 не открывается. Пробел и удаление текста не снимают это сообщение.
Правильное значение снимает только сообщение своего поля. Ошибка формата или
ответ сервера важнее этой подсказки. Сброс формы и смена сессии не переносят
показанные подсказки в новую форму. Эти сообщения не блокируют сохранение
допустимого неполного черновика. Принятое повторное сохранение снимает ошибку предыдущей
попытки. Ответ старого запроса после смены сессии не публикует прежнее
сообщение и не стирает ошибку новой попытки. Те же правила показа ошибок действуют
для существующей формы работы, входа, регистрации, восстановления пароля,
кода почты и полей причины в админке.

Сервер хранит private resume boundary: draft открывается на последнем
разблокированном шаге, а прямой locked URL ограничивается этой границей. Auth email
не подставляется как public email. Выход сохраняет валидный dirty draft без
продвижения шага; dialog различает уже сохранённый черновик и несохранённый Step 1
input. Обычное сохранение оставляет поле и фото, изменённые после отправки этого
запроса. Поля, которые после снимка не менялись, принимают нормализацию ответа.
Ответ, начатый в предыдущей сессии, не записывает профиль, выбранное фото и не
продолжает шаг или отправку новой сессии, в том числе после повторного входа
той же учётной записи. Выбор фото или чтение файла, которые завершаются уже
после смены сессии, не попадают в форму и в следующее сохранение.
Переход шага, выход и отправка блокируют ввод до конца перехода и не продолжаются,
если сохранение не удалось. На время добавления или удаления достижения поля
даты и описания недоступны; описание остаётся видимым. Неудачное добавление
оставляет введённый текст и дату. Неверный формат даты и серверные ошибки
`occurredDate` показываются у группы «Дата достижения». Успех очищает только
черновик этой операции. Отправка, переход шага, выход и logout не начинаются,
пока эта запись не завершилась, и новая запись достижения не начинается после
уже начатого перехода родителя (включая прерывание несохранённого события при
«Назад»). Повторное чтение заявки само по себе записью не является. Успешная
запись достижения заменяет чтение списка, которое началось раньше неё.
Отображение даты в списке не придумывает день, если его не было.

Одобренный автор остаётся на том же `/profile` без шагов заявки. «Отправить на
проверку» показывается, когда editing revision уже можно отправить:
`DRAFT`, `CHANGES_REQUESTED` или `REJECTED`. Действие сначала сохраняет форму и
отправляет ревизию только после успешного сохранения. Подтверждённый ответ
сразу переводит экран в pending, не дожидаясь повторного чтения профиля.
Пока этот цикл идёт, повторная отправка, обычное сохранение и выход не
стартуют. Ошибка или устаревший ответ повторного чтения оставляют уже
подтверждённый pending. Более новый ответ со статусом одобрения, запроса
правок или отклонения сменяет его. Pending revision закрывает редактирование и повторную
отправку. Публичные данные и media остаются прежними до approval.

Локальное восстановление (DEC-121, 2026-10-15): набранный на любом шаге ввод
автоматически сохраняется локально в браузере (ключ привязан к аккаунту и к
заявке) и восстанавливается после reload, закрытия вкладки или неудачного
сохранения — включая незавершённые дату и текст недобавленного достижения.
Черновик применяется, только пока совпадает серверная ревизия; после первого
успешного создания заявки локальный ключ мигрирует на её id. Успешная отправка
на проверку, выход из аккаунта и сохранение без последующих правок локальный
ввод очищают. Восстановление ничего не отправляет и не публикует автоматически.

## 9. Work creation

Три content-шага и отдельная проверка:

1. title, category, dimensions, material/technique, edition fact and creation date/year;
2. main images;
3. optional heading/paragraph/image story blocks (`DEC-112`; target not implemented);
4. review and moderation submit.

Шаг хранится в URL. Поля принадлежат одной форме; server detail остаётся
источником сохранённого состояния. Переход между шагами, Close, in-app Back и
submit сначала сохраняют dirty values; browser unload предупреждает о
несохранённых изменениях. Обычный query refetch не перезаписывает dirty input.
Обычное сохранение не блокирует ввод: ответ обновляет сохранённую базу, а текст,
набранный после снимка, остаётся и считается несохранённым. Повторное обычное
сохранение или переход, пока первая запись ещё идёт, не отправляет второй запрос
и не уходит с экрана. Сохранение перед сменой шага, закрытием или отправкой
блокирует ввод на время перехода. Пока это сохранение не завершилось успешно,
внешнее закрытие маршрута остаётся заблокированным; повторный Back не запускает
второе сохранение. После подтверждённой отправки Save и Submit не открываются, а Close снова
доступен. Чтения detail, начатые до или во время сохранения и отправки, не
снимают защиту и не подменяют cache. Пол — достоверная editing revision после
успешной отправки, а не timestamp до сохранения: промежуточный snapshot с тем
же статусом «нужны правки» или «отклонено» и более поздним updatedAt форму не
открывает. Часы родителя с часами revision не сравниваются. Подтверждённый
pending не открывает Save и Submit. Более новое решение модератора — одобрение,
«нужны правки» или «отклонено» — снова разрешает редактирование. Запоздавший
более старый ответ это решение не откатывает. Ошибка повторного чтения не
оставляет переход заблокированным навсегда. Ответ предыдущей сессии не подменяет
работу и форму новой сессии и не продолжает сохранение отправкой. Выбор
изображения, завершившийся после смены сессии, не загружается. Кабинет
обновляет статус и обложку этой работы без повторного открытия экрана.
Save failure оставляет автора на текущем экране. Повторное открытие
`/products/:id` восстанавливает сохранённую editing revision.

Локальное восстановление (DEC-121, 2026-10-15): ввод шагов 1–3 и незавершённые
текстовые блоки истории автоматически сохраняются локально в браузере (ключ
привязан к аккаунту и к работе — для ещё не созданной работы и для editing
revision раздельно) и восстанавливаются после reload, закрытия вкладки или
неудачного сохранения. Черновик применяется, только пока совпадает серверная
ревизия; после первого успешного создания работы локальный ключ мигрирует на
её id, чтобы повторный визит не создавал работу заново. Ещё не загруженные
файлы выбирают повторно; загруженные медиа остаются серверными. Подтверждённый
submit, выход из аккаунта и сохранение без правок после снимка запроса локальный
ввод очищают; ошибка server save локальную копию сохраняет. Правки, удаления
и порядок блоков истории восстанавливаются по идентичности блоков, а не по
совпадению текста; одинаковые абзацы в разных блоках и удаление всех текстов
восстанавливаются корректно. При одновременном
редактировании с нескольких устройств побеждает последнее успешное серверное
сохранение — системы синхронизации и экрана конфликтов нет.

CTA: `Отправить на модерацию`. Main gallery и story независимы; их фотографии
могут ссылаться на один MediaAsset. «Закончить» подтверждает сохранение
истории, а не публикацию. Backend хранит упорядоченные блоки `HEADING`,
`PARAGRAPH` и `IMAGE` на ревизии Work. Экран создания в клиенте ещё редактирует
прежний plain-text `story`; перенос вёрстки — отдельный этап
[UI-HANDOFF.md](../archive/tasks/2026-10-11-author-story-backend/UI-HANDOFF.md).
Город автора необязателен. Новые достижения не загружают фотографию.
Packaging, delivery, condition, provenance, город продажи, weight и video не
входят в portfolio MVP editor. Торговые шаги сохранены в
[post-MVP sales plan](../product/15-POST-MVP-BACKLOG.md).

## 10. Required states

Для каждого реализованного экрана:

- loading, empty, recoverable error/retry and missing media;
- realistic long names/text and zero optional fields;
- guest, candidate, approved author and admin permissions;
- keyboard/focus, screen reader, zoom and reduced motion;
- 390 mobile, 1024 tablet and 1440 desktop;
- safe-area/keyboard behavior for fixed or floating controls;
- direct URL access to disabled commerce surfaces fails safely.

## 2026-10-18 — Auth sheet background and close contract (DEC-122)

Opening login from a public page retains that page, loaded images and scroll
under the dimmer. Closing returns to that existing page; a direct login URL has
Home as its fallback. The upper handle/header can be pulled down to request the
same close action as the cross. Body scrolling cannot close the sheet. Busy-save
blocking and dirty registration confirmation remain with AuthViewport.

### Achievement date selection — 2026-10-20

Date achievement opens the shared calendar sheet. Choose a day, or set year/month
and select «Только месяц, без точного дня». «Выбрать» commits to the form, not the
API; close/Escape/swipe discards the candidate. «Очистить дату» explicitly clears
it. Existing add-event action and server validation remain unchanged. Session
switch, external value replacement or busy state must not apply an old candidate.
Creation year is numeric, and publication timestamp remains automatic.

### 2026-10-20 — Явный выход из регистрации

Полноэкранные шаги регистрации имеют общий крест AuthViewport. Он использует
существующие правила выхода: clean → исходный публичный redirectTo, dirty →
подтверждение, busy → блокировка выхода. Отмена подтверждения возвращает фокус
на открывший его элемент (крест при клике, поле при Escape).


### Public author navigation update — 2026-10-21

Public routes share the desktop header from1024 CSS px (mobile dock below).
Author Works/About preserve the same identity; mobile scroll pins the same
Back/share/more controls after the hero leaves. Wide owner Settings uses the
existing /account/settings route; profile editing remains its existing child
flow. Category draft/apply/cancel, public data and unavailable follow/favorites
behavior are unchanged. See03-DESIGN-SYSTEM and the current author parity audit.


2026-10-21: ordinary public/account/settings pages end with SiteFooter; full-screen
forms, editors and overlays exclude it. Desktop cart/notifications are explicit
post-MVP placeholders opening the shared compact feedback sheet (close/Escape,
return focus). They do not start a purchase or create notification state.


## 2026-10-22 — Registration email proof (DEC-133)

Password registration: email/legal consent → nickname → password → email code
→ verified account/session → safe destination. No User is created before proof.
The proof step reuses AuthCodeField and existing auth actions; resend uses the
server deadline and change-email returns to the email step. Social onboarding
without a trusted email proof likewise creates the account only after the code.
Existing-account collisions require signing in and explicit provider linking.
