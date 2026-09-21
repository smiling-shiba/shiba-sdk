// A neutral toy policy used to exercise the SDK and the tooling. It contains no game content.
import { definePolicy, fn, hook, kind, t } from '../../../src/index.ts'

export default definePolicy({
  id: 'toy',

  kinds: {
    entity: kind({
      name: t.string({ minLength: 1 }),
      tags: t.optional(t.array(t.string())),
    }),
    collection: kind({
      entities: t.array(t.ref('entity')),
    }),
  },

  hooks: {
    created: hook({ title: 'Created' }),
    updated: hook({ title: 'Updated' }),
  },

  functions: {
    set_value: fn({
      title: 'Set value',
      args: { key: t.string({ minLength: 1 }), value: t.integer({ minimum: 0 }) },
      run(ctx, { key, value }) {
        ctx.state[key] = value
      },
    }),

    add_tag: fn({
      title: 'Add tag',
      args: { tag: t.string({ minLength: 1 }) },
      run(ctx, { tag }) {
        const tags = Array.isArray(ctx.state.tags) ? ctx.state.tags : []
        ctx.state.tags = [...tags, tag]
      },
    }),

    emit: fn({
      title: 'Emit event',
      args: { event: t.string({ minLength: 1 }) },
      run(ctx, { event }) {
        ctx.emit(event)
      },
    }),
  },
})
