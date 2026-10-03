# bidplace — аудит media storage, Cloudflare R2 и CDN

Дата: **2026-10-04**, Europe/Minsk. Первый проход: исследование, без реализации.
База исследования: `355a44cff216caed7211661ad6b4e7b7a1f9b73a`, исходная ветка
`fix/form-field-ownership`. Ветка документа: `feature/r2-media-audit`.

## 1. Вывод, границы и источник требований

**Проект частично готов к R2 как хранилищу, но не готов к безопасной прямой
раздаче публичных изображений через CDN.** Существующие `ImageStore`,
`S3ImageStore`, AWS SDK, checksum и серверную проверку изображений стоит сохранить.
Простого изменения endpoint/bucket недостаточно: остаются публикация ревизий,
атомарность внешних операций, изменяемые ключи, миграция пяти видов media,
контракты URL и ограничение памяти uploads.

Зафиксировано пользователем в этом запросе: **Cloudflare R2 + Cloudflare CDN**.
S3-совместимость, собственный media-домен и переносимые ключи сохраняют возможность
выйти из провайдера. Остальные решения ниже — рекомендации первого прохода;
открытые вопросы собраны в §18. Молчание не превращает их в утверждённый
продуктовый контракт: пользователь запланировал второй проход после ответов.

Прочитаны приложенный research brief (§1–29), корневые инструкции и владельцы:

- [продуктовая основа](../product/01-PRODUCT-FOUNDATION.md): ценность, авторство,
  качество представления предмета, отсутствие инфраструктуры без реального запроса;
- [MVP RFC](../product/05-MVP-RFC.md): текущий MVP — публичное портфолио автора и
  работ, модерация, published/editing revisions, скрытие; продажи, тарифы и
  оплата не входят в запуск;
- [архитектура](../product/10-CODE-ARCHITECTURE.md),
  [статус](../product/11-PROJECT-STATUS.md),
  [application security](../product/13-APPLICATION-SECURITY.md),
  [release/backup](../ops/00-RELEASE-AND-BACKUP.md).

Поэтому примеры ТЗ «после продажи 90 дней», Free/Paid и 5/10 фото — гипотезы для
будущей волны, а не требования текущего портфолио. `Product` в Prisma соответствует
Work в продукте. Legacy `ProductCreationStep` нужно сохранить при переносе данных,
но не превращать в публичную историю работы: RFC использует `story` и основные
фотографии. Это принципиальная граница scope.

Критерии готовности аудита: карта upload/read/delete, доказанные пробелы, сравнение
вариантов, предложения по всем темам ТЗ, проверяемый поэтапный план и единый пакет
решений для второго прохода. Изменён только этот документ. Код, schema, зависимости,
Cloudflare, канонические product/design документы и `.pen` не менялись.

Аудит не подтверждает состояние конкретной production DB или аккаунта Cloudflare.
Не известны количество/объём объектов, фактический provider, bucket names, зона,
custom domain, тариф и настройки кеша. Содержимое файлов с секретами не приводится.
Значения credentials для аудита не нужны.

## 2. Фактическая карта текущей системы

### 2.1. Upload → storage → display

```text
Expo/Web ImagePicker (quality: 1) → multipart
  → Bearer/cookie auth + VerifiedEmailGuard
  → Multer: buffers всех файлов в памяти
  → Work: owner/status/capacity до Sharp
  → Sharp: signature/MIME, static-only, размеры, rotate, JPEG/PNG re-encode
  → PostgreSQL TX + row lock + повторная проверка
  → metadata row + ImageStore.put внутри TX
       ├ postgres: Bytes update через тот же tx
       └ s3: внешний PUT; PostgreSQL rollback на него не действует

Public/owner/admin JSON → /api/... media URL
  → Nest metadata + visibility/authorization
  → ImageStore.get (PostgreSQL либо S3 GET полного объекта)
  → Uint8Array → Buffer → Nest HTTP response
  → getApiAssetUrl → ResilientRemoteImage / галерея / фото автора
```

`ImageStoreModule` выбирает provider через `MEDIA_STORAGE_PROVIDER=postgres|s3`;
локальный default — postgres. Production security profile требует s3 и полную
S3-конфигурацию (`core/config/env.ts:72,170,186`). По коду нельзя установить, какой
provider реально используется в deployed окружении.

`ImageStore` имеет `put/get/delete` и опциональный Prisma client у записей; нет
`head`, выбора private/public namespace и параметра `Cache-Control`.
`S3ImageStore` использует `endpoint`, `region`, один bucket, `forcePathStyle`,
`ContentType`; `get` буферизует весь объект. Три SDK unit-теста мокают `send`;
это не доказательство работы R2. В runtime нет `LIST` для галерей — это уже
правильная граница DB/storage.

### 2.2. Полная инвентаризация media

| Данные                             | Bytes в Prisma                  | Текущий object key                                                        | Чтение                                                              |
| ---------------------------------- | ------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `ProductImage`                     | обязательный `data`             | `product-image:{imageId}`                                                 | `GET /api/images/:id`                                               |
| `ProductCreationStep`              | nullable `data`                 | `creation-step:{stepId}`                                                  | `GET /api/creation-steps/:stepId/image`                             |
| `SellerProfile`                    | обязательный `profilePhotoData` | `seller-photo:{profileId}` либо key опубликованной ревизии                | `GET /api/sellers/:slug/photo`                                      |
| `SellerProfileRevision`            | nullable `profilePhotoData`     | `seller-profile-revision:{revisionId}` либо ссылка на существующий объект | owner `GET /api/author/application/photo`, admin revision-photo GET |
| `SellerProfileRevisionAchievement` | nullable `data`                 | `seller-achievement:{achievementId}`; копии ревизий могут разделять key   | `GET /api/author-achievements/:id/image`                            |

Доказательства: `packages/database/prisma/schema.prisma:132–216,303–351`,
`core/image-store/image-key.ts`, `PostgresImageStore`, `SellersService`,
`ensure-editable-seller-profile-revision.ts`. В S3-режиме некоторые пути пишут
пустой byte array вместо обязательного `Bytes`; колонки всё ещё существуют.
Это не означает, что DB больше не содержит исторических изображений.

Product metadata содержит key, MIME, byteLength, SHA-256, nullable width/height.
У фото автора/достижений есть key, MIME, length/checksum, но нет полноценной общей
модели variants и размеров. `position` и `ProductRevisionImage` принадлежат
галерее/ревизии, а не object storage.

### 2.3. Visibility и private reads

- Work image публичен только при approved Work + approved author и наличии
  изображения в **publishedRevision**. Другие изображения читает owner/admin.
- Achievement публичен только из published revision approved автора.
- Owner application photo и admin revision photo — private `no-store`.
- Parent author-photo URL отдаёт текущий опубликованный key; редактирование
  профиля отделено от опубликованной страницы.
- Creation-step GET имеет более старую проверку статусов без Work revision
  membership. Архитектурный документ называет process-media owner-only; код GET
  допускает anonymous read при approved product/author. Это существующее
  расхождение, которое нужно закрыть перед переносом таких объектов в public.

Источники: `ImagesService.get/getCreationStepImage`,
`SellersService.getPhoto/getEditingPhoto/getAchievementImage`,
`AdminModerationService.getSellerProfileRevisionPhoto`.

### 2.4. Ограничения и кеш сейчас

В `images/image-policy.ts`: 10 фото/Work, 5 MiB/file, 20 MiB агрегатных bytes,
4096 px на каждой стороне, 16 777 216 pixels; JPEG/PNG/static WebP. GIF,
SVG и анимация запрещены; signature должна соответствовать заявленному MIME.

JPEG и WebP всегда переводятся в JPEG; PNG — в PNG. `.rotate()` применяется до
выхода; source bytes не сохраняются отдельно. Политика capacity проверяет и
входные, и нормализованные bytes. Увеличивать upload cap отдельно от агрегатного
лимита нельзя: один 20 MiB source исчерпал бы весь текущий Work budget.

Public Product image получает `public, max-age=31536000, immutable`;
фото автора/process/achievement — revalidate; private — `private, no-store`.
S3 PUT пока **не записывает эти cache headers в объект**: заголовки добавляет Nest.
Передача напрямую через R2 не унаследует их из контроллера.

### 2.5. Migration/ops сейчас

