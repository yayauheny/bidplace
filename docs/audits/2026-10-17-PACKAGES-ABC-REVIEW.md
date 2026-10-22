# Проверка исправлений A/B/C — 17 октября 2026

Диапазон `5ca4c0db..4562decd`, ветка реализации `fix/draft-restore`, чтение из `bidplace-seller-profile-structure`. Код приложения не меняется. Ревью завершено в указанных ниже границах. Цель — проверить исправления предыдущих замечаний, а не запускать весь проект заново.

## Замечания к UI и приёмке

### C-01 — P2: «двусторонний обход» тестирует назад только один переход
`apps/mobile/e2e/login-figma-acceptance.spec.ts`: прямой проход перечисляет все поля/действия, обратный loop заканчивается сразу после фокуса visitOrder[8] (предпоследняя legal-ссылка). Остальные элементы Shift+Tab не проверены. Отчёт о полном двустороннем обходе завышен.
Решение: после последней ссылки пройти `visitOrder.slice(0,-1).reverse()` с одним Shift+Tab и строгим toBeFocused для каждого элемента; отдельно подтверждать focus return по закрытию существующим owner-тестом. Без дополнительных retries для обхода порядка.
Критерий: весь обратный маршрут проверяется, тест краснеет при пропуске любого промежуточного focus target. CSS zoom уже правильно назван дополнительным; real zoom/text-scale остаются Needs verification, это не закрытая приёмка.

### A-03 — P2: recovery-копирование молча не работает при недоступном Clipboard API
`apps/mobile/src/features/sellers/product-draft-screen.tsx:336–356`: optional chaining для отсутствующего clipboard ничего не делает; reject только сбрасывает recoveryCopied=false. Пользователь не узнаёт, почему спасение текста не состоялось. Добавлен голый Pressable вместо существующего общего действия. Состояние recoveryCopied не сбрасывается при изменении recoveryText (key на Pressable не сбрасывает state родителя).
Решение: использовать существующую UI-кнопку; при clipboard failure/absence показывать доступный для ручного выделения текст в существующем dialog и понятное сообщение. Привязать статус копирования к текущему payload, сбрасывать при его смене. Не вводить clipboard-библиотеку ради этого.
Критерий: clipboard success, rejected Promise, API absent и смена recoveryText проверены; во всех случаях сохранённый текст можно получить, неверного «Скопировано» нет. Проверять web-контракт, native storage не добавлять.

### A-01 — P1: миграция legacy затирает уже существующий активный черновик
`apps/mobile/src/features/sellers/use-product-story-editor.ts:moveStoredDraft/restoreDraft` (около 317–370): перед чтением activeKey legacy безусловно копируется в этот key. Проверки занятости назначения нет. Достаточно двух записей для одной revision: active='NEW ACTIVE', legacy='OLD LEGACY', оба token0. При mount остаётся OLD LEGACY; новый ввод уничтожен. Такая пара возможна при старой открытой вкладке или неуспешном удалении источника миграции; timestamp для выбора более свежего отсутствует.
**Воспроизведено** дополнительным hook-тестом на 4562decd: expected NEW ACTIVE, actual OLD LEGACY.
Целевое решение: существующий валидный active для текущей revision сохраняет приоритет; legacy не перезаписывает его. Совпадающие payload можно дедуплицировать, отличающийся legacy сохранить отдельной recovery-записью. Уже занятый recovery тоже не затирать: key должен сохранять различимые исходные копии либо миграция должна оставить источник до явного разрешения. Не выбирать по token между ревизиями, не добавлять автоматическое слияние текста.
Критерии: active+legacy разных текстов → active восстановлен и оба текста доступны; одинаковые копии не размножаются; повторный mount идемпотентен; failed-copy/remove не уничтожает единственный источник; save чистит только active, logout все account-копии. Проверки дописать в текущий story owner spec, не создавать отдельный слой миграций общего назначения.

