# Промт 03 — S3-compatible media boundary

Рекомендуемый исполнитель: backend/infrastructure агент.
Обязательные skills: `nest` и `security`.
Ветка: `feature/object-storage-media`.

## Готовый промт

Ты работаешь в `/Users/yayauheny/projects/bidplace`. Реализуй F03: перенеси profile,
Work gallery и optional achievement images из PostgreSQL binary columns в надёжный
S3-compatible media boundary. Сохрани Work/revision ownership, authorization, cleanup,
backup и restore. Не merge и не создавай PR.

### Критерии успеха до реализации

Сначала опиши текущий путь байтов и целевой invariant. Успех:

- PostgreSQL хранит metadata и ownership, object store — binary objects;
- provider-specific public URL не становится domain identity;
- MIME определяется по decoded content, limits применяются до опасной обработки,
  checksum/dimensions/byte size сохраняются;
- public читает только media approved public revision; owner/admin access fail-closed;
- upload/finalize/delete идемпотентны, orphan и failed upload имеют cleanup policy;
- cover/order не ломаются при revision moderation;
- backup/restore охватывает DB и objects и умеет доказать их согласованность;
- migration existing disposable/demo data описана и проверена без потери Work records.

### Обязательное чтение и inventory

Прочитай AGENTS, RFC, architecture/security/status, lifecycle result пакета 02,
`docs/ops/00-RELEASE-AND-BACKUP.md` и data inventory из пакета 04, если он уже принят.
Проверь `apps/api/src/core/image-store`, `apps/api/src/images`, image policy/url,
Prisma `SellerProfile`, `ProductImage`, `ProductCreationStep` и новую revision schema,
contracts/api-client, `expo-image`, fixtures, seed, backup/restore scripts и tests.
Не открывай `.env`; можно читать только config schema и имена параметров.

### Сравнение решений

- **Durable fix:** узкий `ImageStore`/object-store port, S3-compatible adapter,
  metadata lifecycle в DB, deterministic keys без PII, explicit finalize/cleanup и
  restore manifest.
- **Acceptable workaround:** server-mediated uploads для первого пилота, если size
  limits достаточны и direct presigned uploads не нужны для реального объёма.
- **Hack:** складывать base64/remote URLs в Work, писать файл до DB без reconciliation,
  делать bucket public целиком или удалять объект до commit — запрещено.

Сравни server upload и presigned multipart flow по сложности, памяти, mobile/web UX,
security и текущему масштабу. Выбери минимальный durable вариант. Не добавляй CDN или
image transformation service без доказанной необходимости.

### Реализация

1. Утверди media metadata/status/key model и ownership rules.
2. Добавь S3-compatible adapter с dependency injection и локальный test adapter.
   Production config валидируется fail-closed. Не логируй signed URLs/credentials.
3. Сохрани текущие upload constraints и normalization через `sharp`; устрани
   decompression/format spoofing risks.
4. Реализуй DB/object consistency: pending/final state, idempotent retry и безопасный
   orphan cleanup. Удаление объекта выполняй только после принятого DB transition или
   через retryable cleanup record.
5. Добавь migration/backfill command с dry-run/counts, resumability и checksums. Для
   disposable fixtures допустим controlled regeneration, но код пути production data
   не должен молча терять media.
6. Расширь backup/restore: manifest ключей/checksum/size, восстановление objects и
   integrity verification без вывода содержимого.
7. Обнови public media response/cache policy так, чтобы hidden/rejected media не
   становились доступны по угадываемому URL.

### Не входит

Не менять Figma/UI, не добавлять видео, AI transforms, CDN, user-controlled arbitrary
URLs и commerce-specific media. Не читать/создавать реальные production buckets.

### Tests и проверки

Unit tests: key safety, MIME/decode, limits, ownership, idempotency, cleanup, provider
errors. Integration tests: upload/finalize/read/delete, transaction failure, retry,
revision visibility, unauthorized access, migration resume, DB/object restore
integrity. Используй disposable local object store/test adapter и database.

```bash
pnpm db:generate
pnpm --filter @bidplace/database build
pnpm --filter @bidplace/contracts test
pnpm --filter @bidplace/api test
pnpm --filter @bidplace/api test:integration
pnpm --filter @bidplace/api typecheck
pnpm --filter @bidplace/api lint
pnpm ops:verify-restore
pnpm build
```

Если restore command требует внешний локальный сервис, приложи точные безопасные
шаги и результат; не объявляй gate пройденным без фактического drill.

### Документация и Git

Обнови architecture, application security, project status, data inventory и ops docs
только по факту. Добавь новые config keys в tracked example/schema без значений.
Не меняй `.pen`. Допустимы отдельные commits для boundary/migration/ops, каждый в
стандартном формате `implement feature:`.

Верни формат из `00-EXECUTION-ORDER.md`, object lifecycle diagram/table, migration
counts без PII, restore evidence и remaining provider decisions.
