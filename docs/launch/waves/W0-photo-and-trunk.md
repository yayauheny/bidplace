# W0 — Фото и история, основная ветка — план реализации

> **Для агентов:** выполнять через superpowers `subagent-driven-development`
> (рекомендуется) или `executing-plans`. Шаги — чекбоксы `- [ ]`. Общие правила —
> [AGENT-RULES.md](../AGENT-RULES.md).

**Goal:** один путь подготовки фото для галереи и истории, один набор серверных
лимитов, сервер — владелец холдов истории, редактор истории на токенах; затем
одна основная ветка `main`.

**Architecture:** клиент готовит любое фото работы через `prepareImageUpload` с
одним объектом опций; сервер пропускает фото истории через тот же `process()`,
что и галерею; неиспользованные холды истории снимаются в транзакции
сохранения истории под блокировкой работы. HTTP attach/remove остаются в
`ImagesService`, байты/stage/cleanup — в `MediaLifecycleService`.

**Spec:** решения этого файла (раздел Global Constraints) + `DEC-116` (лимиты
истории), `DEC-148` (photo workflow).

**Ветка:** `fix/photo-story-hardening` от `feature/photo-workflow`. Факты
проверены на `6720b7af`. Зависимости: нет.

## Global Constraints

- Клиент, галерея и история: `maxDimension 3840`, `maxBytes 10 MiB`,
  `maxSourceBytes 25 MiB`, `quality 0.85`, PNG остаётся PNG. Аватар не меняется
  (`profilePhotoOptions`, 1600 px / 2 MiB).
- Сервер, вход истории: ≤ 10 MiB, сторона ≤ 8192, пикселей ≤ 50 331 648. Вход
  галереи остаётся 25 MiB (`workImageMaxInputBytes`). Хранимый мастер — 5 MiB.
- `STORY_LIMITS`: 5 фото, 20 текстовых блоков, длины без изменений;
  `maxFileBytes = 10 MiB`; `maxStoryImageBytes` удалён.
- `WORK_PHOTO_LIMITS.maxPhotos = 10` в `packages/contracts`; литералов `10` нет.
- Idempotency-ключ заголовка и тела: `^[a-zA-Z0-9:_-]{1,100}$`.
- Ретраи медиа: потолок 20 попыток; `nextAttemptAt` не обнулять; без миграций.
- Клиентский SHA-256 и восстановление черновиков v1 удаляются (прод пуст).
- Не делать: повторное использование байтов галерея ↔ история (`DEC-112`), CDN
  для фото истории, нативную проверку, перенос `tick` на Cron (W2),
  объединение `ImagesService` и `MediaLifecycleService`.

## Review Focus

1. Автор удалил фото из истории и сохранил — объект в R2 должен уйти в cleanup,
   а фото галереи, вставленное в историю, — никогда. → Task 1, шаг 1.
2. Шестое фото истории при двух одновременных загрузках — второе отклоняется,
   даже если обе прошли предпроверку. → Task 1, шаг 4.
3. Фото 12 Мп с телефона (4032×3024, ~8 MB) в истории — принимается без ошибки
   «слишком большое». → Task 1, шаг 6; Task 3, шаг 1.
4. Автор печатает текст, пока фото истории ещё грузится — фокус и текст не
   пропадают. → Task 3, шаг 4.
5. Alt-текст из одних пробелов — сохраняется как пустой, сохранение не падает. → Task 3, шаг 3.

## Facts

- `apps/api/src/images/images.service.ts`: `addStoryImage` ~1194–1248 сначала
  `media.stage`, потом `holds >= 5` (~1217–1239); `removeStoryImage` ~1250–1293;
  idempotency заголовка ~1204 — 100 символов, тело (`packages/contracts/src/story.ts` ~49) — 80.
  Идемпотентность сервера: `sha256(productId:idempotencyKey)` + контрольная сумма
  загруженных байтов (~378–408) — клиентский хеш не нужен.
