# Bidplace: исследование и передача auth/media — 2026-10-22

Статус: исследование и согласованный архитектурный выбор; реализация не начата.

## Точка продолжения

- Репозиторий: `/Users/yayauheny/projects/bidplace`.
- Исследовательский checkout: `/tmp/bidplace-ui-review-completion`.
- База исследования MVP: `e024d91d`; перед реализацией fetch и сверить актуальный remote.
- Основной checkout занят `refactor/docs-deep-cleanup`; не переключать и не изменять чужую работу.
- Ветка этого документа: `feature/auth-media-investigation`.
- PR56: https://github.com/yayauheny/bidplace/pull/56 ; OPEN, head `aff5ddfc`.
  Общая база PR56 и исследованной MVP — `334d9ba6`. PR пока не влит.
- На проверенном head PR56 GitHub verify и GitGuardian SUCCESS. Это не доказательство
  реального HEIC/native smoke и не новая проверка его интеграции с MVP.

## Подтверждено основателем в этом чате

1. Сначала web, включая браузер телефона; native iOS/Android отдельно.
2. Реальный email обязателен. Telegram не возвращает email: его нужно запросить
   и подтвердить; никакой подстановки фиктивного адреса.
3. Совпадение email не объединяет аккаунты автоматически. Только явная привязка
   после аутентификации существующего аккаунта.
4. Social-вход не требует придумывать пароль.
5. Реальных production-пользователей нет: не создавать второй legacy-auth ради
   сохранения старых сессий. Это не разрешение удалять БД, работы и медиа.
6. Платные auth-сервисы исключены; решение должно соответствовать текущему Cloudflare.
7. Итоговый выбор: один NestJS-контейнер + готовые серверные сессии PostgreSQL + OIDC.
   Не Ory/Keycloak, не SaaS, не полный переезд на Better Auth.

## Архитектура реализации

- `express-session` — SID, подписанная HttpOnly cookie, regenerate/save/destroy.
- `connect-pg-simple` — долговечное хранение и проверка expiry в существующем Postgres.
- `openid-client` v6 — общий OIDC-клиент Google и Telegram: discovery, PKCE,
  nonce/state, обмен кода и проверка ID token. Никакой собственной JWT/JWKS-криптографии.
- Nest + Prisma — аккаунты, роли/статусы, согласия, nickname, provider identities,
  onboarding, явная привязка, ограничения рассылок и правила доступа.
- Удалить собственный JWT issuer после переключения всех читателей/тестов;
  отдельный `jose` для application JWT в выбранной архитектуре не нужен.
- Это готовые auth-примитивы, а не полный auth-движок: прикладные правила остаются нашими.
- Проверенные кандидаты: express-session1.19.0, connect-pg-simple10.0.0,
  openid-client6.x. Node22.20 подходит; точные версии и CJS/TS/build нужно подтвердить
  коротким исполняемым compatibility spike до изменения основного auth.

## Что обнаружено в коде

| Область | Факт и последствия | Решение |
| --- | --- | --- |
| JWT | `apps/api/src/auth/auth-token.service.ts` вручную собирает и проверяет HS256/base64url. Это обязанность поддержки протокола, не доказанная уязвимость | Заменить application JWT готовыми серверными сессиями |
| Social | `apps/mobile/src/features/auth/auth-form.tsx:482` и495 показывают только уведомления-заглушки | Подключить реальные потоки через существующие FigmaButton/AuthViewport |
| User | Prisma `User.email` и `passwordHash` обязательны; внешней identity-связи нет | Настоящий email сохранить; отсутствие password credential выразить явно; уникальный provider/issuer/subject |
| OTP | `OtpService` и `AuthAbuseService` работают с уже существующим userId | До кода спроектировать подтверждение email в ограниченном onboarding-контексте; нельзя просто вызвать существующий OTP до создания User |
| Фото | PR56 добавляет Expo ImageManipulator и типизированные ошибки, только для портрета | Не дублировать исправления; сначала интегрировать/проверить PR отдельно |
| Artwork | `product-draft-image-actions.ts:137` параллельно читает выбранные файлы в Blob; клиентской проверки байтов до чтения нет | Добавить раннюю проверку лимитов/оставшихся мест; ограничить одновременное чтение; не применять сжатие портретов к работам |
| Ошибки | В PR56 image-upload-error.ts узнаёт часть серверных причин по английским сообщениям/regex | Отдельно стабилизировать машинные reason-коды в существующем error-контракте; не выводить произвольный server message |
| Cloudflare | Worker -> один Node Container, `sleepAfter=10m`, private Container binding, Postgres/R2 | Сессии/одноразовые OAuth-состояния не хранить только в памяти процесса; callbacks только через текущий API, no-store |

Уже есть Argon2, Sharp, R2, server-side MIME/pixel limits, media admission,
модерация/ревизии, auth epoch, guards поздних ответов. Не заменять их ради модной библиотеки.
Исследование ограничено auth/media: это не полный аудит репозитория и не security certification.

