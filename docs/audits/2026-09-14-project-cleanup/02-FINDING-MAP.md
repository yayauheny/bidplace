# Карта находок

Все строки Imported / Needs revalidation; исполнение Not started. «Подтверждено» в источнике — оценка автора аудита, не повторная проверка в этом planning task.

| Исходный ID | Пакет |
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
