# Bidplace: исследование и передача auth/media — 2026-10-22

Статус: исследование и согласованный архитектурный выбор; реализация не начата.
Основатель отдельно подтвердил: пока только планирование, не приступать к реализации.
Раздел «Промпт для передачи» исполнять после отдельной команды на реализацию.
Обновлено после продолжения: runtime compatibility spike3/3; уточнённый
контракт сессий/onboarding ниже. Проверка Prisma/TypeScript/Docker остаётся волной0.

## Промпт для передачи

Ты реализуешь auth/media Bidplace по этому документу. Начни с проверки базы и
волны0; не начинай параллельно переделывать фото, сессии и UI. После каждого
законченного этапа покажи SHA и доказательства, затем переходи дальше. В споре
между сокращением кода и сохранением прав/согласий/целостности сохраняй инварианты.
Готовые библиотеки владеют протоколом и сессией; Nest владеет доменной политикой.
Не заменяй оставшиеся неизвестные оптимистичными заглушками или самописным OAuth.
Ниже указан согласованный скоуп; произвольный выбор SaaS/нового auth-движка запрещён.
Поддержка старых JWT не нужна; переход одноразово завершает тестовые сессии,
но сохраняет id пользователей, их работы, медиа и audit/evidence. Миграция данных
и обновление seed/fixtures выполняются явно, без reset БД.

## Точка продолжения

- Репозиторий: `/Users/yayauheny/projects/bidplace`.
- Исследовательский checkout: `/tmp/bidplace-ui-review-completion`.
- База исследования MVP: `e024d91d`; перед реализацией fetch и сверить актуальный remote.
- Основной checkout занят `refactor/docs-deep-cleanup`; не переключать и не изменять чужую работу.
- Ветка этого документа: `feature/auth-media-investigation`.
- Повторная проверка22октября: remote MVP всё ещё `e024d91d`; PR56:
  https://github.com/yayauheny/bidplace/pull/56 ; OPEN/DRAFT, head `aff5ddfc`.
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
8. Вход по email-коду доступен всем зарегистрированным пользователям независимо
   от первоначального способа регистрации; пароль остаётся альтернативой.
   Привязка Google/Telegram остаётся явной. Решение: [DEC-133](../product/12-DECISION-LOG.md).

## Архитектура реализации

- `express-session` — SID, подписанная HttpOnly cookie, regenerate/save/destroy.
- `connect-pg-simple` — долговечное хранение и проверка expiry в существующем Postgres.
- `openid-client` v6 — общий OIDC-клиент Google и Telegram: discovery, PKCE,
  nonce/state, обмен кода и проверка ID token. Никакой собственной JWT/JWKS-криптографии.
- Nest + Prisma — аккаунты, роли/статусы, согласия, nickname, provider identities,
  onboarding, email-code login, явная привязка, ограничения рассылок и правила доступа.
- Удалить собственный JWT issuer после переключения всех читателей/тестов;
  отдельный `jose` для application JWT в выбранной архитектуре не нужен.
- Это готовые auth-примитивы, а не полный auth-движок: прикладные правила остаются нашими.
- Проверенные кандидаты: express-session1.19.0, connect-pg-simple10.0.0,
  openid-client6.x. Node22.20 подходит; точные версии и CJS/TS/build нужно подтвердить
  коротким исполняемым compatibility spike до изменения основного auth.

## Готовность задания и порядок исполнения

Критерий успеха: один User ID сохраняется при password/email-code/Google/Telegram,
готовые библиотеки владеют сессией и OIDC, а текущие guards, согласия, модерация,
private media и отзыв доступа продолжают работать. Приложение не содержит второго
auth runtime и двух копий OTP-политики. Исследование не разрешает деплой.

Последовательность:0 -> отдельная media-волна1 -> сессии2 -> OIDC3 ->
email-code4A -> social onboarding/link4B -> финальная проверка5.
Если PR56 ещё не готов к интеграции, явно отложить только media1 и закончить auth;
не переносить непроверенный PR целиком ради старта auth. Внутри каждой волны сначала
проверить текущих владельцев и написать необходимые регрессии, затем код и gate.
Не делать новый самостоятельный auth-framework, repository-слой поверх Prisma
или запасной механизм входа на случай непрохождения библиотечных проверок.

