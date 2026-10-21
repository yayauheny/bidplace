# Task 03 — lifecycle bounded progress

> **Status: deferred to post-MVP commerce wave.** Auction lifecycle jobs are disabled in First MVP; preserve this prompt for the capability reopen review.


Исполнитель: Grok 4.6 High
Review: GPT-5.6 Sol
Приоритет: P2

## Цель

Доказать фактическую обработку `51 → 50 + 1`, измерить поведение одного tick и закрыть
узкий starvation risk. Не проектировать внешнюю очередь без доказательства, что текущий
transaction/locking pattern недостаточен.

## Правила выполнения

- Создать от актуального HEAD ветку `fix/lifecycle-bounded-progress`.
- Сначала воспроизвести остаточный риск тестом; production code менять только при
  доказанном дефекте.
- Оставить один логический commit с сообщением `fix issue:` и bullets `fixed`,
  `changed`, `added`; ветку не merge.
- Не добавлять очередь, новый scheduler или dependency без доказанной необходимости.

## Критерии готовности

- deterministic test доказывает batch boundary и следующий tick;
- ошибка одной записи не останавливает другие;
- постоянно падающая ранняя запись не блокирует вечность более поздние eligible rows;
- single/multi-instance предположение явно задокументировано;
- production изменение минимально и сделано только при подтверждённом дефекте;
- relevant unit/integration/typecheck/lint пройдены вне sandbox;
- `11-PROJECT-STATUS.md` обновлён;
- `.pen` отсутствует в diff.

## Ответ

Outcome; доказанная semantics; найденный дефект или отсутствие дефекта; branch/SHA;
changed files; краткий diff по поведению; checks; residual operational risk;
`git status --short`.
