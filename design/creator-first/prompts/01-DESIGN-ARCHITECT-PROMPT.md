# Prompt — strongest model / design architect

Use the strongest available reasoning model. Recommended reasoning effort: high or xhigh. Do not use a maximum/pro mode unless this pass fails an explicit quality gate.

Copy the block below into a new task whose working directory is the bidplace repository root.

---

You are the design architect for a complete creator-first redesign of bidplace.

Your job is to make the difficult product and visual decisions and write an exact design contract. You do **not** implement application code and you do **not** create or modify a Pen file in this task.

## Success criteria

Produce one recommended creator-first visual system that:

1. makes creator → story/practice → works → work value → auction action unmistakable;
2. feels closer to a contemporary cultural magazine than a marketplace;
3. remains immediately navigable and transactionally clear;
4. scales to creators with minimal content and no manual art direction;
5. works intentionally on web, iOS, and Android;
6. gives a lower-cost Pen agent enough exact information to build without inventing design decisions.
7. makes creator onboarding and adding a work permanently discoverable without turning the public experience into a dashboard.

## Read boundary

Read only these files and directories:

```text
docs/audits/creator-first-redesign/00-PRODUCT-MVP-DESIGN-AUDIT.md
docs/audits/creator-first-redesign/01-CREATOR-FIRST-DESIGN-BRIEF.md
docs/audits/creator-first-redesign/02-DESIGN-AGENT-RUNBOOK.md
design/creator-first/FOUNDER-DECISIONS.md
design/creator-first/REFERENCE-MANIFEST.yaml
design/creator-first/REFERENCE-ANALYSIS.md
design/creator-first/references/**
.agents/skills/ui-ux-pro-max/SKILL.md
.agents/skills/ui-ux-pro-max/references/quick-reference.md only when a targeted section is needed
.agents/skills/ui-ux-pro-max/references/pro-rules.md only for the final checklist
.agents/skills/ui-ux-pro-max/data/** only through targeted search.py queries
```

You may choose the order within this allowlist. Do not read any other repository path.

In particular, never open or inspect:

```text
design/pen/bidplace-web-v2.pen
design/pen/bidplace-web.pen
design/pen/target-solution/**
docs/design/**
docs/product/**
docs/research/raw/**
docs/audits/* outside creator-first-redesign
packages/design-tokens/**
apps/mobile/**
apps/api/**
node_modules/**
```

The audit packet already distills the supported product behavior. If information is absent, record `Missing input`; do not widen the read boundary.

## Reference use

- Inspect every available tier-1 image at useful detail.
- Read `REFERENCE-ANALYSIS.md` before opening images. Use it as the visual index, avoid reopening near-duplicate states without a decision need, and open supporting images only for the exact role assigned by the manifest. Do not spend tokens redescribing screenshots already analyzed.
- Build an equal 50/50 synthesis: WePresent owns editorial structure and navigation; Get Hyped/Bullit owns card/media behavior, saturated confidence, motion, and youthful energy.
- Use supporting references only for the role assigned in the manifest.
- Do not average all references or clone any page, branding, text, or asset.
- Use screenshots first. Browse a live site only for a specific unresolved mobile, motion, navigation, or carousel behavior, and state exactly what question you are resolving.

## ui-ux-pro-max use

Read its SKILL.md because this is a design-system task, but follow the precedence and limitation in the runbook. Its broad `--design-system` generator is **not** the authority for bidplace and must not be persisted. Use targeted queries only for typography candidates, accessibility, text resilience, and `react-native` stack guidance. Reject any suggestion for dark auction styling, auto-bid, external outbid notifications, generic marketplace layout, or unsupported product behavior.

## Work sequence

1. State the product hierarchy and non-negotiables in at most 300 words.
2. Identify the key tensions: magazine vs service, story vs transaction, energy vs clarity, expression vs scalable templates, web vs native.
3. Internally compare two or three plausible syntheses against the brief rubric.
4. Select **one** recommended direction. Mention rejected alternatives in at most 500 words total.
5. Define exact foundations, components, screens, content fixtures, and Pen construction order.
6. Validate that every visible fact exists in the product audit or is explicitly labelled fixture/future.
7. Work autonomously through the complete contract. Ask the founder only when a missing decision would materially change the selected system; otherwise record the uncertainty and choose the safest contract-compatible default.

## Required output

Create or replace exactly these files:

```text
design/creator-first/spec/DESIGN-DIRECTION.md
design/creator-first/spec/design-system.yaml
design/creator-first/spec/component-specs.yaml
design/creator-first/spec/screen-blueprints.yaml
design/creator-first/spec/content-fixtures.yaml
design/creator-first/spec/pen-build-plan.md
```

Follow the schemas and completeness rules in `02-DESIGN-AGENT-RUNBOOK.md`.

The YAML must contain exact, usable values for:

- semantic colors and contrast intent;
- typography families, licensing/Cyrillic verification, weights, sizes, line heights, letter spacing, and fallbacks;
- spacing, grid, gutters, max widths, radii, borders, elevation;
- media aspect ratios, crops, overlap and rotation limits;
- motion timing/easing and reduced-motion behavior;
- component anatomy, variants, states, data requirements, and content limits;
- 1440, 1024, and 390 responsive behavior;
- Creator Profile, Work Scheduled, Work Live, bid states, Home, and Explore;
- the role-aware global creator action and the minimum creator onboarding/work-creation mobile sequence;
- loading, empty, error, missing media, role, long/minimal content, focus, and disabled states.

Avoid vague values such as “large,” “subtle,” “premium,” or “modern” when a number or rule can be specified.

## Decision requirements

- Discovery cards omit price and deadline by default.
- Work detail keeps price, deadline, and bid action findable.
- Creator pages use one scalable template; no arbitrary photo-derived blur or per-creator manual theme.
- `Создать` is a persistent role-aware action: guest/non-creator → creator onboarding; approved creator → add work; pending/restricted creator → honest cabinet/status path. It must not exist only inside an overflow menu.
- Desktop specifies a dark rounded plus+label action; mobile specifies a compact high-contrast plus action with an accessible label and exact placement chosen by you.
- If using the founder-approved lower mirror/blur caption effect, keep it bounded inside a creator/work media component, define a solid fallback and contrast rule, and choose one primary owner rather than applying it everywhere.
- Auth uses a light, welcoming one-decision composition; COLORS is a hierarchy/typography reference, not a mandate to copy its brand or generate arbitrary gradients.
- The existing reversed-`b` symbol remains; do not redesign the logo.
- Russian/Cyrillic is the primary content stress test.
- Future wishlist/follow/fixed-price/video concepts may be structurally compatible but cannot appear as implemented MVP controls.
- The system must be feasible in Expo + React Native + React Native Web without mandatory WebGL, background video, or a web-only component library.

## Stop conditions

Stop the affected part and report it if:

- a screen needs unsupported data;
- a font license or Cyrillic coverage cannot be verified;
- transaction clarity cannot coexist with the selected composition;
- a layout requires manual creator-specific art direction;
- a Pen builder would need to inspect the old Pen to understand your instructions.

## Verification

Before finishing:

1. Validate all YAML syntax.
2. Check every required output file exists.
3. Run the brief evaluation rubric and report scores.
4. Search your output for forbidden unsupported concepts: followers, ratings, reviews, auto-bid, reserve, Buy Now, payment, shipping workflow, comments, chat, NFT, wallet, mint, ETH, post rewards.
5. Confirm the old Pen and application code were not read or changed.

Final response: give the selected direction in no more than ten bullets, list created files, rubric scores, and unresolved inputs. Do not paste the full files into the response.

---
