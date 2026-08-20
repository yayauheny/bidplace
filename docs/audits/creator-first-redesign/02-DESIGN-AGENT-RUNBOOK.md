# bidplace — creator-first design agent runbook

Date: 2026-08-13
Status: operational handoff
Goal: spend expensive-model reasoning on product and visual decisions, then delegate mechanical Pen construction to a lower-cost model.

## 1. Operating principle

The design architect must not discover the project by crawling the repository. This packet is the complete working context. If a required fact is missing, return it as `Missing input`; do not widen scope or infer a backend feature.

The workflow has three agent roles:

1. **Design architect — strongest available reasoning model.** Chooses the system, resolves reference tension, and writes exact structured specifications.
2. **Pen builder — efficient implementation model.** Performs no independent art direction; builds the specified frames in a new Pen file.
3. **Visual QA — strongest model in a fresh, narrow context.** Compares exported frames with the approved contract and returns exact deltas.

## 2. Stage and approval gates

```text
Audit packet + references
→ Gate A: founder accepts inputs
→ Design architect produces one recommended direction + exact contract
→ Gate B: founder accepts direction
→ Pen builder creates vertical slice
→ Gate C: founder receives exports
→ Visual QA produces deltas
→ Pen builder corrects
→ Gate D: founder accepts vertical slice
→ Remaining MVP screens
→ Gate E: implementation authorization
```

No agent crosses a gate without explicit founder approval.

## 3. Context policy

### Design architect allowlist

The architect may read only:

```text
docs/audits/creator-first-redesign/00-PRODUCT-MVP-DESIGN-AUDIT.md
docs/audits/creator-first-redesign/01-CREATOR-FIRST-DESIGN-BRIEF.md
docs/audits/creator-first-redesign/02-DESIGN-AGENT-RUNBOOK.md
design/creator-first/FOUNDER-DECISIONS.md
design/creator-first/REFERENCE-MANIFEST.yaml
design/creator-first/REFERENCE-ANALYSIS.md
design/creator-first/references/**
.agents/skills/ui-ux-pro-max/SKILL.md
.agents/skills/ui-ux-pro-max/references/quick-reference.md   # only targeted sections
.agents/skills/ui-ux-pro-max/references/pro-rules.md         # pre-delivery phase
.agents/skills/ui-ux-pro-max/data/**                         # only via targeted search.py queries
```

Within this allowlist the model may choose its reading order. It must not read the repository to “double-check” this packet.

### Explicit denylist for visual synthesis

```text
design/pen/bidplace-web-v2.pen
design/pen/bidplace-web.pen
design/pen/target-solution/**
docs/design/01-DESIGN-FOUNDATION.md
docs/design/03-DESIGN-SYSTEM.md
docs/design/06-ASSET-INVENTORY.md
docs/design/07-PEN-V2-UI-AUDIT-AND-IMPLEMENTATION-PLAN.md
docs/design/08-IMPLEMENTATION-LOG.md
docs/product/02-PRODUCT-EVOLUTION.md
docs/research/raw/**
docs/audits/* outside creator-first-redesign
packages/design-tokens/**
apps/mobile/src/components/ui/**
apps/mobile/src/components/layout/**
apps/mobile/src/features/**
node_modules/**
dist/**
coverage/**
```

Reason: these paths contain the rejected visual direction, implementation history, or high-volume context already distilled into the packet.

### Live browsing

Use local screenshots first. Browse a live reference only when mobile behavior, motion, carousel semantics, or navigation cannot be inferred from a screenshot. Open no more than three relevant pages per unresolved question and record what was learned. Do not restart market research.

## 4. ui-ux-pro-max policy

Installed project-local source:

```text
origin: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
commit: a38d04c3d5c298c851dbe5e6ee1965ee3de42cb5
path: .agents/skills/ui-ux-pro-max
```

The skill is advisory. It must never override:

```text
backend/MVP contracts
→ founder decisions
→ curated reference roles
→ creator-first brief
→ skill recommendations
```

### Important verified limitation

A broad query for `creator cultural editorial auction storytelling` classified bidplace as a generic `Auction Platform` and recommended dark OLED styling, urgency green, auto-bid, and outbid notifications. These conflict with the brief and runtime contract. Therefore:

- do not use the skill's broad `--design-system` result as the visual source of truth;
- do not persist its generated Master design system;
- do not accept product-type constraints that are absent from the audit;
- use targeted domains for typography candidates, accessibility, interaction, text layout, and React Native guidance;
- always pass `--stack react-native` for implementation-specific queries;
- use `react` or `html-tailwind` guidance only when explicitly evaluating the React Native Web surface, never as a native default.

Useful bounded queries:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py \
  "editorial display cyrillic human" --domain typography

python3 .agents/skills/ui-ux-pro-max/scripts/search.py \
  "focus not obscured sticky action" --domain ux

python3 .agents/skills/ui-ux-pro-max/scripts/search.py \
  "image list responsive safe area" --stack react-native

python3 .agents/skills/ui-ux-pro-max/scripts/search.py \
  "orphan heading line balance" --domain ux
