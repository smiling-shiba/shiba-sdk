import { describe, expect, expectTypeOf, it } from 'vitest'
import { shapeToSchema } from '../src/contract.ts'
import type { Values } from '../src/policy.ts'
import { t } from '../src/schema.ts'

describe('t', () => {
  it('describes strings, numbers and booleans as JSON Schema', () => {
    expect(t.string({ minLength: 1, maxLength: 20, pattern: '^a' }).schema).toEqual({ type: 'string', minLength: 1, maxLength: 20, pattern: '^a' })
    expect(t.integer({ minimum: 0, maximum: 9 }).schema).toEqual({ type: 'integer', minimum: 0, maximum: 9 })
    expect(t.number().schema).toEqual({ type: 'number' })
    expect(t.boolean({ description: 'A flag' }).schema).toEqual({ type: 'boolean', description: 'A flag' })
  })

  it('leaves out options that were not given', () => {
    expect(t.string({ minLength: undefined }).schema).toEqual({ type: 'string' })
  })

  it('describes arrays by their item type', () => {
    expect(t.array(t.string(), { minItems: 1 }).schema).toEqual({ type: 'array', items: { type: 'string' }, minItems: 1 })
  })

  it('marks a reference to a kind of template', () => {
    expect(t.ref('entity').schema).toEqual({ type: 'string', 'x-shiba-ref': 'entity' })
  })

  it('marks fields optional without changing their schema', () => {
    const optional = t.optional(t.string())
    expect(optional.optional).toBe(true)
    expect(optional.schema).toEqual({ type: 'string' })
    expect(t.string().optional).toBe(false)
  })
})

describe('shapeToSchema', () => {
  it('lists required fields and keeps optional ones out of "required"', () => {
    expect(shapeToSchema({ name: t.string(), note: t.optional(t.string()) })).toEqual({
      type: 'object',
      required: ['name'],
      properties: { name: { type: 'string' }, note: { type: 'string' } },
    })
  })

  it('omits "required" when every field is optional, and handles an empty shape', () => {
    expect(shapeToSchema({ note: t.optional(t.string()) })).toEqual({ type: 'object', properties: { note: { type: 'string' } } })
    expect(shapeToSchema({})).toEqual({ type: 'object', properties: {} })
  })
})

describe('Values (type inference, checked by the compiler)', () => {
  it('turns a shape into the matching TypeScript type', () => {
    const shape = { key: t.string(), count: t.integer(), tags: t.array(t.string()), note: t.optional(t.string()) }
    type Inferred = Values<typeof shape>
    expectTypeOf<Inferred['key']>().toEqualTypeOf<string>()
    expectTypeOf<Inferred['count']>().toEqualTypeOf<number>()
    expectTypeOf<Inferred['tags']>().toEqualTypeOf<string[]>()
    expectTypeOf<Inferred['note']>().toEqualTypeOf<string | undefined>()
    // The optional field really is optional: an object without it is accepted.
    const withoutNote: Inferred = { key: 'a', count: 1, tags: [] }
    expect(withoutNote.key).toBe('a')
  })
})
