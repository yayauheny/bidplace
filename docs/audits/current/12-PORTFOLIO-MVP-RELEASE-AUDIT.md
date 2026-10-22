# Portfolio MVP — текущий release audit

Срез: 2026-10-23, release-база `872f22fc`. **Partial / Needs verification** для
публичной готовности: локальный green не закрывает внешние gates. Этот файл —
текущая сводка; [полный журнал](../../archive/audits/12-PORTFOLIO-MVP-RELEASE-through-2026-10-07.md)
сохраняет checkpoints, evidence и историю исправлений без переобъявления их актуальными.

## Открытые gates и ограничения

| Gate | Статус / что требуется | Owner |
| --- | --- | --- |
| Live R2/CDN purge (F11/D08) | Needs verification: hide/revoke, недоступность старого public URL, `?media_retry=1` и произвольного query; реальный storage/purge/cache-key contract. Transport doubles этого не доказывают. | [Cloudflare ops](../../ops/CLOUDFLARE-DEPLOYMENT.md), [FinOps audit](13-FINOPS-SCALE-TO-ZERO-AUDIT.md) |
| Recovery после остановки процесса (F01) | Accepted MVP limitation по DEC-101: обязательный срок ≤5 минут из DEC-097/099 отменён. Public-copy deletion, purge, journal, REVOKE/CLEANUP и retry/recovery после старта обязательны; live результат Needs verification. Старый URL может работать до успешного recovery. | [DEC-101](../../product/12-DECISION-LOG.md#dec-101-public-revoke-keeps-deletion-and-retry-without-a-hard-deadline), [Cloudflare ops](../../ops/CLOUDFLARE-DEPLOYMENT.md) |
| Auth abuse / delivery | Needs verification: production Turnstile hostname/WAF и SMTP mailbox delivery; принять сообщение SMTP не значит доставить его. PostgreSQL abuse/import migrations требуют согласованного rollout. | [Security](../../product/13-APPLICATION-SECURITY.md), [architecture](../../product/10-CODE-ARCHITECTURE.md) |
| Legal publication | Partial: незаполненные provider/country/backup/browser inventory facts, обещанные controls/cleanup и оставленный юристу вопрос об аналитике — по owner. Register evidence независим от lazy чтения DEC-125; это не legal readiness. | [Final legal audit](../../legal/00-FINAL-LEGAL-AUDIT.md) |
| Deploy / migrations / restore | Needs verification: актуальный release SHA/CI, backup+restore/checksum/rollback и live portfolio loop. Обязательны две новые media migrations перед API release. Docs-задача ничего не деплоит. | [Release/backup](../../ops/00-RELEASE-AND-BACKUP.md), [Cloudflare](../../ops/CLOUDFLARE-DEPLOYMENT.md) |
| Device / accessibility / visual | Partial: physical iOS/Android, Safe Area/native keyboard/motion, реальный zoom200%/text enlargement. Settings title geometry остаётся исключённой; desktop exact parity NEEDS-FIGMA по экрану. | [Design status](../../design/04-DESIGN-STATUS.md) |
| Удаление своих Work | Not implemented (DEC-123); hide/restore не tombstone. Отдельная волна с backend/security review и HTTP/transaction tests, не подменять fake CTA. | [Active backlog](../../product/16-PORTFOLIO-ACTIVE-BACKLOG.md) |

## Последние сохранённые проверки

Результаты ниже перенесены из записей объединённого MVP. В этой docs-задаче
runtime/CI/live checks заново не выполнялись.

| Checkpoint | Результат | Основание |
| --- | --- | --- |
| 2026-10-23, photo merge / PR #59 | `pnpm verify` passed: 479 API unit,1023 mobile,159 integration,28 прежних skips, web/iOS/Android export;6 media E2E Chromium/WebKit; production web build | [Project status](../../product/11-PROJECT-STATUS.md), [исходная запись](../../archive/product/11-PROJECT-STATUS-2026-10-20-23.md) |
| 2026-10-22, responsive UI merge | Verify passed,988 mobile,155 integration /28 skips,8 build tasks; ошибка API legal-pack закрыта `cc4911e5` | [Merge review](2026-10-21-INDEPENDENT-UI-REVIEW.md) |
| 2026-10-21, UI branch acceptance | Editor E2E26/26; UI68 passed /2 settings-title geometry failures; WebKit stress20/20. Geometry failures не скрыты, assertions/thresholds не ослаблены. | [Independent UI review](2026-10-21-INDEPENDENT-UI-REVIEW.md), [UI completion](2026-10-21-UI-COMPLETION.md) |

28 optional integration skips не считаются passes. Старые full-browser210/2 Home
Opening failures — исторический visual debt, без нового полного rerun; лимит0.12
не менялся. Точное CI merge SHA PR #59 отдельно не подтверждено этой задачей.

## Действующий контракт и совместимость

- Launch остаётся portfolio-only (DEC-082–084); commerce runtime не включать.
- Search восстанавливается Back/Forward по поздней revision DEC-096.
- Регистрация fullscreen и единый `User.slug` следуют поздним revisions DEC-105;
  одно explicit согласие и lazy legal read — DEC-124/125.
- DEC-109 сохраняет PostgreSQL abuse ledger, idempotency, mail truth и production
  gates. DEC-114–116: optional city, ID-каталоги/proposals и revision story limits;
  client cutover уже выполнен в проверенном срезе, старое B6 не текущее состояние.
- DEC-131/132 сохранены: normalized private SOURCE/Sharp, limits, retries и p1/p2
  compatibility. Миграции `20261022120000_normalized_media_source` и
  `20261022180000_legacy_image_upload_identity` обязательны до выпуска API.
- Действующий deploy contour — production-only (DEC-102), а не старый staging
  handoff. Условия запуска и actions принадлежат ops, не архивному checklist.

## История и обновление

Evidence остаётся на прежних путях `docs/audits/current/evidence/`; screenshots
и videos не удаляются. Для расследования читать нужный checkpoint в
[истории](../../archive/audits/12-PORTFOLIO-MVP-RELEASE-through-2026-10-07.md).

Обновлять gate/результат со ссылкой на точный SHA и owner evidence. Старые
checkpoints не дописывать в этот файл; подробный новый audit хранить отдельно.
План задач — [active backlog](../../product/16-PORTFOLIO-ACTIVE-BACKLOG.md).
