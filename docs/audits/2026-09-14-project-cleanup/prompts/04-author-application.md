# Черновик заявки, verification и audit

Приоритет: P1/P2, до MVP
Источник: BL-03, BL-04, BL-05, BL-06
Статус: Not started.

## Готовый промпт

Выполни только `04-author-application`. Обязательно прочитай [общие условия](../01-EXECUTION-RULES.md), [порядок](../README.md) и соответствующие IDs в [data audit](../sources/01-data.md) / [logic audit](../sources/02-business-logic.md). Они являются частью задания.

### Готовность к старту

После 02/03; контрактный preflight.

### Границы

Application schemas/services, auth gate, audit, onboarding client/UI, tests; schema только при необходимости.

### Задание

Раздели сохранение неполного draft и submit по RFC §8. Не добавляй DRAFT enum вслепую: проверь live/revision модель. Полнота discipline и других полей обязательна на submit, а не препятствует неполному draft. Синтетический «Автор» не считается заполненным направлением; существующие данные не переписывать молча. Server verification gate проверь для create/save/submit и alias по порядку RFC. AuditEvent на переход submit в той же TX, без ложных событий при failure/retry.

### Приёмка

Неполная заявка восстанавливается после нового входа и не попадает в pending queue до submit. Unverified не обходит gate прямым API. Verified валидный submit проходит; неполный отклоняется. Failed submit не меняет status/audit. Первая и повторная отправки имеют audit. Guest не видит draft/private contacts. Onboarding работает с verification/retry без потери ввода.

Дополнительно выполни общие проверки и Definition of Done. Недоступные проверки означают Partial/Blocked с конкретным остатком, а не Done.

### Не входит / условия остановки

Советы «discipline required на create» и «неполный draft» согласовать через save/submit. Если семантика не определена owner docs, остановить конкретную развилку, не сужать RFC.

### Результат

Закрытые IDs, evidence, changed files/commit, команды и результаты, обновлённая документация, риски/решения и статус. Не выполнять соседние пакеты автоматически.
