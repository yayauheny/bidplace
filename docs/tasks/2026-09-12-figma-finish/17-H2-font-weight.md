# H2 · Утолщение текста: faux bold поверх реальных весов Inter (map A5)

Исполнитель: любая модель — исследование завершено, фикс однострочный.
Скоуп: только mobile web (решение основателя 2026-09-13). Не трогать Pen,
tokens, native.

## Промпт

Работай в `/Users/yayauheny/projects/bidplace`, ветка `fix/work-final`.
Прочитай `01-RULES.md` и этот файл. Стенд `http://localhost:8083`, API `:3002`.
Playwright вне сандбокса из `apps/mobile`:
`PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright node ./<name>.tmp.mjs`,
скрипт удалить перед коммитом. Пробы делать в **WebKit** (`webkit` из
`@playwright/test`), потому что цель — iOS Safari; Chromium дефект не показывает.

## Исследование (2026-09-13)

Гипотеза из `CONTINUE.md`/map A5: Expo регистрирует Inter отдельными
семействами по весам (`Inter_600SemiBold`), стили одновременно задают
`fontWeight: '600'`, и браузер добавляет синтетическое утолщение.

Факты:

1. `expo-font/build/ExpoFontLoader.web.js:145` генерирует
   `@font-face{font-family:"Inter_600SemiBold";src:url(...);font-display:auto}`
   — **без `font-weight`**, дескриптор по умолчанию `normal` (400).
   В браузере `document.fonts` подтверждает: все 8 семейств `weight: "normal"`.
2. `packages/design-tokens/src/tokens.ts`: 11 ролей `Inter_600SemiBold` +
   `fontWeight: '600'`, 16 ролей `Inter_500Medium` + `'500'`, 7 —
   `Inter_400Regular`. `AppText` передаёт токен как есть, RN Web выводит
   `font-family: Inter_600SemiBold; font-weight: 600`.
3. Проба на `/seller/anna-morozova`, текст «Анна Морозова» 24/29 −0.72,
   растровая сумма чернил строки (screenshot 2×, ниже — чем больше, тем жирнее):

   | Row | CSS | Chromium ink | WebKit ink |
   |---|---|---|---|
   | A · как в приложении | `Inter_600SemiBold` + `font-weight:600` | 5653 | **6747** |
   | B | A + `font-synthesis:none` | 5653 | 5688 |
   | C | `Inter_600SemiBold` + `font-weight:400` | 5653 | 5688 |
   | D | `Inter_500Medium` + `500` | 5032 | 5068 |
   | E | `Inter_500Medium` + `400` | 5032 | 5068 |
   | F · настоящий Bold | `Inter_700Bold` + `400` | 6246 | 6283 |

   WebKit: строка A на **+18.6 %** чернил тяжелее реального SemiBold (B/C) и
   тяжелее настоящего Bold 700 (F); canvas `measureText` даёт ширину 398 против
   380 px. Chromium bold не синтезирует (смотрит на usWeightClass файла).
   Вес 500 не затронут ни в одном движке (порог синтеза — 600).
   Снимки: `artifacts/figma-qa/typography/faux-bold-rows-webkit-390@2x.png`
   (ряды A–F сверху вниз), `faux-bold-rows-390@2x.png` (Chromium),
   `faux-bold-probe-*.png` (подписанные ряды).

Вывод: гипотеза **доказана для WebKit/iOS Safari** — целевого движка mobile
web. Затронуты все роли 600/700: `authorName`, `sectionTitle`, active tab,
заголовки карточек и т. д.

## Варианты

| Option | Class | Решение |
|---|---|---|
| A | durable fix | `html { font-synthesis: none }` в `apps/mobile/global.css`. Наследуется, отключает faux bold/italic; зарегистрированный файл рендерится как есть. Курсив в проекте не используется (`fontStyle`/`italic` — 0 вхождений). |
| B | durable, но шире скоупа | Убрать `fontWeight` из токенов, где `fontFamily` уже кодирует вес. Ломает `FigmaChip.web.tsx` другого исполнителя (читает `typography.fontWeight`), меняет native-поведение, 34 правки. |
| C | hack | Переписывать `@font-face` после `useFonts`, добавляя `font-weight`. Обходит expo-font. |

Выбрано A.

## Критерии готовности

- В WebKit ряд A ≈ ряд B/C (разница чернил < 1 %); ряды D–F без изменений.
- В Chromium ничего не меняется.
- На странице автора и главной заголовки 24/600 визуально совпадают с
  Figma-экспортом по толщине штриха (сравнение на одном масштабе).
- typecheck/lint зелёные, новых тестов нет, `.pen` не в diff.
- Обновить: `04-DESIGN-STATUS`, `11-PROJECT-STATUS` (свой hunk),
  `03-DESIGN-SYSTEM` (правило типографики web), карту A5 → ✓, vault
  `TD-geist-vs-inter`.

## Статус (2026-09-13)

Фикс A применён: `apps/mobile/global.css` → `html { font-synthesis: none }`.
Повторная проба в WebKit (та же страница, тот же текст): computed
`font-synthesis: none` на handle; ряд A 5688 = B 5688 = C 5688, D/E 5068,
F 6283 — ровно значения реальных файлов, синтез исчез. Chromium без изменений.
Снимки «после»: `faux-bold-rows-webkit-after-390@2x.png`,
`faux-bold-probe-webkit-after-390@2x.png`, `author-webkit-after-390.png`.
Canvas `measureText` в пробе по-прежнему показывает 398 px — canvas 2D не
читает CSS `font-synthesis`, к DOM это не относится.
