# Creator-first Pen stage prompts

Mechanical prompts for `pen` CLI. Concatenate `00-header.txt` with one stage file. Do not invent copy; specs in `design/creator-first/spec/` are the only sources of truth.

## Command

Claude Pen agent is unauthenticated on the builder machine. Always use Codex:

```bash
pen --repo . \
  --agent codex \
  --model gpt-5.6-sol \
  --in design/pen/bidplace-creator-first-v1.pen \
  --out design/pen/bidplace-creator-first-v1.pen \
  --prompt "$(cat design/creator-first/pen-prompts/00-header.txt design/creator-first/pen-prompts/<stage>.txt)" \
  --max-failed-calls 40
```

Stage 1 (`01-s1-foundations.txt`) creates the file; omit `--in` on that first run if the output does not exist yet. Never pass `bidplace-web.pen` or `bidplace-web-v2.pen` as `--in` or `--out`.

## Files and frames

Union of frames in `01`–`12` is exactly F001–F118 (no gaps, no duplicates). `00-header.txt` is prepended to every stage. `13-s6-final-qa.txt` adds no frames.

| File | Stage | Frames |
|---|---|---|
| `00-header.txt` | global rules | — |
| `01-s1-foundations.txt` | S1 | F001–F002 |
| `02-s2a-primitives.txt` | S2A | F003–F007 |
| `03-s2b-editorial.txt` | S2B | F008–F013 |
| `04-s2c-interaction.txt` | S2C | F014–F018 |
| `05-s3a-creator-profile.txt` | S3A | F019–F029 |
| `06-s3b-work-detail.txt` | S3B | F030–F040 |
| `07-s3c-bid-states.txt` | S3C | F041–F059 |
| `08-s4a-home.txt` | S4A | F060–F065 |
| `09-s4b-explore.txt` | S4B | F066–F072 |
| `10-s4c-auth-onboarding.txt` | S4C | F073–F092, F103–F106 |
| `11-s4d-work-creation.txt` | S4D | F093–F102 |
| `12-s5-future-boards.txt` | S5 | F107–F118 |
| `13-s6-final-qa.txt` | S6 | QA only |

## Sources

- `design/creator-first/spec/pen-build-plan.md` — build order and frame names
- `design/creator-first/spec/design-system.yaml`
- `design/creator-first/spec/component-specs.yaml`
- `design/creator-first/spec/screen-blueprints.yaml`
- `design/creator-first/spec/content-fixtures.yaml`

Output: `design/pen/bidplace-creator-first-v1.pen` only.
