# bidplace — карта исходников для дизайнера

Последнее обновление: 2026-08-05

Фактическая карта исходников текущего интерфейса для дизайнера или
design-agent. Здесь разделены локальные assets, runtime-фотографии из API,
UI-компоненты и временные файлы, которые нельзя считать source of truth.

## Быстрый маршрут

1. Бренд: `apps/mobile/src/components/layout/BrandLogo.tsx`.
2. Брендовые файлы: `apps/mobile/assets/branding/`.
3. Typography/tokens: `packages/design-tokens/src/modern.ts`.
4. Загрузка шрифтов: `apps/mobile/src/app/_layout.tsx`.
5. Shell/navigation: `apps/mobile/src/components/layout/AppShell.tsx`,
   `apps/mobile/src/components/layout/AppHeader.tsx`.
6. Кнопки: `apps/mobile/src/components/modern-ui/Button.tsx` и
   `apps/mobile/src/components/modern-ui/button-layout.ts`.
7. Иконки: `apps/mobile/src/components/modern-ui/AppIcon.tsx`.
8. Экранные источники: `apps/mobile/src/features/`.
9. Editable Pen canvas: `design/pen/bidplace-web.pen`.

## Логотип и брендовые assets

| Назначение | Файл | Формат/размер | Реальное использование |
|---|---|---:|---|
| Полный логотип `bidplace` | `apps/mobile/assets/branding/bidplace-wordmark-light.png` | PNG, 1922×478 | `BrandLogo.tsx`, отображается как 180×45 |
| Знак/mark | `apps/mobile/assets/branding/bidplace-mark-light.png` | PNG, 512×512 RGBA | `BrandLogo.tsx`, compact-режим, отображается 32×32 |
| Полный логотип, вектор | `apps/mobile/assets/branding/bidplace-wordmark-light.svg` | SVG | Design/export reference, напрямую текущим `BrandLogo` не используется |
| Знак, вектор | `apps/mobile/assets/branding/bidplace-mark-light.svg` | SVG | Design/export reference, напрямую текущим `BrandLogo` не используется |
| Favicon | `apps/mobile/assets/branding/bidplace-favicon-light.png` | PNG, 256×256 | `apps/mobile/app.json`, web favicon |
| Favicon, вектор | `apps/mobile/assets/branding/bidplace-favicon-light.svg` | SVG | Design/export reference |

Desktop/mobile placement и hit-area находятся в `BrandLogo.tsx`, `AppHeader.tsx`
и `AppShell.tsx`.

Не считать текущим logo source:

- `apps/mobile/assets/brand-mark.png` — старый/резервный PNG, существует, но
  `BrandLogo.tsx` его не импортирует;
- `apps/mobile/assets/BRAND-MARK-README.md` — устаревшая инструкция, всё ещё
  ссылается на `brand-mark.png`;
- `apps/mobile/assets/icon.png`, `splash-icon.png`,
  `android-icon-background.png`, `android-icon-foreground.png`,
  `android-icon-monochrome.png` — app/splash/adaptive Android assets;
- `apps/mobile/favicon.png` — отдельный 48×48 файл, не текущий web favicon.

Финальный brand asset, logo treatment и iconography имеют статус `Needs
verification`; знак не перерисовывать без решения дизайнера/основателя.

## Фотографии предметов и авторов

Локальные development seed-фотографии:

- `packages/database/prisma/fixtures/product-images/ceramic-brush-holder.png`
  — 900×1200;
- `packages/database/prisma/fixtures/product-images/handmade-mug.png`
  — 736×981;
- `packages/database/prisma/fixtures/product-images/painted-planter.png`
  — 1000×1500;
- `packages/database/prisma/fixtures/seller-profile/anna-morozova.png`
  — 740×493.

Это seed sources: приложение не импортирует их напрямую, а получает runtime
изображения из API/БД.

Runtime URLs и владельцы:

- product image: `/api/images/:imageId`, см.
  `apps/api/src/images/image-url.ts` и `apps/api/src/products/products.mapper.ts`;
- seller photo: `/api/sellers/:slug/photo`, см.
  `apps/api/src/sellers/seller-profile.mapper.ts`;
- relative URL → API origin: `apps/mobile/src/lib/environment.ts`,
  `getApiAssetUrl`;
- catalog card: `apps/mobile/src/components/modern-ui/AuctionCard.tsx`;
- product gallery: `apps/mobile/src/components/modern-ui/ProductGallery.tsx`;
- public seller: `apps/mobile/src/features/sellers/public-seller-screen.tsx`;
- seller upload/preview: `apps/mobile/src/features/sellers/seller-profile-screen.tsx`;
- draft media: `apps/mobile/src/features/sellers/product-draft-screen.tsx`;
- admin preview: `apps/mobile/src/features/admin/admin-moderation-screen.tsx`.

Placeholder: `apps/mobile/src/components/modern-ui/ImagePlaceholder.tsx`,
иконка `imageOff`. Обязательные состояния для дизайна: real image, no image,
loading/failed image, portrait 4:5 product media, author fallback и gallery с
несколькими images.

Pen README фиксирует: approved product photography сейчас не была доступна в
workspace, поэтому `design/pen/bidplace-web.pen` использует neutral
placeholders. Это не финальные фотографии.

## Шрифты и надпись `bidplace`

