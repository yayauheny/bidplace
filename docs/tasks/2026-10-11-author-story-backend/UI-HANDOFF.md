# UI и API client — следующий этап

Backend на `feature/author-story-backend` уже говорит новыми контрактами.
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
- Повтор сохранения истории с тем же `idempotencyKey` возвращает текущую историю.
  Другое содержимое со старым `storyToken` — 409 `Story snapshot is stale`.
  `ProductRevision.version` для этого не используется.

## Новые чтения

- `GET /countries?q=` — `{ countries: [{ code, name }] }`, русские названия.
- `GET /catalog/terms?role=MATERIAL|TECHNIQUE` — активные термины.
- `GET /categories` — только активные категории, у записи есть `active`.
- `GET /authors?directionId=<category uuid>` и прежний `tag` по имени категории.
- `GET /works?materialId=` и `?techniqueId=` фильтруют опубликованную ревизию.
  Свободный `materials` сохранён.

## Запись истории и медиа

- `POST /products/:id/story-images` — одно поле `image`, заголовок
  `Idempotency-Key`. Это не добавляет фото в галерею. Ответ — media asset.
- `DELETE /products/:id/story-images/:assetId` снимает черновое удержание.
  Файл остаётся, пока на него есть другая живая ссылка. Удаление запрещено,
  если блок истории ещё использует asset.
- `GET /products/:id/story-images/:assetId` — владелец черновика, админ или
  публичный читатель опубликованной ревизии.
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
  Повторное создание того же slug возвращает существующую запись.
- `POST /admin/catalog/proposals/:id/map` — ровно одно из `categoryId` или
  `termId`. Ревизия должна оставаться текущей целью `PENDING_REVIEW`.
- `POST /admin/catalog/proposals/:id/reject` `{ reason }`.
- Повтор map/reject уже рассмотренного предложения — 409.

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
