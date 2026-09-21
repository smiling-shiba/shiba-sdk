import { buildContract } from './contract.ts'
import type { Contract, ContractOptions } from './contract.ts'
import type { Field, JsonObject } from './schema.ts'

/**
 * Provisional. What a policy function may read and change will be settled when
 * the runtime is built; this is the smallest shape that lets functions be written and tested.
 */
export interface PolicyContext {
  readonly state: Record<string, unknown>
  emit(event: string): void
}

/** The named fields of a kind, or the named arguments of a function. */
export type Shape = Readonly<Record<string, Field<unknown, boolean>>>

/** The TypeScript type of the values described by a shape. Optional fields become optional properties. */
export type Values<S extends Shape> = {
  [K in keyof S as S[K] extends Field<unknown, true> ? never : K]: S[K] extends Field<infer T, boolean> ? T : never
} & {
  [K in keyof S as S[K] extends Field<unknown, true> ? K : never]?: S[K] extends Field<infer T, boolean> ? T : never
}

export interface KindDefinition<S extends Shape = Shape> {
  readonly fields: S
}

export interface HookDefinition {
  readonly title?: string
}

export interface FunctionDefinition<S extends Shape = Shape> {
  readonly title?: string
  readonly args: S
  run(ctx: PolicyContext, args: Values<S>): void
}

/** A kind of template, with the fields it accepts. */
export function kind<S extends Shape>(fields: S): KindDefinition<S> {
  return { fields }
}

/** A named moment that templates can attach steps to. */
export function hook(options: HookDefinition = {}): HookDefinition {
  return { ...options }
}

/** A function that templates can call by name. `run` receives typed arguments. */
export function fn<S extends Shape>(definition: FunctionDefinition<S>): FunctionDefinition<S> {
  return definition
}

export interface PolicyDefinition {
  readonly id: string
  readonly kinds: Readonly<Record<string, KindDefinition>>
  readonly hooks?: Readonly<Record<string, HookDefinition>>
  readonly functions?: Readonly<Record<string, FunctionDefinition>>
}

export interface Policy {
  readonly id: string
  readonly kinds: Readonly<Record<string, KindDefinition>>
  readonly hooks: Readonly<Record<string, HookDefinition>>
  readonly functions: Readonly<Record<string, FunctionDefinition>>
  /**
   * Builds this policy's contract. Tooling calls this on a built bundle, so it
   * needs no other access to the SDK.
   */
  contract(options: ContractOptions): Contract
}

export class PolicyDefinitionError extends Error {
  readonly problems: readonly string[]

  constructor(problems: readonly string[]) {
    super(`Invalid policy definition:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`)
    this.name = 'PolicyDefinitionError'
    this.problems = problems
  }
}

const POLICY_ID = /^[a-z0-9][a-z0-9_-]*$/i
const NAME = /^[a-z][a-z0-9_]*$/
/** Fields every template already has; a kind may not redefine them. */
const RESERVED_FIELDS = ['kind', 'id', 'on', 'do']

function referencedKinds(schema: unknown, found: string[] = []): string[] {
  if (Array.isArray(schema)) {
    for (const item of schema) referencedKinds(item, found)
  } else if (typeof schema === 'object' && schema !== null) {
    for (const [key, value] of Object.entries(schema)) {
      if (key === 'x-shiba-ref' && typeof value === 'string') found.push(value)
      else referencedKinds(value, found)
    }
  }
  return found
}

function checkShape(shape: Shape, where: string, kindNames: readonly string[], reserved: readonly string[], problems: string[]): void {
  for (const [name, described] of Object.entries(shape)) {
    if (!NAME.test(name)) problems.push(`${where}: "${name}" must be lowercase letters, digits and underscores, starting with a letter`)
    if (reserved.includes(name)) problems.push(`${where}: "${name}" is reserved for every template (${RESERVED_FIELDS.join(', ')})`)
    for (const target of referencedKinds(described.schema)) {
      if (!kindNames.includes(target)) problems.push(`${where}.${name}: refers to unknown kind "${target}"`)
    }
  }
}

/**
 * Checks a policy definition and returns it in normalized form. Throws a
 * PolicyDefinitionError listing every problem, not just the first.
 */
export function definePolicy(definition: PolicyDefinition): Policy {
  const problems: string[] = []
  const kinds = definition.kinds
  const hooks = definition.hooks ?? {}
  const functions = definition.functions ?? {}
  const kindNames = Object.keys(kinds)

  if (!POLICY_ID.test(definition.id)) problems.push(`id "${definition.id}" must be letters, digits, hyphens or underscores`)
  for (const [name, definitionOfKind] of Object.entries(kinds)) {
    if (!NAME.test(name)) problems.push(`kind "${name}" must be lowercase letters, digits and underscores, starting with a letter`)
    checkShape(definitionOfKind.fields, `kind ${name}`, kindNames, RESERVED_FIELDS, problems)
  }
  for (const name of Object.keys(hooks)) {
    if (!NAME.test(name)) problems.push(`hook "${name}" must be lowercase letters, digits and underscores, starting with a letter`)
  }
  for (const [name, definitionOfFunction] of Object.entries(functions)) {
    if (!NAME.test(name)) problems.push(`function "${name}" must be lowercase letters, digits and underscores, starting with a letter`)
    if (typeof definitionOfFunction.run !== 'function') problems.push(`function ${name}: "run" must be a function`)
    checkShape(definitionOfFunction.args, `function ${name}`, kindNames, [], problems)
  }

  if (problems.length > 0) throw new PolicyDefinitionError(problems)
  const policy: Policy = {
    id: definition.id,
    kinds,
    hooks,
    functions,
    contract: (options) => buildContract(policy, options),
  }
  return Object.freeze(policy)
}

export type { JsonObject }
