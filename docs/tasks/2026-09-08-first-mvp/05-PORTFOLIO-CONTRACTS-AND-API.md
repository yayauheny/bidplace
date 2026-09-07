# Промт 05 — author, Work и discovery contracts/API

Рекомендуемый исполнитель: сильный product backend/full-stack агент.
Обязательные skills: `nest` и `security`.
Ветка: `feature/portfolio-api-contracts`.

## Готовый промт

Ты работаешь в `/Users/yayauheny/projects/bidplace`. После принятия пакетов 01–04
реализуй F08, F09 и F10: portfolio-only server contracts и API для author application/profile,
Work creation/cabinet и public discovery. В этой задаче не делай финальный Figma UI.
Не merge и не создавай PR.
Начни с clean актуальной `main`, запиши её SHA и создай указанную feature branch.

### Цель и критерии успеха до реализации

Сначала запиши concrete before/after, affected contracts и критерии успеха:

- visitor без аккаунта получает Home, Works, Authors, Creator и Work только с approved
  public data, server pagination/filter/sort и без Listing/price/timer/Bid/Order;
- author candidate создаёт resumable application с required/optional fields RFC §8;
- approved author создаёт Work тремя логическими шагами RFC §10, сохраняет draft,
  выбирает cover, отправляет/переотправляет на moderation, скрывает/возвращает Work;
- история создания в MVP — одно optional plain-text field; photo/text stages остаются
  в post-MVP code/backlog и не показываются как обязательный UI/API contract;
- structured socials различают Telegram, Instagram, website; auth email private;
- achievements имеют year/date, text и optional image; public только approved profile;
- chips сохраняются как public data, но не кликабельны до post-MVP tag discovery;
- все DTO/Zod contracts, API client, services и tests используют один vocabulary Work,
  даже если внутреннее имя `Product` временно сохраняется ради migration.

### Обязательное чтение и baseline

Прочитай AGENTS, RFC полностью, `DEC-082`–`DEC-084`, architecture, status, design flows,
readiness audit и результаты 01–04. Проинвентаризируй `sellers`, `products`, `images`,
`categories`, `discovery`, `admin`, Prisma, contracts и api-client. Проверь реальные
routes из controllers. Не копируй поля из экспериментальных mock data и screenshots:
источник структуры — RFC и подтверждённый Figma scope.

### Сравнение решений

- **Durable fix:** domain/public projection отделены от persistence model; reusable
  query DTO, cursor/page contract, explicit public/private mappers и thin controllers.
- **Acceptable workaround:** оставить route segment `/products` и внутреннее имя
  Product до отдельной migration, если public contract последовательно говорит Work и
  это явно документировано.
- **Hack:** client-side filtering/sorting, возвращать огромный private entity и скрывать
  поля в UI, подменять отсутствующий API fixture data — запрещено.

Выбери минимальный durable путь без массового rename, если rename не даёт launch value.

### Требуемое поведение

1. **Auth/application:** только email/password/verification/recovery. General buyer
   registration value, OAuth и magic code не добавлять. Незавершённая author application
   сохраняется.
2. **Author profile:** profile photo, public name, unique slug, country/city, bio,
   discipline/tag; optional practice, socials, achievements. Публичные существенные
   изменения используют lifecycle/revision invariant из пакета 02.
3. **Work draft:** gallery and cover; title; category; dimensions; material/technique;
   edition fact/quantity label; year/date; optional plain-text story. Не требовать
   price, currency, sale duration, delivery, packaging или buyer contact.
4. **Cabinet:** owner lists statuses Draft, Pending, Changes requested, Published,
   Hidden, Rejected; получает actionable moderation message, может continue/edit,
   submit/resubmit/hide/unhide.
5. **Home:** optional curator selection скрывается, если реальной selection нет; New
   Works и New Authors используют public approved data.
6. **Works:** text search по поддерживаемым public fields, category/material filters,
   newest/oldest, server pagination.
7. **Authors:** search name/slug, tag/city filters, name/added sort, server pagination.
8. **Creator/Work:** public profile tabs Works/About; Work gallery, share URL, facts,
   conditional story/details, related works. Public email/private moderation data
   отсутствуют.

### Contract quality

Для каждого endpoint укажи auth, request, response, pagination, stable error codes,
empty/not-found behavior и cache implications. Public responses валидируй contracts.
Не обещай identity/authenticity verification. Не включай commerce fields даже `null`.

### Tests и проверки

Unit/contract/integration tests должны покрыть required/optional validation, slug
uniqueness, public/private projections, moderation visibility, cursor/filter/sort,
empty curator section, draft autosave/idempotent updates, cover ordering, resubmit/hide,
plain-text story и отсутствие commerce fields. Добавь negative permission tests.

```bash
pnpm db:generate
pnpm --filter @bidplace/database build
pnpm --filter @bidplace/contracts test
pnpm --filter @bidplace/contracts typecheck
pnpm --filter @bidplace/api-client typecheck
pnpm --filter @bidplace/api test
pnpm --filter @bidplace/api test:integration
pnpm --filter @bidplace/api typecheck
pnpm --filter @bidplace/api lint
pnpm --filter @bidplace/mobile typecheck
pnpm build
```

Не писать broad e2e, который тестирует будущий дизайн. Можно добавить API-level smoke
для полного author→moderation→public Work flow.

### Не входит

Не реализовывать цены, auctions, archive, cart, likes, notification center, clickable
chips, photo/text creation steps, AI или payments. Не переделывать UI визуально. Не
трогать Figma/`.pen`.

### Документация и Git

Обнови architecture, status и user-flow docs по фактическому contract. RFC не менять,
если реализация ему следует. Раздели commits на contracts/schema, author/Work API и
discovery, чтобы review был управляемым; формат `implement feature:`. Верни общий
отчёт, endpoint matrix, migration notes, tests и sample response field lists без
реальных данных.
