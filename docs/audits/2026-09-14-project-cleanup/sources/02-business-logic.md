Аудит бизнес-логики `apps/api` по **HEAD `70c5fd5`** (`docs: accept mobile discovery launch`), ветка `fix/work-final`. Исходники, зависимости, документацию, Pen/Figma и Git не менял. Рабочее дерево основного checkout грязное (env/CORS, mobile, seed) — в предмет аудита не входило. Проверки читал из изолированного worktree `/private/tmp/bidplace-api-logic-audit`.

**Критерии успеха:** для portfolio MVP (без сделок, mobile web 390) проследить use cases, владельцев гарантий, дубли правил и переходы состояний; расхождения код/документы/решения показывать явно; находки только с доказательством.

**Ориентир MVP перепроверен:** актуальные владельцы — `05-MVP-RFC.md` + `DEC-082`–`DEC-089`. `DEC-087` отменяет retention из `DEC-084`. Исторические `Implemented`, `COMMERCE_ENABLED` и старые test counts не считались доказательством.

---

## Расхождения документов, решений и кода

| Утверждение | Источник | Факт в `70c5fd5` |
|---|---|---|
| Commerce выключается флагом `COMMERCE_ENABLED` | `docs/audits/00-CURRENT-MVP-READINESS.md` F01; `01-OPEN-ARCHITECTURE-GAPS.md` P01 | `DEC-087` + `AppModule`: флага нет, commerce-модулей нет. Тест `app.module.spec.ts` это фиксирует |
| Submit профиля требует `socialLink` | `11-PROJECT-STATUS.md` (2026-09-09) | `assertProfileRevisionReadyToSubmit` не требует ссылку; `optional-socials.integration.spec.ts` принимает `null` |
| Незавершённая заявка сохраняется | RFC §8 | `SellersService.create` сразу пишет `PENDING_REVIEW` (профиль и revision) |
| Сначала confirm email, потом заявка | RFC §12 / §3 | Register выдаёт сессию с `emailVerifiedAt: null`; заявка не проверяет верификацию. Код `EMAIL_VERIFICATION_REQUIRED` есть, вызовов нет |
| Автор видит работы «на проверке» | RFC §3 | У опубликованной Work `Product.status` остаётся `APPROVED`; cabinet/owner DTO не отдают `editingRevision.status` |
| Hidden, не Archive | RFC §9 / `DEC-083` | Скрытие — `ProductStatus.ARCHIVED`. Публично это скрытие, имя в API — archive |
| Правки после `CHANGES_REQUESTED` | `10-CODE-ARCHITECTURE.md` | Первая заявка также PATCH-ится в `REJECTED` |
| Старые counts 381/89 | статус 2026-09-09 | Не использовались. Сейчас в статусе HEAD: API unit 297, integration 79 — это запись статуса, не пересчёт в этом аудите |

---

## Пути вызовов и владельцы гарантий

### 1. Заявка автора и замечания

```text
POST /seller/profile
  SellersController.create
    → validateProductImageUploads (MIME/размер)
    → SellersService.create
        TX: SellerProfile (default PENDING_REVIEW)
          + ImageStore.put(seller-photo:{id})
          + SellerProfileRevision PENDING_REVIEW
        нет AuditEvent

GET /author/application
  PortfolioService.getApplication → SellersService.getMine
    → toSellerProfileResponse (публичные поля с editingRevision)

PATCH /seller/profile
  если APPROVED → fork revision + canAuthorEditSellerProfileRevision
  если CHANGES_REQUESTED|REJECTED → пишет live row и revision
  если PENDING_REVIEW|SUSPENDED → 403

POST /author/application/submit
  PortfolioService.submitApplication
    → SellersService.submitProfileRevision
        DRAFT|CHANGES_REQUESTED|REJECTED → PENDING_REVIEW
        live status → PENDING_REVIEW только если ещё не APPROVED
        нет AuditEvent

дубль: POST /seller/profile/submit → тот же submitProfileRevision
        (нет в default api-client)

PATCH /admin/seller-profiles/:id/status
  AdminModerationService.updateSellerStatus (Serializable TX)
```

