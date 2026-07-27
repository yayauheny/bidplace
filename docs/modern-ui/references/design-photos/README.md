# Design photos

Эта папка предназначена для фотографий и скриншотов будущего дизайна Modern UI. Фото разложены по папкам сервисов/сайтов-источников. Каждая фотография должна иметь понятное имя файла и одну строку в каталоге ниже.

На момент создания каталога утверждённые изображения в задаче не переданы, поэтому реальные фото не добавлены. Не создавай фиктивные изображения и не скачивай референсы автоматически.

## Правила именования

Используй формат:

```text
[screen]-[platform]-[state].[extension]
```

Примеры: `home-mobile-default.png`, `product-detail-desktop-live.png`, `seller-product-form-mobile-error.png`.

## Каталог изображений

| Сервис / папка | Имя файла | Экран | Платформа / состояние | Что описывает | Статус |
| --- | --- | --- | --- | --- |
| [`myplastic/`](./myplastic/) | `auth-login/auth-login-mobile-reference-01.png` | Login / registration | Mobile / reference | Простая auth-форма: sheet, крупный заголовок, mono-кнопки и редкая accent-подсветка | Reference approved |
| [`myplastic/`](./myplastic/) | `settings/myplastic-settings-mobile-reference-01.png` | Settings | Mobile / reference | Группы настроек, playful mono, цветные semantic actions и grouped rows | Reference approved |
| [`myplastic/`](./myplastic/) | `dashboard/myplastic-dashboard-mobile-reference-01.png` | Profile / dashboard | Mobile / reference | Gear navigation, circular metrics, bottom CTA и compact tab bar | Reference approved |
| [`myplastic/`](./myplastic/) | `collection/myplastic-collection-empty-mobile-reference-01.png` | Collection / empty state | Mobile / reference | Category tabs, Connect CTA, close icon, empty illustration и bottom navigation | Reference approved |
| [`myplastic/`](./myplastic/) | `discovery/myplastic-discovery-filter-mobile-reference-01.png` | Discovery / filters | Mobile / reference | Segmented switcher, filter icon, editorial image rows, native bottom sheet и checkbox counts | Reference approved |
| [`myplastic/`](./myplastic/) | `catalog/myplastic-catalog-mobile-reference-01.png` | Discovery / catalog | Mobile / reference | Image-first sections, gray metadata, category arrows, rare orange labels, `PRESSED AT` и partial next card | Reference approved |
| [`myplastic/`](./myplastic/) | `product-detail/myplastic-product-detail-mobile-reference-01.png` | Product detail | Mobile / reference | Technical rows, play icons, small time metadata, similar-items rail и bottom save actions | Reference approved |
| [`myplastic/`](./myplastic/) | `product-page/myplastic-product-page-notes-mobile-reference-01.png` | Product detail | Mobile / notes state | **Primary reference:** hero object, offset disc/mark, title, author link, tags, black CTA, tabbed information and muted details | Primary reference |
| [`myplastic/`](./myplastic/) | `product-page/myplastic-product-page-story-mobile-reference-02.png` | Product detail | Mobile / story state | **Primary reference:** same hero with Album story tab selected and long-form history content | Primary reference |
| [`myplastic/`](./myplastic/) | `author/myplastic-author-profile-mobile-reference-01.png` | Author profile | Mobile / reference | Partial-image hero, short bio, releases arrow, work rail, member circles и related creators | Reference approved |
| [`myplastic/`](./myplastic/) | `search/myplastic-search-scan-mobile-reference-01.png` | Search / scan home | Mobile / reference | Technical search field, dominant action surface, quiet `RECENT`, dotted `VIEW ALL` и circular recent items | Reference approved |
| [`myplastic/`](./myplastic/) | `versions/myplastic-versions-filter-mobile-reference-01.png` | Versions / sorting | Mobile / reference | Search, selected sorting chips, bulk destructive action, compact technical list row и repeated visual affordances | Reference approved |
| [`myplastic/`](./myplastic/) | `versions/myplastic-versions-add-mobile-reference-02.png` | Versions / add state | Mobile / reference | Available filter chips, bulk add button and outlined circular plus actions in compact rows | Reference approved |
| [`tracker/`](./tracker/) | `tracker-list-mobile-reference-01.png` | Filters / auction list | Mobile / reference | Search, filter icon, rounded chips, selected accent и компактный timer/list row | Reference approved |
| — | `home-mobile-default.png` | Home | Mobile / default | Image-first discovery, AuctionCard и плотность ленты | Ожидается |
| — | `home-desktop-default.png` | Home | Desktop / default | Grid, sidebar и верхний поиск | Ожидается |
| — | `product-detail-mobile-live.png` | Product detail | Mobile / live | Gallery, текущая ставка, minimum next bid и BottomActionBar | Ожидается |
| — | `product-detail-desktop-live.png` | Product detail | Desktop / live | Gallery, auction panel и ContentTabs | Ожидается |
| — | `product-detail-mobile-ended.png` | Product detail | Mobile / ended | Завершённый аукцион и итоговое состояние | Ожидается |
| — | `seller-product-form-mobile-default.png` | Product creation/editing | Mobile / default | Staged form, поля текущего шага и CTA | Ожидается |
| — | `seller-product-form-mobile-error.png` | Product creation/editing | Mobile / error | Ошибки полей, upload error и retry | Ожидается |
| — | `admin-moderation-desktop-default.png` | Admin moderation | Desktop / default | Review rows, filters и confirmation flow | Ожидается |
| — | `order-mobile-authorized.png` | Order | Mobile / authorized | Role-scoped order summary и handoff action | Ожидается |

## Как добавлять фотографию

1. Положи файл в эту папку с семантическим именем.
2. Добавь или обнови строку с точным именем файла в таблице.
3. Укажи, что брать из изображения, что изменить для Modern UI и что больше не актуально.
4. Зафиксируй platform, viewport, state и дату получения.
5. Не заменяй отсутствие изображения описанием как подтверждённый дизайн.

Подробные разборы: [`myplastic/auth-login/README.md`](./myplastic/auth-login/README.md), [`myplastic/settings/README.md`](./myplastic/settings/README.md), [`myplastic/dashboard/README.md`](./myplastic/dashboard/README.md), [`myplastic/collection/README.md`](./myplastic/collection/README.md), [`myplastic/discovery/README.md`](./myplastic/discovery/README.md), [`myplastic/catalog/README.md`](./myplastic/catalog/README.md), [`myplastic/product-detail/README.md`](./myplastic/product-detail/README.md), [`myplastic/product-page/README.md`](./myplastic/product-page/README.md), [`myplastic/author/README.md`](./myplastic/author/README.md), [`myplastic/search/README.md`](./myplastic/search/README.md), [`myplastic/versions/README.md`](./myplastic/versions/README.md) и [`tracker/README.md`](./tracker/README.md).

### Шаблон записи

```markdown
| `точное-имя-файла.png` | Экран | Mobile 390 px / default | Что использовать; что изменить; какой компонент описывает | Approved / Needs review |
```
