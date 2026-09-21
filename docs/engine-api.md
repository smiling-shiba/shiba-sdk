# Runtime API and Release Artifact

Status: Proposal. Captures ideas on sharing one rules bundle between the app and an Elixir server. Not yet reviewed line by line, and the API names are illustrative.

Terminology: the runtime (`shiba-core`) loads a **policy**. The shipped unit is a **pack**; see `pack-format.md` for its layout, contract and signing.

## Shape

The runtime is a deterministic reducer with a tiny public surface, so the same bundle runs in the app (V8) and in `shiba-mps` (QuickBEAM):

```text
STATE + COMMAND + RNG STATE -> RUNTIME -> NEW STATE + EVENTS
```

Candidate functions:

```ts
validateContent(content)
createGame(definition, seed)
applyCommand(state, command, { rng })   // returns { state, events }
getLegalActions(state, playerId)
projectState(state, viewerId)           // only what that viewer may know
hashState(state)
```

Keep data crossing the boundary plain (JSON-shaped). Avoid exposing many objects or functions across the runtime line.

## Determinism rules

- No `Date.now()`, `Math.random()`, `fetch`, `localStorage`, `setTimeout` or filesystem in policy or runtime code.
- RNG is injected: `rng.nextInt(n)`, `rng.shuffle(list)`, `rng.choose(options)`, with explicit, serializable state.
- Consider a small in-house PRNG with published test vectors, so a dependency upgrade can never silently change shuffle results.
- Same initial state, seed and command sequence must give the same match everywhere. This enables replays, reconnects, bug reports ("send me the replay") and engine-parity tests.

## State hashing

Hash state after each turn using canonical JSON (RFC 8785) plus SHA-256. If two hosts disagree on a hash, the state diverged. Useful in parity tests between V8 and QuickJS.

## Authority and hidden information

- The authoritative host sees full state. Clients get `projectState(state, viewer)`.
- Clients may run the same rules for previews, animation and legal-move highlighting. They never decide outcomes.

## Rule conditions

If rules need expressions (`when: target.health < target.maxHealth / 2`), parse them into an AST and evaluate only permitted operations. Never `eval`. Candidates named in the discussion: `jsep` (small expression parser), Chevrotain (if a fuller DSL is ever wanted), JsonLogic. Each is a new package and needs approval. Do not adopt a generic rules engine as the game engine; card resolution (triggers, replacement effects, targeting) is not a facts-and-conditions problem.

Immer was suggested for state updates. Evaluate carefully: the core should stay boring and dependency-light because it runs in several runtimes.

## Release artifact

The shipped unit is a **pack** (policy bundle, templates, assets); see `pack-format.md`.

- The policy ships as **plain minified JS**, not QuickJS bytecode (bytecode is tied to an exact QuickJS ABI) and not "obfuscated" (obfuscation is not security).
- Source maps are optional at runtime. Keep them server-side for stack traces; do not ship them publicly. Dev builds may include them.
- A match records and pins the runtime version and the pack version.

## Authoring

Authors may write TypeScript or JavaScript in any layout. `sht build-policy` produces one JS bundle plus a generated `contract.json`, and validates registrations and forbidden imports. Node 24 can run erasable-syntax `.ts` directly, but it does not type-check, so the shipped artifact is JS.

## Open

- Final function names and signatures.
- Whether expression parsing is needed for v1.
- Runtime-parity test harness (`SC-0010`).