- `apps/api/src/core/media/media-pipeline.ts` ~30–44, `image-upload-policy.ts`:
  история 5 MiB / 4096 / 16 Мп; работа 25 MiB / 8192 / 50 331 648.
- `apps/api/src/products/product-story.ts` ~175–201 — сумма 20 MiB;
  `products.service.ts` ~727 вызывает `replaceProductStory` под `FOR UPDATE`.
- `packages/contracts/src/product.ts` ~52, ~122 — литерал `10`.
- `apps/api/src/core/media/media-lifecycle.service.ts`: `fail` ~777–791
  (+15 с), `tick` ~150–161 (FAILED и `nextAttemptAt <= now`, по 8), потолка нет;
  `nextAttemptAt` обязательный (`schema.prisma` ~882).
- `apps/mobile/src/features/sellers/product-draft-image-actions.ts`: история —
  сырой blob (~1141–1167); галерея — `preparePhotoEdit` + SHA-256 + «Фото уже
  добавлено» (~732–759).
- `apps/mobile/src/features/sellers/use-product-story-editor.ts`: `editAlt` ~743;
  «5 МиБ» ~784–787; `save` с `removeStoryImage` в проглатывающем `catch`
  ~884–918; `restoreLegacy`, `storyDraftLegacyKey`, `v: z.literal(2).optional()`
  ~51–52, ~428–474, ~532.
- `product-draft-screen.tsx` ~557 и `product-draft-story.tsx` ~158:
  `savePending = storyEditor.pending` блокирует ввод.
- `product-draft-story.tsx` (459 строк, 17 inline `style={{`),
  `product-block-actions.tsx` (367, свой SVG-меню) — восемь коммитов
  `6d51920d…6720b7af` правили только их.
- E2E `apps/mobile/e2e/work-media-lifecycle.spec.ts` ~1166 и ~1564 проверяют
  «Фото уже добавлено».
- Ветки: `feature/photo-workflow` = `feature/portfolio-mvp-release` + 21 коммит;
  `origin/main` на 860 коммитов позади и не предок. CI/деплой привязаны к
  `feature/portfolio-mvp-release`: `.github/workflows/verify.yml` ~14,
  `production-deploy.yml` ~41–44 и `WORKERS_CI_BRANCH` ~253.

## Бэкенд

### Task 1: Холды и лимиты истории на сервере

**Files:**
- Modify: `apps/api/src/products/product-story.ts`, `apps/api/src/images/images.service.ts`,
  `apps/api/src/images/image-upload-policy.ts`, `apps/api/src/core/media/media-pipeline.ts`,
  `packages/contracts/src/story.ts`, `packages/contracts/src/product.ts`
- Test: `apps/api/test/integration/author-story-catalog.integration.spec.ts`,
  `apps/api/src/images/images.service.spec.ts`,
  `apps/api/test/integration/work-media-http.integration.spec.ts`,
  `apps/api/src/core/media/media-pipeline.spec.ts`,
  `apps/api/test/integration/product-write-atomicity.integration.spec.ts`

**Reuse:** транзакция и `FOR UPDATE` сохранения истории; `media.enqueueCleanup(tx, ids)`;
существующий `process()`; `AppException`.

**Interfaces:**
- Produces: `WORK_PHOTO_LIMITS = { maxPhotos: 10 } as const` (`packages/contracts/src/product.ts`);
  `STORY_LIMITS.maxFileBytes = 10 * 1024 * 1024`; `STORY_LIMITS.maxStoryImageBytes` — удалён.

- [ ] **Шаг 1: падающий тест снятия холдов.** В `author-story-catalog.integration.spec.ts`:
  история с 5 холдами, в блоках 3 фото → после PUT в БД 3 холда, 2 операции
  CLEANUP; после тика ассеты `FAILED`, объекты `DELETED`; повторный PUT без одного
  фото → 2 холда; ассет галереи в блоке сохраняет холд и не попадает в cleanup.
