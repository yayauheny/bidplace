# bidplace — дизайн-система, компоненты и иконки

Статус: направление для новых макетов решено; production icon migration ещё не выполнена.

## 1. Баланс системы

Нужна не огромная абстрактная библиотека, а один повторяемый компонент для каждой реальной роли. Экран может показывать несколько состояний в одном frame, но production handoff должен однозначно указывать variants, размеры и поведение.

## 2. Слои токенов

### Primitive

- raw colors;
- spacing scale;
- type scale;
- radius;
- border width;
- shadow/elevation;
- durations/easing;
- sizes.

### Semantic

- background/surface/text/muted/border;
- primary action/destructive/success/warning/danger;
- focus;
- status leading/outbid/won/lost/pending/problem;
- artwork atmosphere veil;
- interactive hover/pressed/disabled.

### Component

- Button height/padding;
- TextField label/error/help;
- Card media ratio/gap;
- Dialog width/padding;
- StatusBadge colors;
- SaleAction geometry;
- Header zones;
- Icon size/stroke;
- Money symbol alignment.

Production остаётся с одним semantic token layer в `packages/design-tokens`. Figma names должны позволять прямое сопоставление, а не создавать второй независимый словарь.

## 3. Базовые компоненты

### Actions

- PrimaryButton;
- SecondaryButton;
- TextButton;
- DestructiveButton;
- IconButton;
- Slide/drag confirmation + accessible confirm alternative.

States: default, hover, focus-visible, pressed, loading, disabled, success where meaningful.

### Inputs

- TextField;
- PasswordField;
- AmountField;
- OTP code;
- TextArea;
- Select/Menu;
- Date/Time;
- Checkbox/Acknowledgement;
- Radio/Segmented choice;
- Image uploader.

States: empty, filled, focused, invalid, help, disabled, read-only/locked, submitting, server conflict.

### Content

- WorkCard;
- CreatorCard;
- Media/Gallery;
- ImagePlaceholder;
- StatusBadge;
- Characteristic row;
- CreationStep;
- SellerSummary;
- LegalDocumentCard;
- PaymentDeliverySummary;
- Money.

### Transaction

- SaleAction shell;
- Auction variant;
- Fixed variant;
- Offer variant;
- ReviewCard;
- RuleSummary;
- ResultState;
- Deal/Handoff panel.

Общая рамка может быть shared, но variants не должны превращаться в giant component с десятками булевых флагов.

### Navigation/overlay

- Header desktop/tablet/mobile;
- Search;
- Account/Discovery menu;
- Tabs;
- FilterMenu;
- Dialog;
- BottomSheet;
- Toast/InlineNotice;
- Pagination/LoadMore.

### Page states

- loading;
- empty;
- error + retry;
- forbidden;
- not found;
- offline;
- partial/stale update;
- broken/missing media.

## 4. Responsive

Acceptance widths:

- 1440 — full desktop composition;
- 1024 — tablet/intermediate pressure;
- 390 — mobile primary flow.

Правила:

- breakpoints по давлению композиции, а не названию устройства;
- primary content/action сохраняют порядок;
- sticky action учитывает safe area и keyboard;
- нет горизонтального документа;
- filters могут стать sheet/menu;
- tables превращаются в accessible cards, не теряя данных;
- touch target минимум 44×44;
- legal text и длинные названия выдерживают zoom/localization.

## 5. Motion

- короткое спокойное движение;
- card hover увеличивает artwork внутри clipped viewport, не двигая grid/text;
- menu/dialog/tab/sticky transitions используют общие tokens;
- анимация не скрывает transaction result;
- countdown не анимируется каждую секунду для screen reader;
- reduced motion отключает scale/translate/parallax;
- blur/atmosphere size-bounded и имеет static fallback;
- только transform/opacity там, где возможно.

## 6. Accessibility

- интерактивная семантика на Pressable/button/link, а не на SVG;
- visible focus;
- focus trap/return для dialog/menu;
- label, error и help связаны;
- status имеет текст, не только цвет/иконку;
- icon-only button имеет accessible name;
- decorative icon скрыта;
- drag confirmation имеет keyboard/tap alternative;
- legal links называются по назначению;
- missing artwork не выдаётся за контент;
- alt text описывает работу, атмосфера hidden.

## 7. Выбранная icon family

Решение дизайнера/основателя: **Hugeicons Stroke Rounded Free**.

Разрешённый источник:

- `@hugeicons/core-free-icons`;
- официальный React Native renderer `@hugeicons/react-native`;
- free Stroke Rounded assets.

Официальный Hugeicons repository указывает, что free icon pack и source code распространяются по MIT, а Pro packs требуют отдельной Pro license: https://github.com/hugeicons/hugeicons

Лицензию и exact package version всё равно фиксируем в dependency notice на момент внедрения.

## 8. Что сейчас в production

`apps/mobile/src/components/ui/AppIcon.tsx` уже является единственной удобной точкой входа, но внутри использует `lucide-react-native@1.27.0`. Это хороший migration seam.

