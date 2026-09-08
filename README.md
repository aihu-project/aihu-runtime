# @aihu/runtime

> **Aihu** — agentic discovery and interaction, for human purpose.

Single File Component (.aihu) runtime — registers custom elements compiled by `@aihu/compiler`.

`@aihu/runtime` owns component definition and lifecycle behavior. It consumes the published DOM, context, and primitives packages and exposes a narrow `@aihu/runtime/app` bridge for `@aihu/app`.

<!-- BEGIN_HANDWRITTEN: prose -->
_(Hand-written prose lives in this block. Replace this placeholder; everything below is auto-generated.)_
<!-- END_HANDWRITTEN: prose -->

## Install

<!-- BEGIN_AUTOGEN: install -->
<!-- regenerate: bun scripts/sync-readme.ts (also runs in pre-commit + CI) -->

```bash
npm install @aihu/runtime
# or
bun add @aihu/runtime
```

<sub><i>Package version `@aihu/runtime@6.1.1`.</i></sub>

<!-- END_AUTOGEN: install -->

## Package facts

<!-- BEGIN_AUTOGEN: stats -->
<!-- Package facts are checked by `npm run release:contract`. -->

| | |
|---|---|
| **Version** | `6.1.1` |
| **Tier** | A — Reactive runtime core — custom-element wiring for compiled SFCs |
| **Bundle size** | 4.62 kB (gz) — limit 4750 B |
| **Published files** | 3 entries |
| **License** | MIT |

<sub><i>Package version `@aihu/runtime@6.1.1`.</i></sub>

<!-- END_AUTOGEN: stats -->

## Exports

<!-- BEGIN_AUTOGEN: exports -->
<!-- Exports mirror package.json and are checked by `npm run release:contract`. -->

| Subpath | ESM | CJS |
|---|---|---|
| `.` | `./dist/index.js` | `—` |
| `./ssr` | `./dist/ssr-string.js` | `—` |
| `./app` | `./dist/app.js` | `—` |

<sub><i>Package version `@aihu/runtime@6.1.1`.</i></sub>

<!-- END_AUTOGEN: exports -->

## Dependencies

<!-- BEGIN_AUTOGEN: deps -->
<!-- regenerate: bun scripts/sync-readme.ts (also runs in pre-commit + CI) -->

**Dependencies:**

- `@aihu/primitives` — `^0.2.3`

**Peer dependencies:**

- `@aihu/arbor` — `^4.1.2`
- `@aihu/signals` — `^0.5.1`
- `@aihu/context` — `^0.2.0`

<sub><i>Package version `@aihu/runtime@6.1.1`.</i></sub>

<!-- END_AUTOGEN: deps -->

## See also

<!-- BEGIN_AUTOGEN: see-also -->
<!-- regenerate: bun scripts/sync-readme.ts (also runs in pre-commit + CI) -->

- [@aihu/arbor](https://github.com/aihu-project/aihu-dom)
- [@aihu/compiler](https://github.com/aihu-project/aihu-compiler)
- [Aihu framework root](https://github.com/aihu-project/aihu)

<sub><i>Package version `@aihu/runtime@6.1.1`.</i></sub>

<!-- END_AUTOGEN: see-also -->

## License

<!-- BEGIN_AUTOGEN: license -->
<!-- License is shipped in this repository. -->

MIT — see [LICENSE](LICENSE).

<sub><i>Package version `@aihu/runtime@6.1.1`.</i></sub>

<!-- END_AUTOGEN: license -->

## Release procedure

Merge the reviewed change to `main`, update the package version, and verify the
default branch locally. Then create and push the exact annotated tag
`runtime-v<package.version>` (for example, `runtime-v6.1.1`). The release
workflow rejects tags that do not point at the current `main` commit, checks
that npm returns `E404` for the target version, and publishes the one verified
tarball with npm provenance through GitHub OIDC. Do not publish from a local
classic token or create a tag before the workflow's package and consumer checks
pass.
