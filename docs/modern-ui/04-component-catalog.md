# Component catalog

Status: final target public API. Values belong to [`00-project-decisions.md`](./00-project-decisions.md); this catalog records responsibility and boundaries rather than duplicating tokens.

| Component | Purpose | Source | Public props (target) | States / motion | Accessibility / platforms | Used on / do not use for |
| --- | --- | --- | --- | --- | --- | --- |
| AppText | Semantic text roles | bidplace wrapper | `role`, `children`, `numberOfLines` | default, disabled, error; none by default | Text semantics; web/native | All screens / raw font styles |
| AppIcon | One icon family | Lucide wrapper | `name`, `size`, `label`, `color` | default, disabled; press belongs to parent | Label required for icon-only action; web/native | All controls / direct Lucide imports |
| MotionPressable | Shared press behavior | RN Pressable + Reanimated | `preset`, handlers, `disabled`, `accessibilityLabel` | default, hover, pressed, focus-visible, disabled, reduced-motion | Keyboard and screen-reader press; web/native | Interactive controls / custom screen springs |
| PrimaryButton | Main action | Reusables/RN primitives adapted | `label`, `loading`, `disabled`, `icon`, `onPress` | pressed, focus, loading, disabled; primary-action | Button name, busy state, 44 px | Bid/submit/continue / secondary actions |
| SecondaryButton | Nonprimary action | Reusables adapted | Same semantic API | pressed, focus, disabled | Button semantics | Forms/settings / main CTA |
| IconButton | Compact labeled action | AppIcon + MotionPressable | `icon`, `label`, `onPress`, `selected` | hover, pressed, focus, disabled, selected, reduced-motion | Accessible label, 44 px | Back/menu/save/filter / unlabeled icon |
| BackButton | Return navigation | IconButton + ChevronLeft | `onPress`, `label` | pressed/focus | “Назад” name | Shell/detail/forms / ArrowLeft substitute |
| FilterChip | Deferred interactive filter | Reusables adapted | `label`, `selected`, `count`, `onPress` | selected, pressed, focus, disabled | Toggle semantics and count text | Future approved search/filter flow only / current final routes |
| MetadataChip | Short noninteractive metadata | AppText + border | `children`, `tone` | default, error/semantic if needed | Text, not a fake button | Cards/detail / interactive filter |
| SegmentedControl | Deferred 2–3 mode switch | RN Primitive ToggleGroup | `value`, `items`, `onChange` | selected, focus, disabled | Group/selected semantics | Future approved flow only / current final routes |
| ContentTabs | Progressive detail content | RN Primitive Tabs | `value`, `items`, `onChange` | selected, focus, disabled | Tablist/tab/panel, keyboard order | Detail / auction-critical data |
| AuctionCard | Image-first discovery | bidplace domain | `item`, `listing`, `onPress` | loading image, missing image, live/scheduled/ended, ending soon, hover, pressed, focus | Link label includes item context; web/native | Catalog / arbitrary dashboard cards |
| CompactAuctionRow | Dense auction/activity item | bidplace domain | `item`, `listing`, `status`, `onPress` | loading, ended, error, focus/pressed | Row label and status text | Activity/ending soon / visual grid card |
| AppSheet | Cross-platform overlay API | Gorhom via adapter on native; RN Primitives Dialog/Popover via adapter on web | `open`, `title`, `onClose`, `children`, actions | opening, open, closing, error, reduced-motion | Focus trap web, escape, drag handle label | Account/seller menu and mobile progressive disclosure / direct vendor import |
| AppDialog | Confirmation overlay | RN Primitives via adapter | `open`, `title`, `description`, actions | open, loading, error, focus | Dialog semantics and focus return | First bid, image delete, admin/order destructive action / alert as toast |
| SettingsGroup | Deferred grouped preferences | bidplace wrapper | `title`, `children`, `destructive` | default, disabled | Group heading | Future approved Settings flow only / generic surface wrapper |
| SettingsRow | Deferred preference/action row | bidplace wrapper | `icon`, `title`, `value`, `description`, `onPress` | hover, pressed, focus, disabled | Button/link semantics | Future approved Settings flow only / product metadata |
| AppImage | Safe media rendering | Expo Image adapter | `source`, `ratio`, `alt`, `placeholder`, `contentFit` | loading, loaded, error, missing, reduced-motion transition | Alt/role and stable geometry | All media / raw image setup |
| ImagePlaceholder | Geometry-preserving fallback | primitive | `ratio`, `label` | loading/error/empty | Label if meaningful | Cards/gallery / arbitrary empty art |
| BottomActionBar | Sticky mobile action | bidplace domain | `summary`, `action`, `disabled`, `loading` | loading, disabled, error, safe-area, reduced-motion | Action name and current state | Product detail/order; desktop uses contextual panel / duplicate full panel |
| MobileTabBar | Visual navigation adapter | Expo Router stable tabs | `items`, `active`, `onChange` | active, pressed, focus | Navigation labels, 44 px | Mobile shell / ad hoc route tabs |
| DesktopSidebar | Desktop navigation adapter | Expo Router | `items`, `active` | hover, active, focus | Landmark/nav semantics | Desktop shell / separate route tree |
| EmptyState | Actionable absence | bidplace wrapper | `title`, `description`, `action` | default, focus | Heading and action | Catalog, Activity and error recovery / decorative blank |

Every component must support the relevant default, hover, pressed, focus-visible, disabled, loading, selected, error, and reduced-motion state. Unsupported states must be explicitly documented rather than silently ignored.
