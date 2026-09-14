# Общие условия исполнения

Это задания на будущие исправления. Выполняй только явно переданный пакет, не весь backlog. Сейчас все пакеты Not started.

## Перед кодом

1. Прочитай root/package AGENTS.md, product index/foundation/status, актуальные RFC, architecture и документы-владельцы. Используй подходящие skills. Для UI прочитай design owners, установи действующий reference; Pen/Figma не изменяй.
2. Зафиксируй HEAD и dirty tree. Перепроверь finding по символам: отчёты относятся к 70c5fd5, data-аудит частично учитывал dirty tree. Старые строки и зелёные тесты не доказывают состояние твоей ветки.
3. Покажи воспроизведение, критерии успеха, короткий план и альтернативы с метками durable fix / acceptable workaround / hack. Выбери минимальный durable fix. Если уже исправлено — проверь, не создавай искусственный diff.
4. Проверь зависимости пакета. При материальной неоднозначности останови затронутую часть и сформулируй необходимое решение. Не переписывай RFC под код.
5. Отдельная ветка/worktree от согласованной базы; чужие незакоммиченные env/CORS, seed, mobile и docs не переносить и не перезаписывать.

## Ограничения

Portfolio MVP без сделок; mobile web 390 по актуальным решениям, без удаления native. Не читай .env/секреты/credentials. Не меняй shared/production DB, не запускай destructive seed/reset. Миграции и integration допускаются только в доказанно одноразовой изолированной тестовой БД с безопасным setup. Внешние S3/SMTP/deploy действия не входят.

Сначала используй штатные API и установленный стек. Новую зависимость обоснуй чистой выгодой и официальными docs нужной версии. Никаких generic repositories/queues ради локального дефекта, any, suppressions, empty catches, silent fallbacks, ослабления тестов или route-local визуальных костылей.

Сохраняй published revision, ownership/privacy, существующие API и миграционную историю, кроме явно обоснованного изменения пакета.

## Приёмка и готовность

- Regression test воспроизводит проблему на реальной границе: unit для правил, integration для HTTP/DB/прав/транзакций, browser для изменённых пользовательских сценариев.
- Запусти relevant typecheck, lint без autofix, unit/integration и build затронутого graph. Проверь scripts, используй Turbo filters где применимы. Mobile suite запускай явно: root test:unit может его не включать.
- UI: 390, loading/empty/error, keyboard/focus, zoom и reduced motion по изменённой области; no .pen diff. Другие ширины по действующим owner requirements; конфликт не угадывать.
- Обнови product/11-PROJECT-STATUS.md с доказательствами; architecture только при изменении её границ; design status/system/flows по фактической области. Decision log только для явного решения. Сохрани чужие записи.
- Commit только своей работы на fix/<name> или feature/<name> по правилам репозитория. Не merge/deploy автоматически.
- Done = вся приёмка и обязательные проверки выполнены. Partial = остались поведение/проверки. Blocked = конкретная внешняя зависимость. Needs verification не маскируй под Done.
- Отчёт: исходные IDs, воспроизведение/исправление, changed files, команды и результаты, документация, commit, риски, решения и статус. Не запускай соседние пакеты.