**Кто владеет чем:** create/submit — `SellersService`; lock revision при achievements — `lockSellerProfileRevisionRowForUpdate`; переходы revision — `seller-profile-revision-state.ts`; approve copy — `publishedSellerProfileData` + `requiredApprovedSellerPhoto`; публичность — `status === APPROVED` + published pointer.

### 2. Профиль после approve и публикация revision

Тот же `update`/`submitProfileRevision`. Live профиль не меняется, пока admin не `APPROVED` editing revision. Owner UI опирается на `editingRevision.status` — это сделано правильно.

### 3. Work: create / edit / moderation / hide

```text
POST /products → ProductsService.create
  assertApprovedSeller → Product DRAFT + ProductRevision DRAFT + editingRevisionId

PATCH /products/:id → ProductsService.update
  FOR UPDATE на products
  unpublished: writableProductWhere + dual-write Product и revision
  APPROVED|ARCHIVED: ensureAuthorEditingRevision → пишет только revision
                    (не проверяет status revision)

POST /products/:id/images → ImagesService
  assertProductImagesMutable: для APPROVED|ARCHIVED всегда true

POST /products/:id/submit → ProductsService.submit
  unpublished: Product + revision → PENDING_REVIEW + AuditEvent
  published (editing ≠ published): только revision → PENDING_REVIEW
                                   Product.status остаётся APPROVED

PATCH /admin/products/:id/status → AdminModerationService.updateProductStatus
  pending revision: APPROVED копирует publishedProductData,
                    publishedRevisionId, publishedAt
                    ARCHIVED остаётся ARCHIVED
  visibility: APPROVED ↔ ARCHIVED

POST /products/:id/hide|unhide → setAuthorVisibility
  authorTransitions APPROVED ↔ ARCHIVED + publishedRevisionId обязателен
```

**Кто владеет чем:** unpublished write gate — `product-write-guard.ts`; fork — `product-revision-write.ts`; переходы — `product-revision-state.ts` (`canAuthorEditRevision` **не вызывается** из write path); требования публикации — `missingProductApprovalFields` (title, categoryId, ≥1 image); публичность — `public-visibility.ts` + `publicCatalogCte`.

### 4. Public discovery

```text
GET /portfolio/home|facets|/works|/authors|/works/:id|/authors/:slug
  PortfolioService → ProductsService.listPortfolio/getPortfolio
                   → SellersService.listPublic/getApprovedPublicAuthor
  SQL: p.status=APPROVED AND seller APPROVED AND published revision
  toPortfolioItem повторно фильтрует title/category/city/images
  curator missing/hidden → null (это контракт DEC-086, не silent fallback)
```

### 5. Administrative actions

```text
GET  /admin/seller-profiles|/products     — Prisma прямо в AdminController
PATCH .../status                          — AdminModerationService
GET/PATCH/POST /admin/users*              — AdminUserService (ban → sessionVersion++)
PUT/DELETE /admin/curator-selection       — PortfolioService.set/clearCuratorSelection
```

---

## Подтверждённые находки

### BL-01 — опубликованную Work можно менять, пока revision на модерации  
**Приоритет:** P1. **Уверенность:** подтверждено. **До MVP. Размер:** S.

**Символы:** `ensureAuthorEditingRevision`, `assertProductImagesMutable`, `ProductsService.update`, `ImagesService.add`.

```111:147:/private/tmp/bidplace-api-logic-audit/apps/api/src/products/product-revision-write.ts
  const canEditPublishedGallery =
    (product.status === 'APPROVED' || product.status === 'ARCHIVED') &&
    publishedRevisionId != null &&
    editingRevisionId != null;
  if (canEditPublishedGallery) {
    return;
  }
  // ...
  if (canForkPublished) {
    if (editingRevisionId === publishedRevisionId) {
      return forkPublishedRevision(tx, product.id, publishedRevisionId);
    }
    return editingRevisionId;
  }
```

```221:247:/private/tmp/bidplace-api-logic-audit/apps/api/src/products/products.service.ts
      if (
        product &&
        (product.status === 'APPROVED' || product.status === 'ARCHIVED') &&
        product.publishedRevisionId != null &&
        product.editingRevisionId != null
      ) {
        // ownership + assertApprovedSeller, затем ensureAuthorEditingRevision
```

**Проблема:** для `APPROVED`/`ARCHIVED` write path смотрит только на Product.status, не на `ProductRevision.status`. `canAuthorEditRevision` существует и покрыт unit-тестом, но **ни один production-вызов его не использует**.