Нынешний MVP RFC оставляет эти способы после первого portfolio-релиза. Решение
основателя расширяет следующую auth-волну, а не объявляет её уже включённой в MVP;
см. DEC-133. Полный статус владельцев менять только вместе с реализацией.

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
Контракт этих границ зафиксирован ниже. Проверь его на реальных
типах/миграциях и исполняемом test IdP. В случае доказанной несовместимости
останови зависимую волну с конкретным объяснением; не меняй архитектуру молча.

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
`schemaName` store явно совпадает с Prisma/test schema: node-postgres не должен
молча писать в public вместо изолированной `itest_*`. Добавить регрессию изоляции.
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

### 4. Вход по коду, регистрация, привязка, UI

Сначала закончить вход по email-коду по контракту ниже и его проверки; затем
social onboarding и привязку. Не начинать несколько незаконченных auth-потоков.

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
Пароль остаётся текущим вариантом входа; код — явная альтернатива без определения
провайдера по введённой почте. Переиспользовать AuthCodeField и поля email, логику
resend/state брать с сервера. Не запускать resend в useEffect при каждом mount.
Не добавлять unlink, смену подтверждённой почты, passkeys, MFA и magic links в эту
волну: для поставленной задачи достаточно списка и явного подключения провайдеров.
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

## Уточнение волны0: минимальный контракт реализации

Это инженерная спецификация для проверки, не утверждение о существующих endpoint.
Архитектура согласована; пути/имена моделей — предлагаемые имена внутри текущих владельцев.

### Вход по email-коду

- **Durable fix, выбран:** единый способ входа по коду для существующих аккаунтов,
  независимо от наличия пароля/провайдера; пароль сохраняется альтернативой.
  Код только для Google-пользователей — отвергнутое усложнение с ветвлением по
  истории регистрации. Принимать Google email за автоматическую привязку — hack.
- Google -> почта: после успешной проверки кода выдаётся сессия существующего
  User, без повторной регистрации, создания пароля и новой ExternalIdentity.
  Почта -> Google: совпадение email предлагает подтвердить существующий аккаунт
  и явно подключить Google; после этого provider issuer+subject ведёт к тому же User.
- Неизвестная почта не создаёт аккаунт автоматически; доступна обычная регистрация
  с ником и подтверждением документов. До подтверждения владения почтой ответы
  запроса кода не раскрывают наличие аккаунта, пароля или подключённых провайдеров.
- Текущий `/auth/email/*` подтверждает email уже существующего authenticated User;
  это не endpoint входа. Ввести отдельное назначение `email_login` и ограниченные
  anonymous request/verify endpoints внутри auth, используя общие delivery/abuse
  примитивы. Коды verification/reset/login не взаимозаменяемы.
- Код привязан к назначению, попытке и текущему адресу аккаунта; одноразовый,
  с ограниченным сроком и числом проверок. Сохранить Turnstile, mail budget/quota,
  cooldown и idempotency. Потребление атомарное; двойной verify, поздний ответ,
  смена email, ban/revoke и ошибка session save не обходят общие auth-инварианты.
  Использовать принятые политики проекта; не придумывать отдельные лимиты в UI.
- Email-login выдаёт код только для active User с подтверждённым текущим email.
  Незавершённая регистрация проходит существующее подтверждение после исходной
  аутентификации или восстановления доступа, без превращения login-кода в verify-код.
  Unknown/inactive/unverified случаи имеют одинаковый нейтральный ответ request.
  При email collision с unverified User не активировать новую provider identity;
  предложить существующий вход/recovery. Reset отменяет pending identities/flows
  вместе с sessionVersion bump. Эти правила исключают автоматическую активацию
  предварительно привязанного злоумышленником провайдера после чужого подтверждения.
- Не возвращать `already_verified` из login verify как доказательство входа:
  каждый вход требует именно своего непотреблённого challenge. Повтор verify с тем
  же idempotency key не создаёт новую сессию без исходной browser binding; ключ
  идемпотентности не является credential. При SMTP unknown код может прийти позже;
  не слать письмо автоматически второй раз и не обещать доставку по `accepted`.
