# bidplace — пользовательские потоки и экраны First MVP

Последнее обновление: 2026-09-09
Статус: Confirmed product/UI scope for Figma phone cutover
Product contract: [`../product/05-MVP-RFC.md`](../product/05-MVP-RFC.md)

## 1. Источник и граница

Новый оригинальный Figma-файл `NM63j9lwRMqpo2HvAiYNll` — read-only visual target
portfolio-first UI. Его запрещено редактировать, переименовывать, очищать или
пересохранять в code-задачах. Screenshots являются review evidence, но точные tokens,
assets и measurements берутся только из versioned inspect/handoff.

Текущий production — phone UI из Figma inspect copy (`DEC-085`). Защищённый
`.pen` не редактируется и не удаляется. Product owner documents и server
contracts по-прежнему определяют routes, data, permissions и auction behavior.

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
| Home | Новые работы, авторы | Открытие недели, активные торги, цены, timers |
| Works | Title, intro, newest/oldest sort, pagination | Auction/announcement/archive tabs, price/status filters, live search overlay |
| Authors | Catalog of published authors | Rating, followers, sales and verified authenticity claims |
| Creator | Header, chips, socials, share/QR, `Работы`, `Об авторе` | Public `Архив`, cart, like, bell, private states |
| Work | Gallery, title, author, chips, optional story, details, related works, payment/delivery stub | Price, timer, archive badge, bid CTA/history |
| Auth | Email/password, verify email, forgot/reset | Telegram/Google OAuth, passwordless code, buyer-only promotion |
| Author application | Four Figma screens: identity, about, public links, private handoff | Sale language, buyer-visible handoff, achievement photo blocks |
| Create work | Four Figma screens: photos+title, details, optional story, review | Sale status/time/price, photo-text process steps |
| Search | Stub copy; optional `?q=` lists | Figma overlay with categories / authors / works |
| Admin | Author and Work moderation, user ban/session revoke | Commerce Orders/recovery as active First MVP workflow |

## 4. Home

`Открытие недели` не рендерится в этом cutover. Work cards показывают название и
автора. `Новые работы` и переход к авторам — единственные секции.

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

`Оплата и доставка` показывается как v1 stub без цены и CTA ставки. `Ставки`
отсутствуют. `Другие работы автора` содержит только Work cards; ссылка имени уже
ведёт в Creator profile. Claims об authenticity/provenance маркируются как
информация автора, если platform не проводила экспертизу.

## 8. Author application

Четыре экрана Figma:

1. photo / name / slug / city;
2. discipline and short about;
3. public socials;
4. private handoff contact.

Auth email не подставляется как public email. Выход сохраняет непустой draft; dialog
не говорит, что пользователь потеряет возможность продавать.

## 9. Work creation

Четыре экрана Figma:

1. main images + title;
2. details (category, dimensions, materials/technique, edition, year);
3. optional plain-text story;
4. review and submit.
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
