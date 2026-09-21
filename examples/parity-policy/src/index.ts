// A neutral toy policy for checking that two JavaScript engines agree.
// `run_probes` runs many small checks and records each result under its own
// name, so a difference points at the exact feature. No game content.
import { definePolicy, fn, kind, t } from '../../../src/index.ts'

type Probe = () => unknown

/** A small seeded random number generator: same seed, same numbers, on any engine. */
function makeRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let x = Math.imul(a ^ (a >>> 15), 1 | a)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled(items: readonly number[], seed: number): number[] {
  const random = makeRandom(seed)
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const held = result[i] as number
    result[i] = result[j] as number
    result[j] = held
  }
  return result
}

const words = ['pear', 'Apple', 'fig', 'apple', 'Émile', 'zebra', 'éclair', 'Zed', '10', '9', '2']

const probes: Record<string, Probe> = {
  // Numbers
  float_sum: () => 0.1 + 0.2,
  float_text: () => String(1 / 3),
  to_fixed: () => [(1.005).toFixed(2), (2.5).toFixed(0), (1234.5678).toFixed(1)],
  big_and_small: () => [1e21, 1e-7, 2 ** 53, -0, 123456789012345680000].map(String),
  negative_zero: () => Object.is(-0 * 1, -0),
  division_and_modulo: () => [7 / 2, -7 % 3, 7 % -3, 5.5 % 2],
  integer_math: () => [Math.trunc(-4.7), Math.round(-2.5), Math.round(2.5), Math.floor(-0.5), Math.imul(65536, 65536), 2 ** 31 | 0, -1 >>> 0],
  math_functions: () => [Math.sqrt(2), Math.pow(2, 0.5), Math.hypot(3, 4), Math.cbrt(27), Math.log(10), Math.exp(1)],
  math_trig: () => [Math.sin(1), Math.cos(1), Math.tan(1), Math.atan2(1, 2)],
  parse: () => [parseInt('08'), parseInt('0x1f'), parseFloat('3.14abc'), Number(''), Number(' 12 '), Number('1_000')].map(String),
  radix_text: () => [(255).toString(16), (0.5).toString(2), (-255).toString(36)],
  bigint: () => [(2n ** 64n).toString(), (7n / 2n).toString(), BigInt(9007199254740993n).toString()],
  // Strings
  string_basics: () => ['abc'.padStart(6, '-'), 'a-b-c'.split('-'), 'Hello'.at(-1), 'x'.repeat(3), 'abc'.replaceAll('b', 'B')],
  unicode_length: () => ['😀'.length, [...'😀'].length, 'é'.normalize('NFD').length, '😀'.codePointAt(0)],
  case_mapping: () => ['straße'.toUpperCase(), 'İ'.toLowerCase().length, 'ǅ'.toLowerCase()],
  regex: () => ['2026-09-21'.replace(/(\d+)-(\d+)-(\d+)/, '$3/$2/$1'), /(?<y>\d{4})/.exec('in 2026')?.groups?.y, 'aBc'.match(/b/i)?.index],
  string_compare: () => ['a' < 'B', 'a'.localeCompare('B'), 'é'.localeCompare('f'), 'a'.localeCompare('a')],
  number_locale: () => (1234567.891).toLocaleString('en-US'),
  // Ordering and containers
  default_sort: () => [...words].sort(),
  compare_sort: () => [...words].sort((a, b) => a.length - b.length),
  locale_sort: () => [...words].sort((a, b) => a.localeCompare(b)),
  numeric_default_sort: () => [10, 9, 2, 1, 100].sort(),
  stable_sort: () => Array.from({ length: 12 }, (_, i) => ({ k: i % 3, i })).sort((a, b) => a.k - b.k).map((o) => `${o.k}${o.i}`),
  object_key_order: () => Object.keys({ b: 1, 2: 1, a: 1, 1: 1, [Symbol.iterator]: 1, '-1': 1 }),
  json_output: () => JSON.stringify({ z: 1, a: [1, { y: undefined, x: NaN, w: () => 1, v: -0 }], d: 'é "' }),
  json_indent: () => JSON.stringify({ a: [1, 2], b: {} }, null, 2),
  map_set_order: () => [[...new Map([['b', 1], ['a', 2], ['b', 3]]).entries()], [...new Set([3, 1, 3, 2])]],
  array_methods: () => [[3, 1, 2].toSorted(), [1, 2, 3].toReversed(), [1, 2, 3, 4].findLast((x) => x % 2 === 1), [[1, [2]], [3]].flat(Infinity), Array.from({ length: 3 }, (_, i) => i * i)],
  holes_and_length: () => { const a = [1, , 3]; a[5] = 6; return [a.length, Object.keys(a), a.map((x) => x)] },
  group_by: () => Object.entries((Object as unknown as { groupBy(items: number[], by: (x: number) => string): object }).groupBy([1, 2, 3, 4, 5], (x) => (x % 2 ? 'odd' : 'even'))),
  // Language behaviour
  closures_and_spread: () => { const f = (...xs: number[]) => xs.reduce((s, x) => s + x, 0); return [f(...[1, 2, 3]), { ...{ a: 1 }, ...{ a: 2, b: 3 } }] },
  destructuring: () => { const { a = 5, ...rest } = { b: 2, c: 3 } as Record<string, number>; return [a, rest] },
  optional_chaining: () => { const o: { a?: { b?: number } } = {}; return [o.a?.b ?? 'none', (o as { f?: () => number }).f?.() ?? 'none'] },
  labels_and_switch: () => { let n = 0; outer: for (let i = 0; i < 5; i++) { for (let j = 0; j < 5; j++) { if (j === 3) continue outer; if (i === 3) break outer; n += j } } return n },
  getters_and_classes: () => { class A { #p = 2; get v() { return this.#p * 2 } static make() { return new A() } } return A.make().v },
  error_messages: () => {
    const messages: string[] = []
    for (const thrower of [() => (null as unknown as { x: number }).x, () => (undefined as unknown as () => void)(), () => JSON.parse('{bad'), () => new Array(-1), () => 'x'.repeat(-1), () => BigInt(1.5)]) {
      try { thrower() } catch (error) { messages.push(`${(error as Error).name}: ${(error as Error).message}`) }
    }
    return messages
  },
  stack_depth_ok: () => { const depth = (n: number): number => (n === 0 ? 0 : 1 + depth(n - 1)); return depth(2000) },
  // Seeded randomness and a realistic shuffle
  seeded_numbers: () => { const r = makeRandom(42); return Array.from({ length: 5 }, () => r()) },
  seeded_shuffle: () => shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2026),
  // Which newer features exist at all
  features: () => ['structuredClone', 'Intl', 'WeakRef', 'FinalizationRegistry', 'Atomics', 'SharedArrayBuffer', 'queueMicrotask', 'setTimeout', 'TextEncoder', 'URL', 'console'].map((name) => `${name}:${typeof (globalThis as Record<string, unknown>)[name]}`),
  array_methods_present: () => ['toSorted', 'toReversed', 'with', 'findLast', 'at', 'flatMap'].map((name) => `${name}:${typeof (Array.prototype as unknown as Record<string, unknown>)[name]}`),
}

export default definePolicy({
  id: 'parity',

  kinds: {
    entity: kind({ name: t.string({ minLength: 1 }) }),
  },

  functions: {
    // Records the result of every probe, or the error it threw, under its name.
    run_probes: fn({
      title: 'Run probes',
      args: {},
      run(ctx) {
        const results: Record<string, unknown> = {}
        for (const [name, probe] of Object.entries(probes)) {
          try {
            results[name] = probe()
          } catch (error) {
            results[name] = `threw ${(error as Error).name}`
          }
        }
        ctx.state.probes = results
      },
    }),

    // A realistic use: a shuffle driven by an injected seed.
    shuffle: fn({
      title: 'Shuffle',
      args: { seed: t.integer({ minimum: 0 }), count: t.integer({ minimum: 1 }) },
      run(ctx, { seed, count }) {
        ctx.state.order = shuffled(Array.from({ length: count }, (_, i) => i + 1), seed)
      },
    }),
  },
})
