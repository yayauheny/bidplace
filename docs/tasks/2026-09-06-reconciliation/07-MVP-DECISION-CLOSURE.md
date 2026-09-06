# Task 07 — stress-test решений D01–D04

Исполнитель: GPT-5.6 Sol
Приоритет: P0
Режим: analysis/spec only; финальные решения принимает основатель

## Цель

Проверить варианты из `docs/product/14-OPEN-MVP-DECISIONS.md` как единую модель
сделки и дать основателю краткую рекомендацию, после которой можно без догадок
зафиксировать Work-first, fixed sale, offer и non-payment contracts.

## Правила выполнения

- Создать от актуального HEAD ветку `feature/mvp-decision-review`.
- Прочитать RFC, `DEC-075`–`DEC-078`, marketplace/abuse research, архитектуру,
  текущие Order/Bid/Listing state machines и вопросы юристу.
- Не объявлять рекомендацию решением, не добавлять `DEC-*`, не менять код, schema,
  legal drafts, Figma или `.pen`.
- Оставить один docs-only commit с сообщением `implement feature:` и bullets
  `changed`, `added`, `updated`; ветку не merge.

## Обязательно проверить

- D01: expiry, revoke, counteroffer и гонку accepted offer против fixed purchase;
- D02: срок связи, односторонний failed handoff, спор и повторную продажу;
- second chance как новую оферту без переписывания результата аукциона;
- D03: кто подтверждает `Связались`, `Передача завершена` и `Не состоялась`;
- D04: backfill против удаления только локальных тестовых данных;
- abuse cases, idempotency, contact privacy, immutable history и нужные уведомления;
- какие части требуют ответа юриста и не могут быть выбраны продуктовым анализом.

## Критерии готовности

- Для каждого подпункта есть `рекомендация`, `почему`, `главный риск`, `что меняется
  в данных/API/UI` и `что спросить у юриста`.
- Есть одна совместимая end-to-end модель, а не набор независимых советов.
- Отдельно перечислены rejected alternatives и условия их возврата после MVP.
- Результат записан в новый dated memo под `docs/research/`; `14-OPEN-MVP-DECISIONS.md`
  остаётся списком вопросов до ответа основателя.
- Ни один юридический вывод не выдан за заключение.

## Ответ

Outcome; путь к memo; таблица рекомендуемых выборов; три главных trade-off; вопросы,
которые всё ещё требуют основателя/юриста; branch/SHA; changed files; краткий diff;
`git status --short`.
