# Проверка заключительной волны recovery

Дата: 17 октября 2026. Проверяемый диапазон `4562decd..643f609d`, реализация `fix/draft-restore` в `bidplace-seller-profile-structure`. Только аудит, код приложения не меняется. Проверяем закрытие A-01/A-02/A-03/A-04/C-01, без полного повторного прогона проекта.

## Принятые исправления и остаток

- `moveStoredDraft` больше не перезаписывает валидный занятый destination; legacy source сохраняется при конфликте/quota. Recovery умеет читать оставшийся source. Это правильное исправление ранее воспроизведённых A-01/A-04.
- Recovery action использует общую TextButton и AppDialog/selectable AppText; rejected/absent clipboard больше не молчат. Copied state связан с payload.
- C-01: теперь обратный обход идёт по всему `visitOrder.slice(0,-1).reverse()` со строгим фокусом каждого элемента. Исходное замечание устранено по коду.
- A-02: guard добавлен на повторную гидратацию, но initial state всё ещё создаётся `fromServer(identity, story)` до проверки attribution. Cold mount и waiting state проверены дополнительными пробами — RF-01 ниже.

## Осталось исправить

### RF-01 — P2: A-02 не закрыт при cold mount и в write-путях waiting state

**Места:** `apps/mobile/src/features/sellers/use-product-story-editor.ts:250–252` (initial state), эффект около 550–650, `change` около 655, `save` около 811. `docs/product/11-PROJECT-STATUS.md` заявляет, что waiting state нельзя сохранить, но такого guard в save нет.

**Подтверждение отдельными тестами текущего hook:**
1. Cold mount с revision=r1, storyRevisionId=r2 и story text=FOREIGN: editor.blocks содержит FOREIGN. Эффект отказывается гидратировать чужой snapshot, но он уже попал в initial state.
2. После перехода к r2 при ещё старом snapshot r1 добавление paragraph проходит. Waiting state не запрещает ввод.
3. В той же последовательности заполнить paragraph и вызвать save: запрос replaceCreation отправляется. В тесте ожидалось отсутствие вызова API.

Это остаток уже согласованных критериев A-02, не новая глобальная переделка. **Граница доказательства:** экран сейчас берёт обе revision из одного productDetail ответа; реальный пользовательский случай их расхождения в браузере этим ревью не установлен. Подтверждено нарушение публичного контракта hook и неверное утверждение в статусе, не обход серверных прав.

**Целевое решение:** один вычисляемый признак принадлежности snapshot использовать ещё до initial state и при каждом чтении/изменении baseline. Явно различить допустимый новый локальный черновик до серверной revision и ожидание согласованного snapshot уже существующей revision. Только во втором случае блокировать add/edit/remove/reorder, upload и save; не использовать общий `!serverHydrated` как запрет всего — это сломает ввод до первого серверного сохранения. Достаточно узкого состояния/признака в существующем owner, отдельный generic state-machine framework не нужен. Если возвращается readiness для UI, передать его существующим controls; API запрет остаётся в hook, не только disabled на кнопке. Не ретегировать чужие блоки как принадлежащие новой revision.

**Критерии завершения:**
- Cold mount с чужим или отсутствующим attribution для существующего snapshot не показывает его блоки.
- Waiting state не меняется от команд редактирования и не вызывает save/upload API.
- При приходе согласованного snapshot редактирование разблокируется, в том числе если token остался 0.
- Новая работа до первого server-save по-прежнему принимает/восстанавливает ввод; не блокировать её отсутствующим revisionId.
- Собственный save/refetch, разные account/product, текущие 30 owner tests и screen recovery scenarios не регрессируют.
- В статусе «нельзя сохранить» появляется только после проверки отсутствия вызова API, а не только проверки blocks.

## Матрица коммитов и решение о приёмке

