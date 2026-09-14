# Сессия и безопасный возврат после входа

Приоритет: P1 до MVP
Источник: M-LOGIC-03,04; M:H3; CROSS optional-auth hypothesis
Статус: Not started.

## Готовый промпт

Выполни только `16-session-recovery`. Прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и релевантные источники с namespace в карте. Это обязательные части задания; отчёты сначала перепроверяются.

### Готовность к старту

До user-flow acceptance; сериализовать auth files с 14/04.

### Границы

AuthProvider/query-client/API error boundary/ProtectedRoute, auth-scoped cache, media raw fetch paths.

### Задание

Воспроизведи revoke/expiry во время owner mutation. Выбери одну ясную границу invalidation, сравнив существующий context и React Query; useQuery не самоцель. Отличай 401 unauthenticated от domain403 и временного network error. Очисти private caches при logout/account switch. Сохрани safe pathname+query redirectTo, исключи external URL/loops. Покрой raw fetch, не только QueryCache. Stale optional cookie на public media проверь отдельно по security contract.

### Приёмка

Revoke→owner action приводит к корректному login и безопасному возврату. Domain403/network failure не разлогинивают валидного пользователя. Account switch не показывает предыдущие owner данные. Поздний ответ старого me/request не воскрешает старую сессию. Public browsing не блокируется без обоснования.

Общие checks/Definition of Done обязательны. Непройденные/недоступные проверки = Partial/Blocked, не Done.

### Не входит / условия остановки

Не повторять failed non-idempotent mutation автоматически после login; не кэшировать credentials и не ослаблять server auth.

### Результат

IDs, reproduction/fix evidence, diff/commit, commands/results, documentation, оставшиеся риски и решения. Соседние пакеты автоматически не запускать.
