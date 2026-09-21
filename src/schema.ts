export type JsonObject = Record<string, unknown>

/**
 * A described value: a JSON Schema fragment plus, for TypeScript, the type of
 * the value it describes. Build these with the `t` helpers below.
 */
export interface Field<T, Optional extends boolean = false> {
  readonly schema: JsonObject
  readonly optional: Optional
  /** Type-only marker so the value type can be inferred. It is never set at runtime. */
  readonly valueType?: T
}

interface Described {
  description?: string
}

export interface StringOptions extends Described {
  minLength?: number
  maxLength?: number
  pattern?: string
}

export interface NumberOptions extends Described {
  minimum?: number
  maximum?: number
}

export interface ArrayOptions extends Described {
  minItems?: number
  maxItems?: number
}

function compact(source: JsonObject): JsonObject {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== undefined))
}

function field<T>(schema: JsonObject): Field<T> {
  return { schema, optional: false }
}

/** Helpers for describing the fields of a kind and the arguments of a function. */
export const t = {
  string(options: StringOptions = {}): Field<string> {
    return field(compact({ type: 'string', ...options }))
  },

  integer(options: NumberOptions = {}): Field<number> {
    return field(compact({ type: 'integer', ...options }))
  },

  number(options: NumberOptions = {}): Field<number> {
    return field(compact({ type: 'number', ...options }))
  },

  boolean(options: Described = {}): Field<boolean> {
    return field(compact({ type: 'boolean', ...options }))
  },

  array<T>(items: Field<T>, options: ArrayOptions = {}): Field<T[]> {
    return field(compact({ type: 'array', items: items.schema, ...options }))
  },

  /** Marks a field as not required. */
  optional<T>(inner: Field<T>): Field<T, true> {
    return { schema: inner.schema, optional: true }
  },

  /** A string that must be the id of a template of `kind`. Checked by `sht validate`. */
  ref(kind: string, options: Described = {}): Field<string> {
    return field(compact({ type: 'string', 'x-shiba-ref': kind, ...options }))
  },
}
