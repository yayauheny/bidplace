# Auth and brand correction handoff — 2026-10-08

Prepared against code HEAD `3b56d84b36c27b623c2dd641a2958729701129c4`.
This task imported sources and reviewed localhost; it did not change application
code, migrate a database, push, deploy or exercise production credentials.

## Verified current view

Local `http://localhost:8093/login` was measured in the Codex browser at
390×874, 375×667 and 440×956. Login was inspected visually and through computed
geometry, not by `body.innerText` alone. Registration email/nickname/password
were inspected at 390×874 using synthetic email and nickname only. No password
was entered, no account was created and no email was sent. Verification/recovery
are code/source review, not an authenticated browser smoke in this task.

| Area | Current | Exact target / correction |
| --- | --- | --- |
| Login dock | Visible 232×64; y798 / y591 / y880 on the three viewports; overlays legal text | No dock in any auth overlay; use existing shell `hideDock`, not z-index |
| Login sheet, 390 | 390×554.5, y319.5 | `526:14885`: 390×545, y329 for default source frame; correct anatomy, not hardcoded total height |
| Login password | Shared default renders 350×53 | Source login field 350×51; fullscreen password remains53 |
| Login legal text |14/20, height40, left aligned | `526:14902`: font12, centered, source box350×30; exact mixed ranges/line-height unresolved |
| Login “или” |14/20, tracking−0.14 | `526:14898`: font15, source box18 high, tracking−2%; no guessed missing line-height |
| Login title/main action |18/26 Inter600; 350×51, #121212, Inter50014/26−0.28 | These measured properties already match; retain them |
| Google | Button has no icon | Exact Google asset/fills required; real OAuth stays unavailable |
| Registration brand | No mark or wordmark on any inspected step | New mapped nodes and shared SVGs in this import |
| Registration consent | No checkbox or links;14/20 text,40 high | One20×20 checkbox with two states; source copy13; real acceptance/documents are a separate contract |
| Email heading/caption | y311 / y341, heading tracking−0.72; title/caption gap8 | Source y320 / y348; tracking−0.4, gap6; plain caption has no exported tracking |
| Email input/action | input y377,h51; action y444,h51 | Source y384,h51; action y447,h51; final single-checkbox group adapts to one state |
| Nickname | No @ prefix, no availability/suggestion UI; current heading y339 | Match mapped slot, show only actual availability; sample dual statuses/chips are not runtime data |
| Fullscreen password | Fields350×54 at y368.5/y438.5; border1 | Source350×53 at y372.5/y437.5; field gap12. Existing minHeight53 is exceeded by content/padding |
| Confirmation | Code tokens already61 high/gap4; resend token47; verbose implementation-oriented copy plus extra notice/logout | Keep existing code primitive, match resend51 and source hierarchy; concise truthful copy; retain real logout in the established exit/account flow |

## Owners and minimal changes

| Concern | Existing owner |
| --- | --- |
| Sheet/fullscreen shell, focus/exit guards | `apps/mobile/src/components/layout/AuthViewport.tsx` |
| Backdrop Home and dock | `features/home/home-screen.tsx`, `layout/AppShell.tsx`, `figma/FloatingDock.tsx`; `AppShell.hideDock` exists |
| Login and three-step registration | `apps/mobile/src/features/auth/auth-form.tsx` (`LoginForm`, `RegisterForm`) |
| Shared field and password | `components/figma/FigmaTextField.tsx`, `figma-text-field-style.ts`, `features/auth/auth-password-field.tsx` |
| Shared checkbox foundation to inspect | `components/figma/FilterOptionRow.tsx`, `filter-option-style.ts`; do not force filter-row composition into consent |
| Verification/cooldown | `verify-email-form.tsx`, `auth-code-field.tsx`, `resend-deadline.ts`, `author-email-verification.ts` |
| Recovery/email masking | `forgot-password-form.tsx`, `reset-password-form.tsx`, existing `mask-email.ts` |
| Brand | `layout/BrandLogo.tsx`, `figma/FloatingDock.tsx`, `branding/AnimatedBidplaceLogo*`, `bidplace-logo-mark.ts`, `shared/InfrastructurePageStatus.tsx`, `ui/PageState.tsx` |
| Icon config | `apps/mobile/app.json`, existing `assets/branding`, `icon.png`, Android foreground/background/monochrome and existing splash assets |
| Shared visual values | `packages/design-tokens/src/tokens.ts` |
| Rules | Existing client `getRules`, `acceptRules`; actual paths `/api/auth/rules`, `/api/auth/rules/accept` |

