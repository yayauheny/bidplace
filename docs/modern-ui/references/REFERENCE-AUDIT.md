# Visual reference audit

Status: **reviewed 2026-07-27**

Method: each locally saved screenshot was checked against its dedicated README and the two supplied interpretation texts. The screenshot is the evidence. Measurements, font identification, and unseen interaction are marked as target decisions or hypotheses rather than observations.

## Overall result

The supplied prose and the screenshot analyses agree on the principal direction: restrained light surfaces, a large black primary action, sans/mono hierarchy, pills for genuine controls or compact facts, image-led editorial composition, little shadow, progressive disclosure, and rare orange emphasis.

No material visual contradiction was found. The audit corrected the authority of a few claims:

- MyPlastic’s exact font family, logo font, implementation, and precise token values are not observable from screenshots.
- The target font remains Inter + PT Mono and the target tokens remain those in [`../00-project-decisions.md`](../00-project-decisions.md).
- MyPlastic’s music, scanning, subscription, collection, and Discogs behaviours do not transfer to bidplace.
- Tracker’s yellow selection is a control pattern only; it does not add yellow to bidplace’s palette.

## Per-reference audit

| Source / screen | Exact image and analysis | Verified visible elements | bidplace take | Result |
| --- | --- | --- | --- | --- |
| MyPlastic — auth | [image](./design-photos/myplastic/auth-login/auth-login-mobile-reference-01.png) · [README](./design-photos/myplastic/auth-login/README.md) | light top-rounded sheet, handle, strong title, black/outlined large actions, mono CTA, low density | calm login/register with one primary action; no decorative hero image | matches |
| MyPlastic — settings | [image](./design-photos/myplastic/settings/myplastic-settings-mobile-reference-01.png) · [README](./design-photos/myplastic/settings/README.md) | grouped white rows, dividers, technical mono labels, blue/red semantic actions | grouped settings, separate destructive section, mono for utility labels | matches; colours are source-specific |
| MyPlastic — dashboard | [image](./design-photos/myplastic/dashboard/myplastic-dashboard-mobile-reference-01.png) · [README](./design-photos/myplastic/dashboard/README.md) | prominent greeting, gear, circular metric fields, black CTA, tab bar | optional real seller metrics; settings shortcut; no decorative dashboard | matches |
| MyPlastic — empty collection | [image](./design-photos/myplastic/collection/myplastic-collection-empty-mobile-reference-01.png) · [README](./design-photos/myplastic/collection/README.md) | text tabs, compact black CTA, close icon, central illustration, bottom nav | compact empty state and restrained close/navigation affordance | matches; do not copy music/Discogs content |
| MyPlastic — discovery filters | [image](./design-photos/myplastic/discovery/myplastic-discovery-filter-mobile-reference-01.png) · [README](./design-photos/myplastic/discovery/README.md) | joined switcher with black active segment, sliders icon/dot, editorial strip, sheet with checkmarks/counts | segmented mode, filter icon, mobile AppSheet with explicit cancel/save | matches |
| MyPlastic — catalog | [image](./design-photos/myplastic/catalog/myplastic-catalog-mobile-reference-01.png) · [README](./design-photos/myplastic/catalog/README.md) | image-first rails, partial next card, black heading/arrow, muted metadata, sparse orange `REISSUE` | discovery rails, title/arrow language, rare semantic orange, readable metadata | matches |
| MyPlastic — technical product detail | [image](./design-photos/myplastic/product-detail/myplastic-product-detail-mobile-reference-01.png) · [README](./design-photos/myplastic/product-detail/README.md) | play controls, black/white icon row, gray right-aligned times, related rail, bottom actions | technical date/timer/value hierarchy and related items; not music controls | matches |
| MyPlastic — **primary product page** | [notes image](./design-photos/myplastic/product-page/myplastic-product-page-notes-mobile-reference-01.png) · [story image](./design-photos/myplastic/product-page/myplastic-product-page-story-mobile-reference-02.png) · [README](./design-photos/myplastic/product-page/README.md) | object cover + offset disc/mark, strong title, gray author/arrow, outlined tags, black CTA, selected black tab | primary bidplace product-detail composition; tags are real factual anchors; story/provenance tabs after auction truth | matches; source disc is not a bidplace motif |
| MyPlastic — author | [image](./design-photos/myplastic/author/myplastic-author-profile-mobile-reference-01.png) · [README](./design-photos/myplastic/author/README.md) | large photo with partial next image, short bio, `14 releases →`, horizontal work rail, circular members | author/seller hero, `N works →`, related work rail, public collaborators only | matches |
| MyPlastic — search | [image](./design-photos/myplastic/search/myplastic-search-scan-mobile-reference-01.png) · [README](./design-photos/myplastic/search/README.md) | pale search field, mono placeholder, quiet `RECENT`, orange dot + `VIEW ALL`, circular items | quiet search and subtle text/arrow/dot hierarchy; scanner not implied | matches |
| MyPlastic — versions filter/add | [filter image](./design-photos/myplastic/versions/myplastic-versions-filter-mobile-reference-01.png) · [add image](./design-photos/myplastic/versions/myplastic-versions-add-mobile-reference-02.png) · [README](./design-photos/myplastic/versions/README.md) | sort arrow, black selected pills/counts, light inactive pills, wide black action, outlined plus/minus, thin list separators | shared sort/filter language; plus only reversible add; removal always explicit/confirmed | matches |
| Tracker — list | [image](./design-photos/tracker/tracker-list-mobile-reference-01.png) · [README](./design-photos/tracker/README.md) | separate filter icon, gray search placeholder, soft chips, yellow selected state/check, main dark timer + small gray qualifier | compact auction/activity list and technical deadline hierarchy | matches; yellow is rejected as global target accent |

## Decision record

The definitive operational system is [`../DESIGN.md`](../DESIGN.md). The catalog remains expandable: add a source folder, image, screen README, catalog row, and this audit row before treating a new reference as approved.
