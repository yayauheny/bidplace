Аудит без правок исходников. Исходник правды — HEAD 70c5fd5 (fix/work-final) плюс явно помеченные отличия грязного дерева. Исторические Implemented и старые test counts не считал доказательством.

Критерии успеха
Карта владельцев: format → schema, product rule → domain/service, storage → DB.
Конкретные расхождения frontend/backend и PATCH/null/empty.
Доказанные дубли без ослабления server validation.
План сокращения на установленных Zod 3 / RHF 7 / @hookform/resolvers 5.
База
HEAD: 70c5fd5 docs: accept mobile discovery launch
Ветка: fix/work-final
Working tree: грязный (CORS, seed fixtures, product-draft-write.ts и др.). Контракты/api-client в diff нет.
Ориентир: portfolio MVP, mobile web 390, без сделок (DEC-082–DEC-087, DEC-089).
scripts/setup: нет; деструктивный seed/migrate/reset не запускались.
Skills: review, security, nest, ui.
План: index → foundation/status/architecture/RFC/security → contracts → client → Nest parse/map → формы/URL → изолированные доказательства.

Карта владельцев контрактов
Граница	Владелец	Факт
HTTP JSON in/out
packages/contracts
Zod .strict(), barrel src/index.ts
Request parse
parseBody / parseQuery
Одинаковые safeParse → VALIDATION_ERROR
Product rules (publish)
missingProductApprovalFields
title + category + ≥1 image; не uniqueness
Seller submit rules
assertProfileRevisionReadyToSubmit
slug, discipline, fullName, country, city, bio, photo
Persistence enums
Prisma + parse*Status
Listing parser жив только в тестах
Storage limits
Prisma VarChar/Text
Часто нет зеркала в Zod
Response gate
service/mapper .parse + client schema.parse
Несовместимый ответ → unexpected_response
Public Work/Author
portfolio.ts + toPortfolioAuthor
socialLink/handoff срезаются
Owner seller
seller-profile.ts
handoff + socialLink
Dead public seller
publicSellerProfileSchema
Нигде не импортируется
Catalog URL
portfolio-*-query.ts + Expo setParams
Не сырой URLSearchParams в UI
Query wire
request.normalizeQuery
URLSearchParams, массивы через ,
Auth UI
RHF + локальные Zod
Не compose из contracts
Seller/Work UI
useState + ручные ошибки
Не RHF
Полный путь (пример Work):
форма product-draft-screen → toProductWriteInput / HEAD inline → productWriteRequestSchema.parse → POST/PATCH /api/products → parseBody → ProductsService → Prisma → toProductResponse → client productResponseSchema → UI.

Публичный Work: GET /api/works/:id → getPortfolio → toPortfolioWorkItem (без packaging/handoff/socialLink) → portfolioWorkDetailResponseSchema.

Существенные находки
D1 — P0 — подтверждено
Нельзя очистить public URL профиля: FormData выбрасывает null

Где: packages/api-client/src/request.ts:111-113; apps/mobile/src/features/sellers/seller-profile-screen.tsx:159-162; packages/api-client/src/sellers.ts:51-64; apps/api/src/sellers/sellers.service.ts:113-120; схема sellerProfileUpdateRequestSchema packages/contracts/src/seller-profile.ts:180-183.
Проблема: UI шлёт socialLink/telegramUrl/instagramUrl/websiteUrl: trim() || null. Схема принимает null (= очистить). asFormData пропускает null/undefined. Сервер трактует отсутствие ключа как «не менять».
Сценарий: автор стирает сайт и сохраняет → поле остаётся.
Последствия: расхождение UI/API; пользователь не может убрать публичную ссылку.
Доказательство: тот же цикл, что в request.ts, в изолированном скрипте: payload { socialLink: null, telegramUrl: null, websiteUrl: 'https://example.com' } → в FormData уходят только slug, websiteUrl. HTTP PATCH не гонялся. optional-socials.integration.spec.ts проверяет create/omit и reject '', не clear через PATCH.
Контраргумент: '' сознательно отвергнут; omit на create = null — верно. Сломан именно update clear. FormData не умеет JSON null — это ограничение стандарта, не баг Zod.
Durable fix: один JSON-part (payload) + файл, как рекомендует multipart; либо z.preprocess пустой строки → null только на multipart (Zod: preprocess до .min(), не .transform() после). Не ослаблять HTTPS-проверку.
Упростить: убрать ручной || null после фикса транспорта.
Риск / проверка: M; до MVP. Integration: create с URL → PATCH clear → owner null, public без ключа.
D2 — P1 — подтверждено
PATCH Work: часть полей очищается, часть нет

