# Передача Kimi: волна 3 — личный аккаунт

Основание: [Figma intake](README.md), live capture2026-10-19. Сначала прочитать его целиком; ниже короткий рабочий prompt. Это implementation handoff, не команда немедленно прерывать текущую auth-задачу.

## Copy-ready prompt

```text
После завершения текущего ограниченного auth-layout прохода начни волну 3.

База: твоя актуальная fix/account-foundation с сохранением всех поздних
коммитов, не reset на fc51731a. Применить docs-only intake-коммит
fix/account-intake после проверки его diff. Не переносить чужие runtime
изменения. Source/docs в docs/tasks/2026-10-19-account-ui/.

Читать AGENTS.md, обязательных owners, bidplace-figma-intake,
bidplace-ui, bidplace-ui-review, code-review-best-practices,
security для session/private/share границ. Перед мобильным кодом
проверить точную установленную SDK57 документацию по package AGENTS.
Новые библиотеки и общий новый state/theme/router framework не нужны.

Критерий: рабочие /account и /account/settings по согласованному
адаптированному Figma, правильные состояния по статусу,
переиспользование кабинетных правил, публичная/редактируемая identity
не смешиваются, экран естественно работает на320–440.
Избранное после MVP; настройки и Share доступны до approve.
Удаление работ — отдельная3D, не подменять hide и не делать fake CTA.

Работа по этапам:
3A — точные semantic tokens/metrics и shared UI gaps из intake:
caption-вариант WorkCoverCard, AccountIdentity composition,
SettingsGroup/SettingsRow, Back settings и общий icon registry.
Не менять default visuals существующих consumers.
Покажи mapping и shortlist расширений до правок.

3B — auth-only группа(account) БЕЗ requireVerifiedEmail,
единый cabinet controller и /account.
Не использовать(seller)layout для обычного аккаунта/настроек.
Гость dock→login, вошедший→account, admin→старый admin.
Legacy /cabinet не дублирует запросы и AppShell.
Существующий /profile остаётся editor, verified-email и author
permissions остаются у существующих владельцев.
UseAuth/owner query/epoch/public-author cache переиспользовать.
Никаких дополнительных локальных копий server state.

3C — settings: настоящее «Публичный профиль»→существующийeditor/intro,
logout с нынешней очисткой drafts/cache. Пустые группы не показывать.
Email/password change, languages/currency/Premium/adult/favorites
не включать. Public Share /authors/<canonical slug> работает и
до одобрения: посетитель видит нейтральный not-found, не заявку.
Скрыть report только на owner share; обычный public share не менять.
Share и настройки видимы всем signed-in non-admin состояниям.
Legacy missing slug обработать честно, без /authors/null.

Отдельный коммит и progress update по3A,3B,3C.
После этого передать ревьюеру code/SHA/screenshots/измерения.
Delete и завершение всего среза не объявлять реализованными.

Проверки по checklist ниже, адресно, Node22.
Полный suite не гонять без причины.
Не читать .env, не сбрасывать БД, не коммитить dist/backup.
Push/merge/deploy без команды не выполнять.
```

## Acceptance checklist

| Область | Обязательная проверка |
|---|---|
| Identity | ordinary/заявка/pending — gray; approved — published A даже при editing B; suspended/public-not-found — не показывать editing B; fullName/slug без fake данных |
| Cache | owner profile не дублируется при переходах account/settings/cabinet в60s; public identity отдельный reused cache; image revalidation считать отдельно; stale null+network остаётся error |
| Session | logout во время запросов; вход другим аккаунтом; поздний ответ не рисует чужую identity/works; logout очищает локальные drafts |
| Auth guard | guest direct /account сохраняет return path; signed-in unverified открывает account/settings/logout; editor по-прежнему требует verification |
| Share | ordinary/applicant/approved/suspended: кнопка есть, URL только public canonical slug; неapproved/недоступный public профиль neutral not-found; private данные/статус не утекают |
| Работы | own DRAFT/PENDING/CHANGES_REQUESTED/REJECTED/APPROVED/ARCHIVED, revision statuses, suspended locks, empty, pagination и ошибка следующей страницы; title null→«Без названия»; cover null/error |
| Actions | реальные owner helpers, нет like/commerce/фальшивого delete; hide confirm/cancel/failure, restore, обновление owner/public cache |
| Geometry | на390 gutter12, avatar100,2cards179/gap8/media179×236, caption ниже; row wraps; нет двойного SafeArea/dock reserve |
| Robustness | 320/390/414/440, short height568; long name/slug/title/error; нет horizontal page overflow; logout и последняя работа доступны прокруткой |
| Themes | смена light↔provisional black без remount обновляет новые role consumers; black для пользователей выключен |
| Keyboard | Tab/ShiftTab/Enter, settings back, auth dismissal focus, Share open/close; успешныйlogin не получает поздний focus restore |
| Zoom/text | настоящий browser zoom200 и отдельно увеличение текста; если недоступно, Needs verification, не CSS zoom |
| Desktop | 1024/1440: отсутствие поломки по existing shell; parity NEEDS-FIGMA |
| Evidence | actual SHA, state,viewport,browser, fixtures, source node; reference и результат; измеренные отклонения с причиной, не только «pixel perfect» |

Сначала быстрые unit/typecheck/lint; затем один production export актуального кода и ограниченный browser gate Chromium/WebKit. Geometry в DOM проверять по wrapper полей/карточек, не только внутренним input. Не связывать новую приёмку с полным старым auth-layout монолитом. Не ослаблять assertions/ретраи ради зелени.

## Отдельный запрос для волны 3D (пока планирование backend)

```text
Подготовь bounded backend/security-план удаления own Work, без кодинга.
Решение основателя: автор может удалить работу любого статуса;
подтверждение в UI; технический tombstone; работа исчезает из owner/public
reads и по ссылке; hide/restore остаётся отдельным действием.
В нынешнем products API/client удаления нет.

Прочитай MVP/security/architecture owners, products/portfolio/media/admin
reads и transactions, schema/revisions/media refs, query/edge cache.
Предложи точный DELETE contract, tombstone field/migration, набор
обязательных predicates/guards и гонку delete vs approve/submit.
Учти suspended policy и legacy commerce references без их удаления.
Не предлагай cascading hard delete или ARCHIVED в качестве deleted.
Покажи конкретные файлы/потребители и минимальные owner/integration tests.
Отдельно укажи ограничения уже закэшированных публичных media.
Сначала передай план на review; только потом реализация3D.
```

## Что остаётся на ревьюере

Ревью mapping/primitives до3B; сверка published identity и cache shape; приёмка rendered390 и robustness; проверка диффа настоящих SVG/assets; приёмка deletion backend-плана. Не запускать два параллельных исполнителя на token/card/cabinet owners.
