# shiba-sdk Docs

Status: Draft.

`shiba-sdk` is the SDK for writing policies. It imports no React, Phaser, Tauri, Colyseus, database or browser APIs.

| Doc | Status |
|---|---|
| [BACKLOG.md](BACKLOG.md): work queue | Current |
| [sdk.md](sdk.md): writing a policy and generating its contract | Current |
| [pack-format.md](pack-format.md): policy, templates, assets; contract, validation, build and sign | Proposal |
| [engine-api.md](engine-api.md): the tiny deterministic engine boundary and release artifact | Proposal |

Cross-repo docs: `docs/INDEX.md` in the `shiba-shared` repo (start with its glossary and architecture overview).

## To write when the code exists

- Command model (`ATTACK_LAND`, `PLAY_SPELL`, `PASS`, ...) and event vocabulary.
- State projection (what each client may see).
- Determinism and RNG injection.
- Policy, pack and SDK versioning rules.
