# Task 08 — security и dependency evidence review

Исполнитель: Grok 4.6 High
Review: GPT-5.6 Sol с security
Приоритет: P1 до реализации fixed/offer и public deploy
Режим: review-only; зависимости и код не менять

## Цель

Проверить фактические версии зависимостей и самописные security-critical механизмы.
Определить, где текущий код безопаснее оставить, где нужна поддерживаемая библиотека,
а где проблема решается архитектурным invariant без новой зависимости.

## Правила выполнения

- Создать от актуального HEAD ветку `fix/security-dependency-review`.
- Читать tracked manifests, lockfile и код; не открывать `.env`, credentials, БД,
  токены, сертификаты или пользовательские данные.
- Для внешних сведений использовать только primary sources: official advisories,
  package documentation и upstream repositories; указать дату проверки.
- Не запускать auto-fix, не обновлять packages, не менять runtime и не создавать PR.
- Оставить один docs-only commit с сообщением `fix issue:` и bullets `fixed`,
  `changed`, `added`; ветку не merge.

## Области проверки

- custom JWT signing/parsing против `jose`/поддерживаемого эквивалента;
- password hashing, OTP и reset-token generation/storage/expiry;
- bearer/optional/logout guards, role/capability freshness и session revocation;
- rate limiting и доверие proxy/IP headers;
- uploads: MIME sniffing, decode/normalization, размеры, decompression и storage;
- idempotency, serializable retry, row locks и уникальные DB constraints;
- URL parsing, redirects, CORS, Socket.IO auth и public asset URLs;
- email link construction и утечки чувствительных данных в logs/errors;
- production dependencies с подтверждёнными advisories;
- самописные utilities, которые дублируют зрелую библиотеку, с учётом migration risk.

## Критерии готовности

- Для каждого finding есть severity, exploit condition, evidence с файлом/строкой,
  существующие защиты и минимальное durable решение.
- `Использовать библиотеку` предлагается только с конкретной пользой, package,
  совместимостью с текущими версиями и планом миграции.
- False positives и dev-only findings отделены от production risk.
- Отдельно составлены `исправить до fixed/offer`, `исправить до public launch` и
  `допустимо отложить`.
- Результат записан в новый dated evidence review под `docs/research/`; подтверждённые
  P0/P1 gaps кратко предложены для текущего аудита, но код не меняется.

## Ответ

Outcome; путь к review; counts по severity; top findings; список keep/replace для
самописных механизмов; использованные primary sources; branch/SHA; changed files;
checks; `git status --short`.
