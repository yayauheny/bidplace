# R2/CDN: второй проход и минимальный portfolio MVP

Дата: 2026-10-04. Статус: **implementation plan; не выполненный переезд**.
Основание: [первый аудит](2026-10-04-R2-MEDIA-ARCHITECTURE-AUDIT.md),
ответы основателя Q01–Q10 и финальный portfolio-only release scope.
Этот проход использует repository evidence и полученные ответы; новых
архитектурных исследований не проводилось.

## Принятые решения

| ID  | Зафиксированное решение                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q01 | Hide/suspend/delete убирают публичные derivatives и запускают CDN purge; цель ≤5 минут. Это заменяет прежнюю отсрочку. Скачанные копии не отзываются |
| Q02 | Eventual publication допустима: старый published snapshot остаётся до полной готовности нового; admin видит ожидание доставки медиа                  |
| Q03 | Принятый SOURCE сохраняется byte-identical приватно, включая EXIF/ICC/GPS; публичные derivatives очищаются от private metadata                       |
| Q04 | JPEG/PNG/WebP на старте; HEIC после MVP                                                                                                              |
| Q05 | 20 MiB/~50 MP — будущая target capability после bounded processing и benchmarks, а не повышение констант перед запуском                              |
| Q06 | SOURCE — application asset; без обещания архива оригиналов. RPO ~24h / RTO ~1 день — внутренняя стартовая цель, проверяемая restore drill            |
| Q07 | Без тарифов, 90-day retention и автоматического удаления SOURCE по гипотезам монетизации                                                             |
| Q08 | FULL только для Work viewer, загрузка при открытии; avatar/achievement не получают FULL автоматически                                                |
| Q09 | Короткая остановка media writes/moderation при миграции допустима; public reads желательно сохранить; без dual write                                 |
| Q10 | Два buckets, portable S3 boundary, собственный media domain; без Worker/Cloudflare Images/transform URLs                                             |

Также подтверждены: domain `bid.place`; Neon для PostgreSQL; контейнерный
deploy frontend/backend, площадка пока не выбрана (Render — кандидат).
Production содержит обозначенный demo catalog без тестовых логинов.
Google после запуска. Собственный SMTP/Postfix исключён; при необходимости
внешний SMTP через уже установленный Nodemailer. В текущем auth flow email
нужен для verification и reset, поэтому SMTP относится к production smoke.
Rules/Privacy ещё не подготовлены; это не останавливает техническую реализацию.

## Минимум первого релиза

Обязательны existing auth, author profile, portfolio editing/upload/moderation,
published pages, R2 и прямые CDN URLs. Marketplace, продажи, ставки, платежи,
checkout, тарифы и commerce workflows не входят. Существующий admin используется
для moderation и ошибок доставки; новый административный продукт не строится.

Не добавлять отдельный media service, Redis, Kafka, queue service, worker process,
Cloudflare Worker, Image transformations, arbitrary resize или Kubernetes.
**Подтверждено:** журнал операций в Neon и retry внутри существующего NestJS.
Отдельный executor process или queue service не добавляется. NestJS возобновляет
незавершённые операции после старта и с ограниченным интервалом; короткая DB lease
защищает от повторного исполнения, попытки имеют `nextAttemptAt` и backoff.
R2/Cloudflare calls выполняются вне Prisma transaction. Истёкшая lease позволяет
восстановление после остановки процесса. Это план реализации, не готовый retry.

Текущие upload caps сохраняются: 5 MiB/file, 4096px/16_777_216 pixels,
10 images/Work и 20 MiB суммарного source budget. Для legacy source бюджет
считается по фактически сохранившимся normalized bytes. Новые размеры не
разрешать до resource acceptance. Одновременные admissions и Sharp processing
должны быть ограничены; overload возвращает явную ошибку, без очереди в памяти.

## Schema: additive, без удаления существующих таблиц

Ниже exact proposed implementation schema. Это инженерный план, а не утверждение,
что модели уже существуют. Названия migrations новые; существующие migrations
не редактировать.

