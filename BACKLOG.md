# BACKLOG.md (shiba-core)

Story prefix: `SC-`. Epic definitions live in the `shiba-shared` repo's `BACKLOG.md`. Tag stories with `[SS-NN]`.

Convention: `shiba-shared/docs/engineering/backlog-and-ids.md`. Keep "Now" to 3 items or fewer.

`shiba-core` is the headless rules engine. It must not import React, Phaser, Tauri, Colyseus, a database or browser APIs.

## Now

## Next

- [ ] `SC-0001` [SS-01] Scaffold the repo: TypeScript, Vitest, fast-check, Oxlint, npm, Node 24. Match `shiba-tools`' setup.
- [ ] `SC-0002` [SS-01] Handler registry: register named handlers with argument schemas.
- [ ] `SC-0003` [SS-01] Emit `manifest.json` and `api-schema.json` from the build. See `docs/handlers-and-manifest.md`.
- [ ] `SC-0004` [SS-02] Define the command and event vocabulary (`DRAW_ARMY_CARD`, `DEPLOY_CREATURE`, `ATTACK_LAND`, `PLAY_SPELL`, `PASS`, `CONCEDE`).

## Later / Ideas

- [ ] `SC-0005` [SS-02] Four lands per side and the chain-attack rule, with the control-history stack.
- [ ] `SC-0006` [SS-02] Battle state machine: two creature rules plus Spellbook hands.
- [ ] `SC-0007` Deterministic RNG injection and replay tests.
- [ ] `SC-0008` State projection: what each client may see.
- [ ] `SC-0009` Ruleset and engine version compatibility check.
- [ ] `SC-0010` [SS-03] Engine-parity fixtures: the same state, commands and seed must give identical results in V8 and in the embedded engine used by `shiba-mps`. Source maps are optional.
- [ ] `SC-0012` [SS-02] Engine API skeleton: `applyCommand`, `getLegalActions`, `projectState`, `hashState`, `createGame`. See `docs/engine-api.md`.
- [ ] `SC-0013` Canonical state hashing (RFC 8785 canonical JSON plus SHA-256) and a small in-house PRNG with published test vectors.
- [ ] `SC-0011` Constrain the bundle to plain ES features with no Node or browser APIs, and lint for that.

## Blocked

## Done (recent)