**Сценарий:** автор публикует Work → PATCH (fork DRAFT) → submit (`PENDING_REVIEW`) → снова PATCH/upload. Admin в UI видит снимок A, в БД уже B, approve публикует B.

**Последствия:** модерация смотрит движущуюся цель; нарушается «после submit нельзя править, пока нет CHANGES_REQUESTED/REJECTED». Профиль это правило соблюдает (`canAuthorEditSellerProfileRevision`).

**Доказательство:** путь выше. Unit `products.service.spec.ts` проверяет lock unpublished `PENDING_REVIEW` и submit published DRAFT, но не PATCH published+`PENDING_REVIEW`. Integration `portfolio-published-revision.integration.spec.ts` делает add image → submit → approve, без мутации после submit. Профиль-аналог в `seller-profile-revision-state.spec.ts` («locks a pending revision») в Work-write не повторён.

**Контраргумент:** FOR UPDATE сериализует admin approve и author PATCH, это не гонка записи, а разрешённая мутация pending revision. Публичная проекция не портится, пока нет approve. Для MVP-модерации этого недостаточно.

**Durable fix:** в `ensureAuthorEditingRevision` / `assertProductImagesMutable` после выбора editing revision: если `!canAuthorEditRevision(status)` → 409. Submit уже зовёт `assertProductRevisionTransition`.  
**Альтернатива:** форкать новую DRAFT от published при PATCH во время pending — хуже, два параллельных editing.  
**Удалить:** мёртвый разрыв между helper и write path.  
**Проверка:** unit + integration: PATCH/upload после submit published Work → 409; после CHANGES_REQUESTED → 200.

---

### BL-02 — owner/cabinet Work не показывают «на проверке» после первой публикации  
**Приоритет:** P1. **Уверенность:** подтверждено. **До MVP. Размер:** S–M (контракт).

**Символы:** `listCabinetWorks`, `toContractProduct`, `portfolioCabinetWorkSchema`.

```819:825:/private/tmp/bidplace-api-logic-audit/apps/api/src/sellers/sellers.service.ts
    return products.map((product) => ({
      id: product.id,
      publicId: product.publicId,
      title: product.editingRevision?.title ?? product.title,
      status: product.status,
      updatedAt: product.updatedAt.toISOString(),
      moderationMessage: reasonByProductId.get(product.id) ?? null,
```

`listCabinetWorks` читает `editingRevision.title`, но не `editingRevision.status`. `toContractProduct` отдаёт `status: product.status`. У профиля owner DTO уже содержит `editingRevision.status`; mobile на это завязан.

**Сценарий:** опубликованная Work + pending revision. Cabinet и `GET /seller/products/:id` говорят `APPROVED`. RFC: автор видит drafts / на проверке / замечания / published / hidden.

**Последствия:** кабинет врёт на главном remoderation-сценарии. `moderationMessage` — последний audit с reason, не текущий статус; после submit reason=null, может остаться старый текст замечания.

**Durable fix:** добавить `editingRevision: { id, status }` в cabinet и owner product DTO по образцу заявки. Не схлопывать два статуса в один enum.  
**Альтернатива:** менять `Product.status` на `PENDING_REVIEW` при re-submit — сломает public `status=APPROVED` и RFC «старая версия остаётся публичной».  
**Проверка:** integration после submit published Work: cabinet status published=`APPROVED`, editing=`PENDING_REVIEW`.

---

### BL-03 — заявка без подтверждённого email  
**Приоритет:** P1. **Уверенность:** подтверждено. **До MVP. Размер:** S. Security-sensitive.

**Символы:** `AuthService.register`, `SellersService.create`. Код `ApiErrorCode.EMAIL_VERIFICATION_REQUIRED` в `packages/contracts/src/error.ts` и `api-exception.filter.ts:56` нигде не бросается.

```77:86:/private/tmp/bidplace-api-logic-audit/apps/api/src/auth/auth.service.ts
        data: {
          email,
          phone,
          displayName: input.displayName,
          passwordHash,
          status: 'active',
          sessionVersion: 0,
          emailVerifiedAt: null,
```

`SellersService.create` проверяет только «профиль ещё нет». OTP выставляет `emailVerifiedAt`, write gate нет.