- Переиспользовать текущие 6 цифр и policy: TTL5мин, 5 неверных проверок -> пауза5мин,
  resend60/120/300с; новый request не сбрасывает durable failures/pause. Login-письма
  входят в общие mail quotas/budgets, а не получают отдельный обходной лимит.
  Короткий код хранить как purpose/challenge-bound HMAC с server-only ключом через
  Node crypto; простой SHA-256 от 6 цифр не защищает код при чтении дампа БД.
  Это относится и к code-derived contentHash идемпотентной операции, не только
  к codeHash challenge: иначе код восстанавливается через второй сохранённый hash.
  Миграция не сохраняет активные тестовые OTP: их явно завершить, не конвертировать.
- В `AuthAbuseStore.reserveMailLocked` сейчас ветвление на verification/reset,
  а `verifyEmailCode` возвращает успех для уже подтверждённого User. Простого
  добавления `email_login_send` в MAIL_PURPOSES недостаточно: явно расширить purpose
  policy, выбор secret/TTL, invalidation, content binding, counters и replay paths.
  Выделять только действительно общие части reservation/delivery/consume;
  не копировать весь store/service и не делать configurable OTP engine.
- Затронутые владельцы: auth UI/feature state -> contracts и api-client -> AuthService,
  OtpService/AuthAbuseService -> Prisma attempts/User/sessionVersion -> session store
  и Cloudflare no-store. Переиспользовать поля/OTP UI, не менять BackButton.
- Приёмка: Google -> email-code сохраняет User ID; password -> code сохраняет User ID;
  email -> Google требует явной привязки; unknown email не регистрирует автоматически;
  verification-код не принимается как login-код; expiry/replay/brute-force/race,
  незавершённая регистрация и недоступность SMTP/БД покрыты owner/integration checks.

### Владение данными и границы

- `User.email` остаётся реальным и обязательным; `passwordHash` становится nullable.
  Не вводить отдельную таблицу password credentials без текущей необходимости.
  Login без hash проходит dummy-hash ветку, не выдаёт существование social account.
  Существующее восстановление пароля остаётся email recovery; после успешной
  проверки reset-token оно может установить настоящий пароль social-only аккаунту.
- `ExternalIdentity`: userId, provider, issuer, subject, timestamps; уникальны
  issuer+subject (provider из фиксированного server allowlist). Pending/active
  состояние отличает незаконченную проверку от готового способа входа. Не хранить секреты
  провайдера, refresh/access tokens и его профиль целиком.
- Session store — таблица в существующей БД, формат sid/sess/expire по библиотеке.
  Nest principal: userId + sessionVersion; роль и active-status читаются из User.
  Сохранить нынешний абсолютный срок12ч из auth.constants.ts, не подменять его
  default/бесконечным sliding expiry store. В session data зафиксировать время входа
  и предельный expiry; guard проверяет его даже после touch/позднего save.
  В публичном contracts `User` не появляется hash/session JSON/OIDC claims.
- `AuthFlow`: небольшая SQL-запись попытки входа/привязки/завершения регистрации.
  Хранит browser binding, intent/provider, безопасный returnPath, expiry,
  состояние и минимальные серверные proof-данные. State хранить хешем;
  PKCE verifier нужен серверу только до обмена кода, после него удалить.
  Это координатор доменной операции, не новая реализация OIDC.

### Состояния и OTP без дублирования движка

| Состояние | Доступ | Переход |
| --- | --- | --- |
| Anonymous | Публичное чтение, password login/register, email-login request/verify, social start | Проверка выбранного способа входа |
| Provider verified, profile missing | Только текущий onboarding flow; обычный principal отсутствует | Email/ник/одно согласие |
| Email pending | Только state/request/verify/cancel текущего onboarding | Подтверждение реального email |
| Authenticated | Существующие guards ролей/владения/модерации | Logout/reset/revoke |
| Expired/cancelled/consumed | Никаких прав попытки | Новый start |

Для Telegram не создавать User с пустым/фиктивным email. После получения настоящего
email, ника и согласий создать User + legal evidence + pending ExternalIdentity в одной
транзакции. До проверки email browser-session содержит только pending-flow reference,
без authenticated userId. Созданный User — обычный unverified account; это не повод
давать ему обычную сессию. Повторный Telegram вход находит pending identity и возобновляет
email completion, но не выдаёт обычную сессию. Identity активируется только при
доказательствах провайдера и текущего email в одном непросроченном flow, с повторной
проверкой sessionVersion. Проверка email в другом flow сама по себе не активирует
pending identity. Reset/revoke/смена адреса отменяют pending identities/flows;
активные identities сохраняются, если отдельная политика не требует их отзыва. Не удалять такого User автоматически при истечении flow: новый
flow безопасно возобновляет его; чистка брошенных аккаунтов требует отдельной политики.

