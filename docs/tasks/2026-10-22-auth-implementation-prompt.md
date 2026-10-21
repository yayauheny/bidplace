# Промпт реализации web auth Bidplace

Передача этого промпта исполнителю — отдельная команда на реализацию; при подготовке
пакета код приложения не менялся. Рекомендуемый исполнитель — Kimi по одной волне;
сессии/OIDC/OTP после реализации проходят независимое security review.

```text
Реализуй следующий этап web-авторизации Bidplace без платных auth-сервисов.

Сначала прочитай целиком подготовленный контракт:
/tmp/bidplace-ui-review-completion/docs/tasks/2026-10-22-auth-media-handoff.md

Это задание, ограничения и критерии приёмки, а не отчёт о готовой авторизации.
Проверь актуальную базу: origin/feature/portfolio-mvp-release; последний проверенный
SHA e024d91d22ac5f5912e45dae1dbff8f723c65690 (2026-10-22).
Сделай отдельный worktree и feature/web-auth от актуальной MVP. Основной checkout
/Users/yayauheny/projects/bidplace занят чужой работой: не переключай и не меняй его.
Сохрани собственные и чужие изменения; старые UI-ветки целиком не переносить.

Подтверждённый выбор:
- текущий NestJS + express-session + connect-pg-simple в текущем PostgreSQL;
- openid-client v6 для Google и современного Telegram OIDC;
- web, включая мобильный браузер; native login отдельно;
- реальный email обязателен; social-пользователь не обязан задавать пароль;
- вход по email-коду — общая альтернатива паролю для готового аккаунта;
- один User ID; Google/Telegram привязываются явно после подтверждения доступа;
- неизвестная почта не создаёт аккаунт автоматически; ник и одно согласие остаются.

Работай последовательно, заканчивая gate и коммит каждой волны:
0. Прочитай AGENTS и owner docs; проверь TS/Nest/PG/IdP/Docker compatibility.
1. Проверь PR56 media отдельно; если он не готов, явно отложи только media.
2. Замени собственный JWT runtime серверными сессиями, сохрани guards/revocation.
3. Реализуй общий OIDC-поток и его HTTP/DB проверки для двух провайдеров.
4A. Вход по email-коду: отдельный purpose, browser-bound challenge, общие mail limits.
4B. Social onboarding, недостающие поля, pending identity и явная привязка, UI.
5. Удали заменённый auth runtime, проверь Cloudflare/build и весь affected graph.

Готовые библиотеки владеют протоколами, Nest — аккаунтами, согласиями и правами.
Нельзя: fake email/password, auto-link по email, самописный OAuth/JWT, production
MemoryStore, новый SaaS/Redis/вторая БД, дублированный OTP engine или обход guards.
Сохрани sessionVersion, auth epoch, 12h absolute expiry, shared UI/tokens, legal
evidence, private media, dirty/busy/focus/resize. BackButton/FigmaIconButton не менять.
Неподтверждённая почта/identity не становится рабочим способом входа автоматически.

Проверки и точные owner paths — в контракте. Пишущие тесты только isolated API/DB,
не пользовательский localhost7899. Не читай .env/секреты и не проси присылать их
в чат. Test IdP не доказывает настоящий Google/Telegram smoke: разделяй результаты.
Отсутствие реальных provider настроек не блокирует реализацию и проверки test IdP;
не объявляй внешнюю приёмку пройденной. Для недостающей Figma геометрии зафиксируй
NEEDS-FIGMA, не придумывай новый дизайн и не останавливай независимую backend-волну.

Не делать push/merge/deploy, production migration или DB reset без отдельной команды.
После каждой волны отчёт: SHA, изменения/удалённые владельцы, точные проверки,
failures/skips, ограничения. Обновляй canonical docs по факту реализации, не по плану.
При доказанной несовместимости выбранной библиотеки останови зависимую часть с
конкретным доказательством; не заменяй архитектуру молча. Не заканчивай на кнопках
или заглушках: конечная приёмка — один профиль при всех согласованных способах входа.
```
