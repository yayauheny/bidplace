# H1 · Scroll-linked compact header (author page, map A3)

Рекомендуемый исполнитель: сильная модель. Если переключаться на GPT Sol high —
выполняй только этот файл + `01-RULES.md`. Не трогай Pen. Visual SoT — только
`design/figma-handoff/portfolio-phone-v1` и live Figma `uMo04w9bgrchWXXDgO4W62`.

## Промпт

Работай в `/Users/yayauheny/projects/bidplace`, ветка `fix/work-final`.
Прочитай `01-RULES.md`, этот файл, `14-COMPLETION-MAP.md` §3.2 A3.
Выполни только H1. Тесты не пиши. Критерий — поведение в браузере, не typecheck.

Стенд: Expo Web `http://localhost:8083`, API `:3002`. Не перезапускай.
Playwright вне сандбокса из `apps/mobile`:
`PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright node ./shot.tmp.mjs`
Скрипт удали перед коммитом. `.pen` не трогать.

Разрешённая область: `apps/mobile/src/features/sellers/CreatorHeader.web.tsx`,
при необходимости `creator-header.ts`, `CreatorHero.tsx` (только data-атрибуты /
visibility tied to progress), `packages/design-tokens/src/tokens.ts` если нужен
существующий `motion.layout`. Не дублировать кликабельные actions. Не трогать
dock, frost, API, seed.

## Исследование (2026-09-13)

Figma задаёт **два конечных** scrolled-кадра, не промежуточные состояния:

| Node | Файл | Что это |
|---|---|---|
| `526:14482` | `screens/creator/creator__scrolled__390x860__node-526-14482` | Compact About, фото A |
| `526:14560` | `screens/creator/creator__scrolled__390x860__node-526-14560` | Тот же layout, другой набор карточек |

Геометрия compact (`526:14482`, координаты кадра 390×860):

| Элемент | Node | x, y | size |
|---|---|---|---|
| Atmosphere | `526:14483` | −47, −340 | 485×485, opacity 0.5 |
| Compact row | `526:14521` | 20, 44 | 350×48, gap 12 |
| Avatar | `526:14523` | 0 внутри row = screen 20, 44 | 48×48, radius 100 |
| Handle | `526:14524` | 56, 14.5 внутри row | 16/19 500, −2 % |
| Social group | `526:14526` | справа в row | 100×48, glass 80 % |
| Share | `526:14535` | 112 в правой группе | 48×48 |
| Tabs | `526:14484` | 0, 186 | 390×26 |

`526:14560` повторяет те же числа (`526:14599` row 20/44 350×48, `526:14562`
tabs y 186, `526:14561` atmosphere −47/−340). Промежуточного кадра нет —
интерполяцию задаёт `docs/design/03-DESIGN-SYSTEM.md`: только
`transform`/`opacity`, reduced-motion = мгновенно или opacity ≤100 ms.
Не анимировать height/top.

Runtime до H1 (`CreatorHeader.web.tsx` @ `64f2a3a`): sticky `top: -offset`
(`offset = heroHeight − 186`), бинарный `data-compact` от IntersectionObserver
на sentinel, затем CSS transition 240 ms. Конечная геометрия уже совпадает
(ряд y 44, tabs y 186). Дефект: элементы стоят в expanded-позициях, пока
порог не пересечён, затем прыгают. Два источника правды (observer + sticky).

## Варианты

| Option | Class | Решение |
|---|---|---|
| A | durable fix | Один `progress` 0..1 = `scrollTop / offset` из scroll-контейнера `creator-scroll`. Те же end-transforms, умноженные на progress, через CSS variables. `compact`/`aria-hidden` только при progress ≥ 1. Без CSS transition на обычном motion. |
| B | acceptable workaround | Оставить бинарный toggle, подкрутить hysteresis. Не закрывает «ездят вместе со скроллом». |
| C | hack | Второй compact DOM. Запрещено: дубли кликабельных actions. |

Выбрано A.

## Критерии готовности

- Кадры 390 при scroll 0 / 25 / 50 / 75 / 100 % от `offset` в
  `artifacts/figma-qa/02-author/compact/`. Avatar/handle/actions на промежуточных
  кадрах между expanded и compact, не в конечной точке до 100 %.
- При 100 %: avatar 48 на (20, 44), tabs top 186, handle одна строка ellipsis,
  те же actions (без дублей). Сверка с `526:14482`.
- Обратный скролл возвращает expanded без скачка layout (высота hero не меняется).
- `prefers-reduced-motion: reduce`: progress 0 или 1, без промежуточной интерполяции.
- 1024 и 1440: колонка 390, те же проценты, нет горизонтального overflow.
- Keyboard: Tab по share/social не теряется при compact; фокус остаётся на том же узле.
- Typecheck + lint + существующий vitest зелёные. Новых тестов нет.
- Коммит только своих файлов. Обновить `04-DESIGN-STATUS`, `11-PROJECT-STATUS`
  (свой hunk), `03-DESIGN-SYSTEM` (правило motion шапки), карту A3, vault
  `TASK-2026-09-12-author.md`.

## Как мерить

```js
const scroll = document.querySelector('[data-testid="creator-scroll"]');
const header = document.querySelector('[data-testid="creator-sticky-header"]');
const avatar = document.querySelector('[data-testid="creator-avatar"]');
const tabs = document.querySelector('[role="tablist"]');
// scroll the RN web inner scroller, not document
scroll.scrollTop = header.offsetHeight; // or computed offset
avatar.getBoundingClientRect();
tabs.getBoundingClientRect().top; // expect 186 at progress 1
header.style.getPropertyValue('--creator-progress');
```

## Статус (2026-09-13)

Реализовано по варианту A на mobile web. Замеры 390×860, offset 264:

| % | scrollTop | avatar (x,y,w,h) | handle | actions | tabs top | fade opacity |
|---|---|---|---|---|---|---|
| 0 | 0 | 139,132,112,112 | 12,250,366,29 | 81,362 | 450 | 1 |
| 25 | 66 | 109,110,96,96 | 28,202,336,27 | 96,283 | 384 | 0.5 |
| 50 | 132 | 80,88,80,80 | 44,154,305,24 | 112,203 | 318 | 0 |
| 75 | 198 | 50,66,64,64 | 60,106,275,22 | 127,124 | 252 | 0 |
| 100 | 264 | 20,44,48,48 | 76,58,244,19 | 142,44 | 186 | 0 / hidden |
| 150 | 396 | 20,44,48,48 | same | same | 186 | hidden |

Hero height 450 на всех кадрах, один share-button, фокус на «Поделиться профилем»
сохраняется в compact (312,50). Reduced motion: progress 0 до порога, 1 после.
Кадры: `artifacts/figma-qa/02-author/compact/390-*.png`, `390-reduced-*.png`.

Fade-группы помечены `testID="creator-fade-logo|meta|tags"` (RN Web не
пробрасывает произвольные `data-*`, `testID` → `data-testid`).

Остаток: при 3 соцсетях compact-ник получает ~54 px текста («@an…»), в Figma
`526:14482` две соцсети и 122 px — определяется данными, не layout. 1024/1440 и
native не проверялись: по решению основателя скоуп — только mobile web.