**Сценарий:** register → сразу `POST /seller/profile` → админ видит заявку на неподтверждённый ящик.

**Контраргумент:** клиент мог бы смотреть `emailVerifiedAt` в `/auth/me`. RFC требует серверный порядок; capability hiding недостаточно (`DEC-084`/`DEC-087` та же идея).

**Durable fix:** в `create` (и желательно `submitProfileRevision`) требовать `emailVerifiedAt`, 403 `EMAIL_VERIFICATION_REQUIRED`.  
**Не делать:** убирать OTP.  
**Проверка:** unit/integration unverified → 403; verified → 201.

---

### BL-04 — первая заявка не может быть черновиком  
**Приоритет:** P2. **Уверенность:** подтверждено (код vs RFC). **До MVP, если RFC не пересмотрят. Размер:** M.

**Символ:** `SellersService.create` → revision `status: 'PENDING_REVIEW'` (`sellers.service.ts:209-232`). Default профиля — `PENDING_REVIEW` (`schema.prisma:132`). Integration явно ждёт это и `audit length 0` (`moderation.integration.spec.ts:140-166`).

RFC §8: незавершённая заявка сохраняется и продолжается. API: полный POST или ничего. PATCH в `PENDING_REVIEW` запрещён.

**Контраргумент:** 4 экрана Figma могут держать local state и слать один POST. «Сохраняется» тогда не серверное. Для resume с другого устройства/после краша — дыра.

**Durable fix:** create как `DRAFT`, submit переводит в `PENDING_REVIEW` (как Work и как повторная revision).  
**Workaround:** оставить all-or-nothing и явно сузить RFC.  
**Удалить после draft-create:** немедленный PENDING на create и путаницу двух submit-маршрутов.

---

### BL-05 — направление не обязательно, в БД попадает «Автор»  
**Приоритет:** P2. **Уверенность:** подтверждено. **До MVP. Размер:** S.

RFC §8: хотя бы одно направление. `sellerProfileCreateRequestSchema.discipline` optional (`packages/contracts/src/seller-profile.ts:116`). Prisma default `"Автор"` (`schema.prisma:114`). Create revision: `discipline: input.discipline ?? 'Автор'` (`sellers.service.ts:215`). Integration `applicationForm()` дисциплину не шлёт.

**Последствия:** заявки и публичные чипы с заглушкой, не с направлением автора. Facets `tags` начнут содержать «Автор».

**Durable fix:** discipline required на create/submit, убрать default из write path. Default колонки — отдельный data-слой.  
**Проверка:** create без discipline → 400; submit без discipline → 409.

---

### BL-06 — авторский submit профиля без audit trail  
**Приоритет:** P2. **Уверенность:** подтверждено. **До MVP. Размер:** S.

`ProductsService.submit` пишет `AuditEvent`. `SellersService.create` и `submitProfileRevision` — нет. Integration это закрепляет: после POST профиля `auditFor(...).toHaveLength(0)`.

RFC: админ видит нужный audit trail. Сейчас первая заявка «появляется» без submitted-события; re-submit после замечаний тоже нелогируется, только admin decision.

**Durable fix:** тот же `auditEvent.create`, что у Work submit (`oldStatus` revision, `newStatus: PENDING_REVIEW`).  
**Проверка:** существующий moderation integration — ждать 1 событие после create или после submit.

---

### BL-07 — дубли HTTP и мёртвые обёртки без роли  
**Приоритет:** P2. **Уверенность:** подтверждено. **Опционально / сразу как упрощение. Размер:** S.

| Мёртвое | Где | Что удалить |
|---|---|---|
| `POST /seller/profile/submit` | `sellers.controller.ts:109-112` | Клиент зовёт только `/author/application/submit` (`packages/api-client/src/portfolio.ts:82`, `sellers.ts` submit нет) |
| `PortfolioService.hideWork` / `unhideWork` | `portfolio.service.ts:238-244` | Ни один controller не вызывает; hide идёт в `ProductsController` |
| `SellersService` inject `ProductsService` | `sellers.service.ts:132-138` `void _products` | Убрать из конструктора и `SellersModule.imports` |
| `publicDirectProductWhere` ≡ `publicCatalogProductWhere` | `public-visibility.ts:41-57` | Оставить одно имя |
| `parseBody` ≡ `parseQuery` | `parse-body.ts` / `parse-query.ts` | GET portfolio использует `parseBody` для query (`portfolio.controller.ts:56-76`) |

