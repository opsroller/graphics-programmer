// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'feel-and-perf-check',
  description: 'Check finished presentation work before it is marked done: run the project\'s existing benchmark tool for frame-time percentiles, then check feel timings, readability, input on every device family, and frame time on each target against those numbers, in parallel and read only; then one prioritised fix list and a docs pass recording the measured results, re-checked after fixes. args: { scope: "what to check, e.g. a branch name such as fix/login-timeout or a feature name", targets?: ["weakest supported phone", "desktop", "web build"], benchmark?: { command?: "existing benchmark command or tool", scenes?: [], tiers?: [], resolutions?: [], runs?: 3, warmup?: "frames or seconds dropped before sampling" } }',
  phases: [
    { title: 'Plan', detail: 'scope, targets, existing benchmark tool, docs plan (compass)' },
    { title: 'Benchmark', detail: 'run the existing benchmark tool per target, scene, tier and resolution; percentiles, device, backend, driver, GPU timing' },
    { title: 'Check', detail: 'read-only checks per concern and target, in parallel; perf judges the benchmark numbers' },
    { title: 'Report', detail: 'one prioritised fix list' },
    { title: 'Docs', detail: 'record measured results in the project docs' },
    { title: 'Docs check', detail: 'one kind per page, titles, links; up to three checks and two fixes over every page touched, minor issues go to the notes' },
  ],
}

