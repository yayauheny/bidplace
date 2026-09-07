# bidplace — пользовательские потоки и экраны First MVP

Последнее обновление: 2026-09-08
Статус: Confirmed product/UI scope; implementation pending
Product contract: [`../product/05-MVP-RFC.md`](../product/05-MVP-RFC.md)

## 1. Источник и граница

Новый оригинальный Figma-файл `NM63j9lwRMqpo2HvAiYNll` — read-only visual target
portfolio-first UI. Его запрещено редактировать, переименовывать, очищать или
пересохранять в code-задачах. Screenshots являются review evidence, но точные tokens,
assets и measurements берутся только из versioned inspect/handoff.

Текущий production остаётся Pen-based до формального cutover. Защищённый `.pen` не
редактируется и не удаляется. Во время реализации новый product contract определяет
поведение и данные, Figma — визуальную композицию, а Pen — только historical runtime
reference.

## 2. Основной flow

```text
Visitor
  → Home / Works / Authors / Search
  → Creator profile
  → Work
  → Share / QR

Author candidate
  → Email registration and verification
  → Author application/profile
  → Admin moderation
  → Work draft
  → Work moderation
  → Published Creator + Work
```

Commerce routes/actions отсутствуют в First MVP navigation и fail-closed на сервере.

## 3. Screen matrix

| Экран | First MVP | Убирается/откладывается |
|---|---|---|
| Global navigation | Home, Search, Add, Profile | Cart, likes, notification bell |
| Home | Открытие недели, новые работы, новые авторы | Активные торги, цены, timers, sale badges |
| Works | Search, category/material filters, newest/oldest sort, pagination | Auction/announcement/archive tabs, price/status filters |
| Authors | Search, tag/city filters, name/date sort | Rating, followers, sales and verified authenticity claims |
| Creator | Header, chips, socials, share/QR, `Работы`, `Об авторе`, achievements | Public `Архив`, cart, like, bell, private states |
| Work | Gallery, title, author, chips, optional story, details, related works | Price, timer, archive badge, bid CTA/history, payment/delivery |
| Auth | Email/password, verify email, forgot/reset | Telegram/Google OAuth, passwordless code, buyer-only promotion |
| Author application | Photo, name, slug, location, about, tags, optional socials/achievements | Sale language, buyer handoff contact |
| Work creation | Photos/title, details, optional plain-text story, moderation submit | Sale mode, price/currency/time, payment, delivery, buyer contact, AI, process blocks |
| Admin | Author and Work moderation, user ban/session revoke | Commerce Orders/recovery as active First MVP workflow |

## 4. Home

`Открытие недели` показывается только при реальном ручном выборе. Если selection нет,
секция исчезает без placeholder. Work cards показывают название, автора и portfolio
facts. `Новые работы` не дублируется на одной странице.

## 5. Works and Authors discovery

Works filters: category and material. Authors filters: direction/tag and city. Search и
filtering выполняются сервером до pagination. Чипы в profile/cards сохраняют Figma
appearance; пока переход по тегу не включён, они семантически не являются кнопками.

Кнопка результата использует `работ`, не `лотов`. Unsupported placeholder filters не
рендерятся. Popularity/price/availability sorting отсутствует.

## 6. Creator profile

Публичные вкладки:

```text
Работы N | Об авторе
```

Все published portfolio Work находятся в `Работы`. Draft, Pending, Rejected и Hidden
видит только автор в кабинете. Sold/unsold taxonomy вернётся вместе с commerce и не
восстанавливает один общий public `Архив`.

`Об авторе` поддерживает about, practice и optional achievements timeline. Пустые
секции скрываются. Bottom navigation учитывает safe area и не закрывает текст/cards.

## 7. Work

Portfolio variant сохраняет визуальную галерею и информационные блоки. Tabs:

- `История` только если заполнен plain text;
- `Детали` всегда.

`Оплата и доставка` и `Ставки` отсутствуют. `Другие работы автора` содержит только
Work cards; ссылка имени уже ведёт в Creator profile. Claims об authenticity/provenance
маркируются как информация автора, если platform не проводила экспертизу.

## 8. Author application

Четыре визуальных шага допустимы:

1. photo/name/slug/location;
2. optional public socials;
3. short about, practice and directions;
4. optional achievements.

Auth email не подставляется как public email. Выход сохраняет непустой draft; dialog
не говорит, что пользователь потеряет возможность продавать.

## 9. Work creation

Три шага:

1. main images + title;
2. category, dimensions, material/technique, edition fact and creation date/year;
3. optional plain-text creation story.

CTA: `Отправить на проверку`. Main gallery и future process media — разные сущности.
Повторяющиеся photo/text stages и video находятся после MVP.

## 10. Required states

Для каждого реализованного экрана:

- loading, empty, recoverable error/retry and missing media;
- realistic long names/text and zero optional fields;
- guest, candidate, approved author and admin permissions;
- keyboard/focus, screen reader, zoom and reduced motion;
- 390 mobile, 1024 tablet and 1440 desktop;
- safe-area/keyboard behavior for fixed or floating controls;
- direct URL access to disabled commerce surfaces fails safely.
