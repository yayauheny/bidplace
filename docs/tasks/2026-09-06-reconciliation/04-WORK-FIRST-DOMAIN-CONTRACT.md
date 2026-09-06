# Task 04 — Work-first domain contract

Исполнитель: GPT-5.6 Sol
Приоритет: P0
Режим: specification-only; app code и schemas не менять

## Цель

Составить исполнимый контракт, где Work существует независимо от продажи, а Listing
является отдельной попыткой продажи. Основа: `DEC-075`–`DEC-078`, RFC §21, текущая
Prisma schema/API и `14-OPEN-MVP-DECISIONS.md`.

## Правила выполнения

- Создать от актуального HEAD ветку `feature/work-first-contract`.
- До записи spec сопоставить RFC, decision log, Prisma и API; противоречия не решать
  молча.
- Оставить один docs-only commit с сообщением `implement feature:` и bullets
  `changed`, `added`, `updated`; ветку не merge.
- Код, schema, drafts, Figma и `.pen` не менять.

## Обязательно описать

- identities и состояния Work, Listing, Offer, Order и immutable events;
- portfolio-only Work, moderation, public visibility;
- attach auction/fixed Listing, cancel before start, relist archived Work;
- одна активная продажа и не более одной успешной сделки для unique Work;
- какие Work-поля можно менять в каждом состоянии;
- историю невыкупа/отмены без переписывания предыдущего результата;
- permissions, idempotency keys, transaction/lock order и race matrix;
- API/contracts/migrations по этапам;
- какие места остаются blocked D01–D04 или юристом.

## Критерии готовности

Контракт не выбирает открытые правила; не использует fake UI или client authority;
совместим с текущим auction runtime; разделён на безопасные implementation stages;
каждое состояние имеет invariants и переходы; есть review checklist. Изменяется только
новый specification file и при необходимости backlog/status links. `.pen` не трогать.

## Ответ

Outcome; путь к spec; ключевые invariants; открытые блокеры; предложенные implementation
stages; commit SHA; changed files; краткий diff документа; `git status --short`.
