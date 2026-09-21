# shiba-sdk

The SDK for Smiling Shiba **policies** (a game's rules as code): helpers for writing a policy in a standard shape. It holds no game rules. You write a policy with this SDK (kinds, hooks and functions), and it generates the policy's **contract**, a JSON description that tooling such as `sht` (in `shiba-tools`) uses to check YAML templates against the policy without running it.

Today it can define a policy and generate its contract. It does not run policies; the runner lives in `shiba-app` (D-42).

Guide: [docs/sdk.md](docs/sdk.md). Format and design: [docs/pack-format.md](docs/pack-format.md).

## Setup

Use **Node.js 24** (npm comes with it). `.nvmrc` is provided for nvm and `mise.toml` for mise; neither version manager is required.

```sh
node --version # should print v24.x.x
npm ci
```

There are no runtime dependencies. Keep dependency changes in `package-lock.json`; new packages need approval (see `AGENTS.md`).

## Try it

```sh
npm run toy:contract -- 2026.09.19.1   # print the toy policy's contract as JSON
```

The toy policy (`examples/toy-policy/`) is a neutral example with no game content. It doubles as a permanent test fixture.

## Checks

```sh
npm test            # run tests once
npm run test:watch  # rerun tests while editing
npm run lint        # Oxlint
npm run typecheck   # TypeScript, no emit (also checks the type-inference tests)
```

There is no formatter configured. Match the existing style and run `git diff --check` for whitespace errors. All tests and lint must pass before committing.

## Layout

- `src/`: the SDK (`schema.ts` field helpers, `policy.ts` definitions and validation, `contract.ts` contract generation)
- `examples/toy-policy/`: the toy policy
- `scripts/`: small command-line helpers
- `tests/`: tests, plus `tests/fixtures/toy-contract.json`, the reviewed expected contract
- `docs/`: documentation and the backlog
- `AGENTS.md`: engineering rules for agents
