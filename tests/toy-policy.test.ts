import { describe, expect, it } from 'vitest'
import toyPolicy from '../examples/toy-policy/src/index.ts'
import type { PolicyContext } from '../src/policy.ts'

function fakeContext(): { ctx: PolicyContext; events: string[] } {
  const events: string[] = []
  return { ctx: { state: {}, emit: (event) => events.push(event) }, events }
}

describe('the toy policy', () => {
  it('declares two kinds, two hooks and three functions', () => {
    expect(Object.keys(toyPolicy.kinds)).toEqual(['entity', 'collection'])
    expect(Object.keys(toyPolicy.hooks)).toEqual(['created', 'updated'])
    expect(Object.keys(toyPolicy.functions)).toEqual(['set_value', 'add_tag', 'emit'])
  })

  it('set_value stores a named number in the state', () => {
    const { ctx } = fakeContext()
    toyPolicy.functions.set_value?.run(ctx, { key: 'weight', value: 5 })
    expect(ctx.state).toEqual({ weight: 5 })
  })

  it('add_tag appends to the tags, starting from none', () => {
    const { ctx } = fakeContext()
    toyPolicy.functions.add_tag?.run(ctx, { tag: 'heavy' })
    toyPolicy.functions.add_tag?.run(ctx, { tag: 'fragile' })
    expect(ctx.state.tags).toEqual(['heavy', 'fragile'])
  })

  it('emit sends the event through the context', () => {
    const { ctx, events } = fakeContext()
    toyPolicy.functions.emit?.run(ctx, { event: 'lamp_changed' })
    expect(events).toEqual(['lamp_changed'])
  })
})