## Готовое задание следующему агенту: волны по порядку

Перед началом прочитай AGENTS, docs/AGENT-MAP, MVP/security/architecture owners,
`agent`, `security`, `nest`, `bidplace-ui`; используй ponytail и graph Verify.
Ты не один в репозитории: не откатывай чужие изменения. Код выполняй в отдельной
feature-ветке от актуальной MVP. Каждую волну закончить и проверить до следующей.

### 0. Зафиксировать базу и завершить спецификацию

Сверить текущую MVP и статус PR56. Разделить media и auth коммиты.
Не смешивать с чисткой документации или новой визуальной унификацией кнопок.
Зафиксировать таблицу endpoint/state/ownership до кода: anonymous, pending-social,
email verification, authenticated, explicit-link, cancelled/expired.
Самые важные незавершённые детали: способ переиспользования OTP до обычной
аутентификации, одноразовое потребление callback/onboarding и CSRF-защита.
Не оставлять эти решения на случайные обработчики в UI.

### 1. Закончить media на основе PR56

Проверить актуальный diff, lockfile/SDK57, error policy и сохранение selection guards.
Портрет:1600px,2MiB output,25MiB source, quality0.85; PNG по умолчанию сохраняет
прозрачность. Это параметры PR, не универсальные правила для работ.
Artwork/story: отдельная политика, без новой потери качества и изменений original/
PREVIEW/FULL, R2 publish/revoke. Согласовать расширение общей подготовки до кода.
Тесты: oversized/dimensions/corrupt/MIME/PNG/HEIC availability, retry, cancel,
selection race/logout/unmount; реальный browser file-input, не только mocks.
Неподдерживаемый HEIC показывать честно, не обещать кроссплатформенную конверсию.

### 2. Готовые сессии вместо JWT

Точки: bootstrap/main/AuthModule/AuthController/AuthService, три auth guards,
CurrentUser/rate-limit consumers, contracts, api-client, AuthProvider, Prisma,
admin revoke/password reset, Cloudflare env/CI/image checks.
Создать session-store таблицу миграцией Prisma; runtime DDL запрещён:
`createTableIfMissing:false`. PrismaClient не является pg.Pool: нужен небольшой
ограниченный pool и корректное закрытие при shutdown, без новой БД/Redis.
`resave:false`, `saveUninitialized:false`; cookie HttpOnly/Secure production,
SameSite и proxy trust по реальному Worker boundary. Успешный вход: regenerate,
назначить principal, await save, только затем redirect/ответ. Ошибка БД не успех.
Сохранить нынешнюю семантику global logout/reset/revoke через `User.sessionVersion`:
версию записывать в сессию и сверять с актуальной БД. Одного DELETE сессий
недостаточно: поздний UPSERT может воскресить строку. Роль/статус брать из БД.
Expiry проверяет store даже без pruning; sleep10m не гарантирует запуск
15-минутного cleanup-таймера. Задать простую обслуживаемую очистку, не второй scheduler.
Удалить JWT runtime, старые exports/config/fixtures после проверки всех потребителей;
переназвать principal из AuthTokenPayload, не сохранять фиктивные iat/exp для типов.
Старые malformed-bearer/optional-auth тесты перевести на новый явный контракт,
не ослабляя anonymous-public/media и invalid-credential regression coverage.

### 3. Один OIDC-поток для Google и Telegram

Один общий service с двумя конфигурациями, без двух копий протокола и Passport-слоя
только ради обёртки. Telegram — современный OIDC, не legacy iframe HMAC.
Telegram не имеет UserInfo endpoint: использовать проверенные ID-token claims.
Identity key — provider/issuer + sub, не email/username/phone/displayName.
State/nonce/PKCE, browser binding, TTL, atomic single-use и ограниченный локальный
redirectTo обязательны. In-memory map не переживает Container restart.
Не класть app/provider tokens в URL/localStorage и не сохранять refresh tokens,
если они не нужны для простого login. Не подтягивать provider avatar на сервер
как произвольный URL: это отдельная media/SSRF-граница.

### 4. Регистрация, привязка, UI

Google/Telegram existing identity -> тот же User. Новый -> только недостающие
email/ник/одно подтверждение документов через текущие формы и схемы.
Telegram email подтвердить; pending-onboarding не даёт обычный доступ к приватным
API. Никаких fake email/password. Email conflict -> вход в существующий аккаунт
и явная привязка. Привязка требует свежей аутентификации, привязана к account/session,
не к клиентскому userId. Запрет переноса чужой identity и удаления последнего
способа входа; concurrent link/signup покрыть уникальными ограничениями и тестами.
Повторный вход не просит снова регистрироваться и не перезаписывает профиль автора.
Настройки подключений переиспользуют существующие rows/dialogs. Новую композицию,
не определённую Figma, оформить intake; BackButton/FigmaIconButton не переделывать.
Сохранить auth epoch, dirty/busy guards, redirectTo, focus/resize/reduced motion,
единое подтверждение документов и неблокирующее чтение юридических страниц.
Отмена провайдера/сеть/state expired -> понятная ошибка и повтор без потери формы.

