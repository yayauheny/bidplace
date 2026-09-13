# Параллельные задачи для GPT Sol high

Дата: 2026-09-13. Ветка `fix/work-final`. Все задачи ниже независимы по файлам и
могут выполняться одновременно разными агентами. Каждый агент коммитит только
свои файлы отдельным коммитом.

## Общие правила для каждого промпта (вставлять целиком)

```
Работай в /Users/yayauheny/projects/bidplace, ветка fix/work-final. Прочитай AGENTS.md,
docs/tasks/2026-09-12-figma-finish/01-RULES.md и docs/tasks/2026-09-12-figma-finish/14-COMPLETION-MAP.md.
Выполни только свою задачу. Не трогай файлы вне разрешённой области, .pen, design/figma-handoff,
API, seed, .env. В дереве есть чужие незакоммиченные изменения (API/seed/docs) — не откатывай и не
включай их в свой коммит; в docs/product/11-PROJECT-STATUS.md добавляй только свою секцию сверху
и стейджи только её hunk.

Главный критерий — визуальное совпадение с Figma в реальном браузере, не тесты. Тесты не пиши;
существующие не ломай (typecheck/lint/vitest — технический gate). Не подменяй проверку дизайна
тестами.

Стенд: Expo Web http://localhost:8083, API http://localhost:3002 (БД bidplace_preview). Не перезапускай.
Hot reload работает: после правки просто перезагрузи страницу.

Как снимать скриншоты и мерить DOM (Playwright, запускать ВНЕ сандбокса из apps/mobile):
  PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright node ./shot.tmp.mjs
Скрипт положи временно в apps/mobile/shot.tmp.mjs и удали перед коммитом. Шаблон:
  import { chromium } from '@playwright/test';
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  // подмена данных: await page.route('**/api/authors/anna-morozova**', async r => { const j = await (await r.fetch()).json(); /* patch */ await r.fulfill({ json: j }); });
  await page.goto('http://localhost:8083/…', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  await page.screenshot({ path: '../../artifacts/figma-qa/<задача>/<имя>.png' });
  console.log(await page.evaluate(() => { /* getBoundingClientRect / getComputedStyle нужных узлов */ }));
  await browser.close();
Ширины: 390 обязательно, 1024 и 1440 — центрированная колонка 390 без горизонтального overflow.

Figma-геометрию читай из design/figma-handoff/portfolio-phone-v1/**/nodes.json (python: json.load,
обходи children, поля layout.x/y/width/height/gap/padding, style.fontSize/lineHeight/letterSpacing
(letterSpacing — проценты!), fills, borderRadius). PNG экспорты рядом.

Токены только из packages/design-tokens/src/tokens.ts (после правки токенов:
corepack pnpm --filter @bidplace/design-tokens build). Masters в apps/mobile/src/components/figma.
Не дублируй стили локально, не добавляй magic values, any, ts-ignore, fake-контролы, демо-данные.

Готовность: скриншоты 390/1024/1440 в artifacts/figma-qa/<задача>/ + REPORT.md с таблицей
«элемент → Figma → runtime (DOM) → статус»; loading/empty/error+retry проверены; typecheck+lint+vitest
зелёные; обновлены docs/design/04-DESIGN-STATUS.md и docs/product/11-PROJECT-STATUS.md
(Implemented/Partial честно, с перечислением непроверенного); один коммит своих файлов с коротким
именем без упоминания агентов. В финальном ответе: что совпало, что нет и почему, что не проверено.
```

## Матрица параллельности

| # | Задача | Разрешённые файлы | Конфликтует с |
|---|---|---|---|
| S1 | ShareSheet: реальное сохранение и состояния | `components/figma/ShareSheet.tsx`, `components/figma/public-share.ts` | — |
| S2 | Каталог работ `/works` | `features/products/product-list-screen.tsx` + его list hooks | S3 (общие hooks — не трогать общие) |
| S3 | Каталог авторов `/authors` | `features/sellers/public-authors-screen.tsx` + его hooks | S2 |
| S4 | Auth формы | `features/auth/auth-card.tsx`, `auth-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx` | — |
| S5 | Заявка автора | `features/sellers/seller-profile-screen.tsx`, `seller-profile-steps.tsx`; новые form masters в `components/figma` только с новыми именами | S6 (новые masters — согласовать имена) |
| S6 | Создание работы | `features/sellers/product-draft-*.tsx` | S5 |
| S7 | Фильтры и сортировка (masters) | новые `components/figma/FilterSortBar*`, `FilterSheet*` | S2/S3 подключают позже |
| S8 | Cover cards: крайние данные и gradient stroke чипов | `components/figma/figma-chip-style.ts`, `FigmaChip.tsx`, `CoverFrost.web.tsx` только при доказанном дефекте | — |

S2 и S3 можно вести параллельно, если каждый правит только свой экран и не трогает общие
hooks/клиенты. S5 и S6 параллельно только если новые masters получают разные имена; иначе
последовательно (сначала S5).

