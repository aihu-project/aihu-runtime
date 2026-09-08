import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = join(root, 'package.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

function fail(message) {
  console.error(`release contract: ${message}`)
  process.exitCode = 1
}
function assert(condition, message) {
  if (!condition) fail(message)
}

for (const group of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  for (const [name, range] of Object.entries(manifest[group] ?? {})) {
    assert(!String(range).startsWith('workspace:'), `${group}.${name} still uses a workspace range`)
    assert(/^[~^<>=*0-9]/.test(String(range)), `${group}.${name} is not a published dependency range`)
  }
}
assert(manifest.name === '@aihu/runtime', 'package name must remain @aihu/runtime')
assert(manifest.version === '6.1.1', `expected prepared patch version 6.1.1, got ${manifest.version}`)
assert(JSON.stringify(manifest.files) === JSON.stringify(['dist', 'README.md', 'LICENSE']), 'files allowlist changed')
assert(manifest.exports?.['.']?.import === './dist/index.js', 'root import export is invalid')
assert(manifest.exports?.['./ssr']?.import === './dist/ssr-string.js', 'SSR import export is invalid')
assert(manifest.exports?.['./app']?.import === './dist/app.js', 'app bridge import export is invalid')
for (const path of ['./dist/index.js', './dist/index.d.ts', './dist/ssr-string.js', './dist/ssr-string.d.ts', './dist/app.js', './dist/app.d.ts']) {
  assert(existsSync(join(root, path)), `export target is missing: ${path}`)
}

for (const key of Object.keys(process.env)) {
  if (/^(?:NPM_TOKEN|NODE_AUTH_TOKEN|NPM_CONFIG_.*AUTHTOKEN|NODE_CONFIG_.*AUTHTOKEN)$/i.test(key)) {
    fail(`classic npm token environment variable is set: ${key}`)
  }
}
const configPaths = new Set([join(root, '.npmrc')])
try {
  configPaths.add(execFileSync('npm', ['config', 'get', 'userconfig'], { encoding: 'utf8' }).trim())
  configPaths.add(execFileSync('npm', ['config', 'get', 'globalconfig'], { encoding: 'utf8' }).trim())
} catch {
  fail('could not resolve npm user/global config paths')
}
for (const configPath of configPaths) {
  if (!configPath || !existsSync(configPath)) continue
  const content = readFileSync(configPath, 'utf8')
  assert(!/(^|\n)\s*(?:\/\/[^\n:]+:)?_authToken\s*=/im.test(content), `classic npm token config entry found in ${configPath}`)
  assert(!/(^|\n)\s*(?:npm[-_.])?token\s*=/im.test(content), `classic npm token config entry found in ${configPath}`)
}

const tarball = process.argv.find((arg) => arg.startsWith('--tarball='))?.slice('--tarball='.length)
if (tarball) {
  const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).map((entry) => entry.replace(/\/$/, ''))
  const allowed = /^(?:package\/package\.json|package\/(?:dist\/.*|README\.md|LICENSE))$/
  for (const entry of entries) assert(allowed.test(entry), `tarball contains non-allowlisted file: ${entry}`)
  assert(entries.includes('package/package.json'), 'tarball is missing package/package.json')
  assert(entries.includes('package/README.md'), 'tarball is missing README.md')
  assert(entries.includes('package/LICENSE'), 'tarball is missing LICENSE')
  assert(entries.some((entry) => entry.startsWith('package/dist/')), 'tarball is missing dist output')
}
if (process.exitCode) process.exit(process.exitCode)
console.log(`release contract passed for ${manifest.name}@${manifest.version}`)
