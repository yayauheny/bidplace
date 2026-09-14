# Legal UX и rules response

Приоритет: Launch external gate; neutral copy отдельно S
Источник: CROSS:B1,B5; VAL:D13,H6
Статус: Not started.

## Готовый промпт

Выполни только `20-legal-ux`. Прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md), [карту](../02-FINDING-MAP.md) и релевантные источники с namespace в карте. Это обязательные части задания; отчёты сначала перепроверяются.

### Готовность к старту

Provider/cookie/lawyer inputs для legal implementation; auth files после 14/04.

### Границы

Read-only legal inventory/decision checklist; затем approved legal UI, rules contract/client/server/audit.

### Задание

Не превращай любой checkbox в универсальное consent: установи с юристом, что является ознакомлением, договором, согласием и cookie choice. Подготовь reviewable layout и versioned acceptance flow по утверждённым документам. VAL:D13: выбери одну response shape по реальному use-case; не возвращай client method только ради unused schema. Убери неподтверждённое «проверенных авторов» по действующему RFC, без обещаний проверки личности.

### Приёмка

Approved legal controls имеют реальное server evidence где требуется: версия/субъект/время/повтор/отказ. Response parsers согласованы HTTP test. Footer/links доступные и актуальные. Lawyer/provider/cookie evidence остаётся внешним gate пока не получено. Neutral copy проверена на реальном экране.

Общие checks/Definition of Done обязательны. Непройденные/недоступные проверки = Partial/Blocked, не Done.

### Не входит / условия остановки

Не публиковать юридические документы и не включать signup/deploy автоматически. Правовую достаточность локальные тесты не доказывают.

### Результат

IDs, reproduction/fix evidence, diff/commit, commands/results, documentation, оставшиеся риски и решения. Соседние пакеты автоматически не запускать.

## Дополнение visual UX audit

UX-01 уточняет CROSS:B5: убрать неподтверждённый claim также из заголовка /authors, не только /search. Используй существующий portfolio-copy owner. RFC-safe исправление уже определённого запрета не ждёт юриста или разрешения игнорировать Figma literal; legal implementation остаётся отдельным gated шагом. Проверить оба экрана и portfolio-copy tests.
