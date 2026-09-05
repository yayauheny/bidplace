# Task 02 — письменная проверка юристом BY + RF

## Prompt исполнителю

```text
Подготовь пакет для действующего юриста по Беларуси с подтверждённой компетенцией
по российским пользователям интернет-площадок. Не редактируй public drafts как
будто они уже одобрены.

Основа: docs/legal/07-OPEN-LEGAL-QUESTIONS-BY-RF-2026-09-06.md,
docs/legal/08-BIDBAITS-SOURCE-MAPPING-2026-09-06.md,
docs/legal/02-LAWYER-ANSWERS-2026-08-24.md и фактическая карта code/data.

Получить письменный ответ на все вопросы 1–37. Для каждого: BY/RF applicability,
норма и ссылка на официальный источник, дата актуальности, direct answer, нужный
текст или обязательный смысл, изменение продукта/UI/data, риск и must-before-
launch status. Отдельно вернуть заполненную Legal UX matrix для registration,
cookie, seller application, Work creation, auction publish/bid, fixed buy, offer
send/accept, contact reveal, complaint and footer.

Нельзя закрывать вопрос словами «как у Bidbaits». Нельзя считать широкие
disclaimers освобождением от обязательных норм. Если юрист не покрывает RF,
пометить вопрос и передать RF counsel, а не угадывать.

После получения ответа:
- сохранить verbatim source в новый immutable docs/research/raw/YYYY-MM-DD-*;
- создать отдельный mapping conclusions → owner docs/code/UI;
- drafts не публиковать и не переписывать до review mapping.

Return: credentials/scope юриста; дата; полный/частичный охват; список ответов;
официальные sources; unresolved/escalated questions; launch blockers; raw path;
mapping path; no app/Figma/.pen changes.
```

## Критерии готовности

- Письменно закрыты BY и RF, а границы компетенции названы.
- Есть точный legal UX, data/processor/retention map и contract moments.
- ОКЭД проверены на дату регистрации.
- Нет placeholders, competitor-copy и неподтверждённых absolutes в выводах.
- Любой незакрытый вопрос остаётся launch blocker с owner.

## Prompt проверки в новом чате Codex

```text
Review-only. Сверь ответ по Task 02 с каждым вопросом 1–37 из docs/legal/07.
Проверь ссылки на нормы, актуальность, BY/RF coverage, Legal UX matrix,
data/retention/processors и отсутствие подмены ответа общими disclaimer-ами.
Верни ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО, gaps по номерам вопросов и correction prompt.
Не публикуй drafts и не меняй код.
```