`PortfolioService.listWorks`/`getWork`/`home`/`facets` — не wrappers: это anti-corruption к portfolio DTO. Их оставлять.

**Риск удаления submit-дубля:** кто-то бьёт старый URL. Проверка: 404 на `/seller/profile/submit` + grep.

---

### BL-08 — `ProductsService.update` — две несвязанные машины состояний в одной функции  
**Приоритет:** P2. **Уверенность:** подтверждено. **До MVP как часть BL-01. Размер:** M.

`update` (`products.service.ts:145-287`): ~140 строк, ветка published (только revision) и unpublished (Product + revision + `updateMany`). Те же поля копируются в `createWithPublicId`, `forkPublishedRevision`, `publishedProductData`.

Не баг длины файла. Баг структуры: published branch обходит `assertProductWritable` и revision lock (BL-01). Unpublished dual-write легко разъедется с revision, если новый write path забудет одну сторону.

**Durable fix:** один путь: lock → `ensureAuthorEditingRevision` (уже с BL-01) → update revision → если нет published pointer, копировать на Product.  
**Не предлагать:** generic repository / CQRS.  
**Удалить:** ручной перечень полей в четырёх местах — вынести `revisionContentFromInput` / `productContentFromRevision`.

---

### BL-09 — `SellersService` смешивает несвязанные ответственности  
**Приоритет:** P2. **Уверенность:** подтверждено. **После MVP, если не чистить рядом с BL-07. Размер:** M.

Один класс: заявка, revision fork, photo bytes, achievements, owner product list/detail, cabinet, public author catalog, facets, public photo. `listProducts` vs `listCabinetWorks` — два owner list с разным контрактом (`GET /seller/products` и `GET /author/cabinet/works`).

Это не требует нового слоя. Достаточно разрезать методы по файлам в том же модуле: `seller-application`, `seller-catalog`, `seller-owner-works` — без DI-пирамиды.

**Контраргумент:** один injectable удобен для Nest. Цена — скрытые зависимости (мёртвый `ProductsService`) и сложнее увидеть, какая гарантия где.

---

### BL-10 — admin lists живут в controller  
**Приоритет:** P2. **Уверенность:** подтверждено. **Опционально. Размер:** S.

`AdminController.listSellers` / `listProducts` (`admin.controller.ts:89-172`): unbounded `findMany`, ручная сборка last reason — копия `listCabinetWorks`. Модерация при этом в сервисе.

**Последствия:** бизнес-правило «какая причина показывается» продублировано; нет пагинации (для пилота из единиц авторов терпимо).

**Durable fix:** перенести в `AdminModerationService.list*` и разделить last-reason helper. Не вводить admin repository.

---

### BL-11 — leftover commerce-write на Work  
**Приоритет:** P2. **Уверенность:** подтверждено. **После явного решения, не молча. Размер:** M.

RFC §10: нет цены, доставки, process story. В API остаются:

- `packaging`, `deliveryInfo`, `weight`, `condition`, `provenance`, `creationIntro` в `productWriteRequestSchema` и во всех copy-list
- `PUT /products/:id/creation`, `PATCH .../creation/order`, creation-step image — `assertProductWritable`, после publish 403
- `GET /creation-steps/:id/image` публичен для `APPROVED` Work (`images.service.ts:304-306`)

Публичный portfolio DTO этих полей не отдаёт (кроме опционального `story` / `uniqueness`). Поверхность записи и moderation copy всё ещё commerce-era.

**Контраргумент:** колонки нужны до P4/migration. Можно перестать принимать их в write schema, не дропая Prisma.

**Удалить из write path:** packaging/delivery/creation-story endpoints, когда продукт подтвердит, что stub «Оплата и доставка» полностью клиентский.  
**Не удалять:** `story` (RFC история) и `uniqueness` (тираж).

---

### BL-12 — fork профиля без lock строки SellerProfile  
**Приоритет:** P2. **Уверенность:** подтверждено. **До MVP. Размер:** S.

