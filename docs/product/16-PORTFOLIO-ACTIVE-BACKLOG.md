# Portfolio MVP — активный backlog (не архив)

**Owner** для открытой работы перед релизом. Исторические F01–F15 пакеты в
[`docs/archive/tasks/`](../archive/tasks/) **не** считаются автоматически закрытыми —
сверяйте с кодом и release audit.

## Где смотреть сейчас

| Приоритет | Документ |
| --- | --- |
| Релиз, gates, известные красные проверки | [`docs/audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md`](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md) |
| Очередь bounded review (области, не сертификат «всё закрыто») | [`docs/audits/current/06-NEXT-REVIEWS.md`](../audits/current/06-NEXT-REVIEWS.md) |
| Post-MVP (после portfolio launch) | [`15-POST-MVP-BACKLOG.md`](15-POST-MVP-BACKLOG.md) |
| Краткий журнал изменений | [`11-PROJECT-STATUS.md`](11-PROJECT-STATUS.md) |

## Открытые темы из `06-NEXT-REVIEWS` (2026-10-16 entry)

Статусы в owner-файле; здесь только навигация:

1. **Author MVP loop** — regression review (`apps/mobile` seller routes, portfolio API).
2. **Work editor / product draft** — persistence, wizard, RFC §9–10 alignment (**Partial**).
3. **Auth, OTP, legal contract** — `/me`, 401, deep links, OTP gates.
4. **Account / settings UI** — сверка с Figma account nodes (см. release audit).
5. **Commerce isolation** — fail-closed when commerce capability off (см. F01 в архиве + код `commerce` gates).

## Архив First MVP tasks

[`00-FIRST-MVP-BACKLOG.md`](../archive/tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md)
описывает исходные fifteen scopes (2026-09). Многие частично реализованы;
**не** помечайте F01–F15 `Done` без ссылки на тесты/audit в `12-PORTFOLIO-MVP-RELEASE-AUDIT.md`
или новой записи в `11-PROJECT-STATUS.md`.
