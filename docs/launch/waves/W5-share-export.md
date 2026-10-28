# W5 — Карточки для соцсетей и чек — план реализации

> **Для агентов:** выполнять через superpowers `subagent-driven-development` или
> `executing-plans`. Шаги — чекбоксы. Общие правила — [AGENT-RULES.md](../AGENT-RULES.md).

**Goal:** из страницы работы — картинка в формате История / Публикация /
Квадрат / Оригинал с логотипом, ником, ценой и временем; из заказа — чек PNG.
Всё рисует один клиентский рендерер шаблонов.

**Architecture:** `src/lib/share-card/` — шаблоны (данные), чистые функции
раскладки (cover/contain, перенос и обрезка текста, доли → пиксели) и один
рисовальщик Canvas 2D. Экраны вызывают `renderShareCard(template, data, size)`
и получают `Blob`. Без новых зависимостей.

**Spec:** [SHARE-EXPORT.md](../SHARE-EXPORT.md); Figma `5091:30095`;
[DESIGN-BRIEF.md](../DESIGN-BRIEF.md) F11.

**Ветка:** `feature/share-cards` от `main`. Факты проверены на `6720b7af`.
Зависит от: W4 (данные лота и заказа на клиенте). Рендерер (Task 1) можно
начать сразу после W0.

## Global Constraints

- Только веб (как текущий `ShareSheet`); на native кнопки нет, без ошибок.
- Рисование только по действию пользователя; при открытии листа — превью в
  масштабе 0,25, по одному холсту на формат, создаются лениво.
- Шрифты и цвета — те же, что в токенах; значения для холста берутся из
  `packages/design-tokens`, не копируются.
- Фото — опубликованная обложка с публичного медиа-домена; приватные фото истории не используются.
- Чек без контактов (SHARE-EXPORT §3).
- Не делать: PDF, серверный рендер, QR на карточке, нативный рендер.

## Review Focus

1. Кнопка «Поделиться» на iPhone Safari — открывается системный лист с
   картинкой, а не пустая вкладка. → Task 2, шаг 3.
2. Медиа без CORS — понятная ошибка «Не удалось подготовить картинку», не
   «битый» файл. → Task 1, шаг 4.
3. Длинное название и описание — обрезаются многоточием, не вылезают за край. → Task 1, шаг 1.
4. Открытие листа шаринга не создаёт 4 полноразмерных холста и не тормозит страницу. → Task 2, шаг 2.
5. Чек не содержит телефонов, почты и Telegram. → Task 3, шаг 1.

## Facts

- `src/components/figma/ShareSheet.tsx` — только веб (`Platform.OS === 'web'`),
  кнопки «Скачать QR» и «Скопировать ссылку»; `src/features/.../public-share.ts`:
  `copyPublicLink`, `downloadQrPng` (`<a download>`), `qrcode` → PNG.
- Шрифты загружаются `useFonts` в `src/app/_layout.tsx`.
- Публичные фото — `MEDIA_PUBLIC_BASE_URL` (отдельный домен медиа); CORS для
  него в репозитории не описан — проверить.
- Нет Skia, `react-native-view-shot`, `html-to-image`, `expo-sharing`.

## Фронтенд

```text
apps/mobile/src/lib/share-card/
  templates.ts     // работа ×4 формата, чек
  layout.ts        // чистые функции
  render.web.ts    // Canvas 2D → Blob
  render.ts        // native: бросает «не поддерживается» (кнопка скрыта)
  share-file.ts    // navigator.share / скачивание
```

### Task 1: Рендерер

**Files:** Create: файлы выше + `layout.spec.ts`, `templates.spec.ts`.
Test: e2e `e2e/share-card.spec.ts` (скриншоты результата).

**Interfaces:**

```ts
type ShareFormat = 'story' | 'post' | 'square' | 'original'
type CardLayer =
  | { kind: 'image'; src: 'cover'; fit: 'cover' | 'contain'; box: Box }
  | { kind: 'gradient'; box: Box; from: string; to: string }
  | { kind: 'text'; field: CardTextField; box: Box; sizeRatio: number; weight: number; color: string; maxLines: number }
  | { kind: 'logo'; box: Box } | { kind: 'rect'; box: Box; color: string; radiusRatio: number }
type Box = { x: number; y: number; w: number; h: number }   // доли 0..1
type ShareCardData = { coverUrl: string; handle: string; title: string; description?: string;
  priceLine?: string; timeLine?: string; statusLine?: string; link: string }
canvasSize(format: ShareFormat, image?: { width: number; height: number }): { width: number; height: number }
fitImage(fit, image, box): { sx; sy; sw; sh; dx; dy; dw; dh }
wrapText(measure: (s: string) => number, text: string, maxWidth: number, maxLines: number): string[]
renderShareCard(template: CardLayer[], data: ShareCardData, size: { width; height }): Promise<Blob>
```

