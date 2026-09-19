import { beforeAll, describe, expect, it } from 'vitest'
import { _adoptStyleSheet } from '../src/style-sheet-cache.ts'

beforeAll(() => {
  // jsdom (as of v25) does not implement CSSStyleSheet#replaceSync — shim it
  // for these tests. Real browsers implement it natively (that's the whole
  // point of constructable stylesheets); this polyfill only exists so the
  // caching/aggregation logic under test can be exercised under jsdom.
  if (typeof CSSStyleSheet.prototype.replaceSync !== 'function') {
    CSSStyleSheet.prototype.replaceSync = function (cssText: string): void {
      ;(this as unknown as { _cssText: string })._cssText = cssText
    }
  }
})

function makeShadowHost(): ShadowRoot {
  return document.createElement('div').attachShadow({ mode: 'open' })
}

describe('_adoptStyleSheet', () => {
  it('dedupes: two hosts adopting identical CSS text share one CSSStyleSheet object', () => {
    const hostA = makeShadowHost()
    const hostB = makeShadowHost()
    _adoptStyleSheet(hostA, '.a{color:red}')
    _adoptStyleSheet(hostB, '.a{color:red}')
    expect(hostA.adoptedStyleSheets[0]).toBe(hostB.adoptedStyleSheets[0])
  })

  it('aggregates: appends to a host that already has other adopted sheets', () => {
    const host = makeShadowHost()
    const existing = new CSSStyleSheet()
    existing.replaceSync('.pre{color:blue}')
    host.adoptedStyleSheets = [existing]
    _adoptStyleSheet(host, '.new{color:green}')
    expect(host.adoptedStyleSheets).toHaveLength(2)
    expect(host.adoptedStyleSheets[0]).toBe(existing)
  })

  it('is idempotent: re-adopting the same CSS text on the same host does not duplicate the sheet', () => {
    const host = makeShadowHost()
    _adoptStyleSheet(host, '.idempotent{color:red}')
    _adoptStyleSheet(host, '.idempotent{color:red}')
    expect(host.adoptedStyleSheets).toHaveLength(1)
  })

  it('caches by CSS text: distinct CSS text gets its own sheet object', () => {
    const host = makeShadowHost()
    _adoptStyleSheet(host, '.distinct-a{color:red}')
    _adoptStyleSheet(host, '.distinct-b{color:blue}')
    expect(host.adoptedStyleSheets).toHaveLength(2)
    expect(host.adoptedStyleSheets[0]).not.toBe(host.adoptedStyleSheets[1])
  })
})
