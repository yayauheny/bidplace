# Theme closure — resolution (TC-01 / TC-02 / TC-03)

Дата: 2026-10-18. Ветка реализации: `fix/draft-restore`.
Аудит: `docs/audits/2026-10-18-THEME-CLOSURE-REVIEW.md` (ветка `fix/theme-closure-review`, `a2d69475`).
Проверенный HEAD на старте: `a89fe26a`. Production build на `9201ddb3` был заявлен чистым и не повторялся ради docs-only изменений; после runtime-правок TC-01 выполнен новый build (см. «Проверки»).

## TC-01 — миграция последних literal-акцентов — ЗАКРЫТ (`8e362913`)

Переведены в семантический контракт (`packages/design-tokens/src/theme.ts`, обе палитры):

| Место | Роль | Light | Black (provisional, NEEDS-FIGMA) |
|---|---|---|---|
| `AuthorShare.tsx` («Пожаловаться») | `report` | `#731A06` | `#FF7A5C` |
| `product-draft-story.tsx` (бордюр тулбара) | `toolbarBorder` | `#D1D1D1` | `#4A4A4A` |
| `home-author-fan.ts` → `home-new-authors.tsx` | `fanShadow` | `0 6px 20px rgba(58,58,58,.40)` | `0 6px 20px rgba(0,0,0,.55)` |

Роли выбраны по назначению: `report` не слит с `usernameTaken` несмотря на одинаковый hex — разное назначение. Технические mask/transparent и brand assets не тронуты. Light byte-identical.

Проверки: design-tokens пересобран; mounted-тест «re-themes the remaining literal accents without remounting» (`src/providers/theme.spec.ts`) ассертит report text/icon, бордюр тулбара и fan-shell boxShadow на смонтированных компонентах, light→black на тех же DOM-узлах; `home-author-fan.spec.ts` фиксирует отсутствие `frontShadow` в лейауте; typecheck/eslint чисто; full vitest **892/892**.

Остаток: black-значения трёх ролей provisional до Figma; визуальная сверка не выполнялась (дизайн не менялся).

## TC-02 — настоящая приёмка zoom / text enlargement — NEEDS VERIFICATION (ручная)

Последовательно опробованы и отвергнуты все автоматические пути:

1. CDP `Page.setZoomFactor` — метода не существует (ошибка «wasn't found», подтверждено дважды).
2. Клавиатурные акселераторы (`Control+=`, `Meta+=`) через Playwright — в headless и headed Chromium синтетические CDP-события не доходят до UI-слоя браузера, `innerWidth` не меняется (zoom factor 1.000).
3. Per-host zoom через профиль Chrome (`partition.per_host_zoom_levels`, оба формата ключа) — Chromium zoom не применяет при старте.

CSS zoom и `Emulation.setPageScaleFactor` не использовались как замена.

Ручные шаги (вкладка «Login zoom-приёмка», dev-логин на `localhost:7899`):

1. Открыть dev-логин; ⌘+ до ровно 200% по индикатору масштаба Chrome. Проверить: нет горизонтальной прокрутки; кнопка входа, поля, ошибки валидации и legal-ссылки доступны и видны; фокус с клавиатуры видим.
2. ⌘0 (сброс), затем увеличение только текста: Chrome → Настройки → Внешний вид → Размер шрифта «Очень большой» (либо Firefox: View → Zoom → Zoom Text Only, 200%). В DevTools сверить computed `font-size` поля ввода с базовым.
3. Скриншот каждого состояния — в evidence.

До результата этих шагов эталон считается не полностью принятым. Доступность действий/ошибок/legal-ссылок при обычном масштабе и с клавиатуры покрыта существующими спеками (login, author-revision-flow, figma-text-field-focus).

## TC-03 — пять baseline failures — ЗАКРЫТ (`b37937ba`)

Все пять были fail-on-both на `982a0e00` (base и head), т.е. устаревшие фикстины/ожидания против действующего контракта, не регрессии рефакторинга.

| Тест | Корневая причина | Исправление |
|---|---|---|
| `admin-revision-moderation` ×2 | (1) PATCH approve → 409: одобрение ревизии требует ≥1 direction (`admin-moderation.service`, требование старое, `6e4cd749`); фикстина не создавала direction. (2) Карточка pending-ревизии рендерит `selection.category.name`, спека ждала UUID | `revision-moderation-fixture.ts`: direction на editing-ревизию + поле `pendingCategoryName`; спека ждёт имя категории |
| `catalog-pagination` ×2 | Публичный каталог читает published-ревизии; профили/работы без ревизий невидимы (total 0). Фильтр `materials` матчит MATERIAL revision terms (`product_revision_terms` + `catalog_terms`), фильтр `tag` авторов — имя категории направлений (`seller_profile_revision_directions`) | `e2e-fixtures.ts`: helper `attachPublishedSellerProfileRevision`; works-фикстина публикует ревизию профиля и цепляет MATERIAL `catalogTerm` к каждой published-ревизии работы; authors-фикстина создаёт категорию с `name = tag` и direction на ревизию каждого профиля; cleanup расширен |
| `search-chrome` ×1 | Ожидание stroke `#2457E6` — устаревший pen-токен (`2662b54a`); контракт — семантическая роль `focus: '#004DFF'` | Ожидание приведено к `#004DFF` с комментарием; роль фиксируют `theme-computed-focus.spec.ts` и `figma-text-field-focus.spec.ts` |

Assertions не ослаблялись, golden не менялся. Правки — только фикстины и одно ожидание по подтверждённому контракту; код приложения не тронут.

Проверки: `playwright test admin-revision-moderation catalog-pagination search-chrome --project=chromium` → **6/6 passed**; `tsc --noEmit` чисто; eslint затронутых файлов чисто.

## TCF-01 — точность regression test — ЗАКРЫТ

Фикстина возвращает `publishedCategoryName` (seeded `art.name`) рядом с `pendingCategoryName`; имена различаются по построению (suffixed pending name). В `admin-revision-moderation.spec.ts` обе проверки привязаны к конкретной карточке работы (локатор карточки поднят выше asserts): `pendingCategoryName` виден в карточке, `publishedCategoryName` в ней отсутствует — старый глобальный assert по UUID заменён, т.к. пропускал бы показ имени старой категории. Production-код не менялся.

Критерий аудита соблюдён структурно: assert карточки красный, если в ней появляется published name. Проверка: `playwright test admin-revision-moderation -g "without exposing its gallery publicly" --project=chromium` → 1 passed; tsc чисто.

## Итог по волне

- **Миграция кода завершена**: последние видимые literals в семантической палитре (`8e362913`), задокументированные исключения (mask/transparent, brand assets) сохранены.
- **Приёмка не завершена**: browser zoom 200% и увеличение текста — Needs verification (ручные шаги выше); black-значения трёх новых ролей provisional.
- **Известные красные gates**: из заявленных пяти — 0; полный E2E-suite целиком в этой волне не перегонялся (по инструкции), затронутые спеки 6/6.

Проверки на финальном SHA: typecheck, eslint (затронутое), full vitest, production web build — записаны в `11-PROJECT-STATUS.md`.