- [ ] **Шаг 1: падающие unit-тесты** `layout.spec.ts`: `canvasSize` для 4
  форматов (оригинал 3000×2000 → 2048×1365); `fitImage` cover/contain для
  широкого и высокого фото; `wrapText` — перенос по словам, многоточие на
  последней строке, очень длинное слово.
- [ ] **Шаг 2:** FAIL → реализовать → PASS.
- [ ] **Шаг 3:** `render.web.ts`: шрифты (`document.fonts.load`), фото
  `crossOrigin = 'anonymous'`, рисование слоёв, `toBlob`; холст освобождается.
- [ ] **Шаг 4:** e2e с фикстурой: картинка 1080×1920 создаётся, скриншот
  совпадает с эталоном; при фото без CORS — ошибка с текстом, файл не создаётся.
- [ ] **Шаг 5:** проверить CORS медиа-домена production (`curl -I -H "Origin: https://bid.place" <url фото>`).
  Нет заголовка — в отчёт как блокер основателю (настройка R2/CDN), с точной
  настройкой; код не менять.
- [ ] **Шаг 6:** коммит `feat: client share card renderer`.

### Task 2: Шаринг работы

**Files:** Modify: `ShareSheet.tsx` (или экран работы — где лист собирается),
`public-share.ts`. Create: `share-file.ts`. Test: спек листа, e2e `share-card.spec.ts`.

- [ ] **Шаг 1:** падающий тест: в листе — выбор формата (чипы), переключатель
  «Добавить описание», превью, «Поделиться»/«Скачать»; строки цены/времени/
  статуса — из данных лота (`formatMoney`, тот же формат времени, что в W4).
- [ ] **Шаг 2:** превью создаются лениво в масштабе 0,25; e2e: открытие листа —
  не больше 4 холстов ≤ 270 px, полноразмерный — только после нажатия.
- [ ] **Шаг 3:** `share-file.ts`: `navigator.canShare({ files })` → `navigator.share`;
  отмена пользователем — не ошибка; иначе скачивание `<a download>`; Object URL освобождается.
- [ ] **Шаг 4:** FAIL → реализовать по Figma `5091:30095` → PASS.
- [ ] **Шаг 5:** коммит `feat: share work as story, post, square or original`.

### Task 3: Чек заказа

**Files:** Modify: `templates.ts` (чек), `src/features/commerce/order-screen.tsx`
(кнопка «Чек»). Test: `templates.spec.ts`, e2e.

- [ ] **Шаг 1:** падающий тест: данные чека из карточки заказа — номер, код,
  дата, статус, работа, сумма, способ, юридическая строка; в данных шаблона нет
  полей контактов (тип `ReceiptData` их не содержит).
- [ ] **Шаг 2:** FAIL → реализовать → PASS; кнопка только в `ACTIVE`/`COMPLETED`.
- [ ] **Шаг 3:** коммит `feat: order receipt image`.

## Бэкенд

Изменений нет. Если обложке не хватает размеров в ответе (ширина/высота) —
остановиться и описать (контракт — W3).

## Документы и проверки

### Task 4

- [ ] `04-DESIGN-STATUS.md` — шаринг и чек; `03-DESIGN-SYSTEM.md` — шаблоны
  карточек как общий механизм; `11-PROJECT-STATUS.md` — запись.
- [ ] Проверки: `typecheck`, `lint`, unit `@bidplace/mobile`; e2e `share-card`
  (Chromium и WebKit); `build:web`; `git diff --check`; `pnpm docs:link-check`.
- [ ] В отчёт: 4 карточки и чек (PNG/JPEG) как вложения.
- [ ] Коммит `docs: record share cards`.

## Промпт исполнителю

```text
Работай в /Users/yayauheny/projects/bidplace, ветка feature/share-cards от main.
Прочитай AGENTS.md, docs/launch/AGENT-RULES.md, docs/launch/SHARE-EXPORT.md и
целиком docs/launch/waves/W5-share-export.md. Скиллы: bidplace-ui, затем
bidplace-ui-review; implement; superpowers test-driven-development. Figma —
только чтение. Task 1 → Task 4, один коммит на задачу. Отчёт по AGENT-RULES §6
с картинками.
```

## Промпт ревьюеру

```text
Прочитай docs/launch/AGENT-RULES.md §7, SHARE-EXPORT.md и
docs/launch/waves/W5-share-export.md. Ревью ветки feature/share-cards против main.
Скиллы: bidplace-ui-review, code-review-best-practices. Сам сгенерируй 4 формата и
чек на 390 в Chromium и WebKit, проверь Review Focus. Вердикт по AGENT-RULES §7.
```

Инварианты: один рендерер для карточек и чека; раскладка — чистые функции с
тестами; рисование только по действию; в чеке нет контактов.

Красные флаги: новая библиотека рендера; серверная генерация; `html2canvas`-подобные
снимки DOM; копии токенов цветов в шаблонах; холсты, создаваемые при каждом рендере страницы.
