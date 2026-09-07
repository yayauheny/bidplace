# Task 10 — исследование creator commerce, handoff и self-service disputes

Исполнитель: Grok 4.6 High с полноценным браузером
Приоритет: P0 research gate перед Work-first contract
Режим: research/spec only; ничего не реализовывать

## Цель

На основе официальных механик площадок и повторяющихся мнений художников,
handmade-продавцов и покупателей предложить bidplace простой, честный и
масштабируемый сценарий:

`Work → portfolio/sale → Listing → bid/offer/fixed action → Order → contact → outcome → relist`.

Исследование должно уменьшить ручную работу администратора, не раскрывать контакты
без основания, не давать продавцу отменять неудобный результат и не переносить в
bidplace механики, которые работают только благодаря встроенной оплате или чату.

## Контекст bidplace

Подтверждено основателем:

- оператор и активная юридическая рамка — Беларусь; аудитория сначала Беларусь и РФ;
- bidplace показывает Work и помогает сторонам договориться, но не принимает оплату
  за Work и не организует доставку;
- public MVP: portfolio-only Work, аукцион, бессрочная fixed-price продажа и optional
  buyer price offer только для fixed;
- аукцион не содержит `Купить сейчас` или buyer offer;
- Work создаётся отдельно от продажи и позже может получить новый Listing;
- fixed Listing живёт до покупки или снятия автором до появления Order;
- после успешной передачи unique Work остаётся в истории как проданная и повторно не
  выставляется;
- после отсутствия продажи или подтверждённого срыва по стороне покупателя Work можно
  перевыставить, не переписывая старую историю;
- все существующие записи локальные и тестовые; перед public pilot их можно очистить;
- у каждого Order один общий `id/publicId` независимо от способа продажи; Order должен
  быть format-neutral, без обязательной фиктивной связи с Bid;
- in-app notification center и общие жалобы на Work/автора отложены после MVP;
  минимальная обработка проблемы конкретной сделки остаётся в MVP;
- чат, отзывы, рейтинг, presale, drops и quantity больше единицы не реализуются сейчас.

Будущая архитектура не должна закрывать путь к edition/presale/нескольким единицам,
но исследователь не должен предлагать неиспользуемые MVP-поля только «на будущее».
Нужна понятная граница расширения и migration path.

## Что остаётся спорным

1. Сколько ждать контакта после аукциона: 5 минут, 24/48/72 часа или иной срок.
2. Может ли срок только помечать overdue или автоматически освобождать Work.
3. Нужен ли внутренний чат до запуска аукционов либо достаточно внешнего контакта.
4. Кто и как сообщает `связались`, `передача завершена`, `сделка не состоялась`.
5. Достаточно ли одного заявления стороны, нужны ли два подтверждения, timeout либо
   admin review только при конфликте.
6. Следующий покупатель: runner-up, любой участник по выбору автора, последовательная
   очередь или только новый Listing.
7. Можно ли раскрывать автору контакты всех участников или только стороны нового
   подтверждённого Order.
8. Показывать ли контакты автоматически после создания Order или через отдельный
   reveal action. Автор заранее выбирает, кто пишет первым; участник видит это условие
   до ставки/покупки.
9. Что можно редактировать до модерации, после approval, в scheduled/live/fixed sale,
   после отмены, failed handoff, external sale и completed sale; когда нужна повторная
   модерация.
10. Как назвать и показать portfolio-only, снятую, не проданную, проданную через
    bidplace и проданную вне bidplace Work, не смешивая archive и sale status.
11. Как моделировать общую сделку без auction-only `sourceBidId`: прямые typed links,
    отдельный `DealIntent/PurchaseIntent`, typed origin tables или другой вариант.
12. Как сохранить путь к limited editions, quantity и presale без реализации этих
    форматов в MVP и без универсальной абстракции, которую нельзя проверить.
13. Какой минимальный self-service dispute flow снижает ручную работу, но не позволяет
    одной стороне освободить Work или испортить историю.
14. Можно ли отложить in-app notifications без критического ущерба аукциону; какой
    минимальный канал результата и second chance всё равно необходим.

## Обязательные источники

### Официальные механики

