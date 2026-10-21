# Task 09 — public-pilot operations readiness

Исполнитель: Grok 4.6 High
Review: GPT-5.6 Sol
Приоритет: P1
Режим: review and safe local evidence; deploy запрещён

## Цель

Сверить `docs/ops/00-RELEASE-AND-BACKUP.md` с реальным repository state и получить
конкретный список того, чего не хватает для безопасного публичного single-replica
пилота. Не выбирать хостинг или поставщиков за основателя.

## Правила выполнения

- Создать от актуального HEAD ветку `fix/public-pilot-readiness`.
- Проверять tracked Docker/CI/scripts/config schemas и только имена env-параметров.
  `.env`, credentials, реальные адреса и production systems не открывать.
- Ничего не деплоить, не менять внешние сервисы, не удалять данные и не выполнять
  destructive seed против постоянной БД.
- Safe backup/restore drill разрешён только на disposable local database с явным
  доказательством target name и без пользовательских данных.
- Оставить один docs-only commit с сообщением `fix issue:` и bullets `fixed`,
  `changed`, `added`; ветку не merge.

## Области проверки

- TLS/reverse proxy, trusted proxy headers, CORS и public base URLs;
- single API/scheduler/realtime replica invariant;
- migrations, pre-deploy backup, rollback и restore verification;
- PostgreSQL persistence, media-in-DB capacity и момент перехода к object storage;
- SMTP/OTP/password-reset delivery, bounce/failure visibility и rate limits;
- health/readiness, structured logs, alerting и отсутствие чувствительных данных;
- secrets injection/rotation как процесс без чтения значений;
- backup location, encryption, retention и off-host copy;
- domain/DNS, legal pages, support mailbox и operator details как launch inputs;
- staging smoke и минимальный launch-day/rollback checklist.

## Критерии готовности

- Каждое утверждение runbook помечено `verified`, `incorrect`, `unknown` или
  `requires external decision` с repository evidence.
- Есть P0/P1/P2 список, owner и проверяемый acceptance result для каждого gap.
- Отделены действия, которые агент может сделать в коде, от выбора хостинга,
  домена, SMTP, backup storage и юридических реквизитов основателем.
- Результат записан в `docs/ops/01-PUBLIC-PILOT-READINESS.md`; `00` изменяется только
  при доказанной фактической ошибке.
- Код приложения, public legal drafts, Figma и `.pen` не меняются.

## Ответ

Outcome; путь к readiness report; P0/P1/P2 counts; verified drills; external inputs;
branch/SHA; changed files; краткий diff; checks; `git status --short`.