- [ ] **Шаг 2:** прогнать — FAIL.
- [ ] **Шаг 3:** в `replaceProductStory` после записи блоков в той же транзакции
  удалить холды ревизии с `purpose = 'STORY_IMAGE'` без ссылающегося блока и
  вызвать `enqueueCleanup`. Холды других назначений и ревизий не трогать.
- [ ] **Шаг 4: падающий тест шестой загрузки.** `images.service.spec.ts`: при 5
  холдах `addStoryImage` отклоняет с 409 и `stage` spy не вызван; при гонке
  (предпроверка пропустила) отказ под блокировкой; лимит равен `STORY_LIMITS.maxImages`.
- [ ] **Шаг 5:** дешёвый `count` до `media.stage` + проверка под блокировкой.
- [ ] **Шаг 6: падающие тесты входа.** `work-media-http.integration.spec.ts`:
  10 MiB — 200, 10 MiB + 1 байт — 413/400 на multer, `DELETE` отсутствующего холда — 200.
  `media-pipeline.spec.ts`: кейс 48 Мп параметризовать — принят для `WORK_IMAGE`
  и `STORY_IMAGE`; потолок истории ~233 → 10 MiB; 4032×3024 принят; сторона 8193 —
  тот же текст ошибки, что у галереи.
- [ ] **Шаг 7:** история в `process()` использует входные бюджеты работы; multer
  `/story-images` = `STORY_LIMITS.maxFileBytes`; цель `optimizeSource` для истории
  та же, что у галереи.
- [ ] **Шаг 8:** удалить `maxStoryImageBytes` и проверку суммы; из
  `author-story-catalog` удалить только блок бюджета (~1069–1082, `byteLength: 4_194_305` × 5),
  не весь тест ~1031; добавить случай «5 × 9 MiB принимаются».
- [ ] **Шаг 9:** `WORK_PHOTO_LIMITS` вместо двух `.max(10)` и `maxFiles`;
  единый regex idempotency.
- [ ] **Шаг 10:** `product-write-atomicity.integration.spec.ts` ~412 (`{intro, steps}`)
  переписать на блоки или удалить, если дублирует `author-story-catalog`.
- [ ] **Шаг 11:** прогнать спеки Task 1 — PASS;
  `rg "holds >= 5|\.max\(10\)|maxStoryImageBytes" apps packages` → пусто.
- [ ] **Шаг 12:** коммит `fix: release unused story holds and unify photo limits`.

### Task 2: Потолок ретраев медиа

**Files:**
- Modify: `apps/api/src/core/media/media-lifecycle.service.ts`
- Test: `apps/api/src/core/media/media-lifecycle.recovery.spec.ts`

**Interfaces:**
- Produces: константа `MEDIA_OPERATION_MAX_ATTEMPTS = 20` рядом с `tick`.

- [ ] **Шаг 1: падающий тест.** Операция, упавшая 20 раз, не берётся на 21-м
  тике; соседняя выполняется; warn с id и видом операции — ровно один раз; лимит
  8 за тик не меняется.
- [ ] **Шаг 2:** прогнать — FAIL.
- [ ] **Шаг 3:** `tick` исключает `attemptCount >= MEDIA_OPERATION_MAX_ATTEMPTS`;
  `fail` на потолке ставит `FAILED` без перепланирования и пишет один warn без
  ключей объектов и URL.
- [ ] **Шаг 4:** PASS; `git diff --stat packages/database` → пусто.
- [ ] **Шаг 5:** коммит `fix: cap media operation retries`.

## Фронтенд

### Task 3: Один путь подготовки фото и загрузка истории

**Files:**
- Modify: `apps/mobile/src/lib/media/prepare-image-upload.ts`,
  `apps/mobile/src/features/sellers/product-draft-image-actions.ts`,
  `apps/mobile/src/features/sellers/use-product-story-editor.ts`,
  `apps/mobile/src/features/sellers/product-draft-story.tsx`,
  `apps/mobile/src/features/sellers/product-draft-screen.tsx`,
  `packages/api-client/src/images.ts` (удалить `removeStoryImage`, если нет потребителей)
