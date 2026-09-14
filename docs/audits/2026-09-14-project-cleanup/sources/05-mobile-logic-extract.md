# Mobile logic — структурированная выписка из сообщения пользователя

Источник: текст «Аудит логики apps/mobile» в сообщении пользователя, полученном вместе с attachments cross-layer/validation. Это **не дословная копия**: исходный полный текст остаётся в беседе. В отличие от файлов 01–04/06, byte-for-byte сохранение здесь не заявляется. Дополнение validation D13–D15 уже дословно включено в sources/04-validation.md, второй копии не требуется.

Аудитор: HEAD 70c5fd52ed306143d62b8352edd45d61943388b9, fix/work-final; анализ только HEAD, dirty CORS/seed/product-draft-write исключены. Portfolio MVP, web 390; визуальная система не оценивалась. Unit helpers 11 файлов / 56 тестов pass по заявлению источника; Playwright, graph typecheck/lint, verify, browser/DB не выполнялись. Здесь результаты не перепроверены.

## Исходные findings

| ID | Приоритет автора | Суть / evidence | Предложение и границы |
|---|---|---|---|
| M-LOGIC-01 | P0 | listCabinetWorks/hideWork/unhideWork в api-client без mobile callers; AccountMenu ведёт на форму /profile | Cabinet, recovery draft, hide/unhide; test create→close→cabinet→hide→guest404→unhide |
| M-LOGIC-02 | P0 | product-draft-screen submit вызывает только submit API; Review title из server, story/category local; unsaved changes теряются | Persist before submit, единый snapshot review; server rules не дублировать |
| M-LOGIC-03 | P1 | AuthProvider me только на mount; глобальной реакции mutations на unauthorized нет | Исправить session invalidation/cache; useQuery предложен, не обязательная архитектура |
| M-LOGIC-04 | P1 | protected-route.tsx Redirect /login без redirectTo | Сохранить безопасный pathname+query, использовать getSafeRedirect |
| M-LOGIC-05 | P1 | SellerProfileScreen steps 1–3 local, save только на 4; Close/Back теряют ввод | Server draft, persist steps, URL history; зависит от BL-04 |
| M-LOGIC-06 | P1 | Work onClose/back шага 1 navigate /profile без save | Dirty save→navigate; при ошибке остаться; RFC §10 |
| M-LOGIC-07 | P1 | HEAD packaging/delivery state/payload, dirty tree уже убирает; docs опережают HEAD | Проверить/интегрировать отдельную работу, omit не null старые columns; дополнительные weight/condition не удалять вслепую |
| M-LOGIC-08 | P2 | categories query keys ['categories'] и ['products','categories'] | Общий ключ и test cache sharing; в таблице источника есть противоречие «нет живого query» при указанном draft query, перепроверить |
| M-LOGIC-09 | P2 | PublicSellerScreen unfiltered infinite + useAuthorWorks filtered; local category/tab | Один parameterized query, category URL; About URL требует решения; sort не удалять только из-за отсутствия control |
| M-LOGIC-10 | P1 | e2e wizard ждёт старые labels/step aliases/delivery | Новый flow e2e; старые aliases удалять лишь после compatibility проверки; красный e2e не доказан прогоном |
| M-LOGIC-11 | P2 | AppHeader/menu stack не монтируется; product-draft-creation/portfolio-work-adapter unused | Reachability proof, удаление лишних tests/exports; native/desktop вне acceptance не равно разрешение удалить |
| M-LOGIC-12 | P2 | Admin UI mutation type APPROVED/CHANGES_REQUESTED без REJECTED; filters local/unbounded | Reject+reason до MVP; URL/server pagination отдельный optional scope |
| M-LOGIC-13 | P2 | initializedProductId null после create; arriving query hydrates fields поверх нового ввода | Не reset dirty form; test delayed create/refetch typing |

## Карты состояния источника

- Work: server categories/owner detail/images; URL flow/step; local поля/dialog/attempt flags; эффекты rewrite step и hydration по id. RHF — кандидат убрать ручное form state, но updatedAt refetch не разрешает затереть dirty input.
- Application: server profile/photo; local fields/blob/step; hydrate effect и FileReader. Save only final. URL step и server persistence — разные гарантии.
- Author: unfiltered и filtered server queries, URL slug/sort, local tab/category. Серверу не нужно добавлять tab в key, если tab не меняет ответ.
- Session: me→context на mount, redirectTo присутствует не везде. Перенос store сам по себе не решает 401 raw fetch.
- Works/Authors/Search: URL committed filters и local draft до Apply — здоровый образец; infinite helpers с pagination/dedup/retry полезны.

## Конфликты и гипотезы

Cabinet API ≠ UI; email verification API без экрана/gate; packaging dirty ≠ HEAD; About URL и curator UI имеют открытые/принятые отдельные решения; brief facts карточки Partial, не logic bug.

H1 dirty application reset на refetch — не воспроизведено; H2 double create до pending — не воспроизведено; H3 forbidden/me cleanup требует контракта; H4 e2e red — статический drift, не прогон; H5 achievements editor deferred; H6 Home retry:1 не blocker; H7 общий pending admin card — UX, не loss of state.

Сохранить URL-owned catalogs, независимые Work/Author search queries, Work tab URL, auth RHF, public retry, safe redirect, local overlay open state, ThemeProvider и содержательные infinite hooks. Memoization без измерений не добавлять.
