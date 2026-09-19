/**
 * v0.6.0 L1 — shared `adoptedStyleSheets` aggregation across component
 * instances (aihu-runtime#9).
 *
 * `aihu-compiler`'s emitted setup today does, per MOUNTED INSTANCE:
 *   const __style__ = new CSSStyleSheet()
 *   __style__.replaceSync(cssText)
 *   host.adoptedStyleSheets = [__style__]
 * — constructing and CSS-parsing a fresh stylesheet on every mount, and
 * clobbering whatever the host already had adopted (e.g. a sibling
 * component's sheet). `_adoptStyleSheet` replaces that inline sequence: one
 * `CSSStyleSheet` per distinct CSS source is built once and cached (the CSS
 * text is a compile-time constant per component class, so it is already a
 * stable, natural cache key — no new per-class identity needs threading
 * through from the compiler), and adopting it APPENDS to the host's
 * existing sheets instead of replacing them.
 *
 * NOT YET WIRED from the compiler — `aihu-compiler`'s `emit_style_block`
 * still inlines the sequence above directly rather than calling this
 * helper. Routing that emission through `_adoptStyleSheet` is a follow-up
 * change tracked against `aihu-compiler`.
 */
const _sheetCache = new Map<string, CSSStyleSheet>()

/** @internal — adopt `cssText`'s cached, deduplicated stylesheet onto
 * `host`, appending to any sheets it already has adopted. Multiple
 * instances (or components) sharing identical CSS share one constructed
 * `CSSStyleSheet` object rather than each constructing and parsing their
 * own; a `host` that already carries this exact sheet (e.g. a
 * reconnect/re-render of the same instance) is left untouched rather than
 * appending a duplicate reference. */
export function _adoptStyleSheet(host: ShadowRoot, cssText: string): void {
  let sheet = _sheetCache.get(cssText)
  if (sheet === undefined) {
    sheet = new CSSStyleSheet()
    sheet.replaceSync(cssText)
    _sheetCache.set(cssText, sheet)
  }
  const existing = host.adoptedStyleSheets ?? []
  if (!existing.includes(sheet)) {
    host.adoptedStyleSheets = [...existing, sheet]
  }
}
