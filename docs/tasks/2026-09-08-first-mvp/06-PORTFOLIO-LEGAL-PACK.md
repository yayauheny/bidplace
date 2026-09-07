# Промт 06 — legal pack первого portfolio MVP

Рекомендуемый исполнитель: documentation/legal-preparation агент; финальное заключение
даёт юрист Республики Беларусь.
Ветка: `feature/portfolio-legal-pack`.

## Готовый промт

Ты работаешь в `/Users/yayauheny/projects/bidplace`. Подготовь F11: одну согласованную
portfolio-only редакцию legal pack и отдельный компактный пакет вопросов юристу
Беларуси. Это подготовка материалов, а не юридическое заключение. Не merge, не создавай
PR и не помечай lawyer gate закрытым без фактического ответа юриста.
Начни с clean актуальной `main`, запиши её SHA и создай указанную feature branch.

### Цель и критерии успеха

Сначала перечисли документы, фактические inputs и отсутствующие founder/provider
данные. Успех preparation phase:

- тексты описывают только public creator portfolio, auth, moderation, media, share/QR;
- auction/sale rules сохранены в repo, но явно не действуют для первого MVP;
- privacy/cookie тексты точно следуют принятому data inventory пакета 04 и object
  storage/email/hosting facts; unknown не выдуманы;
- author rules покрывают права на media/text, license для display/share/editorial use,
  moderation, hide/delete и prohibited content;
- registration, cookies, application и Work-submit controls сведены в UI placement
  matrix с version/evidence requirements;
- operator details, provider countries/contracts, retention и спорные основания имеют
  явные placeholders/вопросы, а не фиктивные ответы;
- юрист получает один пакет с вопросами в формате `можно/нельзя/можно при условиях`,
  требуемой нормой, UI text и документом назначения.

### Обязательное чтение

Прочитай AGENTS и product core; `docs/legal/README.md`, `00-MVP-LAUNCH-CHECKLIST.md`,
`02-LAWYER-ANSWERS-2026-08-24.md`, `04-DOCUMENT-SET.md`,
`06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`, drafts и legal research. Прочитай factual
data inventory, object-storage result и фактические API/UI controls после пакета 05.
Raw research — источник, не продуктовая инструкция. Не переносить чужие marketplace
тексты дословно.

### Сравнение подходов

- **Durable fix:** один portfolio-only document set, purpose/data map, versioned
  acceptance evidence и пакетная проверка местного юриста.
- **Acceptable workaround:** placeholders для ещё не выбранного provider/operator
  значения, только если они явно блокируют publication и перечислены в checklist.
- **Hack:** скопировать commerce оферту, объявить закон понятным без источника или
  спрятать consent в общей кнопке — запрещено.

### Работа

1. Сопоставь каждый фактический screen/API/data field с документом и legal control.
2. Адаптируй drafts: user agreement; privacy/cookies; PD consent только для целей, где
   он может требоваться; author rules; prohibited content/rightsholder procedure.
3. Сохрани `05-auction-and-sale-rules.md` как deferred, не публикуй его как First MVP.
4. Обнови lawyer questions по реальным unknown: registration basis, age, license,
   moderation claims, rightsholder process, retention, cookies/analytics, providers и
   cross-border processing.
5. Подготовь review manifest: версия каждого файла, unresolved placeholder, связанный
   screen/control, evidence to retain и blocking status.
6. После получения ответа юриста отдельный агент/commit должен внести только одобренные
   изменения и записать дату/source; не симулируй этот этап сейчас.

### Проверка

Здесь нет unit tests. Выполни document QA:

```bash
rg -n "аукцион|ставк|покупател|продаж|оплат|достав|лот" docs/legal/drafts docs/legal/00-MVP-LAUNCH-CHECKLIST.md
rg -n "TODO|TBD|UNKNOWN|PLACEHOLDER|уточнить" docs/legal
pnpm format:check
git diff --check
git diff --name-only -- '*.pen'
```

Каждое совпадение первой команды классифицируй: допустимое deferred упоминание или
commerce leakage. Не удаляй будущие задачи/документы. Проверяй внутренние links,
consistent operator naming, dates/version IDs и соответствие UI matrix фактическому
flow.

### Не входит

Не давать юридическое заключение, не выбирать hosting/storage/email provider, не
вводить KYC/payments/commerce rules, не менять code/UI/Figma/`.pen`, не заполнять
реквизиты или контакты догадками.

### Git и отчёт

Один docs-only commit:

```text
implement feature:

* changed legal drafts for portfolio scope
* added lawyer review manifest
* updated launch legal checklist
```

Верни общий формат, manifest документов, unresolved blockers, точный текст пакета для
юриста, grep classification и statement `Lawyer approval: not received` или ссылку на
фактический dated answer.
