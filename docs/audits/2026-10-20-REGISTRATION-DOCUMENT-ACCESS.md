# Регистрация независимо от чтения документов —2026-10-20

Решение основателя: согласие фиксируется при регистрации. Не вводить pending-legal
аккаунты, повторные окна принятия, гейты согласия перед заявкой/публикацией.

## Целевая схема и границы

1. RegisterForm не запрашивает тексты при открытии и не меняет CTA/checkbox
   из-за GET /auth/legal. Единственный явный control подтверждает документы и18+.
2. По ссылке открывается существующий AppDialog. Только тогда запрашиваются тексты.
   При ошибке — сообщение в этом окне; email и согласие сохраняются.
3. API по существующим обязательным confirmed-флагам фиксирует серверную редакцию
   канонических файлов (edition + SHA256 содержимого) вместе с созданием User.
   Не создаёт фиктивный hash, не утверждает, что пользователь открыл текст.
4. Новый клиент не зависит от получения версии по HTTP. Старый клиент с явно
   переданной версией поддерживается; устаревшая версия по-прежнему даёт409.
5. Публичная выдача незавершённого текста не включается: placeholders в policy
   всё ещё дают503 при чтении. Это не блокирует получение server revision.
   Отсутствующие/повреждённые файлы или edition — ошибка сборки/источника;
   выдуманная редакция не записывается.
6. Пароли, Turnstile, unique email/slug, session ownership и атомарность
   User+registrationLegalEvidence сохраняются. Миграций/новых флагов нет.

## Выбранное решение

Durable fix: разделить readLegalSource, readRegistrationLegalVersion и публичную
выдачу по текущим владельцам, оставить один register endpoint.
Workaround: кэшировать/хардкодить версию в UI — отклонён.
Hack: записывать fake version или пропускать evidence — отклонён.

Важно: техническая запись принятия файловой редакции не означает готовность
юридического текста или доказательство его прочтения. Незакрытые инфраструктурные
факты и основание аналитики остаются у юридического аудита.

## Находки и критерии

| Находка | Важность | Критерий |
|---|---|---|
| Регистрация зависит от выдачи текстов | P1 | GET legal503, но новый account создаётся с тремя настоящими server versions и18+ |
| Ошибка чтения отключает control/заменяет CTA | P1 | checkbox доступен, CTA «Дальше», документ загружается только по ссылке |
| Чтение сбрасывает согласие/ввод | P1 | закрытие окна ошибки сохраняет email/checked; регистрация проходит один раз |
| Совместимость старого клиента | P1 | переданная stale version отклоняется до записи; current version работает |
| Подмена готовности публикации | P1 | public text остаётся недоступным при placeholders; регистрационный hash относится к действительным файлам |

## Проверки итогового кода

- API owner32/32: legal source/publication, AuthService, Turnstile test isolation.
- Mobile67/67: registration, payload/schema, provider session ownership, theme.
- HTTP/БД3/3 в отдельной disposable schema: новый/legacy payload, invalid consent.
- Production browser4/4 Chromium/WebKit: widths320/390/440 и реальный register201
  →verify-email после ошибки чтения. POST register не мокается.
- Дополнительно обычный публичный Cloudflare test widget без перехвата скрипта:
  реальный local API register201→verify-email. API повторно проверен на dev-БД.
- У двух browser-аккаунтов проверены настоящие canonical hashes и18+ в БД.
- API/mobile typecheck, API/mobile production builds, runtime/transport/mobile
  ESLint и diff-check прошли. API unit specs исключены штатным lint-конфигом,
  но выполнены как тесты. Full suite и production captcha не запускались.

## Финальные уточнения

Найдена и исправлена гонка: cache уже содержит созданный User, а React AuthProvider
ещё отображает anonymous; немедленный переход встречает ProtectedRoute и уходит
на login. Register completion теперь использует receipt (user/operation/epoch/
controller) и ждёт отрисованной собственной сессии, аналогично login. Красная
регрессия ожидала user-a в момент навигации и получала null; теперь проходит.
Это сохраняет поздние/чужие session guards без setTimeout.

Owner API32/32, mobile67/67, transport3/3 (legacy/new/invalid consent).
Production browser включает реальный POST register201 и переход verify-email
в Chromium/WebKit после ошибки документа; используется ScriptedTurnstile fixture.
Локальный API перезапущен на3001 с dev-БД без сброса, frontend7899 обновлён.
Смена тестового JWT при перезапуске может потребовать нового входа.

## Совместимость локального стенда

Найдено второе препятствие ручной проверке: frontend был собран с публичным
Cloudflare test sitekey, а ScriptedTurnstileVerifier принимал только pass:
токены автоматики. Exact public dummy token добавлен только в существующий
test/local verifier. В development/staging/production эта фабрика его не
включает; unit проверяет все эти профили. Production verifier не менялся.
[Источник формата](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

Локальная сервисная почта настроена на тестовый файл, без настоящей SMTP-доставки.
Реальные письма и production release не проверены. Реализация согласия не
подменяет нерешённые вопросы юридической готовности пакета.
