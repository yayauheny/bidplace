# bidplace — дизайн handoff

Последнее обновление: 2026-07-18

Статус: Confirmed workflow; no Figma workspace linked

## Связь Pen/Figma и кода

- Каждый screen frame содержит стабильный screen name, platform/viewport, state и scope.
- В handoff записываются фактическая Figma URL или путь к Pen canvas/frame и
  route; ссылки и пути не придумываются.
- Route связывается с product flow из `02-USER-FLOWS-AND-SCREENS.md`, а поведение — с `docs/product/05-MVP-RFC.md`.
- Если route отсутствует, пишется `Not implemented`, а не предварительный путь как факт.
- Pen canvas служит только для утверждения visual direction. `modernTokens` и
  shared Expo primitives остаются implementation source of truth; нельзя
  вставлять сгенерированный Pen HTML/CSS в production без отдельной адаптации.

## Именование

Frame:

```text
[MVP|Future] / [Buyer|Seller|Admin|Public] / Screen name / [Mobile|Desktop] / State
```

Пример: `MVP / Buyer / Auction Details / Mobile / Outbid`.

Components:

```text
Domain/Component/Variant/State
```

Пример: `Auction/BidButton/Primary/Loading`.

Использовать product vocabulary. Не вводить `product`, `order`, `checkout` или `shop` как доменные термины, если соответствующая механика не подтверждена.

## Обязательные состояния

- default, loading, empty, error;
- disabled, focus, pressed, success;
- offline/stale/reconnecting для live screens;
- scheduled/active/ended/result для auction;
- own winning/outbid/won/lost для participation;
- mobile and desktop, а при различии — tablet;
- MVP или Future на каждом frame.

## Передаваемые данные

- использовать semantic token name, не только hex/pixel;
- указывать spacing, max width, aspect ratio, crop/content fit и touch target;
- перечислять required/optional fields и realistic edge cases;
- описывать source of truth, refresh/realtime и sensitive/public fields;
- прикладывать SVG/raster assets с правами и экспортными настройками;
- отсутствующие assets отмечать `Missing asset: ...` с owner, не заменять случайным placeholder как финальным.

## Изменения и ограничения

- Дизайнер ведёт version/date и changelog в handoff-записи.
- Разработчик фиксирует техническое ограничение, влияние, durable option и вопрос; flow не упрощается молча.
- Изменение продуктового flow требует обновления owner-документа и, для MVP, явного решения по `05-MVP-RFC.md`.
- После реализации обновляются `03-DESIGN-SYSTEM.md` (shared changes) и `04-DESIGN-STATUS.md`.
- `Ready for implementation` подтверждает дизайнер/основатель только при заполненных states/data/responsive/accessibility/open questions.

## Design QA

1. Сверить target frames на согласованных viewport/device.
2. Проверить реальные данные, длинные строки, отсутствие изображений и ошибки.
3. Проверить keyboard/focus, screen reader labels, contrast, 44 px touch и reduced motion.
4. Для auction сверить server snapshot, countdown, minimum bid, pending/success/rejected, background/resume и reconnect.
5. Зафиксировать расхождения с severity и owner.
6. После исправлений обновить `04-DESIGN-STATUS.md`; без QA оставлять `Needs verification`.

## Где хранить ссылки и Pen source

- Общую Figma project/file URL — в этом документе после её получения.
- Screen-specific node URL — в handoff-записи и при необходимости в `04-DESIGN-STATUS.md`.
- Главный Pen canvas — `../../design/pen/bidplace-web.pen`; screen frame
  указывается стабильным названием из canvas, approved export — относительным
  путём из `../../design/pen/exports/`.
- Нумерованные prompts текущих экранов —
  `../../design/pen/01-SCREEN-PROMPTS.md`; они не заменяют owner-документы.
- Не хранить access tokens или private credentials в репозитории.

Figma project: `Not provided`.

Pen workspace: `../../design/pen/bidplace-web.pen` (initialized; no visual
direction approved through Pen yet).

## Handoff template

```markdown
## Screen: Auction Details

Figma:
Pen source/frame:
Approved export:
Route:
Product flow:
MVP status:
Responsive states:
Components:
Required data:
Loading:
Empty:
Error:
Realtime:
Accessibility:
Open questions:
Implementation status:
```