| Модель                 | Поля и ограничения                                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MediaAsset`           | UUID `id`; `ownerUserId` FK; `purpose` WORK_IMAGE/AUTHOR_PHOTO/ACHIEVEMENT/LEGACY_CREATION_STEP; `sourceProvenance` ORIGINAL/LEGACY_NORMALIZED; `state` STAGING/READY/FAILED; timestamps. SOURCE identity не меняется после READY                                                                                                                               |
| `MediaObject`          | UUID; `assetId` FK; `variant` SOURCE/PREVIEW/FULL; `tier` PRIVATE/PUBLIC; `pipelineVersion` nullable только SOURCE; exact `objectKey`; mimeType, byteLength, sha256, width/height; state PLANNED/READY/DELETE_PENDING/DELETED; timestamps. Unique `(tier, objectKey)` и `(assetId, variant, tier, pipelineVersion)`; SOURCE только PRIVATE                      |
| `MediaOperation`       | UUID; `kind` UPLOAD/PUBLISH/REVOKE/CLEANUP; state PENDING/RUNNING/FAILED/DONE/CANCELLED; owner/idempotency identity; optional exact author/work revision FK; expected revision version/updatedAt и previous published pointer; `attemptCount`, `nextAttemptAt`, `leaseUntil`, error code и timestamps. Повтор одной операции не создаёт другой asset/generation |
| `MediaOperationObject` | operation FK + exact tier/key + expected checksum/type/length + state. Durable manifest планируемых writes/deletes. Не удаляется cascade вместе с domain reference; cleanup обязан пережить удаление исходной domain row                                                                                                                                        |

В `ProductImage` добавить `mediaAssetId`; в `SellerProfileRevision` —
`profilePhotoAssetId`; в `SellerProfileRevisionAchievement` и legacy creation
step — `mediaAssetId`. Gallery order остаётся в `ProductRevisionImage`.
Публичный автор читает asset из published revision; editing revision получает
собственный reference и при замене фото новый asset. Fork может повторно
ссылаться на тот же immutable asset; нельзя удалить его по одному draft reference.

Publication intent принадлежит `MediaOperation` и конкретной существующей
revision. Не вводить отдельную очередь или дублирующую business-state модель.
До delivery READY не переключать `publishedRevisionId`, published mirror fields
или public gallery. Первый автор/Work остаётся непубличным до READY.

В целевых новых записях Neon хранит metadata/references/state, а не source bytes.
Существующие Bytes-колонки остаются только до отдельной legacy-removal фазы;
legacy source/backup не уничтожается при первом cutover. Удаление колонок не
является blocker первого релиза.

## Object-store boundary и ключи

Private bucket: SOURCE и private derivatives. Public bucket: только derivatives
по явно одобренному publication intent. Названия `bidplace-media-private` и
`bidplace-media-public` — рекомендованные deployment names, buckets не созданы.
`media.bid.place` подключается только ко второму.

```text
PRIVATE assets/{assetId}/source.{detectedExtension}
PRIVATE assets/{assetId}/p1/preview.webp
PRIVATE assets/{assetId}/p1/full.webp       # Work only
PUBLIC  assets/{assetId}/p1/preview.webp
PUBLIC  assets/{assetId}/p1/full.webp       # Work only
```

Source replacement создаёт новый asset UUID; смена pipeline создаёт `p2`.
READY key не перезаписывается другими bytes. Файл имеет собственный SHA-256;
source checksum не используется как preview checksum. Retry проверяет существующий
объект: совпадает → reuse, не совпадает → ошибка. ETag не заменяет SHA-256.
Keys не содержат filename, email, slug или имя пользователя.

Расширить существующую S3 abstraction typed tier и metadata:
`put(tier, key, bytes, metadata)`, `get(tier, key)`, `head(tier, key)`,
`delete(tier, key)`. Один AWS SDK client, два deployment buckets; без нового SDK.
Cloudflare-specific purge — отдельная маленькая boundary `PublicMediaCache`,
не часть domain model или generic S3 adapter. Typed errors наружу, без silent fallback.
У S3 методов нет параметра Prisma transaction. Legacy PostgreSQL adapter временно
остаётся явно отдельным migration path.

## Source и pipeline p1

Admission проверяет auth, verified email, ownership/editable state, rate/count/
byte limits до дорогого decode; service повторяет write guards перед attach.
Signature совпадает с MIME; corrupted, animated, неподдерживаемый файл отвергается.
Raw accepted bytes не заменяются output от Sharp.

Стартовые p1 settings из аудита: Work preview ≤1600, Work full ≤3840,
author photo ≤800, achievement ≤1600; WebP quality candidates 82/90.
Это кандидаты для corpus acceptance, а не hard byte-size или публичные quality
обещания. Fit inside, no upscale, no server crop. Orientation применяется к
derivative; colour переводится в sRGB; private EXIF/GPS/XMP/IPTC/thumbnail не
переносятся. SOURCE хранит исходный профиль/метаданные.

Минимальная трактовка Q08: FULL для Work готовится вместе с p1, но клиент
запрашивает его bytes только при открытии viewer. Это не lazy server generation:
нового публичного processing endpoint и очереди не требуется. Avatar/achievement
получают один PREVIEW. Если основатель имел в виду отложенную генерацию FULL,
это отдельное уточнение перед фазой 3, без молчаливой смены трактовки.

## Последовательности операций

1. **Upload:** зафиксировать operation и planned exact keys → private SOURCE PUT
   - GET verification → derivatives + verification → короткая DB tx attach/READY.
     При rollback файлы остаются учтены durable manifest. После crash можно
     продолжить только если SOURCE уже существует; отсутствующие bytes требуют
     повторной отправки клиента, а не выдуманного background retry.
2. **Publish:** сохранить явно approved intent к exact revision → подготовить
   public derivatives + verify → одной DB tx перепроверить target/previous pointer
   и переключить published snapshot. Старый snapshot целиком остаётся до commit.
   Обычные draft uploads никогда не копируются в public bucket. Во время approved
   preparation public copy может существовать до DB switch: это принятая Q02
   eventual publication, а не strict per-request authorization.
3. **Cancel/race:** reject/hide/replace отменяет stale intent. Перед attach/switch
   compare revision token; не публиковать более поздний или отменённый draft.
   Planned public keys отменённой операции должны попасть в cleanup. Тестировать
   late PUT после cancellation; одного DELETE до окончания PUT недостаточно.
4. **Hide/suspend/delete:** DB сначала убирает публичность и фиксирует точные keys
   revoke intent → после commit DELETE public copies + purge exact URLs.
   Повтор безопасен при отсутствующем объекте. Новый pending draft не отзывает
   старый published snapshot. Suspension автора учитывает его публичные Work,
   фото и achievements, включая ранее выданные generations; paging вместо
   загрузки всех media bytes.
5. **Delete reference:** короткая DB tx detach + durable cleanup manifest →
   внешние deletes после commit. Проверить оставшиеся draft/published references.
   Не удалять SOURCE по тарифам/срокам. Retention SOURCE после удаления domain
   content остаётся отдельной policy-задачей; failed staging cleanup не равен
   тарифному retention.

Goal Q01 — ≤5 минут, не гарантия при outage Cloudflare/R2. Failed revoke остаётся
видимым admin/ops как FAILED/PENDING, а не DONE. Не рассчитывать, что private/public
prefix, immutable key или удаление страницы сами очищают CDN.

## API и клиент

- Сохранить existing multipart mutation routes и успешный `{ ok: true }` upload
  contract. Добавить idempotency identity для безопасного повтора; не создавать
  presigned/browser-direct upload API. Ошибка object store не выдаётся как успех.
- Existing moderation status endpoint возвращает delivery state/id при ожидании;
  добавить typed `publication` к owner/admin responses. Pending target заморожен;
  повтор approve/retry работает с тем же operation и exact revision token.
- Public DTO содержит только READY published assets: `url` = HTTPS PREVIEW URL,
  Work image дополнительно `full` с HTTPS URL/metadata. Private SOURCE key/URL,
  EXIF/GPS, owner auth email и delivery errors не выходят в public response.
- Update `packages/contracts`: HTTPS media paths вместо relative-only regex;
  `api-client` проверяет расширенный контракт. Public media URL создаёт только
  server helper из approved base + exact key, не из user input. Existing private
  owner/admin image routes выдают derivative с auth и `private, no-store`.
- Existing `getApiAssetUrl` уже умеет absolute URLs. Gallery/avatar/achievement
  потребители используют PREVIEW. FULL request включается только на viewer open;
  честные loading/error/retry, без SOURCE fallback. Layout/tokens не переделывать.
- Public cache policy: versioned URLs; browser revalidation и отдельный edge TTL,
  чтобы CDN cache и browser cache не смешивались. Конкретные headers/cache rule
  проходят acceptance на настоящем custom domain вместе с Q01 purge.

Основные affected файлы: `core/image-store/*`, `images/*`, `sellers/*`,
`portfolio/*`, `admin/admin-moderation.service.ts`, `products/products.mapper.ts`,
Prisma schema/new migrations, `packages/contracts`/`api-client`, shared media
consumers в mobile. Все пять legacy владельцев остаются в inventory.

## Фазы 1–7 и gates

| Фаза                    | Exact scope                                                                                                                                       | Проверка / граница                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 Transport/model       | Tiered S3 adapter, два bucket settings, MediaAsset/Object/Operation/manifest additive schema, reusable URL helper                                 | Environment fails closed; private SOURCE нельзя выбрать public tier; SDK command tests; real Prisma constraints. Legacy reads сохранены                                                          |
| 2 Durability            | Operation recording, private PUT outside DB tx, attach/retry/cancel/cleanup, bounded admission/processing                                         | PUT success + DB rollback; process restart; repeat idempotency; failed DELETE; upload/remove races; no external delete before commit. Lease/claim и повтор внутри NestJS, без отдельного сервиса |
| 3 Pipeline              | Exact SOURCE + p1 variants, provenance, no upscale, colour/orientation/metadata cleanup                                                           | SHA source до/после одинаков; corpus JPEG/PNG/WebP + alpha/ICC/orientation/GPS; bad/animated/HEIC rejection; container memory/concurrency benchmark. Caps не повышаются                          |
| 4 Publish/revoke        | Approved intent, public copy/verify, atomic pointer switch, failure state, hide/suspend cleanup+purge                                             | Old snapshot при error; first publication private до READY; draft never public; cancellation late PUT; shared refs; live cached URL stops after revoke target                                    |
| 5 Migration/demo        | Пяти-owner manifest/import, LEGACY_NORMALIZED, freeze writes/moderation, repeatable reconciliation; labelled demo without known-password accounts | Source backup + GET checksums; no new bytes в Neon; rerun без duplication; DB+object restore. Existing destructive demo seed production guard не ослаблять                                       |
| 6 Client/deploy cutover | Shared contracts, HTTPS CDN URLs, lazy Work FULL, deployment configuration, actual provider smoke                                                 | API/mobile lint/typecheck/unit/build, HTTP/PG matrix, maintained browser gate; production auth/SMTP/TLS/R2/cache reads; bounded tests 390/1024/1440 по затронутому flow                          |
| 7 Legacy removal        | Bytes columns и PostgresImageStore removal отдельным release                                                                                      | **После MVP:** observation + restore + rollback новых R2 uploads; destructive cleanup не условие первого запуска                                                                                 |

Фазы — review units, а не семь отдельных сервисов. Expansion contracts можно
сделать до final cutover. Промежуточный private R2 через API не считается готовым
релизом: для первого публичного включения mandatory direct CDN должен работать.

## Deployment acceptance

Provider не выбран, Render не считать утверждённым. API Docker image + exported
Expo web assets должны запускаться с внешней Neon DB. VPS/контейнерный runtime
не должен поднимать local Postgres в production. TLS, exact frontend origin,
secure session cookie, reset URL, health/readiness и production env обязательны.
Migration CLI запускается с операторской конфигурацией, без чтения/вывода secrets.

R2 private без public domain/r2.dev. Public подключён к `media.bid.place`;
Cloudflare zone/custom domain ещё требуют подтверждения. Minimal внешняя почта
через existing Nodemailer; production test bypass и local mail transport не
включать. Google, собственная почтовая инфраструктура и новые SaaS, кроме
подтверждённых Neon/R2/CDN и необходимого SMTP, не добавляются.

Оператор фиксирует target/source, pre-deploy backup, SHA/image tag; provider
preflight → backfill/import → verify → cutover → browser/SMTP/CDN smoke.
Public reads желательно оставить во время write freeze. Restore drill проверяет
DB + private SOURCE/object manifest; DB dump один не восстанавливает медиа.

## Post-MVP и оставшиеся вопросы

Отложено: 20 MiB/~50 MP, HEIC/codec support, arbitrary transforms, deep zoom,
presigned direct upload, global dedup, тарифы/90-day retention, original-download
UX, microservices/queues, independent worker deployment, phase 7 destructive
cleanup, Google OAuth. Отдельный FULL-generation-on-demand не вводится молча.

Осталось решить/предоставить только:

1. Подтвердить lazy **load** FULL, если подразумевалась lazy **generation**.
2. Площадка и готовая deployment configuration; реальные buckets/custom domain,
   минимальный внешний SMTP и фактические provider settings. Credentials в чат не нужны.
3. Минимальные portfolio-only Rules/Privacy и publication controls; текущий
   [legal manifest](../legal/09-PORTFOLIO-LEGAL-REVIEW-MANIFEST.md) ещё pending.

Цель второго прохода — конкретный минимальный scope. Он не даёт основания
называть R2/CDN `Implemented` до выполнения фаз и live acceptance.