Где: packages/contracts/src/product.ts:87-105; apps/api/src/products/products.service.ts:149-208; HEAD product-draft-screen.tsx:140-146; dirty product-draft-write.ts:21-34.
Проблема: technique|materials|dimensions|weight|year|creationIntro — .nullable().optional(); condition|uniqueness|provenance|city|packaging|deliveryInfo — только .optional() (null/'' → 400). Сервис пишет только !== undefined.
Сценарий: стереть uniqueness/city → клиент шлёт undefined → старое значение живёт. Стереть technique → null → очистка.
Доказательство: изолированный parse: { uniqueness: null } fail, { technique: null } ok. HEAD и dirty мапят uniqueness/condition/city через || undefined, technique через || null.
Контраргумент: «нельзя очистить title» нормально (publish требует title). Для uniqueness/city это дыра, не вкус.
Durable fix: один helper в contracts: absent | non-empty | null. UI: empty → null только для явно очищаемых полей. Publish rules оставить в product-requirements, не в Zod.
Риск / проверка: M; до MVP. Unit schema + HTTP PATCH clear uniqueness.
D3 — P1 — подтверждено
Write-схемы не зеркалят DB length → риск 500

Поле	Zod	Prisma
User.displayName
min(1)
VarChar(120)
User.phone
min(1), без max
VarChar(32)
SellerProfile.slug
regex, без max
VarChar(120)
Product.title
min(1)
VarChar(200)
uniqueness / dimensions / condition / weight / city
min(1)
240 / 240 / 120 / 120 / 160
Где: packages/contracts/src/user.ts:14-30, primitives.ts:11-15, product.ts:88-102; packages/database/prisma/schema.prisma:86-89, 112-126, 216-226.
Проблема: format/storage limit должен быть в schema. Сейчас oversized проходит Zod и падает в Prisma. P2000 не мапится (prisma-error.ts знает только P2002/P2034) → ApiExceptionFilter → internal_error.
Доказательство: изолированный parse: title 201, displayName 121, phone 33, slug 121 — все success. HTTP/Prisma не гонялись (гипотеза по статусу 500, схема — подтверждено).
Контраргумент: длинные Text-поля (story, practice) без max — нормально. Нельзя тащить publish-rules в Zod.
Durable fix: .max() по колонкам на write (+ response, если хотим fail-closed). Не поднимать лимиты «на всякий случай».
Риск / проверка: S–M; до MVP. Unit + один integration oversized title.
D4 — P1 — подтверждено
«Тираж» обязателен в UI, опционален на сервере, не очищается

Где: HEAD и dirty product-draft-screen.tsx:271-279; product-requirements.ts:7-16; product.ts:98.
Проблема: UI блокирует шаг деталей без uniqueness. Submit/API требуют только title + category + images. RFC §10 перечисляет тираж как поле деталей, не как publish-gate. Пустое поле нельзя отправить как null (D2).
Сценарий: обход UI создаёт published Work без тиража; в UI тираж, однажды записанный, не стереть.
Контраргумент: более строгий UI допустим. Тогда это продуктовое правило и ему место в missingProductApprovalFields + тест, не только в экране.
Durable fix: founder: либо uniqueness в domain submit, либо убрать UI-required. Clear — через D2.
Риск / проверка: S (решение) / M (если publish-rule); до MVP.
D5 — P1 — подтверждено
Auth-формы дублируют contracts; empty phone и email preprocess

Где: apps/mobile/src/features/auth/schemas.ts:3-45 vs user.ts:22-38, auth.ts:31-35; auth-form.tsx:152, 225-239; auth.service.ts:31-37, 58-59.
Проблема:
Login/register/forgot заново задают email/password вместо compose + error map.
phone: '' (default) не проходит .min(1); omit — проходит. Форма фактически требует телефон; API — нет. S4 пишет, что rule не меняли — код и статус расходятся.
forgotPasswordRequestSchema: .email().transform(trim/lower) — в Zod 3 transform после check, поэтому ' user@example.com ' отвергается. Login/register не lowercasят; сервис делает normalizeEmail.
Доказательство: изолированный parse: phone '' fail, omit pass; padded login/forgot email fail; User@Example.COM на forgot → user@example.com.
Контраргумент: отдельные form-схемы ради русских сообщений — ок. Дублировать правила — нет. Official: z.preprocess / pipe transform→schema; RHF zodResolver(sharedSchema, { errorMap }).
Durable fix: loginFormSchema = loginRequestSchema + errorMap; register: preprocess '' → undefined если phone остаётся optional; либо явно required + sellerPhoneHandleSchema / max 32. Forgot: preprocess(trim/lower, z.string().email()).
Упростить: удалить schemas.ts поля, которые копируют contracts; оставить только confirmPassword.
Риск / проверка: S–M; до MVP. Не ослаблять password.min(8).
D6 — P2 — подтверждено
Мёртвый publicSellerProfileSchema с socialLink

