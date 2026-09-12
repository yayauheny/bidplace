# P1 · Компоненты и шаги создания работы

Рекомендуемый исполнитель: Sol high; финальная проверка сильной моделью.
Зависимости: Общие form masters из11 приняты, либо их отдельный фиксированный контракт.

## Промпт для передачи

Работай в `/Users/yayauheny/projects/bidplace`. Выполни только задачу «P1 · Компоненты и шаги создания работы».
Сначала прочитай `docs/tasks/2026-09-12-figma-finish/01-RULES.md`: это обязательная часть задания, включая источники, ограничения, браузерную приёмку и формат завершения.

Источники в read-only `design/figma-handoff/portfolio-phone-v1`: create-work basics `749:2388`, details `873:4404`, story `749:2473`, `877:6338`.
Разрешённая область: `features/sellers/product-draft-screen.tsx`, `product-draft-creation.tsx`, `product-draft-images.tsx`, `product-draft-about.tsx`, `product-draft-story.tsx`, `product-draft-review.tsx`.

Доведи визуальную композицию существующего portfolio wizard: images/title → details → optional plain-text story → review. Используй общие form masters; не копируй их. Сохрани upload/reorder/delete/draft/save/publication permissions и server validation.

Критерии: все шаги с реальными contract states, длинными полями, empty optional story, validation, upload failure+retry, back/exit и сохранением порядка фото проверены. Не добавлять shipping, buyer contact, sale status, process media или rich-text историю. Для review нет утверждённого точного кадра — сохранить существующую композицию на masters и отметить Needs design input, не придумывать «точную Figma». Не публиковать пользовательские работы для проверки; использовать разрешённые тестовые данные.

Без эталона и итогового browser screenshot задача визуально не принята. Typecheck/lint/tests/build — отдельный технический gate. Не подменяй проверку дизайна тестами и не расширяй scope. Сохрани отчёт по правилам01, обнови статусы и сделай отдельный коммит только своих изменений.
