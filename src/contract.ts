import type { Policy, Shape } from './policy.ts'
import type { JsonObject } from './schema.ts'
import { SDK_VERSION } from './version.ts'

/** What tooling reads to check templates against a policy, without running the policy. */
export interface Contract {
  policy: { id: string; version: string; sha256?: string }
  sdk: { version: string }
  kinds: Record<string, { schema: JsonObject }>
  hooks: Record<string, { title?: string }>
  functions: Record<string, { title?: string; args: JsonObject }>
}

export interface ContractOptions {
  /** Generated calver for this build of the policy: YYYY.MM.DD.N. */
  readonly version: string
  /** Hash of the built policy bundle, once there is one. */
  readonly sha256?: string
  /** Defaults to this SDK's version. */
  readonly sdkVersion?: string
}

const CALVER = /^\d{4}\.(0[1-9]|1[0-2])\.(0[1-9]|[12]\d|3[01])\.[1-9]\d*$/

function byName(a: readonly [string, unknown], b: readonly [string, unknown]): number {
  return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
}

/** JSON Schema for the object described by a shape. */
export function shapeToSchema(shape: Shape): JsonObject {
  const entries = Object.entries(shape)
  const required = entries.filter(([, described]) => !described.optional).map(([name]) => name)
  return {
    type: 'object',
    ...(required.length > 0 ? { required } : {}),
    properties: Object.fromEntries(entries.map(([name, described]) => [name, described.schema])),
  }
}

/** Builds the contract for a policy. Names are sorted, so the same policy always gives the same output. */
export function buildContract(policy: Policy, options: ContractOptions): Contract {
  if (!CALVER.test(options.version)) {
    throw new Error(`Policy version "${options.version}" must be a calver like 2026.09.19.1 (YYYY.MM.DD.N)`)
  }
  return {
    policy: { id: policy.id, version: options.version, ...(options.sha256 === undefined ? {} : { sha256: options.sha256 }) },
    sdk: { version: options.sdkVersion ?? SDK_VERSION },
    kinds: Object.fromEntries(Object.entries(policy.kinds).sort(byName).map(([name, definition]) => [name, { schema: shapeToSchema(definition.fields) }])),
    hooks: Object.fromEntries(Object.entries(policy.hooks).sort(byName).map(([name, definition]) => [name, definition.title === undefined ? {} : { title: definition.title }])),
    functions: Object.fromEntries(Object.entries(policy.functions).sort(byName).map(([name, definition]) => [
      name,
      { ...(definition.title === undefined ? {} : { title: definition.title }), args: shapeToSchema(definition.args) },
    ])),
  }
}

export function contractToJson(contract: Contract): string {
  return `${JSON.stringify(contract, null, 2)}\n`
}