Не для GPT Sol (оставлены сильной модели): A3 плавность compact-перехода шапки автора,
A5 гипотеза утолщения текста, любые изменения frost/blur/dock и глобальных шрифтов.

---

## S1 · ShareSheet

```
<общие правила>

Задача S1 · ShareSheet: реальное сохранение и крайние состояния.
Источники: creator share 526:13756, work share 597:18787, sheet 597:19045. Код: ShareSheet.tsx,
components/figma/public-share.ts (коммит 48c38b7 уже сделал PNG QR, временную ссылку, копирование на HTTP).
Разрешённая область: только эти два файла; AppDialog — только при доказанном общем дефекте с
отдельным объяснением.

Проверь в реальном браузере (Playwright headless + при возможности обычный Chrome):
1. «Сохранить PNG» реально скачивает файл (Playwright: page.waitForEvent('download'), проверь
   suggestedFilename и размер >0). Если в Expo Web скачивание не срабатывает — найди причину
   (blob URL, anchor download, revoke до клика) и исправь без workaround-хаков.
2. Escape закрывает лист, фокус возвращается на кнопку «Поделиться»; Tab не уходит под лист
   (focus trap) — проверь через page.keyboard и document.activeElement.
3. Длинная ссылка (подмени slug на 60 символов через page.route) не ломает ширину 390, обрезается
   с многоточием или переносится так, как задаёт Figma-узел; нет горизонтального overflow.
4. Ошибка генерации QR (сымитируй через page.route/ошибку) показывает понятное состояние и не
   пустой квадрат.
5. Ссылка всегда на текущий origin и только на публичный автор/работу (никаких токенов, query с
   личными данными).
Сверь геометрию листа с 597:19045: ширина, верхние углы 20, QR 164, отступы, кнопки.
Скриншоты: 390 открытый лист (автор и работа), длинная ссылка, ошибка, 1440.
Готовность — по общим правилам; в REPORT укажи, подтверждено ли скачивание в обычном Chrome.
```

## S2 · Каталог работ

```
<общие правила>

Задача S2 · Сборка каталога работ /works.
Источник: works default 526:13248
(design/figma-handoff/portfolio-phone-v1/screens/works/works__default__390x2350__node-526-13248). Разрешённая область: features/products/product-list-screen.tsx и хуки, которые
использует только он. Карточки WorkCoverCard и FilterSortBar НЕ переписывать: карточка — принятый
master (frost по тексту, чип 24). Если фильтр-бар ещё не существует как master (задача S7 не
принята) — оставь текущие контролы, зафиксируй в REPORT как зависимость, не делай локальную копию.

Сверь: логотип/шапка, заголовок (роль sectionTitle 24/29 −3 %), отступы gutter 12, сетка карточек
366×488 с gap 20, пагинация/«Показать ещё» по Figma, нижний паддинг под dock (size.dockReserve).
Состояния: loading, пустой результат, ошибка с «Повторить», один элемент, длинное название.
Карточки открывают /product/:publicId. 1024/1440 — колонка 390 по центру.
Скриншоты: 390 первый экран и низ списка, пустое состояние, ошибка, 1440.
```

## S3 · Каталог авторов

```
<общие правила>

Задача S3 · Сборка каталога авторов /authors.
Источник: authors default 526:12904. Разрешённая область:
features/sellers/public-authors-screen.tsx и хуки, которые использует только он. AuthorCoverCard —
принятый master (верх 56, низ 76, чип 24): не переписывать. Фильтр направления/города — если master
из S7 отсутствует, оставь текущие контролы и запиши зависимость.

Сверь: заголовок sectionTitle, gutter 12, список карточек 366×488 gap 20, dockReserve снизу.
Состояния: loading, пусто, ошибка+retry, автор без discipline (нет чипов), длинное имя (одна
строка с многоточием в верхней зоне). Карточка открывает /seller/:slug. 1024/1440 — колонка 390.
Скриншоты: 390 верх и низ, пусто, ошибка, 1440.
```

## S4 · Auth формы

```
<общие правила>

Задача S4 · Внешний вид auth форм (только визуальная композиция, логику не менять).
Источники: login-password 527:16954, register-error 527:16956, register-complete 526:15581;
text fields 292:5044, buttons 292:5058. Разрешённая область: features/auth/auth-card.tsx,
auth-form.tsx, forgot-password-form.tsx, reset-password-form.tsx. Используй FigmaTextField,
FigmaButton, AppText роли; не создавай новые поля/кнопки локально.

Сверь: заголовок карточки (роль sectionTitle 24/29), отступы между полями (space.fieldGap),
высота полей и кнопок 44, текст ошибок под полем (fieldErrorGap 3, цвет error из токенов),
состояние ошибки формы целиком (527:16956), экран завершения регистрации (526:15581).
Проверь в браузере: /login, /register, /forgot-password, /reset-password при 390 и 1440;
невалидный ввод показывает ошибки как в Figma; фокус-кольцо и Tab-порядок логичны; клавиатура
не перекрывает кнопку на 390×667.
Скриншоты: каждая форма по умолчанию и с ошибками, 390 и 1440.
```

