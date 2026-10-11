# UI и API client — следующий этап

Backend на `fix/author-story-review` уже говорит новыми контрактами.
`packages/api-client` и экраны mobile/admin их не вызывают. Пока клиенты не
обновлены, проект не готов к совместному выпуску.

## Что сломается у текущего клиента

- Страна профиля — ISO 3166-1 alpha-2 в верхнем регистре (`BY`). Свободная строка
  «Belarus» больше не проходит валидацию.
- Город необязателен и может быть `null`. Публичный автор и его работы остаются
  видимыми без города. Не подставлять город.
- Готовность заявки требует хотя бы одно направление (`directionCategoryIds`),
  а не текст `discipline`. Advance шага «о себе» и submit без направления
  возвращают 409.
- `POST /author/application/achievements` принимает JSON
  `{ occurredDate, body }`. Файл изображения больше не читается. Новое
  достижение не имеет картинки. Старый `GET /author-achievements/:id/image`
  остаётся для уже сохранённых файлов.
- `PUT /products/:id/creation` принимает
  `{ storyToken, idempotencyKey?, blocks }`. Блок — `HEADING`/`PARAGRAPH` с
  `text` или `IMAGE` с `mediaAssetId` и необязательным `altText`.
  `PATCH /products/:id/creation/order` удалён.
- Ответ владельца `GET /seller/products/:id` содержит обязательный `story`.
  Старые `creationIntro` и `creationSteps` ещё читаются, но новым источником
  истории является `story`.
- Публичная карточка каталога блоки истории не содержит. Деталь
  `GET /works/:publicId` содержит обязательный `work.creationStory`.
- Цель модерации Work содержит обязательный `story`.
- Запись Work принимает `materialTermIds`, `techniqueTermIds`,
  `materialProposals`, `techniqueProposals`, `categoryProposal`.
  Предложение категории допустимо только вместе с категорией `other`.
- Пока выбранное предложение в статусе `PENDING` или `REJECTED`, одобрение Work
  отвечает 409. Подтверждение предложения само Work не публикует.
- Отклонение выбранного предложения переводит ревизию в `CHANGES_REQUESTED`.
- Точный повтор `PUT /products/:id/creation` с тем же `idempotencyKey` и тем же
  снимком возвращает текущую историю и не увеличивает `storyToken`. Другой снимок
  с тем же ключом — 409 `Story idempotency key does not match this snapshot`,
  история не меняется. Другое содержимое со старым `storyToken` — 409
  `Story snapshot is stale`. Ключ не обходит владельца и статус ревизии.
  `ProductRevision.version` для этого не используется.
- История опубликованной работы сохраняется в отдельную editing revision.
  `PUT` в саму опубликованную ревизию — 403. Черновик не меняет публичные блоки
  до одобрения новой ревизии. `PENDING_REVIEW` не редактируется (403). Чужой
  пользователь — 403. Устаревший снимок — 409.

## Новые чтения

- `GET /countries?q=` — `{ countries: [{ code, name }] }`, русские названия.
- `GET /catalog/terms?role=MATERIAL|TECHNIQUE` — активные термины.
- `GET /categories` — только активные категории, у записи есть `active`.
- `GET /authors?directionId=<category uuid>` и прежний `tag` по имени категории.
- `GET /works?materialId=` и `?techniqueId=` фильтруют термины опубликованной
  ревизии. `materials=` и material facets ищут имена этих терминов, не свободную
  колонку. `q` ищет название, короткое описание, имя автора, текст блоков
  истории и имена опубликованных терминов. Черновик и предложения в публичный
  поиск не входят.
- `materials` и `technique` в ответах — только проекция выбранных терминов.
  Пустой выбор даёт `null`, даже если в старой колонке осталась строка.
  `POST` и `PATCH /products` больше не принимают эти поля: тело с ними
  отклоняется строгой валидацией (400). Неизвестный материал или техника
  сохраняются как `materialProposals` / `techniqueProposals`, а не как
  свободная строка и не как сразу одобренный термин. Старый клиент, который
  пишет `materials` или `technique`, несовместим. Новые формы подключаются
  отдельно; временный второй источник не оставляем.
- Успешный `POST` и `PATCH /products` возвращают `product` уже после записи
  выбора. Эти поля совпадают с `product` следующего `GET /seller/products/:id`.
