# Portfolio MVP — активный backlog

Срез: 2026-10-23, `872f22fc`. Здесь открытая работа; история F01–F15 не является
сертификатом Done. [Release audit](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md)
владеет gates/проверками, [project status](11-PROJECT-STATUS.md) — реализацией,
[post-MVP backlog](15-POST-MVP-BACKLOG.md) — следующей sales/commerce-волной.

## Удаление своих Work — Not implemented (DEC-123)

Основатель разрешил отдельную волну: подтверждение → технический tombstone →
исчезновение из owner/public reads и прямого доступа, при сохранении связности
истории/файлов. Hide/restore остаётся обратимым действием. В текущем
`apps/api/src/products/products.controller.ts` нет DELETE Work; в `Product`
(`packages/database/prisma/schema.prisma`) нет `deletedAt`; UI delete CTA нет.

Перед реализацией пройти `nest` + `security` review существующего
[DELETE-BACKEND-PLAN](../archive/tasks/2026-10-19-account-ui/DELETE-BACKEND-PLAN.md).
Это **план на review**, не новый утверждённый endpoint/permissions contract.
Не терять при уточнении:

- транзакцию и существующий product-row lock; tombstone-check под тем же lock у
  всех поздних writers, включая admin approve, story/media и update/submit;
- работу любого статуса, idempotent retry, ownership и verified/suspended policy,
  listing locks/legacy relations без обхода commerce protections;
- owner/public/detail/search/home/facets/counts, moderation/analytics reads,
  снятие curator selection в той же транзакции и запрет resurrection;
- revoke/purge retry через существующий lifecycle, private SOURCE и историю без
  каскадного удаления; public JSON/media cache, base/retry/arbitrary query URL;
- HTTP матрицу: guest, чужая/несуществующая/удалённая Work, owner любого статуса,
  suspended/unverified, повтор DELETE; строгий JSON и API-client совместимость
  (`200 {ok:true}` — предложение плана), итоговые 404/403/409 закрепить на review;
- integration гонки на двух соединениях: delete vs approve/save/submit/upload,
  purge success/failure/recovery; meaningful unit/HTTP/DB/browser checks,
  миграцию и release gate. Не показывать fake delete до рабочего API.

## Остальная открытая работа

| Тема | Статус / следующий шаг | Owner |
| --- | --- | --- |
| Live media/abuse/legal/ops acceptance | Partial / Needs verification: R2/CDN, production Turnstile, SMTP delivery, legal facts/controls, restore/rollback и media migrations | [Release audit](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md) |
| Visual/accessibility/device | Partial: физические iOS/Android/Safe Area/keyboard, zoom/text scaling, settings title exception, desktop NEEDS-FIGMA | [Design status](../design/04-DESIGN-STATUS.md) |
| Author Story / client cutover | Implemented в проверенном web/API-срезе; regression/device acceptance остаётся. Не повторять устаревшее «B6 не начат» из исходного плана | [Project status](11-PROJECT-STATUS.md), [UI review](../audits/current/2026-10-21-INDEPENDENT-UI-REVIEW.md) |
| Work wizard / persistence / RFC alignment | Проверенный editor E2E есть; при следующей правке сверять три content-шага RFC §10 с четырьмя visual/review этапами, save/409/session guards не менять ради cleanup | [UI completion](../audits/current/2026-10-21-UI-COMPLETION.md) |
| Старые review findings | Не считать автоматически открытыми или закрытыми; проверять точный ID/namespace/SHA и код перед повторной работой | [Review navigation](../audits/current/06-NEXT-REVIEWS.md) |

Ранние execution-промпты удалены только как устаревшие инструкции; это не закрывает
ни одну непроверенную функцию. [Список и восстановление](../CLEANUP-REPORT.md).
