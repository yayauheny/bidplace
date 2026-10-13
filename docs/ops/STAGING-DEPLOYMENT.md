# Bidplace staging

Дата: 2026-10-13. Статус: Partial — ресурсы и код подготовлены; первый CI deploy
и браузерная приёмка ещё не выполнены. Решение: DEC-119.

## Контур и доступ

Один стенд: `https://staging.bid.place`, Worker `bidplace-staging`, Expo SPA и
один приватный Nest Container с `sleepAfter=10m`. Production выпускается отдельно:
[production runbook](CLOUDFLARE-DEPLOYMENT.md).

Cloudflare account `56b0c4b96497366c262447d2a18bf632`, zone
`f10d49913e125d8b0d424018322aeb07`. Созданы и проверены:

| Ресурс | Значение |
| --- | --- |
| Private R2 | `bidplace-staging-media-private`; без публичного домена |
| Public R2 | `bidplace-staging-media-public`; `https://media-staging.bid.place` |
| Neon project / branch | `ancient-mode-04937403` / `br-divine-base-bavyjhcm` |
| Neon endpoint | `ep-snowy-fog-bacznby0` |
| Neon database / role | `neondb` / `bidplace_staging` |
| Turnstile public site key | `0x4AAAAAAFVVcUu1K8SibHs5` |
| Access application | `83cec6e4-2094-42ea-9732-529da063e667` |

Neon — отдельный пустой проект Frankfurt, PostgreSQL 18, 0.25 CU, pooling
включён; endpoint автоматически засыпает. Production данные не копировались.
Оба R2 `r2.dev` выключены, SSL public custom domain активен.
Worker custom domain подключён; `workers.dev` и preview URLs выключены.
До первого deploy Worker отвечает заглушкой 503 за Access.

Access защищает только `staging.bid.place`, Browser Allow разрешает только
`work.evles@gmail.com`. Cloudflare One-Time PIN и сессия 24 часа — отдельный
вход на стенд; письма самого Bidplace отключены. Public media domain доступен
для тестовых изображений, без production или конфиденциальных материалов.

Оператор создаёт Access service token `bidplace-staging-ci`, сохраняет две части
в GitHub secrets и добавляет этой application политику **Service Auth** с Include
**Service Token → именно этот token**. Не использовать Bypass или Any Valid
Service Token. Агент может привязать policy по metadata ID, не получая secret.
[Cloudflare service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/).

## GitHub configuration

Environment `staging` создан; source workflow branch rules разрешают только
`main` и `feature/portfolio-mvp-release`. Не дублировать runtime credentials
в `prod` или repository secrets.

Repository variable:

| Variable | Значение |
| --- | --- |
| `STAGING_DEPLOY_BRANCH` | `feature/portfolio-mvp-release`; для первого теста до merge явно разрешить `feature/staging-deploy` |

Environment `staging` variables:

| Variable | Значение |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID выше |
| `STAGING_NEON_ENDPOINT_ID` | `ep-snowy-fog-bacznby0` |
| `TURNSTILE_SITE_KEY` | Public site key выше |
| `SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`, `SERVICE_RULES_TEXT` | Утверждённые текущие значения из `prod`; текст обязателен |

Environment `staging` secrets:

| Secret | Назначение |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Отдельный CI token для Worker/Container deployment в указанном account |
| `DATABASE_URL` | Pooled DSN нового endpoint, `neondb`, `sslmode=require` |
| `NEON_DIRECT_URL` | Direct DSN того же endpoint, без `-pooler`, `sslmode=require` |
| `JWT_SECRET` | Новый staging secret, минимум 32 символа |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Object Read & Write только для двух staging buckets |
| `CLOUDFLARE_CACHE_TOKEN` | Cache Purge для zone `bid.place`; zone scope включает и production, host isolation обеспечивается media URL/config |
| `TURNSTILE_SECRET_KEY` | Secret нового staging widget из Cloudflare console |
| `RELEASE_CONTROL` | Новый staging control secret, минимум 32 символа |
| `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` | Новый Access service token |
| `STAGING_TEST_PASSWORD` | Пароль трёх аккаунтов, минимум 12 символов |

Не добавлять SMTP secrets. DSN брать в новом Neon project с pooling on/off.
Резервную копию хранить в собственном password manager. Значения переносить
напрямую из provider console в GitHub, без чата, repository `.env` или artifacts.
`AGENTS.md` запрещает агенту читать credentials.