Durable fix: shared brand assets and shell slots, exact semantic auth variants,
one accessible checkbox and reuse of existing validation/API/error owners.
Acceptable adaptation: documented responsive/error layouts where no frame exists.
Hack to reject: raising dock z-index, hiding it through unrelated global CSS,
fixing sheet height to545, route-local pixel patches, duplicate brand primitives,
new browser-history guards or sample success/suggestion values.

## Missing sources and contracts

- The four new captures add only branding. They do not repair mixed styled
  ranges at `4547:23406`, `4547:25029`, `526:14902`, `526:15580`, `558:16958`.
  Inspect the same design version/ranges or request a focused export. Do not
  substitute a differently styled live button for the archived source.
- Google `I526:14901;298:6024;521:10381` has vector paths but missing fills.
  Check canonical parent captures and exact icon assets before declaring it
  missing. If no exact asset exists, request only the Google SVG, not all screens.
- No current mobile public policy/rules route or UI `acceptRules` call exists.
  Rules already have an API source/version; legal policy documents are drafts.
  `docs/legal/04-DOCUMENT-SET.md` and `README.md` prohibit publication of those
  drafts before their owner review. A checkbox does not make them approved.
- No nickname-availability endpoint or suggestion contract currently exists.
  `DEC-105` permits a read without reservation; final uniqueness remains at
  registration. A read endpoint may be implemented with shared slug validation
  and existing rate limits. Do not invent sample suggestions as real answers.

## Execution prompt