- Test: `apps/mobile/src/features/sellers/product-draft-submit-lifecycle.spec.ts`,
  `apps/mobile/src/features/sellers/use-product-story-editor.spec.ts`,
  `apps/mobile/e2e/work-media-lifecycle.spec.ts`

**Reuse:** `prepareImageUpload`; `preparePhotoEdit` из `src/lib/media/photo-edit.ts`
(кадрирование остаётся там).

**Interfaces:**
- Consumes: `STORY_LIMITS.maxFileBytes`, `WORK_PHOTO_LIMITS.maxPhotos` (Task 1).
- Produces: `export const WORK_PHOTO_PREPARE` в `prepare-image-upload.ts`
  (значения из Global Constraints); хук истории отдаёт `saving: boolean` и
  `uploading: boolean` вместо одного `pending`.

- [ ] **Шаг 1: падающий тест подготовки.** JPEG 6000×4000 9 MB для истории →
  `addStoryImage` получает blob ≤ 10 MiB, `prepareImageUpload` вызван с
  `WORK_PHOTO_PREPARE`; галерея — тело ≤ 10 MiB; PNG остаётся `image/png`.
- [ ] **Шаг 2:** FAIL.
- [ ] **Шаг 3:** `chooseStoryImage` → `prepareImageUpload(asset, WORK_PHOTO_PREPARE)`,
  отправлять `.blob`, `blob:` URI пикера освобождать в `finally`; галерея после
  `preparePhotoEdit` → `prepareImageUpload` с теми же опциями. `editAlt` →
  `altText.trim() || null` (тест: `"   "` → `altText: null`, сохранение успешно).
- [ ] **Шаг 4: падающий тест ввода.** `use-product-story-editor.spec.ts`: после
  сохранения `removeStoryImage` не вызывается; при `uploading = true` текст
  редактируется. E2E: пока POST фото истории задержан, ввод в абзац держит фокус и текст.
- [ ] **Шаг 5:** удалить цикл `removedAssets` и refs `persistedAssets`/`uploaded`
  (если нет других читателей); хук отдаёт `saving`/`uploading`; текстовые поля
  выключаются только при `!editable || saving`, тулбар и «добавить» — при любом.
- [ ] **Шаг 6:** удалить SHA-256 (`addSelection` ~732–748), `sourceChecksum`,
  ветку «Фото уже добавлено», импорт `expo-crypto` (если не нужен); удалить
  e2e-проверки ~1166 и ~1564; сообщение размера — «не больше 10 МиБ».
- [ ] **Шаг 7:** PASS; `rg "digest\(|CryptoDigestAlgorithm|sourceChecksum|Фото уже добавлено" apps/mobile` → пусто;
  `rg "removeStoryImage" apps/mobile/src` → пусто.
- [ ] **Шаг 8:** коммит `fix: prepare story and gallery photos through one pipeline`.

### Task 4: Упрощение черновика и редактор истории на токенах

**Files:**
- Create: `apps/mobile/src/features/sellers/story-local-draft.ts` (перенос чистых
  функций черновика), `apps/mobile/src/features/sellers/product-draft-story.spec.tsx`
  (owner-спек шага истории)
- Modify: `product-draft-images.tsx`, `use-product-story-editor.ts`,
  `product-block-actions.tsx`, `product-draft-story.tsx`, шаги `ProductDraftStoryStep`,
  `ProductDraftReviewStep`, `PrivateStoryImage`
- Test: `use-product-story-editor.spec.ts`, спеки старой сетки,
  `product-draft-screen.characterization.spec.ts`, `theme.spec.ts`

**Reuse:** токены `packages/design-tokens`; примитивы `src/components/ui`;
`StyleSheet.create`.