## S5 · Заявка автора

```
<общие правила>

Задача S5 · Страницы заявки автора.
Источники: apply landing 526:16074, identity 527:16416, contacts 746:22642, identity-abort
746:23037, bio 578:17378, about 746:22724 / 584:17717 / 584:18020 / 738:20088 / 738:20051.
Разрешённая область: features/sellers/seller-profile-screen.tsx, seller-profile-steps.tsx;
недостающие общие form masters — в components/figma с новыми именами (сначала проверь, что
подобного master нет). Логику отправки и API не менять.

Сверь пошагово каждый экран: шапка шага, заголовки, поля (FigmaTextField), загрузка фото
(FigmaImagePlaceholder 874:5454), кнопки «Далее/Назад», прогресс шагов, экран отмены, экран
заполненного about. Состояния: пустая форма, ошибки валидации, длинные тексты, загрузка,
ошибка отправки с retry.
Скриншоты: каждый шаг 390, два ключевых шага 1440.
```

## S6 · Создание работы

```
<общие правила>

Задача S6 · Шаги создания работы.
Источники: basics 749:2388, details 873:4404, shipping 873:4445, story 749:2473 / 877:6338,
story-process 877:6164, statuses-sheet 874:4772, buyer-contact 881:6649 / 881:6790.
Разрешённая область: features/sellers/product-draft-screen.tsx, product-draft-creation.tsx,
product-draft-images.tsx, product-draft-about.tsx, product-draft-story.tsx,
product-draft-review.tsx. Логику черновика, загрузку изображений и API не менять; только
композиция и роли masters. Если для шага нужен master, которого нет (например, лист статусов) —
согласуй имя с S5 (не создавать одноимённые файлы) или зафиксируй как зависимость.

Сверь каждый шаг: заголовки, поля, чипы категорий (FigmaChoiceChip), галерея изображений,
кнопки, отступы. Состояния: пустой шаг, ошибки, длинные названия, много изображений, экран
ревью с полными данными. Вход под seller-аккаунтом из preview-БД (не создавай новых пользователей
без необходимости; если нужно — только через существующий UI регистрации).
Скриншоты: каждый шаг 390, ревью 1440.
```

## S7 · Фильтры и сортировка (masters)

```
<общие правила>

Задача S7 · Общие controls фильтров и сортировки.
Источники: filter-sort-bar 874:5434; filters root 526:12980, cities 526:13009, city-search
526:13065, materials-radio 526:13142, materials-checkboxes 584:17554; catalog tabs 874:5421.
Разрешённая область: новые masters в components/figma (FilterSortBar, FilterSheet, option row,
search field внутри листа, action row) + экспорт из components/figma/index.ts. Существующие
экраны не переписывать: подключи один demonstration consumer минимально (например, /works)
только если это не пересекается с активной задачей S2 — иначе оставь storybook-подобный
пример в REPORT и не подключай.

Снять точную геометрию узлов: высоты 43/28, радиусы, паддинги, типографика, цвета, разделители,
состояние выбранного option, radio vs checkbox, поле поиска города, кнопки «Сбросить/Показать».
Состояния: пустой список городов, длинные названия материалов, много выбранных, клавиатурная
навигация внутри листа, Escape закрывает. Скриншоты каждого листа 390 и бара 390/1440.
```

## S8 · Cover cards: крайние данные и gradient stroke чипов

```
<общие правила>

Задача S8 · Проверка cover cards на крайних данных и gradient stroke у чипов.
Контекст: карточки приняты в d97446a (frost обтягивает текст, чипы 24 h, tracking). Открытое
расхождение: Figma stroke чипа — градиент white→#999 при 16 % (874:5467), runtime — плоский
rgba(255,255,255,0.16). Разрешённая область: figma-chip-style.ts, FigmaChip.tsx (и веб-вариант,
если понадобится FigmaChip.web.tsx с тем же API). НЕ трогать CoverFrost, cover-card-style,
токены frost/blur, WorkCoverCard/AuthorCoverCard.

1. Реализуй gradient border на web без второго слоя-подложки, ломающего радиус
   (варианты: border-image недопустим с radius; используй padding-box/border-box двойной фон
   или mask-composite на псевдослое). Нативный путь оставь плоским border с комментарием
   «retained compatibility». Проверь на тёмном и светлом фото, что чип не стал ярче/тяжелее
   Figma-экспорта figma-874-5458-work.png.
2. Крайние данные через page.route на /api/portfolio/home: название работы 3 строки (должно
   обрезаться до 2 с многоточием), slug 40 символов (одна строка, чип не выходит за 366),
   имя автора 40 символов (одна строка в верхней зоне), discipline «A, B, C, D, E» (ряд чипов не
   переносится и клипуется), отсутствующее изображение (fallback от ResilientRemoteImage).
Скриншоты: каждый кейс 390 (карточка 366) и одна карточка 264 (viewport 288) рядом с Figma PNG;
DOM-замеры чипа и зон frost до/после.
```
