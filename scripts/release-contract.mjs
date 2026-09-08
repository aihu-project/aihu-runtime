import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = join(root, 'package.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const distAllowlist = JSON.parse(readFileSync(join(root, 'scripts/dist-allowlist.json'), 'utf8'))

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
function filesUnder(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(prefix, entry.name)
    return entry.isDirectory() ? filesUnder(join(directory, entry.name), path) : [path]
  })
}
const actualDist = filesUnder(join(root, 'dist')).sort()
const expectedDist = [...distAllowlist].sort()
assert(JSON.stringify(actualDist) === JSON.stringify(expectedDist), 'dist contains files outside the exact allowlist')
for (const path of ['./dist/index.js', './dist/index.d.ts', './dist/ssr-string.js', './dist/ssr-string.d.ts', './dist/app.js', './dist/app.d.ts']) {
  assert(existsSync(join(root, path)), `export target is missing: ${path}`)
}

for (const key of Object.keys(process.env)) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
  const isNpmCredential = ['auth', 'token', 'username', 'password', 'email', 'certfile', 'keyfile'].some((term) => normalized.includes(term))
  if ((normalized.includes('npm') || normalized.includes('node')) && isNpmCredential) {
    fail(`classic npm credential environment variable is set: ${key}`)
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
  const legacyCredential = '(?:_authToken|_auth|authToken|username|_password|password|email|certfile|keyfile)'
  const scopedPrefix = '(?:(?:\/\/[^\n=]+|@[^\n=]+):)?'
  assert(!new RegExp(`(^|\\n)\\s*${scopedPrefix}${legacyCredential}\\s*=`, 'im').test(content), `classic npm credential config entry found in ${configPath}`)
  assert(!/(^|\n)\s*(?:npm[-_.])?token\s*=/im.test(content), `classic npm token config entry found in ${configPath}`)
}

const npmVersion = execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim().split('.').map(Number)
assert(npmVersion.length === 3 && (npmVersion[0] > 11 || (npmVersion[0] === 11 && (npmVersion[1] > 5 || (npmVersion[1] === 5 && npmVersion[2] >= 1)))), 'npm 11.5.1 or newer is required')

const tarball = process.argv.find((arg) => arg.startsWith('--tarball='))?.slice('--tarball='.length)
if (tarball) {
  const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).map((entry) => entry.replace(/\/$/, ''))
  const expected = ['package/package.json', 'package/README.md', 'package/LICENSE', ...distAllowlist.map((path) => `package/dist/${path}`)].sort()
  assert(JSON.stringify(entries.sort()) === JSON.stringify(expected), 'tarball does not match the exact package file allowlist')
}
if (process.exitCode) process.exit(process.exitCode)
console.log(`release contract passed for ${manifest.name}@${manifest.version}`)
