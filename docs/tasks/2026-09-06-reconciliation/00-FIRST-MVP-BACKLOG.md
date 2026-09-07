# bidplace — execution backlog первого portfolio MVP

Дата: 2026-09-08
Статус: active
Product contract: [`docs/product/05-MVP-RFC.md`](../../product/05-MVP-RFC.md)
Future work: [`99-POST-MVP-BACKLOG.md`](99-POST-MVP-BACKLOG.md)
Ready-to-run prompts: [`../2026-09-08-first-mvp/00-EXECUTION-ORDER.md`](../2026-09-08-first-mvp/00-EXECUTION-ORDER.md)

Здесь находятся только задачи, необходимые для первого публичного portfolio MVP.
Существующие commerce task-prompts не удалены: они перенесены во второй backlog.
Каждая code-задача выполняется в отдельной короткоживущей ветке и логическом commit.
PostgreSQL checks запускаются вне sandbox.

## Порядок выполнения

Пятнадцать строк ниже сохранены как атомарная карта scope. Для передачи агентам они
собраны без потерь в восемь execution packages; точное соответствие и порядок — в
[`2026-09-08-first-mvp/00-EXECUTION-ORDER.md`](../2026-09-08-first-mvp/00-EXECUTION-ORDER.md).

| ID | Приоритет | Задача | Результат | Исполнитель |
|---|---|---|---|---|
| F01 | P0 | Commerce capability gate | Auction/bid/order/handoff UI, API mutations, jobs и public discovery выключены fail-closed; код и tests сохранены | Grok 4.6 High; review GPT-5.6 Sol |
| F02 | P0 | Portfolio Work lifecycle contract | Точный state/edit/revision/moderation contract для Draft, Pending, Changes requested, Published, Hidden и Rejected; без Listing/Order | GPT-5.6 Sol |
| F03 | P0 | Media boundary | S3-compatible object storage, main-image/rendition model, limits, authorization, cleanup и backup/restore; binary DB migration без потери Work | Grok 4.6 High; review GPT-5.6 Sol |
| F04 | P0 | [Фактическая data/legal inventory](05-DATA-AND-LEGAL-INVENTORY.md) | Реальные данные, cookies, providers, countries, retention и public/private fields для portfolio flow | Grok 4.6 High; review GPT-5.6 Sol |
| F05 | P1 | [JWT role freshness](06-AUTH-ROLE-FRESHNESS.md) | Ban/revoke/role changes не обходятся старым token | Grok 4.6 High; security review GPT-5.6 Sol |
| F06 | P1 | [Security/dependency review](08-SECURITY-DEPENDENCY-REVIEW.md) | Evidence review auth, uploads, admin, external APIs и самописных security utilities; только необходимые исправления | Grok 4.6 High; review GPT-5.6 Sol |
| F07 | P1 | [Legacy HTTPS preflight](02-HTTPS-LEGACY-PREFLIGHT.md) | Публичные ссылки и старые записи совместимы со strict HTTPS без скрытого breakage | Grok 4.6 High; review GPT-5.6 Sol |
| F08 | P0 | Author application/profile contract и API | Required/optional fields, structured socials, achievements, moderation/revision и public projection соответствуют RFC | GPT-5.6 Sol contract; Grok 4.6 High implementation |
| F09 | P0 | Work creation и cabinet | Три шага, autosaved draft, images/cover, details, optional text story, submit/resubmit/hide и status feedback | Grok 4.6 High; review GPT-5.6 Sol |
| F10 | P0 | Portfolio discovery contracts | Home, work/author search, минимальные filters/sort, pagination и public-only projections без commerce fields | GPT-5.6 Sol contract; Grok 4.6 High implementation |
| F11 | P0 | Legal portfolio pack и controls | Адаптированные документы Беларуси, registration/cookie controls, author license, moderation/rightsholder contact; lawyer review complete | Founder + Belarus lawyer; implementation Grok 4.6 High |
| F12 | P0 | Read-only Figma cutover и mobile-first UI | Home, Works, Authors, Creator, Work, auth, author onboarding и creation flow; 390→1024→1440; commerce elements отсутствуют | Grok 4.6 High; visual/contract review GPT-5.6 Sol |
| F13 | P1 | QR/share и real-content readiness | Copy/share/QR профиля работают; только разрешённые реальные media/content; no dead controls | Grok 4.6 High |
| F14 | P1 | [Public-pilot operations](09-PUBLIC-PILOT-OPERATIONS-READINESS.md) | Deploy, TLS, email, migrations, observability, backup restore и rollback сверены без чтения secrets | Grok 4.6 High; review GPT-5.6 Sol |
| F15 | P0 | Final launch review | Repo-wide behavior/security/legal/design review и полная проверка release gates RFC §16 | GPT-5.6 Sol |

## Зависимости

1. `F01`, `F02`, `F04`–`F07` можно вести параллельно.
2. `F03` завершается до массовой загрузки реальных медиа и до финального UI proof.
3. `F08`–`F10` используют принятый `F02` contract.
4. `F11` использует фактический `F04` inventory.
5. `F12` начинается после server contracts `F01`, `F08`–`F10`; Figma не изменяется.
6. `F14` и `F15` закрывают публичный запуск после остальных задач.

## Definition of done первого backlog

- ни один public route/API/job не создаёт commerce state;
- visitor проходит публичный portfolio flow без аккаунта;
- author проходит application и Work moderation end-to-end;
- public/private projections и role changes fail-closed;
- legal pack описывает только фактический portfolio flow;
- изображения живут в утверждённом storage boundary и восстанавливаются из backup;
- UI соответствует read-only Figma и покрывает обязательные состояния;
- проверки и staging/restore/rollback evidence приложены.
