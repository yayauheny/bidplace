# bidplace — открытые решения portfolio MVP

Сверено: 2026-10-23. Portfolio-only граница не менялась. Текущая работа и
непроверенные gates находятся в [active backlog](16-PORTFOLIO-ACTIVE-BACKLOG.md)
и [release audit](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).

## Первая заявка: прежний вопрос больше не текущий blocker

Сентябрьское разночтение immediate-submit vs draft не описывает текущий код:
`SellersService.create` создаёт `DRAFT`, RFC §8 требует сохранять незавершённую
заявку; четырёхэтапный flow и проверки представлены в
[design status](../design/04-DESIGN-STATUS.md) и
[истории реализации](../archive/product/11-PROJECT-STATUS-historical.md).
Эта документационная сверка не создаёт нового founder decision и не заменяет
device/visual acceptance. Не запрашивать прежний выбор заново только по старому
checkpoint; при новом конфликте указать конкретный код и действующий контракт.

## Оставшиеся внешние вопросы

- [Final legal audit](../legal/00-FINAL-LEGAL-AUDIT.md) владеет вопросом об
  основании текущей персональной аналитики, publication facts и controls.
  Закрытые юридические вопросы не открывать заново.
- Cloudflare/R2/SMTP/Neon уже выбраны; публичные provider/country/backup facts,
  live acceptance и rollout — ops/release gates, а не новый выбор архитектуры.
- Механики offer/non-payment/second chance/handoff и продаж остаются в
  [post-MVP плане](15-POST-MVP-BACKLOG.md) и его
  [execution backlog](../archive/tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md).
  Они не блокируют portfolio launch.

Новый вопрос добавлять только при реальном изменении portfolio flow, schema,
permissions или public data. Незакрытый план удаления Work по DEC-123 остаётся
в active backlog; его технические/permission варианты требуют review перед кодом.
