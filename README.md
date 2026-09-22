# shiba-sdk

The SDK for Smiling Shiba **policies** (a game's rules as code): helpers for writing a policy in a standard shape. It holds no game rules. You write a policy with this SDK (kinds, hooks and functions), and it generates the policy's **contract**, a JSON description that tooling such as `sht` (in `shiba-tools`) uses to check YAML templates against the policy without running it.

Today it can define a policy and generate its contract. It does not run policies; the runner lives in `shiba-app` (D-42).

Guide: [docs/sdk.md](docs/sdk.md). Format and design: [docs/pack-format.md](docs/pack-format.md).

## Install

```sh
npm install @smiling-shiba/sdk
```

```ts
import { definePolicy, fn, hook, kind, t } from '@smiling-shiba/sdk'
```

Published from this repo's `main` via `.github/workflows/publish.yml`, triggered by a GitHub Release. Ordinary semver (D-36); keep in step with `src/version.ts`.

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

## Build

```sh
npm run build   # sync-version, then tsc, then scripts/fix-dts-extensions.ts; writes dist/ (gitignored, published only)
```

`tsconfig.build.json` emits `dist/` for `main`/`types`/`exports`. `src/` imports use explicit `.ts` extensions (for Node's native TS support and for `sht build-policy`'s esbuild bundling); `tsc` rewrites those to `.js` in emitted JS but not in emitted `.d.ts`, so `fix-dts-extensions.ts` patches the declaration files afterward. `npm publish` runs this automatically (`prepublishOnly`).

## Releasing

`package.json`'s `version` is the source of truth. `src/version.ts` (`SDK_VERSION`, read at runtime for the contract) is generated from it — never edit it by hand.

Normal release, no tokens or 2FA involved:

```sh
npm version patch|minor|major   # bumps package.json, regenerates + stages src/version.ts, commits, tags
git push --follow-tags
```

Then create a GitHub Release from that tag. `.github/workflows/publish.yml` publishes via OIDC trusted publishing and refuses to run if the release tag and `package.json`'s version don't match.

Trusted publishing has to be configured once, on the package's **Settings** page at npmjs.com (already done for this package; only needed again if it's ever reset): add a GitHub Actions publisher for `smiling-shiba/shiba-sdk`, workflow filename `publish.yml`, no environment.

### If a manual publish is ever needed

Trusted publishing can only be configured on a package that already exists, so the very first publish of any new scope/package has to be done by hand once — this is how `0.1.0` got out. Some real gotchas hit doing that, worth knowing if it ever has to happen again:

- **A brand-new npm account can only set up WebAuthn 2FA** (Touch ID, a passkey, a security key), not an authenticator app — there's no TOTP code to pass via `npm publish --otp=`.
- **Plain `npm publish` from a WebAuthn-2FA account currently just 403s**, with no interactive prompt, rather than opening a browser challenge. This looks like a current gap in the npm CLI, not something wrong with the account.
- **The fix:** make a granular access token (npmjs.com → Access Tokens) with **"Read and write"** access (not the "stage only" variant — that one can never publish a brand-new package, by npm's own design) and **"Bypass two-factor authentication"** checked. Use it for exactly one publish:
  ```sh
  npm publish --//registry.npmjs.org/:_authToken=<token>
  ```
  Then revoke it immediately (`npm token revoke <id>`, or from the Access Tokens page) — it's not needed again once trusted publishing is set up.

## Layout

- `src/`: the SDK (`schema.ts` field helpers, `policy.ts` definitions and validation, `contract.ts` contract generation)
- `examples/toy-policy/`: the toy policy
- `scripts/`: small command-line helpers, plus `fix-dts-extensions.ts` (a build step, see below)
- `tests/`: tests, plus `tests/fixtures/toy-contract.json`, the reviewed expected contract
- `docs/`: documentation and the backlog
- `AGENTS.md`: engineering rules for agents