`scripts/ops/backfill-media-to-s3.mjs` читает **все bytes трёх таблиц сразу**:
ProductImage, SellerProfile, ProductCreationStep. Проверяет локальный SHA-256,
пишет ключ из DB либо старый deterministic key. Не обрабатывает profile revisions
и achievements; не делает remote HEAD/GET verification, не обновляет migration
state/keys в DB, не освобождает bytes. Dry-run увеличивает счётчик `uploaded`,
хотя PUT не производится. Это scaffold, не завершённый migration protocol.

`ops:media-preflight` делает PUT → GET → SHA-256 → DELETE exact key. Есть пять
unit-тестов cleanup/error precedence. Нет HEAD, Content-Type/cache/CORS/CDN/private
проверок. MinIO упоминается в документации/fixtures, но это не факт пройденного
актуального object-store drill.

## 3. Готовность и обязательные пробелы

| Область                                 | Code status        | Вывод                                                                        |
| --------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| Существующая abstraction + S3 adapter   | Partial            | Повторно использовать; добавить tiers/metadata/HEAD, реальные protocol tests |
| DB как источник gallery/revision truth  | Implemented        | Нет runtime LIST; membership/ordering сохранить                              |
| R2-compatible базовые операции          | Needs verification | SDK/API соответствуют направлению; фактического R2 smoke нет                 |
| Direct public CDN reads                 | Not implemented    | Контракты и mapper выдают API URLs                                           |
| Private/public publication boundary     | Not implemented    | Сейчас границу обеспечивает Nest authorization                               |
| Source + derivatives + pipeline version | Not implemented    | Хранится один нормализованный файл                                           |
| Надёжность DB ↔ S3 upload/delete        | Partial            | Ошибка роняет TX, но внешние side effects не компенсируются надёжно          |
| Immutable keys для всех media           | Partial            | Work image ID новый; profile/step/revision keys перезаписываемые             |
| Bytes → R2 migration                    | Partial            | 3/5 таблиц, нет remote verification/manifest/resume                          |
| Decode/resource protection              | Partial            | Ограничения raster есть, общего concurrency/request-memory budget нет        |
| DB-driven retention/reconciliation      | Not implemented    | Нет надёжного tombstone/retry исполнителя                                    |
| R2/CDN/backup acceptance                | Needs verification | Не проверялись live provider, domain, restore или production данные          |

### Findings: приоритет относится к будущему production cutover

| ID  | Приоритет | Доказательство и сценарий                                                                                                                                                                                     | Требуемый durable fix                                                                                              |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| M01 | P0        | `images.service.ts:93` и `sellers.service.ts:232,348,399,527`: S3 PUT внутри DB TX. Успешный PUT + ошибка следующего файла/DB commit оставляет orphan. Transaction retry может повторить внешний side effect. | Выполнять storage IO вне коротких domain TX; сохранять operation identity/exact keys и состояние для cleanup/retry |
| M02 | P0        | `ImagesService.remove:161`: удаление S3 до DB commit. DELETE success + rollback оставляет DB reference без bytes.                                                                                             | В TX убрать references и записать durable deletion task; удалять после commit, идемпотентно                        |
| M03 | P0        | Public bucket/custom domain не знает published revision, owner/admin, approved author или suspension. Публикация всего текущего bucket раскрыла бы draft assets по прямому key.                               | Физически private staging/source; public только публикационные derivatives, явный publish/revoke workflow          |
| M04 | P0        | Backfill `:64–95` пропускает два типа media; provider switch глобален. S3 reads не имеют automatic DB fallback.                                                                                               | Инвентаризация всех пяти типов, shared-key references, bounded batches, manifest, remote checksum, cutover gate    |
| M05 | P1        | `image-key.ts`: mutable profile/revision/step objects. `ImagesService.get/getCreationStepImage` вычисляют old key, не читают persisted `objectKey`.                                                           | Чтение exact DB keys; новые UUID/version keys; immutable identity при replace                                      |
| M06 | P1        | Multer memory storage; до service count/20 MiB gate запрос может буферизовать до 10 × 5 MiB. Несколько requests декодируются одновременно.                                                                    | Ограничение multipart во время приёма + admission gate до buffering + bounded processing                           |
| M07 | P1        | `image-policy.ts:158–173`: source JPEG повторно сжат; WebP alpha теряется при JPEG output; нет originals/variants.                                                                                            | Приватный byte-identical source, encode derivatives напрямую; alpha сохранять                                      |
| M08 | P1        | `product.ts:26`, `portfolio.ts:17,63`, `seller-profile.ts:39`: строгие regex `/api/...`; абсолютный CDN URL не проходит.                                                                                      | Один контракт media rendition и централизованный URL builder, обновление validators/mappers/client consumers       |
| M09 | P1        | `SellersService.deleteAchievement:617–627`: после DB delete неуспешный storage delete только логируется. Shared keys существуют.                                                                              | Durable tombstone, retry, reference safety; logger не заменяет сохранённую задачу                                  |
| M10 | P1        | `S3ImageStore.put:44`: нет Cache-Control; old keys без расширения. Default Cloudflare cache нельзя считать настроенным.                                                                                       | Headers при PUT + hostname/path Cache Rule + HIT/conditional/CORS smoke                                            |
| M11 | P1        | `SellersController.create/update` и `PortfolioController.addAchievement`: Sharp в controller до проверки editable profile в service. Profile POST/PATCH не имеют upload RateLimit.                            | Общая authorization/admission boundary до expensive decode; отдельный лимит этих upload paths                      |
| M12 | P1        | DB backup не включает внешние bytes; существующие источники уже пережаты.                                                                                                                                     | Проверенный DB+objects restore; отметить legacy source provenance, не обещать восстановить original                |
| M13 | P2        | `media-transport.integration.spec.ts:73`: `new ImagesService(prisma as never)` без требуемого ImageStore. При прохождении capacity gate вызов развалится; текущий early-reject case это скрывает.             | Использовать реальный injected store/fake в актуальном HTTP/DB suite                                               |
| M14 | P2        | Architecture/security prose местами говорит «PostgresImageStore today»/«no object storage», рядом есть production s3 requirement.                                                                             | Во втором проходе обновить owners по текущей модели; исторический статус не выдавать за live evidence              |

Дополнительный текущий cache-риск: годовой public Product `immutable` уже позволяет
браузеру повторно показывать скачанный файл после hide/suspension без нового
запроса к Nest. Серверная authorization защищает свежие запросы, но не отзывает
клиентский cache. Поэтому Q01 нужен и для оценки существующего поведения, не
только для будущей R2-раздачи.

M06 — доказанный отсутствующий системный budget, **не утверждение о наблюдавшемся
OOM**. На один 48 MP RGBA raster приходится около 192 MB decimal без остальных
buffers; 16.8 MP — около 67 MB. Это оценка верхнего ресурса, не измерение peak RSS
libvips. Параметры concurrency требуют benchmark в production container.

## 4. Что Cloudflare действительно предоставляет

Custom domain подключается к bucket через R2 settings и созданную Cloudflare DNS
запись; зона должна быть в том же аккаунте. Это даёт Cloudflare cache/security
возможности; default cache зависит от file type. `r2.dev` отдельно включается,
rate-limited и не даёт этих возможностей; для production отключить его.
Все объекты публичного bucket доступны по известным путям — prefix не является
проверкой доступа. [Cloudflare: public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/).

Именно cache eligibility и заголовки нужно проверить, а не строить собственный CDN.
WebP с расширением является cacheable type; для scoped media hostname можно явно
задать Cache Rule. Не включать Cache Everything на API/auth/private пути.
[Default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/).

