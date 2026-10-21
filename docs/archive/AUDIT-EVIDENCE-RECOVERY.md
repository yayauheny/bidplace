# Audit screenshot evidence — recovery

PNG/JPEG acceptance screenshots were removed from the **active** tree in PR #53
to reduce clone size and agent noise. Text reports, JSON, and README files under
`docs/audits/**/evidence/` remain when they were kept in git.

## Verified snapshot (git)

| Ref | Commit | Contents |
| --- | --- | --- |
| Tag `archive/audit-evidence-pre-cleanup` | `3818f0f38a22f0a569e0931b29de53e98501e8c6` | Full `docs/audits/**/evidence/**` including all PNGs before cleanup |

Restore into a working directory (read-only export):

```bash
git fetch origin tag archive/audit-evidence-pre-cleanup
mkdir -p /tmp/bidplace-audit-evidence
git archive archive/audit-evidence-pre-cleanup docs/audits \
  | tar -x -C /tmp/bidplace-audit-evidence
```

Or single file:

```bash
mkdir -p /tmp/bidplace-audit-evidence/login-sheet
git show archive/audit-evidence-pre-cleanup:docs/audits/current/evidence/2026-10-16-login-sheet/chromium-login-sheet-390x874.png \
  > /tmp/bidplace-audit-evidence/login-sheet/chromium-login-sheet-390x874.png
```

## Future GitHub repository split

Before dropping history from a new repo, mirror this tag (or commit `3818f0f3`) to
object storage or a dedicated `bidplace-audit-evidence` archive repository.
Do not rely on markdown image links to PNG paths in the active tree — they
intentionally point here or to folder READMEs.

## Active tree

New captures belong in local paths ignored by `.gitignore` (`docs/audits/**/evidence/**/*.png`)
or in the external archive above; link from audit markdown to README + recovery ref,
not to committed binaries.