**Interfaces:**
- Produces: `story-local-draft.ts` экспортирует `storyDraftKey`,
  `storyDraftRecoveryKey`, `storedBlocksOf`, `draftTextOf`, `restoreV2`,
  `moveStoredDraft`, схему черновика с `v: z.literal(2)`;
  `ProductBlockActions` принимает `variant: 'story' | 'tile'`;
  проп `authEpoch` вместо `sessionEpoch`; хук отдаёт `canAddText`, `canAddImage`.

- [ ] **Шаг 1: падающий owner-спек шага истории** (`product-draft-story.spec.tsx`):
  первый символ в виртуальном блоке создаёт абзац с тем же ключом и держит фокус;
  «добавить» выключено на лимитах; при загрузке ввод включён, тулбар выключен.
- [ ] **Шаг 2:** FAIL (или PASS там, где Task 3 уже обеспечил — отметить).
- [ ] **Шаг 3:** удалить старую сетку в `product-draft-images.tsx` (~581–736),
  `photoCards` обязательный, удалить `uploadFiles`/`UploadImageState`/`'queued'`;
  спеки старой сетки передают `photoCards`.
- [ ] **Шаг 4:** перенести чистые функции в `story-local-draft.ts`; удалить
  `restoreLegacy`, `storyDraftLegacyKey`, ветку миграции ключа, `optional` у `v`;
  удалить legacy-случаи в `use-product-story-editor.spec.ts`, остальные не менять.
- [ ] **Шаг 5:** `ProductBlockActions` → `variant`; геометрия внутри компонента.
- [ ] **Шаг 6:** `product-draft-story.tsx`: inline-стили → `StyleSheet.create` с
  токенами; лимиты — из хука; дубли подсчёта удалить; переименовать `sessionEpoch`.
  Визуально ничего не меняется.
- [ ] **Шаг 7:** литерал `10` → `WORK_PHOTO_LIMITS.maxPhotos` (пикер, `addSelection`, шаг).
- [ ] **Шаг 8:** PASS; `rg "'queued'|uploadFiles|sessionEpoch|restoreLegacy|storyDraftLegacyKey|presentation=|menuVisible|triggerFrame" apps/mobile/src` → пусто;
  `rg -c "style=\{\{" apps/mobile/src/features/sellers/product-draft-story.tsx` → 0;
  скриншоты редактора истории 390 px до/после совпадают; дифф задачи отрицательный.
- [ ] **Шаг 9:** удалить хвост проверок геометрии в `e2e/work-media-lifecycle.spec.ts`,
  которые дублируют скриншот (оставить один скриншот на состояние).
- [ ] **Шаг 10:** коммит `refactor: simplify story draft and move editor styles to tokens`.

## Ветка и документы

### Task 5: Основная ветка `main`

**Files:** Modify: `.github/workflows/verify.yml`, `.github/workflows/production-deploy.yml`.

- [ ] **Шаг 1:** `git log feature/photo-workflow..origin/main` — перечислить
  уникальные коммиты `origin/main` и подтвердить, что их содержимое уже в ветке.
- [ ] **Шаг 2:** заменить `feature/portfolio-mvp-release` на `main` в трёх местах
  (Facts). `rg "portfolio-mvp-release" .github deploy` → пусто.
- [ ] **Шаг 3:** записать в отчёт команды для основателя (агент их не выполняет):

```bash
git switch main && git reset --hard fix/photo-story-hardening   # после ревью W0
git push --force-with-lease origin main
# GitHub → Settings → Default branch: main; Cloudflare Workers CI branch: main
git branch --merged main | grep -v '^\*\|main' | xargs git branch -d
git push origin --delete feature/portfolio-mvp-release            # после зелёного деплоя с main
```

  Не удалять ветки с непомёрженными коммитами; `archive/commerce-v1` оставить
  (справочник для W3).
