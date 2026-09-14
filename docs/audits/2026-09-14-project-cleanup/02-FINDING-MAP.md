# Карта находок

Все строки Imported / Needs revalidation; исполнение Not started. «Подтверждено» в источнике — оценка автора аудита, не повторная проверка в этом planning task.

| Исходный ID (DATA:D* / LOGIC:BL-*) | Пакет |
|---|---|
| D1 | 02 |
| D2 | 02 |
| D3 | 11 |
| D4 | 11 |
| D5 | 07 |
| D6 | 06 |
| D7 | 08 |
| D8 | 09 |
| D9 | 05 |
| D10 | 09 |
| D11 | 12 |
| D12 | 12 |
| D13 | 06/11 preserve/inventory |
| D14 | 09 |
| BL-01 | 01 |
| BL-02 | 02 |
| BL-03 | 04 |
| BL-04 | 04 |
| BL-05 | 04 |
| BL-06 | 04 |
| BL-07 | 08 |
| BL-08 | 01 gate; 10 refactor |
| BL-09 | 10 |
| BL-10 | 02 projections; 09 lists |
| BL-11 | 12 |
| BL-12 | 03 |
| BL-13 | 12 |
| BL-14 | 01 |
| BL-15 | 02 matrix; 10/11 legacy |

## Гипотезы и дополнительные утверждения

- Противоречия readiness/architecture/status, flags/media/socialLink/counts/ILIKE — 13.
- Last reason, admin copy о снятии с публикации, slug/photo URL — проверить в 02.
- Whitespace title, post-SQL filtering/total, image counts unpublished — 01/05/10 по соответствующей границе, без изменения до подтверждения.
- Реальные orphan objects/рассинхрон content — 06/07/11, безопасный inventory; локальный код не доказывает staging state.
- Process-image privacy — 12; подтверждённый leak выделить срочно.
- ProductDraftCreationStep/PhoneVerificationCode и прочие removal candidates — 08 code reachability, 11/12 data/API gates. User.phone/packaging/handoff не удалять по отсутствию UI.
- parseImageKey UUID — 07 при доказанном impact, validation audit ожидается.
- Общую integration DB не трогать: каждый исполнитель доказывает изоляцию своего setup.

Списки «оставить» источников ограничивают все пакеты: pointers, privacy, locks, оправданный SQL CTE, тонкий database package, curator contract, seed fence, applied migrations и retained schema не удалять ради строк.

## Источники и namespace

- DATA:D* — [данные](sources/01-data.md).
- LOGIC:BL-* — [бизнес-логика](sources/02-business-logic.md).
- CROSS:B*/T*/G* — [сквозные гарантии](sources/03-cross-layer.md).
- VAL:D*/H* — [валидация с дополнением D13–D15](sources/04-validation.md).
- M-LOGIC-* / M:H* — [выписка mobile из сообщения](sources/05-mobile-logic-extract.md); полный оригинал в беседе.
- DS-* — [дизайн-система](sources/06-design-system.md).

VAL:D13 не DATA:D13; номера совпадают только внутри разных исходных аудитов.

| ID | Пакет / статус ожидания |
|---|---|
| VAL:D1 | 14 |
| VAL:D2 | 14 |
| VAL:D3 | 14 |
| VAL:D4 | 14 decision |
| VAL:D5 | 14 |
| VAL:D6 | 24 |
| VAL:D7 | 24 |
| VAL:D8 | 14 errors;04/15 form |
| VAL:D9 | 24 |
| VAL:D10 | 14 |
| VAL:D11 | 15;12 API decision |
| VAL:D12 | 19/24 |
| VAL:D13 | 20 deferred to legal |
| VAL:D14 | 24 |
| VAL:D15 | 24 deferred HTTP |
| M-LOGIC-01 | 17 |
| M-LOGIC-02 | 15 |
| M-LOGIC-03 | 16 |
| M-LOGIC-04 | 16 |
| M-LOGIC-05 | 04 |
| M-LOGIC-06 | 15 |
| M-LOGIC-07 | 15 |
| M-LOGIC-08 | 18 |
| M-LOGIC-09 | 18 |
| M-LOGIC-10 | 15/19 |
| M-LOGIC-11 | 24 |
| M-LOGIC-12 | 02 Reject;09 pagination |
| M-LOGIC-13 | 15 |
| CROSS:B1 | 20 |
| CROSS:B2 | 21;06/07 storage |
| CROSS:B3 | 17;02 DTO |
| CROSS:B4 | 04 |
| CROSS:B5 | 20 |
| CROSS:T1 | 19 |
| CROSS:T2 | 04/19 |
| CROSS:T3 | 19 |
| CROSS:T4 | 19 first |
| CROSS:T5 | 19 |
| CROSS:T6 | 12 decision |
| CROSS:T7 | 13 |
| CROSS:G1 | 04 |
| CROSS:G2 | 04 |
| CROSS:G3 | 15 |
| CROSS:G4 | 21 |
| CROSS:G5 | 21 |
| CROSS:G6 | 21 |
| CROSS:G7 | 21 external |
| DS-01 | 22 |
| DS-02 | 23 |
| DS-03 | 24 |
| DS-04 | 23 |
| DS-05 | 23/24 removal |
| DS-06 | 23 decision |
| DS-07 | 23 after04 |
| DS-08 | 23 after14 |
| DS-09 | 24 |
| DS-10 | 24 optional |
| DS-11 | 24 |
| DS-12 | 23 |
| DS-13 | 24 Deferred native |
| DS-14 | 22 prerequisite;13 final |
| DS-15 | 24 |

## Разногласия и подозрения новых источников

- CROSS chain6 говорит «401 clears session», M-LOGIC-03 — отсутствует global mutation recovery: 16 проверяет конкретные request paths, ни один отчёт не выбирается молча.
- CROSS:B3 запрещённый client start-edit дополняет DATA/LOGIC DTO проблему, но это отдельный 17; pending gate 01 остаётся строгим.
- VAL:H1–H5 — 14 воспроизведение HTTP limits/client parse/nested fieldErrors/slug; H4 analytics max — low impact inventory, не blocker без доказательства. VAL:H6 уточнён VAL:D13 → 20.
- M:H1/H2 — 04/15 dirty-refetch/double-submit tests; M:H3→16; M:H4→19; M:H5 native/deferred achievements не blocker; M:H6 retry:1 оставить без нового evidence; M:H7 shared pending UX в будущий visual audit.
- CROSS orphan/media cache/stale cookie→07/25; seed coupling→19; чужие itest schemas не чистить. G7 archive rulesets — external evidence, не локально подтверждённый факт.
- DS pressRing/close glyph/nativewind/ring applicability требуют runtime/reference proof в 23/24. Нет live Figma compare и owner/admin screenshots в source06; не заявлять pixel parity по этому аудиту.
- Packaging HEAD vs dirty не новая причина удалить API/schema; 15 проверяет уже сделанную независимую работу. Не присваивать чужой diff.
- «Открытие недели», About URL и brief facts — противоречия/решения, не автоматически bugs. 22/18/13.

Все новые строки Imported / Needs revalidation, Not started. Условный приоритет источника не независимое подтверждение severity.
