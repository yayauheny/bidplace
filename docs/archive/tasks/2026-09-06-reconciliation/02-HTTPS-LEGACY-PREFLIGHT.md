# Task 02 — legacy HTTPS preflight

Исполнитель: Grok 4.6 High
Review: GPT-5.6 Sol с security
Приоритет: P1 до public deploy

## Цель

Strict HTTPS schema уже действует для публичных ссылок профиля. Найти безопасный способ
обработать старые `http:` значения до того, как response validation сломает весь профиль.
Не читать и не печатать `.env`, URL пользователей или другие персональные данные.

## Правила выполнения

- Создать от актуального HEAD ветку `fix/https-legacy-preflight`.
- Сначала провести read-only inventory и выбрать durable fix; миграцию писать только
  после подтверждения фактического риска.
- Оставить один логический commit с сообщением `fix issue:` и bullets `fixed`,
  `changed`, `added`; ветку не merge.
- В отчёте не показывать значения URL или содержимое записей.

## Критерии готовности

- перечислены все затронутые поля, write/read schemas, fixtures и seed paths;
- preflight сообщает только counts по полям;
- migration policy не превращает `http:` в `https:` без доказательства поддержки;
- unsafe schemes не становятся допустимыми;
- выбранные invalid legacy values очищаются, блокируются или требуют ручного исправления;
- повторный запуск идемпотентен;
- relevant tests, typecheck, lint и build пройдены;
- status/architecture docs обновлены только по фактическому изменению;
- `.pen` отсутствует в diff.

## Ответ

Outcome; найденные поля и counts без значений; выбранная политика; branch/SHA; diff;
checks; remaining risks; `git status --short`.