Ограниченные onboarding endpoints берут userId исключительно из серверной записи
AuthFlow и вызывают существующие `OtpService`/`AuthAbuseService`, сохраняя Turnstile,
mail quota/budget, idempotency, блокировки и hash/expiry кодов. Они не ослабляют
обычный session guard и не делают `/auth/email/*` общедоступным. `GET /auth/me`
в pending состоянии возвращает401. Ошибка SMTP оставляет безопасный повтор.

Предлагаемые endpoint под текущим префиксом `/api`:

- `POST /auth/email-login/request`: email, idempotencyKey, Turnstile;
  единый нейтральный ответ и opaque flow reference, привязанный к browser session.
- `POST /auth/email-login/verify`: flow reference, code, idempotencyKey;
  success возвращает существующий authResponse и сохраняет новую session cookie.
  Invalid/expired/paused — типизированные ошибки без account/provider disclosure.
- `GET /auth/connections`: authenticated-only список собственных подключений;
  без provider subject, tokens и чужих email. Не public email lookup.
- `POST /auth/providers/:provider/start`: intent login/link, относительный returnPath.
- `GET /auth/providers/:provider/callback`: единственное redirect-исключение; OIDC state.
- `GET /auth/onboarding`: только состояние текущего flow и необходимые поля.
- `POST /auth/onboarding`: реальные email/slug/legal, server-side validation.
- `POST /auth/onboarding/email/request`, `/verify`: те же DTO idempotency/OTP,
  что у текущего механизма; отдельные scope guards, не отдельный OTP engine.
- `POST /auth/onboarding/cancel`: завершает попытку, но не удаляет аккаунт.

Существующие `/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout`,
`/auth/password/*` и `/auth/email/*` сохраняют свои доменные задачи. DTO дополнять
через публичные exports contracts/api-client; не подменять verification endpoint
новым sign-in и не дублировать один response type локально в Nest и Expo.

Не регистрировать User непосредственно из Google profile до ввода nickname и
явного принятия документов. Google email — prefill; пропуск OTP допускается только
для валидированного доказательства актуального владения: Google authoritative Gmail
или verified Workspace с hd. Для стороннего email одного email_verified недостаточно
по документации Google; использовать тот же email-completion путь. Изменение
prefilled email всегда сбрасывает proof и требует OTP. Повторный вход не перезаписывает
email/displayName/профиль автора и не объединяет совпадающие email.

### Атомарность и конкурентные запросы

- `express-session` JSON не использовать как одноразовый semaphore: параллельные
  запросы могут прочитать и затем сохранить старую копию. State consume, expiry,
  terminal-state и победитель completion проверяются SQL CAS/короткой транзакцией.
- Разрешить одну активную попытку данного browser binding; новый start отменяет
  предыдущую под тем же lock. Поздний callback, отмена или duplicate completion
  не создают второй аккаунт/identity и не заменяют текущую сессию другим пользователем.
- При email collision завершить неподключённую provider-попытку и предложить
  обычный вход в существующий аккаунт, затем подключение в настройках с новым
  link intent. Не переносить provider proof через произвольный login flow и
  не пытаться неявно завершить привязку после входа. Это простой последовательный
  сценарий без второго параллельного координатора попыток.
- При link flow зафиксировать accountId, sessionVersion и свежую аутентификацию;
  callback повторно проверяет их. Нельзя привязать identity после logout/login в другой
  аккаунт. Рекомендованный предел свежести5мин — именованная server policy, не таймер UI.
- Транзакция create/link/consume не включает сетевой обмен с IdP/SMTP. Перед выходом
  из auth-границы regenerate SID, await save; ошибка save не означает успешный вход.
  Повтор после ошибки использует server state/identity и не дублирует domain writes.
- Global logout, ban, password reset сохраняют version-инвалидацию. DELETE store rows
  — очистка, не гарантия безопасности; поздний session save с устаревшей версией
  всегда получает401. Обязательно интеграционный тест этой гонки.

### CSRF, cookie и Cloudflare

