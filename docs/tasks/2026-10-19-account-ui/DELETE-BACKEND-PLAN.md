# 3D — backend/security-план: удаление собственной работы

Дата: 2026-10-19; уточнено по ревью DP-01 2026-10-20. Статус: **план на
review, без кодинга**. Уточнения DP-01: §2 (JSON вместо 204), §4 (tombstone
под тем же lock для каждого позднего writer, purge с retry), §5 (CDN purge
существует), §6 (гонки на двух соединениях, purge success/failure),
§7 (кэш-пункт переписан; противоречие reads/moderation снято).
Основание: [README](README.md) §«Отдельная задача удаления», HANDOFF
«Отдельный запрос для волны 3D». Решение основателя: автор может удалить
работу любого статуса; подтверждение в UI; технический tombstone; работа
исчезает из owner/public reads и по ссылке; hide/restore остаётся отдельным
обратимым действием. Без fake delete и без fake CTA в UI до рабочего API.

## 1. Что есть сейчас (подтверждено чтением кода)

- `Product` (schema.prisma:259) не имеет `deletedAt`. Статусы
  (`enum ProductStatus`, schema.prisma:40): DRAFT / PENDING_REVIEW /
  CHANGES_REQUESTED / APPROVED / REJECTED / ARCHIVED. `ARCHIVED` — это hide:
  `unhide` возвращает работу, поэтому ARCHIVED **не** tombstone.
- Пишущие пути уже используют нужный паттерн гонок:
  `runReadCommittedTransaction` + `lockProductRowForUpdate`
  (product-write-guard.ts:54, `SELECT … FOR UPDATE`). Те же приёмы у
  `update`/`submit`/`hide`/`unhide`/`replaceCreationStory`
  (products.service.ts:239, 399, 605, 703) и media-lifecycle (строка 942).
- Ownership-проверка в write-путях: `product.sellerProfile.userId !== userId`
  → Forbidden; несуществующий → NotFound (setAuthorVisibility, строки 608–614).
  Для delete копируем этот контракт.
- Listing lock: hide запрещён при live/scheduled listing (строка 629) —
  удаление не должно быть обходом commerce locks.
- Публичные reads централизованы в `apps/api/src/products/public-visibility.ts`:
  `portfolioCatalogProductWhere`, `portfolioDirectProductWhere`,
  `portfolioProductContentWhere` / `portfolioProductContentSql`
  (фильтр `status: 'APPROVED'` + активный продавец). Потребители:
  - products.service.ts (getPublishedStory 754/767, catalog 802/846),
  - sellers.service.ts (products counts 949, city where 944/1002),
  - products-catalog.query.ts (SQL `FROM "products" p`, строка 100),
  - admin-moderation-list.ts:211, admin-analytics.query.ts:5,
  - portfolio.service.ts (cabinet raw SQL `FROM products` строка 295,
    home curator selection строки 124–135/194/222),
  - media-lifecycle.service.ts (публикация/отзыв медиа).
- Медиа: `ProductImage.data Bytes` в БД + опциональный `objectKey`
  (schema.prisma:340, onDelete Cascade); публикация/отзыв — через
  media-lifecycle `enqueuePublication`/`enqueueRevoke` (последний уже
  вызывается при ARCHIVED, products.service.ts:633).
- CuratorSelection ссылается на product (`curatorSelection` relation,
  schema.prisma:293) — home показывает selection по `slot` без проверки
  удаления; при delete selection надо снимать в той же транзакции.
- HTTP-кэш: `Cache-Control` на публичных portfolio-ответах
  (portfolio.controller.ts:104/162); публичные media URL стабильны.
- Suspended: write-пути требуют `assertApprovedSeller` (setAuthorVisibility);
  читающий кабинет доступен при APPROVED и SUSPENDED
  (portfolio.service.ts:278).

## 2. DELETE contract

- `DELETE /api/products/:id` — session owner-auth (тот же guard, что у
  остальных products routes).
- Успех → **`200` с телом `{ "ok": true }`** (DP-01): `requestJson`
  (packages/api-client/src/request.ts) требует `content-type:
  application/json` и парсит тело — `204 No Content` сломал бы существующий
  клиентский pipeline. Схема ответа строгая (`z.object({ ok: z.literal(true) })`)
  через тот же requestJson; новый response-формат не вводим.
- Повторный DELETE владельцем по той же работе → **тот же `{ok:true}`
  (идемпотентно)**; работа помечена `deletedAt`, не перезаписываем timestamp.
