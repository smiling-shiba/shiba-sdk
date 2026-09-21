import { describe, expect, expectTypeOf, it } from 'vitest'
import { buildContract } from '../src/contract.ts'
import { definePolicy, fn, hook, kind, PolicyDefinitionError } from '../src/policy.ts'
import { t } from '../src/schema.ts'

const noop = (): void => undefined

function problemsFor(build: () => unknown): readonly string[] {
  try {
    build()
  } catch (error) {
    if (error instanceof PolicyDefinitionError) return error.problems
    throw error
  }
  return []
}

describe('definePolicy', () => {
  it('accepts a well-formed policy and returns it frozen, with hooks and functions defaulted', () => {
    const policy = definePolicy({ id: 'demo', kinds: { entity: kind({ name: t.string() }) } })
    expect(policy.id).toBe('demo')
    expect(Object.keys(policy.kinds)).toEqual(['entity'])
    expect(policy.hooks).toEqual({})
    expect(policy.functions).toEqual({})
    expect(Object.isFrozen(policy)).toBe(true)
  })

  it('lets tooling build the contract from the policy alone', () => {
    const policy = definePolicy({ id: 'demo', kinds: { entity: kind({ name: t.string() }) } })
    expect(policy.contract({ version: '2026.09.19.1' })).toEqual(buildContract(policy, { version: '2026.09.19.1' }))
  })

  it('rejects an id that cannot be part of a file name', () => {
    expect(problemsFor(() => definePolicy({ id: 'has space', kinds: {} }))).toEqual([
      'id "has space" must be letters, digits, hyphens or underscores',
    ])
  })

  it('rejects names that are not snake_case, for kinds, hooks, functions and fields', () => {
    const problems = problemsFor(() => definePolicy({
      id: 'demo',
      kinds: { Entity: kind({ 'Bad Field': t.string() }) },
      hooks: { onCreated: hook() },
      functions: { 'do-it': fn({ args: { Key: t.string() }, run: noop }) },
    }))
    expect(problems).toEqual([
      'kind "Entity" must be lowercase letters, digits and underscores, starting with a letter',
      'kind Entity: "Bad Field" must be lowercase letters, digits and underscores, starting with a letter',
      'hook "onCreated" must be lowercase letters, digits and underscores, starting with a letter',
      'function "do-it" must be lowercase letters, digits and underscores, starting with a letter',
      'function do-it: "Key" must be lowercase letters, digits and underscores, starting with a letter',
    ])
  })

  it('refuses fields that every template already has', () => {
    const problems = problemsFor(() => definePolicy({ id: 'demo', kinds: { entity: kind({ id: t.string(), on: t.string() }) } }))
    expect(problems).toEqual([
      'kind entity: "id" is reserved for every template (kind, id, on, do)',
      'kind entity: "on" is reserved for every template (kind, id, on, do)',
    ])
  })

  it('refuses references to kinds that do not exist, in fields and in arguments', () => {
    const problems = problemsFor(() => definePolicy({
      id: 'demo',
      kinds: { collection: kind({ members: t.array(t.ref('entity')) }) },
      functions: { pick: fn({ args: { target: t.ref('thing') }, run: noop }) },
    }))
    expect(problems).toEqual([
      'kind collection.members: refers to unknown kind "entity"',
      'function pick.target: refers to unknown kind "thing"',
    ])
  })

  it('accepts a reference to a kind in the same policy', () => {
    expect(problemsFor(() => definePolicy({
      id: 'demo',
      kinds: { entity: kind({ name: t.string() }), collection: kind({ members: t.array(t.ref('entity')) }) },
    }))).toEqual([])
  })

  it('reports a function whose run is not a function (for plain JavaScript authors)', () => {
    const broken = fn({ args: {}, run: noop })
    const problems = problemsFor(() => definePolicy({ id: 'demo', kinds: {}, functions: { go: { ...broken, run: undefined as never } } }))
    expect(problems).toEqual(['function go: "run" must be a function'])
  })

  it('reports every problem at once, in a readable message', () => {
    try {
      definePolicy({ id: '!', kinds: { Bad: kind({}) } })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(PolicyDefinitionError)
      expect((error as Error).message).toBe(
        'Invalid policy definition:\n  - id "!" must be letters, digits, hyphens or underscores\n  - kind "Bad" must be lowercase letters, digits and underscores, starting with a letter',
      )
    }
  })
})

describe('fn', () => {
  it('gives run typed arguments (checked by the compiler) and keeps the definition as written', () => {
    const definition = fn({
      args: { key: t.string(), count: t.optional(t.integer()) },
      run(_ctx, args) {
        expectTypeOf(args.key).toEqualTypeOf<string>()
        expectTypeOf(args.count).toEqualTypeOf<number | undefined>()
      },
    })
    expect(Object.keys(definition.args)).toEqual(['key', 'count'])
  })
})