Где: packages/contracts/src/seller-profile.ts:68-110 (единственное вхождение символа); seller-profile.mapper.ts:122-160; portfolio.service.ts:302-344; architecture 10-CODE-ARCHITECTURE.md:32-35.
Проблема: документ: socialLink owner-only, нет в public author DTO. Живой HTTP это соблюдает (toPortfolioAuthor не копирует, seed-contract/optional-socials проверяют). Схема-«public» и helper toPublicSellerProfile всё ещё несут socialLink.
Последствия: следующий вызывающий helper на HTTP снова засветит owner field.
Контраргумент: текущие /api/authors безопасны. Это landmine, не активная утечка.
Durable fix: удалить publicSellerProfileSchema или сделать alias на portfolioAuthorSchema; убрать socialLink из toPublicSellerProfile / publicSellerProfileSelect.
Риск / проверка: S; до MVP. Grep + существующие public JSON тесты.
D7 — P2 — подтверждено
Commerce leftover в живых contracts/error mapping

Где: enums.ts:28-47; primitives.ts:16-27 (moneyAmountSchema/currencyCodeSchema — только определение); error.ts:17-27, 59-63; api-client/src/errors.ts:44-58; api-exception.filter.ts:50-61; persistence-value.parsers.ts:104-115 (только spec).
Документы: 10-CODE-ARCHITECTURE.md:78 — Prisma enums до P4; 184-186 — bid codes остаются. Расхождение: money-схемы и parseListingStatus не нужны даже для P4 inventory.
Контраргумент: удалять LISTING_STATUSES до P4 нельзя (Prisma). Bid codes в apiErrorCodeSchema — сознательный fail-closed для старых клиентов.
Durable fix: сейчас удалить unused money primitives + parseListingStatus (+ spec). Bid codes / listing enums — после P4, отдельным PR.
Риск / проверка: S сейчас / L на P4; money — опционально до MVP, enums — после MVP.
D8 — P2 — подтверждено
Seller/Work формы копируют RHF; server fieldErrors не доходят до полей

Где: seller — seller-profile-screen.tsx:85-88, 265-293, profile-validation.ts; work — product-draft-screen.tsx:70-143, 262-279; errors — lib/errors.ts:22-62 (validation показывает error.message, обычно английский Request validation failed, не details.fieldErrors).
Проблема: RHF + resolver уже стоят и используются только в auth. Профиль: ручной touched/step/canSave. Slug не проверяется slugSchema (только trim()). Work: ручные required. Валидация сервера не раскладывается по полям.
Контраргумент: wizard + photo blob не обязаны быть одним useForm. Не тащить publish-rules в Zod.
Durable fix: zodResolver(sellerProfileCreateRequestSchema) / write schema + preprocess empty; field errors из VALIDATION_ERROR.details. Photo — отдельное поле RHF.
Упростить: getProfileFieldErrors оставить только как тонкую обёртку над contract schemas (уже почти так для URL).
Риск / проверка: M; до MVP для slug/fieldErrors, после MVP полный RHF wizard.
D9 — P3 — подтверждено
Одинаковые ok / parse helpers / achievement shapes

z.object({ ok: true }) в api-client/src/auth.ts:16-19, images.ts:6, products.ts:57, password-reset.controller.ts:15, плюс portfolioOkResponseSchema / adminOkResponseSchema.
parseBody ≡ parseQuery; portfolio query идёт через parseBody (portfolio.controller.ts:54-76).
Achievement image: portfolio.ts:11-26 и seller-profile.ts:86-110.
portfolioAuthorApplicationSchema дублирует seller statuses (portfolio.ts:179-185) вместо sellerStatusSchema.
Durable fix: один okResponseSchema; query только через parseQuery; один achievement schema. Не общий «BaseDTO».
Риск / проверка: S; опционально до MVP.
D10 — P2 — подтверждено
Public author URL слабее write: http проходит response schema

