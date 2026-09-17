# bidplace — пользовательские потоки и экраны First MVP

Последнее обновление: 2026-09-18
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
If Home content loads while `/api/auth/me` has an infrastructure failure, Home
stays usable and public chrome does not show a session banner. Blocking session
failure belongs to protected routes.
Blocking page fetch (Home, Work, Creator, protected session, admin/form
loads) shows only the Bidplace mark as a loading indicator. It does not use
«Загружаем bidplace…» or other large loading titles. Compact inline loaders
stay on Search, catalogs, seller works tab, and achievements.

## 5. Works and Authors discovery

Works filters: category and material. Authors filters: direction/tag and city. Search и
filtering выполняются сервером до pagination. Чипы в profile/cards сохраняют Figma
appearance; пока переход по тегу не включён, они семантически не являются кнопками.

Кнопка результата использует `работ`, не `лотов`. Unsupported placeholder filters не
рендерятся. Popularity/price/availability sorting отсутствует.

`/works` and `/authors` share title → intro → Filter/Sort → cards. Catalog-segment
tabs (`874:5421` / `526:13314`) stay hidden (`HIDE_FOR_FIRST_MVP`). Catalog intro
copy is the approved MVP strings; the visual role is `bodySmall` default ink
14/20/400/−1% `#2A2A2A` (`526:12957`, `526:13308`), not `textSecondary`.

На mobile web `/works` и `/authors` коммитят фильтры и сортировку в URL только
после `Применить`; sheet хранит локальный draft до Apply/Reset. `/search?q=`
показывает независимые loading/result/empty/pagination состояния работ и авторов.
If either search query is an infrastructure failure, Search shows one canonical
error and one Retry for both queries. Figma live-search overlay остаётся вне scope. Work `?tab=`
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

Web 390 Creator sticky header has two product states: expanded and compact.
Compact starts when scrolling reaches the measured park
`scrollTop >= heroHeight - compactStack` (`compactStack` is
`space.x3 + size.header + space.x5` = 80). Returning to
`scrollTop <= park - 20` expands again. Between those values the current
state is kept. CSS `position: sticky` parks the header. One `CreatorIdentity`
stays mounted; avatar, handle and actions keep the same nodes. Compact only
changes their layout. Reanimated `LinearTransition` (`200ms`,
`cubic-bezier(0.2, 0, 0, 1)`, `ReduceMotion.System`) interpolates those
nodes. Tabs sit below identity at `y≈80` and are not part of that
animation. Compact chrome is a presentational `StickyDockSurface` filling a
host owned by the Creator header (`stickyDock.fullHeight`), painted behind
identity and tabs as full-width square navigation glass. See
[`03-DESIGN-SYSTEM.md`](03-DESIGN-SYSTEM.md). In-session Works/About switches open the new panel from
its own start under the current header, without reopening the hero.
Direct loads stay at the page start. Page scroll is not
snapped. Web compact chrome (~106px with tabs) is an intentional deviation
from Figma iPhone `y=44` / tabs `y=186`. Canonical tokens
`creatorCompactTop` 44 and `creatorCompactHeader` 186 stay Figma source.

## 7. Work

Hero chrome follows Frame 76 (`745:21332`) relative to the web gallery, not the
Figma iOS status bar: 12px from the hero top, 20px side inset, 48×48 glass Back,
Like hidden, Share kept. Inactive gallery dots (`745:21219`) are `color.border`
`#DEDEDE`. Metadata chips (`745:21232`) share Creator `onGlass` fill and a 1px
outside `#DEDEDE`→`#F3F3F3` ring, with Work pad 6/12 and 14/500 `#565656`.
Expanded 390 composition is gallery media 520, dots after `space.x3`, identity
after `sectionGap` 20, tabs after `space.x10` 40.

Web 390 Work sticky chrome shares Creator compact `stickyDock` geometry
(action zone 80, controls 12/48/20, tabs 26) without sharing Creator park
physics. Back/Share overlay the gallery at rest and remain the same nodes
while scrolling (CSS sticky). The full-width square navigation-glass dock appears only when
tabs stick at `y≈80` under Back/Share. Identity and chips scroll away. Tab
labels keep `space.pageGutter` inset; the tab divider stays full-bleed. There
is no compact thumbnail and no Figma scrolled Work frame. Page scroll is not
snapped. In-session Story/Details/Payment switches open the new panel from
its own start under the current chrome, without scrolling the page to top.
Direct `?tab=` loads stay at the gallery top. Short Payment may undock if
maxScroll shrinks; no fake min-height. Native Work stays expanded-only.

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
