# P1 · Компоненты и страницы заявки автора

Рекомендуемый исполнитель: Sol high; сложные общие controls — сильная модель.
Зависимости: Базовые поля/buttons приняты; НЕ выполнять одновременно с12 в общих masters.

## Промпт для передачи

Работай в `/Users/yayauheny/projects/bidplace`. Выполни только задачу «P1 · Компоненты и страницы заявки автора».
Сначала прочитай `docs/tasks/2026-09-12-figma-finish/01-RULES.md`: это обязательная часть задания, включая источники, ограничения, браузерную приёмку и формат завершения.

Источники в read-only `design/figma-handoff/portfolio-phone-v1`: apply `526:16074`, `527:16416`, `746:22642`, `746:23037`, `578:17378`, `746:22724`, `584:17717`, `584:18020`, `738:20088`, `738:20051`.
Разрешённая область: `features/sellers/seller-profile-screen.tsx`, `seller-profile-steps.tsx`; недостающие общие form masters в `components/figma`.

Сверь существующий application flow с RFC и только MVP captures. Доделай общие step header, field groups, photo field и exit dialog, затем подключи существующие шаги. Не менять approval workflow/required fields/private handoff contract.

Критерии: каждый существующий MVP шаг, validation error, pending, back, exit/cancel и восстановление черновика визуально/функционально проверены. Optional socials не блокируют заявку; private handoff не появляется в публичном профиле. Загрузки используют текущий безопасный pipeline. Отсутствующий dedicated private-handoff frame не выдумывать: сохранить поведение и отметить input gap. Не трогать admin/API и не отправлять настоящую заявку ради скриншота; тестовый сценарий изолировать.

Без эталона и итогового browser screenshot задача визуально не принята. Typecheck/lint/tests/build — отдельный технический gate. Не подменяй проверку дизайна тестами и не расширяй scope. Сохрани отчёт по правилам01, обнови статусы и сделай отдельный коммит только своих изменений.
