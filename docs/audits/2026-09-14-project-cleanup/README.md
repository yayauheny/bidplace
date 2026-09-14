# Аудиты и задания на исправление · 2026-09-14

Получены **2 из 7** аудитов: данные и бизнес-логика. Исходники сохранены без изменения; исправления **не запущены**. Это planning pack, не повторный аудит и не продуктовое решение. База отчётов: `70c5fd52ed306143d62b8352edd45d61943388b9`; data-аудит частично учитывал dirty tree.

Критерии готовности набора: оба источника сохранены, все D/BL IDs учтены, дубли объединены, каждый пакет имеет границы, зависимости, задание, приёмку и условия остановки. Канонические product/design документы и код этим набором не меняются.

## Запуск

Передай исполнителю: «Прочитай docs/audits/2026-09-14-project-cleanup/prompts/<файл>.md и выполни только этот пакет с общими условиями». Сейчас запускать ничего не требуется.

- [Условия и Definition of Done](01-EXECUTION-RULES.md)
- [Карта находок](02-FINDING-MAP.md)
- [Исходный data audit](sources/01-data.md)
- [Исходный business logic audit](sources/02-business-logic.md)

## Порядок

1. Модерация и заявки: **01 → 02 → 03 → 04**. Это консервативная последовательность из-за общих services/contracts, а не обязательная логическая зависимость каждой правки.
2. **05** можно параллельно 01 в отдельном worktree.
3. Storage: inventory **06** и fault analysis **07** можно параллельно основной цепочке. Реализацию 07 сериализовать с правками ImagesService/SellersService 01–04. Финальный drill после 06+07.
4. Упрощение: после correctness **08 → 10 → 11**. **09** после 02+05 при доказанной пользе.
5. **12** готовит решения независимо; реализация изменяющей продукт части только после ясной семантики. Подтверждённый privacy leak выделяется срочно.
6. **13** после выбранных исправлений и снова после новых аудитов.

Не запускать write-пакеты в одном checkout одновременно. Даже отдельные ветки пересекаются в product/status/architecture/design docs: интегрировать последовательно, сохранять чужие записи. После merge повторить соответствующие проверки на итоговой базе.

## Пакеты

| Пакет | Приоритет |
|---|---|
| [01-work-revision-lock: Блокировка Work revision](prompts/01-work-revision-lock.md) | P1, до MVP |
| [02-revision-projections: Ревизии в очереди и кабинете](prompts/02-revision-projections.md) | P1, до MVP |
| [03-profile-concurrency: Сериализация fork профиля](prompts/03-profile-concurrency.md) | P1-порядок, исходный BL-12 P2 |
| [04-author-application: Черновик заявки, verification и audit](prompts/04-author-application.md) | P1/P2, до MVP |
| [05-facet-semantics: Точные facet значения](prompts/05-facet-semantics.md) | P2, принятый discovery scope |
| [06-media-backfill: Полнота media backfill](prompts/06-media-backfill.md) | P1 условный: запуск с BYTEA данными |
| [07-media-recovery: DB/S3 failure recovery](prompts/07-media-recovery.md) | P1 launch candidate, сценарии перепроверить |
| [08-safe-cleanup: Безопасное удаление лишнего кода](prompts/08-safe-cleanup.md) | P2 после correctness |
| [09-query-efficiency: Выборки и производительность](prompts/09-query-efficiency.md) | P2 после MVP / по измерениям |
| [10-write-path-simplification: Упрощение write paths](prompts/10-write-path-simplification.md) | P2 после correctness |
| [11-model-followups: Модель данных и schema follow-ups](prompts/11-model-followups.md) | P2 после MVP, inventory gates |
| [12-product-decisions: Legacy API и последствия ban](prompts/12-product-decisions.md) | Decision-gated |
| [13-final-acceptance: Документы и итоговая приёмка](prompts/13-final-acceptance.md) | Финальный gate |

## Поправки к исходным рекомендациям

- D1/BL-02 объединены в 02; BL-14 проверяет BL-01 и входит в 01.
- Неполный draft и required discipline совместимы через разные save/submit contracts; нельзя слепо требовать полноту на create.
- D5 failure paths требуют воспроизведения: ошибка awaited put может откатывать DB. Outbox не предрешён.
- BL-12 требует порядка locks/reread; catch P2002 не заменяет invariant.
- Exact facet не определяет AND/OR multi-select.
- D10: вычисление sort key после LIMIT может менять результаты.
- Отсутствие default API-client consumer не разрешает удалить публичный endpoint.
- Ban не равен снятию портфолио с публикации без принятого решения.
- Write-path refactor не означает разрешение сменить persistent source of truth.

## Добавление следующих аудитов

Сохранять новые источники в sources/03-*.md и далее без изменения текста. Сохранять исходные IDs с namespace источника. Дубли привязывать к существующим пакетам. Новые пакеты добавлять со следующим свободным номером, не переименовывая уже выданные. Обновлять карту/порядок, не переоткрывать закрытое без evidence.

Ожидаются contracts/validation, frontend logic, design system, visual UX, cross-layer readiness. Все implementation пакеты Not started; внешние storage/staging/legal gates этим планом не закрыты.

## Проверка этого набора

Проверены byte-for-byte совпадение двух источников, наличие всех 29 D/BL IDs, локальные ссылки и структура 13 промптов. Исходные отчёты сохраняют авторские Markdown hard breaks (trailing spaces), поэтому общий git diff --check сообщает их; формат источников намеренно не исправляется. Новые инструкции проверяются отдельно без sources. Тесты приложения не запускались: код не менялся.
