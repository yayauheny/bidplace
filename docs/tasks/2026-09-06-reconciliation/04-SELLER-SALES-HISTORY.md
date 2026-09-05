# Task 04 — честная история «Продажи»

## Кому дать

- Исполнитель: GPT Terra.
- Независимая проверка: GPT-5.6 Sol.
- Приоритет: P1; не зависит от исследования next-bidder.

## Prompt исполнителю

```text
Repository: bidplace. Base branch: fix/mvp-reconciliation-review.

Доведи текущий seller orders inbox до правдивой read-only истории продаж. Прочитай
AGENTS.md, обязательные product docs, docs/audits/2026-09-06-IMPLEMENTATION-STACK-REVIEW.md
и этот task. Примени nest; security нужен для authorization/privacy review.

До кода перечисли success criteria и сравни candidate fixes. Durable contract:
- продавец видит собственные active, completed, cancelled и failed/problem rows;
- отменённая сделка не исчезает, причина/статус отображаются без раскрытия лишних данных;
- suspended seller сохраняет доступ к собственной истории;
- admin и обычный buyer без SellerProfile не получают seller endpoint;
- задача не добавляет выбор следующего участника, раскрытие контактов нескольких bidders,
  relist action, чат, отзывы или новую механику невыкупа.

Проверь API projection, pagination/order, capability authorization, Order detail access
и mobile route/components. Выбери согласованный read-only UX: cancelled row либо ведёт
в безопасный seller-owned detail, либо явно не является ссылкой. Нельзя оставлять ссылку
на гарантированный 403. Buyer privacy и contact release не расширяй. Название кабинета
и информационная архитектура должны использовать «Покупки / Продажи» там, где scope
этой задачи затрагивает copy.

Добавь tests минимум для:
- seller HTTP 200 с active + cancelled row и стабильным order;
- guest 401, admin 403, ordinary buyer/no SellerProfile 403;
- suspended seller видит свою историю;
- другой seller не видит чужой Order/detail;
- cancelled row не предлагает prohibited actions и не раскрывает контакты шире текущего
  разрешённого контракта;
- pagination не теряет/не дублирует строки на границе страницы.

PostgreSQL tests запускай вне sandbox. Выполни relevant unit/integration/HTTP tests,
API/mobile typecheck, lint и affected builds. Обнови docs/product/11-PROJECT-STATUS.md
и docs/design/04-DESIGN-STATUS.md только по фактически закрытому поведению. Не меняй
protected docs, Figma, .pen или спорные product decisions. Проверь diff.

Создай ветку fix/seller-sales-history. Один logical commit:
fix issue:

* restored cancelled seller sale history
* enforced seller history authorization
* added http and privacy coverage

Верни ровно:
1. Outcome complete/partial/blocked.
2. Branch, base SHA, commit SHA.
3. Final API and UI behavior by role/status.
4. Changed files and purpose.
5. Exact checks and results.
6. Authorization/privacy cases proved.
7. Explicitly deferred next-bidder/relist/contact behavior.
8. Remaining risks.
9. Diff stat and diff-check.
10. Confirmation Figma and .pen untouched.
```

## Критерии готовности

- CANCELLED/problem rows не фильтруются из истории продавца.
- Capability и ownership проверяются сервером; suspended seller не теряет историю.
- Нет dead link, лишнего contact disclosure и преждевременных next-bidder actions.
- HTTP happy path и отрицательные role/privacy cases доказаны.
- Pagination и сортировка детерминированы.

## Prompt проверки в новом чате Codex

```text
Review-only. Проверь Task 04 по
docs/tasks/2026-09-06-reconciliation/04-SELLER-SALES-HISTORY.md. Код не исправляй.
Сверь commit с base SHA, API authorization, cancelled/detail behavior, contact fields,
suspended seller, pagination and mobile links. Запусти tests вне sandbox. Верни
ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО; findings P0–P3 с file:line; privacy matrix; missing
tests; correction prompt. Отдельно подтверди, что исполнитель не реализовал спорную
next-bidder механику.
```
