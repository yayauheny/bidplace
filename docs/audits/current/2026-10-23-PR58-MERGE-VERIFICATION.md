# PR #58 — синхронизация auth с Portfolio MVP

Дата: 2026-10-23. База: `7d0dc179`; auth до синхронизации: `2e6fc2d1`.
Слияние PR в MVP и deploy не выполняются; Ready допускается только после полного зелёного CI
на итоговом коммите. CI-ссылки и итоговый SHA публикуются в [PR #58](https://github.com/yayauheny/bidplace/pull/58).

## Что сохранено

- Серверные сессии, CSRF/origin, проверка статуса/версии, сериализация старого
  SID, одноразовые browser/purpose/version-bound flow/OTP, явная привязка identity.
- Email proof до создания User/legal evidence/social identity, существующие
  pending identities, durable counters, idempotency, quota и mail outcomes.
- DEC-131/132: normalized private SOURCE, Sharp за ImageProcessor, upload
  limits, partial success, replace/retry/timeout, legacy identity и p1/p2.
- Новые auth-миграции и обе media-миграции. Проверено обновление отдельной БД
  с актуальной MVP: 35 migrations, пользователь и normalized SOURCE неизменны,
  старый OTP инвалидирован. Fresh схемы покрыты integration owners.
- Auth-решения перенумерованы DEC-133–135 без изменения содержания, чтобы не
  перекрыть фото-решения. Компактные owner-сводки MVP сохранены; удалённые
  исторические журналы целиком не восстанавливались.

## SMTP и Cloudflare scale-to-zero

По DEC-136 сохранён синхронный SMTP. Cron Trigger + PostgreSQL outbox технически
возможен, но это не только таблица: нужны dispatcher/lease, bounded retry,
защищённый запуск и recovery после рестарта/неоднозначного SMTP-результата.

Ежеминутный Cron добавляет до минуты ожидания до отправки плюс cold start/SMTP;
при текущем `sleepAfter=10m` вызовы Nest поддерживают контейнер активным даже
при пустой очереди. Более редкий Cron увеличивает задержку OTP. Проверка пустой
очереди без пробуждения Nest потребует доступа Worker к БД или отдельного durable
сигнала, расширяя DEC-098. Существующий Container adapter такой очередью не является.
Ни Redis, ни outbox, ни cron/alarm/keepalive, ни fire-and-forget не добавлены.

Источники: [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/),
[Container class](https://developers.cloudflare.com/containers/api/container-class/),
`deploy/cloudflare/src/index.ts` и установленный `@cloudflare/containers@0.3.7`.
Его schedule callback перехватывает ошибку и удаляется; это не готовая гарантия
повторной обработки outbox.

## Локальный HTTP timing

Для request использован транспорт с искусственным ожиданием 200 мс; два
прогревочных прохода, затем 20 образцов каждого класса с чередованием порядка.
Для verify — четыре прогревочных прохода, затем 20 образцов, включая durable pause.
Во всех сравниваемых парах публичные статусы/форма JSON совпадали.

| Операция | Known, медиана мс | Unknown, медиана мс | Known p95 | Unknown p95 |
| --- | ---: | ---: | ---: | ---: |
| request (SMTP +200 мс) | 235.95 | 15.01 | 244.69 | 18.80 |
| verify | 11.55 | 11.62 | 13.63 | 12.96 |

Request различим: известный адрес ожидает SMTP, неизвестный — нет. Это
подтверждённый локальный канал enumeration и принятое ограничение MVP; его
нельзя называть устранённым. Verify-диапазоны пересекаются; измерение не даёт
статистической гарантии для production. Реальный SMTP и production network
в этом probe не использовались. Необходима отдельная security/live приёмка
перед production.

## Проверки синхронизации MVP (до SMTP исправления)

- Полный `pnpm verify` объединённого дерева: passed; 1 590 unit, 250 integration,
  один optional browser owner пропущен здесь и отдельно включён; ops/fence,
  typecheck, lint без autofix, API и web/iOS/Android exports прошли.
- Test-IdP auth owner с AUTH_BROWSER_SMOKE: 55/55 integration, включая 12/12
  Chromium/WebKit completion-сценариев.
- Browser owners на изолированной схеме: auth lifecycle 14/14, media 6/6;
  вместе с auth completion — 32/32 Chromium/WebKit.
- `pnpm cloudflare:check`: passed. Workflow YAML, Markdown links и diff checks
  проверяются перед коммитом. Production-like image/static checks выполняются
  полным GitHub Verify.

Предыдущий CI остановился в `playwright install --with-deps` на apt-установке
системных зависимостей; до тестов не дошёл. Таймаут job не увеличивается,
assertions и timeouts не менялись ради зелёного статуса. После синхронизации
photo harness получил воспроизводимый 403 на login и управляющих запросах:
его API-транспорт не передавал обязательные Origin/X-Bidplace-Request. Общий
`auth-session.ts` и guest setup photo harness приведены к session/CSRF-контракту;
production guard не ослаблялся. После этого те же 6 media-сценариев прошли.
Повторный CI `39879397004` установил браузеры, но Expo не открыл порт 55441.
Локальный запуск с тем же окружением воспроизвёл причину: унаследованный
`NODE_ENV=test` включает test-only запрет React Native `DefaultToolLauncher`.
Только Expo запускается с `NODE_ENV=development` через существующий `web` script
(он также собирает shared packages); API/Vitest сохраняют test-окружение.
EXIT/INT/TERM cleanup завершает отдельные группы Expo и Vitest/Playwright,
а при ошибке выводит хвост Expo log. Assertions и бюджеты ожидания не меняются.
Cleanup проверен в Linux при success/error/SIGTERM: группы завершены, exit codes
0/7/143 сохранены. Локальный повтор с исправленным Expo прошёл 55/55 integration,
включая 12/12 Chromium/WebKit. Первый запуск дал 11/12: WebKit один раз показал
network error при Google start; повтор с временной диагностикой transport прошёл,
причина единичного сбоя не установлена; диагностика удалена, retries не добавлены.
Полный manual Verify `39879403448` на merge-коммите прошёл, включая Cloudflare
image/static checks. Результаты полного Verify и Chromium/WebKit после исправления
browser startup для итогового SHA публикуются в PR #58; они остаются merge-gate.

## 2026-10-23 — SMTP rejection/replay

На `563243c9` HTTP-регрессии воспроизвели P2: replay rejected-ключа возвращал
201, а ошибка очистки кода оставляла outcome `rejected` записанным отдельно.
Исправление сохраняет 503 `MAIL_REJECTED` для любого ключа отвергнутой операции,
не зависит от текущего `codeRequestKey` и повторно проверяет replay под flow lock.
Rejection одной транзакцией фиксирует outcome и условно очищает свой код/expiry/
cooldown; ledger и расход одной из трёх попыток flow сохраняются, общие mail-квоты
не расходуются. Новая операция требует свежей CAPTCHA.

Reserved replay не ждёт SMTP и не отправляет повторно. После обычных 60 секунд
новый ключ может зарезервировать следующую попытку в пределах лимитов. Поздние
accepted/unknown/rejected outcomes не меняют новый код. SMTP выполняется без
DB-lock, его существующие timeouts не менялись. Ошибки фиксации БД остаются
неопределёнными infrastructure failures; replay сверяет фактический ledger,
автоматического SMTP retry нет. Email state читает согласованный repeatable-read
snapshot. Social onboarding обновляет rejected state и меняет ключ без reload;
network/неопределённый 5xx сохраняют прежний ключ.

Управляемые gates покрывают конкуренцию во время CAPTCHA и SMTP, все поздние
outcomes, rollback финализации, потерю commit acknowledgement и конкурентное
чтение state. Unit submit owner покрывает rejected/network/server failures.
Полный локальный `pnpm verify` исправленного дерева прошёл: 1 593 unit,
263 integration (включая 28 abuse), ops/fence, typecheck, lint без autofix,
API и web/iOS/Android сборки. `pnpm cloudflare:check` прошёл; первый sandbox run
упёрся в localhost listen EPERM и был повторён с разрешённым listen без изменения
тестов. Browser owner дополнен recovery-сценарием с rejection тестового SMTP:
14/14 Chromium/WebKit и 68/68 всего HTTP/browser owner прошли локально.
Первый запуск нового browser case заполнял email старой login-формы во время
provider redirect; добавлено ожидание `/auth/complete`, как в существующем owner.
Assertions, retries и timeouts не ослаблялись. В первой постановке CAPTCHA race
не было сохранённой browser cookie и создавались два flow; сценарий переведён
на уже установленную onboarding-сессию, проверка одной reservation сохранена.
Полный GitHub Verify итогового SHA и его результаты публикуются в PR #58.

Timing-замеры выше относятся к синхронизации MVP; здесь SMTP timing не
устранялся и заново не измерялся. DEC-136 и production acceptance сохраняются.

## Граница готовности

Готовность к merge требует зелёного полного CI точного SHA и отсутствия
конфликтов с актуальной MVP. Самостоятельный merge/deploy запрещён.
Live Google/Telegram, SMTP/Turnstile, целевые migration/rollback gates, native
устройства и точный Figma parity этим отчётом не закрываются. Production readiness
не заявляется.
