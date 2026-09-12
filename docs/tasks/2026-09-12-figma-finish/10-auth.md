# P1 · Внешний вид существующих auth форм

Рекомендуемый исполнитель: Sol high; Terra только для отдельного согласованного layout.
Зависимости: Готовые FigmaButton/TextField/AppDialog.

## Промпт для передачи

Работай в `/Users/yayauheny/projects/bidplace`. Выполни только задачу «P1 · Внешний вид существующих auth форм».
Сначала прочитай `docs/tasks/2026-09-12-figma-finish/01-RULES.md`: это обязательная часть задания, включая источники, ограничения, браузерную приёмку и формат завершения.

Источники в read-only `design/figma-handoff/portfolio-phone-v1`: auth password `527:16954`, register error `527:16956`, complete `526:15581`; классификация KEEP_FIRST_MVP.
Разрешённая область: `features/auth/auth-card.tsx`, `auth-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`; только визуальная композиция.

Приведи существующие login/register/error/completion к имеющимся Figma источникам. Сохрани методы входа, validation, submit, redirect и сообщения. Формы чувствительны: не менять transport, cookie/token storage, API и permissions.

Критерии: форма/ошибка/disabled submitting/completion визуально проверены, keyboard и сохранение ввода работают. Не переносить desktop capture как отдельный desktop target. Для verify/forgot/reset без phone-кадра использовать существующее поведение и уже утверждённые masters, явно отметить отсутствие exact parity. OAuth и email-code не добавлять. Если изменение требует auth logic — отдельная задача, не скрытый refactor.

Без эталона и итогового browser screenshot задача визуально не принята. Typecheck/lint/tests/build — отдельный технический gate. Не подменяй проверку дизайна тестами и не расширяй scope. Сохрани отчёт по правилам01, обнови статусы и сделай отдельный коммит только своих изменений.
