# Production config, backup и staging checklist

Приоритет: P1 launch evidence; external actions gated
Источник: CROSS:B2,G4–G7
Статус: Not started.

## Готовый промпт

Выполни только `21-ops-readiness`. Прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и релевантные источники с namespace в карте. Это обязательные части задания; отчёты сначала перепроверяются.

### Готовность к старту

Согласовать чужие CORS/env/ops изменения; storage drill после 06/07.

### Границы

Compose/runbook/config tests/backup targeting; staging evidence checklist, без внешних изменений.

### Задание

Согласуй production/staging profiles с реальными requirements SMTP/S3/origin. Не вставляй секреты и не читай env files. Убери accidental localhost production default только после проверки local profiles. Backup target identity/fingerprint должен быть проверяем без секретов; запретить ошибочную цель/небезопасные отчёты. Observability: минимальные actionable signals, не обязательный Sentry/новый stack; dependency liveness не делать причиной restart-loop. Rulesets archive проверить только при отдельном разрешённом доступе, не считать установку автоматической.

### Приёмка

Synthetic config tests: missing required bundle fail-closed; local работает; staging security явно определена. Backup guard тестируется с fake process/одноразовой БД. Runbook имеет providers, TLS/SMTP, migrations, restore, rollback, monitoring pass/fail. Внешние непроверенные пункты явно Needs verification.

Общие checks/Definition of Done обязательны. Непройденные/недоступные проверки = Partial/Blocked, не Done.

### Не входит / условия остановки

Не выбирать/покупать provider, не deploy, не запускать real backup/restore и не ослаблять security ради успешного compose.

### Результат

IDs, reproduction/fix evidence, diff/commit, commands/results, documentation, оставшиеся риски и решения. Соседние пакеты автоматически не запускать.
