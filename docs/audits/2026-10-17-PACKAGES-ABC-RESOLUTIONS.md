# Резолюции повторного аудита A/B/C — 17 октября 2026

Аудит: `docs/audits/2026-10-17-PACKAGES-ABC-REVIEW.md` (ветка `fix/packages-abc-audit`,
коммит `41503488`, HEAD реализации на момент аудита `4562decd`). Пакет B принят
в заявленных границах и заново не переписывался. Все правки — на `fix/draft-restore`.

## A-01 — миграция legacy затирала активный черновик → Исправлено

- `moveStoredDraft` возвращает результат (`moved | kept-source | nothing`);
  занятый другим payload назначение не перезаписывается, совпадающие копии
  дедуплицируются, failed-write оставляет источник (код `4ac852f5`).
- Красный regression «active='NEW ACTIVE' vs legacy='OLD LEGACY'» зелёный;
  повторный mount идемпотентен, оба текста доступны, save чистит только
  active, logout — префикс account (прежние сценарии без изменений).
- Дополнительно найден и исправлен смежный дефект двухфазного mount: пока
  owner query грузится, `revisionId` undefined, и миграция закапывала копию
  в recovery-ключ без revision, который загруженная revision не читала
  (notice исчезал после загрузки данных). Теперь без revision ничего не
  мигрирует; чужая копия предлагается из исходника на месте, миграция в
  revision-scoped namespace происходит, когда revision известна.

## A-04 — failed recovery migration скрывал recovery-текст → Исправлено

- При quota/denied на copy источник остаётся; `recoveryText` читается из
  сохранившегося источника, notice виден (код `4ac852f5`).
- Красный regression (QuotaExceededError → recoveryText='RECOVERY TEXT')
  зелёный; повторный mount после восстановления storage не затирает
  active/recovery.

## A-02 — ownership guard не на всех путях гидратации → Исправлено

- Один predicate на эффект: snapshot с чужой или отсутствующей revision
  attribution удерживается (waiting state) на путях identity change,
  первого restore и external-save (`storyToken > previous.token`);
  `undefined`-attribution при наличии snapshot больше не считается
  belonging (код `4ac852f5`).
- Красный regression (повторное обновление чужого r1-snapshot не
  гидрирует r2) зелёный; собственный save/refetch, гидрация внешней
  новой revision и cold-mount сценарии прежних specs зелёные; сравнение
  token между ревизиями не вводилось.

## A-03 — recovery-копирование молча не работало без Clipboard API → Исправлено

- Действие — общая `TextButton`; reject/отсутствие API открывает
  существующий `AppDialog` с полным текстом, доступным для ручного
  выделения (`selectable`), и понятным сообщением (код `52b9601c`).
- Статус «Скопировано» привязан к скопированному payload и сбрасывается
  при смене recoveryText. Clipboard-библиотека не вводилась.
- Screen-level contract: success / rejected / absent / payload-change —
  4 теста в characterization spec.

## C-01 — обратный обход проверял один переход → Исправлено

- Обратный маршрут: `visitOrder.slice(0, -1).reverse()`, один Shift+Tab и
  строгой `toBeFocused` на каждом шаге; пропуск любого target красит тест
  (код `1e855741`). Спека зелёная в Chromium и WebKit.

## Проверки этой волны

- Unit: 882/882 (136 файлов), включая 3 новых regression-теста hook и
  4 новых screen-level теста; typecheck `tsc --noEmit` чист; eslint по
  затронутым файлам чист.
- Browser: `login-figma-acceptance.spec.ts` 2/2 (chromium, webkit);
  `product-story-revision.spec.ts` 2/2 (chromium, webkit).
- Полный suites/build, API/DB/native, live Figma не запускались; серверное
  сохранение не менялось.

## Остаток (честно)

- Реальный browser zoom и увеличение текста в приёмке login — Needs
  verification (ручная инструкция в evidence README прежней волны).
- Три стилевых расхождения и копия legal — на product/NEEDS-FIGMA против
  dated ZIP-эталона; live Figma сверка не выполнялась.
- Push/merge/deploy не выполнялись.