| Коммит | Что проверено | Решение |
|---|---|---|
| 4ac852f5 | destination collision, recovery source, ownership effect, existing owner specs | A-01/A-04 принимаются в проверенном scope; A-02 требует RF-01. Cold/waiting guards не доделаны. |
| 52b9601c | общий UI recovery, clipboard success/reject/absent/payload tests | A-03 принимается по исходникам и screen-level specs. Реальный dialog/focus/выделение длинного текста ещё не проверены браузером. |
| 1e855741 | полный обратный Tab-маршрут | C-01 исправлен по коду. 2/2 browser pass — отчёт исполнителя, здесь не повторялся. |
| 643f609d | status и resolutions | Общий Partial честен, конкретное утверждение о запрете save waiting state неверно — исправить вместе с RF-01. |

**Что делать дальше:** один короткий технический пакет RF-01. Затем ограниченная финальная приёмка: recovery dialog в реальном браузере (ручное выделение/копирование длинного текста, scroll, focus return), настоящий browser zoom 200% и text enlargement у login. Не перезапускать глобальную чистку, не переделывать принятый пакет B. Существующий product-story-revision browser gate повторять после изменения поведения story; весь unit-suite/build не запускать после каждой мелкой правки. Один необходимый production web build перед итоговой сдачей полезен: после последних пакетов он не подтверждён.

Оставшиеся отличия от Figma не исправлять экранными костылями. Сверить через общий token/variant owner; отсутствие live доступа допускает приёмку pinned ZIP с явной оговоркой, но не автоматическое согласование отличающихся цветов/насыщенности. Реальный zoom не заменять CSS zoom.

## Проверки и ограничения

Собственные: **41/41** в двух существующих specs (story owner + product screen characterization), 1.17s; **3 дополнительных красных сценария** RF-01 (cold mount, edit waiting, save waiting); `git diff --check 4562decd..643f609d` чисто. Пробы: `/private/tmp/bidplace-story-review/followup-review.spec.ts`, config рядом; приложение не менялось. Graph coverage старый/metadata_changed — выводы по текущим исходникам.

Не повторялись полный 882/882, tsc/lint/build, browser E2E, live Figma, zoom/text-scale, API/DB/native. Их результаты не выдаются за собственную проверку. Серверных изменений в рассмотренном diff нет.

## На пальцах: сколько осталось

Большая часть этой волны принята. До перехода к следующему UI-экрану остались **один локальный guard-fix и финальная браузерная приёмка**, а не ещё несколько волн архитектурного рефакторинга. Готовность frontend к тиражированию экранов — примерно **7/10**, после RF-01 и приёмки ориентир **8/10**. Это оценка рассмотренной области, не процент закрытия долга всего проекта. Дизайн остальных экранов можно готовить параллельно; массовую реализацию до приёмки эталона не открывать.

## Как воспроизвести RF-01 в существующей owner-спеке

Использовать существующий mount helper. Для cold mount добавить ему необязательный параметр initialAttribution (default revisionId) и передать в первоначальный render четвёртым аргументом.

```ts
// Cold mount:
const view = mount('user-a', {
  storyToken: 0,
  blocks: [{ id: blockId, position: 0, type: 'PARAGRAPH', text: 'FOREIGN' }],
}, 'another-revision');
expect(view.editor.blocks).toEqual([]);

// Waiting-state edit (отдельный тест):
const view = mount('user-a');
view.render(1, '92222222-2222-4222-8222-222222222222',
  { storyToken: 0, blocks: [] }, revisionId);
act(() => view.editor.addText('PARAGRAPH'));
expect(view.editor.blocks).toEqual([]);
```

Для проверки save сначала создать валидный dirty draft, затем перевести owner в несовпадающий attribution и вызвать save; assert — replaceCreation не вызван. Текущая диагностическая проба создавала и заполняла paragraph уже в waiting state (что пока разрешено) и также показала вызов API. После запрета edit не подгонять тест удалением save-assert: сохранить самостоятельную проверку отсутствия API-запроса.