- `GET /seller/products/:id` возвращает `selection`: `category`,
  `materialTermIds`, `techniqueTermIds`, `materialTerms`, `techniqueTerms` и
  `proposals`. Термин повторяет `catalogTermSchema` (`id`, `role`, `slug`,
  `name`, `active`), в том числе для скрытого выбранного термина. Категория
  выбора содержит `id`, `slug`, `name`, `description`, `active`. Цель
  `GET /admin/products` возвращает тот же `selection` у `reviewTarget`.
  `GET /categories` и `GET /catalog/terms` по-прежнему отдают только активные
  записи. Скрытый термин, категорию или направление можно оставить в прежнем
  выборе, но нельзя назначить впервые.
- `GET /seller/profile`, публичный автор и цель модерации профиля содержат
  `directions` с теми же полями категории, рядом с `directionCategoryIds`.
- Предложение содержит `id`, `kind`, `rawName`,
  `normalizedName`, `status`, `selected`, `mappedCategoryId`, `mappedTermId`,
  `rejectionReason`, `reviewedAt`. Публичная карточка отдаёт только
  `materialTermIds` и `techniqueTermIds` опубликованной ревизии, без proposals.

## Запись истории и медиа

- `POST /products/:id/story-images` — одно поле `image`, заголовок
  `Idempotency-Key`. Это не добавляет фото в галерею. Ответ — media asset.
- `DELETE /products/:id/story-images/:assetId` снимает черновое удержание.
  Файл остаётся, пока на него есть другая живая ссылка. Удаление запрещено,
  если блок истории ещё использует asset.
- `GET /products/:id/story-images/:assetId` публичен только если IMAGE-блок
  стоит в текущей опубликованной ревизии одобренной работы одобренного
  активного автора. Тогда `Cache-Control` — публичный immutable. Hold без блока
  даёт 200 только владельцу editing revision и админу, с `Cache-Control:
  private, no-store`. Гость, другой пользователь, скрытая работа и
  приостановленный автор получают 404. Шестой IMAGE-блок отклоняет контракт
  (400). Один `mediaAssetId` можно поставить в несколько блоков; бюджет байтов
  считается по уникальным asset.
- В блок можно поставить `STORY_IMAGE`, удержанный этой ревизией, или
  `WORK_IMAGE`, уже стоящий в галерее этой editing revision. Чужой asset,
  произвольный URL и неготовый файл отклоняются.
- Лимиты: 5 изображений, 20 текстовых блоков, заголовок 200, абзац 5000,
  alt 300, файл 5 МиБ, бюджет фото истории 20 МиБ. Один и тот же asset
  считается один раз.

## Админ

Все маршруты под `AdminGuard`, решения пишутся в audit.

- `POST /admin/categories`, `PATCH /admin/categories/:id` `{ name }`,
  `PATCH /admin/categories/:id/active` `{ active }`.
- `POST /admin/catalog/terms` `{ role, name, slug? }`,
  `PATCH /admin/catalog/terms/:id`, `PATCH /admin/catalog/terms/:id/active`.
  Повторное создание того же нормализованного имени в той же роли возвращает
  существующий ID, даже если slug другой (`Холст` и `canvas`). Чужое
  нормализованное имя при rename — 409. Одинаковые имена разных ролей не
  сливаются. `GET /countries` и проверка записи используют один список кодов;
  `EU`, `UN` и `UK` отклоняются, `GB` принимается.
- `POST /admin/catalog/proposals/:id/map` — ровно одно из `categoryId` или
  `termId`. Ревизия должна оставаться текущей целью `PENDING_REVIEW`.
- `POST /admin/catalog/proposals/:id/reject` `{ reason }`.
- Повтор map/reject уже рассмотренного предложения — 409. Два параллельных
  решения одного предложения оставляют один результат и один audit. ID
  предложения брать из `reviewTarget.selection`, не из базы.
  После map материала прежняя цель модерации конфликтует; approve нужен со
  свежим `updatedAt` из повторного GET.
- Снять предложение и добавить тот же нормализованный текст снова не создаёт
  вторую строку. Снятое `REJECTED` не блокирует следующую отправку. Снова
  выбранное `REJECTED` остаётся отклонённым и блокирует одобрение.

## Потребители, которые нужно перевести

- `packages/api-client` и схемы, которые он импортирует из `@bidplace/contracts`.
- Заявка автора: `apps/mobile` seller profile / application screens.
- Черновик Work и история: `product-draft-*`, `work-content.ts`.
- Каталог работ и авторов: фильтры по ID, nullable city, `directionCategoryIds`.
- Админ-модерация: `story` в цели проверки и действия по предложениям.
- Достижения: убрать upload и отправлять JSON.

Не переносить Figma-вёрстку в этой backend-задаче. После клиента проверить
сохранение, возобновление, отправку, модерацию, фильтры и публикацию истории
в браузере.
