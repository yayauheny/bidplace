# Резолюции повторного ревью волн 5–11

Исполнение по `docs/audits/2026-10-16-WAVES-5-11-REVIEW.md` (ветка `fix/waves-5-11-audit`, коммит `acd6695a`).
Рабочая ветка: `fix/draft-restore`. Формат находки: исправление → доказательство → проверки → оставшийся риск → SHA.

## Пакет A — сохранение данных (W5-01, W5-02, W6-01)

**SHA: `e5f246ef`** (код; docs в этом файле).

### W5-01 — принадлежность revision по величине token

- **Исправление**: token больше никогда не сравнивается между ревизиями.
  `confirmedSave` тегируется revisionId сохранённой ревизии; экран передаёт в
  хук `storyRevisionId` — ревизию, которой принадлежит текущий снимок owner
  query (источник: `productDetail.data`, тот же ответ, что и `revisionId`).
  Переход к иной revision гидратирует её данные, когда снимок принадлежит целевой
  ревизии; если owner ещё отдаёт чужой снимок (пред-save снапшот), он не
  выдаётся за новую ревизию — подтверждённые блоки сохраняются до согласованного
  refetch (без token-условия). Промежуточное несогласованное состояние получает
  пустой not-yet-hydrated baseline, а не старую story. Серверная модель
  сохранения и API не менялись.
- **Доказательство**: регрессия «mount r1 → save «Текст» (token1) → refetch
  r1/token1 → внешняя r2/token0/«External revision»» — красной на HEAD
  (`5ca4c0db`), зелёной после фикса; wizard own-save/refetch («keeps saved
  blocks when the story moves to a new revision») сохранён зелёным без
  ослабления; same-revision refetch гасит подтверждение (сравнение только
  внутри ревизии).
- **Проверки**: owner-спека редактора 27/27; полный mobile vitest 872/872
  (было 866, +6); tsc --noEmit, eslint, prettier — чисто.
- **Оставшийся риск**: сценарий «owner отдаёт чужой снимок после ревизионного
  перехода» покрыт hook-уровнем; полный браузерный wizard-прогон с реальной
  задержкой ответа не гонялся (адресный e2e продукта — за финальным gate).

### W5-02 — recovery-копия другой ревизии терялась при следующем редактировании

- **Исправление**: активные story drafts разделены по account/product/revision
  (`<productId>@<revisionId>`; creation flow — прежний ключ `new`). Ключ без
  revision — legacy-поверхность: при чтении чужая/без-revision запись мигрирует
  copy → confirm write → delete source в recovery-неймспейс (`…~recovery`);
  при отказе записи источник остаётся. Подтверждённый save чистит только
  активную ревизию; submit чистит все story-ключи продукта (prefix-clear);
  logout чистит весь аккаунт включая recovery. Заметка сопровождается
  `recoveryText` и действием «Скопировать сохранённый текст» (clipboard,
  прецедент `public-share.ts`) — восстановление через DevTools не требуется.
- **Доказательство**: последовательность «draft другой ревизии с «RECOVERY
  TEXT» → открыть текущую → notice → новый ввод → 500ms → save» — красной на
  HEAD, зелёной после фикса (копия переживает ввод, save и хранится в
  recovery-ключе). Существующие спеки не-применения чужих копий усилены:
  вместо «запись не тронута» — «запись перенесена в recovery, контент цел».
- **Проверки**: owner-спека 27/27 (включая обновлённые ключевые ожидания),
  полный vitest 872/872, tsc/eslint/prettier чисто. E2E
  `product-story-revision.spec.ts` переведён на новый контракт (legacy-ключ
  пуст, recovery-ключ содержит «Устаревший»).
- **Оставшийся риск**: recovery — один слот на revision-scope (новая чужая
  копия перезаписывает прежнюю); автослияние ревизий вне MVP (по аудиту).
  E2E-прогон в браузере не выполнялся в этом пакете (контракт обновлён,
  прогон — за gate).

### W6-01 — 'unsupported' трактовался как ошибка у writer'ов

- **Исправление**: `storage()` различает отсутствие API ('unsupported' — native)
  и ошибку доступа к существующему API (getter бросает SecurityError → 'denied'
  → write 'failed'); предупреждение показывается только при 'failed'
  (`draftWriteNeedsWarning`) единообразно у всех трёх writer'ов + копии при
  entity-created. `typeof localStorage` внутри try/catch — typeof тоже дёргает
  геттер. Native storage не добавлялся.
