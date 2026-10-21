# Task 04 — Work-first domain contract

> **Status: split by `DEC-082`.** Portfolio Work lifecycle is active task F02; the Listing/Order/handoff part of this older prompt is deferred and its RFC §21/D01–D03 prerequisites are historical. Do not execute it unchanged.


Исполнитель: GPT-5.6 Sol
Приоритет: P0
Режим: specification-only; app code и schemas не менять

## Цель

Составить исполнимый контракт, где Work существует независимо от продажи, а Listing
является отдельной попыткой продажи. Основа: `DEC-075`–`DEC-081`, RFC §21, результат
Task 10, текущая Prisma schema/API и `14-OPEN-MVP-DECISIONS.md`.

Не начинать финальную версию до завершения Task 10 и решения основателя по D01–D03.

## Правила выполнения

- Создать от актуального HEAD ветку `feature/work-first-contract`.
- До записи spec сопоставить RFC, decision log, Prisma и API; противоречия не решать
  молча.
- Оставить один docs-only commit с сообщением `implement feature:` и bullets
  `changed`, `added`, `updated`; ветку не merge.
- Код, schema, drafts, Figma и `.pen` не менять.

## Обязательно описать

- identities и состояния Work, Listing, Offer, Order и immutable events;
- один format-neutral Order/publicId и выбранную persistence-модель его origin;
- portfolio-only Work, moderation, public visibility;
- attach auction/fixed Listing, бессрочный fixed, cancel before Order, relist после
  отсутствия продажи/разрешённого failed outcome;
- одна активная продажа и не более одной успешной сделки для unique Work;
- постоянный sold-through-bidplace и отдельный sold-elsewhere outcome;
- какие Work-поля можно менять в каждом состоянии;
- повторную модерацию после изменения и immutable sale snapshot;
- историю невыкупа/отмены без переписывания предыдущего результата;
- permissions, idempotency keys, transaction/lock order и race matrix;
- API/contracts/migrations по этапам;
- migration boundary для future Edition/InventoryUnit/quantity без реализации presale;
- какие места остаются blocked D01–D03 или юристом.

## Критерии готовности

Контракт не выбирает открытые правила; не использует fake UI или client authority;
совместим с текущим auction runtime; разделён на безопасные implementation stages;
каждое состояние имеет invariants и переходы; есть review checklist. Изменяется только
новый specification file и при необходимости backlog/status links. `.pen` не трогать.

## Ответ

Outcome; путь к spec; ключевые invariants; открытые блокеры; предложенные implementation
stages; commit SHA; changed files; краткий diff документа; `git status --short`.
