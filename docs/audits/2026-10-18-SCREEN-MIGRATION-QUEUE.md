# Очередь экранной миграции на семантическую палитру

Дата: 18 октября 2026. Ветка `fix/draft-restore`. Продолжение F-03 плана
`docs/audits/2026-10-17-FRONTEND-CLOSURE-PLAN.md`: auth/legal/consent/story
toolbar и app-shell уже на `useAppTheme()` (коммит `bfaec4cb`, splash в
`_layout` — волна 2026-10-18). Этот документ — **точный список** оставшихся
theme-dependent static reads. По плану мигрируется вместе с каждым экраном,
глобальная замена не запускается. Утверждённая black-палитра и переключатель
темы — отдельный продуктовый этап.

Метод поиска: `grep -rn "designTokens.color" apps/mobile/src` без spec-файлов;
geometry (`designTokens.auth.*Size/Radius/Width/Height`, `space`, `radius`,
`size`, `typography`) в список не входит — она остаётся статической по
плану. `figma-text-field-style.ts` проверен: только геометрия.

## Очередь по экранам (порядок — по пользовательскому приоритету)

### 1. Профиль автора / кабинет (предлагаемый следующий экран)

| Файл | Строки | Что читает |
| --- | --- | --- |
| `src/features/sellers/seller-profile-steps.tsx` | 261, 271, 345, 380–381 | `iconColor={muted}`, `inkStrong` (шаги профиля) |
| `src/features/sellers/author-application-basics-step.tsx` | 89, 120, 157, 168 | `backgroundColor`, `color={inkStrong}`, `stroke={photoGuide}` |
| `src/features/sellers/author-application-step-shell.tsx` | 78 | `color={inkStrong}` |
| `src/features/sellers/author-achievement-rail.ts` | 14–17 | `markerFill`, `markerHoleFill`, `lineColor` (SVG-маркеры) |
| `src/features/sellers/CreatorWorkCard.tsx` | 23, 78–80 | `backgroundColor`, action-стили, `color={white}` для иконки delete |
| `src/features/sellers/AuthorAbout.tsx` | 136 | `backgroundColor` |
| `src/features/sellers/AuthorApplicationAchievements.tsx` | 390 | `iconColor={muted}` |
| `src/features/sellers/AuthorShare.tsx` | 75 | background у слота шаринга |
| `src/features/sellers/public-seller-screen.tsx` | 172 | `backgroundColor` |
| `src/features/sellers/author-cabinet-screen.tsx` | 187 | `borderColor` |
| `src/features/sellers/product-draft-images.tsx` | 42 | `backgroundColor` |
| `src/features/sellers/product-draft-screen-chrome.tsx` | 154–155 | `inkStrong` |

Gate на экран: mounted-проверка видимых цветов/SVG при тестовой смене
palette без remount (паттерн `theme.spec.ts`), light-скриншоты не меняются,
адресные owner specs зелёные.

### 2. Поиск (overlay и панели)

| Файл | Строки | Что читает |
| --- | --- | --- |
| `src/features/search/panes/WorksSearchPane.tsx` | 65 | `backgroundColor` |
| `src/features/search/panes/CategoriesSearchPane.tsx` | 92 | `backgroundColor` |
| `src/features/search/panes/AuthorsSearchPane.tsx` | 72 | `backgroundColor` |

### 3. Каталог / карточки работ

| Файл | Строки | Что читает |
| --- | --- | --- |
| `src/features/products/WorkIdentity.tsx` | 41 | `color={textSubdued}` |
| `src/features/products/CatalogCardSkeleton.tsx` | 14 | `backgroundColor` (skeleton-заливка) |

### 4. Admin (внутренний экран)

| Файл | Строки | Что читает |
| --- | --- | --- |
| `src/features/admin/admin-analytics-screen.tsx` | 56–57, 130, 138, 171 | `borderColor`, `backgroundColor` ×3, `borderBottomColor` |
| `src/features/admin/ModerationCard.tsx` | 27 | `borderBottomColor` |

## Правила миграции (из плана, без изменений)

- Единственный источник — `useAppTheme()` / SemanticColorMap; light-значения
  ролей не меняются (роль дублирует прежний hex).
- Не склеивать роли по равенству hex; нужной роли нет — добавить в
  `theme.ts` (light + provisional black, NEEDS-FIGMA).
- Чистым helper palette передаётся аргументом (паттерн
  `legal-document-content.tsx`); module-level color styles запрещены.
- Брендовые/монохромные глифы не инвертировать автоматически — только после
  решения дизайнера (прецедент: auth provider icons, Figma 521:10381).
- Не превращать уникальную геометрию в токены; централизуются повторяемые
  роли.

Проверено на `5fb3f1d9` (ветка `fix/draft-restore`): список выше — полный
по `designTokens.color` на момент составления; 23 файла-читателя, из них 12 —
пакет «профиль автора». Итоги хвостов плана (Select All/Delete, спека
media-lifecycle, search-overlay 18/18) — в `docs/product/11-PROJECT-STATUS.md`,
запись 2026-10-18.
