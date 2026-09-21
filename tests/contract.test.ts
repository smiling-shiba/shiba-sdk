import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import toyPolicy from '../examples/toy-policy/src/index.ts'
import { buildContract, contractToJson } from '../src/contract.ts'
import { definePolicy, fn, hook, kind } from '../src/policy.ts'
import { t } from '../src/schema.ts'
import { SDK_VERSION } from '../src/version.ts'

const read = (relative: string): string => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

describe('buildContract', () => {
  it('matches the reviewed toy contract exactly, so any change to the output is deliberate', () => {
    expect(contractToJson(buildContract(toyPolicy, { version: '2026.09.19.1' }))).toBe(read('./fixtures/toy-contract.json'))
  })

  it('gives the same output every time', () => {
    const first = contractToJson(buildContract(toyPolicy, { version: '2026.09.19.1' }))
    expect(contractToJson(buildContract(toyPolicy, { version: '2026.09.19.1' }))).toBe(first)
  })

  it('sorts kinds, hooks and functions by name, whatever order they were declared in', () => {
    const policy = definePolicy({
      id: 'demo',
      kinds: { zebra: kind({}), apple: kind({}) },
      hooks: { second: hook(), first: hook() },
      functions: { b_fn: fn({ args: {}, run: () => undefined }), a_fn: fn({ args: {}, run: () => undefined }) },
    })
    const contract = buildContract(policy, { version: '2026.09.19.1' })
    expect(Object.keys(contract.kinds)).toEqual(['apple', 'zebra'])
    expect(Object.keys(contract.hooks)).toEqual(['first', 'second'])
    expect(Object.keys(contract.functions)).toEqual(['a_fn', 'b_fn'])
  })

  it('includes titles only where given, and an args schema for every function', () => {
    const policy = definePolicy({
      id: 'demo',
      kinds: {},
      hooks: { untitled: hook(), titled: hook({ title: 'Titled' }) },
      functions: { bare: fn({ args: {}, run: () => undefined }) },
    })
    const contract = buildContract(policy, { version: '2026.09.19.1' })
    expect(contract.hooks).toEqual({ titled: { title: 'Titled' }, untitled: {} })
    expect(contract.functions).toEqual({ bare: { args: { type: 'object', properties: {} } } })
  })

  it('records the SDK version, and the bundle hash when there is one', () => {
    const policy = definePolicy({ id: 'demo', kinds: { entity: kind({ name: t.string() }) } })
    expect(buildContract(policy, { version: '2026.09.19.1' }).policy).toEqual({ id: 'demo', version: '2026.09.19.1' })
    expect(buildContract(policy, { version: '2026.09.19.1', sha256: 'abc' }).policy).toEqual({ id: 'demo', version: '2026.09.19.1', sha256: 'abc' })
    expect(buildContract(policy, { version: '2026.09.19.1' }).sdk).toEqual({ version: SDK_VERSION })
    expect(buildContract(policy, { version: '2026.09.19.1', sdkVersion: '9.9.9' }).sdk).toEqual({ version: '9.9.9' })
  })

  it.each(['1.2.3', '2026.9.19.1', '2026.13.01.1', '2026.09.32.1', '2026.09.19', '2026.09.19.0', '2026-09-19.1', ''])(
    'rejects "%s" as a version',
    (version) => {
      const policy = definePolicy({ id: 'demo', kinds: {} })
      expect(() => buildContract(policy, { version })).toThrow(/must be a calver/)
    },
  )

  it('accepts a build number above 9', () => {
    const policy = definePolicy({ id: 'demo', kinds: {} })
    expect(buildContract(policy, { version: '2026.09.19.12' }).policy.version).toBe('2026.09.19.12')
  })
})

describe('contractToJson', () => {
  it('ends with a newline and round-trips', () => {
    const contract = buildContract(toyPolicy, { version: '2026.09.19.1' })
    const json = contractToJson(contract)
    expect(json.endsWith('\n')).toBe(true)
    expect(JSON.parse(json)).toEqual(contract)
  })
})

describe('SDK_VERSION', () => {
  it('matches package.json', () => {
    const packageJson: unknown = JSON.parse(read('../package.json'))
    expect(packageJson).toMatchObject({ version: SDK_VERSION })
  })
})