- Чужой id или несуществующий id → единый `404` (не раскрываем существование
  чужой работы), как принято в текущих owner-путях (Forbidden там, где
  владение уже подтверждено контрактом; для delete оставляем uniform 404 —
  согласовать на review).
- Статус работы (DRAFT…APPROVED/ARCHIVED) на удаление не ограничивает —
  решение основателя «любого статуса».
- Никаких токенов/публичных id в path кроме server id; клиентскому статусу
  не доверяем — владение проверяется по строке в БД.

## 3. Tombstone и миграция

- `Product.deletedAt DateTime?` + миграция. Индекс `@@index([sellerProfileId,
  status])` сохранить; при необходимости добавить частичный индекс
  `(sellerProfileId) WHERE deleted_at IS NULL` — только после замеров.
- Все читающие запросы получают `deletedAt: null` (Prisma) / `AND p.deleted_at
  IS NULL` (raw SQL). Точки — перечислены в §1; центральное место —
  `public-visibility.ts` (добавить один раз, потребители получат через
  spread), отдельно правятся raw-SQL места (products-catalog.query.ts,
  portfolio.service.ts:295 cabinet, moderation/analytics).
- FK `Listing`/`ProductImage`/`ProductRevision` не трогаем: строка продукта
  остаётся, каскадов нет. Revisions и изображения сохраняются (восстановление
  из tombstone в MVP не обещаем, но и не уничтожаем данные).
- `ARCHIVED` не переиспользуем и не перекрашиваем в deleted.

## 4. Guards, гонки, suspended

- Транзакция: `runReadCommittedTransaction` + `lockProductRowForUpdate` —
  тот же шаблон, что у hide/submit. Delete ждёт конца чужой транзакции.
- **Tombstone-проверка под тем же lock у каждого позднего writer**
  (DP-01): не только delete ждёт чужую транзакцию, но и каждый writer,
  пришедший после commit с `deletedAt`, обязан получить 404/409, а не
  воскресить работу. Проверки добавляются сразу под существующим
  `lockProductRowForUpdate`:
  - owner `submit` (products.service.ts:606), `update` (399),
    `hide`/`unhide` (704), `replaceCreationStory` — предикат
    `deletedAt: null` в загрузке строки; нарушение → NotFound;
  - media/creation writers (images.controller POST/DELETE story-images,
    images, creation-steps image) — тот же предикат через общий guard;
  - **admin `updateProductStatus`** (admin-moderation.service.ts:491 уже
    берёт `lockProductRowForUpdate`) — добавить tombstone-проверку под ним,
    чтобы поздний approve удалённой работы не публиковал её заново.
  Проверка lock'ом у moderation подтверждена чтением кода (DP-01).
- **Listing**: при `listings.length > 0` (scheduled/live) → `409 Conflict`,
  тот же контракт, что у hide («Work cannot be hidden while a scheduled or
  live listing exists»). Удаление не отменяет активные торги.
- **CuratorSelection**: в той же транзакции удалить selection работы
  (`slot: HOME_CURATOR_SLOT`), иначе home рисует мёртвую ссылку.
- **Media**: если `media.enabled` — `enqueueRevoke(tx, { productId })`,
  как при ARCHIVED. Физические `ProductImage.data` не удалять в MVP.
  **CDN purge существует** (DP-01): revoke-путь в media-lifecycle
  (`apps/api/src/core/media/media-lifecycle.service.ts`, ~строка 1086)
  уже вызывает `PublicMediaCache.purge([publicUrl])`
  (`CloudflarePublicMediaCache`, public-media-cache.ts — бросает при
  незасконфигурированном zone/failed purge). План: purge остаётся частью
  revoke-операции с фиксацией success/failure в тестах (§6); отдельный
  purge-механизм не вводим. Ограничение: `purge` не освобождает asset,
  у которого остались другие публичные ссылки, — для таких URL purge
  no-op, поведение фиксируем тестом, а не обещаем полный отзыв.
- **Suspended policy** (явное решение, рекомендация): удаление **запрещено**
  при `SUSPENDED` seller — `403`, консистентно с остальными write-guards;
  это не произвольный обход lifecycle locks. Альтернатива (разрешить как
  исключение) требует отдельного обоснования на review.

## 5. Что НЕ входит

- Нет cascading hard delete медиа/revisions/listings; платёжные/auction
  таблицы не трогаем.
- Нет restore/undo в MVP (tombstone остаётся в БД; owner-undo отсутствует
  сознательно — откат только через отдельное product-решение, не через
  восстановление удалённого).
