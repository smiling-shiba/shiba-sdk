// A neutral toy policy that behaves more like a real game than the tiny one:
// a bundle with thousands of records, and a world of many objects that rounds of
// rules keep changing. Used to measure speed and memory in shiba-mps. No game content.
import { definePolicy, fn, kind, t } from '../../../src/index.ts'
import { rows } from './data.ts'
import type { Row } from './data.ts'

interface Item extends Row {
  score: number
  wins: number
}

interface World {
  round: number
  items: Item[]
  history: { round: number; best: string; total: number }[]
}

function makeRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let x = Math.imul(a ^ (a >>> 15), 1 | a)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

/** A chain of small rules, each depending on the item's tags. */
const rules: ((item: Item, random: () => number) => number)[] = [
  (item) => (item.tags.includes('heavy') ? item.a * 2 : item.a),
  (item) => (item.tags.includes('light') ? item.b * 3 : item.b),
  (item) => (item.tags.includes('fragile') ? -item.c : item.c),
  (item) => (item.tags.includes('sturdy') ? item.d + 20 : item.d),
  (item, random) => (item.tags.includes('bright') ? Math.floor(random() * item.e) : item.e),
  (item) => (item.tags.length > 2 ? item.f + 15 : item.f),
  (item) => item.wins * 5,
]

function playRound(world: World, seed: number): void {
  const random = makeRandom(seed + world.round)
  for (const item of world.items) {
    let score = 0
    for (const rule of rules) score += rule(item, random)
    item.score = score
  }
  const ranked = [...world.items].sort((x, y) => y.score - x.score || (x.id < y.id ? -1 : 1))
  const cut = Math.max(1, Math.floor(ranked.length / 10))
  for (const [index, item] of ranked.entries()) {
    if (index < cut) item.wins += 1
    else item.a = Math.max(0, item.a - 1)
  }
  const perTag = new Map<string, number>()
  for (const item of world.items) for (const tag of item.tags) perTag.set(tag, (perTag.get(tag) ?? 0) + item.score)
  world.round += 1
  world.history.push({ round: world.round, best: (ranked[0] as Item).id, total: [...perTag.values()].reduce((s, v) => s + v, 0) })
  if (world.history.length > 20) world.history.shift()
}

export default definePolicy({
  id: 'stress',

  kinds: {
    entity: kind({ name: t.string({ minLength: 1 }) }),
  },

  functions: {
    // Builds a world of `count` items from the bundled records.
    setup: fn({
      title: 'Set up a world',
      args: { count: t.integer({ minimum: 1 }) },
      run(ctx, { count }) {
        ctx.state.world = {
          round: 0,
          items: Array.from({ length: count }, (_, i) => ({ ...(rows[i % rows.length] as Row), id: `w${i}`, score: 0, wins: 0 })),
          history: [],
        } satisfies World
      },
    }),

    // Plays `rounds` rounds over the whole world.
    play: fn({
      title: 'Play rounds',
      args: { seed: t.integer({ minimum: 0 }), rounds: t.integer({ minimum: 1 }) },
      run(ctx, { seed, rounds }) {
        const world = ctx.state.world as World
        for (let i = 0; i < rounds; i++) playRound(world, seed)
      },
    }),

    // A small answer about the world, cheap to send out of the engine.
    summarize: fn({
      title: 'Summarize',
      args: {},
      run(ctx) {
        const world = ctx.state.world as World
        ctx.state.summary = {
          round: world.round,
          items: world.items.length,
          wins: world.items.reduce((s, item) => s + item.wins, 0),
          last: world.history.at(-1) ?? null,
        }
      },
    }),
  },
})