```

Queries must contain no private project data. If a result is off-topic, retry once narrowly; otherwise label it unusable.

## 5. Expensive-model task

The architect should internally compare two or three plausible syntheses, but return one recommended direction. Do not spend the output budget on three full design systems.

### Required reasoning sequence

1. Restate product hierarchy and critical non-negotiables in no more than 300 words.
2. Identify the central tensions: magazine versus service, story versus transaction, expression versus scalability, desktop versus mobile.
3. Evaluate plausible solutions against the rubric.
4. Select one direction and explain rejected alternatives briefly.
5. Produce exact, machine-readable design contracts.
6. List unknowns separately; never hide them inside invented UI.

### Required output directory

```text
design/creator-first/spec/
├── DESIGN-DIRECTION.md
├── design-system.yaml
├── component-specs.yaml
├── screen-blueprints.yaml
├── content-fixtures.yaml
└── pen-build-plan.md
```

The output is not complete if it contains only prose or mood adjectives.

## 6. Output contracts

### `DESIGN-DIRECTION.md`

Must contain:

- one-sentence concept;
- product hierarchy;
- reference synthesis with `take / transform / reject`;
- selected visual territory and why it wins;
- typography and color rationale;
- page rhythm and media behavior;
- mobile transformation principle;
- marketplace/social/luxury drift checks;
- explicit unknowns and founder decisions still required.

### `design-system.yaml`

Must contain exact values, not “large,” “subtle,” or “modern”:

```yaml
meta:
  version: 1
  platforms: [web, ios, android]
color:
  semantic_role:
    value: "#000000"
    foreground: "#FFFFFF"
    usage: "..."
    forbidden_usage: "..."
typography:
  role:
    family: "..."
    fallback: ["..."]
    weights: [400, 600]
    desktop: {size: 64, line_height: 68, letter_spacing: -1.2}
    mobile: {size: 40, line_height: 42, letter_spacing: -0.6}
spacing: {}
shape: {}
border: {}
elevation: {}
layout:
  desktop_1440: {}
  tablet_1024: {}
  mobile_390: {}
motion: {}
accessibility: {}
```

Every color pair needs contrast intent. Every font needs Cyrillic and licensing verification or an explicit `needs_verification` flag.

### `component-specs.yaml`

Each component must define:

```yaml
- id: creator_scene
  purpose: "..."
  anatomy: []
  required_data: []
  optional_data: []
  variants: []
  states: []
  measurements:
    desktop: {}
    tablet: {}
    mobile: {}
  interactions: []
  accessibility: []
  content_limits: {}
  do_not_invent: []
```

Minimum components: global navigation, role-aware creator action, search entry, creator scene/card, work scene/card, media stack/gallery, story chapter, creator links, auction action, bid entry/confirmation, status, bid-history row, facts group, creator step shell, media input/preview, form field, inline async validation, review/submit action, loading/error/missing-media primitives.

### `screen-blueprints.yaml`

Every initial frame must define:

- viewport and safe-area assumptions;
- exact grid/gutters/max width;
- ordered sections;
- component IDs;
- data dependencies;
- dimensions/aspect ratios/overlap bounds;
- typography roles;
- scrolling and sticky ownership;
- interaction transitions;
- responsive transformation;
- all required states;
- annotations for the Pen builder;
- acceptance checks.

The initial blueprint set must include both:

1. the public creator/work vertical slice at 1440 and 390;
2. creator activation states plus a minimum 390 px sequence for `создать кабинет` and `добавить работу`, using only fields and permissions present in the audit.

Do not use absolute coordinates as the only layout description. Pair measurements with responsive constraints.

### `content-fixtures.yaml`

Provide realistic Russian content for short/long/minimal scenarios. Label all invented fixture facts. Include media intent and aspect ratio without generating fake provenance, bids, or awards.

### `pen-build-plan.md`

Provide a deterministic sequence:

1. Create token/style board.
2. Create shared component masters.
3. Create desktop and mobile vertical-slice frames.
4. Create state boards.
5. Derive tablet.
6. Run consistency/accessibility checklist.
7. Export named PNG evidence.

Include exact frame names and which component master each instance must use.

## 7. Pen builder contract

The builder must:

- use the repository `pen` skill;
- create a new versioned file such as `design/pen/bidplace-creator-first-v1.pen`;
- never open, edit, resave, rename, or delete `design/pen/bidplace-web-v2.pen`;
- read only the approved spec, references, and Pen build prompt;
- build shared masters before route frames;
- avoid improvising unsupported data or controls;
- mark spec ambiguities instead of resolving them visually;
- export the required 1440/390 frames and state boards for QA.

## 8. Visual QA contract

The QA model receives only:

- approved audit/brief;
- exact spec files;
- reference manifest and relevant screenshots;
- exported Pen screenshots.

It does not receive the repository or editable Pen file. For each issue it returns:

```yaml
- severity: blocker | major | minor
  screen: "..."
  region: "..."
  contract: "file + key"
  observed: "..."
  expected: "..."
  exact_change: "..."
  rationale: "..."
```

QA priorities:

1. Product/contract violation.
2. Creator/work hierarchy.
3. Navigation and transaction clarity.
4. Mobile reading flow.
5. Typography, spacing, color, and media composition.
6. Accessibility and reduced motion.

## 9. Stop conditions

Stop and report instead of guessing when:

- a required field is not present in the product audit;
- a screenshot contradicts a confirmed contract;
- a font's Cyrillic or license status is unknown;
- price/deadline cannot remain findable in a live auction composition;
- the layout requires manual creator-specific art direction;
- mobile needs a different unsupported interaction;
- a future feature is needed to make a current screen coherent;
- a Pen builder would need to inspect the old Pen to proceed.

## 10. Token-efficiency rules

- Do not repeat the research report; use the manifest matrix.
- Do not narrate file reading.
- Do not output multiple complete directions.
- Keep rejected alternatives under 500 words total.
- Use YAML for repeated measurements and state mappings.
- Refer to IDs instead of repeating component descriptions.
- Browse only unresolved interactions.
- Return changed files plus a short decision summary, not a second copy of their contents.

The expensive model is used for the initial contract and one fresh visual QA pass. Pen construction, file formatting, and corrections are delegated to a lower-cost model.
