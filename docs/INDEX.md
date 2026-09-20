# shiba-core Docs

Status: Draft.

`shiba-core` is the headless rules engine. It imports no React, Phaser, Tauri, Colyseus, database or browser APIs.

| Doc | Status |
|---|---|
| [handlers-and-manifest.md](handlers-and-manifest.md): handlers, manifest, validation, signing | Proposal |
| [engine-api.md](engine-api.md): the tiny deterministic engine boundary and release artifact | Proposal |

Cross-repo docs: `/Users/kevin/repo/shiba-shared/docs/INDEX.md` (start with its glossary and architecture overview).

## To write when the code exists

- Command model (`ATTACK_LAND`, `PLAY_SPELL`, `PASS`, ...) and event vocabulary.
- State projection (what each client may see).
- Determinism and RNG injection.
- Ruleset and engine versioning rules.