### A-02 — P2, архитектурный контракт: storyRevisionId проверяется не на всех путях гидратации
`use-product-story-editor.ts:useEffect`, около 510–588: snapshotBelongs вычисляется только при смене identity; ветки restoredFor != identity и большего storyToken применяют snapshot без проверки владельца. Инициализация fromServer также не проверяет attribution. Значения undefined при этом считаются belonging, вопреки комментарию «без attribution snapshot удерживается».
**Воспроизведено**: перейти с r1 на r2, пока snapshot помечен r1/token0; затем обновить всё ещё r1 snapshot до token1/'WRONG REVISION'. Редактор r2 принимает чужие блоки. Тест expected [], actual WRONG REVISION.
Важно: экран сейчас подаёт revisionId и storyRevisionId из одного productDetail объекта. Полный пользовательский сбой с разъехавшимся query этим ревью не доказан; находка касается добавленного и заявленного защитного контракта hook, а не утверждения о текущей утечке данных.
Целевое решение: один predicate/тип принадлежности baseline для initialization и всех веток hydrate/refetch. Если снимок не принадлежит активному account/product/revision, не применять его и не разрешать сохранение под чужой identity. Не ретегировать previous state на новый product/account ради промежуточного сохранения. Сохранять простую архитектуру: либо owner всегда поставляет атомарную пару identity+snapshot и hook не притворяется, что поддерживает несогласованные пары, либо явно поддержать waiting state с единым guard. Для текущего добавленного storyRevisionId выбрать второй вариант, поскольку existing own-save regression уже моделирует ожидание owner-refetch.
Критерии: повторное обновление чужого snapshot не гидратирует; корректный snapshot затем гидратирует даже при равном token; pending/waiting нельзя сохранить; собственный save/refetch и переключение product/account не переносят старые блоки. Проверить cold mount с несовпадающим attribution.

### A-04 — P2: failed recovery migration сохраняет байты, но скрывает recovery от пользователя
`moveStoredDraft` возвращает void; restoreDraft читает recovery только из destination. При quota на copy legacy остаётся, но notice/recoveryText отсутствуют. **Воспроизведено**: legacy другой revision содержит RECOVERY TEXT, setItem бросает QuotaExceededError → recoveryText=null.
Решение: вернуть результат миграции; если copy не удался, показать recovery из сохранённого source и warning о невозможности записи. Recovery-доступ не должен зависеть от свободного места для второй копии. При denied-read не обещать прочитанный текст. Использовать один storage result contract, без тихого catch.
Критерии: quota на copy → исходник не удалён, текст доступен через recovery-действие, предупреждение видно; повтор при восстановлении storage идемпотентен и не затирает active/recovery (A-01).

## Что принято и что ещё не доказано

| Пакет / коммиты | Вывод |
|---|---|
| A: e5f246ef + 117bd4b4 | Исходные три regression-сценария получили исправления, 27 story owner tests зелёные. W6-01 (unsupported/denied) закрывается в проверенном scope. W5-01/W5-02 нельзя закрывать безусловно: A-01/A-02/A-04 + recovery UI A-03. |
| B: 708844b3 + 500cdfc2 | Chip gradient теперь из семантических ролей; mounted tests расширены; карта честно оговаривает SVG mocks. PLAN entry point обновлён. Принимается в заявленных границах. Focus E2E проверяет CSS-variable→computed-outline на вставленном input и вручную меняет root variable, не переключает React provider. Это полезная проверка нижней части цепи, не end-to-end гарантия всех controls. Не нужен новый большой theme-framework. |
| C: 339fe9b1 + d119e23f | Sheet-only PNG просмотрен: молния убрана, legal читается. Полный Chromium PNG: чёрный квадрат на фоне остался, честно исключён из scope sheet. Таблица measured geometry/цветов появилась. Настоящий zoom/text scale остаётся Needs verification. C-01 требует дополнить обратный обход. |
| Статус: 4562decd | Формулировка «все три пакета закрыты» не соответствует частичной C и новым красным regression probes. Обновить resolution/status точечно, старые исторические записи можно оставить со ссылкой на новую оценку. |

## Собственные проверки и ограничения

