# bidplace — пользовательские потоки и экраны First MVP

Последнее обновление: 2026-09-14
Статус: Confirmed product/UI scope for mobile-web 390 Figma cutover
Product contract: [`../product/05-MVP-RFC.md`](../product/05-MVP-RFC.md)

## 1. Источник и граница

Новый оригинальный Figma-файл `NM63j9lwRMqpo2HvAiYNll` — read-only visual target
portfolio-first UI. Его запрещено редактировать, переименовывать, очищать или
пересохранять в code-задачах. Screenshots являются review evidence, но точные tokens,
assets и measurements берутся только из versioned inspect/handoff.

Текущий production visual source на mobile-web 390 — Figma (`DEC-085`). Защищённый
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
| Home | Открытие недели (optional server selection), новые работы, авторы | Активные торги, цены, timers |
| Works | Search, category/material filters, newest/oldest sort, pagination | Auction/announcement/archive tabs, price/status filters |
| Authors | Search, tag/city filters, name/date sort | Rating, followers, sales and verified authenticity claims |
| Creator | Header, chips, socials, share/QR, `Работы`, `Об авторе`, achievements | Public `Архив`, cart, like, bell, private states |
| Work | Gallery, title, author, chips, optional story, details, related works, payment/delivery stub | Price, timer, archive badge, bid CTA/history |
| Auth | Email/password, verify email, forgot/reset | Telegram/Google OAuth, passwordless code, buyer-only promotion |
| Author application | Photo, name, slug, location, about, tags, optional socials/achievements | Sale language, buyer handoff contact |
| Work creation | Photos/title, details, optional plain-text story, moderation submit | Sale mode, price/currency/time, payment, delivery, buyer contact, AI, process blocks |
| Admin | Author and Work moderation, user ban/session revoke | Commerce Orders/recovery as active First MVP workflow |

Phone chrome is one 232×64 four-item glass dock: Home, Search, Add, Profile
(`DEC-088`). Search lives inside the capsule. Cart and the unused split-search
FAB are not production items. Public share aliases `/works/:id` and
`/authors/:slug` resolve to the existing Work and Creator routes.

## 4. Home

`Открытие недели` рендерится только из `home.curatorSelection` (`DEC-086`).
Если selection `null` или недоступна, секция отсутствует. Left column, handle,
and «Смотреть профиль» bind `selection.curator`. Work card `@author` binds
`selection.work.author`. Optional `note` is editorial copy on the selection
(`DEC-090`); empty/null hides «Выбор куратора» and the paragraph, not the
curator row, profile button, or work card. Work cards показывают название и
`@author`. «Новые работы» — header + hug quiet «Смотреть все» (`/works`) and
a horizontal `WorkCoverCard` scroller from `home.newWorks`. После работ —
`Новые авторы` is Frame 47 geometry with `AuthorCoverCard` photos from
`home.newAuthors` and «Смотреть все» → `/authors`.

## 5. Works and Authors discovery

Works filters: category and material. Authors filters: direction/tag and city. Search и
filtering выполняются сервером до pagination. Чипы в profile/cards сохраняют Figma
appearance; пока переход по тегу не включён, они семантически не являются кнопками.

Кнопка результата использует `работ`, не `лотов`. Unsupported placeholder filters не
рендерятся. Popularity/price/availability sorting отсутствует.

На mobile web `/works` и `/authors` коммитят фильтры и сортировку в URL только
после `Применить`; sheet хранит локальный draft до Apply/Reset. `/search?q=`
показывает независимые loading/result/empty/error/retry/pagination состояния
работ и авторов. Figma live-search overlay остаётся вне scope. Work `?tab=`
is URL-owned; Author About is local state and is not a `?tab=` contract.

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

- `История` только если заполнен plain text; public rendering may interleave
  same-work gallery extras between paragraphs (`DEC-093`);
- `Детали` всегда.

`Оплата и доставка` показывается как v1 stub без цены и CTA ставки. `Ставки`
отсутствуют. `Другие работы автора` содержит только Work cards; ссылка имени уже
ведёт в Creator profile. Claims об authenticity/provenance маркируются как
информация автора, если platform не проводила экспертизу.

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
