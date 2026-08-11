# Pen workspace

Статус: **Canonical v2 restored and protected**

## Canonical design source

`bidplace-web-v2.pen` — единственный визуальный эталон нового публичного UI.
Его ожидаемый repository path:

```text
design/pen/bidplace-web-v2.pen
```

## Permanent protection rule

Во время реализации, code refactor, bugfix, тестирования и документационных
задач canonical Pen запрещено редактировать, удалять, переименовывать,
перемещать, заменять, форматировать или пересохранять. Код подгоняется под Pen,
а не Pen под текущий код.

Изменение допускается только в отдельно сформулированной design-задаче по
прямому решению основателя или назначенного дизайнера. Даже такая задача не
разрешает удаление canonical файла; новое направление должно сохранять историю
и явную преемственность.

Перед и после implementation-задачи проверить, что diff не содержит `.pen`.
Если нужный node отсутствует, повреждён или конфликтует с product contract,
задача блокируется на соответствующей части. Исправлять canonical Pen внутри
code task запрещено.

## Current repository state

- `bidplace-web-v2.pen` — восстановлен byte-for-byte из founder-provided local
  archive; canonical SHA-256:
  `03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9`.
- Current restoration is an intentional one-time repository addition. Accept it
  in the documentation/design baseline before code implementation; from the
  next task onward any `.pen` diff is a hard failure.
- `images/logo-transparent-tight.png` — canonical Pen logo asset; SHA-256:
  `3b5032d840da6713e1e7b167bd10787d236e06e069506d413f86494a58470b6b`.
- Public read-only review:
  <https://app.pen.dev/s/r32fdudQVyiuEZ5htTMYdcv40WDQ4v3vwLT82lS27uk>.
- `bidplace-web.pen` — исторический canvas, не visual source.
- `target-solution/bidplace-youthful.pen` — историческое/неполное направление,
  не visual source.
- `exports/` — review evidence, не source of truth.
- `target-solution/` — вспомогательные screenshots, только если они явно
  сопоставлены canonical v2 nodes.

## Implementation workflow

1. Прочитать `docs/design/00-DESIGN-INDEX.md` и
   `docs/design/05-DESIGN-HANDOFF.md`.
2. Открывать canonical v2 только read-only.
3. Сверять SHA-256 до и после работы; любое изменение блокирует handoff.
4. Использовать node registry из
   `docs/design/07-PEN-V2-UI-AUDIT-AND-IMPLEMENTATION-PLAN.md`.
5. Для поведения, которое не видно в static frame, использовать motion contract
   из `docs/design/03-DESIGN-SYSTEM.md`, а не менять Pen.
6. Реализовывать visual structure в code tokens/shared components.
7. Сравнивать runtime screenshots с verified exports.
8. Завершать task только при нулевом `.pen` diff и неизменном checksum.

Pen не меняет product behavior, auction rules, routes, API, permissions или
privacy без отдельного owner-document decision.