Для web JSON/multipart API выбран простой custom-header подход OWASP:
общий api-client добавляет `X-Bidplace-Request: 1` к мутациям своего backend.
Общий Nest middleware требует этот header и точный allowlisted Origin; при отсутствии
Origin проверяет exact origin Referer, а если отсутствуют оба — отклоняет browser
mutation. CORS не разрешает произвольные origins/субдомены. HTML form/text/plain
без header не выполняет мутацию, включая login/logout/uploads. Header не секрет;
защита строится на preflight + серверной проверке. Тестовые HTTP-клиенты передают
синтетический разрешённый Origin, без production bypass. SameSite не единственная защита.

OIDC callback GET — ограниченное исключение с browser-bound state/nonce/PKCE,
не общий обход middleware. В state не доверять клиентскому targetUserId/redirect URL.
GET не выполняет другие произвольные мутации по cookie. Browser navigates только
на library-built provider URL и exact registered server callback.

В production cookie host-only, HttpOnly, Secure, SameSite=Lax; отсутствие Domain
не позволяет делиться ею с чужими subdomains. Подписан только opaque SID, не наши
claims. Reverse proxy trust ограничен реальным Worker -> Container путём; не доверять
пользовательскому X-Forwarded-Host. Session middleware должно видеть secure protocol
от текущего очищающего Worker. Public cache остаётся allowlist и обходит cookie/
Authorization; auth flow и onboarding ответы всегда no-store.

Provider secrets задаёт владелец через server-only bindings, не через чат/бандл.
Нет конфигурации провайдера -> контрол недоступен с понятным объяснением;
password login остаётся рабочим. Не показывать сообщение об успешном social login
до действительной callback/session проверки. Не логировать SID/code/state/PKCE/OTP
или сырой callback query; применять существующий безопасный requestId logger.

### Сравнение вариантов по правилу минимального устойчивого решения

- **Durable fix, выбран:** session middleware + PostgreSQL store + OIDC-client
  внутри текущего Nest. Мы поддерживаем правила продукта, библиотеки — протокол.
- **Durable alternative, не выбрана:** self-hosted Kratos. Дополнительные deployment,
  identity-store sync, courier и эксплуатация не оправданы текущим скоупом.
- **Acceptable workaround, не цель:** временно добавить social поверх нашего JWT;
  откладывает удаление ручного issuer и создаёт лишнюю переходную реализацию.
- **Hack, запрещён:** fake email/password, auto-link по email, fork auth-library,
  пропуск PKCE/nonce/CSRF, MemoryStore/in-memory OAuth state в production.

## Что фактически проверено при продолжении

### Данные для настройки и внешней приёмки

Эти настройки готовит владелец через штатный server-only secret store, не в чате.
Для кода и test IdP реальные значения не нужны. Не открывать `.env` для проверки
их наличия; проверять схему настроек и валидировать конфигурацию при старте.

| Настройка | Требование |
| --- | --- |
| Session / OTP | Новые server-only `SESSION_SECRET` и `OTP_HASH_SECRET`; независимые ключи для подписи SID и purpose-bound HMAC коротких кодов. Нет ключа -> fail closed; никаких встроенных значений и client fallback |
| Google | Web OAuth client; `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`; discovery `https://accounts.google.com/.well-known/openid-configuration`, scopes `openid email profile` |
| Telegram | BotFather Login Widget: `TELEGRAM_CLIENT_ID`, `TELEGRAM_CLIENT_SECRET`, `TELEGRAM_REDIRECT_URI`, Allowed URLs; discovery `https://oauth.telegram.org/.well-known/openid-configuration`, scopes `openid profile`, без phone/bot messaging |
| Callback | Предлагаемые exact production URI: `https://bid.place/api/auth/providers/google/callback` и `https://bid.place/api/auth/providers/telegram/callback`; зарегистрировать у провайдеров после фиксации route. Не собирать адрес из Host/X-Forwarded-Host |
| Окружения | Local/test, staging и production не используют общие session/OTP keys и callback registrations; для smoke — отдельные безопасные provider clients. Test IdP доступен только explicit test profile |
| Почта / Turnstile / DB | Существующие server настройки и реальные mail budgets сохраняются. Проверить новый email-login action в серверном allowlist и клиентском widget; не выключать Turnstile для успешного smoke |

Telegram token endpoint по документации требует client-secret Basic auth; настроить
это через openid-client, не вручную через base64/fetch. В волне0 проверить реальную
discovery metadata и поддерживаемые методы клиента. Google также поддерживает
client_secret_basic. Оба потока — server code flow + S256/nonce/state через redirect
текущей вкладки, без добавления popup SDK и изменения COOP ради popup.