### 5. Cloudflare, тесты, удаление старого пути

Весь auth остаётся внутри имеющегося Nest Container; Worker продолжает маршрутизацию.
Согласованно обновить названия server-only env/secret bindings, env validation,
wrangler declarations, Docker image checks и CI; никаких секретов в EXPO_PUBLIC.
Auth/callback/session responses no-store; никакого публичного cache или доверия
пользовательским forwarded headers. Не добавлять SaaS, Ory, Keycloak, очереди,
вторую БД, параллельный JWT и session runtime, произвольный proxy или общий auth framework.

Проверки: login/password/reset/OTP/legal; оба OIDC через test IdP/JWKS и реальные
callback HTTP; first/returning/missing-email/collision/link; wrong state/nonce/
issuer/audience/PKCE, replay и гонки; ban/sessionVersion/reset/logout с поздним
session save; DB outage, Container restart, CSRF и open redirect, private media.
Browser Chromium/WebKit:320/390/440/768/1024/1440, resize/focus/dirty/busy,
provider cancel/retry, cookie и redirect paths. Пишущие тесты только isolated DB.
Затем affected lint/typecheck/build, `pnpm verify`, `pnpm cloudflare:check`,
production-like image/web build без утечки настроек. Не ослаблять старые guards.
Реальный Google/Telegram smoke требует безопасно настроенных credentials;
без него не объявлять продовый вход готовым. Никогда не читать/печатать .env/секреты.

Результат каждой волны: SHA, удалённые/добавленные владельцы, доказательства,
честные ограничения. Обновить architecture/security/product/design owners по
фактическому изменению; записать подтверждённые решения перед реализацией.
Не делать deploy/DB reset и не вливать ветку автоматически в рамках задания.

## Первичные источники и исследованные проекты

- [PR56](https://github.com/yayauheny/bidplace/pull/56), head aff5ddfc; CI verify39678668075.
- [Bluesky](https://github.com/bluesky-social/social-app/blob/df8ce385efaa734370ddfdbce186861bc7d40fd2/src/lib/media/manip.ts): актуальная подготовка фото/контроль выходных байтов; переносить принцип, не весь редактор.
- [Twenty UI](https://github.com/twentyhq/twenty/blob/d7499bf4ba11ed8c8a9392e02a42bb12b576e543/packages/twenty-front/src/modules/settings/components/SettingsImageInput.tsx): общий upload/error/abort UI; [Google controller](https://github.com/twentyhq/twenty/blob/d7499bf4ba11ed8c8a9392e02a42bb12b576e543/packages/twenty-server/src/engine/core-modules/auth/controllers/google-auth.controller.ts) — тонкий controller, не шаблон всей auth-архитектуры.
- [Immich](https://github.com/immich-app/immich/blob/745bdd2edf72ce0f75e748e2d68c37b6ea196cc5/server/src/repositories/media.repository.ts): Sharp/цвет/производные; не переносить workers и очереди. Bidplace уже нормализует через Sharp; отсутствие explicit ICC настройки не доказывает баг цветопередачи.
- [Expo57 ImageManipulator](https://docs.expo.dev/versions/v57.0.0/sdk/imagemanipulator/).
- [Telegram OIDC](https://core.telegram.org/bots/telegram-login), [Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect).
- [openid-client](https://github.com/panva/openid-client), [express-session](https://github.com/expressjs/session), [connect-pg-simple](https://github.com/voxpelli/node-connect-pg-simple), [Nest sessions](https://docs.nestjs.com/techniques/session).
- [Better Auth callback](https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/api/routes/callback.ts): missing email отклоняется до обычного account lookup; Google работает штатно, Telegram требует адаптации. Не предлагать fake-email plugin.
- [Ory flows](https://www.ory.com/docs/kratos/self-service/flows/user-registration): поддерживает missing traits, но добавляет identity service.
- [Статья KTS,2024](https://habr.com/ru/companies/kts/articles/870454/): полезный опыт, не benchmark нашего Cloudflare; отдельное хранение/синхронизация и внешние abuse controls — важная цена. Исторические замечания статьи проверять по текущим версиям.
- [Cloudflare Containers](https://developers.cloudflare.com/containers/); фактический владелец нашей конфигурации — deploy/cloudflare/src/index.ts и router.ts.

## Ограничения исследования

Graph Verify: проект Users-yayauheny-projects-bidplace, generation2026-10-21T20:25:53Z,
другая checkout-ветка. Проверены coverage auth/schema/provider paths; точные выводы
подтверждены чтением исходников MVP и PR56. Граф не доказывает отсутствие всех связей.
Исходники внешних проектов прочитаны по указанным SHA; дерево Twenty было truncated,
поэтому выводов о полном составе проекта нет. OIDC/SDK/store interoperability пока
не проверялось исполняемым spike; реальный вход, mobile photo smoke и production logs
не проверялись. Новые auth-библиотеки не установлены, код приложения не менялся.
