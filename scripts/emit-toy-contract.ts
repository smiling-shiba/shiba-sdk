// Prints the toy policy's contract as JSON. Usage: npm run toy:contract -- 2026.09.19.1
import toyPolicy from '../examples/toy-policy/src/index.ts'
import { buildContract, contractToJson } from '../src/index.ts'

const version = process.argv[2]
if (version === undefined) {
  console.error('Usage: npm run toy:contract -- <version, a calver like 2026.09.19.1>')
  process.exitCode = 2
} else {
  try {
    process.stdout.write(contractToJson(buildContract(toyPolicy, { version })))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