Отсутствие настроек конкретного provider не ломает password/email login; частично
заданный provider config — понятная startup validation error. UI получает только
признаки доступных методов через общий публичный config/API, без account lookup
и без provider secrets. Не заводить secret manager и не менять deploy в этой задаче.

Реальная внешняя приёмка после безопасной настройки: первый и повторный Google,
первый и повторный Telegram, отмена consent, недостающий email, конфликт email,
явная привязка, Google -> code и email -> Google. В отчёте отличать результаты
test IdP от результатов настоящих providers. Наличие библиотеки/кнопки не равно
готовому provider login. Browser smoke возможен на локальном/выделенном тестовом
стеке; URL регистрации callback должен совпадать с реально настроенным окружением.

### Минимальный пакет доказательств по волнам

| Волна | Обязательный gate |
| --- | --- |
| 0 | Актуальный SHA + версия PR56; Nest10/Express4/Node22 TS и runtime compatibility; disposable PostgreSQL store/schema, test IdP, production-like Docker build |
| 1 | Media owner specs и file-input smoke; если media отложена, явно назвать её отдельным остатком |
| 2 | Session HTTP/integration: anonymous, cookie, rotate/save/destroy, 12h absolute expiry, restart, reset/revoke/ban и late-save race; auth client/provider regressions |
| 3 | OIDC HTTP: оба issuer, PKCE/nonce/state/claims, cancel, replay/concurrent callback, session switch и redirect validation; private API не доступно pending flow |
| 4A | Email-code HTTP/DB и UI: нейтральный request, invalid/expiry/pause/resend/budget, purpose isolation, User ID, browser binding, stale version, idempotent replay и session save failure |
| 4B | Social creation/link: mandatory email/slug/legal, pending identity не становится active от чужого verify, collision без merge, recovery отменяет pending proof, повторный вход без новой регистрации |
| 5 | Affected lint/typecheck/tests/build; `pnpm verify`, `pnpm cloudflare:check`, image verification и Chromium/WebKit на isolated stack. Настоящий provider smoke отдельно от mock-покрытия |

Не запускать пишущие e2e на localhost7899, пока не доказана изоляция его API/БД:
это пользовательский стенд. Использовать существующий изолированный auth-abuse
Playwright config/HTTP harness и расширять owner specs, не делать файл на каждый баг.
Артефакты — скриншоты без кодов/секретов, SHA, команды, фактические failures/skips.
Нужные Figma состояния email-code/link брать из текущего intake/owners до UI-кода;
при отсутствии точного frame отметить только затронутую геометрию NEEDS-FIGMA.

### Совместимость, миграция и передача

Сохранять все User ID, slug, работы, media и legal evidence. Миграции additive,
изменение старых migration SQL/reset seed не разрешены. Отдельная команда релиза
в будущем: закрыть записи старого API -> применить миграцию -> новый image ->
проверить health/auth/private reads -> открыть доступ. До открытия выполнить
стандартный backup/restore preflight; применённые миграции не откатывать drop-ом.
Старые JWT и активные OTP явно завершаются; документировать повторный вход.
Новая версия и старый auth writer не должны работать одновременно в одном rollout.
Задание готовит код и runbook; применять production миграции/deploy/push/merge без
отдельной команды нельзя. Установленные локально зависимости не меняют это правило.

Проверено22октября перед передачей: remote MVP `e024d91d22ac5f5912e45dae1dbff8f723c65690`;
PR56 всё ещё OPEN/DRAFT, head `aff5ddfc99a368ab9d4ea2e85ea41491aa9b6291`.
Документация находится локально в исследовательском checkout; до старта исполнения
прочитать её по указанному абсолютному пути. Не cherry-pick всего старого
12-DECISION-LOG поверх чужой docs-чистки: переносить подтверждённое решение адресно,
сохраняя текущую структуру canonical docs и проверяя занятые номера решений.

### Исполнявшийся библиотечный spike

В `/tmp/bidplace-auth-library-spike` установлены только временные зависимости;
package.json/lockfile Bidplace не изменены. Node22.20.0:
express-session1.19.0, connect-pg-simple10.0.0, openid-client6.8.8,
Express4.22.3, pg8.23.1. `node --test compatibility.test.cjs`: **3/3 passed**:

1. CommonJS import OIDC и построение S256 authorization URL.
2. Создание PgStore с запретом runtime DDL без подключения к БД.
3. HTTP middleware: anonymous request без Set-Cookie, rotate SID, save-before-redirect,
   отсутствие старого pending state после regenerate, destroy и отказ старому SID.

Третий тест использует MemoryStore ТОЛЬКО для изолированной проверки библиотеки.
Это не проверка PostgreSQL persistence, не интеграция Nest/TS, не IdP token exchange,
не CSRF-тест и не подтверждение работоспособности Google/Telegram.
Волна0 должна проверить эти оставшиеся границы на disposable DB/test IdP и Docker.
Полный application suite не повторялся: runtime-код не менялся.

## Первичные источники и исследованные проекты

- [PR56](https://github.com/yayauheny/bidplace/pull/56), head aff5ddfc; CI verify39678668075.
- [Bluesky](https://github.com/bluesky-social/social-app/blob/df8ce385efaa734370ddfdbce186861bc7d40fd2/src/lib/media/manip.ts): актуальная подготовка фото/контроль выходных байтов; переносить принцип, не весь редактор.
- [Twenty UI](https://github.com/twentyhq/twenty/blob/d7499bf4ba11ed8c8a9392e02a42bb12b576e543/packages/twenty-front/src/modules/settings/components/SettingsImageInput.tsx): общий upload/error/abort UI; [Google controller](https://github.com/twentyhq/twenty/blob/d7499bf4ba11ed8c8a9392e02a42bb12b576e543/packages/twenty-server/src/engine/core-modules/auth/controllers/google-auth.controller.ts) — тонкий controller, не шаблон всей auth-архитектуры.
- [Immich](https://github.com/immich-app/immich/blob/745bdd2edf72ce0f75e748e2d68c37b6ea196cc5/server/src/repositories/media.repository.ts): Sharp/цвет/производные; не переносить workers и очереди. Bidplace уже нормализует через Sharp; отсутствие explicit ICC настройки не доказывает баг цветопередачи.
- [Expo57 ImageManipulator](https://docs.expo.dev/versions/v57.0.0/sdk/imagemanipulator/).
- [Telegram OIDC](https://core.telegram.org/bots/telegram-login), [Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect).
- [openid-client](https://github.com/panva/openid-client), [express-session](https://github.com/expressjs/session), [connect-pg-simple](https://github.com/voxpelli/node-connect-pg-simple), [Nest sessions](https://docs.nestjs.com/techniques/session).
- [Better Auth callback](https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/api/routes/callback.ts): missing email отклоняется до обычного account lookup; Google работает штатно, Telegram требует адаптации. Не предлагать fake-email plugin.
- [Google email authority](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token),
  [OWASP CSRF custom headers](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- [Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless),
  [identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking) и
  [Auth0 linking](https://auth0.com/docs/manage-users/user-accounts/user-account-linking):
  исследованы продуктовые паттерны; это не предложение менять выбранный стек.
- [Ory flows](https://www.ory.com/docs/kratos/self-service/flows/user-registration): поддерживает missing traits, но добавляет identity service.
- [Статья KTS,2024](https://habr.com/ru/companies/kts/articles/870454/): полезный опыт, не benchmark нашего Cloudflare; отдельное хранение/синхронизация и внешние abuse controls — важная цена. Исторические замечания статьи проверять по текущим версиям.
- [Cloudflare Containers](https://developers.cloudflare.com/containers/); фактический владелец нашей конфигурации — deploy/cloudflare/src/index.ts и router.ts.

## Ограничения исследования

Graph Verify: проект Users-yayauheny-projects-bidplace, generation2026-10-21T20:25:53Z,
другая checkout-ветка. Проверены coverage auth/schema/provider paths; точные выводы
подтверждены чтением исходников MVP и PR56. Граф не доказывает отсутствие всех связей.
Исходники внешних проектов прочитаны по указанным SHA; дерево Twenty было truncated,
поэтому выводов о полном составе проекта нет. Минимальный runtime spike выполнен
отдельно, точная граница проверки указана выше. Nest/TS/PG/IdP interoperability,
реальный вход, mobile photo smoke и production logs не проверялись. Новые
зависимости в Bidplace не установлены, код приложения не менялся.
