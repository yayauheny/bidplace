# Task 05 — фактическая data/legal inventory

Исполнитель: Grok 4.6 High
Review: GPT-5.6 Sol с security
Приоритет: P0
Режим: read-only code/config inventory; secrets не читать

## Цель

По коду, schemas, public config names и deployment docs составить фактическую карту
данных до переписывания legal drafts.

## Правила выполнения

- Создать от актуального HEAD ветку `feature/data-legal-inventory`.
- Читать только tracked code, schemas и публичные имена конфигурации; `.env`, БД,
  credentials и пользовательские значения не открывать.
- Оставить один docs-only commit с сообщением `implement feature:` и bullets
  `changed`, `added`, `updated`; ветку не merge.
- Не редактировать legal drafts и не превращать предположения в факты.

## Для каждой категории указать

Источник; поля/категорию без реальных значений; цель; таблицу/хранилище; получателей;
processor/service; предполагаемую страну только при доказательстве; retention в коде
или `UNKNOWN`; delete/anonymize behavior; endpoint/screen; security controls; cookies
и local storage; audit evidence.

Отдельно покрыть account/auth, seller application, Work/media/story, bid, Listing,
Offer planned, Order/contact disclosure, moderation/complaint, email, analytics,
logs/backups и error report. Не открывать `.env`, credentials, database rows или PII.

## Критерии готовности

- ни один неизвестный provider/country/retention не выдуман;
- cookies разделены на observed и planned;
- составлен gap list для privacy policy, consent и processor contracts;
- данные, нужные юристу, отделены от инженерных задач;
- app code, public legal drafts и `.pen` не изменены;
- один docs-only commit.

## Ответ

Outcome; путь к inventory; количество data categories/providers/UNKNOWN gaps; P0
findings; branch/SHA; changed files; краткий diff документа; `git status --short`.