Bot Management не становится бесплатной полной подпиской от подключения домена:
enterprise Bot Management приобретается отдельно. Реальные WAF/bot функции и
лимиты правил зависят от zone plan; наличие функций в тексте ТЗ не подтверждает
конфигурацию данного аккаунта.
[Bot Management plans](https://developers.cloudflare.com/bots/plans/bm-subscription/).

R2 S3 endpoint использует account endpoint и region `auto`; базовые PUT/GET/HEAD/
DELETE, Content-Type/Cache-Control, conditional GET и Range покрываются API.
R2 не реализует всю AWS S3 поверхность: не основывать безопасность на object ACL,
AWS bucket policy или S3 versioning/replication. Точную совместимость SDK 3.1127.0,
включая автоматически добавляемые checksum headers, подтвердить smoke; не
отключать checksum machinery вслепую.
[S3 compatibility](https://developers.cloudflare.com/r2/api/s3/api/),
[AWS SDK v3 example](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/).

Super Slurper/Sippy подходят для существующего object-storage origin. Они не
мигрируют Prisma Bytes, revision links и новые derivatives. Для нынешнего DB
legacy нужен свой проверяемый backfill; для уже существующего S3 источника можно
оценить эти инструменты после фактической инвентаризации.
[R2 migration](https://developers.cloudflare.com/r2/data-migration/).

## 5. Сравнение архитектурных кандидатов

| Кандидат                                                                                            | Класс                                                 | Преимущества                                                                  | Ограничения / выход из provider                                                                             |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Расширить нынешний ImageStore, два buckets, DB metadata/state, fixed derivatives, direct public CDN | **Durable fix — рекомендован**                        | Явная safety boundary, переносимость, тестируемость; одна storage abstraction | Несколько schema/contract изменений, публикация/cleanup; переносится copy keys + config/CDN origin          |
| Сначала перевести существующий single private S3 adapter на R2, временно читать через Nest          | **Acceptable workaround только для phased migration** | Небольшой первый release, сохраняет authorization                             | Не достигает целевого public CDN read; отдельный этап и критерий удаления proxy                             |
| Один public bucket, `private/` prefix, спрятанные UUID URLs                                         | **Hack — отклонён**                                   | Меньше конфигурации                                                           | Prefix/UUID не authorization; случайное раскрытие source/drafts                                             |
| Один private bucket + Worker, проверяющий access и проксирующий CDN                                 | **Durable alternative, не default MVP**               | Возможна строгая per-request revocation                                       | Дополнительная edge auth/cache система и Cloudflare coupling; оправдана только если это реальное требование |

Два buckets дают безопасность, простую настройку CDN и независимый operational
scope. Их обслуживание почти не добавляет runtime сложности. Prefixes внутри
private bucket полезны для порядка и ops, но не заменяют private/public buckets.
Фактические имена предлагаются как `bidplace-media-private` и
`bidplace-media-public`, с раздельными staging/prod resources; существование не
проверено. Public bucket хранит **только безопасные опубликованные derivatives**.

Новые форматы/размеры не должны порождать вторую storage систему. До миграции
`PostgresImageStore` — явный legacy adapter; после cutover убрать bytes и его
production/dev выбор. In-memory fake остаётся тестовым инструментом.

## 6. Рекомендуемая target architecture

```text
Client → multipart → Nest auth/admission → validation + bounded Sharp
                                │                 │
                                │                 └→ R2 PRIVATE
                                │                     source + staged derivatives
                                └→ PostgreSQL: assets, keys, revision references,
                                               status, operations

Moderation/publication → verified PUBLIC derivatives → DB public projection

Public JSON → https://media.<owned-domain>/<immutable-key>
Client → Cloudflare CDN (HIT / R2 PUBLIC MISS)

Owner/admin preview → authorized Nest read of private derivative, no-store
Source → backend/ops only; no public domain and no automatic original-download UI
```

Доменные модели не содержат R2 URLs или account IDs. URL строится сервером из
`MEDIA_PUBLIC_BASE_URL` и exact key. Private domain отсутствует. Не публиковать
оригиналы по presigned URL, пока нет отдельного разрешённого сценария скачивания.

Public read не должен делать S3 GET через Nest. При недоступности объекта клиент
показывает missing-media state, диагностирует ошибку; API не подменяет bytes
неожиданным fallback из DB. Operational repair восстанавливает конкретный объект.

### Публикация не является одним PUT

Загрузка идёт в private даже для editing revision уже публичной работы. Изменение
галереи и публикация новой ревизии не меняют bytes старой published revision.
Перед public URL нужны валидированные derivatives, проверенный storage result и
разрешённое moderation решение. Повторный publish использует те же точные keys.

Plain public bucket и DB не могут атомарно поменять доступ: PUT-before-commit
создаёт окно доступности по известному key до DB publication; commit-before-PUT
создаёт окно отсутствующих bytes. Рекомендация: сохранить одобренный publication
intent в DB, подготовить immutable public objects, затем короткой TX переключить
published references и media readiness. Старую страницу держать до готовности.
Если eligibility за это время меняется, intent отменяется, публичные copies
удаляются, кеш очищается; все steps имеют retry state и exact target revision.

**Это eventual publication, не строгая мгновенная DB authorization на CDN.**
Если правило «в любой момент доступны только bytes текущей published revision»
обязательно буквально, эта архитектура недостаточна: необходим auth-aware gateway
или сохранение защищённой раздачи. Нельзя молча ослабить текущую серверную защиту;
решение Q01/Q02 нужно до public cutover. Непредсказуемые keys уменьшают discoverability,
но не исправляют эту границу безопасности.

## 7. Image model: source важнее термина MASTER

| Вариант                                      | Класс / рекомендация                                                | Цена и последствия                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Byte-identical ORIGINAL + PREVIEW + FULL     | **Durable fix, default**                                            | Дополнительный размер source, зато нет необратимой потери и можно регенерировать из исходника                             |
| Только normalized lossy MASTER + derivatives | Durable при сознательном отказе от original; здесь не рекомендуется | Меньше storage, но потерянные детали/цвет/битность восстановить невозможно                                                |
| ORIGINAL + normalized MASTER + derivatives   | Durable, отложить                                                   | Четыре файла и двойное хранение source; полезно при доказанно дорогой повторной декодировке/нестабильных codec, не сейчас |

Не создавать отдельный «master» просто ради названия. `SOURCE` обозначает самый
качественный доступный сохранённый input. Для новых uploads это точные принятые
bytes. Для legacy — `LEGACY_NORMALIZED`: исходник уже потерян текущим pipeline.
Byte-identical означает **полученное сервером**, а не camera original: picker/OS
мог преобразовать файл до multipart, `quality: 1` не доказывает bit-identical import.

Пример 3500×4500 JPEG 3.2 MB: сохранить source без JPEG re-encode; отдельно
получить delivery файлы. Пример 48 MP / 20 MB: если он укладывается в принятую
input policy — также сохранить source, уменьшить derivatives. Если не укладывается,
явно отклонить с понятной ошибкой; не выбрасывать source молча после сжатия.

Private source может содержать EXIF/GPS. Это осознанное хранение private данных:
минимальный доступ, ограниченный срок и отсутствие metadata dumps/filenames в
логах. Если продукт запрещает хранить GPS вообще, byte-identical original с таким
GPS несовместим; требуется отдельное решение Q03, а не скрытая очистка под словом
«original».

### Fixed derivatives для первого прохода

| Variant      | Начальный технический кандидат                                | Использование                                                       |
| ------------ | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| Work PREVIEW | WebP, fit inside 1600×1600, без enlargement; старт quality 82 | каталог, профиль, история и обычная галерея                         |
| Work FULL    | WebP, inside 3840×3840, без enlargement; старт quality 90     | только открытое полноразмерное изображение                          |
| Author photo | Один display derivative до 800×800, без server crop           | existing author/photo UI; FULL не нужен по умолчанию                |
| Achievement  | display derivative до 1600×1600                               | опубликованное достижение; FULL только при реальном viewer сценарии |

Это **benchmarked defaults pending**, а не обещание визуального качества, filesize
или Pen/Figma geometry. Кодировать без crop: сервер не должен обрезать произведение.
1400–1600 и 3000–4000 разумны как стартовые long-edge ranges, а не обязательные
dimensions каждого изображения. Для каталога 1600 может оказаться избыточным:
добавить меньший вариант только после measurements/реального требования, а не
динамическое `?width=` API. 200–350 KB/0.7–1.5 MB — capacity estimates, не caps.
Не уменьшать quality до попадания в среднее; измерить corpus и bytes-per-view.

При source меньше preview/full не upsample. Разрешён явный reuse одного rendition
между ролями с сохранением его identity, а не скрытая подмена отсутствующего FULL.
FULL надо добавить в контракт и viewer с lazy load; текущий API не различает его.

WebP — приемлемый MVP default, codec доступен установленному Sharp; требует
проверки поддерживаемых web/native clients. Для PNG/alpha сохранять прозрачность;
lossless WebP может быть оправдан для графики/текста по corpus. Не нормализовать
alpha input в JPEG. AVIF/JPEG XL и format negotiation сейчас не обязательны:
прямой URL конкретного rendition упрощает кеш и миграцию. Будущая смена формата —
новая pipeline version/keys, регенерация source, обновление DB projection.

## 8. Конкретный processing pipeline и input policy

### 8.1. Sharp/libvips

Установлены Sharp **0.35.3**, libvips **8.18.3**, AWS SDK **3.1127.0**,
Nest platform-express **10.4.22**. Текущая online документация Sharp включает более
новые версии; используемые ниже `autoOrient`, `withIccProfile`, timeout доступны
в установленной версии, новые experimental APIs не нужны.

Порядок обработки: проверить compressed bytes/MIME/signature → прочитать bounded
metadata → отвергнуть motion/неподдерживаемые dimensions → полный safe decode →
применить EXIF orientation → преобразовать цвет в sRGB с ICC-aware operation →
resize без crop/enlargement → encode variant. Проверить output metadata и checksum.

Для public derivative кандидат: `sharp(source, { limitInputPixels, animated:
false, failOn: 'warning' }).autoOrient().withIccProfile('srgb').resize({ width,
height, fit: 'inside', withoutEnlargement: true }).webp({ quality }).timeout(...)
→ output`. Это описание pipeline, не готовая вставка: production timeout/quality
задаются после измерений. `.autoOrient()` устраняет зависимость отображения от EXIF.
[Sharp orientation](https://sharp.pixelplumbing.com/api-operation/#autoOrient),
[resize](https://sharp.pixelplumbing.com/api-resize/#resize).

Оставлять только безопасный выходной sRGB ICC; не использовать blanket
`keepMetadata/withMetadata/keepExif/keepXmp`, которые могут сохранить private
metadata. Не заменять ICC conversion простым удалением профиля. Default Sharp
уже удаляет metadata; текущий код не доказывает неправильные цвета, но у него
нет тестов color parity. `withIccProfile('srgb')` явно задаёт conversion/attachment.
HEIC/HEVC требует подходящей custom libvips/codec сборки; наличие `heif` в
versions само по себе не доказывает HEIC decode. Сейчас whitelist его отвергает.
[Sharp output / ICC / HEIF](https://sharp.pixelplumbing.com/api-output/).

Input without ICC: трактовать как sRGB для web display, source сохранить; это
предположение, не гарантия точного цвета. CMYK/Adobe RGB/P3: преобразование и
визуальный corpus test. Unsupported/corrupt ICC — понятная ошибка, без silent
color fallback. HDR/gain maps/16-bit источники могут сохранить больше информации
в source, чем SDR WebP: delivery policy и native corpus проверить отдельно.
Embedded thumbnails, GPS, device serial, comments и XMP не переносятся наружу.

Metadata gate не заменяет full decode; malformed/truncated JPEG должен упасть
до READY. Для source acceptance учитывать Sharp warning/error policy и не
принимать partial successful decode как «валидный original».
[Sharp constructor](https://sharp.pixelplumbing.com/api-constructor/).

### 8.2. Input отдельно от storage и тарифов

| Параметр                | Сейчас                  | Рекомендуемый кандидат, не утверждённый cap                                                                       |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `MAX_UPLOAD_BYTES`      | 5 MiB/file              | 20 MiB/file для современных JPEG; не обещать поддержку всех phone files                                           |
| `MAX_DECODED_PIXELS`    | 16.8 MP                 | 50 MP, только после container resource benchmark                                                                  |
| `MAX_DIMENSION`         | 4096                    | 10 000 px + независимый pixel budget                                                                              |
| Supported input         | JPEG/PNG/WebP           | сохранить static JPEG/PNG/WebP; HEIC отдельная развилка                                                           |
| Output                  | JPEG/PNG                | fixed WebP + source в исходном MIME                                                                               |
| Files/Work              | 10                      | сохранить 10 до отдельного product decision, не внедрять 5/10 тариф                                               |
| Files/request           | до 10                   | до 2 крупных файлов/request; client batching и retry явно поддержать                                              |
| Multipart bytes/request | нет early aggregate cap | 40 MiB file payload + ограниченные поля/parts и transport overhead                                                |
| Aggregate media/Work    | 20 MiB                  | независимый operational source budget, стартовый кандидат 200 MiB при 10 × 20 MiB; derivatives считаются отдельно |

Разрешение 50 MP нельзя включать в существующий memory upload path только заменой
константы. Durable MVP: admission gate **до Multer**, bounded temporary files с
потоковым подсчётом total bytes, ограниченные fields/parts, receive/idle deadline,
проверка owner/permissions до expensive processing; Sharp по одному source за
раз, output последовательно отправляется в storage. Temporary file cleanup в
success/error/abort, закрытые permissions, отсутствие пользовательского имени
в path; disk-space cap и аварийный cleanup после crash.

На первый ресурсный benchmark предложить один active image-processing request
на API process и один на пользователя. Если capacity занята — явный 429/503 с
retry policy до приёма большого body; не накапливать бесконечную in-process queue.
`sharp.concurrency()` ограничивает libvips threads, а не число HTTP bodies;
`timeout()` не ограничивает ожидание libuv очереди. Request admission/timeout,
Sharp timeout и SDK timeout — разные budgets.

Сохранить 5 MiB/4096 при защищённом rollout допустимо как **acceptable workaround**,
но это отклоняет пример 3500×4500 из ТЗ и многие phone photos. HEIC default —
ясно отклонять на сервере и объяснять JPEG export; если бесшовный HEIC import
нужен MVP, benchmark custom decoder либо клиентский import conversion. Не
добавлять новый codec только расширением MIME whitelist.

## 9. Prisma и metadata: минимальная общая модель

Предлагается сохранить доменные `ProductImage`/gallery revision joins и добавить
общую media identity/objects, используемую тем же ImageStore, без второй параллельной
upload системы. Точная DDL — второй проход после решений.

| Модель                     | Нужные поля / инвариант                                                                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MediaAsset`               | UUID, ownerUserId, source provenance (`ORIGINAL`/`LEGACY_NORMALIZED`), upload state, createdAt/updatedAt; persisted upload operation/idempotency identity                  |
| `MediaObject`              | assetId, variant, pipelineVersion, storageTier PRIVATE/PUBLIC, exact objectKey, MIME, byteLength, sha256, width/height, READY/delete state, createdAt; uniqueness tier+key |
| Existing domain references | ProductImage.mediaAssetId; author revision photo/achievement media reference; legacy process-image reference; gallery sort остаётся в domain joins                         |
| Durable cleanup task       | exact tier/key, reason, notBefore/nextAttempt, attempts, lease/status; переживает удаление domain row и рестарт                                                            |
| Publication intent/state   | конкретная revision и generation, ожидаемый published target, readiness/attempt state; не переключает public URLs до подготовки                                            |

Не хранить provider endpoint, credentials, полный публичный URL, account ID,
Cloudflare transform URL или blob data в целевой модели. Bucket name — deployment
config, tier — переносимая роль. Source dimensions могут быть до EXIF rotation;
derivative width/height всегда фактические выходные. Оригинальный filename не нужен
для MVP, не входит в key/логи; если требуется download UX, отдельное безопасное
display name после product decision.

Checksum: SHA-256 над **каждым точным файлом**, включая source и каждый derivative.
Не путать checksum source с checksum preview; текущий checksum относится к
нормализованным bytes. ETag хранить/использовать как transport validator по
необходимости, не считать portable SHA-256. Для надёжной миграции HEAD/length
недостаточен — сверять GET checksum либо поддерживаемый достоверный remote checksum.

Content-addressed глобальные keys и dedup одинаковых uploads не нужны: усложняют
ownership/privacy/retention/reference counting. Одна картинка, загруженная дважды,
может быть двумя assets. **Retry одной операции** — отдельная проблема idempotency,
а не dedup. Общие references между published/editing revisions уже существуют;
их сохранить и учитывать при cleanup.

Версию pipeline хранить в object metadata/DB и key. Например `p1` означает
конкретный набор размеров/codec/color policy; immutable generation не изменяется
после upgrade. Регенерация создаёт новые objects, verify, переключает references,
старые очищаются после grace window. Source retention определяет возможность
регенерации: после его удаления promise future formats уже невозможен.

## 10. Keys и расширение ImageStore

Простой layout, без имени пользователя, slug, email и filename:

```text
PRIVATE: assets/{assetUuid}/source.jpg
PRIVATE: assets/{assetUuid}/p1/preview.webp
PRIVATE: assets/{assetUuid}/p1/full.webp
PUBLIC:  assets/{assetUuid}/p1/preview.webp
PUBLIC:  assets/{assetUuid}/p1/full.webp
```

Расширение source соответствует detected MIME; legacy normalized source — его
фактическому MIME. Asset UUID меняется при replace, pipeline version меняется при
regeneration; одинаковый public key не получает новые bytes. Work ID в пути не
нужен: domain relation находится в DB, один asset может быть в нескольких revisions.
DB перечисляет точные keys для remove/migrate — LIST prefix не нужен.

ImageStore расширить typed `storageTier`, `put` metadata/cacheControl и `head`
(length, MIME, ETag/cache metadata). `get/delete` получают exact DB key+tier.
Убрать ложную обещанную atomicity optional Prisma tx у S3: DB orchestration — в
media service/use case; legacy adapter временно может иметь явную отдельную
transactional ветку. Adapter transport/policy injection вместо полного
`loadServerEnv()` в constructor улучшает изоляцию тестов.

Не нужны `list`, dynamic transforms, Cloudflare-specific auth или factory на
десяток неиспользуемых providers. Operational LIST при orphan inventory —
отдельный script capability. Не добавлять presigned upload API до соответствующей
задачи. `copy` не обязателен: для небольших derivatives достаточно bounded
GET/PUT через существующую abstraction; same-provider CopyObject можно добавить
при измеренном выигрыше и проверить отдельно.

## 11. Upload, consistency, retry и deletion

### 11.1. Upload operation

1. Auth/email/owner/status и admission gate; валидировать multipart limits.
2. Короткая TX резервирует operation/asset identity, scoped idempotency key,
   target editing revision и expected keys; staging не публичен. При concurrent
   requests финальная capacity всё равно проверяется под domain row lock.
3. Decode и derivatives вне TX; exact-key private PUTs с ограниченным retry/timeout.
   Source не public, derivatives не возвращаются как READY до успешного storage IO.
4. Короткая TX повторно проверяет owner, current revision/status/capacity и
   завершает metadata + revision attachment + READY атомарно.
5. При отказе — FAILED/cleanup exact objects. После lost response повтор с той же
   operation identity возвращает результат, не вставляет второй набор rows.

Не держать DB lock во время нескольких PUT. Network timeout после PUT означает
неизвестный outcome: повторить same immutable key с теми же bytes/identity или
HEAD/verify; не считать timeout доказательством отсутствия объекта. SDK retries
не заменяют operation idempotency и durable DB state.

Если process упал между шагами, stale staging reconciler находит operation,
проверяет objects/references и завершает либо удаляет after grace. Media state —
не distributed transaction framework: небольшой набор статусов и DB tasks.

### 11.2. Deletion/retention

В domain TX удалить только нужную editing reference; published/historical shared
reference продолжает держать asset. Если eligible unreferenced — сохранить exact-key
cleanup tasks в **той же TX**; не терять keys при cascade/delete domain row.
Worker/ops executor читает due tasks с lease/row locking, делает exact DELETE,
затем отмечает результат. Отсутствующий объект считается успешным delete.

| Failure                                       | Результат / восстановление                                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Один derivative PUT успешен, следующий failed | READY не выставлять; сохранить и повторить/удалить весь operation набор                            |
| PUT success, attach DB TX failed              | Private orphan tracked operation; compensation + stale cleanup                                     |
| DELETE success, status update failed          | Повтор exact DELETE, затем DB update; idempotent                                                   |
| DB marks deletion due, R2 unavailable         | Public projection исключает target; task остаётся retryable, bytes не объявляются удалёнными       |
| DB row с READY, object отсутствует            | Missing-media state, ops alert; восстановить derivative из source, не скрытый fallback             |
| Object есть, DB row нет                       | Manifest/LIST reconciliation с grace; не удалять свежий in-flight object автоматически             |
| Asset shared между revisions                  | Удалять только при отсутствии удерживающих references и active publication                         |
| Replacement/concurrent hide/publish           | Проверять revision generation under lock; cancelled publish copies должны попасть в cleanup/revoke |
| User/Work удаляется                           | Собрать references/tasks до cascade; user delete нельзя заменить bucket-prefix delete              |

Для raw user deletion в текущем MVP нет подтверждённого полноценного flow.
Подготовить FK/tasks invariant, а не добавлять новый account-delete продукт.
Scheduler сейчас **не подключён в AppModule**. Для MVP достаточно одного
периодического DB-backed executor (scheduled task/отдельный ops runner);
добавление его является явным implementation шагом. Несколько replicas требуют
lease/`SKIP LOCKED` и concurrency test; Redis не нужен.

Будущий retention: `deleteAfter` на конкретном объекте и business policy в DB,
с reference/legal hold checks. Сейчас не внедрять sold date/Free/Paid/90 дней.
Lifecycle rule допустим для незавершённого multipart/temp мусора; не удалять
app-owned SOURCE/FULL opaque bucket rule, пока DB считает их READY. В будущей
политике full/source deletion сохраняет preview metadata и выставляет явную
availability, а не broken FULL URL.

## 12. CDN, cache, CORS и отзыв публичного доступа

Предложение для revocable пользовательского media: immutable **keys**, но
короткий browser TTL. Начальный кандидат object header:
`Cache-Control: public, max-age=300, s-maxage=86400`; `Content-Type: image/webp`.
Не назначать годовой browser `immutable` всем пользовательским файлам, пока не
решены hide/abuse/delete требования. Для заведомо неотзываемых assets возможно
`public, max-age=31536000, immutable`, но это не безопасный default для moderation.

Immutable keys устраняют purge при replace/regeneration; **они не устраняют purge
при удалении/отзыве**. Cached R2 object остаётся доступен после origin delete;
R2 strong consistency не распространяется на CDN cache. 404 также может быть
закеширован до будущего PUT. [R2 consistency/cache](https://developers.cloudflare.com/r2/reference/consistency/).

Public revoke: DB eligibility → durable exact public DELETE + URL purge task →
проверка old URL. Источник остаётся private, если retention позволяет. Не удалить
shared public object, который всё ещё нужен другой published reference.
Unhide может восстановить verified derivatives, при необходимости новым generation
key, чтобы избежать cached 404. Purge — минимальная Cloudflare-specific operational
интеграция; отделить от ImageStore/domain contracts.
[Single-file purge](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/).

Purge не удаляет browser cache и уже скачанные copies. Короткий TTL ограничивает
reuse браузером, но не запрещает screenshots/сохранённые файлы. Для строгого
права читать bytes после hide требуется отдельная gateway модель. Если hide
означает только убрать страницу, public copies могут жить дальше — это другой
явный product decision Q01, с более простым publish flow.

Cache Rule только для production media host/public paths: соблюдать origin header,
не кешировать ошибки/404 на долгое время, не ставить authenticated cookies.
Проверить доступные Edge TTL/browser/status settings на actual plan, повторные
GET `CF-Cache-Status`/`Age`, CORS варианты и удаление.
[Cache Rules settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/).

ETag/Last-Modified использовать для If-None-Match/If-Modified-Since без своей
Nest conditional proxy. ETag не нужен в public product domain как checksum.
Range поддерживается storage, но для статичных images отдельный range service
MVP не нужен; при настройке не ломать HTTP GET/HEAD, Content-Length и existing
conditional response поведение.

CORS не является защитой private source. Обычный image render и JS fetch/canvas
имеют разные требования. Для public fetch/atmosphere: GET/HEAD, разрешённые
production/staging frontend origins, без cookies/credentials; exposed ETag/
Content-Length и диагностические headers при необходимости. Native HTTP не
получает browser CORS защиту. Public domains должны получать media requests без
API auth cookies; private owner/admin Blob API сохраняет credentials.
R2 CORS smoke посылает `Origin`; после смены policy существующий cache нужно
обновить. [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/).

Client media retry сейчас добавляет cache-busting query. Для CDN проверить,
не создаёт ли это MISS на каждую попытку. Не использовать такой retry как
cache invalidation protocol; immutable path — identity. Любое исключение query
из cache key должно учитывать CORS и фактические allowed parameters.

## 13. Migration DB media → R2 и rollback

1. **Inventory без секретов**: counts/bytes/MIME/checksum всех пяти типов,
   nonempty Bytes, null keys, missing dimensions, shared revision keys,
   public/private ownership. Проверить live provider отдельным безопасным report.
2. DB+bytes backup/restore point; выбрать maintenance window или журнал concurrent
   изменений. MVP default — короткая остановка **media writes/moderation**, не
   необоснованный сложный dual write. Public reads могут продолжаться со старого
   пути, пока copy выполняется.
3. Additive schema/config/contract release без переключения public reads и без
   DROP Bytes. Сохранить возможность старого read path по **явному** migration mode.
4. Bounded paginated migration; deterministic operation IDs/manifest; legacy
   normalized bytes → private source, генерировать fixed derivatives. Группировать
   shared references, не удалять origin. Проверять local checksum до copy.
5. Remote GET SHA-256 и HEAD MIME/length для каждого сохраняемого объекта; отдельно
   output dimensions/metadata и public eligibility. Записать verified mappings
   в DB; `get` обязан читать persisted keys, не old key formula.
6. Опубликовать только eligibility-approved targets по выбранной §6 модели;
   проверить guest/owner/admin/draft/published/hide/suspend матрицу и CDN.
7. При замороженных writes сверить финальный manifest, 0 missing references,
   переключить reads/config, smoke и наблюдать ошибки. Глобальный current provider
   switch нельзя сделать посередине partial migration.
8. Разморозить новые writes в R2. Rollback после новых R2-only writes — не просто
   вернуть `MEDIA_STORAGE_PROVIDER=postgres`: нужны сохранённые mappings либо
   reverse copy новых bytes. До cutover описать этот runbook и recovery window.
9. После проверенного restore, успешного наблюдения и решения о rollback window
   отдельным deployment убрать legacy Bytes и PostgresImageStore. До этого
   nullable transition/пустые placeholders — явно временный compatibility этап.

Невозможно «мигрировать untouched originals» для уже нормализованных rows.
Сохранить provenance `LEGACY_NORMALIZED`, возможно предложить автору re-upload
после отдельного UX решения. Не выдавать потерю original за storage migration bug.

Migration tests: restart/resume, failed remote GET/checksum, partial writes,
shared asset, current editing vs published parent keys, cancelled publication,
source mutation during copy, real restore. Текущий backfill не запускать на
production как есть.

## 14. Backup, durability, стоимость и provider exit

### 14.1. Backup отдельно от CDN

R2 рассчитан на eleven-nines annual durability, но это не защита от ошибочного
DELETE/компрометации и не обещание доступности. [R2 durability](https://developers.cloudflare.com/r2/reference/durability/).

Для пилота: приложение хранит source как application asset, не обещает быть
единственным архивом художника; DB backups + объектный manifest + tested sample
restore обязательны. Предпочтительно иметь отдельную периодическую копию private
sources прежде, чем уничтожать DB legacy, особенно если автор не хранит исходник.
Дорогая distributed backup система не нужна; небольшой batch export с read-only
источником и независимым backup credential уже снижает риск. Второй bucket того
же account не эквивалентен second-provider isolation.

Q06 определяет acceptable RPO/RTO. Кандидат: backup source+manifest ежедневно,
RPO ≤24 ч, проверяемый RTO ≤1 рабочий день. Это обещания, которые ещё надо
подтвердить recovery drill. Derivatives регенерируются, SOURCE после удаления нет.
Restore rehearsal должен соединить DB point-in-time со **своими** media generations,
а не просто проверить число rows. Bucket locks/WORM не вводить без анализа
совместимости с delete/retention policy.

### 14.2. Capacity и деньги

R2 Standard: $0.015/GB-month, Class A $4.50/million, Class B $0.36/million;
free tier 10 GB-month, 1m A, 10m B; egress бесплатно. У Infrequent Access есть
retrieval/minimum duration, поэтому default — Standard. Операции и storage
округляются по billing units; кеш уменьшает origin GET, не делает storage/CPU/
paid zone features бесплатными. [R2 pricing, проверено 2026-10-04](https://developers.cloudflare.com/r2/pricing/).

Оценка, decimal MB/GB, не целевой размер файла:

| Сценарий                                                       | Работы | Фото при 8/work | Source+preview+full по 4.25 MB/photo | Storage list price до free tier |
| -------------------------------------------------------------- | -----: | --------------: | -----------------------------------: | ------------------------------: |
| 100 авторов × 3 работы                                         |    300 |           2 400 |                              10.2 GB |                    $0.153/month |
| 200 авторов × 10 работ                                         |  2 000 |          16 000 |                                68 GB |                     $1.02/month |
| Верхний сценарий, source в среднем 15 MB + 1.25 MB derivatives |  2 000 |          16 000 |                               260 GB |                     $3.90/month |

Полный steady month после 10 GB free, с опубликованным округлением: примерно
$0.015 / $0.87 / $3.75 соответственно; не включает thumbnails, private staged
copies, старые generations, profile/achievement images, backups, налоги и hosting.
При 3 объектах/photo 16 000 фото дают ~48 000 первичных PUT; публикация copies,
HEAD/verification/migration увеличат число операций. На этом масштабе отказ от
original ради нескольких долларов storage трудно обосновать качеством продукта.

Для R2 риск viral traffic — origin request count/cache hit rate, client payload
и cold-cache latency, а не оплачиваемый egress R2. 1m карточек по 250 KB всё равно
~250 GB передачи пользователям: mobile bytes и скорость важны даже при free
egress. Не вводить пользовательский monthly bandwidth limit. Будущие product
limits — число работ/фото, retention, professional features после решения.

### 14.3. Provider exit

DB export manifest tier+key+size+SHA-256/MIME → copy private/public отдельно с
сохранением keys → verify exact files → freeze writes/final delta → переключить
S3 config и origin собственного media-домена → smoke/cache warm → observation →
снять старый origin после rollback window. Изменения DB asset identity/front URLs
не нужны при сохранённом domain+paths. Возможны инфраструктурные изменения CDN,
TLS/CORS/cache/purge API и стоимость exit; S3 compatibility не обещает, что любой
provider имеет такой же public/custom-domain продукт.

Checksum/manifest и retention states облегчают выход. SHA-based глобальные names,
proprietary transforms и Cloudflare-specific metadata в domain его усложняют.

## 15. Test strategy, local development и CI

### Уровни

| Уровень                 | Что проверять                                                                                                                | Реальная сеть                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Unit                    | key/version/URL builder, pipeline corpus, MIME/alpha/orientation/privacy, eligibility, idempotency, failure compensation     | нет; typed fake store с управляемыми failures |
| Backend integration     | real PostgreSQL TX/locks/revision visibility/shared refs + fake store; concurrent upload/delete/publish, crash-state retries | локальная DB, без Cloudflare                  |
| S3 protocol integration | фактический SDK serialization PUT/HEAD/GET/DELETE, headers, missing object, retry/timeouts                                   | optional disposable test-only S3 target       |
| R2/CDN smoke            | настоящий test private/public bucket + custom test domain, checksum, cache/CORS/conditional/read/revoke                      | отдельный ручной/staging/CI job               |

Для MVP default: fake+PostgreSQL и обязательный отдельный R2 smoke. MinIO или иной
эмулятор полезен только если уже есть поддерживаемый test harness; не добавлять
его в production и не считать эквивалентом R2/CDN. Fake проверяет orchestration,
SDK mock — command construction, protocol target — SDK transport, R2 — реальный
провайдер. Эти доказательства не взаимозаменяемы.

Local frontend/backend: после legacy cutover не возвращать PostgreSQL Bytes как
новое dev storage. Можно использовать уже настроенный test/dev S3-compatible
target с локальным public URL; либо закрытый **отдельный** dev R2 и собственный
dev domain. Unit tests работают полностью без него. Dev credentials не нужны
каждому участнику, если применяется локальный S3 test target. Static app icons,
logos, favicon, Expo/native/build assets остаются в build; R2 сюда не относится.

CI: pinned Node 22 + pnpm 11.7.0 + frozen dependencies; Turbo affected graph
database/contracts/api-client/api/mobile; lint без auto-fix, typecheck, unit,
disposable PostgreSQL integration, API build/Expo export, документированный media
acceptance. Provider suite отдельно от каждого PR/unit run, isolated prefix/buckets,
least privilege credentials через CI secret mechanism, гарантированный exact-key
cleanup. Не читать `.env` для тестов: missing config path и synthetic fixtures.

### Обязательная failure/state матрица будущих тестов

- malformed/truncated JPEG, fake MIME/extension, unsupported format, animated PNG/
  WebP/GIF, EXIF mirrored/rotated portrait, decompression bomb, bytes/pixels/edge/
  total request caps; metadata strip GPS/device/XMP/embedded thumbnail;
- sRGB/P3/Adobe RGB/CMYK/no-ICC/invalid ICC, PNG и WebP alpha, color-detail corpus;
- store unavailable, first/second PUT failed, successful PUT с lost response,
  DB attach/commit failed, service crash после PUT, повтор same operation;
- same image twice с разными operations, retry с тем же operation, replacement,
  missing DB/object pair, idempotent delete, partial variant deletion;
- owner/admin/guest/stranger, draft/pending/changes-requested/approved/suspended/
  archived, editing и published revisions, shared achievement/photo references;
- concurrent capacity/order change, cancelled publish после hide/suspension,
  public object cleanup и purge failure; 404 до upload, old URL после delete;
- Work/user removal при references и FK restrictions, backfill пяти видов,
  migration resume/rollback, DB+object restore;
- concurrent large requests на реальных CPU/RAM/container limits, body abort/
  slow upload/temp disk exhaustion; отказ до буферизации при занятом admission.

Public real smoke: PUT с Content-Type/cache metadata, HEAD, GET+SHA-256, conditional
GET, CORS Origin и без credentials, повторный CDN GET/cache status, draft/source
невозможны через public endpoint, DELETE/purge, повторный HEAD missing. Private
bucket без custom domain/`r2.dev`; secret paths/URLs не сохранять в публичный report.

## 16. Configuration contract и infrastructure prerequisites

| Конфигурация                               | Сейчас / будущая роль                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `MEDIA_STORAGE_PROVIDER`                   | сейчас postgres/s3; production s3 сохраняется, R2 не требует отдельного domain provider enum                       |
| `S3_ENDPOINT`, `S3_REGION`                 | server-only endpoint R2, region auto; другой provider меняется конфигурацией                                       |
| `S3_BUCKET`                                | legacy single bucket; заменить explicit `S3_PRIVATE_BUCKET`/`S3_PUBLIC_BUCKET` в целевой модели                    |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | имена server-only credentials; значения не нужны в аудите/коде/client                                              |
| `MEDIA_PUBLIC_BASE_URL`                    | server URL builder для собственного media hostname; новый параметр, сейчас отсутствует                             |
| Input/processing limits                    | validated server configuration или одна versioned pipeline policy; не добавлять десятки неиспользуемых env options |
| Purge configuration                        | отдельная operational Cloudflare zone identity + least-privilege cache-purge credential, только если принято Q01   |

Приложению нужен доступ к двум bucket scopes; миграции — отдельный credential
с нужным чтением/записью; restore/backup — отдельный ограниченный scope. Не
использовать account-wide admin credentials для runtime. Ротация не меняет
object keys или public contracts. [R2 auth/scoped permissions](https://developers.cloudflare.com/r2/api/tokens/).

Не внедрять `EXPO_PUBLIC_S3_*` или account endpoint в frontend. Base URL безопасен
как public data, но клиент получает готовые media URLs из API. Ограничить схему
URL HTTPS/public approved host (локальный HTTP только explicit dev), не ослаблять
regex до произвольного `z.string()`.

До release ops должны подтвердить: владение фактическим доменом; zone в нужном
account; custom media DNS/TLS; separate prod/staging private/public buckets;
`r2.dev` disabled; supported cache/WAF settings и CORS; credentials в deployment
secret store; actual API container memory/CPU/body/timeout limits. Bucket names
и конфигурация здесь **Needs verification**, не нужны ответы с секретами.

## 17. Поэтапная реализация, gates и что отложить

| Этап                          | Изменяемая область                                                                                    | Gate / rollback                                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 0. Второй проход решений      | Q01–Q10, согласованная visibility/source/import политика                                              | RFC/security conflict разрешён явно; sizes/quality только после corpus                                                              |
| 1. Transport и model          | `core/image-store`, env validation, additive Prisma media/state schema                                | unit+SDK contract tests; старый read path продолжает работать                                                                       |
| 2. Upload durability и limits | Images/Sellers/Portfolio thin controllers, media use case, staged upload/idempotency/cleanup executor | real DB+fake failures/concurrency; rejected requests не расходуют unbounded memory                                                  |
| 3. Source+pipeline            | `image-policy` и новый общий fixed pipeline, orientation/ICC/alpha/source provenance                  | corpus metadata/quality и resource benchmarks; никакой потери принятого source                                                      |
| 4. Publish/revoke/CDN         | admin/publication, visibility flows, direct public objects, purge task при выбранной политике         | guest/private/revision matrix + реальный R2/domain/cache smoke                                                                      |
| 5. Legacy migration           | backfill всех пяти типов, manifest/verify/resume/restore                                              | backup/drill и final reconciliation; Bytes ещё не удаляются                                                                         |
| 6. Contract/client cutover    | `packages/contracts`, `api-client`, API mappers, shared mobile gallery/photo consumers                | HTTPS media URL validators, preview/full lazy load, missing states, export/typecheck/unit и согласованная browser/device acceptance |
| 7. Legacy removal             | schema Bytes, PostgresImageStore и global legacy default                                              | наблюдение + tested rollback новых R2 writes + restore; отдельный destructive migration release                                     |

Этапы — coherent review/deploy units, не указание публиковать промежуточный
небезопасный public bucket. Contract expansion для совместимости можно поставить
до read cutover. R2-private + Nest proxy этап допустим, но его результат не
помечается «CDN integration Implemented».

После code implementation обновить `11-PROJECT-STATUS.md` конкретными модулями,
API/tests; `10-CODE-ARCHITECTURE.md` — schema/store/publication/security boundaries;
`13-APPLICATION-SECURITY.md` — input/admission/private-public controls;
ops runbook — migration/backup/purge/drill. Design status/system/flows — только
при фактическом изменении media viewer/UI. Защищённые product documents не
переписывать; runtime sale/tariff assumptions не внедрять. Этот audit-only проход
не меняет canonical feature statuses.

**Не делать в MVP:** image microservice, Workers/Images/transform URLs, arbitrary
resize, deep zoom/tiles, queue/Redis/Kafka/Kubernetes, global content-addressed
dedup, multi-region API, paid bandwidth quotas, 90-day sold retention и новый
original-download UX. Новые Workers допустимы только после требования strict
per-request media authorization и отдельного сравнения альтернатив.

### Конкретные triggers для дополнительной инфраструктуры

Кандидаты operational thresholds, окончательно выставить после load test:
upload p95 >10 s либо приближается к половине ingress timeout; sustained RSS

> 70% container limit/OOM; processing causes >20% degradation обычного API p95;
> admission rejects >5% legitimate uploads за согласованное окно; требуется retry
> после долгой offline upload или variants становятся массово асинхронными.
> Сначала измерить/уменьшить concurrency или увеличить isolated API resource;
> persisted async processing/worker добавляется при доказанном влиянии synchronous
> path. Presigned multipart uploads нужны при network/body bottleneck; CPU workers
> решают другую проблему. Любой trigger сопровождается metrics и конкретным scope.

## 18. Все открытые решения одним пакетом — grilling

Ниже вопросы только о предпочтениях/обещаниях продукта. Технические факты,
обнаружимые в коде, уже разобраны. Все ответы пока **Open**, recommended defaults
не утверждены первым аудитом. Ответить можно по ID; несогласие с default указать
явно. После ответов второй проход фиксирует согласованный план до реализации.

| ID  | Вопрос / зависимость                                                                                                           | Рекомендуемый ответ                                                                                                                                                                           | Что меняется при другом ответе                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q01 | После hide/suspension/delete должны ли старые прямые media URLs перестать работать, или скрывается только страница/каталог?    | Обычный hide убирает страницу; emergency moderation/delete также удаляет public objects и запускает purge. Дать измеримый target ≤5 минут с учётом TTL/retry; скачанные copies не отзываются. | Strict immediate byte authorization требует gateway и пересмотра direct public bucket; только discovery-hide упрощает storage cleanup             |
| Q02 | Допустима ли eventual publication уже одобренной ревизии: public bytes и DB pointer переключаются не атомарно? Зависит от Q01. | Да для явно approved publication intent; старая страница живёт до READY, отменённая публикация убирается/revokes. Никогда не публиковать обычные drafts.                                      | Буквально current-published-only bytes в каждый момент требует auth-aware delivery; plain public CDN недостаточен                                 |
| Q03 | Сохраняем ли принятый source byte-identical, включая его private EXIF/GPS?                                                     | Да: один private SOURCE + безопасные derivatives; доступ backend/ops, source не скачивается публично.                                                                                         | Запрет хранения GPS требует очищенного source и отказа от byte-identical обещания; normalized-only навсегда теряет часть данных                   |
| Q04 | HEIC без ручного JPEG export обязателен уже в MVP?                                                                             | Нет: static JPEG/PNG/WebP на старте; понятная HEIC ошибка. Проверить реальный picker на iPhone.                                                                                               | Если да — отдельный codec/import path и device/container tests; не считать libheif version доказательством                                        |
| Q05 | Принимаем ли 48 MP/до 20 MiB input и большие phone uploads как обязательную первую capability?                                 | Да как target после protected ingress и container benchmark: 50 MP/10k px/20 MiB, batching ≤2 files/request; не повышать caps в нынешнем memory path.                                         | Если нет — сохранить 5 MiB/4096 как явно объявленную стартовую границу; пример 4500px JPEG из brief не принимается                                |
| Q06 | Обещает ли bidplace архив original? Какой loss/recovery budget допустим?                                                       | Application asset, не единственный архив; пользователь хранит собственный original. Source backups до удаления DB bytes, кандидат RPO 24 ч/RTO 1 день подтверждается drill.                   | Архивное обещание требует независимой копии/restore commitments до launch, больше ops обязанностей                                                |
| Q07 | Разрешаем ли запуск без платных тарифов и автоматического 90-day удаления source/full?                                         | Да; ничего не удалять по гипотезе продажи/Free. Будущий DB retention отдельно.                                                                                                                | Иной ответ меняет portfolio MVP/product contract, требует founder decision; SOURCE deletion исключает future regeneration                         |
| Q08 | Нужен ли FULL viewer работ в этом implementation scope?                                                                        | Да для Work после явного opening; PREVIEW 1600/FULL 3840 — старт corpus, не постоянные требования. Для аватара/achievement не навязывать три variants.                                        | Если full viewer не входит — подготовить source/version model, хранить лишь реально используемые display variants, не добавлять фальшивый control |
| Q09 | Допустимо ли короткое окно остановки media writes/moderation для миграции?                                                     | Да, с сохранением старых public reads и announced maintenance; размер окна определить inventory rehearsal.                                                                                    | Zero downtime требует delta journal/dual-write/read-routing, усложняет rollback                                                                   |
| Q10 | Остаётся ли принцип переносимости через S3+собственный media domain без Workers/Images?                                        | Да; допускается отдельный Cloudflare purge ops adapter для emergency revoke. Два buckets и source+derivative proposal принять как базу второго прохода.                                       | Strict edge access/managed transforms требуют явного исключения и сравнения coupling/стоимости                                                    |

Отдельные **Needs verification** facts, не вопросы предпочтений: реальные bucket
names/provider/counts/bytes; фактический принадлежащий media domain (пример
`media.bidplace.com` пока не доказан); зона/plan/cache settings; API deployment
RAM/CPU/timeouts; supported native/browser versions; права на source metadata и
retention obligations проверяются в соответствующем legal workstream.

## 19. Классификация предположений из ТЗ

| Категория                                   | Вывод                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — structurally sound                      | DB source of truth; bytes в object storage; runtime exact-key GET/delete без LIST; own media domain; provider-neutral keys; backend upload; fixed derivatives; source сохранён для future regeneration; CDN для viral reads                                                                                                                                                      |
| B — MVP configurable / pending measurements | WebP, preview/full dimensions/quality; input bytes/pixels; per-request batching/concurrency; TTL; source backup frequency; количество photos; future retention                                                                                                                                                                                                                   |
| C — изменить                                | Не считать normalized MASTER обязательным; не пережимать JPEG source; не считать public/private prefixes access boundary; не включать all-media public при upload; не считать DB TX откатом S3; не считать immutable заменой revoke/purge; не считать custom domain полным CDN acceptance; не считать MinIO/R2 tests одинаковыми; не внедрять sold/tariff policy в portfolio MVP |

Рекомендации основаны на конкретных свойствах текущего проекта и verified provider
APIs. Универсального «industry best practice» для art quality/retention/цвета не
доказано: corpus, device checks и продуктовые обещания здесь важнее чужих defaults.

## 20. Выполненная проверка и границы доказательств

Проверено по исходникам на указанном baseline: Prisma/клиенты/контракты, upload/
read/delete/moderation paths, backfill/preflight, active AppModule, local adapter
selection, renderer URL helper/pickers, release документация и существующие тесты.
Production DB/bucket не открывались; objects не PUT/DELETE; deployment/DNS не менялись.

Результаты на доступном **Node v24.17.0 / pnpm 11.7.0**; root требует Node ≥22 <23:

| Проверка                                                                               | Результат                                                                                                     |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `corepack pnpm exec turbo run typecheck lint build --filter=@bidplace/api...`          | PASS: 10 tasks, 7 из локального кеша; API lint/typecheck/build executed. Graph: API/database/contracts/config |
| Media/revision unit suites: images, stores, sellers service, editable profile revision | PASS: 7 files / 74 tests, с explicit missing config path и local/test profile                                 |
| `src/core/config/env.spec.ts` отдельно                                                 | PASS: 1 file / 33 tests                                                                                       |
| `node --test scripts/ops/lib/media-preflight.spec.mjs`                                 | PASS: 5 tests                                                                                                 |
| `node --check scripts/ops/backfill-media-to-s3.mjs`                                    | PASS syntax; это не remote migration verification                                                             |
| Формат audit, local links, `git diff --check`, scope/.pen check                        | PASS: Prettier, 6 local links, полный набор Q01–Q10; единственный файл изменения — аудит, `.pen` отсутствует  |

Первый combined unit run: 104/107, три S3 failures из-за invalid `CORS_ORIGIN`
окружения. С explicit local CORS повторный run прошёл 107/107. При дальнейшей
изоляции `BIDPLACE_ENV_FILE` два path-discovery tests ожидаемо конфликтовали с
внешним override; окончательная проверка разделила config suite (он сам stub-ит
несуществующий файл при load) и media suites с missing config override. Код
тестов не изменялся. Это ограничение изоляции, не доказанная поломка R2.

Не запускались: full repository verify, PostgreSQL HTTP integration, real S3/R2/
CDN smoke, browser/device, load test, DB+media migration/restore. Для audit-only
изменения документа они не требуются как release gate, но **до интеграции
обязательны соответствующие §15/§17 checks на поддерживаемом Node 22**. Зелёные
unit/static checks не повышают R2/CDN readiness до Implemented.

## 21. Покрытие исходного brief

| Пункты brief                                              | Где дан ответ                                   |
| --------------------------------------------------------- | ----------------------------------------------- |
| 1–3: architecture, DB truth, stable domain                | §1, §5–6, §9–10, §14                            |
| 4–6: existing code, direct public reads, bucket model     | §2–6                                            |
| 7–9: variants, MASTER/original, color/private metadata    | §7–8                                            |
| 10–12: MVP complexity, upload memory, input policy        | §3, §8, §11, §17                                |
| 13–14: immutable keys, HTTP/CDN/cache                     | §10, §12                                        |
| 15–16: future tariffs/retention, reliable delete          | §1, §11, Q07                                    |
| 17–18: provider exit, backup/durability                   | §13–14                                          |
| 19–22: abstraction, test tiers, failures, consistency     | §9–11, §15                                      |
| 23–24: legacy Bytes, static assets                        | §2, §13, §15                                    |
| 25–26: costs, no popularity penalty                       | §14                                             |
| 27–28: challenge assumptions, avoid enterprise            | §5, §17–19                                      |
| 29: repo-specific implementation plan, env/dev/CI, phases | §6–17; open decisions §18; current evidence §20 |

Следующий проход: применить ответы Q01–Q10, закрыть discovered infra facts
без выдачи секретов, уточнить publication/revoke invariant и exact schema/API
contract; затем согласовать implementation scope. Этот аудит не является
разрешением применить migration или ослабить существующие visibility gates.