- 7 адресных specs / **96 passed**, 4.96s: story editor, local form restore, achievements, storage, theme, AppDialog, chip style.
- 3 дополнительные проверки текущего hook / **3 failed**, 0.78s: A-01/A-02/A-04. Harness — копия mount helper существующего owner spec с импортом текущего production hook; приложение не менялось. Временные файлы `/private/tmp/bidplace-story-review/abc-review.spec.ts`, `abc.config.mjs`.
- `git diff --check 5ca4c0db..4562decd` чисто; просмотрены два сохранённых Chromium PNG, актуальные изменения owners/tests/docs. Граф metadata_changed (старый индекс 15 октября), использованы текущие исходники.
- Полные suites, build, live Figma, новый browser E2E и настоящий zoom здесь не запускались. 875/875 и браузерные результаты — отчёт исполнителя, не собственный повтор. Не проверялись API/DB/native, серверная логика в диапазоне не менялась.

## Следующая волна и готовность

1. Одна ограниченная волна **A-01/A-04/A-03**: lossless migration и доступная recovery. Это одна связанная ответственность, не три независимые обёртки.
2. **A-02**: единый ownership guard; сохранить зелёными собственный save/refetch и новые негативные сценарии. После этого точечный `product-story-revision.spec.ts` в Chromium/WebKit и необходимый build/typecheck/lint, без повторения всей матрицы после каждого изменения.
3. **C-01** + реальные zoom/text enlargement. Если выполнить вручную пока нельзя — оставить Needs verification, не выдавать CSS zoom за замену. Отделить документированную разницу с Figma от согласованного отклонения: ни толщина текста, ни цвет не становятся автоматически допустимыми от ярлыка NEEDS-FIGMA.
4. Обновить статусы и только затем принимать эталон для тиражирования. Самостоятельно остальные экраны не переносить.

Простыми словами: общая основа цветов и компонентов уже заметно лучше, её не надо переписывать снова. Основной остаток — надёжно перенести старые черновики без потери новых, дать пользователю реально забрать recovery-текст и закончить проверку одного экрана. До следующего UI-экрана остаются **две небольшие технические части и финальная приёмка**, а не новая глобальная чистка. Оценка готовности к массовой доводке UI — **6.5/10**, после этих gates целевой ориентир **8/10**; это экспертная оценка ограниченного frontend scope, не процент закрытого техдолга всего проекта.

## Воспроизведение дополнительных тестов без временных файлов

В существующем `use-product-story-editor.spec.ts` использовать его mount(), legacyStoryKey, activeStoryKey и revisionId:

```ts
it('keeps active input when a legacy copy also exists', () => {
  const payload = (text: string) => JSON.stringify({
    v: 2, revisionId, token: 0,
    blocks: [{ key: 'local', type: 'PARAGRAPH', text }],
  });
  localStorage.setItem(activeStoryKey, payload('NEW ACTIVE'));
  localStorage.setItem(legacyStoryKey, payload('OLD LEGACY'));
  const view = mount('user-a');
  expect(view.editor.blocks.map(b => b.type === 'IMAGE' ? '' : b.text))
    .toEqual(['NEW ACTIVE']);
});
it('does not apply repeated snapshots from another revision', () => {
  const view = mount('user-a');
  const next = '92222222-2222-4222-8222-222222222222';
  view.render(1, next, { storyToken: 0, blocks: [] }, revisionId);
  view.render(1, next, { storyToken: 1, blocks: [
    { id: blockId, position: 0, type: 'PARAGRAPH', text: 'WRONG REVISION' },
  ] }, revisionId);
  expect(view.editor.blocks).toEqual([]);
});
it('offers the recovery source even when its migration cannot write', () => {
  localStorage.setItem(legacyStoryKey, JSON.stringify({
    v: 2, revisionId: 'old', token: 0,
    blocks: [{ key: 'local', type: 'PARAGRAPH', text: 'RECOVERY TEXT' }],
  }));
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('quota', 'QuotaExceededError');
  });
  expect(mount('user-a').editor.recoveryText).toBe('RECOVERY TEXT');
});
```