`SellersService.update` для `APPROVED` (`sellers.service.ts:288-348`): Read Committed, **нет** `FOR UPDATE` на `seller_profiles`. Два параллельных PATCH при `editingRevisionId === publishedRevisionId` оба делают `version + 1` → unique `(sellerProfileId, version)` → P2002. Catch P2002 есть только в unpublished-ветке (`472-484`), не в approved-ветке → 500.

Achievements уже лочат revision (`lockSellerProfileRevisionRowForUpdate`). Work lock делает `lockProductRowForUpdate`. Профиль — нет.

**Durable fix:** `SELECT id FROM seller_profiles WHERE id=$1 FOR UPDATE` в начале approved update и `submitProfileRevision`. Map P2002 → 409.  
**Проверка:** по образцу `product-write-atomicity.integration.spec.ts` (сюда integration не гонял — см. ограничения).

---

### BL-13 — `ban` не влияет на публичный каталог  
**Приоритет:** P2. **Уверенность:** подтверждено поведение; **гипотеза** по продуктовому намерению. **До MVP как ops-footgun. Размер:** S. Security-sensitive.

`AdminUserService.updateStatus` банит User и поднимает `sessionVersion`. `BearerAuthGuard` не пускает banned. `publicCatalogCte` / `getApprovedPublicAuthor` смотрят только `seller_profiles.status = APPROVED`, не `users.status`.

RFC: админ блокирует аккаунт и отзывает сессии. Не сказано «снять портфолио». Отдельный инструмент — `SUSPENDED` на SellerProfile.

**Сценарий:** ban без suspend → автор не логинится, страницы Work/Author живы.

**Durable fix:** в runbook: ban ⇒ ещё `SUSPENDED` + hide работ; или в `updateStatus` при ban, если есть профиль, ставить `SUSPENDED` в той же TX.  
**Не делать:** молча прятать по `users.status` без product decision.  
**Проверка:** banned + APPROVED seller → сейчас 200 на `/authors/:slug`; после fix — 404 или явный suspend.

---

### BL-14 — unit-тесты не держат revision lock; helper тестируется в вакууме  
**Приоритет:** P2. **Уверенность:** подтверждено. **До MVP вместе с BL-01. Размер:** S.

`canAuthorEditRevision` вызывается только из `product-revision-state.spec.ts`. `products.service.spec.ts` мокает Prisma и проверяет, что сервис дернул `updateMany`/`revision.update`. `portfolio.service.spec.ts` мокает `ProductsService`/`SellersService` и проверяет forwarding.

Это нормальные unit-границы, но они **не могут поймать BL-01**. Тест helper создаёт ложное чувство, что pending revision залочена.

**Durable fix:** после BL-01 — один сервисный unit с APPROVED + editing `PENDING_REVIEW` + PATCH → 409, без мока самого `canAuthorEditRevision`.

---

### BL-15 — неявная матрица Product.status × Revision.status  
**Приоритет:** P2. **Уверенность:** подтверждено. **Документировать до MVP; упрощать с BL-02/BL-08. Размер:** S (таблица), M (если схлопывать).

Допустимые и реальные сочетания:

| Product | Editing revision | Смысл |
|---|---|---|
| DRAFT | DRAFT | черновик |
| PENDING_REVIEW | PENDING_REVIEW | первая модерация |
| CHANGES_REQUESTED / REJECTED | то же | замечания / отказ первой публикации |
| APPROVED | APPROVED (тот же id) | published, нет черновика |
| APPROVED | DRAFT / PENDING_REVIEW / CHANGES_REQUESTED / REJECTED | RFC remoderation |
| ARCHIVED | любой editing | hidden; approve revision оставляет ARCHIVED (`admin-moderation.service.ts:222-223`) |

`isAllowedSellerTransition` (`admin-moderation.service.ts:269-294`) жив только если `editingRevision === null`. Текущий create всегда создаёт revision — ветка legacy.

**Упрощение:** удалить `isAllowedSellerTransition`, если нет строк без revision (проверка data-слоя). Не вводить общий state-machine framework.

---

## Неподтверждённые подозрения

