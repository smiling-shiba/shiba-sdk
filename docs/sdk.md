# SDK guide

Status: Current for what is built. Design and format: [pack-format.md](pack-format.md). Published as `@smiling-shiba/sdk` (D-44); examples in this repo import from source directly, not the package.

## Writing a policy

```ts
import { definePolicy, fn, hook, kind, t } from 'shiba-sdk'

export default definePolicy({
  id: 'toy',

  kinds: {
    entity: kind({ name: t.string({ minLength: 1 }), tags: t.optional(t.array(t.string())) }),
    collection: kind({ entities: t.array(t.ref('entity')) }),
  },

  hooks: {
    created: hook({ title: 'Created' }),
  },

  functions: {
    set_value: fn({
      title: 'Set value',
      args: { key: t.string({ minLength: 1 }), value: t.integer({ minimum: 0 }) },
      run(ctx, { key, value }) {
        ctx.state[key] = value
      },
    }),
  },
})
```

- **`kind(fields)`** declares a type of template and the fields it accepts.
- **`hook({ title })`** declares a named moment that templates can attach steps to.
- **`fn({ title, args, run })`** declares a function templates can call. `run` gets typed arguments inferred from `args`; optional arguments are optional properties.
- **`definePolicy(...)`** checks the whole definition and throws one error listing every problem.

## Field helpers (`t`)

`t.string`, `t.integer`, `t.number`, `t.boolean`, `t.array(item)`, `t.optional(field)` and `t.ref(kind)`. Each produces a JSON Schema fragment and carries a TypeScript type. `t.ref('entity')` marks a string that must be the id of a template of that kind; `sht validate` checks it and the editor schemas offer the ids that exist.

## What `definePolicy` rejects

- An id that cannot be part of a file name.
- Kind, hook, function, field and argument names that are not `snake_case`.
- Kind fields named `kind`, `id`, `on` or `do`. Every template already has those.
- References (`t.ref`) to a kind the policy does not declare.
- A function without a `run` function.

## Generating the contract

Tooling normally does this for you: `sht build-policy` bundles the policy and calls `policy.contract({ version, sha256 })`, which every policy carries, so `sht` needs nothing else from the SDK. To do it by hand:

```ts
import { buildContract, contractToJson } from 'shiba-sdk'

const contract = buildContract(policy, { version: '2026.09.19.1' })
process.stdout.write(contractToJson(contract))
```

The version is a generated calver (`YYYY.MM.DD.N`); a malformed one is rejected. Kinds, hooks and functions are sorted by name, so the same policy always gives byte-identical output. Pass `sha256` once there is a built bundle to hash.

For the toy policy: `npm run toy:contract -- 2026.09.19.1`. The expected output is checked in at `tests/fixtures/toy-contract.json`; any change to it must be deliberate.

## Provisional and not built

- **`PolicyContext`** (`ctx`) is the smallest shape that lets functions be written and tested: a `state` record and `emit(event)`. What a function may read and change will be settled with the runner.
- **The runner** (code that plays a policy: applies commands deterministically, see [engine-api.md](engine-api.md)) is not built. It will live in `shiba-app` (D-42).
- **Bundling** a policy to one JS file is `sht build-policy` in `shiba-tools`. The package exposes its TypeScript source as its entry point for now, so bundlers build it into your policy.
- **No dependencies.** The SDK has no runtime dependencies on purpose: policy bundles run in several JavaScript environments, including an embedded engine on the official server.

## Checked against the tooling

The toy policy was checked end to end: built with `sht build-policy` in a scratch project that installs this package, then validated with `sht validate`, which passes. The generated contract also produces the same 13 diagnostics on the broken sample pack as the hand-written fixture contract in `shiba-tools`, and the same editor schemas. That cross-repo check is manual for now; making it an automated test depends on how `shiba-sdk` is distributed (`SH-0002`).
