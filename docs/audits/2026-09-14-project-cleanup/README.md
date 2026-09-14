# Аудиты и задания на исправление · 2026-09-14

Получены **6 из 7** аудитов: данные, бизнес-логика, валидация, frontend logic, сквозные гарантии и дизайн-система. Пять файлов-источников сохранены без изменения; для mobile-текста из беседы сохранена явно помеченная структурированная выписка; исправления **не запущены**. Это planning pack, не повторный аудит и не продуктовое решение. База отчётов: `70c5fd52ed306143d62b8352edd45d61943388b9`; data-аудит частично учитывал dirty tree.

Критерии готовности набора: источники учтены, все finding IDs разделены по namespace, дубли объединены, каждый пакет имеет границы, зависимости, задание, приёмку и условия остановки. Канонические product/design документы и код этим набором не меняются.

## Запуск

Передай исполнителю: «Прочитай docs/audits/2026-09-14-project-cleanup/prompts/<файл>.md и выполни только этот пакет с общими условиями». Сейчас запускать ничего не требуется.

- [Условия и Definition of Done](01-EXECUTION-RULES.md)
- [Карта находок](02-FINDING-MAP.md)
- [Исходный data audit](sources/01-data.md)
- [Исходный business logic audit](sources/02-business-logic.md)

## Порядок (обновлён; важнее числового порядка файлов)

1. Сначала безопасный test cleanup **19/T4**, contract preflight **14**, visual source **22**. Legal/provider inventory **20/21** можно готовить параллельно read-only.
2. Backend moderation **01 → 02 → 03**. **05** можно отдельно; 14 и 02 пересекаются в contracts — интегрировать последовательно.
3. **16** session recovery после auth-contract части 14; **04** application/OTP после 03/14/16 и visual preflight 22. **15** Work persistence после 01/02/14. 04/15 делят errors/forms/docs: разные worktrees не устраняют merge-конфликты.
4. **17** cabinet/start-edit после 02/16/22, final flow вместе с 15; **18** query cleanup после 05 и вне concurrent правок соответствующих screens.
5. Storage **06/07**, ops **21**, legal **20** — отдельные launch gates. Source/key inventory и fault analysis параллельно, mutations Images/Sellers сериализовать с 01–04.
6. Visual primitives **23** после 22 и затронутых form fixes, затем **24** UI subtraction. Не запускать shared token/icon/dialog правки параллельно owner/admin UI в тех же файлах.
7. **08 → 10 → 11**, **09** по измерениям после correctness. Decision package **12** только по оставшимся развилкам. Cache hypothesis **25** сначала воспроизводится.
8. **19** flow/CI gate после implementations; **13** финальная сверка на одной итоговой базе и после ещё ожидаемого visual UX-аудита.

Номера 01–13 сохранены для уже выданных ссылок. Нельзя просто запустить 01–25 одновременно. Все write-пакеты — отдельные согласованные worktrees; product/status/architecture/design документы интегрировать последовательно, сохраняя чужие записи. После интеграции проверить итоговую базу.

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
| [14-wire-validation: PATCH, multipart и границы валидации](prompts/14-wire-validation.md) | P1 correctness (VAL:D1 исходный P0); до form fixes |
| [15-work-editor-persistence: Work: save, review, submit и close](prompts/15-work-editor-persistence.md) | P1 data correctness (исходный P0 для submit) |
| [16-session-recovery: Сессия и безопасный возврат после входа](prompts/16-session-recovery.md) | P1 до MVP |
| [17-author-cabinet: Кабинет, hide/unhide и начало редактирования](prompts/17-author-cabinet.md) | P1 core loop (источники P0) |
| [18-query-state: Ключи queries и история автора](prompts/18-query-state.md) | P2 после core loop |
| [19-test-gates: Изоляция integration и полезные release gates](prompts/19-test-gates.md) | P1 до итоговой приёмки |
| [20-legal-ux: Legal UX и rules response](prompts/20-legal-ux.md) | Launch external gate; neutral copy отдельно S |
| [21-ops-readiness: Production config, backup и staging checklist](prompts/21-ops-readiness.md) | P1 launch evidence; external actions gated |
| [22-visual-reference: Согласование действующего визуального источника](prompts/22-visual-reference.md) | P1 prerequisite visual work |
| [23-ui-primitives: Единые tokens, controls, sheets и icons](prompts/23-ui-primitives.md) | P2 polish/accessibility до приёмки affected UI |
| [24-ui-subtraction: Удаление недостижимого UI и лишних зависимостей](prompts/24-ui-subtraction.md) | P2 cleanup; native Deferred |
| [25-public-media-cache: Публичные media после hide и stale auth](prompts/25-public-media-cache.md) | Needs reproduction; severity после проверки |

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

Ожидается только отдельный visual UX-аудит. Дизайн-система уже получена, но не заменяет UX-аудит всего продукта. Все implementation пакеты Not started; внешние storage/staging/legal gates этим планом не закрыты.

## Проверка этого набора

Проверены byte-for-byte совпадение двух источников, первоначальные 29 D/BL IDs; после дополнения проверяются все 91 finding ID с namespace, локальные ссылки и структура 25 промптов. Исходные отчёты сохраняют авторские Markdown hard breaks (trailing spaces), поэтому общий git diff --check сообщает их; формат источников намеренно не исправляется. Новые инструкции проверяются отдельно без sources. Тесты приложения не запускались: код не менялся.

## Новые источники

- [Сквозные гарантии](sources/03-cross-layer.md)
- [Валидация, включая D13–D15](sources/04-validation.md)
- [Mobile logic: выписка из сообщения](sources/05-mobile-logic-extract.md)
- [Дизайн-система](sources/06-design-system.md)

Новые предупреждения для исполнителя: перемещение state в React Query/RHF не самоцель; нельзя reset dirty form по updatedAt. Нельзя гарантировать отзыв уже скачанных media через hide. Один hex не означает одну semantic роль. Отсутствие close в handoff README не доказательство его отсутствия в макете. Приоритеты NO-GO/P0 из источников требуют проверки текущего состояния, а не копирования в новый вердикт.
