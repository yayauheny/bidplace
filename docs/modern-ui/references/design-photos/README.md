# Design photos

Эта папка предназначена для фотографий и скриншотов будущего дизайна Modern UI. Каждая фотография должна иметь понятное имя файла и одну строку в каталоге ниже.

На момент создания каталога утверждённые изображения в задаче не переданы, поэтому реальные фото не добавлены. Не создавай фиктивные изображения и не скачивай референсы автоматически.

## Правила именования

Используй формат:

```text
[screen]-[platform]-[state].[extension]
```

Примеры: `home-mobile-default.png`, `product-detail-desktop-live.png`, `seller-product-form-mobile-error.png`.

## Каталог изображений

| Имя файла | Экран | Платформа / состояние | Что описывает | Статус |
| --- | --- | --- | --- | --- |
| `home-mobile-default.png` | Home | Mobile / default | Image-first discovery, AuctionCard и плотность ленты | Ожидается |
| `home-desktop-default.png` | Home | Desktop / default | Grid, sidebar и верхний поиск | Ожидается |
| `product-detail-mobile-live.png` | Product detail | Mobile / live | Gallery, текущая ставка, minimum next bid и BottomActionBar | Ожидается |
| `product-detail-desktop-live.png` | Product detail | Desktop / live | Gallery, auction panel и ContentTabs | Ожидается |
| `product-detail-mobile-ended.png` | Product detail | Mobile / ended | Завершённый аукцион и итоговое состояние | Ожидается |
| `seller-product-form-mobile-default.png` | Product creation/editing | Mobile / default | Staged form, поля текущего шага и CTA | Ожидается |
| `seller-product-form-mobile-error.png` | Product creation/editing | Mobile / error | Ошибки полей, upload error и retry | Ожидается |
| `admin-moderation-desktop-default.png` | Admin moderation | Desktop / default | Review rows, filters и confirmation flow | Ожидается |
| `order-mobile-authorized.png` | Order | Mobile / authorized | Role-scoped order summary и handoff action | Ожидается |

## Как добавлять фотографию

1. Положи файл в эту папку с семантическим именем.
2. Добавь или обнови строку с точным именем файла в таблице.
3. Укажи, что брать из изображения, что изменить для Modern UI и что больше не актуально.
4. Зафиксируй platform, viewport, state и дату получения.
5. Не заменяй отсутствие изображения описанием как подтверждённый дизайн.

### Шаблон записи

```markdown
| `точное-имя-файла.png` | Экран | Mobile 390 px / default | Что использовать; что изменить; какой компонент описывает | Approved / Needs review |
```
