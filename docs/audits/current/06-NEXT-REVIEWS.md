# Навигация по bounded reviews

Срез: 2026-10-23. Это области для проверки при изменении кода, **не список новых
обязательных аудитов**. Открытая работа — [active backlog](../../product/16-PORTFOLIO-ACTIVE-BACKLOG.md),
релизные gates — [release audit](12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
Не запускать заново закрытые волны по старому prompt.

| Область | Что проверить при затрагивании | Последнее основание |
| --- | --- | --- |
| Author application / cabinet | draft/resume/submit, revision/public identity, hide/restore, moderation | [Project status](../../product/11-PROJECT-STATUS.md), [account acceptance](../2026-10-20-ACCOUNT-FINAL-ACCEPTANCE.md) |
| Work wizard / Story | save-before-leave/submit,409 recovery, published/editing isolation, photo order/progress | [UI completion](2026-10-21-UI-COMPLETION.md), [independent review](2026-10-21-INDEPENDENT-UI-REVIEW.md) |
| Auth / OTP / legal | cache/session epoch,401, deep-link return, verified writes, DEC-124/125 consent | [Registration audit](../2026-10-20-REGISTRATION-DOCUMENT-ACCESS.md), [security](../../product/13-APPLICATION-SECURITY.md) |
| Shared UI / accessibility | focus, motion, responsive/zoom, states, settings geometry exception | [Design status](../../design/04-DESIGN-STATUS.md) |
| Release / media / isolation | disposable DB fence, CI SHA, real purge/recovery/provider checks | [Release audit](12-PORTFOLIO-MVP-RELEASE-AUDIT.md) |
| Runtime / ownership / cleanup | affected contracts, existing query/cache/controller owners, actual importers before deletion | [Architecture](../../product/10-CODE-ARCHITECTURE.md), component README; inspect current code |
| Work deletion | отдельный backend/security review, not implemented | [Active backlog](../../product/16-PORTFOLIO-ACTIVE-BACKLOG.md) |

Исторические findings: [waves5–11 review](../2026-10-16-WAVES-5-11-REVIEW.md),
[resolutions](../2026-10-16-WAVES-5-11-RESOLUTIONS.md),
[packages ABC](../2026-10-17-PACKAGES-ABC-RESOLUTIONS.md).
Использовать точные namespace/ID/SHA. Раннее «browser не перезапущен» не заменяет
позднюю приёмку и не доказывает её полноту: сверять конкретный сценарий с evidence.
`RESOLVED` — реализация согласована; `Verified` — есть воспроизводимая проверка;
`Partial` / `NEEDS-FIGMA` — остаток не закрыт.
