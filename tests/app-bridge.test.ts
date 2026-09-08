import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as bridge from '../src/app.ts'

const fixture = join(process.cwd(), 'tests/fixtures/app-consumer/client.ts')

describe('@aihu/runtime/app integration bridge', () => {
  it('exports exactly the four supported app bootstrap hooks', () => {
    expect(Object.keys(bridge).sort()).toEqual([
      '_setHydrate',
      '_setMount',
      '_setSignal',
      '_withOwnerContext',
    ])
  })

  it('is the only runtime import used by the consumer fixture', () => {
    const source = readFileSync(fixture, 'utf8')
    const imports = [...source.matchAll(/from\s+['"](@aihu\/runtime(?:\/[^'"]*)?)['"]/g)].map((match) => match[1])
    expect(imports).toEqual(['@aihu/runtime/app'])
    expect(source).not.toMatch(/runtime\/src\//)
  })
})
