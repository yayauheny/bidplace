# Task 01 — проверить и интегрировать seller sales history

> **Status: deferred to post-MVP commerce wave.** Keep the branch/commit reference, but do not integrate it into the portfolio-first release without adapting it to the future Order contract.


Исполнитель: GPT-5.6 Sol
Приоритет: P1
Режим: review first; исправлять только подтверждённые дефекты

## Цель

Проверить ветку `fix/seller-sales-history`, commit `c3ef615`, относительно текущего
HEAD. В текущую ветку эта работа не входит. Нужен правдивый read-only список продаж:
active, completed, cancelled и failed Orders, seller capability gate и HTTP seller 200,
без новых действий next-bidder/relist.

## Правила выполнения

- Создать от актуального HEAD ветку `fix/seller-sales-history-integration`.
- Перенести `c3ef615`, затем исправить только подтверждённые review findings.
- Оставить один логический commit с сообщением `fix issue:` и bullets `fixed`,
  `changed`, `added`; ветку не merge.
- Не менять продуктовые правила и не добавлять будущие действия.

## Критерии готовности

- cancelled/failed rows не исчезают;
- seller видит только свои Orders;
- guest 401, admin 403, пользователь без seller capability получает согласованный отказ;
- snapshot fields не заменяются живыми данными;
- нет утечки buyer/seller contact в list projection;
- конфликтующие изменения текущего HEAD сохранены;
- relevant unit/integration/typecheck/lint пройдены вне sandbox;
- `11-PROJECT-STATUS.md` отражает итог;
- `.pen` отсутствует в diff.

## Ответ

Outcome; findings с файлами/строками; способ интеграции; commit SHA; changed files;
краткий diff по поведению; checks и их результаты; remaining risks;
`git status --short`.
