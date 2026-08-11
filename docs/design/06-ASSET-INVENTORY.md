# bidplace — реестр дизайн-ресурсов

Последнее обновление: 2026-08-12

Статус: **Canonical source, runtime mapping и локальные demo fixtures verified**

## 1. Защищённый источник

| Asset                            | Роль                    | Статус                 | Правило                        |
| -------------------------------- | ----------------------- | ---------------------- | ------------------------------ |
| `design/pen/bidplace-web-v2.pen` | canonical visual design | restored byte-for-byte | never edit/delete in code work |

Canonical SHA-256:
`03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9`.
Исходная локальная копия:
`/Users/yayauheny/Downloads/bidplace-web-v2/bidplace-web-v2.pen`.
Публичная read-only публикация:
[pen.dev — bidplace-web-v2.pen](https://app.pen.dev/s/r32fdudQVyiuEZ5htTMYdcv40WDQ4v3vwLT82lS27uk).

Файл остаётся по canonical path. Checksum фиксируется до и после каждой
implementation-задачи. Экспорты и публичная ссылка помогают review, но не
заменяют repository source.

## 2. Неканонические Pen-материалы

| Asset                                              | Статус                    | Использование                       |
| -------------------------------------------------- | ------------------------- | ----------------------------------- |
| `design/pen/bidplace-web.pen`                      | historical                | не брать visual decisions           |
| `design/pen/target-solution/bidplace-youthful.pen` | historical/incomplete     | не брать visual decisions           |
| `design/pen/target-solution/` screenshots          | review context only       | только при явной привязке к v2 node |
| `design/pen/exports/`                              | generated review evidence | не source of truth                  |

Наличие исторического файла не разрешает удалить его в рамках code refactor.
Любые `.pen` files защищены от incidental edits; v2 имеет canonical статус.

## 3. Runtime assets

Перед реализацией каждого экрана нужно инвентаризировать реальные imports из
`apps/mobile` и public media endpoints, не открывая `.env` и credentials.

Категории:

- logo/wordmark;
- Product images и missing/error placeholders;
- SellerProfile public photo и placeholder;
- UI icons;
- font files and loading strategy;
- local/test-only demo media;
- Pen-only reference imagery.

Production UI не должен зависеть от случайного локального файла, clipboard
asset или изображения без подтверждённых прав.

### 3.1. Точная runtime-карта текущего MVP

| Роль | Точный путь в репозитории | Как используется |
| --- | --- | --- |
| Основной brand mark в текущем header | `apps/mobile/assets/branding/bidplace-logo.png` | Импортируется в `apps/mobile/src/components/layout/BrandLogo.tsx`; это знак с глазами, ссылка на `/` |
| Полный wordmark `bidplace` | `apps/mobile/assets/branding/bidplace-wordmark-light.png` и `.svg` | Доступный founder asset; сейчас напрямую не импортируется `BrandLogo.tsx`, использовать только если это подтверждено целевым Pen state |
| Favicon web | `apps/mobile/assets/branding/bidplace-favicon-light.png` и `.svg` | `apps/mobile/app.json`, web favicon |
| Mark/adaptive icon | `apps/mobile/assets/branding/bidplace-mark-light.png` и `.svg`; производные `apps/mobile/assets/android-icon-*.png` | App icon, Android adaptive/monochrome icon |
| Expo splash/icon derivatives | `apps/mobile/assets/icon.png`, `splash-icon.png`, `brand-mark.png` | Expo app configuration; не использовать как desktop wordmark |
| Product demo media | `packages/database/prisma/fixtures/product-images/ceramic-brush-holder.png`, `handmade-mug.png`, `handmade-vase.png`, `painted-planter.png` | Только local/test seed; после seed хранится в ProductImage и отдается API |
| Seller profile demo media | `packages/database/prisma/fixtures/seller-profile/anna-morozova.png`, `irina-levchenko.png`, `lena-kravets.png`, `mark-volkov.png`, `nikita-orlov.png`, `olga-vlasova.png`, `pavel-sokolov.png`, `svetlana-gromova.png` | Только local/test seed; после seed хранится в SellerProfile и отдается API |
| E2E-only profile fixture | `apps/mobile/e2e/fixtures/profile-photo.png` | Тест upload flow; не production content |

В seed сейчас используются четыре исходных product PNG для восьми карточек:
`painted-planter.png`, `ceramic-brush-holder.png`, `handmade-mug.png` и
`handmade-vase.png`. Это намеренно локальные тематические изображения, чтобы
сценарии не зависели от доступности стороннего сайта и не создавали внешний URL
с неясным copyright-статусом.

### 3.2. Точные Pen image refs

В canonical `design/pen/bidplace-web-v2.pen` найдено 17 image refs; все файлы
существуют в `design/pen/images/`. Это reference imagery для Pen/design review,
а не автоматический production content:

```text
design/pen/images/generated-1786212763126.png
design/pen/images/generated-1786212763906.png
design/pen/images/generated-1786212765393.png
design/pen/images/generated-1786212771118.png
design/pen/images/generated-1786212771295.png
design/pen/images/generated-1786219980325.png
design/pen/images/generated-1786219980566.png
design/pen/images/generated-1786219983585.png
design/pen/images/generated-1786219984336.png
design/pen/images/generated-1786234139378.png
design/pen/images/generated-1786234139941.png
design/pen/images/generated-1786234141569.png
design/pen/images/generated-1786234142900.png
design/pen/images/generated-1786237222387.png
design/pen/images/generated-1786237223787.png
design/pen/images/generated-1786237225745.png
design/pen/images/logo-transparent-tight.png
```

Canonical Pen SHA-256 на дату обновления:
`03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9`.

### 3.3. Шрифты и надпись bidplace

Шрифты не являются PNG-ассетами и не лежат отдельными файлами в репозитории:
они импортируются из Expo font packages в
`apps/mobile/src/app/_layout.tsx`:

- `@expo-google-fonts/onest`: `Onest_400Regular`, `Onest_500Medium`,
  `Onest_600SemiBold`, `Onest_700Bold` — основной контент, заголовки, цены,
  карточки и кнопки;
- `@expo-google-fonts/inter`: `Inter_400Regular`, `Inter_500Medium`,
  `Inter_600SemiBold`, `Inter_700Bold` — navigation/header и auction numeric
  treatment.

Семантические назначения и размеры находятся в
`packages/design-tokens/src/tokens.ts`. Важно не смешивать два разных ассета:
текущий `BrandLogo.tsx` показывает только `bidplace-logo.png` (mark), а
текстовая надпись `bidplace` доступна отдельным `bidplace-wordmark-light.*` и
сейчас не является автоматически подключённым CSS-текстом. Выбор между mark и
wordmark определяется конкретным целевым Pen state; не перерисовывать надпись
вручную без отдельного решения дизайнера.

### 3.4. Иконки и кнопки

Кнопки не используют изображения. Общий primitive находится в
`apps/mobile/src/components/ui/Button.tsx`, интерактивная оболочка — в
`apps/mobile/src/components/ui/MotionPressable.tsx`, а размеры/радиусы — в
`packages/design-tokens/src/tokens.ts`.

Иконки не копируются из Pen и не являются bitmap-файлами: весь текущий набор
сведён в `apps/mobile/src/components/ui/AppIcon.tsx` и импортирует
`lucide-react-native`. Семантические имена набора: `catalog`, `moderation`,
`purchases`, `seller`, `account`, `search`, `send`, `globe`, `instagram`,
`plus`, `copy`, `chevronLeft`, `chevronDown`, `chevronRight`, `arrowUpDown`,
`imageOff`, `logOut`, `trash`, `user`, `x`.

Для дизайнера важные цвета кнопок — это токены, а не картинка:

- primary/action: `designTokens.color.action` = `#090909`, hover/pressed
  `#242424`;
- bidplace accent/status: `designTokens.color.accent` = `#D94A24`, dark text
  variant `#BC3C1B`;
- surface/white label: `designTokens.color.surface` = `#FFFFFF`.

Если на конкретном canonical Pen state кнопка выглядит оранжевой, это должен
быть отдельный semantic variant/state, а не recolor случайной иконки или
растрового файла. Текущий общий `PrimaryButton` остаётся чёрным по shared token
contract; retry/error state нужно сверять с конкретным Pen node перед заменой.

### Approved logo input

Founder-provided source pack:
`/Users/yayauheny/Downloads/Telegram Desktop/logo_assets_web_expo`.

- Pen использует `logo-transparent-tight.png`; repository copy находится в
  `design/pen/images/logo-transparent-tight.png`.
- Web pack содержит transparent PNG, square PNG и favicons.
- Expo pack содержит icon/adaptive/splash/favicon/notification derivatives.
- `web/logo.svg` является SVG-container с embedded raster JPEG, а не настоящей
  векторной геометрией; не использовать его как доказательство бесконечного
  vector scaling.
- Production mapping выбирается по platform consumer, затем проверяется на
  sharpness, transparency, favicon crop и Android monochrome notification rule.
- Нельзя перерисовывать бренд или генерировать новый логотип в UI-refactor.

## 4. Fonts

Точные font families, weights, sizes и line heights извлекаются из v2 Pen и
сверяются с лицензиями и доступными runtime files. Нельзя объявить системный
fallback визуально эквивалентным без проверки. До canvas verification текущие
Inter/PT Mono — только существующий runtime baseline.

Для каждого используемого начертания проверить:

- bundled или легально доступный source;
- web/native loading;
- Cyrillic glyph coverage;
- fallback metrics и layout shift;
- required weights without synthetic rendering.

## 5. Icons

Иконка должна иметь один проверенный runtime source и семантическое имя.
Случайные emoji, copied SVG и визуально похожие glyphs не используются. Social
icons на Creator Profile появляются только вместе с поддержанными public link
contracts и безопасным external-link behavior.

## 6. Photography and media

- Product image сохраняет исходное соотношение внутри правила canonical card.
- Creator photo не подменяется generic avatar, если Pen требует фотографию;
  используется честный missing state.
- Pen mock imagery не становится production content автоматически.
- Test/demo media остаётся local/test-only и не доказывает production rights.
- Alt text берётся из real public content, а не из filename.

## 7. Asset gate template

```text
Asset:
Consumer screen/component:
Canonical Pen node:
Repository/runtime source:
Owner:
Rights/status:
Responsive variants:
Missing/error behavior:
Optimization performed:
Verified:
```

Статус экрана не повышается до `Implemented`, если critical asset имеет
неясное происхождение, отсутствующий runtime source или непроверенный loading
behavior.

## 8. Approved reference sources

Reference hierarchy не меняет canonical Pen:

| Source             | Location                                             | Status                                                                   | Разрешено брать                                                    |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Foundation archive | `/Users/yayauheny/Downloads/Foundation web Jul 2023` | historical founder reference, 251 PNG                                    | card/media hierarchy, auction surfaces, overlays, blur, atmosphere |
| Gamma archive      | `/Users/yayauheny/Downloads/Gamma web Oct 2023`      | historical founder reference, 290 PNG; cards/positioning partly outdated | controls, menus, profile/product structure, states, motion grammar |
| Avant Arte         | [artists](https://avantarte.com/artists/1)           | live reference checked 2026-08-10                                        | restrained grid, artwork framing, clipped `scale(1.05)` hover      |
| Foundation live    | [foundation.app](https://foundation.app/)            | site currently offline at audit time                                     | use supplied/archive screenshots, not unverified current behavior  |
| Gamma live         | [gamma.io](https://gamma.io/)                        | live reference checked 2026-08-10                                        | surface/motion comparison only                                     |

Нельзя переносить wallet, NFT, mint, ETH/BTC, blockchain, follower/sales или
verified semantics. Референс подтверждает presentation pattern, а не bidplace
product contract.

## 9. Selected archive index

Архивы идут последовательностями прохождения сайта. Ниже минимальный индекс,
которого достаточно агенту; весь архив просматривать перед каждой задачей не
нужно. Полное имя строится как `<folder name> <number>.png`.

### Foundation web Jul 2023

| Files   | Сценарий                                          | Использование в bidplace                                              |
| ------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| `0`     | artwork auction detail                            | hero/action hierarchy                                                 |
| `1–4`   | connect-wallet modal and provider/QR states       | только modal geometry, backdrop, focus order                          |
| `5–6`   | message-signing login step                        | только multi-step auth feedback, не wallet semantics                  |
| `7–9`   | connected header/account dropdown                 | compact account/menu states                                           |
| `10`    | empty activity                                    | honest empty state                                                    |
| `15–18` | browse/list/detail progression                    | media-first discovery and detail transition                           |
| `19–23` | bid history, collection and blurred related works | information hierarchy; `23` — atmosphere/blur reference               |
| `25–28` | collection hero, grid, empty/activity table       | collection composition and state coverage                             |
| `29–31` | place-bid modal progression                       | confirmation/error/loading anatomy only; server remains authoritative |
| `32–34` | Worlds loading → cards/grid                       | skeleton-to-content and dark media cards                              |
| `62`    | creator/profile overlay                           | profile atmosphere and account popover                                |
| `75`    | Editions card grid                                | black media stage, pill CTA, edition count                            |
| `92`    | dark auction cards                                | image/card/footer contrast and deadline grouping                      |

### Gamma web Oct 2023

| Files   | Сценарий                                      | Использование в bidplace                   |
| ------- | --------------------------------------------- | ------------------------------------------ |
| `0`     | home/feature landing                          | editorial hero and card rhythm             |
| `1`     | Bitcoin wallet chooser                        | только modal/card/close anatomy            |
| `2`     | connected profile/account                     | identity hierarchy only                    |
| `4–5`   | header dropdown states                        | menu alignment, shadow, open/close state   |
| `8`     | search autocomplete                           | query/results keyboard pattern             |
| `9`     | collection detail                             | header-to-content rhythm                   |
| `10–15` | charts/table loading and populated states     | table density, skeleton and empty behavior |
| `16–18` | ordinal collection grids                      | catalog spacing and artwork variety        |
| `19`    | collection preview/detail                     | detail surface hierarchy                   |
| `20–24` | eligibility/review/transaction modal sequence | step progression and feedback only         |
| `25–28` | review and QR/confirmation states             | asynchronous modal states only             |
| `29–34` | detail and follow-up/check-status sequence    | status feedback, confirmation and recovery |

Founder-provided 29 clipboard screenshots remain audit evidence for newer card,
filter, product, profile, Avant Arte and blur patterns. Their stable conclusions
are transcribed in `03` and `07`; temporary clipboard paths are not runtime
assets.