Где: write httpsUrlSchema primitives.ts:29-42; public portfolioAuthorSchema telegramUrl: z.string().url() portfolio.ts:59-61.
Доказательство: изолированный parse: httpsUrlSchema reject http://example.com; portfolioAuthorSchema accept telegramUrl: 'http://t.me/x'.
Контраргумент: write+DB сейчас https-only, живой ответ не должен такое отдать. Дыра — если seed/admin обойдёт write.
Durable fix: те же httpsUrlSchema на public author.
Риск / проверка: S; до MVP.
D11 — P2 — подтверждено (HEAD vs RFC vs dirty tree)
Packaging/delivery

RFC §10: нет упаковки/доставки в create flow; §11 — stub на public Work.
HEAD: форма и payload всё ещё шлют packaging/deliveryInfo (product-draft-screen.tsx:80-81, 145-146; product-draft-about.tsx:251-260).
Dirty tree + 11-PROJECT-STATUS: toProductWriteInput опускает ключи; PATCH не нуллит колонки. Схема API по-прежнему принимает их (product.ts:101-102).
Расхождение: HEAD противоречит RFC; dirty tree чинит UI, но «Implemented» в status опережает HEAD. Не выбирать молча одну версию.
Durable fix: после merge dirty — либо убрать поля из write schema (колонки до отдельного решения), либо оставить optional и не слать с клиента. Public stub не трогать.
Риск / проверка: S; до MVP.
D12 — P3 — подтверждено
Тесты, которые повторяют схему / leftover

contracts.test.ts:239-242 — listingStatusSchema «until P4».
contracts.test.ts:404-412 — BID_TOO_LOW shape при отсутствии bid HTTP.
persistence-value.parsers.spec.ts:7-8 — единственный runtime-потребитель parseListingStatus.
profile-validation.spec.ts / schemas.spec.ts — в основном echo copy, мало границы.
Полезные границы уже есть: commerce keys reject, HTTPS, facets strict, application без handoff.
Durable fix: не плодить safeParse=schema. Оставить wire/visibility/PATCH-clear/length tests.
Риск / проверка: S; опционально.
Неподтверждённые подозрения
ID	Суть	Почему не доказано
H1
Oversized title/phone даст HTTP 500
Нет integration; только отсутствие P2000 map
H2
ZodError от productWriteRequestSchema.parse в client до fetch не станет ApiClientError
Не воспроизводил в UI
H3
error.flatten() потеряет nested steps[i].title
Формы creation story не мапят fieldErrors
H4
Analytics productPublicId max 16 vs publicId 11
Слабее, не leak
H5
Create-профиль canSave без полного slugSchema
Шаги режут часть ошибок; parse всё равно на client
H6
acceptRules жив на сервере, клиента нет
Задокументировано как legal-later, не баг MVP
Недоступные проверки
PostgreSQL integration / pnpm verify / browser 390 (намеренно).
Реальный multipart PATCH clear (доказан кодом + unit-эквивалент).
Содержимое общих БД, staging inventory P4.
Native / desktop.
Чтение .env / секретов.
pnpm --filter в worktree пытался сделать install — остановлен. Тесты гнались через существующий Vitest, без install в checkout.

План сокращения (без ослабления server validation)
Один write-патч контракт: undefined skip, null clear, '' reject. Preprocess empty→null по official Zod 3.
Multipart: JSON payload + file. Не изобретать codec.
Формы: compose @bidplace/contracts + zodResolver + errorMap. Новые схемы только для UI-only (confirmPassword).
Длины: Zod .max() = Prisma. Publish-rules остаются в service.
Удалить мёртвое: publicSellerProfileSchema, money primitives, локальные ok duplicates, parseListingStatus.
Не удалять до P4: listing/order enums, bid codes в apiErrorCodeSchema.
Не делать: общий validation bus, новая библиотека, «всё в Zod», ослабление HTTPS/handoff/server parse.
Приоритетные действия
Починить clear public URL (D1) — иначе optional socialLink лжёт.
Выровнять PATCH Work + uniqueness owner (D2, D4).
Поставить DB max в write schemas (D3).
Свести auth forms к contracts + preprocess phone/email (D5).
Убрать landmine publicSellerProfile / http public URL (D6, D10).
Закоммитить/не закоммитить packaging omit явно относительно HEAD (D11).
Разумно оставить
Двойной response .parse (Nest + client) — правильный fail-closed.
Discovery mappers + URLSearchParams join/split для materials.
Public portfolio DTO без listing/price/bid (тесты это держат).
unexpected_response без утечки Zod issues клиенту.
Listing enums до P4.
Server GET/POST /api/auth/rules до legal UX.
Auth уже на RHF — не переписывать ради единообразия.
Проверенные области
Весь packages/contracts и packages/api-client.
Nest parse/map: products, sellers, portfolio, auth, admin, images, analytics, password-reset.
Mobile: auth RHF, seller profile, product draft (HEAD + dirty), catalog URL, error mapping.
Prisma limits vs Zod.
Документы: index, foundation, status (актуальные срезы), architecture, RFC, security, DEC-082–089.
Команды и ограничения
git rev-parse HEAD                    # 70c5fd5, dirty tree
# isolated worktree 70c5fd5 + symlink node_modules (удалён после)
node .tmp/prove-contracts.mjs         # 19 PASS (email/PATCH/FormData/lengths)
vitest run  packages/contracts        # 25/25 (worktree, без pnpm install)
pnpm test   packages/api-client       # 3/3 (чистый пакет в main, read-only)
Не запускались: pnpm verify, lint/typecheck graph, API unit/integration, mobile tests, Playwright, seed, migrate.

