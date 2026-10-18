// Benchmark for issue #17 (routed from aihu/docs/TODOS.md TODO-002): does
// wrapping a component's initial attribute-set sequence in `batch()` from
// `@aihu/signals` pay for itself on connect?
//
// The browser calls `attributeChangedCallback` once per already-present
// observed attribute when a custom element upgrades, before
// `connectedCallback` runs. If the code handling each call writes straight
// to a signal setter, N declared inputs do N separate writes. Whether that
// matters depends on how many *subscribers* (template bindings) those
// writes fan into — a write only costs something extra when a shared
// subscriber would otherwise re-run once per write instead of once overall.
//
// This bench measures BOTH realistic topologies rather than picking the one
// that flatters batching (see docs/TOPOLOGY.md §T7/§M1 in the aihu core
// repo for that failure mode):
//
//   - "shared":   one effect reads all N inputs (e.g. a single interpolated
//                 template literal spanning several props). Unbatched, it
//                 re-runs once per set(); batched, once total.
//   - "per-prop": N independent effects, each reading exactly one input
//                 (e.g. N separate attribute/text bindings — the shape
//                 aihu-runtime's own fine-grained per-binding effects take).
//                 Each effect runs exactly once either way; batch() has
//                 nothing to collapse.
//
// Run: node bench/connected-callback-batch.bench.mjs
import { signal, effect, batch, effectScope } from '@aihu/signals'

const INPUTS = 10
const ITERATIONS = 20_000
const WARMUP = 2_000

function connectShared(write) {
  const scope = effectScope(true)
  let runs = 0
  const sigs = Array.from({ length: INPUTS }, () => signal(0))
  scope.run(() => {
    effect(() => {
      runs++
      for (const [read] of sigs) read()
    })
  })
  write(sigs)
  scope.stop()
  return runs
}

function connectPerProp(write) {
  const scope = effectScope(true)
  let runs = 0
  const sigs = Array.from({ length: INPUTS }, () => signal(0))
  scope.run(() => {
    for (const [read] of sigs) {
      effect(() => {
        runs++
        read()
      })
    }
  })
  write(sigs)
  scope.stop()
  return runs
}

function writeUnbatched(sigs) {
  for (let i = 0; i < sigs.length; i++) sigs[i][1](i + 1)
}

function writeBatched(sigs) {
  batch(() => {
    for (let i = 0; i < sigs.length; i++) sigs[i][1](i + 1)
  })
}

function bench(connect, write, iterations) {
  let totalRuns = 0
  const start = process.hrtime.bigint()
  for (let i = 0; i < iterations; i++) totalRuns += connect(write)
  const end = process.hrtime.bigint()
  return { nanos: Number(end - start), avgRuns: totalRuns / iterations }
}

function report(label, connect) {
  // Warm up both patterns before timing either, and interleave the two
  // timed runs so JIT state/GC pressure isn't biased toward whichever runs
  // first.
  bench(connect, writeUnbatched, WARMUP)
  bench(connect, writeBatched, WARMUP)

  const unbatched = bench(connect, writeUnbatched, ITERATIONS)
  const batched = bench(connect, writeBatched, ITERATIONS)

  const unbatchedPerConnect = unbatched.nanos / ITERATIONS
  const batchedPerConnect = batched.nanos / ITERATIONS
  const delta = ((unbatchedPerConnect - batchedPerConnect) / unbatchedPerConnect) * 100

  console.log(`\n${label} (${INPUTS} inputs, ${ITERATIONS} connects)`)
  console.log(
    `  unbatched: ${unbatchedPerConnect.toFixed(1)} ns/connect` +
      ` (avg ${unbatched.avgRuns.toFixed(1)} effect runs/connect)`,
  )
  console.log(
    `  batched:   ${batchedPerConnect.toFixed(1)} ns/connect` +
      ` (avg ${batched.avgRuns.toFixed(1)} effect runs/connect)`,
  )
  console.log(`  delta:     ${delta.toFixed(1)}% ${delta >= 0 ? 'faster' : 'slower'} batched`)
  return delta
}

const sharedDelta = report('shared effect (1 effect reads all N inputs)', connectShared)
const perPropDelta = report('per-prop effects (N effects, 1 input each)', connectPerProp)

console.log('\nSummary')
console.log(`  shared-effect topology:   ${sharedDelta.toFixed(1)}% delta`)
console.log(`  per-prop-effect topology: ${perPropDelta.toFixed(1)}% delta`)