- [ ] **Шаг 4:** `.env.example` и `scripts/doctor.mjs` называют `JWT_SECRET`,
  который API не читает; заменить на `SESSION_SECRET` и `OTP_HASH_SECRET`
  (`apps/api/src/core/config/env.ts`), только имена без значений. В README —
  `SEED_ADMIN_PASSWORD` вместо `SEED_ADMIN_PASSWORD_HASH` (так читает сид).
- [ ] **Шаг 5:** коммит `ci: use main as the release branch`.

### Task 6: Документы и полная проверка

**Files:** Modify: `docs/product/12-DECISION-LOG.md`, `docs/product/11-PROJECT-STATUS.md`,
`docs/product/10-CODE-ARCHITECTURE.md`, `docs/design/04-DESIGN-STATUS.md`.

- [ ] **Шаг 1:** журнал — запись «Story/Work photo limits unified», следующий
  свободный номер, `Revises: DEC-116` (вход истории 10 MiB, бюджет 20 MiB удалён).
- [ ] **Шаг 2:** статус — одна запись, фото `Partial` (открыты `DEC-112`, CDN
  истории, native); архитектура — только инварианты лимитов и холдов; дизайн-статус —
  редактор истории на токенах.
- [ ] **Шаг 3:** проверки (вывод в отчёт):
  `pnpm --filter @bidplace/contracts --filter @bidplace/api-client --filter @bidplace/api --filter @bidplace/mobile typecheck` и `lint`;
  API unit + интеграция (`author-story-catalog`, `work-media-http`, `media-lifecycle`,
  `product-write-atomicity`, `upload-safety`) на `bidplace_e2e`; mobile unit полностью;
  e2e `playwright.media.config.ts` (истории) + `product-story-revision.spec.ts` +
  `local-draft-restore.spec.ts`, Chromium и WebKit; `pnpm --filter @bidplace/mobile build:web`;
  `git diff --check`; `pnpm docs:link-check`.
- [ ] **Шаг 4:** коммит `docs: record unified photo limits`.

Не трогать (регрессионные ворота): save-race, route-guard, browser-sentinel,
local-draft-restore e2e, `product-story-revision.spec.ts`, publish/revoke CDN e2e,
удаление EXIF, magic-byte policy, admission cap, `media-lifecycle.integration.spec.ts`.

## Промпт исполнителю

```text
Работай в /Users/yayauheny/projects/bidplace. Создай ветку fix/photo-story-hardening
от feature/photo-workflow. Прочитай AGENTS.md, docs/launch/AGENT-RULES.md и целиком
docs/launch/waves/W0-photo-and-trunk.md — это план. Выполни его через
subagent-driven-development (или executing-plans), задачи Task 1 → Task 6 по
порядку, шаги TDD как написаны, один коммит на задачу. Перед каждой задачей
перепроверь Facts. Ничего сверх задач. Push/merge/deploy не делать. Отчёт по
AGENT-RULES §6.
```

## Промпт ревьюеру

```text
Прочитай docs/launch/AGENT-RULES.md §7 и docs/launch/waves/W0-photo-and-trunk.md.
Ревью ветки fix/photo-story-hardening против feature/photo-workflow. Сам выполни
команды приёмки (rg, тесты) каждой задачи и проверь Review Focus. Вердикт по
AGENT-RULES §7.
```

Инварианты:
- один путь подготовки фото на клиенте: `rg "manipulateAsync|ImageManipulator|canvas" apps/mobile/src -g '!lib/media/**'` → пусто;
- одна таблица входных лимитов на сервере; история и галерея идут через один `process()`;
- холды истории снимает только сервер и только в транзакции сохранения;
- миграций нет, `nextAttemptAt` не обнуляется, аватар не изменён.

Красные флаги: новый сервис или слой загрузки; объединение `ImagesService` и
`MediaLifecycleService`; ослабленные или удалённые тесты из «не трогать»; `catch`
без обработки; изменения вне `apps/api`, `apps/mobile`, `packages/contracts`,
`packages/api-client`, `.github/workflows` и документов задачи 6; визуальная
разница редактора истории.
