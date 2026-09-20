# Handlers, Manifest and Signing

Status: Proposal. Naming is open, see `shiba-shared/docs/GLOSSARY.md` (O-10).

## The model

1. Rules logic is written as **named handler functions** in TypeScript and bundled into one JS file.
2. **YAML** rulesets (cards, personas, creatures) reference handlers by name, plus arguments.
3. The build also emits a **manifest / API schema** describing every handler and hook it offers.
4. **Validation** checks the YAML against the manifest. It does not read or execute the bundle.
5. On publish, the ruleset is compiled to canonical JSON, hashed and (for official use) signed.

Nothing in a ruleset is code. Handlers are trusted code that ships with the engine.

## Build output

```text
dist/
  rules-profile.js     # the bundle (handlers)
  manifest.json        # engine version, handler/hook names, versions
  api-schema.json      # JSON Schema for each handler's arguments
```

Only explicitly registered functions appear in the manifest. An unregistered function does not exist as far as YAML is concerned.

## What validation checks

1. Every handler a ruleset references exists in the manifest.
2. The arguments match that handler's schema (types, required fields, "did you mean" suggestions for typos).
3. The ruleset's required engine version is compatible with the bundle's version.
4. Cross-references resolve (cards in decks, personas in seasons, and so on).

## Handler rules

- Pure: state in, state or events out. Inject RNG. No clock, network, filesystem or globals.
- Deterministic: same state, command and seed give the same result on every host.
- Versioned: renaming a handler or changing its arguments is a breaking change. Bump the version so the manifest check catches published rulesets that break.
- Weird one-off cards can be named handlers. Common behaviors are shared primitives (draw, discard, damage, claim_land, choose, inspect, move, cancel...).

## Signing (official ladder)

- Sign one statement covering both hashes: the canonical ruleset hash and the exact engine bundle hash it was validated against.
- The official server runs a match only if the signature verifies and the bundle hash is a trusted one.
- Suggested algorithm: ed25519. Keep the private key out of the dev repo (CI secret or a separate signing step).
- Local/custom mode may run unsigned rulesets and bundles. Label them unofficial.
- Signing gives provenance and integrity. It is not DRM.

## Mobile caveat

Store policies restrict downloading code that changes app behavior. Ruleset data that only references handlers already shipped in the app is fine. New handlers require an app update, or run server-side only with the phone showing results.

## Simulation

Testing rule behavior is done here, in headless tests (fixtures of state plus commands producing expected events and state). The tooling (`sht`) does not simulate.

## Open items

- Manifest schema format (TypeBox or Zod, emitted as JSON Schema).
- Whether one bundle serves client previews, local servers and official servers, or the client gets a reduced build.
- Where the signing step runs.