Проверить доступные актуальные help/terms/policy pages минимум восьми сервисов. Обязательное
ядро: eBay, Etsy, Catawiki, Whatnot, Bidbaits и Kufar. Добавить минимум два подходящих
сервиса из Artsy, Saatchi Art, Artfinder, Singulart, Shopify, OLX, Avito или Onliner.

Для каждого сервиса отделять:

- фактическую механику из официального источника;
- зависимость от встроенной оплаты, доставки, чата или KYC;
- применимость к bidplace без этих инструментов;
- дату проверки и прямую ссылку.

Не считать дизайн конкурента доказательством закона. Правовые выводы не делать: места,
требующие белорусского юриста, перечислить отдельно.

### Общественное мнение

Изучить не менее 30 содержательных обсуждений минимум в пяти независимых сообществах:
Reddit (`r/ArtistLounge`, `r/artbusiness`, `r/EtsySellers`, `r/handmade`, `r/Ebay` и
релевантные аналоги), официальные seller forums и независимые сообщества художников.
Предпочитать 2023–2026 годы; старые threads использовать только для устойчивой темы.

Искать реальные проблемы и пожелания:

- ghosting, non-payment и необоснованная отмена продавцом;
- сколько времени люди считают разумным для ответа;
- раздражение от обязательного чата, email и лишних уведомлений;
- желание self-service решения и случаи, когда нужен человек;
- изменение объявления после ставок/offer;
- relist, sold archive, portfolio и sold-elsewhere отметки;
- единичные работы против editions/quantity/made-to-order;
- раскрытие телефона/email и предпочтительный канал связи;
- главные боли молодых художников и handmade-продавцов при первой продаже;
- что заставляет авторов уйти с площадки или продолжать пользоваться ей.

Не выдавать популярный комментарий за статистику. Для каждой темы указать число
просмотренных обсуждений, число независимых сообществ, повторяемость, контрпримеры и
ограничения выборки. Короткие цитаты — не более 20 слов из одного источника; основной
текст пересказывать своими словами.

## Обязательный анализ

### 1. Сравнительная таблица механик

Для каждого сервиса показать:

- unique item / quantity / edition model;
- auction, fixed, offer и presale boundaries;
- срок ответа/оплаты/контакта;
- automatic cancel, seller cancel и appeal;
- second chance/relist;
- когда и кому раскрываются контакты;
- роль internal chat;
- что редактируется после публикации и ставок;
- кто подтверждает завершение;
- какая часть механики невозможна без platform payment.

### 2. Проверка предложений основателя

Дать прямой вывод по каждому варианту:

- почему 5 минут на связь достаточно или недостаточно;
- можно ли безопасно открыть автору всех bidders;
- может ли автор сам выбирать следующего покупателя;
- нужен ли чат для первого аукциона;
- может ли timeout автоматически создать право на новый Order;
- автоматический contact reveal против отдельной кнопки;
- two-party outcome против unilateral + appeal;
- бессрочный fixed Listing и правила его снятия;
- portfolio/archive/sold taxonomy;
- повторная модерация после каждого вида изменения.

### 3. Domain alternatives без кода

Сравнить минимум три модели:

1. `Order` с `type` и несколькими nullable source IDs;
2. format-neutral `Order` + единый `DealIntent/PurchaseIntent` между механикой продажи
   и Order;
3. format-neutral `Order` + отдельные typed origin tables.

Для каждой оценить referential integrity, auditability, Prisma/PostgreSQL complexity,
query performance, idempotency, fixed/offer race, Work-level uniqueness и расширение
к editions/quantity. Synthetic Bid для fixed/offer рассмотреть только как rejected
alternative.

Отдельно сравнить модель unique Work (`quantity = 1`) с будущими `Edition` и
`InventoryUnit`. Не проектировать полноценный склад или checkout.

### 4. State/edit matrix

Построить матрицу разрешённых действий для:

- draft;
- moderation pending;
- changes requested/rejected;
- approved portfolio-only;
- scheduled auction;
- live auction без ставок и со ставками;
- active fixed без offers и с offers;
- ended/withdrawn unsold;
- Order pending contact;
- failure reported/disputed/confirmed;
- sold through bidplace;
- sold elsewhere;
- hidden from public profile.

