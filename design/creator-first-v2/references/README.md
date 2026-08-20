# Creator-first reference assets

Reference binaries are local working material and are intentionally ignored by Git. The committed source of truth is `../REFERENCE-MANIFEST.yaml`.

## Add new screenshots

Use one folder per service and descriptive ordered names:

```text
references/
├── wepresent/
│   ├── 01-home-editorial-hero.png
│   └── 02-mobile-story-card.png
├── gethyped/
│   └── 01-bullit-media-stack.png
└── avant-arte/
    └── 01-work-process-mobile.png
```

After adding an asset, register it in `../REFERENCE-MANIFEST.yaml` with:

- source URL;
- platform/viewport;
- what bidplace should take;
- what it must not take;
- target screen/component;
- whether the note came from the founder or is an audit interpretation.

Prefer original-resolution screenshots. Avoid collages unless the relationship between views is itself the reference.
