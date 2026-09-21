# BACKLOG.md (shiba-sdk)

Story prefix: `SK-`. Epic definitions live in the `shiba-shared` repo's `docs/BACKLOG.md`. Tag stories with `[SS-NN]`.

Convention: `shiba-shared/docs/engineering/backlog-and-ids.md`. Keep "Now" to 3 items or fewer.

`shiba-sdk` is the SDK for writing policies. It must not import React, Phaser, Tauri, Colyseus, a database or browser APIs.

## Now

## Next


## Later / Ideas

- [ ] `SK-0004` [SS-02] Define the command and event vocabulary (`DRAW_ARMY_CARD`, `DEPLOY_CREATURE`, `ATTACK_LAND`, `PLAY_SPELL`, `PASS`, `CONCEDE`).
- [ ] `SK-0005` [SS-02] Four lands per side and the chain-attack rule, with the control-history stack.
- [ ] `SK-0006` [SS-02] Battle state machine: two creature rules plus Spellbook hands.
- [ ] `SK-0008` State projection: what each client may see.

## Parked: waiting on O-14 (where the runner lives)

- [ ] `SK-0012` [SS-01] Runtime API skeleton: `createGame`, `applyCommand`, `getLegalActions`, `projectState`, `hashState`, first exercised with the toy policy. See `docs/engine-api.md`.
- [ ] `SK-0007` [SS-01] Deterministic RNG injection and replay tests (with `SK-0013`).
- [ ] `SK-0011` [SS-01] Constrain policy bundles to plain ES features with no Node or browser APIs, and lint for that.
- [ ] `SK-0009` Policy and SDK version compatibility check (a pack's `sdk.range` against the runtime).
- [ ] `SK-0010` [SS-03] Runtime-parity fixtures: the same state, commands and seed must give identical results in V8 and in the embedded JS runtime used by `shiba-mps`. Source maps are optional.
- [ ] `SK-0013` Canonical state hashing (RFC 8785 canonical JSON plus SHA-256) and a small in-house PRNG with published test vectors.

## Blocked

## Done (recent)

- [x] `SK-0001` Repo scaffold: TypeScript, Vitest, Oxlint, npm, Node 24, matching `shiba-tools`. No runtime dependencies.
- [x] `SK-0002` SDK: `definePolicy`, `kind`, `hook`, `fn` and the `t` field helpers, with typed function arguments and one-shot validation of the definition.
- [x] `SK-0003` `buildContract` and `contractToJson`: deterministic `contract.json` from a policy. Checked identical to the hand-written fixture in `shiba-tools`.
- [x] `SK-0014` `pack-format.md` reviewed and settled (decisions D-34 to D-36).
- [x] `SK-0015` Toy policy (`examples/toy-policy/`) as the SDK example and a permanent test fixture.
