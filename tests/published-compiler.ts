import { existsSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

export function resolvePublishedCompilerBinary(): string {
  const platformPackage = ({
    'darwin-arm64': '@aihu/compiler-darwin-arm64',
    'darwin-x64': '@aihu/compiler-darwin-x64',
    'linux-arm64': '@aihu/compiler-linux-arm64-gnu',
    'linux-x64': '@aihu/compiler-linux-x64-gnu',
    'win32-x64': '@aihu/compiler-win32-x64-msvc',
  } as Record<string, string>)[`${process.platform}-${process.arch}`]
  if (!platformPackage) throw new Error(`@aihu/compiler has no binary for ${process.platform}-${process.arch}`)
  let manifest: string
  try {
    manifest = createRequire(join(process.cwd(), 'package.json')).resolve(`${platformPackage}/package.json`)
  } catch {
    const compilerManifest = createRequire(import.meta.url).resolve('@aihu/compiler/package.json')
    const scope = dirname(dirname(realpathSync(compilerManifest)))
    manifest = join(scope, platformPackage.slice('@aihu/'.length), 'package.json')
    if (!existsSync(manifest)) throw new Error(`Cannot resolve ${platformPackage}/package.json`)
  }
  const executable = join(dirname(manifest), process.platform === 'win32' ? 'aihu-compile.exe' : 'aihu-compile')
  if (!existsSync(executable)) throw new Error(`Published compiler executable is missing at ${executable}`)
  return executable
}