Для каждого состояния: edit content, edit sale terms, cancel, relist, archive/hide,
нужна ли повторная moderation и что остаётся immutable.

### 5. Self-service handoff proposal

Предложить минимальную state machine, где обычные случаи закрываются сторонами, а
admin видит только конфликт, abuse signal или отсутствие ответа. Обязательно показать:

- happy path;
- одна сторона молчит;
- обе согласны, что сделка сорвалась;
- стороны спорят;
- seller отказывается из-за низкой цены;
- buyer отказался или недоступен;
- Work повреждена/утрачена;
- runner-up принимает/отклоняет;
- параллельный relist и second chance;
- какие действия освобождают Work и какие не освобождают.

## Формат результата

Создать новый файл:

`docs/research/2026-09-07-CREATOR-COMMERCE-FLOWS-RESEARCH.md`

Структура результата:

1. Короткий ответ: что делать bidplace и почему.
2. Что подтверждают официальные механики.
3. Что повторяется в общественном мнении.
4. Таблица применимости площадок к bidplace.
5. Ответы на 14 спорных вопросов.
6. Рекомендуемая end-to-end модель MVP.
7. State/edit matrix.
8. Сравнение трёх domain alternatives.
9. Abuse/race/privacy matrix.
10. Что оставить после MVP.
11. Вопросы основателю.
12. Вопросы юристу Беларуси.
13. Evidence gaps и ограничения исследования.
14. Список прямых источников рядом с поддерживаемыми тезисами.

Каждый вывод пометить одним из статусов:

- `Official fact`;
- `Community signal`;
- `Inference for bidplace`;
- `Recommendation`;
- `Needs lawyer`.

## Критерии готовности

- Проверено минимум 8 сервисов по официальным источникам.
- Изучено минимум 30 содержательных community discussions из 5+ сообществ.
- Для каждого важного вывода есть прямая ссылка, дата и понятная связь с тезисом.
- Механики со встроенной оплатой не перенесены на bidplace без оговорки.
- Есть чёткий ответ про 5 минут, chat dependency, раскрытие bidders, second chance,
  two-party outcome, edit/remoderation и fixed без срока.
- Есть сравнение domain alternatives, но нет schema/code implementation.
- Есть повторяющиеся пожелания и боли именно художников/handmade-продавцов, включая
  контрпримеры и ограничения выборки.
- Рекомендация уменьшает admin workload и одновременно закрывает seller cancellation,
  contact privacy, double-sale и immutable-history abuse.
- Не изменены RFC, decision log, legal drafts, code, schema, Figma и `.pen`.
- Все новые утверждения остаются research до решения основателя.

## Git и отчёт исполнителя

- Создать от актуального HEAD ветку `feature/creator-commerce-flow-research`.
- Сделать один docs-only commit:

```text
implement feature:

* changed marketplace decision evidence
* added creator commerce flow research
* updated research index
```

- Обновить только новый research file, `docs/research/README.md`,
  `docs/product/11-PROJECT-STATUS.md` и этот master backlog после завершения.
- Не merge ветку.

В финальном ответе перечислить: outcome; branch/SHA; changed files; число официальных
сервисов, community discussions и сообществ; таблицу из 14 коротких рекомендаций;
три самых сильных контраргумента; вопросы основателю/юристу; evidence gaps;
`git status --short`.

## Промпт для проверки результата в новом чате

```text
Review-only. Не исправляй файлы. Проверь результат Task 10 по
docs/tasks/2026-09-06-reconciliation/10-CREATOR-COMMERCE-FLOWS-RESEARCH.md.
Сверь branch/commit diff, прямые источники, выборку community discussions, разделение
official fact/community signal/inference/recommendation, применимость механик без
встроенной оплаты и полноту 14 спорных вопросов. Отдельно найди рекомендации, которые
не подтверждаются источником, скрывают admin workload, допускают двойную продажу,
раскрывают контакты без нового Order или преждевременно проектируют presale/quantity.
Верни статус Complete / Partial / Failed, findings по приоритету, недостающие evidence
и точный список необходимых follow-up. Код, docs и Figma не меняй.
```
