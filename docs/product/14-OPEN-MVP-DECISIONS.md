# bidplace — открытые решения первого portfolio MVP

Дата: 2026-09-08
Статус: продуктовых развилок, блокирующих contract, нет
Решения: `DEC-082`–`DEC-084`

Первый MVP зафиксирован как публичное портфолио автора без commerce. Прежние D01–D03
по offer, non-payment/second chance и handoff не потеряны: они перенесены в
[`15-POST-MVP-BACKLOG.md`](15-POST-MVP-BACKLOG.md) и
[`99-POST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md).
Они не блокируют portfolio launch.

## Что ещё требует внешнего ответа

Это не продуктовые решения основателя:

- юрист Беларуси подтверждает registration/data basis, author content license,
  retention, cookies, moderation/rightsholder procedure и фактических processors;
- команда выбирает реальные hosting/object-storage/email providers и составляет data
  inventory;
- implementation review определяет точную migration для Work revisions и object
  storage, не меняя RFC;
- read-only Figma handoff должен быть versioned перед UI implementation.

Актуальные вопросы юристу находятся в
[`../legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`](../legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md).
Технические варианты находятся в
[`../audits/01-OPEN-ARCHITECTURE-GAPS.md`](../audits/01-OPEN-ARCHITECTURE-GAPS.md).

## Правило открытия новой развилки

Добавлять сюда только вопрос, который реально меняет первый portfolio flow, schema,
permissions или public data. Commerce-вопросы остаются во втором backlog до решения
начать соответствующую волну.
