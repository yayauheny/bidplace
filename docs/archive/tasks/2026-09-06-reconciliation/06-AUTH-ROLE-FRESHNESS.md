# Task 06 — JWT role freshness

Исполнитель: Grok 4.6 High
Review: GPT-5.6 Sol с security
Приоритет: P1

## Цель

Проверить и исправить authorization paths, которые доверяют роли из ранее выданного
JWT после изменения роли, seller capability, блокировки или отзыва сессий.

## Правила выполнения

- Создать от актуального HEAD ветку `fix/auth-role-freshness`.
- До правок описать threat, candidate fixes и trade-offs; выбрать durable fix.
- Оставить один логический commit с сообщением `fix issue:` и bullets `fixed`,
  `changed`, `added`; ветку не merge.
- Не ослаблять guards и не добавлять silent fallback.

## Критерии готовности

- составлена карта guards/decorators и sensitive endpoints;
- role/capability downgrade начинает действовать без ожидания истечения старого token;
- ban/session revoke остаётся fail-closed;
- решение не делает отдельный DB lookup в каждом произвольном public request без
  измеренного основания; использовать существующий sessionVersion/current-user pattern;
- admin, seller, bids, orders, moderation и uploads покрыты значимыми tests;
- typecheck, lint, unit/integration и build пройдены вне sandbox;
- `11-PROJECT-STATUS.md` и security doc обновлены;
- `.pen` отсутствует в diff.

## Ответ

Outcome; threat/invariant; выбранное решение и trade-off; branch/SHA; changed files;
краткий diff по поведению; checks; residual risk; `git status --short`.
