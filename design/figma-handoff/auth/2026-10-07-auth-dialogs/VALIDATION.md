# Import validation — 2026-10-07

This document records source-package integrity, not runtime UI verification.

The six original archives were inspected for manifest/root identity, source
hashes, layout, references, assets and mapped nodes. PNGs were visually reviewed.
The corresponding canonical parent nodes were found in three auth boards and
the author-abort package, including embedded nodes rather than separate packages.

Validation checks for this import:

- Passed: six packages, 81 original files byte-equal, 67 mapped visual roles,
  14 protected source files unchanged and 52 valid local/new-owner links.

- Every imported source file is byte-equal to its archive entry and matches its
  recorded SHA-256/size. No exporter JSON or PNG was reformatted.
- All root/surface/role IDs resolve in original `design/nodes.json`; extracted
  role styles/layout remain equal to the original node values.
- All supplied root viewports are `390×874`.
- Per-package provenance accounts for every archive entry, including deliberately
  omitted generated prompts and flattened whole-screen SVGs.
- Canonical `INDEX.md`, `catalog.json` and the four distinct parent `nodes.json`
  files, plus all eight existing field-package files, keep their previous hashes.
- Local bundle links and newly added source links in owner documentation resolve.
- `git diff --check` and the final staged path scope are checked before commit.

Remaining limitations are explicit in [STYLES.md](STYLES.md): export fidelity
warnings, Google asset, mixed text ranges, live Inspect disagreement, legal
link/acceptance mapping and absent exact recovery/desktop/interaction captures.
No product code, runtime token, stylesheet, test, migration, credential or
production resource changed. Product tests/builds and browser gates were not
rerun for a source/documentation-only import. No runtime parity is claimed.

Recheck copied payloads from each package directory with:

```sh
shasum -a 256 -c CHECKSUMS.sha256
```

The bundle `CHECKSUMS.sha256` covers local handoff artifacts and source files,
excluding that checksum file itself. Package checksums cover copied original
source entries; `PROVENANCE.json` explains why not every original manifest path
is materialized (prompts/whole-screen SVGs are intentionally omitted).
