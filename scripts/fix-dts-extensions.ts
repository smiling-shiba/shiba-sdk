// tsc rewrites `.ts` -> `.js` in relative import specifiers for emitted JS
// (rewriteRelativeImportExtensions), but not inside emitted .d.ts files. Without
// this, the published types would point at `./contract.ts`, which does not exist
// in the package (only `./contract.js` and `./contract.d.ts` do). Run after `tsc`.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dtsExtension = /(from\s+['"]\.\.?\/[^'"]+)\.ts(['"])/g

function fix(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) fix(path)
    else if (entry.name.endsWith('.d.ts')) {
      const source = readFileSync(path, 'utf8')
      const fixed = source.replace(dtsExtension, '$1.js$2')
      if (fixed !== source) writeFileSync(path, fixed)
    }
  }
}

fix('dist')
