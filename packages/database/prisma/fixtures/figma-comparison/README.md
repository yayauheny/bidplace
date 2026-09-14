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
may delete users. Use the targeted sync against an explicitly disposable
preview/test database only:

```text
NODE_ENV=test
APP_ENV=local
ALLOW_FIGMA_COMPARISON_FIXTURE=true
DATABASE_URL=<disposable preview/test URL>
pnpm db:sync-figma-comparison
```

The sync prints the target database **name** before writes and never prints
URL or password. The write function also checks `current_database()` and the
local/test env triplet, so importing it cannot skip the CLI guard. It upserts
only slug `vex` and the four public IDs. It does not call `deleteMany` and
does not run `pnpm db:seed`.

Forbidden targets before the first write include `bidplace`, `bidplace_e2e`,
`postgres`, `auction`, and other production-like names. Non-parity Anna
assets are not part of this fixture.