```text
Работай в /Users/yayauheny/projects/bidplace от актуального clean tracked HEAD.
Это одна корректирующая волна auth UI и брендинга. Без push, production deploy,
миграций, seed, смены ролей, credentials, ресурсов и release-gate изменений.
.cursor/ и старый trace.zip не читать и не включать.

Сначала прочитай AGENTS, relevant ui/security/review skills, owner docs и этот
HANDOFF. Проверь git state и source checksums. Напиши короткий план и критерии.
Новые источники:
design/figma-handoff/auth/2026-10-08-auth-fullscreen
design/figma-handoff/branding/2026-10-08-brand
Вход/восстановление/выход:
design/figma-handoff/auth/2026-10-07-auth-dialogs
Общие состояния:
design/figma-handoff/fields/2026-10-06-text-fields
Следуй catalog, NODE-MAP, STYLES, оригинальным nodes и reference PNG.
Старый fullscreen-набор удалён; не возвращай его в активные источники.

1. Замени старый знак с глазами во всех живых brand callsites, favicon и реально
используемых Expo icon/splash assets. Новый знак/wordmark уже представлены SVG
с точными paths и provenance. Не набирай bidplace шрифтом и не растягивай знак.
Auth использует #121212 из новых кадров; raw SVG #111111 на белом сохранён как
оригинал. Не добавляй анимацию новому статичному знаку и не меняй весь дизайн сайта.
Сначала проверь потребителей AnimatedBidplaceLogo и используй общую brand основу.
Удали старые runtime assets/компоненты/тесты только если после замены нет живых
импортов и они не нужны другим состояниям. Не удаляй исторические source captures.
Генерируй необходимые иконки локально без нового сервиса или зависимости.

2. Регистрация и email confirmation — fullscreen без Home/dock. В четырёх шагах
поставь знак сверху и wordmark снизу точно по новым mapped nodes. Вход остаётся
шторкой, recovery — существующий одноразовый link flow в согласованном shell.
В любой auth-шторке убери фоновой dock через существующий hideDock владельца
AppShell/Home; фон может быть loading/empty/error. После выхода dock возвращается.
Не исправляй это z-index или новым глобальным visibility-механизмом.

3. Исправь фактические геометрические и типографические расхождения из таблицы.
Login field password51; fullscreen password53 — разные source metrics. Проверь
content/padding/border, которые сейчас дают54 при minHeight53. Заголовки fullscreen
20/22 Inter600 с tracking−0.4, caption gap6. Primary350×51 и auth fonts/colors,
stroke transforms, icon slots и spacing — по конкретному источнику. Не задавай
фиксированную высоту всего login545: добейся её правильной default anatomy.
Семантические tokens/variants меняй в общих владельцах, без копий CSS по routes.

4. Email-шаг: один доступный checkbox, изначально unchecked; состояния4547:23400
и4547:23403, copy4547:23406. Не рисуй две галочки и не принимай согласие заранее.
Значение сохраняется между шагами; при отказе перехода покажи понятную ошибку
рядом с control. Space/Tab и label работают. Добавь честные links к реальным
документам. Раздели UI consent и серверную фиксацию: getRules даёт version,
acceptRules существует для authenticated user. После единственного register
фиксируй только явно данное согласие на ту же показанную версию, обнови session
через существующего владельца. Ошибка acceptRules повторяет только принятие,
не создаёт аккаунт снова. Если готовой политики/публичного текста нет, не публикуй
drafts и не выдумывай юридическую страницу: заверши независимые правки и назови
точный оставшийся owner/input. Не объявляй согласие сохранённым без ответа API.

5. Никнейм остаётся одним User.slug для пользователя и автора. Поле использует
тот же nicknameSlugSchema; @ — визуальный префикс, не часть сохранённой строки.
Не добавляй User.username, второй editable SellerProfile.slug или account name.
Покажи валидируемые ошибки у поля и доступен/занят только по реальному ответу,
один статус одновременно. Если read endpoint отсутствует, реализуй минимальный
read в existing auth/contracts/api-client с existing validation/rate limit;
он не резервирует slug и не проверяет существование email. Защити UI от позднего
ответа на прежнее значение; конфликт unique при register всё равно решает сервер.
Не используй niko631/632/633 как предложения реальным людям. Отсутствующий
контракт предложений укажи отдельно; без fake chips или нового генератора наугад.

6. Сохрани единый field-error pipeline для всех auth inputs. Несколько server
fieldErrors показываются вместе у соответствующих полей; blur/submit без
ошибок при первом открытии. Клиент и API используют общие schemas. Сеть/5xx и
неверный login остаются общей ошибкой. Данные после отказа сохраняются. Пароли,
OTP, reset URLs, email credentials не попадают в сообщения/logs/коммиты.
Заполненное поле не становится success; Tab/blur не дают зелёной вспышки.
Поздние результаты validation/availability/acceptRules не изменяют новую сессию
или уже завершённый маршрут; переиспользуй существующую session/operation охрану.

7. Confirmation: один AuthCodeField с шестью ячейками; существующие61/gap4 уже
есть — переиспользуй. Подгони hierarchy и resend51, без лишнего notice-дубликата.
До принятой отправки не заявляй доставку. После успеха используй короткое понятное
«Код отправлен на {masked email}», reuse maskEmail, без технических объяснений
про серверную доставку. До успеха/при отказе — честное сообщение и повтор.
Оставь60 секунд после принятого ответа, server429/TTL/limits/locks без изменений;
32 сек в макете — пример. Перезапуск страницы не должен обходить серверный лимит.
Logout не удалять из account flow, но не вставлять дополнительную основную кнопку
в default reference body. Сохранить завершение позже и общий exit confirmation.

8. Добавь точный Google glyph из pinned source/parent/assets; при отсутствии
полных fills запроси focused SVG и оставь этот пункт Partial. Telegram/Google
остаются заглушками с понятным сообщением, без реального OAuth. Разбери mixed
text ranges из того же источника, не угадывай цвета и не меняй весь provider
button на несовпадающую live-версию ради одной иконки.

9. Сохрани текущий auth lifecycle, session guards, safe redirectTo, один register,
успешный переход один раз, resend/verify locks и историю Back/Forward/reload.
Не переписывай history guard. Internal auth steps не спрашивают выход;
пользовательский выход использует существующий AuthExitConfirm с подходящим
текстом, сохраняет values/focus при «Продолжить», не отменяет HTTP и не удаляет
аккаунт. Переключение вкладки/сворачивание браузера не повод показывать exit.
Геометрия default exit panel — по746:23093, включая200px исходной высоты,
366px ширины на390px и gutters12; не фиксируй высоту error/zoom состояния.

10. Проверки соразмерные: typecheck/lint без autofix/build affected graph;
расширь existing unit/API/integration cases для consent, slug read, ошибки и
сессий. Один целевой auth-layout/auth-lifecycle run Chromium+WebKit,
workers1/retries0, только разрешённая disposable local DB. Визуально сравни
375×667,390×874,440×956, широкую колонку, keyboard, zoom и error states.
Не создавай новый suite на каждый asset/CSS/отсутствующую анимацию, не запускай
полный portfolio gate без причины; thresholds/golden/timeouts не ослаблять.
Favicon проверить16/32 визуально. Покажи скриншоты и таблицу node→component→
actual/expected geometry/fonts/colors, включая реальные gradient transforms.

Проверь scope diff: не трогать Pen, canonical Figma/raw sources, release workflow,
Neon/production. Обнови project/design status и asset inventory после runtime
замены. Локально закоммить реализацию. В финале code SHA, затронутые файлы,
удалённые dead assets/components, проверки, screenshot paths и точные оставшиеся
source/contract gaps. Не заявляй1:1 или MVP acceptance при незакрытых пунктах.
```
