# Изоляция integration и полезные release gates

Приоритет: P1 до итоговой приёмки
Источник: CROSS:T1–T5,T7; VAL:D12; M-LOGIC-10,H4
Статус: Not started.

## Готовый промпт

Выполни только `19-test-gates`. Прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и релевантные источники с namespace в карте. Это обязательные части задания; отчёты сначала перепроверяются.

### Готовность к старту

Сначала cleanup regression T4; test scaffolding параллельно read-only, flow tests после 04/15–17.

### Границы

test-database helper, CI/scripts, relevant mobile/e2e contracts.

### Задание

Воспроизведи dropSchema в неверной БД на disposable тестовой среде. Target connection и fence должны совпадать для create/migrate/drop; cleanup только своего schema ID. Не удаляй накопленные чужие itest_* по wildcard. Подключи mobile unit и узкий end-to-end suite к понятному release gate; быстрый PR gate и release gate различай. Обнови stale wizard/header тесты под runtime, не глуши failures. QR test декодирует реально сгенерированный QR и открывает guest URL, а не только copy button.

### Приёмка

Схема удаляется из целевой disposable DB после pass/fail; соседняя schema нетронута. Ошибка cleanup не скрывается. CI перечисляет реальные suites, сохраняет failures и diagnostics. Register→OTP→apply→moderate→Work→hide и expiry/retry проходят. Контрактные тесты проверяют wire/null/limits/privacy вместо исключительно safeParse echo.

Общие checks/Definition of Done обязательны. Непройденные/недоступные проверки = Partial/Blocked, не Done.

### Не входит / условия остановки

T6 ban→404 зависит от 12, не кодировать неподтверждённую политику. Ни старые counts, ни mocks не закрывают E2E gate.

### Результат

IDs, reproduction/fix evidence, diff/commit, commands/results, documentation, оставшиеся риски и решения. Соседние пакеты автоматически не запускать.

## Дополнение visual UX audit

Дополнение UX: узкий browser gate 26–28 включает Enter, independent empty/error states, headings, error associations, modal name/focus и dock/zoom с документированным методом. Не считать старый screenshot basename доступным artifact, если файл не найден. Owner/admin/onboarding были не открыты UX-аудитором: эти сценарии всё равно требуют самостоятельной приёмки.
