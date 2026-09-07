# bidplace — готовность первого portfolio MVP

Дата среза: 2026-09-08
Product contract: [`docs/product/05-MVP-RFC.md`](../product/05-MVP-RFC.md)
Active work: [`00-FIRST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md)
Deferred work: [`99-POST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md)

## Итог

Scope первого запуска теперь достаточно узкий и определён: публичное портфолио автора
без сделок. Продуктовые развилки commerce больше не блокируют запуск. Код пока не
соответствует новому scope: production UI и API содержат auction/order surfaces, новый
Figma ещё не реализован, portfolio creation/profile contracts требуют reconciliation,
а public legal/data/storage/operations gates не закрыты.

## Что уже закрыто и используется

| Область | Состояние |
|---|---|
| Product write atomicity | Реализован общий Product row-lock invariant для известных write paths; race coverage существует. |
| Auth/security baseline | Email/password, verification/recovery, fail-closed production config, upload authorization/limits и admin emergency paths существуют; остаточные проверки перечислены ниже. |
| Author/Work foundations | Seller application, Product draft/moderation, public discovery, creator profile, structured socials и creation story имеют текущую реализацию, которую можно адаптировать. |
| Public discovery | Home, Works, Authors, Search и server-side pagination/filtering существуют; commerce-specific projection надо убрать из First MVP. |
| Design | Новый creator-first Figma визуально согласован и остаётся read-only. Анализ экранов завершил portfolio cut list. Реализация не начата. |
| Research | Marketplace/abuse/legal UX и новое creator-commerce исследование сохранены для второй волны; они больше не блокируют First MVP. |
| Test data | Текущие business rows disposable и очищаются контролируемо перед public pilot (`DEC-081`). |

## Что блокирует публичный portfolio launch

1. **Commerce isolation:** server и client пока не имеют доказанного fail-closed режима
   для выключения auction/bid/order/handoff без удаления кода.
2. **Portfolio Work lifecycle:** нет утверждённой и реализованной revision-модели, при
   которой public Work можно обновлять через moderation без потери последней одобренной
   версии.
3. **Media:** требуется утверждённый object-storage/rendition/cleanup/backup boundary;
   portfolio зависит от изображений сильнее прежнего auction pilot.
4. **Author onboarding/profile:** надо сверить required/optional fields, public/private
   data, achievements и moderation с новым RFC и Figma.
5. **Work creation:** текущий sale-oriented flow надо свести к photos/title → details →
   optional text story → moderation.
6. **Public projections:** Home/catalog/profile/Work должны перестать требовать Listing,
   price, timer, sale status, bids или Order.
7. **Auth/legal UX:** оставить email/password path, убрать неподдержанные OAuth/magic
   code controls, определить фактические registration/cookie controls и документы.
8. **Security residuals:** role freshness, dependency evidence и legacy HTTPS preflight
   остаются незакрытыми.
9. **Operations:** staging email, TLS, migrations, object restore, rollback,
   observability и real-content checks не доказаны для public environment.
10. **Figma implementation:** mobile-first screens и required states ещё не перенесены
    в production.

## Что не блокирует First MVP

- offer expiry/revoke/counteroffer;
- non-payment, second chance и handoff statuses;
- seller sales history и auction scheduler starvation;
- auction/fixed/offer legal copy;
- orders, purchase/sales cabinet and critical commerce notifications;
- chat, reviews, ratings, likes, wishlist, notification center;
- photo/text process story, AI, subscription, payments, delivery, quantity and
  internationalization.

Всё перечисленное сохранено во втором backlog; ничего не объявлено отменённым.

## Рекомендуемый технический способ отключения commerce

Durable-вариант — server-authoritative capability, default `false`:

- client navigation/routes/actions не экспонируют commerce;
- API mutations и чувствительные reads проверяют capability;
- jobs/scheduler не создают commerce outcomes;
- public discovery исключает commerce-only поля и тестовые listings;
- commerce tests явно включают capability;
- существующие modules/migrations/tests остаются в Git.

Долгоживущая отдельная ветка хуже: она перестаёт получать общие auth/media/security
исправления. Новая feature branch нужна только на время будущей реализации commerce v2.

## Порядок закрытия

1. F01 commerce gate, F02 Work lifecycle, F04 data inventory и F05–F07 security можно
   выполнять параллельно.
2. F03 media boundary закрыть до real-content migration.
3. Реализовать author/profile, Work creation и public discovery contracts.
4. Адаптировать portfolio legal pack и получить Belarus lawyer review.
5. Оформить versioned read-only Figma handoff и выполнить mobile-first UI.
6. Провести security/design/operations review, staging smoke, restore и rollback.

## Проверка этого обновления

Это documentation-only scope change. Код, schema, Figma и `.pen` не менялись; tests не
запускались. Фактические code statuses не повышались.
