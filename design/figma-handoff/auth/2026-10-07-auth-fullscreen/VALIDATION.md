# Import validation

Validated 4 captures, 60 copied original
files (28947509 bytes) and 285 mapped auth-subtree nodes.

- Original manifest, node JSON, PNGs, fidelity and locator payloads are byte-identical.
- Every original manifest size/hash matches each copied payload.
- Every map ID resolves to its original node; extracted layout/style/text are unchanged.
- Target viewport/root/surface identities are checked for all four captures.
- Zip paths and duplicates were checked before writing. No exporter code was executed.
- Generated prompt and whole-screen flattened SVG are intentionally omitted, each
  accounted for by hash/size/reason in provenance, matching the earlier import format.
- Package source checksums and bundle checksums verify stored artifacts.

This is source integrity, not UI parity or implementation verification. No runtime
code, tests, styles, protected sources, backend, secrets or production resources
are changed by this import. Product/browser tests are unnecessary for this import.
Full-screen adoption and product changes remain pending founder discussion.