Ограничения: dirty tree не мой; общие БД не трогал; пакеты не ставил; канонические docs/Pen/Figma не менял. Старые commerce-аудиты и «Implemented» в status не принимал как proof — где код и документ расходятся (phone S4, packaging HEAD vs status, money schemas vs «enums until P4»), это указано явно.

Дополнил отчёт по результатам Map frontend validation и Map server validation. Код не менял.

Большая часть их карты совпала с уже отданным аудитом (FormData/null, phone '', PATCH uniqueness, auth Zod-дубли, fieldErrors, parseBody на query). Ниже только то, что они подняли, а я перепроверил по исходникам.

D13 — P2 — подтверждено
POST /api/auth/rules/accept не совпадает с response schema

Контракт: acceptRulesResponseSchema = { ok: true } (packages/contracts/src/rules.ts:29-33).
Сервер возвращает authResponseSchema.parse({ user }) (apps/api/src/auth/auth.service.ts:174-176, контроллер auth.controller.ts:122).
Клиента нет: createApiClient().auth без acceptRules (packages/api-client/test/client-composition.test.ts:40).
Сценарий: если legal UX вернёт клиента с acceptRulesResponseSchema, schema.parse даст unexpected_response на валидный { user }.
Контраргумент: 11-PROJECT-STATUS уже пишет, что client acceptRules удалён до legal UX. Это не живой MVP-путь, но контракт уже врёт.
Fix: либо сервер { ok: true } + acceptRulesResponseSchema.parse, либо сменить контракт на { user } и вернуть метод в api-client. Не держать оба.
Размер / когда: S; после MVP / вместе с legal UX. Не трогать, если endpoint остаётся неиспользуемым до решения.
Это усиливает прежний H6: не только «клиента нет», а ещё и несовпадение формы ответа.

D14 — P3 — подтверждено
product-draft-creation.tsx нигде не подключён

Файл есть (apps/mobile/src/features/sellers/product-draft-creation.tsx:53), импортов в apps/mobile нет.
Живой wizard пишет одно поле story через product-draft-story.tsx (RFC §10: одно plain-text поле).
API PUT /creation и steps остаются; UI их не вызывает.
Контраргумент: RFC §15 прямо откладывает process-step builder. Это не баг поведения.
Fix: удалить экран или явно пометить как post-MVP. Не подключать без продуктового решения.
Размер / когда: S; опционально (меньше кода).
D15 — P3 — подтверждено
AUDIT_TARGET_TYPES без Prisma USER

Prisma: SELLER_PROFILE | PRODUCT | ORDER | LISTING | USER (schema.prisma:74-80).
Contracts: без USER (packages/contracts/src/enums.ts:57-62).
HTTP-схемы audit target не экспортируют; риск только если появится публичный audit DTO или parseEnum по контракту.
Fix: добавить USER в contracts, когда audit выйдет в HTTP; до того — не раздувать API enum.
Размер / когда: S; после MVP / с audit API.
Что не поднимаю в новые дефекты
Непровалидированный { ok: true } — литерал; клиент всё равно парсит. Это тот же D9 (дубли схем), не отдельная дыра.
Prisma status as ProductStatus — после typed Prisma, не скрывает HTTP mismatch.
Невалидированные @Param — 404 от сервиса; не ослаблять ради Zod на UUID в каждом роуте.
Карта владельцев, D1–D12 и план сокращения без ослабления server validation остаются в силе. Приоритет по-прежнему D1 (clear URL) и D2/D4 (PATCH Work / uniqueness).