// --- run-modes v2 begin ---
const RUN = ((a, realAgent, realPhase, realLog) => {
  const opted = !!(a && typeof a === 'object' && a.run && typeof a.run === 'object')
  const c = opted ? a.run : {}
  const mode = c.mode === 'inline' ? 'inline' : 'agents'
  const results = c.results && typeof c.results === 'object' ? c.results : {}
  const reviewers = c.reviewers && typeof c.reviewers === 'object' ? c.reviewers : {}
  const only = Array.isArray(c.only) && c.only.length ? c.only.map(String) : null
  const from = c.from ? String(c.from) : null
  const titles = typeof meta !== 'undefined' && meta && Array.isArray(meta.phases) ? meta.phases.map((p) => p.title) : []
  const unknown = titles.length ? (from ? [from] : []).filter((t) => !titles.includes(t)) : []
  const error = c.mode && !['agents', 'inline'].includes(c.mode)
    ? `run.mode must be "agents" or "inline", got "${c.mode}"`
    : unknown.length ? `run.from names no phase: ${unknown.join(', ')}. Phases: ${titles.join(', ')}` : null
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
  // An answer must carry every required key of its schema, as the runtime
  // enforces for agents; returns the missing keys, or null when it fits.
  const missing = (v, schema) => {
    if (v === null || v === undefined) return 'an answer'
    if (!schema || schema.type !== 'object') return null
    if (typeof v !== 'object' || Array.isArray(v)) return 'a JSON object'
    const gap = (schema.required || []).filter((k) => !has(v, k) || v[k] === undefined)
    return gap.length ? gap.join(', ') : null
  }
  const seen = {}
  const out = {}
  // Who answered each step marked independent: "subagent" when this run
  // spawned it, else the reviewer named in run.reviewers, else "self".
  const by = {}
  const who = (k) => (typeof reviewers[k] === 'string' && reviewers[k].trim() ? reviewers[k].trim() : 'self')
  const skipped = []
  const next = []
  const logs = []
  let current = ''
  let reached = !from
  let halting = false
  let release = () => {}
  const halted = new Promise((r) => { release = r })
  const picked = (ph, label) => reached && (!only || only.some((s) => s === ph || s === label || label.startsWith(s + ':')))
  const agent = (prompt, opts) => {
    const op = opts || {}
    const independent = op.independent === true
    const ph = op.phase || current
    const base = op.label || ph || 'agent'
    seen[base] = (seen[base] || 0) + 1
    const key = seen[base] > 1 ? `${base}#${seen[base]}` : base
    let note = null
    if (has(results, key)) {
      const gap = missing(results[key], op.schema)
      if (!gap) { out[key] = results[key]; if (independent) by[key] = who(key); return Promise.resolve(results[key]) }
      note = `answer missing ${gap}; answer this brief again`
    }
    if (!picked(ph, base)) { skipped.push(key); return Promise.resolve(null) }
    if (mode === 'agents') {
      const pass = Object.assign({}, op)
      delete pass.independent
      return realAgent(prompt, opts ? pass : opts).then((r) => {
        if (r !== null && r !== undefined) { out[key] = r; if (independent) by[key] = 'subagent' }
        return r
      })
    }
    const brief = { key, phase: ph, prompt, schema: op.schema || null }
    if (independent) brief.independent = true
    if (note) brief.note = note
    next.push(brief)
    if (!halting) {
      halting = true
      // Wait 200 microtask turns before pausing, so every sibling in a
      // parallel() or pipeline() fan-out queues its brief into this pause.
      ;(async () => { for (let i = 0; i < 200; i++) await null; release('__run_halted__') })()
    }
    return new Promise(() => {})
  }
  const phase = (t) => { current = t; if (from && t === from) reached = true; return realPhase(t) }
  const log = (m) => { logs.push(String(m)); return realLog(m) }
  const finish = (value) => {
    if (!opted) return value
    const self_reviewed = Object.keys(by).filter((k) => by[k] === 'self')
    if (value === '__run_halted__') {
      return {
        run: 'inline', status: 'next', next, results: out, reviewers: by, self_reviewed, skipped, logs,
        how: 'Do each brief in next, in order: follow its prompt in this session (it may tell you to edit files, commit or push), and shape your answer to its schema when one is given, with every required field. A brief marked independent reviews work this run produced, so do not answer it yourself: send its prompt to a reviewer with no part in the work (the project\'s code-reviewer role, a fresh session or a fresh subagent), use their answer, and name them in run.reviewers under its key; if you must answer it yourself, it is listed in self_reviewed and must be reported as self-reviewed. A brief with a note was answered before without the fields it names. Add each answer to results under its key, then run this workflow again with the same args, run.results set to the merged results and run.reviewers to the merged reviewers. Repeat until status is "done". To avoid pasting results back on every call, drive the run with engineering-practices tools/run-inline.mjs and a state file instead: it stores each answer and prints only the next briefs.',
      }
    }
    return { run: mode, status: 'done', result: value, results: out, reviewers: by, self_reviewed, skipped, logs }
  }
  return { agent, phase, log, finish, halted, error }
})(typeof args === 'undefined' ? undefined : args, agent, phase, log)
if (RUN.error) return RUN.error
const RUN_OUT = await Promise.race([RUN.halted, (async (agent, phase, log) => {
// --- run-modes v2 end (workflow body follows; close it with the tail line) ---

const USAGE = 'usage: feel-and-perf-check { scope: "branch or feature", targets?: ["weakest supported phone", "desktop"], benchmark?: { command?: "existing benchmark command", scenes?: [], tiers?: [], resolutions?: [], runs?: 3, warmup?: "..." } }'
if (!args || !args.scope) return USAGE
const scope = args.scope
const targets = Array.isArray(args.targets) && args.targets.length ? args.targets : ['the weakest supported device in the project profile', 'desktop']
const benchArg = args.benchmark && typeof args.benchmark === 'object' ? args.benchmark : {}
const list = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : [])

// Some backends (Metal, some web and mobile drivers) report no GPU timing,
// and their CPU frame time then includes the wait for a drawable or vsync.
const NO_GPU_TIMING = 'If the backend reports no GPU timing (some do not, e.g. Metal, some web and mobile drivers), record gpu_timing "unavailable": the CPU frame time then includes the wait for a drawable, vsync or present, so do not read that wait as CPU work. Judge the budget on total frame-time percentiles, uncapped (vsync off) where the platform allows, take GPU cost from the platform\'s GPU profiler or frame capture when one is reachable, and mark the bound side (CPU or GPU) as inferred, with the test that suggests it (see the frame-budget-profiling skill, "When the backend reports no GPU timing").'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs/<kind>/ (location per the project profile), keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const FINDINGS = {
  type: 'object',
  properties: {
    area: { type: 'string' },
    findings: { type: 'array', items: { type: 'string' }, description: 'each: what, where (file), actual vs target, concrete change' },
    measured: { type: 'boolean' },
  },
  required: ['area', 'findings', 'measured'],
}

phase('Plan')
const PLAN = { type: 'object', properties: {
  summary: { type: 'string' },
  docsPlan: { type: 'array', items: { type: 'string' } },
  benchmark: { type: 'string', description: 'the project\'s existing benchmark command or tool that reports frame-time percentiles (from the project profile, its scripts or docs); empty if none exists' },
  scenes: { type: 'array', items: { type: 'string' }, description: 'benchmark scenes or scenarios that cover this scope' },
}, required: ['summary', 'docsPlan', 'benchmark'] }
const plan = await agent(
  `You are the graphics-programmer. Onboard first (engineering-practices project-onboarding). Summarise what "${scope}" changed in presentation, and plan the docs: ${DOCS_FRAGMENT} Here only plan (kind, path, change), typically reference pages for measured budgets per target. Also find the project's existing benchmark tool: a command or scene that captures frame-time percentiles (look in the project profile, build scripts, tools and docs)${benchArg.command ? `; the caller names "${benchArg.command}"` : ''}, and the scenes or scenarios that cover this scope. Leave benchmark empty when none exists; never invent one. Do not edit anything.`,
  { schema: PLAN, phase: 'Plan', label: 'plan' },
)
if (!plan) return 'blocked: planning failed (no plan returned)'

phase('Benchmark')
// The run drives the project's own tool; nobody times frames by hand. With
// no tool the perf checks estimate, and the result points at
// build-measurement-tool.
const benchCommand = String(benchArg.command || plan.benchmark || '').trim()
const BENCH = { type: 'object', properties: {
  ran: { type: 'boolean', description: 'true if the tool ran and produced numbers' },
  command: { type: 'string', description: 'the exact command line(s) run' },
  rows: { type: 'array', items: { type: 'object', properties: {
    target: { type: 'string' }, scene: { type: 'string' }, tier: { type: 'string' }, resolution: { type: 'string' },
    device: { type: 'string' }, backend: { type: 'string' }, driver: { type: 'string' },
    gpu_timing: { type: 'string', enum: ['available', 'unavailable'] },
    runs: { type: 'number' }, p50_ms: { type: 'number' }, p95_ms: { type: 'number' }, p99_ms: { type: 'number' }, worst_ms: { type: 'number' },
    frames_over_budget: { type: 'number' }, budget_ms: { type: 'number' },
    measured: { type: 'boolean', description: 'false for software renderers, containers or anything that is not the target hardware' },
  }, required: ['target', 'scene', 'device', 'backend', 'gpu_timing', 'p50_ms', 'p95_ms', 'p99_ms', 'measured'] } },
  problems: { type: 'array', items: { type: 'string' }, description: 'targets or scenes that could not run, and why' },
}, required: ['ran', 'command', 'rows', 'problems'] }
let bench = null
if (benchCommand) {
  const scenes = list(benchArg.scenes).length ? list(benchArg.scenes) : list(plan.scenes)
  bench = await agent(
    `You are the graphics-programmer. Run the project's existing benchmark tool for "${scope}": ${benchCommand}. Run it in a release-like build for each target (${targets.join('; ')})${scenes.length ? `, scenes ${JSON.stringify(scenes)}` : ', on the scenes that cover this scope'}${list(benchArg.tiers).length ? `, quality tiers ${JSON.stringify(list(benchArg.tiers))}` : ''}${list(benchArg.resolutions).length ? `, resolutions ${JSON.stringify(list(benchArg.resolutions))}` : ''}, ${Number(benchArg.runs) > 0 ? Number(benchArg.runs) : 3} runs each${benchArg.warmup ? `, dropping ${benchArg.warmup} as warm-up` : ', dropping the tool\'s warm-up frames'}. Use the tool's own output; do not time frames by hand or write a new tool. Return one row per target, scene, tier and resolution with p50, p95, p99 and worst frame time, frames over the budget, the budget, device, backend and driver. ${NO_GPU_TIMING} A target you cannot reach (no device, no build) goes in problems, not in rows. Frame times from a software renderer or a container (headless-rendering skill) are rows with measured=false. Do not edit project files; commit nothing.`,
    { schema: BENCH, phase: 'Benchmark', label: 'benchmark' },
  )
}
const benchRows = bench && Array.isArray(bench.rows) ? bench.rows : []
const benchNote = !benchCommand
  ? 'no benchmark tool found: perf checks estimate; build one with /graphics-programmer:build-measurement-tool rather than timing frames by hand'
  : !bench ? 'benchmark step returned nothing: perf unverified'
  : !bench.ran ? `benchmark did not run: ${(bench.problems || []).join('; ') || 'no reason given'}` : ''
const noGpuTiming = benchRows.filter((r) => r.gpu_timing === 'unavailable').map((r) => `${r.target}/${r.backend}`)

const checks = [
  ['feel', 'Compare every animation timing and easing with the feel targets in the design spec; list each delta as "beat: actual vs target". Check skip and reduced motion. Skill: event-presentation.'],
  ['readability', 'Check the readable set at the smallest supported resolution and the narrowest and widest aspect ratios, inside safe areas, in grayscale. Skills: scene-composition, camera-systems.'],
  ['input', 'Check every action on every supported device family, including cancel, focus loss and disconnect, and touch target sizes. Skill: input-handling.'],
  ...targets.map((t) => {
    const rows = benchRows.filter((r) => r.target === t)
    const source = rows.length
      ? `Judge these benchmark rows for ${t} against the project budget (do not re-run or time frames by hand): ${JSON.stringify(rows)}. Set measured=true only if every row is measured.`
      : `${benchNote || `The benchmark produced no row for ${t}.`} Estimate frame time (median, p95, p99) on ${t} from scene and code against the project budget and set measured=false.`
    return [`perf: ${t}`, `${source} Frame times from a software renderer on a machine with no GPU (graphics-programmer headless-rendering skill) are not measurements: set measured=false for them too. ${NO_GPU_TIMING} Skills: frame-budget-profiling, platform-scaling, web-rendering for web targets.`]
  }),
]

phase('Check')
const results = await parallel(checks.map(([area, task]) => () =>
  agent(`You are a graphics-programmer reviewer. Read only; do not edit any file. Scope: "${scope}" (${plan.summary}). ${task}`,
    { schema: FINDINGS, phase: 'Check', label: area }).then((r) => (r ? { ...r, area } : { area, crashed: true }))))
const unverified = results.filter((r) => r.crashed).map((r) => r.area)
const estimated = results.filter((r) => !r.crashed && !r.measured).map((r) => r.area)
const done = results.filter((r) => !r.crashed)
if (benchCommand && (!bench || !bench.ran)) unverified.push('benchmark')

phase('Report')
const report = await agent(
  `Turn these findings into one prioritised fix list, biggest player-visible impact first, each with file and the concrete change. Mark items from estimated (not measured) checks as estimates, and bound-side calls on backends with no GPU timing (${noGpuTiming.join(', ') || 'none'}) as inferred. Areas not checked: ${unverified.join(', ') || 'none'}.\n${JSON.stringify(done)}`,
  { phase: 'Report', label: 'report' },
)
if (!report) return `blocked: report failed; raw findings:\n${JSON.stringify(done)}\nunverified: ${unverified.join(', ') || 'none'}`

phase('Docs')
const docs = await agent(
  `You are the graphics-programmer. Record the measured results for "${scope}" in the project docs. Planned pages: ${JSON.stringify(plan.docsPlan)}. Only record numbers from measured checks (estimated: ${estimated.join(', ') || 'none'}). ${benchRows.length ? `Benchmark rows (record device, backend, driver, gpu_timing and the command with each number): ${JSON.stringify(benchRows)}; command: ${bench.command}. ` : ''}${DOCS_FRAGMENT} Commit on the same branch as the work. End with the paths of every page touched.`,
  { phase: 'Docs', label: 'docs' },
)

phase('Docs check')
// The check only reads, so it stays independent of the docs it judges;
// fixes are their own step, followed by a fresh check of every page touched
// so far (pages a fix added included). Up to three checks and two fixes;
// minor issues left at the end go to the notes, blocking ones block.
let docsState = 'docs missing (agent returned nothing)'
let docMinor = []
if (docs) {
  const DOCCHECK = { type: 'object', properties: { issues: { type: 'array', items: { type: 'object', properties: {
    page: { type: 'string' }, problem: { type: 'string' }, severity: { type: 'string', enum: ['blocking', 'minor'] },
  }, required: ['problem', 'severity'] } } }, required: ['issues'] }
  const DOCFIX = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, left: { type: 'array', items: { type: 'string' } } }, required: ['pages'] }
  const checkPrompt = (fixed) => `Review the docs pages touched for "${scope}". Docs report: ${docs}${fixed.length ? `\nPages touched by fixes since: ${JSON.stringify(fixed)}` : ''}\nCheck every one of those pages: one Diataxis kind per page; reference states facts only; titles follow the patterns; pages link to related pages of the other kinds; recorded numbers carry device, backend and build. Give each issue the page, the problem and a severity: blocking when a page mixes kinds, is missing, has a broken link or states a wrong number; minor for wording, a title that could follow the pattern more closely, or a cross-link a reader can do without. Read-only: do not edit anything; return every issue.`
  const text = (i) => (i.page ? `${i.page}: ${i.problem}` : i.problem)
  let fixed = []
  let issues = []
  let checked = false
  for (let round = 1; round <= 3; round++) {
    const c = await agent(checkPrompt(fixed), { schema: DOCCHECK, phase: 'Docs check', label: round === 1 ? 'docs check' : `docs recheck:${round - 1}`, independent: true })
    if (!c) { checked = false; break }
    checked = true
    issues = (c.issues || []).map((i) => (typeof i === 'string' ? { problem: i, severity: 'blocking' } : { severity: 'blocking', ...i }))
    if (!issues.length || round === 3) break
    const fix = await agent(`You are the graphics-programmer. Fix these documentation problems with the smallest edits, touching only the pages they name (add a page only when an issue says one is missing); leave anything that needs a content decision. Commit on the same branch as the work:\n- ${issues.map(text).join('\n- ')}\nReturn pages: every page you edited or added, and left: any issue you did not fix, with why.`, { schema: DOCFIX, phase: 'Docs check', label: `docs fix:${round}` })
    if (!fix) break
    fixed = [...new Set([...fixed, ...(fix.pages || [])])]
  }
  const blocking = issues.filter((i) => i.severity !== 'minor').map(text)
  docMinor = issues.filter((i) => i.severity === 'minor').map(text)
  docsState = !checked ? 'docs unverified (checker returned nothing)'
    : blocking.length ? `docs problems:\n- ${blocking.join('\n- ')}` : 'docs checked'
}
const status = docsState.startsWith('docs problems') || docsState.startsWith('docs missing') ? 'blocked'
  : unverified.length || estimated.length || docsState !== 'docs checked' ? 'unverified' : 'done'
const notes = [
  ...(benchNote ? [benchNote] : []),
  ...(noGpuTiming.length ? [`gpu_timing: unavailable on ${noGpuTiming.join(', ')}; CPU frame time includes the drawable or vsync wait, bound side inferred`] : []),
  ...docMinor.map((d) => `docs check (minor): ${d}`),
]
const benchTable = benchRows.length
  ? `\n\nbenchmark: ${bench.command}\n| target | scene | tier | resolution | device | backend | driver | gpu_timing | p50 ms | p95 ms | p99 ms | worst ms | over budget | measured |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n${benchRows.map((r) => `| ${[r.target, r.scene, r.tier || '', r.resolution || '', r.device, r.backend, r.driver || '', r.gpu_timing, r.p50_ms, r.p95_ms, r.p99_ms, r.worst_ms ?? '', r.frames_over_budget ?? '', r.measured].join(' | ')} |`).join('\n')}`
  : ''
return `${status}\n\n${report}${benchTable}\n\nunverified areas: ${unverified.join(', ') || 'none'}\nestimated, not measured: ${estimated.join(', ') || 'none'}\n${docsState}\nnotes: ${notes.length ? `\n- ${notes.join('\n- ')}` : 'none'}`
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