## Первый запуск и приёмка

1. Добавить `.github/workflows/staging-deploy.yml` на default branch `main`
   через отдельный PR только с этим файлом. Полный infrastructure PR направлен
   в `feature/portfolio-mvp-release`. Default branch не менять.
   [Требование GitHub](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).
   У регистрации на текущем main есть baseline CI failure: typecheck API client
   не находит ещё не собранный contracts package. Staging workflow, его локальные
   проверки и candidate MVP build отдельны от этого прежнего build graph.
2. Заполнить configuration и привязать конкретный service token к Access.
3. Actions → **Staging deploy** → Run workflow, source branch **main**.
   Задать разрешённый `candidate_ref` и полный 40-символьный `candidate_sha`.
4. Operation **initialize**: проверка endpoint, пустой public schema и отсутствия
   других способных писать DB sessions → существующие Prisma migrations →
   аккаунты. Непустая БД блокирует operation до migrations. Повторно не запускать.
5. Operation **deploy** с тем же SHA: migrations status → Access → Cloudflare
   checks → изолированная SPA/image сборка → deploy → authenticated smoke.
   Runtime JSON лежит вне checkout с правами 0600 и удаляется при выходе.
6. Открыть сайт в реальном браузере через Access и пройти приёмку.

Validate job не получает deployment secrets. Он проверяет доверенный source ref,
approved candidate branch, полный SHA и принадлежность разрешённой ветке этого
repository. Secret-bearing job зависит от validate и checkout делает этого SHA.
Approved branch означает доверие к её коду; variable меняет владелец deployment.

Явный GitHub Deployment содержит candidate SHA, `production_environment=false`,
run URL и результат smoke. Автоматическая Environment запись может содержать
source workflow SHA; для приёмки использовать candidate Deployment и runtime SHA.

| Login | Назначение |
| --- | --- |
| `buyer@bidplace.test` | Обычный пользователь |
| `seller@bidplace.test` | Пользователь для заявки автора, slug `vex` |
| `admin@bidplace.test` | Администратор для модерации |

Аккаунты создаются с verified email и Argon2 hash. Вход, сессии, роли, ownership,
Turnstile и `TEST_EMAIL_BYPASS=false` штатные. Operation **accounts** транзакционно
добавляет отсутствующие аккаунты, сохраняя пароли, блокировки, роли и
sessionVersion существующих. Изменение secret не меняет существующие пароли.
Destructive demo seed запрещён. Заявку автора, работы и изображения подготовить
через UI и обычную admin moderation; данные сохраняются между deploy.

`DisabledMailTransport` отклоняет отправку до SMTP; outcome — definite rejected.
Регистрация/OTP/reset не проверяют доставку на стенде. Использовать эти учётки.
Smoke проверяет анонимный Access отказ, authenticated API JSON и actual Expo SPA
с deep links. Worker `/_release/version` и API health должны показать выбранный
SHA; API SHA встроен при сборке image. Smoke не заменяет проверку кликов,
загрузки изображений, ролей, ошибок браузера и desktop/mobile visual QA.
Browser Access session нужно подтвердить на практике; CI token её не создаёт.
Первый Container может готовиться несколько минут после deploy
([Cloudflare](https://developers.cloudflare.com/containers/get-started/)).
Smoke ожидает здоровый API нужного SHA до пяти минут; ошибки Access,
неправильный Worker SHA и login HTML не считаются readiness и не повторяются.

## Следующие задачи, миграции и rollback

Готовая задача → конкретный SHA → по команде **deploy** → приёмка → следующий
кандидат. Concurrency не отменяет текущую операцию, но не резервирует стенд на
время приёмки: занятость согласуется вручную.

Deploy не применяет migrations. Для новой схемы: compatibility review и backup →
**close** (закрывает API, сохраняет image и подтверждает stop) → **migrate**
(endpoint, closed API, stopped Container, DB sessions) → **deploy** того же SHA.
При migration failure стенд остаётся закрытым до выяснения причины.
Rollback — предыдущий проверенный SHA из approved branch, только при совместимой
схеме, без database reset. Production выпускается отдельной командой владельца.

В staging deploy нет полного `pnpm verify`, unit/integration suite или browser
E2E. Остаются небольшие Cloudflare checks, обязательные сборки и smoke.
PR verification policy не меняется; тяжёлые проверки запускаются отдельно.