Локальных `.ttf`, `.otf`, `.woff` или `.woff2` в `apps/mobile/assets` нет.
Шрифты подключаются в `apps/mobile/src/app/_layout.tsx`:

- `@expo-google-fonts/inter`: `Inter_400Regular`, `Inter_500Medium`,
  `Inter_600SemiBold`, `Inter_700Bold`;
- `@expo-google-fonts/pt-mono`: `PTMono_400Regular`.

Роли и размеры — `packages/design-tokens/src/modern.ts`: display 32/38 Inter
700; screenTitle 28/34 Inter 700; sectionTitle 20/26 Inter 600; cardTitle
16/21 Inter 600; body 17/26 Inter 400; bodySmall 15/22 Inter 400; label 14/19
Inter 500; nav 13/18 Inter 500; metadata/numeric/button/caption — PT Mono 400.

Надпись `bidplace` в header — raster wordmark asset, а не случайный текстовый
label. Для дизайна использовать `bidplace-wordmark-light.svg` как vector
reference. Обычный UI-текст идёт через
`apps/mobile/src/components/modern-ui/AppText.tsx`.

## Иконки и «кнопки-картинки»

Отдельных PNG/SVG UI-иконок нет. `AppIcon` использует `lucide-react-native`
(`apps/mobile/package.json`, 1.27.0), source:
`apps/mobile/src/components/modern-ui/AppIcon.tsx`.

| Код | Lucide | Роль |
|---|---|---|
| `catalog` | `LayoutGrid` | Каталог |
| `moderation` | `ShieldCheck` | Модерация |
| `purchases` | `ShoppingBag` | Покупки |
| `seller` | `Store` | Кабинет/заявка продавца |
| `plus` | `Plus` | Добавить предмет |
| `account` | `CircleUserRound` | Account menu |
| `chevronDown` | `ChevronDown` | Account menu |
| `chevronLeft` | `ChevronLeft` | Назад |
| `imageOff` | `ImageOff` | Нет изображения |
| `logOut` | `LogOut` | Выйти |
| `trash` | `Trash2` | Удаление |
| `user` | `User` | Identity fallback |
| `x` | `X` | Закрытие |

## Кнопочные паттерны

Source: `apps/mobile/src/components/modern-ui/Button.tsx`.

| Компонент | Текущая поверхность | Геометрия |
|---|---|---:|
| `PrimaryButton` | сейчас чёрный `#111111`, текст белый | 56 px, radius 18 |
| `SecondaryButton` | белый, border `#E2DDD4`, текст `#111111` | 56 px, radius 18 |
| `DestructiveButton` | `#B63B3B`, текст белый | 56 px, radius 18 |
| `TextButton` | accent text + underline | min-height 44 px |
| `IconButton` | transparent или selected ink circle | 44×44 |
| `BackButton` | `IconButton` + `chevronLeft` | 44×44 |

Width по умолчанию `content`; есть `compact` 44 px и явный `width="block"`.
Loading сохраняет ширину, disabled использует opacity 0.5, touch target — 44×44.

### Важное расхождение по цвету

На приложенном Pen screenshot primary/error button оранжевая и соответствует
`modernTokens.color.accent = #D94A24`. В production `PrimaryButton` сейчас
чёрная и использует `modernTokens.color.ink = #111111`. Источник не согласован.
Перед реализацией нужно выбрать: оранжевая primary, чёрная primary или
семантические variants (например, чёрная основная и оранжевая retry/accent).
Дизайнер не должен молча менять цвет всех кнопок.

## Palette и geometry для сверки

Источник: `packages/design-tokens/src/modern.ts`.

- canvas/surface `#FFFFFF`, surfaceMuted `#F7F7F7`;
- ink `#111111`, textSecondary `#77736D`, border `#E2DDD4`;
- placeholder `#D8D4CD`, accent `#D94A24`, accentDark `#BC3C1B`;
- success `#3F7A48`, danger `#B63B3B`, focus `#2457E6`;
- product media ratio 4:5; desktop rail 72 px;
- desktop breakpoint 1025 px; catalog 2/3/4 columns at 0/900/1440 px;
- default button 56 px, compact button 44 px; touch target 44 px.

Это implementation tokens, не окончательное founder-approved branding. Не
добавлять gradients, shadows, dark mode, badges, verification marks или новую
iconography без отдельного решения.

## Pen и screenshots

- editable source: `design/pen/bidplace-web.pen`;
- prompts: `design/pen/01-SCREEN-PROMPTS.md`;
- review export: `design/pen/exports/catalog-review.png`;
- references: `design/pen/references/` (сейчас только `.gitkeep`);
- handoff rules: `docs/design/05-DESIGN-HANDOFF.md`.

Пути `/var/folders/.../codex-clipboard-*.png` из сообщения пользователя —
временные clipboard-файлы сессии, не versioned assets. Если screenshot станет
постоянным reference, его нужно скопировать в `design/pen/references/` с
понятным именем и зафиксировать назначение/права.

## Что отсутствует

- approved final product photography package;
- approved brand guideline и typography decision;
- отдельная design asset library для UI icons;
- согласованный primary button color;
- founder visual/device/accessibility acceptance.

Пока эти пункты не закрыты, дизайн остаётся `Partial` / `Needs verification`,
а placeholders и текущие tokens нельзя выдавать как финальную визуальную систему.
