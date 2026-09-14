# Figma comparison fixtures

Local/test-only inputs so runtime Creator/Home/Work cards can be compared
against Figma on the same photos and texts. This is **not** a visual-parity
claim.

Copied rasters keep the original handoff bytes and checksums. Handoff files
were not edited or re-saved. See `SOURCES.sha256` and `manifest.json`.

## Demo author

- slug/handle: `vex` / `@vex`
- public work IDs: `figVexWk001`–`figVexWk004`
- Home `curatorSelection` points at `figVexWk001`

Commerce leftovers from the old Figma variant (prices, timers, bids, sale
badges, `@pixelp` overlays) are not stored.

## Safe apply

Do **not** run `pnpm db:seed` for this fixture. The destructive demo seed
may delete users. Use the targeted sync against the allowlisted databases
only:

```text
NODE_ENV=test
APP_ENV=local
ALLOW_FIGMA_COMPARISON_FIXTURE=true
DATABASE_URL=postgresql://auction:auction@127.0.0.1:5432/bidplace_figma_comparison
pnpm db:sync-figma-comparison
```

Allowlisted targets:

- `bidplace_figma_comparison` with schema `public`
- `bidplace_integration` with an `itest_*` schema, only for API integration tests

The sync prints the target database **name** and **schema** before writes and
never prints URL or password. `syncFigmaComparisonFixture()` checks
`current_database()` and `current_schema()` before it reads PNG assets or
writes rows. When a URL is supplied, that URL must match the connected
session. Names such as `foo_test_prod`, `production_preview`,
`stage_integration`, `bidplace_e2e`, `bidplace`, and `postgres` are refused.

It upserts only slug `vex` and the four public IDs. It does not call
`deleteMany` and does not run `pnpm db:seed`. Non-parity Anna assets are not
part of this fixture.