Текущие semantic names включают:

```text
arrowLeft, chevronLeft/Down/Right, arrowUpDown,
copy, catalog, moderation, purchases, seller, account,
imageOff, instagram, logOut, minus, menu, plus, search,
share, send, globe, trash, user, x
```

Цель — сохранить semantic API и заменить registry/renderer после утверждения exact visual mapping. Прямые Hugeicons imports вне `AppIcon` запрещаются.

## 9. Целевой AppIcon contract

Концептуально:

```ts
type AppIconName = /* semantic union */;
type AppIconVariant = 'line' | 'fill';

<AppIcon
  name="search"
  variant="line"
  size={20}
  color={token}
/>
```

Требования:

- semantic names, не vendor names в route code;
- static per-icon imports;
- TypeScript union;
- 24×24 базовая сетка;
- runtime size/color;
- единый optical stroke;
- works on web/iOS/Android;
- SVG/vector, no raster;
- no web-only DOM;
- no silent fallback.

Если requested `fill` отсутствует, dev/test должны явно сообщить об ошибке. Нельзя молча показать line и считать задачу выполненной.

## 10. Free и custom fill

Фраза «если нет бесплатно — закрасим» означает не копирование Pro-иконки, а отдельный законный процесс:

1. проверить, есть ли подходящая free Stroke Rounded иконка;
2. взять её идею/геометрию только в пределах MIT asset;
3. дизайнер создаёт собственный bidplace fill variant;
4. не открывать, не копировать и не обводить Pro/Solid/Bulk/Duotone screenshot/asset;
5. custom SVG получает чистые paths, 24×24 viewBox и runtime color;
6. записать источник free icon, автора custom variant, дату и approved Figma node;
7. сравнить line/fill на 16/20/24/32;
8. проверить web/iOS/Android;
9. добавить в registry и tests.

Нельзя делать `fill={strokeColor}` поверх stroke icon и называть это новой заполненной иконкой. Filled silhouette должен быть оптически спроектирован.

Круглый фон кнопки принадлежит Button/Pressable, а не SVG icon.

## 11. Визуальный язык иконок

- rounded terminals;
- одинаковая визуальная масса;
- понятные силуэты в 16–20 px;
- line и custom fill могут сочетать fill+stroke, если это системно;
- optical alignment по центру action;
- опасные/успешные состояния окрашивает semantic token;
- brand/social icons не маскируются под arbitrary UI glyphs;
- BYN symbol — отдельный Money asset/component, не обычная UI icon.

## 12. Минимальный semantic set для новых экранов

### Navigation

search, menu, close, back, chevrons, account, create, home, works, creators.

### Commerce

bid/auction, fixed price/tag, offer, shopping bag, favourite future, cart future, schedule/calendar, clock, money, sold/check, unavailable/lock.

### Seller

edit, image, gallery, reorder, story, delivery, package, contact, moderation, warning, publish, draft.

### Legal/trust

document, privacy/shield, rules/check, external link, download, info, warning, support.

### State

loading if needed, retry, error, success, image off, offline.

Не искать/создавать весь список заранее. Registry растёт по approved screen need.

## 13. Designer handoff для icon

Для каждого instance/semantic role:

- AppIcon semantic name;
- Hugeicons free exact icon name или `custom`;
- line/fill;
- size;
- optical notes;
- interactive parent;
- accessible label at parent;
- color token;
- Figma component/node;
- state variants.

Если иконка неоднозначна, дизайнер показывает 2–3 free candidates. Разработчик не выбирает случайно по названию.

## 14. Code migration sequence

1. Inventory всех `AppIcon` names/usages.
2. Утвердить Figma mapping.
3. Проверить package/license/current version.
4. Добавить Hugeicons dependencies и license notice.
5. Заменить internal registry, сохранив semantic API.
6. Добавить custom icons только для approved gaps.
7. Unit test: every semantic name/variant resolves.
8. Typecheck/tree-shaking/build web/iOS/Android.
9. Visual snapshots 16/20/24/32.
10. Accessibility audit parent actions.
11. Удалить Lucide dependency только после zero usage proof.

## 15. Запрещено

- прямые imports из Hugeicons в screens;
- Pro assets без лицензии;
- tracing Pro screenshots;
- silent variant fallback;
- emoji вместо UI icon;
- raster icon;
- hardcoded icon color вне semantic exception;
- SVG owning button background;
- создание десятков custom fills «на будущее»;
- менять icon family route by route;
- объявлять migration завершённой без native/web build.

## 16. Definition of done

- approved semantic mapping;
- free/license sources recorded;
- one AppIcon registry;
- no direct vendor imports;
- custom fills documented;
- 16/20/24/32 visual check;
- 44×44 interactive parents;
- web/iOS/Android build;
- no missing/silent variants;
- old icon dependency removed only if unused;
- designer/founder acceptance.
