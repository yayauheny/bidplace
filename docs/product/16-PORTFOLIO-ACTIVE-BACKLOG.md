# Portfolio MVP — активный backlog

Единственный список открытой работы перед релизом. Статусы не повышались в этой
очистке. `Done` только после свежей проверки. Иначе — `Needs verification` или
`Partial`, как ниже.

Исторические execution-пакеты удалены из дерева. Текст: `git show d0efc03b:docs/archive/tasks/`.

## Launch gates

| ID | Задача | Статус |
| --- | --- | --- |
| D01 | Live R2 custom domain, cache и purge до public traffic | Needs verification |
| D03 | Production startup, TLS, реальная email delivery, restore drill | Needs verification |
| D04 | Публикация legal pack: реквизиты, analytics basis, runtime consent. Тексты в `docs/legal/site`, owner `docs/legal/00-FINAL-LEGAL-AUDIT.md` | Needs verification |
| L01 | Перенос ценных legacy-данных — только если они нужны в production, с backup | Needs verification |

Закрытые на checkpoint 2026-10-06 дефекты W01–W07, W09, T01–T08, E01–E05, D02
лежат в [`12-PORTFOLIO-MVP-RELEASE-AUDIT.md`](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
Не считать их открытыми и не ставить `Done` без нового прогона.

Post-MVP, не блокер запуска: V01 (Home Opening visual), W08, W10. План продаж —
[`15-POST-MVP-BACKLOG.md`](15-POST-MVP-BACKLOG.md).

## Открытые ревью

Статусы на 2026-10-16, если ниже не сказано иное.

1. **Author MVP loop** — implementation согласована; regression review. `Needs verification`. Маршруты `apps/mobile/src/app/(seller)/**`, `features/sellers`, `packages/api-client/src/portfolio.ts`, `apps/api/src/portfolio/portfolio.service.ts`.
2. **Work editor / product draft** — `Partial`. Один owner состояния, поля RFC §9–10, save-before-submit, close-save, история создания.
3. **Auth, OTP, legal** — `Needs verification`. `/me`, глобальный 401, deep link, OTP на записи автора, принятие правил.
4. **Application draft persistence** — код 2026-10-16 (`e5f246ef`); browser E2E ещё нет. `Needs verification`.
5. **Account / settings UI** — сверка с Figma account nodes. `Needs verification`.
6. **Commerce isolation** — fail-closed при выключенной commerce capability (DEC-084). `Needs verification`.
7. **Release gate / isolated E2E** — быстрый PR gate против полного verify, без общей БД. `Needs verification`.
8. **Runtime vs docs** — AppModule, оставшиеся Prisma commerce-данные, формулировки DEC-084. `Needs verification`.
9. **Frontend dead code** — неиспользуемые header/primitives, лишние icon packs. `Needs verification`. Не визуальный редизайн.
10. **Query cache keys** — category, public author, cabinet, search first page. `Needs verification`.
11. **Backend boundaries** — Prisma в admin controller, дубль submit, malformed UUID. `Needs verification`.
12. **Visual / a11y** — live Figma, сначала 390, keyboard/focus/zoom/reduced motion. `Needs verification`. Физический iPhone не проверялся (см. design status).

Порядок: 1–3 параллельно, 4 после контракта auth, 5–8 до заявлений о релизе, 9–11 после границ, 12 перед приёмкой основателя.