- **Доказательство**: «нет localStorage + ввод + flush → нет warning» красным
  на HEAD (warning показывался), зелёным после фикса у всех трёх writer'ов
  (story editor, form restore, achievements); «getter бросает → failed/warning»
  покрыт unit-тестом адаптера; «успешная запись снимает ошибку только своего
  writer» — существующие спеки зелёные.
- **Проверки**: 4 адресные спеки 69/69; полный vitest 872/872; tsc/eslint/
  prettier чисто.
- **Оставшийся риск**: состояние denied проверяется unit-уровнем (jsdom-геттер);
  реальный sandboxed-iframe не воспроизводился.

## Пакет B — общие компоненты и очередь (W9-01, W10-01, PLAN-01)

SHA кода и доков — в заголовках коммитов ниже; проверки фиксируются по
состоянию на момент коммита.

### W9-01 — видимые стопы chip-градиента не были в палитре

- **Исправление**: в `SemanticColorMap` добавлены роли
  `chipBorderGradientStart/End` (light — verbatim бывшие литералы
  `rgba(255,255,255,0.16)` / `rgba(153,153,153,0.16)`; black — provisional
  `rgba(255,255,255,0.22)` / `rgba(150,150,150,0.22)`). `figma-chip-style.ts`
  читает оба стопа из палитры для onDark/tinted (onGlass — как раньше
  glassBorder); экспорт `figmaChipGradientStroke` удалён. Ограниченный
  поиск видимых литералов: `FilterSheet` handle `#efefef` → `palette.quietFill`;
  `cover-frost-style` gradientStart 'rgba(0,0,0,0)' — тема-независимый
  технический цвет, оставлен с комментарием. Технические цвета mask в токены
  не выносились.
- **Доказательство**: «other-палитра меняет оба стопа» — новый тест в
  `figma-chip-style.spec.ts`; 9/9 спека, обе темы.
- **Проверки**: полный vitest 875/875, tsc/eslint/prettier чисто.
- **Оставшийся риск**: black-стопы — экспертная оценка (provisional), до
  black-дизайна не верифицируются; реестр намеренно постоянных media/brand
  цветов не заводился (вне скоупа замечания).

### W10-01 — завышенные гарантии theme-gate в карте владельцев

- **Исправление**: в `theme.spec.ts` добавлен mounted-smoke light→black на том
  же DOM-узле: FigmaButton (label/icon через палитру; surface — SVG, в jsdom
  замокан и честно не покрывается), FigmaIcon, FigmaChip (shell + оба стопа
  градиента рамки). В `AppDialog.spec.ts` — mounted-smoke поверхности диалога
  (моки View/ScrollView научены передавать flatten-style; стиль приходит через
  `Dialog.Content asChild` на ScrollView). Computed-цепочка CSS-focus
  (`--bidplace-focus` → outline) в jsdom не резолвится (проверено пробой) —
  вынесена в браузер: новый `e2e/theme-computed-focus.spec.ts` читает
  `getComputedStyle().outlineColor` при зеркалировании light/black ровно так,
  как это делает ThemeProvider (attribute + inline var). `16-COMPONENT-OWNERS.md`
  переписан: заявлены только доказанные гарантии с указанием файлов гейтов;
  black-палитра помечена тестовой (provisional).
- **Доказательство**: theme.spec 5/5, AppDialog.spec 13/13 (включая новый
  no-remount тест), e2e 2/2 (chromium + webkit).
- **Проверки**: полный vitest 875/875, tsc/eslint/prettier чисто.
- **Оставшийся риск**: FigmaButtonSurface (SVG-градиент кнопки) проверяется
  unit-спеками стиля, не mounted-DOM; до браузерного гейта графики кнопок
  гарантия ограничена.

### PLAN-01 — очередь следующей работы противоречила итогам аудита

- **Исправление**: `docs/audits/current/06-NEXT-REVIEWS.md` — шапка с
  entry point на актуальный аудит/резолюции и легендой статусов
  (implemented/verified/needs-design); секция 4: безусловное RESOLVED снято —
  зафиксированы W5-01/W5-02/W6-01 и коммит фикса, E2E-перезапуск outstanding;
  секция 10: источник сверки — live Figma с dated-ZIP fallback (по образцу
  приёмки login), canonical Pen как источник снят. Исторические отчёты не
  тронуты; механические gates (строки/чётность/число consumers) не переносились.
- **Доказательство**: diff файла — только три названные секции.
- **Проверки**: не требуются (документ).
- **Оставшийся риск**: файл остаётся очередью областей; закрытие PL-01/PL-02
  прежнего аудита частично (карта есть, реестр постоянных цветов нет).