1. **Whitespace title:** catalog SQL делает `BTRIM(title)`, Prisma `getPortfolio` — `title: { not: '' }`. Work из пробелов может быть в get и не в list. Не воспроизводил.
2. **Cabinet `moderationMessage`** после повторного submit показывает старое замечание — следует из кода last-reason; UI не смотрел.
3. **`toSellerProfileResponse`:** DTO.slug с editing revision, `profilePhotoUrl` со live slug (`seller-profile.mapper.ts:187-217`). Ломается, только если клиент собирает URL из slug, игнорируя `profilePhotoUrl`.
4. **`listPortfolio` JS-фильтр `toPortfolioItem`** после SQL: `pagination.total` может разъехаться, если предикты разойдутся. Сейчас почти дубли.
5. **Первый submit unpublished** считает `Product.images`, published submit — `editingRevision.images`. При текущем `ImagesService.add` (пишет оба) должно совпадать; новый gallery-only path сломает unpublished submit.
6. **Создание `bidplace_integration` на общем Postgres** — не проверял, есть ли уже эта БД.

## Недоступные проверки

- Integration/HTTP: `createIntegrationDatabaseContext` делает `prisma migrate deploy`. По заданию миграции не запускал.
- Shared DB `bidplace`, seed, reset, `.env`, внешние сервисы — не трогал.
- `scripts/setup` в репозитории нет.
- Staging/production, реальный admin UI, native.
- Грязное дерево (CORS canonicalize) — не HEAD.
- Параллельные авторские гонки на профиле (BL-12) без integration не гонял.

---

## Что разумно оставить

- Тонкие `ProductsController` / `PortfolioController` (кроме admin lists).
- `assertApprovedSeller` как единый write gate.
- Product `SELECT … FOR UPDATE` на Work writes.
- Profile revision lock на achievements и `canAuthorEditSellerProfileRevision` на PATCH профиля — образец для BL-01.
- Public = published revision + SQL visibility; curator → `null` при 404 (`DEC-086`).
- Portfolio DTO как отдельная проекция (не «лишний слой»).
- Hide = `ARCHIVED` при текущей схеме, если клиент мапит в «скрыто».
- Custom `parseBody` + Zod contracts вместо Nest `ValidationPipe` — принятая граница пакета.
- In-memory rate limit на одном replica — как в `13-APPLICATION-SECURITY.md`.
- Не вводить CQRS, event bus, generic repository.

---

## Приоритетные действия

1. **BL-01** — лок editing revision через уже существующий `canAuthorEditRevision` (Work = профиль).  
2. **BL-02** — `editingRevision.status` в cabinet/owner Work.  
3. **BL-03** — серверный gate `emailVerifiedAt` на заявку.  
4. **BL-12 + BL-06** — lock профиля + audit на submit заявки.  
5. **BL-05 + решение по BL-04** — discipline required; либо DRAFT-заявка, либо правка RFC.  
6. **BL-07** — удалить мёртвые submit/hide/inject.  
7. **BL-13** — явная композиция ban/suspend, не молчание.  
8. **BL-08/BL-11** — один write path Work; перестать принимать packaging/creation-story, когда будет решение.

---

## Проверенные области

- `AppModule` composition, отсутствие commerce/cron/gateway.
- Controllers products/sellers/portfolio/admin.
- `ProductsService`, `product-*-write/guard/state/requirements`, catalog SQL.
- `SellersService`, revision state/lock, mapper overlay.
- `AdminModerationService`, `AdminUserService`.
- `ImagesService` gallery vs public bytes.
- `PortfolioService` projection + curator.
- Контракты owner/cabinet/admin, `DEC-082`–`089`, RFC §3–14, security owner, architecture owner.
- 107 unit-тестов по listed specs — green.

Не объявляю integration, typecheck всего графа, lint и HTTP smoke пройденными: их не запускал (кроме указанных unit).

---

## Команды и ограничения

```text
HEAD 70c5fd52ed306143d62b8352edd45d61943388b9
git worktree add --detach /private/tmp/bidplace-api-logic-audit 70c5fd5
pg_isready -h 127.0.0.1 -p 5432   # только liveness, без запросов к bidplace
pnpm exec vitest run <13 spec files>   # apps/api, файлы совпадают с HEAD
# 13 files, 107 tests, pass
```

Не запускалось: `pnpm verify`, integration (`migrate deploy`), seed, install в checkout, чтение `.env`. Worktree для чтения; unit — по неизменённым относительно HEAD файлам основного дерева, без записи в git.