- **Полный отзыв уже отданных публичных изображений не обещается**
  (переписано DP-01): CDN purge в revoke-пути существует и применяется,
  но (а) URL с другими живыми публичными ссылками не инвалидируются,
  (б) браузерный кэш/CDN edge могли уже получить объект по стабильному URL.
  UI-копия удаления честно говорит «работа исчезнет из профиля и по
  ссылке», без обещания мгновенного исчезновения каждого закэшированного
  байта; точный TTL фиксируется в acceptance (§7).
- ARCHIVED (hide/restore) остаётся отдельным действием, delete CTA не
  подменяет его.

## 6. Тесты (минимальный набор)

Owner/unit (products.service.spec + product-requirements):
- удаление в каждом статусе (DRAFT…ARCHIVED) → 204, `deletedAt` выставлен;
- повторный DELETE → 204 без смены timestamp;
- чужой id → 404; несуществующий → 404;
- suspended seller → 403;
- listing scheduled/live → 409;
- гонка: delete vs submit/approve (два клиента, lock) — после delete
  submit/approve получают 404/409, работа не воскресает. Гоночные тесты
  исполняются на **двух отдельных DB-соединениях** (две транзакции
  одновременно, DP-01), а не последовательными вызовами в одной сессии;
  покрываются пары delete↔submit, delete↔update, delete↔hide/unhide,
  delete↔admin approve;
- revoke/purge: success-путь инвалидирует публичный URL;
  purge-failure (Cloudflare не сконфигурирован / API вернул ошибку)
  не откатывает tombstone — revoke-операция фиксирует failure в своём
  контуре (существующее поведение media-lifecycle), delete остаётся
  зафиксированным, поведение покрыто тестом.

Integration (reads):
- public catalog / author works / direct `/works/<publicId>` / story /
  home (включая curator selection) не видят удалённую работу;
- cabinet owner не видит удалённую работу; счётчики продавца
  (sellers.service products where) уменьшились;
- картинки по прямой ссылке: маршруты `GET images/:id`,
  `GET products/:id/story-images/:assetId`,
  `GET creation-steps/:stepId/image` (images.controller.ts) обходят
  публичный visibility-слой — для них tombstone-предикат добавляется
  явно (DP-01). Обычный owner-read удалённой работы закрыт `deletedAt`
  в том же предикате; **owner/admin bypass не вводится** — после delete
  работа недоступна по любому из этих GET ни владельцу, ни админу
  (admin видит запись только в audit/moderation-истории, см. §7);
- точная invalidation: owner queries (cabinet) и публичные
  (`public-author`, `portfolio-*`) инвалидируются на клиенте после
  delete; на сервере edge-policy = удаление из кэшируемых публичных
  выдач через центральный where (§3) — отдельный edge-purge механизм
  не вводится (Cache-Control TTL, §7).

## 7. Очередь и риски

1. Миграция `deletedAt` (обратимо, без дефолтных значений кроме NULL).
2. DELETE endpoint + guards/транзакция (этот план).
3. Reads-предикаты (центрально + raw SQL точки).
4. UI-волна: подтверждение, исчезновение из кабинета, disabled при listing/
   suspended — **только после рабочего API** (интейк запрещает fake CTA).
5. Кэш: TTL публичных `Cache-Control` ответов может показывать удалённую
   работу до истечения — зафиксировать реальный TTL в acceptance. Уточнение
   DP-01: `portfolio.controller.ts:104/162` — это `Cache-Control` отдачи
   **изображений** заявки/достижения, а не JSON-политика публичных
   выдач; TTL JSON-ответов каталога/автора фиксируется отдельным замером
   в acceptance. Медиа: CDN purge revoke-пути применяется, но не
   гарантирует отзыв уже закэшированных байт и URL с другими живыми
   ссылками (§4/§5).

Открытые вопросы на review: ~~uniform 404 для чужого id~~ (DP-01: принят
uniform 404, §2), ~~suspended policy~~ (DP-01: принят `403`, §4),
видимость удалённых работ в admin moderation/analytics — **решение
DP-01**: удалённые работы **исключаются из активной очереди** модерации
(moderation actions недоступны), но **остаются в audit-истории** с
пометкой «удалена»; analytics считает удалённые отдельной строкой, а не
включает в активные метрики. Противоречие первой редакции («все reads
фильтровать» и одновременно «показывать в moderation») снято: активные
очереди и действия фильтруются, история — нет.
